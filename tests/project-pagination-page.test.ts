import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it, vi } from "vitest";
vi.mock("../src/lib/projects-loader", () => ({
  loadApprovedProjects: async () => Array.from({ length: 25 }, (_, index) => ({
    title: `Project ${String(index + 1).padStart(2, "0")}`,
    href: `https://example.com/${index + 1}`,
    author: "Test builder", description: "Project description", tags: index < 12 ? ["AI"] : ["SaaS"],
  })),
}));
import ProjectsPage from "../src/pages/proyectos.astro";
async function render(query = "") {
  const container = await AstroContainer.create();
  return container.renderToString(ProjectsPage, { request: new Request(`https://example.com/proyectos${query}`) });
}
function visibleCards(html: string) {
  return [...html.matchAll(/<a\b[^>]*data-project-index[^>]*>/g)].map(match => match[0]).filter(tag => !/\bhidden(?:[\s=>])/.test(tag));
}
describe("server-rendered project pagination", () => {
  it("renders the second page and preserves filters in navigation without JavaScript", async () => {
    const html = await render("?categoria=AI&pagina=2");
    const cards = visibleCards(html);
    expect(cards).toHaveLength(2);
    expect(cards[0]).toContain('data-title="Project 11"');
    expect(html).toContain("Página 2 de 2");
    expect(html).toContain("11–12 de 12 proyectos");
    expect(html).toContain('/proyectos?categoria=AI#project-results');
    expect(html).toMatch(/data-page-direction="next"[^>]*aria-disabled="true"/);
  });
  it("limits the initial page and clamps out-of-range requests to the last page", async () => {
    expect(visibleCards(await render())).toHaveLength(10);
    const html = await render("?pagina=999");
    expect(visibleCards(html)).toHaveLength(5);
    expect(html).toContain("Página 3 de 3");
    expect(html).toContain("21–25 de 25 proyectos");
  });
  it("hides pagination when a search fits on one page", async () => {
    const html = await render("?q=Project+01&pagina=3");
    expect(visibleCards(html)).toHaveLength(1);
    expect(html).toMatch(/<nav class="project-pagination"[^>]*hidden/);
  });
});
