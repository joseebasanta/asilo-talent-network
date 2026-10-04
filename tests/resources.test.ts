import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import { resourceCategories } from "../src/data/resources";
import ResourcesPage from "../src/pages/recursos.astro";

const VALID_TAGS = new Set(["free", "freemium", "paid", "open-source", ""]);
const totalResources = resourceCategories.reduce((sum, category) => sum + category.resources.length, 0);

async function renderResources(): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(ResourcesPage);
}

describe("resources data", () => {
  it("has categories and resources with valid shape", () => {
    expect(resourceCategories.length).toBeGreaterThan(0);
    expect(totalResources).toBeGreaterThan(0);

    const ids = new Set<string>();
    for (const category of resourceCategories) {
      expect(category.id).toMatch(/^[a-z0-9-]+$/);
      expect(ids.has(category.id)).toBe(false);
      ids.add(category.id);
      expect(category.title.length).toBeGreaterThan(0);
      expect(category.resources.length).toBeGreaterThan(0);

      for (const resource of category.resources) {
        expect(resource.name.length).toBeGreaterThan(0);
        expect(resource.url).toMatch(/^https?:\/\//);
        expect(VALID_TAGS.has(resource.tag)).toBe(true);
      }
    }
  });
});

describe("/recursos page", () => {
  it("renders the library heading, controls and counts", async () => {
    const html = await renderResources();

    expect(html).toContain('<html lang="es">');
    expect(html).toContain("data-decode>Recursos</h1>");
    expect(html).toContain(`${totalResources} recursos en ${resourceCategories.length} categorías`);
    // Search control exists; tag filter has been removed.
    expect(html).toContain('id="resource-query"');
    expect(html).not.toContain('class="tag-filter"');
    expect(html).not.toContain("resource-tag");
  });

  it("renders every category section and resource row", async () => {
    const html = await renderResources();

    for (const category of resourceCategories) {
      expect(html).toContain(`id="${category.id}"`);
    }
    expect((html.match(/class="resource"/g) ?? []).length).toBe(totalResources);
    // External resource links open safely in a new tab.
    expect((html.match(/rel="noopener noreferrer"/g) ?? []).length).toBeGreaterThanOrEqual(totalResources);
    // Each resource shows a favicon loaded by domain.
    expect((html.match(/class="resource-favicon"/g) ?? []).length).toBe(totalResources);
    expect(html).toContain("google.com/s/favicons");
    // The domain line under each card has been removed.
    expect(html).not.toContain("resource-domain");
  });

  it("exposes the Recursos item in the shared nav", async () => {
    const html = await renderResources();
    expect(html).toContain('href="/recursos"');
    expect(html).toContain("Recursos</a>");
  });
});
