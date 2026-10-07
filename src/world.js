// The world: every field lives here as a flat typed array. Other modules read and write them.
import { W, H, N, TPY, rng, cyl } from './core.js';
import { makePlates, buildLand, replate } from './plates.js';
import { computeClimate, derive } from './climate.js';
import { computeHydro, erode } from './hydro.js';
import { seasonFields, initLife, vegetation, fireStep } from './life.js';

const F = () => new Float32Array(N), U = () => new Uint8Array(N);

export function makeWorld(seed) {
  const rnd = rng(seed ^ 0x9e3779b9);
  const w = {
    seed, rnd, rs: seed | 1, tickN: 0, year: 0, phase: 0, aerosol: 0, iceFrac: 0,
    params: { sun: 0, tilt: 23.5, spin: 1, sea: 0 },
    h: F(), tect: null, plate: U(), filled: F(), flow: F(), down: new Int32Array(N), water: U(), river: U(), fresh: U(), dSea: U(),
    tJan: F(), tJul: F(), rJan: F(), rJul: F(), tMean: F(), rMean: F(), mi: F(), gCap: F(), tCap: F(),
    temp: F(), rain: F(), snow: F(), green: F(), g: F(), t: F(), soil: F(), ash: F(), wetBias: F(), magic: F(),
    ice: U(), fireT: U(), farm: U(), urban: U(), lava: U(), road: U(), owner: new Int16Array(N).fill(-1), ocult: new Int16Array(N).fill(-1),
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
  return w;
}

export function refreshWater(w) { computeHydro(w); derive(w); w.need.water = false; w.stamp.land++; }
export function refreshClimate(w) { computeClimate(w); derive(w); computeHydro(w); derive(w); w.need.climate = false; w.need.water = false; w.stamp.land++; }
export function movePlates(w) { replate(w); refreshClimate(w); }

export function tick(w) {
  w.tickN++; w.phase = (w.tickN % TPY) / TPY; w.year = Math.floor(w.tickN / TPY);
  if (w.aerosol > 0.001) w.aerosol *= 0.975; else w.aerosol = 0;
  seasonFields(w); vegetation(w, w.tickN & 3); fireStep(w);
  if (w.tickN % TPY === 0) {
    const y = w.year;
    if (y % 12 === 6) { erode(w, 0.0006); w.need.water = true; }
    if (w.need.climate || y % 8 === 3) refreshClimate(w); else if (w.need.water) refreshWater(w);
  }
}
