# Explainer video

The kit is at `kit/`. Read its `README.md` first: it has the style contract and the file list. Exemplars:

- `examples/paper/video`: reuses the essay's pen/hands engine; the model for how a video inherits a style
- `./bag-explainer`, `examples/lucky/video`, `./peter-explainer`
- `./wine-explainer`: the original; it predates the kit

## 1. Script (before any drawing)

- `SCRIPT.md`:
  - talking points
  - then a **two-column table**: narration | visuals, one row per scene
- 9–11 scenes, **75–95 seconds** total. Narration of **about 2.5 words per second** at most, which means roughly 190–230 words in total. Fewer words, more picture. Every scene's narration is at least about 6 seconds long.
- One idea per scene, with a concrete image for each. Follow the essay's spine, but tighter.
- Every number comes from the essay's `data.js` or report, so the video is grounded too.
- `segments.json`: the narration, one string per scene. Write numbers out the way they should be spoken ("four hundred million tonnes").

## 2. Scaffold and audio

```
node kit/new.mjs ./<slug>-explainer "<Title>" <port>
# fill explainer.json:
#   context:   what the essay covers, for the ask agent
#   props:     names your style can draw
#   music:     prompt (Stable Audio)
#   sfx:       ElevenLabs effects, 5–8, short
#   cues:      [sfx, scene, anchor, vol]; anchor is seconds, "word", "word+0.3" or "word#2"
node kit/pipeline/build.mjs ./<slug>-explainer        # voice → schedule.json, captions, music, sfx, mix
node kit/pipeline/build.mjs ./<slug>-explainer mix    # after changing cues
```

- **Voice pacing** in `explainer.json`: `"voice": { "speed": 0.92 }` and `"pauses": [0.8, 0.8, …, 1.2]` (seconds of silence after each scene; one number per scene). Check `schedule.json`: total words ÷ total seconds ≤ 2.6.
- Keys: ElevenLabs keys come from `ELEVENLABS_API_KEY` / `ELEVENLABS_VOICE_ID` or a `.env` file; `STABILITY_API_KEY` is in the environment. Never print keys.
- A cue anchor must be a word that is really in that scene's narration. Check `schedule.json`.

## 3. The look: reuse the essay's engine

This is the rule the paper video broke.

- Copy the essay's engine files into `<slug>-explainer/lib/` (for example `engine.js`, `pen.js`, `hands.js`) and load them before `style.js` in `index.html`.
- `style.js` implements the kit's style contract **with those functions**:
  - `ExplainerStage.Layers(canvas, [...])` with the same layers the essay uses (paper uses `["col", "ink"]`: washes multiplied under the pen)
  - `fill` = the essay's wash, `line` = the essay's nib, `mark` = its dot or drop
  - `text` in the essay's fonts
  - `end()` composites onto the essay's page background
- Add the motif helpers the essay uses (`sheet`, `face`, `sparkle`, `hand`, `label`, `leader`…) as methods on the style object, so scenes speak the same visual language.
- Props (`prop(name, …)`): the illustrations the ask agent's answer clips can use, plus `versusA` / `versusB`.
- `index.html`:
  - `--xp-*` CSS vars from the essay's palette and fonts
  - the page background
  - `window.EXPLAINER_CURSOR` in the essay's colours and texture
  - a "Read the essay →" link, and a small `← Shelf` link to the gallery or home page that lists your explorables (optional) above the title 
- `scenes.js`: `ring()` (the hover circle) drawn with the same pen.

Canvas space is 1920×1080. Line widths of about 2–3 px read as a fine pen at player size.

## 4. Pacing (the oyster video "went too fast")

- **Beats**: at most 3 visual beats per scene, at least 1.2 s apart, each tied to a spoken word.
- **Reveals take time**: drawings draw on or grow over **0.8–1.5 s**, labels fade or slide in over **≥ 0.4 s**, and staggers are at least about 0.08 s per item (a dozen items take about 1 s, not 0.15 s). No `x.seg` window shorter than 0.4 s for anything the viewer must read.
- **Lead and hold**: a label appears about 0.2–0.4 s *before* its word and stays at least 1.5 s. A scene's final state holds at least 1.2 s before the cut.
- **Always a little alive**: slow ambient motion (drift, steam, water, a gentle camera push of 2–4%) so a held frame isn't dead. Never fast motion.
- **Frame coverage**: the focal drawing fills about 40–60% of the frame, centred on thirds; labels are ≥ 34 px (body) and ≥ 64 px (key numbers) at 1920×1080. No scene with half the frame empty.
- **Variety**: each scene a different picture. The main object can recur, but not as the same drawing in the same place.

## 5. Scenes

- One function per segment: `(x) => { const { S } = x; … }`. Time things to words: `x.word("fibres")`, `x.word("two", 1)` for the second occurrence. Use `x.seg`, `x.eOut`, `x.pop` and `x.lerp` for motion.
- Use `x.kword(role, text, x, y, t, { size, font, align })` for kinetic labels, and `x.hot(x, y, w, h, fact, question)` for a hover hotspot with a suggested question (every scene should have one).
- Composition: one focal drawing per scene, labels close to what they name, plenty of empty space (1920×1080 with ~160 px margins). Things draw themselves on (`{ k }` reveal), hands do the actions, small faces react.
- `endCard(x)`: the title, one line and "Sources in the … research report".
- `window.EXPLAINER` = { title, segNames, poster, playhead, ring, load }. Copy `load()` from an exemplar.

## 6. Check it

- `node kit/server/server.mjs ./<slug>-explainer --port <port>` (in the background).
- Frames: `node scripts/frames.mjs http://localhost:<port>/ <out> --beats` (three frames per scene), and `--strip <from> <to> 0.2` for one busy scene to check that motion isn't rushed. Then `node scripts/sheet.mjs` them and **look**:
  - overlaps (labels on drawings, two labels colliding)
  - text overflowing shapes
  - empty or late scenes
  - style mismatch with the essay (put an essay screenshot beside a frame)
- Also grab frames in the middle of each scene, not only at the ends.
- Build and check scenes in batches of 3–4, not all 11 at the end: one beats sheet per batch, one fix pass, move on.
- Then save a thumbnail: the best frame, 900 px wide, as `<slug>-explainer/thumb.jpg`.
