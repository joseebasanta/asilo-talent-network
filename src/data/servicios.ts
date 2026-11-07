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
  { label: "Nuestro trabajo", href: "#trabajo" },
  { label: "Contacto", href: "#contacto" },
];

// Hero (Figma: Asilo Core, nodo 8951:3083).
export const hero = {
  // Una frase por línea, como en Figma.
  titleLines: ["La IA hace pantallas.", "Nosotros les ponemos el gusto."],
  // Un párrafo por línea, como en Figma.
  subtitleLines: [
    "Ofrecemos soluciones de Diseño UX/UI para reducir fricciones y construir software que tus usuarios amen.",
    "La IA construye rápido, nosotros le damos gusto y coherencia.",
  ],
  secondaryCta: { label: "Ver proyectos", href: "#trabajo" },
};

// El problema (Figma: Asilo Core, "Dolores"): tres tarjetas, cada una lleva al servicio que la resuelve.
export const problemSection = {
  tagline: "El problema",
  titleLines: ["Tu app crece, pero no", "crece con tu marca."],
  subtitle:
    "Cada mes se suman funciones, pantallas y usuarios. Pero sin una base de diseño ese crecimiento pierde gusto y coherencia, y se ve cada vez más como todas las demás. Tus usuarios, que usan las mejores apps del mundo todos los días, lo notan.",
};

export interface InfoCard {
  // Ícono del decorador de la tarjeta (solo "El problema").
  icon?: "copy" | "branch" | "eye-off";
  title: string;
  body: string;
  link?: { label: string; href: string };
}

export const problemCards: InfoCard[] = [
  {
    icon: "copy",
    title: "Todas se ven igual",
    body: "Lovable, las plantillas y la IA parten de los mismos patrones por defecto. Se hace rápido, pero crea deuda de UX y no refleja lo que busca tu marca.",
    link: { label: "Diseño y rediseño →", href: "#servicios" },
  },
  {
    icon: "branch",
    title: "Cada versión se parece menos a la anterior",
    body: "Cada función nueva se resuelve por separado: un prompt, un desarrollador, un apuro. Sin un sistema que guarde las decisiones, el producto pierde coherencia con cada entrega.",
    link: { label: "Design System →", href: "#servicios" },
  },
  {
    icon: "eye-off",
    title: "Funciona, pero no se ve bien",
    body: "Tus usuarios no te comparan con la competencia local, sino con las mejores apps que usan. Una interfaz descuidada se lee como un negocio descuidado.",
    link: { label: "UX Audit →", href: "#servicios" },
  },
];

// Franja de logos al pie del hero (Figma: Asilo Services, nodo 91:7568). Se muestran en blanco.
// TODO: reemplazar con logos reales de clientes (con permiso), en SVG. Los de Figma son de marcas
// que no son clientes (Webflow y Relume), así que mientras tanto van logos neutros de relleno.
export const clientLogos = Array.from({ length: 6 }, (_, i) => ({
  src: `/placeholders/logo-${i + 1}.svg`,
  alt: `Cliente 0${i + 1}`,
}));

export interface Project {
  name: string;
  description: string;
  tags: string[];
  image: { src: string; alt: string };
}

// Proyectos (Figma: Asilo Services, nodo 91:7755). Imágenes exportadas de Figma a 2× (811×568).
export const projectsSection = {
  titleLines: ["Productos que se diferencian", "por su calidad."],
  subtitle:
    "Diseñamos e implementamos productos para empresas locales e internacionales, con el mismo estándar: buen gusto, usabilidad y coherencia para crecer.",
};

// TODO: reemplazar las descripciones de relleno con una línea real por proyecto.
const PLACEHOLDER_DESCRIPTION = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";

export const projects: Project[] = [
  {
    name: "Olímpica App",
    description: PLACEHOLDER_DESCRIPTION,
    tags: ["UI/UX", "E-commerce"],
    image: { src: "/servicios/proyectos/olimpica.webp", alt: "Olímpica App: bienvenida, supermercado y carrito de compras" },
  },
  {
    name: "Tillin",
    description: PLACEHOLDER_DESCRIPTION,
    tags: ["UI/UX", "Branding"],
    image: { src: "/servicios/proyectos/tilin.webp", alt: "Tillin: perfil del técnico, inicio, búsqueda y pago de un servicio" },
  },
  {
    name: "Gama",
    description: PLACEHOLDER_DESCRIPTION,
    tags: ["Web", "UI/UX", "Implementación"],
    image: { src: "/servicios/proyectos/gama.webp", alt: "Gama: pantalla de la caja de autopago con la lista de productos" },
  },
  {
    name: "Diners Club Mall App",
    description: PLACEHOLDER_DESCRIPTION,
    tags: ["UI/UX", "E-commerce"],
    image: { src: "/servicios/proyectos/diners.webp", alt: "Diners Club Mall App: inicio, ficha de producto y confirmación de compra" },
  },
  {
    name: "Mattelsa",
    description: PLACEHOLDER_DESCRIPTION,
    tags: ["UX Assessment", "Web"],
    image: { src: "/servicios/proyectos/mattelsa.webp", alt: "Mattelsa: inicio de sesión, portada, ficha de una camiseta y bolsa de compras" },
  },
  {
    name: "Corona App",
    description: PLACEHOLDER_DESCRIPTION,
    tags: ["UI/UX", "Implementación"],
    image: { src: "/servicios/proyectos/corona.webp", alt: "Corona App: inicio, ingreso y catálogo de productos" },
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
}

// Servicios (Figma: Asilo Core, "Servicios"). El título lleva una segunda línea más liviana.
export const servicesSection = {
  titleLines: ["Nuestros servicios", "Diseño de productos digitales UX/UI"],
};

// TODO: en Figma solo está armado el panel de UX Audit. El copy de "Diseño y rediseño" sale de la v2
// (pestaña Product Design) y el de "Design System" es provisional: confirmarlos con el equipo, y agregar sus precios.
export const serviceTabs: ServiceTab[] = [
  {
    id: "ux-audit",
    label: "UX Audit",
    title: "Descubre qué está frenando a tus usuarios.",
    body: "Para equipos que saben que algo no funciona, pero no saben qué arreglar primero. Revisamos tu producto con heurísticas de UX/UI, flujos y performance, y te entregamos los hallazgos por severidad con una hoja de ruta clara. Aproximadamente un mes.",
    items: [
      "Evaluación heurística de UX/UI",
      "Flujos clave y arquitectura de información",
      "Revisión visual y de marca",
      "Hallazgos por severidad y hoja de ruta",
      "Presentación en vivo con tu equipo",
    ],
    price: "Desde USD 500",
  },
  {
    id: "diseno-rediseno",
    label: "Diseño y rediseño",
    title: "Interfaces que se ven y se sienten hechas por alguien a quien le importa.",
    body: "Diseñamos tu producto desde el MVP hasta su versión escalada, con criterio visual en cada decisión. Trabajamos junto a tu equipo de desarrollo y entregamos interfaces listas para construir: lo que lanzamos es lo que tus usuarios ven.",
    items: [
      "Diseño UI y UX",
      "MVP y prototipos",
      "Flujos de usuario y wireframes",
      "Diseño mobile y responsive",
      "Pruebas de usabilidad e iteración",
    ],
  },
  {
    id: "design-system",
    label: "Design System",
    title: "Un sistema que guarde tus decisiones de diseño.",
    body: "Ordenamos las decisiones de tu producto en componentes, estilos y reglas que tu equipo puede reutilizar, para que cada pantalla nueva mantenga la coherencia de la anterior.",
    items: [
      "Auditoría de la interfaz existente",
      "Tokens de color, tipografía y espaciado",
      "Librería de componentes",
      "Documentación de uso",
      "Traspaso al equipo de desarrollo",
    ],
  },
];

// Cómo trabajamos (Figma: Asilo Core): tres pasos en tarjetas.
export const processSection = {
  titleLines: ["Nos adelantamos al código."],
  subtitle:
    "No entregamos pantallas estáticas. Creamos prototipos altamente funcionales, integrados con código, para que valides tu producto antes de desarrollar y tu equipo implemente más fácil y más rápido.",
};

export const processCards: InfoCard[] = [
  { title: "01 · Diagnosticamos", body: "Entendemos tu producto, tus usuarios y lo que necesitas lograr." },
  { title: "02 · Diseñamos y prototipamos con código", body: "Validas la experiencia funcionando, antes de invertir en desarrollo." },
  { title: "03 · Implementamos o acompañamos", body: "El desarrollo arranca con todo definido y avanza más rápido." },
];

// Con quién trabajamos (Figma: Asilo Core): cierre antes de los testimonios, con botón al formulario.
export const audienceSection = {
  titleLines: ["Trabajamos con quienes quieren", "hacer las cosas distinto."],
  subtitle:
    "Si para ti basta con que funcione, probablemente no somos tu equipo. Si quieres un producto de primer nivel, del que tus usuarios hablen bien, hablemos.",
  ctaLabel: "Hablemos",
};

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
// Figma tiene seis puntos en el slider; el número de puntos sale de esta lista.
export const testimonials: Testimonial[] = Array.from({ length: 6 }, (_, i) => ({
  quote:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare.",
  name: "Nombre Apellido",
  role: "Cargo, Empresa",
  avatar: "/servicios/testimonios/avatar-placeholder.webp",
  // Logos neutros de relleno (los de Figma son de una marca real que no es cliente).
  logo: { src: `/placeholders/logo-${i + 1}.svg`, alt: `Cliente 0${i + 1}` },
}));

// TODO: confirmar el correo de contacto definitivo (es el mismo de la v1).
export const CONTACT_EMAIL = "hola@asilodigital.com";

export interface FaqItem {
  question: string;
  answer: string;
}

// FAQ (Figma: Asilo Core). Ya no lleva la tarjeta de contacto.
export const faqSection = {
  tagline: "¿Aún tienes dudas?",
  titleLines: ["Preguntas", "frecuentes"],
};

// TODO: en Figma solo está la respuesta de la primera pregunta. Las demás salen de la v2; la del prototipo
// funcional y la de precios son provisionales hasta que el equipo las confirme.
export const faqItems: FaqItem[] = [
  {
    question: "¿Necesito saber de tecnología para trabajar con ustedes?",
    answer:
      "No. Tú nos cuentas qué quieres lograr y nosotros lo convertimos en un producto. Te acompañamos en cada decisión.",
  },
  {
    question: "¿Con qué tipo de empresas trabajan?",
    answer:
      "Con empresas, instituciones, startups y creadores que quieren adoptar tecnología con claridad. Desde un emprendimiento que está arrancando hasta una organización que necesita digitalizar sus procesos.",
  },
  {
    question: "¿Cómo es el trabajo día a día con ustedes?",
    answer:
      "Con un canal de comunicación compartido y revisiones periódicas. Ves el avance desde el primer día y no esperas a una gran entrega final para opinar.",
  },
  {
    question: "¿Qué es un prototipo funcional?",
    answer:
      "Es una versión de tu producto que ya funciona: tiene interacción real y está integrada con código. Así validas la experiencia antes de desarrollar y tu equipo implementa más fácil y más rápido.",
  },
  {
    question: "¿Qué tan rápido pueden empezar?",
    answer:
      "Normalmente en pocos días. Si necesitas arrancar esta semana, cuéntanoslo en la primera conversación y organizamos el equipo alrededor de tu fecha.",
  },
  {
    question: "¿Cuánto cuesta trabajar con Asilo Labs?",
    answer:
      "Depende del alcance. Un UX Audit parte desde USD 500; los proyectos de diseño y rediseño y de design system se cotizan según lo que necesites. Después de conocer tu contexto te enviamos una propuesta clara, con alcance, tiempos y costos, sin sorpresas.",
  },
];

// CTA final (Figma: Asilo Core). El botón lleva al formulario (CTA_HREF).
export const finalCta = {
  title: "Empecemos hoy.",
  ctaLabel: "Audita mi producto",
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
  tagline: "Buen gusto y coherencia.",
  copyright: `© ${new Date().getFullYear()} Asilo Labs. Todos los derechos reservados`,
};
