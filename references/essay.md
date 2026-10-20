# Scrolly essay

The examples are the quality bar. Open them (`node scripts/gallery.mjs`) and read their code before writing your own; screenshots of more essays made this way are in `references/exemplars/`.

- `examples/paper/essay`: pen-and-watercolour film, sticky stages, timeline, report
- `examples/sit-stay-think/essay`: needle-felted animals drawn with WebGL (`kit/engines/glfur.js`), hover notes, data drawn as felt
- `examples/lucky/essay`: a runnable simulation with particle-story chapters

## 1. Story first

- **One spine**: a single object, number or question the whole essay returns to. Pick it from the research: the most surprising true thing.
- **6–8 chapters**. Each has a title, one claim, **one visual idea that shows the claim without text**, its data and source tags, and an interaction (scrub, hover, drag, run, choose). Think of each as a short animated film the reader scrubs.
- **Variety**: every chapter's visual is a *different kind* of picture:
  - a process film
  - a true-scale comparison
  - a map
  - a timeline
  - a cross-section
  - a hands-on test
  - a pile or count
  - a table set with things

  The essay's main object can recur, but never as the same drawing in the same layout.
- **Maps use real geography.** Draw coastlines from real coordinates (simplified lat/lon points you look up, projected), with real places in real positions. Never freehand a map from memory: it comes out as an illegible blob.
- Cover every item on the research checklist. Culture and history get real chapters.
- Write `OUTLINE.md`: chapters × (claim, visual kind, what moves as you scroll, data, interaction, sources). Check it against the checklist.

## 2. Page architecture (no build step)

```
<slug>-scrolly/
  index.html      hero, chapters, coda; links to report.html and "▶ Watch the explainer"
  report.html     from research-report
  css/base.css    page, type, links (house-style), written for this essay
  css/article.css hero, nav, reading column, scrolly stages + steps
  js/<medium>.js  the style engine;  js/data.js, js/sources.js
  js/article.js   scroll-driven stages, nav, hovers;  js/sim.js if there's a model
  js/cursor.js    custom cursor in the medium
  README.md
```

- **Hero**: title, teaser with the spine number and its source tag, and an illustration that is **fully in view** on a 1440×900 screen. Make it a rich composed picture in the reference's manner, the essay's best drawing.
- **Back link** (optional): if the essay lives in a collection, a small, muted `← Shelf` link to its index before the essay's name in the top bar, in the page's own type.
- **Navigation**: a thin top bar or an inked sidebar (active chapter expands); hamburger on mobile.
- **Scrolly sections**: a sticky stage beside or behind text steps; scroll progress drives the drawing.
- **Hover details**: hotspots on drawn parts, marked by a sparkle, with a tooltip in the medium (fact + source tag).
- **Simulations**: controls on the left (no borders), the run on the right, larger charts below on the same screen, and a "what just happened" reading linked to the run.

## 3. Layout and pacing rules

These are where the oyster essay failed.

- **The stage visual fills its stage**: about 60–80% of the stage area, and the stage is at least 70vh tall on desktop. Never cut off at the top or bottom at any scroll position. No visible rectangle edge around a textured canvas: let it bleed into the page or give it a clean, composed shape.
- **Balanced screens**: at any scroll position the viewport holds a visual *and* readable text. No screen that is mostly empty, and no lone line of text beside empty space.
- **Each scroll step changes the picture visibly**: something draws on, moves, splits or zooms. A step that only swaps text isn't a step.
- **Desktop text scrolls in.** Steps sit in normal flow, each about 62–72vh tall with its paragraph vertically centred in it. The paragraph crossing the middle of the screen is fully dark and the rest are faded to about 25%. Only the drawing is pinned; don't pin or crossfade the text.
- **Pace**: about 100–140vh of scroll per step. Animations are eased and tied to scroll (no timers racing ahead of the reader). Nothing important changes in under ~0.4 s of real time.
- Text: 17–19 px body, line length about 60–70 characters.
- **Centred and symmetric.** The page container has a max width, `margin: 0 auto` and equal padding on both sides. Check at 1440, 1728 and 2560 px wide: nothing should hug one edge or run off the other.
- **Phones.** Pin the drawing in the top half (`50svh`, opaque) and let the text scroll up through the bottom half. Steps switch when their text reaches the middle of that bottom band, not mid-screen. Don't pin text cards under the stage, because long ones run off the screen. Landscape phones go side by side. Labels inside drawings are at least 11 px, and a label wraps within its own column instead of shrinking.

## 4. Build one chapter at a time

For each chapter, in order:

1. Build it: markup, stage drawing, scroll steps, hover.
2. `scripts/shoot.mjs` at 3 scroll positions through it (desktop), and `scripts/compare.mjs` the best one against the reference.
3. Check it against the checklist in `visual-qa`, fix what's wrong in one pass, and move on to the next chapter.

The hero gets the same treatment first. Don't write the whole essay in one go and check it at the end.

## 5. Whole-essay pass

- `shoot` the whole scroll at desktop (1440) and mobile (390): overlaps, cut-offs, empty screens, overflow, console errors.
- Save a thumbnail: the hero at 1440×900, 900 px wide, as `<slug>-scrolly/thumb.jpg`.

## Build details

- Canvases sized to their box × devicePixelRatio (max 2), redrawn on resize; never bake text into bitmaps.
- `requestAnimationFrame` only while visible; respect `prefers-reduced-motion`.
- **Performance budget.** No frame over about 100 ms on a retina MacBook (1728×1117 @2x). Cache expensive drawings as sprites and build them over several frames. If the style draws tens of thousands of strokes (fur, hatching, grain), don't stroke giant Canvas 2D paths: Chrome rasterises them on the GPU later and the page freezes for seconds. Draw them as instanced WebGL2 geometry instead, batched per sprite, with a Canvas 2D fallback. `kit/engines/glfur.js` shows how; it took that hero from a 7–9 s freeze to about 1.5 s. Check with frame gaps over the first 10 s after load, not only with screenshots.
- Source tags: `<a class="note" href="report.html#m2">M2</a>`.
- Canvases get `aria-label`s; hover facts also appear in the text or report.
