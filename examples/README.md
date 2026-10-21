# Examples

Three explorables made with this skill. `node ../scripts/gallery.mjs` serves them all at http://localhost:8900/.

| id | Essay | Video | Style | Notes |
|---|---|---|---|---|
| `sit-stay-think` | :8903 | :8904 | felt fur, WebGL | `essay/js/glfur.js` draws the fur on the GPU; `?nogl` compares with Canvas 2D. A loader builds every sprite before the page shows. One follow-up answer is included. |
| `promoted` | :8901 | :8902 | crayon | `essay/js/sim.js` re-implements the Peter principle model, and the essay lets you run it. Two follow-up answers are included. |
| `half-shell` | :8905 | :8906 | sunlit watercolour | `essay/js/wc.js` is the engine and `things.js` the drawing vocabulary; the video copies both into `video/lib/`. `report.html` is the reference research report. |

The essays are static (`node ../scripts/serve.mjs essay <port>`), and the videos run on the kit server (`node ../scripts/preview.mjs video <port>`).
