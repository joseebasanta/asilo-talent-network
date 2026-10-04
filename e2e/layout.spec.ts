import { expect, test, type Page } from "@playwright/test";

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

test.describe("Layout", () => {
  test("home has no horizontal scroll and the directory header fits", async ({ page }) => {
    await page.goto("/");
    await expectNoHorizontalScroll(page);

    const title = (await page.locator(".prj-title").boundingBox())!;
    const browse = (await page.locator(".prj-browse").boundingBox())!;
    const sameRow = Math.abs(title.y - browse.y) < title.height;
    if (sameRow) expect(title.x + title.width).toBeLessThanOrEqual(browse.x);
  });

  test("closing CTA separates joining from adding a project", async ({ page }) => {
    await page.goto("/");
    const cta = page.locator("#unete-cta");
    await expect(cta.getByRole("link", { name: /Llenar formulario/ })).toBeVisible();
    await expect(cta.getByText("No necesitas registrarte de nuevo")).toBeVisible();
    await cta.getByRole("link", { name: "agrega tu proyecto al directorio" }).click();
    await expect(page).toHaveURL(/#proyectos$/);

    const heading = page.locator(".cta-title");
    const fits = await heading.evaluate((el) => el.scrollWidth <= el.clientWidth);
    expect(fits).toBe(true);
  });

  test("project page has no horizontal scroll", async ({ page }) => {
    await page.goto("/?orden=az");
    const href = await page.locator(".prj-link").first().getAttribute("href");
    await page.goto(href!);
    await expectNoHorizontalScroll(page);
  });
});
