import { readFileSync, existsSync } from "node:fs";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import IndexPage from "../src/pages/index.astro";
import ProyectosPage from "../src/pages/proyectos.astro";
import NotFoundPage from "../src/pages/404.astro";

const SITE = "https://builders.asilodigital.com";

async function render(component: any, request?: Request) {
  const container = await AstroContainer.create();
  return container.renderToString(component, request ? { request } : {});
}

function ogImageSize(path: string | URL): { width: number; height: number } {
  const bytes = readFileSync(path);
  // PNG magic + IHDR dimensions at offsets 16/20 (big-endian uint32).
  expect(bytes.subarray(0, 8)).toEqual(
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  );
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

describe("production SEO config", () => {
  it("declares the production site and the sitemap integration", () => {
    const config = readFileSync(new URL("../astro.config.mjs", import.meta.url), "utf8");
    expect(config).toContain(`site: "${SITE}"`);
    expect(config).toMatch(/@astrojs\/sitemap/);
    expect(config).toMatch(/integrations:\s*\[sitemap\(\)\]/);

    const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    expect(packageJson.dependencies["@astrojs/sitemap"]).toBeTruthy();
  });
});

describe("home SEO head", () => {
  it("has a distinct title, description, canonical, and OG/Twitter tags", async () => {
    const html = await render(IndexPage);

    expect(html).toContain(`<title>Asilo Builders — La comunidad de builders de Venezuela</title>`);
    expect(html).toMatch(
      /<meta\b[^>]*name=["']description["'][^>]*content=["']La comunidad de builders de Venezuela/,
    );
    expect(html).toContain(`<link rel="canonical" href="${SITE}/"`);
    expect(html).toContain(`<meta property="og:url" content="${SITE}/"`);
    expect(html).toContain(`<meta property="og:image" content="${SITE}/og-image.png"`);
    expect(html).toContain(`<meta property="og:image:width" content="1200"`);
    expect(html).toContain(`<meta property="og:image:height" content="630"`);
    expect(html).toContain(`<meta name="twitter:card" content="summary_large_image"`);
    expect(html).toContain(`<meta name="twitter:image" content="${SITE}/og-image.png"`);
    expect(html).not.toContain("noindex");
  });
});

describe("proyectos SEO head", () => {
  it("has its own title, description, and canonical URL", async () => {
    const html = await render(
      ProyectosPage,
      new Request("https://example.com/proyectos?q=ai&pagina=2"),
    );

    expect(html).toContain(`<title>Proyectos | Asilo Builders</title>`);
    expect(html).toMatch(
      /<meta\b[^>]*name=["']description["'][^>]*content=["']Explora los proyectos de Asilo Builders/,
    );
    // Filtered/paginated query strings never leak into the canonical URL.
    expect(html).toContain(`<link rel="canonical" href="${SITE}/proyectos"`);
    expect(html).toContain(`<meta property="og:url" content="${SITE}/proyectos"`);
    expect(html).toContain(`<meta property="og:image" content="${SITE}/og-image.png"`);
    expect(html).toContain(`<meta name="twitter:card" content="summary_large_image"`);
  });
});

describe("custom 404", () => {
  it("renders the site shell in Spanish with noindex and recovery links", async () => {
    const html = await render(NotFoundPage);

    expect(html).toContain('<html lang="es">');
    expect(html).toContain(`<title>Página no encontrada | Asilo Builders</title>`);
    expect(html).toMatch(/<meta\b[^>]*name=["']robots["'][^>]*content=["']noindex,\s*nofollow["']/);
    expect(html).toContain("Página no encontrada");
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/proyectos"');
    expect(html).toContain("Navegación principal");
    expect(html).toContain("<main");
  });
});

describe("static crawl files", () => {
  it("serves a robots.txt that allows crawling and points at the sitemap", () => {
    const robots = readFileSync(new URL("../public/robots.txt", import.meta.url), "utf8");
    expect(robots).toMatch(/^User-agent: \*/m);
    expect(robots).toContain("Allow: /");
    expect(robots).toContain(`Sitemap: ${SITE}/sitemap-index.xml`);
  });

  it("serves an llms.txt describing the site and its pages", () => {
    const llms = readFileSync(new URL("../public/llms.txt", import.meta.url), "utf8");
    expect(llms).toContain(SITE);
    expect(llms).toContain(`${SITE}/proyectos`);
  });

  it("ships a real 1200x630 homepage capture as the OG image", () => {
    const path = new URL("../public/og-image.png", import.meta.url);
    expect(existsSync(path)).toBe(true);
    expect(ogImageSize(path)).toEqual({ width: 1200, height: 630 });
  });
});
