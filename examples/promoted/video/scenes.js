/* Promoted · the explainer's scenes, in crayon. One function per narration segment.
   Charts use numbers from the paper (Physica A 389, 2010): start 69.68%, Peter +
   best −10, Peter + worst +12. */
(function () {
  "use strict";
  const { stairs } = window.PeterShapes;
  const SIZES = [1, 5, 11, 21, 41, 81];
  // where each worker stands in the six-floor pyramid
  const pyramid = (() => { const out = [], top = 190, gap = 118; SIZES.forEach((n, li) => { const rows = li === 5 ? 2 : 1, per = Math.ceil(n / rows), sp = Math.min(30, 1300 / per); for (let i = 0; i < n; i++) { const r = Math.floor(i / per), c = i - r * per, inRow = Math.min(per, n - r * per); out.push({ li, x: 960 + (c - (inRow - 1) / 2) * sp + (r % 2 ? sp / 2 : 0), y: top + li * gap + r * 52, s: ((i * 37 + li * 11) % 10) / 10 * 0.8 + 0.15 }); } }); return out; })();
  const shadeAt = (seed, t) => ((Math.sin(seed * 12.9 + Math.floor(t * 9) * 78.2) * 43758.5) % 1 + 1) % 1;

  function chart(x, lines, o = {}) {
    const { S } = x, x0 = 380, x1 = 1540, y0 = 220, y1 = 860, lo = 55, hi = 88;
    const Y = (v) => y1 - ((v - lo) / (hi - lo)) * (y1 - y0), X = (f) => x0 + f * (x1 - x0);
    S.line("ink", [[x0, y0], [x0, y1], [x1, y1]], 5);
    [60, 70, 80].forEach((v) => S.text("muted", `${v}%`, x0 - 20, Y(v) + 10, { size: 30, font: "mono", align: "right" }));
    S.text("muted", "years →", x1, y1 + 50, { size: 28, font: "mono", align: "right" });
    S.text("muted", "efficiency", x0, y0 - 24, { size: 28, font: "mono", align: "left" });
    S.save(); S.alpha(S.alphaNow() * 0.6); S.line("ink", [[x0, Y(69.68)], [x1, Y(69.68)]], 2); S.restore();
    lines.forEach(({ to, k, role, label, a = 1 }) => {
      if (k <= 0) return;
      const pts = []; for (let i = 0; i <= 40 * k; i++) { const f = i / 40, v = 69.68 + (to - 69.68) * (1 - Math.exp(-f * 9)) + Math.sin(i * 1.7) * 0.5; pts.push([X(f), Y(v)]); }
      S.save(); S.alpha(S.alphaNow() * a); S.line(role, pts, 8); S.restore();
      if (k > 0.95 && label) x.kword(role, label, x1 + 20, Y(to) + 16, o.t0 ?? x.t, { size: 64, align: "left" });
    });
    return { X, Y };
  }

  const scenes = [
    // 1 · the joke
    (x) => {
      const { S } = x;
      x.kword("accent", "1969", 1460, 300, x.word("nineteen"), { size: 200 });
      const lines = ["“In a hierarchy,", "every employee tends", "to rise to his level", "of incompetence.”"];
      lines.forEach((l, i) => x.kword("ink", l, 200, 430 + i * 92, x.word("hierarchy") - 0.3 + i * 0.35, { size: 76, font: "body", align: "left" }));
      x.kword("muted", "— Laurence J. Peter & Raymond Hull, The Peter Principle", 200, 850, x.word("joke"), { size: 30, font: "mono", align: "left" });
      const k = x.eOut(x.seg(x.t, x.word("incompetence") - 0.4, x.word("incompetence") + 0.6));
      if (k > 0) { stairs(S, 1220, 940, 4, 110, 70, 5); S.person(1640, 660, 190 * k, 0.15, "slump", 1, "accent"); S.box(1560, 660, 70 * k); S.marks(1660, 450, 50, "sweat", k, "accent"); }
      x.hot(180, 360, 920, 420, "Laurence J. Peter and Raymond Hull, The Peter Principle (1969), written as satire of bureaucracy.", "Was the Peter Principle meant as a joke?");
    },
    // 2 · the company
    (x) => {
      const { S } = x, tH = x.word("hundred"), tF = x.word("floors");
      pyramid.forEach((p, i) => { const t0 = tH - 0.6 + (5 - p.li) * 0.25 + (i % 7) * 0.02, k = x.pop(x.seg(x.t, t0, t0 + 0.4)); if (k > 0) S.person(p.x, p.y, 64 * k, p.s); });
      SIZES.forEach((n, li) => { const k = x.seg(x.t, tF - 0.4 + (5 - li) * 0.05, tF + 0.2); if (k > 0) S.line("ink", [[260, 196 + li * 118 + (li === 5 ? 52 : 0)], [1660, 198 + li * 118 + (li === 5 ? 52 : 0)]], 2.5, { a: 0.5 * k }); });
      x.kword("accent", "160 people", 280, 210, tH, { size: 76, align: "left" });
      x.kword("accent", "6 floors", 1640, 210, tF, { size: 76, align: "right" });
      x.kword("muted", "three researchers in Catania, 2009", 960, 1010, x.word("researchers"), { size: 30, font: "mono" });
      x.hot(300, 120, 1320, 860, "81 people on the bottom floor, then 41, 21, 11, 5 and one boss: 160 in all.", "Why is the company shaped like a pyramid?");
    },
    // 3 · every year
    (x) => {
      const { S } = x, tF = x.word("fired"), tR = x.word("retires"), tD = x.word("desk");
      const row = [0.8, 0.12, 0.7, 0.9, 0.6, 0.75], top = 520, low = 900;
      S.line("ink", [[200, top + 6], [1720, top + 8]], 5); S.line("ink", [[200, low + 6], [1720, low + 8]], 5);
      S.text("muted", "floor 3", 200, top - 300, { size: 30, font: "mono", align: "left" }); S.text("muted", "floor 2", 200, low - 300, { size: 30, font: "mono", align: "left" });
      row.forEach((sh, i) => {
        const px = 360 + i * 240;
        if (i === 1) { const k = x.seg(x.t, tF, tF + 1.4); if (k < 1) S.person(px - k * 300, top, 260, sh, "walk", 1 - k, "ink", true); if (x.t > tF) { S.box(px + 20, top, 110); x.kword("accent", "fired", px, top - 300, tF, { size: 60 }); } }
        else if (i === 4) { const k = x.seg(x.t, tR, tR + 1.4); if (k < 1) S.person(px + k * 300, top, 260, sh, "walk", 1 - k); if (x.t > tR) x.kword("ink", "60", px + 40, top - 300, tR, { size: 70 }); }
        else S.person(px, top, 260, sh);
      });
      [0.4, 0.95, 0.3, 0.6, 0.85, 0.5].forEach((sh, i) => { const px = 360 + i * 240; if (i === 1 && x.t > tD) { const k = x.eOut(x.seg(x.t, tD, tD + 0.9)); S.person(px, x.lerp(low, top, k) - Math.sin(k * Math.PI) * 120, 260, sh, k > 0.1 && k < 0.9 ? "cheer" : "stand"); if (k > 0.2) S.vacancy(px, low, 260, 0.6 * k); } else S.person(px, low, 260, sh); });
      x.hot(240, 220, 280, 320, "Anyone whose competence drops below 4 out of 10 is fired.", "Why is the firing line at a competence of 4?");
    },
    // 4 · common sense: promote the best
    (x) => {
      const { S } = x, shades = [0.3, 0.55, 0.95, 0.45, 0.6], tB = x.word("best"), k = x.eOut(x.seg(x.t, tB, tB + 1));
      S.line("ink", [[300, 920], [1620, 922]], 5); S.line("ink", [[760, 560], [1160, 562]], 5);
      shades.forEach((sh, i) => { const px = 420 + i * 270; if (i === 2) S.person(x.lerp(px, 960, k), x.lerp(920, 560, k) - Math.sin(k * Math.PI) * 140, 250, sh, k > 0.05 && k < 0.95 ? "cheer" : "stand"); else S.person(px, 920, 250, sh); });
      x.kword("ink", "promote the best", 960, 140, x.word("promote"), { size: 92 });
      x.kword("ink", "…and they stay good", 960, 1010, x.word("next"), { size: 56, font: "body" });
      x.hot(780, 100, 360, 360, "Common-sense rule: a promoted worker keeps their competence, give or take one point.");
    },
    // 5 · a different job
    (x) => {
      const { S } = x, tS = x.word("salesperson"), tM = x.word("manager"), k = x.eOut(x.seg(x.t, tS + 0.2, tM)), drain = x.eOut(x.seg(x.t, tM - 0.2, tM + 0.8));
      S.line("ink", [[300, 900], [900, 902]], 5); S.line("ink", [[1020, 520], [1620, 522]], 5);
      x.kword("ink", "salesperson", 600, 1000, tS, { size: 60 });
      x.kword("ink", "sales manager", 1320, 620, tM - 0.3, { size: 60 });
      S.person(x.lerp(600, 1320, k), x.lerp(900, 520, k) - Math.sin(k * Math.PI) * 200, 320, 0.95 - 0.8 * drain, k > 0.05 && k < 0.95 ? "cheer" : drain > 0.6 ? "slump" : "stand");
      if (drain > 0.4) { x.kword("accent", "?", 1440, 200, tM + 0.3, { size: 140 }); x.kword("accent", "?", 1540, 260, tM + 0.5, { size: 100 }); }
      x.kword("muted", "9/10", 600, 520, tS + 0.2, { size: 44, font: "mono" });
      if (drain > 0.5) x.kword("accent", "2/10", 1320, 140, tM + 0.4, { size: 44, font: "mono" });
      x.hot(1100, 160, 440, 400, "A new job can need different skills: selling is not managing sellers.", "Is there evidence that top salespeople make worse managers?");
    },
    // 6 · Peter's rule
    (x) => {
      const { S } = x, tR = x.word("random"), tO = x.word("starts"), k = x.eOut(x.seg(x.t, x.s + 0.3, tO - 0.2));
      S.line("ink", [[400, 880], [900, 882]], 5); S.line("ink", [[1020, 520], [1520, 522]], 5);
      const settled = x.t > tR + 0.6, sh = !settled && x.t > tO - 0.2 ? shadeAt(7, x.t) : settled ? 0.35 : 0.9;
      S.person(x.lerp(650, 1270, k), x.lerp(880, 520, k) - Math.sin(k * Math.PI) * 200, 320, sh, k > 0.05 && k < 0.95 ? "cheer" : "stand");
      if (x.t > tO - 0.2 && !settled) S.marks(1300, 180, 70, "surprise", 1, "accent");
      x.kword("accent", "Peter's rule", 960, 170, x.word("peter's"), { size: 96 });
      x.kword("ink", "competence redrawn at random", 960, 1010, tR, { size: 56, font: "body" });
      x.hot(1100, 160, 340, 380, "Peter hypothesis: after a promotion, competence is drawn fresh from the same bell curve as a new hire's.");
    },
    // 7 · worse: −10 points
    (x) => {
      const k = x.seg(x.t, x.word("best") - 0.3, x.word("ten") + 0.2);
      chart(x, [{ to: 59.7, k, role: "accent", label: "−10 points" }], { t0: x.word("ten") });
      x.kword("accent", "Peter's rule + promote the best", 960, 140, x.word("best"), { size: 64 });
      if (k > 0.9) x.hot(1100, 600, 500, 300, "Under Peter's rule, always promoting the best cut efficiency by about 10 points (paper, 50 runs, 1,000 years).");
    },
    // 8 · stuck at your level
    (x) => {
      const { S } = x, n = 5, w = 220, h = 120, x0 = 300, y0 = 960;
      stairs(S, x0, y0, n, w, h, 7);
      const climb = x.seg(x.t, x.s + 0.2, x.word("landed") + 0.2) * (n - 1), i = Math.min(n - 1, Math.floor(climb)), f = climb - Math.floor(climb), last = climb >= n - 1.001;
      const sx = x0 + (i + 0.5) * w + (last ? 0 : f * w), sy = y0 - (i + 1) * h - (last ? 0 : Math.sin(f * Math.PI) * 60) - (last ? 0 : f * h);
      const pale = x.eOut(x.seg(x.t, x.word("bad") - 0.2, x.word("bad") + 0.6));
      S.person(sx, sy, 220, 0.95 - 0.85 * pale, last && pale > 0.5 ? "slump" : climb % 1 > 0.1 ? "walk" : "stand", 1, pale > 0.5 ? "accent" : "ink");
      if (pale > 0.5) { S.marks(sx + 20, sy - 250, 50, "sweat", 1, "accent"); x.kword("accent", "level of incompetence", 1160, 830, x.word("bad") + 0.3, { size: 68, align: "left" }); }
      x.kword("ink", "and there they stayed", 1160, 910, x.word("stayed"), { size: 48, font: "body", align: "left" });
      x.hot(sx - 90, sy - 250, 180, 260, "Promoted while good, stopped once bad: careers end on the floor where competence is lowest.", "How many floors does a typical career climb in the model?");
    },
    // 9 · promote the worst: +12
    (x) => {
      const k = x.seg(x.t, x.word("worst") - 0.3, x.word("twelve") + 0.2);
      chart(x, [{ to: 59.7, k: 1, role: "accent", a: 0.35 }, { to: 81.7, k, role: "ink", label: "+12 points" }], { t0: x.word("twelve") });
      x.kword("ink", "promote the worst", 960, 140, x.word("worst"), { size: 72 });
      if (k > 0.9) x.hot(1100, 200, 500, 300, "Under Peter's rule, promoting the least competent raised efficiency about 12 points: the strong stay in jobs they do well.", "Why would promoting the worst make a company better?");
    },
    // 10 · a coin flip
    (x) => {
      const { S } = x, tC = x.word("coin"), spin = x.t > tC ? Math.abs(Math.cos((x.t - tC) * 7)) : 1, rise = x.t > tC ? Math.sin(Math.min(1, (x.t - tC) / 1.4) * Math.PI) * 180 : 0;
      S.fill("ink", Array.from({ length: 36 }, (_, i) => { const a = (i / 36) * Math.PI * 2; return [960 + Math.cos(a) * 170 * Math.max(0.12, spin), 560 - rise + Math.sin(a) * 170]; }), 0.9);
      S.person(480, 900, 280, 0.95); S.person(1440, 900, 280, 0.12);
      x.kword("ink", "best", 480, 1010, x.word("best"), { size: 64 });
      x.kword("ink", "worst", 1440, 1010, x.word("worst"), { size: 64 });
      x.kword("accent", "nobody knows which rule is true", 960, 170, x.word("nobody"), { size: 64 });
      x.kword("muted", "best or worst with p ≈ 0.47: +1.5 points under both rules", 960, 260, x.word("random"), { size: 30, font: "mono" });
      x.hot(780, 360, 360, 400, "Alternating best and worst at random (p ≈ 0.47) gave the same +1.5 points whichever rule held.", "Why does randomness protect a company from the Peter principle?");
    },
    // 11 · fair or safe
    (x) => {
      const { S } = x;
      stairs(S, 560, 940, 4, 180, 110, 6);
      S.person(560 + 3.5 * 180, 940 - 4 * 110, 220, 0.15, "slump", 1, "accent");
      x.kword("ink", "fairest", 700, 220, x.word("fairest"), { size: 110 });
      x.kword("accent", "≠ safest", 1180, 220, x.word("riskiest"), { size: 110 });
    },
  ];
  function endCard(x) {
    const { S } = x;
    S.text("ink", "Promoted", 960, 520, { size: 230 });
    S.text("ink", "a company you can run", 960, 600, { size: 44, font: "body" });
    S.text("muted", "Pluchino, Rapisarda & Garofalo, “The Peter principle revisited”, Physica A 389 (2010)", 960, 980, { size: 24, font: "mono" });
  }

  window.EXPLAINER = {
    title: "Promoted",
    segNames: ["1969", "The company", "Every year", "Common sense", "A different job", "Peter's rule", "Worse", "Stuck", "Promote the worst", "A coin flip", "Fair or safe"],
    poster: 4,
    playhead: '<svg width="16" height="30" viewBox="0 0 16 30"><path d="M5 1h6v6H5zM3 9h10l1 10H2zM3 19h4v10H3zM9 19h4v10H9z"/></svg>',
    ring(ctx, cx, cy, rx, ry, t) {
      // a red crayon loop, drawn twice
      const K = window.Crayon, pts = [];
      for (let i = 0; i <= 48; i++) { const a = -0.5 + (i / 48) * Math.PI * 2.1, w = 1 + 0.03 * Math.sin(a * 4 + Math.floor(t * 8)); pts.push([cx + Math.cos(a) * rx * w, cy + Math.sin(a) * ry * w]); }
      K.line(ctx, pts, 6, "red", 0.9);
    },
    async load() {
      const schedule = await (await fetch("schedule.json", { cache: "no-cache" })).json();
      const stage = window.ExplainerStage.Stage({ style: window.makePeterStyle(document.createElement("canvas")), schedule, scenes, endCard });
      const answer = window.AnswerKit(window.makePeterStyle(document.createElement("canvas")));
      return { stage, answer, schedule };
    },
  };
})();
