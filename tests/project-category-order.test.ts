import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it, vi } from "vitest";
import { CATEGORIES } from "../src/lib/projects-schema";
import ProjectDirectory from "../src/components/ProjectDirectory.astro";

vi.mock("../src/lib/projects-loader", () => ({
  loadApprovedProjects: async () => [
    { title: "Alpha", href: "https://example.com/a", author: "Ana", description: "Project alpha", tags: ["Agritech", "Fintech"] },
    { title: "Beta", href: "https://example.com/b", author: "Luis", description: "Project beta", tags: ["Logística", "Movilidad"] },
    { title: "Gamma", href: "https://example.com/c", author: "María", description: "Project gamma", tags: ["Energía & Clima", "Diseño & Creatividad"] },
  ],
}));

import ProjectsPage from "../src/pages/proyectos.astro";

const descEs = (a: string, b: string) => b.localeCompare(a, "es", { sensitivity: "base" });
const decodeAttr = (value: string) =>
  value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

describe("project category order (Z→A)", () => {
  it("keeps the category source in fixed descending Spanish order", () => {
    expect([...CATEGORIES]).toEqual([...CATEGORIES].sort(descEs));
    // Accents sort sensibly (base sensitivity): accented forms stay with their base letter.
    expect(CATEGORIES.indexOf("Logística")).toBeLessThan(CATEGORIES.indexOf("Inteligencia Artificial"));
    expect(CATEGORIES.indexOf("Energía & Clima")).toBeLessThan(CATEGORIES.indexOf("Edtech"));
    expect(CATEGORIES.indexOf("Diseño & Creatividad")).toBeLessThan(CATEGORIES.indexOf("DevTools & APIs"));
  });

  it("renders the submission modal checkboxes in source order", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ProjectDirectory, { props: { projects: [] } });
    const values = [...html.matchAll(/<input[^>]*name="categorias"[^>]*value="([^"]*)"/g)]
      .map((match) => decodeAttr(match[1]));
    expect(values).toEqual([...CATEGORIES]);
  });

  it("renders the directory filter in descending Spanish order", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ProjectsPage, {
      request: new Request("https://example.com/proyectos"),
    });
    const names = [...html.matchAll(/data-category-name="([^"]*)"/g)]
      .map((match) => decodeAttr(match[1]));
    expect(names).toEqual([
      "Movilidad",
      "Logística",
      "Fintech",
      "Energía & Clima",
      "Diseño & Creatividad",
      "Agritech",
    ]);
    expect(names).toEqual([...names].sort(descEs));
  });
});
