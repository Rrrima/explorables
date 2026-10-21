/* Promoted: the page. A shared "tower" renderer animates each year of the model
   (people leave, get promoted up a floor, get hired at the bottom); the story and
   the lab both use it. The experiments below run many companies in the background. */
(function () {
  "use strict";
  const P = window.Peter, K = window.Crayon;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const DPR = K.DPR;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const INK = "#1a1816", MUTED = "#8c857c", RED = "#d6402a";
  const MONO = '"IBM Plex Mono", ui-monospace, monospace', DISPLAY = '"Caveat Brush", cursive';
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const shade = (c) => clamp((c - 1) / 9);
  const PAPER_DELTA = { "common best": 9, "common worst": -5, "common random": 2, "peter best": -10, "peter worst": 12, "peter random": 1 };
  const PAPER_START = 69.68;
  const NAMES = { common: "common sense", peter: "Peter hypothesis", best: "promote the best", worst: "promote the worst", random: "promote at random", alternate: "mix best and worst" };

  function fit(canvas) {
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.max(2, Math.round(r.width * DPR)); canvas.height = Math.max(2, Math.round(r.height * DPR));
    const ctx = canvas.getContext("2d"); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    return { ctx, w: r.width, h: r.height };
  }
  function text(g, s, x, y, { size = 12, color = INK, align = "left", base = "alphabetic", font = MONO, weight = 400 } = {}) {
    g.font = `${weight} ${size}px ${font}`; g.fillStyle = color; g.textAlign = align; g.textBaseline = base; g.fillText(s, x, y);
  }

  // nudge chart labels apart so none overlap: each {x, y, w, align}; returns them with adjusted y
  function dodge(labels, gap = 13, ymax = Infinity) {
    const span = (l) => (l.align === "right" ? [l.x - l.w, l.x] : [l.x, l.x + l.w]);
    const placed = [];
    labels.slice().sort((a, b) => a.y - b.y).forEach((l) => {
      const [a0, a1] = span(l);
      let moved = true;
      while (moved) { moved = false; for (const q of placed) { const [b0, b1] = span(q); if (a0 < b1 + 4 && b0 < a1 + 4 && Math.abs(l.y - q.y) < gap - 0.5) { l.y = q.y + gap; moved = true; } } }
      placed.push(l);
    });
    const over = Math.max(0, ...labels.map((l) => l.y - ymax));
    if (over) labels.forEach((l) => (l.y -= over));
    return labels;
  }
  const narrow = () => window.matchMedia("(max-width: 900px)").matches;

  /* =========================== the tower =========================== */
  // where every desk is: six floors, the bigger ones split into rows
  const ROWS = [1, 1, 1, 1, 2, 3];
  function tower(W, H, left = 96) {
    const top = 14, bottom = 10, gap = 12, nRows = ROWS.reduce((a, b) => a + b, 0);
    const rowH = (H - top - bottom - gap * 5) / nRows, h = Math.min(rowH * 0.86, 90);
    const cx = left + (W - left) / 2, usable = W - left - 14;
    const floors = [], slots = [];
    let y = top;
    P.SIZES.forEach((n, li) => {
      const rows = ROWS[li], per = Math.ceil(n / rows), sp = Math.min(h * 0.62, usable / per);
      const f = { top: y, bottom: y + rows * rowH, mid: y + (rows * rowH) / 2 };
      slots[li] = Array.from({ length: n }, (_, i) => {
        const row = Math.floor(i / per), inRow = Math.min(per, n - row * per), col = i - row * per;
        return { x: cx + (col - (inRow - 1) / 2) * sp + (row % 2 ? sp * 0.5 : 0), y: y + (row + 1) * rowH - 3 };
      });
      floors.push(f);
      y = f.bottom + gap;
    });
    return { W, H, h, left, floors, slots, cx };
  }
  function drawFloors(g, T, o = {}) {
    T.floors.forEach((f, li) => {
      const wgt = P.WEIGHTS[li], x0 = T.left - 6, x1 = T.W - 6;
      K.line(g, [[x0, f.bottom + 4], [x1, f.bottom + 5]], o.weighted ? 1 + wgt * 3.5 : 1.6, "ink", 0.55);
      if (o.labels !== false) {
        text(g, li === 0 ? "the boss" : `floor ${6 - li}`, 6, f.mid - 3, { size: 12, color: o.weighted ? INK : MUTED });
        text(g, o.sub ? o.sub(li) : `weight ${wgt.toFixed(1)}`, 6, f.mid + 13, { size: 11, color: o.weighted ? RED : MUTED, weight: o.weighted ? 600 : 400 });
      }
    });
  }

  // animates one year at a time: leavers walk off, promotions hop up a floor, hires rise in
  function Animator() {
    const disp = new Map();
    let ghosts = [], hops = [], hires = [];
    const self = {
      sync(w, T) { disp.clear(); ghosts = []; hops = []; hires = []; w.levels.forEach((lv, li) => lv.forEach((a, si) => { if (a) disp.set(a.id, { x: T.slots[li][si].x, y: T.slots[li][si].y, s: shade(a.c), a: 1 }); })); },
      begin(w, ev, T) {
        // finish anything still in flight
        for (const hp of hops) { const d = disp.get(hp.id); if (d) { d.x = hp.x1; d.y = hp.y1; d.s = hp.s1; } }
        for (const hr of hires) { const d = disp.get(hr.id); if (d) { d.y = hr.y1; d.a = 1; } }
        ghosts = ev.leave.map((l) => { const d = disp.get(l.a.id) || { x: T.slots[l.li][l.si].x, y: T.slots[l.li][l.si].y, s: shade(l.a.c) }; disp.delete(l.a.id); return { x: d.x, y: d.y, s: d.s, why: l.why, dir: d.x < T.cx ? -1 : 1 }; });
        hops = ev.promote.map((pr) => { const d = disp.get(pr.a.id) || { x: T.slots[pr.from[0]][pr.from[1]].x, y: T.slots[pr.from[0]][pr.from[1]].y }; const t = T.slots[pr.to[0]][pr.to[1]]; const o = { id: pr.a.id, x0: d.x, y0: d.y, x1: t.x, y1: t.y, s0: shade(pr.old), s1: shade(pr.now), changed: Math.abs(pr.now - pr.old) > 1.2 }; disp.set(pr.a.id, { x: d.x, y: d.y, s: o.s0, a: 1 }); return o; });
        hires = ev.hire.map((hr) => { const t = T.slots[T.slots.length - 1][hr.si]; disp.set(hr.a.id, { x: t.x, y: t.y + T.h * 0.6, s: shade(hr.a.c), a: 0 }); return { id: hr.a.id, y0: t.y + T.h * 0.6, y1: t.y }; });
      },
      // k: progress through the year, 0..1
      draw(g, w, T, k, o = {}) {
        const kl = clamp(k / 0.45), kp = ease(clamp((k - 0.25) / 0.6)), kh = ease(clamp((k - 0.65) / 0.35));
        for (const hp of hops) {
          const d = disp.get(hp.id); if (!d) continue;
          d.x = lerp(hp.x0, hp.x1, kp); d.y = lerp(hp.y0, hp.y1, kp) - Math.sin(kp * Math.PI) * T.h * 0.35;
          d.s = kp < 0.5 ? hp.s0 : hp.s1;
          if (kp < 1) K.vacancy(g, hp.x1, hp.y1, T.h, 0.35 * (1 - kp));
        }
        for (const hr of hires) { const d = disp.get(hr.id); if (d) { d.y = lerp(hr.y0, hr.y1, kh); d.a = kh; } }
        // this year's movers stand out; everyone else steps back
        const moving = o.focus ? new Set([...hops.map((h) => h.id), ...hires.map((h) => h.id)]) : null;
        if (o.focus && kp < 1) for (const hp of hops) {
          // a crayon arc from the old desk to the new one
          const mx = (hp.x0 + hp.x1) / 2, my = Math.min(hp.y0, hp.y1) - T.h * 1.1;
          const arcPts = Array.from({ length: 13 }, (_, i) => { const t = i / 12, u = 1 - t; return [u * u * hp.x0 + 2 * u * t * mx + t * t * hp.x1, u * u * (hp.y0 - T.h * 0.5) + 2 * u * t * my + t * t * (hp.y1 - T.h * 0.5)]; });
          K.line(g, arcPts, 1.6, o.showReshuffle && hp.changed ? "red" : "ink", 0.55 * (1 - kp * 0.6));
        }
        w.levels.forEach((lv, li) => lv.forEach((a, si) => {
          if (!a) { K.vacancy(g, T.slots[li][si].x, T.slots[li][si].y, T.h, 0.4); return; }
          const d = disp.get(a.id); if (!d) return;
          const dim = o.dim ? o.dim(a, li) : moving && !moving.has(a.id) ? 0.22 : 1;
          K.figure(g, d.x, d.y, T.h, d.s, kp > 0 && kp < 1 && moving && moving.has(a.id) && li < 5 ? "cheer" : "stand", d.a * dim);
        }));
        // promotions in the air: a little cheer; under Peter, a scribble where the skills reshuffle
        for (const hp of hops) {
          const d = disp.get(hp.id); if (!d || kp <= 0 || kp >= 1) continue;
          if (hp.changed && o.showReshuffle !== false && Math.abs(kp - 0.5) < 0.18) K.marks(g, d.x + T.h * 0.12, d.y - T.h * 0.9, T.h * 0.35, "surprise", 1, "red");
        }
        // leavers: the fired drop their box; everyone walks off the floor
        for (const gh of ghosts) {
          const a = 1 - kl;
          if (gh.why === "fired") { K.box(g, gh.x - gh.dir * T.h * 0.1, gh.y, T.h * 0.42, Math.min(1, (1 - k) * 1.6)); K.marks(g, gh.x + gh.dir * kl * T.h * 1.4, gh.y - T.h * 1.02, T.h * 0.35, "surprise", a); }
          if (a > 0) K.figure(g, gh.x + gh.dir * kl * T.h * (gh.why === "fired" ? 1.4 : 0.8), gh.y, T.h, gh.s, "walk", a, "ink", gh.dir < 0);
          if (gh.why === "retired" && a > 0) text(g, "60", gh.x + gh.dir * kl * T.h * 0.8, gh.y - T.h * 1.05, { size: Math.max(9, T.h * 0.2), align: "center", color: MUTED });
        }
      },
      pos: (id) => disp.get(id),
    };
    return self;
  }

  /* =========================== HERO: the staircase =========================== */
  (function hero() {
    const cv = $("#c-hero");
    let g;
    function draw(t) {
      if (!g) return;
      const { ctx, w: W, h: H } = g;
      ctx.clearRect(0, 0, W, H);
      const n = 5, sw = W * 0.17, sh = H * 0.13, x0 = W * 0.06, y0 = H * 0.94;
      const pts = [[x0, y0]];
      for (let i = 0; i < n; i++) { pts.push([x0 + i * sw, y0 - (i + 1) * sh]); pts.push([x0 + (i + 1) * sw, y0 - (i + 1) * sh]); }
      K.line(ctx, pts, 3.2);
      K.line(ctx, [[x0, y0], [x0 + n * sw, y0 + 2]], 2, "ink", 0.6);
      const fh = H * 0.24, bob = reduce ? 0 : Math.sin(t / 500) * 2;
      // four climbers, shading from very good to... the one at the top
      K.figure(ctx, x0 + sw * 0.55, y0 - sh, fh, 0.95, "walk");
      K.figure(ctx, x0 + sw * 1.55, y0 - sh * 2, fh, 0.9, "stand");
      K.figure(ctx, x0 + sw * 2.5, y0 - sh * 3 + bob, fh, 0.92, "cheer");
      K.marks(ctx, x0 + sw * 2.5 + fh * 0.12, y0 - sh * 3 - fh * 1.0, fh * 0.32, "surprise");
      K.figure(ctx, x0 + sw * 4.45, y0 - sh * 5, fh, 0.18, "slump", 1, "red");
      K.marks(ctx, x0 + sw * 4.45 + fh * 0.1, y0 - sh * 5 - fh * 1.0, fh * 0.3, "sweat", 1, "red");
      K.box(ctx, x0 + sw * 3.95, y0 - sh * 5, fh * 0.42);
      // in the empty space under the top landing (above the figure it ran off the canvas), sized to fit
      { const right = W - 4, room = right - (x0 + sw * 4) - 8;
        ctx.font = `400 13px ${MONO}`; const size = Math.max(10, Math.min(13, (13 * room) / ctx.measureText("incompetence").width));
        text(ctx, "level of", right, y0 - sh * 5 + size + 8, { size, align: "right", color: RED });
        text(ctx, "incompetence", right, y0 - sh * 5 + size * 2 + 11, { size, align: "right", color: RED }); }
      if (!reduce) requestAnimationFrame(draw);
    }
    const start = () => { g = fit(cv); requestAnimationFrame(draw); };
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(start);
    window.addEventListener("resize", () => { g = fit(cv); });
  })();

  /* =========================== 01 · THE RULES (scrolly) =========================== */
  (function story() {
    const cv = $("#c-story"), cap = $("#cap-story"), steps = $$("[data-scrolly='rules'] .step");
    const CAPS = ["one boss, then 5, 11, 21, 41 and 81", "competence from 1 to 10 · dashed: fired below 4", "each floor counts with a weight", "a year: the fired drop their box, the 60-year-olds retire", "a year: gaps filled from the top down, new hires at the bottom", "common sense: promoted people keep their competence", "Peter: each promotion redraws competence (red marks)", "efficiency = Σ competence × weight, as a share of the maximum"];
    let g, T, idx = -1, since = 0, last = 0, vis = false, w = null, anim = Animator(), acc = 0;
    const fly = new Map();                                    // id -> {x,y,tx,ty,s,ts}
    function reset(mech) { w = P.create({ seed: 5, mech, strategy: "best" }); anim.sync(w, T); acc = 0; }
    function histTargets() {
      const people = []; w.levels.forEach((lv) => lv.forEach((a) => a && people.push(a)));
      const bins = 18, cnt = new Array(bins).fill(0), base = T.H - 40, x0 = T.left, x1 = T.W - 14, bw = (x1 - x0) / bins, sp = T.h * 0.42, cols = Math.max(1, Math.floor(bw / (T.h * 0.36)));
      people.sort((a, b) => a.c - b.c).forEach((a) => { const b = clamp(Math.floor(((a.c - 1) / 9) * bins), 0, bins - 1), k = cnt[b]++; const f = fly.get(a.id); f.tx = x0 + (b + 0.5) * bw + ((k % cols) - (cols - 1) / 2) * T.h * 0.36; f.ty = base - Math.floor(k / cols) * sp; });
    }
    function setStep(i) {
      idx = i; since = 0;
      if (!T) return;
      if (i <= 2 || i === 7) {
        reset("common");
        w.levels.forEach((lv, li) => lv.forEach((a, si) => { const s = T.slots[li][si]; const f = fly.get(a.id) || { x: s.x, y: i === 0 ? -40 - Math.random() * 200 : s.y, s: 0.3 }; f.tx = s.x; f.ty = s.y; f.ts = i === 0 ? 0.3 : shade(a.c); f.d = i === 0 ? (5 - li) * 0.18 + Math.random() * 0.3 : Math.random() * 0.4; fly.set(a.id, f); }));
        if (i === 1) histTargets();
      } else reset(i === 6 ? "peter" : "common");
    }
    function frameAt(t) {
      if (!g || !vis) return;
      const dt = Math.min(0.05, (t - last) / 1000); last = t; since += dt;
      const { ctx, w: W, h: H } = g;
      ctx.clearRect(0, 0, W, H);
      if (idx <= 2 || idx === 7) {
        // when floors are too short for three label lines, the contribution replaces the weight line
        const compact = idx === 7 && T.floors[1].bottom - T.floors[1].top < 52;
        const contrib = (li) => { const lv = w.levels[li], sum = lv.reduce((s, a) => s + (a ? a.c : 0), 0); return `${Math.round((sum / (lv.length * 10)) * 100)}% × ${P.WEIGHTS[li].toFixed(1)}`; };
        if (idx !== 1) drawFloors(ctx, T, { weighted: idx >= 2, labels: idx >= 2, sub: compact ? contrib : null });
        const pk = 1 - Math.exp(-dt * 3.4);
        w.levels.forEach((lv) => lv.forEach((a) => {
          const f = fly.get(a.id); if (!f) return;
          if (since > (f.d || 0)) { f.x += (f.tx - f.x) * pk; f.y += (f.ty - f.y) * pk; f.s += (f.ts - f.s) * pk; }
          K.figure(ctx, f.x, f.y, T.h, f.s);
        }));
        if (idx === 1) {
          const x0 = T.left, x1 = T.W - 14, xf = x0 + ((4 - 1) / 9) * (x1 - x0), base = T.H - 40;
          ctx.setLineDash([5, 5]); K.line(ctx, [[xf, 30], [xf, base + 6]], 1.6, "red", 0.9); ctx.setLineDash([]);
          K.line(ctx, [[x0, base + 6], [x1, base + 7]], 1.6);
          [1, 4, 7, 10].forEach((v) => text(ctx, String(v), x0 + ((v - 1) / 9) * (x1 - x0), base + 24, { size: 12, align: "center", color: v === 4 ? RED : MUTED }));
          text(ctx, "fired", xf - 8, 46, { size: 12, align: "right", color: RED });
        }
        if (idx === 7) {
          // each floor's contribution, then the total
          const eff = P.efficiency(w), bx = T.W - 10;
          if (!compact) T.floors.forEach((f, li) => text(ctx, contrib(li), 6, f.mid + 29, { size: 11, color: RED, weight: 600 }));
          if (T.W < 560) {
            // small plate: the total sits in the empty corner beside the boss, the word goes in the caption
            text(ctx, `= ${eff.toFixed(0)}%`, T.W - 8, T.floors[0].bottom - 2, { size: Math.min(44, Math.max(30, T.floors[0].bottom - T.floors[0].top + 6)), font: DISPLAY, color: RED, align: "right" });
          } else {
            text(ctx, `= ${eff.toFixed(0)}%`, T.W - 10, 62, { size: 56, font: DISPLAY, color: RED, align: "right" });
            text(ctx, "efficiency", T.W - 12, 84, { size: 12, color: RED, align: "right" });
          }
        }
      } else {
        drawFloors(ctx, T, { weighted: false });
        acc += dt * 0.42;
        if (acc >= 1) { acc -= 1; anim.begin(w, P.step(w), T); if (w.t > 40) reset(idx === 6 ? "peter" : "common"); }
        anim.draw(ctx, w, T, acc, { showReshuffle: idx === 6, focus: true });
      }
      cap.textContent = CAPS[Math.max(0, idx)];
      if (!reduce) requestAnimationFrame(frameAt);
    }
    function onScroll() {
      const stacked = Math.abs(cv.getBoundingClientRect().left - steps[0].getBoundingClientRect().left) < 2;   // plate above the text (phones)
      const mid = window.innerHeight * (stacked ? 0.72 : 0.55);
      let i = 0; steps.forEach((s, j) => { if (s.getBoundingClientRect().top <= mid) i = j; });
      if (i !== idx) setStep(i);
      steps.forEach((s, j) => s.classList.toggle("on", j === idx));
    }
    function size() { g = fit(cv); T = tower(g.w, g.h, 92); const i = idx; idx = -1; setStep(Math.max(0, i)); }
    new IntersectionObserver((es) => { const v = es[0].isIntersecting; if (v && !vis) { vis = true; size(); last = performance.now(); requestAnimationFrame(frameAt); } vis = v; }, { rootMargin: "100px" }).observe(cv);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", () => { if (vis) size(); });
    onScroll();
  })();

  /* =========================== charts (crayon) =========================== */
  function axes(g, box, { xTicks = [], yTicks = [], xLabel = "", yLabel = "" } = {}) {
    K.line(g, [[box.x0, box.y0], [box.x0, box.y1], [box.x1, box.y1]], 1.6, "ink", 0.8);
    const cw = g.canvas.width / DPR;
    g.font = `400 11.5px ${MONO}`;
    xTicks.forEach(([v, l]) => { const hw = g.measureText(l).width / 2, x = clamp(box.X(v), hw + 2, cw - hw - 2); text(g, l, x, box.y1 + 18, { size: 11.5, align: "center", color: MUTED }); });
    yTicks.forEach(([v, l]) => text(g, l, box.x0 - 8, box.Y(v) + 4, { size: 11.5, align: "right", color: MUTED }));
    if (xLabel) text(g, xLabel, box.x1, box.y1 + 34, { size: 11.5, align: "right", color: MUTED });
    if (yLabel) text(g, yLabel, box.x0, box.y0 - 8, { size: 11.5, color: MUTED });
  }
  function box(W, H, xr, yr, pad = { l: 48, r: 16, t: 22, b: 40 }) {
    const b = { x0: pad.l, x1: W - pad.r, y0: pad.t, y1: H - pad.b };
    b.X = (v) => b.x0 + ((v - xr[0]) / (xr[1] - xr[0])) * (b.x1 - b.x0);
    b.Y = (v) => b.y1 - ((v - yr[0]) / (yr[1] - yr[0])) * (b.y1 - b.y0);
    return b;
  }
  const colOf = (mech) => (mech === "peter" ? "red" : "ink");
  const hexOf = (mech) => (mech === "peter" ? RED : INK);

  /* =========================== 02 · THE LAB =========================== */
  const SPEEDS = [0.5, 1, 2, 4, 8, 20, 60, 200];
  const lab = (function () {
    const cv = $("#c-tower"), tip = $("#tower-tip");
    let g, T, w, anim = Animator(), playing = false, acc = 0, last = 0, hist = [], hover = null;
    const params = { mech: "peter", strategy: "best", p: 0.5 };
    const seg = (id, key) => $$(`#${id} button`).forEach((b) => b.addEventListener("click", () => {
      params[key] = b.dataset.v; $$(`#${id} button`).forEach((x) => x.setAttribute("aria-checked", String(x === b)));
      $("#p-wrap").hidden = params.strategy !== "alternate";
      w.p.mech = params.mech; w.p.strategy = params.strategy; w.p.p = params.p;     // takes effect from next year
      drawCharts(); careers.refresh();
    }));
    seg("mech", "mech"); seg("strategy", "strategy");
    const slid = (el, out, f) => { const u = () => { out.textContent = f(el.value); el.style.setProperty("--p", `${((el.value - el.min) / (el.max - el.min)) * 100}%`); }; el.addEventListener("input", u); u(); };
    slid($("#p"), $("#o-p"), (v) => `${Math.round(v * 100)}%`);
    slid($("#speed"), $("#o-speed"), (v) => `${SPEEDS[v]} years/s`);
    $("#p").addEventListener("input", () => { params.p = +$("#p").value; if (w) w.p.p = params.p; });
    $("#p").addEventListener("change", () => careers.refresh());

    function fresh(seed) {
      w = P.create(Object.assign({}, params, { seed: seed || 1 + Math.floor(Math.random() * 1e6) }));
      hist = [P.efficiency(w)]; acc = 0;
      if (T) anim.sync(w, T);
      $("#seed").textContent = w.p.seed; update();
    }
    function update() {
      const e = P.efficiency(w);
      $("#yr").textContent = w.t;
      $("#s-eff").textContent = `${e.toFixed(0)}%`;
      const d = e - hist[0]; $("#s-delta").textContent = `${d >= 0 ? "+" : "−"}${Math.abs(d).toFixed(1)}`;
      $("#s-boss").textContent = w.levels[0][0] ? w.levels[0][0].c.toFixed(1) : "–";
      $("#s-fired").textContent = w.fired;
      drawCharts();
    }
    function frameAt(t) {
      const dt = Math.min(0.1, (t - last) / 1000); last = t;
      if (playing) {
        const sp = SPEEDS[+$("#speed").value];
        acc += dt * sp;
        let n = 0;
        while (acc >= 1 && n < 400) { acc -= 1; const ev = P.step(w); hist.push(P.efficiency(w)); if (sp <= 8 && T) anim.begin(w, ev, T); n++; }
        if (n) { if (sp > 8 && T) anim.sync(w, T); update(); }
        if (sp > 8) acc = Math.min(acc, 1);
      }
      if (g) {
        const { ctx, w: W, h: H } = g;
        ctx.clearRect(0, 0, W, H);
        drawFloors(ctx, T, { weighted: true });
        const sp = SPEEDS[+$("#speed").value];
        anim.draw(ctx, w, T, playing && sp <= 8 ? acc : 1, { showReshuffle: params.mech === "peter", dim: hover ? (a) => (a.id === hover.id ? 1 : 0.35) : null });
        if (hover) { const d = anim.pos(hover.id); if (d) K.line(ctx, [[d.x - T.h * 0.3, d.y + 6], [d.x + T.h * 0.3, d.y + 7]], 2.4, "red"); }
      }
      requestAnimationFrame(frameAt);
    }
    function drawCharts() {
      // efficiency over time
      { const { ctx, w: W, h: H } = fit($("#c-eff")); const n = Math.max(50, hist.length - 1);
        const lo = Math.min(55, ...hist) - 2, hi = Math.max(85, ...hist) + 2, b = box(W, H, [0, n], [lo, hi]);
        ctx.setLineDash([4, 5]); K.line(ctx, [[b.x0, b.Y(hist[0])], [b.x1, b.Y(hist[0])]], 1.2, "ink", 0.5); ctx.setLineDash([]);
        text(ctx, "start", b.x1, b.Y(hist[0]) - 6, { size: 11, align: "right", color: MUTED });
        const key = `${params.mech} ${params.strategy}`;
        if (PAPER_DELTA[key] != null) { const v = PAPER_START + PAPER_DELTA[key]; ctx.setLineDash([2, 4]); K.line(ctx, [[b.x0, b.Y(v)], [b.x1, b.Y(v)]], 1.6, colOf(params.mech), 0.7); ctx.setLineDash([]); text(ctx, `paper: settles near ${v.toFixed(0)}%`, b.x1, b.Y(v) - 6, { size: 11, align: "right", color: hexOf(params.mech) }); }
        const step = Math.max(1, Math.floor(hist.length / 400)), pts = [];
        for (let i = 0; i < hist.length; i += step) pts.push([b.X(i), b.Y(hist[i])]);
        pts.push([b.X(hist.length - 1), b.Y(hist[hist.length - 1])]);
        K.line(ctx, pts, 2.2, colOf(params.mech));
        axes(ctx, b, { xTicks: [0, n / 2, n].map((v) => [v, String(Math.round(v))]), yTicks: [60, 70, 80].filter((v) => v > lo && v < hi).map((v) => [v, `${v}%`]), xLabel: "years" });
      }
      // competence per floor
      { const { ctx, w: W, h: H } = fit($("#c-floors")); const means = P.levelMeans(w), b = box(W, H, [0, 10], [0, 6], { l: 86, r: 40, t: 12, b: 34 });
        const rh = (b.y1 - b.y0) / 6;
        means.forEach((m, li) => { const y = b.y0 + li * rh + rh * 0.25; K.fill(ctx, [[b.x0, y], [b.X(m), y], [b.X(m), y + rh * 0.5], [b.x0, y + rh * 0.5]], colOf(params.mech), 0.85); text(ctx, li === 0 ? "the boss" : `floor ${6 - li}`, b.x0 - 10, y + rh * 0.33, { size: 11.5, align: "right", color: MUTED }); text(ctx, m.toFixed(1), b.X(m) + 6, y + rh * 0.36, { size: 12, color: INK, weight: 600 }); });
        ctx.setLineDash([4, 5]); K.line(ctx, [[b.X(4), b.y0], [b.X(4), b.y1]], 1.2, "red", 0.6); ctx.setLineDash([]);
        K.line(ctx, [[b.x0, b.y1], [b.x1, b.y1]], 1.4, "ink", 0.7);
        [1, 4, 7, 10].forEach((v) => text(ctx, String(v), b.X(v), b.y1 + 16, { size: 11.5, align: "center", color: v === 4 ? RED : MUTED }));
      }
    }
    function pick(e) {
      const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      let best = null, bd = (e.pointerType === "mouse" ? T.h * 0.4 : Math.max(T.h * 0.6, 18)) ** 2;     // a fingertip is wider than a cursor
      w.levels.forEach((lv, li) => lv.forEach((a) => { if (!a) return; const d = anim.pos(a.id); if (!d) return; const dd = (d.x - x) ** 2 + (d.y - T.h * 0.45 - y) ** 2; if (dd < bd) { bd = dd; best = { id: a.id, a, li }; } }));
      hover = best;
      if (!best) { tip.classList.remove("on"); return; }
      const a = best.a, ups = a.path.length - 1;
      tip.innerHTML = `${best.li === 0 ? "the boss" : "floor " + (6 - best.li)} · competence ${a.c.toFixed(1)} · age ${a.age}<br>${ups ? `promoted ${ups} time${ups > 1 ? "s" : ""}; before: ${a.path.slice(1).map((q) => q[1].toFixed(1)).join(" → ")}` : "never promoted"}`;
      tip.classList.add("on");
      const tw = tip.offsetWidth, th = tip.offsetHeight;
      const left = narrow() ? clamp(x - tw / 2, 4, r.width - tw - 4) : Math.min(x + 14, r.width - 300);
      const top = narrow() && y + 16 + th > r.height ? Math.max(0, y - T.h * 1.2 - th) : y + 16;
      tip.style.left = `${left}px`; tip.style.top = `${top}px`;
    }
    // mouse: hover; touch and pen: tap someone to pin their card, tap empty floor (or elsewhere) to clear it
    cv.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") pick(e); });
    cv.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") pick(e); });
    cv.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") { hover = null; tip.classList.remove("on"); } });
    document.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse" && e.target !== cv && hover) { hover = null; tip.classList.remove("on"); } });
    $("#run").addEventListener("click", () => { playing = !playing; $("#run").textContent = playing ? "❚❚ Pause" : "▶ Run"; last = performance.now(); });
    $("#stepbtn").addEventListener("click", () => { playing = false; $("#run").textContent = "▶ Run"; const ev = P.step(w); hist.push(P.efficiency(w)); anim.begin(w, ev, T); acc = 0; update(); const t0 = performance.now(); const tick = (t) => { acc = clamp((t - t0) / 900); if (acc < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
    $("#reset").addEventListener("click", () => fresh());
    function size() { g = fit(cv); T = tower(g.w, g.h, 92); anim.sync(w, T); drawCharts(); }
    fresh(12);
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { size(); last = performance.now(); requestAnimationFrame(frameAt); });
    window.addEventListener("resize", size);
    return { params };
  })();

  /* =========================== 03 · CAREERS =========================== */
  const careers = (function () {
    const cv = $("#c-careers");
    let pending = 0, seen = false;
    function compute() {
      const p = lab.params, groups = {};
      for (const seed of [7, 8, 9]) { const { w } = P.run(Object.assign({}, p, { seed }), 1000, 1000); for (const c of w.careers) (groups[c.length] = groups[c.length] || []).push(c); }
      const lines = Object.keys(groups).map(Number).filter((n) => n >= 3 && groups[n].length >= 15).sort((a, b) => a - b).map((n) => ({ n, count: groups[n].length, m: Array.from({ length: n }, (_, i) => groups[n].reduce((s, c) => s + c[i], 0) / groups[n].length) }));
      const { ctx, w: W, h: H } = fit(cv);
      const b = box(W, H, [-0.3, 5.3], [3, 10], { l: 48, r: 70, t: 22, b: 40 });
      ctx.font = `400 11px ${MONO}`;
      const ends = [];
      lines.forEach((L, k) => {
        const a = 0.35 + 0.65 * (k / Math.max(1, lines.length - 1));
        const pts = L.m.map((v, i) => [b.X(i), b.Y(v)]);
        K.line(ctx, pts, 2.2, colOf(p.mech), a);
        pts.forEach(([x, y], i) => { K.fill(ctx, [[x - 4, y - 4], [x + 4, y - 4], [x + 4, y + 4], [x - 4, y + 4]], colOf(p.mech), a); });
        const [lx, ly] = pts[pts.length - 1], s = `${L.n} floors`;
        ends.push({ s, x: lx + 8, y: ly + 4, w: ctx.measureText(s).width });
      });
      dodge(ends, 14, b.y1 - 4).forEach((l) => text(ctx, l.s, l.x, l.y, { size: 11, color: hexOf(p.mech) }));
      ctx.setLineDash([4, 5]); K.line(ctx, [[b.x0, b.Y(4)], [b.x1, b.Y(4)]], 1.2, "red", 0.6); ctx.setLineDash([]);
      text(ctx, "fired below 4", b.x1, b.Y(4) + 14, { size: 11, align: "right", color: RED });
      axes(ctx, b, { xTicks: [0, 1, 2, 3, 4, 5].map((i) => [i, i === 0 ? "bottom" : i === 5 ? "boss" : `+${i}`]), yTicks: [4, 6, 8, 10].map((v) => [v, String(v)]), xLabel: "floors climbed", yLabel: "competence" });
      // what it means
      const drops = lines.map((L) => L.m[L.n - 1] - L.m[L.n - 2]), drop = drops.reduce((a, b) => a + b, 0) / Math.max(1, drops.length);
      const before = lines.length ? lines.map((L) => L.m.slice(0, -1).reduce((a, b) => a + b, 0) / (L.n - 1)).reduce((a, b) => a + b, 0) / lines.length : 0;
      const after = lines.length ? lines.map((L) => L.m[L.n - 1]).reduce((a, b) => a + b, 0) / lines.length : 0;
      let msg;
      if (drop < -1.2) msg = `<p>This is the Peter principle, measured. People who climbed were good at every job on the way up, about <span class="hl">${before.toFixed(1)}</span> on average. On the last floor they reached, the one they never left, they score <span class="hl">${after.toFixed(1)}</span>. They kept getting promoted <em>because</em> they were good, until they landed somewhere they weren’t.</p>`;
      else if (drop > 1.2) msg = `<p>The mirror image. Promoting the weakest under Peter’s rule means people climb while they’re bad and stop when they finally land a job that suits them: about <span class="hl">${before.toFixed(1)}</span> on the way up, <span class="hl">${after.toFixed(1)}</span> on the floor where they stay. Everyone ends at their level of <em>competence</em>.</p>`;
      else msg = `<p>No cliff here: careers stay about as good on the last floor (${after.toFixed(1)}) as on the way up (${before.toFixed(1)}). ${p.mech === "common" ? "Under common sense, skills travel with you, so there is no level of incompetence to find." : "Random promotion doesn’t select on competence, so the new floor is a fresh draw for everyone, good or bad."}</p>`;
      $("#careers-text").innerHTML = `${msg}<p class="mono">${NAMES[p.mech]}, ${NAMES[p.strategy]} · three companies, 1,000 years each · each line averages everyone who climbed that many floors from the bottom, then left.</p><p class="mono">The paper’s Fig. 4 shows the same: the cliff appears only with the Peter hypothesis and promoting the best.</p>`;
    }
    function refresh() { if (!seen) return; clearTimeout(pending); pending = setTimeout(compute, 120); }
    new IntersectionObserver((es) => { if (es[0].isIntersecting && !seen) { seen = true; compute(); } }, { rootMargin: "200px" }).observe(cv);
    window.addEventListener("resize", refresh);
    return { refresh };
  })();

  /* =========================== 04 · SIX COMPANIES =========================== */
  const sleep = () => new Promise((r) => setTimeout(r));
  let six = null;
  function drawSix() {
    const { ctx, w: W, h: H } = fit($("#c-six"));
    const small = W < 520;
    const b = box(W, H, [0, 1000], [55, 88], small ? { l: 40, r: 112, t: 20, b: 40 } : { l: 48, r: 150, t: 20, b: 40 });
    const ends = [];
    ctx.setLineDash([4, 5]); K.line(ctx, [[b.x0, b.Y(six ? six.start : 70)], [b.x1, b.Y(six ? six.start : 70)]], 1.2, "ink", 0.5); ctx.setLineDash([]);
    if (six) six.rows.forEach((r) => {
      if (!r.n) return;
      const pts = r.sum.map((v, i) => [b.X(i * 10), b.Y(v / r.n)]);
      ctx.save(); if (r.strategy === "random") ctx.setLineDash([2, 5]); else if (r.strategy === "worst") ctx.setLineDash([9, 5]);
      K.line(ctx, pts, 2.4, colOf(r.mech)); ctx.restore();
      const end = r.sum.slice(60).reduce((a, b) => a + b, 0) / r.sum.slice(60).length / r.n;
      r.end = end;
      ends.push({ s: `${r.mech === "peter" ? "Peter" : "common"} · ${r.strategy}`, x: b.x1 + 8, y: b.Y(end) + 4, w: 1, mech: r.mech });
    });
    dodge(ends, 14, H - 4).forEach((l) => text(ctx, l.s, l.x, l.y, { size: small ? 11 : 11.5, color: hexOf(l.mech), weight: 600 }));
    axes(ctx, b, { xTicks: (small ? [0, 500, 1000] : [0, 250, 500, 750, 1000]).map((v) => [v, String(v)]), yTicks: [60, 70, 80].map((v) => [v, `${v}%`]), xLabel: "years" });
  }
  $("#runsix").addEventListener("click", async (e) => {
    const btn = e.currentTarget; btn.disabled = true;
    const R = 20, combos = [];
    for (const mech of ["common", "peter"]) for (const strategy of ["best", "worst", "random"]) combos.push({ mech, strategy, sum: new Array(101).fill(0), n: 0 });
    let start = 0;
    for (let s = 1; s <= R; s++) start += P.efficiency(P.create({ seed: 100 + s })) / R;
    six = { rows: combos, start };
    for (let s = 1; s <= R; s++) {
      for (const c of combos) { const { series } = P.run({ mech: c.mech, strategy: c.strategy, seed: 100 + s }, 1000, 10); series.forEach((v, i) => (c.sum[i] += v)); c.n++; }
      $("#p-six").style.width = `${(s / R) * 100}%`; drawSix(); await sleep();
    }
    btn.disabled = false; btn.textContent = "Run them again";
    const row = (c) => { const d = c.end - start, pd = PAPER_DELTA[`${c.mech} ${c.strategy}`]; return `<tr><td>${c.mech === "peter" ? "Peter" : "Common sense"} · ${c.strategy}</td><td>${d >= 0 ? "+" : "−"}${Math.abs(d).toFixed(1)}</td><td>${pd > 0 ? "+" : "−"}${Math.abs(pd)}</td></tr>`; };
    const best = combos.find((c) => c.mech === "peter" && c.strategy === "best"), worst = combos.find((c) => c.mech === "peter" && c.strategy === "worst"), cbest = combos.find((c) => c.mech === "common" && c.strategy === "best");
    $("#six-text").innerHTML = `
      <p>Under common sense, promoting the best works: efficiency climbs to about <span class="hl">${cbest.end.toFixed(0)}%</span>. Under Peter’s rule the same policy drags the company down to <span class="hl">${best.end.toFixed(0)}%</span>, every good worker lifted out of the job they were good at.</p>
      <p>And under Peter’s rule the absurd policy wins: promoting the <em>worst</em> settles at ${worst.end.toFixed(0)}%. The weakest leave jobs they’re bad at; the strong stay put.</p>
      <table class="cmp"><tr><th>company</th><th>change here</th><th>paper</th></tr>${combos.map(row).join("")}</table>
      <p class="mono">Points of efficiency gained or lost, averaged over the last 400 years and ${R} companies each (paper: 50). Solid: promote the best · long dashes: the worst · dots: random. Black: common sense · red: Peter.</p>`;
  });

  /* =========================== 05 · FLIP A COIN =========================== */
  $("#runcoin").addEventListener("click", async (e) => {
    const btn = e.currentTarget; btn.disabled = true;
    const ps = Array.from({ length: 11 }, (_, i) => i / 10), R = 8, res = { common: [], peter: [] };
    for (let i = 0; i < ps.length; i++) {
      for (const mech of ["common", "peter"]) { let s = 0; for (let r = 1; r <= R; r++) { const { series } = P.run({ mech, strategy: "alternate", p: ps[i], seed: 200 + r }, 1000, 10); s += series.slice(60).reduce((a, b) => a + b, 0) / series.slice(60).length; } res[mech].push(s / R); }
      $("#p-coin").style.width = `${((i + 1) / ps.length) * 100}%`; await sleep();
      draw(i + 1);
    }
    btn.disabled = false; btn.textContent = "Sweep again";
    // where the two theories give the same result
    let cross = null;
    for (let i = 0; i < ps.length - 1; i++) { const d0 = res.common[i] - res.peter[i], d1 = res.common[i + 1] - res.peter[i + 1]; if (d0 <= 0 && d1 >= 0 || d0 >= 0 && d1 <= 0) { const t = d0 / (d0 - d1); cross = { p: ps[i] + t * 0.1, e: res.common[i] + t * (res.common[i + 1] - res.common[i]) }; break; } }
    draw(ps.length, cross);
    $("#coin-text").innerHTML = `
      <p>At p = 0 (always the worst) and p = 1 (always the best), the two theories disagree by almost twenty points: a manager who guesses wrong pays dearly. ${cross ? `The lines cross near <span class="hl">p = ${cross.p.toFixed(2)}</span>, at about <span class="hl">${cross.e.toFixed(0)}%</span>: promote the best or the worst on a coin flip, and you get the same result whichever theory is true.` : ""}</p>
      <p>That is the paper’s headline: if you don’t know how competence travels, randomness (a coin between best and worst, or simply a random pick) is the safe policy. It never wins big, but it never loses.</p>
      <p class="mono">Paper (Fig. 3): crossing at p = 0.47, efficiency about 71%, a gain of +1.5 points in both worlds. Here: ${R} companies per point, 1,000 years each, settled efficiency averaged over the last 400.</p>`;
    function draw(n, cr) {
      const { ctx, w: W, h: H } = fit($("#c-coin"));
      const b = box(W, H, [0, 1], [55, 88]);
      ["common", "peter"].forEach((m) => {
        const pts = res[m].slice(0, n).map((v, i) => [b.X(ps[i]), b.Y(v)]);
        if (pts.length > 1) K.line(ctx, pts, 2.4, colOf(m));
        pts.forEach(([x, y]) => K.fill(ctx, [[x - 4, y - 4], [x + 4, y - 4], [x + 4, y + 4], [x - 4, y + 4]], colOf(m)));
        if (pts.length) text(ctx, m === "peter" ? "Peter hypothesis" : "common sense", pts[pts.length - 1][0] - 6, pts[pts.length - 1][1] + (m === "peter" ? 18 : -10), { size: 11.5, align: "right", color: hexOf(m), weight: 600 });
      });
      if (cr) { K.line(ctx, [[b.X(cr.p), b.Y(cr.e) - 14], [b.X(cr.p), b.y1]], 1.4, "ink", 0.6); text(ctx, `p ≈ ${cr.p.toFixed(2)}`, b.X(cr.p), b.Y(cr.e) - 20, { size: 12, align: "center", weight: 600 }); }
      axes(ctx, b, { xTicks: [[0, "always worst"], [0.5, "0.5"], [1, "always best"]], yTicks: [60, 70, 80].map((v) => [v, `${v}%`]), xLabel: "p" });
    }
  });

  function coinAxes() {
    if ($("#runcoin").disabled || $("#coin-text").innerHTML.trim()) return;
    const { ctx, w: W, h: H } = fit($("#c-coin"));
    const b = box(W, H, [0, 1], [55, 88]);
    ctx.setLineDash([4, 5]); K.line(ctx, [[b.x0, b.Y(70)], [b.x1, b.Y(70)]], 1.2, "ink", 0.5); ctx.setLineDash([]);
    axes(ctx, b, { xTicks: [[0, "always worst"], [0.5, "0.5"], [1, "always best"]], yTicks: [60, 70, 80].map((v) => [v, `${v}%`]), xLabel: "p" });
  }
  requestAnimationFrame(coinAxes);
  window.addEventListener("resize", () => { coinAxes(); drawSix(); });

  /* =========================== nav =========================== */
  const bar = $(".bar"), menu = $(".bar .menu-btn");
  const setMenu = (open) => { bar.classList.toggle("open", open); menu.setAttribute("aria-expanded", String(open)); };
  menu.addEventListener("click", () => setMenu(!bar.classList.contains("open")));
  $$(".bar .crumbs a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("click", (e) => { if (!bar.contains(e.target)) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && bar.classList.contains("open")) { setMenu(false); menu.focus(); } });
  const crumbs = $$(".bar .crumbs a");
  window.addEventListener("scroll", () => {
    let cur = null; $$("main section[id]").forEach((s) => { if (s.getBoundingClientRect().top < window.innerHeight * 0.4) cur = s.id; });
    crumbs.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === `#${cur}`));
  }, { passive: true });
  requestAnimationFrame(drawSix);
})();
