import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { GLOW_EASE, GLOW_FADE_OFFSET, GLOW_SCROLL_OFFSET, GLOW_START_SCALE } from "../src/scripts/servicios-footer-glow";

describe("servicios footer glow", () => {
  it("holds a thin line while the footer comes in and expands only over the reserved space at the end", () => {
    expect(GLOW_START_SCALE).toBeGreaterThan(0);
    expect(GLOW_START_SCALE).toBeLessThan(0.1);
    // Progreso ligado al espacio reservado: 0 cuando asoma por abajo, 1 al final de la página.
    expect(GLOW_SCROLL_OFFSET).toEqual(["start end", "end end"]);
    const script = readFileSync(new URL("../src/scripts/servicios-footer-glow.ts", import.meta.url), "utf8");
    expect(script).toContain('import { animate, scroll } from "motion";');
    expect(script).toContain('transform: [`scaleY(${GLOW_START_SCALE})`, "scaleY(1)"]');
    expect(script).toContain("scroll(grow, { target: space, offset: [...GLOW_SCROLL_OFFSET] })");
    expect(script).toContain("(prefers-reduced-motion: reduce)");
  });

  it("fades the line in as the footer enters and eases the expansion", () => {
    expect(GLOW_FADE_OFFSET).toEqual(["start end", "200px end"]);
    expect(GLOW_EASE).toEqual([0.65, 0, 0.35, 1]);
    const script = readFileSync(new URL("../src/scripts/servicios-footer-glow.ts", import.meta.url), "utf8");
    expect(script).toContain("animate(glow, { opacity: [0, 1] }");
    expect(script).toContain("scroll(fade, { target: footer, offset: [...GLOW_FADE_OFFSET] })");
    // El desenfoque está fuera del elemento que se escala, para que la línea inicial también sea suave.
    const css = readFileSync(new URL("../src/styles/servicios.css", import.meta.url), "utf8");
    expect(css).toMatch(/\.s-footer-glow-bars \{[^}]*filter: blur\(10px\);\s*\}/);
    expect(css).toMatch(/\.s-footer-glow-rise \{[^}]*transform-origin: 50% calc\(100% - 16px\);/);
  });
});
