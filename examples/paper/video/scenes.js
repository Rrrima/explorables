/* Fibre by Fibre · the explainer's scenes, drawn the way the essay draws:
   pen contours with pale watercolour washes, hands, small faces, sparkles,
   cobalt drops, mono labels. Figures from the Fibre by Fibre research report
   (M = material, H = history, R = rendering). */
(function () {
  "use strict";
  const rnd = (seed) => window.Paper.mulberry32(seed);
  // a fixed web of fibres for the close-up
  const WEB = (() => { const r = rnd(5), out = []; for (let i = 0; i < 46; i++) out.push([r() * 440 - 220, r() * 440 - 220, 120 + r() * 200, r() * Math.PI, (r() - 0.5) * 0.9]); return out; })();
  const HOUSE = (() => { const r = rnd(9); return Array.from({ length: 700 }, (_, i) => ({ i, x: 300 + (i % 35) * 21, y: 330 + Math.floor(i / 35) * 21, d: r() })); })();
  const ground = (S, y = 820, a = 0.35) => S.line("ink", [[160, y], [1760, y + 2]], 1.6, { a, seed: 900 });

  const scenes = [
    // 1 · mostly air, held together by water
    (x) => {
      const { S } = x, k = x.eOut(x.seg(x.t, x.s - 0.2, x.s + 0.8));
      if (k > 0) { S.sheet(560, 540, 520, 640, { k, wash: "bark", washA: 0.22, laid: 0.5 * k }); if (k > 0.9) S.face(560, 600, 1.6); }
      const lk = x.eOut(x.seg(x.t, x.word("fibres") - 0.3, x.word("fibres") + 0.6)), cx = 1340, cy = 500, R = 270;
      if (lk > 0) {
        S.leader(660, 430, cx - R * 0.78, cy - R * 0.2, 0.5 * lk);
        S.save(); S.translate(cx, cy); S.scale(lk, lk);
        S.fill("paper", S.ellipse(0, 0, R, R));
        S.fill("sky", S.ellipse(0, 0, R, R), 0.18);
        WEB.forEach(([fx, fy, len, a, bend], i) => { if (Math.hypot(fx, fy) < R - 70) S.fibre(fx, fy, Math.min(len, R * 0.8), a, bend, 2, 0.85, i); });
        const tw = x.word("water");
        if (x.t > tw - 0.2) for (let i = 0; i < 10; i++) { const [fx, fy] = WEB[i * 4]; if (Math.hypot(fx, fy) < R - 70) S.mark("accent", fx, fy, 11 * x.pop(x.seg(x.t, tw - 0.2 + i * 0.06, tw + 0.3 + i * 0.06))); }
        S.line("ink", S.ellipse(0, 0, R, R, 0, 6.2832, 80), 2.6, { seed: 3 });
        S.restore();
      }
      x.kword("ink", "mostly air", cx, cy + R + 90, x.word("air"), { size: 60 });
      x.kword("muted", "held together by water", cx, cy + R + 140, x.word("water"), { size: 28, font: "mono" });
      x.hot(cx - R, cy - R, R * 2, R * 2, "A sheet is a mat of cellulose fibres, mostly air, bonded where water drew them together as it dried (hydrogen bonds).", "How does water hold paper together?");
    },
    // 2 · by hand: beat the bark, lift the sheet
    (x) => {
      const { S } = x, tb = x.word("beat"), tl = x.word("lift");
      ground(S);
      // the board, bark strips fraying into fibres under a mallet
      const fray = x.seg(x.t, tb, tb + 1.6);
      S.line("ink", [[180, 760], [760, 760], [800, 820], [150, 820]], 2.2, { close: true, seed: 21 });
      S.fill("bark", [[180, 760], [760, 760], [800, 820], [150, 820]], 0.35);
      for (let i = 0; i < 5; i++) { const y = 690 + i * 14; if (fray < 0.6) { S.fill("bark", [[240, y - 6], [700, y - 4], [700, y + 6], [240, y + 4]], 0.8 * (1 - fray)); } for (let j = 0; j < Math.round(8 * fray); j++) S.fibre(270 + j * 55, y, 70, 0.08 * Math.sin(i + j), 0.6 * fray, 1.6, 0.8, i * 10 + j); }
      const on = x.t > tb - 0.4 && x.t < tb + 2.2, hit = on ? Math.abs(Math.sin((x.t - tb) * 5)) : 0.2, my = 640 - hit * 110;
      S.save(); S.translate(470, my); S.rotate(-0.12);
      S.fill("bark", [[-80, -40], [80, -40], [80, 30], [-80, 30]], 0.7); S.line("ink", [[-80, -40], [80, -40], [80, 30], [-80, 30]], 2.4, { close: true, seed: 4 });
      S.line("ink", [[80, -6], [300, -14]], 2.4, { seed: 5 }); S.line("ink", [[80, 6], [300, 0]], 2.4, { seed: 6 });
      S.hand(300, -7, -Math.PI / 2, 1.1, -1);
      S.restore();
      if (on && hit > 0.9) { S.sparkle(330, 650, 16); S.sparkle(620, 640, 12); }
      x.kword("ink", "soak, beat", 470, 900, tb, { size: 52 });
      // the vat (with a face, as in the essay) and the screen lifted out of it
      const vx = 1340, lift = x.eOut(x.seg(x.t, tl - 0.2, tl + 1.0)), wy = 600;
      const water = [[1070, wy]]; for (let xx = 1070; xx <= 1610; xx += 20) water.push([xx, wy + Math.sin(xx * 0.03 + x.t * 2) * 4]); water.push([1606, 812], [1074, 812]);
      S.fill("sky", water, 0.75);
      S.line("ink", [[1080, 520], [1600, 520], [1640, 590], [1040, 590]], 2.4, { close: true, seed: 30 });
      S.line("ink", S.spline([[1040, 590], [1050, 700], [1068, 816]], 6).concat(S.spline([[1068, 816], [1340, 822], [1612, 816]], 8)).concat(S.spline([[1612, 816], [1630, 700], [1640, 590]], 6)), 2.4, { seed: 31 });
      S.face(vx, 730 - lift * 6, 1.6, lift > 0.3 ? "o" : "smile");
      const sy = 560 - lift * 300;
      S.fill("paper", [[vx - 220, sy - 70], [vx + 220, sy - 70], [vx + 220, sy + 70], [vx - 220, sy + 70]], 0.95);
      if (lift > 0.2) S.fill("sky", [[vx - 200, sy - 52], [vx + 200, sy - 52], [vx + 200, sy + 52], [vx - 200, sy + 52]], 0.4 * lift);
      S.line("ink", [[vx - 220, sy - 70], [vx + 220, sy - 70], [vx + 220, sy + 70], [vx - 220, sy + 70]], 2.6, { close: true, seed: 33 });
      for (let xx = -160; xx <= 160; xx += 80) S.line("ink", [[vx + xx, sy - 70], [vx + xx, sy + 70]], 1.2, { a: 0.5, seed: xx });
      S.hand(vx - 232, sy, 0.0, 1.0, 1, "grip"); S.hand(vx + 232, sy, 0.0, 1.0, -1, "grip");
      if (lift > 0.5) for (let i = 0; i < 6; i++) S.mark("accent", vx - 180 + i * 72, sy + 90 + ((x.t * 260 + i * 50) % 110), 6, 0.8);
      x.kword("ink", "lift on a screen", vx, 900, tl, { size: 52 });
      x.hot(vx - 260, sy - 90, 520, 180, "The papermaker dips a bamboo screen (su) into a vat of fibres and water, sways it, and lifts out a wet sheet: washi is made this way.", "How is washi made by hand?");
    },
    // 3 · fibre length at true scale
    (x) => {
      const { S } = x, mm = 120, x0 = 360, tk = x.word("kozo"), te = x.word("eucalyptus");
      const kk = x.eOut(x.seg(x.t, tk, tk + 1.2)), ke = x.eOut(x.seg(x.t, te, te + 0.6));
      const fib = (y, len, k, seed) => { if (k <= 0) return; const L = len * k, pts = S.spline([[x0, y], [x0 + L * 0.3, y - 6], [x0 + L * 0.7, y + 5], [x0 + L, y]], 14); S.fill("bark", pts.concat(pts.slice().reverse().map(([a, b]) => [a, b + 12])), 0.6); S.line("ink", pts, 2.2, { seed }); S.line("ink", pts.map(([a, b]) => [a, b + 12]), 1.6, { seed: seed + 1, a: 0.7 }); for (let i = 1; i < L / 70; i++) S.line("ink", [[x0 + i * 70, y + 6], [x0 + i * 70 + 18, y + 22]], 1.1, { a: 0.5, seed: seed + i }); };
      fib(440, 10 * mm, kk, 10);
      x.kword("ink", "kozo · 10 mm", x0, 390, tk, { size: 48, align: "left" });
      fib(660, 0.9 * mm, ke, 20);
      x.kword("ink", "eucalyptus · 0.9 mm", x0, 610, te, { size: 48, align: "left" });
      S.line("ink", [[x0, 840], [x0 + 10 * mm, 842]], 1.8, { seed: 40 });
      for (let i = 0; i <= 10; i++) { S.line("ink", [[x0 + i * mm, 828], [x0 + i * mm, 856]], 1.4, { seed: 41 + i }); if (i % 5 === 0) S.label(`${i} mm`, x0 + i * mm, 896, { align: "center" }); }
      const tu = x.word("under");
      if (x.t > tu - 0.2) { x.kword("accent", "×11", 1640, 560, tu, { size: 110 }); S.sparkle(1740, 470, 18 * x.pop(x.seg(x.t, tu, tu + 0.4))); }
      x.hot(x0, 380, 10 * mm, 120, "Kozo (paper mulberry) fibres average about 10 mm (6–20); widths are similar for all papermaking fibres, 10–40 µm.", "Why does fibre length make paper stronger?");
    },
    // 4 · origins
    (x) => {
      const { S } = x, x0 = 300, x1 = 1620, X = (y) => x0 + ((y + 200) / 400) * (x1 - x0), y = 640;
      S.line("ink", [[x0, y], [x1, y + 3]], 2.4, { seed: 50 });
      [-200, -100, 0, 100, 200].forEach((v, i) => { S.line("ink", [[X(v), y - 14], [X(v), y + 14]], 1.6, { seed: 51 + i }); S.label(v < 0 ? `${-v} BCE` : v === 0 ? "1 CE" : `${v} CE`, X(v), y + 56, { align: "center" }); });
      const t105 = x.word("hundred"), tf = x.word("fragments");
      if (x.t > t105 - 0.3) { S.mark("ink", X(105), y, 9 * x.pop(x.seg(x.t, t105 - 0.3, t105 + 0.2))); x.kword("ink", "105 CE · the usual story", X(105), y - 60, t105 - 0.2, { size: 34, font: "body" }); }
      const st = x.eOut(x.seg(x.t, tf - 0.4, tf));
      if (st > 0) S.line("accent", [[X(105) - 170, y - 70], [X(105) - 170 + 340 * st, y - 78]], 4, { seed: 60 });
      if (x.t > tf) {
        const k = x.seg(x.t, tf, tf + 0.5), fx = X(-80), torn = [[fx - 80, y - 300], [fx - 20, y - 312], [fx + 30, y - 296], [fx + 76, y - 306], [fx + 90, y - 200], [fx + 60, y - 160], [fx - 10, y - 170], [fx - 70, y - 150], [fx - 92, y - 230]];
        S.fill("paper", torn, k); S.fill("bark", torn, 0.55 * k); S.line("ink", torn, 2.2, { close: true, seed: 61, a: k });
        for (let i = 0; i < 4; i++) S.line("ink", [[fx - 50, y - 270 + i * 26], [fx + 40 - i * 8, y - 272 + i * 26]], 1.2, { a: 0.45 * k, seed: 62 + i });
        S.sparkle(fx + 110, y - 320, 16, k);
        x.kword("ink", "fragments, 1st century BCE", fx, y - 350, tf + 0.2, { size: 34, font: "body" });
        S.leader(fx, y - 145, fx, y - 12, 0.5 * k);
      }
      x.kword("ink", "China", 960, 220, x.word("china"), { size: 64 });
      x.hot(X(-80) - 90, y - 320, 180, 180, "Paper fragments from the 1st century BCE predate Cai Lun's traditional 105 CE; a contested map from Fangmatan may be older still.", "Who really invented paper?");
    },
    // 5 · westward: a little sheet travels the route
    (x) => {
      const { S } = x, stops = [["China", 1640, 560, x.s], ["Baghdad · 794", 1180, 500, x.word("baghdad")], ["Spain · 1056", 520, 440, x.word("spain")], ["Fabriano · 1282", 780, 660, x.word("fabriano")]];
      let head = null;
      for (let i = 0; i < stops.length; i++) {
        const [lab, px, py, t0] = stops[i]; if (x.t < t0 - 0.6 && i) break;
        if (i) { const [, ax, ay] = stops[i - 1], k = x.eOut(x.seg(x.t, t0 - 0.6, t0)), pts = Array.from({ length: 31 }, (_, j) => { const t = (j / 30) * k; return [ax + (px - ax) * t, ay + (py - ay) * t - Math.sin(t * Math.PI) * 90]; }); for (let j = 0; j < pts.length - 1; j += 2) S.line("ink", [pts[j], pts[j + 1]], 1.8, { seed: i * 40 + j, a: 0.8 }); head = pts[pts.length - 1]; }
        if (x.t < t0 - 0.2) continue;
        S.mark(i === 3 ? "accent" : "ink", px, py, (i === 3 ? 16 : 8) * x.pop(x.seg(x.t, t0 - 0.2, t0 + 0.3)));
        x.kword("ink", lab, px, py - 40, t0, { size: 40 });
      }
      if (head) { S.save(); S.translate(head[0] + 70, head[1] - 110); S.rotate(Math.sin(x.t * 3) * 0.08); S.sheet(0, 0, 60, 76, { wash: "bark", washA: 0.3, w: 1.8, seed: 70 }); S.face(0, 6, 0.6); S.restore(); }
      const tw = x.word("watermarks");
      x.kword("muted", "watermarks begin", 780, 730, tw, { size: 26, font: "mono" });
      x.hot(720, 580, 140, 160, "Fabriano, Italy: gelatin sizing and the first watermarks, 1282.", "How were watermarks made?");
    },
    // 6 · seventy thousand to two hundred ninety-five
    (x) => {
      const { S } = x, tg = x.word("two", 1), out = x.seg(x.t, x.word("by") - 0.2, tg + 0.6);
      HOUSE.forEach((h) => { const alive = h.i < 3 || h.d > out; if (alive) S.mark(h.i < 3 && out > 0.95 ? "accent" : "ink", h.x, h.y, h.i < 3 && out > 0.95 ? 9 : 5.6, 0.85); else S.mark("muted", h.x, h.y, 2.6, 0.45); });
      // a little washi house, the last few
      const hx = 1500, hy = 330;
      S.line("ink", [[hx - 70, hy + 60], [hx - 70, hy], [hx, hy - 50], [hx + 70, hy], [hx + 70, hy + 60]], 2.2, { seed: 80 }); S.fill("yellow", [[hx - 20, hy + 10], [hx + 20, hy + 10], [hx + 20, hy + 40], [hx - 20, hy + 40]], 0.8); S.line("ink", [[hx - 20, hy + 10], [hx + 20, hy + 10], [hx + 20, hy + 40], [hx - 20, hy + 40]], 1.6, { close: true, seed: 81 });
      const n = Math.round(70000 - (70000 - 295) * x.eOut(out));
      S.text("ink", n.toLocaleString("en-US"), 1500, 590, { size: 120 });
      S.text("muted", "households making washi", 1500, 640, { size: 30, font: "body" });
      x.kword("muted", "1901", 1500, 480, x.s + 0.2, { size: 28, font: "mono" });
      x.kword("accent", "2009", 1500, 700, tg, { size: 34, font: "mono" });
      x.kword("muted", "each dot: 100 households", 300, 820, x.s + 0.6, { size: 24, font: "mono", align: "left" });
      x.hot(290, 320, 740, 440, "About 70,000 Japanese households made washi in 1901, often as winter work; fewer than 500 by 1984; 295 in 2009.", "Why did washi making decline?");
    },
    // 7 · 400 million tonnes: a hand keeps stacking sheets
    (x) => {
      const { S } = x, k = x.seg(x.t, x.s, x.word("tonnes") + 0.3), n = Math.round(18 * x.eOut(k));
      ground(S, 862);
      for (let i = 0; i < n; i++) { const y = 840 - i * 26, wob = Math.sin(i * 1.7) * 10; const pts = [[400 + wob, y - 12], [740 + wob, y - 16], [780 + wob, y + 10], [370 + wob, y + 12]]; S.fill("paper", pts); if (i % 3 === 0) S.fill(["bark", "sky", "sage"][i % 9 / 3], pts, 0.35); S.line("ink", pts, 1.8, { close: true, seed: 90 + i }); }
      if (k < 1) { const y = 840 - n * 26 - 40 - 60 * (1 - (x.t * 2 % 1)); S.sheet(580, y, 360, 26, { skew: 0.03, w: 1.8 }); S.hand(780, y, -Math.PI / 2, 1, -1, "flat"); }
      S.text("ink", `${Math.round(400 * x.eOut(k))}`, 1360, 560, { size: 190 });
      x.kword("ink", "million tonnes a year", 1360, 640, x.word("tonnes"), { size: 42, font: "body" });
      x.kword("muted", "more than double 1980", 1360, 690, x.word("year"), { size: 26, font: "mono" });
      x.hot(1080, 380, 560, 340, "World paper and board production is about 401 million tonnes a year: packaging rising, printing papers at their lowest since 1987.", "Why is paper production still growing?");
    },
    // 8 · raking light: a lamp skims the sheet
    (x) => {
      const { S } = x, lower = x.eOut(x.seg(x.t, x.word("raking") - 0.5, x.word("raking") + 0.8)), laid = x.seg(x.t, x.word("laid") - 0.4, x.word("laid") + 0.4);
      const lx = 1560, ly = 220 + lower * 300;
      if (lower > 0.1) S.fill("yellow", [[lx - 40, ly + 10], [lx + 40, ly + 10], [1290, 840], [1290, 260 + lower * 120]], 0.45 * lower);
      S.sheet(820, 560, 900, 600, { laid: Math.max(0.2, lower) * (0.6 + laid), seed: 100 });
      S.line("ink", [[lx, 100], [lx, ly - 50]], 1.8, { seed: 101 });
      const shade = S.spline([[lx - 80, ly + 10], [lx - 60, ly - 40], [lx, ly - 54], [lx + 60, ly - 40], [lx + 80, ly + 10]], 6);
      S.fill("paper", shade); S.line("ink", shade, 2.4, { close: true, seed: 102 }); S.fill("yellow", S.ellipse(lx, ly + 14, 26, 12), 0.9);
      x.kword("ink", "laid lines · 7–10 per cm", 820, 930, x.word("laid"), { size: 34, font: "body" });
      x.kword("ink", "chain lines · 22–32 mm apart", 820, 980, x.word("chain"), { size: 34, font: "body" });
      x.hot(370, 260, 900, 600, "Raking light: a lamp skimming the sheet makes every ridge cast a shadow. Laid lines come from the mould's fine wires, chain lines from the wires sewn to its ribs.", "What can a watermark tell you about a sheet?");
    },
    // 9 · ink: one drop blooms, one holds
    (x) => {
      const { S } = x, tu = x.word("unsized"), ts = x.word("sized");
      S.sheet(620, 560, 500, 560, { seed: 110 }); S.sheet(1300, 560, 500, 560, { seed: 111, wash: "yellow", washA: 0.12 });
      const brush = (bx, by, t0) => { const d = x.seg(x.t, t0 - 0.8, t0 - 0.1), up = x.seg(x.t, t0, t0 + 0.5), yy = by - 260 + d * 200 - up * 200; if (d <= 0 || up >= 1) return; S.save(); S.translate(bx, yy); S.line("ink", [[0, -220], [6, 0]], 2.6, { seed: 112 }); S.fill("cobalt", [[-10, 0], [18, 0], [14, 60], [3, 86], [-8, 60]], 0.95); S.line("ink", [[-10, 0], [18, 0], [14, 60], [3, 86], [-8, 60]], 1.8, { close: true, seed: 113 }); S.hand(2, -130, -Math.PI / 2 + 0.02, 1, -1, "pinch"); S.restore(); };
      brush(620, 500, tu); brush(1300, 500, ts);
      if (x.t > tu - 0.1) { const r = 30 + 120 * x.eOut(x.seg(x.t, tu - 0.1, tu + 1.8)); S.circle("cobalt", 620, 520, r * 0.62, 0.75); S.circle("cobalt", 620, 520, r * 0.35, 0.5); for (let i = 0; i < 20; i++) { const a = (i / 20) * 6.28; S.fibre(620 + Math.cos(a) * r * 0.6, 520 + Math.sin(a) * r * 0.6, r * 0.42, a, 0.4, 1.4, 0.65, i); } }
      if (x.t > ts - 0.1) S.mark("accent", 1300, 520, 40 * x.pop(x.seg(x.t, ts - 0.1, ts + 0.3)));
      x.kword("ink", "unsized · blooms", 620, 920, tu, { size: 42 });
      x.kword("ink", "sized · holds", 1300, 920, ts, { size: 42 });
      x.hot(370, 280, 500, 560, "Ink wicks into unsized paper by capillarity (Lucas–Washburn: distance grows with the square root of time). Sizing raises the contact angle and the ink stays put.", "Why does ink spread on some papers but not others?");
    },
    // 10 · on a screen: noise, layers, light
    (x) => {
      const { S } = x, tiles = [["noise", x.word("noise")], ["layers", x.word("layers")], ["light", x.word("lit")]];
      tiles.forEach(([lab, t0], i) => {
        const k = x.pop(x.seg(x.t, t0 - 0.2, t0 + 0.3)); if (k <= 0) return;
        const cx = 480 + i * 480, cy = 500, s = 300 * k, r = rnd(31 + i), box = [[cx - s / 2, cy - s / 2], [cx + s / 2, cy - s / 2], [cx + s / 2, cy + s / 2], [cx - s / 2, cy + s / 2]];
        S.fill("paper", box);
        if (i === 0) for (let a = 0; a < 60; a++) S.mark("ink", cx - s / 2 + 16 + r() * (s - 32), cy - s / 2 + 16 + r() * (s - 32), 1.5 + r() * 3, 0.7);
        if (i === 1) for (let a = 0; a < 7; a++) S.line("ink", Array.from({ length: 14 }, (_, j) => [cx - s / 2 + 14 + j * (s - 28) / 13, cy - s / 2 + 30 + a * (s - 60) / 6 + Math.sin(j * 0.9 + a * 1.7) * 12]), 1.3, { a: 0.7, seed: a + 120 });
        if (i === 2) { S.fill("yellow", [[cx - s / 2, cy - s / 2], [cx + s / 2, cy - s / 2], [cx - s / 2, cy + s / 2]], 0.45); for (let a = 0; a < 9; a++) S.fibre(cx - s / 2 + 40 + r() * (s - 80), cy - s / 2 + 40 + r() * (s - 80), 80, r() * 3, 0.5, 1.6, 0.75, a); }
        S.line("ink", box, 2.2, { close: true, seed: 130 + i });
        x.kword("ink", lab, cx, cy + 210, t0, { size: 44 });
        if (i) S.line("ink", [[cx - 300, cy], [cx - 190, cy]], 1.6, { seed: 140 + i, a: 0.6 });
      });
      x.kword("accent", "until it reads as paper", 960, 880, x.word("reads"), { size: 54 });
      x.hot(330, 350, 1260, 300, "Perlin gradient noise, summed in octaves (fractal Brownian motion), treated as a height field and lit from a low angle with Lambert's law.", "How do you draw a realistic paper texture in code?");
    },
    // 11 · a record, held up to the light
    (x) => {
      const { S } = x, k = x.eOut(x.seg(x.t, x.s - 0.2, x.s + 0.8));
      S.save(); S.translate(0, (1 - k) * 40);
      S.sheet(960, 500, 700, 560, { laid: 0.7, wash: "bark", washA: 0.18, seed: 150 });
      S.hand(610, 300, Math.PI / 2 - 0.1, 1.1, 1, "pinch"); S.hand(1310, 300, -Math.PI / 2 + 0.1, 1.1, -1, "pinch");
      S.restore();
      x.kword("ink", "fibre · mould · hands", 960, 880, x.word("fibre"), { size: 56 });
      const th = x.word("hands");
      if (x.t > th) { S.mark("accent", 1220, 690, 26 * x.pop(x.seg(x.t, th, th + 0.4))); S.sparkle(1270, 640, 16); }
    },
  ];
  function endCard(x) {
    const { S } = x;
    S.text("ink", "Fibre by Fibre", 960, 520, { size: 150 });
    S.text("muted", "an illustrated essay on paper", 960, 590, { size: 38, font: "body" });
    S.sparkle(1300, 400, 22);
  }

  window.EXPLAINER = {
    title: "Fibre by Fibre",
    report: { name: "Sources: the Fibre by Fibre research report", url: "http://localhost:8901/report.html" },
    segNames: ["Mostly air", "By hand", "Fibre length", "Origins", "Westward", "Washi households", "400 million tonnes", "Raking light", "Ink", "On a screen", "A record"],
    poster: 9,
    playhead: '<svg width="20" height="20" viewBox="0 0 20 20"><rect x="3" y="3" width="14" height="14" rx="1"/></svg>',
    ring(ctx, cx, cy, rx, ry, t) {
      // a pen circle, drawn once round and a little past
      const pts = []; for (let i = 0; i <= 64; i++) { const a = -0.6 + (i / 64) * Math.PI * 2.08, w = 1 + 0.03 * Math.sin(i * 0.7); pts.push([cx + Math.cos(a) * rx * w, cy + Math.sin(a) * ry * w]); }
      ctx.save(); ctx.__alpha = 1; window.Pen.ink(ctx, pts, { w: 3, jit: 1, seed: 7 }); ctx.restore();
    },
    async load() {
      const schedule = await (await fetch("schedule.json", { cache: "no-cache" })).json();
      const stage = window.ExplainerStage.Stage({ style: window.makePaperStyle(document.createElement("canvas")), schedule, scenes, endCard });
      const answer = window.AnswerKit(window.makePaperStyle(document.createElement("canvas")));
      return { stage, answer, schedule };
    },
  };
})();
