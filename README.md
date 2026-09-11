# Asilo — Talent Network

Landing page for **Asilo**, a talent network connecting Venezuelan tech talent
with companies hiring inside Venezuela.

Static site — plain HTML, CSS and JS. No build step. Open `index.html` in a
browser, or serve the folder with any static host.

## Structure

- `index.html` — page content (bilingual via `data-es` / `data-en` attributes)
- `styles.css` — design system + all styling (dark, editorial)
- `script.js` — language toggle, scroll reveal, nav state, CTA wiring

## Before going live — set the real links

Open `script.js` and edit the two constants at the top:

```js
const APPLY_URL   = "#";  // → the talent application form (Tally / Typeform / Google Form)
const COMPANY_URL = "mailto:hola@asilo.network...";  // → where company inquiries go
```

Every "Aplica / Apply" button reads `APPLY_URL`, and every company button reads
`COMPANY_URL`, so you only change them in one place. External `http(s)` links
open in a new tab automatically.

## Language

Spanish is the default. The **ES / EN** toggle in the nav switches all copy and
remembers the choice. To edit a string, change both `data-es` and `data-en`
on the element (or the `data-es-html` / `data-en-html` pair where markup is used).

### Conteo de Builders

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
