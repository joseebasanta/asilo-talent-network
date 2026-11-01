import type { Project, ProjectStatus } from "../lib/accounts/types";
import { ROLE_LABEL, WHATSAPP_GROUP_URL, avatarHtml, esc, logoHtml, showGate, store } from "./accounts-client";

const root = document.querySelector<HTMLElement>("[data-my-projects]")!;
const me = store.currentAccount();

if (!me) {
  showGate(root);
} else {
  const panel = root.querySelector<HTMLElement>("[data-panel]")!;
  panel.hidden = false;
  root.querySelector("[data-greeting]")!.textContent = `Hola, ${me.name.split(" ")[0]}`;
  let tab: ProjectStatus = "published";

  const card = (p: Project) => {
    const admin = store.isAdmin(p);
    const mine = p.founders.find((f) => f.accountId === me.id);
    const founders = p.founders.map((f) => store.getAccount(f.accountId)).filter(Boolean);
    const pending = store.invitationsFor(p.id).filter((i) => i.status === "pending").length;
    return `<article class="project-row">
      ${logoHtml(p)}
      <div class="project-row-body">
        <h2 class="project-row-title">${esc(p.name)}</h2>
        <p class="project-row-desc">${esc(p.short)}</p>
        <p class="chips"><span class="chip chip--stage">${esc(p.stage)}</span><span class="chip">${esc(p.sector)}</span>${p.seekingInvestment ? '<span class="chip">Busca inversión</span>' : ""}<span class="chip">${esc(ROLE_LABEL[mine?.role ?? "founder"])}${admin ? " · Admin" : ""}</span></p>
        <p class="project-row-people">${founders.map((f) => avatarHtml(f!, "avatar avatar--sm")).join("")}${pending ? `<small>${pending} invitación(es) pendiente(s)</small>` : ""}</p>
        <div class="row-actions">
          ${p.status === "published" ? `<a class="button button-secondary" href="/proyectos/${esc(p.slug)}">Ver página</a><a class="button button-secondary" href="/anuncios?proyecto=${esc(p.id)}">Publicar un anuncio</a>` : ""}
          <a class="button button-secondary" href="/onboarding?proyecto=${esc(p.id)}">Editar</a>
          <a class="button button-secondary" href="/onboarding?proyecto=${esc(p.id)}&paso=founders">Cofundadores</a>
          ${p.status === "published" ? `<a class="button button-secondary" href="/perfil?promocion=${esc(p.id)}#promociones">Promocionar</a>` : ""}
          ${admin && p.status === "draft" ? `<button class="button button-primary" type="button" data-set="${esc(p.id)}" data-to="published">Publicar</button>` : ""}
          ${admin && p.status === "published" ? `<button class="button button-secondary" type="button" data-set="${esc(p.id)}" data-to="archived">Archivar</button>` : ""}
          ${admin && p.status === "archived" ? `<button class="button button-secondary" type="button" data-set="${esc(p.id)}" data-to="published">Restaurar</button>` : ""}
        </div>
      </div></article>`;
  };

  const emptyText: Record<ProjectStatus, string> = {
    published: "Aún no tienes proyectos publicados.",
    draft: "No tienes borradores.",
    archived: "No tienes proyectos archivados.",
  };

  function render() {
    store.refresh();
    (["published", "draft", "archived"] as const).forEach((s) => {
      const n = store.myProjects(s).length;
      root.querySelector(`[data-count="${s}"]`)!.textContent = n ? `(${n})` : "";
    });
    root.querySelectorAll<HTMLElement>("[data-tab]").forEach((t) => t.setAttribute("aria-selected", String(t.dataset.tab === tab)));
    const list = store.myProjects(tab);
    const total = store.myProjects().length;
    root.querySelector("[data-list]")!.innerHTML = list.length
      ? list.map(card).join("")
      : `<div class="empty"><p>${emptyText[tab]}</p>${total === 0 ? '<p class="field-hint">Registra tu primer proyecto para que aparezca aquí con su etapa y su página pública.</p>' : ""}<a class="button button-primary" href="/onboarding?origen=proyecto">Registrar proyecto</a></div>`;

    const profileDone = !!(me!.bio && me!.city && me!.role);
    const hasContact = Object.values(me!.contacts).some((c) => c.value);
    root.querySelector("[data-profile-card]")!.innerHTML = `
      <div class="aside-person">${avatarHtml(me!)}<div><strong>${esc(me!.name)}</strong><small>${esc(ROLE_LABEL[me!.role] ?? "")}${me!.city ? ` · ${esc(me!.city)}` : ""}</small></div></div>
      <p class="field-hint">${profileDone && hasContact ? "Tu perfil de founder está completo." : "Completa tu perfil de founder: bio, foto y contacto para que te encuentren."}</p>
      <a class="button button-secondary" href="/perfil">${profileDone && hasContact ? "Editar perfil" : "Completar perfil"}</a>`;
    const wa = root.querySelector<HTMLElement>("[data-whatsapp-card]")!;
    wa.hidden = me!.inWhatsappGroup;
    wa.querySelector<HTMLAnchorElement>("[data-whatsapp-link]")!.href = WHATSAPP_GROUP_URL;
  }

  root.addEventListener("click", (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>("button");
    if (!t) return;
    if (t.dataset.tab) { tab = t.dataset.tab as ProjectStatus; render(); }
    if (t.dataset.set) { store.setStatus(t.dataset.set, t.dataset.to as ProjectStatus); render(); }
  });
  render();
}
