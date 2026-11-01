import { ROLE_LABEL, avatarHtml, esc, logoHtml, showGate, store } from "./accounts-client";

const root = document.querySelector<HTMLElement>("[data-founder-profile]")!;
const body = root.querySelector<HTMLElement>("[data-body]")!;
const LABEL: Record<string, string> = { phone: "Teléfono / WhatsApp", contactEmail: "Correo de contacto", linkedin: "LinkedIn", x: "X" };

if (!store.currentAccount()) {
  showGate(root);
} else {
  const view = store.publicProfile(root.dataset.id ?? "", true);
  body.hidden = false;
  if (!view || !view.profile) {
    body.innerHTML = `<h1 id="founder-title" class="wizard-title">Perfil no encontrado</h1><a class="button button-primary" href="/proyectos">Ver proyectos</a>`;
  } else {
    const { card, profile } = view;
    document.title = `${card.name} | Asilo Builders`;
    const contact = profile.contacts.map((c) => {
      const href = c.key === "phone" ? `tel:${c.value.replace(/\s+/g, "")}` : c.key === "contactEmail" ? `mailto:${c.value}` : c.value;
      const safe = /^(tel:|mailto:|https?:\/\/)/.test(href) ? href : "";
      return `<li><span>${esc(LABEL[c.key])}</span>${safe ? `<a href="${esc(safe)}" ${c.key === "linkedin" || c.key === "x" ? 'target="_blank" rel="noopener noreferrer"' : ""}>${esc(c.value)}</a>` : esc(c.value)}</li>`;
    }).join("");
    body.innerHTML = `
      <header class="project-head">
        ${avatarHtml(card, "avatar avatar--xl")}
        <div><h1 id="founder-title" class="wizard-title">${esc(card.name)}</h1>
        <p class="field-hint">${esc(ROLE_LABEL[profile.role] ?? "")}${profile.city ? ` · ${esc(profile.city)}${profile.country ? `, ${esc(profile.country)}` : ""}` : ""}</p></div>
      </header>
      ${profile.bio ? `<p class="project-lead">${esc(profile.bio)}</p>` : ""}
      <h2 class="aside-title">Contacto</h2>
      ${contact ? `<ul class="contact-list">${contact}</ul>` : '<p class="field-hint">Esta persona no publicó datos de contacto.</p>'}
      <h2 class="aside-title">Proyectos</h2>
      ${profile.projects.length ? `<ul class="project-mini">${profile.projects.map((p) => `<li><a href="/proyectos/${esc(p.slug)}">${logoHtml(p, "project-logo project-logo--sm")}<span><strong>${esc(p.name)}</strong><small>${esc(p.stage)}</small></span></a></li>`).join("")}</ul>` : '<p class="field-hint">Aún no participa en proyectos publicados.</p>'}`;
  }
}
