import { readFileSync } from "node:fs";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import ProjectDirectory from "../src/components/ProjectDirectory.astro";
import type { Project } from "../src/data/projects";

describe("ProjectDirectory", () => {
  it("shows ten projects per carousel page in two five-card columns", async () => {
    const projects: Project[] = Array.from({ length: 20 }, (_, index) => ({
      href: `https://project-${index}.example`,
      title: `Project ${index}`,
      description: "Test project",
      author: "Test author",
      tags: [],
    }));
    const container = await AstroContainer.create();
    const html = await container.renderToString(ProjectDirectory, { props: { projects } });

    expect((html.match(/class="prj-item"/g) ?? []).length).toBe(20);
    expect((html.match(/data-project-page/g) ?? []).length).toBe(2);
    expect((html.match(/class="prj-col"/g) ?? []).length).toBe(4);
    expect(html).toContain('data-project-page="0"');
    expect(html).toMatch(/data-project-page="1"[^>]*\bhidden\b/);
    expect(html).toContain('data-project-nav="previous"');
    expect(html).toContain('data-project-nav="next"');
    expect(html).toContain('id="project-directory-list"');
    expect((html.match(/target="_blank" rel="noopener noreferrer"/g) ?? []).length).toBe(20);
    expect((html.match(/icons\/pixelarticons\/box\.svg/g) ?? []).length).toBe(20);
    expect(readFileSync(new URL("../src/components/ProjectDirectory.astro", import.meta.url), "utf8"))
      .toContain("gsap.timeline");
  });

  it("shows a complete success state with actions instead of a buried status message", () => {
    const component = readFileSync(
      new URL("../src/components/ProjectDirectory.astro", import.meta.url),
      "utf8",
    );

    expect(component).toContain('class="modal-success"');
    expect(component).toContain("<span>Tu proyecto ya está</span>");
    expect(component).toContain("<span>en revisión</span>");
    expect(component).toContain("Gracias por sumarte.");
    expect(component).toContain('src="/check-thanks.svg"');
    expect(component).not.toContain("Revisaremos el proyecto");
    expect(component).toContain("Agregar otro proyecto");
    expect(component).toContain('data-success-view');
    expect(component).toContain('data-submit-another');
    expect(component).toContain("playConfetti();");
    expect(component).toContain('layer.className = "modal-confetti"');
    expect(component).toContain("Logo (opcional)");
  });

  it("only closes from a genuine backdrop click, not a text-selection gesture", () => {
    const component = readFileSync(
      new URL("../src/components/ProjectDirectory.astro", import.meta.url),
      "utf8",
    );

    expect(component).toContain('dialog.addEventListener("pointerdown"');
    expect(component).toContain("backdropPointerDown && e.target === dialog");
  });

  it("keeps hidden carousel pages out of the flex layout", () => {
    const styles = readFileSync(
      new URL("../src/styles/global.css", import.meta.url),
      "utf8",
    );

    expect(styles).toContain(".prj-list[hidden] { display: none; }");
    expect(styles).toContain(".prj-col { flex: 0 0 auto; width: 100%; }");
    expect(styles).toContain('.modal-card > [data-form-view][hidden] { display: none; }');
    expect(styles).toContain("@keyframes modal-confetti-fall");
    expect(styles).toContain('.modal-success-check { width: 74px; height: 40px; }');
    expect(styles).toContain('font-size: clamp(2rem, 5vw, 2.75rem)');
  });

  it("refreshes the directory in the background without reloading the page", () => {
    const component = readFileSync(
      new URL("../src/components/ProjectDirectory.astro", import.meta.url),
      "utf8",
    );

    expect(component).toContain('fetch("/api/projects", { cache: "no-store" })');
    expect(component).toContain("window.setInterval(refreshProjects, 30_000)");
    expect(component).toContain("document.visibilityState !== \"visible\"");
  });
});
