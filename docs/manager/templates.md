# Formicarium: templates for worker chats

## Worker brief (the manager writes this; Ariel pastes it into a new chat)

```
# Formicarium worker brief: <topic> (<date>)

You are a worker chat on Formicarium, a god game (github.com/12344321zxxz-code/playstuff, live at
12344321zxxz-code.github.io/playstuff). Before anything else, read from the project:
claude/formicarium-00-start-here.md, claude/formicarium-lab.md, and: <other docs for this task>.
Ignore docs that are not about Formicarium.

## Goal
<one or two sentences: what should be true when you are done>

## Context
- Main is at <commit>. Work on a new branch `<branch>` from main.
- <what has been tried, the relevant numbers, Ariel's decisions that bind this work>

## Scope
- In: <...>
- Out: <... — don't touch>

## Constraints
- The creed (formicarium-game section 1): no scripting, holistic fixes, worlds must differ.
- New mechanisms go behind an FX switch until they pass the scoreboard; long runs on GitHub Actions.
- Say briefly what you understood and your plan before building; keep messages short; state the main status.

## Done means
- <measurable: e.g. "biggest first ages 6–8 ≤ 0.30 on 32 worlds with no loss of pace", or "a design doc Ariel approves">
- A post-action report written to the project (template in formicarium-templates), and formicarium-game /
  formicarium-backlog updated if systems or open items changed.
```

## Post-action report (the worker writes this at the end, to `claude/formicarium-report-<yyyy-mm-dd>-<topic>.md`)

```
# Formicarium report: <topic> (<date>)

**Main:** <merged at <commit> | not merged, on branch <branch> at <commit>>

## What changed
- <mechanisms and features, in plain words; the FX switches added and their defaults>

## Results
- <scoreboard numbers vs baseline (run names on the runs branch), with * for real differences>
- <what Ariel saw or decided>

## Decisions Ariel made
- <in his words where possible>

## Open
- <what is left, new problems found, ideas not built>

## For the manager
- <docs updated; backlog items closed or added; anything the next worker must know>
```
