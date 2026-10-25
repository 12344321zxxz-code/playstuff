// Wars as shared conflicts (war & sovereignty, slice 1a). One record per war, holding every realm in
// it on one of two sides; each side has a lead (the realm that declared it, the realm attacked).
// Allies join a side instead of starting wars of their own, so one war has one ending. Each realm in
// a war keeps a `c.war` (the bridge older code reads: foe = the other side's lead, since, until,
// taken, lost) pointing at its conflict by `cid`. When a war ends, every pair across the two sides
// gets a truce: no new war and no raids between them until it runs out. A decisive war buys a long
// peace, a draw a short one.
//   w.conflicts[id] = { id, since, until, name, sides: [{ lead, members: [ids] }, { lead, members }] }
//   w.rel['a-b'] = { truce: untilYear, by: conflict id }
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
  K.sides[s].members.push(o.id); o.war = { foe: K.sides[1 - s].lead, since: w.year, until: K.until, taken: 0, lost: 0, mine: s === 0, cid: K.id, ally: true };
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
