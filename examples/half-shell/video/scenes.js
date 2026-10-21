/* The Half Shell · the explainer's scenes, drawn with the essay's watercolour engine
   (lib/wc.js, lib/things.js) and its vignettes. Numbers from the essay's data.js / report. */
(function () {
  "use strict";
  const W = window.WC, T = window.Things, D = window.DATA;
  const { wash, mat, blobPts, circlePts, smoothClosed, smoothOpen, stroke, contour, rimGloss, fleck, shadow, rng, mix, rgba } = W;

  /* ---------- vignettes, as in the essay (local coords around 0,0) ---------- */
  function porter(g) {
    mat(g, smoothClosed([[-320, -200], [240, -250], [330, -20], [280, 240], [-250, 250], [-330, 30]], 8), { seed: 33, nblooms: 1 });
    const np = [[-250, -150], [60, -175], [85, 165], [-230, 185]];
    shadow(g, np, { dx: -8, dy: 10, a: 0.35 });
    wash(g, np, { color: "#efe6d2", mottle: 0.2, mscale: 0.6, edge: 3, edgeColor: "#bfb194", seed: 8 });
    for (let i = 0; i < 13; i++) { const y = -130 + i * 23; stroke(g, [[-225 + (i % 3) * 4, y + i * 0.6], [55 - (i % 4) * 14, y - 6 + i * 0.6]], { w: 4, color: "#a59a86", a: 0.45, taper: false }); }
    [[-150, -60, 1.25, 0.4], [-40, -80, 1.2, -0.3], [-150, 70, 1.2, 2.8], [-30, 60, 1.25, 2.2]].forEach(([x, y, s, rt], i) => T.oyster(g, x, y, s, rt, { species: "flat", seed: 90 + i * 5 }));
    const cx = 185, cy = -10;
    shadow(g, circlePts(cx, cy, 92), { dx: -10, dy: 12, a: 0.45 });
    wash(g, [[cx + 70, cy - 22], [cx + 140, cy - 18], [cx + 140, cy + 18], [cx + 70, cy + 22]], { color: "#9aa3a8", mottle: 0.2, edge: 2, edgeColor: "#5f686e", seed: 3 });
    wash(g, circlePts(cx, cy, 92), { color: "#a7b0b5", mottle: 0.25, mscale: 0.8, edge: 3, edgeColor: "#626c73", seed: 4, glaze: { pts: circlePts(cx + 14, cy - 12, 92), invert: true, color: "#6d777e", a: 0.55 } });
    wash(g, circlePts(cx + 2, cy + 1, 74), { color: "#3a2a22", mottle: 0.15, edge: 2, seed: 5 });
    wash(g, blobPts(cx + 2, cy + 1, 62, 60, { wob: 0.08, seed: 3 }), { color: "#e1cba5", mottle: 0.25, kind: "gran", edge: 2, edgeColor: "#b89a6c", seed: 6 });
    rimGloss(g, cx, cy, 86, 86, Math.PI * 0.5, Math.PI * 1.15, { w: 3.2, seed: 3 });
  }
  function cellar(g) {
    mat(g, smoothClosed([[-310, -230], [280, -230], [330, 60], [230, 250], [-280, 230], [-330, -10]], 8), { seed: 44, nblooms: 1 });
    T.dish(g, -40, 30, 190, { seed: 3 });
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, R = i % 2 ? 120 : 95; T.oyster(g, -40 + Math.cos(a) * R * 0.95, 30 + Math.sin(a) * R * 0.9, 1.15, a - Math.PI / 2, { species: "eastern", seed: 110 + i * 3 }); }
    T.oyster(g, -40, 30, 1.25, 0.3, { species: "eastern", seed: 140 });
    const lx = 215, ly = -130;
    g.save(); g.filter = "blur(26px)"; g.fillStyle = "rgba(240,110,70,.45)"; g.beginPath(); g.arc(lx, ly, 110, 0, 7); g.fill(); g.restore();
    wash(g, circlePts(lx, ly, 62), { color: "#d2452e", mottle: 0.15, edge: 4, edgeColor: "#8e2618", seed: 7, glaze: { pts: circlePts(lx + 12, ly - 12, 62), invert: true, color: "#a5301f", a: 0.5 } });
    wash(g, blobPts(lx - 18, ly - 18, 24, 18, { wob: 0.2, seed: 2 }), { color: "#f7a27e", a: 0.8, mottle: 0, edge: 0, soft: 6 });
    fleck(g, lx - 24, ly - 26, 8, { rot: -0.6, flat: 0.4 });
    T.tag(g, 130, 150, 1.8, -0.1, { w: 80, h: 44, seed: 9 });
  }
  function closed(g) {
    wash(g, blobPts(0, 10, 320, 240, { wob: 0.14, seed: 8 }), { color: "#8a8f7e", mottle: 0.45, kind: "wet", mscale: 1, mottleColor: "#5e6455", edge: 6, edgeColor: "#555b4c", seed: 8 });
    const r = rng(17);
    for (let i = 0; i < 16; i++) T.oyster(g, (r() - 0.5) * 460, (r() - 0.5) * 300 + 20, 0.9 + r() * 0.4, r() * 6.28, { species: "eastern", shut: true, seed: 160 + i, shadowA: 0.2 });
    g.save(); g.fillStyle = "rgba(110,118,96,.35)"; W.path(g, blobPts(0, 10, 300, 225, { wob: 0.14, seed: 8 })); g.fill(); g.restore();
    shadow(g, [[130, -180], [320, -180], [320, -96], [130, -96]], { dx: -8, dy: 10, a: 0.45 });
    wash(g, [[130, -180], [320, -178], [318, -96], [132, -98]], { color: "#efe4cc", mottle: 0.25, kind: "streak", edge: 3, edgeColor: "#a99474", line: { color: "#7d6a4e", w: 1 }, seed: 4 });
  }
  function today(g) {
    mat(g, smoothClosed([[-300, -220], [260, -240], [320, 30], [250, 240], [-270, 230], [-330, 0]], 8), { seed: 55, nblooms: 1 });
    T.dish(g, -30, 20, 200, { bands: false, seed: 6 });
    T.ice(g, blobPts(-26, 16, 148, 148, { wob: 0.05, seed: 3 }), { seed: 9, size: 13 });
    T.oyster(g, -30, 18, 2.2, 0.4, { species: "eastern", seed: 201 });
    T.lemon(g, 70, 115, 1.1, -0.6, { seed: 4 });
    T.tag(g, 150, -150, 2.0, 0.18, { w: 84, h: 44, seed: 12, string: [[90, -170], [40, -130]] });
  }
  function coin(g, x, y, r = 16, seed = 1) {
    shadow(g, circlePts(x, y, r, r, 28), { dx: -2, dy: 3, blur: 2, a: 0.35 });
    wash(g, circlePts(x, y, r, r, 28), { color: "#c4cbd0", mottle: 0.15, mscale: 0.4, edge: 2, edgeColor: "#7d8a94", soft: 0, seed, glaze: { pts: circlePts(x + r * 0.25, y - r * 0.25, r, r, 28), invert: true, color: "#98a4ad", a: 0.55 } });
    contour(g, circlePts(x, y, r * 0.72, r * 0.72, 24), { color: "#8c98a2", w: 0.8, a: 0.6 });
    rimGloss(g, x, y, r * 0.86, r * 0.86, Math.PI * 0.55, Math.PI * 1.1, { w: 1.6, dash: 0.3, seed });
  }
  function clockFace(g) {
    const R = 105;
    shadow(g, circlePts(0, 0, R + 8), { dx: -8, dy: 10, a: 0.45 });
    wash(g, circlePts(0, 0, R + 8), { color: "#c9573f", mottle: 0.2, edge: 3, edgeColor: "#8e2d1f", seed: 3 });
    wash(g, circlePts(0, 0, R - 4), { color: "#fbf7ec", mottle: 0.05, edge: 3, edgeColor: "#d8cdb6", seed: 4, glaze: { pts: circlePts(14, -12, R - 4), invert: true, color: "#e6dccb", a: 0.6 } });
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; const r0 = i % 3 ? 84 : 76; stroke(g, [[Math.cos(a) * r0, Math.sin(a) * r0], [Math.cos(a) * 92, Math.sin(a) * 92]], { w: i % 3 ? 2 : 4, color: "#2b3440", a: 0.8, taper: false }); }
    rimGloss(g, 0, 0, R + 2, R + 2, Math.PI * 0.55, Math.PI * 1.1, { w: 3, seed: 2 });
  }
  function hands(g, x, y, s, mins) {
    const hA = ((4 + mins / 60) / 12) * Math.PI * 2 - Math.PI / 2, mA = (mins / 60) * Math.PI * 2 - Math.PI / 2;
    stroke(g, [[x, y], [x + Math.cos(hA) * 55 * s, y + Math.sin(hA) * 55 * s]], { w: 6 * s, color: "#2b3440", a: 0.9 });
    stroke(g, [[x, y], [x + Math.cos(mA) * 82 * s, y + Math.sin(mA) * 82 * s]], { w: 4 * s, color: "#2b3440", a: 0.9 });
    wash(g, circlePts(x, y, 6 * s), { color: "#c9573f", mottle: 0, edge: 1, soft: 0 });
  }
  function crate(g) {
    const pts = [[-120, -70], [120, -70], [120, 70], [-120, 70]];
    shadow(g, pts, { dx: -8, dy: 10, a: 0.4 });
    wash(g, pts, { color: "#c99a62", mottle: 0.35, kind: "streak", edge: 3, edgeColor: "#8a6236", seed: 5 });
    wash(g, [[-104, -56], [104, -56], [104, 56], [-104, 56]], { color: "#8f6a42", mottle: 0.2, edge: 2, seed: 6 });
    const r = rng(4);
    for (let i = 0; i < 6; i++) T.oyster(g, -70 + (i % 3) * 70, -22 + Math.floor(i / 3) * 46, 0.85, r() * 6, { species: "eastern", shut: true, seed: 300 + i, shadowA: 0.3 });
    for (const y of [-34, 6, 46]) wash(g, [[-120, y - 7], [120, y - 7], [120, y + 7], [-120, y + 7]], { color: "#d5a76d", a: 0.95, mottle: 0.3, kind: "streak", edge: 2, edgeColor: "#8a6236", seed: y + 50 });
  }
  function sack(g) {
    const pts = blobPts(0, 0, 120, 75, { wob: 0.12, seed: 7 });
    shadow(g, pts, { dx: -8, dy: 10, a: 0.4 });
    wash(g, pts, { color: "#8c9a6c", mottle: 0.3, edge: 3, edgeColor: "#55623e", seed: 7 });
    const r = rng(8);
    for (let i = 0; i < 7; i++) T.oyster(g, -75 + r() * 150, -35 + r() * 70, 0.75, r() * 6, { species: "pacific", shut: true, seed: 320 + i, shadowA: 0.2 });
    g.save(); W.path(g, pts); g.clip(); g.strokeStyle = "rgba(60,72,40,.55)"; g.lineWidth = 1.6;
    for (let k = -200; k < 200; k += 16) { g.beginPath(); g.moveTo(k, -90); g.lineTo(k + 120, 90); g.stroke(); g.beginPath(); g.moveTo(k + 120, -90); g.lineTo(k, 90); g.stroke(); }
    g.restore();
  }
  const fin = (g, w, h) => W.finish(g, w, h, { transparent: true, bloom: 0, warmA: 0.3, haze: 0.08 });
  // a vignette as a lit sprite centred at (cx, cy), scale s
  const vig = (S, key, fn, cx, cy, s, w = 720, h = 620) => S.spr(key, cx - (w / 2) * s, cy - (h / 2) * s, w * s, h * s, (g) => { g.translate(cx, cy); g.scale(s, s); fn(g); g.setTransform(1, 0, 0, 1, -(cx - (w / 2) * s), -(cy - (h / 2) * s)); fin(g, w * s, h * s); });

  /* ---------- platter positions (scene 1) ---------- */
  const PC = { x: 1190, y: 560 };
  const SP = { wellfleet: "eastern", islandcreek: "eastern", malpeque: "eastern", rappahannock: "eastern", gulf: "eastern", kumamoto: "kumamoto", hamahama: "pacific", kusshi: "kumamoto", olympia: "kumamoto", belon: "flat", verte: "pacific", sydney: "eastern" };
  const SZ = { kusshi: 1.75, olympia: 1.4, kumamoto: 1.7, belon: 1.9, sydney: 1.8 };
  const SPOTS = D.platter.map((o, i) => {
    const outer = i < 8, n = outer ? 8 : 4, k = outer ? i : i - 8;
    const a = (k / n) * Math.PI * 2 + (outer ? -Math.PI / 2 : Math.PI / 4), R = outer ? 268 : 128;
    return { o, x: PC.x + Math.cos(a) * R * 1.02, y: PC.y + Math.sin(a) * R * 0.95, rot: a - Math.PI / 2 + (i % 2 ? 0.12 : -0.1), s: (SZ[o.id] || 2.15) };
  });

  const scenes = [
    // 1 · a jar of the sea: the platter fills, one oyster at a time
    (x) => {
      const { S } = x;
      S.blit(S.lit("s1-base", 640, 60, 1180, 1000, (g) => {
        mat(g, smoothClosed([[700, 140], [1300, 80], [1760, 200], [1800, 600], [1700, 1000], [1150, 1040], [720, 960], [660, 560]], 8), { seed: 7, nblooms: 2 });
        T.platter(g, PC.x, PC.y, 410, 388); T.ice(g, blobPts(PC.x + 3, PC.y - 3, 362, 340, { wob: 0.04, seed: 2, n: 140 }), { seed: 5, size: 19 });
      }));
      SPOTS.forEach((sp, i) => {
        const k = x.eOut(x.seg(x.t, x.s + 0.1 + i * 0.12, x.s + 1.0 + i * 0.12));
        if (k <= 0) return;
        const spr = S.lit("s1-oy" + i, sp.x - 130, sp.y - 140, 260, 280, (g) => T.oyster(g, sp.x, sp.y, sp.s, sp.rot, { species: SP[sp.o.id], seed: 3 + i * 7, green: sp.o.id === "verte", mood: sp.o.id === "wellfleet" ? "smile" : null }));
        S.blit(spr, 0, -18 * (1 - k), k);
      });
      const km = x.eOut(x.seg(x.t, x.s + 1.4, x.s + 2.4));
      S.blit(S.lit("s1-mig", PC.x - 70, PC.y - 70, 140, 140, (g) => T.mignonette(g, PC.x, PC.y, 1.3)), 0, 0, km);
      S.blit(S.lit("s1-gl", 1600, 40, 300, 260, (g) => T.glass(g, 1740, 160, 1.9, { kind: "coupe" })), 0, 0, km);
      x.kword("ink", "a little jar", 420, 440, x.word("little") - 0.3, { size: 76 });
      x.kword("ink", "of the sea", 420, 530, x.word("sea") - 0.3, { size: 76 });
      const td = x.word("different");
      x.kword("muted", "twelve oysters", 420, 660, td - 0.3, { size: 36, font: "mono" });
      x.kword("muted", "twelve waters", 420, 708, td, { size: 36, font: "mono" });
      if (x.t > td) SPOTS.forEach((sp, i) => S.sparkle(sp.x + 32, sp.y - 40, 10, 0.5 + 0.5 * Math.sin(x.t * 2 + i)));
      x.hot(PC.x - 400, PC.y - 380, 800, 760, "Twelve oysters from twelve waters: Wellfleet, Island Creek, Malpeque, Rappahannock, Apalachicola, Kumamoto, Hama Hama, Kusshi, Olympia, Belon, Marennes green and Sydney rock.", "Why do oysters from different places taste different?");
    },
    // 2 · food of the poor: porter and oysters in London; 6¢ in New York
    (x) => {
      const { S } = x, ty = x.word("york");
      const a = x.eOut(x.seg(x.t, x.s - 0.1, x.s + 1.0)), b = x.eOut(x.seg(x.t, ty - 0.4, ty + 0.7));
      S.blit(vig(S, "s2-porter", porter, 520, 520, 1.15), 0, 30 * (1 - a), a);
      S.blit(vig(S, "s2-cellar", cellar, 1400, 520, 1.15), 40 * (1 - b), 0, b);
      x.kword("ink", "food for the poor", 520, 920, x.word("poor") - 0.3, { size: 60 });
      const t6 = x.word("six");
      x.kword("ink", "6¢", 1400 + 202 * 1.15, 520 + 145 * 1.15, t6 - 0.25, { size: 84 });
      x.kword("muted", "all you can eat", 1400, 920, t6 + 0.4, { size: 40, font: "mono" });
      x.hot(1100, 250, 600, 560, "New York's oyster cellars, marked by red globes, sold the 'Canal Street Plan': all you could eat for 6 cents.", "What was the Canal Street Plan?");
    },
    // 3 · closed, then costly
    (x) => {
      const { S } = x, tn = x.word("now");
      const a = x.eOut(x.seg(x.t, x.s - 0.1, x.s + 1.0)), b = x.eOut(x.seg(x.t, tn - 0.4, tn + 0.8));
      S.blit(vig(S, "s3-closed", closed, 540, 520, 1.15), 0, 30 * (1 - a), a);
      x.kword("ink", "CONDEMNED", 540 + 225 * 1.15, 520 - 137 * 1.15 + 12, x.word("sewage"), { size: 34, font: "mono" });
      x.kword("ink", "1927", 540, 900, x.word("nineteen") - 0.3, { size: 96 });
      x.kword("muted", "the last New York bed", 540, 960, x.word("nineteen") + 0.3, { size: 34, font: "mono" });
      S.blit(vig(S, "s3-today", today, 1400, 520, 1.15), 40 * (1 - b), 0, b);
      x.kword("ink", "$3.34", 1400 + 232 * 1.15, 520 - 132 * 1.15, x.word("dollars") - 0.5, { size: 68 });
      x.kword("muted", "average US oyster today", 1400, 900, x.word("dollars"), { size: 34, font: "mono" });
      x.hot(1100, 250, 600, 560, "In 2021 menus, a US restaurant oyster averaged about $3.34 if grown on the East Coast and $3.71 from the West Coast.", "Why are oysters so expensive now?");
    },
    // 4 · a dollar at five: the twenty nickels
    (x) => {
      const { S } = x, t5 = x.word("five"), td = x.word("dollar"), t77 = x.word("seventy"), tsh = x.word("shucker");
      S.blit(S.lit("s4-base", 600, 120, 820, 560, (g) => { mat(g, smoothClosed([[680, 200], [1250, 150], [1340, 380], [1260, 620], [700, 620], [620, 400]], 8), { seed: 61, nblooms: 1 }); T.dish(g, 980, 390, 165, { seed: 8 }); T.oyster(g, 980, 390, 3.0, 0.5, { species: "eastern", seed: 222 }); }));
      S.blit(S.lit("s4-tag", 1120, 160, 300, 180, (g) => T.tag(g, 1170, 240, 2.4, 0.12, { w: 80, h: 44, seed: 3, string: [[1140, 270], [1100, 310]] })));
      x.kword("ink", x.t < t5 ? "$3–4" : "$1", 1270, 262, x.t < t5 ? x.s : t5, { size: 70 });
      S.blit(S.lit("s4-clock", 230, 150, 320, 320, (g) => { g.translate(390, 310); g.scale(1.3, 1.3); clockFace(g); }));
      const mins = -1 + x.eInOut(x.seg(x.t, t5 - 0.3, t5 + 0.6));
      S.g.save(); S.g.globalAlpha = S.alphaNow(); hands(S.g, 390, 310, 1.3, mins); S.g.restore();
      x.kword("ink", x.t < t5 ? "4:59" : "5:00 · happy hour", 390, 520, x.t < t5 ? x.s : t5, { size: 40, font: "mono" });
      // nickels: 20 = $1
      const nick = S.spr("s4-coin", -26, -26, 52, 52, (g) => coin(g, 0, 0, 22, 4));
      const split = x.eInOut(x.seg(x.t, t77 + 1.0, t77 + 2.2)), leave = x.eInOut(x.seg(x.t, tsh - 0.2, tsh + 1.0));
      const dIn = x.eOut(x.seg(x.t, t77 + 0.6, t77 + 1.6));
      S.blit(S.lit("s4-crate", 380, 790, 360, 240, (g) => { g.translate(560, 910); g.scale(1.25, 1.25); crate(g); g.setTransform(1, 0, 0, 1, -380, -790); }), 0, 20 * (1 - dIn), dIn);
      S.blit(S.lit("s4-sack", 790, 800, 340, 220, (g) => { g.translate(960, 910); g.scale(1.25, 1.25); sack(g); g.setTransform(1, 0, 0, 1, -790, -800); }), 0, 20 * (1 - dIn), dIn);
      S.blit(S.lit("s4-knife", 1350, 860, 380, 140, (g) => T.knife(g, 1540, 930, 1.6, -0.15)), 0, 0, leave);
      for (let i = 0; i < 20; i++) {
        const k = x.eOut(x.seg(x.t, t77 - 0.2 + i * 0.08, t77 + 0.5 + i * 0.08));
        if (k <= 0) continue;
        let px = 560 + i * 42, py = 720 - 16 * (1 - k);
        const tx = i < 15 ? (i < 11 ? 460 + (i % 6) * 40 : 880 + (i - 11) * 40) : 1420 + (i - 15) * 40, ty = i < 15 ? (i < 11 ? 860 + Math.floor(i / 6) * 40 : 880) : 930;
        px += (tx - px) * (i < 15 ? split : leave); py += (ty - py) * (i < 15 ? split : leave);
        S.blit(nick, px, py, k * (i >= 15 ? 1 - 0.7 * leave : 1));
      }
      x.kword("muted", "the bar pays ~77¢", 760, 1040, t77 + 1.4, { size: 36, font: "mono" });
      x.kword("accent", "loses money", 1540, 820, x.word("loses") - 0.3, { size: 52 });
      x.hot(860, 260, 260, 260, "A New York fish bar in 2019 paid about 77–80¢ per oyster and sold them for $1–1.50 at happy hour; with shucking labour that loses money.", "How can bars afford dollar oysters?");
    },
    // 5 · the drinks pay: the seats fill, each with a glass, the coins go to the bar
    (x) => {
      const { S } = x, tse = x.word("seats"), tdr = x.word("drinks"), tpa = x.word("pay");
      S.blit(S.lit("s5-mat", 160, 220, 1600, 640, (g) => mat(g, smoothClosed([[220, 300], [960, 250], [1700, 300], [1720, 560], [1650, 800], [960, 840], [240, 800], [200, 560]], 8), { seed: 77, blooms: false })));
      const kinds = ["martini", "coupe", "stout", "martini"];
      for (let i = 0; i < 4; i++) {
        const cx = 400 + i * 380, k = x.eOut(x.seg(x.t, (i ? tse - 0.3 : x.s - 0.1) + i * 0.25, (i ? tse + 0.7 : x.s + 0.9) + i * 0.25));
        S.blit(S.lit("s5-d" + i, cx - 150, 400, 300, 300, (g) => { T.dish(g, cx, 550, 120, { seed: 30 + i }); T.oyster(g, cx, 550, 2.0, 0.4 + i, { species: "eastern", seed: 520 + i }); }), 0, -20 * (1 - k), k);
        const kg = x.eOut(x.seg(x.t, tdr - 0.3 + i * 0.15, tdr + 0.6 + i * 0.15));
        S.blit(S.lit("s5-g" + i, cx + 20, 250, 260, 240, (g) => T.glass(g, cx + 140, 370, 2.1, { kind: kinds[i] })), 20 * (1 - kg), 0, kg);
      }
      const nick = S.spr("s4-coin", -26, -26, 52, 52, (g) => coin(g, 0, 0, 22, 4));
      for (let i = 0; i < 24; i++) { const k = x.eOut(x.seg(x.t, tpa - 0.2 + i * 0.06, tpa + 0.5 + i * 0.06)); if (k > 0) S.blit(nick, 1480 + (i % 6) * 40, 960 - Math.floor(i / 6) * 16 - 16 * (1 - k), k); }
      x.kword("ink", "a loss leader", 640, 960, x.word("trick") - 0.3, { size: 60 });
      x.kword("accent", "the drinks pay", 1580, 900, tpa - 0.3, { size: 52 });
      x.hot(220, 300, 1500, 500, "Bars call it a loss leader: the dollar oyster brings people in, and martinis, entrées and tips pay for it. Saloons did the same with a salty 'free lunch' in the 1800s.", "Where did the free lunch come from?");
    },
    // 6 · salt and taurine: a magnifier on the cells; the water grows saltier, the cells fill
    (x) => {
      const { S } = x, L = { x: 1290, y: 470, r: 330 };
      S.blit(S.lit("s6-oy", 120, 120, 760, 860, (g) => { mat(g, smoothClosed([[160, 220], [760, 150], [860, 520], [780, 940], [200, 960], [130, 560]], 8), { seed: 71, nblooms: 1 }); T.oyster(g, 500, 540, 6.0, -0.35, { species: "pacific", seed: 401 }); }));
      const ts = x.word("salt"), tsa = x.word("saltier");
      const ppt = 8 + 27 * x.eInOut(x.seg(x.t, ts, tsa + 0.4));
      const lin = x.eOut(x.seg(x.t, x.s, x.s + 1.0));
      S.line("ink", [[590, 470], [590 + (L.x - L.r - 590) * lin, 470]], 2.4, { a: 0.7 });
      const water = mix("#b9c4a0", "#5d86ad", (ppt - 5) / 30);
      S.blit(S.spr("s6-shadow", L.x - L.r - 40, L.y - L.r - 20, 2 * L.r + 80, 2 * L.r + 80, (g) => shadow(g, circlePts(L.x, L.y, L.r, L.r, 120), { dx: -12, dy: 14, a: 0.35 })), 0, 0, lin);
      const g = S.g; g.save(); g.globalAlpha = S.alphaNow() * lin;
      wash(g, circlePts(L.x, L.y, L.r, L.r, 120), { color: water, mottle: 0.25, edge: 8, edgeColor: mix(water, "#1e3550", 0.4), soft: 0, seed: 3 });
      g.save(); W.path(g, circlePts(L.x, L.y, L.r, L.r, 120)); g.clip();
      const cellSp = S.spr("s6-cell", -48, -42, 96, 84, (g2) => wash(g2, blobPts(0, 0, 44, 38, { wob: 0.1, seed: 5, n: 40 }), { color: "#f6efe0", a: 0.94, mottle: 0.12, mscale: 0.4, edge: 3, edgeColor: "#c9b99a", soft: 0, seed: 5 }));
      const n = Math.round((ppt / 35) * 16), DOT = ["#2f6a8c", "#d8573b", "#e3b42f", "#7aa04e"], r = rng(21);
      for (let row = -3; row <= 3; row++) for (let c = -3; c <= 3; c++) {
        const cx = L.x + c * 100 + (row % 2 ? 50 : 0), cy = L.y + row * 88;
        const dots = []; for (let k = 0; k < 16; k++) { const a = r() * 6.28, d = Math.sqrt(r()) * 30; dots.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.85, k % 5 === 4 ? 1 + (k % 3) : 0]); }
        if (Math.hypot(cx - L.x, cy - L.y) > L.r - 30) continue;
        W.blit(g, cellSp, cx, cy, 1);
        for (let k = 0; k < n; k++) { const [px, py, kind] = dots[k]; g.fillStyle = DOT[kind]; g.beginPath(); g.arc(px, py, 5.5, 0, 7); g.fill(); }
      }
      g.restore();
      contour(g, circlePts(L.x, L.y, L.r, L.r, 120), { w: 13, color: "#c9a25a", a: 0.95 });
      rimGloss(g, L.x, L.y, L.r, L.r, Math.PI * 0.55, Math.PI * 1.1, { w: 5 });
      g.restore();
      S.text("ink", `${Math.round(ppt)} ppt`, L.x, L.y + L.r + 80, { size: 56, a: lin });
      S.text("muted", ppt < 14 ? "brackish · bland" : ppt < 27 ? "saltier" : "ocean · savoury", L.x, L.y + L.r + 128, { size: 34, font: "mono", a: lin });
      x.kword("ink", "taurine ≈ 80%", L.x, 82, x.word("taurine") - 0.3, { size: 52 });
      x.hot(L.x - L.r, L.y - L.r, 2 * L.r, 2 * L.r, "Oysters are osmoconformers: they fill their cells with free amino acids to match the salt in the water. Taurine is about 80% of them; glycine, alanine and glutamate add sweetness and umami.", "Why do saltier oysters taste more savoury?");
    },
    // 7 · merroir: the map, region by region
    (x) => {
      const { S } = x, P = { lon: [-128, -57], lat: [23.5, 52.5], x: 110, y: 110, w: 1700, h: 880 };
      const cl = Math.cos((38 * Math.PI) / 180), sc = Math.min(P.w / ((P.lon[1] - P.lon[0]) * cl), P.h / (P.lat[1] - P.lat[0]));
      const ow = (P.lon[1] - P.lon[0]) * cl * sc, oh = (P.lat[1] - P.lat[0]) * sc, ox = P.x + (P.w - ow) / 2, oy = P.y + (P.h - oh) / 2;
      const pr = (lon, lat) => [ox + (lon - P.lon[0]) * cl * sc, oy + (P.lat[1] - lat) * sc];
      S.blit(S.lit("s7-map", ox - 20, oy - 20, ow + 40, oh + 40, (g) => {
        const sea = []; for (let i = 0; i < 120; i++) { const a = (i / 120) * 6.283, ux = Math.cos(a), uy = Math.sin(a), k = 1 / Math.pow(Math.pow(Math.abs(ux), 6) + Math.pow(Math.abs(uy), 6), 1 / 6); sea.push([ox + ow / 2 + ux * k * (ow / 2 + 8), oy + oh / 2 + uy * k * (oh / 2 + 8)]); }
        mat(g, sea, { seed: 6, nblooms: 2, edge: 8 });
        g.save(); W.path(g, sea); g.clip();
        for (const iso of ["USA", "CAN", "MEX", "CUB", "BHS", "GTM", "BLZ", "HND"]) for (const ring of window.GEO[iso] || []) if (ring.length >= 4) wash(g, ring.map(([lo, la]) => pr(lo, la)), { color: "#f6e8cc", mottle: 0.04, edge: 3, edgeColor: "#c4a576", edgeA: 0.7, soft: 0, seed: 3 });
        for (const iso of ["USA", "CAN", "MEX"]) for (const ring of window.GEO[iso] || []) if (ring.length >= 4) contour(g, ring.map(([lo, la]) => pr(lo, la)), { w: 1.4, color: "#8a6a40", a: 0.5, jit: 0.2 });
        g.restore();
      }));
      const groups = [
        { w: "briny", col: "#2f6a8c", ids: ["malpeque", "wellfleet", "islandcreek", "moonstone", "bluepoint"], lab: "briny", at: [1430, 300] },
        { w: "mild", col: "#e3b42f", ids: ["rappahannock", "apalachicola"], lab: "mild, sweet", at: [1130, 760] },
        { w: "cucumber", col: "#7aa04e", ids: ["kusshi", "hamahama", "totten"], lab: "cucumber, melon", at: [560, 300] }
      ];
      groups.forEach((gr) => {
        const t0 = x.word(gr.w);
        gr.ids.forEach((id, j) => {
          const pl = D.places.find((p) => p.id === id), [px, py] = pr(pl.lon, pl.lat), k = x.eOut(x.seg(x.t, t0 - 0.3 + j * 0.12, t0 + 0.5 + j * 0.12));
          if (k > 0) S.mark(gr.col, px, py, 16 * k);
        });
        x.kword("ink", gr.lab, gr.at[0], gr.at[1], t0 - 0.2, { size: 54 });
        { const kd = x.eOut(x.seg(x.t, t0 - 0.2, t0 + 0.4)); if (kd > 0) S.mark(gr.col, gr.at[0] - S.measure(gr.lab, 54) / 2 - 30, gr.at[1] - 18, 14 * kd); }
      });
      x.hot(ox, oy, ow, oh, "Same species, different water: cold ocean-fed bays give briny oysters, the brackish Chesapeake and warm Gulf give mild ones, and Pacific-coast oysters bring cucumber and melon notes.", "What is merroir?");
    },
    // 8 · months with an R: the plate as a year
    (x) => {
      const { S } = x, C = { x: 820, y: 540 }, ang = (m) => -Math.PI / 2 + (m / 12) * Math.PI * 2;
      const ring = (g, m0, m1, r0, r1, color, a, seed) => { const pts = []; for (let m = m0; m <= m1 + 1e-6; m += 0.1) pts.push([C.x + Math.cos(ang(m)) * r1, C.y + Math.sin(ang(m)) * r1]); for (let m = m1; m >= m0 - 1e-6; m -= 0.1) pts.push([C.x + Math.cos(ang(m)) * r0, C.y + Math.sin(ang(m)) * r0]); wash(g, pts, { color, a, mottle: 0.15, mscale: 0.6, edge: 2.5, soft: 0, seed }); };
      S.blit(S.lit("s8-base", 260, 0, 1120, 1080, (g) => {
        mat(g, smoothClosed([[330, 60], [1300, 40], [1360, 540], [1300, 1040], [340, 1050], [280, 540]], 8), { seed: 81, blooms: false });
        T.dish(g, C.x, C.y, 440, { bands: false, seed: 21 });
        for (let i = 0; i < 12; i++) ring(g, i + 0.04, i + 0.96, 380, 424, i >= 4 && i <= 7 ? "#e7a07f" : "#7f9fc3", 0.9, i);
      }));
      const tp = x.word("plumpest"), tsp = x.word("spawn"), tm = x.word("milky"), tv = x.word("vibrio");
      const keys = [[x.s, 0.5], [tp, 3.6], [tsp + 0.3, 6.3], [tm + 0.2, 7.3], [tv + 0.3, 9.6]];
      let m = keys[0][1]; for (let i = 0; i < keys.length - 1; i++) if (x.t > keys[i][0]) m = keys[i][1] + (keys[i + 1][1] - keys[i][1]) * x.eInOut(x.seg(x.t, keys[i][0], keys[i + 1][0]));
      const ks = x.eOut(x.seg(x.t, tsp - 0.3, tsp + 0.9)), kv = x.eOut(x.seg(x.t, tv - 0.3, tv + 0.9));
      if (ks > 0) S.blit(S.lit("s8-sp", 360, 80, 920, 920, (g) => ring(g, 5.05, 8.95, 318, 364, "#f2cd57", 0.95, 31)), 0, 0, ks);
      if (kv > 0) S.blit(S.lit("s8-vb", 360, 80, 920, 920, (g) => ring(g, 4.05, 9.95, 258, 304, "#c9573f", 0.9, 32)), 0, 0, kv);
      const plump = (mm) => { const k = [1.02, 1.04, 1.07, 1.1, 1.12, 1.0, 0.82, 0.74, 0.8, 0.9, 0.96, 1.0]; const i = Math.floor(mm) % 12, f = mm - Math.floor(mm); return k[i] + (k[(i + 1) % 12] - k[i]) * f; };
      const kq = Math.round(plump(m) * 20) / 20;
      S.blit(S.lit("s8-oy" + kq, C.x - 210, C.y - 230, 420, 460, (g) => T.oyster(g, C.x, C.y + 6, 3.2, 0.25, { species: "pacific", seed: 501, k: kq })));
      const milky = x.eOut(x.seg(x.t, tm - 0.3, tm + 0.6)) * (1 - x.seg(x.t, tv + 0.6, tv + 1.6));
      if (milky > 0) { const g = S.g; g.save(); g.globalAlpha = S.alphaNow() * 0.6 * milky; g.filter = "blur(12px)"; g.fillStyle = "#fffdf3"; g.beginPath(); g.ellipse(C.x - 2, C.y + 18, 70, 98, 0.25, 0, 7); g.fill(); g.restore(); }
      const a = ang(m), g = S.g; g.save(); g.globalAlpha = S.alphaNow();
      wash(g, circlePts(C.x + Math.cos(a) * 402, C.y + Math.sin(a) * 402, 20, 20, 30), { color: "#2b3440", mottle: 0, edge: 2, soft: 0 });
      rimGloss(g, C.x + Math.cos(a) * 402, C.y + Math.sin(a) * 402, 13, 13, Math.PI * 0.6, Math.PI * 1.2, { w: 3 }); g.restore();
      ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"].forEach((n, i) => { const aa = ang(i + 0.5); S.text(i >= 4 && i <= 7 ? "#ffd2bd" : "cream", n, C.x + Math.cos(aa) * 470, C.y + Math.sin(aa) * 470 + 12, { size: 36, font: "mono" }); });
      x.kword("ink", "plumpest", 1620, 300, tp - 0.3, { size: 58 });
      x.kword("muted", "before spawning", 1620, 350, tp, { size: 34, font: "mono" });
      x.kword("#b8901c", "milky", 1620, 540, tm - 0.3, { size: 58 });
      x.kword("accent", "Vibrio", 1620, 760, tv - 0.3, { size: 58 });
      x.kword("muted", "May – October", 1620, 810, tv + 0.2, { size: 34, font: "mono" });
      x.hot(C.x - 440, C.y - 440, 880, 880, "Oysters store glycogen through autumn and spring and are sweetest just before spawning; in summer they turn milky, then thin. Vibrio bacteria peak May to October.", "Is the R-month rule still true?");
    },
    // 9 · the priciest: true relative size against a ruler; the King arrives
    (x) => {
      const { S } = x, MM = 3.6, BASE = 880;
      const SPC = { bistro: ["pacific", 58, 330], kumamoto: ["kumamoto", 36, 540], belon: ["flat", 46, 770], gillardeau: ["pacific", 58, 1060], king: ["pacific", 58, 1490] };
      S.blit(S.lit("s9-base", 60, 60, 1820, 960, (g) => {
        mat(g, smoothClosed([[200, 120], [1820, 100], [1850, 560], [1810, 1000], [190, 1010], [160, 560]], 8), { seed: 91, blooms: false });
        const rp = [[90, BASE + 6], [150, BASE + 6], [150, BASE - 200 * MM - 18], [90, BASE - 200 * MM - 18]];
        shadow(g, rp, { dx: -6, dy: 8, a: 0.4 }); wash(g, rp, { color: "#e8c58c", mottle: 0.3, kind: "streak", edge: 2.5, edgeColor: "#a87c44", seed: 4 });
        for (let mm = 0; mm <= 200; mm += 5) { const y = BASE - mm * MM, big = mm % 10 === 0; stroke(g, [[150, y], [150 - (big ? 24 : 12), y]], { w: big ? 2.4 : 1.4, color: "#5a4127", a: 0.85, taper: false }); }
      }));
      S.text("cream", "20 cm", 120, BASE - 200 * MM - 40, { size: 34, font: "mono" });
      const tk = x.word("king"), th = x.word("hundred");
      D.lineup.forEach((o, i) => {
        const [sp, L, cx] = SPC[o.id], len = o.mm * MM, s = len / (2 * L * 1.08), cy = BASE - len / 2 - 8;
        const t0 = o.id === "king" ? tk - 0.4 : x.s + 0.2 + i * 0.5, k = x.eOut(x.seg(x.t, t0, t0 + 1.0));
        if (k <= 0) return;
        S.blit(S.lit("s9-" + o.id, cx - len * 0.45, cy - len * 0.62, len * 0.9, len * 1.24, (g) => T.oyster(g, cx, cy, s, Math.PI, { species: sp, seed: 600 + o.mm })), o.id === "king" ? 220 * (1 - k) : 0, 24 * (1 - k), k);
        const usd = o.usd >= 10 ? `$${Math.round(o.usd)}` : `$${o.usd.toFixed(2)}`;
        S.text("cream", o.id === "king" ? "A$100" : usd, cx, BASE + 70, { size: 48, a: x.seg(x.t, t0 + 0.3, t0 + 0.9) * (o.id === "king" ? x.seg(x.t, th - 0.3, th + 0.2) : 1) });
        S.text("cream", { bistro: "supermarket", kumamoto: "Kumamoto", belon: "Belon flat", gillardeau: "Gillardeau N°2", king: "Coffin Bay King" }[o.id], cx, BASE + 112, { size: 30, font: "mono", a: x.seg(x.t, t0 + 0.3, t0 + 0.9) });
      });
      x.kword("cream", "6–7 years · 1 kg", 1490, 200, x.word("six") - 0.3, { size: 46 });
      x.hot(1250, 200, 500, 700, "Coffin Bay 'King' oysters are left 6–7 years, weigh about 1 kg, measure 18 cm, and sold for A$100 each (2008–2012).", "What is the most expensive oyster in the world?");
    },
    // 10 · a good one: the tray of six; one gapes; a full one; the tag
    (x) => {
      const { S } = x, C = { x: 820, y: 540 };
      const POS = [[640, 400], [820, 385], [1000, 405], [645, 680], [825, 695], [1005, 675]];
      S.blit(S.lit("s10-base", 300, 80, 1040, 920, (g) => { mat(g, smoothClosed([[340, 160], [1260, 120], [1320, 540], [1270, 960], [360, 980], [300, 540]], 8), { seed: 101, blooms: false }); T.platter(g, C.x, C.y, 400, 370, { color: "#c8d1d8" }); T.ice(g, blobPts(C.x + 3, C.y - 3, 350, 320, { wob: 0.04, seed: 3, n: 120 }), { seed: 11, size: 17 }); }));
      const tt = x.word("tight"), tl = x.word("liquor"), tg = x.word("tag");
      const open = x.eOut(x.seg(x.t, x.word("heavy") - 0.2, tl + 0.4));
      POS.forEach(([px, py], i) => {
        const shut = S.lit("s10-s" + i, px - 110, py - 120, 220, 240, (g) => { T.oyster(g, px, py, 1.9, -0.2 + (i % 3) * 0.2, { species: "eastern", shut: true, seed: 700 + i * 9 }); if (i === 4) { const pts = []; for (let a = 0.25; a <= 2.9; a += 0.1) pts.push([px + Math.cos(a - 0.2 + 0.2) * 55, py + Math.sin(a) * 70]); stroke(g, pts, { w: 12, color: "#2c2622", a: 0.85 }); } });
        if (i === 0) { S.blit(shut, 0, 0, 1 - open); if (open > 0) S.blit(S.lit("s10-o0", px - 110, py - 120, 220, 240, (g) => T.oyster(g, px, py, 1.9, -0.2, { species: "eastern", seed: 700, k: 1.12 })), 0, 0, open); }
        else S.blit(shut, 0, 0, 1);
      });
      x.kword("accent", "✕", POS[4][0], POS[4][1] + 12, tt - 0.2, { size: 120, halo: false });
      x.kword("ink", "shut tight", 1560, 330, tt - 0.3, { size: 56 });
      x.kword("ink", "full of liquor", 1560, 470, tl - 0.3, { size: 56 });
      x.kword("ink", "smells of the sea", 1560, 610, x.word("smelling") - 0.3, { size: 56 });
      const kt = x.eOut(x.seg(x.t, tg - 0.4, tg + 0.6));
      if (kt > 0) S.blit(S.lit("s10-tag", 1380, 680, 420, 300, (g) => T.tag(g, 1440, 830, 3.0, -0.08, { w: 90, h: 60, seed: 7 })), 30 * (1 - kt), 0, kt);
      x.kword("ink", "HARVEST TAG", 1580, 820, tg - 0.2, { size: 38, font: "mono" });
      x.kword("muted", "kept 90 days", 1580, 866, tg + 0.2, { size: 30, font: "mono" });
      x.hot(C.x - 400, C.y - 370, 800, 740, "A live oyster is closed or closes when tapped; a good one is heavy, full of liquor and smells like the sea. Harvest tags are kept 90 days after the sack is emptied.", "How do I know an oyster is safe to eat?");
    },
  ];

  function endCard(x) {
    const { S } = x;
    S.blit(S.lit("end-oy", 760, 140, 400, 420, (g) => T.oyster(g, 960, 350, 3.0, 0.3, { species: "pacific", seed: 19, mood: "smile" })));
    S.text("ink", "The Half Shell", 960, 690, { size: 130 });
    S.text("muted", "an illustrated essay on oysters", 960, 760, { size: 40, font: "body" });
  }

  window.EXPLAINER = {
    title: "The Half Shell",
    report: { name: "Sources: The Half Shell research report", url: "http://localhost:8905/report.html" },
    segNames: ["A jar of the sea", "Food of the poor", "Closed, then costly", "A dollar at five", "The drinks pay", "Salt and taurine", "Merroir", "Months with an R", "The priciest", "A good one"],
    poster: 0,
    playhead: '<svg width="20" height="20" viewBox="0 0 20 20"><ellipse cx="10" cy="10.5" rx="6.5" ry="8" fill="#cdc1ab"/><ellipse cx="10" cy="11" rx="4" ry="5" fill="#f1eadc"/></svg>',
    ring(ctx, cx, cy, rx, ry) {
      const pts = []; for (let i = 0; i <= 64; i++) { const a = -0.6 + (i / 64) * Math.PI * 2.08, w = 1 + 0.03 * Math.sin(i * 0.7); pts.push([cx + Math.cos(a) * rx * w, cy + Math.sin(a) * ry * w]); }
      ctx.save(); W.contour(ctx, pts, { color: "#2b3440", w: 3, close: false, a: 0.9 }); ctx.restore();
    },
    async load() {
      const schedule = await (await fetch("schedule.json", { cache: "no-cache" })).json();
      try { await Promise.all(['700 60px "Zen Maru Gothic"', "500 40px Barlow", '500 30px "IBM Plex Mono"'].map((f) => document.fonts.load(f))); } catch (e) {}
      const stage = window.ExplainerStage.Stage({ style: window.makeOysterStyle(document.createElement("canvas")), schedule, scenes, endCard });
      const answer = window.AnswerKit(window.makeOysterStyle(document.createElement("canvas")));
      return { stage, answer, schedule };
    },
  };
  window.__oysterScenes = scenes;
})();
