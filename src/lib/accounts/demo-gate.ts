/**
 * Server-only boundary for the Isaac accounts prototype.
 *
 * The prototype is intentionally opt-in and may only be enabled by Astro's
 * development build. Do not import this module from client scripts or expose
 * the flag with a PUBLIC_ environment variable.
 */

export type IsaacAccountsGateConfig = {
  dev?: boolean;
  server?: boolean;
  optIn?: unknown;
};

const ENABLED_VALUES = new Set(["1", "true", "yes"]);

export function isIsaacAccountsPrototypeEnabled(config: IsaacAccountsGateConfig): boolean {
  return config.server === true
    && config.dev === true
    && typeof config.optIn === "string"
    && ENABLED_VALUES.has(config.optIn.trim().toLowerCase());
}

/** Returns whether this server request may use the local-only prototype. */
export function isaacAccountsPrototypeEnabled(): boolean {
  return isIsaacAccountsPrototypeEnabled({
    dev: import.meta.env.DEV,
    server: import.meta.env.SSR,
    optIn: import.meta.env.ISAAC_ACCOUNTS_PROTOTYPE,
  });
}
