import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styles = readFileSync(new URL("../src/styles/global.css", import.meta.url), "utf8");

function rule(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = styles.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`));
  expect(match, `missing rule for ${selector}`).not.toBeNull();
  return match![1];
}

describe("shell polish", () => {
  it("aligns the header container with the page content container", () => {
    expect(rule(".header-inner")).toMatch(/max-width:\s*calc\(80rem \+ 2 \* var\(--gutter\)\)/);
  });

  it("backs footer links so the ASCII background does not cut through the text", () => {
    const body = rule(".footer-linklist a");
    expect(body).toMatch(/text-shadow:[^;]*var\(--bg\)/);
  });

  it("gives footer links and social icons 44px hit areas", () => {
    expect(rule(".footer-linklist a")).toMatch(/min-height:\s*44px/);
    const social = rule(".footer-social a");
    expect(social).toMatch(/padding:\s*\.625rem/);
    expect(social).toMatch(/margin:\s*-\.625rem/);
  });

  it("removes the temporary Vercel preview marker", () => {
    expect(existsSync(new URL("../docs/preview-check.md", import.meta.url))).toBe(false);
  });
});
