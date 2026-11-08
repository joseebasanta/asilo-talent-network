// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { initReveal } from "../src/scripts/servicios-reveal";

type Callback = (entries: Array<{ target: Element; isIntersecting: boolean }>) => void;

function stubMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: reduce && query.includes("reduce"), media: query }));
  window.matchMedia = globalThis.matchMedia;
}

describe("servicios reveal", () => {
  let callback: Callback | undefined;
  const observed: Element[] = [];
  const unobserved: Element[] = [];

  beforeEach(() => {
    document.documentElement.className = "";
    document.body.innerHTML = `<div id="a" data-reveal></div><div id="b" data-reveal></div><div id="c"></div>`;
    callback = undefined;
    observed.length = 0;
    unobserved.length = 0;
    class FakeObserver {
      constructor(cb: Callback) {
        callback = cb;
      }
      observe(el: Element) {
        observed.push(el);
      }
      unobserve(el: Element) {
        unobserved.push(el);
      }
    }
    vi.stubGlobal("IntersectionObserver", FakeObserver);
    window.IntersectionObserver = globalThis.IntersectionObserver as typeof IntersectionObserver;
  });

  afterEach(() => vi.unstubAllGlobals());

  it("hides nothing until the script runs, then reveals each target once when it scrolls into view", () => {
    stubMotion(false);
    expect(document.documentElement.classList.contains("s-js")).toBe(false);
    initReveal();
    expect(document.documentElement.classList.contains("s-js")).toBe(true);
    expect(observed.map((el) => el.id)).toEqual(["a", "b"]);

    const [a, b] = observed;
    callback!([{ target: a, isIntersecting: false }]);
    expect(a.classList.contains("is-in")).toBe(false);
    callback!([{ target: a, isIntersecting: true }]);
    expect(a.classList.contains("is-in")).toBe(true);
    expect(unobserved).toEqual([a]);
    expect(b.classList.contains("is-in")).toBe(false);
  });

  it("shows everything immediately and never hides content when the user prefers reduced motion", () => {
    stubMotion(true);
    initReveal();
    expect(document.documentElement.classList.contains("s-js")).toBe(false);
    expect(Array.from(document.querySelectorAll("[data-reveal]")).every((el) => el.classList.contains("is-in"))).toBe(true);
    expect(observed).toHaveLength(0);
  });

  it("has the hidden start state only under .s-js, and turns the motion off for reduced motion", () => {
    const css = readFileSync(resolve(process.cwd(), "src/styles/servicios.css"), "utf8");
    expect(css).toContain(".s-js [data-reveal]:not(.is-in) { opacity: 0; transform: translateY(28px); }");
    expect(css).not.toMatch(/^\[data-reveal\]:not\(\.is-in\)/m);
    const blocks = css.split("@media (prefers-reduced-motion: reduce)");
    const reduced = blocks.find((block) => block.slice(0, 500).includes("[data-reveal]")) ?? "";
    expect(reduced).toContain("animation: none");
    expect(reduced).toContain("[data-reveal]");
  });
});
