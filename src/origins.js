// Where history comes from. Every landmass is dealt its own wild plants at the start: some lands
// get wheat and lentils, some get rice, some only yams, some nothing worth sowing. A people can
// farm only what grows wild near them, or what reaches them from neighbours, and a crop only
// thrives in the climate it came from, so it travels easily east and west along a latitude and
// badly north or south. Herd animals give their keepers milk, ploughs and carts, and also the
// crowd diseases those keepers slowly become hardened to. Most of who gets ahead is settled here.
import { W, H, N, smooth } from './core.js';
import { ev, once } from './story.js';

// q: how much food a field of it gives; ease: how quickly wild plants become a crop
export const PLANTS = [
  { key: 'wheat', name: 'wheat and barley', wild: 'wild wheat', col: '#e8c860', q: 1.0, ease: 1.0, p: 0.45,
    hab: (T, m, hot, cold, hh) => smooth(5, 9, T) * (1 - smooth(16, 20, T)) * smooth(0.28, 0.42, m) * (1 - smooth(0.9, 1.25, m)) * (1 - smooth(0.4, 0.55, hh)) },
  { key: 'rice', name: 'rice', wild: 'wild rice', col: '#9fe07a', q: 0.95, ease: 0.8, p: 0.45,
    hab: (T, m, hot, cold, hh) => smooth(16, 21, T) * smooth(0.95, 1.3, m) * (1 - smooth(0.25, 0.4, hh)) },
  { key: 'maize', name: 'maize', wild: 'teosinte grass', col: '#f2a43a', q: 0.75, ease: 0.3, p: 0.45,
    hab: (T, m, hot, cold, hh) => smooth(11, 16, T) * (1 - smooth(26, 30, T)) * smooth(0.45, 0.65, m) * (1 - smooth(1.5, 2, m)) * smooth(-2, 4, cold) },
  { key: 'millet', name: 'millet and sorghum', wild: 'wild sorghum', col: '#c98a4a', q: 0.75, ease: 0.8, p: 0.55,
    hab: (T, m) => smooth(15, 20, T) * smooth(0.2, 0.32, m) * (1 - smooth(0.8, 1.1, m)) },
  { key: 'yams', name: 'yams and taro', wild: 'wild yams', col: '#b56aa0', q: 0.5, ease: 0.9, p: 0.7,
    hab: (T, m) => smooth(19, 23, T) * smooth(1.0, 1.3, m) },
  { key: 'potato', name: 'potatoes', wild: 'wild potatoes', col: '#a58a6a', q: 0.65, ease: 0.55, p: 0.45,
    hab: (T, m, hot, cold, hh) => smooth(0.14, 0.24, hh) * (1 - smooth(0.5, 0.62, hh)) * smooth(2, 6, T) * (1 - smooth(15, 19, T)) * smooth(0.4, 0.6, m) },
  { key: 'beans', name: 'beans and lentils', wild: 'wild lentils', col: '#6aa84f', q: 0.35, ease: 0.9, p: 0.55, pulse: true,
    hab: (T, m) => smooth(8, 12, T) * (1 - smooth(24, 28, T)) * smooth(0.35, 0.5, m) * (1 - smooth(1.4, 1.8, m)) },
];
export const NP = PLANTS.length;
// what herd animals give the people who keep them: food, a plough, a cart, and their sicknesses
export const LIVESTOCK = {
  cattle: { plough: 1, germs: 1 }, buffalo: { plough: 1, germs: 0.6 }, horse: { plough: 0.6, cart: 1, germs: 0.3 }, pig: { germs: 0.9 },
  goat: { germs: 0.4 }, camel: { cart: 1, germs: 0.2 }, reindeer: { cart: 0.4, germs: 0.1 }, llama: { cart: 0.6, germs: 0.1 },
};

export function initOrigins(w) {
  w.pSuit = new Uint8Array(N * NP); w.flora = new Uint8Array(N).fill(255); w.wildCrop = new Float32Array(N); w.floraKinds = {}; w.rinder = {};
  suitMap(w);
  const byMass = {};
  for (let i = 0; i < N; i += 3) { if (w.water[i] || w.ice[i]) continue; const m = w.mass[i]; if ((w.massSize[m] || 0) < 30) continue; (byMass[m] || (byMass[m] = [])).push(i); }
  for (const m in byMass) {
    const cells = byMass[m], kinds = [];
    for (let p = 0; p < NP; p++) { let good = 0; for (const i of cells) if (w.pSuit[p * N + i] > 150) good++; if (good >= 8 && w.rnd() < PLANTS[p].p) kinds.push(p); }
    w.floraKinds[m] = kinds;
  }
  floraMap(w);
}
// how well each plant would grow in each place, from the climate as it is now
export function suitMap(w) {
  const { tMean, tJan, tJul, mi, h, water, ice, pSuit } = w, sea = w.params.sea;
  for (let i = 0; i < N; i++) {
    if (water[i] || ice[i]) { for (let p = 0; p < NP; p++) pSuit[p * N + i] = 0; continue; }
    const T = tMean[i], m = mi[i], a = tJan[i], b = tJul[i], hot = a > b ? a : b, cold = a > b ? b : a, hh = h[i] - sea;
    for (let p = 0; p < NP; p++) { const v = PLANTS[p].hab(T, m, hot, cold, hh); pSuit[p * N + i] = v <= 0 ? 0 : v >= 1 ? 255 : (v * 255) | 0; }
  }
  w.suitStamp = w.climateStamp;
}
// the wild plant worth sowing in each place, among those this land was given
export function floraMap(w) {
  const { flora, wildCrop, pSuit, mass, water } = w;
  for (let i = 0; i < N; i++) {
    flora[i] = 255; wildCrop[i] = 0; if (water[i]) continue; const k = w.floraKinds[mass[i]]; if (!k || !k.length) continue;
    let b = 255, bv = 0.2 * 255, pulse = 0;
    for (const p of k) { const v = pSuit[p * N + i] * PLANTS[p].q; if (PLANTS[p].pulse) { pulse = Math.max(pulse, pSuit[p * N + i]); continue; } if (v > bv) { bv = v; b = p; } }
    if (b === 255 && pulse > 0.3 * 255) { b = k.find((p) => PLANTS[p].pulse); bv = pulse * PLANTS[b].q; }
    flora[i] = b; wildCrop[i] = Math.min(1, bv / 255 + (b !== 255 && pulse > 120 ? 0.12 : 0));
  }
}
// keep everything in step with the climate: crops follow the weather when the world warms or cools
export function originsYear(w) { if (w.suitStamp !== w.climateStamp) { suitMap(w); floraMap(w); } }

// What one field gives a people that knows these crops: their best crop for the spot, a little
// more if they also grow pulses (beans keep a grain-eating people strong).
export function cropYield(w, c, i) {
  const cr = c.cropL; if (!cr || !cr.length) return 0; let best = 0, pulse = 0;
  for (let k = 0; k < cr.length; k++) { const p = cr[k], v = w.pSuit[p * N + i] / 255; if (PLANTS[p].pulse) { if (v > pulse) pulse = v; } else { const y = v * PLANTS[p].q; if (y > best) best = y; } }
  if (best === 0) return pulse * 0.35;
  return Math.min(1.1, best + (pulse > 0.3 ? 0.12 : 0));
}
export function hasCrop(c, p) { return c.crops && c.crops[p] != null; }
export function giveCrop(w, c, p, from) {
  if (hasCrop(c, p)) return false; (c.crops || (c.crops = {}))[p] = w.year; c.cropL = Object.keys(c.crops).map(Number);
  const P = PLANTS[p], b = c.big || from && from.big;
  if (from) { if (!(c.cropL.length > 2)) ev(w, `${P.name[0].toUpperCase() + P.name.slice(1)} reach${P.name.includes(' and ') || P.name.endsWith('s') ? '' : 'es'} the ${c.name} from the ${from.name}.`, b ? b.x : null, b ? b.y : null, c.color, 1); }
  else ev(w, once(w, 'sow-' + P.key) ? `The ${c.name} are the first to sow ${P.name}. For a hundred generations their people had gathered ${P.wild}.` : `The ${c.name} learn to sow ${P.name}.`, b ? b.x : null, b ? b.y : null, c.color, once(w, 'sow-' + P.key + '-told') ? 0 : 1);
  return true;
}
export const cropNames = (c) => (c.cropL || []).map((p) => PLANTS[p].name);
// what the herds of a people do for them and to them
export function livestock(c) {
  let plough = 0, cart = 0, germs = 0;
  for (const k in c.tame) { const L = LIVESTOCK[k]; if (!L) continue; plough = Math.max(plough, L.plough || 0); cart = Math.max(cart, L.cart || 0); germs += L.germs; }
  return { plough, cart, germs: Math.min(2, germs) };
}
// a quick reading of a people's luck, for the Look panel and the Peoples list
export function luckOf(w, c) {
  const L = livestock(c), crops = c.cropL || [];
  const food = crops.filter((p) => !PLANTS[p].pulse).reduce((a, p) => Math.max(a, PLANTS[p].q), 0);
  return { crops: crops.map((p) => PLANTS[p].name), food, plough: L.plough, cart: L.cart, germs: L.germs, hard: c.germ || 0 };
}
export const flora = (w, i) => (w.flora[i] === 255 ? null : PLANTS[w.flora[i]]);
