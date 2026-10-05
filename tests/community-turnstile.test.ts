import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COMMUNITY_HEADERS } from "../src/lib/community-submit";

const { append, get } = vi.hoisted(() => ({ append: vi.fn(), get: vi.fn() }));
vi.mock("@googleapis/sheets", () => ({
  default: { auth: { JWT: class {} }, sheets: () => ({ spreadsheets: { values: { append, get } } }) },
}));
import { POST } from "../src/pages/api/community/submit";

const valid = {
  email: "builder@example.com", name: "Ana Pérez", location: "Caracas, Venezuela",
  whatsapp: "+58 412 1234567", linkedin: "https://www.linkedin.com/in/ana",
  role: "Developer", project: "Mi proyecto", description: "",
};

let nextIp = 0;
function submit(edit?: (form: FormData) => void, ip = `ts-${++nextIp}`) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ ...valid, started: String(Date.now() - 10_000) })) form.set(key, value);
  edit?.(form);
  return POST({
    request: new Request("https://asilo.test/api/community/submit", { method: "POST", body: form }),
    clientAddress: ip,
  } as Parameters<typeof POST>[0]);
}
const withToken = (token: string) => (form: FormData) => form.set("cf-turnstile-response", token);

beforeEach(() => {
  vi.stubEnv("GOOGLE_SHEETS_ID", "projects");
  vi.stubEnv("GOOGLE_COMMUNITY_SHEETS_RANGE", "");
  vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_JSON_BASE64", Buffer.from(JSON.stringify({ client_email: "service@example.com", private_key: "test" })).toString("base64"));
  vi.stubEnv("TURNSTILE_SITE_KEY", "");
  vi.stubEnv("TURNSTILE_SECRET_KEY", "");
  get.mockResolvedValue({ data: { values: [COMMUNITY_HEADERS] } });
  append.mockResolvedValue({ data: { updates: { updatedRows: 1 } } });
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe("community form Turnstile protection", () => {
  it("keeps the previous behavior when no keys are configured", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    expect((await submit()).status).toBe(201);
    expect(fetch).not.toHaveBeenCalled();
    expect(append).toHaveBeenCalledTimes(1);
  });

  it("fails closed when only one key is configured", async () => {
    vi.stubEnv("TURNSTILE_SITE_KEY", "site-only");
    expect((await submit()).status).toBe(503);
    vi.stubEnv("TURNSTILE_SITE_KEY", "");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret-only");
    expect((await submit()).status).toBe(503);
    expect(append).not.toHaveBeenCalled();
  });

  describe("with both keys configured", () => {
    beforeEach(() => {
      vi.stubEnv("TURNSTILE_SITE_KEY", "1x00000000000000000000AA");
      vi.stubEnv("TURNSTILE_SECRET_KEY", "1x0000000000000000000000000000000AA");
    });

    it("rejects a missing, empty, oversized or repeated token without verifying", async () => {
      const fetch = vi.fn();
      vi.stubGlobal("fetch", fetch);
      for (const tokens of [[], [""], ["a".repeat(2049)], ["token", "token"]]) {
        const response = await submit((form) => tokens.forEach((token) => form.append("cf-turnstile-response", token)));
        expect(response.status).toBe(400);
        expect(await response.json()).toMatchObject({ field: "captcha", error: expect.any(String) });
      }
      expect(fetch).not.toHaveBeenCalled();
      expect(append).not.toHaveBeenCalled();
    });

    it("rejects a token that siteverify does not confirm", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false }))));
      const response = await submit(withToken("bad-token"));
      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({ field: "captcha" });
      expect(append).not.toHaveBeenCalled();
    });

    it("saves the row after siteverify confirms the token and forwards the client IP", async () => {
      const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true })));
      vi.stubGlobal("fetch", fetch);
      expect((await submit(withToken("good-token"), "203.0.113.7")).status).toBe(201);
      expect(append).toHaveBeenCalledTimes(1);
      const params = new URLSearchParams(String(fetch.mock.calls[0][1].body));
      expect(params.get("response")).toBe("good-token");
      expect(params.get("secret")).toBe("1x0000000000000000000000000000000AA");
      expect(params.get("remoteip")).toBe("203.0.113.7");
    });

    it("does not leak the token into the saved row", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }))));
      await submit(withToken("good-token"));
      expect(JSON.stringify(append.mock.calls[0][0].requestBody.values)).not.toContain("good-token");
    });
  });
});
