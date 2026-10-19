# Drawing engines

Each engine is a small canvas library from one of the examples. Copy the closest one into a new essay's `js/` and adapt it to the new reference (see `../../references/style.md`). The video then copies the essay's engine into its `lib/`.

| File | Medium | From | Notes |
|---|---|---|---|
| `pen.js` | textured pen line: pressure, wobble, ragged edges, dry skips, bleed, grain | paper | `Pen.ink(ctx, points, { w, k, seed, jit, boil })`. Needs `paper.js` for its noise. |
| `paper.js` | noise, fBm, paper height fields, raking-light shading, ink diffusion, scroll helpers | paper | `window.Paper` |
| `hands.js` | contour hands (grip, pinch, flat) drawn with `pen.js` | paper | `Hands.grip(ctx, x, y, { rot, s, flip })` |
| `fuzz.js` | needle-felted animals and felt marks: dogs (30+ breeds), cats, felt balls, yarn | sit-stay-think | `Fuzz.dog({ breed, R, sit })`, `Fuzz.cat({ coat })`, `Fuzz.put(ctx, sprite, x, y)` |
| `glfur.js` | WebGL2 hair renderer for `fuzz.js`: instanced ribbons, a stencil union per colour bucket, one GPU batch per sprite | sit-stay-think | Load before `fuzz.js`. Add `?nogl` to a page's URL to compare with Canvas 2D. See `../../references/performance.md`. |
| `riso.js` | two-ink risograph print: spot-colour plates, speckle, off-register | an earlier wine essay | |
| `crayon.js` | wax crayon strokes and cached figures | an earlier Peter Principle essay | |
