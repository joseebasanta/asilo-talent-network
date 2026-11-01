import { clearErrors, returnTarget, safeReturn, setFieldError, store, withReturn } from "./accounts-client";

const params = new URLSearchParams(location.search);
const back = params.get("volver");

// Keep the return target when hopping between sign-in and sign-up.
document.querySelectorAll<HTMLAnchorElement>("[data-switch]").forEach((a) => {
  a.href = back ? `${a.dataset.switch}?volver=${encodeURIComponent(safeReturn(back))}` : a.dataset.switch!;
});

/** Where a signed-in person goes next: unfinished onboarding first, else where they came from. */
function afterSignIn(isNew: boolean): void {
  const me = store.currentAccount();
  if (me && (isNew || !me.onboarded)) {
    location.assign(back ? withReturn("/onboarding", safeReturn(back)) : "/onboarding");
    return;
  }
  location.assign(returnTarget());
}

document.querySelector<HTMLElement>("[data-google]")?.addEventListener("click", () => {
  const result = store.signInWithGoogle();
  if (result.ok) afterSignIn(result.value.isNew);
});

const data = (form: HTMLFormElement) => Object.fromEntries(new FormData(form)) as Record<string, string>;

document.querySelectorAll<HTMLFormElement>("[data-auth-form]").forEach((form) => {
  const kind = form.dataset.authForm;
  if (kind === "verify") {
    const email = store.pendingEmail();
    const label = document.querySelector("[data-pending-email]");
    if (label && email) label.textContent = email;
    if (!email) setFieldError(form, undefined, "No hay una verificación pendiente. Crea una cuenta o entra de nuevo.");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearErrors(form);
    const values = data(form);

    if (kind === "signup") {
      const r = store.signUp({ name: values.name ?? "", email: values.email ?? "", password: values.password ?? "", human: values.human === "on" });
      if (!r.ok) return setFieldError(form, r.field, r.error);
      location.assign(back ? withReturn("/verificar", safeReturn(back)) : "/verificar");
    } else if (kind === "signin") {
      const r = store.signIn({ email: values.email ?? "", password: values.password ?? "" });
      if (!r.ok) return setFieldError(form, r.field, r.error);
      if (r.value.needsCode) return location.assign(back ? withReturn("/verificar", safeReturn(back)) : "/verificar");
      afterSignIn(false);
    } else if (kind === "verify") {
      const r = store.verifyCode(values.code ?? "");
      if (!r.ok) return setFieldError(form, r.field, r.error);
      afterSignIn(!r.value.onboarded);
    } else if (kind === "recover") {
      const r = store.requestPasswordReset(values.email ?? "");
      if (!r.ok) return setFieldError(form, r.field, r.error);
      document.querySelector<HTMLElement>("[data-recover-sent]")!.hidden = false;
    }
  });
});

document.querySelector<HTMLElement>("[data-resend]")?.addEventListener("click", () => {
  if (store.resendCode().ok) document.querySelector<HTMLElement>("[data-resent]")!.hidden = false;
});
