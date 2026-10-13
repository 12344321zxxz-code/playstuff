// Save, load and keep running: a world loaded in a fresh process must stay identical to the original.
//   node test/save.mjs [seed] [years]          (spawns a second process for the loaded copy)
import { TPY } from '../src/core.js';
import { makeWorld, tick, settle } from '../src/world.js';
import { encodeWorld, decodeWorld, gzip, gunzip } from '../src/save.js';
import { writeFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const sig = (w) => [w.year, w.stats.people, w.sets.length, w.cults.filter((c) => c.alive).length, w.rnd.s, w.ruins.length, (w.spirits || []).length].join(',');
const file = '/tmp/formi-save-test.formi';
if (process.argv[2] === '--child') { const w = decodeWorld(await gunzip(readFileSync(file))); for (let i = 0; i < 100 * TPY; i++) tick(w); console.log(sig(w)); process.exit(0); }
const seed = +(process.argv[2] || 7), years = +(process.argv[3] || 200);
const a = makeWorld(seed); for (let i = 0; i < years * TPY; i++) tick(a);
settle(a); let t = Date.now(); const raw = encodeWorld(a), gz = await gzip(raw); writeFileSync(file, gz);
console.log('save', (raw.length / 1e6).toFixed(1), 'MB raw', (gz.length / 1e6).toFixed(1), 'MB gz', Date.now() - t, 'ms');
for (let i = 0; i < 100 * TPY; i++) tick(a);
const sa = sig(a), sb = execFileSync('node', [new URL(import.meta.url).pathname, '--child']).toString().trim();
console.log('A', sa); console.log('B', sb); console.log(sa === sb ? 'SAVE OK' : 'SAVE MISMATCH'); process.exit(sa === sb ? 0 : 1);
