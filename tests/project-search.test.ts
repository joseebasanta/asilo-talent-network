import { describe, expect, it } from "vitest";
import { filterProjects, limitProjects, normalizeVisibleLimit, parseProjectOrder, showMoreUrl } from "../src/lib/project-search";
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

describe("show more", () => {
  const items = Array.from({ length: 25 }, (_, index) => index);
  it("always starts with ten and reveals ten more per step", () => {
    expect(limitProjects(items, 10)).toMatchObject({ limit: 10, shown: 10, total: 25, hasMore: true });
    expect(limitProjects(items, 10).items).toEqual(items.slice(0, 10));
    expect(limitProjects(items, 20).items).toEqual(items.slice(0, 20));
    expect(limitProjects(items, 30)).toMatchObject({ limit: 30, shown: 25, hasMore: false });
    expect(limitProjects(items.slice(0, 10), 10).hasMore).toBe(false);
    expect(limitProjects([], 10)).toMatchObject({ shown: 0, total: 0, hasMore: false, items: [] });
  });
  it("normalizes invalid or off-step limits to whole steps of ten, never below ten", () => {
    for (const value of [0, -5, NaN, Infinity, 3]) expect(normalizeVisibleLimit(value)).toBe(10);
    expect(normalizeVisibleLimit(11)).toBe(20);
    expect(normalizeVisibleLimit(40)).toBe(40);
  });
  it("preserves search, categories, and sort when linking to the next batch", () => {
    const url = new URL("https://example.com/proyectos?q=ai&categoria=AI&categoria=SaaS&orden=trending&pagina=2");
    const next = new URL(showMoreUrl(url, 20), url);
    expect(next.searchParams.getAll("categoria")).toEqual(["AI", "SaaS"]);
    expect(next.searchParams.get("q")).toBe("ai");
    expect(next.searchParams.get("orden")).toBe("trending");
    expect(next.searchParams.get("mostrar")).toBe("20");
    expect(next.searchParams.has("pagina")).toBe(false);
    expect(next.hash).toBe("#project-results");
    expect(showMoreUrl(url, 10)).not.toContain("mostrar=");
  });

  it("sorts by date, visits and trending with unset values last, and falls back to the default order", () => {
    const list = [
      { title: "Alfa", href: "#", description: "", author: "", tags: [], addedAt: 100, visits: 5, trending: 1 },
      { title: "Beta", href: "#", description: "", author: "", tags: [] },
      { title: "Zeta", href: "#", description: "", author: "", tags: [], addedAt: 300, visits: 2, trending: 9 },
    ];
    const titles = (order: string) => filterProjects(list, "", [], order).map(project => project.title);
    expect(titles("recientes")).toEqual(["Zeta", "Alfa", "Beta"]);
    expect(titles("visitas")).toEqual(["Alfa", "Zeta", "Beta"]);
    expect(titles("trending")).toEqual(["Zeta", "Alfa", "Beta"]);
    expect(titles("az")).toEqual(["Alfa", "Beta", "Zeta"]);
    expect(parseProjectOrder("trending")).toBe("trending");
    expect(parseProjectOrder("za")).toBe("recientes");
    expect(parseProjectOrder(null)).toBe("recientes");
  });
});
