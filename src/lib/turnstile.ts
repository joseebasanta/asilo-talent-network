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

// Public: safe to embed in the client page for the widget.
export const TURNSTILE_SITE_KEY = import.meta.env.TURNSTILE_SITE_KEY;

export function turnstileConfigured(): boolean {
  return Boolean(
    import.meta.env.TURNSTILE_SITE_KEY && import.meta.env.TURNSTILE_SECRET_KEY,
  );
}

// ponytail: no caching of verification results — Turnstile tokens are
// single-use, caching would let replayed tokens through.
export async function verifyTurnstile(
  token: string,
  secret: string,
): Promise<boolean> {
  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    // Network/parse failure: treat as unverified, never fail open.
    return false;
  }
}