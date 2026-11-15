import { describe, expect, it } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { buildRowForHeaders, findLatestApprovedRevision } from "../src/lib/projects-submit";
import { parseProjects } from "../src/lib/projects-loader";
import { validateSubmission } from "../src/lib/projects-schema";
import ProjectFormModal from "../src/components/ProjectFormModal.astro";

const headers = ["Fecha", "Nombre del proyecto", "Sitio web", "Descripción corta", "Fundadores", "Categorías", "Aprobado", "ID del logo", "ID de revisión"];
const submission = { nombre: "Pana", website: "https://pana.example/", descripcion: "Descripción nueva del proyecto", fundadores: "Ana", categorias: ["Fintech"] };
const withCounters = [...headers, "Nota interna", "Visitas", "Tendencia"];
const original = ["2026-10-01", "Pana", submission.website, "Descripción anterior", "Ana", "Fintech, AI", "SI", "logo-1", "revision-1", "", "1250", "7"];

describe("approved edit requests", () => {
  it("keep published counters the revision does not set", () => {
    const revision = buildRowForHeaders(withCounters, submission, { notes: "Contacto: ana@example.com", logoId: "logo-1" });
    revision[6] = "SI";
    const [published] = parseProjects([withCounters, original, revision]);
    expect(published.description).toBe(submission.descripcion);
    expect(published.visits).toBe(1250);
    expect(published.trending).toBe(7);
  });

  it("let an approved revision override counters, including zero", () => {
    const revision = buildRowForHeaders(withCounters, submission, { notes: "Contacto: ana@example.com" });
    revision[6] = "SI";
    revision[10] = "0";
    const [published] = parseProjects([withCounters, original, revision]);
    expect(published.visits).toBe(0);
    expect(published.trending).toBe(7);
  });

  it("fail closed when the sheet cannot store the requester's contact", () => {
    expect(() => buildRowForHeaders(headers, submission, { notes: "Contacto: ana@example.com" })).toThrow(/notes/);
    expect(() => buildRowForHeaders(headers, submission)).not.toThrow();
  });

  it("expose the published tags of the latest approved revision", () => {
    expect(findLatestApprovedRevision([withCounters, original], "pana.example")?.tags).toEqual(["Fintech", "AI"]);
  });
});

describe("legacy categories", () => {
  it("are preselected in the edit form", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ProjectFormModal, { props: { mode: "edit", project: { title: "Pana", href: submission.website, description: submission.descripcion, author: "Ana", tags: ["Fintech", "AI"] } } });
    const selected = [...html.matchAll(/<input\b[^>]*name="categorias"[^>]*>/g)].map(match => match[0])
      .filter(tag => /\bchecked(?:[\s=>])/.test(tag)).map(tag => /value="([^"]*)"/.exec(tag)?.[1]);
    expect(selected).toEqual(["Fintech", "AI"]);
  });

  it("are not offered when creating a project", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ProjectFormModal, { props: { mode: "create" } });
    expect(html).not.toContain('value="AI"');
  });

  it("validate only when allowed by the published project", () => {
    const input = { ...submission, categorias: ["Fintech", "AI"] };
    expect(validateSubmission(input).ok).toBe(false);
    expect(validateSubmission(input, ["AI"]).ok).toBe(true);
    expect(validateSubmission(input, "any").ok).toBe(true);
    expect(validateSubmission({ ...input, categorias: ["A, B"] }, "any").ok).toBe(false);
  });
});
