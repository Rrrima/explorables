/* Coda: the platter after the meal: empty shells, a squeezed lemon, the last of the ice. */
(function () {
  "use strict";
  const { mat, blobPts, smoothClosed, finish, sprite, blit, rng } = WC;
  const T = Things;
  const VW = 900, VH = 520;
  function paint(g) {
    mat(g, smoothClosed([[140, 40], [760, 30], [860, 260], [760, 490], [150, 500], [40, 260]], 8), { seed: 121, nblooms: 1 });
    T.platter(g, 450, 265, 250, 215, { color: "#c4ced6" });
    T.ice(g, blobPts(452, 262, 212, 180, { wob: 0.05, seed: 4 }), { seed: 13, size: 14, base: "#c9dbe6" });
    const r = rng(8);
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2 + r() * 0.3, R = 120 + r() * 50;
      T.oyster(g, 450 + Math.cos(a) * R * 1.1, 265 + Math.sin(a) * R * 0.85, 1.2 + r() * 0.3, a - Math.PI / 2 + (r() - 0.5), { species: r() < 0.7 ? "eastern" : "pacific", empty: true, seed: 900 + i });
    }
    T.lemon(g, 440, 255, 1.3, 2.2, { seed: 7 });
    T.knife(g, 760, 455, 1.0, -0.5);
    finish(g, VW, VH, { transparent: true, bloom: 0.06, warmA: 0.3 });
  }
  window.Scenes = window.Scenes || {};
  window.Scenes.coda = { VW, VH, draw(g, st) { blit(g, sprite("coda", st.s * st.dpr, 0, 0, VW, VH, paint)); } };
})();
