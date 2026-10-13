// Ask questions of a saved world or a run.
//   node tools/q.mjs <save.formi | run dir> "<query>" ["<query>" ...]
// Queries:
//   digest                     the one-screen world digest
//   realm <name|id>            one people in full, with its pressures and ledger
//   realms                     a line per living people
//   powers                     every great power
//   region <x>,<y> r<radius>   the places in a region, with a local map
//   map <layer> [cols rows]    owner | biome | memory | tier | faith | fallout | crop:<k>
//   why <ledger id>            a turning point and the chain behind it
//   hist [kind] [n]            the last n ledger records, optionally of one kind
//   series <realm> <fields> [from-to]   from a run dir's series.jsonl, as letter sparklines
//   run <years>                advance the loaded world, then answer the next queries
// With a run dir, the world is its final.formi unless a query starts with @<year> (nearest checkpoint).
import { TPY } from '../src/core.js';
import { tick } from '../src/world.js';
import { readSave } from '../src/save.js';
import { digest, realmCard, realmLine, findRealm, powersOf, regionCard, asciiMap, why, histLine } from '../src/probe.js';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';

const [src, ...qs] = process.argv.slice(2);
if (!src) { console.log(readFileSync(new URL(import.meta.url)).toString().split('\n').slice(0, 18).join('\n')); process.exit(0); }
const isDir = existsSync(src) && statSync(src).isDirectory();
const load = async (f) => readSave(readFileSync(f));
let w = null;
const worldAt = async (year) => {
  if (!isDir) return w || (w = await load(src));
  if (year == null) return w || (w = await load(`${src}/final.formi`));
  const ck = readdirSync(src).map((f) => /^ckpt-(\d+)\.formi$/.exec(f)).filter(Boolean).map((m) => +m[1]).filter((y) => y <= year).sort((a, b) => b - a)[0];
  w = ck != null ? await load(`${src}/ckpt-${ck}.formi`) : await load(`${src}/final.formi`);
  while (w.year < year) for (let k = 0; k < TPY; k++) tick(w);
  return w;
};
const spark = (vals) => { const lo = Math.min(...vals), hi = Math.max(...vals), s = 'abcdefghijklmnopqrstuvwxyz'; return vals.map((v) => s[hi > lo ? Math.round(((v - lo) / (hi - lo)) * 25) : 0]).join('') + `  (${lo}..${hi})`; };

for (let q of qs) {
  let at = null; const m = /^@(\d+)\s+(.*)$/.exec(q); if (m) { at = +m[1]; q = m[2]; }
  const [cmd, ...a] = q.trim().split(/\s+/);
  const W0 = cmd === 'series' ? null : await worldAt(at);
  console.log(`\n>>> ${q}${W0 ? ` (year ${W0.year})` : ''}`);
  if (cmd === 'digest') console.log(digest(W0, { realms: 20, hist: 20 }));
  else if (cmd === 'realm') { const c = findRealm(W0, a.join(' ')); console.log(c ? realmCard(W0, c) : 'no such people'); }
  else if (cmd === 'realms') console.log(W0.cults.filter((c) => c.alive).map((c) => realmLine(W0, c)).join('\n'));
  else if (cmd === 'powers') console.log(powersOf(W0).map((p) => JSON.stringify(p)).join('\n') || 'none');
  else if (cmd === 'region') { const [x, y] = a[0].split(',').map(Number), r = +(a[1] || 'r12').slice(1); console.log(regionCard(W0, x, y, r)); }
  else if (cmd === 'map') console.log(asciiMap(W0, a[0] || 'owner', +(a[1] || 128), +(a[2] || 64)));
  else if (cmd === 'why') console.log(why(W0, +a[0].replace('#', '')));
  else if (cmd === 'hist') { const kind = isNaN(+a[0]) ? a[0] : null, n = +(kind ? a[1] : a[0]) || 20; console.log((W0.hist || []).filter((e) => !kind || e.k === kind).slice(-n).map((e) => histLine(W0, e)).join('\n')); }
  else if (cmd === 'run') { for (let i = 0; i < +a[0] * TPY; i++) tick(W0); console.log('now year', W0.year); }
  else if (cmd === 'series') {
    if (!isDir) { console.log('series needs a run dir'); continue; }
    const [who, fields, range] = a, [from, to] = (range || '0-99999').split('-').map(Number);
    const rows = readFileSync(`${src}/series.jsonl`, 'utf8').trim().split('\n').map((l) => JSON.parse(l)).filter((r) => r.y >= from && r.y <= to && (who === 'world' ? r.t === 'world' : r.t === 'realm' && (String(r.id) === who || r.name.toLowerCase() === who.toLowerCase())));
    for (const f of fields.split(',')) console.log(`${f.padEnd(6)} ${spark(rows.map((r) => (f in r ? r[f] : r.press ? r.press[f] : 0) || 0))}`);
    console.log(`years ${rows.length ? rows[0].y + '..' + rows[rows.length - 1].y : 'none'}, one letter per 10 years`);
  } else console.log('unknown query');
}
