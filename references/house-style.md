# House style

The owner is a designer with a strong, minimal taste. Their feedback has been blunt and consistent ("so ugly!!!", "why borders on everything???"). This is that feedback written down as rules.

## Always

- **Minimal and clean.** Few elements, quiet hierarchy, generous but compact spacing. When unsure, remove.
- **The topic's own style comes from its reference image** and is carried through the essay and the video. Interface chrome around it (nav, captions, controls) stays plain.
- **Ink, not CSS.** Textures are subtle and organic: ink-mask on text, fine paper grain, uneven pen lines, watercolour blotches. Tune texture by eye against the reference and stop early. "Too much" and "too little" have both happened.
- **Visuals carry the explanation.** Text supports the drawings. Treat each scene as a frame of an animated film.
- **Data in the essay's idiom.** Draw quantities as things (fibres at true scale, stitched bars, dots for households), never as a stock bar chart.
- **Playful details.** Small faces on objects, sparkles marking hoverable parts, hands doing the work.
- **Motion with care.** Eased and nuanced: scroll-scrubbed scenes, particle transitions, slight parallax. Nothing bouncy or gratuitous.
- **Responsive.** Check at 390 px wide: no horizontal scroll, readable type, a hamburger menu if the nav doesn't fit.
- **Sharp.** Canvases render at devicePixelRatio. No blurry text or lines on phones.

## Never

- Borders around boxes, panels or controls. No shadows on cards. No rounded card containers. No "big white rounded blocks".
- Default-blue or arbitrary coloured link text. Links are ink, with an inked underline on hover.
- Black pill buttons, badges, bubbles or dots as decoration.
- Stock-looking charts, gradients or icon sets that clash with the hand-made look.
- Showing raw logs, tables or long text by default. Fold them: summary first, details on demand.
- Inventing a second look for the same topic. The video must reuse the essay's drawing engine and palette.

## Typography defaults

These apply when the reference doesn't dictate type.

- Barlow (400/500/600/700) for display and body; IBM Plex Mono for labels, source tags and data. Near-black `#1d1d1f`, muted `#6e6e73`.
- Load fonts from Google Fonts. Each essay may pick its own pairing to fit its reference (for example, riso essays use a grotesk plus a serif).

## The workshop look

The gallery page uses this look; reuse it when a reference doesn't override it.

- Page: `linear-gradient(125deg, #f2f2f2, #f5feff)` plus a faint fractal-noise grain (see `examples/index.html`).
- Text ink-mask: `--ink-mask` (SVG turbulence mask) on headings and body.
- Header: a translucent washi strip with a torn bottom edge, the same colour as the page, a soft shadow.
- Thin rules (`rgba(0,0,0,0.08)`) between sections.

## Before you say "done"

- Every deliverable serves and renders. You have screenshotted it, desktop and mobile.
- Every item the user's prompt asked for is covered.
- Nothing overlaps, overflows or is cut off.
- The style matches the reference side by side.
- No console errors.
