import { DEMO_PROJECTS, acceptDemoInvitation, createDemoInvitation, getDemoInvitations, revokeDemoInvitation, updateDemoProject, updateDemoProjectStatus, type DemoProject, type DemoProjectStatus } from "../lib/accounts/demo-projects";
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
      const edit = makeButton("Editar en demo", "button button-secondary", "demo-edit", project.id);
      const invite = makeButton("Cofundadores", "button button-secondary", "demo-invite-panel", project.id);
      actions.append(edit, invite);
      if (project.status === "published") { const link = document.createElement("a"); link.className = "button button-secondary"; link.href = "/demo-cuentas/founders/lucia-demo"; link.textContent = "Ver founder"; const archive = makeButton("Archivar en demo", "button button-secondary", "demo-status", project.id); archive.dataset.demoTo = "archived"; actions.append(link, archive); }
      if (project.status === "draft") { const publish = makeButton("Publicar en demo", "button button-primary", "demo-status", project.id); publish.dataset.demoTo = "published"; actions.append(publish); }
      if (project.status === "archived") { const restore = makeButton("Restaurar en demo", "button button-secondary", "demo-status", project.id); restore.dataset.demoTo = "published"; actions.append(restore); }
      const tools = document.createElement("div"); tools.className = "project-tools"; tools.hidden = true;
      const makeField = (label: string, name: string, value: string, tag: "input" | "textarea" = "input") => {
        const wrapper = document.createElement("label"); wrapper.className = "field";
        const caption = document.createElement("span"); caption.className = "field-label"; caption.textContent = label;
        const control = document.createElement(tag); control.className = "field-input"; control.name = name; control.value = value; control.maxLength = tag === "textarea" ? 240 : 100;
        if (tag === "textarea") control.classList.add("field-area"); wrapper.append(caption, control); return wrapper;
      };
      const makeSubmit = (label: string, className: string) => { const button = document.createElement("button"); button.type = "submit"; button.className = className; button.textContent = label; return button; };
      const editForm = document.createElement("form"); editForm.className = "project-edit-form"; editForm.dataset.demoEditForm = project.id;
      const editTitle = document.createElement("h3"); editTitle.className = "aside-title"; editTitle.textContent = "Editar proyecto demo";
      const investment = document.createElement("label"); investment.className = "check"; const investmentInput = document.createElement("input"); investmentInput.type = "checkbox"; investmentInput.name = "seekingInvestment"; investmentInput.checked = project.seekingInvestment; investment.append(investmentInput, document.createTextNode(" Busca inversión"));
      editForm.append(editTitle, makeField("Nombre", "name", project.name), makeField("Descripción corta", "short", project.short, "textarea"), makeField("Sector", "sector", project.sector), makeField("Etapa", "stage", project.stage), investment, makeSubmit("Guardar cambios demo", "button button-primary"));
      const inviteForm = document.createElement("form"); inviteForm.className = "project-invite-form"; inviteForm.dataset.demoInviteForm = project.id;
      const inviteTitle = document.createElement("h3"); inviteTitle.className = "aside-title"; inviteTitle.textContent = "Invitar cofounder demo";
      const inviteHint = document.createElement("p"); inviteHint.className = "field-hint"; inviteHint.textContent = "Solo usa identidades ficticias; no se solicitan correos ni se envían invitaciones.";
      const recipient = document.createElement("select"); recipient.className = "field-input"; recipient.name = "recipient"; ["Marta Demo", "Andrés Demo"].forEach((name) => { const option = document.createElement("option"); option.value = name; option.textContent = name; recipient.append(option); });
      const recipientField = document.createElement("label"); recipientField.className = "field"; const recipientCaption = document.createElement("span"); recipientCaption.className = "field-label"; recipientCaption.textContent = "Persona demo"; recipientField.append(recipientCaption, recipient);
      const role = document.createElement("select"); role.className = "field-input"; role.name = "role"; ["Founder", "Cofounder"].forEach((name) => { const option = document.createElement("option"); option.value = name; option.textContent = name; role.append(option); });
      const roleField = document.createElement("label"); roleField.className = "field"; const roleCaption = document.createElement("span"); roleCaption.className = "field-label"; roleCaption.textContent = "Rol"; roleField.append(roleCaption, role);
      inviteForm.append(inviteTitle, inviteHint, recipientField, roleField, makeSubmit("Crear invitación demo", "button button-secondary"));
      const invitationList = document.createElement("ul"); invitationList.className = "project-invitations";
      getDemoInvitations(project.id).forEach((invitation) => { const item = document.createElement("li"); item.className = "project-invitation"; item.textContent = `${invitation.recipient} · ${invitation.role} · ${invitation.status === "accepted" ? "Aceptada" : "Pendiente"}`; if (invitation.status === "pending") { const accept = makeButton("Aceptar", "link-button", "demo-accept-invite", invitation.id); const revoke = makeButton("Revocar", "link-button", "demo-revoke-invite", invitation.id); item.append(accept, revoke); } invitationList.append(item); });
      tools.append(editForm, inviteForm); if (invitationList.children.length) tools.append(invitationList); content.append(title, description, chips, founders, actions, tools); article.append(logo, content); return article;
    };
    const render = () => {
      (["published", "draft", "archived"] as DemoProjectStatus[]).forEach((status) => { root.querySelector<HTMLElement>(`[data-demo-count="${status}"]`)!.textContent = `(${DEMO_PROJECTS.filter((project) => project.status === status).length})`; });
      root.querySelectorAll<HTMLButtonElement>("[data-demo-tab]").forEach((button) => button.setAttribute("aria-selected", String(button.dataset.demoTab === tab)));
      const projects = DEMO_PROJECTS.filter((project) => project.status === tab);
      list.replaceChildren(...(projects.length ? projects.map(card) : [emptyState()]));
    };
    root.addEventListener("click", (event) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-demo-tab], [data-demo-status], [data-demo-new], [data-demo-edit], [data-demo-invite-panel], [data-demo-accept-invite], [data-demo-revoke-invite]");
      if (!target) return;
      if (target.dataset.demoTab) tab = target.dataset.demoTab as DemoProjectStatus;
      if (target.dataset.demoStatus && target.dataset.demoTo) updateDemoProjectStatus(target.dataset.demoStatus, target.dataset.demoTo as DemoProjectStatus);
      if (target.dataset.demoNew) tab = "draft";
      if (target.dataset.demoEdit || target.dataset.demoInvitePanel) {
        const tools = target.closest<HTMLElement>(".project-row")?.querySelector<HTMLElement>(".project-tools");
        if (tools) tools.hidden = !tools.hidden;
        return;
      }
      if (target.dataset.demoAcceptInvite) acceptDemoInvitation(target.dataset.demoAcceptInvite);
      if (target.dataset.demoRevokeInvite) revokeDemoInvitation(target.dataset.demoRevokeInvite);
      render();
    });
    root.addEventListener("submit", (event) => {
      const form = (event.target as HTMLElement).closest<HTMLFormElement>("[data-demo-edit-form], [data-demo-invite-form]");
      if (!form) return;
      event.preventDefault();
      const data = new FormData(form);
      if (form.dataset.demoEditForm) updateDemoProject(form.dataset.demoEditForm, { name: String(data.get("name") ?? "").trim(), short: String(data.get("short") ?? "").trim(), sector: String(data.get("sector") ?? "").trim(), stage: String(data.get("stage") ?? "").trim(), seekingInvestment: data.has("seekingInvestment") });
      if (form.dataset.demoInviteForm) createDemoInvitation(form.dataset.demoInviteForm, String(data.get("recipient")) as "Marta Demo" | "Andrés Demo", String(data.get("role")) as "Founder" | "Cofounder");
      render();
    });
    render();
  }
}
