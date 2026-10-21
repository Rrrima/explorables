/* Ch7 how to tell a good one: a tray of six. Tap them (click): the live ones clamp shut,
   one gaper stays open. Then full vs dry, sea vs fishy, the harvest tag, cold storage. */
(function () {
  "use strict";
  const { wash, mat, blobPts, circlePts, smoothClosed, smoothOpen, stroke, contour, shadow, finish, sprite, blit, ease, clamp, seg, rimGloss, rng } = WC;
  const T = Things;
  let VW = 1000, VH = 780, M = null;
  const C = { x: 390, y: 410 };
  // phones: the tray (desktop units around C) moves up and shrinks a little; the tag and the
  // thermometer take turns in a band under it, with their notes beside them
  const MOB = { VW: 680, VH: 860, x: 340, y: 322, s: 0.86, side: { x: 190, y: 735, s: 0.5 } };
  const tx = (x) => (M ? M.x + (x - C.x) * M.s : x), ty = (y) => (M ? M.y + (y - C.y) * M.s : y);
  const POS = [[250, 300], [390, 290], [530, 305], [255, 520], [395, 530], [535, 515]].map(([x, y], i) => ({ x, y, rot: -0.2 + (i % 3) * 0.2, seed: 700 + i * 9 }));
  const GAPER = 4;
  const tapped = new Set();

  function gaper(g, x, y, s, rot, seed) {
    T.oyster(g, x, y, s, rot, { species: "eastern", shut: true, seed });
    // a dark gap at the lip: the shell is open and won't close
    const pts = []; for (let t = 0.25; t <= 2.9; t += 0.1) pts.push([x + Math.cos(t + rot) * 36 * s * 0.8, y + Math.sin(t + rot) * 46 * s * 0.8]);
    stroke(g, pts, { w: 7 * s, color: "#2c2622", a: 0.85 });
  }
  function waft(g, x, y, col, seed, k) {
    const r = rng(seed);
    for (let i = 0; i < 3; i++) {
      const pts = []; const x0 = x - 30 + i * 30;
      for (let j = 0; j <= 14; j++) pts.push([x0 + Math.sin(j * 0.7 + i + r()) * 9, y - j * 9 * k]);
      if (pts.length > 2) stroke(g, smoothOpen(pts), { w: 4, color: col, a: 0.75, seed: i });
    }
  }
  function thermometer(g) {
    const x = 0, y = 0;
    const body = [[x - 16, y - 170], [x + 16, y - 170], [x + 16, y + 140], [x - 16, y + 140]];
    shadow(g, body, { dx: -6, dy: 8, a: 0.35 });
    wash(g, body, { color: "#eef3f5", a: 0.85, mottle: 0, edge: 2, edgeColor: "#9db4c2", line: { color: "#7d93a6", w: 1 } });
    wash(g, circlePts(x, y + 160, 30), { color: "#5d86ad", mottle: 0.1, edge: 3, edgeColor: "#2f5687", line: { color: "#2f5687", w: 1 } });
    wash(g, [[x - 6, y + 140], [x + 6, y + 140], [x + 6, y - 20], [x - 6, y - 20]], { color: "#5d86ad", mottle: 0, edge: 1 });
    for (let k = 0; k < 9; k++) stroke(g, [[x + 16, y + 120 - k * 30], [x + 28, y + 120 - k * 30]], { w: 1.4, color: "#2b3440", a: 0.7, taper: false });
    // the 35–45 °F band
    wash(g, [[x + 30, y - 10], [x + 44, y - 10], [x + 44, y + 50], [x + 30, y + 50]], { color: "#7aa04e", a: 0.85, mottle: 0, edge: 1 });
    rimGloss(g, x, y, 9, 150, Math.PI * 0.6, Math.PI * 1.4, { w: 2.4 });
  }

  window.Scenes = window.Scenes || {};
  window.Scenes.good = {
    VW, VH,
    layout(n) { M = n ? MOB : null; VW = n ? MOB.VW : 1000; VH = n ? MOB.VH : 780; this.VW = VW; this.VH = VH; },
    click([vx, vy]) { POS.forEach((q, i) => { if (Math.hypot(tx(q.x) - vx, ty(q.y) - vy) < 70 * (M ? M.s : 1)) tapped.add(i); }); },
    draw(g, st, p, t, item) {
      const sc0 = st.s * st.dpr, sc = sc0 * (M ? M.s : 1);
      const fin = (g2, w, h) => finish(g2, w, h, { transparent: true, bloom: 0, warmA: 0.28, haze: 0.08 });
      if (M) blit(g, sprite("gd-mat", sc0, 0, 0, VW, VH, (g2) => { mat(g2, smoothClosed([[34, 40], [640, 28], [664, 430], [646, 838], [36, 846], [14, 430]], 8), { seed: 101, nblooms: 1 }); fin(g2, VW, VH); }));
      g.save();
      if (M) { g.translate(M.x, M.y); g.scale(M.s, M.s); g.translate(-C.x, -C.y); }
      blit(g, sprite("gd-base", sc, 0, 0, 1000, 780, (g2) => {
        if (!M) mat(g2, smoothClosed([[80, 120], [700, 90], [760, 400], [720, 720], [100, 730], [40, 420]], 8), { seed: 101, nblooms: 1 });
        T.platter(g2, C.x, C.y, 300, 280, { color: "#c8d1d8" });
        T.ice(g2, blobPts(C.x + 3, C.y - 3, 258, 240, { wob: 0.04, seed: 3, n: 120 }), { seed: 11, size: 15 });
        fin(g2, 1000, 780);
      }));
      const open = ease(seg(p, 0.6, 1.1));      // two oysters shucked for the comparisons
      const showGap = p > 0.45 || tapped.has(GAPER);
      POS.forEach((q, i) => {
        const shut = sprite("gd-shut" + i, sc, q.x - 90, q.y - 100, 180, 200, (g2) => (i === GAPER ? gaper : (gg, x, y, s, r, sd) => T.oyster(gg, x, y, s, r, { species: "eastern", shut: true, seed: sd }))(g2, q.x, q.y, 1.5, q.rot, q.seed));
        const dim = i === 0 || i === 2 ? 1 : 1 - 0.55 * open;
        if (i === 0 || i === 2) {
          blit(g, shut, 0, 0, 1 - open);
          if (open > 0) blit(g, sprite("gd-open" + i, sc, q.x - 90, q.y - 100, 180, 200, (g2) => T.oyster(g2, q.x, q.y, 1.5, q.rot, { species: "eastern", seed: q.seed, k: i === 0 ? 1.12 : 0.66 })), 0, 0, open);
        } else blit(g, shut, 0, 0, dim);
      });
      // dry, dull meat on the bad one
      if (open > 0) { g.save(); g.globalAlpha = 0.45 * open; g.fillStyle = "#b8ab92"; g.beginPath(); g.ellipse(POS[2].x + 2, POS[2].y + 6, 22, 30, POS[2].rot, 0, 7); g.fill(); g.restore(); }
      const sm = ease(seg(p, 1.6, 2.1)) * (1 - seg(p, 2.7, 3.0));
      if (sm > 0) { g.save(); g.globalAlpha = sm; waft(g, POS[0].x, POS[0].y - 80, "#5d86ad", 3, sm); waft(g, POS[2].x, POS[2].y - 80, "#9a7a52", 5, sm); g.restore(); }
      if (M) { g.restore(); g.save(); const S = M.side; g.translate(S.x, S.y); g.scale(S.s, S.s); g.translate(-775, -370); }
      const scs = M ? sc0 * M.side.s : sc;
      const tg = ease(seg(p, 2.6, 3.1)) * (1 - seg(p, 3.6, 3.9));
      if (tg > 0) blit(g, sprite("gd-tag", scs, 690, 180, 300, 380, (g2) => { T.tag(g2, 760, 370, 2.6, -0.08, { w: 80, h: 110, seed: 7, string: [[730, 330], [700, 300]] }); fin(g2, 300, 380); }), 20 * (1 - tg), 0, tg);
      const th = ease(seg(p, 3.6, 4.1));
      if (th > 0) blit(g, sprite("gd-th", scs, 700, 160, 160, 420, (g2) => { g2.translate(780, 360); thermometer(g2); }), 20 * (1 - th), 0, th);
      g.restore();
    },
    labels(p) {
      const open = seg(p, 0.6, 1.1), sm = seg(p, 1.6, 2.1) * (1 - seg(p, 2.7, 3.0)), tg = seg(p, 2.7, 3.1) * (1 - seg(p, 3.6, 3.9)), th = seg(p, 3.7, 4.1);
      const out = [];
      const touch = document.documentElement.classList.contains("touch");
      if (M) {
        // the side band: notes to the right of the tag / thermometer
        out.push({ id: "tag", x: 280, y: 735, align: "left", cls: "light", html: "HARVEST TAG<small style=\"width:150px\">where · when · who<br>kept 90 days after the sack is empty</small>", a: tg });
        out.push({ id: "th", x: 280, y: 735, align: "left", cls: "light", html: "35–45°F<small style=\"width:150px\">cup down, damp towel, never in water · eat within a week</small>", a: th });
      }
      POS.forEach((q, i) => {
        if (i === GAPER) out.push({ id: "g", x: q.x, y: q.y + 92, cls: "map", html: "✕ stays open: throw it out", a: (p > 0.3 || tapped.has(i)) ? 1 - open * 0.6 : 0 });
        else out.push({ id: "t" + i, x: q.x, y: q.y + 86, cls: "map", html: "✓ clamped shut", a: tapped.has(i) && open < 0.5 ? 1 : 0 });
      });
      out.push({ id: "hint", x: C.x, y: 92, html: touch ? "tap an oyster to test it" : "click an oyster to tap it", cls: "map", a: p < 0.6 ? 0.9 : 0 });
      out.push({ id: "full", x: POS[0].x, y: POS[0].y - 108, html: M ? "full of<br>liquor" : "full of liquor", cls: "map" + (M ? " stack" : ""), a: open * (1 - sm) });
      out.push({ id: "dry", x: POS[2].x, y: POS[2].y - 108, html: M ? "dry,<br>shrunken" : "dry, shrunken", cls: "map" + (M ? " stack" : ""), a: open * (1 - sm) });
      out.push({ id: "sea", x: POS[0].x, y: POS[0].y - 220, html: M ? "smells like<br>the sea" : "smells like the sea", cls: "map" + (M ? " stack" : ""), a: sm });
      out.push({ id: "fish", x: POS[2].x, y: POS[2].y - 220, html: M ? "fishy:<br>send it back" : "fishy: send it back", cls: "map" + (M ? " stack" : ""), a: sm });
      if (M) return out.map((l) => (l.id === "tag" || l.id === "th" ? l : Object.assign(l, { x: tx(l.x), y: ty(l.y) })));
      out.push({ id: "tag", x: 860, y: 372, html: "HARVEST TAG<small style=\"width:150px\">where · when · who<br>kept 90 days after the sack is empty</small>", a: tg });
      out.push({ id: "th", x: 840, y: 375, align: "left", html: "35–45°F<small style=\"width:110px\">cup down, damp towel, never in water · eat within a week</small>", cls: "map", a: th });
      return out;
    },
    hot() { return POS.map((q, i) => ({ id: "o" + i, x: tx(q.x), y: ty(q.y), r: 70 * (M ? M.s : 1), html: i === GAPER ? "<b>Tap me</b>Will it close?" : "<b>Tap me</b>A live oyster clamps shut." })); }
  };
})();
