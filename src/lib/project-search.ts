import type { Project } from "../data/projects";
import { parseSortMode, sortProjects } from "./project-sort";

export const normalizeSearch = (value: string) => value.normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").trim();

export function filterProjects<T extends Project>(projects: T[], query: string, categories: string[], order: string) {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  const selected = categories.map(normalizeSearch);
  const matches = projects.filter((project) => {
    const text = normalizeSearch([project.title, project.description, project.author, ...project.tags].join(" "));
    return words.every((word) => text.includes(word)) &&
      (!selected.length || project.tags.some((tag) => selected.includes(normalizeSearch(tag))));
  });
  return sortProjects(matches, parseSortMode(order));
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
