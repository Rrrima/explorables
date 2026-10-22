# Built-in styles

Six looks the skill already knows how to draw. Each has a style sheet in the same format as the `STYLE.md` the Look phase would write from a reference image, an engine in `kit/engines/` or an example, and an exemplar picture the master study is checked against.

Every one of them is live at [https://explorables.fly.dev](https://explorables.fly.dev): each style links to the essay that was made in it, so the user can look before choosing.

Use one when the user names it, or when the user gives no reference image. In that case tell the user, in one short message, that the skill has built-in styles to pick from, and ask. The user must always be able to **see all six** and to **attach their own image**.

**Asking with a question tool** (Claude Code's `AskUserQuestion` holds at most four options, so never put the six styles in the options):

1. `pen` (Recommended): "Pen and watercolour on paper. Live: https://explorables.fly.dev/e/paper/"
2. "See all six styles": reply with the list below, every line with its live link and the gallery at https://explorables.fly.dev/, then ask again with the other five as options (four fit; name the fifth in the question text, and `Other` takes any name typed in).
3. "I'll attach my own reference image": say to attach the image (or give its path) and resend the prompt, then wait.

`Other` is added by the tool, so a user who already knows a style name can type it. Put the gallery link in the question text itself.

**Asking without a question tool:** send the list below as a message and wait for the answer.

> I can draw this in one of the built-in styles, or in the style of an image you attach. See them live at https://explorables.fly.dev/
> - `pen`: pen and watercolour on paper (Fibre by Fibre, https://explorables.fly.dev/e/paper/)
> - `watercolour`: sunlit watercolour flat-lay (The Half Shell, https://explorables.fly.dev/e/oysters-v2/)
> - `felt`: needle-felted fur (Sit, Stay, Think, https://explorables.fly.dev/e/determien-dogs/)
> - `crayon`: black and red crayon (Promoted, https://explorables.fly.dev/e/peter/)
> - `riso`: two-ink risograph (The Shelf, https://explorables.fly.dev/e/wine/)
> - `fashion-plate`: fine ink line with one spot colour (Unstitched, https://explorables.fly.dev/e/bags/)
>
> Which one? Or attach a reference image of your own. Default is `pen`.

A reference image always wins over a built-in style.

| id | Look | Live | Engine | Read | Exemplar |
|---|---|---|---|---|---|
| `pen` | pen and watercolour on paper: a thin inked line, pale washes, raking light on a paper surface. The house default. | [Fibre by Fibre](https://explorables.fly.dev/e/paper/) | `kit/engines/pen.js`, `paper.js`, `hands.js` | `references/house-style.md` | `references/exemplars/paper-essay.jpg` |
| `watercolour` | sunlit watercolour flat-lay: opaque washes, hard shade glazes, crisp white gloss, light shafts across a wood table | [The Half Shell](https://explorables.fly.dev/e/oysters-v2/) | `examples/half-shell/essay/js/wc.js`, `things.js` | `examples/half-shell/essay` | `examples/half-shell/thumb.jpg` |
| `felt` | needle-felted fur on cream: thousands of hairs, no outlines, tiny ink faces; fur on the GPU | [Sit, Stay, Think](https://explorables.fly.dev/e/determien-dogs/) | `kit/engines/fuzz.js`, `glfur.js` | `examples/sit-stay-think/essay` | `examples/sit-stay-think/thumb.jpg` |
| `crayon` | black and red wax crayon on white: grainy strokes laid twice, block-headed figures | [Promoted](https://explorables.fly.dev/e/peter/) | `kit/engines/crayon.js` | `examples/promoted/essay` | `examples/promoted/thumb.jpg` |
| `riso` | two-ink risograph print: flat orange and blue plates, speckle, off-register, a cream sheet | [The Shelf](https://explorables.fly.dev/e/wine/) | `kit/engines/riso.js` (needs `pen.js`, `paper.js`) | this sheet | `references/exemplars/wine-essay.jpg` |
| `fashion-plate` | fashion-plate ink: a fine single line, one oxblood spot colour, Didone type, lots of white | [Unstitched](https://explorables.fly.dev/e/bags/) | `kit/engines/pen.js`, `paper.js` | this sheet | `references/exemplars/bags-essay.jpg` |

## How a built-in style replaces the Look phase

1. Copy `kit/styles/<id>.md` to the essay directory as `STYLE.md`. Add a line at the top naming the topic, and add a **Drawing vocabulary** paragraph for the topic's own objects in the same hand (what an oyster, a bag, a sourdough jar looks like in this medium).
2. Copy the engine into `js/` unchanged. It already draws this look; adapt it only for the topic's objects.
3. The master study re-creates one panel of the exemplar picture, and gets **one** round, not three: the engine is proven, you are checking that you drive it right.
4. The topic test sheet and everything after are unchanged.

The exemplars for `pen`, `riso` and `fashion-plate` are contact sheets of nine screenshots. Study one panel (the hero or a stage with a drawing in it), not the whole sheet.
