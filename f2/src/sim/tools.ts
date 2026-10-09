// @ts-nocheck
// What each power does to the world. The page sends the tool id, where, and how big; this runs
// it inside the worker. Consequences are left to the simulation.
import { W, H, DISC, clamp, wx, wrapDx } from './core';
import { sculpt, erodeBrush, weather, plant, burn } from './powers';
import { addHerd, addPack } from './fauna';
import { addBand, ORES, near } from './people';
import { addDragon } from './fantasy';
import { meteor, volcano, tsunami, quake, plagueAt, overgrow, babel, inspire, stormAt, locustAt, lightning } from './disasters';
import { addKraken } from './sea';
import { addBeast } from './beasts';
import { ev } from './story';
import { omen, longSeason } from './myth';

const cell = (x, y) => clamp(Math.round(y - 0.5), 1, H - 2) * W + wx(Math.round(x - 0.5));
const cap = (s) => s[0].toUpperCase() + s.slice(1);

// Each returns false when nothing happened, or a short line for the page to show.
export const APPLY = {
  raise: (w, x, y, r, st) => sculpt(w, 'raise', x, y, r, st),
  lower: (w, x, y, r, st) => sculpt(w, 'lower', x, y, r, st),
  ridge: (w, x, y, r, st) => sculpt(w, 'ridge', x, y, Math.max(2, Math.round(r * 0.7)), st),
  trench: (w, x, y, r, st) => sculpt(w, 'trench', x, y, Math.max(2, Math.round(r * 0.7)), st),
  flatten: (w, x, y, r, st) => sculpt(w, 'flatten', x, y, r, st),
  smooth: (w, x, y, r, st) => sculpt(w, 'smooth', x, y, r, st),
  erode: (w, x, y, r) => erodeBrush(w, x, y, r),
  rain: (w, x, y, r) => weather(w, 'rain', x, y, r),
  dry: (w, x, y, r) => weather(w, 'dry', x, y, r),
  forest: (w, x, y, r) => plant(w, x, y, r),
  fire: (w, x, y, r) => burn(w, x, y, Math.min(r, 2)),
  spring(w, x, y) { const i = cell(x, y); if (w.water[i]) return false; w.springs.push({ x: i % W, y: (i / W) | 0, q: 420 }); if (w.springs.length > 40) w.springs.shift(); w.need.water = true; w.edited = true; return 'Water comes up out of the rock.'; },
  ore(w, x, y, r, st, opt) { const i = cell(x, y); if (w.water[i] === 1) return false; w.ore[i] = opt + 1; w.oreStamp = (w.oreStamp || 0) + 1; return `${cap(ORES[opt + 1])} lies under the ground here now.`; },
  storm: (w, x, y) => stormAt(w, x, y),
  cold: (w) => longSeason(w, -1),
  warm: (w) => longSeason(w, 1),
  herd(w, x, y, r, st, opt) { const sp = addHerd(w, x - 0.5, y - 0.5, opt ? opt - 1 : null); return sp ? cap(sp.one) + '.' : false; },
  wolves: (w, x, y) => addPack(w, x - 0.5, y - 0.5),
  cull(w, x, y, r) { let n = 0; for (const h of w.herds) if (wrapDx(h.x - x) ** 2 + (h.y - y) ** 2 < r * r) { h.n = 0; n++; } for (const k of w.packs) if (wrapDx(k.x - x) ** 2 + (k.y - y) ** 2 < r * r) { k.n = 0; n++; } return n > 0; },
  shoal(w, x, y, r) { const f = w.fish, K = w.fishK; if (!f) return false; let any = false; const cr = Math.ceil(r / 4) + 1, cx = Math.round(x) >> 2, cy = Math.round(y) >> 2; for (let dy = -cr; dy <= cr; dy++) for (let dx = -cr; dx <= cr; dx++) { const yy = cy + dy; if (yy < 0 || yy >= H / 4) continue; const i = yy * (W / 4) + (((cx + dx) % (W / 4)) + W / 4) % (W / 4); if (K[i] > 0) { K[i] = Math.min(1.6, K[i] * 1.04 + 0.01); f[i] = Math.min(K[i], f[i] + 0.08 * K[i]); any = true; } } return any; },
  people(w, x, y, r, st, opt) { const c = addBand(w, x - 0.5, y - 0.5, opt || 0); return c ? `The ${c.name} wake.` : false; },
  idea: (w, x, y) => inspire(w, x, y),
  babel: (w, x, y) => babel(w, x, y),
  meteor: (w, x, y) => meteor(w, x - 0.5, y - 0.5),
  volcano: (w, x, y) => volcano(w, x - 0.5, y - 0.5),
  quake: (w, x, y) => quake(w, x - 0.5, y - 0.5),
  wave: (w, x, y) => tsunami(w, x - 0.5, y - 0.5),
  plague: (w, x, y) => plagueAt(w, x, y),
  locusts: (w, x, y) => locustAt(w, x - 0.5, y - 0.5),
  lightning: (w, x, y) => lightning(w, x - 0.5, y - 0.5),
  overgrow: (w, x, y, r) => overgrow(w, x - 0.5, y - 0.5, r),
  dragon(w, x, y) { const d = addDragon(w, x - 0.5, y - 0.5); if (!d) return false; ev(w, `${d.name} wakes in the high rock.`, d.x, d.y, null, 0, ['b' + d.id]); return `${d.name} wakes.`; },
  beast(w, x, y, r, st, opt) { const b = addBeast(w, ['troll', 'griffin', 'wyvern', 'boar', 'basilisk'][opt || 0], x - 0.5, y - 0.5, true); return b ? `${b.name} wakes.` : false; },
  kraken(w, x, y, r, st, opt) { const k = addKraken(w, x - 0.5, y - 0.5, opt === 1 ? 'serpent' : 'kraken'); if (!k) return false; ev(w, `Something settles into the deep water and sailors give it a name: ${k.name}.`, k.x, k.y, null, 0, ['b' + k.id]); return `${cap(k.name)} wakes in the deep.`; },
  well(w, x, y, r) { x = Math.round(x - 0.5); y = Math.round(y - 0.5); for (const o of DISC[Math.min(20, r)]) { const yy = y + o[1]; if (yy < 0 || yy >= H) continue; const i = yy * W + wx(x + o[0]), k = 1 - o[2] / (r + 0.5); w.magic[i] = Math.min(1, w.magic[i] + 0.07 * k); w.ley[i] = Math.min(1.5, w.ley[i] + 0.012 * k); } return true; },
  hush(w, x, y, r) { x = Math.round(x - 0.5); y = Math.round(y - 0.5); for (const o of DISC[Math.min(20, r)]) { const yy = y + o[1]; if (yy < 0 || yy >= H) continue; const i = yy * W + wx(x + o[0]); w.magic[i] *= 0.8; w.ley[i] *= 0.8; } return true; },
  omen: (w, x, y) => omen(w, x, y),
};
// Which tools are acts of a god that people would notice and tell stories about, and what kind.
export const MYTHIC = { raise: 'maker', lower: 'drowner', ridge: 'maker', trench: 'breaker', spring: 'giver', rain: 'giver', dry: 'scourge', storm: 'storm', cold: 'winter', warm: 'sun', forest: 'green', overgrow: 'green', herd: 'giver', wolves: 'hunter', cull: 'scourge', shoal: 'giver', people: 'maker', fire: 'fire', lightning: 'storm', meteor: 'star', volcano: 'fire', quake: 'breaker', wave: 'drowner', plague: 'scourge', locusts: 'scourge', dragon: 'beast', beast: 'beast', kraken: 'beast', well: 'mystery', idea: 'teacher', babel: 'breaker', omen: 'mystery' };
