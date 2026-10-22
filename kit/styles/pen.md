# Style: pen and watercolour on paper (built-in)

Built-in style `pen` (live: Fibre by Fibre, https://explorables.fly.dev/e/paper/), the house default. Engine: `kit/engines/pen.js` (the nib), `paper.js` (noise, paper height fields, raking light, ink diffusion) and `hands.js` (contour hands that hold things). Exemplar for the master study: `references/exemplars/paper-essay.jpg` (Fibre by Fibre; study the hero or the brush-on-sheet panel).

## Medium and process
A fine technical pen on hot-pressed paper, with a few pale watercolour washes under it. The line does most of the work: objects are outlined once, lightly, with construction left visible. Washes are flat and pale, laid inside or near the line, never filling the page.
**Engine:** every line is `Pen.ink(g, pts, { w, seed, jit, boil, dry })`: a ribbon whose width follows slow pressure noise, swells where the nib lands, thins as it lifts and skips where the nib dries. Ink multiplies, so crossings darken. Washes are one flat `fill` at low alpha under the ink, with a soft edge from `Paper.makeNoise`.

## Light
Diffuse, high-key, no cast shadows on objects. The only light is the **raking light on the paper itself**: a height field shaded from the upper left, so the sheet has a faint relief and the drawing sits *on* it.
**Engine:** `Paper.paperHeight` + `Paper.shade` on a background canvas, very faint (relief amplitude ≤ 3% of value). No gloss. A wash can have a slightly darker pooled edge, nothing more.

## Value and saturation
Lightest: the paper. Darkest: the ink, which is near-black but never pure. Contrast lives in the line; washes stay within the top third of the value range. Saturation is low; one or two accent washes at most.

| role | hex |
|---|---|
| paper | `#f8f6f1`, tooth shade `#ebe7df` |
| ink | `#1a191c`, light stroke `#55535a` |
| wash, water | `#dbe8f3` |
| wash, straw / fibre | `#efe7cf` |
| accent (data, highlight) | `#8f84e8` |
| muted text | `#6b6b70` |

## Edges and line
Outlines on everything, 0.9–1.6 px at 1440 wide, with visible pressure variation and a little wobble. Corners overshoot slightly (a drafting habit). Hatching is sparse and single-direction. Washes have soft, slightly bled edges and sit a hair off the line.

## Fills
Mostly none: paper shows through. A pale wash where material matters (water, a sheet, a fibre mat). No gradients.

## Texture
Paper tooth, very fine, everywhere and faint. Ink has grain where it dries. Nothing else.

## Density and composition
One object or diagram per stage, centred, with a lot of white. Captions are small and close to the thing they name. Isometric boxes, cross-sections and exploded views are natural here.

## Drawing vocabulary
Simple orthographic or 30° isometric construction. Hands (`Hands.grip`, `pinch`, `flat`) hold tools and objects. Particles and fibres are short inked strokes. Data is drawn as inked things: tally marks, stacked sheets, dots on a sheet, a ruled scale.

## Type
Display: **Barlow** 600 (house default; plain and drafting-room). Body: **Barlow** 400. Labels, data and source tags: **IBM Plex Mono**. Headings take the ink-textured mask from `house-style`.

## Motion
Lines draw on along their length (0.6–1.2 s). Washes bloom from a point. Ink drops diffuse (`Paper.inkSim`). The paper never moves.

## Do-nots
Heavy black outlines. Saturated fills. Drop shadows. More than two accents. Filling the stage: keep the white.

## Hand-off to the video
The video copies `pen.js`, `paper.js` and `hands.js` into `lib/` and this palette.
