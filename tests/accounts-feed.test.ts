import { describe, expect, it } from "vitest";
import { createDemoFeed } from "../src/lib/accounts/demo-feed";

describe("demo announcements", () => {
  it("starts with synthetic announcements and supports reactions/comments", () => {
    const feed = createDemoFeed();
    const first = feed.posts()[0];
    expect(first.project).toBe("Pana Pay");
    expect(feed.react(first.id, "rocket")).toBe("rocket");
    expect(feed.comment(first.id, "Me interesa conocer más.").ok).toBe(true);
    expect(feed.notifications()).toHaveLength(2);
  });

  it("rejects empty comments and keeps moderation simulated", () => {
    const feed = createDemoFeed();
    const first = feed.posts()[0];
    expect(feed.comment(first.id, "   ").ok).toBe(false);
    expect(feed.report(first.id).ok).toBe(true);
    expect(feed.resolve(first.id, "hide")).toBe(true);
    expect(feed.posts()).toHaveLength(1);
  });
});

describe("demo route boundaries", () => {
  it("keeps announcements and notifications under the server demo gate", async () => {
    const fs = await import("node:fs/promises");
    const paths = [
      "src/pages/demo-cuentas/anuncios.astro",
      "src/pages/demo-cuentas/notificaciones.astro",
      "src/pages/demo-cuentas/anuncios/moderacion.astro",
    ];
    const source = await Promise.all(paths.map((path) => fs.readFile(path, "utf8")));
    expect(source.every((page) => page.includes("isaacAccountsPrototypeEnabled"))).toBe(true);
    expect(source.join("\n")).not.toMatch(/fetch\s*\(|\/api\//i);
  });
});
