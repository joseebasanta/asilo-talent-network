// Contenido de la landing de servicios de Asilo Digital (/servicios).
// Todo el copy, los links y las rutas de imágenes viven aquí para editarlos sin tocar el markup.
// Las imágenes son placeholders en /public/placeholders: reemplaza el archivo y mantén el nombre.

export const CTA_LABEL = "Contáctanos";

// Todos los CTA principales abren WhatsApp con un mensaje prellenado.
export const WHATSAPP_NUMBER = "584126310981";
export const CTA_HREF = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hola, Asilo Digital. Quiero conversar sobre mi app.",
)}`;

// TODO: confirmar el correo de contacto definitivo.
export const CONTACT_EMAIL = "hola@asilodigital.com";

export interface ImageAsset {
  src: string;
  alt: string;
}

export const hero = {
  title: "Hacemos que tu app se entienda.",
  subtitle:
    "Diagnosticamos tu UX, rediseñamos tu producto con identidad propia y lo llevamos a producción.",
  secondaryCta: { label: "Ver servicios", href: "#servicios" },
  proof: "Comunidad tech de LatAm desde 2021",
  // TODO: reemplazar con avatares reales de la comunidad.
  avatars: [1, 2, 3, 4, 5].map((n) => `/placeholders/avatar-${n}.webp`),
  // TODO: reemplazar con logos reales de clientes (con permiso). SVG o PNG en escala de grises.
  clientLogos: [1, 2, 3, 4, 5, 6].map((n) => ({ src: `/placeholders/logo-${n}.svg`, name: `Cliente ${n}` })),
};

// Pantallas de teléfono en cascada sobre un fondo; avanzan una tras otra (phone-stack.ts).
// La primera pantalla es la que va adelante. Imágenes en PNG/WebP con fondo transparente.
export interface PhoneStack {
  background: string;
  screens: ImageAsset[];
}

export interface Service {
  number: string;
  name: string;
  hook: string;
  // Sigue al gancho en la descripción del servicio abierto.
  detail: string;
  includes: string[];
  // Cada servicio muestra un stack animado o, si no lo tiene, una imagen fija.
  stack?: PhoneStack;
  image?: ImageAsset;
}

export const services: Service[] = [
  {
    number: "01",
    name: "UX Assessment",
    hook: "Tu app no convierte y no sabes por qué.",
    detail:
      "La revisamos como lo haría un usuario nuevo, encontramos dónde se pierde la gente y te decimos qué cambiar primero.",
    includes: [
      "Auditoría heurística",
      "Análisis de flujos críticos",
      "Benchmark de competidores",
      "Reporte con quick wins",
    ],
    // Diseño: Figma "Asilo Services", nodo 28:838. Fondo exportado de Figma; pantallas a 2×.
    stack: {
      background: "/services/ux-assessment/background.webp",
      screens: [
        { src: "/services/ux-assessment/screen-1.webp", alt: "Tilín: pantalla de búsqueda del mejor profesional" },
        { src: "/services/ux-assessment/screen-2.webp", alt: "Tilín: inicio con promociones y servicios rápidos" },
        { src: "/services/ux-assessment/screen-3.webp", alt: "Mattelsa: ficha de producto de una camiseta" },
      ],
    },
  },
  {
    number: "02",
    name: "UI/UX e Identidad",
    hook: "Tu app funciona, pero se ve como todas.",
    detail:
      "Rediseñamos los flujos que más importan y le damos una identidad que se reconoce, con un design system para que tu equipo siga sin perder consistencia.",
    includes: ["Rediseño de flujos", "UI de alta fidelidad", "Identidad de marca", "Design system base"],
    // TODO: reemplazar por una composición como la de UX Assessment.
    image: { src: "/projects/tilin.webp", alt: "Pantallas de Tilín, app de servicios para el hogar" },
  },
  {
    number: "03",
    name: "Implementaciones",
    hook: "Tienes el diseño, falta construirlo.",
    detail:
      "Lo llevamos a producción en Framer, Webflow o front-end, y revisamos cada pantalla para que se vea y funcione como se diseñó.",
    includes: ["Sitios en Framer/Webflow", "Front-end", "QA de diseño"],
    // TODO: reemplazar por una composición como la de UX Assessment.
    image: { src: "/projects/gama.webp", alt: "Cajas de autopago de Automercados Gama" },
  },
];

export interface Project {
  name: string;
  year: string;
  tags: string;
  image: ImageAsset;
}

// Proyectos recientes: cuadrícula de 3 columnas dentro del hero.
// Las imágenes son shots de https://dribbble.com/ifcam (carpeta /public/projects, 1200×900).
export const projects: Project[] = [
  { name: "Olímpica App", year: "2024", tags: "UI/UX, E-commerce", image: { src: "/projects/olimpica.webp", alt: "Olímpica App 2024, diseño de app de e-commerce" } },
  { name: "Tillín", year: "2026", tags: "UI/UX e Identidad, Logística", image: { src: "/projects/tilin.webp", alt: "Tilín, app de servicios para el hogar" } },
  { name: "Gama", year: "2024", tags: "Implementaciones, Web", image: { src: "/projects/gama.webp", alt: "Automercados Gama, cajas de autopago" } },
  { name: "Diners Club Mall App", year: "2023", tags: "UI/UX, E-commerce", image: { src: "/projects/diners.webp", alt: "Diners Club Mall App 2023, diseño de app" } },
  { name: "Mattelsa", year: "2024", tags: "UX Assessment, Web", image: { src: "/projects/mattelsa.webp", alt: "Mattelsa Redesign 2024, tienda de moda" } },
  { name: "Corona App", year: "2023", tags: "UI/UX, Moda", image: { src: "/projects/corona.webp", alt: "Corona App 2023, diseño de app de moda" } },
];

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  avatar: string;
}

export const testimonials = {
  title: "Lo que dicen los equipos con los que trabajamos.",
  // TODO: reemplazar con testimonios reales (con permiso): cita, nombre, cargo · empresa y foto.
  items: [1, 2, 3].map(
    (n): Testimonial => ({
      quote:
        "Aquí va el testimonio de un cliente: qué problema tenía, qué cambió después de trabajar con Asilo y un resultado concreto.",
      name: "Nombre Apellido",
      role: "Cargo · Empresa",
      avatar: `/placeholders/testimonial-${n}.webp`,
    }),
  ),
};

export interface FaqItem {
  question: string;
  answer: string;
}

export const faq = {
  eyebrow: "¿Aún tienes dudas?",
  title: "Preguntas frecuentes.",
  card: {
    title: "¿No encuentras tu respuesta?",
    body: "Lo hablamos en una llamada.",
    emailLabel: "O escríbenos a",
    // TODO: reemplazar con la foto de quien atiende las llamadas.
    avatar: "/placeholders/faq-contact.webp",
  },
  // TODO: confirmar las respuestas con el equipo antes de publicar.
  items: [
    {
      question: "¿Con quién trabajan mejor?",
      answer:
        "Con founders y PMs de startups latinoamericanas que ya tienen una app en manos de usuarios, o están por lanzarla, y sienten que no se entiende como debería.",
    },
    {
      question: "¿En qué nos pueden ayudar exactamente?",
      answer:
        "En tres cosas: diagnosticar la UX de tu app, rediseñarla con identidad propia y llevar ese diseño a producción. Puedes contratar una sola o las tres.",
    },
    {
      question: "¿Son una agencia de diseño o de desarrollo?",
      answer:
        "Somos un estudio de diseño de producto. También implementamos: construimos sitios en Framer o Webflow, hacemos front-end y revisamos que lo construido respete el diseño.",
    },
    {
      question: "¿Pueden ayudarnos con un producto desde cero?",
      answer:
        "Sí. Empezamos por entender el problema que resuelve tu producto y a quién se lo resuelve, y desde ahí diseñamos los primeros flujos y la identidad.",
    },
    {
      question: "¿Cuánto cuesta trabajar con ustedes?",
      answer:
        "Depende del alcance. Después de la llamada de diagnóstico te enviamos una propuesta con entregables, tiempos y precio, para que decidas con todo sobre la mesa.",
    },
    {
      question: "¿Qué tan rápido pueden empezar?",
      answer: "Depende de nuestra agenda en ese momento. En la llamada te decimos la fecha de inicio más cercana.",
    },
    {
      question: "¿Cómo trabajamos día a día?",
      answer:
        "Con un canal de comunicación compartido y revisiones periódicas. Ves el avance desde el primer día y no esperas a una gran entrega final para opinar.",
    },
    {
      question: "¿Pueden trabajar con nuestro equipo interno?",
      answer:
        "Sí. Trabajamos junto a tu equipo de producto y desarrollo, y les dejamos la documentación y el design system para que sigan sin nosotros.",
    },
  ] satisfies FaqItem[],
};

export const contact = {
  title: "Hagamos que tu app se entienda.",
  emailLabel: "o escríbenos a",
};

export interface SocialLink {
  label: string;
  href: string;
  icon: "telegram" | "x" | "instagram" | "linkedin";
}

export const socialLinks: SocialLink[] = [
  // TODO: confirmar el link del canal de Telegram.
  { label: "Telegram", href: "https://t.me/asilodigital", icon: "telegram" },
  { label: "X", href: "https://x.com/asilodigital", icon: "x" },
  { label: "Instagram", href: "https://www.instagram.com/asilodigitalcom/", icon: "instagram" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/asilodigital/", icon: "linkedin" },
];

export const footer = {
  tagline: "La comunidad de los ciudadanos de internet",
  // TODO: apuntar a las páginas reales de Privacidad y Términos.
  legal: [
    { label: "Privacidad", href: "#" },
    { label: "Términos", href: "#" },
  ],
};

export const seo = {
  title: "Asilo Digital — Diseño de producto que se entiende",
  description:
    "Estudio de diseño de producto nacido como comunidad tech en LatAm. Diagnosticamos tu UX, rediseñamos tu app con identidad propia y la llevamos a producción.",
};
