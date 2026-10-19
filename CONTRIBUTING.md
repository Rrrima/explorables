# Contributing

Thanks for helping. A few notes:

- **Changes to the workflow** (`SKILL.md`, `references/`): run at least two prompts from `evals/evals.json` before and after, and attach screenshots (`scripts/shoot.mjs`, `scripts/frames.mjs --beats`) to the pull request. Describe what got better and what got worse.
- **New engines** (`kit/engines/`): one file, no dependencies, a short header comment saying what medium it draws and how to call it, and a row in `kit/engines/README.md`. If it draws many strokes, run `scripts/stall.mjs` on a page that uses it.
- **New examples** (`examples/<id>/essay` and `video`): keep only the final audio mix (`audio/mix.m4a`), not the stems. Add the example to `examples/examples.json` with ports in the 8900s, and add a thumbnail (`thumb.jpg`, 900 px wide).
- **Keys:** never commit a `.env` or a key. The kit reads keys from the environment or a local `.env`, which is gitignored.
- **Style:** plain, minimal, no frameworks. Match the code around you.
