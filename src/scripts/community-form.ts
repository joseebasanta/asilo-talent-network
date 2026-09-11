import { createDialogMotion } from "../lib/dialog-motion";
import { createSubmissionClock } from "../lib/project-form-client";
import { communitySchema } from "../lib/community-submit";

export function initCommunityForm() {
  const dialog = document.querySelector<HTMLDialogElement>("#community-dialog")!;
  const form = document.querySelector<HTMLFormElement>("#community-form")!;
  const status = document.querySelector<HTMLElement>("#community-status")!;
  const send = form.querySelector<HTMLButtonElement>(".modal-submit")!;
  const formView = form.querySelector<HTMLElement>("[data-form-view]")!;
  const successView = form.querySelector<HTMLElement>("[data-community-success]")!;
  const successTitle = form.querySelector<HTMLElement>("#community-success-title")!;
  const started = form.elements.namedItem("started") as HTMLInputElement;
  const submissionClock = createSubmissionClock(Number(started.value), () => performance.now());
  let hasOpened = false;
  const motion = createDialogMotion(dialog);
  let pending = false;
  function open() {
    if (dialog.open) return;
    if (!hasOpened) { started.value = submissionClock(); hasOpened = true; }
    motion.open();
    if (!successView.hidden) successTitle.focus();
  }
  document.querySelectorAll<HTMLAnchorElement>('a[href="#unete"], a[href="/#unete"]').forEach(link => {
    link.setAttribute("aria-haspopup", "dialog");
    link.setAttribute("aria-controls", "community-dialog");
    link.addEventListener("click", event => { event.preventDefault(); open(); });
  });
  if (location.hash === "#unete") open();
  window.addEventListener("hashchange", () => { if (location.hash === "#unete") open(); });
  dialog.querySelectorAll("[data-community-close]").forEach(button => button.addEventListener("click", () => { void motion.close(); }));
  // A selection drag that ends outside the card must not dismiss a filled form.
  let backdropDown = false;
  dialog.addEventListener("pointerdown", event => { backdropDown = event.target === dialog; });
  dialog.addEventListener("click", event => { if (backdropDown && event.target === dialog) void motion.close(); backdropDown = false; });
  const controls = Array.from(form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(".field-input, .field-textarea"));
  function clearErrors() {
    controls.forEach(input => {
      input.removeAttribute("aria-invalid");
      document.getElementById(`community-${input.name}-error`)!.hidden = true;
    });
    status.hidden = true;
    status.textContent = "";
  }
  function showErrors(errors: Record<string, string>) {
    let first: HTMLElement | undefined;
    for (const input of controls) {
      if (!errors[input.name]) continue;
      const error = document.getElementById(`community-${input.name}-error`)!;
      error.textContent = errors[input.name];
      error.hidden = false;
      input.setAttribute("aria-invalid", "true");
      first ??= input;
    }
    if (dialog.open) first?.focus();
    return Boolean(first);
  }
  controls.forEach(input => input.addEventListener("input", () => {
    input.removeAttribute("aria-invalid");
    document.getElementById(`community-${input.name}-error`)!.hidden = true;
  }));
  const description = form.elements.namedItem("description") as HTMLTextAreaElement;
  description.addEventListener("input", () => { form.querySelector("[data-community-counter]")!.textContent = `${description.value.length}/3000`; });
  function showStatus(message: string) {
    status.textContent = message;
    status.hidden = false;
    if (dialog.open) status.focus();
  }
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (pending || !successView.hidden) return;
    clearErrors();
    const body = new FormData(form);
    const validation = communitySchema.safeParse(Object.fromEntries(body));
    if (!validation.success) {
      const errors: Record<string, string> = {};
      for (const issue of validation.error.issues) errors[String(issue.path[0])] ??= issue.message;
      showErrors(errors);
      return;
    }
    pending = true;
    send.disabled = true;
    controls.forEach(input => { input.readOnly = true; });
    form.setAttribute("aria-busy", "true");
    send.textContent = "Enviando…";
    try {
      const response = await fetch("/api/community/submit", { method: "POST", body, signal: AbortSignal.timeout(30_000) });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        if (!showErrors(result.errors ?? {})) showStatus(result.error || "No pudimos guardar tu solicitud. Intenta de nuevo.");
      } else {
        formView.hidden = true;
        successView.hidden = false;
        if (dialog.open) successTitle.focus();
      }
    } catch {
      showStatus("No pudimos confirmar el envío. Revisa tu conexión. Si vuelves a enviar, tu solicitud podría registrarse más de una vez.");
    } finally {
      pending = false;
      controls.forEach(input => { input.readOnly = false; });
      form.removeAttribute("aria-busy");
      send.disabled = false;
      send.textContent = "Enviar solicitud";
    }
  });
}
