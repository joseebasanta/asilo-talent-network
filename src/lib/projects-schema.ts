/** Shared browser/server validation. Keep this module free of server imports. */
import { z } from "zod";

// Exact allowlist rendered by the modal's 23 checkboxes. Server-side validation
// accepts nothing outside these literal values. Kept in fixed descending
// Spanish (es, base sensitivity) order so both the submission modal and the
// directory filter render Z→A without runtime sorting.
export const CATEGORIES = [
  "Web3",
  "Social & Comunidad",
  "SaaS",
  "No-Code & CMS",
  "Movilidad",
  "Marketplace",
  "Logística",
  "Inteligencia Artificial",
  "Healthtech",
  "Hardware & IoT",
  "Gaming",
  "Fintech",
  "Energía & Clima",
  "Edtech",
  "E-commerce",
  "Diseño & Creatividad",
  "DevTools & APIs",
  "Data Science",
  "Ciberseguridad",
  "Business Analytics",
  "Blockchain & Crypto",
  "AR / VR",
  "Agritech",
] as const;

export const MAX_CATEGORIES = 3;

// Minimum time a human plausibly needs to fill the form; faster fills are bots.
export const MIN_FILL_MS = 3000;

export const SUBMISSION_FIELDS = ["nombre", "website", "descripcion", "fundadores", "categorias"] as const;

const textField = (min: number, max: number, message: string) =>
  z.string({ error: message }).trim().min(min, message).max(max, message)
    .refine((value) => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value), {
      message: "El texto contiene caracteres de control no permitidos.",
    });

const websiteMessage = "Ingresá una URL válida de un sitio público (http:// o https://).";

export const submissionSchema = z.object({
  nombre: textField(2, 80, "El nombre debe tener entre 2 y 80 caracteres."),
  website: z.string({ error: websiteMessage }).trim().max(2048, websiteMessage)
    .transform((value, ctx) => {
      const normalized = normalizeWebsiteUrl(value);
      if (!normalized) {
        ctx.addIssue({ code: "custom", message: websiteMessage });
        return z.NEVER;
      }
      return normalized;
    })
    .pipe(z.string().max(2048, websiteMessage))
    .pipe(z.url({ protocol: /^https?$/, hostname: z.regexes.domain, error: websiteMessage }))
    .refine((value) => {
      const url = new URL(value);
      return !url.username && !url.password &&
        !/\.(localhost|local|internal)$/i.test(url.hostname);
    }, websiteMessage),
  descripcion: textField(10, 140, "La descripción debe tener entre 10 y 140 caracteres."),
  fundadores: textField(1, 160, "El campo fundadores debe tener entre 1 y 160 caracteres."),
  categorias: z.array(z.enum(CATEGORIES, { error: "Seleccioná categorías válidas." }), {
    error: "Seleccioná entre 1 y 3 categorías válidas.",
  }).min(1, "Seleccioná entre 1 y 3 categorías válidas.")
    .max(MAX_CATEGORIES, "Seleccioná entre 1 y 3 categorías válidas.")
    .refine((values) => new Set(values).size === values.length, "No repitas categorías."),
});

export type SubmissionInput = z.input<typeof submissionSchema>;
export type NormalizedSubmission = z.output<typeof submissionSchema>;

export type ValidationResult =
  | { ok: true; value: NormalizedSubmission }
  | { ok: false; field: string; message: string; errors: Record<string, string> };

/** Validate untrusted values without coercing files, arrays or objects to text. */
export function validateSubmission(input: unknown): ValidationResult {
  const result = submissionSchema.safeParse(input);
  if (result.success) return { ok: true, value: result.data };
  const issue = result.error.issues[0];
  const errors: Record<string, string> = {};
  for (const item of result.error.issues) {
    const field = String(item.path[0] ?? "nombre");
    errors[field] ??= item.message;
  }
  return {
    ok: false,
    field: String(issue.path[0] ?? "nombre"),
    message: issue.message,
    errors,
  };
}

/** Scalar fields must occur exactly once; categories are intentionally repeated. */
export function validateSubmissionForm(form: FormData): ValidationResult {
  const fields = ["nombre", "website", "descripcion", "fundadores"] as const;
  for (const field of fields) {
    if (form.getAll(field).length > 1) {
      const message = "Enviá un solo valor para este campo.";
      return { ok: false, field, message, errors: { [field]: message } };
    }
  }
  return validateSubmission({
    ...Object.fromEntries(fields.map((field) => [field, form.get(field)])),
    categorias: form.getAll("categorias"),
  });
}

/**
 * Returns the URL with an explicit http(s) scheme or `null` when it is not a
 * usable http/https URL (mirrors the loader's read-path safety check, but is
 * forgiving about a missing scheme: `miproyecto.com` → `https://miproyecto.com/`).
 */
export function normalizeWebsiteUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || /[\s\\\u0000-\u001F\u007F]/.test(trimmed)) return null;
  const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!/^https?:\/\//i.test(withScheme)) return null;
    url.hostname = url.hostname.replace(/\.$/, "");
    return url.toString();
  } catch {
    return null;
  }
}

