/* Ink cursor: a Figma-style arrow in blue ink, with a multiplayer-style name tag
   that says what a click will do. On empty page it becomes a pen and draws: press and drag to write
   on the paper, and the ink fades away a moment later. Fine pointers only;
   touch keeps the native behaviour. States are set with data-cursor="state" or
   "state:label", otherwise inferred from the element under the pointer. */
(function () {
  "use strict";
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Shared ink filter. Ink on paper is never flat: the edge bleeds and wobbles,
  // pigment pools into a darker rim as it dries, the body dries patchy, fibres
  // leave pinholes of grain, and undissolved pigment settles as dark flecks.
  const FILTER = `
    <filter id="ic-ink" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.38" numOctaves="2" seed="4" result="edgeN"/>
      <feDisplacementMap in="SourceGraphic" in2="edgeN" scale="1.8" xChannelSelector="R" yChannelSelector="G" result="shape"/>
      <feFlood flood-color="#0e2272" result="deep"/>
      <feMorphology in="shape" operator="erode" radius="0.85" result="inner"/>
      <feComposite in="shape" in2="inner" operator="out" result="rimMask"/>
      <feComposite in="deep" in2="rimMask" operator="in" result="rim"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.16" numOctaves="3" seed="11" result="mot"/>
      <feColorMatrix in="mot" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.5 0 0 0 0.06" result="motA"/>
      <feComposite in="shape" in2="motA" operator="in" result="body"/>
      <feTurbulence type="fractalNoise" baseFrequency="1.7" numOctaves="1" seed="2" result="gr"/>
      <feColorMatrix in="gr" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1.3 0 0 0 1.55" result="grA"/>
      <feComposite in="body" in2="grA" operator="in" result="grained"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed="21" result="fl"/>
      <feColorMatrix in="fl" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  7 0 0 0 -4.1" result="flA"/>
      <feComposite in="deep" in2="flA" operator="in" result="flD"/>
      <feComposite in="flD" in2="inner" operator="in" result="flecks"/>
      <feMerge><feMergeNode in="grained"/><feMergeNode in="flecks"/><feMergeNode in="rim"/></feMerge>
    </filter>`;

  // Hotspot of every glyph sits at (0,0) of its group
  const GLYPHS = {
    // Figma's arrow: rounded tip, notched tail
    arrow: `<path class="ic-fill" d="M1.2 1.4 L1.6 19.2 C1.6 20.1 2.7 20.5 3.3 19.8 L7.6 14.9 C7.9 14.6 8.3 14.4 8.7 14.4 L15.2 14.2 C16.1 14.2 16.5 13.1 15.8 12.5 L2.8 0.7 C2.2 0.2 1.2 0.6 1.2 1.4 Z"/>`,
    text: `<path class="ic-stroke" d="M-4 -9 C-2 -9 -0.6 -8.4 0 -7 C0.6 -8.4 2 -9 4 -9 M0 -7 L0 7 M-4 9 C-2 9 -0.6 8.4 0 7 C0.6 8.4 2 9 4 9"/>`,
    // a fountain pen held to write, nib at the hotspot
    pen: `<g transform="rotate(34)"><path class="ic-fill" d="M0 0 L-2.9 -7.5 C-3.1 -8.2 -2.7 -8.6 -2 -8.6 L2 -8.6 C2.7 -8.6 3.1 -8.2 2.9 -7.5 Z"/><path d="M0 -1.2 L0 -6.4" stroke="#f5feff" stroke-width="0.7"/><rect class="ic-fill" x="-3.3" y="-12.4" width="6.6" height="3.2" rx="0.6"/><rect class="ic-fill" x="-3.6" y="-31" width="7.2" height="17.8" rx="2.2"/><path d="M1.6 -28.5 V-15.5" stroke="#f5feff" stroke-width="0.8" stroke-linecap="round" opacity="0.8"/></g>`,
    // a dip pen nib, tip at the hotspot
    nib: `<g transform="rotate(32)"><path class="ic-fill" d="M0 0 C-1.6 -4 -5 -9 -5 -14 L-5 -22 L5 -22 L5 -14 C5 -9 1.6 -4 0 0 Z"/><circle cx="0" cy="-12.5" r="1.6" fill="#f5feff"/><path d="M0 -1.5 L0 -11" stroke="#f5feff" stroke-width="0.9"/></g>`,
    // a small sun: the raking light
    light: `<circle class="ic-stroke" r="4.2"/><path class="ic-stroke" d="M0 -11 V-7.5 M0 7.5 V11 M-11 0 H-7.5 M7.5 0 H11 M-7.8 -7.8 L-5.3 -5.3 M5.3 5.3 L7.8 7.8 M-7.8 7.8 L-5.3 5.3 M5.3 -5.3 L7.8 -7.8"/>`
  };

  const root = document.createElement("div");
  root.className = "ink-cursor";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = `
    <svg class="ic-glyph" width="44" height="44" viewBox="-12 -12 44 44" overflow="visible">
      <defs>${FILTER}</defs>
      <g filter="url(#ic-ink)">
        ${Object.entries(GLYPHS).map(([k, g]) => `<g class="ic-g" data-g="${k}">${g}</g>`).join("")}
      </g>
    </svg>
    <span class="ic-tag"></span>`;
  document.body.appendChild(root);
  document.documentElement.classList.add("has-ink-cursor");

  const tag = root.querySelector(".ic-tag");
  const glyphs = {};
  root.querySelectorAll(".ic-g").forEach((g) => { glyphs[g.dataset.g] = g; });

  // What the pointer is over -> [state, glyph, label]
  function resolve(el) {
    if (!el || el === document.documentElement) return ["draw", "pen", ""];
    const tagged = el.closest("[data-cursor]");
    if (tagged) {
      const [state, label = ""] = tagged.dataset.cursor.split(":");
      return [state, state === "ink" ? "nib" : state === "light" ? "light" : state === "text" ? "text" : state === "draw" ? "pen" : "arrow", label];
    }
    if (el.closest(".ink-canvas")) return ["ink", "nib", "drop ink"];
    if (el.closest(".tooth-fig canvas, .tooth-row")) return ["light", "light", "move the light"];
    const link = el.closest("a, button, [role=button], [role=radio], [role=slider], input, select, textarea, label, .nav-section, .nav-sub, .film-tick");
    if (link) {
      let label = "";
      if (link.classList.contains("note") || link.classList.contains("src")) label = "source " + link.textContent.trim();
      else if (link.classList.contains("film-tick")) label = "go to step";
      else if (link.matches(".nav-section, .nav-sub")) label = "jump";
      else if (link.id === "menu-button") label = "contents";
      else if (link.classList.contains("studio-card")) label = link.getAttribute("aria-checked") === "true" ? "" : "lay the page on this";
      else if (link.tagName === "A" && link.getAttribute("href") && !link.getAttribute("href").startsWith("#") && link.host !== location.host) label = "open ↗";
      return ["link", "arrow", label];
    }
    if (el.closest("p, li, h1, h2, h3, h4, figcaption, td, th, blockquote, .caption, pre, code")) return ["text", "text", ""];
    // drawings and charts have their own hover; the arrow stays, nothing is written
    if (el.closest("canvas, svg, img, video, [role=img], .film-tip, .tip")) return ["rest", "arrow", ""];
    return ["draw", "pen", ""];
  }

  let x = -100, y = -100, tx = -100, ty = -100, state = "", label = null, raf = 0, visible = false;

  function setState(s, g, l) {
    if (s !== state) {
      root.dataset.state = s;
      state = s;
    }
    for (const k in glyphs) glyphs[k].classList.toggle("on", k === g);
    if (l !== label) {
      label = l;
      tag.textContent = l;
      root.classList.toggle("tagged", !!l);
    }
  }

  function frame() {
    // the tag trails the tip a little, like a remote collaborator's label
    const k = reduceMotion ? 1 : 0.28;
    tx += (x - tx) * k; ty += (y - ty) * k;
    root.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    tag.style.transform = `translate3d(${tx - x}px, ${ty - y}px, 0)`;
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(frame) : 0;
  }

  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    x = e.clientX; y = e.clientY;
    if (!visible) { visible = true; tx = x; ty = y; root.classList.add("on"); }
    if (!live) setState(...resolve(e.target));
    if (!raf) raf = requestAnimationFrame(frame);
  }, { passive: true });

  // Content moves under a still pointer while scrolling; re-read what's beneath it
  window.addEventListener("scroll", () => {
    if (visible && !live) setState(...resolve(document.elementFromPoint(x, y)));
  }, { passive: true });

  document.addEventListener("pointerleave", () => { visible = false; root.classList.remove("on"); });
  window.addEventListener("blur", () => { visible = false; root.classList.remove("on"); });

  /* ---------- writing on the page ---------- */
  // Strokes live in page coordinates, so they stay where they were written as
  // the page scrolls. Each one holds for a moment after the pen lifts, then
  // fades, as if the paper drank it.
  const HOLD = 1400, FADE = 1600, INK = "33, 70, 208";
  const sheet = document.createElement("canvas");
  sheet.className = "ic-sheet";
  sheet.setAttribute("aria-hidden", "true");
  document.body.appendChild(sheet);
  const sctx = sheet.getContext("2d");
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  function sizeSheet() { sheet.width = Math.round(innerWidth * DPR); sheet.height = Math.round(innerHeight * DPR); }
  sizeSheet();
  window.addEventListener("resize", () => { sizeSheet(); paint(); });
  let strokes = [], live = null, painting = 0;
  function addPoint(e) {
    const px = e.clientX + scrollX, py = e.clientY + scrollY, t = e.timeStamp || performance.now();
    const pts = live.pts, last = pts[pts.length - 1];
    if (last) {
      const d = Math.hypot(px - last.x, py - last.y);
      if (d < 0.8) return;
      // slow strokes pool ink, quick ones thin out
      const v = d / Math.max(1, t - last.t);
      const target = Math.max(0.9, Math.min(3.6, 3.6 - v * 1.5));
      pts.push({ x: px, y: py, t, w: last.w * 0.65 + target * 0.35 });
    } else pts.push({ x: px, y: py, t, w: 2.2 });
  }
  function paint() {
    const now = performance.now();
    strokes = strokes.filter((st) => !st.end || now - st.end < HOLD + FADE);
    sctx.setTransform(1, 0, 0, 1, 0, 0);
    sctx.clearRect(0, 0, sheet.width, sheet.height);
    sctx.setTransform(DPR, 0, 0, DPR, -scrollX * DPR, -scrollY * DPR);
    sctx.lineCap = "round"; sctx.lineJoin = "round";
    for (const st of strokes) {
      const a = st.end ? 1 - Math.max(0, Math.min(1, (now - st.end - HOLD) / FADE)) : 1;
      const pts = st.pts;
      if (pts.length === 1) {
        sctx.fillStyle = `rgba(${INK}, ${0.85 * a})`;
        sctx.beginPath(); sctx.arc(pts[0].x, pts[0].y, 1.8, 0, Math.PI * 2); sctx.fill();
        continue;
      }
      for (let i = 1; i < pts.length; i++) {
        const p0 = pts[i - 1], p1 = pts[i], p2 = pts[i + 1];
        // midpoint curves keep the line smooth; the start tapers in like a nib touching down
        const taper = Math.min(1, i / 5);
        sctx.strokeStyle = `rgba(${INK}, ${(0.72 + 0.16 * Math.sin(i * 0.7 + st.seed)) * a})`;
        sctx.lineWidth = p1.w * (0.45 + 0.55 * taper);
        sctx.beginPath();
        sctx.moveTo((p0.x + p1.x) / 2, (p0.y + p1.y) / 2);
        if (p2) sctx.quadraticCurveTo(p1.x, p1.y, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
        else sctx.lineTo(p1.x, p1.y);
        sctx.stroke();
      }
    }
  }
  function loop() {
    paint();
    painting = strokes.length ? requestAnimationFrame(loop) : 0;
  }
  const wake = () => { if (!painting) painting = requestAnimationFrame(loop); };
  window.addEventListener("scroll", () => { if (strokes.length) paint(); }, { passive: true });
  function lift() {
    if (!live) return;
    live.end = performance.now();
    live = null;
    root.classList.remove("writing");
    wake();
  }
  window.addEventListener("pointermove", (e) => {
    if (!live || e.pointerType !== "mouse") return;
    (e.getCoalescedEvents ? e.getCoalescedEvents() : [e]).forEach(addPoint);
  }, { passive: true });
  window.addEventListener("pointerup", lift);
  // a click can change what the element means (a card once picked has nothing left to say)
  window.addEventListener("click", (e) => { if (visible && !live && e.pointerType !== "touch") requestAnimationFrame(() => setState(...resolve(document.elementFromPoint(x, y)))); });
  window.addEventListener("pointercancel", lift);
  window.addEventListener("blur", lift);

  window.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") return;
    root.classList.add("down");
    if (e.button === 0 && resolve(e.target)[0] === "draw") {
      // empty paper: write instead of selecting
      e.preventDefault();
      live = { pts: [], end: 0, seed: Math.random() * 6 };
      strokes.push(live);
      addPoint(e);
      root.classList.add("writing");
      wake();
      return;
    }
    if (reduceMotion) return;
    // a blot spreads into the page where you pressed
    const blot = document.createElement("span");
    blot.className = "ic-blot";
    blot.style.left = e.clientX + "px";
    blot.style.top = e.clientY + "px";
    document.body.appendChild(blot);
    blot.addEventListener("animationend", () => blot.remove());
  });
  window.addEventListener("pointerup", () => root.classList.remove("down"));
})();
