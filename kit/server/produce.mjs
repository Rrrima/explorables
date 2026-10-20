// Production for an answer clip: ElevenLabs narration per shot (with word
// timestamps), then one ffmpeg mix of voice, the project's music bed and sound effects.
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { elevenKeys } from "./config.mjs";
const exec = promisify(execFile);

export function toWords(a) {
  const words = []; let cur = null;
  a.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) { if (cur) { words.push(cur); cur = null; } return; }
    if (!cur) cur = { w: "", a: a.character_start_times_seconds[i], b: a.character_end_times_seconds[i] };
    cur.w += ch; cur.b = a.character_end_times_seconds[i];
  });
  if (cur) words.push(cur);
  return words;
}

export async function tts(text, cfg, { previous, next } = {}) {
  const k = elevenKeys(), v = cfg.voice, key = k.key, voice = k.visitor ? k.voice : v.id || k.voice;   // a visitor's key uses a voice their account has
  let res;
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}/with-timestamps?output_format=mp3_44100_128`, {
      method: "POST", headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ text, model_id: v.model, previous_text: previous || undefined, next_text: next || undefined, voice_settings: { stability: v.stability, similarity_boost: v.similarity, style: v.style, speed: v.speed } }),
    });
    if (res.status !== 429) break;
    await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
  }
  if (!res.ok) throw new Error(res.status === 401 ? "Your ElevenLabs key was rejected." : `Voice failed (${res.status}).`);
  const body = await res.json();
  return { audio: Buffer.from(body.audio_base64, "base64"), words: toWords(body.alignment) };
}

// no voice key: a silent take per shot with estimated word timings (~2.6 words/s), so the clip
// still plays in time with its captions, over the music and effects
async function silentTake(text, file) {
  const ws = text.split(/\s+/).filter(Boolean), words = []; let t = 0.1;
  for (const w of ws) { const d = Math.max(0.18, 0.06 * w.replace(/[^\w]/g, "").length + 0.12); words.push({ w, a: +t.toFixed(3), b: +(t + d).toFixed(3) }); t += d + 0.07; }
  const dur = +(t + 0.25).toFixed(2);
  await exec("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", String(dur), "-c:a", "libmp3lame", "-q:a", "9", file]);
  return { file, words, dur };
}

// one take per shot, in sequence; neighbouring text keeps the read flowing
export async function voiceShots(shots, dir, cfg, onProgress) {
  const takes = [];
  if (!elevenKeys({ optional: true })) {
    for (let i = 0; i < shots.length; i++) { onProgress?.(i, shots.length); takes.push(await silentTake(shots[i].vo, path.join(dir, `vo-${i}.mp3`))); }
    return takes;
  }
  for (let i = 0; i < shots.length; i++) {
    onProgress?.(i, shots.length);
    const { audio, words } = await tts(shots[i].vo, cfg, { previous: shots.slice(0, i).map((s) => s.vo).join(" ").slice(-600), next: shots[i + 1]?.vo });
    const file = path.join(dir, `vo-${i}.mp3`);
    await fs.writeFile(file, audio);
    const { stdout } = await exec("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]);
    takes.push({ file, words, dur: +stdout.trim() });
  }
  return takes;
}

export function cueTime(shot, cue) {
  if (!cue) return null;
  const norm = (x) => x.toLowerCase().replace(/[^a-z0-9$%€£]/g, "");
  const c = norm(cue);
  const w = shot.words.find((w) => norm(w.w) === c) || shot.words.find((w) => c && norm(w.w).startsWith(c));
  return w ? w.a : null;
}

const LEAD = 0.7, GAP = 0.55, TAIL = 1.6;

// place the takes on one timeline, then mix with music and effects → answer.m4a
export async function mixClip(clip, takes, dir, cfg) {
  let t = LEAD;
  const shots = clip.shots.map((s, i) => {
    const tk = takes[i];
    const words = tk.words.map((w) => ({ w: w.w, a: +(t + w.a).toFixed(3), b: +(t + w.b).toFixed(3) }));
    const out = { ...s, s: +t.toFixed(3), e: +(t + (tk.words.at(-1)?.b ?? tk.dur)).toFixed(3), words };
    t += tk.dur + GAP;
    return out;
  });
  const total = +(t - GAP + TAIL).toFixed(2);
  const A = (f) => path.join(cfg.root, "audio", f), has = async (f) => !!(await fs.stat(A(f)).catch(() => null));
  const X = cfg.answerSfx, fx = [];
  shots.forEach((s, i) => {
    if (i && X.whoosh) fx.push([X.whoosh, s.s - 0.3, 0.4]);
    if (s.kind === "bignumber" && X.ding) fx.push([X.ding, s.s + 1.2, 0.35]);
    (s.items || []).forEach((it) => { const w = cueTime(s, it.cue); if (w != null && X.pop) fx.push([X.pop, w, 0.35]); });
  });
  if (X.end) fx.push([X.end, total - TAIL + 0.2, 0.4]);
  const evs = [];
  for (const e of fx) if (e[1] >= 0 && e[1] < total && (await has(`sfx-${e[0]}.mp3`))) evs.push(e);
  evs.splice(24);
  const music = (await has("music.mp3")) ? A("music.mp3") : null;
  const inputs = [];
  if (music) inputs.push("-i", music);
  takes.forEach((tk) => inputs.push("-i", tk.file));
  evs.forEach(([n]) => inputs.push("-i", A(`sfx-${n}.mp3`)));
  const m0 = music ? 1 : 0, nV = takes.length, MO = cfg.music.answerOffset ?? 18;
  let f = "";
  takes.forEach((_, i) => { const ms = Math.round(shots[i].s * 1000); f += `[${i + m0}:a]adelay=${ms}|${ms}[v${i}];`; });
  f += `${takes.map((_, i) => `[v${i}]`).join("")}amix=inputs=${nV}:normalize=0:duration=longest,apad=whole_dur=${total}[vo];`;
  evs.forEach(([, at, vol], i) => { const ms = Math.round(at * 1000); f += `[${i + m0 + nV}:a]volume=${vol},adelay=${ms}|${ms}[e${i}];`; });
  if (music) {
    f += `[0:a]atrim=${MO}:${MO + total},asetpts=PTS-STARTPTS,volume=${cfg.music.volume},afade=t=in:st=0:d=0.8,afade=t=out:st=${(total - 2).toFixed(2)}:d=2[mus];`;
    f += `[vo]asplit=2[vo1][vosc];[mus][vosc]sidechaincompress=threshold=0.04:ratio=6:attack=40:release=500[duck];`;
    f += `[vo1][duck]${evs.map((_, i) => `[e${i}]`).join("")}amix=inputs=${evs.length + 2}:normalize=0:duration=first,loudnorm=I=-16:TP=-1.5:LRA=11[out]`;
  } else f += `[vo]${evs.map((_, i) => `[e${i}]`).join("")}amix=inputs=${evs.length + 1}:normalize=0:duration=first,loudnorm=I=-16:TP=-1.5:LRA=11[out]`;
  await exec("ffmpeg", ["-v", "error", "-y", ...inputs, "-filter_complex", f, "-map", "[out]", "-ar", "48000", "-ac", "2", "-t", String(total), "-c:a", "aac", "-b:a", "160k", path.join(dir, "answer.m4a")]);
  await Promise.all(takes.map((tk) => fs.unlink(tk.file).catch(() => {})));
  return { shots, total };
}
