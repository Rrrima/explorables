/* Ch1 timeline: six moments laid along the table; scrolling slides the table past. */
(function () {
  "use strict";
  const { PAL, wash, mat, blobPts, circlePts, smoothClosed, smoothOpen, stroke, contour, rimGloss, fleck, shadow, finish, sprite, blit, rng, shade, tint, ease, clamp, path } = WC;
  const T = Things;
  let VW = 940, VH = 780, M = false;
  const GAP = 760, CY = 380;

  function sand(g, pts, seed) { wash(g, pts, { color: "#e6cfa4", mottle: 0.35, kind: "gran", mscale: 0.8, mottleColor: "#c7a877", edge: 5, edgeColor: "#c9ab7c", seed }); }

  // 0 — a ring of empty shells, 4,300 years old
  function midden(g) {
    sand(g, blobPts(0, 0, 330, 250, { wob: 0.12, seed: 3 }), 3);
    const r = rng(11);
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * Math.PI * 2 + r() * 0.1, R = 175 + (r() - 0.5) * 60;
      T.oyster(g, Math.cos(a) * R * 1.15, Math.sin(a) * R * 0.85, 0.75 + r() * 0.35, r() * 6.28, { species: r() < 0.6 ? "eastern" : "flat", empty: true, seed: 50 + i, shadowA: 0.25 });
    }
    // the cool months only: a little snail on one shell
    wash(g, blobPts(34, -6, 9, 6, { wob: 0.2, seed: 2, n: 24 }), { color: "#b9a27e", mottle: 0.1, edge: 1.5, line: { color: "#6f5d42", w: 0.8 } });
  }
  // 1 — Orata: a Roman roof tile with oysters on it, twigs hung for the spat
  function tile(g) {
    mat(g, smoothClosed([[-300, -220], [260, -250], [330, 40], [250, 250], [-260, 240], [-330, 0]], 8), { seed: 21, nblooms: 1 });
    const pts = [[-250, -95], [250, -70], [250, 70], [-250, 95]];
    shadow(g, pts, { dx: -10, dy: 14, a: 0.45 });
    wash(g, pts, { color: "#c8693f", mottle: 0.35, mscale: 0.8, edge: 4, edgeColor: "#8e3f22", seed: 4 });
    // curved tile: lit ridge and shaded flanks
    wash(g, [[-250, -20], [250, -15], [250, 15], [-250, 20]], { color: "#e8946a", a: 0.7, mottle: 0.2, edge: 0, soft: 6, seed: 5 });
    wash(g, [[-250, 55], [250, 45], [250, 70], [-250, 95]], { color: "#9c4527", a: 0.6, mottle: 0.2, edge: 0, soft: 4, seed: 6 });
    [[-150, -10, 1.3, 0.3], [-30, 20, 1.15, 2.6], [90, -20, 1.25, -0.4], [190, 25, 1.0, 1.9], [-215, 40, 0.9, 1.2]].forEach(([x, y, s, rt], i) =>
      T.oyster(g, x, y, s, rt, { species: "flat", shut: true, seed: 70 + i * 3 }));
    // twigs with tiny spat
    for (let k = 0; k < 2; k++) {
      const y0 = k ? 175 : -175;
      stroke(g, smoothOpen([[-200, y0], [-60, y0 - 10], [60, y0 + 8], [200, y0 - 4]]), { w: 6, color: "#7a5a3a", a: 0.9, seed: k });
      stroke(g, smoothOpen([[-60, y0 - 10], [-20, y0 - 40]]), { w: 3, color: "#7a5a3a", seed: k + 4 });
      stroke(g, smoothOpen([[80, y0 + 6], [120, y0 + 34]]), { w: 3, color: "#7a5a3a", seed: k + 6 });
      const r = rng(9 + k);
      for (let i = 0; i < 9; i++) wash(g, blobPts(-170 + r() * 350, y0 + (r() - 0.5) * 16, 5, 4, { wob: 0.3, seed: i, n: 16 }), { color: "#d8ccb6", mottle: 0, edge: 1, line: { color: "#7d7262", w: 0.6 } });
    }
  }
  // 2 — London 1836: a tankard of porter and a newspaper of oysters
  function porter(g) {
    mat(g, smoothClosed([[-320, -200], [240, -250], [330, -20], [280, 240], [-250, 250], [-330, 30]], 8), { seed: 33, nblooms: 1 });
    const np = [[-250, -150], [60, -175], [85, 165], [-230, 185]];
    shadow(g, np, { dx: -8, dy: 10, a: 0.35 });
    wash(g, np, { color: "#efe6d2", mottle: 0.2, mscale: 0.6, edge: 3, edgeColor: "#bfb194", seed: 8 });
    for (let i = 0; i < 13; i++) { const y = -130 + i * 23; stroke(g, [[-225 + (i % 3) * 4, y + i * 0.6], [55 - (i % 4) * 14, y - 6 + i * 0.6]], { w: 4, color: "#a59a86", a: 0.45, taper: false }); }
    [[-150, -60, 1.25, 0.4], [-40, -80, 1.2, -0.3], [-150, 70, 1.2, 2.8], [-30, 60, 1.25, 2.2]].forEach(([x, y, s, rt], i) => T.oyster(g, x, y, s, rt, { species: "flat", seed: 90 + i * 5 }));
    // pewter tankard from above: dark porter, a beige head, the handle
    const cx = 185, cy = -10;
    shadow(g, circlePts(cx, cy, 92), { dx: -10, dy: 12, a: 0.45 });
    wash(g, [[cx + 70, cy - 22], [cx + 140, cy - 18], [cx + 140, cy + 18], [cx + 70, cy + 22]], { color: "#9aa3a8", mottle: 0.2, edge: 2, edgeColor: "#5f686e", seed: 3 });
    wash(g, circlePts(cx, cy, 92), { color: "#a7b0b5", mottle: 0.25, mscale: 0.8, edge: 3, edgeColor: "#626c73", seed: 4,
      glaze: { pts: circlePts(cx + 14, cy - 12, 92), invert: true, color: "#6d777e", a: 0.55 } });
    wash(g, circlePts(cx + 2, cy + 1, 74), { color: "#3a2a22", mottle: 0.15, edge: 2, seed: 5 });
    wash(g, blobPts(cx + 2, cy + 1, 62, 60, { wob: 0.08, seed: 3 }), { color: "#e1cba5", mottle: 0.25, kind: "gran", edge: 2, edgeColor: "#b89a6c", seed: 6 });
    rimGloss(g, cx, cy, 86, 86, Math.PI * 0.5, Math.PI * 1.15, { w: 3.2, seed: 3 });
  }
  // 3 — New York: a red globe over a heaped plate, 6¢
  function cellar(g) {
    mat(g, smoothClosed([[-310, -230], [280, -230], [330, 60], [230, 250], [-280, 230], [-330, -10]], 8), { seed: 44, nblooms: 1 });
    T.dish(g, -40, 30, 190, { seed: 3 });
    const r = rng(5);
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, R = i % 2 ? 120 : 95; T.oyster(g, -40 + Math.cos(a) * R * 0.95, 30 + Math.sin(a) * R * 0.9, 1.15, a - Math.PI / 2, { species: "eastern", seed: 110 + i * 3 }); }
    T.oyster(g, -40, 30, 1.25, 0.3, { species: "eastern", seed: 140 });
    // red globe lamp, glowing
    const lx = 215, ly = -130;
    g.save(); g.filter = `blur(${26 * (g.__scale || 1)}px)`; g.fillStyle = "rgba(240,110,70,.45)"; g.beginPath(); g.arc(lx, ly, 110, 0, 7); g.fill(); g.restore();
    wash(g, circlePts(lx, ly, 62), { color: "#d2452e", mottle: 0.15, edge: 4, edgeColor: "#8e2618", seed: 7,
      glaze: { pts: circlePts(lx + 12, ly - 12, 62), invert: true, color: "#a5301f", a: 0.5 } });
    wash(g, blobPts(lx - 18, ly - 18, 24, 18, { wob: 0.2, seed: 2 }), { color: "#f7a27e", a: 0.8, mottle: 0, edge: 0, soft: 6 });
    fleck(g, lx - 24, ly - 26, 8, { rot: -0.6, flat: 0.4 });
    // the price card
    T.tag(g, 150, 150, 1.6, -0.1, { w: 80, h: 44, seed: 9 });
  }
  // 4 — 1927: a condemned bed, murky water, a stake
  function closed(g) {
    wash(g, blobPts(0, 10, 320, 240, { wob: 0.14, seed: 8 }), { color: "#8a8f7e", mottle: 0.45, kind: "wet", mscale: 1, mottleColor: "#5e6455", edge: 6, edgeColor: "#555b4c", seed: 8 });
    const r = rng(17);
    for (let i = 0; i < 16; i++) T.oyster(g, (r() - 0.5) * 460, (r() - 0.5) * 300 + 20, 0.9 + r() * 0.4, r() * 6.28, { species: "eastern", shut: true, seed: 160 + i, shadowA: 0.2 });
    // murky veil
    g.save(); g.fillStyle = "rgba(110,118,96,.35)"; path(g, blobPts(0, 10, 300, 225, { wob: 0.14, seed: 8 })); g.fill(); g.restore();
    // wooden stake with a board
    shadow(g, [[150, -170], [300, -170], [300, -100], [150, -100]], { dx: -8, dy: 10, a: 0.45 });
    wash(g, [[150, -170], [300, -168], [298, -100], [152, -102]], { color: "#efe4cc", mottle: 0.25, kind: "streak", edge: 3, edgeColor: "#a99474", line: { color: "#7d6a4e", w: 1 }, seed: 4 });
    wash(g, circlePts(225, -60, 12), { color: "#7a5a3a", mottle: 0.2, edge: 2, line: { color: "#4e3a25", w: 1 } });
  }
  // 5 — today: one oyster on ice on a slate plate, a price tag
  function today(g) {
    mat(g, smoothClosed([[-300, -220], [260, -240], [320, 30], [250, 240], [-270, 230], [-330, 0]], 8), { seed: 55, nblooms: 1 });
    T.dish(g, -30, 20, 200, { bands: false, seed: 6 });
    T.ice(g, blobPts(-26, 16, 148, 148, { wob: 0.05, seed: 3 }), { seed: 9, size: 13 });
    T.oyster(g, -30, 18, 2.2, 0.4, { species: "eastern", seed: 201 });
    T.lemon(g, 70, 115, 1.1, -0.6, { seed: 4 });
    T.tag(g, 190, -120, 1.7, 0.18, { w: 84, h: 44, seed: 12, string: [[120, -150], [60, -110]] });
  }
  const V = [midden, tile, porter, cellar, closed, today];
  const LAB = [
    ["c. 4,300 years ago", "a shell ring, Georgia"],
    ["c. 95 BCE", "Orata's oyster beds"],
    ["1836–37", "London: porter and oysters"],
    ["1800s", "New York oyster cellars"],
    ["1927", "the last NY bed closes"],
    ["today", "a luxury on ice"]
  ];

  // camera: hold on each moment, then glide to the next
  function cam(p) {
    const i = Math.floor(p), f = p - i;
    return (i + ease(clamp((f - 0.5) / 0.5))) * GAP;
  }

  window.Scenes = window.Scenes || {};
  window.Scenes.history = {
    VW, VH,
    // phones: a narrower window on the same table, and one stacked caption per moment
    layout(n) { M = n; VW = n ? 760 : 940; VH = n ? 800 : 780; this.VW = VW; this.VH = VH; },
    draw(g, st, p, t) {
      const sc = st.s * st.dpr, cx = cam(p);
      // a thin ink timeline across the table
      contour(g, [[-50, 700], [VW + 50, 700]], { close: false, w: 1.2, color: "#6e7480", a: 0.5 });
      V.forEach((fn, i) => {
        const x = VW / 2 + i * GAP - cx;
        if (x < -500 || x > VW + 500) return;
        const sp = sprite("hist" + i, sc, -360, -300, 720, 600, (g2) => { fn(g2); finish(g2, 720, 600, { transparent: true, bloom: 0, warmA: 0.3, haze: 0.12 }); });
        const d = Math.abs(x - VW / 2) / GAP;
        g.save(); g.translate(x, CY); blit(g, sp, 0, 0, 1 - 0.35 * clamp(d), 1 - 0.12 * clamp(d), 0, 0); g.restore();
        // tick on the timeline
        g.save(); g.fillStyle = "rgba(43,52,64,.7)"; g.beginPath(); g.arc(x, 700, d < 0.5 ? 5 : 3, 0, 7); g.fill(); g.restore();
      });
    },
    labels(p) {
      const cx = cam(p), out = [];
      LAB.forEach(([y, s], i) => {
        const x = VW / 2 + i * GAP - cx, d = Math.abs(x - VW / 2) / GAP;
        if (M) { out.push({ id: "y" + i, x, y: 752, html: `${y}<small>${s}</small>`, cls: "year stack", a: clamp(1 - d * 1.4) }); return; }
        out.push({ id: "y" + i, x, y: 734, html: `${y}`, cls: "year", a: clamp(1 - d * 1.4) });
        out.push({ id: "s" + i, x, y: 759, html: `${s}`, a: clamp(1 - d * 1.6) });
      });
      // price cards drawn in the scene
      const x3 = VW / 2 + 3 * GAP - cx, x5 = VW / 2 + 5 * GAP - cx;
      out.push({ id: "c6", x: x3 + 150 + 64, y: CY + 150 - 4, html: "6¢", cls: "big", a: clamp(1 - Math.abs(x3 - VW / 2) / GAP * 1.5) });
      out.push({ id: "c334", x: x5 + 190 + 70, y: CY - 120 + 12, html: "$3.34", cls: "big", a: clamp(1 - Math.abs(x5 - VW / 2) / GAP * 1.5) });
      out.push({ id: "cond", x: VW / 2 + 4 * GAP - cx + 225, y: CY - 135, html: "CONDEMNED", a: clamp(1 - Math.abs(VW / 2 + 4 * GAP - cx - VW / 2) / GAP * 1.5) });
      return out;
    }
  };
})();
