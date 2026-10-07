// The god's hands. Every tool is a small function over the world's fields; the consequences
// are left to the simulation.
import { W, H, N, DISC, clamp, idx, wx, smooth, wrapDx } from './core.js';
import { ignite } from './life.js';

const fall = (d, r) => { const u = d / (r + 0.5); return u >= 1 ? 0 : (1 - u * u) * (1 - u * u); };

export function sculpt(w, tool, x, y, r, st) {
  const { h } = w, ridge = w._ridge; x = Math.round(x); y = Math.round(y);
  if (y < 1 || y >= H - 1) return false;
  const disc = DISC[Math.min(20, r)];
  if (tool === 'smooth' || tool === 'flatten') {
    const tmp = [];
    for (const o of disc) { const yy = y + o[1]; if (yy < 1 || yy >= H - 1) continue; const i = idx(x + o[0], yy), k = fall(o[2], r);
      if (tool === 'flatten') tmp.push(i, h[i] + (st.level - h[i]) * 0.35 * k);
      else { const a = (h[idx(x + o[0] - 1, yy)] + h[idx(x + o[0] + 1, yy)] + h[i - W] + h[i + W]) * 0.25; tmp.push(i, h[i] + (a - h[i]) * 0.6 * k); } }
    for (let k = 0; k < tmp.length; k += 2) h[tmp[k]] = tmp[k + 1];
  } else {
    for (const o of disc) { const yy = y + o[1]; if (yy < 1 || yy >= H - 1) continue; const i = idx(x + o[0], yy), k = fall(o[2], r); let d = 0;
      if (tool === 'raise') d = 0.012 * k;
      else if (tool === 'lower') d = -0.012 * k;
      else if (tool === 'ridge') d = 0.05 * k * k * (0.5 + 0.8 * ridge[i]);
      else if (tool === 'trench') d = -0.045 * k * k;
      h[i] = clamp(h[i] + d * (st.power || 1), -1, 1.2); }
  }
  w.stamp.land++; w.need.water = true; w.need.climate = true; w.edited = true;
  return true;
}

// A brush that runs water over the land: channels deepen, steep faces slump.
export function erodeBrush(w, x, y, r) {
  const { h, river, down } = w; x = Math.round(x); y = Math.round(y);
  for (const o of DISC[Math.min(20, r)]) { const yy = y + o[1]; if (yy < 1 || yy >= H - 1) continue; const i = idx(x + o[0], yy), k = fall(o[2], r); if (h[i] < w.params.sea) continue;
    const d = down[i]; if (d >= 0) { const drop = h[i] - h[d]; if (drop > 0) h[i] -= Math.min(drop * 0.4, (0.002 + 0.004 * river[i]) * k); }
    const a = (h[idx(x + o[0] - 1, yy)] + h[idx(x + o[0] + 1, yy)] + h[i - W] + h[i + W]) * 0.25; if (h[i] - a > 0.02) h[i] -= (h[i] - a) * 0.15 * k; }
  w.stamp.land++; w.need.water = true; w.need.climate = true; w.edited = true; return true;
}

export function weather(w, tool, x, y, r) {
  const { wetBias, rJan, rJul } = w; x = Math.round(x); y = Math.round(y);
  for (const o of DISC[Math.min(20, r)]) { const yy = y + o[1]; if (yy < 0 || yy >= H) continue; const i = idx(x + o[0], yy), k = fall(o[2], r);
    const old = wetBias[i], nu = clamp(old + (tool === 'rain' ? 0.12 : -0.1) * k, -0.92, 2.5), f = (1 + nu) / (1 + old);
    wetBias[i] = nu; rJan[i] = rJan[i] * f + (tool === 'rain' ? 0.02 * k : 0); rJul[i] = rJul[i] * f + (tool === 'rain' ? 0.02 * k : 0);
    if (tool === 'rain' && w.fireT[i]) w.fireT[i] = 0; }
  w.need.derive = true; w.need.water = true; return true;
}

export function plant(w, x, y, r) {
  const { t, water } = w; let any = false; x = Math.round(x); y = Math.round(y);
  for (const o of DISC[Math.min(20, r)]) { const yy = y + o[1]; if (yy < 0 || yy >= H) continue; const i = idx(x + o[0], yy); if (water[i] || w.farm[i] || w.urban[i]) continue; const k = fall(o[2], r); if (t[i] < 0.55 * k) { t[i] = 0.55 * k; any = true; } }
  return any;
}
export function burn(w, x, y, r) {
  let any = false; x = Math.round(x); y = Math.round(y);
  for (const o of DISC[Math.min(6, r)]) { const yy = y + o[1]; if (yy < 0 || yy >= H) continue; const i = idx(x + o[0], yy); w.ash[i] = 0; if (ignite(w, i)) any = true; }
  return any;
}

export function plateAt(w, x, y) { y = clamp(Math.round(y), 0, H - 1); return w.plates[w.plate[idx(Math.round(x), y)]]; }
