// (Nov 5, tech disparity v2) unit checks for FX.capital: know fast, build slow.   node test/capital.mjs
import { FX } from '../src/flags.js';
import { KN, capitalStep } from '../src/people.js';
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } else console.log('ok  ', m); };
const was = FX.capital; FX.capital = 1;
const w = { year: 0, mass: new Uint8Array(512 * 256) }, c = { arts: { engines: 1 }, rev: 0, _capWL: 0, big: null };
const rich = { lvl: 7, k: 5e7, pop: 1000, urb: 0.4, wealth: 400, _tie: 1, x: 0, y: 0 }, poor = { lvl: 7, k: 5e7, pop: 1000, urb: 0.05, wealth: 0, _tie: 0.2, x: 0, y: 0 };
for (let y = 0; y < 150; y++) { w.year = y; rich.lvl = 7; poor.lvl = 7; capitalStep(w, rich, c); capitalStep(w, poor, c); }
ok(rich.lvl > poor.lvl, `same knowledge: the rich district lives in age ${rich.lvl}, the poor one in ${poor.lvl}`);
ok(rich.k === 5e7 && poor.k === 5e7 && rich.klvl === 7 && poor.klvl === 7, 'building never changes what a district knows');
const K = rich.K, c2 = { arts: {}, rev: 0 }; rich.lvl = 7; capitalStep(w, rich, c2); ok(Math.abs(rich.K - K * (1 - KN.cd)) < 1e-9, 'a conquered district keeps its works (they only wear)');
rich.lastSack = w.year; const K2 = rich.K; rich.lvl = 7; capitalStep(w, rich, c2); ok(Math.abs(rich.K - K2 * 0.5 * (1 - KN.cd)) < 1e-9, 'a sack burns half');
const pre = { lvl: 5, k: 1e7, pop: 1000, urb: 0.4, wealth: 0, _tie: 1, x: 0, y: 0 }; capitalStep(w, pre, c); ok(pre.lvl === 5, 'before the age of steam nothing changes');
FX.capital = was;
if (bad) { console.log(bad, 'failed'); process.exit(1); } else console.log('all passed');
