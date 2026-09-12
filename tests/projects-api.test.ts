import { describe, expect, it } from "vitest";
import { GET } from "../src/pages/api/projects/index";

describe("GET /api/projects", () => {
  it("stays public read-only but limits one IP to 60 requests per minute", async () => {
    const context = { clientAddress: "198.51.100.1" } as Parameters<typeof GET>[0];

    const first = await GET(context);
    expect(first.status).toBe(200);
    expect(first.headers.get("cache-control")).toBe("no-store");

    for (let i = 1; i < 60; i += 1) await GET(context);

    const blocked = await GET(context);
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).toBe("60");
  });
});
