import { existsSync, readFileSync } from "node:fs";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import ServiciosPage from "../src/pages/servicios.astro";
import { CTA_HREF, faq, hero, projects, services, testimonials } from "../src/data/landing";

const SITE = "https://builders.asilodigital.com";

async function render() {
  const container = await AstroContainer.create();
  return container.renderToString(ServiciosPage);
}

function anchorsWithText(html: string, text: string): string[] {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)]
    .filter(([, , inner]) => inner.replace(/<[^>]+>/g, "").trim() === text)
    .map(([, attrs]) => attrs.match(/href="([^"]*)"/)?.[1] ?? "");
}

describe("landing de servicios", () => {
  it("renders a Spanish page with a single h1 for the hero", async () => {
    const html = await render();

    expect(html).toContain('<html lang="es">');
    expect(html).toMatch(/<main\b/);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain("Hacemos que tu app se entienda.");
    expect(html).toContain("Diagnosticamos tu UX, rediseñamos tu producto con identidad propia y lo llevamos a producción.");
  });

  it("renders the sections in order with their anchors", async () => {
    const html = await render();
    const ids = ["inicio", "servicios", "testimonios", "preguntas", "contacto"];
    const positions = ids.map((id) => html.indexOf(`id="${id}"`));

    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    for (const headline of [
      "Tres formas de trabajar juntos.",
      "Lo que dicen los equipos con los que trabajamos.",
      "Preguntas frecuentes.",
      "Hagamos que tu app se entienda.",
    ]) {
      expect(html).toContain(headline);
    }
  });

  it("points every primary CTA to WhatsApp with the exact label", async () => {
    const html = await render();
    const ctas = anchorsWithText(html, "Contáctanos");

    // Nav, hero, un link por servicio, tarjeta de la FAQ y CTA final.
    expect(ctas.length).toBe(4 + services.length);
    expect(new Set(ctas)).toEqual(new Set([CTA_HREF]));
    expect(CTA_HREF).toMatch(/^https:\/\/wa\.me\/584126310981\?text=/);
    expect(anchorsWithText(html, "Ver servicios")).toEqual(["#servicios"]);
  });

  it("renders the services as an exclusive accordion with only the first item open", async () => {
    const html = await render();
    const section = html.slice(html.indexOf('id="servicios"'), html.indexOf('id="testimonios"'));
    const details = section.match(/<details\b[^>]*>/g) ?? [];

    expect(details).toHaveLength(services.length);
    expect(details.every((tag) => tag.includes('name="servicios"'))).toBe(true);
    expect(details[0]).toMatch(/\bopen\b/);
    expect(details.slice(1).some((tag) => /\bopen\b/.test(tag))).toBe(false);

    for (const service of services) {
      expect(section).toContain(`${service.hook} ${service.detail}`);
      expect(section).toContain(`src="${service.image.src}"`);
      for (const item of service.includes) expect(section).toContain(`<li>${item}</li>`);
    }
    // Cada servicio cierra con el CTA del sitio.
    expect(anchorsWithText(section, "Contáctanos")).toEqual(services.map(() => CTA_HREF));
  });

  it("renders the projects grid in the hero and the testimonials without team cards", async () => {
    const html = await render();
    const hero = html.slice(html.indexOf('id="inicio"'), html.indexOf('id="servicios"'));

    expect(projects.map((p) => p.name)).toEqual(["Olímpica App", "Tillín", "Gama", "Diners Club Mall App", "Mattelsa", "Corona App"]);
    expect(hero.match(/class="l-project"/g)).toHaveLength(projects.length);
    for (const project of projects) {
      expect(hero).toContain(project.name);
      expect(hero).toContain(project.year);
      expect(hero).toContain(project.tags);
    }
    expect(hero).toContain("data-kinetic-grid");
    expect(hero).toContain("data-kinetic-canvas");
    expect(html).not.toContain('id="proceso"');
    expect(html).not.toContain('id="trabajo"');
    expect(html).not.toContain('id="nosotros"');
    expect(html).not.toContain('href="#nosotros"');
    expect(html.match(/<blockquote\b/g)).toHaveLength(testimonials.items.length);
    expect(html).toContain("data-stagger");
    expect(html).toContain('aria-label="Testimonio anterior"');
    expect(html).toContain('aria-label="Testimonio siguiente"');
    expect(html).not.toContain("l-member");
  });

  it("renders the FAQ as independent accordion items next to a contact card", async () => {
    const html = await render();
    const section = html.slice(html.indexOf('id="preguntas"'), html.indexOf('id="contacto"'));
    const items = section.match(/<details\b[^>]*>/g) ?? [];

    expect(items).toHaveLength(faq.items.length);
    // Las preguntas se abren de forma independiente y empiezan cerradas.
    expect(items.some((tag) => /\bname=|\bopen\b/.test(tag))).toBe(false);
    for (const item of faq.items) {
      expect(section).toContain(item.question);
      expect(section).toContain(item.answer);
    }
    expect(section).toContain("¿No encuentras tu respuesta?");
    expect(anchorsWithText(section, "Contáctanos")).toEqual([CTA_HREF]);
    expect(section).toContain('href="mailto:hola@asilodigital.com"');
  });

  it("keeps the footer links and contact email", async () => {
    const html = await render();

    expect(html).toContain("La comunidad de los ciudadanos de internet");
    expect(html).toContain('href="mailto:hola@asilodigital.com"');
    for (const label of ["Telegram", "X", "Instagram", "LinkedIn"]) {
      expect(html).toContain(`aria-label="${label} (se abre en otra pestaña)"`);
    }
    expect(anchorsWithText(html, "Privacidad")).toHaveLength(1);
    expect(anchorsWithText(html, "Términos")).toHaveLength(1);
  });

  it("has its own SEO head and dark theme without the community styles", async () => {
    const html = await render();

    expect(html).toContain("<title>Asilo Digital — Diseño de producto que se entiende</title>");
    expect(html).toContain(`<link rel="canonical" href="${SITE}/servicios">`);
    expect(html).toContain('<meta property="og:site_name" content="Asilo Digital">');
    expect(html).toContain(`<meta property="og:image" content="${SITE}/og-servicios.png">`);
    expect(html).toMatch(/<meta\b[^>]*name="theme-color"[^>]*content="#161618"/);
    expect(html).not.toContain("#000a11");
  });

  it("references placeholder assets that exist in public/", () => {
    const paths = [
      ...hero.avatars,
      ...hero.clientLogos.map((logo) => logo.src),
      ...projects.map((project) => project.image.src),
      ...services.map((service) => service.image.src),
      ...testimonials.items.map((item) => item.avatar),
      faq.card.avatar,
      "/og-servicios.png",
      "/logo-asilo-digital.svg",
      "/fonts/geist-sans.woff2",
      "/fonts/geist-mono.woff2",
    ];

    for (const path of paths) {
      expect(existsSync(new URL(`../public${path}`, import.meta.url)), path).toBe(true);
    }
    expect(readFileSync(new URL("../src/styles/fonts.css", import.meta.url), "utf8")).toContain("Geist Sans");
  });
});
