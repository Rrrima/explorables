# Style: two-ink risograph print (built-in)

Built-in style `riso` (live: The Shelf, https://explorables.fly.dev/e/wine/). Engine: `kit/engines/riso.js` (`Riso.Plate`, `COLORS`, `paperTile`, `speckleTile`, `bottlePath`, `PROFILES`), which needs `pen.js` and `paper.js` for its lines and noise. Exemplar for the master study: `references/exemplars/wine-essay.jpg` (The Shelf; study the hero shelf of bottles or the three barrels).

## Medium and process
A risograph print on cream stock: each colour is a separate ink drum, so the picture is a few flat spot-colour plates laid one over another and slightly out of register. Fills are solid with pinholes and faint density blotches; lines are broken, rough and in the second ink.
**Engine:** each colour is a `Riso.Plate(w, h, color)`: an offscreen layer filled with that ink through a speckle mask, nudged 1–3 px off register, then multiplied onto the paper so overlaps darken like real ink. Lines are `Pen.ink` with high `dry` and `jit` in the plate's colour.

## Light
None in the drawing. The paper is flat cream. The only "light" is where two inks overlap and go dark, and where speckle lets paper through.

## Value and saturation
Two saturated inks on cream: orange is the main ink, blue the second. Overlaps make a dark brown-violet. Black is rare and reserved for small type. A third ink (pink, yellow or green) is allowed for one chapter if it earns it.

| role | hex |
|---|---|
| paper | `#f6f1e6` |
| orange ink | `#e2643a` |
| blue ink | `#2b4ca0` |
| overlap (orange × blue) | about `#5a2a3c`, made by multiply, never picked |
| ink (small type) | `#221e20` |
| spare inks | pink `#e98c96`, yellow `#f0c446`, green `#468c6e` |

## Edges and line
Fills have soft, speckled edges, and sit 1–3 px off from the lines around them. Lines are dry and broken, 2–3 px, drawn in the *other* ink (blue line on an orange bottle). Hairlines for axes and leaders in blue.

## Fills
Flat spot colour. Density only varies through speckle and a soft blotch field (the drum's uneven inking). Tints are the same ink screened lighter (alpha), not a different colour. Paper through the pinholes.

## Texture
Speckle at print scale (pinholes a pixel or two wide), soft blotches at object scale, a faint paper grain under everything. Keep it visible in a close-up and quiet at reading distance.

## Density and composition
Poster-like. One big object or a tidy repeat (a shelf of bottles, a pyramid of grapes, three barrels in a row). Big numbers set in orange beside the picture. Chapters change colour emphasis (an orange chapter, a blue chapter) rather than palette.

## Drawing vocabulary
Silhouettes with a few interior lines. Objects in profile or straight on; no perspective. Bottles, barrels, glasses and crates are the native vocabulary; other topics get the same flat silhouettes. Data is drawn as printed things: a grid of icons, a filled bar that is literally a barrel, dots that are grapes.

## Type
Display: **Bricolage Grotesque** 800 in the orange ink (a loud grotesk that prints well). Body: **Literata** 400 in the ink colour. Labels and data: **IBM Plex Mono** in blue.

## Motion
Plates drop in one at a time (orange, then blue), each slightly off, in 0.4–0.7 s. Objects slide as a block, no deformation. Numbers count up in orange.

## Do-nots
Gradients, shadows, anti-aliased perfection. More than two inks on one stage. A white page: it is cream stock. Black outlines. Mixed, muddy colours that aren't an overlap.

## Hand-off to the video
The video copies `riso.js`, `pen.js` and `paper.js` into `lib/` and the two inks.
