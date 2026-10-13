// Undying Kings as nations of the dead. One dead king in ten does not stay a haunting: it founds a
// realm with a capital, borders and towns, and makes war on the living the way any people does,
// with armies that march and take towns. A town the dead take becomes a dead town: still standing,
// still on the map, but its people are the dead and they serve the king.
//
// What it feeds on and why it ends (the design rules: no timer does the causal work):
//   - it does not eat, trade or learn. Its towns keep the arts they had when they fell, so as the
//     living around it learn, it falls behind (strength() reads its frozen arts and era);
//   - its cohesion only decays, like an old dynasty. Fresh death memory in its land from other
//     peoples' wars and from the living it kills slows the decay, but never stops it;
//   - it fades when its cohesion is spent, when its capital is taken, or at a hard cap of ~1000 years.
import { W, H, wrapDx, wx, clamp } from './core.js';
import { newCult, addSet, endSet, near, send } from './people.js';
import { POWER, POWER_TOWN } from './registry.js';
import { memAt } from './memory.js';
import { ev, discover } from './story.js';
import { record } from './ledger.js';
import { ART } from './tech.js';

const DEATH = 0, GREY = '#8d958a', CAP = 1050;
const cap1 = (s) => s[0].toUpperCase() + s.slice(1);

// Called when a great lich rises: found the realm around its hall.
export function foundDeadRealm(w, p) {
  // its arts and era are those of the people whose city it rose from (or the strongest near it)
  let src = null; near(w, p.x, p.y, 30, null, true, (s) => { const c = w.cults[s.cult]; if (!c.power && (!src || (p.grudge && c.name === p.grudge) || c.pop > src.pop)) src = c; });
  const c = newCult(w, src || null);
  c.power = 'dead'; c.spirit = p.id; c.name = 'Dead of ' + p.place; c.color = GREY; c.coh = 1; c.way = 'dead'; c.kind = 'the dead'; c.stance = 'use'; c.faith = null; c.know = src ? src.know : 0; c.tech = src ? src.tech : 1;
  c.arts = {}; if (src) for (const k in src.arts) if (ART[k] && ART[k].tier <= 5 && ART[k].tier < 99) c.arts[k] = 1;   // the dead keep what a city knew, not what an industrial state needs to run c.born = w.year; c.ruler.trait = null; c.ruler.name = p.name; c.ruler.until = 1e9;
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
  const hallAlive = c.big && !c.big.dead && c.big.capital;
  s.pop = s.pop * (hallAlive ? 0.99 : 0.85) + (hallAlive ? 40 * Math.min(1.5, memAt(w, s.y * W + s.x, DEATH)) * (s.capital ? 2 : 1) : 0);   // the dead of nearby battlefields get up and come
  if (s.pop < 8) endSet(w, s, 'abandoned');
}

POWER_TOWN.dead = deadTown;

// The realm's year: decay, war, and the end.
POWER.dead = function deadYear(w, c) {
  const p = (w.spirits || []).find((q) => q.id === c.spirit), b = c.big, age = w.year - c.born;
  // cohesion only decays; fresh death memory in its land slows the decay (to at most 60% slower)
  let mem = 0, n = 0; for (const s of w.sets) if (s.cult === c.id) { mem += memAt(w, s.y * W + s.x, DEATH); n++; }
  const fed = n ? Math.min(0.6, mem / n) : 0, decay = 0.001 * (1 - fed) * (1 + 0.6 * Math.max(0, c.count - 12) / 12);
  c.coh = Math.max(0, c.coh - decay); c.cohT = c.coh;
  c.press = { base: 0, decay: -decay * 100, fed: fed, size: -Math.max(0, c.count - 12) / 12 };
  if (p) { p.str = 1 + 3 * c.coh; p.x = b ? b.x : p.x; p.y = b ? b.y : p.y; }
  // the end: capital lost, cohesion spent, or the hard cap
  const lostHall = !b || b.dead || !b.capital || b.cult !== c.id;
  if (lostHall || c.coh <= 0.02 || age > CAP) { fall(w, c, p, lostHall ? 'its hall has fallen' : c.coh <= 0.02 ? 'it has nothing left to hold it together' : 'its time is over'); return; }
  if (age > 0 && age % 150 === 0 && c.coh < 0.45 && !c.failing) { c.failing = true; ev(w, `The ${c.name} are failing. Their dead towns go quiet one by one.`, b.x, b.y, c.color, 0); }
  // war on the living: each dead town may send its dead against the nearest living town
  let sent = 0; const maxSend = 1 + Math.floor(c.coh * 3);
  for (const s of w.sets) {
    if (sent >= maxSend || s.cult !== c.id || s.dead || w.rnd() > 0.3 + 0.4 * c.coh) continue;
    let tg = null, bd = 1e9; const reach = 10 + 6 * c.coh + (s.capital ? 6 : 0);
    near(w, s.x, s.y, reach, s, false, (u, q) => { const oc = w.cults[u.cult]; if (oc.power || u.nomad) return; const sc = q / (1 + (p && p.grudge && oc.name === p.grudge ? 3 : 0)); if (sc < bd) { bd = sc; tg = u; } });
    if (!tg) continue;
    if (s.pop < 40) continue; const men = s.pop * (0.25 + 0.2 * c.coh); s.pop -= men * 0.5; sent++;
    send(w, { kind: 'army', cult: c.id, x: s.x, y: s.y, tx: tg.x, ty: tg.y, n: men, from: s, to: tg, land: 0.8, dead: true });
    if (w.year - (c.lastSay || -99) > 30 && tg.tier >= 2) { c.lastSay = w.year; ev(w, `The ${c.name} march on ${tg.name}.`, tg.x, tg.y, c.color, 1); }
  }
};

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
