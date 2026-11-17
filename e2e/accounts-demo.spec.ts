import { expect, test } from "@playwright/test";

test.describe("demo de cuentas", () => {
  test("entra, conserva el marcador de pestaña al recargar y permite salir", async ({ page }) => {
    await page.goto("/demo-cuentas/entrar");
    await expect(page.getByRole("button", { name: "Entrar sin credenciales" })).toBeVisible();
    await page.getByRole("button", { name: "Entrar sin credenciales" }).click();
    await expect(page).toHaveURL(/\/demo-cuentas\/onboarding\?demo=1/);
    await expect(page.getByRole("heading", { name: "Cuéntanos quién eres" })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: "Cuéntanos quién eres" })).toBeVisible();
    await expect(page.locator("[data-demo-gate]")).toBeHidden();
    await expect(page.locator("[data-demo-sign-out]")).toBeVisible();

    const storage = await page.evaluate(() => ({ ...sessionStorage }));
    expect(Object.keys(storage)).toEqual(["asilo-demo-account"]);
    expect(Object.values(storage)).toEqual(["signed-in"]);

    await page.getByRole("button", { name: "Salir del demo" }).click();
    await expect(page.getByRole("heading", { name: "Entra al demo para continuar" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Entrar al demo" })).toBeVisible();
    await expect(page.evaluate(() => ({ ...sessionStorage }))).resolves.toEqual({});
  });

  test("keeps the development-only route inaccessible when the server is not opted in", async ({ request }) => {
    const response = await request.get("/demo-cuentas");
    test.skip(response.status() === 200, "The configured browser server has the demo opt-in enabled.");
    expect(response.status()).toBe(404);
  });
});
