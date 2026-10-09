import { W, H } from '../src/sim/core';
import { makeWorld, tick, refreshWater } from '../src/sim/world';
import { APPLY, MYTHIC } from '../src/sim/tools';
import { saveWorld, loadWorld } from '../src/sim/save';
let a = 12345; const r = () => ((a = (a * 1664525 + 1013904223) >>> 0) / 4294967296);
let w: any = makeWorld(1009, { template: 'continent', sync: true }); let last = '';
for (let y = 0; y < 420; y++) {
  for (let k = 0; k < 8; k++) { tick(w); w.events.length = 0; w.fx.length = 0; }
  if (y % 7 === 3) { const ids = Object.keys(APPLY), id = ids[(r() * ids.length) | 0], x = r() * W, yy = 8 + r() * (H - 16); last = id; APPLY[id](w, x, yy, 4, { level: w.h[(yy | 0) * W + (x | 0)], power: 1 }, (r() * 4) | 0); if (w.edited) { w.edited = false; refreshWater(w); } }
  const bad = w.sets.find((s: any) => !(s.pop >= 0)); if (bad) { console.log('NaN pop at year', w.year, 'last tool', last, JSON.stringify(bad).slice(0, 400)); break; }
  if (y === 350) { const buf = saveWorld(w); w = loadWorld(buf); w.sync = true; const b2 = w.sets.find((s: any) => !(s.pop >= 0)); console.log('after load bad', !!b2, b2 && JSON.stringify(b2).slice(0, 300)); }
}
