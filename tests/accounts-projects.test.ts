import { describe, expect, it } from "vitest";
import { DEMO_PROJECTS, acceptDemoInvitation, canManageDemoProject, createDemoInvitation, getPublishedDemoProjects, updateDemoProject, updateDemoProjectStatus } from "../src/lib/accounts/demo-projects";

describe("mis proyectos demo", () => {
  it("contains fictional projects with the prototype states", () => {
    expect(DEMO_PROJECTS.map((project) => project.status)).toEqual(["published", "draft", "archived"]);
    expect(JSON.stringify(DEMO_PROJECTS)).not.toMatch(/password|token|GOOGLE|APPWRITE/i);
  });

  it("changes a synthetic project's status without calling a service", () => {
    expect(updateDemoProjectStatus("demo-pana-pay", "archived").status).toBe("archived");
    updateDemoProjectStatus("demo-pana-pay", "published");
  });

  it("exposes only published projects for promotion selection", () => {
    expect(getPublishedDemoProjects().map((project) => project.id)).toEqual(["demo-pana-pay"]);
  });

  it("edits the original editor fields in memory", () => {
    const result = updateDemoProject("demo-ruta-viva", {
      logo: "data:image/png;base64,synthetic",
      website: "https://ruta-viva.demo",
      long: "Descripción larga demo.",
      socials: { instagram: "@ruta", tiktok: "", x: "@ruta", linkedin: "" },
      city: "Caracas",
      slug: "ruta-viva-demo",
    });
    expect(result.logo).toContain("data:image/png");
    expect(result.website).toBe("https://ruta-viva.demo");
    expect(result.long).toBe("Descripción larga demo.");
    expect(result.socials.instagram).toBe("@ruta");
    expect(result.city).toBe("Caracas");
    expect(result.slug).toBe("ruta-viva-demo");
    updateDemoProject("demo-ruta-viva", { logo: null, website: "", long: "", socials: { instagram: "", tiktok: "", x: "", linkedin: "" }, city: "", slug: "ruta-viva" });
  });

  it("limits owner-only demo actions while founders can edit", () => {
    expect(canManageDemoProject("demo-pana-pay", "Lucía Demo")).toBe(true);
    expect(canManageDemoProject("demo-pana-pay", "Andrés Demo")).toBe(false);
    expect(() => updateDemoProjectStatus("demo-pana-pay", "archived", "Andrés Demo")).toThrow("administrador");
    expect(() => createDemoInvitation("demo-pana-pay", "Marta Demo", "Founder", "Andrés Demo")).toThrow("administrador");
  });

  it("creates and accepts a synthetic invitation without email or network data", () => {
    const invitation = createDemoInvitation("demo-ruta-viva", "Marta Demo", "Cofounder");
    expect(invitation.status).toBe("pending");
    expect(JSON.stringify(invitation)).not.toMatch(/@|email|token|password/i);
    expect(acceptDemoInvitation(invitation.id).founders).toContain("Marta Demo");
  });
});

describe("project prototype route contract", () => {
  it("keeps project and founder pages inside the development demo gate", async () => {
    const fs = await import("node:fs/promises");
    const projects = await fs.readFile("src/pages/demo-cuentas/mis-proyectos.astro", "utf8");
    const founder = await fs.readFile("src/pages/demo-cuentas/founders/[id].astro", "utf8");
    expect(projects).toContain("isaacAccountsPrototypeEnabled");
    expect(projects).toContain("data-demo-projects");
    expect(projects).toContain("No se registra ni publica ningún proyecto real");
    expect(founder).toContain("isaacAccountsPrototypeEnabled");
    expect(`${projects}\n${founder}`).not.toMatch(/fetch\s*\(|\/api\//i);
  });
});
