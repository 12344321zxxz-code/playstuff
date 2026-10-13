// Multi-seed experiments with paired A/B and gates.
//   node tools/exp.mjs --seeds 1-20 --years 1500 [--patch b.json] [--jobs 2] [--gates gates.json]
// Every seed runs with the base settings (A) and, if --patch is given, with the patch (B), each in its
// own process. Prints distributions (p10 / median / p90), paired B-vs-A deltas, and gate results.
// A "null" patch ({}) measures how far worlds drift by chance alone, as a noise baseline.
import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const [s0, s1] = arg('seeds', '1-6').split('-').map(Number), years = +arg('years', 1200), jobs = +arg('jobs', 2), patch = arg('patch'), gatesF = arg('gates', new URL('../test/gates.json', import.meta.url).pathname);
const seeds = []; for (let s = s0; s <= (s1 || s0); s++) seeds.push(s);
const runOne = (seed, p) => new Promise((ok) => { const args = [new URL('./stats.mjs', import.meta.url).pathname, seed, years]; if (p) args.push(p); let out = ''; const ch = spawn('node', args); ch.stdout.on('data', (d) => (out += d)); ch.stderr.on('data', (d) => (out += d)); ch.on('close', () => { try { ok(JSON.parse(out.trim().split('\n').pop())); } catch (e) { ok({ seed, error: out.slice(-400) }); } }); });
const queue = []; for (const s of seeds) { queue.push([s, null]); if (patch) queue.push([s, patch]); }
const res = { A: {}, B: {} }; let i = 0;
await Promise.all(Array.from({ length: jobs }, async () => { while (i < queue.length) { const [s, p] = queue[i++]; const r = await runOne(s, p); (p ? res.B : res.A)[s] = r; process.stderr.write(`${p ? 'B' : 'A'} seed ${s} ${r.error ? 'ERROR' : 'ok'}\n`); } }));
const q = (xs, f) => { const a = xs.filter((v) => v != null && Number.isFinite(v)).sort((x, y) => x - y); if (!a.length) return null; return a[Math.min(a.length - 1, Math.floor(f * a.length))]; };
const dist = (xs) => `p10 ${q(xs, 0.1)} | med ${q(xs, 0.5)} | p90 ${q(xs, 0.9)}`;
const metrics = (set) => { const rs = Object.values(set).filter((r) => !r.error); const keys = Object.keys(rs[0] || {}).filter((k) => typeof rs[0][k] === 'number' && k !== 'seed'); const m = {}; for (const k of keys) m[k] = rs.map((r) => r[k]); return { rs, m }; };
const A = metrics(res.A); console.log(`\n== A (${A.rs.length} seeds × ${years} years)`); for (const k in A.m) console.log(`${k.padEnd(18)} ${dist(A.m[k])}`);
const causes = {}; for (const r of A.rs) for (const k in r.causes || {}) causes[k] = (causes[k] || 0) + r.causes[k]; const ct = Object.values(causes).reduce((a, b) => a + b, 0) || 1;
console.log('collapse top causes: ' + Object.entries(causes).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${Math.round((v / ct) * 100)}%`).join(', '));
if (patch) { const B = metrics(res.B); console.log(`\n== B vs A (paired, ${B.rs.length} seeds)`); for (const k in B.m) { let up = 0, n = 0; const d = []; for (const s of seeds) { const a = res.A[s], b = res.B[s]; if (!a || !b || a.error || b.error) continue; n++; if (b[k] > a[k]) up++; d.push(+(b[k] - a[k]).toFixed(3)); } console.log(`${k.padEnd(18)} B>A on ${up}/${n}  Δ ${dist(d)}`); } }
let fail = 0; if (existsSync(gatesF)) { const G = JSON.parse(readFileSync(gatesF, 'utf8')); console.log('\n== gates'); for (const g of G) { const v = q(A.m[g.metric] || [], g.q ?? 0.5); const ok = v != null && (g.min == null || v >= g.min) && (g.max == null || v <= g.max); if (!ok && g.hard) fail++; console.log(`${ok ? 'PASS' : g.hard ? 'FAIL' : 'warn'} ${g.metric} q${g.q ?? 0.5}=${v} in [${g.min ?? '-'}, ${g.max ?? '-'}]${g.note ? ' — ' + g.note : ''}`); } }
const errs = [...Object.values(res.A), ...Object.values(res.B)].filter((r) => r.error); if (errs.length) { console.log('\nERRORS:'); for (const e of errs) console.log(e.seed, e.error); fail++; }
process.exit(fail ? 1 : 0);
