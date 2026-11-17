import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const isolatedWorkspaces: string[] = [];

function copyProjectInputsToIsolation() {
  const workspace = mkdtempSync(join(tmpdir(), "asilo-sitemap-workspace-"));
  isolatedWorkspaces.push(workspace);
  const copyTree = (name: string) =>
    cpSync(join(projectRoot, name), join(workspace, name), {
      recursive: true,
      filter: (source) => !basename(source).startsWith(".env"),
    });

  for (const file of ["astro.config.mjs", "package.json", "pnpm-lock.yaml", "tsconfig.json"]) {
    cpSync(join(projectRoot, file), join(workspace, file));
  }
  for (const directory of ["src", "public"]) copyTree(directory);
  symlinkSync(join(projectRoot, "node_modules"), join(workspace, "node_modules"), "dir");

  expect(existsSync(join(workspace, "dist"))).toBe(false);
  expect(existsSync(join(workspace, ".vercel"))).toBe(false);
  expect(existsSync(join(workspace, ".env"))).toBe(false);
  expect(existsSync(join(workspace, ".env.local"))).toBe(false);

  return workspace;
}

function buildSitemapInIsolation() {
  const workspace = copyProjectInputsToIsolation();
  const outputDirectory = join(workspace, "dist");
  const sitemapPath = join(outputDirectory, "client", "sitemap-0.xml");
  const rootVercelOutput = join(projectRoot, ".vercel", "output");
  const rootVercelOutputWasPresent = existsSync(rootVercelOutput);

  expect(existsSync(sitemapPath)).toBe(false);
  try {
    execFileSync(process.execPath, [join(projectRoot, "node_modules", "astro", "bin", "astro.mjs"), "build", "--outDir", outputDirectory], {
      cwd: workspace,
      env: {
        PATH: process.env.PATH,
        HOME: process.env.HOME,
        NODE_ENV: "production",
      },
      stdio: "pipe",
    });
  } catch (error) {
    const output =
      error instanceof Error && "stdout" in error
        ? `${String(error.stdout)}${"stderr" in error ? String(error.stderr) : ""}`
        : String(error);
    throw new Error(`isolated Astro build failed:\n${output}`);
  }

  expect(existsSync(join(workspace, ".vercel", "output"))).toBe(true);
  expect(existsSync(rootVercelOutput)).toBe(rootVercelOutputWasPresent);
  return readFileSync(sitemapPath, "utf8");
}

function sitemapUrls(sitemap: string) {
  return [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

afterEach(() => {
  while (isolatedWorkspaces.length > 0) {
    const workspace = isolatedWorkspaces.pop();
    if (workspace) rmSync(workspace, { recursive: true, force: true });
  }
});

describe("production sitemap", () => {
  it("excludes the development-only accounts demo while preserving release URLs", () => {
    expect(sitemapUrls(buildSitemapInIsolation())).toEqual([
      "https://builders.asilodigital.com/",
      "https://builders.asilodigital.com/partials/proyectos",
      "https://builders.asilodigital.com/proyectos",
      "https://builders.asilodigital.com/recursos",
    ]);
  }, 120_000);
});
