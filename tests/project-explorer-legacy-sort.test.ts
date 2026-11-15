// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("../src/scripts/analytics", () => ({ track: vi.fn() }));
vi.mock("../src/lib/project-refresh", () => ({ startProjectRefresh: vi.fn() }));
beforeEach(() => vi.resetModules());
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = ""; });

async function mount(query: string) {
  history.replaceState(null, "", `/proyectos${query}`);
  const cards = Array.from({ length: 20 }, (_, i) => {
    const n = 19 - i;
    return `<article data-project-index="${i}" data-added-index="${i}" data-title="P${String(n).padStart(2, "0")}" data-tags='[]'><a class="prj-link" href="#p${n}">P${String(n).padStart(2, "0")}</a></article>`;
  }).join("");
  document.body.innerHTML = `<form id="project-filters"><input id="project-query">${["recientes", "visitas", "trending", "az"].map(value => `<input type="radio" name="orden" value="${value}">`).join("")}<fieldset class="category-list"></fieldset><a data-all-categories></a></form><div class="results-toolbar"><a data-clear-filters></a></div><div id="project-results">${cards}</div><p id="project-count"></p><div id="empty-results"><h2></h2><p></p></div><div class="show-more"><p data-show-status></p><a href="#" data-show-more></a></div>`;
  await import("../src/scripts/project-explorer");
}

it("/proyectos?orden=za keeps reverse alphabetical order after initialization", async () => {
  await mount("?orden=za");
  const titles = [...document.querySelectorAll<HTMLElement>("[data-project-index]")].filter(card => !card.hidden).map(card => card.dataset.title);
  expect(titles[0]).toBe("P19");
});

it("show more focuses newly revealed content after changing sort", async () => {
  await mount("");
  const radio = document.querySelector<HTMLInputElement>('[name="orden"][value="az"]')!;
  radio.checked = true;
  radio.dispatchEvent(new Event("change", { bubbles: true }));
  const before = new Set([...document.querySelectorAll<HTMLElement>("[data-project-index]")].filter(card => !card.hidden));
  document.querySelector<HTMLAnchorElement>("[data-show-more]")!.click();
  expect(before.has(document.activeElement!.closest("[data-project-index]") as HTMLElement)).toBe(false);
  expect(document.activeElement?.textContent).toBe("P10");
});
