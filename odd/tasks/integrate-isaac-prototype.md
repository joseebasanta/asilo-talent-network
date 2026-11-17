# Integrate Isaac prototype with release
Branch: develop (base 6a35238aa1f887831e9e0979ab5f8cf77cd1a111); delivery: auto-chain, feature-branch-chain; forecast >4,500 authored changed lines.
Verification: pnpm test, pnpm check, pnpm build, pnpm test:e2e; focused tests and browser checks.

## Specs
- S1: «hacer una solida rama develop»; «priorizar el prototipo de Isaac».
- S2: «unificar/mergear con lo que tengo yo en mis PRs»; «no conviene hacer un merge directo y considerar el resultado listo para producción».
- S3: «Mantener el prototipo claramente aislado de producción y sin pedir contraseñas reales».
- S4: «conservar los flujos reales existentes y resolver sus cruces»; «Los envíos reales se prueban **solo con servicios y hojas de prueba**».
- S5: «Validar cada recorrido en móvil y escritorio, con teclado y errores; correr `pnpm test`, `pnpm check`, `pnpm build` y E2E».
- S6: «en local me funcionó lo de Cloudflare».

## Tasks
- [~] T1 (S1-S4): Reconcile prototype and release boundaries; establish isolated integration and safe demo access. Route: worker, context backstop. Commit: pending.
- [ ] T2 (S1-S4): Integrate account shell and demo login/onboarding while preserving release flows. Route: worker, context backstop. Commit: pending.
- [ ] T3 (S1-S4): Integrate prototype project management and profile without changing real project storage. Route: worker, context backstop. Commit: pending.
- [ ] T4 (S1-S4): Integrate prototype announcements and promotions as isolated demo. Route: worker, context backstop. Commit: pending.
- [ ] T5 (S1-S6): Verify release and prototype, mobile/desktop/keyboard/error states and independently verify security risks. Route: parent plus verifier. Commit: pending.

## Log
- L1: «Procedamos a avanzar entonces con este camino que me acabas de describir. Sí, vamos a priorizar el prototipo de Isaac + ahí vemos que podemos unificar/mergear con lo que tengo yo en mis PRs + en local me funcionó lo de Cloudflare»
- L2: Previous request: «Ok, entonces quiero ver como podemos juntar PR + la rama de feat/cuentas-proyectos para hacer una solida rama develop + antes de hacer merge, resumen de todo lo que tenemos a nivel de features / happy path».
- L3: Base PR #6; Isaac commit e4e4ff554084c0578611f3c2b3fe13be22865945, divergent by 45 release commits and one prototype commit; prototype stores plaintext passwords in localStorage. No push, PR creation, merge to main, production deployment, or remote data writes authorized.
- L4: User selected «Cadena sobre develop (recomendado)»; chain_strategy=feature-branch-chain. Fetched Isaac branch as refs/remotes/isaac/feat/cuentas-proyectos; no merge performed.
