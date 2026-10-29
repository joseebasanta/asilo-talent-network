// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { initCarousel } from "../src/scripts/servicios-carousel";

function setup(count = 3, onChange?: (from: HTMLElement, to: HTMLElement, direction: 1 | -1) => void) {
  const items = Array.from({ length: count }, (_, i) => i);
  document.body.innerHTML = `
    <div data-carousel>
      ${items.map((i) => `<figure data-slide${i === 0 ? "" : " hidden"}></figure>`).join("")}
      ${items.map((i) => `<button data-dot${i === 0 ? ' aria-current="true"' : ""}></button>`).join("")}
      <button data-prev></button>
      <button data-next></button>
    </div>`;
  const root = document.querySelector<HTMLElement>("[data-carousel]")!;
  initCarousel(root, { onChange });
  const slides = Array.from(root.querySelectorAll<HTMLElement>("[data-slide]"));
  const dots = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-dot]"));
  const visible = () => slides.findIndex((s) => !s.hidden);
  const currentDot = () => dots.findIndex((d) => d.getAttribute("aria-current") === "true");
  return { root, slides, dots, visible, currentDot };
}

describe("servicios testimonials carousel", () => {
  it("moves forward and back with the arrows and wraps around", () => {
    const { root, visible, currentDot, slides } = setup();
    const next = root.querySelector<HTMLButtonElement>("[data-next]")!;
    const prev = root.querySelector<HTMLButtonElement>("[data-prev]")!;

    prev.click();
    expect(visible()).toBe(2);
    expect(currentDot()).toBe(2);
    next.click();
    expect(visible()).toBe(0);
    next.click();
    expect(visible()).toBe(1);
    expect(slides.filter((s) => !s.hidden)).toHaveLength(1);
  });

  it("jumps to a card from its dot and keeps a single current dot", () => {
    const { dots, visible, currentDot } = setup();
    dots[2].click();

    expect(visible()).toBe(2);
    expect(currentDot()).toBe(2);
    expect(dots.filter((d) => d.hasAttribute("aria-current"))).toHaveLength(1);
  });

  it("reports each change with its direction so the 3D turn knows which way to go", () => {
    const calls: [number, number, number][] = [];
    const { root, slides, dots } = setup(4, (from, to, direction) =>
      calls.push([slides.indexOf(from), slides.indexOf(to), direction]),
    );
    root.querySelector<HTMLButtonElement>("[data-next]")!.click();
    root.querySelector<HTMLButtonElement>("[data-prev]")!.click();
    root.querySelector<HTMLButtonElement>("[data-prev]")!.click();
    dots[2].click();
    dots[2].click();

    expect(calls).toEqual([
      [0, 1, 1],
      [1, 0, -1],
      [0, 3, -1],
      [3, 2, -1],
    ]);
  });
});
