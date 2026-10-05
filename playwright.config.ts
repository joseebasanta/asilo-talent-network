import { defineConfig, devices } from "@playwright/test";

const PORT = 4399;

// Browser tests run against the dev server in demo mode (DEMO_DATA=1):
// fictional projects. Credentials are
// blanked so a run can never reach the production Sheet or Appwrite.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /layout\.spec\.ts/ },
  ],
  webServer: {
    command: `pnpm exec astro dev --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // Astro 7 detaches `astro dev` into the background when it detects an AI
      // agent; Playwright needs the server in the foreground to manage it.
      CLAUDECODE: "",
      DEMO_DATA: "1",
      GOOGLE_SHEETS_ID: "",
      GOOGLE_SERVICE_ACCOUNT_JSON_BASE64: "",
      APPWRITE_ENDPOINT: "",
      APPWRITE_PROJECT_ID: "",
      APPWRITE_API_KEY: "",
      TURNSTILE_SITE_KEY: "",
      TURNSTILE_SECRET_KEY: "",
      cloudflare_turnstile_site_key: "",
      turnstile_secret_key: "",
      GOOGLE_COMMUNITY_SHEETS_ID: "",
      GOOGLE_BUILDERS_SHEETS_ID: "",
      GOOGLE_BUILDERS_SHEETS_RANGE: "",
    },
  },
});
