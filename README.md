# Business Entrepreneurship Club

The website for the Business Entrepreneurship Club at San Marin High School — a
single-page, dark editorial site built as one continuous scroll composition
rather than a stack of sections. Its job is to get people to a meeting.

All copy lives in one file (`lib/content.ts`). Anything in `[SQUARE BRACKETS]`
there is a placeholder still waiting on a real value — meeting time, room,
contact details, social handles and photos.

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

No UI framework and no animation-preset library. Every transition is written
for the place it appears.

## Editing the content

`lib/content.ts` is the only file you need for text changes. Each export maps
to one section:

| Export | Section |
|---|---|
| `SITE` | Club name, header mark, footer wordmark, school |
| `NAV` | Menu and header links |
| `HERO` | Headline, meeting details, eyebrow |
| `TOPICS` | The ticker under the hero |
| `ABOUT` | Who we are, plus the three figures |
| `HINGE` | The full-bleed "Build" moment |
| `PROGRAM` | The six things the club does — one card each |
| `INSIDE` | The four plates in the distortion gallery |
| `FOCUS` | The four focus areas |
| `YEAR` | The five steps of the horizontal rail |
| `WHY` | The oversized "why join" statement |
| `FAQ` | Questions and answers |
| `JOIN` | Call to action and contact email |
| `FOOTER` | Meeting details, socials, announcements |

A `Phrase` (`{ lead, em, tail }`) is a heading with one italicised word — the
single typographic flourish in the system. Add or remove list items freely;
every section counts its own entries, and the horizontal rail re-paces itself.

### Swapping in real photos

Drop files into `public/media/` and point `PROGRAM[].image` and
`INSIDE[].image` at them. Landscape plates are used at 16:10, gallery plates at
4:5. The current imagery is abstract and generated (see below), so real photos
of meetings and the hackathon will lift the page considerably.

## The scroll journey

| Section | What it does |
|---|---|
| Hero | Full-viewport fBm shader; masked line reveals; exits on a different plane from the canvas behind it |
| About | Pinned. The headline resolves word by word against scroll while a plate drifts behind at half speed |
| Build | A framed plate opens to full bleed as the word behind it slides away — one section becoming the next |
| Programme | Six sticky cards dealt over one another; each recedes and dims as the next arrives |
| Inside | WebGL displacement transition between plates, plus a live cursor warp. Drag, click or arrows |
| Focus | Rows with a keyword ticker, cursor-trailing preview plates and animated dividers |
| The Year | Vertical scroll converted to horizontal travel, distance measured from the rail |
| Why join | Character reveals from alternating directions, and the page's one scramble |
| FAQ / Join / Footer | Q&A list, magnetic button, and a giant wordmark lit by the cursor |

Section lengths are the pacing dials, set in `vh` at the top of each module
(`Manifesto` 210vh, `Expand` 240vh) and by the card height in `Work` (92svh
each). `Process` is the exception: its height is measured from the rail at
runtime, so it is exactly as long as the rail has to travel and adding a step
re-paces it automatically.

The loader runs for ~1.5s and only once per tab — a `sessionStorage` flag skips
it on the way back.

Ambient intensity is curved deliberately across the page: bright at the hero,
pulled well back through the middle so the accent reads as an accent, and
brightest at the join section. Each section's `data-ambient` value is its
position on that curve.

## Standalone preview

`npm run preview` writes `preview/index.html` — the whole site as one
self-contained file, for opening somewhere a Node server can't run.

It is a static export, not a second codebase. The build script transpiles the
real content file, reads the real stylesheet and GLSL, inlines the next/font
faces `next build` already downloaded, and base64s the imagery. The only thing
written twice is the motion orchestration, in `preview/app.js`, rewritten
against the DOM instead of React.

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

`styles/globals.css` holds the whole system: palette, fluid type scale,
gutters, easing curves and the shared primitives (`.u-shell`, `.u-label`,
`.u-display`, `.u-mask`, `.u-head`). Component-specific rules sit in colocated
CSS Modules.

- **Ground** `#0a0a0a`, **accent** `#f03b0f`, ink `#f4f1ec`.
- **Type** Instrument Serif (display, with a true italic) / Inter Tight (UI) /
  JetBrains Mono (micro-labels). The jump between display and label sizes is
  the main compositional device.
- Every size and gutter is `clamp()`-based and viewport-driven, so the layout
  holds its proportions from 360px to 2560px instead of only shrinking.

## Interaction

- **Custom cursor** with named states. Elements opt in declaratively —
  `data-cursor="view"` plus an optional `data-cursor-label` — and the listener
  is delegated from the document.
- **Magnetic** pulls a child toward the pointer; it clones the child rather
  than wrapping it in a div, so it doesn't disturb layout.
- **Ambient light** is one fixed layer whose intensity is a CSS custom
  property. Any section pulls the light toward it with `data-ambient="0.9"`.

## Media

`scripts/generate-media.mjs` generates every placeholder image from
domain-warped fBm — value noise, ridged noise, a palette ramp sampled in linear
light, a filmic highlight roll-off and film grain. Nothing is fetched from a
third party, and every plate sits in the palette. Re-run `npm run media` after
editing the looks or ramps at the bottom of that file.

## Accessibility & resilience

- `prefers-reduced-motion` collapses every animation to its end state, drops
  Lenis for native scrolling, and stops both render loops after a single frame.
- Pointer-driven effects are gated behind `(hover: hover) and (pointer: fine)`.
- The hero falls back to a CSS composition if WebGL is unavailable or the
  context is lost; the gallery falls back to a cross-fade.
- Both renderers pause offscreen, cap DPR, and register each resource's
  teardown as it is created.
- Content is server-rendered and readable without JavaScript; the loader is
  dismissed by a `<noscript>` rule.
