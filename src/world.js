// The world: every field lives here as a flat typed array. Other modules read and write them.
import { W, H, N, TPY, rng, cyl } from './core.js';
import { makePlates, buildLand, replate } from './plates.js';
import { computeClimate, climateStage, derive } from './climate.js';
import { computeHydro, erode } from './hydro.js';
import { seasonFields, initLife, vegetation, fireStep } from './life.js';
import { initFauna, fauna, faunaYear } from './fauna.js';
import { initPeople, peopleYear } from './people.js';
import { initMagic, magicYear, dragonsTick } from './fantasy.js';
import { naturalYear, stormsTick } from './disasters.js';
import { discover, ev } from './story.js';

const F = () => new Float32Array(N), U = () => new Uint8Array(N);

export function makeWorld(seed, opts) {
  const rnd = rng(seed ^ 0x9e3779b9);
  const w = {
    seed, rnd, rs: seed | 1, tickN: 0, year: 0, phase: 0, aerosol: 0, iceFrac: 0,
    params: { sun: 0, tilt: 23.5, spin: 1, sea: 0, seaDial: 0 }, seaAuto: 0, ice0: 0, landIce: 0, greenhouse: 0, stats: {}, found: {}, storms: [], fx: [], herds: [], packs: [], sets: [], cults: [], ruins: [], dragons: [], links: new Map(), nextId: 1, ownD: F(),
    h: F(), tect: null, plate: U(), filled: F(), flow: F(), down: new Int32Array(N), water: U(), river: U(), fresh: U(), dSea: U(),
    tJan: F(), tJul: F(), rJan: F(), rJul: F(), tMean: F(), rMean: F(), mi: F(), gCap: F(), tCap: F(), crop: F(), onces: {}, job: 0,
    temp: F(), rain: F(), snow: F(), green: F(), g: F(), t: F(), soil: F(), ash: F(), wetBias: F(), magic: F(),
    mass: new Int16Array(N), massSize: [0], herdAt: new Int16Array(N), ore: U(), ice: U(), fireT: U(), farm: U(), urban: U(), lava: U(), road: U(), owner: new Int16Array(N).fill(-1), ocult: new Int16Array(N).fill(-1),
    burning: [], springs: [], volcanoes: [], plates: [], riverList: new Int32Array(0), events: [], stamp: { land: 1 },
    need: { water: false, climate: false },
  };
  makePlates(w, rnd);
  buildLand(w, rnd);
  for (let i = 0; i < N; i++) { w.rMean[i] = 0.6; w.mi[i] = 0.6; }
  computeHydro(w);
  computeClimate(w); derive(w); computeHydro(w); derive(w);
  const noise = F(); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) noise[y * W + x] = cyl(x, y, 1 / 9, seed + 77, 3);
  initLife(w, noise);
  computeClimate(w); derive(w); computeHydro(w); derive(w);     // again, now that forests feed the rain
  initLife(w, noise);
  seasonFields(w);
  seedOre(w);
  w.ice0 = w.landIce; w.landCount = countLand(w); w.mi0 = Float32Array.from(w.mi); baseline(w);
  initFauna(w); initMagic(w); initPeople(w, opts && opts.bands);
  w.events.length = 0; w.found = {};
  return w;
}

function baseline(w) { let land = 0, des = 0, forest = 0, mon = 0; for (let i = 0; i < N; i += 5) { if (w.water[i] === 1) continue; land++; if (w.mi[i] < 0.2 && !w.ice[i] && w.tMean[i] > 4) des++; if (w.t[i] > 0.5) forest++; const a = w.rJan[i], b = w.rJul[i]; if (Math.max(a, b) > 1.5 && Math.min(a, b) < 0.25 * Math.max(a, b)) mon++; } w.base = { desert: des / land, forest: forest / land, monsoon: mon / land }; }
function countLand(w) { let n = 0; for (let i = 0; i < N; i++) if (w.water[i] !== 1) n++; return n; }
// Ore goes where the rock is: metals in the hills, salt in dry basins.
function seedOre(w) {
  const rnd = w.rnd, sea = w.params.sea, want = [0, 26, 14, 40, 12, 16];
  for (let kind = 1; kind <= 5; kind++) for (let k = 0, tries = 0; k < want[kind] && tries < 6000; tries++) {
    const i = (rnd() * N) | 0; if (w.water[i] === 1 || w.ore[i] || w.ice[i]) continue; const hh = w.h[i] - sea;
    if (kind === 5 ? !(w.mi[i] < 0.35 && hh < 0.15) : !(hh > (kind === 4 ? 0.2 : 0.1) && hh < 0.6)) continue;
    w.ore[i] = kind; k++;
  }
}
function landChanged(w) {
  const n = countLand(w), was = w.landCount, masses = w.massSize.length; w.landCount = n;
  if (was == null || w.massWas == null) { w.massWas = masses; return; }
  if (n < was - 90) { let at = -1; for (let i = 0; i < N; i += 7) if (w.water[i] === 1 && w.g[i] > 0.05) { at = i; break; } if (discover(w, 'strait', at < 0 ? null : at % W, at < 0 ? null : (at / W) | 0)) ev(w, 'The sea comes in over land that used to be dry.', at < 0 ? null : at % W, at < 0 ? null : (at / W) | 0, null); }
  else if (n > was + 90 && masses < w.massWas && w.seaFell) { if (discover(w, 'bridge', null, null)) ev(w, 'The sea has fallen far enough that two lands touch.', null, null, null); }
  for (let i = 0; i < N; i++) if (w.water[i] === 1 && (w.g[i] > 0 || w.t[i] > 0 || w.farm[i])) { w.g[i] = 0; w.t[i] = 0; w.farm[i] = 0; }
  w.massWas = masses; w.seaFell = false;
}
export function refreshWater(w) { computeHydro(w); derive(w); w.need.water = false; w.stamp.land++; landChanged(w); }
export function refreshClimate(w) { computeClimate(w); derive(w); computeHydro(w); derive(w); w.need.climate = false; w.need.water = false; w.stamp.land++; landChanged(w); }
export function movePlates(w) { replate(w); refreshClimate(w); }

export function tick(w) {
  w.tickN++; w.phase = (w.tickN % TPY) / TPY; w.year = Math.floor(w.tickN / TPY);
  if (w.aerosol > 0.001) w.aerosol *= 0.975; else w.aerosol = 0;
  seasonFields(w); vegetation(w, w.tickN & 3); fireStep(w);
  fauna(w); dragonsTick(w); stormsTick(w);
  if (w.tickN % TPY === 0) {
    const y = w.year;
    for (let i = 0; i < N; i += 4) { const b = w.wetBias[i]; if (b !== 0) { w.wetBias[i] = b * 0.996; w.wetBias[i + 1] *= 0.996; w.wetBias[i + 2] *= 0.996; w.wetBias[i + 3] *= 0.996; } else { w.wetBias[i + 1] *= 0.996; w.wetBias[i + 2] *= 0.996; w.wetBias[i + 3] *= 0.996; } }
    faunaYear(w); peopleYear(w); magicYear(w); naturalYear(w);
    if (y % 12 === 6) { erode(w, 0.0006); w.need.water = true; }
    if (!w.job && (w.need.climate || y % 14 === 3)) w.job = 1; else if (!w.job && w.need.water) refreshWater(w);
  } else if (w.job) {
    // a climate refresh, spread over a few ticks so the game does not hitch
    const j = w.job;
    if (j <= 3) climateStage(w, j - 1); else { derive(w); computeHydro(w); derive(w); w.need.climate = false; w.need.water = false; w.stamp.land++; landChanged(w); }
    w.job = j >= 4 ? 0 : j + 1;
  }
}
