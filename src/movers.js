// Everyone who is on the way somewhere: settlers, war bands, caravans, ships, people fleeing.
// Things in this world do not happen at a distance. Somebody has to walk there first, which
// means you can watch them go, and you can get in the way.
import { W, H, wx, wrapDx, clamp } from './core.js';
import { ev, discover } from './story.js';
import { krakenNear } from './sea.js';
import { greatNear, navyFactor } from './greatpowers.js';
import { pirateNear } from './trade.js';

export const arrive = {};
export const onRoad = {};          // kind -> what can happen to them on the way (checked every fourth tick); filled in by people.js          // kind -> what happens when they get there; filled in by people.js
const MAXM = 300;
const LOST = { tribute: ['A tribute caravan', 'goes'], settlers: ['Settlers', 'go'], army: ['A war band', 'goes'], trade: ['A trading ship', 'goes'], refugees: ['People fleeing', 'go'], home: ['A war band', 'goes'] };

export function send(w, m) {
  if (w.movers.length >= MAXM && (m.kind === 'trade' || m.kind === 'home')) return null;
  if (w.movers.length >= MAXM + 60) return null;
  m.px = m.x; m.py = m.y; m.born = w.tickN; m.pi = 0; m.land = m.land || 0.75; m.sea = m.sea || 1.7; w.movers.push(m); return m;
}

export function moversTick(w) {
  const ms = w.movers; if (!ms.length) { w.stats.ships = 0; return; } const { water, lava, fireT } = w, rnd = w.rnd; let ships = 0, gone = false;
  for (let k = 0; k < ms.length; k++) {
    const m = ms[k]; if (m.done) { gone = true; continue; } m.px = m.x; m.py = m.y;
    const i = clamp(Math.round(m.y), 0, H - 1) * W + wx(Math.round(m.x)), wet = water[i] === 1; m.wet = wet;
    if (m.path) {   /* walk the route point by point, so a fast carrier never cuts a corner over land or sea */
      const P = m.path, n = P.length; let left = 1.25 * (m.step || 1), there = false;
      while (left > 1e-6) { const c = P[m.rev ? n - 1 - m.pi : m.pi], tx = c % W, ty = (c / W) | 0, dx = wrapDx(tx - m.x), dy = ty - m.y, l = Math.hypot(dx, dy);
        if (l <= left) { m.x = tx; m.y = ty; left -= l; if (++m.pi >= n) { there = true; break; } } else { m.x = wx(m.x + (dx / l) * left); m.y += (dy / l) * left; left = 0; } }
      if (there) { m.done = true; gone = true; const fn = arrive[m.kind]; if (fn) fn(w, m); continue; }
    } else {
      const tx = m.tx, ty = m.ty, sp = wet ? m.sea : m.land, dx = wrapDx(tx - m.x), dy = ty - m.y, l = Math.hypot(dx, dy);
      if (l <= sp) { m.x = tx; m.y = ty; m.done = true; gone = true; const fn = arrive[m.kind]; if (fn) fn(w, m); continue; }
      m.x = wx(m.x + (dx / l) * sp); m.y += (dy / l) * sp;
    }
    if (!wet && !m.done && (w.tickN & 3) === (k & 3) && onRoad[m.kind]) onRoad[m.kind](w, m);
    if (wet && m.kind !== 'missile') { ships++;
      for (const s of w.storms) if (s.str > 0.6 && wrapDx(s.x - m.x) ** 2 + (s.y - m.y) ** 2 < 20 && rnd() < 0.3 * s.str) { sink(w, m, 'storm'); break; }
      if (!m.done) { const c0 = w.cults[m.cult], g = greatNear(w, m.x, m.y), kr = g || krakenNear(w, m.x, m.y); if (kr && rnd() < (g ? 0.35 : 0.28) * (c0 ? navyFactor(c0) : 1)) { if (g) g.hurt[m.cult] = (g.hurt[m.cult] || 0) + 1; sink(w, m, kr); } }   /* steam halves the deep's toll, modern navies cut it to a fifth */
      if (!m.done && (w.tickN & 3) === 0) { const pr = pirateNear(w, m); if (pr && rnd() < 0.3) { m.done = true; pr.taken++; pr.last = w.year; if (pr.taken === 1 || pr.taken % 10 === 0) ev(w, `${pr.name[0].toUpperCase() + pr.name.slice(1)} take a ship of the ${w.cults[m.cult].name}${m.goods >= 0 ? ' and everything in its hold' : ''}.`, Math.round(m.x), Math.round(m.y), null, 1); } }
    } else if (lava[i] || fireT[i]) { m.n *= 0.7; if (m.n < 2) m.done = true; }
    if (m.done) gone = true; else if (w.tickN - m.born > 420) { m.done = true; gone = true; }
  }
  w.stats.ships = ships;
  if (gone) w.movers = ms.filter((m) => !m.done);
}
function sink(w, m, why) {
  m.done = true; const c = w.cults[m.cult], x = Math.round(m.x), y = Math.round(m.y); w.fx.push({ k: 'ring', x, y, T: 1.4, R: 3 });
  if (why === 'storm') { if (m.kind !== 'trade' || w.rnd() < 0.3) ev(w, `${LOST[m.kind][0]} of the ${c.name} ${LOST[m.kind][1]} down in the storm.`, x, y, c.color, m.kind === 'trade' || m.n < 40 ? 1 : 0); }
  else { why.sunk++; why.wake = 3; const first = discover(w, 'kraken', x, y); ev(w, first ? `Ships of the ${c.name} do not come home. One man is found on a beach, raving about ${why.name}.` : `${why.name} takes another ship of the ${c.name}.`, x, y, c.color, first ? 0 : 1); }
}
// A disaster at (x, y): everyone on the road within r is caught in it.
export function hitMovers(w, x, y, r, p) {
  let n = 0; for (const m of w.movers) if (!m.done && wrapDx(m.x - x) ** 2 + (m.y - y) ** 2 < r * r && (p == null || w.rnd() < p)) { m.done = true; n++; } return n;
}
