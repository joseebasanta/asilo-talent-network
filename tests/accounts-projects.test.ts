import { describe, expect, it } from "vitest";
import { DEMO_PROJECTS, acceptDemoInvitation, createDemoInvitation, getPublishedDemoProjects, updateDemoProject, updateDemoProjectStatus } from "../src/lib/accounts/demo-projects";

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

  it("edits synthetic project details in memory", () => {
    const result = updateDemoProject("demo-ruta-viva", { short: "Nueva descripción demo", stage: "Crecimiento" });
    expect(result.short).toBe("Nueva descripción demo");
    expect(result.stage).toBe("Crecimiento");
    updateDemoProject("demo-ruta-viva", { short: "Seguimiento de entregas de última milla con WhatsApp.", stage: "MVP" });
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
