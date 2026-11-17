import { createDemoSession } from "../lib/accounts/demo-session";

type DemoDraft = { website: string; name: string; short: string; long: string; logo: string; sector: string; stage: string; seekingInvestment: boolean; city: string; socials: Record<string, string> };
type Invite = { address: string; role: string };
const emptyDraft = (): DemoDraft => ({ website: "", name: "", short: "", long: "", logo: "", sector: "", stage: "", seekingInvestment: false, city: "", socials: { instagram: "", tiktok: "", x: "", linkedin: "" } });
const esc = (value: string) => value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const appendMarkup = (host: HTMLElement, markup: string) => { const parsed = new DOMParser().parseFromString(markup, "text/html"); host.replaceChildren(...Array.from(parsed.body.childNodes).map((node) => document.importNode(node, true))); };
const root = document.querySelector<HTMLElement>("[data-demo-onboarding]");

if (root) {
  const session = createDemoSession();
  const gate = root.querySelector<HTMLElement>("[data-demo-gate]")!;
  const flow = root.querySelector<HTMLElement>("[data-demo-flow]")!;
  const forms = <T extends HTMLElement>(step: string) => root.querySelector<T>(`[data-step="${step}"]`)!;
  const val = (form: HTMLFormElement, name: string) => (form.elements.namedItem(name) as HTMLInputElement | null)?.value.trim() ?? "";
  let draft = emptyDraft();
  let invites: Invite[] = [];
  let current = "profile";
  let lastResult: "draft" | "published" = "published";

  const error = (form: HTMLElement, field: string | undefined, message: string) => {
    const host = field ? form.querySelector<HTMLElement>(`[data-field="${field}"]`) : form;
    const slot = host?.querySelector<HTMLElement>("[data-error]") ?? form.querySelector<HTMLElement>("[data-form-error]");
    if (slot) { slot.textContent = message; slot.hidden = false; }
  };
  const clear = (form: HTMLElement) => form.querySelectorAll<HTMLElement>("[data-error], [data-form-error], [data-invite-error]").forEach((el) => { el.textContent = ""; el.hidden = true; });
  const readLogo = (file: File) => new Promise<string>((resolve, reject) => {
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return reject(new Error("Elige PNG, JPG o WebP."));
    if (file.size > 1024 * 1024) return reject(new Error("El logo debe pesar menos de 1 MB."));
    const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("No pudimos leer el logo de prueba.")); reader.readAsDataURL(file);
  });
  const show = (step: string, focus = true) => {
    current = step;
    root.querySelectorAll<HTMLElement>("[data-step]").forEach((el) => { el.hidden = el.dataset.step !== step; });
    const projectSteps = ["info", "details", "founders", "review"];
    const stepper = root.querySelector<HTMLElement>("[data-stepper]")!;
    stepper.hidden = !projectSteps.includes(step);
    stepper.querySelectorAll<HTMLElement>("li").forEach((li) => { const i = projectSteps.indexOf(li.dataset.s!); const now = projectSteps.indexOf(step); li.classList.toggle("is-current", i === now); li.classList.toggle("is-done", i >= 0 && i < now); });
    if (step === "info") fillInfo();
    if (step === "details") fillDetails();
    if (step === "founders") renderFounders();
    if (step === "review") renderReview();
    if (focus) forms<HTMLElement>(step).querySelector<HTMLElement>("h1")?.focus({ preventScroll: false });
  };
  const fillInfo = () => { const f = forms<HTMLFormElement>("info"); for (const [key, value] of Object.entries(draft)) { const el = f.elements.namedItem(key) as HTMLInputElement | HTMLTextAreaElement | null; if (el && typeof value === "string") el.value = value; } const preview = f.querySelector<HTMLElement>("[data-logo-preview]")!; preview.replaceChildren(); if (draft.logo) { const image = document.createElement("img"); image.src = draft.logo; image.alt = ""; preview.append(image); } else preview.textContent = "+"; f.querySelector<HTMLElement>("[data-logo-text]")!.textContent = draft.logo ? "Cambiar logo" : "Sube un logo de prueba"; };
  const readInfo = () => { const f = forms<HTMLFormElement>("info"); draft = { ...draft, website: val(f, "website"), name: val(f, "name"), short: val(f, "short"), long: val(f, "long") }; };
  const fillDetails = () => { const f = forms<HTMLFormElement>("details"); for (const key of ["sector", "stage", "city", "instagram", "tiktok", "x", "linkedin"]) { const el = f.elements.namedItem(key) as HTMLInputElement | null; if (el) el.value = key in draft.socials ? draft.socials[key]! : String(draft[key as keyof DemoDraft] ?? ""); } (f.elements.namedItem("seekingInvestment") as HTMLInputElement).checked = draft.seekingInvestment; };
  const readDetails = () => { const f = forms<HTMLFormElement>("details"); draft = { ...draft, sector: val(f, "sector"), stage: val(f, "stage"), seekingInvestment: (f.elements.namedItem("seekingInvestment") as HTMLInputElement).checked, city: val(f, "city"), socials: Object.fromEntries(["instagram", "tiktok", "x", "linkedin"].map((key) => [key, val(f, key)])) }; };
  const renderFounders = () => { const list = root.querySelector<HTMLElement>("[data-founder-list]")!; appendMarkup(list, `<li class="founder-row"><span class="avatar">LD</span><span class="founder-meta"><strong>Lucía Demo (tú)</strong><small>Founder · Administradora</small></span></li>${invites.map((inv, i) => `<li class="founder-row is-pending"><span class="avatar">✦</span><span class="founder-meta"><strong>${esc(inv.address)}</strong><small>Invitación simulada · ${esc(inv.role)}</small></span><button class="link-button" type="button" data-drop-invite="${i}">Quitar</button></li>`).join("")}`); };
  const renderReview = () => { const host = draft.website.replace(/^https?:\/\//i, "").split("/")[0]; appendMarkup(root.querySelector<HTMLElement>("[data-review]")!, `<div class="review-grid"><article class="review-card"><span class="project-logo">${draft.logo ? `<img src="${esc(draft.logo)}" alt="" />` : "✦"}</span><div><h2>${esc(draft.name)}</h2><p>${esc(draft.short)}</p><p class="chips"><span class="chip">${esc(draft.sector)}</span><span class="chip chip--stage">${esc(draft.stage)}</span>${draft.seekingInvestment ? '<span class="chip">Busca inversión</span>' : ""}</p></div></article><dl class="review-list"><div><dt>Web</dt><dd>${esc(host)}</dd></div>${draft.city ? `<div><dt>Ciudad base</dt><dd>${esc(draft.city)}</dd></div>` : ""}<div><dt>Fundadores</dt><dd>Lucía Demo${invites.length ? ` + ${invites.length} invitación(es) simulada(s)` : ""}</dd></div>${draft.long ? `<div><dt>Descripción larga</dt><dd>${esc(draft.long)}</dd></div>` : ""}</dl></div>`); };
  const showSignedIn = () => { const signed = session.isSignedIn(); gate.hidden = signed; flow.hidden = !signed; if (signed) show("profile", false); };

  forms<HTMLFormElement>("profile").addEventListener("submit", (event) => { event.preventDefault(); const f = forms<HTMLFormElement>("profile"); clear(f); if (val(f, "city").length < 2) return error(f, "city", "Indica una ciudad de muestra."); if (!val(f, "country")) return error(f, "country", "Indica un país de muestra."); show("ask"); });
  root.querySelector('[data-ask="yes"]')!.addEventListener("click", () => show("info"));
  root.querySelector('[data-ask="no"]')!.addEventListener("click", () => show("member"));
  const info = forms<HTMLFormElement>("info");
  info.querySelector<HTMLInputElement>('[name="logo"]')!.addEventListener("change", async (event) => { const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return; try { draft.logo = await readLogo(file); fillInfo(); } catch (e) { error(info, "logo", (e as Error).message); } });
  info.querySelector("[data-autofill]")!.addEventListener("click", () => { const raw = val(info, "website"); const note = info.parentElement!.querySelector<HTMLElement>("[data-autofill-note]")!; if (!raw.includes(".")) { note.textContent = "No pudimos leer ese enlace de prueba; completa los datos a mano."; note.hidden = false; return; } const label = raw.replace(/^https?:\/\//i, "").split(/[./]/)[0]!; (info.elements.namedItem("name") as HTMLInputElement).value ||= label.charAt(0).toUpperCase() + label.slice(1); (info.elements.namedItem("short") as HTMLInputElement).value ||= `Descubre ${label} en una experiencia de prueba.`; note.textContent = "Autocompletado simulado: revisa los datos antes de continuar."; note.hidden = false; });
  info.addEventListener("submit", (event) => { event.preventDefault(); clear(info); readInfo(); if (draft.name.length < 2) return error(info, "name", "Escribe el nombre del proyecto."); if (!draft.website.includes(".")) return error(info, "website", "Escribe una web válida de prueba."); if (draft.short.length < 10) return error(info, "short", "Describe tu proyecto en al menos 10 caracteres."); if (!draft.logo) return error(info, "logo", "Sube un logo de prueba."); show("details"); });
  const details = forms<HTMLFormElement>("details"); details.addEventListener("submit", (event) => { event.preventDefault(); clear(details); readDetails(); if (!draft.sector) return error(details, "sector", "Elige el sector."); if (!draft.stage) return error(details, "stage", "Elige la etapa."); show("founders"); });
  const founders = forms<HTMLFormElement>("founders"); founders.querySelector("[data-invite]")!.addEventListener("click", () => { const address = val(founders, "inviteAddress"); const slot = founders.querySelector<HTMLElement>("[data-invite-error]")!; slot.hidden = true; if (address.length < 2) { slot.textContent = "Escribe una persona de prueba."; slot.hidden = false; return; } if (invites.some((x) => x.address === address)) { slot.textContent = "Ya agregaste esa persona."; slot.hidden = false; return; } invites.push({ address, role: val(founders, "inviteRole") }); (founders.elements.namedItem("inviteAddress") as HTMLInputElement).value = ""; renderFounders(); });
  founders.addEventListener("click", (event) => { const button = (event.target as HTMLElement).closest<HTMLElement>("[data-drop-invite]"); if (button) { invites.splice(Number(button.dataset.dropInvite), 1); renderFounders(); } });
  founders.addEventListener("submit", (event) => { event.preventDefault(); show("review"); });
  forms<HTMLElement>("review").addEventListener("click", (event) => { const target = event.target as HTMLElement; if (target.closest("[data-edit]")) return show("info"); const button = target.closest<HTMLElement>("[data-save]"); if (!button) return; lastResult = button.dataset.save === "draft" ? "draft" : "published"; const done = forms<HTMLElement>("done"); done.querySelector<HTMLElement>("[data-done-title]")!.textContent = lastResult === "draft" ? "Borrador guardado" : "¡Tu proyecto está publicado!"; done.querySelector<HTMLElement>("[data-done-lead]")!.textContent = lastResult === "draft" ? "El borrador queda disponible solo en esta simulación." : "La publicación es una vista de prueba, sin página pública ni escritura externa."; appendMarkup(done.querySelector<HTMLElement>("[data-done-card]")!, `<div class="review-card"><span class="project-logo">✦</span><div><h2>${esc(draft.name)}</h2><p class="chips"><span class="chip">${esc(lastResult === "draft" ? "Borrador" : "Publicado en demo")}</span></p></div></div>`); show("done"); });
  root.querySelectorAll<HTMLElement>("[data-back]").forEach((button) => button.addEventListener("click", () => show(current === "details" ? "info" : current === "founders" ? "details" : current === "review" ? "founders" : "ask")));
  root.querySelector("[data-another]")!.addEventListener("click", () => { draft = emptyDraft(); invites = []; show("info"); });
  root.querySelector("[data-demo-sign-out]")!.addEventListener("click", () => { session.signOut(); showSignedIn(); });
  showSignedIn();
}
