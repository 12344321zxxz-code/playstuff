// Story anchors without people (slice 12): ruling houses, crowns, records, and each realm's own
// timeline. A house is a ruling family named as a group, never simulated as people: it takes the
// throne, and a civil war that kills the great houses ends it. A crown is made once per empire; it
// sits in the capital, is carried off when the capital falls, buried when the city is destroyed, dug
// up again centuries later, and the peoples of its old tongue want it back.
import { record } from './ledger.js';
import { ev, discover } from './story.js';
import { word } from './tongues.js';
import { near } from './people.js';
import { wrapDx , peopleText } from './core.js';

export function newHouse(w, c, name) {
  const old = c.house; c.house = { name: name || `the House of ${word(w, c.lang, w.rnd() < 0.5 ? 1 : 2)}`, since: w.year };
  if (old) (c.houses || (c.houses = [])).push({ name: old.name, from: old.since, to: w.year });
  return old;
}
// (slice 5) a crown made for a deed: the slayer of a dragon king
export function relicCrown(w, c, name) {
  if (!c || !c.big) return null; const R = w.crowns || (w.crowns = []), L = w.langs && w.langs[c.langId];
  const r = { id: R.length, name, maker: c.id, owner: c.id, at: c.big.id, root: L ? L.root : null, born: w.year, buried: null, moves: [], x: c.big.x, y: c.big.y, place: c.big.name };
  R.push(r); record(w, 'crown', [c.id], { x: c.big.x, y: c.big.y, note: r.name }); return r;
}
const CROWN = ['the Crown of', 'the Iron Throne of', 'the Sun Disc of', 'the Seal of', 'the Spear of', 'the Gold Mask of', 'the Stone Chair of'];

export function relicsYear(w) {
  const rnd = w.rnd, R = w.crowns || (w.crowns = []), rec = w.feats || (w.feats = {});
  for (const c of w.cults) {
    if (!c.alive || c.power) continue;
    const settled = c.env.sed >= 4 && c.env.sed >= c.env.nomads;
    if (settled && !c.house && c.big) newHouse(w, c);
    // the rise-and-fall strip: one point every ten years
    if (w.year % 10 === 0) { const s = c.series || (c.series = []); s.push([w.year, Math.round(c.pop), +c.coh.toFixed(2), c.hub ? +c.hub.pi.toFixed(2) : 0]); if (s.length > 300) s.shift(); }
    // an empire makes its crown, once
    if (c.big && c.big.name && !c.crownMade && (c.flags.empire || (c.count >= 35 && c.hub && c.hub.form === 'empire'))) {
      c.crownMade = true; const L = w.langs && w.langs[c.langId];
      const r = { id: R.length, name: `${CROWN[(rnd() * CROWN.length) | 0]} ${c.big.name.replace(/^New /, '')}`, maker: c.id, owner: c.id, at: c.big.id, root: L ? L.root : null, born: w.year, buried: null, moves: [], x: c.big.x, y: c.big.y, place: c.big.name };
      R.push(r); record(w, 'crown', [c.id], { x: c.big.x, y: c.big.y, note: r.name });
      ev(w, `In ${c.big.name} the goldsmiths of the ${c.name} make ${r.name}. Whoever holds it rules.`, c.big.x, c.big.y, c.color, 1); discover(w, 'crown', c.big.x, c.big.y);
    }
  }
  const byId = new Map(); for (const s of w.sets) if (!s.dead) byId.set(s.id, s);
  for (const r of R) {
    if (r.buried) {   // dug up again, by whoever lives on top of it now
      if (rnd() < 0.006) { const t = near(w, r.buried.x, r.buried.y, 5, null, true); if (t && !w.cults[t.cult].power) { const c = w.cults[t.cult]; r.buried = null; r.owner = c.id; r.at = t.id; r.moves.push([w.year, c.id, 'dug']); record(w, 'crown', [c.id], { x: t.x, y: t.y, note: `${r.name} dug up` });
        ev(w, `Diggers at ${t.name} find a box of gold under the floor of the old city. It is ${r.name}, lost for ${w.year - r.lost} years. The ${c.name} have it now.`, t.x, t.y, c.color, 0); discover(w, 'crownfound', t.x, t.y); } }
      continue;
    }
    const t = byId.get(r.at), holder = w.cults[r.owner];
    if (t) { r.x = t.x; r.y = t.y; r.place = t.name; }
    if (!t) {   // the city is gone: the crown is buried in its ruins
      r.buried = { x: r.x, y: r.y, name: r.place }; r.lost = w.year; r.owner = null; r.moves.push([w.year, null, 'buried']);
      ev(w, `${r.place} is destroyed, and ${r.name} is lost in its ruins.`, r.x, r.y, null, 1);
      continue;
    }
    if (t.cult !== r.owner) {   // the city fell: the crown goes with it
      const c = w.cults[t.cult]; if (c.power) continue; const from = holder; r.owner = c.id; r.moves.push([w.year, c.id, 'taken']);
      record(w, 'crown', [c.id].concat(from ? [from.id] : []), { x: t.x, y: t.y, note: `${r.name} taken` });
      ev(w, `${r.name} leaves ${t.name} in the baggage of the ${c.name}.${from && from.alive ? ` The ${from.name} will want it back.` : ''}`, t.x, t.y, c.color, 0);
    } else if (holder && holder.big && holder.big.id !== r.at) r.at = holder.big.id;   // it lives in the holder's capital
  }
  // regathering: whoever holds the fallen realm's old capital or crown has a claim on its old lands
  for (const c of w.cults) c.claimHeld = null;
  for (const cl of w.claims || []) {
    if (cl.done || w.year - cl.year > 400) continue; const cap = byId.get(cl.cap); if (!cap) continue; const hc = w.cults[cap.cult]; if (!hc || hc.power) continue;
    let mine = 0, alive = 0; for (const id of cl.towns) { const s = byId.get(id); if (!s) continue; alive++; if (s.cult === hc.id) mine++; }
    if (alive < 4) { cl.done = true; continue; } const share = mine / alive; cl.holder = hc.id; cl.share = share;
    if (share >= 0.3) hc.claimHeld = cl;
    if (share >= 0.6 && w.year - cl.year > 30) { cl.done = true; hc.coh = Math.min(1, hc.coh + 0.1); record(w, 'regather', [hc.id, cl.cult], { x: cap.x, y: cap.y, note: `${cl.name} regathered after ${w.year - cl.year} years` });
      ev(w, `From ${cap.name}, the ${hc.name} have gathered most of ${cl.name.replace(/^the /, 'the old ')} back under one rule, ${w.year - cl.year} years after it fell apart.`, cap.x, cap.y, hc.color, 0); discover(w, 'regather', cap.x, cap.y); }
  }
  // records the Almanac keeps
  for (const c of w.cults) {
    if (!c.alive) continue; const age = w.year - c.born;
    if (!c.power && c.count > ((rec.largest && rec.largest.n) || 0)) rec.largest = { n: c.count, name: c.name, year: w.year };
    if (!c.power && c.env.sed >= 4 && age > ((rec.longest && rec.longest.n) || 0)) rec.longest = { n: age, name: c.name, year: w.year };
    if (c.power === 'dead' && age > ((rec.undying && rec.undying.n) || 0)) rec.undying = { n: age, name: c.name, year: w.year };
    if (c.house && w.year - c.house.since > ((rec.house && rec.house.n) || 0)) rec.house = { n: w.year - c.house.since, name: c.house.name + ' of the ' + c.name, year: w.year };
  }
  for (const st of w.plagues || []) if (st.name && st.killed > ((rec.plague && rec.plague.n) || 0)) rec.plague = { n: Math.round(st.killed), name: st.name, year: st.born };
  for (const r of R) if (r.moves.length > ((rec.crown && rec.crown.n) || 0)) rec.crown = { n: r.moves.length, name: r.name, year: w.year };
}
// a people wants back the crown of its old tongue
export function crownGoal(w, c, foe) {
  if (!w.crowns || !w.langs || c.langId == null) return null; const root = w.langs[c.langId].root;
  for (const r of w.crowns) if (!r.buried && r.owner === foe.id && r.root === root && foe.langId != null && w.langs[foe.langId].root !== root) return r;
  return null;
}
export const RECORDS = [
  ['largest', 'The largest realm', (r) => `the ${r.name}, ${r.n} towns (year ${r.year})`],
  ['longest', 'The longest-lived realm', (r) => `the ${r.name}, ${r.n} years`],
  ['house', 'The longest-ruling house', (r) => `${r.name}, ${r.n} years`],
  ['undying', 'The longest realm of the dead', (r) => `${r.name}, ${r.n} years`],
  ['plague', 'The deadliest plague', (r) => `the ${r.name}, about ${peopleText(r.n)} dead`],
  ['crown', 'The most stolen crown', (r) => `${r.name}, changed hands ${r.n} times`],
];

// a claim on a foe's towns: the war goal of a realm that holds the old capital
export function claimGoal(w, c, foe) {
  const cl = c.claimHeld; if (!cl) return null; let n = 0; for (const s of w.sets) if (!s.dead && s.cult === foe.id && cl.towns.includes(s.id)) n++;
  return n >= 2 ? cl : null;
}
