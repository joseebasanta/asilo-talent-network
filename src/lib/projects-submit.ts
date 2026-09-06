/**
 * Pure, network-free logic for the public project-submission endpoint
 * (`POST /api/projects/submit`). Validation, URL normalization, dedupe key
 * generation and the quarantined sheet row shape all live here so the endpoint
 * stays thin and this module is unit-testable without touching Google.
 *
 * Submissions are public by design (no auth): identity is not an authorization
 * boundary. Safety comes from server-side validation, the `PENDIENTE`
 * moderation quarantine, idempotency, rate limiting, a honeypot and fail-closed
 * configuration — see the endpoint for the in-process anti-abuse checks.
 *
 * Sheet layout (A→J) matched by `buildRow`:
 *   Fecha | Nombre del proyecto | Sitio web | Descripción corta | Fundadores |
 *   Categorías | Aprobado | ID del logo | ID de revisión | Notas adicionales
 */

import { normalizeHeader } from "./projects-loader";

// Exact allowlist rendered by the modal's 23 checkboxes. Server-side validation
// accepts nothing outside these literal values.
export const CATEGORIES = [
  "Inteligencia Artificial",
  "Fintech",
  "Marketplace",
  "Edtech",
  "Healthtech",
  "Agritech",
  "Logística",
  "SaaS",
  "DevTools & APIs",
  "Blockchain & Crypto",
  "Web3",
  "E-commerce",
  "Business Analytics",
  "Data Science",
  "Ciberseguridad",
  "AR / VR",
  "Gaming",
  "Hardware & IoT",
  "No-Code & CMS",
  "Social & Comunidad",
  "Movilidad",
  "Energía & Clima",
  "Diseño & Creatividad",
] as const;

export const MAX_CATEGORIES = 3;

// Minimum time a human plausibly needs to fill the form; faster fills are bots.
export const MIN_FILL_MS = 3000;

export type SubmissionInput = {
  nombre: string;
  website: string;
  descripcion: string;
  fundadores: string;
  categorias: string[];
};

export type NormalizedSubmission = {
  nombre: string;
  website: string;
  descripcion: string;
  fundadores: string;
  categorias: string[];
};

export type ValidationResult =
  | { ok: true; value: NormalizedSubmission }
  | { ok: false; field: string; message: string };

/**
 * Validates raw form values and returns a trimmed, URL-normalized submission.
 * Every rule is enforced server-side; client attributes are only a first layer.
 */
export function validateSubmission(input: SubmissionInput): ValidationResult {
  const nombre = input.nombre.trim();
  if (nombre.length < 2 || nombre.length > 80) {
    return {
      ok: false,
      field: "nombre",
      message: "El nombre debe tener entre 2 y 80 caracteres.",
    };
  }

  const website = normalizeWebsiteUrl(input.website);
  if (!website) {
    return {
      ok: false,
      field: "website",
      message: "Ingresá una URL válida que comience con http:// o https://.",
    };
  }

  const descripcion = input.descripcion.trim();
  if (descripcion.length < 10 || descripcion.length > 140) {
    return {
      ok: false,
      field: "descripcion",
      message: "La descripción debe tener entre 10 y 140 caracteres.",
    };
  }

  const fundadores = input.fundadores.trim();
  if (fundadores.length < 1 || fundadores.length > 160) {
    return {
      ok: false,
      field: "fundadores",
      message: "El campo fundadores debe tener entre 1 y 160 caracteres.",
    };
  }

  const validSet = new Set<string>(CATEGORIES);
  const categorias = input.categorias.filter((c) => validSet.has(c));
  if (categorias.length < 1 || categorias.length > MAX_CATEGORIES) {
    return {
      ok: false,
      field: "categorias",
      message: "Seleccioná entre 1 y 3 categorías válidas.",
    };
  }

  return {
    ok: true,
    value: { nombre, website, descripcion, fundadores, categorias },
  };
}

/**
 * Returns the URL with an explicit http(s) scheme or `null` when it is not a
 * usable http/https URL (mirrors the loader's read-path safety check, but is
 * forgiving about a missing scheme: `miproyecto.com` → `https://miproyecto.com/`).
 */
export function normalizeWebsiteUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Dedupe key for the `Sitio web` column: scheme-stripped, lowercased hostname
 * without `www.`. `miproyecto.com`, `www.miproyecto.com` and
 * `https://MIPROYECTO.com/` all collapse to one key. Returns `""` for
 * anything that does not parse as http(s), so garbage rows never match.
 */
export function normalizeWebsiteKey(raw: string): string {
  const url = normalizeWebsiteUrl(raw);
  if (!url) return "";
  return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
}

// Normalized header aliases that identify the website column (mirrors the
// loader's alias vocabulary for the same column).
const WEBSITE_HEADER_KEYS = new Set([
  "website",
  "website url",
  "sitio web",
  "url",
  "link",
  "url del proyecto",
  "project url",
]);

/** Column index of the website header in a header row, or -1 when absent. */
export function websiteColumnIndex(headerRow: string[]): number {
  return headerRow.findIndex((header) =>
    WEBSITE_HEADER_KEYS.has(normalizeHeader(header)),
  );
}

/**
 * True when any existing sheet row (pending or approved) carries the same
 * normalized website. Used before appending so resubmissions are rejected.
 */
export function findDuplicateWebsite(
  values: string[][],
  website: string,
): boolean {
  const key = normalizeWebsiteKey(website);
  if (!key) return false;
  const [headerRow = [], ...rows] = values;
  const column = websiteColumnIndex(headerRow);
  if (column < 0) return false;
  return rows.some((row) => normalizeWebsiteKey(row[column] ?? "") === key);
}

/**
 * Formats a Date as a human-facing local timestamp: 24h `HH:mm DD-MM-YYYY`,
 * zero-padded. Example: 2026-09-04 23:15 → `"23:15 04-09-2026"`.
 */
export function formatFecha(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())} ${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
}

/**
 * Shapes a validated submission into the 10-cell (A–J) `PENDIENTE` row.
 * `revisionId`/`submittedAt`/`logoId` are injectable for deterministic tests;
 * `logoId` is the Appwrite Storage file id of the uploaded logo, empty when
 * no logo was provided.
 */
export function buildRow(
  submission: NormalizedSubmission,
  options: { revisionId?: string; submittedAt?: Date; logoId?: string } = {},
): string[] {
  const revisionId = options.revisionId ?? crypto.randomUUID();
  const submittedAt = options.submittedAt ?? new Date();
  return [
    formatFecha(submittedAt), // Fecha (HH:mm DD-MM-YYYY, local)
    submission.nombre, // Nombre del proyecto
    submission.website, // Sitio web
    submission.descripcion, // Descripción corta
    submission.fundadores, // Fundadores
    submission.categorias.join(", "), // Categorías (submission order)
    "PENDIENTE", // Aprobado — quarantined until reviewed
    options.logoId ?? "", // ID del logo (Appwrite Storage file id)
    revisionId, // ID de revisión (unique identifier)
    "", // Notas adicionales
  ];
}
