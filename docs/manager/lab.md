# Formicarium: the lab (how to test, run and save experiments), Nov 4, 2026

## The code
- **Repo:** github.com/12344321zxxz-code/playstuff. In a chat machine it lives at `/home/claude/playstuff` (clone it if it's missing).
- **Branches:**
  - `main` is the live game;
  - `holistic` is the latest working branch (level with `main` on Nov 4);
  - `runs` holds every experiment's data;
  - `backup/*` and old slice branches are history. Make a backup branch before any big change.
- **Simulation:** `src/` (people.js is the core, about 1,100 lines; tech.js, war.js, trade.js, fisc.js, hub.js and empire.js matter most for balance).
- **Switches** (`src/flags.js`):
  - `FX` holds one switch per fix. On by default: coal, law, market, supply, mills, council, allies, bastion, towns, fisc, econ, know, inst.
  - Off by default: `cap` (rejected) and `realms` (cap 90, tested and kept off). Setting one to 0 restores the old rule.
  - Knowledge parameters `KN` live in `src/people.js`.
  - A new fix goes in behind a new `FX` switch, off, until it passes the scoreboard.

## Running worlds
- **One world:** `node tools/stats.mjs <seed> <years> [patch.json]` prints one JSON line of everything measured. The patch format is `{ "flags.js": { "FX.realms": 1 } }`.
- **Smoke test:** `npm test` runs one world for 800 years and prints the chronicle. Run it before every merge.
- **Batches on GitHub Actions** (the default for anything long). The workflow is `.github/workflows/sim.yml`:
  - one runner per seed, about 20 at a time; 32 worlds of 2,000 years take about 1.5–2 hours;
  - dispatch it with the REST call below, because `gh workflow run` fails from chat machines (no GraphQL):
    ```
    gh api -X POST repos/12344321zxxz-code/playstuff/actions/workflows/sim.yml/dispatches -f ref=main \
      -f 'inputs[name]=<run-name>' -f 'inputs[set]=flags.js:FX.x=1,people.js:KN.lam=0.1' -f 'inputs[note]=<what it tests>' \
      [-f 'inputs[seeds]=11-18,31-38'] [-f 'inputs[years]=2000'] [-f 'inputs[ref]=<branch or commit>']
    ```
  - follow it with `gh api repos/12344321zxxz-code/playstuff/actions/workflows/sim.yml/runs --jq '.workflow_runs[0]'`;
  - when it finishes it archives to `runs/<date>-<name>/` on the `runs` branch by itself, and retries the push.
- **Scoring tech-disparity arms:** `python3 docs/research/tech-disparity/gates.py <base dir> <arm dir> ...`
  - each dir holds the `b<seed>.json` files of a run, extracted from `runs`;
  - it prints every gate of `formicarium-tech-disparity-plan`;
  - compare on the same seeds: the 10-world screen seeds are 11–18 and 31–32.
- **Tech-disparity switches** (all off on main):
  - `flags.js:FX.recv` (1/2) with `people.js:KN.M` / `KN.Mb`;
  - `FX.anchor` (1/2) with `KN.ak, aL, aI, aO, aS, ak4`;
  - knock-outs `KN.meet` and `KN.prov` (0 = off);
  - `FX.lagShow` (display).
  - The best candidate is td7b: `FX.recv=2, FX.anchor=1, KN.ak=4000, aL=0.3, aI=1, Mb=1, aO=2`.
- **Batches locally** (short runs only): `node tools/run.mjs <name> --seeds ... --set ... --note ...`.
  - It freezes a copy of the code at launch, resumes interrupted runs and archives to `runs`. It needs the `runs` worktree at `../playstuff-runs`.
  - A chat machine has 2 cores and **shuts down when the chat sits idle**; long local runs die with it.

## Reading results
- **Get an archived run:**
  ```
  git fetch origin runs:refs/remotes/origin/runs
  git archive origin/runs runs/<date>-<name> | tar -x -C <dir> --strip-components=2
  ```
  The `runs` branch has `INDEX.md` and `index.json`, one line per run.
- **Scoreboard:**
  - `node tools/board-compact.mjs <baseline dir> <arm dir> ...` gives one line per metric and each arm's paired difference against the baseline on shared seeds. `*` means the 90% bootstrap interval excludes 0.
  - `tools/board.mjs` gives the full intervals.
  - `tools/headline.mjs` puts headline numbers side by side.
- **Other tools:**
  - `tools/turnpool.mjs` and `turnover.mjs`: land turnover per age vs targets;
  - `tools/devpool.mjs` and `devmeter.mjs`: tech spread, land behind, deployment lags;
  - `tools/invariance.mjs <seed> <year> [--merge [--behind]]`: does changing only who rules some districts change what they know? It should not;
  - `tools/probe.mjs` and `q.mjs`: read a running world as data;
  - `tools/lever.mjs`: geography census.
  - `tools/bench2.mjs` (inside `stats.mjs`, Nov 4), from the blind-spots audit:
    - `cent2`: people behind with each district split by town share; realm-map and catchment coverage of habitable land; herders and other bands;
    - `lag10`: decade sampling from the age of print;
    - `ageEntry`: the year and people when the frontier enters each age;
    - `contact` and `geo`: landmass contact timing and isolated landmasses.
  - `tools/peopling.mjs <seed> <years>`: peoples, families per landmass, who is behind (by family, landmass and tie), minority-ruler realms.

## Seeds and baselines
- **Seeds:** 11–18, 31–38, 51–58, 71–78 for confirmation (32 worlds); 10 worlds (11–18, 31–32) for screens.
- **Current-defaults baseline:** `runs/2026-11-04-b2-base` (32 worlds, main dec8f1f). It is identical to `cf-struct` in every older field and adds the `bench2` measurements. Compare new arms against it, or re-run a baseline on the same commit.
- **Old-rules baseline:** `fs-base2` plus `cf-base` (all switches off).

## The scoreboard on the current defaults (cf-struct, means over 32 worlds)
| Metric | Value |
|---|---|
| biggest realm first into ages 6–8 (share of entries) | 0.36 |
| biggest realm first into age 5 | 0.89 |
| realm outside the top 3 (people and land) first, 6–8 | 0.15 |
| first holder of key arts was the biggest | 0.33 |
| distinct realms first into ages 4–9 | 2.4 |
| same realm first into consecutive ages | 0.37 |
| size–knowledge rank correlation, ages 5–8 | 0.69 |
| largest realm's share of people, ages 5–8 | 0.23 |
| realms with 1%+ of people, ages 5–8 | 14.6 |
| land 2+ ages behind, ages 5–8 | 18% |
| urban share of people, ages 6–8 | 0.39 |
| year into age 6 (mean) | 1488 |
| reached age 6 / age 8 by 2000 | 78% / 69% |
| peak population | 3.4bn |
| steam-age turnover, foreign / internal | 31% / 24% |
| breakaways turned into defections, per world | 92 |

Note: "biggest first, ages 6–8" scored 0.30 when this run was set against the old rules' worlds. The 0.36 here is this run's own mean.

Real-world targets live in `formicarium-foundations-audit` section 5, `formicarium-tall-and-tech-spread` and `formicarium-turnover-status`.

## How a change is judged
1. Build it behind an `FX` switch (off).
2. **Screen** on 10 worlds against a baseline on the same commit.
3. **Confirm** the winners on 32 worlds.
4. Judge the **whole board**: leadership, pace, population, turnover, land behind and tick cost together. Fixes that lower big-realm dominance often slow the world; judge at matched pace and population.
5. If it passes: switch it on by default, run `npm test`, merge to `main`, and record the result in the doc it belongs to.

## Lessons learned
- **Same-commit baselines:**
  - a baseline run on an older commit drifted 6–8 points from the same settings at the current commit;
  - always compare against a baseline from the same code (the archive's `meta.json` records the commit).
- **Measurement:**
  - pooling ages inflates "biggest first" (dropping age 5 alone moved one baseline from 0.58 to 0.48);
  - noise on headline numbers is about ±0.1 on 10–16 worlds, so use 32 for decisions;
  - tick time (`ms per tick`) is not comparable between GitHub runners and the chat machine.
- **Feedback loops:** each fix that dampens one link of a loop gets compensated by the rest (turnover in October, play tall in November). Look for the gate or ratchet behind a pattern before tuning; the stuck-rules audit found 31.
- **Gates:** a size threshold that is never reached is invisible on the board. Log how often each gate binds (`stats.mjs` records `gates`).
- **Chat machine:**
  - it shuts down when the chat is idle, so long runs go to GitHub Actions;
  - `pkill -f <pattern>` can kill your own shell if the pattern appears in the command; kill by process ID instead;
  - this clone needs explicit refspecs to see remote branches (`git fetch origin main:refs/remotes/origin/main`, the same for `runs`).
- **Git:**
  - never `git stash`;
  - long local runs launch detached (`setsid nohup ... &`) from the frozen copy;
  - don't edit `src/` between queuing a local run and its launch, since it freezes whatever is there.
- **Archive cancellations:** the archive job runs in one concurrency group. If several runs finish together, a waiting archive can be cancelled. The worlds are safe as artifacts for 7 days, but this machine can't download artifacts (the storage host is blocked). Re-run the archive with `gh api -X POST repos/12344321zxxz-code/playstuff/actions/runs/<id>/rerun-failed-jobs`. Better: space out dispatches, or check every run's archive job.
- **Read targets with `formicarium-earth-vs-sim-blind-spots`** before comparing the sim with Earth.
- **ChatGPT reports:** a docx from ChatGPT may hold only a link into ChatGPT's own sandbox. Ask Ariel for the real file or the pasted text. Share links (`chatgpt.com/share/...`) can't be read by fetch.
- **Many runs at once (Nov 4):**
  - GitHub runs about 20 worlds at a time, so ten 10-world screens finish in about 25 minutes;
  - the archives of runs that finish together get cancelled. Re-run each cancelled one with `gh api -X POST repos/12344321zxxz-code/playstuff/actions/runs/<id>/rerun-failed-jobs`, one at a time, after the queue is empty.

