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
- `public/` — images, category icons, fonts, and SVG source artwork used by the site
- `tests/` — automated tests
- `docs/DESIGN-SYSTEM.md` — design reference

The standalone HTML/React prototypes and their unused assets have been removed.
`BASELINE.md`, `docs/astro-appwrite-migration.md`, and `openspec/config.yaml`
record historical baseline/planning context, not the current application setup.

## Conteo de Builders

Copiar `.env.example` a `.env.local` y completar el ID del documento de miembros
y su rango. En producción, configurar esas mismas variables en el hosting.

La portada consulta Google Sheets desde el servidor y muestra el total exacto,
con una caché de 10 minutos por instancia. Usa la cuenta de servicio existente
(`GOOGLE_SERVICE_ACCOUNT_JSON_BASE64`) y estas variables privadas:

- `GOOGLE_BUILDERS_SHEETS_ID`: documento de miembros; si se omite, usa `GOOGLE_SHEETS_ID`.
- `GOOGLE_BUILDERS_SHEETS_RANGE`: columna identificadora de miembros sin encabezado;
  por defecto `Builders!A2:A`. Ajustarla a la columna que esté llena para cada miembro.

Se cuenta una fila por miembro, ignorando celdas vacías y espacios. La hoja debe
contener un solo registro por miembro. Compartir el documento con la cuenta de
servicio como lector. Si Google falla, se conserva el último total en memoria;
si aún no hay un total disponible, la portada omite la cifra. Los errores también
esperan 10 minutos antes de reintentar. Las consultas simultáneas comparten una
sola petición; cada instancia nueva del servidor comienza con la caché vacía.
