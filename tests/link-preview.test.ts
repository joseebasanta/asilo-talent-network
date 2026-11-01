import { describe, expect, it } from "vitest";
import { firstUrl, mockPreview, segments } from "../src/lib/accounts/link-preview";

describe("link detection", () => {
  it("finds http, www and bare domains, trimming trailing punctuation", () => {
    expect(firstUrl("Visita https://panapay.example/novedades.")).toBe("https://panapay.example/novedades");
    expect(firstUrl("Mira www.ruta.ve, está nuevo")).toBe("https://www.ruta.ve/");
    expect(firstUrl("Escríbenos en aula.io (hoy)")).toBe("https://aula.io/");
  });

  it("does not treat plain sentences or emails as links", () => {
    expect(firstUrl("Hola.Gracias por venir. Nos vemos")).toBeNull();
    expect(firstUrl("Escribe a hola@panapay.com por favor")).toBeNull();
    expect(firstUrl("Sin web aquí")).toBeNull();
  });

  it("rejects non-http schemes", () => {
    expect(firstUrl("javascript:alert(1)")).toBeNull();
  });

  it("splits text into segments that rebuild the original", () => {
    const text = "Antes pana.example/x y después, también https://otra.example.";
    const parts = segments(text);
    expect(parts.filter((p) => p.type === "link")).toHaveLength(2);
    expect(parts.map((p) => p.value).join("")).toBe(text);
  });
});

describe("mock preview", () => {
  it("builds a card from the host", () => {
    expect(mockPreview("https://www.pana.example/a")).toMatchObject({ host: "pana.example", title: "Pana", simulated: true });
  });
  it("returns nothing for no url or an unreadable page", () => {
    expect(mockPreview(null)).toBeNull();
    expect(mockPreview("https://fallo.example")).toBeNull();
  });
});
