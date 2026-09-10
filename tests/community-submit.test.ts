import { afterEach, describe, expect, it, vi } from "vitest";
import { communitySchema, communityRow } from "../src/lib/community-submit";
const append = vi.hoisted(() => vi.fn());
vi.mock("@googleapis/sheets", () => ({ default: { auth: { JWT: class {} }, sheets: () => ({ spreadsheets: { values: { append } } }) } }));
import { POST } from "../src/pages/api/community/submit";
const valid = { email: "builder@example.com", name: "Ana Pérez", location: "Caracas, Venezuela", whatsapp: "+58 412 1234567", linkedin: "https://www.linkedin.com/in/ana", role: "Developer", project: "Mi proyecto", description: "" };
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
function context(overrides = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ ...valid, started: String(Date.now() - 10000), ...overrides })) form.set(key, value);
  return { request: new Request("https://asilo.test/api/community/submit", { method: "POST", body: form }), clientAddress: "127.0.0.1" } as Parameters<typeof POST>[0];
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
    configure(); append.mockResolvedValue({});
    expect((await POST(context({ project: "=1+1" }))).status).toBe(201);
    expect(append).toHaveBeenCalledWith(expect.objectContaining({ spreadsheetId: "members-private", range: "Builders!A:J", valueInputOption: "RAW", requestBody: { values: [expect.arrayContaining(["=1+1", "PENDIENTE"])] } }));
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
});
