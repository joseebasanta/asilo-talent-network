// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import ts from "typescript";
import { afterEach, expect, it, vi } from "vitest";
afterEach(() => { vi.unstubAllGlobals(); });
it("updates homepage cards after approval, retains them on failure, and respects keyboard focus", async () => {
  document.body.innerHTML = '<div id="project-directory-list"></div>';
  const source = readFileSync("src/components/ProjectDirectory.astro", "utf8");
  const refreshCode = source.slice(source.indexOf('  const projectCarousel ='), source.indexOf('  const showProjectPage ='));
  const javascript = ts.transpileModule(refreshCode + '\nreturn refreshProjects;', { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  const refresh = new Function("startProjectRefresh", javascript)(() => {}) as () => Promise<void>;
  const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ projects: [{
    title: "Nuevo", href: "https://example.com", description: "", author: "", tags: ["AI"],
  }] })));
  vi.stubGlobal("fetch", fetcher);
  await refresh();
  const card = document.querySelector<HTMLAnchorElement>(".prj-item")!;
  expect(card.textContent).toContain("Nuevo");
  expect(card.closest<HTMLElement>("[data-project-page]")!.hidden).toBe(false);
  card.focus();
  await refresh();
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(document.activeElement).toBe(card);
  card.blur();
  fetcher.mockResolvedValueOnce(new Response("", { status: 429 }));
  await expect(refresh()).rejects.toThrow();
  expect(document.querySelector(".prj-item")).toBe(card);
  fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ projects: [] })));
  await refresh();
  expect(document.querySelectorAll(".prj-item")).toHaveLength(0);
});
