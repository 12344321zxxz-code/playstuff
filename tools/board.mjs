// (Nov 3) The scoreboard: one value per world for each outcome, then per run the median and a bootstrap 90% interval
// of the mean taken over worlds (never over milestones), and for every run after the first the paired difference
// against the first on the seeds they share. Pace, population and turnover sit beside leadership as co-primary outcomes.
//   node tools/board.mjs <baseline folder> <folder> ...      (experiment folders with out/, or archived runs)
import { load } from './headline.mjs';
const dirs = process.argv.slice(2), R = dirs.map(load);
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const medv = (a) => { a = a.slice().sort((x, y) => x - y); return a.length ? a[a.length >> 1] : null; };
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const boot = (a, f = mean, n = 1000) => { if (a.length < 3) return null; const v = []; for (let k = 0; k < n; k++) { const b = []; for (let i = 0; i < a.length; i++) b.push(a[(rnd() * a.length) | 0]); v.push(f(b)); } v.sort((x, y) => x - y); return [v[Math.floor(0.05 * n)], v[Math.floor(0.95 * n)]]; };
const ft = (r) => r.firstTo || {}, cents = (r, lo, hi) => (r.dev || []).filter((c) => c.F >= lo && c.F <= hi);
const frac = (xs) => (xs.length ? xs.filter(Boolean).length / xs.length : null);
// per-world metrics: [name, fn(world) -> number|null, higher is (+ better / - worse / 0 neutral) for the arrow]
export const M = [
  ['biggest first, ages 6-8 (share of entries)', (r) => frac([6, 7, 8].map((t) => ft(r)[t]).filter(Boolean).map((f) => f.rank === 1))],
  ['biggest first, age 5', (r) => (ft(r)[5] ? +(ft(r)[5].rank === 1) : null)],
  ['outside top 3 (people and land) first, 6-8', (r) => frac([6, 7, 8].map((t) => ft(r)[t]).filter(Boolean).map((f) => f.rank > 3 && f.lrank > 3))],
  ['first holder of key arts was the biggest', (r) => frac(Object.values(r.keyFirst || {}).map((f) => f.rank === 1))],
  ['first holder of key arts: its share of people', (r) => { const v = Object.values(r.keyFirst || {}).map((f) => f.share); return v.length ? mean(v) : null; }],
  ['distinct realms first into ages 4-9', (r) => { const s = new Set([4, 5, 6, 7, 8, 9].map((t) => ft(r)[t] && ft(r)[t].id).filter((v) => v != null)); return s.size || null; }],
  ['same realm first into consecutive ages', (r) => { const v = []; for (let t = 5; t < 9; t++) if (ft(r)[t] && ft(r)[t + 1]) v.push(ft(r)[t].id === ft(r)[t + 1].id); return frac(v); }],
  ['size-knowledge rank corr, ages 5-8', (r) => { const v = cents(r, 5, 8).map((c) => c.rho).filter((x) => x != null); return v.length ? medv(v) : null; }],
  ['largest realm share of people, ages 5-8', (r) => { const v = cents(r, 5, 8).map((c) => c.top1).filter((x) => x != null); return v.length ? medv(v) : null; }],
  ['realms with 1%+ of people, ages 5-8', (r) => { const v = cents(r, 5, 8).map((c) => c.n); return v.length ? medv(v) : null; }],
  ['industry held by the top realm, ages 6+', (r) => { const v = cents(r, 6, 10).map((c) => c.indTop1).filter((x) => x != null); return v.length ? medv(v) : null; }],
  ['land 2+ ages behind, ages 5-8 (%)', (r) => { const v = cents(r, 5, 8).map((c) => c.land[2] + c.land[3]); return v.length ? medv(v) : null; }],
  ['urban share of people, ages 6-8', (r) => { const v = cents(r, 6, 8).map((c) => c.urb).filter((x) => x != null); return v.length ? medv(v) : null; }],
  ['year into age 6 (null if never)', (r) => (ft(r)[6] ? ft(r)[6].y : null)],
  ['reached age 6 by 2000', (r) => +!!ft(r)[6]],
  ['reached age 8 by 2000', (r) => +!!ft(r)[8]],
  ['peak population (bn)', (r) => (r.peakPop || 0) / 1e6],
  ['steam-age foreign turnover %', (r) => { const x = (r.toRaw || [])[4]; return x && x[0] ? (100 * x[1]) / x[0] : null; }],
  ['steam-age internal turnover %', (r) => { const x = (r.toRaw || [])[4]; return x && x[0] ? (100 * x[2]) / x[0] : null; }],
  ['NaN world', (r) => +(r.nan > 0)],
  ['ms per tick', (r) => r.msPerTick],
  ['gate: coal-less realm-years blocked', (r) => (r.gates ? r.gates.gateCoal + r.gates.gateCoalImp : null)],
  ['gate: law blocked realm-years', (r) => (r.gates ? r.gates.gateLaw : null)],
  ['gate: civil service blocked realm-years', (r) => (r.gates ? r.gates.gateBur : null)],
  ['gate: towns kept out of the market quota', (r) => (r.gates ? r.gates.gateMarket : null)],
  ['gate: breakaways turned into defections', (r) => (r.gates ? r.gates.capDefect : null)],
];
const fmt = (v) => (v == null ? '–' : Math.abs(v) >= 100 ? String(Math.round(v)) : (+v.toFixed(2)).toString());
if (process.argv[1] && process.argv[1].endsWith('board.mjs')) {
  console.log('runs: ' + dirs.map((d, i) => `${d.split('/').filter(Boolean).pop()} (${R[i].size} worlds)`).join(', '));
  console.log('per run: mean over worlds [90% bootstrap]  n;  then for runs 2+: paired difference vs the first [90%] on shared seeds\n');
  for (const [name, f] of M) {
    const cells = R.map((m, i) => { const vals = [...m.values()].map(f).filter((v) => v != null && Number.isFinite(v)); if (!vals.length) return '–'; const ci = boot(vals); let s = `${fmt(mean(vals))} [${ci ? fmt(ci[0]) + ',' + fmt(ci[1]) : '–'}] n${vals.length}`;
      if (i > 0) { const d = []; for (const [sd, r] of m) { const b = R[0].get(sd); if (!b) continue; const x = f(r), y = f(b); if (x != null && y != null && Number.isFinite(x) && Number.isFinite(y)) d.push(x - y); } if (d.length >= 3) { const c2 = boot(d); s += `  Δ ${fmt(mean(d))} [${fmt(c2[0])},${fmt(c2[1])}]${c2[0] > 0 || c2[1] < 0 ? ' *' : ''}`; } }
      return s; });
    console.log(name.padEnd(46) + cells.map((c) => c.padEnd(44)).join(''));
  }
}
