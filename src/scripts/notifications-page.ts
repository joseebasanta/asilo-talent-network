import { REACTIONS } from "../lib/accounts/types";
import { timeAgo } from "../lib/accounts/format";
import { esc, requireSession, store, syncAuthHint } from "./accounts-client";

const me = requireSession();
const root = document.querySelector<HTMLElement>("[data-notifications]")!;

if (me) {
  root.querySelector<HTMLElement>("[data-body]")!.hidden = false;
  const items = store.notifications();
  const list = root.querySelector<HTMLElement>("[data-list]")!;
  list.innerHTML = items.length
    ? items.map((n) => {
        const emoji = REACTIONS.find((r) => r.kind === n.reaction)?.emoji ?? "";
        const what = n.kind === "comment" ? "comentó en tu anuncio" : `reaccionó ${emoji} a tu anuncio`;
        return `<li><a class="notice${n.read ? "" : " is-unread"}" href="/anuncios/${esc(n.postId)}"><span class="notice-dot" aria-hidden="true"></span><span><strong>${esc(n.actorName)}</strong> ${what}<small>${esc(timeAgo(n.createdAt))}${n.read ? "" : " · nueva"}</small></span></a></li>`;
      }).join("")
    : `<li class="empty"><p>Todavía no tienes notificaciones.</p><p class="field-hint">Te avisamos cuando alguien reaccione o comente tus publicaciones.</p></li>`;
  // Seen once rendered, so the header badge clears on the next page.
  store.markNotificationsRead();
  window.dispatchEvent(new Event("asilo:notifications"));
  syncAuthHint();
}
