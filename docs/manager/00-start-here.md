# Formicarium: start here (manager chat)

Last updated Nov 4, 2026 (evening). This is the entry point for the **manager chat**: the one chat that sees everything about Formicarium and hands work out to worker chats. The "games" project also holds other games; ignore them, and ignore any doc whose name doesn't start with `formicarium-`.

## How the work is organised
- **Manager chat:**
  - holds the docs below and every worker report;
  - keeps the backlog in order and decides what comes next;
  - writes a **worker brief** (template in `formicarium-templates`) whenever Ariel opens a new chat for a sub-project;
  - does not do long builds or runs itself, so its context stays clean.
- **Worker chats:** one per sub-project, in the same project.
  - Start by reading the brief, then `formicarium-00-start-here`, `formicarium-lab` and the docs the brief names.
  - Finish by writing a **post-action report** (template in `formicarium-templates`) to the project as `claude/formicarium-report-<yyyy-mm-dd>-<topic>.md`.
  - When a worker changes a game system, it also updates `formicarium-game`. When it closes or opens backlog items, it updates `formicarium-backlog`.
- **Keeping docs current:** after reading new reports, the manager folds the outcomes into `formicarium-game` and `formicarium-backlog`. Reports stay as the history.
- **Memory:** every chat in the project also sees project memory (`areas/god-game.md`, Ariel's design decisions, in his words) and his general preferences. It is filled automatically. Write to it only when Ariel asks.

## How Ariel wants the work done
- **Before diving in:** say briefly what you understood and the plan, so he can confirm, then do it.
- **Answers:** short and concise. Use plain language over jargon.
- **Main status:** every report says plainly whether the work is in `main` and at which commit.
- **Validation:**
  - unvalidated work stays on a branch;
  - merge to `main` only after it passes the scoreboard (sim changes: 32 worlds, see `formicarium-lab`);
  - `main` publishes the live game automatically.
- **Git:**
  - never `git stash`;
  - before big changes, keep a backup or archive branch so the old version can be restored;
  - commits end with the attribution lines the session supplies.
- **Data:** every test run is saved on GitHub (the `runs` branch). No experiment should ever need re-running for lack of data.
- **Design creed:** see `formicarium-game`, section 1. In short:
  - no scripting: patterns emerge from interacting systems and differ per world;
  - holistic fixes over penalties and knobs;
  - historical ranges as soft targets.
- **Council:** for big design questions he likes an "LLM council": several roles, independent answers, anonymous cross-review, a chaired verdict. Sometimes ChatGPT does an independent review too.
- **Research:** he runs deep-research queries (often in ChatGPT) for real-world benchmarks and attaches the reports. Treat them as targets, not scripts.

## Current state (Nov 4)
- **Main:** the game code as of 4b58338 (later commits are docs only). It holds everything from Oct–Nov:
  - the war overhaul;
  - borders and the political map;
  - population;
  - turnover and colonial work;
  - town and country;
  - play tall;
  - the foundations fixes (on by default).
- **Live game:** https://12344321zxxz-code.github.io/playstuff (published from `main` by `.github/workflows/pages.yml`).
- **Repo:** github.com/12344321zxxz-code/playstuff; working branch `holistic`, now level with `main`.
- **Tech disparity (Nov 4):**
  - main also holds the tech-disparity measurements and mechanisms, all switched off (the game plays as before);
  - the best arm gives history-sized modern gaps but fails three gates (distinct leaders, pace, use gap);
  - see `formicarium-report-2026-11-04-tech-disparity-build`.
- **Latest result:**
  - the biggest realm is now first into ages 6–8 about 30% of the time (was 54%);
  - more realms lead, and less land sits two or more ages behind;
  - more worlds reach age 8 by 2000, and peak population is higher;
  - details in `formicarium-stuck-rules-audit`.

## The docs
| Doc | What it is | Status |
|---|---|---|
| `formicarium-00-start-here` | this page: how the work runs, rules, index | current |
| `formicarium-game` | the creed; every system, what's in, what's not, what Ariel wants | current, the main reference |
| `formicarium-lab` | how to test: switches, tools, scoreboard, GitHub runs, lessons learned | current |
| `formicarium-backlog` | open items and queued sub-projects, in order | current |
| `formicarium-templates` | worker brief and post-action report templates | current |
| `formicarium-report-*` | worker reports, newest last | history |
| `formicarium-tech-disparity-plan` | the tech-disparity plan (Steps 0–4, gates, stop rule) and its Nov 4 results | current; Step 4 next |
| `formicarium-tech-disparity-evidence` | knock-outs, Step 0 receipts, splits | reference |
| `formicarium-earth-vs-sim-blind-spots` | where Earth targets mean something else in the sim (A–R) | reference; read before comparing with Earth |
| `formicarium-stuck-rules-audit` | 31 size gates, quotas and world-age switches, the fixes, the 32-world results | current reference |
| `formicarium-foundations-audit` | why the sim missed historical ranges; the structural problems; historical targets (section 5) | reference; part done, part backlog |
| `formicarium-foundations-council` | council verdict of Nov 3 (bench first, gates and fiscal state before states vs peoples) | history; followed |
| `formicarium-tall-and-tech-spread` | play-tall measurements, real tech-diffusion targets, the "know vs use" build | reference; numbers before the foundations fixes |
| `formicarium-turnover-status` | land turnover per age vs history (Oct 31), what was built, parked levers | reference; turnover work parked |
| `formicarium-magic-and-history` | Oct 12 design: Guns-Germs-and-Steel geography, magic as memory, trade, tech eras, nuclear age | history; magic parts superseded by Ariel's later answers (see `formicarium-game` section 9) |
| `formicarium-design` | Oct 7 v1 design notes: the chain of causes, module map, early decisions | history; still the best picture of the cause chain |
| `formicarium-2-brief` | Oct 8 brief for a TypeScript rebuild | history; the rebuild was abandoned Oct 9 for the v1 core |

The repo copies live in `docs/` (these manager docs in `docs/manager/`). The project copies are what chats read.
