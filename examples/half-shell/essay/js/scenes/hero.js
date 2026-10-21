/* Hero: a raw-bar platter, twelve oysters from twelve waters, on a sunlit table. */
(function () {
  "use strict";
  const { PAL, mat, blobPts, circlePts, smoothClosed, finish, rays, sprite, blit } = WC;
  const T = Things;
  const D = window.DATA;
  const VW = 1000, VH = 860;
  const C = { x: 500, y: 450 };
  const SP = { wellfleet: "eastern", islandcreek: "eastern", malpeque: "eastern", rappahannock: "eastern", gulf: "eastern",
    kumamoto: "kumamoto", hamahama: "pacific", kusshi: "kumamoto", olympia: "kumamoto", belon: "flat", verte: "pacific", sydney: "eastern" };
  const SIZE = { kusshi: 1.55, olympia: 1.2, kumamoto: 1.5, belon: 1.65, sydney: 1.55 };
  // 8 around the rim, 4 inside
  const spots = D.platter.map((o, i) => {
    const outer = i < 8, n = outer ? 8 : 4, k = outer ? i : i - 8;
    const a = (k / n) * Math.PI * 2 + (outer ? -Math.PI / 2 : Math.PI / 4);
    const R = outer ? 228 : 112;
    return { o, x: C.x + Math.cos(a) * R * 1.02, y: C.y + Math.sin(a) * R * 0.95, rot: a - Math.PI / 2 + (i % 2 ? 0.12 : -0.1), s: SIZE[o.id] || 1.9 };
  });

  function paint(g) {
    mat(g, smoothClosed([[110, 110], [520, 40], [880, 130], [975, 430], [900, 730], [540, 830], [150, 780], [30, 470]], 8), { seed: 7, nblooms: 2 });
    mat(g, smoothClosed([[790, 650], [960, 630], [985, 800], [820, 840]], 8), { seed: 12, nblooms: 1 });
    T.platter(g, C.x, C.y, 360, 340);
    T.ice(g, blobPts(C.x + 3, C.y - 3, 318, 298, { wob: 0.04, seed: 2, n: 140 }), { seed: 5, size: 17 });
    spots.forEach((sp, i) => T.oyster(g, sp.x, sp.y, sp.s, sp.rot, { species: SP[sp.o.id], seed: 3 + i * 7, green: sp.o.id === "verte", mood: sp.o.id === "wellfleet" ? "smile" : null }));
    T.mignonette(g, C.x, C.y, 1.15);
    T.lemon(g, C.x - 118, C.y + 6, 1.15, 1.4, { seed: 2 });
    T.lemon(g, C.x + 118, C.y - 6, 1.15, -1.7, { seed: 4 });
    T.glass(g, 905, 120, 1.55, { kind: "coupe" });
    T.knife(g, 150, 790, 1.35, -0.32);
    T.lemon(g, 880, 730, 1.5, 2.6, { seed: 9 });
    rays(g, VW, VH, { a: 0.08 });
    finish(g, VW, VH, { transparent: true, bloom: 0.08, warmA: 0.35 });
  }

  window.Scenes = window.Scenes || {};
  window.Scenes.hero = {
    VW, VH, anim: true,
    draw(g, st, p, t, item) {
      const sc = st.s * st.dpr;
      const base = sprite("hero", sc, -40, -40, VW + 80, VH + 80, paint);
      blit(g, base);
      spots.forEach((sp, i) => {
        const on = item.hover === sp.o.id;
        const tw = 0.5 + 0.5 * Math.sin(t * 1.6 + i * 1.7);
        T.sparkle(g, sp.x + 26, sp.y - 34, on ? 11 : 7, on ? 1 : tw);
      });
    },
    hot() {
      return spots.map((sp) => ({ id: sp.o.id, x: sp.x, y: sp.y, r: 58,
        html: `<b>${sp.o.name}</b>${sp.o.where} · ${sp.o.sp}<br><i>“${sp.o.note}”</i><span class="src">source ${sp.o.src}</span>` }));
    }
  };
})();
