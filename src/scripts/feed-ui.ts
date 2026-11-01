/** Rendering and actions for feed posts, shared by the feed and the post page. */
import { timeAgo } from "../lib/accounts/format";
import { segments, type LinkPreview } from "../lib/accounts/link-preview";
import type { PostView } from "../lib/accounts/store";
import { COMMENT_MAX, POST_MAX, REACTIONS } from "../lib/accounts/types";
import { avatarHtml, clearErrors, esc, logoHtml, readImage, setFieldError, store, toast } from "./accounts-client";

const ICON_COMMENT = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5h-7l-4.5 3.5V16.5H5A1.5 1.5 0 0 1 3.5 15V7A1.5 1.5 0 0 1 5 5.5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" /></svg>`;
const ICON_LINK = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>`;
const ICON_IMAGE = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="3" y="4.5" width="18" height="15" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.6" /><circle cx="9" cy="10" r="1.6" fill="none" stroke="currentColor" stroke-width="1.6" /><path d="m4 17 5-4.5 3.5 3L16 12l4 4.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>`;

/** Escaped text with its links made clickable. */
export function textHtml(text: string): string {
  return segments(text).map((s) => s.type === "link"
    ? `<a href="${esc(s.href)}" target="_blank" rel="noopener noreferrer">${esc(s.value)}</a>`
    : esc(s.value)).join("");
}

/** Card for the first website in the text (title, description, favicon letter). */
export function previewHtml(p: LinkPreview, label = ""): string {
  return `<a class="link-card" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">
    <span class="link-card-icon" aria-hidden="true">${esc(p.host.charAt(0).toUpperCase())}</span>
    <span class="link-card-body"><small>${esc(label || p.host)}</small><strong>${esc(p.title)}</strong><span>${esc(p.description)}</span></span></a>`;
}

export function postHtml(v: PostView, opts: { detail?: boolean } = {}): string {
  const { post, project, author } = v;
  const reacted = REACTIONS.map((r) => {
    const n = v.counts[r.kind] ?? 0;
    return `<button class="reaction" type="button" data-react="${r.kind}" aria-pressed="${v.mine === r.kind}" aria-label="${esc(r.label)}${n ? `: ${n}` : ""}"><span aria-hidden="true">${r.emoji}</span>${n ? `<small>${n}</small>` : ""}</button>`;
  }).join("");
  const menu = v.canEdit
    ? `<button type="button" data-edit>Editar</button><button type="button" data-delete>Borrar</button>`
    : v.reported ? `<span class="menu-note">Ya la reportaste</span>` : `<button type="button" data-report>Reportar</button>`;
  return `<article class="post" data-post="${esc(post.id)}" aria-label="Anuncio de ${esc(author.name)}">
    <header class="post-head">
      <a href="/founders/${esc(author.id)}" aria-hidden="true" tabindex="-1">${avatarHtml(author, "avatar avatar--md")}</a>
      <div class="post-who">
        <a class="post-project" href="/founders/${esc(author.id)}">${esc(author.name)}</a>
        <p class="post-meta">${project ? `<a href="/proyectos/${esc(project.slug)}">${esc(project.name)}</a>` : "Proyecto eliminado"} · <time datetime="${new Date(post.createdAt).toISOString()}">${esc(timeAgo(post.createdAt))}</time>${post.editedAt ? " · editado" : ""}</p>
      </div>
      <details class="post-menu"><summary aria-label="Más opciones"><span aria-hidden="true">⋯</span></summary><div class="post-menu-panel">${menu}</div></details>
    </header>
    <div class="post-body" data-body>
      <p class="post-text">${textHtml(post.text)}</p>
      ${post.preview ? previewHtml(post.preview) : ""}
      ${post.image ? `<img class="post-image" src="${esc(post.image)}" alt="Imagen del anuncio" loading="lazy" />` : ""}
    </div>
    <footer class="post-foot">
      <div class="reactions" role="group" aria-label="Reacciones">${reacted}</div>
      <div class="post-actions">
        ${opts.detail
          ? `<span class="post-action" aria-label="${v.commentCount} comentario${v.commentCount === 1 ? "" : "s"}">${ICON_COMMENT}<span>${v.commentCount}</span></span>`
          : `<a class="post-action" href="/anuncios/${esc(post.id)}" aria-label="${v.commentCount} comentario${v.commentCount === 1 ? "" : "s"}. Abrir anuncio">${ICON_COMMENT}<span>${v.commentCount}</span></a>`}
        <button class="post-action" type="button" data-share aria-label="Copiar enlace al anuncio" title="Copiar enlace">${ICON_LINK}</button>
      </div>
    </footer>
  </article>`;
}

export type PostEvents = { onRemoved?: (id: string) => void };

/** Wires every post action by delegation. Re-renders the touched post from the store. */
export function bindPosts(container: HTMLElement, events: PostEvents = {}, detail = false): void {
  const redraw = (id: string) => {
    const el = container.querySelector<HTMLElement>(`[data-post="${CSS.escape(id)}"]`);
    const v = store.getPost(id);
    if (!el) return;
    if (!v) { el.remove(); events.onRemoved?.(id); return; }
    el.outerHTML = postHtml(v, { detail });
  };

  container.addEventListener("click", async (e) => {
    const target = e.target as HTMLElement;
    const btn = target.closest<HTMLElement>("button");
    const article = target.closest<HTMLElement>("[data-post]");
    if (!btn || !article) return;
    const id = article.dataset.post!;

    if (btn.dataset.react) {
      const r = store.react(id, btn.dataset.react as never);
      if (!r.ok) return toast(r.error);
      redraw(id);
      container.querySelector<HTMLElement>(`[data-post="${CSS.escape(id)}"] [data-react="${btn.dataset.react}"]`)?.focus();
    } else if (btn.dataset.share !== undefined) {
      const url = new URL(`/anuncios/${id}`, location.origin).href;
      try { await navigator.clipboard.writeText(url); toast("Enlace copiado."); } catch { window.prompt("Copia el enlace:", url); }
    } else if (btn.dataset.delete !== undefined) {
      if (!window.confirm("¿Borrar este anuncio? No se puede deshacer.")) return;
      const r = store.deletePost(id);
      if (!r.ok) return toast(r.error);
      article.remove();
      events.onRemoved?.(id);
      toast("Anuncio borrado.");
    } else if (btn.dataset.report !== undefined) {
      const r = store.reportPost(id);
      toast(r.ok ? "Gracias. El equipo de Asilo la revisará." : r.error);
      if (r.ok) redraw(id);
    } else if (btn.dataset.edit !== undefined) {
      startEdit(article, id);
    }
  });

  function startEdit(article: HTMLElement, id: string) {
    const v = store.getPost(id);
    if (!v) return;
    article.querySelector<HTMLDetailsElement>(".post-menu")!.open = false;
    const body = article.querySelector<HTMLElement>("[data-body]")!;
    let image: string | null | undefined;
    body.innerHTML = `<form class="post-edit" novalidate>
      <label class="field" data-field="text"><span class="field-label">Editar anuncio</span>
        <textarea class="field-input field-area" name="text" rows="4" maxlength="${POST_MAX}">${esc(v.post.text)}</textarea><p class="field-error" data-error hidden></p></label>
      <div class="edit-image">${v.post.image ? `<img class="post-image" src="${esc(v.post.image)}" alt="" data-edit-image /><button class="link-button" type="button" data-remove-image>Quitar imagen</button>` : ""}
        <label class="icon-button icon-button--labeled" title="${v.post.image ? "Cambiar imagen" : "Añadir imagen"}">${ICON_IMAGE}<span>${v.post.image ? "Cambiar imagen" : "Añadir imagen"}</span><input class="logo-upload-input" type="file" name="image" accept="image/png,image/jpeg,image/webp" /></label></div>
      <p class="field-error form-error" data-form-error role="alert" hidden></p>
      <div class="step-actions"><button class="button button-secondary" type="button" data-cancel>Cancelar</button><button class="button button-primary" type="submit">Guardar</button></div></form>`;
    const form = body.querySelector<HTMLFormElement>("form")!;
    (form.elements.namedItem("text") as HTMLTextAreaElement).focus();
    form.querySelector("[data-cancel]")!.addEventListener("click", () => redraw(id));
    form.querySelector("[data-remove-image]")?.addEventListener("click", () => { image = null; form.querySelector("[data-edit-image]")?.remove(); form.querySelector("[data-remove-image]")?.remove(); });
    form.querySelector<HTMLInputElement>('[name="image"]')!.addEventListener("change", async (ev) => {
      const file = (ev.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try { image = await readImage(file); toast("Imagen lista."); } catch (err) { setFieldError(form, undefined, (err as Error).message); }
    });
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      clearErrors(form);
      const r = store.updatePost(id, { text: (form.elements.namedItem("text") as HTMLTextAreaElement).value, image });
      if (!r.ok) return setFieldError(form, r.field, r.error);
      redraw(id);
    });
  }

  document.addEventListener("click", (e) => {
    container.querySelectorAll<HTMLDetailsElement>(".post-menu[open]").forEach((m) => { if (!m.contains(e.target as Node)) m.open = false; });
  });
}

export { avatarHtml, COMMENT_MAX };
