/* Ch4 merroir: real coastlines (Natural Earth via johan/world.geo.json). The land is the table,
   the sea is the indigo cloth. Places light up region by region as you scroll. */
(function () {
  "use strict";
  const { wash, mat, blobPts, smoothClosed, contour, shadow, finish, sprite, blit, ease, clamp, seg, rgba, path } = WC;
  const T = Things;
  const GEO = window.GEO, D = window.DATA;
  let VW = 1000, VH = 805, M = false;

  const panels = {
    na: { lon: [-128, -57], lat: [23.5, 52.5], x: 20, y: 22, w: 960, h: 500, iso: ["USA", "CAN", "MEX", "CUB", "BHS", "GTM", "BLZ", "HND"] },
    eu: { lon: [-11, 4], lat: [42.5, 55.5], x: 110, y: 565, w: 200, h: 230, iso: ["FRA", "ESP", "PRT", "GBR", "IRL", "BEL", "NLD", "DEU", "CHE", "ITA", "LUX", "DNK"] },
    jp: { lon: [127, 143], lat: [30.5, 41.6], x: 395, y: 565, w: 220, h: 230, iso: ["JPN", "KOR", "PRK"] },
    au: { lon: [112, 156], lat: [-44, -10], x: 680, y: 565, w: 250, h: 230, iso: ["AUS"] }
  };
  function project(P) {
    const cl = Math.cos((((P.lat[0] + P.lat[1]) / 2) * Math.PI) / 180);
    const s = Math.min(P.w / ((P.lon[1] - P.lon[0]) * cl), P.h / (P.lat[1] - P.lat[0]));
    const ow = (P.lon[1] - P.lon[0]) * cl * s, oh = (P.lat[1] - P.lat[0]) * s;
    P.proj = (lon, lat) => [P.x + (P.w - ow) / 2 + (lon - P.lon[0]) * cl * s, P.y + (P.h - oh) / 2 + (P.lat[1] - lat) * s];
    P.box = [P.x + (P.w - ow) / 2, P.y + (P.h - oh) / 2, ow, oh];
    return P;
  }
  for (const k in panels) project(panels[k]);
  // phones: one close-up per step instead of one crowded continent. Steps 0–2 zoom into a stretch of
  // North American coast (with a locator map and the colour key under it); step 3 stacks the three
  // insets with their places listed beside them.
  const MV = [
    [project({ key: "v0", lon: [-77.6, -60.4], lat: [38.9, 47.9], x: 10, y: 8, w: 580, h: 420, iso: panels.na.iso })],
    [project({ key: "v1", lon: [-91.5, -72.5], lat: [27.4, 40.6], x: 10, y: 8, w: 580, h: 420, iso: panels.na.iso })],
    [project({ key: "v2", lon: [-128.4, -119.6], lat: [45.8, 50.8], x: 10, y: 8, w: 580, h: 420, iso: panels.na.iso })],
    [project({ key: "v3eu", lon: [-11, 4], lat: [42.5, 55.5], x: 10, y: 8, w: 200, h: 205, iso: panels.eu.iso, reg: "eu", name: "France · Ireland" }),
     project({ key: "v3jp", lon: [127, 143], lat: [30.5, 41.6], x: 10, y: 244, w: 200, h: 200, iso: panels.jp.iso, reg: "jp", name: "Japan" }),
     project({ key: "v3au", lon: [112, 156], lat: [-44, -10], x: 10, y: 480, w: 200, h: 200, iso: panels.au.iso, reg: "au", name: "Australia" })]
  ];
  // label offsets on the close-ups (virtual units) and alignment
  const ML = {
    malpeque: [0, -50, "c"], wellfleet: [16, -6, "l"], islandcreek: [-12, -26, "r"], moonstone: [14, 30, "l"], bluepoint: [-40, 60, "c"],
    rappahannock: [0, 44, "c"], apalachicola: [0, 36, "c"],
    kusshi: [-16, -6, "r"], hamahama: [18, -12, "l"], totten: [18, 30, "l"]
  };
  // which panel, which group (step), colour, label offset
  const META = {
    malpeque: ["na", 0, "brine", 10, -22], wellfleet: ["na", 0, "brine", 62, 4], islandcreek: ["na", 0, "brine", -52, -24], moonstone: ["na", 0, "brine", 40, 30], bluepoint: ["na", 0, "brine", -78, 4],
    rappahannock: ["na", 1, "mild", -86, 8], apalachicola: ["na", 1, "mild", 0, 28],
    kusshi: ["na", 2, "veg", 70, -26], hamahama: ["na", 2, "veg", 84, 2], totten: ["na", 2, "veg", 80, 34],
    marennes: ["eu", 3, "metal", 54, 8], belon: ["eu", 3, "metal", -40, -12], galway: ["eu", 3, "metal", -6, -18],
    hiroshima: ["jp", 3, "veg", 26, -22], ariake: ["jp", 3, "veg", -12, 22], coffin: ["au", 3, "brine", 0, 22], wallis: ["au", 3, "brine", -30, -14]
  };
  const COL = { brine: "#2f6a8c", mild: "#e3b42f", veg: "#7aa04e", metal: "#b0703f" };
  const places = D.places.map((pl) => { const m = META[pl.id]; const P = panels[m[0]]; const [x, y] = P.proj(pl.lon, pl.lat); return { pl, x, y, panel: m[0], grp: m[1], col: COL[m[2]], dx: m[3], dy: m[4] }; });

  function paintPanel(g, key) {
    const P = typeof key === "string" ? panels[key] : key, [bx, by, bw, bh] = P.box;
    key = P.key || key;
    const sea = blobPts(bx + bw / 2, by + bh / 2, bw / 2 + 6, bh / 2 + 6, { wob: 0.03, seed: key.length * 7, n: 120 });
    // squarish organic panel: blend a rounded rect with the blob
    const rr = sea.map(([x, y]) => { const ux = (x - bx - bw / 2) / (bw / 2 + 6), uy = (y - by - bh / 2) / (bh / 2 + 6); const k = 1 / Math.pow(Math.pow(Math.abs(ux), 6) + Math.pow(Math.abs(uy), 6), 1 / 6); return [bx + bw / 2 + (x - bx - bw / 2) * k, by + bh / 2 + (y - by - bh / 2) * k]; });
    mat(g, rr, { seed: key.charCodeAt(0), nblooms: key === "na" ? 2 : 1, edge: 6 });
    g.save(); path(g, rr); g.clip();
    for (const iso of P.iso) for (const ring of GEO[iso] || []) {
      if (ring.length < 4) continue;
      const pts = ring.map(([lon, lat]) => P.proj(lon, lat));
      wash(g, pts, { color: "#f6e8cc", mottle: 0.04, mscale: 0.8, edge: 2.5, edgeColor: "#c4a576", edgeA: 0.7, soft: 0.3, seed: 3 });
    }
    for (const iso of P.iso) for (const ring of GEO[iso] || []) if (ring.length >= 4) contour(g, ring.map(([lon, lat]) => P.proj(lon, lat)), { w: 0.9, color: "#8a6a40", a: 0.55, jit: 0.15 });
    g.restore();
  }

  function active(p) { return Math.min(3, Math.floor(p + 0.15)); }

  // how much of phone view k shows at p (cross-fading around each step change)
  const viewA = (p, k) => (k === 0 ? 1 : seg(p, k - 0.32, k - 0.16)) * (k === 3 ? 1 : 1 - seg(p, k + 0.52, k + 0.66));
  // places on a phone view, with their spot on it
  function inView(V) {
    const out = [];
    for (const P of V) for (const q of places) {
      if (P.reg ? q.panel !== P.reg : q.panel !== "na") continue;
      const [x, y] = P.proj(q.pl.lon, q.pl.lat);
      if (x < P.box[0] || x > P.box[0] + P.box[2] || y < P.box[1] || y > P.box[1] + P.box[3]) continue;
      out.push({ q, x, y, P });
    }
    return out;
  }
  const MVP = MV.map(inView);
  // inset rows: spread the listed places so their lines never touch
  MVP[3].forEach((d) => (d.ly = d.y));
  for (const V of MV[3]) {
    const row = MVP[3].filter((d) => d.P === V).sort((a, b) => a.y - b.y);
    for (let i = 1; i < row.length; i++) row[i].ly = Math.max(row[i].ly, row[i - 1].ly + 60);
    const top = V.y + 56;
    if (row.length && row[0].ly < top) { const sh = top - row[0].ly; row.forEach((d) => (d.ly += sh)); }
  }

  function drawPhone(g, st, p, t, item) {
    const sc = st.s * st.dpr, A = active(p);
    for (let k = 0; k < 4; k++) {
      const a = viewA(p, k);
      if (a <= 0.001) continue;
      g.save(); g.globalAlpha = a;
      for (const V of MV[k]) {
        const [bx, by, bw, bh] = V.box;
        blit(g, sprite("mv-" + V.key, sc, bx - 14, by - 14, bw + 28, bh + 28, (g2) => { paintPanel(g2, V); finish(g2, VW, VH, { transparent: true, bloom: 0, warmA: 0.25, haze: 0.08 }); }));
      }
      for (const d of MVP[k]) {
        const q = d.q, on = q.grp === A || item.hover === q.pl.id, r = on ? 7 : 5;
        if (k === 3) { g.save(); g.strokeStyle = "rgba(43,52,64,.45)"; g.lineWidth = 1; g.setLineDash([2, 4]); g.beginPath(); g.moveTo(d.x + 8, d.y); g.lineTo(228, d.ly); g.lineTo(236, d.ly); g.stroke(); g.restore(); }
        if (on) { g.save(); g.strokeStyle = rgba(q.col, 0.5 * (0.5 + 0.5 * Math.sin(t * 2.4))); g.lineWidth = 2; g.beginPath(); g.arc(d.x, d.y, r + 6 + 3 * Math.sin(t * 2.4), 0, 7); g.stroke(); g.restore(); }
        g.fillStyle = "#fffaf0"; g.beginPath(); g.arc(d.x, d.y, r + 2, 0, 7); g.fill(); g.fillStyle = q.col; g.beginPath(); g.arc(d.x, d.y, r, 0, 7); g.fill();
      }
      g.restore();
    }
    // locator: the whole continent, small, with the close-up framed (steps 0–2)
    const la = 1 - seg(p, 2.6, 2.9);
    if (la > 0) {
      const NA = panels.na, k = 0.25, ox = 10 - NA.x * k, oy = 452 - NA.y * k;
      g.save(); g.globalAlpha = la;
      g.translate(ox, oy); g.scale(k, k);
      blit(g, sprite("map-na-mini", sc * k, 0, 0, 1000, 540, (g2) => { paintPanel(g2, "na"); finish(g2, 1000, 540, { transparent: true, bloom: 0, warmA: 0.25, haze: 0.08 }); }));
      for (const q of places) if (q.panel === "na") { g.fillStyle = q.col; g.globalAlpha = la * (q.grp === A ? 1 : 0.55); g.beginPath(); g.arc(q.x, q.y, q.grp === A ? 9 : 6, 0, 7); g.fill(); }
      g.globalAlpha = la;
      const V = MV[Math.min(2, A)][0], [x0, y0] = NA.proj(V.lon[0], V.lat[1]), [x1, y1] = NA.proj(V.lon[1], V.lat[0]);
      g.strokeStyle = "#fffaf0"; g.lineWidth = 5; g.strokeRect(x0, y0, x1 - x0, y1 - y0);
      g.restore();
    }
  }
  function phoneLabels(p, item) {
    const A = active(p), out = [];
    for (let k = 0; k < 4; k++) {
      const a = viewA(p, k);
      for (const d of MVP[k]) {
        const q = d.q, on = q.grp === A || item.hover === q.pl.id;
        const id = "m" + k + q.pl.id;
        if (k === 3) { out.push({ id, x: 240, y: d.ly, align: "left", cls: "map mm", html: `${q.pl.name}<small>${q.pl.note}</small>`, a: a * (on ? 1 : 0.6) }); continue; }
        const [dx, dy, al] = ML[q.pl.id] || [0, 30, "c"];
        out.push({ id, x: d.x + dx, y: d.y + dy, align: al === "l" ? "left" : al === "r" ? "right" : null, cls: "map mm" + (al === "c" ? " stack" : al === "r" ? " rt" : ""),
          html: on ? `${q.pl.name}<small>${q.pl.note}</small>` : q.pl.name, a: a * (on ? 1 : 0.5) });
      }
    }
    MV[3].forEach((V) => out.push({ id: "r" + V.key, x: 240, y: V.y + 14, align: "left", cls: "map kick", html: V.name, a: viewA(p, 3) }));
    const ka = 1 - seg(p, 2.6, 2.9);
    out.push({ id: "key", x: 300, y: 538, align: "left", cls: "map keys", a: 0.9 * ka, html: `<span style="color:#2f6a8c">●</span> briny<br><span style="color:#e3b42f">●</span> mild, sweet<br><span style="color:#7aa04e">●</span> cucumber, melon<br><span style="color:#b0703f">●</span> metallic` });
    return out;
  }

  window.Scenes = window.Scenes || {};
  window.Scenes.merroir = {
    VW, VH, anim: true,
    layout(n) { M = n; VW = n ? 600 : 1000; VH = n ? 700 : 805; this.VW = VW; this.VH = VH; },
    draw(g, st, p, t, item) {
      if (M) return drawPhone(g, st, p, t, item);
      const sc = st.s * st.dpr, A = active(p);
      blit(g, sprite("map-na", sc, 0, 0, VW, 540, (g2) => { paintPanel(g2, "na"); finish(g2, VW, 540, { transparent: true, bloom: 0, warmA: 0.25, haze: 0.08 }); }));
      const ins = ease(seg(p, 2.4, 3.0));
      blit(g, sprite("map-in", sc, 0, 530, VW, 260, (g2) => { paintPanel(g2, "eu"); paintPanel(g2, "jp"); paintPanel(g2, "au"); finish(g2, VW, 260, { transparent: true, bloom: 0, warmA: 0.25, haze: 0.08 }); }), 0, 20 * (1 - ins), 0.25 + 0.75 * ins);
      for (const q of places) {
        const on = q.grp === A, past = q.grp < A, hov = item.hover === q.pl.id;
        if (q.panel !== "na" && ins < 0.05) continue;
        const r = on || hov ? 7 : 4.5, a = on || hov ? 1 : past ? 0.75 : 0.35;
        if (on || hov) { g.save(); g.strokeStyle = rgba(q.col, 0.5 * (0.5 + 0.5 * Math.sin(t * 2.4))); g.lineWidth = 2; g.beginPath(); g.arc(q.x, q.y, r + 6 + 3 * Math.sin(t * 2.4), 0, 7); g.stroke(); g.restore(); }
        g.save(); g.globalAlpha = a; g.fillStyle = "#fffaf0"; g.beginPath(); g.arc(q.x, q.y, r + 2, 0, 7); g.fill(); g.fillStyle = q.col; g.beginPath(); g.arc(q.x, q.y, r, 0, 7); g.fill(); g.restore();
      }
    },
    labels(p, item) {
      if (M) return phoneLabels(p, item);
      const A = active(p), ins = seg(p, 2.4, 3.0), out = [];
      for (const q of places) {
        const on = q.grp === A || item.hover === q.pl.id;
        if (q.panel !== "na" && ins < 0.5) continue;
        out.push({ id: q.pl.id, x: q.x + q.dx, y: q.y + q.dy, cls: "map", html: on ? `${q.pl.name}<small>${q.pl.note}</small>` : q.pl.name, a: on ? 1 : q.grp < A ? 0.55 : 0.3 });
      }
      out.push({ id: "pfr", x: panels.eu.x + panels.eu.w / 2, y: 797, html: "France · Ireland", a: 0.4 + 0.6 * ins });
      out.push({ id: "pjp", x: panels.jp.x + panels.jp.w / 2, y: 797, html: "Japan", a: 0.4 + 0.6 * ins });
      out.push({ id: "pau", x: panels.au.x + panels.au.w / 2, y: 797, html: "Australia", a: 0.4 + 0.6 * ins });
      out.push({ id: "key", x: 500, y: 546, a: 0.85, html: `<span style="color:#2f6a8c">●</span> briny &nbsp;<span style="color:#e3b42f">●</span> mild, sweet &nbsp;<span style="color:#7aa04e">●</span> cucumber, melon &nbsp;<span style="color:#b0703f">●</span> metallic` });
      return out;
    },
    hot(p) {
      const tipOf = (q) => `<b>${q.pl.name}</b>${q.pl.note}<span class="src">source ${q.pl.src}${q.pl.flag ? " · flagged" : ""}</span>`;
      if (M) { const k = Math.min(3, Math.floor(p + 0.25)); return MVP[k].map((d) => ({ id: d.q.pl.id, x: d.x, y: d.y, r: 22, html: tipOf(d.q) })); }
      return places.map((q) => ({ id: q.pl.id, x: q.x, y: q.y, r: 18, html: `<b>${q.pl.name}</b>${q.pl.note}<span class="src">source ${q.pl.src}${q.pl.flag ? " · flagged" : ""}</span>` })); }
  };
})();
