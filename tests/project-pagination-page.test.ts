import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it, vi } from "vitest";
vi.mock("../src/lib/projects-loader", () => ({
  loadApprovedProjects: async () => Array.from({ length: 25 }, (_, index) => ({
    title: `Project ${String(index + 1).padStart(2, "0")}`,
    href: `https://example.com/${index + 1}`,
    addedIndex: index,
    author: "Test builder", description: "Project description", tags: index < 12 ? ["AI"] : ["SaaS"],
  })),
}));
import ProjectsPage from "../src/pages/proyectos.astro";
async function render(query = "") {
  const container = await AstroContainer.create();
  return container.renderToString(ProjectsPage, { request: new Request(`https://example.com/proyectos${query}`) });
}
function visibleCards(html: string) {
  return [...html.matchAll(/<(?:a|article)\b[^>]*data-project-index[^>]*>/g)].map(match => match[0]).filter(tag => !/\bhidden(?:[\s=>])/.test(tag));
}
describe("server-rendered order tabs", () => {
  it("offers the order tabs and defaults to Últimos añadidos, newest sheet row first", async () => {
    const html = await render();
    expect([...html.matchAll(/<input[^>]*name="orden"[^>]*>/g)].map(m => m[0].match(/value="([^"]+)"/)![1]))
      .toEqual(["recientes", "visitas", "trending", "az"]);
    expect(html).toMatch(/<input[^>]*value="recientes"[^>]*checked/);
    const cards = visibleCards(html);
    expect(cards[0]).toContain('data-title="Project 25"');
    expect(cards[0]).toContain('data-added-index="24"');
    expect(cards[9]).toContain('data-title="Project 16"');
  });
  it("sorts by name when A–Z is selected", async () => {
    const html = await render("?orden=az");
    expect(visibleCards(html)[0]).toContain('data-title="Project 01"');
    expect(html).toMatch(/<input[^>]*value="az"[^>]*checked/);
  });
});

describe("server-rendered show more", () => {
  it("starts with ten projects and links to the next ten without JavaScript", async () => {
    const html = await render();
    expect(visibleCards(html)).toHaveLength(10);
    expect(html).toContain("Mostrando 10 de 25 proyectos");
    expect(html).toMatch(/data-show-more href="\/proyectos\?mostrar=20#project-results"/);
    expect(html).not.toMatch(/<div class="show-more"[^>]*hidden/);
  });
  it("reveals more on request, keeps filters in the link, and hides the button when everything is shown", async () => {
    const more = await render("?categoria=AI&mostrar=20");
    expect(visibleCards(more)).toHaveLength(12);
    expect(more).toMatch(/<div class="show-more"[^>]*hidden/);
    const mid = await render("?mostrar=20");
    expect(visibleCards(mid)).toHaveLength(20);
    expect(mid).toContain("Mostrando 20 de 25 proyectos");
    expect(mid).toContain("mostrar=30#project-results");
    const all = await render("?mostrar=999");
    expect(visibleCards(all)).toHaveLength(25);
    expect(all).toMatch(/<div class="show-more"[^>]*hidden/);
  });
  it("never shows fewer than ten and drops the button for small result sets", async () => {
    expect(visibleCards(await render("?mostrar=3"))).toHaveLength(10);
    const html = await render("?q=Project+01&mostrar=50");
    expect(visibleCards(html)).toHaveLength(1);
    expect(html).toMatch(/<div class="show-more"[^>]*hidden/);
  });
});
