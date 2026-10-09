// @ts-nocheck
// Animals. Herds of grazers follow the grass through the seasons; packs follow the herds.
// Which kinds live on which continent is decided at the start, so some lands have horses and
// some never will. That matters later, to people.
import { W, H, N, TPY, clamp, wx, NB8, hash2 } from './core';
import { ev, discover } from './story';

export const SPECIES = [
  { key: 'deer', name: 'deer', one: 'a herd of deer', col: '#c8a878', tame: null, meat: 1, hab: (T, m, tr, hh) => (tr > 0.25 && T > 1 && T < 25 ? 1 : 0.15) },
  { key: 'horse', name: 'wild horses', one: 'a herd of wild horses', col: '#8a5a3a', tame: 'horse', meat: 1, hab: (T, m, tr) => (tr < 0.35 && m > 0.2 && m < 1.1 && T > -4 && T < 21 ? 1 : 0.1) },
  { key: 'aurochs', name: 'aurochs', one: 'a herd of aurochs', col: '#4a3a30', tame: 'cattle', meat: 1.4, hab: (T, m, tr) => (m > 0.5 && T > 5 && T < 27 ? 1 : 0.1) },
  { key: 'mammoth', name: 'mammoths', one: 'a herd of mammoths', col: '#7a5236', tame: null, meat: 3, hab: (T) => (T < 3 ? 1 : T < 8 ? 0.3 : 0) },
  { key: 'antelope', name: 'antelope', one: 'a herd of antelope', col: '#d8b070', tame: null, meat: 0.8, hab: (T, m, tr) => (T > 17 && m > 0.18 && m < 1.2 && tr < 0.5 ? 1 : 0.1) },
  { key: 'camel', name: 'wild camels', one: 'a string of wild camels', col: '#c9a468', tame: 'camel', meat: 1, hab: (T, m) => (m < 0.4 && T > 6 ? 1 : 0.05) },
  { key: 'goat', name: 'mountain goats', one: 'a band of mountain goats', col: '#e8e2d2', tame: 'goat', meat: 0.6, hab: (T, m, tr, hh) => (hh > 0.17 && T > -8 ? 1 : 0.1) },
  { key: 'reindeer', name: 'reindeer', one: 'a herd of reindeer', col: '#b8b0a4', tame: 'reindeer', meat: 1, hab: (T) => (T < 5 && T > -14 ? 1 : 0.05) },
  { key: 'boar', name: 'wild boar', one: 'a sounder of boar', col: '#5a4a44', tame: 'pig', meat: 0.9, hab: (T, m, tr) => (tr > 0.4 && T > 7 ? 1 : 0.1) },
];
// A herd eats its patch down to the roots and moves on; grass, not a head count, is what limits
// them. Packs keep them well under that limit, which is why the grass is long where wolves live.
const MAXH = 1000, MAXP = 240, EAT = 0.015, GROW = 0.085, SPLIT = 150, KILL = 0.5, PGROW = 0.125;
export const habitat = (w, sp, i) => SPECIES[sp].hab(w.tMean[i], w.mi[i], w.t[i], w.h[i] - w.params.sea);

export function initFauna(w) {
  const rnd = w.rnd; w.herds = []; w.packs = []; w.species = SPECIES.map(() => ({ alive: false, ever: false, n: 0, odd: null })); w.massKinds = {};
  // candidate cells per landmass
  const byMass = {};
  for (let i = 0; i < N; i += 3) { if (w.water[i] || w.ice[i] || w.g[i] < 0.25) continue; const m = w.mass[i]; if ((w.massSize[m] || 0) < 30) continue; (byMass[m] || (byMass[m] = [])).push(i); }
  for (const m in byMass) {
    const cells = byMass[m], kinds = [];
    for (let s = 0; s < SPECIES.length; s++) {
      let good = 0; for (let k = 0; k < cells.length; k += 2) if (habitat(w, s, cells[k]) > 0.9) good++;
      if (good < 6 || rnd() > 0.62) continue; kinds.push(s);
      const want = Math.min(60, Math.ceil(good / 9)); let made = 0;
      for (let tries = 0; tries < want * 30 && made < want; tries++) { const i = cells[(rnd() * cells.length) | 0]; if (habitat(w, s, i) < 0.9) continue; w.herds.push({ x: i % W, y: (i / W) | 0, px: i % W, py: (i / W) | 0, n: 14 + rnd() * 30, sp: s, mt: 0 }); made++; }
    }
    w.massKinds[m] = kinds;
    // a few packs wherever there is game
    if (kinds.length) for (let k = 0; k < Math.min(18, Math.ceil(cells.length / 220)); k++) { const i = cells[(rnd() * cells.length) | 0]; w.packs.push({ x: i % W, y: (i / W) | 0, px: i % W, py: (i / W) | 0, n: 4 + rnd() * 3, h: (rnd() * 8) | 0, mt: 0 }); }
  }
  for (const h of w.herds) { w.species[h.sp].alive = true; w.species[h.sp].ever = true; }
  rebuild(w);
}
function rebuild(w) { const a = w.herdAt; a.fill(0); for (let k = 0; k < w.herds.length; k++) { const h = w.herds[k]; a[h.y * W + h.x] = k + 1; } }

const crowd = new Uint8Array((W / 8) * (H / 8));
export function fauna(w) {
  const { herds, packs, herdAt, g, green, water, fireT, t, owner, temp, snow } = w, rnd = w.rnd, half = w.tickN & 1;
  const born = [];
  for (let k = half; k < herds.length; k += 2) {
    const h = herds[k]; if (h.n < 2) continue; let c = h.y * W + h.x; h.px = h.x; h.py = h.y; h.mt = w.tickN;
    if (water[c] === 1) { h.n = 0; continue; } if (fireT[c] || w.lava[c]) h.n *= 0.5;
    const sp = h.sp, farm = w.farm;
    let bx = h.x, by = h.y, bs = g[c] * (0.35 + 0.65 * green[c]) * (farm[c] ? 0.3 : 1) + 0.05; const st = (rnd() * 8) | 0;
    for (let q = 0; q < 8; q++) {
      const d = NB8[(q + st) & 7], y = h.y + d[1]; if (y < 1 || y >= H - 1) continue; const x = wx(h.x + d[0]), i = y * W + x; if (water[i] || fireT[i]) continue;
      let sc = g[i] * (0.35 + 0.65 * green[i]) * (farm[i] ? 0.3 : 1) + rnd() * 0.07; if (herdAt[i]) sc -= 0.3; if (owner[i] >= 0) sc -= 0.12; if (snow[i] > 0.6) sc -= 0.15;
      if (sc <= bs) continue; sc -= (sc > 0 ? sc : 0) * 0.65 * (1 - habitat(w, sp, i));
      if (sc > bs) { bs = sc; bx = x; by = y; }
    }
    if (bx !== h.x || by !== h.y) { if (herdAt[c] === k + 1) herdAt[c] = 0; h.x = bx; h.y = by; c = by * W + bx; herdAt[c] = k + 1; }
    const need = h.n * EAT, got = Math.min(need, g[c]); g[c] -= got; const hb = habitat(w, sp, c);
    h.n += h.n * ((GROW * got) / need - 0.03 - (hb < 0.5 ? 0.03 : 0));
    if (h.n > SPLIT) { if (herds.length + born.length < MAXH) { h.n *= 0.5; born.push({ x: h.x, y: h.y, px: h.x, py: h.y, n: h.n, sp, mt: w.tickN, odd: h.odd }); } else h.n = SPLIT; }
  }
  // packs
  crowd.fill(0); for (const p of packs) crowd[((p.y >> 3) * (W / 8)) + (p.x >> 3)]++;
  const bornP = [];
  for (let k = half; k < packs.length; k += 2) {
    const p = packs[k]; if (p.n < 1.5) continue; let c = p.y * W + p.x; p.px = p.x; p.py = p.y; p.mt = w.tickN;
    if (water[c] === 1) { p.n = 0; continue; } if (fireT[c]) p.n *= 0.6;
    let best = null, bd = 99;
    for (let dy = -5; dy <= 5; dy++) { const y = p.y + dy; if (y < 0 || y >= H) continue; for (let dx = -5; dx <= 5; dx++) { const hk = herdAt[y * W + wx(p.x + dx)]; if (!hk) continue; const hd = herds[hk - 1]; if (!hd || hd.n < 5) continue; const d = Math.max(Math.abs(dx), Math.abs(dy)); if (d < bd) { bd = d; best = hd; } } }
    for (let s2 = 0; s2 < 2; s2++) {
      let dx, dy; if (best) { const ddx = best.x - p.x, wdx = ddx > W / 2 ? ddx - W : ddx < -W / 2 ? ddx + W : ddx; if (Math.max(Math.abs(wdx), Math.abs(best.y - p.y)) <= 1) break; dx = Math.sign(wdx); dy = Math.sign(best.y - p.y); }
      else { if (rnd() < 0.25) p.h = (rnd() * 8) | 0; dx = NB8[p.h][0]; dy = NB8[p.h][1]; }
      const y = p.y + dy, x = wx(p.x + dx); if (y < 1 || y >= H - 1 || water[y * W + x]) { p.h = (rnd() * 8) | 0; continue; } p.x = x; p.y = y;
    }
    c = p.y * W + p.x; let fed = 0;
    if (best) { const ddx = best.x - p.x, wdx = ddx > W / 2 ? ddx - W : ddx < -W / 2 ? ddx + W : ddx; if (Math.max(Math.abs(wdx), Math.abs(best.y - p.y)) <= 1) { const eff = t[best.y * W + best.x] > 0.5 ? 0.5 : 1, big = SPECIES[best.sp].meat, kill = Math.min(best.n * 0.3, (p.n * KILL * eff) / big); best.n -= kill; fed = Math.min(1, (kill * big) / (p.n * KILL)); } }
    p.n += p.n * ((PGROW * fed) / (1 + Math.max(0, crowd[((p.y >> 3) * (W / 8)) + (p.x >> 3)] - 1)) - 0.05); if (owner[c] >= 0) p.n *= 0.95;
    if (p.n > 9 && packs.length + bornP.length < MAXP) { p.n *= 0.5; bornP.push({ x: p.x, y: p.y, px: p.x, py: p.y, n: p.n, h: (rnd() * 8) | 0, mt: w.tickN }); }
  }
  if ((w.tickN & 3) === 0) {
    let j = 0; for (const h of herds) if (h.n >= 2) herds[j++] = h; herds.length = j; for (const b of born) herds.push(b);
    j = 0; for (const p of packs) if (p.n >= 1.5) packs[j++] = p; packs.length = j; for (const b of bornP) packs.push(b);
    rebuild(w);
  } else { for (const b of born) herds.push(b); for (const b of bornP) packs.push(b); }
}

// Once a year: head counts, extinctions, and island strangeness.
export function faunaYear(w) {
  const cnt = w.species.map(() => 0); let total = 0;
  for (const h of w.herds) { cnt[h.sp] += h.n; total += h.n; const st = w.species[h.sp]; st.lx = h.x; st.ly = h.y; }
  w.stats.grazers = Math.round(total); let pk = 0; for (const p of w.packs) pk += p.n; w.stats.hunters = Math.round(pk);
  for (let s = 0; s < SPECIES.length; s++) {
    const st = w.species[s]; st.n = cnt[s];
    if (st.alive && cnt[s] <= 0) { st.alive = false; ev(w, `The last ${SPECIES[s].name} are gone. There will be no more.`, st.lx, st.ly, null); discover(w, 'lost', st.lx, st.ly); }
  }
  w.grazAvg = w.grazAvg == null ? total : w.grazAvg + (total - w.grazAvg) * 0.015; if (w.year > 120 && total > w.grazAvg * 1.35 && total > 30000 && w.herds.length && w.year - (w.herdsTold || -99) > 80) { const h = w.herds[0]; w.herdsTold = w.year; discover(w, 'herds', h.x, h.y); ev(w, w.stats.hunters < 300 ? 'With nothing left to hunt them, the herds have grown past counting. The grass is going.' : 'The herds have grown past counting. The grass is going.', h.x, h.y, null); }
  w.grazPeak = Math.max(total, (w.grazPeak || 0) * 0.99); if (w.year > 60 && w.grazPeak > 25000 && total < w.grazPeak * 0.58 && w.herds.length) { const h = w.herds[0]; w.grazPeak = total; if (discover(w, 'boom', h.x, h.y)) ev(w, 'The herds ate the grass to the roots. Now there are bones on every plain.', h.x, h.y, null); }
  if (!w.packs.length && w.year > 20 && !w.found.nopred && w.herds.length) discover(w, 'nopred', w.herds[0].x, w.herds[0].y);
  if (w.year % 50 === 25) {
    for (const h of w.herds) { if (h.odd) continue; const m = w.mass[h.y * W + h.x], sz = w.massSize[m] || 0; if (sz > 12 && sz < 420) { h.iso = (h.iso || 0) + 50; if (h.iso >= 350) { h.odd = sz < 140 ? 'dwarf' : 'giant'; if (discover(w, 'oddity', h.x, h.y)) ev(w, `Cut off on their island, the ${SPECIES[h.sp].name} have grown ${h.odd === 'dwarf' ? 'small and tame' : 'huge and strange'}.`, h.x, h.y, null); } } else h.iso = 0; }
  }
}
export function addHerd(w, x, y, sp) { x = wx(Math.round(x)); y = clamp(Math.round(y), 1, H - 2); const i = y * W + x; if (w.water[i]) return false;
  // the world only holds so many herds: when it is full, the weakest one somewhere makes room
  if (w.herds.length >= MAXH) { let k = 0; for (let q = 1; q < w.herds.length; q++) if (w.herds[q].n < w.herds[k].n) k = q; w.herds.splice(k, 1); w.herdAt.fill(0); for (let q = 0; q < w.herds.length; q++) { const h = w.herds[q]; w.herdAt[h.y * W + h.x] = q + 1; } }
  if (sp == null) { let bs = -1; for (let s = 0; s < SPECIES.length; s++) { const v = habitat(w, s, i) + w.rnd() * 0.3; if (v > bs) { bs = v; sp = s; } } }
  w.herds.push({ x, y, px: x, py: y, n: 26, sp, mt: w.tickN }); w.species[sp].alive = true; w.species[sp].ever = true; return SPECIES[sp]; }
export function addPack(w, x, y) { x = wx(Math.round(x)); y = clamp(Math.round(y), 1, H - 2); if (w.water[y * W + x] || w.packs.length >= MAXP) return false; w.packs.push({ x, y, px: x, py: y, n: 6, h: 0, mt: w.tickN }); return true; }
