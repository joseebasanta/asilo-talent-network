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
import sharp from "sharp";
import { POST } from "../src/pages/api/projects/submit";

// Every valid submission now carries a logo.
const defaultLogo = await sharp({ create: { width: 4, height: 4, channels: 3, background: "blue" } }).png().toBuffer();
const logoUrl = "https://builders-api.example/uploads/logos/project/logo.webp";
const fetchMock = vi.fn<typeof fetch>();

// Live Projects headers A–M: H Moderador, I Fecha de moderación, J ID del
// logo, K ID de revisión, L/M Nota interna.
const CURRENT_HEADERS = [
  "Fecha",
  "Nombre del proyecto",
  "Sitio web",
  "Descripción corta",
  "Fundadores",
  "Categorías",
  "Aprobado",
  "Moderador",
  "Fecha de moderación",
  "ID del logo",
  "ID de revisión",
  "Nota interna",
  "Nota interna",
];

let client = 0;
function submit(overrides: Record<string, string> = {}, edit?: (form: FormData) => void, clientAddress = `test-${client++}`) {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    nombre: "Pana Pay", website: "panapay.com",
    descripcion: "Pagos móviles para comercios venezolanos.",
    fundadores: "Ana Rodríguez", categorias: "Fintech",
    submitted_at: String(Date.now() - 10_000), ...overrides,
  })) form.append(key, value);
  form.set("logo", new Blob([new Uint8Array(defaultLogo)], { type: "image/png" }), "logo.png");
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
  fetchMock.mockReset().mockImplementation(async () => Response.json({ logoUrl }, { status: 201 }));
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("BUILDERS_BACKEND_BASE_URL", "https://builders-api.example/");
  vi.stubEnv("ASILO_LOGO_UPLOAD_KEY", "test-logo-key");
  sheets.get.mockResolvedValue({ data: { values: [CURRENT_HEADERS] } });
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
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [1_048_577, "image/png", "logo.png"],
    [20, "image/gif", "logo.gif"],
  ] as const)("does not send a logo of %i bytes with type %s", async (size, type, name) => {
    const response = await submit({}, (form) => form.set("logo", new File([new Uint8Array(size)], name, { type })));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ field: "logo" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(sheets.append).not.toHaveBeenCalled();
  });

  it("returns a recoverable error for malformed server credentials", async () => {
    vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_JSON_BASE64", "invalid");
    const response = await submit();
    expect(response.status).toBe(503);
    expect(sheets.append).not.toHaveBeenCalled();
  });

  it("rejects existing domains before appending", async () => {
    const duplicate = [...CURRENT_HEADERS];
    const row = new Array(CURRENT_HEADERS.length).fill("");
    row[CURRENT_HEADERS.indexOf("Sitio web")] = "https://www.panapay.com";
    sheets.get.mockResolvedValue({ data: { values: [duplicate, row] } });
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

  it("requires a logo before touching the sheet or storage", async () => {
    const response = await submit({}, (form) => form.delete("logo"));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ ok: false, field: "logo", error: "Sube el logo de tu proyecto." });
    const empty = await submit({}, (form) => form.set("logo", new File([], "")));
    expect(empty.status).toBe(400);
    expect(await empty.json()).toMatchObject({ field: "logo" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(sheets.append).not.toHaveBeenCalled();
  });

  it.each(["BUILDERS_BACKEND_BASE_URL", "ASILO_LOGO_UPLOAD_KEY"])("does not silently discard a logo without %s", async (setting) => {
    vi.stubEnv(setting, "");
    const png = await sharp({ create: { width: 1, height: 1, channels: 3, background: "red" } }).png().toBuffer();
    const response = await submit({}, (form) => form.set("logo", new Blob([new Uint8Array(png)], { type: "image/png" }), "logo.png"));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ field: "logo" });
    expect(fetchMock).not.toHaveBeenCalled();
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
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ success: false })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true })));
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

  it("uploads only the sanitized WebP and stores its returned public URL", async () => {
    const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: "red" } }).png().toBuffer();
    const edit = (form: FormData) => form.set("logo", new Blob([new Uint8Array(png)], { type: "image/png" }), "original.png");
    expect((await submit({}, edit)).status).toBe(201);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://builders-api.example/api/asilo/logos");
    expect(init).toMatchObject({ method: "POST", headers: { Authorization: "Bearer test-logo-key" } });
    const body = init?.body as FormData;
    expect([...body.keys()]).toEqual(["file"]);
    const file = body.get("file") as File;
    expect(file).toMatchObject({ name: "logo.webp", type: "image/webp" });
    expect((await sharp(Buffer.from(await file.arrayBuffer())).metadata()).format).toBe("webp");
    const logoRow = sheets.append.mock.calls[0][0].requestBody.values[0];
    expect(logoRow[9]).toBe(logoUrl); // J ID del logo
    expect(logoRow[7]).toBe(""); // H Moderador untouched
    expect(logoRow[8]).toBe(""); // I Fecha de moderación untouched
    expect(logoRow[10]).toMatch(/^[0-9a-f-]{36}$/); // K ID de revisión
    sheets.append.mockClear();
    fetchMock.mockRejectedValueOnce(new Error("Storage unavailable"));
    expect((await submit({}, edit)).status).toBe(503);
    expect(sheets.append).not.toHaveBeenCalled();
  });

  it.each([401, 404, 500])("does not append if the upload reports %i", async (status) => {
    fetchMock.mockResolvedValueOnce(Response.json({ error: "Upstream error" }, { status }));
    const response = await submit();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      ok: false, error: "No se pudo subir el logo. Inténtalo de nuevo en unos minutos.",
    });
    expect(sheets.append).not.toHaveBeenCalled();
  });

  it.each([{}, { logoUrl: "javascript:alert(1)" }])("does not append after an invalid 201 response: %j", async (result) => {
    fetchMock.mockResolvedValueOnce(Response.json(result, { status: 201 }));
    expect((await submit()).status).toBe(503);
    expect(sheets.append).not.toHaveBeenCalled();
  });

  it.each(["legacy-logo-id", logoUrl])("preserves the published logo on edits without a replacement: %s", async (savedLogo) => {
    const published = new Array<string>(CURRENT_HEADERS.length).fill("");
    published[2] = "https://panapay.com/";
    published[6] = "SI";
    published[9] = savedLogo;
    sheets.get.mockResolvedValue({ data: { values: [CURRENT_HEADERS, published] } });
    vi.stubEnv("ASILO_LOGO_UPLOAD_KEY", "");
    const response = await submit({ mode: "edit", contacto: "test@example.com" }, (form) => form.delete("logo"));
    expect(response.status).toBe(201);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(sheets.append.mock.calls[0][0].requestBody.values[0][9]).toBe(savedLogo);
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

  it("appends a header-aligned row on the current A–M sheet (logo J, revision K, H/I empty)", async () => {
    const response = await submit();
    expect(response.status).toBe(201);
    const row = sheets.append.mock.calls[0][0].requestBody.values[0];
    expect(row).toHaveLength(CURRENT_HEADERS.length);
    expect(row[7]).toBe(""); // H Moderador untouched
    expect(row[8]).toBe(""); // I Fecha de moderación untouched
    expect(row[9]).toBe(logoUrl); // J ID del logo (required upload)
    expect(row[10]).toMatch(/^[0-9a-f-]{36}$/); // K ID de revisión
    expect(row[11]).toBe("");
    expect(row[12]).toBe("");
  });

  it("fails closed without appending when the revision column is missing (truncated A–J range)", async () => {
    sheets.get.mockResolvedValue({ data: { values: [CURRENT_HEADERS.slice(0, 10)] } });
    const response = await submit();
    expect(response.status).toBe(503);
    expect(sheets.append).not.toHaveBeenCalled();
  });
});
