/* Lucky · style: a lab notebook. Graph paper, black ink blots for people, glossy
   green and red ink for luck, a blue pen for emphasis, a yellow highlighter.
   Implements the explainer kit's style contract (see explainer-kit/README.md). */
(function () {
  "use strict";
  const COL = { ink: "#1d1b18", accent: "#2f5fb3", muted: "#8a8174", good: "#12a15a", bad: "#e0402f", hl: "#ffe25e", paper: "#f5f1e6" };
  const FONT = { display: ["Fraunces", 900], body: ['"Source Serif 4"', 400], mono: ['"JetBrains Mono"', 500] };
  const RIM = { ink: "#000", good: "#0b5e35", bad: "#9a2416", accent: "#1d3f80", muted: "#5c554c", hl: "#d9b520" };

  // graph paper, drawn once
  const paper = document.createElement("canvas"); paper.width = 1920; paper.height = 1080;
  { const p = paper.getContext("2d"); p.fillStyle = COL.paper; p.fillRect(0, 0, 1920, 1080); p.strokeStyle = "rgba(52,86,140,0.09)"; p.lineWidth = 1.5; for (let x = 0; x <= 1920; x += 40) { p.beginPath(); p.moveTo(x + 0.5, 0); p.lineTo(x + 0.5, 1080); p.stroke(); } for (let y = 0; y <= 1080; y += 40) { p.beginPath(); p.moveTo(0, y + 0.5); p.lineTo(1920, y + 0.5); p.stroke(); } }

  // inked blots: an irregular disc, ink pooled at the rim, a lifted highlight, paper specks
  const sprites = new Map();
  const rnd = (seed) => { let a = seed * 9301 + 49297; return () => ((a = (a * 9301 + 49297) % 233280) / 233280); };
  function blot(role, r, v = 0) {
    const rb = r < 8 ? Math.max(0.5, Math.round(r * 4) / 4) : Math.round(r), key = `${role}|${rb}|${v & 3}`;
    let s = sprites.get(key); if (s) return s;
    const pad = 3 + rb * 0.2, size = Math.ceil((rb + pad) * 2), c = document.createElement("canvas"); c.width = c.height = size;
    const g = c.getContext("2d"), m = size / 2, R = rb, R2 = rnd((v & 3) * 31 + Math.round(rb * 8) + role.length * 7);
    const shape = (rr) => { g.beginPath(); const ph = R2() * 6.28; for (let i = 0; i <= 26; i++) { const t = (i / 26) * Math.PI * 2, w = rr * (1 + 0.06 * Math.sin(t * 3 + ph) + 0.035 * Math.sin(t * 5 + ph * 2)); const x = m + Math.cos(t) * w, y = m + Math.sin(t) * w; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); };
    shape(R); g.fillStyle = COL[role] || COL.ink; g.globalAlpha = role === "ink" ? 0.9 : 0.88; g.fill();
    if (R > 2.2) { g.globalAlpha = 0.55; g.strokeStyle = RIM[role] || "#000"; g.lineWidth = Math.max(0.8, R * 0.14); shape(R * 0.94); g.stroke(); }
    if (R > 3.5) { g.globalAlpha = role === "ink" ? 0.14 : 0.24; g.fillStyle = "#fff"; g.beginPath(); g.ellipse(m - R * 0.3, m - R * 0.32, R * 0.32, R * 0.2, -0.6, 0, 6.3); g.fill(); }
    g.globalAlpha = 1; g.globalCompositeOperation = "destination-out";
    const n = Math.round(R * R * 0.08);
    for (let i = 0; i < n; i++) { const a = R2() * 6.28, d = Math.sqrt(R2()) * R * 0.92; g.beginPath(); g.arc(m + Math.cos(a) * d, m + Math.sin(a) * d, Math.max(0.4, R2() * 0.9), 0, 6.3); g.fill(); }
    s = { c, size, k: rb }; sprites.set(key, s); return s;
  }

  window.makeLuckStyle = function (canvas) {
    const B = window.ExplainerStage.Layers(canvas, ["main"]), g = B.L.main;
    const A = () => B.alphaNow();
    const col = (role) => COL[role] || role;
    const path = (pts) => { if (pts instanceof Path2D) return pts; const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return p; };
    const S = Object.assign(B, {
      COL,
      begin() { B.clearLayers(); },
      end() { B.ctx.setTransform(1, 0, 0, 1, 0, 0); B.ctx.globalAlpha = 1; B.ctx.drawImage(paper, 0, 0); B.ctx.drawImage(g.canvas, 0, 0); },
      fill(role, pts, a = 1) { g.globalAlpha = A() * a * (role === "hl" ? 0.75 : 0.92); g.fillStyle = col(role); g.fill(path(pts)); g.globalAlpha = 1; },
      // a pen line: tiny stable wobble, round ends, a second thinner pass
      line(role, pts, w = 3, o = {}) {
        if (pts.length < 2 || A() < 0.003) return;
        g.strokeStyle = col(role); g.lineCap = "round"; g.lineJoin = "round";
        for (let pass = 0; pass < 2; pass++) {
          g.globalAlpha = A() * (o.a ?? 1) * (pass ? 0.35 : 0.9); g.lineWidth = pass ? w * 0.5 : w; g.beginPath();
          pts.forEach(([x, y], i) => { const j = Math.sin(x * 0.05 + y * 0.07 + pass) * (w * 0.12); i ? g.lineTo(x + j, y - j) : g.moveTo(x + j, y); });
          g.stroke();
        }
        g.globalAlpha = 1;
      },
      circle(role, x, y, r, a = 1) { if (r <= 0) return; g.globalAlpha = A() * a; g.fillStyle = col(role); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; },
      mark(role, x, y, r, a = 1, v) { if (r < 0.4) return; const s = blot(COL[role] ? role : "ink", r, v ?? Math.round(x * 7 + y * 3)), k = r / s.k; g.globalAlpha = A() * a; g.drawImage(s.c, x - (s.size * k) / 2, y - (s.size * k) / 2, s.size * k, s.size * k); g.globalAlpha = 1; },
      text(role, s, x, y, o = {}) {
        if (A() * (o.a ?? 1) <= 0.003 || !s) return;
        const [fam, wt] = FONT[o.font || "display"]; g.font = `${o.weight || wt} ${o.size || 48}px ${fam}`;
        g.textAlign = o.align || "center"; g.textBaseline = o.base || "alphabetic"; g.globalAlpha = A() * (o.a ?? 1); g.fillStyle = col(role); g.fillText(s, x, y); g.globalAlpha = 1;
      },
      measure(s, size, font = "display") { const [fam, wt] = FONT[font]; g.font = `${wt} ${size}px ${fam}`; return g.measureText(s).width; },
      // a highlighter swipe behind text
      highlight(x, y, w, h, k = 1) { g.globalAlpha = A() * 0.7; g.fillStyle = COL.hl; g.beginPath(); g.moveTo(x, y + h * 0.15); g.lineTo(x + w * k, y); g.lineTo(x + w * k + 6, y + h * 0.9); g.lineTo(x + 4, y + h); g.closePath(); g.fill(); g.globalAlpha = 1; },
      prop(name, x, y, size, t) {
        const P = PROPS[name]; if (!P) return false;
        S.save(); S.translate(x, y); S.scale(size, size); P(S, t); S.restore(); return true;
      },
    });
    return S;
  };

  /* ---------- props: drawn around (0,0), about 400 units tall ---------- */
  const PROPS = {
    person(S) { S.mark("ink", 0, 20, 120, 1, 1); },
    greenball(S, t) { S.mark("good", Math.sin(t * 1.5) * 8, 0, 140, 1, 2); },
    redball(S, t) { S.mark("bad", Math.sin(t * 1.5) * 8, 0, 140, 1, 3); },
    coins(S, t) {
      const n = 6;
      for (let i = 0; i < n; i++) { const k = Math.min(1, Math.max(0, t * 3 - i * 0.3)); if (!k) break; const y = 160 - i * 46 - (1 - k) * 60; S.fill("hl", ellipse(0, y, 130, 34)); S.line("ink", arcPts(0, y, 130, 34, 0, Math.PI * 2, 28), 4); }
    },
    bell(S) {
      const pts = []; for (let i = 0; i <= 60; i++) { const x = -200 + (i / 60) * 400, u = (x / 400) * 8; pts.push([x, 160 - Math.exp(-u * u / 2) * 300]); }
      S.fill("muted", [...pts, [200, 160], [-200, 160]], 0.25); S.line("ink", pts, 5); S.line("ink", [[-210, 162], [210, 162]], 4);
    },
    world(S, t) {
      S.line("ink", [[-190, -190], [190, -190], [190, 190], [-190, 190], [-190, -190]], 4);
      for (let i = 0; i < 70; i++) { const x = -175 + ((i * 97) % 350), y = -175 + ((i * 61) % 350); S.mark("ink", x, y, 4 + (i % 4), 1, i); }
      for (let i = 0; i < 14; i++) { const a = t * 0.6 + i; S.mark(i % 2 ? "good" : "bad", -160 + ((i * 73) % 320) + Math.sin(a) * 8, -160 + ((i * 41) % 320) + Math.cos(a) * 8, 10, 1, i); }
    },
    versusA(S) { S.mark("ink", 0, 0, 170, 1, 1); },
    versusB(S) { S.mark("ink", 0, 60, 70, 0.6, 2); },
    dice(S, t) {
      S.save(); S.rotate(Math.sin(t * 2) * 0.08);
      S.fill("paper", [[-150, -150], [150, -150], [150, 150], [-150, 150]], 1); S.line("ink", [[-150, -150], [150, -150], [150, 150], [-150, 150], [-150, -150]], 6);
      [[-80, -80], [80, -80], [0, 0], [-80, 80], [80, 80]].forEach(([x, y]) => S.mark("ink", x, y, 26, 1, 5));
      S.restore();
    },
  };
  function ellipse(cx, cy, rx, ry) { return arcPts(cx, cy, rx, ry, 0, Math.PI * 2, 28); }
  function arcPts(cx, cy, rx, ry, a0, a1, n) { return Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * (i / n); return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; }); }
  window.LuckShapes = { arcPts, ellipse, COL };
})();
