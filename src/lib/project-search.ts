import type { Project } from "../data/projects";

export const normalizeSearch = (value: string) => value.normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").trim();

export function filterProjects<T extends Project>(projects: T[], query: string, categories: string[], order: string) {
  const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
  const selected = categories.map(normalizeSearch);
  return projects.filter((project) => {
    const text = normalizeSearch([project.title, project.description, project.author, ...project.tags].join(" "));
    return words.every((word) => text.includes(word)) &&
      (!selected.length || project.tags.some((tag) => selected.includes(normalizeSearch(tag))));
  }).sort((a, b) => a.title.localeCompare(b.title, "es", { sensitivity: "base" }) * (order === "za" ? -1 : 1));
}
