# The explainer kit

Everything a "scrolly essay + TED-Ed style explainer" pair needs, except the creative part. A project brings a script, a look and its scenes; the kit brings the player, the ask-anything agent, the voice/music/mix pipeline, a cursor engine and the answer-clip templates.

The videos in `../examples/*/video` are built on it.

## Make a new one

```
node kit/new.mjs ./foo-explainer "Foo" 8810                 # scaffold from kit/template/
# 1. write segments.json (narration, one string per scene) and SCRIPT.md (two columns)
# 2. fill explainer.json: context for the agent, props your style can draw, music, sfx, cues
node kit/pipeline/build.mjs ./foo-explainer              # voice → schedule.json + captions.srt, music, sfx, mix
# 3. draw scenes.js; give style.js its look; theme index.html (CSS vars + cursor)
node kit/pipeline/build.mjs ./foo-explainer mix          # re-mix after changing cues
ANTHROPIC_API_KEY=… node kit/server/server.mjs ./foo-explainer   # http://localhost:8810/  (cd kit/server && npm install, once)
```

Keys: `ANTHROPIC_API_KEY` (ask agent), `STABILITY_API_KEY` (music), `ELEVENLABS_API_KEY` / `ELEVENLABS_VOICE_ID` (voice, effects), from the environment or a `.env` file in the working directory (`ELEVEN_ENV` points at another file).

## What's shared and what isn't

| | Shared (kit) | Per project |
|---|---|---|
| Player | `kit/player/player.js`, `kit/player/player.css`: sticky shrinking stage, scene timeline, captions, hover hotspots with lift + ring, cursor-driven misregistration (`window.__mis`), ask bar, folded agent log, answer card (summary, script table, sources, follow-ups, **↻ New take**, back buttons), nested answers with breadcrumbs, question dots co-highlighted with the list, follow-a-running-job after reload | CSS variables, `playhead` SVG, `ring()` for the hover circle, header markup |
| Video | `kit/player/stage.js`: `Stage({ style, schedule, scenes, endCard })` → seekable `renderAt(t)`; word timing (`x.word("kilo")`), easing, kinetic type (`x.kword`), hotspots (`x.hot`), transitions, camera drift | `scenes.js` — one function per narration segment |
| Look | the **style contract** (below); `Layers()` helper for multi-plate styles | `style.js` — the drawing primitives in your look |
| Answer clips | `kit/player/answer.js`: 11 domain-neutral templates (title, bignumber, compare, bars, timeline, count, proportion, beforeafter, list, versus, quote), cue-word timing, auto hotspots | `props` your style draws (named in explainer.json) |
| Agent | `kit/server/`: research with web search/fetch → two-column script as structured output → per-shot ElevenLabs voice → ffmpeg mix; nesting (questions inside answers), **regenerate** (new take from the same research, replaces the old one in the list), SSE progress, `/api/jobs` | `explainer.json` → `context`, `style`, `series` |
| Audio | `kit/pipeline/build.mjs`: voice with word timestamps, pauses, captions, Stable Audio music, ElevenLabs effects, ducked mix with word-anchored cues | `music.prompt`, `sfx`, `cues` |
| Cursor | `kit/player/cursor.js`: two-layer pointer, textures `speckle` · `crayon` · `ink` · `none`, glyphs arrow/text/link/play/pause/look/slide, tags, click drop | `window.EXPLAINER_CURSOR` colours, texture, tag font, glyph overrides |

## The style contract

A style is what `makeStyle(canvas)` returns. Build it on `ExplainerStage.Layers(canvas, [...layers])`, which gives `W, H, canvas, alpha(a), alphaNow(), setTransform, getTransform, save, restore, translate, scale, rotate` across all layers. Then add:

| Method | Meaning |
|---|---|
| `begin(t)` / `end(t)` | clear for a frame / composite layers (and paper) into `canvas`; read `window.__mis` here if your look has plates to misregister |
| `fill(role, pts, a)` | filled polygon (or `Path2D`) |
| `line(role, pts, w, { a })` | a stroke in your hand: pen, crayon, brush… |
| `circle(role, x, y, r, a)` | filled disc |
| `text(role, s, x, y, { size, font: "display"·"body"·"mono", align, a, weight })` | lettering |
| `measure(s, size, font)` | text width, for fitting |
| `mark(role, x, y, r, a)` *(optional)* | a dot in your idiom (ink blot, crayon dab, riso dot); defaults to `circle` |
| `prop(name, x, y, size, t)` *(optional)* | a drawn illustration, ~400 units tall at size 1; return `false` if unknown. `versusA` / `versusB` draw the two sides of a versus shot |

Roles every style must answer to: `ink` (main), `accent` (emphasis), `muted`. Add your own (`good`, `bad`, `hl`…) for your scenes.

## Files a project has

```
explainer.json   title, context for the agent, props, voice, music, sfx, cues, port
segments.json    narration, one string per scene
SCRIPT.md        the two-column script (sent to the agent as context)
style.js         makeXStyle(canvas) — the look
scenes.js        scenes + window.EXPLAINER = { title, segNames, poster, playhead, ring, load, hotspots? }  (hotspots: false turns off hover lift / click-to-ask)
index.html       theme variables, cursor config, script tags
schedule.json    generated: scene and word timings
captions.srt     generated
audio/           generated: voice, music, sfx-*.mp3, mix.m4a
answers/         generated by the agent: <id>/clip.json, answer.m4a, dossier.md; index.json
```

The player is served at `/kit/` by the kit server, so a project's `index.html` loads `/kit/stage.js`, `/kit/player.js` and so on (these map to `kit/player/`).

**Hover hotspots** (lift, ring, "click to ask") are off by default. A project turns them on with `hotspots: true` in `window.EXPLAINER`.
