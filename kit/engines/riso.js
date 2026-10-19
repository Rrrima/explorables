/* Riso: a risograph-print look for canvas.
   - flat spot-colour fills with speckled ink gaps and soft density blotches
   - rough, broken crayon/brush lines in a second spot colour
   - each colour sits on its own layer, nudged slightly out of register
   Layers are multiplied onto the paper, so overlaps darken like real ink. */
(function () {
  "use strict";
  const P = window.Paper;

  const COLORS = {
    orange: [226, 100, 58],
    blue: [43, 76, 160],
    ink: [34, 30, 32],
    pink: [233, 140, 150],
    yellow: [240, 196, 70],
    green: [70, 140, 110]
  };

  // speckle mask: mostly solid, scattered pinholes, soft lighter blotches
  function speckleTile(size = 256, seed = 7, holes = 0.05) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d"), im = g.createImageData(size, size);
    const N = P.makeNoise(seed), rnd = P.mulberry32(seed);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      const blot = N.fbm(u * 3, v * 3, 3, 3);
      const fine = N.fbm(u * 40, v * 40, 2, 40);
      let a = 0.93 + 0.18 * blot + 0.22 * fine;
      const r = rnd();
      if (r < holes) a *= 0.15;             // pinhole where the drum missed
      else if (r < holes * 3) a *= 0.7;
      a = Math.max(0, Math.min(1, a));
      const j = (y * size + x) * 4;
      im.data[j] = im.data[j + 1] = im.data[j + 2] = 0;
      im.data[j + 3] = Math.round(255 * a);
    }
    g.putImageData(im, 0, 0);
    return c;
  }

  // paper: warm off-white with fibre flecks, returned as a canvas tile
  function paperTile(size = 320, seed = 3) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d"), im = g.createImageData(size, size);
    const N = P.makeNoise(seed), rnd = P.mulberry32(seed + 1);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      const n = N.fbm(u * 6, v * 6, 3, 6) * 4 + N.fbm(u * 60, v * 60, 2, 60) * 6 + (rnd() - 0.5) * 7;
      const j = (y * size + x) * 4;
      im.data[j] = 238 + n; im.data[j + 1] = 235 + n; im.data[j + 2] = 228 + n; im.data[j + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    // flecks
    for (let i = 0; i < 90; i++) {
      g.fillStyle = `rgba(120,110,95,${0.08 + rnd() * 0.12})`;
      g.beginPath(); g.arc(rnd() * size, rnd() * size, 0.4 + rnd() * 0.8, 0, 6.3); g.fill();
    }
    return c;
  }

  /* A Riso "plate": one colour layer. Draw shapes and lines on plate.g in
     virtual coordinates; compose() textures it and multiplies onto dest. */
  function Plate(w, h, color, opts = {}) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const g = c.getContext("2d");
    const rgb = COLORS[color] || color;
    const tex = speckleTile(256, opts.seed || 7, opts.holes == null ? 0.05 : opts.holes);
    const pat = g.createPattern(tex, "repeat");
    return {
      c, g, rgb,
      clear() { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h); },
      fill(path, alpha = 1) {
        g.globalAlpha = alpha;
        g.fillStyle = `rgb(${rgb.join(",")})`;
        g.fill(path);
        g.globalAlpha = 1;
      },
      line(pts, o = {}) {
        window.Pen.ink(g, pts, Object.assign({ color: `rgb(${rgb.join(",")})`, w: 2.4, dry: 0.6, jit: 0.9, a: 1, bleed: false }, o));
      },
      // knock a shape out of this plate (labels cut from the ink)
      cut(path) {
        g.globalCompositeOperation = "destination-out";
        g.fillStyle = "#000"; g.fill(path);
        g.globalCompositeOperation = "source-over";
      },
      compose(dest, dx = 0, dy = 0, alpha = 1) {
        // apply speckle in device space, then multiply onto the destination
        g.save();
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.globalCompositeOperation = "destination-in";
        g.fillStyle = pat;
        g.fillRect(0, 0, w, h);
        g.restore();
        dest.save();
        dest.setTransform(1, 0, 0, 1, 0, 0);
        dest.globalAlpha = alpha;
        dest.globalCompositeOperation = "multiply";
        dest.drawImage(c, dx, dy);
        dest.restore();
      }
    };
  }

  /* ---------- wine bottle silhouettes ----------
     Built from a half-profile (shoulder, neck) and mirrored. Returns Path2D
     centred on x=0 with the base at y=0 (height h, negative up). */
  const PROFILES = {
    // [neck width ratio, neck length ratio, shoulder roundness, body width ratio]
    bordeaux: { body: 0.30, neck: 0.11, neckLen: 0.30, shoulder: 0.06, punt: 0.04 },
    burgundy: { body: 0.33, neck: 0.11, neckLen: 0.28, shoulder: 0.26, punt: 0.04 },
    champagne: { body: 0.34, neck: 0.12, neckLen: 0.26, shoulder: 0.28, punt: 0.05 },
    flute: { body: 0.25, neck: 0.09, neckLen: 0.34, shoulder: 0.32, punt: 0.03 },
    port: { body: 0.31, neck: 0.12, neckLen: 0.24, shoulder: 0.08, punt: 0.04 },
    magnum: { body: 0.38, neck: 0.13, neckLen: 0.25, shoulder: 0.08, punt: 0.05 }
  };
  function bottlePath(kind, h, seed = 0) {
    const pr = PROFILES[kind] || PROFILES.bordeaux;
    const rnd = P.mulberry32(seed * 31 + 7);
    const wob = () => (rnd() - 0.5) * h * 0.012;      // hand-cut edges
    const bw = pr.body * h * 0.36, nw = pr.neck * h * 0.42;
    const neckTop = -h, neckBot = -h * (1 - pr.neckLen);
    const shEnd = neckBot + h * pr.shoulder;           // where shoulder meets body
    const p = new Path2D();
    // right side, bottom → top
    p.moveTo(-bw * 0.85 + wob(), 0);
    p.quadraticCurveTo(-bw * 0.02, h * 0.012, bw * 0.85 + wob(), 0);
    p.quadraticCurveTo(bw + wob(), -h * 0.01, bw + wob(), -h * 0.06);
    p.lineTo(bw + wob(), shEnd + wob());
    p.bezierCurveTo(bw + wob(), neckBot + (shEnd - neckBot) * 0.2, nw * 1.1, neckBot + wob(), nw + wob(), neckBot - h * 0.02);
    p.lineTo(nw + wob() * 0.5, neckTop + h * 0.02);
    p.quadraticCurveTo(nw, neckTop, nw * 0.6, neckTop);
    p.lineTo(-nw * 0.6, neckTop);
    p.quadraticCurveTo(-nw, neckTop, -nw + wob() * 0.5, neckTop + h * 0.02);
    p.lineTo(-nw + wob(), neckBot - h * 0.02);
    p.bezierCurveTo(-nw * 1.1, neckBot + wob(), -bw + wob(), neckBot + (shEnd - neckBot) * 0.2, -bw + wob(), shEnd + wob());
    p.lineTo(-bw + wob(), -h * 0.06);
    p.quadraticCurveTo(-bw + wob(), -h * 0.01, -bw * 0.85, 0);
    p.closePath();
    return { path: p, bodyW: bw, neckBot, shEnd };
  }

  window.Riso = { COLORS, Plate, paperTile, speckleTile, bottlePath, PROFILES };
})();
