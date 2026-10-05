import { describe, expect, it } from "vitest";
import { projectIconUrl } from "../src/lib/project-icons";
import { CATEGORIES } from "../src/lib/projects-submit";

describe("projectIconUrl", () => {
  it("uses the first category and falls back to the neutral box", () => {
    expect(projectIconUrl(["Inteligencia Artificial", "Gaming"]))
      .toBe("/icons/pixelarticons/ai-view.svg");
    expect(projectIconUrl(["Gaming"]))
      .toBe("/icons/pixelarticons/gamepad.svg");
    expect(projectIconUrl([])).toBe("/icons/pixelarticons/box.svg");
  });

  it("maps every selectable category to an explicit icon", () => {
    expect(projectIconUrl(["PropTech"])).toBe("/icons/pixelarticons/home.svg");
    expect(projectIconUrl(["Legaltech"])).toBe("/icons/pixelarticons/shield.svg");
    for (const category of CATEGORIES) {
      if (category === "Agritech" || category === "Energía & Clima" || category === "Hardware & IoT") continue;
      expect(projectIconUrl([category]), category).not.toBe("/icons/pixelarticons/box.svg");
    }
  });
});
