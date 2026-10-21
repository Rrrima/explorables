/* Ch3 a jar of the sea: a magnifier on the oyster's cells. Saltier water → more free amino
   acids in every cell (taurine ≈ 80% of them) → more savoury. Then the three-phase taste. */
(function () {
  "use strict";
  const { wash, mat, blobPts, circlePts, smoothClosed, smoothOpen, stroke, contour, rimGloss, fleck, shadow, finish, sprite, blit, rng, ease, clamp, seg, mix, rgba } = WC;
  const T = Things;
  let VW = 1000, VH = 780, M = null;
  const L = { x: 690, y: 330, r: 205 };           // the lens
  const O = { x: 270, y: 400 };                    // the oyster
  // phones: oyster and lens side by side on top (each moved + scaled from desktop units),
  // then the legend, the reading, the gauge and the taste ribbon stacked under them
  const MOB = { VW: 600, VH: 740, o: { x: 150, y: 190, s: 0.5 }, l: { x: 446, y: 190, s: 0.7 }, gx: 80, gy: 502, gw: 440, rx: 250, ry: 588 };
  function at(g, k, ax, ay) { const t = M[k]; g.translate(t.x, t.y); g.scale(t.s, t.s); g.translate(-ax, -ay); }
  const MAXD = 16;                                 // dots per cell at 35 ppt

  // cells inside the lens: a loose honeycomb
  const cells = [];
  { const r = rng(21);
    for (let row = -3; row <= 3; row++) for (let col = -3; col <= 3; col++) {
      const x = L.x + col * 64 + (row % 2 ? 32 : 0) + (r() - 0.5) * 8, y = L.y + row * 56 + (r() - 0.5) * 8;
      if (Math.hypot(x - L.x, y - L.y) > L.r - 24) continue;
      const dots = [];
      for (let k = 0; k < MAXD; k++) { const a = r() * 6.28, d = Math.sqrt(r()) * 20; dots.push([x + Math.cos(a) * d, y + Math.sin(a) * d * 0.9, k % 5 === 4 ? 1 + (k % 3) : 0]); }
      cells.push({ x, y, seed: row * 10 + col, dots });
    } }
  const DOT = ["#2f6a8c", "#d8573b", "#e3b42f", "#7aa04e"];   // taurine, glycine, alanine, glutamate
  const water = (ppt) => mix("#b9c4a0", "#5d86ad", clamp((ppt - 5) / 30));

  function pptAt(p, item) {
    if (item && item.user != null && p > 1.6 && p < 3.2) return item.user;
    const k = [20, 8, 35, 35];
    const i = Math.min(3, Math.floor(p)), f = ease(clamp((p - i - 0.35) / 0.5));
    return i >= 3 ? 35 : k[i] + (k[i + 1] - k[i]) * f;
  }

  window.Scenes = window.Scenes || {};
  window.Scenes.jar = {
    VW, VH,
    layout(n) { M = n ? MOB : null; VW = n ? MOB.VW : 1000; VH = n ? MOB.VH : 780; this.VW = VW; this.VH = VH; },
    init(st, item) {
      const ctrl = item.el.querySelector(".ctrl"), inp = ctrl && ctrl.querySelector("input");
      item.ctrl = ctrl;
      if (inp) inp.addEventListener("input", () => { item.user = +inp.value; item.drawn = -2; item.p = -1; });
    },
    draw(g, st, p, t, item) {
      const sc = st.s * st.dpr, ppt = pptAt(p, item);
      if (item.ctrl) { const on = p > 1.6 && p < 3.2; item.ctrl.style.display = on ? "flex" : "none"; if (!on) item.user = null; const inp = item.ctrl.querySelector("input"); if (inp && item.user == null) inp.value = Math.round(ppt); }
      g.save(); if (M) at(g, "o", O.x, O.y);
      blit(g, sprite("jar-base", sc * (M ? M.o.s : 1), 0, 0, 1000, 780, (g2) => {
        mat(g2, smoothClosed([[40, 160], [430, 110], [520, 380], [470, 660], [80, 690], [10, 420]], 8), { seed: 71, nblooms: 1 });
        T.oyster(g2, O.x, O.y, 4.3, -0.35, { species: "pacific", seed: 401 });
        finish(g2, 1000, 780, { transparent: true, bloom: 0, warmA: 0.3, haze: 0.1 });
      }));
      g.restore();
      // leader from the meat to the lens
      const lin = ease(seg(p, 0, 0.5));
      const a0 = M ? [M.o.x + 40 * M.o.s, M.o.y - 20 * M.o.s] : [O.x + 40, O.y - 20];
      const a1 = M ? [M.l.x - L.r * 0.92 * M.l.s, M.l.y + 40 * M.l.s] : [L.x - L.r * 0.92, L.y + 40];
      contour(g, [a0, [a0[0] + (a1[0] - a0[0]) * lin, a0[1] + (a1[1] - a0[1]) * lin]], { close: false, w: 1.4, color: "#2b3440", a: 0.6 });
      g.save(); g.fillStyle = "rgba(43,52,64,.7)"; g.beginPath(); g.arc(a0[0], a0[1], 4, 0, 7); g.fill(); g.restore();
      g.save(); if (M) at(g, "l", L.x, L.y);
      // the lens: water tinted by salinity, cells with amino-acid dots
      const lensPts = circlePts(L.x, L.y, L.r, L.r, 120);
      shadow(g, lensPts, { dx: -10, dy: 12, a: 0.35 });
      wash(g, lensPts, { color: water(ppt), mottle: 0.25, mscale: 1, edge: 6, edgeColor: mix(water(ppt), "#1e3550", 0.4), soft: 0.5, seed: 3 });
      g.save(); WC.path(g, lensPts); g.clip();
      const n = Math.round((ppt / 35) * MAXD);
      for (const c of cells) {
        wash(g, blobPts(c.x, c.y, 29, 25, { wob: 0.1, seed: c.seed, n: 40 }), { color: "#f6efe0", a: 0.92, mottle: 0.12, mscale: 0.4, edge: 2.5, edgeColor: "#c9b99a", soft: 0, seed: c.seed });
        for (let k = 0; k < n; k++) { const [x, y, kind] = c.dots[k]; g.fillStyle = rgba(DOT[kind], 0.9); g.beginPath(); g.arc(x, y, kind ? 3.2 : 3.6, 0, 7); g.fill(); }
      }
      g.restore();
      // brass rim
      contour(g, lensPts, { w: 9, color: "#c9a25a", a: 0.95 });
      contour(g, circlePts(L.x, L.y, L.r - 6, L.r - 6, 120), { w: 1.4, color: "#7d5f2a", a: 0.6 });
      rimGloss(g, L.x, L.y, L.r, L.r, Math.PI * 0.55, Math.PI * 1.1, { w: 3.4, seed: 5 });
      g.restore();
      // salinity gauge: six wet blocks from brackish to ocean, a pointer
      const gx = M ? M.gx : 470, gy = M ? M.gy : 600, gw = 440;
      for (let i = 0; i < 6; i++) wash(g, blobPts(gx + (i + 0.5) * (gw / 6), gy, gw / 12 + 2, 14, { wob: 0.06, seed: i, n: 30 }), { color: water(5 + i * 6), mottle: 0.2, edge: 2, soft: 0, seed: i });
      const px = gx + ((ppt - 5) / 30) * gw;
      stroke(g, [[px, gy - 30], [px, gy + 22]], { w: 3, color: "#2b3440", taper: false, a: 0.85 });
      g.save(); g.fillStyle = "#2b3440"; g.beginPath(); g.moveTo(px - 8, gy - 38); g.lineTo(px + 8, gy - 38); g.lineTo(px, gy - 27); g.closePath(); g.fill(); g.restore();
      // three-phase taste ribbon
      const tr = seg(p, 2.7, 3.3);
      if (tr > 0) {
        [["#5d86ad", 0.85], ["#f2c94c", 0.7], ["#c97b5a", 0.55]].forEach(([c, len], i) => {
          const k = ease(clamp(tr * 3 - i));
          const rx = M ? M.rx : 480, ry = M ? M.ry : 690, rl = M ? 320 : 360;
          if (k > 0) stroke(g, smoothOpen([[rx, ry + i * 28], [rx + rl * len * k, ry + i * 28 + 2]]), { w: 16, color: c, a: 0.85, seed: i });
        });
      }
    },
    labels(p, item) {
      const ppt = pptAt(p, item), tr = seg(p, 2.7, 3.3), lensA = seg(p, 0.3, 0.7);
      const word = ppt < 13 ? "bland, washed out" : ppt < 26 ? "mild" : "savoury, rich";
      if (M) {
        const dots = `<span style="color:#d8573b">●</span><span style="color:#e3b42f">●</span><span style="color:#7aa04e">●</span> glycine, alanine, glutamate`;
        return [
          { id: "leg", x: VW / 2, y: 372, a: lensA, cls: "stack", html: `cells, magnified · <span style="color:#2f6a8c">●</span> taurine ≈ 80%<small style="margin-top:3px">${dots}</small>` },
          { id: "ppt", x: VW / 2, y: 438, html: `${Math.round(ppt)} ppt · ${word}`, a: 1 },
          { id: "g0", x: M.gx, y: M.gy + 34, html: "5", align: "left", a: 0.8 },
          { id: "g1", x: M.gx + 440, y: M.gy + 34, html: "35 ppt · ocean", align: "right", a: 0.8 },
          { id: "gm", x: M.gx + 75, y: M.gy + 34, html: "Gulf", a: 0.6 },
          { id: "t1", x: M.rx - 12, y: M.ry, html: "1 · salt", align: "right", a: tr },
          { id: "t2", x: M.rx - 12, y: M.ry + 28, html: "2 · sweet (glycogen)", align: "right", a: tr },
          { id: "t3", x: M.rx - 12, y: M.ry + 56, html: "3 · finish", align: "right", a: tr }
        ];
      }
      return [
        { id: "ppt", x: 690, y: 565, html: `${Math.round(ppt)} ppt · ${word}`, a: 1 },
        { id: "g0", x: 470, y: 632, html: "5", align: "left", a: 0.8 },
        { id: "g1", x: 910, y: 632, html: "35 ppt · ocean", align: "right", a: 0.8 },
        { id: "gm", x: 545, y: 632, html: "Gulf", a: 0.6 },
        { id: "leg", x: L.x, y: L.y - L.r - 42, a: lensA,
          html: `cells, magnified · <span style="color:#2f6a8c">●</span> taurine ≈ 80% · <span style="color:#d8573b">●</span><span style="color:#e3b42f">●</span><span style="color:#7aa04e">●</span> glycine, alanine, glutamate` },
        { id: "t1", x: 480, y: 690, html: "1 · salt", align: "right", cls: "", a: tr },
        { id: "t2", x: 480, y: 718, html: "2 · sweet (glycogen)", align: "right", a: tr },
        { id: "t3", x: 480, y: 746, html: "3 · finish", align: "right", a: tr }
      ].map((l) => (l.id.startsWith("t") ? Object.assign(l, { x: l.x - 12 }) : l));
    }
  };
})();
