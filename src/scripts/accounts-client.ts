/** Browser glue shared by the account screens (mock store on localStorage). */
import { AccountsStore, memoryStorage, type StorageLike } from "../lib/accounts/store";

function browserStorage(): StorageLike {
  try {
    const probe = "__asilo_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return memoryStorage(); // private mode: works for this tab only
  }
}

export const store = new AccountsStore(browserStorage());

/** Escapes text before it goes into an HTML template. */
export function esc(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Only same-site paths are accepted as a return target, so `?volver=` cannot redirect elsewhere. */
export function safeReturn(raw: string | null | undefined, fallback = "/mis-proyectos"): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return fallback;
  return raw;
}

export function returnTarget(fallback?: string): string {
  return safeReturn(new URLSearchParams(location.search).get("volver"), fallback);
}

export function withReturn(path: string, back: string = location.pathname + location.search): string {
  return `${path}?volver=${encodeURIComponent(back)}`;
}

export function syncAuthHint(): void {
  document.documentElement.dataset.auth = store.currentAccount() ? "in" : "out";
}

export function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "·";
}

export function avatarHtml(person: { name: string; photo: string | null }, cls = "avatar"): string {
  return person.photo
    ? `<span class="${cls}"><img src="${esc(person.photo)}" alt="" /></span>`
    : `<span class="${cls}">${esc(initials(person.name))}</span>`;
}

export function setFieldError(form: HTMLElement, field: string | undefined, message: string): void {
  clearErrors(form);
  const target = field ? form.querySelector<HTMLElement>(`[data-field="${field}"]`) : null;
  const slot = target?.querySelector<HTMLElement>("[data-error]") ?? form.querySelector<HTMLElement>("[data-form-error]");
  if (slot) { slot.textContent = message; slot.hidden = false; }
  const input = target?.querySelector<HTMLElement>("input, select, textarea");
  if (input) { input.setAttribute("aria-invalid", "true"); input.focus(); }
}

export function clearErrors(form: HTMLElement): void {
  form.querySelectorAll<HTMLElement>("[data-error], [data-form-error]").forEach((el) => { el.textContent = ""; el.hidden = true; });
  form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
}

/** Reads a file as a square-ish data URL no bigger than 256 px, so it fits in storage. */
export function readLogo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) return reject(new Error("Sube el logo en PNG, JPG o WebP."));
    if (file.size > 1024 * 1024) return reject(new Error("El logo pesa más de 1 MB."));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const size = 256;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d");
      const side = Math.min(img.width, img.height);
      ctx?.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/webp", 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("No pudimos leer esa imagen.")); };
    img.src = url;
  });
}

export const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/asilo-builders-demo";

/** Shows the sign-in gate inside `root`, with links that bring the person back here. */
export function showGate(root: ParentNode): void {
  const here = location.pathname + location.search;
  const signup = root.querySelector<HTMLAnchorElement>("[data-gate-signup]");
  const signin = root.querySelector<HTMLAnchorElement>("[data-gate-signin]");
  if (signup) signup.href = withReturn("/crear-cuenta", here);
  if (signin) signin.href = withReturn("/entrar", here);
  const gate = root.querySelector<HTMLElement>("[data-gate]");
  if (gate) gate.hidden = false;
}

export const ROLE_LABEL: Record<string, string> = {
  founder: "Founder", cofounder: "Cofounder", equipo: "Equipo", developer: "Developer", diseno: "Diseño", otro: "Otro",
};

export function logoHtml(project: { logo: string | null; name: string }, cls = "project-logo"): string {
  return `<span class="${cls}">${project.logo ? `<img src="${esc(project.logo)}" alt="" />` : esc(project.name.charAt(0).toUpperCase())}</span>`;
}

/** Signed-in person for private screens; anyone else is sent to sign in and brought back. */
export function requireSession() {
  const me = store.currentAccount();
  if (!me) location.replace(withReturn("/entrar"));
  return me;
}

let toastTimer: number | undefined;
export function toast(message: string): void {
  let el = document.querySelector<HTMLElement>("[data-toast]");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    el.dataset.toast = "";
    el.setAttribute("role", "status");
    document.body.append(el);
  }
  el.textContent = message;
  el.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el!.classList.remove("is-visible"), 2400);
}

/** Feed image: keeps its proportions, at most 900 px wide, so it fits in storage. */
export function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) return reject(new Error("Sube una imagen PNG, JPG o WebP."));
    if (file.size > 2 * 1024 * 1024) return reject(new Error("La imagen pesa más de 2 MB."));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 900 / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/webp", 0.8));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("No pudimos leer esa imagen.")); };
    img.src = url;
  });
}
