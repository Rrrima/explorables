/* Scenes: one drawing per stage. Each registers with Essay.makeStage and reads
   scroll progress from its scrolly. The vocabulary is the engine's: a thin grey
   pen, one blue wash, small people, translucent solids. */
(function () {
  "use strict";
  const E = window.Essay, W = window.Wash, D = window.DATA, C = W.C;
  const { clamp, seg, easeOut, easeInOut, smooth, lerp, spline, ellipse } = W;
  const $ = E.$;

  /* ---------- shared motifs ---------- */
  // the reference's cube, traced, relative to the figure's hip origin (330, 540)
  const CUBE = {
    top: [[205, 30], [395, 22], [525, 172], [328, 192], [140, 215]],
    left: [[140, 215], [328, 192], [335, 340], [231, 371]],
    right: [[328, 192], [525, 172], [430, 347], [335, 345]]
  };
  const rel = (pts, x, y, s) => pts.map(([px, py]) => [x + (px - 330) * s, y + (py - 540) * s]);
  // cube over the figure whose hips are at (x, y) at scale s. k: 0..1 reveal, a: strength
  function cubeOnHead(S, x, y, s, o = {}) {
    const a = o.a == null ? 1 : o.a, k = o.k == null ? 1 : o.k, seed = o.seed || 0;
    const dx = o.dx || 0, dy = o.dy || 0;
    const faces = [["top", 0.3, { bloom: 0.85, blooms: 2, bloomSize: 1.5, pool: 0.8, grain: 0.7 }], ["left", 0.86, { bloom: 0.35, blooms: 3, pool: 1.2, grain: 0.85 }], ["right", 0.66, { bloom: 0.4, blooms: 3, pool: 1.1, grain: 0.8 }]];
    faces.forEach(([f, fa, opt], i) => {
      const fk = clamp(k * 3 - i);
      if (fk <= 0) return;
      S.wash(rel(CUBE[f], x + dx, y + dy, s), C.blue, fa * a * fk, seed + i + 1, opt);
    });
  }
  // a small person sitting on the ground with a cube
  function sitter(S, x, y, s, o = {}) {
    S.figure("sit", x, y, s, o);
    cubeOnHead(S, x, y, s, o);
  }
  // a stack of sheets drawn as a slab pile; h = number of sheets
  function stack(S, x, y, w, n, o = {}) {
    const k = o.k == null ? 1 : o.k, a = o.a == null ? 0.7 : o.a;
    const count = Math.max(0, Math.round(n * k));
    const th = o.th || 5;
    for (let i = 0; i < count; i++) {
      const yy = y - i * th, jx = Math.sin(i * 1.7 + (o.seed || 0)) * 2.2;
      const poly = [[x - w / 2 + jx, yy], [x + w / 2 + jx, yy - 4], [x + w / 2 + jx + w * 0.22, yy - 12], [x - w / 2 + jx + w * 0.22, yy - 8]];
      S.wash(poly, C.blue, a * (0.5 + 0.5 * ((i * 7) % 3) / 2), (o.seed || 0) * 9 + i, { bloom: 0.3, blooms: 1, pool: 0.9, grain: 0.5, edge: 1 });
      S.line([poly[0], poly[1]], { w: 0.8, a: 0.5, seed: i + 30 });
    }
  }
  // a hand-drawn tick label with a leader
  function callout(S, x, y, tx, ty, text, o = {}) {
    S.leader(x, y, tx - (o.align === "right" ? -6 : 6), ty + 4, o.a == null ? 0.45 : o.a, o.seed || 0);
    S.label(text, tx, ty + 4, { size: o.size || 13, align: o.align || "left", a: o.a, width: o.width });
  }
  function big(S, text, x, y, o = {}) { S.label(text, x, y, Object.assign({ size: 42, font: "display" }, o)); }
  function fadeIn(S, k, fn) { if (k <= 0) return; S.save(); S.mul(easeOut(k)); fn(); S.restore(); }

  /* ================= HERO ================= */
  (function hero() {
    const cv = $("#cv-hero"); if (!cv) return;
    const VW = 900, VH = 760;
    const st = E.makeStage(cv, VW, VH, (S, st) => {
      const t = st.time;
      const drift = E.reduceMotion ? 0 : Math.sin(t * 0.00035) * 3;
      const hv = st.hv("cube"), hh = st.hv("head");
      const x = 420, y = 690, s = 1.3;
      S.figure("sit", x, y, s, {});
      // the cube settles: a slow 3-unit drift and a breath in its tint
      const breath = E.reduceMotion ? 1 : 1 + 0.04 * Math.sin(t * 0.0006);
      cubeOnHead(S, x, y, s, { a: (0.94 + 0.12 * hv) * breath, dx: drift, dy: -drift * 0.4 + hv * -6 });
      // sparkles on the hoverable parts
      S.sparkle(x + 150 * s, y - 330 * s, 9, 0.75 + 0.25 * hv, t);
      S.sparkle(x - 52 * s, y - 300 * s, 7, 0.6 + 0.4 * hh, t);
      if (hh > 0.01) fadeIn(S, hh, () => { S.ring(x - 4 * s, y - 248 * s, 56 * s, 0.6); });
    }, {
      alive: true, tip: $("#tip-hero"), alignX: 0.5,
      spots: () => [
        { key: "cube", x: 420 + 0 * 1.3, y: 690 - 350 * 1.3, r: 230, tip: "The translucent blue solid is the machine's thought: fluent, finished, handed over whole. Where it covers the person, she is thinking inside it.", src: "C6", href: "c4" },
        { key: "head", x: 420 - 4, y: 690 - 248 * 1.3, r: 70, tip: "Her head is visible inside the cube, tinted blue. The ChatGPT writers in the MIT study could not quote their own essays minutes later: none of eighteen.", src: "C1", href: "c1" }
      ]
    });
    st.invalidate();
  })();

  window.Scenes = { cubeOnHead, sitter, stack, callout, big, fadeIn, rel, CUBE };
})();

/* ================= I. THE PROCESSION ================= */
(function worry() {
  const E = window.Essay, W = window.Wash, D = window.DATA, C = W.C, M = window.Scenes;
  const { clamp, seg, easeOut, easeInOut, lerp, spline, ellipse } = W;
  const $ = E.$;
  const cv = $("#cv-worry"); if (!cv) return;
  const VW = 1000, VH = 840;
  // the path: along the top, round the bend, back along the bottom
  const PATH = spline([[40, 290], [300, 286], [600, 292], [860, 288], [950, 370], [962, 500], [900, 620], [600, 628], [300, 622], [40, 626]], 14);
  const L = [0]; for (let i = 1; i < PATH.length; i++) L.push(L[i - 1] + Math.hypot(PATH[i][0] - PATH[i - 1][0], PATH[i][1] - PATH[i - 1][1]));
  const total = L[L.length - 1];
  const at = (u) => { const d = u * total; let i = 1; while (i < L.length - 1 && L[i] < d) i++; const f = (d - L[i - 1]) / (L[i] - L[i - 1] || 1); return [lerp(PATH[i - 1][0], PATH[i][0], f), lerp(PATH[i - 1][1], PATH[i][1], f)]; };
  // the eleven events at positions along the path
  const U = [0.035, 0.125, 0.205, 0.285, 0.365, 0.445, 0.6, 0.68, 0.76, 0.845, 0.94];
  const stepOf = [0, 1, 1, 1, 2, 2, 3, 3, 3, 3, 4];
  const FS = 0.42;
  function object(S, kind, x, y, k, seed) {
    // the era's memory object, held over the head
    S.save(); S.translate(x, y); S.mul(k);
    const sc = 1;
    if (kind === "scroll") { S.wash([[-26, -8], [26, -8], [26, 8], [-26, 8]], C.blue, 0.45, seed, { bloom: 0.3 }); S.line(ellipse(-26, 0, 5, 8, 0, 6.3, 14), { w: 0.9 }); S.line(ellipse(26, 0, 5, 8, 0, 6.3, 14), { w: 0.9 }); S.line([[-26, -8], [26, -8]], { w: 0.9 }); S.line([[-26, 8], [26, 8]], { w: 0.9 }); }
    else if (kind === "book" || kind === "novel") { const w = kind === "book" ? 30 : 22; S.solid("slab", 0, 0, w * 0.5, { sx: 1.3, sy: 0.35, sz: 1, yaw: 0.6, pitch: 0.5, seed, a: 0.8 }); }
    else if (kind === "telephone") { S.line(spline([[-14, 4], [-10, -8], [0, -12], [10, -8], [14, 4]], 6), { w: 1, a: 0.5 }); S.line([[-16, 6], [16, 6]], { w: 1, a: 0.5 }); }
    else if (kind === "television") { const box = [[-24, -16], [24, -16], [24, 16], [-24, 16]]; S.wash([[-19, -11], [19, -11], [19, 11], [-19, 11]], C.blue, 0.55, seed, { bloom: 0.6 }); S.line(box.concat([box[0]]), { w: 1 }); S.line([[-8, -16], [-16, -30]], { w: 0.8, a: 0.6 }); S.line([[8, -16], [16, -30]], { w: 0.8, a: 0.6 }); }
    else if (kind === "calculator") { const box = [[-14, -22], [14, -22], [14, 22], [-14, 22]]; S.wash([[-10, -18], [10, -18], [10, -8], [-10, -8]], C.blue, 0.5, seed, { bloom: 0.3 }); S.line(box.concat([box[0]]), { w: 1 }); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) S.dot(-8 + c * 8, -2 + r * 8, 1.3, 0.6); }
    else if (kind === "screen") { const box = [[-26, -17], [26, -17], [26, 15], [-26, 15]]; S.wash([[-23, -14], [23, -14], [23, 12], [-23, 12]], C.blue, 0.42, seed, { bloom: 0.7, blooms: 1 }); S.line(box.concat([box[0]]), { w: 1 }); S.line([[-10, 15], [-12, 24], [12, 24], [10, 15]], { w: 0.8, a: 0.6 }); }
    else if (kind === "plane") { S.wash([[-30, 2], [-6, -4], [22, -2], [30, 2], [22, 6], [-6, 6]], C.blue, 0.5, seed, { bloom: 0.3, edge: 0.6 }); S.line(spline([[-30, 2], [-6, -4], [22, -2], [30, 2]], 6), { w: 1 }); S.line(spline([[-30, 2], [-6, 6], [22, 6], [30, 2]], 6), { w: 1 }); S.line([[-4, -2], [2, -20], [12, -20]], { w: 0.9, a: 0.7 }); S.line([[-2, 4], [-10, 14], [8, 12]], { w: 0.9, a: 0.7 }); }
    else if (kind === "satellite") { S.wash([[-8, -8], [8, -8], [8, 8], [-8, 8]], C.blue, 0.7, seed, { bloom: 0.2 }); S.line([[-8, -8], [8, -8], [8, 8], [-8, 8], [-8, -8]], { w: 1 }); S.wash([[-34, -6], [-12, -6], [-12, 6], [-34, 6]], C.blue, 0.4, seed + 1, { bloom: 0.3 }); S.wash([[12, -6], [34, -6], [34, 6], [12, 6]], C.blue, 0.4, seed + 2, { bloom: 0.3 }); S.line([[-34, -6], [-12, -6], [-12, 6], [-34, 6], [-34, -6]], { w: 0.8, a: 0.6 }); S.line([[12, -6], [34, -6], [34, 6], [12, 6], [12, -6]], { w: 0.8, a: 0.6 }); }
    else if (kind === "cube") { S.solid("cube", 0, 0, 22, { yaw: 0.6, pitch: 0.42, seed, a: 0.95 }); }
    S.restore();
  }
  function verdictMark(S, x, y, v, k) {
    if (k <= 0) return;
    S.save(); S.mul(k);
    if (v === "feared") S.ring(x, y, 4, 0.6);
    else if (v === "refuted") { S.drop(x, y, 4.5, 0.55); S.line([[x - 6, y - 6], [x + 6, y + 6]], { w: 1, a: 0.7 }); S.line([[x + 6, y - 6], [x - 6, y + 6]], { w: 1, a: 0.7 }); }
    else if (v === "confirmed") S.drop(x, y, 5, 0.95);
    else if (v === "shaky") { S.drop(x, y, 4.5, 0.4); S.label("?", x + 7, y + 4, { size: 11, a: 0.8 }); }
    else if (v === "open") S.ring(x, y, 5, 0.9);
    S.restore();
  }
  const st = E.makeStage(cv, VW, VH, (S, st) => {
    const { idx, local, time } = st;
    const prog = idx + local;
    // the line draws on ahead of the walkers
    const lineK = clamp(0.1 + prog / 4.6);
    S.line(W.partial(PATH, lineK), { w: 1, a: 0.55, jit: 0.6, seed: 5 });
    D.panics.forEach((ev, i) => {
      const [x, y] = at(U[i]);
      const myStep = stepOf[i];
      // reveal within its step, staggered
      const nInStep = stepOf.filter((s) => s === myStep).length, j = stepOf.slice(0, i).filter((s) => s === myStep).length;
      let k = myStep < idx ? 1 : myStep > idx ? 0 : easeOut(seg(local, 0.05 + j * (0.6 / nInStep), 0.35 + j * (0.6 / nInStep)));
      if (i === 0) k = 1;
      if (k <= 0) return;
      const dir = y > 460 ? -1 : 1;
      const hv = st.hv("ev" + i);
      S.figure("stand", x, y, FS, { k, dir, seed: i * 3, noFace: k < 0.6 });
      const bob = E.reduceMotion ? 0 : Math.sin(time * 0.0012 + i) * 1.5;
      S.save(); S.translate(x + 2 * dir, y - 150 * FS - 34 + bob - hv * 4); S.scaleBy(1.25); object(S, ev.object, 0, 0, Math.max(0, k * 1.6 - 0.6), i * 7); S.restore();
      // date under the feet, verdict beside it
      S.label(ev.label, x, y + 24, { size: 12, align: "center", a: 0.9 * k });
      verdictMark(S, x, y + 42, ev.verdict, clamp(k * 2 - 1));
      if (hv > 0.01) { S.save(); S.mul(hv); S.ring(x, y - 56, 50, 0.5); S.restore(); }
    });
    // the crowd of today: 100 students, 95 of them with the cube
    if (idx >= 4) {
      const k = easeOut(seg(local, 0.1, 0.8));
      const cx = 560, cy = 722;
      for (let i = 0; i < 100; i++) {
        const r = Math.floor(i / 20), c = i % 20;
        const kk = clamp(k * 1.4 - i / 100 * 0.4);
        if (kk <= 0) continue;
        const x = cx - 230 + c * 24, y = cy + r * 18;
        if (i < 95) S.drop(x, y, 5.5, 0.85 * kk, i);
        else S.ring(x, y, 5, 0.5 * kk);
      }
      S.label("95 of 100 UK undergraduates use generative AI · 2026", cx, cy + 98, { size: 12, align: "center", a: k, narrow: "95 of 100 UK students, 2026" });
    }
    // legend
    S.label("○ feared   ⊗ tested, refuted   ● tested, confirmed   ? shaky", 40, 60, { size: 11.5, a: 0.8, narrow: "○ feared  ⊗ refuted  ● confirmed  ? shaky" });
  }, {
    alive: true, tip: $("#tip-worry"),
    spots: (st) => D.panics.map((ev, i) => { const [x, y] = at(U[i]); return { key: "ev" + i, x, y: y - 56, r: 56, tip: `<strong>${ev.who}</strong>: “${ev.quote}”`, src: ev.src, href: ev.sec }; }).filter((sp, i) => stepOf[i] <= st.idx)
  });
  E.scrollyById("sc-worry").stage = st;
  const ro = $("#ro-worry");
  E.scrollyById("sc-worry").onStep = (i) => { ro.textContent = ["one worry, 370 BCE", "print, reading, and the quiet telephone", "television; calculators, tested", "Google, GPS, autopilot", "the cube, and the crowd"][i] || ""; };
})();

/* ================= II. THE ROOM ================= */
(function room() {
  const E = window.Essay, W = window.Wash, D = window.DATA, C = W.C, M = window.Scenes;
  const { clamp, seg, easeOut, easeInOut, lerp } = W;
  const $ = E.$;
  const cv = $("#cv-room"); if (!cv) return;
  const VW = 1000, VH = 800;
  const mit = D.mit;
  const GX = [180, 500, 820], GY = 360;
  const names = ["ChatGPT", "search engine", "brain only"];
  const st = E.makeStage(cv, VW, VH, (S, st) => {
    const { idx, local, time } = st;
    const appear = idx > 0 ? 1 : easeOut(seg(local, 0, 0.6));
    const fill = idx > 1 ? 1 : idx === 1 ? easeInOut(seg(local, 0.05, 0.7)) : 0;
    const tint = idx > 2 ? 1 : idx === 2 ? easeOut(seg(local, 0.05, 0.6)) : 0;
    const power = idx === 3 ? easeOut(seg(local, 0.05, 0.6)) : 0;
    // the 159 the power calculation asked for: faint outlines behind everything
    if (power > 0) {
      let n = 0;
      for (let r = 0; r < 9 && n < mit.powerNeeded; r++) for (let c = 0; c < 18 && n < mit.powerNeeded; c++, n++) {
        const kk = clamp(power * 1.5 - n / mit.powerNeeded * 0.5);
        if (kk <= 0) continue;
        S.ring(96 + c * 48, 140 + r * 54, 11, 0.22 * kk);
      }
      S.label(`${mit.powerNeeded} people, the sample a power calculation asks for`, 500, 640, { size: 12, align: "center", a: power, narrow: `${mit.powerNeeded} people needed` });
    }
    for (let g = 0; g < 3; g++) {
      const hv = st.hv("g" + g);
      const yes = mit.quoteCorrectS1[g];
      for (let i = 0; i < 18; i++) {
        const r = Math.floor(i / 6), c = i % 6;
        const x = GX[g] - 100 + c * 40, y = GY - 44 + r * 46;
        const kk = clamp(appear * 1.5 - i / 18 * 0.5 - g * 0.1);
        if (kk <= 0) continue;
        const couldQuote = i < yes;
        const f = couldQuote ? fill : 0;
        // a person is a drop: grey outline, blue when they could quote
        S.ring(x, y, 11, (0.45 + 0.2 * hv) * kk);
        if (f > 0) S.drop(x, y, 10.5, 0.9 * f * kk, g * 20 + i);
        // the ChatGPT writers' heads tint from the cube's thought
        if (tint > 0 && g < 2) { S.save(); S.mul(tint * (g === 0 ? 0.55 : 0.3) * kk); S.blob(x, y, 13, C.blue, 0.5, 90 + i + g * 30, { bloom: 0.3, pool: 0.5, grain: 0.3 }); S.restore(); }
      }
      S.label(names[g], GX[g], GY + 102, { size: 14, align: "center", a: appear });
      S.label("18 people", GX[g], GY + 122, { size: 11.5, align: "center", a: appear * 0.8, narrow: false });
      if (fill > 0) {
        M.big(S, `${yes} of 18`, GX[g], GY - 118, { align: "center", size: 44, a: fill });
        S.label("could quote their own essay", GX[g], GY - 92, { size: 11.5, align: "center", a: fill, narrow: g === 1 ? "could quote their own essay" : false });
      }
      if (tint > 0) {
        const pct = ["up to 55% lower", "34–48% lower", "connectivity, during the task"][g];
        S.label(pct, GX[g], GY + 150, { size: 12, align: "center", a: tint * 0.9, narrow: ["−55%", "−34–48%", "connectivity"][g] });
      }
    }
    if (idx === 3) {
      const k = easeOut(seg(local, 0.3, 0.9));
      S.label("“ChatGPT May Be Eroding Critical Thinking Skills”", 500, 720, { size: 22, font: "display", align: "center", a: k });
      // the words the authors asked journalists not to use, struck through
      const words = mit.forbidden.slice(0, 5);
      let x = 500 - 170;
      words.forEach((w, i) => {
        const kk = clamp(k * 1.5 - i * 0.1);
        const wd = S.measure(w, 13);
        S.label(w, x, 752, { size: 13, a: 0.7 * kk });
        S.line([[x - 2, 748], [x + wd + 2, 747]], { w: 1, a: 0.6 * kk, seed: i + 50 });
        x += wd + 18;
      });
    }
  }, {
    tip: $("#tip-room"),
    spots: (st) => [0, 1, 2].map((g) => ({ key: "g" + g, x: GX[g], y: GY + 2, r: 120, tip: `<strong>${names[g]}</strong>: ${mit.quoteCorrectS1[g]} of 18 produced a correct quotation from their own essay minutes after writing it, in the first session.`, src: "C1", href: "c1" }))
  });
  E.scrollyById("sc-room").stage = st;
  const ro = $("#ro-room");
  E.scrollyById("sc-room").onStep = (i) => { ro.textContent = ["54 people · 3 groups · 3 sessions", "session 1: who could quote their own essay", "EEG connectivity during the 20-minute task", "54 people, 159 needed · the headline"][i] || ""; };
})();

/* ================= III. TWO ROOMS ================= */
(function rooms() {
  const E = window.Essay, W = window.Wash, D = window.DATA, C = W.C, M = window.Scenes;
  const { clamp, seg, easeOut, easeInOut, lerp } = W;
  const $ = E.$;
  const cv = $("#cv-rooms"); if (!cv) return;
  const VW = 1000, VH = 800;
  const sp = D.spine;
  const groups = [
    { name: "textbook", practice: 100, exam: 100, cube: "none" },
    { name: "ChatGPT, answers", practice: 100 + sp.practiceBase, exam: 100 + sp.examBase, cube: "head" },
    { name: "ChatGPT, hints only", practice: 100 + sp.practiceTutor, exam: 100 + sp.examTutor, cube: "floor" }
  ];
  const FLOOR = 440, TH = 8.5; // one sheet = 10 points
  function person(S, x, y, g, k, o = {}) {
    S.figure("stand", x, y, 0.4, { k, dir: o.dir || 1, seed: o.seed || 0 });
    if (g.cube === "head") M.fadeIn(S, k, () => S.solid("cube", x - 2, y - 150 * 0.4 - 8, 30, { yaw: 0.6, pitch: 0.42, a: 0.95, seed: 7 }));
    if (g.cube === "floor") M.fadeIn(S, k, () => { S.solid("cube", x + 34, y - 12, 13, { yaw: 0.5, pitch: 0.4, a: 0.9, seed: 9 }); S.solid("tetra", x + 30, y - 40, 9, { yaw: 0.3, pitch: -0.5, a: 0.7, seed: 11 }); });
  }
  const st = E.makeStage(cv, VW, VH, (S, st) => {
    const { idx, local } = st;
    const prac = idx > 0 ? 1 : easeOut(seg(local, 0.05, 0.75));
    const exam = idx > 1 ? 1 : idx === 1 ? easeOut(seg(local, 0.05, 0.75)) : 0;
    const coders = idx > 2 ? 1 : idx === 2 ? easeOut(seg(local, 0.05, 0.7)) : 0;
    const split = idx === 3 ? easeOut(seg(local, 0.05, 0.6)) : 0;
    // the two rooms: floor lines and a wall with a doorway between them
    S.line([[40, FLOOR + 2], [470, FLOOR]], { w: 1, a: 0.5, seed: 1 });
    if (exam > 0) { S.line(W.partial([[530, FLOOR], [960, FLOOR + 2]], exam), { w: 1, a: 0.5, seed: 2 }); S.line(W.partial([[500, FLOOR + 2], [500, 160]], exam), { w: 1, a: 0.35, seed: 3, jit: 0.8 }); }
    S.label("the practice room · with the tool", 60, 130, { size: 13, a: prac, narrow: "practice, with the tool" });
    if (exam > 0) S.label("the exam room · without it", 540, 130, { size: 13, a: exam, narrow: "exam, without it" });
    if (split > 0) { S.label("product", 60, 108, { size: 20, font: "display", a: split }); S.label("learning", 540, 108, { size: 20, font: "display", a: split }); }
    groups.forEach((g, i) => {
      // practice room
      const x = 120 + i * 140;
      const hv = st.hv("p" + i);
      person(S, x, FLOOR, g, prac, { seed: i });
      M.stack(S, x + 74, FLOOR - 2, 40, g.practice / 10, { k: prac, seed: i + 1, th: TH, a: 0.7 + 0.2 * hv });
      if (prac > 0.95) {
        const d = g.practice - 100;
        S.label(d === 0 ? "baseline" : `${d > 0 ? "+" : ""}${d}%`, x + 74, FLOOR - 14 - (g.practice / 10) * TH - 14, { size: 13, align: "center" });
      }
      S.label(g.name, x + 30, FLOOR + 24, { size: 11, align: "center", a: prac, width: 130, narrow: ["textbook", "answers", "hints"][i] });
      // exam room
      if (exam > 0) {
        const xe = 590 + i * 140;
        const hve = st.hv("e" + i);
        person(S, xe, FLOOR, Object.assign({}, g, { cube: "none" }), exam, { seed: i + 5 });
        M.stack(S, xe + 74, FLOOR - 2, 40, g.exam / 10, { k: exam, seed: i + 11, th: TH, a: 0.7 + 0.2 * hve });
        if (exam > 0.95) {
          const d = g.exam - 100;
          S.label(d === 0 ? (i === 0 ? "baseline" : "≈ same") : `${d > 0 ? "+" : ""}${d}%`, xe + 74, FLOOR - 14 - (g.exam / 10) * TH - 14, { size: 13, align: "center" });
        }
        S.label(g.name, xe + 30, FLOOR + 24, { size: 11, align: "center", a: exam, width: 130, narrow: ["textbook", "answers", "hints"][i] });
      }
    });
    // the coders: fifty-two juniors, a quiz afterwards
    if (coders > 0) {
      const y = 740;
      S.save(); S.mul(coders);
      S.line([[40, y + 2], [960, y]], { w: 1, a: 0.4, seed: 21 });
      S.label("fifty-two junior programmers learn a library, then a quiz", 60, 596, { size: 13, narrow: "52 programmers, then a quiz" });
      const pairs = [{ name: "with an AI assistant", score: sp.quizAI, cube: "head" }, { name: "by hand", score: sp.quizHand, cube: "none" }];
      pairs.forEach((p, i) => {
        const x = 140 + i * 300;
        person(S, x, y, p, coders, { seed: 30 + i });
        M.stack(S, x + 74, y - 2, 40, p.score / 10, { k: coders, seed: 40 + i, th: TH });
        S.label(`${p.score}%`, x + 74, y - 14 - (p.score / 10) * TH - 14, { size: 13, align: "center" });
        S.label(p.name, x + 30, y + 24, { size: 11, align: "center", width: 150, narrow: ["with AI", "by hand"][i] });
      });
      S.label("17 points", 780, y - 70, { size: 32, font: "display", align: "center" });
      S.label("d = 0.74 · no significant speed gain", 780, y - 42, { size: 11.5, align: "center", narrow: false });
      S.restore();
    }
  }, {
    tip: $("#tip-rooms"),
    spots: (st) => {
      const out = [];
      groups.forEach((g, i) => {
        out.push({ key: "p" + i, x: 194 + i * 140, y: FLOOR - 70, r: 70, tip: `<strong>${g.name}</strong>, practice: ${g.practice - 100 === 0 ? "the baseline" : (g.practice - 100 > 0 ? "+" : "") + (g.practice - 100) + "% against the textbook group"}.`, src: "C6", href: "c4" });
        if (st.idx >= 1) out.push({ key: "e" + i, x: 664 + i * 140, y: FLOOR - 70, r: 70, tip: `<strong>${g.name}</strong>, exam without the tool: ${g.exam - 100 === 0 ? (i === 0 ? "the baseline" : "about the same as the textbook group") : (g.exam - 100) + "% against the textbook group"}.`, src: "C6", href: "c4" });
      });
      return out;
    }
  });
  E.scrollyById("sc-rooms").stage = st;
  const ro = $("#ro-rooms");
  E.scrollyById("sc-rooms").onStep = (i) => { ro.textContent = ["about 1,000 students · practice sessions with the tool", "the exam, closed book, no tool", "52 programmers · an unfamiliar library · a quiz", "score while using it vs skill afterwards"][i] || ""; };
})();

/* ================= IV. EFFORT ================= */
(function effort() {
  const E = window.Essay, W = window.Wash, D = window.DATA, C = W.C, M = window.Scenes;
  const { clamp, seg, easeOut, easeInOut, lerp, spline } = W;
  const $ = E.$;
  const cv = $("#cv-effort"); if (!cv) return;
  const VW = 1000, VH = 800;
  const R = D.memory.roediger;
  const rg = $("#rg-effort"), out = $("#out-effort");
  let userDays = null;
  // recall by days: the reader starts higher and loses half; the builder keeps most
  const reader = (d) => R.at1week[0] + (R.at5min[0] - R.at1week[0]) * Math.exp(-d / 1.6);
  const builder = (d) => R.at1week[2] + (R.at5min[2] - R.at1week[2]) * Math.exp(-d / 1.6);
  const LX = 270, RX = 730, FY = 520, FS = 0.62;
  const st = E.makeStage(cv, VW, VH, (S, st) => {
    const { idx, local, time } = st;
    const arrive = idx > 0 ? 1 : easeInOut(seg(local, 0.05, 0.7));
    const days = userDays != null ? userDays : idx >= 2 ? 7 * easeInOut(seg(local, 0.0, 0.5)) : 0;
    if (!userDays && rg) { rg.value = days.toFixed(2); out.textContent = days < 0.05 ? "5 minutes" : `${Math.round(days * 10) / 10} days`; }
    const decayPanel = idx === 3 ? easeOut(seg(local, 0.05, 0.6)) : 0;
    const pr = reader(days), pb = builder(days);
    // ground
    S.line([[60, FY + 2], [940, FY]], { w: 1, a: 0.45, seed: 1 });
    // the reader: the cube is handed down whole and lands on her head
    S.figure("sitUp", LX, FY, FS, { seed: 1 });
    const drop = easeInOut(arrive);
    const cy = lerp(60, FY - 300 * FS, drop);
    S.save(); S.mul(pr / 100 * 1.1);
    S.solid("cube", LX + 8, cy, 58, { yaw: 0.6, pitch: 0.42, a: 0.95, seed: 3 });
    S.restore();
    if (arrive < 1) { S.line([[LX + 8, cy - 90], [LX + 8, 20]], { w: 0.8, a: 0.35 * (1 - arrive), jit: 0.3 }); }
    S.label("handed the whole thing", LX, FY + 36, { size: 12.5, align: "center", narrow: "handed it" });
    S.label("reads it four times", LX, FY + 54, { size: 11, align: "center", a: 0.8, narrow: false });
    // the builder: pieces arrive and she assembles the cube herself
    S.figure("sitUp", RX, FY, FS, { seed: 2 });
    const build = arrive;
    const bcx = RX + 8, bcy = FY - 300 * FS;
    S.save(); S.mul(pb / 100 * 1.1);
    S.solid("cube", bcx, bcy, 58, { yaw: 0.6, pitch: 0.42, a: 0.95, seed: 5, k: build });
    S.restore();
    // loose pieces on the ground that she is working from
    if (build < 1) {
      for (let i = 0; i < 3; i++) {
        const pk = clamp(1 - build * 3 + i);
        if (pk <= 0) continue;
        S.save(); S.mul(pk);
        S.solid("tetra", RX + 90 + i * 34, FY - 18, 11, { yaw: 0.3 + i, pitch: -0.5, a: 0.7, seed: 20 + i });
        S.restore();
      }
    }
    S.label("builds it herself", RX, FY + 36, { size: 12.5, align: "center", narrow: "builds it" });
    S.label("reads once, writes it out three times", RX, FY + 54, { size: 11, align: "center", a: 0.8, narrow: false });
    // recall, as the cube's strength and a number
    if (idx >= 1) {
      const k = idx > 1 ? 1 : easeOut(seg(local, 0.05, 0.5));
      M.big(S, `${Math.round(pr)}%`, LX, 120, { align: "center", size: 46, a: k });
      M.big(S, `${Math.round(pb)}%`, RX, 120, { align: "center", size: 46, a: k });
      S.label("recalled", LX, 142, { size: 11.5, align: "center", a: k });
      S.label("recalled", RX, 142, { size: 11.5, align: "center", a: k });
      const when = days < 0.05 ? "five minutes later" : days >= 6.9 ? "a week later" : `${Math.round(days * 10) / 10} days later`;
      S.label(when, 500, 60, { size: 14, align: "center", a: k });
      if (days < 0.3 && idx === 1) { S.label("and she is the more confident of the two", LX, 164, { size: 11, align: "center", a: k * 0.8 }); }
    }
    // the decay panel: a year of disuse, and the endoscopists
    if (decayPanel > 0) {
      S.save(); S.mul(decayPanel);
      const y0 = 640;
      S.label("a year without using a skill: about −1.4 standard deviations", 60, y0 - 16, { size: 12.5, narrow: "a year unused: −1.4 SD" });
      // twelve cubes fading month by month
      for (let m = 0; m <= 12; m++) {
        const a = 1 - (m / 12) * 0.82;
        S.save(); S.mul(a);
        S.solid("cube", 90 + m * 36, y0 + 26, 10, { yaw: 0.6, pitch: 0.42, a: 0.95, seed: 60 + m });
        S.restore();
      }
      S.label("months", 90 + 12 * 36 + 28, y0 + 30, { size: 11 });
      // the endoscopists: polyps found per hundred, before and after three months with the AI
      const e = D.memory.endoscopy;
      S.label("detection rate, unassisted colonoscopies", 540, y0 - 16, { size: 12.5, narrow: "unassisted detection" });
      [["before AI", e.before], ["after 3 months with AI", e.after]].forEach(([lab, v], r) => {
        for (let i = 0; i < 40; i++) {
          const x = 540 + i * 9.5, y = y0 + 10 + r * 44;
          if (i < Math.round(v / 100 * 40)) S.drop(x, y, 3.4, 0.9, 70 + i + r * 40); else S.ring(x, y, 3, 0.3);
        }
        S.label(`${lab} · ${v}%`, 540, y0 + 34 + r * 44, { size: 11, narrow: `${r ? "after AI" : "before"} · ${v}%` });
      });
      S.restore();
    }
  }, {
    tip: $("#tip-effort"),
    spots: (st) => [
      { key: "reader", x: LX + 8, y: FY - 300 * FS, r: 70, tip: `Read four times: ${R.at5min[0]}% recalled after five minutes, ${R.at1week[0]}% a week later. The re-readers also predicted they would remember best.`, src: "M12", href: "m2" },
      { key: "builder", x: RX + 8, y: FY - 300 * FS, r: 70, tip: `Read once, tested three times with no feedback: ${R.at5min[2]}% after five minutes, ${R.at1week[2]}% a week later.`, src: "M12", href: "m2" },
      ...(st.idx === 3 ? [{ key: "endo", x: 720, y: 680, r: 90, tip: "Four Polish endoscopy centres: adenoma detection in unassisted examinations fell from 28.4% to 22.4% after three months of AI-assisted work. Observational, before and after.", src: "M24", href: "m4" }] : [])
    ]
  });
  if (rg) rg.addEventListener("input", () => { userDays = +rg.value; out.textContent = userDays < 0.05 ? "5 minutes" : `${Math.round(userDays * 10) / 10} days`; st.invalidate(); });
  E.scrollyById("sc-effort").stage = st;
  E.scrollyById("sc-effort").onStep = (i) => { if (i < 2 && userDays != null && userDays > 0) { /* leave the reader's choice */ } };
})();

/* ================= V. THE MIRROR ================= */
(function mirror() {
  const E = window.Essay, W = window.Wash, D = window.DATA, C = W.C, M = window.Scenes;
  const { clamp, seg, easeOut, easeInOut, lerp, spline } = W;
  const $ = E.$;
  const cv = $("#cv-mirror"); if (!cv) return;
  const VW = 1000, VH = 800;
  const mr = D.mirror;
  const FY = 560, FS = 0.6, LX = 300, RX = 700;
  const st = E.makeStage(cv, VW, VH, (S, st) => {
    const { idx, local, time } = st;
    // which picture: 0–1 the mirror, 2 the seesaw, 3 the frontier
    const mirrorA = idx <= 1 ? 1 : idx === 2 ? 1 - easeInOut(seg(local, 0, 0.35)) : 0;
    const seesawA = idx === 2 ? easeInOut(seg(local, 0.1, 0.5)) : idx === 3 ? 1 - easeInOut(seg(local, 0, 0.35)) : 0;
    const frontA = idx === 3 ? easeInOut(seg(local, 0.1, 0.55)) : 0;
    if (mirrorA > 0) {
      S.save(); S.mul(mirrorA);
      // METR at step 0, Peng at step 1: the felt cube and the measured cube
      const toPeng = idx === 0 ? 0 : easeInOut(seg(local, 0.05, 0.6));
      const felt = lerp(1 + mr.metr.felt / -100, 1 + mr.peng.felt / 100, toPeng);        // 1.20 → 1.35
      const meas = lerp(1 - mr.metr.measured / 100, 1 + mr.peng.measured / 100, toPeng);  // 0.81 → 1.56
      const hvF = st.hv("felt"), hvM = st.hv("meas");
      S.line([[60, FY + 2], [940, FY]], { w: 1, a: 0.45, seed: 1 });
      // the mirror: a tall wobbly line with a faint wash
      S.wash([[488, 120], [512, 118], [514, FY], [486, FY]], C.blue, 0.12, 9, { bloom: 0.5, pool: 0.4, grain: 0.3 });
      S.line([[500, 110], [500, FY]], { w: 1, a: 0.5, seed: 2, jit: 0.8 });
      S.figure("sitUp", LX, FY, FS, { seed: 1 });
      S.figure("sitUp", RX, FY, FS, { seed: 2, dir: -1 });
      const base = 46;
      S.solid("cube", LX + 10, FY - 300 * FS - 70, base * felt, { yaw: 0.6, pitch: 0.42, a: 0.95 + 0.05 * hvF, seed: 3 });
      S.solid("cube", RX - 10, FY - 300 * FS - 70, base * meas, { yaw: -0.6, pitch: 0.42, a: 0.95 + 0.05 * hvM, seed: 4 });
      S.label("what she feels the tool did", LX, FY + 40, { size: 12.5, align: "center", narrow: "felt" });
      S.label("what the clock measured", RX, FY + 40, { size: 12.5, align: "center", narrow: "measured" });
      const fTxt = toPeng < 0.5 ? `${-mr.metr.felt}% faster` : `${mr.peng.felt}% faster`;
      const mTxt = toPeng < 0.5 ? `${mr.metr.measured}% slower` : `${Math.round(mr.peng.measured)}% faster`;
      M.big(S, fTxt, LX, 120, { align: "center", size: 36 });
      M.big(S, mTxt, RX, 120, { align: "center", size: 36 });
      S.label(toPeng < 0.5 ? "16 developers · 246 real tasks · their own code" : "95 developers · one small server · Copilot", 500, 70, { size: 12, align: "center", narrow: toPeng < 0.5 ? "16 developers, their own code" : "95 developers, Copilot" });
      S.restore();
    }
    if (seesawA > 0) {
      S.save(); S.mul(seesawA);
      // a beam on a tetrahedron: confidence in the AI on one side, in oneself on the other
      const tilt = -0.2 * easeInOut(seg(local, 0.3, 0.8));
      const px = 500, py = 420;
      S.solid("tetra", px, py + 40, 34, { yaw: 0.2, pitch: -0.5, a: 0.8, seed: 5 });
      S.save(); S.translate(px, py); S.rotate(tilt);
      S.line([[-300, 0], [300, 0]], { w: 1.3, seed: 6 });
      // the weights: drops for each coefficient
      for (let i = 0; i < 7; i++) S.drop(-250 + i * 22, -14, 8, 0.9, 20 + i);     // 0.69 → 7 drops
      for (let i = 0; i < 3; i++) S.drop(190 + i * 22, -14, 8, 0.9, 30 + i);      // 0.26 → 3 drops
      S.restore();
      S.label("confidence that the AI can do it", px - 230, py + 90 + 40 * -tilt * 5, { size: 12.5, align: "center", narrow: "trusts the AI" });
      S.label("β = −0.69 · less critical thinking", px - 230, py + 108 + 40 * -tilt * 5, { size: 11.5, align: "center", narrow: "β −0.69" });
      S.label("confidence that she can do it", px + 230, py + 90 - 40 * -tilt * 5, { size: 12.5, align: "center", narrow: "trusts herself" });
      S.label("β = +0.26 · more critical thinking", px + 230, py + 108 - 40 * -tilt * 5, { size: 11.5, align: "center", narrow: "β +0.26" });
      S.label("319 knowledge workers · 936 real uses · self-reported", 500, 90, { size: 12, align: "center", narrow: "319 workers, self-reported" });
      M.big(S, "the more she trusts it, the less she checks", 500, 150, { align: "center", size: 28, narrow: "trust it more, check it less" });
      S.restore();
    }
    if (frontA > 0) {
      S.save(); S.mul(frontA);
      // the jagged frontier: a wash whose edge wanders down the middle
      const edge = spline([[560, 80], [520, 200], [600, 300], [540, 420], [610, 540], [560, 700]], 8);
      const poly = [[60, 80], ...edge, [60, 700]];
      S.wash(poly, C.blue, 0.22, 11, { bloom: 0.6, blooms: 3, pool: 1, grain: 0.6, edge: 2.5 });
      S.label("inside the tool's competence", 80, 120, { size: 13 });
      S.label("outside it", 650, 120, { size: 13 });
      S.figure("stand", 240, 560, 0.42, { seed: 7 });
      S.solid("cube", 238, 560 - 150 * 0.42 - 8, 30, { yaw: 0.6, pitch: 0.42, a: 0.95, seed: 8 });
      M.big(S, `+${mr.frontier.insideQuality}%`, 330, 400, { size: 40 });
      S.label("quality, 758 consultants", 330, 424, { size: 11.5, narrow: "quality" });
      S.figure("stand", 760, 560, 0.42, { seed: 9 });
      S.solid("cube", 758, 560 - 150 * 0.42 - 8, 30, { yaw: 0.6, pitch: 0.42, a: 0.95, seed: 10 });
      // correct answers out of ten, without and with the tool
      const rows = [["without the tool", mr.frontier.correctNoAI], ["with it", (mr.frontier.correctAI[0] + mr.frontier.correctAI[1]) / 2]];
      rows.forEach(([lab, v], r) => {
        for (let i = 0; i < 10; i++) { const x = 660 + i * 22, y = 300 + r * 60; if (i < Math.round(v / 10)) S.drop(x, y, 7, 0.9, 50 + i + r * 10); else S.ring(x, y, 6.5, 0.35); }
        S.label(`${lab} · ${Math.round(v)}% correct`, 660, 326 + r * 60, { size: 11.5, narrow: false });
      });
      S.label("the fifty GPS drivers: worse navigation, r = −0.22; self-rated sense of direction unchanged, r = 0.07", 500, 760, { size: 11.5, align: "center", width: 700, narrow: false });
      S.restore();
    }
  }, {
    tip: $("#tip-mirror"),
    spots: (st) => st.idx <= 1 ? [
      { key: "felt", x: LX + 10, y: FY - 300 * FS - 70, r: 70, tip: st.idx === 0 ? "METR, 2025: before the trial the developers forecast a 24% speed-up; afterwards they believed they had been 20% faster." : "Peng et al., 2023: participants estimated a 35% gain.", src: st.idx === 0 ? "C18" : "C20", href: "c7" },
      { key: "meas", x: RX - 10, y: FY - 300 * FS - 70, r: 70, tip: st.idx === 0 ? "Tasks with AI took 19% longer (95% CI +2% to +39%). Sixteen developers, 246 tasks, randomised task by task." : "The treated group finished in 71 minutes against 161: 55.8% faster.", src: st.idx === 0 ? "C18" : "C20", href: "c7" }
    ] : []
  });
  E.scrollyById("sc-mirror").stage = st;
  const ro = $("#ro-mirror");
  E.scrollyById("sc-mirror").onStep = (i) => { ro.textContent = ["METR 2025 · felt vs measured", "Peng 2023 · the other direction", "Lee et al. 2025 · confidence and checking", "Dell'Acqua et al. 2023 · the jagged frontier"][i] || ""; };
})();

/* ================= VI. SAMENESS ================= */
(function sameness() {
  const E = window.Essay, W = window.Wash, D = window.DATA, C = W.C, M = window.Scenes;
  const { clamp, seg, easeOut, easeInOut, lerp } = W;
  const $ = E.$;
  const cv = $("#cv-same"); if (!cv) return;
  const VW = 1000, VH = 800;
  const dz = D.sameness.doshi;
  const rnd = window.Paper.mulberry32(77);
  const N = 100, CX = 500, CY = 330, R = 230;
  // each story has a place in idea-space and a "quality" (alpha)
  const base = Array.from({ length: N }, (_, i) => { const a = rnd() * Math.PI * 2, r = R * Math.sqrt(rnd()); return { a, r, x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r * 0.78, q: 0.55 + rnd() * 0.35, ph: rnd() * 6.28 }; });
  const ideas1 = [[CX + 40, CY - 20]];
  const ideas5 = [[CX - 150, CY - 90], [CX + 120, CY - 110], [CX + 170, CY + 70], [CX - 60, CY + 120], [CX - 170, CY + 40]];
  let mode = "none", userMode = null;
  const cur = base.map((b) => ({ x: b.x, y: b.y, q: b.q }));
  function target(i, m) {
    const b = base[i];
    if (m === "none") return { x: b.x, y: b.y, q: b.q };
    const ideas = m === "one" ? ideas1 : ideas5;
    const pull = m === "one" ? dz.similarityRange[0] / 100 * 3.2 : dz.similarityRange[1] / 100 * 3.2;   // similarity gain, scaled for the eye
    const nov = m === "one" ? dz.novelty[0] / 100 * 2 : dz.novelty[1] / 100 * 2;                         // novelty gain: a nudge outward
    let best = ideas[0], bd = Infinity;
    for (const p of ideas) { const d = Math.hypot(p[0] - b.x, p[1] - b.y); if (d < bd) { bd = d; best = p; } }
    const ox = b.x + Math.cos(b.a) * R * nov, oy = b.y + Math.sin(b.a) * R * nov * 0.78;
    return { x: lerp(ox, best[0], pull), y: lerp(oy, best[1], pull), q: Math.min(1, b.q + (m === "one" ? dz.usefulness[0] : dz.usefulness[1]) / 100 * 2) };
  }
  const btns = { none: $("#btn-same-none"), one: $("#btn-same-one"), five: $("#btn-same-five") };
  function setMode(m, fromUser) { mode = m; if (fromUser) userMode = m; Object.entries(btns).forEach(([k, b]) => b && b.classList.toggle("active", k === m)); st.invalidate(); }
  Object.entries(btns).forEach(([k, b]) => b && b.addEventListener("click", () => setMode(k, true)));
  const st = E.makeStage(cv, VW, VH, (S, st) => {
    const { idx, local, time } = st;
    const adviceA = idx === 2 ? easeInOut(seg(local, 0.05, 0.5)) : 0;
    // move the drops toward their targets
    let moving = false;
    for (let i = 0; i < N; i++) {
      const t = target(i, mode), c = cur[i];
      const k = E.reduceMotion ? 1 : 0.08;
      c.x += (t.x - c.x) * k; c.y += (t.y - c.y) * k; c.q += (t.q - c.q) * k;
      if (Math.abs(t.x - c.x) > 0.3 || Math.abs(t.y - c.y) > 0.3) moving = true;
    }
    if (moving) st.invalidate();
    const ideas = mode === "one" ? ideas1 : mode === "five" ? ideas5 : [];
    // the AI's own ideas: small cubes
    ideas.forEach((p, i) => S.solid("cube", p[0], p[1], 14, { yaw: 0.6 + i, pitch: 0.42, a: 0.9, seed: 60 + i }));
    const hv = st.hv("field");
    for (let i = 0; i < N; i++) {
      const c = cur[i], b = base[i];
      const drift = E.reduceMotion ? 0 : Math.sin(time * 0.0007 + b.ph) * 1.2;
      S.drop(c.x + drift, c.y, 6.5, c.q * (0.9 + 0.1 * hv), i);
    }
    S.label("a hundred stories, placed by what they are about", CX, 70, { size: 12.5, align: "center", narrow: "a hundred stories" });
    const line = mode === "none" ? "no AI ideas" : mode === "one" ? `one AI idea · novelty +${dz.novelty[0]}% · usefulness +${dz.usefulness[0]}% · stories ${dz.similarityRange[0]}% of the range more alike` : `five AI ideas · novelty +${dz.novelty[1]}% · usefulness +${dz.usefulness[1]}% · stories ${dz.similarityRange[1]}% of the range more alike`;
    S.label(line, CX, 580, { size: 12, align: "center", width: 560, narrow: mode === "none" ? "no AI ideas" : mode === "one" ? `one AI idea · +${dz.novelty[0]}% novelty · ${dz.similarityRange[0]}% more alike` : `five AI ideas · +${dz.novelty[1]}% novelty · ${dz.similarityRange[1]}% more alike` });
    if (adviceA > 0) {
      S.save(); S.mul(adviceA);
      const ml = D.sameness.melumad;
      S.label("advice written after learning by search, and after learning from an LLM", CX, 640, { size: 12.5, align: "center", narrow: "advice after search vs after an LLM" });
      [["search engine", ml.cosine[0][1], 130], ["LLM", ml.cosine[0][0], 44]].forEach(([lab, cos, spread], g) => {
        const gx = 300 + g * 400, gy = 710;
        const r2 = window.Paper.mulberry32(5 + g);
        for (let i = 0; i < 24; i++) { const a = r2() * 6.28, r = spread * Math.sqrt(r2()); S.drop(gx + Math.cos(a) * r, gy + Math.sin(a) * r * 0.5, 5, 0.85, 200 + i + g * 30); }
        S.label(`${lab} · similarity ${cos}`, gx, gy + 56, { size: 11.5, align: "center", narrow: `${lab} · ${cos}` });
      });
      S.restore();
    }
  }, {
    alive: true, tip: $("#tip-same"),
    spots: () => [{ key: "field", x: CX, y: CY, r: 250, tip: `293 writers, 600 readers. Each drop is one story. With five AI ideas the least creative writers reached parity with the most creative, and the stories drew ${dz.similarityRange[1]}% of the similarity range closer together.`, src: "C14", href: "c9" }]
  });
  E.scrollyById("sc-same").stage = st;
  E.scrollyById("sc-same").onStep = (i) => { userMode = null; setMode(i === 0 ? "none" : "five", false); };
  setMode("none", false);
})();

/* ================= VII. THE TUTOR ================= */
(function tutor() {
  const E = window.Essay, W = window.Wash, D = window.DATA, C = W.C, M = window.Scenes;
  const { clamp, seg, easeOut, easeInOut, lerp } = W;
  const $ = E.$;
  const cv = $("#cv-tutor"); if (!cv) return;
  const VW = 1000, VH = 800;
  const sp = D.spine, tu = D.tutors;
  const FY = 520, FS = 0.62, PX = 300;
  let choice = null, userChoice = null, chosenAt = 0;
  const btns = { answer: $("#btn-answer"), hint: $("#btn-hint") };
  function choose(c, fromUser) { if (c !== choice) chosenAt = performance.now(); choice = c; if (fromUser) userChoice = c; Object.entries(btns).forEach(([k, b]) => b && b.classList.toggle("active", k === c)); st.invalidate(); }
  Object.entries(btns).forEach(([k, b]) => b && b.addEventListener("click", () => choose(k, true)));
  const st = E.makeStage(cv, VW, VH, (S, st) => {
    const { idx, local, time } = st;
    const mainA = idx === 0 ? 1 : idx === 1 ? 1 - easeInOut(seg(local, 0, 0.35)) : 0;
    const harvardA = idx === 1 ? easeInOut(seg(local, 0.1, 0.5)) : idx === 2 ? 1 - easeInOut(seg(local, 0, 0.35)) : 0;
    const argueA = idx === 2 ? easeInOut(seg(local, 0.1, 0.5)) : idx === 3 ? 1 - easeInOut(seg(local, 0, 0.35)) : 0;
    const modesA = idx === 3 ? easeInOut(seg(local, 0.1, 0.5)) : 0;
    const anim = E.reduceMotion ? 1 : clamp((performance.now() - chosenAt) / 1100);
    if (anim < 1 && choice) st.invalidate();
    if (mainA > 0) {
      S.save(); S.mul(mainA);
      S.line([[60, FY + 2], [940, FY]], { w: 1, a: 0.45, seed: 1 });
      S.figure("sitUp", PX, FY, FS, { seed: 1 });
      const headX = PX + 10, headY = FY - 300 * FS - 60;
      const cubeX0 = 640, cubeY0 = FY - 40;
      const k = easeInOut(anim);
      if (!choice) {
        S.solid("cube", cubeX0, cubeY0, 50, { yaw: 0.6, pitch: 0.42, a: 0.95, seed: 3 });
        S.sparkle(cubeX0 + 70, cubeY0 - 60, 9, 0.8, time);
        S.label("the model, with an answer in it", cubeX0, FY + 40, { size: 12.5, align: "center", narrow: "the model" });
        S.label("what does she ask for?", 500, 120, { size: 26, font: "display", align: "center" });
      } else if (choice === "answer") {
        // the cube travels whole onto her head
        const x = lerp(cubeX0, headX, k), y = lerp(cubeY0, headY, k) - Math.sin(k * Math.PI) * 60;
        S.solid("cube", x, y, 50, { yaw: 0.6, pitch: 0.42, a: 0.95, seed: 3 });
        S.label("she asked for the answer", 500, 120, { size: 26, font: "display", align: "center", a: k });
        M.fadeIn(S, clamp(k * 2 - 1), () => {
          M.stack(S, 640, FY - 2, 40, (100 + sp.practiceBase) / 10, { th: 8, seed: 3 });
          S.label(`practice +${sp.practiceBase}%`, 640, FY - 14 - ((100 + sp.practiceBase) / 10) * 8 - 14, { size: 13, align: "center" });
          M.stack(S, 800, FY - 2, 40, (100 + sp.examBase) / 10, { th: 8, seed: 4 });
          S.label(`exam ${sp.examBase}%`, 800, FY - 14 - ((100 + sp.examBase) / 10) * 8 - 14, { size: 13, align: "center" });
          S.label("against the textbook group", 720, FY + 40, { size: 11.5, align: "center", narrow: "vs textbook" });
        });
      } else {
        // the cube opens into pieces that she assembles beside her
        const pieces = [[0, 0, "tetra"], [1, 1, "cube"], [2, 2, "tetra"], [3, 3, "octa"]];
        const bx = PX + 120, by = FY - 60;
        pieces.forEach(([i, j, kind], n) => {
          const pk = easeInOut(clamp(k * 1.6 - n * 0.15));
          const sx = cubeX0 + (n - 1.5) * 40, sy = cubeY0 - 30 - n * 10;
          const tx = bx + [-20, 20, -8, 14][n], ty = by + [0, 4, -30, -28][n];
          S.solid(kind, lerp(sx, tx, pk), lerp(sy, ty, pk) - Math.sin(pk * Math.PI) * 50, 16, { yaw: 0.4 + n, pitch: -0.4, a: 0.9, seed: 10 + n });
        });
        S.label("she asked for a hint", 500, 120, { size: 26, font: "display", align: "center", a: k });
        M.fadeIn(S, clamp(k * 2 - 1), () => {
          M.stack(S, 640, FY - 2, 40, (100 + sp.practiceTutor) / 10, { th: 8, seed: 5 });
          S.label(`practice +${sp.practiceTutor}%`, 640, FY - 14 - ((100 + sp.practiceTutor) / 10) * 8 - 14, { size: 13, align: "center" });
          M.stack(S, 800, FY - 2, 40, 10, { th: 8, seed: 6 });
          S.label("exam ≈ same", 800, FY - 14 - 10 * 8 - 14, { size: 13, align: "center" });
          S.label("against the textbook group", 720, FY + 40, { size: 11.5, align: "center", narrow: "vs textbook" });
        });
      }
      S.restore();
    }
    if (harvardA > 0) {
      S.save(); S.mul(harvardA);
      const ke = tu.kestin;
      S.label("one physics lesson, two ways · post-test score out of 6", 500, 90, { size: 12.5, align: "center", narrow: "one lesson, two ways · score /6" });
      const bars = [["before", ke.pre], ["the class", ke.active], ["the AI tutor", ke.ai]];
      bars.forEach(([lab, v], i) => {
        const x = 260 + i * 240;
        M.stack(S, x, 440, 56, v * 4, { th: 9, seed: 20 + i });
        M.big(S, String(v), x, 440 - 14 - v * 4 * 9 - 20, { align: "center", size: 34 });
        S.label(lab, x, 470, { size: 12.5, align: "center" });
      });
      S.figure("sitUp", 480, 440, 0.42, { seed: 3, dir: -1 });
      S.figure("sitUp", 740, 440, 0.42, { seed: 4, dir: -1 });
      S.solid("tetra", 760, 440 - 300 * 0.42 - 70, 22, { yaw: 0.3, pitch: -0.5, a: 0.8, seed: 25 });
      S.label(`${ke.minutesAI} minutes with the tutor · ${ke.minutesClass} in class`, 500, 540, { size: 12.5, align: "center", narrow: `${ke.minutesAI} min vs ${ke.minutesClass}` });
      S.label(`effect ${ke.effectQuantile[0]}–${ke.effectQuantile[1]} standard deviations · a good human tutor averages ${tu.vanlehn.human}`, 500, 562, { size: 11.5, align: "center", width: 600, narrow: `${ke.effectQuantile[0]}–${ke.effectQuantile[1]} SD · human tutor ≈ ${tu.vanlehn.human}` });
      S.line([[60, 442], [940, 440]], { w: 1, a: 0.45, seed: 2 });
      S.restore();
    }
    if (argueA > 0) {
      S.save(); S.mul(argueA);
      const co = tu.costello;
      S.label("2,190 conspiracy believers argue with the model for three rounds", 500, 90, { size: 12.5, align: "center", narrow: "2,190 believers argue with it" });
      S.figure("sitUp", 300, 440, 0.6, { seed: 5 });
      S.solid("cube", 640, 400, 50, { yaw: -0.6, pitch: 0.42, a: 0.95, seed: 30 });
      // words between them: a few short pen strokes
      for (let i = 0; i < 4; i++) S.line([[400 + i * 8, 300 + i * 14], [560 - i * 8, 296 + i * 14]], { w: 0.8, a: 0.35, seed: 40 + i, jit: 1.2 });
      S.line([[60, 442], [940, 440]], { w: 1, a: 0.45, seed: 2 });
      // belief: ten drops, two fade
      for (let i = 0; i < 10; i++) { const x = 320 + i * 36, y = 560; if (i < 10 - co.beliefDrop / 10) S.drop(x, y, 9, 0.9, 50 + i); else S.ring(x, y, 8.5, 0.4); }
      S.label(`belief in the conspiracy: −${co.beliefDrop}%, still down ${co.months} months later · ${co.claimsTrue}% of the model's claims true`, 500, 600, { size: 11.5, align: "center", width: 560, narrow: `belief −${co.beliefDrop}%, for ${co.months} months` });
      const le = tu.lehmann;
      S.label(`asking for explanations: understanding ${le.explanationSeeking > 0 ? "+" : ""}${le.explanationSeeking}   ·   asking for solutions: ${le.solutionSeeking}`, 500, 660, { size: 12, align: "center", narrow: `explanations +${le.explanationSeeking} · solutions ${le.solutionSeeking}` });
      S.restore();
    }
    if (modesA > 0) {
      S.save(); S.mul(modesA);
      S.label("the vendors' answer", 500, 90, { size: 12.5, align: "center" });
      tu.modes.forEach((m, i) => {
        const x = 300 + i * 400;
        S.figure("sitUp", x, 440, 0.55, { seed: 6 + i });
        // the cube sits beside her, open, and asks a question back
        S.solid("cube", x + 120, 420, 34, { yaw: 0.5, pitch: 0.4, a: 0.8, seed: 70 + i, k: 0.75 });
        S.label("?", x + 120, 350, { size: 34, font: "display", align: "center" });
        S.label(m.who, x, 480, { size: 13, align: "center" });
        S.label(m.date, x, 498, { size: 11.5, align: "center" });
      });
      S.line([[60, 442], [940, 440]], { w: 1, a: 0.45, seed: 2 });
      S.label("designs that make you decide first reduce over-reliance, and people rate them lowest", 500, 580, { size: 12, align: "center", width: 560, narrow: "decide first: less over-reliance, less liked" });
      S.restore();
    }
  }, {
    tip: $("#tip-tutor"),
    spots: (st) => st.idx === 0 ? [{ key: "cube", x: choice ? 720 : 640, y: FY - 60, r: 90, tip: choice === "answer" ? "Plain ChatGPT, asked for answers: practice +48%, exam −17% against students who never had it." : choice === "hint" ? "The same model, prompted with the teachers' hints and told not to give answers: practice +127%, exam about the same as never having used it." : "Same model, two prompts. Choose below the drawing.", src: "C6", href: "c4" }] : []
  });
  E.scrollyById("sc-tutor").stage = st;
  E.scrollyById("sc-tutor").onStep = (i) => { if (i === 0 && userChoice == null) choose(null, false); if (i > 0 && userChoice == null && !choice) choose("hint", false); };
})();

/* ================= CODA ================= */
(function coda() {
  const E = window.Essay, W = window.Wash, M = window.Scenes;
  const $ = E.$;
  const cv = $("#cv-coda"); if (!cv) return;
  const st = E.makeStage(cv, 560, 300, (S, st) => {
    S.line([[30, 262], [530, 260]], { w: 1, a: 0.4, seed: 1 });
    S.figure("sit", 150, 258, 0.58, { seed: 1 });
    // the cube sits on the paper beside her, her head clear
    S.solid("cube", 420, 200, 48, { yaw: 0.6, pitch: 0.42, a: 0.95, seed: 2 });
  }, { alive: false });
  st.invalidate();
})();
