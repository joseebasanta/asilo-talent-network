// @vitest-environment happy-dom
import { expect, it, vi } from "vitest";
vi.mock("../src/scripts/analytics", () => ({ track: vi.fn() }));
vi.mock("../src/lib/project-refresh", () => ({ startProjectRefresh: vi.fn() }));

const card = (index: number, title: string, addedIndex: number) =>
  `<article data-project-index="${index}" data-title="${title}" data-added-index="${addedIndex}"><a class="prj-link" href="/proyectos/${title.toLowerCase()}"></a></article>`;

it("sorts by recency from data-added-index and syncs the URL", async () => {
  document.body.innerHTML = `
    <form id="project-filters">
      <input id="project-query">
      <label><input name="orden" value="recientes" type="radio" checked></label>
      <label><input name="orden" value="visitas" type="radio"></label>
      <label><input name="orden" value="trending" type="radio"></label>
      <label><input name="orden" value="az" type="radio"></label>
      <fieldset class="category-list"></fieldset><a data-all-categories></a>
    </form>
    <div class="results-toolbar"><a data-clear-filters></a></div>
    <div id="project-results">${card(0, "Alfa", 1)}${card(1, "Zeta", 7)}${card(2, "Beta", 3)}</div>
    <p id="project-count"></p>
    <div id="empty-results"><h2></h2><p></p></div>
    <div class="show-more"><p data-show-status></p><a data-show-more></a></div>`;
  await import("../src/scripts/project-explorer");
  const titles = () => [...document.querySelectorAll<HTMLElement>("[data-project-index]")].map(c => c.dataset.title);
  const pick = (value: string) => {
    const radio = document.querySelector<HTMLInputElement>(`[value="${value}"]`)!;
    radio.checked = true;
    radio.dispatchEvent(new Event("change", { bubbles: true }));
  };
  // "Últimos añadidos" is the default: newest sheet row first, no ?orden in the URL.
  expect(titles()).toEqual(["Zeta", "Beta", "Alfa"]);
  pick("az");
  expect(titles()).toEqual(["Alfa", "Beta", "Zeta"]);
  expect(location.search).toContain("orden=az");
  pick("recientes");
  expect(titles()).toEqual(["Zeta", "Beta", "Alfa"]);
  expect(location.search).not.toContain("orden=");
  // Links shared before the redesign still sort Z–A, even without a tab.
  history.replaceState(null, "", "/proyectos?orden=za");
  window.dispatchEvent(new PopStateEvent("popstate"));
  expect(titles()).toEqual(["Zeta", "Beta", "Alfa"].sort().reverse());
  document.querySelector<HTMLElement>(".results-toolbar [data-clear-filters]")!.click();
  expect(document.querySelector<HTMLInputElement>('[value="recientes"]')!.checked).toBe(true);
  expect(titles()).toEqual(["Zeta", "Beta", "Alfa"]);
});
