# Astro + Appwrite migration — implementation brief (v1.0)

**Decision:** replace the static GitHub Pages implementation with an Astro SSR application deployed to Appwrite Sites. Keep the current visual language and public browsing experience, but move identity, submissions, moderation, and unpublished data behind server-rendered routes and Appwrite resource permissions.

## Baseline and constraints

- The live GitHub Pages source is `origin/revision-one`; `main` is stale and must not be treated as the migration base.
- The checked-out migration branch is based on `origin/revision-one` (`a9e0924`). The active projects section in `index.html` is hardcoded. `data.js` and `script.js` contain legacy renderers but are not loaded by that page, so they are not the live rendering path.
- The source has no package manifest, build, typecheck, or test runner. Its current direction is a dark editorial layout, Spanish-first content, intentional ES/EN behavior where present, and reduced-motion handling.
- Preserve the external visual direction and accessible semantics; do not treat the legacy data files as an authoritative product database.

## Target architecture

| Concern | Decision |
| --- | --- |
| Runtime | Astro with `output: "server"` and `@astrojs/node`; deploy the built SSR application as an Appwrite Site. Confirm exact adapter/Site build settings against current Astro and Appwrite documentation when the bootstrap PR is started. |
| Rendering | Pre-render truly public, immutable pages/assets where practical (legal/help/static marketing); use SSR for the project directory, project detail, authenticated workspace, submission, moderation, and any route whose response depends on session, visibility, or current approval state. |
| Appwrite seam | Create a small server-only module (for example, `appwrite-server`) whose interface creates an admin client and a fresh per-request session client. Routes call domain modules, not Appwrite SDK calls directly. |
| Auth/session | Login creates an Appwrite session, stores its secret in an `httpOnly`, `secure`, `sameSite=strict`, path-scoped session cookie, and creates a new `node-appwrite` session client for every request. Do not share a session client between requests. |
| Secrets | Keep `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, API key, and cookie-related configuration in Appwrite Site server variables/CI secrets only. The API key is never bundled, exposed through `PUBLIC_*`, committed, logged, or sent to the browser. Public endpoint/project identifiers may be exposed only if a browser SDK is later justified. |

Use `node-appwrite` only on the SSR/server boundary. The admin client is narrowly reserved for operations that require privileged access; ordinary reads and writes use the caller's session client plus domain authorization.

## Domain model and workflow

| Table/resource | Purpose and essential fields |
| --- | --- |
| `profiles` | Auth-user projection: display name, locale, moderation role/flags, timestamps. Never make private contact or moderation fields public. |
| `categories` | Curated category id, localized label, slug, ordering, active flag. |
| `projects` | Owner user id, title, localized summary, canonical URL, slug, category id, workflow state, visibility, published revision id, timestamps. The public directory reads only approved, public project projections. |
| `project_members` | Project id, member user id, role (`owner`, `editor`, `viewer`), invitation/audit timestamps. Use a project Team only when collaboration needs resource-level team permissions; keep membership changes moderator/owner-authorized. |
| `project_revisions` | Immutable submitted snapshots of content, links, categories, assets, author, and review state. A published project always points to a reviewed revision. |
| `change_requests` | Requested edits against a revision, author, reason, state, moderator decision, and audit timestamps; never overwrite published history. |
| `community_validations` | Authenticated validation/report, target revision, decision, reason/evidence reference, duplicate fingerprint, and moderation state. Only approved aggregate/public-safe information may be published. |
| `moderation_actions` | Actor, target, action, reason, timestamps, and immutable audit context. |
| Storage buckets | Private submission evidence and project media. Store ownership/revision linkage in row metadata; visibility of files follows the reviewed project state, not uploader choice. |

Workflow states are explicit: `draft` → `pending_review` → `approved` → `published`; `changes_requested`, `rejected`, `suspended`, and `archived` are terminal or return-to-draft states as applicable. Visibility is separate from state (`private`, `unlisted`, `public`); only `published + public` is directory-visible.

Normalize submitted URLs server-side before uniqueness checks: allow only `http`/`https`, reject credentials and malformed hosts, lowercase host, remove fragments/default ports, normalize path/query policy deterministically, and store both source and canonical values. Put a uniqueness constraint/index on the canonical value and handle the conflict response as the race-safe final check. Define the query-parameter retention policy before accepting records.

Moderation roles use Appwrite Teams (at minimum `moderators` and `admins`) with explicit team roles. Do not infer moderation authority from client input or a mutable display field.

## Appwrite authorization model

**This is not Supabase RLS.** Supabase RLS is database policy evaluated as SQL predicates. Appwrite authorizes access through table/bucket defaults and explicit row/file permission strings. Appwrite permissions do not replace server-side workflow checks, URL validation, or moderation decisions.

1. Start tables and buckets deny-by-default; enable document/file-level permissions where a resource has distinct visibility.
2. On create, server code assigns owner read/update/delete as appropriate, collaborator/team read/update where approved, and moderator/admin team access. Never accept a permissions array from the client.
3. Grant `read(any)` only to a reviewed public projection/row and its approved public media. Pending, draft, rejected, private, unlisted, audit, validation-evidence, and original upload records receive no public permission.
4. Publish/unpublish is a single server-side transition: verify moderator authority, set the public project's row/file permissions, and record the action. Revoke public permissions before or with unpublish/suspension.
5. Storage uploads use private object permissions first; a moderator-approved publish transition creates or unlocks only the derivative/public asset. Do not expose original submissions merely because a project is visible.
6. The API key bypasses normal user permissions; keep it server-only and minimize the operations that use it. A session client and domain module must validate the user, role, project ownership, and allowed state transition for every mutation.

## Submission abuse controls

Apply controls in the SSR submission module, before creating a project or file:

- require a verified authenticated user; require verified email before submission and preserve the authenticated actor in audit fields;
- apply IP/account/project rate limits with bounded windows, exponential backoff, and `429` responses; log privacy-minimized events;
- use a server-validated honeypot and a minimum time-to-fill threshold; reject without revealing the specific signal;
- fingerprint normalized URL, owner, title, and content digest to detect duplicate/replayed submissions; make idempotent retries safe;
- quarantine every new submission as `draft`/`pending_review`, scan file type/size allowlists, and require moderator review before public exposure;
- permit community validation only from authenticated, eligibility-checked accounts; rate-limit it and route reports through moderation.

Add CAPTCHA only when monitored evidence shows that the preceding controls are being bypassed or abuse materially consumes moderation capacity (for example, sustained automated submissions after per-account/IP limits and honeypot/time checks). Make it a pluggable server-side verification step, not a default dependency or a client-only gate.

## Migration and quality plan

1. Capture screenshots and a manual accessibility baseline from `origin/revision-one`; inventory every route/section, Spanish/English toggle behavior, keyboard path, focus state, and reduced-motion behavior.
2. Bootstrap Astro SSR and move static images/fonts/icons to `public/`. Port global tokens and semantic page structure before changing content or interactions. Retain Spanish as the default and retain existing English alternatives only where intentionally supplied; do not fabricate translations as part of migration.
3. Port the current project presentation as static fixtures first. Replace duplicate hardcoded cards only after visual parity is accepted. Preserve heading hierarchy, link names, keyboard operation, contrast, responsive layout, and `prefers-reduced-motion` alternatives/no-op paths.
4. Introduce the server Appwrite module, typed configuration validation, session cookie routes, and auth guards. Keep browser code free of the API key.
5. Add TablesDB schema, explicit indexes/uniqueness, Storage buckets, Teams, permissions, and generated types from the checked-in Appwrite configuration. Seed only approved fixture data through a controlled migration path.
6. Implement project creation, revision/change-request flow, ownership/membership, moderation transitions, and public directory/detail queries. Gate every public read on `published + public` and Appwrite permission.
7. Add submission controls, community validation, operational audit logging, error states, and observability. Validate Appwrite Site variables and deployment settings without syncing or replacing remote secrets accidentally.

## Strict TDD and evidence

The repository starts without a runner, so introduce tooling before data-bearing behavior. Each vertical slice follows **RED → GREEN → triangulate → refactor** at a confirmed public seam:

1. RED: add the smallest behavior-level test and record its observed failure.
2. GREEN: implement only enough to pass it and record the focused passing command.
3. Triangulate: cover one materially different/negative case (for example, private data excluded, invalid URL, duplicate conflict, or unauthorized transition).
4. Refactor only after the focused tests stay green.

Evidence target by layer: Astro build and TypeScript check; unit tests for URL normalization, state transitions, and permission construction; integration tests against an isolated Appwrite project or controlled adapter for session and visibility behavior; browser tests for public navigation, login/session cookie behavior, keyboard/focus, responsive layout, language selection, and reduced motion. Until tooling exists, record manual checks for each slice (current browser, route, expected result, keyboard path, and reduced-motion setting); manual evidence does not replace the later automated check.

## Reviewable work units

| PR/work unit | Scope | Forecast and split rule |
| --- | --- | --- |
| 1a — SSR foundation | Astro + Node adapter, static asset move, one public shell route, build/typecheck/test harness | Likely 250–350 authored lines. Split adapter/config from asset relocation if the diff approaches 400. |
| 1b — visual parity | Port one public landing/project showcase with static fixtures and accessibility/reduced-motion checks | Full-page port is likely **over 400**; split by independently renderable section (shell/hero, then projects) rather than one large visual PR. |
| 2 — server/auth seam | Server config validation, admin/session clients, login/logout/current-user routes and tests | Likely 250–400; split cookie/auth routes from shared module if evidence pushes it over 400. |
| 3a — schema and types | Versioned Appwrite TablesDB/Storage/Teams configuration, indexes, generated types, permission test fixtures | Schema plus generated output may exceed 400; keep generated output policy explicit and split core public tables from workflow/audit resources. |
| 3b — public reads | Approved public directory/detail projection and tests proving pending/private exclusion | Keep under 400; do not combine with mutation flows. |
| 4 — project workflow | Submission, normalized URL uniqueness, revisions, membership, and change requests | Likely over 400; split submission/normalization from revision/member workflow. |
| 5 — moderation and abuse | Moderation transitions, community validation, storage publication, rate controls, browser coverage | Likely over 400; split moderation/storage from abuse/community controls. |

Each work unit includes its tests and user-facing documentation, identifies its rollback boundary, and stops/splits when authored additions plus deletions exceed 400 lines. Do not compress code, tests, or accessibility work merely to satisfy the limit.

## First delivery slice

**Scope:** PR 1a only: Astro SSR/Node foundation, one static public shell route, migrated static assets required by that shell, and build/typecheck/test harness scaffolding. It intentionally contains no Appwrite link, API key, schema, login, data migration, or deployment.

**Non-goals:** production deployment; Appwrite project creation/linking; auth; project CRUD; storage uploads; moderation; CAPTCHA; full visual page port; changing copy or translation policy; replacing the existing live GitHub Pages site.

**Acceptance criteria:**

- [ ] The Astro SSR build and Node adapter complete locally with no secret values committed.
- [ ] The public shell route renders without Appwrite configuration or server API calls.
- [ ] Required existing static assets load from the Astro public path; visual tokens and semantic landmarks establish the current direction.
- [ ] Build/typecheck and the first focused behavior-level test have recorded RED/GREEN evidence; manual keyboard and reduced-motion checks are recorded until browser automation exists.
- [ ] The diff remains at or below 400 authored changed lines; otherwise split before review.
- [ ] `.codegraph/`, `openspec/`, existing product source, remote configuration, and GitHub Pages deployment remain untouched.

## Verification before implementation

Before each Appwrite-dependent work unit, verify current Astro adapter/Site and Appwrite TablesDB/permission API details from official documentation, then pin the exact CLI/SDK version and configuration shape in that work unit. Context7 MCP was unavailable while this brief was prepared, so no unverified command or version-specific configuration is prescribed here.
