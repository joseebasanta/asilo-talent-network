import { describe, expect, it } from "vitest";
import {
  idFromSlug,
  projectIdFor,
  projectSlug,
  slugify,
} from "../src/lib/project-identity";

describe("project identity", () => {
  it("derives the same 12-hex id from equivalent website spellings", () => {
    const id = projectIdFor("https://www.panapay.com/");
    expect(id).toMatch(/^[0-9a-f]{12}$/);
    expect(projectIdFor("PanaPay.com")).toBe(id);
    expect(projectIdFor("not a url")).toBe("");
  });

  it("slugifies titles with accents and punctuation", () => {
    expect(slugify("Diseño & Café!")).toBe("diseno-cafe");
    expect(slugify("¡¡!!")).toBe("");
  });

  it("round-trips the id through the slug, ignoring the readable part", () => {
    const id = projectIdFor("panapay.com");
    expect(idFromSlug(projectSlug("Pana Pay", id))).toBe(id);
    expect(idFromSlug(`otro-nombre-${id}`)).toBe(id);
    expect(idFromSlug(projectSlug("¡¡!!", id))).toBe(id);
    expect(idFromSlug("pana-pay")).toBeNull();
  });
});
