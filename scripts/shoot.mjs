// Screenshot a page while scrolling through it, and report console errors.
//   node shoot.mjs <url> <outdir> [--width 1440] [--height 900] [--mobile] [--steps 8 | --at 0,1200,2400] [--prefix shot] [--full]
// Writes <outdir>/<prefix>-NN.png (one per scroll position) and prints errors.
import fs from "node:fs";
import path from "node:path";
import { openBrowser } from "./browser.mjs";

const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(`--${k}`); return i < 0 ? d : args[i + 1]; };
const [url, outdir] = args;
if (!url || !outdir) { console.error("usage: node shoot.mjs <url> <outdir> [--width 1440] [--mobile] [--steps 8 | --at y1,y2] [--prefix shot]"); process.exit(1); }
const mobile = args.includes("--mobile"), width = +opt("width", mobile ? 390 : 1440), height = +opt("height", mobile ? 844 : 900), prefix = opt("prefix", mobile ? "m" : "d");
fs.mkdirSync(outdir, { recursive: true });
const b = await openBrowser({ width, height, mobile });
try {
  await b.goto(url, 3000);
  const total = await b.evaluate("document.documentElement.scrollHeight");
  const n = +opt("steps", 8), at = opt("at", null)?.split(",").map(Number) ?? Array.from({ length: n }, (_, i) => Math.round((i / Math.max(1, n - 1)) * Math.max(0, total - height)));
  const files = [];
  for (const [i, y] of at.entries()) {
    // scroll in small steps so scroll-driven scenes update the way a reader would see them
    await b.evaluate(`(async()=>{const to=${y};for(let k=0;k<12;k++){scrollTo(0,scrollY+(to-scrollY)/(12-k));await new Promise(r=>setTimeout(r,40));}})()`);
    await b.wait(900);
    files.push(await b.screenshot(path.join(outdir, `${prefix}-${String(i).padStart(2, "0")}.png`), { full: args.includes("--full") }));
  }
  const overflow = await b.evaluate("document.documentElement.scrollWidth > innerWidth + 1");
  console.log(JSON.stringify({ url, width, height: total, shots: files, horizontalOverflow: overflow, errors: b.logs }, null, 1));
} finally { await b.close(); }
