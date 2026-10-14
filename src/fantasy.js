// The part of the world that is not natural. Magic is treated like a second climate: it wells up
// along the seams between plates and in a few deep springs, soaks into old forest, gathers in
// ruins, and changes what lives in it. Dragons are the top of the food chain.
import { W, H, N, clamp, wx, wrapDx, cyl, DISC } from './core.js';
import { ev, discover } from './story.js';
import { ignite } from './life.js';
import { near, colorOf, endSet, flee } from './people.js';
import { holySite } from './faith.js';
import { initMemory, memoryYear, leyStormsTick, remember, memAt, NK, WILD, FIRE } from './memory.js';
import { initSpirits, spiritsYear, stormPass } from './spirits.js';

export function initMagic(w) { initMemory(w); initSpirits(w); w.dragons = []; w.dragonNames = 0; }

export function magicYear(w) {
  memoryYear(w);
  const { t, water } = w; let ench = 0, ex = 0, ey = 0;
  for (let i = w.year & 3; i < N; i += 4) { if (water[i] || t[i] < 0.5) continue; const wd = w.mem[i * NK + WILD]; if (wd > 0.45) { ench += 2; ex = i % W; ey = (i / W) | 0; if (t[i] < 1) t[i] = Math.min(1, t[i] + 0.02); } }
  w.stats.enchanted = ench * 2;
  if (ench > 40 && w.rnd() < 0.02) holySite(w, ex, ey, 'grove', 0.6);
  if (ench > 40 && discover(w, 'enchanted', ex, ey)) ev(w, 'There is a wood where the light falls wrong and the trees do not burn.', ex, ey, null);
  spiritsYear(w);
  dragonsYear(w);
}
export function magicTick(w) { leyStormsTick(w, stormPass); }
// a dragon that dies leaves its fire in the ground, and in a few lifetimes another hatches there
export function dragonDies(w, d) { d.dead = true; remember(w, d.lx, d.ly, FIRE, 0.9, 4, 'dragonfall', `${d.name} died`, { place: d.name }); }

const DNAME = ['Vharog', 'Sesketh', 'Old Ember', 'Mordrath', 'Ithiss', 'Karazun', 'The Red Mother', 'Ashmaw', 'Ulgoroth', 'Nyx', 'Brandscale', 'Tharn'];
export function addDragon(w, x, y) {
  x = wx(Math.round(x)); y = clamp(Math.round(y), 2, H - 3); const sea = w.params.sea;
  // roost on the highest ground nearby
  let bi = y * W + x, bh = w.h[bi];
  for (const o of DISC[12]) { const yy = y + o[1]; if (yy < 2 || yy >= H - 2) continue; const i = yy * W + wx(x + o[0]); if (w.h[i] > bh) { bh = w.h[i]; bi = i; } }
  if (bh < sea || w.dragons.length >= 8) return null;
  const d = { x: bi % W, y: (bi / W) | 0, lx: bi % W, ly: (bi / W) | 0, hoard: 0, age: 0, hunger: 2, st: 'wake', tx: 0, ty: 0, sleep: 0, name: DNAME[w.dragonNames++ % DNAME.length], target: null, px: bi % W, py: (bi / W) | 0 };
  w.dragons.push(d); return d;
}
function dragonsYear(w) {
  const rnd = w.rnd, sea = w.params.sea;
  if (w.dragons.length < (w.surge ? 6 : 3) && w.year > 60 && rnd() < (w.surge ? 0.08 : 0.03)) {
    for (let q = 0; q < 300; q++) { const i = (rnd() * N) | 0; if (w.h[i] - sea > 0.36 && !w.ice[i] && (memAt(w, i, FIRE) > 0.35 || rnd() < 0.01)) { const d = addDragon(w, i % W, (i / W) | 0); if (d) { ev(w, `Something has taken the high peaks for its own. Shepherds call it ${d.name}.`, d.x, d.y, null); discover(w, 'dragon', d.x, d.y); } break; } }
  }
  for (const d of w.dragons) {
    d.age++;
    // an old dragon lays a clutch; a very old one becomes a great wyrm with a country of its own
    if (d.age > 140 && w.dragons.length < 6 && rnd() < 0.012) { const e = addDragon(w, d.lx + ((rnd() * 20) | 0) - 10, d.ly + ((rnd() * 12) | 0) - 6); if (e) { e.name = e.name.split(',')[0] + ', child of ' + d.name.split(',')[0]; ev(w, `${d.name} has hatched a brood in the high rock. Shepherds count three shapes in the sky now.`, d.lx, d.ly, null, 0); discover(w, 'brood', d.lx, d.ly); } }
    if (d.age > 420 + (d.id || 0) % 200 && rnd() < 0.01) { dragonDies(w, d); ev(w, `${d.name} dies of great age on its hoard. The mountain is warm for a hundred years.`, d.lx, d.ly, null, 0); continue; }
    if (d.age > 260 && !d.wyrm && rnd() < 0.004 && w.dragons.filter((q) => q.wyrm).length < 2) { d.wyrm = true; d.R = 14; ev(w, `${d.name} is a great wyrm now. Nothing lives under its mountain that it has not allowed to live.`, d.lx, d.ly, null, 2); discover(w, 'wyrm', d.lx, d.ly); }
    if (d.wyrm) { d.R = Math.min(26, d.R + 0.05); near(w, d.lx, d.ly, d.R, null, false, (s) => { if (d.pacts && d.pacts.has(s.cult)) return; s.pop *= 0.98; }); for (let q = 0; q < 6; q++) { const a = rnd() * 6.283, r = rnd() * d.R; remember(w, d.lx + Math.cos(a) * r, d.ly + Math.sin(a) * r, FIRE, 0.05, 2); } if (rnd() < 0.2) { const a = rnd() * 6.283, r = rnd() * d.R, i = Math.max(0, Math.min(H - 1, Math.round(d.ly + Math.sin(a) * r))) * W + wx(Math.round(d.lx + Math.cos(a) * r)); if (!w.water[i]) ignite(w, i); } } const li = d.ly * W + d.lx; remember(w, d.lx, d.ly, FIRE, 0.03, 3);
    if (w.water[li] === 1) { d.dead = true; continue; }
    if (d.st === 'sleep') { if (--d.sleep <= 0) d.st = 'wake'; continue; }
    if (d.st !== 'wake') continue;
    // choose: plunder a town, or eat
    let town = null, tb = 0;
    if (rnd() < 0.3 + Math.min(0.4, d.age / 400)) near(w, d.lx, d.ly, 50, null, true, (s) => { if (d.pacts && d.pacts.has(s.cult)) { d.hoard += 0.02; return; } const v = s.pop * (w.cults[s.cult].gold ? 2 : 1); if (s.pop > 150 && v > tb) { tb = v; town = s; } });
    if (town) { d.st = 'fly'; d.target = { kind: 'town', s: town }; d.tx = town.x; d.ty = town.y; continue; }
    let herd = -1, hb = 0.3; for (let q = 0; q < 60; q++) { const a = rnd() * 6.283, r = rnd() * 40, x = wx(Math.round(d.lx + Math.cos(a) * r)), y = Math.round(d.ly + Math.sin(a) * r); if (y < 1 || y >= H - 1) continue; const i = y * W + x; if (w.graze[i] > hb) { hb = w.graze[i]; herd = i; } }
    if (herd >= 0) { d.st = 'fly'; d.target = { kind: 'herd', i: herd }; d.tx = herd % W; d.ty = (herd / W) | 0; } else { d.hunger++; if (d.hunger > 14) { dragonDies(w, d); ev(w, `${d.name} has not been seen in years. The peaks are quiet.`, d.lx, d.ly, null); } }
  }
  if (w.dragons.some((d) => d.dead)) w.dragons = w.dragons.filter((d) => !d.dead);
}
// Dragons move every tick so you can watch them go.
export function dragonsTick(w) {
  const rnd = w.rnd;
  for (const d of w.dragons) {
    if (d.st !== 'fly' && d.st !== 'home') { d.px = d.x; d.py = d.y; continue; }
    d.px = d.x; d.py = d.y; const dx = wrapDx(d.tx - d.x), dy = d.ty - d.y, l = Math.hypot(dx, dy), sp = 4;
    if (l > sp) { d.x = wx(d.x + (dx / l) * sp); d.y += (dy / l) * sp; continue; }
    d.x = d.tx; d.y = d.ty;
    if (d.st === 'home') { d.st = 'sleep'; d.sleep = 6 + ((rnd() * 18) | 0); continue; }
    const tg = d.target; d.hunger = 0;
    if (tg.kind === 'herd') { for (const o of DISC[3]) { const yy = Math.round(d.y) + o[1]; if (yy < 0 || yy >= H) continue; const j = yy * W + wx(Math.round(d.x) + o[0]); w.graze[j] *= 0.3; } }
    else if (!tg.s.dead) { const s = tg.s, c = w.cults[s.cult];
      if (c.stance === 'revere' && rnd() < 0.4) { (d.pacts || (d.pacts = new Set())).add(c.id); c.pacts = (c.pacts || 0) + 1; ev(w, `The ${c.name} begin to leave gold at the foot of the mountain. ${d.name} stops coming.`, s.x, s.y, colorOf(c), 0); discover(w, 'pact', s.x, s.y); d.st = 'home'; d.tx = d.lx; d.ty = d.ly; continue; }
      if (s.tower && rnd() < 0.7) { if (discover(w, 'ward', s.x, s.y)) ev(w, `${d.name} circles ${s.name} twice and turns away. The tower is lit.`, s.x, s.y, colorOf(c)); d.st = 'home'; d.tx = d.lx; d.ty = d.ly; continue; }
      if (c.tech >= 3 && s.pop > 900 && rnd() < 0.14 + (c.arts.iron ? 0.08 : 0) + (c.stance === 'use' ? 0.1 : 0)) { c.treasure = (c.treasure || 0) + d.hoard; dragonDies(w, d); s.pop *= 0.9; c.coh = Math.min(1, c.coh + 0.25); c.know *= 1.05; ev(w, `${d.name} comes for ${s.name} and does not leave. The city keeps the skull over its gate.`, s.x, s.y, colorOf(c)); discover(w, 'slayer', s.x, s.y); holySite(w, s.x, s.y, 'slayer', 0.8); continue; }
      const loot = s.pop * 0.18; s.pop -= loot; flee(w, s, loot * 0.5); s.burned++; if (s.burned === 3) holySite(w, s.x, s.y, 'dragon', 0.6); d.hoard += loot / 40 + (c.gold ? 4 : 0); for (const o of DISC[2]) { const yy = s.y + o[1]; if (yy < 1 || yy >= H - 1) continue; if (rnd() < 0.5) ignite(w, yy * W + wx(s.x + o[0])); }
      if (s.pop < 40 && s.tier >= 1) { endSet(w, s, 'dragon'); } else if (s.burned === 1) ev(w, `${d.name} falls on ${s.name} out of a clear sky.`, s.x, s.y, null, s.tier < 2 ? 1 : 0); else if (s.burned % 4 === 0) ev(w, `${s.name} has burned ${s.burned} times now. Its people rebuild in stone and keep watching the sky.`, s.x, s.y, colorOf(c), 1);
      if (d.hoard > 22 && discover(w, 'hoard', d.lx, d.ly)) ev(w, `The hoard of ${d.name} is the richest thing in the world, and everyone knows where it is.`, d.lx, d.ly, null); }
    d.st = 'home'; d.tx = d.lx; d.ty = d.ly; if (d.repact != null && d.pacts) { d.pacts.add(d.repact); d.repact = null; }
  }
  if (w.dragons.some((d) => d.dead)) w.dragons = w.dragons.filter((d) => !d.dead);
}
