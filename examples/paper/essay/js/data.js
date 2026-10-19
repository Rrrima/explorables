/* Datasets used by the article. Each entry points at the research report
   section and source numbers (report.html#…) it comes from. */
window.PAPER_DATA = {
  /* Fibre dimensions: best-estimate average length (mm) and width (µm).
     Report §M2, sources M1–M29. `flag` marks uncertain values. */
  fibres: [
    { name: "Flax / linen", latin: "Linum usitatissimum", len: 33, range: [9, 70], width: 20, use: "European rag paper", src: "M19" },
    { name: "Hemp", latin: "Cannabis sativa", len: 25, range: [5, 55], width: 25, use: "Early Chinese and European paper", src: "M20" },
    { name: "Cotton, staple", latin: "Gossypium", len: 18, range: [10, 40], width: 20, use: "Rag and cotton papers", src: "M17" },
    { name: "Kozo", latin: "Broussonetia papyrifera", len: 10, range: [6, 20], width: 30, use: "Washi, hanji, saa", src: "M2, M3" },
    { name: "Abaca", latin: "Musa textilis", len: 6, range: [2, 12], width: 25, use: "Tea bags, banknote blends", src: "M22, M23" },
    { name: "Softwood", latin: "Picea, Pinus", len: 3.0, range: [2.25, 4.28], width: 38, use: "Kraft, packaging", src: "M1" },
    { name: "Mitsumata", latin: "Edgeworthia chrysantha", len: 3, range: [2, 4], width: 12, use: "Japanese banknotes", src: "M4", flag: true },
    { name: "Gampi", latin: "Wikstroemia / Diplomorpha", len: 3, range: [2, 4], width: 12, use: "Sutra paper", src: "M6–M9" },
    { name: "Bamboo", latin: "Bambusoideae", len: 2.7, range: [1.5, 4], width: 15, use: "Chinese bamboo paper", src: "M24, M25" },
    { name: "Qingtan bark", latin: "Pteroceltis tatarinowii", len: 2.5, range: [2.18, 2.73], width: 11, use: "Xuan paper backbone", src: "M10–M12" },
    { name: "Rice straw", latin: "Oryza sativa", len: 1.5, range: [0.5, 3], width: 10, use: "Xuan paper softener", src: "M13" },
    { name: "Hardwood", latin: "Eucalyptus globulus", len: 0.9, range: [0.47, 2.92], width: 21, use: "Copy paper, tissue", src: "M1, M27" }
  ],

  /* Spread of papermaking. lon/lat approximate (report §H2). kind:
     "firm" | "disputed" | "legend" | "independent"; lane groups the
     timeline rows: "east" | "silk" | "europe" | "americas" */
  spread: [
    { place: "Fangmatan", lane: "east", lon: 105.9, year: -160, kind: "disputed", note: "Map fragment, c. 179–141 BCE. Whether it is paper is contested." },
    { place: "Luoyang", lane: "east", lon: 112.4, year: 105, kind: "firm", note: "Cai Lun presents paper to the Han court." },
    { place: "Dunhuang", lane: "silk", lon: 94.7, year: 150, kind: "firm", note: "Paper in routine use on the frontier." },
    { place: "Korea", lane: "east", lon: 127.0, year: 350, kind: "firm", note: "Papermaking arrives in the 4th century." },
    { place: "Japan", lane: "east", lon: 135.8, year: 610, kind: "disputed", note: "Damjing of Goguryeo, 610. He made paper; ‘introduced it’ is a later claim." },
    { place: "Tibet", lane: "east", lon: 91.1, year: 650, kind: "firm", note: "Around 650, then on to Nepal." },
    { place: "Talas", lane: "silk", lon: 72.2, year: 751, kind: "legend", note: "Captured Chinese papermakers teach Samarkand: a legend Bloom calls ‘unlikely to be factual’." },
    { place: "Baghdad", lane: "silk", lon: 44.4, year: 794, kind: "firm", note: "Paper in 793; mills by 794–795." },
    { place: "Cairo", lane: "silk", lon: 31.2, year: 900, kind: "firm", note: "Egypt, c. 900." },
    { place: "Xàtiva", lane: "europe", lon: -0.52, year: 1056, kind: "firm", note: "First recorded mill in Europe; established by 1150." },
    { place: "Fez", lane: "silk", lon: -5.0, year: 1100, kind: "firm", note: "Morocco, c. 1100." },
    { place: "Fabriano", lane: "europe", lon: 12.9, year: 1282, kind: "firm", note: "First records of papermakers; earliest watermarks, 1282." },
    { place: "Troyes", lane: "europe", lon: 4.07, year: 1348, kind: "firm", note: "France." },
    { place: "Nuremberg", lane: "europe", lon: 11.08, year: 1390, kind: "firm", note: "Ulman Stromer's mill, first north of the Alps." },
    { place: "Hertford", lane: "europe", lon: -0.08, year: 1490, kind: "firm", note: "John Tate, England's first mill." },
    { place: "Mexico City", lane: "americas", lon: -99.1, year: 1575, kind: "firm", note: "Colonial mill by 1575." },
    { place: "Germantown", lane: "americas", lon: -75.19, year: 1690, kind: "firm", note: "William Rittenhouse, first mill in British North America." },
    { place: "Huitzilapa", lane: "americas", lon: -104.0, year: -75, kind: "independent", note: "Amate bark paper, c. 75 BCE: beaten, not pulped, invented separately." }
  ],

  /* Washi-making households in Japan (report §H5A). */
  washi: [
    { year: 1901, households: 70000, note: "≈70,000 households (another source: 68,000 makers)" },
    { year: 1984, households: 500, note: "fewer than 500" },
    { year: 2009, households: 295, note: "295 households" }
  ],

  /* World paper & paperboard production, million tonnes (report §H5B). */
  production: [
    { year: 1980, mt: 169, derived: true },
    { year: 2000, mt: 323, derived: true },
    { year: 2020, mt: 401 },
    { year: 2023, mt: 401 }
  ]
};
