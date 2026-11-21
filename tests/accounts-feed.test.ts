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

  it("supports safe authored-project publishing, pagination, previews, and deletion", () => {
    const feed = createDemoFeed();
    expect(feed.createPost("demo-ruta-viva", { text: "https://example.com/novedad", image: "data:image/png;base64,synthetic" }).ok).toBe(false);
    const created = feed.createPost("demo-pana-pay", { text: "Nueva actualización https://example.com/novedad", image: "data:image/png;base64,synthetic" });
    expect(created.ok).toBe(true);
    if (created.ok) {
      expect(created.value.preview?.url).toBe("https://example.com/novedad");
      expect(created.value.image).toContain("data:image/png");
      expect(feed.feedPage(null, 2).posts).toHaveLength(2);
      expect(feed.delete(created.value.id).ok).toBe(true);
      expect(feed.post(created.value.id)).toBeNull();
    }
  });
});

describe("demo route boundaries", () => {
  it("keeps announcements and notifications under the server demo gate", async () => {
    const fs = await import("node:fs/promises");
    const paths = [
      "src/pages/demo-cuentas/anuncios.astro",
      "src/pages/demo-cuentas/notificaciones.astro",
      "src/pages/demo-cuentas/anuncios/[id].astro",
      "src/pages/demo-cuentas/anuncios/moderacion.astro",
    ];
    const source = await Promise.all(paths.map((path) => fs.readFile(path, "utf8")));
    expect(source.every((page) => page.includes("isaacAccountsPrototypeEnabled"))).toBe(true);
    expect(source.join("\n")).toContain("data-demo-gate");
    expect(source.join("\n")).not.toMatch(/fetch\s*\(|\/api\//i);
  });

  it("does not claim that the demo avoids browser storage", async () => {
    const fs = await import("node:fs/promises");
    const home = await fs.readFile("src/pages/demo-cuentas.astro", "utf8");
    expect(home).toContain("sessionStorage");
    expect(home).not.toContain("no guarda datos en el navegador");
  });
});
