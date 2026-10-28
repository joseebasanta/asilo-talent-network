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
