// Run an explainer video (or any kit project) with the ask agent.
//   node scripts/preview.mjs <video-dir> [port]       (ANTHROPIC_API_KEY enables asking questions)
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const [dir, port] = process.argv.slice(2);
if (!dir) { console.error("usage: node scripts/preview.mjs <video-dir> [port]"); process.exit(1); }
spawn(process.execPath, [path.join(HERE, "../kit/server/server.mjs"), path.resolve(dir), ...(port ? ["--port", port] : [])], { stdio: "inherit" });
