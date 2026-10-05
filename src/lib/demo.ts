/**
 * `DEMO_DATA=1 pnpm dev` runs the whole site on fictional data: a fake sheet
 * through the real parser. It lets anyone work on the UI without credentials
 * and gives e2e tests a deterministic, production-free backend. Dev server
 * only — ignored in production builds.
 */
import { DEMO_SHEET } from "../data/demo-sheet";

export function demoMode(): boolean {
  return import.meta.env.DEV && ["1", "true"].includes(String(import.meta.env.DEMO_DATA ?? ""));
}

export const demoSheet = (): string[][] => DEMO_SHEET;
