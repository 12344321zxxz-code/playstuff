# Formicarium: peopling targets: peoples, languages, land use and polities (Nov 4, 2026)

Soft targets for how the world should be peopled. They come from a ChatGPT deep-research report, "Peoples,
languages, land use and polities, 10,000 BC–2000 AD" (Nov 4). The full text is in the repo at
`docs/research/peopling/chatgpt-report-2026-11-04.md`, with its matrix as `report-matrix.csv`.
Companion doc: `formicarium-tech-disparity-targets`.

## How far to trust it
- **Nearly every cell is the author's judgement** (†), with low confidence before 1 AD.
- **The world tables are internally consistent:** land uses sum to about 100%, regional populations sum to
  the world totals. These are the usable part.
- **Problems in the regional matrix:**
  - "share of polities in the most common family" is almost exactly "largest family's share of people" in
    every row. It is derived, not separate evidence;
  - each region's count of families with 1%+ of people is the same at every date (Europe 5, Africa 11),
    so it is a profile, not a time series;
  - regional "empty land" is odd in places (Europe 64% empty in 1 AD).
- **The language counts rest on one source** ("a 2026 global Holocene language-diversity model", PubMed
  42490497) that I could not open. Treat the thousands-of-languages figures as unverified.
  - Glottolog's present-day counts (7,674 languages; 246 families plus 183 isolates) are well established.
- **Firmest parts:** the direction of change, the world land-use and way-of-life tables, the farmer-front
  speeds (the European Neolithic figure is well measured), and modern counts.

## A different starting point (read every target with this in mind)
- **Earth's history began after a long prehistory.** People had spread over every continent for tens of
  thousands of years. Families were already deep and many, and farming arose slowly at a handful of small
  centres set by Earth's own geography.
- **A sim world starts at the dawn:** a few founding bands, crops placed by each world's own cradles, and
  farming picked up quickly.
- **So the targets that depend on prehistory are direction, not numbers:**
  - how many peoples and families there are;
  - how fast farming spreads and where;
  - how much land is empty early;
  - who farms first.

  A world with different crop geography should differ, and that's fine (the creed: worlds must differ).
- **Firmer:** targets about later dynamics:
  - how expanding farmers absorb others;
  - how the political map fills;
  - rule over other tongues;
  - the tech-gap shares once states exist.
- **Line up by stage, not calendar,** as in the tech-disparity targets.

## 1. The world was full before farming
- **10,000 BC:**
  - land: foragers used about 75% of habitable land; about 25% was effectively empty (ice-edge, deep
    desert, high mountains);
  - people: about 4 million, already speaking several thousand languages in about 20 families with 1%+ of
    humanity each. No family held more than about 5–10%.
- **Farming spread into occupied land.** Its expansions (Neolithic Europe, Bantu, Austronesian,
  Indo-European, Han southward) absorbed, mixed with or replaced the people already there. They were not
  colonisations of empty land, except in remote Oceania.
- **The report's own verdict on the sim's pattern:** "one family fills a whole continent but fragments into
  many states" is historical after a big farmer expansion. What's unhistorical is producing it everywhere
  from a handful of founders, and keeping too much unoccupied land once populations are large.

## 2. Land use (% of habitable land; "claimed" is an overlay on the other columns)
| Date | Farmed or settled | Pastoral nomads | Foragers | Empty | Claimed by states or chiefdoms |
|---|---|---|---|---|---|
| 10,000 BC | 0.05 | 0 | 75 | 25 | 0 |
| 5000 BC | 0.8 | 1 | 64 | 34 | 3.5 |
| 3000 BC | 1.5 | 5 | 54 | 40 | 18 (10–30) |
| 1000 BC | 3 | 10 | 48 | 39 | 60 (45–72) |
| 1 AD | 4.5 | 12 | 48 | 36 | 74 (62–83) |
| 1000 | 5.5 | 15 | 40 | 40 | 86 (75–93) |
| 1500 | 7 | 15 | 33 | 45 | 90 |
| 1800 | 15 | 12 | 20 | 53 | 94 |
| 1900 | 28 | 7 | 8 | 57 | 97 |
| 2000 | 45 | 3 | 2 | 50 | 98 |

**Pattern:** the political map fills long before land use does. By 1 AD three quarters of habitable land
was claimed by some state or chiefdom, while farms covered only about 5% and foragers still used half.

## 3. People by way of life (% of world people)
| Date | State subjects | Farmers outside states | Pastoralists outside states | Foragers outside states |
|---|---|---|---|---|
| 5000 BC | 0.5 | 43 | 1.5 | 55 |
| 3000 BC | 10 | 62 | 3 | 25 |
| 1000 BC | 50 | 38 | 3 | 9 |
| 1 AD | 72 | 21 | 2 | 5 |
| 1000 | 85 | 10 | 2 | 3 |
| 1500 | 88 | 8 | 1.5 | 2.5 |
| 1800 | 92 | 5 | 1 | 2 |
| 1900 | 97 | 2 | 0.4 | 0.6 |
| 2000 | 99 | 0.6 | 0.1 | 0.3 |

**Pattern:** mobile peoples (foragers plus pastoralists) fall from about 28% of people at the dawn of
bronze to about 12% by the iron age and 5–7% by the long middle. Large "farmers outside states" shares
(chiefdoms and free villages) last into the first millennium AD.

## 4. Languages and peoples
| Date | Families with 1%+ of humanity | Largest family's share | Languages | States | Chiefdoms |
|---|---|---|---|---|---|
| 10,000 BC | 20 (10–30) | 5% | ~5,300 | 0 | ~5 |
| 3000 BC | 24 (13–36) | 10% | ~18,000 | ~30 | ~1,200 |
| 1000 BC | 22 (12–33) | 15% | ~34,000 | ~150 | ~2,000 |
| 1 AD | 20 (11–29) | 22% | ~42,000 | ~200 | ~1,800 |
| 1000 | 18 (10–27) | 24% | ~33,000 | ~300 | ~2,000 |
| 1500 | 17 (9–25) | 26% | ~24,000 | ~400 | ~1,800 |
| 1800 | 15 (8–22) | 34% | ~15,000 | ~200 | ~800 |
| 1900 | 13 (8–19) | 40% | ~10,600 | ~80 | ~300 |
| 2000 | 11 (7–15) | 46% | 7,600 | 195 | ~50 |

- **Per region** (12 macro-regions; a profile, not a time series):

  | Region | Unrelated families with 1%+ of its people |
  |---|---|
  | Europe | 5 |
  | North Africa and West Asia | 4 |
  | Steppe | 4 |
  | South Asia | 7 |
  | East Asia | 5 |
  | Southeast Asia | 9 |
  | Sub-Saharan Africa | 11 |
  | North America | 6 |
  | Mesoamerica | 5 |
  | South America | 9 |
  | Australia and the Pacific | 10 |
  | Siberia | 6 |

  **No region has one family.** The largest family's share of a region runs 25–60% in 1000 BC, rising
  to 40–86% by 1800 where big expansions happened.
- **States per region at the fragmentation peaks** (1000–1500): tens of states and hundreds of chiefdoms.
  The three largest polities usually held under a third of a region's people before imperial consolidation.
- **The U-shape:** a farmer expansion makes one family dominant over a region and splits it into dozens
  or hundreds of polities; a few become kingdoms and empires; later fragmentation restores many states
  without restoring the old language diversity.

## 5. How fast families spread (language fronts)
| Expansion | Km per century | What happened to those already there |
|---|---|---|
| Neolithic Near East to Europe (well measured) | ~100 (60–130) | strong demic expansion with local admixture |
| Bantu | 90 east, 190 south | mostly demic, absorbing foragers |
| Han southward | ~50 | migration plus language shift |
| Indo-European, steppe phase | 200–1,000 | strong replacement in parts of Europe |
| Austronesian, Lapita voyages | ~1,300 | mixing where people lived; founding where none did |
| Arabic and Turkic | conquest 500+, language ~50–200 | conquest far outran language: mostly language shift, little replacement |

## 6. Rulers of another tongue
Share of state land and of state subjects in "minority-ruler" states, where the ruler's language is
spoken natively by under half the subjects:

| Date | Share of state land | Share of state subjects |
|---|---|---|
| 1000 BC | 22% | 18% |
| 1 AD | 38% | 32% |
| 1000 | 45% | 40% |
| 1500 | 55% | 50% |
| 1800 | 65% | 60% |
| 1900 | 75% | 70% |
| 2000 | 30% | 25% (after decolonisation) |

## What the sim can and can't match
- The sim can't hold thousands of peoples, and doesn't need to. Its "people" is closer to a language family
  or branch.
- The structural targets that matter, and can be approximated:
  1. Several unrelated families on every landmass. About 15–25 families with 1%+ of humanity early,
     falling to about 11; the largest family 10–15% early, 35–45% late.
  2. Foragers on most habitable land before farming (about three quarters; the rest is truly empty
     desert, ice edge and high mountain).
  3. Mobile peoples falling to about 12% of humanity by the iron age, and to 5–7% by the long middle.
  4. A layer of non-state farmers (chiefdoms, free villages): about 40–60% of people around the age of
     bronze, 20–40% at the iron age and 10–20% in the long middle.
  5. The political map filling fast: 60–75% of habitable land claimed by the iron age.
  6. Farmer fronts of about 50–200 km a century, absorbing rather than replacing.
  7. Rule over other tongues common: a third to a half of state subjects by the long middle.
