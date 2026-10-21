/* The Half Shell · style: the essay's own watercolour engine (lib/wc.js, lib/things.js)
   on the essay's sunlit wood table. One painted layer composited over a baked table.
   Static drawings are cached as sprites (WC.sprite) and blitted, so frames stay fast.
   Implements the explainer kit's style contract. */
(function () {
  "use strict";
  const W = window.WC, T = window.Things;
  const COL = { ink: "#2b3440", accent: "#c95a40", muted: "#6e7480", paper: "#fbf3e2", indigo: "#3d6090", yolk: "#f7d23a", green: "#7aa04e", brine: "#2f6a8c", butter: "#e3b42f", copper: "#b0703f", cream: "#fffaf0", sea: "#5d86ad" };
  const FONT = { display: ['"Zen Maru Gothic"', 700], body: ["Barlow", 500], mono: ['"IBM Plex Mono"', 500] };

  // the table, painted once
  let page = null;
  function table() {
    if (page) return page;
    page = document.createElement("canvas"); page.width = 1920; page.height = 1080;
    const g = page.getContext("2d"); g.__scale = 1;
    W.wood(g, 0, 0, 1920, 1080, { seed: 31, streaks: 26, thick: 130 });
    g.fillStyle = "rgba(250,240,222,.3)"; g.fillRect(0, 0, 1920, 1080);
    W.rays(g, 1920, 1080, { a: 0.12, bands: [[0.12, 0.1], [0.4, 0.05], [0.68, 0.12]] });
    W.finish(g, 1920, 1080, { warmA: 0.25, haze: 0.2, bloom: 0 });
    return page;
  }

  window.makeOysterStyle = function (canvas) {
    const B = window.ExplainerStage.Layers(canvas, ["main"]), g = B.L.main, A = () => B.alphaNow();
    g.__scale = 1;
    const col = (role) => COL[role] || role;
    const withA = (a, fn) => { if (A() * a <= 0.003) return; g.save(); g.globalAlpha = A() * a; fn(); g.restore(); };
    const S = Object.assign(B, {
      COL, g, W, T,
      begin() { B.clearLayers(); g.lineCap = g.lineJoin = "round"; },
      end() { const c = B.ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = "source-over"; c.drawImage(table(), 0, 0); c.drawImage(g.canvas, 0, 0); },
      // a wash: flat colour, pigment mottle, a pooled darker edge
      fill(role, pts, a = 1) {
        if (pts instanceof Path2D) { withA(a, () => { g.fillStyle = col(role); g.fill(pts); }); return; }
        withA(a, () => W.wash(g, pts, { color: role === "paper" ? "#fbf7ec" : col(role), mottle: role === "paper" ? 0.05 : 0.18, mscale: 0.8, edge: 2.5, soft: 0, seed: pts.length }));
      },
      // a thin hand contour, revealed along its length with o.k
      line(role, pts, w = 2.6, o = {}) { if (!pts || pts.length < 2) return; withA(o.a ?? 1, () => W.contour(g, pts, { color: col(role || "ink"), w, a: 0.9, k: o.k ?? 1, close: !!o.close, seed: o.seed || 0, jit: o.jit ?? 0.5 })); },
      circle(role, x, y, r, a = 1) { if (r > 0) S.fill(role, W.circlePts(x, y, r, r, 48), a); },
      mark(role, x, y, r, a = 1) { if (r > 0) withA(a, () => { g.fillStyle = "#fffaf0"; g.beginPath(); g.arc(x, y, r + 3, 0, 7); g.fill(); g.fillStyle = col(role === "ink" ? "brine" : role); g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }); },
      text(role, s, x, y, o = {}) {
        if (!s) return;
        withA(o.a ?? 1, () => {
          const [fam, wt] = FONT[o.font || "display"]; g.font = `${o.weight || wt} ${o.size || 48}px ${fam}`;
          g.textAlign = o.align || "center"; g.textBaseline = o.base || "alphabetic";
          if (o.halo !== false) { g.lineJoin = "round"; g.strokeStyle = role === "cream" ? "rgba(30,50,80,.35)" : "rgba(250,242,226,.85)"; g.lineWidth = Math.max(4, (o.size || 48) * 0.16); g.strokeText(s, x, y); }
          g.fillStyle = col(role); g.fillText(s, x, y);
        });
      },
      measure(s, size, font = "display") { const [fam, wt] = FONT[font]; g.font = `${wt} ${size}px ${fam}`; return g.measureText(s).width; },
      prop(name, x, y, size, t) { const P = PROPS[name]; if (!P) return false; S.save(); S.translate(x, y); S.scale(size, size); P(S, t || 0); S.restore(); return true; },

      /* ---- the essay's vocabulary ---- */
      // cached drawing: key, bounds in canvas units, painter fn(g2). Drawn with the current transform.
      spr(key, x, y, w, h, fn) { return W.sprite(key, 1, x, y, w, h, (g2) => { g2.__scale = 1; fn(g2); }); },
      blit(sp, dx = 0, dy = 0, a = 1, s = 1, cx, cy) { if (a * A() <= 0.003) return; g.save(); g.globalAlpha = A(); W.blit(g, sp, dx, dy, a, s, cx, cy); g.restore(); },
      // paint a sprite and finish it in the essay's warm light
      lit(key, x, y, w, h, fn) { return S.spr(key, x, y, w, h, (g2) => { fn(g2); W.finish(g2, w, h, { transparent: true, bloom: 0, warmA: 0.3, haze: 0.08 }); }); },
      sparkle(x, y, r = 12, tw = 1) { withA(1, () => T.sparkle(g, x, y, r, tw)); },
      label(s, x, y, o = {}) { S.text(o.role || "ink", s, x, y, { size: o.size || 34, font: "mono", align: o.align || "center", a: o.a }); },
    });
    return S;
  };

  const PROPS = {
    oyster(S) { S.blit(S.lit("p-oy", -230, -260, 460, 520, (g) => T.oyster(g, 0, 0, 3.4, 0.3, { species: "pacific", seed: 41 }))); },
    platter(S) { S.blit(S.lit("p-pl", -300, -260, 600, 520, (g) => { T.platter(g, 0, 0, 260, 230); T.ice(g, W.blobPts(0, 0, 220, 195, { wob: 0.05, seed: 3 }), { seed: 4, size: 14 }); for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.28; T.oyster(g, Math.cos(a) * 130, Math.sin(a) * 110, 1.25, a - Math.PI / 2, { species: "eastern", seed: 50 + i }); } T.mignonette(g, 0, 0, 0.9); })); },
    lemon(S) { S.blit(S.lit("p-le", -150, -120, 300, 240, (g) => T.lemon(g, 0, 0, 3.2, 0.2))); },
    glass(S) { S.blit(S.lit("p-gl", -160, -160, 320, 320, (g) => T.glass(g, 0, 0, 3, { kind: "coupe" }))); },
    coin(S) { S.blit(S.lit("p-co", -120, -120, 240, 240, (g) => { W.wash(g, W.circlePts(0, 0, 90), { color: "#c4cbd0", mottle: 0.15, edge: 3, edgeColor: "#7d8a94", glaze: { pts: W.circlePts(18, -18, 90), invert: true, color: "#98a4ad", a: 0.55 } }); W.rimGloss(g, 0, 0, 78, 78, Math.PI * 0.55, Math.PI * 1.1, { w: 4 }); })); },
    map(S) { S.blit(S.lit("p-map", -320, -200, 640, 400, (g) => { W.mat(g, W.blobPts(0, 0, 300, 180, { wob: 0.05, seed: 2 }), { seed: 5 }); const pr = (lon, lat) => [(lon + 95) * 7.2, (38 - lat) * 9]; for (const ring of window.GEO.USA) if (ring.length > 20) W.wash(g, ring.map(([lo, la]) => pr(lo, la)), { color: "#f6e8cc", mottle: 0.04, edge: 2, edgeColor: "#c4a576" }); })); },
    versusA(S) { S.blit(S.lit("p-va", -230, -260, 460, 520, (g) => T.oyster(g, 0, 0, 3.4, 0.3, { species: "eastern", seed: 61, k: 1.12 }))); },
    versusB(S) { S.blit(S.lit("p-vb", -230, -260, 460, 520, (g) => T.oyster(g, 0, 0, 3.4, 0.3, { species: "eastern", seed: 62, k: 0.66 }))); },
  };
})();
