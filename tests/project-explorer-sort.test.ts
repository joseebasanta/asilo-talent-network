// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from "vitest";
vi.mock("../src/scripts/analytics", () => ({ track: vi.fn() }));
vi.mock("../src/lib/project-refresh", () => ({ startProjectRefresh: vi.fn() }));
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

it("reorders results from the order tabs and keeps the default order out of the URL", async () => {
  vi.useFakeTimers();
  const tab = (value: string, checked = false) => `<label class="order-tab"><input name="orden" value="${value}" type="radio"${checked ? " checked" : ""}><span>${value}</span></label>`;
  document.body.innerHTML = `
    <form id="project-filters">
      <input id="project-query">
      <fieldset class="order-tabs">${tab("recientes", true)}${tab("visitas")}${tab("trending")}${tab("az")}</fieldset>
      <fieldset class="category-list"><label data-category-name="AI"><input name="categoria" type="checkbox" value="AI"></label></fieldset>
      <a data-all-categories></a>
    </form>
    <div class="results-toolbar"><a data-clear-filters></a></div>
    <div id="project-results">
      <a data-project-index="0" data-title="Alfa" data-added="100" data-visits="5" data-trending="1"></a>
      <a data-project-index="1" data-title="Zeta" data-added="300" data-visits="2" data-trending="9"></a>
      <a data-project-index="2" data-title="Beta" data-added="200"></a>
    </div>
    <p id="project-count"></p>
    <div id="empty-results"><h2></h2><p></p></div>
    <div class="show-more" hidden><p data-show-status></p><a data-show-more></a></div>`;

  await import("../src/scripts/project-explorer");
  const titles = () => [...document.querySelectorAll<HTMLElement>("[data-project-index]")].map(card => card.dataset.title);
  const choose = async (value: string) => {
    const input = document.querySelector<HTMLInputElement>(`[name="orden"][value="${value}"]`)!;
    input.checked = true;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await vi.runAllTimersAsync();
  };

  // Default: newest first; projects without counters sort after those with them only for those fields.
  expect(titles()).toEqual(["Zeta", "Beta", "Alfa"]);
  expect(location.search).not.toContain("orden=");

  await choose("visitas");
  expect(titles()).toEqual(["Alfa", "Zeta", "Beta"]);
  expect(location.search).toContain("orden=visitas");

  await choose("trending");
  expect(titles()).toEqual(["Zeta", "Alfa", "Beta"]);
  expect(location.search).toContain("orden=trending");

  await choose("az");
  expect(titles()).toEqual(["Alfa", "Beta", "Zeta"]);
  expect(location.search).toContain("orden=az");

  await choose("recientes");
  expect(titles()).toEqual(["Zeta", "Beta", "Alfa"]);
  expect(location.search).not.toContain("orden=");
});
