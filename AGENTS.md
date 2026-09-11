# Asilo Builders

Spanish-language community site and project directory for Venezuelan builders.
Astro SSR with the Vercel adapter, TypeScript, plain CSS, and pnpm.

## Working here

- Read [README.md](README.md) for setup and the repository map.
- Keep changes small and focused. Follow existing components and helpers.
- Keep user-facing copy in Spanish. For UI changes, read
  [the design system](docs/DESIGN-SYSTEM.md) and reuse existing styles.
- Google Sheets stores projects and private membership applications in separate
  documents. Appwrite stores project logos. Keep credentials and applicant data
  out of client bundles, logs, issues, and PR evidence.
- Current source and `package.json` take precedence over historical planning
  docs (`BASELINE.md`, `docs/astro-appwrite-migration.md`, and `openspec/`).

## Verification

- For code changes, run `pnpm test`, `pnpm check`, and `pnpm build`.
- Add focused tests for changed behavior. For UI, check the affected flow on
  mobile and desktop, including keyboard use and relevant error states.
- For documentation-only changes, check links and `git diff --check`.
- Report what actually ran and any failures or skipped checks. Mocked tests do
  not prove live Google Sheets or Appwrite writes work.

## Issues and pull requests

Follow [docs/issues-and-prs.md](docs/issues-and-prs.md) and the templates in
`.github/`. Search for duplicates, keep one concern per issue or PR, and use
concrete titles. Include the problem, resulting behavior, and verification;
attach screenshots for UI changes and a recording when motion matters.
When using the CLI, supply the template sections explicitly with `--body-file`.
Only publish an issue or PR when the user requests it; a request to implement
code or documentation alone does not ask for publication.
