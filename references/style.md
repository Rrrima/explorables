# Style from a reference image

The reference image is the art direction. Copying its *surface* (its colours, a font, a motif) gives a generic result. Reproduce how it is **made** and how it **feels**: light, density, how paint sits on paper, what is left empty.

Known failure: an oyster essay took the reference's indigo blobs and wood streaks but lost its light, gloss, saturation and density. The result was pale, flat and decorative, and the designer called it "far worse".

## 1. Look hard, and write it down

`Read` the reference image (at least twice: whole, then attending to details). Write `STYLE.md` in the essay directory. For each item, say what you see **and how you will reproduce it in canvas**.

- **Medium and process**: watercolour, gouache, pen, crayon, riso, engraving… Name the physical process; the engine simulates it.
- **Light**:
  - Is there a light direction, light rays, cast shadows?
  - Gloss highlights: where, what shape (crisp white flecks, soft bloom)?
  - Is the image high-key or moody?
- **Value and saturation**: the darkest dark and lightest light, and where the strongest contrast is. Which colours are saturated (accents) and which muted (grounds)? Sample 5–8 hex colours with roles.
- **Edges and line**: outlines or none? Hard, soft or wet bleed? Line weight and variation.
- **Fills**: flat, graded, granulating, layered glazes, paper showing through, back-runs (blooms) at edges.
- **Texture**: grain scale relative to objects, and where texture is strong or absent.
- **Density and composition**: a full-bleed flat-lay, a vignette on white, or a single object? How much empty space? Overlap and cropping at frame edges?
- **Drawing vocabulary**: what objects look like (construction, perspective, level of detail, cute or realistic), patterns on surfaces, characteristic marks.
- **Type**: a Google Fonts pairing that belongs with it (display, body, mono), and why.
- **Motion**: how this medium would move (washes bloom outward, pen draws on, plates slip).
- **Do-nots**: what would break it.

## 2. Build the engine

Start from the nearest existing engine. Read the code; don't imitate a description.

| Medium | Exemplar |
|---|---|
| pen + watercolour | `kit/engines/pen.js` (textured nib: pressure, wobble, ragged edges, dry skips, bleed, grain), `kit/engines/hands.js`, `examples/paper/essay/js/film.js` (washes on a colour layer multiplied under ink) |
| risograph / spot colour | `kit/engines/riso.js` |
| fashion line art | `kit/engines/pen.js` (a fine fashion-plate line works the same way) |
| notebook ink blots | `examples/lucky/essay` (cached inked sprites) |
| crayon | `kit/engines/crayon.js` |

`js/<medium>.js` exposes:

- primitives in the medium: `line`, `fill`/`wash`, `mark`, `text`
- the **light** system the reference has: highlights, shadows, rays, gloss
- the paper/background
- motif helpers for the reference's vocabulary (plates, bowls, hands, faces, sparkles…)

Use layered canvases where the medium is layered (washes multiplied under lines, a highlights layer on top). Render at devicePixelRatio.

## 3. Master study (before drawing anything topical)

Make `dev/study.html`: **re-create a crop of the reference** with your engine (one plate, one bowl, a corner of the table) at the same size and framing. Then:

1. Screenshot it and `scripts/compare.mjs` it against the reference.
2. Name the biggest differences (light, washes, edges, saturation, density) and fix them.
3. Stop after **at most 3 rounds**: good enough to carry the essay, not a forgery.

This is where the look is won or lost. If you can't make the study look like the reference, nothing built on the engine will.

Then make `dev/style-test.html`: 3–4 objects from *your topic* drawn in the same hand, plus a label, a number and a data mark. One look and one fix pass.

## 4. Theme the page

- CSS variables from the palette, fonts and page background.
- The page should feel like the reference (warm wood table, white gallery wall, graph paper…), but keep text areas calm and readable.
- Build the essay's own CSS. Borrow *mechanics* (sticky stages, nav behaviour) from exemplars, not their look: don't copy another essay's `base.css` and retint it.
- Custom cursor in the medium. Follow `house-style`.

## 5. Hand-off to the video

The video reuses this engine (copied into `<slug>-explainer/lib/`) and this palette. Note in `STYLE.md` which helpers the video will need.
