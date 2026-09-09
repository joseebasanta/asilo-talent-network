import { z } from "zod";

/**
 * Pure, network-free gate for the optional project-logo upload. The submit
 * endpoint only touches Appwrite Storage after this validation passes; the
 * modal mirrors these rules client-side for instant feedback. No Appwrite
 * import here so this module stays unit-testable without a network.
 */

export const LOGO_BUCKET_ID = "project-logos";
export const LOGO_MAX_DIMENSION = 4096;
export const LOGO_MAX_PIXELS = 16_000_000;
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
const logoSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(["image/png", "image/jpeg", "image/webp"], { error: "El logo debe ser PNG, JPG o WebP." }),
  size: z.number().int().positive("El archivo del logo está vacío.")
    .max(LOGO_MAX_BYTES, "El logo debe pesar como máximo 1 MB."),
}).refine((file) => {
  const ext = logoFileExtension(file.name);
  return ext && ({ png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" } as Record<string, string>)[ext] === file.type;
}, "La extensión del logo debe coincidir con su formato PNG, JPG o WebP.");

export function validateLogo(file: LogoFile | null | undefined): LogoValidation {
  if (!file || (file.name === "" && file.size === 0)) return { ok: true };
  const result = logoSchema.safeParse(file);
  return result.success ? { ok: true } : { ok: false, error: result.error.issues[0].message };
}
