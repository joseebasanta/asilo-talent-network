/**
 * Account and project model for the accounts UI.
 *
 * Frontend-only stage: everything here is backed by the mock store in
 * `store.ts`. The shapes mirror what the real backend will return so the
 * screens do not change when it is connected.
 */

export const ACCOUNT_ROLES = [
  { value: "founder", label: "Founder" },
  { value: "cofounder", label: "Cofounder" },
  { value: "developer", label: "Developer" },
  { value: "diseno", label: "Diseño" },
  { value: "otro", label: "Otro" },
] as const;
export type AccountRole = (typeof ACCOUNT_ROLES)[number]["value"];

export const PROJECT_ROLES = [
  { value: "founder", label: "Founder" },
  { value: "cofounder", label: "Cofounder" },
  { value: "equipo", label: "Equipo" },
] as const;
export type ProjectRole = (typeof PROJECT_ROLES)[number]["value"];

/** Proposed list, pending confirmation. */
export const STAGES = ["Idea", "MVP", "Primeros clientes", "Crecimiento", "Consolidado"] as const;
export type Stage = (typeof STAGES)[number];

export const SECTORS = [
  "Fintech", "Logística", "Inteligencia Artificial", "Educación", "Salud", "E-commerce",
  "Ciberseguridad", "SaaS", "Marketplace", "Movilidad", "PropTech", "Social & Comunidad", "Otro",
] as const;

export type Visibility = "registrados" | "oculto";
export type ContactKey = "phone" | "contactEmail" | "linkedin" | "x";
export type Contact = { value: string; visibility: Visibility };

export type Account = {
  id: string;
  name: string;
  /** Login email. Never shown to other people. */
  email: string;
  emailVerified: boolean;
  /** Mock only: the real backend stores a hash. */
  password: string | null;
  hasGoogle: boolean;
  photo: string | null;
  city: string;
  country: string;
  role: AccountRole | "";
  bio: string;
  /** Answers the community Google Form used to ask. */
  inWhatsappGroup: boolean;
  contacts: Record<ContactKey, Contact>;
  onboarded: boolean;
  createdAt: number;
};

export type ProjectStatus = "draft" | "published" | "archived";

export type Founder = { accountId: string; role: ProjectRole; admin: boolean };

export type Project = {
  id: string;
  slug: string;
  /** Older slugs that must redirect to the current one. */
  previousSlugs: string[];
  name: string;
  /** Square logo as a data URL. */
  logo: string | null;
  website: string;
  short: string;
  long: string;
  sector: string;
  stage: Stage | "";
  seekingInvestment: boolean;
  socials: { instagram: string; tiktok: string; x: string; linkedin: string };
  city: string;
  status: ProjectStatus;
  founders: Founder[];
  createdAt: number;
};

export type ProjectDraft = Omit<Project, "id" | "slug" | "previousSlugs" | "founders" | "createdAt" | "status">;

export type Invitation = {
  id: string;
  projectId: string;
  email: string;
  role: ProjectRole;
  status: "pending" | "accepted";
};

export const REACTIONS = [
  { kind: "like", emoji: "👍", label: "Me gusta" },
  { kind: "love", emoji: "❤️", label: "Me encanta" },
  { kind: "rocket", emoji: "🚀", label: "Impulso" },
  { kind: "clap", emoji: "👏", label: "Aplausos" },
] as const;
export type ReactionKind = (typeof REACTIONS)[number]["kind"];

export const POST_MAX = 1000;
export const COMMENT_MAX = 500;
export const FEED_PAGE_SIZE = 10;

import type { LinkPreview } from "./link-preview";

export type Post = {
  id: string;
  projectId: string;
  /** Who published it, on behalf of the project. */
  authorId: string;
  text: string;
  /** Optional image as a data URL. */
  image: string | null;
  /** Card for the first website mentioned in the text, if it could be read. */
  preview: LinkPreview | null;
  createdAt: number;
  editedAt: number | null;
  /** Hidden by the Asilo team after a report. */
  hidden: boolean;
};

export type Reaction = { postId: string; accountId: string; kind: ReactionKind };
export type Comment = { id: string; postId: string; authorId: string; text: string; createdAt: number };
export type Notification = {
  id: string;
  /** Who receives it. */
  accountId: string;
  kind: "reaction" | "comment";
  actorId: string;
  postId: string;
  reaction?: ReactionKind;
  createdAt: number;
  read: boolean;
};
export type Report = { id: string; postId: string; reporterId: string; createdAt: number; status: "open" | "hidden" | "dismissed" };

/** Paid promotion: a note about a project on the Asilo Digital blog. */
export const PROMO_BLOG = {
  name: "Nota en el blog de Asilo Digital",
  priceUsd: 300,
  subscribers: 1200,
  briefMin: 20,
  briefMax: 600,
} as const;

export type PromotionOrder = {
  id: string;
  accountId: string;
  projectId: string;
  /** What the person wants the note to highlight. */
  brief: string;
  status: "pending_payment" | "paid";
  amountUsd: number;
  createdAt: number;
  paidAt: number | null;
};

export type Pending = { accountId: string; code: string } | null;

export type StoreState = {
  version: 1;
  accounts: Account[];
  projects: Project[];
  invitations: Invitation[];
  sessionAccountId: string | null;
  pendingVerification: Pending;
  /** Onboarding progress per account, so an abandoned flow resumes. */
  onboarding: Record<string, OnboardingProgress>;
  posts: Post[];
  reactions: Reaction[];
  comments: Comment[];
  notifications: Notification[];
  reports: Report[];
  promotions: PromotionOrder[];
};

export type OnboardingProgress = {
  step: "profile" | "ask" | "info" | "details" | "founders" | "review";
  projectDraft: ProjectDraft;
  /** The administrator's own role in the project being created. */
  myRole: ProjectRole;
  /** Cofounders to invite once the project exists. */
  invites: { email: string; role: ProjectRole }[];
};

export type Result<T = void> = { ok: true; value: T } | { ok: false; error: string; field?: string };
