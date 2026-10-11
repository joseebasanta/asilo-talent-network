import { expect, test } from "@playwright/test";
import { collator, directoryTitles } from "./helpers";

test.describe("Proyectos directory", () => {
  test("shows only approved projects, with the latest revision", async ({ page }) => {
    await page.goto("/?orden=az");
    const titles = await directoryTitles(page);

    expect(titles).toHaveLength(12);
    expect(titles).not.toContain("Borrador");
    expect(titles.filter((t) => t === "Pana Pay")).toHaveLength(1);
    await expect(page.locator(".prj-item", { hasText: "Pana Pay" }).locator(".prj-desc"))
      .toContainText("USDT");
  });

  test("shows ten cards on the home and links to the full list", async ({ page }) => {
    await page.goto("/?orden=az");
    const pages = page.locator("[data-project-page]");
    await expect(pages.nth(0).locator(".prj-item")).toHaveCount(10);
    await expect(pages.nth(1)).toBeHidden();

    await page.getByRole("link", { name: "Ver todos" }).click();
    await expect(page).toHaveURL(/\/proyectos$/);
    await expect(page.locator("#project-count")).toContainText("12 proyectos");
  });

  test("sorts A–Z and Z–A without reloading", async ({ page }) => {
    await page.goto("/?orden=az");
    const az = await directoryTitles(page);
    expect(az).toEqual([...az].sort(collator.compare));

    await page.getByLabel("Ordenar").selectOption("za");
    await expect(page).toHaveURL(/orden=za/);
    await expect(page.locator(".prj-name").first()).toHaveText("Zeta Games");
    expect(await directoryTitles(page)).toEqual([...az].reverse());
  });

  test("shows the newest projects first", async ({ page }) => {
    await page.goto("/?orden=recientes");
    const titles = await directoryTitles(page);
    // Pana Pay keeps the position of its FIRST approved revision (the oldest).
    expect(titles[0]).toBe("Zeta Games");
    expect(titles.at(-1)).toBe("Pana Pay");
  });

  test("sorts /proyectos by most recent and syncs the URL", async ({ page }) => {
    await page.goto("/proyectos");
    await page.locator("#project-sort summary").click();
    await page.locator(".sort-option", { hasText: "Más recientes" }).click();
    await expect(page).toHaveURL(/orden=recientes/);
    await expect(page.locator("#sort-value")).toHaveText("Más recientes");
    await expect(page.locator("#project-results .prj-name:visible").first()).toHaveText("Zeta Games");

    await page.goto("/proyectos?orden=recientes");
    await expect(page.locator("#sort-value")).toHaveText("Más recientes");
    await expect(page.locator("#project-results .prj-name:visible").first()).toHaveText("Zeta Games");

    await page.locator("#project-sort summary").click();
    await page.locator(".sort-option", { hasText: "Nombre: A–Z" }).click();
    await expect(page).not.toHaveURL(/orden=/);
  });

  test("opens a project's page from its card", async ({ page }) => {
    await page.goto("/?orden=az");
    await page.locator(".prj-item", { hasText: "Ley Clara" }).click({ position: { x: 10, y: 10 } });
    await expect(page).toHaveURL(/\/proyectos\/ley-clara-[0-9a-f]{12}$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ley Clara");
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the sort control still works as a plain form", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Ordenar").selectOption("za");
    await page.getByRole("button", { name: "Aplicar" }).click();
    await expect(page).toHaveURL(/orden=za/);
    await expect(page.locator(".prj-name").first()).toHaveText("Zeta Games");
  });
});
