# Formicarium: tech-disparity targets (Nov 4, 2026)

Benchmarks for how unequal technology should be across a world: how far laggards sit behind the
frontier, how many people and how much land that covers, and who holds the frontier. Use them as
soft ranges, not a script.

> **Before using any target here, read `formicarium-earth-vs-sim-blind-spots`.** It says, target by target,
> whether to compare directly, compare the shape only, convert first, compare only on comparable worlds, or
> drop it.

## Source and how far to trust it
- **Source:** a ChatGPT deep-research report, "Global technology inequality, 3000 BC–2000 AD: a numerical
  calibration" (Nov 4). It is a 23-region × 15-date matrix of population and the share of each region's
  people in each age. The text and matrix are in the repo at `docs/research/tech-disparity/`
  (`chatgpt-report-2026-11-04.md`, `report-matrix.csv`).
- **It uses the sim's own ages** (0 old stone … 10 the stars, as in `src/tech.js`), so there is no
  age-to-era crosswalk to argue about.
- **Most cells are the author's judgement** (marked † in the report). Region mixes are coarse (15/85 or
  50/50). Ancient populations are ±30–60%.
- **Problems found when checking it:**
  - its land tables don't match its own matrix (up to 18 points off). **Land shares below are recomputed
    from the matrix**; the people shares match the report;
  - 1700 and 1800 have identical age mixes (no spread in a century);
  - 1850 likely overstates steam in Mediterranean Europe (50% age 6);
  - "inhabited land" uses huge envelopes (Siberia, Australia, the steppe), so land shares are not
    comparable with the sim's owned land. Treat them as order-of-magnitude only;
  - the 1950 peak rests on calling the US age 8 in 1950. With the frontier at age 7 instead, 24% of
    people are still 2+ ages behind, so the conclusion survives.
- **Firmest parts:** the direction and timing, and everything after 1800 (CHAT data). Ancient numbers are weak.

## How to line the sim up with history
By stage, not calendar. A sim century belongs to frontier age F (the highest age held by a realm with
1%+ of people). It is the age's **entry** century (the first century at F) or a **late** century.
History's dates map as below. The report's "mature frontier" (≥5% of people) equals its first-use
frontier at every date except 1850. The sim's 1%-realm rule sits between the two.

| Date | Frontier age | Stage |
|---|---|---|
| 3000 BC | 2 | entry |
| 2000 BC, 1000 BC | 2 | late |
| 500 BC | 3 | entry |
| 1 AD | 4 | entry |
| 500, 1000 | 4 | late |
| 1300 | 5 | entry |
| 1500, 1700, 1800 | 5 | late |
| 1850, 1900 | 6 | entry (0–60 years in) |
| 1950 | 8 | entry |
| 2000 | 9 | entry |

## 1. World shares behind the frontier (% of people; land recomputed)
| Date | F | People 0 / 1 / 2 / 3+ behind | People 2+ (report range) | Land 2+ (from matrix) |
|---|---|---|---|---|
| 3000 BC | 2 | 28 / 56 / 15 / 0 | 15 (5–35) | 41 |
| 2000 BC | 2 | 51 / 41 / 8 / 0 | 8 (0–28) | 34 |
| 1000 BC | 2 | 64 / 32 / 4 / 0 | 4 (0–24) | 24 |
| 500 BC | 3 | 27 / 59 / 13 / 1 | 14 (3–34) | 41 |
| 1 AD | 4 | 38 / 43 / 16 / 3 | 19 (8–35) | 62 |
| 500 | 4 | 33 / 47 / 18 / 3 | 20 (10–36) | 59 |
| 1000 | 4 | 55 / 37 / 8 / 1 | 9 (0–25) | 38 |
| 1300 | 5 | 15 / 58 / 24 / 3 | 27 (16–43) | 64 |
| 1500 | 5 | 48 / 41 / 9 / 2 | 11 (3–23) | 48 |
| 1700 | 5 | 59 / 35 / 6 / 1 | 7 (0–19) | 45 |
| 1800 | 5 | 63 / 32 / 5 / 1 | 6 (0–18) | 45 |
| 1850 | 6 | 10 / 57 / 29 / 3 | 32 (23–44) | 59 |
| 1900 | 6 | 36 / 51 / 12 / 1 | 12 (9–18) | 24 |
| 1950 | 8 | 6 / 25 / 45 / 24 | 69 (63–75) | 70 |
| 2000 | 9 | 13 / 46 / 30 / 11 | 41 (35–46) | 44 |

**Pattern:**
- While the frontier stays in ages 2–5, few people are 2+ ages behind (5–20%). That share jumps
  for a century after each new age opens (1300, 1850).
- In the modern ages the frontier runs away. A century after steam began, 24% of people were still
  at age 5 or below, and 70% at age 6 or below.

## 2. How fast an age reaches most people
Share of the world's people at age ≥ N (from the matrix):

| Date | ≥5 | ≥6 | ≥7 | ≥8 |
|---|---|---|---|---|
| 1300 | 15 | | | |
| 1500 | 48 | | | |
| 1800 | 63 | | | |
| 1850 | 68 | 10 | | |
| 1900 | 88 | 36 | | |
| 1950 | 97 | 76 | 31 | 6 |
| 2000 | 100 | 99 | 89 | 60 |

Years from first entry to 50% and 90% of people:

| Age | 50% | 90% |
|---|---|---|
| 5 | ~300 | ~650 |
| 6 | ~75 | ~145 |
| 7 | ~25 | ~60 |
| 8 | ~50 | more than 50 |

Earlier ages took about 250–1,100 years to reach half of humanity and 1,500–3,000 years to reach 90%.
The sim compresses the early ages by design, so compare those as a ratio to the frontier's pace
(section 3), not in years.

## 3. Frontier pace (years between the frontier entering successive ages)
| Step | Years |
|---|---|
| Age 2 to 3 | ~2,600 |
| Age 3 to 4 | ~400 |
| Age 4 to 5 | ~1,350 |
| Age 5 to 6 | ~600 |
| Age 6 to 7 | ~100 |
| Age 7 to 8 | ~5 |
| Age 8 to 9 | ~40 |

History's frontier sprinted after 1850: three ages in about 150 years, against centuries per age before.

## 4. Who holds the frontier
| Age | First at scale | Population rank | Share of world people |
|---|---|---|---|
| 2 | Sumer | rank ~3–5 | |
| 3 | Achaemenid Persia | rank 1 | ~44% |
| 4 | Han China | rank 1 | ~26% |
| 5 | Song China | rank 1 | ~20% |
| 6 | Britain (metropole) | rank ~6–8 | ~2% |
| 7 | US | rank 3–4 | ~5% |
| 8 | US | rank 4 | ~6% |
| 9 | US | rank 3 | ~5% |

- **The largest state leads through the age of print.** From steam on, the leader is small to mid-sized,
  holding 2–6% of people.
- **Lead changes 1000–2000:** two (China, then Britain, then the US). The same leader takes consecutive
  ages in about 2 of 5 steps (ages 4–9).
- **Polities with 1%+ of people:** 8–16 between 1 AD and 1800, 18–22 in 1850–1950, 15 in 2000.
- **Largest polity's share of people:** 20–25% between 1000 and 1700, 33% in 1800–1850, 20–24% in 1900–2000.
- **Polities at the frontier age:** 2–4 from 1 AD to 1300, 6–12 from 1500 to 1800, 3 in 1850, about 10 in
  1900, 1 in 1950, about 10 in 2000.

## 5. Gaps inside big states (judgement-heavy)
Share of a big state's own people 1+ age behind its leading region:

| State | Share behind |
|---|---|
| Han China | 32% (25–40) |
| Song China | 22% (15–30) |
| Qing China c.1800 | 28% (20–38) |
| Mughal India c.1700 | 38% (28–48) |
| Russian Empire c.1900 | 52% (42–62) |
| US c.1950 | 25% (18–35) |

Core-to-periphery lag: 1–3 ages before 1800, 20–80 years in the US in 1950.

## 6. Isolated regions (ages behind the frontier)
| Region | Ages behind | When |
|---|---|---|
| Australia and the Pacific | 2–4 | for millennia |
| Sub-Saharan Africa | 1–2 | |
| Sub-Saharan Africa | 2–3 | 1850–2000 |
| Pre-contact Americas | 1–2 | |

"Years behind" figures in the report are weak; ages behind are more defensible.

## 7. When the gap peaked
| Measure | Peak |
|---|---|
| Share of people 2+ ages behind | 1950, 69% (63–75) |
| Widest gap between macro-regions | about 1950, 4–5 ages |

It peaks in the modern ages because the newest age is very concentrated at first. The gap did not
peak in the 1800s.
