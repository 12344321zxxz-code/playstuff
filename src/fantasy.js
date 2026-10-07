// The part of the world that is not natural. Magic is treated like a second climate: it wells up
// along the seams between plates and in a few deep springs, soaks into old forest, gathers in
// ruins, and changes what lives in it. Dragons are the top of the food chain.
import { W, H, N, clamp, wx, wrapDx, cyl, DISC } from './core.js';
import { ev, discover } from './story.js';
import { ignite } from './life.js';
import { near, colorOf, endSet, flee } from './people.js';

export function initMagic(w) {
  const ley = (w.ley = new Float32Array(N)), pd = w._pd, s = w.seed;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x, d = pd ? pd[i] : 99, n = cyl(x, y, 1 / 26, s + 201, 3); ley[i] = d < 6 && n > 0.55 ? Math.exp(-(d * d) / 6) * (n - 0.55) * 4 : 0; }
  w.wells = [];
  for (let k = 0; k < 7; k++) { const x = (w.rnd() * W) | 0, y = (H * (0.12 + 0.76 * w.rnd())) | 0; w.wells.push({ x, y }); for (const o of DISC[4]) { const yy = y + o[1]; if (yy < 0 || yy >= H) continue; ley[yy * W + wx(x + o[0])] += 1.2 * Math.exp(-(o[2] * o[2]) / 5); } }
  for (let i = 0; i < N; i++) w.magic[i] = Math.min(1, ley[i] * 0.6);
  w.dragons = []; w.dragonNames = 0;
}

export function magicYear(w) {
  const { magic, ley, t, mi, water, g } = w; let ench = 0, ex = 0, ey = 0;
  const part = w.year & 1;
  for (let y = 1 + part; y < H - 1; y += 2) for (let x = 0; x < W; x++) {
    const i = y * W + x; let m = magic[i];
    const a = (magic[i - W] + magic[i + W] + magic[y * W + (x + 1) % W] + magic[y * W + (x + W - 1) % W]) * 0.25;
    m += 0.12 * (a - m) + ley[i] * 0.02 + (t[i] > 0.85 && mi[i] > 0.9 ? 0.006 : 0) - m * 0.012;
    magic[i] = m < 0 ? 0 : m > 1 ? 1 : m;
    if (m > 0.55 && t[i] > 0.5 && !water[i]) { ench++; ex = x; ey = y; if (t[i] < 1) t[i] += 0.02; }
  }
  w.stats.enchanted = ench * 2;
  if (ench > 40 && discover(w, 'enchanted', ex, ey)) ev(w, 'There is a wood where the light falls wrong and the trees do not burn.', ex, ey, null);
  dragonsYear(w);
}

const DNAME = ['Vharog', 'Sesketh', 'Old Ember', 'Mordrath', 'Ithiss', 'Karazun', 'The Red Mother', 'Ashmaw', 'Ulgoroth', 'Nyx', 'Brandscale', 'Tharn'];
export function addDragon(w, x, y) {
  x = wx(Math.round(x)); y = clamp(Math.round(y), 2, H - 3); const sea = w.params.sea;
  // roost on the highest ground nearby
  let bi = y * W + x, bh = w.h[bi];
  for (const o of DISC[12]) { const yy = y + o[1]; if (yy < 2 || yy >= H - 2) continue; const i = yy * W + wx(x + o[0]); if (w.h[i] > bh) { bh = w.h[i]; bi = i; } }
  if (bh < sea) return null;
  const d = { x: bi % W, y: (bi / W) | 0, lx: bi % W, ly: (bi / W) | 0, hoard: 0, age: 0, hunger: 2, st: 'wake', tx: 0, ty: 0, sleep: 0, name: DNAME[w.dragonNames++ % DNAME.length], target: null, px: bi % W, py: (bi / W) | 0 };
  w.dragons.push(d); return d;
}
function dragonsYear(w) {
  const rnd = w.rnd, sea = w.params.sea;
  if (w.dragons.length < 3 && w.year > 60 && rnd() < 0.012) {
    for (let q = 0; q < 200; q++) { const i = (rnd() * N) | 0; if (w.h[i] - sea > 0.42 && !w.ice[i] && (w.magic[i] > 0.15 || rnd() < 0.1)) { const d = addDragon(w, i % W, (i / W) | 0); if (d) { ev(w, `Something has taken the high peaks for its own. Shepherds call it ${d.name}.`, d.x, d.y, null); discover(w, 'dragon', d.x, d.y); } break; } }
  }
  for (const d of w.dragons) {
    d.age++; const li = d.ly * W + d.lx; w.magic[li] = Math.min(1, w.magic[li] + 0.05);
    if (w.water[li] === 1) { d.dead = true; continue; }
    if (d.st === 'sleep') { if (--d.sleep <= 0) d.st = 'wake'; continue; }
    if (d.st !== 'wake') continue;
    // choose: plunder a town, or eat
    let town = null, tb = 0;
    if (rnd() < 0.3 + Math.min(0.4, d.age / 400)) near(w, d.lx, d.ly, 50, null, true, (s) => { const v = s.pop * (w.cults[s.cult].gold ? 2 : 1); if (s.pop > 150 && v > tb) { tb = v; town = s; } });
    if (town) { d.st = 'fly'; d.target = { kind: 'town', s: town }; d.tx = town.x; d.ty = town.y; continue; }
    let herd = null, hb = 0; for (const h of w.herds) { const q = wrapDx(h.x - d.lx) ** 2 + (h.y - d.ly) ** 2; if (q < 42 * 42 && h.n > hb) { hb = h.n; herd = h; } }
    if (herd) { d.st = 'fly'; d.target = { kind: 'herd', h: herd }; d.tx = herd.x; d.ty = herd.y; } else { d.hunger++; if (d.hunger > 14) { d.dead = true; ev(w, `${d.name} has not been seen in years. The peaks are quiet.`, d.lx, d.ly, null); } }
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
    if (tg.kind === 'herd') { tg.h.n = Math.max(0, tg.h.n - 22); }
    else if (!tg.s.dead) { const s = tg.s, c = w.cults[s.cult];
      if (s.tower && rnd() < 0.7) { if (discover(w, 'ward', s.x, s.y)) ev(w, `${d.name} circles ${s.name} twice and turns away. The tower is lit.`, s.x, s.y, colorOf(c)); d.st = 'home'; d.tx = d.lx; d.ty = d.ly; continue; }
      if (c.tech >= 3 && s.pop > 900 && rnd() < 0.14 + (c.arts.iron ? 0.08 : 0)) { d.dead = true; s.pop *= 0.9; c.coh = Math.min(1, c.coh + 0.25); c.know *= 1.05; ev(w, `${d.name} comes for ${s.name} and does not leave. The city keeps the skull over its gate.`, s.x, s.y, colorOf(c)); discover(w, 'slayer', s.x, s.y); continue; }
      const loot = s.pop * 0.18; s.pop -= loot; flee(w, s, loot * 0.5); s.burned++; d.hoard += loot / 40 + (c.gold ? 4 : 0); for (const o of DISC[2]) { const yy = s.y + o[1]; if (yy < 1 || yy >= H - 1) continue; if (rnd() < 0.5) ignite(w, yy * W + wx(s.x + o[0])); }
      if (s.pop < 40 && s.tier >= 1) { endSet(w, s, 'dragon'); } else if (s.burned === 1) ev(w, `${d.name} falls on ${s.name} out of a clear sky.`, s.x, s.y, null, s.tier < 2 ? 1 : 0); else if (s.burned % 4 === 0) ev(w, `${s.name} has burned ${s.burned} times now. Its people rebuild in stone and keep watching the sky.`, s.x, s.y, colorOf(c), 1);
      if (d.hoard > 22 && discover(w, 'hoard', d.lx, d.ly)) ev(w, `The hoard of ${d.name} is the richest thing in the world, and everyone knows where it is.`, d.lx, d.ly, null); }
    d.st = 'home'; d.tx = d.lx; d.ty = d.ly;
  }
  if (w.dragons.some((d) => d.dead)) w.dragons = w.dragons.filter((d) => !d.dead);
}
