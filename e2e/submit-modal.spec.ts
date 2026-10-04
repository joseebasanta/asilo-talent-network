import { expect, test } from "@playwright/test";
import { collator } from "./helpers";

test.describe("Add project modal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "AGREGA TU PROYECTO" }).click();
    await expect(page.getByRole("dialog", { name: "Agrega tu proyecto" })).toBeVisible();
  });

  test("lists categories alphabetically, including Legaltech and PropTech", async ({ page }) => {
    const names = await page.locator(".cat-name").allTextContents();
    expect(names).toEqual([...names].sort(collator.compare));
    expect(names).toEqual(expect.arrayContaining(["Legaltech", "PropTech"]));
  });

  test("allows at most three categories", async ({ page }) => {
    const rows = page.locator(".cat-row");
    for (let i = 0; i < 3; i += 1) await rows.nth(i).click();
    await expect(page.locator("[data-cat-count]")).toHaveText("3 / 3 SELECCIONADAS");
    await expect(rows.nth(3).locator("input")).toBeDisabled();
  });

  test("closes only through its explicit controls, never on Escape, a backdrop click or a drag", async ({ page }) => {
    const dialog = page.getByRole("dialog");
    const input = dialog.getByLabel("Nombre del proyecto");

    // Selecting text and releasing outside the card must not close it.
    const box = (await input.boundingBox())!;
    await page.mouse.move(box.x + 5, box.y + 5);
    await page.mouse.down();
    await page.mouse.move(5, 5);
    await page.mouse.up();
    await expect(dialog).toBeVisible();

    // Dismissal is explicit (Cancelar / Listo): a stray click or Escape keeps typed input.
    await page.mouse.click(5, 5);
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "Cancelar" }).click();
    await expect(dialog).toBeHidden();
  });

  test("previews a valid logo on the light tile and rejects other formats", async ({ page }) => {
    const dialog = page.getByRole("dialog");
    const input = dialog.locator('input[name="logo"]');

    await input.setInputFiles({ name: "logo.gif", mimeType: "image/gif", buffer: Buffer.from("GIF89a") });
    await expect(dialog.locator('[data-field="logo"] [data-field-error]')).toHaveText("El logo debe ser PNG, JPG o WebP.");

    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      "base64",
    );
    await input.setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: png });
    await expect(dialog.locator("[data-logo-title]")).toHaveText("logo.png");
    await expect(dialog.locator("[data-logo-thumb]")).toBeVisible();
    await expect(dialog.locator("[data-logo-thumb]")).toHaveClass(/logo-tile/);
  });

  test("shows the server's error without losing what was typed", async ({ page }) => {
    await page.route("**/api/projects/submit", (route) =>
      route.fulfill({ status: 409, json: { ok: false, error: "Este proyecto ya fue enviado al directorio." } }));
    const dialog = page.getByRole("dialog");
    await fillValidProject(dialog);
    await dialog.getByRole("button", { name: "Agrega tu proyecto" }).click();
    await expect(dialog.getByRole("status")).toHaveText("Este proyecto ya fue enviado al directorio.");
    await expect(dialog.getByLabel("Nombre del proyecto")).toHaveValue("Mi Proyecto");
  });

  test("uses tú copy and accented labels", async ({ page }) => {
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByLabel("URL del sitio web")).toBeVisible();
    await expect(dialog.getByLabel("Descripción corta")).toBeVisible();
    await expect(dialog.getByText("Categorías", { exact: true })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Agrega tu proyecto" })).toBeVisible();

    await dialog.getByRole("button", { name: "Agrega tu proyecto" }).click();
    await expect(dialog.getByRole("status")).toHaveText("Revisa los campos marcados antes de enviar.");
    await expect(dialog.locator('[data-field="fundadores"] [data-field-error]'))
      .toHaveText("Indica quién fundó el proyecto (hasta 160 caracteres).");
    await expect(dialog.locator('[data-field="categorias"] [data-field-error]'))
      .toHaveText("Selecciona entre 1 y 3 categorías válidas.");
  });

  test("announces field errors as alerts, like the form-level status", async ({ page }) => {
    const dialog = page.getByRole("dialog");
    expect(await dialog.locator("[data-field-error]:not([role='alert'])").count()).toBe(0);
    await dialog.getByRole("button", { name: "Agrega tu proyecto" }).click();
    await expect(dialog.getByRole("alert").first()).toBeVisible();
  });

  test("starts from a clean form every time it opens", async ({ page }) => {
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nombre del proyecto").fill("Mi Proyecto");
    await dialog.getByRole("button", { name: "Agrega tu proyecto" }).click();
    await expect(dialog.getByRole("status")).toBeVisible();
    await dialog.getByRole("button", { name: "Cancelar" }).click();
    await expect(dialog).toBeHidden();

    await page.getByRole("button", { name: "AGREGA TU PROYECTO" }).click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("Nombre del proyecto")).toHaveValue("");
    await expect(dialog.getByRole("status")).toBeHidden();
    await expect(dialog.locator("[data-field-error]:visible")).toHaveCount(0);
    await expect(dialog.locator("[aria-invalid='true']")).toHaveCount(0);
  });

  test("keeps a server error in view and moves focus to it on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 600 });
    await page.route("**/api/projects/submit", (route) =>
      route.fulfill({ status: 500, json: { ok: false, error: "No se pudo guardar tu proyecto." } }));
    const dialog = page.getByRole("dialog");
    await fillValidProject(dialog);
    await dialog.getByRole("button", { name: "Agrega tu proyecto" }).click();
    const status = dialog.getByRole("status");
    await expect(status).toHaveText("No se pudo guardar tu proyecto.");
    await expect(status).toBeInViewport({ ratio: 1 });
    await expect(status).toBeFocused();
  });

  test("close button has a 44px touch target", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    // Layout size, not the bounding box: the dialog is still scaling in.
    const size = await page.getByRole("dialog").getByRole("button", { name: "Cerrar" })
      .evaluate((el) => ({ width: (el as HTMLElement).offsetWidth, height: (el as HTMLElement).offsetHeight }));
    expect(size.width).toBeGreaterThanOrEqual(44);
    expect(size.height).toBeGreaterThanOrEqual(44);
  });

  test("confirms a submission and can start a new one", async ({ page }) => {
    await page.route("**/api/projects/submit", (route) =>
      route.fulfill({ status: 201, json: { ok: true } }));
    const dialog = page.getByRole("dialog");
    await fillValidProject(dialog);
    await dialog.getByRole("button", { name: "Agrega tu proyecto" }).click();
    await expect(dialog.getByRole("heading", { name: /Tu proyecto ya está en revisión/ })).toBeVisible();

    await dialog.getByRole("button", { name: "Agregar otro proyecto" }).click();
    await expect(dialog.getByLabel("Nombre del proyecto")).toHaveValue("");
    await expect(page.locator("[data-cat-count]")).toHaveText("0 / 3 SELECCIONADAS");
  });
});

async function fillValidProject(dialog: import("@playwright/test").Locator) {
  await dialog.getByLabel("Nombre del proyecto").fill("Mi Proyecto");
  await dialog.getByLabel("URL del sitio web").fill("miproyecto.example");
  await dialog.getByLabel("Descripción corta").fill("Una descripción clara del proyecto.");
  await dialog.getByLabel("Fundadores").fill("Ana");
  await dialog.locator(".cat-row").first().click();
}
