// The style reference beside your screenshot(s), same height (needs ffmpeg).
//   node scripts/compare.mjs out.jpg reference.png shot.png [shot2.png ...]
import { execFileSync } from "node:child_process";
const [out, ...files] = process.argv.slice(2);
if (!out || files.length < 2) { console.error("usage: node scripts/compare.mjs out.jpg reference.png shot.png ..."); process.exit(1); }
const f = files.map((_, i) => `[${i}]scale=-2:720,setsar=1[s${i}]`).join(";") + ";" + files.map((_, i) => `[s${i}]`).join("") + `hstack=${files.length}`;
execFileSync("ffmpeg", ["-loglevel", "error", "-y", ...files.flatMap((x) => ["-i", x]), "-filter_complex", f, "-frames:v", "1", out], { stdio: "inherit" });
console.log(out);
