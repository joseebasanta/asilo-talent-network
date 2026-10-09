/**
 * Stable identity for a directory project.
 *
 * The sheet has no primary key: each row is an immutable revision. The
 * normalized website (see `normalizeWebsiteKey`) is already the dedupe key on
 * submit, so it is also the identity that edit requests hang off. The public id is a short hash of it: URL-safe, a valid Appwrite
 * row id, and it does not change when the builder renames the project.
 *
 * Public URLs look like `/proyectos/pana-pay-3f9a1c2b7d4e`: the readable part
 * is cosmetic, only the trailing id resolves the project, so renames never
 * break shared links (the page redirects to the canonical slug).
 */

import { createHash } from "node:crypto";
import { normalizeWebsiteKey } from "./projects-submit";

export const PROJECT_ID_LENGTH = 12;
const ID_PATTERN = new RegExp(`(?:^|-)([0-9a-f]{${PROJECT_ID_LENGTH}})$`);

/** Short, stable id for a project website, or `""` for an unusable URL. */
export function projectIdFor(website: string): string {
  const key = normalizeWebsiteKey(website);
  if (!key) return "";
  return createHash("sha256").update(key).digest("hex").slice(0, PROJECT_ID_LENGTH);
}

/** `"Pana Pay!"` → `"pana-pay"`; accents folded, capped for tidy URLs. */
export function slugify(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

export function projectSlug(title: string, id: string): string {
  const readable = slugify(title);
  return readable ? `${readable}-${id}` : id;
}

/** Extracts the project id from a slug, or `null` when it carries none. */
export function idFromSlug(slug: string): string | null {
  return ID_PATTERN.exec(slug.toLowerCase())?.[1] ?? null;
}
