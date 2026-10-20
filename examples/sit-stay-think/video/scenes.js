/* Sit, Stay, Think · scenes. One function per narration segment; x.word("…") is when
   that word is spoken. Drawn with the essay's felt engine (lib/fuzz.js, lib/props.js).
   Every number comes from the essay's data.js / report (tags in comments). */
(function () {
  "use strict";
  const P = Math.PI, V = () => window.VideoKit;
  const E = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
  const ramp = (x, a, d = 0.9) => E(x.seg(x.t, a, a + d));
  const calico = (R) => (x, y) => ((x > R * 0.2 && y < -R * 0.1) || (x < -R * 0.55 && y < -R * 0.35) ? "ginger" : null);
  const tabby = (R) => (x, y) => (Math.sin((x * 0.6 + y) / (R * 0.13)) > 0.5 && Math.abs(x) > R * 0.12 ? "ginger" : null);
  const drift = (x, amp = 4, f = 0.6) => Math.sin(x.t * f) * amp;

  const scenes = [
    // 1 · the ranking (D1)
    (x) => {
      const { S } = x;
      const bx = 960, by = 560, bw = 560, bh = 720;
      const kb = ramp(x, x.s - 0.2, 1.0);
      const rp = (x0, y0, w, h) => { const p = new Path2D(); p.rect(x0, y0 + (1 - kb) * 30, w, h); return p; };
      S.fill("#dcc39c", rp(bx - bw / 2, by - bh / 2, bw, bh), 0.6 * kb);
      S.fill("#fbf8f1", rp(bx - bw / 2 + 28, by - bh / 2 + 48, bw - 56, bh - 76), kb / 0.85);
      S.pom(bx, by - bh / 2 + 8, 22, "dark", kb);
      S.lab("1994", bx, by - bh / 2 + 150, x.t, x.s, { role: "ink", font: "display", size: 96 });
      S.lab("199 judges", bx, by - bh / 2 + 210, x.t, x.word("judges") - 0.3, { size: 32 });
      const rows = [["1", "Border Collie", "Border"], ["…", "", "breeds"], ["79", "Afghan Hound", "Afghan"]];
      rows.forEach(([n, b, w], i) => {
        const y = by + 10 + i * 120, t0 = x.word(w) - 0.3;
        S.lab(n, bx - 210, y, x.t, t0, { role: "ink", size: 44, align: "left" });
        if (b) S.lab(b, bx - 130, y, x.t, t0, { role: "ink", size: 40, align: "left", font: "body", weight: 600 });
      });
      const R = 230, kc = ramp(x, x.word("Border") - 0.4, 1.2), ka = ramp(x, x.word("Afghan") - 0.4, 1.2);
      if (kc > 0) S.put(S.dog({ breed: "collie", R, seed: 5, body: { ang: P * 0.62, len: 2.4, w: 1.8 }, face: { expr: "pant" } }), 330 - (1 - kc) * 360, 460 + drift(x, 5), { a: kc, rot: 0.12 });
      if (ka > 0) S.put(S.dog({ breed: "afghan", R, seed: 9, body: { ang: P * 0.45, len: 2.2, w: 1.8 } }), 1600 + (1 - ka) * 360, 480 - drift(x, 4), { a: ka, rot: -0.08 });
      if (kc > 0.9) S.sparkle(540, 230, 18);
      x.hot(220, 250, 380, 520, "The Border Collie ranked first: 190 of 199 judges put it in their top ten.", "Why did judges rank the Border Collie first?");
      x.hot(1340, 290, 380, 520, "The Afghan Hound ranked last, at 79.", "Is the Afghan Hound really the least intelligent dog?");
    },
    // 2 · Clever Hans (H6)
    (x) => {
      const { S } = x;
      const k = ramp(x, x.s - 0.2, 1.0), nod = Math.sin(x.t * 3.2) * 0.04 * ramp(x, x.word("count") - 0.6, 0.6);
      S.put(V().horse(380), 720, 470 + (1 - k) * 30, { a: k, rot: nod });
      ["1", "2", "3"].forEach((n, i) => {
        const t0 = x.word("seemed") + i * 0.5, kk = ramp(x, t0, 0.5);
        if (kk > 0) { S.pom(200 + i * 100, 930, 30, "ginger", kk); S.text("muted", n, 200 + i * 100, 1000, { size: 30, font: "mono", a: kk }); }
      });
      const kp = ramp(x, x.word("reading") - 0.5, 1.0), pn = Math.sin(x.t * 5) * 0.035 * ramp(x, x.word("nods") - 0.5, 0.4);
      if (kp > 0) S.put(V().person(210, false), 1420, 380, { a: kp, rot: pn });
      if (kp > 0.5) for (const [dx, dy] of [[-150, -150], [150, -150]]) S.hair(S.bow(1420 + dx * 1.4, 380 + dy * 1.3, 1420 + dx * 1.6, 380 + dy * 1.05, 8, 6), { w: 2, a: 0.6 * kp, taper: false });
      S.lab("right 89% of the time when he could see his questioner", 1420, 900, x.t, x.word("nods") - 0.6, { size: 26 });
      S.lab("6% when he couldn't", 1420, 950, x.t, x.word("nods") - 0.3, { size: 30, role: "ink" });
      x.hot(450, 220, 520, 600, "Clever Hans, Berlin, 1904: he read tiny head movements of the person asking.", "How did Clever Hans fool people?");
    },
    // 3 · trainability (D2)
    (x) => {
      const { S } = x;
      S.lab("trainability", 960, 170, x.t, x.word("trainability") - 0.4, { role: "ink", font: "display", size: 84, dur: 0.7 });
      const k = ramp(x, x.s - 0.2, 1.0), R = 175;
      S.put(S.dog({ breed: "collie", R, seed: 5 }), 520, 420 + drift(x, 3), { a: k });
      S.put(S.dog({ breed: "afghan", R, seed: 9 }), 1400, 400 - drift(x, 3), { a: k });
      const t5 = x.word("five") - 0.4;
      for (let i = 0; i < 4; i++) { const kk = ramp(x, t5 + i * 0.12, 0.5); if (kk > 0) S.pom(400 + i * 80, 870, 30, "ginger", kk); }
      S.lab("under 5 tries", 520, 985, x.t, t5 + 0.3, { size: 30, role: "ink" });
      const tb = x.word("bottom") - 0.2;
      for (let i = 0; i < 100; i++) { const kk = ramp(x, tb + i * 0.012, 0.45); if (kk > 0) S.pom(1160 + (i % 20) * 24 + 12, 815 + Math.floor(i / 20) * 24 + 12 + (1 - kk) * 20, 11, "ginger", kk, 3 + (i % 3)); }
      S.lab("80 to 100+ tries", 1400, 985, x.t, x.word("hundred") - 0.4, { size: 30, role: "ink" });
      x.hot(1200, 700, 420, 120, "Coren's bottom tier: 80 to 100 or more repetitions before a command is reliable.", "How did Coren define his tiers?");
    },
    // 4 · one skill at a time (D23, D25)
    (x) => {
      const { S } = x;
      const fy = 920, R = 150, k = ramp(x, x.s - 0.2, 0.9);
      S.line("ink", [[260, fy], [1660, fy]], 1.6, { a: 0.35 * k });
      const tp = x.word("pointing"), tt = x.word("tube");
      const cupA = 1 - ramp(x, tt - 0.6, 0.6);
      const cupL = 560, cupR = 1360, cr = 95;
      if (cupA > 0) {
        S.pom(cupL + 52, fy - 22, 26, "ginger", cupA * k);
        S.put(V().cup(cr), cupL, fy - cr * 0.45, { a: cupA * k }); S.put(V().cup(cr), cupR, fy - cr * 0.45, { a: cupA * k });
        const hp = ramp(x, tp - 0.6, 1.0), hs = V().hand(210), hx = 2000 - hp * 560, hy = 330;
        const ang = Math.atan2(fy - cr - hy, cupL - hx);
        if (hp > 0) S.raw(cupA, (g) => { g.save(); g.translate(hx, hy); g.rotate(ang - P); g.drawImage(hs.c, -hs.ox, -hs.oy, hs.w, hs.h); g.restore(); });
      }
      const go1 = ramp(x, x.word("finger") - 0.1, 1.0), go2 = ramp(x, tt + 0.1, 1.1);
      let dx = 960 + (cupL + 230 - 960) * go1; dx += (930 - (cupL + 230)) * go2;
      const kt = ramp(x, tt - 0.5, 0.8);
      if (kt > 0) { S.raw(kt, (g) => V().tube(g, 1100, 1640, fy - 66, 62, 1)); S.pom(1370, fy - 56, 26, "ginger", kt); }
      S.put(S.dog({ breed: "mutt", R, seed: 88, sit: true, liveFace: true }), dx, fy - R * 2.45, { a: k, face: { look: go2 > 0 ? 1.6 * go2 : -1.6 * ramp(x, tp - 0.3, 0.5) } });
      S.lab("follows the point", 760, 1000, x.t, x.word("finger") + 0.2, { size: 28, role: "ink", a: cupA });
      S.lab("goes round to the open end", 1370, 1000, x.t, tt + 0.4, { size: 28, role: "ink" });
      x.hot(1080, 820, 580, 160, "The cylinder test: a treat in a clear tube open at both ends. It measures self-control.", "What does the cylinder test measure?");
    },
    // 5 · no single IQ (D11)
    (x) => {
      const { S } = x;
      const items = [["self-control", "0.70", 0.70, "self", "ginger"], ["reading people", "0.39", 0.39, "reading", "orange"], ["memory", "0.17", 0.17, "memory", "grey"]];
      items.forEach(([name, v, h2, w, ck], i) => {
        const cx = 440 + i * 520, t0 = x.word(w) - 0.4, kk = ramp(x, t0, 1.1), r = 290 * Math.sqrt(h2 / 0.7) * (0.25 + 0.75 * kk);
        if (kk <= 0) return;
        S.raw(kk, (g) => V().yarnBall(g, cx, 780 - r, r, ck, 3 + i));
        S.lab(v, cx, 900, x.t, t0 + 0.3, { role: "ink", font: "display", size: 84 });
        S.lab(name, cx, 952, x.t, t0 + 0.2, { size: 32 });
      });
      S.lab("how much breeds differ, skill by skill", 960, 1030, x.t, x.word("memory") + 0.2, { size: 24 });
      S.lab("no single dog IQ", 960, 150, x.t, x.word("single") - 0.6, { role: "ink", font: "display", size: 80, dur: 0.7 });
      x.hot(150, 200, 580, 600, "Among-breed heritability of self-control: 0.70 in 1,508 dogs of 36 breeds (0.50 after allowing for body size).", "Why do breeds differ so much in self-control?");
    },
    // 6 · nine percent (D7)
    (x) => {
      const { S } = x;
      const gx = 170, gy = 120, r = 34, gap = 85, t9 = x.word("nine");
      for (let i = 0; i < 100; i++) {
        const kk = ramp(x, x.s - 0.2 + i * 0.012, 0.5);
        if (kk <= 0) continue;
        const on = i < 9 && x.t > t9 - 0.4 + i * 0.07;
        S.pom(gx + (i % 10) * gap + r, gy + Math.floor(i / 10) * gap + r + (1 - kk) * 16, r, on ? "dark" : "cream", kk, 20 + (i % 5));
      }
      S.lab("9%", 1440, 600, x.t, t9 - 0.4, { role: "ink", font: "display", size: 320, dur: 0.8 });
      S.lab("of one dog's behaviour", 1440, 690, x.t, t9 - 0.1, { size: 34, role: "ink" });
      S.lab("is explained by its breed", 1440, 736, x.t, t9 - 0.1, { size: 34, role: "ink" });
      S.lab("18,385 dogs · 2022", 1440, 800, x.t, x.word("eighteen") - 0.3, { size: 26 });
      x.hot(160, 110, 860, 860, "Breed explains about 9% of an individual dog's behaviour (3–25% depending on the trait).", "If breed explains only 9%, what explains the rest?");
    },
    // 7 · reading faces (E15, E9)
    (x) => {
      const { S } = x;
      const R = 225, y = 430, k = ramp(x, x.s - 0.2, 1.0), brow = ramp(x, x.word("eyebrow") - 0.8, 1.0);
      S.put(S.dog({ breed: "mutt", R, seed: 401, liveFace: true }), 620, y, { a: k, face: { brow }, rot: -0.05 * brow });
      S.put(S.dog({ breed: "wolf", R, seed: 402, liveFace: true }), 1300, y, { a: k, face: { brow: 0 } });
      S.lab("dog", 620, y + R * 1.45, x.t, x.s, { size: 28, role: "ink" });
      S.lab("wolf", 1300, y + R * 1.45, x.t, x.s, { size: 28, role: "ink" });
      const km = ramp(x, x.word("muscle") - 0.2, 1.0);
      if (km > 0) for (const sx of [-1, 1]) S.yarn(S.bow(620 + sx * R * 0.2, y - R * 0.32, 620 + sx * R * 0.32, y - R * 0.82, sx * R * 0.05, 10), { coat: window.Fuzz.coat("pink"), w: 8, k: km, seed: 3 + sx });
      S.lab("a muscle to lift the inner brow", 620, y - R * 1.5, x.t, x.word("lifts") - 0.4, { size: 26, role: "ink" });
      S.lab("only scant fibres", 1300, y - R * 1.5, x.t, x.word("eyebrow") - 0.2, { size: 26 });
      const tf = x.word("Fifteen") - 0.4;
      for (let i = 0; i < 18; i++) {
        const kk = ramp(x, tf + i * 0.06, 0.6), went = i < 15;
        if (kk <= 0) continue;
        S.put(S.dog({ breed: ["mutt", "golden", "beagle", "collie"][i % 4], R: 30, seed: 500 + (i % 4) }), 265 + i * 82, 935 + (1 - kk) * 16, { a: kk * (went ? 1 : 0.35) });
      }
      S.lab("15 of 18 went to a crying person", 960, 1035, x.t, x.word("eighteen") - 0.2, { size: 28, role: "ink" });
      x.hot(420, 200, 400, 420, "LAOM, the inner-brow muscle: present in dogs, only scant fibres in wolves (6 dogs, 4 wolves dissected).", "Did humans breed dogs for puppy eyes?");
    },
    // 8 · cats walk away (C1)
    (x) => {
      const { S } = x;
      const ta = x.word("away"), tb = x.word("box");
      const kRow = ramp(x, x.s - 0.2, 0.9) * (1 - ramp(x, tb - 0.6, 0.6));
      if (kRow > 0) for (let i = 0; i < 6; i++) {
        const leave = i === 1 || i === 4, go = leave ? ramp(x, ta - 0.4, 1.0) : 0, ck = ["cream", "grey", "orange", "dark", "white", "grey"][i];
        S.put(S.cat({ coat: ck, R: 115, seed: 700 + i, face: ck === "dark" ? { yellow: true } : {} }), 260 + i * 280 + go * 900, 520, { a: kRow * (1 - go * 0.8), flip: go > 0.05 });
      }
      const k2 = ramp(x, tb - 0.4, 0.9);
      if (k2 > 0) {
        const fy = 820, R = 135;
        S.line("ink", [[200, fy], [1720, fy]], 1.6, { a: 0.35 * k2 });
        S.raw(k2, (g) => { V().jar(g, 800, fy, 78, 1); V().jar(g, 1170, fy, 78, 1); });
        const turn = ramp(x, x.word("look") - 0.3, 0.8);
        S.put(S.dog({ breed: "golden", R, seed: 711, sit: true, liveFace: true }), 590, fy - R * 2.45, { a: k2, rot: -0.15 * turn, face: { look: -1.8 * turn, brow: 0.6 * turn } });
        S.put(V().person(150, false), 200, fy - 520, { a: k2 * turn });
        const cR = 125, paw = Math.sin(x.t * 6) * 0.5 + 0.5;
        S.put(S.cat({ coat: "cream", R: cR, seed: 712, sit: true, liveFace: true, patches: calico(cR) }), 1390, fy - cR * 2.45, { a: k2, face: { look: -1.4 } });
        S.pom(1265 - paw * 30, fy - 60 - paw * 50, 24, "cream", k2);
        const td = x.word("dogs") - 0.2, tc = x.word("cats", 1) - 0.2;
        for (let i = 0; i < 14; i++) { const kk = ramp(x, td + i * 0.05, 0.5); if (kk > 0) S.pom(370 + i * 36, 905, 14, i < 12 ? "ginger" : "cream", kk); }
        for (let i = 0; i < 14; i++) { const kk = ramp(x, tc + i * 0.05, 0.5); if (kk > 0) S.pom(1140 + i * 36, 905, 14, i < 6 ? "ginger" : "cream", kk); }
        S.lab("12 of 14 dogs looked back", 610, 975, x.t, td + 0.2, { size: 26, role: "ink" });
        S.lab("6 of 14 cats did", 1380, 975, x.t, tc + 0.2, { size: 26, role: "ink" });
      }
      x.hot(1100, 560, 420, 280, "The unsolvable task: food in a box that can't be opened. Cats kept trying for longer and looked at people less.", "Does that make cats less socially intelligent?");
    },
    // 9 · cats read us (C2, C7, C15)
    (x) => {
      const { S } = x;
      const k = ramp(x, x.s - 0.2, 0.9), R = 150;
      S.put(S.cat({ coat: "orange", R, seed: 721, sit: true, patches: tabby(R) }), 360, 340 + drift(x, 3), { a: k });
      const kn = ramp(x, x.word("names") - 0.5, 0.8);
      if (kn > 0) for (let i = 0; i < 3; i++) S.hair(S.bow(360 + R * 1.0 + i * 22, 200 - i * 12, 360 + R * 1.0 + i * 22, 290 + i * 12, -16 - i * 5, 8), { w: 2, a: 0.6 * kn, taper: false });
      S.lab("knows its name", 360, 790, x.t, x.word("names") - 0.3, { size: 28, role: "ink" });
      const tk = x.word("kittens") - 0.5;
      for (let i = 0; i < 70; i++) { const kk = ramp(x, tk + i * 0.012, 0.5); if (kk > 0) S.pom(820 + (i % 10) * 56 + 22, 130 + Math.floor(i / 10) * 56 + 22, 22, i < 45 ? "pink" : "cream", kk, 30 + (i % 4)); }
      S.lab("64% of kittens securely attached", 1100, 560, x.t, x.word("securely") - 0.3, { size: 28, role: "ink" });
      S.lab("human babies: about 65%", 1100, 605, x.t, x.word("babies") - 0.3, { size: 26 });
      const tb = x.word("breeds") - 0.6;
      const CB = [["grey", null], ["orange", (px, py) => (Math.sin(px / 9) * Math.sin(py / 9) > 0.55 ? "choc" : null)], ["grey", null], ["grey", null], ["white", (px, py) => (py < -24 && Math.abs(px) > 7 ? "ginger" : null)]];
      CB.forEach(([ck, pt], i) => { const kk = ramp(x, tb + i * 0.1, 0.7); if (kk > 0) S.put(S.cat({ coat: ck, R: 68, seed: 601 + i, patches: pt || undefined }), 880 + i * 160, 800, { a: kk }); });
      S.lab("?", 1700, 830, x.t, x.word("intelligence") - 0.4, { role: "accent", font: "display", size: 110 });
      S.lab("no intelligence ranking for cat breeds", 1200, 950, x.t, x.word("intelligence") - 0.3, { size: 26 });
      x.hot(800, 110, 600, 420, "Secure base test: 64.3% of 70 kittens and 65.8% of 38 adult cats were securely attached.", "How do you test whether a cat is attached to you?");
    },
    // 10 · which is smarter?
    (x) => {
      const { S } = x;
      const k = ramp(x, x.s - 0.2, 1.0), brow = ramp(x, x.word("skill") - 0.4, 0.9), look = Math.sin(x.t * 0.8) * 0.4;
      S.put(S.dog({ breed: "mutt", R: 195, seed: 61, sit: true, liveFace: true }), 680, 390, { a: k, rot: 0.1, face: { look: 1.5 + look, brow: 0.3 + 0.4 * brow } });
      S.put(S.cat({ coat: "cream", R: 170, seed: 62, sit: true, liveFace: true, patches: calico(170) }), 1260, 420, { a: k, rot: -0.12, face: { look: -1.5 - look } });
      S.lab("Which skill? Which animal?", 960, 140, x.t, x.word("Ask") - 0.3, { role: "ink", font: "display", size: 72, dur: 0.7 });
      x.hot(520, 250, 900, 700, "There's no single IQ for dogs or cats: each test measures one skill.", "So which is smarter, dogs or cats?");
    },
  ];

  function endCard(x) {
    const { S } = x;
    S.text("ink", "Sit, Stay, Think", 960, 500, { size: 150 });
    S.text("muted", "how we measure dog and cat minds", 960, 580, { size: 40, font: "body" });
    S.sparkle(1420, 380, 20);
  }

  window.EXPLAINER = {
    title: "Sit, Stay, Think",
    report: { name: "Sources: the Sit, Stay, Think research report", url: "http://localhost:8903/report.html" },
    segNames: ["The ranking", "Clever Hans", "Trainability", "One skill at a time", "No single IQ", "Nine percent", "Reading faces", "Cats walk away", "Cats read us", "Which is smarter?"],
    poster: 6,
    playhead: '<svg width="20" height="20" viewBox="0 0 26 26"><g fill="currentColor"><ellipse cx="13" cy="16.5" rx="5.6" ry="4.6"/><ellipse cx="6.2" cy="10.2" rx="2.1" ry="2.7"/><ellipse cx="10.6" cy="6.6" rx="2.1" ry="2.8"/><ellipse cx="15.6" cy="6.6" rx="2.1" ry="2.8"/><ellipse cx="19.9" cy="10.2" rx="2.1" ry="2.7"/></g></svg>',
    ring(ctx, cx, cy, rx, ry, t) {
      // a strand of wool looped once round, a little past
      const pts = []; for (let i = 0; i <= 64; i++) { const a = -0.6 + (i / 64) * Math.PI * 2.08, w = 1 + 0.03 * Math.sin(i * 0.7); pts.push([cx + Math.cos(a) * rx * w, cy + Math.sin(a) * ry * w]); }
      ctx.save(); window.Fuzz.yarn(ctx, pts, { coat: "ginger", w: 4, seed: 7 }); ctx.restore();
    },
    async load() {
      const schedule = await (await fetch("schedule.json", { cache: "no-cache" })).json();
      const stage = window.ExplainerStage.Stage({ style: window.makeFuzzStyle(document.createElement("canvas")), schedule, scenes, endCard });
      const answer = window.AnswerKit(window.makeFuzzStyle(document.createElement("canvas")));
      return { stage, answer, schedule };
    },
  };
})();
