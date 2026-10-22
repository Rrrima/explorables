# Style: fashion-plate ink with one spot colour (built-in)

Built-in style `fashion-plate` (live: Unstitched, https://explorables.fly.dev/e/bags/). Engine: `kit/engines/pen.js` with `paper.js` (a fine, even line; the same nib as `pen` at lower pressure and jitter). Exemplar for the master study: `references/exemplars/bags-essay.jpg` (Unstitched; study the hero bag and its price tag).

## Medium and process
A fashion illustration in fine black ink with one spot colour, oxblood, filled flat where the product is. The page is a magazine spread: very white, very quiet, with Didone display type. The line is confident and even, drawn in one pass, not sketched.
**Engine:** `Pen.ink` with low `jit` (≤ 0.2), no `boil`, `dry` ≈ 0.05 and width 0.8–1.2 px, so the stroke reads as one clean line with a hint of a hand. The spot colour is a flat `fill` at full alpha with a hairline of the same colour, darker, as its edge.

## Light
Flat. The object has no shading except a single thin highlight line along a top edge where leather would catch light, and a faint warm shadow line under it on the page. Nothing else casts a shadow.

## Value and saturation
White page, black line, one saturated dark red. Gold hardware is the only other colour and appears as small marks. Grey only in muted text.

| role | hex |
|---|---|
| page | `#faf8f4` |
| ink | `#1b1a1a` |
| oxblood (spot) | `#7a1f24`, edge `#541317`, tint for data `#c7898c` |
| gold hardware | `#c9a24a` |
| muted text | `#8a8680` |

## Edges and line
One even line, 0.8–1.2 px at 1440 wide, closed and precise. Seams and stitches are rows of tiny dashes. Hairlines for axes, leaders and timelines. Curves are smooth: no wobble that reads as nervous.

## Fills
The product is filled in the spot colour, flat. Everything else is line only. Tints of the spot colour (lighter, alpha) for secondary bars in a chart.

## Texture
Almost none. The faintest paper tone; no grain in the ink. Stitching rows are the texture.

## Density and composition
Editorial: an object alone with a lot of white around it, a tag or a number beside it, a big Didone headline. Charts are hairlines with the data in oxblood and a single annotation in italic. Chapters are "seams": each a different kind of picture (the object, where the money goes, the hands, the resale ladder, the timeline).

## Drawing vocabulary
The product drawn three-quarter or straight on in clean line: the bag, the shoe, the watch. Hands in the same line. Price tags on strings. Data drawn as stitched things: a stitched bar, a ladder of tags, a timeline that is a thread with knots.

## Type
Display: **Bodoni Moda** 400 and 400 italic (a Didone, high contrast, magazine). Body: **Libre Caslon Text** 400. Labels and data: **IBM Plex Mono** 400.

## Motion
Lines draw on smoothly and quickly (0.5–0.8 s). The spot fill wipes in after the line. Stitches appear one by one. Nothing bounces; everything eases like a page turning.

## Do-nots
Sketchy, repeated lines. A second colour beyond oxblood and gold. Cards, borders, backgrounds behind the object. Big crayon-weight lines. A tinted page: it stays white.

## Hand-off to the video
The video copies `pen.js` and `paper.js` into `lib/`, the oxblood and the Bodoni Moda title.
