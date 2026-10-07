// Headless run: make a world, let centuries pass, print what happened. `node test/smoke.mjs [seed] [years]`
import { W, H, N, TPY } from '../src/core.js';
import { makeWorld, tick } from '../src/world.js';
import { PAGES } from '../src/story.js';
const seed = +(process.argv[2] || 7), years = +(process.argv[3] || 800);
let t0 = Date.now(); const w = makeWorld(seed); console.log('seed', seed, 'gen ms', Date.now() - t0, 'herds', w.herds.length, 'packs', w.packs.length, 'bands', w.sets.length, 'species', w.species.filter((s) => s.alive).length);
const all = []; t0 = Date.now(); let worst = 0;
for (let y = 1; y <= years; y++) {
  for (let k = 0; k < TPY; k++) { const a = performance.now(); tick(w); const d = performance.now() - a; if (d > worst) worst = d; }
  for (const e of w.events) all.push(e); w.events.length = 0;
  if (y % 100 === 0) { const s = w.stats, tiers = [0, 0, 0, 0]; for (const x of w.sets) tiers[x.tier]++; let farms = 0, forest = 0, land = 0; for (let i = 0; i < N; i += 2) { if (w.water[i] === 1) continue; land++; if (w.farm[i]) farms++; if (w.t[i] > 0.5) forest++; }
    console.log(` y${y} pop ${s.people} sets ${tiers.join('/')} peoples ${s.peoples} tech ${w.cults.filter((c) => c.alive).map((c) => c.tech).join('')} ways ${w.cults.filter((c) => c.alive).map((c) => c.way[0] + (c.way === 'fish' ? 'i' : '')).join('')} herds ${w.herds.length}/${s.grazers} packs ${w.packs.length} forest ${(forest / land * 100).toFixed(0)}% farms ${(farms / land * 100).toFixed(1)}% ruins ${w.ruins.length} links ${w.links.size} dragons ${w.dragons.length} ice ${(w.landIce * 100).toFixed(0)}% gh ${w.greenhouse.toFixed(2)} sea ${w.params.sea.toFixed(3)}`); }
}
console.log('ms/tick', ((Date.now() - t0) / (years * TPY)).toFixed(2), 'worst tick ms', worst.toFixed(0));
const total = PAGES.reduce((a, g) => a + g[1].length, 0); console.log('almanac', Object.keys(w.found).length + '/' + total, Object.keys(w.found).join(' '));
console.log('events', all.length); console.log(all.slice(0, +(process.argv[4] || 70)).map((e) => e.year + ': ' + e.text).join('\n'));
