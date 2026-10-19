/* "From branch to page": a scroll-scrubbed pen-and-watercolour film of hand
   papermaking (washi). Two layers per frame: watercolour washes (blotchy,
   edge-darkened) under textured pen lines. Sparkles mark hoverable parts. */
(function () {
  "use strict";
  const P = window.Paper;
  const { clamp, reduceMotion } = P;
  const root = document.getElementById("film");
  if (!root) return;
  const canvas = root.querySelector("canvas");
  const capNum = root.querySelector(".film-cap-num");
  const capTitle = root.querySelector(".film-cap-title");
  const capText = root.querySelector(".film-cap-text");
  const capNote = root.querySelector(".film-cap-note");
  const scrub = root.querySelector(".film-scrub");
  const track = root.querySelector(".film-track");
  const tip = root.querySelector(".film-tip");
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  const VW = 1000, VH = 640;
  const N = P.makeNoise(11);
  const INK = "24,24,26";

  // watercolour palette, after the reference sketches
  const SAGE = "143,172,120", YELLOW = "238,221,104", COBALT = "46,88,160", SKY = "196,222,240", BARK = "214,190,140", PAPER = "250,249,245";

  let main, ctx, cctx, scale = 1, ox = 0, oy = 0, boil = 0, lineBoost = 1, narrow = false, crop = null;
  const inkC = document.createElement("canvas"), colC = document.createElement("canvas");
  let inkPat = null, washPat = null;

  /* ---------- easing ---------- */
  const smooth = (t) => t * t * (3 - 2 * t);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- both layers move together ---------- */
  const alphaStack = [];
  const G = {
    save() { ctx.save(); cctx.save(); alphaStack.push(ctx.__alpha == null ? 1 : ctx.__alpha); },
    restore() { ctx.restore(); cctx.restore(); ctx.__alpha = alphaStack.length ? alphaStack.pop() : 1; },
    translate(x, y) { ctx.translate(x, y); cctx.translate(x, y); },
    rotate(a) { ctx.rotate(a); cctx.rotate(a); },
    scale(x, y) { ctx.scale(x, y); cctx.scale(x, y); },
    set alpha(a) { ctx.globalAlpha = a; cctx.globalAlpha = a; ctx.__alpha = a; },
    get alpha() { return ctx.globalAlpha; }
  };

  /* ---------- textures: ink grain and watercolour blotches ---------- */
  function makeTextures() {
    const S = 256;
    const mk = (fn) => {
      const c = document.createElement("canvas");
      c.width = c.height = S;
      const g = c.getContext("2d"), im = g.createImageData(S, S);
      const Nt = P.makeNoise(31);
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const j = (y * S + x) * 4;
        im.data[j] = im.data[j + 1] = im.data[j + 2] = 0;
        im.data[j + 3] = Math.round(255 * clamp(fn(x / S, y / S, Nt)));
      }
      g.putImageData(im, 0, 0);
      return c;
    };
    // pen ink: mostly solid, fine speckle, soft lighter patches (periodic so it tiles)
    const ink = mk((u, v, Nt) => 0.84 + 0.22 * Nt.fbm(u * 4, v * 4, 3, 4) + 0.28 * Nt.fbm(u * 48 + 7, v * 48, 2, 48) - 0.1);
    // watercolour: blotchy pigment pooling + granulation
    const wash = mk((u, v, Nt) => 0.72 + 0.5 * Nt.fbm(u * 3 + 11, v * 3, 4, 3) + 0.12 * Nt.fbm(u * 64, v * 64 + 5, 2, 64));
    // ~2 device px per grain cell, so the tooth is visible at any zoom
    ctx.__ink = window.Pen.inkPattern(ctx, [26, 25, 28], 2 / (DPR * scale));
    washPat = main.createPattern(wash, "repeat");
  }

  /* ---------- pen primitives ---------- */
  function jit(x, y, i, amp) {
    if (!amp) return [x, y];
    return [x + N.noise(i * 0.71 + 3.1, boil * 0.9) * amp, y + N.noise(i * 0.53 + 9.7, boil * 0.9 + 4) * amp];
  }
  function path(g, pts, k, amp, seed) {
    let total = 0;
    const L = [0];
    for (let i = 1; i < pts.length; i++) { total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(total); }
    const lim = total * k;
    g.beginPath();
    const s0 = jit(pts[0][0], pts[0][1], seed, amp);
    g.moveTo(s0[0], s0[1]);
    for (let i = 1; i < pts.length; i++) {
      if (L[i] > lim) {
        const f = (lim - L[i - 1]) / (L[i] - L[i - 1] || 1);
        g.lineTo(lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f));
        return false;
      }
      const p = jit(pts[i][0], pts[i][1], i + seed, amp);
      g.lineTo(p[0], p[1]);
    }
    return true;
  }
  function stroke(pts, o = {}) {
    if (pts.length < 2) return;
    const k = o.k == null ? 1 : o.k;
    if (k <= 0) return;
    const ptsC = o.close ? pts.concat([pts[0]]) : pts;
    if (o.fill) {
      ctx.beginPath(); ctx.moveTo(ptsC[0][0], ptsC[0][1]);
      for (let i = 1; i < ptsC.length; i++) ctx.lineTo(ptsC[i][0], ptsC[i][1]);
      ctx.closePath(); ctx.fillStyle = o.fill; ctx.fill();
    }
    window.Pen.ink(ctx, ptsC, { w: (o.w || 1.35) * 1.15 * lineBoost, k, seed: o.seed || 0, a: o.a == null ? 0.92 : o.a, jit: o.jit == null ? 0.7 : o.jit, boil, bleed: (o.w || 1.35) > 0.85 });
  }
  // watercolour wash on the colour layer: flat fill + darker edge where pigment pools
  function wash(pts, rgb, a = 0.55, seed = 0) {
    if (pts.length < 3) return;
    path(cctx, pts, 1, 1.4, seed + 500);
    cctx.closePath();
    cctx.fillStyle = `rgba(${rgb},${a})`;
    cctx.fill();
    cctx.lineWidth = 2.2 * lineBoost;
    cctx.strokeStyle = `rgba(${rgb},${Math.min(1, a * 0.7)})`;
    cctx.stroke();
  }
  function blob(x, y, r, rgb, a = 0.9, seed = 0) {
    const pts = [];
    for (let i = 0; i <= 18; i++) { const t = (i / 18) * Math.PI * 2; const rr = r * (1 + 0.12 * N.noise(seed + Math.cos(t), Math.sin(t) + seed)); pts.push([x + Math.cos(t) * rr, y + Math.sin(t) * rr]); }
    wash(pts, rgb, a, seed);
  }
  function spline(cp, per = 12) {
    const out = [];
    for (let i = 0; i < cp.length - 1; i++) {
      const p0 = cp[Math.max(0, i - 1)], p1 = cp[i], p2 = cp[i + 1], p3 = cp[Math.min(cp.length - 1, i + 2)];
      for (let s = 0; s < per; s++) {
        const t = s / per, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
        ]);
      }
    }
    out.push(cp[cp.length - 1]);
    return out;
  }
  function ellipse(cx, cy, rx, ry, a0 = 0, a1 = Math.PI * 2, n = 48) {
    const out = [];
    for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
    return out;
  }
  function label(text, x, y, o = {}) {
    // on small screens the scene is scaled down: keep labels at 11px or more on screen,
    // and keep them inside the cropped view
    const size = narrow ? Math.max(o.size || 13, 11 / scale) : o.size || 13;
    ctx.font = `${size}px "IBM Plex Mono", ui-monospace, monospace`;
    ctx.fillStyle = `rgba(100,100,105,${o.a == null ? 1 : o.a})`;
    ctx.textAlign = o.align || "left";
    if (narrow) {
      // a label inside a magnifier would be clipped at this size: set it under the circle instead
      if (insetLabels) { insetLabels.push([text, o]); return; }
      const w = ctx.measureText(text).width, a = o.align || "left";
      const left = a === "center" ? x - w / 2 : a === "right" ? x - w : x;
      const m = ctx.getTransform(), sx = m.a || 1, L = m.a * left + m.c * y + m.e;
      const lo = 6 * DPR, hi = inkC.width - 6 * DPR;
      x += (Math.max(0, lo - L) - Math.max(0, L + w * sx - hi)) / sx;
    }
    ctx.fillText(text, x, y);
  }
  let insetLabels = null;
  function leader(x0, y0, x1, y1, a = 0.5) { stroke([[x0, y0], [x1, y1]], { w: 0.8, a, jit: 0.3 }); }
  function dot(x, y, r, a = 0.92) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = ctx.__ink; const ga = ctx.__alpha == null ? 1 : ctx.__alpha; ctx.globalAlpha = ga * a; ctx.fill(); ctx.globalAlpha = ga; }
  // a cobalt drop, like the dots in the reference
  function bluedrop(x, y, r, a = 0.9) { blob(x, y, r, COBALT, a, Math.round(x + y)); }
  // tiny face: two dot eyes and an optional smile
  function face(x, y, s = 1, mood = "smile") {
    dot(x - 7 * s, y, 1.8 * s); dot(x + 7 * s, y, 1.8 * s);
    if (mood === "smile") stroke(ellipse(x, y + 3 * s, 5 * s, 4 * s, 0.4, Math.PI - 0.4, 10), { w: 1, jit: 0.2 });
    if (mood === "o") stroke(ellipse(x, y + 7 * s, 2.2 * s, 2.6 * s, 0, 6.3, 10), { w: 1, jit: 0.2 });
    if (mood === "sleepy") { stroke([[x - 10 * s, y], [x - 4 * s, y]], { w: 1.2, jit: 0.2 }); stroke([[x + 4 * s, y], [x + 10 * s, y]], { w: 1.2, jit: 0.2 }); }
  }
  // four-point sparkle; marks something you can hover
  function sparkle(x, y, r, a = 0.85) {
    const pts = [];
    for (let i = 0; i <= 8; i++) { const ang = (i / 8) * Math.PI * 2 - Math.PI / 2; const rr = i % 2 ? r * 0.22 : r; pts.push([x + Math.cos(ang) * rr, y + Math.sin(ang) * rr]); }
    stroke(pts, { w: 1.1, a, jit: 0.2 });
  }
  // hands (see hands.js): a fist around something running along local y
  function hand(x, y, rot = 0, s = 1, flip = 1, kind = "grip") {
    window.Hands[kind](ctx, x, y, { rot, s: s * 0.95, flip, seed: Math.round(x + y), boil });
  }
  function ground(a = 0.3) { stroke([[60, 540], [940, 540]], { w: 1, a, jit: 0.6, seed: 900 }); }
  function inset(cx, cy, r, alpha, drawInside) {
    if (alpha <= 0) return;
    G.save();
    G.alpha = G.alpha * alpha;
    wash(ellipse(cx, cy, r, r, 0, Math.PI * 2, 48), PAPER, 0.97, 900);
    stroke(ellipse(cx, cy, r, r, 0, Math.PI * 2, 64), { w: 1.2, a: 0.8 });
    ctx.save(); cctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r - 2, 0, Math.PI * 2); ctx.clip();
    cctx.beginPath(); cctx.arc(cx, cy, r - 2, 0, Math.PI * 2); cctx.clip();
    const held = (insetLabels = narrow ? [] : null);
    drawInside();
    insetLabels = null;
    ctx.restore(); cctx.restore();
    if (held) {
      const lh = 15 / scale;
      held.forEach(([text, o], i) => label(text, cx, cy + r + 20 / scale + i * lh, { ...o, align: "center" }));
    }
    G.restore();
  }

  /* ---------- reusable things ---------- */
  const rnd = P.mulberry32(5);
  const vatFibres = Array.from({ length: 64 }, () => ({
    x: 260 + rnd() * 480, y: 335 + rnd() * 120, cx: 470 + (rnd() - 0.5) * 70, cy: 380 + (rnd() - 0.5) * 30,
    len: 18 + rnd() * 40, a: rnd() * Math.PI * 2, ph: rnd() * 6.28, bend: (rnd() - 0.5) * 0.8, vx: 0, vy: 0
  }));
  function fibre(x, y, len, a, bend, w = 1, alpha = 0.7, seed = 0) {
    const pts = [];
    for (let i = 0; i <= 6; i++) { const t = i / 6 - 0.5; const aa = a + bend * t; pts.push([x + Math.cos(aa) * len * t, y + Math.sin(aa) * len * t + Math.sin(t * 3 + seed) * 2]); }
    stroke(pts, { w, a: alpha, jit: 0.4, seed });
  }
  function vat(a = 0.9, waterY = 322, time = 0, h = 0, mood = "smile") {
    // water wash first, under the lines
    const water = [[208, waterY]];
    for (let x = 208; x <= 792; x += 16) water.push([x, waterY + Math.sin(x * 0.03 + time * 0.002) * 2.5]);
    water.push([796, 500], [210, 500]);
    wash(water, SKY, 0.6 * a, 340);
    stroke([[230, 268], [770, 268], [810, 330], [190, 330], [230, 268]], { w: 1.4, a, seed: 300 });
    stroke(spline([[190, 330], [196, 420], [205, 505]], 6).concat(spline([[205, 505], [500, 510], [795, 505]], 8)).concat(spline([[795, 505], [804, 420], [810, 330]], 6)), { w: 1.4, a, seed: 310 });
    const wl = [];
    for (let x = 206; x <= 794; x += 12) wl.push([x, waterY + Math.sin(x * 0.03 + time * 0.002) * 2.5]);
    stroke(wl, { w: 1, a: a * 0.5, jit: 0.3, seed: 340 });
    // the vat has a face, of course
    G.save(); G.alpha = G.alpha * a; face(500, 460 - h * 4, 1.2, mood); G.restore();
  }

  /* ================= Scenes =================
     Each scene: draw(t, time, hv) where hv(key) is 0..1 hover strength.
     spots(t) lists hoverable regions in virtual coordinates. */
  const SCENES = [
    {
      num: "01", title: "Harvest", text: "Kozo branches are cut in winter. Only the inner bark is kept.", note: "h3",
      spots: (t) => [
        { key: "branch", x: 560, y: 300, r: 120, tip: "Kozo is paper mulberry, Broussonetia papyrifera. Only the bark, about 4% of the plant, becomes paper.", src: "H26" },
        ...(t > 0.6 ? [{ key: "bark", x: 790, y: 440, r: 70, tip: "Inner bark fibres are long and strong: about 10 mm, three times longer than a typical wood fibre.", src: "M2" }] : [])
      ],
      draw(t, time, hv) {
        ground();
        const stem = spline([[330, 540], [380, 430], [470, 330], [580, 250], [700, 190]]);
        const grow = easeOut(seg(t, 0, 0.32));
        const rustle = hv("branch");
        stroke(stem, { w: 1.8, k: grow, seed: 1 });
        const twigs = [[[420, 380], [380, 330], [370, 290]], [[520, 290], [530, 230], [560, 200]], [[610, 235], [650, 260], [690, 260]], [[460, 345], [520, 360], [560, 350]]];
        twigs.forEach((tw, i) => stroke(spline(tw, 8), { w: 1.3, k: easeOut(seg(t, 0.12 + i * 0.04, 0.38 + i * 0.04)), seed: 10 + i }));
        const leaves = [[370, 285, -1.2], [560, 196, -0.6], [692, 258, 0.2], [562, 348, 0.4], [700, 186, -0.3], [470, 330, 2.2]];
        const fall = easeInOut(seg(t, 0.38, 0.62));
        leaves.forEach(([lx, ly, la], i) => {
          const g = easeOut(seg(t, 0.2 + i * 0.03, 0.4 + i * 0.03));
          if (g <= 0) return;
          const wig = rustle * Math.sin(time * 0.02 + i * 1.7) * 0.25 * (1 - fall);
          const fx = lx + fall * (Math.sin(i * 2.1) * 60), fy = ly + fall * (534 - ly), fa = la * (1 - fall) + fall * (i % 2 ? 0.08 : -0.06) + wig;
          G.save(); G.translate(fx, fy); G.rotate(fa); G.scale(g, g);
          const leaf = [[0, 0], ...spline([[0, 0], [14, -14], [38, -12], [58, 0]], 6), ...spline([[58, 0], [38, 13], [14, 13], [0, 0]], 6)];
          wash(leaf, SAGE, 0.75, 40 + i);
          stroke(leaf, { w: 1.2, seed: 40 + i });
          stroke([[2, 0], [52, 0]], { w: 0.8, a: 0.55, seed: 60 + i });
          G.restore();
        });
        const peel = easeInOut(seg(t, 0.55, 0.95));
        if (peel > 0) {
          const n = stem.length - 1;
          const cut = Math.round(n * (1 - peel * 0.72));
          stroke(stem.slice(cut), { w: 1, a: 0.35, seed: 79 });
          const [ax, ay] = stem[cut];
          let ang = Math.atan2(stem[Math.min(n, cut + 1)][1] - ay, stem[Math.min(n, cut + 1)][0] - ax);
          const freeLen = (n - cut) * 10;
          const top = [[ax, ay]], bot = [[ax, ay + 5]];
          let x = ax, y = ay;
          for (let i = 1; i <= 24; i++) {
            ang += 0.035 + i * 0.0035;
            x += Math.cos(ang) * (freeLen / 24);
            y = Math.min(526, y + Math.sin(ang) * (freeLen / 24));
            top.push([x, y]);
            bot.push([x - Math.sin(ang) * 7, y + Math.cos(ang) * 7]);
          }
          wash(top.concat(bot.slice().reverse()), BARK, 0.8, 80);
          stroke(top, { w: 1.4, seed: 80 });
          stroke(bot, { w: 1.1, a: 0.75, seed: 81 });
          const end = top[top.length - 1];
          hand(end[0], end[1], ang - Math.PI / 2, 0.8, -1);
        }
      }
    },
    {
      num: "02", title: "Cook", text: "The strips simmer in wood-ash lye until the fibre loosens.", note: "m1",
      spots: () => [{ key: "pot", x: 500, y: 410, r: 150, tip: "Alkaline cooking dissolves the lignin and other glue between the bark cells, freeing the fibres.", src: "M77" }],
      draw(t, time, hv) {
        ground();
        const heat = hv("pot");
        for (let i = 0; i < 7; i++) {
          const x = 420 + i * 27, h = (30 + Math.sin(time * 0.006 + i * 1.7) * 10 + (i % 2) * 10) * (1 + heat * 0.6);
          const fl = spline([[x - 10, 540], [x - 5 + Math.sin(time * 0.01 + i) * 3, 540 - h * 0.55], [x + 2, 540 - h], [x + 9, 540 - h * 0.45], [x + 10, 540]], 5);
          wash(fl, YELLOW, 0.8, 100 + i);
          stroke(fl, { w: 1.1, a: 0.75, jit: 0.6, seed: 100 + i });
        }
        stroke([[390, 545], [610, 530]], { w: 1.6, seed: 110 }); stroke([[400, 530], [600, 546]], { w: 1.6, seed: 111 });
        // pot body with lye inside
        const body = spline([[330, 330], [338, 430], [380, 485], [500, 498], [620, 485], [662, 430], [670, 330]], 10);
        wash(body.concat(ellipse(500, 330, 170, 30, 0, Math.PI, 20).reverse()), PAPER, 0.92, 119);
        const lye = ellipse(500, 344, 152, 22);
        wash(lye, SAGE, 0.45, 118);
        stroke(ellipse(500, 330, 170, 30), { w: 1.4, seed: 120 });
        stroke(body, { w: 1.4, seed: 121 });
        // handles + face
        stroke(ellipse(320, 360, 14, 18, Math.PI * 0.5, Math.PI * 1.5, 12), { w: 1.3, seed: 122 });
        stroke(ellipse(680, 360, 14, 18, -Math.PI * 0.5, Math.PI * 0.5, 12), { w: 1.3, seed: 123 });
        face(500, 420, 1.3, heat > 0.5 ? "o" : "smile");
        // strips drop in
        const fallIn = easeOut(seg(t, 0.05, 0.35));
        for (let i = 0; i < 6; i++) {
          const x = 420 + i * 30, y = lerp(120 + i * 8, 300, fallIn), sway = Math.sin(time * 0.002 + i) * 4;
          const st = spline([[x, y], [x + 10 + sway, y + 30], [x + 4, y + 62]], 8);
          wash(st.concat(st.map(([a, b]) => [a + 7, b]).reverse()), BARK, 0.75, 130 + i);
          stroke(st, { w: 1.2, seed: 130 + i });
          stroke(st.map(([a, b]) => [a + 7, b]), { w: 1, a: 0.6, seed: 136 + i });
        }
        const boilK = Math.max(seg(t, 0.3, 0.6), heat);
        for (let i = 0; i < 9; i++) {
          const ph = (time * 0.0012 * (1 + heat) + i * 0.37) % 1, r = 2 + ph * 4;
          if (boilK > 0) { G.save(); G.alpha = G.alpha * boilK * (1 - ph); stroke(ellipse(370 + i * 32, 342 - ph * 4, r, r * 0.7, 0, 6.3, 12), { w: 0.9, jit: 0.2, seed: 150 + i }); G.restore(); }
        }
        const steamK = Math.max(seg(t, 0.35, 0.7), heat);
        for (let i = 0; i < 4; i++) {
          const x = 420 + i * 55, pts = [];
          for (let s = 0; s <= 14; s++) pts.push([x + Math.sin(s * 0.6 - time * 0.004 + i) * (6 + s * 1.2), 300 - s * 12 * (1 + heat * 0.3)]);
          G.save(); G.alpha = G.alpha * steamK * 0.55; stroke(pts, { w: 1, jit: 0.4, seed: 160 + i }); G.restore();
        }
        const tag = seg(t, 0.55, 0.8);
        if (tag > 0) { leader(670, 360, 760, 300, 0.5 * tag); label("wood-ash lye", 766, 300, { a: tag }); }
      }
    },
    {
      num: "03", title: "Beat", text: "Mallets split each fibre into finer fibrils, without cutting it short.", note: "m1",
      spots: () => [{ key: "fibre", x: narrow ? 520 : 210, y: narrow ? 690 : 210, r: 120, tip: "A kozo fibre is about 10 mm long and 30 µm wide, roughly 330 times longer than it is wide.", src: "M2" }],
      draw(t, time, hv) {
        ground();
        stroke([[330, 500], [720, 500], [760, 540], [290, 540], [330, 500]], { w: 1.4, seed: 200 });
        wash([[330, 500], [720, 500], [760, 540], [290, 540]], "205,205,200", 0.35, 200);
        const spread = easeOut(seg(t, 0.1, 0.9));
        const mass = [];
        const wid = lerp(120, 300, spread);
        for (let s = 0; s <= 16; s++) { const u = s / 16; mass.push([525 - wid / 2 + u * wid, 494 - Math.sin(u * Math.PI) * lerp(20, 8, spread)]); }
        mass.push([525 + wid / 2, 498], [525 - wid / 2, 498]);
        wash(mass, BARK, 0.7, 205);
        const strands = Math.round(lerp(6, 22, spread));
        for (let i = 0; i < strands; i++) {
          const f = i / strands;
          const x0 = 525 - wid / 2 + (i % 3) * 4, x1 = 525 + wid / 2 - (i % 2) * 6;
          const pts = [];
          for (let s = 0; s <= 10; s++) { const u = s / 10; pts.push([lerp(x0, x1, u), 494 - Math.sin(u * Math.PI) * lerp(14, 4, spread) + Math.sin(u * 9 + i) * lerp(1, 2.5, spread) - f * lerp(14, 6, spread)]); }
          stroke(pts, { w: 0.9, a: 0.6, jit: 0.5, seed: 210 + i });
        }
        const beats = 5, ph = (t * beats) % 1;
        const swing = ph < 0.6 ? easeInOut(ph / 0.6) : 1 - easeOut((ph - 0.6) / 0.4);
        const ang = lerp(0.85, 0, swing), L = 250;
        G.save(); G.translate(800, 456); G.rotate(ang);
        stroke([[18, 4], [-L + 26, 0]], { w: 1.4, seed: 230 });
        stroke([[18, 9], [-L + 26, 7]], { w: 1.2, seed: 234 });
        const head = [[-L - 30, -32], [-L + 26, -32], [-L + 26, 32], [-L - 30, 32]];
        wash(head, BARK, 0.55, 231);
        stroke(head.concat([head[0]]), { w: 1.4, seed: 231 });
        G.restore();
        { const hx = 800 + Math.cos(ang) * 8, hy = 456 + Math.sin(ang) * 8; hand(hx, hy, ang - Math.PI / 2, 0.85, 1); }
        if (swing > 0.9) for (let i = 0; i < 5; i++) { const a = -2.9 + i * 0.6; stroke([[550 + Math.cos(a) * 52, 476 + Math.sin(a) * 26], [550 + Math.cos(a) * 74, 476 + Math.sin(a) * 38]], { w: 1, a: 0.6, seed: 240 + i }); }
        const bx0 = narrow ? 520 : 210, by0 = narrow ? 690 : 210;
        const wig = hv("fibre");
        G.save(); G.translate(bx0 - 210, by0 - 210);
        inset(210, 210, 120, easeOut(seg(t, 0.2, 0.4)), () => {
          const fib = Math.max(easeOut(seg(t, 0.3, 0.95)), wig);
          const core = [[110, 215], [310, 205]];
          wash([[110, 210], [310, 200], [310, 211], [110, 221]], BARK, 0.85, 250);
          stroke(core, { w: 1.3, seed: 250 });
          stroke(core.map(([x, y]) => [x, y + 10]), { w: 1.2, seed: 251 });
          for (let i = 0; i < 11; i++) {
            const side = i % 2 ? 1 : -1, x0 = 124 + i * 17;
            const len = fib * (22 + (i * 7) % 30) * (1 + wig * 0.3 * Math.sin(time * 0.01 + i));
            stroke(spline([[x0, 214 + side * 4], [x0 + len * 0.5, 214 + side * len * 0.45], [x0 + len, 214 + side * len * 0.9]], 6), { w: 0.8, a: 0.65 * fib, seed: 260 + i });
          }
          label("one kozo fibre ≈ 10 mm", 210, 292, { align: "center", size: 12 });
          label("fibrils fray out", 210, 148, { align: "center", size: 12, a: fib });
        });
        G.restore();
      }
    },
    {
      num: "04", title: "Disperse", text: "Fibres float apart in a vat of water thickened with neri.", note: "h3",
      spots: () => [{ key: "vat", x: 500, y: 410, r: 230, tip: "Neri, a slimy extract of tororo-aoi root, slows drainage and keeps long fibres from clumping into flocs.", src: "H26 · M4" }],
      draw(t, time, hv, pointer) {
        ground();
        const stir = hv("vat");
        vat(0.92, 322, time, 0, stir > 0.4 ? "o" : "smile");
        const disperse = easeInOut(seg(t, 0.05, 0.85));
        vatFibres.forEach((f, i) => {
          let x = lerp(f.cx, f.x, disperse) + Math.sin(time * 0.0007 + f.ph) * 6 * disperse;
          let y = lerp(f.cy, f.y, disperse) + Math.cos(time * 0.0006 + f.ph) * 4 * disperse;
          // fibres drift away from the pointer
          if (pointer && stir > 0) {
            const dx = x - pointer[0], dy = y - pointer[1], d = Math.hypot(dx, dy);
            const push = stir * Math.max(0, 1 - d / 120) * 40;
            if (d > 0.1) { x += (dx / d) * push; y += (dy / d) * push * 0.5; }
          }
          fibre(x, clamp(y, 330, 495), f.len, f.a + Math.sin(time * 0.0004 + f.ph) * 0.3 * disperse, f.bend, 1, 0.65, i);
        });
        const pour = seg(t, 0.35, 0.8);
        if (pour > 0) {
          G.save();
          G.alpha = G.alpha * Math.min(1, pour * 4) * (1 - seg(t, 0.85, 1));
          const ladle = ellipse(600, 168, 26, 10, 0, Math.PI, 16);
          wash(ladle.concat([[574, 168]]), SAGE, 0.5, 281);
          stroke(spline([[730, 110], [660, 136], [622, 162]], 8), { w: 1.4, seed: 280 });
          stroke(ladle, { w: 1.4, seed: 281 });
          stroke([[574, 168], [626, 168]], { w: 1.2, seed: 283 });
          hand(728, 111, Math.atan2(110 - 162, 730 - 622) - Math.PI / 2, 0.8, -1);
          const str = [];
          for (let s = 0; s <= 10; s++) str.push([596 + Math.sin(s * 0.8 + time * 0.003) * 3, 176 + s * ((322 - 176) / 10)]);
          stroke(str, { w: 1.1, a: 0.55, jit: 0.3, seed: 282 });
          leader(630, 214, 720, 204, 0.5); label("neri · tororo-aoi root", 726, 208);
          G.restore();
        }
      }
    },
    {
      num: "05", title: "Scoop", text: "Scoop, rock, repeat. A thin layer of fibres builds on the screen.", note: "h3",
      spots: (t) => {
        const down = easeInOut(seg(t, 0, 0.2)), up = easeInOut(seg(t, 0.72, 0.92));
        return [{ key: "mould", x: 500, y: lerp(150, 300, down) - up * 150, r: 170, tip: "Nagashizuki: the maker scoops again and again, rocking the mould so fibres cross in thin, even layers.", src: "H26" }];
      },
      draw(t, time, hv) {
        ground();
        vat(0.55, 322, time, 0, "sleepy");
        vatFibres.forEach((f, i) => { if (i % 2) fibre(f.x + Math.sin(time * 0.0007 + f.ph) * 6, f.y + 10, f.len, f.a, f.bend, 0.9, 0.3, i); });
        const down = easeInOut(seg(t, 0, 0.2)), rockK = seg(t, 0.2, 0.72), up = easeInOut(seg(t, 0.72, 0.92));
        const y = lerp(150, 300, down) - up * 150;
        const extra = hv("mould") * Math.sin(time * 0.012) * 0.05;
        const rock = Math.sin(rockK * Math.PI * 6) * 0.07 * (rockK > 0 && rockK < 1 ? 1 : 0) + extra;
        const layer = easeOut(seg(t, 0.22, 0.85));
        G.save(); G.translate(500, y); G.rotate(rock);
        const fr = [[-230, -26], [230, -26], [260, 26], [-260, 26]];
        wash(fr, SKY, 0.25 + layer * 0.25, 300);
        stroke(fr.concat([fr[0]]), { w: 1.5, seed: 300 });
        for (let i = 1; i < 26; i++) { const u = i / 26; stroke([[lerp(-230, 230, u), -26], [lerp(-260, 260, u), 26]], { w: 0.5, a: 0.28, jit: 0.2, seed: 310 + i }); }
        const n = Math.round(layer * 64), r2 = P.mulberry32(77);
        for (let i = 0; i < n; i++) { const u = r2(), v = r2(); fibre(lerp(-225, 225, u) + v * 25 - 12, lerp(-20, 20, v), 14 + r2() * 26, r2() * 1.9 + (rock > 0 ? 0.1 : -0.1), 0.4, 0.9, 0.55, i); }
        G.restore();
        // hands on both sides of the mould
        const c = Math.cos(rock), s = Math.sin(rock);
        hand(500 - 262 * c, y - 262 * s, rock, 0.8, 1);
        hand(500 + 262 * c, y + 262 * s, rock, 0.8, -1);
        if (up > 0.2 || (down > 0.9 && rockK < 0.05)) {
          for (let i = 0; i < 10; i++) {
            const ph = (time * 0.0015 + i * 0.13) % 1, dy = y + 30 + ph * (322 - y - 20);
            if (dy < 318) bluedrop(280 + i * 46 + (i % 3) * 8, dy, 4.5, 0.85 * (1 - ph * 0.5));
          }
        }
        const tag = seg(t, 0.3, 0.5) * (1 - seg(t, 0.85, 1));
        if (tag > 0) {
          const ly = narrow ? 128 : 170; // narrow: lift the tag clear of the raised mould
          leader(760, y - 30, 820, ly, 0.5 * tag); label("nagashizuki", 826, ly - 4, { a: tag }); label("scoop · rock · repeat", 826, ly + 14 + (narrow ? 6 : 0), { a: tag * 0.8, size: 11 });
        }
      }
    },
    {
      num: "06", title: "Press", text: "Wet sheets are stacked and the water is pressed out.", note: "h3",
      spots: () => [{ key: "stack", x: 500, y: 470, r: 160, tip: "Each sheet is laid straight onto the last. Pressing drives out water so the stack can be parted and dried.", src: "" }],
      draw(t, time, hv) {
        ground();
        const squeeze = hv("stack");
        const press = Math.min(1, easeInOut(seg(t, 0.35, 0.8)) + squeeze * 0.15);
        const gap = lerp(10, 4.5, press), count = 12;
        stroke([[300, 520], [700, 520], [730, 540], [270, 540], [300, 520]], { w: 1.4, seed: 400 });
        wash([[300, 520], [700, 520], [730, 540], [270, 540]], BARK, 0.6, 400);
        const top = 516 - count * gap;
        wash([[310, top], [690, top], [712, 524], [288, 524]], SKY, lerp(0.7, 0.4, press), 405);
        for (let i = 0; i < count; i++) { const yy = 516 - i * gap; stroke([[310, yy], [690, yy], [712, yy + 8], [288, yy + 8]], { w: 0.9, a: 0.55, jit: 0.4, seed: 410 + i }); }
        face(500, top + (516 - top) / 2 + 6, 1, press > 0.6 ? "sleepy" : "smile");
        const flip = easeInOut(seg(t, 0, 0.3));
        if (flip < 1) {
          G.save(); G.translate(500, top); G.scale(1, Math.cos((1 - flip) * Math.PI * 0.95));
          const sh = [[-190, -150 * (1 - flip)], [190, -150 * (1 - flip)], [212, 8], [-212, 8]];
          wash(sh, SKY, 0.7, 440);
          stroke(sh.concat([sh[0]]), { w: 1.2, seed: 440 });
          G.restore();
        }
        const by = lerp(150, top - 26, press);
        const board = [[290, by], [710, by], [735, by + 22], [265, by + 22]];
        wash(board, BARK, 0.7, 450);
        stroke(board.concat([board[0]]), { w: 1.5, seed: 450 });
        stroke([[495, 60], [495, by]], { w: 1.3, seed: 451 }); stroke([[505, 60], [505, by]], { w: 1.3, seed: 455 });
        for (let i = 0; i < 6; i++) stroke([[495, 72 + i * ((by - 70) / 6)], [505, 80 + i * ((by - 70) / 6)]], { w: 0.9, a: 0.6, seed: 452 + i });
        stroke([[440, 56], [560, 56]], { w: 1.6, seed: 460 }); stroke([[440, 64], [560, 64]], { w: 1.2, seed: 461 });
        if (press > 0.1 && press < 1.01) {
          for (let i = 0; i < 12; i++) {
            const ph = (time * 0.0016 * (1 + squeeze) + i * 0.21) % 1, side = i % 2 ? 1 : -1;
            bluedrop(500 + side * (225 + ph * 70), 500 - (i % 6) * 10 + ph * ph * 30, 4, 0.85 * (1 - ph));
          }
        }
      }
    },
    {
      num: "07", title: "Dry", text: "Each sheet is brushed onto a board to dry. Fibres bond where they cross.", note: "m1",
      spots: () => [
        { key: "bonds", x: narrow ? 520 : 190, y: narrow ? 700 : 330, r: 125, tip: "As the last water leaves, hydrogen bonds form where fibres touch. No glue: a sheet of copy paper is about half air.", src: "M1" },
        { key: "sun", x: narrow ? 790 : 860, y: narrow ? 150 : 110, r: 60, tip: "Washi was winter work for farming families, when cold kept the materials fresh.", src: "H27" }
      ],
      draw(t, time, hv) {
        ground();
        const sx = narrow ? 790 : 860, sy = narrow ? 150 : 110, sunK = seg(t, 0.05, 0.3), sunH = hv("sun");
        G.save(); G.alpha = G.alpha * sunK;
        blob(sx, sy, 30, YELLOW, 0.85, 500);
        stroke(ellipse(sx, sy, 30, 30), { w: 1.3, seed: 500 });
        face(sx, sy - 2, 1, sunH > 0.5 ? "o" : "smile");
        for (let i = 0; i < 10; i++) { const a = i * 0.628 + time * 0.0002 * (1 + sunH * 6); stroke([[sx + Math.cos(a) * 42, sy + Math.sin(a) * 42], [sx + Math.cos(a) * (56 + sunH * 8), sy + Math.sin(a) * (56 + sunH * 8)]], { w: 1, a: 0.65, seed: 501 + i }); }
        G.restore();
        const board = [[300, 140], [640, 120], [700, 540], [360, 540]];
        wash(board, BARK, 0.55, 520);
        stroke(board.concat([board[0]]), { w: 1.5, seed: 520 });
        for (let i = 1; i < 6; i++) stroke([[lerp(300, 640, i / 6) + 10, lerp(140, 120, i / 6) + 20], [lerp(360, 700, i / 6) - 10, 530]], { w: 0.6, a: 0.25, seed: 521 + i });
        stroke([[360, 540], [330, 560]], { w: 1.5, seed: 530 }); stroke([[700, 540], [690, 560]], { w: 1.5, seed: 531 });
        const dry = smooth(seg(t, 0.35, 0.8));
        const sheet = [[335, 175], [610, 158], [655, 495], [385, 505]];
        wash(sheet, PAPER, 0.97, 541);
        wash(sheet, SKY, 0.75 * (1 - dry), 540);
        stroke(sheet.concat([sheet[0]]), { w: 1.1, a: 0.75, seed: 540 });
        const br = easeInOut(seg(t, 0, 0.4));
        if (br < 1) {
          const bx = lerp(360, 620, br), byy = lerp(200, 460, (br * 3) % 1);
          G.save(); G.translate(bx, byy); G.rotate(-0.5);
          const bh = [[-40, -6], [40, -6], [40, 6], [-40, 6]];
          wash(bh, BARK, 0.7, 550);
          stroke(bh.concat([bh[0]]), { w: 1.3, seed: 550 });
          for (let i = 0; i < 9; i++) stroke([[-36 + i * 9, 6], [-37 + i * 9, 18]], { w: 0.8, a: 0.6, seed: 551 + i });
          G.restore();
          hand(bx - Math.sin(-0.5) * -4, byy - 10, -0.5, 0.75, 1, "flat");
        }
        const dx0 = narrow ? 520 : 190, dy0 = narrow ? 700 : 330, pulse = hv("bonds");
        G.save(); G.translate(dx0 - 190, dy0 - 330);
        inset(190, 330, 125, easeOut(seg(t, 0.55, 0.75)), () => {
          const r2 = P.mulberry32(91);
          const fibres = Array.from({ length: 16 }, () => { const a = r2() * Math.PI; const cx = 110 + r2() * 160, cy = 250 + r2() * 160; return [[cx - Math.cos(a) * 110, cy - Math.sin(a) * 110], [cx + Math.cos(a) * 110, cy + Math.sin(a) * 110]]; });
          fibres.forEach(([a, b], i) => {
            const nx = -(b[1] - a[1]), ny = b[0] - a[0], l = Math.hypot(nx, ny), ux = (nx / l) * 3, uy = (ny / l) * 3;
            wash([[a[0] + ux, a[1] + uy], [b[0] + ux, b[1] + uy], [b[0] - ux, b[1] - uy], [a[0] - ux, a[1] - uy]], BARK, 0.55, 570 + i);
            stroke([[a[0] + ux, a[1] + uy], [b[0] + ux, b[1] + uy]], { w: 0.9, a: 0.7, seed: 570 + i });
            stroke([[a[0] - ux, a[1] - uy], [b[0] - ux, b[1] - uy]], { w: 0.9, a: 0.7, seed: 590 + i });
          });
          const bond = Math.max(seg(t, 0.68, 0.95), pulse);
          let k = 0;
          for (let i = 0; i < fibres.length; i++) for (let j = i + 1; j < fibres.length; j++) {
            const [a, b] = fibres[i], [c2, d] = fibres[j];
            const den = (b[0] - a[0]) * (d[1] - c2[1]) - (b[1] - a[1]) * (d[0] - c2[0]);
            if (!den) continue;
            const u = ((c2[0] - a[0]) * (d[1] - c2[1]) - (c2[1] - a[1]) * (d[0] - c2[0])) / den;
            const v = ((c2[0] - a[0]) * (b[1] - a[1]) - (c2[1] - a[1]) * (b[0] - a[0])) / den;
            if (u < 0 || u > 1 || v < 0 || v > 1) continue;
            k++;
            if ((k * 0.37) % 1 < bond) {
              const px = a[0] + u * (b[0] - a[0]), py = a[1] + u * (b[1] - a[1]);
              bluedrop(px, py, 3.6 + pulse * 1.5 * (0.5 + 0.5 * Math.sin(time * 0.012 + k)), 0.9);
            }
          }
          label("bonds where fibres cross", 190, 234, { align: "center", size: 11, a: bond });
          label("the gaps are air", 190, 440, { align: "center", size: 11, a: bond });
        });
        G.restore();
      }
    },
    {
      num: "08", title: "Write", text: "A sheet, ready for ink.", note: "m5",
      spots: (t) => t > 0.3 ? [{ key: "sheet", x: 512, y: 330, r: 220, tip: "Sumi is soot bound with animal glue. Carbon is chemically inert, so it rests on the fibres without harming them.", src: "M5" }] : [],
      draw(t, time, hv) {
        const corners = [[230, 120], [790, 100], [830, 540], [200, 560]], sh = [];
        for (let e = 0; e < 4; e++) {
          const [x0, y0] = corners[e], [x1, y1] = corners[(e + 1) % 4];
          for (let s = 0; s < 30; s++) { const u = s / 30; sh.push([lerp(x0, x1, u) + N.noise(e * 10 + u * 9, 1) * 3, lerp(y0, y1, u) + N.noise(e * 10 + u * 9, 5) * 3]); }
        }
        wash(sh, PAPER, 0.98, 600);
        stroke(sh.concat([sh[0]]), { w: 1, a: 0.6, jit: 0.3, seed: 600 });
        const k = easeInOut(seg(t, 0.1, 0.85)), glow = hv("sheet");
        const steps = 520, cx = 512, cy = 330, R = 140;
        for (let i = 0; i < steps * k; i++) {
          const u = i / steps, a = -2.2 + u * Math.PI * 1.88, r = R + Math.sin(u * 7) * 4;
          const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.92;
          const width = lerp(16, 3, Math.pow(u, 1.3)) * (1 + glow * 0.12);
          if (u > 0.72 && !(N.noise(u * 60, 3) > lerp(-0.5, 0.3, (u - 0.72) / 0.28))) continue;
          ctx.beginPath();
          ctx.ellipse(x, y, width * 0.5, width * 0.32, a + Math.PI / 2, 0, Math.PI * 2);
          ctx.fillStyle = ctx.__ink;
          ctx.globalAlpha = (ctx.__alpha == null ? 1 : ctx.__alpha) * lerp(0.62, 0.36, u);
          ctx.fill();
          ctx.globalAlpha = ctx.__alpha == null ? 1 : ctx.__alpha;
        }
        if (k > 0 && k < 1) {
          const a = -2.2 + k * Math.PI * 1.88, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R * 0.92;
          G.save(); G.translate(x, y); G.rotate(0.22);
          const tuft = [[-7, -26], [-5, -6], [0, 4], [5, -6], [7, -26]];
          wash(tuft, "40,40,44", 0.85, 621);
          stroke(tuft.concat([tuft[0]]), { w: 1.2, seed: 621 });
          stroke([[-6, -26], [-6, -40], [6, -40], [6, -26]], { w: 1.1, seed: 622 });
          const handle = [[-4, -40], [-4, -190], [4, -190], [4, -40]];
          wash(handle, BARK, 0.7, 623);
          stroke(handle, { w: 1.1, seed: 623 });
          G.restore();
          hand(x + Math.sin(0.22) * 120, y - Math.cos(0.22) * 120, 0.22, 0.8, -1);
        }
        // sparkles when finished (and more on hover)
        const fin = seg(t, 0.86, 1);
        const sp = [[300, 170, 12], [760, 150, 9], [740, 480, 11], [280, 470, 8]];
        sp.forEach(([x, y, r], i) => { const tw = 0.7 + 0.3 * Math.sin(time * 0.006 + i * 2); if (fin > 0 || glow > 0) sparkle(x, y, r * tw * (1 + glow * 0.4), Math.max(fin, glow)); });
        const tag = seg(t, 0.88, 1);
        label("ensō · a single brush stroke", 512, 600, { align: "center", a: tag });
      }
    }
  ];

  /* ---------- layout ---------- */
  function resize() {
    const r = canvas.getBoundingClientRect();
    for (const c of [canvas, inkC, colC]) { c.width = Math.round(r.width * DPR); c.height = Math.round(r.height * DPR); }
    main = canvas.getContext("2d");
    ctx = inkC.getContext("2d");
    cctx = colC.getContext("2d");
    narrow = r.width < 700;
    crop = narrow ? { x: 170, y: 90, w: 700, h: 830 } : { x: 0, y: 0, w: VW, h: VH };
    scale = Math.min(r.width / crop.w, r.height / crop.h);
    ox = (r.width - crop.w * scale) / 2 - crop.x * scale;
    oy = (r.height - crop.h * scale) / 2 - crop.y * scale;
    lineBoost = clamp(0.75 / scale, 1, 1.9);
    makeTextures();
  }

  /* ---------- hover ---------- */
  let pointer = null;           // virtual coordinates
  const hover = {};             // key -> eased 0..1
  let hotKey = null, hotSpot = null;
  function hv(key) { return hover[key] || 0; }
  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    pointer = [(e.clientX - r.left - ox) / scale, (e.clientY - r.top - oy) / scale];
    tipPos = [e.clientX - r.left, e.clientY - r.top];
  });
  canvas.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") pointer = null; });
  // touch has no hover: a tap opens the note under the finger, a tap elsewhere or a scroll closes it
  let tipPos = [0, 0], tapY = 0;
  canvas.addEventListener("click", (e) => {
    if (matchMedia("(hover: hover)").matches) return;
    const r = canvas.getBoundingClientRect();
    pointer = [(e.clientX - r.left - ox) / scale, (e.clientY - r.top - oy) / scale];
    tipPos = [e.clientX - r.left, e.clientY - r.top];
    tapY = window.scrollY;
  });
  window.addEventListener("scroll", () => {
    if (pointer && !matchMedia("(hover: hover)").matches && Math.abs(window.scrollY - tapY) > 24) pointer = null;
  }, { passive: true });
  function updateHover(spots, dt) {
    hotSpot = null;
    if (pointer) for (const s of spots) if (Math.hypot(pointer[0] - s.x, pointer[1] - s.y) < s.r) { hotSpot = s; break; }
    const keys = new Set([...Object.keys(hover), ...spots.map((s) => s.key)]);
    keys.forEach((k) => {
      const target = hotSpot && hotSpot.key === k ? 1 : 0;
      hover[k] = (hover[k] || 0) + (target - (hover[k] || 0)) * Math.min(1, dt * 0.008);
    });
    canvas.style.cursor = hotSpot ? "help" : "default";
    if (hotSpot) {
      if (hotKey !== hotSpot.key) {
        hotKey = hotSpot.key;
        tip.innerHTML = `${hotSpot.tip}${hotSpot.src ? ` <span class="mono">${hotSpot.src}</span>` : ""}`;
      }
      const r = canvas.getBoundingClientRect();
      const tw = tip.offsetWidth || 260, th = tip.offsetHeight || 80;
      const x = Math.max(0, Math.min(r.width - tw, tipPos[0] + 16));
      const y = Math.max(0, Math.min(r.height - th, tipPos[1] - 20));
      tip.style.transform = `translate(${x}px, ${y}px) rotate(-1deg)`;
      tip.classList.add("on");
    } else {
      hotKey = null;
      tip.classList.remove("on");
    }
  }

  /* ---------- frame ---------- */
  const XF = 0.14;
  let lastTime = 0;
  function render(p, time) {
    if (!ctx) return;
    const dt = time - lastTime || 16;
    lastTime = time;
    const n = SCENES.length, x = clamp(p) * n;
    const i = Math.min(n - 1, Math.floor(x)), lt = x - i;
    for (const g of [ctx, cctx]) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = "source-over"; g.clearRect(0, 0, inkC.width, inkC.height); g.lineCap = "round"; g.lineJoin = "round"; }
    const base = () => { for (const g of [ctx, cctx]) { g.setTransform(DPR * scale, 0, 0, DPR * scale, DPR * ox, DPR * oy); g.lineCap = "round"; g.lineJoin = "round"; } };
    const fade = i < n - 1 ? smooth(seg(lt, 1 - XF, 1)) : 0;
    const t = Math.min(1, lt / (1 - XF * 0.5));
    const spots = fade < 0.5 ? SCENES[i].spots(t) : [];
    updateHover(spots, dt);
    base();
    G.alpha = 1 - fade;
    G.translate(-fade * 30, 0);
    SCENES[i].draw(t, time, hv, pointer);
    // sparkles beside hoverable parts that aren't being hovered
    if (fade < 0.3) spots.forEach((s, k) => {
      const h = hv(s.key);
      if (h > 0.5) return;
      const tw = 0.6 + 0.4 * Math.sin(time * 0.005 + k * 2.3);
      sparkle(s.x + s.r * 0.62, s.y - s.r * 0.62, 8 * tw, 0.75 * (1 - h * 2));
    });
    if (fade > 0) { base(); G.alpha = fade; G.translate((1 - fade) * 30, 0); SCENES[i + 1].draw(0, time, () => 0, null); }
    // textures: blotchy watercolour, grainy ink
    for (const [g, pat] of [[cctx, washPat]]) {
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1;
      g.globalCompositeOperation = "destination-in";
      g.fillStyle = pat; g.fillRect(0, 0, inkC.width, inkC.height);
      g.globalCompositeOperation = "source-over";
    }
    main.setTransform(1, 0, 0, 1, 0, 0);
    main.clearRect(0, 0, canvas.width, canvas.height);
    main.globalCompositeOperation = "multiply";
    main.drawImage(colC, 0, 0);
    main.globalCompositeOperation = "source-over";
    main.drawImage(inkC, 0, 0);
    setCaption(fade > 0.5 ? i + 1 : i);
    scrubFill.style.transform = `scaleX(${clamp(p)})`;
  }
  let capIdx = -1;
  function setCaption(i) {
    if (i === capIdx) return;
    capIdx = i;
    const s = SCENES[i], cap = root.querySelector(".film-cap");
    cap.classList.remove("in"); void root.offsetWidth;
    capNum.textContent = s.num; capTitle.textContent = s.title; capText.textContent = s.text;
    capNote.textContent = s.note.toUpperCase(); capNote.href = `report.html#${s.note}`;
    cap.classList.add("in");
    ticks.forEach((tk, k) => tk.classList.toggle("active", k === i));
  }

  /* ---------- scrubber ---------- */
  const scrubFill = document.createElement("span");
  scrubFill.className = "film-scrub-fill";
  scrub.appendChild(scrubFill);
  const ticks = SCENES.map((s, i) => {
    const b = document.createElement("button");
    b.className = "film-tick";
    b.innerHTML = `<span>${s.title}</span>`;
    b.setAttribute("aria-label", `Go to step ${s.num}, ${s.title}`);
    b.addEventListener("click", () => {
      const r = track.getBoundingClientRect();
      const y = r.top + window.scrollY + (r.height - window.innerHeight) * ((i + 0.45) / SCENES.length);
      window.scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });
    });
    scrub.appendChild(b);
    return b;
  });

  /* ---------- loop ---------- */
  let visible = false, lastBoil = 0;
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { rootMargin: "100px" }).observe(track);
  function frame(time) {
    if (visible) {
      if (!reduceMotion && time - lastBoil > 140) { boil++; lastBoil = time; }
      render(P.trackProgress(track), reduceMotion ? 0 : time);
    }
    requestAnimationFrame(frame);
  }
  resize();
  render(0, 0);
  window.addEventListener("resize", () => { resize(); render(P.trackProgress(track), performance.now()); });
  requestAnimationFrame(frame);
})();
