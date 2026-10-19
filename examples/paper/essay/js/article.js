/* Fibre by Fibre: scroll-driven stages, generative swatches and interactions. */
(function () {
  "use strict";
  const P = window.Paper;
  const D = window.PAPER_DATA;
  const { clamp, ease, reduceMotion } = P;
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const INK = "22,22,22";

  // Size a canvas to its CSS box at device resolution; returns {ctx,w,h}
  function fit(canvas, aspect) {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width));
    const h = Math.max(1, Math.round(aspect ? w / aspect : r.height));
    canvas.width = Math.round(w * DPR);
    canvas.height = Math.round(h * DPR);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    return { ctx, w, h };
  }

  // Run fn once when el first comes near the viewport
  function whenNear(el, fn, margin = "300px") {
    if (!el) return;
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { io.disconnect(); fn(); }
    }, { rootMargin: margin });
    io.observe(el);
  }

  /* ---------- Torn-paper rectangle mask (like the header's tear) ---------- */
  function tornRect(seed, w = 400, h = 300, rough = 3.2) {
    const N = P.makeNoise(seed);
    const pts = [];
    const edge = (x0, y0, x1, y1, nx, ny, off) => {
      const len = Math.hypot(x1 - x0, y1 - y0), steps = Math.round(len / 2);
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const d = rough * (N.fbm(off + t * len * 0.04, 0.5, 4) * 2.2 + (N.noise(off * 3 + t * len * 0.35, 1.7) * 0.6));
        pts.push([(x0 + (x1 - x0) * t + nx * d).toFixed(1), (y0 + (y1 - y0) * t + ny * d).toFixed(1)]);
      }
    };
    const m = 6;
    edge(m, m, w - m, m, 0, 1, 1);
    edge(w - m, m, w - m, h - m, -1, 0, 9);
    edge(w - m, h - m, m, h - m, 0, -1, 17);
    edge(m, h - m, m, m, 1, 0, 29);
    const d = "M" + pts.map((p) => p.join(" ")).join(" L") + " Z";
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}' preserveAspectRatio='none'><filter id='s'><feGaussianBlur stdDeviation='0.5'/></filter><path d='${d}' fill='black' filter='url(#s)'/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }

  /* ---------- Paper specimens ---------- */
  const SPECIMENS = {
    washi: { seed: 3, formation: 0.3, formationScale: 3, grain: 0.02, fibres: 520, fibreLen: 0.3, fibreWidth: 1.1, fibreHeight: 0.03, tile: true,
      shade: { elevation: 0.75, relief: 5, color: [248, 247, 243], translucency: 0.45, fibreTint: [-16, -15, -12] } },
    xuan: { seed: 5, formation: 0.18, formationScale: 6, grain: 0.03, fibres: 1700, fibreLen: 0.05, fibreWidth: 0.9, fibreHeight: 0.025, tile: true,
      shade: { elevation: 0.8, relief: 5, color: [246, 245, 240], translucency: 0.45, fibreTint: [-10, -10, -8] } },
    hanji: { seed: 21, formation: 0.24, formationScale: 4, grain: 0.03, fibres: 900, fibreLen: 0.16, fibreWidth: 1.0, fibreHeight: 0.04, tile: true,
      shade: { elevation: 0.7, relief: 6, color: [244, 241, 233], translucency: 0.5, fibreTint: [-16, -15, -12] } },
    lokta: { seed: 31, formation: 0.32, formationScale: 5, grain: 0.07, fibres: 1200, fibreLen: 0.07, fibreWidth: 1.3, fibreHeight: 0.07, tile: true,
      shade: { elevation: 0.6, relief: 7, color: [236, 228, 212], translucency: 0.35, fibreTint: [-24, -24, -22] } },
    laid: { seed: 8, formation: 0.12, formationScale: 5, grain: 0.03, laid: 0.014, laidLines: 64, chainLines: 3, fibres: 900, fibreLen: 0.04, fibreHeight: 0.02, tile: true,
      shade: { elevation: 0.5, relief: 6, color: [242, 238, 226], translucency: 0.35, fibreTint: [-8, -8, -6] } },
    wove: { seed: 12, formation: 0.05, grain: 0.012, fibres: 400, fibreLen: 0.025, fibreHeight: 0.01, tile: true, soften: 2,
      shade: { elevation: 0.8, relief: 4, color: [246, 246, 244], translucency: 0.1, fibreTint: [-6, -6, -6] } }
  };
  function renderSpecimen(name, size) {
    const s = SPECIMENS[name];
    const field = P.paperHeight(size, s);
    return P.toCanvas(P.shade(field, s.shade));
  }

  /* ================= Header ================= */
  const header = $("#header");
  function onHeader() { header.classList.toggle("transparent", window.scrollY < 24 && !header.classList.contains("menu-open")); }

  /* ================= Navigation ================= */
  const chapters = $$(".chapter[data-chapter]").map((ch) => ({
    el: ch,
    id: ch.id,
    label: ch.dataset.chapter,
    subs: $$("[data-sub]", ch).map((s) => ({ el: s, id: s.id, label: s.dataset.sub }))
  }));
  function buildNav(host) {
    const ul = document.createElement("ul");
    chapters.forEach((c) => {
      const li = document.createElement("li");
      li.className = "nav-group";
      li.dataset.id = c.id;
      li.innerHTML = `<button class="nav-section" data-target="${c.id}">${c.label}</button>
        <div class="nav-subs"><ul>${c.subs.map((s) => `<li><button class="nav-sub" data-target="${s.id}">${s.label}</button></li>`).join("")}</ul></div>`;
      ul.appendChild(li);
    });
    host.appendChild(ul);
    host.addEventListener("click", (e) => {
      const b = e.target.closest("[data-target]");
      if (!b) return;
      const t = document.getElementById(b.dataset.target);
      const y = t.getBoundingClientRect().top + window.scrollY - 88;
      window.scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });
      closeMenu();
    });
  }
  buildNav($("#side-nav"));
  buildNav($("#menu-panel"));
  let activeKey = "";
  function spyNav() {
    const line = window.innerHeight * 0.32;
    let cur = null, sub = null;
    chapters.forEach((c) => {
      if (c.el.getBoundingClientRect().top <= line) {
        cur = c; sub = null;
        c.subs.forEach((s) => { if (s.el.getBoundingClientRect().top <= line) sub = s; });
      }
    });
    const key = (cur ? cur.id : "") + "/" + (sub ? sub.id : "");
    if (key === activeKey) return;
    activeKey = key;
    $$(".nav-group").forEach((g) => g.classList.toggle("open", !!cur && g.dataset.id === cur.id));
    $$(".nav-section").forEach((b) => b.classList.toggle("active", !!cur && b.dataset.target === cur.id));
    $$(".nav-sub").forEach((b) => b.classList.toggle("active", !!sub && b.dataset.target === sub.id));
  }

  /* ---------- Hamburger ---------- */
  const menuBtn = $("#menu-button"), menuPanel = $("#menu-panel");
  function closeMenu() {
    menuPanel.hidden = true;
    menuBtn.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
    header.classList.remove("menu-open");
    onHeader();
  }
  menuBtn.addEventListener("click", () => {
    const open = menuPanel.hidden;
    menuPanel.hidden = !open;
    menuBtn.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    header.classList.toggle("menu-open", open);
    onHeader();
  });
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

  /* ================= Reveal ================= */
  if (!reduceMotion) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("reveal-in"); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -8% 0px" });
    $$(".block-title, .block-lede, .plate, .tooth-fig, .ink-fig, .chapter-title, .coda-text").forEach((el) => {
      if (el.getBoundingClientRect().top > window.innerHeight) {
        el.classList.add("reveal-pre");
        io.observe(el);
      }
    });
  }

  /* ================= Hero: drifting fibres that settle as you scroll ================= */
  const hero = { canvas: $("#hero-fibres"), fibres: [], w: 0, h: 0, ctx: null, visible: true };
  function initHero() {
    const { ctx, w, h } = fit(hero.canvas);
    Object.assign(hero, { ctx, w, h });
    const rnd = P.mulberry32(42);
    const count = Math.round(Math.min(150, (w * h) / 9000));
    hero.fibres = Array.from({ length: count }, () => {
      const len = 30 + Math.exp(rnd() * 2.2) * 14;
      const pts = [];
      let a = rnd() * Math.PI * 2;
      const segs = 7;
      for (let i = 0; i <= segs; i++) { pts.push([Math.cos(a) * len * (i / segs - 0.5), Math.sin(a) * len * (i / segs - 0.5)]); a += (rnd() - 0.5) * 0.5; }
      return {
        pts, x: rnd() * w, y: rnd() * h, z: 0.3 + rnd() * 0.7,
        rot: rnd() * Math.PI * 2, spin: (rnd() - 0.5) * 0.002,
        settleY: h * (0.72 + rnd() * 0.26), drift: rnd() * 1000, alpha: 0.05 + rnd() * 0.12
      };
    });
  }
  function drawHero(t) {
    const { ctx, w, h } = hero;
    if (!ctx) return;
    const s = clamp(window.scrollY / (h * 0.9));
    const k = ease(s);
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = "round";
    for (const f of hero.fibres) {
      const bob = reduceMotion ? 0 : Math.sin(t * 0.0004 + f.drift) * 6 * f.z;
      const x = f.x + (reduceMotion ? 0 : Math.cos(t * 0.00023 + f.drift) * 10 * f.z);
      const y = (f.y + bob) * (1 - k) + f.settleY * k - window.scrollY * 0.25 * f.z;
      const rot = f.rot + (reduceMotion ? 0 : t * f.spin) * (1 - k);
      const flat = 1 - 0.6 * k;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot * flat);
      ctx.beginPath();
      f.pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py * flat) : ctx.moveTo(px, py * flat)));
      ctx.strokeStyle = `rgba(${INK},${f.alpha * (0.6 + 0.4 * f.z)})`;
      ctx.lineWidth = 0.6 + f.z * 0.7;
      ctx.stroke();
      ctx.restore();
    }
  }
  new IntersectionObserver((es) => { hero.visible = es[0].isIntersecting; }).observe($(".hero"));

  /* ================= Scrolly controller ================= */
  const scrollies = $$(".scrolly").map((el) => ({ el, steps: $$(".step", el), active: -1, render: null }));
  function updateScrollies() {
    for (const s of scrollies) {
      let mid = window.innerHeight * 0.55;
      const stage = s.stage || (s.stage = $(".scrolly-stage", s.el));
      if (stage.offsetWidth > s.el.offsetWidth * 0.8) {
        // stacked: the stage is pinned under the header; read in the middle of the window left below it
        const below = (parseFloat(getComputedStyle(stage).top) || 0) + stage.offsetHeight;
        mid = below + (window.innerHeight - below) * 0.5;
      }
      const r = s.el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > window.innerHeight + 200) continue;
      let idx = 0, local = 0;
      s.steps.forEach((st, i) => {
        const b = st.getBoundingClientRect();
        if (b.top + b.height * 0.5 <= mid + b.height * 0.5) { idx = i; local = clamp((mid - b.top) / b.height); }
      });
      if (idx !== s.active) {
        s.active = idx;
        s.steps.forEach((st, i) => st.classList.toggle("active", i === idx));
      }
      // continuous progress across all steps: idx + local
      const prog = clamp((idx + local) / s.steps.length);
      if (s.render) s.render(prog, idx, local);
    }
  }
  const scrollyById = (id) => scrollies.find((s) => s.el.id === id);

  /* ================= I.2 Fibres at true length ================= */
  (function fibreChart() {
    const host = $("#fibre-chart");
    const max = Math.max(...D.fibres.map((f) => f.range[1]));
    D.fibres.forEach((f, i) => {
      const row = document.createElement("div");
      row.className = "fibre-row";
      row.innerHTML = `<div class="fibre-name ink">${f.name}<small>${f.latin}</small></div><svg preserveAspectRatio="none"></svg><div class="fibre-len mono">${f.len} mm</div>`;
      host.appendChild(row);
      const svg = row.querySelector("svg");
      const draw = () => {
        const W = svg.getBoundingClientRect().width;
        const sx = W / max;
        const rnd = P.mulberry32(i * 13 + 5);
        const L = f.len * sx;
        const steps = Math.max(4, Math.round(L / 6));
        let d = `M0 17`, y = 17, a = 0;
        for (let k = 1; k <= steps; k++) { a += (rnd() - 0.5) * 0.5; a *= 0.8; y = clamp(y + Math.sin(a) * 2.2, 9, 25); d += ` L${((k / steps) * L).toFixed(1)} ${y.toFixed(1)}`; }
        const sw = 0.6 + (f.width - 10) / 30 * 1.6;
        svg.setAttribute("viewBox", `0 0 ${W} 34`);
        svg.innerHTML = `<line class="range" x1="${f.range[0] * sx}" y1="17" x2="${f.range[1] * sx}" y2="17"/><path d="${d}" stroke-width="${sw.toFixed(2)}"/>`;
        const path = svg.querySelector("path");
        const len = path.getTotalLength();
        path.style.strokeDasharray = len;
        path.style.strokeDashoffset = reduceMotion ? 0 : len;
        return path;
      };
      let path = draw();
      whenNear(row, () => {
        if (reduceMotion) return;
        path.style.transition = `stroke-dashoffset ${0.9 + f.len / 30}s cubic-bezier(0.22,1,0.36,1) ${i * 0.06}s`;
        requestAnimationFrame(() => (path.style.strokeDashoffset = 0));
      }, "-10% 0px");
      window.addEventListener("resize", () => { path = draw(); path.style.strokeDashoffset = 0; });
    });
  })();

  /* ================= II.1 Spread: horizontal timeline ================= */
  // Vertical scroll through a tall track slides a wide strip past a fixed
  // playhead; places light up as the playhead year reaches them.
  (function spread() {
    const root = $("#spread");
    const track = $(".tl-track", root), view = $(".tl-view", root), strip = $(".tl-strip", root), svg = $(".tl-svg", root);
    const yearNum = $(".tl-year-num", root), yearEra = $(".tl-year-era", root);
    const caps = $$(".tl-cap", root).map((el) => ({ el, from: +el.dataset.from }));
    const LANES = [
      { key: "east", name: "East Asia" },
      { key: "silk", name: "Silk Road & Islamic world" },
      { key: "europe", name: "Europe" },
      { key: "americas", name: "Americas" }
    ];
    // the routes the thread follows; each runs forward in time
    const ROUTES = [
      ["Fangmatan", "Luoyang", "Korea", "Japan"],
      ["Luoyang", "Tibet"],
      ["Luoyang", "Dunhuang", "Baghdad", "Cairo", "Xàtiva", "Fabriano", "Troyes", "Nuremberg", "Hertford", "Germantown"],
      ["Cairo", "Fez"],
      ["Xàtiva", "Mexico City"]
    ];
    const Y0 = -220, Y1 = 1740;
    const fmtYear = (y) => (y < 0 ? `${-y} BCE` : y === 0 ? "1 CE" : `${y}`);
    let L = null, items = [], clip = null, capIdx = -1;

    function build() {
      const vw = view.clientWidth, vh = view.clientHeight;
      const narrow = vw < 640;
      const ppy = clamp(vw / 700, 1.1, 2.4); // about seven centuries across the view
      const pad = 40, axisH = narrow ? 32 : 30;
      const cardW = narrow ? 124 : 160;
      const laneH = (vh - axisH) / LANES.length;
      const x = (yr) => pad + (yr - Y0) * ppy;
      const W = x(Y1) + cardW + pad;
      strip.style.width = W + "px";
      svg.setAttribute("viewBox", `0 0 ${W} ${vh}`);
      svg.setAttribute("width", W); svg.setAttribute("height", vh);

      // greedy rows inside each lane so cards don't collide
      const pos = {};
      LANES.forEach((ln, li) => {
        const ends = [-Infinity, -Infinity];
        D.spread.filter((d) => d.lane === ln.key).sort((a, b) => a.year - b.year).forEach((d) => {
          const cx = x(d.year);
          let r = ends.findIndex((e) => cx >= e);
          if (r < 0) r = ends[0] <= ends[1] ? 0 : 1;
          ends[r] = cx + cardW + 12;
          // narrow: lane name gets its own band; places sit in two rows under it
          const y = narrow
            ? axisH + li * laneH + 34 + r * clamp(laneH - 44, 16, 30)
            : axisH + li * laneH + laneH * (r ? 0.6 : 0.16) + 6;
          pos[d.place] = { x: cx, y };
        });
      });

      let g = "";
      for (let yr = -200; yr <= Y1; yr += 50) {
        const major = yr % 100 === 0;
        g += `<line class="tl-tick${major ? " major" : ""}" x1="${x(yr)}" x2="${x(yr)}" y1="${axisH - (major ? 9 : 5)}" y2="${major ? vh : axisH}"/>`;
        if (major) g += `<text class="tl-axis" x="${x(yr) + 4}" y="${axisH - (narrow ? 15 : 14)}">${fmtYear(yr)}</text>`;
      }
      LANES.forEach((ln, li) => { if (li) g += `<line class="tl-lane-rule" x1="0" x2="${W}" y1="${axisH + li * laneH}" y2="${axisH + li * laneH}"/>`; });
      // the thread: brushed curves place to place, revealed up to the playhead
      let d = "";
      ROUTES.forEach((rt) => rt.forEach((n, i) => {
        const p = pos[n];
        if (!i) { d += `M${p.x} ${p.y}`; return; }
        const q = pos[rt[i - 1]], mx = (q.x + p.x) / 2;
        d += ` C${mx} ${q.y} ${mx} ${p.y} ${p.x} ${p.y}`;
      }));
      g += `<defs><clipPath id="tl-clip"><rect x="0" y="0" width="0" height="${vh}"/></clipPath></defs>`;
      g += `<path class="tl-thread ghost" d="${d}"/><path class="tl-thread" d="${d}" clip-path="url(#tl-clip)"/>`;
      svg.innerHTML = g;
      clip = svg.querySelector("#tl-clip rect");

      $$(".tl-ev", strip).forEach((e) => e.remove());
      items = D.spread.map((dd) => {
        const p = pos[dd.place];
        const el = document.createElement("div");
        el.className = `tl-ev ${dd.kind}`;
        el.style.left = p.x + "px";
        el.style.top = p.y + "px";
        el.style.setProperty("--card-w", cardW + "px");
        el.innerHTML = `<i class="tl-dot ${dd.kind}"></i><div class="tl-card"><span class="tl-place ink">${dd.place}</span><span class="tl-when mono">${fmtYear(dd.year)}</span><span class="tl-note ink-light">${dd.note}</span></div>`;
        el.title = dd.note;
        strip.appendChild(el);
        return { el, year: dd.year, on: null };
      });

      $(".tl-lanes", root).innerHTML = LANES.map((ln, li) => `<span class="tl-lane-name" style="top:${axisH + li * laneH + 6}px">${ln.name}</span>`).join("");
      L = { x, vw, head: vw * (narrow ? 0.3 : 0.4) };
      render();
    }

    function render() {
      if (!L) return;
      const p = P.trackProgress(track);
      const year = Y0 + 20 + p * (Y1 - Y0 - 60);
      const hx = L.x(year);
      strip.style.transform = `translate3d(${(L.head - hx).toFixed(1)}px, 0, 0)`;
      clip.setAttribute("width", hx.toFixed(1));
      const y = Math.round(year);
      yearNum.textContent = y <= 0 ? 1 - y : y;
      yearEra.textContent = y <= 0 ? "BCE" : "CE";
      items.forEach((it) => {
        const on = it.year <= year;
        if (on !== it.on) { it.on = on; it.el.classList.toggle("on", on); }
      });
      let ci = 0;
      caps.forEach((c, i) => { if (year >= c.from) ci = i; });
      if (ci !== capIdx) { capIdx = ci; caps.forEach((c, i) => c.el.classList.toggle("active", i === ci)); }
    }

    whenNear(root, () => { build(); window.__timeline = render; });
    window.addEventListener("resize", () => { if (L) build(); });
  })();

  /* ================= II.2 Traditions: plates ================= */
  (function plates() {
    const host = $("#plates");
    const PLATES = [
      { key: "washi", name: "Washi", place: "Japan", facts: "Kozo, mitsumata or gampi bark. Formed by nagashizuki: repeated scoops in a bath thickened with neri root mucilage, so long fibres lie thin and even.", meta: "kozo ≈ 10 mm · UNESCO 2014, extended 2025", note: "h3" },
      { key: "xuan", name: "Xuan", place: "Jing County, Anhui", facts: "Qingtan bark for strength, rice straw for softness, more than 100 steps over two years. Left unsized, it lets ink bloom.", meta: "qingtan ≈ 2.5 mm · UNESCO 2009", note: "h3" },
      { key: "hanji", name: "Hanji", place: "Korea", facts: "Dak bark formed by webal-tteugi, a side-to-side scoop that crosses the fibres, then beaten damp (dochim) to close the surface.", meta: "nominated to UNESCO 2024 · decision Dec 2026", note: "h3" },
      { key: "lokta", name: "Lokta", place: "Nepal", facts: "Daphne bark cooked in lye and beaten. Nearly extinct by the 1950s, revived after 1969; used for documents and prayer books.", meta: "fibre length unverified", note: "h3" },
      { key: "laid", name: "Rag paper", place: "Fabriano and after", facts: "Linen and cotton rags pounded by water-driven stampers, sized with gelatin, formed on a wire mould whose laid and chain lines stay in the sheet.", meta: "flax ≈ 33 mm · watermarks from 1282", note: "h3" },
      { key: "wove", name: "Machine wove", place: "everywhere since 1800", facts: "Wood pulp on a moving wire. Short fibres align with the machine, the surface is even, and early acidic sheets go brittle within a lifetime.", meta: "eucalyptus ≈ 0.9 mm · 401 Mt a year", note: "h3" }
    ];
    PLATES.forEach((p, i) => {
      const el = document.createElement("article");
      el.className = "plate";
      el.innerHTML = `<div class="plate-swatch" style="--plate-mask:${tornRect(100 + i * 7)}"><canvas aria-label="Generated ${p.name} paper texture"></canvas></div>
        <h4 class="ink">${p.name}<span>${p.place}</span></h4>
        <p class="ink">${p.facts} <a class="note" href="report.html#${p.note}">${p.note.toUpperCase()}</a></p>
        <p class="mono">${p.meta}</p>`;
      host.appendChild(el);
      const canvas = el.querySelector("canvas");
      whenNear(el, () => {
        const r = canvas.getBoundingClientRect();
        const size = Math.min(512, Math.round(Math.max(r.width, r.height) * DPR / 2) * 2 || 320);
        const tex = renderSpecimen(p.key, 256);
        canvas.width = Math.round(r.width * DPR); canvas.height = Math.round(r.height * DPR);
        const ctx = canvas.getContext("2d");
        const pat = ctx.createPattern(tex, "repeat");
        const scale = Math.max(1, size / 256) * 0.9;
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        ctx.fillStyle = pat;
        ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);
      }, "400px");
    });
  })();
  const parallaxEls = () => $$(".plate-swatch");

  /* ================= IV.2 Studio: lay the essay on another sheet ================= */
  // A card picks a recipe from SPECIMENS; sliders edit a copy of it. Each change
  // renders one seamless 256 px tile and sets it as --page-bg, which the body and
  // every sticky stage already paint, so the whole page changes at once.
  (function studio() {
    const host = $("#studio-cards"), panel = $("#studio-panel"), loupe = $("#studio-loupe"), hint = $("#studio-hint");
    const groups = $$(".studio-group", $("#studio-controls"));
    const root = document.documentElement;
    const SITE_BG = getComputedStyle(root).getPropertyValue("--page-bg").trim();
    const NAMES = { washi: "Washi", xuan: "Xuan", hanji: "Hanji", lokta: "Lokta", laid: "Rag paper", wove: "Machine wove" };
    const TILE = 256, STORE = "fbf-paper";
    const COOL = [248, 248, 246], WARM = [233, 222, 198];
    const deg = (v) => `${Math.round((v * 180) / Math.PI)}°`;
    const CTRL = [
      { k: "formation", label: "Formation", hint: "cloudy thick and thin patches", min: 0, max: 0.5, step: 0.01, g: 0 },
      { k: "fibres", label: "Fibres", hint: "how many", min: 0, max: 2500, step: 50, g: 0, fmt: (v) => String(Math.round(v)) },
      { k: "fibreLen", label: "Fibre length", hint: "share of the tile", min: 0.02, max: 0.4, step: 0.01, g: 0, def: 0.08 },
      { k: "grain", label: "Grain", hint: "fine speckle", min: 0, max: 0.1, step: 0.002, g: 0, fmt: (v) => v.toFixed(3) },
      { k: "laid", label: "Laid lines", hint: "marks of a wire mould", min: 0, max: 0.03, step: 0.001, g: 0, fmt: (v) => v.toFixed(3) },
      { k: "relief", label: "Relief", hint: "how deep the surface reads", min: 1, max: 9, step: 0.5, g: 1, shade: true, def: 6, fmt: (v) => v.toFixed(1) },
      { k: "elevation", label: "Light height", hint: "low light shows the tooth", min: 0.35, max: 1.3, step: 0.01, g: 1, shade: true, def: 0.9, fmt: deg },
      { k: "azimuth", label: "Light direction", min: -3.14, max: 3.14, step: 0.02, g: 1, shade: true, def: -2.2, fmt: deg },
      { k: "translucency", label: "Look-through", hint: "thin patches glow", min: 0, max: 0.7, step: 0.01, g: 1, shade: true },
      { k: "warmth", label: "Warmth", hint: "cool white to old cream", min: 0, max: 1, step: 0.01, g: 1, fmt: (v) => `${Math.round(v * 100)}%` }
    ];
    const copy = (o) => JSON.parse(JSON.stringify(o));
    const warmthOf = (c) => clamp((COOL[2] - c[2]) / (COOL[2] - WARM[2]));
    const get = (r, c) => (c.k === "warmth" ? warmthOf(r.shade.color || COOL) : (c.shade ? r.shade[c.k] : r[c.k]) ?? c.def ?? 0);
    function set(r, c, v) {
      if (c.k === "warmth") r.shade.color = COOL.map((a, i) => Math.round(a + (WARM[i] - a) * v));
      else if (c.shade) r.shade[c.k] = v;
      else {
        r[c.k] = v;
        if (c.k === "laid") { r.laidLines = r.laidLines || 64; r.chainLines = r.chainLines || 3; }
      }
    }
    const tile = (r) => P.toCanvas(P.shade(P.paperHeight(TILE, r), r.shade));
    // The page shows the sheet ten times finer than the swatch tile, so the 2x
    // close-up reads as 20x the page. Shrinking the tile itself would repeat
    // every 25 px, so the page gets its own tile: the same recipe with every
    // feature scaled down (frequencies up, fibres shorter and thinner, relief
    // down so the slopes, and so the shading, keep their character).
    const FINE = 10;
    function pageTile(r, size) {
      const n = (size / TILE) * FINE;               // swatch periods across this tile
      const q = copy(r);
      q.formationScale = Math.round((r.formationScale || 4) * n);
      q.grainScale = Math.min(size / 2, Math.round((r.grainScale || 48) * n));
      if (r.tooth) q.toothScale = Math.min(size / 2, Math.round((r.toothScale || 14) * n));
      if (r.laid) { q.laidLines = Math.min(size / 4, Math.round((r.laidLines || 90) * n)); q.chainLines = Math.round((r.chainLines || 4) * n); }
      q.fibres = Math.min(Math.round((r.fibres || 0) * n * n), size * 16);
      q.fibreLen = (r.fibreLen || 0.08) / n;
      q.fibreWidth = Math.max(0.45, (r.fibreWidth || 0.9) / FINE * 2);
      q.soften = 0;
      q.shade = { ...r.shade, relief: (r.shade.relief == null ? 6 : r.shade.relief) / FINE * 1.6 };
      return P.toCanvas(P.shade(P.paperHeight(size, q), q.shade));
    }

    let cur = null; // { key, recipe }
    function save() { try { cur ? localStorage.setItem(STORE, JSON.stringify(cur)) : localStorage.removeItem(STORE); } catch (e) {} }
    // while a slider moves, a quick small tile; a sharp large one once it rests
    const setBg = (t, size) => root.style.setProperty("--page-bg", `url(${t.toDataURL()}) 0 0 / ${size}px ${size}px repeat`);
    let sharpTimer = 0;
    function apply(quick) {
      clearTimeout(sharpTimer);
      if (!cur) { root.style.removeProperty("--page-bg"); drawLoupe(null); return; }
      drawLoupe(tile(cur.recipe));
      if (quick) { setBg(pageTile(cur.recipe, 256), 256); sharpTimer = setTimeout(() => apply(false), 220); }
      else setBg(pageTile(cur.recipe, 512), 512);
    }
    function drawLoupe(t) {
      if (!loupe) return;
      const r = loupe.getBoundingClientRect();
      if (!r.width) return;
      loupe.width = Math.round(r.width * DPR); loupe.height = Math.round(r.height * DPR);
      const ctx = loupe.getContext("2d");
      if (!t) { ctx.clearRect(0, 0, loupe.width, loupe.height); return; }
      ctx.setTransform(DPR * 2, 0, 0, DPR * 2, 0, 0);
      ctx.fillStyle = ctx.createPattern(t, "repeat");
      ctx.fillRect(0, 0, r.width / 2, r.height / 2);
    }

    // restore a saved sheet straight away, so the page opens on it
    try { const s = JSON.parse(localStorage.getItem(STORE) || "null"); if (s && SPECIMENS[s.key] && s.recipe && s.recipe.shade) cur = s; } catch (e) {}
    if (cur) apply();
    if (!host) return;

    /* cards */
    const cards = [["site", "This site's paper", "grey-cyan with grain"]].concat(Object.keys(NAMES).map((k) => [k, NAMES[k], ""]));
    const cardEls = cards.map(([key, name, sub], i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "studio-card";
      b.setAttribute("role", "radio");
      b.dataset.key = key;
      b.innerHTML = `<span class="studio-swatch" style="--plate-mask:${tornRect(300 + i * 11)}"><canvas aria-hidden="true"></canvas></span><span class="studio-name">${name}</span>${sub ? `<span class="mono">${sub}</span>` : ""}`;
      if (key === "site") b.querySelector(".studio-swatch").style.background = SITE_BG;
      b.addEventListener("click", () => pick(key));
      host.appendChild(b);
      return b;
    });
    // arrow keys move between cards, as in any radio group
    host.addEventListener("keydown", (e) => {
      const i = cardEls.indexOf(document.activeElement);
      if (i < 0 || !["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(e.key)) return;
      e.preventDefault();
      const n = cardEls[(i + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : cardEls.length - 1)) % cardEls.length];
      n.focus(); pick(n.dataset.key);
    });
    whenNear(host, () => {
      cardEls.forEach((b) => {
        if (b.dataset.key === "site") return;
        const c = b.querySelector("canvas"), r = c.getBoundingClientRect();
        c.width = Math.round(r.width * DPR); c.height = Math.round(r.height * DPR);
        const ctx = c.getContext("2d");
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        ctx.fillStyle = ctx.createPattern(renderSpecimen(b.dataset.key, TILE), "repeat");
        ctx.fillRect(0, 0, r.width, r.height);
      });
      drawLoupe(cur ? tile(cur.recipe) : null);
    }, "400px");

    /* sliders */
    const inputs = CTRL.map((c) => {
      const id = `studio-${c.k}`;
      const row = document.createElement("label");
      row.className = "studio-row";
      row.htmlFor = id;
      row.innerHTML = `<span class="studio-label">${c.label}${c.hint ? `<small>${c.hint}</small>` : ""}</span><input type="range" id="${id}" min="${c.min}" max="${c.max}" step="${c.step}"><output class="mono" for="${id}"></output>`;
      groups[c.g].appendChild(row);
      const input = row.querySelector("input"), out = row.querySelector("output");
      const show = () => { out.textContent = (c.fmt || ((v) => v.toFixed(2)))(+input.value); };
      input.addEventListener("input", () => { if (!cur) return; set(cur.recipe, c, +input.value); show(); queue(); });
      input.addEventListener("change", save);
      return { c, input, show };
    });
    let pending = false;
    function queue() { if (pending) return; pending = true; requestAnimationFrame(() => { pending = false; apply(true); }); }
    function sync() {
      cardEls.forEach((b) => b.setAttribute("aria-checked", String(b.dataset.key === (cur ? cur.key : "site"))));
      cardEls.forEach((b) => { b.tabIndex = b.getAttribute("aria-checked") === "true" ? 0 : -1; });
      panel.classList.toggle("off", !cur);
      hint.hidden = !!cur;
      inputs.forEach(({ c, input, show }) => { input.disabled = !cur; input.value = cur ? get(cur.recipe, c) : get(SPECIMENS.washi, c); show(); });
    }
    function pick(key) {
      if (key === "site") cur = null;
      else if (!cur || cur.key !== key) cur = { key, recipe: copy(SPECIMENS[key]) };
      sync(); apply(); save();
    }
    $("#studio-shuffle").addEventListener("click", () => { if (!cur) return; cur.recipe.seed = (cur.recipe.seed * 7 + 13) % 997; apply(); save(); });
    $("#studio-reset").addEventListener("click", () => { if (!cur) return; cur.recipe = copy(SPECIMENS[cur.key]); sync(); apply(); save(); });
    window.addEventListener("resize", () => drawLoupe(cur ? tile(cur.recipe) : null));
    sync();
  })();

  /* ================= II.3 Makers: 70,000 → 295 ================= */
  (function makers() {
    const canvas = $("#makers-canvas"), num = $("#makers-num"), yr = $("#makers-year"), text = $(".makers-text");
    let st = null, last = -1;
    function init() {
      const r = canvas.getBoundingClientRect();
      const w = Math.round(r.width * DPR), h = w;
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      const total = 70000;
      const rnd = P.mulberry32(9);
      const N = P.makeNoise(4);
      const xs = new Float32Array(total), ys = new Float32Array(total), rank = new Float32Array(total);
      // dots fill a soft, cloud-edged disc (a sheet seen from above)
      let n = 0;
      while (n < total) {
        const x = rnd(), y = rnd();
        const d = Math.hypot(x - 0.5, y - 0.5);
        const edge = 0.46 + 0.04 * N.fbm(x * 4, y * 4, 3);
        if (d > edge) continue;
        xs[n] = x; ys[n] = y; rank[n] = rnd(); n++;
      }
      st = { ctx, w, h, xs, ys, rank, total, img: ctx.createImageData(w, h) };
    }
    function draw(count) {
      if (!st) return;
      const c = Math.round(count);
      if (c === last) return;
      last = c;
      const { ctx, w, h, xs, ys, rank, total, img } = st;
      const d = img.data;
      d.fill(0);
      const thr = c / total;
      const dot = Math.max(1, Math.round(DPR));
      for (let i = 0; i < total; i++) {
        if (rank[i] > thr) continue;
        const px = (xs[i] * w) | 0, py = (ys[i] * h) | 0;
        for (let oy = 0; oy < dot; oy++) for (let ox = 0; ox < dot; ox++) {
          const j = ((py + oy) * w + px + ox) * 4;
          d[j] = 22; d[j + 1] = 22; d[j + 2] = 22; d[j + 3] = 200;
        }
      }
      ctx.putImageData(img, 0, 0);
      // remaining few hundred: draw larger so they stay visible
      if (c < 3000) {
        ctx.fillStyle = `rgba(${INK},0.85)`;
        for (let i = 0; i < total; i++) if (rank[i] <= thr) { ctx.beginPath(); ctx.arc(xs[i] * w, ys[i] * h, 1.6 * DPR, 0, 6.283); ctx.fill(); }
      }
    }
    function update() {
      if (!st) return;
      const r = text.getBoundingClientRect();
      const p = clamp((window.innerHeight * 0.6 - r.top) / (r.height * 0.8));
      // log interpolation through the three data points
      const lg = (a, b, t) => Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * t);
      let c, label;
      if (p < 0.15) { c = 70000; label = "households · 1901"; }
      else if (p < 0.6) { const t = ease((p - 0.15) / 0.45); c = lg(70000, 500, t); label = t < 0.98 ? "households · falling" : "households · 1984"; }
      else if (p < 0.85) { const t = ease((p - 0.6) / 0.25); c = lg(500, 295, t); label = t < 0.98 ? "households · falling" : "households · 2009"; }
      else { c = 295; label = "households · 2009"; }
      if (reduceMotion) { c = 295; label = "households · 2009 (from ≈70,000 in 1901)"; }
      draw(c);
      num.textContent = Math.round(c).toLocaleString("en-US");
      yr.textContent = label;
    }
    whenNear(canvas, () => { init(); update(); });
    makers.update = update;
    window.__makers = update;
  })();

  /* ---------- Production line ---------- */
  (function production() {
    const svg = $("#production-svg");
    function build() {
      const W = svg.getBoundingClientRect().width, H = 150;
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const pts = D.production;
      const x = (yr) => 30 + ((yr - 1980) / 43) * (W - 70);
      const y = (mt) => H - 24 - (mt / 420) * (H - 50);
      let d = "";
      pts.forEach((p, i) => { d += `${i ? " L" : "M"}${x(p.year).toFixed(1)} ${y(p.mt).toFixed(1)}`; });
      let html = `<path class="line" d="${d}"/>`;
      pts.forEach((p) => {
        html += `<circle cx="${x(p.year)}" cy="${y(p.mt)}" r="2.6" fill="${p.derived ? "none" : "#161616"}" stroke="#161616" stroke-width="1.1"/>
          ${p.year === 2020 ? "" : `<text x="${x(p.year)}" y="${y(p.mt) - 9}" text-anchor="${p.year === 2023 ? "end" : "middle"}">${p.derived ? "≈" : ""}${p.mt}${p.year === 2023 ? " (2020, 2023)" : ""}</text>`}
          <text x="${x(p.year)}" y="${H - 6}" text-anchor="${p.year === 2020 ? "end" : p.year === 2023 ? "start" : "middle"}">${p.year}</text>`;
      });
      html += `<text x="0" y="12">Mt per year</text>`;
      svg.innerHTML = html;
      const path = svg.querySelector(".line"), L = path.getTotalLength();
      path.style.strokeDasharray = L;
      path.style.strokeDashoffset = reduceMotion ? 0 : L;
      return path;
    }
    whenNear(svg, () => {
      const path = build();
      if (!reduceMotion) { path.style.transition = "stroke-dashoffset 1.6s cubic-bezier(0.22,1,0.36,1)"; requestAnimationFrame(() => (path.style.strokeDashoffset = 0)); }
    }, "-15% 0px");
  })();

  /* ================= III.1 Raking light ================= */
  (function raking() {
    const canvas = $("#raking-canvas"), readout = $("#raking-readout");
    const S = scrollyById("raking");
    let st = null, lastKey = "";
    function init() {
      const r = canvas.getBoundingClientRect();
      const size = Math.min(420, Math.round(r.width * DPR * 0.55));
      const field = P.paperHeight(size, { seed: 14, formation: 0.12, formationScale: 4, grain: 0.012, laid: 0.022, laidLines: 46, chainLines: 3, fibres: 900, fibreLen: 0.035, fibreHeight: 0.012, soften: 1 });
      // watermark: an orb with a cross, pressed thinner into the sheet
      const H = field.H, n = size;
      const cx = n * 0.5, cy = n * 0.56, R = n * 0.17;
      const wm = new Float32Array(n * n);
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const d = Math.hypot(x - cx, y - cy);
        let m = Math.max(0, 1 - Math.abs(d - R) / 2.2);
        if (Math.abs(x - cx) < 1.6 && y < cy - R + 2 && y > cy - R * 1.9) m = Math.max(m, 1 - Math.abs(x - cx) / 1.6);
        if (Math.abs(y - (cy - R * 1.6)) < 1.6 && Math.abs(x - cx) < R * 0.35) m = Math.max(m, 1 - Math.abs(y - (cy - R * 1.6)) / 1.6);
        if (Math.abs(y - cy) < 1.4 && d < R) m = Math.max(m, 1 - Math.abs(y - cy) / 1.4);
        H[y * n + x] -= 0.022 * m;
        wm[y * n + x] = m;
      }
      const img = new ImageData(size, size);
      const off = document.createElement("canvas");
      off.width = off.height = size;
      fit(canvas, 1);
      st = { field, wm, img, off, size, ctx: canvas.getContext("2d") };
    }
    function draw(prog, idx, local) {
      if (!st) return;
      const elevDeg = idx < 3 ? 80 - 70 * ease(clamp(prog / 0.72)) : 10;
      const trans = idx === 3 ? ease(clamp(local * 1.6)) : 0;
      const key = elevDeg.toFixed(1) + "/" + trans.toFixed(2);
      if (key === lastKey) return;
      lastKey = key;
      const { field, wm, img, off, size, ctx } = st;
      P.shade(field, { azimuth: Math.PI * 0.08, elevation: (elevDeg * Math.PI) / 180, relief: 4.5, ambient: 0.32, color: [243, 240, 230], translucency: 0.3, fibreTint: [-6, -6, -5] }, img);
      if (trans > 0) {
        // transmitted light: thinner paper glows, I = exp(-k·thickness)
        const d = img.data, H = field.H;
        let mean = 0;
        for (let i = 0; i < size * size; i++) mean += H[i];
        mean /= size * size;
        for (let i = 0; i < size * size; i++) {
          // thinner than average → brighter; warm daylight behind the sheet
          const tr = Math.min(1.1, 0.86 * Math.exp(-6 * (H[i] - mean)) + 0.22 * wm[i]);
          const lr = 252 * tr, lg = 240 * tr, lb = 214 * tr;
          const j = i * 4;
          d[j] = d[j] * (1 - trans) + lr * trans;
          d[j + 1] = d[j + 1] * (1 - trans) + lg * trans;
          d[j + 2] = d[j + 2] * (1 - trans) + lb * trans;
        }
      }
      off.getContext("2d").putImageData(img, 0, 0);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
      readout.textContent = trans > 0.5 ? "transmitted light · held to a window" : `light elevation ${Math.round(elevDeg)}°`;
    }
    whenNear(canvas, () => { init(); S.render = draw; updateScrollies(); });
  })();

  /* ================= III.2 Tooth ================= */
  (function tooth() {
    const host = $("#tooth-row");
    const kinds = [
      { name: "Hot-pressed", meta: "smooth", o: { seed: 51, formation: 0.04, grain: 0.008, fibres: 220, fibreLen: 0.03, fibreHeight: 0.01, soften: 2 } },
      { name: "Cold-pressed", meta: "NOT · felt tooth", o: { seed: 52, formation: 0.05, grain: 0.035, tooth: 0.09, toothScale: 9, fibres: 300, fibreLen: 0.03, fibreHeight: 0.015, soften: 2 } },
      { name: "Rough", meta: "barely pressed", o: { seed: 53, formation: 0.07, grain: 0.05, tooth: 0.18, toothScale: 6, fibres: 300, fibreLen: 0.03, fibreHeight: 0.02, soften: 2 } }
    ];
    const items = kinds.map((k) => {
      const fig = document.createElement("figure");
      fig.className = "tooth-fig";
      fig.innerHTML = `<canvas aria-label="${k.name} watercolour paper texture"></canvas><figcaption><span class="ink">${k.name}</span><span class="mono">${k.meta}</span></figcaption>`;
      host.appendChild(fig);
      return { k, canvas: fig.querySelector("canvas"), field: null, img: null };
    });
    let az = -2.2;
    function drawAll() {
      items.forEach((it) => {
        if (!it.field) return;
        P.shade(it.field, { azimuth: az, elevation: 0.42, relief: 7, ambient: 0.25, color: [246, 244, 238] }, it.img);
        const off = document.createElement("canvas");
        P.toCanvas(it.img, off);
        const ctx = it.canvas.getContext("2d");
        ctx.drawImage(off, 0, 0, it.canvas.width, it.canvas.height);
      });
    }
    whenNear(host, () => {
      items.forEach((it) => {
        const r = it.canvas.getBoundingClientRect();
        const size = Math.min(320, Math.round(r.width * DPR * 0.75));
        it.field = P.paperHeight(size, it.k.o);
        it.img = new ImageData(size, size);
        it.canvas.width = Math.round(r.width * DPR); it.canvas.height = it.canvas.width;
      });
      drawAll();
      // a slow sweep of the light on arrival
      if (!reduceMotion) {
        const t0 = performance.now();
        const sweep = (t) => { const k = clamp((t - t0) / 1800); az = -2.2 + Math.sin(k * Math.PI) * 1.2; drawAll(); if (k < 1) requestAnimationFrame(sweep); };
        requestAnimationFrame(sweep);
      }
    });
    let pending = false;
    const aim = (e) => {
      const r = host.getBoundingClientRect();
      az = -Math.PI + ((e.clientX - r.left) / r.width) * Math.PI * 1.4;
      if (!pending) { pending = true; requestAnimationFrame(() => { pending = false; drawAll(); }); }
    };
    host.addEventListener("pointermove", aim);
    host.addEventListener("pointerdown", aim); // a tap moves the light on touch screens
  })();

  /* ================= III.3 Ink ================= */
  (function ink() {
    const setups = [
      { canvas: $("#ink-raw"), sizing: 0.0, seed: 5 },
      { canvas: $("#ink-sized"), sizing: 0.85, seed: 6 }
    ];
    const COLS = 160, ROWS = 120;
    setups.forEach((s) => {
      const fieldTex = P.paperHeight(256, { seed: s.seed, formation: 0.18, formationScale: 6, grain: 0.03, fibres: 1600, fibreLen: 0.06, fibreWidth: 0.9, fibreHeight: 0.025, tile: true });
      const paper = P.toCanvas(P.shade(fieldTex, { elevation: 0.85, relief: 5, color: [247, 246, 241], translucency: 0.4, fibreTint: [-10, -10, -8] }));
      // conductivity: higher along fibres and in thin, open areas
      const cond = new Float32Array(COLS * ROWS);
      const N = P.makeNoise(s.seed + 40);
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        const fx = Math.floor((x / COLS) * 256), fy = Math.floor((y / ROWS) * 256);
        const f = fieldTex.cover[fy * 256 + fx];
        cond[y * COLS + x] = 0.08 + 3.2 * Math.pow(f, 1.3) + 0.45 * Math.max(0, N.fbm(x * 0.09, y * 0.09, 3) + 0.4);
      }
      s.sim = P.inkSim(COLS, ROWS, cond, { sizing: s.sizing });
      s.paper = paper;
      s.frames = 0;
      s.off = document.createElement("canvas");
      s.off.width = COLS; s.off.height = ROWS;
      s.offImg = s.off.getContext("2d").createImageData(COLS, ROWS);
      s.canvas.addEventListener("click", (e) => {
        const r = s.canvas.getBoundingClientRect();
        s.sim.drop(Math.round(((e.clientX - r.left) / r.width) * COLS), Math.round(((e.clientY - r.top) / r.height) * ROWS), 4, 2.4);
        s.frames = 320;
      });
    });
    function render(s) {
      const { ctx, w, h } = s.view;
      ctx.clearRect(0, 0, w, h);
      const pat = ctx.createPattern(s.paper, "repeat");
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, w, h);
      const d = s.offImg.data;
      for (let i = 0; i < COLS * ROWS; i++) {
        const v = Math.min(1, s.sim.density(i) * 1.1);
        const j = i * 4;
        d[j] = 18; d[j + 1] = 18; d[j + 2] = 20; d[j + 3] = Math.round(255 * Math.pow(v, 0.8));
      }
      s.off.getContext("2d").putImageData(s.offImg, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(s.off, 0, 0, w, h);
    }
    let running = false;
    function loop() {
      let any = false;
      setups.forEach((s) => {
        if (s.frames > 0) { for (let k = 0; k < 4; k++) s.sim.step(); s.frames--; render(s); any = true; }
      });
      running = any;
      if (any) requestAnimationFrame(loop);
    }
    const kick = () => { if (!running) { running = true; requestAnimationFrame(loop); } };
    setups.forEach((s) => s.canvas.addEventListener("click", kick));
    whenNear(setups[0].canvas, () => {
      setups.forEach((s) => {
        s.view = fit(s.canvas, 4 / 3);
        // first strokes: the same three drops on both sheets
        [[46, 60, 5], [86, 48, 4], [118, 72, 3]].forEach(([x, y, r]) => s.sim.drop(x, y, r, 2.4));
        s.frames = reduceMotion ? 0 : 320;
        if (reduceMotion) for (let k = 0; k < 1200; k++) s.sim.step();
        render(s);
      });
      kick();
    }, "-20% 0px");
  })();

  /* ================= IV. Pipeline ================= */
  (function pipeline() {
    const canvas = $("#pipe-canvas"), readout = $("#pipe-readout");
    const S = scrollyById("pipeline");
    const names = ["gradient noise", "fractal sum, 5 octaves", "formation", "fibres", "normals", "Lambert light", "paper"];
    let frames = null, last = "";
    function build() {
      const size = 256;
      const N = P.makeNoise(77);
      const img = () => new ImageData(size, size);
      const gray = (fn) => {
        const im = img();
        for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
          const v = clamp(fn(x / size, y / size));
          const j = (y * size + x) * 4;
          const c = 236 - v * 150;
          im.data[j] = c; im.data[j + 1] = c; im.data[j + 2] = c + 2; im.data[j + 3] = 255;
        }
        return P.toCanvas(im);
      };
      const f0 = gray((u, v) => 0.5 + 0.5 * N.noise(u * 6, v * 6));
      const f1 = gray((u, v) => 0.5 + 0.9 * N.fbm(u * 6, v * 6, 5));
      const field = P.paperHeight(size, { seed: 77, formation: 0.28, formationScale: 4, grain: 0.03, fibres: 0, tile: true });
      const f2 = gray((u, v) => (field.H[Math.floor(v * size) * size + Math.floor(u * size)] - 0.35) * 2.2);
      const full = P.paperHeight(size, { seed: 77, formation: 0.28, formationScale: 4, grain: 0.03, fibres: 900, fibreLen: 0.12, fibreWidth: 1.0, fibreHeight: 0.05, tile: true });
      const f3 = gray((u, v) => (full.H[Math.floor(v * size) * size + Math.floor(u * size)] - 0.35) * 2.2);
      // normals in false colour
      const nm = img();
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        const i = y * size + x, H = full.H;
        const dx = (H[y * size + ((x + 1) % size)] - H[y * size + ((x + size - 1) % size)]) * 6;
        const dy = (H[((y + 1) % size) * size + x] - H[((y + size - 1) % size) * size + x]) * 6;
        const inv = 1 / Math.hypot(dx, dy, 1);
        const j = i * 4;
        nm.data[j] = 0.45 * (128 + 127 * -dx * inv) + 0.55 * 236; nm.data[j + 1] = 0.45 * (128 + 127 * -dy * inv) + 0.55 * 236; nm.data[j + 2] = 0.45 * (128 + 127 * inv) + 0.55 * 238; nm.data[j + 3] = 255;
      }
      const f4 = P.toCanvas(nm);
      const f5 = P.toCanvas(P.shade(full, { elevation: 0.45, relief: 6, ambient: 0.2, color: [236, 236, 236] }));
      const f6 = P.toCanvas(P.shade(full, { elevation: 0.7, relief: 5, ambient: 0.35, color: [247, 245, 238], translucency: 0.7, fibreTint: [-18, -17, -14] }));
      frames = [f0, f1, f2, f3, f4, f5, f6];
      fit(canvas, 1);
    }
    function render(prog, idx, local) {
      if (!frames) return;
      const mix = idx < frames.length - 1 ? ease(clamp((local - 0.55) / 0.45)) : 0;
      const key = idx + "/" + mix.toFixed(2);
      if (key === last) return;
      last = key;
      const ctx = canvas.getContext("2d");
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = idx === 0 || idx === 1 || idx === 2 ? true : false;
      ctx.globalAlpha = 1;
      ctx.drawImage(frames[idx], 0, 0, canvas.width, canvas.height);
      if (mix > 0) { ctx.globalAlpha = mix; ctx.drawImage(frames[idx + 1], 0, 0, canvas.width, canvas.height); ctx.globalAlpha = 1; }
      readout.textContent = `${idx + 1} / 7 · ${names[idx]}`;
    }
    whenNear(canvas, () => { build(); S.render = render; updateScrollies(); });
  })();

  /* ================= Frame loop ================= */
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      onHeader();
      spyNav();
      updateScrollies();
      if (window.__makers) window.__makers();
      if (window.__timeline) window.__timeline();
      if (!reduceMotion) {
        for (const el of parallaxEls()) {
          const p = P.progress(el);
          el.style.transform = `translate3d(0, ${((0.5 - p) * 28).toFixed(1)}px, 0)`;
        }
      }
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => { initHero(); onScroll(); });

  function frame(t) {
    if (hero.visible) drawHero(t);
    requestAnimationFrame(frame);
  }
  initHero();
  drawHero(0);
  onScroll();
  if (!reduceMotion) requestAnimationFrame(frame);
})();
