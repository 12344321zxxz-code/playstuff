// (Oct 31) Political borders that follow the land. Each realm's writ spreads out from its towns the way its
// tax collectors and soldiers travel: cheap over open plains and along roads, dear over hills, mountains,
// marsh and ice, a little dear across rivers, never over the sea. Every town has a reach (its size, its
// rank, and the realm's arts of rule: roads, writing, bureaucracy, railways, the telegraph); where two
// realms' reach meets, the one that arrives with more to spare holds the land, so ridges and rivers become
// frontiers on their own. Land nobody reaches stays unclaimed.
// This is the political layer only (w.polity: the realm's id per cell, -1 for none). Fields, hunting and
// memory still run on each town's own catchment (w.owner), so the sim's balance does not depend on it.
import { N, W, H, Heap, wx, wrapDx } from './core.js';
import { stepCost } from './travel.js';
import { COLORS, NCOL, colDist, TOO_CLOSE, bestSlot } from './colors.js';

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
  recolour(w, R); survey(w, R);
  w.polityYear = w.year;
}
// (Oct 31) neighbours that look alike, or share a colour, are told apart: the smaller one takes the free colour
// that stands out most from everything it borders
function recolour(w, R) {
  const adj = new Map(), key = (a, b) => (a < b ? a * 65536 + b : b * 65536 + a);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x, a = R[i]; if (a < 0) continue;
    const r = R[y * W + wx(x + 1)]; if (r >= 0 && r !== a) adj.set(key(a, r), 1); if (y + 1 < H) { const d = R[i + W]; if (d >= 0 && d !== a) adj.set(key(a, d), 1); } }
  const nb = new Map(); for (const k of adj.keys()) { const a = Math.floor(k / 65536), b = k % 65536; (nb.get(a) || nb.set(a, []).get(a)).push(b); (nb.get(b) || nb.set(b, []).get(b)).push(a); }
  const used = new Uint8Array(NCOL), owner = new Map(); let seedK = (w.year * 0.37 + 0.11) % 1; const crnd = () => (seedK = (seedK * 9301 + 0.4927) % 1);
  for (const c of w.cults) if (c.alive) { if (owner.has(c.slot)) { const o = owner.get(c.slot); const small = o.count < c.count ? o : c; small._dup = true; } else owner.set(c.slot, c); used[c.slot] = 1; }
  let n = 0;
  for (const [id, list] of nb) { const c = w.cults[id]; if (!c || !c.alive || c.power) continue;
    let bad = !!c._dup; if (!bad) for (const o of list) { const d = w.cults[o]; if (d && d.alive && d.count >= c.count && (d.slot === c.slot || colDist(c.slot, d.slot) < TOO_CLOSE)) { bad = true; break; } }
    if (!bad || n >= 6) continue; c._dup = false;
    const avoid = list.map((o) => w.cults[o]).filter((d) => d && d.alive).map((d) => d.slot); const s = bestSlot(used, avoid, crnd); if (s < 0) continue;
    used[s] = 1; c.slot = s; c.color = COLORS[s]; n++; }
  for (const c of w.cults) c._dup = false;
}
let _seen = null, _q = null;
// (Oct 31) for the political map: each realm's land (cells), where its name goes (the middle of its largest
// stretch of land, wrapping east-west), and whom it borders and along how long a frontier
function survey(w, R) {
  const n = new Map(), sx = new Map(), sy = new Map(), sc = new Map(), nb = new Map();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x, a = R[i]; if (a < 0) continue; n.set(a, (n.get(a) || 0) + 1); const t = (x / W) * 6.2832; sx.set(a, (sx.get(a) || 0) + Math.cos(t)); sc.set(a, (sc.get(a) || 0) + Math.sin(t)); sy.set(a, (sy.get(a) || 0) + y);
    const r = R[y * W + wx(x + 1)], d = y + 1 < H ? R[i + W] : -1; for (const b of [r, d]) if (b >= 0 && b !== a) { const A = nb.get(a) || nb.set(a, {}).get(a), B = nb.get(b) || nb.set(b, {}).get(b); A[b] = (A[b] || 0) + 1; B[a] = (B[a] || 0) + 1; } }
  for (const c of w.cults) { if (!c.alive) { c.terr = null; continue; } const k = n.get(c.id); if (!k) { c.terr = null; continue; }
    let ang = Math.atan2(sc.get(c.id), sx.get(c.id)); if (ang < 0) ang += 6.2832; const tx = Math.round((ang / 6.2832) * W) % W, ty = Math.round(sy.get(c.id) / k);
    let best = -1, bd = 1e9; for (const s of w.sets) if (!s.dead && !s.nomad && s.cult === c.id) { const d = Math.hypot(wrapDx(s.x - tx), s.y - ty); if (d < bd) { bd = d; best = s; } }   /* keep the name on its own land */
    const at = R[ty * W + tx] === c.id || !best ? [tx, ty] : [Math.round(tx + wrapDx(best.x - tx) * 0.6 + W) % W, Math.round(ty + (best.y - ty) * 0.6)];
    c.terr = { n: k, x: at[0], y: at[1], nb: nb.get(c.id) || {} }; }
}
