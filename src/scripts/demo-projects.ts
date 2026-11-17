import { DEMO_PROJECTS, updateDemoProjectStatus, type DemoProject, type DemoProjectStatus } from "../lib/accounts/demo-projects";
import { createDemoSession } from "../lib/accounts/demo-session";

const root = document.querySelector<HTMLElement>("[data-demo-projects]");
if (root) {
  const session = createDemoSession();
  const signedIn = session.isSignedIn();
  root.querySelector<HTMLElement>("[data-demo-gate]")!.hidden = signedIn;
  const body = root.querySelector<HTMLElement>("[data-demo-projects-body]")!;
  body.hidden = !signedIn;
  if (signedIn) {
    root.querySelector<HTMLElement>("[data-demo-greeting]")!.textContent = "Hola, Lucía";
    let tab: DemoProjectStatus = "published";
    const list = root.querySelector<HTMLElement>("[data-demo-project-list]")!;
    const makeButton = (label: string, className: string, action: string, id?: string) => {
      const element = document.createElement("button"); element.type = "button"; element.className = className; element.textContent = label; element.dataset[action] = id ?? ""; return element;
    };
    const emptyState = () => {
      const empty = document.createElement("div"); empty.className = "empty";
      const text = document.createElement("p"); text.textContent = `No tienes proyectos ${tab === "draft" ? "en borrador" : tab === "archived" ? "archivados" : "publicados"}.`;
      empty.append(text, makeButton("Registrar proyecto de muestra", "button button-primary", "demo-new")); return empty;
    };
    const card = (project: DemoProject) => {
      const article = document.createElement("article"); article.className = "project-row";
      const logo = document.createElement("span"); logo.className = "project-logo"; logo.textContent = project.name.charAt(0);
      const content = document.createElement("div"); content.className = "project-row-body";
      const title = document.createElement("h2"); title.className = "project-row-title"; title.textContent = project.name;
      const description = document.createElement("p"); description.className = "project-row-desc"; description.textContent = project.short;
      const chips = document.createElement("p"); chips.className = "chips";
      [project.stage, project.sector, ...(project.seekingInvestment ? ["Busca inversión"] : [])].forEach((label, index) => { const chip = document.createElement("span"); chip.className = index === 0 ? "chip chip--stage" : "chip"; chip.textContent = label; chips.append(chip); });
      const founders = document.createElement("p"); founders.className = "project-row-people"; founders.textContent = project.founders.join(" · ");
      const actions = document.createElement("div"); actions.className = "row-actions";
      if (project.status === "published") { const link = document.createElement("a"); link.className = "button button-secondary"; link.href = "/demo-cuentas/founders/lucia-demo"; link.textContent = "Ver founder"; const archive = makeButton("Archivar en demo", "button button-secondary", "demo-status", project.id); archive.dataset.demoTo = "archived"; actions.append(link, archive); }
      if (project.status === "draft") { const publish = makeButton("Publicar en demo", "button button-primary", "demo-status", project.id); publish.dataset.demoTo = "published"; actions.append(publish); }
      if (project.status === "archived") { const restore = makeButton("Restaurar en demo", "button button-secondary", "demo-status", project.id); restore.dataset.demoTo = "published"; actions.append(restore); }
      content.append(title, description, chips, founders, actions); article.append(logo, content); return article;
    };
    const render = () => {
      (["published", "draft", "archived"] as DemoProjectStatus[]).forEach((status) => { root.querySelector<HTMLElement>(`[data-demo-count="${status}"]`)!.textContent = `(${DEMO_PROJECTS.filter((project) => project.status === status).length})`; });
      root.querySelectorAll<HTMLButtonElement>("[data-demo-tab]").forEach((button) => button.setAttribute("aria-selected", String(button.dataset.demoTab === tab)));
      const projects = DEMO_PROJECTS.filter((project) => project.status === tab);
      list.replaceChildren(...(projects.length ? projects.map(card) : [emptyState()]));
    };
    root.addEventListener("click", (event) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-demo-tab], [data-demo-status], [data-demo-new]");
      if (!target) return;
      if (target.dataset.demoTab) tab = target.dataset.demoTab as DemoProjectStatus;
      if (target.dataset.demoStatus && target.dataset.demoTo) updateDemoProjectStatus(target.dataset.demoStatus, target.dataset.demoTo as DemoProjectStatus);
      if (target.dataset.demoNew) tab = "draft";
      render();
    });
    render();
  }
}
