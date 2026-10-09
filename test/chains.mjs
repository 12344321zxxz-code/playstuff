// Do the promised chains of cause and effect actually happen? Each experiment runs the same world
// twice from the same year: once left alone, once with one thing done to it by the god's hand.
//   node test/chains.mjs [seed] [horses|bronze|wolves|drought|ridges|ideas|sickness|sea|sun]
import { W, H, N, TPY, DISC, wx } from '../src/core.js';
import { makeWorld, tick, refreshClimate } from '../src/world.js';
import { addHerd } from '../src/fauna.js';
import { sculpt, weather } from '../src/powers.js';
import { plagueAt, meteor } from '../src/disasters.js';
import { gift } from '../src/people.js';

const seed = +(process.argv[2] || 7), only = (process.argv[3] || '').toUpperCase(), T0 = 320, T1 = 140;
const run = (w, years) => { for (let y = 0; y < years; y++) for (let k = 0; k < TPY; k++) tick(w); };
const fresh = () => { const w = makeWorld(seed, { sync: true }); run(w, T0); w.events.length = 0; return w; };
const topCult = (w, pred) => { let b = null; for (const c of w.cults) if (c.alive && c.big && !c.big.nomad && pred(c) && (!b || c.pop > b.pop)) b = c; return b; };
const popOf = (w, id) => { const c = w.cults[id]; return c.alive ? Math.round(c.pop) : 0; };
const grass = (w) => { let g = 0, n = 0; for (let i = 0; i < N; i += 3) { if (w.water[i] || w.ice[i] || w.gCap[i] < 0.4 || w.t[i] > 0.4) continue; g += w.g[i] / w.gCap[i]; n++; } return (g / n).toFixed(2); };
const said = (w, re) => w.events.filter((e) => re.test(e.text)).map((e) => e.year + ': ' + e.text).slice(0, 3).join(' | ') || '(nothing)';
const out = (name, lines) => console.log('\n' + name + '\n  ' + lines.join('\n  '));

if (!only || only === 'HORSES') { // horses
  const a = fresh(), c = topCult(a, (q) => !q.tame.horse && !Object.keys(q.nb).some((k) => a.cults[k].tame.horse)); if (c) { const b = fresh(), s = b.cults[c.id].big; let n = 0;
    for (let q = 0; q < 400 && n < 8; q++) { const o = DISC[12][(b.rnd() * DISC[12].length) | 0], x = wx(s.x + o[0]), y = s.y + o[1]; if (y < 2 || y >= H - 2 || b.water[y * W + x]) continue; if (addHerd(b, x, y, 1)) n++; }
    run(a, T1); run(b, T1); out(`HORSES: ${n} herds set down beside ${s.name} of the ${c.name}`, [`left alone: horses ${!!a.cults[c.id].tame.horse}, riding ${!!a.cults[c.id].arts.riding}, kind ${a.cults[c.id].kind}`, `with horses: horses ${!!b.cults[c.id].tame.horse}, riding ${!!b.cults[c.id].arts.riding}, kind ${b.cults[c.id].kind}`, said(b, new RegExp('tame the horse|' + c.name + ' learn riding|saddle'))]); } else console.log('\nHORSES: everyone already has them'); }
if (!only || only === 'BRONZE') { // copper and tin
  const a = fresh(), c = topCult(a, (q) => !q.arts.bronze && !(q.metals & 2 && q.metals & 4)); if (c) { const b = fresh(), s = b.cults[c.id].big; b.ore[s.y * W + wx(s.x + 1)] = 1; b.ore[s.y * W + wx(s.x - 1)] = 2;
    run(a, T1); run(b, T1); out(`BRONZE: copper and tin buried at ${s.name} of the ${c.name} (tier ${c.tech})`, [`left alone: bronze ${a.cults[c.id].arts.bronze || 'no'}`, `with ore: bronze ${b.cults[c.id].arts.bronze || 'no'}, tier now ${b.cults[c.id].tech}`]); } }
if (!only || only === 'WOLVES') { // wolves
  const a = fresh(), b = fresh(); for (const p of b.packs) p.n = 0; const g0 = grass(a), h0 = a.stats.grazers; run(a, 60); run(b, 60);
  out('WOLVES: every pack culled', [`left alone: grass ${g0} -> ${grass(a)}, grazers ${h0} -> ${a.stats.grazers}`, `no wolves: grass ${g0} -> ${grass(b)}, grazers ${h0} -> ${b.stats.grazers}`, said(b, /herds have grown|bones on every|last pack/)]); }
if (!only || only === 'DROUGHT') { // drought
  const a = fresh(), c = topCult(a, () => true), b = fresh(), s = b.cults[c.id].big; for (let k = 0; k < 14; k++) for (const [dx, dy] of [[0, 0], [10, 0], [-10, 0], [0, 9], [0, -9], [9, 8], [-9, -8]]) weather(b, 'dry', s.x + dx, s.y + dy, 14);
  const p0 = popOf(a, c.id); run(a, 40); run(b, 40);
  out(`DROUGHT: the rain taken from around ${s.name} of the ${c.name}`, [`left alone: ${p0} -> ${popOf(a, c.id)} people`, `drought: ${p0} -> ${popOf(b, c.id)} people, ${b.sets.filter((q) => q.cult === c.id && q.note === 'drought').length} places still short of rain`, said(b, /rains fail|worn out|turn on|comes apart|lies empty|starves/)]); }
if (!only || only === 'RIDGES') { // a mountain range upwind
  const a = fresh(), c = topCult(a, () => true), b = fresh(), s = b.cults[c.id].big; const mi0 = b.mi[s.y * W + s.x];
  for (const side of [-1, 1]) for (let dy = -22; dy <= 22; dy += 2) sculpt(b, 'ridge', s.x + side * 16, s.y + dy, 4, { power: 1 });
  refreshClimate(b); const p0 = popOf(a, c.id); run(a, 80); run(b, 80);
  out(`RIDGES: ranges raised east and west of ${s.name} of the ${c.name}`, [`wetness at ${s.name}: ${mi0.toFixed(2)} -> ${b.mi[s.y * W + s.x].toFixed(2)}`, `left alone: ${p0} -> ${popOf(a, c.id)} people`, `walled in: ${p0} -> ${popOf(b, c.id)} people`]); }
if (!only || only === 'IDEAS') { // ideas
  const b = fresh(), c = topCult(b, () => true), before = Object.keys(c.arts).length; const got = []; for (let k = 0; k < 4; k++) got.push(gift(b, c));
  out(`IDEAS: four handed to the ${c.name}`, [`arts ${before} -> ${Object.keys(c.arts).length}: ${got.join(', ')}`]); }
if (!only || only === 'SICKNESS') { // sickness
  const a = fresh(), b = fresh(), c = topCult(b, () => true), s = c.big; plagueAt(b, s.x, s.y); const p0 = a.stats.people; run(a, 30); run(b, 30); const st = b.plagues[b.plagues.length - 1] || {};
  out(`SICKNESS: started at ${s.name}`, [`left alone: world ${p0} -> ${a.stats.people}`, `plague: world ${p0} -> ${b.stats.people}; worst strain reached ${Math.max(0, ...b.plagues.map((q) => q.towns))} places`, said(b, /sickness|burns out/)]); }
if (!only || only === 'SEA') { // the sea
  const a = fresh(), b = fresh(); b.params.seaDial = 0.06; b.params.sea = 0.06 + b.seaAuto; refreshClimate(b); const p0 = a.stats.people, r0 = b.ruins.length; run(a, 20); run(b, 20);
  out('SEA: raised', [`left alone: world ${p0} -> ${a.stats.people}`, `sea up: world ${p0} -> ${b.stats.people}, ${b.ruins.filter((r) => r.kind === 'drowned').length} drowned ruins`, said(b, /under the water|sea comes in/)]); }
if (!only || only === 'SUN') { // the sun
  const a = fresh(), b = fresh(); b.params.sun = -7; refreshClimate(b); const p0 = a.stats.people, i0 = b.landIce; run(a, 100); run(b, 100);
  out('SUN: dimmed by 7 degrees', [`left alone: world ${p0} -> ${a.stats.people}, ice ${(a.landIce * 100).toFixed(0)}%`, `cold: world ${p0} -> ${b.stats.people}, ice ${(i0 * 100).toFixed(0)}% -> ${(b.landIce * 100).toFixed(0)}%, ${b.ruins.filter((r) => r.kind === 'frozen').length} frozen ruins`, said(b, /under the ice|ice is coming|fall to|sea has fallen/)]); }
