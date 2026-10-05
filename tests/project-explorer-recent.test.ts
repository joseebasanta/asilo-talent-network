// @vitest-environment happy-dom
import { expect, it, vi } from "vitest";
vi.mock("../src/scripts/analytics", () => ({ track: vi.fn() }));
vi.mock("../src/lib/project-refresh", () => ({ startProjectRefresh: vi.fn() }));

it("sorts by recency from data-added-index and syncs the URL", async () => {
  document.body.innerHTML = `
    <form id="project-filters">
      <input id="project-query">
      <details id="project-sort"><summary></summary><span id="sort-value"></span>
        <label class="sort-option"><input name="orden" value="recientes" type="radio"></label>
        <label class="sort-option"><input name="orden" value="az" type="radio" checked></label>
        <label class="sort-option"><input name="orden" value="za" type="radio"></label>
      </details>
      <details id="project-categories"><summary></summary>
        <span data-category-selection></span><input id="category-query">
        <div data-category-search hidden></div><button data-category-done hidden></button>
        <div class="category-list"><p data-category-empty></p></div>
      </details><a data-all-categories></a>
    </form>
    <div class="results-toolbar"><a data-clear-filters></a></div>
    <div id="project-results">
      <a data-project-index="0" data-title="Alfa" data-added-index="1"></a>
      <a data-project-index="1" data-title="Zeta" data-added-index="7"></a>
      <a data-project-index="2" data-title="Beta" data-added-index="3"></a>
    </div><p id="project-count"></p>
    <div id="empty-results"><h2></h2><p></p></div>
    <nav class="project-pagination"><span data-page-status></span><span data-page-range></span></nav>`;
  await import("../src/scripts/project-explorer");
  const titles = () => [...document.querySelectorAll<HTMLElement>("[data-project-index]")].map(c => c.dataset.title);
  const pick = (value: string) => {
    const radio = document.querySelector<HTMLInputElement>(`[value="${value}"]`)!;
    radio.checked = true;
    radio.dispatchEvent(new Event("change", { bubbles: true }));
  };
  pick("recientes");
  expect(titles()).toEqual(["Zeta", "Beta", "Alfa"]);
  expect(document.querySelector("#sort-value")!.textContent).toBe("Más recientes");
  expect(location.search).toContain("orden=recientes");
  pick("za");
  expect(location.search).toContain("orden=za");
  pick("az");
  expect(location.search).not.toContain("orden=");
  history.replaceState(null, "", "/proyectos?orden=recientes");
  window.dispatchEvent(new PopStateEvent("popstate"));
  expect(titles()).toEqual(["Zeta", "Beta", "Alfa"]);
  expect(document.querySelector<HTMLInputElement>('[value="recientes"]')!.checked).toBe(true);
  document.querySelector<HTMLElement>(".results-toolbar [data-clear-filters]")!.click();
  expect(document.querySelector<HTMLInputElement>('[value="az"]')!.checked).toBe(true);
  expect(titles()).toEqual(["Alfa", "Beta", "Zeta"]);
});
