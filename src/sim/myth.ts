// @ts-nocheck
// You, as the peoples see you. Every power used where people can see it becomes a story. A
// people who have seen the same kind of thing often enough give the doer a name: the Shaper,
// the Star-Thrower, the Giver of Rain. Enough awe, and a prophet, and the name becomes a faith:
// a faith about you, which teaches whatever its people decided your acts meant.
import { W, H, wrapDx, clamp } from './core';
import { ev, discover, once } from './story';
import { near, whereAbouts } from './people';
import { newFaith, convert } from './faith';
import { prophetFor } from './figures';
import { queueClimate } from './world';

export const EPITHETS = {
  maker: ['the Shaper', 'the Hand Beneath the Hills', 'the Potter of Mountains'], drowner: ['the Drowner', 'the Hungry Water', 'the One Who Takes the Shore'],
  breaker: ['the Breaker', 'the Splitter of Ground', 'the Shaker'], giver: ['the Giver', 'the Open Hand', 'the Bringer of Rain'], scourge: ['the Scourge', 'the Withering Hand', 'the Bitter One'],
  storm: ['the Storm-Father', 'the Thunderer', 'the Black Sky'], winter: ['the White Breath', 'the Long Night', 'the Frost King'], sun: ['the High Sun', 'the Golden Eye', 'the Burning Summer'],
  green: ['the Green Hand', 'the Mother of Woods', 'the Wild One'], fire: ['the Burning One', 'the Red Tongue', 'the Kindler'], star: ['the Star-Thrower', 'the Sky-Stone', 'the Falling Fire'],
  beast: ['the Mother of Monsters', 'the Keeper of Beasts', 'the Horned One'], hunter: ['the Wolf-Lord', 'the Hunter Above'], teacher: ['the Whisperer', 'the Bringer of Knowing', 'the Lamp'],
  mystery: ['the Watcher', 'the One Above', 'the Nameless'],
};
const TENET_OF = { maker: 'ancestors', drowner: 'sea', breaker: 'war', giver: 'peace', scourge: 'war', storm: 'war', winter: 'ancestors', sun: 'peace', green: 'grove', fire: 'war', star: 'war', beast: 'war', hunter: 'war', teacher: 'ancestors', mystery: 'peace' };
const WEIGHT = { star: 3, fire: 1.2, breaker: 2, drowner: 1.6, scourge: 1.6, beast: 2, storm: 1.2, winter: 2.5, sun: 2.5 };
const SAW = {
  maker: (p, place) => `The ${p} say the hills ${place} rose because someone lifted them.`, drowner: (p, place) => `The ${p} say the sea ${place} was called in by something that wanted the land.`,
  breaker: (p, place) => `The ${p} tell how the ground ${place} was torn open by a hand from below.`, giver: (p, place) => `The ${p} leave a bowl of milk out for whoever brought the rain ${place}.`,
  scourge: (p, place) => `The ${p} say the hunger ${place} was sent, and wonder what they did wrong.`, storm: (p, place) => `The ${p} say the storm ${place} had a face in it.`,
  winter: (p, place) => `The ${p} tell of the winter that did not end, and who breathed it.`, sun: (p, place) => `The ${p} say a second sun hung over them all one summer.`,
  green: (p, place) => `The ${p} say the woods ${place} came overnight, and walk carefully there now.`, fire: (p, place) => `The ${p} say the fire ${place} was set on purpose.`,
  star: (p, place) => `The ${p} saw a star thrown down ${place}. They are sure it was thrown.`, beast: (p, place) => `The ${p} say the monster ${place} was set there by a master.`,
  hunter: (p, place) => `The ${p} say the wolves ${place} answer to someone.`, teacher: (p, place) => `The ${p} say their cleverest idea was whispered to them.`, mystery: (p, place) => `The ${p} saw a sign ${place}, and argue about what it meant.`,
};

export function initMyth(w) { w.myths = []; w.awe = {}; w.god = {}; }
export const epithetOf = (w, kind) => (w.god && w.god[kind]) || EPITHETS[kind][0];
// Called by the worker every time a power is used. Brushes call it many times a second; awe is
// counted once per people, per kind of act, per year.
export function noteAct(w, kind, x, y, r) {
  if (!w.myths || !kind) return; const R = Math.max(16, (r || 0) * 2.5), seen = new Map();
  near(w, Math.round(x), Math.round(y), R, null, false, (s, q) => { const c = w.cults[s.cult]; if (!c || !c.alive) return; const o = seen.get(c.id); if (!o || q < o.q) seen.set(c.id, { s, q }); });
  if (!seen.size) return;
  for (const [cid, { s }] of seen) {
    const c = w.cults[cid], A = w.awe[cid] || (w.awe[cid] = { total: 0, by: {}, last: {} });
    if (A.last[kind] === w.year) continue; A.last[kind] = w.year;
    const wt = WEIGHT[kind] || 1; A.by[kind] = (A.by[kind] || 0) + wt; A.total += wt;
    // the first time a people sees something of a kind, they tell a story about it
    if (once(w, 'myth-' + cid + '-' + kind)) {
      if (!w.god[kind]) w.god[kind] = EPITHETS[kind][(w.rnd() * EPITHETS[kind].length) | 0];
      const m = { id: w.nextId++, kind, year: w.year, x: s.x, y: s.y, cult: cid, name: w.god[kind], text: SAW[kind](c.name, whereAbouts(w, s.x, s.y)) };
      w.myths.push(m); if (w.myths.length > 400) w.myths.shift();
      ev(w, `${m.text} They call that someone ${m.name}.`, s.x, s.y, c.color, w.myths.length <= 3 ? 0 : 1, ['c' + cid]);
      discover(w, 'myth', s.x, s.y);
    }
    // enough awe, and it becomes a faith
    if (A.by[kind] >= 3 && !A.faith && w.rnd() < 0.5) { const f = mythFaith(w, s, kind); if (f) ev(w, `Among the ${c.name}, a prophet: ${w.figs.find((q) => q.id === f.prophet)?.name || 'a voice'} says ${w.god[kind] || epithetOf(w, kind)} is real, and is watching. ${f.name} is born at ${s.name || 'the camps of the ' + c.name}.`, s.x, s.y, f.color, 2, ['f' + f.id]); }
    // the faithful notice when you do what you are known for
    for (const f of w.faiths) if (f.alive && f.god && f.kind === kind && f.towns) { f.zealUntil = w.year + 25; }
  }
}
// Found (or return) a faith about you at settlement s.
export function mythFaith(w, s, kind) {
  if (!s || s.dead) return null; const c = w.cults[s.cult], A = w.awe[c.id] || (w.awe[c.id] = { total: 0, by: {}, last: {} });
  if (A.faith != null && w.faiths[A.faith] && w.faiths[A.faith].alive) { convert(w, s, w.faiths[A.faith]); return w.faiths[A.faith]; }
  if (w.faiths.filter((f) => f.alive).length >= 14) return null;
  if (!w.god[kind]) w.god[kind] = EPITHETS[kind][(w.rnd() * EPITHETS[kind].length) | 0];
  const name = w.god[kind], others = w.faiths.filter((f) => f.alive && f.god);
  const given = { names: [name, 'the Faith of ' + name.replace(/^the /, 'the '), 'the Children of ' + name.replace(/^the /, '')], tenet: TENET_OF[kind], say: null };
  const f = newFaith(w, s, 'myth', given); f.god = true; f.kind = kind; f.origin = 'myth'; A.faith = f.id; convert(w, s, f); if (c.faith == null) c.faith = f.id;
  prophetFor(w, s, f); discover(w, 'yourfaith', s.x, s.y);
  if (others.length && others.some((o) => o.kind !== kind) && discover(w, 'schismgod', s.x, s.y)) ev(w, `Now two faiths claim to know you: ${others[0].name} and ${f.name}. They do not agree on what you are.`, s.x, s.y, f.color, 0, ['f' + f.id, 'f' + others[0].id]);
  return f;
}
// The Omen power: a sign in the sky over a town. Somebody will make something of it.
export function omen(w, x, y) {
  const s = near(w, Math.round(x), Math.round(y), 10, null, false); w.fx.push({ k: 'omen', x, y, T: 3 }); if (!s) return 'A light hangs over empty country. Nobody sees it.';
  const c = w.cults[s.cult]; noteAct(w, 'mystery', s.x, s.y); const A = w.awe[c.id];
  if (A && A.total >= 2 && !A.faith) { const top = Object.keys(A.by).sort((a, b) => A.by[b] - A.by[a])[0]; const f = mythFaith(w, s, top); if (f) { ev(w, `A light hangs over ${s.name || 'the camps of the ' + c.name} for three nights. On the fourth day a prophet begins to preach ${f.name}.`, s.x, s.y, f.color, 2, ['f' + f.id]); return 'A prophet rises.'; } }
  ev(w, `A light hangs over ${s.name || 'the camps of the ' + c.name} for three nights. The ${c.name} argue about what it means.`, s.x, s.y, c.color, 1);
  return 'They saw it.';
}
// The long winter and the long summer: push the sun for a generation.
export function longSeason(w, dir) {
  w.forcing = clamp((w.forcing || 0) + dir * 2.5, -7, 7); w.forcingUntil = w.year + 40; queueClimate(w);
  noteAct(w, dir < 0 ? 'winter' : 'sun', W / 2, H / 2, 200);
  ev(w, dir < 0 ? 'The sun dims. The old people say the summers were longer when they were young; soon everyone will say it.' : 'The sun burns hotter than anyone remembers. Rivers shrink; the ice retreats.', null, null, null, 0);
  return dir < 0 ? 'The sun dims for a generation.' : 'The sun burns hotter for a generation.';
}
// Once a year: myth-faiths whose god has acted lately are on fire with it.
export function mythYear(w) {
  if (!w.faiths) return;
  for (const f of w.faiths) { if (!f.alive || !f.god) continue; if (f.zealUntil > w.year) { let n = 0; for (const s of w.sets) if (s.faith === f.id && w.rnd() < 0.1) { near(w, s.x, s.y, 14, s, false, (o) => { if (o.faith !== f.id && w.rnd() < 0.15 && n < 6) { convert(w, o, f); n++; } }); } } }
}
