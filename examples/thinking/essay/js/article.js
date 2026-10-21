/* Thinking Inside the Box: page machinery. Header, navigation, the scrolly
   controller, and a stage helper that gives each drawing a Wash stage,
   redraws on scroll or hover, and shows tooltips for drawn hotspots.
   Scenes live in scenes.js and register with window.Essay. */
(function () {
  "use strict";
  const P = window.Paper, W = window.Wash;
  const { clamp } = W;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ================= Header ================= */
  const header = $("#header");
  function onHeader() { header.classList.toggle("transparent", window.scrollY < 24 && !header.classList.contains("menu-open")); }

  /* ================= Navigation ================= */
  const chapters = $$(".chapter[data-chapter]").map((ch, i) => ({
    el: ch, id: ch.id, label: ch.dataset.chapter, num: ch.dataset.num || String(i + 1),
    subs: $$("[data-sub]", ch).map((s) => ({ el: s, id: s.id, label: s.dataset.sub }))
  }));
  function buildNav(host) {
    const ul = document.createElement("ul");
    chapters.forEach((c) => {
      const li = document.createElement("li");
      li.className = "nav-group"; li.dataset.id = c.id;
      li.innerHTML = `<button class="nav-section" data-target="${c.id}"><span class="nav-num">${c.num}</span>${c.label}</button>
        <div class="nav-subs"><ul>${c.subs.map((s) => `<li><button class="nav-sub" data-target="${s.id}">${s.label}</button></li>`).join("")}</ul></div>`;
      ul.appendChild(li);
    });
    host.appendChild(ul);
    host.addEventListener("click", (e) => {
      const b = e.target.closest("[data-target]");
      if (!b) return;
      const t = document.getElementById(b.dataset.target);
      if (!t) return;
      const y = t.getBoundingClientRect().top + window.scrollY - 64;
      window.scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });
      closeMenu();
    });
  }
  if ($("#side-nav")) buildNav($("#side-nav"));
  if ($("#menu-panel")) buildNav($("#menu-panel"));
  let activeKey = "";
  function spyNav() {
    const line = window.innerHeight * 0.35;
    let cur = null, sub = null;
    chapters.forEach((c) => {
      if (c.el.getBoundingClientRect().top <= line) { cur = c; sub = null; c.subs.forEach((s) => { if (s.el.getBoundingClientRect().top <= line) sub = s; }); }
    });
    const key = (cur ? cur.id : "") + "/" + (sub ? sub.id : "");
    if (key === activeKey) return;
    activeKey = key;
    $$(".nav-group").forEach((g) => g.classList.toggle("open", !!cur && g.dataset.id === cur.id));
    $$(".nav-section").forEach((b) => b.classList.toggle("active", !!cur && b.dataset.target === cur.id));
    $$(".nav-sub").forEach((b) => b.classList.toggle("active", !!sub && b.dataset.target === sub.id));
  }
  const menuBtn = $("#menu-button"), menuPanel = $("#menu-panel");
  function closeMenu() {
    if (!menuPanel) return;
    menuPanel.hidden = true; menuBtn.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false");
    header.classList.remove("menu-open"); onHeader();
  }
  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      const open = menuPanel.hidden;
      menuPanel.hidden = !open; menuBtn.classList.toggle("open", open); menuBtn.setAttribute("aria-expanded", String(open));
      header.classList.toggle("menu-open", open); onHeader();
    });
    window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
  }

  /* ================= Reveal ================= */
  if (!reduceMotion) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("reveal-in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    $$(".chapter-title, .chapter-lede, .block-title, .coda-text").forEach((el) => { if (el.getBoundingClientRect().top > window.innerHeight) { el.classList.add("reveal-pre"); io.observe(el); } });
  }

  /* ================= Stages ================= */
  // A stage wraps a canvas with a Wash stage, hover hotspots and a tooltip.
  //   makeStage(canvas, VW, VH, draw(S, state), { fit, tip, spots(state) → [{key,x,y,r,tip,src,href}] })
  // state: { t: 0..1 scroll progress, idx, local, time: ms, hover: key|null, hv(key): 0..1 eased hover, pointer: [x,y] virtual }
  const stages = [];
  function makeStage(canvas, VW, VH, draw, o = {}) {
    const S = W.stage(canvas, VW, VH, { fit: o.fit || "contain", alignX: o.alignX, alignY: o.alignY, aspect: o.aspect });
    const st = { canvas, S, draw, o, t: 0, idx: 0, local: 0, time: 0, hover: null, hoverAmt: new Map(), pointer: null, visible: false, dirty: true, last: 0, spots: [], tipEl: o.tip || null };
    st.hv = (key) => st.hoverAmt.get(key) || 0;
    st.render = (force) => {
      if (!st.visible && !force) { st.dirty = true; return; }
      S.begin();
      S.boil = reduceMotion ? 0 : Math.floor(st.time / 180) * 0.37;
      draw(S, st);
      S.end();
      st.dirty = false;
    };
    st.setProgress = (t, idx, local) => { if (t !== st.t || idx !== st.idx) { st.t = t; st.idx = idx; st.local = local; st.dirty = true; } };
    st.invalidate = () => { st.dirty = true; };
    // hover
    const findSpot = (px, py) => {
      const [x, y] = S.fromCss(px, py);
      st.pointer = [x, y];
      const spots = o.spots ? o.spots(st) : [];
      st.spots = spots;
      let best = null, bd = Infinity;
      for (const sp of spots) { const d = Math.hypot(sp.x - x, sp.y - y); if (d <= sp.r && d < bd) { best = sp; bd = d; } }
      return best;
    };
    function showTip(sp, px, py) {
      if (!st.tipEl) return;
      if (!sp) { st.tipEl.classList.remove("show"); return; }
      st.tipEl.innerHTML = `${sp.tip}${sp.src ? ` <a class="note" href="report.html#${(sp.href || sp.src.split(/[ ,·]/)[0]).toLowerCase()}">${sp.src}</a>` : ""}`;
      const host = canvas.parentElement.getBoundingClientRect(), cr = canvas.getBoundingClientRect();
      const tw = Math.min(240, host.width - 8);
      let lx = cr.left - host.left + px + 16, ly = cr.top - host.top + py + 12;
      if (lx + tw > host.width) lx = Math.max(0, cr.left - host.left + px - tw - 12);
      st.tipEl.style.left = `${lx}px`; st.tipEl.style.top = `${ly}px`; st.tipEl.style.maxWidth = `${tw}px`;
      st.tipEl.classList.add("show");
    }
    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      const px = e.clientX - r.left, py = e.clientY - r.top;
      const sp = findSpot(px, py);
      const key = sp ? sp.key : null;
      if (key !== st.hover) { st.hover = key; if (window.PenCursor) window.PenCursor.set(key ? "hot" : "arrow", key ? "" : ""); }
      showTip(sp, px, py);
      st.dirty = true;
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onMove);
    canvas.addEventListener("pointerleave", () => { st.hover = null; st.pointer = null; showTip(null); st.dirty = true; if (window.PenCursor) window.PenCursor.set("arrow", ""); });
    new IntersectionObserver((es) => { st.visible = es[0].isIntersecting; if (st.visible) st.dirty = true; }, { rootMargin: "120px" }).observe(canvas);
    stages.push(st);
    return st;
  }

  /* ================= Scrolly controller ================= */
  const scrollies = $$(".scrolly").map((el) => ({ el, steps: $$(".step", el), active: -1, stage: null, onStep: null }));
  function updateScrollies() {
    for (const s of scrollies) {
      let mid = window.innerHeight * 0.5;
      const stageEl = s.stageEl || (s.stageEl = $(".scrolly-stage", s.el));
      if (stageEl && stageEl.offsetWidth > s.el.offsetWidth * 0.8) {
        // stacked: the stage is pinned under the header; read in the middle of the band below it
        const below = (parseFloat(getComputedStyle(stageEl).top) || 0) + stageEl.offsetHeight;
        mid = below + (window.innerHeight - below) * 0.5;
      }
      const r = s.el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > window.innerHeight + 200) continue;
      let idx = 0, local = 0;
      s.steps.forEach((st, i) => {
        const b = st.getBoundingClientRect();
        if (b.top + b.height * 0.5 <= mid + b.height * 0.5) { idx = i; local = clamp((mid - b.top) / b.height); }
      });
      // the first step gets a head start, so the stage is never blank while its text approaches
      if (idx === 0) { const b = s.steps[0].getBoundingClientRect(); local = clamp((mid - b.top + b.height * 0.45) / b.height); }
      if (idx !== s.active) { s.active = idx; s.steps.forEach((st, i) => st.classList.toggle("active", i === idx)); if (s.onStep) s.onStep(idx); }
      const prog = clamp((idx + local) / s.steps.length);
      if (s.stage) s.stage.setProgress(prog, idx, local);
    }
  }
  const scrollyById = (id) => scrollies.find((s) => s.el.id === id);

  /* ================= Loop ================= */
  let ticking = false;
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; onHeader(); spyNav(); updateScrollies(); }); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  function loop(now) {
    for (const st of stages) {
      if (!st.visible) continue;
      st.time = now;
      // eased hover amounts
      let moving = false;
      const keys = new Set([...st.hoverAmt.keys(), ...(st.hover ? [st.hover] : [])]);
      for (const k of keys) {
        const cur = st.hoverAmt.get(k) || 0, target = k === st.hover ? 1 : 0;
        const nx = cur + (target - cur) * (reduceMotion ? 1 : 0.14);
        if (Math.abs(nx - target) < 0.005) { if (target === 0) st.hoverAmt.delete(k); else st.hoverAmt.set(k, 1); } else { st.hoverAmt.set(k, nx); moving = true; }
      }
      const alive = !reduceMotion && st.o.alive;
      if (st.dirty || moving || alive) {
        // ambient scenes redraw at a gentle rate; others only when something changed
        if (!alive || now - st.last > 70 || st.dirty || moving) { st.render(); st.last = now; }
      }
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { for (const st of stages) { st.S.fit(); st.dirty = true; } updateScrollies(); }, 120);
  });

  window.Essay = { makeStage, stages, scrollies, scrollyById, updateScrollies, reduceMotion, $, $$ };
  // first paint after scenes register
  window.addEventListener("load", () => { onHeader(); spyNav(); updateScrollies(); for (const st of stages) st.dirty = true; });
  onHeader(); spyNav();
})();
