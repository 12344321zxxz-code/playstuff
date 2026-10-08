// Run worlds for a long time with random powers thrown at them, save and load in the middle,
// and check nothing breaks.  node tools/run.mjs test/torture.ts [years] [template]
import { W, H } from '../src/sim/core';
import { makeWorld, tick, refreshWater } from '../src/sim/world';
import { TEMPLATES } from '../src/sim/templates';
import { APPLY, MYTHIC } from '../src/sim/tools';
import { noteAct } from '../src/sim/myth';
import { saveWorld, loadWorld } from '../src/sim/save';
import { look } from '../src/sim/look';
import { legendIndex, legendPage } from '../src/sim/legends';
import { nudge } from '../src/sim/figures';
const years = +(process.argv[2] || 600), only = process.argv[3];
let a = 12345; const r = () => ((a = (a * 1664525 + 1013904223) >>> 0) / 4294967296);
for (const T of TEMPLATES) {
  if (only && T.id !== only) continue;
  let w: any = makeWorld(1000 + T.id.length, { template: T.id, sync: true }); const t0 = Date.now(); let evs = 0, acts = 0, looks = 0, pages = 0;
  for (let y = 0; y < years; y++) {
    for (let k = 0; k < 8; k++) { tick(w); evs += w.events.length; w.events.length = 0; w.fx.length = 0; }
    if (!(w.stats.people >= 0) || w.sets.some((q: any) => !(q.pop >= 0))) { const b = w.sets.find((q: any) => !(q.pop >= 0)); const chk = (n: string, a: any) => { for (let i = 0; i < a.length; i++) if (!(a[i] >= 0) && !(a[i] < 0)) return n + '@' + i; return ''; }; console.log('fields', chk('fish', w.fish), chk('fishK', w.fishK), chk('graze', w.eco.graze), chk('pred', w.eco.pred), chk('whale', w.eco.whale), chk('wetA', w.wetA), chk('g', w.g), chk('t', w.t), chk('soil', w.soil), chk('h', w.h), chk('gCap', w.gCap), chk('tCap', w.tCap), chk('mi', w.mi), chk('rJan', w.rJan), chk('wetBias', w.wetBias), chk('tJan', w.tJan), chk('green', w.green), chk('rain', w.rain), w.cults.filter((c: any) => !(c.pop >= 0)).map((c: any) => c.id)); console.log('NaN at', w.year, 'last', (globalThis as any).lastAct, b && JSON.stringify({ pop: b.pop, src: b.src, note: b.note, nomad: b.nomad, tier: b.tier, cult: b.cult, race: w.cults[b.cult].race })); break; }
    if (y % 7 === 3) { const ids = Object.keys(APPLY), id = ids[(r() * ids.length) | 0], x = r() * W, yy = 8 + r() * (H - 16); (globalThis as any).lastAct = id + '@' + w.year; const res = APPLY[id](w, x, yy, 4, { level: w.h[(yy | 0) * W + (x | 0)], power: 1 }, (r() * 4) | 0); if (res !== false && MYTHIC[id]) noteAct(w, MYTHIC[id], x, yy, 4); if (w.edited) { w.edited = false; refreshWater(w); } acts++; }
    if (y % 13 === 5) { look(w, r() * W, r() * H, 1 + r() * 20); looks++; }
    if (y % 50 === 49) { for (const kind of ['peoples', 'places', 'figures', 'beasts', 'artifacts', 'faiths', 'myths']) { const L = legendIndex(w, kind); for (let q = 0; q < 3 && L.length; q++) { const it = L[(r() * L.length) | 0]; if (it.ref) { legendPage(w, it.ref); pages++; } } } const f = w.figs.filter((q: any) => !q.died); if (f.length) nudge(w, f[(r() * f.length) | 0].id, ['bless', 'curse', 'vision'][(r() * 3) | 0]); }
    if (y === Math.floor(years / 2)) { const buf = saveWorld(w); w = loadWorld(buf); w.sync = true; console.log('  saved+loaded', (buf.byteLength / 1024 / 1024).toFixed(1) + 'MB at year', w.year); }
  }
  const alive = w.cults.filter((c: any) => c.alive);
  console.log(T.id.padEnd(9), `${((Date.now() - t0) / years).toFixed(0)}ms/yr y${w.year} pop ${w.stats.people} peoples ${alive.length} sets ${w.sets.length} ruins ${w.ruins.length} faiths ${w.faiths.filter((f: any) => f.alive).length}(${w.faiths.filter((f: any) => f.alive && f.god).length} yours) beasts ${w.beasts.length}+${w.dragons.length}+${w.krakens.length} figs ${w.figs.filter((f: any) => !f.died).length}/${w.figs.length} myths ${w.myths.length} works ${w.projects.filter((p: any) => p.done).length} arts ${w.arts.length} regs ${w.regs.length} ev ${evs} acts ${acts} looks ${looks} pages ${pages} found ${Object.keys(w.found).length}`);
}
