import { describe, expect, it } from "vitest";
import { filterProjects, paginateProjects, projectPageUrl } from "../src/lib/project-search";
import type { Project } from "../src/data/projects";
const projects: Project[] = [
  { title: "Zeta", author: "María Pérez", description: "Pagos para equipos", tags: ["Fintech"], href: "https://example.com/z" },
  { title: "Ávila", author: "Luis", description: "Diseño con inteligencia artificial", tags: ["AI", "Diseño"], href: "https://example.com/a" },
  { title: "Builder", author: "María", description: "Herramientas para equipos", tags: ["AI", "SaaS"], href: "https://example.com/b" },
];
describe("project discovery", () => {
  it("matches words across fields regardless of accents, case, or whitespace", () => {
    expect(filterProjects(projects, "  MARIA equipos  ", [], "az").map(p => p.title)).toEqual(["Builder", "Zeta"]);
    expect(filterProjects(projects, "avila diseno", [], "az").map(p => p.title)).toEqual(["Ávila"]);
  });
  it("combines search with any selected category and does not duplicate multi-tag matches", () => {
    expect(filterProjects(projects, "equipos", ["ai", "fintech"], "az").map(p => p.title)).toEqual(["Builder", "Zeta"]);
    expect(filterProjects(projects, "", ["AI", "SaaS"], "az")).toHaveLength(2);
    expect(filterProjects(projects, "pagos", ["AI"], "az")).toEqual([]);
  });
  it("sorts in both directions without changing the source order", () => {
    expect(filterProjects(projects, "", [], "az").map(p => p.title)).toEqual(["Ávila", "Builder", "Zeta"]);
    expect(filterProjects(projects, "", [], "za").map(p => p.title)).toEqual(["Zeta", "Builder", "Ávila"]);
    expect(projects[0].title).toBe("Zeta");
    expect(filterProjects([], "", [], "az")).toEqual([]);
  });
});

describe("project pagination", () => {
  const items = Array.from({ length: 25 }, (_, index) => index);
  it("shows ten items per page, with no overlap and a partial final page", () => {
    expect(paginateProjects(items, 1).items).toEqual(items.slice(0, 10));
    expect(paginateProjects(items, 2)).toMatchObject({ items: items.slice(10, 20), page: 2, start: 11, end: 20, totalPages: 3 });
    expect(paginateProjects(items, 3).items).toEqual(items.slice(20));
  });
  it("clamps invalid pages and handles empty or shrinking result sets", () => {
    for (const page of [0, -1, NaN, Infinity]) expect(paginateProjects(items, page).page).toBe(1);
    expect(paginateProjects(items, 999).page).toBe(3);
    expect(paginateProjects(items.slice(0, 3), 3)).toMatchObject({ page: 1, totalPages: 1, end: 3 });
    expect(paginateProjects([], 2)).toMatchObject({ page: 1, totalPages: 1, start: 0, end: 0, items: [] });
    expect(paginateProjects(items.slice(0, 10), 1).totalPages).toBe(1);
  });
  it("preserves search, categories, and sort when linking to another page", () => {
    const url = new URL("https://example.com/proyectos?q=ai&categoria=AI&categoria=SaaS&orden=za&pagina=2");
    const next = new URL(projectPageUrl(url, 3), url);
    expect(next.searchParams.getAll("categoria")).toEqual(["AI", "SaaS"]);
    expect(next.searchParams.get("q")).toBe("ai");
    expect(next.searchParams.get("orden")).toBe("za");
    expect(next.searchParams.get("pagina")).toBe("3");
    expect(projectPageUrl(url, 1)).not.toContain("pagina=");
  });
});
