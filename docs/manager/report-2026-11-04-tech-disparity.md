# Formicarium report: tech-disparity check (Nov 4, 2026)

**Main:** not merged. The work is on branch `tech-disparity` (commit efffa3b), docs and analysis only, with no game or tool changes.
- `docs/research/tech-disparity/`:
  - the ChatGPT report (`chatgpt-report-2026-11-04.md`);
  - its matrix (`report-matrix.csv`);
  - the analysis script (`disparity.py`);
  - its output on cf-struct (`output-cf-struct.txt`).
- `docs/manager/`: this report (`report-2026-11-04-tech-disparity.md`) and `tech-disparity-targets.md` (project copies: `claude/formicarium-…`).

## What changed
- Nothing in the game. No new runs were needed: the archived 32-world baseline `runs/2026-11-04-cf-struct`
  (the current defaults) already records, per century, the share of people and land 0/1/2/3+ ages behind,
  read off each district's own age (`dev`), plus the first entrant per age (`firstTo`).
- The first ChatGPT report had no numbers (every cell "not computed"). A second one, from a prompt that
  demanded ranges, gives a 23-region × 15-date matrix in the sim's own ages. I checked it against itself:
  the people tables match its matrix, the land tables don't (recomputed). Details and caveats are in
  `formicarium-tech-disparity-targets`.

## Results: history against the sim
- **History** is the report's best estimate with its range.
- **Sim** is the mean over world-centuries, with [p10–p90] across 32 worlds.
- **Stages:** "entry" is the first century the sim's frontier is at that age; "late" is later centuries
  (dates per stage in the targets doc).

| Benchmark | History | Sim | Verdict |
|---|---|---|---|
| **People at the frontier age (0 behind)** | | | |
| age 2 entry (3000 BC) | 28 (18–38) | 22 [3–46] | in |
| age 2 late (2000, 1000 BC) | 51–64 | 42 [19–66] | in |
| age 3 entry (500 BC) | 27 (17–37) | 32 [8–57] | in |
| age 4 entry (1 AD) | 38 (30–46) | 22 [3–48] | near |
| age 4 late (500, 1000) | 33–55 | 63 [49–78] | near |
| age 5 entry (1300) | 15 (7–23) | 24 [3–53] | in |
| age 5 late (1500–1800) | 48–63 | 81 [68–93] | **out** (too uniform) |
| age 6 entry (1850, 1900) | 10–36 | 47 [4–95] | near |
| age 8 entry (1950) | 6 (3–9) | 53 [2–97] | **out** |
| age 9 entry (2000) | 13 (10–16) | 55 [1–98] | **out** |
| **People 2+ ages behind** | | | |
| age 2 entry and late | 4–15 | 0 | **out** (no foragers left) |
| age 3 entry | 14 (3–34) | 36 [18–53] | **out** (too many behind) |
| age 4 entry and late | 9–20 | 12–17 [2–29] | in |
| age 5 entry | 27 (16–43) | 21 [8–32] | in |
| age 5 late | 6–11 | 12 [5–18] | in |
| age 6 entry | 12–32 | 6 [2–10] | **out** |
| age 6–7 late | (history never sat there) | 1 | – |
| age 8 entry | 69 (63–75) | 1.6 [0.5–3] | **out** |
| age 9 entry | 41 (35–46) | 2.1 [0.4–2.7] | **out** |
| **Land 2+ ages behind** | | | |
| ages 5–9 | 24–70 (from matrix) | 12–33 | **out** (low confidence: definitions differ) |
| **Pace and spread** | | | |
| years between frontier ages, 4→5 / 5→6 / 6→7 / 7→8 | 1,350 / 600 / 100 / 5 | 216 / 255 / 190 / 100 | **out** (the sim's frontier never sprints) |
| years for age 6 to reach 90% of people, relative to the next frontier step | 145 vs 100 (1.5) | 100 vs 190 (0.5) | **out** |
| years for age 5 to reach 90%, relative to the next step | 650 vs 600 (1.1) | 200 vs 255 (0.8) | near |
| **Inside realms** | | | |
| own people 1+ age behind | 22–52 (big states) | entry 20–50, late 0.5–6 | **out** late (provinces catch up within a century) |
| **Who leads** | | | |
| biggest realm first, ages 4–5 | yes (Han, Song; 20–26% of people) | rank 1 in 46 of 57; share 21–24% | in |
| first entrant's share of people, ages 6–8 | 2–6% (rank 3–8) | median 13–17% [2–41]; rank 1 in 25 of 70 | **out** (too big) |
| first entrant outside top 3, ages 6–8 | 2 of 3 | 18 of 70 (0.26) | **out** |
| same leader into consecutive ages (4–9) | 0.4 | 0.37 | in |
| distinct leaders, ages 4–9 | 3–4 | 2.4 | near |
| polities with 1%+ of people | 14–22 (1500–2000) | 14.6 | in |
| largest polity's share of people | 20–33% | 23% | in |
| **When the gap peaks** | | | |
| peak of people 2+ behind | 1950, at the age-8 entry | age-3 entry; 2% or less from age 6 on | **out** |
| **Not measured** | | | |
| isolated landmasses' lag; number of polities at the frontier age | | | not in the archive |

**Worlds differ** at the entry of each age: the share at the frontier runs from 3% to 95% across worlds.
But every world ends up the same: in every world, a century into an age from steam on, about 98% of
people are at the frontier.

## Sim or display?
**Mostly the sim.**
- Through the age of print the sim has about the right disparity, and the Knowledge lens shows it: it
  paints each district's own age.
- From the steam age on, the sim itself converges: a century into each modern age about 98% of people are
  at the frontier age. History had most people one to three ages behind.
- **A small display part:** town and city art, the realm page header and realm outlines show the court's
  age, not the district's. So on the normal map a lagging province looks as modern as its capital, and
  only the Knowledge lens (in the tool lens list) or the Look panel reveals it.

## Diagnosis
1. **The modern frontier never runs away.**
   - The sim's frontier takes 100–250 years per age in every era. History's took centuries before
     1800, then three ages in about 150 years.
   - The main brake is in `people.js`: from the age of print, a court's own discoveries above the
     25th-percentile realm grow only to the power 0.1 (`KN.lam` with `KN.ref`). Each age's progress also
     starts from zero (`KN.fresh`).
   - Together these keep every court near the pace of an ordinary realm. They were added to stop
     the biggest realm leading, but they stop any leader running ahead, including the small intense
     leaders history had (Britain, the US).
   - The even steps of `TECH` (50–70M apart for ages 6–10) add nothing to make the pace accelerate.
2. **Catch-up is nearly unconditional.**
   - A realm tied to a rival up to one age ahead closes the gap at 4% a year (`KN.pull`), scaled by the
     tie and by `absorb`, which depends only on the size of the gap. `meet` and the republic of
     letters add more.
   - So a tied laggard reaches the new age within decades whatever its schools, towns or court.
   - Historically only societies with the capacity to use the new arts converged (Germany, Japan,
     Russia's cores). Big agrarian realms stayed one or two ages behind for a century or more.
3. **Provinces catch up with their court within a century.**
   - Inside realms, the share of people behind the court falls from 20–50% to under 6% in an age's
     second century.
   - Big states historically kept 22–52% of their people behind their leading region, and the
     earlier tech-spread research gives deployment of 65–80+ years for big empires (the sim: 25–55).
4. **Modern first entrants are too big:** 13–17% of humanity against 2–6%. This is the known
   size-dominance problem (improved by the Nov 4 fixes) and it partly follows from 1: a small intense
   realm can't run ahead.
5. **Minor misses in the early ages:**
   - no foragers are left when bronze arrives (history: 15% in 3000 BC, 4% by 1000 BC);
   - too many people are 2+ behind at the iron-age entry (36% against about 14%; the report is weak here).

## Proposed fixes (not built; ranked by expected effect)
1. **Catch-up that needs the capacity to use it.**
   - Make `absorb` (used by `pull`, `meet` and letters) depend on the learner as well as the gap:
     - its schools and literacy, its town share and an open court;
     - from the steam age, its own engines and fuel.
   - A prepared latecomer catches up fast (the Meiji path). An agrarian giant stays one or two ages
     behind for generations.
   - This replaces the flat 4%-a-year `pull`, which is a correction patch.
   - Expected: the largest effect on people behind in ages 6–9, more difference between worlds, and
     smaller first entrants.
2. **Let intensity compound, not size.**
   - Replace the size-blind cap (`lam` above the 25th-percentile `ref`) with friction from extent, so a
     compact, well-tied, urban realm's discoveries compound while a sprawling one's don't.
   - The district weight `wt` already discounts loosely held provinces.
   - Expected: the frontier accelerates in the modern ages (history's sprint) and is held by intense
     realms, not big ones.
   - Risk: it could bring back big-realm dominance. Judge it on biggest-first and the size–knowledge
     correlation as well as disparity.
   - It may also help backlog items 4 (pace) and 6 (population), since the modern ages would arrive sooner.
3. **Provinces modernise only with investment.**
   - From the steam age, a district reaches its court's age only when the realm's net revenue or its own
     towns pay for it: railways, mills, schools. The fiscal state (`fisc.js`) already computes the money.
   - Expected: peripheries of big realms lag 40–80 years, matching the deployment targets.
4. **Foragers that last** where farming can't reach (cold, dry or isolated land). Small effect; low priority.
5. **Display (small, optional, behind a switch):**
   - draw towns and armies at their district's own age;
   - add Knowledge to the main lens bar.

Fixes 1 and 2 work together: 2 alone would let leaders run ahead while laggards are still pulled along;
1 alone would leave the frontier crawling. Test them separately and together on the 32-world scoreboard.
Add three measurements first:
- the lag of isolated landmasses;
- the number of realms at the frontier age;
- decade sampling for spread times.

## Decisions Ariel made
- Get the benchmark from a new ChatGPT deep research with a prompt that demands numbers. No deep research
  by Claude, only small lookups to fill gaps (none were needed).

## Open
- Which fixes to build, and in what order (Ariel decides).
- The three measurements above.
- The report's ancient numbers are weak. If the early-age misses matter, they need a better source.

## For the manager
- New doc: `formicarium-tech-disparity-targets` (benchmarks, the stage mapping, caveats).
- Backlog updated: "Now" item 1 (the benchmark) is closed and replaced by "Modern ages converge", with the
  fixes and measurements.
- `formicarium-game` section 5 updated: two new "Not" lines (modern convergence; the art shows the court's
  age), and the "Wanted" line on unevenness now says the benchmark is in.
