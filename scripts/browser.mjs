// A throwaway headless Chrome driven over CDP. No dependencies (Node 22+).
//   const b = await openBrowser({ width, height, mobile }); await b.goto(url); ... await b.close();
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import net from "node:net";

const CANDIDATES = [process.env.CHROME, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium", "/usr/bin/google-chrome", "/usr/bin/chromium"].filter(Boolean);
const freePort = () => new Promise((r) => { const s = net.createServer(); s.listen(0, () => { const p = s.address().port; s.close(() => r(p)); }); });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function openBrowser({ width = 1440, height = 900, mobile = false, scale } = {}) {
  const bin = CANDIDATES.find((p) => fs.existsSync(p));
  if (!bin) throw new Error("Chrome not found; set CHROME=/path/to/chrome");
  const port = await freePort(), dir = fs.mkdtempSync(path.join(os.tmpdir(), "qa-chrome-"));
  const proc = spawn(bin, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, "--no-first-run", "--hide-scrollbars", "--autoplay-policy=no-user-gesture-required", "about:blank"], { stdio: "ignore" });
  let list;
  for (let i = 0; i < 60; i++) { try { list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (list.find((t) => t.type === "page")) break; } catch {} await wait(150); }
  const ws = new WebSocket(list.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = {}, logs = [];
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (pending[m.id]) { pending[m.id](m.result ?? { error: m.error }); delete pending[m.id]; }
    else if (m.method === "Runtime.exceptionThrown") logs.push("EXCEPTION " + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).slice(0, 400));
    else if (m.method === "Runtime.consoleAPICalled" && (m.params.type === "error" || m.params.type === "warning")) logs.push(m.params.type.toUpperCase() + " " + JSON.stringify(m.params.args.map((a) => a.value ?? a.description)).slice(0, 300));
    else if (m.method === "Network.loadingFailed" && !m.params.canceled) logs.push("NETWORK " + m.params.errorText);
    else if (m.method === "Network.responseReceived" && m.params.response.status >= 400) logs.push(`HTTP ${m.params.response.status} ${m.params.response.url}`);
  };
  const send = (method, params = {}) => new Promise((r) => { pending[++id] = r; ws.send(JSON.stringify({ id, method, params })); });
  await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable"); await send("Network.setCacheDisabled", { cacheDisabled: true });
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: scale ?? (mobile ? 2 : 1.5), mobile });
  const evaluate = async (expr) => { const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value; };
  return {
    send, evaluate, logs, wait,
    async goto(url, settle = 2500) { await send("Page.navigate", { url }); await wait(settle); },
    async screenshot(file, opts = {}) { const { data } = await send("Page.captureScreenshot", { format: file.endsWith(".jpg") ? "jpeg" : "png", quality: file.endsWith(".jpg") ? 85 : undefined, captureBeyondViewport: !!opts.full, ...(opts.clip ? { clip: { ...opts.clip, scale: 1 } } : {}) }); fs.writeFileSync(file, Buffer.from(data, "base64")); return file; },
    async close() { try { ws.close(); } catch {} proc.kill(); await wait(200); try { fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch {} },
  };
}
