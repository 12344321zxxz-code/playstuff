# Formicarium: audit of stuck rules, size gates and quotas (Nov 3, 2026)

A system-by-system search for rules that block or favour realms categorically:
- size gates;
- world-wide quotas;
- imports that act as ownership;
- resources that can't move;
- switches keyed to the world's age;
- value created from nothing.

"Binding" counts come from one world (seed 12, 2,000 years, branch defaults) and are realm-years or town-years blocked. Each fix sits behind a switch in `src/flags.js` (off during the screens; the confirmed set is on by default since Nov 4) and is scored on the screen runs (`runs` branch, `fs-*`).

## Trade and resources (trade.js, tech.js)

| # | Rule | Effect | Binding | Fix (switch) |
|---|---|---|---|---|
| 1 | Coal is not a traded good; imported coal never counts | A realm without its own coal can never build engines, so it is capped below age 6 | 6,138 realm-years | `FX.coal` |
| 2 | Imported salt (saltpetre) does not count toward gunpowder | No salt or coal in your ground means no gunpowder, ever | (not counted) | `FX.supply` |
| 3 | One caravan counts as owning a metal for 25 years | Supply is never really cut; imports act as ownership | – | `FX.supply` (counts only while loads keep coming) |
| 4 | Towns re-export anything received in the last 25 years | Goods flow along relay chains long after the source dried up | – | `FX.supply` (5 years) |
| 5 | A realm with neither copper nor tin never asks for copper | Copper reaches it only by chance | – | `FX.supply` |
| 6 | Markets capped at the world's top 6 rich towns, entrepôts at the top 12 | Banking needs a market, so it is reserved for the largest | 38,808 town-years kept out | `FX.market` |
| 7 | Watermills need a river district; engines need mills | A realm without a river can never industrialise | 772 realm-years | `FX.mills` (windmills) |
| 8 | Trade creates wealth at both ends of every caravan; relays and tolls create more | Wealth is minted per trip, not moved; it tracks the number of nodes, i.e. size | – | `FX.econ` (a buyer gains a fifth of a load; the seller earns it) plus `FX.fisc` (power from net revenue, not wealth sums) |

## Institutions and government (tech.js, hub.js)

| # | Rule | Effect | Binding | Fix |
|---|---|---|---|---|
| 9 | Written law needs 8 districts | Small states stay lawless however literate | 1,704 | `FX.law` (2 towns) |
| 10 | A civil service needs 20 districts | Small states never get one (and the war and canal effects that hang on it) | 593 | `FX.law` (4 towns) |
| 11 | A council of houses (merchant republic) needs printing and 3 markets, of the world's 6 | A merchant republic is nearly impossible | – | `FX.council` (a market per 8 districts) |
| 12 | The "empire" government form needs a civil service and 20 districts; "modern state" switches on automatically with engines | Government forms follow size and arts, not bargains | – | `FX.inst` (nation needs print, schools and rails or wires; council where trade is a large share of output) |
| 13 | Bronze, iron, counting, the wheel and roads need 3–4 settled districts | Mild size gate on early arts | – | left (minor) |

## War and diplomacy (people.js, tech.js, war.js)

| # | Rule | Effect | Fix |
|---|---|---|---|
| 14 | Cannon make walls worthless for good | No star-fort revolution, so conquest is permanently favoured | `FX.bastion` |
| 15 | Only realms with 3+ districts can join a war as allies | Small states can't join balancing coalitions | `FX.allies` |
| 16 | A conqueror gains 8% of the conquered realm's lead in knowledge | Conquest hands over know-how at once | `FX.know` (no grab; courts learn slowly from more advanced provinces) |
| 17 | Strength is population × multipliers; wealth adds at most +25% | Headcount is power | `FX.fisc` (fisc.js: strength is what net revenue can pay for) |
| 18 | Sacks and robbery create loot for the winner from nothing | Value created from nothing | `FX.econ` (sacks and raids take from the victim's purse) |

## World-wide caps (people.js, war.js, movers.js, faith.js)

| # | Rule | Effect | Binding | Fix |
|---|---|---|---|---|
| 19 | At the realm cap minus 6, breakaways defect to the most populous neighbour, and settler and herder splits are blocked | Ratchets giants upward | 3 in this world; more in others | `FX.cap` |
| 20 | Realm cap of 54–58, keyed to the world's age | The world can't fragment past it | – | `FX.realms` (cap 90 at every age; far realms share colours) |
| 21 | Towns capped at 520 world-wide | Once full, settlers are turned away and land changes hands only by conquest | 4,755 settler parties turned away | `FX.towns` (700; costs about 30% more time per tick) |
| 22 | Travellers capped at 300 (trade and returning armies dropped first) | Negligible at 520 towns; binds at 700 (3,241 caravans dropped) | 25 at 520 towns | scales to 420 under `FX.towns` |
| 23 | Faiths capped at 12 | Narrative cap | – | left |

## Rules keyed to the world's age (scripted world switches)

| # | Rule | Fix |
|---|---|---|
| 24 | Colonisation stops for everyone once the world's leaders reach the bomb age; client-swallowing stops too | `FX.inst`: a power stops taking colonies once its own clients are rising |
| 25 | Decolonisation odds keyed to the world's age (0, 0.01–0.015, 0.07–0.1) | `FX.inst`: by the colony's own literacy and communications |
| 26 | Conquest norm: from the bomb age on, towns of a falling realm never go over to neighbours | `FX.inst`: holds once two or more powers have the bomb |
| 27 | Breakup odds by the realm's own age (×0.6, 0.9, 4, 0.5, 0.15, 0.6, 4, 2.5); industrial states 75% protected from collapse | `FX.inst`: from the court's reach (share of dues received) and a reading, connected foreign public; no industrial protection |
| 28 | Cross-border migration only from the steam age on | `FX.inst`: from the iron age, to open societies |

## Knowledge (people.js)

| # | Rule | Effect | Fix |
|---|---|---|---|
| 29 | Arts below the age of print jump to a merged or conquered district at once (invariance test: a realm two ages behind gets about 5 arts within a year and 20 within five) | Sovereignty teleports know-how | `KN.use = 1` (screen arm `fs-use1`) |
| 30 | Carriers count the realm's population plus trade partners' whole populations | Size gate on holding arts | `FX.know`: carriers are townspeople (scaled) |
| 31 | The engines cap holds knowledge below age 6 until a realm has engines | Age 6 is mostly a coal contest | measure first-use per art (done); revisit with knowledge domains |

## Screen results (Nov 4; 10 worlds each, paired against `fs-base2`; * = 90% interval excludes 0)
- **Kept:** `coal` (age 6 31 years earlier*, coal gate −2,766*), `law` (biggest first at age 5 −0.43*), `market` (distinct first entrants +0.5*), `supply` (biggest first holder of key arts −0.22*, repeat leader −0.24*, land behind −5.7*), misc (`mills`, `council`, `allies`, `bastion`: land behind −3.3*), `towns` (peak population +0.23*).
- **Rejected:** `cap` (largest share +0.03*), `KN.use = 1` (biggest first in ages 6–8 +0.36*).
- **Redesigned:** `fisc` first version made the biggest first holder of key arts more often (+0.30*); rebuilt Nov 4 (towns and trade taxed more easily than fields, agency loss with the layers of officials, credit for councils and banking, herders not floored).
- **Structural set** (`fisc`, `econ`, `know`, `inst` on top of the quick set): distinct first entrants +0.6*, land behind −4.2*, peak population +0.79*, internal turnover +6.8*.
- **Unmoved in every arm:** biggest realm first into ages 6–8 (about 0.38–0.40); 3 of 10 worlds never reach age 6 by 2000.
- **Confirmation (32 worlds, Nov 4):** `cf-struct` (quick set plus structural set) vs `cf-base` + `fs-base2`:
  - biggest realm first into ages 6–8 −0.24* (0.54 → 0.30), the measure no screen arm had moved;
  - distinct first entrants +0.31*, largest realm's share of people −0.06*, industry held by the top realm −0.07*;
  - land 2+ ages behind −5.7*, reached age 8 by 2000 +0.16*, peak population +0.65bn*;
  - steam-age turnover: foreign +5.9*, internal +5.3*;
  - costs: about 48% more time per tick (the larger town cap); breakaways defecting to a neighbour +60 per world (more realms press on the realm cap).
  - `cf-quick` (quick set alone, 27 of 32 worlds): biggest first in ages 6–8 −0.16*, but land behind, population and internal turnover did not move.
- **Decision:** the structural set is on by default from commit 69d30c7, merged to main Nov 4. `cap` stays off; `realms` (cap 90) was tested on the new defaults (`cf-realms`, 32 worlds on GitHub Actions): defections −35* per world, but the biggest realm first holder of key arts +0.05*, biggest first in ages 6–8 +0.10 (not significant) and age 6 17 years later*, so it stays off.
- **Still open:** item 29 (a realm two ages behind that merges into a bigger one gains about 9 arts within 5 years; seed 12, year 1300); pace (about a quarter of worlds never reach age 6 by 2000).

## Status (updated Nov 3, evening)
Every item now has a switch, except 13 (minor early-arts district gates), 23 (the faith cap, narrative) and 31 (the engines cap, which is reasonable once coal trades).

- **Being screened (10 worlds each):**
  - `fs-base`, `fs-coal`, `fs-law`, `fs-market`, `fs-cap`, `fs-all`;
  - `fs-use1`, `fs-supply`, `fs-misc` (mills, council, allies, bastion), `fs-towns`.
- **Then:** confirmation of the winners on 32 worlds, and the decision on targeted vs structural changes.
- **Structural items:** 8, 12, 16–18, 24–28 and 30 go to the redesign (economy, fiscal state, institutions, knowledge on districts).
