/**
 * Server-only loader for the homepage "Proyectos" directory.
 *
 * Reads approved project revisions from a private Google Sheet (one immutable
 * row per revision, native `SI` / `NO` / `PENDIENTE` approval dropdown) and
 * maps them to the `Project[]` shape consumed by `ProjectDirectory.astro`.
 *
 * The site stays runnable without credentials: when configuration is absent,
 * or the first Sheets fetch fails, this module falls back to the static
 * placeholder grid from `../data/projects`. A successful read always wins: a
 * correctly structured sheet with zero approved rows yields an empty list.
 * A short module-level TTL cache with stale-on-error behavior keeps reads
 * within the service-account quota (~60 reads/minute).
 *
 * Expected sheet columns — the live append-only revision layout (matched by
 * normalized header, order-independent; metadata columns the site does not
 * render are ignored). The earlier technical aliases (`project_id`,
 * `Website URL`, ...) still parse, so older or hand-edited headers keep
 * working:
 *   Fecha | Nombre del proyecto | Sitio web | Descripción corta | Fundadores |
 *   Categorías | Aprobado | ID del logo | ID de revisión | Notas adicionales
 *
 * Environment:
 *   GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 — base64 JSON of the service account key
 *   GOOGLE_SHEETS_ID                    — spreadsheet id from the sheet URL
 *   GOOGLE_SHEETS_RANGE                 — optional; defaults to "Projects!A1:J"
 */

import googleSheets from "@googleapis/sheets";
import {
  projects as placeholderProjects,
  type Project,
} from "../data/projects";
import { LOGO_BUCKET_ID } from "./projects-logo";
import { projectIconUrl } from "./project-icons";

const READONLY_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";

// Normalized value of the approval cell that makes a row public. Anything else
// (`NO`, `PENDIENTE`, empty, typos) is filtered out.
const APPROVED = "si";

// ponytail: service accounts read at most ~60 times/minute; a 1 minute TTL
// keeps the homepage well under that. Raise it if request volume grows.
// Exported so tests can advance time deterministically past the window.
export const TTL_MS = 60_000;
const CACHE_TTL_MS = import.meta.env.MODE === "development" ? 0 : TTL_MS;

const SHEET_RANGE = import.meta.env.GOOGLE_SHEETS_RANGE ?? "Projects!A1:J";

// Normalized sheet header -> Project field. Header normalization strips case,
// internal whitespace and accents ("Descripción corta" -> "descripcion corta"),
// so hand-edited columns keep mapping.
const HEADER_ALIASES: Record<string, string> = {
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
};

type ValuesFetcher = () => Promise<string[][]>;

let cached: { at: number; projects: Project[] } | null = null;

/** Test hook: drops the module-level cache. */
export function resetProjectsCache(): void {
  cached = null;
}

/**
 * Maps a sheet `values` grid (header row + data rows) to the homepage
 * `Project[]` shape: only explicitly approved rows with a safe http(s) URL
 * survive, sorted alphabetically by title.
 */
export function parseProjects(values: string[][]): Project[] {
  const [headerRow = [], ...dataRows] = values;
  if (headerRow.length === 0) return [];

  const headerMap = new Map<string, number>();
  headerRow.forEach((cell, index) => {
    const field = HEADER_ALIASES[normalizeHeader(cell)];
    if (field) headerMap.set(field, index);
  });

  // Without both a title and an approval column there is nothing we can
  // safely consider public.
  if (!headerMap.has("title") || !headerMap.has("approved")) return [];

  return dataRows
    .map((row) => toProject(row, headerMap))
    .filter((project): project is Project => project !== null)
    .sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * Loads the homepage projects, preferring the sheet. Never throws: without
 * configuration, or when the first Sheets fetch fails, it falls back to the
 * placeholder grid; a successful read always wins — including an empty list
 * when no rows are approved — and the last good read is served while stale.
 */
export async function loadApprovedProjects(
  fetchValues: ValuesFetcher = fetchSheetValues,
  options: { fresh?: boolean } = {},
): Promise<Project[]> {
  if (!isConfigured()) return placeholderProjects;

  if (!options.fresh && cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.projects;
  }

  try {
    const parsed = parseProjects(await fetchValues());
    cached = { at: Date.now(), projects: parsed };
    return parsed;
  } catch {
    // Stale-on-error: keep serving the last good read; only then fall back.
    // Bounded generic diagnostic only: the upstream error object may carry
    // request configuration or token material, so it is never logged.
    console.error(
      "[projects-loader] Google Sheets read failed; serving cached or placeholder data.",
    );
    return cached ? cached.projects : placeholderProjects;
  }
}

async function fetchSheetValues(): Promise<string[][]> {
  const serviceAccount = JSON.parse(
    Buffer.from(
      import.meta.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64!,
      "base64",
    ).toString("utf8"),
  ) as { client_email: string; private_key: string };

  const auth = new googleSheets.auth.JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: [READONLY_SCOPE],
  });

  const sheets = googleSheets.sheets({ version: "v4", auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: import.meta.env.GOOGLE_SHEETS_ID!,
    range: SHEET_RANGE,
  });

  return response.data.values ?? [];
}

function isConfigured(): boolean {
  return Boolean(
    import.meta.env.GOOGLE_SHEETS_ID &&
    import.meta.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64,
  );
}

export function normalizeHeader(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function toProject(
  row: string[],
  headerMap: Map<string, number>,
): Project | null {
  const cell = (field: string): string => {
    const index = headerMap.get(field);
    return index === undefined ? "" : (row[index] ?? "").trim();
  };

  // Explicit approval only: `SI` (accent-insensitive) is public; anything else
  // (`NO`, `PENDIENTE`, empty) is not.
  if (normalizeHeader(cell("approved")) !== APPROVED) return null;

  const href = cell("href");
  if (!isSafeHttpUrl(href)) return null;

  const title = cell("title");
  if (!title) return null;

  const tags = cell("tags")
    .split(/[,;]/)
    .map((tag) => tag.trim())
    .filter(Boolean);

  const logoUrl = logoViewUrl(cell("logoId"));
  return {
    href,
    title,
    description: cell("description"),
    author: cell("author"),
    tags,
    ...(logoUrl ? { logoUrl } : {}),
    iconUrl: projectIconUrl(tags),
  };
}

/**
 * Builds the public Appwrite view URL for a logo file id, or `undefined` when
 * there is no logo or the Appwrite config is absent. The logo bucket is public
 * (read `any`, `fileSecurity:false`), so a browser can render it directly. The
 * `?project=` query param is REQUIRED for anonymous (session-less) requests so
 * Appwrite knows which project resolves the file — omitting it returns 404.
 */
function logoViewUrl(logoId: string): string | undefined {
  const id = (logoId ?? "").trim();
  const endpoint = import.meta.env.APPWRITE_ENDPOINT;
  const projectId = import.meta.env.APPWRITE_PROJECT_ID;
  if (!id || !endpoint || !projectId) return undefined;
  const base = endpoint.replace(/\/+$/, "");
  return `${base}/storage/buckets/${encodeURIComponent(
    LOGO_BUCKET_ID,
  )}/files/${encodeURIComponent(id)}/view?project=${encodeURIComponent(projectId)}`;
}

// Rejects malformed URLs and any scheme other than http/https
// (javascript:, data:, ftp:, ...).
function isSafeHttpUrl(raw: string): boolean {
  try {
    const protocol = new URL(raw).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}
