import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { afterEach, expect, it, vi } from "vitest";
const { getValues } = vi.hoisted(() => ({ getValues: vi.fn() }));
vi.mock("@googleapis/sheets", () => ({ default: {
  auth: { JWT: class {} },
  sheets: () => ({ spreadsheets: { values: { get: getValues } } }),
} }));
vi.mock("../src/lib/builders-loader", () => ({ loadBuildersCount: async () => 180 }));
import Home from "../src/pages/index.astro";
import Directory from "../src/pages/proyectos.astro";
import { GET } from "../src/pages/api/projects/index";
import { resetProjectsCache } from "../src/lib/projects-loader";
afterEach(() => { resetProjectsCache(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });
it("reflects a Sheets approval and revocation in both SSR pages and the API after cache expiry", async () => {
  vi.stubEnv("GOOGLE_SHEETS_ID", "test-sheet");
  vi.stubEnv("GOOGLE_SERVICE_ACCOUNT_JSON_BASE64", Buffer.from(JSON.stringify({ client_email: "test", private_key: "test" })).toString("base64"));
  let now = Date.now();
  vi.spyOn(Date, "now").mockImplementation(() => now);
  let approval = "PENDIENTE";
  getValues.mockImplementation(async () => ({ data: { values: [
    ["Nombre del proyecto", "Sitio web", "Aprobado"],
    ["Approval lifecycle fixture", "https://fixture.example", approval],
  ] } }));
  const container = await AstroContainer.create();
  async function verify(published: boolean) {
    for (const [component, path] of [[Home, "/"], [Directory, "/proyectos"]] as const) {
      const response = await container.renderToResponse(component, { request: new Request(`https://example.com${path}`) });
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect((await response.text()).includes("Approval lifecycle fixture")).toBe(published);
    }
    const response = await GET({ clientAddress: "192.0.2.52" } as Parameters<typeof GET>[0]);
    expect((await response.json()).projects).toHaveLength(published ? 1 : 0);
  }
  await verify(false);
  approval = "SI";
  now += 59_999;
  await verify(false);
  now += 1;
  await verify(true);
  expect(getValues).toHaveBeenCalledTimes(2);
  approval = "NO";
  now += 60_000;
  await verify(false);
  expect(getValues).toHaveBeenCalledTimes(3);
  expect(getValues).toHaveBeenLastCalledWith(expect.objectContaining({ spreadsheetId: "test-sheet" }), { timeout: 15_000, retry: false });
});
