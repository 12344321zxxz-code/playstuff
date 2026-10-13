// One seed, headless, summarised as one JSON line of numbers (used by exp.mjs).
//   node tools/stats.mjs <seed> <years> [patch.json]
import { TPY } from '../src/core.js';
import { makeWorld, tick } from '../src/world.js';
import { applyPatch } from './patch.mjs';
import { readFileSync } from 'node:fs';
const [seed, years, patch] = [+process.argv[2], +process.argv[3], process.argv[4]];
if (patch) await applyPatch(JSON.parse(readFileSync(patch, 'utf8')));
const w = makeWorld(seed); const t0 = Date.now(); let nan = 0, slow = 0, peakPeoples = 0;
const born = {}, died = {}, dead = {};
for (let y = 1; y <= years; y++) { for (let k = 0; k < TPY; k++) { const a = performance.now(); tick(w); if (performance.now() - a > 16) slow++; } w.events.length = 0; if (!Number.isFinite(w.stats.people)) nan++; for (const c of w.cults) { if (born[c.id] == null) born[c.id] = w.year; if (!c.alive && died[c.id] == null) died[c.id] = w.year; } peakPeoples = Math.max(peakPeoples, w.cults.filter((c) => c.alive && !c.power).length); for (const c of w.cults) if (c.power === 'dead') { const d = dead[c.id] || (dead[c.id] = { b: c.born, e: null, max: 0 }); if (c.alive) d.max = Math.max(d.max, c.count); else if (d.e == null) d.e = w.year; } }
const h = w.hist || [], col = h.filter((e) => e.k === 'collapse'), by = (k) => h.filter((e) => e.k === k).length;
// synchrony: the most collapses in any 50-year window, as a share of all collapses
let sync = 0; for (const e of col) { const n = col.filter((f) => f.y >= e.y && f.y < e.y + 50).length; sync = Math.max(sync, n); }
const causes = {}; for (const e of col) { const t = Object.entries(e.terms || {}).filter(([k, v]) => k !== 'base' && v < 0).sort((a, b) => a[1] - b[1])[0]; if (t) causes[t[0]] = (causes[t[0]] || 0) + 1; }
const life = Object.keys(died).map((id) => died[id] - born[id]);
const live = w.cults.filter((c) => c.alive), eras = live.map((c) => c.tech);
console.log(JSON.stringify({ seed, pop: w.stats.people, peoples: live.length, peakPeoples, towns: w.sets.length, eraMax: Math.max(0, ...eras), eraSpread: eras.length ? Math.max(...eras) - Math.min(...eras) : 0,
  collapses: col.length, breakaways: by('breakaway'), wars: by('war'), powersRisen: by('power-rise'), launches: by('launch'), turningPerCentury: +(h.length / (years / 100)).toFixed(2),
  collapseSync: col.length ? +(sync / col.length).toFixed(2) : 0, lifespanMed: life.length ? life.sort((a, b) => a - b)[life.length >> 1] : null, deadRealms: Object.keys(dead).length, deadLife: (() => { const l = Object.values(dead).map((d) => (d.e || w.year) - d.b).sort((a, b) => a - b); return l.length ? l[l.length >> 1] : null; })(), deadMaxTowns: Math.max(0, ...Object.values(dead).map((d) => d.max)), nan, msPerTick: +((Date.now() - t0) / (years * TPY)).toFixed(1), slowTicks: slow, causes }));
