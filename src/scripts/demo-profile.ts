import { DEMO_PROFILE, resetDemoProfile, updateDemoAccess, updateDemoContact, updateDemoPhoto, updateDemoProfile } from "../lib/accounts/demo-profile";
import { DEMO_PROJECTS } from "../lib/accounts/demo-projects";
import { createDemoSession } from "../lib/accounts/demo-session";

const session = createDemoSession();
const gate = (root: HTMLElement) => {
  const isIn = session.isSignedIn();
  root.querySelector<HTMLElement>("[data-demo-gate]")!.hidden = isIn;
  const body = root.querySelector<HTMLElement>("[data-demo-profile-body], [data-demo-founder-body]");
  if (body) body.hidden = !isIn;
};

const profileRoot = document.querySelector<HTMLElement>("[data-demo-profile]");
if (profileRoot) {
  gate(profileRoot);
  const form = profileRoot.querySelector<HTMLFormElement>("[data-profile-form]")!;
  const contactForm = profileRoot.querySelector<HTMLFormElement>("[data-contact-form]")!;
  const photo = profileRoot.querySelector<HTMLElement>("[data-photo]")!;
  const photoInput = profileRoot.querySelector<HTMLInputElement>("[data-photo-input]")!;
  const photoClear = profileRoot.querySelector<HTMLButtonElement>("[data-photo-clear]")!;
  const renderPhoto = () => {
    photo.replaceChildren();
    if (DEMO_PROFILE.photo) {
      const image = document.createElement("img");
      image.src = DEMO_PROFILE.photo;
      image.alt = "Foto de perfil demo";
      photo.append(image);
      photoClear.hidden = false;
    } else {
      photo.textContent = DEMO_PROFILE.name.charAt(0);
      photoClear.hidden = true;
    }
  };
  const fill = () => {
    renderPhoto();
    for (const key of ["name", "role", "city", "country", "bio"] as const) (form.elements.namedItem(key) as HTMLInputElement).value = DEMO_PROFILE[key];
    (form.elements.namedItem("inWhatsappGroup") as HTMLInputElement).checked = DEMO_PROFILE.inWhatsappGroup;
    for (const [key, value] of Object.entries(DEMO_PROFILE.contacts)) {
      (contactForm.elements.namedItem(key) as HTMLInputElement).value = value.value;
      (contactForm.elements.namedItem(`${key}-visibility`) as HTMLSelectElement).value = value.visible ? "visible" : "hidden";
    }
  };
  if (session.isSignedIn()) fill();
  photoInput.addEventListener("change", () => {
    const file = photoInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      updateDemoPhoto(typeof reader.result === "string" ? reader.result : null);
      renderPhoto();
    });
    reader.readAsDataURL(file);
  });
  photoClear.addEventListener("click", () => { updateDemoPhoto(null); photoInput.value = ""; renderPhoto(); });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const city = String(data.get("city") ?? "").trim();
    const error = profileRoot.querySelector<HTMLElement>("[data-profile-error]")!;
    if (name.length < 2 || !city) { error.textContent = "Completa tu nombre y ciudad de muestra."; error.hidden = false; return; }
    error.hidden = true;
    updateDemoProfile({ name, role: String(data.get("role") ?? ""), city, country: String(data.get("country") ?? ""), bio: String(data.get("bio") ?? ""), inWhatsappGroup: data.has("inWhatsappGroup") });
    profileRoot.querySelector<HTMLElement>("[data-profile-saved]")!.hidden = false;
  });
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(contactForm);
    for (const key of ["phone", "contactEmail", "linkedin", "x"] as const) updateDemoContact(key, String(data.get(key) ?? ""), data.get(`${key}-visibility`) === "visible");
    profileRoot.querySelector<HTMLElement>("[data-contact-saved]")!.hidden = false;
  });
  const accessForm = profileRoot.querySelector<HTMLFormElement>("[data-access-form]")!;
  accessForm.addEventListener("submit", (event) => {
    event.preventDefault();
    updateDemoAccess();
    profileRoot.querySelector<HTMLElement>("[data-access-status]")!.textContent = "Cambio de acceso simulado en esta sesión; no se guardó ninguna contraseña.";
  });
  const deleteConfirm = profileRoot.querySelector<HTMLInputElement>("[data-delete-confirm]")!;
  const deleteButton = profileRoot.querySelector<HTMLButtonElement>("[data-delete-account]")!;
  deleteConfirm.addEventListener("change", () => { deleteButton.disabled = !deleteConfirm.checked; });
  deleteButton.addEventListener("click", () => {
    if (!deleteConfirm.checked) return;
    resetDemoProfile();
    session.signOut();
    profileRoot.querySelector<HTMLElement>("[data-demo-profile-body]")!.hidden = true;
    profileRoot.querySelector<HTMLElement>("[data-demo-gate]")!.hidden = false;
    profileRoot.querySelector<HTMLElement>("[data-delete-status]")!.hidden = false;
  });
}

const founderRoot = document.querySelector<HTMLElement>("[data-demo-founder]");
if (founderRoot) {
  gate(founderRoot);
  if (session.isSignedIn()) {
    const id = founderRoot.dataset.demoFounderId;
    const isLucia = id === "lucia-demo";
    const person = isLucia ? DEMO_PROFILE : { name: "Andrés Demo", role: "Cofounder", city: "Valencia", country: "Venezuela", bio: "Backend y automatización para equipos pequeños.", contacts: {} };
    const body = founderRoot.querySelector<HTMLElement>("[data-demo-founder-body]")!;
    const add = (tag: string, text: string, className?: string) => {
      const element = document.createElement(tag);
      element.textContent = text;
      if (className) element.className = className;
      body.append(element);
      return element;
    };
    add("p", "Founder · perfil sintético", "demo-eyebrow");
    add("h1", person.name, "wizard-title").id = "demo-founder-title";
    add("p", `${person.role} · ${person.city}, ${person.country}`, "field-hint");
    add("p", person.bio, "project-lead");
    add("h2", "Contacto", "aside-title");
    add("p", "Los datos de contacto están ocultos en esta vista demo.", "field-hint");
    add("h2", "Proyectos", "aside-title");
    const list = document.createElement("ul");
    list.className = "project-mini";
    DEMO_PROJECTS.filter((project) => project.founders.includes(person.name)).forEach((project) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = "/demo-cuentas/mis-proyectos";
      const name = document.createElement("strong");
      name.textContent = project.name;
      const stage = document.createElement("small");
      stage.textContent = project.stage;
      link.append(name, stage);
      item.append(link);
      list.append(item);
    });
    if (!list.children.length) add("p", "Aún no participa en proyectos publicados.", "field-hint");
    else body.append(list);
  }
}
