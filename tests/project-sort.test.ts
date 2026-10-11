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

  it("shows the newest additions first", () => {
    expect(titles(sortProjects(list, "recientes"))).toEqual(["Ábaco", "zeta", "beta"]);
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
    expect(parseSortMode("ZA")).toBe("az");
    expect(parseSortMode(null)).toBe("az");
    expect(parseSortMode("<script>")).toBe("az");
    expect(parseSortMode("populares")).toBe("az");
  });
});
