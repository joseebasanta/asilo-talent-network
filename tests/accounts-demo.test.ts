import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createDemoSession, DEMO_MEMBER } from "../src/lib/accounts/demo-session";
import { isIsaacAccountsPrototypeEnabled } from "../src/lib/accounts/demo-gate";

describe("cuentas demo", () => {
  it("keeps every demo route behind the fail-closed development gate", () => {
    expect(isIsaacAccountsPrototypeEnabled({ dev: false, server: true, optIn: "1" })).toBe(false);
    expect(isIsaacAccountsPrototypeEnabled({ dev: true, server: false, optIn: "1" })).toBe(false);
    expect(isIsaacAccountsPrototypeEnabled({ dev: true, server: true, optIn: "1" })).toBe(true);
  });

  it("keeps only a tab-scoped synthetic marker across navigations", () => {
    const storage = new Map<string, string>();
    const tabStorage = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => { storage.set(key, value); },
      removeItem: (key: string) => { storage.delete(key); },
    };
    const session = createDemoSession(tabStorage);
    expect(session.member).toEqual(DEMO_MEMBER);
    expect(session.isSignedIn()).toBe(false);
    session.signIn();
    expect(createDemoSession(tabStorage).isSignedIn()).toBe(true);
    expect([...storage.values()]).toEqual(["signed-in"]);
    session.signOut();
    expect(createDemoSession(tabStorage).isSignedIn()).toBe(false);

    const source = readFileSync(resolve("src/scripts/auth-pages.ts"), "utf8");
    const onboarding = readFileSync(resolve("src/scripts/onboarding.ts"), "utf8");
    const sessionSource = readFileSync(resolve("src/lib/accounts/demo-session.ts"), "utf8");
    expect(`${source}\n${onboarding}\n${sessionSource}`).not.toMatch(/localStorage|indexedDB|password|verification|correo|email|token/i);
    expect(sessionSource).toContain("sessionStorage");
  });

  it("exposes the labeled demo entry and onboarding navigation", () => {
    const entry = readFileSync(resolve("src/pages/demo-cuentas.astro"), "utf8");
    const signIn = readFileSync(resolve("src/pages/demo-cuentas/entrar.astro"), "utf8");
    const onboarding = readFileSync(resolve("src/pages/demo-cuentas/onboarding.astro"), "utf8");
    expect(entry).toContain("Demo de cuentas");
    expect(entry).toContain("/demo-cuentas/entrar");
    expect(signIn).toContain("/demo-cuentas/onboarding?demo=1");
    expect(onboarding).toContain("data-demo-onboarding");
    expect(onboarding).toContain("No es autenticación real");
  });
});
