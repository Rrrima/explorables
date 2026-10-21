# Thinking Inside the Box

An illustrated scrollytelling essay on the question *do large language models make people think worse?*, drawn in a thin grey pen and one blue watercolour after a reference of a figure sitting under a translucent cube.

- `index.html` — the essay: a hero, seven chapters (the history of the worry, the MIT brain study, practice vs exam, why effort matters, the mirror, sameness, the tutor that will not answer) and a coda.
- `report.html` — the research report: three tracks (C studies, H history and adoption, M mechanisms), 134 sources, open questions. Every number in the essay carries a tag that links into it.
- `js/wash.js` — the drawing engine: a `Wash.stage` with a colour layer (washes with granulation, dry blooms and pooled rims) composited under a pen layer (`pen.js`, `paper.js` from the kit); projected translucent solids; a small figure in several poses.
- `js/scenes.js` — one scene per stage; `js/article.js` — header, navigation, scroll controller, hover tooltips; `js/data.js` and `js/sources.js` — the datasets and the source lists.
- `STYLE.md`, `OUTLINE.md` — the style notes and the chapter plan; `reference.png` — the style image it was made from.

Serve it with any static server, e.g. `node ../scripts/serve.mjs . 8920` from the explorable skill. No build step. The header links to the explainer video at `http://localhost:8908/`.
