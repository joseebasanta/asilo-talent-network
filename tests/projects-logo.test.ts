import { describe, expect, it } from "vitest";
import {
  logoFileExtension,
  LOGO_MAX_BYTES,
  validateLogo,
  validateRequiredLogo,
  LOGO_REQUIRED_MESSAGE,
} from "../src/lib/projects-logo";

describe("logoFileExtension", () => {
  it("returns the lowercased extension without the dot", () => {
    expect(logoFileExtension("logo.PNG")).toBe("png");
    expect(logoFileExtension("mi-logo.WebP")).toBe("webp");
    expect(logoFileExtension("logo.jpg")).toBe("jpg");
  });

  it("returns null when there is no extension", () => {
    expect(logoFileExtension("logo")).toBeNull();
    expect(logoFileExtension("logo.")).toBeNull();
    expect(logoFileExtension("")).toBeNull();
  });
});

describe("validateLogo", () => {
  it("accepts an absent logo (the field is optional)", () => {
    expect(validateLogo(null)).toEqual({ ok: true });
    expect(validateLogo(undefined)).toEqual({ ok: true });
    // Empty file inputs arrive from multipart FormData as a File with no name.
    expect(validateLogo({ name: "", type: "application/octet-stream", size: 0 })).toEqual({ ok: true });
  });

  it("rejects files over 1 MB but accepts exactly the limit", () => {
    expect(
      validateLogo({ name: "logo.png", type: "image/png", size: LOGO_MAX_BYTES }).ok,
    ).toBe(true);
    expect(
      validateLogo({ name: "logo.png", type: "image/png", size: LOGO_MAX_BYTES + 1 }).ok,
    ).toBe(false);
  });

  it("rejects unsupported MIME types", () => {
    for (const type of ["image/gif", "image/svg+xml", "application/pdf", ""]) {
      expect(
        validateLogo({ name: "logo.png", type, size: 100 }).ok,
        `type "${type}" should be rejected`,
      ).toBe(false);
    }
  });

  it("rejects unsupported or missing extensions", () => {
    expect(
      validateLogo({ name: "logo.gif", type: "image/png", size: 100 }).ok,
    ).toBe(false);
    expect(
      validateLogo({ name: "logo", type: "image/png", size: 100 }).ok,
    ).toBe(false);
    expect(
      validateLogo({ name: "logo.svg", type: "image/png", size: 100 }).ok,
    ).toBe(false);
  });

  it("accepts every allowed extension, case-insensitively", () => {
    const cases = [
      ["png", "image/png"],
      ["PNG", "image/png"],
      ["jpg", "image/jpeg"],
      ["JPG", "image/jpeg"],
      ["jpeg", "image/jpeg"],
      ["webp", "image/webp"],
    ] as const;
    for (const [ext, type] of cases) {
      expect(
        validateLogo({ name: `logo.${ext}`, type, size: 100 }).ok,
        `logo.${ext} should be accepted`,
      ).toBe(true);
    }
  });
});

describe("validateRequiredLogo", () => {
  it("rejects a missing or empty selection and otherwise applies the format gate", () => {
    const missing = { ok: false, error: LOGO_REQUIRED_MESSAGE };
    expect(validateRequiredLogo(null)).toEqual(missing);
    expect(validateRequiredLogo(undefined)).toEqual(missing);
    expect(validateRequiredLogo({ name: "", type: "application/octet-stream", size: 0 })).toEqual(missing);
    expect(validateRequiredLogo({ name: "logo.png", type: "image/png", size: 100 })).toEqual({ ok: true });
    expect(validateRequiredLogo({ name: "logo.gif", type: "image/gif", size: 100 }).ok).toBe(false);
  });
});
