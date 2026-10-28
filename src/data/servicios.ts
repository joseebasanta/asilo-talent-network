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

// TODO: confirmar el correo de contacto definitivo (es el mismo de la v1).
export const CONTACT_EMAIL = "hola@asilodigital.com";

export interface FaqItem {
  question: string;
  answer: string;
}

// FAQ (Figma: Asilo Services, nodo 91:7493).
export const faqSection = {
  tagline: "¿Aún tienes dudas?",
  title: "Lee las FAQs",
  // En Figma esta tarjeta es una captura de referencia de otra agencia; aquí va con el copy de Asilo.
  card: {
    title: "¿No encuentras tu respuesta?",
    body: "Lo hablamos en una llamada.",
    emailLabel: "O escríbenos →",
    // TODO: reemplazar con la foto de quien atiende las llamadas.
    avatar: "/placeholders/faq-contact.webp",
  },
};

export const faqItems: FaqItem[] = [
  {
    question: "¿Necesito saber de tecnología para trabajar con ustedes?",
    answer:
      "No. Acompañamos desde cero a quienes tienen un negocio y necesitan un equipo de confianza. Nosotros traducimos la tecnología a tu idioma, tú nos cuentas qué quieres lograr.",
  },
  {
    question: "¿Con qué tipo de organizaciones trabajan?",
    answer:
      "Con empresas, instituciones, startups y creadores que quieren adoptar tecnología con claridad. Desde un emprendimiento que está arrancando hasta una organización que necesita digitalizar sus procesos.",
  },
  {
    question: "¿Cómo es el trabajo día a día con ustedes?",
    // TODO: en Figma dice "Respuesta por definir por servicio"; mientras tanto va la respuesta de la v1.
    answer:
      "Con un canal de comunicación compartido y revisiones periódicas. Ves el avance desde el primer día y no esperas a una gran entrega final para opinar.",
  },
  {
    question: "¿Pueden ayudarme a crear un producto desde cero?",
    answer:
      "Sí, y es donde más disfrutamos trabajar. No necesitas saber de tecnología para empezar: te ayudamos a definir el alcance, trazar los flujos de usuario, diseñar la experiencia, construir el producto o el sitio y acompañar el lanzamiento. Según lo que necesites, podemos ser tu equipo completo de ejecución o integrarnos con tu equipo actual de producto.",
  },
  {
    question: "¿Qué tan rápido pueden empezar?",
    answer:
      "Normalmente en pocos días. Si necesitas arrancar esta semana, cuéntanoslo en la primera conversación y organizamos el equipo alrededor de tu fecha.",
  },
  {
    question: "¿Cuánto cuesta trabajar con Asilo Digital?",
    answer:
      "Depende del alcance y del tipo de acompañamiento. Una evaluación UX inicial parte desde 600$; un sitio web desde 800$; y los productos o plataformas a medida se cotizan por fases. Si necesitas diseño, desarrollo o posicionamiento SEO de forma continua, ofrecemos planes mensuales ajustados a tu necesidad. Después de conocer tu contexto te enviamos una propuesta clara, con alcance, tiempos y costos, sin sorpresas.",
  },
];

// CTA final (Figma: Asilo Services, nodo 91:7534). El botón usa CTA_LABEL y CTA_HREF (WhatsApp).
export const finalCta = {
  title: "Cuéntanos qué estás construyendo",
  subtitle:
    "Te ayudamos a definir el alcance, el equipo, los tiempos y los próximos pasos adecuados para tu proyecto.",
};

export interface FooterLink {
  label: string;
  href: string;
}

// Footer (Figma: Asilo Services, nodo 91:7543). Mismo orden de redes que en Figma; los íconos están en
// /public/servicios/icons con el nombre de `icon`.
export const footerSocialLinks: (FooterLink & { icon: "instagram" | "x" | "linkedin" | "youtube" })[] = [
  { label: "Instagram", href: "https://www.instagram.com/asilodigitalcom/", icon: "instagram" },
  { label: "X", href: "https://x.com/asilodigital", icon: "x" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/asilodigital/", icon: "linkedin" },
  // TODO: agregar YouTube cuando tengamos el link del canal (el ícono ya está en /servicios/icons/youtube.svg):
  // { label: "YouTube", href: "https://www.youtube.com/@…", icon: "youtube" },
];

// TODO: Figma tiene "Política de privacidad", "Términos de servicio" y "Configuración de cookies".
// Se agregan aquí cuando existan esas páginas, para no publicar links que no llevan a ningún lado.
export const footerLegalLinks: FooterLink[] = [];

export const footer = {
  copyright: `© ${new Date().getFullYear()} Asilo Digital. Todos los derechos reservados`,
};
