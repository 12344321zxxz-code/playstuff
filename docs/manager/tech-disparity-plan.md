# Formicarium: tech disparity: final plan (Nov 4, 2026)

**Inputs:**
- the council verdict (`formicarium-tech-disparity-council`);
- ChatGPT's critical review of it ("Formicarium Council Critical Review", Nov 4; in the repo as
  `docs/research/tech-disparity/chatgpt-council-review-2026-11-04.md`);
- the evidence doc;
- a code check of the review's claims (all confirmed).

**Status:** nothing built yet. Main is at 0f0d229, with the game unchanged since 4b58338.

## What the critical review changed
1. **"One receipt budget" is a real piece of work, not five lines.**
   - Knowledge enters through many channels:
     - contact (`meet`, people.js:114–125);
     - `pull` and letters (635–638);
     - migrants (migrate.js:97);
     - provinces passing knowledge up (533–538);
     - ruins (576);
     - conquest when `FX.know` is off (352);
     - the god's gifts (1008).
   - Contact happens on ticks, while the court's accounting is yearly. So the budget needs a deterministic
     yearly ledger.
2. **A realm's own discovery can't be the whole of its capacity to learn.** A rich, connected trading realm
   that invents little would be locked out. The minimal version is tested against a variant whose capacity
   also counts existing skills and installations.
3. **The carrier gate is a separate size lever.** From the steam age, an art needs 7,000 / 27,000 / 85,000
   / 240,000 counted carriers × 1.5 (that is, 7–240 million people), counting the realm and its trade
   partners (`canLearn`, tech.js:112–120). It may keep small realms out whatever discovery does. Measure
   how often it is the only thing blocking.
4. **"Copy the guns, not the age" needs observables:** exposure, the ability to make or keep, and actual use.
5. **"Ages 1–5 work" was too strong.** Late in the age of print, 81% of people are at the frontier against
   history's 48–63%. The gate is "don't make the pre-industrial ages materially worse"; improvements are
   allowed.
6. **The size-rank check already exists** (`firstTo.rank100`).
   - **Result:** with both brakes off, the first entrant into ages 6–8 was already the biggest 100 years
     before in 20 of 24 cases. Size comes before the lead, so the discovery side is the right target.
   - This is observational, not proof.
7. **No explicit "more knowledge, faster research" multiplier.** The district discovery formula already
   compounds through towns, schools, printing, computers and networks. Remove the world anchor first and
   see whether acceleration emerges.

## Step 0: instrumentation (measurement only)
The world must stay identical (checked as before: 0 of 255 fields differ). `npm test` must pass. Then merge
to main and run a 32-world baseline.
1. **Receipt ledger, per realm and year, for every outside channel:**
   - each channel (`meet`, `pull` with its own tag, letters, migrants, provinces, ruins, conquest, gifts)
     records what was proposed and what was taken in;
   - alongside: raw own discovery, own discovery after the cap, and the change in knowledge;
   - check that the ledger reconciles with the change in knowledge.
2. **Reasons `canLearn` fails**, by art tier and realm-size quintile: carrier-only, prerequisite-only,
   input-only (coal and the like), tier-only.
3. **Three observables per key art** (engines, railways, electricity, computers):
   - exposure: in contact with a holder;
   - ability: `canLearn` passes or the realm holds it;
   - use: the share of people in districts where `artsHere` grants it. Call this "people able to use
     engines", not "engine intensity".
4. **Lags at fixed checkpoints:**
   - at +25, +50 and +100 years after each frontier entry;
   - for a cohort fixed at the entry (to rule out laggards dying out or being absorbed), and for the world
     at that moment.
5. **Sensitivity and splits:**
   - frontier cutoffs of 0.5% and 1% of people;
   - town against countryside, and coast against interior, inside realms;
   - size against town share and skilled people per head (ages 6–8).
6. **32-world knock-outs** with this instrumentation:
   - base, `pull` off, `lam` off, both off;
   - plus `meet` knowledge off and conquest uptake off;
   - then break down the both-off arm (people behind without the top realm; where the lost population
     went).

## Step 1: the receipt arms
All arms share one deterministic yearly ledger: proposals gathered over the ticks, accepted at the court's
yearly step in a fixed order, with any surplus kept as "exposure", not knowledge. The cap starts at age 4.
Gifts are exempt and labelled.

| Arm | What changes |
|---|---|
| 1a, minimal | budget = `KN.M` × own discovery |
| 1b, capacity | budget also counts existing conditions: skilled town people, schools, ports and trade reach, surplus per head, precursor arts; a rolling average, zero without real carriers or assets |
| 1c, `pull` off | `pull` removed, with the same ledger |

**Unit test for 1b:** two realms with equal own discovery, one with ports, schools, coal imports and
workshops and one without, must take in foreign industrial knowledge at different rates.

## Step 2: the anchor arm
- Discovery is counted against the realm itself:
  - skilled people (`skilledOf`)^λ, with λ about 0.5 applied inside the realm;
  - times intensity: town share, schools, computers, networks, and coal in the steam age.
- `dkRef` and `fitRef` stay as measures only. The import system stays as it is. No compounding term.
- **Invariance test:** splitting one connected area into two states must not create unearned discoveries
  or extra receipt allowance.

## Step 3: joint arm
The best Step 1 arm plus Step 2.

## Step 4: only if Step 3 fails
- Rework the carrier gate so connected outside expertise or production networks across realms count;
- or add a use loop through installed capital;
- or add compounding, but only through productive means (machine tools, energy, communication).

## Display (alongside; behind its own switch)
- Districts, armies and rails drawn at their own age.
- Knowledge on the main lens bar.
- A realm-page line: "a third live an age behind".
- Chronicle headlines when realms two or more ages apart meet, and for first contact with an isolated
  landmass.

## Gates
Judged on 32 worlds, by stage (not calendar), with both frontier cutoffs, and split by magic and nuclear war.
1. **Disparity:**
   - people 2+ behind a century into ages 6–8 within a soft band of 15–30%;
   - and a lasting gap in "people able to use" key arts between the top and bottom quintiles.
2. **Acceleration:** the steps from age 6 to 7 and 7 to 8 are shorter than from 5 to 6.
3. **Leadership:**
   - biggest realm first into ages 6–8 no higher than the baseline (0.26–0.36) plus noise; above 0.45
     fails;
   - distinct leaders across ages 5–9 at least the baseline (2.4);
   - compared against a chance baseline.
4. **Pre-industrial:** no material worsening of ages 1–5. Better late print-age numbers are welcome.
5. **Pace and population:**
   - the share of worlds reaching steam falls by no more than 0.1;
   - population judged at age entry;
   - no starving peripheries.
6. **Turnover:** steam-age turnover per century within ±5 points of the baseline.
7. **Engineering:**
   - replay and save/load give identical worlds;
   - the ledger reconciles with the change in knowledge;
   - tick cost rises by at most 5%.
8. **Eye test:** Ariel watches 3 worlds. At matched stages he can name a leader, a laggard and the reason
   from the map and chronicle.

**Stop rule:** an arm fails, even if the gap figure improves, if it gets there by:
- stopping steam from arriving;
- starving the periphery;
- making every modern leader a giant;
- killing political turnover.

## Deferred (not part of this work)
- **The folk field:** its own peopling project. Realm-map coverage doesn't mean subjects are alike, so it
  stays relevant for gaps inside realms later.
- More founders, language friction, new institution stocks, Allen's factor prices, colonial extraction,
  explicit compounding, and relabelling the ages.

## Order and cost
- **Step 0:** one working session, plus a 32-world run on GitHub (about 30–60 minutes).
- **Steps 1–3:** one or two sessions; 10-world screens, then a 32-world confirmation of the winner.
- **Display:** one session, in parallel.
- Each step is reported in a post-action report and changes `formicarium-game` and the backlog as usual.

## Results (Nov 4 build)
Full numbers are in `formicarium-report-2026-11-04-tech-disparity-build`.
- Step 0 found that catch-up (`pull`) is the leveller, the letters budget never binds, and there is no use gap at all.
- Steps 1–3 were built behind `FX.recv` and `FX.anchor` (off). The best arm, td7b, was confirmed on 32 worlds.
- What passes: 23% of people 2+ ages behind a century in, the biggest realm first 43% of the time, turnover, reach to steam, tick cost.
- What fails: distinct leaders (2.0 vs 2.4), the 6→7 step (longer than 5→6), slightly worse ages 3–5, and the use gap.
- The cause: a tech lead turns into conquest and a giant.
- Next: Step 4 (a use gap through installed capital), then retest td7b.

