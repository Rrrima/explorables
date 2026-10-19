/* Hands for the film, drawn as contour line art (paper-filled so they sit
   in front of whatever they hold). Local frame: the held object runs along
   the y axis through (0, 0); the forearm comes in from -x. */
(function () {
  "use strict";
  const PAPER = "rgba(250,249,245,1)";

  // Catmull-Rom through points (closed or open)
  function curve(cp, per = 8, closed = false) {
    const pts = closed ? [cp[cp.length - 1], ...cp, cp[0], cp[1]] : [cp[0], ...cp, cp[cp.length - 1]];
    const out = [];
    for (let i = 1; i < pts.length - 2; i++) {
      const p0 = pts[i - 1], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2];
      for (let s = 0; s < per; s++) {
        const t = s / per, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
        ]);
      }
    }
    out.push(closed ? out[0] : cp[cp.length - 1]);
    return out;
  }
  function fillPath(g, pts) {
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.closePath();
    const a = g.globalAlpha; g.globalAlpha = g.__alpha == null ? 1 : g.__alpha;
    g.fillStyle = PAPER; g.fill();
    g.globalAlpha = a;
  }
  function begin(g, x, y, o) {
    g.save();
    g.translate(x, y);
    g.rotate(o.rot || 0);
    const s = o.s || 1;
    g.scale(s * (o.flip || 1), s);
    return s;
  }
  // line widths are given in screen units, so divide by the hand scale
  const line = (g, pts, o, s, w, seed) => window.Pen.ink(g, pts, { w: (w || 1.35) / s, seed, boil: o.boil, jit: 0.35 / s, dry: 0.15 });

  /* A fist around a rod running along y. Four finger lobes face +x,
     the thumb folds over the first finger. */
  function grip(g, x, y, o = {}) {
    const s = begin(g, x, y, o), sd = (o.seed || 0) * 10;
    const fist = curve([
      [-95, -15], [-46, -17], [-30, -27], [-10, -30],         // forearm top → back of hand
      [4, -28], [14, -23], [17, -16], [11, -11],              // finger 1 lobe → notch
      [17, -7], [18, 0], [11, 4],                             // finger 2
      [17, 8], [17, 14], [10, 17],                            // finger 3
      [13, 21], [10, 26], [0, 28],                            // little finger
      [-16, 27], [-34, 19], [-48, 15], [-95, 13]              // heel → forearm bottom
    ], 7);
    fillPath(g, fist.concat([[-95, 13], [-95, -15]]));
    line(g, fist, o, s, 1.5, sd + 1);
    // short creases running in from each notch
    [[11, -11], [11, 4], [10, 17]].forEach(([nx, ny], i) => line(g, curve([[nx, ny], [4, ny - 0.5], [-2, ny + 1]], 5), o, s, 1.15, sd + 3 + i));
    // thumb folded over the first finger, with a nail
    const thumb = curve([[-32, -19], [-18, -27], [-2, -28], [8, -24], [9, -18], [0, -15], [-14, -15], [-28, -13]], 6, true);
    fillPath(g, thumb);
    line(g, thumb, o, s, 1.4, sd + 8);
    line(g, curve([[1, -26], [6, -22], [5, -18]], 5), o, s, 1, sd + 9);
    // cuff
    line(g, curve([[-70, -16], [-72, -1], [-70, 14]], 5), o, s, 1.1, sd + 10);
    g.restore();
  }

  /* Fingers pinching a thin handle (a brush), seen from the side:
     index and middle on top, thumb underneath. */
  function pinch(g, x, y, o = {}) {
    const s = begin(g, x, y, o), sd = (o.seed || 0) * 10 + 50;
    const back = curve([[-95, -10], [-52, -14], [-34, -24], [-14, -24], [-2, -16], [2, -8], [-6, 2], [-20, 10], [-40, 14], [-95, 12]], 7);
    fillPath(g, back.concat([[-95, 12]]));
    line(g, back, o, s, 1.35, sd + 1);
    // index finger along the handle, tip just past it
    const index = curve([[-22, -18], [-6, -14], [8, -10], [14, -5], [10, -1], [-4, -2], [-18, -6]], 6);
    fillPath(g, index); line(g, index, o, s, 1.3, sd + 2);
    // middle finger tucked beneath
    const middle = curve([[-20, -4], [-4, 0], [6, 3], [8, 8], [2, 10], [-14, 6]], 6);
    fillPath(g, middle); line(g, middle, o, s, 1.25, sd + 3);
    // thumb from below, pressing up
    const thumb = curve([[-38, 10], [-20, 14], [-6, 12], [2, 6], [-2, 2], [-16, 4], [-30, 4]], 6);
    fillPath(g, thumb); line(g, thumb, o, s, 1.3, sd + 4);
    line(g, curve([[-72, -12], [-74, 0], [-72, 12]], 5), o, s, 1.1, sd + 5);
    g.restore();
  }

  /* An open hand, palm down, fingers together pointing +x (smoothing, pressing). */
  function flat(g, x, y, o = {}) {
    const s = begin(g, x, y, o), sd = (o.seed || 0) * 10 + 90;
    const fingers = [
      [[-6, -20], [20, -21], [38, -19], [42, -15], [38, -12], [18, -12], [-6, -12]],
      [[-6, -12], [24, -12], [44, -10], [48, -6], [44, -2], [22, -3], [-6, -3]],
      [[-6, -3], [22, -3], [42, 0], [46, 4], [42, 7], [20, 6], [-6, 6]],
      [[-6, 6], [16, 6], [32, 9], [35, 13], [31, 15], [14, 14], [-6, 14]]
    ];
    const palm = curve([[-95, -14], [-44, -18], [-20, -22], [-4, -21], [-2, 16], [-22, 20], [-48, 16], [-95, 13]], 7);
    fillPath(g, palm.concat([[-95, 13]]));
    fingers.slice().reverse().forEach((f, i) => { const c = curve(f, 6, true); fillPath(g, c); line(g, c, o, s, 1.25, sd + i); });
    line(g, curve([[-95, -14], [-44, -18], [-20, -22], [-4, -21]], 6), o, s, 1.35, sd + 6);
    line(g, curve([[-4, 15], [-22, 20], [-48, 16], [-95, 13]], 6), o, s, 1.35, sd + 7);
    // thumb, tucked along the side
    const thumb = curve([[-40, 15], [-22, 22], [-6, 24], [2, 21], [-2, 17], [-18, 15]], 6, true);
    fillPath(g, thumb); line(g, thumb, o, s, 1.25, sd + 8);
    line(g, curve([[-72, -16], [-74, -1], [-72, 14]], 5), o, s, 1.1, sd + 9);
    g.restore();
  }

  window.Hands = { grip, pinch, flat };
})();
