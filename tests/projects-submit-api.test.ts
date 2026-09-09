import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sheets = vi.hoisted(() => ({
  get: vi.fn(),
  append: vi.fn(),
}));
const storage = vi.hoisted(() => ({ createFile: vi.fn() }));
vi.mock("node-appwrite", async (importOriginal) => ({
  ...await importOriginal<typeof import("node-appwrite")>(),
  Storage: class { createFile = storage.createFile; },
}));
vi.mock("@googleapis/sheets", () => ({
  default: {
    auth: { JWT: class {} },
    sheets: () => ({ spreadsheets: { values: sheets } }),
  },
}));
import sharp from "sharp";
import { POST } from "../src/pages/api/projects/submit";

let client = 0;
function submit(overrides: Record<string, string> = {}, edit?: (form: FormData) => void, clientAddress = `test-${client++}`) {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    nombre: "Pana Pay", website: "panapay.com",
    descripcion: "Pagos móviles para comercios venezolanos.",
    fundadores: "Ana Rodríguez", categorias: "Fintech",
    submitted_at: String(Date.now() - 10_000), ...overrides,
  })) form.append(key, value);
  edit?.(form);
  return POST({
    request: new Request("https://example.com/api/projects/submit", { method: "POST", body: form }),
    clientAddress,
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
  storage.createFile.mockResolvedValue({ $id: "sanitized-logo-id" });
  vi.stubEnv("APPWRITE_ENDPOINT", "");
  vi.stubEnv("APPWRITE_PROJECT_ID", "");
  vi.stubEnv("APPWRITE_API_KEY", "");
  sheets.get.mockResolvedValue({ data: { values: [["Sitio web"]] } });
  sheets.append.mockResolvedValue({});
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.clearAllMocks(); });

describe("POST /api/projects/submit validation", () => {
  it("returns field errors before reading or writing the sheet", async () => {
    const response = await submit({ website: "https://user:secret@example.com" });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ ok: false, field: "website" });
    expect(sheets.get).not.toHaveBeenCalled();
    expect(sheets.append).not.toHaveBeenCalled();
  });

  it("returns all field errors in one response", async () => {
    const response = await submit({ nombre: "", descripcion: "short", categorias: "unknown" });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ errors: {
      nombre: expect.any(String), descripcion: expect.any(String), categorias: expect.any(String),
    } });
    expect(sheets.append).not.toHaveBeenCalled();
  });

  it("rejects file values in text fields and multiple logos", async () => {
    const fileResponse = await submit({}, (form) => form.set("nombre", new Blob(["name"]), "name.txt"));
    expect(fileResponse.status).toBe(400);
    const logoResponse = await submit({}, (form) => { form.append("logo", "one"); form.append("logo", "two"); });
    expect(logoResponse.status).toBe(400);
    expect(await logoResponse.json()).toMatchObject({ field: "logo" });
    expect(sheets.append).not.toHaveBeenCalled();
  });

  it("rejects disguised logo content before contacting Google", async () => {
    const response = await submit({}, (form) => form.set("logo", new Blob(["not a png"], { type: "image/png" }), "logo.png"));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ field: "logo" });
    expect(sheets.get).not.toHaveBeenCalled();
  });

  it("returns a recoverable error for malformed server credentials", async () => {
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_JSON_BASE64", "invalid");
    const response = await submit();
    expect(response.status).toBe(503);
    expect(sheets.append).not.toHaveBeenCalled();
  });

  it("rejects existing domains before appending", async () => {
    sheets.get.mockResolvedValue({ data: { values: [["Sitio web"], ["https://www.panapay.com"]] } });
    expect((await submit()).status).toBe(409);
    expect(sheets.append).not.toHaveBeenCalled();
  });

  it.each(["", "0", "-1", "Infinity", "1e3", String(Date.now() + 60_000)])("rejects invalid fill timestamps: %s", async (submitted_at) => {
    expect((await submit({ submitted_at })).status).toBe(429);
    expect(sheets.append).not.toHaveBeenCalled();
  });

  it("fails closed when only one CAPTCHA key is configured", async () => {
    vi.stubEnv("TURNSTILE_SITE_KEY", "site-only");
    expect((await submit()).status).toBe(503);
    expect(sheets.append).not.toHaveBeenCalled();
  });

  it("does not silently discard a logo when storage is unavailable", async () => {
    vi.stubEnv("APPWRITE_ENDPOINT", "");
    const png = await sharp({ create: { width: 1, height: 1, channels: 3, background: "red" } }).png().toBuffer();
    const response = await submit({}, (form) => form.set("logo", new Blob([new Uint8Array(png)], { type: "image/png" }), "logo.png"));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ field: "logo" });
    expect(sheets.append).not.toHaveBeenCalled();
  });

  it("does not append when the sheet cannot support duplicate checks", async () => {
    sheets.get.mockResolvedValue({ data: { values: [["Nombre"]] } });
    expect((await submit()).status).toBe(503);
    expect(sheets.append).not.toHaveBeenCalled();
  });

  it("checks CAPTCHA token cardinality and length before verification", async () => {
    vi.stubEnv("TURNSTILE_SITE_KEY", "site");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    for (const tokens of [[], [""], ["a".repeat(2049)], ["token", "token"]]) {
      const response = await submit({}, (form) => tokens.forEach((token) => form.append("cf-turnstile-response", token)));
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ field: "captcha" });
    }
    expect(fetch).not.toHaveBeenCalled();
    expect(sheets.append).not.toHaveBeenCalled();
  });

  it("only writes after successful configured CAPTCHA verification", async () => {
    vi.stubEnv("TURNSTILE_SITE_KEY", "site");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    const fetch = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ success: false })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true })));
    vi.stubGlobal("fetch", fetch);
    const edit = (form: FormData) => form.set("cf-turnstile-response", "token");
    expect((await submit({}, edit)).status).toBe(403);
    expect(sheets.append).not.toHaveBeenCalled();
    expect((await submit({}, edit)).status).toBe(201);
    expect(sheets.append).toHaveBeenCalledTimes(1);
  });

  it("rate-limits repeated attempts and permits retry after the window expires", async () => {
    let now = Date.now();
    vi.spyOn(Date, "now").mockImplementation(() => now);
    for (let i = 0; i < 5; i++) expect((await submit({ nombre: "" }, undefined, "rate-test")).status).toBe(400);
    expect((await submit({}, undefined, "rate-test")).status).toBe(429);
    expect(sheets.append).not.toHaveBeenCalled();
    now += 600_001;
    expect((await submit({}, undefined, "rate-test")).status).toBe(201);
  });

  it("uploads only the sanitized WebP and stores its returned file ID", async () => {
    vi.stubEnv("APPWRITE_ENDPOINT", "https://example.com/v1");
    vi.stubEnv("APPWRITE_PROJECT_ID", "project");
    vi.stubEnv("APPWRITE_API_KEY", "mock-key");
    const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: "red" } }).png().toBuffer();
    const edit = (form: FormData) => form.set("logo", new Blob([new Uint8Array(png)], { type: "image/png" }), "original.png");
    expect((await submit({}, edit)).status).toBe(201);
    const upload = storage.createFile.mock.calls[0][0];
    expect(upload.file.filename).toBe("logo.webp");
    const bytes = await upload.file.slice(0, await upload.file.size());
    expect((await sharp(bytes).metadata()).format).toBe("webp");
    expect(sheets.append.mock.calls[0][0].requestBody.values[0][7]).toBe("sanitized-logo-id");
    sheets.append.mockClear();
    storage.createFile.mockRejectedValueOnce(new Error("Storage unavailable"));
    expect((await submit({}, edit)).status).toBe(503);
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
