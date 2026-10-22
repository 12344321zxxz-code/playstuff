// Undying Kings as nations of the dead. One dead king in ten does not stay a haunting: it founds a
// realm with a capital, borders and towns, and makes war on the living the way any people does,
// with armies that march and take towns. A town the dead take becomes a dead town: still standing,
// still on the map, but its people are the dead and they serve the king.
//
// Slice 17, a corpse ecology: the dead realm is fed by fresh death around it, from anyone's battles,
// plagues and sackings and from the living it kills. Each dead town takes in about 0.4 of the fresh
// dead within reach and rots by about 3% a year unless the ground there remembers much death, so
// the realm spreads outward toward wherever people are dying and its old core hollows out to small
// garrisons. A town whose garrison is full marches on its nearest living town on its own. The dead
// keep only the war arts of the city that bore them, and their armies need no food. The living who
// dread them swear the Oath: wars between sworn realms stop and the dead become everyone's enemy.
//
// What it feeds on and why it ends (the design rules: no timer does the causal work):
//   - it does not eat, trade or learn. Its towns keep the arts they had when they fell, so as the
//     living around it learn, it falls behind (strength() reads its frozen arts and era);
//   - its cohesion only decays, like an old dynasty. Fresh death memory in its land from other
//     peoples' wars and from the living it kills slows the decay, but never stops it;
//   - it fades when its cohesion is spent, when its capital is taken, or at a hard cap of ~1000 years.
import { W, H, wrapDx, wx, clamp } from './core.js';
import { newCult, addSet, endSet, near, send, strength, endOathWar, routeCells } from './people.js';
import { POWER, POWER_TOWN } from './registry.js';
import { memAt } from './memory.js';
import { ev, discover } from './story.js';
import { record } from './ledger.js';
import { ART } from './tech.js';

const DEATH = 0, GREY = '#8d958a', CAP = 1050;
export const WAR_ARTS = new Set(['riding', 'copper', 'masonry', 'bronze', 'chariots', 'iron', 'siege', 'stirrups', 'steel', 'gunpowder', 'cannon', 'dynamite']);
// fresh dead, for the dead realms to take in: where, how many, when
export function corpses(w, x, y, n) {
  if (!(n > 2) || !w.cults.some((c) => c.alive && c.power === 'dead')) return; const L = w.corpses || (w.corpses = []);
  for (const q of L) if (q.y === y && Math.abs(wrapDx(q.x - x)) <= 2 && Math.abs(q.y - y) <= 2) { q.n += n; q.year = w.year; return; }
  L.push({ x, y, n, year: w.year }); if (L.length > 300) L.shift();
}
const cap1 = (s) => s[0].toUpperCase() + s.slice(1);

// Called when a great lich rises: found the realm around its hall.
export function foundDeadRealm(w, p) {
  // its arts and era are those of the people whose city it rose from (or the strongest near it)
  let src = null; near(w, p.x, p.y, 30, null, true, (s) => { const c = w.cults[s.cult]; if (!c.power && (!src || (p.grudge && c.name === p.grudge) || c.pop > src.pop)) src = c; });
  const c = newCult(w, src || null);
  c.power = 'dead'; c.spirit = p.id; c.name = 'Dead of ' + p.place; c.color = GREY; c.coh = 1; c.way = 'dead'; c.kind = 'the dead'; c.stance = 'use'; c.faith = null; c.know = src ? src.know : 0; c.tech = src ? src.tech : 1;
  c.arts = {}; if (src) for (const k in src.arts) if (WAR_ARTS.has(k)) c.arts[k] = 1;   /* only the arts of war: the dead do not farm, trade, write or build */   // the dead keep what a city knew, not what an industrial state needs to run c.born = w.year; c.ruler.trait = null; c.ruler.name = p.name; c.ruler.until = 1e9;
  const hall = addSet(w, c.id, p.x, p.y, 400 + 300 * p.str, false); hall.undead = true; hall.tier = 2; hall.maxTier = 2; hall.name = 'the Hall of ' + p.place; hall.capital = true;
  c.big = hall; c.count = 1; c.pop = hall.pop; c._n = -1;
  p.realm = c.id; p.R = 0;
  record(w, 'realm-born', [c.id, 'p:' + p.id], { x: p.x, y: p.y, note: `${p.name} founds a realm` });
  return c;
}

// The census calls this for each dead town instead of the living town's year.
export function deadTown(w, s, c) {
  s.undead = true; c._n++; c._p += s.pop; if (s.capital || !c._b || (!c._b.capital && s.pop > c._b.pop)) c._b = s;
  // the dead do not grow; without a hall to serve they wander off
  const hallAlive = c.big && !c.big.dead && c.big.capital, mem = Math.min(1, memAt(w, s.y * W + s.x, DEATH));
  s.pop *= hallAlive ? 1 - 0.02 * (1 - mem) : 0.85;   /* they rot, unless the ground remembers much death; without a hall they wander off */
  if (s.pop < 8) endSet(w, s, 'abandoned');
}

POWER_TOWN.dead = deadTown;

// The realm's year: decay, war, and the end.
POWER.dead = function deadYear(w, c) {
  const p = (w.spirits || []).find((q) => q.id === c.spirit), b = c.big, age = w.year - c.born;
  // cohesion only decays; fresh death memory in its land slows the decay (to at most 60% slower)
  let mem = 0, n = 0; for (const s of w.sets) if (s.cult === c.id) { mem += memAt(w, s.y * W + s.x, DEATH); n++; }
  const fed = n ? Math.min(0.6, mem / n) : 0, decay = 0.0006 * (1 - fed) * (1 + 0.6 * Math.max(0, c.count - 12) / 12);
  c.coh = Math.max(0, c.coh - decay); c.cohT = c.coh;
  c.press = { base: 0, decay: -decay * 100, fed: fed, size: -Math.max(0, c.count - 12) / 12 };
  if (p) { p.str = 1 + 3 * c.coh; p.x = b ? b.x : p.x; p.y = b ? b.y : p.y; }
  // the end: capital lost, cohesion spent, or the hard cap
  const lostHall = !b || b.dead || !b.capital || b.cult !== c.id;
  if (lostHall || c.coh <= 0.02 || age > CAP) { fall(w, c, p, lostHall ? 'its hall has fallen' : c.coh <= 0.02 ? 'it has nothing left to hold it together' : 'its time is over'); return; }
  if (age > 0 && age % 150 === 0 && c.coh < 0.45 && !c.failing) { c.failing = true; ev(w, `The ${c.name} are failing. Their dead towns go quiet one by one.`, b.x, b.y, c.color, 0); }
  // the fresh dead come to the nearest dead town within reach
  const mine = w.sets.filter((q) => q.cult === c.id && !q.dead);
  for (const q of w.corpses || []) { if (q.n <= 0 || w.year - q.year > 25) continue; let to = null, bd = 24 * 24;
    for (const s of mine) { const d = wrapDx(s.x - q.x) ** 2 + (s.y - q.y) ** 2; if (d < bd) { bd = d; to = s; } }
    if (!to) continue; const got = q.n * 0.4; to.pop += got; q.n = 0; c.fedBy = (c.fedBy || 0) + got;
    if (got > 30 && w.fx.length < 60) w.fx.push({ k: 'wisp', x: q.x, y: q.y, tx: to.x, ty: to.y, T: 2.5 }); }
  if (w.corpses) w.corpses = w.corpses.filter((q) => q.n > 0 && w.year - q.year <= 25);
  // a full garrison marches on its nearest living town, each town on its own; the rest stays home
  let any = false;
  for (const s of mine) {
    const full = 120 + 80 * (s.tier || 1) + (s.capital ? 200 : 0); let tg = null, bd = 1e9;
    near(w, s.x, s.y, 30, s, false, (u, q) => { const oc = w.cults[u.cult]; if (oc.power || u.nomad) return; any = true; const sc = q / (1 + (p && p.grudge && oc.name === p.grudge ? 3 : 0)); if (sc < bd) { bd = sc; tg = u; } });
    if (!tg || s.pop < full || bd > 22 * 22) continue;
    const men = s.pop - full * 0.5; s.pop -= men;
    const cells = routeCells(w, s, tg); if (!cells) { s.pop += men; continue; } send(w, { kind: 'army', cult: c.id, x: s.x, y: s.y, tx: tg.x, ty: tg.y, n: men, from: s, to: tg, dead: true, path: cells, step: 1 });   /* the dead walk the land too */
    if (w.year - (c.lastSay || -99) > 30 && tg.tier >= 2) { c.lastSay = w.year; ev(w, `The dead of ${s.name} march on ${tg.name}.`, tg.x, tg.y, c.color, 1); }
  }
  // burn out: nothing living left in reach for twenty years
  c.empty = any ? 0 : (c.empty || 0) + 1; if (c.empty >= 20) { fall(w, c, p, 'there is nothing left alive within its reach'); return; }
  oath(w, c);
};

// The Oath: the living who dread the dead (their strength over the distance to them, against one's
// own) swear to make war on them together; wars among the sworn stop. A shared enemy only: it ends
// when the dread passes, with no bond left behind.
function oath(w, D) {
  const towns = w.sets.filter((s) => s.cult === D.id && !s.dead); if (!towns.length) return; const sD = strength(D, D.pop) * (1 + D.coh);
  const sworn = [];
  for (const c of w.cults) {
    if (!c.alive || c.power || !c.big) continue; let d = 1e9; for (const s of towns) { const q = Math.hypot(wrapDx(s.x - c.big.x), s.y - c.big.y); if (q < d) d = q; }
    const dread = sD * 20 / Math.max(20, 2 * d), sc = strength(c, c.pop);
    if (c.oath === D.id) { if (dread < 0.3 * sc) { c.oath = null; record(w, 'oath-end', [c.id, D.id], { note: `the ${c.name} no longer fear the ${D.name}` }); } else sworn.push(c); }
    else if (c.oath == null && dread > 0.9 * sc) { c.oath = D.id; sworn.push(c); c.oathAt = w.year; record(w, 'oath', [c.id, D.id], { x: c.big.x, y: c.big.y, note: `the ${c.name} swear the oath against the ${D.name}`, terms: { dread, own: sc } }); if (w.year - (D.oathSay || -99) > 40) { D.oathSay = w.year; ev(w, `At ${c.big.name} the ${c.name} swear an oath: no war among the living while the ${D.name} walk.`, c.big.x, c.big.y, c.color, 0); discover(w, 'oath', c.big.x, c.big.y); } }
  }
  for (const c of sworn) if (c.war) { const f = w.cults[c.war.foe]; if (f && f.oath === D.id) { endOathWar(w, c); } }
}

// A living town taken by the dead becomes a dead town; a dead town taken by the living is laid to rest.
export function deadConquest(w, o, c, oc) {
  if (c.power === 'dead') { o.undead = true; o.capital = false; o.pop *= 0.7; o.trade = 0; if (!o.wasDead) { o.wasDead = true; discover(w, 'deadtown', o.x, o.y); } return; }
  if (oc && oc.power === 'dead') { o.undead = false; o.capital = false; o.pop = Math.max(20, o.pop * 0.25); ev(w, `The ${c.name} take ${o.name} back from the dead and burn what is left of them.`, o.x, o.y, c.color, 1); }
}

function fall(w, c, p, why) {
  const b = c.big; let n = 0;
  for (const s of w.sets) if (s.cult === c.id && !s.dead) { endSet(w, s, 'abandoned'); n++; }
  c.alive = false; if (p) { p.dead = true; p.realm = null; }
  record(w, 'power-fall', [c.id, p ? 'p:' + p.id : null], { x: b ? b.x : null, y: b ? b.y : null, note: `${c.name}: ${why}`, terms: { cohesion: c.coh, age: w.year - c.born } });
  ev(w, `${cap1(c.name.startsWith('the ') ? c.name : 'the ' + c.name)} lie down. ${n > 1 ? n + ' dead towns are only ruins now' : 'Its hall is only a ruin now'}: ${why}.`, b ? b.x : p ? p.x : null, b ? b.y : p ? p.y : null, c.color, 2);
}
