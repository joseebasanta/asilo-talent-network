import { getViteConfig } from "astro/config";
import { defineConfig } from "vitest/config";

// Tests must never reach the production Sheet or Appwrite project, even when
// the shell running them has real credentials exported. Blank every
// integration variable; individual tests opt back in with fake values.
const BLANK_INTEGRATION_ENV = Object.fromEntries(
  [
    "GOOGLE_SHEETS_ID",
    "GOOGLE_SERVICE_ACCOUNT_JSON_BASE64",
    "GOOGLE_SHEETS_RANGE",
    "APPWRITE_ENDPOINT",
    "APPWRITE_PROJECT_ID",
    "APPWRITE_API_KEY",
    "TURNSTILE_SITE_KEY",
    "TURNSTILE_SECRET_KEY",
    "cloudflare_turnstile_site_key",
    "turnstile_secret_key",
    "GOOGLE_COMMUNITY_SHEETS_ID",
    "GOOGLE_BUILDERS_SHEETS_ID",
    "GOOGLE_BUILDERS_SHEETS_RANGE",
    "DEMO_DATA",
  ].map((name) => [name, ""]),
);

export default defineConfig(
  getViteConfig({
    test: {
      include: ["tests/**/*.test.ts"],
      environment: "node",
      env: BLANK_INTEGRATION_ENV,
    },
  }),
);
