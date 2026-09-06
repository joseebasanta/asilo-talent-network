import { afterEach, describe, expect, it, vi } from "vitest";
import {
  TURNSTILE_VERIFY_URL,
  turnstileConfigured,
  verifyTurnstile,
} from "../src/lib/turnstile";

const originalFetch = globalThis.fetch;

describe("verifyTurnstile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
  });

  it("posts secret+response form-encoded to siteverify and trusts success===true", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ success: true }),
    } as Response);
    globalThis.fetch = fetchMock;

    await expect(verifyTurnstile("tok123", "sec456")).resolves.toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(TURNSTILE_VERIFY_URL);
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "content-type": "application/x-www-form-urlencoded" });
    expect(String(init.body)).toBe("secret=sec456&response=tok123");
  });

  it("returns false when the server does not confirm success", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: false }),
    });
    await expect(verifyTurnstile("tok", "sec")).resolves.toBe(false);
  });

  it("returns false on network or parse errors", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("network down"));
    await expect(verifyTurnstile("tok", "sec")).resolves.toBe(false);

    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => {
        throw new Error("bad json");
      },
    });
    await expect(verifyTurnstile("tok", "sec")).resolves.toBe(false);
  });
});

describe("turnstileConfigured", () => {
  const saved = {
    site: process.env.TURNSTILE_SITE_KEY,
    secret: process.env.TURNSTILE_SECRET_KEY,
  };

  afterEach(() => {
    for (const [key, value] of [
      ["TURNSTILE_SITE_KEY", saved.site],
      ["TURNSTILE_SECRET_KEY", saved.secret],
    ] as const) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("is true only when both keys are set", () => {
    delete process.env.TURNSTILE_SITE_KEY;
    delete process.env.TURNSTILE_SECRET_KEY;
    expect(turnstileConfigured()).toBe(false);

    process.env.TURNSTILE_SITE_KEY = "site-key";
    expect(turnstileConfigured()).toBe(false);

    process.env.TURNSTILE_SECRET_KEY = "secret-key";
    expect(turnstileConfigured()).toBe(true);
  });
});