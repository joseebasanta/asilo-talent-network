import { describe, expect, it } from "vitest";
import { DEMO_PROJECTS, updateDemoProjectStatus } from "../src/lib/accounts/demo-projects";

describe("mis proyectos demo", () => {
  it("contains fictional projects with the prototype states", () => {
    expect(DEMO_PROJECTS.map((project) => project.status)).toEqual(["published", "draft", "archived"]);
    expect(JSON.stringify(DEMO_PROJECTS)).not.toMatch(/password|token|GOOGLE|APPWRITE/i);
  });

  it("changes a synthetic project's status without calling a service", () => {
    expect(updateDemoProjectStatus("demo-pana-pay", "archived").status).toBe("archived");
  });
});

describe("project prototype route contract", () => {
  it("keeps project and founder pages inside the development demo gate", async () => {
    const fs = await import("node:fs/promises");
    const projects = await fs.readFile("src/pages/demo-cuentas/mis-proyectos.astro", "utf8");
    const founder = await fs.readFile("src/pages/demo-cuentas/founders/[id].astro", "utf8");
    expect(projects).toContain("isaacAccountsPrototypeEnabled");
    expect(founder).toContain("isaacAccountsPrototypeEnabled");
    expect(`${projects}\n${founder}`).not.toMatch(/fetch\s*\(|\/api\//i);
  });
});
