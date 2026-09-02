import { readFileSync } from "node:fs";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import IndexPage from "../src/pages/index.astro";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const pixelArrowPath = "M4.8 13.1H13.2V14.5H4.8V13.1ZM4.8 0.5H13.2V1.9H4.8V0.5ZM13.2 1.9H14.6V3.3H13.2V1.9ZM3.4 1.9H4.8V3.3H3.4V1.9ZM3.4 11.7H4.8V13.1H3.4V11.7ZM13.2 11.7H14.6V13.1H13.2V11.7ZM2 3.3H3.4V11.7H2V3.3ZM14.6 3.3H16V11.7H14.6V3.3ZM5.5 8.2H6.9V9.6H5.5V8.2ZM6.9 9.6H11.1V11H6.9V9.6ZM11.1 8.2H12.5V9.6H11.1V8.2ZM6.2 4.7H7.6V6.1H6.2V4.7ZM10.4 4.7H11.8V6.1H10.4V4.7Z";
const featureIconPaths = [
  "M21.6641 38.3385H18.3307V35.0052H21.6641V38.3385ZM18.3307 35.0052H14.9974V31.6719H18.3307V35.0052ZM24.9974 35.0052H21.6641V31.6719H24.9974V35.0052ZM14.9974 31.6719H11.6641V28.3385H14.9974V31.6719ZM21.6641 31.6719H18.3307V26.6719H21.6641V31.6719ZM28.3307 31.6719H24.9974V28.3385H28.3307V31.6719ZM11.6641 28.3385H8.33073V25.0052H11.6641V28.3385ZM31.6641 28.3385H28.3307V25.0052H31.6641V28.3385ZM18.3307 26.6719H14.9974V21.6719H18.3307V26.6719ZM24.9974 26.6719H21.6641V21.6719H24.9974V26.6719ZM8.33073 25.0052H4.9974V21.6719H8.33073V25.0052ZM34.9974 25.0052H31.6641V21.6719H34.9974V25.0052ZM14.9974 15.0052H24.9974V10.0052H28.3307V15.0052H34.9974V11.6719H38.3307V21.6719H34.9974V18.3385H28.3307V21.6719H24.9974V18.3385H14.9974V21.6719H11.6641V18.3385H4.9974V21.6719H1.66406V11.6719H4.9974V15.0052H11.6641V10.0052H14.9974V15.0052ZM8.33073 11.6719H4.9974V8.33854H8.33073V11.6719ZM34.9974 11.6719H31.6641V8.33854H34.9974V11.6719ZM24.9974 10.0052H21.6641V5.00521H18.3307V10.0052H14.9974V5.00521H11.6641V1.67188H28.3307V5.00521H24.9974V10.0052ZM11.6641 8.33854H8.33073V5.00521H11.6641V8.33854ZM31.6641 8.33854H28.3307V5.00521H31.6641V8.33854Z",
  "M13.332 33.3359H23.332V36.6693H9.9987V33.3359H6.66536V30.0026H13.332V33.3359ZM33.332 30.0026H36.6654V33.3359H33.332V36.6693H29.9987V33.3359H26.6654V30.0026H29.9987V26.6693H33.332V30.0026ZM6.66536 30.0026H3.33203V10.0026H6.66536V30.0026ZM23.332 30.0026H13.332V26.6693H23.332V30.0026ZM23.332 23.3359H16.6654V20.0026H23.332V23.3359ZM36.6654 23.3359H33.332V10.0026H36.6654V23.3359ZM16.6654 20.0026H13.332V13.3359H16.6654V20.0026ZM26.6654 20.0026H23.332V13.3359H26.6654V20.0026ZM23.332 13.3359H16.6654V10.0026H23.332V13.3359ZM9.9987 10.0026H6.66536V6.66927H9.9987V10.0026ZM33.332 10.0026H29.9987V6.66927H33.332V10.0026ZM29.9987 6.66927H9.9987V3.33594H29.9987V6.66927Z",
  "M0 5H21.6667V8.33333H0V5ZM0 31.6667H18.3333V35H0V31.6667Z",
  "M18.3333 5H40V8.33333H18.3333V5ZM21.6667 31.6667H40V35H21.6667V31.6667ZM18.3333 8.33333H21.6667V38.3333H18.3333V8.33333ZM0 8.33333H3.33333V31.6667H0V8.33333ZM36.6667 8.33333H40V31.6667H36.6667V8.33333ZM25 11.6667H33.3333V15H25V11.6667ZM25 18.3333H33.3333V21.6667H25V18.3333ZM25 25H28.3333V28.3333H25V25Z",
];

async function renderShell() {
  const container = await AstroContainer.create();
  return container.renderToString(IndexPage);
}

describe("public shell", () => {
  it("renders Spanish landmarks without runtime configuration", async () => {
    const html = await renderShell();

    expect(html).toContain('<html lang="es">');
    expect(html).toContain("La comunidad de<br>builders de Venezuela");
    expect(html).toMatch(/<main\b/);
    expect(html).toContain("Navegación principal");
  });

  it("preserves the live navigation and institutional sections", async () => {
    const html = await renderShell();

    for (const label of ["Comunidad", "Proyectos", "Beneficios", "Talent Network", "Unete"]) {
      expect(html).toContain(label);
    }
    expect(html).toContain("¿QUE HACEMOS?");
    expect(html).toContain("Reunir el talento");
    expect(html).toContain("Dinamizar las relaciones");
    expect(html).toContain("Acelerar el aprendizaje");
    expect(html).toContain("¿Qué es ASILO BUILDER?");
  });

  it("declares dark theme metadata and a static favicon", async () => {
    const html = await renderShell();

    expect(html).toMatch(/<meta\b[^>]*name=["']theme-color["'][^>]*content=["']#000a11["']/);
    expect(html).toMatch(/<link\b[^>]*rel=["']icon["'][^>]*href=["']\/favicon\.svg["']/);
  });

  it("restores the legacy wordmark and pixel-art action arrows", async () => {
    const html = await renderShell();

    expect(html).toMatch(/<img\b[^>]*class=["']brand-mark["'][^>]*src=["']\/logo-asilo-builders\.svg["']/);
    expect((html.match(new RegExp(pixelArrowPath, "g")) ?? []).length).toBe(2);
    expect(html).not.toContain("↗");
  });

  it("restores the three decorative pixel-art feature icons", async () => {
    const html = await renderShell();

    expect((html.match(/class=["']wwd-icon["']/g) ?? []).length).toBe(3);
    expect((html.match(/aria-hidden=["']true["']/g) ?? []).length).toBeGreaterThanOrEqual(4);
    for (const path of featureIconPaths) {
      expect(html).toContain(path);
    }
    expect(html).not.toContain("item-number");
  });

  it("declares the canonical pnpm toolchain and pinned Node types", () => {
    expect(packageJson.packageManager).toBe("pnpm@11.15.1");
    expect(packageJson.devDependencies["@types/node"]).toBe("26.4.0");
  });

  it("keeps every fragment link pointed at a rendered target", async () => {
    const html = await renderShell();
    const fragments = [...html.matchAll(/href=["']#([^"']+)["']/g)].map((match) => match[1]);

    for (const fragment of fragments) {
      expect(html).toContain(`id="${fragment}"`);
    }
  });

  it("renders a decorative ASCII hero canvas and stays clear of Appwrite runtime", async () => {
    const html = await renderShell();

    // SSR must ship the hero background canvas, hidden from assistive tech.
    expect(html).toMatch(/<canvas\b[^>]*\bid="ascii"/);
    expect(html).toMatch(/<canvas\b[^>]*\baria-hidden="true"/);

    // The static shell carries no dropped Appwrite/Supabase runtime and performs
    // no inline fetch; both ASCII islands are pure canvas renderers. A bare SDK
    // reference would surface as a quoted `"appwrite"` / `node-appwrite` import,
    // not as the worktree dirname inside the dev-mode module `src`.
    expect(html).not.toMatch(/node-appwrite/i);
    expect(html).not.toMatch(/["']appwrite["']/i);
    expect(html).not.toMatch(/supabase/i);
    expect(html).not.toMatch(/\bfetch\s*\(/);
  });
});

describe("Proyectos directory (slice 1b-b)", () => {
  it("renders ten placeholder cards with the live copy and CTA", async () => {
    const html = await renderShell();

    expect(html).toContain('class="prj-title">Proyectos<');
    expect((html.match(/class="prj-item"/g) ?? []).length).toBe(10);
    expect((html.match(/Directorio de Builders/g) ?? []).length).toBe(10);
    expect((html.match(/href="#"/g) ?? []).length).toBe(10);
    expect(html).toContain("PROPON TU PROYECTO");
    expect(html).toContain("¿Estás construyendo algo y quieres mostrarlo en público?");
  });

  it("keeps the directory static: no external URLs and no invented image assets", async () => {
    const html = await renderShell();

    expect(html).not.toMatch(/href=["']https?:\/\//);
    expect((html.match(/<img\b/g) ?? []).length).toBe(1);
    expect(html).toContain('src="/logo-asilo-builders.svg"');
  });
});
