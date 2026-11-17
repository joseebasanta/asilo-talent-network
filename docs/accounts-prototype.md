# Isaac accounts prototype boundary

T1 adds only a server-enforced demo entry at `/demo-cuentas`. It does not add
account pages, sessions, password handling, or writes to a real service.

## Development-only opt-in

Opt in explicitly when starting Astro:

```sh
ISAAC_ACCOUNTS_PROTOTYPE=1 pnpm dev
```

The accepted opt-in values are `1`, `true`, and `yes` (case-insensitive). With
no opt-in, `/demo-cuentas` returns not found, including during development. The
gate also requires Astro's development server, so the flag cannot enable it in a
production build or preview. This is development-only, not guaranteed to be
local: a development server may be exposed on a network, so do not use real
credentials or private data.

Do not use a `PUBLIC_` variable for this flag. Keep prototype-only imports on
server-rendered code; never import `src/lib/accounts/demo-gate.ts` from a
client script. The existing release project directory, forms, and service
boundaries are unchanged.

## T2 integration instructions

1. Keep account routes/components behind a server-side check using
   `isaacAccountsPrototypeEnabled()`.
2. If the check is false, render the existing release experience (or a
   server-side not-available response); do not hydrate or import prototype
   account code for that path.
3. Pass only non-sensitive display state to the client. The prototype must not
   store passwords, verification codes, or credentials in browser storage.
4. Exercise T2 locally with `ISAAC_ACCOUNTS_PROTOTYPE=1 pnpm dev`, and exercise
   the default path without the variable. Production must be tested with the
   flag absent.

## Decisions still needed

- Which real authentication provider and server-side session store will replace
  the prototype boundary before any account flow is released?
- Which account pages and routes are in T2's first slice, and what should the
  disabled path show for each one?
- Which non-production identity fixtures, if any, may be used for local demos
  without resembling real member data?
