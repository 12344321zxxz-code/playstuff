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
import { strength } from './people.js';

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
  for (const k in rels(w)) { const r = w.rel[k]; if (!(r.truce > w.year - 50) && !(r.terms && r.terms.length) && !(r.crisis > 0)) delete w.rel[k]; }   /* standing terms keep their entry */
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
  if (o.horde && o.ratio > 1.5 && f.big && !f.big.occ) { const T = nearest(theirs).slice(0, Math.max(2, Math.ceil(theirs.length * (o.ratio > 3 ? 0.6 : 0.35)))); if (!T.includes(f.big)) T.push(f.big); return { kind: 'land', towns: T.map((s) => s.id), horde: true }; }   /* (Oct 29) a strong horde comes to rule: a conquest dynasty */
  if ((o.horde || (o.ratio > 3 && o.far)) && !f.over && f.big && !f.big.occ) return { kind: 'tribute', towns: [f.big.id] };   /* to make them pay: the court is the aim */
  if (o.dragon) { const rich = nearest(theirs.filter((s) => s.entrepot || (s.ores & 16)))[0]; if (rich && gap.get(rich) < 50 * 50) return { kind: 'trade', towns: [rich.id], name: rich.name }; if (!f.over && f.big && !f.big.occ) return { kind: 'tribute', towns: [f.big.id] }; }   /* (slice 5) a dragon wants gold: a gold town or an entrepôt, or a rich court to pay it */
  if (o.trade) { const ent = nearest(theirs.filter((s) => s.entrepot))[0]; if (ent && gap.get(ent) < 45 * 45) return { kind: 'trade', towns: [ent.id], name: ent.name }; }
  // (Oct 29) how much a war is for grows with how lopsided it is: a realm two or more ages ahead means to take the whole country
  const ageGap = (c.tech || 0) - (f.tech || 0), want = 2 + (o.press ? 1 : 0) + (o.hungry ? 1 : 0) + (o.ratio > 2 ? 1 : 0) + (o.ratio > 4 ? 2 : 0) + (ageGap >= 2 ? 4 * (ageGap - 1) : 0);
  const frac = 0.2 + (o.ratio > 1.5 ? 0.15 : 0) + (o.ratio > 3 ? 0.25 : 0) + (o.press ? 0.1 : 0) + (o.hungry ? 0.1 : 0);   /* a province, not a village: a share of their land */
  const n = Math.max(1, Math.min(ageGap >= 2 ? theirs.length : Math.max(1, theirs.length - 1), ageGap >= 2 ? 30 : 16, Math.max(want, Math.ceil(theirs.length * frac))));
  return { kind: 'land', towns: nearest(theirs).slice(0, n).map((s) => s.id) };
}
export function aimText(w, K) {
  const a = K.aim; if (!a) return ''; const nm = (id) => { const s = w.sets.find((q) => q.id === id); return s ? s.name : null; }, names = a.towns.map(nm).filter(Boolean);
  const two = (L) => (L.length <= 2 ? L.join(' and ') : `${L[0]}, ${L[1]} and ${L.length - 2} more`);
  if (a.kind === 'raze') return names.length ? `to destroy ${two(names)}` : 'to destroy them';
  return a.kind === 'restore' ? `to take back ${a.name || two(names)}` : a.kind === 'tribute' ? 'to make them pay tribute' : a.kind === 'trade' ? `for the tolls of ${a.name || names[0]}` : names.length ? `for ${two(names)}` : 'for land';
}
// people lost in the fighting, counted against the side that lost them; any fight counts as contact
export function bleed(w, c, n) { const K = conflictOf(w, c); if (!K || !K.lost) return; const s = sideOf(K, c.id); if (s >= 0) { K.lost[s] += n; K.last = w.year; } }
function exhaustion(w, K, s) {
  const lead = w.cults[K.sides[s].lead]; let pop = 0, occ = 0; for (const id of K.sides[s].members) { const c = w.cults[id]; if (c && c.alive) { pop += c.pop; occ += c._occP || 0; } }
  const e = { lost: 3 * K.lost[s] / Math.max(1, K.pop0[s]), held: 1.5 * (pop ? occ / pop : 0), capital: lead.big && lead.big.occ ? 0.35 : 0, hunger: 0.4 * (lead.count ? Math.min(1, lead.hungry / lead.count) : 0), cohesion: 1.2 * Math.max(0, K.coh0[s] - lead.coh), serving: 0.01 * (w.year - K.since) };   /* years of men away from the fields */
  let t = 0; for (const k in e) t += e[k]; return { t, e };
}
// H: { endWar(w, lead, out), annex(w, town, to), subjugate(w, loser, winner), release(w, client, how) } from people.js and capture.js
// (Oct 29) the world's leading age: the most advanced realm holding at least 3% of settled people. Once it is
// the age of the bomb, a norm against taking land holds among the advanced, and colonies go free.
export function leadAge(w) {
  let tot = 0; for (const c of w.cults) if (c.alive && !c.power && c.big) tot += c.pop;
  let t = 0; for (const c of w.cults) if (c.alive && !c.power && c.big && c.pop >= 0.03 * tot && c.tech > t) t = c.tech; return t;
}
export const conquestNorm = (w, c) => (w.leadAge || 0) >= 8 && !c.power;   /* once the leaders have the bomb, the norm binds everyone (a world order, not only the great) */
export function warsYear(w, H) {
  w.leadAge = leadAge(w);
  const byId = new Map(); for (const s of w.sets) if (!s.dead) byId.set(s.id, s);
  // an occupation lasts as long as the war that made it
  for (const c of w.cults) c._occP = 0;
  for (const s of byId.values()) { if (!s.occ) continue; const o = w.cults[s.occ.by], sv = w.cults[s.cult]; if (!o || !o.alive || s.cult === s.occ.by || !atWar(w, o, sv)) { s.occ = null; continue; } sv._occP += s.pop; }
  for (const c of w.cults) c.occShare = c._occP && c.pop > 0 ? Math.min(1, c._occP / c.pop) : 0;
  for (const id of Object.keys(conflicts(w))) {
    const K = w.conflicts[id]; if (!K || !K.aim) continue;   /* an older save's war: the old clock still ends it */
    const A = w.cults[K.sides[0].lead], D = w.cults[K.sides[1].lead]; if (!A || !D || !A.alive || !D.alive) continue;
    const yrs = w.year - K.since; if (yrs < 2) continue;
    const aimT = K.aim.towns.map((t) => byId.get(t)).filter((s) => s && sideOf(K, s.cult) === 1), raze = K.aim.kind === 'raze', N = raze ? K.aim.towns.length : aimT.length;
    let held = 0, long = 0; if (raze) { held = long = N - aimT.length; } else for (const s of aimT) if (s.occ && sideOf(K, s.occ.by) === 0) { held++; if (w.year - s.occ.since >= 2) long++; }   /* a war of destruction progresses as its towns burn */
    const pA = N ? held / N : 0, xa = exhaustion(w, K, 0), xd = exhaustion(w, K, 1);
    // (Oct 29) the balance of strength now weighs on both: the side that is losing the war of numbers knows it
    let sA = 0, sD = 0; for (const s of [0, 1]) for (const id of K.sides[s].members) { const c = w.cults[id]; if (c && c.alive) { const v = strength(c, c.pop); if (s === 0) sA += v; else sD += v; } }
    const bal = 0.5 * Math.log(Math.max(0.2, Math.min(5, sA / Math.max(1, sD))));
    const willA = K.stakes[0] * (0.7 + pA) - xa.t + bal, willD = K.stakes[1] * (1 - 0.5 * pA) + 0.1 - xd.t - bal;
    { const pk = K.peak || (K.peak = [0, 0]); for (const s of [0, 1]) { let sv = 0, pp = 0; for (const id of K.sides[s].members) { const c = w.cults[id]; if (c && c.alive) { sv += c.serving || 0; pp += c.pop; } } if (pp > 0) pk[s] = Math.max(pk[s], sv / pp); } }
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
    if (K.aim.kind === 'raze') { r.kind = 'razed'; r.razed = K.aim.towns.length - aimT.length; }
    else if (K.aim.kind === 'free') { if (A.over && A.over.kind === 'realm' && A.over.id === D.id) H.release(w, A, `the ${A.name} win their freedom from the ${D.name}`); r.kind = 'freed'; }
    else if (K.aim.kind === 'trade' && mine.length) { const s = mine[0]; s.tollTo = A.id; s.tollUntil = w.year + 40; r.kind = 'toll'; r.town = s.name; }
    else if (K.aim.kind === 'tribute' && !conquestNorm(w, A) && H.subjugate(w, D, A, K)) r.kind = 'client';
    else {
      // direct rule or indirect: a realm stretched thin, or across the sea, takes a client rather than provinces; lords short of posts want the land
      const far = A.big && D.big && w.mass && w.mass[A.big.y * W + A.big.x] !== w.mass[D.big.y * W + D.big.x], press = A.hub && (A.hub.st === 'press' || A.hub.st === 'factions');
      const ahead = A.tech >= D.tech + 2;   /* (Oct 29) far ahead and on the same land: direct rule */
      if (!press && (far || ((A.span || 0) > 1.4 && !ahead)) && !D.over && D.count > mine.length + 2 && H.subjugate(w, D, A, K)) r.kind = 'client';
      else if (mine.length && !(conquestNorm(w, A) && w.rnd() > 0.2)) { for (const s of mine) { if (D.big === s) r.capital = true; r.annexed.push(s.name); H.annex(w, s, A); } r.kind = 'annex';
        // (Oct 29) what is left of a small or broken realm goes too: the conquered country, not only a province of it
        const rest = w.sets.filter((s) => !s.dead && !s.nomad && s.cult === D.id), ratio = K.odds || 1;
        if (rest.length && !far && !conquestNorm(w, A) && (rest.length <= (A.tech <= 4 ? 4 : 2) || (ratio >= 3 && rest.length <= 12) || r.capital && ratio >= 1.5 && rest.length <= 8)) { for (const s of rest) { r.annexed.push(s.name); H.annex(w, s, A); } r.whole = true; tally(w, 'realmConquered'); } }
      else if (!D.over && !conquestNorm(w, A) && H.subjugate(w, D, A, K)) r.kind = 'client';
    }
    A.wins = (A.wins || 0) + 2; D.wins = Math.max(0, (D.wins || 0) - 2);
  } else if (out === 'lost') {
    if (D.over && D.over.kind === 'realm' && D.over.id === A.id) { H.release(w, D, `the ${D.name} beat the ${A.name} and stop paying them`); r.kind = 'release'; }
    else if (K.aim.kind === 'restore' && K.aim.name && w.claims) { for (const cl of w.claims) if (cl.name === K.aim.name && !cl.done) cl.done = true; r.kind = 'frontier'; r.name = K.aim.name; }
    else if (K.lost[0] / Math.max(1, K.pop0[0]) > K.lost[1] / Math.max(1, K.pop0[1]) || w.sets.some((s) => !s.dead && s.occ && s.occ.cid === K.id && sideOf(K, s.occ.by) === 1)) { A.owe = 0.04; A.oweTo = D.id; A.oweUntil = w.year + 20; r.kind = 'reparations'; }   /* the defenders made them pay for it */
    else r.kind = 'status';
    D.wins = (D.wins || 0) + 2; A.wins = Math.max(0, (A.wins || 0) - 2);
  }
  // (Oct 29) whoever won keeps the towns it holds at the peace, if it can rule them: near its own land, or two ages ahead of their lords
  // (a war that dies down keeps the lines where they stand: towns held three years or more stay with their holders)
  for (const ws of out === 'won' ? [0] : out === 'lost' ? [1] : [0, 1]) { if (conquestNorm(w, w.cults[K.sides[ws].lead])) continue; const keep = new Map();
    for (const s of w.sets) { if (s.dead || !s.occ || s.occ.cid !== K.id || sideOf(K, s.occ.by) !== ws || sideOf(K, s.cult) !== 1 - ws || (out === 'none' && w.year - s.occ.since < 3)) continue; const o = w.cults[s.occ.by], sv = w.cults[s.cult]; if (!o || !o.alive || o.power) continue;
      let d = 1e9; for (const m of w.sets) if (!m.dead && !m.nomad && m.cult === o.id) { const q = d2(m, s); if (q < d) d = q; }
      if (d <= 30 * 30 || o.tech >= sv.tech + 2) keep.set(s, o); }
    for (const [s, o] of keep) { const sv = w.cults[s.cult]; if (sv.big === s) r.capital = true; r.annexed.push(s.name); H.annex(w, s, o); tally(w, 'heldKept'); }
    if (keep.size && r.kind === 'status') r.kind = ws === 0 ? 'annex' : 'lost'; }
  for (const s of w.sets) if (s.occ && s.occ.cid === K.id) s.occ = null;   /* what the peace did not give away goes back */
  tally(w, 'settle_' + r.kind); tally(w, 'end_' + how);
  // (slice 2) did the stronger side win, and how hard did the war press each side
  if (K.odds != null && r.kind !== 'status') { const attWon = out === 'won', fav = K.odds >= 1 ? attWon : !attWon; tally(w, fav ? 'favWon' : 'favLost'); }
  if (K.peak) { const p = Math.max(K.peak[0], K.peak[1]); tally(w, p >= 0.06 ? 'mobTotal' : p >= 0.02 ? 'mobMid' : 'mobLimited'); }
  H.endWar(w, A, r);
}

// ---------- (slice 2) mobilisation ----------
// Each realm in a war can field a share of its people: capacity (how well the state can raise, pay and
// move men: bureaucracy, railways, the radio, and whether the realm holds together) times commitment
// (its stakes in this war; everything it has when its capital is taken or besieged). c.serving counts
// the men out in bands, marching home or sitting in sieges; it is recounted each year from the
// movers and the sieges, and grows as bands are sent. Serving men are missing from the fields.
export function capacityOf(c) { const A = c.arts; return (0.04 + (A.bureaucracy ? 0.02 : 0) + (A.railways ? 0.04 : 0) + (A.radio ? 0.02 : 0)) * (0.6 + 0.8 * c.coh); }
export function mobBudget(w, c) {
  const K = conflictOf(w, c); if (!K || !K.stakes) return Infinity;   /* an older save's war: no budget */
  const s = sideOf(K, c.id); if (s < 0) return Infinity; const b = c.big, cornered = !!(b && (b.occ || (b.siege && b.siege.by !== c.id)));
  const commit = cornered ? 1 : 0.25 + 0.75 * Math.min(1, K.stakes[s]);
  return Math.max(0, c.pop * capacityOf(c) * commit * (cornered ? 2 : 1) - (c.serving || 0));
}
