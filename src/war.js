// Wars as shared conflicts (war & sovereignty, slice 1a). One record per war, holding every realm in
// it on one of two sides; each side has a lead (the realm that declared it, the realm attacked).
// Allies join a side instead of starting wars of their own, so one war has one ending. Each realm in
// a war keeps a `c.war` (the bridge older code reads: foe = the other side's lead, since, until,
// taken, lost) pointing at its conflict by `cid`. When a war ends, every pair across the two sides
// gets a truce: no new war and no raids between them until it runs out. A decisive war buys a long
// peace, a draw a short one.
//   w.conflicts[id] = { id, since, until, name, sides: [{ lead, members: [ids] }, { lead, members }] }
//   w.rel['a-b'] = { truce: untilYear, by: conflict id }
import { wrapDx, W } from './core.js';
import { tally } from './ledger.js';

const pairKey = (a, b) => (a < b ? a + '-' + b : b + '-' + a);
const conflicts = (w) => w.conflicts || (w.conflicts = {});
const rels = (w) => w.rel || (w.rel = {});

export const conflictOf = (w, c) => (c && c.war && c.war.cid != null ? conflicts(w)[c.war.cid] || null : null);
export const sideOf = (K, id) => (K.sides[0].members.includes(id) ? 0 : K.sides[1].members.includes(id) ? 1 : -1);
// are a and b on opposite sides of the same war?
export function atWar(w, a, b) {
  if (!a || !b || !a.war || !b.war) return false;
  if (a.war.cid == null || b.war.cid == null) return a.war.foe === b.id || b.war.foe === a.id;   /* an older save */
  if (a.war.cid !== b.war.cid) return false; const K = conflicts(w)[a.war.cid]; if (!K) return false;
  const sa = sideOf(K, a.id), sb = sideOf(K, b.id); return sa >= 0 && sb >= 0 && sa !== sb;
}
// everyone fighting against c
export function enemiesOf(w, c) { const K = conflictOf(w, c); if (!K) return c && c.war ? [c.war.foe] : []; const s = sideOf(K, c.id); return s < 0 ? [] : K.sides[1 - s].members.slice(); }
export function alliesOf(w, c) { const K = conflictOf(w, c); if (!K) return []; const s = sideOf(K, c.id); return s < 0 ? [] : K.sides[s].members.filter((id) => id !== c.id); }

export function newConflict(w, a, d, until, extra) {
  const C = conflicts(w); w.conflictN = (w.conflictN || 0) + 1; const id = w.conflictN;
  const K = { id, since: w.year, until, sides: [{ lead: a.id, members: [a.id] }, { lead: d.id, members: [d.id] }] }; C[id] = K;
  a.war = Object.assign({ foe: d.id, since: w.year, until, taken: 0, lost: 0, mine: true, cid: id }, extra || {});
  d.war = { foe: a.id, since: w.year, until, taken: 0, lost: 0, mine: false, cid: id };
  return K;
}
// o comes into the war K on side s (0 = the attackers)
export function joinConflict(w, o, K, s) {
  if (o.war || sideOf(K, o.id) >= 0) return false;
  K.sides[s].members.push(o.id); if (K.pop0) { K.pop0[s] += o.pop; } o.war = { foe: K.sides[1 - s].lead, since: w.year, until: K.until, taken: 0, lost: 0, mine: s === 0, cid: K.id, ally: true };
  return true;
}
// c leaves its war alone (an ally gone, or sworn to the Oath); a lead leaving ends the whole war: returns true then
export function leaveConflict(w, c) {
  const K = conflictOf(w, c); c.war = null; if (!K) return false; const s = sideOf(K, c.id); if (s < 0) return false;
  if (K.sides[s].lead === c.id) return true;
  K.sides[s].members = K.sides[s].members.filter((id) => id !== c.id); return false;
}
// the end: every member leaves, and every pair across the sides gets a truce of `years`
export function closeConflict(w, K, years) {
  const C = conflicts(w); delete C[K.id];
  for (const s of [0, 1]) for (const id of K.sides[s].members) { const c = w.cults[id]; if (c && c.war && c.war.cid === K.id) c.war = null; }
  if (years > 0) for (const a of K.sides[0].members) for (const b of K.sides[1].members) setTruce(w, a, b, w.year + years, K.id);
}
export function setTruce(w, a, b, until, by) { const R = rels(w), k = pairKey(a, b), r = R[k] || (R[k] = {}); if (!(r.truce > until)) { r.truce = until; r.by = by; } }
export const truceLeft = (w, a, b) => { const r = rels(w)[pairKey(a, b)]; return r && r.truce > w.year ? r.truce - w.year : 0; };
export function trucesOf(w, c) { const out = []; for (const k in rels(w)) { const r = w.rel[k]; if (!(r.truce > w.year)) continue; const [a, b] = k.split('-').map(Number); if (a === c.id || b === c.id) out.push({ other: a === c.id ? b : a, until: r.truce }); } return out; }
// how long the peace lasts: a decisive war (many towns changed hands one way, a capital taken) buys
// a long one, a draw a short one
export function truceYears(got, lost, years, capital) { return Math.min(60, Math.round(10 + 6 * Math.abs(got - lost) + years / 3 + (capital ? 10 : 0))); }
// keep the books tidy: wars whose realms are all gone, truces long past
export function tidyWars(w) {
  for (const id in conflicts(w)) { const K = w.conflicts[id]; const alive = (s) => K.sides[s].members.some((m) => w.cults[m] && w.cults[m].alive && w.cults[m].war && w.cults[m].war.cid === K.id); if (!alive(0) || !alive(1)) closeConflict(w, K, 0); }
  for (const k in rels(w)) { const r = w.rel[k]; if (!(r.truce > w.year - 50)) delete w.rel[k]; }
}

// ---------- (slice 1b) aims, occupation, the will to go on, and how wars end ----------
// Every war is for something: land (the border towns nearest the attacker), restore (a crown or an
// old realm's towns), tribute (the enemy court, to make it pay) or trade (an enemy entrepôt's tolls).
// Towns taken in a war are occupied, not annexed: s.occ = { by, cid, since }. The sovereign keeps them
// on the map (hatched in the occupier's colour), but they pay no one and send no soldiers. Each year
// every war reads its two sides: will = stakes × progress − exhaustion, where exhaustion is what the
// war has cost (people lost, land occupied, a threatened capital, hunger, cohesion lost). Nothing
// ticks by itself. The side whose will breaks first concedes; an aim held two years is won outright.
// The peace is one settlement for the whole conflict, and only then do towns change hands.
//   K.aim = { kind, towns: [ids], name }   K.stakes = [a, d]   K.lost = [people, people]
//   K.pop0 / K.coh0: each side at the start   K.last: the last year anyone fought

const d2 = (a, b) => wrapDx(a.x - b.x) ** 2 + (a.y - b.y) ** 2;
// o: { relic, reclaim, horde, ratio (our strength over theirs), far, trade (merchants want tolls), press, hungry }
export function pickAim(w, c, f, o) {
  const mine = [], theirs = [];
  for (const s of w.sets) { if (s.dead || s.nomad) continue; if (s.cult === c.id) mine.push(s); else if (s.cult === f.id && !s.occ) theirs.push(s); }
  const gap = new Map(); for (const s of theirs) { let d = 1e9; for (const m of mine) { const q = d2(m, s); if (q < d) d = q; } gap.set(s, d); }
  const nearest = (L) => L.sort((a, b) => gap.get(a) - gap.get(b));
  if (o.relic) { const t = theirs.find((s) => s.id === o.relic.at); if (t) return { kind: 'restore', towns: [t.id], name: o.relic.name }; }
  if (o.reclaim) { const ts = nearest(theirs.filter((s) => o.reclaim.towns.includes(s.id))).slice(0, 6); if (ts.length) return { kind: 'restore', towns: ts.map((s) => s.id), name: o.reclaim.name }; }
  if (!theirs.length) return { kind: o.horde ? 'tribute' : 'land', towns: [] };
  if ((o.horde || (o.ratio > 3 && o.far)) && !f.over && f.big && !f.big.occ) return { kind: 'tribute', towns: [f.big.id] };   /* to make them pay: the court is the aim */
  if (o.trade) { const ent = nearest(theirs.filter((s) => s.entrepot))[0]; if (ent && gap.get(ent) < 45 * 45) return { kind: 'trade', towns: [ent.id], name: ent.name }; }
  const n = Math.max(1, Math.min(4, theirs.length - 1, 1 + (o.press ? 1 : 0) + (o.ratio > 2 ? 1 : 0) + (o.hungry ? 1 : 0)));
  return { kind: 'land', towns: nearest(theirs).slice(0, n).map((s) => s.id) };
}
export function aimText(w, K) {
  const a = K.aim; if (!a) return ''; const nm = (id) => { const s = w.sets.find((q) => q.id === id); return s ? s.name : null; }, names = a.towns.map(nm).filter(Boolean);
  const two = (L) => (L.length <= 2 ? L.join(' and ') : `${L[0]}, ${L[1]} and ${L.length - 2} more`);
  return a.kind === 'restore' ? `to take back ${a.name || two(names)}` : a.kind === 'tribute' ? 'to make them pay tribute' : a.kind === 'trade' ? `for the tolls of ${a.name || names[0]}` : names.length ? `for ${two(names)}` : 'for land';
}
// people lost in the fighting, counted against the side that lost them; any fight counts as contact
export function bleed(w, c, n) { const K = conflictOf(w, c); if (!K || !K.lost) return; const s = sideOf(K, c.id); if (s >= 0) { K.lost[s] += n; K.last = w.year; } }
function exhaustion(w, K, s) {
  const lead = w.cults[K.sides[s].lead]; let pop = 0, occ = 0; for (const id of K.sides[s].members) { const c = w.cults[id]; if (c && c.alive) { pop += c.pop; occ += c._occP || 0; } }
  const e = { lost: 3 * K.lost[s] / Math.max(1, K.pop0[s]), held: 1.5 * (pop ? occ / pop : 0), capital: lead.big && lead.big.occ ? 0.35 : 0, hunger: 0.4 * (lead.count ? Math.min(1, lead.hungry / lead.count) : 0), cohesion: 1.2 * Math.max(0, K.coh0[s] - lead.coh) };
  let t = 0; for (const k in e) t += e[k]; return { t, e };
}
// H: { endWar(w, lead, out), annex(w, town, to), subjugate(w, loser, winner), release(w, client, how) } from people.js and capture.js
export function warsYear(w, H) {
  const byId = new Map(); for (const s of w.sets) if (!s.dead) byId.set(s.id, s);
  // an occupation lasts as long as the war that made it
  for (const c of w.cults) c._occP = 0;
  for (const s of byId.values()) { if (!s.occ) continue; const o = w.cults[s.occ.by], sv = w.cults[s.cult]; if (!o || !o.alive || s.cult === s.occ.by || !atWar(w, o, sv)) { s.occ = null; continue; } sv._occP += s.pop; }
  for (const c of w.cults) c.occShare = c._occP && c.pop > 0 ? Math.min(1, c._occP / c.pop) : 0;
  for (const id of Object.keys(conflicts(w))) {
    const K = w.conflicts[id]; if (!K || !K.aim) continue;   /* an older save's war: the old clock still ends it */
    const A = w.cults[K.sides[0].lead], D = w.cults[K.sides[1].lead]; if (!A || !D || !A.alive || !D.alive) continue;
    const yrs = w.year - K.since; if (yrs < 2) continue;
    const aimT = K.aim.towns.map((t) => byId.get(t)).filter((s) => s && sideOf(K, s.cult) === 1), N = aimT.length;
    let held = 0, long = 0; for (const s of aimT) if (s.occ && sideOf(K, s.occ.by) === 0) { held++; if (w.year - s.occ.since >= 2) long++; }
    const pA = N ? held / N : 0, xa = exhaustion(w, K, 0), xd = exhaustion(w, K, 1);
    const willA = K.stakes[0] * (0.5 + pA) - xa.t, willD = K.stakes[1] * (1 - 0.5 * pA) + 0.1 - xd.t;
    K.will = [+willA.toFixed(2), +willD.toFixed(2)]; K.exh = [xa.e, xd.e]; K.prog = pA;
    let out = null, how = 'will';
    if (N && long === N) { out = 'won'; how = 'held'; }
    else if (willD < 0 && willD <= willA) out = 'won';
    else if (willA < 0) out = 'lost';
    else if (w.year - (K.last || K.since) >= 8 || yrs >= 60) { out = 'none'; how = 'failsafe'; }
    if (out) settle(w, K, out, how, aimT, H);
  }
}
function settle(w, K, out, how, aimT, H) {
  const A = w.cults[K.sides[0].lead], D = w.cults[K.sides[1].lead], r = { kind: 'status', how, annexed: [], aim: K.aim.kind, capital: false };
  if (out === 'won') {
    const mine = aimT.filter((s) => !s.occ || sideOf(K, s.occ.by) === 0);   /* an aim town some ally of theirs still holds is not given up */
    if (K.aim.kind === 'free') { if (A.over && A.over.kind === 'realm' && A.over.id === D.id) H.release(w, A, `the ${A.name} win their freedom from the ${D.name}`); r.kind = 'freed'; }
    else if (K.aim.kind === 'trade' && mine.length) { const s = mine[0]; s.tollTo = A.id; s.tollUntil = w.year + 40; r.kind = 'toll'; r.town = s.name; }
    else if (K.aim.kind === 'tribute' && H.subjugate(w, D, A, K)) r.kind = 'client';
    else {
      // direct rule or indirect: a realm stretched thin, or across the sea, takes a client rather than provinces; lords short of posts want the land
      const far = A.big && D.big && w.mass && w.mass[A.big.y * W + A.big.x] !== w.mass[D.big.y * W + D.big.x], press = A.hub && (A.hub.st === 'press' || A.hub.st === 'factions');
      if (!press && ((A.span || 0) > 1.1 || far) && !D.over && D.count > mine.length + 2 && H.subjugate(w, D, A, K)) r.kind = 'client';
      else if (mine.length) { for (const s of mine) { if (D.big === s) r.capital = true; r.annexed.push(s.name); H.annex(w, s, A); } r.kind = 'annex'; }
      else if (!D.over && H.subjugate(w, D, A, K)) r.kind = 'client';
    }
    A.wins = (A.wins || 0) + 2; D.wins = Math.max(0, (D.wins || 0) - 2);
  } else if (out === 'lost') {
    if (D.over && D.over.kind === 'realm' && D.over.id === A.id) { H.release(w, D, `the ${D.name} beat the ${A.name} and stop paying them`); r.kind = 'release'; }
    else if (K.aim.kind === 'restore' && K.aim.name && w.claims) { for (const cl of w.claims) if (cl.name === K.aim.name && !cl.done) cl.done = true; r.kind = 'frontier'; r.name = K.aim.name; }
    else { A.owe = 0.04; A.oweTo = D.id; A.oweUntil = w.year + 20; r.kind = 'reparations'; }
    D.wins = (D.wins || 0) + 2; A.wins = Math.max(0, (A.wins || 0) - 2);
  }
  for (const s of w.sets) if (s.occ && s.occ.cid === K.id) s.occ = null;   /* what the peace did not give away goes back */
  tally(w, 'settle_' + r.kind); tally(w, 'end_' + how);
  H.endWar(w, A, r);
}
