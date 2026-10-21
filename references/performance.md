# Performance

An essay that freezes on load reads as broken, however good it looks. The budget: **no frame over about 100 ms after the first paint**, on a retina laptop (1728×1117 @2x). Check it with `node scripts/stall.mjs <url>` (frame gaps over the first 10 s), not only with screenshots.

## Cache, then build over several frames

- Draw anything expensive once into an offscreen canvas (a sprite) and reuse it. Key the cache by everything that changes the drawing (size, seed, colours).
- Build sprites a few per frame (one heavy one per frame), never all at once on load.
- Redraw a stage only when its scroll progress or hover state changes.
- **If sprites still take seconds in total, build them behind a loader.** Show a quiet loading screen in the page's palette with something that visibly moves (a small drawing of the medium at work, animated with CSS `transform`/`opacity` only, so it keeps moving while sprite building blocks the main thread) and a thin progress bar, draw every chapter once at each step (and half-step) offscreen, yielding between draws so the bar moves, then reveal the page with everything cached. Cap it (about 12 s) and let the rest build lazily on slow machines. Check it by scrolling the whole page after the reveal: no frame over 100 ms. See `warm()` in `examples/sit-stay-think/essay/js/article.js`.

## Many strokes: use WebGL

Canvas 2D is fine for hundreds of strokes and hopeless for hundreds of thousands. Chrome records the path calls and rasterises them on the GPU later, so the JavaScript profile looks cheap while the page freezes for seconds. Fur, hatching, grain made of strokes, particle fields and long pen textures all fall in this trap.

`kit/engines/glfur.js` is the pattern. It took the felt hero of `examples/sit-stay-think` from a 7–9 s freeze to about 1.5 s with no visible change:

- Every stroke is a small **instanced ribbon** that bends along the same quadratic curve, so the GPU draws thousands in one call.
- Strokes are grouped into **buckets** (one colour, alpha and width each). A **stencil** pass draws each bucket as a union, the way one Canvas 2D `stroke()` does: overlapping strokes in a bucket don't stack alpha, so the look matches the 2D original.
- Each part renders only its **bounding box**, and all of a sprite's parts render in **one GPU batch**, so the browser waits for the GPU once per sprite, not once per part. The result is copied back into the 2D sprite in paint order, so 2D layers in between (fills, faces, blush) keep their order.
- **Fallback:** without WebGL2 (or with `?nogl` in the URL, for comparing), the original Canvas 2D path runs.

Profile before you optimise. Use frame gaps (`stall.mjs`) for what the reader sees and a CPU profile for where JavaScript spends its time. Reading a canvas back every frame (`getImageData`) switches Chrome to software rendering for that canvas, which distorts both measurements.
