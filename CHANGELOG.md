# Changelog

## Unreleased

- Examples: Promoted (crayon, the Peter principle model) and The Half Shell (watercolour, maps, a full report) replace Fibre by Fibre and Lucky.
- Videos link to the essay's research report over the end card (`window.EXPLAINER.report`) instead of drawing a sources line.
- The kit runs questions on visitors' own API keys when deployed (`REQUIRE_USER_KEYS`, `PRIVATE_ANSWERS`), with silent answer clips when there is no voice key.
- Sit, Stay, Think builds its felt behind an animated loader, so the page never freezes while scrolling.

## 0.1.0 (2026-10-19)

First release.

- `/explorable`: from a prompt and a style image, makes a researched scrolly essay and an interactive explainer video.
- The explainer kit: canvas player, ask agent with nested answers and new takes, voice, music and mix pipeline, cursor engine, and answer clips that can draw specific props on each side of a versus shot.
- Drawing engines: pen, hands, felt fur with a WebGL2 hair renderer, riso, crayon.
- Checks: `shoot`, `frames` (beats and motion strips), `sheet`, `compare`, `stall` (load-freeze budget).
- Examples: Fibre by Fibre (pen and watercolour), Sit, Stay, Think (felt, WebGL), Lucky (a runnable simulation).
