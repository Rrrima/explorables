# Style: felted fur on cream

Reference: six cats peeking into a cream frame, each one made of soft, fuzzy fibre.

## What I see, and how the canvas will do it

**Medium and process.** It looks like needle-felted wool, or a dry gouache brush laid down in thousands of short curly hairs. Each animal is a soft silhouette packed with fibre. Nothing is outlined. The faces are tiny ink marks stitched on top.
→ `js/fuzz.js` draws a **fur body**: a soft underfill in the coat colour, then thousands of short curved hair strokes (0.5–1.3 px). Their roots are sampled inside the silhouette and they follow a slow noise flow field. Some hairs break out past the edge as stray wisps. Faces are drawn last with crisp tiny marks.

**Light.** High-key and diffuse, with no direction, cast shadows or gloss. Each animal's form comes from fibre density alone: fur is a little lighter and sparser at the crown and denser and a shade darker toward the lower and outer edges. Where one animal overlaps another (the black cat over the white one) there is the faintest darkening.
→ Hairs lighten in a radial gradient from an upper-centre "crown" point and darken toward the rim. A very faint soft occlusion sits under overlapping animals (alpha ≤ 0.08). No drop shadows.

**Value and saturation.** The darkest dark is the brown-black cat (#3a2a22), the lightest light is the cream ground (#f4efe6), and the cream cats sit just one step below the ground. The strongest contrast is dark fur against cream. Saturation is low everywhere except the small pink accents (ears, cheeks, nose, the open mouth) and the yellow eyes on the dark cat.

| role | hex |
|---|---|
| ground (warm cream) | `#f4efe6` |
| cream fur | `#e8dfcf`, shade `#cfc3ad` |
| ginger patch / tabby | `#b8763f`, `#d29a55` |
| dark coat | `#3a2a22`, light `#5c463a` |
| grey coat | `#8d8782`, light `#aaa49e` |
| blush / inner ear | `#eba796` |
| nose / tongue | `#df8b78`, `#d0705c` |
| ink (eyes, whiskers, type) | `#231d1a` |
| yellow eye | `#d8b65e` |

**Edges and line.** Fur has no outlines: edges are fuzzy, with stray hairs 2–6% of the head's width sticking out. The only real lines are whiskers. They are very thin (≈0.6–0.9 px at this scale), long, slightly bowed, three or four per side, dark on light coats and cream on the dark coat.
→ `whisker()` draws a thin tapered stroke with a little wobble. Diagrams use the same hairline in ink.

**Fills.** Fill is made only of fibre, never flat paint, and the ground doesn't show through the body. Patches (ginger caps, tabby stripes) are fibre in a second colour with soft, hairy borders, not shapes.
→ A patch is a mask function: a hair whose root falls inside the patch takes the patch colour, and colours mix at the border because hairs overlap.

**Texture.** Hair scale is about 2–4% of a head's width. Texture is strong inside the animals and absent on the ground, which is a smooth, warm cream with only the faintest grain.
→ The page background is flat cream with a very faint noise. All texture lives in the fur.

**Density and composition.** Vignettes on a lot of empty cream. Animals are cropped by the frame edges, peeking in from the sides and corners and tilting their heads into the space. The centre and right are open air.
→ Heroes and stages crop animals at edges and leave the middle open for text. Data scenes use a few big animals plus many small felt objects (pom-pom dots, yarn lines), never a crowded grid.

**Drawing vocabulary.** Cats are a round head with two triangular ears (pink inside), eyes as two small dots set wide and low, a tiny pink triangle nose, a small "w" mouth, and blush ovals. Expressions are deadpan, surprised (open mouth) or a sleepy squint. Dogs, which are new, are built in the same idiom: a round fuzzy head with floppy or pricked ears, a fuzzy muzzle bump, a dark rounded nose, the same dot eyes. Breeds differ by silhouette and coat (collie mask, poodle curls, afghan long drape, pug flat face).
→ `cat(g, o)` and `dog(g, o)` take coat, pattern, ear type, expression and tilt. They are cached as sprites because fur is expensive.

**Type.** "Fraunces" (soft optical axis, SOFT 100, semi-bold) for display: it is round and gentle, like the felt. "Nunito Sans" for body: warm, rounded and readable. "IBM Plex Mono" for labels, data and source tags (house default).

**Motion.** Felt doesn't snap. Animals ease in from the frame edges (peek), tilt their heads slowly, blink, and stray hairs barely breathe. Data marks are felt balls that roll and settle. Yarn lines unspool along their path. Durations are 0.8–1.4 s with gentle ease-in-out.

**Light system in the engine.** `crown` (lighter, sparser fibre at the top), `rim` (denser, darker fibre at the edge), `occlude()` (faint soft shade where one animal covers another). There is no gloss, except for one tiny catch-light in an eye when an animal is shown large.

## Do-nots
- No outlines around animals, and no flat vector fills.
- No saturated colours beyond the pink and the occasional ginger.
- No drop shadows, gradients on the page, cards or borders.
- Don't fill the frame: keep the cream air.
- Don't make faces big or anime-like. Features stay tiny and set far apart.
- Texture doesn't go on the ground.

## Hand-off to the video
The video copies `js/fuzz.js` (noise, `fur`, `cat`, `dog`, `whisker`, `yarn`, `pom`, `sprite`) and this palette into `lib/`.
