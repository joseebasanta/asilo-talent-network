import { readFileSync } from "node:fs";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import { projects as placeholderProjects } from "../src/data/projects";
import IndexPage from "../src/pages/index.astro";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const pixelArrowPath = "M4.8 13.1H13.2V14.5H4.8V13.1ZM4.8 0.5H13.2V1.9H4.8V0.5ZM13.2 1.9H14.6V3.3H13.2V1.9ZM3.4 1.9H4.8V3.3H3.4V1.9ZM3.4 11.7H4.8V13.1H3.4V11.7ZM13.2 11.7H14.6V13.1H13.2V11.7ZM2 3.3H3.4V11.7H2V3.3ZM14.6 3.3H16V11.7H14.6V3.3ZM5.5 8.2H6.9V9.6H5.5V8.2ZM6.9 9.6H11.1V11H6.9V9.6ZM11.1 8.2H12.5V9.6H11.1V8.2ZM6.2 4.7H7.6V6.1H6.2V4.7ZM10.4 4.7H11.8V6.1H10.4V4.7Z";

async function renderShell() {
  const container = await AstroContainer.create();
  return container.renderToString(IndexPage);
}

describe("public shell", () => {
  it("renders Spanish landmarks without runtime configuration", async () => {
    const html = await renderShell();

    expect(html).toContain('<html lang="es">');
    expect(html).toContain("La comunidad de<br><em>builders</em> de Venezuela");
    expect(html).toContain('class="hero-eyebrow-count">+180</span>');
    expect(html).toMatch(/<main\b/);
    expect(html).toContain("Navegación principal");
  });

  it("preserves the live navigation and institutional sections", async () => {
    const html = await renderShell();

    for (const label of ["Proyectos", "Recursos", "Registrarme"]) {
      expect(html).toContain(label);
    }
    // The "¿Qué hacemos?" and "¿Qué es Asilo Builders?" sections were removed from the design.
    expect(html).not.toContain("¿Qué hacemos?");
    expect(html).not.toContain("Reunir el talento");
    expect(html).not.toContain("Sobre nosotros");
  });

  it("declares dark theme metadata and a static favicon", async () => {
    const html = await renderShell();

    expect(html).toMatch(/<meta\b[^>]*name=["']theme-color["'][^>]*content=["']#0f1011["']/);
    expect(html).toMatch(/<link\b[^>]*rel=["']icon["'][^>]*href=["']\/favicon\.svg\?v=20260911["']/);
  });

  it("does not render an analytics consent banner", async () => {
    const html = await renderShell();

    expect(html).not.toContain('id="analytics-consent"');
  });

  it("renders the logo mark with the Builders wordmark and pixel-art action arrows", async () => {
    const html = await renderShell();

    expect(html).toMatch(/<img\b[^>]*class=["']brand-mark["'][^>]*src=["']\/logo-mark\.png["']/);
    expect(html).toMatch(/<span class=["']brand-name["']>Builders<\/span>/);
    // Header "Registrarme" (desktop) + mobile menu "Registrarme" + two in-page CTAs.
    expect((html.match(new RegExp(pixelArrowPath, "g")) ?? []).length).toBe(4);
    expect(html).not.toContain("↗");
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
  it("renders the original placeholder projects with the directory CTA", async () => {
    const html = await renderShell();

    expect(html).toContain('class="prj-title" data-decode>Proyectos');
    expect((html.match(/class="prj-item"/g) ?? []).length).toBe(placeholderProjects.length);
    expect(html).toContain("Directorio de Builders");
    expect(html).toContain("Por Carlos Mendoza");
    expect((html.match(/<a\b[^>]*class=["']prj-item["'][^>]*href="#"/g) ?? []).length).toBe(placeholderProjects.length);
    expect(html).toContain("AGREGA TU PROYECTO");
    expect(html).toContain("¿Eres parte de la comunidad y quieres sumarte al directorio?");
  });

  it("keeps project links local while using the Asilo Digital brand link", async () => {
    const html = await renderShell();

    expect((html.match(/href=["']https:\/\/www\.asilodigital\.com\/["']/g) ?? []).length).toBe(2);
    const socialUrls = [
      "https://www.instagram.com/asilodigitalcom/",
      "https://x.com/asilodigital",
      "https://www.linkedin.com/company/asilodigital/",
    ];
    for (const url of socialUrls) {
      expect(html).toContain(`href="${url}" target="_blank" rel="noopener noreferrer"`);
    }
    const externalLinks = Array.from(html.matchAll(/href=["'](https?:\/\/[^"']+)["']/g), (match) => match[1]);
    expect(externalLinks.sort()).toEqual([
      "https://builders.asilodigital.com/",
      "https://www.asilodigital.com/",
      "https://www.asilodigital.com/",
      ...socialUrls,
    ].sort());
    // Shared shell and form images, plus one local icon per placeholder project.
    expect((html.match(/<img\b/g) ?? []).length).toBe(placeholderProjects.length + 7);
    expect((html.match(/class="prj-placeholder"/g) ?? []).length).toBe(placeholderProjects.length);
    expect(html).toContain('src="/logo-mark.png"');
  });
});

describe("CTA heading", () => {
  it("keeps decode text plain and lets mobile CSS control its two-line wrap", () => {
    const page = readFileSync(new URL("../src/pages/index.astro", import.meta.url), "utf8");
    const styles = readFileSync(new URL("../src/styles/global.css", import.meta.url), "utf8");

    expect(page).toContain('data-decode>Deja de construir solo</h2>');
    expect(page).not.toContain("cta-title-mobile-break");
    expect(styles).toContain(".cta-title { max-width: 16ch; margin-inline: auto; }");
  });

  it("invites visitors to join the community", async () => {
    const html = await renderShell();
    const cta = html.slice(html.indexOf('id="unete-cta"'));
    const button = cta.slice(cta.indexOf("button-primary"), cta.indexOf("</a>"));

    expect(button).toContain("Únete a la comunidad");
    expect(html).not.toContain("Llenar formulario");
  });

  it("spells every visible join label with an accent", async () => {
    const text = (await renderShell()).replace(/<[^>]+>/g, " ");

    expect(text).not.toMatch(/\bUnete\b/i);
    expect(text).toMatch(/Únete a la comunidad/);
  });
});
