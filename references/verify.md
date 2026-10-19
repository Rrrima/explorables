# Verify: look at what you built

You can't judge a drawing you haven't seen. Every visual change ends with screenshots, and every deliverable ends with a full pass. The scripts need Node 20+, Chrome or Chromium, and ffmpeg for sheets. Each starts and stops its own headless Chrome.

```
node scripts/serve.mjs <dir> <port>                                   # serve an essay folder
node scripts/preview.mjs <video-dir> <port>                           # run a video (ask agent needs ANTHROPIC_API_KEY)
node scripts/shoot.mjs  http://localhost:PORT/ OUT [--steps 8 | --at 0,1200] [--mobile] [--width 1440]
node scripts/frames.mjs http://localhost:PORT/ OUT --beats            # 3 frames per scene: build-up and readability
node scripts/frames.mjs http://localhost:PORT/ OUT --strip 12 15 0.2  # motion check: is anything rushed?
node scripts/sheet.mjs  OUT/sheet.jpg OUT/f-*.jpg                     # contact sheet
node scripts/compare.mjs OUT/cmp.jpg reference.png OUT/d-03.png       # reference beside your shot
node scripts/stall.mjs  http://localhost:PORT/                        # does the page freeze while it loads?
```

`shoot.mjs` scrolls like a reader, in small steps so scroll-driven scenes update, and prints JSON with the shot paths, `horizontalOverflow` and any console, network or HTTP errors. Then `Read` the images. Contact sheets are cheaper than single shots; open single shots at full size for line quality.

## Checklist

**Function**
- The page loads with no 404s or exceptions (favicon 404s are fine).
- Every link works: essay ↔ report, essay → video, video → essay.

**Layout**
- Nothing overlaps: labels on drawings, label on label, text on text.
- Nothing is cut off, and no text is wider than its tag or box.
- No horizontal scroll at 390 px. Type stays readable on phones.
- The page is centred and symmetric at 1440, 1728 and 2560 px wide.

**Style match.** Use `compare.mjs` to put the reference beside a shot. Name concrete differences: line and edges, fills, light and highlights, saturation, texture scale, density. Compare with the examples too; they are the bar.

**Quick verdict.** Score yourself honestly on fidelity, drawing, composition, explains-without-text, variety and craft. Fix anything clearly below the examples in one pass, then move on. Don't loop on polish.

**Story**
- Each chapter or scene reads without its text.
- Data is drawn in the medium and tagged with sources.

**Performance.** Run `stall.mjs` on the essay: no frame over ~100 ms after first paint (see `performance.md`).

**House style.** No borders, shadows, rounded cards or default-blue links (see `house-style.md`).
