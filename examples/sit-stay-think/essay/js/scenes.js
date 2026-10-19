/* Scenes: one drawing per chapter, driven by scroll position s (in step units). */
(function () {
  "use strict";
  const F = window.Fuzz, D = window.DATA, P = Math.PI;
  const SC = (window.SCENES = window.SCENES || {});
  const E = F.ease, cl = F.clamp, seg = F.seg;
  const INK = F.PAL.ink, MUTED = "#8a8077";
  const tip = (t, b, s) => window.tipHTML(t, b, s);

  /* ---------- shared helpers ---------- */
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
  // never below 11 px on screen: a label that doesn't fit wraps instead of shrinking further
  const MIN_LAB = 11;
  function lab(g, t, x, y, o = {}) {
    o = Object.assign({ size: 11, color: MUTED }, o);
    o.size = Math.max(MIN_LAB, o.size);
    const W = g.canvas.width / F.DPR, al = o.align || "left";
    let room = al === "center" ? 2 * Math.min(x, W - x) - 8 : al === "right" ? x - 6 : W - x - 6;
    if (o.maxW) room = Math.min(room, o.maxW);              // e.g. a column's width, so neighbours don't collide
    g.save(); g.font = `400 ${o.size}px 'IBM Plex Mono', monospace`; let tw = g.measureText(t).width; g.restore();
    if (tw > room) {
      const k = Math.max(MIN_LAB / o.size, room / tw);
      o.size *= k; tw *= k;
      if (tw > room + 1) {
        const mid = t.lastIndexOf(" ", Math.floor(t.length / 2) + 6);
        if (mid > 0) { F.label(g, t.slice(0, mid), x, y, o); F.label(g, t.slice(mid + 1), x, y + o.size * 1.35, o); return o.size * 1.35 * 2; }
      }
    }
    F.label(g, t, x, y, o);
    return o.size * 1.35;
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

  /* ======================= 1 · HISTORY ======================= */
  SC.history = {
    init(st) { st.data.ready = 0; },
    draw(g, w, h, s, st, t) {
      const TL = D.timeline, N = 6;
      const xs = [0.1, 0.24, 0.38, 0.52, 0.7, 0.88].map((f) => f * w), by = h * 0.86;
      const U = Math.min(w * 0.98, h * 0.84), cx = w * 0.5, cy = h * 0.42;
      // the yarn line, drawn on up to the current knot
      const cur = cl(s, 0, N - 1);
      const reach = xs[Math.floor(cur)] + (xs[Math.min(N - 1, Math.floor(cur) + 1)] - xs[Math.floor(cur)]) * E(cur - Math.floor(cur));
      const pts = [[w * 0.04, by + 2], [w * 0.5, by - 3], [w * 0.96, by + 1]];
      const tot = w * 0.92, k = cl((reach + w * 0.03 - w * 0.04) / tot);
      F.yarn(g, F.bow(pts[0][0], pts[0][1], pts[2][0], pts[2][1], -4, 40), { coat: "ink", w: 2.2, k, seed: 4 });
      // a break in time between 1912 and 1994
      const bx = (xs[3] + xs[4]) / 2;
      if (reach > bx) { g.save(); g.fillStyle = F.PAL.ground; g.fillRect(bx - 7, by - 10, 14, 20); g.restore(); ruleLine(g, bx - 8, by + 7, bx - 2, by - 7, 0.7); ruleLine(g, bx + 1, by + 7, bx + 7, by - 7, 0.7); }
      const hots = [];
      const years = ["1872", "1898", "1904", "1912", "1994", "2019–22"];
      for (let i = 0; i < N; i++) {
        const shown = E(seg(s, i - 0.6, i - 0.1) + (i === 0 ? 1 : 0));
        if (shown <= 0) continue;
        const on = Math.abs(cur - i - 0.5) < 0.5 || (i === N - 1 && cur >= N - 1);
        const r = on ? 9 : 6.5;
        F.put(g, F.pom(r, on ? "ginger" : "cream", 10 + i), xs[i], by, { a: shown });
        lab(g, years[i], xs[i], by + 26, { align: "center", color: on ? INK : MUTED, a: shown, size: 11.5 });
        const ev = i < 5 ? TL[i] : TL[6];
        hots.push({ x: xs[i], y: by, r: 22, sx: xs[i] + 11, sy: by - 16, html: tip(ev.title, ev.note, ev.src) });
      }
      // vignettes
      for (let i = 0; i < N; i++) {
        const a = i === 0 ? E(cl(1 - (s - 1) / 0.25)) * (s < 0 ? E(cl(s + 1)) : 1) : i === N - 1 ? E(seg(s, i - 0.05, i + 0.2)) : E(seg(s, i - 0.05, i + 0.2)) * E(cl(1 - (s - i - 1) / 0.25));
        if (a <= 0.01) continue;
        g.save(); g.globalAlpha = a; g.translate(0, (1 - a) * 14);
        VIG[i](g, cx, cy, U, s - i, t);
        g.restore();
      }
      return hots;
    },
  };
  const VIG = [
    // Darwin: the same kind of dog, hostile and humble
    (g, cx, cy, U) => {
      const R = U * 0.12;
      F.put(g, F.dog({ breed: "shepherd", R, seed: 71, sit: true }), cx - U * 0.24, cy - U * 0.2, { rot: -0.04 });
      F.put(g, F.dog({ breed: "golden", R, seed: 72, sit: true, face: { expr: "happy" } }), cx + U * 0.24, cy - U * 0.15, { rot: 0.2 });
      lab(g, "hostile", cx - U * 0.27, cy + U * 0.27, { align: "center", color: INK });
      lab(g, "humble and affectionate", cx + U * 0.27, cy + U * 0.27, { align: "center", color: INK });
      lab(g, "after Darwin, The Expression of the Emotions, 1872", cx, cy + U * 0.34, { align: "center", size: 10.5 });
    },
    // Thorndike: a cat in a crate, and its escape times as a yarn curve
    (g, cx, cy, U, p) => {
      const bw = U * 0.36, bh = U * 0.3, bx = cx - U * 0.46, by0 = cy - U * 0.1;
      F.put(g, F.cat({ coat: "grey", R: U * 0.075, seed: 75, sit: true, face: { look: 1 } }), bx + bw * 0.5, by0 + bh * 0.2);
      crate(g, bx, by0 - bh * 0.15, bw, bh * 1.05);
      lab(g, "puzzle box A", bx + bw / 2, by0 + bh + U * 0.04, { align: "center" });
      const x0 = cx + U * 0.02, x1 = cx + U * 0.46, y0 = cy - U * 0.22, y1 = cy + U * 0.18;
      ruleLine(g, x0, y1, x1, y1, 0.45); ruleLine(g, x0, y0, x0, y1, 0.45);
      const d = D.thorndike, k = cl(0.15 + p * 1.1);
      const curve = Array.from({ length: 24 }, (_, i) => { const v = d.last + (d.first - d.last) * Math.exp(-i / 4.2); return [x0 + (i / 23) * (x1 - x0), y1 - (v / d.first) * (y1 - y0)]; });
      F.yarn(g, curve, { coat: "ginger", w: 2.6, k, seed: 8 });
      lab(g, "160 s", x0 - 6, y0, { align: "right", color: INK });
      lab(g, "≈6 s", x1 + 6, y1 - ((d.last / d.first) * (y1 - y0)) - 8, { color: INK });
      lab(g, "try 1", x0, y1 + 14); lab(g, "try 24", x1, y1 + 14, { align: "right" });
      lab(g, "time to escape · only the first and last tries are quoted", (x0 + x1) / 2, y1 + 32, { align: "center", size: 10 });
    },
    // Clever Hans: a horse, and his score with and without seeing the questioner
    (g, cx, cy, U) => {
      F.put(g, horse(U * 0.2), cx - U * 0.3, cy - U * 0.08);
      const r = Math.max(3.2, U * 0.0115), gx = cx + U * 0.06;
      const a = pomGrid(g, gx, cy - U * 0.28, 100, 89, 10, r, "ginger", "cream");
      lab(g, "could see the questioner · 89 in 100", gx, cy - U * 0.28 + a.h + 12, { color: INK });
      const b = pomGrid(g, gx, cy + U * 0.06, 100, 6, 10, r, "ginger", "cream");
      lab(g, "could not · 6 in 100", gx, cy + U * 0.06 + b.h + 12, { color: INK });
    },
    // IQ: the formula, and two puzzled examinees
    (g, cx, cy, U) => {
      big(g, "IQ = mental age ÷ age × 100", cx, cy - U * 0.2, Math.max(20, U * 0.058));
      const pw = U * 0.24, ph = U * 0.3, px = cx - pw / 2, py = cy - U * 0.08;
      ruleLine(g, px, py, px + pw, py, 0.5); ruleLine(g, px + pw, py, px + pw, py + ph, 0.5); ruleLine(g, px, py + ph, px + pw, py + ph, 0.5); ruleLine(g, px, py, px, py + ph, 0.5);
      for (let i = 1; i < 6; i++) ruleLine(g, px + pw * 0.12, py + (ph * i) / 6.5, px + pw * (0.5 + 0.35 * ((i * 37) % 10) / 10), py + (ph * i) / 6.5, 0.3, 0.8);
      big(g, "?", px + pw * 0.8, py + ph * 0.92, U * 0.06, { color: "#b9773f" });
      F.put(g, F.dog({ breed: "beagle", R: U * 0.09, seed: 77 }), px - U * 0.13, py + ph * 0.55, { rot: 0.25, face: { look: 1.5 } });
      F.put(g, F.cat({ coat: "cream", R: U * 0.08, seed: 78 }), px + pw + U * 0.12, py + ph * 0.6, { rot: -0.3, face: { look: -1.5, expr: "wow" } });
    },
    // Coren: a clipboard of ranks
    (g, cx, cy, U) => {
      const bw = U * 0.36, bh = U * 0.48, bx = cx - bw / 2, by0 = cy - U * 0.28;
      g.save(); g.fillStyle = "rgba(185,138,85,.28)"; g.fillRect(bx, by0, bw, bh); g.restore();
      g.save(); g.fillStyle = "#fbf8f1"; g.fillRect(bx + bw * 0.07, by0 + bh * 0.08, bw * 0.86, bh * 0.86); g.restore();
      F.put(g, F.pom(U * 0.035, "dark", 9), cx, by0 + 2);
      const rows = [["1", "Border Collie"], ["2", "Poodle"], ["3", "German Shepherd"], ["4", "Golden Retriever"], ["…", ""], ["78", "Basenji"], ["79", "Afghan Hound"]];
      rows.forEach(([n, b], i) => { const y = by0 + bh * (0.2 + i * 0.105); lab(g, n, bx + bw * 0.16, y, { color: INK, size: Math.max(10, U * 0.026) }); lab(g, b, bx + bw * 0.27, y, { color: INK, size: Math.max(10, U * 0.026) }); });
      lab(g, "199 judges · easiest and hardest breeds to train", cx, by0 + bh + U * 0.05, { align: "center" });
    },
    // genes: a yarn double helix with two sample sizes
    (g, cx, cy, U, p) => {
      const x0 = cx - U * 0.45, x1 = cx + U * 0.45, A = U * 0.09, n = 60, ph = p * 2;
      const s1 = [], s2 = [];
      for (let i = 0; i <= n; i++) { const x = x0 + ((x1 - x0) * i) / n, a = (i / n) * P * 4 + ph; s1.push([x, cy - U * 0.05 + Math.sin(a) * A]); s2.push([x, cy - U * 0.05 - Math.sin(a) * A]); }
      for (let i = 2; i < n; i += 3) ruleLine(g, s1[i][0], s1[i][1], s2[i][0], s2[i][1], 0.25, 0.8);
      F.yarn(g, s1, { coat: "ginger", w: 3, seed: 1 }); F.yarn(g, s2, { coat: "grey", w: 3, seed: 2 });
      big(g, "14,000+ dogs", cx - U * 0.22, cy + U * 0.22, Math.max(18, U * 0.05));
      lab(g, "2019 · 101 breeds", cx - U * 0.22, cy + U * 0.27, { align: "center" });
      big(g, "18,385 dogs", cx + U * 0.22, cy + U * 0.22, Math.max(18, U * 0.05));
      lab(g, "2022 · 2,155 genotyped", cx + U * 0.22, cy + U * 0.27, { align: "center" });
    },
  ];


  /* lazy sprites: build a few per frame so scrolling never stalls */
  function lazy(st, key, make) {
    const m = st.data.sp || (st.data.sp = new Map());
    if (m.has(key)) return m.get(key);
    if ((st.data.built || 0) >= 3) { st.data.pending = true; return null; }
    st.data.built = (st.data.built || 0) + 1;
    const v = make(); m.set(key, v); return v;
  }
  const frameStart = (st) => { st.data.built = 0; st.data.pending = false; };
  const live = (st) => !!st.data.pending;

  /* ======================= 2 · RANKING ======================= */
  const SHORT = { "German Shepherd": "Shepherd", "Golden Retriever": "Golden", "Doberman Pinscher": "Doberman", "Shetland Sheepdog": "Sheltie", "Labrador Retriever": "Labrador", "Australian Cattle Dog": "Cattle dog", "Basset Hound": "Basset", "Afghan Hound": "Afghan" };
  SC.ranking = {
    live,
    draw(g, w, h, s, st) {
      frameStart(st);
      const C = D.coren, hots = [];
      // step 0: the judges, 199 felt dots; 190 take the collie's colour
      const aJ = E(cl(1 - (s - 0.85) / 0.4)) * (s < 0 ? E(cl(s + 1)) : 1);
      if (aJ > 0.01) {
        const cols = w < 560 ? 15 : 20, r = Math.max(3.5, Math.min(w, h) * 0.011), gap = r * 2.5, gw = cols * gap, gx = w * 0.5 - gw / 2 + w * 0.08, gy = h * 0.3;
        const k = Math.round(190 * E(seg(s, -0.2, 0.6)));
        const sOn = F.pom(r, "dark", 3), sOff = F.pom(r, "cream", 4);
        for (let i = 0; i < 199; i++) F.put(g, i < k ? sOn : sOff, gx + (i % cols) * gap + r, gy + Math.floor(i / cols) * gap + r, { a: aJ });
        lab(g, `${k} of 199 judges: Border Collie in the top ten`, gx, gy + 10 * gap + 20, { color: INK, a: aJ });
        const sp = lazy(st, "bc", () => F.dog({ breed: "collie", R: Math.min(w, h) * 0.12, seed: 5, face: { expr: "pant" } }));
        if (sp) F.put(g, sp, gx - Math.min(w, h) * 0.2, gy + gap * 4, { a: aJ, rot: -0.1 });
      }
      // shelves
      const shelf = (list, y, s0, label) => {
        const n = list.length, x0 = w * 0.04, x1 = w * 0.97, step = (x1 - x0) / n, R = Math.min(step * 0.4, h * 0.08);
        const a = E(seg(s, s0 - 0.3, s0 + 0.1));
        if (a <= 0.01) return { R, step, x0 };
        F.yarn(g, [[x0 - 6, y + R * 1.55], [x1 + 6, y + R * 1.55]], { coat: "tan", w: 3, k: a, seed: 7 });
        lab(g, label, x0, y - R * 1.75, { a, color: INK });
        list.forEach((b, i) => {
          const ai = E(seg(s, s0 - 0.3 + i * 0.05, s0 + 0.05 + i * 0.05));
          if (ai <= 0.01) return;
          const x = x0 + step * (i + 0.5), yy = y - (1 - ai) * R * 1.2;
          const sp = lazy(st, b.breed, () => F.dog({ breed: b.breed, R, seed: 100 + i * 7 + b.rank }));
          if (sp) F.put(g, sp, x, yy, { a: ai });
          lab(g, String(b.rank), x, y + R * 1.55 + 14, { align: "center", a: ai, color: INK });
          if (step > 70) lab(g, SHORT[b.name] || b.name, x, y + R * 1.55 + 29, { align: "center", a: ai, size: 9.5 });
          if (ai > 0.9) hots.push({ x, y, r: R * 1.1, sx: x + R * 0.9, sy: y - R * 1.0, html: tip(b.name, `Rank ${b.rank} of 79 in Coren's 1994 ranking of working and obedience intelligence.`, "D1, D2") });
        });
        return { R, step, x0 };
      };
      const top = shelf(C.top, h * 0.2, 1.0, "Top ten");
      const bot = shelf(C.bottom, h * 0.56, 2.0, "Bottom of the table, ranks 70–79");
      // step 3: repetitions to learn a new command
      const aR = E(seg(s, 2.85, 3.3));
      if (aR > 0.01) {
        const r = Math.max(3, Math.min(w, h) * 0.0095), gap = r * 2.5;
        const y1 = h * 0.2 + top.R * 1.55 + 34;
        for (let i = 0; i < 4; i++) F.put(g, F.pom(r, "ginger", 3), top.x0 + r + i * gap, y1 + r, { a: aR });
        lab(g, "fewer than 5 repetitions to learn a command · obeys the first time 95%+", top.x0 + 4 * gap + 10, y1 + r, { a: aR, color: INK });
        const y2 = h * 0.56 + bot.R * 1.55 + 34, cols = 40, n = Math.round(100 * E(seg(s, 2.9, 3.6)));
        for (let i = 0; i < n; i++) F.put(g, F.pom(r, "ginger", 3), bot.x0 + r + (i % cols) * gap, y2 + r + Math.floor(i / cols) * gap, { a: aR });
        lab(g, "80 to 100+ repetitions · obeys the first time 25% or less", bot.x0, y2 + 3 * gap + 16, { a: aR, color: INK });
      }
      return hots;
    },
  };

  /* ======================= 3 · LAB ======================= */
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
  SC.lab = {
    live,
    draw(g, w, h, s, st) {
      frameStart(st);
      const hots = [], fy = h * 0.8, U = Math.min(w, h);
      const R = U * 0.11;
      const dog = lazy(st, "dog", () => F.dog({ breed: "mutt", R, seed: 88, sit: true, liveFace: true }));
      const aA = E(cl(1 - (s - 0.9) / 0.3)) * (s < 0 ? E(cl(s + 1)) : 1);   // pointing
      const aB = E(seg(s, 0.85, 1.15)) * E(cl(1 - (s - 1.9) / 0.3));        // cylinder
      const aC = E(seg(s, 1.85, 2.2));                                        // yarn balls
      // floor
      if (aA + aB > 0.01) ruleLine(g, w * 0.08, fy, w * 0.92, fy, 0.3 * Math.max(aA, aB));
      let dx = w * 0.5, look = 0, brow = 0;
      if (aA > 0.01) {
        const cupL = w * 0.26, cupR = w * 0.74, cr = U * 0.07;
        F.put(g, F.pom(cr * 0.32, "ginger", 6), cupL + cr * 0.55, fy - cr * 0.2, { a: aA * 0.9 });
        F.put(g, cup(cr), cupL, fy - cr * 0.45, { a: aA }); F.put(g, cup(cr), cupR, fy - cr * 0.45, { a: aA });
        // the hand comes in from the right and points at the left cup
        const hp = E(seg(s, -0.3, 0.25)), hs = hand(U * 0.16);
        const hx = w * 1.05 - hp * w * 0.33, hy = fy - U * 0.48;
        const ang = Math.atan2(fy - cr - hy, cupL - hx);
        g.save(); g.globalAlpha = aA; g.translate(hx, hy); g.rotate(ang - P); g.drawImage(hs.c, -hs.ox, -hs.oy, hs.w, hs.h); g.restore();
        const go = E(seg(s, 0.3, 0.85));
        look = -1.6 * E(seg(s, 0.1, 0.35)); dx = w * 0.5 + (cupL + cr * 1.6 - w * 0.5) * go;
        if (s > 0.25 && s < 1) lab(g, "follows the point", w * 0.5, fy + 34, { align: "center", a: aA * E(seg(s, 0.6, 0.85)), color: INK });
        hots.push({ x: cupL, y: fy - cr, r: cr * 1.6, html: tip("Pointing test", "Dogs, even young puppies, follow a human point to hidden food. Hand-raised wolves mostly don't.", "D25"), a: aA });
      }
      if (aB > 0.01) {
        const tx0 = w * 0.32, tx1 = w * 0.68, ty = fy - U * 0.045, tr = U * 0.045;
        tube(g, tx0, tx1, ty, tr, aB);
        F.put(g, F.pom(tr * 0.45, "ginger", 6), w * 0.5, ty + tr * 0.4, { a: aB });
        const go = E(seg(s, 1.2, 1.85));
        if (s >= 0.9) { dx = w * 0.5 + (tx0 - R * 1.2 - w * 0.5) * go; look = -1.2 * go; }
        lab(g, go > 0.6 ? "walks round to the open end: passes" : "a treat in a clear tube, open at both ends", w * 0.5, fy + 34, { align: "center", a: aB, color: INK });
        hots.push({ x: w * 0.5, y: ty, r: tr * 2, html: tip("Cylinder test", "Measures inhibitory control. Border Collies and Australian Shepherds did best in a 1,002-dog Finnish battery.", "D23") });
      }
      const aDog = Math.max(aA, aB);
      if (dog && aDog > 0.01) F.put(g, dog, dx, fy - R * 2.45 - (s > 0.9 && s < 1.9 ? U * 0.02 : 0), { a: aDog, face: { look } });
      if (aC > 0.01) {
        const C = D.cognition, x0 = w * 0.14, step = (w * 0.76) / 3, by = h * 0.52, rMax = Math.min(step * 0.42, h * 0.17);
        C.forEach((c, i) => {
          const gi = E(seg(s, 2.0 + i * 0.12, 2.5 + i * 0.12)), r = Math.max(4, rMax * Math.sqrt(c.h2 / 0.7)) * (0.3 + 0.7 * gi);
          const x = x0 + step * i;
          g.save(); g.globalAlpha = aC; yarnBall(g, x, by + rMax - r, r, ["ginger", "orange", "grey", "cream"][i], 3 + i); g.restore();
          big(g, c.h2.toFixed(2), x, by + rMax + 46, Math.max(20, U * 0.05), { a: aC * gi });
          lab(g, step < 130 ? c.name.split(" ")[0] : c.name, x, by + rMax + 66, { align: "center", a: aC, color: INK, size: step < 130 ? 9.5 : 11 });
          hots.push({ x, y: by + rMax - r, r: Math.max(r, 24), html: tip(c.name, `Among-breed heritability ${c.h2.toFixed(2)}${c.note ? " (" + c.note + ")" : ""}: the share of breed-to-breed differences that tracks relatedness. 1,508 dogs, 36 breeds.`, c.src) });
        });
        lab(g, "how much breeds differ, skill by skill · ball area ∝ among-breed heritability", w * 0.5, h * 0.12, { align: "center", a: aC });
        // step 3: who led where (Finnish battery)
        const aD = E(seg(s, 2.85, 3.3));
        if (aD > 0.01) {
          const hy = by - rMax * 0.25 - U * 0.12;
          const a1 = lazy(st, "bcS", () => F.dog({ breed: "collie", R: U * 0.05, seed: 5 }));
          const a2 = lazy(st, "mal", () => F.dog({ breed: "shepherd", R: U * 0.05, seed: 91 }));
          if (a1) F.put(g, a1, x0, hy - rMax * 0.5, { a: aD });
          if (a2) F.put(g, a2, x0 + step, hy - rMax * 0.1, { a: aD });
          lab(g, "Border Collies best", x0, hy - rMax * 0.5 - U * 0.09, { align: "center", a: aD, color: INK });
          lab(g, "Kelpies, Malinois best", x0 + step, hy - rMax * 0.1 - U * 0.09, { align: "center", a: aD, color: INK });
          lab(g, "no breed differences", x0 + step * 2.5, by + rMax * 0.35 - U * 0.1, { align: "center", a: aD, color: INK });
          ruleLine(g, x0 + step * 2 - 20, by + rMax * 0.35 - U * 0.08, x0 + step * 3 + 20, by + rMax * 0.35 - U * 0.08, 0.35 * aD);
        }
      }
      return hots.filter((h0) => h0.a == null || h0.a > 0.3);
    },
  };

  /* ======================= 4 · NINE PERCENT ======================= */
  function gauss(rnd) { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * P * v); }
  SC.nine = {
    live,
    init(st) {
      // two breeds whose means differ so that breed explains 9% of variance: m/sd = sqrt(.09/.91)
      const rnd = F.mulberry32(9), m = Math.sqrt(0.09 / 0.91), dogs = [];
      for (let i = 0; i < 70; i++) dogs.push({ b: 0, v: m + gauss(rnd), j: rnd(), k: i % 3 });
      for (let i = 0; i < 70; i++) dogs.push({ b: 1, v: -m + gauss(rnd), j: rnd(), k: i % 3 });
      st.data.dogs = dogs; st.data.pick = null;
      const btn = st.sec.querySelector(".meet");
      btn.addEventListener("click", () => { st.data.pick = dogs[1 + Math.floor(rnd() * (dogs.length - 1))]; st.dirty = true; });
      st.data.btn = btn;
    },
    draw(g, w, h, s, st) {
      frameStart(st);
      const hots = [], U = Math.min(w, h);
      st.data.btn.classList.toggle("on", s > 1.9);
      // steps 0–1: one grid of 100 felt balls, dyed 73 then 9
      const aG = E(cl(1 - (s - 1.85) / 0.3)) * (s < 0 ? E(cl(s + 1)) : 1);
      if (aG > 0.01) {
        const r = Math.min(U * 0.03, 22), gap = r * 2.6, gx = w / 2 - 5 * gap, gy = h * 0.47 - 5 * gap;
        const k = s < 0.7 ? Math.round(73 * E(seg(s, -0.5, 0.3))) : Math.round(73 - 64 * E(seg(s, 0.7, 1.3)));
        const tint = s < 0.7 ? "ginger" : "dark";
        for (let i = 0; i < 100; i++) F.put(g, F.pom(r, i < k ? tint : "cream", 20 + (i % 5)), gx + (i % 10) * gap + r, gy + Math.floor(i / 10) * gap + r, { a: aG });
        const first = s < 0.85;
        big(g, first ? "0.73" : "9%", w / 2, gy - 34, Math.max(26, U * 0.07), { a: aG });
        lab(g, first ? "trainability: share of breed-to-breed differences that tracks relatedness · 101 breeds" : "share of one dog's behaviour that its breed explains · 18,385 dogs", w / 2, gy + 10 * gap + 22, { align: "center", a: aG, color: INK });
        hots.push({ x: w / 2, y: h * 0.47, r: 5 * gap, sx: gx + 10 * gap + 6, sy: gy, html: first ? tip("Breed averages", "Among-breed heritability of trainability is 0.73: breeds differ, on average, in ways that follow their ancestry.", "D6") : tip("One dog", "Breed explains about 9% of the variation between individual dogs (3–25% depending on the trait).", "D7") });
      }
      // step 2: two overlapping clouds of individuals
      const aC = E(seg(s, 1.8, 2.2));
      if (aC > 0.01) {
        const x0 = w * 0.08, x1 = w * 0.92, xm = (x0 + x1) / 2, sc = (x1 - x0) / 6.4, R = Math.max(7, U * 0.017);
        const rows = [{ y: h * 0.36, breed: "collie", name: "Border Collies" }, { y: h * 0.66, breed: "basset", name: "Basset Hounds" }];
        ruleLine(g, x0, h * 0.86, x1, h * 0.86, 0.35 * aC);
        lab(g, "lower", x0, h * 0.86 + 16, { a: aC }); lab(g, "higher", x1, h * 0.86 + 16, { align: "right", a: aC });
        lab(g, "an owner-rated trait, e.g. trainability · illustration built to the 9% figure", xm, h * 0.86 + (w < 560 ? 36 : 16), { align: "center", a: aC, maxW: w < 560 ? w - 24 : (x1 - x0) * 0.7 });
        const sps = rows.map((r0, b) => [0, 1, 2].map((v) => lazy(st, r0.breed + v, () => F.dog({ breed: r0.breed, R, seed: 300 + b * 10 + v }))));
        st.data.dogs.forEach((d, i) => {
          const r0 = rows[d.b], x = xm + d.v * sc, y = r0.y + (d.j - 0.5) * h * 0.2;
          const ai = aC * E(seg(s, 1.85 + (i % 70) * 0.004, 2.15 + (i % 70) * 0.004));
          const sp = sps[d.b][d.k]; if (sp) F.put(g, sp, x, y, { a: ai * (st.data.pick && st.data.pick !== d ? 0.45 : 1) });
          d.x = x; d.y = y;
        });
        rows.forEach((r0, b) => {
          const mean = xm + (b ? -1 : 1) * Math.sqrt(0.09 / 0.91) * sc;
          F.yarn(g, [[mean, r0.y - h * 0.13], [mean, r0.y + h * 0.13]], { coat: b ? "choc" : "black", w: 2.2, k: aC, seed: 5 + b });
          lab(g, `${r0.name} · average`, mean + 8, r0.y - h * 0.125, { a: aC, color: INK });
        });
        const pk = st.data.pick;
        if (pk && pk.x != null) {
          const other = st.data.dogs.filter((d) => d.b !== pk.b), beat = other.filter((d) => d.v < pk.v).length / other.length;
          g.save(); g.strokeStyle = INK; g.lineWidth = 1.2; g.beginPath(); g.arc(pk.x, pk.y, R * 1.9, 0, P * 2); g.stroke(); g.restore();
          const nm = pk.b ? "This Basset Hound" : "This Border Collie", on = pk.b ? "Border Collies" : "Basset Hounds";
          lab(g, `${nm} scores higher than ${Math.round(beat * 10)} in 10 ${on}`, Math.min(Math.max(pk.x, w * 0.25), w * 0.75), pk.y - R * 2.6, { align: "center", color: INK, size: 12 });
        }
      }
      return hots;
    },
  };

  /* ======================= 5 · FACES ======================= */
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
  function toyDog(R) {
    return compose("toy" + Math.round(R), [-R * 1.6, -R * 1.3, R * 1.6, R * 1.2], [
      { paths: [F.wob(0, R * 0.3, R * 1.2, R * 0.6, 0, 0.04, 2), F.ell(-R * 1.0, -R * 0.4, R * 0.5, R * 0.45), F.tri([-R * 1.35, -R * 0.65], [-R * 1.25, -R * 1.15], [-R * 0.95, -R * 0.8], 0.25)], box: [-R * 1.6, -R * 1.2, R * 1.4, R * 1], crown: [-R * 0.4, -R * 0.2], rad: R * 1.2, coat: "fawn", len: R * 0.06, seed: 71 },
    ], (g) => { F.dot(g, -R * 1.15, -R * 0.45, R * 0.06); F.dot(g, -R * 1.45, -R * 0.3, R * 0.07, "#2a201c"); g.strokeStyle = "rgba(60,40,30,.4)"; g.setLineDash([3, 3]); g.lineWidth = 1; g.beginPath(); g.moveTo(-R * 0.6, R * 0.0); g.lineTo(R * 1.0, R * 0.05); g.stroke(); });
  }
  SC.faces = {
    live,
    draw(g, w, h, s, st) {
      frameStart(st);
      const hots = [], U = Math.min(w, h);
      // steps 0–1: dog and wolf, the dog's brow lifts and the muscle shows
      const aF = E(cl(1 - (s - 1.85) / 0.3)) * (s < 0 ? E(cl(s + 1)) : 1);
      if (aF > 0.01) {
        const R = Math.min(U * 0.21, w * 0.17), y = h * 0.45;
        const dog = lazy(st, "dog", () => F.dog({ breed: "mutt", R, seed: 401, liveFace: true }));
        const wolf = lazy(st, "wolf", () => F.dog({ breed: "wolf", R, seed: 402, liveFace: true }));
        const brow = E(seg(s, 0.2, 0.8));
        if (dog) F.put(g, dog, w * 0.3, y, { a: aF, rot: -0.06 * brow, face: { brow } });
        if (wolf) F.put(g, wolf, w * 0.72, y, { a: aF, face: { brow: 0 } });
        lab(g, "dog", w * 0.3, y + R * 1.55, { align: "center", a: aF, color: INK });
        lab(g, "wolf", w * 0.72, y + R * 1.55, { align: "center", a: aF, color: INK });
        const aM = E(seg(s, 0.55, 1.0)) * aF;
        if (aM > 0.01) {
          for (const sx of [-1, 1]) {
            const ex = w * 0.3 + sx * R * 0.2, ey = y - R * 0.32;
            F.yarn(g, F.bow(ex, ey, ex + sx * R * 0.12, ey - R * 0.5, sx * R * 0.05, 10), { coat: F.coat("pink"), w: Math.max(3, R * 0.05), k: aM, seed: 3 + sx });
            g.save(); g.globalAlpha = aM * 0.6; g.setLineDash([2, 4]);
            F.hairline(g, F.bow(w * 0.72 + sx * R * 0.2, ey, w * 0.72 + sx * R * 0.3, ey - R * 0.35, sx * R * 0.04, 8), { w: 1, color: "#c0705e", taper: false, jit: 0.1 });
            g.restore();
          }
          lab(g, "LAOM: lifts the inner eyebrow", w * 0.3, y - R * 1.45, { align: "center", a: aM, color: INK });
          lab(g, "only scant fibres", w * 0.72, y - R * 1.45, { align: "center", a: aM, color: INK });
          hots.push({ x: w * 0.3, y: y - R * 0.5, r: R * 0.5, html: tip("Levator anguli oculi medialis", "Present in the 6 dogs dissected. The 4 wolves had only scant fibres. In tests, dogs raised the inner brow more, and harder, when a person looked at them.", "E15") });
        }
      }
      // step 2: 18 dogs, 15 go to the crying person
      const aP = E(seg(s, 1.8, 2.15)) * E(cl(1 - (s - 2.85) / 0.3));
      if (aP > 0.01) {
        const R = Math.max(10, U * 0.032), pr = U * 0.11, px = w * 0.8, py = h * 0.38;
        F.put(g, person(pr, true), px, py, { a: aP });
        const go = E(seg(s, 2.05, 2.7));
        for (let i = 0; i < 18; i++) {
          const sx = w * 0.1 + (i % 6) * R * 3, sy = h * 0.3 + Math.floor(i / 6) * R * 3.2;
          const moves = i < 15, tx = px - pr * 1.6 - (i % 5) * R * 2.3, ty = py + pr * 1.6 + Math.floor(i / 5) * R * 2.4;
          const x = moves ? sx + (tx - sx) * go : sx, yy = moves ? sy + (ty - sy) * go : sy;
          const sp = lazy(st, "m" + (i % 4), () => F.dog({ breed: ["mutt", "golden", "beagle", "collie"][i % 4], R, seed: 500 + (i % 4) }));
          if (sp) F.put(g, sp, x, yy, { a: aP });
        }
        const cx15 = w < 560 ? w / 2 : w * 0.32, mw15 = w < 560 ? w - 24 : w * 0.56;
        big(g, "15 of 18", cx15, h * 0.78, Math.max(24, U * 0.06), { a: aP });
        const h15 = lab(g, "dogs went to a person who was crying, a stranger as readily as their owner", cx15, h * 0.78 + 22, { align: "center", a: aP, color: INK, maxW: mw15 });
        lab(g, "and in a voice–face test, 17 dogs matched the emotion in 67% of trials", cx15, h * 0.78 + 26 + h15, { align: "center", a: aP, maxW: mw15 });
        hots.push({ x: px, y: py, r: pr, html: tip("Custance & Mayer 2012", "Owner or stranger cried, hummed or talked for 20 s. Dogs approached the crier, mostly with submissive behaviour.", "E9") });
      }
      // step 3: jealousy, 36 dogs and a stuffed rival
      const aJ = E(seg(s, 2.8, 3.15));
      if (aJ > 0.01) {
        const R = Math.max(9, U * 0.026), tr = U * 0.08;
        F.put(g, toyDog(tr), w * 0.78, h * 0.42, { a: aJ });
        lab(g, "a realistic stuffed dog, petted by the owner", w * 0.78, h * 0.42 + tr * 1.5, { align: "center", a: aJ });
        for (let i = 0; i < 36; i++) {
          const x = w * 0.1 + (i % 9) * R * 2.6, y = h * 0.28 + Math.floor(i / 9) * R * 2.9, snap = i % 4 === 1;
          const sp = lazy(st, "m" + (i % 4), () => F.dog({ breed: ["mutt", "golden", "beagle", "collie"][i % 4], R: Math.max(10, U * 0.032), seed: 500 + (i % 4) }));
          if (sp) F.put(g, sp, x + (snap ? R * 0.3 * E(seg(s, 3.1, 3.4)) : 0), y, { a: aJ * (snap ? 1 : 0.45), scale: R / Math.max(10, U * 0.032) });
          if (snap && s > 3.1) for (const [dx, dy, ex, ey] of [[0.7, -0.9, 1.0, -1.25], [0.95, -0.55, 1.35, -0.7]]) F.hairline(g, [[x + dx * R, y + dy * R], [x + ex * R, y + ey * R]], { w: 1.2, a: aJ, taper: false, jit: 0 });
        }
        big(g, "about 1 in 4", w * 0.3, h * 0.78, Math.max(24, U * 0.06), { a: aJ });
        lab(g, "of 36 dogs snapped at the stuffed rival · 1 dog did for a pail or a book", w * 0.3, h * 0.78 + 22, { align: "center", a: aJ, color: INK });
        hots.push({ x: w * 0.78, y: h * 0.42, r: tr * 1.3, html: tip("Harris & Prouvost 2014", "Owners petted a stuffed dog, a jack-o'-lantern pail, or read a pop-up book. About 25% of dogs snapped during the stuffed-dog condition.", "E17") });
      }
      return hots;
    },
  };

  /* ======================= 6 · CATS ======================= */
  function jar(g, x, y, r, a = 1) {
    g.save(); g.globalAlpha *= a;
    g.fillStyle = "rgba(200,215,220,.25)"; g.fillRect(x - r, y - r * 1.3, r * 2, r * 1.3);
    const c = "rgba(90,110,120,.7)";
    F.hairline(g, [[x - r, y - r * 1.3], [x - r, y], [x + r, y], [x + r, y - r * 1.3]], { w: 1.1, color: c, taper: false, jit: 0.1 });
    g.fillStyle = "rgba(120,80,45,.85)"; g.fillRect(x - r * 1.1, y - r * 1.45, r * 2.2, r * 0.18);
    g.restore();
    F.put(g, F.pom(r * 0.3, "ginger", 6), x, y - r * 0.35, { a });
  }
  const CATB = [
    { name: "Korat", short: "people-oriented", trait: "most people-oriented", o: { coat: "grey", seed: 601 } },
    { name: "Bengal", short: "very active", trait: "among the most active", o: { coat: "orange", seed: 602, spots: true } },
    { name: "Russian Blue", short: "shyest", trait: "shyest with strangers", o: { coat: "grey", seed: 603, face: { expr: "sleepy" } } },
    { name: "British Shorthair", short: "least active", trait: "least active, least contact", o: { coat: "grey", seed: 604, hair: 0.7 } },
    { name: "Turkish Van", short: "most aggressive", trait: "most aggressive", o: { coat: "white", seed: 605, van: true } },
  ];
  SC.cats = {
    live: (st, s) => live(st) || (s > 0.9 && s < 2.1),
    draw(g, w, h, s, st, t) {
      frameStart(st);
      const hots = [], U = Math.min(w, h);
      // step 0: 26 recruited cats, 7 walk away
      const a0 = E(cl(1 - (s - 0.85) / 0.3)) * (s < 0 ? E(cl(s + 1)) : 1);
      if (a0 > 0.01) {
        const R = Math.max(12, U * 0.04), cols = 9, gap = R * 2.9, gx = w / 2 - (cols - 1) * gap / 2, gy = h * 0.3;
        const go = E(seg(s, -0.2, 0.6));
        for (let i = 0; i < 26; i++) {
          const leave = [3, 7, 11, 15, 18, 22, 25].includes(i);
          let x = gx + (i % cols) * gap, y = gy + Math.floor(i / cols) * gap * 1.1;
          const sp = lazy(st, "c" + (i % 4), () => F.cat({ coat: ["cream", "grey", "orange", "dark"][i % 4], R, seed: 700 + (i % 4), face: (i % 4) === 3 ? { yellow: true } : {} }));
          let a = a0;
          if (leave) { x += go * (w - x + R * 3); a *= 1 - go * 0.9; }
          if (sp) F.put(g, sp, x, y, { a, flip: leave && go > 0.05 });
        }
        big(g, "7 of 26", w / 2, h * 0.76, Math.max(24, U * 0.06), { a: a0 });
        lab(g, "recruited cats dropped out before testing · 14 cats and 14 dogs were analysed", w / 2, h * 0.76 + 22, { align: "center", a: a0, color: INK });
      }
      // step 1: the unsolvable box
      const a1 = E(seg(s, 0.85, 1.15)) * E(cl(1 - (s - 1.85) / 0.3));
      if (a1 > 0.01) {
        const R = U * 0.1, fy = h * 0.62, jr = U * 0.05;
        ruleLine(g, w * 0.05, fy, w * 0.95, fy, 0.3 * a1);
        const dog = lazy(st, "dogS", () => F.dog({ breed: "golden", R, seed: 711, sit: true, liveFace: true }));
        const cat = lazy(st, "catS", () => F.cat({ coat: "cream", R: R * 0.9, seed: 712, sit: true, liveFace: true, patches: (x, y) => (x > R * 0.2 && y < -R * 0.1 ? "ginger" : null) }));
        const turn = E(seg(s, 1.15, 1.5));
        jar(g, w * 0.22, fy, jr, a1); jar(g, w * 0.7, fy, jr, a1);
        if (dog) F.put(g, dog, w * 0.34, fy - R * 2.45, { a: a1, rot: -0.15 * turn, face: { look: -1.8 * turn, brow: turn * 0.6 } });
        const paw = Math.sin(t / 260) * 0.5 + 0.5;
        if (cat) {
          F.put(g, cat, w * 0.8, fy - R * 0.9 * 2.45, { a: a1, face: { look: -1.2 } });
          F.put(g, F.pom(R * 0.18, "cream", 7), w * 0.7 + jr * 1.4 - paw * jr * 0.4, fy - jr * (0.6 + paw * 0.7), { a: a1 });
        }
        // a person at the far left, half in frame
        F.put(g, person(U * 0.09, false), w * 0.04, fy - U * 0.26, { a: a1 * turn });
        const r = Math.max(3.5, U * 0.011), gp = r * 2.6;
        for (let i = 0; i < 14; i++) F.put(g, F.pom(r, i < 12 ? "ginger" : "cream", 3 + (i % 2)), w * 0.28 - 7 * gp + i * gp + r, fy + 40, { a: a1 * E(seg(s, 1.3, 1.6)) });
        for (let i = 0; i < 14; i++) F.put(g, F.pom(r, i < 6 ? "ginger" : "cream", 3 + (i % 2)), w * 0.75 - 7 * gp + i * gp + r, fy + 40, { a: a1 * E(seg(s, 1.3, 1.6)) });
        lab(g, "12 of 14 dogs looked back at a person", w * 0.28, fy + 64, { align: "center", a: a1 * E(seg(s, 1.3, 1.6)), color: INK });
        lab(g, "6 of 14 cats did · the rest kept trying", w * 0.75, fy + 64, { align: "center", a: a1 * E(seg(s, 1.3, 1.6)), color: INK });
        hots.push({ x: w * 0.7, y: fy - jr, r: jr * 2, html: tip("The unsolvable task", "Food in a box that cannot be opened. Dogs alternated gaze between food and human more, and sooner. Cats spent longer trying.", "C1") });
      }
      // step 2: attachment
      const a2 = E(seg(s, 1.85, 2.15)) * E(cl(1 - (s - 2.85) / 0.3));
      if (a2 > 0.01) {
        const r = Math.max(4, U * 0.017), gap = r * 2.6, gx = w * 0.46, gy = h * 0.28;
        const k = Math.round(45 * E(seg(s, 2.0, 2.6)));
        for (let i = 0; i < 70; i++) F.put(g, F.pom(r, i < k ? "pink" : "cream", 30 + (i % 4)), gx + (i % 10) * gap + r, gy + Math.floor(i / 10) * gap + r, { a: a2 });
        lab(g, "70 kittens · 45 securely attached (64.3%)", gx, gy + 7 * gap + 18, { a: a2, color: INK });
        for (let i = 0; i < 100; i++) if (i % 10 < 10 && i < 100) {}
        const ix = gx, iy = gy + 7 * gap + 50;
        for (let i = 0; i < 20; i++) F.put(g, F.pom(r, i < 13 ? "pink" : "cream", 40 + (i % 3)), ix + (i % 10) * gap + r, iy + Math.floor(i / 10) * gap, { a: a2 * 0.85 });
        lab(g, "human infants · about 65%", ix, iy + 2 * gap + 12, { a: a2 });
        const kit = lazy(st, "kit", () => F.cat({ coat: "orange", R: U * 0.1, seed: 721, sit: true, patches: (x, y) => (Math.sin((x * 0.6 + y) / (U * 0.012)) > 0.5 ? "ginger" : null), face: { expr: "happy" } }));
        if (kit) F.put(g, kit, w * 0.22, h * 0.36, { a: a2 });
        hots.push({ x: w * 0.22, y: h * 0.45, r: U * 0.12, html: tip("Secure base test", "2 minutes with the owner, 2 alone, 2 reunited. Secure kittens greeted the owner, then went back to exploring. 65.8% of 38 adult cats were secure too.", "C7, C8") });
      }
      // step 3: cat breeds, temperament not IQ
      const a3 = E(seg(s, 2.8, 3.15));
      if (a3 > 0.01) {
        const R = Math.min(w * 0.065, h * 0.1), step = w * 0.86 / 5, y = h * 0.42;
        CATB.forEach((b, i) => {
          const x = w * 0.07 + step * (i + 0.5);
          const o = Object.assign({ R, sit: false }, b.o);
          if (b.o.spots) o.patches = (px, py) => (Math.sin(px / (R * 0.17)) * Math.sin(py / (R * 0.17)) > 0.55 ? "choc" : null);
          if (b.o.van) o.patches = (px, py) => (py < -R * 0.45 && Math.abs(px) > R * 0.12 ? "ginger" : null);
          delete o.spots; delete o.van;
          const sp = lazy(st, "b" + i, () => F.cat(o));
          const ai = a3 * E(seg(s, 2.85 + i * 0.06, 3.15 + i * 0.06));
          if (sp) F.put(g, sp, x, y, { a: ai, rot: (i % 2 ? 0.08 : -0.08) });
          big(g, b.name, x, y + R * 1.55, Math.min(17, step * 0.1), { a: ai });
          lab(g, b.short, x, y + R * 1.55 + 18, { align: "center", a: ai, size: 10, maxW: step * 0.94 });
          hots.push({ x, y, r: R * 1.1, html: tip(b.name, `In 5,726 Finnish cats of 40 breeds: ${b.trait}. Temperament, owner-rated. No cognitive trait was measured.`, "C15") });
        });
        lab(g, "breeds differ in temperament · no study has ranked cat breeds by intelligence", w / 2, h * 0.16, { align: "center", a: a3, color: INK });
      }
      return hots;
    },
  };

  /* ======================= 7 · BRAINS ======================= */
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
  SC.brains = {
    live,
    draw(g, w, h, s, st) {
      frameStart(st);
      const hots = [], U = Math.min(w, h), B = D.brains;
      const cols = [{ b: B[0], x: 0.2, k: "cat" }, { b: B[1], x: 0.47, k: "dog" }, { b: B[3], x: 0.79, k: "bear" }];
      const base = Math.min(U * 0.105, w * 0.075), by = h * 0.3;
      cols.forEach((c, i) => {
        const a = i < 2 ? (s < 0 ? E(cl(s + 1)) : 1) : E(seg(s, 1.85, 2.25));
        if (a <= 0.01) return;
        const R = base * Math.cbrt(c.b.brain / B[0].brain);
        const x = w * c.x;
        F.put(g, brain(R, 81 + i), x, by + (R - base) * 0.3, { a });
        big(g, `${Math.round(c.b.brain)} g`, x, by + R * 0.75 + base * 0.2 + 30, Math.max(18, U * 0.036), { a });
        lab(g, c.b.name.replace(" (avg of 2)", ", average of two"), x, by + R * 0.75 + base * 0.2 + 48, { align: "center", a, color: INK });
        if (i < 2) lab(g, `EQ ${c.b.eq}`, x, by - R - 18, { align: "center", a: a * E(cl(1 - (s - 0.9) / 0.4)), color: INK });
        // neuron grains: one per 10 million cortical neurons
        const ag = E(seg(s, 0.85 + (i === 2 ? 1.1 : 0), 1.2 + (i === 2 ? 1.1 : 0)));
        if (ag > 0.01) {
          const n = Math.round(c.b.neurons / 10), shown = Math.round(n * E(seg(s, 0.9 + (i === 2 ? 1.1 : 0), 1.6 + (i === 2 ? 1.1 : 0)))), r = Math.max(3.5, U * 0.011), gap = r * 2.3, per = 9;
          const jx = x - (per * gap) / 2, jy = h * 0.84;
          F.hairline(g, [[jx - 6, jy - 8 * gap - 6], [jx - 6, jy + 4], [jx + per * gap + 4, jy + 4], [jx + per * gap + 4, jy - 8 * gap - 6]], { w: 1.1, color: "rgba(90,110,120,.6)", a: ag, taper: false, jit: 0.1 });
          for (let j = 0; j < shown; j++) F.put(g, F.pom(r, "dark", 50 + (j % 3)), jx + (j % per) * gap + r, jy - Math.floor(j / per) * gap - r, { a: ag });
          lab(g, w < 560 ? `${c.b.neurons} M neurons` : `${c.b.neurons} million cortical neurons`, x, jy + 22, { align: "center", a: ag, color: INK, maxW: per * gap + 24 });
        }
        hots.push({ x, y: by, r: R, html: tip(c.b.name, `Brain ${c.b.brain} g, body ${c.b.body} kg, cortex ${c.b.neurons} million neurons.${i === 0 ? " One cat was counted." : i === 1 ? " Two dogs: a 32 kg golden retriever (627 M) and a 7.45 kg mixed breed (429 M)." : " One bear."}`, c.b.src) });
      });
      if (s > 0.85) lab(g, "● = 10 million neurons", w * 0.5, h * 0.95, { align: "center", a: E(seg(s, 0.85, 1.2)) });
      return hots;
    },
  };

  window.SceneKit = { compose, lab, big, pomGrid, ruleLine, crate, horse, hand, cup };
})();
