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
