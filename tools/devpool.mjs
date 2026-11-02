// (Nov 2, holistic) Pool the development meter (devmeter.mjs) over many worlds.
//   node tools/devpool.mjs dir/*.json
// Per frontier age: median and spread across worlds of the share of people / land 0,1,2,3+ ages behind (by district),
// the same land read at its realm's age, the share of a realm's people behind its own court, rank correlation of
// realm size with knowledge, and the share of frontier realm-decades held by realms outside the top 3.
// Then where knowledge comes from by realm size, and who reached each age first (rank now, 100 years before, by land).
import { readFileSync } from 'node:fs';
import { SCALE } from '../src/core.js';
const rs = []; for (const f of process.argv.slice(2)) { try { const r = JSON.parse(readFileSync(f, 'utf8').trim().split('\n').pop()); if (r.dev) rs.push(r); } catch {} }
const med = (a) => { a = a.filter((v) => v != null && Number.isFinite(v)).sort((x, y) => x - y); return a.length ? a[a.length >> 1] : null; };
const q = (a, p) => { a = a.filter((v) => v != null && Number.isFinite(v)).sort((x, y) => x - y); return a.length ? a[Math.min(a.length - 1, Math.floor(p * a.length))] : null; };
const f1 = (v) => (v == null ? '  -' : String(Math.round(v)).padStart(3));
console.log(`${rs.length} worlds\n\nBy frontier age (one value per world: its centuries at that age averaged; median [10th-90th pct] across worlds)`);
console.log('age  worlds  people 2+ behind   land 2+ behind    land 2+ (realm age)  land 1+ behind   within-realm 1+   rho(size,know)  tall share');
for (let F = 3; F <= 9; F++) {
  const per = rs.map((r) => r.dev.filter((c) => c.F === F)).filter((a) => a.length);
  if (!per.length) continue;
  const avg = (a, f) => { const v = a.map(f).filter((x) => x != null); return v.length ? v.reduce((x, y) => x + y, 0) / v.length : null; };
  const P2 = per.map((a) => avg(a, (c) => c.lag[2] + c.lag[3])), L2 = per.map((a) => avg(a, (c) => c.land[2] + c.land[3])), R2 = per.map((a) => avg(a, (c) => c.rland[2] + c.rland[3])), L1 = per.map((a) => avg(a, (c) => c.land[1] + c.land[2] + c.land[3])), Wi = per.map((a) => avg(a, (c) => c.within)), Rh = per.map((a) => avg(a, (c) => c.rho)), Ta = per.map((a) => avg(a, (c) => c.tall));
  const s = (A) => `${f1(med(A))} [${f1(q(A, 0.1))}-${f1(q(A, 0.9))}]`;
  console.log(`${F}    ${String(per.length).padStart(3)}     ${s(P2)}      ${s(L2)}      ${s(R2)}        ${s(L1)}    ${s(Wi)}      ${med(Rh) == null ? '  -' : med(Rh).toFixed(2)}          ${med(Ta) == null ? ' -' : med(Ta).toFixed(2)}`);
}
console.log('\nWhere knowledge comes from (share of all gains, pooled), by realm size tercile');
for (const era of ['early', 'late']) for (const t of ['big', 'mid', 'small']) { const S = {}; let tot = 0; for (const r of rs) { const B = ((r.devKl || {})[era] || {})[t] || {}; for (const k in B) if (k !== 'n') { S[k] = (S[k] || 0) + B[k]; tot += B[k]; } }
  if (tot) console.log(`${era.padEnd(5)} ${t.padEnd(5)}  ` + Object.entries(S).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${Math.round((100 * v) / tot)}%`).join('  ')); }
console.log('\nFirst into each age: biggest by people now / 100 years before / biggest by land; median ranks');
for (let t = 4; t <= 8; t++) { const F = rs.map((r) => r.firstTo && r.firstTo[t]).filter(Boolean); if (!F.length) continue; const b = (k) => { const v = F.filter((f) => f[k] != null); return v.length ? (v.filter((f) => f[k] === 1).length / v.length).toFixed(2) : ' -'; };
  console.log(`age ${t}  n=${String(F.length).padStart(2)}  biggest now ${b('rank')}  100y before ${b('rank100')}  by land ${b('lrank')}   median rank now ${med(F.map((f) => f.rank))}, before ${med(F.map((f) => f.rank100))}, land ${med(F.map((f) => f.lrank))}   outside top 3 by both ${(F.filter((f) => f.rank > 3 && f.lrank > 3).length / F.length).toFixed(2)}`); }
console.log('\nOverall tall share (frontier realm-decades outside the top 3 by people and land):', med(rs.map((r) => r.tallShare)), ' peak pop median', ((med(rs.map((r) => r.peakPop)) * SCALE) / 1e9).toFixed(1) + 'bn', ' msPerTick', med(rs.map((r) => r.msPerTick)));
console.log('\nArt lags (years after the first holder until another realm holds it; median [25th-75th], n), by art tier');
for (let t = 2; t <= 9; t++) { const row = ['tied', 'land', 'far'].map((g) => { const a = rs.flatMap((r) => ((r.artLag || {})[t] || {})[g] || []).sort((x, y) => x - y); const c = rs.reduce((n, r) => n + (((r.artCens || {})[t] || {})[g] || 0), 0); return a.length ? `${g} ${a[a.length >> 1]} [${a[a.length >> 2]}-${a[(3 * a.length) >> 2]}] n=${a.length}${c ? ' +' + c + ' never' : ''}` : `${g} -`; }); console.log(`tier ${t}:  ` + row.join('   ')); }
console.log('\nDeployment: years from a court reaching an age until half its people live at it (median [25th-75th], n; +never = 100+ years and still not)');
for (let t = 5; t <= 9; t++) { const row = ['big', 'small'].map((g) => { const a = rs.flatMap((r) => ((r.scaleLag || {})[t] || {})[g] || []).sort((x, y) => x - y); const c = rs.reduce((n, r) => n + (((r.scaleCens || {})[t] || {})[g] || 0), 0); return a.length ? `${g === 'big' ? 'top-3 realms' : 'others'} ${a[a.length >> 1]} [${a[a.length >> 2]}-${a[(3 * a.length) >> 2]}] n=${a.length}${c ? ' +' + c + ' never' : ''}` : `${g} -`; }); console.log(`age ${t}:  ` + row.join('   ')); }
const yr = (t) => rs.map((r) => (r.firstTo && r.firstTo[t] ? r.firstTo[t].y : null)); console.log('\nmedian year the world first reached age 5..8:', [5, 6, 7, 8].map((t) => med(yr(t)) + ' (n=' + yr(t).filter((v) => v != null).length + ')').join('  '));
