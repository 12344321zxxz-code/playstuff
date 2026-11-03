// (Nov 3) Compact scoreboard: the baseline's mean, then for each arm the paired difference against it on shared seeds
// (mean, * when the 90% bootstrap interval excludes zero). node tools/board-compact.mjs <base> <arm> ...
import { load } from './headline.mjs';
import { M } from './board.mjs';
const dirs = process.argv.slice(2), R = dirs.map(load), names = dirs.map((d) => d.split('/').filter(Boolean).pop());
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const boot = (a, n = 1000) => { const v = []; for (let k = 0; k < n; k++) { let s = 0; for (let i = 0; i < a.length; i++) s += a[(rnd() * a.length) | 0]; v.push(s / a.length); } v.sort((x, y) => x - y); return [v[50], v[949]]; };
const fmt = (v) => (Math.abs(v) >= 100 ? String(Math.round(v)) : (+v.toFixed(2)).toString());
const ok = (v) => v != null && Number.isFinite(v);
console.log(''.padEnd(44) + names.map((n) => n.slice(0, 11).padEnd(12)).join(''));
for (const [name, f] of M) {
  const b = [...R[0].values()].map(f).filter(ok); let line = name.slice(0, 43).padEnd(44) + (b.length ? fmt(mean(b)) : '–').padEnd(12);
  for (let i = 1; i < R.length; i++) { const d = []; for (const [sd, r] of R[i]) { const y = R[0].get(sd); if (!y) continue; const p = f(r), q = f(y); if (ok(p) && ok(q)) d.push(p - q); }
    if (d.length < 3) { line += '–'.padEnd(12); continue; } const c = boot(d); line += ((mean(d) >= 0 ? '+' : '') + fmt(mean(d)) + (c[0] > 0 || c[1] < 0 ? '*' : '')).padEnd(12); }
  console.log(line);
}
