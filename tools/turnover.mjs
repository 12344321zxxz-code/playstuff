// Territorial turnover, measured as in the three turnover reconstructions (Oct 29): the share of land
// held by settled realms at the start of a century whose top-level sovereign changed at least once
// during it. Weighted by the land each town holds (w.owner cells). Each century is filed under the
// world's leading age at its start (the most advanced realm holding at least 3% of settled people),
// the way the sources file by calendar era.
//   foreign:  an existing realm took it, or razed it in war
//     colonial (part of foreign): the taker was two or more ages ahead of the realm it took from; a
//     realm made the client (protectorate) of one two or more ages ahead counts here too
//   internal: a breakaway, successor or reunion within one family of realms
//     decolonisation (part of internal): land taken colonially breaking free again
// Becoming a client (a protectorate, a vassal paying tribute) counts as foreign: the top-level sovereign is now its overlord,
// as in Cliopatria's composites and the modern series (puppets count); throwing an overlord off counts as internal.
// Towns founded during the century are not counted.
import { N } from '../src/core.js';

export const BUCKETS = ['1-2', '3', '4', '5', '6', '7', '8', '9-10'];
export const bucketOf = (t) => (t <= 2 ? 0 : t >= 9 ? 7 : t - 2);
const WAR_END = new Set(['sacked', 'nuked', 'dragon', 'swallowed']);

export function makeTurnover() { return { cur: null, acc: BUCKETS.map(() => ({ area: 0, f: 0, i: 0, raze: 0, col: 0, decol: 0, n: 0, cents: 0, gap: 0 })), cent: [], colOf: new Map() }; }

// does realm a descend from realm b (or b from a) within a few generations?
function kin(w, a, b) {
  for (const [x, y] of [[a, b], [b, a]]) { let c = w.cults[x]; for (let k = 0; k < 8 && c; k++) { if (c.pid === y) return true; c = c.pid != null ? w.cults[c.pid] : null; } }
  return false;
}
const settled = (c) => c && c.alive && !c.power && !(c.env && c.env.nomads > c.env.sed);
export function leadingAge(w) {
  let tot = 0; for (const c of w.cults) if (settled(c)) tot += c.pop;
  let t = 0; for (const c of w.cults) if (settled(c) && c.pop >= 0.03 * tot && c.tech > t) t = c.tech; return t;
}
const overOf = (w, c) => (!c || !c.over ? null : c.over.kind === 'realm' ? (w.cults[c.over.id] ? c.over.id : null) : 'd' + (c.over.d || ''));   /* a realm's overlord: another realm, or a dragon */

export function turnoverYear(w, T) {
  if (w.year % 100 === 0 || !T.cur) {
    if (T.cur) close(w, T);
    const area = new Map(); for (let i = 0; i < N; i++) { const k = w.owner[i]; if (k >= 0) area.set(k, (area.get(k) || 0) + 1); }
    const rows = [], over = new Map();
    for (const [k, a] of area) { const s = w.sets[k]; if (!s || s.dead || s.nomad) continue; const c = w.cults[s.cult]; if (!c || !c.alive || c.power) continue; rows.push({ s, cult: c.id, tier: s.lvl != null ? s.lvl : c.tech, a, done: null }); if (!over.has(c.id)) over.set(c.id, overOf(w, c)); }
    T.cur = { y: w.year, age: leadingAge(w), rows, over }; return;
  }
  const colNow = new Set(), freed = new Set();   // realms made a protectorate of a far more advanced realm this century, or freed from one
  for (const [id, o0] of T.cur.over) { const c = w.cults[id], o = overOf(w, c); if (o === o0) continue;
    if (o != null) { colNow.add(id); if (typeof o === 'number' && w.cults[o].tech >= c.tech + 2) colNow.add('c' + id); }   /* made a client: its top-level sovereign changes (a protectorate of a far more advanced realm is colonial) */
    else if (o0 != null) freed.add(id); }
  for (const r of T.cur.rows) {
    if (r.done) continue; const s = r.s;
    if (s.dead) { if (WAR_END.has(s.endKind)) r.done = 'raze'; else if (s.cult !== r.cult) r.done = kin(w, s.cult, r.cult) ? 'i' : 'f'; else r.done = 'gone'; continue; }
    if (s.cult === r.cult) {
      if (colNow.has(r.cult)) { r.done = 'f'; if (colNow.has('c' + r.cult)) { r.col = true; T.colOf.set('r' + r.cult, overOf(w, w.cults[r.cult])); } }
      else if (freed.has(r.cult)) { r.done = 'i'; if (T.colOf.has('r' + r.cult)) { r.decol = true; T.colOf.delete('r' + r.cult); } }
      continue;
    }
    const n = w.cults[s.cult]; r.done = n && !n.power && kin(w, s.cult, r.cult) ? 'i' : 'f';
    if (r.done === 'f' && n && n.tech >= r.tier + 2) { r.col = true; T.colOf.set(s.id, s.cult); }
    else if (r.done === 'i' && T.colOf.get(s.id) === r.cult) { r.decol = true; T.colOf.delete(s.id); }
    else if (r.done === 'f') T.colOf.delete(s.id);
  }
}

function close(w, T) {
  const b = T.acc[bucketOf(T.cur.age)], tot = { area: 0, f: 0, i: 0 }; b.cents++;
  for (const r of T.cur.rows) {
    b.area += r.a; b.n++; tot.area += r.a; if (r.tier <= T.cur.age - 2) b.gap += r.a;   /* land two or more ages behind the leaders (a diagnostic, not a target) */
    if (r.done === 'f' || r.done === 'raze') { b.f += r.a; tot.f += r.a; if (r.done === 'raze') b.raze += r.a; if (r.col) b.col += r.a; }
    else if (r.done === 'i') { b.i += r.a; tot.i += r.a; if (r.decol) b.decol += r.a; }
  }
  if (tot.area) T.cent.push([T.cur.y, T.cur.age, Math.round((100 * tot.f) / tot.area), Math.round((100 * tot.i) / tot.area)]);
}

// summary: per leading age, foreign / internal % (with colonial, decolonisation and razed shares), and the
// raw sums so several worlds can be pooled
export function turnoverSummary(T) {
  const out = {};
  T.acc.forEach((b, k) => {
    const p = (v) => (b.area ? +((100 * v) / b.area).toFixed(1) : null), key = 'to' + BUCKETS[k].replace('-', '_');
    out[key + 'F'] = p(b.f); out[key + 'I'] = p(b.i); out[key + 'Col'] = p(b.col); out[key + 'Decol'] = p(b.decol); out[key + 'Raze'] = p(b.raze); out[key + 'C'] = b.cents; out[key + 'Gap'] = p(b.gap);
  });
  out.toRaw = T.acc.map((b) => [b.area, b.f, b.i, b.col, b.decol, b.raze, b.cents, b.gap]);
  return out;
}
