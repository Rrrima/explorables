/* The Peter Principle model (Pluchino, Rapisarda & Garofalo, Physica A 389, 2010;
   arXiv:0907.0455), section 2:
   - A pyramid of 160 positions over six levels: 1, 5, 11, 21, 41, 81 (top to bottom),
     with responsibility weights 1.0, 0.9, 0.8, 0.6, 0.4, 0.2 (Fig. 1).
   - Agents have a competence in [1, 10] and an age. Starting values ~ Normal(7, 2)
     and Normal(25, 5).
   - Every step (a year): everyone ages by one; anyone with competence below 4, or
     older than 60, leaves. Then vacancies are filled from the top down by promoting
     one member of the level below (the best, the worst, or a random one), and the
     bottom level hires newcomers.
   - On promotion, competence either carries over with a random change in [-1, 1]
     ("common sense") or is drawn afresh ("Peter hypothesis").
   - Efficiency = Σ level competence × weight ÷ Σ 10 × positions × weight, in %.
   Works in the browser (window.Peter) and in Node. */
(function (root) {
  "use strict";
  const SIZES = [1, 5, 11, 21, 41, 81], WEIGHTS = [1.0, 0.9, 0.8, 0.6, 0.4, 0.2];
  const DEFAULTS = { mech: "peter", strategy: "best", p: 0.5, fire: 4, retire: 60, mC: 7, sC: 2, mA: 25, sA: 5, seed: 1 };
  const MAXE = SIZES.reduce((s, n, i) => s + 10 * n * WEIGHTS[i], 0);

  function rng(seed) {
    let a = seed >>> 0 || 1;
    return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const gauss = (r) => { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  function create(opts = {}) {
    const p = Object.assign({}, DEFAULTS, opts), r = rng(p.seed);
    const w = { p, r, t: 0, nextId: 0, levels: SIZES.map((n) => new Array(n).fill(null)), careers: [], fired: 0, retired: 0 };
    w.levels.forEach((lv, li) => lv.forEach((_, si) => { lv[si] = newcomer(w, li); }));
    return w;
  }
  // clipped to [1, 10] (as NetLogo clamps): this reproduces the paper's 69.68% starting efficiency
  function comp(w) { return Math.min(10, Math.max(1, w.p.mC + w.p.sC * gauss(w.r))); }
  function newcomer(w, li) {
    let age; do { age = Math.round(w.p.mA + w.p.sA * gauss(w.r)); } while (age < 18 || age > 60);
    return { id: w.nextId++, c: comp(w), age, level: li, path: [[li, null]], hired: w.t };
  }
  // who gets promoted out of a level
  function pick(w, lv) {
    const cands = lv.map((a, i) => [a, i]).filter(([a]) => a);
    if (!cands.length) return -1;
    let s = w.p.strategy;
    if (s === "alternate") s = w.r() < w.p.p ? "best" : "worst";
    if (s === "random") return cands[Math.floor(w.r() * cands.length)][1];
    const sorted = cands.sort((x, y) => (s === "best" ? y[0].c - x[0].c : x[0].c - y[0].c));
    return sorted[0][1];
  }

  // one year; returns what happened, for animation: leaves, promotions, hires
  function step(w) {
    const ev = { leave: [], promote: [], hire: [] }, p = w.p;
    w.t++;
    w.levels.forEach((lv, li) => lv.forEach((a, si) => {
      if (!a) return;
      a.age++;
      if (a.c < p.fire || a.age > p.retire) {
        const why = a.c < p.fire ? "fired" : "retired";
        ev.leave.push({ a, li, si, why }); lv[si] = null; w[why]++;
        // a finished career that began on the bottom floor: competence on each floor reached
        if (a.path[0][0] === SIZES.length - 1) w.careers.push(a.path.slice(1).map((q) => q[1]).concat([a.c]));
      }
    }));
    // fill vacancies from the top down; a promotion opens a hole one level lower
    for (let li = 0; li < w.levels.length - 1; li++) {
      const lv = w.levels[li], below = w.levels[li + 1];
      for (let si = 0; si < lv.length; si++) {
        if (lv[si]) continue;
        const k = pick(w, below);
        if (k < 0) continue;
        const a = below[k];
        below[k] = null;
        const old = a.c;
        a.c = p.mech === "common" ? Math.min(10, Math.max(1, a.c + (w.r() * 2 - 1))) : comp(w);
        a.level = li; a.path.push([li, old]);
        lv[si] = a;
        ev.promote.push({ a, from: [li + 1, k], to: [li, si], old, now: a.c });
      }
    }
    const bottom = w.levels[w.levels.length - 1];
    bottom.forEach((a, si) => { if (!a) { bottom[si] = newcomer(w, w.levels.length - 1); ev.hire.push({ a: bottom[si], si }); } });
    return ev;
  }

  function efficiency(w) {
    let s = 0;
    w.levels.forEach((lv, li) => lv.forEach((a) => { if (a) s += a.c * WEIGHTS[li]; }));
    return (s / MAXE) * 100;
  }
  function levelMeans(w) { return w.levels.map((lv) => { const xs = lv.filter(Boolean); return xs.reduce((s, a) => s + a.c, 0) / Math.max(1, xs.length); }); }

  function run(opts, steps = 1000, every = 1) {
    const w = create(opts), series = [efficiency(w)];
    for (let i = 0; i < steps; i++) { step(w); if ((i + 1) % every === 0) series.push(efficiency(w)); }
    return { w, series };
  }

  const api = { SIZES, WEIGHTS, DEFAULTS, MAXE, rng, create, step, efficiency, levelMeans, run };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.Peter = api;
})(typeof self !== "undefined" ? self : this);
