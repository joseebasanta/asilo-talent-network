import { expect, test } from "@playwright/test";

async function openPanaPay(page: import("@playwright/test").Page) {
  await page.goto("/?orden=az");
  const href = await page.locator(".prj-item", { hasText: "Pana Pay" }).locator(".prj-link").getAttribute("href");
  await page.goto(href!);
  return href!;
}

test.describe("Project page", () => {
  test("shows the project, and its site link", async ({ page }) => {
    await openPanaPay(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Pana Pay");
    const visit = page.getByRole("link", { name: /Visitar panapay\.example/ });
    await expect(visit).toHaveAttribute("href", "https://panapay.example");
    await expect(visit).toHaveAttribute("target", "_blank");
    await expect(page.locator(".pd-comments, [data-like]")).toHaveCount(0);
  });

  test("redirects old slugs and 404s unknown projects", async ({ page }) => {
    const href = await openPanaPay(page);
    const id = href.slice(-12);
    await page.goto(`/proyectos/nombre-viejo-${id}`);
    await expect(page).toHaveURL(href);

    const response = await page.goto("/proyectos/no-existe");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Proyecto no encontrado");
  });

  test("the edit request form is prefilled and locks the website", async ({ page }) => {
    await openPanaPay(page);
    await page.getByRole("button", { name: "Solicita cambios" }).click();
    const dialog = page.getByRole("dialog", { name: "Solicitar cambios" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("Nombre del proyecto")).toHaveValue("Pana Pay");
    await expect(dialog.getByLabel("URL del sitio web")).toHaveAttribute("readonly", "");
    await expect(dialog.getByLabel("Tu contacto")).toHaveAttribute("required", "");
    await expect(dialog.locator(".cat-checkbox:checked")).toHaveCount(2);
  });

  test("reopening the edit request restores the original values and clears errors", async ({ page }) => {
    await openPanaPay(page);
    await page.getByRole("button", { name: "Solicita cambios" }).click();
    const dialog = page.getByRole("dialog", { name: "Solicitar cambios" });
    const name = dialog.getByLabel("Nombre del proyecto");
    const original = await name.inputValue();
    const description = await dialog.getByLabel("Descripción corta").inputValue();
    await name.fill("Otro nombre");
    await dialog.getByLabel("Descripción corta").fill("corta");
    await dialog.getByRole("button", { name: "Enviar cambios" }).click();
    await expect(dialog.locator("[data-field-error]:visible").first()).toBeVisible();
    await dialog.getByRole("button", { name: "Cancelar" }).click();
    await expect(dialog).toBeHidden();

    await page.getByRole("button", { name: "Solicita cambios" }).click();
    await expect(dialog).toBeVisible();
    await expect(name).toHaveValue(original);
    await expect(dialog.getByLabel("Descripción corta")).toHaveValue(description);
    await expect(dialog.locator("[data-field-error]:visible")).toHaveCount(0);
    await expect(dialog.getByRole("status")).toBeHidden();
    await expect(dialog.locator(".cat-checkbox:checked")).toHaveCount(2);
  });

  test("an accepted edit request shows its own confirmation", async ({ page }) => {
    await openPanaPay(page);
    // The submit endpoint writes to the real sheet; stub it at the network edge.
    await page.route("**/api/projects/submit", (route) =>
      route.fulfill({ status: 201, json: { ok: true } }));
    await page.getByRole("button", { name: "Solicita cambios" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Tu contacto").fill("@ana");
    await dialog.getByRole("button", { name: "Enviar cambios" }).click();
    await expect(dialog.getByRole("heading", { name: /Tus cambios están en revisión/ })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Agregar otro proyecto" })).toHaveCount(0);
  });
});
