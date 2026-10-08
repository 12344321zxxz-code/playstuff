// @ts-nocheck
// The food web under everything else. On the coarse grid: the plants (from the vegetation),
// the grazers and browsers that eat them, the predators that eat those; at sea, the fish (in
// sea.ts) and the great whales that eat the fish. Each is a density that grows, is eaten, and
// spreads to its neighbours. Grazers that outrun their grass strip it bare and crash; predators
// follow them down a few years later. People hunt the grazers, lose flocks to the predators,
// and later hunt the whales.
import { W, H, N, CS, CW, CH, CN, clamp } from './core';
import { ev, discover } from './story';
import { near } from './people';
import { wab } from './life';

export function initEco(w) {
  const e = (w.eco = { plant: new Float32Array(CN), graze: new Float32Array(CN), pred: new Float32Array(CN), whale: new Float32Array(CN), tmp: new Float32Array(CN), boom: 0 });
  plants(w); for (let i = 0; i < CN; i++) { e.graze[i] = e.plant[i] * 0.6; e.pred[i] = e.plant[i] * 0.15; }
  if (w.fishK) for (let i = 0; i < CN; i++) e.whale[i] = w.fishK[i] > 0.5 ? 0.4 : 0;
}
// how much there is to eat in each coarse cell: grass counts fully, woods half, fields a little
function plants(w) {
  const P = w.eco.plant, { g, t, green, water, farm, urban, snow, ice } = w;
  for (let cy = 0; cy < CH; cy++) for (let cx = 0; cx < CW; cx++) {
    let a = 0, n = 0;
    for (let dy = 0; dy < CS; dy += 2) for (let dx = 0; dx < CS; dx += 2) { const i = (cy * CS + dy) * W + cx * CS + dx; if (water[i] || ice[i]) continue; n++; a += urban[i] ? 0 : farm[i] ? 0.25 : g[i] * (0.4 + 0.6 * green[i]) + t[i] * 0.45 - snow[i] * 0.3; }
    P[cy * CW + cx] = n ? Math.max(0, a / 4) : 0;
  }
}
function spread(f, tmp, k) {
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { const i = y * CW + x, l = y * CW + (x + CW - 1) % CW, r = y * CW + (x + 1) % CW, u = y > 0 ? i - CW : i, d = y < CH - 1 ? i + CW : i; tmp[i] = f[i] + k * (f[l] + f[r] + f[u] + f[d] - 4 * f[i]); }
  f.set(tmp);
}
// twice a year
export function ecoStep(w) {
  const e = w.eco; if (!e) return; plants(w); const { plant: P, graze: G, pred: R, whale: Wh, tmp } = e, dt = 0.5;
  let gS = 0, pS = 0, land = 0;
  for (let i = 0; i < CN; i++) {
    const p = P[i]; if (p <= 0.001) { G[i] *= 0.6; R[i] *= 0.6; continue; } land++;
    const g = G[i], r = R[i], K = p * 1.2;
    const eat = 0.9 * g * r / (0.25 + g);                                  // predators eat grazers (saturating)
    G[i] = Math.max(0, g + dt * (0.55 * g * (1 - g / K) - eat + 0.004));
    R[i] = Math.max(0, r + dt * (0.5 * eat - 0.22 * r + 0.001));
    gS += G[i]; pS += R[i];
  }
  spread(G, tmp, 0.08); spread(R, tmp, 0.06);
  // too many grazers eat the grass down
  const { g } = w;
  let anyOver = false; for (let ci = 0; ci < CN; ci++) { const o = G[ci] - P[ci] * 0.9; tmp[ci] = o > 0.05 ? Math.min(0.25, o * 0.3) : 0; if (tmp[ci] > 0) anyOver = true; }
  if (anyOver) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = wab(tmp, x, y); if (k > 0.002) g[y * W + x] *= 1 - k; }
  // whales follow the fish
  if (w.fish) { const F = w.fish, Kf = w.fishK; for (let i = 0; i < CN; i++) { if (Kf[i] <= 0) { Wh[i] = 0; continue; } const h = Wh[i], food = F[i]; Wh[i] = Math.max(0, h + dt * (0.12 * h * (1 - h / (0.2 + food)) - 0.0)); F[i] = Math.max(0, F[i] - h * 0.01); } spread(Wh, tmp, 0.1); for (let i = 0; i < CN; i++) if (Kf[i] <= 0) Wh[i] = 0; }
  e.gMean = land ? gS / land : 0; e.pMean = land ? pS / land : 0;
}
// once a year: people hunt and lose flocks; the almanac watches for booms and crashes
export function ecoYear(w) {
  const e = w.eco; if (!e) return; const G = e.graze, R = e.pred;
  for (const s of w.sets) {
    if (s.dead) continue; const ci = (s.y >> 2) * CW + (s.x >> 2), c = w.cults[s.cult];
    const take = Math.min(G[ci] * 0.3, s.pop / 3000); G[ci] -= take; s.game = take * 900;       // small game for the pot
    if (R[ci] > 0.35 && c.grazer && w.rnd() < 0.05) { s.pop *= 0.985; if (w.rnd() < 0.1 && s.tier >= 1) ev(w, `Wolves take the flocks of ${s.name || 'the ' + c.name}.`, s.x, s.y, c.color, 1); }
    if (c.arts.sailing && s.port && e.whale[ci] >= 0) { for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const y = (s.y >> 2) + dy; if (y < 0 || y >= CH) continue; const j = y * CW + (((s.x >> 2) + dx) % CW + CW) % CW; e.whale[j] *= 0.97; } }
  }
  let wh = 0; for (let i = 0; i < CN; i++) wh += e.whale[i]; if (e.wh0 == null) e.wh0 = wh; e.wh = wh;
  if (e.wh0 > 5 && wh < e.wh0 * 0.15 && discover(w, 'whales', null, null)) ev(w, 'The whale roads are empty. Old sailors talk about the spouts they used to see from shore.', null, null, null, 0);
  const g = e.gMean || 0; e.hist = e.hist || []; e.hist.push(g); if (e.hist.length > 12) e.hist.shift();
  if (e.hist.length >= 12) { const mx = Math.max(...e.hist), mn = Math.min(...e.hist.slice(-3)); if (mx > 0.35 && mn < mx * 0.45 && w.year - (e.boomAt || -99) > 40) { e.boomAt = w.year; discover(w, 'boom', null, null); } }
}
