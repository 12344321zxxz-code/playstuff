# Formicarium: the game, what's in, what's not, what's wanted (Nov 4, 2026)

For each system: **In** is what the game does now (on `main`). **Not** is what's missing or known broken. **Wanted** is what Ariel has asked for or decided. Ariel's own words on each decision are in project memory (`areas/god-game.md`).

## 1. What it is, and the creed
- **The game:**
  - a god game where the world is a garden and the peoples are the ant colonies;
  - you shape land and sky, seed life, and watch history grow;
  - you never give orders to people;
  - sandbox: no win, no ending;
  - the Almanac (pages that fill the first time a world produces something) is the only soft goal;
  - desktop browser, published on GitHub Pages.
- **The creed** (Ariel's, to be applied to every change):
  1. **Every system pushes on the others.** Nothing is a separate minigame.
  2. **No scripting.** History-like patterns emerge from interacting systems and each world's starting conditions. They must differ between worlds. Soft target ranges from real history are fine. Forcing outcomes, or keying rules to the world's age, is not.
  3. **Holistic fixes.** Fix the mechanism behind a problem, not a size penalty or a knob. Retire old correction patches when a real mechanism replaces them.
  4. **You can see why.** Causes show on the map and in the Look panel and chronicle. Things travel there (armies, caravans, settlers) instead of happening at a distance.
- **Rejected for good:**
  - simulated individuals (named houses and passing lines like "Queen Ann died" are fine);
  - the world asking the god for things (prayers);
  - powers aimed at single persons;
  - named eras;
  - the god being forgotten as tech grows;
  - advanced peoples blind to magic;
  - forgetting magic costing tech;
  - ice and winter magic;
  - camera shake;
  - seasons flashing on the map;
  - story tracking with time slowing.

## 2. Map, terrain and climate
- **In:**
  - Map:
    - a wrapping 512 × 256 grid drawn as crisp pixel art;
    - simple plates (one cheap tectonic pass, dragging a plate re-applies only the difference);
    - rivers and lakes by priority flood, and erosion.
  - Climate:
    - two seasons on a coarse grid (winds, ocean gyres, rain), recomputed in slices, not stepped;
    - wet and dry decades and solar drift;
    - climate zones, with a Climate lens instead of flashing seasons;
    - climate controls: sun, tilt, sea level, weather, rainfall, greenhouse, heat and cold brushes.
  - Lenses: Land, Climate, Heat, Rain, Life, Wind, Soil, Height, Plates.
- **Not:**
  - the map is far smaller than Earth;
  - continents from the simple plates are often poor.
- **Wanted:**
  - a bigger map (Earth's dimensions to start) and better continent generation (queued);
  - a climate with more simulation to it, and more zoom;
  - at most a super-simple version of his separate plate-tectonics generator, which he finds slow and ugly.

## 3. Life and ecosystem
- **In:**
  - grass, forest and soil, with fire, grazing and farming;
  - nine grazers and wolves (grass-limited, predator-checked);
  - fish stocks;
  - Guns, Germs and Steel geography:
    - plants and beasts have home continents (cradles) and spread slowly;
    - few beasts can be tamed;
    - crops and herds travel with trade and ships;
    - megafauna die out where people arrive late;
    - feral herds, one-crop blight, and slash-and-burn.
  - Lenses: Beasts, Origins.
- **Not:** Ariel found the ecosystem too simple and its consequences dull (Oct). It has improved, but there's no big ecology pass since.
- **Wanted:**
  - deeper ecosystem effects;
  - magic tied into weather and ecology;
  - herds at the right scale (he felt they were out of scale).

## 4. Peoples, settlement and population
- **In:**
  - Bands become settlements. A people's way of life comes from what it eats where it stands (forage, hunt, fish, farm, herd), with hysteresis.
  - Every settlement is a **district** with a town share (`s.urb`) and a countryside, drawn as hamlets and farmsteads.
  - Migration by push and pull. Settlers and refugees walk real routes or sail.
  - Nomads, steppe confederations and frontier terms (subsidies, border markets, tribute).
  - Population:
    - logistic growth to a food cap, lifted by arts (harvest booms, railways, sanitation);
    - modern medicine and the green revolution;
    - billions in the modern ages; peak about 3.4bn on the current defaults.
  - Elite engine (Turchin): lords, posts, extraction, authority, factions, civil wars, risings.
  - Ruling houses and crowns.
  - Tongues and ways of life as family trees carried by towns: drift, dialects, language shift, court adoption. Lens: Tongues.
  - Faiths:
    - born at holy sites and from crises;
    - doctrines and a stance on magic;
    - spread by trade, conquest and refugees;
    - schisms and holy wars.
    - Lens: Faiths.
- **Not:**
  - a "cult" is one object for a people, a state, an economy and an army; states are not separate from peoples (see section 6);
  - no demographic transition tied to income and schooling;
  - peak population (about 3–3.5bn) is below Ariel's 7–11bn aspiration for information-age worlds.
- **Wanted:**
  - elite overproduction drives rise and decline (in);
  - language and culture as separate trees (in);
  - any large population crash makes tech regress (in);
  - no wandering bands in industrial societies;
  - population back toward 7–11bn by the information age, through a real demographic model rather than a knob (backlog).

## 5. Knowledge and technology
- **In:**
  - Arts:
    - 73 arts in 11 ages, each age its own colour (first fields green);
    - arts need real inputs (copper and tin, coal, horses, coast) and enough carriers.
  - Spread:
    - knowledge spreads by ties, absorptive capacity and a "republic of letters" among trading peers;
    - a ledger records where each realm's knowledge comes from;
    - **know vs use:** from the age of print, an art works in a district only once that district reaches the art's age, so deployment lags;
    - districts an age behind fight with the previous age's arms.
  - Setbacks:
    - dark ages after nuclear war or a population crash;
    - ruins give back a little lost knowledge.
  - Development meter by district. Lens: Knowledge.
- **Not:**
  - tech is one knowledge number against fixed age thresholds; there are no domains (naval, financial, military);
  - early arts spread too slowly between neighbours (100–250 years vs about 15–80 historically);
  - a backward realm merged into a bigger one gains about 9 arts within 5 years (item 29 in the stuck-rules audit);
  - about a quarter of worlds never reach age 6 by 2000.
- **Wanted:**
  - small states, or clusters of them, can reproduce Europe's rise; the biggest realm is not best at everything (much improved Nov 4);
  - tech unevenness across the world matching real data (benchmark pending);
  - Guns, Germs and Steel in every system (in).

## 6. States, institutions and diplomacy
- **In:**
  - Realms:
    - borders follow the land (travel cost from towns);
    - 64 realm colours, with neighbours told apart;
    - political map and diplomacy overview (click a realm);
    - realm cap 54–58 by the world's age (a cap of 90 was tested and stays off).
  - Government forms come from who holds the wealth: council of houses (merchant republic), empire, nation.
  - Cohesion; empire reach (dues fall with distance); autonomy and secession; regional houses.
  - Clients, protectorates and vassals.
  - **Fiscal state (`fisc.js`, on by default since Nov 4):**
    - a realm's strength is what its net revenue can pay for;
    - towns and trade are easier to tax than fields;
    - layers of officials keep a share;
    - far, foreign and fresh conquests cost more to hold;
    - councils and banking get credit.
  - Written law and a civil service need towns, not district counts. Markets open on local conditions.
- **Not:**
  - states are not separate from peoples. The council deferred this; it touches about 620 references;
  - no prices, credit markets or public debt as a state resource;
  - breakaways defect to a neighbour about 92 times per world (32 under the old rules), because there are more realms against the cap.
- **Wanted:**
  - deeper institutions than the current Why-Nations-Fail layer;
  - states separate from peoples (Ariel asked; deferred);
  - a better state simulation and state presentation in the style of the language panel.

## 7. Economy and trade
- **In:**
  - Goods:
    - goods come from the land (metals, coal, salt, grain, horses, uranium) and fill needs;
    - named routes along real travel costs, carried by porters, pack trains, ships and later railways;
    - markets, entrepôts, tolls, pirates and leagues;
    - supply counts only while loads keep coming; coal is a traded good.
  - Value: trade moves value instead of minting it at both ends (a buyer gains a fifth of a load); sacks and raids take from the victim's purse.
  - Lens: Trade.
- **Not:**
  - no full economy (prices, wages, capital, a merchant class beyond the council form);
  - no logistics beyond the route network.
- **Wanted:** a trade and travel-logistics overhaul (queued).

## 8. War, conquest, colonies and the nuclear age
- **In:**
  - War (slices 0–5, Oct):
    - war aims, occupation, will to fight, settlements (annex, client, tolls, reparations, release);
    - truces scaled by how decisive the war was;
    - mobilisation budgets, sieges and reinforcements;
    - armies march the town graph or sail sea lanes;
    - raids never take towns; sacks ruin towns;
    - each age has a share of wars of extermination.
  - Defence:
    - walled towns hold against cannon once a realm has gunpowder and masonry (bastions);
    - realms of any size can join as allies.
  - Colonies:
    - footholds and trading forts;
    - the "loaded spring": loans and forts build a stake, a crisis cashes it in;
    - protectorates, shown as a ring in the overlord's colour;
    - steamships and quinine gate the steam-age scramble;
    - breech-loaders carry the industrial edge;
    - colonies break away by their own development.
  - Nuclear (rare and a lesson):
    - crises pull in allies;
    - after an exchange every nuclear power is far more reluctant for centuries;
    - fallout veil, glass, dark ages;
    - tools: Bomb, Disarm. Lens: Fallout.
  - Turnover meter (`tools/turnover.mjs`): land changing hands per age, against real targets.
- **Not:**
  - turnover vs history is parked (Oct 31): iron and medieval foreign turnover is low (12 and 16 vs 30); steam-age colonial is borderline; wires-age internal is high;
  - war is still largely headcount and money; there are no separate navies with their own economy.
- **Wanted:**
  - land turnover per century matched to history within ±20% by age (parked);
  - annexation and tribute both decided on historical grounds (in);
  - foreign nomads not camping inside other states (in).

## 9. Magic and the other world
- **In:**
  - Memory and wellsprings:
    - magic as memory: kinds of memory (death, wild, fire, deep, faith) flow along ley lines on plate seams into wellsprings;
    - full wells spill ley storms.
  - Spirits and powers:
    - dead kings: a spreading blight of undead sites, not a nation; they attack nomad bands and turn them;
    - liches;
    - fey courts take changeling villages;
    - dragons (dragon kings capture weaker realms; great wyrms);
    - deep ones;
    - great powers with realms;
    - after a fall, a magic surge.
  - Winter magic is removed.
  - Tools: Well, Remember, Hush, Forget, Dragon, Kraken, Overgrow. Lens: Lore.
- **Not:**
  - in Ariel's words, magic doesn't matter and doesn't connect to the other systems;
  - he dislikes the well system;
  - the magic overhaul was put aside on Oct 29 for turnover, population and play tall.
- **Wanted** (from Oct 26 answers; the overhaul isn't built yet):
  - Overall:
    - magic as an **inhibitor of progress**, not a playable "ultimate class";
    - magic dies as tech improves.
  - Ley lines: keep them; magic pools where lines cross (replacing the wells).
  - **What rises depends on the land:**
    - forest: fey court;
    - death: lich king;
    - volcanoes, peaks and deserts: dragons;
    - seas: deep ones.
  - Fey courts sponsor **beastmen kingdoms**:
    - drawn from the existing animal herds;
    - hold much land and never really develop;
    - fight humans when the court feels threatened;
    - go wild over generations, can break free, and die out.
  - Dead kings: expanding factions that sack and convert towns, then fade after centuries; more variety in death memory than ghosts and undead kingdoms.
  - Dragons can take over weaker nations.
  - **Human sorcery:** a magical aristocracy that technology overturns, shaping states and which tech is allowed.
  - Faith gets a role. Powers interact with climate and other systems.
  - **World-scale magical change** about 1–1.5 times per 2,000 years; a dying power's last deed is one source, not the only one; more ambitious than lakes, rivers and ridges.
  - Machine minds: far more disastrous, and distinct from the dead kings.
  - **Undecided:** how hard magic should brake progress. He wants the options laid out.

## 10. Disasters and the god's tools
- **In:**
  - Land: raise, lower, ridge, trench, flatten, smooth, erode, plates.
  - Sky: rain, dry, heat, cold, storm.
  - Life: forest, fire, spring, ore, sow, herd, wolves, cull, overgrow.
  - People: people, idea, babel, plague, disarm.
  - Wrath: meteor, volcano, quake, wave, locusts, bomb.
  - Other world: dragon, kraken, well, remember, hush, forget.
- **Wanted:**
  - more tools to get rid of peoples and civilisations (Oct);
  - ruins of peoples that fit into everything (in: ruins gather memory, get dug up, haunted, built on).

## 11. Story, interface and presentation
- **In:**
  - a rationed chronicle (headline, normal, minor);
  - the Almanac;
  - the Look panel with "why" chips;
  - lenses with a small foldable map key;
  - era art (towns, ships, armies, caravans, rails, smoke, night lights);
  - realm pages through the political map;
  - save and exact replay.
- **Not:** sound; the "old atlas" painted look from the Oct 8 brief (the pixel-art map won instead).
- **Wanted:**
  - state presentation in the style of the language panel;
  - more zoom.

## 12. Engine and infrastructure
- **In:**
  - Engine:
    - the simulation runs headless in a web worker as plain typed arrays, with no DOM;
    - 8 ticks per year, about 28 ms per tick on the current defaults (up about 48% with the foundation fixes, mostly the 700-town cap).
  - Tools for the LLM to read the running sim: probe, query, ledger.
  - Publishing: Pages publishes `main` on every push.
  - Tests: `npm test` (smoke, 800 years), `test:chains`, `test:torture`.
- **Not:** whether the current tick cost feels slow in the browser hasn't been checked.
- **Wanted:** the sim heavily optimised (done once, Oct 22; worth revisiting after the foundation fixes).
