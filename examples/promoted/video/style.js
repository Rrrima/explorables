/* Promoted · style: black crayon on white. Built on crayon.js (wax texture,
   double-pass strokes, slouchy office workers). Roles: ink, accent (the red crayon),
   muted. Implements the explainer kit's style contract. */
(function () {
  "use strict";
  const K = window.Crayon;
  const COL = { ink: "#1a1816", accent: "#d6402a", muted: "#8c857c", paper: "#fcfbf8" };
  const FONT = { display: ['"Caveat Brush"', 400], body: ["Literata", 400], mono: ['"IBM Plex Mono"', 500] };
  const wax = (role) => (role === "accent" || role === "red" ? "red" : "ink");

  // paper with a faint tooth
  const paper = document.createElement("canvas"); paper.width = 1920; paper.height = 1080;
  { const p = paper.getContext("2d"); p.fillStyle = COL.paper; p.fillRect(0, 0, 1920, 1080); const d = p.getImageData(0, 0, 1920, 1080); let s = 11; for (let i = 0; i < d.data.length; i += 4) { s = (s * 16807) % 2147483647; const n = (s / 2147483647 - 0.5) * 10; d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n; } p.putImageData(d, 0, 0); }

  window.makePeterStyle = function (canvas) {
    const B = window.ExplainerStage.Layers(canvas, ["main"]), g = B.L.main, A = () => B.alphaNow();
    const circlePts = (x, y, r, n = 22) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2, w = 1 + 0.05 * Math.sin(a * 3 + x); return [x + Math.cos(a) * r * w, y + Math.sin(a) * r * w]; });
    const S = Object.assign(B, {
      COL,
      begin() { B.clearLayers(); },
      end() { B.ctx.setTransform(1, 0, 0, 1, 0, 0); B.ctx.globalAlpha = 1; B.ctx.drawImage(paper, 0, 0); B.ctx.drawImage(g.canvas, 0, 0); },
      fill(role, pts, a = 1) { if (pts instanceof Path2D) { g.globalAlpha = A() * a; g.fillStyle = COL[role] || role; g.fill(pts); g.globalAlpha = 1; return; } if (role === "paper") { g.globalAlpha = A() * a; g.fillStyle = COL.paper; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.fill(); g.globalAlpha = 1; return; } g.globalAlpha = A(); K.fill(g, pts, wax(role), a * (role === "muted" ? 0.35 : 1)); g.globalAlpha = 1; },
      line(role, pts, w = 3, o = {}) { if (A() < 0.003) return; g.globalAlpha = A(); K.line(g, pts, w, wax(role), (o.a ?? 1) * (role === "muted" ? 0.4 : 1)); g.globalAlpha = 1; },
      circle(role, x, y, r, a = 1) { if (r > 0) S.fill(role, circlePts(x, y, r, r > 30 ? 40 : 22), a); },
      mark(role, x, y, r, a = 1) { S.circle(role, x, y, r, a); },
      text(role, s, x, y, o = {}) {
        if (A() * (o.a ?? 1) <= 0.003 || !s) return;
        const [fam, wt] = FONT[o.font || "display"]; g.font = `${o.weight || wt} ${o.size || 48}px ${fam}`;
        g.textAlign = o.align || "center"; g.textBaseline = o.base || "alphabetic"; g.globalAlpha = A() * (o.a ?? 1);
        g.fillStyle = role === "muted" ? COL.muted : K.paint(g, wax(role)); g.fillText(s, x, y);
        if (role !== "muted" && (o.font || "display") === "display") { g.globalAlpha *= 0.5; g.fillText(s, x + 0.8, y - 0.6); }
        g.globalAlpha = 1;
      },
      measure(s, size, font = "display") { const [fam, wt] = FONT[font]; g.font = `${wt} ${size}px ${fam}`; return g.measureText(s).width; },
      // the office worker, standing at (x, y), h tall; shade 0..1 darkens the trousers
      person(x, y, h, shade, pose = "stand", a = 1, role = "ink", flip = false) { g.globalAlpha = A(); K.figure(g, x, y, h, shade, pose, a, wax(role), flip); g.globalAlpha = 1; },
      box(x, y, s, a = 1) { g.globalAlpha = A(); K.box(g, x, y, s, a); g.globalAlpha = 1; },
      marks(x, y, s, kind, a = 1, role = "ink") { g.globalAlpha = A(); K.marks(g, x, y, s, kind, a, wax(role)); g.globalAlpha = 1; },
      vacancy(x, y, h, a = 0.5) { g.globalAlpha = A(); K.vacancy(g, x, y, h, a); g.globalAlpha = 1; },
      prop(name, x, y, size, t) { const P = PROPS[name]; if (!P) return false; S.save(); S.translate(x, y); S.scale(size, size); P(S, t); S.restore(); return true; },
    });
    return S;
  };

  // stairs from bottom-left, n steps of w × h
  function stairs(S, x0, y0, n, w, h, lw = 6) { const pts = [[x0, y0]]; for (let i = 0; i < n; i++) { pts.push([x0 + i * w, y0 - (i + 1) * h]); pts.push([x0 + (i + 1) * w, y0 - (i + 1) * h]); } S.line("ink", pts, lw); S.line("ink", [[x0, y0], [x0 + n * w, y0 + 2]], lw * 0.6, { a: 0.6 }); }
  const PROPS = {
    person(S, t) { S.person(0, 200, 380, 0.75, Math.sin(t * 2) > 0.6 ? "cheer" : "stand"); },
    staircase(S) { stairs(S, -200, 200, 4, 100, 80); S.person(160, 200 - 320, 150, 0.2, "slump", 1, "accent"); },
    box(S) { S.box(0, 150, 300); },
    coin(S, t) { const sx = Math.abs(Math.cos(t * 4)); S.fill("ink", Array.from({ length: 30 }, (_, i) => { const a = (i / 30) * Math.PI * 2; return [Math.cos(a) * 150 * Math.max(0.15, sx), Math.sin(a) * 150]; }), 0.9); },
    pyramid(S) { [1, 3, 5, 7].forEach((n, r) => { for (let i = 0; i < n; i++) S.person((i - (n - 1) / 2) * 52, -150 + r * 110, 90, (i * 37 + r * 13) % 10 / 10); }); },
    chartup(S) { S.line("ink", [[-200, -180], [-200, 180], [200, 180]], 5); S.line("ink", [[-180, 120], [-80, 60], [20, 20], [120, -60], [190, -140]], 8); },
    // the two sides of a versus shot: a strong worker and a struggling one
    versusA(S) { S.person(0, 240, 470, 0.92); },
    versusB(S) { S.person(0, 240, 470, 0.15, "slump", 1, "accent"); S.marks(20, -260, 70, "sweat", 1, "accent"); },
    chartdown(S) { S.line("ink", [[-200, -180], [-200, 180], [200, 180]], 5); S.line("accent", [[-180, -120], [-80, -40], [20, 20], [120, 90], [190, 140]], 8); },
  };
  window.PeterShapes = { stairs, COL };
})();
