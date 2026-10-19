/* Sit, Stay, Think · style: the essay's felted fur on warm cream, drawn with the
   essay's own engine (lib/fuzz.js). Fills are fur, lines are fine hairlines or
   yarn, dots are felt balls, type is Fraunces / Nunito Sans / IBM Plex Mono.
   Implements the explainer kit's style contract. */
(function () {
  "use strict";
  const F = window.Fuzz;
  const COL = { ink: "#231d1a", accent: "#b9773f", muted: "#8a8077", paper: "#f5efe0", pink: "#eba796", good: "#b9773f", bad: "#5c463a" };
  const FONT = { display: ["Fraunces, Georgia, serif", 600], body: ['"Nunito Sans", sans-serif', 400], mono: ['"IBM Plex Mono", monospace', 400] };
  const COAT = { ink: "dark", accent: "ginger", muted: "cream", pink: "pink", good: "ginger", bad: "dark", paper: "white" };

  // the page: warm cream with the faintest grain (texture lives in the fur, not the ground)
  const page = document.createElement("canvas"); page.width = 1920; page.height = 1080;
  {
    const p = page.getContext("2d"); p.fillStyle = COL.paper; p.fillRect(0, 0, 1920, 1080);
    const d = p.getImageData(0, 0, 1920, 1080), r = F.mulberry32(5);
    for (let i = 0; i < d.data.length; i += 4) { const n = (r() - 0.5) * 6; d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n * 0.8; }
    p.putImageData(d, 0, 0);
  }

  window.makeFuzzStyle = function (canvas) {
    const B = window.ExplainerStage.Layers(canvas, ["main"]), g = B.L.main, A = () => B.alphaNow();
    const path = (pts) => { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return p; };
    const withA = (a, fn) => { g.save(); g.globalAlpha = A() * a; fn(); g.restore(); };
    const blobs = new Map();
    const S = Object.assign(B, {
      COL, F, g,
      begin() { B.clearLayers(); g.lineCap = g.lineJoin = "round"; },
      end() { const c = B.ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.drawImage(page, 0, 0); c.drawImage(g.canvas, 0, 0); },
      // a felted patch: the polygon filled with fur (cached by shape)
      fill(role, pts, a = 1) {
        if (A() * a <= 0.003) return;
        if (pts instanceof Path2D) { withA(a * 0.85, () => { g.fillStyle = COL[role] || role; g.fill(pts); }); return; }
        const key = role + JSON.stringify(pts.map(([x, y]) => [Math.round(x), Math.round(y)]));
        let s = blobs.get(key);
        if (!s) { const box = F.boxPts(pts); s = F.blob([path(pts)], box, COAT[role] || "cream", { key, len: 5, crown: [(box[0] + box[2]) / 2, box[1]], rad: Math.max(box[2] - box[0], box[3] - box[1]) * 0.7 }); blobs.set(key, s); }
        withA(a, () => g.drawImage(s.c, -s.ox, -s.oy, s.w, s.h));
      },
      // a fine hairline, like whiskers and the essay's diagram lines; o.yarn draws a wool strand
      line(role, pts, w = 2, o = {}) {
        if (!pts || pts.length < 2 || A() * (o.a ?? 1) < 0.003) return;
        withA(1, () => {
          if (o.yarn) F.yarn(g, pts, { coat: COAT[role] || "dark", w: w * 1.4, k: o.k ?? 1, seed: o.seed || 3 });
          else F.hairline(g, pts, { w: w * 0.8, color: COL[role] || role, a: o.a ?? 0.85, k: o.k ?? 1, taper: o.taper ?? false, jit: o.jit ?? 0.4, seed: o.seed || 1 });
        });
        if (o.yarn && (o.a ?? 1) < 1) {/* yarn alpha handled by withA */}
      },
      circle(role, x, y, r, a = 1) { if (r <= 0) return; withA(a, () => { g.fillStyle = COL[role] || role; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }); },
      // a dot is a felt ball
      mark(role, x, y, r, a = 1) { if (r <= 0.5) return; S.pom(x, y, r, COAT[role] || role, a); },
      text(role, s, x, y, o = {}) {
        if (A() * (o.a ?? 1) <= 0.003 || !s) return;
        const [fam, wt] = FONT[o.font || "display"];
        withA(o.a ?? 1, () => { g.font = `${o.weight || wt} ${o.size || 48}px ${fam}`; g.textAlign = o.align || "center"; g.textBaseline = o.base || "alphabetic"; g.fillStyle = COL[role] || role; g.fillText(s, x, y); });
      },
      measure(s, size, font = "display") { const [fam, wt] = FONT[font]; g.font = `${wt} ${size}px ${fam}`; return g.measureText(s).width; },
      prop(name, x, y, size, t) {
        // "dog:<breed>" / "cat:<coat>": that specific animal, sitting
        const m = /^(dog|cat):([a-z]+)$/.exec(name || "");
        // sized to the kit's prop box (about 400 units tall, centred): ears at about -200, paws at about +200
        const Pr = PROPS[name] || (m && m[1] === "dog" && window.Fuzz.BREEDS[m[2]] ? (S) => S.put(S.dog({ breed: m[2], R: 95, seed: 40 + m[2].length, sit: true }), 0, window.Fuzz.BREEDS[m[2]].stout ? -20 : -40)
          : m && m[1] === "cat" && window.Fuzz.COATS[m[2]] ? (S) => S.put(S.cat({ coat: m[2], R: 92, seed: 50 + m[2].length, sit: true }), 0, -40) : null);
        if (!Pr) return false; S.save(); S.translate(x, y); S.scale(size, size); Pr(S, t || 0); S.restore(); return true; },

      /* ---- the essay's vocabulary ---- */
      put(sp, x, y, o = {}) { if (!sp) return; withA(o.a ?? 1, () => F.put(g, sp, x, y, Object.assign({}, o, { a: 1 }))); },
      dog: (o) => F.dog(o), cat: (o) => F.cat(o),
      pom(x, y, r, ck = "ginger", a = 1, seed = 3) { const sp = F.pom(Math.round(r * 2) / 2, ck, seed); withA(a, () => F.put(g, sp, x, y)); },
      yarn(pts, o = {}) { withA(o.a ?? 1, () => F.yarn(g, pts, o)); },
      hair(pts, o = {}) { withA(1, () => F.hairline(g, pts, o)); },
      bow: F.bow,
      raw(a, fn) { withA(a, () => fn(g)); },
      // a label in Plex Mono that eases up into place (no bounce)
      lab(s, x, y, t, t0, o = {}) {
        const k = F.ease(F.clamp((t - t0) / (o.dur || 0.5)));
        if (k <= 0) return;
        S.text(o.role || "muted", s, x, y + (1 - k) * 12, { size: o.size || 30, font: o.font || "mono", align: o.align || "center", a: k * (o.a ?? 1), weight: o.weight });
      },
      // a felt-ball grid: n balls, the first k in colour `on`
      grid(x, y, n, k, cols, r, on = "ginger", off = "cream", a = 1, reveal = 1) {
        const gap = r * 2.5, shown = Math.round(n * reveal);
        for (let i = 0; i < shown; i++) S.pom(x + (i % cols) * gap + r, y + Math.floor(i / cols) * gap + r, r, i < k ? on : off, a, 3 + (i % 3));
        return { w: cols * gap, h: Math.ceil(n / cols) * gap };
      },
      sparkle(x, y, r, a = 0.8) { withA(a, () => { g.fillStyle = COL.ink; const q = r * 0.18; g.beginPath(); g.moveTo(x, y - r); g.quadraticCurveTo(x + q, y - q, x + r, y); g.quadraticCurveTo(x + q, y + q, x, y + r); g.quadraticCurveTo(x - q, y + q, x - r, y); g.quadraticCurveTo(x - q, y - q, x, y - r); g.fill(); }); },
    });
    return S;
  };

  const PROPS = {
    dog(S) { S.put(S.dog({ breed: "mutt", R: 120, seed: 21, sit: true }), 0, -180); },
    cat(S) { S.put(S.cat({ coat: "cream", R: 110, seed: 22, sit: true, patches: (x, y) => (x > 25 && y < -10 ? "ginger" : null) }), 0, -170); },
    pom(S) { S.pom(0, 0, 120, "ginger"); },
    yarn(S) { S.yarn(S.bow(-200, 40, 200, -40, 60, 30), { coat: "ginger", w: 6 }); },
    hand(S) { S.put(window.VideoKit.hand(160), 0, 0); },
    horse(S) { S.put(window.VideoKit.horse(200), 0, 0); },
    brain(S) { S.put(window.VideoKit.brain(170, 81), 0, 0); },
    versusA(S) { S.put(S.dog({ breed: "collie", R: 140, seed: 5 }), 0, 0); },
    versusB(S) { S.put(S.cat({ coat: "grey", R: 130, seed: 21 }), 0, 0); },
  };
})();
