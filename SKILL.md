---
name: explorable
description: Turn a question or topic plus a style reference image into a researched, illustrated scrollytelling essay (with a linked research report) and a matching ~85-second interactive explainer video that viewers can pause and question. Use when someone asks for an explorable, a scrolly or scrollytelling essay, an explorable explanation, an illustrated explainer, or a TED-Ed style explainer video in a given visual style.
license: MIT
compatibility: Claude Code (and other Agent Skills hosts with web search, file and shell tools). Needs Node.js 20+, Chrome or Chromium for checks, ffmpeg for contact sheets and audio. The video's voice, music and ask agent use ElevenLabs, Stability and Anthropic API keys; without them you still get the essay and the video's script.
metadata:
  opencode/slash: "true"
---

# Explorable

Make two things from a **prompt** (a topic or a question) and a **style reference image**:

1. `./<slug>-scrolly/`: an illustrated scrollytelling essay. Static HTML, CSS and JS with canvas drawings in the reference's style, scroll-driven scenes, data drawn as things, and a linked research report where every number has a source.
2. `./<slug>-explainer/`: a ~85-second TED-Ed style video drawn live on canvas in the same style, with voice, music and effects. Viewers can pause it anywhere and ask a question; an agent researches the answer and makes a short clip.

The bar is the three examples in `examples/` (open them with `node scripts/gallery.mjs`):
- **sit-stay-think:** needle-felted fur drawn with WebGL
- **promoted:** crayon, with a runnable simulation of a published model
- **half-shell:** sunlit watercolour, real coastlines, a full research report

Read their code; don't imitate a description of them.

## The one idea that matters

**The drawings carry the explanation, in the reference's own hand, and every number comes from a source.** Research first, then the story, then the style, then the essay chapter by chapter, then the video. Look at every step in screenshots before moving on.

## Workflow

| # | Phase | Read | Output |
|---|---|---|---|
| 1 | Look | `references/style.md` §1 | `Read` the reference image twice. Write `STYLE.md`: medium, light, value and saturation, edges, fills, texture, density, drawing vocabulary, type, motion, do-nots. |
| 2 | Research | `references/research.md` | A checklist from the prompt (every ask must land in the essay). Parallel research tracks (subagents), 15–30 sources each. `report.html`, `js/sources.js`, `js/data.js`. |
| 3 | Story | `references/essay.md` §1 | `OUTLINE.md`: one spine and 6–8 chapters, each a *different kind* of visual, checked against the checklist. |
| 4 | Style | `references/style.md` §2–4 | A drawing engine (start from `kit/engines/`), a **master study** that re-creates a crop of the reference (≤ 3 rounds), then a test sheet of topic objects (1 round). |
| 5 | Essay | `references/essay.md` §2–4, `references/house-style.md` | The hero, then each chapter: build, screenshot, fix once, next. |
| 6 | Essay check | `references/verify.md`, `references/performance.md` | Desktop (1440/1728) and phone (390) passes, `stall.mjs` under budget, a thumbnail. |
| 7 | Script | `references/video.md` §1 | `SCRIPT.md` (talking points and a two-column table) and `segments.json`: 75–95 s, ≤ 2.5 words/s. |
| 8 | Audio | `references/video.md` §2 | `node kit/new.mjs ./<slug>-explainer "<Title>" <port>`, `explainer.json`, then `node kit/pipeline/build.mjs ./<slug>-explainer` (voice, music, effects, mix). |
| 9 | Video | `references/video.md` §3–5 | Copy the essay's engine into `lib/`; `style.js` implements the kit's style contract with it; scenes in batches of 3–4: build, beats sheet, fix once. |
| 10 | Video check | `references/video.md` §6 | A full beats sheet and one motion strip. Both pages load with no errors. A README in each folder. |

Report progress to the user in one line per phase. Don't start drawing before the research and outline exist, and don't start the video before the essay passes its checks.

## Setup

- Node 20+ only for the essay and the checks. The video's ask agent needs one install: `cd kit/server && npm install` (the Anthropic SDK).
- Keys come from environment variables or a `.env` file in the working directory:
  - `ANTHROPIC_API_KEY`: the in-video ask agent
  - `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID`: the voice and effects
  - `STABILITY_API_KEY`: the music

  Never print keys or write them into the output. If the audio keys are missing, finish the essay and the video's script and scenes, and tell the user which keys the voice and music need.
- Preview: `node scripts/serve.mjs ./<slug>-scrolly <port>` and `node scripts/preview.mjs ./<slug>-explainer <port>`. Run both in the background.
- Checks: `scripts/shoot.mjs`, `frames.mjs`, `sheet.mjs`, `compare.mjs`, `stall.mjs` (see `references/verify.md`).

## Craft rules (short form)

- **Grounded.** Every number in the essay or video is in `data.js` or the report, with a source tag in the essay. Conflicts and uncertainty are shown, not smoothed over.
- **The reference's hand, not its surface.** Light, gloss, saturation, density and edge quality matter more than its colours. Win the master study before drawing the topic.
- **Visuals explain.** Cover the text: the picture should still carry the idea. Data is drawn as things (true-scale objects, piles, felt dots), never stock charts.
- **Vary the pictures.** Use a different kind of visual for each chapter and scene. Maps use real coastlines from real coordinates.
- **Layout.** A centred container with equal margins. Each stage visual fills 60–80% of its stage and is never cut off. Each scroll step visibly changes the picture. Phones get the drawing pinned in the top half and the text scrolling below. Labels inside drawings are at least 11 px and wrap within their column.
- **One look.** The video reuses the essay's engine and palette.
- **Video pacing.** ≤ 2.5 words/s with voice speed 0.92 and pauses between scenes. Reveals take 0.8–1.5 s, there are at most 3 beats per scene, and the final state holds before the cut.
- **Fast pages.** No frame over ~100 ms after first paint. Tens of thousands of strokes go to WebGL (`kit/engines/glfur.js`).
- **House style.** Minimal: no borders, shadows, rounded cards or default-blue links. Ink-textured type on a quiet page.
- **Work fast.** Look once at each step and fix what's clearly wrong. Don't loop on polish.

## References

- `references/research.md`: tracks, sources, the report, `data.js`, reproducing a paper's model.
- `references/style.md`: from a reference image to an engine and a master study.
- `references/essay.md`: story, page architecture, layout and pacing rules, building chapter by chapter.
- `references/video.md`: script, audio pipeline, the style contract, scenes and pacing.
- `references/verify.md`: the screenshot scripts and the checklist.
- `references/performance.md`: the frame budget and the WebGL pattern.
- `references/house-style.md`: the default taste.
- `kit/README.md`: the explainer kit (player, ask agent, audio pipeline, style contract).
- `kit/engines/README.md`: the drawing engines and what each is for.
