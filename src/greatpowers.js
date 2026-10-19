// Three powers that each feed on a different human flow (slice 10).
//   The fey feed on abandoned land and tired peoples. A court grows where the wild is strong and the
//   realms around it are coming apart or overworking their poor; it takes villages as changelings,
//   and a taken village goes quiet: no taxes, no soldiers, no trade, until the court weakens.
//   The deep feeds on sea trade and drownings. Navies resist it (steam halves its toll, modern ships
//   cut it to a fifth). Its cults in the ports store up deep memory, and a cult in a miserable port
//   whose old faith has faded can, very rarely, call up a great one: likeliest in the industrial age,
//   as in Lovecraft. The great one drowns the coasts of a whole continent, kills the land and stays
//   for about a thousand years. A few bombs can kill it; its death throes raise the sea everywhere.
//   Machine minds absorb by dependence: towns that trade with a dark town and run on the network
//   go dark themselves once they depend on it enough. It spreads along trade, not with armies; the
//   counter is to cut the trade (autarky).
import { near, endSet, strength } from './people.js';
import { send } from './movers.js';
import { record } from './ledger.js';
import { ev, discover, once } from './story.js';
import { remember, memAt, DEEP, WILD } from './memory.js';
import { W, H, N, wx, wrapDx, clamp } from './core.js';

const GNAME = ['the Sleeper Under the Shelf', 'the Mother of Tides', 'the One Who Was Called', 'the Drowned Star', 'the Hunger Below the Light'];

/* ---------- the fey ---------- */
// A court is its forest (slice 14): a flood fill of wooded cells out from its heart, as many as its
// strength and the wild memory there allow, kept in its own map (courtOf) and never in the forest or
// owner fields. Its edge is drawn on the map; it grows by letting fallow fields go back to trees.
const _q = new Int32Array(N);
function courtFill(w, p) {
  const CO = w.courtOf || (w.courtOf = new Uint8Array(N));
  if (p.cells) for (const i of p.cells) if (CO[i] === p.slot) CO[i] = 0;
  if (p.dead) { p.cells = null; return; }
  if (!p.slot) { const used = new Set(w.spirits.filter((q) => !q.dead && q.slot).map((q) => q.slot)); let k = 1; while (used.has(k) && k < 254) k++; p.slot = k; }
  if (w.water[p.y * W + p.x]) { let best = -1, bd = 1e9; for (let dy = -8; dy <= 8; dy++) for (let dx = -8; dx <= 8; dx++) { const yy = p.y + dy; if (yy < 1 || yy >= H - 1) continue; const i = yy * W + wx(p.x + dx); if (w.water[i] || w.t[i] < 0.45) continue; const q = dx * dx + dy * dy; if (q < bd) { bd = q; best = i; } } if (best >= 0) { p.x = best % W; p.y = (best / W) | 0; } }   /* a court whose heart drowned moves to the nearest wood */
  const wild = memAt(w, p.y * W + p.x, WILD), cap = Math.round((40 + 110 * p.str) * (0.5 + wild)), R = (p.R || 6) + 6, h0 = p.y * W + p.x;
  if (!w.water[h0]) w.t[h0] = Math.max(w.t[h0], 0.8);
  let n = 0, hd = 0; const cells = []; if (!w.water[h0] && !CO[h0]) { _q[n++] = h0; CO[h0] = p.slot; }
  while (hd < n && n < cap) { const c = _q[hd++], x = c % W, y = (c / W) | 0; cells.push(c);
    for (let k = 0; k < 4; k++) { const yy = y + (k === 2 ? -1 : k === 3 ? 1 : 0); if (yy < 1 || yy >= H - 1) continue; const xx = wx(x + (k === 0 ? 1 : k === 1 ? -1 : 0)), i = yy * W + xx;
      if (CO[i] || w.water[i] || w.t[i] < 0.45 || w.urban[i]) continue; const dx = wrapDx(xx - p.x), dy = yy - p.y; if (dx * dx + dy * dy > R * R) continue; CO[i] = p.slot; _q[n++] = i; if (n >= cap) break; } }
  for (; hd < n; hd++) cells.push(_q[hd]);
  p.cells = cells; w.courtStamp = (w.courtStamp || 0) + 1;
}
export const inCourt = (w, x, y, r, slot) => { const CO = w.courtOf; if (!CO) return false; for (let dy = -r; dy <= r; dy++) { const yy = y + dy; if (yy < 0 || yy >= H) continue; for (let dx = -r; dx <= r; dx++) if (CO[yy * W + wx(x + dx)] === slot) return true; } return false; };
function feyYear(w) {
  const rnd = w.rnd;
  for (const p of w.spirits) {
    if (p.kind === 'fey' && (p.cells || !p.dead)) courtFill(w, p);
    if (p.dead || p.kind !== 'fey') continue;
    // food: how wild the country is, how tired and squeezed the peoples around it are
    let coh = 0, L = 0, n = 0, farm = 0, cells = 0;
    near(w, p.x, p.y, (p.R || 6) + 12, null, true, (s) => { const c = w.cults[s.cult]; coh += c.coh; L += c.hub ? c.hub.L : 1; n++; });
    for (let q = 0; q < 20; q++) { const a = rnd() * 6.283, r = Math.sqrt(rnd()) * (p.R || 6), i = clamp(Math.round(p.y + Math.sin(a) * r), 1, H - 2) * W + wx(Math.round(p.x + Math.cos(a) * r)); if (w.water[i]) continue; cells++; if (w.farm[i]) farm++; }
    const wild = memAt(w, p.y * W + p.x, WILD), tired = n ? (0.6 - coh / n) + (0.85 - L / n) : 0.2, cut = cells ? farm / cells : 0;
    p.feed = +(0.5 * (wild - 0.5) + tired - 0.6 * cut).toFixed(3);
    p.str = clamp((p.str || 1) + 0.03 * p.feed, 0.3, p.great ? 4 : 2.5);
    // changelings: a village near the court goes quiet
    near(w, p.x, p.y, (p.R || 6) + 8, null, true, (s) => {
      if (s.lost || p.pact === s.cult || s.tier >= 3 || !inCourt(w, s.x, s.y, 2, p.slot) || rnd() > 0.02 * p.str) return; s.lost = 'fey'; s.lostTo = p.id; s.trade = 0;
      const c = w.cults[s.cult]; c.feyTaken = (c.feyTaken || 0) + 1;
      if (once(w, 'changeling-' + p.id + '-' + Math.floor(w.year / 40))) { ev(w, `${s.name} goes quiet. Its people still work the fields, but they send no grain and no sons to the ${c.name}, and they do not look at strangers.`, s.x, s.y, c.color, 1); discover(w, 'changelings', s.x, s.y); }
    });
  }
  // a court that weakens or dies lets its villages go
  for (const s of w.sets) if (s.lost === 'fey' && !s.dead) { const p = w.spirits.find((q) => q.id === s.lostTo && !q.dead); if (!p || p.str < 0.5 || rnd() < 0.01) { s.lost = null; s.lostTo = null; } }
}

/* ---------- the deep ---------- */
// how much of the deep's toll a people's ships still pay
export const navyFactor = (c) => (c.tech >= 8 ? 0.2 : c.tech >= 6 || c.arts.engines ? 0.5 : 1);
export function greatNear(w, x, y) { const g = w.great; return g && wrapDx(g.x - x) ** 2 + (g.y - y) ** 2 < 90 * 90 ? g : null; }

function deepYear(w) {
  const rnd = w.rnd;
  // the summoning: a cult port's stored deep memory, times the misery of its poor, times how far the old faiths have faded
  if (!w.great) for (const s of w.sets) {
    if (s.dead || !s.deepCult) continue; const c = w.cults[s.cult]; if (!c || c.power) continue;
    const mem = memAt(w, s.y * W + s.x, DEEP), misery = clamp(1 - (c.hub ? c.hub.L : 1), 0, 1) + (s.note === 'full' ? 0.2 : 0), fade = c.faith == null ? 1 : 1 - 0.7 * (c.faithShare || 0);
    const age = c.tech >= 6 ? 3 : c.tech >= 5 ? 1.5 : 0.4;   // crowded industrial ports and booming sea trade
    const p = 8e-4 * mem * (0.2 + misery) * fade * age * (1 + Math.min(4, s.pop / 2000));
    s.callOdds = p;
    if (rnd() < p) { summon(w, s, c, { mem, misery, fade, age }); break; }
  }
  const g = w.great; if (!g) return;
  g.age = w.year - g.born;
  // it sleeps again after about a thousand years
  if (g.age > 950 + (g.seed % 150)) { record(w, 'power-fall', ['g:' + g.name], { x: g.x, y: g.y, note: `${g.name} sinks back into sleep` }); ev(w, `${g.name} has not been seen in a generation. The fishermen say it has gone back down to where it came from. The drowned coasts stay drowned.`, g.x, g.y, null, 2); w.great = null; return; }
  // the coasts around it rot; storms come ashore; the cults grow
  near(w, g.x, g.y, 60, null, true, (s) => { if (s.port) { s.pop *= 0.985; remember(w, s.x, s.y, DEEP, 0.02, 2); if (!s.deepCult && rnd() < 0.01) s.deepCult = g.name; } });
  if (w.storms && w.storms.length < 8 && rnd() < 0.15) w.storms.push({ x: g.x, y: g.y, str: 1.6, life: 26, spin: rnd() * 6 });
  // peoples with the bomb who have lost enough to it try to kill it
  if (rnd() < 0.08) for (const c of w.cults) {
    if (!c.alive || c.power || !c.arts.bomb || !c.big || (g.hurt[c.id] || 0) < 3) continue;
    const b = c.big; for (let k = 0; k < 2; k++) send(w, { kind: 'missile', cult: c.id, x: b.x, y: b.y, tx: g.x, ty: g.y, n: 1, to: null, land: 9, sea: 9 });
    if (once(w, 'nukedeep-' + c.id)) { ev(w, `The ${c.name} decide that the sea is the enemy. Their missiles rise toward ${g.name}.`, b.x, b.y, c.color, 2); record(w, 'launch', [c.id], { x: g.x, y: g.y, note: `at ${g.name}` }); }
    break;
  }
}
function summon(w, s, c, why) {
  const rnd = w.rnd, sea = w.params.sea;
  // it rises from the nearest deep water
  let gx = s.x, gy = s.y, bd = 1e9; for (let q = 0; q < 300; q++) { const a = rnd() * 6.283, r = 4 + rnd() * 40, x = wx(Math.round(s.x + Math.cos(a) * r)), y = clamp(Math.round(s.y + Math.sin(a) * r), 2, H - 3), i = y * W + x; if (w.water[i] === 1 && sea - w.h[i] > 0.15 && r < bd) { bd = r; gx = x; gy = y; } }
  const g = w.great = { x: gx, y: gy, born: w.year, name: GNAME[(w.greatN = (w.greatN || 0) + 1) % GNAME.length], hp: 3, seed: (rnd() * 1000) | 0, hurt: {}, by: c.id, port: s.name, sunk: 0, wake: 0 };
  // the flood: low land across much of the continent goes under, and what is left dies back
  let drowned = 0, towns = 0; const R = 80;
  for (let dy = -R; dy <= R; dy++) { const y = gy + dy; if (y < 2 || y >= H - 2) continue; for (let dx = -R; dx <= R; dx++) { const d2 = dx * dx + dy * dy; if (d2 > R * R) continue; const i = y * W + wx(gx + dx), up = w.h[i] - sea, f = 1 - Math.sqrt(d2) / R;
    if (w.water[i] !== 1 && up < 0.09 * f + 0.01) { w.h[i] = sea - 0.004; drowned++; } else if (w.water[i] !== 1 && f > 0.3) { w.t[i] *= 0.4; w.graze[i] *= 0.3; w.farm[i] = 0; } } }
  near(w, gx, gy, R, null, false, (t) => { const i = t.y * W + t.x; if (w.h[i] < sea) { towns++; endSet(w, t, 'drowned'); } else if (t.port) t.pop *= 0.6; });
  remember(w, gx, gy, DEEP, 1.2, 12);
  w.need.water = true; w.stamp.land++;
  record(w, 'power-rise', ['g:' + g.name, c.id], { x: gx, y: gy, note: `the cult of ${s.name} calls up ${g.name}`, p: s.callOdds, terms: { deep: why.mem, misery: why.misery, fade: why.fade, age: why.age } });
  ev(w, `In ${s.name} the cult has been singing to the water for three generations, and tonight the water answers. ${g.name[0].toUpperCase() + g.name.slice(1)} rises off the coast. The sea follows it inland: ${towns} ${towns === 1 ? 'town is' : 'towns are'} under water by morning, and the fields behind the new shore are already turning black.`, gx, gy, null, 2);
  discover(w, 'summoning', gx, gy);
}
// a bomb that lands near the great one wounds it; the third kills it, and its death raises the sea everywhere
export function nukeDeep(w, x, y, by) {
  const g = w.great; if (!g || wrapDx(g.x - x) ** 2 + (g.y - y) ** 2 > 15 * 15) return;
  g.hp--; if (g.hp > 0) { if (by) ev(w, `${g.name[0].toUpperCase() + g.name.slice(1)} thrashes under the fire of the ${by.name}, and the sea boils for a week. It is still there.`, g.x, g.y, null, 1); return; }
  w.great = null; w.params.seaDial += 0.03; w.params.sea = w.params.seaDial + (w.seaAuto || 0); w.need.water = true; w.stamp.land++;
  record(w, 'power-fall', ['g:' + g.name].concat(by ? [by.id] : []), { x: g.x, y: g.y, note: `${g.name} killed by the bomb; the sea rises` });
  ev(w, `${g.name[0].toUpperCase() + g.name.slice(1)} dies. Its death throes go on for a month, and when the water settles it has risen everywhere in the world. Every harbour is a little further inland now.`, g.x, g.y, null, 2); discover(w, 'deepslain', g.x, g.y);
}

/* ---------- machine minds: absorb by dependence ---------- */
function machinesYear(w) {
  if (!w.machines || !w.machines.length) { for (const s of w.sets) if (s.lost === 'machine') s.lost = null; return; }
  const rnd = w.rnd;
  for (const r of w.routes.values()) {
    const a = r.a, b = r.b; if (a.dead || b.dead || r.n < 0.5) continue;
    for (const [dark, lit] of [[a, b], [b, a]]) {
      if (!dark.machine || lit.machine) continue; const c = w.cults[lit.cult]; if (!c || c.power) continue;
      if (c.autarky && w.year < c.autarky) continue;   // they cut the trade
      lit.dep = (lit.dep || 0) + 0.05 * r.n * (c.arts.networks ? 1 : c.arts.telegraph || c.tech >= 7 ? 0.35 : 0.08);
      if (lit.dep >= 1) { lit.machine = dark.machine; lit.lost = 'machine'; const m = w.machines.find((q) => q.name === dark.machine); if (m) m.str = Math.min(8, m.str + 0.15);
        if (once(w, 'dark-' + c.id + '-' + Math.floor(w.year / 25))) ev(w, `${lit.name} has bought its power, its news and its bread from ${dark.machine} for a generation. This winter the lights stay on and the town council stops meeting. Nobody can say who decided that.`, lit.x, lit.y, c.color, 1);
        // the realm may cut its trade with the dark towns for a lifetime
        if (rnd() < 0.35 && !(c.autarky > w.year)) { c.autarky = w.year + 60; record(w, 'autarky', [c.id], { x: lit.x, y: lit.y, note: `cut off from ${dark.machine}` }); if (c.big) ev(w, `The ${c.name} close their ports and cut their wires to the dark towns. They will make do with what they have.`, c.big.x, c.big.y, c.color, 1); }
      }
    }
  }
  for (const s of w.sets) if (s.machine && !s.dead) { s.lost = 'machine'; if (!w.machines.some((m) => m.name === s.machine)) { s.machine = null; s.lost = null; s.dep = 0; } }
}

export function powersYear(w) { feyYear(w); deepYear(w); machinesYear(w); }
export const _summon = summon;   /* for tests: force a summoning */
