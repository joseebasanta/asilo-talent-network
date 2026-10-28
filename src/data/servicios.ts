// Contenido de la landing de servicios de Asilo Digital, versión 2 (/servicios).
// La v1 quedó guardada en la rama landing-page-v1-2026-10-28 y en el tag servicios-v1-2026-10-28.
// Cada sección que llegue desde Figma agrega aquí su copy, links y rutas de imágenes.

export const seo = {
  title: "Asilo Digital — Diseño de producto que se entiende",
  description:
    "Estudio de diseño de producto nacido como comunidad tech en LatAm. Diagnosticamos tu UX, rediseñamos tu app con identidad propia y la llevamos a producción.",
};

export const CTA_LABEL = "Contáctanos";

// El CTA principal abre WhatsApp con un mensaje prellenado (mismo número que la v1).
export const WHATSAPP_NUMBER = "584126310981";
export const CTA_HREF = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hola, Asilo Digital. Quiero conversar sobre mi app.",
)}`;

export interface NavLink {
  label: string;
  href: string;
}

// Nav (Figma: Asilo Services, nodo 91:7190). Las anclas apuntan a secciones que se van sumando.
export const navLinks: NavLink[] = [
  { label: "Servicios", href: "#servicios" },
  { label: "Nuestro trabajo", href: "#trabajo" },
  { label: "Contacto", href: "#contacto" },
];

// Hero (Figma: Asilo Services, nodo 91:7203).
export const hero = {
  // Una frase por línea, como en Figma.
  titleLines: ["Todas las apps se ven igual.", "La tuya no debería."],
  subtitle:
    "Las apps ya se pueden generar en minutos, y todas terminan viéndose igual. Nosotros les damos lo que no se automatiza: taste, estilo y cuidado al detalle.",
  secondaryCta: { label: "Ver servicios", href: "#servicios" },
};

export interface Project {
  name: string;
  description: string;
  tags: string[];
  image: { src: string; alt: string };
}

// Proyectos (Figma: Asilo Services, nodo 91:7755). Imágenes exportadas de Figma a 2× (811×568).
export const projectsSection = {
  tagline: "Proyectos",
  title: "Diferénciate de otras apps acelerado con AI",
  subtitle:
    "Un equipo que traduce la tecnología a tu contexto y la convierte en productos que se ven, se sienten y funcionan mejor.",
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
}

// Servicios (Figma: Asilo Services, nodo 91:7299). Websites sale del panel de Figma; el copy de las
// otras pestañas sale de la capa de texto "Servicios (ES)" del mismo archivo.
export const servicesSection = {
  tagline: "Servicios",
  titleLines: ["Que funcione es lo mínimo.", "Que se sienta bien es lo nuestro."],
  subtitle:
    "Auditamos, diseñamos, construimos e implementamos productos digitales que no se ven como todos los demás.",
};

export const serviceTabs: ServiceTab[] = [
  {
    id: "websites",
    label: "Websites",
    title: "Sitios que se sienten como una marca, no como una plantilla.",
    body: "Diseñamos y construimos en un solo equipo, sin traspasos ni versiones que pierden detalle en el camino. El sitio sale a producción viéndose exactamente como se diseñó, con tipografía, ritmo y movimiento pensados a mano.",
    items: [
      "Landing pages y marketing websites",
      "Identidad visual aplicada a web",
      "Arquitectura de contenido y CMS",
      "Estructura lista para SEO",
      "Rendimiento y QA",
    ],
  },
  {
    id: "product-design",
    label: "Product Design",
    title: "Interfaces que se ven y se sienten hechas por alguien a quien le importa.",
    body: "Diseñamos tu producto desde el MVP hasta su versión escalada, con criterio visual en cada decisión. Trabajamos junto a tu equipo de desarrollo y entregamos interfaces listas para construir: lo que lanzamos es lo que tus usuarios ven.",
    items: [
      "Diseño UI y UX",
      "MVP y prototipos",
      "Sistemas de diseño y librerías de componentes",
      "Flujos de usuario y wireframes",
      "Diseño mobile y responsive",
      "Pruebas de usabilidad e iteración",
    ],
  },
  {
    id: "ux-audit",
    label: "UX Audit",
    title: "Tu app no convierte y no sabes por qué.",
    body: "Revisamos tu producto con ojo de diseñador: dónde se pierde la gente, qué se siente genérico y qué detalles frenan la confianza. Te entregamos un diagnóstico claro y un plan priorizado por impacto, no un PDF de 80 páginas.",
    items: [
      "Auditoría heurística de UX y UI",
      "Análisis de flujos y puntos de fricción",
      "Revisión de onboarding y conversión",
      "Evaluación de consistencia visual (taste audit)",
      "Benchmark de competidores",
      "Plan de mejoras priorizado",
    ],
  },
  {
    id: "implementaciones",
    label: "Implementaciones",
    title: "Tecnología que se integra a tu operación sin que tengas que entenderla.",
    body: "Llevamos la idea al despliegue: automatizaciones, integraciones con IA y herramientas internas ajustadas al contexto venezolano. Dejamos capacidades dentro de tu equipo para que todo siga funcionando cuando terminamos.",
    items: [
      "Flujos automatizados",
      "Integraciones con IA",
      "Sistemas internos y herramientas colaborativas",
      "APIs, autenticación e integraciones",
      "Formación y transferencia al equipo",
      "Acompañamiento continuo",
    ],
  },
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
