import { beforeEach, describe, expect, it } from "vitest";
import { AccountsStore, MOCK_CODE, emptyDraft, memoryStorage } from "../src/lib/accounts/store";
import { slugify, uniqueSlug } from "../src/lib/accounts/slug";
import type { ProjectDraft } from "../src/lib/accounts/types";

const draft = (over: Partial<ProjectDraft> = {}): ProjectDraft => ({
  ...emptyDraft(), name: "Mi Proyecto", website: "miproyecto.com", short: "Una frase que describe el proyecto.",
  logo: "data:image/png;base64,AAAA", sector: "Fintech", stage: "MVP", ...over,
});

function signedUp(store: AccountsStore, email = "nuevo@example.com") {
  store.signUp({ name: "Persona Nueva", email, password: "secreta123", human: true });
  store.verifyCode(MOCK_CODE);
}

describe("slugs", () => {
  it("folds accents and punctuation", () => {
    expect(slugify("Pana Pay!")).toBe("pana-pay");
    expect(slugify("Educación & Más")).toBe("educacion-mas");
  });
  it("adds a counter on a clash", () => {
    expect(uniqueSlug("Pana Pay", ["pana-pay", "pana-pay-2"])).toBe("pana-pay-3");
    expect(uniqueSlug("!!!", [])).toBe("proyecto");
  });
});

describe("accounts store", () => {
  let store: AccountsStore;
  beforeEach(() => { store = new AccountsStore(memoryStorage()); });

  it("signs up, verifies by code and opens a session", () => {
    expect(store.signUp({ name: "Ana Pérez", email: "Ana@Example.com", password: "12345678", human: true }).ok).toBe(true);
    expect(store.currentAccount()).toBeNull();
    expect(store.pendingEmail()).toBe("ana@example.com");
    const wrong = store.verifyCode("000000");
    expect(wrong).toMatchObject({ ok: false, field: "code" });
    expect(store.verifyCode(MOCK_CODE).ok).toBe(true);
    expect(store.currentAccount()?.emailVerified).toBe(true);
  });

  it("rejects bad sign-ups with Spanish tuteo messages", () => {
    const short = store.signUp({ name: "Ana", email: "ana@example.com", password: "123", human: true });
    expect(short).toMatchObject({ ok: false, field: "password" });
    const robot = store.signUp({ name: "Ana", email: "ana@example.com", password: "12345678", human: false });
    expect(robot).toMatchObject({ ok: false, field: "human" });
    signedUp(store, "dup@example.com");
    const dup = store.signUp({ name: "Otra", email: "DUP@example.com", password: "12345678", human: true });
    expect(dup).toMatchObject({ ok: false, field: "email", error: "Ese correo ya está registrado. Entra con tu cuenta." });
  });

  it("signs in, and explains wrong password and Google-only accounts", () => {
    signedUp(store);
    store.signOut();
    expect(store.signIn({ email: "nuevo@example.com", password: "mala" })).toMatchObject({ ok: false, error: "La contraseña es incorrecta." });
    expect(store.signIn({ email: "marta@example.com", password: "x" })).toMatchObject({ ok: false, error: expect.stringContaining("Google") });
    expect(store.signIn({ email: "nuevo@example.com", password: "secreta123" })).toMatchObject({ ok: true });
  });

  it("links Google to the account that already has that email", () => {
    store.signUp({ name: "Yo", email: "tu.cuenta@gmail.com", password: "12345678", human: true });
    const r = store.signInWithGoogle();
    expect(r).toMatchObject({ ok: true, value: { isNew: false } });
    expect(store.currentAccount()).toMatchObject({ hasGoogle: true, emailVerified: true });
    expect(store.currentAccount()?.password).toBe("12345678");
  });

  it("lets a Google account add a password later", () => {
    store.signInWithGoogle();
    expect(store.setPassword({ next: "corta" })).toMatchObject({ ok: false });
    expect(store.setPassword({ next: "nueva-clave-1" }).ok).toBe(true);
    expect(store.setPassword({ current: "mala", next: "otra-clave-22" })).toMatchObject({ ok: false, field: "current" });
  });

  it("persists across instances on the same storage", () => {
    const storage = memoryStorage();
    const a = new AccountsStore(storage);
    signedUp(a);
    expect(new AccountsStore(storage).currentAccount()?.email).toBe("nuevo@example.com");
  });
});

describe("projects", () => {
  let store: AccountsStore;
  beforeEach(() => { store = new AccountsStore(memoryStorage()); signedUp(store); });

  it("requires the logo and the key fields", () => {
    expect(store.createProject(draft({ logo: null }), "published")).toMatchObject({ ok: false, field: "logo", error: "Sube el logo de tu proyecto." });
    expect(store.createProject(draft({ website: "no es una web" }), "published")).toMatchObject({ ok: false, field: "website" });
    expect(store.createProject(draft({ stage: "" }), "published")).toMatchObject({ ok: false, field: "stage" });
  });

  it("creates projects owned by the account, each with its own stage", () => {
    const a = store.createProject(draft({ name: "Uno", stage: "Idea" }), "published");
    const b = store.createProject(draft({ name: "Dos", stage: "Crecimiento" }), "draft");
    expect(a.ok && b.ok).toBe(true);
    expect(store.myProjects().map((p) => p.stage).sort()).toEqual(["Crecimiento", "Idea"]);
    expect(store.myProjects("draft")).toHaveLength(1);
    const first = (a as { ok: true; value: { founders: unknown[]; website: string } }).value;
    expect(first.founders).toEqual([{ accountId: store.currentAccount()!.id, role: "founder", admin: true }]);
    expect(first.website).toBe("https://miproyecto.com");
  });

  it("generates unique slugs and redirects old ones after a rename", () => {
    const one = store.createProject(draft({ name: "Pana Pay" }), "published");
    const slug = (one as { ok: true; value: { slug: string; id: string } }).value;
    expect(slug.slug).toBe("pana-pay-2"); // "pana-pay" belongs to the seed
    store.changeSlug(slug.id, "Mi Nueva URL");
    expect(store.resolveSlug("mi-nueva-url")).toMatchObject({ redirect: false });
    expect(store.resolveSlug("pana-pay-2")).toMatchObject({ redirect: true });
    expect(store.resolveSlug("no-existe")).toBeNull();
  });

  it("only founders edit; only the administrator archives and invites", () => {
    const made = store.createProject(draft(), "published") as { ok: true; value: { id: string } };
    const id = made.value.id;
    expect(store.setStatus(id, "archived").ok).toBe(true);
    store.signOut();
    store.signInWithGoogle(); // another person
    expect(store.updateProject(id, draft({ name: "Hackeado" }))).toMatchObject({ ok: false });
    expect(store.setStatus(id, "published")).toMatchObject({ ok: false });
    expect(store.invite(id, "x@example.com", "cofounder")).toMatchObject({ ok: false });
  });

  it("invites a cofounder who accepts and appears on the project", () => {
    const made = store.createProject(draft(), "published") as { ok: true; value: { id: string } };
    const id = made.value.id;
    expect(store.invite(id, "malo", "cofounder")).toMatchObject({ ok: false, field: "email" });
    const inv = store.invite(id, "marta@example.com", "cofounder") as { ok: true; value: { id: string } };
    expect(inv.ok).toBe(true);
    expect(store.invite(id, "MARTA@example.com", "cofounder")).toMatchObject({ ok: false });
    expect(store.acceptInvitation(inv.value.id).ok).toBe(true);
    expect(store.getProject(id)!.founders.map((f) => f.accountId)).toContain("acc_marta");
    expect(store.removeFounder(id, store.currentAccount()!.id)).toMatchObject({ ok: false });
    expect(store.removeFounder(id, "acc_marta").ok).toBe(true);
  });

  it("resumes onboarding where it was left", () => {
    expect(store.progress()).toBeNull();
    store.saveProgress({ step: "details", projectDraft: draft(), myRole: "founder", invites: [] });
    expect(new AccountsStore((store as unknown as { storage: never }).storage).progress()?.step).toBe("details");
    store.clearProgress();
    expect(store.progress()).toBeNull();
  });
});

describe("visibility", () => {
  const store = new AccountsStore(memoryStorage());

  it("gives a guest only the card, never profile or contact", () => {
    const view = store.publicProfile("acc_lucia", false)!;
    expect(view.profile).toBeNull();
    expect(JSON.stringify(view)).not.toMatch(/412|linkedin|panapay|lucia@example/);
  });

  it("shows members what the founder left visible, never the login email", () => {
    const view = store.publicProfile("acc_lucia", true)!;
    const keys = view.profile!.contacts.map((c) => c.key).sort();
    expect(keys).toEqual(["contactEmail", "linkedin", "phone"]);
    expect(JSON.stringify(view)).not.toContain("lucia@example.com");
  });

  it("hides contacts marked as hidden", () => {
    const view = store.publicProfile("acc_andres", true)!;
    expect(view.profile!.contacts.map((c) => c.key).sort()).toEqual(["linkedin", "x"]);
  });
});

describe("account deletion", () => {
  it("removes the account and orphaned projects, keeps shared ones", () => {
    const store = new AccountsStore(memoryStorage());
    store.signUp({ name: "Borrar Yo", email: "borrar@example.com", password: "12345678", human: true });
    store.verifyCode(MOCK_CODE);
    store.createProject(draft({ name: "Solo mío" }), "published");
    expect(store.deleteAccount().ok).toBe(true);
    expect(store.currentAccount()).toBeNull();
    expect(store.publishedProjects().some((p) => p.name === "Solo mío")).toBe(false);
  });
});

describe("promotions", () => {
  function founderWithProject() {
    const store = new AccountsStore(memoryStorage());
    store.signUp({ name: "Fundador Pago", email: "pago@example.com", password: "clave12345", human: true });
    store.verifyCode(MOCK_CODE);
    const made = store.createProject(draft({ name: "Pagable" }), "published") as { ok: true; value: { id: string } };
    return { store, projectId: made.value.id };
  }
  const brief = "Queremos contar cómo pasamos de cero a cien clientes.";

  it("creates a $300 order pending payment, then pays it", () => {
    const { store, projectId } = founderWithProject();
    const r = store.createPromotionOrder(projectId, brief);
    expect(r).toMatchObject({ ok: true, value: { status: "pending_payment", amountUsd: 300, paidAt: null } });
    const id = (r as { ok: true; value: { id: string } }).value.id;
    expect(store.promotionOrders()[0]).toMatchObject({ id, project: { name: "Pagable" } });
    expect(store.payPromotionOrder(id)).toMatchObject({ ok: true, value: { status: "paid" } });
    expect(store.payPromotionOrder(id)).toMatchObject({ ok: false });
    expect(store.cancelPromotionOrder(id)).toMatchObject({ ok: false });
  });

  it("validates the brief and the project", () => {
    const { store, projectId } = founderWithProject();
    expect(store.createPromotionOrder(projectId, "corto")).toMatchObject({ ok: false, field: "brief" });
    expect(store.createPromotionOrder(projectId, "x".repeat(601))).toMatchObject({ ok: false, field: "brief" });
    expect(store.createPromotionOrder("prj_panapay", brief)).toMatchObject({ ok: false, field: "project" }); // not theirs
    store.setStatus(projectId, "draft");
    expect(store.createPromotionOrder(projectId, brief)).toMatchObject({ ok: false, field: "project" });
  });

  it("blocks a second pending order for the same project, and lets unpaid orders be cancelled", () => {
    const { store, projectId } = founderWithProject();
    const first = store.createPromotionOrder(projectId, brief) as { ok: true; value: { id: string } };
    expect(store.createPromotionOrder(projectId, brief)).toMatchObject({ ok: false, field: "project" });
    expect(store.cancelPromotionOrder(first.value.id).ok).toBe(true);
    expect(store.promotionOrders()).toEqual([]);
    expect(store.createPromotionOrder(projectId, brief).ok).toBe(true);
  });

  it("keeps orders private to their owner and removes them with the account", () => {
    const { store, projectId } = founderWithProject();
    store.createPromotionOrder(projectId, brief);
    store.signOut();
    store.signInWithGoogle();
    expect(store.promotionOrders()).toEqual([]);
    store.signOut();
    store.signIn({ email: "pago@example.com", password: "clave12345" });
    expect(store.promotionOrders()).toHaveLength(1);
    store.deleteAccount();
    store.signInWithGoogle();
    expect(store.promotionOrders()).toEqual([]);
  });
});
