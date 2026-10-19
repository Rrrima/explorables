// Open every example: a gallery page on :8900, each essay and video on its own port
// (the ports the examples link to each other with). Ctrl+C stops it.
//   node scripts/gallery.mjs
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { serve } from "./serve.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url)), EX = path.resolve(HERE, "../examples");
const list = JSON.parse(fs.readFileSync(path.join(EX, "examples.json"), "utf8"));
const alive = (port) => new Promise((r) => { const q = http.get({ host: "127.0.0.1", port, path: "/", timeout: 600 }, (x) => { x.resume(); r(true); }); q.on("error", () => r(false)); q.on("timeout", () => { q.destroy(); r(false); }); });
const kids = [];
for (const e of list) {
  if (!(await alive(e.essayPort))) await serve(path.join(EX, e.id, "essay"), e.essayPort);
  if (!(await alive(e.videoPort))) kids.push(spawn(process.execPath, [path.join(HERE, "../kit/server/server.mjs"), path.join(EX, e.id, "video"), "--port", String(e.videoPort)], { stdio: "ignore" }));
}
await serve(EX, 8900);
console.log("\n  gallery  http://localhost:8900/\n");
for (const e of list) console.log(`  ${e.title.padEnd(18)} essay http://localhost:${e.essayPort}/   video http://localhost:${e.videoPort}/`);
if (!process.env.ANTHROPIC_API_KEY) console.log("\n  (set ANTHROPIC_API_KEY to ask the videos questions)");
const stop = () => { kids.forEach((k) => k.kill()); process.exit(0); };
process.on("SIGINT", stop); process.on("SIGTERM", stop);
