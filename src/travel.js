// Travel (slice 15, movement step 1): what it costs to cross each cell, the cheapest ways between
// neighbouring towns, which of those ways traffic has worn into tracks, and the sea lanes the winds
// make. This step only draws; no people decides anything by it yet (that is step 2).
//
//   cell cost: 1 for flat open ground, more for slopes, woods, river crossings, high and icy land,
//     four times as much inside a fey court; a state road costs a third.
//   town graph: each settled town is joined to its three nearest neighbours (any realm) within a
//     day's march or so; rebuilt every two years, the paths themselves computed a few per tick and
//     kept until the land changes or 30 years pass (a step-sliced job cannot be saved, so the queue
//     lives outside the world and simply refills after a load).
//   grades: 0 a way nobody uses, 1 a track worn by traders, 2 a road the state built, 3 a railway.
//   sea lanes: wet trade routes follow the cheapest way over the coarse climate grid, where sailing
//     with the wind and the current is cheap and beating against them dear.
// Nothing here draws a random number, so the simulation is the same with or without it.
import { W, H, N, CW, CH, CS, wx, wrapDx, clamp, Heap } from './core.js';
import { coarse } from './climate.js';
import { near } from './people.js';

const K = 3, R = 22, SEA_EVERY = 20;
const _d = new Float32Array(N), _st = new Int32Array(N), _pv = new Int32Array(N), _hp = new Heap(N); let _s = 0;
// the price of stepping onto cell n from cell c
export function stepCost(w, c, n, diag) {
  const { h, t, river, road, ice } = w, sea = w.params.sea;
  let k = 1 + Math.abs(h[n] - h[c]) * 55 + t[n] * 1.3 + (river[n] && !road[n] ? 1.5 : 0) + (ice[n] ? 3 : 0) + (h[n] - sea > 0.35 ? 2 : 0);
  if (w.courtOf && w.courtOf[n]) k *= 4;
  if (road[n]) k *= 0.35;
  return diag ? k * 1.42 : k;
}
// cheapest land path between two cells (A*), or null; budget in cells expanded
export function landPath(w, src, dst, budget) {
  const water = w.water; _s++; _hp.clear(); _d[src] = 0; _st[src] = _s; _pv[src] = -1; const tx = dst % W, ty = (dst / W) | 0;
  _hp.push(Math.hypot(wrapDx(src % W - tx), ((src / W) | 0) - ty) * 0.35, src); budget = budget || 6000;
  while (_hp.n && budget-- > 0) {
    const c = _hp.pop(); if (c === dst) { let n = 0; for (let k = c; k >= 0; k = _pv[k]) n++; const p = new Int32Array(n); for (let k = c, j = n - 1; k >= 0; k = _pv[k]) p[j--] = k; return { path: p, cost: _d[c] }; }
    const dc = _d[c], x = c % W, y = (c / W) | 0;
    for (let d = 0; d < 8; d++) { const dy = d < 3 ? -1 : d < 5 ? 0 : 1, dx = [-1, 0, 1, -1, 1, -1, 0, 1][d], yy = y + dy; if (yy < 1 || yy >= H - 1) continue; const n = yy * W + wx(x + dx); if (water[n] && n !== dst) continue;
      const nd = dc + stepCost(w, c, n, dx && dy); if (_st[n] !== _s || nd < _d[n]) { _st[n] = _s; _d[n] = nd; _pv[n] = c; _hp.push(nd + Math.hypot(wrapDx(x + dx - tx), yy - ty) * 0.35, n); } }
  }
  return null;
}

// the graph lives outside the world (rebuilt from it), except the wear on each way, which is saved
const T = { chains: new Map(), edges: new Map(), adj: new Map(), q: [], stamp: -1, w: null, routeWays: new Map(), lanes: new Map(), laneYear: -99 };
export const travelState = T;
const keyOf = (a, b) => (a < b ? a + '-' + b : b + '-' + a);

function rebuild(w) {
  const byId = new Map(), keep = new Set(); for (const s of w.sets) if (!s.dead && !s.nomad && !w.cults[s.cult].power) byId.set(s.id, s);
  for (const s of byId.values()) {
    const nb = []; near(w, s.x, s.y, R, s, true, (u, q) => { if (byId.has(u.id)) nb.push([q, u]); }); nb.sort((a, b) => a[0] - b[0]);
    for (let k = 0; k < Math.min(K, nb.length); k++) { const u = nb[k][1], key = keyOf(s.id, u.id); keep.add(key); if (!T.edges.has(key)) { const e = { key, a: s.id, b: u.id, path: null, cost: Math.sqrt(nb[k][0]) * 2, tried: -999, grade: 0 }; T.edges.set(key, e); } }
  }
  for (const [key, e] of T.edges) if (!keep.has(key)) T.edges.delete(key);
  const landChanged = T.stamp !== w.stamp.land; T.stamp = w.stamp.land;
  T.adj = new Map(); T.q = [];
  for (const e of T.edges.values()) {
    const A = byId.get(e.a), B = byId.get(e.b); e.A = A; e.B = B;
    (T.adj.get(e.a) || T.adj.set(e.a, []).get(e.a)).push(e); (T.adj.get(e.b) || T.adj.set(e.b, []).get(e.b)).push(e);
    const stale = !e.path ? w.year - e.tried > 30 : w.year - e.tried > 30 || (landChanged && e.path.some((i) => w.water[i] === 1 || w.lava[i]));   /* drowned or buried ways are found again */
    if (stale) T.q.push(e);
  }
  T.q.sort((p, q) => (p.path ? 1 : 0) - (q.path ? 1 : 0));   /* ways never found first, then the stale ones */
}
// the trade on each route walks the cheapest chain of ways between its towns (land routes) or its
// sea lane (wet routes); what walks a way wears it into a track
function flows(w) {
  const wear = w.tracks || (w.tracks = new Map()); const use = new Map();
  T.routeWays = new Map();
  for (const [rk, r] of w.routes) {
    if (r.wet || r.n < 0.5 || r.a.dead || r.b.dead) continue; let C = T.chains.get(rk);
    if (!C || w.year - C.year >= 10 || (C.chain && C.chain.some((e) => !T.edges.has(e.key)))) { C = { year: w.year, chain: graphPath(r.a.id, r.b.id) }; T.chains.set(rk, C); }
    const chain = C.chain; if (!chain) continue; T.routeWays.set(rk, chain);
    for (const e of chain) use.set(e.key, (use.get(e.key) || 0) + r.n);
  }
  for (const e of T.edges.values()) { const f = use.get(e.key) || 0, old = wear.get(e.key) || 0, v = old + (f - old) * 0.15; if (v > 0.05) wear.set(e.key, +v.toFixed(3)); else wear.delete(e.key); }
  for (const k of [...wear.keys()]) if (!T.edges.has(k)) wear.delete(k);
  for (const k of [...T.chains.keys()]) if (!w.routes.has(k)) T.chains.delete(k);
  // grades
  for (const e of T.edges.values()) {
    e.grade = 0; if (!e.path) continue; let rd = 0; for (const i of e.path) if (w.road[i]) rd++;
    if (rd >= e.path.length * 0.6) { const ca = e.A && w.cults[e.A.cult], cb = e.B && w.cults[e.B.cult]; e.grade = ca && cb && ca.arts.railways && cb.arts.railways ? 3 : 2; }
    else if ((wear.get(e.key) || 0) > 1.2) e.grade = 1;
  }
}
// Dijkstra over the town graph (a few hundred towns), with a heap
const _gh = new Heap(1 << 15), _gdist = new Map(), _gprev = new Map();
function graphPath(a, b) {
  if (a === b || !T.adj.has(a) || !T.adj.has(b)) return null; _gdist.clear(); _gprev.clear(); _gh.clear(); _gdist.set(a, 0); _gh.push(0, a); let n = 0;
  while (_gh.n) {
    const u = _gh.pop(), d = _gh.key; if (u === b) { const out = []; for (let v = b; v !== a; ) { const e = _gprev.get(v); out.push(e); v = e.a === v ? e.b : e.a; } return out; }
    if (d > _gdist.get(u) || ++n > 2500 || _gh.n > 30000) { if (n > 2500 || _gh.n > 30000) return null; continue; }
    for (const e of T.adj.get(u) || []) { const v = e.a === u ? e.b : e.a, nd = d + e.cost; const old = _gdist.get(v); if (old === undefined || nd < old) { _gdist.set(v, nd); _gprev.set(v, e); _gh.push(nd, v); } }
  }
  return null;
}

// sea lanes: A* on a half-resolution grid of open sea, cheap with the wind and the current, dear against them
const HW = W / 2, HH = H / 2, HN = HW * HH, _cd = new Float32Array(HN), _cs = new Int32Array(HN), _cp = new Int32Array(HN), _ch = new Heap(HN), _wet = new Uint8Array(HN); let _cst = 0, _wetStamp = -1;
function laneCost(hx, hy, dx, dy) {
  const i = clamp((hy * 2 / CS) | 0, 0, CH - 1) * CW + (((hx * 2 / CS) | 0) % CW), o0 = coarse.out[0], o1 = coarse.out[1];
  const u = (o0.u[i] + o1.u[i]) * 0.5 + (o0.cu[i] + o1.cu[i]) * 0.25, v = (o0.v[i] + o1.v[i]) * 0.5 + (o0.cv[i] + o1.cv[i]) * 0.25, l = Math.hypot(dx, dy), m = Math.hypot(u, v), s = Math.min(1, m * 1.6);
  const along = m > 1e-4 ? (u * dx + v * dy) / (l * m) : 0;
  return l * (0.25 + 1.25 * Math.exp(-1.6 * along * s));   /* running before a steady wind about 0.6, across it 1.5, beating against it up to 4.7 */
}
function wetMap(w) {
  if (_wetStamp === w.stamp.land) return; _wetStamp = w.stamp.land;
  for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) { const i = y * 2 * W + x * 2; _wet[y * HW + x] = w.water[i] === 1 || w.water[i + 1] === 1 || w.water[i + W] === 1 || w.water[i + W + 1] === 1 ? 1 : 0; }
  // keep only the world ocean (the largest connected water): closed seas have no lanes to anywhere
  _cs.fill(0); let best = 0, bestK = 0, k = 0; const q = _cp;
  for (let s = 0; s < HN; s++) { if (!_wet[s] || _cs[s]) continue; k++; let n = 0, hd = 0; q[n++] = s; _cs[s] = k; while (hd < n) { const c = q[hd++], x = c % HW, y = (c / HW) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const yy = y + dy; if (yy < 0 || yy >= HH) continue; const m = yy * HW + (x + dx + HW) % HW; if (_wet[m] && !_cs[m]) { _cs[m] = k; q[n++] = m; } } } if (n > best) { best = n; bestK = k; } }
  for (let s = 0; s < HN; s++) if (_wet[s] && _cs[s] !== bestK) _wet[s] = 0; _cs.fill(0); _cst = 0;
}
// returns fine-grid cell indices along the lane, or null
export function seaLane(w, ax, ay, bx, by) {
  wetMap(w);
  const snap = (x, y) => { const cx = (x / 2) | 0, cy = clamp((y / 2) | 0, 0, HH - 1); let best = -1, bd = 999; for (let dy = -9; dy <= 9; dy++) for (let dx = -9; dx <= 9; dx++) { const yy = cy + dy; if (yy < 0 || yy >= HH) continue; const i = yy * HW + ((cx + dx + HW) % HW); if (_wet[i] && dx * dx + dy * dy < bd) { bd = dx * dx + dy * dy; best = i; } } return best; };
  const src = snap(ax, ay), dst = snap(bx, by); if (src < 0 || dst < 0) return null;
  _cst++; _ch.clear(); _cd[src] = 0; _cs[src] = _cst; _cp[src] = -1; const tx = dst % HW, ty = (dst / HW) | 0; _ch.push(0, src); let budget = 25000;
  const hdx = (a, b) => { let d = a - b; if (d > HW / 2) d -= HW; else if (d < -HW / 2) d += HW; return d; };
  while (_ch.n && budget-- > 0) {
    const c = _ch.pop(); if (c === dst) { const p = []; for (let k = c; k >= 0; k = _cp[k]) p.push(((k / HW) | 0) * 2 * W + (k % HW) * 2); return p.reverse(); }
    const x = c % HW, y = (c / HW) | 0, dc = _cd[c];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const yy = y + dy; if (yy < 0 || yy >= HH) continue; const n = yy * HW + (x + dx + HW) % HW; if (!_wet[n]) continue;
      const nd = dc + laneCost(x, y, dx, dy); if (_cs[n] !== _cst || nd < _cd[n]) { _cs[n] = _cst; _cd[n] = nd; _cp[n] = c; _ch.push(nd + Math.hypot(hdx(x + dx, tx), yy - ty) * 0.9, n);   /* a greedy heuristic: near-cheapest lanes, found fast */ } }
  }
  return null;
}
function lanes(w) {
  const seen = new Set();
  let budget = 3;   /* a few lanes per rebuild, busiest routes first, so no year is heavy */
  const want = []; for (const [rk, r] of w.routes) { if (!r.wet || r.a.dead || r.b.dead) continue; seen.add(rk); const L = T.lanes.get(rk); if (!L || w.year - L.year >= SEA_EVERY) want.push([r.n, rk, r]); }
  want.sort((a, b) => b[0] - a[0]);
  for (const [, rk, r] of want) { if (budget-- <= 0) break; T.lanes.set(rk, { year: w.year, path: seaLane(w, r.a.x, r.a.y, r.b.x, r.b.y) }); }
  for (const k of [...T.lanes.keys()]) if (!seen.has(k)) T.lanes.delete(k);
}

export function travelTick(w) {
  if (T.w !== w) { T.w = w; T.edges = new Map(); T.adj = new Map(); T.q = []; T.stamp = -1; T.lanes = new Map(); T.routeWays = new Map(); T.chains = new Map(); T.last = -99; }
  if (w.year - T.last >= 2 && (w.tickN % 8) === 6) { T.last = w.year; rebuild(w); flows(w); lanes(w); }
  // a few paths every tick
  for (let n = 0; n < 4 && T.q.length; n++) { const e = T.q.shift(); if (!e.A || !e.B || e.A.dead || e.B.dead) continue; e.tried = w.year;
    const r = landPath(w, e.A.y * W + e.A.x, e.B.y * W + e.B.x, 5000); if (r) { e.path = r.path; e.cost = r.cost; } else { e.path = null; e.cost = Math.hypot(wrapDx(e.A.x - e.B.x), e.A.y - e.B.y) * 6; } }
}
