# Asilo Builders — React hero

Drop-in React + Tailwind hero section with an interactive ASCII background
(El Ávila + Caracas rendered as breathing glyphs). This mirrors the
self-contained `builders-hero.html` at the repo root — same true-tone ASCII
engine, same Figma hero (text, layout, colors).

## Files

- `AsciiBackground.jsx` — the `<canvas>` ASCII engine (z-0). Renders a real
  photo as **true-tone** ASCII via `src`, or a procedural Caracas/El Ávila
  skyline when `src` is omitted.
- `AsiloBuildersHero.jsx` — the full hero: header nav, upper-middle content,
  CTAs, over the background and a legibility vignette. Uses the Figma
  "Blue Builder" color tokens and Doto + Google Sans Flex type.
- `CursorTrail.jsx` — an ASCII cursor wake scoped to the hero (accent blue).

## Usage

```jsx
import AsiloBuildersHero from "./react/AsiloBuildersHero";

export default function Page() {
  return <AsiloBuildersHero />;
}
```

Requirements: React 18+ and Tailwind CSS. The hero references `/8_avila.png`
(the El Ávila photo) from your app's public folder — drop the image there, or
change the `src` in `AsiloBuildersHero.jsx`.

## The ASCII background

`AsciiBackground` samples a source into a coarse luminance grid and picks one
glyph per cell by brightness, with a small time-wobble so the picture shimmers
without moving. Two modes:

- **Photo** (`src` given) — histogram-equalised so any photo self-adjusts to
  the ramp. Light↔shadow is preserved (**true-tone**): each glyph's ink
  brightness encodes the photo's tone (lit → bright glyph, shadow → dim), and
  the bright sky is removed by **position** (a soft vertical mask) rather than
  by inverting. If the image fails to load, it falls back to the procedural
  skyline.
- **Procedural** (`src` omitted) — a drawn El Ávila + Caracas silhouette, no
  asset needed.

A few of the brightest glyphs glow in the accent blue.

Note: to read a remote image's pixels the host must send permissive CORS
headers (the component sets `crossOrigin="anonymous"`). A same-origin file in
your own `/public` folder is simplest.

## Props (`AsciiBackground`)

| prop         | default   | notes                                                        |
| ------------ | --------- | ------------------------------------------------------------ |
| `src`        | `""`      | image URL; omit for the procedural skyline                   |
| `ink`        | `#6f7075` | base glyph color (photo mode also modulates by tone via LUT) |
| `blue`       | `#CEE2FF` | color of the few brightest glyphs that glow blue             |
| `background` | `#0a0a0b` | canvas background                                            |
| `className`  | `""`      | extra classes on the `<canvas>`                              |
| `style`      | —         | extra inline styles merged onto the `<canvas>`               |

## Colors (Figma "Blue Builder" scale)

| token       | hex       | use in hero                     |
| ----------- | --------- | ------------------------------- |
| `blue-50`   | `#FAFCFF` | title, logo, on-dark text       |
| `blue-500`  | `#CEE2FF` | brand accent, primary button    |
| `blue-700`  | `#92A0B5` | paragraph, nav links            |

## Fonts

The hero uses **Doto** for the H1 (uppercase, dotted display) and **Google Sans
Flex** for everything else (applied via inline `fontFamily`). Load both in your
app's `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Doto:wght@100..900&family=Google+Sans+Flex:wght@400..700&display=swap" rel="stylesheet" />
```

The self-contained `builders-hero.html` at the repo root already inlines these
fonts (subset), so it needs no network fonts. The full type + color systems
live in `typography.css` and `colors.css` at the repo root.

## Performance

The animation runs at 24fps, only while the tab is visible, and not at all
under `prefers-reduced-motion` (one static render instead). The expensive
resample happens once per size; each frame only re-picks glyphs.
