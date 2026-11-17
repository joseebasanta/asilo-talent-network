# Integrate Isaac prototype with release
Branch: develop (base 6a35238aa1f887831e9e0979ab5f8cf77cd1a111); delivery: single-pr; forecast >4,500 authored changed lines.
Verification: pnpm test, pnpm check, pnpm build, pnpm test:e2e; focused tests and browser checks.

## Specs
- S1: «hacer una solida rama develop»; «priorizar el prototipo de Isaac».
- S2: «unificar/mergear con lo que tengo yo en mis PRs»; «no conviene hacer un merge directo y considerar el resultado listo para producción».
- S3: «Mantener el prototipo claramente aislado de producción y sin pedir contraseñas reales».
- S4: «conservar los flujos reales existentes y resolver sus cruces»; «Los envíos reales se prueban **solo con servicios y hojas de prueba**».
- S5: «Validar cada recorrido en móvil y escritorio, con teclado y errores; correr `pnpm test`, `pnpm check`, `pnpm build` y E2E».
- S6: «en local me funcionó lo de Cloudflare».

## Tasks
- [x] T1 (S1-S4): Reconcile prototype and release boundaries; establish isolated integration and safe demo access. Route: worker, context backstop. Commit: 6739000.
- [x] T2 (S1-S4): Integrate account shell and demo login/onboarding while preserving release flows. Route: worker, context backstop. Commits: 2d356cd, 6908e63; synthetic limitations in L13.
- [~] T3 (S1-S4): Integrate prototype project management and profile without changing real project storage. Route: worker, context backstop. Commit: f23e258; reopened: original profile/account flows materially incomplete.
- [ ] T4 (S1-S4): Integrate prototype announcements and promotions as isolated demo. Route: worker, context backstop. Commit: 0a6dd55; reopened: demo gates and original feed flows materially incomplete.
- [ ] T5 (S1-S6): Verify release and prototype, mobile/desktop/keyboard/error states and independently verify security risks. Route: parent plus verifier. Commit: pending.

## Log
- L1: «Procedamos a avanzar entonces con este camino que me acabas de describir. Sí, vamos a priorizar el prototipo de Isaac + ahí vemos que podemos unificar/mergear con lo que tengo yo en mis PRs + en local me funcionó lo de Cloudflare»
- L2: Previous request: «Ok, entonces quiero ver como podemos juntar PR + la rama de feat/cuentas-proyectos para hacer una solida rama develop + antes de hacer merge, resumen de todo lo que tenemos a nivel de features / happy path».
- L3: Base PR #6; Isaac commit e4e4ff554084c0578611f3c2b3fe13be22865945, divergent by 45 release commits and one prototype commit; prototype stores plaintext passwords in localStorage. No push, PR creation, merge to main, production deployment, or remote data writes authorized.
- L4: User selected «Cadena sobre develop (recomendado)»; chain_strategy=feature-branch-chain. Fetched Isaac branch as refs/remotes/isaac/feat/cuentas-proyectos; no merge performed.
- L5: T1 commit 6739000; focused tests 7 passed, full suite 267 passed, pnpm check/build passed; local server returned disabled 404 and enabled 200. Production artifact compiled DEV=false; preview unsupported by Vercel adapter; no live production request. Independent verifier accepted boundary with limitations. Sitemap differential: all 4 release URLs unchanged. Slice 1: 6739000.
- L6: User requested «Haz el commit + merge + push» and clarified «quería era merge - revisión - commit/merge/push»; integrate and review before final merge/push; do not publish incomplete work.
- L7: «NO hagas tantas verificaciones. Commit + push + merge y todo en una sola rama llamada develop o similar». Delivery changed to single-pr on develop; no chain. Keep applicable essential checks and independent verification for named high-risk items.
- L8: T2 commit 2d356cd; 270 tests passed before session correction, focused 9 passed and pnpm check after correction; browser test written but not run because Astro lock conflict. Demo remains reduced versus Isaac; T3/T4 required. Final review and browser verification remain in T5.
- L9: User requested «Apenas puedas, puedes ir subiendo lo que tienes al github que te mandé». Created remote branch joseebasanta/asilo-talent-network:develop by pushing commit 2d356cd. No merge to main or PR creation.
- L10: T3 commit f23e258, pushed to joseebasanta/asilo-talent-network:develop; 6 focused tests, pnpm check and build passed; demo profiles/projects are synthetic and in-memory, not production persistence. Browser verification remains T5.
- L11: T4 commit 0a6dd55, pushed to joseebasanta/asilo-talent-network:develop; 5 focused tests, pnpm check and build passed. Notifications synchronization, link previews, image uploads, actual moderation, persistence and payments remain unimplemented.
- L12: Independent verifier FAIL: T2-T4 materially simplify original Isaac flows; moderation and detail routes lack consistent demo sign-in gates; privacy copy misstates storage. Reopen affected tasks; safe demo must retain original user-visible workflows without real credentials/services. Final suite: pnpm test 281 passed, pnpm check/build passed, first E2E attempt missing Chromium; installation and E2E rerun pending.
- L13: T2 follow-up 6908e63 restores synthetic onboarding steps; 6 focused tests and pnpm check passed. Still no persisted onboarding resume or existing-project edit, real invitation acceptance/revocation, WhatsApp integration, public project creation, backend logo storage or external autofill.
