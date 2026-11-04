# Formicarium: Earth vs the sim: blind spots in our targets (Nov 4, 2026)

Every historical target we use was produced by Earth's conditions. Where the sim's conditions differ, chasing
the Earth number is a mistake: we'd force the sim toward a result its world can't produce and get frustrated.
This doc lists every difference found, what each one distorts, and how to read targets because of it. It
should be read before setting any target.

Facts come from the code, the 32-world baseline (`runs/2026-11-04-cf-struct`), the peopling census
(`docs/research/peopling/`) and a world-shape probe of 5 seeds. Earth figures marked ~ are standard
literature values from memory, not rechecked.

## The short version
1. **Compare by stage, not calendar.** The sim's calendar runs 3–30 times fast before steam and 2–20 times
   slow after it. Any target in years needs converting (A).
2. **Earth is one draw.** Compare it with the sim's spread over worlds: is Earth inside the p10–p90? Don't
   aim the sim's mean at Earth (H).
3. **Compare like with like.** Before comparing, line up the definitions (frontier, claimed land, mobile
   people, family, state, "behind"). Several current gaps are partly definitional (L).
4. **Split the worlds.** Most bench worlds have magic powers and over half have nuclear war; Earth has
   neither. Compare Earth-type targets on the subset without them, or report both (F, G).
5. **Shares, not counts.** The sim's caps and its single small map make absolute counts (states, peoples,
   billions, km) meaningless. Use shares and ratios (C, E, N).
6. **Geography decides a lot.** Earth's three isolated world-islands, its coal, its crops and its
   continents' shapes produced many of its patterns. Targets that come from Earth's geography hold only for
   worlds with similar geography (B, I, J).

## The blind spots
### A. The calendar is bent
- **Sim:** the median century the frontier enters each age (32 worlds) is:

  | Age | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
  |---|---|---|---|---|---|---|---|---|---|
  | Sim year | 200 | 400 | 700 | 1050 | 1300 | 1500 | 1700 | 1800 | 1900 |

- **Earth:**

  | Age | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
  |---|---|---|---|---|---|---|---|---|---|
  | Date | ~9500 BC | ~3300 BC | ~1200–500 BC | ~100 BC | ~1250 | ~1840 | ~1940 | ~1947 | ~1990 |

- **Earth years per sim year, age by age:**

  | Step | Earth years per sim year |
  |---|---|
  | farming to bronze | ~30 |
  | bronze to iron | ~9 |
  | iron to the long middle | ~1 |
  | long middle to print | ~5 |
  | print to steam | ~3 |
  | steam to wires | ~0.5 |
  | wires to bomb | ~0.05 |
  | bomb to information | ~0.4 |

- **Why it matters:** the sim's people live at human speed. A generation, a war, a reign, an elite cycle
  and a plague all take about as many years as on Earth. But each early age is squeezed:
  - Earth's bronze age held about 2,000 years of dynasties; the sim's holds about 300;
  - so per age, the sim has far fewer collapses, empires, faith schisms, language splits and migrations
    early, and more of them late.
- **Distorted targets:**
  - anything in years: diffusion lags, deployment lags, spread to 50% or 90% of people, front speeds,
    empire lifespans, cycle lengths;
  - per-age totals.
- **What to do:** split every time target into two kinds.
  - **Tempo targets** (human-speed processes) stay in years: turnover per century (already measured that
    way), war length, reign and dynasty length, migration over a lifetime, cohesion cycles.
  - **Progress-relative targets** convert by the age's length: diffusion and deployment lags as a fraction
    of the age, spread time against the next frontier step (as the tech-disparity report does), and front
    speed per age.
- **Example:** Earth's farmers crossed Europe in about 3,000 years, half of Earth's farming-to-bronze span.
  The sim's span is 200 years, so the equivalent sim front crosses a comparable landmass in about 100 sim
  years: 10–30 times Earth's km per century, not 100 km a century.
- **Example:** the earlier tech-spread finding was that medieval arts take 100–450 years to cross a landmass
  against Earth's 15–80. In a long middle squeezed about 5 times, Earth's 15–80 years is about 3–16 sim
  years, so the sim is even slower relative to its age than that note said.
- **A consequence:** the sim's ancient ages are politically thin compared with Earth's. That's a design
  choice (2,000 years of play), not a bug. Don't expect Earth's ancient political churn per age.

### B. The world is small and connected
- **Sim:**
  - almost every landmass is peopled from year 0: founders prefer empty landmasses, so even 1–2% landmasses
    usually get one;
  - contact between landmasses comes early;
  - arts reach realms on *other landmasses with no ties* within a median of 350–800 years in the first
    ages, 60 years in the long middle, 22 in the age of print and 2–4 years from steam on (among those
    that get them).
- **Earth:**
  - three world-islands (Afro-Eurasia, the Americas, Australia) were sealed off from each other for over
    10,000 years until 1492 and 1788;
  - the contact shock (epidemics killing up to about 90%, conquest, colonies, the Columbian exchange)
    made much of 1500–1950 history.
- **Distorted targets:**
  - "isolated regions 2–4 ages behind";
  - the people and land 2+ ages behind in 1850–2000 (much of it the colonised and contacted periphery);
  - the colonial share of turnover;
  - minority-ruler states at 65–75% in 1800–1900 (mostly colonial empires);
  - first-contact epidemics;
  - the "other landmass" lag.
- **What to do:**
  - **Condition these on geography.** They apply to worlds with a large landmass long out of contact.
  - Measure contact timing per landmass (first tie, first art received).
  - A world with no isolated landmass *should* show less modern disparity, so don't count that as a miss.
  - The modern convergence diagnosis still stands: even the untied catch up.

### C. One world at two scales
- **Sim:**
  - population reaches about 4 billion at peak (each counted person stands for 1,000);
  - but structure is regional-scale: at most 700 districts, 54–58 realms, about 10 unrelated families,
    12 faiths, 420 bands.
- **Earth:** 6 billion people, about 200 states, 7,600 languages in 246 families, hundreds of chiefdoms
  per region.
- **So a sim world is a globe in population and history, and a region in political and cultural grain.**
- **Distorted targets:**
  - absolute counts: states, chiefdoms, families, languages, faiths;
  - "realms with 1%+ of people" (Earth's comes from many tiny states);
  - polity populations (Old Kingdom Egypt 1–1.5 million).
- **What to do:**
  - compare **shares**: largest polity's share, share in the top three, largest family's share, share of
    people in minority-ruler realms;
  - for counts, compare with a *region* of Earth (4–11 families, tens of states) or not at all.

### D. One age per district
- **Sim:** each district (town plus its whole countryside, about 1/700 of the world) has one age, `s.lvl`.
- **Earth:** much of the modern disparity was rural against urban inside one province. In 1950 most of
  humanity were villagers living at ages 5–6 under states whose cities were at 7–8.
- **Distorted targets:** people behind the frontier, within-state gaps, deployment lags. The sim
  structurally **undercounts** people behind. Even a perfect sim would read low against the benchmark.
- **What to do:**
  - add a measure that splits each district by its town share (towns at the district's age, the countryside
    an age behind once the age needs infrastructure);
  - or compare with history's urban-only figures.

### E. Caps bound the counts
- **Caps:** realms 54–58 (90 tested), towns 700 (520 before Nov 4), bands 420, travellers 300–420,
  faiths 12, 64 realm colours.
- **Distorted targets:** any count near a cap (polity counts, peoples, chiefdoms). A count pinned at its cap
  says nothing about history.
- **What to do:** log how often each cap binds (the stuck-rules audit did this) and never set a count target
  above a cap.

### F. Magic and the other world
- **Sim:** great powers rise in 26 of 32 worlds (median 2), dead-king realms in 20, dragon kings in 8 (up to
  23), dragons alive a median of 625 dragon-years. Ariel wants magic to **inhibit progress** (game doc
  section 9).
- **Earth:** none.
- **Distorted targets:** pace, population, turnover, disparity, every one of them. A magic-braked world
  *should* be slower and more uneven than Earth.
- **What to do:**
  - Run calibration on low-magic worlds, or with a magic-off switch if one is added. Earth targets apply to
    those.
  - Judge magic's own effect against design goals, not Earth.
  - When the magic overhaul lands, this matters more.

### G. Nuclear war
- **Sim:** 19 of 32 worlds launch (median first launch year 1787), and 21 detonate bombs (14 a world at the
  median across all 32, up to 87). Dark ages follow.
- **Earth:** no exchange.
- **Distorted targets:** modern population (peak), modern disparity, turnover in the bomb and information
  ages, pace (dark ages).
- **What to do:** report modern targets on worlds without an exchange, and separately on those with one.

### H. Earth is one history
- Earth's numbers are a single draw from a very wide distribution: China's early lead, Britain's coal, the
  Columbian exchange, two world wars.
- **Distorted targets:**
  - leadership: biggest first, outside the top 3 first, lead changes, a small frontier state;
  - the gap's peak date;
  - anything with one Earth value.
- **What to do:**
  - The test is whether Earth falls inside the sim's spread (p10–p90 over 32 worlds), and how often worlds
    produce an Earth-like case.
  - For example, "a realm outside the top 3 first into the steam age" should happen in a fair share of
    worlds, not on average.
  - Means should hit Earth only where Earth is typical, and Earth may be an outlier.

### I. Geography differs per world
- **Sim** (5 seeds):
  - land is 35% of the map (Earth 29%);
  - 70–77% of land is habitable (Earth about 71%);
  - dry land is 5–11% (Earth's barren land about 19%) and ice 6–11% (Earth about 10%);
  - the largest landmass holds 42–90% of land (Earth's Afro-Eurasia 57%);
  - 2–10 landmasses hold 1%+ of land;
  - the main landmass spans most latitudes (207–249 of 256 rows), where Eurasia's long axis runs east–west.
- **Resources** (coal, tin, horses, crops) are placed per world. About a quarter of worlds never reach the
  steam age by 2000, partly because they lack coal.
- **Distorted targets:**
  - the empty-land share (fewer deserts in the sim);
  - who industrialises first (Britain had coal on the coast);
  - the axis effects of Guns, Germs and Steel;
  - pace.
- **What to do:**
  - Condition geography-driven targets on comparable worlds.
  - Consider an **Earth-like calibration template**: one large east–west landmass with about 55–60% of
    land, two isolated north–south continents, an island continent, archipelagos, and Earth-like desert
    and coal shares.
  - Earth targets apply most strictly there. Other templates are free to differ.

### J. Prehistory and crops (Ariel)
- **Earth's history began after a long prehistory:**
  - people were everywhere;
  - families were deep;
  - farming arose slowly at about 7–10 small centres;
  - Australia had no crops.
- **The sim starts at the dawn with about 11 bands:**
  - 7 crop kinds with 1–2 cradles each;
  - a rule guaranteeing crops on every big landmass;
  - farming learned on contact with a crop.
- **Distorted targets** (direction only):
  - how many peoples and families;
  - foragers and empty land early;
  - how fast farming spreads;
  - who farms first.
- **Don't copy Earth's crop map.** See the peopling targets.

### K. The ages are our own ladder
- The 11 ages are the sim's construct. The benchmarks translated Earth onto them by judgement:
  - the report put the US at age 7 in about 1942 and age 8 by 1950, which makes "years from age 7 to 8 ≈ 5"
    an artefact of bundling;
  - electricity and the telegraph sit in the sim's steam age;
  - Earth's technologies didn't arrive as bundles.
- **The sim's ages are strictly sequential:** a district passes through each. Earth leapfrogged (mobile
  phones without landlines), which shapes 2000-era disparity.
- **Distorted targets:**
  - the frontier pace numbers;
  - the 1950 peak (with the frontier at age 7 instead of 8, the share 2+ behind falls from 69% to 24%);
  - age-specific shares around bundle edges.
- **What to do:**
  - use the *shape*: the frontier accelerates after steam, and the gap widens then;
  - use robust readings (both age-7 and age-8 versions of 1950);
  - don't chase single-age-edge numbers.

### L. Definitions don't match
Line these up before comparing:

| Quantity | Benchmark | Sim |
|---|---|---|
| frontier | first productive use anywhere, or ≥5% of people | highest age of a realm with 1%+ of people |
| claimed land | fuzzy political claim, chiefdoms included | town catchments (`w.owner`); the realm map is separate |
| mobile people | foragers plus pastoralists outside states | wandering bands, including farming peoples' bands |
| family | linguistic family (comparative method) | root tongue (`langs.root`) |
| state | sovereign polity | realm (a "cult"), including tribal peoples of a few districts |
| behind | regional bundle mix, rural masses included | district age |

**What to do:**
- add sim measures matching each benchmark definition (realm-map coverage, mobile people by way of life,
  district split by town share);
- record which definition each target uses.

### M. Run length and calendar endpoints
- **Sim:** every bench world runs 2,000 years. Results "by year 2000" (reached age 6 or 8, peak population,
  share at the information age) are artefacts of the run length.
- **Earth's 2000 is its information age; a sim year 2000 can be any age.**
- **What to do:** replace calendar checkpoints with stage checkpoints:
  - years from age 5 to age 6;
  - population at the entry of each age;
  - disparity a century into each age.

  Pace across worlds is a spread, not a target.

### N. Absolute population and space
- **Sim:**
  - population is shown at 1,000 real people per counted person, a display choice (`SCALE` in `core.js`);
  - there is no kilometre scale for cells.
- **Distorted targets:**
  - 7–11 billion in the information age;
  - polity sizes in millions;
  - front speeds and empire reach in km;
  - density.
- **What to do:**
  - judge population by growth per age, peak against carrying capacity, and urban share;
  - judge distances as a share of a landmass's width.
  - The "7–11 billion" aspiration is a feel target for the display, not a calibration target. If kept, it
    should set `SCALE` or the carrying capacity together with the map size.

### O. Rules Earth didn't have
- **Population crashes make tech regress** in the sim. Earth's Black Death (30–50% dead) didn't regress
  technology; the Bronze Age collapse and the post-contact Americas did.
- **Dark ages after nuclear war, and the magic surge.**
- **Distorted targets:** disparity after crashes (more in the sim), pace after collapses.
- **What to do:** count these events per world and stratify like F and G.

### P. The benchmarks' own biases
- Both reports are judgement-heavy. Their sources over-represent states, cities and literate cultures.
- Chiefdoms, "farmers outside states", foragers and pre-1500 regional populations are reconstructions, so
  the sim may be "right" where the benchmark is weak.
- **Problems found:**
  - land tables contradicting their matrix (tech report);
  - derived columns (peopling report);
  - an unverified key source;
  - identical 1700 and 1800 mixes.
- **What to do:** weight targets by the report's confidence, and never tune to a low-confidence cell alone.

### Q. The game isn't Earth
- Ariel wants stories: empires rising and falling, nature against people, lost and found. He also wants
  magic as a brake, and worlds that differ.
- Some targets should be **exceeded on purpose**, such as more drama per century, or a magic-slowed world.
- Earth is a reference for plausibility, not the goal. Where a target fights the design, the design wins.

### R. The bench isn't play
- Bench worlds are untouched. In play, the god's tools reshape everything.
- Targets describe the untouched baseline. That's right for calibration, but the player won't see a
  "baseline world" for long.

## How each current target should be read
Key:
- **keep:** compare directly;
- **shape:** compare the pattern or direction, not the number;
- **convert:** rescale first (A or N);
- **condition:** only on comparable worlds (B, F, G, I);
- **spread:** Earth should fall inside the sim's range (H);
- **drop:** not comparable.

### Tech-disparity targets (`formicarium-tech-disparity-targets`)
| Target | Read as | Why |
|---|---|---|
| people 0/1/2/3+ behind, ages 2–5 | keep (expect the sim slightly low) | D |
| people 2+ behind at the steam entry (12–32%) | keep, low | D |
| people 2+ behind in 1950–2000 (41–69%) | shape and condition | B, D, G, K; the robust form: the gap *widens* after steam, with 24% or more 2+ behind a century in |
| land behind | shape | L, I |
| spread to 50% and 90% of people (years) | convert (ratio to the next frontier step) | A, B |
| frontier pace (years between ages) | shape: acceleration after steam | A, K |
| biggest realm leads through print; small or mid realm leads from steam | spread | H |
| frontier holder at 2–6% of people | spread | H, C |
| lead changes (2 in 1000–2000) | spread | H |
| polities with 1%+ of people (8–22) | keep, loosely | C, E |
| largest polity's share (20–33%) | keep | |
| polities at the frontier age | shape | E |
| within-state gaps (22–52%) | keep, low | D |
| isolated regions 2–4 ages behind | condition | B |
| gap peak in 1950 | shape | K, B |

### Peopling targets (`formicarium-peopling-targets`)
| Target | Read as | Why |
|---|---|---|
| land use shares (foragers, empty, farmed, claimed) | shape | J, L, I |
| mobile people falling (28% at bronze, 12% at iron, 5–7% in the long middle) | keep the stage-based shape; numbers loosely | J, L |
| farmers outside states (40–60% at bronze, 20–40% at iron) | shape | L (the sim has no such layer yet) |
| families with 1%+ of humanity (20 down to 11) | shape | J, C |
| largest family's share (10–15% early, 35–45% late) | keep | |
| no one-family region; 3–11 per region | keep for landmasses of regional size; tiny islands may be one family | C |
| states and chiefdoms counts | drop as numbers; keep "many polities per family after an expansion" | C, E |
| front speeds (km per century) | convert (per age, and share of landmass width) | A, N |
| minority-ruler shares | keep through the long middle; the 1800–1900 peak only on worlds with colonial geography | B |
| the U-shape | keep | |

### Earlier targets in other docs
| Target | Read as | Why |
|---|---|---|
| first arrival in a connected rival, 10–20 years | convert in ages 4–5; keep from steam on | A |
| deployment 18–35 years (small states), 65–80+ (big empires); core to periphery about 40 years | keep from steam on; convert earlier | A |
| isolated regions 90–270+ years | condition | B |
| turnover per century by age | keep (a tempo measure) | A |
| the most populous polity leads 70–100% before 1450 and 0–15% after | spread | H |
| peak population 7–11 billion | drop as a calibration target; treat as a display aspiration | N, M |
| reached age 6 or 8 by year 2000 | drop; use stage-based pace | M, I |

## What to add to the bench
1. **Stratification flags per world:**
   - magic level (powers risen, dead realms, dragon kings);
   - nuclear exchange (yes or no);
   - geography class (largest landmass share, isolated landmass yes or no, own coal near the frontier).
2. **Definition-matched measures:**
   - realm-map coverage;
   - mobile people by way of life;
   - districts split by town share;
   - contact timing per landmass.
3. **Stage checkpoints instead of calendar ones.**
4. **Earth-in-spread tests** for single-draw targets: "Earth-like case in at least X% of worlds".
5. **Optionally, an Earth-like calibration template**, to make the strict comparisons apples to apples.
