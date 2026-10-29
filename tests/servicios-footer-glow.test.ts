import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { GLOW_START_SCALE, glowScrollOffset } from "../src/scripts/servicios-footer-glow";

describe("servicios footer glow", () => {
  it("starts growing once the sticky glow can sit on the bottom edge and ends at the page end", () => {
    // Footer con 80px de padding y brillo de 260px: queda pegado abajo cuando asoman 340px del footer.
    expect(glowScrollOffset(80, 260)).toEqual(["340px end", "end end"]);
    expect(glowScrollOffset(64, 159.6)).toEqual(["224px end", "end end"]);
  });

  it("rises from a thin line to full height, tied to scroll and skipped with reduced motion", () => {
    expect(GLOW_START_SCALE).toBeGreaterThan(0);
    expect(GLOW_START_SCALE).toBeLessThan(0.1);
    const script = readFileSync(new URL("../src/scripts/servicios-footer-glow.ts", import.meta.url), "utf8");
    expect(script).toContain('import { animate, scroll } from "motion";');
    expect(script).toContain('transform: [`scaleY(${GLOW_START_SCALE})`, "scaleY(1)"]');
    expect(script).toContain("scroll(rise, { target: footer, offset })");
    expect(script).toContain("(prefers-reduced-motion: reduce)");
  });
});
