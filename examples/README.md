# Examples

Three explorables made with this skill. `node ../scripts/gallery.mjs` serves them all at http://localhost:8900/.

| id | Essay | Video | Style | Notes |
|---|---|---|---|---|
| `paper` | :8901 | :8902 | pen and watercolour | The video reuses the essay's engine (`video/lib/`). |
| `sit-stay-think` | :8903 | :8904 | felt fur, WebGL | `essay/js/glfur.js` draws the fur on the GPU; `?nogl` compares with Canvas 2D. Two follow-up answers are included. |
| `lucky` | :8905 | :8906 | lab notebook | `essay/js/sim.js` re-implements the Talent vs Luck model and runs under Node. |

The essays are static (`node ../scripts/serve.mjs essay <port>`), and the videos run on the kit server (`node ../scripts/preview.mjs video <port>`).
