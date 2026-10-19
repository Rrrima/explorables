// Explainer kit · start a new project from the template.
//   node kit/new.mjs ./my-explainer "My Title" [port]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const [dir, title = "Untitled", port = String(8800 + Math.floor(Math.random() * 100))] = process.argv.slice(2);
if (!dir) { console.error('usage: node new.mjs <dir> "Title" [port]'); process.exit(1); }
const T = path.join(path.dirname(fileURLToPath(import.meta.url)), "template"), out = path.resolve(dir);
if (fs.existsSync(out) && fs.readdirSync(out).length) { console.error(`${out} is not empty`); process.exit(1); }
fs.mkdirSync(path.join(out, "audio"), { recursive: true }); fs.mkdirSync(path.join(out, "answers"), { recursive: true });
for (const f of fs.readdirSync(T)) fs.writeFileSync(path.join(out, f), fs.readFileSync(path.join(T, f), "utf8").replaceAll("{{TITLE}}", title).replaceAll("{{PORT}}", port));
console.log(`Created ${out}
Next:
  1. Write segments.json (narration) and SCRIPT.md (two columns); fill explainer.json (context, props, music, sfx, cues).
  2. node ${path.relative(process.cwd(), path.join(path.dirname(T), "pipeline/build.mjs"))} ${dir}          # voice → schedule.json, captions, music, sfx, mix
  3. Draw scenes.js (and give style.js its look).
  4. node ${path.relative(process.cwd(), path.join(path.dirname(T), "server/server.mjs"))} ${dir}          # http://localhost:${port}/`);
