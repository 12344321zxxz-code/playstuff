// Headless run: make a world, let centuries pass, print what happened.
//   node test/smoke.mjs [seed] [years] [events to print] [-q]
import { W, H, N, TPY } from '../src/core.js';
import { makeWorld, tick } from '../src/world.js';
import { PAGES } from '../src/story.js';
const seed = +(process.argv[2] || 7), years = +(process.argv[3] || 800), show = +(process.argv[4] || 70);
let t0 = Date.now(); const w = makeWorld(seed, process.argv.includes('--sync') ? { sync: true } : null); console.log('seed', seed, 'gen ms', Date.now() - t0, 'herds', w.herds.length, 'packs', w.packs.length, 'bands', w.sets.length, 'species', w.species.filter((s) => s.alive).length);
const all = []; t0 = Date.now(); let worst = 0, slow = 0, maxMov = 0;
for (let y = 1; y <= years; y++) {
  for (let k = 0; k < TPY; k++) { const a = performance.now(); tick(w); const d = performance.now() - a; if (d > worst) worst = d; if (d > 16) slow++; if (w.movers.length > maxMov) maxMov = w.movers.length; }
  for (const e of w.events) all.push(e); w.events.length = 0;
  if (y % 100 === 0) { const s = w.stats, tiers = [0, 0, 0, 0]; for (const x of w.sets) tiers[x.tier]++; let farms = 0, forest = 0, land = 0, grass = 0; for (let i = 0; i < N; i += 2) { if (w.water[i] === 1) continue; land++; if (w.farm[i]) farms++; if (w.t[i] > 0.5) forest++; grass += w.g[i]; }
    let fs = 0, fk = 0; for (let i = 0; i < w.fish.length; i++) { fs += w.fish[i]; fk += w.fishK[i]; }
    const live = w.cults.filter((c) => c.alive), kinds = {}; for (const c of live) kinds[c.kind] = (kinds[c.kind] || 0) + 1;
    console.log(` y${y} pop ${s.people} sets ${tiers.join('/')} peoples ${s.peoples} tech ${live.map((c) => c.tech).join('')} arts ${live.map((c) => Object.keys(c.arts).length.toString(16)).join('')} wars ${live.filter((c) => c.war && c.war.mine).length} movers ${w.movers.length} herds ${w.herds.length}/${s.grazers} packs ${w.packs.length} grass ${(grass / land).toFixed(2)} forest ${(forest / land * 100).toFixed(0)}% farms ${(farms / land * 100).toFixed(1)}% fish ${(fs / fk).toFixed(2)} ruins ${w.ruins.length} links ${w.links.size} drg ${w.dragons.length} ice ${(w.landIce * 100).toFixed(0)}% gh ${w.greenhouse.toFixed(2)}`);
    console.log('      ' + Object.entries(kinds).map(([k, v]) => v + ' ' + k).join(', ')); }
}
console.log('ms/tick', ((Date.now() - t0) / (years * TPY)).toFixed(2), 'worst', worst.toFixed(0), 'ticks>16ms', slow, 'max movers', maxMov);
const total = PAGES.reduce((a, g) => a + g[1].length, 0); console.log('almanac', Object.keys(w.found).length + '/' + total, Object.keys(w.found).join(' '));
const real = all.filter((e) => !e.page && !e.digest); console.log('events', real.length, 'headlines', real.filter((e) => e.big).length, 'per year', (real.length / years).toFixed(2));
if (!process.argv.includes('-q')) console.log(real.slice(0, show).map((e) => e.year + (e.big ? ' ** ' : ': ') + e.text).join('\n'));
