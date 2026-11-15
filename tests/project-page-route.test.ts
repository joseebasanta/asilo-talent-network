import { expect, it, vi } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
const { findProject } = vi.hoisted(() => ({ findProject: vi.fn() }));
vi.mock("../src/lib/directory", () => ({ findProject }));
import ProjectPage from "../src/pages/proyectos/[slug].astro";

const project = { id: "123456abcdef", slug: "pana-123456abcdef", title: "Pana", href: "https://pana.example/", description: "Descripción del proyecto", author: "Ana", tags: ["Fintech"] };
it("detail pages initialize the stored light theme before first paint", async () => {
  findProject.mockResolvedValue(project);
  const container = await AstroContainer.create();
  const html = await container.renderToString(ProjectPage, { params: { slug: project.slug }, request: new Request(`https://asilo.test/proyectos/${project.slug}`) });
  expect(html).toContain('localStorage.getItem("theme")');
});

it("renaming a project in both directions uses temporary redirects", async () => {
  const container = await AstroContainer.create();
  findProject.mockResolvedValue({ ...project, slug: "nuevo-123456abcdef", title: "Nuevo" });
  const first = await container.renderToResponse(ProjectPage, { params: { slug: project.slug }, request: new Request(`https://asilo.test/proyectos/${project.slug}`) });
  findProject.mockResolvedValue(project);
  const second = await container.renderToResponse(ProjectPage, { params: { slug: "nuevo-123456abcdef" }, request: new Request("https://asilo.test/proyectos/nuevo-123456abcdef") });
  expect([first.status, second.status]).toEqual([302, 302]);
});
