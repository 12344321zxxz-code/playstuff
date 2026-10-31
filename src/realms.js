// (Oct 31) Political borders that follow the land. Each realm's writ spreads out from its towns the way its
// tax collectors and soldiers travel: cheap over open plains and along roads, dear over hills, mountains,
// marsh and ice, a little dear across rivers, never over the sea. Every town has a reach (its size, its
// rank, and the realm's arts of rule: roads, writing, bureaucracy, railways, the telegraph); where two
// realms' reach meets, the one that arrives with more to spare holds the land, so ridges and rivers become
// frontiers on their own. Land nobody reaches stays unclaimed.
// This is the political layer only (w.polity: the realm's id per cell, -1 for none). Fields, hunting and
// memory still run on each town's own catchment (w.owner), so the sim's balance does not depend on it.
import { N, W, H, Heap, wx } from './core.js';
import { stepCost } from './travel.js';

const _rem = new Float32Array(N), _hp = new Heap(N * 4);
const DX = [1, -1, 0, 0, 1, 1, -1, -1], DY = [0, 0, 1, -1, 1, -1, 1, -1];

export function reachOf(c, s) {
  const A = c.arts, adm = 1 + (A.roads ? 0.15 : 0) + (A.writing ? 0.05 : 0) + (A.bureaucracy ? 0.15 : 0) + (A.railways ? 0.35 : 0) + (A.telegraph ? 0.2 : 0);
  return Math.min(42, (3 + 2.5 * (s.tier || 1) + Math.sqrt(Math.max(0, s.pop)) / 6) * adm);
}

export function realmMap(w) {
  const R = w.polity || (w.polity = new Int16Array(N)); R.fill(-1); _rem.fill(-1); const hp = _hp; hp.clear();
  const water = w.water;
  for (const s of w.sets) {
    if (s.dead || s.nomad) continue; const c = w.cults[s.cult]; if (!c || !c.alive || c.power) continue;
    const i = s.y * W + s.x, r = reachOf(c, s); if (r <= _rem[i]) continue;
    _rem[i] = r; R[i] = c.id; hp.push(-r, i);
  }
  while (hp.n) {
    const i = hp.pop(), r = -hp.key; if (r < _rem[i] - 1e-6) continue;   /* a stale entry */
    const x = i % W, y = (i / W) | 0, id = R[i];
    for (let d = 0; d < 8; d++) {
      const yy = y + DY[d]; if (yy < 0 || yy >= H) continue; const n = yy * W + wx(x + DX[d]); if (water[n]) continue;
      const nr = r - stepCost(w, i, n, d >= 4); if (nr <= _rem[n]) continue;
      _rem[n] = nr; R[n] = id; if (nr > 0 && hp.n < hp.k.length - 8) hp.push(-nr, n);
    }
  }
  // pockets of unclaimed land wholly inside one realm (a mountain knot, a marsh) are its land too
  const seen = _seen || (_seen = new Uint8Array(N)); seen.fill(0); const q = _q || (_q = new Int32Array(N));
  for (let i0 = 0; i0 < N; i0++) {
    if (seen[i0] || water[i0] || R[i0] >= 0) continue; let qh = 0, qt = 0, one = -2; q[qt++] = i0; seen[i0] = 1;
    while (qh < qt) { const i = q[qh++], x = i % W, y = (i / W) | 0;
      for (let d = 0; d < 4; d++) { const yy = y + DY[d]; if (yy < 0 || yy >= H) { one = -1; continue; } const n = yy * W + wx(x + DX[d]); if (water[n]) continue;
        const r = R[n]; if (r >= 0) { if (one === -2) one = r; else if (one !== r) one = -1; continue; } if (!seen[n]) { seen[n] = 1; q[qt++] = n; } } }
    if (one >= 0 && qt <= 400) for (let k = 0; k < qt; k++) R[q[k]] = one;
  }
  w.polityYear = w.year;
}
let _seen = null, _q = null;
