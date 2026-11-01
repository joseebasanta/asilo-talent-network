/**
 * Mock accounts store (frontend-only stage).
 *
 * Pure TypeScript over a `StorageLike`, so it runs in the browser on
 * `localStorage` and in tests on a plain object. Nothing leaves the browser.
 * The method names and result shapes are the contract the real backend has to
 * honour; swapping it in means re-implementing this class against the API.
 *
 * Mock conveniences, not for production: passwords are kept in clear text and
 * the email code is always `MOCK_CODE`.
 */
import { seedState } from "./seed";
import { uniqueSlug } from "./slug";
import {
  PASSWORD_MIN, normalizeEmail, normalizeUrl, validateProfile, validateProjectDetails, validateProjectInfo,
  validateSignIn, validateSignUp, isEmail,
} from "./validation";
import { previewFor } from "./link-preview";
import { COMMENT_MAX, FEED_PAGE_SIZE, POST_MAX, PROMO_BLOG } from "./types";
import type {
  Comment, Notification, Post, PromotionOrder, ReactionKind, Report,
  Account, ContactKey, Invitation, OnboardingProgress, Project, ProjectDraft, ProjectRole, ProjectStatus, Result, StoreState,
} from "./types";

export const STORAGE_KEY = "asilo.mock.accounts.v1";
export const MOCK_CODE = "123456";
export const GOOGLE_DEMO_EMAIL = "tu.cuenta@gmail.com";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function memoryStorage(): StorageLike {
  const data = new Map<string, string>();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

function feedDefaults(saved: Partial<StoreState>): Pick<StoreState, "posts" | "reactions" | "comments" | "notifications" | "reports" | "promotions"> {
  const seeded = saved.posts ? null : seedState();
  return {
    posts: saved.posts ?? seeded!.posts, reactions: saved.reactions ?? seeded!.reactions, comments: saved.comments ?? seeded!.comments,
    notifications: saved.notifications ?? [], reports: saved.reports ?? [], promotions: saved.promotions ?? [],
  };
}

const ok = <T,>(value: T): Result<T> => ({ ok: true, value });
const fail = (error: string, field?: string): Result<never> => ({ ok: false, error, field });
const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

export type PostView = {
  post: Post;
  project: Project | null;
  author: { id: string; name: string; photo: string | null };
  counts: Partial<Record<ReactionKind, number>>;
  reactionTotal: number;
  mine: ReactionKind | null;
  commentCount: number;
  canEdit: boolean;
  reported: boolean;
};

export function emptyDraft(): ProjectDraft {
  return {
    name: "", logo: null, website: "", short: "", long: "", sector: "", stage: "",
    seekingInvestment: false, socials: { instagram: "", tiktok: "", x: "", linkedin: "" }, city: "",
  };
}

export class AccountsStore {
  private state: StoreState;

  constructor(private storage: StorageLike) {
    this.state = this.load();
  }

  private load(): StoreState {
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoreState;
        // Older saves predate the feed: fill the missing collections.
        if (parsed?.version === 1) return { ...seedState(), ...parsed, ...feedDefaults(parsed) };
      }
    } catch { /* corrupt or unavailable storage: start from the seed */ }
    return seedState();
  }

  private save(): void {
    try { this.storage.setItem(STORAGE_KEY, JSON.stringify(this.state)); } catch { /* quota or private mode */ }
  }

  /** Re-read storage, so a second tab's changes are visible. */
  refresh(): void { this.state = this.load(); }

  reset(): void {
    this.state = seedState();
    this.save();
  }

  // ---- session --------------------------------------------------------

  currentAccount(): Account | null {
    const id = this.state.sessionAccountId;
    return id ? this.state.accounts.find((a) => a.id === id) ?? null : null;
  }

  getAccount(id: string): Account | null {
    return this.state.accounts.find((a) => a.id === id) ?? null;
  }

  private byEmail(email: string): Account | undefined {
    const key = normalizeEmail(email);
    return this.state.accounts.find((a) => a.email === key);
  }

  signUp(input: { name: string; email: string; password: string; human: boolean }): Result<{ needsCode: true }> {
    const errors = validateSignUp(input);
    const first = Object.entries(errors)[0];
    if (first) return fail(first[1], first[0]);
    if (this.byEmail(input.email)) return fail("Ese correo ya está registrado. Entra con tu cuenta.", "email");

    const created: Account = {
      id: uid("acc"), name: input.name.trim(), email: normalizeEmail(input.email), emailVerified: false,
      password: input.password, hasGoogle: false, photo: null, city: "", country: "", role: "", bio: "",
      inWhatsappGroup: false,
      contacts: {
        phone: { value: "", visibility: "registrados" }, contactEmail: { value: "", visibility: "registrados" },
        linkedin: { value: "", visibility: "registrados" }, x: { value: "", visibility: "registrados" },
      },
      onboarded: false, createdAt: Date.now(),
    };
    this.state.accounts.push(created);
    this.state.pendingVerification = { accountId: created.id, code: MOCK_CODE };
    this.save();
    return ok({ needsCode: true });
  }

  signIn(input: { email: string; password: string }): Result<{ account: Account; needsCode: boolean }> {
    const errors = validateSignIn(input);
    const first = Object.entries(errors)[0];
    if (first) return fail(first[1], first[0]);
    const found = this.byEmail(input.email);
    if (!found) return fail("No encontramos una cuenta con ese correo.", "email");
    if (found.password === null) return fail("Esta cuenta entra con Google. Usa “Continuar con Google”.", "email");
    if (found.password !== input.password) return fail("La contraseña es incorrecta.", "password");
    if (!found.emailVerified) {
      this.state.pendingVerification = { accountId: found.id, code: MOCK_CODE };
      this.save();
      return ok({ account: found, needsCode: true });
    }
    this.state.sessionAccountId = found.id;
    this.save();
    return ok({ account: found, needsCode: false });
  }

  /** Demo Google sign-in. An existing account with that email is linked, not duplicated. */
  signInWithGoogle(): Result<{ account: Account; isNew: boolean }> {
    let found = this.byEmail(GOOGLE_DEMO_EMAIL);
    let isNew = false;
    if (found) {
      found.hasGoogle = true;
      found.emailVerified = true;
    } else {
      isNew = true;
      found = {
        id: uid("acc"), name: "Tu Nombre", email: GOOGLE_DEMO_EMAIL, emailVerified: true, password: null,
        hasGoogle: true, photo: null, city: "", country: "", role: "", bio: "", inWhatsappGroup: false,
        contacts: {
          phone: { value: "", visibility: "registrados" }, contactEmail: { value: "", visibility: "registrados" },
          linkedin: { value: "", visibility: "registrados" }, x: { value: "", visibility: "registrados" },
        },
        onboarded: false, createdAt: Date.now(),
      };
      this.state.accounts.push(found);
    }
    this.state.sessionAccountId = found.id;
    this.save();
    return ok({ account: found, isNew });
  }

  pendingEmail(): string | null {
    const pending = this.state.pendingVerification;
    return pending ? this.getAccount(pending.accountId)?.email ?? null : null;
  }

  resendCode(): Result {
    if (!this.state.pendingVerification) return fail("No hay una verificación pendiente.");
    return ok(undefined);
  }

  verifyCode(code: string): Result<Account> {
    const pending = this.state.pendingVerification;
    if (!pending) return fail("No hay una verificación pendiente. Entra de nuevo.");
    if (code.trim() !== pending.code) return fail("El código no es correcto o ya venció.", "code");
    const found = this.getAccount(pending.accountId);
    if (!found) return fail("No encontramos la cuenta.");
    found.emailVerified = true;
    this.state.pendingVerification = null;
    this.state.sessionAccountId = found.id;
    this.save();
    return ok(found);
  }

  /** Always succeeds, like the real flow, so it cannot reveal which emails exist. */
  requestPasswordReset(email: string): Result {
    if (!isEmail(normalizeEmail(email))) return fail("Escribe un correo válido.", "email");
    return ok(undefined);
  }

  signOut(): void {
    this.state.sessionAccountId = null;
    this.save();
  }

  // ---- profile --------------------------------------------------------

  updateProfile(patch: Partial<Pick<Account, "name" | "photo" | "city" | "country" | "role" | "bio" | "inWhatsappGroup">>): Result<Account> {
    const me = this.currentAccount();
    if (!me) return fail("Entra para continuar.");
    const next = { ...me, ...patch };
    const errors = validateProfile(next);
    const first = Object.entries(errors)[0];
    if (first) return fail(first[1], first[0]);
    if (next.name.trim().length < 2) return fail("Escribe tu nombre y apellido.", "name");
    Object.assign(me, patch, { name: next.name.trim() });
    this.save();
    return ok(me);
  }

  setContact(key: ContactKey, value: string, visibility: "registrados" | "oculto"): Result {
    const me = this.currentAccount();
    if (!me) return fail("Entra para continuar.");
    me.contacts[key] = { value: value.trim(), visibility };
    this.save();
    return ok(undefined);
  }

  completeOnboardingProfile(): void {
    const me = this.currentAccount();
    if (me) { me.onboarded = true; this.save(); }
  }

  /** Adds a password to a Google account, or changes the current one. */
  setPassword(input: { current?: string; next: string }): Result {
    const me = this.currentAccount();
    if (!me) return fail("Entra para continuar.");
    if (input.next.length < PASSWORD_MIN) return fail(`La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`, "next");
    if (me.password !== null && me.password !== input.current) return fail("La contraseña actual es incorrecta.", "current");
    me.password = input.next;
    this.save();
    return ok(undefined);
  }

  deleteAccount(): Result {
    const me = this.currentAccount();
    if (!me) return fail("Entra para continuar.");
    this.state.projects = this.state.projects
      .map((p) => ({ ...p, founders: p.founders.filter((f) => f.accountId !== me.id) }))
      .filter((p) => p.founders.length > 0);
    this.state.accounts = this.state.accounts.filter((a) => a.id !== me.id);
    const live = new Set(this.state.projects.map((p) => p.id));
    this.state.posts = this.state.posts.filter((p) => p.authorId !== me.id && live.has(p.projectId));
    const posts = new Set(this.state.posts.map((p) => p.id));
    this.state.comments = this.state.comments.filter((c) => c.authorId !== me.id && posts.has(c.postId));
    this.state.reactions = this.state.reactions.filter((r) => r.accountId !== me.id && posts.has(r.postId));
    this.state.notifications = this.state.notifications.filter((n) => n.accountId !== me.id && n.actorId !== me.id && posts.has(n.postId));
    this.state.reports = this.state.reports.filter((r) => posts.has(r.postId));
    this.state.promotions = this.state.promotions.filter((o) => o.accountId !== me.id);
    delete this.state.onboarding[me.id];
    this.state.sessionAccountId = null;
    this.save();
    return ok(undefined);
  }

  /**
   * What `viewer` may see of an account. A guest gets nothing but the card
   * data; contact fields appear only when their owner left them visible. The
   * login email is never part of the result.
   */
  publicProfile(accountId: string, viewerIsMember: boolean) {
    const a = this.getAccount(accountId);
    if (!a) return null;
    const card = { id: a.id, name: a.name, photo: a.photo };
    if (!viewerIsMember) return { card, profile: null };
    const contacts = (Object.keys(a.contacts) as ContactKey[])
      .filter((k) => a.contacts[k].value && a.contacts[k].visibility === "registrados")
      .map((k) => ({ key: k, value: a.contacts[k].value }));
    return {
      card,
      profile: { city: a.city, country: a.country, role: a.role, bio: a.bio, contacts, projects: this.publishedProjectsOf(a.id) },
    };
  }

  // ---- projects -------------------------------------------------------

  private publishedProjectsOf(accountId: string): Project[] {
    return this.state.projects.filter((p) => p.status === "published" && p.founders.some((f) => f.accountId === accountId));
  }

  myProjects(status?: ProjectStatus): Project[] {
    const me = this.currentAccount();
    if (!me) return [];
    return this.state.projects
      .filter((p) => p.founders.some((f) => f.accountId === me.id) && (!status || p.status === status))
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  getProject(id: string): Project | null {
    return this.state.projects.find((p) => p.id === id) ?? null;
  }

  /** Resolves a slug, following the redirects left by renames. */
  resolveSlug(slug: string): { project: Project; redirect: boolean } | null {
    const direct = this.state.projects.find((p) => p.slug === slug);
    if (direct) return { project: direct, redirect: false };
    const old = this.state.projects.find((p) => p.previousSlugs.includes(slug));
    return old ? { project: old, redirect: true } : null;
  }

  publishedProjects(): Project[] {
    return this.state.projects.filter((p) => p.status === "published");
  }

  isAdmin(project: Project, accountId = this.currentAccount()?.id): boolean {
    return !!accountId && project.founders.some((f) => f.accountId === accountId && f.admin);
  }

  private isFounder(project: Project, accountId: string): boolean {
    return project.founders.some((f) => f.accountId === accountId);
  }

  createProject(draft: ProjectDraft, status: ProjectStatus, role: ProjectRole = "founder"): Result<Project> {
    const me = this.currentAccount();
    if (!me) return fail("Entra para registrar un proyecto.");
    const check = this.checkDraft(draft);
    if (!check.ok) return check;
    const project: Project = {
      ...this.cleanDraft(draft), id: uid("prj"),
      slug: uniqueSlug(draft.name, this.allSlugs()), previousSlugs: [], status,
      founders: [{ accountId: me.id, role, admin: true }], createdAt: Date.now(),
    };
    this.state.projects.push(project);
    this.save();
    return ok(project);
  }

  updateProject(id: string, draft: ProjectDraft, status?: ProjectStatus): Result<Project> {
    const me = this.currentAccount();
    const project = this.getProject(id);
    if (!me || !project) return fail("No encontramos el proyecto.");
    if (!this.isFounder(project, me.id)) return fail("Solo los fundadores pueden editar este proyecto.");
    const check = this.checkDraft(draft);
    if (!check.ok) return check;
    Object.assign(project, this.cleanDraft(draft));
    if (status) project.status = status;
    this.save();
    return ok(project);
  }

  /** The administrator can change the URL. The old one keeps redirecting. */
  changeSlug(id: string, slug: string): Result<Project> {
    const project = this.getProject(id);
    if (!project || !this.isAdmin(project)) return fail("Solo el administrador puede cambiar la URL.");
    const wanted = uniqueSlug(slug, this.allSlugs().filter((s) => s !== project.slug));
    if (wanted !== project.slug) {
      project.previousSlugs = [...new Set([...project.previousSlugs, project.slug])].filter((s) => s !== wanted);
      project.slug = wanted;
      this.save();
    }
    return ok(project);
  }

  setStatus(id: string, status: ProjectStatus): Result<Project> {
    const project = this.getProject(id);
    if (!project || !this.isAdmin(project)) return fail("Solo el administrador puede cambiar el estado del proyecto.");
    project.status = status;
    this.save();
    return ok(project);
  }

  private allSlugs(): string[] {
    return this.state.projects.flatMap((p) => [p.slug, ...p.previousSlugs]);
  }

  private checkDraft(draft: ProjectDraft): Result {
    const errors = { ...validateProjectInfo(draft), ...validateProjectDetails(draft) };
    const first = Object.entries(errors)[0];
    return first ? fail(first[1], first[0]) : ok(undefined);
  }

  private cleanDraft(draft: ProjectDraft): ProjectDraft {
    return { ...draft, name: draft.name.trim(), website: normalizeUrl(draft.website), short: draft.short.trim(), long: draft.long.trim(), city: draft.city.trim() };
  }

  // ---- cofounders -----------------------------------------------------

  invitationsFor(projectId: string): Invitation[] {
    return this.state.invitations.filter((i) => i.projectId === projectId);
  }

  invite(projectId: string, email: string, role: ProjectRole): Result<Invitation> {
    const project = this.getProject(projectId);
    if (!project || !this.isAdmin(project)) return fail("Solo el administrador puede invitar cofundadores.");
    const key = normalizeEmail(email);
    if (!isEmail(key)) return fail("Escribe un correo válido.", "email");
    const existing = this.byEmail(key);
    if (existing && this.isFounder(project, existing.id)) return fail("Esa persona ya es fundadora del proyecto.", "email");
    if (this.invitationsFor(projectId).some((i) => i.email === key && i.status === "pending")) {
      return fail("Ya enviaste una invitación a ese correo.", "email");
    }
    const invitation: Invitation = { id: uid("inv"), projectId, email: key, role, status: "pending" };
    this.state.invitations.push(invitation);
    this.save();
    return ok(invitation);
  }

  /** Mock of the invitee accepting: needs an account with that email. */
  acceptInvitation(invitationId: string): Result<Project> {
    const invitation = this.state.invitations.find((i) => i.id === invitationId);
    if (!invitation || invitation.status !== "pending") return fail("La invitación ya no está disponible.");
    const project = this.getProject(invitation.projectId);
    if (!project) return fail("No encontramos el proyecto.");
    const person = this.byEmail(invitation.email);
    if (!person) return fail("Esa persona aún no tiene cuenta en Builders.");
    project.founders.push({ accountId: person.id, role: invitation.role, admin: false });
    invitation.status = "accepted";
    this.save();
    return ok(project);
  }

  revokeInvitation(invitationId: string): void {
    this.state.invitations = this.state.invitations.filter((i) => i.id !== invitationId);
    this.save();
  }

  removeFounder(projectId: string, accountId: string): Result {
    const project = this.getProject(projectId);
    if (!project || !this.isAdmin(project)) return fail("Solo el administrador puede quitar fundadores.");
    const target = project.founders.find((f) => f.accountId === accountId);
    if (!target) return fail("Esa persona no es fundadora del proyecto.");
    if (target.admin) return fail("Un proyecto necesita al menos un administrador.");
    project.founders = project.founders.filter((f) => f.accountId !== accountId);
    this.save();
    return ok(undefined);
  }


  // ---- feed -----------------------------------------------------------

  /** Published projects the signed-in person can post as. */
  postableProjects(): Project[] {
    return this.myProjects("published");
  }

  private visiblePosts(): Post[] {
    return this.state.posts
      .filter((p) => !p.hidden)
      .sort((a, b) => b.createdAt - a.createdAt || (a.id < b.id ? 1 : -1));
  }

  /** Newest first, cursor-paginated: pass the previous `nextCursor` to continue. */
  feedPage(cursor: string | null = null, limit = FEED_PAGE_SIZE): { posts: PostView[]; nextCursor: string | null } {
    const all = this.visiblePosts();
    const start = cursor ? all.findIndex((p) => p.id === cursor) + 1 : 0;
    const slice = all.slice(start, start + limit);
    const last = slice[slice.length - 1];
    return {
      posts: slice.map((p) => this.postView(p)),
      nextCursor: last && start + limit < all.length ? last.id : null,
    };
  }

  getPost(id: string): PostView | null {
    const post = this.state.posts.find((p) => p.id === id && !p.hidden);
    return post ? this.postView(post) : null;
  }

  private postView(post: Post): PostView {
    const me = this.currentAccount();
    const counts: Partial<Record<ReactionKind, number>> = {};
    let mine: ReactionKind | null = null;
    for (const r of this.state.reactions) {
      if (r.postId !== post.id) continue;
      counts[r.kind] = (counts[r.kind] ?? 0) + 1;
      if (r.accountId === me?.id) mine = r.kind;
    }
    const author = this.getAccount(post.authorId);
    return {
      post,
      project: this.getProject(post.projectId),
      author: author ? { id: author.id, name: author.name, photo: author.photo } : { id: post.authorId, name: "Persona", photo: null },
      counts,
      reactionTotal: Object.values(counts).reduce((a, b) => a + (b ?? 0), 0),
      mine,
      commentCount: this.state.comments.filter((c) => c.postId === post.id).length,
      canEdit: !!me && me.id === post.authorId,
      reported: !!me && this.state.reports.some((r) => r.postId === post.id && r.reporterId === me.id),
    };
  }

  private checkPost(input: { text: string }): Result<{ text: string }> {
    const text = input.text.trim();
    if (!text) return fail("Escribe algo para publicar.", "text");
    if (text.length > POST_MAX) return fail(`El anuncio admite hasta ${POST_MAX} caracteres.`, "text");
    return ok({ text });
  }

  /** Only founders post, and always on behalf of one of their published projects. */
  createPost(projectId: string, input: { text: string; image?: string | null }): Result<Post> {
    const me = this.currentAccount();
    if (!me) return fail("Entra para publicar.");
    const project = this.getProject(projectId);
    if (!project || project.status !== "published" || !this.isFounder(project, me.id)) {
      return fail("Para publicar necesitas un proyecto publicado.", "project");
    }
    const checked = this.checkPost({ text: input.text });
    if (!checked.ok) return checked;
    const post: Post = {
      id: uid("pst"), projectId, authorId: me.id, text: checked.value.text, image: input.image ?? null,
      preview: previewFor(checked.value.text), createdAt: Date.now(), editedAt: null, hidden: false,
    };
    this.state.posts.push(post);
    this.save();
    return ok(post);
  }

  updatePost(id: string, input: { text: string; image?: string | null }): Result<Post> {
    const me = this.currentAccount();
    const post = this.state.posts.find((p) => p.id === id);
    if (!me || !post || post.authorId !== me.id) return fail("Solo quien publicó puede editar este anuncio.");
    const checked = this.checkPost({ text: input.text });
    if (!checked.ok) return checked;
    post.text = checked.value.text;
    post.preview = previewFor(checked.value.text);
    if (input.image !== undefined) post.image = input.image;
    post.editedAt = Date.now();
    this.save();
    return ok(post);
  }

  deletePost(id: string): Result {
    const me = this.currentAccount();
    const post = this.state.posts.find((p) => p.id === id);
    if (!me || !post || post.authorId !== me.id) return fail("Solo quien publicó puede borrar este anuncio.");
    this.state.posts = this.state.posts.filter((p) => p.id !== id);
    this.state.comments = this.state.comments.filter((c) => c.postId !== id);
    this.state.reactions = this.state.reactions.filter((r) => r.postId !== id);
    this.state.notifications = this.state.notifications.filter((n) => n.postId !== id);
    this.state.reports = this.state.reports.filter((r) => r.postId !== id);
    this.save();
    return ok(undefined);
  }

  /** One reaction per person and post: the same kind removes it, another one replaces it. */
  react(postId: string, kind: ReactionKind): Result<ReactionKind | null> {
    const me = this.currentAccount();
    const post = this.state.posts.find((p) => p.id === postId && !p.hidden);
    if (!me || !post) return fail("Entra para reaccionar.");
    const existing = this.state.reactions.find((r) => r.postId === postId && r.accountId === me.id);
    if (existing && existing.kind === kind) {
      this.state.reactions = this.state.reactions.filter((r) => r !== existing);
      this.save();
      return ok(null);
    }
    if (existing) existing.kind = kind;
    else this.state.reactions.push({ postId, accountId: me.id, kind });
    this.notify(post, "reaction", me.id, kind);
    this.save();
    return ok(kind);
  }

  commentsOf(postId: string): Array<Comment & { author: { id: string; name: string; photo: string | null } }> {
    return this.state.comments
      .filter((c) => c.postId === postId)
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((c) => {
        const a = this.getAccount(c.authorId);
        return { ...c, author: a ? { id: a.id, name: a.name, photo: a.photo } : { id: c.authorId, name: "Persona", photo: null } };
      });
  }

  addComment(postId: string, text: string): Result<Comment> {
    const me = this.currentAccount();
    const post = this.state.posts.find((p) => p.id === postId && !p.hidden);
    if (!me || !post) return fail("Entra para comentar.");
    const clean = text.trim();
    if (!clean) return fail("Escribe un comentario.", "text");
    if (clean.length > COMMENT_MAX) return fail(`El comentario admite hasta ${COMMENT_MAX} caracteres.`, "text");
    const comment: Comment = { id: uid("cmt"), postId, authorId: me.id, text: clean, createdAt: Date.now() };
    this.state.comments.push(comment);
    this.notify(post, "comment", me.id);
    this.save();
    return ok(comment);
  }

  /** A comment can be removed by whoever wrote it or by the author of the post. */
  deleteComment(id: string): Result {
    const me = this.currentAccount();
    const comment = this.state.comments.find((c) => c.id === id);
    const post = comment && this.state.posts.find((p) => p.id === comment.postId);
    if (!me || !comment || !post || (comment.authorId !== me.id && post.authorId !== me.id)) return fail("No puedes borrar este comentario.");
    this.state.comments = this.state.comments.filter((c) => c.id !== id);
    this.save();
    return ok(undefined);
  }

  private notify(post: Post, kind: Notification["kind"], actorId: string, reaction?: ReactionKind): void {
    if (post.authorId === actorId) return; // nobody is notified about their own activity
    this.state.notifications.push({
      id: uid("ntf"), accountId: post.authorId, kind, actorId, postId: post.id, reaction, createdAt: Date.now(), read: false,
    });
  }

  notifications(): Array<Notification & { actorName: string }> {
    const me = this.currentAccount();
    if (!me) return [];
    return this.state.notifications
      .filter((n) => n.accountId === me.id && this.state.posts.some((p) => p.id === n.postId && !p.hidden))
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((n) => ({ ...n, actorName: this.getAccount(n.actorId)?.name ?? "Alguien" }));
  }

  unreadCount(): number {
    return this.notifications().filter((n) => !n.read).length;
  }

  markNotificationsRead(): void {
    const me = this.currentAccount();
    if (!me) return;
    this.state.notifications.forEach((n) => { if (n.accountId === me.id) n.read = true; });
    this.save();
  }

  // ---- moderation -----------------------------------------------------

  /** Anyone signed in can report; one report per person and post. */
  reportPost(postId: string): Result {
    const me = this.currentAccount();
    const post = this.state.posts.find((p) => p.id === postId && !p.hidden);
    if (!me || !post) return fail("Entra para reportar.");
    if (post.authorId === me.id) return fail("No puedes reportar tu propio anuncio.");
    if (this.state.reports.some((r) => r.postId === postId && r.reporterId === me.id)) return fail("Ya reportaste este anuncio.");
    this.state.reports.push({ id: uid("rep"), postId, reporterId: me.id, createdAt: Date.now(), status: "open" });
    this.save();
    return ok(undefined);
  }

  /** Reports waiting for the Asilo team (mock: no role check until the backend exists). */
  openReports(): Array<Report & { post: PostView; reporterName: string }> {
    return this.state.reports
      .filter((r) => r.status === "open")
      .flatMap((r) => {
        const post = this.state.posts.find((p) => p.id === r.postId);
        return post ? [{ ...r, post: this.postView(post), reporterName: this.getAccount(r.reporterId)?.name ?? "Alguien" }] : [];
      });
  }

  resolveReport(reportId: string, action: "hide" | "dismiss"): Result {
    const report = this.state.reports.find((r) => r.id === reportId);
    if (!report) return fail("No encontramos el reporte.");
    const post = this.state.posts.find((p) => p.id === report.postId);
    if (action === "hide" && post) {
      post.hidden = true;
      this.state.reports.filter((r) => r.postId === post.id).forEach((r) => { r.status = "hidden"; });
    } else {
      report.status = "dismissed";
    }
    this.save();
    return ok(undefined);
  }

  // ---- promotions -----------------------------------------------------

  promotionOrders(): Array<PromotionOrder & { project: Project | null }> {
    const me = this.currentAccount();
    if (!me) return [];
    return this.state.promotions
      .filter((o) => o.accountId === me.id)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((o) => ({ ...o, project: this.getProject(o.projectId) }));
  }

  /** Creates the order as pending payment. Only founders of a published project can promote it. */
  createPromotionOrder(projectId: string, brief: string): Result<PromotionOrder> {
    const me = this.currentAccount();
    if (!me) return fail("Entra para solicitar una nota.");
    const project = this.getProject(projectId);
    if (!project || project.status !== "published" || !this.isFounder(project, me.id)) {
      return fail("Elige un proyecto tuyo que esté publicado.", "project");
    }
    const text = brief.trim();
    if (text.length < PROMO_BLOG.briefMin) return fail(`Cuéntanos qué quieres destacar (mínimo ${PROMO_BLOG.briefMin} caracteres).`, "brief");
    if (text.length > PROMO_BLOG.briefMax) return fail(`El mensaje admite hasta ${PROMO_BLOG.briefMax} caracteres.`, "brief");
    if (this.state.promotions.some((o) => o.projectId === projectId && o.accountId === me.id && o.status === "pending_payment")) {
      return fail("Ya tienes una solicitud pendiente de pago para este proyecto.", "project");
    }
    const order: PromotionOrder = {
      id: uid("ord"), accountId: me.id, projectId, brief: text, status: "pending_payment",
      amountUsd: PROMO_BLOG.priceUsd, createdAt: Date.now(), paidAt: null,
    };
    this.state.promotions.push(order);
    this.save();
    return ok(order);
  }

  /** Mock payment: marks the order as paid. The real processor replaces this call. */
  payPromotionOrder(id: string): Result<PromotionOrder> {
    const me = this.currentAccount();
    const order = this.state.promotions.find((o) => o.id === id && o.accountId === me?.id);
    if (!order) return fail("No encontramos la solicitud.");
    if (order.status === "paid") return fail("Esta solicitud ya está pagada.");
    order.status = "paid";
    order.paidAt = Date.now();
    this.save();
    return ok(order);
  }

  /** Only unpaid orders can be dropped. */
  cancelPromotionOrder(id: string): Result {
    const me = this.currentAccount();
    const order = this.state.promotions.find((o) => o.id === id && o.accountId === me?.id);
    if (!order) return fail("No encontramos la solicitud.");
    if (order.status === "paid") return fail("Una solicitud pagada no se puede cancelar desde aquí. Escríbenos.");
    this.state.promotions = this.state.promotions.filter((o) => o !== order);
    this.save();
    return ok(undefined);
  }

  // ---- onboarding progress -------------------------------------------

  progress(): OnboardingProgress | null {
    const me = this.currentAccount();
    return me ? this.state.onboarding[me.id] ?? null : null;
  }

  saveProgress(progress: OnboardingProgress): void {
    const me = this.currentAccount();
    if (!me) return;
    this.state.onboarding[me.id] = progress;
    this.save();
  }

  clearProgress(): void {
    const me = this.currentAccount();
    if (!me) return;
    delete this.state.onboarding[me.id];
    this.save();
  }
}
