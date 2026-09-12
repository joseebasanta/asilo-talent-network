/**
 * Public project-submission endpoint — no auth by design.
 *
 * Validates untrusted form input server-side, quarantines it as a `PENDIENTE`
 * row (private sheet) and answers with JSON. Anti-abuse is in-process and
 * minimal: honeypot, min-time-to-fill, per-IP sliding-window rate limit and an
 * idempotency check against the existing `Sitio web` column. Fail-closed:
 * without sheet credentials nothing is written and every request gets a 503.
 *
 * Same-origin form POSTs pass Astro's default `security.checkOrigin` — the
 * modal always fetches the current origin, so checkOrigin stays enabled.
 *
 * Environment (names only — values live in the deployed runtime):
 *   GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_JSON_BASE64,
 *   GOOGLE_SHEETS_RANGE (optional, default "Projects!A1:M" — must cover the
 *   full A–M table so the header mapping sees J/K),
 *   APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY (optional —
 *   logo upload; a supplied logo requires all three values),
 *   TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY (optional — captcha; without them
 *   the captcha is skipped and the other anti-abuse layers still apply)
 */

import { readSubmissionForm } from "../../../lib/submission-body";
import { prepareLogo } from "../../../lib/projects-logo-server";
import type { APIContext } from "astro";
import googleSheets from "@googleapis/sheets";
import { Client, ID, Permission, Role, Storage } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import {
  buildRowForHeaders,
  findDuplicateWebsite,
  websiteColumnIndex,
  MIN_FILL_MS,
  validateSubmissionForm,
} from "../../../lib/projects-submit";
import { LOGO_BUCKET_ID, validateLogo } from "../../../lib/projects-logo";
import {
  turnstileConfigured,
  verifyTurnstile,
} from "../../../lib/turnstile";

export const prerender = false;

// Write scope: appending rows needs spreadsheet write access (the read path
// uses the readonly scope; this one can read and write).
const WRITE_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const SHEET_RANGE = import.meta.env.GOOGLE_SHEETS_RANGE ?? "Projects!A1:M";
// Anchor the table, not a row: Sheets detects its end and appends automatically.
const APPEND_RANGE = "Projects!A1";

const RATE_MAX = 5;
const RATE_WINDOW_MS = 10 * 60_000;

// ponytail: per-process sliding window; not shared across instances and resets
// on restart — swap for Redis when the app runs multi-instance.
const ipHits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_MAX) {
    ipHits.set(ip, hits);
    return true;
  }
  hits.push(now);
  ipHits.set(ip, hits);
  return false;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function POST({ request, clientAddress }: APIContext) {
  // Fail-closed: no credentials, no writes.
  if (
    !import.meta.env.GOOGLE_SHEETS_ID ||
    !import.meta.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64
  ) {
    return json(
      { ok: false, error: "El directorio no está disponible en este momento." },
      503,
    );
  }

  if (rateLimited(clientAddress ?? "unknown")) {
    return json({ ok: false, error: "Demasiados envíos desde esta conexión. Intentá en 10 minutos." }, 429);
  }

  let form: FormData;
  try {
    form = await readSubmissionForm(request);
  } catch (error) {
    if (error instanceof Error && error.message === "body-too-large") {
      return json({ ok: false, error: "El envío es demasiado grande. El logo debe pesar como máximo 1 MB." }, 413);
    }
    return json({ ok: false, error: "Solicitud inválida." }, 400);
  }

  // Honeypot: bots fill the hidden field; answer success-shaped but write nothing.
  const honeypot = form.get("contact_email");
  if (typeof honeypot === "string" && honeypot.trim() !== "") {
    return json({ ok: true }, 201);
  }

  if (Boolean(import.meta.env.TURNSTILE_SITE_KEY) !== Boolean(import.meta.env.TURNSTILE_SECRET_KEY)) {
    return json({ ok: false, error: "La verificación no está disponible en este momento. Intentá más tarde." }, 503);
  }

  // Captcha (Turnstile): when keys are configured, a token must be present and
  // verify server-side before anything else is checked. Tokens are single-use;
  // the widget refills the hidden `cf-turnstile-response` input on each solve.
  if (turnstileConfigured()) {
    const token = form.get("cf-turnstile-response");
    if (form.getAll("cf-turnstile-response").length !== 1 || typeof token !== "string" || token.trim() === "" || token.length > 2048) {
      return json(
        {
          ok: false,
          field: "captcha",
          error: "Completá la verificación para enviar.",
        },
        400,
      );
    }
    if (!(await verifyTurnstile(token, import.meta.env.TURNSTILE_SECRET_KEY))) {
      return json(
        {
          ok: false,
          field: "captcha",
          error: "La verificación falló. Recargá e intentá de nuevo.",
        },
        403,
      );
    }
  }
  // ponytail: captcha is fail-open when TURNSTILE_* are unset so local/dev
  // submits keep working; honeypot, min-time, rate limit and dedupe still
  // apply. Production MUST set both Turnstile env vars.

  // Minimum fill-time heuristic, reset by the browser when starting a form.
  // This client-supplied timestamp is only an anti-abuse signal, not proof of a human.
  const submittedAtRaw = form.get("submitted_at");
  const submittedAt =
    typeof submittedAtRaw === "string" ? Number(submittedAtRaw) : Number.NaN;
  if (form.getAll("submitted_at").length !== 1 || typeof submittedAtRaw !== "string" ||
    !/^\d+$/.test(submittedAtRaw) || !Number.isSafeInteger(submittedAt) || submittedAt <= 0 ||
    Date.now() - submittedAt < MIN_FILL_MS) {
    return json(
      { ok: false, error: "El envío fue demasiado rápido. Intentá de nuevo." },
      429,
    );
  }

  const validation = validateSubmissionForm(form);
  if (!validation.ok) {
    return json(
      { ok: false, field: validation.field, error: validation.message, errors: validation.errors },
      400,
    );
  }

  // Optional logo: validate, then upload to Appwrite Storage when configured.
  // A supplied logo must validate and upload successfully; never silently drop it.
  const logoRaw = form.get("logo");
  if (form.getAll("logo").length > 1 || (logoRaw !== null && !(logoRaw instanceof File))) {
    return json({ ok: false, field: "logo", error: "Seleccioná un solo archivo de imagen." }, 400);
  }
  // FormData returns an empty File for an untouched file input.
  const logo = logoRaw instanceof File && (logoRaw.name !== "" || logoRaw.size > 0) ? logoRaw : null;
  const logoCheck = validateLogo(logo);
  if (!logoCheck.ok) {
    return json({ ok: false, field: "logo", error: logoCheck.error }, 400);
  }
  const preparedLogo = logo ? await prepareLogo(logo) : null;
  if (preparedLogo && !preparedLogo.ok) {
    return json({ ok: false, field: "logo", error: preparedLogo.error }, 400);
  }

  let sheets: ReturnType<typeof googleSheets.sheets>;
  try {
    const serviceAccount = JSON.parse(Buffer.from(
      import.meta.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64!, "base64",
    ).toString("utf8")) as { client_email: string; private_key: string };
    if (!serviceAccount.client_email || !serviceAccount.private_key) throw new Error("Invalid credentials");
    const auth = new googleSheets.auth.JWT({
      email: serviceAccount.client_email, key: serviceAccount.private_key, scopes: [WRITE_SCOPE],
    });
    sheets = googleSheets.sheets({ version: "v4", auth });
  } catch {
    return json({ ok: false, error: "El directorio no está disponible en este momento." }, 503);
  }

  // Header-aligned write: the live sheet is A–M with moderator-owned H/I
  // (`Moderador`, `Fecha de moderación`). The row is mapped by header name so
  // logo/revision land on J/K and H/I stay empty. Headers are always fetched
  // (even under the dev duplicate override) because mapping without them
  // would shift columns; any mapping failure is fail-closed with no write.
  // DEV-ONLY OVERRIDE: when `DEV_ALLOW_DUPLICATE_WEBSITE` is set to a truthy
  // value ("1"/"true"/"yes") in `.env.local`, the dedupe is skipped so a
  // developer can re-test submissions against the same project. Never set
  // this in production: it bypasses the "no duplicate project" guarantee.
  const devOverride =
    import.meta.env.DEV &&
    ["1", "true", "yes"].includes(
      String(import.meta.env.DEV_ALLOW_DUPLICATE_WEBSITE ?? "").toLowerCase(),
    );
  let headerRow: string[];
  try {
    const { data } = await sheets.spreadsheets.values.get({
      spreadsheetId: import.meta.env.GOOGLE_SHEETS_ID!,
      range: SHEET_RANGE,
    });
    const values = data.values ?? [];
    headerRow = values[0] ?? [];
    if (!devOverride) {
      if (websiteColumnIndex(headerRow) < 0) throw new Error("Missing website column");
      if (findDuplicateWebsite(values, validation.value.website)) {
        return json(
          { ok: false, error: "Este proyecto ya fue enviado al directorio." },
          409,
        );
      }
    }
  } catch {
    return json(
      {
        ok: false,
        error: "No se pudo verificar el envío. Intentá de nuevo en unos minutos.",
      },
      503,
    );
  }

  let logoId: string | undefined;
  if (
    preparedLogo?.ok &&
    import.meta.env.APPWRITE_ENDPOINT &&
    import.meta.env.APPWRITE_PROJECT_ID &&
    import.meta.env.APPWRITE_API_KEY
  ) {
    try {
      const appwrite = new Client()
        .setEndpoint(import.meta.env.APPWRITE_ENDPOINT)
        .setProject(import.meta.env.APPWRITE_PROJECT_ID)
        .setKey(import.meta.env.APPWRITE_API_KEY);
      const storage = new Storage(appwrite);
      const uploaded = await storage.createFile({
        bucketId: LOGO_BUCKET_ID,
        fileId: ID.unique(),
        file: InputFile.fromBuffer(preparedLogo.buffer, preparedLogo.filename),
        // Public directory: logos must be anonymously readable. `fileSecurity`
        // is disabled on the bucket so this file-level ACL (not the bucket
        // default) is what the view endpoint resolves.
        permissions: [Permission.read(Role.any())],
      });
      logoId = uploaded.$id;
    } catch {
      return json(
        {
          ok: false,
          error: "No se pudo subir el logo. Intentá de nuevo en unos minutos.",
        },
        503,
      );
    }
  } else if (preparedLogo?.ok) {
    return json({ ok: false, field: "logo", error: "La carga de logos no está disponible. Intentá más tarde o quitá el logo." }, 503);
  }

  let row: string[];
  try {
    row = buildRowForHeaders(headerRow, validation.value, { logoId });
  } catch {
    return json(
      {
        ok: false,
        error: "No se pudo verificar el envío. Intentá de nuevo en unos minutos.",
      },
      503,
    );
  }

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: import.meta.env.GOOGLE_SHEETS_ID!,
      range: APPEND_RANGE,
      // Keep user input literal: never interpret spreadsheet formulas.
      valueInputOption: "RAW",
      requestBody: { values: [row] },
    });
  } catch {
    return json(
      {
        ok: false,
        error: "No se pudo guardar tu proyecto. Intentá de nuevo en unos minutos.",
      },
      503,
    );
  }

  return json({ ok: true }, 201);
}
