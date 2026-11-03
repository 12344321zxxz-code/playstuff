// (Nov 3, holistic) The headline numbers of several experiment folders side by side, on the seeds they share.
//   node tools/headline.mjs dirA dirB ...
import { readFileSync, readdirSync } from 'node:fs';
import { SCALE } from '../src/core.js';
import { existsSync } from 'node:fs';
// a folder of results: an experiment folder (with out/) or an archived run (the files themselves)
export const load = (d) => { const m = new Map(); const o = existsSync(d + '/out') ? d + '/out' : d; for (const f of readdirSync(o)) { const k = /^b(\d+)\.json$/.exec(f); if (!k) continue; try { const r = JSON.parse(readFileSync(o + '/' + f, 'utf8').trim().split('\n').pop()); m.set(+k[1], r); } catch {} } return m; };
const med = (a) => { a = a.filter((v) => v != null && Number.isFinite(v)).sort((x, y) => x - y); return a.length ? a[a.length >> 1] : null; };
const f = (v, d = 2) => (v == null ? '-' : typeof v === 'number' ? (Number.isInteger(v) ? String(v) : v.toFixed(d)) : v);
const main = () => { const dirs = process.argv.slice(2), D = dirs.map(load);
  const common = [...D[0].keys()].filter((s) => D.every((m) => m.has(s))).sort((a, b) => a - b);
  console.log(`${common.length} common seeds: ${common.join(' ')}\n`);
  return { dirs, D, common }; };
export const rows = [
  ['biggest first, ages 5-8 pooled', (rs) => { const F = rs.flatMap((r) => [5, 6, 7, 8].map((t) => r.firstTo && r.firstTo[t]).filter(Boolean)); return F.length ? F.filter((x) => x.rank === 1).length / F.length : null; }],
  ['outside top 3 by people and land first, 5-8', (rs) => { const F = rs.flatMap((r) => [5, 6, 7, 8].map((t) => r.firstTo && r.firstTo[t]).filter(Boolean)); return F.length ? F.filter((x) => x.rank > 3 && x.lrank > 3).length / F.length : null; }],
  ['rho(size,know) ages 5-8 (median century)', (rs) => med(rs.flatMap((r) => (r.dev || []).filter((c) => c.F >= 5 && c.F <= 8).map((c) => c.rho)))],
  ['tall share of frontier (decades)', (rs) => med(rs.map((r) => r.tallShare))],
  ['land 2+ behind, ages 5-8 (median century %)', (rs) => med(rs.flatMap((r) => (r.dev || []).filter((c) => c.F >= 5 && c.F <= 8).map((c) => c.land[2] + c.land[3])))],
  ['people 2+ behind, ages 5-8', (rs) => med(rs.flatMap((r) => (r.dev || []).filter((c) => c.F >= 5 && c.F <= 8).map((c) => c.lag[2] + c.lag[3])))],
  ['within-realm 1+ behind, ages 5-8', (rs) => med(rs.flatMap((r) => (r.dev || []).filter((c) => c.F >= 5 && c.F <= 8).map((c) => c.within)))],
  ['median year into age 5', (rs) => med(rs.map((r) => r.firstTo && r.firstTo[5] && r.firstTo[5].y))],
  ['median year into age 6', (rs) => med(rs.map((r) => r.firstTo && r.firstTo[6] && r.firstTo[6].y))],
  ['median year into age 7', (rs) => med(rs.map((r) => r.firstTo && r.firstTo[7] && r.firstTo[7].y))],
  ['median year into age 8', (rs) => med(rs.map((r) => r.firstTo && r.firstTo[8] && r.firstTo[8].y))],
  ['worlds reaching age 8 / 9', (rs) => rs.filter((r) => r.eraMax >= 8).length + ' / ' + rs.filter((r) => r.eraMax >= 9).length],
  ['peak pop, all worlds (bn)', (rs) => (med(rs.map((r) => r.peakPop)) * SCALE) / 1e9],
  ['peak pop, info-age worlds (bn)', (rs) => { const v = med(rs.filter((r) => r.peakAge >= 9).map((r) => r.peakPop)); return v == null ? null : (v * SCALE) / 1e9; }],
  ['steam-age colonial % (pooled)', (rs) => { let a = 0, c = 0; for (const r of rs) { const x = (r.toRaw || [])[4]; if (x) { a += x[0]; c += x[3]; } } return a ? (100 * c) / a : null; }],
  ['steam-age foreign / internal % (pooled)', (rs) => { let a = 0, fo = 0, i = 0; for (const r of rs) { const x = (r.toRaw || [])[4]; if (x) { a += x[0]; fo += x[1]; i += x[2]; } } return a ? `${((100 * fo) / a).toFixed(0)} / ${((100 * i) / a).toFixed(0)}` : null; }],
  ['largest realm share of people, ages 5-8', (rs) => med(rs.flatMap((r) => (r.dev || []).filter((c) => c.F >= 5 && c.F <= 8 && c.top1 != null).map((c) => c.top1)))],
  ['top-3 realms share, ages 5-8', (rs) => med(rs.flatMap((r) => (r.dev || []).filter((c) => c.F >= 5 && c.F <= 8 && c.top3 != null).map((c) => c.top3)))],
  ['realms with 1%+ of people, ages 5-8', (rs) => med(rs.flatMap((r) => (r.dev || []).filter((c) => c.F >= 5 && c.F <= 8).map((c) => c.n)))],
  ['living realms, ages 5-8', (rs) => med(rs.flatMap((r) => (r.dev || []).filter((c) => c.F >= 5 && c.F <= 8 && c.realms != null).map((c) => c.realms)))],
  ['first into 5-8: median share of people', (rs) => med(rs.flatMap((r) => [5, 6, 7, 8].map((t) => r.firstTo && r.firstTo[t] && r.firstTo[t].share)))],
  ['NaN worlds', (rs) => rs.filter((r) => r.nan > 0).length],
  ['ms per tick', (rs) => med(rs.map((r) => r.msPerTick))],
];
export const summarize = (rs) => Object.fromEntries(rows.map(([k, fn]) => { try { const v = fn(rs); return [k, typeof v === 'number' ? +v.toFixed(3) : v]; } catch { return [k, null]; } }));
if (process.argv[1] && process.argv[1].endsWith('headline.mjs')) { const { dirs, D, common } = main();
console.log('metric'.padEnd(46) + dirs.map((d) => d.split('/').pop().padStart(12)).join(''));
for (const [name, fn] of rows) console.log(name.padEnd(46) + D.map((m) => f(fn(common.map((s) => m.get(s)))).padStart(12)).join(''));
}
