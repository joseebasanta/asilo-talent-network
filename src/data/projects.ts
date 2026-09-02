/**
 * Seam for the "Proyectos" directory.
 *
 * The live page renders ten identical placeholder cards (all `Directorio de
 * Builders`, all linking to `#`). We keep the fixture static for exact visual
 * parity, but the shape is deliberately source-agnostic: a future server
 * loader — e.g. `loadProjects()` backed by Google Sheets or Appwrite TablesDB —
 * can replace this array with the same `Project[]` type and the
 * `ProjectDirectory` component needs no changes.
 */
export type Project = {
  href: string;
  title: string;
  description: string;
  author: string;
  tags: string[];
};

const placeholderProject: Project = {
  href: "#",
  title: "Directorio de Builders",
  description:
    "Encuentra y conecta con desarrolladores WebGL, Rust y TypeScript en todo el mundo.",
  author: "Por Carlos Mendoza",
  tags: ["AI", "SAAS", "Business analitics"],
};

// Exactly ten entries to match the live ordered card grid.
export const projects: Project[] = Array.from({ length: 10 }, () => ({
  ...placeholderProject,
}));