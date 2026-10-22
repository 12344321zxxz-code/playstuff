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
// Slice 16 (movement step 2): trade now goes by these ways. A carrier can only go so far before a
// trip stops paying (porters least; pack animals, carts on roads, ships, railways and lorries more),
// spent faster over rough country, and a trip also breaks where the language family changes and
// where the carrier does not know the next people. Where it breaks, the goods change hands: the
// leg ends at the best market in the last part of the range, so relays gather in front of deserts,
// passes and straits. Everything here lives in the world (w.travel) and is saved, because trade
// decides by it now.
import { W, H, N, CW, CH, CS, wx, wrapDx, clamp, Heap } from './core.js';
import { coarse } from './climate.js';
import { near } from './people.js';
import { familyOf } from './tongues.js';

const K = 3, R = 22, SEA_EVERY = 150;
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
export function landPath(w, src, dst, budget, greedy) {
  const hw = greedy ? 1.2 : 0.35;   /* a greedier search for walkers off the town graph: near-cheapest, found fast */
  const water = w.water; _s++; _hp.clear(); _d[src] = 0; _st[src] = _s; _pv[src] = -1; const tx = dst % W, ty = (dst / W) | 0;
  _hp.push(Math.hypot(wrapDx(src % W - tx), ((src / W) | 0) - ty) * hw, src); budget = budget || 6000;
  while (_hp.n && budget-- > 0) {
    const c = _hp.pop(); if (c === dst) { let n = 0; for (let k = c; k >= 0; k = _pv[k]) n++; const p = new Int32Array(n); for (let k = c, j = n - 1; k >= 0; k = _pv[k]) p[j--] = k; return { path: p, cost: _d[c] }; }
    const dc = _d[c], x = c % W, y = (c / W) | 0;
    for (let d = 0; d < 8; d++) { const dy = d < 3 ? -1 : d < 5 ? 0 : 1, dx = [-1, 0, 1, -1, 1, -1, 0, 1][d], yy = y + dy; if (yy < 1 || yy >= H - 1) continue; const n = yy * W + wx(x + dx); if (water[n] && n !== dst) continue;
      const nd = dc + stepCost(w, c, n, dx && dy); if (_st[n] !== _s || nd < _d[n]) { _st[n] = _s; _d[n] = nd; _pv[n] = c; _hp.push(nd + Math.hypot(wrapDx(x + dx - tx), yy - ty) * hw, n); } }
  }
  return null;
}

// the graph lives in the world (w.travel) and is saved; adjacency is derived
let T = null;
export const travelOf = (w) => w.travel;
function ensure(w) {
  if (!w.travel) w.travel = { edges: new Map(), q: [], stamp: -1, last: -99, lanes: new Map(), chains: new Map(), pairs: new Map(), relayOf: new Map() };
  T = w.travel; if (!T.pairs) T.pairs = new Map(); if (!T.relayOf) T.relayOf = new Map();
  if (T._adjFor !== T) { T._adjFor = T; T.adj = new Map(); T.routeWays = T.routeWays || new Map(); for (const e of T.edges.values()) { (T.adj.get(e.a) || T.adj.set(e.a, []).get(e.a)).push(e); (T.adj.get(e.b) || T.adj.set(e.b, []).get(e.b)).push(e); } }
  if (_wetFor !== w) { _wetFor = w; _wetStamp = -1; _lcFor = -1; }
  return T;
}
let _wetFor = null;
const keyOf = (a, b) => (a < b ? a + '-' + b : b + '-' + a);

function rebuild(w) {
  const byId = new Map(), keep = new Set(); for (const s of w.sets) if (!s.dead && !s.nomad && !w.cults[s.cult].power) byId.set(s.id, s);
  for (const s of byId.values()) {
    const nb = []; near(w, s.x, s.y, R, s, true, (u, q) => { if (byId.has(u.id)) nb.push([q, u]); }); nb.sort((a, b) => a[0] - b[0]);
    for (let k = 0; k < Math.min(K, nb.length); k++) { const u = nb[k][1], key = keyOf(s.id, u.id); keep.add(key); if (!T.edges.has(key)) { const e = { key, a: s.id, b: u.id, path: null, cost: Math.sqrt(nb[k][0]) * 2, tried: -999, grade: 0 }; T.edges.set(key, e); } }
  }
  for (const [key, e] of T.edges) if (!keep.has(key)) T.edges.delete(key);
  const landChanged = T.stamp !== w.stamp.land; T.stamp = w.stamp.land;
  T.adj = new Map(); T._adjFor = T; T.q = [];
  for (const e of T.edges.values()) {
    const A = byId.get(e.a), B = byId.get(e.b); e.A = A; e.B = B;
    (T.adj.get(e.a) || T.adj.set(e.a, []).get(e.a)).push(e); (T.adj.get(e.b) || T.adj.set(e.b, []).get(e.b)).push(e);
    const stale = !e.path ? w.year - e.tried > 30 : w.year - e.tried > 30 || (landChanged && e.path.some((i) => w.water[i] === 1 || w.lava[i]));   /* drowned or buried ways are found again */
    if (stale) T.q.push(e.key);
  }
  T.q.sort((p, q) => (T.edges.get(p).path ? 1 : 0) - (T.edges.get(q).path ? 1 : 0));   /* ways never found first, then the stale ones */
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
  // danger: a way through the land of the dead is closed; a way between realms at war costs three times as much
  for (const e of T.edges.values()) {
    e.block = false; e.war = false; if (!e.A || !e.B) continue; const ca = w.cults[e.A.cult], cb = w.cults[e.B.cult];
    e.war = !!((ca.war && ca.war.foe === cb.id) || (cb.war && cb.war.foe === ca.id));
    e.fo = 0; if (e.path && w.fallout) { let mx = 0, sm = 0; for (const i of e.path) { const v = w.fallout[i]; sm += v; if (v > mx) mx = v; } if (mx > 1) e.block = true; else e.fo = +(4 * sm / e.path.length + 2 * mx).toFixed(2); }   /* the worst fallout closes a way; lighter fallout makes it dearer */
    if (e.path && w.anyPower !== false) for (let k = 0; k < e.path.length && !e.block; k += 4) { const i = e.path[k]; near(w, i % W, (i / W) | 0, 5, null, true, (s) => { if (w.cults[s.cult].power === 'dead') e.block = true; }); }
  }
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
    const u = _gh.pop(), d = _gdist.get(u); if (_gh.key > d + 1e-3) continue; if (u === b) { const out = []; for (let v = b; v !== a; ) { const e = _gprev.get(v); if (!e || out.length > 600) return null; out.push(e); v = e.a === v ? e.b : e.a; } return out; }
    if (++n > 2500 || _gh.n > 30000) return null;
    for (const e of T.adj.get(u) || []) { const v = e.a === u ? e.b : e.a; if (e.block || v === a) continue; const nd = d + Math.max(0.5, e.cost) * (e.war ? 3 : 1) * (1 + (e.fo || 0)); const old = _gdist.get(v); if (old === undefined || nd < old - 1e-6) {   /* exact distances (not the heap's rounded keys) and no free edges, or the chain can loop */ _gdist.set(v, nd); _gprev.set(v, e); _gh.push(nd, v); } }
  }
  return null;
}

// sea lanes: A* on a half-resolution grid of open sea, cheap with the wind and the current, dear against them
const HW = W / 2, HH = H / 2, HN = HW * HH, _cd = new Float32Array(HN), _cs = new Int32Array(HN), _cp = new Int32Array(HN), _ch = new Heap(HN), _wet = new Uint8Array(HN), _comp = new Int32Array(HN); let _cst = 0, _wetStamp = -1;
// the price of each of the eight moves from each half-cell, worked out once per climate
const DIRS = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]], _lc = new Float32Array(HN * 8); let _lcFor = -1;
function laneCosts(w) {
  const st = w.climateStamp == null ? 0 : w.climateStamp; if (_lcFor === st) return; _lcFor = st; const o0 = coarse.out[0], o1 = coarse.out[1];
  for (let hy = 0; hy < HH; hy++) for (let hx = 0; hx < HW; hx++) {
    const i = clamp((hy * 2 / CS) | 0, 0, CH - 1) * CW + (((hx * 2 / CS) | 0) % CW), u = (o0.u[i] + o1.u[i]) * 0.5 + (o0.cu[i] + o1.cu[i]) * 0.25, v = (o0.v[i] + o1.v[i]) * 0.5 + (o0.cv[i] + o1.cv[i]) * 0.25, m = Math.hypot(u, v), s = Math.min(1, m * 1.6), b = (hy * HW + hx) * 8;
    for (let d = 0; d < 8; d++) { const dx = DIRS[d][0], dy = DIRS[d][1], l = Math.hypot(dx, dy), along = m > 1e-4 ? (u * dx + v * dy) / (l * m) : 0; _lc[b + d] = l * (0.25 + 1.25 * Math.exp(-1.6 * along * s)); }   /* running before a steady wind about 0.6, across it 1.5, beating against it up to 4.7 */
  }
}
function wetMap(w) {
  const key = w.stamp.land * 1000 + (w.climateStamp || 0) % 1000; if (_wetStamp === key) return; _wetStamp = key;
  for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) { const i = y * 2 * W + x * 2; const sea = (j) => w.water[j] === 1 && !w.ice[j]; _wet[y * HW + x] = sea(i) + sea(i + 1) + sea(i + W) + sea(i + W + 1) >= 2 ? 1 : 0; }   /* ships do not sail through sea ice */   /* mostly sea: a strip of land one cell wide still stops a ship */
  // every connected body of water gets its own number: a lane runs only within one sea
  _comp.fill(0); let k = 0; const q = _cp;
  for (let s = 0; s < HN; s++) { if (!_wet[s] || _comp[s]) continue; k++; let n = 0, hd = 0; q[n++] = s; _comp[s] = k; while (hd < n) { const c = q[hd++], x = c % HW, y = (c / HW) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const yy = y + dy; if (yy < 0 || yy >= HH) continue; const m = yy * HW + (x + dx + HW) % HW; if (_wet[m] && !_comp[m]) { _comp[m] = k; q[n++] = m; } } } }
  _cs.fill(0); _cst = 0;
}
// One map per destination (slice 17 fix): a cheapest-way field over its sea, worked out once and kept
// (saved, so a loaded world sails the same lanes). From any water of that sea, a ship follows the
// field to the port. Lanes are listed as fine cells chosen on open water.
const fineOf = (w, c) => { const i = ((c / HW) | 0) * 2 * W + (c % HW) * 2; for (const j of [i, i + 1, i + W, i + W + 1]) if (w.water[j] === 1 && !w.ice[j]) return j; return i; };
function fieldTo(w, dst) {
  const F = T.fields || (T.fields = new Map()); const have = F.get(dst); if (have && w.year - have.year < SEA_EVERY) { F.delete(dst); F.set(dst, have); return have.dir; }   /* most recently used last: the least used go first */
  const dir = new Uint8Array(HN).fill(255); dir[dst] = 254; _cst++; _ch.clear(); _cd[dst] = 0; _cs[dst] = _cst; _ch.push(0, dst);
  while (_ch.n) {
    const v = _ch.pop(), dv = _cd[v]; if (_ch.key > dv + 1e-4) continue; const vx = v % HW, vy = (v / HW) | 0;
    for (let d = 0; d < 8; d++) { const uy = vy - DIRS[d][1]; if (uy < 0 || uy >= HH) continue; const u = uy * HW + (vx - DIRS[d][0] + HW) % HW; if (!_wet[u] || u === dst) continue;
      const nd = dv + _lc[u * 8 + d]; if (_cs[u] !== _cst || nd < _cd[u]) { _cs[u] = _cst; _cd[u] = nd; dir[u] = d; _ch.push(nd, u); } }
  }
  F.delete(dst); F.set(dst, { year: w.year, dir }); if (F.size > 300) F.delete(F.keys().next().value);   /* the oldest go first */
  return dir;
}
export function seaLane(w, ax, ay, bx, by) {
  ensure(w); wetMap(w); laneCosts(w);
  const snap = (x, y) => { const cx = (x / 2) | 0, cy = clamp((y / 2) | 0, 0, HH - 1); let best = -1, bd = 999; for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const yy = cy + dy; if (yy < 0 || yy >= HH) continue; const i = yy * HW + ((cx + dx + HW) % HW); if (_wet[i] && dx * dx + dy * dy < bd) { bd = dx * dx + dy * dy; best = i; } } return best; };
  const src = snap(ax, ay), dst = snap(bx, by); if (src < 0 || dst < 0 || _comp[src] !== _comp[dst]) return null;   /* different seas: no lane */
  // ports a few cells apart share one map: the map leads to its block's open-water anchor, and the last few cells go straight
  const bx0 = ((dst % HW) >> 2) << 2, by0 = (((dst / HW) | 0) >> 2) << 2; let rep = dst, rd = 99; for (let yy = by0; yy < Math.min(HH, by0 + 4); yy++) for (let xx = bx0; xx < bx0 + 4; xx++) { const i = yy * HW + xx; if (!_wet[i] || _comp[i] !== _comp[dst]) continue; const q = (xx - bx0 - 1.5) ** 2 + (yy - by0 - 1.5) ** 2; if (q < rd) { rd = q; rep = i; } }
  const dir = fieldTo(w, rep), out = [fineOf(w, src)]; let c = src;
  for (let k = 0; k < HN && c !== rep; k++) { const d = dir[c]; if (d > 7) return null; const x = c % HW, y = (c / HW) | 0; c = (y + DIRS[d][1]) * HW + (x + DIRS[d][0] + HW) % HW; if (!_wet[c]) return null; out.push(fineOf(w, c)); }
  if (c !== rep) return null; if (rep !== dst) out.push(fineOf(w, dst)); return out;
}
function lanes(w) { for (const [k, L] of T.lanes) if (w.year - L.year > 60) T.lanes.delete(k); }
export const laneFor = (Tr, r) => Tr.lanes.get(r.a.id + '>' + r.b.id) || Tr.lanes.get(r.b.id + '>' + r.a.id);

export function travelTick(w) {
  ensure(w); T.laneBudget = (w.tickN & 1) ? 1 : 0;
  if (w.year - T.last >= 2 && (w.tickN % 8) === 6) { T.last = w.year; rebuild(w); flows(w); lanes(w); T.pairs.clear(); }
  // a few paths every tick
  for (let n = 0; n < 4 && T.q.length; n++) { const e = T.edges.get(T.q.shift()); if (!e || !e.A || !e.B || e.A.dead || e.B.dead) continue; e.tried = w.year;
    const r = landPath(w, e.A.y * W + e.A.x, e.B.y * W + e.B.x, 5000); if (r) { e.path = r.path; e.cost = r.cost; } else { e.path = null; e.cost = Math.hypot(wrapDx(e.A.x - e.B.x), e.A.y - e.B.y) * 6; } }
}

/* ---------- route breaks (slice 16) ---------- */
// how far a carrier of this people goes before the trip stops paying, in cost units (a flat open
// cell costs 1, a road cell a third); at sea in lane cells
export function rangeOf(c, sea) {
  const A = c.arts, t = c.tame || {};
  if (sea) return A.engines ? 900 : A.navigation ? 320 : A.sailing ? 150 : A.boats ? 45 : 0;
  return A.oil && A.engines ? 900 : A.railways ? 500 : A.roads || A.wheel ? (t.horse || t.camel ? 130 : 95) : t.horse || t.camel || t.donkey || t.llama ? 75 : 45;
}
export const stepOf = (c, sea) => { const A = c.arts; return sea ? (A.engines ? 8 : A.navigation ? 5 : A.sailing ? 4 : 2) : A.railways ? 10 : A.roads || c.tame.horse || c.tame.camel ? 3 : 2; };
const fam = (w, s) => (s.lang != null && w.langs && w.langs[s.lang] ? familyOf(w, s.lang) : -1);
const knows = (c, o) => c === o || !!(c.met && c.met[o.id]);
const score = (s) => Math.sqrt(s.pop) * (s.market ? 2 : 1) * (s.port ? 1.3 : 1) * (1 + (s.relayE || 0));   /* big markets, and above all the places where goods already change hands */
// the towns along the cheapest chain of ways from a to b, with the cost to reach each
function chainNodes(w, a, b) {
  const key = a.id + '>' + b.id; let P = T.pairs.get(key); if (P !== undefined) return P;
  const chain = graphPath(b.id, a.id);   /* from b back to a: the edges come out in order from a */
  P = null; if (chain) { const nodes = [a], cost = [0]; let at = a.id, c = 0; for (const e of chain) { const nx = e.a === at ? e.B : e.A; c += Math.max(0.5, e.cost) * (e.war ? 3 : 1) * (1 + (e.fo || 0)); nodes.push(nx); cost.push(c); at = nx.id; } P = { nodes, cost }; }
  T.pairs.set(key, P); return P;
}
// Plan a land trip: the list of towns where the goods change hands, ending at b; null if it cannot go
export function planLand(w, a, b) {
  ensure(w); const P = chainNodes(w, a, b); if (!P) return null; const { nodes, cost } = P, legs = []; let i = 0;
  while (i < nodes.length - 1 && legs.length < 6) {
    const s = nodes[i], C = w.cults[s.cult], R0 = rangeOf(C, false), f0 = fam(w, s); let end = -1, best = -1, bs = -1;
    for (let j = i + 1; j < nodes.length; j++) {
      const t = nodes[j], d = cost[j] - cost[i]; if (d > R0) break;
      end = j; if (j === nodes.length - 1) { best = j; break; }
      if (fam(w, t) !== f0 || !knows(C, w.cults[t.cult])) { best = j; break; }   /* a new tongue, or a people the carrier does not know: the goods change hands here */
      if (d >= 0.6 * R0 && score(t) > bs) { bs = score(t); best = j; }
    }
    if (end < 0) return null;   /* the first stretch is already too far */
    if (best < 0) best = end; legs.push(nodes[best]); i = best;
  }
  return i === nodes.length - 1 ? legs : null;
}
// every town reachable from a over the ways within a cost budget (one bounded Dijkstra), as id -> cost
export function reachFrom(w, a, budget) {
  ensure(w); const out = new Map(); if (!T.adj.has(a.id)) return out; const dist = new Map([[a.id, 0]]); _gh.clear(); _gh.push(0, a.id); let n = 0;
  while (_gh.n && n++ < 3000) { const u = _gh.pop(), d = dist.get(u); if (_gh.key > d + 1e-3) continue; if (u !== a.id) out.set(u, d);
    for (const e of T.adj.get(u) || []) { if (e.block) continue; const v = e.a === u ? e.b : e.a, nd = d + Math.max(0.5, e.cost) * (e.war ? 3 : 1) * (1 + (e.fo || 0)); if (nd > budget) continue; const old = dist.get(v); if (old === undefined || nd < old - 1e-6) { dist.set(v, nd); _gh.push(nd, v); } } }
  return out;
}
// the land path of one leg, as cells (for the moving picture)
export function legCells(w, a, b) {
  ensure(w);
  const P = chainNodes(w, a, b); if (!P) return null; const out = [];
  for (let k = 1; k < P.nodes.length; k++) { const u = P.nodes[k - 1], v = P.nodes[k], e = T.edges.get(keyOf(u.id, v.id));
    if (!e || !e.path) { const dx = wrapDx(v.x - u.x), dy = v.y - u.y, n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)))); for (let j = 1; j <= n; j++) out.push(clamp(Math.round(u.y + (dy * j) / n), 0, H - 1) * W + wx(Math.round(u.x + (dx * j) / n))); if (v === b) break; continue; }   /* a way not worked out yet: straight across, for now */
    const fwd = e.path[0] === u.y * W + u.x; const p = fwd ? e.path : Array.from(e.path).reverse(); for (const c of p) out.push(c); if (v === b) break; }
  return out;
}
// Plan a sea trip from port a to port b: whole, or broken at a port along the lane
export function planSea(w, a, b) {
  ensure(w); const key = a.id + '>' + b.id; let L = T.lanes.get(key);
  if (!L || w.year - L.year >= SEA_EVERY) { L = { year: w.year, path: seaLane(w, a.x, a.y, b.x, b.y) }; T.lanes.set(key, L); }
  if (!L.path) return null;   /* no way by sea between them: the ship does not sail */ const C = w.cults[a.cult], R0 = rangeOf(C, true); if (!R0) return null;
  const len = L.path.length; if (len <= R0) return { legs: [b], path: L.path };
  // too far: the last good harbour inside the range
  let best = null, bs = -1; for (let k = Math.floor(R0 * 0.5); k < Math.min(len, R0); k += 3) { const c = L.path[k]; near(w, c % W, (c / W) | 0, 6, null, true, (s) => { if (s === a || s === b || !s.port || w.cults[s.cult].power) return; const sc = score(s) * (k / R0); if (sc > bs) { bs = sc; best = s; } }); }
  return best ? { legs: [best, b], path: L.path.slice(0, R0) } : null;
}
// a relay town takes its cut; the ledger notes when the place where goods change hands moves
export function relayAt(w, s, a, b, val) {
  ensure(w);
  s.relayN = (s.relayN || 0) + 1; s.relayY = w.year; s.wealth = (s.wealth || 0) + val * 0.35; s.toll = (s.toll || 0) + val * 0.35;
  const key = a.id + '>' + b.id, was = T.relayOf.get(key);
  if (was && was.id !== s.id && was.n >= 6) { const old = w.sets.find((q) => q.id === was.id && !q.dead); return { old, n: was.n }; }
  if (!was || was.id !== s.id) T.relayOf.set(key, { id: s.id, n: 1 }); else was.n++;
  return null;
}
export function clearRelay(w, a, b) { ensure(w); const key = a.id + '>' + b.id, was = T.relayOf.get(key); T.relayOf.delete(key); return was && was.n >= 6 ? w.sets.find((q) => q.id === was.id && !q.dead) : null; }
