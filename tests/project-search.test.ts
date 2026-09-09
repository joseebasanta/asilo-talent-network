import { describe, expect, it } from "vitest";
import { filterProjects } from "../src/lib/project-search";
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
