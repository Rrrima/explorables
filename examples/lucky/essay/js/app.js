/* Lucky: the page. A live world you run, charts that update as it runs, a reading
   of your finished run next to the paper's numbers, and three batch experiments.
   People and events are inked: each is a pre-rendered blot with a pooled rim and
   a few paper specks, drawn from a sprite cache so a thousand of them stay fast. */
(function () {
  "use strict";
  const T = window.TvL;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const C = { ink: "#1d1b18", ink2: "#4a453e", green: "#12a15a", red: "#e0402f", muted: "#827a6e", hl: "#ffe25e", paper: "#f5f1e6", blue: "#2f5fb3", line: "rgba(29,27,24,0.25)", faint: "rgba(29,27,24,0.14)" };
  const MONO = '"JetBrains Mono", ui-monospace, monospace', DISPLAY = '"Fraunces", Georgia, serif';
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const pct = (x, d = 0) => `${(x * 100).toFixed(d)}%`;
  const fmtC = (c) => (c >= 1e9 ? c.toExponential(1).replace("e+", "×10^") : c >= 100 ? Math.round(c).toLocaleString("en-US") : c >= 10 ? c.toFixed(0) : c >= 1 ? c.toFixed(1) : c >= 0.01 ? c.toFixed(2) : c.toExponential(1));
  const ord = (n) => { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
  const isPaper = (p) => p.pL === 0.5 && p.NE === 500 && p.mT === 0.6 && p.sT === 0.1 && p.steps === 80;

  function fit(canvas) {
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.max(2, Math.round(r.width * DPR)); canvas.height = Math.max(2, Math.round(r.height * DPR));
    const ctx = canvas.getContext("2d"); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    return { ctx, w: r.width, h: r.height };
  }
  function charcoal() {}
  // where a scrolly step switches on: below the plate when the plate sits on top of the text, mid-screen otherwise
  const coarse = window.matchMedia("(hover: none)").matches;
  function triggerLine(plate) {
    const vh = window.innerHeight, pr = plate.getBoundingClientRect();
    const stacked = pr.width > window.innerWidth * 0.7 && pr.bottom < vh * 0.8;
    return stacked ? Math.max(pr.bottom, vh * 0.35) + (vh - Math.max(pr.bottom, vh * 0.35)) * 0.2 : vh * 0.55;
  }                                  // (kept as a hook; the notebook look prints clean)

  /* ---------- ink sprites ---------- */
  const INK = { person: ["#1d1b18", "#000000"], good: ["#16a35c", "#0b5e35"], bad: ["#e2442f", "#9a2416"] };
  const sprites = new Map();
  function rnd(seed) { let a = seed * 9301 + 49297; return () => ((a = (a * 9301 + 49297) % 233280) / 233280); }
  function sprite(kind, r, v) {
    const rb = Math.max(0.5, Math.round(r * 4) / 4), key = `${kind}|${rb}|${v}`;
    let s = sprites.get(key);
    if (s) return s;
    const pad = 2 + rb * 0.25, size = Math.ceil((rb + pad) * 2 * DPR), c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d"), m = size / 2, R = rb * DPR, R2 = rnd(v * 31 + Math.round(rb * 8) + kind.length * 7);
    const [fill, rim] = INK[kind];
    // an irregular blot: the pen never lands perfectly round
    const blob = (rr) => { g.beginPath(); const k = 22, ph = R2() * 6.28; for (let i = 0; i <= k; i++) { const t = (i / k) * Math.PI * 2, w = rr * (1 + 0.07 * Math.sin(t * 3 + ph) + 0.04 * Math.sin(t * 5 + ph * 2)); const x = m + Math.cos(t) * w, y = m + Math.sin(t) * w; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); };
    blob(R); g.fillStyle = fill; g.globalAlpha = kind === "person" ? 0.9 : 0.88; g.fill();
    // ink pools at the edge as it dries
    if (R > 2.2) { g.globalAlpha = kind === "person" ? 0.55 : 0.6; g.strokeStyle = rim; g.lineWidth = Math.max(0.8, R * 0.16); blob(R * 0.94); g.stroke(); }
    // a lighter wash where the nib lifted
    if (R > 3.5) { g.globalAlpha = 0.18; g.fillStyle = "#fff"; g.beginPath(); g.ellipse(m - R * 0.28, m - R * 0.3, R * 0.32, R * 0.22, -0.6, 0, 6.3); g.fill(); }
    // paper specks where the ink skipped
    g.globalAlpha = 1; g.globalCompositeOperation = "destination-out";
    const n = Math.round(R * R * 0.12);
    for (let i = 0; i < n; i++) { const a = R2() * 6.28, d = Math.sqrt(R2()) * R * 0.92; g.beginPath(); g.arc(m + Math.cos(a) * d, m + Math.sin(a) * d, Math.max(0.35, R2() * DPR * 0.6), 0, 6.3); g.fill(); }
    s = { c, size: size / DPR };
    sprites.set(key, s);
    return s;
  }
  // draw an inked dot centred at (x, y) with radius r (css px)
  function dot(ctx, kind, x, y, r, v = 0, a = 1) {
    if (r < 0.35) return;
    const s = sprite(kind, r, v & 3), k = r / (Math.max(0.5, Math.round(r * 4) / 4));
    ctx.globalAlpha = a; ctx.drawImage(s.c, x - (s.size * k) / 2, y - (s.size * k) / 2, s.size * k, s.size * k); ctx.globalAlpha = 1;
  }
  const ball = (ctx, x, y, r, good, a = 1) => dot(ctx, good ? "good" : "bad", x, y, r, Math.round(x * 7 + y * 3), a);
  function pencil(ctx, pts, w = 1.4, color = C.ink, a = 0.9) {
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.globalAlpha = a; ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke(); ctx.globalAlpha = 1;
  }
  function circleLine(ctx, x, y, r, w, color, a = 1) { ctx.strokeStyle = color; ctx.lineWidth = w; ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
  // charts were sized for a hand font; the mono runs a touch smaller
  function text(ctx, s, x, y, { size = 16, weight = 400, color = C.ink, align = "left", base = "alphabetic", font = MONO, halo = false } = {}) {
    const px = font === MONO ? Math.round(size * 0.76) : size;
    ctx.font = `${weight} ${px}px ${font}`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = base;
    if (halo) { ctx.strokeStyle = C.paper; ctx.lineWidth = 3.5; ctx.lineJoin = "round"; ctx.strokeText(s, x, y); }   // keeps a label legible over dense dots on small charts
    ctx.fillText(s, x, y);
  }
  const wealthR = (c) => clamp(1.4 + 0.55 * Math.log2(Math.max(c, 1e-6) / 10), 0.6, 9);

  /* ---------- drawing a world ---------- */
  function remember(w) { for (const e of w.events) { e.px = e.x; e.py = e.y; } }
  function drawWorld(ctx, w, x0, y0, size, o = {}) {
    const S = w.p.size, k = size / S, f = o.interp == null ? 1 : o.interp, sc = Math.max(1, k * 0.55);
    for (const a of w.agents) dot(ctx, "person", x0 + (a.x + 0.5) * k, y0 + (a.y + 0.5) * k, (o.uniform ? 1.5 : wealthR(a.C)) * sc, a.id, o.byTalent ? clamp((a.T - 0.25) / 0.7, 0.08, 1) : 1);
    if (o.events !== false) for (const e of w.events) {
      let ex = e.x, ey = e.y;
      if (e.px != null && Math.abs(e.x - e.px) < S / 2 && Math.abs(e.y - e.py) < S / 2) { ex = lerp(e.px, e.x, f); ey = lerp(e.py, e.y, f); }
      ball(ctx, x0 + ex * k, y0 + ey * k, Math.max(2.4, k * 1.3), e.good);
    }
    for (const [id, col] of o.rings || []) {
      const a = w.agents[id]; if (!a) continue;
      circleLine(ctx, x0 + (a.x + 0.5) * k, y0 + (a.y + 0.5) * k, wealthR(a.C) * sc + 5, 2, col);
    }
  }
  function frame(ctx, x, y, s) { ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.strokeRect(x + 0.75, y + 0.75, s - 1.5, s - 1.5); }

  /* =========================== HERO: a small live world in a circle =========================== */
  (function hero() {
    const cv = $("#c-hero");
    let g, w, last = 0, acc = 0;
    const make = () => { w = T.create({ N: 300, size: 81, NE: 150, seed: 1 + Math.floor(Math.random() * 1e6) }); remember(w); };
    function frameAt(t) {
      if (!g) return;
      const dt = Math.min(0.1, (t - last) / 1000); last = t;
      acc += dt * 2.2;
      while (acc >= 1) { acc -= 1; remember(w); T.step(w); if (w.t >= 80) make(); }
      const { ctx, w: W, h: H } = g;
      ctx.clearRect(0, 0, W, H);
      ctx.save(); ctx.beginPath(); ctx.arc(W / 2, H / 2, W / 2 - 2, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.fillRect(0, 0, W, H);
      drawWorld(ctx, w, 0, 0, W, { interp: acc });
      ctx.restore();
      circleLine(ctx, W / 2, H / 2, W / 2 - 2, 1.5, C.ink);
      text(ctx, `age ${20 + Math.floor(w.t / 2)}`, W / 2, H - 22, { size: 15, align: "center", color: C.ink2 });
      if (!reduce) requestAnimationFrame(frameAt);
    }
    make();
    const start = () => { g = fit(cv); last = performance.now(); requestAnimationFrame(frameAt); };
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(start);
    window.addEventListener("resize", () => { g = fit(cv); });
  })();

  /* =========================== 01 · THE WORLD: a particle story =========================== */
  // The same thousand dots act out each paragraph: they burst into the world, queue
  // up by talent, line up as equals, meet the balls, and live forty years.
  (function story() {
    const cv = $("#c-world-story"), cap = $("#cap-world"), steps = $$("[data-scrolly='world'] .step");
    const S = 201, home = T.create({ seed: 11 }), A = home.agents, N = A.length;
    const P = A.map((a, i) => ({ x: 100.5 + Math.cos(i) * 3, y: 100.5 + Math.sin(i * 1.3) * 3, r: 0.9, al: 0.9, tx: a.x + 0.5, ty: a.y + 0.5, tr: 0.9, tal: 0.9, d: ((i * 0.6180339) % 1) * 0.6 }));
    const E = home.events.map((e, i) => { const a = Math.atan2(e.y - 100.5, e.x - 100.5); return { x: 100.5 + Math.cos(a) * 170, y: 100.5 + Math.sin(a) * 170, hx: e.x, hy: e.y, good: e.good, d: ((i * 0.381966) % 1) * 0.8 }; });
    const cam = { x: 100.5, y: 100.5, z: 1 }, camT = { x: 100.5, y: 100.5, z: 1 };
    let g, idx = -1, since = 0, last = 0, vis = false, run = null, runPhase = 0, runT = 0, eAlpha = 0;
    const talentA = (a) => 0.14 + 0.86 * clamp((a.T - 0.32) / 0.56);
    // the person the close-ups follow, and their nearest neighbours
    const F = A.reduce((b, a) => (Math.abs(a.T - 0.62) + Math.hypot(a.x - 100, a.y - 100) / 300 < Math.abs(b.T - 0.62) + Math.hypot(b.x - 100, b.y - 100) / 300 ? a : b), A[0]);
    const NB = A.filter((a) => a !== F).map((a) => [a, Math.hypot(a.x - F.x, a.y - F.y)]).sort((p, q) => p[1] - q[1]).slice(0, 5).map((p) => p[0]);
    const actors = [F, ...NB];
    const CAPS = ["1,000 people, placed at random, never move", "talent: a bell curve around 0.6 (darker = more talented)", "everyone starts with the same 10 units", "250 lucky, 250 unlucky events, each rolling 2 patches every six months", "lucky: doubles, if a coin weighted by talent comes up", "unlucky: halves, whatever your talent", "forty years, then everyone sorted by what they ended with"];

    // where each dot wants to be for a given paragraph
    // a dot histogram: stack each bin in as many columns as it needs to stay under maxH
    function histTargets(vals, lo, hi, bins, colW, rowH, baseY, maxH = 120) {
      const counts = new Array(bins).fill(0), out = new Array(vals.length), binW = (S - 24) / bins;
      const bin = (v) => clamp(Math.floor(((v - lo) / (hi - lo)) * bins), 0, bins - 1);
      vals.forEach((v) => counts[bin(v)]++);
      const most = Math.max(...counts), sp = Math.min(rowH, Math.sqrt((binW * 0.9 * maxH) / most)), cols = Math.max(1, Math.floor((binW * 0.9) / sp));
      counts.fill(0);
      vals.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]).forEach(([v, i]) => {
        const b = bin(v), k = counts[b]++, c = k % cols;
        out[i] = [12 + (b + 0.5) * binW + (c - (cols - 1) / 2) * sp, baseY - Math.floor(k / cols) * sp];
      });
      out.sp = sp;
      return out;
    }
    function setStep(i) {
      idx = i; since = 0;
      camT.x = 100.5; camT.y = 100.5; camT.z = 1;
      P.forEach((p) => (p.d = ((Math.random() * 0.7))));
      if (i === 0) A.forEach((a, j) => Object.assign(P[j], { tx: a.x + 0.5, ty: a.y + 0.5, tr: 0.9, tal: 0.9 }));
      if (i === 1) { const t = histTargets(A.map((a) => a.T), 0.2, 1.0, 40, 1.9, 1.9, 168); A.forEach((a, j) => Object.assign(P[j], { tx: t[j][0], ty: t[j][1], tr: 0.85, tal: talentA(a) })); }
      if (i === 2) A.forEach((a, j) => { const c = j % 40, r = Math.floor(j / 40); Object.assign(P[j], { tx: 100.5 + (c - 19.5) * 4.4, ty: 100.5 + (r - 12) * 4.4, tr: 1.25, tal: 0.9 }); });
      if (i === 3) { A.forEach((a, j) => Object.assign(P[j], { tx: a.x + 0.5, ty: a.y + 0.5, tr: 0.9, tal: 0.9 })); E.forEach((e) => { const a = Math.atan2(e.hy - 100.5, e.hx - 100.5); e.x = 100.5 + Math.cos(a) * 170; e.y = 100.5 + Math.sin(a) * 170; e.wx = e.hx; e.wy = e.hy; }); }
      if (i === 4 || i === 5) { A.forEach((a, j) => Object.assign(P[j], { tx: a.x + 0.5, ty: a.y + 0.5, tr: 0.9, tal: talentA(a) })); camT.x = F.x + 0.5; camT.y = F.y + 0.5; camT.z = 6.5; }
      if (i === 6) { A.forEach((a, j) => Object.assign(P[j], { tx: a.x + 0.5, ty: a.y + 0.5, tr: 0.9, tal: 0.9 })); run = T.create({ seed: 11 }); remember(run); runPhase = 0; runT = 0; }
    }

    // close-ups: every 3.2 s each actor is visited by a ball; outcomes are seeded so they replay
    const LOOP = 3.2;
    function encounter(good, t) {
      const cyc = Math.floor(t / LOOP), ph = (t % LOOP) / LOOP, round = cyc % 4;
      return actors.map((a, j) => {
        let f = 1;
        for (let c = cyc - round; c < cyc; c++) { const roll = rnd(c * 17 + j * 101 + 5)(); f *= good ? (roll < a.T ? Math.SQRT2 : 1) : Math.SQRT1_2; }
        const roll = rnd(cyc * 17 + j * 101 + 5)(), hit = ph > 0.42, win = good ? roll < a.T : true;
        if (hit) f *= good ? (win ? Math.SQRT2 : 1) : Math.SQRT1_2;
        const ang = j * 1.9 + cyc * 0.7, dist = lerp(9, 0, ease(clamp(ph / 0.42)));
        return { a, j, f, roll, win, ph, hit, bx: a.x + 0.5 + Math.cos(ang) * dist, by: a.y + 0.5 + Math.sin(ang) * dist, bounce: hit && !win ? ease(clamp((ph - 0.42) / 0.3)) : 0, ang };
      });
    }

    function frameAt(t) {
      if (!g || !vis) return;
      const dt = Math.min(0.05, (t - last) / 1000); last = t; since += dt;
      const { ctx, w: W, h: H } = g;
      ctx.clearRect(0, 0, W, H);
      // camera glides
      const ck = 1 - Math.exp(-dt * 2.6);
      cam.x += (camT.x - cam.x) * ck; cam.y += (camT.y - cam.y) * ck; cam.z += (camT.z - cam.z) * ck;
      const size = Math.min(W, H) * 0.94, k = (size / S) * cam.z;
      const X = (x) => W / 2 + (x - cam.x) * k, Y = (y) => H / 2 + (y - cam.y) * k;
      // the world's edge, faded when the dots are elsewhere
      const showFrame = idx === 0 || idx === 3 || idx === 6 ? 1 : idx >= 4 ? 0.5 : 0.25;
      ctx.globalAlpha = showFrame; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.3; ctx.strokeRect(X(0), Y(0), S * k, S * k); ctx.globalAlpha = 1;

      // particles move toward their targets with a little stagger
      const pk = 1 - Math.exp(-dt * 3.2);
      P.forEach((p) => { if (since < p.d) return; p.x += (p.tx - p.x) * pk; p.y += (p.ty - p.y) * pk; p.r += (p.tr - p.r) * pk; p.al += (p.tal - p.al) * pk; });

      let enc = null;
      if (idx === 4 || idx === 5) enc = encounter(idx === 4, since);
      if (idx === 6) {
        // live forty years, then sort everyone by capital
        runT += dt;
        if (runPhase === 0) {
          while (runT > 0.11 && run.t < 80) { runT -= 0.11; remember(run); T.step(run); }
          run.agents.forEach((a, j) => { P[j].tr = clamp(0.9 + 0.32 * Math.log2(Math.max(a.C, 1e-6) / 10), 0.3, 4.2); });
          if (run.t >= 80) { runPhase = 1; runT = 0; const caps = run.agents.map((a) => Math.log2(Math.max(a.C, 1e-6))), t2 = histTargets(caps, Math.min(...caps) - 0.5, Math.max(...caps) + 0.5, 34, 2.3, 2.3, 176); run.agents.forEach((a, j) => Object.assign(P[j], { tx: t2[j][0], ty: t2[j][1], tr: 1.0, d: Math.random() * 0.6 })); since = 0; }
        } else if (runT > 7) setStep(6);
      }

      // people
      P.forEach((p, j) => {
        let r = p.r, al = p.al;
        if (idx === 2) r *= 1 + 0.12 * Math.sin(since * 3.2);                 // all breathe together: equal
        if (enc) { const e = enc.find((q) => q.a.id === A[j].id); if (e) r *= e.f; }
        dot(ctx, "person", X(p.x), Y(p.y), r * k * 0.95, j, al);
      });
      if (idx === 6 && runPhase === 1) {
        // colour each dot by where it ended: above, at or below the start
        run.agents.forEach((a, j) => { if (a.C !== 10 && since > 0.8) dot(ctx, a.C > 10 ? "good" : "bad", X(P[j].x), Y(P[j].y), P[j].r * k * 0.55, j, clamp((since - 0.8) * 2)); });
        const caps = run.agents.map((a) => Math.log2(Math.max(a.C, 1e-6))), lo = Math.min(...caps) - 0.5, hi = Math.max(...caps) + 0.5, xs = (c) => X(12 + ((Math.log2(c) - lo) / (hi - lo)) * (S - 24));
        pencil(ctx, [[X(10), Y(178.5)], [X(191), Y(178.5)]], 1.2);
        [[10, "10 · start"], [Math.pow(2, hi - 1), fmtC(Math.pow(2, Math.floor(hi - 1)))], [Math.pow(2, lo + 1), fmtC(Math.pow(2, Math.ceil(lo + 1)))]].forEach(([c, l]) => text(ctx, l, xs(c), Y(186), { size: 15, align: "center", color: C.muted }));
      }
      if (idx === 1) { pencil(ctx, [[X(12), Y(170.5)], [X(189), Y(170.5)]], 1.2); [0.2, 0.4, 0.6, 0.8, 1].forEach((v) => text(ctx, v.toFixed(1), X(12 + ((v - 0.2) / 0.8) * 177), Y(178), { size: 15, align: "center", color: C.muted })); }

      // balls
      if (idx === 3 || idx === 6) eAlpha = Math.min(1, eAlpha + dt * 2); else eAlpha = Math.max(0, eAlpha - dt * 3);
      if (eAlpha > 0 && idx !== 6) {
        // fly in from beyond the edge, then wander two patches every half second
        const step = Math.floor(since / 0.5), sub = (since % 0.5) / 0.5;
        E.forEach((e, i) => {
          if (since > 1.6 + e.d) { if (e.step !== step) { e.step = step; e.ox = e.wx; e.oy = e.wy; const a = rnd(i * 13 + step * 7)() * 6.28; e.wx = ((e.wx + Math.cos(a) * 2) % S + S) % S; e.wy = ((e.wy + Math.sin(a) * 2) % S + S) % S; } }
          const tx = e.ox != null && Math.abs(e.wx - e.ox) < 10 ? lerp(e.ox, e.wx, sub) : e.wx ?? e.hx, ty = e.oy != null && Math.abs(e.wy - e.oy) < 10 ? lerp(e.oy, e.wy, sub) : e.wy ?? e.hy;
          const fk = ease(clamp((since - e.d) / 1.2));
          const x = lerp(e.x, tx, fk), y = lerp(e.y, ty, fk);
          ball(ctx, X(x), Y(y), 1.25 * k, e.good, eAlpha);
        });
      }
      if (idx === 6 && runPhase === 0) run.events.forEach((e) => { let ex = e.x, ey = e.y; const f = clamp(runT / 0.11); if (e.px != null && Math.abs(e.x - e.px) < 100 && Math.abs(e.y - e.py) < 100) { ex = lerp(e.px, e.x, f); ey = lerp(e.py, e.y, f); } ball(ctx, X(ex), Y(ey), 1.25 * k, e.good, eAlpha); });

      // close-ups: balls arrive; green ones are only caught by the talented
      if (enc) {
        const zin = clamp((cam.z - 1) / 5.5);
        enc.forEach((e) => {
          const ax = X(e.a.x + 0.5), ay = Y(e.a.y + 0.5), r = 0.9 * e.f * k * 0.95;
          if (!e.hit || (idx === 4 && !e.win)) {
            const off = e.bounce * 7, bx = e.hit ? e.a.x + 0.5 + Math.cos(e.ang) * off : e.bx, by = e.hit ? e.a.y + 0.5 + Math.sin(e.ang) * off : e.by;
            ball(ctx, X(bx), Y(by), 0.55 * k, idx === 4, zin * (1 - e.bounce));
          }
          if (e.hit && (idx === 5 || e.win)) { const sp = clamp((e.ph - 0.42) / 0.35); circleLine(ctx, ax, ay, r + sp * 2.2 * k, Math.max(1, 3 * (1 - sp)), idx === 4 ? C.green : C.red, (1 - sp) * zin); }
        });
        // the coin, drawn as a talent gauge around the person we follow
        if (idx === 4 && zin > 0.6) {
          const e = enc[0], ax = X(F.x + 0.5), ay = Y(F.y + 0.5), R = 2.6 * k, a0 = -Math.PI / 2;
          circleLine(ctx, ax, ay, R, 2, C.faint);
          ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(ax, ay, R, a0, a0 + F.T * Math.PI * 2); ctx.stroke();
          const spin = e.ph < 0.42 ? e.ph * 40 : 0, na = a0 + (e.ph < 0.42 ? spin : e.roll * Math.PI * 2);
          pencil(ctx, [[ax + Math.cos(na) * R * 0.7, ay + Math.sin(na) * R * 0.7], [ax + Math.cos(na) * R * 1.25, ay + Math.sin(na) * R * 1.25]], 3, e.ph < 0.42 ? C.muted : e.win ? C.green : C.red, 1);
          text(ctx, `talent ${F.T.toFixed(2)}`, ax, ay + R + 0.9 * k, { size: 17, align: "center", color: C.ink2 });
        }
      }
      cap.textContent = CAPS[Math.max(0, idx)];
      if (!reduce) requestAnimationFrame(frameAt);
    }
    function onScroll() {
      const mid = triggerLine(cv.parentElement);
      let i = 0; steps.forEach((s, j) => { if (s.getBoundingClientRect().top <= mid) i = j; });
      if (i !== idx) setStep(i);
      steps.forEach((s, j) => s.classList.toggle("on", j === idx));
    }
    new IntersectionObserver((es) => { const v = es[0].isIntersecting; if (v && !vis) { vis = true; g = fit(cv); last = performance.now(); requestAnimationFrame(frameAt); } vis = v; }, { rootMargin: "100px" }).observe(cv);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", () => { if (vis) g = fit(cv); });
    onScroll();
  })();

  /* =========================== charts =========================== */
  // capital bins: half-doublings, so a run's spread fits however long it ran
  function binsOf(caps, perWorld = 1) {
    const lg = caps.map((c) => Math.log2(Math.max(c, 1e-300)));
    let mn = Infinity, mxv = -Infinity; for (const v of lg) { if (v < mn) mn = v; if (v > mxv) mxv = v; }
    // never narrower than 1/64 to 640 units, so a fresh world is one thin bar at the start, not a wall
    const lo = Math.floor(Math.min(mn, Math.log2(10) - 6) * 2) / 2, hi = Math.ceil(Math.max(mxv, Math.log2(10) + 6) * 2) / 2 + 0.5;
    const n = Math.max(1, Math.round((hi - lo) * 2)), counts = new Array(n).fill(0);
    lg.forEach((v) => counts[clamp(Math.floor((v - lo) * 2), 0, n - 1)]++);
    return { lo, hi, n, counts: counts.map((c) => c / perWorld) };
  }
  // tail slope two ways: doubling bins (people per unit of capital), and the authors' 80 equal bins
  function slopes(caps) {
    const fitLine = (pts) => { if (pts.length < 3) return NaN; const ax = pts.reduce((a, p) => a + p[0], 0) / pts.length, ay = pts.reduce((a, p) => a + p[1], 0) / pts.length; return pts.reduce((a, p) => a + (p[0] - ax) * (p[1] - ay), 0) / pts.reduce((a, p) => a + (p[0] - ax) ** 2, 0); };
    let mn = Infinity, mx = -Infinity; for (const c of caps) { if (c < mn) mn = c; if (c > mx) mx = c; }
    const lgs = caps.filter((c) => c > 10).map((c) => Math.log2(c / 10)), dc = new Map();
    for (const v of lgs) { const k = Math.floor(v + 1e-9); dc.set(k, (dc.get(k) || 0) + 1); }
    const dbl = [...dc.entries()].filter(([k]) => k >= 1).sort((a, b) => a[0] - b[0]).map(([k, n]) => { const lo = 10 * 2 ** k; return [Math.log10(lo * Math.SQRT2), Math.log10(n / lo)]; });
    const st = (mx - mn) / 80, eqc = new Array(80).fill(0);
    if (st > 0) for (const c of caps) eqc[clamp(Math.floor((c - mn) / st), 0, 79)]++;
    const eq = []; eqc.forEach((n, i) => { const x = mn + (i + 0.5) * st; if (n && x > 0) eq.push([Math.log10(x), Math.log10(n)]); });
    return { doubling: fitLine(dbl), authors: fitLine(eq), dblPts: dbl };
  }
  const charts = {
    hist(w) {
      const { ctx, w: W, h: H } = fit($("#c-hist"));
      const caps = w.agents.map((a) => a.C), B = binsOf(caps), max = Math.max(...B.counts, 1);
      const pad = { l: 30, r: 10, t: 14, b: 36 }, cw = (W - pad.l - pad.r) / B.n;
      ctx.clearRect(0, 0, W, H);
      B.counts.forEach((c, i) => {
        const v = Math.pow(2, B.lo + i / 2 + 0.25), h = (Math.sqrt(c) / Math.sqrt(max)) * (H - pad.t - pad.b);
        ctx.fillStyle = v > 11 ? C.green : v < 9 ? C.red : C.ink; ctx.fillRect(pad.l + i * cw + 0.5, H - pad.b - h, Math.max(1, cw - 1), h);
      });
      pencil(ctx, [[pad.l, H - pad.b + 1], [W - pad.r, H - pad.b + 1]]);
      const X = (c) => pad.l + ((Math.log2(c) - B.lo) * 2) * cw;
      [1e-6, 1e-3, 0.1, 10, 1e3, 1e5, 1e8, 1e12, 1e20, 1e40].filter((c) => Math.log2(c) > B.lo + 0.5 && Math.log2(c) < B.hi - 0.5).forEach((c) => text(ctx, c === 10 ? "10 (start)" : fmtC(c), X(c), H - pad.b + 20, { size: 14, align: "center", color: C.muted }));
      text(ctx, "people (√ scale)", pad.l, pad.t + 4, { size: 14, color: C.muted, base: "top" });
      charcoal(ctx);
    },
    scatter(w, st, picked) {
      const { ctx, w: W, h: H } = fit($("#c-scatter"));
      let lo = -4, hi = 8; for (const a of w.agents) { const v = Math.log2(Math.max(a.C, 1e-300)); if (v < lo) lo = Math.floor(v); if (v > hi) hi = Math.ceil(v); }
      const pad = { l: 50, r: 12, t: 12, b: 36 };
      const X = (t) => pad.l + ((t - 0.2) / 0.8) * (W - pad.l - pad.r), Y = (c) => H - pad.b - ((clamp(Math.log2(Math.max(c, 1e-300)), lo, hi) - lo) / (hi - lo)) * (H - pad.t - pad.b);
      ctx.clearRect(0, 0, W, H);
      ctx.setLineDash([2, 5]); pencil(ctx, [[pad.l, Y(10)], [W - pad.r, Y(10)]], 1, C.muted, 0.7); ctx.setLineDash([]);
      text(ctx, "start (10)", W - pad.r, Y(10) - 5, { size: 14, align: "right", color: C.muted, halo: W < 520 });
      for (const a of w.agents) { ctx.fillStyle = a.C > 10 ? C.green : a.C < 10 ? C.red : C.ink; ctx.globalAlpha = 0.75; ctx.beginPath(); ctx.arc(X(a.T), Y(a.C), 2.3, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1;
      const ring = (a, label, dy, col = C.ink) => { const x = X(a.T), y = Y(a.C); circleLine(ctx, x, y, 7, 2, col); text(ctx, label, x + (x > W * 0.7 ? -12 : 12), y + dy, { size: 16, weight: 600, color: col, align: x > W * 0.7 ? "right" : "left", halo: W < 520 }); };
      ring(st.richest, "richest", -6, C.green); ring(st.mostTalented, "most talented", 16, C.blue);
      if (picked >= 0) ring(w.agents[picked], "picked", -12, C.ink);
      pencil(ctx, [[pad.l, pad.t], [pad.l, H - pad.b], [W - pad.r, H - pad.b]]);
      [0.2, 0.4, 0.6, 0.8, 1].forEach((t) => text(ctx, t.toFixed(1), X(t), H - pad.b + 20, { size: 14, align: "center", color: C.muted }));
      [lo + 1, Math.log2(10), hi - 1].forEach((v) => text(ctx, fmtC(2 ** v), pad.l - 6, Y(2 ** v) + 5, { size: 14, align: "right", color: C.muted }));
      text(ctx, "talent →", W - pad.r, H - 4, { size: 14, align: "right", color: C.muted });
      charcoal(ctx);
    },
    // x: capital, y: number of people. "lin" shows counts per half-doubling bin;
    // "log" shows people per unit of capital on log–log axes with the tail's fitted slope
    dist(canvas, caps, { mode = "lin", perWorld = 1, start = 10 } = {}) {
      const { ctx, w: W, h: H } = fit(canvas);
      const pad = { l: 56, r: 18, t: 22, b: 44 };
      ctx.clearRect(0, 0, W, H);
      if (mode === "lin") {
        const B = binsOf(caps, perWorld), max = Math.max(...B.counts, 1e-9), cw = (W - pad.l - pad.r) / B.n;
        const Y = (v) => H - pad.b - (v / max) * (H - pad.t - pad.b);
        B.counts.forEach((c, i) => { const v = Math.pow(2, B.lo + i / 2 + 0.25); ctx.fillStyle = v > start * 1.1 ? C.green : v < start * 0.9 ? C.red : C.ink; ctx.fillRect(pad.l + i * cw + 1, Y(c), Math.max(1, cw - 2), H - pad.b - Y(c)); });
        const X = (c) => pad.l + ((Math.log2(c) - B.lo) * 2) * cw;
        const ticks = []; for (let e = -300; e <= 300; e++) { const x = X(10 ** e); if (x >= pad.l + 10 && x <= W - pad.r - 10) ticks.push([10 ** e, x, e]); }
        // labels at least ~70px apart, always including the start
        const gap = ticks.length > 1 ? ticks[1][1] - ticks[0][1] : 999, every = Math.max(1, Math.ceil(70 / gap));
        ticks.forEach(([c, x, e]) => { const isStart = c === 10, near = Math.abs(e - 1) < every && !isStart; if (isStart || ((e - 1) % every === 0 && !near)) text(ctx, isStart ? "10 · start" : fmtC(c), x, H - pad.b + 24, { size: 14, align: "center", color: isStart ? C.ink : C.muted }); });
        [0, max / 2, max].forEach((v) => text(ctx, perWorld > 1 ? v.toFixed(v < 10 ? 1 : 0) : String(Math.round(v)), pad.l - 10, Y(v) + 5, { size: 14, align: "right", color: C.muted }));
        if (X(start) > pad.l) { ctx.setLineDash([2, 5]); pencil(ctx, [[X(start), pad.t], [X(start), H - pad.b]], 1, C.ink, 0.6); ctx.setLineDash([]); }
        text(ctx, perWorld > 1 ? "people per world" : "number of people", pad.l, pad.t - 6, { size: 15, color: C.muted });
        pencil(ctx, [[pad.l, pad.t], [pad.l, H - pad.b], [W - pad.r, H - pad.b]]);
        text(ctx, "capital →", W - pad.r, H - 4, { size: 15, align: "right", color: C.muted });
        charcoal(ctx);
        return null;
      }
      const s = slopes(caps), pts = s.dblPts.map(([x, y]) => [x, y - Math.log10(perWorld)]);
      if (pts.length < 2) { text(ctx, "too few people above the start to fit a tail", W / 2, H / 2, { size: 18, align: "center", color: C.muted }); charcoal(ctx); return s; }
      const x0 = Math.log10(10), x1 = Math.max(...pts.map((p) => p[0])) + 0.2, y0 = Math.min(...pts.map((p) => p[1])) - 0.3, y1 = Math.max(...pts.map((p) => p[1])) + 0.3;
      const X = (x) => pad.l + ((x - x0) / (x1 - x0)) * (W - pad.l - pad.r), Y = (y) => H - pad.b - ((y - y0) / (y1 - y0)) * (H - pad.t - pad.b);
      const ax = pts.reduce((a, p) => a + p[0], 0) / pts.length, ay = pts.reduce((a, p) => a + p[1], 0) / pts.length;
      pencil(ctx, [[X(x0 + 0.1), Y(ay + s.doubling * (x0 + 0.1 - ax))], [X(x1 - 0.1), Y(ay + s.doubling * (x1 - 0.1 - ax))]], 1.4, C.ink, 0.6);
      pts.forEach(([x, y]) => { ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(X(x), Y(y), 5, 0, Math.PI * 2); ctx.fill(); });
      const xs = []; for (let e = Math.ceil(x0); e <= Math.floor(x1); e++) xs.push(e); const ev = Math.max(1, Math.ceil(70 / Math.max(1, X(1) - X(0))));
      xs.forEach((e, i) => { if (i % ev === 0) text(ctx, fmtC(10 ** e), X(e), H - pad.b + 24, { size: 14, align: "center", color: C.muted }); });
      const ys = []; for (let e = Math.ceil(y0); e <= Math.floor(y1); e++) ys.push(e); const evy = Math.max(1, Math.ceil(ys.length / 6));
      ys.forEach((e, i) => { if (i % evy === 0) text(ctx, `10^${e}`, pad.l - 10, Y(e) + 5, { size: 14, align: "right", color: C.muted }); });
      text(ctx, `slope ${s.doubling.toFixed(2)}`, X(x1 - 0.1), Y(ay + s.doubling * (x1 - 0.1 - ax)) - 14, { size: 19, align: "right" });
      text(ctx, "people per unit of capital (log)", pad.l, pad.t - 6, { size: 15, color: C.muted });
      pencil(ctx, [[pad.l, pad.t], [pad.l, H - pad.b], [W - pad.r, H - pad.b]]);
      text(ctx, "capital (log) →", W - pad.r, H - 4, { size: 15, align: "right", color: C.muted });
      charcoal(ctx);
      return s;
    },
    life(canvas, a, steps) {
      const { ctx, w: W, h: H } = fit(canvas);
      const pad = { l: 50, r: 10, t: 12, b: 38 }, hs = a.hist;
      const vals = hs.map((c) => Math.log2(Math.max(c, 1e-300))), lo = Math.min(-2, ...vals) - 0.5, hi = Math.max(6, ...vals) + 0.5;
      const X = (t) => pad.l + (t / steps) * (W - pad.l - pad.r), Y = (v) => H - pad.b - ((v - lo) / (hi - lo)) * (H - pad.t - pad.b - 12);
      ctx.clearRect(0, 0, W, H);
      ctx.setLineDash([2, 5]); pencil(ctx, [[pad.l, Y(Math.log2(10))], [W - pad.r, Y(Math.log2(10))]], 1, C.muted, 0.6); ctx.setLineDash([]);
      const pts = []; vals.forEach((v, t) => { if (t) pts.push([X(t), Y(vals[t - 1])]); pts.push([X(t), Y(v)]); });
      pencil(ctx, pts, 2.2, C.ink, 0.95);
      const mr = steps > 120 ? 3.5 : 5;
      for (const [t, kind] of a.log) { const x = X(t), y = H - pad.b + 14; if (kind === 1) ball(ctx, x, y, mr, true); else if (kind === 0) { ctx.strokeStyle = C.green; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x, y, mr - 1, 0, Math.PI * 2); ctx.stroke(); } else ball(ctx, x, y, mr, false); }
      [[Math.log2(10), "10"], [hi - 0.5, fmtC(2 ** (hi - 0.5))], [lo + 0.5, fmtC(2 ** (lo + 0.5))]].forEach(([v, l]) => text(ctx, l, pad.l - 6, Y(v) + 5, { size: 14, align: "right", color: C.muted }));
      text(ctx, "year 0", pad.l, H - 2, { size: 14, color: C.muted }); text(ctx, `year ${steps / 2}`, W - pad.r, H - 2, { size: 14, align: "right", color: C.muted });
      charcoal(ctx);
    },
  };
  // the "people / log–log" switches under each distribution chart
  function toggle(group, draw) {
    let mode = "lin";
    group.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { mode = b.dataset.v; group.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); draw(mode); }));
    return () => mode;
  }

  /* =========================== 02 · THE LAB =========================== */
  const lab = (function () {
    const cv = $("#c-world"), tip = $("#world-tip");
    const ids = ["pL", "NE", "mT", "sT", "years", "speed"];
    const outs = { pL: (v) => pct(v), NE: (v) => String(v), mT: (v) => (+v).toFixed(2), sT: (v) => (+v).toFixed(2), years: (v) => String(v), speed: (v) => `×${v}` };
    let g, w, playing = false, acc = 0, last = 0, picked = -1, hover = -1;
    const params = () => ({ pL: +$("#pL").value, NE: +$("#NE").value, mT: +$("#mT").value, sT: +$("#sT").value, steps: +$("#years").value * 2 });
    // the ink fill of each slider follows its value
    ids.forEach((id) => { const el = $(`#${id}`), o = $(`#o-${id}`), upd = () => { o.textContent = outs[id](el.value); el.style.setProperty("--p", `${((el.value - el.min) / (el.max - el.min)) * 100}%`); }; el.addEventListener("input", upd); upd(); });
    ["pL", "NE", "mT", "sT", "years"].forEach((id) => $(`#${id}`).addEventListener("change", () => fresh()));

    const pickBox = document.createElement("div");
    pickBox.innerHTML = `<p class="label" style="margin:0 0 4px">Picked person</p><p class="mono" id="pick-s" style="margin:0 0 6px">${coarse ? "Tap" : "Click"} anyone in the world to follow their life. Green ring: the richest. Blue ring: the most talented.</p><canvas id="c-pick" style="width:100%;aspect-ratio:3.2"></canvas>`;
    $("#picked").appendChild(pickBox);

    function fresh(seed) {
      playing = false; $("#run").textContent = "▶ Run";
      w = T.create(Object.assign(params(), { seed: seed || 1 + Math.floor(Math.random() * 1e6) }));
      remember(w); picked = -1; acc = 0;
      $("#seed").textContent = w.p.seed;
      update(); drawPick();
    }
    function frameAt(t) {
      const dt = Math.min(0.1, (t - last) / 1000); last = t;
      if (playing) {
        // long runs go faster, so 200 years doesn't take ten minutes
        acc += dt * +$("#speed").value * Math.max(1, w.p.steps / 80);
        while (acc >= 1 && w.t < w.p.steps) { acc -= 1; remember(w); T.step(w); update(); }
        if (w.t >= w.p.steps) { playing = false; acc = 1; $("#run").textContent = "▶ Run again"; reading(w); }
      }
      draw();
      requestAnimationFrame(frameAt);
    }
    function draw() {
      if (!g) return;
      const { ctx, w: W } = g;
      ctx.clearRect(0, 0, W, W);
      const st = T.stats(w);
      const rings = [[st.richest.id, C.green], [st.mostTalented.id, C.blue]];
      if (picked >= 0) rings.push([picked, C.ink]);
      if (hover >= 0) rings.push([hover, C.muted]);
      drawWorld(ctx, w, 4, 4, W - 8, { interp: playing ? acc : 1, rings });
      charcoal(ctx);
    }
    function update() {
      const st = T.stats(w), yrs = w.p.steps / 2;
      $("#yr").textContent = yrs === 40 ? `Age ${20 + Math.floor(w.t / 2)}` : `Year ${Math.floor(w.t / 2)}`;
      $("#step-n").textContent = `year ${Math.floor(w.t / 2)} / ${yrs}`;
      $("#s-top").textContent = pct(st.top20);
      $("#s-up").textContent = pct(st.above);
      $("#s-rich").textContent = st.richest.T.toFixed(2);
      $("#s-gift").textContent = fmtC(st.mostTalented.C);
      charts.hist(w); charts.scatter(w, st, picked);
      if (picked >= 0) drawPick();
    }
    function drawPick() {
      const c = $("#c-pick");
      if (picked < 0) { const { ctx, w: W, h: H } = fit(c); ctx.clearRect(0, 0, W, H); return; }
      const a = w.agents[picked], st = T.stats(w);
      $("#pick-s").textContent = `talent ${a.T.toFixed(2)} (more than ${pct(st.talentPct(a.T))} of people) · capital ${fmtC(a.C)} · ${ord(st.rank(a))} richest`;
      charts.life(c, a, w.p.steps);
    }
    function nearest(e) {
      const r = cv.getBoundingClientRect(), S = w.p.size, k = (r.width - 8) / S;
      const x = (e.clientX - r.left - 4) / k, y = (e.clientY - r.top - 4) / k;
      const touch = e.pointerType === "touch" || (coarse && e.type === "click"), rad = touch ? Math.max(3, 22 / k) : 3;
      let best = -1, bd = rad * rad;
      for (const a of w.agents) { const d = (a.x + 0.5 - x) ** 2 + (a.y + 0.5 - y) ** 2; if (d < bd) { bd = d; best = a.id; } }
      return best;
    }
    function showTip(id, px, py) {
      const a = w.agents[id], st = T.stats(w), r = cv.getBoundingClientRect();
      tip.innerHTML = `talent ${a.T.toFixed(2)} · capital ${fmtC(a.C)}<br>${a.lucky} green (${a.used} seized) · ${a.unlucky} red · ${ord(st.rank(a))} richest`;
      tip.classList.add("on");
      const tw = tip.offsetWidth, th = tip.offsetHeight;
      let left = px + 16, top = py + 16;
      if (left + tw > r.width - 4) left = Math.max(4, px - 16 - tw);
      if (left < 4) left = Math.max(4, Math.min(r.width - tw - 4, px - tw / 2));
      if (top + th > r.height - 4) top = Math.max(4, py - 22 - th);
      tip.style.left = `${left}px`; tip.style.top = `${top}px`;
    }
    cv.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      hover = nearest(e);
      if (hover < 0) { tip.classList.remove("on"); return; }
      const r = cv.getBoundingClientRect();
      showTip(hover, e.clientX - r.left, e.clientY - r.top);
      if (!playing) draw();
    });
    cv.addEventListener("pointerleave", (e) => { if (e.pointerType === "touch") return; hover = -1; tip.classList.remove("on"); if (!playing) draw(); });
    cv.addEventListener("click", (e) => {
      picked = nearest(e); update();
      // no hover on a touch screen: the tap shows the card, next to the person, until the next tap
      if (coarse || e.pointerType === "touch") {
        if (picked < 0) { tip.classList.remove("on"); return; }
        const a = w.agents[picked], k = (cv.getBoundingClientRect().width - 8) / w.p.size;
        showTip(picked, 4 + (a.x + 0.5) * k, 4 + (a.y + 0.5) * k);
      }
    });
    $("#run").addEventListener("click", () => {
      if (playing) { playing = false; $("#run").textContent = "▶ Resume"; return; }
      if (w.t >= w.p.steps) fresh();
      playing = true; last = performance.now(); $("#run").textContent = "❚❚ Pause";
    });
    $("#stepbtn").addEventListener("click", () => { if (w.t >= w.p.steps) return; playing = false; $("#run").textContent = "▶ Resume"; remember(w); T.step(w); acc = 1; update(); if (w.t >= w.p.steps) { $("#run").textContent = "▶ Run again"; reading(w); } });
    $("#reset").addEventListener("click", () => fresh());
    const start = () => { g = fit(cv); fresh(84); last = performance.now(); requestAnimationFrame(frameAt); };
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(start);
    window.addEventListener("resize", () => { g = fit(cv); update(); });
    return { params, get world() { return w; } };
  })();

  /* =========================== 03 · the run, re-told by its own people =========================== */
  // Until your run ends this plate mirrors the live world above. When it ends, its
  // thousand dots lift out of the world and regroup for each paragraph: sorted by
  // capital, spotlit, laid out by talent, then by luck, and finally sent home.
  const readStory = (function () {
    const cv = $("#c-read"), cap = $("#cap-read");
    const V = 200;                                   // the plate's square, in its own units
    let g, vis = false, last = 0, since = 0, w = null, st = null, P = [], view = "", lo = 0, hi = 1, luckLo = 0, luckHi = 1;
    const kindOf = (a) => (a.C > 10 ? "good" : a.C < 10 ? "bad" : "person");
    const lg = (c) => Math.log2(Math.max(c, 1e-300));
    const rWorld = (a) => clamp(0.75 + 0.3 * Math.log2(Math.max(a.C, 1e-6) / 10), 0.3, 4.2);
    const X0 = 14, X1 = 194, Y0 = 18, Y1 = 176;      // chart area inside the square
    const yOf = (c) => Y1 - ((lg(c) - lo) / (hi - lo)) * (Y1 - Y0);
    const xT = (t) => X0 + ((t - 0.2) / 0.8) * (X1 - X0);
    const xL = (l) => X0 + ((l - luckLo + 0.5) / (luckHi - luckLo + 1)) * (X1 - X0);
    const CAP = { world: "back home: the same people, where they live", top20: "everyone sorted by capital · darker: the richest 20%", hist: "everyone sorted by capital", richest: "the richest person, and where everyone else ended", talented: "talent → against capital ↑ · green: richest · blue: most talented", better: "everyone more talented than the richest person", luck: "net luck (green balls − red) → against capital ↑" };

    function histPos(vals, bins, maxH) {
      const binW = (X1 - X0) / bins, bin = (v) => clamp(Math.floor(((v - lo) / (hi - lo)) * bins), 0, bins - 1), counts = new Array(bins).fill(0);
      vals.forEach((v) => counts[bin(v)]++);
      const most = Math.max(...counts), sp = Math.min(2.4, Math.sqrt((binW * 0.92 * maxH) / most)), cols = Math.max(1, Math.floor((binW * 0.92) / sp));
      counts.fill(0);
      const out = new Array(vals.length);
      vals.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]).forEach(([v, i]) => { const b = bin(v), k = counts[b]++, c = k % cols; out[i] = [X0 + (b + 0.5) * binW + (c - (cols - 1) / 2) * sp, Y1 - Math.floor(k / cols) * sp]; });
      out.sp = sp;
      return out;
    }
    function setView(v) {
      if (!w || v === view) return;
      view = v; since = 0;
      const A = w.agents, rank = A.slice().sort((a, b) => b.C - a.C), top = new Set(rank.slice(0, Math.round(A.length * 0.2)).map((a) => a.id));
      const R = st.richest, G = st.mostTalented;
      P.forEach((p) => (p.d = Math.random() * 0.5));
      if (v === "world") A.forEach((a, j) => Object.assign(P[j], { tx: (a.x + 0.5) * (V / 201), ty: (a.y + 0.5) * (V / 201), tr: rWorld(a), tal: 1 }));
      if (v === "top20" || v === "hist" || v === "richest") {
        const pos = histPos(A.map((a) => lg(a.C)), 34, 150);
        A.forEach((a, j) => Object.assign(P[j], { tx: pos[j][0], ty: pos[j][1], tr: pos.sp * 0.44, tal: v === "top20" ? (top.has(a.id) ? 1 : 0.22) : v === "richest" ? 0.18 : 1 }));
        if (v === "richest") Object.assign(P[R.id], { tx: P[R.id].tx, ty: Math.min(P[R.id].ty, Y1 - 40), tr: 4.5, tal: 1 });
      }
      if (v === "talented" || v === "better") A.forEach((a, j) => Object.assign(P[j], { tx: xT(a.T), ty: yOf(a.C), tr: 0.95, tal: v === "better" ? (a.T > R.T ? 1 : 0.14) : 0.85 }));
      if (v === "luck") A.forEach((a, j) => { const l = a.lucky - a.unlucky, jx = (((a.id * 0.618) % 1) - 0.5) * ((X1 - X0) / (luckHi - luckLo + 1)) * 0.7; Object.assign(P[j], { tx: xL(l) + jx, ty: yOf(a.C), tr: 0.95, tal: 0.85 }); });
      if (v === "talented" || v === "better" || v === "luck") { P[R.id].tr = 2.2; P[R.id].tal = 1; P[G.id].tr = 2.2; P[G.id].tal = 1; }
      cap.textContent = CAP[v] || "";
    }
    function load(run) {
      w = run; st = T.stats(run); view = "";
      const caps = run.agents.map((a) => lg(a.C)); lo = Math.min(...caps) - 0.6; hi = Math.max(...caps) + 0.6;
      const l = run.agents.map((a) => a.lucky - a.unlucky); luckLo = Math.min(...l); luckHi = Math.max(...l);
      // every dot starts exactly where it stood in the world
      P = run.agents.map((a) => ({ x: (a.x + 0.5) * (V / 201), y: (a.y + 0.5) * (V / 201), r: rWorld(a), al: 1, tx: 0, ty: 0, tr: 1, tal: 1, d: 0 }));
      setView("world");
      requestAnimationFrame(onScroll);
    }
    function axes(ctx, X, Y, k) {
      const mono = (s, x, y, align = "center", col = C.muted) => text(ctx, s, x, y, { size: 15, align, color: col });
      const line = (pts, col = C.ink, wdt = 1.2) => pencil(ctx, pts.map(([x, y]) => [X(x), Y(y)]), wdt, col, 0.8);
      if (view === "top20" || view === "hist" || view === "richest") {
        line([[X0, Y1 + 2], [X1, Y1 + 2]]);
        const xs = (c) => X0 + ((lg(c) - lo) / (hi - lo)) * (X1 - X0);
        mono("10 · start", X(xs(10)), Y(Y1 + 10), "center", C.ink);
        mono(fmtC(2 ** Math.ceil(lo + 0.6)), X(X0 + 6), Y(Y1 + 10), "left"); mono(fmtC(2 ** Math.floor(hi - 0.6)), X(X1 - 6), Y(Y1 + 10), "right");
        if (view === "richest" && since > 0.8) { const p = P[st.richest.id]; circleLine(ctx, X(p.x), Y(p.y), p.r * k + 6, 2, C.green, clamp(since - 0.8)); mono(`richest · talent ${st.richest.T.toFixed(2)} · ${fmtC(st.richest.C)} units`, X(p.x) + (p.x > 130 ? 8 : p.x < 70 ? -8 : 0), Y(p.y) - p.r * k - 14, p.x > 130 ? "right" : p.x < 70 ? "left" : "center", C.green); }
      } else if (view === "talented" || view === "better" || view === "luck") {
        line([[X0, Y0 - 4], [X0, Y1 + 2], [X1, Y1 + 2]]);
        ctx.setLineDash([3, 4]); line([[X0, yOf(10)], [X1, yOf(10)]], C.muted, 1); ctx.setLineDash([]);
        mono("10", X(X0) - 6, Y(yOf(10)) + 4, "right");
        if (view === "luck") { for (let l = luckLo; l <= luckHi; l += Math.max(1, Math.ceil((luckHi - luckLo) / 8))) mono(l > 0 ? `+${l}` : String(l), X(xL(l)), Y(Y1 + 10)); mono("net luck →", X(X1), Y(Y1 + 18), "right"); }
        else { [0.2, 0.4, 0.6, 0.8, 1].forEach((t) => mono(t.toFixed(1), X(xT(t)), Y(Y1 + 10))); mono("talent →", X(X1), Y(Y1 + 18), "right"); }
        if (view === "better") { ctx.setLineDash([4, 4]); line([[xT(st.richest.T), Y0], [xT(st.richest.T), Y1]], C.green, 1.4); ctx.setLineDash([]); }
        if (since > 0.9) {
          const ring = (a, col, label, dy) => { const p = P[a.id]; circleLine(ctx, X(p.x), Y(p.y), p.r * k + 5, 2, col, clamp(since - 0.9)); mono(label, X(p.x) + (p.x > 150 ? -12 : 12), Y(p.y) + dy, p.x > 150 ? "right" : "left", col); };
          ring(st.richest, C.green, "richest", -8); ring(st.mostTalented, C.blue, "most talented", 16);
        }
      }
    }
    function frameAt(t) {
      if (!g || !vis) return;
      const dt = Math.min(0.05, (t - last) / 1000); last = t; since += dt;
      const { ctx, w: W, h: H } = g;
      ctx.clearRect(0, 0, W, H);
      const size = Math.min(W, H) * 0.96, k = size / V, ox = (W - size) / 2, oy = (H - size) / 2;
      const X = (x) => ox + x * k, Y = (y) => oy + y * k;
      if (!w) {
        // before your run ends: the live world, mirrored
        const lw = lab.world;
        if (lw) { drawWorld(ctx, lw, ox, oy, size, {}); frame(ctx, ox, oy, size); }
        cap.textContent = lw ? `your world, still running · year ${Math.floor(lw.t / 2)}` : "";
      } else {
        ctx.globalAlpha = view === "world" ? 1 : clamp(1 - since * 2) * 0.9; frame(ctx, ox, oy, size); ctx.globalAlpha = 1;
        const pk = 1 - Math.exp(-dt * 3);
        P.forEach((p, j) => {
          if (since >= p.d) { p.x += (p.tx - p.x) * pk; p.y += (p.ty - p.y) * pk; p.r += (p.tr - p.r) * pk; p.al += (p.tal - p.al) * pk; }
          dot(ctx, view === "world" ? "person" : kindOf(w.agents[j]), X(p.x), Y(p.y), p.r * k, j, p.al);
        });
        axes(ctx, X, Y, k);
      }
      if (!reduce) requestAnimationFrame(frameAt);
    }
    function onScroll() {
      const steps = $$("#reading-text .step");
      const mid = triggerLine(cv.parentElement);
      let cur = steps[0];
      steps.forEach((s) => { if (s.getBoundingClientRect().top <= mid) cur = s; });
      steps.forEach((s) => s.classList.toggle("on", s === cur));
      if (w && cur && cur.dataset.view) setView(cur.dataset.view);
    }
    new IntersectionObserver((es) => { const v = es[0].isIntersecting; if (v && !vis) { vis = true; g = fit(cv); last = performance.now(); requestAnimationFrame(frameAt); } vis = v; }, { rootMargin: "100px" }).observe(cv);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", () => { if (vis) g = fit(cv); });
    return { load };
  })();

  /* =========================== 03 · READING YOUR RUN =========================== */
  let lastRun = null;
  const distMode = toggle($("#results .seg"), () => lastRun && drawDist(lastRun));
  function drawDist(w) {
    const caps = w.agents.map((a) => a.C), s = slopes(caps);
    charts.dist($("#c-dist"), caps, { mode: distMode() });
    const below1 = caps.filter((c) => c < 1).length, same = caps.filter((c) => c === 10).length, above = caps.filter((c) => c > 10).length, max = Math.max(...caps);
    $("#dist-note").innerHTML = `${below1} people ended with less than 1 unit, ${caps.length - above - below1 - same} between 1 and 10, ${same} exactly where they started, and ${above} above it, up to ${fmtC(max)}. Each bar spans half a doubling of capital. ` +
      (isFinite(s.authors) ? `The tail falls off as a power law. Fitted the authors’ way (80 equal bins) its slope is <strong>${s.authors.toFixed(2)}</strong> (paper, one run: −1.27); with doubling bins, as in the log–log view, ${isFinite(s.doubling) ? s.doubling.toFixed(2) : "–"}.` : "");
  }
  function reading(w) {
    lastRun = w;
    const st = T.stats(w), p = w.p, A = w.agents, R = st.richest, G = st.mostTalented, yrs = p.steps / 2;
    const def = isPaper(p);
    const better = A.filter((a) => a.T > R.T), avgBetter = better.reduce((s, a) => s + a.C, 0) / Math.max(1, better.length);
    const rPct = st.talentPct(R.T), gRank = st.rank(G);
    const parts = [];
    parts.push(["top20", `<p>After ${yrs} years, the richest 20% of your world hold <span class="hl">${pct(st.top20, st.top20 > 0.99 ? 1 : 0)}</span> of all the capital. ${st.top20 > 0.9 ? "That’s far beyond Pareto’s 80/20: the other 80% of people share almost nothing." : st.top20 >= 0.76 ? "Everyone started with exactly 10 units and talent was a gentle bell curve, yet wealth came out about as lopsided as Pareto’s famous 80/20." : st.top20 >= 0.6 ? "Everyone started with exactly 10 units and talent was a gentle bell curve, yet wealth came out lopsided, if a little short of Pareto’s 80/20." : "That’s far less lopsided than the paper’s 80/20; your settings dampen the doubling game."} ${pct(st.below)} of people ended poorer than they started; ${pct(st.above)} richer.</p>`]);
    if (yrs > 40) parts.push(["hist", `<p>You let it run ${yrs} years, ${(yrs / 40).toFixed(yrs % 40 ? 1 : 0)} times the paper’s working life. Doubling and halving compound, so the longer it runs, the further the lucky and the unlucky drift apart: the single richest person now holds <span class="hl">${pct(R.C / A.reduce((s, a) => s + a.C, 0))}</span> of everything.</p>`]);
    parts.push(["richest", `<p>The richest person has <span class="hl">${fmtC(R.C)} units</span>, ${fmtC(R.C / p.C0)} times the start. Their talent is <strong>${R.T.toFixed(2)}</strong>, more than ${pct(rPct)} of people: ${rPct > 0.97 ? "genuinely exceptional, which is the rarer outcome." : rPct > 0.75 ? "above average but far from the top, the typical winner (across thousands of runs the paper finds winners average 0.67)." : "about as ordinary as talent gets. The paper’s own example run had the same twist: its richest person had talent 0.61."} They met ${R.lucky} green ball${R.lucky === 1 ? "" : "s"} (seized ${R.used}) and ${R.unlucky === 0 ? "not a single red one" : `only ${R.unlucky} red`}.</p>`]);
    parts.push(["talented", `<p>The most talented person, at <strong>${G.T.toFixed(2)}</strong>, finished with <span class="hl">${fmtC(G.C)} units</span>, ${ord(gRank)} out of ${A.length}. ${G.lucky + G.unlucky === 0 ? "Exactly where they started: not a single ball passed near them." : `${G.C < p.C0 ? "Less than they started with." : G.C === p.C0 ? "Exactly where they started." : "Ahead, but nowhere near the top."} They saw ${G.lucky} green (seized ${G.used}) and ${G.unlucky} red.`} In the paper’s run, the most gifted person (0.89) ended with 0.6 units.</p>`]);
    if (better.length) parts.push(["better", `<p>The ${better.length} people more talented than your richest person ended with <strong>${fmtC(avgBetter)}</strong> units on average; the winner has ${fmtC(R.C / avgBetter)} times that. (Paper: 128 times.)</p>`]);
    parts.push(["luck", `<p class="callout">Talent and (log) wealth correlate at <strong>${st.corrTalent.toFixed(2)}</strong>; net luck (green minus red) and wealth at <strong>${st.corrLuck.toFixed(2)}</strong>. ${pct(st.neutral)} of people never met a single ball. Of the ${st.talentedCount} talented people (talent above ${(p.mT + p.sT).toFixed(1)}), ${pct(st.PT)} ended richer than they started${def ? " (paper: 32%)" : ""}.</p>`]);
    const REF = window.TVL_REF;
    if (def && REF) {
      const at = (k, x) => { const a = REF[k]; let i = 0; while (i < 100 && a[i + 1] < x) i++; return i; };
      const t = at("top20", st.top20), c = at("cmax", R.C), r = at("tRich", R.T), odd = t < 10 || t > 90 || c < 10 || c > 90;
      parts.push(["world", `<p>How typical was your world? Against ${REF.runs} worlds with the same rules, it is more unequal than <strong>${t}%</strong> of them, and its richest person is richer than the richest in <strong>${c}%</strong>. Their talent beats the winners of <strong>${r}%</strong> of worlds. ${odd ? "So this was an unusual world: run a few more before reading much into it." : "A fairly ordinary world, in other words."} Any single run is one roll of the dice, the paper’s own example included; chapter 4 rolls a hundred.</p>`]);
    }
    if (!def) parts.push(["world", `<p class="mono">your rules: ${pct(p.pL)} lucky · ${p.NE} events · talent ${p.mT.toFixed(2)} ± ${p.sT.toFixed(2)} · ${yrs} years. the paper used 50% · 500 · 0.6 ± 0.1 · 40 years, so compare loosely.</p>`]);
    $("#reading-text").innerHTML = parts.map(([v, h]) => `<div class="step" data-view="${v}">${h}</div>`).join("");
    readStory.load(w);
    $("#results").hidden = false; $("#lives").hidden = false;
    $("#life-a-t").textContent = `the richest · talent ${R.T.toFixed(2)}`;
    $("#life-a-s").textContent = `${R.lucky} green (${R.used} seized), ${R.unlucky} red → ${fmtC(R.C)} units`;
    $("#life-b-t").textContent = `the most talented · talent ${G.T.toFixed(2)}`;
    $("#life-b-s").textContent = `${G.lucky} green (${G.used} seized), ${G.unlucky} red → ${fmtC(G.C)} units`;
    requestAnimationFrame(() => { drawDist(w); charts.life($("#c-life-a"), R, p.steps); charts.life($("#c-life-b"), G, p.steps); });
  }

  /* =========================== batch helpers =========================== */
  async function batch(n, opts, bar, onRun) {
    for (let i = 0; i < n; i++) {
      const w = T.run(Object.assign({}, opts(i), { seed: 1000 + i * 7919 }));
      onRun(w, i);
      if (i % 3 === 2) { if (bar) bar.style.width = `${((i + 1) / n) * 100}%`; await new Promise((r) => setTimeout(r)); }
    }
    if (bar) bar.style.width = "100%";
  }
  function bars(canvas, rows, { max = 1, refLabel = "paper" } = {}) {
    const { ctx, w: W, h: H } = fit(canvas);
    const pad = { l: 6, r: 10, t: 10, b: 10 }, rh = (H - pad.t - pad.b) / rows.length, lw = Math.min(180, W * 0.44), span = W - lw - pad.r - 56;
    ctx.clearRect(0, 0, W, H);
    rows.forEach((r, i) => {
      const y = pad.t + i * rh, bw = span * (r.v / max);
      text(ctx, r.label, pad.l, y + rh * 0.4, { size: 19, base: "middle" });
      if (r.sub) text(ctx, r.sub, pad.l, y + rh * 0.4 + 18, { size: 14, color: C.muted, base: "middle" });
      ctx.fillStyle = r.color || C.ink; ctx.fillRect(lw, y + rh * 0.22, Math.max(1, bw), rh * 0.36);
      text(ctx, pct(r.v), lw + bw + 8, y + rh * 0.4, { size: 18, base: "middle" });
      if (r.ref != null) { const x = lw + span * (r.ref / max); pencil(ctx, [[x, y + rh * 0.1], [x, y + rh * 0.7]], 1.6); text(ctx, `${refLabel} ${pct(r.ref, 0)}`, x, y + rh * 0.88, { size: 13, align: "center", color: C.muted }); }
    });
    charcoal(ctx);
  }

  /* =========================== 04 · A HUNDRED LIVES =========================== */
  let pooled = null;
  const poolMode = toggle($("#many-dist .seg"), () => pooled && drawPool());
  function drawPool() {
    charts.dist($("#c-many-dist"), pooled.caps, { mode: poolMode(), perWorld: pooled.n });
    const ok = pooled.slopesAuthors.filter(isFinite).sort((a, b) => a - b), med = ok[Math.floor(ok.length / 2)];
    $("#many-dist-note").innerHTML = `Every person from all ${pooled.n} worlds, divided by ${pooled.n}, so a bar reads as people in a typical world. The tail’s slope, fitted the authors’ way on each world separately: median <strong>${med != null ? med.toFixed(2) : "–"}</strong> (paper: −1.27 for its example run). Pooled with doubling bins: ${slopes(pooled.caps).doubling.toFixed(2)}.`;
  }
  $("#run100").addEventListener("click", async (e) => {
    const btn = e.currentTarget; btn.disabled = true;
    const p = lab.params(), best = [], pts = [], caps = [], sa = [];
    await batch(100, () => p, $("#p100"), (w) => { const st = T.stats(w); best.push({ T: st.richest.T, C: st.richest.C }); pts.push(st.PT); const c = w.agents.map((a) => a.C); for (const v of c) caps.push(v); sa.push(slopes(c).authors); });
    btn.disabled = false; btn.textContent = "Run 100 more";
    const mean = best.reduce((s, b) => s + b.T, 0) / best.length, sd = Math.sqrt(best.reduce((s, b) => s + (b.T - mean) ** 2, 0) / best.length);
    const elite = best.filter((b) => b.T > p.mT + 2 * p.sT).length / best.length, avgPT = pts.reduce((a, b) => a + b, 0) / pts.length;
    const champ = best.reduce((m, b) => (b.C > m.C ? b : m), best[0]);
    const { ctx, w: W, h: H } = fit($("#c-many"));
    const narrow = W < 520, pad = { l: 12, r: 12, t: narrow ? 52 : 18, b: narrow ? 56 : 40 }, X = (t) => pad.l + ((t - 0.2) / 0.8) * (W - pad.l - pad.r), base = H - pad.b;
    ctx.clearRect(0, 0, W, H);
    const gauss = (t, m, s) => Math.exp(-((t - m) ** 2) / (2 * s * s));
    ctx.fillStyle = C.ink; ctx.globalAlpha = 0.14; ctx.beginPath(); ctx.moveTo(X(0.2), base);
    for (let t = 0.2; t <= 1.0001; t += 0.005) ctx.lineTo(X(t), base - gauss(t, p.mT, p.sT) * (H - pad.t - pad.b) * 0.55);
    ctx.lineTo(X(1), base); ctx.fill(); ctx.globalAlpha = 1;
    const nb = 32, hb = new Array(nb).fill(0); best.forEach((b) => hb[clamp(Math.floor(((b.T - 0.2) / 0.8) * nb), 0, nb - 1)]++);
    const mx = Math.max(...hb);
    hb.forEach((c, i) => { const h = (c / mx) * (H - pad.t - pad.b) * 0.9; ctx.fillStyle = C.green; ctx.fillRect(X(0.2 + (i / nb) * 0.8) + 1, base - h, (W - pad.l - pad.r) / nb - 2, h); });
    [[p.mT, "average person"], [mean, "average winner"]].forEach(([v, l], i) => { if (i) pencil(ctx, [[X(v), pad.t + 18], [X(v), base]], 1.6); else { ctx.setLineDash([3, 5]); pencil(ctx, [[X(v), pad.t + 2], [X(v), base]], 1.3); ctx.setLineDash([]); } text(ctx, `${l} ${v.toFixed(2)}`, narrow ? clamp(X(v) + 7, pad.l, W - pad.r - 150) : X(v) + 7, narrow ? 16 + i * 20 : pad.t + 14 + i * 18, { size: 16, color: i ? C.green : C.ink }); });
    pencil(ctx, [[pad.l, base + 1], [W - pad.r, base + 1]]);
    [0.2, 0.4, 0.6, 0.8, 1].forEach((t) => text(ctx, t.toFixed(1), X(t), base + 20, { size: 14, align: "center", color: C.muted }));
    if (narrow) { text(ctx, "grey: everyone’s talent", pad.l, H - 20, { size: 14, color: C.muted }); text(ctx, "green: each world’s richest", pad.l, H - 3, { size: 14, color: C.muted }); }
    else text(ctx, "grey: everyone’s talent · green: each world’s richest", pad.l, H - 3, { size: 14, color: C.muted });
    charcoal(ctx);
    $("#many-text").innerHTML = `
      <p>Across your 100 worlds, the person who finished on top had an average talent of <span class="hl">${mean.toFixed(2)}</span> (± ${sd.toFixed(2)}), against ${p.mT.toFixed(2)} for everyone. ${mean > p.mT + 0.02 ? "So talent helps: winners lean above average." : "Winners are barely more talented than anyone else."} But the green bars bunch just right of the middle, not at the far right where the most gifted live.</p>
      <p>People more than two spreads above average (talent over ${(p.mT + 2 * p.sT).toFixed(1)}) were the richest in <strong>${pct(elite)}</strong> of worlds. The biggest fortune of all, ${fmtC(champ.C)} units, went to someone with talent ${champ.T.toFixed(2)}.</p>
      <p class="callout">The paper, over 10,000 runs: winners’ talent 0.667 ± 0.09, and 32% of talented people end ahead. Your 100: ${mean.toFixed(3)} ± ${sd.toFixed(2)}, and ${pct(avgPT)}. On the very talented, the paper reports they won 3% of its 100 runs, though its own 10,000-run fit implies about 7%; over 2,000 runs this page’s model gives 8.5%. Yours: ${pct(elite)}.</p>`;
    pooled = { caps, n: 100, slopesAuthors: sa };
    $("#many-dist").hidden = false;
    requestAnimationFrame(drawPool);
  });

  /* =========================== 05 · WHERE YOU'RE BORN =========================== */
  $("#runplace").addEventListener("click", async (e) => {
    const btn = e.currentTarget; btn.disabled = true;
    const p = lab.params(), envs = [[0.2, 0.0875], [0.5, 0.32], [0.8, 0.6218]], res = [];
    for (let k = 0; k < envs.length; k++) {
      let s = 0; const n = 40;
      await batch(n, () => Object.assign({}, p, { pL: envs[k][0] }), null, (w) => { s += T.stats(w).PT; });
      res.push(s / n); $("#pplace").style.width = `${((k + 1) / envs.length) * 100}%`;
    }
    btn.disabled = false;
    const def = p.NE === 500 && p.mT === 0.6 && p.sT === 0.1 && p.steps === 80;
    bars($("#c-place"), envs.map(([pl, ref], i) => ({ label: `${pct(pl)} lucky`, sub: ["few chances", "the paper’s default", "many chances"][i], v: res[i], ref: def ? ref : null, color: [C.red, C.ink2, C.green][i] })));
    $("#place-text").innerHTML = `
      <p>With mostly bad luck around (20% lucky), only <span class="hl">${pct(res[0])}</span> of talented people end ahead of where they started. In an even world, ${pct(res[1])}. In a world thick with opportunity (80% lucky), <span class="hl">${pct(res[2])}</span>.</p>
      <p>Talent didn’t change between these worlds. Only the weather did. The same gifted person is ${fmtC(res[2] / Math.max(res[0], 0.001))} times as likely to get ahead in the rich environment as in the poor one.</p>
      <p class="mono">40 worlds each over ${p.steps / 2} years. paper (100 runs each, 40 years): 8.75%, 32%, 62.18%${def ? ", marked on the bars" : ""}.</p>`;
  });

  /* =========================== 06 · GRANTS =========================== */
  $("#rungrants").addEventListener("click", async (e) => {
    const btn = e.currentTarget; btn.disabled = true;
    const p = lab.params(), n = 60;
    const plans = [
      { label: "no grants", f: null, ref: 0.3205, color: C.muted },
      { label: "to the best", sub: "richest 25% × 5", f: { kind: "elitarian", share: 0.25, units: 5 }, ref: 0.3205 + 0.0903, color: C.red },
      { label: "mixed", sub: "half best, half rest", f: { kind: "mixed", share: 0.25, budget: 1250 }, color: C.ink2 },
      { label: "lottery", sub: "random 25% × 5", f: { kind: "random", share: 0.25, units: 5 }, ref: 0.3205 + 0.3595, color: C.ink },
      { label: "equal", sub: "everyone × 1.25", f: { kind: "egalitarian", units: 1.25 }, color: C.green },
    ];
    for (let k = 0; k < plans.length; k++) {
      let s = 0;
      await batch(n, () => Object.assign({}, p, { funding: plans[k].f }), null, (w) => { s += T.stats(w).PT; });
      plans[k].v = s / n; $("#pgrants").style.width = `${((k + 1) / plans.length) * 100}%`;
    }
    btn.disabled = false;
    const def = isPaper(p);
    bars($("#c-grants"), plans.map((x) => ({ label: x.label, sub: x.sub, v: x.v, ref: def ? x.ref : null, color: x.color })));
    const [none, best, mixed, lottery, equal] = plans.map((x) => x.v);
    const gain = (v) => `${((v - none) * 100).toFixed(0)} points`;
    $("#grants-text").innerHTML = `
      <p>Without grants, ${pct(none)} of talented people get ahead. Rewarding the already successful adds only <span class="hl">${gain(best)}</span>. Most of that money lands on whoever happened to catch green balls early, talented or not.</p>
      <p>A lottery adds <strong>${gain(lottery)}</strong>; a mixed split, ${gain(mixed)}; and splitting it equally adds <span class="hl">${gain(equal)}</span>, with the same budget. Spreading money wide wins because talented people who were unlucky get a floor to stand on until their green ball comes.</p>
      <p class="mono">${n} worlds per rule, the same worlds for every rule, over ${p.steps / 2} years (1,250 units every five years). paper (100 runs, 40 years): no grants 32.05%; the best 25% got +9.03 points; a random 25% got +35.95; equal shares of 1 unit (a smaller budget) reached 69.48%.</p>`;
  });

  /* =========================== nav =========================== */
  const crumbs = $$(".bar .crumbs a, .bar .menu-list a"), menu = $(".bar .menu");
  $$(".bar .menu-list a").forEach((a) => a.addEventListener("click", () => menu.removeAttribute("open")));
  document.addEventListener("click", (e) => { if (menu.open && !menu.contains(e.target)) menu.removeAttribute("open"); });
  window.addEventListener("scroll", () => {
    let cur = null; $$("main section[id]").forEach((s) => { if (s.getBoundingClientRect().top < window.innerHeight * 0.4) cur = s.id; });
    crumbs.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === `#${cur}`));
  }, { passive: true });
})();
