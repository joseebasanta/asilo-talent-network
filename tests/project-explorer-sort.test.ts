// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from "vitest";
vi.mock("../src/scripts/analytics", () => ({ track: vi.fn() }));
vi.mock("../src/lib/project-refresh", () => ({ startProjectRefresh: vi.fn() }));
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

it("keeps label activation available, sorts results, and supports keyboard dismissal", async () => {
  vi.useFakeTimers();
  document.body.innerHTML = `
    <form id="project-filters">
      <input id="project-query">
      <details id="project-sort"><summary></summary><span id="sort-value"></span><label class="sort-option"><input name="orden" value="az" type="radio" checked><span>A–Z</span></label><label class="sort-option"><input name="orden" value="za" type="radio"><span>Z–A</span></label></details>
      <details id="project-categories"><summary></summary>
        <span data-category-selection></span><input id="category-query">
        <div data-category-search hidden></div><button data-category-done hidden></button>
        <div class="category-list"><p data-category-empty></p></div>
      </details><a data-all-categories></a>
    </form>
    <div class="results-toolbar"><a data-clear-filters></a></div>
    <div id="project-results"><a data-project-index="0" data-title="Alfa"></a><a data-project-index="1" data-title="Zeta"></a></div><p id="project-count"></p>
    <div id="empty-results"><h2></h2><p></p></div>
    <nav class="project-pagination"><span data-page-status></span><span data-page-range></span></nav>`;

  await import("../src/scripts/project-explorer");
  const dropdown = document.querySelector<HTMLDetailsElement>("#project-sort")!;
  const trigger = dropdown.querySelector("summary")!;
  dropdown.open = true;
  trigger.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: document.body }));
  await vi.runAllTimersAsync();
  expect(dropdown.open).toBe(true);
  dropdown.querySelectorAll<HTMLElement>(".sort-option span")[1].click();
  await vi.runAllTimersAsync();
  expect(document.querySelector("#sort-value")!.textContent).toBe("Nombre: Z–A");
  expect([...document.querySelectorAll<HTMLElement>("[data-project-index]")].map(card => card.dataset.title)).toEqual(["Zeta", "Alfa"]);
  expect(location.search).toContain("orden=za");
  expect(dropdown.open).toBe(false);
  expect(document.activeElement).toBe(trigger);
  trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
  expect(dropdown.open).toBe(true);
  expect(document.activeElement).toBe(dropdown.querySelector('[value="za"]'));
  // Native keyboard activation emits a click with detail 0 and must keep
  // the menu open so arrow-key navigation can continue.
  dropdown.querySelector<HTMLInputElement>('[value="az"]')!.click();
  await vi.runAllTimersAsync();
  expect(dropdown.open).toBe(true);
  expect(document.querySelector("#sort-value")!.textContent).toBe("Nombre: A–Z");
  expect([...document.querySelectorAll<HTMLElement>("[data-project-index]")].map(card => card.dataset.title)).toEqual(["Alfa", "Zeta"]);
  expect(location.search).not.toContain("orden=");
  document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  expect(dropdown.open).toBe(false);
  expect(document.activeElement).toBe(trigger);
  // Selecting the already-checked label must still dismiss the menu even
  // though the browser does not emit a change event.
  dropdown.open = true;
  dropdown.querySelectorAll<HTMLElement>(".sort-option span")[0].click();
  await vi.runAllTimersAsync();
  expect(dropdown.open).toBe(false);
  expect(document.activeElement).toBe(trigger);
  trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
  document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
  expect(dropdown.open).toBe(false);
  expect(document.activeElement).toBe(trigger);
  dropdown.open = true;
  document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  expect(dropdown.open).toBe(false);
  dropdown.open = true;
  document.querySelector<HTMLElement>("#project-query")!.focus();
  expect(dropdown.open).toBe(false);
});
