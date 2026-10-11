import type { Page } from "@playwright/test";

/** Every project title in the directory, across all carousel pages, in order. */
export function directoryTitles(page: Page): Promise<string[]> {
  return page.locator("#project-directory-list .prj-name").allTextContents();
}

export const collator = new Intl.Collator("es", { sensitivity: "base", numeric: true });

/**
 * Forms reject fills faster than the server's minimum (3 s from render), so
 * tests that submit wait that long after loading, like a human would.
 */
export const MIN_FILL_MS = 3_100;
