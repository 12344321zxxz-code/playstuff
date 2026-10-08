// @ts-nocheck
// Legendary beasts. Each is a named creature with a lair, at the top of its own food chain: it
// eats what lives around it, and when that runs out it comes down on the towns. They are born
// where the country suits them and the game is thick, they grow old, and they can be killed:
// by heroes, by cities, by hunger. A dead one leaves something behind.
import { W, H, N, DISC, clamp, wx, wrapDx } from './core';
import { ev, discover, nameIt } from './story';
import { near, endSet, flee, colorOf, whereAbouts } from './people';
import { ignite } from './life';
import { holySite } from './faith';

export const KINDS = {
  troll: { name: 'troll', speed: 0.9, range: 18, eats: 6, raid: 0.6, life: 420, fly: false, names: ['Grimbolt', 'Old Knuckle', 'Mossjaw', 'Hrungnir', 'the Bridge-Keeper', 'Stonebelly', 'Gorm'], lair: 'cave',
    fits: (w, i, hh) => hh > 0.18 && hh < 0.5 && w.t[i] > 0.3 && w.tMean[i] < 12, say: 'A troll, under the hill.' },
  griffin: { name: 'griffin', speed: 3, range: 40, eats: 8, raid: 0.35, life: 300, fly: true, names: ['Aquilarr', 'Stormclaw', 'the Golden Talon', 'Kerrak', 'Highwing', 'Sunmane'], lair: 'eyrie',
    fits: (w, i, hh) => hh > 0.4 && w.tMean[i] > 4 && w.tMean[i] < 20, say: 'A griffin, nesting on the high crags.' },
  wyvern: { name: 'wyvern', speed: 2.6, range: 34, eats: 7, raid: 0.7, life: 260, fly: true, names: ['Scathe', 'the Ash Wing', 'Venomtail', 'Skarn', 'Blightwing', 'Ixtla'], lair: 'eyrie',
    fits: (w, i, hh) => hh > 0.3 && w.mi[i] < 0.5, say: 'A wyvern: half a dragon, all temper.' },
  boar: { name: 'great boar', speed: 1.1, range: 16, eats: 5, raid: 0.4, life: 160, fly: false, names: ['Tusker', 'the Black Sow', 'Gullinbursti', 'Old Bristle', 'the Rooter', 'Ironhide'], lair: 'wallow',
    fits: (w, i, hh) => w.t[i] > 0.6 && w.tMean[i] > 6 && hh < 0.25, say: 'A boar the size of a barn.' },
  basilisk: { name: 'basilisk', speed: 0.7, range: 14, eats: 3, raid: 0.8, life: 500, fly: false, names: ['the Pale King', 'Gorgoth', 'Stoneglance', 'the Sand Crown', 'Cockatrix', 'Sseral'], lair: 'pit',
    fits: (w, i, hh) => w.mi[i] < 0.25 && w.tMean[i] > 14, say: 'A basilisk. Its glance turns things to stone.' },
};
const MAXB = 8;

export function initBeasts(w) { w.beasts = []; w.arts = []; w.beastLog = w.beastLog || []; }

export function addBeast(w, kind, x, y, mine) {
  const K = KINDS[kind]; if (!K || w.beasts.length >= MAXB + 4) return null; x = wx(Math.round(x)); y = clamp(Math.round(y), 3, H - 4);
  // the lair goes on the best nearby ground for its kind
  let bi = -1, bs = -1;
  for (const o of DISC[10]) { const yy = y + o[1]; if (yy < 3 || yy >= H - 3) continue; const i = yy * W + wx(x + o[0]); if (w.water[i] || w.ice[i]) continue; const hh = w.h[i] - w.params.sea, sc = (K.fits(w, i, hh) ? 2 : 0) + hh * (K.fly ? 2 : 0.5) - o[2] * 0.05; if (sc > bs) { bs = sc; bi = i; } }
  if (bi < 0) return null;
  const n = (w.beastNames = (w.beastNames || 0) + 1), lx = bi % W, ly = (bi / W) | 0;
  let name = K.names[(n * 7 + kind.length) % K.names.length]; if (w.beasts.some((b) => b.name === name) || w.beastLog.some((b) => b.name === name)) name = name + ' the ' + ['Younger', 'Second', 'Red', 'Grey', 'Hungry'][n % 5];
  const b = { id: w.nextId++, kind, name, x: lx, y: ly, px: lx, py: ly, lx, ly, st: 'lair', hunger: 0, age: 0, born: w.year, kills: 0, raids: 0, tx: lx, ty: ly, mine: !!mine, hoard: 0 };
  w.beasts.push(b); w.beastLog.push(b); nameIt(w, 'b' + b.id, b.name);
  if (!mine) { ev(w, `${cap(K.say.replace(/^A[n]? /, 'a '))} Shepherds ${whereAbouts(w, lx, ly)} call it ${b.name}.`.replace(/^./, (m) => m.toUpperCase()), lx, ly, null, 0, ['b' + b.id]); }
  else ev(w, `${b.name}, a ${K.name}, makes its lair ${whereAbouts(w, lx, ly)}.`, lx, ly, null, 0, ['b' + b.id]);
  discover(w, 'beast', lx, ly); return b;
}
const cap = (s) => s[0].toUpperCase() + s.slice(1);

// Born where the country suits them and there is plenty to eat.
function spawn(w) {
  if (w.beasts.length >= MAXB || w.year < 40 || w.rnd() > 0.03) return;
  const keys = Object.keys(KINDS), kind = keys[(w.rnd() * keys.length) | 0], K = KINDS[kind], sea = w.params.sea;
  for (let q = 0; q < 160; q++) {
    const i = (w.rnd() * N) | 0; if (w.water[i] || w.ice[i]) continue; const hh = w.h[i] - sea; if (!K.fits(w, i, hh)) continue;
    const x = i % W, y = (i / W) | 0; if (w.beasts.some((b) => wrapDx(b.lx - x) ** 2 + (b.ly - y) ** 2 < 900)) continue;
    if (prey(w, x, y, K.range) < 40) continue;
    addBeast(w, kind, x, y, false); return;
  }
}
function prey(w, x, y, r) { let n = 0; for (const h of w.herds) if (h.n > 1 && wrapDx(h.x - x) ** 2 + (h.y - y) ** 2 < r * r) n += h.n; if (w.eco) { const e = w.eco.graze, cx = x >> 2, cy = y >> 2, R = Math.ceil(r / 4); for (let dy = -R; dy <= R; dy += 2) for (let dx = -R; dx <= R; dx += 2) { const yy = cy + dy; if (yy < 0 || yy >= H / 4) continue; n += 6 * e[yy * (W >> 2) + (((cx + dx) % (W >> 2)) + (W >> 2)) % (W >> 2)]; } } return n; }

export function beastsYear(w) {
  spawn(w); const rnd = w.rnd;
  for (const b of w.beasts) {
    const K = KINDS[b.kind]; b.age++; const li = b.ly * W + b.lx;
    if (w.water[li] === 1 || w.lava[li]) { die(w, b, w.water[li] === 1 ? 'The water rose over its lair; it was not seen again.' : 'The mountain took it.'); continue; }
    if (b.age > K.life * (0.8 + 0.4 * ((b.id * 37) % 10) / 10)) { die(w, b, 'It died of age, in its lair, and the bones are still there.'); holySite(w, b.lx, b.ly, 'beast', 0.25); continue; }
    w.magic[li] = Math.min(1, w.magic[li] + 0.02);
    if (b.st !== 'lair') continue;
    b.hunger++;
    if (b.hunger < 2 && rnd() < 0.6) continue;
    // eat what is around; if there is little, go for the towns
    let herd = null, hb = 0; for (const h of w.herds) { const q = wrapDx(h.x - b.lx) ** 2 + (h.y - b.ly) ** 2; if (q < K.range * K.range && h.n > hb) { hb = h.n; herd = h; } }
    const wild = w.eco ? w.eco.graze[(b.ly >> 2) * (W >> 2) + (b.lx >> 2)] : 0;
    if (herd && hb > 6 && rnd() > K.raid * 0.5) { b.st = 'hunt'; b.target = { h: herd }; b.tx = herd.x; b.ty = herd.y; continue; }
    if (wild > 0.4 && rnd() > K.raid) { b.hunger = 0; if (w.eco) w.eco.graze[(b.ly >> 2) * (W >> 2) + (b.lx >> 2)] *= 0.8; continue; }
    let town = null, tb = 1e9; near(w, b.lx, b.ly, K.range * 1.6, null, false, (s, q) => { if (s.pop > 20 && q < tb) { tb = q; town = s; } });
    if (town && (b.hunger > 2 || rnd() < K.raid * 0.3)) { b.st = 'raid'; b.target = { s: town }; b.tx = town.x; b.ty = town.y; continue; }
    if (b.hunger > 18) die(w, b, 'There was nothing left to eat. It wandered off and was found dead in a ditch.');
  }
  if (w.beasts.some((b) => b.dead)) w.beasts = w.beasts.filter((b) => !b.dead);
}
export function beastsTick(w) {
  const rnd = w.rnd;
  for (const b of w.beasts) {
    b.px = b.x; b.py = b.y; if (b.st === 'lair') continue; const K = KINDS[b.kind];
    const dx = wrapDx(b.tx - b.x), dy = b.ty - b.y, l = Math.hypot(dx, dy), sp = K.speed;
    if (l > sp) { b.x = wx(b.x + (dx / l) * sp); b.y += (dy / l) * sp; continue; }
    b.x = b.tx; b.y = b.ty;
    if (b.st === 'home') { b.st = 'lair'; continue; }
    const tg = b.target; b.target = null;
    if (b.st === 'hunt' && tg && tg.h) { tg.h.n = Math.max(0, tg.h.n - K.eats * 2); b.hunger = 0; }
    else if (b.st === 'raid' && tg && tg.s && !tg.s.dead) raid(w, b, tg.s);
    b.st = 'home'; b.tx = b.lx; b.ty = b.ly;
  }
}
function raid(w, b, s) {
  const K = KINDS[b.kind], c = w.cults[s.cult], rnd = w.rnd; b.hunger = 0; b.raids++;
  // a big enough, armed enough town may kill it
  const def = (s.pop / 600) * (1 + c.tech * 0.25) * (c.arts.iron ? 1.4 : c.arts.bronze ? 1.15 : 1) * (s.walls ? 1.3 : 1) * (s.hero ? 2 : 1);
  if (rnd() < Math.min(0.45, def * 0.08)) { slay(w, b, s, s.hero ? s.hero : null); return; }
  const loss = s.pop * (b.kind === 'basilisk' ? 0.12 : 0.08); s.pop -= loss; b.kills += Math.round(loss); flee(w, s, loss * 0.4); s.burned = (s.burned || 0) + (b.kind === 'wyvern' ? 1 : 0);
  if (b.kind === 'wyvern') for (const o of DISC[2]) { const yy = s.y + o[1]; if (yy < 1 || yy >= H - 1) continue; if (rnd() < 0.4) ignite(w, yy * W + wx(s.x + o[0])); }
  w.fx.push({ k: 'clash', x: s.x, y: s.y, T: 1.2 });
  const verb = { troll: 'comes down from the hills and carries off', griffin: 'drops out of the sky and takes', wyvern: 'sets fire to', boar: 'tears through the fields of', basilisk: 'crawls into' }[b.kind];
  if (b.raids === 1 || b.raids % 5 === 0) ev(w, b.kind === 'basilisk' ? `${b.name} crawls into ${s.name || 'a camp of the ' + c.name}. People who saw it are statues now.` : b.kind === 'wyvern' ? `${b.name} sets fire to ${s.name || 'a camp of the ' + c.name}.` : `${b.name} ${verb} ${b.kind === 'boar' ? '' : 'people from '}${s.name || 'a camp of the ' + c.name}.`, s.x, s.y, c.color, s.tier >= 2 ? 0 : 1, ['b' + b.id]);
  if (s.pop < 12 && s.tier >= 1) endSet(w, s, 'abandoned');
  s.beastFear = b.id; c.beastFear = { id: b.id, year: w.year };
}
// It is killed. `s` is the town that did it, `fig` the hero if there was one.
export function slay(w, b, s, fig) {
  if (b.dead) return; const c = s ? w.cults[s.cult] : null; b.dead = true; b.died = w.year; b.slain = s ? s.name : null;
  const by = fig ? fig.name : s ? `the people of ${s.name}` : 'someone';
  if (s) { c.coh = Math.min(1, c.coh + 0.15); s.pop *= 0.96; }
  const art = makeArt(w, b, s, fig);
  ev(w, `${cap(by)} ${b.kind === 'dragon' ? 'kills' : 'slays'} ${b.name}${art ? '. ' + art.from : ''}.`, b.x, b.y, c ? c.color : null, 2, ['b' + b.id].concat(fig ? ['p' + fig.id] : [], art ? ['a' + art.id] : []));
  if (s) discover(w, 'slayer', s.x, s.y); holySite(w, b.x, b.y, 'slayer', 0.4);
  if (fig) { fig.deeds = (fig.deeds || 0) + 1; fig.slew = b.name; }
  if (w.beasts) w.beasts = w.beasts.filter((q) => !q.dead);
}
function die(w, b, how) { b.dead = true; b.died = w.year; ev(w, `${b.name} is gone. ${how}`, b.lx, b.ly, null, 0, ['b' + b.id]); }

/* ---------- artifacts ---------- */
const TROPHY = { dragon: ['the Skull of %', 'the Hoard of %', 'the Scale-Mail of %'], troll: ['the Stone Heart of %', 'the Club of %'], griffin: ['the Golden Feather of %', 'the Talon of %'], wyvern: ['the Sting of %', 'the Ash Hide of %'], boar: ['the Tusks of %', 'the Bristle Cloak of %'], basilisk: ['the Eye of %', 'the Stone Crown of %'], kraken: ['the Ink of %', 'the Beak of %'], serpent: ['the Coil of %'] };
export function makeArt(w, b, s, fig) {
  if (!s && !fig) return null; const L = TROPHY[b.kind] || ['the Bones of %'], name = L[(b.id + w.year) % L.length].replace('%', b.name);
  const a = { id: w.nextId++, name, kind: 'trophy', made: w.year, beast: b.id, cult: s ? s.cult : fig ? fig.cult : null, at: s ? s.id : null, x: s ? s.x : b.x, y: s ? s.y : b.y, lost: false, hist: [] };
  a.from = `${s ? s.name + ' keeps ' : fig.name + ' takes '}${name}`;
  w.arts.push(a); nameIt(w, 'a' + a.id, name.replace(/^the /, '').replace(/^./, (m) => m.toUpperCase())); nameIt(w, 'a' + a.id, name);
  return a;
}
export function forgeArt(w, s, fig, what) {
  const c = w.cults[s.cult], L = { sword: ['%-bane', 'the Sword of %', 'Kingsedge'], crown: ['the Crown of %', 'the Iron Circlet'], book: ['the Book of %', 'the Red Codex'], bell: ['the Bell of %'], idol: ['the Idol of %'] }[what] || ['the Relic of %'];
  const name = L[(w.year + s.id) % L.length].replace('%', fig ? fig.name.split(' ')[0] : s.name);
  const a = { id: w.nextId++, name, kind: what, made: w.year, cult: s.cult, at: s.id, x: s.x, y: s.y, lost: false, maker: fig ? fig.id : null };
  w.arts.push(a); nameIt(w, 'a' + a.id, name); return a;
}
// When a town falls or empties, what it held is lost, or carried off by whoever took it.
export function artsYear(w) {
  if (!w.arts) return;
  for (const a of w.arts) {
    if (a.lost || a.at == null) continue; const s = w.sets.find((q) => q.id === a.at);
    if (!s || s.dead) { a.lost = true; a.lostAt = w.year; ev(w, `${cap(a.name)} is lost when ${s ? s.name : 'its keepers'} ${s ? 'falls' : 'are scattered'}. Nobody knows where it went.`, a.x, a.y, null, 1, ['a' + a.id]); continue; }
    a.x = s.x; a.y = s.y; if (a.cult !== s.cult) { const o = w.cults[s.cult]; ev(w, `${cap(a.name)} passes to the ${o.name} with ${s.name}.`, s.x, s.y, o.color, 1, ['a' + a.id]); a.cult = s.cult; }
  }
  // lost things turn up again, sometimes centuries later, in the ground or a ruin
  if (w.rnd() < 0.05) { const lost = w.arts.filter((a) => a.lost && w.year - a.lostAt > 40); if (lost.length) { const a = lost[(w.rnd() * lost.length) | 0], s = near(w, a.x, a.y, 30, null, true); if (s) { a.lost = false; a.at = s.id; a.cult = s.cult; a.found = w.year; ev(w, `Diggers at ${s.name} turn up ${a.name}, lost ${w.year - a.lostAt} years ago.`, s.x, s.y, w.cults[s.cult].color, 0, ['a' + a.id]); discover(w, 'found', s.x, s.y); } } }
}

/* ---------- looking at them ---------- */
const KSAY = { lair: 'In its lair.', hunt: 'Hunting.', raid: 'On its way to the towns.', home: 'Going home, fed.' };
export function beastLook(w, fx, fy, r) {
  const q2 = (x, y) => (x + 0.5 - fx) ** 2 + (y + 0.5 - fy) ** 2, R = Math.max(r * r * 2.5, 4);
  for (const d of w.dragons) if (q2(d.x, d.y) <= R || q2(d.lx, d.ly) <= R) return { title: d.name, sub: 'a dragon', color: '#9c2a1c', ref: 'b' + d.id, follow: ['beast', d.id], lines: [`A dragon, ${d.age} years on this mountain.`, d.st === 'sleep' ? 'It is asleep on its hoard.' : d.st === 'fly' ? 'It is hunting.' : d.st === 'home' ? 'It is flying home, fed.' : 'It is awake, and looking around.', d.hoard > 20 ? 'Its hoard is the richest thing in the world.' : d.hoard > 6 ? 'It has a respectable hoard.' : 'It has not gathered much yet.'] };
  for (const b of w.beasts || []) if (q2(b.x, b.y) <= R || q2(b.lx, b.ly) <= R) { const K = KINDS[b.kind]; return { title: b.name, sub: 'a ' + K.name, color: '#6a4a2a', ref: 'b' + b.id, follow: ['beast', b.id], lines: [K.say, `${b.age} years in its ${K.lair}. ${KSAY[b.st] || ''}`, b.raids ? `It has raided the towns ${b.raids === 1 ? 'once' : b.raids + ' times'}${b.kills > 20 ? ' and killed hundreds' : ''}.` : 'It has kept to the wild so far.'] }; }
  for (const k of w.krakens) if (q2(k.x, k.y) <= Math.max(9, R)) return { title: cap(k.name), sub: k.kind === 'serpent' ? 'a sea serpent' : 'a kraken', color: '#4a3a6a', ref: 'b' + k.id, follow: ['beast', k.id], lines: [`Something very large, in this water since year ${k.born}.`, k.sunk ? `It has taken ${k.sunk} ${k.sunk === 1 ? 'ship' : 'ships'}.` : 'No ship has come close enough yet.'] };
  return null;
}
