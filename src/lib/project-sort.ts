/**
 * Directory ordering. Pure and shared by the SSR pages, the refresh partial
 * and the JSON API so every surface sorts the same way.
 */

import type { Project } from "../data/projects";

/** Orders offered as tabs on /proyectos, in display order. */
export const SORT_OPTIONS = [
  { value: "recientes", label: "Últimos añadidos" },
  { value: "visitas", label: "Más visitados" },
  { value: "trending", label: "Trending" },
  { value: "az", label: "A–Z" },
] as const;

/**
 * Every order `?orden=` accepts. "za" has no tab but keeps working so links
 * shared before the redesign still land on the order they promised.
 */
export const SORT_MODES = [...SORT_OPTIONS.map((option) => option.value), "za"] as const;

export type SortMode = (typeof SORT_MODES)[number];

export const DEFAULT_SORT: SortMode = "recientes";

const SORT_VALUES = new Set<string>(SORT_MODES);

/** Reads `?orden=` defensively: anything unknown falls back to the default. */
export function parseSortMode(raw: string | null | undefined): SortMode {
  return raw && SORT_VALUES.has(raw) ? (raw as SortMode) : DEFAULT_SORT;
}

// Spanish collation, accent- and case-insensitive: "Ábaco" sorts with "abaco".
const byTitle = new Intl.Collator("es", { sensitivity: "base", numeric: true });

type Sortable = Pick<Project, "title" | "addedIndex" | "addedAt" | "visits" | "trending">;

// Descending by a numeric field; projects without a value go last.
const desc = (field: "addedIndex" | "addedAt" | "visits" | "trending") =>
  (a: Sortable, b: Sortable) => (b[field] ?? -1) - (a[field] ?? -1);

/** Returns a new, sorted array; never mutates the input. */
export function sortProjects<T extends Sortable>(projects: readonly T[], mode: SortMode): T[] {
  const list = [...projects];
  const az = (a: T, b: T) => byTitle.compare(a.title, b.title);

  switch (mode) {
    case "az":
      return list.sort(az);
    case "za":
      return list.sort((a, b) => az(b, a));
    case "recientes":
      // The sheet is append-only, so row position is the reliable "added"
      // order; the Fecha column only breaks ties (e.g. placeholder data).
      return list.sort((a, b) => desc("addedIndex")(a, b) || desc("addedAt")(a, b) || az(a, b));
    case "visitas":
      return list.sort((a, b) => desc("visits")(a, b) || az(a, b));
    case "trending":
      return list.sort((a, b) => desc("trending")(a, b) || az(a, b));
  }
}
