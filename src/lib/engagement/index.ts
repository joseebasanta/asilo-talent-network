/**
 * Resolves the engagement store from the environment. Likes and comments need
 * `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID` and `APPWRITE_API_KEY` (the same
 * credentials as logo uploads) plus the tables created by
 * `scripts/setup-appwrite.mjs`; `APPWRITE_DATABASE_ID` defaults to "builders".
 * Without them the site renders exactly as before, minus likes/comments.
 */

import { createHmac } from "node:crypto";
import { demoEngagementStore, demoMode } from "../demo";
import { createAppwriteStore } from "./appwrite-store";
import { disabledStore } from "./disabled-store";
import { DEFAULT_DATABASE_ID } from "./schema";
import type { EngagementStore } from "./types";

let override: EngagementStore | null = null;
let cached: EngagementStore | null = null;

export function getEngagementStore(): EngagementStore {
  if (override) return override;
  if (cached) return cached;
  if (demoMode()) return (cached = demoEngagementStore());

  const endpoint = import.meta.env.APPWRITE_ENDPOINT;
  const projectId = import.meta.env.APPWRITE_PROJECT_ID;
  const apiKey = import.meta.env.APPWRITE_API_KEY;
  cached =
    endpoint && projectId && apiKey
      ? createAppwriteStore({
          endpoint,
          projectId,
          apiKey,
          databaseId: import.meta.env.APPWRITE_DATABASE_ID || DEFAULT_DATABASE_ID,
        })
      : disabledStore;
  return cached;
}

/** Test hook: inject a fake store (or `null` to go back to env resolution). */
export function setEngagementStoreForTests(store: EngagementStore | null): void {
  override = store;
  cached = null;
}

/**
 * Keyed hash so stored identifiers (voter cookie, client IP) cannot be
 * reversed or correlated outside this app. Prefers a dedicated
 * `ENGAGEMENT_SECRET`; falls back to the Appwrite API key, already a
 * server-only secret, so a missing variable never stores raw values. In
 * production a missing secret throws (callers answer 503) instead of keying
 * with a public constant anyone could reproduce.
 */
export function privateHash(kind: "voter" | "ip", value: string): string {
  let secret = import.meta.env.ENGAGEMENT_SECRET || import.meta.env.APPWRITE_API_KEY;
  if (!secret) {
    if (import.meta.env.PROD) throw new Error("ENGAGEMENT_SECRET is not configured");
    secret = "dev-only";
  }
  return createHmac("sha256", secret).update(`${kind}:${value}`).digest("hex");
}

export type { EngagementStore } from "./types";
