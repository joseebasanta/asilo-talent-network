import { afterEach, describe, expect, it, vi } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import DemoAccountsPage from "../src/pages/demo-cuentas.astro";

async function requestPage() {
  const container = await AstroContainer.create();
  return container.renderToResponse(DemoAccountsPage, {
    request: new Request("https://asilo.test/demo-cuentas"),
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("public demo accounts route", () => {
  it("returns not found without the development opt-in and ships no prototype", async () => {
    vi.stubEnv("DEV", true);
    vi.stubEnv("SSR", true);
    vi.stubEnv("ISAAC_ACCOUNTS_PROTOTYPE", "");

    const response = await requestPage();
    const body = await response.text();

    expect(response.status).toBe(404);
    expect(body).not.toContain("Cuentas de Isaac");
    expect(body).not.toContain("prototype");
  });

  it("renders only the minimal placeholder when explicitly enabled in development", async () => {
    vi.stubEnv("DEV", true);
    vi.stubEnv("SSR", true);
    vi.stubEnv("ISAAC_ACCOUNTS_PROTOTYPE", "1");

    const response = await requestPage();
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("Cuentas de Isaac");
    expect(body).toContain("solo una integración de desarrollo");
    expect(body).not.toMatch(/password|contraseña|localStorage|fetch\s*\(/i);
  });

  it("remains inaccessible when a production server receives the opt-in", async () => {
    vi.stubEnv("DEV", false);
    vi.stubEnv("SSR", true);
    vi.stubEnv("ISAAC_ACCOUNTS_PROTOTYPE", "1");

    const response = await requestPage();

    expect(response.status).toBe(404);
  });
});
