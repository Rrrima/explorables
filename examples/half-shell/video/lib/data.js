/* Every number the essay draws, with the report section/sources it came from.
   src: source tags (see sources.js / report.html). flag: true = uncertain, see "Open questions". */
window.DATA = {
  /* Hero platter: twelve oysters, twelve waters (report T §places). */
  platter: [
    { id: "wellfleet",  name: "Wellfleet",      where: "Cape Cod, Massachusetts", sp: "Eastern", note: "light body, clean finish, very salty", src: "T12, T9" },
    { id: "islandcreek",name: "Island Creek",   where: "Duxbury Bay, Massachusetts", sp: "Eastern", note: "butter and brine", src: "T11" },
    { id: "malpeque",   name: "Malpeque",       where: "Prince Edward Island", sp: "Eastern", note: "moderate brine, meaty, quick clean finish", src: "T29" },
    { id: "rappahannock",name: "Rappahannock",  where: "Chesapeake Bay, Virginia", sp: "Eastern", note: "extremely mild, sweet butter", src: "T8" },
    { id: "gulf",       name: "Apalachicola",   where: "Gulf of Mexico, Florida", sp: "Eastern", note: "mild and soft", src: "T15" },
    { id: "kumamoto",   name: "Kumamoto",       where: "Washington (from Japan's Ariake Sea)", sp: "Kumamoto", note: "melon-scented, sweet, firm", src: "T8, T22" },
    { id: "hamahama",   name: "Hama Hama",      where: "Hood Canal, Washington", sp: "Pacific", note: "cucumber, salt and citrus", src: "T14" },
    { id: "kusshi",     name: "Kusshi",         where: "Deep Bay, British Columbia", sp: "Pacific", note: "tumbled deep cup, ultra-clean", src: "T10" },
    { id: "olympia",    name: "Olympia",        where: "South Puget Sound", sp: "Olympia", note: "morels, butter, celery salt", src: "T8" },
    { id: "belon",      name: "Belon",          where: "Brittany, France", sp: "European flat", note: "brassy, metallic finish", src: "T8, T9" },
    { id: "verte",      name: "Fine de claire verte", where: "Marennes-Oléron, France", sp: "Pacific", note: "salty, then sweet; green gills", src: "T20, T16" },
    { id: "sydney",     name: "Sydney rock",    where: "New South Wales, Australia", sp: "Sydney rock", note: "rich, iodiney", src: "T27" }
  ],

  /* Ch1 timeline (report C §history). */
  history: [
    { y: "c. 4,300 years ago", t: "Georgia shell ring: oysters gathered only in the cool months", src: "C15" },
    { y: "c. 95 BCE", t: "Sergius Orata farms oysters on twigs at Lucrine Lake", src: "C18" },
    { y: "1836–37", t: "“Poverty and oysters seems to go together” (Pickwick Papers)", src: "C12", flag: true },
    { y: "1800s", t: "Canal Street Plan: all you can eat for 6¢", src: "C5, C13, C22" },
    { y: "1880", t: "New York waters produce about 700 million oysters a year", src: "C5, C6", flag: true },
    { y: "1927", t: "The last New York bed, in Raritan Bay, closes", src: "C4" },
    { y: "2021", t: "US restaurant average: about $3.34 an oyster (East Coast)", src: "Q17" }
  ],
  canalStreetCents: 6,          // C5
  ny1880: 700e6,                // C5, C6 (flag)
  nyBeds: 350,                  // sq mi of beds at Dutch arrival, C4 (flag: estimate)

  /* Ch2 happy hour economics (report C §happy hour). */
  happy: {
    regular: [3, 4],            // $ per oyster, Crave Fishbar NYC 2019, C1
    deal: [1, 1.5],             // C1
    wholesaleNYC: [0.77, 0.80], // C1
    wholesaleBoston: [0.65, 1.15], // C2 (2024)
    farmGate: 0.57,             // C2 (2024; 0.53 in 2020)
    farmGate2020: 0.53,
    weeklyShucked: 20000, weeklyHappy: 6000, // C1
    publicoWeekly: 2000,        // C2
    bostonVenues: 25,           // C2
    ebbitt2010: 985000,         // C22
    freeLunch: { place: "La Bourse de Maspero, New Orleans", year: 1838, src: "C23" },
    shaws: "late 1980s",        // C21
    term: { navy: 1913, print: 1959 } // C3
  },

  /* Ch3 biology & taste (report T §biology). */
  taurineShare: 0.8,            // of amino acids in C. gigas, T2
  salinity: {                   // ppt
    ocean: 35,                  // T24 (implied), standard
    chesapeakeMouth: [25, 30],  // T24 (flag: 35 per CMC)
    chesapeakeMid: [0.5, 25],   // T24
    gulf: [5, 15],              // T15 (flag: uncited)
    pacificMin: 8,              // T2, lowest tolerated
    optimum: [20, 25]           // T6
  },
  aminoWinter: 1011.5, aminoSummer: 486.7, // mg/100g, triploids, T5
  filterGal: 50,                // gal/day, upper bound, C11, C9

  /* Ch4 map places (lat, lon approx., report T place table). */
  places: [
    { id: "malpeque", name: "Malpeque", lat: 46.55, lon: -63.75, sal: "moderate", note: "meaty, clean", src: "T29" },
    { id: "wellfleet", name: "Wellfleet", lat: 41.93, lon: -70.03, sal: "high", note: "very salty", src: "T12" },
    { id: "islandcreek", name: "Island Creek", lat: 42.03, lon: -70.65, sal: "high", note: "butter & brine", src: "T11" },
    { id: "moonstone", name: "Moonstone", lat: 41.40, lon: -71.50, sal: "high", note: "stone & iron", src: "T8" },
    { id: "bluepoint", name: "Blue Point", lat: 40.70, lon: -73.10, sal: "high", note: "full salt, anise", src: "T17" },
    { id: "rappahannock", name: "Rappahannock", lat: 37.60, lon: -76.40, sal: "low", note: "mild, sweet butter", src: "T8, T24" },
    { id: "apalachicola", name: "Apalachicola", lat: 29.70, lon: -84.95, sal: "low", note: "mild, soft", src: "T15" },
    { id: "kusshi", name: "Kusshi", lat: 49.46, lon: -124.73, sal: "", note: "ultra-clean", src: "T10" },
    { id: "hamahama", name: "Hama Hama", lat: 47.55, lon: -123.04, sal: "high", note: "cucumber, citrus", src: "T14" },
    { id: "totten", name: "Totten Inlet", lat: 47.10, lon: -123.0, sal: "low", note: "sweet, musky", src: "T13, T8" },
    { id: "marennes", name: "Marennes-Oléron", lat: 45.82, lon: -1.10, sal: "", note: "salty, then sweet", src: "T20" },
    { id: "belon", name: "Belon", lat: 47.81, lon: -3.70, sal: "", note: "brassy, metallic", src: "T8, T9" },
    { id: "galway", name: "Galway", lat: 53.22, lon: -8.95, sal: "", note: "nutty, sweet iodine", src: "snippet", flag: true },
    { id: "hiroshima", name: "Hiroshima", lat: 34.30, lon: 132.40, sal: "", note: "raft-grown; most of Japan's", src: "T-S1", flag: true },
    { id: "ariake", name: "Ariake Sea", lat: 33.0, lon: 130.30, sal: "", note: "Kumamoto's home: melon", src: "T22, T8" },
    { id: "coffin", name: "Coffin Bay", lat: -34.62, lon: 135.47, sal: "", note: "clean, creamy", src: "snippet", flag: true },
    { id: "wallis", name: "Wallis Lake", lat: -32.20, lon: 152.48, sal: "", note: "rich, iodiney", src: "T27" }
  ],

  /* Ch5 season (report T §season, Q §season). */
  season: {
    spawnEastern: "early summer", spawnPacific: [7, 9], // months, T4, T23
    vibrio: [5, 10],            // May–October peak, Q22
    vibrioCases: 80000, foodborne: 52000, // per year US estimate, Q22
    reported2024: 3743, deaths2024: 73,   // Q23
    rShellRing: 4300            // years ago, C15
  },

  /* Ch6 price & size lineup (report Q table). size: shell length mm (approx.), years to market. */
  lineup: [
    { id: "bistro",  name: "Supermarket rock", mm: 85,  yrs: "1.5–3", usd: 1.71, label: "£7.90 / 6 (UK supermarket)", src: "Q19, Q8" },
    { id: "kumamoto",name: "Kumamoto",       mm: 45,  yrs: "3–5", usd: 3.17, label: "$95 / 30", src: "Q13" },
    { id: "belon",   name: "Belon flat",     mm: 90,  yrs: "3–4", usd: 7.15, label: "€39 / 6, Paris", src: "Q1, Q10" },
    { id: "gillardeau", name: "Gillardeau N°2", mm: 110, yrs: "up to 4", usd: 7.25, label: "AED 320 / 12", src: "Q2, Q1", flag: true },
    { id: "king",    name: "Coffin Bay King",mm: 180, yrs: "6–7", usd: 65, label: "A$100 each", src: "Q6, Q7, Q8" }
  ],
  flatCrash: 0.9,               // ~90% fall after Marteilia (1968–70) and Bonamia (~1979), Q10
  usAvg: { west: 3.71, east: 3.34, gulf: 2.69 }, // 2021 menus, Q17
  farmToTable: [0.5, 3.3],      // ~6–7x markup, Q16, Q17 (derived)

  /* Ch7 checks (report Q §how to tell). */
  checks: [
    { id: "tap",   t: "Closed, or closes when tapped", src: "Q20" },
    { id: "heavy", t: "Heavy for its size, full of liquor", src: "Q25, Q24" },
    { id: "smell", t: "Smells like the sea, never fishy", src: "Q24, Q26" },
    { id: "tag",   t: "Tagged: bars keep the harvest tag 90 days", src: "Q20, Q21" },
    { id: "cold",  t: "Kept cold: 35–45°F, cup down", src: "Q24, Q25" },
    { id: "fresh", t: "Eaten within about a week", src: "Q25, Q24" }
  ],
  tagDays: 90, storeF: [35, 45], freshDays: 7, frenchDays: [4, 5]
};
