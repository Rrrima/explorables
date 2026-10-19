// Serve a folder (a scrolly essay) on a port. No dependencies.
//   node scripts/serve.mjs <dir> [port=8000]
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".m4a": "audio/mp4", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".woff2": "font/woff2", ".srt": "text/plain; charset=utf-8", ".md": "text/plain; charset=utf-8" };
export function serve(root, port) {
  root = path.resolve(root);
  return new Promise((resolve, reject) => {
    http.createServer(async (req, res) => {
      let file = path.normalize(path.join(root, decodeURIComponent(new URL(req.url, "http://x").pathname)));
      if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
      try {
        if ((await fs.stat(file)).isDirectory()) file = path.join(file, "index.html");
        res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
        res.end(await fs.readFile(file));
      } catch { res.writeHead(404); res.end("not found"); }
    }).on("error", reject).listen(port, () => resolve(port));
  });
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const [dir = ".", port = "8000"] = process.argv.slice(2);
  await serve(dir, +port);
  console.log(`serving ${path.resolve(dir)} at http://localhost:${port}/`);
}
