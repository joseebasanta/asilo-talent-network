import { afterEach, describe, expect, it, vi } from "vitest";

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

let nextIp = 0;
function context(ip = `norm-${++nextIp}`) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ ...valid, started: String(Date.now() - 10000) })) {
    form.set(key, value);
  }
  return {
    request: new Request("https://asilo.test/api/community/submit", { method: "POST", body: form }),
    clientAddress: ip,
  } as Parameters<typeof POST>[0];
}

function configure() {
  vi.stubEnv("GOOGLE_SHEETS_ID", "projects");
  vi.stubEnv("GOOGLE_COMMUNITY_SHEETS_RANGE", "");
  vi.stubEnv(
    "GOOGLE_SERVICE_ACCOUNT_JSON_BASE64",
    Buffer.from(JSON.stringify({ client_email: "service@example.com", private_key: "test" })).toString("base64"),
  );
}

describe("community header normalization", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("accepts live Builders headers with capitalization/accent/whitespace variants", async () => {
    configure();
    append.mockResolvedValue({ data: { updates: { updatedRows: 1 } } });
    const variants: string[][] = [
      ["Fecha", "Email", "Nombre y Apellido", "Ciudad, país", "WhatsApp", "LinkedIn", "Rol", "Nombre del proyecto", "Descripción", "Estado"],
      ["FECHA", "EMAIL", "NOMBRE Y APELLIDO", "CIUDAD, PAIS", "WHATSAPP", "LINKEDIN", "ROL", "NOMBRE DEL PROYECTO", "DESCRIPCION", "ESTADO"],
      ["  Fecha ", " Email", "  Nombre   y  Apellido ", "Ciudad,  país ", "WhatsApp ", " LinkedIn", "Rol ", " Nombre del proyecto ", " Descripción ", " Estado "],
    ];
    for (const headers of variants) {
      get.mockResolvedValue({ data: { values: [headers] } });
      vi.clearAllMocks();
      // re-stub after clear (clearAllMocks does not unstub env, only mocks)
      append.mockResolvedValue({ data: { updates: { updatedRows: 1 } } });
      get.mockResolvedValue({ data: { values: [headers] } });
      const response = await POST(context());
      expect(response.status).toBe(201);
      expect(append).toHaveBeenCalledWith(
        expect.objectContaining({ spreadsheetId: "projects", range: "Builders!A:J" }),
        expect.anything(),
      );
    }
  });

  it("stays fail-closed on reordered/missing headers", async () => {
    configure();
    append.mockResolvedValue({ data: { updates: { updatedRows: 1 } } });
    const live = ["Fecha", "Email", "Nombre y Apellido", "Ciudad, país", "WhatsApp", "LinkedIn", "Rol", "Nombre del proyecto", "Descripción", "Estado"];
    for (const values of [[], [[...live].reverse()], [live.slice(0, 9)]]) {
      get.mockResolvedValue({ data: { values } });
      expect((await POST(context())).status).toBe(503);
    }
    expect(append).not.toHaveBeenCalled();
  });
});
