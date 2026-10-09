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

export const PROJECTS_PER_PAGE = 10;

export function paginateProjects<T>(projects: T[], requestedPage: number) {
  const totalPages = Math.max(1, Math.ceil(projects.length / PROJECTS_PER_PAGE));
  const page = Math.min(totalPages, Math.max(1, Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 1));
  const offset = (page - 1) * PROJECTS_PER_PAGE;
  return {
    page, totalPages,
    items: projects.slice(offset, offset + PROJECTS_PER_PAGE),
    start: projects.length ? offset + 1 : 0,
    end: Math.min(offset + PROJECTS_PER_PAGE, projects.length),
  };
}

export function projectPageUrl(currentUrl: URL, page: number) {
  const url = new URL(currentUrl);
  url.searchParams.delete("pagina");
  if (page > 1) url.searchParams.set("pagina", String(page));
  url.hash = "project-results";
  return `${url.pathname}${url.search}${url.hash}`;
}
