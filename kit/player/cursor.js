/* Explainer kit · cursor. A two-layer pointer (a fill and a keyline, slightly out of
   register) whose texture, colours and glyphs come from the project:
     window.EXPLAINER_CURSOR = {
       fill: "#e2643a", line: "#2b4ca0",      // the two layers
       texture: "speckle" | "crayon" | "ink" | "none",
       offset: [1.6, 1.3],                     // misregistration of the fill layer
       tag: { bg: "#2b4ca0", fg: "#fff", shadow: "#e2643a", font: "700 13px system-ui" },
       glyphs: { arrow: { fill: "<path…>", line: "<path…>" }, … }   // optional overrides
     }
   States come from data-cursor="state" or "state:label" on (or above) the element
   under the pointer; the player sets them on its canvas (play, pause, look). Fine
   pointers only; touch keeps the native cursor. */
(function () {
  "use strict";
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const C = Object.assign({ fill: "#1d1b18", line: "#1d1b18", texture: "none", offset: [1.6, 1.3], tag: {} }, window.EXPLAINER_CURSOR || {});
  const T = Object.assign({ bg: C.line, fg: "#fff", shadow: C.fill, font: "700 13px system-ui, sans-serif" }, C.tag);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const FILTERS = {
    speckle: `<filter id="xc-tex" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="1" seed="3" result="e"/><feDisplacementMap in="SourceGraphic" in2="e" scale="0.9" result="s"/><feTurbulence type="fractalNoise" baseFrequency="1.9" numOctaves="1" seed="12" result="n"/><feColorMatrix in="n" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.2 0 0 0 1.9" result="h"/><feComposite in="s" in2="h" operator="in"/></filter>`,
    crayon: `<filter id="xc-tex" x="-30%" y="-30%" width="160%" height="160%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="5" result="e"/><feDisplacementMap in="SourceGraphic" in2="e" scale="1.6" result="s"/><feTurbulence type="fractalNoise" baseFrequency="0.35 2.4" numOctaves="2" seed="9" result="n"/><feColorMatrix in="n" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.6 0 0 0 1.85" result="h"/><feComposite in="s" in2="h" operator="in"/></filter>`,
    ink: `<filter id="xc-tex" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="2" result="e"/><feDisplacementMap in="SourceGraphic" in2="e" scale="0.7" result="s"/><feGaussianBlur in="s" stdDeviation="0.25"/></filter>`,
    none: "",
  };
  const ARROW = "M1.2 1.4 L1.6 19.2 C1.6 20.1 2.7 20.5 3.3 19.8 L7.6 14.9 C7.9 14.6 8.3 14.4 8.7 14.4 L15.2 14.2 C16.1 14.2 16.5 13.1 15.8 12.5 L2.8 0.7 C2.2 0.2 1.2 0.6 1.2 1.4 Z";
  const G = Object.assign({
    arrow: { fill: `<path class="xf" d="${ARROW}"/>`, line: `<path class="xl" d="${ARROW}"/>` },
    text: { fill: `<path class="xl thick" d="M0 -8 V8"/>`, line: `<path class="xl" d="M-4 -8.5 H4 M0 -8.5 V8.5 M-4 8.5 H4"/>` },
    play: { fill: `<path class="xf" d="M1 -8 L15 0 L1 8 Z"/>`, line: `<path class="xl" d="M1 -8 L15 0 L1 8 Z"/>` },
    pause: { fill: `<path class="xf" d="M1 -8 h4.5 v16 h-4.5 Z M10 -8 h4.5 v16 h-4.5 Z"/>`, line: `<path class="xl" d="M1 -8 h4.5 v16 h-4.5 Z M10 -8 h4.5 v16 h-4.5 Z"/>` },
    look: { fill: `<circle class="xf" cx="6" cy="-6" r="6.5"/>`, line: `<circle class="xl" cx="6" cy="-6" r="7"/><path class="xl thick" d="M11 -1 L17 5"/>` },
    slide: { fill: `<path class="xl" d="M1.5 0 H10.5 M6.5 -4 L10.8 0 L6.5 4"/>`, line: `<path class="xl" d="M-1.5 0 H-10.5 M-6.5 -4 L-10.8 0 L-6.5 4"/>` },
  }, C.glyphs || {});
  G.link = G.link || G.arrow;

  const css = document.createElement("style");
  css.textContent = `
    .xc-on, .xc-on * { cursor: none !important; }
    .xc { position: fixed; left: 0; top: 0; z-index: 10000; pointer-events: none; opacity: 0; transition: opacity .2s; will-change: transform; }
    .xc.on { opacity: 1; }
    .xc svg { position: absolute; left: -14px; top: -26px; overflow: visible; }
    .xc .pf { color: ${C.fill}; transform: translate(${C.offset[0]}px, ${C.offset[1]}px); transition: transform .12s; }
    .xc .pl { color: ${C.line}; }
    .xc.down .pf { transform: translate(${C.offset[0] + 1.2}px, ${C.offset[1] - 0.9}px); }
    .xc .xf { fill: currentColor; } .xc .xl { fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; } .xc .xl.thick { stroke-width: 2.6; }
    .xc .g { opacity: 0; transform: scale(.6); transform-box: view-box; transform-origin: 0 0; transition: opacity .14s, transform .2s cubic-bezier(.22,1,.36,1); }
    .xc .g.on { opacity: 1; transform: scale(1); }
    .xc[data-s="link"] .g.on { transform: rotate(-8deg) scale(1.06); }
    .xc.down .g.on { transform: scale(.86); transition-duration: .08s; }
    .xc .tw { position: absolute; left: 16px; top: 18px; opacity: 0; scale: .85; transform-origin: top left; transition: opacity .14s, scale .18s; }
    .xc.tagged .tw { opacity: 1; scale: 1; }
    .xc[data-s="look"] .tw { left: 22px; top: 6px; }
    .xc .tw::before { content: ""; position: absolute; inset: 0; background: ${T.shadow}; transform: translate(2.5px, 2.5px); }
    .xc .tg { position: relative; display: block; padding: 3px 9px 4px; background: ${T.bg}; color: ${T.fg}; font: ${T.font}; white-space: nowrap; }
    .xc-drop { position: fixed; z-index: 9999; width: 22px; height: 22px; margin: -11px 0 0 -11px; pointer-events: none; border-radius: 46% 54% 42% 58%; background: ${C.fill}; opacity: .5; animation: xc-drop .7s cubic-bezier(.22,1,.36,1) forwards; }
    @keyframes xc-drop { from { transform: scale(.3); opacity: .55; } to { transform: scale(1.5); opacity: 0; } }`;
  document.head.appendChild(css);

  const root = document.createElement("div");
  root.className = "xc"; root.setAttribute("aria-hidden", "true");
  const flt = FILTERS[C.texture] || "", fa = flt ? ` filter="url(#xc-tex)"` : "";
  root.innerHTML = `<svg width="48" height="52" viewBox="-14 -26 48 52"><defs>${flt}</defs>
    <g class="pf"${fa}>${Object.entries(G).map(([k, g]) => `<g class="g" data-g="${k}">${g.fill}</g>`).join("")}</g>
    <g class="pl"${fa}>${Object.entries(G).map(([k, g]) => `<g class="g" data-g="${k}">${g.line}</g>`).join("")}</g></svg>
    <div class="tw"><span class="tg"></span></div>`;
  document.body.appendChild(root);
  document.documentElement.classList.add("xc-on");
  const tw = root.querySelector(".tw"), tg = root.querySelector(".tg"), gs = [...root.querySelectorAll(".g")];

  function resolve(el) {
    if (!el || el === document.documentElement) return ["default", "arrow", ""];
    const tagged = el.closest("[data-cursor]");
    if (tagged) { const [s, label = ""] = tagged.dataset.cursor.split(":"); return [s, G[s] ? s : "arrow", label]; }
    if (el.matches("input[type=range]")) return ["slide", "slide", ""];
    if (el.closest("a, button, [role=button], [role=tab], [role=radio], summary, label[for]")) { const a = el.closest("a"); return ["link", "link", a && a.host && a.host !== location.host ? "open ↗" : ""]; }
    if (el.closest("input[type=text], textarea")) return ["text", "text", ""];
    if (el.closest("p, li, h1, h2, h3, td, th, blockquote, dd")) return ["text", "text", ""];
    return ["default", "arrow", ""];
  }
  let x = -100, y = -100, tx = -100, ty = -100, state = "", glyph = "", label = null, raf = 0, vis = false;
  function set(s, g, l) {
    if (s !== state) { root.dataset.s = s; state = s; }
    if (g !== glyph) { glyph = g; gs.forEach((e) => e.classList.toggle("on", e.dataset.g === g)); }
    if (l !== label) { label = l; tg.textContent = l; root.classList.toggle("tagged", !!l); }
  }
  function frame() {
    const k = reduce ? 1 : 0.3; tx += (x - tx) * k; ty += (y - ty) * k;
    root.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    tw.style.transform = `translate3d(${(tx - x).toFixed(1)}px, ${(ty - y).toFixed(1)}px, 0)`;
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(frame) : 0;
  }
  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    x = e.clientX; y = e.clientY;
    if (!vis) { vis = true; tx = x; ty = y; root.classList.add("on"); }
    if (!(root.classList.contains("down") && state === "slide")) set(...resolve(e.target));
    if (!raf) raf = requestAnimationFrame(frame);
  }, { passive: true });
  // the player changes a canvas's data-cursor without the pointer moving
  new MutationObserver(() => { if (vis) set(...resolve(document.elementFromPoint(x, y))); }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["data-cursor"] });
  window.addEventListener("scroll", () => { if (vis) set(...resolve(document.elementFromPoint(x, y))); }, { passive: true });
  document.addEventListener("pointerleave", () => { vis = false; root.classList.remove("on"); });
  window.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") return;
    root.classList.add("down");
    if (reduce || state === "slide") return;
    const d = document.createElement("span"); d.className = "xc-drop"; d.style.left = e.clientX + "px"; d.style.top = e.clientY + "px";
    document.body.appendChild(d); d.addEventListener("animationend", () => d.remove());
  });
  window.addEventListener("pointerup", () => root.classList.remove("down"));
})();
