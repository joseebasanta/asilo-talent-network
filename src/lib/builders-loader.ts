import googleSheets from "@googleapis/sheets";

// Cache is local to each server instance and resets on cold starts.
export const BUILDERS_TTL_MS = 10 * 60_000;
export const FALLBACK_BUILDERS_COUNT = 180;
let cached: { at: number; count: number } | null = null;
let retryAfter = 0;
let pending: Promise<number> | null = null;

export function resetBuildersCache(): void {
  cached = null;
  retryAfter = 0;
  pending = null;
}

// The range must contain the single numeric community total cell.
export function countBuilders(values: unknown[][]): number {
  const value = Number(values[0]?.[0]);
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

export async function loadBuildersCount(
  fetchValues: () => Promise<unknown[][]> = fetchBuilderValues,
): Promise<number> {
  if (
    !import.meta.env.GOOGLE_SHEETS_ID ||
    !import.meta.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64
  ) return FALLBACK_BUILDERS_COUNT;

  if (cached && Date.now() - cached.at < BUILDERS_TTL_MS) return cached.count;
  // Back off after errors too, so an outage does not trigger a read per visit.
  if (Date.now() < retryAfter) return cached?.count ?? FALLBACK_BUILDERS_COUNT;
  // Concurrent page requests share the same in-flight read.
  if (pending) return pending;

  pending = (async () => {
    try {
      const count = countBuilders(await fetchValues());
      cached = { at: Date.now(), count };
      retryAfter = 0;
      return count;
    } catch {
      retryAfter = Date.now() + BUILDERS_TTL_MS;
      console.error("[builders-loader] Google Sheets read failed; using cached or fallback count.");
      return cached?.count ?? FALLBACK_BUILDERS_COUNT;
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
    spreadsheetId: import.meta.env.GOOGLE_SHEETS_ID!,
    range: import.meta.env.GOOGLE_COMMUNITY_COUNT_RANGE || "Projects!O1",
  });
  return data.values ?? [];
}
