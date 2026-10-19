// Does the page freeze while it loads? Frame gaps and long tasks over the first 10 s,
// at a retina laptop size by default.   node scripts/stall.mjs <url> [1728x1117]
// Budget: no frame over ~100 ms after the first paint; heavy drawing goes to WebGL (see references/performance.md).
import { openBrowser } from "./browser.mjs";
const [url, size = "1728x1117"] = process.argv.slice(2), [w, h] = size.split("x").map(Number);
if (!url) { console.error("usage: node scripts/stall.mjs <url> [WxH]"); process.exit(1); }
const b = await openBrowser({ width: w, height: h, scale: 2 });
await b.send("Page.addScriptToEvaluateOnNewDocument", { source: `window.__gaps=[];window.__lt=[];let l=0;try{new PerformanceObserver(x=>x.getEntries().forEach(e=>__lt.push(e.duration))).observe({type:"longtask",buffered:true})}catch(e){}(function f(t){if(l)__gaps.push(t-l);l=t;if(t<10000)requestAnimationFrame(f)})(0);` });
await b.goto(url, 10500);
const r = await b.evaluate(`(()=>{let t=0;const long=[];__gaps.forEach(g=>{t+=g;if(g>100)long.push(Math.round(t-g)+"ms:"+Math.round(g))});return{fps:Math.round(__gaps.length/10),worstFrameMs:Math.round(Math.max(...__gaps)),longFrames:long,mainThreadBlockedMs:Math.round(__lt.reduce((a,b)=>a+b,0))}})()`);
console.log(JSON.stringify({ url, size: `${size}@2x`, ...r, errors: b.logs }, null, 1));
await b.close();
