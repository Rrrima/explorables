/* Pen: hand-inked strokes for canvas.
   A stroke is resampled along its length and filled as a ribbon whose width
   varies with "pressure" (slow noise), swells where the nib lands, thins as it
   lifts, and drops out in places like a drying nib. Ink is drawn with
   multiply, so crossings darken; a grain mask adds paper tooth. */
(function () {
  "use strict";
  const P = window.Paper;
  const N = P.makeNoise(23);
  const lerp = (a, b, t) => a + (b - a) * t;

  function resample(pts, step) {
    const out = [pts[0]];
    let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      const d = Math.hypot(x1 - x0, y1 - y0);
      if (!d) continue;
      let t = (step - acc) / d;
      while (t <= 1) { out.push([lerp(x0, x1, t), lerp(y0, y1, t)]); t += step / d; }
      acc = (acc + d) % step;
    }
    const last = pts[pts.length - 1];
    if (out.length < 2 || out[out.length - 1][0] !== last[0] || out[out.length - 1][1] !== last[1]) out.push(last);
    return out;
  }

  /* Draw an inked line.
     g: 2D context (already transformed)
     pts: polyline; o: { w, k (reveal 0..1), seed, a, jit, boil, color, dry } */
  function ink(g, pts, o = {}) {
    if (!pts || pts.length < 2) return;
    const k = o.k == null ? 1 : o.k;
    if (k <= 0) return;
    const w = o.w || 1.7;
    const seed = o.seed || 0;
    const jit = o.jit == null ? 0.6 : o.jit;
    const boil = o.boil || 0;
    const dry = o.dry == null ? 0.25 : o.dry;
    const rs = resample(pts, 1.6);
    const n = Math.max(2, Math.floor(rs.length * k));
    // wobble: low-frequency drift along the line, changes slightly with boil
    const P2 = rs.slice(0, n).map(([x, y], i) => {
      const s = i * 0.04 + seed * 3.1;
      return [x + N.noise(s, boil * 0.7) * jit, y + N.noise(s + 40, boil * 0.7 + 7) * jit];
    });
    const L = [], R = [], A = [];
    for (let i = 0; i < P2.length; i++) {
      const a = P2[Math.max(0, i - 1)], b = P2[Math.min(P2.length - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1];
      const tl = Math.hypot(tx, ty) || 1;
      tx /= tl; ty /= tl;
      const u = P2.length > 1 ? i / (P2.length - 1) : 0;
      // pressure: slow variation, a blob where the nib lands, thinning at the lift
      const pressure = 0.78 + 0.32 * N.noise(i * 0.035 + seed * 7.7, 3.3);
      const land = 1 + 0.35 * Math.exp(-i / 3);
      const lift = 0.55 + 0.45 * Math.min(1, (P2.length - 1 - i) / 8);
      const ww = (w * pressure * land * lift) / 2;
      // ragged edges: each side wanders independently, like ink catching paper fibres
      const eL = 1 + 0.38 * N.noise(i * 0.55 + seed * 2.3, 17.1) + 0.18 * N.noise(i * 1.7 + seed, 3.9);
      const eR = 1 + 0.38 * N.noise(i * 0.55 + seed * 2.3, 29.7) + 0.18 * N.noise(i * 1.7 + seed, 8.2);
      L.push([P2[i][0] - ty * ww * eL, P2[i][1] + tx * ww * eL]);
      R.push([P2[i][0] + ty * ww * eR, P2[i][1] - tx * ww * eR]);
      // ink density along the line: occasional dry skips
      const d = N.noise(i * 0.09 + seed * 5.3, 9.1);
      A.push(d < -0.45 + (1 - dry) * -0.3 ? 0.35 : 1);
    }
    g.fillStyle = o.color || g.__ink || "rgb(26,25,28)";
    const baseA = o.a == null ? 0.92 : o.a;
    const ga = g.__alpha == null ? 1 : g.__alpha;
    // bleed: ink wicks a little into the paper around the line
    if (o.bleed !== false) {
      g.globalAlpha = baseA * 0.16 * ga;
      g.beginPath();
      for (let i = 0; i < P2.length; i++) {
        const [cx, cy] = P2[i], [lx, ly] = L[i];
        const ex = cx + (lx - cx) * 1.9, ey = cy + (ly - cy) * 1.9;
        i ? g.lineTo(ex, ey) : g.moveTo(ex, ey);
      }
      for (let i = P2.length - 1; i >= 0; i--) {
        const [cx, cy] = P2[i], [rx, ry] = R[i];
        g.lineTo(cx + (rx - cx) * 1.9, cy + (ry - cy) * 1.9);
      }
      g.closePath(); g.fill();
    }
    // fill in short runs so density can vary along the stroke
    let start = 0;
    for (let i = 1; i <= L.length; i++) {
      if (i === L.length || A[i] !== A[start]) {
        const s0 = Math.max(0, start - 1), e = Math.min(L.length - 1, i);
        g.globalAlpha = baseA * A[start] * (g.__alpha == null ? 1 : g.__alpha);
        g.beginPath();
        g.moveTo(L[s0][0], L[s0][1]);
        for (let j = s0 + 1; j <= e; j++) g.lineTo(L[j][0], L[j][1]);
        for (let j = e; j >= s0; j--) g.lineTo(R[j][0], R[j][1]);
        g.closePath();
        g.fill();
        start = i;
      }
    }
    // round caps
    g.globalAlpha = baseA * (g.__alpha == null ? 1 : g.__alpha);
    const c0 = P2[0], c1 = P2[P2.length - 1];
    g.beginPath(); g.arc(c0[0], c0[1], w * 0.62, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(c1[0], c1[1], w * 0.3, 0, Math.PI * 2); g.fill();
    g.globalAlpha = g.__alpha == null ? 1 : g.__alpha;
  }

  /* Grain: per-pixel tooth + soft blotches, as an alpha mask tile.
     Values spread across 0.35..1 so the texture is actually visible. */
  function grainTile(size = 192, seed = 41) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d"), im = g.createImageData(size, size);
    const Nt = P.makeNoise(seed), rnd = P.mulberry32(seed);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      const blot = Nt.fbm(u * 3, v * 3, 3, 3);            // soft density patches
      const tooth = Nt.fbm(u * 24, v * 24, 2, 24);        // paper tooth
      const speck = rnd();                                // pixel grain
      let a = 0.74 + 0.45 * blot + 0.9 * tooth - (speck < 0.1 ? 0.35 : 0) - speck * 0.12;
      a = Math.max(0.22, Math.min(1, a));
      const j = (y * size + x) * 4;
      im.data[j] = im.data[j + 1] = im.data[j + 2] = 0;
      im.data[j + 3] = Math.round(255 * a);
    }
    g.putImageData(im, 0, 0);
    return c;
  }

  // Ink as a pattern: dark pigment whose alpha carries the grain
  function inkPattern(g, rgb = [26, 25, 28], scale = 0.5) {
    const t = grainTile(192, 41), c = document.createElement("canvas");
    c.width = c.height = t.width;
    const x = c.getContext("2d");
    x.fillStyle = `rgb(${rgb.join(",")})`; x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = "destination-in"; x.drawImage(t, 0, 0);
    const pat = g.createPattern(c, "repeat");
    if (pat.setTransform) pat.setTransform(new DOMMatrix().scale(scale));
    return pat;
  }

  window.Pen = { ink, grainTile, resample, inkPattern };
})();
