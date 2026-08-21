# Asilo Builders — React hero

Drop-in React + Tailwind hero section with an interactive ASCII background
(an El Ávila + Caracas skyline that breathes).

## Files

- `AsciiBackground.jsx` — the `<canvas>` ASCII engine (z-0). Renders a
  procedural Caracas/El Ávila skyline by default, or a real image via `src`.
- `AsiloBuildersHero.jsx` — the full hero: header nav + centered content over
  the background and a legibility vignette.

## Usage

```jsx
import AsiloBuildersHero from "./react/AsiloBuildersHero";

export default function Page() {
  return <AsiloBuildersHero />;
}
```

Requirements: React 18+ and Tailwind CSS. For the monospace glyphs and the
`font-mono` badge, make sure a mono face is available (the canvas asks for
`JetBrains Mono` and falls back to the system mono).

## Using your own photo (El Ávila)

The default background is drawn procedurally, so it needs no assets. To use a
real photograph instead, put the image in your app's public assets and pass it:

```jsx
// inside AsiloBuildersHero.jsx, replace <AsciiBackground /> with:
<AsciiBackground src="/images/avila.jpg" />
```

The luminance mapping self-adjusts to photographs — no retuning needed. If the
image fails to load, the component falls back to the procedural skyline.

Note: to read a remote image's pixels the host must send permissive CORS
headers (the component sets `crossOrigin="anonymous"`). A same-origin file in
your own `/public` folder is simplest.

## Props (`AsciiBackground`)

| prop         | default     | notes                                          |
| ------------ | ----------- | ---------------------------------------------- |
| `src`        | —           | image URL; omit for the procedural skyline (photos use histogram equalization, the skyline uses silhouette normalization) |
| `ink`        | `#6f7075`   | glyph color                                    |
| `accent`     | `#0066FF`   | color of the few brightest glyphs that glow blue |
| `background` | `#0a0a0b`   | canvas background                              |
| `cell`       | `9`         | glyph cell size in px (smaller = denser)       |
| `className`  | `""`        | extra classes on the `<canvas>`                |

## Performance

The animation runs at 24fps, only while the tab is visible, and not at all
under `prefers-reduced-motion` (one static render instead). The expensive
resample happens once per size; each frame only re-picks glyphs.
