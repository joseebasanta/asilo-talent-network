import { describe, expect, it, vi } from "vitest";
import { createSubmissionClock, resetCaptchaWidget } from "../src/lib/project-form-client";

describe("submission clock", () => {
  it("uses elapsed monotonic time on the server's clock, including repeated forms", () => {
    let elapsed = 12345;
    const serverTime = 1_700_000_000_000;
    const clock = createSubmissionClock(serverTime, () => elapsed);
    expect(clock()).toBe(String(serverTime));
    elapsed += 10_000;
    expect(clock()).toBe(String(serverTime + 10_000));
    elapsed += 120_000;
    expect(clock()).toBe(String(serverTime + 130_000));
  });
});

describe("CAPTCHA recovery", () => {
  it("handles unconfigured and not-yet-loaded widgets", () => {
    expect(resetCaptchaWidget(null, undefined)).toBe(true);
    expect(resetCaptchaWidget({} as HTMLElement, undefined)).toBe(false);
  });
  it("resets the correct widget", () => {
    const widget = {} as HTMLElement;
    const reset = vi.fn();
    expect(resetCaptchaWidget(widget, { reset })).toBe(true);
    expect(reset).toHaveBeenCalledWith(widget);
  });
  it("contains third-party exceptions so the form can recover", () => {
    expect(resetCaptchaWidget({} as HTMLElement, { reset: () => { throw new Error("Widget unavailable"); } }))
      .toBe(false);
  });
});
