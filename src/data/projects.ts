/** Original placeholders used when the approved-project source is unavailable. */
export type Project = {
  href: string;
  title: string;
  description: string;
  author: string;
  tags: string[];
  /** Public logo view URL, when the project submitted a logo. */
  logoUrl?: string;
  /** Local Pixelarticons fallback selected from the first project category. */
  iconUrl?: string;
  /** Row date from the sheet (epoch ms); drives "Últimos añadidos". */
  addedAt?: number;
  /** Optional sheet counters; drive "Más visitados" and "Trending". */
  visits?: number;
  trending?: number;
};

const placeholderDescription =
  "Encuentra y conecta con desarrolladores WebGL, Rust y TypeScript en todo el mundo.";

/**
 * One demo project per category the live directory shows, so the category
 * filter has the same options without credentials. Real data replaces these
 * as soon as the Google Sheet is configured.
 */
const placeholderCategories = [
  "Blockchain & Crypto", "Business Analytics", "Ciberseguridad", "Data Science",
  "DevTools & APIs", "Diseño & Creatividad", "E-commerce", "Edtech", "Fintech",
  "Healthtech", "Logística", "Marketplace", "Movilidad", "No-Code & CMS",
  "PropTech", "SaaS", "Social & Comunidad",
];

export const projects: Project[] = [
  {
    href: "#",
    title: "Directorio de Builders",
    description: placeholderDescription,
    author: "Por Carlos Mendoza",
    tags: ["Inteligencia Artificial", "SaaS", "Business Analytics"],
  },
  ...placeholderCategories.map((category) => ({
    href: "#",
    title: `Proyecto de ejemplo · ${category}`,
    description: placeholderDescription,
    author: "Por Carlos Mendoza",
    tags: [category],
  })),
];
