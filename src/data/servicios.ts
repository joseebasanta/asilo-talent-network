// Contenido de la landing de servicios de Asilo Digital, versión 2 (/servicios).
// La v1 quedó guardada en la rama landing-page-v1-2026-10-28 y en el tag servicios-v1-2026-10-28.
// La v2 (copy "Todas las apps se ven igual") quedó en la rama servicios-v2 y en el tag servicios-v2-2026-11-06.
// Esta es la v3: copy y secciones del Figma "Asilo Core" (nodo 8951:3082). Cada sección agrega aquí su copy,
// links y rutas de imágenes.

export const seo = {
  title: "Asilo Digital — Diseño UX/UI con buen gusto y coherencia",
  description:
    "Diseño UX/UI para equipos que quieren productos de primer nivel: auditamos tu UX, rediseñamos tu app, creamos tu design system y prototipamos con código antes de desarrollar.",
};

export const CTA_LABEL = "Contáctanos";

// El CTA principal lleva al formulario de contacto en Notion: el equipo revisa cada lead y luego confirma
// cómo contactarlo.
export const CTA_HREF = "https://shorthaired-raft-3f2.notion.site/c78219767f6a48deb87242f4c99989a6";

export interface NavLink {
  label: string;
  href: string;
}

// Nav (Figma: Asilo Services, nodo 91:7190). Las anclas apuntan a secciones que se van sumando.
export const navLinks: NavLink[] = [
  { label: "Servicios", href: "#servicios" },
  { label: "Cómo trabajamos", href: "#como-trabajamos" },
  { label: "Proyectos", href: "#trabajo" },
  { label: "Contacto", href: "#contacto" },
];

// Hero (Figma: Asilo Core, nodo 8951:3083).
export const hero = {
  // Una frase por línea, como en Figma: la primera en peso 400, la segunda en 500 y el punto final en 600.
  titleLines: ["La IA hace pantallas,", "nosotros les ponemos el gusto."],
  // Una sola frase, como en Figma.
  subtitleLines: ["Soluciones de Diseño UX/UI para diferenciarte y crecer con coherencia"],
};

// El problema (Figma: Asilo Core, "Dolores"): tres tarjetas, sin enlaces.
export const problemSection = {
  titleLines: ["Tu app crece, pero pierde el hilo"],
  subtitle:
    "Cada mes se agregan funciones y pantallas nuevas, pero sin una base de diseño, se ve cada vez más como todas las demás. Nosotros te acompañamos a diferenciarte sin perder la agilidad.",
};

export interface InfoCard {
  // Ícono del decorador de la tarjeta (solo "El problema").
  icon?: "copy" | "branch" | "eye-off";
  title: string;
  body: string;
}

export const problemCards: InfoCard[] = [
  {
    icon: "copy",
    title: "Todas se ven igual",
    body: "La IA parte de los mismos patrones por defecto. Se hace rápido, pero crea deuda de UX y no refleja lo que busca tu marca.",
  },
  {
    icon: "branch",
    title: "Cada versión se parece menos",
    body: "Sin un sistema que guarde las decisiones o ponga las reglas del diseño, el producto pierde coherencia y se ve diferente con cada entrega.",
  },
  {
    icon: "eye-off",
    title: "Funciona, pero no es suficiente",
    body: "Tus usuarios no te comparan con la competencia local, sino con las mejores apps que usan. Una interfaz descuidada se lee como un negocio descuidado.",
  },
];

// Franja de logos al pie del hero (Figma: Asilo Core, nodo 8990:3056): clientes reales, exportados de Figma. Se
// muestran en blanco (filtro de la franja), sea cual sea su color original. width y height son los de cada archivo;
// scale ajusta el tamaño de cada uno sobre la altura base de 28px (1 = igual).
export const clientLogos = [
  { src: "/servicios/clientes/empleate.svg", alt: "Empléate", width: 418, height: 155, scale: 1.3 },
  { src: "/servicios/clientes/tilin.svg", alt: "Tilín", width: 220, height: 85, scale: 1 },
  { src: "/servicios/clientes/trazando-futuros.png", alt: "Trazando Futuros", width: 2048, height: 283, scale: 1 },
  { src: "/servicios/clientes/crt.png", alt: "CRT", width: 180, height: 47, scale: 0.85 },
  { src: "/servicios/clientes/intellivia.svg", alt: "Intellivia", width: 408, height: 68, scale: 0.75 },
];

export interface Project {
  name: string;
  description: string;
  tags: string[];
  image: { src: string; alt: string };
  /** Recorrido en video (MP4, 4:3, sin audio) sobre la imagen: en hover con mouse y, en móvil, al estar a la vista. */
  video?: string;
}

// Proyectos: una fila de tres, con las imágenes a 2× (811×568). Intellivia y Empléate llevan un relleno con su logo hasta
// tener las imágenes reales. Diners Club Mall App, Mattelsa, Corona App, Olímpica y Gama ya no se muestran; sus imágenes
// siguen en /public/servicios/proyectos.
export const projectsSection = {
  titleLines: ["Productos que dan ganas de usar"],
  subtitle: "Cosas que hemos diseñado en los últimos años, y lo que queremos traer a Venezuela.",
};

// TODO: reemplazar las descripciones de relleno con una línea real por proyecto.
const PLACEHOLDER_DESCRIPTION = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";

export const projects: Project[] = [
  {
    name: "Intellivia",
    description: "Diseñando la experiencia web de Intellivia, un estudio jurídico especializado en tecnología",
    tags: ["Landing page", "Legal Tech"],
    image: {
      src: "/servicios/proyectos/intellivia.webp",
      alt: "Intellivia: inicio del sitio del estudio jurídico, con el título “Acompañamiento legal para impulsar soluciones tecnológicas” y el Kit Legal para Startups",
    },
    video: "/servicios/proyectos/intellivia-hover-azul.mp4",
  },
  {
    name: "Tillín",
    description: PLACEHOLDER_DESCRIPTION,
    tags: ["App Design", "Servicios"],
    image: { src: "/servicios/proyectos/tilin.webp", alt: "Tillín: perfil del técnico, inicio, búsqueda de profesional y pago" },
  },
  {
    name: "Empléate",
    description: PLACEHOLDER_DESCRIPTION,
    tags: ["Design System", "Empleo/RRHH"],
    // TODO: reemplazar por la imagen real del proyecto (hoy es un relleno con el logo).
    image: { src: "/servicios/proyectos/empleate.svg", alt: "Empléate (imagen pendiente)" },
  },
];

export interface ServiceTab {
  id: string;
  label: string;
  title: string;
  body: string;
  items: string[];
  // Precio de referencia (opcional): se muestra al pie del panel.
  price?: string;
  // Aclaración del precio (opcional): va debajo, en un tono más suave.
  priceNote?: string;
}

// Servicios (Figma: Asilo Core, "Servicios").
export const servicesSection = {
  titleLines: ["Nuestros servicios"],
  subtitle: "Diseño de productos digitales UX/UI desde Venezuela, con enfoque global",
};

// Copy de los tres servicios confirmado por el equipo.
export const serviceTabs: ServiceTab[] = [
  {
    id: "ux-audit",
    label: "UX Audit",
    title: "Auditoría de UX/UI",
    body: "Para equipos que saben que algo no funciona, pero no saben qué arreglar primero. Revisamos tu producto con heurísticas de UX/UI, flujos, performance, y te entregamos los hallazgos por severidad con una hoja de ruta clara.",
    items: [
      "Evaluación heurística de UX/UI",
      "Flujos clave y arquitectura de información",
      "Revisión de consistencia visual y de marca",
      "Hallazgos por severidad, prioridades claras y hoja de ruta",
      "Presentación en vivo con tu equipo",
    ],
    price: "Desde USD 500",
  },
  {
    id: "diseno-rediseno",
    label: "Diseño UX/UI",
    title: "Interfaces hechas con criterio, atención al detalle e intención.",
    body: "Diseñamos tu producto desde el MVP hasta su versión escalada, con criterio visual en cada decisión. Trabajamos junto a tu equipo de desarrollo y entregamos interfaces listas para construir: lo que entregamos es lo que tus usuarios verán.",
    items: [
      "Diseño UI y UX",
      "MVP y prototipos",
      "Flujos de usuario y wireframes",
      "Diseño mobile y responsive",
      "Pruebas de usabilidad e iteración",
    ],
    price: "Desde USD 600",
    priceNote: "o dependiendo del requerimiento",
  },
  {
    id: "design-system",
    label: "Design System",
    title: "Diseña y escala tu producto sin perder coherencia.",
    body: "Ordenamos las decisiones de tu producto y las convertimos en componentes, estilos y reglas claras que tu equipo puede reutilizar, para que cada pantalla nueva mantenga la coherencia con la anterior.",
    items: [
      "Auditoría de la interfaz existente",
      "Tokens de color, tipografía y espaciado",
      "Librería de componentes",
      "Documentación de uso",
      "Traspaso al equipo de desarrollo",
    ],
    price: "Desde USD 800",
  },
];

// Cómo trabajamos (Figma: Asilo Core): tres pasos en tarjetas.
export const processSection = {
  titleLines: ["Menos margen de error", "entre el diseño y el resultado."],
  subtitle:
    "Nos adelantamos al código y creamos prototipos altamente funcionales, para que valides tu producto antes de desarrollar y tu equipo implemente más fácil y rápido.",
};

export const processCards: InfoCard[] = [
  { title: "01 · Diagnosticamos", body: "Entendemos tu producto, tus usuarios y lo que necesitas lograr." },
  { title: "02 · Diseñamos y prototipamos", body: "Validas la experiencia funcionando, antes de invertir en desarrollo." },
  { title: "03 · Implementamos o acompañamos", body: "El desarrollo arranca con todo definido y avanza más rápido." },
];

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  avatar: string;
  // Logo de la empresa del cliente (SVG o PNG). Opcional: sin logo la tarjeta empieza por la cita.
  logo?: { src: string; alt: string };
}

// Testimonios (Figma: Asilo Services, nodo 91:7386).
export const testimonialsSection = {
  tagline: "Testimonios",
  title: "Lo que dicen los equipos con los que trabajamos.",
};

// TODO: reemplazar con testimonios reales (con permiso): cita, nombre, cargo y empresa, foto y logo.
// Son tres testimonios; el número de puntos del slider sale de esta lista (en Figma hay seis puntos).
export const testimonials: Testimonial[] = Array.from({ length: 3 }, (_, i) => ({
  quote:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare.",
  name: i === 0 ? "Assunta Cipollone" : "Nombre Apellido",
  role: i === 0 ? "Directora, Empléate.com" : "Cargo, Empresa",
  avatar: "/servicios/testimonios/avatar-placeholder.svg",
  // Logo de relleno como en Figma (cuadrado gris y "Cliente 0N"); se reemplaza por el de cada cliente.
  logo: { src: `/placeholders/testimonial-logo-${i + 1}.svg`, alt: `Cliente 0${i + 1}` },
}));

// CTA final (Figma: Asilo Core). El botón lleva al formulario (CTA_HREF).
export const finalCta = {
  titleLines: ["Empecemos con tu producto hoy.", "No importa la etapa."],
  ctaLabel: CTA_LABEL,
};

export interface FooterLink {
  label: string;
  href: string;
}

// Footer (Figma: Asilo Services, nodo 91:7543). Mismo orden de redes que en Figma; los íconos están en
// /public/servicios/icons con el nombre de `icon`.
// Los íconos de TikTok y de la web son provisionales hasta tener los definitivos.
export const footerSocialLinks: (FooterLink & { icon: "instagram" | "tiktok" | "x" | "linkedin" | "web" | "youtube" })[] = [
  { label: "Instagram", href: "https://www.instagram.com/asilodigitalcom", icon: "instagram" },
  { label: "TikTok", href: "https://www.tiktok.com/@asilodigital", icon: "tiktok" },
  { label: "X", href: "https://x.com/asilodigital", icon: "x" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/asilodigital/home/", icon: "linkedin" },
  // El sitio principal (blog); el aria-label queda "Asilo Digital en asilodigital.com".
  { label: "asilodigital.com", href: "https://www.asilodigital.com/", icon: "web" },
  // TODO: agregar YouTube cuando tengamos el link del canal (el ícono ya está en /servicios/icons/youtube.svg):
  // { label: "YouTube", href: "https://www.youtube.com/@…", icon: "youtube" },
];

// TODO: Figma tiene "Política de privacidad", "Términos de servicio" y "Configuración de cookies".
// Se agregan aquí cuando existan esas páginas, para no publicar links que no llevan a ningún lado.
export const footerLegalLinks: FooterLink[] = [];

export const footer = {
  // Frase bajo el logo (Title/H5).
  tagline: "Buen gusto y coherencia para los productos del día a día.",
  copyright: `© ${new Date().getFullYear()} Asilo Labs. Todos los derechos reservados`,
};
