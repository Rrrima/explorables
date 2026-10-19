/* Datasets used by the essay. Each entry names the report section (report.html#…)
   and the sources it comes from. `flag: true` marks values that are uncertain or disputed. */
window.DATA = {
  /* Report §h1: how animal minds came to be tested */
  timeline: [
    { year: 1872, title: "Darwin draws a hostile dog and a humble one", note: "Expression of the Emotions: the same dog, stiff and bristling or low and wagging (principle of antithesis).", src: "H9" },
    { year: 1898, title: "Thorndike's puzzle-box cats", note: "One cat needed 160 s to escape on its first try and about 6–7 s by its 24th. Learning was gradual, with no flash of insight.", src: "H1", kind: "cat" },
    { year: 1904, title: "Clever Hans, the counting horse", note: "Hans was right 89% of the time when he could see the questioner and 6% when he could not. He read tiny head movements.", src: "H6" },
    { year: 1912, title: "“IQ” is coined", note: "William Stern's Intelligenzquotient: mental age ÷ age × 100. It assumes everyone sits the same test.", src: "H22" },
    { year: 1994, title: "Coren ranks the breeds", note: "199 obedience judges rank dog breeds by how easily they are trained.", src: "D1" },
    { year: 2019, title: "Breed averages are heritable", note: "Across 101 breeds, 14,000+ dogs: trainability among-breed heritability 0.73.", src: "D6" },
    { year: 2022, title: "Breed explains ~9%", note: "18,385 dogs: breed explains about 9% of an individual dog's behaviour.", src: "D7" }
  ],
  hans: { seen: 0.89, unseen: 0.06, knew: 0.98, didNotKnow: 0.08, src: "H6" },
  thorndike: { first: 160, last: 6.5, trials: 24, src: "H1" },

  /* Report §d1: Coren 1994. ranks are Coren's numbered ranks (ties share a rank) */
  coren: {
    judges: 199, judgesAlt: 208, breeds: "about 130", ranks: 79, collieTop10: 190, afghanBottom10: 121, src: "D1, D2, D3",
    top: [
      { rank: 1, name: "Border Collie", breed: "collie" },
      { rank: 2, name: "Poodle", breed: "poodle" },
      { rank: 3, name: "German Shepherd", breed: "shepherd" },
      { rank: 4, name: "Golden Retriever", breed: "golden" },
      { rank: 5, name: "Doberman Pinscher", breed: "doberman" },
      { rank: 6, name: "Shetland Sheepdog", breed: "sheltie" },
      { rank: 7, name: "Labrador Retriever", breed: "lab" },
      { rank: 8, name: "Papillon", breed: "papillon" },
      { rank: 9, name: "Rottweiler", breed: "rottweiler" },
      { rank: 10, name: "Australian Cattle Dog", breed: "cattle" }
    ],
    bottom: [
      { rank: 70, name: "Shih Tzu", breed: "shihtzu" },
      { rank: 71, name: "Basset Hound", breed: "basset" },
      { rank: 72, name: "Beagle", breed: "beagle" },
      { rank: 72, name: "Mastiff", breed: "mastiff" },
      { rank: 73, name: "Pekingese", breed: "peke" },
      { rank: 74, name: "Bloodhound", breed: "bloodhound" },
      { rank: 75, name: "Borzoi", breed: "borzoi" },
      { rank: 76, name: "Chow Chow", breed: "chow" },
      { rank: 77, name: "Bulldog", breed: "bulldog" },
      { rank: 78, name: "Basenji", breed: "basenji" },
      { rank: 79, name: "Afghan Hound", breed: "afghan" }
    ],
    /* tiers: repetitions to learn a new command (lo–hi) and first-command obedience. D2 (book text) */
    tiers: [
      { name: "Brightest", ranks: "1–10", reps: [1, 5], obey: "95%+" },
      { name: "Excellent", ranks: "11–26", reps: [5, 15], obey: "85%+" },
      { name: "Above average", ranks: "27–39", reps: [15, 25], obey: "70%+" },
      { name: "Average", ranks: "40–54", reps: [25, 40], obey: "50%+" },
      { name: "Fair", ranks: "55–69", reps: [40, 80], obey: "about 30%" },
      { name: "Most difficult", ranks: "70–79", reps: [80, 100], obey: "25% or less", flag: true }
    ]
  },

  /* Report §d2: lab batteries. Among-breed heritability of four cognitive factors,
     1,508 dogs, 36 breeds (Gnanadesikan 2020, D11). */
  cognition: [
    { name: "Self-control", h2: 0.70, note: "0.50 after allowing for body size", src: "D11" },
    { name: "Reading people", h2: 0.39, src: "D11" },
    { name: "Physical reasoning", h2: 0.21, src: "D11" },
    { name: "Memory", h2: 0.17, src: "D11" }
  ],
  horschler: { dogs: 7397, breeds: 74, src: "D10" },
  junttila: { dogs: 1002, groups: 13, src: "D23" },

  /* Report §d3: breed vs individual */
  morrill: { dogs: 18385, genotyped: 2155, breedShare: 0.09, range: [0.034, 0.253], src: "D7" },
  maclean: { dogs: 14000, breeds: 101, trainability: 0.73, mean: 0.51, src: "D6" },
  ghirlanda: { tests: 56, before: 2, after: 0, src: "H21" },
  chaser: { words: 1022, years: 3, src: "D15" },
  gwl: { typicalPassed: 1, typical: 34, gifted: 6, found: 41, src: "D18, D20" },

  /* Report §e1: dog EQ */
  eq: [
    { id: "match", label: "Match a voice to a face", value: "67%", detail: "17 dogs looked longer at the face that matched an angry or happy voice in 67% of 188 trials.", src: "E8" },
    { id: "cry", label: "Go to a crying person", value: "15 of 18", detail: "15 of 18 dogs approached someone crying, a stranger as readily as their owner.", src: "E9" },
    { id: "jealous", label: "Snap at a rival", value: "25%", detail: "When owners petted a stuffed dog, about a quarter of 36 dogs snapped at it. Only one did for a toy pail or a book.", src: "E17" },
    { id: "brow", label: "The eyebrow muscle", value: "LAOM", detail: "Dogs have a muscle that raises the inner eyebrow. In 4 wolves there were only scant fibres.", src: "E15" }
  ],
  cbarq: { items2003: 152, items2019: 78, src: "E22, E23" },

  /* Report §c1: cats */
  cats: {
    recruited: 26, dropped: 7, tested: 14, src: "C1",
    lookBack: { dogs: 12, cats: 6, of: 14, src: "C1" },
    pointing: { cats: [0.93, 0.74, 0.82, 0.70], dogs: [0.95, 0.86, 0.86, 0.75], src: "C1", flag: true },
    names: { src: "C2" },
    secure: { kittens: 0.643, kittensN: 70, adults: 0.658, adultsN: 38, infants: 0.65, src: "C7, C8" },
    referencing: { value: 0.79, src: "C10", flag: true },
    emotion: { cats: 10, src: "C12" },
    faces: { combos: 276, movements: 26, cats: 53, src: "C14" },
    salonen: { cats: 5726, breeds: 40, src: "C15" },
    breeds: [
      { name: "Korat", trait: "most people-oriented", coat: "grey" },
      { name: "Bengal", trait: "among the most active", coat: "orange" },
      { name: "Russian Blue", trait: "shyest with strangers", coat: "grey" },
      { name: "British Shorthair", trait: "least active, least contact", coat: "grey" },
      { name: "Turkish Van", trait: "most aggressive", coat: "white" }
    ],
    registries: { TICA: 75, CFA: 45, FIFe: 50, src: "C23", flag: true },
    pedigreeShare: { lo: 0.05, hi: 0.36, src: "C21, C22", flag: true }
  },

  /* Report §e2: brains. Jardim-Messeder 2017 (E1); EQ from Roth & Dicke (E2) and Saganuwan (E5) */
  brains: [
    { name: "Cat", brain: 34.9, neurons: 250, body: 4.5, eq: "1.0", src: "E1, E2" },
    { name: "Dog (avg of 2)", brain: 86.5, neurons: 528, body: 19.7, eq: "1.2–2.4", src: "E1, E5" },
    { name: "Golden retriever", brain: 114.5, neurons: 627, body: 32, src: "E1" },
    { name: "Brown bear", brain: 315, neurons: 251, body: 350, src: "E1" }
  ],
  humanCortex: { neurons: 16300, src: "E6", flag: true }
};
