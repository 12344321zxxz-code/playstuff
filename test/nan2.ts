import { W, H } from '../src/sim/core';
import { makeWorld, tick } from '../src/sim/world';
import { saveWorld, loadWorld } from '../src/sim/save';
let w: any = makeWorld(1009, { template: 'continent', sync: true });
for (let y = 0; y < 30; y++) for (let k = 0; k < 8; k++) { tick(w); w.events.length = 0; }
const buf = saveWorld(w); const w2: any = loadWorld(buf);
for (const s of w2.sets) if (typeof s.pop !== 'number' || typeof s.x !== 'number') console.log('bad set', JSON.stringify(s).slice(0, 200));
console.log('sets', w.sets.length, w2.sets.length, 'movers', w2.movers.length, w2.movers[0] && Object.keys(w2.movers[0]));
for (let k = 0; k < 80; k++) tick(w2); console.log('ok after load', w2.year);
