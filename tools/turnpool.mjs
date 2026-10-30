// Pool the turnover of several worlds (stats.mjs JSON lines, one file per seed) and compare with the
// targets per leading age.   node tools/turnpool.mjs dir/*.json
import { readFileSync } from 'node:fs';
import { BUCKETS } from './turnover.mjs';
// targets per century (foreign, of which colonial, internal), from the turnover reconstructions; null = not gated
const TGT = { '1-2': [20, null, 12], 3: [30, null, 17], 4: [30, null, 28], 5: [20, 3, 15], 6: [35, 25, 10], 7: [25, 8, 25], 8: [3, 0, 30], '9-10': [2, 0, 12] };
const acc = BUCKETS.map(() => [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]); let n = 0; const gaps = [];
for (const f of process.argv.slice(2)) { let r; try { r = JSON.parse(readFileSync(f, 'utf8').trim().split('\n').pop()); } catch { continue; } if (!r.toRaw) continue; n++; r.toRaw.forEach((v, k) => v.forEach((x, j) => (acc[k][j] += x || 0))); if (r.to6Gap != null) gaps.push(r.to6Gap); }
console.log(`${n} worlds pooled`); console.log('age    cents  foreign (tgt)    colonial (tgt)  internal (tgt)   decol  razed  behind2+');
const fm = (v, t) => (v == null ? '  —  ' : v.toFixed(1).padStart(5)) + (t == null ? '      ' : ` (${String(t).padStart(2)})`) + (v != null && t != null ? (Math.abs(v - t) <= tol(t) ? ' ok ' : ' OFF') : '    ');
// tolerance: the sources' own error bands (bronze ±20 points, iron ±15, medieval to steam ±10; the modern series ±40%, at least 2 points)
let BAND = 10; const tol = (t) => (BAND < 0 ? Math.max(2, 0.4 * t) : BAND);
acc.forEach((b, k) => { BAND = k === 0 ? 20 : k === 1 ? 15 : k <= 4 ? 10 : -1; const [area, f, i, col, decol, raze, c, gap, fPow, fCli] = b, p = (v) => (area ? (100 * v) / area : null), t = TGT[BUCKETS[k]];
  console.log(`${BUCKETS[k].padEnd(5)} ${String(c).padStart(5)}  ${fm(p(f), t[0])}  ${fm(p(col), t[1])}  ${fm(p(i), t[2])}  ${fm(p(decol), null)} ${fm(p(raze), null)} ${fm(p(gap), null)}  (of foreign: to powers ${p(fPow) == null ? '-' : p(fPow).toFixed(1)}, made clients ${p(fCli) == null ? '-' : p(fCli).toFixed(1)})`); });
gaps.sort((a, b) => a - b); console.log(`steam age, land 2+ ages behind, per world: ${gaps.join(', ')}  (soft band for the median 15-45; worlds should differ by 15+)`);
