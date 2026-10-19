/* Explainer kit · answer clips. Draws a clip the agent scripted, shot by shot, with
   every element popping in on the word that names it. Templates only call the
   project's style (roles "ink" and "accent", plus prop() and mark()), so the same
   clip renders in riso, ink, crayon or anything else.
     const A = AnswerKit(makeStyle(canvas));   A.render(clip, t);   A.cues(clip) */
(function (root) {
  "use strict";
  const { clamp, lerp, seg, eOut, eInOut, pop } = root.ExplainerStage.ease;
  const norm = (x) => String(x || "").toLowerCase().replace(/[^a-z0-9$%€£]/g, "");

  function AnswerKit(S) {
    const W = S.W, H = S.H, cx = W / 2;
    let HOT = "";
    const hots = [];
    function hot(x, y, w, h, label, ask) {
      if (S.alphaNow() < 0.45 || !label) return;
      const m = S.getTransform(), p1 = m.transformPoint(new DOMPoint(x, y)), p2 = m.transformPoint(new DOMPoint(x + w, y + h));
      hots.push({ x: Math.min(p1.x, p2.x), y: Math.min(p1.y, p2.y), w: Math.abs(p2.x - p1.x), h: Math.abs(p2.y - p1.y), label, ask: ask || `Tell me more about ${String(label).replace(/[.?!]+$/, "").replace(/^./, (c) => c.toLowerCase())}` });
    }
    function kword(role, s, x, y, t, t0, o = {}) {
      const k = pop(clamp((t - t0) / 0.45)); if (k <= 0) return;
      S.save(); S.translate(x, y); S.scale(k, k); S.rotate((1 - Math.min(1, k)) * -0.1);
      S.text(role, s, 0, 0, Object.assign({ a: clamp((t - t0) / 0.15) }, o)); S.restore();
    }
    const fit = (s, maxW, size, font = "display") => { const w = S.measure(s, size, font); return w > maxW ? Math.floor((size * maxW) / w) : size; };
    function wrap(s, maxW, size, font = "display") { const out = []; let cur = ""; for (const w of String(s || "").split(/\s+/)) { const tt = cur ? cur + " " + w : w; if (S.measure(tt, size, font) > maxW && cur) { out.push(cur); cur = w; } else cur = tt; } if (cur) out.push(cur); return out; }
    function cueAt(sh, cue, j, n) {
      const c = norm(cue);
      if (c) { const w = sh.words.find((w) => norm(w.w) === c) || sh.words.find((w) => norm(w.w).startsWith(c)); if (w) return w.a; }
      return sh.s + 0.3 + ((j + 0.4) / Math.max(1, n)) * Math.max(0.6, (sh.e - sh.s) * 0.75);
    }
    function countUp(value, k) {
      const m = String(value || "").match(/^([^\d-]*)(-?[\d,]*\.?\d+)(.*)$/);
      if (!m || /^\d{4}$/.test(m[2])) return value;
      const n = parseFloat(m[2].replace(/,/g, "")), dec = (m[2].split(".")[1] || "").length, v = n * eOut(k);
      return m[1] + (dec ? v.toFixed(dec) : Math.round(v).toLocaleString("en-US")) + m[3];
    }
    const prop = (name, x, y, size, t, t0) => {
      if (!name || name === "none" || !S.prop) return false;
      const k = pop(seg(t, t0, t0 + 0.6)); if (k <= 0) return true;
      const ok = S.prop(name, x, y, size * k, t - t0);
      if (ok !== false && k > 0.8 && HOT) hot(x - 220 * size, y - 230 * size, 440 * size, 460 * size, HOT);
      return ok !== false;
    };
    const head = (sh, t) => { if (sh.headline) kword("ink", sh.headline, cx, 150, t, sh.s - 0.1, { size: fit(sh.headline, 1500, 64) }); };
    const square = (role, x, y, w, h, a = 1) => S.fill(role, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], a);
    const mark = (role, x, y, r, a = 1) => (S.mark ? S.mark(role, x, y, r, a) : S.circle(role, x, y, r, a));

    const KIT = {
      title(sh, t, clip) {
        S.text("muted", "YOU ASKED", cx, 290, { size: 30, font: "mono", a: seg(t, sh.s - 0.3, sh.s + 0.2) });
        const size = 104, lines = wrap(sh.headline || clip.question, 1500, size);
        lines.forEach((l, li) => kword("accent", l, cx, 450 + li * size * 1.06, t, sh.s - 0.2 + li * 0.18, { size }));
        const yl = 450 + lines.length * size * 1.06 - 40, k = eOut(seg(t, sh.s + 0.2, sh.s + 1));
        S.line("ink", [[cx - 340 * k, yl], [cx + 340 * k, yl + 3]], 6);
        prop(sh.prop, cx, yl + 230, 0.66, t, sh.s + 0.5);
        if (clip.atLabel) S.text("muted", `paused at ${clip.atLabel}`, cx, 1010, { size: 26, font: "mono", a: seg(t, sh.s + 0.5, sh.s + 1) });
      },
      bignumber(sh, t) {
        head(sh, t);
        const t0 = cueAt(sh, sh.items?.[0]?.cue, 0, 1) - 0.2, k = seg(t, t0, t0 + 1.3), has = sh.prop && sh.prop !== "none", x = has ? 760 : cx;
        S.circle("accent", x, 520, 330 * pop(seg(t, t0 - 0.3, t0 + 0.4)), 0.2);
        S.text("ink", countUp(sh.value, k), x, 600, { size: fit(sh.value, has ? 900 : 1500, 250), a: seg(t, t0, t0 + 0.2) });
        if (has) prop(sh.prop, 1480, 540, 0.85, t, t0 + 0.4);
        if (k > 0.5) hot(x - 330, 190, 660, 660, `${sh.value}: ${sh.caption || sh.headline}`);
        if (sh.caption) wrap(sh.caption, 1300, 50, "body").forEach((l, i) => kword("ink", l, cx, 900 + i * 62, t, t0 + 0.6 + i * 0.15, { size: 50, font: "body" }));
      },
      compare(sh, t) {
        head(sh, t);
        const it = (sh.items || []).slice(0, 3), max = Math.max(...it.map((x) => Math.abs(x.value) || 0), 1e-9), side = (v) => Math.max(18, Math.sqrt(Math.abs(v) / max) * 560);
        const sides = it.map((x) => side(x.value)), total = sides.reduce((a, c) => a + Math.max(c, 220), 0) + 80 * (it.length - 1), base = 860;
        let x = cx - total / 2;
        it.forEach((d, j) => {
          const t0 = cueAt(sh, d.cue, j, it.length), k = pop(seg(t, t0, t0 + 0.55)), sd = sides[j] * k, c = x + Math.max(sides[j], 220) / 2;
          if (sd > 0) square(j ? "ink" : "accent", c - sd / 2, base - sd, sd, sd, j ? 0.8 : 0.95);
          kword("ink", d.note || String(d.value), c, base - sd - 24, t, t0 + 0.2, { size: 54 });
          kword("ink", d.label, c, base + 60, t, t0 + 0.3, { size: fit(d.label, Math.max(sides[j], 220) + 40, 36, "body"), font: "body" });
          if (k > 0.8) hot(c - Math.max(sd, 160) / 2, base - Math.max(sd, 120) - 60, Math.max(sd, 160), Math.max(sd, 120) + 120, `${d.note || d.value}: ${d.label}`, `Tell me more about ${d.label}`);
          x += Math.max(sides[j], 220) + 80;
        });
      },
      bars(sh, t) {
        head(sh, t);
        const it = (sh.items || []).slice(0, 6), max = Math.max(...it.map((x) => Math.abs(x.value) || 0), 1e-9), rh = Math.min(120, 640 / Math.max(1, it.length)), top = 260;
        S.line("ink", [[700, top - 20], [700, top + it.length * rh]], 5);
        it.forEach((d, j) => {
          const t0 = cueAt(sh, d.cue, j, it.length), k = eOut(seg(t, t0, t0 + 0.8)), y = top + j * rh, w = (Math.abs(d.value) / max) * 900 * k;
          S.text("ink", d.label, 670, y + rh * 0.5, { size: fit(d.label, 560, 40, "body"), font: "body", align: "right", a: seg(t, t0 - 0.2, t0) });
          if (w > 0) square("accent", 704, y + rh * 0.15, w, rh * 0.6);
          S.text("ink", d.note || String(d.value), 724 + w, y + rh * 0.58, { size: 40, align: "left", a: seg(t, t0 + 0.4, t0 + 0.7) });
          if (k > 0.8) hot(140, y, 704 + w + 20, rh * 0.9, `${d.label}: ${d.note || d.value}`, `Tell me more about ${d.label}`);
        });
      },
      timeline(sh, t) {
        head(sh, t);
        const it = (sh.items || []).slice(0, 6).sort((a, c) => a.value - c.value), n = it.length, y0 = it[0]?.value ?? 0, y1 = it[n - 1]?.value ?? 1;
        const X = (v) => (n < 2 ? cx : 220 + ((v - y0) / (y1 - y0 || 1)) * 1480), slot = (j) => (n < 2 ? cx : 260 + (j / (n - 1)) * 1400), k = eOut(seg(t, sh.s - 0.3, sh.s + 0.9));
        S.line("ink", [[180, 560], [lerp(180, 1740, k), 562]], 7);
        it.forEach((d, j) => {
          const t0 = cueAt(sh, d.cue, j, n); if (t < t0) return;
          const x = X(d.value), up = j % 2 === 0, lx = slot(j);
          mark("accent", x, 562, 18 * pop(seg(t, t0, t0 + 0.4)));
          S.line("ink", up ? [[x, 536], [lx, 470]] : [[x, 588], [lx, 652]], 2.5);
          kword("ink", d.label, lx, up ? 440 : 712, t, t0 + 0.1, { size: 54 });
          wrap(d.note, 300, 32, "body").forEach((l, li, ar) => kword("ink", l, lx, up ? 390 - (ar.length - 1 - li) * 38 : 760 + li * 38, t, t0 + 0.25, { size: 32, font: "body" }));
          hot(lx - 150, up ? 300 : 660, 300, 150, `${d.label}: ${d.note}`, `What happened in ${d.label}: ${d.note}?`);
        });
      },
      count(sh, t) {
        head(sh, t);
        const N = clamp(parseInt(String(sh.value).replace(/[^\d]/g, ""), 10) || 100, 1, 300), cols = N > 120 ? 25 : N > 40 ? 20 : 10, rows = Math.ceil(N / cols), cell = Math.min(52, 1300 / cols, 560 / rows);
        const t0 = cueAt(sh, sh.items?.[0]?.cue, 0, 1), k = eInOut(seg(t, t0, t0 + Math.max(1.2, (sh.e - t0) * 0.7))), shown = Math.round(N * k), x0 = cx - (cols * cell) / 2, y0 = 260;
        for (let i = 0; i < shown; i++) mark("ink", x0 + ((i % cols) + 0.5) * cell, y0 + (Math.floor(i / cols) + 0.5) * cell * 1.05, cell * 0.36);
        S.text("accent", shown.toLocaleString("en-US"), cx, y0 + rows * cell * 1.05 + 120, { size: 96, a: seg(t, t0, t0 + 0.2) });
        if (sh.caption) kword("ink", sh.caption, cx, y0 + rows * cell * 1.05 + 190, t, t0 + 0.4, { size: fit(sh.caption, 1400, 40, "body"), font: "body" });
        if (shown) hot(x0, y0, cols * cell, rows * cell * 1.05 + 140, `${shown} ${sh.caption || ""}`.trim());
      },
      proportion(sh, t) {
        head(sh, t);
        const n = clamp(parseFloat(String(sh.value).replace(/[^\d.]/g, "")) || 0, 0, 100), t0 = cueAt(sh, sh.items?.[0]?.cue, 0, 1), k = eInOut(seg(t, t0, t0 + 1.4)), lit = Math.round(n * k), cell = 56, x0 = cx - 5 * cell - 260, y0 = 300;
        for (let i = 0; i < 100; i++) mark(i < lit ? "accent" : "muted", x0 + ((i % 10) + 0.5) * cell, y0 + (Math.floor(i / 10) + 0.5) * cell, cell * (i < lit ? 0.36 : 0.24), i < lit ? 1 : 0.5);
        S.text("accent", `${Math.round(n * eOut(k))}%`, 1360, 620, { size: 190, a: seg(t, t0, t0 + 0.2) });
        if (sh.caption) wrap(sh.caption, 560, 42, "body").forEach((l, i) => kword("ink", l, 1360, 720 + i * 52, t, t0 + 0.5 + i * 0.12, { size: 42, font: "body" }));
        hot(x0, y0, cell * 10, cell * 10, `${n} in 100: ${sh.caption || sh.headline}`);
      },
      beforeafter(sh, t) {
        head(sh, t);
        const it = (sh.items || []).slice(0, 2), max = Math.max(...it.map((d) => Math.abs(d.value) || 0), 1e-9), base = 820;
        it.forEach((d, j) => {
          const t0 = cueAt(sh, d.cue, j, 2), k = eOut(seg(t, t0, t0 + 0.8)), x = j ? 1260 : 660, h = (Math.abs(d.value) / max) * 520 * k;
          if (t < t0) return;
          square(j ? "accent" : "ink", x - 110, base - h, 220, h, j ? 1 : 0.8);
          kword("ink", d.note || String(d.value), x, base - h - 28, t, t0 + 0.3, { size: 64 });
          kword("ink", d.label, x, base + 60, t, t0 + 0.2, { size: fit(d.label, 420, 40, "body"), font: "body" });
          if (k > 0.8) hot(x - 140, base - h - 90, 280, h + 170, `${d.label}: ${d.note || d.value}`);
        });
        const ka = eOut(seg(t, cueAt(sh, it[1]?.cue, 1, 2) - 0.3, cueAt(sh, it[1]?.cue, 1, 2) + 0.4));
        if (ka > 0) { S.line("accent", [[800, 560], [lerp(800, 1110, ka), 560]], 7); if (ka > 0.9) S.line("accent", [[1080, 530], [1112, 560], [1080, 590]], 7); }
      },
      list(sh, t) {
        head(sh, t);
        const it = (sh.items || []).slice(0, 4), n = it.length, top = 560 - ((n - 1) * 150) / 2, has = sh.prop && sh.prop !== "none", x0 = has ? 200 : 420, mw = has ? 900 : 1100;
        it.forEach((d, j) => { const t0 = cueAt(sh, d.cue, j, n), y = top + j * 150; mark("accent", x0, y - 22, 30 * pop(seg(t, t0, t0 + 0.4))); kword("ink", d.label, x0 + 70, y, t, t0 + 0.05, { size: fit(d.label, mw, 72), align: "left" }); if (t > t0 + 0.3) hot(x0 - 40, y - 80, mw + 120, 110, d.label); });
        if (has) prop(sh.prop, 1500, 580, 1, t, sh.s + 0.2);
      },
      versus(sh, t) {
        head(sh, t);
        (sh.items || []).slice(0, 2).forEach((d, j) => {
          const x = j ? 1260 : 660, t0 = cueAt(sh, d.cue, j, 2), k = pop(seg(t, t0, t0 + 0.55)); if (k <= 0) return;
          S.save(); S.translate(x, 820); S.scale(k, k);
          const ip = d.prop && d.prop !== "none" ? d.prop : j ? "versusB" : "versusA";   // each side can name its own drawing
          if (!(S.prop && S.prop(ip, 0, -260, 1.1, t - t0) !== false)) square(j ? "accent" : "ink", -150, -520, 300, 520, 0.85);
          S.restore();
          kword(j ? "accent" : "ink", d.note, x, 230, t, t0 + 0.3, { size: fit(d.note, 520, 64) });
          kword("ink", d.label, x, 920, t, t0 + 0.3, { size: fit(d.label, 520, 44, "body"), font: "body" });
          if (k > 0.8) hot(x - 200, 180, 400, 760, `${d.label}: ${d.note}`, `Tell me more about ${d.label}`);
        });
        kword("muted", "vs", cx, 560, t, sh.s + 0.4, { size: 80 });
      },
      quote(sh, t) {
        S.text("accent", "“", 330, 520, { size: 420, a: seg(t, sh.s - 0.3, sh.s + 0.2) });
        const has = sh.prop && sh.prop !== "none", lines = wrap(sh.headline, has ? 900 : 1250, 72, "body");
        if (has) prop(sh.prop, 1530, 560, 0.8, t, sh.s + 0.3);
        lines.forEach((l, i) => kword("ink", l, 420, 380 + i * 92, t, sh.s + i * 0.25, { size: 72, font: "body", align: "left" }));
        if (sh.caption) kword("accent", `— ${sh.caption}`, 420, 380 + lines.length * 92 + 60, t, sh.s + lines.length * 0.25 + 0.3, { size: 38, font: "body", align: "left" });
        if (t > sh.s + 0.6) hot(400, 300, has ? 940 : 1290, lines.length * 92 + 120, sh.caption ? `Said by ${sh.caption}` : sh.headline, sh.caption ? `Who is ${sh.caption.split(/[,(]/)[0].trim()}?` : null);
      },
    };

    function render(clip, t) {
      hots.length = 0;
      S.begin(t);
      const shots = clip.shots, n = shots.length, dx = Math.sin(t * 0.21) * 10, dy = Math.cos(t * 0.17) * 6, zs = 1 + Math.sin(t * 0.11) * 0.008;
      for (let i = 0; i < n; i++) {
        const sh = shots[i], s = i ? sh.s - 0.25 : 0, e = i < n - 1 ? shots[i + 1].s - 0.25 : clip.total + 1, X = 0.35;
        if (t < s - X || t > e + X) continue;
        const enter = i ? eInOut(seg(t, s - X, s + X * 0.6)) : 1, exit = i < n - 1 ? eInOut(seg(t, e - X * 0.6, e + X)) : 0, a = enter * (1 - exit);
        if (a <= 0.003) continue;
        S.alpha(a);
        const z = zs * (0.96 + 0.04 * enter) * (1 + 0.05 * exit);
        S.setTransform(1, 0, 0, 1, 0, 0); S.translate(W / 2 + dx, H / 2 + dy); S.scale(z, z); S.translate(-W / 2, -H / 2); S.translate((1 - enter) * 60 - exit * 60, 0);
        HOT = sh.kind === "title" ? "" : sh.caption || sh.headline || "";
        (KIT[sh.kind] || KIT.list)(sh, t, clip);
      }
      S.end(t);
      root.__hots = hots.slice();
    }
    function cues(clip) {
      const out = [];
      for (const sh of clip.shots) for (let i = 0; i < sh.words.length; i += 7) { const ws = sh.words.slice(i, i + 7); out.push({ a: ws[0].a, b: ws.at(-1).b + 0.3, t: ws.map((w) => w.w).join(" ") }); }
      return out;
    }
    return { render, cues, canvas: S.canvas };
  }
  root.AnswerKit = AnswerKit;
})(window);
