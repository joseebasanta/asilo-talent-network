import { describe, expect, it } from "vitest";
import { createRateLimiter } from "../src/lib/rate-limit";

describe("createRateLimiter", () => {
  it("allows max hits per window, then recovers once the window passes", () => {
    const limited = createRateLimiter(2, 1_000);
    expect(limited("ip", 0)).toBe(false);
    expect(limited("ip", 10)).toBe(false);
    expect(limited("ip", 20)).toBe(true);
    expect(limited("other", 20)).toBe(false);
    expect(limited("ip", 1_011)).toBe(false);
  });
});
