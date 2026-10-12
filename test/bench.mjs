// Fixed benchmark: same seed, sync mode, time years 250-400.  node test/bench.mjs
import { makeWorld, tick } from '../src/world.js';
const w = makeWorld(7, { sync: true }); let t0 = 0;
for (let y = 1; y <= 400; y++) { if (y === 251) t0 = performance.now(); for (let k = 0; k < 8; k++) tick(w); w.events.length = 0; }
console.log('ms/tick', ((performance.now() - t0) / (150 * 8)).toFixed(2), 'pop', w.stats.people, 'sets', w.sets.length);
