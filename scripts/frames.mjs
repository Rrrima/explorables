// Grab frames from an explainer-kit video (seeks window.__explainer and copies the canvas).
//   node frames.mjs <url> <outdir> [t1 t2 ...]     times in seconds
//   node frames.mjs <url> <outdir> --scenes        one frame at 85% through every scene (from schedule.json)
//   node frames.mjs <url> <outdir> --beats         three frames per scene (25%, 55%, 85%): did it build up, is it readable?
//   node frames.mjs <url> <outdir> --strip a b dt  frames from a to b seconds every dt: is the motion too fast?
// Writes <outdir>/f-<t>.jpg and prints errors.
import fs from "node:fs";
import path from "node:path";
import { openBrowser } from "./browser.mjs";

const [url, outdir, ...rest] = process.argv.slice(2);
if (!url || !outdir) { console.error("usage: node frames.mjs <url> <outdir> [--scenes | t1 t2 ...]"); process.exit(1); }
fs.mkdirSync(outdir, { recursive: true });
let times = rest.filter((a) => !a.startsWith("--")).map(Number);
if (rest.includes("--strip")) { const [a, b, dt] = times; times = []; for (let t = a; t <= b + 1e-6; t += dt) times.push(+t.toFixed(2)); }
else if (rest.includes("--scenes") || rest.includes("--beats") || !times.length) {
  const sch = await (await fetch(new URL("schedule.json", url))).json(), sc = sch.scenes || sch.segments || sch;
  const at = rest.includes("--beats") ? [0.25, 0.55, 0.85] : [0.85];
  times = sc.flatMap((s, i) => { const a = s.start ?? s.s, e = s.end ?? s.e ?? (sc[i + 1]?.start ?? sc[i + 1]?.s ?? a + 6); return at.map((k) => +(a + (e - a) * k).toFixed(2)); });
}
const b = await openBrowser({ width: 1280, height: 860, scale: 1 });
try {
  await b.goto(url, 4500);
  if (!(await b.evaluate("!!window.__explainer"))) throw new Error("window.__explainer missing: the player did not load (see errors)");
  const files = [];
  for (const t of times) {
    const data = await b.evaluate(`(()=>{window.__explainer.seekTo(${t});return document.getElementById("xp-screen").toDataURL("image/jpeg",0.85)})()`);
    const f = path.join(outdir, `f-${t}.jpg`); fs.writeFileSync(f, Buffer.from(data.split(",")[1], "base64")); files.push(f);
  }
  await b.screenshot(path.join(outdir, "page.png"));
  console.log(JSON.stringify({ url, frames: files, errors: b.logs }, null, 1));
} catch (e) { console.log(JSON.stringify({ url, error: String(e.message || e), errors: b.logs }, null, 1)); process.exitCode = 1; }
finally { await b.close(); }
