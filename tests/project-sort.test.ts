import { describe, expect, it } from "vitest";
import type { Project } from "../src/data/projects";
import { parseSortMode, sortProjects } from "../src/lib/project-sort";

const project = (title: string, extra: Partial<Project> = {}): Project => ({
  href: `https://${title}.example`,
  title,
  description: "",
  author: "",
  tags: [],
  ...extra,
});

const titles = (projects: Project[]) => projects.map((p) => p.title);

describe("sortProjects", () => {
  const list = [
    project("beta", { addedIndex: 0 }),
    project("Ábaco", { addedIndex: 2 }),
    project("zeta", { addedIndex: 1 }),
  ];

  it("sorts A–Z with Spanish, accent-insensitive collation", () => {
    expect(titles(sortProjects(list, "az"))).toEqual(["Ábaco", "beta", "zeta"]);
  });

  it("sorts Z–A as the exact reverse of A–Z", () => {
    expect(titles(sortProjects(list, "za"))).toEqual(["zeta", "beta", "Ábaco"]);
  });

  it("shows the newest additions first (sheet row order, not the date text)", () => {
    expect(titles(sortProjects(list, "recientes"))).toEqual(["Ábaco", "zeta", "beta"]);
    // Row order wins over the Fecha column; the date only breaks ties.
    const dated = [project("vieja", { addedIndex: 5, addedAt: 1 }), project("nueva", { addedIndex: 9, addedAt: 0 })];
    expect(titles(sortProjects(dated, "recientes"))).toEqual(["nueva", "vieja"]);
  });

  it("ranks by visits and trending, leaving projects without data last", () => {
    const metrics = [project("a", { visits: 5, trending: 1 }), project("b"), project("c", { visits: 9, trending: 3 })];
    expect(titles(sortProjects(metrics, "visitas"))).toEqual(["c", "a", "b"]);
    expect(titles(sortProjects(metrics, "trending"))).toEqual(["c", "a", "b"]);
  });

  it("never mutates its input", () => {
    const before = titles(list);
    sortProjects(list, "za");
    expect(titles(list)).toEqual(before);
  });
});

describe("parseSortMode", () => {
  it("accepts known modes and falls back to the default", () => {
    expect(parseSortMode("za")).toBe("za");
    expect(parseSortMode("recientes")).toBe("recientes");
    expect(parseSortMode("visitas")).toBe("visitas");
    expect(parseSortMode("ZA")).toBe("recientes");
    expect(parseSortMode(null)).toBe("recientes");
    expect(parseSortMode("<script>")).toBe("recientes");
    expect(parseSortMode("populares")).toBe("recientes");
  });
});
