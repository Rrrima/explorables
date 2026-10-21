/* Thinking Inside the Box · style. The essay's engine (lib/wash.js: a thin grey
   pen over one blue watercolour) implementing the explainer kit's style contract.
   Canvas space is 1920×1080; pen lines are about 2.2 px, washes granulate and
   pool at their edges, and the page is the essay's warm white paper. */
(function () {
  "use strict";
  const W = window.Wash, C = W.C, P = window.Paper;
  const TXT = { ink: "#343438", accent: "#5fbdd3", muted: "#6e6e73", paper: "#fcfaf6", blue: "#5fbdd3" };
  const RGB = { ink: [74, 74, 78], accent: C.blue, blue: C.blue, muted: C.grey, grey: C.grey, paper: [252, 250, 246] };
  const FONTS = { display: '"Cormorant Garamond", Georgia, serif', body: '"Source Serif 4", Georgia, serif', mono: '"IBM Plex Mono", ui-monospace, Menlo, monospace' };

  // the page: warm white with a barely-there grain
  const page = document.createElement("canvas"); page.width = 1920; page.height = 1080;
  { const g = page.getContext("2d"); g.fillStyle = "#fcfaf6"; g.fillRect(0, 0, 1920, 1080); const d = g.getImageData(0, 0, 1920, 1080), r = P.mulberry32(3); for (let i = 0; i < d.data.length; i += 4) { const n = (r() - 0.5) * 5; d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n; } g.putImageData(d, 0, 0); }

  function finish(S, begin0, line0) {
    const all = [S.col, S.ink];
    const rgb = (role) => RGB[role] || (Array.isArray(role) ? role : C.blue);
    S.line0 = line0;
    S.begin = function (t) { begin0(); S.boil = Math.floor((t || 0) * 6) * 0.35; };
    S.end = function () {
      const m = S.main; m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = "source-over";
      m.drawImage(page, 0, 0); m.drawImage(S.col.canvas, 0, 0);
      m.globalCompositeOperation = "multiply"; m.drawImage(S.ink.canvas, 0, 0); m.globalCompositeOperation = "source-over";
    };
    S.scale = (x, y = x) => S.scaleBy(x, y);
    S.setTransform = (...m) => all.forEach((g) => g.setTransform(...m));
    S.getTransform = () => S.ink.getTransform();
    S.fill = function (role, pts, a = 1) {
      if (!pts || S.alphaNow() * a <= 0.003 || pts instanceof Path2D) return;
      if (role === "paper") { const g = S.col; g.save(); g.globalAlpha = S.alphaNow() * a; g.fillStyle = "#fcfaf6"; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); g.restore(); return; }
      const op = role === "ink" ? 0.55 : role === "muted" || role === "grey" ? 0.3 : 0.8;
      S.wash(pts, rgb(role), op * a, Math.round(pts[0][0] + pts[0][1]), { bloom: 0.35, blooms: 2, pool: 1, grain: 0.7 });
    };
    S.line = function (role, pts, w = 2.2, o = {}) {
      // the engine's own helpers call line(pts, opts): keep that form working
      if (Array.isArray(role)) return line0(role, pts || {});
      if (!pts || pts.length < 2) return;
      const pp = o.close ? pts.concat([pts[0]]) : pts;
      const color = role && role !== "ink" ? TXT[role] || role : undefined;
      line0(pp, { w: w / 2.2, k: o.k, seed: o.seed, a: o.a, jit: o.jit, color });
    };
    S.circle = (role, x, y, r, a = 1) => { if (r > 0) S.blob(x, y, r, rgb(role), (role === "muted" ? 0.3 : 0.8) * a, Math.round(x + y), { bloom: 0.3, pool: 1 }); };
    S.mark = (role, x, y, r, a = 1) => { if (r <= 0) return; if (role === "ink" || role === "muted") { S.dot(x, y, r, (role === "muted" ? 0.5 : 0.85) * a); return; } S.drop(x, y, r, 0.9 * a, Math.round(x * 0.3 + y)); };
    S.text = function (role, s, x, y, o = {}) {
      if (!s || S.alphaNow() * (o.a ?? 1) <= 0.003) return;
      const g = S.ink, font = o.font || "display";
      g.save();
      g.font = `${o.weight || (font === "display" ? 500 : 400)} ${o.size || 48}px ${FONTS[font]}`;
      g.textAlign = o.align || "center"; g.textBaseline = o.base || "alphabetic";
      g.globalAlpha = S.alphaNow() * (o.a ?? 1);
      g.fillStyle = TXT[role] || role;
      g.fillText(String(s), x, y);
      g.restore();
    };
    S.measure = (s, size = 48, font = "display") => { const g = S.ink; g.save(); g.font = `${font === "display" ? 500 : 400} ${size}px ${FONTS[font]}`; const w = g.measureText(String(s)).width; g.restore(); return w; };
    S.prop = (name, x, y, size, t) => { const Pr = PROPS[name]; if (!Pr) return false; S.save(); S.translate(x, y); S.scaleBy(size, size); Pr(S, t || 0); S.restore(); return true; };
    S.labelAt = (s, x, y, o = {}) => S.text("muted", s, x, y, { size: o.size || 34, font: "mono", align: o.align || "center", a: o.a });
    S.big = (s, x, y, o = {}) => S.text(o.role || "ink", s, x, y, Object.assign({ size: 96, font: "display" }, o));
    S.leaderLine = (x0, y0, x1, y1, a = 0.5) => S.line("ink", [[x0, y0], [x1, y1]], 1.6, { a, jit: 0.4 });
    S.ground = (y = 820, a = 0.45, x0 = 160, x1 = 1760) => S.line("ink", [[x0, y], [x1, y + 2]], 2, { a, seed: 900, jit: 0.8 });
    S.stack = function (x, y, w, n, o = {}) {
      const k = o.k == null ? 1 : o.k, count = Math.max(0, Math.round(n * k)), th = o.th || 11;
      for (let i = 0; i < count; i++) {
        const yy = y - i * th, jx = Math.sin(i * 1.7 + (o.seed || 0)) * 4;
        const poly = [[x - w / 2 + jx, yy], [x + w / 2 + jx, yy - 7], [x + w / 2 + jx + w * 0.22, yy - 22], [x - w / 2 + jx + w * 0.22, yy - 15]];
        S.wash(poly, C.blue, (o.a || 0.7) * (0.5 + 0.5 * ((i * 7) % 3) / 2), (o.seed || 0) * 9 + i, { bloom: 0.3, blooms: 1, pool: 0.9, grain: 0.5, edge: 1 });
        S.line("ink", [poly[0], poly[1]], 1.6, { a: 0.5, seed: i + 30 });
      }
    };
    S.cubeOnHead = function (x, y, s, o = {}) {
      const CUBE = { top: [[205, 30], [395, 22], [525, 172], [328, 192], [140, 215]], left: [[140, 215], [328, 192], [335, 340], [231, 371]], right: [[328, 192], [525, 172], [430, 347], [335, 345]] };
      const rel = (pts) => pts.map(([px, py]) => [x + (o.dx || 0) + (px - 330) * s, y + (o.dy || 0) + (py - 540) * s]);
      const a = o.a == null ? 1 : o.a, k = o.k == null ? 1 : o.k;
      [["top", 0.3, { bloom: 0.85, blooms: 2, bloomSize: 1.5, pool: 0.8, grain: 0.7 }], ["left", 0.86, { bloom: 0.35, blooms: 3, pool: 1.2, grain: 0.85 }], ["right", 0.66, { bloom: 0.4, blooms: 3, pool: 1.1, grain: 0.8 }]].forEach(([f, fa, opt], i) => {
        const fk = Math.min(1, Math.max(0, k * 3 - i)); if (fk <= 0) return;
        S.wash(rel(CUBE[f]), C.blue, fa * a * fk, (o.seed || 0) + i + 1, opt);
      });
    };
    S.COL = TXT;
    return S;
  }
  // the real factory: one stage, finished with the contract
  window.makeStyle = function (canvas) {
    const S = W.stage(canvas, 1920, 1080, { size: [1920, 1080], dpr: 1, lineMul: 2.2, unitMul: 1.8 });
    return finish(S, S.begin, S.line);
  };

  /* props: illustrations the ask agent's answer clips can use (~400 units tall at size 1) */
  const PROPS = {
    cube(S, t) { S.solid("cube", 0, 0, 150, { yaw: 0.6 + Math.sin(t * 0.4) * 0.05, pitch: 0.42, a: 0.95, seed: 3 }); },
    figure(S) { S.figure("stand", 0, 190, 1.05, { seed: 1 }); },
    stacks(S) { S.ground(200, 0.4, -260, 260); S.stack(-120, 196, 150, 14.8, { th: 11, seed: 1 }); S.stack(120, 196, 150, 8.3, { th: 11, seed: 2 }); S.labelAt("+48%", -120, -30, { size: 34 }); S.labelAt("−17%", 120, 60, { size: 34 }); },
    drops(S, t) { const r = window.Paper.mulberry32(7); for (let i = 0; i < 40; i++) { const a = r() * 6.28, rr = 180 * Math.sqrt(r()); S.drop(Math.cos(a) * rr, Math.sin(a) * rr * 0.8, 14, 0.85, i); } },
    procession(S) { S.ground(200, 0.4, -330, 330); [-220, -70, 80, 230].forEach((x, i) => { S.figure("stand", x, 196, 0.5, { seed: i }); S.solid(["cube", "tetra", "cube", "octa"][i], x, 196 - 150 * 0.5 - 50, 34, { yaw: 0.5 + i, pitch: -0.3, a: 0.9, seed: 10 + i }); }); },
    mirror(S) { S.line("ink", [[0, -220], [0, 200]], 2, { jit: 1 }); S.figure("sitUp", -150, 196, 0.6, { seed: 1 }); S.figure("sitUp", 150, 196, 0.6, { seed: 2, dir: -1 }); S.solid("cube", -140, -80, 60, { a: 0.95, seed: 3 }); S.solid("cube", 140, -80, 40, { yaw: -0.6, a: 0.95, seed: 4 }); },
    pieces(S) { [["tetra", -120, -40], ["cube", 20, 20], ["octa", 120, -80], ["tetra", 60, 120]].forEach(([k, x, y], i) => S.solid(k, x, y, 52, { yaw: 0.4 + i, pitch: -0.4, a: 0.9, seed: 20 + i })); },
    brain(S) { S.blob(0, 0, 180, C.grey, 0.12, 9, { sx: 1.2, sy: 1, bloom: 0.3 }); S.curve([[-200, 20], [-150, -100], [-50, -180], [50, -184], [150, -130], [210, 0], [150, 130], [20, 170], [-100, 140], [-190, 60]], { w: 1 }); S.curve([[-50, -150], [-25, -50], [-75, 50], [-25, 150]], { w: 0.8, a: 0.5 }); S.blob(-50, 20, 60, C.blue, 0.7, 11); },
    versusA(S) { S.figure("sitUp", 0, 230, 0.9, { seed: 1 }); S.solid("cube", 14, 230 - 300 * 0.9 - 70, 80, { a: 0.95, seed: 3 }); },
    versusB(S) { S.figure("sitUp", 0, 230, 0.9, { seed: 2 }); S.solid("cube", 160, 170, 60, { a: 0.95, seed: 4, k: 0.8 }); S.solid("tetra", 120, 60, 30, { pitch: -0.5, a: 0.8, seed: 5 }); },
  };
})();
