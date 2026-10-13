// Run a world headless and write what it did, for reading and querying later.
//   node tools/probe.mjs --seed 7 --years 1500 --every 50 --out runs/s7 [--load save.formi] [--patch tweak.json] [--quiet]
// Writes into --out:
//   digest.txt      the world digest every --every years (the whole run in one file)
//   series.jsonl    one row per realm / power / world every 10 years
//   hist.jsonl      every ledger turning point
//   ckpt-<year>.formi  saved worlds every --ckpt years (default 500), for tools/q.mjs
import { TPY } from '../src/core.js';
import { makeWorld, tick, settle } from '../src/world.js';
import { encodeWorld, decodeWorld, gzip, gunzip, readSave } from '../src/save.js';
import { digest, seriesRows } from '../src/probe.js';
import { applyPatch } from './patch.mjs';
import { mkdirSync, writeFileSync, appendFileSync, readFileSync } from 'node:fs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : process.argv[i + 1]; };
const has = (k) => process.argv.includes('--' + k);
const seed = +arg('seed', 7), years = +arg('years', 1000), every = +arg('every', 50), ckpt = +arg('ckpt', 500), out = arg('out', `runs/s${seed}`);
mkdirSync(out, { recursive: true });
for (const f of ['digest.txt', 'series.jsonl', 'hist.jsonl']) writeFileSync(`${out}/${f}`, '');
if (arg('patch')) await applyPatch(JSON.parse(readFileSync(arg('patch'), 'utf8')));
const w = arg('load') ? await readSave(readFileSync(arg('load'))) : makeWorld(seed);
const start = w.year, t0 = Date.now(); let histAt = (w.hist || []).length ? w.hist[w.hist.length - 1].id : 0, slow = 0;
const flushHist = () => { const h = (w.hist || []).filter((e) => e.id > histAt); if (h.length) { appendFileSync(`${out}/hist.jsonl`, h.map((e) => JSON.stringify(e)).join('\n') + '\n'); histAt = h[h.length - 1].id; } };
for (let y = 1; y <= years; y++) {
  for (let k = 0; k < TPY; k++) { const a = performance.now(); tick(w); if (performance.now() - a > 16) slow++; }
  w.events.length = 0;
  if (w.year % 10 === 0) appendFileSync(`${out}/series.jsonl`, seriesRows(w).map((r) => JSON.stringify(r)).join('\n') + '\n');
  if (w.year % every === 0) { const d = digest(w); appendFileSync(`${out}/digest.txt`, d + '\n\n'); if (!has('quiet')) console.log(d.split('\n').slice(0, 4).join('\n')); }
  flushHist();
  if (w.year % ckpt === 0) { settle(w); writeFileSync(`${out}/ckpt-${w.year}.formi`, await gzip(encodeWorld(w))); }
}
settle(w); writeFileSync(`${out}/final.formi`, await gzip(encodeWorld(w)));
const ms = (Date.now() - t0) / ((w.year - start) * TPY);
console.log(`done: ${w.year - start} years, ${ms.toFixed(1)} ms/tick, ${slow} ticks over 16 ms, ${(w.hist || []).length} ledger records → ${out}`);
