/* Datasets used by the essay's drawings. Each entry names the research report
   section it comes from (report.html#…) and its source tags. `flag: true`
   marks a value that is uncertain, secondary, or disputed. */
window.DATA = {
  /* The spine. Report §C4 (Bastani et al. 2025, PNAS) and §C8 (Shen & Tamkin 2026). */
  spine: {
    practiceBase: 48, practiceTutor: 127, examBase: -17, examTutor: 0,   // % vs the no-AI control
    students: 1000, src: "C6", sec: "c4", examTutorNote: "the paper says the guardrails \"largely mitigated\" the harm; ≈0 is our reading",
    quizAI: 50, quizHand: 67, quizD: 0.74, quizN: 52, quizSrc: "C21", quizSec: "c8"
  },

  /* Ch 1: the procession of panics. Report §H1–H6. verdict: feared | refuted | confirmed | none */
  panics: [
    { year: -370, label: "370 BCE", who: "Thamus, in Plato's Phaedrus", object: "scroll", verdict: "feared", quote: "this discovery of yours will create forgetfulness in the learners' souls", src: "H1", sec: "h1" },
    { year: 1545, label: "1545", who: "Conrad Gessner, on printed books", object: "book", verdict: "feared", quote: "that confusing and harmful abundance of books", src: "H3", sec: "h1" },
    { year: 1794, label: "1790s", who: "The German 'reading mania'", object: "novel", verdict: "feared", quote: "the present strange passion for reading and its influence on the decline in domestic and public happiness", src: "H5", sec: "h2" },
    { year: 1876, label: "1876", who: "The telephone", object: "telephone", verdict: "none", quote: "40,000 articles from its first thirty years: no evidence of panic", src: "H8", sec: "h2" },
    { year: 1961, label: "1961", who: "Newton Minow, on television", object: "television", verdict: "feared", quote: "what you will observe is a vast wasteland", src: "H9", sec: "h2" },
    { year: 1986, label: "1974–86", who: "Calculators in school", object: "calculator", verdict: "refuted", quote: "79 studies: calculators improved paper-and-pencil skills at every grade except the fourth", src: "H11", sec: "h3" },
    { year: 2008, label: "2008", who: "Nicholas Carr, on Google", object: "screen", verdict: "feared", quote: "Once I was a scuba diver in the sea of words. Now I zip along the surface like a guy on a Jet Ski", src: "H16", sec: "h4" },
    { year: 2011, label: "2011", who: "The 'Google effect' on memory", object: "screen", verdict: "shaky", quote: "its priming experiment did not replicate in 2018; the memory-for-where result was never retested at scale", src: "H13", sec: "h4", flag: true },
    { year: 2013, label: "2013", who: "The FAA, on autopilot", object: "plane", verdict: "confirmed", quote: "continuous use of autoflight systems could lead to degradation of the pilot's ability to quickly recover the aircraft", src: "H24", sec: "h6" },
    { year: 2020, label: "2020", who: "GPS and spatial memory", object: "satellite", verdict: "confirmed", quote: "fifty drivers: more lifetime GPS, worse spatial memory (r ≈ −0.2); and they did not know it", src: "H17", sec: "h5" },
    { year: 2022, label: "2022", who: "ChatGPT", object: "cube", verdict: "open", quote: "a hundred million users in two months; nine hundred million a week by 2026", src: "H26", sec: "h7" }
  ],

  /* Ch 1, last step: how many of us. Report §H7–H9. */
  adoption: {
    chatgptWeekly: [{ date: "Jan 2023", users: 100, note: "monthly uniques", src: "H26" }, { date: "Feb 2025", users: 400, src: "H29" }, { date: "Oct 2025", users: 800, src: "H27" }, { date: "Feb 2026", users: 900, src: "H28" }],  // millions
    ukStudents: [{ year: 2024, any: 66, assessed: 53, aiText: 3 }, { year: 2025, any: 92, assessed: 88, aiText: 8 }, { year: 2026, any: 95, assessed: 94, aiText: 12 }], ukSrc: "H30, H31", ukSec: "h8",
    usTeensSchoolwork: [{ year: 2023, pct: 13 }, { year: 2024, pct: 26 }], teensSrc: "H32", teensChatbots2025: 54, teensAllOrMost: 10, teens2025Src: "H33",
    usAdults: 34, usAdultsUnder30: 58, adultsSrc: "H34", usAdults1864: 40, bickSrc: "H39",
    pewWorseCreative: 53, pewBetterCreative: 16, pewSrc: "H35"
  },

  /* Ch 2: the MIT study. Report §C1, §C2, §M8. */
  mit: {
    n: 54, perGroup: 18, session4: 18, groups: ["ChatGPT", "Search engine", "Brain only"],
    quoteCorrectS1: [0, 15, 16],        // of 18 who produced a correct quote from their own essay, session 1
    quoteAnyFailS1: [15, 2, 2],         // of 18 who could not quote anything
    connectivityDrop: 55,               // "up to 55% reduced total dDTF magnitude", a maximum over bands/regions
    searchDrop: [34, 48],
    powerNeeded: 159, src: "C1", critique: "C2", faq: "C3", sec: "c1",
    forbidden: ["stupid", "dumb", "brain rot", "harm", "damage", "brain scans", "terrifying findings"],
    headline: "ChatGPT May Be Eroding Critical Thinking Skills, According to a New MIT Study", headlineSrc: "H43"
  },

  /* Ch 4: why effort matters. Report §M2, §M4. */
  memory: {
    // Roediger & Karpicke 2006, Experiment 2: % recalled; S = study, T = test
    roediger: { conditions: ["SSSS", "SSST", "STTT"], at5min: [83, 78, 71], at1week: [40, 56, 61], n: 180, src: "M12", sec: "m2",
      exp1: { at5min: [81, 75], at2days: [54, 68], at1week: [42, 56], labels: ["reread", "tested"] }, jol: [4.8, 4.0] },
    generationD: 0.40, generationSrc: "M11",
    // Arthur et al. 1998: skill loss (d) by interval of non-use
    decay: [{ days: 0, d: -0.01 }, { days: 365, d: -1.4 }], decayCognitive: -1.15, decayPhysical: -0.75, decaySrc: "M22",
    halfGainsMonths: 6.5, halfSrc: "M23",
    endoscopy: { before: 28.4, after: 22.4, nBefore: 795, nAfter: 648, diff: -6.0, ci: [-10.5, -1.6], src: "M24", sec: "m4" },
    bainbridge: { quote: "a formerly experienced operator who has been monitoring an automated process may now be an inexperienced one", src: "M21", sec: "m4" },
    faa: { quote: "continuous use of autoflight systems could lead to degradation of the pilot's ability to quickly recover the aircraft from an undesired state", src: "H24", sec: "h6" },
    af447: { hoursSixMonths: 346, handFlying: 4, src: "H25", sec: "h6", flag: true }
  },

  /* Ch 5: the mirror. Report §C7, §C3, §H5. */
  mirror: {
    metr: { measured: 19, felt: -20, forecast: -24, n: 16, tasks: 246, ci: [2, 39], src: "C18", sec: "c7" },   // % change in time: + is slower
    metr2026: { original: -18, newCohort: -4, src: "C19", flag: true },
    peng: { measured: 55.8, felt: 35, n: 95, src: "C20" },
    lee: { confidenceInAI: -0.69, selfConfidence: 0.26, evalConfidence: 0.31, n: 319, examples: 936, src: "C4", sec: "c3" },
    frontier: { insideQuality: 40, insideFaster: 25.1, outsideLessLikely: 19, correctNoAI: 84, correctAI: [60, 70], n: 758, src: "C17", bcg: "C27", sec: "c7", flag: true },
    gps: { rSpatial: -0.22, rSelfRated: 0.07, n: 50, src: "H17", sec: "h5" }
  },

  /* Ch 6: sameness. Report §C9, §C5. */
  sameness: {
    doshi: { novelty: [5.4, 8.1], usefulness: [3.7, 9.0], similarityRange: [10.7, 8.9], writers: 293, src: "C14", sec: "c9" },
    melumad: { cosine: [[0.159, 0.057], [0.224, 0.072]], words: [84.6, 94.6], helpful: [3.55, 3.82], n: 10462, src: "C13", sec: "c5" },
    bcgDiversity: -41, bcgSrc: "C27",
    stadlerNull: { n: 91, src: "C8", sec: "c5" }
  },

  /* Ch 7: the tutor that will not answer. Report §C4, §C5, §C8, §M7. */
  tutors: {
    kestin: { pre: 2.75, ai: 4.5, active: 3.5, minutesAI: 49, minutesClass: 60, effectLinear: 0.63, effectQuantile: [0.73, 1.3], n: 194, src: "C10", sec: "c5" },
    lehmann: { solutionSeeking: -0.31, explanationSeeking: 0.25, src: "C9", sec: "c5" },
    costello: { beliefDrop: 20, months: 2, n: 2190, claimsTrue: 99.2, src: "C22", sec: "c8" },
    vanlehn: { human: 0.79, stepITS: 0.76, src: "M50", sec: "m7" },
    bloom2sigma: { src: "M49", sec: "m7", flag: true },
    modes: [{ who: "Anthropic Learning mode", date: "Apr 2025", src: "H47" }, { who: "OpenAI Study Mode", date: "Jul 2025", src: "H46" }], modesSec: "h10"
  },

  /* Coda */
  pope: { quote: "Use it in such a way that if it disappeared tomorrow, you would still know how to think", src: "H49", sec: "h10" }
};
