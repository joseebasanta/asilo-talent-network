import type { AccountRole, ContactKey } from "../lib/accounts/types";
import { avatarHtml, clearErrors, readLogo, setFieldError, showGate, store } from "./accounts-client";

const root = document.querySelector<HTMLElement>("[data-profile]")!;
const me = store.currentAccount();

if (!me) {
  showGate(root);
} else {
  root.querySelector<HTMLElement>("[data-profile-body]")!.hidden = false;
  const form = (name: string) => root.querySelector<HTMLFormElement>(`[data-form="${name}"]`)!;
  const field = (f: HTMLFormElement, name: string) => f.elements.namedItem(name) as HTMLInputElement;
  const saved = (f: HTMLFormElement) => {
    const note = f.querySelector<HTMLElement>("[data-saved]")!;
    note.hidden = false;
    setTimeout(() => { note.hidden = true; }, 3000);
  };

  const personal = form("personal");
  const paintPhoto = () => { root.querySelector("[data-photo]")!.innerHTML = avatarHtml(store.currentAccount()!, "avatar avatar--xl"); };
  paintPhoto();
  field(personal, "name").value = me.name;
  field(personal, "role").value = me.role || "founder";
  field(personal, "city").value = me.city;
  field(personal, "country").value = me.country;
  field(personal, "bio").value = me.bio;
  field(personal, "inWhatsappGroup").checked = me.inWhatsappGroup;
  field(personal, "photo").addEventListener("change", async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try { store.updateProfile({ photo: await readLogo(file) }); paintPhoto(); } catch (err) { setFieldError(personal, undefined, (err as Error).message); }
  });
  personal.addEventListener("submit", (e) => {
    e.preventDefault();
    clearErrors(personal);
    const r = store.updateProfile({
      name: field(personal, "name").value, role: field(personal, "role").value as AccountRole, city: field(personal, "city").value,
      country: field(personal, "country").value, bio: field(personal, "bio").value, inWhatsappGroup: field(personal, "inWhatsappGroup").checked,
    });
    if (!r.ok) return setFieldError(personal, r.field, r.error);
    paintPhoto();
    saved(personal);
  });

  const contacts = form("contacts");
  const keys: ContactKey[] = ["phone", "contactEmail", "linkedin", "x"];
  keys.forEach((k) => {
    field(contacts, k).value = me.contacts[k].value;
    field(contacts, `${k}-visibility`).value = me.contacts[k].visibility;
  });
  contacts.addEventListener("submit", (e) => {
    e.preventDefault();
    keys.forEach((k) => store.setContact(k, field(contacts, k).value, field(contacts, `${k}-visibility`).value as "registrados" | "oculto"));
    saved(contacts);
  });

  const access = form("access");
  const refreshAccess = () => {
    const a = store.currentAccount()!;
    const methods = [a.hasGoogle ? "Google" : "", a.password !== null ? "correo y contraseña" : ""].filter(Boolean).join(" y ");
    root.querySelector("[data-access-summary]")!.textContent = `Entras con ${methods}. Tu correo de acceso es ${a.email} y nunca se muestra a otras personas.`;
    access.querySelector<HTMLElement>("[data-current-wrap]")!.hidden = a.password === null;
    access.querySelector("[data-next-label]")!.textContent = a.password === null ? "Añadir una contraseña" : "Contraseña nueva";
  };
  refreshAccess();
  access.addEventListener("submit", (e) => {
    e.preventDefault();
    clearErrors(access);
    const r = store.setPassword({ current: field(access, "current").value, next: field(access, "next").value });
    if (!r.ok) return setFieldError(access, r.field, r.error);
    access.reset();
    refreshAccess();
    saved(access);
  });

  const confirm = root.querySelector<HTMLInputElement>("[data-confirm-delete]")!;
  const del = root.querySelector<HTMLButtonElement>("[data-delete]")!;
  confirm.addEventListener("change", () => { del.disabled = !confirm.checked; });
  del.addEventListener("click", () => {
    if (!confirm.checked) return;
    store.deleteAccount();
    location.assign("/");
  });
}
