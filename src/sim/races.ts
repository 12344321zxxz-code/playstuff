// @ts-nocheck
// Who the peoples are. Humans live anywhere and do everything middling well. The beast folk are
// each tied to a kind of country: lizardfolk to warm wet lowlands, ratkin to anywhere crowded,
// birdfolk to high rock, wolfkin to cold forest. Where a people wakes decides which they are.
export const RACES = [
  { key: 'human', name: 'Humans', plural: 'humans', one: 'human', grow: 1, fight: 1, wit: 1, coh: 0,
    lang: null, fit: (T, m, hh, t) => 1 },
  { key: 'lizard', name: 'Lizardfolk', plural: 'lizardfolk', one: 'lizardfolk', grow: 0.9, fight: 1.15, wit: 0.9, coh: 0.05,
    lang: { c: ['s', 'ss', 'k', 'th', 'z', 'x', 'q', 'sh', 'h', 'r'], v: ['a', 'i', 'ee', 'u', 'aa'], e: ['ss', 'k', 'x', 'th'] },
    fit: (T, m, hh, t) => (T < 8 ? 0.35 : T < 14 ? 0.75 : 1.25) * (m > 1 ? 1.2 : m < 0.4 ? 0.7 : 1) * (hh > 0.3 ? 0.6 : 1) },
  { key: 'rat', name: 'Ratkin', plural: 'ratkin', one: 'ratkin', grow: 1.45, fight: 0.82, wit: 1.1, coh: -0.12,
    lang: { c: ['sk', 'kr', 'tch', 'v', 'z', 'k', 'r', 'sn', 'gr', 'p'], v: ['i', 'e', 'ee', 'a'], e: ['k', 'ch', 'tch', 'sk', 'ik'] },
    fit: (T, m, hh, t) => (T < -2 ? 0.7 : 1.05) },
  { key: 'bird', name: 'Birdfolk', plural: 'birdfolk', one: 'birdfolk', grow: 0.8, fight: 1.05, wit: 1.25, coh: 0.08,
    lang: { c: ['k', 'r', 'l', 'w', 'h', 'kr', 'tr', 'y', 'f', 'qu'], v: ['ee', 'aa', 'ai', 'i', 'o'], e: ['k', 'r', 'll', 'ree'] },
    fit: (T, m, hh, t) => (hh > 0.3 ? 1.35 : hh > 0.15 ? 1.05 : 0.7) * (T < -6 ? 0.7 : 1) },
  { key: 'wolf', name: 'Wolfkin', plural: 'wolfkin', one: 'wolfkin', grow: 0.95, fight: 1.3, wit: 0.9, coh: 0.1,
    lang: { c: ['gr', 'v', 'r', 'k', 'h', 'd', 'th', 'ul', 'w', 'f'], v: ['o', 'u', 'a', 'au'], e: ['r', 'f', 'rn', 'lf', 'k'] },
    fit: (T, m, hh, t) => (T > 18 ? 0.55 : T > 12 ? 0.85 : 1.2) * (t > 0.3 ? 1.15 : 1) },
];
// Which race wakes here, when nobody chose. Humans most places; the beast folk where their country is.
export function raceFor(w, i, rnd) {
  const T = w.tMean[i], m = w.mi[i], hh = w.h[i] - w.params.sea, t = w.t[i], r = rnd();
  if (T > 18 && m > 1.1 && hh < 0.12 && r < 0.75) return 1;
  if (hh > 0.26 && r < 0.6) return 3;
  if (T < 6 && t > 0.35 && r < 0.6) return 4;
  if (r < 0.12) return 2;
  return 0;
}
export const raceFit = (w, c, i) => RACES[c.race || 0].fit(w.tMean[i], w.mi[i], w.h[i] - w.params.sea, w.t[i]);
