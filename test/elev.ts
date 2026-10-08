import { N } from '../src/sim/core';
import { makeWorld } from '../src/sim/world';
import { TEMPLATES } from '../src/sim/templates';
for (const T of TEMPLATES) { const w: any = makeWorld(+(process.argv[2] || 5), { template: T.id, bands: 0 }); const a: number[] = []; for (let i = 0; i < N; i++) if (w.water[i] !== 1) a.push(w.h[i] - w.params.sea); a.sort((x, y) => x - y); const q = (p: number) => a[Math.floor(p * a.length)].toFixed(3); const f = (t: number) => (a.filter((v) => v > t).length / a.length * 100).toFixed(0) + '%'; console.log(T.id, 'q25', q(0.25), 'q50', q(0.5), 'q75', q(0.75), 'q90', q(0.9), '>0.2', f(0.2), '>0.34', f(0.34), '>0.5', f(0.5)); }
