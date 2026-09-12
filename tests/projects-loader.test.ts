import { projects as placeholderProjects } from "../src/data/projects";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  loadApprovedProjects,
  parseProjects,
  resetProjectsCache,
  TTL_MS,
} from "../src/lib/projects-loader";

// Canonical sheet layout: Nombre del proyecto | Website URL | Descripcion corta
// | Fundadores | Categorias | Aprobado.
const HEADERS = [
  "Nombre del proyecto",
  "Website URL",
  "Descripcion corta",
  "Fundadores",
  "Categorias",
  "Aprobado",
];

const previousEnv = {
  GOOGLE_SHEETS_ID: process.env.GOOGLE_SHEETS_ID,
  GOOGLE_SERVICE_ACCOUNT_JSON_BASE64:
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64,
};

afterEach(() => {
  process.env.GOOGLE_SHEETS_ID = previousEnv.GOOGLE_SHEETS_ID;
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 =
    previousEnv.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64;
  resetProjectsCache();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("parseProjects", () => {
  it("maps approved rows and filters NO/PENDIENTE/empty, sorting alphabetically", () => {
    const values = [
      HEADERS,
      ["Zeta", "https://zeta.example", "Desc Z", "Ana", "AI, SaaS", "SI"],
      ["Alfa", "https://alfa.example", "Desc A", "Luis", "Fintech", "NO"],
      [
        "Beta",
        "https://beta.example",
        "Desc B",
        "María",
        "Edtech",
        "PENDIENTE",
      ],
      ["Delta", "https://delta.example", "Desc D", "José", "Web3", ""],
      ["Gamma", "https://gamma.example", "Desc G", "Leo", "Gaming", "SI"],
    ];

    const projects = parseProjects(values);

    expect(projects.map((p) => p.title)).toEqual(["Gamma", "Zeta"]);
    expect(projects[0]).toEqual({
      href: "https://gamma.example",
      title: "Gamma",
      description: "Desc G",
      author: "Leo",
      tags: ["Gaming"],
      iconUrl: "/icons/pixelarticons/gamepad.svg",
    });
  });

  it("accepts accent- and case-insensitive approval (sí / SI) but nothing else", () => {
    const values = [
      HEADERS,
      ["Uno", "https://uno.example", "", "", "", "sí"],
      ["Dos", "https://dos.example", "", "", "", " si "],
      ["Tres", "https://tres.example", "", "", "", "SÍ"],
      ["Cuatro", "https://cuatro.example", "", "", "", "NO"],
      ["Cinco", "https://cinco.example", "", "", "", "Pendiente"],
    ];

    expect(parseProjects(values).map((p) => p.title)).toEqual(
      ["Dos", "Tres", "Uno"].sort(),
    );
  });

  it("rejects non-http(s) and malformed URLs", () => {
    const values = [
      HEADERS,
      ["OkHttps", "https://ok.example", "", "", "", "SI"],
      ["OkHttp", "http://ok.example", "", "", "", "SI"],
      ["JsUrl", "javascript:alert(1)", "", "", "", "SI"],
      ["DataUrl", "data:text/html,<h1>hi</h1>", "", "", "", "SI"],
      ["FtpUrl", "ftp://files.example", "", "", "", "SI"],
      ["Malformed", "not a url", "", "", "", "SI"],
      ["EmptyUrl", "", "", "", "", "SI"],
    ];

    const titles = parseProjects(values).map((p) => p.title);
    expect(titles).toContain("OkHttp");
    expect(titles).toContain("OkHttps");
    expect(titles).not.toContain("JsUrl");
    expect(titles).not.toContain("DataUrl");
    expect(titles).not.toContain("FtpUrl");
    expect(titles).not.toContain("Malformed");
    expect(titles).not.toContain("EmptyUrl");
  });

  it("maps approval when positioned at column J of the revision layout", () => {
    const values = [
      [
        "project_id",
        "revision_id",
        "submitted_at",
        "Nombre del proyecto",
        "Website URL",
        "Descripcion corta",
        "Fundadores",
        "Categorias",
        "Logo file id",
        "Aprobado",
        "Notas adicionales",
      ],
      [
        "p1",
        "r1",
        "2026-09-04",
        "Columna J",
        "https://colj.example",
        "Desc J",
        "Ana",
        "Web3",
        "logo-1",
        "SI",
        "nota",
      ],
    ];

    const [project] = parseProjects(values);

    expect(project).toEqual({
      href: "https://colj.example",
      title: "Columna J",
      description: "Desc J",
      author: "Ana",
      tags: ["Web3"],
      iconUrl: "/icons/pixelarticons/wallet.svg",
    });
  });

  it("parses the new Spanish labels order-independently, ignoring internal columns", () => {
    const values = [
      [
        "ID del proyecto",
        "ID de revisión",
        "Enviado el",
        "Nombre del proyecto",
        "Sitio web",
        "Descripción corta",
        "Fundadores",
        "Categorías",
        "ID del logo",
        "Aprobado",
        "Notas adicionales",
      ],
      [
        "p9",
        "r9",
        "2026-09-04",
        "Etiquetas",
        "https://etiquetas.example",
        "Descripción",
        "Ana",
        "AI, Fintech",
        "logo-9",
        "SI",
        "nota",
      ],
      [
        "p10",
        "r10",
        "2026-09-04",
        "Oculto",
        "https://oculto.example",
        "Desc",
        "Luis",
        "Web3",
        "logo-10",
        "PENDIENTE",
        "Mod",
        "2026-09-04",
        "nota",
      ],
    ];

    const [project] = parseProjects(values);

    expect(project).toEqual({
      href: "https://etiquetas.example",
      title: "Etiquetas",
      description: "Descripción",
      author: "Ana",
      tags: ["AI", "Fintech"],
      iconUrl: "/icons/pixelarticons/box.svg",
    });
  });

  it("normalizes headers case/space/accent-insensitively and reorders columns freely", () => {
    const values = [
      [
        "aprobado",
        "NOMBRE DEL PROYECTO ",
        " CATEGORÍAS",
        "website url",
        "Descripción  corta",
        "FUNDADORES",
      ],
      [
        "SI",
        "Orden",
        "AI, Fintech",
        "https://orden.example",
        "Desc corta",
        "Leo",
      ],
    ];

    const [project] = parseProjects(values);

    expect(project).toEqual({
      href: "https://orden.example",
      title: "Orden",
      description: "Desc corta",
      author: "Leo",
      tags: ["AI", "Fintech"],
      iconUrl: "/icons/pixelarticons/box.svg",
    });
  });

  it("splits tags on commas and semicolons and drops empty tags", () => {
    const values = [
      HEADERS,
      ["Tags", "https://tags.example", "", "", "AI; SaaS, Fintech ,,", "SI"],
    ];

    expect(parseProjects(values)[0].tags).toEqual(["AI", "SaaS", "Fintech"]);
  });

  it("does NOT silently truncate; every approved row reaches the grid", () => {
    const rows: string[][] = [];
    for (let i = 0; i < 15; i += 1) {
      rows.push([`Proyecto ${i}`, `https://p${i}.example`, "", "", "", "SI"]);
    }
    const projects = parseProjects([HEADERS, ...rows]);

    expect(projects).toHaveLength(15);
    expect(projects.map((p) => p.title)).toEqual(
      Array.from({ length: 15 }, (_, i) => `Proyecto ${i}`).sort(),
    );
  });

  it("returns an empty list when the approval column is missing", () => {
    const values = [
      ["Nombre del proyecto", "Website URL"],
      ["Uno", "https://uno.example"],
    ];

    expect(parseProjects(values)).toEqual([]);
  });

  it("returns an empty list on a blank sheet", () => {
    expect(parseProjects([])).toEqual([]);
    expect(parseProjects([[]])).toEqual([]);
  });

  it("maps the ID del logo column to a public Appwrite view URL", () => {
    const values = [
      [
        "Nombre del proyecto",
        "Website URL",
        "ID del logo",
        "Aprobado",
      ],
      ["Logo", "https://logo.example", "653f2aa1a2f1c0d1", "SI"],
      ["Sin Logo", "https://sinlogo.example", "", "SI"],
    ];

    const prev = process.env.APPWRITE_ENDPOINT;
    process.env.APPWRITE_ENDPOINT = "https://nyc.cloud.appwrite.io/v1";
    process.env.APPWRITE_PROJECT_ID = "sello-protocol";
    try {
      const [withLogo, withoutLogo] = parseProjects(values);
      expect(withLogo.logoUrl).toBe(
        "https://nyc.cloud.appwrite.io/v1/storage/buckets/project-logos/files/653f2aa1a2f1c0d1/view?project=sello-protocol",
      );
      expect(withoutLogo.logoUrl).toBeUndefined();
    } finally {
      if (prev === undefined) delete process.env.APPWRITE_ENDPOINT;
      else process.env.APPWRITE_ENDPOINT = prev;
    }
  });

  it("omits the logo URL when Appwrite is not configured", () => {
    const values = [
      ["Nombre del proyecto", "Website URL", "ID del logo", "Aprobado"],
      ["Logo", "https://logo.example", "653f2aa1a2f1c0d1", "SI"],
    ];

    const prev = process.env.APPWRITE_ENDPOINT;
    delete process.env.APPWRITE_ENDPOINT;
    try {
      const [project] = parseProjects(values);
      expect(project.logoUrl).toBeUndefined();
    } finally {
      if (prev !== undefined) process.env.APPWRITE_ENDPOINT = prev;
    }
  });
});

describe("loadApprovedProjects", () => {
  it("falls back to the placeholder grid without configuration", async () => {
    delete process.env.GOOGLE_SHEETS_ID;
    delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64;

    const projects = await loadApprovedProjects();

    expect(projects).toEqual(placeholderProjects);
    expect(projects[0].href).toBe("#");
    expect(projects[0].title).toBe("Directorio de Builders");
  });

  it("returns an empty list when a structured sheet has no approved rows", async () => {
    process.env.GOOGLE_SHEETS_ID = "test-sheet";
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 = "dGVzdA==";

    const projects = await loadApprovedProjects(async () => [HEADERS]);

    expect(projects).toEqual([]);
  });

  it("serves stale data on fetch error once the TTL has elapsed", async () => {
    process.env.GOOGLE_SHEETS_ID = "test-sheet";
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 = "dGVzdA==";
    vi.useFakeTimers();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    let fail = false;
    let calls = 0;
    const fetcher = async () => {
      calls += 1;
      if (fail) throw new Error("sheets outage");
      return [HEADERS, ["Zeta", "https://zeta.example", "", "", "", "SI"]];
    };

    const first = await loadApprovedProjects(fetcher);
    expect(first[0].title).toBe("Zeta");

    fail = true;
    vi.advanceTimersByTime(TTL_MS + 1);
    const second = await loadApprovedProjects(fetcher);

    // The failing path really ran: the fetcher was called again past the TTL.
    expect(calls).toBe(2);
    expect(second[0].title).toBe("Zeta");

    // Bounded generic diagnostic only: the raw upstream error is never logged.
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0]).toHaveLength(1);
    expect(errorSpy.mock.calls[0][0]).toBeTypeOf("string");
  });

  it("serves a stale successful empty list on a later fetch error", async () => {
    process.env.GOOGLE_SHEETS_ID = "test-sheet";
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 = "dGVzdA==";
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => {});

    let fail = false;
    let calls = 0;
    const fetcher = async () => {
      calls += 1;
      if (fail) throw new Error("sheets outage");
      return [HEADERS];
    };

    expect(await loadApprovedProjects(fetcher)).toEqual([]);

    fail = true;
    vi.advanceTimersByTime(TTL_MS + 1);

    expect(await loadApprovedProjects(fetcher)).toEqual([]);
    expect(calls).toBe(2);
  });

  it("falls back to the placeholder grid when the first fetch fails", async () => {
    process.env.GOOGLE_SHEETS_ID = "test-sheet";
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 = "dGVzdA==";
    vi.spyOn(console, "error").mockImplementation(() => {});

    const projects = await loadApprovedProjects(async () => {
      throw new Error("sheets outage");
    });

    expect(projects).toEqual(placeholderProjects);
    expect(projects[0].href).toBe("#");
  });

  it("reflects approvals and revocations after ten seconds and shares concurrent reads", async () => {
    process.env.GOOGLE_SHEETS_ID = "test-sheet";
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 = "dGVzdA==";
    vi.useFakeTimers();
    let approval = "PENDIENTE";
    const fetcher = vi.fn(async () => [HEADERS, ["Nuevo", "https://nuevo.example", "", "", "", approval]]);
    expect(await loadApprovedProjects(fetcher)).toEqual([]);
    approval = "SI";
    vi.advanceTimersByTime(9_999);
    expect(await loadApprovedProjects(fetcher)).toEqual([]);
    vi.advanceTimersByTime(1);
    const results = await Promise.all(Array.from({ length: 10 }, () => loadApprovedProjects(fetcher)));
    expect(results.every(result => result[0]?.title === "Nuevo")).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(2);
    approval = "NO";
    vi.advanceTimersByTime(10_000);
    expect(await loadApprovedProjects(fetcher)).toEqual([]);
  });

  it("does not refetch within the TTL window", async () => {
    process.env.GOOGLE_SHEETS_ID = "test-sheet";
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 = "dGVzdA==";

    let calls = 0;
    const fetcher = async () => {
      calls += 1;
      return [HEADERS, ["Zeta", "https://zeta.example", "", "", "", "SI"]];
    };

    await loadApprovedProjects(fetcher);
    await loadApprovedProjects(fetcher);

    expect(calls).toBe(1);
  });
});
