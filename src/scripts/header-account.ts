import { avatarHtml, store, syncAuthHint } from "./accounts-client";

function render(): void {
  syncAuthHint();
  const me = store.currentAccount();
  document.querySelectorAll<HTMLElement>("[data-account-avatar]").forEach((el) => {
    el.innerHTML = me ? avatarHtml(me, "avatar-inner") : "";
  });
  const unread = me ? store.unreadCount() : 0;
  document.querySelectorAll<HTMLElement>("[data-notif-count]").forEach((el) => {
    el.hidden = unread === 0;
    el.textContent = unread > 9 ? "9+" : String(unread);
    el.setAttribute("aria-label", `${unread} sin leer`);
    el.closest("a")?.setAttribute("aria-label", unread ? `Notificaciones, ${unread} sin leer` : "Notificaciones");
  });
  document.querySelectorAll<HTMLElement>("[data-account-name]").forEach((el) => { el.textContent = me?.name ?? ""; });
}

render();
window.addEventListener("storage", () => { store.refresh(); render(); });
window.addEventListener("asilo:notifications", () => { store.refresh(); render(); });
window.addEventListener("pageshow", () => { store.refresh(); render(); });

document.querySelectorAll<HTMLElement>("[data-sign-out]").forEach((button) => {
  button.addEventListener("click", () => {
    store.signOut();
    location.assign("/");
  });
});

const menu = document.querySelector<HTMLDetailsElement>("[data-avatar-menu]");
if (menu) {
  document.addEventListener("click", (e) => { if (menu.open && !menu.contains(e.target as Node)) menu.open = false; });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") menu.open = false; });
}
