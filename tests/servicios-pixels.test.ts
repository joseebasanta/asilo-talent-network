import { describe, expect, it } from "vitest";
import { appear, buildGrid, createPixel, GAP, recolorGroups, rippleDelay } from "../src/scripts/servicios-pixels";

const fixed = (value: number) => () => value;

describe("servicios hero pixels", () => {
  it("lays a pixel every 6px and picks 4 muted for each accent", () => {
    const sequence = [0.1, 0.3, 0.5, 0.7, 0.9];
    let i = 0;
    const rand = () => sequence[i++ % sequence.length];
    const grid = buildGrid(60, 30, ["m", "m", "m", "m", "a"], rand);

    expect(GAP).toBe(6);
    expect(grid).toHaveLength(10 * 5);
    expect(grid.every((p) => p.x % GAP === 0 && p.y % GAP === 0)).toBe(true);
  });

  it("delays each pixel by its distance to the center, so the grid appears as a ripple", () => {
    expect(rippleDelay(50, 25, 100, 50)).toBe(0);
    expect(rippleDelay(0, 25, 100, 50)).toBeCloseTo(50 * 0.65);
    expect(rippleDelay(0, 0, 100, 50)).toBeGreaterThan(rippleDelay(25, 25, 100, 50));
  });

  it("waits for its delay, grows to its max size and then shimmers between min and max", () => {
    const p = createPixel(0, 0, "m", 10, { width: 100, height: 100 }, fixed(0.5));
    let frames = 0;
    while (!appear(p)) frames++;
    expect(frames).toBeGreaterThan(0);

    const sizes: number[] = [];
    for (let i = 0; i < 2000; i++) {
      appear(p);
      sizes.push(p.size);
    }
    expect(p.isShimmer).toBe(true);
    const settled = sizes.slice(100);
    expect(Math.max(...settled)).toBeLessThanOrEqual(p.maxSize + p.sizeStep);
    expect(Math.min(...settled)).toBeGreaterThanOrEqual(p.minSize - p.speed);
    expect(new Set(settled.map((s) => s.toFixed(3))).size).toBeGreaterThan(2);
  });

  it("recolors each group in place when the theme changes, keeping sizes and positions", () => {
    const muted = [createPixel(0, 0, "#a3a3a3", 0, { width: 10, height: 10 }), createPixel(6, 0, "#a3a3a3", 0, { width: 10, height: 10 })];
    const accent = [createPixel(0, 6, "#0066ff", 0, { width: 10, height: 10 })];
    muted[0].size = 1.5;
    recolorGroups([muted, accent], ["#d1d1d1", "#d1d1d1", "#d1d1d1", "#d1d1d1", "#0066ff"]);
    expect(muted.map((p) => p.color)).toEqual(["#d1d1d1", "#d1d1d1"]);
    expect(accent[0].color).toBe("#0066ff");
    expect(muted[0].size).toBe(1.5);
    expect(muted[1].x).toBe(6);
  });
});
