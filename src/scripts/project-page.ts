import { ROLE_LABEL, avatarHtml, esc, logoHtml, store } from "./accounts-client";

const root = document.querySelector<HTMLElement>("[data-project-page]")!;
const body = root.querySelector<HTMLElement>("[data-body]")!;
const slug = root.dataset.slug ?? "";

const hit = store.resolveSlug(slug);
const member = !!store.currentAccount();

function notFound() {
  body.innerHTML = `<h1 id="project-title" class="wizard-title">Proyecto no encontrado</h1>
    <p class="auth-lead">Puede que aún no esté publicado o que el enlace haya cambiado.</p>
    <a class="button button-primary" href="/proyectos">Ver el directorio</a>`;
}

if (!hit) {
  notFound();
} else if (hit.redirect) {
  location.replace(`/proyectos/${hit.project.slug}${location.search}`);
} else {
  const p = hit.project;
  const mine = store.currentAccount() && p.founders.some((f) => f.accountId === store.currentAccount()!.id);
  if (p.status !== "published" && !mine) {
    notFound();
  } else {
    document.title = `${p.name} | Asilo Builders`;
    const host = (() => { try { return new URL(p.website).hostname.replace(/^www\./, ""); } catch { return p.website; } })();
    const socials = Object.entries(p.socials).filter(([, v]) => v);
    const founders = p.founders.map((f) => {
      const view = store.publicProfile(f.accountId, member);
      if (!view) return "";
      const inner = `${avatarHtml(view.card, "avatar avatar--lg")}<span class="founder-meta"><strong>${esc(view.card.name)}</strong><small>${esc(ROLE_LABEL[f.role])}</small></span>`;
      return member
        ? `<li><a class="founder-card" href="/founders/${esc(f.accountId)}">${inner}</a></li>`
        : `<li><a class="founder-card is-locked" href="/founders/${esc(f.accountId)}" aria-label="${esc(view.card.name)}: entra para ver su perfil y contacto">${inner}<span class="lock"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>Entra para ver su perfil y contacto</span></a></li>`;
    }).join("");

    body.innerHTML = `
      <a class="back-link" href="/proyectos">← Directorio de proyectos</a>
      ${p.status !== "published" ? `<p class="mock-note" role="note">${p.status === "draft" ? "Borrador" : "Archivado"}: solo lo ves tú.</p>` : ""}
      <header class="project-head">
        ${logoHtml(p, "project-logo project-logo--lg")}
        <div>
          <h1 id="project-title" class="wizard-title">${esc(p.name)}</h1>
          <p class="chips"><span class="chip chip--stage">${esc(p.stage)}</span><span class="chip">${esc(p.sector)}</span>${p.seekingInvestment ? '<span class="chip">Busca inversión</span>' : ""}${p.city ? `<span class="chip">${esc(p.city)}</span>` : ""}</p>
        </div>
      </header>
      <p class="project-lead">${esc(p.short)}</p>
      ${p.long ? `<p class="project-long">${esc(p.long)}</p>` : ""}
      <div class="project-links">
        <a class="button button-primary" href="${esc(p.website)}" target="_blank" rel="noopener noreferrer">Visitar ${esc(host)}</a>
        ${socials.map(([k, v]) => `<a class="button button-secondary" href="${esc(/^https?:/.test(v) ? v : "#")}" target="_blank" rel="noopener noreferrer">${esc(k.charAt(0).toUpperCase() + k.slice(1))}</a>`).join("")}
      </div>
      <h2 class="aside-title">Fundadores</h2>
      <ul class="founder-cards">${founders}</ul>`;
  }
}
