import { afterEach, describe, expect, it, vi } from "vitest";
import { privateHash } from "../src/lib/engagement";

afterEach(() => vi.unstubAllEnvs());

describe("privateHash", () => {
  it("refuses to hash with a public fallback key in production", () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("ENGAGEMENT_SECRET", "");
    vi.stubEnv("APPWRITE_API_KEY", "");
    expect(() => privateHash("ip", "203.0.113.7")).toThrow(/ENGAGEMENT_SECRET/);
  });

  it("keys hashes with ENGAGEMENT_SECRET in production", () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("ENGAGEMENT_SECRET", "a");
    const first = privateHash("ip", "203.0.113.7");
    vi.stubEnv("ENGAGEMENT_SECRET", "b");
    expect(privateHash("ip", "203.0.113.7")).not.toBe(first);
  });

  it("still works locally without a secret", () => {
    vi.stubEnv("PROD", false);
    vi.stubEnv("ENGAGEMENT_SECRET", "");
    vi.stubEnv("APPWRITE_API_KEY", "");
    expect(privateHash("voter", "x")).toMatch(/^[0-9a-f]{64}$/);
  });
});
