/* Pen cursor: a small grey arrow drawn with a slightly wobbly line, like the
   essay's pen. Over links it becomes a pen nib and shows a tag saying what a
   click does; over drawn hotspots it carries a blue drop. Fine pointers only. */
(function () {
  "use strict";
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.createElement("div");
  root.id = "pen-cursor";
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = `
    <svg width="44" height="44" viewBox="-6 -6 38 38" style="overflow:visible">
      <defs>
        <filter id="pc-ink" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="5" result="n"/>
          <feDisplacementMap in="SourceGraphic" in2="n" scale="0.6"/>
        </filter>
      </defs>
      <g filter="url(#pc-ink)">
        <g class="pc-arrow">
          <path d="M0.8 0.9 L1.3 16.6 L5.4 12.9 L8.1 19.4 L10.6 18.3 L7.9 11.9 L13.4 11.4 Z" fill="#4a4a4e" stroke="#fcfaf6" stroke-width="1.2" stroke-linejoin="round" paint-order="stroke"/>
        </g>
        <g class="pc-nib" style="display:none">
          <path d="M0 0 C-1.4 -3.6 -4.4 -8 -4.4 -12.5 L-4.4 -19 L4.4 -19 L4.4 -12.5 C4.4 -8 1.4 -3.6 0 0 Z" fill="#4a4a4e" stroke="#fcfaf6" stroke-width="1.2" paint-order="stroke" transform="rotate(32)"/>
          <path d="M0 -1.5 L0 -10" stroke="#fcfaf6" stroke-width="0.9" transform="rotate(32)"/>
        </g>
        <circle class="pc-drop" cx="15" cy="15" r="4.2" fill="#7fcbdc" opacity="0" />
      </g>
    </svg>
    <span class="pc-tag"></span>`;
  const style = document.createElement("style");
  style.textContent = `
    html.pen-cursor, html.pen-cursor * { cursor: none !important; }
    #pen-cursor { position: fixed; left: 0; top: 0; z-index: 9999; pointer-events: none; will-change: transform; }
    #pen-cursor svg { position: absolute; left: -6px; top: -6px; width: 44px; height: 44px; max-width: none; display: block; }
    #pen-cursor .pc-tag { position: absolute; left: 18px; top: 16px; font: 500 11px/1 "IBM Plex Mono", ui-monospace, monospace; letter-spacing: 0.03em; color: #4a4a4e; background: rgba(252,250,246,0.9); padding: 3px 5px; white-space: nowrap; opacity: 0; transform: translateY(3px); transition: opacity 0.2s, transform 0.2s; }
    #pen-cursor.tagged .pc-tag { opacity: 1; transform: none; }
    #pen-cursor .pc-drop { transition: opacity 0.2s; }
    #pen-cursor.hidden { opacity: 0; }
  `;
  document.head.appendChild(style);
  document.body.appendChild(root);
  document.documentElement.classList.add("pen-cursor");
  const arrow = root.querySelector(".pc-arrow"), nib = root.querySelector(".pc-nib"), drop = root.querySelector(".pc-drop"), tag = root.querySelector(".pc-tag");

  let tx = -100, ty = -100, x = tx, y = ty, raf = 0;
  function frame() {
    const k = reduce ? 1 : 0.45;
    x += (tx - x) * k; y += (ty - y) * k;
    root.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    if (Math.abs(tx - x) > 0.2 || Math.abs(ty - y) > 0.2) raf = requestAnimationFrame(frame); else raf = 0;
  }
  function setState(state, label) {
    const isLink = state === "link" || state === "ask";
    arrow.style.display = isLink ? "none" : "";
    nib.style.display = isLink ? "" : "none";
    drop.style.opacity = state === "hot" || state === "ask" ? 1 : 0;
    if (label) { tag.textContent = label; root.classList.add("tagged"); } else root.classList.remove("tagged");
  }
  function infer(el) {
    const c = el && el.closest && el.closest("[data-cursor]");
    if (c) { const [s, l] = c.dataset.cursor.split(":"); return [s, l || ""]; }
    const a = el && el.closest && el.closest("a, button, [role=button], input, label, summary");
    if (!a) return ["arrow", ""];
    if (a.matches("a.note")) return ["link", "source"];
    if (a.matches("a[href*='report']")) return ["link", "research report"];
    if (a.matches("a[href*='explainer'], a.watch")) return ["link", "watch"];
    if (a.matches("input[type=range]")) return ["arrow", "drag"];
    return ["link", a.tagName === "BUTTON" ? (a.dataset.tag || "") : ""];
  }
  window.addEventListener("pointermove", (e) => {
    tx = e.clientX; ty = e.clientY;
    root.classList.remove("hidden");
    const [s, l] = infer(e.target);
    setState(s, l);
    if (!raf) raf = requestAnimationFrame(frame);
  }, { passive: true });
  document.addEventListener("pointerleave", () => root.classList.add("hidden"));
  document.addEventListener("pointerenter", () => root.classList.remove("hidden"));
  window.addEventListener("pointerdown", () => { root.style.transition = "none"; drop.setAttribute("r", "5.5"); });
  window.addEventListener("pointerup", () => { drop.setAttribute("r", "4.2"); });
  // stages set a hot state while the pointer is over a hotspot
  window.PenCursor = { set: setState };
})();
