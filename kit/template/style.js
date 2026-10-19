/* {{TITLE}} · style. Implements the explainer kit's style contract with plain
   canvas drawing. Replace the colours, fonts and primitives to give the project
   its own look (see luck-explainer/style.js for ink, peter-explainer/style.js for crayon). */
(function () {
  "use strict";
  const COL = { ink: "#1a1816", accent: "#d6402a", muted: "#8c857c", paper: "#fbfaf7" };
  const FONT = { display: ["Georgia, serif", 700], body: ["Georgia, serif", 400], mono: ["ui-monospace, monospace", 500] };
  window.makeStyle = function (canvas) {
    const B = window.ExplainerStage.Layers(canvas, ["main"]), g = B.L.main, A = () => B.alphaNow();
    const path = (pts) => { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return p; };
    const S = Object.assign(B, {
      begin() { B.clearLayers(); },
      end() { B.ctx.setTransform(1, 0, 0, 1, 0, 0); B.ctx.fillStyle = COL.paper; B.ctx.fillRect(0, 0, B.W, B.H); B.ctx.drawImage(g.canvas, 0, 0); },
      fill(role, pts, a = 1) { g.globalAlpha = A() * a; g.fillStyle = COL[role] || role; g.fill(pts instanceof Path2D ? pts : path(pts)); g.globalAlpha = 1; },
      line(role, pts, w = 3, o = {}) { if (pts.length < 2) return; g.globalAlpha = A() * (o.a ?? 1); g.strokeStyle = COL[role] || role; g.lineWidth = w; g.lineCap = g.lineJoin = "round"; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); g.globalAlpha = 1; },
      circle(role, x, y, r, a = 1) { if (r <= 0) return; g.globalAlpha = A() * a; g.fillStyle = COL[role] || role; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; },
      text(role, s, x, y, o = {}) { if (!s) return; const [f, w] = FONT[o.font || "display"]; g.font = `${o.weight || w} ${o.size || 48}px ${f}`; g.textAlign = o.align || "center"; g.textBaseline = "alphabetic"; g.globalAlpha = A() * (o.a ?? 1); g.fillStyle = COL[role] || role; g.fillText(s, x, y); g.globalAlpha = 1; },
      measure(s, size, font = "display") { const [f, w] = FONT[font]; g.font = `${w} ${size}px ${f}`; return g.measureText(s).width; },
      prop(name, x, y, size) { if (name !== "dot") return false; S.circle("accent", x, y, 140 * size); return true; },
    });
    return S;
  };
})();
