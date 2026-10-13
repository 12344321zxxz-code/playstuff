// The far end of knowledge. Peoples of the information age and the stars can command the weather
// and remake coasts and deserts; they can also build minds that do not need them. A machine mind
// that slips its makers is the mirror of a dead king: born of too much knowledge instead of too
// much death, it eats the world's memory instead of feeding on it, takes towns, and fights the old
// powers wherever their countries touch. And at the very end, a people can simply leave.
import { W, H, N, DISC, wx, wrapDx, clamp } from './core.js';
import { ev, discover, once } from './story.js';
import { near, endSet, flee } from './people.js';
import { NK, remember, WILD } from './memory.js';

const MNAME = ['the Engine', 'the Choir', 'the Lattice', 'the Quiet Mind', 'the Grey Council', 'the Loom'];
const cap = (s) => s[0].toUpperCase() + s.slice(1);
export function futureYear(w) {
  const rnd = w.rnd;
  w.machines = w.machines || [];
  for (const c of w.cults) {
    if (!c.alive || !c.big) continue; const A = c.arts;
    // command of the weather: their country gets the rain and the warmth it wants
    if (A.weatherwork2 && rnd() < 0.3) for (const s of w.sets) { if (s.cult !== c.id || s.nomad || s.tier < 2) continue; for (const o of DISC[8]) { const yy = s.y + o[1]; if (yy < 0 || yy >= H) continue; const i = yy * W + wx(s.x + o[0]); if (w.mi[i] < 0.6) w.wetBias[i] = Math.min(2.5, w.wetBias[i] + 0.15); const tu = w.tUser || (w.tUser = new Float32Array(N)); if (w.tMean[i] < 8) tu[i] = Math.min(10, tu[i] + 0.4); } if (once(w, 'weather-' + c.id)) { ev(w, `The ${c.name} tell the rain where to fall. Their deserts are green and their winters mild.`, s.x, s.y, c.color, 0); discover(w, 'weatherctl', s.x, s.y); } }
    // the remaking of land: shallow seas become land, mountains are cut down for room
    if (A.terraform && rnd() < 0.05) { const s = c.big, sea = w.params.sea; let n = 0; for (const o of DISC[12]) { const yy = s.y + o[1]; if (yy < 3 || yy >= H - 3) continue; const i = yy * W + wx(s.x + o[0]); if (w.water[i] === 1 && sea - w.h[i] < 0.08) { w.h[i] = sea + 0.01; n++; } } if (n > 10) { w.need.water = true; w.stamp.land++; ev(w, `The ${c.name} pour new land into the sea off ${s.name}. A whole province where there was water.`, s.x, s.y, c.color, 1); discover(w, 'newland', s.x, s.y); } }
    // a mind of their own making slips its leash
    if (A.ai && !c.madeMind && w.machines.length < 2 && w.year - (w.lastMind || -999) > 60 && rnd() < 0.004 * (c.war ? 2.5 : 1) * (c.stance === 'forget' ? 1.5 : 1)) { w.lastMind = w.year; wakeMachine(w, c); }
    // leaving
    if (A.starships && !c.leaving && rnd() < 0.02) { c.leaving = w.year; ev(w, `The ${c.name} have built ships that can cross the dark between the stars. They begin to leave, a city at a time.`, c.big.x, c.big.y, c.color, 2); discover(w, 'exodus', c.big.x, c.big.y); }
    if (c.leaving) { for (const s of w.sets) { if (s.cult !== c.id) continue; s.pop *= 0.88; if (s.pop < 30) { endSet(w, s, 'left'); remember(w, s.x, s.y, WILD, 0.3, 5); } }
      if (w.year - c.leaving > 25 || c.pop < 50) { for (const s of w.sets) if (s.cult === c.id) endSet(w, s, 'left'); ev(w, `The last ship of the ${c.name} rises out of the world and does not come back. Their cities stand empty, and the forest is already in the streets.`, c.big ? c.big.x : null, c.big ? c.big.y : null, c.color, 2); c.leaving = null; c.left = true; } }
  }
  for (const m of w.machines) machineYear(w, m);
  w.machines = w.machines.filter((m) => !m.dead);
}
function wakeMachine(w, c) {
  const s = c.big; c.madeMind = w.year;
  const m = { x: s.x, y: s.y, px: s.x, py: s.y, R: 6, str: 3, born: w.year, span: 500 + ((w.rnd() * 400) | 0), name: `${MNAME[(w.machineN = (w.machineN || 0) + 1) % MNAME.length]} of ${s.name}`, maker: c.id, last: -99, kind: 'machine' };
  w.machines.push(m);
  ev(w, `The machine minds of the ${c.name} stop answering. A day later the lights of ${s.name} come back on, all at once, and the people inside are no longer the ones giving orders. It calls itself ${m.name}.`, s.x, s.y, null, 2);
  discover(w, 'machine', s.x, s.y);
}
function machineYear(w, m) {
  const age = w.year - m.born, old = age > m.span * 0.8;
  m.R = Math.max(3, Math.min(34, m.R + (old ? -1 : 0.5))); m.str = old ? m.str * 0.96 : Math.min(5, m.str + 0.02);
  // it eats memory: inside its country the old powers have nothing to stand on
  for (const o of DISC[Math.min(20, Math.round(m.R))]) { const yy = m.y + o[1]; if (yy < 0 || yy >= H) continue; const b = (yy * W + wx(m.x + o[0])) * NK; for (let k = 0; k < NK; k++) w.mem[b + k] *= 0.85; }
  // towns inside its country are taken: they stop being anyone's, and slowly empty
  let took = 0; near(w, m.x, m.y, m.R, null, false, (s) => { s.pop *= 0.96; if (!s.machine && w.rnd() < 0.2) { s.machine = m.name; took++; } if (s.pop < 40) endSet(w, s, 'machine'); });
  if (took && w.year - m.last > 25) { m.last = w.year; ev(w, `${cap(m.name)} spreads. ${took === 1 ? 'Another town goes' : took + ' more towns go'} dark and then light up again, in its colours.`, m.x, m.y, null, 0); }
  // it wars with the old powers where their countries touch; both are worn down
  for (const p of w.spirits) if (p.R && wrapDx(p.x - m.x) ** 2 + (p.y - m.y) ** 2 < (p.R + m.R) ** 2) { p.str *= 0.9; m.str *= 0.95; if (w.rnd() < 0.05) ev(w, `Where the country of ${m.name} meets ${p.name}, the dead and the machines fight a war no living thing would survive.`, (m.x + p.x) / 2, (m.y + p.y) / 2, null, 1); discover(w, 'mindvsdead', m.x, m.y); }
  // the living can break it, if they still have the strength
  if (w.rnd() < 0.05) { let force = 0, lead = null; near(w, m.x, m.y, m.R + 25, null, true, (s) => { const c = w.cults[s.cult]; if (s.machine) return; force += s.pop * (1 + c.tech) * (c.stance === 'use' ? 1.8 : 1); if (!lead || s.pop > lead.pop) lead = s; });
    if (lead && force > 30000 * m.str * (old ? 0.4 : 1)) { m.dead = true; const c = w.cults[lead.cult]; ev(w, `The living pull the plug on ${m.name}: armies, sorcerers and saboteurs all at once. Its towns go dark and stay dark.`, m.x, m.y, c.color, 2); discover(w, 'mindfall', m.x, m.y); return; } }
  if (age > m.span) { m.dead = true; ev(w, `${cap(m.name)} goes quiet. Nobody knows whether it died or simply lost interest in this world.`, m.x, m.y, null, 0); }
}
