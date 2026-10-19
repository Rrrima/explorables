/* The "Talent vs Luck" model (Pluchino, Biondo & Rapisarda, 2018), as described
   in section 2 of the paper:
   - N agents with talent ~ Normal(mT, σT), truncated to [0, 1], fixed in place on
     a 201 × 201 torus; everyone starts with the same capital C(0).
   - NE event points, a share pL lucky (green) and the rest unlucky (red), each
     moving 2 patches in a random direction every step (six months).
   - An event "intersects" an agent when it lies within 1 patch of them. Lucky:
     capital doubles if rand < talent. Unlucky: capital halves.
   - 80 steps = 40 years.
   Where the paper's text leaves details open, this follows the authors' own
   NetLogo code (TvLmodel.nlogo, CoMSES Model Library, release 1.0.0): events
   start on distinct patch centres, each is lucky with probability pL, and an
   agent meets at most one event per step, picked at random among those within
   range ("ask one-of events in-radius 1"). Talent is truncated to [0, 1] as the
   paper describes (the code leaves it untruncated, which only matters at
   extreme settings).
   Works in the browser (window.TvL) and in Node (module.exports). */
(function (root) {
  "use strict";

  // small fast seeded RNG, so a run can be replayed from its seed
  function rng(seed) {
    let a = seed >>> 0 || 1;
    return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function gauss(r) { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  const DEFAULTS = { N: 1000, size: 201, NE: 500, pL: 0.5, mT: 0.6, sT: 0.1, C0: 10, steps: 80, radius: 1, move: 2, funding: null, seed: 1 };

  function create(opts = {}) {
    const p = Object.assign({}, DEFAULTS, opts);
    const r = rng(p.seed), S = p.size;
    // agents: one per patch at most, so the occupancy grid can answer "who is here?"
    const grid = new Int32Array(S * S).fill(-1);
    const agents = [];
    while (agents.length < p.N) {
      const x = Math.floor(r() * S), y = Math.floor(r() * S);
      if (grid[y * S + x] !== -1) continue;
      let T; do { T = p.mT + p.sT * gauss(r); } while (T < 0 || T > 1);
      grid[y * S + x] = agents.length;
      agents.push({ id: agents.length, x, y, T, C: p.C0, lucky: 0, unlucky: 0, used: 0, hist: [p.C0], log: [] });
    }
    // events: distinct patch centres, each lucky with probability pL
    const taken = new Set(), events = [];
    while (events.length < p.NE) {
      const x = Math.floor(r() * S), y = Math.floor(r() * S);
      if (taken.has(y * S + x)) continue;
      taken.add(y * S + x);
      events.push({ x, y, good: r() < p.pL });
    }
    return { p, r, grid, agents, events, t: 0, funded: 0 };
  }

  // agents within `radius` of an event (torus distance)
  function hits(w, e) {
    const { size: S, radius: R } = w.p, out = [];
    const cx = Math.round(e.x), cy = Math.round(e.y), k = Math.ceil(R) + 1;
    for (let dy = -k; dy <= k; dy++) for (let dx = -k; dx <= k; dx++) {
      const gx = ((cx + dx) % S + S) % S, gy = ((cy + dy) % S + S) % S, id = w.grid[gy * S + gx];
      if (id < 0) continue;
      let ddx = Math.abs(gx - e.x); ddx = Math.min(ddx, S - ddx);
      let ddy = Math.abs(gy - e.y); ddy = Math.min(ddy, S - ddy);
      if (ddx * ddx + ddy * ddy <= R * R) out.push(id);
    }
    return out;
  }

  // one six-month step: every event wanders, then each person meets at most one
  // of the events now within range, chosen at random (as in the authors' code)
  function step(w) {
    const { size: S, move } = w.p, r = w.r;
    w.t++;
    for (const e of w.events) {
      const a = r() * Math.PI * 2;
      e.x = ((e.x + Math.cos(a) * move) % S + S) % S;
      e.y = ((e.y + Math.sin(a) * move) % S + S) % S;
    }
    const near = new Map();
    for (const e of w.events) for (const id of hits(w, e)) { if (!near.has(id)) near.set(id, []); near.get(id).push(e); }
    for (const [id, evs] of near) {
      const ag = w.agents[id], e = evs.length > 1 ? evs[Math.floor(r() * evs.length)] : evs[0];
      if (e.good) { ag.lucky++; if (r() < ag.T) { ag.C *= 2; ag.used++; ag.log.push([w.t, 1]); } else ag.log.push([w.t, 0]); }
      else { ag.unlucky++; ag.C /= 2; ag.log.push([w.t, -1]); }
    }
    if (w.p.funding && w.t % 10 === 0) fund(w, w.p.funding);
    for (const ag of w.agents) ag.hist.push(ag.C);
  }

  // section 3.1: every 5 years a budget is shared out by one of four rules
  function fund(w, f) {
    const A = w.agents, n = A.length;
    const byC = () => A.slice().sort((a, b) => b.C - a.C);
    if (f.kind === "egalitarian") for (const a of A) { a.C += f.units; w.funded += f.units; }
    else if (f.kind === "elitarian") { for (const a of byC().slice(0, Math.round(n * f.share))) { a.C += f.units; w.funded += f.units; } }
    else if (f.kind === "mixed") {
      const top = byC(), k = Math.round(n * f.share), half = f.budget / 2;
      top.slice(0, k).forEach((a) => { a.C += half / k; }); top.slice(k).forEach((a) => { a.C += half / (n - k); }); w.funded += f.budget;
    } else if (f.kind === "random") {
      const idx = A.map((a) => a.id); for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(w.r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
      for (const id of idx.slice(0, Math.round(n * f.share))) { A[id].C += f.units; w.funded += f.units; }
    }
  }

  function run(opts) { const w = create(opts); while (w.t < w.p.steps) step(w); return w; }

  // the numbers the paper reports, for one finished world
  function stats(w) {
    const A = w.agents, p = w.p, n = A.length;
    const byC = A.slice().sort((a, b) => b.C - a.C), total = A.reduce((s, a) => s + a.C, 0);
    const top20 = byC.slice(0, Math.round(n * 0.2)).reduce((s, a) => s + a.C, 0) / total;
    const richest = byC[0], mostTalented = A.reduce((m, a) => (a.T > m.T ? a : m), A[0]);
    const cut = p.mT + p.sT, talented = A.filter((a) => a.T > cut);
    const PT = talented.filter((a) => a.C > p.C0).length / Math.max(1, talented.length);
    const lt = A.map((a) => Math.log(Math.max(a.C, 1e-9)));
    const corr = (xs, ys) => { const mx = xs.reduce((s, v) => s + v, 0) / xs.length, my = ys.reduce((s, v) => s + v, 0) / ys.length; let a = 0, b = 0, c = 0; xs.forEach((x, i) => { a += (x - mx) * (ys[i] - my); b += (x - mx) ** 2; c += (ys[i] - my) ** 2; }); return a / Math.sqrt(b * c); };
    return {
      top20, richest, mostTalented, PT, talentedCount: talented.length,
      above: A.filter((a) => a.C > p.C0).length / n, below: A.filter((a) => a.C < p.C0).length / n,
      neutral: A.filter((a) => a.lucky + a.unlucky === 0).length / n,
      corrTalent: corr(A.map((a) => a.T), lt), corrLuck: corr(A.map((a) => a.lucky - a.unlucky), lt),
      rank: (a) => byC.indexOf(a) + 1, talentPct: (T) => A.filter((a) => a.T < T).length / n,
    };
  }

  const api = { DEFAULTS, rng, create, step, run, stats, fund };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.TvL = api;
})(typeof self !== "undefined" ? self : this);
