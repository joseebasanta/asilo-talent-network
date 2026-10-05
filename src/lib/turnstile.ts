/**
 * Cloudflare Turnstile — captcha verification for the public submit endpoint.
 *
 * The site key is public (embedded in the page, drives the widget); the secret
 * key is used only server-side to verify tokens. Config is read via
 * `import.meta.env` ONLY — the Astro runtime never populates `process.env`
 * (see tests/env-surface.test.ts).
 */

export const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Both spellings are accepted: the documented `TURNSTILE_*` names and the
// lowercase names already used in the deployed `.env.local`.
// Public: safe to embed in the client page for the widget.
export function turnstileSiteKey(): string {
  return import.meta.env.TURNSTILE_SITE_KEY || import.meta.env.cloudflare_turnstile_site_key || "";
}

// Server-only: never pass this to a component or the client.
export function turnstileSecretKey(): string {
  return import.meta.env.TURNSTILE_SECRET_KEY || import.meta.env.turnstile_secret_key || "";
}

export function turnstileConfigured(): boolean {
  return Boolean(turnstileSiteKey() && turnstileSecretKey());
}

// ponytail: no caching of verification results — Turnstile tokens are
// single-use, caching would let replayed tokens through.
export async function verifyTurnstile(
  token: string,
  secret: string,
  remoteIp?: string,
): Promise<boolean> {
  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      signal: AbortSignal.timeout(10_000),
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: token,
        ...(remoteIp ? { remoteip: remoteIp } : {}),
      }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    // Network/parse failure: treat as unverified, never fail open.
    return false;
  }
}

export type TurnstileOutcome = "ok" | "misconfigured" | "missing" | "failed";

/**
 * Shared server-side gate for public forms. `ok` also covers "disabled" (no
 * keys at all) so local/dev submits keep working; callers map the other
 * outcomes to their own responses and copy.
 */
export async function checkTurnstile(
  form: FormData,
  remoteIp?: string,
): Promise<TurnstileOutcome> {
  const site = turnstileSiteKey();
  const secret = turnstileSecretKey();
  if (Boolean(site) !== Boolean(secret)) return "misconfigured";
  if (!turnstileConfigured()) return "ok";
  // Tokens are single-use; the widget refills the hidden `cf-turnstile-response`
  // input on each solve.
  const token = form.get("cf-turnstile-response");
  if (
    form.getAll("cf-turnstile-response").length !== 1 ||
    typeof token !== "string" ||
    token.trim() === "" ||
    token.length > 2048
  ) {
    return "missing";
  }
  return (await verifyTurnstile(token, secret, remoteIp)) ? "ok" : "failed";
}
