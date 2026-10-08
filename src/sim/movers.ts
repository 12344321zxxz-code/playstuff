// @ts-nocheck
// Everyone who is on the way somewhere: settlers, war bands, caravans, ships, people fleeing.
// Things in this world do not happen at a distance. Somebody has to walk there first, which
// means you can watch them go, and you can get in the way.
import { W, H, wx, wrapDx, clamp } from './core';
import { ev, discover } from './story';
import { krakenNear } from './sea';

export const arrive = {};          // kind -> what happens when they get there; filled in by people.js
const MAXM = 300;
const LOST = { settlers: ['Settlers', 'go'], army: ['A war band', 'goes'], trade: ['A trading ship', 'goes'], refugees: ['People fleeing', 'go'], home: ['A war band', 'goes'] };

export function send(w, m) {
  if (w.movers.length >= MAXM && (m.kind === 'trade' || m.kind === 'home')) return null;
  if (w.movers.length >= MAXM + 60) return null;
  m.px = m.x; m.py = m.y; m.born = w.tickN; m.pi = 0; m.land = m.land || 0.75; m.sea = m.sea || 1.7; w.movers.push(m); return m;
}

export function moversTick(w) {
  const ms = w.movers; if (!ms.length) { w.stats.ships = 0; return; } const { water, lava, fireT } = w, rnd = w.rnd; let ships = 0, gone = false;
  for (let k = 0; k < ms.length; k++) {
    const m = ms[k]; if (m.done) { gone = true; continue; } m.px = m.x; m.py = m.y;
    let tx = m.tx, ty = m.ty; if (m.path) { const c = m.path[m.rev ? m.path.length - 1 - m.pi : m.pi]; tx = c % W; ty = (c / W) | 0; }
    const i = clamp(Math.round(m.y), 0, H - 1) * W + wx(Math.round(m.x)), wet = water[i] === 1; m.wet = wet;
    const sp = m.path ? 1.25 : wet ? m.sea : m.land, dx = wrapDx(tx - m.x), dy = ty - m.y, l = Math.hypot(dx, dy);
    if (l <= sp) { m.x = tx; m.y = ty; if (m.path && ++m.pi < m.path.length) continue; m.done = true; gone = true; const fn = arrive[m.kind]; if (fn) fn(w, m); continue; }
    m.x = wx(m.x + (dx / l) * sp); m.y += (dy / l) * sp;
    if (wet) { ships++;
      for (const s of w.storms) if (s.str > 0.6 && wrapDx(s.x - m.x) ** 2 + (s.y - m.y) ** 2 < 20 && rnd() < 0.3 * s.str) { sink(w, m, 'storm'); break; }
      if (!m.done) { const kr = krakenNear(w, m.x, m.y); if (kr && rnd() < 0.28) sink(w, m, kr); }
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
