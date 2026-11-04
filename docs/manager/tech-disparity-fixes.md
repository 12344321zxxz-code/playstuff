# Formicarium: tech-disparity fixes, Claude's proposal (Nov 4, 2026)

For the council, together with ChatGPT's independent review. The evidence is in
`formicarium-report-2026-11-04-tech-disparity` and `formicarium-tech-disparity-targets`. Nothing here
is built.

## The problem in one paragraph
Through the age of print the sim's tech inequality is about historical. From the steam age on the world
converges: a century into each modern age about 98% of people are at the frontier age, where history had
41–69% two or more ages behind in 1950–2000. Three things in the knowledge code drive it:
- the frontier never accelerates: `KN.lam` and `KN.ref` cap every court near an ordinary realm's pace;
- catch-up is nearly unconditional: `KN.pull` closes 4% of the gap a year, and `absorb` depends only on
  the gap;
- provinces catch up with their court within a century (`KN.adopt`).

Ariel added a fourth on Nov 4: **the peopling of the world is unhistorical** (strand A).

## Strand A: peoples and land (Ariel's point)
**What Ariel sees:**
- Worlds start from about 11 bands (`initPeople`, default `n = 11`) on empty land.
- Each people splits into many small states, but they stay one language family for a long time
  (daughters keep the parent's tongue; tongues fork only by drift).
- A continent can end up as 40 tribal states of one nation, with a lot of empty land and nomads between them.
- History wasn't like that:
  - every habitable continent was full of foragers before farming began;
  - farmers spread into occupied land, absorbing, replacing or mixing with the people there;
  - most regions held several unrelated language families side by side.

**What the census shows** (`tools/peopling.mjs`, new; seeds 11 and 31, 2,000 years):

| Seed, year (age) | People in wandering bands | Land inside any town's catchment | Unrelated families alive (with 1%+ of people) | Largest family's share of people | Main landmass: families with 5%+ / top family's share | Other landmasses: top family's share |
|---|---|---|---|---|---|---|
| 11, 500 (2) | 94% | 1% | 10 (10) | 19% | 5 / 38% | 100%, 100% |
| 11, 1000 (3) | 70% | 9% | 10 (10) | 24% | 5 / 47% (yr 1100) | 100%, 52% |
| 11, 1700 (4) | 24% | 36% | 10 (10) | 49% | 3 / 71% | 100%, 100% |
| 11, 2000 (5) | 10% | 58% | 10 (8) | 51% | 3 / 66% | 96%, 100% |
| 31, 500 (2) | 63% | 6% | 11 (11) | 15% | 5 / 37% | 100%, 100% |
| 31, 1000 (3) | 46% | 25% | 11 (9) | 29% | 4 / 41% (yr 900) | 100%, 100% |
| 31, 1500 (5) | 13% | 55% | 11 (9) | 33% | 4 / 37% | 93%, 100% |
| 31, 2000 (8) | 2% | 71% | 10 (8) | 49% | 3 / 59% | 95%, 100% |

What it shows:
- **Land:** worlds begin as 11 bands on empty land. Until the iron age only 1–25% of land lies inside any town's catchment; the rest is empty or roamed by bands (bands hold no land in this count).
- **Bands:** 46–70% of people still live in wandering bands at the iron age, and 13–24% at the age of print.
- **Families:** the number of unrelated families is fixed at the start (10–11 roots) and no new one ever forms.
- **Main continent:** it holds 3–5 families with 5%+ of its people, which is plausible.
- **Every smaller landmass is a single family (93–100%) for the whole 2,000 years:** one founding band per landmass, and no other people ever arrives or forms. That is the designer's "continent of one nation".
- Real-world numbers for comparison (land use, foragers and pastoralists, language families per region) are being researched separately.

**Why it matters for tech inequality:**
- History's laggards were mostly *other peoples*: of other ecologies, other tongues, outside the
  frontier's networks (Africa, the Americas and Australia before contact, Siberia, upland Southeast Asia).
- In the sim every people descends from the same handful of bands and shares their dense web of ties.
- **Language distance doesn't slow knowledge at all.** `tongueGap` and `customsGap` affect diplomacy, the
  fiscal state, migration and cohesion, but not `meet`, `pull` or letters. Historically, linguistic
  and cultural distance predicts how slowly technology spreads (Spolaore and Wacziarg's work on diffusion
  barriers).

**Proposals:**
- **A1. A peopled world from year 0.** Instead of 11 bands on empty land:
  - every habitable cell starts with a thin forager population, held as a cheap field (density plus a
    lineage per cell), not as agents. Agents would break the band cap (420) and the tick budget;
  - lineages are seeded regionally, giving a few dozen unrelated root tongues spread over the map;
  - agent peoples start where food production can begin (the existing cradles and START niches) and expand
    into the field;
  - contact with the field: foragers are absorbed (language shift, partly), pushed back, or they adopt
    herding or farming themselves and become a new agent people **with their own root tongue**;
  - where farming can't go (cold, dry, deep forest, isolated islands), the field stays.
  - This fixes the empty land, the one-family continents and the missing foragers in the early ages (the
    benchmark has 15% of people foraging in 3000 BC; the sim has none). It also gives the world real
    outsiders to be "behind".
- **A2. Knowledge crosses tongues and customs with friction.** Scale `meet`, `pull` and letters by tongue
  and customs distance, eased by a shared faith, a shared script (the alphabet, printing) and trade
  intensity. Within a family ideas flow freely; across families they need traders, converts and
  interpreters.
- **A3. Keep daughters' tongues.** A daughter people keeping its parent's tongue is historical (Greek
  poleis, Italian states). The fix is more founding diversity (A1), not faster splitting of tongues.
- **A4. New peoples from mixing.** When farmers absorb a large forager population, or conquerors rule a
  majority of another tongue for long, a new branch or creole forms (the existing fork logic in
  `tongues.js`). Families then cross-cut realms, as they do historically.

**Cost:** A1 is the biggest change in this doc. It touches seeding (`initPeople`, `cradles.js`, `origins.js`),
contact and disease, tongues, the Peoples lens and the chronicle. It is still in the architecture's spirit:
a field, like grass and herds. It should go behind a switch and be judged on the whole board, because
everything downstream (pace, turnover, population) will move.

## Strand B: catch-up needs the capacity to use it
- `absorb(gap)` becomes `absorb(gap, capacity)`. Capacity comes from:
  - the learner's literacy (schools, printing);
  - its town share;
  - an open court (`orth`);
  - from the steam age, whether it runs engines on its own fuel.

  A realm without them learns *about* new arts but doesn't reach the age.
- `KN.pull` (a flat 4% a year toward a tied rival) is a correction patch from the play-tall work.
  Retire it, or make it the capacity-gated channel.
- **Expected:**
  - prepared latecomers catch up fast (the Meiji path);
  - agrarian giants and peripheries stay one or two ages behind for generations;
  - first entrants get smaller, and worlds differ more.
- **Main risk:** the world as a whole slows. Judge it at matched pace.

## Strand C: let intensity compound, not size
- From the age of print, `lam = 0.1` above the 25th-percentile realm (`ref`) makes every court discover
  about as much as an ordinary one, scaled by fit. That stops the biggest realm leading, but it also stops
  Britain-like leaders running ahead, so the modern frontier crawls (100–250 years per age against
  history's 5–100).
- **Replace it with friction from extent:**
  - a court's own discovery comes from its well-tied, urban, literate core (`wt` already discounts loosely
    held provinces);
  - it compounds with that core's size and density;
  - loosely held land adds little.
- Retire `lam` and `ref`. Keep `fresh` (each age is earned inside it) and fit.
- **Expected:** the frontier accelerates in ages 6–9, and is held by intense realms rather than big ones.
- **Main risk:** big realms with intense cores dominate again. Judge it on biggest-first and size–knowledge
  ρ as well as disparity. It may also help pace (backlog item 4) and population (item 6).

## Strand D: provinces modernise only with investment
- From the steam age, a district's uptake (`KN.adopt` × `uptake`) is paid for by the realm's net revenue
  (`fisc.js`) and the district's own towns and trade.
- New arts spread outward along the road and rail graph from the core, not everywhere at once.
- **Expected:** peripheries of big realms lag 40–80 years (history: core to periphery about 40 years,
  65–80+ for big empires; the sim now 25–55). Colonies get ports and garrisons early and their interiors
  late.

## Strand E: display (small, optional)
- Draw towns and armies at their district's own age, not the court's.
- Add Knowledge to the main lens bar.
- Give realm pages a line such as "a third of its people live an age behind".

## Measure first (cheap, before any fix)
1. Isolated landmasses: the lag of peoples with no ties to the frontier's landmass.
2. Number of realms at the frontier age.
3. Decade sampling for spread times (century rows are too coarse for the modern ages).
4. Lag by tongue family: are the laggards other peoples or the same people's provinces?
5. The peopling census (`tools/peopling.mjs`) on the 32 worlds, against the second research report
   (peoples, languages, land use), which Ariel is commissioning.

## Suggested order
1. Measurements (all cheap).
2. B and A2 together (both act on `absorb` and the catch-up channels; quick to build).
3. C (riskiest to balance).
4. D.
5. A1 as a design council of its own, because it is the most foundational.

Each step goes behind an `FX` switch: screen on 10 worlds, confirm on 32, and judge on the whole board,
at matched pace and population.
