import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// User-facing Spanish uses "tú", never voseo ("Revisá", "Intentá", "Seleccioná").
const FILES = [
  "src/components/ProjectFormModal.astro",
  "src/lib/projects-schema.ts",
  "src/lib/projects-logo-server.ts",
  "src/lib/turnstile.ts",
  "src/pages/api/projects/submit.ts",
];

const VOSEO =
  /(?<!\p{L})(ingresá|seleccioná|revisá|completá|intentá|escribí|elegí|incluí|recargá|probá|esperá|enviá|usá|reducí|quitá|subí|agregá|tenés|podés|querés)(?!\p{L})/iu;

describe("project flow copy", () => {
  it.each(FILES)("%s has no voseo", (file) => {
    const lines = readFileSync(file, "utf8").split("\n");
    const offenders = lines.filter((line) => VOSEO.test(line));
    expect(offenders).toEqual([]);
  });

  it("uses Spanish labels in the project form", () => {
    const form = readFileSync("src/components/ProjectFormModal.astro", "utf8");
    expect(form).not.toContain("Website URL");
    expect(form).not.toContain("Descripcion corta");
    expect(form).toContain("URL del sitio web");
    expect(form).toContain("Descripción corta");
    expect(form).toContain('submit: "Agrega tu proyecto"');
  });
});
