/* Thinking Inside the Box · scenes. One function per narration segment, drawn
   the way the essay draws: a thin grey pen, one blue wash, small people, a
   translucent cube for the machine's thought. Numbers from the essay's data
   and research report (C studies, H history, M mechanisms). */
(function () {
  "use strict";
  const C = window.Wash.C;
  const rnd = (seed) => window.Paper.mulberry32(seed);
  const FIELD = (() => { const r = rnd(77), out = []; for (let i = 0; i < 100; i++) { const a = r() * 6.28, rr = 330 * Math.sqrt(r()); out.push({ a, x: 960 + Math.cos(a) * rr, y: 500 + Math.sin(a) * rr * 0.72, q: 0.55 + r() * 0.35, ph: r() * 6.28 }); } return out; })();
  const IDEAS = [[760, 380], [1160, 360], [1230, 600], [900, 660], [700, 560]];
  const struck = (S, word, x, y, size, k) => { if (k <= 0) return; S.text("ink", word, x, y, { size, a: k }); const w = S.measure(word, size); S.line("ink", [[x - w / 2 - 10, y - size * 0.3], [x + w / 2 + 10, y - size * 0.34]], 3, { a: 0.8 * k, seed: 5, k }); };

  const scenes = [
    // 1 · a thousand students, a third with ChatGPT
    (x) => {
      const { S } = x, tT = x.word("thousand"), tC = x.word("ChatGPT");
      S.ground(860);
      const rows = 3, cols = 10;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const i = r * cols + c, k = x.eOut(x.seg(x.t, tT - 0.3 + i * 0.035, tT + 0.4 + i * 0.035));
        if (k <= 0) continue;
        const px = 300 + c * 150 + (r % 2) * 40, py = 860 - r * 150;
        S.figure("stand", px, py, 0.55, { k, seed: i, noFace: k < 0.8 });
        if (c >= 7) { const ck = x.eOut(x.seg(x.t, tC - 0.2 + (i % 7) * 0.08, tC + 0.6 + (i % 7) * 0.08)); if (ck > 0) S.solid("cube", px, py - 150 * 0.55 - 30, 34 * ck, { yaw: 0.6, pitch: 0.42, a: 0.95, seed: 20 + i }); }
      }
      x.kword("ink", "a thousand students", 960, 180, tT, { size: 84 });
      x.kword("muted", "a third of them with ChatGPT", 960, 240, tC, { size: 34, font: "mono" });
      x.hot(1300, 420, 500, 460, "About 1,000 students in a Turkish high school, randomised by class: textbooks, a plain ChatGPT-style interface, or a hint-only tutor (Bastani et al. 2025, PNAS).", "How was the Turkish maths study designed?");
    },
    // 2 · practice +48%, exam −17%
    (x) => {
      const { S } = x, t48 = x.word("forty"), tE = x.word("exam"), t17 = x.word("seventeen");
      S.ground(840);
      S.figure("stand", 380, 840, 1.0, { seed: 1 });
      S.cubeOnHead(380, 840, 1.0, { k: 1, a: 1, dx: 0, dy: -142 });
      // the practice stacks: baseline, then with the tool
      const TH = 12;
      S.labelAt("baseline", 640, 840 - 10 * TH - 40, { size: 34 });
      S.stack(640, 836, 130, 10, { th: TH, seed: 1, a: 0.45 });
      const k48 = x.eOut(x.seg(x.t, t48 - 0.2, t48 + 1.2));
      S.stack(840, 836, 130, 14.8, { th: TH, seed: 2, k: k48 });
      x.kword("ink", "+48%", 840, 840 - 14.8 * TH - 50, t48, { size: 80 });
      x.kword("muted", "practice, with the tool", 740, 920, t48 - 0.2, { size: 34, font: "mono" });
      // the wall, then the exam
      const kw = x.eOut(x.seg(x.t, tE - 0.3, tE + 0.6));
      if (kw > 0) S.line("ink", [[1120, 840], [1120, 840 - 620 * kw]], 2.4, { a: 0.5, seed: 7, jit: 1.2 });
      const k17 = x.eOut(x.seg(x.t, t17 - 0.2, t17 + 1.2));
      if (kw > 0.5) { S.labelAt("baseline", 1300, 840 - 10 * TH - 40, { size: 34, a: kw }); S.stack(1300, 836, 130, 10, { th: TH, seed: 3, a: 0.45 }); }
      S.stack(1500, 836, 130, 8.3, { th: TH, seed: 4, k: k17 });
      x.kword("ink", "−17%", 1500, 840 - 8.3 * TH - 50, t17, { size: 80 });
      x.kword("muted", "the exam, without it", 1400, 920, tE + 0.2, { size: 34, font: "mono" });
      x.hot(760, 500, 160, 340, "Practice scores rose 48% with plain ChatGPT, 127% with the hint-only tutor.", "Why did practice scores rise so much?");
      x.hot(1420, 560, 160, 280, "On the closed-book exam the plain-ChatGPT students scored 17% lower than students who never had access; the hint-only group was about level.", "Why did the exam scores fall?");
    },
    // 3 · Thamus refuses writing
    (x) => {
      const { S } = x, tK = x.word("king"), tW = x.word("writing"), tF = x.word("forgetfulness");
      S.ground(840);
      const kk = x.eOut(x.seg(x.t, x.s, x.s + 1));
      S.figure("sitUp", 520, 840, 1.1, { seed: 1, k: kk });
      // a small crown: three pen points
      if (kk > 0.9) S.line("ink", [[480, 540], [496, 500], [512, 536], [530, 498], [548, 536], [564, 500], [578, 540]], 2, { seed: 3 });
      const kw = x.eOut(x.seg(x.t, tW - 0.3, tW + 0.9));
      if (kw > 0) {
        S.figure("stand", 1240, 840, 1.0, { seed: 2, dir: -1, k: kw });
        // the scroll, held up: a slab that tints blue on "forgetfulness"
        const kf = x.eOut(x.seg(x.t, tF - 0.2, tF + 1.0));
        S.save(); S.translate(1240, 840 - 150 - 90); S.scaleBy(kw);
        S.wash([[-110, -34], [110, -34], [110, 34], [-110, 34]], C.blue, 0.25 + 0.6 * kf, 9, { bloom: 0.4, pool: 1 });
        S.line("ink", S.ellipse ? [] : [], 1);
        S.line("ink", [[-110, -34], [110, -34]], 2.2, { seed: 11 }); S.line("ink", [[-110, 34], [110, 34]], 2.2, { seed: 12 });
        [-110, 110].forEach((ex, i) => { const pts = []; for (let j = 0; j <= 14; j++) { const a = (j / 14) * 6.28; pts.push([ex + Math.cos(a) * 20, Math.sin(a) * 34]); } S.line("ink", pts, 2, { seed: 13 + i }); });
        S.restore();
      }
      x.kword("muted", "370 BCE · Plato's Phaedrus", 960, 150, tK, { size: 34, font: "mono" });
      x.kword("ink", "“forgetfulness in the learners' souls”", 960, 240, tF, { size: 60 });
      x.hot(1100, 420, 300, 420, "King Thamus to Theuth, inventor of letters: writing 'will create forgetfulness in the learners' souls, because they will not use their memories'. The complaint survives because Plato wrote it down.", "What did Plato say about writing?");
    },
    // 4 · calculators tested and cleared; autopilot tested and confirmed
    (x) => {
      const { S } = x, tC = x.word("calculators"), t79 = x.word("seventy"), tB = x.word("better"), tA = x.word("autopilot"), tG = x.word("agreed");
      S.ground(840);
      const kc = x.eOut(x.seg(x.t, tC - 0.3, tC + 0.7));
      S.figure("stand", 420, 840, 1.0, { seed: 4, k: kc });
      if (kc > 0) { S.save(); S.translate(420, 840 - 150 - 90); S.scaleBy(kc * 2.6); S.wash([[-10, -18], [10, -18], [10, -8], [-10, -8]], C.blue, 0.5, 5, { bloom: 0.3 }); S.line("ink", [[-14, -22], [14, -22], [14, 22], [-14, 22]], 1.1, { close: true }); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) S.dot(-8 + c * 8, -2 + r * 8, 1.3, 0.6); S.restore(); }
      const k79 = x.eOut(x.seg(x.t, t79 - 0.2, t79 + 1.4));
      S.stack(700, 836, 140, 79, { th: 5.2, seed: 6, k: k79, a: 0.6 });
      x.kword("muted", "79 studies", 700, 840 - 79 * 5.2 - 40, t79 + 0.6, { size: 34, font: "mono" });
      const kb = x.eOut(x.seg(x.t, tB - 0.1, tB + 0.6));
      if (kb > 0) { S.line("ink", [[850, 560], [880, 600], [940, 500]], 3.5, { k: kb, seed: 8 }); }
      x.kword("ink", "better by hand", 1000, 440, tB, { size: 56, align: "left" });
      const ka = x.eOut(x.seg(x.t, tA - 0.3, tA + 0.7));
      if (ka > 0) {
        S.figure("stand", 1380, 840, 1.0, { seed: 5, k: ka });
        S.cubeOnHead(1380, 840, 0.72, { k: ka, a: 0.95, dy: -142 * 0.72 });
        S.save(); S.translate(1560, 500); S.scaleBy(ka * 2.4); S.wash([[-30, 2], [-6, -4], [22, -2], [30, 2], [22, 6], [-6, 6]], C.blue, 0.5, 7, { bloom: 0.3, edge: 0.6 }); S.line("ink", [[-30, 2], [-6, -4], [22, -2], [30, 2]], 1.1); S.line("ink", [[-30, 2], [-6, 6], [22, 6], [30, 2]], 1.1); S.line("ink", [[-4, -2], [2, -20], [12, -20]], 0.9, { a: 0.7 }); S.restore();
      }
      x.kword("ink", "skills fade", 1380, 240, tG, { size: 56 });
      x.kword("muted", "the FAA, 2013", 1380, 290, tG + 0.2, { size: 34, font: "mono" });
      x.hot(620, 400, 180, 440, "Hembree & Dessart 1986: 79 studies, 529 effect sizes; calculators used alongside ordinary teaching improved paper-and-pencil skills at every grade except the fourth.", "What did the calculator studies find?");
      x.hot(1250, 380, 400, 460, "FAA Safety Alert 13002 (2013): 'continuous use of autoflight systems could lead to degradation of the pilot's ability to quickly recover the aircraft.'", "What happened with autopilot and pilots' skills?");
    },
    // 5 · fifty-four people
    (x) => {
      const { S } = x, tN = x.word("none"), t54 = x.word("fifty"), tD = x.word("dumber");
      const GX = [420, 960, 1500], GY = 470, names = ["ChatGPT", "search engine", "brain only"], yes = [0, 15, 16];
      const k54 = x.eOut(x.seg(x.t, t54 - 0.2, t54 + 1.2));
      if (k54 > 0) { let n = 0; for (let r = 0; r < 9 && n < 159; r++) for (let c = 0; c < 18 && n < 159; c++, n++) { const kk = x.clamp(k54 * 1.5 - n / 159 * 0.5); if (kk > 0) S.ring(220 + c * 86, 170 + r * 76, 16, 0.2 * kk); } }
      x.kword("muted", "159 people, the sample a power calculation asks for", 960, 920, t54 + 0.3, { size: 34, font: "mono" });
      for (let g = 0; g < 3; g++) {
        for (let i = 0; i < 18; i++) {
          const r = Math.floor(i / 6), c = i % 6, px = GX[g] - 125 + c * 50, py = GY - 50 + r * 56;
          const ka = x.eOut(x.seg(x.t, x.s - 0.2 + i * 0.03 + g * 0.1, x.s + 0.4 + i * 0.03 + g * 0.1));
          if (ka <= 0) continue;
          S.ring(px, py, 16, 0.5 * ka);
          if (i < yes[g]) { const kf = x.eOut(x.seg(x.t, tN + 0.1 + i * 0.05, tN + 0.7 + i * 0.05)); if (kf > 0) S.drop(px, py, 15, 0.9 * kf, g * 20 + i); }
        }
        S.labelAt(names[g], GX[g], GY + 130, { size: 34 });
        x.kword("ink", `${yes[g]} of 18`, GX[g], GY - 110, tN + g * 0.25, { size: 64 });
      }
      x.kword("muted", "could quote their own essay", 960, GY - 160, tN, { size: 34, font: "mono" });
      const kd = x.eOut(x.seg(x.t, tD, tD + 0.5));
      struck(S, "dumber", 960, 1010, 72, kd);
      x.hot(290, 350, 260, 230, "Session one: 0 of 18 ChatGPT writers produced a correct quotation from their own essay minutes after writing it; 15 and 16 of 18 in the other groups. A preprint, not yet peer reviewed.", "What did the MIT brain study actually find?");
    },
    // 6 · the mechanism: re-reading vs testing
    (x) => {
      const { S } = x, t4 = x.word("four"), tT = x.word("tested"), t5 = x.word("five"), tW = x.word("week");
      S.ground(820);
      const LX = 560, RX = 1360, FS = 1.15;
      const kw = x.eInOut(x.seg(x.t, tW - 0.2, tW + 1.6));
      const pr = 40 + (83 - 40) * (1 - kw), pb = 61 + (71 - 61) * (1 - kw);
      S.figure("sitUp", LX, 820, FS, { seed: 1 });
      S.figure("sitUp", RX, 820, FS, { seed: 2 });
      const k4 = x.eInOut(x.seg(x.t, t4 - 0.3, t4 + 1.0));
      const cy = 80 + (820 - 300 * FS - 70 - 80) * k4;
      S.save(); S.mul(pr / 100 * 1.1); S.solid("cube", LX + 10, cy, 110, { yaw: 0.6, pitch: 0.42, a: 0.95, seed: 3 }); S.restore();
      const kt = x.eOut(x.seg(x.t, tT - 0.2, tT + 1.2));
      S.save(); S.mul(pb / 100 * 1.1); S.solid("cube", RX + 10, 820 - 300 * FS - 70, 110, { yaw: 0.6, pitch: 0.42, a: 0.95, seed: 5, k: kt }); S.restore();
      if (kt < 1) for (let i = 0; i < 3; i++) { const pk = x.clamp(1 - kt * 3 + i); if (pk > 0) { S.save(); S.mul(pk); S.solid("tetra", RX + 170 + i * 70, 790, 24, { yaw: 0.3 + i, pitch: -0.5, a: 0.7, seed: 20 + i }); S.restore(); } }
      S.labelAt("reads it four times", LX, 890, { size: 34 });
      S.labelAt("reads once, tested three times", RX, 890, { size: 34 });
      const k5 = x.eOut(x.seg(x.t, t5 - 0.2, t5 + 0.5));
      if (k5 > 0 && kw < 0.5) { S.text("ink", "83%", LX, 200, { size: 96, a: k5 * (1 - kw * 2) }); S.text("ink", "71%", RX, 200, { size: 96, a: k5 * (1 - kw * 2) }); }
      if (kw > 0.5) { S.text("ink", "40%", LX, 200, { size: 96, a: (kw - 0.5) * 2 }); S.text("ink", "61%", RX, 200, { size: 96, a: (kw - 0.5) * 2 }); }
      x.kword("muted", kw > 0.5 ? "a week later" : "five minutes later", 960, 140, t5, { size: 34, font: "mono" });
      x.hot(LX - 130, 300, 260, 480, "Roediger & Karpicke 2006: re-reading four times gave 83% recall at five minutes and 40% a week later; the re-readers were also the most confident.", "Why does re-reading feel better but work worse?");
    },
    // 7 · the mirror
    (x) => {
      const { S } = x, tDev = x.word("developers"), t19 = x.word("nineteen"), t20 = x.word("twenty");
      S.ground(820);
      S.wash([[948, 180], [972, 178], [974, 820], [946, 820]], C.blue, 0.12, 9, { bloom: 0.5, pool: 0.4, grain: 0.3 });
      S.line("ink", [[960, 170], [960, 820]], 2.2, { a: 0.5, seed: 2, jit: 1.4 });
      const LX = 560, RX = 1360, FS = 1.1;
      S.figure("sitUp", LX, 820, FS, { seed: 1 });
      S.figure("sitUp", RX, 820, FS, { seed: 2, dir: -1 });
      const kd = x.eOut(x.seg(x.t, tDev - 0.3, tDev + 0.8));
      const felt = 1 + 0.2 * x.eInOut(x.seg(x.t, t20 - 0.2, t20 + 1.0));
      const meas = 1 - 0.19 * x.eInOut(x.seg(x.t, t19 - 0.2, t19 + 1.0));
      const base = 90 * kd;
      if (kd > 0) {
        S.solid("cube", LX + 10, 820 - 300 * FS - 90, base * felt, { yaw: 0.6, pitch: 0.42, a: 0.95, seed: 3 });
        S.solid("cube", RX - 10, 820 - 300 * FS - 90, base * meas, { yaw: -0.6, pitch: 0.42, a: 0.95, seed: 4 });
      }
      S.labelAt("what she felt", LX, 890, { size: 34 });
      S.labelAt("what the clock measured", RX, 890, { size: 34 });
      x.kword("ink", "19% slower", RX, 170, t19, { size: 72 });
      x.kword("ink", "20% faster", LX, 170, t20, { size: 72 });
      x.kword("muted", "16 developers · 246 real tasks · their own code", 960, 1000, tDev, { size: 34, font: "mono" });
      x.hot(1200, 260, 320, 560, "METR 2025: experienced open-source developers took 19% longer on tasks with AI tools (95% CI +2% to +39%), and afterwards believed they had been 20% faster.", "Why were the developers slower with AI?");
    },
    // 8 · sameness
    (x) => {
      const { S } = x, tB = x.word("better"), tA = x.word("alike");
      const kb = x.eInOut(x.seg(x.t, tB - 0.2, tB + 1.0)), ka = x.eInOut(x.seg(x.t, tA - 0.3, tA + 1.4));
      if (ka > 0) IDEAS.forEach((p, i) => S.solid("cube", p[0], p[1], 30 * ka, { yaw: 0.6 + i, pitch: 0.42, a: 0.9, seed: 60 + i }));
      FIELD.forEach((f, i) => {
        const k0 = x.eOut(x.seg(x.t, x.s - 0.2 + i * 0.012, x.s + 0.3 + i * 0.012)); if (k0 <= 0) return;
        let px = f.x + Math.cos(f.a) * 40 * kb, py = f.y + Math.sin(f.a) * 40 * 0.72 * kb;
        let best = IDEAS[0], bd = Infinity; for (const p of IDEAS) { const d = Math.hypot(p[0] - f.x, p[1] - f.y); if (d < bd) { bd = d; best = p; } }
        px = px + (best[0] - px) * 0.6 * ka; py = py + (best[1] - py) * 0.6 * ka;
        const drift = Math.sin(x.t * 0.7 + f.ph) * 2;
        S.drop(px + drift, py, 13 * k0, (f.q + 0.25 * kb) * k0, i);
      });
      x.kword("ink", "a little better", 400, 180, tB, { size: 60 });
      x.kword("ink", "a lot more alike", 1500, 180, tA, { size: 60 });
      x.kword("muted", "293 writers · 600 readers · eight-sentence stories", 960, 980, x.s + 0.3, { size: 34, font: "mono" });
      x.hot(560, 260, 800, 520, "Doshi & Hauser 2024: with five AI ideas, novelty rose 8% and usefulness 9%, while stories within each AI group grew about a tenth of the similarity range more alike.", "Why does AI make stories more alike?");
    },
    // 9 · hints, not answers
    (x) => {
      const { S } = x, tH = x.word("hints"), t127 = x.word("twenty"), tD = x.word("disappeared");
      S.ground(840);
      const PX = 480, FS = 1.15;
      S.figure("sitUp", PX, 840, FS, { seed: 1 });
      const kh = x.eInOut(x.seg(x.t, tH - 0.2, tH + 1.3));
      const cx0 = 900, cy0 = 700;
      if (kh < 1) { S.save(); S.mul(1 - kh); S.solid("cube", cx0, cy0, 100, { yaw: 0.6, pitch: 0.42, a: 0.95, seed: 3 }); S.restore(); }
      [[0, "tetra"], [1, "cube"], [2, "tetra"], [3, "octa"]].forEach(([n, kind]) => {
        const pk = x.eInOut(x.clamp(kh * 1.6 - n * 0.15)); if (pk <= 0) return;
        const sx = cx0 + (n - 1.5) * 60, sy = cy0 - 40 - n * 12, tx = PX + 230 + [-30, 30, -10, 20][n], ty = 760 + [0, 6, -60, -56][n];
        S.solid(kind, x.lerp(sx, tx, pk), x.lerp(sy, ty, pk) - Math.sin(pk * Math.PI) * 90, 34, { yaw: 0.4 + n, pitch: -0.4, a: 0.9, seed: 10 + n });
      });
      S.labelAt("hints, never answers", PX + 120, 920, { size: 34 });
      const TH = 12;
      S.labelAt("baseline", 1240, 840 - 10 * TH - 40, { size: 34 });
      S.stack(1240, 836, 120, 10, { th: TH, seed: 1, a: 0.45 });
      const k127 = x.eOut(x.seg(x.t, t127 - 0.2, t127 + 1.4));
      S.stack(1420, 836, 120, 22.7, { th: TH, seed: 2, k: k127 });
      x.kword("ink", "+127%", 1420, 840 - 22.7 * TH - 50, t127, { size: 72 });
      x.kword("muted", "practice", 1420, 920, t127, { size: 34, font: "mono" });
      const kd = x.eOut(x.seg(x.t, tD - 0.3, tD + 1.2));
      S.stack(1620, 836, 120, 10, { th: TH, seed: 4, k: kd });
      x.kword("ink", "exam ≈ same", 1620, 840 - 10 * TH - 50, tD, { size: 48 });
      x.hot(1340, 460, 180, 380, "The same model, prompted with teacher-written hints and told not to give answers: practice +127%, and the exam penalty 'largely mitigated' (Bastani et al. 2025).", "How did the hint-only tutor avoid the harm?");
    },
    // 10 · not dumber: the cube lifts off her head
    (x) => {
      const { S } = x, tV = x.word("vanished"), tT = x.word("think");
      S.ground(880, 0.4);
      const PX = 760, PY = 870, FS = 1.35;
      S.figure("sit", PX, PY, FS, { seed: 1 });
      const kv = x.eInOut(x.seg(x.t, tV - 0.2, tV + 1.4));
      // the cube rises, moves to her right and settles on the paper beside her
      const dx = 520 * kv, dy = -120 * Math.sin(kv * Math.PI) + 150 * kv;
      S.cubeOnHead(PX, PY, FS, { dx, dy, a: 1 });
      x.kword("ink", "not dumber", 1400, 240, x.s + 0.2, { size: 84 });
      x.kword("ink", "“if it vanished tomorrow,", 1400, 420, tV, { size: 52 });
      x.kword("ink", "you could still think”", 1400, 490, tT, { size: 52 });
      x.hot(PX - 150, 300, 700, 600, "The essay's answer: not dumber; worse at the thing you let the tool do for you, while you let it, and unable to feel the difference. The harm disappears when the tool hints, explains or argues instead of answering.", "So what is the honest answer?");
    },
  ];

  function endCard(x) {
    const { S } = x;
    S.text("ink", "Thinking Inside the Box", 960, 500, { size: 120 });
    S.text("muted", "an illustrated essay on whether LLMs make us think worse", 960, 570, { size: 36, font: "body" });
    S.solid("cube", 960, 760, 70, { yaw: 0.6 + Math.sin(x.t * 0.3) * 0.05, pitch: 0.42, a: 0.95, seed: 3 });
  }

  window.EXPLAINER = {
    title: "Thinking Inside the Box",
    report: { name: "Sources: the Thinking Inside the Box research report", url: "http://localhost:8907/report.html" },
    segNames: ["A thousand students", "Then the exam", "An old worry", "Tested", "Fifty-four people", "The mechanism", "The mirror", "Sameness", "Hints, not answers", "Not dumber"],
    poster: 5,
    hotspots: true,
    playhead: '<svg width="20" height="20" viewBox="0 0 20 20"><path d="M10 2 L18 6 L18 14 L10 18 L2 14 L2 6 Z"/></svg>',
    ring(ctx, cx, cy, rx, ry, t) {
      const pts = []; for (let i = 0; i <= 64; i++) { const a = -0.6 + (i / 64) * Math.PI * 2.08, w = 1 + 0.03 * Math.sin(i * 0.7); pts.push([cx + Math.cos(a) * rx * w, cy + Math.sin(a) * ry * w]); }
      ctx.save(); ctx.__alpha = 1; ctx.__ink = "rgb(74,74,78)"; window.Pen.ink(ctx, pts, { w: 2.6, jit: 0.8, seed: 7, bleed: false }); ctx.restore();
    },
    async load() {
      const schedule = await (await fetch("schedule.json", { cache: "no-cache" })).json();
      const stage = window.ExplainerStage.Stage({ style: window.makeStyle(document.createElement("canvas")), schedule, scenes, endCard });
      const answer = window.AnswerKit(window.makeStyle(document.createElement("canvas")));
      return { stage, answer, schedule };
    },
  };
})();
