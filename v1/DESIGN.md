# Formicarium: design notes

A god game where the world is a garden and the peoples in it are the ant colonies. You shape
land and sky, seed life, and watch what grows. You never give orders to anyone.

## What it is trying to be

Three rules, in order of importance.

1. **Every system pushes on the others.** A mountain range moves the rain; the rain decides
   what grows; what grows decides who can live there and how; how they live decides what they
   can learn; what they learn decides what they do to the land. Nothing is a separate minigame.
2. **You can see why.** After you change the land or the sky, the map flashes blue where it got
   wetter and orange where it got drier. Every settlement says what it eats and why it is
   growing or shrinking. Famines name their cause. Things do not happen at a distance: settlers,
   war bands, caravans, ships and refugees walk there, so you can watch them and get in the way.
3. **No orders, no quests.** Powers act on places, not on people. The world asks you for
   nothing. The only "goal" is the Almanac: 66 pages that fill in the first time this world
   produces a thing (a rain shadow, a horde, a drowned city). It never says how.

## The chain of causes

```
plates ──► mountains, coasts ──► winds, currents ──► heat and rain ──► rivers, lakes
                                                         │
                 weather (wet and dry decades, slow solar drift, ash from eruptions)
                                                         ▼
                                     grass, forest, soil ◄── fire, grazing, farming
                                                         │
                herds ◄─► wolves                 fish stocks in the sea
                   │                                     │
                   ▼                                     ▼
   peoples: what a band eats where it stands decides its way of life
     (forage, hunt, fish, farm, herd) ──► what it can learn (no boats without a shore,
     no bronze without copper and tin, no riders without horses, no engines without coal)
                   │
                   ▼
   settle, clear fields, wear out soil, trade (ideas and sickness travel with it),
   raid, go to war, split, collapse, forget ──► ruins
                   │
                   ▼
   ruins gather magic, get dug up for old knowledge, get built on, get haunted
                   │
                   ▼
   faiths are born at holy sites (craters, drowned and buried cities, glowing woods,
   a slain dragon, plague survivors) and travel with trade, ships, refugees and conquest;
   shared faith keeps peace and holds realms together, zealous faiths start holy wars,
   big faiths split
   magic: ley lines on plate seams ──► enchanted woods, dragons, towers, deep ones
```

## Where things live

| File | What it holds |
| --- | --- |
| `core.js` | grid constants, wrapping maths, noise, heap |
| `plates.js` | the simple plate model: a dozen plates, one pass of tectonics |
| `climate.js` | two seasons on a coarse grid: heat, wind, ocean gyres, moisture, rain |
| `hydro.js` | priority-flood rivers, lakes, landmasses, erosion |
| `weather.js` | year-to-year wet and dry patterns, slow solar drift |
| `life.js` | grass, trees, soil, fire, the seasonal fields |
| `fauna.js` | nine grazers, wolves; grass-limited, predator-checked |
| `sea.js` | fish stocks, deep ones |
| `people.js` | cultures, settlements, arts, food, war, plague, collapse, roads |
| `movers.js` | everyone on the road or at sea |
| `fantasy.js` | the magic field, dragons |
| `faith.js` | faiths, holy sites, conversion, reformation; the yearly realm and faith maps |
| `disasters.js` | meteor, eruption, wave, quake, storm, locusts, and the natural versions |
| `story.js` | chronicle events, almanac pages |
| `world.js` | allocates the world, runs the tick, spreads heavy work over ticks |
| `shader.js`, `render.js` | terrain drawn by one fragment shader |
| `entities.js` | everything drawn on top; the text for Look |
| `main.js`, `hands.js`, `book.js` | camera and input; the tools; the notebook |

The simulation is plain data in typed arrays and has no DOM in it, so `node test/smoke.mjs`
runs centuries headless and prints what happened. Use it before and after any balance change.

## Decisions worth remembering

- **Plates are a starting sketch, not a simulation.** One cheap pass makes ranges, trenches and
  arcs. Dragging a plate reapplies only the difference, so hand sculpting survives.
- **Climate is recomputed, not stepped.** It takes about a third of a second, so it runs as a
  generator a few milliseconds per tick. Rivers and the yearly census work the same way.
- **Farms stay within walking distance of a settlement** and abandoned fields go back to woods.
  Without both rules the whole world ends up under the plough by year 1000.
- **Farmers only settle good land.** The rest is left to herders, hunters and nobody, which is
  what makes room for nomads and for wilderness.
- **Pastoral peoples are born from farmers with animals** next to grass that will not grow grain.
- **Knowledge is two things:** a slow total that grows with numbers, and arts that need the
  right place. This is what stops every people climbing the same ladder at the same speed.
- **Borders are drawn from influence, not ownership.** Each year every town pushes a claim over
  the land around it; the strongest claim on each patch wins, and the shader blends the coarse
  map into smooth borders. Wanderers hold no borders.
- **The chronicle is rationed.** Three levels: headline, normal, minor (one every nine years at
  most). Droughts, plagues and collapses are each reported once, as one event.

## Rough edges

- Late game settles into a plateau. Wars, plagues and collapses churn but the shape of the world
  stops changing much after year 1200 unless you intervene.
- Most peoples still end up farmers. Fishers and nomads exist but are a minority.
- One tick costs about 6 ms once the world is full, so Fast is not much faster than Steady on a
  slow machine. Moving the simulation to a worker would fix that.
- Only one war at a time per people, no alliances, no named individuals other than rulers.
- Phone layout works but the tools sit below the map.

## Next

- Simulation in a Web Worker.
- Peoples that remember: grudges, borrowed gods, songs about the flood you caused.
- More of the other world: something that lives in haunted ruins, something that guards old
  forest.
- Seas with currents that carry ships, so trade routes follow the wind.
- Save and load.
