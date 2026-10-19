# Research report

The essays are trusted because every number links to a source. Research comes first and decides the story.

## 1. Frame the questions

From the user's prompt:

- Write the explicit asks as a **checklist**. Every listed item must end up in the essay. Missing items is a known failure: wine shipped without barrels, regional taste and price.
- Add the questions a curious reader would ask next.
- Split everything into **2–4 tracks** with one-letter source prefixes, for example:
  - H = history & culture, M = material & science, R = rendering (paper)
  - W = origins/world/price, S = making/science/nutrition (wine)
  - E = economics, C = culture (bags)

  Culture or history is always one of the tracks.
- If the topic is a **model or simulation** from a paper, the paper is the core source:
  - Get the paper (arXiv or the publisher) and the authors' code if published (GitHub, CoMSES, NetLogo).
  - Write down every rule and parameter.
  - Note where the text is ambiguous and how the code resolves it.

## 2. Search wide, then read deep

- Run tracks in parallel. Use the `Agent` tool with one subagent per track. Give each its questions and source prefix, and ask for a findings list back (claim, value, unit, date, range, source URL, quality).
- Prefer primary and authoritative sources:
  - papers, standards and statistics agencies
  - museum and conservation institutions
  - industry bodies
  - court records
  - makers' own technical pages

  Use Wikipedia to find leads, then cite what it cites where you can. Each track needs 15–30 sources.
- For every key number, record the value, unit, year and range (low–high). If sources disagree, record both and say which you use and why. Mark derived or estimated values.
- Fetch and read pages. Don't cite from search snippets.

## 3. Write the deliverables

Put these in the essay directory.

- `report.html`, in the essay's style (same fonts, page and ink texture):
  - "About this report": scope, date, method.
  - One chapter per track. Short sections with an id each (`#h1`, `#m2`…) holding the findings in prose, with source tags.
  - "Open questions": unverified values, disputes, what you couldn't find.
  - "Sources": numbered per track, `[prefix+n] Title, publisher (year), URL`.
  - Use `examples/paper/essay/report.html` as the reference structure.
- `js/sources.js`: the source lists as data, so tags can be rendered and linked.
- `js/data.js`: every dataset the visuals use, with a comment naming the report section and a `src` on each entry (`src: "M2, M3"`); `flag: true` marks uncertain values. Use `examples/paper/essay/js/data.js` as the pattern.
- In the essay, each figure carries `<a class="note" href="report.html#m2">M2</a>`.

## 4. For a simulation

- Implement the model in a plain JS module (`js/sim.js`) that also runs under Node.
- Before any visual work, reproduce the paper's headline results in Node (several seeds, averaged).
- Put the numbers you get beside the paper's in the README, and explain any differences (binning, clipping, unstated parameters).

## Quality bar

- The essay never states a number that isn't in `data.js` or the report.
- Conflicts and uncertainty are visible, not smoothed over.
- The report reads well on its own: someone could learn the topic from it.
