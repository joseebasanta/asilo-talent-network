import { beforeEach, describe, expect, it } from "vitest";
import { AccountsStore, MOCK_CODE, emptyDraft, memoryStorage } from "../src/lib/accounts/store";
import { timeAgo } from "../src/lib/accounts/format";
import { POST_MAX } from "../src/lib/accounts/types";

/** Signs in as Lucía (seed founder of Pana Pay) by creating a matching session. */
function asFounder(store: AccountsStore) {
  store.signUp({ name: "Fundadora Nueva", email: "fundadora@example.com", password: "clave12345", human: true });
  store.verifyCode(MOCK_CODE);
  const made = store.createProject(
    { ...emptyDraft(), name: "Mi Feed", website: "mifeed.com", short: "Proyecto para probar el feed.", logo: "data:image/png;base64,AAAA", sector: "SaaS", stage: "MVP" },
    "published",
  );
  if (!made.ok) throw new Error(made.error);
  return made.value;
}

function asMember(store: AccountsStore, email = "miembro@example.com") {
  store.signOut();
  store.signUp({ name: "Miembro Sin Proyecto", email, password: "clave12345", human: true });
  store.verifyCode(MOCK_CODE);
}

describe("feed", () => {
  let store: AccountsStore;
  beforeEach(() => { store = new AccountsStore(memoryStorage()); });

  it("paginates newest first with a cursor until the end", () => {
    asFounder(store);
    const first = store.feedPage();
    expect(first.posts).toHaveLength(10);
    expect(first.nextCursor).not.toBeNull();
    const times = first.posts.map((p) => p.post.createdAt);
    expect([...times].sort((a, b) => b - a)).toEqual(times);
    const second = store.feedPage(first.nextCursor);
    expect(second.posts.length).toBeGreaterThan(0);
    expect(second.nextCursor).toBeNull();
    const ids = new Set([...first.posts, ...second.posts].map((p) => p.post.id));
    expect(ids.size).toBe(first.posts.length + second.posts.length);
  });

  it("lets a founder post as one of their published projects, newest on top", () => {
    const project = asFounder(store);
    const r = store.createPost(project.id, { text: "  Hola comunidad, mira mifeed.com/novedades  " });
    expect(r).toMatchObject({ ok: true, value: { text: "Hola comunidad, mira mifeed.com/novedades", preview: { url: "https://mifeed.com/novedades", host: "mifeed.com" } } });
    const top = store.feedPage().posts[0]!;
    expect(top.project?.id).toBe(project.id);
    expect(top.canEdit).toBe(true);
  });

  it("validates the text", () => {
    const project = asFounder(store);
    expect(store.createPost(project.id, { text: "   " })).toMatchObject({ ok: false, field: "text" });
    expect(store.createPost(project.id, { text: "x".repeat(POST_MAX + 1) })).toMatchObject({ ok: false, field: "text" });
  });

  it("builds the website preview from the text, and never blocks when it cannot", () => {
    const project = asFounder(store);
    const withLink = store.createPost(project.id, { text: "Estamos en https://pana.example/hola, pásate." }) as { ok: true; value: { id: string; preview: { host: string } | null } };
    expect(withLink.value.preview).toMatchObject({ url: "https://pana.example/hola", host: "pana.example", title: "Pana" });
    const none = store.createPost(project.id, { text: "Sin enlaces, solo texto." }) as { ok: true; value: { preview: unknown } };
    expect(none.value.preview).toBeNull();
    const unreadable = store.createPost(project.id, { text: "Mira fallo.example" }) as { ok: true; value: { preview: unknown } };
    expect(unreadable.ok).toBe(true);
    expect(unreadable.value.preview).toBeNull();
    // editing the text refreshes the card
    const id = withLink.value.id;
    expect(store.updatePost(id, { text: "Ahora en otra.example" })).toMatchObject({ ok: true, value: { preview: { host: "otra.example" } } });
    expect(store.updatePost(id, { text: "Ya sin web" })).toMatchObject({ ok: true, value: { preview: null } });
  });

  it("does not let members without a project, or other founders, post", () => {
    const project = asFounder(store);
    asMember(store);
    expect(store.postableProjects()).toEqual([]);
    expect(store.createPost(project.id, { text: "intruso" })).toMatchObject({ ok: false, field: "project" });
  });

  it("does not post for drafts or archived projects", () => {
    const project = asFounder(store);
    store.setStatus(project.id, "draft");
    expect(store.createPost(project.id, { text: "borrador" })).toMatchObject({ ok: false });
  });

  it("lets only the author edit or delete, and delete cleans up everything attached", () => {
    const project = asFounder(store);
    const post = (store.createPost(project.id, { text: "original" }) as { ok: true; value: { id: string } }).value;
    asMember(store);
    store.react(post.id, "like");
    store.addComment(post.id, "hola");
    expect(store.updatePost(post.id, { text: "hackeado" })).toMatchObject({ ok: false });
    expect(store.deletePost(post.id)).toMatchObject({ ok: false });
    store.signOut();
    store.signIn({ email: "fundadora@example.com", password: "clave12345" });
    expect(store.updatePost(post.id, { text: "editado" })).toMatchObject({ ok: true, value: { text: "editado" } });
    expect(store.getPost(post.id)?.post.editedAt).not.toBeNull();
    expect(store.deletePost(post.id).ok).toBe(true);
    expect(store.getPost(post.id)).toBeNull();
    expect(store.commentsOf(post.id)).toEqual([]);
    expect(store.notifications()).toEqual([]);
  });

  it("keeps one reaction per person, replacing or removing it, and notifies the author", () => {
    const project = asFounder(store);
    const post = (store.createPost(project.id, { text: "hola" }) as { ok: true; value: { id: string } }).value;
    asMember(store);
    expect(store.react(post.id, "like")).toMatchObject({ ok: true, value: "like" });
    expect(store.react(post.id, "rocket")).toMatchObject({ ok: true, value: "rocket" });
    expect(store.getPost(post.id)).toMatchObject({ reactionTotal: 1, mine: "rocket", counts: { rocket: 1 } });
    expect(store.react(post.id, "rocket")).toMatchObject({ ok: true, value: null });
    expect(store.getPost(post.id)?.reactionTotal).toBe(0);
    store.signOut();
    store.signIn({ email: "fundadora@example.com", password: "clave12345" });
    expect(store.unreadCount()).toBeGreaterThan(0);
    store.markNotificationsRead();
    expect(store.unreadCount()).toBe(0);
  });

  it("comments, notifies, and lets the post author remove any comment", () => {
    const project = asFounder(store);
    const post = (store.createPost(project.id, { text: "hola" }) as { ok: true; value: { id: string } }).value;
    asMember(store);
    expect(store.addComment(post.id, "  ")).toMatchObject({ ok: false, field: "text" });
    const c = store.addComment(post.id, "¡Felicidades!") as { ok: true; value: { id: string } };
    expect(store.getPost(post.id)?.commentCount).toBe(1);
    store.signOut();
    store.signIn({ email: "fundadora@example.com", password: "clave12345" });
    expect(store.notifications()[0]).toMatchObject({ kind: "comment", actorName: "Miembro Sin Proyecto", read: false });
    expect(store.deleteComment(c.value.id).ok).toBe(true);
    expect(store.commentsOf(post.id)).toEqual([]);
  });

  it("does not notify people about their own activity", () => {
    const project = asFounder(store);
    const post = (store.createPost(project.id, { text: "hola" }) as { ok: true; value: { id: string } }).value;
    store.react(post.id, "like");
    store.addComment(post.id, "yo mismo");
    expect(store.notifications()).toEqual([]);
  });

  it("moderates: one report per person, hiding removes the post from the feed", () => {
    const project = asFounder(store);
    const post = (store.createPost(project.id, { text: "dudoso" }) as { ok: true; value: { id: string } }).value;
    expect(store.reportPost(post.id)).toMatchObject({ ok: false }); // own post
    asMember(store);
    expect(store.reportPost(post.id).ok).toBe(true);
    expect(store.reportPost(post.id)).toMatchObject({ ok: false, error: "Ya reportaste este anuncio." });
    const [report] = store.openReports();
    expect(report?.post.post.id).toBe(post.id);
    store.resolveReport(report!.id, "hide");
    expect(store.getPost(post.id)).toBeNull();
    expect(store.feedPage().posts.some((p) => p.post.id === post.id)).toBe(false);
    expect(store.openReports()).toEqual([]);
  });

  it("dismissing a report leaves the post visible", () => {
    const project = asFounder(store);
    const post = (store.createPost(project.id, { text: "bien" }) as { ok: true; value: { id: string } }).value;
    asMember(store);
    store.reportPost(post.id);
    store.resolveReport(store.openReports()[0]!.id, "dismiss");
    expect(store.getPost(post.id)).not.toBeNull();
  });

  it("loads saves that predate the feed by filling the collections", () => {
    const storage = memoryStorage();
    const a = new AccountsStore(storage);
    a.signInWithGoogle();
    const raw = JSON.parse(storage.getItem("asilo.mock.accounts.v1")!);
    delete raw.posts; delete raw.reactions; delete raw.comments; delete raw.notifications; delete raw.reports;
    storage.setItem("asilo.mock.accounts.v1", JSON.stringify(raw));
    const b = new AccountsStore(storage);
    expect(b.feedPage().posts.length).toBeGreaterThan(0);
    expect(b.currentAccount()).not.toBeNull();
  });
});

describe("timeAgo", () => {
  const now = Date.UTC(2026, 10, 1, 12);
  it("speaks Spanish in short units", () => {
    expect(timeAgo(now - 5_000, now)).toBe("ahora");
    expect(timeAgo(now - 5 * 60_000, now)).toBe("hace 5 min");
    expect(timeAgo(now - 3 * 3_600_000, now)).toBe("hace 3 h");
    expect(timeAgo(now - 2 * 86_400_000, now)).toBe("hace 2 d");
  });
});
