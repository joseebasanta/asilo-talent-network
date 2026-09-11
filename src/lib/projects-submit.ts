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
 * Sheet layout: the live Projects sheet is A–M —
 *   Fecha | Nombre del proyecto | Sitio web | Descripción corta | Fundadores |
 *   Categorías | Aprobado | Moderador | Fecha de moderación | ID del logo |
 *   ID de revisión | Nota interna | Nota interna
 * (`Moderador`, `Fecha de moderación` and `Nota interna` are moderator-owned
 * and must stay empty on submission). `buildRow` below is the legacy
 * positional A–J builder (logo at H, revision at I); new submissions must use
 * `buildRowForHeaders`, which maps fields to header names so logo/revision
 * land on J/K without touching H/I. The legacy 10-column layout keeps working
 * through the same name mapping (H = ID del logo, I = ID de revisión).
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
 * LEGACY: positional layout with logo at H and revision at I. Kept for
 * backwards-compatible sheets/tests — new code must use `buildRowForHeaders`.
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

/** Canonical submission column fields. Moderator-owned fields (`moderator`,
 * `moderationDate`, `notes`) are recognized so they can be left empty — they
 * are never written by a submission. */
type SubmissionColumnField =
  | "fecha"
  | "title"
  | "href"
  | "description"
  | "author"
  | "tags"
  | "approved"
  | "logoId"
  | "revisionId"
  | "moderator"
  | "moderationDate"
  | "notes";

// Normalized header -> submission column. Submission-writable aliases mirror
// the loader's vocabulary (`projects-loader.ts` HEADER_ALIASES) plus the
// Fecha/revision columns; moderator-owned aliases exist only to classify
// those columns as known-empty.
const SUBMISSION_HEADER_ALIASES: Record<string, SubmissionColumnField> = {
  // fecha
  fecha: "fecha",
  date: "fecha",
  "submitted at": "fecha",
  submitted_at: "fecha",
  "enviado el": "fecha",
  "fecha de envio": "fecha",
  // title
  titulo: "title",
  title: "title",
  nombre: "title",
  "nombre del proyecto": "title",
  "project title": "title",
  name: "title",
  // href
  url: "href",
  website: "href",
  "website url": "href",
  "sitio web": "href",
  link: "href",
  "url del proyecto": "href",
  "project url": "href",
  // description
  descripcion: "description",
  "descripcion corta": "description",
  description: "description",
  "short description": "description",
  resumen: "description",
  // author
  fundadores: "author",
  fundador: "author",
  autores: "author",
  autor: "author",
  author: "author",
  founders: "author",
  builder: "author",
  // tags
  categorias: "tags",
  categoria: "tags",
  tags: "tags",
  categories: "tags",
  category: "tags",
  // approval
  aprobado: "approved",
  aprobacion: "approved",
  estado: "approved",
  status: "approved",
  approved: "approved",
  approval: "approved",
  // logo
  "id del logo": "logoId",
  logo: "logoId",
  "logo file id": "logoId",
  // revision id
  "id de revision": "revisionId",
  "id revision": "revisionId",
  id_revision: "revisionId",
  "revision id": "revisionId",
  revision_id: "revisionId",
  revision: "revisionId",
  // moderator (write-empty)
  moderador: "moderator",
  moderator: "moderator",
  "revisado por": "moderator",
  revisor: "moderator",
  // moderation date (write-empty)
  "fecha de moderacion": "moderationDate",
  "fecha de aprobacion": "moderationDate",
  "moderation date": "moderationDate",
  "moderated at": "moderationDate",
  // notes (write-empty; may legitimately repeat, e.g. two "Nota interna")
  "notas adicionales": "notes",
  notas: "notes",
  nota: "notes",
  notes: "notes",
  note: "notes",
  "nota interna": "notes",
  "notas internas": "notes",
  "notas interna": "notes",
  "internal note": "notes",
  "internal notes": "notes",
};

/** Fields a submission must place. Each must resolve to exactly one column;
 * anything else is a fail-closed error. */
const REQUIRED_SUBMISSION_FIELDS = [
  "fecha",
  "title",
  "href",
  "description",
  "author",
  "tags",
  "approved",
  "logoId",
  "revisionId",
] as const;

/**
 * Resolves a header row to submission column indexes by normalized header
 * name. Fail-closed: every required field must appear exactly once. Optional
 * moderator-owned fields (`moderator`, `moderationDate`, `notes`) may appear
 * zero or more times (repeats like two "Nota interna" columns are fine —
 * they all stay empty). Unknown headers are ignored (left empty).
 */
export function resolveSubmissionColumns(
  headerRow: string[],
): { ok: true; columns: Map<string, number> } | { ok: false; error: string } {
  const hits = new Map<string, number[]>();
  headerRow.forEach((cell, index) => {
    const field = SUBMISSION_HEADER_ALIASES[normalizeHeader(cell)];
    if (!field) return;
    const list = hits.get(field) ?? [];
    list.push(index);
    hits.set(field, list);
  });
  for (const field of REQUIRED_SUBMISSION_FIELDS) {
    const list = hits.get(field) ?? [];
    if (list.length === 0) return { ok: false, error: `Missing required column: ${field}` };
    if (list.length > 1) return { ok: false, error: `Ambiguous duplicate column: ${field}` };
  }
  const columns = new Map<string, number>();
  for (const field of REQUIRED_SUBMISSION_FIELDS) {
    columns.set(field, hits.get(field)![0]);
  }
  return { ok: true, columns };
}

/**
 * Shapes a validated submission into a header-aligned `PENDIENTE` row sized
 * to `headerRow.length`. Submission values land on their named columns
 * (logo → `ID del logo`, revision → `ID de revisión`); moderator-owned and
 * unknown columns stay `""`, so H/I (`Moderador`, `Fecha de moderación`) are
 * never touched on the current A–M sheet. Throws on missing/ambiguous
 * required headers — callers must fail closed (no write).
 */
export function buildRowForHeaders(
  headerRow: string[],
  submission: NormalizedSubmission,
  options: { revisionId?: string; submittedAt?: Date; logoId?: string } = {},
): string[] {
  const resolved = resolveSubmissionColumns(headerRow);
  if (!resolved.ok) throw new Error(resolved.error);
  const revisionId = options.revisionId ?? crypto.randomUUID();
  const submittedAt = options.submittedAt ?? new Date();
  const values = new Map<string, string>([
    ["fecha", formatFecha(submittedAt)],
    ["title", submission.nombre],
    ["href", submission.website],
    ["description", submission.descripcion],
    ["author", submission.fundadores],
    ["tags", submission.categorias.join(", ")],
    ["approved", "PENDIENTE"],
    ["logoId", options.logoId ?? ""],
    ["revisionId", revisionId],
  ]);
  const row = new Array<string>(headerRow.length).fill("");
  for (const [field, index] of resolved.columns) {
    row[index] = values.get(field) ?? "";
  }
  return row;
}
