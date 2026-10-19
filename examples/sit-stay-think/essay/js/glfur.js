/* GLFur: draws fuzz.js's hairs with WebGL2 instead of Canvas 2D paths.
   Each hair is a quadratic curve (root, bend, tip). Canvas 2D stroked them as a
   few giant Path2Ds, which took seconds to rasterise. Here every hair is a small
   instanced ribbon that bends along the same curve, drawn on the GPU in one call
   per colour bucket. A stencil pass draws each bucket as a union, the way one
   Canvas 2D stroke() does (overlapping hairs in a bucket don't stack alpha), so
   the felt looks the same. The result is copied into the sprite's 2D canvas.
   If WebGL2 isn't available, fuzz.js keeps using its Path2D route. */
(function (root) {
  "use strict";
  const SEG = 6;                       // segments along each hair's curve
  let gl = null, cv = null, prog = null, uSize, uOff, uW, uColor, corner, inst, vao, failed = false;

  const VS = `#version 300 es
  in vec2 aCorner;                     // x: t along the hair (0..1), y: side (-1 | 1)
  in vec4 aP;                          // root.xy, bend.xy (device px)
  in vec2 aE;                          // tip.xy
  uniform vec2 uSize, uOff; uniform float uW;
  void main() {
    float t = aCorner.x, u = 1.0 - t;
    vec2 p = u * u * aP.xy + 2.0 * u * t * aP.zw + t * t * aE;
    vec2 d = 2.0 * u * (aP.zw - aP.xy) + 2.0 * t * (aE - aP.zw);
    if (dot(d, d) < 1e-8) d = aE - aP.xy + vec2(1e-4, 0.0);
    vec2 tn = normalize(d), n = vec2(-tn.y, tn.x);
    p += tn * (t == 0.0 ? -0.5 : t == 1.0 ? 0.5 : 0.0) * uW;   // round-ish caps: run half a width past each end
    p += n * aCorner.y * 0.5 * uW;
    vec2 c = (p - uOff) / uSize * 2.0 - 1.0;
    gl_Position = vec4(c.x, -c.y, 0.0, 1.0);
  }`;
  const FS = `#version 300 es
  precision mediump float;
  uniform vec4 uColor; out vec4 o;
  void main() { o = uColor; }`;

  function init() {
    if (gl || failed) return !!gl;
    if (/[?&]nogl\b/.test(location.search)) { failed = true; return false; }   // ?nogl: the Canvas 2D route, for comparison
    try {
      cv = document.createElement("canvas");
      gl = cv.getContext("webgl2", { antialias: true, stencil: true, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true });
      if (!gl) throw new Error("no webgl2");
      const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
      prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      uSize = gl.getUniformLocation(prog, "uSize"); uOff = gl.getUniformLocation(prog, "uOff"); uW = gl.getUniformLocation(prog, "uW"); uColor = gl.getUniformLocation(prog, "uColor");
      vao = gl.createVertexArray(); gl.bindVertexArray(vao);
      const strip = [];
      for (let i = 0; i <= SEG; i++) { const t = i / SEG; strip.push(t, -1, t, 1); }
      corner = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, corner); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(strip), gl.STATIC_DRAW);
      const aC = gl.getAttribLocation(prog, "aCorner"); gl.enableVertexAttribArray(aC); gl.vertexAttribPointer(aC, 2, gl.FLOAT, false, 0, 0);
      inst = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, inst);
      const aP = gl.getAttribLocation(prog, "aP"), aE = gl.getAttribLocation(prog, "aE");
      gl.enableVertexAttribArray(aP); gl.vertexAttribPointer(aP, 4, gl.FLOAT, false, 24, 0); gl.vertexAttribDivisor(aP, 1);
      gl.enableVertexAttribArray(aE); gl.vertexAttribPointer(aE, 2, gl.FLOAT, false, 24, 16); gl.vertexAttribDivisor(aE, 1);
      cv.addEventListener("webglcontextlost", (e) => { e.preventDefault(); gl = null; failed = true; });
      return true;
    } catch (e) {
      console.warn("GLFur: falling back to Canvas 2D hair", e);
      gl = null; failed = true; return false;
    }
  }

  // a growable list of hairs for one colour bucket (device-pixel coords)
  function Hairs() { this.a = new Float32Array(6 * 1024); this.n = 0; }
  Hairs.prototype.push = function (x0, y0, mx, my, ex, ey) {
    if ((this.n + 1) * 6 > this.a.length) { const b = new Float32Array(this.a.length * 2); b.set(this.a); this.a = b; }
    const a = this.a, i = this.n * 6; a[i] = x0; a[i + 1] = y0; a[i + 2] = mx; a[i + 3] = my; a[i + 4] = ex; a[i + 5] = ey; this.n++;
  };

  /* drawBatch(g, items): items in paint order, each
       { buckets: [{ hairs: Hairs, rgb: [r,g,b] (0..255), alpha, width (device px) }], box: [x0,y0,x1,y1] (g's device px), under: fn }.
     All items are rendered side by side in one GL pass, then laid onto g in order:
     item.under() (its 2D underfill), then its hairs. Waiting for the GPU happens once per
     batch rather than once per part, which is what keeps it fast. Only each item's box is
     rendered and copied. */
  const MAXH = 8192;
  function drawBatch(g, items) {
    if (!init()) return false;
    const CW = g.canvas.width, CH = g.canvas.height;
    const boxes = items.map((it) => {
      const bx = Math.max(0, Math.floor(it.box[0])), by = Math.max(0, Math.floor(it.box[1]));
      return { bx, by, bw: Math.max(0, Math.min(CW, Math.ceil(it.box[2])) - bx), bh: Math.max(0, Math.min(CH, Math.ceil(it.box[3])) - by) };
    });
    let i = 0;
    while (i < items.length) {
      // pack as many items as fit, stacked vertically in the GL canvas
      let j = i, h = 0, w = 0;
      while (j < items.length && (j === i || h + boxes[j].bh <= MAXH)) { h += boxes[j].bh; w = Math.max(w, boxes[j].bw); j++; }
      if (cv.width < w || cv.height < h) { cv.width = Math.max(cv.width, w, 1); cv.height = Math.max(cv.height, h, 1); }
      gl.disable(gl.SCISSOR_TEST); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(prog); gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, inst);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.STENCIL_TEST); gl.stencilOp(gl.KEEP, gl.KEEP, gl.INCR); gl.stencilFunc(gl.EQUAL, 0, 0xff);
      gl.enable(gl.SCISSOR_TEST); gl.clearStencil(0);
      let y = 0;
      for (let k = i; k < j; k++) {
        const { bx, by, bw, bh } = boxes[k]; boxes[k].gy = y;
        if (bw && bh) {
          gl.viewport(0, y, bw, bh); gl.scissor(0, y, bw, bh);
          gl.uniform2f(uSize, bw, bh); gl.uniform2f(uOff, bx, by);
          for (const b of items[k].buckets) {
            if (!b.hairs.n) continue;
            gl.clear(gl.STENCIL_BUFFER_BIT);          // each bucket is one union, like one stroke()
            gl.bufferData(gl.ARRAY_BUFFER, b.hairs.a.subarray(0, b.hairs.n * 6), gl.STREAM_DRAW);
            gl.uniform1f(uW, b.width);
            const a = b.alpha; gl.uniform4f(uColor, (b.rgb[0] / 255) * a, (b.rgb[1] / 255) * a, (b.rgb[2] / 255) * a, a);
            gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, (SEG + 1) * 2, b.hairs.n);
          }
        }
        y += bh;
      }
      gl.disable(gl.STENCIL_TEST); gl.disable(gl.SCISSOR_TEST);
      // lay them down in order; GL rows count from the bottom of the image
      for (let k = i; k < j; k++) {
        if (items[k].under) items[k].under();
        const { bx, by, bw, bh, gy } = boxes[k];
        if (!bw || !bh) continue;
        g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = "source-over"; g.filter = "none";
        g.drawImage(cv, 0, cv.height - gy - bh, bw, bh, bx, by, bw, bh); g.restore();
      }
      i = j;
    }
    return true;
  }

  root.GLFur = { drawBatch, Hairs, available: () => init() };
})(window);
