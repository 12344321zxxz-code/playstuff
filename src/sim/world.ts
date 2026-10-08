// @ts-nocheck
// The world: every field lives here as a flat typed array. Other modules read and write them.
import { W, H, N, TPY, rng, cyl, setLatitudes } from './core';
import { templateById } from './templates';
import { makePlates, buildLand, replate } from './plates';
import { computeClimate, climateSteps, derive } from './climate';
import { computeHydro, hydroSteps, erode } from './hydro';
import { seasonFields, initLife, vegetation, fireStep } from './life';
import { initFauna, fauna, faunaYear } from './fauna';
import { initPeople, peopleSteps, roadsYear } from './people';
import { initMagic, magicYear, dragonsTick } from './fantasy';
import { naturalYear, stormsTick, swarmsTick } from './disasters';
import { discover, ev } from './story';
import { initWeather, weatherYear } from './weather';
import { initSea, seaYear, seaCap } from './sea';
import { moversTick } from './movers';
import { initFaith } from './faith';

const F = () => new Float32Array(N), U = () => new Uint8Array(N);

export function makeWorld(seed, opts) {
  const rnd = rng(seed ^ 0x9e3779b9), T = templateById(opts && opts.template); setLatitudes(T.lat[0], T.lat[1]);
  const w = {
    sync: !!(opts && opts.sync), template: T.id,      // tests set this: background work finishes at once, so runs repeat exactly
    seed, rnd, rs: seed | 1, tickN: 0, year: 0, phase: 0, aerosol: 0, iceFrac: 0,
    params: { sun: 0, tilt: 23.5, spin: 1, sea: 0, seaDial: 0, mood: 1 }, seaAuto: 0, ice0: 0, landIce: 0, greenhouse: 0, stats: {}, found: {}, storms: [], swarms: [], movers: [], krakens: [], fx: [], herds: [], packs: [], sets: [], cults: [], ruins: [], dragons: [], links: new Map(), nextId: 1, ownD: F(),
    h: F(), tect: null, plate: U(), filled: F(), flow: F(), down: new Int32Array(N), water: U(), river: U(), fresh: U(), dSea: U(),
    tJan: F(), tJul: F(), rJan: F(), rJul: F(), tMean: F(), rMean: F(), mi: F(), gCap: F(), tCap: F(), crop: F(), onces: {}, job: 0,
    temp: F(), rain: F(), snow: F(), green: F(), g: F(), t: F(), soil: F(), ash: F(), wetBias: F(), magic: F(),
    mass: new Int16Array(N), massSize: [0], herdAt: new Int16Array(N), ore: U(), ice: U(), fireT: U(), farm: U(), urban: U(), lava: U(), road: U(), owner: new Int16Array(N).fill(-1), ocult: new Int16Array(N).fill(-1),
    burning: [], springs: [], volcanoes: [], plates: [], riverList: new Int32Array(0), events: [], stamp: { land: 1 },
    need: { water: false, climate: false },
  };
  initWeather(w);
  makePlates(w, rnd);
  buildLand(w, rnd);
  for (let i = 0; i < N; i++) { w.rMean[i] = 0.6; w.mi[i] = 0.6; }
  computeHydro(w);
  computeClimate(w); derive(w); computeHydro(w); derive(w);
  // a few thousand years of rivers before anyone arrives: valleys, gorges, deltas
  for (let k = 0; k < 4; k++) { erode(w, 0.0018); computeHydro(w); }
  derive(w);
  const noise = F(); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) noise[y * W + x] = cyl(x, y, 1 / 9, seed + 77, 3);
  initLife(w, noise);
  computeClimate(w); derive(w); computeHydro(w); derive(w);     // again, now that forests feed the rain
  initLife(w, noise);
  seasonFields(w);
  seedOre(w);
  w.ice0 = w.landIce; w.landCount = countLand(w); w.mi0 = Float32Array.from(w.mi); baseline(w);
  initFaith(w); initSea(w); initFauna(w); initMagic(w); initPeople(w, opts && opts.bands);
  w.events.length = 0; w.found = {};
  return w;
}

function baseline(w) { let land = 0, des = 0, forest = 0, mon = 0; for (let i = 0; i < N; i += 5) { if (w.water[i] === 1) continue; land++; if (w.mi[i] < 0.2 && !w.ice[i] && w.tMean[i] > 4) des++; if (w.t[i] > 0.5) forest++; const a = w.rJan[i], b = w.rJul[i]; if (Math.max(a, b) > 1.5 && Math.min(a, b) < 0.25 * Math.max(a, b)) mon++; } w.base = { desert: des / land, forest: forest / land, monsoon: mon / land }; }
function countLand(w) { let n = 0; for (let i = 0; i < N; i++) if (w.water[i] !== 1) n++; return n; }
// Ore goes where the rock is: metals in the hills, salt in dry basins.
function seedOre(w) {
  const rnd = w.rnd, sea = w.params.sea, want = [0, 26, 14, 40, 12, 16, 18];
  for (let kind = 1; kind <= 6; kind++) for (let k = 0, tries = 0; k < want[kind] && tries < 6000; tries++) {
    const i = (rnd() * N) | 0; if (w.water[i] === 1 || w.ore[i] || w.ice[i]) continue; const hh = w.h[i] - sea;
    if (kind === 5 ? !(w.mi[i] < 0.35 && hh < 0.15) : kind === 6 ? !(hh > 0.03 && hh < 0.28 && w.mi[i] > 0.7) : !(hh > (kind === 4 ? 0.2 : 0.1) && hh < 0.6)) continue;
    w.ore[i] = kind; k++;
  }
}
function landChanged(w) {
  const n = countLand(w), was = w.landCount, masses = w.massSize.length; w.landCount = n;
  if (was == null || w.massWas == null) { w.massWas = masses; return; }
  if (n < was - 90) { let at = -1; for (let i = 0; i < N; i += 7) if (w.water[i] === 1 && w.g[i] > 0.05) { at = i; break; } if (discover(w, 'strait', at < 0 ? null : at % W, at < 0 ? null : (at / W) | 0)) ev(w, 'The sea comes in over land that used to be dry.', at < 0 ? null : at % W, at < 0 ? null : (at / W) | 0, null); }
  else if (n > was + 90 && masses < w.massWas && w.seaFell) { if (discover(w, 'bridge', null, null)) ev(w, 'The sea has fallen far enough that two lands touch.', null, null, null); }
  for (let i = 0; i < N; i++) if (w.water[i] === 1 && (w.g[i] > 0 || w.t[i] > 0 || w.farm[i])) { w.g[i] = 0; w.t[i] = 0; w.farm[i] = 0; }
  w.massWas = masses; w.seaFell = false; if (w.fish) seaCap(w);
}
export function refreshWater(w) { if (w.job && w.job.k === 'water') w.job = null; computeHydro(w); derive(w); w.need.water = false; w.stamp.land++; landChanged(w); }
export function refreshClimate(w) { w.job = null; computeClimate(w); derive(w); computeHydro(w); derive(w); w.need.climate = false; w.need.water = false; w.stamp.land++; landChanged(w); }
export function movePlates(w) { replate(w); refreshClimate(w); }

export function tick(w) {
  w.tickN++; w.phase = (w.tickN % TPY) / TPY; w.year = Math.floor(w.tickN / TPY);
  if (w.aerosol > 0.001) w.aerosol *= 0.975; else w.aerosol = 0;
  seasonFields(w, w.tickN & 1); vegetation(w, w.tickN & 3); fireStep(w);
  fauna(w); dragonsTick(w); stormsTick(w); swarmsTick(w); moversTick(w);
  // the yearly work is spread over the year's ticks so no single tick is heavy
  const ph = w.tickN % TPY;
  if (ph === 1) weatherYear(w); else if (ph === 2) { seaYear(w); faunaYear(w); } else if (ph === 3) magicYear(w); else if (ph === 4) naturalYear(w); else if (ph === 5) roadsYear(w);
  if (ph === 0) {
    const y = w.year;
    for (let i = 0; i < N; i += 4) { const b = w.wetBias[i]; if (b !== 0) { w.wetBias[i] = b * 0.996; w.wetBias[i + 1] *= 0.996; w.wetBias[i + 2] *= 0.996; w.wetBias[i + 3] *= 0.996; } else { w.wetBias[i + 1] *= 0.996; w.wetBias[i + 2] *= 0.996; w.wetBias[i + 3] *= 0.996; } }
    if (w.census) for (const _ of w.census); w.census = peopleSteps(w);
    if (y % 12 === 6) { erode(w, 0.0006); w.need.water = true; }
    if (!w.job && (w.need.climate || y % 30 === 3)) w.job = { k: 'climate', g: climateSteps(w) }; else if (!w.job && w.need.water) w.job = { k: 'water', g: hydroSteps(w) };
  }
  if (w.census) { const t0 = performance.now(); for (;;) { if (w.census.next().done) { w.census = null; break; } if (!w.sync && performance.now() - t0 > 3) break; } }
  if (w.job) runJob(w, w.sync ? 1e9 : w.census ? 3 : 5);
}

// Ask for a fresh climate without stopping the world: the work is done a little at a time.
export function queueClimate(w) { w.need.climate = true; w.job = { k: 'climate', g: climateSteps(w) }; }   // a newer request cancels an older one
// The page calls this while the game is paused, so the sky still settles after an edit.
export function background(w, ms) { if (w.job) runJob(w, ms); }
// Climate and rivers are refreshed in the background, a few milliseconds per tick.
function runJob(w, ms) {
  const j = w.job, t0 = performance.now();
  for (;;) {
    const a = performance.now(), r = j.g.next(), d = performance.now() - a; j.n = (j.n || 0) + 1; if (w.dbg && d > (w.dbg.max || 0)) { w.dbg.max = d; w.dbg.at = j.k + '#' + j.n; }
    if (!r.done) { if (performance.now() - t0 > ms) return; continue; }
    if (j.k === 'climate') { derive(w); w.need.climate = false; w.job = { k: 'water', g: hydroSteps(w) }; if (w.sync) return runJob(w, ms); return; }
    derive(w); w.need.water = false; w.stamp.land++; landChanged(w); w.job = null; return;
  }
}
