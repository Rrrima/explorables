/* Article: scroll-driven stages, hover hotspots with sparkles, nav, hero and coda.
   Each chapter's drawing lives in js/scenes.js as SCENES[id] = { init(st), draw(g, w, h, s, st) }.
   s runs in step units: 0 at the first step's top crossing mid-screen, 1 at the second, … */
(function () {
  "use strict";
  const F = window.Fuzz, D = window.DATA, SC = window.SCENES || {};
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const now = () => performance.now();

  /* ---------- sparkles + tooltips ---------- */
  function sparkle(g, x, y, r, t, a = 0.75) {
    const k = 0.75 + 0.25 * Math.sin(t / 420 + x * 0.1);
    g.save(); g.translate(x, y); g.globalAlpha *= a; g.fillStyle = F.PAL.ink;
    const R = r * k, q = R * 0.18;
    g.beginPath(); g.moveTo(0, -R); g.quadraticCurveTo(q, -q, R, 0); g.quadraticCurveTo(q, q, 0, R); g.quadraticCurveTo(-q, q, -R, 0); g.quadraticCurveTo(-q, -q, 0, -R); g.fill();
    g.restore();
  }
  function bindTip(box, canvas, tip, getHots, onHover) {
    let cur = null;
    canvas.addEventListener("mousemove", (e) => {
      const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      const hots = getHots() || [];
      let best = null, bd = 1e9;
      for (const h of hots) { const d = Math.hypot(h.x - x, h.y - y); if (d < h.r && d < bd) { best = h; bd = d; } }
      canvas.classList.toggle("hot", !!best);
      if (best !== cur) { cur = best; onHover && onHover(best); }
      if (!best) { tip.classList.remove("on"); return; }
      tip.innerHTML = best.html;
      const br = box.getBoundingClientRect();
      let tx = e.clientX - br.left + 16, ty = e.clientY - br.top + 14;
      if (tx + 250 > br.width) tx = e.clientX - br.left - 256;
      tip.style.left = tx + "px"; tip.style.top = ty + "px"; tip.classList.add("on");
    });
    canvas.addEventListener("mouseleave", () => { tip.classList.remove("on"); cur = null; onHover && onHover(null); });
  }
  const tipHTML = (title, body, src) => `<b>${title}</b>${body}${src ? ` <span class="s">${src}</span>` : ""}`;
  window.tipHTML = tipHTML;

  /* ---------- chapters ---------- */
  const chapters = [...document.querySelectorAll(".chapter[data-scene]")].map((sec) => {
    const st = {
      sec, id: sec.dataset.scene, def: SC[sec.dataset.scene], canvas: sec.querySelector(".stage canvas"), tip: sec.querySelector(".stage .tip"),
      steps: [...sec.querySelectorAll(".step")], s: -1, last: null, ready: false, hots: [], hover: null, dirty: true, data: {},
    };
    bindTip(sec.querySelector(".stage"), st.canvas, st.tip, () => st.hots, (h) => { st.hover = h; st.dirty = true; });
    return st;
  });
  function progress(st) {
    // the reading line: mid-screen beside the stage; on phones, in the band below the pinned stage
    const sb = st.canvas.parentElement.getBoundingClientRect().bottom, stacked = getComputedStyle(st.sec).display === "block";   // phone portrait: stage above the text
    const mid = stacked ? sb + (innerHeight - sb) * 0.35 : innerHeight * 0.5;
    let s = -1;
    st.steps.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      if (i === 0) s = Math.max(-1, (mid - r.top) / r.height);
      if (r.top <= mid) s = i + Math.min(1, (mid - r.top) / r.height);
    });
    return s;
  }

  /* ---------- hero ---------- */
  const hero = { canvas: document.querySelector(".hero-canvas"), tip: document.querySelector(".hero .tip"), cast: null, sprites: [], t0: 0, hots: [], key: "" };
  const calico = (R) => (x, y) => ((x > R * 0.2 && y < -R * 0.1) || (x < -R * 0.55 && y < -R * 0.35) ? "ginger" : null);
  const tabby = (R) => (x, y) => (Math.sin((x * 0.6 + y) / (R * 0.13)) > 0.5 && Math.abs(x) > R * 0.12 ? "ginger" : null);
  function heroCast(w, h) {
    const m = w < 860, R = m ? Math.min(w * 0.2, h * 0.11) : Math.min(h * 0.16, w * 0.105);
    const P = Math.PI;
    if (m) return [
      { k: "dog", o: { breed: "collie", R, seed: 5, body: { ang: P * 1.25, len: 2.6, w: 1.8 }, face: { expr: "pant" } }, x: 0.2, y: 0.12, rot: 0.3, hot: ["Border Collie", "Rank 1. 190 of 199 judges put it in their top ten.", "D1"] },
      { k: "cat", o: { coat: "dark", R: R * 0.95, seed: 8, body: { ang: 0, len: 2.4, w: 2 }, face: { yellow: true } }, x: 0.93, y: 0.1, rot: -0.35 },
      { k: "dog", o: { breed: "afghan", R, seed: 9, body: { ang: P / 2, len: 2.2, w: 1.8 } }, x: 0.22, y: 0.93, rot: 0.06, hot: ["Afghan Hound", "Rank 79, the last. 121 judges put it in their bottom ten.", "D1"] },
      { k: "cat", o: { coat: "grey", R: R * 0.95, seed: 21, body: { ang: P * 0.4, len: 2.4, w: 1.9 } }, x: 0.84, y: 0.95, rot: -0.1 },
    ];
    return [
      { k: "dog", o: { breed: "collie", R, seed: 5, body: { ang: P * 1.22, len: 2.6, w: 1.8 }, face: { expr: "pant" } }, x: 0.11, y: 0.2, rot: 0.32, hot: ["Border Collie", "Rank 1 of 79. 190 of 199 judges put it in their top ten.", "D1"] },
      { k: "cat", o: { coat: "cream", R: R * 0.95, seed: 3, body: { ang: P, len: 2.6, w: 1.9 }, patches: calico(R * 0.95), bodyPatches: (x, y) => (x < -R * 1.6 && y < 0 ? "ginger" : null), face: { look: 1 } }, x: 0.06, y: 0.6, rot: -0.22 },
      { k: "dog", o: { breed: "afghan", R, seed: 9, body: { ang: P / 2, len: 2.2, w: 1.8 } }, x: 0.2, y: 0.9, rot: 0.08, hot: ["Afghan Hound", "Rank 79, the last. 121 of 199 judges put it in their bottom ten.", "D1"] },
      { k: "cat", o: { coat: "orange", R: R * 0.72, seed: 34, body: { ang: P / 2, len: 2, w: 1.9 }, patches: tabby(R * 0.72) }, x: 0.5, y: 0.97, rot: 0.04 },
      { k: "cat", o: { coat: "grey", R, seed: 21, body: { ang: P * 0.42, len: 2.6, w: 1.9 } }, x: 0.92, y: 0.76, rot: -0.12 },
      { k: "dog", o: { breed: "beagle", R: R * 0.9, seed: 14, body: { ang: -P * 0.5, len: 2.4, w: 1.8 } }, x: 0.79, y: 0.1, rot: -0.25 },
      { k: "cat", o: { coat: "dark", R: R * 0.92, seed: 8, body: { ang: 0, len: 2.4, w: 2 }, face: { yellow: true } }, x: 0.985, y: 0.38, rot: -0.42 },
    ];
  }
  function drawHero(t) {
    const { g, w, h } = F.fit(hero.canvas);
    const key = Math.round(w / 40) + "x" + Math.round(h / 40);
    if (key !== hero.key) { hero.key = key; hero.cast = heroCast(w, h); hero.sprites = []; hero.t0 = 0; }
    // build one sprite per frame so the page never freezes
    if (hero.sprites.length < hero.cast.length) { const c = hero.cast[hero.sprites.length]; hero.sprites.push(c.k === "dog" ? F.dog(c.o) : F.cat(c.o)); }
    if (!hero.t0) hero.t0 = t;
    g.clearRect(0, 0, w, h);
    hero.hots = [];
    const lift = Math.min(1, scrollY / innerHeight);
    hero.cast.forEach((c, i) => {
      const s = hero.sprites[i]; if (!s) return;
      const a = reduce ? 1 : F.ease((t - hero.t0 - i * 160) / 1500);
      const ang = (c.o.body ? c.o.body.ang : Math.PI / 2) + c.rot, R = c.o.R;
      const off = (1 - a) * R * 2.4;
      const x = c.x * w + Math.cos(ang) * off, y = c.y * h + Math.sin(ang) * off - lift * R * 0.3 * (i % 2 ? 1 : -0.6);
      F.put(g, s, x, y, { rot: c.rot + (1 - a) * 0.12 });
      if (c.hot && a > 0.98) {
        const sx = x + Math.cos(c.rot - 0.9) * R * 1.05, sy = y + Math.sin(c.rot - 0.9) * R * 1.05;
        sparkle(g, sx, sy, 6, t);
        hero.hots.push({ x, y, r: R * 1.1, html: tipHTML(c.hot[0], c.hot[1], c.hot[2]) });
      }
    });
    return hero.sprites.length < hero.cast.length || t - hero.t0 < 1500 + hero.cast.length * 160;
  }
  bindTip(document.querySelector(".hero"), hero.canvas, hero.tip, () => hero.hots);
  // the canvas sits under the text: let pointer events reach it through the text's empty margins
  document.querySelector(".hero-text").style.pointerEvents = "none";
  document.querySelectorAll(".hero-text a").forEach((a) => (a.style.pointerEvents = "auto"));

  /* ---------- coda ---------- */
  const coda = { canvas: document.querySelector(".coda-canvas"), sp: null, key: "" };
  function drawCoda(t) {
    const r = coda.canvas.getBoundingClientRect();
    if (r.bottom < -100 || r.top > innerHeight * 1.6) return false;
    const { g, w, h } = F.fit(coda.canvas);
    const R = Math.min(w * 0.17, h * 0.2), key = Math.round(R);
    if (key !== coda.key) { coda.key = key; coda.sp = [F.dog({ breed: "mutt", R, seed: 61, sit: true, liveFace: true }), F.cat({ coat: "cream", R: R * 0.85, seed: 62, sit: true, patches: calico(R * 0.85), liveFace: true })]; }
    g.clearRect(0, 0, w, h);
    const k = F.clamp((innerHeight - r.top) / (innerHeight * 0.9));
    const look = Math.sin(t / 1600) * 0.5;
    F.put(g, coda.sp[0], w * 0.3, h * 0.28, { rot: 0.12, face: { look: 1.5 + look, brow: 0.3 + 0.3 * k } });
    F.put(g, coda.sp[1], w * 0.72, h * 0.33, { rot: -0.15, face: { look: -1.5 - look } });
    return true;
  }

  /* ---------- nav ---------- */
  const bar = document.getElementById("bar");
  document.getElementById("burger").addEventListener("click", () => bar.classList.toggle("open"));
  bar.querySelectorAll("nav a").forEach((a) => a.addEventListener("click", () => bar.classList.remove("open")));
  const navLinks = [...bar.querySelectorAll('nav a[href^="#"]')];

  /* ---------- loop ---------- */
  let heroBusy = true;
  function frame(t) {
    if (heroBusy || scrollY < innerHeight) heroBusy = drawHero(t) && !reduce;
    let active = null;
    for (const st of chapters) {
      const r = st.sec.getBoundingClientRect();
      if (r.top < innerHeight * 0.5 && r.bottom > innerHeight * 0.5) active = st.id;
      if (!st.def) continue;
      if (!st.ready && r.top < innerHeight * 2.2) { st.def.init && st.def.init(st); st.ready = true; st.dirty = true; }
      if (!st.ready || r.bottom < 0 || r.top > innerHeight) continue;
      const s = progress(st);
      const live = st.def.live && st.def.live(st, s);
      if (s === st.s && !st.dirty && !live && !st.hots.length) continue;
      st.s = s; st.dirty = false;
      const { g, w, h } = F.fit(st.canvas);
      g.clearRect(0, 0, w, h);
      st.hots = st.def.draw(g, w, h, s, st, t) || [];
      for (const hs of st.hots) if (hs.spark !== false) sparkle(g, hs.sx == null ? hs.x : hs.sx, hs.sy == null ? hs.y - hs.r * 0.9 : hs.sy, 5, t, 0.65);
      const on = Math.floor(s);
      const cur = Math.max(0, Math.min(st.steps.length - 1, on));
      st.steps.forEach((el, i) => el.classList.toggle("on", i === cur));
    }
    navLinks.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + active));
    drawCoda(t);
    requestAnimationFrame(frame);
  }
  addEventListener("resize", () => chapters.forEach((st) => (st.dirty = true)));

  /* ---------- loading: build every sprite first, then show the page ---------- */
  // Each chapter draws its felt on first sight, which froze scrolling for a second or more.
  // Here every chapter is drawn once at each step behind the loader (yielding between draws
  // so the bar moves), then the page shows with everything cached.
  // yield to the browser between batches. Not setTimeout: Chrome slows timers to one a second in a
  // background tab, so a page opened behind another tab took over a minute to load.
  const chan = new MessageChannel();
  const tick = () => new Promise((r) => { chan.port1.onmessage = () => r(); chan.port2.postMessage(0); });
  async function warm() {
    const fill = document.getElementById("ld-fill"), t0 = performance.now(), LIMIT = 12000;
    // a job returns true to run again (one more batch) after the bar has had a chance to move
    const jobs = [() => drawHero(performance.now()) && hero.sprites.length < hero.cast.length];
    for (const st of chapters) {
      if (!st.def) continue;
      jobs.push(() => { st.def.init && st.def.init(st); st.ready = true; });
      for (let k = -0.5; k < st.steps.length; k += 0.5) jobs.push(() => {
        const { g, w, h } = F.fit(st.canvas);
        g.clearRect(0, 0, w, h); st.def.draw(g, w, h, k, st, performance.now());
        return !!st.data.pending;
      });
    }
    try { await document.fonts.ready; } catch (e) {}
    for (let i = 0; i < jobs.length; i++) {
      let again = false, n = 0;
      do { try { again = jobs[i](); } catch (e) { console.warn("warm-up", e); again = false; } if (again) await tick(); } while (again && ++n < 60 && performance.now() - t0 < LIMIT);
      fill.style.width = `${((i + 1) / jobs.length) * 100}%`;
      await tick();
      if (performance.now() - t0 > LIMIT) break;   // a slow machine: show the page, the rest builds as you scroll
    }
    for (const st of chapters) { st.s = -1; st.dirty = true; }
    hero.t0 = 0;
    document.body.classList.remove("loading");
    console.info(`warm-up ${Math.round(performance.now() - t0)} ms`);
    requestAnimationFrame(frame);
  }
  warm();
})();
