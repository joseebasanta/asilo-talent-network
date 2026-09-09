import { describe, expect, it } from "vitest";
import {
  buildRow,
  CATEGORIES,
  findDuplicateWebsite,
  formatFecha,
  MAX_CATEGORIES,
  normalizeWebsiteKey,
  normalizeWebsiteUrl,
  validateSubmission,
  validateSubmissionForm,
  websiteColumnIndex,
} from "../src/lib/projects-submit";

const validInput = {
  nombre: "Pana Pay",
  website: "https://panapay.com",
  descripcion: "Pagos móviles para comercios venezolanos.",
  fundadores: "Luis Fernández, Ana Rodríguez",
  categorias: ["Fintech"],
};

describe("validateSubmission", () => {
  it("accepts a valid submission and trims/normalizes it", () => {
    const result = validateSubmission({
      ...validInput,
      nombre: "  Pana Pay  ",
      website: "panapay.com",
      descripcion: "  Pagos móviles para comercios venezolanos.  ",
      categorias: ["Fintech", "E-commerce", "SaaS"],
    });

    expect(result).toEqual({
      ok: true,
      value: {
        nombre: "Pana Pay",
        website: "https://panapay.com/",
        descripcion: "Pagos móviles para comercios venezolanos.",
        fundadores: "Luis Fernández, Ana Rodríguez",
        categorias: ["Fintech", "E-commerce", "SaaS"],
      },
    });
  });

  it("rejects a missing or too-short nombre", () => {
    expect(validateSubmission({ ...validInput, nombre: "" }).ok).toBe(false);
    expect(validateSubmission({ ...validInput, nombre: "  " }).ok).toBe(false);
    expect(validateSubmission({ ...validInput, nombre: "A" }).ok).toBe(false);
    expect(
      validateSubmission({ ...validInput, nombre: "x".repeat(81) }).ok,
    ).toBe(false);
  });

  it("rejects missing, malformed or non-http(s) websites", () => {
    for (const website of ["", "not a url", "javascript:alert(1)", "ftp://x.com", "data:text/html,hi"]) {
      expect(
        validateSubmission({ ...validInput, website }).ok,
        `website "${website}" should be rejected`,
      ).toBe(false);
    }
  });

  it("rejects a descripcion outside 10–140 chars", () => {
    expect(validateSubmission({ ...validInput, descripcion: "corta" }).ok).toBe(false);
    expect(validateSubmission({ ...validInput, descripcion: "  " }).ok).toBe(false);
    expect(
      validateSubmission({ ...validInput, descripcion: "x".repeat(141) }).ok,
    ).toBe(false);
  });

  it("rejects empty or over-long fundadores", () => {
    expect(validateSubmission({ ...validInput, fundadores: "" }).ok).toBe(false);
    expect(
      validateSubmission({ ...validInput, fundadores: "x".repeat(161) }).ok,
    ).toBe(false);
  });

  it("rejects zero, too many, or non-allowlist categories", () => {
    expect(validateSubmission({ ...validInput, categorias: [] }).ok).toBe(false);
    expect(
      validateSubmission({
        ...validInput,
        categorias: ["Fintech", "SaaS", "Web3", "Gaming"],
      }).ok,
    ).toBe(false);
    expect(
      validateSubmission({ ...validInput, categorias: ["Inventada"] }).ok,
    ).toBe(false);
    // Mixed valid + invalid must reject the entire submission.
    expect(
      validateSubmission({ ...validInput, categorias: ["Inventada", "Web3"] }).ok,
    ).toBe(false);
  });

  it("rejects duplicate categories and untrusted value types without throwing", () => {
    for (const input of [null, [], {}, { ...validInput, nombre: 123 },
      { ...validInput, descripcion: {} }, { ...validInput, categorias: "Fintech" },
      { ...validInput, categorias: ["Fintech", "Fintech"] },
      { ...validInput, nombre: "Pana\u0000Pay" }]) {
      expect(validateSubmission(input).ok).toBe(false);
    }
  });

  it("rejects credentials, local hosts, malformed URLs and excessive URL length", () => {
    for (const website of ["https://user:pass@example.com", "http://localhost",
      "http://127.0.0.1", "https://service.local", "https://example.com/a b",
      "https://exa\nmple.com", "https://example.com/" + "a".repeat(2048)]) {
      expect(validateSubmission({ ...validInput, website })).toMatchObject({
        ok: false, field: "website",
      });
    }
  });

  it("rejects URLs whose normalized encoding exceeds the limit", () => {
    expect(validateSubmission({ ...validInput, website: "https://example.com/" + "é".repeat(400) }))
      .toMatchObject({ ok: false, field: "website" });
  });

  it("accepts normalized output again, as the browser sends it to the server", () => {
    for (const website of ["mañana.com/niño", "https://example.com/" + "é".repeat(300), "EXAMPLE.COM."]) {
      const parsed = validateSubmission({ ...validInput, website });
      expect(parsed.ok).toBe(true);
      if (parsed.ok) expect(validateSubmission(parsed.value)).toEqual(parsed);
    }
  });

  it("accepts international domains and preserves legitimate paths and queries", () => {
    const result = validateSubmission({ ...validInput, website: "https://mañana.com/app?q=hello%20world" });
    expect(result).toMatchObject({ ok: true, value: {
      website: "https://xn--maana-pta.com/app?q=hello%20world",
    } });
  });

  it("validates multipart fields without stringifying files or accepting duplicate scalars", () => {
    const form = new FormData();
    for (const [key, value] of Object.entries(validInput)) {
      if (Array.isArray(value)) value.forEach((item) => form.append(key, item));
      else form.append(key, value);
    }
    expect(validateSubmissionForm(form).ok).toBe(true);
    form.append("nombre", "Another name");
    expect(validateSubmissionForm(form)).toMatchObject({ ok: false, field: "nombre" });
    form.delete("nombre");
    form.append("nombre", new Blob(["Pana Pay"]), "name.txt");
    expect(validateSubmissionForm(form)).toMatchObject({ ok: false, field: "nombre" });
    form.delete("nombre");
    expect(validateSubmissionForm(form)).toMatchObject({ ok: false, field: "nombre" });
  });

  it("accepts exactly the category boundary cases (1 and 3)", () => {
    expect(validateSubmission({ ...validInput, categorias: [CATEGORIES[0]] }).ok).toBe(true);
    expect(
      validateSubmission({ ...validInput, categorias: CATEGORIES.slice(0, MAX_CATEGORIES) }).ok,
    ).toBe(true);
  });

  it("keeps the submission category order stable", () => {
    const result = validateSubmission({
      ...validInput,
      categorias: ["SaaS", "Fintech", "E-commerce"],
    });
    expect(result.ok && result.value.categorias).toEqual(["SaaS", "Fintech", "E-commerce"]);
  });
});

describe("normalizeWebsiteUrl", () => {
  it("adds https:// when the scheme is missing", () => {
    expect(normalizeWebsiteUrl("panapay.com")).toBe("https://panapay.com/");
    expect(normalizeWebsiteUrl("panapay.com/pagos")).toBe("https://panapay.com/pagos");
  });

  it("keeps an explicit http(s) scheme", () => {
    expect(normalizeWebsiteUrl("http://panapay.com")).toBe("http://panapay.com/");
    expect(normalizeWebsiteUrl("https://panapay.com")).toBe("https://panapay.com/");
  });

  it("rejects malformed and non-http(s) URLs", () => {
    for (const raw of ["", "   ", "not a url", "javascript:alert(1)", "ftp://x.com", "https://"]) {
      expect(normalizeWebsiteUrl(raw)).toBeNull();
    }
  });
});

describe("normalizeWebsiteKey", () => {
  it("collapses scheme, www, case and trailing slash", () => {
    for (const raw of [
      "https://PanaPay.com",
      "https://www.panapay.com/",
      "panapay.com",
      "http://panapay.com/path",
    ]) {
      expect(normalizeWebsiteKey(raw)).toBe("panapay.com");
    }
  });

  it("returns an empty key for unparseable input", () => {
    expect(normalizeWebsiteKey("")).toBe("");
    expect(normalizeWebsiteKey("not a url")).toBe("");
  });
});

describe("websiteColumnIndex", () => {
  it("finds the website column accent/case-insensitively", () => {
    expect(websiteColumnIndex(["ID del proyecto", "Sitio web", "Aprobado"])).toBe(1);
    expect(websiteColumnIndex(["NOMBRE DEL PROYECTO", "WEBSITE URL"])).toBe(1);
  });

  it("returns -1 when the header is missing", () => {
    expect(websiteColumnIndex(["Aprobado"])).toBe(-1);
    expect(websiteColumnIndex([])).toBe(-1);
  });
});

describe("findDuplicateWebsite", () => {
  const headers = ["ID del proyecto", "Sitio web", "Aprobado"];
  const pending = ["p1", "https://panapay.com", "PENDIENTE"];
  const approved = ["p2", "https://www.PanaPay.com/", "SI"];

  it("matches existing pending and approved rows by normalized host", () => {
    expect(findDuplicateWebsite([headers, pending], "https://panapay.com")).toBe(true);
    expect(findDuplicateWebsite([headers, approved], "panapay.com")).toBe(true);
  });

  it("ignores rows with unrelated websites", () => {
    expect(findDuplicateWebsite([headers, pending], "https://otro.com")).toBe(false);
  });

  it("returns false when the website column is missing", () => {
    expect(findDuplicateWebsite([["Aprobado"], ["SI"]], "https://panapay.com")).toBe(false);
  });

  it("never matches on an empty/invalid submitted website", () => {
    expect(findDuplicateWebsite([headers, pending], "")).toBe(false);
    expect(findDuplicateWebsite([headers, pending], "not a url")).toBe(false);
  });
});

describe("formatFecha", () => {
  it("formats local time as zero-padded HH:mm DD-MM-YYYY", () => {
    expect(formatFecha(new Date(2026, 8, 4, 23, 15))).toBe("23:15 04-09-2026");
    expect(formatFecha(new Date(2026, 0, 5, 9, 7))).toBe("09:07 05-01-2026");
  });
});

describe("buildRow", () => {
  it("shapes the 10-cell quarantined row (A–J)", () => {
    const submittedAt = new Date(2026, 8, 4, 23, 15);
    const row = buildRow(
      {
        nombre: "Pana Pay",
        website: "https://panapay.com/",
        descripcion: "Pagos móviles para comercios venezolanos.",
        fundadores: "Luis Fernández",
        categorias: ["Fintech", "E-commerce"],
      },
      { revisionId: "rev-1", submittedAt },
    );

    expect(row).toHaveLength(10);
    expect(row).toEqual([
      "23:15 04-09-2026", // Fecha (formatFecha, local)
      "Pana Pay", // Nombre del proyecto
      "https://panapay.com/", // Sitio web
      "Pagos móviles para comercios venezolanos.", // Descripción corta
      "Luis Fernández", // Fundadores
      "Fintech, E-commerce", // Categorías
      "PENDIENTE", // Aprobado
      "", // ID del logo
      "rev-1", // ID de revisión
      "", // Notas adicionales
    ]);
  });

  it("generates a UUID revision id and a formatted local Fecha by default", () => {
    const row = buildRow({
      nombre: "Pana Pay",
      website: "https://panapay.com/",
      descripcion: "Pagos móviles para comercios venezolanos.",
      fundadores: "Luis Fernández",
      categorias: ["Fintech"],
    });

    expect(row[8]).toMatch(/^[0-9a-f-]{36}$/);
    expect(row[0]).toMatch(/^\d{2}:\d{2} \d{2}-\d{2}-\d{4}$/);
    expect(row[6]).toBe("PENDIENTE");
  });

  it("writes an empty logo cell by default and the logoId at index 7 when provided", () => {
    const base = {
      nombre: "Pana Pay",
      website: "https://panapay.com/",
      descripcion: "Pagos móviles para comercios venezolanos.",
      fundadores: "Luis Fernández",
      categorias: ["Fintech"],
    };
    const submittedAt = new Date(2026, 8, 4, 23, 15);

    const withoutLogo = buildRow({ ...base, categorias: ["Fintech"] }, { revisionId: "rev-1", submittedAt });
    expect(withoutLogo[7]).toBe("");

    const withLogo = buildRow({ ...base, categorias: ["Fintech"] }, {
      revisionId: "rev-1",
      submittedAt,
      logoId: "logo-abc123",
    });
    expect(withLogo[7]).toBe("logo-abc123");
    expect(withLogo).toHaveLength(10);
  });
});
