import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Regression guard for a real production bug (503 fail-closed on every submit):
// Astro loads `.env.local` into `import.meta.env` at runtime, never into
// `process.env`. Reading credentials from `process.env` compiles and types fine
// but is `undefined` at serve time. These modules must read their config only
// through `import.meta.env`.
const __dirname = dirname(fileURLToPath(import.meta.url));
const src = (p: string) => join(__dirname, "..", "src", p);

const SURFACES: Array<{ file: string; envVar: string }> = [
  { file: "lib/projects-loader.ts", envVar: "GOOGLE_SHEETS_ID" },
  { file: "lib/projects-loader.ts", envVar: "GOOGLE_SERVICE_ACCOUNT_JSON_BASE64" },
  { file: "lib/projects-loader.ts", envVar: "GOOGLE_SHEETS_RANGE" },
  { file: "pages/api/projects/submit.ts", envVar: "GOOGLE_SHEETS_ID" },
  { file: "pages/api/projects/submit.ts", envVar: "GOOGLE_SERVICE_ACCOUNT_JSON_BASE64" },
  { file: "pages/api/projects/submit.ts", envVar: "GOOGLE_SHEETS_RANGE" },
  { file: "pages/api/projects/submit.ts", envVar: "APPWRITE_ENDPOINT" },
  { file: "pages/api/projects/submit.ts", envVar: "APPWRITE_PROJECT_ID" },
  { file: "pages/api/projects/submit.ts", envVar: "APPWRITE_API_KEY" },
  { file: "lib/turnstile.ts", envVar: "TURNSTILE_SITE_KEY" },
  { file: "lib/turnstile.ts", envVar: "TURNSTILE_SECRET_KEY" },
  { file: "pages/api/projects/submit.ts", envVar: "TURNSTILE_SECRET_KEY" },
  { file: "pages/api/projects/submit.ts", envVar: "DEV_ALLOW_DUPLICATE_WEBSITE" },
];

describe("env read surface", () => {
  it("reads Google and Appwrite config via import.meta.env, never process.env", () => {
    for (const { file, envVar } of SURFACES) {
      const text = readFileSync(src(file), "utf8");
      expect(
        text,
        `${file} must read ${envVar} through import.meta.env (process.env is not populated at runtime)`,
      ).not.toMatch(new RegExp(`process\\.env\\.${envVar}`));
      expect(
        text,
        `${file} should reference ${envVar} from import.meta.env`,
      ).toMatch(new RegExp(`import\\.meta\\.env\\.${envVar}`));
    }
  });

  it("limits the duplicate-submission override to Astro development mode", () => {
    const submitEndpoint = readFileSync(src("pages/api/projects/submit.ts"), "utf8");

    expect(submitEndpoint).toMatch(
      /const devOverride =\s+import\.meta\.env\.DEV &&/,
    );
  });
});
