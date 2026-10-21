/* things.js: the essay's drawing vocabulary in the wc.js hand.
   Oysters on the half shell, crushed ice, lemon, mignonette, glasses, knife, tags, plates.
   All functions draw in virtual units around (x, y); s = scale (1 ≈ a 100-unit oyster). */
(function () {
  "use strict";
  const W = window.WC;
  const { PAL, wash, contour, stroke, rimGloss, fleck, shadow, blobPts, circlePts, rgba, shade, tint, mix, rng, N, path } = W;

  function xf(pts, x, y, s, rot) {
    const c = Math.cos(rot), si = Math.sin(rot);
    return pts.map(([px, py]) => [x + (px * c - py * si) * s, y + (px * si + py * c) * s]);
  }

  /* Teardrop shell outline in local units: hinge at -y, lip at +y.
     Asymmetric lean, low-frequency lumps, and a ruffle that grows toward the lip. */
  function shellOutline(len, wid, seed, crag = 0.08, n = 140, ruffle = 9, lean) {
    const out = [];
    const ln = lean == null ? 0.18 * N.noise(seed * 1.7, 0.5) : lean;
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2;
      const sy = Math.sin(t), cx = Math.cos(t);
      const lip = (sy + 1) / 2;                        // 0 at hinge, 1 at lip
      const taper = 0.55 + 0.45 * Math.pow(lip, 0.7);
      let x = cx * wid * taper, y = sy * len * (sy < 0 ? 1.12 : 1);
      x += ln * y;                                     // lean
      const lump = 0.7 * N.noise(t * 1.6 + seed, seed * 0.3) + 0.3 * N.noise(t * 4 + seed, 7);
      const ruf = Math.sin(t * ruffle + seed + 0.6 * N.noise(t * 3, seed)) * (0.35 + 0.65 * lip);
      const k = 1 + crag * (lump + 0.45 * ruf);
      out.push([x * k, y * k]);
    }
    return out;
  }

  const SPECIES = {
    //         len wid crag ruf  shell      band       dark       meat
    pacific:  [58, 36, 0.13, 11, "#d3c7b8", "#a08ca3", "#6a5a6c", "#f1eadc"],
    eastern:  [52, 38, 0.08, 6,  "#cdc1ab", "#a59b86", "#6f6758", "#f2e8d2"],
    flat:     [46, 45, 0.06, 15, "#c2b59c", "#9ea28b", "#6b6a58", "#e9dfc6"],
    kumamoto: [36, 31, 0.13, 10, "#d6c8b8", "#8a7686", "#5d4f5c", "#f3ecde"]
  };

  /* An oyster on the half shell, seen from above.
     o: { species, green, mood, k (meat plumpness 0..1.3), empty, shut, seed } */
  function oyster(g, x, y, s = 1, rot = 0, o = {}) {
    const seed = o.seed || 1, r = rng(seed);
    const sp = o.species || "pacific";
    const [L, Wd, crag, ruf, shellCol, bandCol, darkCol, meatCol] = SPECIES[sp];
    const lean = 0.2 * N.noise(seed * 1.7, 0.5);
    const so = (sc, sd, cr, rf, dy = 0, dx = 0) => xf(shellOutline(L * sc, Wd * sc, sd, cr, 140, rf, lean), x + dx * s, y + dy * s, s, rot);
    const outer = so(1, seed, crag, ruf);

    shadow(g, outer, { dx: -5 * s, dy: 7 * s, blur: 5, a: o.shadowA == null ? 0.42 : o.shadowA, color: o.shadowColor || "#3c5674" });
    // shell: layered growth plates, each a wash with a dark pooled edge and a lit rim
    wash(g, outer, { color: darkCol, mottle: 0.3, mscale: 0.6, edge: 2, edgeColor: shade(darkCol, 0.3), seed });
    const plates = [[0.95, shellCol], [0.88, bandCol], [0.82, shellCol]];
    plates.forEach(([sc, col], i) => {
      const p = so(sc, seed + i * 5, crag * (1.1 - i * 0.15), ruf + i * 2, (1 - sc) * 6);
      wash(g, p, { color: col, a: 0.95, mottle: 0.3, mscale: 0.5, edge: 2.5, edgeColor: shade(col, 0.35), edgeA: 0.7, seed: seed + i });
      // a crisp lit edge on the left/bottom of each plate
      const lit = p.slice(Math.floor(p.length * 0.3), Math.floor(p.length * 0.62));
      contour(g, lit, { color: "#fbf7ee", w: 0.9 * s, a: 0.35, close: false, seed: seed + i });
    });
    // purple-grey flecks and growth ticks on the lip
    for (let i = 0; i < 14; i++) {
      const t = r() * Math.PI * 2, d = 0.84 + r() * 0.12;
      const [px, py] = so(d, seed, crag, ruf)[Math.floor((t / (Math.PI * 2)) * 139)];
      fleck(g, px, py, (1.2 + r() * 2.4) * s, { color: r() < 0.5 ? bandCol : darkCol, a: 0.55, rot: t, flat: 0.45 });
    }
    if (o.shut) {
      const top = so(0.84, seed + 9, crag * 0.7, ruf, 2);
      wash(g, top, { color: tint(shellCol, 0.1), mottle: 0.3, mscale: 0.6, edge: 2.5, edgeColor: shade(shellCol, 0.35), seed: seed + 9,
        glaze: { pts: so(0.8, seed + 9, crag * 0.7, ruf, -2, 5), invert: true, color: shade(shellCol, 0.18), a: 0.55 } });
      for (let i = 1; i < 4; i++) contour(g, so(0.84 - i * 0.17, seed + i, crag, ruf, 2 - i * 4), { color: shade(shellCol, 0.4), w: 0.9 * s, a: 0.5, seed: i });
      rimGloss(g, x, y, Wd * 0.62 * s, L * 0.72 * s, Math.PI * 0.5, Math.PI * 1.1, { w: 2.2 * s, dash: 0.12, seed });
      return { outer };
    }
    // nacre cup
    const cup = so(0.74, seed + 5, 0.03, 4, 3);
    wash(g, cup, { color: PAL.nacre, mottle: 0.1, mscale: 0.5, mottleColor: "#c9c7d6", edge: 3, edgeColor: "#a9a2b6", edgeA: 0.7, seed: seed + 5,
      glaze: { pts: so(0.74, seed + 5, 0.03, 4, 0, 7), invert: true, color: "#cfd0dc", a: 0.6 } });
    if (o.empty) {
      const [sx, sy] = xf([[Wd * 0.16, L * 0.1]], x, y, s, rot)[0];
      wash(g, blobPts(sx, sy, 8 * s, 7 * s, { wob: 0.2, seed, n: 30 }), { color: "#7d5f8c", a: 0.85, mottle: 0.2, edge: 1.5, seed });
      rimGloss(g, x, y + 3 * s, Wd * 0.6 * s, L * 0.66 * s, Math.PI * 0.55, Math.PI * 1.15, { w: 2.4 * s, seed });
      return { outer };
    }
    // the meat: plump cream body, a hard-edged grey belly glaze, a frilled dark mantle edge
    const k = o.k == null ? 1 : o.k;
    const meat = so(0.66 * k, seed + 7, 0.05, 6, 4);
    wash(g, meat, { color: o.green ? "#dfe3cf" : meatCol, mottle: 0.15, mscale: 0.5, edge: 3, edgeColor: shade(meatCol, 0.25), edgeA: 0.6, seed: seed + 7 });
    g.save(); W.path(g, meat); g.clip();
    wash(g, so(0.5 * k, seed + 8, 0.08, 5, 9, -5), { color: o.green ? "#8aa985" : "#d2c8b4", a: o.green ? 0.6 : 0.3, mottle: 0.2, mscale: 0.5, edge: 2, edgeColor: o.green ? "#5f8063" : "#8f8574", seed: seed + 8 });
        g.restore();
    // mantle frill: a ruffled dark band, broken in places
    const frill = (sc, c, w, a, amp, sd) => {
      const base = so(0.66 * k * sc, seed + 7, 0.05, 6, 4);
      const pts = base.map(([px, py], i) => {
        const m = amp * s * (0.5 * Math.sin(i * 0.55 + sd) + 0.5 * N.noise(i * 0.25, sd));
        return [px + m, py + m * 0.7];
      });
      const n = pts.length;
      for (let i = 0; i < n; i += 20) {
        if (N.noise(i * 0.1, sd + 3) < -0.35) continue;    // a gap where the frill tucks under
        contour(g, pts.slice(i, Math.min(n, i + 22)), { color: c, w: w * s, a, close: false, seed: sd + i, jit: 0.4 });
      }
    };
    frill(1.0, o.green ? "#3d5543" : "#57504a", 1.7, 0.8, 1.2, seed);
    frill(0.93, o.green ? "#5f7f65" : "#857d72", 1.1, 0.5, 0.9, seed + 2);
    // wet gloss: one long curved streak on the lit side, flecks, a liquor rim
    const gl = [];
    for (let t = Math.PI * 0.62; t <= Math.PI * 1.02; t += 0.05) gl.push([Math.cos(t) * Wd * 0.4 * k, 4 + Math.sin(t) * L * 0.5 * k]);
    W.stroke(g, xf(gl, x, y, s, rot), { w: 4 * s, color: "#ffffff", a: 0.92, seed });
    for (let i = 0; i < 6; i++) {
      const [fx, fy] = xf([[(r() - 0.6) * Wd * 0.6 * k, (r() - 0.35) * L * 0.6 * k]], x, y, s, rot)[0];
      fleck(g, fx, fy, (1.4 + r() * 3) * s, { rot: rot - 0.6 + r() * 0.4, flat: 0.3 });
    }
    rimGloss(g, x, y + 3 * s, Wd * 0.66 * s, L * 0.71 * s, Math.PI * 0.55, Math.PI * 1.1, { w: 2 * s, dash: 0.1, seed: seed + 6, a: 0.85 });
    if (o.mood) face(g, ...xf([[0, L * 0.08]], x, y, s, rot)[0], s, o.mood);
    return { outer, meat };
  }

  // a tiny face for the hero mascot
  function face(g, x, y, s = 1, mood = "smile") {
    g.save(); g.fillStyle = rgba("#3a3532", 0.85);
    g.beginPath(); g.ellipse(x - 6 * s, y - 2 * s, 1.6 * s, 2 * s, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(x + 6 * s, y - 2 * s, 1.6 * s, 2 * s, 0, 0, 7); g.fill();
    g.strokeStyle = rgba("#3a3532", 0.85); g.lineWidth = 1.2 * s; g.lineCap = "round";
    g.beginPath();
    if (mood === "smile") g.arc(x, y + 1 * s, 3 * s, 0.2 * Math.PI, 0.8 * Math.PI);
    else if (mood === "o") g.arc(x, y + 3 * s, 1.6 * s, 0, 7);
    else { g.moveTo(x - 2.5 * s, y + 3 * s); g.lineTo(x + 2.5 * s, y + 3 * s); }
    g.stroke();
    g.fillStyle = rgba("#f09a8a", 0.45);
    g.beginPath(); g.ellipse(x - 10 * s, y + 2 * s, 3 * s, 1.8 * s, 0, 0, 7); g.fill();
    g.beginPath(); g.ellipse(x + 10 * s, y + 2 * s, 3 * s, 1.8 * s, 0, 0, 7); g.fill();
    g.restore();
  }

  /* Crushed ice filling a closed outline: a pale blue-white mound of overlapping
     faceted chips, cool shade in the crevices, crisp white glints on the lit facets. */
  function ice(g, pts, o = {}) {
    const b = W.bbox(pts), r = rng(o.seed || 17);
    wash(g, pts, { color: o.base || "#b9cfdd", mottle: 0.35, mscale: 1.2, mottleColor: "#7f9db5", edge: 5, edgeColor: "#7d99b0", seed: o.seed });
    g.save(); path(g, pts); g.clip();
    const size = o.size || 16;
    const n = o.n || Math.round((b.w * b.h) / (size * size * 0.9));
    const chips = [];
    for (let i = 0; i < n; i++) chips.push([b.x0 + r() * b.w, b.y0 + r() * b.h, size * (0.55 + r() * 0.8)]);
    chips.sort((p, q) => p[1] - q[1]);
    for (const [cx, cy, rr] of chips) {
      const m = 5 + Math.floor(r() * 3), chip = [];
      const rot = r() * 6.28;
      for (let k = 0; k < m; k++) { const a = rot + (k / m) * Math.PI * 2 + (r() - 0.5) * 0.5; const d = rr * (0.65 + r() * 0.45); chip.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8]); }
      // body: translucent pale blue, lighter toward the light
      g.fillStyle = rgba(r() < 0.25 ? "#d6e5ee" : "#eaf3f7", 0.92);
      path(g, chip); g.fill();
      // shade facet (lower-left half), hard edged
      const h = Math.floor(m / 2);
      g.fillStyle = rgba(r() < 0.5 ? "#a9c2d4" : "#9ab5ca", 0.7);
      g.beginPath(); g.moveTo(chip[h][0], chip[h][1]); for (let k = h; k < m; k++) g.lineTo(chip[k][0], chip[k][1]); g.lineTo(cx + rr * 0.1, cy - rr * 0.1); g.closePath(); g.fill();
      // a thin cool edge
      g.strokeStyle = rgba("#7f9cb3", 0.35); g.lineWidth = 0.8; path(g, chip); g.stroke();
      // glint
      if (r() < 0.6) { const k = Math.floor(r() * h); stroke(g, [chip[k], chip[(k + 1) % m]], { w: rr * 0.18, color: "#ffffff", a: 0.9 }); }
    }
    g.restore();
  }

  /* Lemon wedge, top view: rind arc, pith, segments. */
  function lemon(g, x, y, s = 1, rot = 0, o = {}) {
    const R = 34;
    const half = []; for (let t = 0; t <= Math.PI; t += Math.PI / 40) half.push([Math.cos(t) * R, Math.sin(t) * R * 0.72]);
    const rind = xf(half.concat([[-R, -3], [R, -3]]), x, y, s, rot);
    shadow(g, rind, { dx: -4 * s, dy: 6 * s, a: 0.32 });
    wash(g, rind, { color: PAL.lemon, mottle: 0.2, edge: 3, edgeColor: "#d9a521", line: { color: "#c38f1f", w: 1.1 }, seed: o.seed || 3 });
    const pith = []; for (let t = 0.05; t <= Math.PI - 0.05; t += Math.PI / 40) pith.push([Math.cos(t) * R * 0.86, Math.sin(t) * R * 0.6]);
    const pp = xf(pith.concat([[-R * 0.86, 0]]), x, y, s, rot);
    wash(g, pp, { color: "#fff6cf", mottle: 0.05, edge: 1.5, edgeColor: "#efdc8b", line: false });
    const flesh = []; for (let t = 0.1; t <= Math.PI - 0.1; t += Math.PI / 40) flesh.push([Math.cos(t) * R * 0.76, Math.sin(t) * R * 0.52]);
    wash(g, xf(flesh.concat([[-R * 0.74, 1]]), x, y, s, rot), { color: "#f8dc63", mottle: 0.15, edge: 2, edgeColor: "#e9b93a", line: false });
    for (let i = 1; i < 6; i++) { const t = (i / 6) * Math.PI; stroke(g, xf([[0, 1], [Math.cos(t) * R * 0.74, Math.sin(t) * R * 0.5]], x, y, s, rot), { w: 1.3 * s, color: "#fff4c4", a: 0.9 }); }
    rimGloss(g, x, y, R * 0.94 * s, R * 0.68 * s, rot + 0.2, rot + 1.2, { w: 2 * s });
    for (let i = 0; i < 4; i++) fleck(g, ...xf([[(i - 1.5) * 10, 12 + (i % 2) * 6]], x, y, s, rot)[0], 1.6 * s, { a: 0.9 });
  }

  /* Small lacquer bowl of mignonette (vinegar + shallots). */
  function mignonette(g, x, y, s = 1, o = {}) {
    const R = 40 * s;
    shadow(g, circlePts(x, y, R), { dx: -6 * s, dy: 8 * s, a: 0.4 });
    wash(g, circlePts(x, y, R), { color: PAL.red, mottle: 0.15, edge: 3, line: { color: shade(PAL.red, 0.5), w: 1.2 }, seed: 5 });
    wash(g, circlePts(x + 2 * s, y - 1 * s, R * 0.76), { color: "#c9867d", mottle: 0.15, edge: 3, edgeColor: "#8f3d33", line: { color: shade(PAL.red, 0.35), w: 0.8 }, seed: 6,
      glaze: { pts: circlePts(x + 10 * s, y - 8 * s, R * 0.76), invert: true, color: "#9e4a40", a: 0.45 } });
    const r = rng(8);
    for (let i = 0; i < 26; i++) { const a = r() * 6.28, d = r() * R * 0.6; fleck(g, x + Math.cos(a) * d, y + Math.sin(a) * d, (1.6 + r() * 2.2) * s, { color: r() < 0.5 ? "#e7b8c8" : "#f6dde4", a: 0.9, rot: r() * 3, flat: 0.6 }); }
    rimGloss(g, x, y, R * 0.9, R * 0.9, Math.PI * 1.1, Math.PI * 1.7, { w: 2.2 * s });
    rimGloss(g, x + 2 * s, y - 1 * s, R * 0.6, R * 0.6, -0.5, 0.4, { w: 1.6 * s, a: 0.8 });
  }

  /* Coupe / glass seen from above with a pale drink. kind: 'coupe'|'martini'|'stout' */
  function glass(g, x, y, s = 1, o = {}) {
    const kind = o.kind || "coupe", R = (kind === "stout" ? 36 : 44) * s;
    const drink = kind === "stout" ? "#3b2a24" : kind === "martini" ? "#eef0dc" : "#f3df9c";
    shadow(g, circlePts(x - 8 * s, y + 10 * s, R * 0.9), { dx: -4 * s, dy: 6 * s, a: 0.25, blur: 8 });
    wash(g, circlePts(x, y, R), { color: "#e9f1f4", a: 0.55, mottle: 0, edge: 2, edgeColor: "#9db4c2", line: { color: "#8aa2b2", w: 1 } });
    wash(g, circlePts(x + 1 * s, y + 1 * s, R * 0.84), { color: drink, a: kind === "stout" ? 0.95 : 0.75, mottle: 0.1, edge: 3, edgeColor: shade(drink, 0.25), line: false,
      glaze: { pts: circlePts(x + 8 * s, y - 6 * s, R * 0.84), invert: true, color: shade(drink, 0.12), a: 0.4 } });
    if (kind === "stout") wash(g, circlePts(x + 1 * s, y + 1 * s, R * 0.72), { color: "#e9d9bd", mottle: 0.2, edge: 2, edgeColor: "#c9ae84", line: false });
    if (kind === "martini") { // olive on a pick
      wash(g, circlePts(x + 10 * s, y + 6 * s, 9 * s, 7 * s, 24), { color: "#8a9a3e", mottle: 0.2, edge: 2, line: { color: "#55602a", w: 0.8 } });
      stroke(g, [[x - 18 * s, y - 14 * s], [x + 22 * s, y + 14 * s]], { w: 1.6 * s, color: "#8b5a3c", taper: false });
    }
    if (kind === "coupe") { const r = rng(4); for (let i = 0; i < 16; i++) fleck(g, x + (r() - 0.5) * R, y + (r() - 0.5) * R, (0.8 + r()) * s, { a: 0.8, flat: 1 }); }
    rimGloss(g, x, y, R * 0.95, R * 0.95, -Math.PI * 0.5, Math.PI * 0.1, { w: 2.6 * s, dash: 0.2 });
    rimGloss(g, x, y, R * 0.8, R * 0.8, Math.PI * 0.6, Math.PI * 0.9, { w: 1.6 * s, a: 0.7 });
  }

  /* Oyster knife: short stout blade, wooden handle, guard. */
  function knife(g, x, y, s = 1, rot = 0) {
    const blade = xf([[0, -6], [62, -5], [78, 0], [62, 5], [0, 6]], x, y, s, rot);
    const handle = xf([[-8, -11], [-78, -13], [-88, 0], [-78, 13], [-8, 11]], x, y, s, rot);
    const guard = xf([[-10, -18], [-2, -18], [-2, 18], [-10, 18]], x, y, s, rot);
    shadow(g, blade.concat(handle), { dx: -4 * s, dy: 7 * s, a: 0.3 });
    wash(g, handle, { color: "#b9824f", mottle: 0.35, kind: "streak", edge: 2.5, line: { color: "#6e4426", w: 1 }, seed: 2 });
    wash(g, blade, { color: "#c4ccd2", mottle: 0.1, edge: 2, edgeColor: "#7c8a96", line: { color: "#5f6b76", w: 1 },
      glaze: { pts: xf([[0, 0], [62, 0], [78, 0], [62, 5], [0, 6]], x, y, s, rot), color: "#8e9aa5", a: 0.5 } });
    wash(g, guard, { color: "#d9dde0", mottle: 0, edge: 1.5, line: { color: "#5f6b76", w: 1 } });
    stroke(g, xf([[6, -3], [56, -3]], x, y, s, rot), { w: 1.6 * s, color: "#ffffff", a: 0.9 });
  }

  /* Price tag on a string: a small card (text drawn by caller in HTML or via label()). */
  function tag(g, x, y, s = 1, rot = 0, o = {}) {
    const w = (o.w || 70), h = (o.h || 34);
    const card = xf([[0, -h / 2], [w, -h / 2], [w, h / 2], [0, h / 2], [-12, 0]], x, y, s, rot);
    shadow(g, card, { dx: -3 * s, dy: 5 * s, a: 0.25 });
    wash(g, card, { color: o.color || "#fbf3df", mottle: 0.12, edge: 2, edgeColor: "#d9c69c", line: { color: "#a48f66", w: 0.9 }, seed: o.seed || 4 });
    const [hx, hy] = xf([[-3, 0]], x, y, s, rot)[0];
    g.save(); g.fillStyle = rgba("#a48f66", 0.9); g.beginPath(); g.arc(hx, hy, 2.4 * s, 0, 7); g.fill(); g.restore();
    if (o.string) stroke(g, W.smoothOpen([[hx, hy], ...o.string]), { w: 1.2 * s, color: "#b35a3c", taper: false, a: 0.85 });
    return card;
  }

  /* Round platter (pewter or porcelain) with a rim. */
  function platter(g, x, y, rx, ry, o = {}) {
    const col = o.color || "#c4ced6";
    shadow(g, circlePts(x, y, rx, ry), { dx: -14, dy: 16, blur: 12, a: 0.45, color: "#1e3550" });
    wash(g, circlePts(x, y, rx, ry), { color: col, mottle: 0.25, mscale: 2, edge: 3, edgeColor: shade(col, 0.3), line: { color: shade(col, 0.5), w: 1.3 }, seed: 12,
      glaze: { pts: circlePts(x + 16, y - 14, rx - 4, ry - 4), invert: true, color: shade(col, 0.2), a: 0.5 } });
    wash(g, circlePts(x + 4, y - 2, rx * 0.88, ry * 0.88), { color: tint(col, 0.15), mottle: 0.2, mscale: 2, edge: 2, edgeColor: shade(col, 0.25), line: { color: shade(col, 0.35), w: 0.8, a: 0.6 }, seed: 13 });
    rimGloss(g, x, y, rx - 7, ry - 7, Math.PI * 0.7, Math.PI * 1.5, { w: 3, dash: 0.1, gap: 0.07, seed: 3 });
    rimGloss(g, x, y, rx - 7, ry - 7, -0.2, 0.5, { w: 2.2, dash: 0.08, gap: 0.12, seed: 4, a: 0.7 });
  }

  /* Porcelain dish with blue bands. */
  function dish(g, x, y, R, o = {}) {
    shadow(g, circlePts(x, y, R), { dx: -10, dy: 10, a: 0.4, color: "#1e3550" });
    wash(g, circlePts(x, y, R), { color: PAL.white, mottle: 0.04, edge: 2, edgeColor: PAL.porcelainShade, line: { color: "#7d93a6", w: 1.2 }, seed: o.seed || 40 });
    if (o.bands !== false) {
      contour(g, circlePts(x, y, R * 0.9), { color: PAL.blue, w: 2.2, a: 0.9 });
      contour(g, circlePts(x, y, R * 0.8), { color: PAL.blue, w: 1.2, a: 0.8 });
    }
    wash(g, circlePts(x + 4, y - 3, R * 0.76), { color: "#eef3f5", mottle: 0.05, edge: 3, edgeColor: "#b8c8d4", line: false, seed: 41,
      glaze: { pts: circlePts(x + R * 0.18, y - R * 0.13, R * 0.76), invert: true, color: "#c3d4e2", a: 0.6 } });
    rimGloss(g, x, y, R - 5, R - 5, Math.PI * 1.1, Math.PI * 1.6, { w: 2.4 });
  }

  /* sparkle: marks a hoverable part. tw: 0..1 twinkle phase */
  function sparkle(g, x, y, r = 7, tw = 1, o = {}) {
    const k = 0.65 + 0.35 * tw;
    g.save(); g.translate(x, y); g.rotate(o.rot || 0); g.scale(k, k);
    g.fillStyle = rgba(o.color || "#fffbea", 0.95);
    g.beginPath();
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, rr = i % 2 ? r * 0.22 : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    g.closePath(); g.fill();
    g.fillStyle = rgba("#f2c94c", 0.9); g.beginPath(); g.arc(0, 0, r * 0.16, 0, 7); g.fill();
    g.restore();
  }

  window.Things = { sparkle,  oyster, ice, lemon, mignonette, glass, knife, tag, platter, dish, face, shellOutline, xf };
})();
