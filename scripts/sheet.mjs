// Contact sheet of screenshots or frames (needs ffmpeg).
//   node scripts/sheet.mjs out.jpg a.png b.png ...   [--cols 3] [--w 640] [--h 360]
import { execFileSync } from "node:child_process";
const a = process.argv.slice(2), opt = (k, d) => { const i = a.indexOf(`--${k}`); if (i < 0) return d; const v = a[i + 1]; a.splice(i, 2); return v; };
const cols = +opt("cols", 0), W = +opt("w", 640), H = +opt("h", 360);
const [out, ...files] = a;
if (!out || !files.length) { console.error("usage: node scripts/sheet.mjs out.jpg files... [--cols 3] [--w 640] [--h 360]"); process.exit(1); }
const C = cols || (files.length > 4 ? 3 : 2), pad = (C - (files.length % C)) % C;
let f = files.map((_, i) => `[${i}]scale=${W}:${H}:force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:white,setsar=1[s${i}]`).join(";");
for (let i = 0; i < pad; i++) f += `;color=c=white:s=${W}x${H}:d=1[b${i}]`;
const L = [...files.map((_, i) => `[s${i}]`), ...Array.from({ length: pad }, (_, i) => `[b${i}]`)], rows = [];
for (let i = 0; i < L.length; i += C) rows.push(L.slice(i, i + C));
f += ";" + rows.map((r, j) => `${r.join("")}hstack=${C}[r${j}]`).join(";");
f += ";" + (rows.length > 1 ? rows.map((_, j) => `[r${j}]`).join("") + `vstack=${rows.length}` : "[r0]null");
execFileSync("ffmpeg", ["-loglevel", "error", "-y", ...files.flatMap((x) => ["-i", x]), "-filter_complex", f, "-frames:v", "1", out], { stdio: "inherit" });
console.log(out);
