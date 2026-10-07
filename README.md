# Formicarium

A god game. You tend a world the way you would tend a garden: shape the land, set the sky, seed
life, and watch peoples rise and fall in it. Every system pushes on the others, and you can see
why things happen.

## Run it

No build step. Serve the folder and open it:

```
npm run serve     # then open http://localhost:8080
```

- `npm test` runs the simulation headless for 800 years and prints the chronicle.
  `node test/smoke.mjs <seed> <years> <events to print> [-q]` for anything else.
- `npm run build` bundles everything into one HTML file in `dist/`.

## Playing

Drag to move, scroll to zoom, tap anything with Look to read it. Pick a power on the left and
use it on the map. Nothing tells you what to do. The Almanac tab fills in as your world produces
things for the first time.

Some things to try:

- Drag a Ridge across a wet coast and watch the far side dry out.
- Put Horses on a continent that has none, next to open grass.
- Bury Copper and Tin near the same people.
- Cull the wolves and watch the grass.
- Turn Weather up to wild.

See `DESIGN.md` for how it fits together and what is still rough.
