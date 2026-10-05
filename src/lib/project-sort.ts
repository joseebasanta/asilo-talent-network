/**
 * Directory ordering. Pure and shared by the SSR page, the refresh partial
 * and the JSON API so every surface sorts the same way.
 */

import type { Project } from "../data/projects";

export const SORT_OPTIONS = [
  { value: "recientes", label: "Más recientes" },
  { value: "az", label: "Nombre: A–Z" },
  { value: "za", label: "Nombre: Z–A" },
] as const;

export type SortMode = (typeof SORT_OPTIONS)[number]["value"];

export const DEFAULT_SORT: SortMode = "az";

const SORT_VALUES = new Set<string>(SORT_OPTIONS.map((option) => option.value));

/** Reads `?orden=` defensively: anything unknown falls back to the default. */
export function parseSortMode(raw: string | null | undefined): SortMode {
  return raw && SORT_VALUES.has(raw) ? (raw as SortMode) : DEFAULT_SORT;
}

// Spanish collation, accent- and case-insensitive: "Ábaco" sorts with "abaco".
const byTitle = new Intl.Collator("es", { sensitivity: "base", numeric: true });

/** Returns a new, sorted array; never mutates the input. */
export function sortProjects<T extends Project>(projects: readonly T[], mode: SortMode): T[] {
  const list = [...projects];
  const az = (a: T, b: T) => byTitle.compare(a.title, b.title);

  switch (mode) {
    case "az":
      return list.sort(az);
    case "za":
      return list.sort((a, b) => az(b, a));
    case "recientes":
      return list.sort(
        (a, b) => (b.addedIndex ?? -1) - (a.addedIndex ?? -1) || az(a, b),
      );
  }
}
