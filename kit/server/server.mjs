// Explainer kit · ask agent and static server, for any project folder.
//   ANTHROPIC_API_KEY=... node server.mjs <project-dir> [--port 8794]
// Serves the project at / and the kit at /kit/. POST /api/ask: a viewer pauses,
// asks, and the agent researches, writes a two-column script, voices and mixes a
// short answer clip that the player draws live. { regenerate: id } makes a new take
// of an existing answer from the same research. Progress streams as SSE.
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { clipSchema, KINDS } from "./schema.mjs";
import { voiceShots, mixClip } from "./produce.mjs";
import { loadProject } from "./config.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const KIT = path.resolve(HERE, "..");
const args = process.argv.slice(2);
const projectDir = args.find((a) => !a.startsWith("--")) || process.cwd();
const cfg = loadProject(projectDir);
const PORT = +(args[args.indexOf("--port") + 1] || 0) || +process.env.PORT || cfg.port;
const STORE = path.join(cfg.root, "answers");
const MODEL = "claude-opus-5-5";

// the SDK loads on the first question, so videos play without `npm install`
let client = null;
async function sdk() {
  if (client) return client;
  let Anthropic;
  try { ({ default: Anthropic } = await import("@anthropic-ai/sdk")); }
  catch { throw new Error("Asking questions needs the Anthropic SDK: run `npm install` in kit/server."); }
  client = new Anthropic();                            // reads ANTHROPIC_API_KEY
  return client;
}
// Fallbacks: a declined request is re-run on Anthropic's recommended fallback model.
const BETA = { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" };

async function run(params, onBlock) {
  const messages = [...params.messages];
  for (let turn = 0; turn < 6; turn++) {
    const stream = (await sdk()).beta.messages.stream({ ...params, ...BETA, messages });
    if (onBlock) stream.on("contentBlock", onBlock);
    const msg = await stream.finalMessage();
    if (msg.stop_reason === "pause_turn") { messages.push({ role: "assistant", content: msg.content }); continue; }
    if (msg.stop_reason === "refusal") throw new Error("The model declined this question.");
    return msg;
  }
  throw new Error("Research did not finish.");
}
const textOf = (msg) => msg.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
const shortUrl = (u = "") => { try { const x = new URL(u); return x.hostname.replace(/^www\./, "") + (x.pathname.length > 1 ? x.pathname.slice(0, 30) : ""); } catch { return u; } };
const slug = (s) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 40);
const readClip = async (id) => JSON.parse(await fs.readFile(path.join(STORE, id, "clip.json"), "utf8"));
const about = () => `${cfg.title}${cfg.series ? `, from ${cfg.series}` : ""}`;

async function scriptText() {
  try { return (await fs.readFile(path.join(cfg.root, cfg.script), "utf8")).split("## Audio plan")[0]; } catch { return ""; }
}
// a question asked inside an answer (inside an answer…) carries that chain as context
async function chainOf(parent) {
  const chain = [];
  for (let id = parent, n = 0; id && n < 12; n++) {
    if (!/^[\w-]+$/.test(id)) break;
    let c; try { c = await readClip(id); } catch { break; }
    chain.unshift({ question: c.question, narration: c.shots.map((s) => s.vo).join(" ") });
    id = c.parent;
  }
  return chain;
}
const chainText = (chain) => chain.length ? `\nThe viewer is inside answer clips they asked for earlier, nested like this:\n${chain.map((c, i) => `${"  ".repeat(i)}${i + 1}. Q: "${c.question}" → answer narration: "${c.narration}"`).join("\n")}\nThe new question was asked while watching the last of these.\n` : "";
const where = (c) => `${c.chain.length ? "shot" : "scene"} ${c.scene + 1} ("${c.sceneName}"), at ${c.time}, where the narrator says: "${c.line}"`;

/* ------------------------------------------------------------ 1. research */
async function research(q, c, say) {
  const system = `You are the researcher for a short animated explainer, "${about()}". A viewer paused the video and asked a question about what they were watching. Find a clear, correct answer from reliable sources: the original research first, then official bodies and serious press.

${cfg.context ? `What the explainer is about:\n${cfg.context}\n\n` : ""}Write a compact dossier: the direct answer first, then the facts and numbers that would make a good 30-second animated answer (quantities to compare, dates, proportions, before and after). Put a bracketed source number after every fact, like [2], and end with a numbered SOURCES list of "title — URL". Mark estimates as estimates and disagreements as disagreements. If the question rests on a false premise, say so plainly.`;
  const msg = await run({
    model: MODEL, max_tokens: 16000, thinking: { type: "adaptive" }, output_config: { effort: "medium" }, system,
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 5 }, { type: "web_fetch_20260209", name: "web_fetch", max_uses: 3 }],
    messages: [{ role: "user", content: `The script of the video:\n${c.script}\n${chainText(c.chain)}\nThe viewer paused in ${where(c)}\n\nTheir question: ${q}` }],
  }, (block) => {
    if (block.type === "server_tool_use" && block.name === "web_search") say("search", `Searching “${block.input?.query ?? ""}”`);
    else if (block.type === "server_tool_use" && block.name === "web_fetch") say("fetch", `Reading ${shortUrl(block.input?.url)}`);
    else if (block.type === "web_search_tool_result") say("found", Array.isArray(block.content) ? `${block.content.length} results` : "no results");
  });
  return textOf(msg);
}

/* ------------------------------------------------------------ 2. script */
async function writeScript(q, c, dossier, previous) {
  const props = cfg.props.length ? cfg.props.join(", ") : "none";
  const system = `You write answer clips for an animated explainer, "${about()}". ${cfg.style ? `Its look: ${cfg.style}.` : ""} Shapes and words pop in on the word that names them, TED-Ed pacing. A viewer paused and asked a question; you write a 25–45 second answer as a two-column script, returned as JSON.

Rules:
- 4–7 shots, 70–115 words of narration in total. The first shot restates the question in a few spoken words and uses kind "title". The last shot lands the answer in one line and ties it back to what the viewer was watching.
- "summary" answers the question in one or two plain sentences, for readers who don't play the clip.
- Narration: spoken, plain, short sentences, numbers said the way a person says them. No hype words, no em dashes. Only facts from the dossier.
- "visual" is the right-hand column: one or two sentences on what we see and how it moves. Describe only what the chosen kind draws, never props the kit does not have.
- Each shot uses one kind. Fill only the fields the kind uses; set the rest to "" / 0 / [].
  title: headline = the question (max 8 words).
  bignumber: value = the figure ("$13", "1969", "47.8%"), caption = what it is. Numbers count up.
  compare: items 2–3 drawn as squares with area to scale (label, value, note = printed value).
  bars: items 2–6 as bars to scale (label, value, note).
  timeline: items 3–6 (label = year as text, value = year as number, negative for BCE, note = short event).
  count: a grid of small marks that fills up; value = how many as text (max 300), caption = what one mark stands for.
  proportion: 100 marks, value = how many of 100 are highlighted as text (e.g. "32"), caption = what they are.
  beforeafter: items exactly 2 (label "before"/"after" or two states, value, note = printed value): an arrow from one to the other.
  list: items 2–4 short phrases (label) that stack up.
  versus: items exactly 2, two things side by side (label, note = the tag printed on each).
  quote: headline = a short quotation, caption = who said it and when.
- "prop" is a drawn illustration beside title, list, bignumber and quote shots. Available: ${props}. Pick the one that best shows the idea, or "none".
- Each item also has a "prop": in a "versus" shot, set it to the drawing of that side (both sides must show what is actually being compared, e.g. two specific breeds); elsewhere use "none". Props named like "dog:corgi" or "cat:grey" draw that specific animal: always prefer the specific one over a generic prop when the answer is about a particular breed or kind.
- headline is a short on-screen title for the shot (max 6 words) except for title and quote as above.
- Every item has a "cue": one word copied exactly from that shot's narration; the item appears when it is said. "" spreads items evenly.
- "sources" keeps the dossier's numbers and URLs for the sources you used. "followups": two or three short questions a curious viewer might ask next.${previous ? `\n- This is a NEW TAKE. The viewer asked to regenerate an earlier answer. Answer the same question from a different angle, with different shots and wording. The earlier narration was: "${previous}"` : ""}`;
  const msg = await run({
    model: MODEL, max_tokens: 16000, thinking: { type: "adaptive" },
    output_config: { effort: "high", format: { type: "json_schema", schema: clipSchema(cfg.props) } },
    system, messages: [{ role: "user", content: `Video script:\n${c.script}\n${chainText(c.chain)}\nPaused in ${where(c)}\nQuestion: ${q}\n\n=== DOSSIER ===\n${dossier}` }],
  });
  if (msg.stop_reason === "max_tokens") throw new Error("The script ran out of room.");
  const clip = JSON.parse(textOf(msg));
  clip.shots = clip.shots.filter((s) => s.vo && KINDS.includes(s.kind)).slice(0, 8);
  if (!clip.shots.length) throw new Error("The script came back empty.");
  return clip;
}

/* ------------------------------------------------------------ the endpoint */
const jobs = new Map();
async function index() { try { return JSON.parse(await fs.readFile(path.join(STORE, "index.json"), "utf8")); } catch { return []; } }
async function ask(req, res) {
  let body = "";
  for await (const chunk of req) { body += chunk; if (body.length > 8000) break; }
  let q = "", ctx = {}, regen = null;
  try { const j = JSON.parse(body); q = String(j.question || "").trim().slice(0, 400); ctx = j.context || {}; regen = /^[\w-]+$/.test(j.regenerate || "") ? j.regenerate : null; } catch {}
  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
  const send = (ev, data) => res.write(`event: ${ev}\ndata: ${JSON.stringify(data)}\n\n`);
  const job = { question: q, at: +ctx.t || 0, parent: ctx.parent || null, step: "starting" };
  let last = "";
  const say = (kind, text) => { if (kind !== "found") job.step = text; if (kind !== "found" && text === last) return; if (kind !== "found") last = text; send("step", { kind, text }); };
  const ping = setInterval(() => res.write(": ping\n\n"), 15000), jobId = crypto.randomBytes(4).toString("hex");
  try {
    let old = null, dossier = "";
    if (regen) { old = await readClip(regen); q = old.question; ctx = { t: old.at, time: old.time, parent: old.parent, scene: old.scene, sceneName: old.sceneName, line: old.line }; dossier = await fs.readFile(path.join(STORE, regen, "dossier.md"), "utf8").catch(() => ""); }
    if (!q) { send("fail", { message: "Type a question first." }); return; }
    job.question = q; jobs.set(jobId, job);
    const parent = /^[\w-]+$/.test(ctx.parent || "") ? ctx.parent : null;
    const c = { script: await scriptText(), time: String(ctx.time || "0:00"), scene: +ctx.scene || 0, sceneName: String(ctx.sceneName || "").slice(0, 60), line: String(ctx.line || "").slice(0, 400), chain: await chainOf(parent) };
    if (dossier) say("research", "Reusing the earlier research");
    else { say("research", "Researching the question"); dossier = await research(q, c, say); }
    say("script", regen ? "Writing a new take" : "Writing the two-column script");
    const clip = await writeScript(q, c, dossier, old ? old.shots.map((s) => s.vo).join(" ") : "");
    send("script", { title: clip.title, shots: clip.shots.map((s) => ({ vo: s.vo, visual: s.visual, kind: s.kind })) });
    const id = `${slug(clip.title || q) || "answer"}-${crypto.randomBytes(3).toString("hex")}`, dir = path.join(STORE, id);
    await fs.mkdir(dir, { recursive: true });
    say("voice", "Recording the voiceover");
    const takes = await voiceShots(clip.shots, dir, cfg, (i, n) => say("voice", `Voice ${i + 1} of ${n}`));
    say("mix", "Mixing voice, music and sound");
    const timed = await mixClip(clip, takes, dir, cfg);
    Object.assign(clip, timed, { id, question: q, parent, at: +ctx.t || 0, time: c.time, scene: c.scene, sceneName: c.sceneName, line: c.line, replaces: regen, made: new Date().toISOString() });
    await fs.writeFile(path.join(dir, "clip.json"), JSON.stringify(clip, null, 1));
    await fs.writeFile(path.join(dir, "dossier.md"), dossier);
    // a new take takes the old one's place in the list (the old folder stays on disk)
    let list = await index();
    const entry = { id, title: clip.title, question: q, at: clip.at, parent };
    const k = regen ? list.findIndex((e) => e.id === regen) : -1;
    if (k >= 0) list[k] = entry; else list.push(entry);
    if (regen) list = list.map((e) => (e.parent === regen ? { ...e, parent: id } : e));
    await fs.writeFile(path.join(STORE, "index.json"), JSON.stringify(list, null, 1));
    send("done", { id, clip, replaces: regen });
  } catch (e) {
    console.error(e);
    send("fail", { message: e?.status === 401 ? "The server's API key was rejected." : String(e?.message || e).slice(0, 300) });
  } finally { clearInterval(ping); jobs.delete(jobId); res.end(); }
}

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".m4a": "audio/mp4", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".mp4": "video/mp4", ".srt": "text/plain; charset=utf-8", ".md": "text/markdown; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml" };

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  if (req.method === "POST" && url.pathname === "/api/ask") return ask(req, res);
  if (url.pathname === "/api/jobs") { res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-cache" }); return res.end(JSON.stringify([...jobs.values()])); }
  if (url.pathname === "/api/config") { const { root, ...pub } = cfg; res.writeHead(200, { "Content-Type": "application/json" }); return res.end(JSON.stringify(pub)); }
  // the kit is mounted at /kit/, everything else is the project
  const rel = decodeURIComponent(url.pathname);
  const base = rel.startsWith("/kit/") ? path.join(KIT, "player") : cfg.root;
  let file = path.normalize(path.join(base, rel.startsWith("/kit/") ? rel.slice(5) : rel));
  if (!file.startsWith(base) || file.includes(`${path.sep}node_modules`) || file.includes(`${path.sep}.`)) { res.writeHead(403); return res.end(); }
  try {
    if ((await fs.stat(file)).isDirectory()) file = path.join(file, "index.html");
    const data = await fs.readFile(file);
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(data);
  } catch { res.writeHead(404); res.end("not found"); }
}).on("error", (e) => {
  if (e.code !== "EADDRINUSE") throw e;
  console.error(`Port ${PORT} is already in use, probably by another copy of this server. Open http://localhost:${PORT}/ or stop it: kill $(lsof -ti tcp:${PORT})`);
  process.exit(1);
}).listen(PORT, () => console.log(`${cfg.title} → http://localhost:${PORT}/`));
