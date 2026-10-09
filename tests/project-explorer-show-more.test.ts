// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from "vitest";
vi.mock("../src/scripts/analytics", () => ({ track: vi.fn() }));
vi.mock("../src/lib/project-refresh", () => ({ startProjectRefresh: vi.fn() }));
afterEach(() => { vi.restoreAllMocks(); });

it("shows ten first, reveals ten more per press, hides the button at the end and resets on filter change", async () => {
  const cards = Array.from({ length: 25 }, (_, i) => `<a data-project-index="${i}" data-title="P${String(i).padStart(2, "0")}" data-tags='["AI"]' tabindex="0"></a>`).join("");
  document.body.innerHTML = `
    <form id="project-filters">
      <input id="project-query">
      <label><input name="orden" value="recientes" type="radio" checked></label><label><input name="orden" value="az" type="radio"></label>
      <fieldset class="category-list"></fieldset><a data-all-categories></a>
    </form>
    <div class="results-toolbar"><a data-clear-filters></a></div>
    <div id="project-results">${cards}</div><p id="project-count"></p>
    <div id="empty-results"><h2></h2><p></p></div>
    <div class="show-more"><p data-show-status></p><a data-show-more></a></div>`;
  await import("../src/scripts/project-explorer");
  const visible = () => [...document.querySelectorAll<HTMLElement>("[data-project-index]")].filter(card => !card.hidden).length;
  const more = document.querySelector<HTMLAnchorElement>("[data-show-more]")!;
  const box = document.querySelector<HTMLElement>(".show-more")!;
  const status = document.querySelector("[data-show-status]")!;

  expect(visible()).toBe(10);
  expect(box.hidden).toBe(false);
  expect(status.textContent).toBe("Mostrando 10 de 25 proyectos");

  more.click();
  expect(visible()).toBe(20);
  expect(location.search).toContain("mostrar=20");
  expect(status.textContent).toBe("Mostrando 20 de 25 proyectos");

  more.click();
  expect(visible()).toBe(25);
  expect(box.hidden).toBe(true);
  expect(document.activeElement).toBe([...document.querySelectorAll<HTMLElement>("[data-project-index]")].find(card => card.style.order === "20"));

  // Changing the sort starts again from the initial ten.
  const az = document.querySelector<HTMLInputElement>('[value="az"]')!;
  az.checked = true;
  az.dispatchEvent(new Event("change", { bubbles: true }));
  expect(visible()).toBe(10);
  expect(box.hidden).toBe(false);
  expect(location.search).not.toContain("mostrar=");
});
