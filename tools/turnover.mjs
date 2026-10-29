// Territorial turnover, as in the Old World reconstruction (Oct 29): the share of land held by settled
// realms at the start of a century whose sovereign changed at least once during it, split into
// foreign (an existing realm took it, or razed it in war) and internal (a breakaway, successor or
// reunion within one family of realms). Weighted by the land each town holds (w.owner cells) and
// bucketed by the owner's age (tech tier) at the start of the century. Becoming a client does not count.
import { N } from '../src/core.js';

export const BUCKETS = ['1-2', '3', '4', '5', '6', '7', '8', '9-10'];
export const bucketOf = (t) => (t <= 2 ? 0 : t >= 9 ? 7 : t - 2);
const WAR_END = new Set(['sacked', 'nuked', 'dragon', 'swallowed']);   /* a town that ends in war is land taken from its realm */

export function makeTurnover() { return { cur: null, acc: BUCKETS.map(() => ({ area: 0, f: 0, i: 0, raze: 0, colonial: 0, n: 0 })), cent: [] }; }

// does realm a descend from realm b (or b from a) within a few generations?
function kin(w, a, b) {
  for (const [x, y] of [[a, b], [b, a]]) { let c = w.cults[x]; for (let k = 0; k < 8 && c; k++) { if (c.pid === y) return true; c = c.pid != null ? w.cults[c.pid] : null; } }
  return false;
}

export function turnoverYear(w, T) {
  if (w.year % 100 === 0 || !T.cur) {
    if (T.cur) close(w, T);
    const area = new Map(); for (let i = 0; i < N; i++) { const k = w.owner[i]; if (k >= 0) area.set(k, (area.get(k) || 0) + 1); }
    const rows = [];
    for (const [k, a] of area) { const s = w.sets[k]; if (!s || s.dead || s.nomad) continue; const c = w.cults[s.cult]; if (!c || !c.alive || c.power) continue; rows.push({ s, cult: c.id, tier: c.tech, a, done: null }); }
    T.cur = { y: w.year, rows }; return;
  }
  for (const r of T.cur.rows) {
    if (r.done) continue; const s = r.s;
    if (s.dead) { if (WAR_END.has(s.endKind)) r.done = 'raze'; else if (s.cult !== r.cult) r.done = kin(w, s.cult, r.cult) ? 'i' : 'f'; else r.done = 'gone'; continue; }
    if (s.cult === r.cult) continue;
    const n = w.cults[s.cult]; r.done = n && !n.power && kin(w, s.cult, r.cult) ? 'i' : 'f'; r.colonial = r.done === 'f' && n && n.tech >= r.tier + 2;
  }
}

function close(w, T) {
  const tot = { area: 0, f: 0, i: 0 };
  for (const r of T.cur.rows) {
    const b = T.acc[bucketOf(r.tier)]; b.area += r.a; b.n++; tot.area += r.a;
    if (r.done === 'f' || r.done === 'raze') { b.f += r.a; tot.f += r.a; if (r.done === 'raze') b.raze += r.a; if (r.colonial) b.colonial += r.a; }
    else if (r.done === 'i') { b.i += r.a; tot.i += r.a; }
  }
  if (tot.area) T.cent.push([T.cur.y, Math.round((100 * tot.f) / tot.area), Math.round((100 * tot.i) / tot.area)]);
}

// summary: per bucket foreign / internal / total %, with the town-centuries behind it
export function turnoverSummary(T) {
  const out = {};
  T.acc.forEach((b, k) => {
    const p = (v) => (b.area ? +((100 * v) / b.area).toFixed(1) : null), key = 'to' + BUCKETS[k].replace('-', '_');
    out[key + 'F'] = p(b.f); out[key + 'I'] = p(b.i); out[key + 'N'] = b.n; out[key + 'Raze'] = p(b.raze); out[key + 'Col'] = p(b.colonial);
  });
  const all = T.acc.reduce((a, b) => ({ area: a.area + b.area, f: a.f + b.f, i: a.i + b.i }), { area: 0, f: 0, i: 0 });
  out.toAllF = all.area ? +((100 * all.f) / all.area).toFixed(1) : null; out.toAllI = all.area ? +((100 * all.i) / all.area).toFixed(1) : null;
  return out;
}
