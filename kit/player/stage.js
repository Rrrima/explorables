/* Explainer kit · stage. Runs a project's scenes against its narration schedule.
   A project supplies:
     style   – drawing primitives in its own look (see kit/README in the repo: Style contract)
     scenes  – an array of functions (x) => void, one per narration segment
   and gets renderAt(t): one frame at time t, frame-accurate and seekable.
   Each scene receives a helper `x` with timing (x.word("kilo")), easing, kinetic
   type (x.kword) and hotspots (x.hot) that make things in the picture explain themselves. */
(function (root) {
  "use strict";
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const eOut = (t) => 1 - Math.pow(1 - t, 3);
  const eInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const eBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const pop = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : eBack(t));
  const norm = (w) => String(w).toLowerCase().replace(/[^a-z0-9$%€£]/g, "");
  const E = { clamp, lerp, seg, eOut, eInOut, eBack, pop };

  function Stage({ style, schedule, scenes, endCard, drift = true, X = 0.35 }) {
    const S = schedule, n = scenes.length, St = style;
    const wordIn = (si, frag, nth = 0) => { const sc = S.scenes[si]; if (!sc) return 0; const f = norm(frag); let k = 0; for (const w of sc.words) if (norm(w.w).startsWith(f)) { if (k === nth) return w.a; k++; } return sc.s; };
    const sStart = (i) => S.scenes[i].s, sEnd = (i) => (i < S.scenes.length - 1 ? S.scenes[i + 1].s : S.total);
    let hots = [];
    function hot(x, y, w, h, label, ask) {
      if (St.alphaNow() < 0.45 || !label) return;
      const m = St.getTransform(), p1 = m.transformPoint(new DOMPoint(x, y)), p2 = m.transformPoint(new DOMPoint(x + w, y + h));
      hots.push({ x: Math.min(p1.x, p2.x), y: Math.min(p1.y, p2.y), w: Math.abs(p2.x - p1.x), h: Math.abs(p2.y - p1.y), label, ask: ask || `Tell me more about ${String(label).replace(/[.?!]+$/, "").replace(/^./, (c) => c.toLowerCase())}` });
    }
    // a word that pops in with overshoot at t0
    function kword(role, str, x, y, t, t0, opts = {}) {
      const k = pop(clamp((t - t0) / 0.45));
      if (k <= 0) return;
      St.save(); St.translate(x, y); St.scale(k, k); St.rotate((1 - Math.min(1, k)) * -0.12);
      St.text(role, str, 0, 0, Object.assign({ a: clamp((t - t0) / 0.15) }, opts));
      St.restore();
    }
    function renderAt(t) {
      hots = [];
      St.begin(t);
      const dx = drift ? Math.sin(t * 0.21) * 10 : 0, dy = drift ? Math.cos(t * 0.17) * 6 : 0, zs = drift ? 1 + Math.sin(t * 0.11) * 0.008 : 1;
      const lastEnd = S.scenes[n - 1].e;
      for (let i = 0; i < n; i++) {
        const s = sStart(i), e = i === n - 1 ? lastEnd + 0.6 : sEnd(i);
        if (t < s - X || t > e + X) continue;
        const enter = eInOut(seg(t, s - X, s + X * 0.6)), exit = eInOut(seg(t, e - X * 0.6, e + X)), a = enter * (1 - exit);
        if (a <= 0.003) continue;
        St.alpha(a);
        const z = zs * (0.96 + 0.04 * enter) * (1 + 0.05 * exit);
        St.setTransform(1, 0, 0, 1, 0, 0);
        St.translate(St.W / 2 + dx, St.H / 2 + dy); St.scale(z, z); St.translate(-St.W / 2, -St.H / 2);
        St.translate((1 - enter) * 60 - exit * 60, 0);
        const x = Object.assign({ t, s, e, i, enter, exit, S: St, word: (f, k) => wordIn(i, f, k), wordIn, kword: (role, str, px, py, t0, o) => kword(role, str, px, py, t, t0, o), hot }, E);
        scenes[i](x);
      }
      if (endCard && t > lastEnd + 0.4) { St.setTransform(1, 0, 0, 1, 0, 0); St.alpha(eOut(seg(t, lastEnd + 0.4, lastEnd + 1.2))); endCard({ t, s: lastEnd + 0.4, S: St, ...E }); }
      St.end(t);
      root.__hots = hots;
    }
    return { renderAt, total: S.total, canvas: St.canvas, wordIn };
  }

  /* ---------- a base for styles: several layer canvases moved together ---------- */
  // Styles call Layers(canvas, ["a", "b"]) and get per-layer contexts plus shared
  // transform/alpha bookkeeping; they implement the drawing primitives themselves.
  function Layers(canvas, names, { W = 1920, H = 1080 } = {}) {
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    const L = {};
    names.forEach((n) => { const c = document.createElement("canvas"); c.width = W; c.height = H; L[n] = c.getContext("2d"); });
    const all = Object.values(L);
    let A = 1;
    return {
      W, H, canvas, ctx, L, all,
      alpha(a) { A = a; all.forEach((g) => (g.__alpha = a)); },
      alphaNow: () => A,
      setTransform: (...m) => all.forEach((g) => g.setTransform(...m)),
      getTransform: () => all[0].getTransform(),
      save: () => all.forEach((g) => g.save()),
      restore: () => all.forEach((g) => g.restore()),
      translate: (x, y) => all.forEach((g) => g.translate(x, y)),
      scale: (x, y = x) => all.forEach((g) => g.scale(x, y)),
      rotate: (r) => all.forEach((g) => g.rotate(r)),
      clearLayers: () => all.forEach((g) => { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); g.restore(); g.globalAlpha = 1; }),
    };
  }

  root.ExplainerStage = { Stage, Layers, ease: E };
})(window);
