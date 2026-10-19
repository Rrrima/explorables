// Explainer kit · build a project's main video soundtrack and timing.
//   node build.mjs <project-dir> [voice|audio|mix|all]   (default: all)
// voice: segments.json → one ElevenLabs take with timestamps → audio/voice.mp3,
//        then schedule.json (scenes with word times, pauses inserted), audio/voice-timed.wav
//        and captions.srt
// audio: music (Stable Audio) and sound effects (ElevenLabs) from explainer.json, skipping files that exist
// mix:   voice + ducked music + cued effects → audio/mix.m4a
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { loadProject, elevenKeys } from "../server/config.mjs";
import { tts } from "../server/produce.mjs";

const [dir = ".", what = "all"] = process.argv.slice(2);
const cfg = loadProject(dir);
const P = (f) => path.join(cfg.root, f);
fs.mkdirSync(P("audio"), { recursive: true });
const sh = (args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: "inherit" });

async function voice() {
  const segs = JSON.parse(fs.readFileSync(P(cfg.segments), "utf8"));
  console.log(`voice: ${segs.length} scenes, ${segs.join(" ").split(/\s+/).length} words`);
  const { audio, words } = await tts(segs.join(" "), cfg);
  fs.writeFileSync(P("audio/voice.mp3"), audio);
  // scene boundaries by word count
  let wi = 0;
  const segments = segs.map((s) => { const n = s.split(/\s+/).length, st = words[wi].a, en = words[wi + n - 1].b; wi += n; return { start: st, end: en, text: s }; });
  // cut midway between scenes, then lay them out with pauses
  const cuts = segments.map((s, i) => [i === 0 ? 0 : (segments[i - 1].end + s.start) / 2, i === segments.length - 1 ? s.end + 0.15 : (s.end + segments[i + 1].start) / 2]);
  let t = cfg.lead; const scenes = [], parts = [];
  segments.forEach((s, i) => {
    const [a, b] = cuts[i], off = t - a;
    scenes.push({ i, s: +(s.start + off).toFixed(3), e: +(s.end + off).toFixed(3), text: s.text, words: words.filter((w) => w.a >= a - 1e-3 && w.b <= b + 1e-3).map((w) => ({ w: w.w, a: +(w.a + off).toFixed(3), b: +(w.b + off).toFixed(3) })) });
    parts.push({ a, b, at: t });
    t += b - a + (cfg.pauses[i] ?? (i === segments.length - 1 ? 0 : 0.45));
  });
  const total = +(t + cfg.tail).toFixed(2);
  fs.writeFileSync(P("schedule.json"), JSON.stringify({ total, scenes }, null, 1));
  const filters = parts.map((p, i) => `[0:a]atrim=${p.a.toFixed(3)}:${p.b.toFixed(3)},asetpts=PTS-STARTPTS,adelay=${Math.round(p.at * 1000)}|${Math.round(p.at * 1000)}[v${i}]`).join(";");
  sh(["-i", P("audio/voice.mp3"), "-filter_complex", `${filters};${parts.map((_, i) => `[v${i}]`).join("")}amix=inputs=${parts.length}:normalize=0,apad=whole_dur=${total}[out]`, "-map", "[out]", "-ar", "48000", "-ac", "2", P("audio/voice-timed.wav")]);
  // captions, about nine words at a time
  const fmt = (x) => { const h = Math.floor(x / 3600), m = Math.floor(x / 60) % 60, s = Math.floor(x) % 60, ms = Math.round((x % 1) * 1000); return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms).padStart(3, "0")}`; };
  let srt = "", n = 1;
  scenes.forEach((s) => { for (let i = 0; i < s.words.length; i += 9) { const g = s.words.slice(i, i + 9); srt += `${n++}\n${fmt(g[0].a)} --> ${fmt(g[g.length - 1].b + 0.2)}\n${g.map((w) => w.w).join(" ")}\n\n`; } });
  fs.writeFileSync(P("captions.srt"), srt);
  console.log(`schedule: ${total}s`); scenes.forEach((s) => console.log(`  ${s.i + 1}  ${s.s}–${s.e}  ${s.text.slice(0, 60)}`));
}

async function audio() {
  const stab = process.env.STABILITY_API_KEY;
  if (!fs.existsSync(P("audio/music.mp3"))) {
    if (!stab) console.log("music: no STABILITY_API_KEY, skipping");
    else {
      const form = new FormData();
      form.append("prompt", cfg.music.prompt); form.append("duration", String(cfg.music.duration)); form.append("output_format", "mp3"); form.append("model", "stable-audio-2.5");
      const r = await fetch("https://api.stability.ai/v2beta/audio/stable-audio-2/text-to-audio", { method: "POST", headers: { Authorization: `Bearer ${stab}`, Accept: "audio/*" }, body: form });
      if (!r.ok) throw new Error(`music ${r.status} ${(await r.text()).slice(0, 300)}`);
      fs.writeFileSync(P("audio/music.mp3"), Buffer.from(await r.arrayBuffer())); console.log("music: ok");
    }
  }
  const { key } = elevenKeys();
  for (const [name, [text, secs]] of Object.entries(cfg.sfx)) {
    if (fs.existsSync(P(`audio/sfx-${name}.mp3`))) continue;
    const r = await fetch("https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128", { method: "POST", headers: { "xi-api-key": key, "Content-Type": "application/json" }, body: JSON.stringify({ text, duration_seconds: secs, prompt_influence: 0.5 }) });
    if (!r.ok) throw new Error(`sfx ${name} ${r.status} ${(await r.text()).slice(0, 200)}`);
    fs.writeFileSync(P(`audio/sfx-${name}.mp3`), Buffer.from(await r.arrayBuffer())); console.log("sfx:", name);
  }
}

function mix() {
  const S = JSON.parse(fs.readFileSync(P("schedule.json"), "utf8")), T = S.total;
  const norm = (x) => x.toLowerCase().replace(/[^a-z0-9$%€£]/g, "");
  // an anchor is seconds after the scene starts, or "word", "word+0.3", "word#2" (second occurrence)
  const at = (si, anchor) => {
    const sc = S.scenes[si]; if (!sc) return null;
    if (typeof anchor === "number") return sc.s + anchor;
    const m = String(anchor).match(/^([^+#-]+)(?:#(\d+))?([+-][\d.]+)?$/); if (!m) return sc.s;
    let k = +(m[2] || 1); const w = sc.words.find((x) => norm(x.w).startsWith(norm(m[1])) && --k === 0);
    return (w ? w.a : sc.s) + (+m[3] || 0);
  };
  const evs = cfg.cues.map(([n, si, a, v]) => [n, at(si, a), v ?? 0.45]).filter(([n, t]) => t != null && t >= 0 && t < T && fs.existsSync(P(`audio/sfx-${n}.mp3`)));
  const music = fs.existsSync(P("audio/music.mp3"));
  const inputs = ["-i", P("audio/voice-timed.wav")];
  if (music) inputs.push("-i", P("audio/music.mp3"));
  evs.forEach(([n]) => inputs.push("-i", P(`audio/sfx-${n}.mp3`)));
  const e0 = music ? 2 : 1, M = cfg.music;
  let f = "";
  if (music) f += `[1:a]atrim=${M.offset}:${M.offset + T},asetpts=PTS-STARTPTS,volume=${M.volume},afade=t=in:st=0:d=1.2,afade=t=out:st=${(T - 3.2).toFixed(2)}:d=3.2[mus];[0:a]asplit=2[vo][vosc];[mus][vosc]sidechaincompress=threshold=0.04:ratio=6:attack=40:release=500[duck];`;
  else f += `[0:a]anull[vo];`;
  evs.forEach(([, t, v], i) => { const ms = Math.round(t * 1000); f += `[${i + e0}:a]volume=${v},adelay=${ms}|${ms}[e${i}];`; });
  f += `[vo]${music ? "[duck]" : ""}${evs.map((_, i) => `[e${i}]`).join("")}amix=inputs=${evs.length + (music ? 2 : 1)}:normalize=0:duration=first,loudnorm=I=-16:TP=-1.5:LRA=11[out]`;
  sh([...inputs, "-filter_complex", f, "-map", "[out]", "-ar", "48000", "-ac", "2", "-t", String(T), "-c:a", "aac", "-b:a", "160k", P("audio/mix.m4a")]);
  console.log(`mix: ${evs.length} effects → audio/mix.m4a`);
}

if (what === "voice" || what === "all") await voice();
if (what === "audio" || what === "all") await audio();
if (what === "mix" || what === "all") mix();
