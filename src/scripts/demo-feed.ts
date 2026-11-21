import { createDemoFeed, type DemoReaction } from "../lib/accounts/demo-feed";
import { getPublishedDemoProjects } from "../lib/accounts/demo-projects";
import { createDemoSession } from "../lib/accounts/demo-session";

const session = createDemoSession();
const feed = createDemoFeed();
const esc = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
const notify = (message: string) => { const toast = document.querySelector<HTMLElement>("[data-demo-toast]"); if (toast) { toast.textContent = message; toast.hidden = false; setTimeout(() => { toast.hidden = true; }, 2200); } };
const previewHtml = (post: ReturnType<typeof feed.posts>[number]) => post.preview ? `<a class="link-card" href="${esc(post.preview.url)}" target="_blank" rel="noopener noreferrer"><strong>${esc(post.preview.title)}</strong><span>${esc(post.preview.description)}</span></a>` : "";
const fragment = (html: string) => document.createRange().createContextualFragment(html);
function renderPost(post: ReturnType<typeof feed.posts>[number], detail = false) {
  const reactions = (["like", "love", "rocket", "clap"] as DemoReaction[]).map((kind) => `<button class="reaction" type="button" data-reaction="${kind}" aria-pressed="${post.mine === kind}">${({ like: "👍", love: "❤️", rocket: "🚀", clap: "👏" })[kind]} <small>${post.reactions[kind] ?? 0}</small></button>`).join("");
  const own = post.author === "Lucía Demo" ? `<button type="button" data-delete>Borrar anuncio</button>` : "<button type=\"button\" data-report>Reportar anuncio</button>";
  return `<article class="post" data-post-id="${esc(post.id)}"><header class="post-head"><span class="avatar avatar--md" aria-hidden="true">${esc(post.author.slice(0, 2).toUpperCase())}</span><div class="post-who"><strong>${esc(post.author)}</strong><p class="post-meta">publicó en <strong>${esc(post.project)}</strong> · ${esc(post.createdAt)}</p></div><details class="post-menu"><summary aria-label="Más acciones">⋯</summary><div class="post-menu-panel">${own}</div></details></header><p class="post-text">${esc(post.text)}</p>${post.image ? `<img class="post-image" src="${esc(post.image)}" alt="Vista previa de la imagen" />` : ""}${previewHtml(post)}<footer class="post-foot"><div class="reactions">${reactions}</div><button class="post-action" type="button" data-comments>💬 ${post.comments.length}</button><a class="post-action" href="/demo-cuentas/anuncios/${esc(post.id)}">${detail ? "Enlace permanente" : "Ver anuncio"}</a></footer></article>`;
}

const root = document.querySelector<HTMLElement>("[data-demo-feed]");
if (root) {
  const signedIn = session.isSignedIn();
  root.querySelector<HTMLElement>("[data-demo-gate]")!.hidden = signedIn;
  const body = root.querySelector<HTMLElement>("[data-demo-body]")!;
  body.hidden = !signedIn;
  if (signedIn) {
    const list = root.querySelector<HTMLElement>("[data-demo-list]")!;
    let cursor: number | null = null;
    const render = (append = false) => { const page = feed.feedPage(append ? cursor : null, 2); cursor = page.nextCursor; const html = page.posts.map((post) => renderPost(post)).join(""); if (append) list.append(fragment(html)); else list.replaceChildren(fragment(html)); if (!list.children.length) { const empty = document.createElement("div"); empty.className = "empty"; empty.textContent = "No hay anuncios visibles en esta demo."; list.replaceChildren(empty); } more.hidden = cursor === null; };
    const more = document.createElement("button"); more.type = "button"; more.className = "button button-secondary feed-more"; more.textContent = "Cargar más anuncios"; list.after(more); more.addEventListener("click", () => render(true));
    const projects = getPublishedDemoProjects().filter((project) => project.founders.includes("Lucía Demo"));
    const projectSelect = root.querySelector<HTMLSelectElement>("[data-demo-project]")!;
    projectSelect.replaceChildren(...projects.map((project) => { const option = document.createElement("option"); option.value = project.id; option.textContent = project.name; return option; }));
    let image: string | null = null;
    const imageInput = root.querySelector<HTMLInputElement>('input[name="image"]')!;
    imageInput.addEventListener("change", () => { const file = imageInput.files?.[0]; if (!file) return; const reader = new FileReader(); reader.addEventListener("load", () => { image = typeof reader.result === "string" ? reader.result : null; const preview = root.querySelector<HTMLElement>("[data-demo-image-preview]")!; preview.replaceChildren(); if (image) { const img = document.createElement("img"); img.className = "composer-image-img"; img.src = image; img.alt = "Vista previa"; preview.append(img); } }); reader.readAsDataURL(file); });
    root.addEventListener("click", (event) => { const target = (event.target as HTMLElement).closest<HTMLElement>("[data-reaction], [data-report], [data-delete]"); const card = (event.target as HTMLElement).closest<HTMLElement>("[data-post-id]"); if (!target || !card) return; const id = card.dataset.postId!; if (target.dataset.reaction) { feed.react(id, target.dataset.reaction as DemoReaction); render(); notify("Reacción actualizada en la demo."); } else if (target.dataset.delete) { if (!window.confirm("¿Borrar este anuncio? Solo desaparecerá de esta demo.")) return; const outcome = feed.delete(id); if (outcome.ok) { render(); notify("Anuncio borrado solo en memoria."); } } else if (target.dataset.report !== undefined) { feed.report(id); notify("Reporte registrado solo en memoria."); } });
    root.querySelector<HTMLFormElement>("[data-composer]")?.addEventListener("submit", (event) => { event.preventDefault(); const form = event.currentTarget as HTMLFormElement; const outcome = feed.createPost(String(new FormData(form).get("project")), { text: String(new FormData(form).get("text") ?? ""), image }); if (!outcome.ok) return notify(outcome.error); image = null; form.reset(); root.querySelector<HTMLElement>("[data-demo-image-preview]")!.replaceChildren(); cursor = null; render(); notify("Anuncio publicado solo en memoria."); });
    render();
  }
}

const reveal = (container: HTMLElement, gateSelector: string, bodySelector: string) => { if (!session.isSignedIn()) return; container.querySelector<HTMLElement>(gateSelector)?.setAttribute("hidden", "true"); const body = container.querySelector<HTMLElement>(bodySelector); if (body) body.hidden = false; };
const moderation = document.querySelector<HTMLElement>("[data-demo-moderation]");
if (moderation) { reveal(moderation, "[data-demo-gate]", "[data-demo-moderation-body]"); if (session.isSignedIn()) moderation.querySelectorAll<HTMLButtonElement>("[data-demo-resolve]").forEach((button) => button.addEventListener("click", () => { button.closest<HTMLElement>("[data-demo-report]")?.remove(); notify("Reporte resuelto solo en memoria."); })); }
const detail = document.querySelector<HTMLElement>("[data-demo-detail]");
if (detail) { reveal(detail, "[data-demo-gate]", "[data-demo-detail-body]"); if (session.isSignedIn()) { const post = feed.post(detail.dataset.postId ?? ""); const body = detail.querySelector<HTMLElement>("[data-demo-detail-body]")!; if (!post) { const heading = document.createElement("h1"); heading.className = "wizard-title"; heading.textContent = "Anuncio no disponible"; const link = document.createElement("a"); link.className = "button button-secondary"; link.href = "/demo-cuentas/anuncios"; link.textContent = "Volver a anuncios"; body.replaceChildren(heading, link); } else { body.querySelector<HTMLElement>("[data-demo-post]")!.replaceChildren(fragment(renderPost(post, true))); body.querySelector<HTMLFormElement>("[data-demo-comment]")?.addEventListener("submit", (event) => { event.preventDefault(); const form = event.currentTarget as HTMLFormElement; const outcome = feed.comment(post.id, String(new FormData(form).get("text") ?? "")); const error = body.querySelector<HTMLElement>("[data-demo-error]")!; error.textContent = outcome.ok ? "Comentario agregado a esta demo." : outcome.error; error.hidden = false; if (outcome.ok) form.reset(); }); } } }
const notices = document.querySelector<HTMLElement>("[data-demo-notifications]");
if (notices && session.isSignedIn()) { notices.querySelector<HTMLElement>("[data-demo-gate]")!.hidden = true; notices.querySelector<HTMLElement>("[data-demo-notifications-body]")!.hidden = false; const list = notices.querySelector<HTMLElement>("[data-demo-notification-list]")!; list.replaceChildren(); const notifications = feed.notifications(); if (notifications.length) notifications.forEach((kind) => { const item = document.createElement("li"); item.className = "notice is-unread"; item.textContent = `Lucía Demo recibió una ${kind} en un anuncio · Ahora · simulada`; list.append(item); }); else { const empty = document.createElement("li"); empty.className = "empty"; empty.textContent = "Todavía no tienes notificaciones. Las reacciones y comentarios de esta demo se mantienen en memoria."; list.append(empty); } }
