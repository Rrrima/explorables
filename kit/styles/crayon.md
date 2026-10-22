# Style: black and red wax crayon (built-in)

Built-in style `crayon` (live: Promoted, https://explorables.fly.dev/e/peter/). Engine: `kit/engines/crayon.js` (`Crayon.line`, `fill`, `shadow`, `figure`, `person`, `vacancy`, `box`, `marks`, `paint`). Exemplar for the master study: `examples/promoted/thumb.jpg` (four office workers on a staircase) and `examples/promoted/essay` running.

## Medium and process
A loose drawing in black wax crayon on white paper, with one red crayon for the thing that matters. Strokes are laid down twice, a hair apart, as a child or a cartoonist does when pressing hard. Fills are scribbled, with streaks and paper showing through.
**Engine:** `Crayon.line` strokes a path twice with a textured wax pattern (vertical streaks plus fine tooth, alpha-only, tinted per colour). `Crayon.fill` scribbles a closed shape with the same pattern. Figures are cached sprites (`Crayon.sprite`).

## Light
None. No shading, no cast shadows except a soft grey smudge under a figure (`Crayon.shadow`) when it needs to sit on a floor. Form comes from the outline and the scribble density.

## Value and saturation
Paper white, near-black wax, and one saturated red. Nothing in between except the grey that scribble density makes.

| role | hex |
|---|---|
| paper | `#fcfbf8` |
| wax ink | `#181614` |
| red crayon | `#d64026` |
| muted text | `#6a6560` |

## Edges and line
Every edge is a crayon line, 2–4 px at 1440 wide, doubled with a small offset, round-capped, with a slow sine wobble. No clean geometry: a box is four hand-drawn lines that don't quite meet.

## Fills
Scribbled wax, denser for darker. In Promoted, trousers get darker the more competent the worker: fill density is a data channel. Paper always shows through a fill.

## Texture
Vertical wax streaks at the scale of a stroke, fine tooth under them. The paper itself is flat white with no visible grain.

## Density and composition
Sparse. Small figures on a lot of white, with floors, stairs and boxes drawn as single lines. Groups are rows and stacks. The red item is alone on the page.

## Drawing vocabulary
Block-headed people: a square head, dot eyes, a stick neck, a rectangular torso, scribbled trousers, posed standing, arms up, sitting or falling. Furniture and buildings are boxes. Emotion is a few marks beside the head (`Crayon.marks`: surprise lines, hearts). Data is drawn as people and boxes: a floor of workers, a stack of years, a tally.

## Type
Display: **Caveat Brush** 700 (a brush-lettered hand that matches the crayon). Body: **Literata** 400/600 (a quiet book serif so the page reads). Labels and data: **IBM Plex Mono** 400/600.

## Motion
Lines draw on in 0.5–0.9 s, as if being scribbled. Figures hop between positions (a small arc, no easing-out bounce). Fills scribble in from one side. Nothing fades: crayon appears or it doesn't.

## Do-nots
Anti-aliased clean vector lines. Any colour beyond black, red and the grey that density makes. Gradients. Shading on figures. Big faces: heads stay small and square.

## Hand-off to the video
The video copies `crayon.js` into `lib/` and uses the same figures and red.
