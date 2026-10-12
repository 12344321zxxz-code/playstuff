// Magic is the world remembering. What happens in a place leaves something behind: a battle or a
// sacked city leaves death, an old forest nobody has cut leaves wildness, a fallen star leaves
// fire, the open sea and drowned towns leave the deep, a shrine leaves faith. Memory seeps into
// the ley lines, which run along the old seams of the world, and drains along them to a handful
// of wellsprings, the way water finds a lake; a well that fills too far spills a ley storm back
// up the lines. Peoples wear memory away with every road and furnace, faster the more they know,
// so as a world grows clever its wonders retreat to the deep woods, the peaks, the open ocean and
// the ruins, and come creeping back when a civilisation falls.
import { W, H, N, clamp, wx, wrapDx, cyl, DISC, NB8, Heap } from './core.js';
import { ev, discover, once } from './story.js';
import { drainOf } from './tech.js';

export const KINDS = [
  { key: 'death', name: 'death', col: '#9aa3b8', place: 'haunted' },
  { key: 'wild', name: 'the wild', col: '#5fe07a', place: 'wild' },
  { key: 'fire', name: 'fire', col: '#ff8a3a', place: 'burning' },
  { key: 'deep', name: 'the deep', col: '#4ab8e8', place: 'drowned' },
  { key: 'faith', name: 'faith', col: '#f2dc6a', place: 'holy' },
];
export const NK = 5, DEATH = 0, WILD = 1, FIRE = 2, DEEP = 3, FAITH = 4;
export const STANCES = {
  revere: { name: 'Keepers', say: 'keep the old places', col: '#e8c860', drain: 0.3 },
  use: { name: 'Sorcerers', say: 'draw on the old powers', col: '#b07aff', drain: 1.3 },
  fear: { name: 'Warders', say: 'ward against the old things', col: '#d0d0d8', drain: 1.7 },
  forget: { name: 'Forgetters', say: 'have stopped believing in any of it', col: '#8a6a50', drain: 1 },
};
const LEY = 0.15;   // ley strength above which a cell is on a line

export function initMemory(w) {
  w.mem = new Float32Array(N * NK); w.memLock = new Uint8Array(N); w.leyTo = new Int32Array(N).fill(-1); w.leyD = new Float32Array(N); w.sites = []; w.storms2 = []; w.memStat = new Float32Array(NK);
  layLey(w);
  // wells sit where the strongest lines meet, kept apart
  w.wells = []; const cand = [];
  for (let i = 0; i < N; i += 7) if (w.ley[i] > 0.3) cand.push(i);
  cand.sort((a, b) => w.ley[b] - w.ley[a]);
  for (const i of cand) { const x = i % W, y = (i / W) | 0; if (y < 20 || y > H - 20) continue; if (w.wells.some((q) => wrapDx(q.x - x) ** 2 + (q.y - y) ** 2 < 70 * 70)) continue; w.wells.push({ x, y, name: null, spilt: 0 }); if (w.wells.length >= 7) break; }
  for (let k = w.wells.length; k < 5; k++) w.wells.push({ x: (w.rnd() * W) | 0, y: (H * (0.15 + 0.7 * w.rnd())) | 0, name: null, spilt: 0 });
  route(w);
  // a young world remembers only its oldest things: deep water and the first forests
  for (let i = 0; i < N; i++) { if (w.water[i] === 1) { if (w.h[i] - w.params.sea < -0.4) w.mem[i * NK + DEEP] = 0.25; } else if (w.t[i] > 0.85) w.mem[i * NK + WILD] = 0.2 * w.rnd(); }
  sumMagic(w);
}
// Ley lines run along the seams between plates, broken up by noise so they are lines, not bands.
export function layLey(w) {
  const ley = w.ley || (w.ley = new Float32Array(N)), pd = w._pd, s = w.seed;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x, d = pd ? pd[i] : 99, n = cyl(x, y, 1 / 26, s + 201, 3); ley[i] = d < 5 && n > 0.5 ? Math.exp(-(d * d) / 4) * Math.min(1, (n - 0.5) * 5) : 0; }
  w.leyStamp = w.plateStamp || 0;
}
// Which way memory runs from every cell: down the cheapest path to a wellspring, where the ley
// lines are roads and open country is slow going.
const _heap = new Heap(N);
export function route(w) {
  const { ley, leyTo, leyD } = w; leyD.fill(1e9); leyTo.fill(-1); _heap.clear();
  for (const q of w.wells) { const i = q.y * W + q.x; leyD[i] = 0; _heap.push(0, i); for (const o of DISC[2]) { const yy = q.y + o[1]; if (yy < 0 || yy >= H) continue; const j = yy * W + wx(q.x + o[0]); if (leyD[j] > 0) { leyD[j] = 0; leyTo[j] = -1; _heap.push(0, j); } } }
  while (_heap.n) {
    const c = _heap.pop(), dc = _heap.key; if (dc > leyD[c]) continue; const x = c % W, y = (c / W) | 0;
    for (let k = 0; k < 8; k++) { const yy = y + NB8[k][1]; if (yy < 0 || yy >= H) continue; const n = yy * W + wx(x + NB8[k][0]); const cost = (k === 1 || k === 3 || k === 4 || k === 6 ? 1 : 1.41) * (ley[n] > LEY ? 1 : 9); const nd = dc + cost; if (nd < leyD[n]) { leyD[n] = nd; leyTo[n] = c; _heap.push(nd, n); } }
  }
  w.routeStamp = w.year;
}
export function sumMagic(w) { const { mem, magic } = w; for (let i = 0; i < N; i++) { const b = i * NK, s = mem[b] + mem[b + 1] + mem[b + 2] + mem[b + 3] + mem[b + 4]; magic[i] = s > 1 ? 1 : s; } }
export const memAt = (w, i, k) => w.mem[i * NK + k];
export function kindAt(w, i) { const b = i * NK, m = w.mem; let bk = -1, bv = 0.15; for (let k = 0; k < NK; k++) if (m[b + k] > bv) { bv = m[b + k]; bk = k; } return bk; }

// Something happened here. `sub` says what kind of thing (a battle, a plague...), `why` how the
// chronicle will name it later if anything rises from it.
export function remember(w, x, y, kind, amt, r, sub, why, extra) {
  if (!w.mem) return; x = wx(Math.round(x)); y = clamp(Math.round(y), 0, H - 1); r = Math.max(1, Math.min(12, r | 0));
  for (const o of DISC[r]) { const yy = y + o[1]; if (yy < 0 || yy >= H) continue; const j = (yy * W + wx(x + o[0])) * NK + kind, f = 1 - o[2] / (r + 1); w.mem[j] = Math.min(1.5, w.mem[j] + amt * f); }
  if (why && amt >= 0.25) {
    const old = w.sites.find((s) => s.kind === kind && wrapDx(s.x - x) ** 2 + (s.y - y) ** 2 < 16);
    if (old) { old.amt += amt; old.year = w.year; old.n = (old.n || 1) + 1; if (sub && old.sub !== sub && amt > 0.4) { old.sub = sub; old.why = why; } }
    else { w.sites.push(Object.assign({ x, y, kind, sub, why, year: w.year, amt, n: 1, risen: false }, extra || {})); if (w.sites.length > 240) w.sites.splice(w.sites.findIndex((s) => !s.risen) >>> 0, 1); }
  }
}
export function forgetAt(w, x, y, r) {
  let n = 0; for (const o of DISC[Math.min(20, r)]) { const yy = y + o[1]; if (yy < 0 || yy >= H) continue; const j = yy * W + wx(x + o[0]); for (let k = 0; k < NK; k++) { if (w.mem[j * NK + k] > 0.02) n++; w.mem[j * NK + k] = 0; } w.memLock[j] = 0; w.magic[j] = 0; }
  w.sites = w.sites.filter((s) => wrapDx(s.x - x) ** 2 + (s.y - y) ** 2 > r * r);
  return n > 0;
}

/* ---------- the year ---------- */
// Memory runs along the lines toward the wells, a few steps a year. Off the lines it barely moves.
const _tmp = new Float32Array(N * NK);
export function flowMemory(w) {
  const { mem, leyTo, ley, memLock, water } = w; _tmp.set(mem);
  for (let i = 0; i < N; i++) {
    const to = leyTo[i]; if (to < 0 || memLock[i]) continue; const f = ley[i] > LEY ? (water[i] === 1 ? 0.08 : 0.3) : water[i] !== 1 && ley[to] > LEY ? 0.04 : 0, b = i * NK, tb = to * NK; if (!f) continue;   // off the lines, memory only seeps into a line it touches
    for (let k = 0; k < NK; k++) { const v = mem[b + k]; if (v < 0.004) continue; const m = v * f; _tmp[b + k] -= m; _tmp[tb + k] += m; }
  }
  mem.set(_tmp);
}
export function memoryYear(w) {
  const { mem, t, mi, water, owner, h, memLock, road } = w, sea = w.params.sea, rnd = w.rnd;
  if ((w.plateStamp || 0) !== w.leyStamp) { layLey(w); route(w); }
  else if (w.leyDirty || w.year - w.routeStamp > 80) { w.leyDirty = false; route(w); }
  // sources that need no event: old forest nobody touches, the deep sea
  for (let i = 0; i < N; i++) {
    const b = i * NK;
    if (water[i] === 1) { if (h[i] - sea < -0.4 && mem[b + DEEP] < 0.35) mem[b + DEEP] += 0.003; }
    else if (t[i] > 0.85 && mi[i] > 0.8 && owner[i] < 0 && mem[b + WILD] < 0.9) mem[b + WILD] += 0.004;
    if (!memLock[i]) { for (let k = 0; k < NK; k++) mem[b + k] *= 0.996; if (road[i]) for (let k = 0; k < NK; k++) mem[b + k] *= 0.97; if (w.farm[i] || owner[i] >= 0) mem[b] *= 0.988; }   // ploughed and lived-in land forgets its dead
  }
  // ruins remember what happened to them; shrines remember their faith
  // ruins remember for a few lifetimes, then they are just stones
  for (const r of w.ruins) { const k = RUIN_KIND[r.kind]; if (k == null || r.tier < 2) continue; const age = w.year - r.year; if (age > 400 && !r.haunt) continue; remember(w, r.x, r.y, k, (r.tier >= 3 ? 0.014 : 0.007) * (r.haunt ? 1 : Math.exp(-age / 200)), 2); }
  for (const f of w.faiths || []) if (f.alive && f.x != null) remember(w, f.x, f.y, FAITH, 0.006, 2);
  for (const s of w.sets) if (s.wonder) remember(w, s.x, s.y, FAITH, 0.005, 2);
  for (const v of w.volcanoes) if (w.h[v.y * W + v.x] > sea) remember(w, v.x, v.y, FIRE, 0.012, 3);   // the mountains that burn remember it
  wearAway(w);
  wellsYear(w);
  sumMagic(w);
  let tot = 0; w.memStat.fill(0); for (let i = 0; i < N; i += 4) { if (water[i] === 1) continue; const b = i * NK; for (let k = 0; k < NK; k++) w.memStat[k] += mem[b + k]; } for (let k = 0; k < NK; k++) tot += w.memStat[k];
  w.stats.magic = Math.round(tot); w.magicPeak = Math.max(w.magicPeak || 0, tot);
  if (w.year > 300 && tot < (w.magicPeak || 0) * 0.35 && discover(w, 'quiet', null, null)) ev(w, 'The old places have gone quiet almost everywhere. Children are told the stories, and do not believe them.', null, null, null, 2);
  if (w.found.quiet && tot > w.magicPeak * 0.7 && w.year - w.found.quiet.year > 60 && discover(w, 'return', null, null)) ev(w, 'With the cities fallen, the old things are coming back.', null, null, null, 2);
}
export const RUIN_KIND = { sacked: DEATH, plague: DEATH, starved: DEATH, frozen: DEATH, abandoned: null, drowned: DEEP, buried: FIRE, crater: FIRE, dragon: FIRE, overgrown: WILD, swallowed: FIRE, burned: FIRE };

// Knowledge is corrosive. Every furnace, road and book wears the memory of a place away, and a
// people's stance decides how hard they lean on it.
function wearAway(w) {
  const { mem, memLock } = w;
  for (const s of w.sets) {
    if (s.dead) continue; const c = w.cults[s.cult], A = c.arts, st = STANCES[c.stance || 'revere'];
    const d = (0.002 * c.tech + drainOf(A)) * (s.nomad ? 0.3 : 0.5 + 0.5 * s.tier) * st.drain;
    if (d <= 0) continue; const R = Math.min(12, s.R + 2);
    for (const o of DISC[R]) { const yy = s.y + o[1]; if (yy < 0 || yy >= H) continue; const j = yy * W + wx(s.x + o[0]); if (memLock[j]) continue; const k = 1 - d * (1 - o[2] / (R + 1)), b = j * NK; for (let q = 0; q < NK; q++) mem[b + q] *= k; }
    if (s.tower) for (const o of DISC[6]) { const yy = s.y + o[1]; if (yy < 0 || yy >= H) continue; const b = (yy * W + wx(s.x + o[0])) * NK; for (let q = 0; q < NK; q++) mem[b + q] *= 0.97; }   // sorcerers draw the place dry
  }
}

// A well holds what the lines bring it; past a point it spills, and the spill runs back up the
// lines as a storm of whatever it was full of.
const WNAME = { death: ['the Weeping Well', 'the Black Spring', 'the Well of Bones'], wild: ['the Green Spring', 'the Antler Well', 'the Well of Roots'], fire: ['the Burning Well', 'the Ember Spring', 'the Red Pool'], deep: ['the Salt Well', 'the Drowned Spring', 'the Well of Tides'], faith: ['the Bright Well', 'the Saint’s Spring', 'the Well of Bells'] };
function wellsYear(w) {
  const { mem } = w;
  for (const q of w.wells) {
    const sum = new Float32Array(NK); let tot = 0;
    for (const o of DISC[2]) { const yy = q.y + o[1]; if (yy < 0 || yy >= H) continue; const b = (yy * W + wx(q.x + o[0])) * NK; for (let k = 0; k < NK; k++) { sum[k] += mem[b + k]; tot += mem[b + k]; } }
    let bk = 0; for (let k = 1; k < NK; k++) if (sum[k] > sum[bk]) bk = k; q.kind = bk; q.fill = tot;
    if (!q.name && tot > 4) q.name = WNAME[KINDS[bk].key][(w.rnd() * 3) | 0];
    if (tot > 14 && w.storms2.length < 3 && w.year - (q.at || -99) > 40) { q.at = w.year;
      for (const o of DISC[2]) { const yy = q.y + o[1]; if (yy < 0 || yy >= H) continue; const b = (yy * W + wx(q.x + o[0])) * NK; for (let k = 0; k < NK; k++) mem[b + k] *= 0.35; }
      q.spilt++; w.storms2.push({ x: q.x, y: q.y, px: q.x, py: q.y, kind: bk, left: 70, from: q.name || 'a wellspring', amt: Math.min(0.5, sum[bk] / 30), seen: new Set() });
      ev(w, `${q.name ? q.name[0].toUpperCase() + q.name.slice(1) : 'A wellspring'} spills over. A storm of ${KINDS[bk].name} runs out along the ley lines.`, q.x, q.y, null, q.spilt === 1 ? 0 : 1); discover(w, 'leystorm', q.x, q.y);
    }
  }
}
// The storm climbs the lines away from the well, a couple of cells a tick, leaving its kind behind.
export function leyStormsTick(w, onPass) {
  const { leyTo, ley } = w, rnd = w.rnd;
  for (const s of w.storms2) {
    s.px = s.x; s.py = s.y;
    for (let step = 0; step < 2; step++) {
      const i = s.y * W + s.x; s.seen.add(i); let best = -1, bs = -1;
      for (let k = 0; k < 8; k++) { const yy = s.y + NB8[k][1]; if (yy < 1 || yy >= H - 1) continue; const n = yy * W + wx(s.x + NB8[k][0]); if (s.seen.has(n)) continue; const sc = (leyTo[n] === i ? 2 : 0) + (ley[n] > LEY ? 1 : 0) + rnd() * 0.8; if (sc > bs) { bs = sc; best = n; } }
      if (best < 0 || --s.left <= 0) { s.dead = true; break; }
      s.x = best % W; s.y = (best / W) | 0;
      remember(w, s.x, s.y, s.kind, s.amt * 0.25, 2);
      if (onPass && (s.left & 3) === 0) onPass(w, s);
    }
  }
  if (w.storms2.some((s) => s.dead)) w.storms2 = w.storms2.filter((s) => !s.dead);
}

/* ---------- peoples and the old things ---------- */
// How a people stands toward the old places, from what has happened to them and what they know.
export function stanceYear(w, c) {
  if (!c.big || (w.year + c.id) % 6) return; const A = c.arts, i = c.big.y * W + c.big.x, here = w.magic[i];
  let towers = 0; for (const s of w.sets) if (s.cult === c.id && s.tower) towers++;
  const sc = {
    revere: (c.tenet === 'ancestors' || c.tenet === 'grove' ? 2 : 0) + (c.tech <= 2 ? 1.3 : 0) + here * 2.5 + (c.pacts ? 1.5 : 0) + (c.way === 'farm' ? 0 : 0.8),
    use: towers * 1.4 + (c.tech >= 2 && here > 0.25 ? 1.2 : 0),
    fear: (c.hurt || 0) * 0.9,
    forget: Math.max(0, c.tech - 1) * 0.5 + (A.iron ? 0.6 : 0) + (A.writing ? 0.7 : 0) + (A.engines ? 2.5 : 0) - here * 2,
  };
  const cur = c.stance || 'revere'; sc[cur] += 0.7; let best = cur; for (const k in sc) if (sc[k] > sc[best]) best = k;
  c.hurt = (c.hurt || 0) * 0.9;
  if (best !== cur) {
    c.stance = best; c.stanceAt = w.year; const b = c.big;
    if (c.count >= 3) ev(w, best === 'forget' ? `The ${c.name} stop leaving offerings at the old places. Their scholars say there was never anything there.` : best === 'fear' ? `The ${c.name} begin to salt their thresholds and hang iron over their doors.` : best === 'use' ? `The ${c.name} learn to draw on what sleeps in the old places.` : `The ${c.name} go back to the old ways, and keep the old places.`, b.x, b.y, c.color, 1);
    return cur;   // a stance has changed: pacts may break
  }
  return null;
}
