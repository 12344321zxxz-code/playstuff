# Formicarium: independent review brief for ChatGPT: tech disparity (Nov 4, 2026)

You are asked for an **independent** diagnosis and fix proposal for one problem in a world-history simulation
game: **too little technological disparity between parts of the world**. How the world is peopled is in
scope only as far as it causes that problem or would help fix it. Another model (Claude) has done its own diagnosis and proposals. You will not see them,
so your conclusions stay independent. Both will go to a review council afterwards. Read the code yourself
and come to your own conclusions. Where this brief states a measured fact, check it if you can.

## 1. The game in short
- **Formicarium** is a god game in the browser: the world is a garden, the peoples are ant colonies.
- The player shapes land and sky, seeds life and watches history grow, but never gives orders to people.
- It is a sandbox with no win and no ending. A world runs about 2,000 years from the first bands to (in
  most worlds) the industrial, nuclear and information ages.
- **The live game:** https://12344321zxxz-code.github.io/playstuff
- **Code:** https://github.com/12344321zxxz-code/playstuff (public). Plain JavaScript ES modules. The
  simulation is headless (typed arrays, no DOM) and runs in Node.

**Scale:**
- the map is a wrapping 512 × 256 grid, one continent-sized world with a few landmasses;
- up to about 700 towns or districts, 420 wandering bands, and 54–58 realms (the realm cap);
- population reaches a few billion in the modern ages;
- one simulated year is 8 ticks, at about 28 ms per tick.

## 2. The designer's creed (binding on every proposal)
1. **Every system pushes on the others.** Nothing is a separate minigame.
2. **No scripting.** History-like patterns must emerge from interacting systems and each world's
   starting conditions, and differ between worlds. Real-history ranges are soft targets. Forcing outcomes,
   or keying rules to the world's age or the calendar year, is not allowed.
3. **Holistic fixes.** Fix the mechanism behind a problem, not with a size penalty or a knob. When a real
   mechanism replaces an old correction patch, retire the patch.
4. **You can see why.** Causes show on the map, in the Look panel and in the chronicle.

**Rejected for good** (don't propose):
- simulated individuals;
- powers aimed at single persons;
- named eras;
- forgetting magic costing tech.

## 3. The problem
**The designer's observation:** watching worlds, he sees little technological disparity between parts of
the world.

**Two benchmarks** were commissioned (ChatGPT deep research, Nov 4). Both are attached; please use both.
1. **"Global technology inequality, 3000 BC–2000 AD: a numerical calibration."**
   - In the repo: `docs/research/tech-disparity/chatgpt-report-2026-11-04.md`, with its region matrix
     `report-matrix.csv`.
   - It gives history's share of people and land 0/1/2/3+ technology ages behind the frontier at 15
     dates, the frontier state's size, leadership and more.
   - **It uses the game's own 11 ages** (see 5.3).
2. **"Peoples, languages, land use and polities, 10,000 BC–2000 AD."**
   - In the repo: `docs/research/peopling/chatgpt-report-2026-11-04.md`, with `report-matrix.csv`.
   - It covers land use, way of life (state subjects, farmers outside states, pastoralists, foragers),
     language families, polity counts, farmer-front speeds and rule over other tongues.
   - A checked summary is in `docs/manager/peopling-targets.md`; it's fine to read, but its last section
     is Claude's view.

**Known weaknesses of the first benchmark:**
- most cells are judgement;
- its land tables don't match its own matrix (recompute land from the matrix);
- 1700 and 1800 have identical age mixes;
- the 1950 figure rests on calling the US age 8 in 1950. With the frontier at age 7, 24% of people are
  still 2+ behind.

**Measured** on 32 archived worlds of the current game (details in 6.3). Stages align the sim with history:
"entry" is the first century the sim's frontier sits at an age, "late" is later centuries.

| Benchmark | History | Sim, mean [p10–p90] |
|---|---|---|
| people at the frontier age, age 5 late (1500–1800) | 48–63% | 81 [68–93] |
| people 2+ ages behind, ages 4–5 | 6–27% | 12–21 |
| people 2+ ages behind, age 6 entry (1850, 1900) | 12–32% | 6 [2–10] |
| people 2+ ages behind, age 8 entry (1950) | 69% (63–75) | 1.6 [0.5–3] |
| people 2+ ages behind, age 9 entry (2000) | 41% (35–46) | 2.1 [0.4–2.7] |
| people at the frontier age a century into ages 6–8 | (history never sat there) | about 98% in every world |
| years between frontier ages, 4→5 / 5→6 / 6→7 / 7→8 | ~1,350 / 600 / 100 / 5 | 216 / 255 / 190 / 100 (medians) |
| years for an age to reach 90% of people, age 5 / 6 / 7 | ~650 / 145 / 60 | 200 / 100 / 100 |
| a realm's own people 1+ age behind its court, late in an age | 22–52% (big states) | 0.5–6% |
| first entrant's share of people, ages 6–8 | 2–6% | 13–17% (median) |
| people 2+ behind at the iron-age entry (500 BC) | 14% | 36 [18–53] |
| people 2+ behind when bronze appears (3000 BC) | 15% (foragers) | 0 |

**In short:** through the age of print the sim is near history. From steam on the world converges; history
diverged. The ancient misses are smaller and the benchmark is weak there.

**Weaknesses of the second benchmark:**
- nearly every cell is judgement;
- in its regional matrix the same-family polity share mirrors the largest family's share, and each
  region's family count is the same at every date;
- some regional "empty land" cells are odd;
- its language counts rest on one source (a "2026 Holocene language-diversity model") that we could not
  verify.

The world-level tables are internally consistent and are the usable part.

### Peopling, as it bears on disparity
**The designer's observation and hypothesis** (please weigh it):
- Worlds start from about 11 bands placed on an empty map (`initPeople` in `src/people.js`).
- Each people splits into many small states but keeps one tongue family for a long time.
- So a continent can be 40 tribal states of one nation, with much empty land and many nomads.
- He knows the sim can't hold thousands of peoples. He wants an **approximation or simplification** that
  makes it behave more like Earth.
- **A different starting point:**
  - Earth's history began after a long prehistory, with people everywhere and farming arising slowly at a
    few small centres.
  - A sim world starts at the dawn: about 11 bands, crops placed in each world's own cradles (7 crop
    kinds, 1–2 home regions each, see `src/cradles.js` and `src/origins.js`), and farming learned as soon
    as a people has a crop.
  - The designer does **not** want Earth's crop map copied. Treat the Earth numbers that depend on
    prehistory (how many peoples and families, how fast farming spreads, how much land is empty early) as
    direction, not targets. Worlds with different crop geography should differ.

**What a census of 4 worlds shows** (`tools/peopling.mjs`, seeds 11–14, pooled by the world's highest
age; history from the second benchmark):

| Stage (sim age ↔ date) | Mobile people: history / sim | Land claimed (history) / inside town catchments (sim) | Families with 1%+ of humanity: history / sim | Largest family's share: history / sim | Smaller landmasses: top family's share (sim) |
|---|---|---|---|---|---|
| bronze (2 ↔ 3000 BC) | 28% / 74% | 18% / 4% | 24 / 10.5 | 10% / 28% | 86% |
| iron (3 ↔ 1000–500 BC) | 12% / 48% | 60% / 16% | 22 / 9.8 | 15% / 42% | 91% |
| long middle (4 ↔ 1 AD–1300) | 5–7% / 26% | 74–86% / 30% | 18–20 / 8.8 | 22–24% / 47% | 91% |
| print (5 ↔ 1300–1800) | 3–4% / 13% | 90–94% / 47% | 15–17 / 8.1 | 26–34% / 44% | 83% |
| steam to bomb (6–8 ↔ 1850–1950) | 1–2% / 0–2% | 97% / 69–90% | 13 / 5–6 | 40% / 35–45% | 76–92% |

- **History has no one-family region:** every real macro-region has 3–11 families with 1%+ of its people.
- **The sim's main landmass is plausible:** 3–5 families with 5%+ of its people.
- **The sim has no layer between a band and a realm.** History has "farmers outside states": 62% of people
  in 3000 BC, 38% in 1000 BC, 21% in 1 AD. It also has hundreds of chiefdoms per region.
- **No new family ever forms in the sim.**
- **Language distance doesn't slow knowledge in the sim.** `tongueGap` and `customsGap` affect diplomacy,
  the fiscal state, migration and cohesion, but not knowledge exchange.

**Who is behind in the sim** (share of each group 2+ ages behind the frontier):

| Group | Ages 3–5 | Ages 6–9 |
|---|---|---|
| frontier realm's own family | 0–14% | 0–1% |
| other families | 25–49% | 1–3% |
| tied to the frontier realm | 1–5% | 0–2% |
| untied | 45–54% | 2–42% (42% only at age 6) |
| on the frontier's landmass | 8–18% | 0–2% |
| on other landmasses | 39–49% | 3–15% |

### Conditions that differ from Earth (read before using any target)
We found these blind spots. The full list, with numbers, is in `docs/manager/earth-vs-sim-blind-spots.md`;
it's fine to read.
- **The calendar is bent.** The sim's frontier enters ages 1–9 at the median sim years
  200 / 400 / 700 / 1050 / 1300 / 1500 / 1700 / 1800 / 1900. That runs 3–30 times faster than Earth
  before steam and 2–20 times slower after it, while people live at human speed. Times must be converted
  per age, except human-tempo measures such as turnover per century.
- **The world is small and connected.** Almost every landmass is peopled from year 0. From steam on, arts
  reach untied realms on other landmasses within 2–4 years. Earth had world-islands sealed off for over
  10,000 years.
- **A globe in population, a region in grain:** at most 700 districts, 54–58 realms, about 10 families.
- **One age per district:** no rural–urban gap inside a district, so the sim undercounts people behind.
- **Magic** rises in 26 of 32 worlds, and is meant to brake progress. **Nuclear launches** happen in 19 of
  32 worlds.
- **Earth is one draw:** compare it with the sim's spread over worlds, not the mean.
- **Definitions differ:** frontier, claimed land, mobile people, family, state, "behind".
- **Geography and resources differ per world**, as do the run's 2,000-year endpoint, the display scale of
  population (1,000 per counted person) and the lack of a km scale.

Please find **more such blind spots** if you see them. Say for each of your proposals which targets it
should be judged on, given these differences.

**Out of scope for now:** changing the length of each age, the map's size, or the population scale. The
designer may improve these later. Don't propose them here unless you think one is essential to fixing the
disparity; if so, say why.

## 4. What we'd like from you
1. **Diagnose** why the sim's disparity collapses from the steam age on, and why the modern frontier
   doesn't accelerate. Point to the mechanisms in the code (file and function, with line numbers on
   branch `tech-disparity`), and say how sure you are.
2. **Peopling, only as it bears on disparity.** Does the way the world is peopled cause the disparity
   problem, or would changing it help fix it? If so, the sim can afford a few dozen peoples, not thousands.
   Propose the best **approximation** that serves the disparity fix:
   - What should one sim "people" stand for?
   - How do we get several unrelated families on every landmass?
   - How do we get foragers over most habitable land before farming, and mobile peoples at historical
     shares?
   - How do we get a non-state layer (chiefdoms, free villages)?
   - How do we get farmer expansion through occupied land (absorbing, not replacing; Earth's front ran at
     50–200 km a century, but convert for the sim's squeezed early ages), the U-shape (one family expands and fragments into many polities, then a few empires
     form), and rule over other tongues as the norm?
   - Say what it costs in tick time and code (the band cap is 420, the town cap 700, the realm cap 54–58).
   - Say how it would show on the map and in the chronicle.
   - Rank peopling changes by how much they would help the disparity fix, not by realism alone.
3. **Propose fixes for the disparity,** ranked by expected effect. For each:
   - the mechanism, in plain words;
   - where it goes in the code;
   - which existing correction patches it would retire;
   - the expected effect on the numbers above;
   - the risks: slower modern ages, lower population, the biggest realm dominating again, tick cost;
   - how to test it (see 6.4);
   - how the player would see it (map, Look panel, chronicle).
4. **Measurements:** what you'd measure before changing anything.
5. **Anything else** in the benchmark the sim misses that isn't listed above, and where the benchmark is
   too weak, or too tied to Earth's conditions, to calibrate against.
6. **Also challenge the framing** if you think the real problem is elsewhere (for example, the ages
   themselves as one knowledge number against fixed thresholds).

## 5. How to read the code
### 5.1 Getting it
- **Easiest:** the designer attaches the repo as a zip
  (https://github.com/12344321zxxz-code/playstuff/archive/refs/heads/tech-disparity.zip). Unzip it and read it
  in your sandbox. Node 20+ runs it (6.1).
- **To keep your view independent, please don't open these before you've written your answer:**
  `docs/manager/tech-disparity-fixes.md`, `docs/manager/tech-disparity-evidence.md`,
  `docs/research/tech-disparity/knockout.py`, `docs/manager/report-2026-11-04-tech-disparity.md`,
  the last section of `docs/manager/peopling-targets.md`,
  `docs/manager/backlog.md` (item 1), the tech-disparity lines in `docs/manager/game.md` section 5, and the
  `ko-*` runs on the `runs` branch.
  They hold Claude's diagnosis.
- **Otherwise:** read files on GitHub, e.g.
  https://github.com/12344321zxxz-code/playstuff/blob/tech-disparity/src/people.js, or raw at
  https://raw.githubusercontent.com/12344321zxxz-code/playstuff/tech-disparity/src/people.js.
- The code style is dense. Many functions are one long line with `/* (date) why */` comments explaining
  each rule. Read those comments: they record the design history.

### 5.2 The objects (`w` is the world)
- **`w.cults[]`: a "cult"** is one object that is at once a people, a state (realm), a knowledge stock, an
  army and an economy. Fields that matter:
  - `alive`, `pop`, `count` (number of districts), `big` (capital district);
  - `know` (knowledge stock), `tech` (age 0–10, from `know` against `TECH`), `arts` (known arts);
  - `ties` (contact strength with other cults), `langId`/`culId` (tongue and culture);
  - `over` (overlord, for clients), `coh` (cohesion), `orth` (orthodoxy), `wealth`, `payF` (fiscal strength).
- **`w.sets[]`: a "set"** is a district (town plus countryside) or a wandering band (`nomad`). Fields:
  - `cult` (owner), `pop`, `urb` (town share), `k` (the district's own knowledge);
  - `lvl` (the district's own age), `_tie` (how well tied to the court), `lang`/`cul`, `trade`, `market`, `port`.
- **`w.owner[cell]`** is the set whose catchment holds each map cell (-1 for none). Realm borders for
  display are drawn separately (`realms.js`).
- **`w.langs[]` and `w.culs[]`** are the tongue and culture trees. Each node has a `parent` and a `root`;
  `root` is the unrelated family.

### 5.3 Ages and arts (`src/tech.js`)
- **`ERA` (line 139)** names the ages:
  - 0 old stone, 1 first fields, 2 bronze and kings, 3 iron and empire, 4 the long middle;
  - 5 powder and print, 6 smoke and steam, 7 wires and wings, 8 the bomb, 9 information, 10 the stars.
- **`TECH` (line 96)** is the knowledge threshold for entering ages 1–10. `techOf(know)` gives the age.
- **`ART` (lines 9–92)** has 73 arts. Each has a `tier` (the age needed), `req` (prerequisite arts), `can`
  (local inputs: metals, coast, horses, coal) and `push` (what makes it more likely: war, hunger, plague).
  Steam engines are tier 5; railways, steamships, the telegraph and electricity tier 6; flight and radio
  tier 7; the bomb and computers tier 8.

### 5.4 Where knowledge happens (`src/people.js`, line numbers on `tech-disparity`)
- **`KN` (line 112), with the comment block above it (lines 96–111):** the knowledge parameters. Read the
  comments: each says why it was added.
- **`absorb` (line 113) and `meet` (line 114):** knowledge passing between cults when they meet.
- **`peopleSteps`, the yearly census (from line 447).** Around lines 530–540 it holds:
  - each district's own knowledge `s.k` drifting toward its court's (`KN.adopt`, `uptake`);
  - `s.lvl`;
  - each district's contribution to the court's discovery.
- **`artsHere` (line 599):** which arts work in a district ("know vs use").
- **`fitOf` (line 604):** how well a realm fits its age.
- **`skilledOf` (line 615):** carriers.
- **`cultYear` (line 616):** the yearly step of each cult.
  - Around line 634: own discovery from the age of print.
  - Lines 635–638: carriers, the "letters" between peers, and the pull toward tied rivals.
- **`initPeople` (line 987):** the starting bands. `addBand` (999) is the god's tool. `newCult` (51) makes
  peoples, including daughters on a split. `schism` (762) and `collapse` (782) break realms up.
- **`nomadStep` (798), `townStep` (842), `colonize` (869):** bands, towns and settling.

### 5.5 Other files that matter
- `src/tongues.js`: language and culture trees, drift, forks, shift. `tongueGap` and `customsGap` give
  the distance between two tongues or cultures.
- `src/migrate.js`: migration push and pull.
- `src/fisc.js`: the fiscal state (strength from net revenue; distance, tongue and freshness raise holding
  costs).
- `src/war.js`, `src/capture.js`, `src/empire.js`, `src/hub.js`: war, conquest, imperial reach and elite cycles.
- `src/trade.js`: goods and routes.
- `src/origins.js`, `src/cradles.js`: where crops and beasts start (Guns, Germs and Steel geography).
- `src/flags.js`: `FX` switches, one per fix (1 = new rule on, 0 = old rule).
- `src/world.js`: `makeWorld(seed)` and `tick(w)`. Yearly work is spread over the 8 ticks.
- `src/render.js`, `src/shader.js`, `src/texbuild.js`, `src/entities.js`: drawing. The Knowledge lens is
  lens 15.
- `docs/manager/game.md`: every system, what's in and what's not. `docs/manager/lab.md`: how testing works.

## 6. Running it and the data
### 6.1 Running a world
- `node tools/stats.mjs <seed> <years>` runs one world headless and prints one JSON line of everything
  measured. 2,000 years take about 5–15 minutes on one core.
- `node tools/peopling.mjs <seed> <years> [every]` runs the peopling census above. It reports land in
  town catchments, people in bands, families world-wide and per landmass, who is behind (by family,
  landmass and tie), and the share of realms ruled by a minority family.
  - Archived outputs: `docs/research/peopling/census-s11.json` to `census-s14.json`.
  - Pooled with `docs/research/peopling/census.py`.
- `npm test` runs one world for 800 years and prints the chronicle (a readable story of a world).

### 6.2 Measurement code
`tools/devmeter.mjs` measures the disparity. Each century row (`dev`) holds:
- `F`: the frontier, the highest age of a realm with 1%+ of people;
- `lag` and `land`: % of people and of land 0/1/2/3+ ages behind, read off each district's own `lvl`;
- `rland`: the same land read at the realm's age;
- `within`: the share of a realm's people behind its own court;
- `top1`, `top3` (largest realms' shares), `realms`, and `rho` (size–knowledge rank correlation).

`firstTo` records the first entrant per age, with its size rank and share of people.

### 6.3 The archived worlds
- 32 worlds on the current defaults are archived on the `runs` branch: `runs/2026-11-04-cf-struct/b<seed>.json`
  (seeds 11–18, 31–38, 51–58, 71–78).
- Example: https://github.com/12344321zxxz-code/playstuff/blob/runs/runs/2026-11-04-cf-struct/b11.json
- `docs/research/tech-disparity/disparity.py report-matrix.csv <dir>` reproduces the table in section 3
  from the matrix and the archive. `output-cf-struct.txt` is its output.

### 6.4 How changes are judged
- Every fix goes behind an `FX` switch.
- It is screened on 10 worlds and confirmed on 32, against a baseline from the same code, on a whole
  scoreboard.
- Noise is about ±0.1 on headline shares with 10–16 worlds.
- Fixes that weaken the biggest realm have often slowed the world and lowered population, so results are
  judged at matched pace.

**The current scoreboard (means over 32 worlds):**

| Metric | Value |
|---|---|
| biggest realm first into ages 6–8 | 0.36 |
| biggest realm first into age 5 | 0.89 |
| a realm outside the top 3 first, ages 6–8 | 0.15 |
| size–knowledge rank correlation | 0.69 |
| largest realm's share of people | 0.23 |
| realms with 1%+ of people | 14.6 |
| land 2+ ages behind, ages 5–8 | 18% |
| mean year into age 6 | 1488 |
| reached age 6 / age 8 by year 2000 | 78% / 69% |
| peak population | 3.4bn |

**Background on earlier work (optional):** in early November the designer worked to stop the biggest
realm leading every age ("play tall"). The knowledge rules from that work are commented in place in
`people.js` and summarised in `docs/manager/game.md` section 5.

## 7. How to deliver
- Paste your **entire answer as text in the chat reply**, in Markdown. Do not give a file, a sandbox link
  or a canvas.
- If it's long, split it into numbered parts and continue until it's complete.
- Start with a one-paragraph summary, then answer the questions of section 4 in order.
- Cite code as `file:line` on branch `tech-disparity`.
