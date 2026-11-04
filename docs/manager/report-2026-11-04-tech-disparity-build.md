# Formicarium report: tech disparity, from diagnosis to build (Nov 4, 2026)

**Main:** merged at be6a9fb (fast-forward from `tech-disparity`). It holds the new measurements and the new mechanisms, **all switched off**. The game plays exactly as before: all 32 scoreboard worlds come out identical to main 4a17f95. The one change in the output is that the knowledge ledger now lists catch-up (`pull`) apart from `letters`. Backup of the old main: branch `backup/main-2026-11-04-pre-tech-disparity`.

**Bottom line:**
- The cause is found and measured.
- Mechanisms that give history-sized gaps in the modern ages now exist behind switches. The best one puts 23% of people two or more ages behind a century into each modern age (today: 1.3%; history: 41–69%, read against a different starting point).
- No version passes every gate. Three still fail:
  - leadership rarely changes hands;
  - steam to electricity takes longer than print to steam;
  - railways and electricity spread to every realm that can use them.
- Ariel's call is needed on whether to switch the best version on as it is (see the end).

## What this chat did, in order
1. **Benchmark** (ChatGPT's tech-inequality report, a second numeric version, and our own matrix): `formicarium-tech-disparity-targets`, `formicarium-report-2026-11-04-tech-disparity`.
   - The sim matches history through the age of print, though late print is too even (81% of people at the frontier vs 48–63%).
   - From steam on the world converges: about 98% of people are at the frontier a century into each age.
2. **Peopling** (ChatGPT's peopling report plus our census): `formicarium-peopling-targets`.
   - Ariel's points are recorded there:
     - too few founding peoples, and one language family per continent;
     - empty land and many herders;
     - Earth had a long prehistory and its own crop map, so Earth targets are read with that difference in mind and its crop map is not copied.
   - Peopling is in scope only where it causes or fixes the disparity.
3. **Fixes doc and a brief for ChatGPT's independent review:** `formicarium-tech-disparity-fixes`, `formicarium-chatgpt-brief-tech-disparity`.
4. **Blind-spots audit** (Ariel asked to "really dig"): `formicarium-earth-vs-sim-blind-spots`.
   - It covers blind spots A–R: places where the sim's conditions differ from Earth's, so an Earth target means something else here.
   - It ends with a target-by-target reading table.
5. **Knock-outs and new measurements:** `formicarium-tech-disparity-evidence`.
   - Removing both the crowding of a realm's own finds (`lam`) and the pull toward tied rivals (`pull`) brings back history-sized gaps.
   - It also makes the biggest realm first almost every time.
6. **LLM council, then ChatGPT's critique of it:** `formicarium-tech-disparity-council`.
   - Final plan: `formicarium-tech-disparity-plan`, with Steps 0–4, gates and a stop rule.
7. **Build** (this part):
   - Step 0, the measurements;
   - Steps 1–3: 6 knock-outs and 28 test versions ("arms") on GitHub, plus 2 confirmations on 32 worlds, about 580 world runs in all;
   - the display;
   - a merge of everything switched off.

## What changed (all on main, all off by default)
- **Measurements** (`tools/bench2.mjs`, measurement only, no random draws):
  - the knowledge each channel delivers, per frontier age and per standing (at the frontier, one age behind, two or more behind), with the letters budget;
  - for engines, railways, electricity and computers: who uses each, who could learn it, who is tied to a user, and why the rest cannot;
  - a fixed group of realms taken at each age's start, followed at +25, +50 and +100 years;
  - the frontier measured with a 0.5% cutoff next to the 1% one;
  - the first realm into each age, ranked by people, by town share and by skilled people per head;
  - the world's own-discovery reference and its spread.
- **Scoring:** `docs/research/tech-disparity/gates.py` scores any run against the plan's gates.
- **Ledger:** catch-up toward a rival is now logged as `pull`, apart from `letters`.
- **Knock-out switches:** `KN.meet` (learning from contact) and `KN.prov` (a court learning from its provinces). Both default to 1, as played.
- **`FX.recv` (Step 1), the receipt allowance.** Every outside channel draws on one yearly allowance from the long middle (age 4) on: meet, migrants, provinces, ruins, conquest, pull and letters. Gifts of the gods are exempt.
  - Setting 1: the allowance is `KN.M` × the realm's own finds.
  - Setting 2: it is `KN.Mb` × what its own towns could find before crowding (townspeople, schools, print, trade, surplus).
  - Unit test: `test/recv.mjs`.
- **`FX.anchor` (Step 2), anchored discovery.** A realm's own finds depend only on itself, no longer on where it stands among the others:
  - `own = KN.ak · raw^KN.aL`, times town share against the median realm's to the power `KN.aI`;
  - times the orthodoxy brake ("no equal for generations") at full strength, to the power `KN.aO`;
  - optionally times the size of the age being crossed, to the power `KN.aS`;
  - setting 2 starts it from age 4 (`KN.ak4`).
  - The world reference (`dkRef`/`fitRef`) is still measured but not used.
  - Unit tests cover this too.
- **`FX.lagShow` (display, off).** When on:
  - towns are drawn in their own district's age;
  - the realm page says how much of its people live in its age ("37% of their people live in the age of powder and print, 63% are an age behind").
  - The Knowledge lens was already on the lens bar.

## Results
Runs are on the `runs` branch as `2026-11-04-td*`. Screens used 10 worlds (seeds 11–18, 31–32); confirmations used 32.

**What Step 0 found** (`td0-base`, 32 worlds):
- **Catch-up is the leveller.**
  - At the frontier, `pull` brings 42–68% of what a realm learns, and its own finds only 8–15%.
  - One age behind, `pull` brings 48–76%.
  - Two or more behind, contact (meet) brings 50–80% up to steam, and provinces 69–74% after.
- **The letters budget almost never binds:** letters offered are only 1.0–1.9 times letters taken.
- **The carrier gate never blocks a key art.**
- **No use gap:** once the frontier is a full age past railways or electricity, essentially every realm that could have them does. Nothing in the sim keeps a realm from using what it knows.

**Knock-outs** (32 worlds, people 2+ ages behind a century into ages 6–8 / biggest realm first):

| Arm | 2+ behind | Biggest first | Other effects |
|---|---|---|---|
| base | 1.3% | 0.36 | |
| pull off | 1.4% | 0.46 | |
| contact off | 2.2% | | |
| provinces off | 1.4% | | |
| crowding off | 2.5% | 0.77 | |
| both off | 15.0% | 0.76 | distinct leaders 1.47 |

No single channel explains the convergence. It takes fast leaders (no crowding) plus slow followers (no pull), and that combination hands every lead to the biggest realm.

**Arms** (10-world screens unless marked 32). Base on the same 10 worlds:
- 2+ behind 1.2%;
- steps of 245/186/125 years (5→6 / 6→7 / 7→8);
- biggest first 0.26;
- 2.10 distinct leaders;
- reach steam 0.70;
- turnover 35.4.

| Arm | What it is | 2+ behind | Steps | Biggest first | Leaders | Reach steam |
|---|---|---|---|---|---|---|
| 1a | allowance 10× own finds | 2.4% | | 0.47 | | 0.60 |
| 1b | allowance 3× towns | 2.0% | | 0.53 | | 0.60 |
| 1b | allowance 1× towns | 5.7% | 384/287/184 | 0.42 | | 0.60 |
| 2 | anchor at the old pace (ak 74, ak 19) | 1.2–1.3% | | | | |
| 2b | anchor plus town share (td4a–d) | 2–16% | | 0.65–0.82 | | |
| 3c | anchor plus town share plus allowance (td5a–d) | 19–27% | 97–150/140–187/96–112 | 0.62–0.82 | | |
| 3d | allowance by own finds; anchor from age 4 (td6a–e) | 9–26% | | 0.59–0.79 | | |
| 3e | plus orthodoxy, td7b | 19% | 125/164/95 | 0.50 | 2.1 | |
| 3e | plus orthodoxy, td7c | 18% | 105/118/83 | 0.43 | 1.6 | |
| 3f | plus age size (td8a–d) | cohort 13–20% | 7→8 down to 55–62 years | 0.46–0.59 | | |

- 3d: the allowance scaled by own finds rather than by towns, and the anchor started at age 4.
- 3e (td7b, td7c): the orthodoxy brake ("no equal for generations") at full strength; the anchor had been softening it for giants.
- 3f: modern ages pass faster, and so does the lead.

**32-world confirmation** (base, then best and runner-up):

| Gate | Target | Base | td7b-32 | td7c-32 |
|---|---|---|---|---|
| 2+ behind a century in (countryside split) | 15–30% | 1.3% (1.8) | **22.7% (26.8) ✓** | **15.0% (16.2) ✓** |
| fixed cohort 2+ behind at +100 years | | 0.7% | 10.5% | 8.8% |
| steps 5→6 / 6→7 / 7→8 (years) | 6→7 and 7→8 shorter than 5→6 | 255/190/100 | 119/146/98 ✗ (6→7) | 100/117/85 ✗ (6→7) |
| biggest first, ages 6–8 | ≤ base + noise; fail above 0.45 | 0.36 | **0.43 ✓ (borderline)** | 0.53 ✗ |
| distinct first realms, ages 4–9 | ≥ 2.4 | 2.43 | 1.97 ✗ | 1.70 ✗ |
| ages 3–5: at frontier / 2+ behind | no material worsening | 54 / 19.6 | 48 / 20.8 (worse) | 49 / 20.4 (worse) |
| worlds reaching steam | not down > 0.1 | 0.78 | 0.81 ✓ | 0.84 ✓ |
| people when steam begins | | 353m | 260m (steam comes earlier) | 241m (steam comes earlier) |
| turnover, ages 6–7 | ± 5 points | 34.5 | 31.4 ✓ | 37.0 ✓ |
| tick cost | ≤ +5% | | ✓ (24.6 vs 24.5 ms locally, seed 13) | ✓ |
| persistent use gap (railways, electricity) | | none | none ✗ | none ✗ |

**Why it is stuck:** when a realm leads in this sim, it conquers and becomes a giant. Leaders hold 40–55% of the world's people in most arms. Then it keeps the lead, because nothing makes a lead decay except the orthodoxy brake. History had leaders that did not become the largest realm and leads that passed on (Netherlands, then Britain, then Germany and the US). Getting that needs something the knowledge system cannot give alone:
- either a cost to running a giant;
- or a real use gap, where knowing an art is not the same as having the capital to use it (plan Step 4).

## Decisions Ariel made
- Scope: the tech-disparity problem first. Peopling counts only where it causes or fixes the disparity. Age lengths, map size and population scale are for later.
- Earth targets are read against the sim's different start (prehistory, crop map, peopling). Don't chase targets made under other conditions.
- "Go ahead": build the whole plan, test it, merge if it passes, write this report.

## Open
- **Decision for Ariel:** switch on td7b as it is? Switches:
  `FX.recv=2, FX.anchor=1, KN.ak=4000, aL=0.3, aI=1, Mb=1, aO=2`.
  - What it gets right: history-sized gaps (23%), the biggest realm first only 43% of the time, turnover kept, more worlds reach steam.
  - What it gets wrong: fewer different leaders (2.0 vs 2.4), a slower steam-to-electricity step, ages 3–5 slightly less even (frontier share down 6 points).
  - My recommendation: not yet. Do Step 4 first, then retest td7b with it.
- **Step 4, next:** a use gap. Railways, electricity and computers would need installed capital, built from surplus and trade, before a district counts as being in that age. Knowledge would still travel fast; use would not. This is the one gate no arm moves (use is 100% everywhere), and it is the likeliest way to get gaps without giant leaders.
- **Lead decay:** look at why a tech lead turns into conquest so easily (war multipliers per age), together with the war owner. This is out of this sprint's scope.
- **Display:** turn on `FX.lagShow` and look at it (towns in their own age, the realm-page line). Then decide whether it stays on.
- **Pace:** the new arms bring steam 100–150 years earlier and at a lower population (about 250m vs 353m). Check this against the age-length work Ariel parked for later.
- **Gate note:** the "≥ 2.4 distinct leaders" gate is the 32-world base value. The 10-world base gives 2.10, so judge it on 32 worlds only.

## For the manager
- New docs:
  - this report;
  - `formicarium-tech-disparity-plan` (in the project now), with a results section;
  - updated `formicarium-tech-disparity-evidence` (Step 0 receipts).
- Updated: `formicarium-backlog` (item 1), `formicarium-game` (knowledge section), `formicarium-lab` (new switches, `gates.py`, the archive-cancel fix), `formicarium-00-start-here` (current state and index).
- **GitHub runs:** the archive step shares one queue, and pending archives get cancelled when more than one waits. Re-run the cancelled ones one at a time with `gh api -X POST repos/<repo>/actions/runs/<id>/rerun-failed-jobs`. Ten worlds take about 15 minutes; 32 take about 30.
- **Calibration numbers for whoever continues:**
  - the world reference (`dkRef`) at print is about 5e4 a year;
  - a leading realm's raw find rate is 4e5–1.5e6 a year at print and steam;
  - town-share ratios between realms run 1–2.7.
