/* Crayon: black wax on white paper. Everything is filled or stroked with a grainy
   pattern (streaky, with paper showing through), lines are laid down twice a hair
   apart, and office workers are little block-headed figures whose trousers get
   darker the more competent they are. Figures are cached as sprites. */
(function (root) {
  "use strict";
  const DPR = Math.min(2, root.devicePixelRatio || 1);
  const INK = [24, 22, 20], RED = [214, 64, 38];

  // wax texture: vertical streaks plus fine tooth, alpha only, tinted per colour
  function texture(rgb, seed = 3) {
    const S = 256, c = document.createElement("canvas"); c.width = c.height = S;
    const g = c.getContext("2d"), d = g.createImageData(S, S);
    let s = seed; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const grid = new Float32Array(65 * 65).map(() => rnd());
    const vn = (x, y) => { const xi = Math.floor(x) & 63, yi = Math.floor(y) & 63, xf = x - Math.floor(x), yf = y - Math.floor(y), a = grid[yi * 65 + xi], b = grid[yi * 65 + xi + 1], c2 = grid[(yi + 1) * 65 + xi], e = grid[(yi + 1) * 65 + xi + 1], u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); return a + (b - a) * u + (c2 - a) * v + (a - b - c2 + e) * u * v; };
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const n = vn(x / 1.6, y / 9) * 0.55 + vn(x / 5, y / 5) * 0.2 + rnd() * 0.35;
      const a = n > 0.27 ? Math.min(1, (n - 0.27) * 3.4) : 0, i = (y * S + x) * 4;
      d.data[i] = rgb[0]; d.data[i + 1] = rgb[1]; d.data[i + 2] = rgb[2]; d.data[i + 3] = a * 255;
    }
    g.putImageData(d, 0, 0);
    return c;
  }
  const TEX = { ink: null, red: null };
  const tex = (col) => (TEX[col] || (TEX[col] = texture(col === "red" ? RED : INK, col === "red" ? 11 : 3)));
  const paint = (g, col) => { const p = g.createPattern(tex(col), "repeat"); p.setTransform && p.setTransform(new DOMMatrix().scale(1 / DPR)); return p; };

  // a crayon stroke: the path drawn twice, slightly offset, in textured wax
  function line(g, pts, w = 2, col = "ink", a = 1) {
    if (pts.length < 2) return;
    g.save(); g.globalAlpha *= a; g.strokeStyle = paint(g, col); g.lineCap = "round"; g.lineJoin = "round";
    for (let pass = 0; pass < 2; pass++) {
      const o = pass ? 0.45 : -0.3;
      g.lineWidth = w * (pass ? 0.8 : 1);
      g.beginPath();
      pts.forEach(([x, y], i) => { const j = Math.sin((x + y) * 0.9 + pass * 2) * 0.35; i ? g.lineTo(x + o + j, y - o) : g.moveTo(x + o, y - o + j); });
      g.stroke();
    }
    g.restore();
  }
  function fill(g, pts, col = "ink", a = 1) {
    g.save(); g.globalAlpha *= a; g.fillStyle = paint(g, col); g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill();
    g.globalAlpha *= 0.6; g.fill(); g.restore();
  }
  // a scribbled shadow under something standing
  function shadow(g, x, y, w, a = 0.7) {
    for (let i = 0; i < 3; i++) line(g, [[x - w * (0.5 - i * 0.06), y + i * 1.1], [x + w * (0.5 - i * 0.04), y + i * 1.1 + 0.4]], Math.max(1, w * 0.08), "ink", a * (1 - i * 0.25));
  }

  /* ---------- the office worker ---------- */
  // points along a quadratic curve, for loose hand-drawn contours
  const curve = (p0, p1, p2, n = 8) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, u = 1 - t; return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]; });
  // drawn standing on (0, 0), h tall, facing right. shade 0..1 fills the trousers; poses: stand, walk, cheer, slump
  function person(g, h, shade, pose = "stand", col = "ink") {
    const lw = Math.max(1, h * 0.04);
    const walk = pose === "walk", slump = pose === "slump", lean = slump ? h * 0.05 : h * 0.015;
    shadow(g, h * 0.02, 0, h * 0.45, 0.6);
    g.save(); g.scale(0.74, 1);                         // slim them down
    // trousers: a heavy block, split low, the darker the more competent
    const wy = -h * 0.47, st = walk ? h * 0.09 : 0;
    const pants = [[-h * 0.13, wy], [h * 0.14, wy + h * 0.01], ...curve([h * 0.15, wy + h * 0.02], [h * 0.19 + st, -h * 0.2], [h * 0.17 + st, -1], 5), [h * 0.03, -1], [h * 0.012, -h * 0.13], [-h * 0.012, -1], ...curve([-h * 0.15 - st * 0.6, -1], [-h * 0.18 - st * 0.6, -h * 0.22], [-h * 0.13, wy + h * 0.02], 5)];
    if (shade > 0.02) fill(g, pants, col, 0.1 + 0.9 * shade);
    line(g, [...pants, pants[0]], lw * 0.85, col, 0.85);
    line(g, [[h * 0.012, -h * 0.13], [h * 0.015, -h * 0.02]], lw * 0.6, col, 0.6);
    // torso: two loose contours, a little slouched
    const sy = -h * 0.79;
    line(g, curve([-h * 0.07 + lean, sy], [-h * 0.19 + lean, -h * 0.66], [-h * 0.13, wy]), lw, col);
    line(g, curve([h * 0.08 + lean, sy + h * 0.01], [h * 0.17 + lean, -h * 0.63], [h * 0.14, wy]), lw, col);
    line(g, [[-h * 0.13, wy], [h * 0.14, wy + h * 0.01]], lw * 0.9, col);
    // arms: hanging, bent a touch; cheering ones go up
    if (pose === "cheer") {
      line(g, curve([-h * 0.12, sy + h * 0.05], [-h * 0.24, -h * 0.85], [-h * 0.26, -h * 0.98]), lw, col);
      line(g, curve([h * 0.13, sy + h * 0.05], [h * 0.25, -h * 0.85], [h * 0.27, -h * 0.98]), lw, col);
    } else {
      const sw = walk ? h * 0.06 : 0;
      line(g, curve([-h * 0.13 + lean, sy + h * 0.06], [-h * 0.22 - sw, -h * 0.6], [-h * 0.19 - sw, -h * 0.44]), lw, col);
      line(g, curve([h * 0.15 + lean, sy + h * 0.06], [h * 0.24 + sw, -h * 0.58], [h * 0.2 + sw, -h * 0.43]), lw, col);
      fill(g, [[-h * 0.21 - sw, -h * 0.45], [-h * 0.17 - sw, -h * 0.45], [-h * 0.18 - sw, -h * 0.4], [-h * 0.215 - sw, -h * 0.41]], col, 0.9);
      fill(g, [[h * 0.18 + sw, -h * 0.44], [h * 0.22 + sw, -h * 0.44], [h * 0.215 + sw, -h * 0.39], [h * 0.18 + sw, -h * 0.4]], col, 0.9);
    }
    // a block head, tipped forward, hair dark on top and back
    const hs = h * 0.15, hx = lean * 1.6 + h * 0.01, hy = sy - hs * 0.72 + (slump ? h * 0.03 : 0), tilt = slump ? 0.25 : 0.06;
    const R = (x, y) => [hx + x * Math.cos(tilt) - y * Math.sin(tilt), hy + x * Math.sin(tilt) + y * Math.cos(tilt)];
    const head = [R(-0.5 * hs, -0.55 * hs), R(0.48 * hs, -0.58 * hs), R(0.52 * hs, 0.48 * hs), R(-0.46 * hs, 0.5 * hs)];
    // hair: the top and the back of the head; the face is just an open outline
    fill(g, [head[0], head[1], R(0.46 * hs, -0.22 * hs), R(-0.05 * hs, -0.18 * hs), R(-0.08 * hs, 0.42 * hs), head[3]], col, 0.95);
    line(g, [head[1], head[2], head[3]], lw * 0.9, col);
    line(g, [R(0.2 * hs, 0.05 * hs), R(0.24 * hs, 0.08 * hs)], lw * 0.9, col);   // an eye
    line(g, [R(-0.05 * hs, 0.5 * hs), [hx - h * 0.005, sy]], lw * 0.7, col, 0.8);
    g.restore();
  }
  const sprites = new Map();
  function sprite(h, shade, pose = "stand", col = "ink") {
    const sb = Math.round(shade * 10), hb = Math.round(h * 2) / 2, key = `${hb}|${sb}|${pose}|${col}`;
    let s = sprites.get(key);
    if (s) return s;
    const W = Math.ceil(hb * 1.1 * DPR), H = Math.ceil(hb * 1.25 * DPR), c = document.createElement("canvas");
    c.width = W; c.height = H;
    const g = c.getContext("2d"); g.setTransform(DPR, 0, 0, DPR, (W / 2), H - hb * 0.08 * DPR);
    person(g, hb, sb / 10, pose, col);
    s = { c, w: W / DPR, h: H / DPR, ox: W / 2 / DPR, oy: (H - hb * 0.08 * DPR) / DPR };
    sprites.set(key, s);
    return s;
  }
  // draw a cached figure standing at (x, y)
  function figure(g, x, y, h, shade, pose = "stand", a = 1, col = "ink", flip = false) {
    if (!(h >= 0.5) || a <= 0) return;   // too small to draw (e.g. popping in from zero): a 0-px sprite would throw
    const s = sprite(h, shade, pose, col);
    g.save(); g.globalAlpha *= a; g.translate(x, y); if (flip) g.scale(-1, 1);
    g.drawImage(s.c, -s.ox, -s.oy, s.w, s.h); g.restore();
  }
  // an empty desk: a dashed outline of where someone should stand
  function vacancy(g, x, y, h, a = 0.5) {
    g.save(); g.setLineDash([2, 3]); g.globalAlpha *= a; g.strokeStyle = "#1a1816"; g.lineWidth = 1;
    g.strokeRect(x - h * 0.2, y - h * 0.95, h * 0.4, h * 0.95); g.restore();
  }
  // a dropped box, splayed on the floor (the fired leave with theirs)
  function box(g, x, y, s, a = 1) {
    g.save(); g.globalAlpha *= a; g.translate(x, y); g.rotate(-0.42);
    const p = [[-s * 0.5, 0], [s * 0.5, -s * 0.05], [s * 0.55, -s * 0.85], [-s * 0.45, -s * 0.8]];
    line(g, [...p, p[0]], Math.max(1, s * 0.07));
    for (let i = 1; i <= 3; i++) line(g, [[-s * 0.3, -s * (0.2 + i * 0.15)], [s * 0.3, -s * (0.22 + i * 0.15)]], Math.max(1, s * 0.06));
    g.restore();
    fill(g, [[x - s * 0.7, y + 1], [x - s * 0.2, y - s * 0.12], [x + s * 0.1, y + 2], [x + s * 0.7, y - 1], [x + s * 0.2, y + s * 0.15]], "ink", a * 0.85);
  }
  // little action marks: surprise ticks above a head, or sweat drops
  function marks(g, x, y, s, kind = "surprise", a = 1, col = "ink") {
    if (kind === "surprise") [[-0.9, -0.2, -0.4, -0.5], [-0.25, -0.75, -0.15, -1.3], [0.4, -0.6, 0.75, -1.0]].forEach(([x1, y1, x2, y2]) => line(g, [[x + x1 * s, y + y1 * s], [x + x2 * s, y + y2 * s]], Math.max(1, s * 0.12), col, a));
    else [[0.2, -0.6], [0.65, -0.45]].forEach(([dx, dy]) => { line(g, [[x + dx * s, y + dy * s - s * 0.18], [x + dx * s + s * 0.08, y + dy * s], [x + dx * s - s * 0.06, y + dy * s + s * 0.05], [x + dx * s, y + dy * s - s * 0.18]], Math.max(1, s * 0.09), col, a); });
  }
  root.Crayon = { DPR, line, fill, shadow, person, figure, vacancy, box, marks, paint, tex };
})(window);
