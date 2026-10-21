# Style: a thin grey pen and one blue watercolour, on warm white

Reference: `reference.png` (696 × 636). A small figure in a white dress sits on the paper, legs stretched out, hands in her lap. A translucent sky-blue cube sits over her head; her head is visible inside it, tinted blue.

## What I see, and how the canvas will do it

**Medium and process.** A fine hard pen (or a sharp pencil) for the figure: one thin, confident contour line, grey rather than black, slightly broken where the nib skips. Then transparent watercolour in a single blue, laid as flat washes face by face, wet enough to granulate and dry with a lighter cloud in the middle and a faint darker rim where the pigment pooled at the edge. The washes are painted *over* the pen: the head's lines show through the blue.
→ `js/pen.js` (kit nib) at width ≈ 1.1 units, ink `rgb(74,74,78)` at alpha 0.78, `dry` 0.4, no bleed halo. `js/wash.js` lays a wash as: a jittered polygon fill → granulation (`source-atop` noise) → one or two blooms (`destination-out` soft clouds) → an inner pooled rim (clipped inside strokes). Washes live on a colour layer that is composited with `multiply` under/over the ink layer, so ink inside a wash reads blue-grey like the reference.

**Light.** High-key. No cast shadow, no light direction, no gloss. The only lighting is the cube's own: the top face is almost white (a big dry patch), the left face is the most saturated, the right face sits between. Edges of a wash are slightly darker than its middle.
→ Face tones come from alpha of one blue: top ≈ 0.22 (with a large bloom), left ≈ 0.78, right ≈ 0.60. No shadow primitives exist in the engine.

**Value and saturation.** Darkest dark: the pen line, `#4f4f4f` at its densest, usually lighter (`#6a6a6e`). Lightest light: the paper, `#fcfaf6`, and the dress, which is just paper with a whisper of grey. The strongest contrast is the saturated left face of the cube against the white. One hue only: a cyan-leaning sky blue. Everything else is grey or white.

| role | hex |
|---|---|
| paper | `#fcfaf6` |
| pen ink | `#4a4a4e` (drawn at 0.78 → reads `#6a6a6e`) |
| blue, full strength (left face, pooled rims) | `#7fcbdc` |
| blue, mid (right face) | `#95c9db` |
| blue, pale (top face body) | `#c1e1e9` |
| blue, dry bloom (top face centre) | `#dff0f2` |
| ink seen through blue | `#8fb8c8` (what multiply gives) |
| dress / skin | `#efeeee` on paper, i.e. no fill |
| type, muted | `#6e6e73` |

**Edges and line.** The pen line is ~1 px at 696 px wide (0.15% of the width), wobbly by less than its own width, fainter at the ends, with a few gaps. No outlines on the washes: the wash edge is its own edge, geometric but soft, with ~1–2 px of wander and a darker 2–4 px rim just inside.
→ Pen: `jit` 0.5, `w` 1.1 × stage scale. Wash: edge resampled every 6 units and displaced by fbm ±1.4 units; rim = two clipped inner strokes (6 units at α 0.18, 2.5 units at α 0.28) in the same blue.

**Fills.** Transparent flat washes, one coat, with granulation (fine, ~1% of the cube's width) and 1–2 lighter blooms per face; the top face is one big bloom. The dress is unfilled paper. Overlapping washes multiply (glazes), but in the reference faces do not overlap.
→ `wash(pts, blue, a, seed, { bloom, pool, grain })`.

**Texture.** Granulation is fine and even inside the blue, absent on the paper (which is flat and smooth). No visible paper grain in the reference.
→ Page background is flat `#fcfaf6` with a barely-there CSS grain (α ≤ 0.03); canvases are transparent so there is no rectangle.

**Density and composition.** One vignette on a large sheet of nothing. The object sits left of centre and high; the lower right quarter and the whole right edge are empty. The cube is ~56% of the width, the figure ~50% of the height. Nothing is cropped by the frame.
→ Stages leave 35–50% empty paper. Compositions sit on the left or on thirds; text lives in the empty air.

**Drawing vocabulary.** A small, quiet, nearly faceless person (a bob haircut, a profile with a dot of a nose, no mouth), simple geometric solids as translucent volumes (cube; the essay adds tetrahedra, columns, spheres, slabs), bodies that slump, sit, lie or lean, and *overlap*: a solid over a head, a head inside a solid. Things are drawn small inside a lot of space. The one metaphor the essay inherits: a translucent blue solid is "the machine's thought"; the grey line is "the person". Where blue covers the line, the person is thinking inside the machine.
→ `figure(pose)` helpers: `sit` (reference), `sitUp`, `stand`, `kneel`, `lie`, `walk`; `solid(kind, …)` projected 3-D volumes; `blob` washes for soft things; `drop` for a single blue dot (data marks are blue drops and grey pen ticks).

**Type.** Display: *Cormorant Garamond* (500, with the italic for emphasis): a thin, elegant serif with the same hairline weight as the pen. Body: *Source Serif 4* (400/600) at 18 px: bookish and calm, like the reference's quiet. Labels, source tags and numbers: *IBM Plex Mono* (house default).

**Motion.** Washes bloom outward from a wet edge over ~1 s (alpha and edge jitter grow). Pen lines draw on along their length. Solids tumble slowly (2–4° per second) or settle. The figure's slump is a 0.8 s ease. Nothing bounces. Blue tint over a head deepens rather than snapping on.

**Light system in the engine.** `bloom` (a dry lighter patch inside a wash), `pool` (darker inner rim), face alpha by orientation (`solid()` shades top 0.22, left 0.78, right 0.60). No shadows, no gloss, no rays.

## Do-nots
- No outlines around washes, and no washes under the figure (the dress is paper).
- No black. Lines are grey, at most `#4f4f4f`.
- No second hue. Grey, white and one blue. Emphasis is more blue or more alpha, never red.
- No shadows, gradients, borders or cards on the page.
- Don't fill the frame. Half the stage stays empty.
- Faces are tiny (a nose, an eye-dash). No expressions bigger than a dot.
- No thick lines: the pen never exceeds ~1.6 units at 1000-unit stage width.

## Hand-off to the video
The video copies `js/paper.js`, `js/pen.js`, `js/wash.js` into `lib/` and uses `Wash.stage`, `wash`, `blob`, `drop`, `line`, `solid`, `figure`, `face`, `sparkle`, `label`, `leader` plus this palette.
