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
  /** Stable public id (hash of the normalized website); absent on placeholders. */
  id?: string;
  /** `/proyectos/<slug>` detail page path segment; absent on placeholders. */
  slug?: string;
  /** Sheet position of the project's first approved revision (for "recientes"). */
  addedIndex?: number;
};

const placeholderProject: Project = {
  href: "#",
  title: "Directorio de Builders",
  description:
    "Encuentra y conecta con desarrolladores WebGL, Rust y TypeScript en todo el mundo.",
  author: "Por Carlos Mendoza",
  tags: ["AI", "SAAS", "Business analitics"],
};

export const projects: Project[] = Array.from({ length: 10 }, () => ({
  ...placeholderProject,
}));
