/* Fuzz: felted fur on cream, for canvas.
   An animal is a few soft silhouettes (head, ears, muzzle, body), each filled with
   a blurred underfill and then thousands of short curved hairs whose roots lie
   inside the shape and whose tips stray past its edge. Hairs are lighter at a
   "crown" and darker toward the rim; patches recolour hairs by root position.
   Faces are tiny ink marks laid on top. Everything expensive is cached as sprites. */
(function (root) {
  "use strict";
  const DPR = Math.min(2, root.devicePixelRatio || 1);

  /* ---------- seeded random + value noise ---------- */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function makeNoise(seed) {
    const r = mulberry32(seed), G = new Float32Array(256 * 256);
    for (let i = 0; i < G.length; i++) G[i] = r() * 2 - 1;
    const sm = (t) => t * t * (3 - 2 * t);
    return function (x, y) {
      const X = Math.floor(x), Y = Math.floor(y), fx = sm(x - X), fy = sm(y - Y);
      const i = (X & 255), j = (Y & 255), i1 = (i + 1) & 255, j1 = (j + 1) & 255;
      const a = G[j * 256 + i], b = G[j * 256 + i1], c = G[j1 * 256 + i], d = G[j1 * 256 + i1];
      return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
    };
  }

  /* ---------- colour ---------- */
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

  // coats: base (underfill), light (crown hairs), dark (rim hairs)
  const C = (b, l, d) => ({ base: hex(b), light: hex(l), dark: hex(d) });
  const COATS = {
    cream: C("#e4d9c6", "#f2eadc", "#c2b39b"),
    white: C("#e9e2d5", "#f7f3ea", "#c4b9a7"),
    ginger: C("#b9773f", "#d39a5e", "#8f5629"),
    orange: C("#d09650", "#e6b878", "#a8692e"),
    dark: C("#3b2b23", "#5e4739", "#241913"),
    black: C("#2a2422", "#4a403b", "#16110f"),
    grey: C("#8c857d", "#ada69c", "#69625a"),
    tan: C("#b98a55", "#d6ab77", "#8c6236"),
    fawn: C("#cfae7f", "#e4cba2", "#a8875a"),
    apricot: C("#dcb589", "#efd3ad", "#b88c5f"),
    gold: C("#d3a463", "#ebc68c", "#a87a3c"),
    choc: C("#6b4a35", "#8c6a52", "#4a3122"),
    pink: C("#eba796", "#f3c2b4", "#d98a78"),
    ink: C("#2b2420", "#463b35", "#1a1412"),
  };
  const coat = (k) => (typeof k === "string" ? COATS[k] : k);

  const PAL = {
    ground: "#f5efe0", ink: "#231d1a", inkSoft: "rgba(35,29,26,0.55)", blush: "#eba796",
    nose: "#df8b78", tongue: "#d0705c", yellow: "#d8b65e", muted: "#8a8077",
  };

  /* ---------- the fur ---------- */
  const probe = document.createElement("canvas").getContext("2d");
  const inside = (paths, x, y) => { for (const p of paths) if (probe.isPointInPath(p, x, y)) return true; return false; };

  /* fur(g, part)
     part: { paths: Path2D[] (sprite coords), box: [x0,y0,x1,y1], crown: [x,y], rad,
             coat, patches: (x,y) => coatKey|null, len, dens, curl, flow (angle fn), seed, w } */
  function fur(g, p) {
    const rnd = mulberry32(p.seed || 7), Nn = makeNoise((p.seed || 7) + 101);
    const len = p.len || 6, dens = p.dens == null ? 0.42 : p.dens, curl = p.curl == null ? 0.7 : p.curl;
    const wBase = p.w || Math.max(0.5, Math.min(1.1, len * 0.12));
    const [x0, y0, x1, y1] = p.box, cw = x1 - x0, ch = y1 - y0;
    const cr = p.crown || [(x0 + x1) / 2, y0 + ch * 0.3], rad = p.rad || Math.max(cw, ch) * 0.6;
    // rasterise the silhouette once; hair roots are tested against this mask
    const mw = Math.max(1, Math.ceil(cw) + 1), mh = Math.max(1, Math.ceil(ch) + 1);
    const mc = document.createElement("canvas"); mc.width = mw; mc.height = mh;
    const mg = mc.getContext("2d", { willReadFrequently: true }); mg.setTransform(1, 0, 0, 1, -x0, -y0); mg.fillStyle = "#000";
    for (const path of p.paths) mg.fill(path);
    const md = mg.getImageData(0, 0, mw, mh).data;
    const inMask = (x, y) => { const ix = (x - x0) | 0, iy = (y - y0) | 0; return ix >= 0 && iy >= 0 && ix < mw && iy < mh && md[(iy * mw + ix) * 4 + 3] > 127; };
    const mainCoat = coat(p.coat);
    const GL = root.GLFur && root.GLFur.available();
    // underfill: soft-edged so the body never looks like a cut-out (queued with the hairs in WebGL mode)
    const under = () => {
    g.save();
    g.filter = `blur(${Math.max(0.6, len * 0.28)}px)`;
    g.fillStyle = css(p.lift ? mix(mainCoat.base, mainCoat.light, Math.min(1, p.lift * 1.5)) : mainCoat.base);
    for (const path of p.paths) g.fill(path);
    if (p.patches) {
      // patch underfill, rasterised coarsely
      const st = Math.max(2, len * 0.6);
      for (let y = y0; y < y1; y += st) for (let x = x0; x < x1; x += st) {
        const k = p.patches(x, y);
        if (k && inMask(x, y)) { g.fillStyle = css(coat(k).base); g.fillRect(x - st * 0.6, y - st * 0.6, st * 1.2, st * 1.2); }
      }
    }
    g.restore();
    };
    if (!GL) under();
    // hairs, bucketed by coat × tone × pass, then drawn in a few calls: on the GPU
    // (glfur.js) when WebGL2 is there, else as one Canvas 2D stroke per bucket
    const m = g.getTransform(), ms = Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
    const TB = 9, buckets = new Map();
    const bucket = (key, ck, tone, pass) => {
      const id = key + "|" + tone + "|" + pass;
      let b = buckets.get(id);
      if (!b) { b = GL ? { hairs: new root.GLFur.Hairs(), ck, tone, pass } : { path: new Path2D(), ck, tone, pass }; buckets.set(id, b); }
      return b;
    };
    const hair = GL
      ? (b, x, y, mx, my, ex, ey) => b.hairs.push(m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f, m.a * mx + m.c * my + m.e, m.b * mx + m.d * my + m.f, m.a * ex + m.c * ey + m.e, m.b * ex + m.d * ey + m.f)
      : (b, x, y, mx, my, ex, ey) => { b.path.moveTo(x, y); b.path.quadraticCurveTo(mx, my, ex, ey); };
    const count = Math.round(cw * ch * dens);
    const flowS = 1 / Math.max(6, len * 3.2);
    for (let i = 0; i < count; i++) {
      const x = x0 + rnd() * cw, y = y0 + rnd() * ch;
      if (!inMask(x, y)) continue;
      const dx = x - cr[0], dy = y - cr[1], d = Math.hypot(dx, dy) || 1;
      // direction: partly outward from the crown, partly a slow swirl
      const sw = Nn(x * flowS, y * flowS) * Math.PI * 1.6 + (p.flowBias || 0);
      let ax = (dx / d) * 0.75 + Math.cos(sw), ay = (dy / d) * 0.75 + Math.sin(sw) + 0.25;
      if (p.flow) { const a = p.flow(x, y); ax = Math.cos(a) * 1.4 + ax * 0.4; ay = Math.sin(a) * 1.4 + ay * 0.4; }
      const al = Math.hypot(ax, ay) || 1; ax /= al; ay /= al;
      const pass = rnd() < 0.5 ? 0 : 1;
      const L = len * (0.45 + rnd() * 1.05) * (pass ? 0.85 : 1.15);
      const bend = (rnd() - 0.5) * 2 * curl * L;
      const ex = x + ax * L, ey = y + ay * L;
      const mx = (x + ex) / 2 - ay * bend, my = (y + ey) / 2 + ax * bend;
      // tone: light at the crown, dark at the rim, with fibre-to-fibre scatter
      const rim = Math.min(1, d / rad);
      let t = 0.18 + 0.62 * Math.pow(rim, 1.6) + (rnd() - 0.5) * 0.95 + (rnd() < 0.06 ? 0.45 : 0) + Nn(x * 0.05 + 9, y * 0.05) * 0.25 + (pass ? -0.12 : 0.12);
      t = Math.max(0, Math.min(0.999, t - (p.lift || 0)));
      const pj = len * 1.6, pk = p.patches ? p.patches(x + Nn(x * 0.09, y * 0.09 + 30) * pj + (rnd() - 0.5) * len, y + Nn(x * 0.09 + 60, y * 0.09) * pj + (rnd() - 0.5) * len) : null;
      const key = pk || "_";
      const b = bucket(key, pk ? coat(pk) : mainCoat, Math.floor(t * TB), pass);
      hair(b, x, y, mx, my, ex, ey);
      // a few long strays break the silhouette
      if (rnd() < 0.035) {
        const L2 = L * (1.6 + rnd() * 1.4), b2 = (rnd() - 0.5) * 2.2 * L2 * curl;
        const fx = x + ax * L2, fy = y + ay * L2;
        hair(b, x, y, (x + fx) / 2 - ay * b2, (y + fy) / 2 + ax * b2, fx, fy);
      }
    }
    const list = [...buckets.values()].sort((a, b) => a.pass - b.pass);
    const colour = (b) => { const tone = (b.tone + 0.5) / TB; return tone < 0.5 ? mix(b.ck.light, b.ck.base, tone * 2) : mix(b.ck.base, b.ck.dark, (tone - 0.5) * 2); };
    if (GL) {
      // device-pixel box the hairs can reach: the part's box plus the longest stray
      const pad = len * 3.8 + wBase * 2, cs = [[x0 - pad, y0 - pad], [x1 + pad, y0 - pad], [x0 - pad, y1 + pad], [x1 + pad, y1 + pad]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
      const dbox = [Math.min(...cs.map((c) => c[0])), Math.min(...cs.map((c) => c[1])), Math.max(...cs.map((c) => c[0])), Math.max(...cs.map((c) => c[1]))];
      // queued: drawn with the other parts of this sprite in one GPU pass at flush(g)
      (g.__fur || (g.__fur = [])).push({ under, box: dbox, buckets: list.map((b) => ({ hairs: b.hairs, rgb: colour(b), alpha: b.pass ? 0.85 : 0.75, width: wBase * (b.pass ? 0.8 : 1.15) * ms })) });
      return;
    }
    g.save();
    g.lineCap = "round";
    for (const b of list) {
      const tone = (b.tone + 0.5) / TB;
      const c = tone < 0.5 ? mix(b.ck.light, b.ck.base, tone * 2) : mix(b.ck.base, b.ck.dark, (tone - 0.5) * 2);
      g.strokeStyle = css(c, b.pass ? 0.85 : 0.75);
      g.lineWidth = wBase * (b.pass ? 0.8 : 1.15);
      g.stroke(b.path);
    }
    g.restore();
  }

  // draw any fur queued on g (WebGL mode); call before drawing anything else that must sit on top
  function flush(g) {
    const q = g && g.__fur;
    if (!q || !q.length) return;
    g.__fur = [];
    root.GLFur.drawBatch(g, q);
  }

  /* ---------- small ink marks ---------- */
  // a thin tapered hairline with a little wobble (whiskers, diagram lines)
  function hairline(g, pts, o = {}) {
    if (pts.length < 2) return;
    const w = o.w || 0.8, col = o.color || PAL.ink, a = o.a == null ? 0.85 : o.a, k = o.k == null ? 1 : o.k;
    const rnd = mulberry32(o.seed || 3);
    // resample
    const rs = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i], d = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(d / 3));
      for (let j = 1; j <= n; j++) rs.push([ax + (bx - ax) * j / n, ay + (by - ay) * j / n]);
    }
    const n = Math.max(2, Math.floor(rs.length * k));
    g.save(); g.strokeStyle = col; g.lineCap = "round"; g.globalAlpha *= a;
    let ph = rnd() * 10;
    for (let i = 1; i < n; i++) {
      const u = i / (rs.length - 1);
      const taper = o.taper === false ? 1 : Math.max(0.25, 1 - Math.pow(u, 1.5) * 0.75);
      g.lineWidth = w * taper * (0.85 + 0.3 * Math.sin(ph + i * 0.37));
      g.beginPath();
      const j = o.jit == null ? 0.25 : o.jit;
      g.moveTo(rs[i - 1][0] + Math.sin(ph + i * 0.21) * j, rs[i - 1][1] + Math.cos(ph + i * 0.17) * j);
      g.lineTo(rs[i][0] + Math.sin(ph + (i + 1) * 0.21) * j, rs[i][1] + Math.cos(ph + (i + 1) * 0.17) * j);
      g.stroke();
    }
    g.restore();
  }
  const bow = (x0, y0, x1, y1, b, n = 10) => Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n, mx = (x0 + x1) / 2, my = (y0 + y1) / 2, nx = -(y1 - y0), ny = x1 - x0, l = Math.hypot(nx, ny) || 1;
    const qx = mx + nx / l * b, qy = my + ny / l * b, u = 1 - t;
    return [u * u * x0 + 2 * u * t * qx + t * t * x1, u * u * y0 + 2 * u * t * qy + t * t * y1];
  });

  function soft(g, x, y, rx, ry, col, a, blur, rot = 0) {
    g.save(); g.filter = `blur(${blur}px)`; g.globalAlpha *= a; g.fillStyle = col;
    g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); g.fill(); g.restore();
  }
  function dot(g, x, y, r, col = PAL.ink) { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, r, r * 1.08, 0, 0, Math.PI * 2); g.fill(); }

  /* ---------- shapes ---------- */
  const ell = (x, y, rx, ry, rot = 0) => { const p = new Path2D(); p.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); return p; };
  // an ellipse whose rim wanders a little, so silhouettes aren't geometric
  function wob(x, y, rx, ry, rot = 0, amp = 0.06, seed = 1) {
    const Nn = makeNoise(seed + 77), p = new Path2D(), n = 72, c = Math.cos(rot), s = Math.sin(rot);
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2, k = 1 + amp * (Nn(Math.cos(a) * 1.6 + 5, Math.sin(a) * 1.6 + 5) + 0.5 * Nn(Math.cos(a) * 4 + 9, Math.sin(a) * 4));
      const px = Math.cos(a) * rx * k, py = Math.sin(a) * ry * k;
      const X = x + px * c - py * s, Y = y + px * s + py * c;
      i ? p.lineTo(X, Y) : p.moveTo(X, Y);
    }
    p.closePath(); return p;
  }
  // a soft-cornered triangle (ears)
  function tri(a, b, c, r = 0.25) {
    const p = new Path2D(), L = (u, v, t) => [u[0] + (v[0] - u[0]) * t, u[1] + (v[1] - u[1]) * t];
    const pts = [a, b, c];
    p.moveTo(...L(a, b, r));
    for (let i = 0; i < 3; i++) {
      const P = pts[i], Q = pts[(i + 1) % 3], R = pts[(i + 2) % 3];
      p.lineTo(...L(P, Q, 1 - r)); p.quadraticCurveTo(Q[0], Q[1], ...L(Q, R, r));
    }
    p.closePath(); return p;
  }
  const polyPath = (pts) => { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return p; };
  const boxOf = (cx, cy, rx, ry, pad = 0) => [cx - rx - pad, cy - ry - pad, cx + rx + pad, cy + ry + pad];
  const boxPts = (pts) => { const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };

  /* ---------- faces ---------- */
  // eyes / nose / mouth / whiskers for a head of radius R centred at (0,0)
  function face(g, R, o) {
    const sp = o.eyeSpread == null ? 0.34 : o.eyeSpread, ey = o.eyeY == null ? 0.1 : o.eyeY;
    const er = R * (o.eyeSize || 0.046), look = (o.look || 0) * R * 0.03;
    const ex = [-sp * R, sp * R];
    const ink = o.light ? "#efe6d6" : PAL.ink;
    const expr = o.expr || "calm";
    // eyes
    for (const s of [0, 1]) {
      const x = ex[s] + look, y = ey * R;
      if (expr === "happy") hairline(g, bow(x - er * 1.6, y + er * 0.4, x + er * 1.6, y + er * 0.4, er * 1.3, 8), { w: Math.max(0.9, er * 0.55), color: ink, a: 0.9, taper: false, jit: 0.1 });
      else if (expr === "sleepy") hairline(g, bow(x - er * 1.5, y, x + er * 1.5, y, -er * 0.5, 6), { w: Math.max(0.9, er * 0.5), color: ink, a: 0.9, taper: false, jit: 0.1 });
      else if (o.yellow) {
        g.fillStyle = PAL.yellow; g.beginPath(); g.ellipse(x, y, er * 1.7, er * 0.9, s ? 0.25 : -0.25, 0, Math.PI * 2); g.fill();
        g.fillStyle = "#1a120e"; g.beginPath(); g.ellipse(x + er * 0.5, y, er * 0.55, er * 0.75, 0, 0, Math.PI * 2); g.fill();
      } else {
        const big = (expr === "wow" ? 1.25 : 1) * (1 + 0.32 * (o.brow || 0));
        if (o.light) { dot(g, x, y, er * big * 1.25, "#a8743c"); dot(g, x, y, er * big * 0.7, "#140e0b"); }
        else dot(g, x, y, er * big, ink);
        if ((o.brow || 0) > 0.2) { g.fillStyle = `rgba(255,255,255,${0.8 * Math.min(1, (o.brow - 0.2) * 2)})`; g.beginPath(); g.arc(x - er * 0.35 * big, y - er * 0.4 * big, er * 0.3 * big, 0, Math.PI * 2); g.fill(); }
      }
    }
    // eyebrows: the inner end lifts with o.brow (0..1), the "puppy eyes" muscle
    if (o.brow != null) for (const s2 of [0, 1]) {
      const d = s2 ? 1 : -1, x = ex[s2], y = ey * R - er * 3.0, b = o.brow;
      hairline(g, bow(x + d * er * 2.0, y + er * 0.6, x - d * er * 1.3, y - b * er * 2.2, -er * 0.5 * d * d, 8), { w: Math.max(1, er * 0.55), color: o.light ? "rgba(239,230,214,.85)" : "rgba(35,29,26,.7)", taper: false, jit: 0.05 });
    }
    const ny = (o.noseY == null ? 0.3 : o.noseY) * R;
    if (o.dogNose) {
      // a dark rounded nose
      const nw = R * (o.noseW || 0.15);
      g.fillStyle = o.noseCol || "#2a201c";
      g.beginPath(); g.moveTo(-nw, ny - nw * 0.45); g.quadraticCurveTo(0, ny - nw * 0.8, nw, ny - nw * 0.45);
      g.quadraticCurveTo(nw * 0.9, ny + nw * 0.35, 0, ny + nw * 0.55); g.quadraticCurveTo(-nw * 0.9, ny + nw * 0.35, -nw, ny - nw * 0.45); g.fill();
      g.fillStyle = "rgba(255,255,255,0.35)"; g.beginPath(); g.ellipse(-nw * 0.35, ny - nw * 0.3, nw * 0.3, nw * 0.15, -0.2, 0, Math.PI * 2); g.fill();
      const my = ny + nw * 0.55, mw = R * 0.16;
      hairline(g, [[0, my], [0, my + R * 0.09]], { w: Math.max(0.8, R * 0.012), color: ink, a: 0.75, taper: false, jit: 0.05 });
      if (expr === "pant" || expr === "happy") {
        g.fillStyle = PAL.tongue; g.beginPath(); g.ellipse(0, my + R * 0.2, R * 0.08, R * 0.12, 0, 0, Math.PI * 2); g.fill();
        hairline(g, [[0, my + R * 0.12], [0, my + R * 0.26]], { w: Math.max(0.6, R * 0.008), color: "#a9503f", a: 0.6, taper: false, jit: 0 });
      }
      hairline(g, bow(-mw, my + R * 0.05, 0, my + R * 0.09, -R * 0.04, 8), { w: Math.max(0.8, R * 0.012), color: ink, a: 0.75, taper: false, jit: 0.05 });
      hairline(g, bow(0, my + R * 0.09, mw, my + R * 0.05, -R * 0.04, 8), { w: Math.max(0.8, R * 0.012), color: ink, a: 0.75, taper: false, jit: 0.05 });
    } else {
      // cat: tiny pink nose, small "w" or an open mouth
      const nw = R * 0.055;
      g.fillStyle = PAL.nose; g.beginPath(); g.moveTo(-nw, ny - nw * 0.6); g.lineTo(nw, ny - nw * 0.6); g.quadraticCurveTo(nw * 0.2, ny + nw * 0.9, 0, ny + nw * 0.9); g.quadraticCurveTo(-nw * 0.2, ny + nw * 0.9, -nw, ny - nw * 0.6); g.fill();
      if (expr === "wow") {
        g.fillStyle = "#2a1d1a"; g.beginPath(); g.ellipse(0, ny + R * 0.24, R * 0.1, R * 0.15, 0.05, 0, Math.PI * 2); g.fill();
        g.fillStyle = PAL.tongue; g.beginPath(); g.ellipse(-R * 0.01, ny + R * 0.33, R * 0.065, R * 0.045, 0, 0, Math.PI * 2); g.fill();
      } else {
        const mw = R * 0.07, my = ny + nw;
        hairline(g, bow(-mw, my + R * 0.03, 0, my + R * 0.01, R * 0.035, 6), { w: Math.max(0.7, R * 0.01), color: ink, a: 0.75, taper: false, jit: 0.05 });
        hairline(g, bow(0, my + R * 0.01, mw, my + R * 0.03, R * 0.035, 6), { w: Math.max(0.7, R * 0.01), color: ink, a: 0.75, taper: false, jit: 0.05 });
      }
    }
    // whiskers: long, thin, bowed, fanning out
    if (o.whiskers !== false) {
      const wc = o.light ? "rgba(240,230,214,0.9)" : "rgba(40,32,28,0.8)", n = o.dogNose ? 2 : 3;
      for (const s of [-1, 1]) for (let i = 0; i < n; i++) {
        const x0 = s * R * 0.16, y0 = ny + R * (0.02 + i * 0.05), L = R * (o.dogNose ? 0.45 : 0.8 + i * 0.08);
        const ang = (-0.18 + i * 0.2) ;
        const x1 = x0 + s * L * Math.cos(ang), y1 = y0 + L * Math.sin(ang);
        hairline(g, bow(x0, y0, x1, y1, s * R * 0.04, 12), { w: Math.max(0.5, R * 0.007), color: wc, a: 0.8, seed: i + (s > 0 ? 9 : 0) });
      }
    }
  }

  /* ---------- animals ----------
     Both are drawn around a head of radius R centred at (0,0) in sprite space.
     o.body: { ang (radians, direction the body leaves the head), len (× R), w (× R) }
     o.sit: draw a seated body under the head instead. */
  const furLen = (R, o) => (o.hair || 1) * Math.max(1.6, R * 0.088);
  function bodyParts(R, o, coatK, seed) {
    const parts = [];
    if (o.body) {
      const b = o.body, L = (b.len || 2.4) * R, W = (b.w || 1.7) * R;
      const cx = Math.cos(b.ang) * L * 0.5, cy = Math.sin(b.ang) * L * 0.5;
      parts.push({ paths: [wob(cx, cy, L * 0.62, W / 2, b.ang, 0.07, seed + 3)], box: boxOf(cx, cy, L * 0.66, L * 0.66), crown: [cx * 0.4, cy * 0.4 - R * 0.3], rad: L * 0.75, coat: b.coat || coatK, patches: o.bodyPatches, len: furLen(R, o) * 1.1, seed: seed + 1 });
    }
    if (o.sit && o.stout) {
      // a low, wide loaf on short stubby legs (corgis)
      const body = new Path2D();
      body.moveTo(-R * 0.6, R * 0.6);
      body.bezierCurveTo(-R * 1.55, R * 1.0, -R * 1.6, R * 1.9, -R * 0.75, R * 1.95);
      body.lineTo(R * 0.75, R * 1.95);
      body.bezierCurveTo(R * 1.6, R * 1.9, R * 1.55, R * 1.0, R * 0.6, R * 0.6);
      body.closePath();
      parts.push({ paths: [body], box: [-R * 1.62, R * 0.5, R * 1.62, R * 2.0], crown: [0, R * 0.85], rad: R * 1.6, coat: coatK, patches: o.bodyPatches, len: furLen(R, o), seed: seed + 2 });
      const legs = [ell(-R * 0.36, R * 1.95, R * 0.21, R * 0.2), ell(R * 0.36, R * 1.95, R * 0.21, R * 0.2)];
      parts.push({ paths: legs, box: [-R * 0.62, R * 1.7, R * 0.62, R * 2.2], crown: [0, R * 1.8], rad: R * 0.6, coat: o.legCoat || coatK, len: furLen(R, o) * 0.7, seed: seed + 3, flow: () => Math.PI / 2 });
    } else if (o.sit) {
      const p = polyPath([]);
      const body = new Path2D();
      body.moveTo(-R * 0.55, R * 0.6);
      body.bezierCurveTo(-R * 1.25, R * 1.4, -R * 1.2, R * 2.35, -R * 0.55, R * 2.45);
      body.lineTo(R * 0.55, R * 2.45);
      body.bezierCurveTo(R * 1.2, R * 2.35, R * 1.25, R * 1.4, R * 0.55, R * 0.6);
      body.closePath();
      parts.push({ paths: [body], box: [-R * 1.3, R * 0.5, R * 1.3, R * 2.5], crown: [0, R * 0.9], rad: R * 1.7, coat: coatK, patches: o.bodyPatches, len: furLen(R, o), seed: seed + 2 });
      // front legs
      const legs = [ell(-R * 0.3, R * 2.05, R * 0.2, R * 0.48), ell(R * 0.3, R * 2.05, R * 0.2, R * 0.48)];
      parts.push({ paths: legs, box: [-R * 0.55, R * 1.5, R * 0.55, R * 2.6], crown: [0, R * 1.6], rad: R, coat: o.legCoat || coatK, len: furLen(R, o) * 0.8, seed: seed + 3, flow: () => Math.PI / 2 });
      void p;
    }
    return parts;
  }

  function catParts(R, o) {
    const ck = o.coat || "cream", seed = o.seed || 11, parts = [];
    parts.push(...bodyParts(R, o, ck, seed));
    // ears behind the head
    const ear = (s) => tri([s * R * 0.98, -R * 0.15], [s * R * 0.82, -R * 1.32], [s * R * 0.12, -R * 0.74], 0.2);
    parts.push({ paths: [ear(-1), ear(1)], box: [-R * 1.1, -R * 1.4, R * 1.1, -R * 0.1], crown: [0, -R * 0.4], rad: R * 1.1, coat: o.earCoat || ck, patches: o.patches, len: furLen(R, o) * 0.8, seed: seed + 4, inner: true });
    parts.push({ paths: [wob(0, 0, R, R * 0.86, 0, 0.07, seed)], box: boxOf(0, 0, R * 1.12, R * 0.98), crown: [-R * 0.1, -R * 0.45], rad: R * 1.05, coat: ck, patches: o.patches, len: furLen(R, o), seed: seed + 5, head: true });
    return parts;
  }

  // dog breeds: ears, muzzle, coat, patches
  const BREEDS = {
    collie: { coat: "black", lightEyes: true, ears: "tip", muzzle: 0.48, patches: (x, y, R) => (Math.abs(x) < R * (0.1 + Math.max(0, y / R) * 0.5) || y > R * 0.55 ? "white" : null) },
    poodle: { coat: "apricot", ears: "puff", muzzle: 0.44, hair: 0.8, curl: 1.8 },
    shepherd: { coat: "tan", ears: "prick", earCoat: "black", muzzle: 0.56, patches: (x, y, R) => (y < -R * 0.45 && Math.abs(x) < R * 0.25 ? "black" : null) },
    golden: { coat: "gold", ears: "flop", muzzle: 0.5 },
    lab: { coat: "choc", ears: "flop", muzzle: 0.5, hair: 0.75 },
    beagle: { coat: "white", ears: "flop", earCoat: "tan", muzzle: 0.47, patches: (x, y, R) => (Math.abs(x) > R * 0.18 && y < R * 0.3 ? "tan" : null) },
    afghan: { coat: "cream", ears: "drape", muzzle: 0.62, hair: 1.5 },
    bulldog: { coat: "fawn", ears: "rose", muzzle: 0.34, flat: true, hair: 0.65, muzzleCoat: "white", patches: (x, y, R) => (y > R * 0.5 ? "white" : null) },
    basset: { coat: "white", ears: "long", earCoat: "choc", muzzle: 0.5, patches: (x, y, R) => (y < -R * 0.05 && Math.abs(x) > R * 0.12 ? "tan" : null) },
    shiba: { coat: "ginger", ears: "prick", muzzle: 0.45, muzzleCoat: "white", patches: (x, y, R) => (y > R * 0.35 ? "white" : null) },
    chow: { coat: "ginger", ears: "small", muzzle: 0.4, hair: 1.4, flat: true },
    husky: { coat: "grey", ears: "prick", muzzle: 0.5, muzzleCoat: "white", patches: (x, y, R) => (y > R * 0.1 || (Math.abs(x) < R * 0.1 && y > -R * 0.6) || (Math.abs(Math.abs(x) - R * 0.3) < R * 0.13 && Math.abs(y + R * 0.3) < R * 0.08) ? "white" : null) },
    doberman: { coat: "black", lightEyes: true, ears: "prick", muzzle: 0.6, hair: 0.6, muzzleCoat: "tan", patches: (x, y, R) => (Math.abs(Math.abs(x) - R * 0.32) < R * 0.1 && Math.abs(y + R * 0.24) < R * 0.07 ? "tan" : null) },
    sheltie: { coat: "gold", ears: "tip", muzzle: 0.5, hair: 1.2, patches: (x, y, R) => (Math.abs(x) < R * (0.08 + Math.max(0, y / R) * 0.5) || y > R * 0.6 ? "white" : null) },
    papillon: { coat: "white", ears: "big", earCoat: "choc", muzzle: 0.4, hair: 1.1, patches: (x, y, R) => (Math.abs(x) > R * 0.15 && y < R * 0.15 ? "choc" : null) },
    rottweiler: { coat: "black", lightEyes: true, ears: "rose", muzzle: 0.5, hair: 0.6, muzzleCoat: "tan", patches: (x, y, R) => (Math.abs(Math.abs(x) - R * 0.32) < R * 0.1 && Math.abs(y + R * 0.24) < R * 0.07 ? "tan" : null) },
    cattle: { coat: "grey", ears: "prick", muzzle: 0.52, hair: 0.8, patches: (x, y, R) => (Math.abs(x) > R * 0.12 && y < R * 0.1 && x < 0 ? "dark" : Math.abs(x) < R * 0.1 && y < 0 ? "white" : null) },
    shihtzu: { coat: "white", ears: "drape", earCoat: "gold", muzzle: 0.32, flat: true, hair: 1.3, patches: (x, y, R) => (Math.abs(x) > R * 0.25 && y < R * 0.2 ? "gold" : null) },
    mastiff: { coat: "fawn", ears: "rose", muzzle: 0.45, muzzleCoat: "dark", hair: 0.6, flat: true },
    peke: { coat: "apricot", ears: "drape", muzzle: 0.28, flat: true, hair: 1.4, muzzleCoat: "dark" },
    bloodhound: { coat: "tan", ears: "long", muzzle: 0.62, hair: 0.6, earCoat: "choc" },
    borzoi: { coat: "white", ears: "fold", muzzle: 0.72, hair: 1.2, patches: (x, y, R) => (x > R * 0.2 && y < R * 0.1 ? "gold" : null) },
    basenji: { coat: "ginger", ears: "prick", muzzle: 0.5, hair: 0.55, muzzleCoat: "white", patches: (x, y, R) => (Math.abs(x) < R * 0.1 && y > -R * 0.7 ? "white" : null) },
    wolf: { coat: "grey", ears: "prick", muzzle: 0.62, hair: 1.1, muzzleCoat: "cream", patches: (x, y, R) => (y > R * 0.25 || (Math.abs(Math.abs(x) - R * 0.32) < R * 0.16 && Math.abs(y + R * 0.02) < R * 0.1) ? "cream" : null) },
    mutt: { coat: "tan", ears: "tip", muzzle: 0.5 },
    // corgis: tall wide-set upright ears, a foxy face, white blaze, muzzle and chest
    corgi: { coat: "ginger", ears: "corgi", stout: true, legCoat: "white", bodyPatches: (x, y, R) => (Math.abs(x) < R * (0.62 - (y - R * 0.6) * 0.12 / R) && y < R * 1.75 ? "white" : null), muzzle: 0.5, muzzleCoat: "white", patches: (x, y, R) => (Math.abs(x) < R * (0.07 + Math.max(0, (y + R * 0.2) / R) * 0.42) && y > -R * 0.9) || y > R * 0.42 ? "white" : null },
    cardigan: { coat: "grey", ears: "corgiRound", earCoat: "dark", stout: true, legCoat: "white", bodyPatches: (x, y, R) => (Math.abs(x) < R * (0.62 - (y - R * 0.6) * 0.12 / R) && y < R * 1.75 ? "white" : Math.sin(x / (R * 0.3) + 0.7) * Math.cos(y / (R * 0.27)) > 0.55 ? "dark" : null), muzzle: 0.52, muzzleCoat: "white",
      patches: (x, y, R) => ((Math.abs(x) < R * (0.07 + Math.max(0, (y + R * 0.2) / R) * 0.42) && y > -R * 0.9) || y > R * 0.42 ? "white"
        : Math.sin(x / (R * 0.23) + 1.3) * Math.cos(y / (R * 0.19) - 0.4) + Math.sin((x + y) / (R * 0.31)) * 0.6 > 0.75 || (Math.abs(x) > R * 0.45 && y < -R * 0.15) ? "dark" : null) },
  };
  BREEDS.pembroke = BREEDS.corgi;

  function dogParts(R, o) {
    const br = BREEDS[o.breed || "mutt"] || BREEDS.mutt;
    const ck = o.coat || br.coat, seed = o.seed || 21, parts = [];
    const hair = (o.hair || 1) * (br.hair || 1), oo = Object.assign({}, o, { hair });
    if (br.stout) oo.stout = true;
    if (!oo.bodyPatches && br.bodyPatches) oo.bodyPatches = (x, y) => br.bodyPatches(x, y, R);
    if (!oo.legCoat && br.legCoat) oo.legCoat = br.legCoat;
    const L = furLen(R, oo), curl = br.curl || 0.7;
    const P = br.patches ? (x, y) => br.patches(x, y, R) : null;
    parts.push(...bodyParts(R, oo, ck, seed));
    const ec = o.earCoat || br.earCoat || ck;
    const behind = [], front = [];
    switch (br.ears) {
      case "prick": behind.push(tri([-R * 0.92, -R * 0.15], [-R * 0.62, -R * 1.3], [-R * 0.12, -R * 0.7], 0.18), tri([R * 0.92, -R * 0.15], [R * 0.62, -R * 1.3], [R * 0.12, -R * 0.7], 0.18)); break;
      case "small": behind.push(tri([-R * 0.85, -R * 0.4], [-R * 0.62, -R * 1.0], [-R * 0.25, -R * 0.75], 0.3), tri([R * 0.85, -R * 0.4], [R * 0.62, -R * 1.0], [R * 0.25, -R * 0.75], 0.3)); break;
      case "tip": behind.push(tri([-R * 0.9, -R * 0.2], [-R * 0.85, -R * 1.05], [-R * 0.25, -R * 0.75], 0.25), tri([R * 0.9, -R * 0.2], [R * 0.85, -R * 1.05], [R * 0.25, -R * 0.75], 0.25));
        front.push(ell(-R * 0.98, -R * 0.78, R * 0.2, R * 0.13, 0.7), ell(R * 0.98, -R * 0.78, R * 0.2, R * 0.13, -0.7)); break;
      // corgi ears: big, upright, set wide and high (Pembroke pointed, Cardigan rounder and larger)
      case "corgi": behind.push(tri([-R * 0.88, -R * 0.42], [-R * 1.02, -R * 1.62], [-R * 0.24, -R * 0.86], 0.2), tri([R * 0.88, -R * 0.42], [R * 1.02, -R * 1.62], [R * 0.24, -R * 0.86], 0.2)); break;
      case "corgiRound": behind.push(tri([-R * 0.92, -R * 0.4], [-R * 1.12, -R * 1.68], [-R * 0.2, -R * 0.84], 0.42), tri([R * 0.92, -R * 0.4], [R * 1.12, -R * 1.68], [R * 0.2, -R * 0.84], 0.42)); break;
      case "big": behind.push(tri([-R * 0.75, -R * 0.35], [-R * 1.45, -R * 1.25], [-R * 0.1, -R * 0.85], 0.25), tri([R * 0.75, -R * 0.35], [R * 1.45, -R * 1.25], [R * 0.1, -R * 0.85], 0.25)); break;
      case "fold": front.push(ell(-R * 0.82, -R * 0.62, R * 0.32, R * 0.14, 0.35), ell(R * 0.82, -R * 0.62, R * 0.32, R * 0.14, -0.35)); break;
      case "rose": front.push(ell(-R * 0.82, -R * 0.55, R * 0.26, R * 0.16, -0.5), ell(R * 0.82, -R * 0.55, R * 0.26, R * 0.16, 0.5)); break;
      case "flop": front.push(ell(-R * 0.9, R * 0.12, R * 0.3, R * 0.62, 0.22), ell(R * 0.9, R * 0.12, R * 0.3, R * 0.62, -0.22)); break;
      case "long": front.push(ell(-R * 0.92, R * 0.45, R * 0.3, R * 0.95, 0.12), ell(R * 0.92, R * 0.45, R * 0.3, R * 0.95, -0.12)); break;
      case "drape": front.push(ell(-R * 0.9, R * 0.75, R * 0.42, R * 1.35, 0.08), ell(R * 0.9, R * 0.75, R * 0.42, R * 1.35, -0.08)); break;
      case "puff": front.push(ell(-R * 0.95, R * 0.3, R * 0.38, R * 0.62, 0.15), ell(R * 0.95, R * 0.3, R * 0.38, R * 0.62, -0.15)); behind.push(ell(0, -R * 0.85, R * 0.62, R * 0.45)); break;
    }
    const earBox = [-R * 1.45, -R * 1.75, R * 1.45, R * 2.2];
    if (behind.length) parts.push({ paths: behind, box: earBox, crown: [0, -R * 0.9], rad: R * 1.3, coat: ec, len: L * 0.9, curl, seed: seed + 4 });
    const flat = br.flat;
    const headRy = flat ? R * 0.84 : R * 0.86;
    parts.push({ paths: [wob(0, 0, R * 0.95, headRy, 0, 0.06, seed)], box: boxOf(0, 0, R * 1.07, headRy * 1.12), crown: [-R * 0.1, -R * 0.5], rad: R * 1.05, coat: ck, patches: P, len: L, curl, seed: seed + 5, head: true });
    // muzzle: a fuzzy bump below the eyes
    const mz = br.muzzle, my = flat ? R * 0.32 : R * 0.36;
    parts.push({ paths: [ell(0, my, R * (0.3 + mz * 0.45), R * (0.22 + mz * 0.18))], box: boxOf(0, my, R * 0.7, R * 0.5), crown: [0, my - R * 0.2], rad: R * 0.6, coat: o.muzzleCoat || br.muzzleCoat || ck, patches: P, len: L * 0.7, curl, seed: seed + 6, lift: br.muzzleCoat ? 0 : 0.3 });
    if (front.length) parts.push({ paths: front, box: earBox, crown: [0, -R * 0.4], rad: R * 1.6, coat: ec, len: L * (br.ears === "drape" ? 1.5 : 1), curl: br.ears === "drape" ? 0.35 : curl, seed: seed + 7, flow: br.ears === "drape" || br.ears === "long" || br.ears === "flop" ? () => Math.PI / 2 + 0.05 : null });
    return { parts, br, my };
  }

  /* ---------- sprites ---------- */
  const cache = new Map();
  function render(kind, o) {
    const R = o.R || 60;
    const key = kind + JSON.stringify(o, (k, v) => (typeof v === "function" ? String(v) : v));
    let s = cache.get(key);
    if (s) return s;
    const ext = R * 1.75, bodyExt = o.body ? (o.body.len || 2.4) * R * 1.0 + (o.body.w || 1.7) * R * 0.6 : 0, sitExt = o.sit ? R * 2.7 : 0;
    const x0 = -ext - Math.max(0, -Math.cos(o.body ? o.body.ang : 0)) * bodyExt, x1 = ext + Math.max(0, Math.cos(o.body ? o.body.ang : 0)) * bodyExt;
    const y0 = -ext - Math.max(0, -Math.sin(o.body ? o.body.ang : 0)) * bodyExt, y1 = Math.max(ext + (kind === "dog" ? R * 0.8 : 0), sitExt) + Math.max(0, Math.sin(o.body ? o.body.ang : 0)) * bodyExt;
    const W = Math.ceil((x1 - x0) * DPR), H = Math.ceil((y1 - y0) * DPR);
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d");
    g.setTransform(DPR, 0, 0, DPR, -x0 * DPR, -y0 * DPR);
    probe.setTransform(1, 0, 0, 1, 0, 0);
    s = { ox: -x0, oy: -y0, R };
    if (kind === "cat") {
      const parts = catParts(R, o);
      for (const p of parts) {
        if (p.head) {
          fur(g, Object.assign({}, p, { curl: o.curl == null ? 0.75 : o.curl })); flush(g);
          // blush under a light veil of hair
          if (!o.noBlush) for (const s2 of [-1, 1]) soft(g, s2 * R * 0.5, R * 0.28, R * 0.13, R * 0.08, PAL.blush, o.coat === "dark" || o.coat === "black" ? 0.15 : 0.55, R * 0.04);
        } else if (p.inner) {
          fur(g, Object.assign({}, p, { curl: 0.6 })); flush(g);
          if (!o.noBlush) for (const s2 of [-1, 1]) soft(g, s2 * R * 0.66, -R * 0.72, R * 0.13, R * 0.24, PAL.blush, o.coat === "dark" || o.coat === "black" ? 0.12 : 0.7, R * 0.05, s2 * -0.45);
        } else fur(g, p);
      }
      s.face = Object.assign({ light: o.coat === "dark" || o.coat === "black" }, o.face || {});
    } else {
      const { parts, my } = dogParts(R, o);
      for (const p of parts) fur(g, p);
      const bb = BREEDS[o.breed] || {}, lightFace = bb.lightEyes || ((o.coat || bb.coat) === "black" && !bb.patches);
      s.face = Object.assign({ dogNose: true, noseY: my / R - 0.08, eyeY: -0.08, eyeSpread: 0.32, whiskers: false, light: lightFace, noseCol: lightFace ? "#120d0b" : undefined }, o.face || {});
    }
    flush(g);
    if (!o.liveFace) face(g, R, s.face);
    Object.assign(s, { c, w: W / DPR, h: H / DPR });
    cache.set(key, s);
    return s;
  }
  const cat = (o) => render("cat", o);
  const dog = (o) => render("dog", o);

  // draw a sprite with its head centre at (x, y), rotated and scaled
  function put(g, s, x, y, o = {}) {
    if (!s) return;
    const a = o.a == null ? 1 : o.a, sc = o.scale || 1;
    if (a <= 0) return;
    flush(s.c.getContext("2d"));
    g.save(); g.globalAlpha *= a; g.translate(x, y); if (o.rot) g.rotate(o.rot); if (o.flip) g.scale(-1, 1);
    g.drawImage(s.c, -s.ox * sc, -s.oy * sc, s.w * sc, s.h * sc);
    if (o.face) { g.scale(sc, sc); face(g, s.R, Object.assign({}, s.face, o.face)); }
    g.restore();
  }

  // a felt ball (data mark)
  function pom(r, ck = "cream", seed = 5) {
    const key = "pom" + r + ck + seed;
    let s = cache.get(key); if (s) return s;
    const ext = r * 1.6, W = Math.ceil(ext * 2 * DPR), c = document.createElement("canvas"); c.width = c.height = W;
    const g = c.getContext("2d"); g.setTransform(DPR, 0, 0, DPR, ext * DPR, ext * DPR); probe.setTransform(1, 0, 0, 1, 0, 0);
    fur(g, { paths: [ell(0, 0, r, r)], box: boxOf(0, 0, r, r), crown: [-r * 0.3, -r * 0.4], rad: r * 1.2, coat: ck, len: Math.min(r < 30 ? 99 : 7, Math.max(1.4, r * 0.28)), dens: 0.6, seed }); flush(g);
    s = { c, ox: ext, oy: ext, w: W / DPR, h: W / DPR, R: r }; cache.set(key, s); return s;
  }

  // a strand of wool along a polyline, revealed to k (0..1); cached by key when given
  function yarn(g, pts, o = {}) {
    if (pts.length < 2) return;
    const ck = coat(o.coat || "ink"), w = o.w || 3, k = o.k == null ? 1 : o.k, rnd = mulberry32(o.seed || 9);
    const rs = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i], d = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(d / 1.5));
      for (let j = 1; j <= n; j++) rs.push([ax + (bx - ax) * j / n, ay + (by - ay) * j / n]);
    }
    const n = Math.floor(rs.length * k);
    if (n < 2) return;
    g.save(); g.lineCap = "round"; g.lineJoin = "round";
    g.strokeStyle = css(ck.base, 0.9); g.lineWidth = w * 0.7; g.beginPath(); rs.slice(0, n).forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
    const paths = [new Path2D(), new Path2D(), new Path2D()];
    for (let i = 0; i < n; i++) for (let r = 0; r < 2; r++) {
      const [x, y] = rs[i], a = rnd() * Math.PI * 2, L = w * (0.6 + rnd() * 1.1), ox = (rnd() - 0.5) * w * 0.7, oy = (rnd() - 0.5) * w * 0.7;
      const p = paths[(rnd() * 3) | 0];
      p.moveTo(x + ox, y + oy); p.quadraticCurveTo(x + ox + Math.cos(a + 1) * L * 0.6, y + oy + Math.sin(a + 1) * L * 0.6, x + ox + Math.cos(a) * L, y + oy + Math.sin(a) * L);
    }
    [ck.light, ck.base, ck.dark].forEach((c, i) => { g.strokeStyle = css(c, 0.8); g.lineWidth = Math.max(0.5, w * 0.16); g.stroke(paths[i]); });
    g.restore();
  }

  // a generic fuzzy blob (any path): props, bowls, balls, cushions
  function blob(paths, box, ck, o = {}) {
    const key = "blob" + (o.key || Math.random());
    let s = o.key && cache.get(key); if (s) return s;
    const pad = (o.len || 4) * 3, x0 = box[0] - pad, y0 = box[1] - pad, x1 = box[2] + pad, y1 = box[3] + pad;
    const c = document.createElement("canvas"); c.width = Math.ceil((x1 - x0) * DPR); c.height = Math.ceil((y1 - y0) * DPR);
    const g = c.getContext("2d"); g.setTransform(DPR, 0, 0, DPR, -x0 * DPR, -y0 * DPR); probe.setTransform(1, 0, 0, 1, 0, 0);
    fur(g, Object.assign({ paths, box, coat: ck }, o)); flush(g);
    if (o.after) o.after(g);
    s = { c, ox: -x0, oy: -y0, w: c.width / DPR, h: c.height / DPR };
    if (o.key) cache.set(key, s);
    return s;
  }

  // canvas sized to its box at DPR; returns {c, g, w, h}
  function fit(c) {
    const r = c.getBoundingClientRect(), w = Math.max(1, r.width), h = Math.max(1, r.height);
    if (c.width !== Math.round(w * DPR) || c.height !== Math.round(h * DPR)) { c.width = Math.round(w * DPR); c.height = Math.round(h * DPR); }
    const g = c.getContext("2d"); g.setTransform(DPR, 0, 0, DPR, 0, 0);
    return { c, g, w, h };
  }
  const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  function label(g, text, x, y, o = {}) {
    g.save(); g.font = `${o.weight || 400} ${o.size || 11}px ${o.family || "'IBM Plex Mono', monospace"}`;
    g.fillStyle = o.color || PAL.ink; g.globalAlpha *= o.a == null ? 1 : o.a; g.textAlign = o.align || "left"; g.textBaseline = o.base || "middle";
    g.fillText(text, x, y); g.restore();
  }

  root.Fuzz = { DPR, COATS, PAL, BREEDS, mulberry32, makeNoise, hex, mix, css, fur, flush, hairline, bow, soft, dot, ell, wob, tri, coat, polyPath, boxOf, boxPts, face, cat, dog, put, pom, yarn, blob, fit, ease, clamp, seg, label };
})(window);
