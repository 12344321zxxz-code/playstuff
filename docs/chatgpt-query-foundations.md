I'm building Formicarium, a pixel-art god-game history simulator (browser, JavaScript ES modules). Code: https://github.com/12344321zxxz-code/playstuff, branch `holistic`, folder `src/`. The main files:
- `people.js`: realms, towns and districts, knowledge, cohesion, war strength.
- `tech.js`: ages and arts.
- `trade.js`, `travel.js`: goods and routes.
- `war.js`, `capture.js`: wars, colonies and protectorates.
- `empire.js`: governance, secession, autonomy.
- `hub.js`: Turchin-style elite cycles.
- `migrate.js`, `tongues.js`, `faith.js`, `frontier.js`, `doom.js`: migration, languages and culture, religion, steppe frontiers, nuclear age.

Experiment results (every run with settings and per-world output) are on the `runs` branch, `INDEX.md`.

My design creed: no scripting and no deterministic targets. Outcomes should emerge from interacting systems and each world's starting conditions, and differ between worlds. History-like patterns should fall out of mechanisms, not age-keyed constants.

**The problem.** For two weeks I've been trying to get the simulation into historical ranges, and I keep missing:
- **Who leads technology.** The most populous realm reaches each new age first 55–80% of the time from the gunpowder age on. History says 0–15% after 1450, when small commercial or competitive states led (Venice, Portugal, the Dutch, Britain).
- **Who leads by size.** Realms outside the top three by people and land almost never lead.
- **What we tried**, each with small or no effect on who leads:
  - diminishing returns to a realm's research by size (to the 0.6th, 0.4th, even 0.1th power);
  - limits on how much knowledge a realm can absorb;
  - sharing of discoveries between peers;
  - "fit to the age" (commerce, coal, schools);
  - per-district adoption lags;
  - rivals catching up to each other;
  - cutting the population needed to hold an art.
- **The realm cap.** Raising it from 36 to 54–58 shrank the largest realm from 35–45% of humanity to about 25%. But it slowed the modern ages and cut population.
- **Turnover tuning** earlier showed the same whack-a-mole: blocking one way of breaking up moves the pressure elsewhere.
- **The world itself:** only 11–58 realms exist at any time, and the average realm holds 2–5% of humanity.

I want to reach the historical ranges, and I'm ready to make broad, foundational changes. Separating states from peoples, deeper institutions, and turning trade into a real economy are all on the table, plus anything else that's needed.

**Please do an independent, thorough review of the whole simulation** (read the code) and give me:
1. **The fundamental problems:** what in the foundation (data model, units, feedback loops, how systems scale with population, the single knowledge stock against fixed age thresholds, war strength, missing systems) stops it from producing historical patterns. Rank them by how much they matter.
2. **Missing systems and interactions:** which historical mechanisms and loops the sim lacks. For example the fiscal-military state, inclusive vs extractive institutions, merchant power and credit, factor prices and adoption, technology by domain, defensible geography and state size, the demographic transition, the polity hierarchy (city-states, vassals, unions), nationalism. For each, the evidence it mattered (cite the literature) and what it would do in the sim.
3. **A concrete redesign proposal for each system:** the state model vs peoples, economy, institutions, fiscal-military, war and conquest costs, technology and diffusion, political geography, demography, colonial economy, and anything else. For each:
   - the minimal state variables (per district, per state, per people);
   - the update rules and what they feed into;
   - performance considerations (it runs in a browser web worker, about 20–30 ms per tick for a world of about 500 districts and 40–60 states; updates can be yearly);
   - how it keeps outcomes emergent and different between worlds.
4. **What to drop or simplify** in the current code.
5. **Sequencing:** what order to build in so each step can be validated, and what to measure at each step.
6. **A calibration plan:** the historical targets (with sources and ranges) the sim should hit. Include realm-size distributions over time (largest polity's share of world population, number of polities holding 1%+), technology leadership by polity size, adoption lags, territorial turnover by era, population over time, and urbanisation and income per head across polities. Say how to judge changes against all of them at once.
7. **The single riskiest assumption** in your plan, and how to test it cheaply.

Be specific, take positions, and disagree with my framing where it's wrong. I'll compare your answer with Claude's independent audit and put both before a design council.
