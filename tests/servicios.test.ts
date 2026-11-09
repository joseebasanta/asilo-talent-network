import { existsSync, readFileSync } from "node:fs";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import ServiciosPage from "../src/pages/servicios.astro";
import {
  clientLogos,
  CTA_HREF,
  CTA_LABEL,
  finalCta,
  footer,
  footerLegalLinks,
  footerSocialLinks,
  hero,
  navLinks,
  problemCards,
  problemSection,
  processCards,
  processSection,
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

// La v3 sigue el Figma "Asilo Core". Los tests de la v1 quedaron en la rama landing-page-v1-2026-10-28 y los de
// la v2 en servicios-v2 (tag servicios-v2-2026-11-06).
describe("landing de servicios v3", () => {
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

  it("declares Switzer (the Figma font), PP Frama and Geist with files that exist", () => {
    const css = readFileSync(new URL("../src/styles/fonts.css", import.meta.url), "utf8");
    for (const family of ["Switzer", "PP Frama", "PP Frama Text", "Geist Sans", "Geist Mono"]) {
      expect(css).toContain(`font-family: "${family}";`);
    }
    const files = [...css.matchAll(/url\("(\/fonts\/[^"]+)"\)/g)].map((m) => m[1]!);
    expect(files.length).toBeGreaterThanOrEqual(24);
    expect(files).toContain("/fonts/switzer-variable.woff2");
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

  it("maps semantic tokens to the dark scale and ships no light mode or theme toggle", async () => {
    const css = readFileSync(new URL("../src/styles/servicios.css", import.meta.url), "utf8");
    expect(css).toContain("--surface-page: var(--color-background);");
    expect(css).toContain("--surface-card: var(--color-grey-1000);");
    expect(css).toContain("--fg-strong: var(--color-white);");
    expect(css).toContain("--border-subtle: var(--color-grey-800);");
    expect(css).not.toContain("data-theme");
    expect(css).not.toContain("s-theme-toggle");
    const html = await render();
    expect(html).not.toContain("data-theme-toggle");
    expect(html).not.toContain("asilo-theme");
    expect(existsSync(new URL("../src/scripts/servicios-theme.ts", import.meta.url))).toBe(false);
  });

  it("renders the nav with the logo and the section links only, as in Figma", async () => {
    const html = await render();

    // 72px de alto, sin línea inferior.
    const css = readFileSync(new URL("../src/styles/servicios.css", import.meta.url), "utf8");
    expect(css).toContain("--nav-height: 72px;");
    expect(css).toMatch(/\.s-nav-inner \{[^}]*min-height: var\(--nav-height\)/);
    // El nav usa el mismo contenedor de 1312px (1440 menos 64px por lado, como en Figma) que las secciones.
    expect(css).toMatch(/\.s-nav-inner \{[^}]*max-width: calc\(1312px \+ 2 \* var\(--page-gutter\)\); margin-inline: auto;/);
    // Figma: el nav no lleva fondo ni línea; solo una capa de vidrio (velo + desenfoque) que se desvanece hacia abajo.
    expect(css).toMatch(/\.s-nav::before \{[^}]*background: linear-gradient\(to bottom, color-mix\(in srgb, var\(--surface-page\) 94%, transparent\) 60%, transparent\);\s*-webkit-backdrop-filter: blur\(12px\); backdrop-filter: blur\(12px\);/);
    expect(css).not.toMatch(/\.s-nav \{[^}]*background:/);
    // En móvil los enlaces van en un menú burger (botón de 44×44 y panel bajo el nav); sin JS el panel queda visible.
    expect(css).toMatch(/\.s-menu-js \.s-nav-toggle \{[^}]*width: 44px; height: 44px;/);
    expect(css).toContain(".s-menu-js .s-nav:not([data-open]) .s-nav-menu { display: none; }");
    expect(css).not.toContain("--nav-height: 112px");
    // Áreas táctiles de 24px: puntos del carrusel en móvil y logo del footer.
    expect(css).toMatch(/@media \(max-width: 767px\), \(pointer: coarse\) \{\s*\.s-carousel-dot \{ width: 24px; \}/);
    expect(css).toContain(".s-footer-logo { padding-block: 3px; margin-block: -3px; }");
    expect(css).not.toMatch(/\.s-nav \{[^}]*border-bottom/);
    // Links a la derecha (Switzer Medium 14px, grey-300); el nav lleva el wordmark "Asilo Labs".
    expect(css).toMatch(/\.s-wordmark \{[^}]*font-size: 1\.3333rem; font-weight: 600;[^}]*letter-spacing: -0\.05em;/);
    expect(css).toMatch(/\.s-wordmark-pill \{[^}]*background: var\(--color-blue-500\);/);
    expect(css).toMatch(/\.s-nav-links a \{[^}]*font-size: 0\.875rem; font-weight: 500;/);
    expect(css).not.toContain("grid-template-columns: 1fr auto 1fr");
    expect(css).not.toContain("data-scrolled");
    expect(css).toContain("margin-top: calc(-1 * var(--nav-height));");
    // Hero de 730px contando el nav, con el título a 252px y los logos a 640px, como en Figma.
    expect(css).toContain(".s-hero { min-height: 730px; justify-content: flex-start; padding-block: 252px 120px; }");
    const nav = html.slice(html.indexOf('<header class="s-nav" data-nav>'), html.indexOf("</header>"));

    // Wordmark "Asilo Labs" de Figma: texto con "Labs" sobre un rectángulo azul (decorativo; el enlace lleva aria-label).
    expect(nav).toContain('<span class="s-wordmark" aria-hidden="true">Asilo <span class="s-wordmark-pill">Labs</span></span>');
    expect(nav).toContain('aria-label="Asilo Labs, ir al inicio"');
    expect(nav).not.toContain("logo-asilo-digital-white.svg");
    expect(nav).toContain('aria-label="Navegación principal"');
    // Botón burger accesible: nombre, estado y panel que controla.
    expect(nav).toContain('<button class="s-nav-toggle" type="button" aria-expanded="false" aria-controls="menu-principal" aria-label="Abrir menú" data-nav-toggle>');
    expect(nav).toContain('id="menu-principal"');
    expect(navLinks.map((l) => l.label)).toEqual(["Servicios", "Cómo trabajamos", "Proyectos", "Contacto"]);
    for (const link of navLinks) expect(nav).toContain(`href="${link.href}">${link.label}</a>`);
    // Figma: el nav no lleva botón, solo el logo y los links.
    expect(nav).not.toContain("s-btn");
    expect(nav).not.toContain("s-nav-actions");
    // El "Contáctanos" del cierre lleva al formulario de contacto en Notion.
    expect(CTA_LABEL).toBe("Contáctanos");
    expect(CTA_HREF).toBe("https://shorthaired-raft-3f2.notion.site/c78219767f6a48deb87242f4c99989a6");
    // El cierre y el botón "Me interesa" de cada servicio (3) llevan al formulario: 4 en total.
    expect(html.match(new RegExp(`href="${CTA_HREF}"`, "g"))).toHaveLength(4);
    expect(html).not.toContain("wa.me");
    expect(existsSync(new URL("../public/logo-asilo-digital-white.svg", import.meta.url))).toBe(true);
  });

  it("renders the hero with a single h1 and the subtitle, without buttons as in Figma", async () => {
    const html = await render();
    const section = html.slice(html.indexOf('<section class="s-hero"'), html.indexOf("</section>"));

    expect(html.match(/<h1\b/g)).toHaveLength(1);
    const titleStart = section.indexOf('id="hero-title">') + 'id="hero-title">'.length;
    const title = section.slice(titleStart, section.indexOf("</h1>")).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    expect(title).toBe(hero.titleLines.join(" "));
    expect(section.match(/class="s-hero-title-line"/g)).toHaveLength(2);
    // Figma: "La IA hace pantallas," / "nosotros les ponemos el gusto" y el punto final en un peso mayor.
    expect(hero.titleLines).toEqual(["La IA hace pantallas,", "nosotros les ponemos el gusto."]);
    expect(section).toContain('<span class="s-hero-title-dot">.</span>');
    const heroCss = readFileSync(new URL("../src/styles/servicios.css", import.meta.url), "utf8");
    expect(heroCss).toMatch(/\.s-hero-title-line \{ font-weight: 400; \}\s*\.s-hero-title-line \+ \.s-hero-title-line \{ font-weight: 500; \}\s*\.s-hero-title-dot \{ font-weight: 600; \}/);
    for (const line of hero.subtitleLines) expect(section).toContain(`<span class="s-hero-lead-line">${line}</span>`);
    expect(section).not.toContain("s-btn");
    expect(section).not.toContain("s-hero-actions");
  });

  it("renders the projects section with three cards, their images and service tags", async () => {
    const html = await render();
    const start = html.indexOf('<section class="s-projects"');
    const section = html.slice(start, html.indexOf("</section>", start));

    expect(section).toContain('id="trabajo"');
    expect(navLinks.map((l) => l.href)).toContain("#trabajo");
    expect(section.match(/class="s-section-title-line"/g)).toHaveLength(projectsSection.titleLines.length);
    for (const line of projectsSection.titleLines) expect(section).toContain(line);
    expect(section).toContain(projectsSection.subtitle);
    expect(projectsSection.subtitle).toBe("Cosas que hemos diseñado en los últimos años, y lo que queremos traer a Venezuela.");
    expect(section.match(/<li class="s-project" data-reveal/g)).toHaveLength(3);
    expect(section.match(/<h3\b/g)).toHaveLength(3);

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

    // Productos: Intellivia, Tillín y Empléate, con las etiquetas que da el equipo.
    expect(projects.map((p) => [p.name, p.tags])).toEqual([
      ["Intellivia", ["Landing page", "Legal Tech"]],
      ["Tillín", ["App Design", "Servicios"]],
      ["Empléate", ["Design System", "Empleo/RRHH"]],
    ]);

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
    const start = html.indexOf('<section class="s-services ');
    const section = html.slice(start, html.indexOf("</section>", start));

    expect(section).toContain('id="servicios"');
    expect(navLinks.map((l) => l.href)).toContain("#servicios");
    expect(section.match(/class="s-section-title-line"/g)).toHaveLength(servicesSection.titleLines.length);
    expect(serviceTabs.map((t) => t.label)).toEqual(["UX Audit", "Diseño UX/UI", "Design System"]);
    // El precio de referencia del UX Audit va al pie de su panel.
    expect(section).toContain('<p class="s-services-price s-label-lg">Desde USD 500</p>');
    // Diseño UX/UI parte de USD 600 y Design System de USD 800; cada panel lleva su precio.
    expect(serviceTabs.map((t) => t.price)).toEqual(["Desde USD 500", "Desde USD 600", "Desde USD 800"]);
    expect(section).toContain('class="s-services-price s-label-lg">Desde USD 600<');
    expect(section).toContain('class="s-services-price s-label-lg">Desde USD 800<');
    // Solo Diseño UX/UI aclara debajo del precio que depende del requerimiento.
    expect(serviceTabs.filter((t) => t.priceNote).map((t) => t.id)).toEqual(["diseno-rediseno"]);
    expect(section.match(/class="s-services-price-note s-paragraph-sm"/g)).toHaveLength(1);
    expect(section).toContain('<p class="s-services-price-note s-paragraph-sm">o dependiendo del requerimiento.</p>');
    // Cada servicio tiene su botón "Me interesa" hacia el formulario, con el nombre del servicio en el aria-label.
    expect(section.match(/class="s-services-cta s-btn s-btn--primary s-label-md"/g)).toHaveLength(serviceTabs.length);
    for (const tab of serviceTabs) expect(section).toContain(`href="${CTA_HREF}" aria-label="Me interesa: ${tab.label}">Me interesa</a>`);
    expect(section).toContain('role="tablist" aria-label="Servicios" aria-orientation="vertical"');
    expect(section.match(/role="tab"/g)).toHaveLength(3);
    expect(section.match(/role="tabpanel"/g)).toHaveLength(3);
    expect(section.match(/aria-selected="true"/g)).toHaveLength(1);
    // Por debajo de 1024px solo el panel activo ocupa lugar (sin espacio sobrante bajo los paneles cortos).
    const panelCss = readFileSync(new URL("../src/styles/servicios.css", import.meta.url), "utf8");
    expect(panelCss).toMatch(/@media \(max-width: 1023px\) \{\s*\.s-services-panel\[hidden\] \{ display: none; \}/);
    expect(section.match(/ hidden[ >]/g)).toHaveLength(2);
    // Cada pestaña lleva una flecha; la seleccionada se llena de azul desde abajo y la flecha gira a ↗.
    expect(section.match(/<span class="s-icon s-services-tab-arrow" style="--icon: url\(\/servicios\/icons\/arrow-forward.svg\)"><\/span>/g)).toHaveLength(3);
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
    // Son tres testimonios, con tres puntos.
    expect(total).toBe(3);

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
    // Flechas con contorno blanco de 40px y radio 6, con chevrones de 20px (Figma); el ícono es una máscara sobre el SVG.
    expect(section).toContain('<span class="s-icon" style="--icon: url(/servicios/icons/chevron-right.svg)"></span>');
    const arrowCss = readFileSync(new URL("../src/styles/servicios.css", import.meta.url), "utf8");
    // Transición cinemática con cascada (Motion): desenfoque y escala en la tarjeta, y logo, cita y autor
    // que entran escalonados.
    const motionScript = readFileSync(new URL("../src/scripts/servicios-carousel-motion.ts", import.meta.url), "utf8");
    expect(motionScript).toContain('import { animate, stagger } from "motion";');
    expect(motionScript).toContain('filter: ["blur(10px)", "blur(0px)"]');
    expect(motionScript).toContain("delay: stagger(0.12, { startDelay: 0.3 })");
    expect(motionScript).toContain("{ duration: 0.9, ease: easeEnter, delay: 0.15 }");
    expect(motionScript).not.toContain("rotateY");
    expect(arrowCss).toMatch(/\.s-carousel-arrow \{\s*width: 40px; height: 40px; padding: 0; border: 1px solid var\(--fg-strong\); border-radius: 6px;\s*background: transparent; color: var\(--fg-strong\);/);
    expect(section).toContain(`“${testimonials[0].quote}”`);
    const css = readFileSync(new URL("../src/styles/servicios.css", import.meta.url), "utf8");
    expect(css).toMatch(/\.s-testimonial \{[^}]*background: var\(--surface-card\);\s*border: 1px solid var\(--border-subtle\)/);
    expect(section).toContain(testimonials[0].name);
    expect(section).toContain(testimonials[0].role);

    for (const asset of [
      "/servicios/icons/chevron-left.svg",
      "/servicios/icons/chevron-right.svg",
      ...testimonials.flatMap((t) => [t.avatar, t.logo?.src ?? ""]).filter(Boolean),
    ]) {
      expect(existsSync(new URL(`../public${asset}`, import.meta.url))).toBe(true);
    }
  });

  it("does not render the FAQ section, which is no longer in Figma", async () => {
    const html = await render();
    expect(html).not.toContain("s-faq");
    expect(html).not.toContain('id="preguntas"');
    expect(html.match(/class="s-section-tagline s-subheading-xs"/g)).toHaveLength(1);
    expect(html).not.toContain("s-section-tagline s-subheading-sm");
  });

  it("renders the final CTA with the contact form button and every nav anchor has its section", async () => {
    const html = await render();
    const start = html.indexOf('<section class="s-cta"');
    const section = html.slice(start, html.indexOf("</section>", start));

    expect(section).toContain('id="contacto"');
    expect(finalCta.titleLines).toEqual(["Empecemos con tu producto hoy.", "No importa la etapa."]);
    for (const line of finalCta.titleLines) expect(section).toContain(line);
    expect(finalCta.ctaLabel).toBe("Contáctanos");
    expect(section).toContain(`<a class="s-btn s-btn--lg s-btn--primary s-label-md" href="${CTA_HREF}">${finalCta.ctaLabel}</a>`);
    for (const link of navLinks) expect(html).toContain(`id="${link.href.slice(1)}"`);

    // Fondo decorativo: la misma grilla animada azul del hero, detrás del contenido y sobre el fondo plano de la página.
    expect(section).toMatch(/<div class="s-cta-bg" aria-hidden="true">\s*<div class="s-grid" aria-hidden="true">/);
    expect(section.indexOf("s-cta-bg")).toBeLessThan(section.indexOf("s-cta-inner"));
    const css = readFileSync(new URL("../src/styles/servicios.css", import.meta.url), "utf8");
    expect(css).toMatch(/\.s-cta-bg \{ position: absolute; inset: 0; z-index: -1; pointer-events: none; \}/);
    // Ya no hay degradado azul, cuadritos ni sombras de texto (eran lo que lo hacía distinto al resto de la landing).
    for (const gone of ["--cta-gradient", "--cta-dot", "--cta-text-halo", "--s-cta-dots", "--s-cta-fade"]) expect(css).not.toContain(gone);
    expect(css).not.toMatch(/\.s-cta[^{]*\{[^}]*text-shadow/);
  });

  it("renders the footer after main with the logo, social links and copyright", async () => {
    const html = await render();
    const start = html.indexOf('<footer class="s-footer">');
    const section = html.slice(start, html.indexOf("</footer>", start));

    expect(start).toBeGreaterThan(html.indexOf("</main>"));
    // El footer lleva el mismo wordmark "Asilo Labs" que el nav.
    expect(section).toContain('<span class="s-wordmark" aria-hidden="true">Asilo <span class="s-wordmark-pill">Labs</span></span>');
    expect(section).toContain('aria-label="Asilo Labs, volver al inicio"');
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
    expect(footer.copyright).toMatch(/^© \d{4} Asilo Labs\. Todos los derechos reservados$/);
    // Sin páginas legales todavía: no se publican links vacíos.
    expect(footerLegalLinks).toHaveLength(0);
    expect(section).not.toContain('href="#"');

    // El brillo escalonado al pie ya no existe: la página termina en el footer, con 40px de aire inferior.
    expect(section).not.toContain("s-footer-glow");
    expect(section).not.toContain("data-footer-glow");
    expect(section).not.toContain("<script");
    const css = readFileSync(new URL("../src/styles/servicios.css", import.meta.url), "utf8");
    expect(css).not.toContain("footer-glow");
    expect(css).toContain(".s-footer-inner { position: relative; padding-bottom: 40px; }");
    expect(existsSync(new URL("../src/scripts/servicios-footer-glow.ts", import.meta.url))).toBe(false);
  });

  it("renders the problem and process sections between the hero, services and projects", async () => {
    const html = await render();
    const order = ["inicio", "problema", "servicios", "como-trabajamos", "trabajo", "testimonios", "contacto"];
    const positions = order.map((id) => html.indexOf(`id="${id}"`));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);

    const slice = (cls: string) => {
      const start = html.indexOf(`<section class="${cls}"`);
      return html.slice(start, html.indexOf("</section>", start));
    };
    const problem = slice("s-problem");
    expect(problem).not.toContain("s-section-tagline");
    expect(problemSection.titleLines).toEqual(["Tu app crece, pero pierde el hilo"]);
    expect(problem).toContain(problemSection.subtitle);
    expect(problem.match(/<li class="s-card s-card--feature" data-reveal/g)).toHaveLength(3);
    expect(problem.match(/class="s-card-decorator"/g)).toHaveLength(3);
    expect(problemCards.map((c) => c.icon)).toEqual(["copy", "branch", "eye-off"]);
    for (const card of problemCards) {
      expect(problem).toContain(`<h3 class="s-card-title s-title-h5">${card.title}</h3>`);
      expect(problem).toContain(card.body);
    }
    // Sin enlaces en las tarjetas.
    expect(problem).not.toContain("s-card-link");
    expect(problem).not.toContain("<a ");

    const process = slice("s-process");
    expect(process).toContain(processSection.subtitle);
    expect(process.match(/<li class="s-step"/g)).toHaveLength(3);
    expect(process.match(/class="s-step-number"/g)).toHaveLength(3);
    expect(process.match(/class="s-step-arrow"/g)).toHaveLength(2);
    // En móvil los pasos van apilados, así que la flecha entre ellos apunta hacia abajo (no hacia la derecha).
    expect(process).toContain('<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>');
    expect(process).not.toContain('<path d="M5 12h14"/>');
    for (const n of ["01", "02", "03"]) expect(process).toContain(`>${n}</span>`);
    expect(process).toContain('<h3 class="s-card-title s-title-h5">Diagnosticamos</h3>');
    expect(processCards.map((c) => c.title)).toEqual(["01 · Diagnosticamos", "02 · Diseñamos y prototipamos", "03 · Implementamos o acompañamos"]);
    for (const card of processCards) expect(process).toContain(card.body);
    expect(process).not.toContain("s-card-link");
    // Figma ya no tiene "Con quién trabajamos".
    expect(html).not.toContain("s-audience");
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
    // Solo la primera copia lleva alt con texto; las otras tres, alt="". Todas cargan en diferido.
    // Astro escribe alt="" como el atributo vacío `alt`, que en HTML equivale a alt="".
    expect(strip.match(/ alt(="")?(?=[\s>])/g)).toHaveLength(clientLogos.length * 3);
    expect(strip.match(/loading="lazy" decoding="async"/g)).toHaveLength(clientLogos.length * 4);
    for (const logo of clientLogos) {
      expect(hero).toContain(`alt="${logo.alt}"`);
      expect(existsSync(new URL(`../public${logo.src}`, import.meta.url))).toBe(true);
    }
    expect(hero).not.toMatch(/webflow|relume/i);

    const css = readFileSync(new URL("../src/styles/servicios.css", import.meta.url), "utf8");
    // 80s por vuelta con seis logos (~33px/s); la duración escala con la cantidad de logos.
    expect(css).toContain("animation: s-logos-scroll calc(var(--logos-count, 6) * 80s / 6) linear infinite;");
    expect(css).toContain("@keyframes s-logos-scroll { to { transform: translateX(-50%); } }");
    expect(strip).toContain(`<div class="s-logos-track" style="--logos-count: ${clientLogos.length}">`);
    expect(css).toContain(".s-logos:hover .s-logos-track { animation-play-state: paused; }");
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\.s-logos-track \{ animation: none; \}/);
    // La pista arranca a la izquierda: centrada dejaba un hueco al final de cada vuelta.
    expect(css).toMatch(/\.s-logos \{\s*display: flex; justify-content: flex-start; overflow: hidden;/);
    expect(css).toContain("margin: 64px calc(-1 * var(--page-gutter)) 0;");
    // Cinco clientes reales (Figma 8990:3056); la franja se desplaza en todos los tamaños.
    expect(clientLogos.map((l) => l.alt)).toEqual(["Empléate", "Tilín", "Trazando Futuros", "CRT", "Intellivia"]);
    for (const logo of clientLogos) expect(hero).toContain(`width="${logo.width}" height="${logo.height}"`);
    // Empléate un 30 % más grande, Intellivia un 25 % y CRT un 15 % más chicos que la altura base de 28px.
    expect(Object.fromEntries(clientLogos.map((l) => [l.alt, l.scale]))).toEqual({ "Empléate": 1.3, "Tilín": 1, "Trazando Futuros": 1, CRT: 0.85, Intellivia: 0.75 });
    expect(hero).toContain("--logo-scale: 1.3");
    expect(hero).toContain("--logo-scale: 0.75");
    expect(hero).toContain("--logo-scale: 0.85");
    expect(css).toContain("height: calc(28px * var(--logo-scale, 1));");
    expect(css).not.toContain(".s-logos-set:not(:first-child) { display: none; }");
    expect(css).not.toContain("opacity: 0.58");
    expect(css).toContain("mask-image: linear-gradient(90deg, transparent, #000 20%, #000 80%, transparent)");
    expect(css).toContain("mask-image: linear-gradient(90deg, transparent 15%, #000 35%, #000 65%, transparent 85%)");
  });

  it("draws only the animated grid behind a solid white hero title without third-party copy", async () => {
    const html = await render();
    const start = html.indexOf('<section class="s-hero"');
    const hero = html.slice(start, html.indexOf("</section>", start));

    expect(hero).toContain('<div class="s-hero-bg" aria-hidden="true">');
    // El fondo anterior (píxeles en canvas y viñeta) ya no está.
    expect(hero).not.toContain("data-hero-pixels");
    expect(hero).not.toContain("<canvas");
    expect(hero).not.toContain("s-hero-vignette");
    expect(existsSync(new URL("../src/scripts/servicios-pixels.ts", import.meta.url))).toBe(false);
    expect(hero.indexOf("s-hero-bg")).toBeLessThan(hero.indexOf("s-hero-inner"));
    // Grilla animada azul (solo CSS), decorativa y con tres capas.
    expect(hero.indexOf('class="s-grid"')).toBeGreaterThan(hero.indexOf("s-hero-bg"));
    expect(hero).toMatch(/<div class="s-grid"[^>]*aria-hidden="true"[^>]*>\s*<span class="s-grid-glow"><\/span>\s*<span class="s-grid-fc"><\/span>/);
    const gridCss = readFileSync(new URL("../src/styles/servicios.css", import.meta.url), "utf8");
    expect(gridCss).toContain("--grid-accent: var(--color-blue-500);");
    expect(gridCss).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\.s-grid::before, \.s-grid::after, \.s-grid-glow \{ animation: none; \}/);
    expect(hero).not.toContain("s-hline");
    expect(html).not.toMatch(/silent precision|explore design|github\.com"/i);

    const css = readFileSync(new URL("../src/styles/servicios.css", import.meta.url), "utf8");
    expect(css).toMatch(/\.s-hero-bg \{[^}]*z-index: -1/);
    expect(css).not.toContain("--pixel-accent");
    // El título va en blanco sólido, sin el efecto de vidrio del componente original.
    expect(css).not.toContain("s-glass-shimmer");
    expect(css).not.toContain("background-clip: text");
    expect(css).toContain(".s-hero .s-logos { animation: none; }");
    // Sin halo ni sombras de texto: eran para separar el título de los píxeles.
    expect(css).not.toMatch(/\.s-hero-text::before/);
    expect(css).not.toMatch(/\.s-hero-(title|lead) \{[^}]*text-shadow/);
  });

  it("gives the problem section 120px of vertical padding on desktop and keeps the others at 96px", () => {
    const css = readFileSync(new URL("../src/styles/servicios.css", import.meta.url), "utf8");
    const desktop = css.slice(css.lastIndexOf("/* Secciones de escritorio"));
    expect(desktop).toContain(".s-services, .s-process, .s-projects, .s-testimonials { padding-block: 96px; }");
    expect(desktop).toContain(".s-problem { padding-block: 120px; }");
    expect(css.match(/\.s-problem[^{]*\{[^}]*padding-block: 96px/g)).toBeNull();
  });

  it("keeps a single divider line, at the bottom of the hero", () => {
    const css = readFileSync(new URL("../src/styles/servicios.css", import.meta.url), "utf8");
    expect(css).toContain(".s-hero { border-bottom: 1px solid var(--color-grey-900); }");
    expect(css).not.toMatch(/\.s-hero(,[^{]*)? \{[^}]*border-top:\s*1px/);
    for (const section of ["s-problem", "s-services", "s-process", "s-projects", "s-testimonials", "s-cta", "s-footer"]) {
      expect(css).not.toMatch(new RegExp(`\\.${section}(,[^{]*)? \\{[^}]*border-(top|bottom):\\s*1px`));
    }
  });

  it("centers the hero title and subtitle", () => {
    const css = readFileSync(new URL("../src/styles/servicios.css", import.meta.url), "utf8");
    expect(css).toMatch(/\.s-hero-inner \{[^}]*align-items: center;[^}]*text-align: center;/);
    expect(css).toMatch(/\.s-hero-text \{[^}]*align-items: center;/);
    expect(css).toContain(".s-hero-lead { max-width: 860px; margin-inline: auto; }");
  });
});
