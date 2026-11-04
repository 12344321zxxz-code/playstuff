# Formicarium: peoples, land and tech disparity: Claude's proposal (v2, Nov 4, 2026)

For the council, together with ChatGPT's independent review. Nothing here is built.

**Evidence:**
- `formicarium-tech-disparity-targets` and `formicarium-peopling-targets` (the two research reports, checked);
- `formicarium-report-2026-11-04-tech-disparity` (the sim against the first report);
- the peopling census below (`tools/peopling.mjs`, 4 worlds).

**Read with `formicarium-earth-vs-sim-blind-spots`.** Some of the gaps below are partly definitional or
come from Earth's conditions:
- one age per district undercounts people behind;
- the sim's world is small and connected, with no long-isolated world-islands;
- most bench worlds have magic and over half have nuclear war;
- the calendar runs fast before steam and slow after.

The modern convergence and the peopling gaps survive those corrections. The exact numbers to aim for don't.

## 1. What's wrong
Sim: `tools/peopling.mjs`, 4 worlds (seeds 11–14), pooled by the world's highest age, mean [range].
History: `formicarium-peopling-targets`.

| Stage (sim age ↔ date) | Mobile people: history / sim | Land claimed (history) / inside town catchments (sim) | Families with 1%+ of humanity: history / sim | Largest family's share: history / sim | Smaller landmasses: top family's share (sim) |
|---|---|---|---|---|---|
| bronze (2 ↔ 3000 BC) | 28% / 74% [56–94] | 18% / 4% [1–9] | 24 / 10.5 | 10% / 28% | 86% |
| iron (3 ↔ 1000–500 BC) | 12% / 48% [33–70] | 60% / 16% [8–28] | 22 / 9.8 | 15% / 42% | 91% |
| long middle (4 ↔ 1 AD–1300) | 5–7% / 26% [18–32] | 74–86% / 30% [19–46] | 18–20 / 8.8 | 22–24% / 47% | 91% |
| print (5 ↔ 1300–1800) | 3–4% / 13% [7–19] | 90–94% / 47% [30–61] | 15–17 / 8.1 | 26–34% / 44% | 83% |
| steam to bomb (6–8 ↔ 1850–1950) | 1–2% / 0–2% | 97% / 69–90% | 13 / 5–6 | 40% / 35–45% | 76–92% |
| information (9 ↔ 2000) | 0.4% / 0 | 98% / 91% (1 world) | 11 / 5 | 46% / 54% | 62% |

- **History has no one-family region:** every real macro-region has 3–11 families with 1%+ of its people.
- **The sim's main landmass is fine:** 3–5 families with 5%+ of its people.
- **The sim's land is a weaker measure:** it counts town catchments only, not the political map, so the
  claimed share may be understated. Measure realm-map coverage too.

**Who is behind** (share of each group 2+ ages behind the sim's frontier):

| Group | Ages 3–5 | Ages 6–9 |
|---|---|---|
| frontier realm's own family | 0–14% | 0–1% |
| other families | 25–49% | 1–3% |
| tied to the frontier realm | 1–5% | 0–2% |
| untied | 45–54% | 2–42% (42% only at age 6) |
| on the frontier's landmass | 8–18% | 0–2% |
| on other landmasses | 39–49% | 3–15% |

So in the ancient and medieval ages the laggards already are other peoples: other families, other
landmasses, out of contact. From steam on, even they catch up.

Two problems, linked:
1. **From the steam age the world converges.**
   - The frontier never accelerates: `KN.lam` and `KN.ref` cap every court near an ordinary realm's pace.
   - Catch-up is nearly unconditional: `KN.pull`, and an `absorb` that depends only on the gap.
   - Provinces reach their court's age within a century (`KN.adopt`).
2. **The world is peopled wrongly** (Ariel's point).
   - It starts from 11 bands on empty land.
   - Mobile bands stay far too common for far too long.
   - There is no layer between a wandering band and a realm: no chiefdoms, no free villages.
   - Each smaller landmass holds one family forever, and no new family ever forms.
   - Knowledge crosses language families with no friction at all: `tongueGap` and `customsGap` touch
     diplomacy, the fiscal state, migration and cohesion, but not `meet`, `pull` or letters.

They are linked because history's laggards were mostly *other peoples*: other families, other ecologies,
outside the frontier's networks. A world descended from a few bands with free-flowing ideas has nobody to
be behind.

## 2. The approximation: what a sim "people" stands for
History had thousands of languages; the sim can afford a few dozen peoples. So don't chase the count:
make the few dozen behave like Earth's structure. Concretely:
- **A sim people is a language family or major branch** (Indo-European, Bantu, Sinitic), not one tribe.
  The real targets that matter are structural:
  - 15–25 unrelated families with 1%+ of humanity early, falling toward about 11;
  - the largest family 10–15% early and 35–45% late;
  - several families on every landmass (3–11 per real region; never one);
  - a farmer expansion making one family dominant over a region and split into many polities (the U-shape);
  - old families surviving in refuges (mountains, forests, deserts, islands).
- **Below the peoples sits a cheap, unnamed substrate**: the folk who aren't (yet) in any realm. It stands
  for the thousands of small groups without simulating them one by one.
- **Polities:** the sim's realms (up to about 58, 90 tested) match the state count of one real region at
  its peak (20–80). The hundreds of chiefdoms belong in the substrate.

**A different starting point** (Ariel, Nov 4):
- Earth's numbers assume a long prehistory and Earth's own crop geography. A sim world starts at the dawn
  with a few bands, its own cradles, and quick farming.
- So don't make the sim match Earth's crop map or its counts. Use the Earth targets as direction:
  structure, shares and dynamics once farming and states exist.
- Judge prehistory-dependent numbers (how many peoples, how fast farming spreads, how much land is empty
  early) loosely. Expect worlds with different crop geography to differ.

## 3. Proposals
### P1. More founders, spread by landmass (cheap; build first)
- `initPeople` places 11 bands at least 34 cells apart, preferring empty landmasses. Instead, seed
  founders by habitable area: about one per N habitable cells, at least two per landmass of any size,
  each with its own root tongue. That gives about 25–35 roots.
- It is a starting condition, not a script: different worlds still get different numbers and places.
- **Expected:** families per landmass 2–6, and the end of one-family landmasses. More unrelated
  neighbours for diplomacy, faith, language shift and (with P4) knowledge friction.
- **Risks:**
  - more early cults press on the band cap (420) and the realm cap;
  - early wars become more common;
  - pace may change.
- **Test:** the census plus the scoreboard, behind `FX.founders`.

### P2. The folk field (the core of the fix)
**What it is:**
- A coarse grid, for example 4 × 4 map cells per folk cell (128 × 64 cells). It holds the people who are
  not in a realm.
- For each cell: a density, a way of life (forage, farm or herd), a family id, and an age (knowledge level).
- It replaces forager bands as agents. Herder hordes stay agents, because they raid and travel.

**Rules** (yearly, in slices, like the climate):
- **Seeding:** at year 0 the field fills all habitable land at forager density, with families laid
  regionally (P1's founders seed the agents; the field also gets regional families of its own).
- **Growth:** each cell grows toward the carrying capacity of its way of life (forage low, herd middle,
  farm high).
- **Food production spreads** from realms, from farming field cells and from cradles, fast enough to cross a
  large landmass in about half the farming-to-bronze age. Earth's front took about 3,000 of its 6,200
  years; the sim's age lasts about 200 (blind-spots doc A). Whether the family comes along depends on
  the gap in density:
  - dense farmers into thin foragers carry their family in (demic spread, like Bantu or the Neolithic);
  - into a dense population, mostly the way of life spreads and the old family stays (like Arabic and
    Turkic after conquest).
- **Being claimed:** a realm's districts claim and tax the field around them. Claimed farm cells become
  "subjects": they count toward the realm's people and pay little, and their family is kept. Language
  shift toward the court then runs slowly through `tongues.js`, over centuries (a tempo process), not with
  the conquest.
- **Rising:** a dense, farming, unclaimed patch with enough people becomes a new agent people (a chiefdom
  turning into a realm) with **its own family**. So new peoples rise from the substrate throughout history,
  not only by splitting old ones.
- **Knowledge:** the field's age rises slowly by contact with neighbours (cells next to realms, along
  trade routes), much slower than inside a realm.

**What it fixes:**
- **Land:** foragers on most habitable land from the start (history: about three quarters), and the
  claimed share filling early through the field.
- **Way of life:** mobile people at the right share; "farmers outside states" exists.
- **Peoples:** substrate families in refuges; new peoples rising from the substrate.
- **Tech disparity:** a real population of laggards in the ancient ages, and in the modern ages wherever
  realms haven't absorbed it.

**Cost:**
- About 8,000 cells a year, a small fraction of the tick budget.
- It touches seeding (`initPeople`, `cradles.js`, `origins.js`), bands (`nomadStep`), settling (`colonize`),
  tongues, contact and disease, the census (`peopleSteps`), and drawing.

**Display:**
- the Peoples and Tongues lenses show the field's families as soft hatching;
- the Look panel names them ("Kesh-speaking hill farmers, no king");
- the chronicle reports peoples rising from the field.

### P3. Rule over other tongues is normal; nations come late
- Conquest moves borders fast; language follows slowly through shift (P2).
- A realm where under half its people share the court's family is a "minority-ruler" realm, and it should be
  common: a third to a half of state subjects by the long middle.
- Its subjects lag the court (fixing the within-realm gap: 22–52% behind in big states). They secede more
  readily when print and then nationalism arrive. Most of this already exists through `fisc.js` holding costs
  and the `_foreign` share in tongues; it needs the language diversity from P1 and P2 to bite.

### P4. Knowledge crosses families with friction
- Scale `meet`, `pull` and letters by tongue and customs distance.
- The friction is eased by a shared faith, a shared script (the alphabet, then printing), trade intensity
  and contact over time.
- Within a family, ideas flow freely; across families they need traders, converts and interpreters.
- **Expected:** isolated or alien regions lag, and the frontier's own cluster shares among itself (the
  Europe pattern).

### P5. Catch-up needs the capacity to use it (tech strand)
- `absorb(gap)` becomes `absorb(gap, capacity)`. Capacity comes from:
  - literacy (schools, printing);
  - town share;
  - an open court;
  - from the steam age, engines running on its own fuel.
- `KN.pull`, a correction patch, is retired or becomes the capacity-gated channel.
- **Expected:** prepared latecomers catch up fast (the Meiji path); agrarian giants and peripheries stay
  one or two ages behind for generations.

### P6. Let intensity compound, not size (tech strand)
- Replace the `lam`/`ref` cap with friction from extent: a court's discoveries come from its well-tied,
  urban, literate core and compound with it; loosely held land adds little.
- Keep `fresh` and fit.
- **Expected:** the frontier accelerates in ages 6–9 and is held by intense realms.
- **Risk:** big realms with intense cores dominate again.

### P7. Provinces modernise only with investment (tech strand)
- From the steam age, a district's uptake is paid for by the realm's net revenue (`fisc.js`) and its own
  towns and trade.
- New arts spread outward along the road and rail graph.
- **Expected:** peripheries of big realms lag 40–80 years.

### P8. Display (small)
- Draw towns and armies at their district's own age.
- Add Knowledge to the main lens bar.
- Add a realm-page line such as "a third of its people live an age behind; most speak Kesh".

## 4. Order and tests
1. **Measurements.**
   - the bench additions in the blind-spots doc: stratification flags (magic, nuclear, geography),
     definition-matched measures, stage checkpoints, Earth-in-spread tests;
   - the census across 32 worlds via GitHub Actions: lag by family, landmass and tie, and the
     minority-ruler share (already in the tool, not yet run);
   - realm-map coverage, not only town catchments;
   - decade sampling.
2. **P1 and P4.** Both small; P4 needs P1's diversity to matter.
3. **P5**, then **P6** (the riskiest to balance).
4. **P2** as its own design council and build (the most foundational; P3 follows from it).
5. **P7 and P8.**

Each step goes behind an `FX` switch: screen on 10 worlds, confirm on 32, and judge the whole board
(disparity, leadership, pace, population, turnover, peopling, tick cost), at matched pace.
