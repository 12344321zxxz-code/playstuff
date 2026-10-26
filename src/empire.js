// Imperial governance (war & sovereignty, slice 3). Why empires grow, hold, and come apart.
//   Assessed is not received: each town's dues reach the court times a reach efficiency (distance
//   against the realm's reach, a road or a harbour, the court's authority). The rest stays in the
//   provinces, where it feeds regional houses seated in the great cities far from the capital.
//   A rich regional house with a strong court bargains for autonomy: its province becomes a client
//   that pays tribute. With a weak court it rises, and if it wins the province is a realm of its own.
//   Every few decades an overlord looks again at its clients: near, small ones whose land its lords
//   want are absorbed. When a realm collapses, the successors form around its regional houses. And a
//   small successor on a fallen empire's lands may submit to whoever holds the old capital and claim.
//   c.regions = [{ seat: town id, name, w: smoothed income, since, eff, pop }]   c.recv: share received
import { newCult, strength } from './people.js';
import { hubReset } from './hub.js';
import { subjugate, release } from './capture.js';
import { record, tally } from './ledger.js';
import { ev, discover } from './story.js';
import { tongueGap, word } from './tongues.js';
import { atWar } from './war.js';
import { W, wrapDx } from './core.js';

const MAXC = 36;   /* the living cap is 30; a province breaking away may take it a little past, as colonies do */
const living = (w) => { let n = 0; for (const c of w.cults) if (c.alive && !c.power) n++; return n; };
const dist = (a, b) => Math.hypot(wrapDx(a.x - b.x), a.y - b.y);
const houseName = (w, c) => `the House of ${word(w, c.lang, w.rnd() < 0.5 ? 1 : 2)}`;
const mass = (w, s) => w.mass[s.y * W + s.x];

// how much of a town's dues reaches the court
function effOf(w, c, s, b) {
  const over = mass(w, s) !== mass(w, b), cost = dist(s, b) * (s.links ? 0.7 : 1) * (over ? (c.arts.navigation ? 1.1 : c.arts.sailing ? 1.6 : 2.5) : 1) * (over && s.port ? 0.8 : 1);
  const A = c.hub ? c.hub.A : 0.6; return Math.max(0.12, Math.min(1, 1.1 - (0.9 * cost) / Math.max(20, c.reachR || 30))) * (0.7 + 0.3 * A);
}

export function empireYear(w) {
  const byId = new Map(); for (const s of w.sets) if (!s.dead) byId.set(s.id, s);
  const towns = new Map(); for (const s of byId.values()) { if (s.nomad) continue; const L = towns.get(s.cult); if (L) L.push(s); else towns.set(s.cult, [s]); }
  for (const c of w.cults) {
    if (!c.alive || c.power) continue; const b = c.big, T = towns.get(c.id); c.recv = 1;
    if (!b || !T || T.length < 8 || !c.hub) { c.regions = null; continue; }
    // receipts, town by town
    let tot = 0, got = 0; const eff = new Map(); for (const s of T) { const e = s === b ? 1 : effOf(w, c, s, b); eff.set(s, e); tot += s.pop; got += s.pop * e; }
    c.recv = tot > 0 ? got / tot : 1;
    // regional seats: the great cities far from the court, kept while they qualify
    const R = c.regions || (c.regions = []), reach = Math.max(20, c.reachR || 30);
    for (let k = R.length - 1; k >= 0; k--) { const s = byId.get(R[k].seat); if (!s || s.cult !== c.id || s === b || s.tier < 2) R.splice(k, 1); }
    if (w.year % 20 === c.id % 20 || !R.length) {
      const cand = T.filter((s) => s !== b && s.tier >= 2 && !s.occ && dist(s, b) > 0.6 * reach && !R.some((r) => r.seat === s.id)).sort((p, q) => q.pop - p.pop);
      const cap = Math.min(3, Math.max(1, Math.floor(T.length / 15)));
      for (const s of cand) { if (R.length >= cap) break; if (R.some((r) => dist(byId.get(r.seat), s) < 25)) continue; R.push({ id: (w.regionN = (w.regionN || 0) + 1), seat: s.id, name: houseName(w, c), w: 0, since: w.year }); }
    }
    if (!R.length) continue;
    // each town belongs to the nearest seat, if that is clearly nearer than the court
    const seats = R.map((r) => byId.get(r.seat)); for (const r of R) { r.pop = 0; r.kept = 0; r.towns = 0; r.eff = 0; }
    for (const s of T) { s._reg = null; let bi = -1, bd = dist(s, b) * 0.8; for (let k = 0; k < seats.length; k++) { const d = dist(s, seats[k]); if (d < bd) { bd = d; bi = k; } } if (bi < 0) continue; const r = R[bi]; r.pop += s.pop; r.kept += s.pop * (1 - eff.get(s)); r.towns++; r.eff += s.pop * eff.get(s); s._reg = r.id; }
    const h = c.hub, rate = ((0.25 + (c.surplus || 0)) * Math.max(0.02, h.X - (c.tribute || 0))) / (100 * (c.boomL || 1));
    for (const r of R) { r.eff = r.pop > 0 ? r.eff / r.pop : 1; r.w += (r.kept * rate - r.w) / 30; r.c = (r.c || 0) + (Math.max(0, r.pop - r.kept) * rate - (r.c || 0)) / 30; r.share = r.w / Math.max(1e-9, r.w + r.c); }   /* the house's wealth against what the court takes from the same province */
    // a house rich enough, with a court too weak to hold it or too far to collect, makes its move
    if (c.over || c.war) continue;
    for (let k = 0; k < R.length; k++) {
      const r = R[k], seat = seats[k]; if (!seat || r.towns < 3 || w.year - r.since < 30) continue;
      const gap = tongueGap(w, seat.lang, c.langId), far = mass(w, seat) !== mass(w, b);
      const p = 0.001 + 0.04 * Math.max(0, r.share - 0.3) + (h.A < 0.35 ? 0.008 : 0) + (h.st === 'civil' ? 0.02 : h.st === 'factions' ? 0.006 : 0) + (gap > 2 ? 0.004 : 0) + (far ? 0.004 : 0);
      if (w.rnd() >= p) continue;
      const why = { x: seat.x, y: seat.y, terms: { share: +r.share.toFixed(2), eff: +r.eff.toFixed(2), A: +h.A.toFixed(2), gap: gap === Infinity ? 99 : gap } };
      if (h.A >= 0.45 && r.eff < 0.55) { if (living(w) >= MAXC) continue; const nc = secede(w, c, R, k, T, 'autonomy', why); if (nc && subjugate(w, nc, c)) nc.over.house = r.name; break; }   /* the court can still make them pay, not govern them */
      const mine = strength(c, Math.max(1, c.pop - r.pop)) * (0.4 + 0.6 * h.A), theirs = strength(c, r.pop) * (1 + Math.min(1, r.share)), roll = w.rnd(), pw = theirs / (theirs + mine);
      const id = record(w, 'house-rising', [c.id], Object.assign({ p: pw, roll, note: `${r.name} of ${seat.name}` }, why));
      if (roll < pw && living(w) < MAXC) { secede(w, c, R, k, T, 'secession', Object.assign(why, { cause: id })); break; }
      r.w *= 0.3; c.coh = Math.max(0.05, c.coh - 0.08); seat.pop *= 0.92; tally(w, 'risingCrushed');
      ev(w, `${r.name.replace(/^t/, 'T')} raises ${seat.name} against the court of the ${c.name}, and loses. Its lands are given to men the court can trust.`, seat.x, seat.y, c.color, 1);
      break;
    }
  }
  // overlords look again at their clients every thirty years
  for (const c of w.cults) {
    if (!c.alive || c.power || !c.over || c.over.kind !== 'realm' || c.war) continue; const o = w.cults[c.over.id]; if (!o || !o.alive || o.war || !o.big || !c.big) continue;
    if ((w.year - c.over.since) % 30 !== 29) continue; const h = o.hub, want = h && (h.st === 'press' || h.st === 'factions' || h.pi > 1.05);
    const near = mass(w, c.big) === mass(w, o.big) && dist(c.big, o.big) < 1.2 * Math.max(20, o.reachR || 30), small = c.count <= Math.max(6, 0.4 * o.count), kin = tongueGap(w, c.langId, o.langId) <= 3;
    if (!(near && small && (want || kin)) || w.rnd() > 0.5) continue;
    let n = 0; for (const s of towns.get(c.id) || []) { s.cult = o.id; s.trade = 0; n++; } for (const s of w.sets) if (!s.dead && s.cult === c.id) s.cult = o.id;   /* the herders too */
    release(w, c, `absorbed by the ${o.name}`); record(w, 'absorb', [o.id, c.id], { x: c.big.x, y: c.big.y, note: `the ${c.name}, ${n} towns, ruled directly from ${o.big.name || 'the court'}`, terms: { want: want ? 1 : 0, kin: kin ? 1 : 0 } }); tally(w, 'absorbed');
    ev(w, `The ${o.name} stop ruling the ${c.name} through their own lords. Governors come from ${o.big.name || 'the court'}, and the old court of ${c.big.name || 'the ' + c.name} is shut.`, c.big.x, c.big.y, o.color, c.count >= 8 ? 0 : 1);
  }
  // restoration by submission: a small successor on an old empire's lands bows to whoever holds its capital
  for (const cl of w.claims || []) {
    if (cl.done || cl.holder == null || !(cl.share >= 0.3)) continue; const hc = w.cults[cl.holder]; if (!hc || !hc.alive || hc.power || !hc.big) continue;
    for (const c of w.cults) {
      if (!c.alive || c.power || c === hc || !c.big || c.over || c.war || hc.war || !cl.towns.includes(c.big.id) || c.count > 0.25 * hc.count || w.rnd() > 0.01) continue;
      if (!w.langs || c.langId == null || hc.langId == null || w.langs[c.langId].root !== w.langs[hc.langId].root) continue;
      let n = 0; for (const s of w.sets) if (!s.dead && s.cult === c.id) { s.cult = hc.id; s.trade = 0; n++; }
      record(w, 'submit', [hc.id, c.id], { x: c.big.x, y: c.big.y, note: `the ${c.name} return to ${cl.name}`, terms: { towns: n, share: cl.share } }); tally(w, 'submitted');
      ev(w, `The ${c.name} send their keys to ${hc.big.name || 'the ' + hc.name}. ${cl.name[0].toUpperCase() + cl.name.slice(1)} is a little more whole again.`, c.big.x, c.big.y, hc.color, 1);
    }
  }
}

// a province goes: as a client (autonomy) or a realm of its own (secession), with its house on the throne
export function secede(w, c, R, k, T, how, why) {
  const r = R[k], seat = w.sets.find((s) => s.id === r.seat && !s.dead); if (!seat) return null;
  const nc = newCult(w, c); let n = 0, big = null;
  if (seat.lang != null && seat.lang !== c.langId && w.langs && w.langs[seat.lang]) { nc.langId = seat.lang; nc.lang = w.langs[seat.lang].snd; }
  for (const s of T || w.sets) if (!s.dead && s.cult === c.id && s._reg === r.id && !s.occ && !s.siege && s !== c.big) { s.cult = nc.id; n++; if (!big || s.pop > big.pop) big = s; }
  nc.count = n; nc.big = seat.cult === nc.id ? seat : big; nc.coh = 0.85; if (!n) return null; nc.house = { name: r.name, since: w.year }; hubReset(w, nc, 0.7);
  if (c.hub && c.count > 0) c.hub.E *= Math.max(0.3, 1 - n / c.count); c.coh = Math.min(1, c.coh + 0.1);
  R.splice(k, 1); tally(w, how);
  record(w, how, [c.id, nc.id], Object.assign({ note: `${r.name} of ${seat.name}, ${n} towns` }, why || { x: seat.x, y: seat.y }));
  if (how !== 'heir') ev(w, how === 'autonomy' ? `${r.name.replace(/^t/, 'T')} rules ${seat.name} and its province in its own name now. The ${c.name} still take their tribute, and nothing else. They call themselves the ${nc.name}.` : `${r.name.replace(/^t/, 'T')} rises in ${seat.name}, and the ${c.name} cannot put it down. The province is a realm of its own: the ${nc.name}.`, seat.x, seat.y, nc.color, n >= 10 ? 0 : 1);
  if (how === 'secession') discover(w, 'schism', seat.x, seat.y);
  return nc;
}
// collapse: successors form around the regional houses first
export function regionSuccessors(w, c) {
  const R = c.regions; if (!R || !R.length || !c.big) return [];
  const out = []; while (R.length && living(w) < MAXC) { const nc = secede(w, c, R, 0, null, 'heir'); if (!nc) break; if (nc.count) out.push(nc); }
  return out;
}
