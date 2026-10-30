// Pool the turnover of several worlds (stats.mjs JSON lines, one file per seed) and compare with the
// targets per leading age.   node tools/turnpool.mjs dir/*.json
import { readFileSync } from 'node:fs';
const BUCKETS = ['1-2', '3', '4', '5', '6', '7', '8', '9-10'];   /* as in turnover.mjs (not imported: that pulls in the whole sim) */
// targets per century (foreign, of which colonial, internal), from the turnover reconstructions; null = not gated
const TGT = { '1-2': [20, null, 12], 3: [30, null, 17], 4: [30, null, 28], 5: [20, 3, 15], 6: [35, 25, 10], 7: [25, 8, 25], 8: [3, 0, 30], '9-10': [2, 0, 12] };
const acc = BUCKETS.map(() => [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]); let n = 0; const gaps = [], per = [];
for (const f of process.argv.slice(2)) { let r; try { r = JSON.parse(readFileSync(f, 'utf8').trim().split('\n').pop()); } catch { continue; } if (!r.toRaw) continue; n++; r.toRaw.forEach((v, k) => v.forEach((x, j) => (acc[k][j] += x || 0))); if (r.to6Gap != null) gaps.push(r.to6Gap); const st = r.toRaw[4]; if (st && st[0]) per.push({ seed: r.seed, col: (100 * st[3]) / st[0], pool: (100 * st[10]) / st[0], c: st[6] }); }
console.log(`${n} worlds pooled`); console.log('age    cents  foreign (tgt)    colonial (tgt)  internal (tgt)   decol  razed  behind2+');
const fm = (v, t) => (v == null ? '  —  ' : v.toFixed(1).padStart(5)) + (t == null ? '      ' : ` (${String(t).padStart(2)})`) + (v != null && t != null ? (Math.abs(v - t) <= tol(t) ? ' ok ' : ' OFF') : '    ');
// tolerance: the sources' own error bands (bronze ±20 points, iron ±15, medieval to steam ±10; the modern series ±40%, at least 2 points)
let BAND = 10; const tol = (t) => (BAND < 0 ? Math.max(2, 0.4 * t) : BAND);
acc.forEach((b, k) => { BAND = k === 0 ? 20 : k === 1 ? 15 : k <= 4 ? 10 : -1; const [area, f, i, col, decol, raze, c, gap, fPow, fCli, pool] = b, p = (v) => (area ? (100 * v) / area : null), t = TGT[BUCKETS[k]];
  console.log(`${BUCKETS[k].padEnd(5)} ${String(c).padStart(5)}  ${fm(p(f), t[0])}  ${fm(p(col), t[1])}  ${fm(p(i), t[2])}  ${fm(p(decol), null)} ${fm(p(raze), null)} ${fm(p(gap), null)}  (of foreign: to powers ${p(fPow) == null ? '-' : p(fPow).toFixed(1)}, made clients ${p(fCli) == null ? '-' : p(fCli).toFixed(1)}; colonial pool ${p(pool) == null ? '-' : p(pool).toFixed(1)})`); });
gaps.sort((a, b) => a - b); console.log(`steam age, land 2+ ages behind, per world: ${gaps.join(', ')}  (soft band for the median 15-45; worlds should differ by 15+)`);
// the council's per-world test: the steam-age grab should follow how much backward land lies over the sea in reach
// (rank correlation across worlds), rather than every world hitting the pooled figure
if (per.length >= 3) { const rk = (k) => { const o = [...per].sort((a, b) => a[k] - b[k]); return per.map((p) => o.indexOf(p)); }, a = rk('col'), b = rk('pool'), m = per.length, d2 = a.reduce((t, x, i) => t + (x - b[i]) ** 2, 0);
  console.log(`steam age per world (seed: colonial / pool, centuries): ${per.map((p) => `${p.seed}: ${p.col.toFixed(0)}/${p.pool.toFixed(0)} (${p.c})`).join(', ')}`);
  console.log(`rank correlation colonial~pool ${(1 - (6 * d2) / (m * (m * m - 1))).toFixed(2)} (want clearly positive)`); }
// (Oct 30, council step 0) diagnostics: who takes the colonial land, the unclaimed pool, a second clock, and how crowded
{ const rs = []; for (const f of process.argv.slice(2)) { try { const r = JSON.parse(readFileSync(f, 'utf8').trim().split('\n').pop()); if (r.toRaw) rs.push(r); } catch {} }
  const sum = BUCKETS.map(() => [0, 0, 0, 0, 0]); for (const r of rs) r.toRaw.forEach((v, k) => { sum[k][0] += v[0] || 0; sum[k][1] += v[3] || 0; sum[k][2] += v[11] || 0; sum[k][3] += v[12] || 0; sum[k][4] += v[13] || 0; });
  console.log('\nage    colonial  of it by industrial takers (tech 6+)  unclaimed pool  near-colonial (far, not by sea)');
  sum.forEach((b, k) => { if (!b[0]) return; const p = (v) => ((100 * v) / b[0]).toFixed(1).padStart(5); console.log(`${BUCKETS[k].padEnd(5)} ${p(b[1])}     ${b[1] ? ((100 * b[2]) / b[1]).toFixed(0).padStart(3) + '%' : '  - '}                                ${p(b[3])}           ${p(b[4])}`); });
  const alt = BUCKETS.map(() => [0, 0, 0, 0, 0]), bk = (t) => (t <= 2 ? 0 : t >= 9 ? 7 : t - 2);
  for (const r of rs) for (const c of r.toCent || []) if (c.length >= 15) { const a = alt[bk(c[4])]; a[0] += c[11]; a[1] += c[12]; a[2] += c[13]; a[3] += c[14]; a[4]++; }
  console.log('\nsecond clock (most advanced realm with 1% of people): foreign / colonial / internal');
  alt.forEach((a, k) => { if (!a[0]) return; const p = (v) => ((100 * v) / a[0]).toFixed(1).padStart(5); const t = TGT[BUCKETS[k]]; console.log(`${BUCKETS[k].padEnd(5)} ${String(a[4]).padStart(4)}  ${p(a[1])} (${t[0]})  ${p(a[3])} (${t[1] ?? '-'})  ${p(a[2])} (${t[2]})`); });
  console.log('\nsteam centuries per world (seed: year colonial%/unclaimed pool% living/cap, rifle+steam powers, industrial powers)');
  for (const r of rs) { const st = (r.toCent || []).filter((c) => c[1] === 6 && c.length >= 15); if (st.length) console.log(`  ${r.seed}: ` + st.map((c) => `${c[0]} ${c[5]}/${c[6]} ${c[7]}/${c[8]} r${c[9]} i${c[10]}`).join(' | ')); }
}
