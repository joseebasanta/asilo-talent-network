import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, describe, expect, it, vi } from "vitest";
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

describe("membership form Turnstile widget", () => {
  async function render() {
    const container = await AstroContainer.create();
    return container.renderToString(CommunityForm);
  }
  afterEach(() => { vi.unstubAllEnvs(); });

  it("renders no widget without a site key", async () => {
    vi.stubEnv("TURNSTILE_SITE_KEY", "");
    const html = await render();
    expect(html).not.toContain("cf-turnstile");
    expect(html).not.toContain("data-community-turnstile");
  });

  it("renders the widget, its error slot and the site key when configured", async () => {
    vi.stubEnv("TURNSTILE_SITE_KEY", "1x00000000000000000000AA");
    const html = await render();
    expect(html).toContain('class="cf-turnstile"');
    expect(html).toContain('data-sitekey="1x00000000000000000000AA"');
    expect(html).toContain('id="community-captcha-error"');
    expect(html).not.toContain("TURNSTILE_SECRET_KEY");
  });
});
