import { afterEach, describe, expect, it, vi } from "vitest";
import { COMMUNITY_HEADERS } from "../src/lib/community-submit";

const { append, get } = vi.hoisted(() => ({ append: vi.fn(), get: vi.fn() }));
vi.mock("@googleapis/sheets", () => ({
  default: { auth: { JWT: class {} }, sheets: () => ({ spreadsheets: { values: { append, get } } }) },
}));

import { POST } from "../src/pages/api/community/submit";

const valid = {
  email: "builder@example.com",
  name: "Ana Pérez",
  location: "Caracas, Venezuela",
  whatsapp: "+58 412 1234567",
  linkedin: "https://www.linkedin.com/in/ana",
  role: "Developer",
  project: "Mi proyecto",
  description: "",
};

function context(ip = `shared-${Math.random()}`) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ ...valid, started: String(Date.now() - 10000) })) {
    form.set(key, value);
  }
  return {
    request: new Request("https://asilo.test/api/community/submit", { method: "POST", body: form }),
    clientAddress: ip,
  } as Parameters<typeof POST>[0];
}

describe("POST /api/community/submit shared workbook", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("writes to the shared spreadsheet ID in the Builders range", async () => {
    vi.stubEnv("GOOGLE_SHEETS_ID", "shared-workbook");
    vi.stubEnv("GOOGLE_COMMUNITY_SHEETS_ID", "should-be-ignored");
    vi.stubEnv("GOOGLE_COMMUNITY_SHEETS_RANGE", "");
    vi.stubEnv(
      "GOOGLE_SERVICE_ACCOUNT_JSON_BASE64",
      Buffer.from(JSON.stringify({ client_email: "service@example.com", private_key: "test" })).toString("base64"),
    );
    get.mockResolvedValue({ data: { values: [COMMUNITY_HEADERS] } });
    append.mockResolvedValue({ data: { updates: { updatedRows: 1 } } });

    const response = await POST(context());
    expect(response.status).toBe(201);
    expect(get).toHaveBeenCalledWith(
      expect.objectContaining({ spreadsheetId: "shared-workbook", range: "Builders!A1:J1" }),
      expect.anything(),
    );
    expect(append).toHaveBeenCalledWith(
      expect.objectContaining({ spreadsheetId: "shared-workbook", range: "Builders!A:J" }),
      expect.anything(),
    );
  });

  it("honors a configured community range for header check and append", async () => {
    vi.stubEnv("GOOGLE_SHEETS_ID", "shared-workbook");
    vi.stubEnv("GOOGLE_COMMUNITY_SHEETS_RANGE", "Postulantes!A1:J");
    vi.stubEnv(
      "GOOGLE_SERVICE_ACCOUNT_JSON_BASE64",
      Buffer.from(JSON.stringify({ client_email: "service@example.com", private_key: "test" })).toString("base64"),
    );
    get.mockResolvedValue({ data: { values: [COMMUNITY_HEADERS] } });
    append.mockResolvedValue({ data: { updates: { updatedRows: 1 } } });

    const response = await POST(context());
    expect(response.status).toBe(201);
    expect(get).toHaveBeenCalledWith(
      expect.objectContaining({ spreadsheetId: "shared-workbook", range: "Postulantes!A1:J1" }),
      expect.anything(),
    );
    expect(append).toHaveBeenCalledWith(
      expect.objectContaining({ spreadsheetId: "shared-workbook", range: "Postulantes!A:J" }),
      expect.anything(),
    );
  });
});
