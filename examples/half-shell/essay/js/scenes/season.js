/* Ch5 months with an R: a plate drawn as a year. R months on the rim, the spawning
   wedge, the Vibrio wedge; the oyster in the centre swells and thins as the bead goes round. */
(function () {
  "use strict";
  const { wash, mat, blobPts, circlePts, smoothClosed, contour, shadow, finish, sprite, blit, ease, clamp, seg, rgba, rimGloss } = WC;
  const T = Things;
  let VW = 1000, VH = 800, M = null;
  const C = { x: 470, y: 405 };
  // phones: the wheel (drawn in desktop units around C) is moved and scaled; the keys sit in the corners
  const MOB = { VW: 640, VH: 780, x: 320, y: 392, s: 0.8 };
  const wx = (x) => (M ? M.x + (x - C.x) * M.s : x), wy = (y) => (M ? M.y + (y - C.y) * M.s : y);
  function wheel(g) { if (M) { g.translate(M.x, M.y); g.scale(M.s, M.s); g.translate(-C.x, -C.y); } }
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const ang = (m) => -Math.PI / 2 + (m / 12) * Math.PI * 2;   // m: months from Jan 1 (float)

  function ring(g, m0, m1, r0, r1, color, a, seed) {
    const pts = [];
    for (let m = m0; m <= m1 + 1e-6; m += 0.1) pts.push([C.x + Math.cos(ang(m)) * r1, C.y + Math.sin(ang(m)) * r1]);
    for (let m = m1; m >= m0 - 1e-6; m -= 0.1) pts.push([C.x + Math.cos(ang(m)) * r0, C.y + Math.sin(ang(m)) * r0]);
    wash(g, pts, { color, a, mottle: 0.15, mscale: 0.6, edge: 2.5, soft: 0.5, seed });
  }
  // plumpness through the year: fat through winter and spring, peak before spawning, thin after
  function plump(m) {
    const mm = ((m % 12) + 12) % 12;
    const k = [1.02, 1.04, 1.07, 1.1, 1.12, 1.0, 0.82, 0.74, 0.8, 0.9, 0.96, 1.0];
    const i = Math.floor(mm), f = mm - i;
    return k[i] + (k[(i + 1) % 12] - k[i]) * f;
  }
  // bead position: month as a function of scroll
  function month(p) {
    const keys = [[0, 1.0], [1, 4.0], [2, 6.8], [3, 8.6], [4, 12.0]];
    const i = Math.min(3, Math.floor(p)), f = ease(clamp((p - i - 0.25) / 0.6));
    return keys[i][1] + (keys[i + 1][1] - keys[i][1]) * f;
  }

  window.Scenes = window.Scenes || {};
  window.Scenes.season = {
    VW, VH,
    layout(n) { M = n ? MOB : null; VW = n ? MOB.VW : 1000; VH = n ? MOB.VH : 800; this.VW = VW; this.VH = VH; },
    draw(g, st, p) {
      const sc0 = st.s * st.dpr, m = month(p);
      const fin = (g2, w, h) => finish(g2, w, h, { transparent: true, bloom: 0, warmA: 0.28, haze: 0.08 });
      if (M) blit(g, sprite("se-mat", sc0, 0, 0, VW, VH, (g2) => { mat(g2, smoothClosed([[40, 22], [600, 14], [626, 390], [606, 758], [36, 766], [14, 390]], 8), { seed: 81, nblooms: 2 }); fin(g2, VW, VH); }));
      g.save(); wheel(g);
      const sc = sc0 * (M ? M.s : 1);
      blit(g, sprite("se-base", sc, 0, 0, 1000, 800, (g2) => {
        if (!M) mat(g2, smoothClosed([[120, 80], [800, 60], [930, 380], [850, 760], [160, 770], [40, 420]], 8), { seed: 81, nblooms: 2 });
        T.dish(g2, C.x, C.y, 330, { bands: false, seed: 21 });
        // R months on the rim: cool indigo; May–Aug: warm
        for (let i = 0; i < 12; i++) ring(g2, i + 0.04, i + 0.96, 282, 316, i >= 4 && i <= 7 ? "#e7a07f" : "#7f9fc3", 0.85, i);
        fin(g2, 1000, 800);
      }));
      // spawning (Jun–Sep, warm water) and Vibrio (May–Oct) wedges grow in
      const sp = ease(seg(p, 0.6, 1.2)), vb = ease(seg(p, 1.6, 2.2));
      if (sp > 0) blit(g, sprite("se-spawn", sc, 0, 0, 1000, 800, (g2) => { ring(g2, 5.05, 8.95, 238, 272, "#f2cd57", 0.9, 31); fin(g2, 1000, 800); }), 0, 0, sp);
      if (vb > 0) blit(g, sprite("se-vib", sc, 0, 0, 1000, 800, (g2) => { ring(g2, 4.05, 9.95, 194, 228, "#c9573f", 0.85, 32); fin(g2, 1000, 800); }), 0, 0, vb);
      // the oyster: quantised plumpness, milky while spawning
      const k = plump(m), kq = Math.round(k * 20) / 20;
      blit(g, sprite("se-oy" + kq, sc, C.x - 170, C.y - 190, 340, 380, (g2) => { T.oyster(g2, C.x, C.y + 6, 2.55, 0.25, { species: "pacific", seed: 501, k: kq }); }));
      const mm = ((m % 12) + 12) % 12, milky = clamp(1 - Math.abs(mm - 6.5) / 1.6);
      if (milky > 0) { g.save(); g.globalAlpha = 0.55 * milky; g.filter = `blur(${10 * sc / st.dpr}px)`; g.fillStyle = "#fffdf3"; g.beginPath(); g.ellipse(C.x - 2, C.y + 14, 52, 74, 0.25, 0, 7); g.fill(); g.restore(); }
      // triploid twin, last step: stays plump all summer
      const tri = ease(seg(p, 3.2, 3.7));
      if (tri > 0 && !M) blit(g, sprite("se-tri", sc, 780, 520, 220, 270, (g2) => T.oyster(g2, 885, 660, 1.35, -0.3, { species: "pacific", seed: 777, k: 1.08 })), 0, 0, tri);
      // the bead
      const a = ang(m), bx = C.x + Math.cos(a) * 299, by = C.y + Math.sin(a) * 299;
      g.save(); g.strokeStyle = "rgba(43,52,64,.55)"; g.lineWidth = 2; g.setLineDash([3, 6]);
      g.beginPath(); g.moveTo(C.x + Math.cos(a) * 150, C.y + Math.sin(a) * 150); g.lineTo(C.x + Math.cos(a) * 280, C.y + Math.sin(a) * 280); g.stroke(); g.restore();
      wash(g, circlePts(bx, by, 15, 15, 30), { color: "#2b3440", mottle: 0, edge: 2, soft: 0 });
      rimGloss(g, bx, by, 10, 10, Math.PI * 0.6, Math.PI * 1.2, { w: 2.2 });
      g.restore();
      // phones: the triploid sits in the lower-right corner, outside the wheel
      if (tri > 0 && M) blit(g, sprite("se-tri", sc0, 506, 0, 134, 150, (g2) => T.oyster(g2, 574, 72, 1.08, -0.3, { species: "pacific", seed: 777, k: 1.08 })), 0, 0, tri);
    },
    labels(p) {
      const m = month(p), out = [];
      MON.forEach((n, i) => { const a = ang(i + 0.5); out.push({ id: n, x: wx(C.x + Math.cos(a) * 352), y: wy(C.y + Math.sin(a) * 352), html: i < 4 || i > 7 ? `${n}` : `<span style="color:#ffc9b3">${n}</span>`, cls: "light", a: 0.95 }); });
      const mm = ((m % 12) + 12) % 12, k = plump(m);
      const state = mm >= 5.3 && mm < 7.6 ? "spawning · milky, soft" : mm >= 7.6 && mm < 9.6 ? "spent · thin, bland" : k > 1.08 ? "plumpest · sweetest" : "plump · sweet";
      out.push({ id: "state", x: wx(C.x), y: wy(C.y + 205), html: state, a: 1 });
      if (M) {
        // a key with swatches along the bottom; the triploid in the top-right corner
        const key = (c, t) => `<span style="color:${c}">●</span> ${t}`;
        out.push({ id: "r", x: 26, y: 698, align: "left", cls: "light", html: key("#9fb9d8", "months with an R · Sep–Apr"), a: 0.9 });
        out.push({ id: "sp", x: 26, y: 728, align: "left", cls: "light", html: key("#f2cd57", "spawning · water above ~20°C"), a: seg(p, 0.8, 1.2) });
        out.push({ id: "vb", x: 26, y: 758, align: "left", cls: "light", html: key("#e0765c", "Vibrio peak · May – October"), a: seg(p, 1.8, 2.2) });
        out.push({ id: "tri", x: 512, y: 50, align: "right", cls: "light rt", html: "a triploid<small style=\"width:auto\">barely spawns</small>", a: seg(p, 3.3, 3.7) });
        return out;
      }
      out.push({ id: "sp", x: 120, y: 640, align: "left", cls: "light", html: "spawning<small>water above ~20°C</small>", a: seg(p, 0.8, 1.2) });
      out.push({ id: "vb", x: 140, y: 700, align: "left", cls: "light", html: "Vibrio peak<small>May – October</small>", a: seg(p, 1.8, 2.2) });
      out.push({ id: "r", x: 150, y: 128, align: "left", cls: "light", html: "months with an R<small>September – April</small>", a: 0.9 });
      out.push({ id: "tri", x: 885, y: 790, html: "a triploid: barely spawns", a: seg(p, 3.3, 3.7) });
      return out;
    }
  };
})();
