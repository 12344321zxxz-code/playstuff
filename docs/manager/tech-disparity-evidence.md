# Formicarium: tech-disparity evidence: knock-outs, splits and new measures (Nov 4, 2026)

**For the council.** It is kept separate from the ChatGPT brief so the review stays independent. No game
change was made.

**Runs** (all on the `runs` branch):
- `ko-*`: 10 worlds each, seeds 11–18 and 31–32, on main;
- `b2-base`: 32 worlds on main at dec8f1f, the first baseline with the `bench2` measurements.
- The game code is unchanged since 4b58338. `b2-base` reproduces `cf-struct` exactly.

**Analysis:** `docs/research/tech-disparity/knockout.py`.

## 1. The convergence is not a blind-spot artefact
- Split the 32 baseline worlds by nuclear launches (13 without, 19 with) and by magic (low or high, by
  powers risen + dead realms + dragon kings; median 4).
- In every subset, including the 4 "clean" worlds (no launches, low magic), 98–100% of people are at the
  frontier a century into ages 6–8. The share 2+ behind is 0.5–2%.

## 2. Knock-outs: which rules cause it
Knock-outs are not fixes; each switches off one suspected cause (10 worlds each, so indicative; noise is
about ±0.1 on shares).

| Arm | People 2+ behind, ages 6–8 entry / late | Years between frontier ages 5→6 / 6→7 / 7→8 | Reached age 8 | Biggest realm first, ages 6–8 | Peak population |
|---|---|---|---|---|---|
| baseline (`ko-base`) | 0.7–4.4% / 0.5–2.6% | 245 / 186 / 125 | 0.6 | 0.26 | 3.7bn |
| no pull toward tied rivals (`KN.pull = 0`) | 0.8–6.3% / 0.4–1.3% | 352 / 231 / 144 | 0.4 | 0.50 | 3.7bn |
| no cap on a court's own discovery (`KN.lam = 1`) | 5.8–14.1% / 1.8–2.9% | **65 / 98 / 45** | 0.7 | 0.71 | 2.7bn |
| both off | **22–36% / 14%** | **84 / 118 / 59** | 0.7 | **0.92** | 2.7bn |
| provinces adopt at half speed (`KN.adopt = 0.015`) | 0.8–6.4% / 1.6–1.7% | 312 / 215 / 102 | 0.5 | 0.35 | 3.8bn |

**What it shows:**
- **`lam` is what keeps the frontier from accelerating.** Without it, the modern ages come in 45–100 years
  each, history's shape.
- **`pull` is what closes the gaps.** With `lam` off but `pull` on, gaps open when each age begins but close
  within a century.
- **With both off,** history-sized gaps persist (14–36% 2+ behind).
- **Province adoption speed matters little** for the 2+ share; it moves people one age behind.
- **The cost:** removing `lam`, the brake added in the play-tall work, lets the biggest realm lead again
  (0.71–0.92) and lowers peak population. A fix must let *intensity* compound, not size, and make
  catch-up depend on capacity, not ties alone. That is fixes P5 and P6 in the fixes doc, now with direct
  evidence.

## 3. New measures on the 32-world baseline (`b2-base`)
| Frontier age, phase | People 2+ behind: by district / with the town–countryside split | Habitable land in the realm map / in town catchments | People in bands: herders / others |
|---|---|---|---|
| 2 (bronze), late | 0 / 0 | 13% / 8% | 57% / 7% |
| 3 (iron), entry | 36% / 36% | 21% / 14% | 47% / 4% |
| 4 (long middle), late | 12% / 12% | 51% / 40% | 21% / 0.5% |
| 5 (print), late | 12% / 12% | 68% / 56% | 10% / 0.1% |
| 6 (steam), entry | 6% / 6% | 82% / 69% | 5% / 0.1% |
| 7, entry | 0.7% / **37%** | 97% / 93% | 0.6% / 0 |
| 8, entry | 1.6% / **30%** | 97% / 92% | 0.6% / 0 |
| 8, late | 1.9% / 3.2% | 92% / 79% | 0.7% / 0 |

**Notes:**
- **The town–countryside split** counts a district's countryside one age behind its district from the age
  of steam (an assumption standing in for the rural gap the sim lacks, blind spot D). It lifts age-entry
  gaps to history's size, but late-age convergence stays.
- **The realm map fills about half as fast as history's claimed land:** 21–31% at iron against about 60%,
  and 43–51% in the long middle against 74–86%.
- **The sim's mobile people are mostly herders,** against history's 3% pastoralists at bronze and iron. This
  is the bulk of the "too many bands" gap, and the source of the many people 2+ behind at the iron-age
  entry.
- **Isolation exists:**
  - 19 of 32 worlds have a landmass with 5%+ of land and no outside tie before the long middle;
  - the median first outside tie of such landmasses is year 785, and 8 of 74 never get one.
  - Modern arts still cross within a few years once ties exist.
- **Median year the frontier enters ages 1–9:** 159, 364, 649, 998, 1231, 1480, 1662, 1764, 1857.

## For the council
1. **The diagnosis is confirmed causally:** the `lam` cap and the `pull` channel together produce the
   modern convergence.
2. **The challenge is to remove them without bringing back size dominance.** Candidates: friction from
   extent, intensity-based discovery, capacity-gated catch-up.
3. **New side findings for the peopling strand:**
   - herder bands are far over-represented;
   - the political map fills slowly.
