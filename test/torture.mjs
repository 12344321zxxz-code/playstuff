// A careless god: every few years, do something drastic at random. Nothing should throw and
// no number should go bad.   node test/torture.mjs [seed] [years]
import { W, H, N, TPY } from '../src/core.js';
import { makeWorld, tick, refreshWater, refreshClimate, movePlates, queueClimate } from '../src/world.js';
import { sculpt, erodeBrush, weather, plant, burn } from '../src/powers.js';
import { meteor, volcano, tsunami, quake, plagueAt, overgrow, babel, inspire, stormAt, locustAt } from '../src/disasters.js';
import { addHerd, addPack } from '../src/fauna.js';
import { addBand } from '../src/people.js';
import { addDragon } from '../src/fantasy.js';
import { addKraken } from '../src/sea.js';
const seed = +(process.argv[2] || 3), years = +(process.argv[3] || 700), w = makeWorld(seed), r = w.rnd; let acts = 0;
const X = () => r() * W, Y = () => 8 + r() * (H - 16), town = () => { const s = w.sets[(r() * w.sets.length) | 0]; return s ? [s.x, s.y] : [X(), Y()]; };
const DO = [
  () => { const [x, y] = town(); sculpt(w, ['raise', 'lower', 'ridge', 'trench', 'flatten', 'smooth'][(r() * 6) | 0], x + r() * 20 - 10, y + r() * 20 - 10, 2 + ((r() * 14) | 0), { level: r() * 0.4, power: 1 }); refreshWater(w); queueClimate(w); },
  () => erodeBrush(w, X(), Y(), 8), () => weather(w, r() < 0.5 ? 'rain' : 'dry', ...town(), 12), () => plant(w, X(), Y(), 10), () => burn(w, ...town(), 2),
  () => meteor(w, ...town()), () => volcano(w, ...town()), () => tsunami(w, X(), Y()), () => quake(w, ...town()), () => plagueAt(w, ...town()), () => overgrow(w, ...town(), 9), () => babel(w, ...town()), () => inspire(w, ...town()), () => stormAt(w, X(), Y()), () => locustAt(w, ...town()),
  () => addHerd(w, X(), Y(), r() < 0.5 ? null : (r() * 9) | 0), () => addPack(w, X(), Y()), () => addBand(w, X(), Y()), () => addDragon(w, X(), Y()), () => addKraken(w, X(), Y()),
  () => { w.params.sun = Math.round((r() * 16 - 8) * 2) / 2; queueClimate(w); }, () => { w.params.tilt = r() * 45; queueClimate(w); }, () => { w.params.seaDial = r() * 0.2 - 0.1; w.params.sea = w.params.seaDial + w.seaAuto; refreshWater(w); queueClimate(w); }, () => { w.params.spin = -w.params.spin; queueClimate(w); }, () => { w.params.mood = r() * 2; },
  () => { const p = w.plates[(r() * w.plates.length) | 0]; if (r() < 0.5) p.land = !p.land; else { p.vx = r() * 3 - 1.5; p.vy = r() * 3 - 1.5; } movePlates(w); },
  () => { const [x, y] = town(); w.ore[(y | 0) * W + (x | 0)] = 1 + ((r() * 6) | 0); }, () => { w.springs.push({ x: X() | 0, y: Y() | 0, q: 420 }); w.need.water = true; },
];
const bad = (a, name) => { for (let i = 0; i < a.length; i += 7) if (!Number.isFinite(a[i])) throw new Error('bad number in ' + name + ' at ' + i); };
const t0 = Date.now();
for (let y = 1; y <= years; y++) {
  for (let k = 0; k < TPY; k++) tick(w);
  if (y % 3 === 0) { DO[(r() * DO.length) | 0](); acts++; }
  if (y % 50 === 0) { for (const k of ['h', 'g', 't', 'soil', 'mi', 'tJan', 'tJul', 'rJan', 'rJul', 'magic', 'fish', 'wetA', 'temp']) bad(w[k], k); for (const s of w.sets) if (!Number.isFinite(s.pop) || s.pop < 0) throw new Error('bad pop'); for (const c of w.cults) if (!Number.isFinite(c.know) || !Number.isFinite(c.coh)) throw new Error('bad culture ' + c.name); for (const h of w.herds) if (!Number.isFinite(h.n)) throw new Error('bad herd'); w.events.length = 0; }
}
console.log(`ok: ${years} years, ${acts} acts of god, ${w.stats.people} people left in ${w.sets.length} places, ${w.ruins.length} ruins, ${Object.keys(w.found).length} almanac pages, ${((Date.now() - t0) / 1000).toFixed(0)}s`);
