import type { Project } from "../data/projects";

export const normalizeSearch = (value: string) => value.normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").trim();

export const PROJECT_ORDERS = ["recientes", "visitas", "trending", "az"] as const;
export type ProjectOrder = (typeof PROJECT_ORDERS)[number];
export const DEFAULT_PROJECT_ORDER: ProjectOrder = "recientes";
export const parseProjectOrder = (value: string | null | undefined): ProjectOrder =>
  PROJECT_ORDERS.find((order) => order === value) ?? DEFAULT_PROJECT_ORDER;

type Sortable = Pick<Project, "title" | "addedAt" | "visits" | "trending">;
const byName = (a: Sortable, b: Sortable) => a.title.localeCompare(b.title, "es", { sensitivity: "base" });
// Descending by a numeric field; projects without a value go last, ties by name.
const byNumber = (field: "addedAt" | "visits" | "trending") => (a: Sortable, b: Sortable) =>
  (b[field] ?? -1) - (a[field] ?? -1) || byName(a, b);

const projectComparator = (order: string) =>
  order === "recientes" ? byNumber("addedAt")
    : order === "visitas" ? byNumber("visits")
    : order === "trending" ? byNumber("trending")
    : (a: Sortable, b: Sortable) => byName(a, b) * (order === "za" ? -1 : 1);

export function filterProjects<T extends Project>(projects: T[], query: string, categories: string[], order: string) {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  const selected = categories.map(normalizeSearch);
  return projects.filter((project) => {
    const text = normalizeSearch([project.title, project.description, project.author, ...project.tags].join(" "));
    return words.every((word) => text.includes(word)) &&
      (!selected.length || project.tags.some((tag) => selected.includes(normalizeSearch(tag))));
  }).sort(projectComparator(order));
}

/** Results revealed up front, and by each "Ver más" press. */
export const PROJECTS_PAGE_SIZE = 10;

/** Clamps a requested visible count to whole steps of PROJECTS_PAGE_SIZE (min 10). */
export function normalizeVisibleLimit(requested: number) {
  const value = Number.isFinite(requested) ? Math.floor(requested) : PROJECTS_PAGE_SIZE;
  return Math.max(PROJECTS_PAGE_SIZE, Math.ceil(value / PROJECTS_PAGE_SIZE) * PROJECTS_PAGE_SIZE);
}

export function limitProjects<T>(projects: T[], requestedLimit: number) {
  const limit = normalizeVisibleLimit(requestedLimit);
  const shown = Math.min(limit, projects.length);
  return { limit, items: projects.slice(0, limit), shown, total: projects.length, hasMore: projects.length > limit };
}

/** URL for the next batch; `mostrar` is only present once more than the initial 10 are visible. */
export function showMoreUrl(currentUrl: URL, limit: number) {
  const url = new URL(currentUrl);
  url.searchParams.delete("pagina");
  if (limit > PROJECTS_PAGE_SIZE) url.searchParams.set("mostrar", String(limit));
  else url.searchParams.delete("mostrar");
  url.hash = "project-results";
  return `${url.pathname}${url.search}${url.hash}`;
}
