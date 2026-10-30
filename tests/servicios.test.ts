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
    // Fondo, blanco, negro, 14 grises (12 de Figma + grey-1000 y grey-975) y 11 azules.
    expect(css.match(/^  --color-(?:background|black|white|grey-\d+|blue-\d+): #[0-9a-f]{6};/gm)).toHaveLength(28);
    expect(css).toContain("--color-grey-1000: #121212;");
    expect(css).toContain("--color-grey-975: #121212;");
    expect(css).toContain("background: var(--surface-page);");
    expect(await render()).toMatch(/<meta\b[^>]*name="theme-color"[^>]*content="#0f0f0f"/);
  });

  it("maps semantic theme tokens to the dark scale and redefines them for light mode", async () => {
    const css = readFileSync(new URL("../src/styles/servicios.css", import.meta.url), "utf8");
    // Modo oscuro (por defecto): los mismos valores que la v2 tenía antes del modo claro.
    expect(css).toContain("--surface-page: var(--color-background);");
    expect(css).toContain("--surface-card: var(--color-grey-1000);");
    expect(css).toContain("--fg-strong: var(--color-white);");
    expect(css).toContain("--border-subtle: var(--color-grey-800);");
    const light = css.slice(css.indexOf('html[data-theme="light"] body.servicios {'));
    expect(light.length).toBeLessThan(css.length);
    const lightBlock = light.slice(0, light.indexOf("\n}"));
    expect(lightBlock).toContain("--surface-page: var(--color-grey-50);");
    expect(lightBlock).toContain("--surface-card: var(--color-white);");
    expect(lightBlock).toContain("--fg-strong: var(--color-grey-950);");
    expect(lightBlock).toContain("--fg-muted: var(--color-grey-550);");
    expect(css).toContain('html[data-theme="light"]:has(body.servicios) { color-scheme: light; background: #f7f7f7; }');
    // Fuera de los bloques de tokens, los componentes no usan blancos ni grises directos (solo botones de marca,
    // el relleno azul de la pestaña y el gris de la grilla del hero).
    const components = css.slice(css.indexOf("/* Botones */"));
    const direct = components.match(/var\(--color-(?:white|grey-\d+|background)\)/g) ?? [];
    expect(direct.length).toBeLessThanOrEqual(6);

    // Script inline en <head> que aplica el tema guardado antes de pintar.
    const html = await render();
    const head = html.slice(0, html.indexOf("</head>"));
    expect(head).toContain('localStorage.getItem("asilo-theme") === "light"');
    expect(head).toContain('document.documentElement.dataset.theme = "light"');
    expect(head.indexOf('name="theme-color"')).toBeLessThan(head.indexOf("asilo-theme"));
  });

  it("renders the nav with logo, centered section links and the contact form CTA", async () => {
    const html = await render();

    // 71px + 1px de línea inferior = 72px de alto.
    const css = readFileSync(new URL("../src/styles/servicios.css", import.meta.url), "utf8");
    expect(css).toContain("--nav-height: 72px;");
    expect(css).toMatch(/\.s-nav-inner \{[^}]*min-height: calc\(var\(--nav-height\) - 1px\)/);
    // El nav usa el mismo contenedor de 1280px que las secciones, para alinearse con las tarjetas.
    expect(css).toMatch(/\.s-nav-inner \{[^}]*max-width: calc\(1280px \+ 2 \* var\(--page-gutter\)\); margin-inline: auto;/);
    // Nav de vidrio: translúcido con desenfoque, y el hero sube por debajo para que se vea la grilla.
    expect(css).toMatch(/\.s-nav \{[^}]*backdrop-filter: blur\(16px\)/);
    expect(css).not.toContain("data-scrolled");
    expect(css).toContain("margin-top: calc(-1 * var(--nav-height));");
    // Contenido del hero 16px más arriba que en Figma, sin cambiar el alto del hero.
    expect(css).toContain("padding-block: calc(104px + var(--nav-height)) 136px;");
    const nav = html.slice(html.indexOf('<header class="s-nav">'), html.indexOf("</header>"));

    // Logo como máscara: toma el color del texto en los dos temas.
    expect(nav).toContain('<span class="s-icon" style="--icon: url(/logo-asilo-digital-white.svg)"></span>');
    expect(nav).toContain('aria-label="Asilo Digital, ir al inicio"');
    // Botón de tema antes del CTA, con etiqueta en español y los íconos de sol y luna.
    const toggle = nav.indexOf('<button class="s-theme-toggle" type="button" aria-label="Cambiar a modo claro" data-theme-toggle>');
    expect(toggle).toBeGreaterThan(nav.indexOf('class="s-nav-actions"'));
    expect(toggle).toBeLessThan(nav.indexOf("s-btn--primary"));
    expect(nav).toContain("s-theme-icon--sun");
    expect(nav).toContain("s-theme-icon--moon");
    expect(css).toMatch(/\.s-theme-toggle \{[^}]*width: 32px; height: 32px;/);
    expect(nav).toContain('aria-label="Navegación principal"');
    expect(navLinks.map((l) => l.label)).toEqual(["Servicios", "Nuestro trabajo", "Contacto"]);
    for (const link of navLinks) expect(nav).toContain(`href="${link.href}">${link.label}</a>`);
    expect(CTA_LABEL).toBe("Contáctanos");
    // Botón del nav una escala menor que el del hero: sm (32px, Label SM) frente a lg (48px).
    expect(nav).toContain(`<a class="s-btn s-btn--sm s-btn--primary s-label-sm" href="${CTA_HREF}">${CTA_LABEL}</a>`);
    expect(css).toContain(".s-btn--sm { min-height: 32px; padding: 0 16px; }");
    // Todos los "Contáctanos" llevan al formulario de contacto en Notion.
    expect(CTA_HREF).toBe("https://shorthaired-raft-3f2.notion.site/c78219767f6a48deb87242f4c99989a6");
    expect(html.match(new RegExp(`href="${CTA_HREF}"`, "g"))).toHaveLength(4);
    expect(html).not.toContain("wa.me");
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

    // Sombra con borde de luz y hover que eleva la foto con un halo azul (solo con mouse).
    const css = readFileSync(new URL("../src/styles/servicios.css", import.meta.url), "utf8");
    expect(css).toMatch(/\.s-project-image \{[^}]*box-shadow: var\(--shadow-media-rest\);/);
    expect(css).toMatch(/--shadow-media-rest:\s*0 0 0 1px rgb\(255 255 255 \/ 0\.1\)/);
    expect(css).toMatch(/@media \(hover: hover\) \{\s*\.s-project:hover \.s-project-image \{\s*transform: translateY\(-8px\);\s*box-shadow: var\(--shadow-media-hover\);/);
    expect(css).toContain("0 10px 24px -10px color-mix(in srgb, var(--color-blue-500) 90%, transparent),");
    expect(css).toContain("0 0 16px -4px color-mix(in srgb, var(--color-blue-500) 35%, transparent);");
    expect(css).not.toContain("0 36px 80px -20px");
    // En reposo, resplandor gris claro pegado a la tarjeta (sin el halo azul lejano); el azul queda para el hover.
    expect(css).toContain("0 6px 16px -6px color-mix(in srgb, var(--color-grey-200) 16%, transparent);");
    expect(css).not.toContain("0 28px 64px -20px");

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
    // Cada pestaña lleva una flecha; la seleccionada se llena de azul desde abajo y la flecha gira a ↗.
    expect(section.match(/<span class="s-icon s-services-tab-arrow" style="--icon: url\(\/servicios\/icons\/arrow-forward.svg\)"><\/span>/g)).toHaveLength(4);
    const css = readFileSync(new URL("../src/styles/servicios.css", import.meta.url), "utf8");
    expect(css).toMatch(/\.s-services-tab::before \{[^}]*background: var\(--color-blue-500\);[^}]*transform: scaleY\(0\)/);
    expect(css).toContain('.s-services-tab[aria-selected="true"]::before { transform: scaleY(1); opacity: 1; }');
    expect(css).toContain('.s-services-tab[aria-selected="true"] .s-services-tab-arrow { transform: rotate(-45deg); opacity: 1; }');
    expect(css).toMatch(/@media \(hover: hover\) \{\s*\.s-services-tab:not\(\[aria-selected="true"\]\):hover/);
    // Hover fino: línea de 1px y un asomo de azul de 10% del alto de la pestaña.
    expect(css).toMatch(/\.s-services-tab::after \{\s*height: 1px;/);
    expect(css).toContain('.s-services-tab:not([aria-selected="true"]):hover::before { transform: scaleY(0.1); opacity: 0.5; }');
    // Tarjeta sobre --surface-card (grey-1000 en oscuro) con todos sus trazos en --border-subtle (grey-800).
    expect(css).toMatch(/\.s-services-card \{[^}]*background: var\(--surface-card\);\s*border: 1px solid var\(--border-subtle\)/);
    expect(css).not.toMatch(/\.s-services-tabs? \{[^}]*grey-550/);
    // Haz de luz del borde visible solo a la derecha, sin React ni el paquete border-beam.
    expect(section).toContain('<div class="s-services-beam" aria-hidden="true">');
    expect(css).toContain("@property --s-beam-angle");
    expect(css).toContain("mask-image: linear-gradient(90deg, transparent 55%, #000 85%);");
    expect(css).toContain("animation: s-beam-spin 3.1s linear infinite;");
    // Azul de marca y blanco, sin rotar el tono (antes pasaba por verde y amarillo).
    expect(css).toContain("var(--color-blue-500) 38deg");
    expect(css).toContain("var(--beam-highlight) 70deg");
    expect(css).toContain("--beam-highlight: var(--color-white);");
    expect(css).not.toContain("hue-rotate");
    const pkg = readFileSync(new URL("../package.json", import.meta.url), "utf8");
    expect(pkg).not.toContain("border-beam");

    for (const tab of serviceTabs) {
      expect(section).toContain(`id="servicio-tab-${tab.id}" aria-controls="servicio-${tab.id}"`);
      expect(section).toContain(`<span>${tab.label}</span>`);
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
    // Flechas invertidas (blancas con el ícono grey-950 en oscuro); el ícono es una máscara sobre el SVG.
    expect(section).toContain('<span class="s-icon" style="--icon: url(/servicios/icons/arrow-forward.svg)"></span>');
    const arrowCss = readFileSync(new URL("../src/styles/servicios.css", import.meta.url), "utf8");
    // Transición cinemática con cascada (Motion): desenfoque y escala en la tarjeta, y logo, cita y autor
    // que entran escalonados.
    const motionScript = readFileSync(new URL("../src/scripts/servicios-carousel-motion.ts", import.meta.url), "utf8");
    expect(motionScript).toContain('import { animate, stagger } from "motion";');
    expect(motionScript).toContain('filter: ["blur(10px)", "blur(0px)"]');
    expect(motionScript).toContain("delay: stagger(0.12, { startDelay: 0.3 })");
    expect(motionScript).toContain("{ duration: 0.9, ease: easeEnter, delay: 0.15 }");
    expect(motionScript).not.toContain("rotateY");
    expect(arrowCss).toMatch(/\.s-carousel-arrow \{[^}]*background: var\(--inverse-bg\); color: var\(--inverse-fg\);/);
    expect(arrowCss).toContain("--inverse-bg: var(--color-white);");
    expect(arrowCss).toContain("--inverse-fg: var(--color-grey-950);");
    expect(section).toContain(`“${testimonials[0].quote}”`);
    const css = readFileSync(new URL("../src/styles/servicios.css", import.meta.url), "utf8");
    expect(css).toMatch(/\.s-testimonial \{[^}]*background: var\(--surface-card\);\s*border: 1px solid var\(--border-subtle\)/);
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
    expect(section).toContain(`<p class="s-section-tagline s-subheading-xs">${faqSection.tagline}</p>`);
    expect(html.match(/class="s-section-tagline s-subheading-xs"/g)).toHaveLength(4);
    expect(html).not.toContain("s-section-tagline s-subheading-sm");
    expect(section).toContain(`id="preguntas-title">${faqSection.title}</h2>`);
    expect(section.match(/<details class="s-faq-item"/g)).toHaveLength(faqItems.length);
    expect(section.match(/<details class="s-faq-item" name="faq" open>/g)).toHaveLength(1);
    expect(section.match(/<div class="s-faq-answer-wrap">/g)).toHaveLength(faqItems.length);
    const faqCss = readFileSync(new URL("../src/styles/servicios.css", import.meta.url), "utf8");
    expect(faqCss).toMatch(/\.s-faq-item \{\s*background: var\(--surface-card\);\s*border: 1px solid var\(--border-subtle\)/);
    // Fondo de toda la sección en --surface-section (grey-975 en oscuro).
    expect(faqCss).toContain(".s-faq { padding: 64px var(--page-gutter); background: var(--surface-section); }");
    expect(faqCss).toContain("--surface-section: var(--color-grey-975);");
    // Hover y pregunta abierta en --surface-card-hover (grey-950 en oscuro); tarjeta de contacto igual que las preguntas.
    expect(faqCss).toMatch(/@media \(hover: hover\) \{\s*\.s-faq-item:hover \{ background: var\(--surface-card-hover\); \}/);
    expect(faqCss).toContain(".s-faq-item[open]:not([data-closing]) { background: var(--surface-card-hover); }");
    expect(faqCss).toContain("--surface-card-hover: var(--color-grey-950);");
    expect(faqCss).toMatch(/\.s-faq-card \{[^}]*background: var\(--surface-card\);\s*border: 1px solid var\(--border-subtle\)/);
    // La X es una máscara: toma el color del texto en los dos temas.
    expect(section.match(/<span class="s-icon s-faq-icon" style="--icon: url\(\/servicios\/icons\/close.svg\)"><\/span>/g)).toHaveLength(faqItems.length);
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
    // La tarjeta de contacto va sin avatar.
    expect(section).not.toContain("s-faq-card-avatar");
    expect(existsSync(new URL("../public/servicios/icons/close.svg", import.meta.url))).toBe(true);
  });

  it("renders the final CTA with the contact form button and every nav anchor has its section", async () => {
    const html = await render();
    const start = html.indexOf('<section class="s-cta"');
    const section = html.slice(start, html.indexOf("</section>", start));

    expect(section).toContain('id="contacto"');
    expect(section).toContain(`<h2 class="s-section-title" id="contacto-title">${finalCta.title}</h2>`);
    expect(section).toContain(finalCta.subtitle);
    expect(section).toContain(`<a class="s-btn s-btn--lg s-btn--primary s-label-md" href="${CTA_HREF}">${CTA_LABEL}</a>`);
    for (const link of navLinks) expect(html).toContain(`id="${link.href.slice(1)}"`);

    // Fondo decorativo: degradado hacia el azul de marca con una grilla de cuadritos, detrás del contenido.
    expect(section).toContain('<div class="s-cta-bg" aria-hidden="true"></div>');
    expect(section.indexOf("s-cta-bg")).toBeLessThan(section.indexOf("s-cta-inner"));
    const css = readFileSync(new URL("../src/styles/servicios.css", import.meta.url), "utf8");
    expect(css).toMatch(/\.s-cta-bg \{[^}]*z-index: -1; background: var\(--cta-gradient\);/);
    expect(css).toMatch(/\.s-cta-bg::before \{[^}]*mask: var\(--s-cta-dots\) center \/ 48px 48px repeat, var\(--s-cta-fade\);\s*mask-composite: intersect;/);
    // Detrás del texto los cuadritos se apagan y el texto lleva sombra del tono del degradado.
    expect(css).toContain("--s-cta-fade: radial-gradient(ellipse 36% 28% at 50% 38%, transparent 70%, #000 100%);");
    expect(css).toMatch(/\.s-cta-lead \{ text-shadow: 0 0 16px var\(--cta-text-halo\)/);
    // Los dos temas definen su degradado y el color de los cuadritos.
    expect(css.match(/--cta-gradient: linear-gradient\(to bottom, var\(--surface-section\) 0%/g)).toHaveLength(2);
    expect(css.match(/--cta-dot: /g)).toHaveLength(2);
  });

  it("renders the footer after main with the logo, social links and copyright", async () => {
    const html = await render();
    const start = html.indexOf('<footer class="s-footer">');
    const section = html.slice(start, html.indexOf("</footer>", start));

    expect(start).toBeGreaterThan(html.indexOf("</main>"));
    expect(section).toContain('<span class="s-icon" style="--icon: url(/logo-asilo-digital-white.svg)"></span>');
    expect(section).not.toContain("<img");
    expect(section).toContain('aria-label="Redes sociales"');
    expect(footerSocialLinks.map((l) => l.icon)).toEqual(["instagram", "tiktok", "x", "linkedin", "web"]);
    expect(footerSocialLinks.map((l) => l.href)).toEqual([
      "https://www.instagram.com/asilodigitalcom",
      "https://www.tiktok.com/@asilodigital",
      "https://x.com/asilodigital",
      "https://www.linkedin.com/company/asilodigital/home/",
      "https://www.asilodigital.com/",
    ]);
    for (const link of footerSocialLinks) {
      expect(section).toContain(`href="${link.href}" target="_blank" rel="noopener noreferrer" aria-label="Asilo Digital en ${link.label}"`);
      expect(section).toContain(`<span class="s-icon" style="--icon: url(/servicios/icons/${link.icon}.svg)"></span>`);
      expect(existsSync(new URL(`../public/servicios/icons/${link.icon}.svg`, import.meta.url))).toBe(true);
    }
    expect(section).toContain(`<p>${footer.copyright}</p>`);
    // Frase en Title/H5 bajo el logo; créditos a la izquierda, en gris de párrafo, con línea grey-800 a 24px.
    expect(section).toContain(`<p class="s-footer-tagline s-title-h5">${footer.tagline}</p>`);
    expect(section.indexOf("s-footer-logo")).toBeLessThan(section.indexOf("s-footer-tagline"));
    const footerCss = readFileSync(new URL("../src/styles/servicios.css", import.meta.url), "utf8");
    // Logo y frase a 16px.
    expect(footerCss).toContain(".s-footer-brand { display: flex; flex-direction: column; align-items: flex-start; gap: 16px; }");
    expect(footerCss).toMatch(/\.s-footer-credits \{[^}]*justify-content: flex-start;[^}]*padding-top: 24px; border-top: 1px solid var\(--border-subtle\);\s*color: var\(--fg-body\); text-align: left;/);
    expect(footer.copyright).toMatch(/^© \d{4} Asilo Digital\. Todos los derechos reservados$/);
    // Sin páginas legales todavía: no se publican links vacíos.
    expect(footerLegalLinks).toHaveLength(0);
    expect(section).not.toContain('href="#"');

    // Brillo escalonado al pie: nueve columnas simétricas, decorativas, detrás del contenido y sticky abajo.
    expect(section).toContain('<div class="s-footer-glow" aria-hidden="true" data-footer-glow>');
    const heights = [...section.matchAll(/class="s-footer-glow-bar" style="--h: (\d+)"/g)].map((m) => Number(m[1]));
    expect(heights).toEqual([55, 69, 81, 92, 100, 92, 81, 69, 55]);
    expect(section.indexOf("s-footer-glow")).toBeGreaterThan(section.indexOf("s-footer-credits"));
    const css = readFileSync(new URL("../src/styles/servicios.css", import.meta.url), "utf8");
    // Ancla sticky de alto 0 al final del footer, después del espacio reservado para el arco completo.
    expect(section.indexOf("data-footer-glow-space")).toBeLessThan(section.indexOf("data-footer-glow>"));
    expect(css).toMatch(/\.s-footer-glow \{\s*position: sticky; bottom: 0; height: 0;/);
    expect(css).toContain(".s-footer-glow-space { height: var(--footer-glow-h); margin-top: 48px; }");
    expect(css).toMatch(/\.s-footer-glow-bars \{[^}]*filter: blur\(10px\);/);
    // Azul de marca como base y la gama periwinkle / lavanda / blanco azulado de la referencia.
    for (const color of ["#6f7ad9", "#9aa8f2", "#e4ecff", "var(--color-blue-500) 80%", "--footer-glow-deep: #2b3190;"]) expect(css).toContain(color);
    expect(css).not.toContain("#e516d1");
    expect(css).toContain("--footer-glow-end: var(--color-blue-500);");
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
    expect(css).toContain(".s-hero-title { text-shadow: 0 0 32px var(--surface-page), 0 0 12px var(--surface-page); }");
    expect(css).toMatch(/\.s-hero-lead \{[^}]*text-shadow: 0 0 16px var\(--surface-page\)/);
    // En claro, la grilla usa un gris más suave.
    expect(css).toContain('html[data-theme="light"] .s-hero-pixels { --pixel-muted: var(--color-grey-300); }');
  });
});
