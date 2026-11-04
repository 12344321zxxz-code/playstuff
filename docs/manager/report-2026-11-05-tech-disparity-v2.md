# Formicarium report: tech disparity v2, "know fast, build slow" (Nov 5, 2026)

**Main:** merged (fast-forward from `capital`), on by default and live. Old main kept as `backup/main-2026-11-05-pre-capital`.

**Bottom line:**
- The modern ages no longer converge. A century into each modern age (6–8), 23% of people live two or more ages behind the frontier. It was 1.3% before; the target band was 15–30%.
- The spread differs by world, from 0% to 52%.
- Ariel's three conditions hold on 32 worlds:
  - **Big realms are no stronger:** the biggest realm is first into ages 6–8 30% of the time, against 36% before.
  - **Colonial conquest still happens as before;** colonial turnover is slightly up.
  - **Playing tall works as before:** small realms lead as often as before.
- Population, pace and turnover are kept, and ages 1–5 are untouched.

## The idea, as built (`FX.capital`, on)
- Knowledge spreads as before. Who reaches each age first is unchanged.
- **The works stock:** from the age of steam, each district keeps a stock of works: factories, rails, power. It lives in an industrial age only once its works per head pay for that age.
  - Steam costs 3 a head, and each later age costs 2.5 times more.
  - Works wear out at 4% a year, and a sack burns half.
- **Where works come from:**
  - **Its own towns and trade:** 10% of their output.
  - **The court:** 30% of net revenue, spread by how well tied each district is, so a giant's far provinces get little.
  - **Returns:** works already built raise what the towns can put by. This loop is kept inside the works.
  - **Adjustments:** banking helps, and war slows building. A colony or protectorate keeps only 60% of its own investment.
- **What reads the works:** town growth, and which arms a realm's soldiers carry.
- **What reads knowledge:** discovery, food and growth, and a colony's push for independence.
  - Discovery and independence were cut from the works by design, to keep who-leads apart from who-builds and to keep empires breakable.
  - Food was cut from the works after the knock-out test: it did no work and cost 13% of population. Public health reaching a poor district before its factories is also what history did.
- **Replaced, not stacked:** from the age of steam, the works replace the old brake on how fast provinces catch up with their court (`uptake`).
- **What the player sees** (`FX.lagShow`, on):
  - towns are drawn in the age they live in;
  - the realm page says how much of its people live in its age;
  - the chronicle notes a realm's first works ("The first works of the X open at Y");
  - the Look panel says why a district lives behind what it knows: the court is far, its savings are taken away, too few townsfolk and too little trade, or the war.
- **v1 deleted.** The v1 mechanisms (`FX.recv`, `FX.anchor` and their knobs) are deleted. The v1 measurements stay.

## Results (32 worlds, on the `runs` branch)
Runs:
- `cap0-32`: base, the game as it was;
- `cap8-nofood`: the winner;
- `v2-final-32`: the defaults on main; identical to the winner in all 32 worlds.

| Gate | Base | v2 | Verdict |
|---|---|---|---|
| people 2+ ages behind a century into ages 6–8 | 1.3% | **23.3%** | ✓ (band 15–30%) |
| … at the frontier / one age behind | 98% / 1% | 40% / 37% | a real spread |
| … with the countryside counted an age behind | 1.8% | 36.8% | (history: 41–69%, 1950–2000) |
| people living below what they know | 0% | 58% | the use gap now exists |
| years between ages 5→6 / 6→7 / 7→8 | 255 / 190 / 100 | 255 / 204 / 99 | ✓ (later steps shorter than 5→6) |
| biggest realm first, ages 6–8 | 0.36 | 0.30 | ✓ (guard: ≤ 0.41) |
| distinct first realms, ages 4–9 | 2.43 | 2.40 | ✓ (guard: ≥ 2.3) |
| largest realm's share of people, ages 6–8 | 0.24 | 0.25 | ✓ (within noise) |
| conquests per world | 509 | 515 | ✓ (+1%, noise) |
| playing tall: frontier realm-years outside the top 3 | 0.66 | 0.67 | ✓ |
| colonial wars / colonial turnover (age 6 / age 7) | 61.8 / 10.9 / 16.8 | 60.9 / 12.3 / 19.4 | ✓ (colonialism slightly up) |
| colonies freed per world | 18.0 | 19.0 | ✓ (empires still break up) |
| turnover, ages 6–7 | 34.5 | 37.1 | ✓ (±5) |
| peak population | 3.44bn | 3.44bn | ✓ |
| worlds reaching steam | 0.78 | 0.78 | ✓ |
| ages 1–5 | | identical | ✓ (by construction) |
| tick cost (GitHub) | 14.9 ms | 15.2 ms | ✓ (+2%) |
| replay / save | | | ✓ (a world saved in the steam age reloads and runs identically) |
| switched off | | | identical to the old game, bit for bit |

**How the winner was found:**
- **4 screens on 10 worlds,** 17 settings in all:
  - the price of each age;
  - the wear rate;
  - returns, stepped and smooth;
  - arms following the works;
  - colonial drain;
  - new seed travelling without works.
- **Then 32 worlds:** the winner, plus one knock-out per reader.

**Knock-outs (the second- and third-order check of plan v2, rule 4):**
- **Town growth does the work.** Without it the gap drops to 12%.
- **Arms add a little gap** (23% vs 19%) and nothing harmful.
- **Food did no work:** the gap was the same without it. It only cost 13% of peak population and some colonial turnover, so it was cut.

**Rejected:**
- **Arms following the works.** Colonial turnover fell by a third and turnover dropped 7 points.
- **"New seed without works".** No effect.

## Decisions Ariel made
- Plan v2 approved (Nov 4, evening), with three conditions:
  - no runaway big realms that steamroll history;
  - colonialism arising naturally from the tech gap;
  - playing tall still viable.
- Consider second- and third-order effects of every change. He finds the game may be getting too complicated; that discussion belongs in the manager chat.

## Open
- **Eye test (Ariel):** watch 2–3 worlds into the modern ages, with the Knowledge lens and town art. Can you name a leader, a laggard and the reason?
- **Spread between worlds:** 0–52%. A few worlds stay converged (0–2%); why is not checked yet.
- **The countryside:** the rural gap is still not modelled (blind spot D). With the countryside counted one age behind, the figure is 37%, closer to history.
- **Simplicity:** this added one stock per district, 8 numbers in `KN` and 3 knock-out switches, and removed `FX.recv`, `FX.anchor` and their 7 knobs, plus `uptake` from the age of steam. If the manager chat decides to trim, the reader switches (`cTown`, `cArm`, `cFood`) can be folded into constants.

## For the manager
- **Docs updated:**
  - `formicarium-game`: knowledge section;
  - `formicarium-backlog`: item 1 closed;
  - `formicarium-lab`: switches and the gates script;
  - `formicarium-00-start-here`: current state and index;
  - `formicarium-tech-disparity-plan-v2`: results.
- **Scoring tools:** `python3 docs/research/tech-disparity/gates.py <base> <arms...>` now prints side-effect meters too (playing tall, the largest realm's share, conquests, colonial wars and turnover, independences, peak population, the use gap).
- **The v1 report** (`formicarium-report-2026-11-04-tech-disparity-build`) is history now; v1 is deleted.
