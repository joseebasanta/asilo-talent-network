import { describe, expect, it } from "vitest";
import { projectIconUrl } from "../src/lib/project-icons";

describe("projectIconUrl", () => {
  it("uses the first category and falls back to the neutral box", () => {
    expect(projectIconUrl(["Inteligencia Artificial", "Gaming"]))
      .toBe("/icons/pixelarticons/ai-view.svg");
    expect(projectIconUrl(["Gaming"]))
      .toBe("/icons/pixelarticons/gamepad.svg");
    expect(projectIconUrl([])).toBe("/icons/pixelarticons/box.svg");
  });
});
