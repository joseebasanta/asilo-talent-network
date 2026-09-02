import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import IndexPage from "../src/pages/index.astro";

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
    expect(html).not.toMatch(/<img\b/);
  });
});
