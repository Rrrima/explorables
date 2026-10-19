/* {{TITLE}} · scenes. One function per narration segment; x.word("…") is the time
   that word is spoken, so things appear exactly when they are named. */
(function () {
  "use strict";
  const scenes = [
    (x) => { x.kword("ink", "the hook", 960, 520, x.s + 0.1, { size: 120 }); },
    (x) => { const k = x.eOut(x.seg(x.t, x.word("number"), x.word("number") + 0.8)); x.S.circle("accent", 960, 560, 260 * k); x.kword("ink", "one number", 960, 920, x.word("number"), { size: 64 }); x.hot(700, 300, 520, 520, "What this circle stands for."); },
    (x) => { x.kword("accent", "the twist", 960, 540, x.word("twist"), { size: 140 }); },
    (x) => { x.kword("ink", "remember this", 960, 540, x.word("remember"), { size: 110 }); },
  ];
  window.EXPLAINER = {
    title: "{{TITLE}}",
    segNames: ["Hook", "Idea", "Twist", "Landing"],
    poster: 2,
    async load() {
      const schedule = await (await fetch("schedule.json", { cache: "no-cache" })).json();
      const stage = window.ExplainerStage.Stage({ style: window.makeStyle(document.createElement("canvas")), schedule, scenes, endCard: (x) => x.S.text("ink", "{{TITLE}}", 960, 560, { size: 160 }) });
      const answer = window.AnswerKit(window.makeStyle(document.createElement("canvas")));
      return { stage, answer, schedule };
    },
  };
})();
