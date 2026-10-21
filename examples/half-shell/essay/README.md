# The Half Shell

An illustrated scrollytelling essay on oysters: why people love them, why they are a dollar at happy hour, why place and season change their taste, what the most expensive ones cost, and how to tell a good one. Every number links to the research report.

- `index.html`: hero (a hoverable platter of twelve oysters from twelve waters), seven chapters and a coda
- `report.html` + `css/report.css`: the research report (C = culture & history, T = taste, biology & place, Q = price & quality), with open questions and 90 numbered sources
- `js/wc.js`: the watercolour engine: washes with pigment mottle, pooled wet edges, hard shade glazes, thin hand contours, white rim gloss, light shafts, warm veil, wood table, indigo cloth, sprite cache
- `js/things.js`: the drawing vocabulary (oysters by species, crushed ice, platter, dish, lemon, mignonette, glasses, knife, tag, sparkle)
- `js/scenes/*.js`: one scene per chapter (hero, history timeline, happy-hour coins, cell magnifier with salinity slider, real-coastline map, year wheel, true-scale price lineup, tap-test tray, coda)
- `js/article.js`: scroll engine (sticky stages, continuous step progress, HTML labels, hover tooltips, clicks, nav)
- `js/bg.js`: the fixed wood-table background; `js/data.js` (tagged data), `js/sources.js`, `js/geo.js` (Natural Earth outlines via johan/world.geo.json)
- `STYLE.md`, `OUTLINE.md`: the style spec read from the reference image, and the story plan
- `dev/study.html` (master study of the reference), `dev/style-test.html`

No build step: `python3 -m http.server 8802` in this folder. The explainer video is at http://localhost:8906/.

## Choices made without asking

- **Spine.** "An oyster is a jar of the water it grew in" (osmoconformers; taurine ≈ 80% of amino acids, T2). It ties taste, place, season and price together.
- **Look.** The reference is an anime-style watercolour breakfast flat-lay, so the whole essay is a sunlit table seen from above: indigo cloth, slate and porcelain, crisp white gloss. Type is Zen Maru Gothic + Barlow + IBM Plex Mono. The study took six rounds against the reference before any topical drawing.
- **Map.** Real coastlines only (Natural Earth, low resolution, fetched as GeoJSON). North America is the main panel because most fetched tasting sources are North American. Europe, Japan and Australia appear as insets. Galway, Hiroshima and Coffin Bay notes are flagged as snippet-only.
- **Prices.** USD equivalents use approximate October 2026 FX, as in the report. The Coffin Bay King price (A$100) is from 2008–2012 and says so. "$3–4 → $1" and the "~77¢" split come from one New York bar (2019) and Boston (2024); the ~23¢ left over is my arithmetic.
- **Season.** The plumpness curve on the year wheel is an illustration of the glycogen cycle the sources describe (T1, T5), not measured values.
- **Server.** During the build I used a no-cache static server (job folder `nocache_server.py`). The shelf serves the folder with a plain static server.

Version control: `git init` was blocked by the build sandbox (it cannot write `.git/`), so this folder is not yet a repository. Run `git init && git add -A && git commit -m "initial"` here to version it.
