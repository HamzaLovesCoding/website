# Vivid Motion

A dark, editorial landing experience for a creative studio — built as one
continuous scroll composition rather than a stack of sections.

All copy, imagery and project data are **placeholders**. They live in a single
file (`lib/content.ts`) and the generated media in `public/media/`, so swapping
in real content should not require touching a component.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run media    # regenerate the placeholder imagery
npm run preview  # build the single-file preview (see below)
```

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Motion | GSAP 3 + ScrollTrigger |
| Scroll | Lenis, driven by the GSAP ticker |
| WebGL | Three.js — dynamically imported, two shader surfaces only |
| Styling | Plain CSS custom properties + CSS Modules |

There is no UI framework and no animation-preset library. Every transition is
written for the place it appears.

## Standalone preview

`npm run preview` writes `preview/index.html` — the whole site as one
self-contained file, for opening somewhere a Node server can't run.

It is a static export, not a second codebase. The build script reads the real
stylesheet, the real GLSL and the real copy out of `styles/`, `lib/shaders/`
and `lib/content.ts`, inlines the next/font faces that `next build` already
downloaded, and base64s the imagery. The only thing written twice is the motion
orchestration, in `preview/app.js`, rewritten against the DOM instead of React.

Two deliberate differences from the app:

- **Raw WebGL instead of Three.js.** Both surfaces are one quad with a fragment
  shader; Three would have been 400KB of inlined library for a scene graph
  neither uses. The GLSL itself is the app's, verbatim.
- **Libraries inlined rather than loaded from a CDN**, so the file works with
  no network at all.

Because the CSS and layout come from the same source, the export lays out
identically — same page height to the pixel. Regenerate it after changing
anything in `styles/`, `lib/` or the components' CSS modules.

## Design system

`styles/globals.css` holds the whole system: palette, fluid type scale, gutters,
easing curves and the handful of shared primitives (`.u-shell`, `.u-label`,
`.u-display`, `.u-mask`, `.u-head`). Component-specific rules sit in colocated
CSS Modules.

- **Ground** `#0a0a0a`, **accent** `#f03b0f`, ink `#f4f1ec`.
- **Type** Instrument Serif (display, with a true italic) / Inter Tight (UI) /
  JetBrains Mono (micro-labels). The dramatic jump between the display and
  label sizes is the main compositional device.
- Every size and gutter is `clamp()`-based and viewport-driven, so the layout
  holds its proportions from 360px to 2560px instead of only shrinking.

## The scroll journey

| Section | What it does |
|---|---|
| `Hero` | Full-viewport fBm shader; masked line reveals; exits on a different plane from the canvas behind it |
| `Manifesto` | Pinned. The headline resolves word by word against scroll while a plate drifts behind at half speed |
| `Expand` | A framed plate opens to full bleed as the word behind it slides away — one section becoming the next |
| `Work` | Six sticky cards dealt over one another; each recedes and dims as the next arrives, with parallax inside each frame |
| `Gallery` | WebGL displacement transition between plates, plus a live cursor warp. Drag, click or arrows to advance |
| `Services` | Capability rows: keyword ticker, cursor-trailing preview plates, animated dividers |
| `Process` | Vertical scroll converted to horizontal travel, distance measured from the rail |
| `Statement` | The loudest typographic moment — character reveals from alternating directions, and the page's one scramble |
| `Journal` / `Cta` / `Footer` | Editorial list, magnetic button, and a giant wordmark lit by the cursor |

Section lengths are the pacing dials, set in `vh` at the top of each module
(`Manifesto` 210vh, `Expand` 240vh) and by the card height in `Work` (92svh
each). `Process` is the exception: its height is measured from the rail at
runtime, so it is exactly as long as the rail has to travel and adding a card
re-paces it automatically.

The loader runs for ~1.5s and only once per tab — a `sessionStorage` flag
skips it on the way back, so it stays an introduction rather than a toll booth.

Ambient intensity is curved deliberately across the page: bright at the hero,
pulled well back through the work and capability sections so the accent reads
as an accent, and brightest at the CTA. Each section's `data-ambient` value is
its position on that curve.

## Interaction

- **Custom cursor** with named states. Elements opt in declaratively —
  `data-cursor="view"` plus an optional `data-cursor-label` — and the listener
  is delegated from the document, so nodes mounted later work without
  registration.
- **Magnetic** wraps a child and pulls it toward the pointer; it clones the
  child rather than wrapping it in a div, so it doesn't disturb layout.
- **Ambient light** is one fixed layer whose intensity is a CSS custom
  property. Any section can pull the light toward it with `data-ambient="0.9"`.

## Media

`scripts/generate-media.mjs` generates every image from domain-warped fBm —
value noise, ridged noise, a palette ramp sampled in linear light, a filmic
highlight roll-off and film grain. Nothing is fetched from a third party, and
every plate is guaranteed to sit in the palette.

Re-run `npm run media` after editing the looks or ramps at the bottom of that
file.

## Accessibility & resilience

- `prefers-reduced-motion` collapses every animation to its end state, drops
  Lenis for native scrolling, and stops both render loops after a single frame.
- Pointer-driven effects are gated behind `(hover: hover) and (pointer: fine)`,
  so touch devices get the visual system without effects that can't fire.
- The hero falls back to a CSS composition if WebGL is unavailable or the
  context is lost; the gallery falls back to a cross-fade.
- Both renderers pause when offscreen, cap DPR (1.6 desktop / 1.25 mobile), and
  register each resource's teardown as it is created so an unmount mid-setup
  cannot strand a canvas.
- Content is server-rendered and readable without JavaScript; the loader is
  dismissed by a `<noscript>` rule.

## Swapping in real content

1. Edit `lib/content.ts` — headlines, projects, services, journal, footer.
2. Drop real images into `public/media/` and point the content file at them.
   Landscape plates are used at 16:10, gallery plates at 4:5.
3. Adjust `SITE.wordmark` for the footer; it is split per character at runtime,
   so any length works.
