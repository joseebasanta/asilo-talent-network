import { existsSync, readFileSync } from "node:fs";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import ServiciosPage from "../src/pages/servicios.astro";
import { CTA_HREF, CTA_LABEL, hero, navLinks, seo } from "../src/data/servicios";

const SITE = "https://builders.asilodigital.com";

async function render() {
  const container = await AstroContainer.create();
  return container.renderToString(ServiciosPage);
}

// La v2 se construye sección por sección; cada sección nueva agrega aquí sus tests.
// Los tests de la v1 quedaron en la rama landing-page-v1-2026-10-28.
describe("landing de servicios v2", () => {
  it("renders the base page in Spanish with a main landmark and a skip link", async () => {
    const html = await render();

    expect(html).toContain('<html lang="es">');
    expect(html).toContain('<body class="servicios">');
    expect(html).toContain('<a class="s-skip" href="#contenido">Saltar al contenido</a>');
    expect(html).toContain('<main id="contenido">');
  });

  it("keeps the SEO head of the landing", async () => {
    const html = await render();

    expect(html).toContain(`<title>${seo.title}</title>`);
    expect(html).toContain(`<link rel="canonical" href="${SITE}/servicios">`);
    expect(html).toContain('<meta property="og:site_name" content="Asilo Digital">');
    expect(html).toContain(`<meta property="og:image" content="${SITE}/og-servicios.png">`);
  });

  it("does not render any v1 section", async () => {
    const html = await render();

    // Las secciones de la v1 que todavía no tienen reemplazo en la v2.
    for (const id of ["servicios", "testimonios", "preguntas", "contacto"]) {
      expect(html).not.toContain(`id="${id}"`);
    }
    expect(html).not.toContain("landing.css");
  });

  it("declares PP Frama, PP Frama Text and Geist with files that exist", () => {
    const css = readFileSync(new URL("../src/styles/fonts.css", import.meta.url), "utf8");
    for (const family of ["PP Frama", "PP Frama Text", "Geist Sans", "Geist Mono"]) {
      expect(css).toContain(`font-family: "${family}";`);
    }
    const files = [...css.matchAll(/url\("(\/fonts\/[^"]+)"\)/g)].map((m) => m[1]!);
    expect(files.length).toBeGreaterThanOrEqual(23);
    for (const file of files) expect(existsSync(new URL(`../public${file}`, import.meta.url)), file).toBe(true);
  });

  it("defines a text token and class for each Figma text style", () => {
    const css = readFileSync(new URL("../src/styles/servicios.css", import.meta.url), "utf8");
    // Una muestra por grupo: tamaño en rem, line height como multiplicador (120 % = 1.2), tracking en em.
    expect(css).toContain("--text-title-h1: 500 3.5rem/1.2 var(--font-frama);");
    expect(css).toContain("--text-title-h4: 500 2rem/1.3 var(--font-frama);");
    expect(css).toContain("--text-title-h6: 500 1.25rem/1.4 var(--font-frama);");
    expect(css).toContain("--text-title-h1-tracking: -0.01em;");
    expect(css).toContain("--text-label-lg: 500 1.125rem/1.5 var(--font-sans);");
    expect(css).toContain("--text-paragraph-md: 400 1rem/1.5 var(--font-sans);");
    expect(css).toContain("--text-subheading-2xs: 500 0.6875rem/1.1 var(--font-sans);");
    expect(css).toContain("--text-docs-paragraph: 400 1.125rem/1.75 var(--font-sans);");
    expect(css).toContain("--text-subheading-2xs-tracking: 0.02em;");
    const classes = [...css.matchAll(/^\.s-([a-z0-9-]+) \{ font: var\(--text-\1\);/gm)].map((m) => m[1]);
    expect(classes).toHaveLength(22);
    expect(css).toMatch(/\.s-subheading-md \{[^}]*text-transform: uppercase;/);
  });

  it("defines the Figma color scale and uses it for the page base", async () => {
    const css = readFileSync(new URL("../src/styles/servicios.css", import.meta.url), "utf8");
    expect(css).toContain("--color-background: #0f0f0f;");
    expect(css).toContain("--color-grey-550: #707070;");
    expect(css).toContain("--color-blue-500: #0066ff;");
    expect(css).toContain("--color-blue: var(--color-blue-500);");
    // Fondo, blanco, negro, 12 grises y 11 azules.
    expect(css.match(/^  --color-(?:background|black|white|grey-\d+|blue-\d+): #[0-9a-f]{6};/gm)).toHaveLength(26);
    expect(css).toContain("background: var(--color-background);");
    expect(await render()).toMatch(/<meta\b[^>]*name="theme-color"[^>]*content="#0f0f0f"/);
  });

  it("renders the nav with logo, centered section links and the WhatsApp CTA", async () => {
    const html = await render();
    const nav = html.slice(html.indexOf('<header class="s-nav">'), html.indexOf("</header>"));

    expect(nav).toContain('src="/logo-asilo-digital-white.svg"');
    expect(nav).toContain('aria-label="Asilo Digital, ir al inicio"');
    expect(nav).toContain('aria-label="Navegación principal"');
    expect(navLinks.map((l) => l.label)).toEqual(["Servicios", "Nuestro trabajo", "Contacto"]);
    for (const link of navLinks) expect(nav).toContain(`href="${link.href}">${link.label}</a>`);
    expect(CTA_LABEL).toBe("Contáctanos");
    expect(nav).toContain(`href="${CTA_HREF}">${CTA_LABEL}</a>`);
    expect(CTA_HREF).toMatch(/^https:\/\/wa\.me\/584126310981\?text=/);
    expect(existsSync(new URL("../public/logo-asilo-digital-white.svg", import.meta.url))).toBe(true);
  });

  it("renders the hero with a single h1, the subtitle and both CTAs", async () => {
    const html = await render();
    const section = html.slice(html.indexOf('<section class="s-hero"'), html.indexOf("</section>"));

    expect(html.match(/<h1\b/g)).toHaveLength(1);
    const titleStart = section.indexOf('id="hero-title">') + 'id="hero-title">'.length;
    const title = section.slice(titleStart, section.indexOf("</h1>")).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    expect(title).toBe(hero.titleLines.join(" "));
    expect(section.match(/class="s-hero-title-line"/g)).toHaveLength(2);
    expect(section).toContain(hero.subtitle);
    expect(section).toContain(`href="${CTA_HREF}">${CTA_LABEL}</a>`);
    expect(section).toContain('href="#servicios">Ver servicios</a>');
  });
});
