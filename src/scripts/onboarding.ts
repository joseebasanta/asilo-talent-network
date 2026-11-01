import { emptyDraft } from "../lib/accounts/store";
import { PROJECT_ROLES, type OnboardingProgress, type Project, type ProjectDraft, type ProjectRole } from "../lib/accounts/types";
import {
  validateProfile, validateProjectDetails, validateProjectInfo,
} from "../lib/accounts/validation";
import {
  WHATSAPP_GROUP_URL, avatarHtml, clearErrors, esc, readLogo, safeReturn, setFieldError, store, withReturn,
} from "./accounts-client";

type Step = OnboardingProgress["step"] | "done" | "member";
const PROJECT_STEPS: Step[] = ["info", "details", "founders", "review"];
const ORDER: Step[] = ["info", "details", "founders", "review"];

const root = document.querySelector<HTMLElement>("[data-wizard]")!;
const q = <T extends HTMLElement>(sel: string, from: ParentNode = root) => from.querySelector<T>(sel)!;
const params = new URLSearchParams(location.search);
const wantsProject = params.get("origen") === "proyecto" || (params.get("volver") ?? "").includes("origen=proyecto");

const me = store.currentAccount();
const gate = q("[data-gate]");
const flow = q("[data-flow]");

if (!me) {
  const here = location.pathname + location.search;
  q<HTMLAnchorElement>("[data-gate-signup]").href = withReturn("/crear-cuenta", here);
  q<HTMLAnchorElement>("[data-gate-signin]").href = withReturn("/entrar", here);
  gate.hidden = false;
} else {
  start();
}

function start() {
  flow.hidden = false;
  const editId = params.get("proyecto");
  let editing: Project | null = null;
  if (editId) {
    editing = store.getProject(editId);
    if (!editing || !editing.founders.some((f) => f.accountId === me!.id)) {
      flow.hidden = true;
      gate.hidden = false;
      gate.querySelector("h1")!.textContent = "No encontramos ese proyecto";
      gate.querySelector("p")!.textContent = "Puede que no seas fundador o que ya no exista.";
      gate.querySelector(".gate-actions")!.innerHTML = '<a class="button button-primary" href="/mis-proyectos">Ir a Mis proyectos</a>';
      return;
    }
  }

  const saved = store.progress();
  let draft: ProjectDraft = editing ? toDraft(editing) : saved?.projectDraft ?? emptyDraft();
  let myRole: ProjectRole = editing ? editing.founders.find((f) => f.accountId === me!.id)!.role : saved?.myRole ?? "founder";
  let invites = editing ? [] : [...(saved?.invites ?? [])];
  let current: Step;

  if (editing) current = (ORDER.includes(params.get("paso") as Step) ? params.get("paso") : "info") as Step;
  else if (!me!.onboarded) current = "profile";
  else if (saved && PROJECT_STEPS.includes(saved.step)) current = saved.step;
  else current = wantsProject ? "info" : "ask";

  const persist = () => {
    if (editing || !PROJECT_STEPS.includes(current)) return;
    store.saveProgress({ step: current as OnboardingProgress["step"], projectDraft: draft, myRole, invites });
  };

  // ---- navigation -------------------------------------------------------
  function show(step: Step, focus = true) {
    current = step;
    root.querySelectorAll<HTMLElement>("[data-step]").forEach((el) => { el.hidden = el.dataset.step !== step; });
    const stepper = q("[data-stepper]");
    stepper.hidden = !PROJECT_STEPS.includes(step);
    stepper.querySelectorAll<HTMLElement>("li").forEach((li) => {
      const idx = ORDER.indexOf(li.dataset.s as Step);
      const now = ORDER.indexOf(step);
      li.classList.toggle("is-current", idx === now);
      li.classList.toggle("is-done", idx < now);
      if (idx === now) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
    q("[data-eyebrow]").textContent =
      step === "profile" ? "Tu perfil · paso 1 de 2" : step === "ask" ? "Tu proyecto · paso 2 de 2" :
      editing && PROJECT_STEPS.includes(step) ? `Editando ${editing.name}` : "";
    if (step === "founders") renderFounders();
    if (step === "review") renderReview();
    persist();
    if (focus) root.querySelector<HTMLElement>(`[data-step="${step}"] h1`)?.setAttribute("tabindex", "-1");
    if (focus) root.querySelector<HTMLElement>(`[data-step="${step}"] h1`)?.focus({ preventScroll: false });
  }

  const stepForm = (s: string) => q<HTMLFormElement>(`[data-step="${s}"]`);
  const val = (form: HTMLFormElement, name: string) => (form.elements.namedItem(name) as HTMLInputElement | null)?.value ?? "";

  // counters
  root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input[maxlength], textarea[maxlength]").forEach((el) => {
    const counter = root.querySelector<HTMLElement>(`[data-count="${el.name}"]`);
    if (!counter) return;
    const update = () => { counter.textContent = `${el.value.length}/${el.maxLength}`; };
    el.addEventListener("input", update);
    update();
  });

  // ---- 1. profile -------------------------------------------------------
  const profile = stepForm("profile");
  (profile.elements.namedItem("name") as HTMLInputElement).value = me!.name;
  (profile.elements.namedItem("role") as HTMLSelectElement).value = me!.role;
  (profile.elements.namedItem("city") as HTMLInputElement).value = me!.city;
  (profile.elements.namedItem("country") as HTMLInputElement).value = me!.country;
  (profile.elements.namedItem("bio") as HTMLTextAreaElement).value = me!.bio;
  profile.querySelectorAll<HTMLInputElement>('[name="inWhatsappGroup"]').forEach((r) => { r.checked = r.value === (me!.inWhatsappGroup ? "yes" : "no") && me!.onboarded; });
  profile.addEventListener("submit", (e) => {
    e.preventDefault();
    clearErrors(profile);
    const values = { city: val(profile, "city"), country: val(profile, "country"), role: val(profile, "role"), bio: val(profile, "bio") };
    const errors = validateProfile(values);
    const first = Object.entries(errors)[0];
    if (first) return setFieldError(profile, first[0], first[1]);
    const inGroup = profile.querySelector<HTMLInputElement>('[name="inWhatsappGroup"]:checked')?.value === "yes";
    const r = store.updateProfile({ name: val(profile, "name"), ...values, role: values.role as never, inWhatsappGroup: inGroup });
    if (!r.ok) return setFieldError(profile, r.field, r.error);
    store.completeOnboardingProfile();
    const back = params.get("volver");
    if (!wantsProject && back && !back.includes("origen=proyecto") && safeReturn(back, "") !== "") {
      // Came from a specific page: send them back there once the profile exists.
      return location.assign(safeReturn(back));
    }
    show(wantsProject ? "info" : "ask");
  });

  // ---- 2. ask -----------------------------------------------------------
  root.querySelector('[data-ask="yes"]')!.addEventListener("click", () => show("info"));
  root.querySelector('[data-ask="no"]')!.addEventListener("click", () => {
    q("[data-whatsapp-member]").hidden = !!store.currentAccount()?.inWhatsappGroup;
    root.querySelectorAll<HTMLAnchorElement>("[data-whatsapp-link]").forEach((a) => { a.href = WHATSAPP_GROUP_URL; });
    show("member");
  });

  // ---- 3. info ----------------------------------------------------------
  const info = stepForm("info");
  const fillInfo = () => {
    (info.elements.namedItem("website") as HTMLInputElement).value = draft.website;
    (info.elements.namedItem("name") as HTMLInputElement).value = draft.name;
    (info.elements.namedItem("short") as HTMLInputElement).value = draft.short;
    (info.elements.namedItem("long") as HTMLTextAreaElement).value = draft.long;
    (info.elements.namedItem("short") as HTMLInputElement).dispatchEvent(new Event("input"));
    showLogo();
  };
  const showLogo = () => {
    const preview = q("[data-logo-preview]", info);
    preview.innerHTML = draft.logo ? `<img src="${esc(draft.logo)}" alt="" />` : "+";
    q("[data-logo-text]", info).textContent = draft.logo ? "Cambiar logo" : "Sube el logo de tu proyecto";
  };
  const readInfo = () => {
    draft = { ...draft, website: val(info, "website"), name: val(info, "name"), short: val(info, "short"), long: val(info, "long") };
  };
  info.querySelector<HTMLInputElement>('[name="logo"]')!.addEventListener("change", async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      draft.logo = await readLogo(file);
      showLogo();
      clearErrors(info);
    } catch (err) {
      setFieldError(info, "logo", (err as Error).message);
    }
  });
  q("[data-autofill]", info).addEventListener("click", () => {
    const note = q("[data-autofill-note]", info);
    const raw = val(info, "website").trim();
    let host = "";
    try { host = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).hostname.replace(/^www\./, ""); } catch { /* handled below */ }
    // Mock: a real server reads title, meta description, OG image and favicon.
    if (!host.includes(".") || host.includes("fallo")) {
      note.textContent = "No pudimos leer esa web. Completa los datos a mano; puedes continuar igual.";
      note.hidden = false;
      return;
    }
    const label = host.split(".")[0]!;
    const nameField = info.elements.namedItem("name") as HTMLInputElement;
    const shortField = info.elements.namedItem("short") as HTMLInputElement;
    if (!nameField.value) nameField.value = label.charAt(0).toUpperCase() + label.slice(1);
    if (!shortField.value) { shortField.value = `Descubre ${nameField.value} en ${host}.`; shortField.dispatchEvent(new Event("input")); }
    note.textContent = "Autocompletado de prueba: revisa los datos antes de continuar.";
    note.hidden = false;
  });
  info.addEventListener("submit", (e) => {
    e.preventDefault();
    clearErrors(info);
    readInfo();
    const errors = validateProjectInfo(draft);
    const first = Object.entries(errors)[0];
    if (first) return setFieldError(info, first[0], first[1]);
    show("details");
  });

  // ---- 4. details -------------------------------------------------------
  const details = stepForm("details");
  const fillDetails = () => {
    (details.elements.namedItem("sector") as HTMLSelectElement).value = draft.sector;
    (details.elements.namedItem("stage") as HTMLSelectElement).value = draft.stage;
    (details.elements.namedItem("seekingInvestment") as HTMLInputElement).checked = draft.seekingInvestment;
    (details.elements.namedItem("city") as HTMLInputElement).value = draft.city;
    for (const k of ["instagram", "tiktok", "x", "linkedin"] as const) (details.elements.namedItem(k) as HTMLInputElement).value = draft.socials[k];
  };
  const readDetails = () => {
    draft = {
      ...draft, sector: val(details, "sector"), stage: val(details, "stage") as ProjectDraft["stage"],
      seekingInvestment: (details.elements.namedItem("seekingInvestment") as HTMLInputElement).checked,
      city: val(details, "city"),
      socials: { instagram: val(details, "instagram"), tiktok: val(details, "tiktok"), x: val(details, "x"), linkedin: val(details, "linkedin") },
    };
  };
  details.addEventListener("submit", (e) => {
    e.preventDefault();
    clearErrors(details);
    readDetails();
    const first = Object.entries(validateProjectDetails(draft))[0];
    if (first) return setFieldError(details, first[0], first[1]);
    show("founders");
  });

  // ---- 5. founders ------------------------------------------------------
  const foundersForm = stepForm("founders");
  const roleLabel = (r: string) => PROJECT_ROLES.find((x) => x.value === r)?.label ?? r;
  function renderFounders() {
    (foundersForm.elements.namedItem("myRole") as HTMLSelectElement).value = myRole;
    const list = q("[data-founder-list]", foundersForm);
    const rows: string[] = [];
    if (editing) {
      const project = store.getProject(editing.id)!;
      const admin = store.isAdmin(project);
      for (const f of project.founders) {
        const person = store.getAccount(f.accountId);
        if (!person) continue;
        rows.push(`<li class="founder-row">${avatarHtml(person)}<span class="founder-meta"><strong>${esc(person.name)}</strong><small>${esc(roleLabel(f.role))}${f.admin ? " · Administrador" : ""}</small></span>${
          admin && !f.admin ? `<button class="link-button" type="button" data-remove-founder="${esc(f.accountId)}">Quitar</button>` : ""}</li>`);
      }
      for (const inv of store.invitationsFor(project.id).filter((i) => i.status === "pending")) {
        rows.push(`<li class="founder-row is-pending"><span class="avatar">✉</span><span class="founder-meta"><strong>${esc(inv.email)}</strong><small>Invitación pendiente · ${esc(roleLabel(inv.role))}</small></span>
          <button class="link-button" type="button" data-accept="${esc(inv.id)}">Simular aceptación</button>
          <button class="link-button" type="button" data-revoke="${esc(inv.id)}">Cancelar</button></li>`);
      }
    } else {
      rows.push(`<li class="founder-row">${avatarHtml(me!)}<span class="founder-meta"><strong>${esc(me!.name)} (tú)</strong><small>${esc(roleLabel(myRole))} · Administrador</small></span></li>`);
      invites.forEach((inv, i) => rows.push(`<li class="founder-row is-pending"><span class="avatar">✉</span><span class="founder-meta"><strong>${esc(inv.email)}</strong><small>Se invitará al publicar · ${esc(roleLabel(inv.role))}</small></span><button class="link-button" type="button" data-drop-invite="${i}">Quitar</button></li>`));
    }
    list.innerHTML = rows.join("");
    q<HTMLElement>('[data-field="myRole"]', foundersForm).hidden = !!editing;
    q<HTMLElement>(".invite-row", foundersForm).hidden = !!editing && !store.isAdmin(store.getProject(editing.id)!);
  }
  foundersForm.addEventListener("click", (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>("button");
    if (!t) return;
    if (t.dataset.dropInvite) { invites.splice(Number(t.dataset.dropInvite), 1); persist(); renderFounders(); }
    if (t.dataset.revoke) { store.revokeInvitation(t.dataset.revoke); renderFounders(); }
    if (t.dataset.accept) {
      const r = store.acceptInvitation(t.dataset.accept);
      if (!r.ok) setFieldError(foundersForm, "inviteEmail", r.error); else renderFounders();
    }
    if (t.dataset.removeFounder && editing) {
      const r = store.removeFounder(editing.id, t.dataset.removeFounder);
      if (!r.ok) setFieldError(foundersForm, "inviteEmail", r.error); else renderFounders();
    }
  });
  foundersForm.querySelector("[data-invite]")!.addEventListener("click", () => {
    clearErrors(foundersForm);
    const email = val(foundersForm, "inviteEmail").trim().toLowerCase();
    const role = val(foundersForm, "inviteRole") as ProjectRole;
    const field = q('[data-field="inviteEmail"]', foundersForm);
    const showErr = (msg: string) => { const slot = foundersForm.querySelector<HTMLElement>(":scope > [data-error]")!; slot.textContent = msg; slot.hidden = false; };
    void field;
    if (editing) {
      const r = store.invite(editing.id, email, role);
      if (!r.ok) return showErr(r.error);
    } else {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return showErr("Escribe un correo válido.");
      if (email === me!.email) return showErr("Ese es tu propio correo.");
      if (invites.some((i) => i.email === email)) return showErr("Ya agregaste ese correo.");
      invites.push({ email, role });
      persist();
    }
    (foundersForm.elements.namedItem("inviteEmail") as HTMLInputElement).value = "";
    renderFounders();
  });
  foundersForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!editing) myRole = val(foundersForm, "myRole") as ProjectRole;
    show("review");
  });

  // ---- 6. review --------------------------------------------------------
  function renderReview() {
    const host = (() => { try { return new URL(/^https?:\/\//i.test(draft.website) ? draft.website : `https://${draft.website}`).hostname.replace(/^www\./, ""); } catch { return draft.website; } })();
    const founderNames = editing
      ? store.getProject(editing.id)!.founders.map((f) => store.getAccount(f.accountId)?.name).filter(Boolean)
      : [me!.name];
    q("[data-review]").innerHTML = `
      <div class="review-grid">
        <article class="review-card" aria-label="Tarjeta en el directorio">
          <span class="project-logo">${draft.logo ? `<img src="${esc(draft.logo)}" alt="" />` : ""}</span>
          <div><h2>${esc(draft.name)}</h2><p>${esc(draft.short)}</p>
          <p class="chips"><span class="chip">${esc(draft.sector)}</span><span class="chip chip--stage">${esc(draft.stage)}</span>${draft.seekingInvestment ? '<span class="chip">Busca inversión</span>' : ""}</p></div>
        </article>
        <dl class="review-list">
          <div><dt>Web</dt><dd>${esc(host)}</dd></div>
          ${draft.city ? `<div><dt>Ciudad base</dt><dd>${esc(draft.city)}</dd></div>` : ""}
          <div><dt>Fundadores</dt><dd>${esc(founderNames.join(", "))}${!editing && invites.length ? ` + ${invites.length} invitación(es)` : ""}</dd></div>
          ${draft.long ? `<div><dt>Descripción larga</dt><dd>${esc(draft.long)}</dd></div>` : ""}
        </dl>
      </div>`;
    const publish = root.querySelector<HTMLElement>("[data-publish-label]")!;
    const draftBtn = root.querySelector<HTMLElement>('[data-save="draft"]')!;
    if (editing) {
      const isDraft = editing.status === "draft";
      publish.textContent = isDraft ? "Publicar" : "Guardar cambios";
      publish.dataset.save = isDraft ? "published" : "keep";
      draftBtn.hidden = !isDraft;
      draftBtn.textContent = "Guardar borrador";
    }
  }
  stepForm("review").addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-save]");
    if (!btn) return;
    const mode = btn.dataset.save as "draft" | "published" | "keep";
    const review = stepForm("review");
    clearErrors(review);
    let project: Project;
    if (editing) {
      const r = store.updateProject(editing.id, draft, mode === "keep" ? undefined : mode === "draft" ? "draft" : "published");
      if (!r.ok) return setFieldError(review, undefined, r.error);
      project = r.value;
    } else {
      const r = store.createProject(draft, mode === "draft" ? "draft" : "published", myRole);
      if (!r.ok) return setFieldError(review, undefined, r.error);
      project = r.value;
      invites.forEach((inv) => store.invite(project.id, inv.email, inv.role));
      store.clearProgress();
    }
    finish(project, mode);
  });

  function finish(project: Project, mode: string) {
    const published = project.status === "published";
    q("[data-done-title]").textContent = editing ? "Cambios guardados" : published ? "¡Tu proyecto está publicado!" : "Borrador guardado";
    q("[data-done-lead]").textContent = published
      ? "Ya tiene una página pública que cualquiera puede ver."
      : "Lo ves en Mis proyectos, en la pestaña Borradores. Publícalo cuando quieras.";
    q("[data-done-card]").innerHTML = `
      <div class="review-card">
        <span class="project-logo">${project.logo ? `<img src="${esc(project.logo)}" alt="" />` : ""}</span>
        <div><h2>${esc(project.name)}</h2>
        <p class="chips"><span class="chip chip--stage">${esc(project.stage)}</span><span class="chip">${published ? "Publicado" : "Borrador"}</span></p>
        ${published ? `<p><a href="/proyectos/${esc(project.slug)}">Ver página pública →</a></p>` : ""}</div>
      </div>`;
    const showGroup = !store.currentAccount()?.inWhatsappGroup;
    q("[data-whatsapp]").hidden = !showGroup || !!editing;
    root.querySelectorAll<HTMLAnchorElement>("[data-whatsapp-link]").forEach((a) => { a.href = WHATSAPP_GROUP_URL; });
    q<HTMLElement>("[data-another]").hidden = !!editing;
    void mode;
    show("done");
  }

  root.querySelector("[data-another]")!.addEventListener("click", () => {
    draft = emptyDraft(); myRole = "founder"; invites = []; editing = null;
    history.replaceState(null, "", "/onboarding?origen=proyecto");
    fillInfo(); fillDetails();
    show("info");
  });

  // back buttons
  root.querySelectorAll<HTMLElement>("[data-back]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (current === "info") readInfo(); if (current === "details") readDetails();
      if (current === "founders" && !editing) myRole = val(foundersForm, "myRole") as ProjectRole;
      const i = ORDER.indexOf(current);
      if (i > 0) show(ORDER[i - 1]!);
      else show("ask");
    });
  });

  fillInfo();
  fillDetails();
  show(current, false);
}

function toDraft(p: Project): ProjectDraft {
  return {
    name: p.name, logo: p.logo, website: p.website, short: p.short, long: p.long, sector: p.sector,
    stage: p.stage, seekingInvestment: p.seekingInvestment, socials: { ...p.socials }, city: p.city,
  };
}
