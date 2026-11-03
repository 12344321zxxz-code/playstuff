// (Nov 3) Ownership invariance: does changing only who rules a set of districts change what those districts know and make?
// Holding people, land, routes and skills fixed, a split or a peaceful merger should not move knowledge, the arts in use,
// output or population at once; taxes and command may change over time. Three copies of one world at year Y:
//   ref:    the world as it is
//   noise:  the same world with one different dice roll (how far worlds drift apart by chance alone)
//   split:  the largest realm's farther half becomes a realm of its own   (or --merge: its largest neighbour joins it)
// Reported for the affected districts at +1, +5, +20 years, against ref, next to the noise floor.
//   node tools/invariance.mjs <seed> <year> [--merge [--behind]]   (--behind: the neighbour that joins is at least an age behind)
import { makeWorld, tick, settle } from '../src/world.js';
import { TPY, wrapDx } from '../src/core.js';
import { encodeWorld, decodeWorld } from '../src/save.js';
import { newCult } from '../src/people.js';
import { boomOf } from '../src/tech.js';
const [seed, Y] = [+process.argv[2], +process.argv[3]], merge = process.argv.includes('--merge');
const w0 = makeWorld(seed); for (let y = 0; y < Y; y++) { for (let k = 0; k < TPY; k++) tick(w0); w0.events.length = 0; } settle(w0);
const bytes = encodeWorld(w0), clone = () => decodeWorld(bytes);
const live = (w) => w.cults.filter((c) => c.alive && !c.power && c.count > 0);
const big = live(w0).sort((a, b) => b.pop - a.pop)[0];
const towns = (w, id) => w.sets.filter((s) => !s.dead && !s.nomad && s.cult === id);
// the districts the change touches (by town id, so they can be followed in every copy)
let touched, other = null;
if (!merge) { const S = towns(w0, big.id), b = big.big, d = (s) => Math.hypot(wrapDx(s.x - b.x), s.y - b.y); S.sort((a, c) => d(c) - d(a)); touched = new Set(S.slice(0, S.length >> 1).map((s) => s.id)); }
else { const behind = process.argv.includes('--behind'), nb = Object.keys(big.nb || {}).map((k) => w0.cults[k]).filter((o) => o && o.alive && !o.power && o.count > 0 && (!behind || o.tech < big.tech)).sort((a, b) => b.pop - a.pop)[0]; if (!nb) { console.log('no neighbour to merge'); process.exit(0); } other = nb.id; touched = new Set(towns(w0, nb.id).map((s) => s.id)); }
const ref = clone(), noise = clone(), test = clone(); noise.rnd.s = (noise.rnd.s + 1) % 2147483647;
if (!merge) { const c = test.cults[big.id], nc = newCult(test, c); for (const s of test.sets) if (touched.has(s.id) && !s.dead) s.cult = nc.id; nc._n = -1; }
else for (const s of test.sets) if (touched.has(s.id) && !s.dead) s.cult = big.id;
const snap = (w) => { const m = new Map(); for (const s of w.sets) if (touched.has(s.id) && !s.dead) { const c = w.cults[s.cult]; m.set(s.id, { k: s.k || 0, lvl: s.lvl ?? 0, arts: Object.keys(s._A || c.arts).length, boom: boomOf(s._A || c.arts), pop: s.pop, urb: s.urb ?? 0, realmTech: c.tech }); } return m; };
const cmp = (a, b) => { let n = 0, dk = 0, dl = 0, da = 0, db = 0, dp = 0, dt = 0; for (const [id, x] of a) { const y = b.get(id); if (!y) continue; n++; dk += Math.abs(Math.log((x.k + 1) / (y.k + 1))); dl += Math.abs(x.lvl - y.lvl); da += x.arts - y.arts; db += Math.abs(Math.log(x.boom / y.boom)); dp += Math.abs(Math.log((x.pop + 1) / (y.pop + 1))); dt += x.realmTech - y.realmTech; }
  const f = (v) => (n ? +(v / n).toFixed(3) : null); return { n, knowLog: f(dk), lvl: f(dl), artsDiff: f(da), boomLog: f(db), popLog: f(dp), realmTechDiff: f(dt) }; };
console.log(`seed ${seed}, year ${Y}: ${merge ? `the ${w0.cults[other].name} (${touched.size} towns) join the ${big.name} (${big.count} towns, age ${big.tech}, ${w0.cults[other].name} age ${w0.cults[other].tech})` : `the far half of the ${big.name} (${touched.size} of ${big.count} towns, age ${big.tech}) becomes its own realm`}`);
console.log('mean per affected district: |log know ratio|, |level diff|, arts-count diff (test minus ref), |log harvest-boom ratio|, |log pop ratio|, realm age diff');
const yrs = [1, 5, 20]; let t = 0;
for (const at of yrs) { for (; t < at; t++) for (const w of [ref, noise, test]) { for (let k = 0; k < TPY; k++) tick(w); w.events.length = 0; }
  const R = snap(ref); console.log(`+${String(at).padEnd(3)} change ${JSON.stringify(cmp(snap(test), R))}\n     noise  ${JSON.stringify(cmp(snap(noise), R))}`); }
