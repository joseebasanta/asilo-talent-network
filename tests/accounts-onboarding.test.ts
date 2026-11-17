import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("demo onboarding original flow", () => {
  const page = () => readFileSync(resolve("src/pages/demo-cuentas/onboarding.astro"), "utf8");
  const script = () => readFileSync(resolve("src/scripts/onboarding.ts"), "utf8");

  it("keeps the session gate and restores every project step", () => {
    const source = page();
    expect(source).toContain("data-demo-gate");
    for (const marker of ["data-step=\"profile\"", "data-step=\"ask\"", "data-step=\"info\"", "data-step=\"details\"", "data-step=\"founders\"", "data-step=\"review\"", "data-step=\"done\""]) {
      expect(source).toContain(marker);
    }
    expect(source).toContain("data-autofill");
    expect(source).toContain('name="logo"');
    expect(source).toContain('name="seekingInvestment"');
    expect(source).toContain("data-invite");
    expect(source).toContain('data-save="draft"');
  });

  it("uses only in-memory synthetic onboarding state and labels simulated behavior", () => {
    const source = `${page()}\n${script()}`;
    expect(source).toContain("No es autenticación real");
    expect(source).toContain("simulad");
    expect(source).not.toMatch(/localStorage|indexedDB|fetch\(|password|credentials/i);
    expect(source).toContain("invitación");
  });

  it("supports review editing and draft or published simulation without service writes", () => {
    const source = `${page()}\n${script()}`;
    for (const marker of ["Editar", "Guardar borrador", "Revisión", "Autocompletado simulado", "Borrador guardado"]) {
      expect(source).toContain(marker);
    }
    expect(source).not.toMatch(/googleapis|appwrite|\.create\(|\.update\(|fetch\(/i);
  });
});
