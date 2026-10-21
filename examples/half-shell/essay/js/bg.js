/* The table: a fixed full-viewport canvas of sunlit wood behind the whole page. */
(function () {
  "use strict";
  const c = document.getElementById("table");
  if (!c) return;
  function paint() {
    const w = innerWidth, h = innerHeight, dpr = Math.min(1.5, devicePixelRatio || 1);
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    const g = c.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.__base = g.getTransform(); g.__scale = dpr;
    WC.wood(g, 0, 0, w, h, { seed: 31, streaks: Math.round(h / 40), thick: 110 });
    // keep it calm under text: a pale wash over the whole table
    g.fillStyle = "rgba(250,240,222,.42)"; g.fillRect(0, 0, w, h);
    WC.rays(g, w, h, { a: 0.1, bands: [[0.15, 0.1], [0.42, 0.05], [0.7, 0.12]] });
    WC.finish(g, w, h, { warmA: 0.25, haze: 0.2, bloom: 0 });
    // phones: the sticky stages are painted with the same table so text can slide under them
    if (w <= 860) { try { document.documentElement.style.setProperty("--table-img", `url(${c.toDataURL("image/jpeg", 0.85)})`); } catch (e) {} }
  }
  let tm = 0, lw = 0;
  addEventListener("resize", () => { if (Math.abs(innerWidth - lw) < 2 && Math.abs(innerHeight - c.height) < 120) return; clearTimeout(tm); tm = setTimeout(() => { lw = innerWidth; paint(); }, 200); });
  lw = innerWidth; paint();
})();
