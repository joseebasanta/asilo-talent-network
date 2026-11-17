import { describe, expect, it } from "vitest";
import { DEMO_PROFILE, resetDemoProfile, updateDemoAccess, updateDemoPhoto, updateDemoProfile } from "../src/lib/accounts/demo-profile";

describe("perfil demo", () => {
  it("provides synthetic profile data without credentials", () => {
    expect(DEMO_PROFILE.name).toBe("Lucía Demo");
    expect("email" in DEMO_PROFILE).toBe(false);
    expect(JSON.stringify(DEMO_PROFILE)).not.toMatch(/password|token|contraseña/i);
  });

  it("updates only the in-memory synthetic profile", () => {
    const result = updateDemoProfile({ bio: "Construyo herramientas para builders." });
    expect(result.ok).toBe(true);
    expect(result.profile.bio).toContain("builders");
  });

  it("supports a local photo preview and simulated access change", () => {
    expect(updateDemoPhoto("data:image/png;base64,synthetic").profile.photo).toContain("data:image/png");
    expect(updateDemoAccess().profile.accessStatus).toBe("updated");
    expect(JSON.stringify(DEMO_PROFILE)).not.toMatch(/password|contraseña/i);
    resetDemoProfile();
  });
});

describe("perfil demo route contract", () => {
  it("uses the isolated profile and no production endpoints", async () => {
    const source = await import("node:fs/promises").then((fs) => fs.readFile("src/pages/demo-cuentas/perfil.astro", "utf8"));
    expect(source).toContain("isaacAccountsPrototypeEnabled");
    expect(source).toContain("data-demo-profile");
    expect(source).toContain("data-photo-input");
    expect(source).toContain("data-access-form");
    expect(source).toContain("data-delete-account");
    expect(source).not.toMatch(/fetch\s*\(|\/api\//i);
  });
});
