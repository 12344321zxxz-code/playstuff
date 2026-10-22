// Migration (22 Oct): people leave towns that push them and go to places that pull them, like the
// hub's lords, pressure builds over years, has named causes, and is released as a yearly flow.
//
//   push (per town): crowding, hunger, a hard life, danger, not belonging.
//   pull (per town): room, work, a good life, kin (earlier migrants draw more: chains snowball).
//   where they can go: only where a caravan of their people could, along the ways within the reach
//     of their transport (or by sea from a port of their own people), and only to peoples they know.
//     Into another realm only in the modern eras (smoke and steam on) and only into an open society.
//   pioneers: where the best pull is open land with no town, they found a hamlet there.
//   what it leaves: towns with a share of other tongues (which can flip the town's tongue), backlash
//     and expulsions where many strangers live under a closed people, skilled migrants carrying
//     knowledge, and named streams.
import { W, H, DISC, wx, wrapDx, clamp } from './core.js';
import { near, addSet, flee, routeToCell, departPort } from './people.js';
import { reachFrom, rangeOf, seaLane } from './travel.js';
import { tongueGap, cultureOf } from './tongues.js';
import { carry } from './faith.js';
import { cropYield } from './origins.js';
import { record } from './ledger.js';
import { ev, discover, once } from './story.js';

const HUNGER = new Set(['drought', 'flood', 'soil', 'locusts', 'fish', 'game', 'ash']);
const open = (w, c) => { const q = cultureOf(w, c); return q ? q.open : 0.4; };
// pull is cached per town for the year and refreshed when migrants change it; _pmax bounds every pull,
// so the reach search can stop where even the best town would score under the cut
let _pyear = -1, _pmax = 0;
function pullC(w, t, tc) { if (t._pk === _pyear) return t._pv; const v = pullOf(w, t, tc); t._pv = v; t._pk = _pyear; if (v > _pmax) _pmax = v; return v; }
const dirty = (w, t) => { t._pk = -1; pullC(w, t, w.cults[t.cult]); };   /* recompute now, so _pmax stays a true bound */

function pushOf(w, s, c) {
  const h = c.hub, L = h ? h.L : 1, cap = s.cap || s.pop, i = s.y * W + s.x;
  const t = {
    crowding: clamp((s.pop / Math.max(1, cap) - 0.75) / 0.25, 0, 1) * (s.note === 'crowded' ? 1 : 0.8),   /* young people start leaving well before the town is full */
    hunger: HUNGER.has(s.note) ? 0.8 : 0,
    hardship: clamp((0.85 - L) / 0.4, 0, 1) * 0.7,
    danger: Math.min(1, (s.plague > 0 ? 0.4 : 0) + (w.year - (s.foraged ?? -99) < 4 ? 0.5 : 0) + (c.war && c.war.lost > c.war.taken ? 0.2 : 0) + (w.fallout && w.fallout[i] > 0.1 ? Math.min(0.8, w.fallout[i]) : 0) + (s.lost ? 0.3 : 0) + (c.over ? 0.15 : 0)),
    strangers: (c.langId != null && s.lang != null && tongueGap(w, s.lang, c.langId) > 3 ? 0.25 : 0) + (c.zeal && s.faith != null && c.faith != null && s.faith !== c.faith ? 0.3 : 0),
  };
  let keep = 1; for (const k in t) keep *= 1 - t[k];
  return { p: 1 - keep, t };
}
function pullOf(w, t, c) {
  const h = c.hub, L = h ? h.L : 1, cap = t.cap || t.pop;
  const room = clamp(1 - t.pop / Math.max(1, cap), 0, 1) * (cap > 60 ? 1 : 0.4);
  const work = (t.tier >= 3 ? 0.35 : t.tier >= 2 ? 0.15 : 0) * (c.arts.engines ? 2 : 1) + (t.market ? 0.15 : 0) + (t.entrepot ? 0.25 : 0);
  const life = clamp(L - 0.8, 0, 0.4), kin = Math.min(0.5, (t.migE || 0) / 120);
  const bad = (t.plague > 0 ? 0.5 : 1) * (c.war ? 0.7 : 1) * (HUNGER.has(t.note) ? 0.3 : 1);
  return (room + work + life + kin) * bad;
}

export function migrateYear(w) {
  const towns = w.sets.filter((s) => !s.dead && !s.nomad && !w.cults[s.cult].power && !s.undead);
  for (const s of towns) { s.migE = (s.migE || 0) * 0.85; if (s.mix) { for (const k in s.mix) { s.mix[k] *= 0.97; if (s.mix[k] < 0.02) delete s.mix[k]; } } }
  _pyear = w.year * 2 + 1; _pmax = 0; for (const t of towns) pullC(w, t, w.cults[t.cult]);
  const byId = new Map(towns.map((s) => [s.id, s])), streams = w.streams || (w.streams = new Map()); let moved = 0;
  for (const s of towns) {
    const c = w.cults[s.cult], P = pushOf(w, s, c);
    s.pushE = (s.pushE || 0) + (P.p - (s.pushE || 0)) / 5;   /* it takes a few years before people pack up */
    if (s.pushE < 0.1 || s.pop < 60) continue;
    let n = Math.round(s.pop * 0.02 * (s.pushE - 0.1) / 0.9); if (n < 3 && !(s.pushE > 0.3 && s.pop >= 90)) continue;
    let why = 'crowding', tv = 0; for (const k in P.t) if (P.t[k] > tv) { tv = P.t[k]; why = k; }
    // where they could go: by the ways within their reach, or by sea from their own port
    const modern = c.tech >= 6, cands = [];
    // nearest first: once even the strongest pull at this distance can't beat the third best, stop looking
    let s1 = 0, s2 = 0, s3 = 0; const top = _pmax * 1.3;
    reachFrom(w, s, rangeOf(c, false), (id, cost) => { if (s3 > 0 && top / (1 + (cost - 1e-3) / 40) < s3) return true;
      const t = byId.get(id); if (!t) return false; const tc = w.cults[t.cult];
      if (t.cult !== s.cult && (!modern || open(w, tc) < 0.5 || !(c.met && c.met[tc.id]))) return false;   /* other realms: modern eras and open societies only */
      const sc = pullC(w, t, tc) * (t.lang === s.lang ? 1.3 : 1) / (1 + cost / 40); if (sc > 0.05) { cands.push({ t, sc, sea: false });
        if (sc > s1) { s3 = s2; s2 = s1; s1 = sc; } else if (sc > s2) { s3 = s2; s2 = sc; } else if (sc > s3) s3 = sc; } return false; });
    if (c.arts.boats && cands.length < 3) { const dp = departPort(w, s); if (dp) { const R0 = rangeOf(c, true);
      near(w, dp.port.x, dp.port.y, Math.min(140, R0 * 2), dp.port, true, (t) => { if (!t.port || cands.length > 8 || !byId.has(t.id)) return; const tc = w.cults[t.cult]; if (t.cult !== s.cult && (!modern || open(w, tc) < 0.5 || !(c.met && c.met[tc.id]))) return;
        const lane = seaLane(w, dp.port.x, dp.port.y, t.x, t.y); if (!lane || lane.length > R0) return; const sc = pullC(w, t, tc) * 0.7 / (1 + lane.length / 80); if (sc > 0.05) cands.push({ t, sc, sea: true }); }); } }
    cands.sort((a, b) => b.sc - a.sc);
    // pioneers: open land nearby that suits them beats every town they could reach
    if ((!cands.length || cands[0].sc < 0.5) && s.pushE > 0.3 && s.pop >= 90 && w.year - (s.pioneerAt || -99) > 12 && (w.nTown || 0) < 500) { const site = openLand(w, s, c); if (site) { n = Math.max(n, 15);
      s.pioneerAt = w.year; const v = addSet(w, s.cult, site.x, site.y, n, false); v.lang = s.lang; v.cul = s.cul; v.faith = s.faith; s.pop -= n; dirty(w, s); moved += n;
      record(w, 'pioneers', [c.id], { x: v.x, y: v.y, note: `pioneers from ${s.name} found ${v.name} (${why})` });
      if (once(w, 'pioneer-' + c.id + '-' + Math.floor(w.year / 60))) ev(w, `Families from ${s.name} go looking for land of their own and found ${v.name}.`, v.x, v.y, c.color, 1);
      discover(w, 'pioneers', v.x, v.y); continue; } }
    if (!cands.length) continue;
    const pick = cands.slice(0, 3), tot = pick.reduce((a, q) => a + q.sc, 0);
    for (const q of pick) { const k = Math.round(n * q.sc / tot); if (k < 2) continue; arrive(w, s, q.t, k, q.sea, why, streams); moved += k; }
  }
  for (const [key, st] of streams) { st.n *= 0.9; if (st.n < 1) streams.delete(key); }
  backlash(w, towns);
  w.stats.migrants = moved;
}

function arrive(w, s, t, k, sea, why, streams) {
  const c = w.cults[s.cult], tc = w.cults[t.cult]; s.pop -= k; t.pop += k * 0.97; t.migE = (t.migE || 0) + k; dirty(w, s); dirty(w, t);
  if (s.lang != null && t.lang != null && s.lang !== t.lang) { const m = t.mix || (t.mix = {}); m[s.lang] = Math.min(1, (m[s.lang] || 0) + k / Math.max(30, t.pop));
    if (m[s.lang] > 0.5) { const was = t.lang; t.lang = s.lang; delete m[s.lang]; m[was] = 0.3; record(w, 'tongue-flip', [t.cult], { x: t.x, y: t.y, note: `${t.name} now speaks the newcomers' tongue` }); if (w.langs && t.tier >= 2) ev(w, `In ${t.name} the newcomers outnumber the old families. Within a generation the town speaks ${w.langs[s.lang].name}.`, t.x, t.y, tc.color, 1); } }
  if (w.rnd() < k / 200) carry(w, s, t, 'refugees');
  if (c !== tc && c.know > tc.know && k > 10) tc.know += (c.know - tc.know) * Math.min(0.01, k / 20000);   /* skilled hands take what they know with them */
  const key = s.id + '>' + t.id; let st = streams.get(key); if (!st) { st = { n: 0, since: w.year, named: false }; streams.set(key, st); } st.n += k;
  if (!st.named && st.n > 100 && w.year - st.since > 30 && (t.tier >= 3 || c !== tc)) {   /* only the great streams get a name: into cities, or across a border */ st.named = true; record(w, 'stream', [s.cult, t.cult], { x: t.x, y: t.y, note: `${s.name} to ${t.name}, ${why}` });
    ev(w, c === tc ? `Year after year the young of ${s.name} leave for ${t.name}.` : `People from ${s.name} keep coming to ${t.name} of the ${tc.name}; they have a street of their own there now.`, t.x, t.y, tc.color, 1); discover(w, 'stream', t.x, t.y); }
}
// open land within a short walk that suits these people, reached by a real path
function openLand(w, s, c) {
  const A = c.arts; let best = null, bs = 3.5;
  for (let q = 0; q < 10; q++) { const a = w.rnd() * 6.2832, d = 7 + w.rnd() * 13, x = wx(Math.round(s.x + Math.cos(a) * d)), y = Math.round(s.y + Math.sin(a) * d * 0.8); if (y < 3 || y >= H - 3) continue; const i = y * W + x;
    if (w.water[i] || w.ice[i] || w.h[i] - w.params.sea > (A.terraces ? 0.5 : 0.36) || w.gCap[i] < 0.2 || w.magic[i] > 0.75 || near(w, x, y, 6.5, null, true)) continue;
    let sc = 0; for (const o of DISC[2]) { const yy = y + o[1]; if (yy < 0 || yy >= H) continue; const j = yy * W + wx(x + o[0]); if (w.water[j]) sc += A.boats ? 0.4 : 0.1; else sc += 0.15 * w.gCap[j] + (A.farming ? Math.min(1, cropYield(w, c, j)) : 0) + (c.grazer ? 0.25 * w.g[j] : 0); }
    if (sc > bs) { bs = sc; best = { x, y }; } }
  if (!best) return null; return routeToCell(w, s, best.x, best.y, false, true) ? best : null;
}
// many strangers under a closed people: resentment, and now and then an expulsion
function backlash(w, towns) {
  for (const t of towns) { if (!t.mix || t.tier < 2) continue; let f = 0; for (const k in t.mix) f += t.mix[k]; const c = w.cults[t.cult]; if (f < 0.3 || open(w, c) > 0.45) continue;
    if (w.rnd() < 0.02 * f && w.year - (t.expelAt || -999) > 60) { t.expelAt = w.year; const out = Math.round(t.pop * f * 0.5); t.mix = {}; t.pop -= out; flee(w, t, out);
      record(w, 'expel', [c.id], { x: t.x, y: t.y, note: `${t.name} drives out its newcomers (${out})` }); ev(w, `The old families of ${t.name} turn on the newcomers and drive them out of the town.`, t.x, t.y, c.color, 1); discover(w, 'expulsion', t.x, t.y); } }
}
