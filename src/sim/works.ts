// @ts-nocheck
// Great works: what peoples do to the land when they have the hands and the knowledge. Canals
// carry river water out to dry fields; dams turn valleys into lakes; dikes take land from the
// sea; mines scar the hills; and a people pressed by riders builds a wall across the whole
// frontier. Each is built over years, and each changes the water, the soil or the map.
import { W, H, N, DISC, clamp, wx, wrapDx } from './core';
import { ev, discover, once } from './story';
import { near } from './people';

export const WK = { canal: 1, dam: 2, dike: 4, wall: 8, mine: 16, quarry: 32 };
export function initWorks(w) { w.works = new Uint8Array(N); w.projects = []; w.worksStamp = 0; }

export function worksYear(w) {
  if (!w.works) return; const rnd = w.rnd;
  for (const p of w.projects) { if (p.done) continue; const s = w.sets.find((q) => q.id === p.at && !q.dead); if (!s) { p.done = true; p.failed = true; continue; } p.prog += (s.pop / 900) * (w.cults[s.cult].arts.writing ? 1.4 : 1); if (p.prog >= p.need) finish(w, p, s); }
  if (w.projects.length > 300) w.projects = w.projects.filter((p) => !p.done).concat(w.projects.filter((p) => p.done).slice(-150));
  for (const s of w.sets) {
    if (s.dead || s.nomad || s.tier < 2 || rnd() > 0.04) continue; const c = w.cults[s.cult], A = c.arts; if (w.projects.some((p) => !p.done && p.at === s.id)) continue;
    const i0 = s.y * W + s.x, sea = w.params.sea;
    if (A.irrigation && w.mi[i0] < 0.55 && !(s.works && s.works.includes('canals'))) { const path = canalPath(w, s); if (path) { start(w, s, 'canal', path, 6); continue; } }
    if (A.masonry && A.writing && s.tier === 3 && w.dSea[i0] <= 4 && rnd() < 0.5) { const cells = dikeCells(w, s); if (cells.length >= 6) { start(w, s, 'dike', cells, 10); continue; } }
    if (A.masonry && s.tier === 3 && rnd() < 0.3) { const d = damSite(w, s); if (d) { start(w, s, 'dam', d.cells, 12).top = d.top; continue; } }
    if ((A.bronze || A.iron) && s.ores && !(s.works && s.works.includes('mines'))) { const m = mineSite(w, s); if (m >= 0) { start(w, s, 'mine', [m], 3); continue; } }
    if (A.masonry && A.writing && c.war && c.env.sed >= 12 && w.cults[c.war.foe].env.nomads > w.cults[c.war.foe].env.sed && !c.wallBuilt) { const path = wallPath(w, c, w.cults[c.war.foe]); if (path) { c.wallBuilt = w.year; start(w, s, 'wall', path, 18); } }
  }
}
function start(w, s, kind, cells, need) { const p = { id: w.nextId++, kind, at: s.id, cult: s.cult, cells, need, prog: 0, began: w.year, x: s.x, y: s.y, done: false, top: null }; w.projects.push(p); return p; }
const SAY = {
  canal: (s, c) => `The ${c.name} dig a canal to bring river water to the fields of ${s.name}.`, dam: (s, c) => `A dam goes across the valley above ${s.name}. Behind it, a lake begins to fill.`,
  dike: (s, c) => `${s.name} builds dikes and pumps the shallows dry. The new fields are below the sea.`, mine: (s, c) => `Mines go into the hills above ${s.name}.`,
  wall: (s, c) => `The ${c.name} finish a wall across their whole frontier. The riders will have to go around.`,
};
function finish(w, p, s) {
  p.done = true; p.end = w.year; const c = w.cults[s.cult], h = w.h, sea = w.params.sea;
  for (const i of p.cells) w.works[i] |= WK[p.kind];
  if (p.kind === 'dam' && p.top > -2) { for (const i of p.cells) h[i] = Math.max(h[i], p.top); w.stamp.land++; w.need.water = true; }
  if (p.kind === 'dike') { for (const i of p.cells) { h[i] = sea + 0.008; w.soil[i] = 1.2; } w.stamp.land++; w.need.water = true; w.need.climate = true; }
  if (p.kind === 'canal') w.need.water = true;
  if (p.kind === 'mine') { for (const o of DISC[1]) { const j = clamp(((p.cells[0] / W) | 0) + o[1], 1, H - 2) * W + wx((p.cells[0] % W) + o[0]); w.t[j] *= 0.3; w.g[j] *= 0.5; } }
  (s.works || (s.works = [])).push({ canal: 'canals', dam: 'a dam', dike: 'dikes', mine: 'mines', wall: 'the wall' }[p.kind]);
  w.worksStamp++; const first = once(w, 'work-' + p.kind);
  ev(w, SAY[p.kind](s, c), s.x, s.y, c.color, first || p.kind === 'wall' ? 0 : 1);
  discover(w, 'works', s.x, s.y); if (p.kind === 'wall') discover(w, 'wall', s.x, s.y); if (p.kind === 'dike') discover(w, 'polder', s.x, s.y); if (p.kind === 'canal' && first) discover(w, 'canal', s.x, s.y);
}
// from the town to the nearest real river, downhill-ish, a few cells long
function canalPath(w, s) {
  let best = -1, bd = 1e9; for (const o of DISC[8]) { const y = s.y + o[1]; if (y < 1 || y >= H - 1) continue; const i = y * W + wx(s.x + o[0]); if (w.river[i] >= 2 && o[2] < bd && o[2] > 1.5) { bd = o[2]; best = i; } }
  if (best < 0) return null; const path = [], bx = best % W, by = (best / W) | 0, n = Math.ceil(bd * 1.3) + 4, ang = Math.atan2(s.y - by, wrapDx(s.x - bx));
  // from the river past the town into the dry country
  for (let k = 0; k <= n; k++) { const x = wx(Math.round(bx + Math.cos(ang) * k)), y = clamp(Math.round(by + Math.sin(ang) * k), 1, H - 2), i = y * W + x; if (w.water[i] === 1) break; if (!path.includes(i)) path.push(i); }
  return path.length >= 3 ? path : null;
}
function dikeCells(w, s) {
  const out = [], sea = w.params.sea; for (const o of DISC[6]) { const y = s.y + o[1]; if (y < 2 || y >= H - 2) continue; const i = y * W + wx(s.x + o[0]); if (w.water[i] === 1 && w.h[i] > sea - 0.035) { let land = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (w.water[(y + dy) * W + wx(s.x + o[0] + dx)] !== 1) land++; if (land >= 2) out.push(i); } }
  return out.slice(0, 40);
}
// a narrow place on a river in the hills upstream, where a wall makes a lake
function damSite(w, s) {
  for (const o of DISC[10]) { if (o[2] < 4) continue; const y = s.y + o[1]; if (y < 3 || y >= H - 3) continue; const x = wx(s.x + o[0]), i = y * W + x; if (w.river[i] < 2 || w.h[i] - w.params.sea < 0.08) continue;
    const d = w.down[i]; if (d < 0) continue; const dx = (d % W) - x, dy = ((d / W) | 0) - y, px = -dy, py = dx; const cells = []; let top = w.h[i] + 0.035, ok = 0;
    for (let k = -4; k <= 4; k++) { const cx = wx(x + px * k), cy = clamp(y + py * k, 1, H - 2), j = cy * W + cx; cells.push(j); if (w.h[j] > top) ok++; }
    if (ok >= 2) return { cells, top }; }
  return null;
}
function mineSite(w, s) { for (const o of DISC[5]) { const y = s.y + o[1]; if (y < 1 || y >= H - 1) continue; const i = y * W + wx(s.x + o[0]); if (w.ore[i] && w.ore[i] !== 5 && w.water[i] !== 1) return i; } return -1; }
// a line between the two peoples' lands, across the frontier, long enough to matter
function wallPath(w, c, foe) {
  const a = c.big, b = foe.big; if (!a || !b) return null; const mx = (a.x + wrapDx(b.x - a.x) * 0.45), my = (a.y + (b.y - a.y) * 0.45), ang = Math.atan2(b.y - a.y, wrapDx(b.x - a.x)) + Math.PI / 2, path = [];
  for (let k = -26; k <= 26; k++) { const x = wx(Math.round(mx + Math.cos(ang) * k)), y = clamp(Math.round(my + Math.sin(ang) * k), 1, H - 2), i = y * W + x; if (w.water[i]) continue; if (!path.includes(i)) path.push(i); }
  return path.length > 16 ? path : null;
}
// Riders crossing a wall lose heart; used by people.ts when a nomad army arrives.
export function crossesWall(w, x0, y0, x1, y1) { if (!w.works) return false; const dx = wrapDx(x1 - x0); for (let k = 1; k < 16; k++) { const x = wx(Math.round(x0 + (dx * k) / 16)), y = clamp(Math.round(y0 + ((y1 - y0) * k) / 16), 0, H - 1); if (w.works[y * W + x] & WK.wall) return true; } return false; }
