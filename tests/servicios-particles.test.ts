import { describe, expect, it } from "vitest";
import { particleCount, spawn, step } from "../src/scripts/servicios-particles";

const fixed = (value: number) => () => value;

describe("servicios hero particles", () => {
  it("keeps the original density of one particle per 7,000 px²", () => {
    expect(particleCount(1440, 724)).toBe(148);
    expect(particleCount(375, 628)).toBe(33);
    expect(particleCount(0, 0)).toBe(0);
  });

  it("spawns inside the area with the original speed, opacity and life ranges", () => {
    const p = spawn({}, 1000, 500, fixed(0.5));

    expect(p).toEqual({ x: 500, y: 250, speed: 0.2, opacity: 0.7, life: 400 });
  });

  it("rises and fades by elapsed time, so 120 Hz screens are not twice as fast", () => {
    const at60 = spawn({}, 1000, 500, fixed(0.5));
    const at120 = spawn({}, 1000, 500, fixed(0.5));
    for (let i = 0; i < 60; i++) step(at60, 1000 / 60, 1000, 500, fixed(0.5));
    for (let i = 0; i < 120; i++) step(at120, 1000 / 120, 1000, 500, fixed(0.5));

    expect(at60.y).toBeCloseTo(at120.y, 5);
    expect(at60.opacity).toBeCloseTo(at120.opacity, 5);
    expect(at60.opacity).toBeLessThan(0.7);
  });

  it("respawns a particle once it leaves the top or fades out", () => {
    const top = { x: 1, y: 0.1, speed: 0.2, opacity: 0.7, life: 400 };
    step(top, 1000 / 60, 1000, 500, fixed(0.5));
    expect(top).toEqual({ x: 500, y: 250, speed: 0.2, opacity: 0.7, life: 400 });

    const faded = { x: 1, y: 100, speed: 0.2, opacity: 0.005, life: 0 };
    step(faded, 1000 / 60, 1000, 500, fixed(0.5));
    expect(faded.opacity).toBe(0.7);
  });
});
