import { makeWorld, tick } from '../src/sim/world';
const t0 = Date.now(), w: any = makeWorld(11, { template: process.argv[2] || 'continent', sync: true }); console.log('make', Date.now() - t0);
let t = Date.now();
for (let k = 0; k < 8 * 60; k++) { tick(w); w.events.length = 0; if (k % 80 === 79) { console.log('y', w.year, Date.now() - t, 'ms/10y', 'pop', w.stats.people, 'sets', w.sets.length); t = Date.now(); } }
