# Asilo Builders — Design System

The single source of truth for how this site looks and behaves. Read this before
building or changing any UI so new work stays on-style. When something here
conflicts with a fresh Figma spec, the Figma spec wins for that element — then
update this file.

- **Aesthetic in one line:** a dark, terminal/pixel world — navy‑black ground,
  one sky‑blue accent, a pixel display face over clean sans body, hairline
  borders, and restrained ambient motion.
- **Stack:** Astro (SSR, but the landing page is `prerender`ed) · vanilla JS ·
  plain CSS with custom‑property tokens. **No CSS framework, no UI/animation
  libraries.** Prefer native elements (`<dialog>`, form validation) over deps.
- **Canonical files:**
  - `src/styles/global.css` — tokens + every component (the real source of truth)
  - `src/styles/fonts.css` — `@font-face` for Doto + IBM Plex Sans
  - `src/pages/index.astro` — page composition
  - `src/components/ProjectDirectory.astro` — Proyectos list + the modal form
  - `src/scripts/` — `ascii-background.js`, `ascii-cursor.js`, `scroll-reveal.js`

---

## 1. Principles

1. **Tokens before pixels.** Never hardcode a color/size that a token already
   names. Add the token first, use it everywhere.
2. **One accent.** Sky blue `--blue-500` (`#cee2ff`) is the *only* accent. No
   second hue. (A saturated `#0066ff` was tried and removed.)
3. **Two typefaces, used with discipline.** Doto for identity (display), IBM Plex
   Sans for everything readable. Never add a third family.
4. **Hairlines, not boxes.** Separate things with 1px borders and faint fills,
   not heavy cards/shadows. Spend border/fill/radius by role.
5. **Dark‑first, on purpose.** `:root { color-scheme: dark }`. The page commits
   to one dark world; paint backgrounds/colors explicitly.
6. **Motion is an enhancement, never a gate.** Content must be readable with no
   JS and must honor `prefers-reduced-motion`. Effects degrade to “instantly
   visible.”
7. **Legibility beats spectacle.** Any animation/texture behind text gets a veil
   (gradient scrim) so copy stays readable.

---

## 2. Color tokens

Defined on `:root` in `global.css`. Use the token, not the hex.

### Base
| Token | Hex | Use |
|---|---|---|
| `--bg` | `#000a11` | page ground (navy‑black) |
| `--fg` | `#f4f2ee` | base body text (warm off‑white) |
| `--ink` | `#6f7075` | ASCII background glyph color |
| `--accent-blue` | `#0066ff` | **retired** — was the ASCII “ocean blue”, now unused |

### Blue scale (primary / sky)
| Token | Hex | Use |
|---|---|---|
| `--blue-50` | `#fafcff` | brightest text, hover states, social‑icon hover |
| `--blue-100` | `#f0f6ff` | card titles (¿Qué hacemos?) |
| `--blue-500` | `#cee2ff` | **the accent** — headings, buttons, CTAs, counters, arrows, icons |
| `--blue-700` | `#92a0b5` | secondary/muted text, footer links, labels |
| `--blue-800` | `#717c8c` | muted paragraph text |
| `--line` | `#717c8c` | legacy alias of blue‑800 (avoid; prefer slate for lines) |

### Neutral slate ramp (from Figma `neutral/slate`; **no 500 step**)
| Token | Hex | Use |
|---|---|---|
| `--slate-0` | `#ffffff` | — |
| `--slate-50` | `#f5f7fa` | — |
| `--slate-100` | `#f2f5f8` | — |
| `--slate-200` | `#e1e4ea` | — |
| `--slate-300` | `#cacfd8` | — |
| `--slate-400` | `#99a0ae` | — |
| `--slate-600` | `#525866` | — |
| `--slate-700` | `#2b303b` | **section dividers** (`border-top` between sections) |
| `--slate-800` | `#222530` | card grid strokes · project‑card hover panel |
| `--slate-900` | `#181b25` | chips/tags, thumbnails, filled‑button text |
| `--slate-950` | `#0e121b` | deepest surface |

### Sky‑alpha tokens (`#cee2ff` at opacity — for borders & fills on dark)
| Token | Value | Use |
|---|---|---|
| `--sky-alpha-5` | `rgba(206,226,255,.05)` | subtle fills (icon boxes, checked rows) |
| `--sky-alpha-10` | `rgba(206,226,255,.10)` | ghost‑button hover fill |
| `--sky-alpha-16` | `rgba(206,226,255,.16)` | **input/modal borders, dividers** |
| `--sky-alpha-24` | `rgba(206,226,255,.24)` | dropzone border, input focus border, scrollbar |

> One‑off literals still in use (candidates to tokenize): `#5c6470` (modal
> placeholder/hint), `#aeb8c4` (checklist row text), `#dcebff` (primary‑button
> hover), `rgba(206,226,255,.14/.3)` (icon box / checkbox borders).

---

## 3. Typography

Two families, loaded via `fonts.css` (self‑hosted woff2) and preloaded in the
`<head>`.

| Role | Family | Token | Notes |
|---|---|---|---|
| Display | **Doto** (pixel) | `--font-display` | headings, hero title, counters, section titles. Weight **900** (`font-variation-settings: "wght" 900`). Usually `text-transform: uppercase`. |
| Body / UI | **IBM Plex Sans** | `--font-text` | all running text, labels, buttons, inputs. Weights 400/500. |

Fallbacks: `--font-display: "Doto", ui-monospace, monospace` ·
`--font-text: "IBM Plex Sans", system-ui, sans-serif`.

### Named type roles (from Figma → used across components)
| Role | Family / weight | Size / line | Tracking |
|---|---|---|---|
| Hero H1 | Doto 900 | `clamp(2.4rem,5.4vw,4rem)` / 1.0 | −.01em, uppercase |
| Section H2 (Doto) | Doto 900 | `clamp(2rem,6vw,4rem)` per section | −.01em, uppercase |
| Card title (H3) | IBM Plex 500 | 1.5rem / 1.33 | −.015em |
| **Label/Medium** | IBM Plex **500** | **16px / 24px** | **−.011em** — the button/label default |
| Label/Small | IBM Plex 500 | 14px / 20px | −.006em |
| Paragraph/Large | IBM Plex 400 | 1.125rem / 1.5 | — |
| Paragraph/Small | IBM Plex 400 | 14px / 20px | −.006em |
| Eyebrow / 2XS | IBM Plex 500 | 11–12px | uppercase, wide tracking (.02–.04em) |

**Rule of thumb:** any button or form label = **Label/Medium** (500, 16/24,
−.011em). Set `font-weight: 500` explicitly — don’t rely on inheritance (buttons
default to 400 and this bit us more than once).

---

## 4. Spacing, layout & radii

| Token / value | Meaning |
|---|---|
| `--gutter: clamp(1.25rem, 7vw, 6.25rem)` | horizontal page padding (all sections) |
| `--header-h: 77px` | fixed navbar height (used to compute the hero gap) |
| `max-width: 80rem` | content container width (header, sections) |
| section vertical padding | `clamp(5.5rem,13vw,10rem)` (wwd/qeb), `clamp(4.5rem,10vw,7rem)` (prj), `192px` (cta) |
| hero top padding | `calc(var(--header-h) + 100px)` — a **fixed** navbar→content gap |

**Radii:** `4px` inputs/buttons/small controls · `8px` icon boxes / checklist ·
`16px` modal · `999px` pills/chips.

**Spacing method:** lay out with flex/grid + `gap`, not per‑element margins.
Avoid viewport‑relative spacing where a consistent gap matters (a `15vh` hero gap
drifted 0–73px with window height — replaced by the fixed `--header-h + 100px`).

---

## 5. Components

All class names live in `global.css`. Specs below are the current truth.

### Buttons
| Variant | Class | Look |
|---|---|---|
| Ghost / outline | `.join`, `.qeb-cta`, `.prj-cta`, `.button-secondary` | transparent bg, `1px solid --blue-500`, `--blue-500` text, radius 4px, hover fill `--sky-alpha-10` |
| Filled / primary | `.button.button-primary`, `.modal-submit` | bg `--blue-500`, text `--slate-900`/`#000a11`, radius 4px, hover `#dcebff` |
| Text / cancel | `.modal-cancel` | no bg/border, `--blue-700` text, hover `--blue-50` |

- All button text is **Label/Medium** (500, 16/24, −.011em), usually uppercase.
- Reset `<button>` defaults when reusing a class: `background:none; cursor:pointer;`
  plus explicit `font-family`.
- Icon inside a button: 20px, `currentColor`, `gap` 4px (nav) / 8px (hero).

### Cards & surfaces
- **Feature grid** (`.wwd-grid` / `.wwd-item`): single `1px solid --slate-800`
  outer border with `--slate-800` internal dividers (no per‑card boxes).
- **Project card** (`.prj-item`): transparent at rest; **hover/focus** → bg
  `--slate-800` panel + reveal a `--blue-500` external‑link icon by the title.
- **Chips/tags** (`.prj-tag`): bg `--slate-900`, `--blue-800` text, pill radius,
  11px uppercase.

### Inputs (modal form)
- Text input `.field-input`: h40, `padding 0 14px`, bg `--bg`, border
  `--sky-alpha-16`, radius 4px, text `--blue-50` 16px, placeholder `#5c6470`,
  **focus border → `--sky-alpha-24`** (no outline).
- Textarea box `.field-textarea-box`: same border, holds the textarea + a
  bottom‑right `.field-counter` (e.g. `0/140`).
- Label `.field-label`: `--blue-700`, 14/20, 500.

### Dropzone (`.dropzone`)
Dashed `--sky-alpha-24` border, radius 4px; 46px icon tile (bg `--sky-alpha-5`,
border `rgba(206,226,255,.14)`, radius 8px) + title (`--blue-50`) + hint
(`#5c6470`). Hover border → `--blue-500`.

### Checklist (`.cat-list` / `.cat-row`)
Scrollable box (h160, border `--sky-alpha-16`, radius 8px, thin sky scrollbar).
Rows: 18px custom checkbox (visually‑hidden native input + `.cat-box`),
checked → bg `--blue-500` + check + row bg `--sky-alpha-5` + text `--blue-50`.
Supports a “max N selected” rule by disabling unchecked inputs (JS).

### Modal (`.modal` = native `<dialog>`)
- Card: bg `--bg`, border `--sky-alpha-16`, **radius 16px**, `max-height:
  calc(100dvh - 2rem)` with the body scrolling.
- `::backdrop`: `rgba(0,10,17,.72)` + `blur(2px)`.
- Header: Doto title (24/32, `--blue-500`) + `--blue-700` subtitle + 24px close
  (`--blue-800`, hover `--blue-50`); `.modal-divider` = `--sky-alpha-16`.
- Behavior: open with `dialog.showModal()`; close on ✕ / Cancel / **backdrop
  click** / **Esc** (native). Get focus‑trap + background `inert` for free.

### Section divider
1px `border-top: 1px solid --slate-700` on `.wwd, .qeb, .prj, .cta,
.site-footer` — a hairline between every consecutive section.

---

## 6. Icons

- **Style:** pixel/8‑bit glyphs matching Doto (brackets, arrows, smile, external‑link,
  close, upload). Social icons are standard brand marks.
- **Convention:** inline the SVG `<path>` in markup and set
  **`fill="currentColor"`** so the icon inherits text color and reacts to
  hover/state. This is the default for interactive icons.
- **Use `<img src>` instead** only for assets whose baked colors are the point —
  the logo wordmark (`/logo-asilo-builders.svg`) and favicon.
- Uploaded source SVGs live in `public/` (kept as the source of truth even when
  their path data is inlined). URL‑safe filenames (no spaces).
- Sizes: 16px (inline UI), 20px (button icon), 24px (nav/close), 40px (feature).

---

## 7. Motion & effects

All optional, all reduced‑motion aware, all paused when off‑screen where relevant.

### Scroll reveal — `src/scripts/scroll-reveal.js`
One `IntersectionObserver`, two reusable hooks, each element fires **once**.

- **Decode heading** — add `data-decode` to a heading. It scrambles ASCII‑ramp
  glyphs and resolves left→right (~0.7s, subtle).
- **Reveal item** — add `data-reveal` (soft slide‑up 16px) or
  `data-reveal="fade"` (opacity only), with `style="--reveal-i: N"` for stagger
  (N × 120ms).

```html
<h2 data-decode>¿Qué hacemos?</h2>
<article data-reveal style="--reveal-i: 0">…</article>
<p data-reveal="fade" style="--reveal-i: 1">…</p>
```

Safety: the hidden start‑state only applies under `html.js` (JS adds it), so
content shows without JS; `prefers-reduced-motion` shows everything instantly.
CSS lives at the bottom of `global.css` (`.js [data-reveal] …`).

### ASCII background — `src/scripts/ascii-background.js`
Renders an image as animated ASCII on a canvas. Generalized to boot on **any**
`<canvas data-ascii-src="/img.png">`, so the hero and any section can each have
their own image with one engine.

```html
<canvas id="ascii" data-ascii-src="/ascii-skyline.png" aria-hidden="true"></canvas>
```

Pair a background canvas with a **veil** (`::after` gradient) so overlaid text
stays readable, and content on top via `z-index`. Instances pause off‑screen via
`IntersectionObserver`; honors reduced‑motion. Accent glyph color = `--blue-500`.

### Cursor trail — `src/scripts/ascii-cursor.js`
A page‑wide wake of flickering glyphs following the pointer. Disabled on
touch/coarse pointers and under reduced‑motion; idle cost is zero.

---

## 8. Conventions & gotchas

- **Astro reads `{ }` as expressions.** Literal braces in markup need HTML
  entities (`&#123;` / `&#125;`) or the build errors.
- **`align-items: stretch` can stretch an SVG.** A flex column stretched the
  footer logo full‑width and the SVG re‑centered itself → use
  `align-items: flex-start` (or give the media an explicit width).
- **Decode:** capture the heading’s `textContent` on init, before the first
  scramble frame.
- **Set button `font-weight: 500` explicitly** — don’t inherit; buttons default
  to 400 and silently miss Label/Medium.
- **Experiment in one commit.** Put each risky effect in its own commit so
  `git revert <hash>` cleanly removes it. (Two effects were built and reverted
  this way.)
- **Review before shipping.** Assemble a self‑contained HTML preview (inline
  fonts/images/scripts) and look at it before committing.

---

## 9. Quick‑start for a new project

1. Copy the `:root` block from `global.css` — the color + slate + sky‑alpha
   tokens are a ready starter system.
2. Load **Doto** + **IBM Plex Sans**; keep the two‑family rule and one accent.
3. Copy `scroll-reveal.js` + its CSS for `data-decode` / `data-reveal`.
4. Keep `ascii-background.js` (the `data-ascii-src` engine) for image‑driven
   backgrounds; keep `ascii-cursor.js` for the pointer trail.
5. Default to native elements (`<dialog>`, form validation) before any library.
6. Build section‑by‑section against the design; each risky idea = its own commit.

---

*Compiled from the `feat/astro-appwrite-migration` build (PR #4). Keep this file
updated whenever a token, component, or convention changes.*
