import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COMMUNITY_HEADERS, communitySchema, communityRow } from "../src/lib/community-submit";
const { append, get } = vi.hoisted(() => ({ append: vi.fn(), get: vi.fn() }));
vi.mock("@googleapis/sheets", () => ({ default: { auth: { JWT: class {} }, sheets: () => ({ spreadsheets: { values: { append, get } } }) } }));
import { POST } from "../src/pages/api/community/submit";
const valid = { email: "builder@example.com", name: "Ana Pérez", location: "Caracas, Venezuela", whatsapp: "+58 412 1234567", linkedin: "https://www.linkedin.com/in/ana", role: "Developer", project: "Mi proyecto", description: "" };
beforeEach(() => { get.mockResolvedValue({ data: { values: [COMMUNITY_HEADERS] } }); });
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
let nextIp = 0;
function context(overrides = {}, ip = `test-${++nextIp}`) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ ...valid, started: String(Date.now() - 10000), ...overrides })) form.set(key, value);
  return { request: new Request("https://asilo.test/api/community/submit", { method: "POST", body: form }), clientAddress: ip } as Parameters<typeof POST>[0];
}
function configure() {
  vi.stubEnv("GOOGLE_COMMUNITY_SHEETS_ID", "members-private");
  vi.stubEnv("GOOGLE_SHEETS_ID", "projects");
  vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_JSON_BASE64", Buffer.from(JSON.stringify({ client_email: "service@example.com", private_key: "test" })).toString("base64"));
}
describe("membership submissions", () => {
  it("requires the reference fields and accepts an optional description", () => {
    expect(communitySchema.safeParse(valid).success).toBe(true);
    for (const field of ["email", "name", "location", "whatsapp", "linkedin", "role", "project"]) expect(communitySchema.safeParse({ ...valid, [field]: "" }).success).toBe(false);
    expect(communitySchema.safeParse({ ...valid, linkedin: "https://linkedin.com.evil.test/in/ana" }).success).toBe(false);
    expect(communityRow(valid).slice(1)).toEqual([...Object.values(valid), "PENDIENTE"]);
  });
  it("fails closed when no separate spreadsheet is configured", async () => {
    vi.stubEnv("GOOGLE_COMMUNITY_SHEETS_ID", "");
    expect((await POST(context())).status).toBe(503);
    configure();
    vi.stubEnv("GOOGLE_COMMUNITY_SHEETS_ID", "projects");
    expect((await POST(context())).status).toBe(503);
    expect(append).not.toHaveBeenCalled();
  });
  it("writes literal values only to the new spreadsheet", async () => {
    configure(); append.mockResolvedValue({ data: { updates: { updatedRows: 1 } } });
    expect((await POST(context({ project: "=1+1" }))).status).toBe(201);
    expect(append).toHaveBeenCalledWith(expect.objectContaining({ spreadsheetId: "members-private", range: "Builders!A:J", valueInputOption: "RAW", requestBody: { values: [expect.arrayContaining(["=1+1", "PENDIENTE"])] } }), expect.objectContaining({ retry: false }));
  });
  it("rejects invalid data without writing", async () => {
    configure();
    expect((await POST(context({ email: "invalid" }))).status).toBe(400);
    expect(append).not.toHaveBeenCalled();
  });
  it("reports storage failures instead of success", async () => {
    configure(); append.mockRejectedValue(new Error("offline"));
    expect((await POST(context())).status).toBe(503);
  });
  it("rejects punctuation-only phone numbers and enforces normalized digit lengths", () => {
    for (const whatsapp of ["+1------", "+1 ( ) -", "+123456", "+1234567890123456", "04121234567"]) {
      expect(communitySchema.safeParse({ ...valid, whatsapp }).success, whatsapp).toBe(false);
    }
    expect(communitySchema.safeParse({ ...valid, whatsapp: "+1 (212) 555-0123" }).success).toBe(true);
  });
  it("accepts an omitted optional description", async () => {
    configure(); append.mockResolvedValue({ data: { updates: { updatedRows: 1 } } });
    const ctx = context();
    const form = await ctx.request.formData();
    form.delete("description");
    ctx.request = new Request(ctx.request.url, { method: "POST", body: form });
    expect((await POST(ctx)).status).toBe(201);
    expect(append.mock.calls[0][0].requestBody.values[0][8]).toBe("");
  });
  it("rejects repeated fields, file values, and malformed/future timestamps", async () => {
    configure();
    for (const field of ["email", "description", "started"]) {
      const ctx = context();
      const form = await ctx.request.formData();
      form.append(field, "duplicate");
      ctx.request = new Request(ctx.request.url, { method: "POST", body: form });
      expect((await POST(ctx)).status).toBe(field === "started" ? 429 : 400);
    }
    const ctx = context();
    const form = await ctx.request.formData();
    form.set("name", new Blob(["Ana"]), "name.txt");
    ctx.request = new Request(ctx.request.url, { method: "POST", body: form });
    expect((await POST(ctx)).status).toBe(400);
    for (const started of ["1e3", "Infinity", "", String(Date.now() + 60_000)]) {
      expect((await POST(context({ started }))).status).toBe(429);
    }
    expect(append).not.toHaveBeenCalled();
  });
  it("does not write honeypot submissions", async () => {
    configure();
    expect((await POST(context({ contact_email: "bot@example.com" }))).status).toBe(201);
    expect(append).not.toHaveBeenCalled();
  });
  it("limits concurrent attempts on the same process before awaiting storage", async () => {
    configure(); append.mockResolvedValue({ data: { updates: { updatedRows: 1 } } });
    const ip = `rate-${++nextIp}`;
    const responses = await Promise.all(Array.from({ length: 6 }, () => POST(context({}, ip))));
    expect(responses.filter(r => r.status === 429)).toHaveLength(1);
    expect(append).toHaveBeenCalledTimes(5);
  });

  it("fails closed on missing or reordered spreadsheet headers", async () => {
    configure();
    for (const values of [[], [[...COMMUNITY_HEADERS].reverse()]]) {
      get.mockResolvedValue({ data: { values } });
      expect((await POST(context())).status).toBe(503);
    }
    expect(append).not.toHaveBeenCalled();
  });
  it("requires confirmation of exactly one saved row", async () => {
    configure(); append.mockResolvedValue({ data: { updates: { updatedRows: 0 } } });
    const response = await POST(context());
    expect(response.status).toBe(503);
    expect((await response.json()).ok).not.toBe(true);
  });
  it("saves every answer in the documented column order", async () => {
    configure(); append.mockResolvedValue({ data: { updates: { updatedRows: 1 } } });
    const answers = { ...valid, description: "Construimos una herramienta para equipos." };
    expect((await POST(context(answers))).status).toBe(201);
    const row = append.mock.calls[0][0].requestBody.values[0];
    expect(row).toHaveLength(COMMUNITY_HEADERS.length);
    expect(row.slice(1)).toEqual([...Object.values(answers), "PENDIENTE"]);
  });
  it("does not return success while storage is still pending", async () => {
    configure();
    let release!: (value: unknown) => void;
    let onAppend!: () => void;
    const entered = new Promise<void>(resolve => { onAppend = resolve; });
    append.mockImplementation(() => { onAppend(); return new Promise(resolve => { release = resolve; }); });
    let completed = false;
    const response = POST(context()).then(value => { completed = true; return value; });
    await entered;
    expect(completed).toBe(false);
    release({ data: { updates: { updatedRows: 1 } } });
    expect((await response).status).toBe(201);
  });

});
