// Wildlife as a living layer, not as markers. Every cell holds a density of grazers (the animals
// that eat the plants) and of hunters (the animals that eat the grazers). Grazers breed where the
// food is, strip it if they get too many, and spread into neighbouring country; hunters follow
// them and starve when they crash. Which kinds of animal live on a landmass is decided at the
// start: some lands have horses and some never will, and that matters to people later.
import { W, H, N, clamp, wx, DISC } from './core.js';
import { ev, discover } from './story.js';
import { byContinent } from './origins.js';

export const SPECIES = [
  { key: 'deer', name: 'deer', col: '#b8875a', tame: null, hab: (T, m, tr, hh) => (tr > 0.25 && T > 1 && T < 25 ? 1 : 0.15) },
  { key: 'horse', name: 'wild horses', col: '#8a5a3a', tame: 'horse', hab: (T, m, tr) => (tr < 0.35 && m > 0.2 && m < 1.1 && T > -4 && T < 21 ? 1 : 0.1) },
  { key: 'aurochs', name: 'aurochs', col: '#4a3a30', tame: 'cattle', hab: (T, m) => (m > 0.5 && T > 5 && T < 27 ? 1 : 0.1) },
  { key: 'mammoth', name: 'mammoths', col: '#6f4a30', tame: null, mega: true, hab: (T) => (T < 3 ? 1 : T < 8 ? 0.3 : 0) },
  { key: 'antelope', name: 'antelope', col: '#d8b070', tame: null, hab: (T, m, tr) => (T > 17 && m > 0.18 && m < 1.2 && tr < 0.5 ? 1 : 0.1) },
  { key: 'camel', name: 'wild camels', col: '#c9a468', tame: 'camel', hab: (T, m) => (m < 0.4 && T > 6 ? 1 : 0.05) },
  { key: 'goat', name: 'mountain goats', col: '#e8e2d2', tame: 'goat', hab: (T, m, tr, hh) => (hh > 0.17 && T > -8 ? 1 : 0.1) },
  { key: 'reindeer', name: 'reindeer', col: '#b8b0a4', tame: 'reindeer', hab: (T) => (T < 5 && T > -14 ? 1 : 0.05) },
  { key: 'boar', name: 'wild boar', col: '#5a4a44', tame: 'pig', hab: (T, m, tr) => (tr > 0.4 && T > 7 ? 1 : 0.1) },
  { key: 'zebra', name: 'zebra', col: '#e8e4dc', tame: null, hab: (T, m, tr) => (T > 18 && m > 0.25 && m < 1.1 && tr < 0.4 ? 1 : 0.08) },
  { key: 'bison', name: 'bison', col: '#5e4630', tame: null, hab: (T, m, tr) => (T > -2 && T < 15 && m > 0.25 && m < 0.9 && tr < 0.35 ? 1 : 0.08) },
  { key: 'llama', name: 'guanacos', col: '#c8a080', tame: 'llama', hab: (T, m, tr, hh) => (hh > 0.2 && T > -6 && T < 18 ? 1 : 0.05) },
  { key: 'buffalo', name: 'wild buffalo', col: '#3e3a3a', tame: 'buffalo', hab: (T, m) => (T > 19 && m > 1.0 ? 1 : 0.06) },
  { key: 'leaper', name: 'leapers', col: '#b07a52', tame: null, hab: (T, m, tr) => (T > 12 && m > 0.15 && m < 1.0 && tr < 0.4 ? 1 : 0.08) },
  { key: 'sloth', name: 'giant sloths', col: '#7a6040', tame: null, mega: true, hab: (T, m, tr) => (T > 14 && tr > 0.3 ? 1 : 0.08) },
  { key: 'moa', name: 'great walking birds', col: '#9a8a70', tame: null, mega: true, hab: (T, m) => (T > 2 && T < 22 && m > 0.3 ? 1 : 0.1) },
];
SPECIES.forEach((sp, k) => { const h = (k * 0.618034) % 1, f = (n) => { const q = (n + h * 12) % 12; return Math.min(255, Math.round(240 * (0.6 - 0.4 * Math.max(-1, Math.min(q - 3, 9 - q, 1))))); }; sp.lc = '#' + [f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, '0')).join(''); });
export const habRaw = (w, sp, i) => SPECIES[sp].hab(w.tMean[i], w.mi[i], w.t[i], w.h[i] - w.params.sea);
// Where each kind of animal can live, worked out once per climate (and once a decade, as forests move)
export function habMap(w, part) {
  const NS = SPECIES.length, hm = w.hab || (w.hab = new Uint8Array(NS * N)), y0 = part == null ? 0 : part, st = part == null ? 1 : 16;
  // only for the kinds that live on this cell's land; anything else asks habRaw directly
  for (let y = y0; y < H; y += st) for (let i = y * W, e = i + W; i < e; i++) { const k = w.water[i] ? null : w.massKinds && w.massKinds[w.mass[i]]; if (!k || !k.length) continue; for (let q = 0; q < k.length; q++) hm[k[q] * N + i] = Math.round(habRaw(w, k[q], i) * 100); }
  if (part == null) { w.habStamp = w.climateStamp; w.habYear = w.year; }
}
export const habitat = (w, sp, i) => (w.hab ? w.hab[sp * N + i] / 100 : habRaw(w, sp, i));
// What a cell of plants can feed: grass fully, woods partly (browse), fields a little (raided).
// the dead blight what grows near them; deep wild country grows beasts bigger than they should be
function forage(w, i) { if (w.water[i] || w.ice[i] || w.urban[i]) return 0; const b = i * 6, m = w.mem; const k = (m ? (1 - 0.8 * Math.min(1, m[b])) * (1 + 0.5 * Math.min(1, m[b + 1])) : 1) * (w.fallout ? 1 - Math.min(1, w.fallout[i]) : 1); if (w.farm[i]) return 0.15 * k; return (w.g[i] * 0.9 + w.t[i] * 0.4) * k; }

export function initFauna(w) {
  const rnd = w.rnd; w.graze = new Float32Array(N); w.hunt = new Float32Array(N); w.spAt = new Uint8Array(N).fill(255); w.species = SPECIES.map(() => ({ alive: false, ever: false, n: 0 })); w.massKinds = {};
  w.massKinds = byContinent(w, SPECIES.length, (s, i) => habRaw(w, s, i) > 0.9, { min: 6, atLeast: 3, island: 0.45 });
  for (const m in w.massKinds) for (const s of w.massKinds[m]) { w.species[s].alive = true; w.species[s].ever = true; }
  // the land starts full of life, with hunters wherever there is game
  for (let i = 0; i < N; i++) { const m = w.mass[i]; if (!(w.massKinds[m] && w.massKinds[m].length)) continue; const f = forage(w, i); w.graze[i] = f * 0.7 * (0.6 + 0.8 * rnd()); w.hunt[i] = w.graze[i] * 0.15 * rnd(); }
  habMap(w); speciesMap(w);
}
// Which kind of animal a cell's grazers are: the best fit for the place among those this land has.
export function speciesMap(w, part) {
  const { spAt, water, mass } = w, y0 = part == null ? 0 : part, st = part == null ? 1 : 16;
  for (let y = y0; y < H; y += st) for (let i = y * W, e = i + W; i < e; i++) { if (water[i]) { spAt[i] = 255; continue; } const k = w.massKinds[mass[i]]; if (!k || !k.length) { spAt[i] = 255; continue; } let b = 255, bv = 0.3; for (const s of k) { const v = habitat(w, s, i); if (v > bv) { bv = v; b = s; } } spAt[i] = b; }
}

// One quarter of the rows each tick, so each cell is updated twice a year.
export function fauna(w) {
  const { graze: G, hunt: P, g, water, fireT, lava, owner } = w, part = (w.tickN >> 1) & 3, dt = 1;
  for (let y = 1 + part; y < H - 1; y += 4) {
    const row = y * W;
    for (let x = 0; x < W; x++) {
      const i = row + x; if (water[i]) { G[i] = 0; P[i] = 0; continue; }
      let gz = G[i], hu = P[i]; const F = forage(w, i), K = F * 1.1 + 0.002;
      if (fireT[i] || lava[i]) { gz *= 0.3; hu *= 0.3; }
      // neighbours: animals drift toward where there is more to eat, hunters roam further
      const l = row + (x === 0 ? W - 1 : x - 1), r = row + (x === W - 1 ? 0 : x + 1), u = i - W, d = i + W;
      const gAvg = (G[l] + G[r] + G[u] + G[d]) * 0.25, pAvg = (P[l] + P[r] + P[u] + P[d]) * 0.25;
      gz += 0.22 * (gAvg - gz) * (gAvg > gz || F < gz ? 1 : 0.5); hu += 0.38 * (pAvg - hu);
      const eat = 1.1 * gz * hu / (0.25 + gz);
      gz += dt * (0.7 * gz * (1 - gz / K) - eat) + 0.0004 * K;
      hu += dt * (0.4 * eat - 0.2 * hu - 0.4 * hu * hu);
      if (owner[i] >= 0) hu *= 0.97;                    // people kill what hunts their flocks
      // too many mouths eat the grass down
      const bite = Math.min(g[i], dt * 0.05 * gz * Math.max(0, gz / K - 0.6)); g[i] -= bite;
      G[i] = gz < 0 ? 0 : gz > 2 ? 2 : gz; P[i] = hu < 0 ? 0 : hu > 1 ? 1 : hu;
    }
  }
}

// Once a year: head counts, extinctions, booms and crashes.
export function faunaYear(w) {
  megafauna(w);
  const { graze: G, hunt: P, spAt, mass } = w, per = new Float64Array(SPECIES.length);
  let gs = 0, ps = 0, lx = 0, ly = 0, best = 0;
  habMap(w, w.year & 15); speciesMap(w, w.year & 15);   // a sixteenth of the map each year, so it follows the climate without a stall
  for (let i = w.year & 1; i < N; i += 2) { const g = G[i] * 2; if (g <= 0.002) continue; gs += g; ps += P[i] * 2; const s = spAt[i]; if (s !== 255) per[s] += g; if (g > best) { best = g; lx = i % W; ly = (i / W) | 0; } }
  w.stats.grazers = Math.round(gs * 40); w.stats.hunters = Math.round(ps * 8);
  // a kind that no longer has animals anywhere on a landmass is gone from it
  // a kind survives on a landmass while there is game anywhere it could live there
  const NS = SPECIES.length, nm = w.massSize.length + 1, live = new Float32Array(nm * NS), hab = w.hab;
  for (let i = w.year & 1; i < N; i += 2) { const g = G[i]; if (g < 0.05) continue; const m = mass[i], k = w.massKinds[m]; if (!k || m >= nm) continue; for (let q = 0; q < k.length; q++) { const s = k[q]; if (hab[s * N + i] > 50) live[m * NS + s] += g; } }
  for (const m in w.massKinds) w.massKinds[m] = w.massKinds[m].filter((s) => +m >= nm || live[+m * NS + s] > 1 || w.year < 40);
  for (let s = 0; s < SPECIES.length; s++) {
    const st = w.species[s]; st.n = Math.round(per[s] * 40); const onSome = Object.values(w.massKinds).some((k) => k.includes(s));
    if (st.alive && !onSome) { st.alive = false; ev(w, `The last ${SPECIES[s].name} are gone. There will be no more.`, lx, ly, null); discover(w, 'lost', lx, ly); }
  }
  const total = gs * 40;
  w.grazAvg = w.grazAvg == null ? total : w.grazAvg + (total - w.grazAvg) * 0.015;
  if (w.year > 120 && total > w.grazAvg * 1.3 && w.year - (w.herdsTold || -99) > 80) { w.herdsTold = w.year; discover(w, 'herds', lx, ly); ev(w, w.stats.hunters < 40 ? 'With nothing left to hunt them, the herds have grown past counting. The grass is going.' : 'The herds have grown past counting. The grass is going.', lx, ly, null); }
  w.grazPeak = Math.max(total, (w.grazPeak || 0) * 0.99); if (w.year > 60 && total < w.grazPeak * 0.6) { w.grazPeak = total; if (discover(w, 'boom', lx, ly)) ev(w, 'The herds ate the grass to the roots. Now there are bones on every plain.', lx, ly, null); }
  if (ps < 1 && w.year > 20 && !w.found.nopred && gs > 10) discover(w, 'nopred', lx, ly);
}
// Where people have always been, the great beasts learned to fear them. Where people arrive
// late, the giants stand and watch the spears come, and within a few lifetimes they are gone.
function megafauna(w) {
  if (!w.arrived) return;
  for (const m in w.massKinds) {
    const a = w.arrived[m]; if (!a) continue; const since = w.year - Math.min(...a); if (since < 0 || since > 250) continue;
    const k = w.massKinds[m]; for (const s of k.slice()) { if (!SPECIES[s].mega || w.rnd() > 0.02) continue; w.massKinds[m] = w.massKinds[m].filter((q) => q !== s); let x = null, y = null; for (let i = 0; i < N; i += 97) if (w.mass[i] === +m && w.spAt[i] === s) { x = i % W; y = (i / W) | 0; break; } ev(w, `The last ${SPECIES[s].name} ${const_where(w, x, y)}are hunted out. They never learned to fear people.`, x, y, null, 0); discover(w, 'megafauna', x, y); speciesMap(w); }
  }
}
const const_where = (w, x, y) => (x == null ? '' : y < H / 3 ? 'of the north ' : y > (2 * H) / 3 ? 'of the south ' : 'of the middle lands ');
// Animals that come off a ship. Some get loose and run wild; some of those crowd out what lived there.
export function introduce(w, x, y, sp, who) {
  const i = y * W + x, m = w.mass[i], k = w.massKinds[m] || (w.massKinds[m] = []); if (k.includes(sp) || habRaw(w, sp, i) < 0.5) return false;
  k.push(sp); w.species[sp].alive = true; w.species[sp].ever = true;
  for (const o of DISC[6]) { const yy = y + o[1]; if (yy < 1 || yy >= H - 1) continue; const j = yy * W + wx(x + o[0]); if (!w.water[j]) w.graze[j] = Math.min(2, w.graze[j] + 0.5 * (1 - o[2] / 7)); }
  let lost = null; const rivals = k.filter((s) => s !== sp && !SPECIES[s].tame && w.rnd() < 0.3); if (rivals.length) { lost = rivals[0]; w.massKinds[m] = k.filter((s) => s !== lost); }
  habMap(w); speciesMap(w);
  ev(w, `${{ horse: 'Horses', cattle: 'Cattle', goat: 'Goats', pig: 'Pigs', camel: 'Camels', llama: 'Llamas', buffalo: 'Buffalo', reindeer: 'Reindeer' }[SPECIES[sp].tame] || 'Animals'} that got loose from the ${who} run wild across a land that never had them.${lost != null ? ` The ${SPECIES[lost].name} that lived there cannot compete.` : ''}`, x, y, null, 0); discover(w, 'feral', x, y);
  return true;
}
// hunting by people: take up to `want` from the grazers around a cell; returns what was taken
// animals in wild-haunted country do not fear people, and are not caught by them
export function takeGame(w, i, want) { const g = w.graze[i]; const t = Math.min(g * 0.2 * (w.mem ? 1 - 0.6 * Math.min(1, w.mem[i * 6 + 1]) : 1), want); w.graze[i] = g - t; return t; }
export function dominantAt(w, i) { const s = w.spAt[i]; return s === 255 ? null : s; }

// The god's hand: set animals down, loose hunters, or empty a country.
export function addHerd(w, x, y, sp) {
  x = wx(Math.round(x)); y = clamp(Math.round(y), 2, H - 3); const i = y * W + x; if (w.water[i]) return false;
  if (sp == null) { let bs = -1; for (let s = 0; s < SPECIES.length; s++) { const v = habRaw(w, s, i) + w.rnd() * 0.3; if (v > bs) { bs = v; sp = s; } } }
  const m = w.mass[i], k = w.massKinds[m] || (w.massKinds[m] = []); if (!k.includes(sp)) k.push(sp);
  w.species[sp].alive = true; w.species[sp].ever = true;
  for (const o of DISC[5]) { const yy = y + o[1]; if (yy < 1 || yy >= H - 1) continue; const j = yy * W + wx(x + o[0]); if (w.water[j]) continue; w.graze[j] = Math.min(2, w.graze[j] + 0.9 * (1 - o[2] / 6)); }
  habMap(w); speciesMap(w); return SPECIES[sp];
}
export function addPack(w, x, y) {
  x = wx(Math.round(x)); y = clamp(Math.round(y), 2, H - 3); if (w.water[y * W + x]) return false;
  for (const o of DISC[4]) { const yy = y + o[1]; if (yy < 1 || yy >= H - 1) continue; const j = yy * W + wx(x + o[0]); if (w.water[j]) continue; w.hunt[j] = Math.min(1, w.hunt[j] + 0.5 * (1 - o[2] / 5)); }
  return true;
}
export function cull(w, x, y, r) {
  let n = 0; x = Math.round(x); y = Math.round(y);
  for (const o of DISC[Math.min(20, r)]) { const yy = y + o[1]; if (yy < 0 || yy >= H) continue; const j = yy * W + wx(x + o[0]); if (w.graze[j] > 0.01 || w.hunt[j] > 0.01) n++; w.graze[j] = 0; w.hunt[j] = 0; }
  return n > 0;
}
