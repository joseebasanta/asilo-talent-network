# Asilo Builders

Spanish-language community site and project directory for Venezuelan builders.
Built with Astro SSR and the Vercel adapter. Project submissions and approved
listings use Google Sheets; uploaded logos use Appwrite Storage.

Browse projects at `/proyectos` or apply to join the community from the homepage.

## Development

Requires Node.js >=22.12.0 and pnpm (the version is pinned in `package.json`).

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Open the local URL printed by Astro. Fill in `.env.local` to use the Google
Sheets integrations; see [membership form setup](docs/community-form.md).
Membership applications must use a separate spreadsheet from projects and the
member roster. Keep credentials server-only and out of commits.

Optional project logo uploads use `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`,
and `APPWRITE_API_KEY`. Optional spam protection uses `TURNSTILE_SITE_KEY`
and `TURNSTILE_SECRET_KEY`. These optional keys are included in `.env.example`.

## Checks

```sh
pnpm test
pnpm check
pnpm build
```

## Issues and pull requests

Read the short [issue and PR guide](docs/issues-and-prs.md). GitHub templates
cover bug reports, improvements, and PRs. Coding agents should start with
[AGENTS.md](AGENTS.md).

## Structure

- `src/pages/` — home page, project directory, and API routes
- `src/components/` — shared header, footer, project cards, and submission form
- `src/lib/` — project loading, validation, search, and submission helpers
- `src/data/` — project types and fallback data
- `src/scripts/` and `src/styles/` — browser interactions and styles
- `public/` — images, category icons, fonts, and SVG source artwork used by the site
- `tests/` — automated tests
- [Design system](docs/DESIGN-SYSTEM.md) — visual and interaction guidance
- [Membership form](docs/community-form.md) — spreadsheet setup and limitations

The standalone HTML/React prototypes and their unused assets have been removed.
`BASELINE.md`, `docs/astro-appwrite-migration.md`, and `openspec/config.yaml`
record historical baseline/planning context, not the current application setup.

## Conteo de Builders

Copiar `.env.example` a `.env.local` y completar el ID del documento de proyectos
y el rango de la celda del total de la comunidad. En producción, configurar esas
mismas variables en el hosting.

La portada consulta Google Sheets desde el servidor y muestra el total exacto,
con una caché de 10 minutos por instancia. Usa la cuenta de servicio existente
(`GOOGLE_SERVICE_ACCOUNT_JSON_BASE64`) y estas variables privadas:

- `GOOGLE_SHEETS_ID`: documento de proyectos y fuente del contador de comunidad.
- `GOOGLE_COMMUNITY_COUNT_RANGE`: celda con el total numérico; por defecto `Projects!O1`.

El valor debe ser un entero no negativo. Compartir el documento con la cuenta de
servicio como lector. Si Google falla, se conserva el último total en memoria;
si aún no hay un total disponible, la portada omite la cifra. Los errores también
esperan 10 minutos antes de reintentar. Las consultas simultáneas comparten una
sola petición; cada instancia nueva del servidor comienza con la caché vacía.

## Actualización de proyectos

La portada y `/proyectos` se renderizan en el servidor. Las aprobaciones `SI`
(o `Sí`) se consultan con una caché de 60 segundos por instancia; las lecturas
simultáneas comparten una petición. No se cachean las páginas ni el feed en el
navegador/CDN. Ambas vistas comprueban cambios cada 30 segundos mientras están
visibles; el directorio espera si hay controles o proyectos enfocados para no
interrumpir el uso del teclado. En condiciones normales, los cambios aparecen
en unos 60–90 segundos, más el tiempo de respuesta de Google Sheets.
Si Sheets falla, se conserva la última lectura y se reintenta tras 60 segundos;
los fallos consecutivos aumentan la espera hasta 5 minutos. Las peticiones
tienen un límite de 15 segundos. Cambiar de pestaña no evita el intervalo ni
inicia consultas simultáneas. Esta caché es por instancia, no un límite global:
las instancias nuevas y las lecturas de los formularios también consumen cuota.

## Analítica

Configurar `PUBLIC_MIXPANEL_TOKEN` en `.env.local` y en el hosting. La analítica,
autocapture y Session Replay se inicializan automáticamente; los campos de los
formularios permanecen ocultos en las grabaciones.
