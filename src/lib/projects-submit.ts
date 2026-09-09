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

export * from "./projects-schema";
import { normalizeWebsiteUrl, type NormalizedSubmission } from "./projects-schema";
import { normalizeHeader } from "./projects-loader";

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
