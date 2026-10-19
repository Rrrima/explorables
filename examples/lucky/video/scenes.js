/* Lucky · the explainer's scenes. One function per narration segment, all drawn
   through the notebook style. The world in scenes 1, 2 and 5 is a real run of the
   Talent vs Luck model (sim.js, seed 84), replayed frame-accurately. */
(function () {
  "use strict";
  const { arcPts, ellipse } = window.LuckShapes;
  const T = window.TvL;

  // one real world, every step remembered so any frame can be drawn
  const world = T.create({ seed: 84 }), ev = [];
  for (let k = 0; k <= 80; k++) { ev.push(world.events.map((e) => [e.x, e.y])); if (k < 80) T.step(world); }
  const A = world.agents, st = T.stats(world);
  const top20At = (k) => { const c = A.map((a) => a.hist[k]).sort((x, y) => y - x), tot = c.reduce((s, v) => s + v, 0); return c.slice(0, 200).reduce((s, v) => s + v, 0) / tot; };
  const WX = 150, WY = 150, WS = 820, K = WS / 201;
  const wx = (x) => WX + x * K, wy = (y) => WY + y * K;
  const rOf = (c) => Math.max(1.3, Math.min(14, 3.2 + 1.35 * Math.log2(Math.max(c, 1e-6) / 10)));

  function drawWorld(x, o = {}) {
    const { S } = x, step = Math.max(0, Math.min(80, o.step || 0)), k0 = Math.floor(step), f = step - k0, k1 = Math.min(80, k0 + 1);
    S.line("ink", [[WX, WY], [WX + WS, WY], [WX + WS, WY + WS], [WX, WY + WS], [WX, WY]], 3, { a: 0.8 });
    A.forEach((a, i) => {
      const appear = o.reveal ? x.pop(x.seg(x.t, o.reveal + (a.x / 201) * 1.6, o.reveal + (a.x / 201) * 1.6 + 0.4)) : 1;
      if (appear <= 0) return;
      const r = (o.wealth ? rOf(a.hist[k0]) : 3.2) * appear, al = o.talent ? Math.max(0.12, Math.min(1, (a.T - 0.3) / 0.55)) : 1;
      S.mark("ink", wx(a.x + 0.5), wy(a.y + 0.5), r, al, i);
    });
    if (o.events) world.events.forEach((e, i) => {
      const p0 = ev[k0][i], p1 = ev[k1][i], wrap = Math.abs(p1[0] - p0[0]) > 100 || Math.abs(p1[1] - p0[1]) > 100;
      let px = wrap ? p0[0] : p0[0] + (p1[0] - p0[0]) * f, py = wrap ? p0[1] : p0[1] + (p1[1] - p0[1]) * f;
      const t0 = e.good ? o.greenAt : o.redAt;
      if (t0 != null) { const k = x.eOut(x.seg(x.t, t0 + (i % 40) * 0.012, t0 + (i % 40) * 0.012 + 0.9)); if (k <= 0) return; const ang = Math.atan2(py - 100, px - 100); px = px + Math.cos(ang) * 70 * (1 - k); py = py + Math.sin(ang) * 70 * (1 - k); }
      S.mark(e.good ? "good" : "bad", wx(px), wy(py), 5.2, 1, i);
    });
  }
  function coinStack(x, cx, base, value, label) {
    const { S } = x, n = Math.max(1, Math.min(10, Math.round(Math.log2(Math.max(value, 0.5) / 10) * 2 + 5)));
    for (let i = 0; i < n; i++) { const y = base - i * 26; S.fill("hl", ellipse(cx, y, 70, 18)); S.line("ink", ellipse(cx, y, 70, 18), 3.5); }
    S.text("ink", label ?? (value >= 10 ? Math.round(value) : value.toFixed(value < 1 ? 1 : 0)), cx, base + 70, { size: 56 });
  }
  function bell(x, x0, x1, base, h, m, sd, role, a = 1, k = 1) {
    const { S } = x, X = (v) => x0 + ((v - 0.2) / 0.8) * (x1 - x0), pts = [];
    for (let i = 0; i <= 80; i++) { const v = 0.2 + (i / 80) * 0.8, u = (v - m) / sd; pts.push([X(v), base - Math.exp(-u * u / 2) * h * k]); }
    S.fill(role, [...pts, [x1, base], [x0, base]], 0.22 * a); S.line(role === "muted" ? "ink" : role, pts, 4, { a });
    return X;
  }
  function axis(x, x0, x1, base) { const { S } = x; S.line("ink", [[x0, base], [x1, base]], 4); [0.2, 0.4, 0.6, 0.8, 1].forEach((v) => S.text("muted", v.toFixed(1), x0 + ((v - 0.2) / 0.8) * (x1 - x0), base + 44, { size: 30, font: "mono" })); S.text("muted", "talent →", x1, base + 84, { size: 28, font: "mono", align: "right" }); }

  const scenes = [
    // 1 · a thousand people, talent as darkness, everyone with 10
    (x) => {
      drawWorld(x, { reveal: x.s - 0.2, talent: x.t > x.word("talent") - 0.2 });
      x.kword("ink", "1,000 people", 1440, 300, x.word("thousand"), { size: 92 });
      x.kword("ink", "talent 0.6 ± 0.1", 1440, 460, x.word("talent"), { size: 64 });
      x.kword("muted", "darker = more talented", 1440, 520, x.word("talent") + 0.3, { size: 30, font: "mono" });
      if (x.t > x.word("ten")) { x.S.highlight(1220, 610, 440, 90, x.eOut(x.seg(x.t, x.word("ten") - 0.2, x.word("ten") + 0.4))); }
      x.kword("ink", "everyone starts with 10", 1440, 676, x.word("same"), { size: 56, font: "body" });
      x.hot(WX, WY, WS, WS, "1,000 people on a 201 × 201 world that wraps at the edges. Nobody ever moves.", "Why don't the people in the model move?");
    },
    // 2 · luck rolls in
    (x) => {
      const step = Math.max(0, (x.t - x.word("green") - 0.9) / 0.5);
      drawWorld(x, { events: true, step: Math.min(8, step), greenAt: x.word("green"), redAt: x.word("red") });
      x.kword("good", "lucky breaks", 1440, 400, x.word("lucky"), { size: 80 });
      x.kword("bad", "bad luck", 1440, 560, x.word("bad"), { size: 80 });
      x.kword("muted", "500 balls · each rolls 2 steps every six months", 1440, 660, x.word("months"), { size: 26, font: "mono" });
      if (x.t > x.word("green") + 0.6) x.hot(WX, WY, WS, WS, "250 lucky and 250 unlucky events, random-walking two patches every six months.", "How often does a person in the model meet a lucky event?");
    },
    // 3 · green: talent decides, money doubles
    (x) => {
      const { S } = x, cx = 620, cy = 560, tG = x.word("green"), tGrab = x.word("grab"), tD = x.word("doubles"), T0 = 0.7;
      const grown = x.eOut(x.seg(x.t, tD - 0.1, tD + 0.5));
      S.mark("ink", cx, cy, 90 * (1 + 0.414 * grown), 1, 7);
      const bk = x.eOut(x.seg(x.t, tG, tG + 1.0));
      if (x.t < tD) S.mark("good", x.lerp(80, cx - 150, bk), cy - Math.sin(bk * Math.PI) * 120, 46, 1, 8);
      // the talent gauge: an arc for talent, a needle that spins and lands
      const R = 190, a0 = -Math.PI / 2, gk = x.seg(x.t, tG + 0.6, tG + 1.2);
      if (gk > 0) {
        S.line("muted", arcPts(cx, cy, R, R, 0, Math.PI * 2, 60), 3, { a: 0.5 });
        S.line("good", arcPts(cx, cy, R, R, a0, a0 + T0 * Math.PI * 2 * gk, 40), 12);
        const spin = x.t < tGrab ? (x.t - tG) * 9 : 0, na = a0 + (x.t < tGrab ? spin : 0.42 * Math.PI * 2);
        S.line("ink", [[cx + Math.cos(na) * R * 0.75, cy + Math.sin(na) * R * 0.75], [cx + Math.cos(na) * R * 1.18, cy + Math.sin(na) * R * 1.18]], 9);
        x.kword("good", "talent 0.7", cx, cy + R + 80, tG + 0.6, { size: 48 });
      }
      x.kword("good", "grabbed", cx, cy - R - 50, tGrab, { size: 56 });
      x.kword("ink", "×2", cx + 220, cy - 120, tD, { size: 120 });
      coinStack(x, 1440, 720, x.t > tD + 0.3 ? 20 : 10);
      x.kword("muted", "money", 1440, 900, x.word("money"), { size: 30, font: "mono" });
      x.hot(cx - R, cy - R, R * 2, R * 2, "A lucky event doubles your capital only if a coin weighted by your talent comes up: with talent 0.7, seven times in ten.", "Why does talent only matter for lucky events?");
    },
    // 4 · red: everyone halves
    (x) => {
      const { S } = x, tR = x.word("red"), tH = x.word("half"), sh = x.eOut(x.seg(x.t, tH - 0.1, tH + 0.5));
      [[520, 0.92, "talent 0.92"], [1000, 0.41, "talent 0.41"]].forEach(([cx, T0, lab], j) => {
        S.mark("ink", cx, 520, 110 * (1 - 0.293 * sh), Math.max(0.25, (T0 - 0.3) / 0.6), 10 + j);
        const bk = x.eOut(x.seg(x.t, tR + j * 0.15, tR + j * 0.15 + 0.9));
        if (x.t < tH + 0.2) S.mark("bad", x.lerp(cx - 400, cx - 130, bk), 520 - Math.sin(bk * Math.PI) * 110, 42, 1, 12 + j);
        x.kword("ink", lab, cx, 740, x.s + 0.2 + j * 0.2, { size: 44, font: "body" });
      });
      x.kword("bad", "÷2", 760, 330, tH, { size: 120 });
      x.kword("ink", "talent doesn't help", 760, 880, x.word("help"), { size: 60 });
      coinStack(x, 1520, 720, x.t > tH + 0.3 ? 5 : 10);
      x.hot(400, 380, 740, 300, "An unlucky event halves your capital whatever your talent: an illness, a crash, a layoff.");
    },
    // 5 · forty years, then lopsided
    (x) => {
      const { S } = x, run = x.seg(x.t, x.s + 0.2, x.word("lopsided") + 0.4), step = run * 80;
      drawWorld(x, { events: true, wealth: true, step });
      S.text("ink", `year ${Math.round(step / 2)}`, 1440, 260, { size: 72 });
      const share = top20At(Math.floor(step)), bx = 1180, bw = 520, by = 520;
      S.line("ink", [[bx, by], [bx + bw, by], [bx + bw, by + 90], [bx, by + 90], [bx, by]], 4);
      S.fill("ink", [[bx, by], [bx + bw * share, by], [bx + bw * share, by + 90], [bx, by + 90]], 0.85);
      S.text("muted", "money held by the richest 20%", bx, by - 24, { size: 28, font: "mono", align: "left" });
      S.text("ink", `${Math.round(share * 100)}%`, bx + bw * share - 14, by + 64, { size: 52, align: "right", a: share > 0.3 ? 1 : 0 });
      x.kword("ink", "≈ 80%", 1440, 790, x.word("eighty"), { size: 110 });
      x.hot(bx, by, bw, 90, "In this run the richest fifth end with about four-fifths of all the capital: Pareto's 80/20, from a bell curve of talent.", "Why does the model end up with an 80/20 split?");
    },
    // 6 · the richest is barely above average
    (x) => {
      const x0 = 260, x1 = 1660, base = 840, k = x.eOut(x.seg(x.t, x.s - 0.2, x.s + 0.8));
      const X = bell(x, x0, x1, base, 520, 0.6, 0.1, "muted", 1, k); axis(x, x0, x1, base);
      x.kword("muted", "everyone's talent", X(0.42), base - 330, x.s + 0.4, { size: 30, font: "mono", align: "right" });
      const t6 = x.word("zero"), kk = x.pop(x.seg(x.t, t6, t6 + 0.5));
      if (kk > 0) {
        const px = X(0.61); x.S.line("good", [[px, base], [px, base - 470]], 6);
        x.S.mark("good", px, base - 500, 46 * kk, 1, 20);
        x.kword("good", "the richest: 0.61", px + 70, base - 560, t6 + 0.2, { size: 54, align: "left" });
        x.hot(px - 60, base - 560, 120, 560, "In the paper's example run, the richest person (2,560 units) had talent 0.61, barely above the 0.6 average.");
      }
      x.kword("ink", "not the most talented", 960, 170, x.word("usually"), { size: 72 });
    },
    // 7 · the most talented ends with less
    (x) => {
      const x0 = 260, x1 = 1660, base = 840, X = bell(x, x0, x1, base, 520, 0.6, 0.1, "muted"); axis(x, x0, x1, base);
      const px = X(0.89), tM = x.word("zero"), k = x.pop(x.seg(x.t, tM, tM + 0.5));
      if (k > 0) { x.S.line("accent", [[px, base], [px, base - 300]], 6); x.S.mark("accent", px, base - 330, 40 * k, 1, 21); x.kword("accent", "the most talented: 0.89", px, base - 400, tM + 0.2, { size: 50 }); }
      const tl = x.word("less"), v = x.t < tl ? 10 : x.lerp(10, 0.625, x.eOut(x.seg(x.t, tl, tl + 1)));
      coinStack(x, 430, 330, v, v >= 9.5 ? "10" : v.toFixed(1));
      x.kword("ink", "less than they started", 430, 490, tl, { size: 44, font: "body" });
      x.hot(px - 60, base - 420, 120, 420, "The paper's most talented agent (0.89) ended with 0.625 units, a sixteenth of where they started.", "Why did the most talented person end up poor?");
    },
    // 8 · ten thousand runs
    (x) => {
      const x0 = 260, x1 = 1660, base = 840, X = bell(x, x0, x1, base, 520, 0.6, 0.1, "muted"); axis(x, x0, x1, base);
      const tT = x.word("ten"), k = x.eOut(x.seg(x.t, tT, tT + 1.2));
      if (k > 0) { bell(x, x0, x1, base, 520, 0.667, 0.09, "good", 1, k); x.S.line("good", [[X(0.667), base], [X(0.667), base - 540 * k]], 4, { a: 0.7 }); }
      x.kword("good", "winners: 0.67", X(0.667) + 40, base - 560, x.word("averaged"), { size: 54, align: "left" });
      x.kword("muted", "everyone: 0.6", X(0.6) - 40, base - 560, x.word("averaged") + 0.2, { size: 40, align: "right" });
      x.kword("ink", "talent helps.", 700, 190, x.word("helps"), { size: 72 });
      x.kword("good", "luck decides.", 1220, 190, x.word("decides"), { size: 72 });
      if (k > 0.8) x.hot(X(0.667) - 160, base - 540, 320, 540, "Over 10,000 runs the richest agent's talent is 0.667 ± 0.09: above average, rarely exceptional.", "How often does the most talented person win?");
    },
    // 9 · rewarding success rewards luck
    (x) => {
      const { S } = x, people = [[420, 640, 18], [640, 600, 70], [880, 660, 12], [1120, 590, 95], [1360, 650, 22], [1560, 620, 50]];
      people.forEach(([px, py, r], i) => { S.mark("ink", px, py, r, 1, 30 + i); if (r > 40 && x.t > x.word("lucky") - 0.2) x.kword("good", "lucky", px, py - r - 30, x.word("lucky") + i * 0.05, { size: 36 }); });
      const tS = x.word("successful");
      for (let c = 0; c < 10; c++) {
        const tc = tS - 0.4 + c * 0.18, k = x.seg(x.t, tc, tc + 0.8); if (k <= 0 || k >= 1) continue;
        const target = people[c % 2 ? 3 : 1], sx = 960, sy = 170;
        const ex = x.lerp(sx, target[0], k), ey = x.lerp(sy, target[1] - target[2], k) - Math.sin(k * Math.PI) * 60;
        S.fill("hl", ellipse(ex, ey, 52, 15)); S.line("ink", ellipse(ex, ey, 52, 15), 3);
      }
      x.kword("ink", "reward success…", 960, 220, x.word("give"), { size: 72 });
      x.kword("good", "…and you reward luck", 960, 900, x.word("reward", 1), { size: 64 });
      x.hot(560, 520, 1080, 200, "Funding only the already-successful added under 20 points to the share of talented people who got ahead.", "What happens when you give grants to the most successful?");
    },
    // 10 · equal shares work better
    (x) => {
      const { S } = x, base = 840, bw = 260, mx = 0.9;
      [[660, 0.32, "no grants", "ink", x.s + 0.3], [1260, 0.69, "a small equal share", "good", x.word("doubled") - 0.4]].forEach(([cx, v, lab, role, t0]) => {
        const k = x.eOut(x.seg(x.t, t0, t0 + 0.9)), h = (v / mx) * 540 * k;
        if (k <= 0) return;
        S.fill(role, [[cx - bw / 2, base - h], [cx + bw / 2, base - h], [cx + bw / 2, base], [cx - bw / 2, base]], 0.85);
        S.text("ink", `${Math.round(v * 100 * k)}%`, cx, base - h - 30, { size: 80 });
        x.kword("ink", lab, cx, base + 70, t0, { size: 44, font: "body" });
        x.hot(cx - bw / 2, base - h, bw, h, `${Math.round(v * 100)}% of talented people end richer than they started (${lab}).`);
      });
      S.line("ink", [[400, base], [1520, base]], 4);
      x.kword("muted", "talented people who got ahead", 960, 110, x.s + 0.2, { size: 30, font: "mono" });
      x.kword("good", "more than double", 960, 190, x.word("doubled"), { size: 68 });
    },
    // 11 · talent × luck
    (x) => {
      const { S } = x, k = x.eOut(x.seg(x.t, x.word("green") - 0.8, x.word("green") + 0.4));
      S.mark("ink", 760, 560, 120, 1, 40);
      S.mark("good", x.lerp(1500, 940, k), 560 - Math.sin(k * Math.PI) * 140, 60, 1, 41);
      x.kword("ink", "talent is necessary", 960, 230, x.word("necessary"), { size: 76 });
      x.kword("ink", "it isn't enough", 960, 330, x.word("enough"), { size: 60, font: "body" });
      x.kword("good", "talent × luck", 960, 880, x.word("green") + 0.3, { size: 96 });
    },
  ];
  function endCard(x) {
    const { S } = x;
    S.text("ink", "Lucky", 960, 520, { size: 220 });
    S.text("ink", "a simulation you can run", 960, 600, { size: 44, font: "body" });
    S.text("muted", "Pluchino, Biondo & Rapisarda, “Talent vs Luck”, Advances in Complex Systems 21 (2018)", 960, 980, { size: 24, font: "mono" });
  }

  window.EXPLAINER = {
    title: "Lucky",
    segNames: ["A thousand people", "Luck rolls by", "Green: talent", "Red: no mercy", "Forty years", "Who's on top", "The most talented", "10,000 runs", "Rewards", "Equal shares", "Green balls"],
    poster: 36.5,
    playhead: '<svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8"/></svg>',
    ring(ctx, cx, cy, rx, ry, t) {
      // a pen loop and a highlighter swipe
      ctx.save(); ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(255,226,94,0.55)"; ctx.lineWidth = 16; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = "#2f5fb3"; ctx.lineWidth = 4; ctx.beginPath();
      for (let i = 0; i <= 60; i++) { const a = -0.4 + (i / 60) * Math.PI * 2.08, w = 1 + 0.02 * Math.sin(a * 5 + t); const px = cx + Math.cos(a) * rx * w, py = cy + Math.sin(a) * ry * w; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke(); ctx.restore();
    },
    async load() {
      const schedule = await (await fetch("schedule.json", { cache: "no-cache" })).json();
      const stage = window.ExplainerStage.Stage({ style: window.makeLuckStyle(document.createElement("canvas")), schedule, scenes, endCard });
      const answer = window.AnswerKit(window.makeLuckStyle(document.createElement("canvas")));
      return { stage, answer, schedule };
    },
  };
})();
