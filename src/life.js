// Plants, soil and fire. Plants grow toward what climate, water and soil allow; they build soil
// as they go; bare wet slopes lose it. Fire resets a patch and feeds the ground.
import { W, H, N, TAU, clamp, smooth, wx, NB8 } from './core.js';

// Fields that follow the calendar: today's temperature and rain, snow on the ground, how green.
export function seasonFields(w) {
  const { tJan, tJul, rJan, rJul, temp, rain, snow, green, water, ice, mi } = w;
  const f = 0.5 - 0.5 * Math.cos(w.phase * TAU);
  for (let i = 0; i < N; i++) {
    const T = tJan[i] + (tJul[i] - tJan[i]) * f; temp[i] = T;
    if (water[i] === 1) { snow[i] = ice[i] ? 1 : T < -1.5 ? 0.85 : 0; continue; }
    const R = rJan[i] + (rJul[i] - rJan[i]) * f; rain[i] = R;
    let target = ice[i] ? 1 : T > 1.5 ? 0 : T < -3.5 ? 1 : (1.5 - T) * 0.2; if (R < 0.04) target *= 0.3;
    snow[i] += (target - snow[i]) * 0.45;
    const m = mi[i], wet = (0.65 * R + 0.21 * (m > 2 ? 2 : m)) / (0.22 + 0.03 * (T > 0 ? T : 0));
    const a = T < 2 ? 0 : T > 9 ? 1 : (T - 2) / 7, b = wet < 0.1 ? 0 : wet > 0.5 ? 1 : (wet - 0.1) * 2.5;
    green[i] = a * b;
  }
}

export function initLife(w, noise) {
  const { g, t, gCap, tCap, soil, fresh, river, water, h } = w;
  for (let i = 0; i < N; i++) {
    if (water[i] === 1) { g[i] = 0; t[i] = 0; soil[i] = 0.6; continue; }
    soil[i] = clamp(0.62 + 0.5 * noise[i] + (fresh[i] <= 1 && river[i] >= 1 ? 0.45 : 0) - Math.max(0, h[i] - 0.3) * 0.8, 0.15, 1.3);
    g[i] = gCap[i] * 0.9; t[i] = tCap[i] * (noise[i] > 0.38 ? 0.95 : 0.25);
  }
}

// One pass over a quarter of the rows.
export function vegetation(w, part) {
  const { g, t, gCap, tCap, soil, water, ash, farm, urban, rain, h, river, fresh, fireT } = w;
  let rs = w.rs | 0;
  for (let y = part; y < H; y += 4) {
    const row = y * W;
    for (let x = 0; x < W; x++) {
      const i = row + x; if (water[i]) { if (water[i] === 2) { g[i] = 0; t[i] = 0; } continue; }
      if (ash[i] > 0.01) ash[i] *= 0.9;
      if (farm[i] || urban[i]) { t[i] = 0; g[i] = 0.25; continue; }
      const tc = tCap[i]; let tv = t[i], gv = g[i];
      if (tv > 0.02) { tv += 0.09 * tv * (tc - tv); if (tc < 0.04) tv -= 0.035; if (tv < 0) tv = 0; }
      else if (tc > 0.1 && !fireT[i]) {
        rs = (Math.imul(rs, 1664525) + 1013904223) | 0; const r = (rs >>> 8) / 16777216;
        if (r < 0.003 * tc) tv = 0.04;
        else if (r < 0.2 * tc) { const k = (rs >>> 3) & 7, yy = y + NB8[k][1]; if (yy >= 0 && yy < H && t[yy * W + wx(x + NB8[k][0])] > 0.4) tv = 0.04; }
      }
      const cap = gCap[i] * (1 - 0.7 * tv); gv += 0.6 * gv * (cap - gv) + 0.02 * gCap[i]; if (gv < 0) gv = 0; else if (gv > 1) gv = 1;
      t[i] = tv; g[i] = gv;
      // soil
      let s = soil[i]; const cover = gv * 0.5 + tv;
      if (s < 1) s += 0.004 * cover;
      if (cover < 0.3) { const yp = y < H - 1 ? i + W : i, ym = y > 0 ? i - W : i, sl = Math.abs(h[yp] - h[ym]) + Math.abs(h[row + (x + 1) % W] - h[row + (x + W - 1) % W]); if (sl > 0.03) s -= 0.01 * Math.min(2, rain[i]) * Math.min(1, sl * 6); }
      if (fresh[i] <= 1 && s < 1.25) s += 0.006;
      soil[i] = s < 0.1 ? 0.1 : s;
    }
  }
  w.rs = rs;
}

export function ignite(w, i) {
  if (w.water[i] || w.fireT[i] || w.ash[i] > 0.5 || w.snow[i] > 0.5 || (w.magic[i] > 0.55 && w.t[i] > 0.5)) return false;
  w.fireT[i] = 3; w.burning.push(i); return true;
}
export function fireStep(w) {
  const { t, g, green, fireT, ash, soil, water, farm, snow } = w, rnd = w.rnd;
  // lightning in dry country
  for (let k = 0; k < 3; k++) { const i = (rnd() * N) | 0; if (!water[i] && green[i] < 0.35 && t[i] + 0.4 * g[i] > 0.55 && rnd() < 0.25) ignite(w, i); }
  if (!w.burning.length) return;
  const cur = w.burning, next = []; w.burning = next;
  for (const c of cur) {
    if (!fireT[c]) continue; const x = c % W, y = (c / W) | 0; t[c] *= 0.4; g[c] *= 0.3; if (farm[c]) farm[c] = 0;
    for (let k = 0; k < 8; k++) {
      const yy = y + NB8[k][1]; if (yy < 0 || yy >= H) continue; const n = yy * W + wx(x + NB8[k][0]); if (water[n] || fireT[n] || ash[n] > 0.5 || snow[n] > 0.4) continue;
      const fuel = t[n] + 0.4 * g[n] + (farm[n] ? 0.25 : 0); if (rnd() < fuel * (1.05 - green[n]) * 0.34) ignite(w, n);
    }
    if (--fireT[c] > 0) next.push(c); else { ash[c] = 1; soil[c] = Math.min(1.3, soil[c] + 0.12); if (rnd() < 0.35) t[c] = Math.max(t[c], 0.03); }
  }
  w.burnedThisYear = (w.burnedThisYear || 0) + cur.length; if (cur.length) w.burnAt = cur[0];
}
