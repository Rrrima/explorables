/* Ch2 happy hour: a clock turns to five, the tag drops to $1, the dollar (twenty nickels)
   splits between farm, distributor and the bar, and the drinks pay for it. */
(function () {
  "use strict";
  const { wash, mat, blobPts, circlePts, smoothClosed, smoothOpen, stroke, contour, rimGloss, fleck, shadow, finish, sprite, blit, rng, ease, clamp, seg } = WC;
  const T = Things;
  let VW = 1000, VH = 780, M = null;
  // phones: three rows. Clock + plate on top, the nickels (later the drinks) in the middle,
  // farm · distributor · bar along the bottom. Each group is drawn in desktop units, moved and scaled.
  const MOB = { VW: 720, VH: 880,
    clock: [180, 170, 128, 150, 0.8], plate: [500, 300, 440, 252, 0.8],
    crate: [190, 660, 128, 690, 0.8], sack: [470, 670, 352, 690, 0.8], bar: [760, 690, 588, 690, 0.8] };
  const mp = (k, x, y) => { const t = M[k]; return [t[2] + (x - t[0]) * t[4], t[3] + (y - t[1]) * t[4]]; };
  function grp(g, k) { if (!M) return; const t = M[k]; g.translate(t[2], t[3]); g.scale(t[4], t[4]); g.translate(-t[0], -t[1]); }

  function coin(g, x, y, r = 13, seed = 1) {
    shadow(g, circlePts(x, y, r, r, 28), { dx: -2, dy: 3, blur: 2, a: 0.35 });
    wash(g, circlePts(x, y, r, r, 28), { color: "#c4cbd0", mottle: 0.15, mscale: 0.4, edge: 2, edgeColor: "#7d8a94", soft: 0.4, seed,
      glaze: { pts: circlePts(x + r * 0.25, y - r * 0.25, r, r, 28), invert: true, color: "#98a4ad", a: 0.55 } });
    contour(g, circlePts(x, y, r * 0.72, r * 0.72, 24), { color: "#8c98a2", w: 0.8, a: 0.6 });
    rimGloss(g, x, y, r * 0.86, r * 0.86, Math.PI * 0.55, Math.PI * 1.1, { w: 1.6, dash: 0.3, seed });
  }
  function clockFace(g) {
    const cx = 0, cy = 0, R = 105;
    shadow(g, circlePts(cx, cy, R + 8), { dx: -8, dy: 10, a: 0.45 });
    wash(g, circlePts(cx, cy, R + 8), { color: "#c9573f", mottle: 0.2, edge: 3, edgeColor: "#8e2d1f", seed: 3 });
    wash(g, circlePts(cx, cy, R - 4), { color: "#fbf7ec", mottle: 0.05, edge: 3, edgeColor: "#d8cdb6", seed: 4,
      glaze: { pts: circlePts(cx + 14, cy - 12, R - 4), invert: true, color: "#e6dccb", a: 0.6 } });
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; const r0 = i % 3 ? 84 : 76; stroke(g, [[Math.cos(a) * r0, Math.sin(a) * r0], [Math.cos(a) * 92, Math.sin(a) * 92]], { w: i % 3 ? 2 : 4, color: "#2b3440", a: 0.8, taper: false }); }
    rimGloss(g, cx, cy, R + 2, R + 2, Math.PI * 0.55, Math.PI * 1.1, { w: 3, seed: 2 });
  }
  function hands(g, x, y, mins) {
    const hA = ((4 + mins / 60) / 12) * Math.PI * 2 - Math.PI / 2, mA = (mins / 60) * Math.PI * 2 - Math.PI / 2;
    stroke(g, [[x, y], [x + Math.cos(hA) * 55, y + Math.sin(hA) * 55]], { w: 6, color: "#2b3440", a: 0.9 });
    stroke(g, [[x, y], [x + Math.cos(mA) * 82, y + Math.sin(mA) * 82]], { w: 4, color: "#2b3440", a: 0.9 });
    wash(g, circlePts(x, y, 6), { color: "#c9573f", mottle: 0, edge: 1 });
  }
  function crate(g) {
    const pts = [[-120, -70], [120, -70], [120, 70], [-120, 70]];
    shadow(g, pts, { dx: -8, dy: 10, a: 0.4 });
    wash(g, pts, { color: "#c99a62", mottle: 0.35, kind: "streak", edge: 3, edgeColor: "#8a6236", seed: 5 });
    wash(g, [[-104, -56], [104, -56], [104, 56], [-104, 56]], { color: "#8f6a42", mottle: 0.2, edge: 2, seed: 6 });
    const r = rng(4);
    for (let i = 0; i < 6; i++) T.oyster(g, -70 + (i % 3) * 70, -22 + Math.floor(i / 3) * 46, 0.85, r() * 6, { species: "eastern", shut: true, seed: 300 + i, shadowA: 0.3 });
    for (const y of [-34, 6, 46]) wash(g, [[-120, y - 7], [120, y - 7], [120, y + 7], [-120, y + 7]], { color: "#d5a76d", a: 0.95, mottle: 0.3, kind: "streak", edge: 2, edgeColor: "#8a6236", seed: y + 50 });
  }
  function sack(g) {
    const pts = blobPts(0, 0, 120, 75, { wob: 0.12, seed: 7 });
    shadow(g, pts, { dx: -8, dy: 10, a: 0.4 });
    wash(g, pts, { color: "#8c9a6c", mottle: 0.3, edge: 3, edgeColor: "#55623e", seed: 7 });
    const r = rng(8);
    for (let i = 0; i < 7; i++) T.oyster(g, -75 + r() * 150, -35 + r() * 70, 0.75, r() * 6, { species: "pacific", shut: true, seed: 320 + i, shadowA: 0.2 });
    g.save(); WC.path(g, pts); g.clip(); g.strokeStyle = "rgba(60,72,40,.55)"; g.lineWidth = 1.6;
    for (let k = -200; k < 200; k += 16) { g.beginPath(); g.moveTo(k, -90); g.lineTo(k + 120, 90); g.stroke(); g.beginPath(); g.moveTo(k + 120, -90); g.lineTo(k, 90); g.stroke(); }
    g.restore();
  }
  function stout(g) {
    shadow(g, circlePts(0, 0, 50), { dx: -6, dy: 8, a: 0.4 });
    T.glass(g, 0, 0, 1.25, { kind: "stout" });
    T.oyster(g, 105, 30, 1.4, 1.2, { species: "eastern", seed: 340 });
  }

  // nickels: 20 = $1. 0..10 farm (57¢), 11..14 distributor (20¢), 15..19 the bar's share
  const COIN0 = { x: 245, y: 545, dx: 27 };
  const DEST0 = (i) => i < 11 ? [115 + (i % 6) * 28, 655 + Math.floor(i / 6) * 28]
    : i < 15 ? [425 + (i - 11) * 28, 690] : [700 + (i - 15) * 28, 700];
  const DEST = (i) => { const d = DEST0(i); return M ? mp(i < 11 ? "crate" : i < 15 ? "sack" : "bar", d[0], d[1]) : d; };

  window.Scenes = window.Scenes || {};
  window.Scenes.happy = {
    VW, VH,
    layout(n) { M = n ? MOB : null; VW = n ? MOB.VW : 1000; VH = n ? MOB.VH : 780; this.VW = VW; this.VH = VH; },
    draw(g, st, p) {
      const sc0 = st.s * st.dpr, sc = sc0 * (M ? 0.8 : 1), cs = M ? 0.8 : 1;
      const fin = (g2, w, h) => finish(g2, w, h, { transparent: true, bloom: 0, warmA: 0.3, haze: 0.1 });
      const inGrp = (k, fn) => { g.save(); grp(g, k); fn(); g.restore(); };
      // base: mat, plate, oyster (+ the price tag)
      inGrp("plate", () => {
        blit(g, sprite("hh-base", sc, 0, 0, 1000, 780, (g2) => {
          mat(g2, smoothClosed([[300, 150], [700, 110], [760, 330], [700, 470], [330, 480], [250, 320]], 8), { seed: 61, nblooms: 1 });
          T.dish(g2, 500, 300, 125, { seed: 8 });
          T.oyster(g2, 500, 300, 2.3, 0.5, { species: "eastern", seed: 222 });
          fin(g2, 1000, 780);
        }));
        blit(g, sprite("hh-tag", sc, 560, 120, 220, 140, (g2) => T.tag(g2, 600, 180, 1.8, 0.12, { w: 80, h: 44, seed: 3, string: [[575, 205], [545, 240]] })));
      });
      // the clock, or (last step) the old saloon's free lunch in its place
      const free = seg(p, 3.55, 4.1);
      inGrp("clock", () => {
        blit(g, sprite("hh-clock", sc, 60, 50, 240, 240, (g2) => { g2.translate(180, 170); clockFace(g2); }), 0, 0, 1 - free);
        if (free < 1) { g.save(); g.globalAlpha = 1 - free; hands(g, 180, 170, -1 + ease(seg(p, 0.5, 1.0))); g.restore(); }
        if (free > 0) blit(g, sprite("hh-stout", sc, 60, 60, 300, 220, (g2) => { g2.translate(160, 170); stout(g2); fin(g2, 300, 220); }), 0, 0, free);
      });
      // destinations
      const dIn = ease(seg(p, 1.5, 1.9));
      inGrp("crate", () => blit(g, sprite("hh-crate", sc, 40, 560, 300, 200, (g2) => { g2.translate(190, 660); crate(g2); fin(g2, 300, 200); }), 0, 18 * (1 - dIn), dIn));
      inGrp("sack", () => blit(g, sprite("hh-sack", sc, 340, 580, 260, 180, (g2) => { g2.translate(470, 670); sack(g2); fin(g2, 260, 180); }), 0, 18 * (1 - dIn), dIn));
      const drinks = ease(seg(p, 2.5, 3.0));
      if (M) blit(g, sprite("hh-drinks", sc0, 20, 360, 340, 220, (g2) => { T.glass(g2, 110, 462, 1.1, { kind: "martini" }); T.dish(g2, 268, 470, 66, { seed: 13 }); T.lemon(g2, 268, 470, 0.85, 0.4); fin(g2, 340, 220); }), 24 * (1 - drinks), 0, drinks);
      else blit(g, sprite("hh-drinks", sc, 720, 90, 280, 420, (g2) => { T.glass(g2, 860, 200, 1.45, { kind: "martini" }); T.dish(g2, 850, 390, 85, { seed: 13 }); T.lemon(g2, 850, 390, 1.1, 0.4); fin(g2, 280, 420); }), 24 * (1 - drinks), 0, drinks);
      // the twenty nickels
      const cIn = ease(seg(p, 1.15, 1.55)), split = ease(seg(p, 2.0, 2.45)), leave = ease(seg(p, 2.55, 2.9)), fade = seg(p, 3.55, 3.9);
      const nick = sprite("hh-coin", sc0 * cs, -22, -22, 44, 44, (g2) => coin(g2, 0, 0, 16, 4));
      const c0 = M ? { x: 360 - 9.5 * 27 * 0.9, y: 470, dx: 27 * 0.9 } : COIN0;
      const out = M ? mp("bar", 790, 640) : [790, 640];
      for (let i = 0; i < 20; i++) {
        const k = clamp(cIn * 20 - i);
        if (k <= 0) continue;
        let x = c0.x + i * c0.dx, y = c0.y - 14 * (1 - k);
        const [tx, ty] = DEST(i);
        x += (tx - x) * split; y += (ty - y) * split;
        let a = k * (1 - fade);
        if (i >= 15) { x += (out[0] - x) * leave; y += (out[1] - y) * leave; a *= 1 - leave * 0.85; } // the bar's share goes to the shucker's wage
        blit(g, nick, x, y, a, cs);
      }
      // the till filling from drinks, food, tips
      const till = M ? [430, 520, 22, 9] : [860, 560, 28, 11];
      if (drinks > 0) for (let i = 0; i < 26; i++) { const k = clamp(drinks * 26 - i); if (k > 0) blit(g, nick, till[0] + (i % 5) * till[2] - 2 * till[2], till[1] - Math.floor(i / 5) * till[3] - 10 * (1 - k), k * (1 - fade), cs); }
      if (leave > 0) inGrp("bar", () => blit(g, sprite("hh-knife", sc, 690, 610, 220, 90, (g2) => T.knife(g2, 800, 650, 1.0, -0.15)), 0, 0, leave * (1 - fade)));
    },
    labels(p) {
      const price = p < 0.75 ? "$3–4" : "$1";
      const split = seg(p, 2.0, 2.45), drinks = seg(p, 2.5, 3.0), fade = seg(p, 3.55, 3.9), free = seg(p, 3.55, 4.1);
      if (M) {
        const tg = mp("plate", 676, 194), lab = (id, x, html, a) => ({ id, x, y: 800, cls: "stack", html, a });
        return [
          { id: "tag", x: tg[0], y: tg[1], html: price, cls: "big" },
          { id: "time", x: 128, y: 266, html: p < 0.75 ? "4:59 pm" : "5:00 pm<small>happy hour</small>", cls: "stack", a: 1 - free },
          { id: "one", x: 360, y: 514, html: "$1 = twenty nickels", a: seg(p, 1.3, 1.6) * (1 - split) },
          lab("farm", 128, "the farm<small>~57¢</small>", split * (1 - fade)),
          lab("dist", 346, "distributor<small>bar pays ~77¢</small>", split * (1 - fade)),
          lab("bar", 600, "the bar keeps<small>~23¢: under a<br>shucker's wage</small>", split * (1 - fade)),
          { id: "drinks", x: 430, y: 556, html: "drinks, food, tips", a: drinks * (1 - fade) },
          { id: "free", x: 128, y: 290, cls: "stack", html: "1838 · free lunch<small>one free oyster<br>per drink, Chicago</small>", a: free }
        ];
      }
      return [
        { id: "tag", x: 676, y: 194, html: price, cls: "big" },
        { id: "time", x: 180, y: 300, html: p < 0.75 ? "4:59 pm" : "5:00 pm · happy hour", a: 1 - free },
        { id: "one", x: 510, y: 590, html: "$1 = twenty nickels", a: seg(p, 1.3, 1.6) * (1 - split) },
        { id: "farm", x: 190, y: 755, html: "the farm · ~57¢", a: split * (1 - fade) },
        { id: "dist", x: 480, y: 755, html: "distributor · bar pays ~77¢", a: split * (1 - fade) },
        { id: "bar", x: 800, y: 735, html: "left of the $1 · ~23¢<small>less than the shucker's wage</small>", a: split * (1 - fade) },
        { id: "drinks", x: 860, y: 610, html: "drinks, food, tips", a: drinks * (1 - fade) },
        { id: "free", x: 70, y: 320, align: "left", html: "1838 · a free lunch with every drink<small>one oyster per drink, Chicago</small>", a: free }
      ];
    }
  };
})();
