/* wc.js: sunlit anime-watercolour for canvas.
   A shape is a wash: flat local colour, pigment mottling clipped inside,
   a darker pooled wet edge, an optional hard-edged shade glaze, and a thin
   wobbly contour in a darker shade of its own colour. Gloss is lifted-out
   white dashes along rims; light comes in as soft diagonal shafts.
   No dependencies. Works in a virtual coordinate space (see WC.stage). */
(function () {
  "use strict";

  /* ---------- random + noise ---------- */
  function rng(seed) {
    let a = (seed * 2654435761) >>> 0 || 1;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function makeNoise(seed) {
    const r = rng(seed), p = new Uint8Array(512), perm = [...Array(256).keys()];
    for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
    for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
    const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
    const grad = (h, x, y) => { switch (h & 7) { case 0: return x + y; case 1: return -x + y; case 2: return x - y; case 3: return -x - y; case 4: return x; case 5: return -x; case 6: return y; default: return -y; } };
    function noise(x, y) {
      let X = Math.floor(x), Y = Math.floor(y); x -= X; y -= Y; X &= 255; Y &= 255;
      const u = fade(x), v = fade(y);
      const aa = p[p[X] + Y], ab = p[p[X] + Y + 1], ba = p[p[X + 1] + Y], bb = p[p[X + 1] + Y + 1];
      const x1 = grad(aa, x, y) + u * (grad(ba, x - 1, y) - grad(aa, x, y));
      const x2 = grad(ab, x, y - 1) + u * (grad(bb, x - 1, y - 1) - grad(ab, x, y - 1));
      return x1 + v * (x2 - x1);
    }
    function fbm(x, y, oct = 4) { let s = 0, a = 0.5, f = 1, n = 0; for (let o = 0; o < oct; o++) { s += a * noise(x * f, y * f); n += a; a *= 0.5; f *= 2; } return s / n; }
    return { noise, fbm };
  }
  const N = makeNoise(7);

  /* ---------- colour ---------- */
  function hex(c) { if (Array.isArray(c)) return c; c = c.replace("#", ""); return [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16)); }
  function rgba(c, a = 1) { const [r, g, b] = hex(c); return `rgba(${r},${g},${b},${a})`; }
  function mix(c1, c2, t) { const a = hex(c1), b = hex(c2); return a.map((v, i) => Math.round(v + (b[i] - v) * t)); }
  function shade(c, t) { return mix(c, [28, 36, 58], t); }       // darken toward indigo-black, never pure black
  function tint(c, t) { return mix(c, [255, 255, 244], t); }

  const PAL = {
    wood: "#f1dcb8", woodStreak: "#ecc795", woodGrain: "#dcae78", woodLight: "#f9ead2",
    mat: "#3d6090", matLight: "#6684aa", matEdge: "#294673",
    slate: "#667d8b", slateShade: "#4f6277",
    white: "#fffff0", porcelainShade: "#c9d6df", blue: "#8fb1cf", blueDeep: "#3f6fa4",
    yolk: "#fae06f", yolkCore: "#f6c33a",
    red: "#d8573b", redInner: "#a23c2c",
    green: "#93b55a", greenDeep: "#586454",
    ink: "#2b3440", muted: "#6e7480",
    shell: "#d9cfc0", shellDark: "#8d8478", lilac: "#a99aac", nacre: "#eef0ee",
    meat: "#d8d2c2", mantle: "#5d5a58", lemon: "#f7d65a", ice: "#e9f3f7"
  };

  /* ---------- geometry ---------- */
  function circlePts(cx, cy, rx, ry = rx, n = 72, rot = 0) {
    const out = [];
    for (let i = 0; i < n; i++) { const a = rot + (i / n) * Math.PI * 2; out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
    return out;
  }
  // organic blob: radius modulated by low-frequency noise
  function blobPts(cx, cy, rx, ry, o = {}) {
    const n = o.n || 96, wob = o.wob == null ? 0.18 : o.wob, seed = o.seed || 0, f = o.freq || 1.6, rot = o.rot || 0;
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const k = 1 + wob * N.fbm(Math.cos(a) * f + seed * 3.7, Math.sin(a) * f + seed * 1.3, 3);
      const x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k;
      out.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
    }
    return out;
  }
  // displace a closed polyline's points slightly (hand wobble)
  function wobble(pts, amp, seed = 0, freq = 0.05) {
    return pts.map(([x, y], i) => [x + amp * N.noise(i * freq * 7 + seed, seed * 0.37), y + amp * N.noise(i * freq * 7 + seed + 50, seed * 0.37 + 9)]);
  }
  function smoothClosed(cp, per = 10) {
    const out = [], n = cp.length;
    for (let i = 0; i < n; i++) {
      const p0 = cp[(i - 1 + n) % n], p1 = cp[i], p2 = cp[(i + 1) % n], p3 = cp[(i + 2) % n];
      for (let t = 0; t < 1; t += 1 / per) {
        const t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
      }
    }
    return out;
  }
  function smoothOpen(cp, per = 10) {
    const out = [], n = cp.length;
    for (let i = 0; i < n - 1; i++) {
      const p0 = cp[Math.max(0, i - 1)], p1 = cp[i], p2 = cp[i + 1], p3 = cp[Math.min(n - 1, i + 2)];
      for (let t = 0; t < 1; t += 1 / per) {
        const t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
      }
    }
    out.push(cp[n - 1]);
    return out;
  }
  function path(g, pts, close = true) {
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    if (close) g.closePath();
  }
  function bbox(pts) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of pts) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
    return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
  }

  /* ---------- pigment textures (cached) ---------- */
  const texCache = {};
  function mottleTile(kind = "soft") {
    if (texCache[kind]) return texCache[kind];
    const S = 256, c = document.createElement("canvas"); c.width = c.height = S;
    const g = c.getContext("2d"), im = g.createImageData(S, S), Nt = makeNoise(kind === "soft" ? 11 : 29), r = rng(5);
    const per = (fn, x, y, s) => { // tileable by blending 4 samples
      const u = x / S, v = y / S;
      return fn(u * s, v * s) * (1 - u) * (1 - v) + fn((u - 1) * s, v * s) * u * (1 - v) + fn(u * s, (v - 1) * s) * (1 - u) * v + fn((u - 1) * s, (v - 1) * s) * u * v;
    };
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      let a;
      if (kind === "soft") {
        const b = per((X, Y) => Nt.fbm(X, Y, 4), x, y, 3);
        a = 0.5 + 0.9 * b;
      } else if (kind === "gran") { // granulation: fine pigment specks clumped by a soft field
        const b = per((X, Y) => Nt.fbm(X, Y, 3), x, y, 4);
        const f = per((X, Y) => Nt.noise(X, Y), x, y, 40);
        a = 0.35 + 0.7 * b + 0.45 * f + (r() < 0.06 ? 0.25 : 0);
      } else if (kind === "wet") { // wet-in-wet: patches with hard back-run edges that pool darker
        const b = per((X, Y) => Nt.fbm(X * 0.5, Y * 1.6, 4), x, y, 3);
        const f = per((X, Y) => Nt.noise(X, Y), x, y, 36);
        const sm = (e0, e1, v) => { const t = Math.max(0, Math.min(1, (v - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
        const patch = sm(-0.04, 0.06, b), ridge = Math.exp(-Math.pow(b / 0.03, 2));
        a = 0.35 + 0.35 * patch + 0.3 * ridge + 0.08 * f;
      } else { // streak: horizontally stretched
        const b = per((X, Y) => Nt.fbm(X * 0.25, Y * 3, 4), x, y, 4);
        a = 0.5 + b;
      }
      a = Math.max(0, Math.min(1, a));
      const j = (y * S + x) * 4; im.data[j] = im.data[j + 1] = im.data[j + 2] = 0; im.data[j + 3] = a * 255;
    }
    g.putImageData(im, 0, 0);
    return (texCache[kind] = c);
  }
  const patCache = new Map();
  function tintedPattern(g, color, kind, scale) {
    const key = color + kind;
    let tile = patCache.get(key);
    if (!tile) {
      const t = mottleTile(kind); tile = document.createElement("canvas"); tile.width = tile.height = t.width;
      const x = tile.getContext("2d"); x.fillStyle = rgba(color, 1); x.fillRect(0, 0, t.width, t.height);
      x.globalCompositeOperation = "destination-in"; x.drawImage(t, 0, 0); patCache.set(key, tile);
    }
    const p = g.createPattern(tile, "repeat");
    if (p.setTransform) p.setTransform(new DOMMatrix().scale(scale || 1));
    return p;
  }

  /* ---------- the wash ----------
     o: { color, a, mottle (0..1), kind ('soft'|'gran'|'streak'), mscale,
          edge (pooled wet-edge width), edgeA, edgeColor,
          glaze: { pts | dx,dy, color, a }  hard-edged shade inside,
          line: { color, w, a } or false,  seed } */
  function wash(g, pts, o = {}) {
    const color = o.color || PAL.mat;
    const a = o.a == null ? 1 : o.a;
    const seed = o.seed || 0;
    const ga = g.globalAlpha;
    g.save();
    // a thin unpainted paper gap where this wash meets what is under it
    if (o.gap) { g.strokeStyle = rgba(o.gapColor || "#f8ecd6", 0.95); g.lineWidth = o.gap * 2; g.lineJoin = "round"; path(g, pts); g.stroke(); }
    path(g, pts);
    if (o.grad) { // radial gradient fill: { x, y, r0, r1, stops: [[t, color, alpha]] }
      const q = o.grad, rg = g.createRadialGradient(q.x, q.y, q.r0 || 0, q.x2 == null ? q.x : q.x2, q.y2 == null ? q.y : q.y2, q.r1);
      for (const [t, c, al] of q.stops) rg.addColorStop(t, rgba(c, al == null ? a : al));
      g.fillStyle = rg;
    } else g.fillStyle = rgba(color, a);
    // soft but defined edge: the fill is very slightly feathered
    if (o.soft !== 0) g.filter = `blur(${(o.soft || 0.5) * (g.__scale || 1)}px)`;
    g.fill();
    g.filter = "none";
    g.clip();
    // pigment mottling
    if (o.mottle) {
      g.globalAlpha = ga * o.mottle;
      g.fillStyle = tintedPattern(g, rgba(o.mottleColor || shade(color, 0.28)), o.kind || "wet", o.mscale || 1);
      const b = bbox(pts), T0 = g.getTransform();
      const ox = seed * 37 % 256, oy = seed * 53 % 256;
      g.translate(ox, oy);
      g.fillRect(b.x0 - 260 - ox, b.y0 - 260 - oy, b.w + 520, b.h + 520);
      g.setTransform(T0);
      g.globalAlpha = ga;
    }
    // hard-edged shade glaze
    if (o.glaze) {
      const gz = o.glaze;
      const gp = gz.pts || pts.map(([x, y]) => [x + (gz.dx || 0), y + (gz.dy || 0)]);
      g.fillStyle = rgba(gz.color || shade(color, 0.2), gz.a == null ? 0.5 : gz.a);
      if (gz.invert) { // shade everything *outside* gp (inside the shape): a crescent
        g.beginPath(); const b = bbox(pts); g.rect(b.x0 - 50, b.y0 - 50, b.w + 100, b.h + 100);
        g.moveTo(gp[0][0], gp[0][1]); for (let i = gp.length - 1; i >= 0; i--) g.lineTo(gp[i][0], gp[i][1]); g.closePath();
        g.fill("evenodd");
      } else { path(g, gp); g.fill(); }
    }
    // pooled wet edge: pigment collects at the boundary as the wash dries
    if (o.edge !== 0) {
      const ew = o.edge == null ? 3 : o.edge;
      const ec = o.edgeColor || shade(color, 0.32);
      g.filter = `blur(${Math.max(0.6, ew * 0.55 * (g.__scale || 1))}px)`;
      g.strokeStyle = rgba(ec, o.edgeA == null ? 0.55 : o.edgeA);
      g.lineWidth = ew * 2; g.lineJoin = "round";
      path(g, pts); g.stroke();
      g.filter = "none";
      g.strokeStyle = rgba(ec, (o.edgeA == null ? 0.55 : o.edgeA) * 0.6);
      g.lineWidth = Math.max(0.6, ew * 0.5);
      path(g, pts); g.stroke();
    }
    g.restore();
    if (o.line) contour(g, pts, Object.assign({ color: shade(color, 0.45), seed }, o.line));
  }

  /* ---------- line ----------
     a thin hand contour: wobbles a little, varies in weight and alpha */
  function contour(g, pts, o = {}) {
    const w = o.w || 1.2, seed = o.seed || 0, close = o.close !== false;
    const P = close ? pts.concat([pts[0]]) : pts;
    const k = o.k == null ? 1 : o.k;
    const n = Math.max(2, Math.floor(P.length * k));
    g.save();
    g.lineCap = "round"; g.lineJoin = "round";
    g.strokeStyle = rgba(o.color || PAL.ink, o.a == null ? 0.85 : o.a);
    // draw in short runs so the weight can drift
    const run = 6;
    for (let i = 0; i < n - 1; i += run) {
      const j = Math.min(n - 1, i + run);
      const pr = 0.7 + 0.45 * (0.5 + 0.5 * N.noise(i * 0.05 + seed * 3.1, 2.2));
      g.lineWidth = w * pr;
      g.beginPath();
      for (let m = i; m <= j; m++) {
        const [x, y] = P[m];
        const jx = (o.jit || 0.35) * N.noise(m * 0.09 + seed, 4.4), jy = (o.jit || 0.35) * N.noise(m * 0.09 + seed, 8.8);
        m === i ? g.moveTo(x + jx, y + jy) : g.lineTo(x + jx, y + jy);
      }
      g.stroke();
    }
    g.restore();
  }
  // an open painted stroke: tapered ribbon (for stems, streaks, pattern bands)
  function stroke(g, pts, o = {}) {
    if (pts.length < 2) return;
    const w = o.w || 2, color = o.color || PAL.ink, seed = o.seed || 0;
    const L = [], R = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      const u = i / (pts.length - 1);
      const taper = o.taper === false ? 1 : Math.sin(Math.PI * Math.min(1, Math.max(0.04, u))) ** 0.45;
      const ww = (w / 2) * taper * (1 + 0.25 * N.noise(i * 0.2 + seed, 1.7));
      L.push([pts[i][0] - ty * ww, pts[i][1] + tx * ww]); R.push([pts[i][0] + ty * ww, pts[i][1] - tx * ww]);
    }
    g.save();
    g.fillStyle = rgba(color, o.a == null ? 1 : o.a);
    g.beginPath(); g.moveTo(L[0][0], L[0][1]);
    for (const p of L) g.lineTo(p[0], p[1]);
    for (let i = R.length - 1; i >= 0; i--) g.lineTo(R[i][0], R[i][1]);
    g.closePath(); g.fill();
    g.restore();
  }

  /* ---------- light ---------- */
  // gloss: broken white dashes along an elliptical arc (angles in radians)
  function rimGloss(g, cx, cy, rx, ry, a0, a1, o = {}) {
    const r = rng(o.seed || 3), w = o.w || 2.2, color = o.color || "#ffffff";
    let a = a0;
    g.save();
    while (a < a1) {
      const len = (o.dash || 0.16) * (0.25 + r() * 1.9), gap = (o.gap || 0.1) * (0.3 + r() * 2.2);
      const e = Math.min(a1, a + len), seg = [];
      for (let t = a; t <= e; t += 0.02) seg.push([cx + Math.cos(t) * rx, cy + Math.sin(t) * ry]);
      if (seg.length > 1) stroke(g, seg, { w: w * (0.45 + r() * 1.2), color, a: (o.a || 0.95) * (0.6 + r() * 0.4), seed: a * 10 });
      a = e + gap;
    }
    g.restore();
  }
  function fleck(g, x, y, s = 3, o = {}) {
    g.save();
    g.fillStyle = rgba(o.color || "#ffffff", o.a == null ? 0.95 : o.a);
    const rot = o.rot || 0;
    g.translate(x, y); g.rotate(rot);
    g.beginPath(); g.ellipse(0, 0, s, s * (o.flat || 0.45), 0, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  function shadow(g, pts, o = {}) {
    const dx = o.dx == null ? -6 : o.dx, dy = o.dy == null ? 8 : o.dy, blur = o.blur || 6;
    g.save();
    g.filter = `blur(${blur * (g.__scale || 1)}px)`;
    g.globalCompositeOperation = "multiply";
    g.fillStyle = rgba(o.color || "#5c6f8c", o.a == null ? 0.35 : o.a);
    path(g, pts.map(([x, y]) => [x + dx, y + dy])); g.fill();
    g.restore();
  }
  // light shafts from upper right: soft, screen-blended white bands
  function rays(g, W, H, o = {}) {
    const ang = o.angle == null ? 0.62 : o.angle, a = o.a == null ? 0.12 : o.a, t = o.t || 0;
    const bands = o.bands || [[0.18, 0.06], [0.34, 0.12], [0.52, 0.035], [0.66, 0.09], [0.86, 0.05]];
    g.save();
    g.globalCompositeOperation = "screen";
    g.filter = `blur(${(o.blur || 22) * (g.__scale || 1)}px)`;
    const dx = Math.tan(ang) * H;
    for (const [u, wd] of bands) {
      const x = (u + 0.015 * Math.sin(t * 0.3 + u * 9)) * (W + dx), w = wd * W;
      // brighter on the leading edge, fading across the band and down the frame
      const grd = g.createLinearGradient(x, 0, x + w, 0);
      grd.addColorStop(0, `rgba(255,238,200,${a * 0.5})`); grd.addColorStop(0.25, `rgba(255,238,200,${a})`); grd.addColorStop(1, `rgba(255,238,200,${a * 0.2})`);
      g.fillStyle = grd;
      g.beginPath(); g.moveTo(x, -20); g.lineTo(x + w, -20); g.lineTo(x + w - dx, H + 20); g.lineTo(x - dx, H + 20); g.closePath(); g.fill();
    }
    g.restore();
  }

  /* ---------- grounds ---------- */
  function wood(g, x, y, W, H, o = {}) {
    const r = rng(o.seed || 21);
    g.save();
    g.beginPath(); g.rect(x, y, W, H); g.clip();
    g.fillStyle = rgba(o.color || PAL.wood); g.fillRect(x, y, W, H);
    // broad planks of slightly different tone
    const planks = o.planks || 5;
    for (let i = 0; i < planks; i++) {
      const py = y + (i / planks) * H, ph = H / planks;
      g.fillStyle = rgba(i % 2 ? PAL.woodStreak : PAL.woodLight, 0.25 + r() * 0.2);
      g.fillRect(x, py + ph * 0.05, W, ph * 0.9);
    }
    // long horizontal streaks with ragged ends: broad soft bands, a few fine grain lines
    const n = o.streaks || Math.round(H / 45);
    for (let i = 0; i < n; i++) {
      const fine = r() < 0.04;
      const sy = y + r() * H, sx = x - 80 + r() * W * 0.85, len = W * (0.25 + r() * 0.7);
      const th = fine ? 1.5 + r() * 2 : 30 + r() * (o.thick || 90);
      const pts = [];
      const m = 30;
      for (let k = 0; k <= m; k++) pts.push([sx + (k / m) * len, sy + th * 0.25 * N.noise(k * 0.3 + i * 7, 1) + 4 * N.noise(k * 0.06 + i, 5)]);
      const c = fine ? PAL.woodGrain : r() < 0.55 ? PAL.woodStreak : PAL.woodLight;
      g.save(); if (!fine) g.filter = `blur(${(3 + r() * 5) * (g.__scale || 1)}px)`;
      stroke(g, pts, { w: th, color: c, a: fine ? 0.2 + r() * 0.15 : 0.3 + r() * 0.35, seed: i });
      g.restore();
    }
    // a soft settle of pigment
    g.globalAlpha = 0.08;
    g.fillStyle = tintedPattern(g, rgba(PAL.woodGrain), "streak", o.mscale || 1.4);
    g.fillRect(x, y, W, H);
    g.restore();
  }
  // indigo mat: an organic blob with granulation and a pooled edge
  function mat(g, pts, o = {}) {
    wash(g, pts, {
      color: o.color || PAL.mat, mottle: o.mottle == null ? 0.32 : o.mottle, kind: o.kind || "streak", mscale: o.mscale || 2.2,
      mottleColor: o.mottleColor || PAL.matEdge, edge: o.edge == null ? 9 : o.edge, edgeColor: PAL.matEdge, edgeA: 0.75,
      glaze: o.glaze, line: false, seed: o.seed
    });
    // lighter blooms where water pooled less
    if (o.blooms !== false) {
      const b = bbox(pts), r = rng((o.seed || 1) + 4);
      g.save(); path(g, pts); g.clip();
      // hard-edged lighter puddles (a lifted, drier area) with a faint darker rim
      for (let i = 0; i < (o.nblooms || 3); i++) {
        // large soft bloom with a cauliflower edge
        const bp = blobPts(b.x0 + r() * b.w, b.y0 + r() * b.h, b.w * (0.16 + r() * 0.2), b.h * (0.12 + r() * 0.18), { wob: 0.42, seed: i + (o.seed || 0), freq: 3.2, rot: r() * 3, n: 140 });
        g.filter = `blur(${2.5 * (g.__scale || 1)}px)`;
        g.fillStyle = rgba(PAL.matLight, 0.4);
        path(g, bp); g.fill();
        g.strokeStyle = rgba(PAL.matEdge, 0.3); g.lineWidth = 2.5; path(g, bp); g.stroke(); g.filter = "none";
      }
      g.restore();
    }
  }

  /* ---------- stage: a DPR-aware canvas with a virtual coordinate space ---------- */
  function stage(canvas, VW, VH, o = {}) {
    const st = { canvas, VW, VH, g: canvas.getContext("2d"), s: 1, ox: 0, oy: 0, fit: o.fit || "contain" };
    st.resize = function () {
      const r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(r.width * dpr)); canvas.height = Math.max(1, Math.round(r.height * dpr));
      const sx = r.width / st.VW, sy = r.height / st.VH;
      st.s = st.fit === "cover" ? Math.max(sx, sy) : Math.min(sx, sy);
      st.ox = (r.width - st.VW * st.s) / 2; st.oy = (r.height - st.VH * st.s) / 2;
      st.dpr = dpr; st.cw = r.width; st.ch = r.height;
    };
    st.begin = function () {
      const g = st.g;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, canvas.width, canvas.height);
      g.setTransform(st.dpr * st.s, 0, 0, st.dpr * st.s, st.dpr * st.ox, st.dpr * st.oy);
      g.__base = g.getTransform();
      g.__scale = st.dpr * st.s;
      return g;
    };
    // px in CSS space -> virtual
    st.toV = (x, y) => [(x - st.ox) / st.s, (y - st.oy) / st.s];
    st.resize();
    return st;
  }
  // bake a drawing to an offscreen canvas in virtual units (for static layers)
  function bake(VW, VH, scale, fn) {
    const c = document.createElement("canvas");
    c.width = Math.ceil(VW * scale); c.height = Math.ceil(VH * scale);
    const g = c.getContext("2d");
    g.setTransform(scale, 0, 0, scale, 0, 0); g.__base = g.getTransform(); g.__scale = scale;
    fn(g);
    return c;
  }

  /* soft white smear: a broad lifted highlight with a soft edge */
  function smear(g, pts, o = {}) {
    g.save();
    g.filter = `blur(${(o.blur || 2.5) * (g.__scale || 1)}px)`;
    stroke(g, pts, { w: o.w || 8, color: o.color || "#ffffff", a: o.a == null ? 0.6 : o.a, seed: o.seed });
    g.restore();
  }

  /* the last pass: warm sunlight soaking everything, then a soft bloom on the highlights */
  function finish(g, VW, VH, o = {}) {
    const c = g.canvas;
    // on a transparent stage, keep a copy of the painted alpha to restore after the veils
    let keep = null;
    if (o.transparent) { keep = document.createElement("canvas"); keep.width = c.width; keep.height = c.height; keep.getContext("2d").drawImage(c, 0, 0); }
    g.save();
    // veils are laid in device space over the whole canvas, whatever the current transform
    g.setTransform(1, 0, 0, 1, 0, 0);
    const W2 = c.width, H2 = c.height;
    // multiply a warm cream veil: whites turn cream, darks keep their depth
    g.globalCompositeOperation = "multiply";
    g.fillStyle = rgba(o.warm || "#fbe5c4", o.warmA == null ? 0.45 : o.warmA);
    g.fillRect(0, 0, W2, H2);
    // milky morning haze falling off from the top-left
    const hz = g.createRadialGradient(W2 * 0.05, -H2 * 0.1, 0, W2 * 0.05, -H2 * 0.1, Math.hypot(W2, H2) * 0.9);
    hz.addColorStop(0, rgba("#fff3dc", o.haze == null ? 0.24 : o.haze)); hz.addColorStop(1, rgba("#fff3dc", 0));
    g.globalCompositeOperation = "screen"; g.fillStyle = hz; g.fillRect(0, 0, W2, H2);
    g.restore();
    if (o.bloom !== 0) {
      const tmp = document.createElement("canvas"); tmp.width = c.width; tmp.height = c.height;
      tmp.getContext("2d").drawImage(c, 0, 0);
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = "screen"; g.globalAlpha = o.bloom == null ? 0.16 : o.bloom;
      g.filter = `blur(${Math.round(c.width / 90)}px)`;
      g.drawImage(tmp, 0, 0);
      g.restore();
    }
    if (keep) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = "destination-in"; g.drawImage(keep, 0, 0); g.restore(); }
  }

  /* cached sprite: draw fn once into an offscreen canvas at the stage's pixel scale.
     key must change if the drawing changes. Returns { c, x, y, w, h } in virtual units. */
  const spriteCache = new Map();
  function sprite(key, scale, x, y, w, h, fn) {
    const k = key + "@" + scale.toFixed(3) + (WC.mode || "");
    let sp = spriteCache.get(k);
    if (!sp) {
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.ceil(w * scale)); c.height = Math.max(1, Math.ceil(h * scale));
      const g = c.getContext("2d");
      g.setTransform(scale, 0, 0, scale, -x * scale, -y * scale); g.__base = g.getTransform(); g.__scale = scale;
      fn(g);
      sp = { c, x, y, w, h };
      spriteCache.set(k, sp);
    }
    return sp;
  }
  function blit(g, sp, dx = 0, dy = 0, alpha = 1, s = 1, cx, cy) {
    if (alpha <= 0) return;
    g.save(); g.globalAlpha *= alpha;
    if (s !== 1) { const ox = cx == null ? sp.x + sp.w / 2 : cx, oy = cy == null ? sp.y + sp.h / 2 : cy; g.translate(ox + dx, oy + dy); g.scale(s, s); g.translate(-ox, -oy); dx = dy = 0; }
    g.drawImage(sp.c, sp.x + dx, sp.y + dy, sp.w, sp.h);
    g.restore();
  }

  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));

  window.WC = { rng, makeNoise, N, hex, rgba, mix, shade, tint, PAL, circlePts, blobPts, wobble, smoothClosed, smoothOpen, path, bbox,
    wash, contour, stroke, smear, finish, sprite, blit, rimGloss, fleck, shadow, rays, wood, mat, stage, bake, tintedPattern, ease, clamp, seg };
})();
