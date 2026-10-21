# Style: sunlit watercolour flat-lay

Reference: an overhead Japanese breakfast table in anime-style watercolour/gouache. Read twice: whole, then crops (egg plate, soup bowl, fish plate, chopsticks) in `qa/ref/`.

## Medium and process
Transparent watercolour with gouache-like opaque whites, in the "anime food illustration" manner: flat local-colour washes, a *second* hard-edged glaze for shade shapes, a fine dark contour on most objects, and crisp lifted-out whites for gloss.
**Engine:** every shape is a `wash()` on an offscreen layer: (1) flat fill, (2) fbm mottling clipped inside (pigment settling), (3) darker pooled edge (blurred inner stroke, wet-edge effect), (4) optional hard-edged shade glaze (an offset copy of the shape, clipped), then a thin wobbly contour in a darker version of the local colour. Layers are composited `source-over` (the reference is fairly opaque), with a light layer last.

## Light
- Bright, high-key morning sun from the **upper right**; broad diagonal **light shafts** (soft white bands, ~25° off vertical, running upper-right → lower-left) wash over everything and lift the values where they fall.
- **Gloss:** crisp, opaque white *dashes* following the curve of rims (short broken arcs on the inner and outer edges of every plate), white flecks on wet things (yolk, soup, glass). These are the signature. Soft bloom is rare.
- Cast shadows: short, cool, soft-edged blue-grey to the lower left of objects; strongest where plates sit on the indigo mats.
**Engine:** `rays()` (screen-blended blurred white bands on a top canvas), `gloss.rim()` (broken white arc dashes with tapering ends), `gloss.fleck()`, `shadow()` (blurred offset silhouette, multiply, cool grey).

## Value and saturation
Lightest: near-white cream `#fffff0` (rice, egg white, rim gloss, light shafts). Darkest: deep indigo `#24405f` in mat edges and plate shade. Strongest contrast: white plates against indigo mats, yolk against slate plate.
Saturated accents: yolk yellow, vermilion lacquer, spring green. Muted grounds: cream wood, slate blue-grey plates.

| role | hex |
|---|---|
| wood (ground) | `#f5dcac` light, `#ecc791` streak, `#d9a96c` grain |
| indigo mat | `#33597d` body, `#456d8d` light, `#24405f` pooled edge |
| slate plate | `#667d8b`, shade `#4f6277` |
| porcelain white | `#fffff0`, blue pattern `#8fb1cf` / `#3f6fa4` |
| yolk | `#fae06f`, core `#f6c33a` |
| vermilion lacquer | `#d8573b`, inner `#a23c2c` |
| spring green | `#93b55a`, deep `#586454` |
| contour ink | darker local colour, never black; neutral `#3b4655` |

## Edges and line
Fine contour (≈1–1.5 px at 1440 wide), slightly wobbly, in a darker shade of the object's own colour (slate on plates, rust on the lacquer bowl). Some edges have no line (light shafts, food). Mats (the indigo blobs) have no line but a pooled darker edge and smooth organic outlines.

## Fills
Flat local colour, then a second glaze with a **hard** edge for shade, very little gradient. Mottled pigment inside large washes (indigo mats, wood). Back-runs/blooms are occasional and soft. Paper shows only as the whites.

## Texture
Wood: long horizontal streaks of slightly darker ochre wash with soft, ragged ends; streaks are wide (≈2–6% of frame height). Fine granulation only in the indigo. No visible paper tooth at reading size. Keep texture subtle.

## Density and composition
Full-bleed **overhead flat-lay**, dense: objects overlap and crop at the frame edges; ≈70% covered, wood shows in channels between. Big round shapes (plates, bowls) on bigger organic indigo blobs, one long diagonal object (chopsticks) as counterpoint.
**For the essay:** stages are flat-lays on a wood table; the page itself is pale cream wood with faint streaks so canvases bleed into it (no rectangles).

## Drawing vocabulary
Simple, legible shapes; slightly idealised ("cute-realistic"). Plates are near-circles seen straight down with a thick white rim and a shade crescent. Porcelain has hand-painted blue bands and flowers. Food is a few flat shapes plus highlights. No faces in the reference; I allow a tiny face only on the mascot oyster in the hero (playful detail per house style).

Oyster-specific vocabulary I add, in the same hand: half-shell oysters (craggy cream/grey/lilac shell drawn as overlapping lip plates, pearly nacre interior, glossy grey-cream meat with a dark mantle frill, liquor gloss flecks), crushed ice (many small white-blue faceted flecks), lemon wedges, vermilion mignonette bowl, coupe glass, oyster knife, price tags as small cards with a string.

## Type
- Display: **Zen Maru Gothic** (500/700): soft rounded Japanese-flavoured grotesk that sits with the anime-watercolour mood.
- Body: **Barlow** 400/500 (house default; clean and compact).
- Labels/tags/data: **IBM Plex Mono** 400/500.
Ink colour `#2b3440` (indigo-black), muted `#6e7480`.

## Motion
Washes bloom outward from a point (radial reveal with a soft wet edge), contours draw on, gloss dashes "flash" in last; light shafts drift very slowly. Objects slide in across the table like plates being set down (eased, no bounce).

## Do-nots
Pale, desaturated washes (the first attempt's failure). Black outlines. Gradients that look digital. Flat vector circles with no shade glaze or gloss. Boxes, cards, rounded panels around text. Repeating the same oyster-on-blob composition in every chapter.

## Hand-off to the video
The video copies `js/wc.js` (wash, contour, gloss, shadow, rays, wood, mat) and `js/things.js` (oyster, plate, ice, lemon, glass, knife, tag) into `oysters-explainer/lib/`, and the palette above.
