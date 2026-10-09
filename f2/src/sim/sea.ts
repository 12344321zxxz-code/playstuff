// @ts-nocheck
// What lives in the sea. Fish are a stock on the coarse grid: rich on cool shallow shelves, thin
// in the warm deep. Boats take from it, it grows back, and a fleet that takes too much for too
// long finds the nets empty. Further out, in deep water where the magic pools, something else.
import { W, H, N, CS, CW, CH, CN, clamp, wx, wrapDx } from './core';
import { ev, discover, nameIt } from './story';

export const FISH_FEEDS = 190;   // people one full coarse cell could feed if you emptied it
export function initSea(w) { w.fish = new Float32Array(CN); w.fishK = new Float32Array(CN); w.krakens = []; seaCap(w); w.fish.set(w.fishK); }
// How much each patch of sea can hold. Redone when coasts or climate move.
export function seaCap(w) {
  const { h, water, tMean } = w, sea = w.params.sea, K = w.fishK;
  for (let cy = 0; cy < CH; cy++) for (let cx = 0; cx < CW; cx++) {
    let wet = 0, d = 0, T = 0, ice = 0;
    for (let dy = 0; dy < CS; dy++) for (let dx = 0; dx < CS; dx++) { const j = (cy * CS + dy) * W + cx * CS + dx; if (water[j] === 1) { wet++; d += sea - h[j]; T += tMean[j]; if (w.ice[j]) ice++; } }
    const i = cy * CW + cx; if (!wet) { K[i] = 0; if (w.fish) w.fish[i] = 0; continue; }
    d /= wet; T /= wet;
    K[i] = (wet / 16) * (d < 0.1 ? 1 : d < 0.25 ? 0.6 : 0.22) * (T < 4 ? 0.8 : T < 17 ? 1 : T < 24 ? 0.75 : 0.55) * (ice > wet / 2 ? 0.3 : 1);
    if (w.fish[i] > K[i]) w.fish[i] = K[i];
  }
}
export function seaYear(w) {
  const f = w.fish, K = w.fishK;
  for (let i = 0; i < CN; i++) { const k = K[i]; if (k <= 0) continue; const v = f[i]; f[i] = Math.min(k, v + 0.42 * v * (1 - v / k) + 0.012 * k); }
  // fish drift in from the next patch over, so an emptied bay refills from outside
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { const i = y * CW + x; if (K[i] <= 0) continue; const j = y * CW + (x + 1) % CW; if (K[j] <= 0) continue; const d = (f[j] / K[j] - f[i] / K[i]) * 0.06; f[i] += d * K[i]; f[j] -= d * K[j]; }
  krakenYear(w);
}
// Try to take `want` people's worth of fish within r cells of a place. Returns what was caught.
export function catchFish(w, x, y, r, want) {
  const f = w.fish, cr = Math.max(1, Math.ceil(r / CS)), cx0 = x >> 2, cy0 = y >> 2; let have = 0;
  for (let dy = -cr; dy <= cr; dy++) { const cy = cy0 + dy; if (cy < 0 || cy >= CH) continue; for (let dx = -cr; dx <= cr; dx++) have += f[cy * CW + ((cx0 + dx) % CW + CW) % CW]; }
  if (have <= 0) return 0;
  const reach = have * FISH_FEEDS * 0.3, got = Math.min(want, reach), frac = got / (have * FISH_FEEDS);
  for (let dy = -cr; dy <= cr; dy++) { const cy = cy0 + dy; if (cy < 0 || cy >= CH) continue; for (let dx = -cr; dx <= cr; dx++) f[cy * CW + ((cx0 + dx) % CW + CW) % CW] *= 1 - frac; }
  return got;
}
// how full the sea is around a place, 0..1
export function fishNear(w, x, y, r) {
  const f = w.fish, K = w.fishK, cr = Math.max(1, Math.ceil(r / CS)), cx0 = x >> 2, cy0 = y >> 2; let a = 0, b = 0;
  for (let dy = -cr; dy <= cr; dy++) { const cy = cy0 + dy; if (cy < 0 || cy >= CH) continue; for (let dx = -cr; dx <= cr; dx++) { const i = cy * CW + ((cx0 + dx) % CW + CW) % CW; a += f[i]; b += K[i]; } }
  return b > 0 ? a / b : 0;
}

/* ---------- the deep ones ---------- */
const KNAME = ['the Drowned King', 'Mother of Eels', 'Old Maw', 'the Pale Hand', 'Thousand-Arms', 'the Sleeper Below'];
const SNAME = ['the Long Coil', 'Saltwyrm', 'the Grey Ribbon', 'Jormun', 'the Leviathan', 'Old Scales'];
export function addKraken(w, x, y, kind) {
  x = wx(Math.round(x)); y = clamp(Math.round(y), 2, H - 3); if (w.water[y * W + x] !== 1 || w.krakens.length >= 5) return null;
  kind = kind || 'kraken'; const L = kind === 'serpent' ? SNAME : KNAME, n = (w.krakenNames = (w.krakenNames || 0) + 1);
  const k = { id: w.nextId++, kind, x, y, px: x, py: y, hx: x, hy: y, name: L[n % L.length], sunk: 0, born: w.year, wake: 0 }; w.krakens.push(k); nameIt(w, 'b' + k.id, k.name); (w.beastLog || (w.beastLog = [])).push(k); return k;
}
function krakenYear(w) {
  const rnd = w.rnd, sea = w.params.sea;
  if (w.krakens.length < 2 && w.year > 150 && (w.stats.ships || 0) > 3 && rnd() < 0.006) {
    for (let q = 0; q < 300; q++) { const i = (rnd() * N) | 0; if (w.water[i] === 1 && sea - w.h[i] > 0.3 && !w.ice[i] && (w.magic[i] > 0.1 || rnd() < 0.05)) { const k = addKraken(w, i % W, (i / W) | 0); if (k) ev(w, `Sailors speak of ${k.name}, and of a patch of sea they will not cross.`, k.x, k.y, null); break; } }
  }
  for (const k of w.krakens) { const i = k.y * W + k.x; if (w.water[i] !== 1) { k.dead = true; ev(w, `The sea has left ${k.name} on dry rock. It does not last the summer.`, k.x, k.y, null); continue; } w.magic[i] = Math.min(1, w.magic[i] + 0.04); if (k.wake > 0) k.wake--;
    if (k.kind === 'serpent') { for (let q = 0; q < 8; q++) { const nx = wx(Math.round(k.hx + (rnd() - 0.5) * 30)), ny = clamp(Math.round(k.hy + (rnd() - 0.5) * 22), 2, H - 3); if (w.water[ny * W + nx] === 1) { k.tx = nx; k.ty = ny; break; } } } }
  if (w.krakens.some((k) => k.dead)) { for (const k of w.krakens) if (k.dead) k.died = w.year; w.krakens = w.krakens.filter((k) => !k.dead); }
}
// serpents glide; krakens stay put
export function krakensTick(w) { for (const k of w.krakens) { k.px = k.x; k.py = k.y; if (k.tx == null) continue; const dx = wrapDx(k.tx - k.x), dy = k.ty - k.y, l = Math.hypot(dx, dy); if (l < 0.6) { k.tx = null; continue; } const nx = wx(k.x + (dx / l) * 0.6), ny = k.y + (dy / l) * 0.6; if (w.water[clamp(Math.round(ny), 0, H - 1) * W + wx(Math.round(nx))] !== 1) { k.tx = null; continue; } k.x = nx; k.y = ny; } }
// called for every ship each tick it is at sea
export function krakenNear(w, x, y) { for (const k of w.krakens) if (wrapDx(k.x - x) ** 2 + (k.y - y) ** 2 < 30) return k; return null; }
