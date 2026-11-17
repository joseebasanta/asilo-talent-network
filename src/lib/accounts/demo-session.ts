export const DEMO_MEMBER = Object.freeze({
  name: "Lucía Demo",
  role: "Builder",
  city: "Caracas",
});

const SESSION_KEY = "asilo-demo-account";

type TabStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function browserTabStorage(): TabStorage | undefined {
  try {
    return typeof sessionStorage === "undefined" ? undefined : sessionStorage;
  } catch {
    return undefined;
  }
}

export type DemoSession = ReturnType<typeof createDemoSession>;

/** Stores only a synthetic signed-in marker in this browser tab. */
export function createDemoSession(storage: TabStorage | undefined = browserTabStorage()) {
  const read = () => {
    try { return storage?.getItem(SESSION_KEY) === "signed-in"; } catch { return false; }
  };
  const write = (value: "signed-in" | null) => {
    try {
      if (value) storage?.setItem(SESSION_KEY, value);
      else storage?.removeItem(SESSION_KEY);
    } catch { /* A blocked browser store means the demo remains signed out. */ }
  };
  return {
    member: DEMO_MEMBER,
    signIn() { write("signed-in"); },
    signOut() { write(null); },
    isSignedIn: read,
  };
}
