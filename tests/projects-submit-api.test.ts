import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sheets = vi.hoisted(() => ({
  get: vi.fn(),
  append: vi.fn(),
}));
vi.mock("@googleapis/sheets", () => ({
  default: {
    auth: { JWT: class {} },
    sheets: () => ({ spreadsheets: { values: sheets } }),
  },
}));
import { POST } from "../src/pages/api/projects/submit";

let client = 0;
function submit(overrides: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    nombre: "Pana Pay", website: "panapay.com",
    descripcion: "Pagos móviles para comercios venezolanos.",
    fundadores: "Ana Rodríguez", categorias: "Fintech",
    submitted_at: String(Date.now() - 10_000), ...overrides,
  })) form.append(key, value);
  return POST({
    request: new Request("https://example.com/api/projects/submit", { method: "POST", body: form }),
    clientAddress: `test-${client++}`,
  } as Parameters<typeof POST>[0]);
}

beforeEach(() => {
  vi.stubEnv("GOOGLE_SHEETS_ID", "test-sheet");
  vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_JSON_BASE64", Buffer.from(JSON.stringify({
    client_email: "test@example.com", private_key: "mock-key",
  })).toString("base64"));
  vi.stubEnv("TURNSTILE_SITE_KEY", "");
  vi.stubEnv("TURNSTILE_SECRET_KEY", "");
  vi.stubEnv("DEV_ALLOW_DUPLICATE_WEBSITE", "");
  sheets.get.mockResolvedValue({ data: { values: [["Sitio web"]] } });
  sheets.append.mockResolvedValue({});
});
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe("POST /api/projects/submit validation", () => {
  it("returns field errors before reading or writing the sheet", async () => {
    const response = await submit({ website: "https://user:secret@example.com" });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ ok: false, field: "website" });
    expect(sheets.get).not.toHaveBeenCalled();
    expect(sheets.append).not.toHaveBeenCalled();
  });

  it("writes normalized pending submissions as literal values, including formula-like text", async () => {
    const response = await submit({ nombre: '=HYPERLINK("https://example.com")' });
    expect(response.status).toBe(201);
    const write = sheets.append.mock.calls[0][0];
    expect(write.valueInputOption).toBe("RAW");
    expect(write.requestBody.values[0][1]).toBe('=HYPERLINK("https://example.com")');
    expect(write.requestBody.values[0][2]).toBe("https://panapay.com/");
    expect(write.requestBody.values[0][6]).toBe("PENDIENTE");
  });
});
