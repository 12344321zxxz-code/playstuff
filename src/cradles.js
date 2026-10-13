// Cradles: where each wild plant and beast lives at the start. Not "everywhere on a continent" but
// one or two home regions that suit it, as wheat and barley had the Fertile Crescent and maize the
// Mexican highlands. From there wild ranges creep outward slowly, only through country that suits
// them, so deserts, mountains and seas hold them back; people carry them faster (settlers, trade,
// ships), and every import starts as a small patch around the place it landed.
// Masks are per cell, one bit per kind (Uint8 for the 7 plants, Uint16 for the 16 beasts).
import { W, H, N, wx } from './core.js';

const R0 = 13;   // cradle radius in cells

// count kinds; good(k, i) says a cell suits kind k well enough to be a home; opt.skip(k) = chance a
// kind has no cradle at all; opt.atLeast = how many kinds every big landmass should start with.
export function dealCradles(w, count, good, opt) {
  const rnd = w.rnd, mask = count > 8 ? new Uint16Array(N) : new Uint8Array(N), sample = [], RR = opt.r || R0;
  for (let i = 0; i < N; i += 7) if (!w.water[i] && !w.ice[i]) sample.push(i);
  const grow = (k, seed) => {   // flood out from the seed through suitable land, up to R0 cells away
    const bit = 1 << k, sx = seed % W, sy = (seed / W) | 0, q = [seed]; mask[seed] |= bit; let n = 1;
    for (let h = 0; h < q.length; h++) { const i = q[h], x = i % W, y = (i / W) | 0;
      for (const j of [y * W + wx(x + 1), y * W + wx(x - 1), y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) {
        if (j < 0 || mask[j] & bit || w.water[j] || !(opt.fill || good)(k, j)) continue; let dx = Math.abs((j % W) - sx); if (dx > W / 2) dx = W - dx; const dy = ((j / W) | 0) - sy;
        if (dx * dx + dy * dy > RR * RR * (0.6 + 0.4 * rnd())) continue; mask[j] |= bit; q.push(j); n++; } }
    return n;
  };
  const homes = [];
  for (let k = 0; k < count; k++) {
    if (opt.skip && rnd() < opt.skip(k)) continue;
    const cand = sample.filter((i) => good(k, i)); if (cand.length < 8) continue;
    const n = rnd() < 0.6 ? 1 : 2; let first = -1;
    for (let c = 0; c < n; c++) {
      let seed = -1;
      for (let t = 0; t < 30; t++) { const i = cand[(rnd() * cand.length) | 0]; if (first >= 0 && w.mass[i] === w.mass[first] && t < 25) continue; seed = i; break; }
      if (seed < 0) break; if (first < 0) first = seed; grow(k, seed); homes.push([k, seed]);
    }
  }
  // every big landmass starts with a few kinds of its own, if anything suits it at all
  if (opt.atLeast) {
    const masses = {}; for (const i of sample) { const m = w.mass[i]; if ((w.massSize[m] || 0) >= 350) (masses[m] || (masses[m] = [])).push(i); }
    for (const m in masses) { const cells = masses[m]; let have = 0; for (let k = 0; k < count; k++) if (cells.some((i) => mask[i] & (1 << k))) have++;
      for (let t = 0; have < opt.atLeast && t < count * 3; t++) { const k = (rnd() * count) | 0; if (cells.some((i) => mask[i] & (1 << k))) continue; const ok = cells.filter((i) => good(k, i)); if (ok.length < 6) continue; grow(k, ok[(rnd() * ok.length) | 0]); have++; } }
  }
  return { mask, kinds: kindsByMass(w, mask, count) };
}

// which kinds live anywhere on each landmass (what older code reads as massKinds / floraKinds)
export function kindsByMass(w, mask, count) {
  const out = {}; for (let i = 0; i < N; i += 3) { const v = mask[i]; if (!v || w.water[i]) continue; const m = w.mass[i], o = out[m] || (out[m] = []); for (let k = 0; k < count; k++) if (v & (1 << k) && !o.includes(k)) o.push(k); }
  return out;
}

// an import or a planting: a small patch around (x, y) where the kind could live
export function patch(w, mask, k, x, y, r, ok) {
  const bit = 1 << k; let n = 0; x = Math.round(x); y = Math.round(y);
  for (let dy = -r; dy <= r; dy++) { const yy = y + dy; if (yy < 1 || yy >= H - 1) continue; for (let dx = -r; dx <= r; dx++) { if (dx * dx + dy * dy > r * r) continue; const j = yy * W + wx(x + dx); if (w.water[j] || mask[j] & bit || !ok(k, j)) continue; mask[j] |= bit; n++; } }
  return n;
}

// slow natural spread: each year one row in `every` is visited; a kind steps into a neighbouring
// cell that suits it with probability p. Water, ice and unsuitable country stop it.
export function spread(w, mask, count, ok, p, every) {
  const rnd = w.rnd, y0 = w.year % every; let changed = 0;
  for (let y = 1 + y0; y < H - 1; y += every) for (let i = y * W, e = i + W; i < e; i++) {
    const v = mask[i]; if (!v) continue;
    for (let k = 0; k < count; k++) { if (!(v & (1 << k)) || rnd() > p) continue; const r = rnd(), x = i - y * W, j = r < 0.25 ? y * W + wx(x + 1) : r < 0.5 ? y * W + wx(x - 1) : r < 0.75 ? i - W : i + W;
      if (w.water[j] || w.ice[j] || mask[j] & (1 << k) || !ok(k, j)) continue; mask[j] |= 1 << k; changed++; }
  }
  return changed;
}
export const has = (mask, k, i) => (mask[i] >> k) & 1;
