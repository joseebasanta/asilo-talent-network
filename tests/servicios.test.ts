import { existsSync, readFileSync } from "node:fs";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import ServiciosPage from "../src/pages/servicios.astro";
import {
  clientLogos,
  CONTACT_EMAIL,
  CTA_HREF,
  CTA_LABEL,
  faqItems,
  faqSection,
  finalCta,
  footer,
  footerLegalLinks,
  footerSocialLinks,
  hero,
  navLinks,
  projects,
  projectsSection,
  serviceTabs,
  servicesSection,
  seo,
  testimonials,
  testimonialsSection,
} from "../src/data/servicios";

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

  it("does not load the v1 styles", async () => {
    const html = await render();

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

    // 71px + 1px de línea inferior = 72px de alto.
    const css = readFileSync(new URL("../src/styles/servicios.css", import.meta.url), "utf8");
    expect(css).toContain("--nav-height: 72px;");
    expect(css).toMatch(/\.s-nav-inner \{[^}]*min-height: calc\(var\(--nav-height\) - 1px\)/);
    // Nav de vidrio: translúcido con desenfoque, y el hero sube por debajo para que se vea la grilla.
    expect(css).toMatch(/\.s-nav \{[^}]*background: color-mix\(in srgb, var\(--color-background\) 50%, transparent\)/);
    expect(css).toMatch(/\.s-nav\[data-scrolled\] \{[^}]*backdrop-filter: blur\(16px\)/);
    expect(css).toContain("margin-top: calc(-1 * var(--nav-height));");
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

  it("renders the projects section with six cards, their images and service tags", async () => {
    const html = await render();
    const start = html.indexOf('<section class="s-projects"');
    const section = html.slice(start, html.indexOf("</section>", start));

    expect(section).toContain('id="trabajo"');
    expect(navLinks.map((l) => l.href)).toContain("#trabajo");
    expect(section).toContain(`<h2 class="s-section-title" id="proyectos-title">${projectsSection.title}</h2>`);
    expect(section).toContain(projectsSection.subtitle);
    expect(section.match(/<li class="s-project">/g)).toHaveLength(6);
    expect(section.match(/<h3\b/g)).toHaveLength(6);

    for (const project of projects) {
      expect(section).toContain(`>${project.name}</h3>`);
      expect(section).toContain(`src="${project.image.src}"`);
      expect(section).toContain(`alt="${project.image.alt}"`);
      expect(existsSync(new URL(`../public${project.image.src}`, import.meta.url))).toBe(true);
      for (const tag of project.tags) expect(section).toContain(`<li class="s-tag s-label-sm">${tag}</li>`);
    }
  });

  it("renders the services section as tabs with the first one open", async () => {
    const html = await render();
    const start = html.indexOf('<section class="s-services"');
    const section = html.slice(start, html.indexOf("</section>", start));

    expect(section).toContain('id="servicios"');
    expect(navLinks.map((l) => l.href)).toContain("#servicios");
    expect(hero.secondaryCta.href).toBe("#servicios");
    expect(section.match(/class="s-section-title-line"/g)).toHaveLength(servicesSection.titleLines.length);
    expect(section).toContain(servicesSection.subtitle);
    expect(section).toContain('role="tablist" aria-label="Servicios" aria-orientation="vertical"');
    expect(section.match(/role="tab"/g)).toHaveLength(4);
    expect(section.match(/role="tabpanel"/g)).toHaveLength(4);
    expect(section.match(/aria-selected="true"/g)).toHaveLength(1);
    expect(section.match(/ hidden[ >]/g)).toHaveLength(3);

    for (const tab of serviceTabs) {
      expect(section).toContain(`id="servicio-tab-${tab.id}" aria-controls="servicio-${tab.id}"`);
      expect(section).toContain(`>${tab.label}</button>`);
      expect(section).toContain(`<h3 class="s-services-panel-title">${tab.title}</h3>`);
      for (const item of tab.items) expect(section).toContain(`<li>${item}</li>`);
    }
  });

  it("renders the testimonials carousel with one visible card, a dot per card and both arrows", async () => {
    const html = await render();
    const start = html.indexOf('<section class="s-testimonials"');
    const section = html.slice(start, html.indexOf("</section>", start));
    const total = testimonials.length;

    expect(section).toContain('id="testimonios"');
    expect(section).toContain('class="s-section-head s-section-head--start"');
    expect(section).toContain(`id="testimonios-title">${testimonialsSection.title}</h2>`);
    expect(section).not.toContain("s-section-lead");
    expect(section.match(/data-slide/g)).toHaveLength(total);
    expect(section.match(/data-slide hidden/g)).toHaveLength(total - 1);
    expect(section).toContain(`aria-label="1 de ${total}"`);
    expect(section.match(/data-dot/g)).toHaveLength(total);
    expect(section.match(/aria-current="true"/g)).toHaveLength(1);
    expect(section).toContain('aria-label="Testimonio anterior"');
    expect(section).toContain('aria-label="Siguiente testimonio"');
    expect(section).toContain(`“${testimonials[0].quote}”`);
    expect(section).toContain(testimonials[0].name);
    expect(section).toContain(testimonials[0].role);

    for (const asset of [
      "/servicios/icons/arrow-back.svg",
      "/servicios/icons/arrow-forward.svg",
      ...testimonials.flatMap((t) => [t.avatar, t.logo?.src ?? ""]).filter(Boolean),
    ]) {
      expect(existsSync(new URL(`../public${asset}`, import.meta.url))).toBe(true);
    }
  });

  it("renders the FAQ as native accordions with the first one open and the contact card", async () => {
    const html = await render();
    const start = html.indexOf('<section class="s-faq"');
    const section = html.slice(start, html.indexOf("</section>", start));

    expect(section).toContain('id="preguntas"');
    expect(section).toContain(`<p class="s-section-tagline s-subheading-sm">${faqSection.tagline}</p>`);
    expect(section).toContain(`id="preguntas-title">${faqSection.title}</h2>`);
    expect(section.match(/<details class="s-faq-item"/g)).toHaveLength(faqItems.length);
    expect(section.match(/<details class="s-faq-item" open>/g)).toHaveLength(1);
    for (const item of faqItems) {
      expect(section).toContain(`<span>${item.question}</span>`);
      expect(section).toContain(item.answer);
    }
    expect(section).not.toContain("Respuesta por definir");
    expect(section).not.toContain("Asilo Labs");

    expect(section).toContain(`<h3 class="s-faq-card-title s-title-h6" id="faq-card-title">${faqSection.card.title}</h3>`);
    expect(section).toContain(`href="${CTA_HREF}">${CTA_LABEL}</a>`);
    expect(section).toContain(`href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>`);
    expect(section).not.toContain("designme");
    for (const asset of [faqSection.card.avatar, "/servicios/icons/close.svg"]) {
      expect(existsSync(new URL(`../public${asset}`, import.meta.url))).toBe(true);
    }
  });

  it("renders the final CTA with the WhatsApp button and every nav anchor has its section", async () => {
    const html = await render();
    const start = html.indexOf('<section class="s-cta"');
    const section = html.slice(start, html.indexOf("</section>", start));

    expect(section).toContain('id="contacto"');
    expect(section).toContain(`<h2 class="s-section-title" id="contacto-title">${finalCta.title}</h2>`);
    expect(section).toContain(finalCta.subtitle);
    expect(section).toContain(`<a class="s-btn s-btn--lg s-btn--primary s-label-md" href="${CTA_HREF}">${CTA_LABEL}</a>`);
    for (const link of navLinks) expect(html).toContain(`id="${link.href.slice(1)}"`);
  });

  it("renders the footer after main with the logo, social links and copyright", async () => {
    const html = await render();
    const start = html.indexOf('<footer class="s-footer">');
    const section = html.slice(start, html.indexOf("</footer>", start));

    expect(start).toBeGreaterThan(html.indexOf("</main>"));
    expect(section).toContain('src="/logo-asilo-digital-white.svg"');
    expect(section).toContain('aria-label="Redes sociales"');
    expect(footerSocialLinks.map((l) => l.icon)).toEqual(["instagram", "x", "linkedin"]);
    for (const link of footerSocialLinks) {
      expect(section).toContain(`href="${link.href}" target="_blank" rel="noopener noreferrer" aria-label="Asilo Digital en ${link.label}"`);
      expect(existsSync(new URL(`../public/servicios/icons/${link.icon}.svg`, import.meta.url))).toBe(true);
    }
    expect(section).toContain(`<p>${footer.copyright}</p>`);
    expect(footer.copyright).toMatch(/^© \d{4} Asilo Digital\. Todos los derechos reservados$/);
    // Sin páginas legales todavía: no se publican links vacíos.
    expect(footerLegalLinks).toHaveLength(0);
    expect(section).not.toContain('href="#"');
  });

  it("renders the client logo strip inside the hero with a single announced copy", async () => {
    const html = await render();
    const start = html.indexOf('<section class="s-hero"');
    const hero = html.slice(start, html.indexOf("</section>", start));

    expect(hero).toContain('<div class="s-logos">');
    expect(hero.match(/<ul class="s-logos-set"/g)).toHaveLength(4);
    expect(hero.match(/aria-label="Clientes"/g)).toHaveLength(1);
    const strip = hero.slice(hero.indexOf('<div class="s-logos">'));
    expect(strip.match(/aria-hidden="true"/g)).toHaveLength(3);
    expect(hero.match(/<li class="s-logos-item">/g)).toHaveLength(clientLogos.length * 4);
    for (const logo of clientLogos) {
      expect(hero).toContain(`alt="${logo.alt}"`);
      expect(existsSync(new URL(`../public${logo.src}`, import.meta.url))).toBe(true);
    }
    expect(hero).not.toMatch(/webflow|relume/i);

    const css = readFileSync(new URL("../src/styles/servicios.css", import.meta.url), "utf8");
    expect(css).toContain("animation: s-logos-scroll 80s linear infinite");
    expect(css).toContain("mask-image: linear-gradient(90deg, transparent, #000 20%, #000 80%, transparent)");
    expect(css).toContain("mask-image: linear-gradient(90deg, transparent 15%, #000 35%, #000 65%, transparent 85%)");
  });

  it("draws the pixel background and entrance behind a solid white hero title without third-party copy", async () => {
    const html = await render();
    const start = html.indexOf('<section class="s-hero"');
    const hero = html.slice(start, html.indexOf("</section>", start));

    expect(hero).toContain('<div class="s-hero-bg" aria-hidden="true">');
    expect(hero).toContain("data-hero-pixels");
    expect(hero).toContain('<div class="s-hero-vignette"></div>');
    expect(hero.indexOf("s-hero-bg")).toBeLessThan(hero.indexOf("s-hero-inner"));
    expect(hero).not.toContain("s-hline");
    expect(html).not.toMatch(/silent precision|explore design|github\.com"/i);

    const css = readFileSync(new URL("../src/styles/servicios.css", import.meta.url), "utf8");
    expect(css).toMatch(/\.s-hero-bg \{[^}]*z-index: -1/);
    expect(css).toContain("--pixel-accent: var(--color-blue-500);");
    // El título va en blanco sólido, sin el efecto de vidrio del componente original.
    expect(css).not.toContain("s-glass-shimmer");
    expect(css).not.toContain("background-clip: text");
    expect(css).toContain(".s-hero-actions, .s-hero .s-logos { animation: none; }");
    // Halo y sombra del color de fondo para separar el texto de la grilla.
    expect(css).toMatch(/\.s-hero-text::before \{[^}]*radial-gradient/);
    expect(css).toContain(".s-hero-title { text-shadow: 0 0 32px var(--color-background), 0 0 12px var(--color-background); }");
    expect(css).toMatch(/\.s-hero-lead \{[^}]*text-shadow: 0 0 16px var\(--color-background\)/);
  });
});
