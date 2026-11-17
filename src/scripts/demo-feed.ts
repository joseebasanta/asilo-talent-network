import { createDemoFeed, type DemoReaction } from "../lib/accounts/demo-feed";
import { createDemoSession } from "../lib/accounts/demo-session";

const session = createDemoSession();
const root = document.querySelector<HTMLElement>("[data-demo-feed]");
const feed = createDemoFeed();
const esc = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
const notify = (message: string) => { const toast = document.querySelector<HTMLElement>("[data-demo-toast]"); if (toast) { toast.textContent = message; toast.hidden = false; setTimeout(() => { toast.hidden = true; }, 2200); } };

function renderPost(post: ReturnType<typeof feed.posts>[number], detail = false) {
  const reactions = (["like", "love", "rocket", "clap"] as DemoReaction[]).map((kind) => `<button class="reaction" type="button" data-reaction="${kind}" aria-pressed="${post.mine === kind}">${({ like: "👍", love: "❤️", rocket: "🚀", clap: "👏" })[kind]} <small>${post.reactions[kind] ?? 0}</small></button>`).join("");
  return `<article class="post" data-post-id="${esc(post.id)}"><header class="post-head"><span class="avatar avatar--md" aria-hidden="true">${esc(post.author.slice(0, 2).toUpperCase())}</span><div class="post-who"><strong>${esc(post.author)}</strong><p class="post-meta">publicó en <strong>${esc(post.project)}</strong> · ${esc(post.createdAt)}</p></div><details class="post-menu"><summary aria-label="Más acciones">⋯</summary><div class="post-menu-panel"><button type="button" data-report>Reportar anuncio</button></div></details></header><p class="post-text">${esc(post.text)}</p><footer class="post-foot"><div class="reactions">${reactions}</div><button class="post-action" type="button" data-comments>💬 ${post.comments.length}</button><a class="post-action" href="/demo-cuentas/anuncios/${esc(post.id)}">${detail ? "Enlace permanente" : "Ver anuncio"}</a></footer></article>`;
}

if (root) {
  const signedIn = session.isSignedIn();
  root.querySelector<HTMLElement>("[data-demo-gate]")!.hidden = signedIn;
  const body = root.querySelector<HTMLElement>("[data-demo-body]")!;
  body.hidden = !signedIn;
  const list = root.querySelector<HTMLElement>("[data-demo-list]")!;
  const render = () => { list.innerHTML = feed.posts().map((post) => renderPost(post)).join(""); if (!list.innerHTML) list.innerHTML = '<div class="empty"><p>No hay anuncios visibles en esta demo.</p></div>'; };
  if (signedIn) {
    render();
    root.addEventListener("click", (event) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-reaction], [data-report]");
      const card = (event.target as HTMLElement).closest<HTMLElement>("[data-post-id]");
      if (!target || !card) return;
      const id = card.dataset.postId!;
      if (target.dataset.reaction) { feed.react(id, target.dataset.reaction as DemoReaction); render(); notify("Reacción actualizada en la demo."); }
      if (target.dataset.report !== undefined) { feed.report(id); notify("Reporte registrado solo en memoria."); }
    });
    root.querySelector<HTMLFormElement>("[data-composer]")?.addEventListener("submit", (event) => { event.preventDefault(); const form = event.currentTarget as HTMLFormElement; const text = String(new FormData(form).get("text") ?? "").trim(); if (!text) return; notify("Publicar está simulado en esta demo."); form.reset(); });
  }
}

const moderation = document.querySelector<HTMLElement>("[data-demo-moderation]");
if (moderation && session.isSignedIn()) {
  moderation.querySelectorAll<HTMLButtonElement>("[data-demo-resolve]").forEach((button) => button.addEventListener("click", () => { button.closest<HTMLElement>("[data-demo-report]")?.remove(); notify("Reporte resuelto solo en memoria."); }));
}

const detail = document.querySelector<HTMLElement>("[data-demo-detail]");
if (detail && session.isSignedIn()) {
  const post = feed.post(detail.dataset.postId ?? "");
  const body = detail.querySelector<HTMLElement>("[data-demo-detail-body]")!;
  body.hidden = false;
  if (!post) body.innerHTML = '<h1 class="wizard-title">Anuncio no disponible</h1><a class="button button-secondary" href="/demo-cuentas/anuncios">Volver a anuncios</a>';
  else {
    body.querySelector<HTMLElement>("[data-demo-post]")!.innerHTML = renderPost(post, true);
    body.querySelector<HTMLFormElement>("[data-demo-comment]")?.addEventListener("submit", (event) => { event.preventDefault(); const form = event.currentTarget as HTMLFormElement; const outcome = feed.comment(post.id, String(new FormData(form).get("text") ?? "")); const error = body.querySelector<HTMLElement>("[data-demo-error]")!; error.textContent = outcome.ok ? "Comentario agregado a esta demo." : outcome.error; error.hidden = false; if (outcome.ok) form.reset(); });
  }
}

const notices = document.querySelector<HTMLElement>("[data-demo-notifications]");
if (notices && session.isSignedIn()) { notices.querySelector<HTMLElement>("[data-demo-gate]")!.hidden = true; notices.querySelector<HTMLElement>("[data-demo-notifications-body]")!.hidden = false; notices.querySelector<HTMLElement>("[data-demo-notification-list]")!.innerHTML = feed.notifications().length ? feed.notifications().map((kind) => `<li class="notice is-unread"><span class="notice-dot"></span><span><strong>Lucía Demo</strong> recibió una ${kind} en un anuncio<small>Ahora · simulada</small></span></li>`).join("") : '<li class="empty"><p>Todavía no tienes notificaciones.</p><p class="field-hint">Las reacciones y comentarios de esta demo se mantienen en memoria.</p></li>'; }
