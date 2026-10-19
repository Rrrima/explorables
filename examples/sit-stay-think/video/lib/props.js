/* Props copied from the essay's scenes (determien-dogs-scrolly/js/scenes.js) so the
   video draws the same hand, horse, cups, tube, jar, person and brain. */
(function () {
  "use strict";
  const F = window.Fuzz, P = Math.PI, INK = F.PAL.ink, MUTED = "#8a8077";
  const window_tip = null;
  const cache = new Map();
  // fur several parts into one cached sprite; box is in sprite coords
  function compose(key, box, parts, after) {
    let s = cache.get(key); if (s) return s;
    const DPR = F.DPR, pad = 12, x0 = box[0] - pad, y0 = box[1] - pad, x1 = box[2] + pad, y1 = box[3] + pad;
    const c = document.createElement("canvas"); c.width = Math.ceil((x1 - x0) * DPR); c.height = Math.ceil((y1 - y0) * DPR);
    const g = c.getContext("2d"); g.setTransform(DPR, 0, 0, DPR, -x0 * DPR, -y0 * DPR);
    for (const p of parts) F.fur(g, p);
    F.flush(g);
    after && after(g);
    s = { c, ox: -x0, oy: -y0, w: c.width / DPR, h: c.height / DPR, R: 1, face: null };
    cache.set(key, s); return s;
  }
  // labels shrink, then wrap, to stay inside the stage
  function lab(g, t, x, y, o = {}) {
    o = Object.assign({ size: 11, color: MUTED }, o);
    const W = g.canvas.width / F.DPR, al = o.align || "left";
    const room = al === "center" ? 2 * Math.min(x, W - x) - 8 : al === "right" ? x - 6 : W - x - 6;
    g.save(); g.font = `400 ${o.size}px 'IBM Plex Mono', monospace`; let tw = g.measureText(t).width; g.restore();
    if (tw > room) {
      const k = Math.max(8.5 / o.size, room / tw);
      o.size *= k; tw *= k;
      if (tw > room + 1) {
        const mid = t.lastIndexOf(" ", Math.floor(t.length / 2) + 6);
        if (mid > 0) { F.label(g, t.slice(0, mid), x, y, o); F.label(g, t.slice(mid + 1), x, y + o.size * 1.35, o); return; }
      }
    }
    F.label(g, t, x, y, o);
  }
  const big = (g, t, x, y, size, o = {}) => { g.save(); g.font = `${o.weight || 600} ${size}px Fraunces, Georgia, serif`; g.fillStyle = o.color || INK; g.textAlign = o.align || "center"; g.textBaseline = "alphabetic"; g.globalAlpha *= o.a == null ? 1 : o.a; g.fillText(t, x, y); g.restore(); };
  function pomGrid(g, x, y, n, k, cols, r, on = "ginger", off = "cream", a = 1) {
    const sOn = F.pom(r, on, 3), sOff = F.pom(r, off, 4), gap = r * 2.5;
    for (let i = 0; i < n; i++) {
      const cx = x + (i % cols) * gap + r, cy = y + Math.floor(i / cols) * gap + r;
      F.put(g, i < k ? sOn : sOff, cx, cy, { a });
    }
    return { w: cols * gap, h: Math.ceil(n / cols) * gap };
  }
  function ruleLine(g, x0, y0, x1, y1, a = 0.5, w = 0.9) { F.hairline(g, [[x0, y0], [x1, y1]], { w, a, taper: false, jit: 0.15 }); }
  // a wooden crate, slats in brown hairline
  function crate(g, x, y, w, h) {
    const col = "rgba(120,80,45,.85)";
    const L = (pts) => F.hairline(g, pts, { w: 1.6, color: col, a: 1, taper: false, jit: 0.3 });
    L([[x, y], [x + w, y]]); L([[x, y + h], [x + w, y + h]]); L([[x, y], [x, y + h]]); L([[x + w, y], [x + w, y + h]]);
    for (let i = 1; i < 6; i++) L([[x + (w * i) / 6, y], [x + (w * i) / 6, y + h]]);
    L([[x + w * 0.1, y + h * 0.35], [x + w * 0.9, y + h * 0.35]]);
  }
  // a felted horse head (Clever Hans), facing left
  function horse(R) {
    const H = [];
    const neck = F.wob(R * 0.45, R * 0.75, R * 0.55, R * 1.05, -0.35, 0.05, 3);
    const head = F.wob(-R * 0.25, -R * 0.05, R * 0.38, R * 0.95, 0.85, 0.05, 4);
    const ear = F.tri([R * 0.05, -R * 0.75], [R * 0.02, -R * 1.25], [R * 0.3, -R * 0.82], 0.2);
    H.push({ paths: [neck, head, ear], box: [-R * 1.25, -R * 1.3, R * 1.1, R * 1.8], crown: [-R * 0.2, -R * 0.6], rad: R * 1.6, coat: "tan", len: R * 0.06, seed: 31, curl: 0.5 });
    const mane = F.wob(R * 0.62, R * 0.35, R * 0.16, R * 0.95, -0.38, 0.12, 9);
    H.push({ paths: [mane], box: [R * 0.2, -R * 0.75, R * 1.15, R * 1.45], crown: [R * 0.5, -R * 0.4], rad: R, coat: "choc", len: R * 0.1, seed: 32, flow: () => P * 0.62 });
    return compose("horse" + Math.round(R), [-R * 1.3, -R * 1.35, R * 1.2, R * 1.85], H, (g) => {
      F.dot(g, -R * 0.22, -R * 0.38, R * 0.045);
      F.soft(g, -R * 0.82, R * 0.42, R * 0.06, R * 0.04, "rgba(40,25,18,.8)", 1, 1, 0.6);
      F.hairline(g, F.bow(-R * 0.98, R * 0.62, -R * 0.68, R * 0.72, R * 0.04, 8), { w: 1, a: 0.6, taper: false });
    });
  }
  // a hand with a pointing finger (felted sleeve + skin), pointing in direction ang
  const SKIN = { base: F.hex("#e9c6aa"), light: F.hex("#f5dcc7"), dark: F.hex("#c99a7c") };
  function hand(R) {
    // finger points along -x; the sleeve trails off to +x
    const palm = F.wob(0, 0, R * 0.34, R * 0.3, 0, 0.04, 6);
    const finger = new Path2D(); finger.ellipse(-R * 0.58, -R * 0.12, R * 0.44, R * 0.1, 0.05, 0, P * 2);
    const knuckles = [0, 1, 2].map((i) => F.ell(-R * 0.22 + i * R * 0.02, R * (0.0 + i * 0.1), R * 0.14, R * 0.075, 0));
    const thumb = F.ell(-R * 0.1, -R * 0.28, R * 0.18, R * 0.07, -0.5);
    const parts = [
      { paths: [F.wob(R * 1.15, 0, R * 0.95, R * 0.36, 0, 0.05, 5)], box: [R * 0.15, -R * 0.55, R * 2.2, R * 0.55], crown: [R * 1.1, -R * 0.3], rad: R, coat: "grey", len: R * 0.05, seed: 41 },
      { paths: [palm, finger, thumb, ...knuckles], box: [-R * 0.95, -R * 0.42, R * 0.4, R * 0.38], crown: [-R * 0.2, -R * 0.2], rad: R * 0.7, coat: SKIN, len: Math.max(1.2, R * 0.018), seed: 42, dens: 0.5, curl: 0.3 },
    ];
    return compose("hand" + Math.round(R), [-R * 1, -R * 0.6, R * 2.25, R * 0.6], parts, (g) => {
      F.hairline(g, F.bow(-R * 0.86, -R * 0.15, -R * 0.82, -R * 0.08, R * 0.01, 4), { w: 1, a: 0.35, color: "#a0705a", taper: false });
    });
  }
  function cup(R, ck = "ginger") {
    const p = new Path2D(); p.moveTo(-R * 0.75, R * 0.5); p.lineTo(-R * 0.55, -R * 0.5); p.quadraticCurveTo(0, -R * 0.62, R * 0.55, -R * 0.5); p.lineTo(R * 0.75, R * 0.5); p.quadraticCurveTo(0, R * 0.62, -R * 0.75, R * 0.5);
    return compose("cup" + Math.round(R) + ck, [-R, -R * 0.8, R, R * 0.8], [{ paths: [p], box: [-R * 0.8, -R * 0.7, R * 0.8, R * 0.7], crown: [0, -R * 0.6], rad: R, coat: ck, len: Math.max(1.5, R * 0.07), seed: 51 }]);
  }


  function tube(g, x0, x1, y, r, a = 1) {
    g.save(); g.globalAlpha *= a;
    g.fillStyle = "rgba(200,215,220,.22)"; g.fillRect(x0, y - r, x1 - x0, 2 * r);
    const c = "rgba(90,110,120,.7)";
    F.hairline(g, [[x0, y - r], [x1, y - r]], { w: 1.1, color: c, taper: false, a: 1 });
    F.hairline(g, [[x0, y + r], [x1, y + r]], { w: 1.1, color: c, taper: false, a: 1 });
    for (const x of [x0, x1]) { g.strokeStyle = c; g.lineWidth = 1.1; g.beginPath(); g.ellipse(x, y, r * 0.3, r, 0, 0, P * 2); g.stroke(); }
    g.fillStyle = "rgba(255,255,255,.5)"; g.fillRect(x0 + 6, y - r * 0.7, x1 - x0 - 12, r * 0.12);
    g.restore();
  }
  function yarnBall(g, x, y, r, ck, seed) {
    F.put(g, F.pom(r, ck, seed), x, y);
    const c = F.coat(ck);
    for (let i = 0; i < 5; i++) {
      const a0 = i * 0.7 + seed, rr = r * (0.55 + 0.4 * ((i * 37) % 7) / 7);
      F.hairline(g, F.bow(x + Math.cos(a0) * rr, y + Math.sin(a0) * rr, x + Math.cos(a0 + 2.4) * rr, y + Math.sin(a0 + 2.4) * rr, r * 0.25, 14), { w: Math.max(0.8, r * 0.035), color: F.css(c.dark, 0.6), taper: false, jit: 0.2 });
    }
  }

  function person(R, crying) {
    const parts = [
      { paths: [F.wob(0, R * 1.3, R * 0.95, R * 0.7, 0, 0.05, 3)], box: [-R, R * 0.6, R, R * 2], crown: [0, R * 0.8], rad: R, coat: "grey", len: R * 0.05, seed: 61 },
      { paths: [F.wob(0, 0, R * 0.62, R * 0.75, 0, 0.03, 4)], box: [-R * 0.7, -R * 0.8, R * 0.7, R * 0.8], crown: [0, -R * 0.3], rad: R * 0.8, coat: SKIN, len: Math.max(1.2, R * 0.02), seed: 62, dens: 0.5, curl: 0.3 },
      { paths: [F.wob(0, -R * 0.45, R * 0.7, R * 0.42, 0, 0.08, 5), F.ell(-R * 0.55, -R * 0.05, R * 0.18, R * 0.42, 0.2), F.ell(R * 0.55, -R * 0.05, R * 0.18, R * 0.42, -0.2)], box: [-R * 0.8, -R * 0.95, R * 0.8, R * 0.5], crown: [0, -R * 0.7], rad: R * 0.8, coat: "choc", len: R * 0.06, seed: 63 },
    ];
    return compose("person" + Math.round(R) + crying, [-R * 1.05, -R, R * 1.05, R * 2.05], parts, (g) => {
      for (const sx of [-1, 1]) F.hairline(g, F.bow(sx * R * 0.3 - R * 0.1, R * 0.05, sx * R * 0.3 + R * 0.1, R * 0.05, crying ? -R * 0.05 : R * 0.05, 6), { w: Math.max(1, R * 0.03), a: 0.85, taper: false });
      F.hairline(g, F.bow(-R * 0.14, R * 0.42, R * 0.14, R * 0.42, crying ? -R * 0.06 : R * 0.06, 6), { w: Math.max(1, R * 0.025), a: 0.7, taper: false });
      if (crying) { g.fillStyle = "rgba(150,190,210,.9)"; for (const [x, y] of [[-R * 0.3, R * 0.22], [-R * 0.33, R * 0.36]]) { g.beginPath(); g.ellipse(x, y, R * 0.035, R * 0.05, 0, 0, P * 2); g.fill(); } }
    });
  }

  function jar(g, x, y, r, a = 1) {
    g.save(); g.globalAlpha *= a;
    g.fillStyle = "rgba(200,215,220,.25)"; g.fillRect(x - r, y - r * 1.3, r * 2, r * 1.3);
    const c = "rgba(90,110,120,.7)";
    F.hairline(g, [[x - r, y - r * 1.3], [x - r, y], [x + r, y], [x + r, y - r * 1.3]], { w: 1.1, color: c, taper: false, jit: 0.1 });
    g.fillStyle = "rgba(120,80,45,.85)"; g.fillRect(x - r * 1.1, y - r * 1.45, r * 2.2, r * 0.18);
    g.restore();
    F.put(g, F.pom(r * 0.3, "ginger", 6), x, y - r * 0.35, { a });
  }

  function brain(R, seed) {
    const p = F.wob(0, 0, R, R * 0.72, 0, 0.06, seed);
    return compose("brain" + Math.round(R) + seed, [-R * 1.1, -R * 0.85, R * 1.1, R * 1.05], [
      { paths: [p], box: [-R * 1.08, -R * 0.8, R * 1.08, R * 0.8], crown: [-R * 0.3, -R * 0.4], rad: R * 1.1, coat: { base: F.hex("#e3b5a8"), light: F.hex("#f1cfc4"), dark: F.hex("#c08b80") }, len: Math.max(1.6, R * 0.04), seed, curl: 1 },
      { paths: [F.ell(R * 0.55, R * 0.62, R * 0.32, R * 0.2, 0.2)], box: [R * 0.15, R * 0.35, R * 0.95, R * 0.9], crown: [R * 0.55, R * 0.5], rad: R * 0.4, coat: { base: F.hex("#d7a397"), light: F.hex("#e8bfb3"), dark: F.hex("#b07a6f") }, len: Math.max(1.4, R * 0.03), seed: seed + 1 },
    ], (g) => {
      const rnd = F.mulberry32(seed);
      for (let i = 0; i < 9; i++) {
        const x0 = (rnd() - 0.5) * R * 1.5, y0 = (rnd() - 0.5) * R * 0.9, pts = [];
        let a = rnd() * P * 2, x = x0, y = y0;
        for (let j = 0; j < 9; j++) { pts.push([x, y]); a += (rnd() - 0.5) * 1.6; x += Math.cos(a) * R * 0.07; y += Math.sin(a) * R * 0.07; if (x * x / (R * R * 0.8) + y * y / (R * R * 0.4) > 1) break; }
        F.hairline(g, pts, { w: Math.max(0.8, R * 0.02), color: "rgba(150,90,80,.7)", taper: true, jit: 0.1 });
      }
      F.hairline(g, F.bow(-R * 0.9, -R * 0.05, R * 0.8, -R * 0.15, -R * 0.12, 16), { w: Math.max(1, R * 0.025), color: "rgba(150,90,80,.6)", taper: false });
    });
  }

  window.VideoKit = { compose, hand, cup, horse, tube, yarnBall, person, jar, brain, crate };
})();
