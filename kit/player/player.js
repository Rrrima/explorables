/* Explainer kit · player. Builds the whole interface into <div id="explainer"> and
   drives it: a sticky stage that shrinks as you scroll, a scene timeline, hover
   hotspots that explain things in the picture, captions, and the ask loop (pause,
   ask, watch an answer, ask inside that answer, regenerate a take, go back).
   A project sets window.EXPLAINER before loading this file:
     {
       title, article: { name, url }, segNames: [...], poster: seconds,
       audio: "audio/mix.m4a", captions: "captions.srt", answers: "answers/", api: "api/",
       playhead: "<svg …>",              // optional marker that rides the timeline
       ring(ctx, cx, cy, rx, ry, t),     // optional: how a hovered thing is circled
       load: async () => ({ stage, answer, schedule })   // stage from ExplainerStage.Stage, answer from AnswerKit
     } */
(async function () {
  "use strict";
  const X = window.EXPLAINER;
  const mount = document.getElementById("explainer");
  const esc = (x) => String(x == null ? "" : x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const API = X.api || "api/", ANS = X.answers || "answers/";

  mount.innerHTML = `
    <div class="xp-stage" id="xp-stage" tabindex="0" aria-label="Video player">
      <nav class="xp-crumbs" id="xp-crumbs" aria-label="Where you are"></nav>
      <div class="xp-player" id="xp-player">
        <canvas id="xp-screen" width="1920" height="1080" aria-label="${esc(X.title)}" data-cursor="play"></canvas>
        <div class="xp-caption" id="xp-caption" aria-live="polite"></div>
        <div class="xp-tag xp-hottip" id="xp-hottip" role="tooltip"></div>
        <button class="xp-big" id="xp-big" aria-label="Play"><svg viewBox="0 0 24 24"><path d="M6 4l15 8-15 8z"/></svg></button>
        <div class="xp-end" id="xp-end"><button id="xp-replay" class="alt">↺ Replay</button><button id="xp-up">Back</button></div>
      </div>
      <div class="xp-deck">
        <button class="xp-play" id="xp-playbtn" aria-label="Play"><svg viewBox="0 0 40 40" id="xp-playicon"></svg></button>
        <div class="xp-tl" id="xp-scrub" role="slider" aria-label="Seek" aria-valuemin="0" tabindex="0" data-cursor="slide">
          <div class="xp-segs" id="xp-segs"></div>
          <div class="xp-head" id="xp-head" aria-hidden="true">${X.playhead || '<svg width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="7"/></svg>'}</div>
          <div class="xp-tag xp-tltag" id="xp-tag" aria-hidden="true"></div>
        </div>
        <div class="xp-side">
          <span class="xp-time" id="xp-time"><b>0:00</b> / 0:00</span>
          <button class="xp-txt" id="xp-cc" aria-pressed="false" aria-label="Captions">CC</button>
          <button class="xp-txt" id="xp-fs" aria-label="Full screen">Full screen</button>
        </div>
      </div>
    </div>
    <section class="xp-card" id="xp-card" hidden aria-live="polite">
      <div class="xp-card-top"><span class="xp-kicker" id="xp-kick">You asked</span><div class="xp-row" id="xp-back"></div></div>
      <h2 id="xp-ctitle"></h2>
      <p class="xp-summary" id="xp-sum"></p>
      <div class="xp-row">
        <button class="xp-btn solid" id="xp-cplay">▶ Play the answer</button>
        <button class="xp-btn" id="xp-scriptbtn" aria-expanded="false" aria-controls="xp-script">Show the script</button>
        <button class="xp-btn" id="xp-regen" title="Write and record a different take of this answer, from the same research">↻ New take</button>
      </div>
      <div class="xp-script" id="xp-script" hidden></div>
      <div class="xp-next" id="xp-next"></div>
    </section>
    <section class="xp-list" id="xp-list" hidden></section>
    <div class="xp-askbar"><div class="xp-askin">
      <details class="xp-agent idle" id="xp-agent"><summary id="xp-asum"><span>Pause anywhere and ask a question. An answer clip takes about two minutes.</span></summary><ol id="xp-alog"></ol></details>
      <form class="xp-ask" id="xp-form" autocomplete="off"><span class="xp-ctx" id="xp-at">at 0:00</span><input id="xp-q" type="text" placeholder="Pause anywhere and ask a question…" aria-label="Your question" required><button type="submit" id="xp-askbtn">Ask</button></form>
    </div></div>`;
  const $ = (id) => document.getElementById(id);
  const stageEl = $("xp-stage"), screen = $("xp-screen"), sctx = screen.getContext("2d");
  const scrub = $("xp-scrub"), segsEl = $("xp-segs"), head = $("xp-head"), tag = $("xp-tag"), time = $("xp-time"), caption = $("xp-caption"), cc = $("xp-cc");
  const icon = (d) => `<g class="o"><path d="${d}"/></g><g class="b"><path d="${d}"/></g>`;
  const PLAY = icon("M12 7l21 13-21 13z"), PAUSE = icon("M10 8h7v24h-7zM23 8h7v24h-7z");
  $("xp-playicon").innerHTML = PLAY;
  const blobUrl = async (u) => { try { const r = await fetch(u); if (!r.ok) throw 0; return URL.createObjectURL(await r.blob()); } catch (e) { return u; } };
  await (document.fonts ? document.fonts.ready : Promise.resolve());

  /* ================= levels: the video, and answers nested inside it ================= */
  const { stage, answer, schedule } = await X.load();
  const mainAudio = new Audio(); mainAudio.preload = "auto";
  mainAudio.src = await blobUrl(X.audio || "audio/mix.m4a");
  const TOTAL = stage.total;
  let mainCues = [];
  try {
    const txt = await (await fetch(X.captions || "captions.srt")).text();
    const ts = (s) => { const [h, m, r] = s.split(":"); const [sec, ms] = r.split(","); return +h * 3600 + +m * 60 + +sec + +ms / 1000; };
    mainCues = txt.trim().split(/\n\s*\n/).map((b) => { const l = b.split("\n"); const [a, z] = l[1].split(" --> "); return { a: ts(a), b: ts(z), t: l.slice(2).join(" ") }; });
  } catch (e) {}
  const MAIN = {
    id: "main", title: X.title, audio: mainAudio, total: TOTAL, pos: 0,
    segs: schedule.scenes.map((s, i, a) => ({ a: i ? s.s : 0, b: i < a.length - 1 ? a[i + 1].s : TOTAL, name: (X.segNames || [])[i] || String(i + 1), line: s.text })),
    render: (t) => { stage.renderAt(t); return stage.canvas; }, cues: mainCues,
  };
  async function answerLevel(clip) {
    const a = new Audio(); a.src = await blobUrl(`${ANS}${clip.id}/answer.m4a`);
    const n = clip.shots.length;
    return {
      id: clip.id, title: clip.title, clip, audio: a, total: clip.total, pos: 0,
      segs: clip.shots.map((s, i) => ({ a: i ? s.s - 0.25 : 0, b: i < n - 1 ? clip.shots[i + 1].s - 0.25 : clip.total, name: s.headline || (i ? s.kind : "Question"), line: s.vo })),
      render: (t) => { answer.render(clip, t); return answer.canvas; }, cues: answer.cues(clip),
    };
  }
  let stack = [MAIN];
  const cur = () => stack[stack.length - 1];
  const now = () => (cur().audio.paused ? cur().pos : cur().audio.currentTime);
  let ccOn = false;
  try { ccOn = localStorage.getItem("xp-cc") === "1"; } catch (e) {}
  cc.setAttribute("aria-pressed", String(ccOn));

  /* ================= timeline ================= */
  let segs = [];
  function buildTimeline() {
    const L = cur(); segsEl.innerHTML = "";
    segs = L.segs.map((c) => {
      const el = document.createElement("div");
      el.className = "xp-seg"; el.style.flex = `${Math.max(0.2, c.b - c.a)} 1 0`;
      el.innerHTML = `<span class="tint"></span><span class="fill"></span><span class="lab">${esc(c.name)}</span>`;
      segsEl.appendChild(el);
      return { el, fill: el.querySelector(".fill"), ...c };
    });
    scrub.setAttribute("aria-valuemax", L.total.toFixed(1));
    fitLabels(); buildMarks();
  }
  const segAt = (t) => { const i = segs.findIndex((c) => t < c.b); return i < 0 ? segs.length - 1 : i; };
  function xAt(t) { const s = segs[segAt(t)]; if (!s) return 0; const r = s.el.getBoundingClientRect(); return r.left - scrub.getBoundingClientRect().left + r.width * clamp((t - s.a) / (s.b - s.a)); }
  function tAt(cx) { for (const s of segs) { const r = s.el.getBoundingClientRect(); if (cx <= r.right + 2) return s.a + (s.b - s.a) * clamp((cx - r.left) / r.width); } return cur().total; }
  function fitLabels() { segs.forEach((s) => { const l = s.el.querySelector(".lab"); s.el.classList.remove("tight"); s.el.classList.toggle("tight", l.scrollWidth > s.el.clientWidth + 1); }); }
  function timeline(t) {
    const i = segAt(t), L = cur();
    segs.forEach((s, j) => { s.fill.style.width = `${clamp((t - s.a) / (s.b - s.a)) * 100}%`; s.el.classList.toggle("on", j === i); s.el.classList.toggle("past", j < i); });
    head.style.left = `${xAt(t)}px`;
    time.innerHTML = `<b>${fmt(t)}</b> / ${fmt(L.total)}`;
    scrub.setAttribute("aria-valuenow", t.toFixed(1)); scrub.setAttribute("aria-valuetext", `${fmt(t)}, ${segs[i]?.name || ""}`);
  }

  /* ================= frames, hover lift ================= */
  let mouse = null, hover = null, shownT = 0;
  // hover hotspots (lift, ring, "click to ask") are off by default; a project can opt in with window.EXPLAINER.hotspots = true
  const hitAt = (x, y) => { if (X.hotspots !== true) return null; const hs = window.__hots || []; for (let i = hs.length - 1; i >= 0; i--) { const h = hs[i]; if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) return h; } return null; };
  function draw(t) {
    const L = cur(); t = clamp(t, 0, L.total); shownT = t;
    const src = L.render(t);
    sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.clearRect(0, 0, 1920, 1080); sctx.drawImage(src, 0, 0);
    hover = mouse ? hitAt(mouse.x, mouse.y) : null;
    if (hover) lift(src, hover);
    timeline(t);
    const cue = ccOn ? L.cues.find((c) => t >= c.a && t <= c.b) : null;
    caption.textContent = cue ? cue.t : "";
    if (L.clip) document.querySelectorAll("#xp-script tr[data-i]").forEach((r) => r.classList.toggle("on", +r.dataset.i === segAt(t)));
    askLabel(); hoverUi();
  }
  function lift(src, h) {
    const pad = 16, x = h.x - pad, y = h.y - pad, w = h.w + pad * 2, hh = h.h + pad * 2, k = 1.05;
    sctx.save(); sctx.shadowColor = "rgba(0,0,0,0.18)"; sctx.shadowBlur = 24; sctx.shadowOffsetY = 8;
    sctx.drawImage(src, x, y, w, hh, x - (w * (k - 1)) / 2, y - (hh * (k - 1)) / 2, w * k, hh * k); sctx.restore();
    const cx = h.x + h.w / 2, cy = h.y + h.h / 2, rx = h.w / 2 + 34, ry = h.h / 2 + 30;
    if (X.ring) X.ring(sctx, cx, cy, rx, ry, performance.now() / 1000);
    else { const css = getComputedStyle(document.documentElement); sctx.strokeStyle = css.getPropertyValue("--xp-accent").trim() || "#d6402a"; sctx.lineWidth = 5; sctx.beginPath(); sctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); sctx.stroke(); }
  }
  const hottip = $("xp-hottip");
  function hoverUi() {
    const playing = !cur().audio.paused;
    screen.dataset.cursor = hover ? "look:click to ask" : playing ? "pause" : "play";
    if (hover && mouse) {
      hottip.innerHTML = `${esc(hover.label)}<small>click to ask about this</small>`;
      const pr = $("xp-player").getBoundingClientRect();
      hottip.style.left = `${clamp(mouse.cx - pr.left + 18, 8, pr.width - Math.min(300, pr.width - 16) - 8)}px`;
      hottip.style.top = `${Math.max(8, Math.min(mouse.cy - pr.top + 22, pr.height - hottip.offsetHeight - 8))}px`;
      hottip.classList.add("on");
    } else hottip.classList.remove("on");
  }
  function toCanvas(e) { const r = screen.getBoundingClientRect(), s = Math.min(r.width / 1920, r.height / 1080); return { x: (e.clientX - r.left - (r.width - 1920 * s) / 2) / s, y: (e.clientY - r.top - (r.height - 1080 * s) / 2) / s, cx: e.clientX, cy: e.clientY }; }
  let redraw = 0;
  const soft = () => { if (redraw || !cur().audio.paused) return; redraw = requestAnimationFrame(() => { redraw = 0; draw(cur().pos); }); };
  // the cursor nudges the picture's second layer out of register (styles read window.__mis)
  let misT = { x: 0, y: 0 }; window.__mis = { x: 0, y: 0 };
  (function ease() { const m = window.__mis; m.x += (misT.x - m.x) * 0.12; m.y += (misT.y - m.y) * 0.12; if (Math.abs(misT.x - m.x) + Math.abs(misT.y - m.y) > 0.01) soft(); requestAnimationFrame(ease); })();
  screen.addEventListener("pointermove", (e) => { if (e.pointerType !== "mouse") return; mouse = toCanvas(e); misT = { x: clamp(mouse.x / 960 - 1, -1, 1), y: clamp(mouse.y / 540 - 1, -1, 1) }; if (cur().audio.paused) soft(); else { hover = hitAt(mouse.x, mouse.y); hoverUi(); } });
  screen.addEventListener("pointerleave", () => { mouse = null; hover = null; misT = { x: 0, y: 0 }; hoverUi(); soft(); });

  /* ================= play, pause, seek ================= */
  function setPlaying(on) { stageEl.classList.toggle("playing", on); $("xp-playicon").innerHTML = on ? PAUSE : PLAY; $("xp-playbtn").setAttribute("aria-label", on ? "Pause" : "Play"); hoverUi(); }
  async function play() { const L = cur(); if (L.audio.ended || L.audio.currentTime >= L.total - 0.05) L.audio.currentTime = 0; stageEl.classList.add("started"); stageEl.classList.remove("ended"); try { await L.audio.play(); } catch (e) { return; } setPlaying(true); requestAnimationFrame(loop); }
  function pause() { const L = cur(); L.audio.pause(); L.pos = L.audio.currentTime; setPlaying(false); draw(L.pos); }
  const toggle = () => (cur().audio.paused ? play() : pause());
  // a scene that throws on one frame must not freeze the picture while the audio runs on
  let loopErr = 0;
  function loop() { const L = cur(); if (L.audio.paused) return; try { draw(L.audio.currentTime); } catch (e) { if (!loopErr++) console.error("explainer frame failed:", e); } requestAnimationFrame(loop); }
  function seekTo(t) { const L = cur(); t = clamp(t, 0, L.total); L.audio.currentTime = t; L.pos = t; stageEl.classList.remove("ended"); draw(t); }
  function onEnded(L) { if (cur() !== L) return; L.pos = L.total; setPlaying(false); draw(L.total); if (stack.length > 1) { stageEl.classList.add("ended"); const P = stack[stack.length - 2]; $("xp-up").textContent = `Back to ${P.title} · ${fmt(P.resume ?? 0)}`; } }
  mainAudio.addEventListener("ended", () => onEnded(MAIN));
  let dragging = false, wasPlaying = false;
  scrub.addEventListener("pointerdown", (e) => { if (e.target.closest(".xp-q")) return; dragging = true; scrub.classList.add("dragging"); wasPlaying = !cur().audio.paused; cur().audio.pause(); scrub.setPointerCapture(e.pointerId); seekTo(tAt(e.clientX)); showTag(tAt(e.clientX)); stageEl.classList.add("started"); });
  scrub.addEventListener("pointermove", (e) => { if (e.target.closest(".xp-q")) return; const t = tAt(e.clientX); showTag(t); if (dragging) seekTo(t); });
  scrub.addEventListener("pointerup", () => { if (!dragging) return; dragging = false; scrub.classList.remove("dragging"); if (wasPlaying) play(); else setPlaying(false); });
  function showTag(t) { if (tag.classList.contains("pin")) return; tag.classList.remove("q"); tag.innerHTML = `<span class="m">${fmt(t)}</span>${esc(segs[segAt(t)]?.name || "")}`; tag.style.left = `${xAt(t)}px`; }
  $("xp-big").addEventListener("click", play);
  $("xp-playbtn").addEventListener("click", toggle);
  screen.addEventListener("click", (e) => { const p = toCanvas(e), h = mouse ? hitAt(p.x, p.y) : null; if (h && h.ask) { if (!cur().audio.paused) pause(); askq.value = h.ask; askq.focus({ preventScroll: true }); askq.select(); return; } toggle(); });
  cc.addEventListener("click", () => { ccOn = !ccOn; cc.setAttribute("aria-pressed", String(ccOn)); try { localStorage.setItem("xp-cc", ccOn ? "1" : "0"); } catch (e) {} draw(now()); });
  $("xp-fs").addEventListener("click", () => { document.fullscreenElement ? document.exitFullscreen() : stageEl.requestFullscreen?.().catch(() => {}); });
  document.addEventListener("fullscreenchange", () => { $("xp-fs").textContent = document.fullscreenElement ? "Exit full screen" : "Full screen"; requestAnimationFrame(() => { fitLabels(); placeMarks(); timeline(shownT); }); });
  window.addEventListener("resize", () => { fitLabels(); placeMarks(); timeline(shownT); sizeStage(); });
  stageEl.addEventListener("keydown", (e) => {
    if (e.target.closest("button")) return;
    if (e.key === " " || e.key === "k") { e.preventDefault(); toggle(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); seekTo(now() + 5); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); seekTo(now() - 5); }
    else if (e.key === "a" || e.key === "?") { e.preventDefault(); if (!cur().audio.paused) pause(); askq.focus({ preventScroll: true }); }
    else if (e.key === "Escape" && stack.length > 1) goTo(stack.length - 2, false);
    else if (e.key === "f") $("xp-fs").click();
    else if (e.key === "c") cc.click();
  });

  /* ================= into an answer, and back out ================= */
  async function enter(clip, replace = false) {
    if (replace && stack.length > 1) { const old = stack.pop(); old.audio.pause(); }
    const P = cur();
    if (!P.audio.paused) { P.audio.pause(); P.pos = P.audio.currentTime; }
    if (!replace) P.resume = P.pos;
    const L = await answerLevel(clip);
    L.audio.addEventListener("ended", () => onEnded(L));
    stack.push(L); afterMove(); draw(0); play();
  }
  function goTo(depth, resume = true) {
    if (depth >= stack.length - 1) return;
    cur().audio.pause();
    while (stack.length - 1 > depth) { const L = stack.pop(); L.audio.pause(); URL.revokeObjectURL(L.audio.src); }
    const L = cur(); L.pos = L.resume ?? L.pos; L.audio.currentTime = L.pos;
    afterMove(); draw(L.pos); if (resume) play(); else setPlaying(false);
  }
  function afterMove() { stageEl.classList.remove("ended"); setPlaying(false); tag.classList.remove("pin", "q"); tag.innerHTML = ""; buildTimeline(); crumbs(); showCard(); showList(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  $("xp-up").addEventListener("click", () => goTo(stack.length - 2, true));
  $("xp-replay").addEventListener("click", () => { seekTo(0); play(); });
  function crumbs() { const c = $("xp-crumbs"); c.innerHTML = stack.map((L, i) => (i === stack.length - 1 ? `<span class="here">${esc(L.title)}</span>` : `<button data-d="${i}">${esc(L.title)}</button><span class="sep">›</span>`)).join(""); c.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => goTo(+b.dataset.d, true))); }

  /* ================= the answer card ================= */
  function showCard() {
    const L = cur(), card = $("xp-card");
    if (!L.clip) { card.hidden = true; return; }
    const c = L.clip; card.hidden = false;
    $("xp-kick").textContent = `You asked at ${fmt(c.at ?? 0)}`;
    $("xp-ctitle").textContent = c.question || c.title;
    $("xp-sum").textContent = c.summary || "";
    const back = $("xp-back");
    back.innerHTML = (stack.length > 2 ? `<button class="xp-btn back up" data-d="${stack.length - 2}">↑ ${esc(stack[stack.length - 2].title)}</button>` : "") + `<button class="xp-btn back" data-d="0">← Back to the video</button>`;
    back.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => goTo(+b.dataset.d, true)));
    $("xp-scriptbtn").setAttribute("aria-expanded", "false"); $("xp-scriptbtn").textContent = "Show the script";
    const sc = $("xp-script"); sc.hidden = true;
    sc.innerHTML = `<table><thead><tr><th>#</th><th>Voiceover</th><th>Visuals</th></tr></thead><tbody>${c.shots.map((s, i) => `<tr data-i="${i}"><td class="n">${i + 1}</td><td class="vo">${esc(s.vo)}</td><td class="vis">${esc(s.visual)}</td></tr>`).join("")}</tbody></table>` +
      (c.sources?.length ? `<ol class="xp-srcs">${c.sources.map((x) => `<li value="${+x.n || 0}"><a href="${esc(/^https?:/.test(x.url) ? x.url : "#")}" target="_blank" rel="noopener">${esc(x.title || x.url)}</a></li>`).join("")}</ol>` : "");
    const nx = $("xp-next");
    nx.innerHTML = c.followups?.length ? `<span class="xp-lab">Ask next</span><div class="xp-row">${c.followups.map((q, i) => `<button class="xp-btn" data-i="${i}">${esc(q)}</button>`).join("")}</div>` : "";
    nx.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { askq.value = c.followups[+b.dataset.i]; ask(); }));
  }
  $("xp-cplay").addEventListener("click", () => { seekTo(0); play(); window.scrollTo({ top: 0, behavior: "smooth" }); });
  $("xp-scriptbtn").addEventListener("click", (e) => { const open = $("xp-script").hidden; $("xp-script").hidden = !open; e.currentTarget.setAttribute("aria-expanded", String(open)); e.currentTarget.textContent = open ? "Hide the script" : "Show the script"; });
  $("xp-regen").addEventListener("click", () => { if (cur().clip) ask({ regenerate: cur().clip.id }); });

  /* ================= questions asked here: dots on the timeline, and a list ================= */
  let asked = [];
  async function loadAsked() { try { asked = await (await fetch(`${ANS}index.json`, { cache: "no-cache" })).json(); } catch (e) { asked = []; } buildMarks(); showList(); }
  const kids = (id) => asked.filter((q) => (q.parent || "main") === id);
  function highlight(id, on) {
    document.querySelectorAll(`.xp-q[data-id="${CSS.escape(id)}"], #xp-list button[data-id="${CSS.escape(id)}"]`).forEach((el) => el.classList.toggle("hl", on));
    const q = asked.find((x) => x.id === id);
    if (on && q) { tag.classList.add("q", "pin"); tag.innerHTML = `<span class="m">${fmt(q.at)}</span>${esc(q.question)}`; tag.style.left = `${xAt(q.at)}px`; } else tag.classList.remove("pin", "q");
  }
  function buildMarks() {
    scrub.querySelectorAll(".xp-q").forEach((m) => m.remove());
    kids(cur().id).forEach((q) => {
      const m = document.createElement("button");
      m.className = "xp-q"; m.textContent = "?"; m.dataset.at = q.at; m.dataset.id = q.id; m.setAttribute("aria-label", `${fmt(q.at)}: ${q.question}`);
      m.addEventListener("pointerenter", () => highlight(q.id, true)); m.addEventListener("focus", () => highlight(q.id, true));
      m.addEventListener("pointerleave", () => highlight(q.id, false)); m.addEventListener("blur", () => highlight(q.id, false));
      m.addEventListener("pointerdown", (e) => e.stopPropagation());
      m.addEventListener("click", (e) => { e.stopPropagation(); highlight(q.id, false); openClip(q.id); });
      scrub.appendChild(m);
    });
    placeMarks();
  }
  function placeMarks() { scrub.querySelectorAll(".xp-q").forEach((m) => { m.style.left = `${xAt(+m.dataset.at)}px`; }); }
  function showList() {
    const k = kids(cur().id), el = $("xp-list"); el.hidden = !k.length;
    el.innerHTML = k.length ? `<span class="xp-lab">${stack.length > 1 ? "Questions asked inside this answer" : "Questions asked about this video"}</span>` + k.slice().sort((a, b) => a.at - b.at).map((q) => `<button data-id="${esc(q.id)}"><span class="t">${fmt(q.at)}</span>${esc(q.question)}</button>`).join("") : "";
    el.querySelectorAll("button").forEach((b) => { b.addEventListener("click", () => { highlight(b.dataset.id, false); openClip(b.dataset.id); }); b.addEventListener("pointerenter", () => highlight(b.dataset.id, true)); b.addEventListener("pointerleave", () => highlight(b.dataset.id, false)); });
  }
  async function openClip(id) { try { await enter(await (await fetch(`${ANS}${id}/clip.json`)).json()); } catch (e) { console.error(e); } }

  /* ================= the ask bar ================= */
  const askq = $("xp-q"), askbtn = $("xp-askbtn"), agent = $("xp-agent"), asum = $("xp-asum"), alog = $("xp-alog");
  function askLabel() { const L = cur(), t = now(), s = segs[segAt(t)]; $("xp-at").textContent = stack.length > 1 ? `at ${fmt(t)} in “${L.title}”` : `at ${fmt(t)} · ${s?.name || ""}`; }
  function context() { const L = cur(), t = now(), i = segAt(t); return { t: +t.toFixed(2), time: fmt(t), parent: L.id === "main" ? null : L.id, scene: i, sceneName: L.segs[i]?.name || "", line: L.segs[i]?.line || "" }; }
  function status(text, mode, extra = "") { agent.className = `xp-agent ${mode || ""}`; if (mode === "idle") agent.open = false; asum.innerHTML = `<span>${esc(text)}</span>${extra}${mode === "idle" ? "" : `<span class="fold">${agent.open ? "hide steps" : "steps"}</span>`}`; requestAnimationFrame(sizeStage); }
  asum.addEventListener("click", (e) => { if (agent.classList.contains("idle")) e.preventDefault(); });
  agent.addEventListener("toggle", () => { const f = asum.querySelector(".fold"); if (f) f.textContent = agent.open ? "hide steps" : "steps"; requestAnimationFrame(sizeStage); });
  const logLine = (text) => { const li = document.createElement("li"); li.textContent = text; alog.appendChild(li); alog.scrollTop = alog.scrollHeight; return li; };
  let busy = false;
  function ready(clip, secs, n, replaces) {
    agent.open = false;
    const done = `${replaces ? "New take ready" : "Answered"} in ${secs} s · ${n} steps`;
    const viewingOld = replaces && cur().id === replaces;
    if (viewingOld || (cur().audio.paused && cur().id === (clip.parent || "main"))) { status(done, ""); enter(clip, viewingOld); return; }
    status(replaces ? "Your new take is ready" : `Your answer is ready (${clip.parent ? "inside an answer" : `at ${fmt(clip.at)}`})`, "ready", ` <button class="go" type="button">▶ Play</button>`);
    asum.querySelector(".go").addEventListener("click", (e) => { e.preventDefault(); status(done, ""); enter(clip); });
  }
  async function ask(opts = {}) {
    const q = opts.regenerate ? (cur().clip?.question || "") : askq.value.trim();
    if (!q) return;
    if (busy) { status("One question at a time: the agent is still on the last one. Keep watching meanwhile.", "busy"); return; }
    if (!cur().audio.paused) pause();
    busy = true; askbtn.disabled = true; $("xp-regen").disabled = true; alog.innerHTML = ""; agent.open = false;
    const ctx = context(), t0 = Date.now();
    status(opts.regenerate ? `New take: “${q}”` : `Asking: “${q}”`, "busy");
    logLine(opts.regenerate ? "Regenerating from the same research" : `Asked at ${ctx.time} · ${ctx.sceneName}${ctx.parent ? ` (inside “${cur().title}”)` : ""}`);
    let line1 = null, n = 0;
    try {
      const res = await fetch(`${API}ask`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(opts.regenerate ? { regenerate: opts.regenerate } : { question: q, context: ctx }) });
      if (!res.ok || !res.body) throw new Error(res.status === 404 || res.status === 405 ? "The ask agent isn't running. Start it with the kit's server (see README)." : `Server said ${res.status}`);
      if (!opts.regenerate) askq.value = "";
      const reader = res.body.getReader(), dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        let cut;
        while ((cut = buf.indexOf("\n\n")) >= 0) {
          const chunk = buf.slice(0, cut); buf = buf.slice(cut + 2);
          const ev = (chunk.match(/^event: (.*)$/m) || [])[1], data = (chunk.match(/^data: (.*)$/m) || [])[1];
          if (!ev || !data) continue;
          const d = JSON.parse(data);
          if (ev === "step") {
            if (d.kind === "found") { if (line1) line1.dataset.n = d.text; continue; }
            if (d.kind === "voice" && /^Voice \d/.test(d.text) && line1 && /^Voice \d/.test(line1.textContent)) { line1.textContent = d.text; status(d.text, "busy"); continue; }
            line1 = logLine(d.text); n++; status(d.text, "busy");
          } else if (ev === "script") logLine(`Script: ${d.shots.length} shots`);
          else if (ev === "done") { await loadAsked(); ready(d.clip, Math.round((Date.now() - t0) / 1000), n, d.replaces); return; }
          else if (ev === "fail") throw new Error(d.message);
        }
      }
      throw new Error("The agent stopped without an answer.");
    } catch (err) { logLine(String(err.message || err)); status(String(err.message || err), "failed"); agent.open = true; }
    finally { busy = false; askbtn.disabled = false; $("xp-regen").disabled = false; }
  }
  $("xp-form").addEventListener("submit", (e) => { e.preventDefault(); ask(); });
  askq.addEventListener("focus", () => { if (!cur().audio.paused) pause(); });
  async function followJobs() {
    let jobs = [];
    try { const r = await fetch(`${API}jobs`, { cache: "no-cache" }); if (r.ok) jobs = await r.json(); } catch (e) { return; }
    if (!Array.isArray(jobs) || !jobs.length || busy) return;
    status(`Still working on “${jobs[0].question}” · ${jobs[0].step}`, "busy");
    const known = new Set(asked.map((q) => q.id));
    const poll = setInterval(async () => {
      let left = []; try { left = await (await fetch(`${API}jobs`, { cache: "no-cache" })).json(); } catch (e) {}
      if (left.length) { status(`Still working on “${left[0].question}” · ${left[0].step}`, "busy"); return; }
      clearInterval(poll); await loadAsked();
      const fresh = asked.filter((q) => !known.has(q.id)).pop();
      if (fresh) { try { ready(await (await fetch(`${ANS}${fresh.id}/clip.json`)).json(), "–", 0); } catch (e) {} }
      else status("Pause anywhere and ask a question.", "idle");
    }, 5000);
  }

  /* ================= stage size: as big as fits the screen; it scrolls with the page =================
     (it used to stick and shrink on scroll, but resizing on scroll moved the page under it and shook) */
  function sizeStage() {
    const narrow = window.innerWidth <= 640, full = stageEl.parentElement.clientWidth;
    const bar = document.querySelector(".xp-askbar"), fixed = getComputedStyle(bar).position === "fixed", askH = fixed ? bar.offsetHeight : 0;
    document.body.style.paddingBottom = fixed ? `${askH + 120}px` : "24px";
    const short = window.innerHeight < 520 && window.innerWidth > window.innerHeight;   // landscape phone: let the video fill the height
    const s0 = narrow ? 1 : short ? clamp(((window.innerHeight - 70) * 16 / 9) / full, 0.45, 1) : clamp(((window.innerHeight - askH - 150 - (X.headerH ?? 90)) * 16 / 9) / full, 0.45, 1);
    $("xp-q").placeholder = narrow ? "Ask a question…" : "Pause anywhere and ask a question…";
    stageEl.style.setProperty("--s", s0.toFixed(4));
  }

  buildTimeline(); crumbs(); sizeStage(); fitLabels();
  await loadAsked();
  requestAnimationFrame(() => { fitLabels(); placeMarks(); });
  const cc0 = ccOn; ccOn = false; draw(X.poster ?? 0); ccOn = cc0; shownT = 0; timeline(0); MAIN.pos = 0; askLabel();
  setTimeout(followJobs, 600);
  window.__explainer = { seekTo, play, pause, enter, ask, get level() { return cur(); } };
})();
