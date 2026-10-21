/* Scroll engine: every [data-scene] element gets a stage; its .step elements drive
   a continuous progress p (0 at the first step … n-1 at the last). Scenes live in
   window.Scenes[name] = { VW, VH, fit, draw(g, st, p, t), labels(p, st) -> [...], hot(p) -> [...] }. */
(function () {
  "use strict";
  const S = window.Scenes || {};
  const tip = document.createElement("div"); tip.className = "tip"; document.body.appendChild(tip);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const live = [];
  // phones (portrait, or landscape with a short screen) get each scene's narrow layout;
  // STACK must match the stacked-stage media query in article.css
  // a stage smaller than the desktop drawings were made for gets each scene's compact layout
  const STACK = matchMedia("(max-width: 860px) and (min-height: 521px)");
  const TOUCH = matchMedia("(hover: none)");
  const firstStage = document.querySelector(".scrolly .sticky");
  const isNarrow = () => { if (!firstStage) return false; const r = firstStage.getBoundingClientRect(); return r.width < 760 || r.height < 600; };
  let narrow = isNarrow();
  WC.mode = narrow ? "m" : "";
  document.documentElement.classList.toggle("touch", TOUCH.matches);

  function showTip(html, cx, cy, gap) {
    tip.innerHTML = html; tip.classList.add("on");
    const tw = tip.offsetWidth, th = tip.offsetHeight, m = 10;
    let x = cx + gap, y = cy + gap;
    if (x + tw > innerWidth - m) x = cx - tw - gap;
    if (y + th > innerHeight - m) y = cy - th - gap;
    tip.style.left = Math.max(m, Math.min(innerWidth - tw - m, x)) + "px";
    tip.style.top = Math.max(m, Math.min(innerHeight - th - m, y)) + "px";
  }
  function nearest(item, vx, vy, minPx) {
    let best = null, bd = 1e9;
    for (const h of item.hot) { const d = Math.hypot(h.x - vx, h.y - vy); if (d < Math.max(h.r || 40, (minPx || 0) / item.st.s) && d < bd) { bd = d; best = h; } }
    return best;
  }

  function note(tags) {
    return tags.split(/,\s*/).map((t) => `<a class="note" href="report.html#src-${t.trim()}">${t.trim()}</a>`).join("");
  }
  window.note = note;

  document.querySelectorAll("[data-scene]").forEach((el) => {
    const sc = S[el.dataset.scene];
    if (!sc) return;
    const canvas = el.querySelector("canvas");
    if (sc.layout) sc.layout(narrow);
    const st = WC.stage(canvas, sc.VW, sc.VH, { fit: sc.fit });
    const labelBox = el.querySelector(".labels");
    const steps = [...el.querySelectorAll(".step")];
    const item = { el, sc, st, canvas, labelBox, steps, sticky: el.querySelector(".sticky"), p: -1, drawn: -2, visible: false, labels: new Map(), hot: [], hover: null, input: null };
    if (sc.init) sc.init(st, item);
    live.push(item);
    new IntersectionObserver((es) => { item.visible = es[0].isIntersecting; }, { rootMargin: "200px" }).observe(el);
    // hover hotspots
    let pointer = "mouse";
    canvas.addEventListener("pointerdown", (e) => { pointer = e.pointerType; });
    canvas.addEventListener("mousemove", (e) => {
      if (pointer !== "mouse" || TOUCH.matches) return;   // touch: the tap below shows the tip instead
      const r = canvas.getBoundingClientRect();
      const [vx, vy] = st.toV(e.clientX - r.left, e.clientY - r.top);
      const best = nearest(item, vx, vy);
      if (best) {
        showTip(best.html, e.clientX, e.clientY, 18);
        canvas.style.cursor = "url(\"data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2722%27 height=%2722%27%3E%3Ccircle cx=%279%27 cy=%279%27 r=%276.2%27 fill=%27%23f7d23a%27 stroke=%27%232b3440%27 stroke-width=%271.6%27/%3E%3C/svg%3E\") 9 9, pointer";
      } else { tip.classList.remove("on"); canvas.style.cursor = ""; }
      if (item.hover !== (best && best.id)) { item.hover = best && best.id; item.drawn = -2; }
    });
    canvas.addEventListener("mouseleave", () => { tip.classList.remove("on"); item.hover = null; item.drawn = -2; });
    canvas.addEventListener("click", (e) => {
      const r = canvas.getBoundingClientRect();
      const v = st.toV(e.clientX - r.left, e.clientY - r.top);
      if (sc.click) { sc.click(v, item); item.drawn = -2; }
      // a tap is the touch equivalent of hovering: show (or toggle off) the nearest spot's note
      if (!sc.click && (pointer !== "mouse" || TOUCH.matches)) {
        const best = nearest(item, v[0], v[1], 26);
        if (best && !(tip.classList.contains("on") && item.hover === best.id)) { showTip(best.html, e.clientX, e.clientY, 14); item.hover = best.id; }
        else { tip.classList.remove("on"); item.hover = null; }
        item.drawn = -2;
      }
    });
  });

  function progress(item) {
    const n = item.steps.length;
    if (!n) return 0;
    // stacked (phone) layout: the text reads in the band under the stage, so the line sits in that band
    let mid = innerHeight * 0.55;
    if (STACK.matches && item.sticky) { const b = (parseFloat(getComputedStyle(item.sticky).top) || 0) + item.sticky.offsetHeight; mid = b + (innerHeight - b) * 0.6; }
    let p = 0;
    for (let i = 0; i < n; i++) {
      const r = item.steps[i].getBoundingClientRect();
      const top = i === 0 ? r.top + r.height * 0.55 : r.top;
      if (mid >= top) p = i + WC.clamp((mid - top) / Math.max(1, r.height));
    }
    item.steps.forEach((s, i) => s.classList.toggle("on", Math.round(Math.min(p, n - 1)) === i || (i === n - 1 && p > n - 1)));
    return Math.min(p, n - 1 + 0.999);
  }

  function placeLabels(item, list) {
    const seen = new Set();
    for (const L of list || []) {
      seen.add(L.id);
      let d = item.labels.get(L.id);
      if (!d) { d = document.createElement("div"); item.labelBox.appendChild(d); item.labels.set(L.id, d); }
      if (d.__html !== L.html) { d.innerHTML = L.html; d.__html = L.html; }
      d.className = "lab " + (L.cls || "");
      d.style.left = (L.x * item.st.s + item.st.ox) + "px";
      d.style.top = (L.y * item.st.s + item.st.oy) + "px";
      d.style.opacity = L.a == null ? 1 : L.a;
      if (L.align === "left") d.style.transform = "translate(0,-50%)";
      else if (L.align === "right") d.style.transform = "translate(-100%,-50%)";
      else d.style.transform = "";
    }
    for (const [id, d] of item.labels) if (!seen.has(id)) d.style.opacity = 0;
  }

  let t0 = performance.now();
  function frame(now) {
    const t = (now - t0) / 1000;
    for (const it of live) {
      if (!it.visible) continue;
      const p = progress(it);
      const animating = it.sc.anim && !reduce;
      if (Math.abs(p - it.p) < 0.0005 && it.drawn === it.p && !animating) continue;
      it.p = p;
      const g = it.st.begin();
      it.sc.draw(g, it.st, p, t, it);
      it.drawn = p;
      it.hot = it.sc.hot ? it.sc.hot(p, it) : [];
      if (it.labelBox) placeLabels(it, it.sc.labels ? it.sc.labels(p, it) : []);
    }
    requestAnimationFrame(frame);
  }
  let rt = 0;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => {
    const n = isNarrow(), changed = n !== narrow;
    narrow = n; WC.mode = n ? "m" : "";
    document.documentElement.classList.toggle("touch", TOUCH.matches);
    for (const it of live) {
      if (changed && it.sc.layout) { it.sc.layout(n); it.st.VW = it.sc.VW; it.st.VH = it.sc.VH; it.labels.forEach((d) => d.remove()); it.labels.clear(); }
      it.st.resize(); it.drawn = -2; it.p = -1;
    }
  }, 120); });
  // a tap-opened note goes away once the reader scrolls on
  addEventListener("scroll", () => { if (tip.classList.contains("on") && (TOUCH.matches)) { tip.classList.remove("on"); for (const it of live) if (it.hover) { it.hover = null; it.drawn = -2; } } }, { passive: true });
  requestAnimationFrame(frame);

  // nav: highlight the chapter in view; hamburger
  const links = [...document.querySelectorAll(".bar nav a")];
  const secs = links.map((a) => document.querySelector(a.getAttribute("href")));
  addEventListener("scroll", () => {
    let on = -1;
    secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * 0.4) on = i; });
    links.forEach((a, i) => a.classList.toggle("on", i === on));
  }, { passive: true });
  const bar = document.querySelector(".bar"), burger = document.querySelector(".burger");
  if (burger) burger.addEventListener("click", () => bar.classList.toggle("open"));
  links.forEach((a) => a.addEventListener("click", () => bar.classList.remove("open")));
})();
