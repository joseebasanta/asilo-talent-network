import { COMMENT_MAX } from "../lib/accounts/types";
import { timeAgo } from "../lib/accounts/format";
import { avatarHtml, clearErrors, esc, requireSession, setFieldError, store, toast } from "./accounts-client";
import { bindPosts, postHtml } from "./feed-ui";

const me = requireSession();
const root = document.querySelector<HTMLElement>("[data-post-detail]")!;

if (me) {
  const id = root.dataset.id ?? "";
  const body = root.querySelector<HTMLElement>("[data-body]")!;
  body.hidden = false;
  const view = store.getPost(id);

  if (!view) {
    body.innerHTML = `<h1 class="wizard-title">Anuncio no disponible</h1><p class="auth-lead">Puede que lo hayan borrado o que el equipo lo haya ocultado.</p><a class="button button-primary" href="/anuncios">Volver a anuncios</a>`;
  } else {
    document.title = `Anuncio de ${view.author.name} | Asilo Builders`;
    const postBox = root.querySelector<HTMLElement>("[data-post]")!;
    const commentsBox = root.querySelector<HTMLElement>("[data-comments]")!;
    const form = root.querySelector<HTMLFormElement>("[data-comment-form]")!;
    const text = form.elements.namedItem("text") as HTMLTextAreaElement;
    text.maxLength = COMMENT_MAX;

    const drawPost = () => { postBox.innerHTML = postHtml(store.getPost(id)!, { detail: true }); };
    const drawComments = () => {
      const comments = store.commentsOf(id);
      const canModerate = store.getPost(id)?.canEdit;
      commentsBox.innerHTML = comments.length
        ? comments.map((c) => `<li class="comment" data-comment="${esc(c.id)}">${avatarHtml(c.author, "avatar avatar--sm")}
            <div><p class="comment-meta"><a href="/founders/${esc(c.author.id)}">${esc(c.author.name)}</a> · ${esc(timeAgo(c.createdAt))}</p><p class="comment-text">${esc(c.text)}</p></div>
            ${(c.authorId === me.id || canModerate) ? `<button class="link-button" type="button" data-del-comment="${esc(c.id)}">Borrar</button>` : ""}</li>`).join("")
        : `<li class="field-hint">Aún no hay comentarios. Sé la primera persona.</li>`;
    };
    drawPost(); drawComments();
    bindPosts(postBox, { onRemoved: () => location.assign("/anuncios") }, true);
    postBox.addEventListener("click", () => queueMicrotask(drawComments));

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      clearErrors(form);
      const r = store.addComment(id, text.value);
      if (!r.ok) return setFieldError(form, r.field, r.error);
      form.reset();
      drawPost(); drawComments();
      toast("Comentario publicado.");
    });
    commentsBox.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>("[data-del-comment]");
      if (!b) return;
      store.deleteComment(b.dataset.delComment!);
      drawPost(); drawComments();
    });
  }
}
