// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from "vitest";
vi.mock("../src/scripts/analytics", () => ({ track: vi.fn() }));

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it("refreshes cards and categories, preserves search, and retains results on failure", async () => {
  vi.useFakeTimers();
  document.body.innerHTML = `
    <form id="project-filters">
      <input id="project-query"><input name="orden" value="az" type="radio" checked>
      <details id="project-sort"><summary></summary><span id="sort-value"></span></details>
      <details id="project-categories"><summary></summary>
        <span data-category-selection></span><input id="category-query">
        <div data-category-search hidden></div><button data-category-done hidden></button>
        <div class="category-list"><p data-category-empty></p></div>
      </details><a data-all-categories></a>
    </form>
    <div class="results-toolbar"><a data-clear-filters></a></div>
    <div id="project-results"></div><p id="project-count"></p>
    <div id="empty-results"><h2></h2><p></p></div>
    <nav class="project-pagination"><span data-page-status></span><span data-page-range></span></nav>`;
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  const fetcher = vi.fn().mockResolvedValue(new Response(`
    <div id="project-results"><a href="https://example.com" data-project-index="0" data-title="Nuevo" data-tags='["AI"]'>Nuevo</a></div>
    <div class="category-list"><label data-category-name="AI"><input name="categoria" type="checkbox" value="AI"></label><p data-category-empty></p></div>`));
  vi.stubGlobal("fetch", fetcher);
  await import("../src/scripts/project-explorer");
  const search = document.querySelector<HTMLInputElement>("#project-query")!;
  search.value = "Nuevo";
  await vi.advanceTimersByTimeAsync(10_000);
  expect(document.querySelector("#project-results")!.textContent).toBe("Nuevo");
  expect(document.querySelector("#project-count")!.textContent).toContain("1 proyecto");
  expect(search.value).toBe("Nuevo");
  expect(document.querySelector<HTMLInputElement>('[name="categoria"]')!.value).toBe("AI");
  fetcher.mockRejectedValue(new Error("offline"));
  await vi.advanceTimersByTimeAsync(10_000);
  expect(document.querySelector("#project-results")!.textContent).toBe("Nuevo");
  search.focus();
  await vi.advanceTimersByTimeAsync(10_000);
  expect(fetcher).toHaveBeenCalledTimes(2);
});
