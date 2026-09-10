# Asilo Builders

Spanish-language community site and project directory for Venezuelan builders.
Built with Astro SSR and the Vercel adapter. Project submissions and approved
listings use Google Sheets; uploaded logos use Appwrite Storage.

## Development

Requires Node.js >=22.12.0 and pnpm (the version is pinned in `package.json`).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

## Checks

```sh
pnpm test
pnpm check
pnpm build
```

## Structure

- `src/pages/` — home page, project directory, and API routes
- `src/components/` — shared header, footer, project cards, and submission form
- `src/lib/` — project loading, validation, search, and submission helpers
- `src/data/` — project types and fallback data
- `src/scripts/` and `src/styles/` — browser interactions and styles
- `public/` — images, category icons, and fonts used by the site
- `tests/` — automated tests
- `docs/DESIGN-SYSTEM.md` — design reference

The standalone HTML/React prototypes and their unused assets have been removed.
`BASELINE.md`, `docs/astro-appwrite-migration.md`, and `openspec/config.yaml`
record historical baseline/planning context, not the current application setup.
