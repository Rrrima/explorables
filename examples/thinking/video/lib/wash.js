/* Wash: a thin grey pen and one blue watercolour, after the reference.
   A stage has three canvases: `col` for washes, `ink` for the pen, and the
   visible canvas they are composited onto (washes first, then ink with
   multiply, so lines inside a wash read blue-grey). Washes are jittered
   polygons with granulation, dry blooms and a pooled rim. Needs paper.js
   (noise) and pen.js (the nib). */
(function () {
  "use strict";
  const P = window.Paper;
  const N = P.makeNoise(17);
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const smooth = (t) => t * t * (3 - 2 * t);

  /* ---------- palette ---------- */
  const C = {
    paper: "#fcfaf6",
    ink: [74, 74, 78],
    blue: [95, 189, 211],       // #5fbdd3; at α 0.85 on paper it reads #7fcbdc, the reference's left face
    blueMid: [149, 201, 219],   // #95c9db
    bluePale: [193, 225, 233],  // #c1e1e9
    grey: [150, 150, 154],      // a grey wash for faint shade
    muted: "#6e6e73"
  };
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  /* ---------- geometry ---------- */
  function spline(cp, per = 10) {
    if (cp.length < 2) return cp.slice();
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
  // resample a closed polygon every `step` units and let the edge wander, like a wet edge
  function wobble(pts, seed, amp = 1.4, step = 6) {
    const out = [];
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % n];
      const d = Math.hypot(x1 - x0, y1 - y0), m = Math.max(1, Math.round(d / step));
      for (let s = 0; s < m; s++) {
        const t = s / m, x = lerp(x0, x1, t), y = lerp(y0, y1, t);
        const k = out.length * 0.21 + seed * 1.7;
        out.push([x + N.fbm(k, seed * 0.3, 2) * amp * 1.6, y + N.fbm(k + 50, seed * 0.3 + 9, 2) * amp * 1.6]);
      }
    }
    return out;
  }
  function tracePath(g, pts, close) {
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    if (close) g.closePath();
  }
  function bbox(pts) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of pts) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
    return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
  }
  // cut a polyline at a fraction of its length (for draw-on)
  function partial(pts, k) {
    if (k >= 1) return pts;
    if (k <= 0) return [];
    let total = 0; const L = [0];
    for (let i = 1; i < pts.length; i++) { total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(total); }
    const lim = total * k, out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      if (L[i] >= lim) { const f = (lim - L[i - 1]) / (L[i] - L[i - 1] || 1); out.push([lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]); break; }
      out.push(pts[i]);
    }
    return out;
  }

  /* ---------- textures ---------- */
  const grainCache = new Map();
  function grainPattern(ctx, rgb) {
    const key = rgb.join(",");
    if (grainCache.has(key)) return grainCache.get(key);
    const S = 128, c = document.createElement("canvas");
    c.width = c.height = S;
    const g = c.getContext("2d"), im = g.createImageData(S, S);
    const Nt = P.makeNoise(31), rnd = P.mulberry32(9);
    const dark = rgb.map((v) => Math.round(v * 0.66));
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const u = x / S, v = y / S;
      // granulation: fine pigment settling in the tooth, plus slow drifts
      let a = 0.55 + 0.75 * Nt.fbm(u * 40, v * 40, 2, 40) + 0.95 * Nt.fbm(u * 5 + 3, v * 5, 3, 5) + 0.7 * Nt.fbm(u * 12 + 9, v * 12 + 4, 2, 12) + (rnd() - 0.5) * 0.18;
      a = clamp(a * 0.62, 0, 1);
      const j = (y * S + x) * 4;
      im.data[j] = dark[0]; im.data[j + 1] = dark[1]; im.data[j + 2] = dark[2]; im.data[j + 3] = Math.round(255 * a);
    }
    g.putImageData(im, 0, 0);
    const pat = ctx.createPattern(c, "repeat");
    grainCache.set(key, pat);
    return pat;
  }

  /* ---------- the stage ---------- */
  function stage(canvas, VW, VH, opts = {}) {
    const col = document.createElement("canvas"), ink = document.createElement("canvas");
    const main = canvas.getContext("2d");
    const S = { canvas, main, col: col.getContext("2d"), ink: ink.getContext("2d"), VW, VH, W: 0, H: 0, scale: 1, ox: 0, oy: 0, boil: 0, _alpha: 1, _stack: [] };
    S.ink.__ink = rgba(C.ink, 1);

    S.lineMul = opts.lineMul || 1;   // pen width multiplier (the video draws at 1920 wide)
    S.unitMul = opts.unitMul || 1;   // wash rim and edge-wobble multiplier
    const DPR = opts.dpr || window.Wash.DPR;
    S.fit = function () {
      const r = opts.size ? { width: opts.size[0], height: opts.size[1] } : canvas.getBoundingClientRect();
      const W = Math.max(1, Math.round(r.width)), H = Math.max(1, Math.round(opts.aspect ? W / opts.aspect : r.height));
      S.W = W; S.H = H;
      for (const c of [canvas, col, ink]) { c.width = Math.round(W * DPR); c.height = Math.round(H * DPR); }
      S.dpr = DPR;
      const fitMode = opts.fit || "contain";
      let sc;
      if (fitMode === "width") sc = W / VW;
      else if (fitMode === "height") sc = H / VH;
      else if (fitMode === "cover") sc = Math.max(W / VW, H / VH);
      else sc = Math.min(W / VW, H / VH);
      S.scale = sc;
      const ax = opts.alignX == null ? 0.5 : opts.alignX, ay = opts.alignY == null ? 0.5 : opts.alignY;
      S.ox = (W - VW * sc) * ax; S.oy = (H - VH * sc) * ay;
      S.ink.__ink = rgba(C.ink, 1);
      return S;
    };
    S.setBase = function () {
      for (const g of [S.col, S.ink]) g.setTransform(DPR * S.scale, 0, 0, DPR * S.scale, DPR * S.ox, DPR * S.oy);
      main.setTransform(1, 0, 0, 1, 0, 0);
    };
    S.begin = function () {
      for (const g of [S.col, S.ink]) { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, col.width, col.height); g.globalCompositeOperation = "source-over"; g.globalAlpha = 1; g.__alpha = 1; }
      S._alpha = 1; S._stack.length = 0;
      S.setBase();
    };
    S.end = function () {
      main.setTransform(1, 0, 0, 1, 0, 0);
      main.clearRect(0, 0, canvas.width, canvas.height);
      main.globalCompositeOperation = "source-over";
      main.drawImage(col, 0, 0);
      main.globalCompositeOperation = "multiply";
      main.drawImage(ink, 0, 0);
      main.globalCompositeOperation = "source-over";
    };
    // transforms applied to both layers
    S.save = () => { S.col.save(); S.ink.save(); S._stack.push(S._alpha); };
    S.restore = () => { S.col.restore(); S.ink.restore(); S._alpha = S._stack.length ? S._stack.pop() : 1; S.ink.__alpha = S._alpha; S.col.globalAlpha = S._alpha; S.ink.globalAlpha = S._alpha; };
    S.translate = (x, y) => { S.col.translate(x, y); S.ink.translate(x, y); };
    S.rotate = (a) => { S.col.rotate(a); S.ink.rotate(a); };
    S.scaleBy = (x, y = x) => { S.col.scale(x, y); S.ink.scale(x, y); };
    S.alpha = (a) => { S._alpha = a; S.col.globalAlpha = a; S.ink.globalAlpha = a; S.ink.__alpha = a; };
    S.alphaNow = () => S._alpha;
    S.mul = (a) => S.alpha(S._alpha * a);
    // virtual → CSS px on the canvas (for hotspots)
    S.toCss = (x, y) => { const m = S.ink.getTransform(); return [(m.a * x + m.c * y + m.e) / DPR, (m.b * x + m.d * y + m.f) / DPR]; };
    S.fromCss = (px, py) => { const m = S.ink.getTransform().inverse(); const x = px * DPR, y = py * DPR; return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]; };
    S.unit = () => 1 / S.scale; // one CSS pixel in virtual units

    /* ----- pen ----- */
    S.line = function (pts, o = {}) {
      if (!pts || pts.length < 2) return;
      window.Pen.ink(S.ink, pts, {
        w: (o.w || 0.95) * S.lineMul, k: o.k == null ? 1 : o.k, seed: o.seed || 0, a: o.a == null ? 0.68 : o.a,
        jit: o.jit == null ? 0.5 : o.jit, boil: S.boil, dry: o.dry == null ? 0.4 : o.dry, bleed: false,
        color: o.color
      });
    };
    S.curve = (cp, o = {}) => S.line(spline(cp, o.per || 10), o);
    S.dot = function (x, y, r, a = 0.8) {
      const g = S.ink; g.save(); g.globalAlpha = S._alpha * a; g.fillStyle = S.ink.__ink;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.restore();
    };
    S.tick = (x, y, len = 6, a = 0.75, seed = 0) => S.line([[x, y - len / 2], [x, y + len / 2]], { w: 1, a, seed, jit: 0.3 });

    /* ----- watercolour ----- */
    S.wash = function (pts, rgb, a = 0.7, seed = 0, o = {}) {
      if (!pts || pts.length < 3) return;
      const g = S.col, ga = S._alpha;
      const q = o.edge === 0 ? pts : wobble(pts, seed, (o.edge == null ? 2 : o.edge) * S.unitMul, 6 * S.unitMul);
      const bb = bbox(q);
      g.save();
      tracePath(g, q, true);
      g.globalCompositeOperation = "source-over";
      g.globalAlpha = ga * a;
      g.fillStyle = rgba(rgb, 1);
      g.fill();
      g.clip();
      // granulation
      const grain = o.grain == null ? 0.55 : o.grain;
      if (grain > 0) {
        g.globalCompositeOperation = "source-atop";
        g.globalAlpha = ga * a * grain;
        g.fillStyle = grainPattern(g, rgb);
        g.fillRect(bb.x0 - 2, bb.y0 - 2, bb.w + 4, bb.h + 4);
      }
      // dry blooms: lighter clouds where the water left the pigment
      const bloom = o.bloom == null ? 0.35 : o.bloom;
      if (bloom > 0) {
        const rnd = P.mulberry32(seed * 13 + 7);
        const n = o.blooms || (1 + Math.round(rnd() * 1.4));
        g.globalCompositeOperation = "destination-out";
        for (let i = 0; i < n; i++) {
          const cx = bb.x0 + bb.w * (0.25 + rnd() * 0.5), cy = bb.y0 + bb.h * (0.25 + rnd() * 0.5);
          const r = Math.max(bb.w, bb.h) * (0.22 + rnd() * 0.22) * (o.bloomSize || 1);
          const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r);
          gr.addColorStop(0, `rgba(0,0,0,${bloom})`); gr.addColorStop(0.55, `rgba(0,0,0,${bloom * 0.45})`); gr.addColorStop(1, "rgba(0,0,0,0)");
          g.fillStyle = gr;
          g.beginPath(); g.ellipse(cx, cy, r * (0.8 + rnd() * 0.5), r * (0.7 + rnd() * 0.5), rnd() * 3, 0, Math.PI * 2); g.fill();
        }
      }
      // pooled rim: pigment settles at the edge as the wash dries
      const pool = o.pool == null ? 1 : o.pool;
      if (pool > 0) {
        g.globalCompositeOperation = "source-atop";
        tracePath(g, q, true);
        g.strokeStyle = rgba(rgb, 1);
        g.lineJoin = "round";
        g.lineWidth = 10 * S.unitMul; g.globalAlpha = ga * a * 0.22 * pool; g.stroke();
        g.lineWidth = 4 * S.unitMul; g.globalAlpha = ga * a * 0.3 * pool; g.stroke();
        g.lineWidth = 1.6 * S.unitMul; g.globalAlpha = ga * a * 0.35 * pool; g.stroke();
      }
      g.restore();
    };
    // a soft organic patch (clouds, pools, spots)
    S.blob = function (x, y, r, rgb, a = 0.7, seed = 0, o = {}) {
      const pts = [];
      const n = 22;
      for (let i = 0; i < n; i++) {
        const t = (i / n) * Math.PI * 2;
        const rr = r * (1 + (o.rough == null ? 0.14 : o.rough) * N.noise(seed * 0.7 + Math.cos(t) * 1.3, Math.sin(t) * 1.3 + seed));
        pts.push([x + Math.cos(t) * rr * (o.sx || 1), y + Math.sin(t) * rr * (o.sy || 1)]);
      }
      S.wash(pts, rgb, a, seed, Object.assign({ edge: 0.8 }, o));
    };
    // one blue drop: the data mark of this essay
    S.drop = (x, y, r = 5, a = 0.85, seed = 0, rgb = C.blue) => S.blob(x, y, r, rgb, a, seed + Math.round(x * 0.37 + y * 0.11), { bloom: 0.25, blooms: 1, pool: 1.1, grain: 0.4 });

    /* ----- lettering ----- */
    S.label = function (text, x, y, o = {}) {
      const g = S.ink;
      // on phones the stage is a third of the size: a label can hide, or say less
      if (S.scale < 0.55 && o.narrow !== undefined) { if (o.narrow === false) return; text = o.narrow; }
      const minPx = o.minPx == null ? 11 : o.minPx;
      const size = Math.max(o.size || 13, minPx / S.scale);
      const fam = o.font === "display" ? '"Cormorant Garamond", Georgia, serif' : o.font === "body" ? '"Source Serif 4", Georgia, serif' : '"IBM Plex Mono", ui-monospace, Menlo, monospace';
      g.save();
      g.font = `${o.weight || (o.font === "display" ? 500 : 400)} ${size}px ${fam}`;
      g.fillStyle = o.color || (o.font === "display" ? "rgba(52,52,56,1)" : "rgba(110,110,115,1)");
      g.globalAlpha = S._alpha * (o.a == null ? 1 : o.a);
      g.textAlign = o.align || "left";
      g.textBaseline = o.baseline || "alphabetic";
      // wrap within o.width (virtual units)
      if (o.width) {
        const words = String(text).split(" "), lines = []; let cur = "";
        for (const w of words) { const t = cur ? cur + " " + w : w; if (g.measureText(t).width > o.width && cur) { lines.push(cur); cur = w; } else cur = t; }
        if (cur) lines.push(cur);
        const lh = size * (o.lineHeight || 1.3);
        lines.forEach((l, i) => g.fillText(l, x, y + i * lh));
      } else g.fillText(String(text), x, y);
      g.restore();
    };
    S.measure = function (text, size = 13, font) {
      const g = S.ink;
      const fam = font === "display" ? '"Cormorant Garamond", Georgia, serif' : font === "body" ? '"Source Serif 4", Georgia, serif' : '"IBM Plex Mono", ui-monospace, Menlo, monospace';
      g.save(); g.font = `${size}px ${fam}`; const w = g.measureText(String(text)).width; g.restore(); return w;
    };
    S.leader = (x0, y0, x1, y1, a = 0.5, seed = 0) => S.line([[x0, y0], [x1, y1]], { w: 0.8, a, jit: 0.25, seed });

    /* ----- motifs ----- */
    // the reference's face: a nose, an eye-dash, no mouth. s scales from a 1-unit head.
    S.face = function (x, y, s = 1, o = {}) {
      const dir = o.dir || 1; // 1 faces right
      S.dot(x + 6 * s * dir, y - 2 * s, 0.9 * s, 0.7);
      if (o.mood === "closed") S.line([[x + 4 * s * dir, y - 2 * s], [x + 8 * s * dir, y - 2 * s]], { w: 0.8, a: 0.6, jit: 0.2 });
      S.line([[x + 11 * s * dir, y + 2 * s], [x + 13 * s * dir, y + 5 * s], [x + 11 * s * dir, y + 6 * s]], { w: 0.9, a: 0.65, jit: 0.2, seed: 3 });
    };
    // four-point sparkle: marks something you can hover
    S.sparkle = function (x, y, r, a = 0.8, t = 0) {
      const pts = [];
      const rr0 = r * (1 + 0.08 * Math.sin(t * 0.004));
      for (let i = 0; i <= 8; i++) { const ang = (i / 8) * Math.PI * 2 - Math.PI / 2; const rr = i % 2 ? rr0 * 0.24 : rr0; pts.push([x + Math.cos(ang) * rr, y + Math.sin(ang) * rr]); }
      S.line(pts, { w: 1, a, jit: 0.2, seed: 77 });
      S.blob(x, y, r * 0.42, C.blue, 0.5 * a, 5, { bloom: 0, pool: 0.6, grain: 0.2, edge: 0.4 });
    };
    S.ring = (x, y, r, a = 0.8, k = 1) => S.line(partial(ellipse(x, y, r, r, -Math.PI / 2, Math.PI * 1.5, 40), k), { w: 1.1, a, jit: 0.5, seed: 11 });

    /* ----- solids: translucent volumes, the machine's thought ----- */
    const SOLIDS = {
      cube: { v: [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], f: [[4, 5, 6, 7], [1, 0, 3, 2], [0, 4, 7, 3], [5, 1, 2, 6], [0, 1, 5, 4], [7, 6, 2, 3]] },
      tetra: { v: [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map((p) => p.map((c) => c * 1.15)), f: [[0, 1, 2], [0, 3, 1], [0, 2, 3], [1, 3, 2]] },
      octa: { v: [[1.3, 0, 0], [-1.3, 0, 0], [0, 1.3, 0], [0, -1.3, 0], [0, 0, 1.3], [0, 0, -1.3]], f: [[0, 4, 2], [4, 1, 2], [1, 5, 2], [5, 0, 2], [4, 0, 3], [1, 4, 3], [5, 1, 3], [0, 5, 3]] }
    };
    function prism(n, h = 1) {
      const v = [], f = [];
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; v.push([Math.cos(a), -h, Math.sin(a)]); v.push([Math.cos(a), h, Math.sin(a)]); }
      f.push(Array.from({ length: n }, (_, i) => i * 2).reverse());
      f.push(Array.from({ length: n }, (_, i) => i * 2 + 1));
      for (let i = 0; i < n; i++) { const j = (i + 1) % n; f.push([i * 2, j * 2, j * 2 + 1, i * 2 + 1]); }
      return { v, f };
    }
    function pyramid(n = 4) {
      const v = [], f = [];
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + Math.PI / 4; v.push([Math.cos(a) * 1.2, 0.8, Math.sin(a) * 1.2]); }
      v.push([0, -1.2, 0]);
      f.push(Array.from({ length: n }, (_, i) => i));
      for (let i = 0; i < n; i++) f.push([(i + 1) % n, i, n]);
      return { v, f };
    }
    function rot(p, yaw, pitch, roll) {
      let [x, y, z] = p;
      let cy = Math.cos(yaw), sy = Math.sin(yaw); [x, z] = [x * cy + z * sy, -x * sy + z * cy];
      let cp = Math.cos(pitch), sp = Math.sin(pitch); [y, z] = [y * cp - z * sp, y * sp + z * cp];
      let cr = Math.cos(roll), sr = Math.sin(roll); [x, y] = [x * cr - y * sr, x * sr + y * cr];
      return [x, y, z];
    }
    /* solid(kind, cx, cy, size, { yaw, pitch, roll, a, rgb, seed, k, sx, sy, sz, persp })
       Faces that face the viewer are washed: top faces palest, left faces strongest. */
    S.solid = function (kind, cx, cy, size, o = {}) {
      let model = SOLIDS[kind] || (kind === "slab" ? SOLIDS.cube : kind.startsWith("prism") ? prism(+kind.slice(5) || 6, o.h || 1) : kind === "pyramid" ? pyramid(4) : SOLIDS.cube);
      const yaw = o.yaw == null ? 0.6 : o.yaw, pitch = o.pitch == null ? 0.45 : o.pitch, roll = o.roll || 0;
      const sx = o.sx || 1, sy = o.sy || 1, sz = o.sz || 1;
      const persp = o.persp == null ? 0.12 : o.persp;
      const pts = model.v.map((p) => rot([p[0] * sx, p[1] * sy, p[2] * sz], yaw, pitch, roll));
      const proj = pts.map(([x, y, z]) => { const d = 1 + persp * z * 0.5; return [cx + x * size * d, cy + y * size * d]; });
      const faces = model.f.map((idx, i) => {
        const a = pts[idx[0]], b = pts[idx[1]], c = pts[idx[2]];
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        const L = Math.hypot(nx, ny, nz) || 1; nx /= L; ny /= L; nz /= L;
        // convex solids: the normal points away from the centre, whatever the winding
        const fx = idx.reduce((s, j) => s + pts[j][0], 0) / idx.length, fy = idx.reduce((s, j) => s + pts[j][1], 0) / idx.length, fz = idx.reduce((s, j) => s + pts[j][2], 0) / idx.length;
        if (nx * fx + ny * fy + nz * fz < 0) { nx = -nx; ny = -ny; nz = -nz; }
        const zc = idx.reduce((s, j) => s + pts[j][2], 0) / idx.length;
        return { idx, nx, ny, nz, zc, i };
      }).filter((f) => f.nz > 0.02).sort((p, q) => p.zc - q.zc);
      const base = o.a == null ? 0.78 : o.a, rgb = o.rgb || C.blue, seed = o.seed || 0;
      const k = o.k == null ? 1 : o.k;
      faces.forEach((f, n) => {
        const up = clamp(-f.ny), left = clamp(-f.nx);
        // top faces nearly white with a big bloom; side faces full; left stronger than right
        const tone = up > 0.6 ? 0.3 - 0.1 * up : 0.78 + 0.22 * left;
        const fk = clamp(k * faces.length - n);
        if (fk <= 0) return;
        const poly = f.idx.map((j) => proj[j]);
        S.wash(poly, rgb, base * tone * fk, seed + f.i * 3, { bloom: up > 0.6 ? 0.75 : 0.3, blooms: up > 0.6 ? 1 : 2, bloomSize: up > 0.6 ? 1.6 : 1, pool: up > 0.6 ? 0.6 : 1, edge: o.edge, grain: o.grain });
      });
      return proj;
    };

    /* ----- the figure: a small person in a white dress ----- */
    // Poses are polylines in a local space: origin at the hips on the ground, 1 unit ≈ 1 px of the 696-wide reference.
    const O = [330, 540];
    const rel = (pts) => pts.map(([x, y]) => [x - O[0], y - O[1]]);
    const POSES = {};
    // the reference pose: sitting, legs out to the right, hands in the lap, head turned right
    POSES.sit = {
      head: { x: 326, y: 292, s: 1, dir: 1 },
      hair: rel([[300, 254], [322, 247], [346, 251], [357, 262], [352, 276], [340, 282], [330, 300], [322, 322], [304, 326], [288, 316], [284, 296], [287, 272]]),
      strokes: [
        // hair: a bob, drawn as a few overlapping strands
        { cp: rel([[300, 254], [286, 276], [283, 300], [288, 318], [302, 326]]), w: 1, seed: 1 },
        { cp: rel([[300, 254], [320, 247], [344, 250], [357, 260]]), w: 1, seed: 2 },
        { cp: rel([[306, 262], [326, 268], [350, 274]]), w: 0.8, a: 0.55, seed: 3 },
        { cp: rel([[294, 268], [292, 296], [298, 318]]), w: 0.8, a: 0.5, seed: 19 },
        { cp: rel([[310, 258], [304, 288], [310, 320]]), w: 0.75, a: 0.42, seed: 20 },
        { cp: rel([[302, 326], [314, 330], [330, 326], [340, 320]]), w: 0.85, a: 0.6, seed: 4 },
        // profile: forehead, nose, lip, chin, jaw
        { cp: rel([[357, 260], [359, 274], [356, 286], [364, 294], [356, 300], [356, 308], [349, 316], [340, 322], [336, 330]]), w: 1, seed: 5 },
        // neck
        { cp: rel([[336, 330], [338, 340]]), w: 0.8, a: 0.55, seed: 6 },
        { cp: rel([[322, 328], [324, 338]]), w: 0.8, a: 0.45, seed: 21 },
        // dress: left side down to the puddle of the skirt and along the hem
        { cp: rel([[292, 344], [285, 380], [281, 416], [283, 458], [266, 494], [248, 520], [240, 536], [264, 546], [300, 550], [336, 550], [388, 544], [414, 532], [438, 516]]), w: 1.05, seed: 7 },
        // shoulders and the right side
        { cp: rel([[292, 344], [304, 337], [326, 334], [350, 336], [364, 343], [376, 374], [382, 414], [381, 442], [392, 468], [418, 490], [444, 508]]), w: 1.05, seed: 8 },
        // left arm: sleeve hangs to the waist, then the forearm reaches into the lap
        { cp: rel([[300, 362], [296, 400], [298, 438]]), w: 0.85, a: 0.6, seed: 9 },
        { cp: rel([[298, 438], [330, 462], [372, 486]]), w: 0.9, seed: 10 },
        { cp: rel([[312, 440], [340, 470], [376, 494]]), w: 0.85, a: 0.6, seed: 22 },
        // right forearm coming in from the right side
        { cp: rel([[383, 448], [388, 466], [386, 482]]), w: 0.85, a: 0.6, seed: 11 },
        // hands: two small loops
        { cp: rel([[372, 486], [386, 480], [402, 484], [398, 496], [384, 499], [376, 494]]), w: 0.9, seed: 12 },
        { cp: rel([[386, 482], [398, 490], [404, 499], [392, 502]]), w: 0.8, a: 0.6, seed: 13 },
        // near leg: thigh out of the skirt, knee, shin, a foot pointing right with the toes up
        { cp: rel([[444, 508], [488, 526], [530, 544], [566, 554], [590, 552], [606, 546], [614, 552], [604, 566], [584, 574]]), w: 1, seed: 14 },
        { cp: rel([[396, 546], [450, 562], [510, 576], [556, 582], [584, 580]]), w: 0.95, seed: 15 },
        // far leg, below, and its foot
        { cp: rel([[440, 566], [490, 584], [540, 596], [572, 602], [596, 598], [604, 590], [594, 586]]), w: 0.9, a: 0.65, seed: 16 },
        { cp: rel([[480, 588], [530, 602], [568, 610], [592, 610]]), w: 0.8, a: 0.5, seed: 17 }
      ]
    };
    // sitting up straight, hands on knees, facing right
    POSES.sitUp = {
      head: { x: 340, y: 262, s: 1, dir: 1 },
      strokes: [
        { cp: rel([[312, 222], [298, 246], [296, 272], [302, 292], [316, 298]]), w: 1.1, seed: 1 },
        { cp: rel([[312, 222], [334, 215], [358, 218], [370, 228]]), w: 1.1, seed: 2 },
        { cp: rel([[320, 228], [342, 234], [364, 242]]), w: 0.9, a: 0.6, seed: 3 },
        { cp: rel([[370, 228], [372, 244], [369, 256], [377, 264], [369, 270], [369, 278], [362, 286], [352, 292], [346, 302]]), w: 1.1, seed: 5 },
        { cp: rel([[346, 302], [348, 314]]), w: 0.9, a: 0.6, seed: 6 },
        { cp: rel([[308, 318], [304, 360], [300, 410], [296, 450], [280, 490], [262, 520], [262, 536], [300, 546], [350, 548], [400, 544], [440, 534], [462, 520]]), w: 1.2, seed: 7 },
        { cp: rel([[308, 318], [326, 310], [348, 308], [370, 312], [384, 322], [388, 360], [390, 400], [392, 436], [410, 470], [430, 500]]), w: 1.2, seed: 8 },
        { cp: rel([[386, 350], [404, 390], [430, 430], [452, 468], [466, 500]]), w: 1, seed: 9 },
        { cp: rel([[452, 468], [470, 480], [478, 494], [466, 502]]), w: 0.95, seed: 12 },
        { cp: rel([[440, 496], [474, 506], [512, 500], [548, 492], [572, 500], [590, 520], [598, 540], [586, 548], [568, 544]]), w: 1.1, seed: 14 },
        { cp: rel([[462, 520], [500, 540], [540, 548], [568, 548]]), w: 1, seed: 15 }
      ]
    };
    // standing, facing right, arms down
    POSES.stand = {
      head: { x: 330, y: 150, s: 1, dir: 1 },
      strokes: [
        { cp: rel([[302, 110], [288, 134], [286, 160], [292, 180], [306, 186]]), w: 1.1, seed: 1 },
        { cp: rel([[302, 110], [324, 103], [348, 106], [360, 116]]), w: 1.1, seed: 2 },
        { cp: rel([[310, 116], [332, 122], [354, 130]]), w: 0.9, a: 0.6, seed: 3 },
        { cp: rel([[360, 116], [362, 132], [359, 144], [367, 152], [359, 158], [359, 166], [352, 174], [342, 180], [336, 190]]), w: 1.1, seed: 5 },
        { cp: rel([[336, 190], [338, 202]]), w: 0.9, a: 0.6, seed: 6 },
        { cp: rel([[300, 206], [296, 260], [292, 330], [286, 400], [276, 470], [270, 520], [272, 540], [392, 540], [392, 518], [386, 470], [378, 400], [372, 330], [370, 260], [372, 206]]), w: 1.2, seed: 7 },
        { cp: rel([[300, 206], [318, 198], [340, 196], [360, 198], [372, 206]]), w: 1.2, seed: 8 },
        { cp: rel([[298, 232], [294, 290], [290, 350], [292, 390]]), w: 1, a: 0.7, seed: 9 },
        { cp: rel([[372, 232], [378, 290], [382, 350], [380, 392]]), w: 1, a: 0.7, seed: 10 },
        { cp: rel([[286, 388], [280, 400], [288, 410], [296, 400]]), w: 0.9, seed: 12 },
        { cp: rel([[376, 390], [372, 402], [380, 412], [388, 402]]), w: 0.9, seed: 13 },
        // feet
        { cp: rel([[296, 540], [304, 552], [330, 556], [338, 548]]), w: 1, seed: 14 },
        { cp: rel([[358, 540], [364, 552], [392, 556], [398, 548]]), w: 1, seed: 15 }
      ]
    };
    // lying on the back, head left
    POSES.lie = {
      head: { x: 150, y: 500, s: 1, dir: 1, rot: -Math.PI / 2 },
      strokes: [
        { cp: rel([[120, 468], [100, 480], [96, 506], [104, 528], [122, 538]]), w: 1.1, seed: 1 },
        { cp: rel([[122, 466], [146, 462], [172, 468], [184, 480]]), w: 1.1, seed: 2 },
        { cp: rel([[184, 480], [192, 492], [186, 500], [192, 510], [184, 520], [176, 532], [164, 538]]), w: 1.1, seed: 5 },
        { cp: rel([[196, 480], [240, 476], [300, 474], [360, 476], [420, 482], [470, 492], [500, 502], [520, 520], [530, 536], [520, 540]]), w: 1.2, seed: 7 },
        { cp: rel([[196, 536], [250, 540], [320, 542], [400, 540], [470, 538], [520, 540]]), w: 1.2, seed: 8 },
        { cp: rel([[520, 520], [570, 516], [610, 512], [628, 500], [634, 508], [620, 520], [600, 526]]), w: 1.1, seed: 14 },
        { cp: rel([[520, 540], [575, 538], [618, 534]]), w: 1, a: 0.7, seed: 15 },
        { cp: rel([[300, 480], [310, 500], [330, 512], [360, 518]]), w: 1, a: 0.7, seed: 9 }
      ]
    };
    S.poses = POSES;
    /* figure(pose, x, y, s, { k, dir, tint }) at the hips; s = 1 is the reference size (≈355 units tall) */
    S.figure = function (pose, x, y, s = 1, o = {}) {
      const p = POSES[pose] || POSES.sit;
      const k = o.k == null ? 1 : o.k;
      const dir = o.dir || 1;
      S.save();
      S.translate(x, y);
      S.scaleBy(s * dir, s);
      if (p.hair && k > 0.2) S.wash(spline(p.hair, 6), C.grey, 0.16 * clamp(k * 3), 40 + (o.seed || 0), { bloom: 0.2, blooms: 1, pool: 0.5, grain: 0.3, edge: 1 });
      const n = p.strokes.length;
      p.strokes.forEach((st, i) => {
        const sk = clamp(k * n * 0.6 - i * 0.6 + 0.6);
        if (sk <= 0) return;
        S.line(spline(st.cp, 8), { w: st.w / Math.sqrt(s), a: st.a, seed: st.seed + (o.seed || 0), k: sk });
      });
      if (k > 0.3 && !o.noFace) {
        const h = p.head;
        S.save();
        S.translate(h.x - O[0], h.y - O[1]);
        if (h.rot) S.rotate(h.rot);
        S.face(0, 0, h.s, { dir: 1, mood: o.mood });
        S.restore();
      }
      S.restore();
      return { headX: x + (p.head.x - O[0]) * s * dir, headY: y + (p.head.y - O[1]) * s };
    };

    S.fit();
    return S;
  }

  window.Wash = { stage, C, rgba, spline, ellipse, wobble, partial, bbox, lerp, clamp, seg, easeOut, easeInOut, smooth, DPR };
})();
