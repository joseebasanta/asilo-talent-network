import type { APIContext } from "astro";
import googleSheets from "@googleapis/sheets";
import { readSubmissionForm } from "../../../lib/submission-body";
import { COMMUNITY_HEADERS, communityRow, communitySchema } from "../../../lib/community-submit";
export const prerender = false;
const hits = new Map<string, number[]>();
const reply = (body: object, status: number) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
export async function POST({ request, clientAddress }: APIContext) {
  const sheetId = import.meta.env.GOOGLE_COMMUNITY_SHEETS_ID?.trim();
  const credentials = import.meta.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64;
  // Membership data must never land in the public project directory's spreadsheet.
  if (!sheetId || !credentials || sheetId === import.meta.env.GOOGLE_SHEETS_ID?.trim()) return reply({ error: "El formulario no está disponible en este momento. Intenta más tarde." }, 503);
  const now = Date.now();
  for (const [ip, times] of hits) if (times.every(t => now - t >= 600_000)) hits.delete(ip);
  const recent = (hits.get(clientAddress) ?? []).filter(t => now - t < 600_000);
  if (recent.length >= 5) return reply({ error: "Demasiados intentos. Espera 10 minutos antes de volver a enviar." }, 429);
  hits.set(clientAddress, [...recent, now]);
  let form: FormData;
  try { form = await readSubmissionForm(request); } catch { return reply({ error: "Solicitud inválida o demasiado grande." }, 400); }
  if (form.get("contact_email")) return reply({ ok: true }, 201);
  const startedRaw = form.get("started");
  const started = typeof startedRaw === "string" ? Number(startedRaw) : NaN;
  if (form.getAll("started").length !== 1 || typeof startedRaw !== "string" || !/^\d+$/.test(startedRaw) || !Number.isSafeInteger(started) || started <= 0 || now - started < 3000) return reply({ error: "Espera unos segundos y vuelve a enviar." }, 429);
  for (const key of Object.keys(communitySchema.shape)) if (form.getAll(key).length > 1 || (key !== "description" && form.getAll(key).length !== 1)) return reply({ error: "Revisa los campos del formulario." }, 400);
  const result = communitySchema.safeParse(Object.fromEntries(form));
  if (!result.success) {
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return reply({ error: result.error.issues[0].message, errors }, 400);
  }
  try {
    const account = JSON.parse(Buffer.from(credentials, "base64").toString("utf8"));
    if (typeof account.client_email !== "string" || !account.client_email || typeof account.private_key !== "string" || !account.private_key) throw new Error("Invalid service account");
    const auth = new googleSheets.auth.JWT({ email: account.client_email, key: account.private_key, scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
    const sheets = googleSheets.sheets({ version: "v4", auth });
    const header = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: "Builders!A1:J1" }, { timeout: 10_000 });
    if (!COMMUNITY_HEADERS.every((name, index) => header.data.values?.[0]?.[index] === name)) {
      return reply({ error: "El formulario no está disponible en este momento. Intenta más tarde." }, 503);
    }
    const saved = await sheets.spreadsheets.values.append({ spreadsheetId: sheetId, range: "Builders!A:J", valueInputOption: "RAW", insertDataOption: "INSERT_ROWS", requestBody: { values: [communityRow(result.data)] } }, { timeout: 10_000, retry: false });
    if (saved.data.updates?.updatedRows !== 1) throw new Error("Unconfirmed append");
  } catch { return reply({ error: "No pudimos confirmar que tu solicitud se guardó. Si vuelves a enviar, podría registrarse más de una vez." }, 503); }
  return reply({ ok: true }, 201);
}
