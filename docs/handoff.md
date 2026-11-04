# Formicarium: handoff for a new chat (Nov 4, 2026)

Read this first in any new chat on the game. Then read project memory (`areas/god-game.md`, the design decisions) and whichever project docs fit the task.

## How Ariel wants the work done
- **Before diving in:** say what you understood and the plan, briefly, so he can confirm. Answers short and concise.
- **Main status:** say plainly whether work is in `main` (and its commit) every time you report.
- **Branches:** unvalidated work stays on a branch. Merge to `main` only after it is validated on the scoreboard; for sim changes that means the 32-world confirmation.
- **Git:** never `git stash`. Before big changes, keep a backup or archive version so it can be restored. Commits end with the attribution lines the session supplies.
- **Long runs:** run them on GitHub Actions, not on the chat's machine, which shuts down when the chat sits idle. The workflow `.github/workflows/sim.yml` gives one runner per seed and archives to `runs`. `gh workflow run` fails here (no GraphQL); dispatch through REST:
  `gh api -X POST repos/12344321zxxz-code/playstuff/actions/workflows/sim.yml/dispatches -f ref=main -f 'inputs[name]=<name>' -f 'inputs[set]=flags.js:FX.x=1' -f 'inputs[note]=...' [-f 'inputs[seeds]=11-18'] [-f 'inputs[ref]=<branch>']`
  The local `tools/run.mjs` still works for short runs (it freezes the code and resumes).
- **Data:** save every test run to GitHub. `run.mjs` archives to the `runs` branch automatically.
- **Design creed:**
  - no scripting: history-like patterns must emerge from interacting systems and each world's start, and differ between worlds;
  - soft target ranges are fine, forced outcomes are not;
  - prefer holistic fixes over size penalties or tuning knobs.
- **Project docs:** update the matching project doc under `claude/` when a doc in `docs/` changes.

## Where things are
- **Repo:**
  - github.com/12344321zxxz-code/playstuff, cloned at /home/claude/playstuff;
  - Pages deploys `main` (12344321zxxz-code.github.io/playstuff) through `.github/workflows/pages.yml`;
  - working branch `holistic`.
- **Main:** 018af33 (Nov 4). It holds everything: tall, then urban (town and countryside), then holistic (the foundation fixes, on by default).
- **Switches:** `src/flags.js` `FX` (0 restores the old rule); knowledge parameters `KN` live in `src/people.js`.
- **Tools** (`tools/`):
  - `run.mjs`: run seeds and archive them;
  - `board.mjs` / `board-compact.mjs`: scoreboard, paired Δ vs a baseline with a 90% bootstrap; `*` marks a real difference;
  - `headline.mjs`;
  - `invariance.mjs`: does changing only who rules districts change what they know;
  - `turnover.mjs`, `stats.mjs`, `probe.mjs`;
  - tests: `npm test`.
- **Run outputs:**
  - while running: `/tmp/claude-0/sc/<name>/out/b<seed>.json`, which only exists on the old chat's machine;
  - archived: the `runs` branch, `runs/<date>-<name>/`.
  - Standard seeds: 11–18, 31–38, 51–58, 71–78 (32 worlds); screens use 10.
- **Docs** (`docs/` in the repo, mirrored to the project):
  - stuck-rules-audit;
  - foundations-audit;
  - foundations-council;
  - chatgpt-query-foundations.

## State of the work
- **Play-tall/foundations result** (32 worlds, `cf-struct` vs old rules):
  - biggest realm first into ages 6–8: 0.54 → 0.30;
  - more distinct leaders, and a smaller largest realm;
  - land 2+ ages behind −5.7 points;
  - more worlds reach age 8;
  - peak population +0.65bn;
  - more steam-age turnover.
- **Running at handoff:** `cf-realms` (on GitHub Actions), the realm cap at 90 on the new defaults, to remove +60 defections per world. Score it with `board-compact.mjs` against `cf-struct` (archived on `runs`). If it holds, set `FX.realms: 1`, run the tests, merge.
- **Open:**
  1. Item #29: a realm two ages behind that merges into a bigger one gains about 9 arts in 5 years (`invariance.mjs 12 1300 --merge --behind`).
  2. Pace: about a quarter of worlds never reach age 6 by 2000.
  3. Speed: each tick costs about 48% more (the 700-town cap); check how it feels in the browser.
  4. Tech-disparity benchmark: compare against real data (the research report, ChatGPT "Global technology inequality 3000 BC–2000 AD"; get the real file). Ariel saw little tech disparity in one world.
- **Queue after that** (from memory): magic overhaul; bigger map (Earth's size) and better continents; trade and logistics overhaul; EU-style political map.
