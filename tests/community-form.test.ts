import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import CommunityForm from "../src/components/CommunityForm.astro";

describe("membership form markup", () => {
  it("uses POST as its native fallback and a server-rendered fill timestamp", async () => {
    const before = Date.now();
    const container = await AstroContainer.create();
    const html = await container.renderToString(CommunityForm);
    expect(html).toMatch(/<form[^>]*method="post"[^>]*action="\/api\/community\/submit"[^>]*enctype="multipart\/form-data"/);
    const timestamp = Number(html.match(/name="started" value="(\d+)"/)?.[1]);
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(Date.now());
    expect(html).toContain('aria-labelledby="community-title"');
    expect(html).toContain('aria-live="polite"');
  });
});
