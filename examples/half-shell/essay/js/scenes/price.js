/* Ch6 the most expensive: oysters at true relative size (2.7 units per mm) beside a
   20 cm ruler, each with its price. The Coffin Bay King arrives last. */
(function () {
  "use strict";
  const { wash, mat, smoothClosed, stroke, contour, shadow, finish, sprite, blit, ease, clamp, seg } = WC;
  const T = Things;
  const D = window.DATA;
  let VW = 1150, VH = 780, MM = 2.7, BASE = 650, M = false, items;
  const SPC = { bistro: ["pacific", 58], kumamoto: ["kumamoto", 36], belon: ["flat", 46], gillardeau: ["pacific", 58], king: ["pacific", 58] };
  const X = { bistro: 140, kumamoto: 285, belon: 460, gillardeau: 690, king: 975 };
  // phones: the same true relative sizes at a smaller mm scale, packed closer; prices sit on top of each oyster
  const XM = { bistro: 118, kumamoto: 206, belon: 302, gillardeau: 434, king: 600 };
  const STEP = { bistro: 0, kumamoto: 1, belon: 2, gillardeau: 2, king: 3 };
  function build() {
    items = D.lineup.map((o) => {
      const [sp, L] = SPC[o.id], len = o.mm * MM, s = len / (2 * L * 1.08);
      return { o, sp, s, len, x: (M ? XM : X)[o.id], y: BASE - len / 2 - 6 };
    });
  }
  build();

  // phones: the price rides on top of each oyster; the current step's names and sources form one caption under the line
  function mlabels(p) {
    const out = [{ id: "cm", x: 12, y: BASE - 200 * MM - 30, align: "left", html: "20 cm" }, { id: "cm0", x: 40, y: BASE + 22, html: "0" }];
    const cur = [];
    for (const it of items) {
      const off = it.o.id === "gillardeau" ? 0.15 : 0, k = seg(p, STEP[it.o.id] - 0.1 + off, STEP[it.o.id] + 0.3 + off);
      const usd = it.o.usd >= 10 ? `$${Math.round(it.o.usd)}` : `$${it.o.usd.toFixed(2)}`;
      out.push({ id: it.o.id, x: it.x, y: BASE - it.len - 26, cls: "light", a: k, html: `<b style="font-family:var(--head);font-size:19px">${usd}</b>` });
      if (STEP[it.o.id] === Math.min(3, Math.floor(p + 0.1))) cur.push(`<span style="display:block">${it.o.name} · ${it.o.yrs} yr · ${it.o.label.replace(/ \/ /g, "\u00a0/\u00a0")}</span>`);
    }
    out.push({ id: "cap", x: VW / 2 + 20, y: BASE + 84, cls: "light", html: `<span class="cap" style="width:320px">${cur.join("")}</span>`, a: 1 });
    return out;
  }

  window.Scenes = window.Scenes || {};
  window.Scenes.price = {
    VW, VH,
    layout(n) { M = n; VW = n ? 730 : 1150; VH = n ? 690 : 780; MM = n ? 2.0 : 2.7; BASE = n ? 520 : 650; build(); this.VW = VW; this.VH = VH; },
    draw(g, st, p) {
      const sc = st.s * st.dpr;
      blit(g, sprite("pr-base", sc, 0, 0, VW, VH, (g2) => {
        mat(g2, smoothClosed(M ? [[84, 40], [686, 28], [704, 340], [688, 674], [76, 682], [60, 340]] : [[90, 60], [1110, 40], [1135, 400], [1110, 770], [80, 775], [60, 380]], 8), { seed: 91, blooms: false });
        // wooden ruler, 0–20 cm, standing at the left
        const rp = [[18, BASE + 4], [62, BASE + 4], [62, BASE - 200 * MM - 14], [18, BASE - 200 * MM - 14]];
        shadow(g2, rp, { dx: -6, dy: 8, a: 0.4 });
        wash(g2, rp, { color: "#e8c58c", mottle: 0.3, kind: "streak", edge: 2.5, edgeColor: "#a87c44", seed: 4 });
        for (let mm = 0; mm <= 200; mm += 5) { const y = BASE - mm * MM, big = mm % 10 === 0; stroke(g2, [[62, y], [62 - (big ? 18 : 9), y]], { w: big ? 1.8 : 1.1, color: "#5a4127", a: 0.85, taper: false }); }
        // baseline
        contour(g2, [[90, BASE + 2], [VW - 40, BASE + 2]], { close: false, w: 1.2, color: "#fbf3e2", a: 0.5 });
        finish(g2, VW, VH, { transparent: true, bloom: 0, warmA: 0.28, haze: 0.08 });
      }));
      for (const it of items) {
        const k = ease(seg(p, STEP[it.o.id] - 0.35 + (it.o.id === "gillardeau" ? 0.15 : 0), STEP[it.o.id] + 0.15 + (it.o.id === "gillardeau" ? 0.15 : 0)));
        if (k <= 0) continue;
        const sp = sprite("pr-" + it.o.id, sc, it.x - it.len * 0.45, it.y - it.len * 0.62, it.len * 0.9, it.len * 1.24, (g2) =>
          T.oyster(g2, it.x, it.y, it.s, Math.PI + (it.o.id === "king" ? 0.04 : 0), { species: it.sp, seed: 600 + it.o.mm, green: false }));
        blit(g, sp, it.o.id === "king" ? 160 * (1 - k) : 0, 26 * (1 - k), k);
        // a tick on the ruler at its length
        g.save(); g.globalAlpha = k * 0.7; g.strokeStyle = "#fbf3e2"; g.setLineDash([4, 6]); g.lineWidth = 1.2;
        const ty = BASE - it.o.mm * MM; g.beginPath(); g.moveTo(66, ty); g.lineTo(it.x - 20, ty); g.stroke(); g.restore();
      }
    },
    labels(p) {
      if (M) return mlabels(p);
      const out = [{ id: "cm", x: 40, y: BASE - 200 * MM - 32, html: "20 cm", cls: "light" }, { id: "cm0", x: 40, y: BASE + 22, html: "0", cls: "light" }];
      for (const it of items) {
        const k = seg(p, STEP[it.o.id] - 0.1 + (it.o.id === "gillardeau" ? 0.15 : 0), STEP[it.o.id] + 0.3 + (it.o.id === "gillardeau" ? 0.15 : 0));
        const usd = it.o.usd >= 10 ? `$${Math.round(it.o.usd)}` : `$${it.o.usd.toFixed(2)}`;
        out.push({ id: it.o.id, x: it.x, y: BASE + 46, cls: "light", a: k, html: `<b style="font-family:var(--head);font-size:24px">${usd}</b><small style="width:128px">${it.o.name} · ${it.o.yrs} yr<br>${it.o.label}</small>` });
      }
      return out;
    }
  };
})();
