// Great works: what peoples do to the land once they know how. Dams that drown a valley into a
// lake, canals cut through a neck of land so two seas meet, dikes that push the sea back and farm
// the floor of it, walls across the steppe, mountain passes blasted open, forests eaten by the
// furnaces, deserts watered by canals; and for sorcerers, land raised out of the sea. Every work
// is permanent in the world and remembered by name in the chronicle.
import { W, H, N, DISC, NB8, wx, wrapDx, clamp } from './core.js';
import { ev, discover, once } from './story.js';
import { near } from './people.js';

export function initWorks(w) { w.works = []; w.wall = new Uint8Array(N); w.canal = new Uint8Array(N); }
const nearWork = (w, kind, x, y, r) => w.works.some((q) => q.kind === kind && wrapDx(q.x - x) ** 2 + (q.y - y) ** 2 < r * r);
const done = (w, kind, x, y, cult, name) => { w.works.push({ kind, x, y, cult, year: w.year, name }); if (w.works.length > 300) w.works.shift(); w.stamp.land++; w.edited = true; };

export function worksYear(w) {
  const rnd = w.rnd;
  for (const c of w.cults) { if (c.power) continue;
    if (!c.alive || !c.big || c.count < 3) continue; const A = c.arts;
    if (A.irrigation && A.masonry && rnd() < (A.mills ? 0.02 : 0.008)) dam(w, c);
    if (A.canals && rnd() < 0.012) canal(w, c);
    if (A.irrigation && rnd() < (A.canals ? 0.03 : 0.01)) waterDesert(w, c);
    if (A.dikes && rnd() < 0.02) dikes(w, c);
    if (A.masonry && (A.bureaucracy || c.count >= 16) && (c.raided || 0) > 3 && w.year - (c.wallAt || -999) > 250 && w.works.filter((q) => q.kind === 'wall').length < 3 && rnd() < 0.02) greatWall(w, c);
    if (A.dynamite && rnd() < 0.02) blast(w, c);
    if ((A.engines || A.steel) && rnd() < 0.5) furnaces(w, c);
    if (A.earthwork && rnd() < 0.01) raiseLand(w, c);
  }
  for (let i = 0; i < N; i++) if (w.canal[i] && w.water[i] !== 1) { /* irrigation canals keep the ground watered */ w.wetBias[i] = Math.max(w.wetBias[i], 0.6); }
}
const setsOf = (w, c) => w.sets.filter((s) => s.cult === c.id && !s.dead && !s.nomad);

// A dam across a river below a town: the valley behind it fills into a lake.
function dam(w, c) {
  const { river, h } = w, sea = w.params.sea;
  for (const s of setsOf(w, c)) {
    if (s.tier < 2 || nearWork(w, 'dam', s.x, s.y, 14)) continue; let bi = -1, bh = 0;
    for (const o of DISC[6]) { const yy = s.y + o[1]; if (yy < 2 || yy >= H - 2) continue; const i = yy * W + wx(s.x + o[0]); if (river[i] >= 2 && h[i] - sea > 0.06 && h[i] - sea > bh) { bh = h[i] - sea; bi = i; } }
    if (bi < 0) continue; const x = bi % W, y = (bi / W) | 0, d = w.down[bi]; if (d < 0) continue;
    // build the wall one cell downstream, across the flow
    const dx = (d % W) - x, dy = ((d / W) | 0) - y;
    for (let k = -2; k <= 2; k++) { const xx = wx(x + dx - dy * k), yy = clamp(y + dy + dx * k, 1, H - 2), j = yy * W + xx; h[j] = Math.max(h[j], h[bi] + 0.04); w.wall[j] = 2; }
    w.need.water = true; done(w, 'dam', x, y, c.id);
    ev(w, `The ${c.name} dam the river above ${s.name}. Behind the wall a lake fills the valley, and the fields below never go dry.`, x, y, c.color, once(w, 'dam') ? 0 : 1); discover(w, 'dam', x, y);
    for (const o of DISC[8]) { const yy = y + o[1]; if (yy < 0 || yy >= H) continue; const j = yy * W + wx(x + o[0]); w.wetBias[j] = Math.min(2, w.wetBias[j] + 0.3); }
    return;
  }
}
// Cut a neck of land between two coasts.
function canal(w, c) {
  const { water, h } = w, sea = w.params.sea;
  for (const s of setsOf(w, c)) {
    if (!s.port || s.tier < 2 || nearWork(w, 'canal', s.x, s.y, 30)) continue;
    for (let k = 0; k < 8; k++) {
      const [dx, dy] = NB8[k]; let x = s.x, y = s.y, land = 0, ok = false; const path = [];
      for (let step = 0; step < 16; step++) { x = wx(x + dx); y += dy; if (y < 2 || y >= H - 2) break; const i = y * W + x; if (water[i] === 1) { ok = land >= 4; break; } if (h[i] - sea > 0.2) break; land++; path.push(i); }
      if (!ok) continue;
      // only worth it if the sea on the far side is a long way round
      const far = y * W + x; let around = 0; for (const o of DISC[3]) { const yy = s.y + o[1]; if (yy < 0 || yy >= H) continue; const j = yy * W + wx(s.x + o[0]); if (water[j] === 1 && w.mass && w.dSea) around++; }
      if (!around) continue;
      for (const i of path) { h[i] = sea - 0.03; w.canal[i] = 1; w.farm[i] = 0; w.urban[i] = 0; }
      w.need.water = true; done(w, 'canal', s.x, s.y, c.id);
      ev(w, `The ${c.name} cut a canal from ${s.name} straight through the land to the far sea. Ships that went the long way round for generations sail through in a day.`, s.x, s.y, c.color, 0); discover(w, 'canal', s.x, s.y);
      return;
    }
  }
}
// Irrigation canals carried out from a river into dry country: the desert turns green.
function waterDesert(w, c) {
  const { mi, river, water } = w;
  for (const s of setsOf(w, c)) {
    if (s.tier < 2 || mi[s.y * W + s.x] > 0.45 || nearWork(w, 'ditch', s.x, s.y, 10)) continue; let src = -1;
    for (const o of DISC[5]) { const yy = s.y + o[1]; if (yy < 1 || yy >= H - 1) continue; const i = yy * W + wx(s.x + o[0]); if (river[i] >= 2 || water[i] === 2) { src = i; break; } }
    if (src < 0) continue; const a = w.rnd() * 6.283; let x = src % W, y = (src / W) | 0, n = 0;
    for (let k = 0; k < 14; k++) { x = wx(Math.round(x + Math.cos(a))); y = clamp(Math.round(y + Math.sin(a)), 1, H - 2); const i = y * W + x; if (water[i]) break; w.canal[i] = 2; n++; for (const o of DISC[2]) { const yy = y + o[1]; const j = yy * W + wx(x + o[0]); w.wetBias[j] = Math.min(2.5, w.wetBias[j] + 0.5); } }
    if (n < 4) continue; done(w, 'ditch', s.x, s.y, c.id); w.need.climate = true;
    if (once(w, 'ditch-' + c.id)) ev(w, `The ${c.name} dig canals out from the river into the dry country around ${s.name}. Where there was sand there are fields.`, s.x, s.y, c.color, 1); discover(w, 'greening', s.x, s.y);
    return;
  }
}
// Push the sea back: dikes around the shallows, then pump them dry and farm the sea floor.
function dikes(w, c) {
  const { water, h } = w, sea = w.params.sea;
  for (const s of setsOf(w, c)) {
    if (!s.port || nearWork(w, 'polder', s.x, s.y, 8)) continue; const cells = [];
    for (const o of DISC[6]) { const yy = s.y + o[1]; if (yy < 2 || yy >= H - 2) continue; const i = yy * W + wx(s.x + o[0]); if (water[i] === 1 && sea - h[i] < 0.035) cells.push(i); }
    if (cells.length < 4) continue;
    for (const i of cells.slice(0, 14)) { h[i] = sea + 0.008; w.soil[i] = 1; }
    w.need.water = true; done(w, 'polder', s.x, s.y, c.id);
    ev(w, `The ${c.name} build dikes out into the shallows off ${s.name} and pump the sea out. Cows graze where fish swam.`, s.x, s.y, c.color, once(w, 'polder') ? 0 : 1); discover(w, 'polder', s.x, s.y);
    return;
  }
}
// A wall across the country the riders come from.
function greatWall(w, c) {
  const b = c.big; let rider = null, rd = 1e9;
  near(w, b.x, b.y, 60, null, false, (s, q) => { if (s.nomad && s.cult !== c.id && w.cults[s.cult].arts.riding && q < rd) { rd = q; rider = s; } });
  if (!rider || nearWork(w, 'wall', b.x, b.y, 30)) return;
  const dx = wrapDx(rider.x - b.x), dy = rider.y - b.y, l = Math.hypot(dx, dy) || 1, mx = b.x + dx * 0.55, my = b.y + dy * 0.55, px = -dy / l, py = dx / l; let n = 0;
  for (let k = -14; k <= 14; k++) { const x = wx(Math.round(mx + px * k)), y = clamp(Math.round(my + py * k), 1, H - 2), i = y * W + x; if (w.water[i] || w.h[i] - w.params.sea > 0.5) continue; w.wall[i] = 1; n++; }
  if (n < 8) return; done(w, 'wall', wx(Math.round(mx)), Math.round(my), c.id); c.raided = 0; c.wallAt = w.year;
  ev(w, `The ${c.name} build a wall across the grass, ${n * 20} miles of it, to keep the riders out. It takes a generation and a great many lives.`, wx(Math.round(mx)), Math.round(my), c.color, 0); discover(w, 'greatwall', wx(Math.round(mx)), Math.round(my));
}
export function wallBetween(w, x0, y0, x1, y1) { const dx = wrapDx(x1 - x0); for (let k = 1; k < 16; k++) { const i = clamp(Math.round(y0 + ((y1 - y0) * k) / 16), 0, H - 1) * W + wx(Math.round(x0 + (dx * k) / 16)); if (w.wall[i] === 1) return true; } return false; }
// Blast a road through the mountains between two of their towns.
function blast(w, c) {
  const S = setsOf(w, c).filter((s) => s.tier >= 2); if (S.length < 2) return; const a = S[(w.rnd() * S.length) | 0]; let b = null, bd = 1e9;
  for (const s of S) { if (s === a) continue; const q = wrapDx(s.x - a.x) ** 2 + (s.y - a.y) ** 2; if (q < bd && q < 900) { bd = q; b = s; } } if (!b) return;
  const sea = w.params.sea, dx = wrapDx(b.x - a.x); let hi = -1, hh = 0.3;
  for (let k = 1; k < 20; k++) { const i = clamp(Math.round(a.y + ((b.y - a.y) * k) / 20), 0, H - 1) * W + wx(Math.round(a.x + (dx * k) / 20)); if (w.h[i] - sea > hh) { hh = w.h[i] - sea; hi = i; } }
  if (hi < 0 || nearWork(w, 'pass', hi % W, (hi / W) | 0, 10)) return; const x = hi % W, y = (hi / W) | 0;
  for (const o of DISC[2]) { const j = clamp(y + o[1], 0, H - 1) * W + wx(x + o[0]); w.h[j] = Math.min(w.h[j], sea + 0.22); } w.need.water = true; done(w, 'pass', x, y, c.id);
  ev(w, `The ${c.name} blow a road through the mountains between ${a.name} and ${b.name}. The peak that stood there for ever is gone.`, x, y, c.color, 0); discover(w, 'blast', x, y);
}
// Furnaces eat the forests around the towns that feed them.
function furnaces(w, c) {
  const k = c.arts.engines ? 0.92 : 0.985; let cut = 0;
  for (const s of setsOf(w, c)) { if (s.tier < 2) continue; for (const o of DISC[Math.min(10, s.R + 3)]) { const yy = s.y + o[1]; if (yy < 0 || yy >= H) continue; const i = yy * W + wx(s.x + o[0]); if (w.t[i] > 0.2 && !(w.mem && w.mem[i * 6 + 1] > 0.6)) { w.t[i] *= k; cut++; } } }
  if (c.arts.engines && cut > 400 && once(w, 'stumps-' + c.id) && c.big) { ev(w, `The forests around the cities of the ${c.name} are gone into the furnaces. The hills are bare to the horizon.`, c.big.x, c.big.y, c.color, 1); discover(w, 'stumps', c.big.x, c.big.y); }
}
// Sorcerers raise land out of the sea beside their towers.
function raiseLand(w, c) {
  const sea = w.params.sea;
  for (const s of setsOf(w, c)) {
    if (!s.tower || !s.port || nearWork(w, 'raised', s.x, s.y, 20)) continue; let bi = -1;
    for (const o of DISC[8]) { const yy = s.y + o[1]; if (yy < 3 || yy >= H - 3) continue; const i = yy * W + wx(s.x + o[0]); if (w.water[i] === 1 && sea - w.h[i] < 0.12 && o[2] > 4) { bi = i; break; } }
    if (bi < 0) continue; const x = bi % W, y = (bi / W) | 0;
    for (const o of DISC[3]) { const j = clamp(y + o[1], 0, H - 1) * W + wx(x + o[0]); w.h[j] = Math.max(w.h[j], sea + 0.03 + 0.05 * (1 - o[2] / 4)); w.soil[j] = 1.1; }
    if (w.mem) for (const o of DISC[3]) { const j = clamp(y + o[1], 0, H - 1) * W + wx(x + o[0]); w.mem[j * 6 + 3] *= 0.3; }
    w.need.water = true; done(w, 'raised', x, y, c.id);
    ev(w, `The sorcerers of ${s.name} spend a winter in their tower, and in spring there is an island off the harbour that was never there before.`, x, y, c.color, 0); discover(w, 'raised', x, y);
    return;
  }
}
