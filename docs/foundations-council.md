# Council verdict: Formicarium foundations (Nov 3, 2026)

**Inputs:** Claude's audit (docs/foundations-audit.md), ChatGPT's independent audit, and the code.

**Seats:** systems designer, economic historian, engineer, player advocate, devil's advocate. All five are Claude, so the panel may have converged too easily.

**Average rank in the anonymous cross-review (1 = best):**

| Seat | Average rank |
|---|---|
| Systems designer | 1.6 |
| Devil's advocate | 2.2 |
| Historian | 3.0 |
| Engineer | 3.2 |
| Player advocate | 5.0 |

## Verdict
Don't start the big rewrite yet. First run one cheap, decisive test. In run z1 research is already almost size-flat, yet big realms still lead. That points at a handful of hard-coded size rules and ratchets at least as much as at the architecture.

So the order is:
1. Build the testing bench.
2. Fix the verified size gates and the ratchet, behind flags.
3. Log two "shadow" calculations that don't change the sim.
4. Decide by a rule agreed in advance whether to go structural.

If we go structural, start with net fiscal revenue (power paid for, holding land costs money), not with splitting states from peoples.

## Verified code facts behind this
- **Coal can't be traded** (trade.js has no coal good), so a realm without coal of its own can never build engines. Without engines, knowledge is capped just below age 6.
- **Size gates on institutions:** written law needs 8 districts, a civil service needs 20.
- **Markets are capped at the world's top 6 towns** and entrepôts at the top 12. Banking needs a market.
- **The cap ratchet:** at the realm cap (minus 6), a would-be breakaway defects to the most populous neighbour (people.js:754).
- **Cannon permanently beat walls** (`wallsAgainst`). There is no fortification revolution (bastions), so the code favours the conqueror.
- **Conquest hands over knowledge:** a conqueror gains 8% of the conquered realm's lead in knowledge.
- **The measurement:** pooling ages 5–8 inflates "biggest first". Dropping age 5 alone takes z1 from 0.58 to 0.48. And 11–20 correlated events gives noise of about ±0.12.
- **"Wins" cost pace:** across 29 archived runs, a lower biggest-first share went with a lower peak population (r = 0.47) and a later age 8 (r = −0.37). Fixes must be judged at matched pace and population.

## Top ideas
1. **Gate bound test (devil's advocate; voted the best idea by two members).** Flags:
   - coal importable as a real traded good;
   - law and civil service gated by towns or literacy, not district count;
   - local thresholds for markets and entrepôts.

   Run 32 paired worlds against z1, full runs. Pre-registered rule:
   - ages 6–8 biggest-first ≤ 0.35 and outside-top-3 ≥ 0.2: targeted fixes;
   - biggest-first still ≥ 0.45: structural change.
2. **Fix the cap ratchet (systems designer):**
   - colour realms by neighbourhood (graph colouring);
   - set the cap for performance only (about 120);
   - no defecting to the biggest neighbour.

   This is the only lever that has ever moved the numbers.
3. **Net revenue as power (systems designer + historian).** Per district: surplus × collection efficiency − holding cost. Efficiency comes from the travel graph, tongue, and a 10–30-year integration ramp after conquest. Treasury and credit have decay and limits. The army fielded is the smaller of manpower and what money can pay for. The same net figure drives secession.
   - Prerequisite: trade must transfer value instead of minting it at both ends. Otherwise wealth just re-encodes headcount.
4. **Shadow observers.** No effect on the sim and no random draws, so runs stay identical:
   - a district-local "who crosses the next age first" (ChatGPT);
   - the rank correlation of realm population vs realm net revenue (R).

   Kill rule: if that correlation is above 0.85, rethink the fiscal design before building it.
5. **The bench (engineer):**
   - snapshot forks, but only for mechanisms that act after the fork; gates acting before year 1000 need full runs;
   - a noise floor from reseeded replicas;
   - bootstrap confidence intervals, paired deltas;
   - continuous metrics first;
   - p95 tick time;
   - a panel of pace and population next to every leadership number.
6. **History-grounded additions (historian):**
   - bastion forts as an art;
   - military innovation pushed by the kind of enemy (walled peers vs riders);
   - re-target "who leads" as high capacity per head under competition, with leaders rotating (at least 3 different leaders across ages 5–9), not "small states lead".

## Real disagreements
- **When to split states from peoples.** The user asked for it. The council unanimously ranked it last for now:
  - nothing measured shows it moves who leads;
  - it touches about 620 references;
  - tongues already live on towns, and vassals already exist (`c.over`).

  The engineer's cheap path: treat `cult` as the state and move knowledge and wealth off it behind shims. The player advocate says it matters for readability (Italy/Germany-style maps, Babel), but only with bloc-level map and chronicle aggregation.
- **Revenue-paid armies now (historian) vs after the bench and trade accounting (engineer).** Wealth is currently minted per caravan, so a revenue proxy would just re-encode headcount.
- **How much the gates explain.** The devil's advocate bets on the gates. The systems designer and historian bet on loops and conquest. The bound test settles it.

## What everyone missed (from the cross-review)
- **Nothing wears down a leader.** Rising costs (wages, debt, overstretch) and the latecomer's cheap copying (Gerschenkron) are missing.
- **The ages bundle different things.** Engines sit at tier 5 with printing and gunpowder, so "first into age 6" mostly measures who owns coal.
- **Retire the old brakes.** Each new mechanism should name the correction patches it replaces and be scored with them off: `lam`/`dkRef`, `M`, `pull`, `fresh`, `fitP`, the engines cap, the cap-tied breakaway blocks.
- **Every mechanism needs a chronicle line** (player advocate), and god-tools work as free causal probes on paired forks.
- **The live Pages build auto-deploys,** so flags stay off on main until a change passes the bench.

## Riskiest assumption
That the leftover big-realm bias is an artefact of the model (gates, ratchets, architecture), not geography. The giant might lead because it holds the world's densest network. The bound test plus the shadow observers test this.

## Cut or deferred
Deferred:
- the states/peoples split (unless the user wants it for readability and nationalism);
- knowledge domains;
- a full price economy;
- the demographic transition;
- institution sliders (model who gets the trade rent instead);
- a new war engine.

## Next step (this week)
1. Bench v1 with full runs and the new firstTo fields: own coal, ties, bureaucracy.
2. The gate bound test plus the cap-ratchet fix, scored on ages 6–8 separately, with confidence intervals, and on the pace and population panel.
3. Shadow observers riding along on the same runs.
