/* Fibre by Fibre · style: the essay's pen-and-watercolour, on the workshop's
   grey-cyan page. Two layers per frame, as in the essay's film: blotchy
   watercolour washes (multiplied) under fine, wobbly, grainy pen lines drawn
   with the essay's own Pen and Hands (lib/). Palette after the reference
   sketches: sage, lemon, cobalt, sky, bark. Implements the explainer kit's
   style contract. */
(function () {
  "use strict";
  const P = window.Paper, N = P.makeNoise(11), clamp = P.clamp;
  const RGB = { ink: "26,25,28", sage: "143,172,120", yellow: "238,221,104", cobalt: "46,88,160", sky: "196,222,240", bark: "214,190,140", paper: "250,249,245", muted: "134,134,139", grey: "120,120,126" };
  const TXT = { ink: "#1d1d1f", accent: "#2e58a0", muted: "#86868b", paper: "#fafaf5" };
  const COL = { ink: "#1a191c", accent: "#2e58a0", muted: "#86868b", paper: "#fafaf5", sage: "#8fac78", yellow: "#eedd68", sky: "#c4def0", bark: "#d6be8c" };
  const FONT = { display: ["Barlow", 600], body: ["Barlow", 400], mono: ['"IBM Plex Mono"', 400] };

  // the page: soft grey-to-cyan gradient with fine grain, like the essay and workshop site
  const page = document.createElement("canvas"); page.width = 1920; page.height = 1080;
  {
    const p = page.getContext("2d"), gr = p.createLinearGradient(0, 0, 1920, 1080 * 0.7);
    gr.addColorStop(0, "#f2f2f2"); gr.addColorStop(1, "#f5feff"); p.fillStyle = gr; p.fillRect(0, 0, 1920, 1080);
    const d = p.getImageData(0, 0, 1920, 1080), r = P.mulberry32(2);
    for (let i = 0; i < d.data.length; i += 4) { const n = (r() - 0.5) * 9; d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n; }
    p.putImageData(d, 0, 0);
  }
  // watercolour blotch mask: pigment pooling plus granulation (tiles)
  const washTile = (() => {
    const S = 256, c = document.createElement("canvas"); c.width = c.height = S;
    const g = c.getContext("2d"), im = g.createImageData(S, S), Nt = P.makeNoise(31);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const u = x / S, v = y / S, j = (y * S + x) * 4;
      im.data[j + 3] = Math.round(255 * clamp(0.72 + 0.5 * Nt.fbm(u * 3 + 11, v * 3, 4, 3) + 0.12 * Nt.fbm(u * 64, v * 64 + 5, 2, 64)));
    }
    g.putImageData(im, 0, 0); return c;
  })();

  window.makePaperStyle = function (canvas) {
    const B = window.ExplainerStage.Layers(canvas, ["col", "ink"]), ink = B.L.ink, col = B.L.col, A = () => B.alphaNow();
    ink.__ink = window.Pen.inkPattern(ink, [26, 25, 28], 0.9);
    const washPat = col.createPattern(washTile, "repeat");
    let boil = 0;
    const rgb = (role) => RGB[role] || (role === "accent" ? RGB.cobalt : role);
    const toPts = (pts) => (pts instanceof Path2D ? null : pts);
    const jit = (x, y, i, amp) => [x + N.noise(i * 0.71 + 3.1, 0) * amp, y + N.noise(i * 0.53 + 9.7, 4) * amp];

    const S = Object.assign(B, {
      COL, RGB,
      begin(t) { B.clearLayers(); boil = Math.floor((t || 0) * 6) * 0.35; ink.lineCap = col.lineCap = "round"; ink.lineJoin = col.lineJoin = "round"; },
      end() {
        col.save(); col.setTransform(1, 0, 0, 1, 0, 0); col.globalAlpha = 1; col.globalCompositeOperation = "destination-in"; col.fillStyle = washPat; col.fillRect(0, 0, 1920, 1080); col.restore();
        const c = B.ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.drawImage(page, 0, 0);
        c.globalCompositeOperation = "multiply"; c.drawImage(col.canvas, 0, 0); c.globalCompositeOperation = "source-over"; c.drawImage(ink.canvas, 0, 0);
      },
      // a watercolour wash: a flat fill whose edge pools a little darker. "paper" is opaque and covers lines behind it.
      fill(role, pts, a = 1) {
        if (A() * a <= 0.003) return;
        if (role === "paper") { col.globalAlpha = A() * a; col.fillStyle = "#fbfbf8"; col.fill(pts instanceof Path2D ? pts : S.path(pts)); col.globalAlpha = 1; return; }
        const c = rgb(role), op = role === "ink" ? 0.62 : role === "muted" ? 0.4 : 0.78, p = pts instanceof Path2D ? pts : S.path(pts, 1.6);
        col.globalAlpha = A(); col.fillStyle = `rgba(${c},${op * a})`; col.fill(p);
        col.lineWidth = 3.4; col.strokeStyle = `rgba(${c},${Math.min(1, op * a * 0.75)})`; col.stroke(p); col.globalAlpha = 1;
      },
      path(pts, amp = 0) { const p = new Path2D(); pts.forEach(([x, y], i) => { const [a, b] = amp ? jit(x, y, i, amp) : [x, y]; i ? p.lineTo(a, b) : p.moveTo(a, b); }); p.closePath(); return p; },
      // a pen line: the essay's textured nib. o: { k reveal, seed, a, jit, close }
      line(role, pts, w = 2.6, o = {}) {
        if (!pts || pts.length < 2 || A() * (o.a ?? 1) < 0.003) return;
        const c = role === "ink" || !role ? null : TXT[role] || role;
        const pp = o.close ? pts.concat([pts[0]]) : pts;
        window.Pen.ink(ink, pp, { w: Math.min(w, 6) * 0.95, k: o.k ?? 1, seed: o.seed || 0, a: (o.a ?? 0.92), jit: o.jit ?? 1.1, boil, color: c, bleed: w > 1.6 });
      },
      circle(role, x, y, r, a = 1) { if (r > 0) S.fill(role, S.ellipse(x, y, r, r, 0, 6.2832, 40), a); },
      // a dot: cobalt for the accent (like the reference drops), solid ink otherwise
      mark(role, x, y, r, a = 1) {
        if (r <= 0) return;
        if (role === "ink") { ink.globalAlpha = A() * a * 0.92; ink.fillStyle = ink.__ink; ink.beginPath(); ink.arc(x, y, r, 0, 6.2832); ink.fill(); ink.globalAlpha = 1; return; }
        const pts = []; for (let i = 0; i <= 18; i++) { const t = (i / 18) * 6.2832, rr = r * (1 + 0.1 * N.noise(x * 0.01 + Math.cos(t), y * 0.01 + Math.sin(t))); pts.push([x + Math.cos(t) * rr, y + Math.sin(t) * rr]); }
        const c = rgb(role === "wash" ? "muted" : role); col.globalAlpha = A(); col.fillStyle = `rgba(${c},${0.9 * a})`; col.fill(S.path(pts)); col.globalAlpha = 1;
      },
      text(role, s, x, y, o = {}) {
        if (A() * (o.a ?? 1) <= 0.003 || !s) return;
        const [fam, wt] = FONT[o.font || "display"]; ink.font = `${o.weight || wt} ${o.size || 48}px ${fam}`;
        ink.textAlign = o.align || "center"; ink.textBaseline = o.base || "alphabetic"; ink.globalAlpha = A() * (o.a ?? 1);
        ink.fillStyle = TXT[role] || COL[role] || role; ink.fillText(s, x, y); ink.globalAlpha = 1;
      },
      measure(s, size, font = "display") { const [fam, wt] = FONT[font]; ink.font = `${wt} ${size}px ${fam}`; return ink.measureText(s).width; },
      prop(name, x, y, size, t) { const Pr = PROPS[name]; if (!Pr) return false; S.save(); S.translate(x, y); S.scale(size, size); Pr(S, t || 0); S.restore(); return true; },

      /* ---- the essay's drawing vocabulary ---- */
      spline(cp, per = 12) {
        const out = [];
        for (let i = 0; i < cp.length - 1; i++) {
          const p0 = cp[Math.max(0, i - 1)], p1 = cp[i], p2 = cp[i + 1], p3 = cp[Math.min(cp.length - 1, i + 2)];
          for (let s = 0; s < per; s++) { const t = s / per, t2 = t * t, t3 = t2 * t; out.push([0, 1].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3))); }
        }
        out.push(cp[cp.length - 1]); return out;
      },
      ellipse(cx, cy, rx, ry, a0 = 0, a1 = Math.PI * 2, n = 48) { const out = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return out; },
      // a sheet of paper, slightly skewed, with an optional wash and faint laid lines
      sheet(cx, cy, w, h, o = {}) {
        const sk = o.skew ?? 0.02, pts = [[cx - w / 2, cy - h / 2 + w * sk], [cx + w / 2, cy - h / 2], [cx + w / 2 - w * sk, cy + h / 2], [cx - w / 2, cy + h / 2 - w * sk * 0.4]];
        S.fill("paper", pts, o.a ?? 1);
        if (o.wash) S.fill(o.wash, pts, o.washA ?? 0.5);
        const laid = o.laid || 0;
        if (laid > 0) {
          for (let y = cy - h / 2 + 14; y < cy + h / 2 - 8; y += 11) S.line("muted", [[cx - w / 2 + 10, y], [cx + w / 2 - 10, y]], 0.9, { a: 0.35 * laid, jit: 0.5, seed: y });
          for (let x = cx - w / 2 + 50; x < cx + w / 2 - 10; x += 120) S.line("ink", [[x, cy - h / 2 + 8], [x, cy + h / 2 - 8]], 1.4, { a: 0.45 * laid, seed: x });
        }
        S.line("ink", pts, o.w || 2.4, { close: true, seed: o.seed || Math.round(cx), k: o.k });
        return pts;
      },
      // tiny face: dot eyes, a smile (the vat in the essay has one)
      face(x, y, s = 1, mood = "smile") {
        S.mark("ink", x - 12 * s, y, 3.2 * s); S.mark("ink", x + 12 * s, y, 3.2 * s);
        if (mood === "smile") S.line("ink", S.ellipse(x, y + 5 * s, 9 * s, 7 * s, 0.4, Math.PI - 0.4, 10), 1.8, { jit: 0.3 });
        if (mood === "o") S.line("ink", S.ellipse(x, y + 12 * s, 4 * s, 4.6 * s, 0, 6.3, 12), 1.8, { jit: 0.3 });
      },
      sparkle(x, y, r, a = 0.85) { const pts = []; for (let i = 0; i <= 8; i++) { const ang = (i / 8) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.22 : r; pts.push([x + Math.cos(ang) * rr, y + Math.sin(ang) * rr]); } S.line("ink", pts, 1.8, { a, jit: 0.3 }); },
      // the essay's hands: kind grip | pinch | flat; the held object runs along local y
      hand(x, y, rot = 0, s = 1, flip = 1, kind = "grip") { S.save(); S.translate(x, y); S.scale(1.9, 1.9); window.Hands[kind](ink, 0, 0, { rot, s, flip, seed: Math.round(x + y), boil }); S.restore(); },
      label(s, x, y, o = {}) { S.text("muted", s, x, y, { size: o.size || 26, font: "mono", align: o.align || "left", a: o.a }); },
      leader(x0, y0, x1, y1, a = 0.55) { S.line("ink", [[x0, y0], [x1, y1]], 1.3, { a, jit: 0.5 }); },
      fibre(x, y, len, a, bend, w = 1.8, alpha = 0.8, seed = 0) { const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8 - 0.5, aa = a + bend * t; pts.push([x + Math.cos(aa) * len * t, y + Math.sin(aa) * len * t + Math.sin(t * 3 + seed) * 3]); } S.line("ink", pts, w, { a: alpha, jit: 0.6, seed }); },
    });
    return S;
  };

  const PROPS = {
    sheet(S) { S.sheet(0, 0, 360, 440, { laid: 1, wash: "bark", washA: 0.25 }); S.face(0, 40, 1.4); },
    fibre(S) { for (let i = 0; i < 9; i++) S.fibre(-10 + (i % 3) * 20, -150 + i * 34, 340, -0.1 + (i % 4) * 0.08, 0.3 - i * 0.05, 2.4, 0.85, i); },
    mould(S) { S.fill("sky", [[-220, 40], [220, 40], [210, 160], [-210, 160]], 0.7); S.line("ink", [[-200, -140], [200, -140], [200, 140], [-200, 140]], 3, { close: true }); for (let x = -150; x <= 150; x += 50) S.line("ink", [[x, -140], [x, 140]], 1.4, { a: 0.6, seed: x }); S.face(0, 0, 1.4); },
    brush(S) { S.line("ink", [[-40, -220], [30, 40]], 3); S.fill("cobalt", [[18, 30], [50, 34], [56, 120], [40, 160], [26, 110]], 0.9); S.line("ink", [[18, 30], [50, 34], [56, 120], [40, 160], [26, 110]], 2, { close: true }); S.hand(-14, -110, -0.26, 1.1, 1, "pinch"); },
    drop(S, t) { const r = 60 + Math.min(1, t) * 70; S.circle("cobalt", 0, 0, r * 0.7, 0.85); for (let i = 0; i < 14; i++) { const a = (i / 14) * 6.28; S.fibre(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7, r * 0.5, a, 0.3, 1.6, 0.7, i); } },
    seal(S) { S.circle("cobalt", 0, 0, 120, 0.9); S.sparkle(150, -130, 30); },
    versusA(S, t) { S.sheet(0, 0, 380, 460); const r = 50 + Math.min(1, t * 0.6) * 110; S.circle("cobalt", 0, -40, r * 0.62, 0.8); for (let i = 0; i < 18; i++) { const a = (i / 18) * 6.28; S.fibre(Math.cos(a) * r * 0.62, -40 + Math.sin(a) * r * 0.62, r * 0.45, a, 0.4, 1.6, 0.7, i); } },
    versusB(S) { S.sheet(0, 0, 380, 460); S.circle("cobalt", 0, -40, 56, 0.95); },
  };
})();
