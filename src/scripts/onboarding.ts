import { createDemoSession } from "../lib/accounts/demo-session";

const root = document.querySelector<HTMLElement>("[data-demo-onboarding]");

if (root) {
  const session = createDemoSession();
  const gate = root.querySelector<HTMLElement>("[data-demo-gate]");
  const flow = root.querySelector<HTMLElement>("[data-demo-flow]");
  const forms = new Map([...root.querySelectorAll<HTMLElement>("[data-demo-form]")].map((form) => [form.dataset.demoForm, form]));
  const steps = [...root.querySelectorAll<HTMLElement>("[data-demo-step]")];

  const show = (name: string) => {
    forms.forEach((form, key) => { form.hidden = key !== name; });
    const order = ["profile", "project", "done"];
    const index = order.indexOf(name);
    steps.forEach((step, stepIndex) => {
      step.classList.toggle("is-current", step.dataset.demoStep === name);
      step.classList.toggle("is-done", stepIndex < index);
    });
    forms.get(name)?.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true });
  };

  const showSignedIn = () => {
    const signedIn = session.isSignedIn();
    if (gate) gate.hidden = signedIn;
    if (flow) flow.hidden = !signedIn;
    if (signedIn) show("profile");
  };

  forms.get("profile")?.addEventListener("submit", (event) => {
    event.preventDefault();
    show("project");
  });
  forms.get("project")?.addEventListener("submit", (event) => {
    event.preventDefault();
    show("done");
  });
  root.querySelector("[data-demo-back]")?.addEventListener("click", () => show("profile"));
  root.querySelector("[data-demo-sign-out]")?.addEventListener("click", () => {
    session.signOut();
    showSignedIn();
  });

  showSignedIn();
}
