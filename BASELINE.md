# Asilo — Project Baseline

This document marks the **base starting point** of the Asilo project. Everything
below is implemented, working, and pushed to `claude/talent-network-landing-3dzvkj`.

## What's in the baseline

### Main landing page (static, bilingual)
- `index.html`, `styles.css`, `script.js`, `data.js`
- **Bilingual** ES/EN toggle (Spanish default, remembers choice)
- Sections: hero → builders carousel → **map of Venezuela** (lat/lng-accurate
  pins) → projects showcase → what-is-Asilo → how-it-works → two-sided
  (talent/companies) → FAQ → closing CTA → footer
- All builders/projects are data-driven from `data.js` (edit people in one place)
- Apply / company CTAs read single-source URLs in `script.js` (placeholders)

### Asilo Builders hero (React + Tailwind)
- `react/AsciiBackground.jsx` — canvas ASCII engine (mushenzhen technique)
  - Procedural, detailed, **full-viewport** El Ávila + Caracas cityscape
    (layered skylines, towers, signage, rail, foreground street/plaza)
  - **Sparse blue accent** (`#0066FF`) on a few of the brightest glyphs
  - Optional real-photo mode via `src` (histogram equalization, self-adjusting)
  - 24fps, visibility-gated, reduced-motion aware, cleanup on unmount
- `react/AsiloBuildersHero.jsx` — header + centered hero content over the
  background and a legibility vignette
- `react/README.md` — usage, props, photo swap

### Typography
- **Inter** (text/labels) + **Source Serif 4** (editorial headings)
- Full type-scale + weight token system in `styles.css` `:root`

### Live previews (Artifacts)
- Landing page: https://claude.ai/code/artifact/7f84ee8d-0a41-408f-a81d-45dcd0288fa3
- Asilo Builders hero: https://claude.ai/code/artifact/be4beccf-aa34-4750-ac47-ac298405459f

## Swapping the ASCII background image
The hero preview has a single `IMAGE_SRC` slot. Attach an image **file** (not
pasted inline) and it gets embedded + rendered as ASCII; leave it empty for the
procedural skyline.

## Next steps / open items
- Real Ávila photo (needs a file upload, not an inline paste)
- Optional: line-art ASCII mode; interactive Leaflet map; real builder photos;
  wire the Apply form URL; favicon + OG image; deploy config
