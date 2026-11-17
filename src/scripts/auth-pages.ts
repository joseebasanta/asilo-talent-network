import { createDemoSession } from "../lib/accounts/demo-session";

const session = createDemoSession();
document.querySelector<HTMLButtonElement>("[data-demo-enter]")?.addEventListener("click", () => {
  session.signIn();
  const target = document.querySelector<HTMLElement>("[data-demo-enter]")?.dataset.demoTarget ?? "/demo-cuentas/onboarding?demo=1";
  location.assign(target);
});
