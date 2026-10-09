// Headless smoke run: make a world per template, run it for a while, report.
//   node tools/run.mjs test/smoke.ts [years] [template]
import { makeWorld, tick } from '../src/sim/world';
import { TEMPLATES } from '../src/sim/templates';
const years = +(process.argv[2] || 300), only = process.argv[3];
for (const T of TEMPLATES) {
  if (only && T.id !== only) continue;
  const t0 = Date.now(), w: any = makeWorld(11, { template: T.id, sync: true }); const t1 = Date.now();
  let evs = 0; for (let k = 0; k < years * 8; k++) { tick(w); evs += w.events.length; w.events.length = 0; }
  const alive = w.cults.filter((c: any) => c.alive);
  console.log(T.id.padEnd(9), `make ${t1 - t0}ms run ${((Date.now() - t1) / years).toFixed(1)}ms/yr`, `y${w.year} pop ${w.stats.people} peoples ${alive.length} races ${[...new Set(alive.map((c: any) => c.race))].join('')} sets ${w.sets.length} ruins ${w.ruins.length} faiths ${w.faiths.filter((f: any) => f.alive).length} beasts ${w.beasts.length}+${w.dragons.length}d figs ${w.figs.filter((f: any) => !f.died).length}/${w.figs.length} myths ${w.myths.length} works ${w.projects.filter((p: any) => p.done).length} arts ${w.arts.length} regs ${w.regs.length} events ${evs} hist ${w.history.length}`);
}
