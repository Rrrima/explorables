// Loads a project's explainer.json and fills in defaults. Every per-project choice
// (title, voice, music, props the style can draw, what the agent should know about
// the article) lives in that one file, so the server and pipeline stay generic.
import fs from "node:fs";
import path from "node:path";
import { AsyncLocalStorage } from "node:async_hooks";

export function loadProject(dir) {
  const root = path.resolve(dir);
  const file = path.join(root, "explainer.json");
  if (!fs.existsSync(file)) throw new Error(`No explainer.json in ${root}`);
  const c = JSON.parse(fs.readFileSync(file, "utf8"));
  const d = {
    title: "Untitled explainer",
    series: "",                       // e.g. "The Shelf, an illustrated essay on wine"
    style: "",                        // one sentence describing the look, for the script writer
    context: "",                      // what the agent should know: the article's thesis, key numbers, sources
    script: "SCRIPT.md",              // the two-column script; everything before "## Audio plan" is sent as context
    segments: "segments.json",        // narration, one string per scene
    segNames: [],                     // short names for the timeline
    article: null,                    // { name, url } link back to the scrolly article
    props: [],                        // drawn illustrations this project's style can put in answer clips
    voice: { model: "eleven_multilingual_v2", stability: 0.45, similarity: 0.8, style: 0.25, speed: 1.0 },
    pauses: [],                       // seconds of silence after each scene (default 0.45)
    lead: 0.9, tail: 4.2,
    music: { prompt: "light curious explainer background music, no vocals", duration: 90, volume: 0.17, offset: 0 },
    sfx: {},                          // name → [prompt, seconds]
    cues: [],                         // [sfx, scene, anchor, volume]; anchor: seconds after scene start, or "word" / "word+0.3"
    answerSfx: { whoosh: "whoosh", pop: "pop", ding: "ding", end: "end" },
    port: 8794,
  };
  const cfg = Object.assign({}, d, c);
  cfg.voice = Object.assign({}, d.voice, c.voice || {});
  cfg.music = Object.assign({}, d.music, c.music || {});
  cfg.answerSfx = Object.assign({}, d.answerSfx, c.answerSfx || {});
  cfg.root = root;
  cfg.slug = c.slug || path.basename(root);
  return cfg;
}

// Keys a visitor sent with their question (x-anthropic-key / x-elevenlabs-key headers). With
// REQUIRE_USER_KEYS=1 (a public deployment) the server's own keys are never used for questions.
export const reqKeys = new AsyncLocalStorage();
export const REQUIRE_USER_KEYS = process.env.REQUIRE_USER_KEYS === "1";
// a premade ElevenLabs voice every account can use, for visitors' own keys
const PUBLIC_VOICE = process.env.ELEVENLABS_PUBLIC_VOICE || "21m00Tcm4TlvDq8ikWAM";

// ElevenLabs keys: a visitor's key (when they sent one), then the environment, then a .env file:
// ELEVEN_ENV, ./.env, or ~/.config/explorable/.env
export function elevenKeys({ optional = false } = {}) {
  const v = reqKeys.getStore();
  if (v?.eleven) return { key: v.eleven, voice: v.voice || PUBLIC_VOICE, visitor: true };
  if (v && REQUIRE_USER_KEYS) { if (optional) return null; throw new Error("No ElevenLabs key: add one to hear answers narrated."); }
  const files = [process.env.ELEVEN_ENV, path.join(process.cwd(), ".env"), path.join(process.env.HOME || "", ".config/explorable/.env")].filter(Boolean);
  let env = {};
  for (const file of files) {
    try { env = Object.fromEntries(fs.readFileSync(file, "utf8").split("\n").filter((l) => l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; })); if (env.ELEVENLABS_API_KEY) break; } catch {}
  }
  const key = process.env.ELEVENLABS_API_KEY || env.ELEVENLABS_API_KEY, voice = process.env.ELEVENLABS_VOICE_ID || env.ELEVENLABS_VOICE_ID;
  if (!key || !voice) { if (optional) return null; throw new Error("No ElevenLabs key or voice id found (set ELEVENLABS_API_KEY / ELEVENLABS_VOICE_ID)."); }
  return { key, voice };
}
