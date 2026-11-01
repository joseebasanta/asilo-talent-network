import { FEED_PAGE_SIZE, POST_MAX } from "../lib/accounts/types";
import { avatarHtml, clearErrors, esc, readImage, requireSession, setFieldError, store, toast } from "./accounts-client";
import { bindPosts, postHtml, previewHtml } from "./feed-ui";
import { previewFor } from "../lib/accounts/link-preview";

const me = requireSession();
const root = document.querySelector<HTMLElement>("[data-feed]")!;

if (me) {
  root.hidden = false;
  const list = root.querySelector<HTMLElement>("[data-list]")!;
  const more = root.querySelector<HTMLButtonElement>("[data-more]")!;
  const sentinel = root.querySelector<HTMLElement>("[data-sentinel]")!;
  const end = root.querySelector<HTMLElement>("[data-end]")!;
  let cursor: string | null = null;
  let exhausted = false;
  let loading = false;

  // ---- composer -------------------------------------------------------
  const composer = root.querySelector<HTMLFormElement>("[data-composer]")!;
  const blocked = root.querySelector<HTMLElement>("[data-cannot-post]")!;
  const projects = store.postableProjects();
  let image: string | null = null;

  if (projects.length === 0) {
    composer.hidden = true;
    blocked.hidden = false;
  } else {
    const select = composer.elements.namedItem("project") as HTMLSelectElement;
    const text = composer.elements.namedItem("text") as HTMLTextAreaElement;
    const send = composer.querySelector<HTMLButtonElement>(".send-button")!;
    const count = root.querySelector<HTMLElement>("[data-count]")!;
    const linkPreview = root.querySelector<HTMLElement>("[data-link-preview]")!;
    const preview = root.querySelector<HTMLElement>("[data-image-preview]")!;
    const avatar = root.querySelector<HTMLElement>("[data-composer-avatar]")!;
    avatar.innerHTML = avatarHtml(me!, "avatar avatar--md");
    const imageInput = composer.elements.namedItem("image") as HTMLInputElement;

    select.innerHTML = projects.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("");
    const wanted = new URLSearchParams(location.search).get("proyecto");
    if (wanted && projects.some((p) => p.id === wanted)) { select.value = wanted; text.focus(); }

    // One project: a static label. Several: a picker styled as a pill.
    const picker = root.querySelector<HTMLElement>("[data-project-pick]")!;
    const fixed = root.querySelector<HTMLElement>("[data-project-static]")!;
    picker.hidden = projects.length === 1;
    fixed.hidden = projects.length !== 1;
    const syncProject = () => {
      const chosen = projects.find((p) => p.id === select.value) ?? projects[0]!;
      fixed.textContent = `Sobre ${chosen.name}`;
      picker.dataset.name = chosen.name;
    };
    select.addEventListener("change", syncProject);
    syncProject();

    const refresh = () => {
      // Grow with the content, up to a comfortable height.
      text.style.height = "auto";
      text.style.height = `${Math.min(text.scrollHeight, 320)}px`;
      const n = text.value.length;
      send.disabled = text.value.trim().length === 0 || n > POST_MAX;
      count.hidden = n < POST_MAX * 0.6;
      count.textContent = `${POST_MAX - n}`;
      count.classList.toggle("is-near", n >= POST_MAX * 0.9);
      const p = previewFor(text.value);
      linkPreview.innerHTML = p ? previewHtml(p, "Vista previa del enlace") : "";
    };
    text.addEventListener("input", refresh);
    text.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !send.disabled) { e.preventDefault(); composer.requestSubmit(); }
    });
    composer.classList.add("is-ready");
    refresh();

    imageInput.addEventListener("change", async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        clearErrors(composer);
        image = await readImage(file);
        preview.innerHTML = `<img class="composer-image-img" src="${image}" alt="Vista previa de la imagen" />
          <button class="icon-button icon-button--overlay" type="button" data-clear-image aria-label="Quitar imagen"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg></button>`;
      } catch (err) { setFieldError(composer, undefined, (err as Error).message); }
      imageInput.value = "";
    });
    preview.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest("[data-clear-image]")) { image = null; preview.innerHTML = ""; }
    });

    composer.addEventListener("submit", (e) => {
      e.preventDefault();
      clearErrors(composer);
      const r = store.createPost(select.value, { text: text.value, image });
      if (!r.ok) return setFieldError(composer, undefined, r.error);
      const chosen = select.value;
      composer.reset();
      select.value = chosen;
      image = null; preview.innerHTML = "";
      refresh();
      const v = store.getPost(r.value.id)!;
      list.insertAdjacentHTML("afterbegin", postHtml(v));
      root.querySelector<HTMLElement>("[data-empty]")!.hidden = true;
      toast("Anuncio publicado.");
    });
  }

  // ---- list with cursor pagination -----------------------------------
  bindPosts(list, { onRemoved: () => { root.querySelector<HTMLElement>("[data-empty]")!.hidden = list.children.length > 0; } });

  function loadMore() {
    if (loading || exhausted) return;
    loading = true;
    const page = store.feedPage(cursor, FEED_PAGE_SIZE);
    list.insertAdjacentHTML("beforeend", page.posts.map((v) => postHtml(v)).join(""));
    cursor = page.nextCursor;
    exhausted = cursor === null;
    more.hidden = exhausted;
    end.hidden = !exhausted || list.children.length === 0;
    root.querySelector<HTMLElement>("[data-empty]")!.hidden = list.children.length > 0;
    loading = false;
  }

  more.addEventListener("click", loadMore);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) loadMore(); }, { rootMargin: "300px" }).observe(sentinel);
  }
  loadMore();
}
