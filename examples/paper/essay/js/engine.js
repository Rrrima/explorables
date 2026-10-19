/* Paper engine: procedural noise, paper height fields, raking-light shading,
   ink diffusion, and small scroll helpers. No dependencies. */
(function () {
  "use strict";

  /* ---------- Seeded random ---------- */
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

  /* ---------- Gradient noise (Perlin 2002 "improved noise", 2D) ---------- */
  function makeNoise(seed) {
    const rnd = mulberry32(seed);
    const p = new Uint8Array(512);
    const perm = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
    const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
    const grad = (h, x, y) => {
      switch (h & 7) {
        case 0: return x + y; case 1: return -x + y;
        case 2: return x - y; case 3: return -x - y;
        case 4: return x; case 5: return -x;
        case 6: return y; default: return -y;
      }
    };
    // Periodic variant: wraps every `per` units so tiles are seamless
    function noise(x, y, per) {
      let X = Math.floor(x), Y = Math.floor(y);
      x -= X; y -= Y;
      const u = fade(x), v = fade(y);
      const pw = per || 256;
      const X0 = ((X % pw) + pw) % pw, Y0 = ((Y % pw) + pw) % pw;
      const X1 = (X0 + 1) % pw, Y1 = (Y0 + 1) % pw;
      const aa = p[p[X0 & 255] + (Y0 & 255)], ab = p[p[X0 & 255] + (Y1 & 255)];
      const ba = p[p[X1 & 255] + (Y0 & 255)], bb = p[p[X1 & 255] + (Y1 & 255)];
      const x1 = grad(aa, x, y) + u * (grad(ba, x - 1, y) - grad(aa, x, y));
      const x2 = grad(ab, x, y - 1) + u * (grad(bb, x - 1, y - 1) - grad(ab, x, y - 1));
      return x1 + v * (x2 - x1); // roughly -1..1
    }
    // Fractal Brownian motion: sum octaves, frequency x lacunarity, amplitude x gain
    function fbm(x, y, octaves, per, lacunarity = 2, gain = 0.5) {
      let sum = 0, amp = 0.5, freq = 1, norm = 0;
      for (let o = 0; o < octaves; o++) {
        sum += amp * noise(x * freq, y * freq, per ? per * freq : 0);
        norm += amp;
        amp *= gain;
        freq *= lacunarity;
      }
      return sum / norm;
    }
    return { noise, fbm };
  }

  /* ---------- Paper height field ----------
     Layers, each optional:
       formation  low-frequency fbm: the cloudy "look-through" of fibre flocs
       grain      high-frequency fbm: surface tooth
       fibres     random curved strokes with a length distribution
       laid       periodic laid lines + chain lines (mould wires)
       tooth      large rounded bumps (cold-press watercolour, felt marks)
     Returns Float32Array heights in 0..1 plus a fibre-coverage map. */
  function paperHeight(size, o) {
    const N = makeNoise(o.seed || 1);
    const H = new Float32Array(size * size);
    const per = o.tile ? 1 : 0;
    const fs = o.formationScale || 4, gs = o.grainScale || 48, ts = o.toothScale || 14;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / size, v = y / size;
        let h = 0.5;
        if (o.formation) h += o.formation * N.fbm(u * fs, v * fs, 4, per ? fs : 0);
        if (o.grain) h += o.grain * N.fbm(u * gs + 31.7, v * gs + 11.3, 3, per ? gs : 0);
        if (o.tooth) {
          // Rounded bumps: ridged noise, squared, gives the "cold press" pebble look
          const t = 1 - Math.abs(N.noise(u * ts + 5.1, v * ts + 9.7, per ? ts : 0));
          h += o.tooth * (t * t - 0.5);
        }
        if (o.laid) {
          const lw = o.laidLines || 90;                 // laid lines across the tile
          h += o.laid * 0.5 * Math.sin(v * lw * Math.PI * 2);
          const cw = o.chainLines || 4;                 // chain lines across the tile
          const d = Math.abs(((u * cw) % 1) - 0.5);
          h += o.laid * 1.4 * Math.max(0, 0.03 - Math.abs(d - 0.47)) * 33;
        }
        H[y * size + x] = h;
      }
    }
    const cover = new Float32Array(size * size);
    if (o.fibres) {
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const g = c.getContext("2d");
      const rnd = mulberry32((o.seed || 1) * 7 + 3);
      g.lineCap = "round";
      const count = o.fibres;
      const mean = o.fibreLen || 0.08;           // as a fraction of tile width
      for (let i = 0; i < count; i++) {
        // log-normal-ish length distribution
        const len = mean * Math.exp((rnd() + rnd() + rnd() - 1.5) * 0.7) * size;
        let x = rnd() * size, y = rnd() * size;
        let a = rnd() * Math.PI * 2;
        if (o.grainDir != null) a = o.grainDir + (rnd() - 0.5) * (o.grainSpread || 1.2);
        const steps = Math.max(3, Math.round(len / 4));
        const w = (o.fibreWidth || 0.9) * (0.6 + rnd() * 0.8);
        g.lineWidth = w;
        g.strokeStyle = `rgba(255,255,255,${0.10 + rnd() * 0.22})`;
        for (let ox = -size; ox <= size; ox += size) {
          for (let oy = -size; oy <= size; oy += size) {
            if (!o.tile && (ox || oy)) continue;
            g.beginPath();
            let px = x + ox, py = y + oy, aa = a;
            g.moveTo(px, py);
            for (let s = 0; s < steps; s++) {
              aa += (rnd() - 0.5) * 0.35;
              px += Math.cos(aa) * (len / steps);
              py += Math.sin(aa) * (len / steps);
              g.lineTo(px, py);
            }
            g.stroke();
          }
        }
      }
      const d = g.getImageData(0, 0, size, size).data;
      for (let i = 0; i < size * size; i++) cover[i] = d[i * 4] / 255;
      blur(cover, size, 1);
      for (let i = 0; i < size * size; i++) H[i] += (o.fibreHeight || 0.18) * cover[i];
    }
    blur(H, size, o.soften == null ? 1 : o.soften);
    return { H, cover, size };
  }

  // Separable box blur with wrap-around, `passes` times (approximates Gaussian)
  function blur(A, size, passes) {
    const T = new Float32Array(A.length);
    for (let p = 0; p < passes; p++) {
      for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++) {
          const r = y * size;
          T[r + x] = (A[r + ((x + size - 1) % size)] + A[r + x] + A[r + ((x + 1) % size)]) / 3;
        }
      for (let y = 0; y < size; y++)
        for (let x = 0; x < size; x++)
          A[y * size + x] = (T[((y + size - 1) % size) * size + x] + T[y * size + x] + T[((y + 1) % size) * size + x]) / 3;
    }
  }

  /* ---------- Shade a height field under a directional light ----------
     Normals by central differences, Lambert term N·L. A low elevation
     ("raking light") exaggerates relief, as in conservation photography. */
  function shade(field, o, target) {
    const { H, cover, size } = field;
    const out = target || new ImageData(size, size);
    const d = out.data;
    const az = o.azimuth == null ? -2.2 : o.azimuth;
    const el = o.elevation == null ? 0.9 : o.elevation;
    const L = [Math.cos(az) * Math.cos(el), Math.sin(az) * Math.cos(el), Math.sin(el)];
    const k = o.relief == null ? 6 : o.relief;
    const base = o.color || [246, 243, 236];
    const fibreTint = o.fibreTint || [0, 0, 0];
    const trans = o.translucency || 0;   // brightens thin areas (washi look-through)
    const wrap = (i) => (i + size) % size;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = y * size + x;
        const dx = (H[y * size + wrap(x + 1)] - H[y * size + wrap(x - 1)]) * k;
        const dy = (H[wrap(y + 1) * size + x] - H[wrap(y - 1) * size + x]) * k;
        const inv = 1 / Math.hypot(dx, dy, 1);
        const nx = -dx * inv, ny = -dy * inv, nz = inv;
        let lam = nx * L[0] + ny * L[1] + nz * L[2];
        lam = Math.max(0, lam) / L[2];          // normalised so flat paper = 1
        const amb = o.ambient == null ? 0.35 : o.ambient;
        let s = amb + (1 - amb) * lam;
        // formation: thicker regions slightly darker in look-through
        s *= 1 + trans * (0.5 - H[i]);
        const f = cover ? cover[i] : 0;
        const j = i * 4;
        d[j] = Math.min(255, base[0] * s + fibreTint[0] * f);
        d[j + 1] = Math.min(255, base[1] * s + fibreTint[1] * f);
        d[j + 2] = Math.min(255, base[2] * s + fibreTint[2] * f);
        d[j + 3] = 255;
      }
    }
    return out;
  }

  function toCanvas(img, canvas) {
    const c = canvas || document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    c.getContext("2d").putImageData(img, 0, 0);
    return c;
  }

  /* ---------- Ink diffusion on a fibre network ----------
     A small lattice: each cell holds water w and pigment p. Water spreads to
     neighbours in proportion to a conductivity map (higher along fibres);
     sizing lowers absorbency, so ink stays where it lands. Pigment rides
     with the water and is deposited as it slows, darkening the edges. */
  function inkSim(cols, rows, conductivity, opts) {
    const n = cols * rows;
    const w = new Float32Array(n), p = new Float32Array(n), dep = new Float32Array(n);
    const nw = new Float32Array(n), np = new Float32Array(n);
    const sizing = opts.sizing;               // 0 = waterleaf (bleeds), 1 = hard sized
    const rate = 0.34 * (1 - 0.94 * sizing);
    function drop(cx, cy, r, amount) {
      for (let y = Math.max(0, cy - r); y < Math.min(rows, cy + r + 1); y++)
        for (let x = Math.max(0, cx - r); x < Math.min(cols, cx + r + 1); x++) {
          const dd = Math.hypot(x - cx, y - cy);
          if (dd <= r) {
            const i = y * cols + x;
            w[i] += amount; p[i] += amount * 0.9;
          }
        }
    }
    function step() {
      nw.set(w); np.set(p);
      const fl = [0, 0, 0, 0];
      for (let y = 1; y < rows - 1; y++) {
        for (let x = 1; x < cols - 1; x++) {
          const i = y * cols + x;
          const wi = w[i];
          if (wi < 0.002) continue;
          const nb = [i - 1, i + 1, i - cols, i + cols];
          let total = 0;
          for (let k = 0; k < 4; k++) {
            const j = nb[k];
            const c = (conductivity[i] + conductivity[j]) * 0.5;
            fl[k] = Math.max(0, wi - w[j]) * rate * c * 0.25;
            total += fl[k];
          }
          if (total <= 0) continue;
          // a cell can only give away part of what it holds (keeps the lattice stable)
          const cap = 0.45 * wi;
          const scale = total > cap ? cap / total : 1;
          const ratio = Math.min(1.2, p[i] / wi);
          for (let k = 0; k < 4; k++) {
            const f = fl[k] * scale;
            if (f <= 0) continue;
            const j = nb[k];
            nw[i] -= f; nw[j] += f;
            np[i] -= f * ratio * 0.92; np[j] += f * ratio * 0.92;
          }
        }
      }
      for (let i = 0; i < n; i++) {
        let wv = Math.max(0, nw[i]), pv = Math.max(0, np[i]);
        // absorption into the fibres deposits pigment as the water slows
        const evap = Math.min(wv, 0.0005 + 0.014 * sizing);
        const settle = wv > 1e-4 ? pv * (evap / wv) : pv;
        wv -= evap; pv -= settle; dep[i] += settle;
        w[i] = wv; p[i] = pv;
      }
    }
    function density(i) { return Math.max(0, dep[i] + p[i] * 0.6); }
    function reset() { w.fill(0); p.fill(0); dep.fill(0); }
    return { drop, step, density, reset, cols, rows };
  }

  /* ---------- Scroll helpers ---------- */
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  // progress of an element through the viewport: 0 when its top hits the
  // bottom of the screen, 1 when its bottom leaves the top
  function progress(el) {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    return clamp((vh - r.top) / (r.height + vh));
  }
  // progress through a sticky track: 0 at track start, 1 at end
  function trackProgress(el) {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    return clamp(-r.top / Math.max(1, r.height - vh));
  }

  window.Paper = { mulberry32, makeNoise, paperHeight, shade, toCanvas, inkSim, progress, trackProgress, clamp, ease, reduceMotion };
})();
