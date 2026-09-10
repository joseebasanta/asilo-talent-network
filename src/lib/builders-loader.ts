import googleSheets from "@googleapis/sheets";

export const BUILDERS_TTL_MS = 60_000;
let cached: { at: number; count: number } | null = null;
let pending: Promise<number | null> | null = null;

export function resetBuildersCache(): void {
  cached = null;
  pending = null;
}

// The range must contain one identifying column, without its header.
export function countBuilders(values: unknown[][]): number {
  return values.filter((row) => String(row[0] ?? "").trim() !== "").length;
}

export async function loadBuildersCount(
  fetchValues: () => Promise<unknown[][]> = fetchBuilderValues,
): Promise<number | null> {
  if (
    !(import.meta.env.GOOGLE_BUILDERS_SHEETS_ID || import.meta.env.GOOGLE_SHEETS_ID) ||
    !import.meta.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64
  ) return null;

  if (cached && Date.now() - cached.at < BUILDERS_TTL_MS) return cached.count;
  if (pending) return pending;

  pending = (async () => {
    try {
      const count = countBuilders(await fetchValues());
      cached = { at: Date.now(), count };
      return count;
    } catch {
      console.error("[builders-loader] Google Sheets read failed; using last known count if available.");
      return cached?.count ?? null;
    }
  })();
  try {
    return await pending;
  } finally {
    pending = null;
  }
}

async function fetchBuilderValues(): Promise<unknown[][]> {
  const account = JSON.parse(
    Buffer.from(import.meta.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64!, "base64").toString("utf8"),
  ) as { client_email: string; private_key: string };
  const auth = new googleSheets.auth.JWT({
    email: account.client_email,
    key: account.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = googleSheets.sheets({ version: "v4", auth });
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: import.meta.env.GOOGLE_BUILDERS_SHEETS_ID || import.meta.env.GOOGLE_SHEETS_ID!,
    range: import.meta.env.GOOGLE_BUILDERS_SHEETS_RANGE || "Builders!A2:A",
  });
  return data.values ?? [];
}
