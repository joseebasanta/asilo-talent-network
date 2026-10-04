// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import ts from "typescript";
import { afterEach, expect, it, vi } from "vitest";
afterEach(() => { vi.unstubAllGlobals(); });

const partial = (title: string) =>
  `<div class="prj-list" data-project-page="0"><div class="prj-col"><article class="prj-item"><a class="prj-link" href="#">${title}</a></article></div></div>`;
const htmlResponse = (body: string, status = 200) => new Response(body, { status, headers: { "content-type": "text/html" } });

it("updates homepage cards after approval, retains them on failure, and respects keyboard focus", async () => {
  document.body.innerHTML = '<div id="project-directory-list"></div>';
  const source = readFileSync("src/components/ProjectDirectory.astro", "utf8");
  const refreshCode = source.slice(source.indexOf('  const projectCarousel ='), source.indexOf('  const showProjectPage ='));
  const javascript = ts.transpileModule(refreshCode + '\nreturn refreshProjects;', { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  const paintLikes = vi.fn();
  const refresh = new Function("startProjectRefresh", "paintLikes", javascript)(() => {}, paintLikes) as () => Promise<void>;
  const fetcher = vi.fn().mockResolvedValueOnce(htmlResponse(partial("Nuevo")));
  vi.stubGlobal("fetch", fetcher);
  await refresh();
  expect(fetcher.mock.calls[0][0]).toBe("/partials/proyectos?orden=az");
  const link = document.querySelector<HTMLAnchorElement>(".prj-link")!;
  const card = document.querySelector<HTMLElement>(".prj-item")!;
  expect(card.textContent).toContain("Nuevo");
  expect(card.closest<HTMLElement>("[data-project-page]")!.hidden).toBe(false);
  expect(paintLikes).toHaveBeenCalledTimes(1);
  // Keyboard focus inside the list: the refresh is skipped, nothing is yanked away.
  link.focus();
  await refresh();
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(document.activeElement).toBe(link);
  link.blur();
  // A failed refresh throws (so the scheduler backs off) and keeps the last list.
  fetcher.mockResolvedValueOnce(htmlResponse("", 429));
  await expect(refresh()).rejects.toThrow();
  expect(document.querySelector(".prj-item")).toBe(card);
  fetcher.mockResolvedValueOnce(htmlResponse(""));
  await refresh();
  expect(document.querySelectorAll(".prj-item")).toHaveLength(0);
});
