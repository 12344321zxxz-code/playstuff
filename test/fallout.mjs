// Fallout: bomb a city, then watch the veil spread, the hot zone fade, the glass weather and the crater fill.
//   node test/fallout.mjs
import { TPY, W, H } from '../src/core.js';
import { makeWorld, tick } from '../src/world.js';
import { nuke } from '../src/doom.js';
import { settle } from '../src/world.js';
const w = makeWorld(3); const run = (y) => { for (let k = 0; k < y * TPY; k++) tick(w); w.events.length = 0; };
run(300);
const t = w.sets.filter((s) => !s.dead && !s.nomad).sort((a, b) => b.pop - a.pop)[0]; const x = t.x, y = t.y; console.log('bomb on', t.name, x, y);
nuke(w, x, y, null); nuke(w, x + 40, y, null);
const field = () => { let land = 0, any = 0, hot = 0, mx = 0; for (let i = 0; i < W * H; i++) if (!w.water[i]) { land++; const v = w.fallout[i]; if (v > 0.005) any++; if (v > 0.1) hot++; if (v > mx) mx = v; } return `veil-touched ${(any / land * 100).toFixed(1)}% hot ${(hot / land * 100).toFixed(2)}% max ${mx.toFixed(2)} zones ${w.hot.length} glass ${w.glassI.length}`; };
for (const yy of [1, 5, 10, 20, 30, 60, 100, 310, 800]) { run(yy - (w._fy || 0)); w._fy = yy; const i = y * W + x; console.log(`+${yy}y`, field(), 'centre', w.fallout[i].toFixed(3), 'water', w.water[i], 'stats', (w.stats.fallout * 100).toFixed(2) + '%'); }
console.log('craters', JSON.stringify(w.craters));
