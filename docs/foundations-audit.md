# Formicarium: foundations audit (Nov 3, 2026)

Why the simulation keeps missing historical ranges, and everything that would have to change to reach them. Written after two days of trying to make "playing tall" viable and big realms less overpowered. Code: branch `holistic` of github.com/12344321zxxz-code/playstuff (`src/`). Every experiment, with its settings and per-world output, is on the `runs` branch (`INDEX.md`).

## 1. The evidence

What we tried, all measured on 8–32 worlds of 2,000 years each:
- **Knowledge-side fixes** gave small or no change in who leads:
  - town-weighted research;
  - diminishing returns to a realm's size (to the 0.6th, 0.4th and 0.1th power);
  - limits on how much a realm can absorb, and sharing of discoveries between peers;
  - fit to the age (trade, coal, schools);
  - rivals catching up to each other's knowledge;
  - carrier thresholds cut to a fifth;
  - per-district adoption of the age's arts.
- **The biggest realm still reaches each age first** about 55–80% of the time from the gunpowder age on. History says about 0–15% after 1450.
- **Raising the realm cap** from 36 to 54–58 and making size cost cohesion was the largest change:
  - the largest realm's share of humanity fell from 35–45% to about 25%;
  - realms holding 1%+ of people rose from 10 to 14–16;
  - but the modern ages slowed down and population fell.
- **Pulling rivals' knowledge together** helped the biggest realm more, because it has the most trade ties.
- **The same pattern appeared in October's turnover work:** blocking one way of breaking up moved the pressure to another.

Each fix dampens one link of a feedback loop, and the rest of the loop compensates. That points to the foundation, not to tuning.

## 2. Structural problems

### 2.1 One object is a people, a state, a knowledge pool, an army and a culture
- A "cult" (`w.cults`, `newCult` in people.js) is all of these at once:
  - an ethnic people with a tongue and culture;
  - a sovereign state with a capital, ruler and cohesion;
  - one knowledge stock;
  - one army (`strength`);
  - one economy (surplus, wealth);
  - one unit of collapse.
- So a state cannot be multi-ethnic without being one "people". A people cannot be split across states without becoming new peoples. City-states, leagues, principalities, vassal hierarchies, personal unions and federations have no representation.
- Breakaways create new peoples.
- Tongues and culture already live on towns (tongues.js), which is a start.

### 2.2 Far too few polities
- **How many:** 11–30 realms for most of history, at most 36 until the age of wires (the realm cap in war.js, plus splits blocked at cap − 6). The map has 64 colour slots, so even the raised cap stops at 58.
- **How big:**
  - The average realm holds 2–5% of humanity, and the top three often 60–97%.
  - The historical leaders were 0.1–2% (Venice, Portugal, the Dutch Republic, Britain around 1800).
  - Europe in 1500 had hundreds of polities.
- **Effect:** a state small enough to "play tall" is a rounding error with no army, no carriers and no research. The resolution makes the target story nearly impossible.
- **Worse, at the cap:** a would-be breakaway defects to a neighbour, often the giant itself.

### 2.3 Headcount is the currency of almost every system
All of these scale roughly with population times multipliers:
- **Research:** finds are summed over districts by population.
- **Carriers:** holding an art needs carriers counted in people.
- **War:** strength is roughly people × tech × wealth × cohesion × arms.
- **Food and growth.**
- **Elite posts:** the hub.
- **Conquest:** it adds people.

These form one positive loop:

> technology lead → harvest boom → more people → bigger army → conquest → more people and research → the next lead.

There is no counterweight of comparable strength:
- **Cohesion size penalty:** only −count/300, now −count/180.
- **Orthodoxy:** only bites when a realm has no peers.

Per-head differences between realms are tiny. In ages 5–6, urban shares are about 10–20% everywhere and trade intensity saturates. So output follows headcount.

### 2.4 There is no economy, only food and goods
- **Trade** (trade.js) moves materials with real effects: tin makes bronze, grain feeds cities, horses make riders. Entrepôts collect tolls (`s.wealth`).
- **What's missing:**
  - production value and income per head;
  - prices, capital and credit;
  - taxes, a treasury, budgets and debt as a state resource. There are loans in the colonial "loaded spring", but not as fiscal capacity;
  - a merchant class with interests;
  - specialisation beyond "makes what its land gives".
- Wealth enters war only as `1 + min(0.25, wealth/400)`.
- So the commercial path (Venice, the Dutch, England) has no mechanism. A small rich state can't hire armies, build fleets, borrow or out-invest a big poor one.

### 2.5 Institutions are thin
- **What exists:**
  - cohesion (a target built from named pressures);
  - the hub (Turchin elite cycles: elites, posts, extraction X, authority A);
  - empire reach-efficiency (empire.js);
  - orthodoxy in peerless courts;
  - laws (+0.06 cohesion);
  - faith's hold.
- **What's missing:**
  - **Inclusive vs extractive institutions** (Acemoglu–Robinson): who holds power (monarch, nobles, merchants, assemblies), property security, the rule of law, constraints on rulers.
  - **State capacity**, growing through tax administration and war (Tilly, Besley–Persson).
  - **The fiscal-military ratchet:** wars among peers force administrative and financial innovation.
  - **Merchant voice** pushing for trade, credit and innovation.
  - **Critical junctures:** plagues and conquests that reshape who holds power.
  - **Institutional drift and diffusion:** copying successful neighbours.
- In the sim, institutions don't decide how knowledge is adopted, how wealth is extracted or whether innovation is permitted, except through orthodoxy and the new adoption rate.

### 2.6 Technology is one number against fixed lines
- `c.know` is checked against absolute `TECH` thresholds for ages 1–10. Arts are gated by `c.tech ≥ tier`, plus requirements, local inputs and carriers.
- **No domains:** there is no separate naval, financial, military or industrial leadership. One total favours whoever has the most researchers.
- **Diffusion:** gap-proportional pull (`meet`), sharing of yearly finds (letters), migrants, conquest and ruins.
- **Ages are a global scaffold:** many systems key on the integer age (breakup odds by age, colonial windows, carriers, the industrial-collapse block). Calibrating per age risks scripting.
- **New on the branch:**
  - "know vs use": districts adopt the age's arts with a lag;
  - per-district knowledge levels;
  - fit to the age.

### 2.7 War and conquest favour mass and are cheap to hold
- Strength is proportional to population. There are mobilisation levels, sieges, supply and foraging.
- **What's missing:**
  - armies paid from a treasury;
  - professional vs levy forces;
  - the fortification revolution (trace italienne) making conquest of small fortified states expensive;
  - occupation and holding costs that scale with foreignness and distance;
  - naval power as a separate projection system with its own economy.
- Conquest adds people and land almost immediately and permanently, unless cohesion or a later revolt undoes it.

### 2.8 Political geography barely limits scale
- Distance and terrain affect ties (`s._tie`), reach (`c.span`, `reachR`) and supply.
- But there's no explicit "defensible core" (mountains, islands, marshes). So geography that historically fragmented Europe and unified China doesn't produce different political structures by itself.

### 2.9 Demography is coupled to the pace of technology
- Growth is logistic toward a food cap. Modern arts lift the cap (`boomOf`) and growth (sanitation, railways). There's a modern fertility drop via computers and networks.
- The peak population depends mostly on how early the industrial arts arrive. Every change to the pace of technology moves population.
- Once industrial, worlds plateau around 3.5bn (cap/pop stays about 1.3–1.5). Losses balance growth, so the 7–11bn aspiration needs a look.
- There's no demographic transition tied to income, urbanisation or schooling.

### 2.10 Calibration method
- One test is 8–16 worlds × 2,000 years, about an hour on 2 cores. Noise on headline numbers is ±0.1.
- Targets were chased one or two at a time, and fixes broke other targets (turnover, population, pace).
- There's no single scoreboard of all historical targets, no runs started from saved mid-history worlds, and too few worlds.
- **Fixed today:** every run is now archived with its settings and full output.

## 3. Missing interactions (the loops history runs on)
1. **Fiscal-military competition:** peer wars → need money → taxes, credit and administration → state capacity → stronger and richer state. Small competitive states ratchet; a lone hegemon doesn't.
2. **Commerce:** trade → towns → merchant wealth and voice → secure property and credit → more trade, invention and adoption (Dutch, Venice, Britain).
3. **Extraction:** a big conquering state → extractive elites → low investment and innovation, revolts → stagnation or breakup (Ottoman, Mughal, Qing late).
4. **Tournament:** rivals within reach → pressure to adopt military and fiscal innovations → diffusion among peers, not to isolated giants (Hoffman).
5. **Exit:** fragmentation lets people, capital and ideas leave a repressive court for a rival (Huguenots, Dutch printers).
6. **Geography and state size:** defensible cores and coasts sustain many states; open plains favour unification.
7. **Wealth and technology:** high wages and cheap energy (coal) make labour-saving machines pay (Allen). Adoption depends on factor prices, not just knowledge.
8. **Debt and power:** credit lets small rich states punch above their weight; default and debt crises break them.
9. **Colonial economy:** colonial extraction and trade revenue feed the metropole's treasury; colonies need the treasury and navy, not headcount.
10. **Ideas and legitimacy:** print, reformation and ideology change who rules and what is allowed, interacting with institutions.

## 4. Proposed changes by system (to be weighed by the council)

### A. States separate from peoples
- **Peoples (ethnic and cultural communities, carried by towns)** keep tongue, culture and faith.
- **States** are political units over districts, with a hierarchy:
  - sovereign;
  - vassal or client;
  - autonomous city;
  - league member;
  - personal union.

  A state can be multi-ethnic. A people can live under several states.
- **More, smaller states:**
  - the cap set by performance, not by colours;
  - colours chosen by neighbourhood (graph colouring), so more than 64 states are possible;
  - city-states as a normal outcome of commerce plus defensible terrain.
- **Breakaways** create states, not peoples.
- **Nationalism** (people ≠ state) becomes a pressure in the modern ages.

### B. An economy
- **Per district:** output (farm, craft, trade, industry), income per head, a surplus split between producers, elites and the state.
- **Prices:** coarse, regional, for grain, goods and labour. Wages and energy costs then decide whether machines pay.
- **Merchant capital** in towns and entrepôts. Credit markets, interest rates and public debt.
- **Trade value**, not just materials: routes carry value and profits accrue to traders and states.

### C. Institutions
- **Per state, a few slow-moving variables:**
  - who holds power: crown / nobles / clergy / merchants / assembly;
  - property security;
  - tax capacity;
  - constraints on the executive;
  - openness to novelty (replacing orthodoxy).
- **What moves them:** wars (the fiscal ratchet), plagues (labour scarcity), trade wealth (merchant voice), conquest (extractive drift), elite cycles (the hub), and imitation of successful neighbours.
- **What they change:** extraction rate, investment, adoption speed, innovation, credit costs, revolt risk and army quality.

### D. Fiscal-military states
- Armies and navies paid from revenue and credit. Levies vs professionals; naval power separate.
- Holding conquests costs revenue and garrisons, more for foreign and far land.
- The fortification revolution raises the cost of conquering rich fortified states.

### E. Technology
- **Domains or tracks:** agriculture, craft and industry, military, naval, administrative and finance, knowledge. Arts belong to tracks. Leadership can differ by track.
- **Eras become summaries of track levels,** not one total.
- **Adoption** (already per district) driven by profitability (factor prices) and institutions. Invention driven by market size, connected peers and institutions, not raw headcount.

### F. Geography and political scale
- Defensibility per region (terrain, coast, islands) feeds the cost of conquest and the survival odds of small states.

### G. Demography
- Fertility and mortality tied to income, urbanisation, schooling and medicine (a demographic transition). Peak population comes from that, not from the timing of industrial arts alone.

### H. The calibration bench
- One scoreboard of all targets:
  - turnover by age;
  - the colonial spike;
  - population and peaks;
  - the pace of ages;
  - leaders by size;
  - adoption lags;
  - realm-size distribution;
  - land behind.
- 32–64 worlds. Runs start from saved worlds at around year 1000 to cut cost.
- Every change is judged on the whole board, against the archived baseline.

## 5. Historical targets the bench must hit (from the research docs)
- **Who leads:**
  - the most populous polity first adopter at scale: 70–100% before 1450, 0–15% after;
  - diffusion inside a dense cluster after 1450: 5–30 years; between distant empires: centuries;
  - first arrival in a connected rival state: 10–20 years;
  - deployment at scale: 18–35 years for small dense states, 65–80+ for big empires;
  - inside one big state, core to periphery: about 40 years (IQR 15–70);
  - isolated regions: 90–270+ years.
- **Turnover by age:** the October targets table (foreign, colonial and internal per age).
- **Unevenness:** in the steam age, 15–45% of land is 2+ ages behind.
- **Realm sizes:** the largest polity's share of humanity about 25–35% at most (Qing around 1800), with many polities at 0.1–3%. Historical counts of polities holding 1%+ of humanity are needed (a research question).
- **Population:** about 7–11bn in information-age worlds is the current aspiration; to be re-derived from a demographic model.

## 6. Risks and sequencing
- **Each of A–E touches nearly every module:** people.js (1,081 lines), war, empire, hub, capture, trade, render and UI.
- **Order matters:**
  1. the bench (H) first;
  2. then states vs peoples (A), because B–D attach to states;
  3. then economy and fiscal (B + D);
  4. then institutions (C);
  5. then technology tracks (E);
  6. geography (F) and demography (G) alongside.
- **Performance:** the sim runs in a web worker at about 20–30 ms per tick (over budget). More states and an economy need care: coarse regions, yearly not per-tick updates, cached graphs.
- **The designer's creed:** no scripted outcomes, mechanisms over targets, worlds that differ. Every mechanism above should produce the historical pattern from conditions, not from age-keyed constants.
