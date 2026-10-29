import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { GLOW_SCROLL_OFFSET, GLOW_START_SCALE } from "../src/scripts/servicios-footer-glow";

describe("servicios footer glow", () => {
  it("holds a thin line while the footer comes in and expands only over the reserved space at the end", () => {
    expect(GLOW_START_SCALE).toBeGreaterThan(0);
    expect(GLOW_START_SCALE).toBeLessThan(0.1);
    // Progreso ligado al espacio reservado: 0 cuando asoma por abajo, 1 al final de la página.
    expect(GLOW_SCROLL_OFFSET).toEqual(["start end", "end end"]);
    const script = readFileSync(new URL("../src/scripts/servicios-footer-glow.ts", import.meta.url), "utf8");
    expect(script).toContain('import { animate, scroll } from "motion";');
    expect(script).toContain('transform: [`scaleY(${GLOW_START_SCALE})`, "scaleY(1)"]');
    expect(script).toContain("scroll(rise, { target: space, offset: [...GLOW_SCROLL_OFFSET] })");
    expect(script).toContain("(prefers-reduced-motion: reduce)");
  });
});
