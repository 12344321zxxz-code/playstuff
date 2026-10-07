// "Look": turn whatever is under the cursor into a few plain sentences.
import { W, H, N, clamp, idx, latOf } from './core.js';

export function describe(w, x, y) {
  x = Math.round(x - 0.5); y = Math.round(y - 0.5); if (y < 0 || y >= H) return null;
  const i = idx(x, y), sea = w.params.sea, L = [];
  for (const fn of w.lookers || []) { const r = fn(w, x, y, i); if (r) return r; }
  const T = w.tMean[i], hot = Math.max(w.tJan[i], w.tJul[i]), cold = Math.min(w.tJan[i], w.tJul[i]), m = w.mi[i], hh = w.h[i] - sea;
  let title;
  if (w.water[i] === 1) {
    title = w.snow[i] > 0.5 ? 'Sea ice' : hh > -0.06 ? 'Shallow sea' : hh < -0.4 ? 'The deep' : 'Open sea';
    L.push(T > 22 ? 'Warm water. Storms are born over seas like this.' : T < 2 ? 'Cold, grey water.' : 'Cool water.');
    return { title, lines: L };
  }
  if (w.water[i] === 2) return { title: 'A lake', lines: ['Fresh water, held in a hollow of the land.', w.snow[i] > 0.5 ? 'Frozen over for now.' : 'The shores stay green.'] };
  if (w.lava[i]) title = 'Lava'; else if (w.fireT[i]) title = 'Wildfire';
  else if (w.ice[i]) title = 'Ice sheet';
  else if (hh > 0.55) title = 'High peaks'; else if (hh > 0.36) title = 'Mountains';
  else if (w.farm[i]) title = 'Farmland';
  else if (w.t[i] > 0.5) title = T > 20 ? (m > 1.3 ? 'Rainforest' : 'Dry forest') : T > 6 ? 'Woodland' : 'Taiga';
  else if (m < 0.2) title = T > 12 ? 'Desert' : 'Cold desert';
  else if (hot < 9) title = 'Tundra';
  else if (w.g[i] > 0.45) title = T > 19 ? (w.t[i] > 0.2 ? 'Savanna' : 'Grassland') : 'Steppe and meadow';
  else title = 'Scrub';
  if (w.river[i]) L.push(['', 'A stream runs through here.', 'A river runs through here.', 'A big river runs through here.', 'One of the great rivers of the world.'][w.river[i]]);
  L.push(m > 1.4 ? 'It rains hard here for much of the year.' : m > 0.8 ? 'Plenty of rain.' : m > 0.4 ? 'Enough rain for grass, not much more.' : m > 0.2 ? 'Dry. Rain is a brief season.' : 'Almost no rain reaches here.');
  L.push(hot - cold > 30 ? `Brutal seasons: about ${Math.round(cold)}° in winter, ${Math.round(hot)}° in summer.` : hot - cold > 14 ? `Real seasons: ${Math.round(cold)}° to ${Math.round(hot)}°.` : `Much the same all year, around ${Math.round(T)}°.`);
  const s = w.soil[i]; L.push(s > 1.1 ? 'The soil is deep and dark.' : s > 0.7 ? 'Decent soil.' : s > 0.4 ? 'Thin soil.' : 'The soil is nearly gone.');
  if (w.ash[i] > 0.3) L.push('Ash from a recent fire.');
  if (w.wetBias[i] > 0.15) L.push('Your rain still lingers here.'); else if (w.wetBias[i] < -0.15) L.push('Your drought still lingers here.');
  return { title, lines: L };
}
