/**
 * Pure, network-free gate for the optional project-logo upload. The submit
 * endpoint only touches Appwrite Storage after this validation passes; the
 * modal mirrors these rules client-side for instant feedback. No Appwrite
 * import here so this module stays unit-testable without a network.
 */

export const LOGO_BUCKET_ID = "project-logos";
export const LOGO_MAX_BYTES = 1_048_576; // bucket limit: 1 MB

export const LOGO_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

// Derived from the allowed MIME types; checked case-insensitively.
export const LOGO_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);

export type LogoFile = { name: string; type: string; size: number };

export type LogoValidation = { ok: false; error: string } | { ok: true };

/**
 * Lowercased file extension without the dot, or null when the name has none.
 * `logo.PNG` → `"png"`, `logo` → `null`, `.hidden` → `"hidden"`.
 */
export function logoFileExtension(name: string): string | null {
  const dot = name.lastIndexOf(".");
  if (dot < 0 || dot === name.length - 1) return null;
  return name.slice(dot + 1).toLowerCase();
}

/**
 * Accepts an absent logo (the file is optional). Rejects oversized files and
 * anything whose MIME type or extension is not in the allowlist.
 */
export function validateLogo(file: LogoFile | null | undefined): LogoValidation {
  // Native multipart FormData serializes an untouched file input as an empty File.
  if (!file || file.name === "") return { ok: true };
  if (file.size > LOGO_MAX_BYTES) {
    return { ok: false, error: "El logo debe pesar menos de 1 MB." };
  }
  if (!LOGO_MIME_TYPES.has(file.type)) {
    return { ok: false, error: "El logo debe ser PNG, JPG o WebP." };
  }
  const ext = logoFileExtension(file.name);
  if (!ext || !LOGO_EXTENSIONS.has(ext)) {
    return { ok: false, error: "El logo debe ser PNG, JPG o WebP." };
  }
  return { ok: true };
}
