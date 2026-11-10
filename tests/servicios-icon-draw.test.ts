// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initIconDraw, redraw } from "../src/scripts/servicios-icon-draw";

const markup = `
<ul>
  <li class="s-card s-card--feature" data-icon-draw>
    <div class="s-card-decorator"><div class="s-card-decorator-icon"><svg><path pathLength="1" d="M0 0h1"/></svg></div></div>
  </li>
</ul>`;

class FakeObserver {
  static all: FakeObserver[] = [];
  targets: Element[] = [];
  constructor(public callback: (entries: { isIntersecting: boolean; target: Element }[]) => void) {
    FakeObserver.all.push(this);
  }
  observe(el: Element) {
    this.targets.push(el);
  }
  unobserve(el: Element) {
    this.targets = this.targets.filter((t) => t !== el);
  }
  disconnect() {}
}
const show = () => {
  for (const o of FakeObserver.all) for (const t of [...o.targets]) o.callback([{ isIntersecting: true, target: t }]);
};

function stubMedia(canHover: boolean, reduced = false) {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({ matches: query.includes("prefers-reduced-motion") ? reduced : canHover, media: query }) as unknown as MediaQueryList,
  );
}

describe("problem card icons drawing themselves", () => {
  let card: HTMLElement;
  let icon: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = markup;
    card = document.querySelector<HTMLElement>("[data-icon-draw]")!;
    icon = document.querySelector<HTMLElement>(".s-card-decorator-icon")!;
    FakeObserver.all = [];
    vi.stubGlobal("IntersectionObserver", FakeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("draws the icon once when the card appears, with the entrance stagger", () => {
    stubMedia(false);
    initIconDraw(document, window);
    expect(icon.classList.contains("is-drawing")).toBe(false);
    show();
    expect(icon.classList.contains("is-drawing")).toBe(true);
    expect(icon.classList.contains("is-first-draw")).toBe(true);
    // Solo una vez: deja de observar la tarjeta.
    expect(FakeObserver.all[0]!.targets).toHaveLength(0);
  });

  it("redraws it on hover, right away (without the entrance delay)", () => {
    stubMedia(true);
    initIconDraw(document, window);
    show();
    card.dispatchEvent(new Event("mouseenter"));
    expect(icon.classList.contains("is-drawing")).toBe(true);
    expect(icon.classList.contains("is-first-draw")).toBe(false);
  });

  it("ignores mouse events on touch screens and does nothing with reduced motion", () => {
    stubMedia(false);
    initIconDraw(document, window);
    card.dispatchEvent(new Event("mouseenter"));
    expect(icon.classList.contains("is-drawing")).toBe(false);

    // Página nueva, para no arrastrar el listener de la primera parte.
    vi.restoreAllMocks();
    FakeObserver.all = [];
    document.body.innerHTML = markup;
    card = document.querySelector<HTMLElement>("[data-icon-draw]")!;
    icon = document.querySelector<HTMLElement>(".s-card-decorator-icon")!;
    stubMedia(true, true);
    initIconDraw(document, window);
    show();
    card.dispatchEvent(new Event("mouseenter"));
    expect(icon.classList.contains("is-drawing")).toBe(false);
  });

  it("restarts the animation by removing and re-adding the class", () => {
    icon.classList.add("is-drawing");
    const removed = vi.spyOn(icon.classList, "remove");
    redraw(icon);
    expect(removed).toHaveBeenCalledWith("is-drawing");
    expect(icon.classList.contains("is-drawing")).toBe(true);
  });
});
