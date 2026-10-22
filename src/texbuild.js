// The map textures as bytes, worked out from the world's fields. No graphics here, so the worker can
// build them off the page's thread and hand the bytes over.
import { W, H, N, clamp } from './core.js';
import { zoneMap } from './zones.js';
const CW = 128, CH = 64;

export const makeTexState = () => ({ zones: new Uint8Array(N), landStamp: -1, zoneStamp: -1, mapStamp: -1, lastW: null, mapW: null });
// fresh buffers every time (they may be handed to another thread); elev and D only when they changed
export function buildTex(w, lens, S, force) {
  const out = { A: new Uint8Array(N * 4), B: new Uint8Array(N * 4), C: new Uint8Array(N * 4), F: new Uint8Array(N * 4), elev: null, D: null };
  if (force || w.stamp.land !== S.landStamp || w !== S.lastW) { S.landStamp = w.stamp.land; out.elev = Float32Array.from(w.h); }
  if (force || w.climateStamp !== S.zoneStamp || w !== S.lastW) { S.zoneStamp = w.climateStamp; zoneMap(w, S.zones); }
  S.lastW = w; const zones = S.zones, bA = out.A, bB = out.B, bC = out.C, bF = out.F;
  const { owner, mi, g, t, water, filled, h, tMean, ocult, farm, urban, fireT, ash, ice, lava, plate, soil, magic, river, road, graze, hunt, spAt, mem, ley, memLock, flora, wildCrop, down } = w;
  for (let i = 0, j = 0; i < N; i++, j += 4) {
      let v = (tMean[i] + 40) * 3.1875; bA[j] = v < 0 ? 0 : v > 255 ? 255 : v; v = mi[i] * 102; bA[j + 1] = v > 255 ? 255 : v; bA[j + 2] = g[i] * 255; bA[j + 3] = t[i] * 255;
      bB[j] = water[i] === 2 ? clamp(20 + (filled[i] - h[i]) * 2500, 20, 255) : 0; bB[j + 1] = river[i] * 60; bB[j + 2] = 0; if (river[i]) { const d = down[i]; if (d >= 0) { let dx = (d % W) - (i % W); if (dx > 1) dx = -1; else if (dx < -1) dx = 1; const dy = ((d / W) | 0) - ((i / W) | 0); bB[j + 2] = (dx + 1) + (dy + 1) * 3 + 1; } } let kd = 0, kv = 0.15; const mb = i * 6; for (let q = 0; q < 6; q++) if (mem[mb + q] > kv) { kv = mem[mb + q]; kd = q + 1; } bB[j + 3] = kd | (ley[i] > 0.15 ? 8 : 0) | (memLock[i] ? 16 : 0) | ((flora[i] === 255 ? 7 : flora[i]) << 5);
      bC[j] = ocult[i] + 1; bC[j + 1] = (farm[i] ? 1 : 0) | (urban[i] ? 2 : 0) | (fireT[i] ? 4 : 0) | (ash[i] > 0.3 ? 8 : 0) | (ice[i] ? 16 : 0) | (lava[i] ? 64 : 0) | (road[i] ? 32 : 0) | (w.wall && w.wall[i] ? 128 : 0); bC[j + 2] = plate[i] | (w.canal && w.canal[i] === 2 ? 128 : 0) | (road[i] && owner[i] >= 0 && w.sets[owner[i]] && w.cults[w.sets[owner[i]].cult].tech >= 6 ? 64 : 0);
      v = lens === 12 ? wildCrop[i] * 255 : lens === 3 ? soil[i] * 170 : magic[i] * 255; bC[j + 3] = v > 255 ? 255 : v;
      v = graze[i] * 127; bF[j] = v > 255 ? 255 : v; bF[j + 1] = hunt[i] * 255; bF[j + 2] = spAt[i]; bF[j + 3] = zones[i] | (w.fallout && w.fallout[i] > 0.12 ? Math.min(7, 1 + Math.round((w.fallout[i] - 0.12) * 5)) << 5 : 0);
    }
  if (w.realm && (force || w.mapStamp !== S.mapStamp || w !== S.mapW)) { S.mapStamp = w.mapStamp; S.mapW = w; const D = (out.D = new Uint8Array(CW * CH * 2)); for (let i = 0; i < CW * CH; i++) { D[i * 2] = w.realm[i]; D[i * 2 + 1] = w.faithMap[i]; } }
  return out;
}
