// Peoples. A band wanders until the place it is in teaches it a way to live: flood plains make
// farmers, cold coasts make fishers, grass and a tameable beast make herders. What a people can
// learn depends on what is around them: no boats without a shore, no bronze without both ores,
// no riders without horses. Knowledge piles up with numbers and travels with trade; cohesion
// wears down with size and ease; and what falls leaves ruins the next people build on.
import { W, H, N, DISC, clamp, wx, wrapDx, Heap } from './core.js';
import { ev, discover, once } from './story.js';
import { SPECIES } from './fauna.js';
import { wetAt } from './weather.js';
import { catchFish } from './sea.js';
import { send, arrive } from './movers.js';

export const TECH = [3000, 120000, 1500000, 15000000, 40000000];
export const TIER = ['band', 'village', 'town', 'city'];
export const COLORS = ['#d7263d', '#8e44d6', '#f46d1b', '#f2efe4', '#22201e', '#e040a8', '#ffd400', '#00c2a8', '#7a3b1d', '#ff8fa3', '#3d5afe', '#9bd636', '#00a1e4', '#b56576', '#6d597a', '#e9c46a', '#577590', '#f94144', '#43aa8b', '#bc6c25', '#a2d2ff', '#cdb4db', '#606c38', '#fb8500'];
export const ORES = ['', 'copper', 'tin', 'iron', 'gold', 'salt', 'coal'];
// What a people can know. `tier` is how much they must already know; the rest is where they live.
export const ART = {
  herding: { say: 'herding', tier: 0 }, boats: { say: 'boats', tier: 0 }, farming: { say: 'farming', tier: 1 }, riding: { say: 'riding', tier: 1 },
  roads: { say: 'roads', tier: 2 }, irrigation: { say: 'irrigation', tier: 2 }, terraces: { say: 'terraced fields', tier: 2 }, bronze: { say: 'bronze', tier: 2 }, masonry: { say: 'stone walls', tier: 2 },
  writing: { say: 'writing', tier: 3 }, iron: { say: 'iron', tier: 3 }, sailing: { say: 'deep-sea sailing', tier: 4 }, engines: { say: 'smoke and engines', tier: 5 }, craft: { say: 'the craft', tier: 9 },
};
const ART_KEYS = Object.keys(ART);
const MAXS = 520, MAXC = 20, TAME_GRAZE = { horse: 1, cattle: 1, goat: 1, reindeer: 1, camel: 1 };
const CONS = ['p', 't', 'k', 'b', 'd', 'g', 'm', 'n', 's', 'l', 'r', 'v', 'z', 'h', 'sh', 'ch', 'th', 'y', 'w', 'f', 'kh', 'q'], VOW = ['a', 'e', 'i', 'o', 'u', 'a', 'o', 'ai', 'ou', 'ia', 'e'], ENDS = ['n', 'r', 's', 'l', 'm', 'th', 'k', 'sh', 'd'];
const pickN = (rnd, arr, n) => { const a = arr.slice(), o = []; while (o.length < n && a.length) o.push(a.splice((rnd() * a.length) | 0, 1)[0]); return o; };
const makeLang = (w) => ({ c: pickN(w.rnd, CONS, 7), v: pickN(w.rnd, VOW, 4), e: pickN(w.rnd, ENDS, 3) });
function word(w, L, syl) { let s = ''; for (let k = 0; k < syl; k++) s += L.c[(w.rnd() * L.c.length) | 0] + L.v[(w.rnd() * L.v.length) | 0]; if (w.rnd() < 0.45) s += L.e[(w.rnd() * L.e.length) | 0]; return s[0].toUpperCase() + s.slice(1); }
const placeName = (w, c) => word(w, c.lang, w.rnd() < 0.6 ? 2 : 3);
function cultName(w, L) { let s = word(w, L, w.rnd() < 0.5 ? 1 : 2); const suf = ['i', 'an', 'ari', 'u', 'esh', 'or', 'im', 'a'][(w.rnd() * 8) | 0]; if (/[aeiou]$/.test(s)) s = s.slice(0, -1); return s + suf; }
const EPITHET = { great: ['the Great', 'the Conqueror', 'the Lion'], builder: ['the Builder', 'the Mason'], law: ['the Just', 'the Lawgiver', 'the Wise'], mad: ['the Mad', 'the Cruel', 'the Unready'] };

export const techOf = (k) => { let t = 0; while (t < TECH.length && k >= TECH[t]) t++; return t; };
export const colorOf = (c) => c.color;
const aliveN = (w) => { let n = 0; for (const c of w.cults) if (c.alive) n++; return n; };

export function newCult(w, parent) {
  const used = new Uint8Array(COLORS.length); for (const c of w.cults) if (c.alive) used[c.slot] = 1;
  let slot = 0; while (slot < COLORS.length - 1 && used[slot]) slot++;
  if (used[slot]) slot = (w.rnd() * COLORS.length) | 0;
  const lang = parent ? { c: parent.lang.c.slice(0, 5).concat(pickN(w.rnd, CONS, 2)), v: parent.lang.v.slice(0, 3).concat(pickN(w.rnd, VOW, 1)), e: parent.lang.e.slice() } : makeLang(w);
  const c = { id: w.cults.length, slot, color: COLORS[slot], lang, name: cultName(w, lang), know: parent ? parent.know : 0, tech: parent ? parent.tech : 0, alive: true, count: 0, pop: 0, peak: 0, wit: 0.75 + 0.6 * w.rnd(),
    arts: parent ? Object.assign({}, parent.arts) : {}, tame: parent ? Object.assign({}, parent.tame) : {}, metals: 0, gold: false, coh: 0.85, born: w.year, way: parent ? parent.way : 'forage', kind: 'foragers', parent: parent ? parent.name : null, grazer: parent ? parent.grazer : null,
    ruler: null, big: null, flags: parent ? { village: 1, town: parent.flags.town, city: parent.flags.city } : {}, wins: 0, wonderAt: -999, war: null, nb: {}, env: { crop: 0, coast: 0, dryRiver: 0, hill: 0, sed: 0, nomads: 0, towns: 0, cities: 0 }, seasoned: parent ? parent.seasoned : false, hungry: 0, lastDry: -99,
    _n: -1, _p: 0, _b: null, _metals: 0, _ways: { forage: 0, farm: 0, fish: 0, herd: 0, hunt: 0 }, _dry: 0, _full: 0 };   // _n < 0: born since the last census began
  crown(w, c, true); w.cults.push(c); return c;
}
function crown(w, c, quiet) {
  const r = w.rnd(), trait = r < 0.07 ? 'great' : r < 0.12 ? 'builder' : r < 0.18 ? 'law' : r < 0.23 ? 'mad' : null, nm = word(w, c.lang, 2);
  c.ruler = { name: trait ? `${nm} ${EPITHET[trait][(w.rnd() * EPITHET[trait].length) | 0]}` : nm, trait, until: w.year + 14 + ((w.rnd() * 30) | 0) };
  if (!quiet && c.count >= 14 && c.big && trait === 'mad') ev(w, `${c.ruler.name} takes the throne of the ${c.name}. It does not go well.`, c.big.x, c.big.y, c.color, 1);
}
export function addSet(w, cult, x, y, pop, nomad) {
  const c = w.cults[cult]; x = wx(x);
  const s = { id: w.nextId++, cult, x, y, px: x, py: y, mt: 0, pop, nomad, tier: nomad ? 0 : 1, maxTier: nomad ? 0 : 1, age: 0, R: 2, links: 0, trade: 0, name: nomad ? null : placeName(w, c), lastFam: -99, lastSack: -99, src: [1, 0, 0, 0, 0], way: 'forage', note: 'grow', ores: 0, wonder: 0, plague: 0, immune: 0, dead: false, walls: false, tower: false, port: false, busy: 0, burned: 0, wa: 1 };
  w.sets.push(s); c.count++; return s;
}
function learn(w, c, k, from) {
  if (c.arts[k]) return false; c.arts[k] = w.year; const b = c.big, first = once(w, 'art-' + k);
  if (k === 'herding') return true;
  ev(w, first ? `The ${c.name} are the first people to learn ${ART[k].say}.` : from ? `The ${c.name} learn ${ART[k].say} from the ${from.name}.` : `The ${c.name} learn ${ART[k].say}.`, b ? b.x : null, b ? b.y : null, c.color, first ? 0 : 1);
  if (k === 'bronze' && b) discover(w, 'bronze', b.x, b.y); else if (k === 'iron' && b) discover(w, 'iron', b.x, b.y);
  return true;
}
function canLearn(c, k, easy) {
  const e = c.env, a = c.arts; if (a[k] || c.tech + (easy ? 1 : 0) < ART[k].tier) return false;
  switch (k) {
    case 'farming': return e.crop > 0;
    case 'boats': return (easy || c.know > 1200) && e.coast > 0;
    case 'riding': return !!(c.tame.horse || c.tame.camel);
    case 'roads': return e.sed >= 4;
    case 'irrigation': return a.farming && e.dryRiver > 0;
    case 'terraces': return a.farming && e.hill > 0;
    case 'bronze': return (c.metals & 2) !== 0 && (c.metals & 4) !== 0;
    case 'masonry': return e.towns > 0;
    case 'writing': return e.towns > 0;
    case 'iron': return (c.metals & 8) !== 0;
    case 'sailing': return a.boats && e.coast >= 3;
    case 'engines': return a.iron && a.writing && (c.metals & 64) !== 0;
  }
  return false;
}
// when two peoples meet, in trade or in war, things rub off
function meet(w, c, o, p) {
  const rnd = w.rnd; if (c === o) return;
  if (o.know > c.know) c.know += (o.know - c.know) * 0.006; else o.know += (c.know - o.know) * 0.006;
  for (const [a, b] of [[c, o], [o, c]]) {
    for (const k in b.tame) if (!a.tame[k] && rnd() < 0.12) { a.tame[k] = w.year; if (TAME_GRAZE[k] && !a.grazer) { a.grazer = k; learn(w, a, 'herding'); } }
    if (rnd() < p * 0.4) { const got = ART_KEYS.filter((k) => b.arts[k] && canLearn(a, k, true)); if (got.length) learn(w, a, got[(rnd() * got.length) | 0], b); }
  }
  c.nb[o.id] = (c.nb[o.id] || 0) + 1; o.nb[c.id] = (o.nb[c.id] || 0) + 1;
}

/* ---------- finding things ---------- */
const BK = 16, GW = W / BK, GH = H / BK;
function buildGrid(w) { const g = (w.sgrid = w.sgrid || []); for (let k = 0; k < GW * GH; k++) (g[k] || (g[k] = [])).length = 0; for (const s of w.sets) if (!s.dead) g[((s.y / BK) | 0) * GW + ((s.x / BK) | 0)].push(s); }
export function near(w, x, y, d, skip, sedOnly, each) {
  const g = w.sgrid, r = Math.ceil(d / BK), bx = (x / BK) | 0, by = (y / BK) | 0, d2 = d * d; let best = null, bd = d2;
  for (let gy = by - r; gy <= by + r; gy++) { if (gy < 0 || gy >= GH) continue; for (let gx = bx - r; gx <= bx + r; gx++) { const b = g[gy * GW + ((gx % GW) + GW) % GW];
    for (let k = 0; k < b.length; k++) { const s = b[k]; if (s === skip || s.dead || (sedOnly && s.nomad)) continue; const dx = wrapDx(s.x - x), dy = s.y - y, q = dx * dx + dy * dy; if (q < d2) { if (each) each(s, q); if (q < bd) { bd = q; best = s; } } } } }
  return best;
}
export function whereAbouts(w, x, y) {
  const b = near(w, x, y, 14, null, true); if (b) return 'near ' + b.name;
  const ns = y < H / 3 ? 'north' : y > (2 * H) / 3 ? 'south' : '', ew = x < W / 3 ? 'west' : x > (2 * W) / 3 ? 'east' : '';
  return ns || ew ? 'in the ' + (ns && ew ? ns + '-' + ew : ns || ew) : 'in the middle lands';
}
function siteScore(w, x, y, farmer, herder) {
  let sc = 0; for (const o of DISC[2]) { const Y = y + o[1]; if (Y < 1 || Y >= H - 1) continue; const i = Y * W + wx(x + o[0]); if (w.water[i]) { sc += herder ? 0.1 : 0.5; continue; }
    sc += herder ? 1.2 * w.g[i] - 0.3 * w.t[i] - (w.farm[i] ? 0.5 : 0) : 0.6 * w.g[i] + 0.9 * w.t[i] + (farmer ? w.crop[i] + (w.fresh[i] <= 1 ? 0.4 : 0) : 0) + (w.herdAt[i] ? 0.5 : 0); if (w.magic[i] > 0.75) sc -= 0.6; }
  return sc;
}
function crossesWater(w, x0, y0, x1, y1) { let c = 0; const dx = wrapDx(x1 - x0); for (let k = 1; k < 14; k++) { const x = wx(Math.round(x0 + (dx * k) / 14)), y = Math.round(y0 + ((y1 - y0) * k) / 14); if (w.water[y * W + x] === 1) c++; } return c; }
const ruinAt = (w, x, y) => w.ruins.find((r) => Math.abs(wrapDx(r.x - x)) <= 2 && Math.abs(r.y - y) <= 2 && r.kind !== 'drowned');

/* ---------- sickness ---------- */
// Every outbreak is its own strain. Most are mild and burn out in a valley. Now and then one is
// bad enough, and the roads busy enough, that it walks across the whole known world.
const POX = ['Grey Death', 'Red Cough', 'Long Sleep', 'Weeping Pox', 'Sweating Sickness', 'Black Winter', 'Bone Fever'];
export function infect(w, s, from, harsh) {
  if (s.dead || s.plague > 0 || s.immune > 0) return false;
  let st = from != null ? w.plagues[from] : null;
  if (!st) { const bad = harsh || (w.year - (w.lastPox || -400) > 220 && w.rnd() < 0.1); if (bad) w.lastPox = w.year; st = { id: w.plagues.length, x: s.x, y: s.y, at: s.name || 'the camps of the ' + w.cults[s.cult].name, born: w.year, bad, v: bad ? 0.2 + 0.07 * w.rnd() : 0.05 + 0.07 * w.rnd(), catchy: bad ? 0.85 : 0.16, towns: 0, killed: 0, now: 0, name: null, pop0: w.stats.people || 0 }; w.plagues.push(st); }
  s.plague = 3; s.pid = st.id; st.towns++; st.now++; return true;
}
function plaguesYear(w) {
  for (const st of w.plagues) { if (st.over) continue;
    if (!st.name && st.bad && st.towns >= 40) { st.name = POX[(w.poxN = (w.poxN || 0) + 1) % POX.length]; ev(w, `The sickness that began at ${st.at} has reached ${st.towns} towns and is still walking the roads. People call it the ${st.name}.`, st.x, st.y, null, 2); discover(w, 'plague', st.x, st.y); }
    if (st.now === 0) { st.over = true; if (st.name) { const part = st.pop0 > 0 ? st.killed / st.pop0 : 0; ev(w, `The ${st.name} burns out after ${w.year - st.born} years. ${part > 0.4 ? 'Half the world is dead' : part > 0.25 ? 'One in three is dead' : part > 0.14 ? 'One in five is dead' : 'One in ten is dead'}. Fields go back to forest; the living inherit more than they can use.`, st.x, st.y, null, part > 0.14 ? 2 : 0); } }
    st.now = 0; }
  // old strains stay in the list; a settlement's pid is an index into it
}

/* ---------- ruins ---------- */
const RUIN_TEXT = { abandoned: 'lies empty. Grass grows in its streets.', sacked: 'is burned to the ground.', drowned: 'is under the water.', buried: 'is buried under ash and stone.', burned: 'is lost to the fire.', plague: 'is a city of the dead.', frozen: 'is under the ice.', overgrown: 'is swallowed by the forest.', crater: 'is gone in a flash of light.', swallowed: 'falls into the earth.', dragon: 'is a dragon’s roost now.', starved: 'starves, and empties.' };
const RUIN_PAGE = { drowned: 'drowned', buried: 'buried', overgrown: 'overgrown', frozen: 'frozen' };
export function endSet(w, s, kind) {
  if (s.dead) return; s.dead = true; w.anyDead = true; const c = w.cults[s.cult];
  if (s.maxTier >= 2 || (s.maxTier >= 1 && kind !== 'abandoned' && kind !== 'absorbed')) {
    w.ruins.push({ x: s.x, y: s.y, name: s.name, cult: c.name, year: w.year, kind, know: c.know, tier: s.maxTier, looted: false, wonder: s.wonder });
    if (w.ruins.length > 500) w.ruins.shift();
    ev(w, `${s.name} ${RUIN_TEXT[kind] || RUIN_TEXT.abandoned}`, s.x, s.y, c.color, s.maxTier < 3 && (kind === 'abandoned' || kind === 'starved' || kind === 'sacked' || s.maxTier < 2) ? 1 : s.wonder ? 2 : 0);
    if (s.maxTier >= 2) discover(w, 'ruin', s.x, s.y); if (RUIN_PAGE[kind]) discover(w, RUIN_PAGE[kind], s.x, s.y);
  } else if (!s.name && kind !== 'abandoned' && kind !== 'absorbed') ev(w, `A band of the ${c.name} is lost.`, s.x, s.y, c.color, 1);
  for (const o of DISC[Math.min(10, s.R + 1)]) { const y = s.y + o[1]; if (y < 0 || y >= H) continue; const i = y * W + wx(s.x + o[0]); if (w.owner[i] === s._k) { w.farm[i] = 0; w.urban[i] = 0; } }
  if (c.big === s) c.big = null;
}

/* ---------- people on the move ---------- */
// part of a settlement walks away from trouble, toward kin if there are any
export function flee(w, s, n, sick) {
  n = Math.round(n); if (n < 12 || s.dead) return; const c = w.cults[s.cult]; let to = null, bs = 0;
  near(w, s.x, s.y, 34, s, true, (o, q) => { if (o.cult !== s.cult && w.rnd() < 0.7) return; const sc = (o.note === 'grow' ? 2 : 1) * (o.cult === s.cult ? 2 : 1) / (6 + Math.sqrt(q)); if (sc > bs) { bs = sc; to = o; } });
  let tx, ty; if (to) { tx = to.x; ty = to.y; } else { const a = w.rnd() * 6.283, d = 8 + w.rnd() * 10; tx = wx(Math.round(s.x + Math.cos(a) * d)); ty = clamp(Math.round(s.y + Math.sin(a) * d), 3, H - 4); }
  send(w, { kind: 'refugees', cult: s.cult, x: s.x, y: s.y, tx, ty, n, to, sick: s.plague > 0 ? s.pid : null, land: c.arts.riding ? 1.2 : 0.7 });
}
arrive.refugees = (w, m) => {
  const c = w.cults[m.cult];
  if (m.to && !m.to.dead) { m.to.pop += m.n * 0.9; if (m.sick != null) infect(w, m.to, m.sick); return; }
  const x = wx(Math.round(m.x)), y = clamp(Math.round(m.y), 2, H - 3); if (w.water[y * W + x] || w.sets.length >= MAXS * 0.85 || !c.alive || c.env.nomads >= 6) return;
  addSet(w, m.cult, x, y, m.n * 0.9, true); c.env.nomads++;
};
arrive.settlers = (w, m) => {
  const c = w.cults[m.cult], x = wx(Math.round(m.tx)), y = Math.round(m.ty), i = y * W + x, home = m.from;
  if (w.water[i] || w.ice[i] || w.lava[i] || near(w, x, y, 5.5, null, true) || w.sets.length >= MAXS || !c.alive) { if (home && !home.dead) home.pop += m.n; return; }
  let cult = m.cult;
  if (m.split && aliveN(w) < MAXC) { const nc = newCult(w, c); cult = nc.id; ev(w, `Settlers from ${home ? home.name : 'the ' + c.name} cross ${m.wetN > 1 ? 'the water' : 'the hills'} and call themselves the ${nc.name}.`, x, y, nc.color, m.ocean ? 0 : 1); }
  const v = addSet(w, cult, x, y, m.n, false), ru = ruinAt(w, x, y);
  if (ru) { v.name = 'New ' + ru.name.replace(/^New /, ''); if (discover(w, 'reborn', x, y)) ev(w, `${v.name} rises on the stones of the old city.`, x, y, w.cults[cult].color); }
  if (m.ocean && m.far && (w.massSize[w.mass[i]] || 0) > 150 && discover(w, 'oversea', x, y)) ev(w, `Ships of the ${c.name} cross the open sea and land ${whereAbouts(w, x, y)}.`, x, y, c.color, 2);
};
arrive.home = (w, m) => { if (m.to && !m.to.dead) m.to.pop += m.n; };
arrive.trade = (w, m) => {
  const a = m.from, b = m.to; if (!a || !b || a.dead || b.dead) return; const ca = w.cults[a.cult], cb = w.cults[b.cult];
  a.trade = Math.min(6, a.trade + 1); b.trade = Math.min(6, b.trade + 1); if (ca !== cb) meet(w, ca, cb, 0.3);
  if (a.plague > 0) { if (w.rnd() < 0.3 + w.plagues[a.pid].catchy) infect(w, b, a.pid); }
  else if (ca !== cb && ca.seasoned && !cb.seasoned && w.rnd() < 0.08) { if (infect(w, b, null, true)) { cb.seasoned = true; ev(w, `Traders of the ${ca.name} bring ${b.name} a sickness its people have never met.`, b.x, b.y, cb.color); } }
  if (m.wet0 && discover(w, 'trade', b.x, b.y)) ev(w, `A ship from ${a.name} ties up at ${b.name} and sells everything aboard.`, b.x, b.y, ca.color);
};
export function strength(c, pop) { const A = c.arts; return pop * (1 + 0.15 * c.tech) * (A.bronze ? 1.3 : 1) * (A.iron ? 1.45 : 1) * (A.riding ? 1.35 : 1) * (0.55 + 0.9 * c.coh) * (c.ruler.trait === 'great' ? 1.4 : c.ruler.trait === 'mad' ? 0.8 : 1); }
arrive.army = (w, m) => {
  const o = m.to, c = w.cults[m.cult], home = m.from, rnd = w.rnd; const back = (frac) => { if (home && !home.dead && m.n * frac > 3) send(w, { kind: 'home', cult: m.cult, x: m.x, y: m.y, tx: home.x, ty: home.y, n: m.n * frac, to: home, land: m.land }); };
  if (!c.alive) return; if (!o || o.dead || o.cult === m.cult) { back(1); return; }
  const oc = w.cults[o.cult], war = c.war && c.war.foe === oc.id ? c.war : null;
  w.fx.push({ k: 'clash', x: o.x, y: o.y, T: 1.1 });
  if (o.nomad) { if (rnd() < 0.7) { const a = rnd() * 6.283, x = wx(Math.round(o.x + Math.cos(a) * 7)), y = clamp(Math.round(o.y + Math.sin(a) * 7), 3, H - 4); if (!w.water[y * W + x]) { o.px = o.x; o.py = o.y; o.mt = w.tickN; o.x = x; o.y = y; } o.pop *= 0.92; back(0.95); } else if (o.pop < m.n * 2.5) { endSet(w, o, 'absorbed'); back(1.1); } else { o.pop *= 0.8; back(0.7); } return; }
  const A = strength(c, m.n * 6) * (0.6 + 0.8 * rnd()), B = strength(oc, o.pop) * (o.walls ? 1.6 : 1.2) * (0.6 + 0.8 * rnd());
  if (A <= B) { oc.wins += 0.5; if (war) war.lost++; back(0.45); return; }
  o.pop *= 0.72; c.wins++; oc.coh = Math.max(0.05, oc.coh - 0.03); const hp = home && !home.dead ? home.pop : m.n * 6;
  const raider = m.nomad && !(war && war.horde);
  if (raider || (c.ruler.trait === 'mad' && rnd() < 0.5)) {
    if (o.pop < hp * 0.6 && rnd() < 0.4) { endSet(w, o, 'sacked'); back(1.2); return; }
    if (o.tier >= 2 && w.year - o.lastSack > 30) { o.lastSack = w.year; ev(w, `${m.nomad ? 'Riders' : 'Warriors'} of the ${c.name} sack ${o.name}.`, o.x, o.y, c.color, oc.big === o && oc.count > 6 ? 0 : 1); }
    flee(w, o, o.pop * 0.12); o.pop *= 0.88; back(1.15); return;
  }
  if ((o.pop < hp * 0.5 || (war && rnd() < 0.55)) && w.year - o.lastSack > 25) {
    o.lastSack = w.year; const wasCap = oc.big === o && oc.count > 2; o.cult = m.cult; o.trade = 0; if (war) war.taken++;
    ev(w, wasCap ? `${o.name}, seat of the ${oc.name}, falls to the ${c.name}.` : `${o.name} falls to the ${c.name}.`, o.x, o.y, c.color, wasCap && oc.count > 24 ? 2 : wasCap || o.tier === 3 ? 0 : 1);
    if (wasCap) { oc.coh = Math.max(0.05, oc.coh - 0.25); oc.big = null; if (war) war.until = Math.min(war.until, w.year + 2); }
    flee(w, o, o.pop * 0.08); o.pop *= 0.92; back(0.6); return;
  }
  if (o.tier >= 2 && w.year - o.lastSack > 30) { o.lastSack = w.year; ev(w, `Warriors from ${home && home.name ? home.name : 'the ' + c.name} sack ${o.name}.`, o.x, o.y, c.color, oc.big === o && oc.count > 6 ? 0 : 1); }
  back(1.1);
};

/* ---------- the year ---------- */
function territory(w) {
  const { owner, ocult, ownD, sets, urban } = w; owner.fill(-1); ocult.fill(-1); ownD.fill(1e9); urban.fill(0);
  for (let k = 0; k < sets.length; k++) {
    const s = sets[k]; s._k = k; if (s.dead) continue; if (s.nomad) { s.R = w.cults[s.cult].grazer ? 3 : 2; continue; }
    const R = (s.R = Math.min(9, 2 + Math.floor(Math.sqrt(s.pop) / 7))), bias = s.pop * 0.0015, slot = w.cults[s.cult].slot;
    for (const o of DISC[R]) { const y = s.y + o[1]; if (y < 0 || y >= H) continue; const i = y * W + wx(s.x + o[0]), d = o[2] * o[2] - bias; if (d < ownD[i]) { ownD[i] = d; owner[i] = k; ocult[i] = slot; } }
    if (s.tier >= 2) { const ur = s.tier === 3 ? (s.pop > 2500 ? 2 : 1) : 0; for (const o of DISC[ur]) { const y = s.y + o[1]; if (y < 0 || y >= H) continue; const i = y * W + wx(s.x + o[0]); if (!w.water[i]) urban[i] = 1; } }
  }
}
const FAMINE = { drought: 'The rains fail around %. Its people go hungry.', flood: 'The river takes the fields of %.', soil: 'The fields of % are worn out. They give less every year.', fish: 'The nets come up empty at %.', locusts: 'Locusts strip the fields of %.', ash: 'No summer comes to %. Nothing ripens.', game: 'The herds are gone from around %.', crowded: 'There are more mouths in % than the land can feed.' };

// The yearly census, as a generator: a running game spreads it over the ticks of the year.
export function peopleYear(w) { for (const _ of peopleSteps(w)); }
export function* peopleSteps(w) {
  buildGrid(w); territory(w);
  const sets = w.sets, n0 = sets.length, rnd = w.rnd, { water, river, herdAt, farm, soil, g, t, fresh, owner, fireT, ore, mi, crop, h } = w, sea = w.params.sea;
  for (const c of w.cults) { c._n = 0; c._p = 0; c._b = null; c._metals = 0; c._ways = { forage: 0, farm: 0, fish: 0, herd: 0, hunt: 0 }; c.hungry = 0; c._dry = 0; c._full = 0; const e = c.env; e.crop = e.coast = e.dryRiver = e.hill = e.sed = e.nomads = e.towns = e.cities = 0; }
  let total = 0, smoke = 0; const sun = 1 - Math.min(0.6, w.aerosol * 0.8);
  for (let k = 0; k < n0; k++) {
    if (k % 40 === 39) yield;
    const s = sets[k]; if (s.dead) continue; const c = w.cults[s.cult], A = c.arts, i0 = s.y * W + s.x; s.age++;
    if (water[i0] === 1) { endSet(w, s, 'drowned'); continue; }
    if (w.lava[i0]) { endSet(w, s, 'buried'); continue; }
    if (w.ice[i0] && !s.nomad) { flee(w, s, s.pop * 0.5); endSet(w, s, 'frozen'); continue; }
    if (fireT[i0]) s.pop *= 0.9;
    const herder = !!c.grazer, wa = wetAt(w, s.x, s.y), irrR = A.irrigation ? 3 : 1, maxH = A.terraces ? 0.5 : 0.32, farmR = A.engines ? 6.2 : s.tier >= 3 ? 5.2 : 4.2; s.wa = wa;
    let wildF = 0, seaN = 0, freshF = 0, rain = 0, irrg = 0, farms = 0, blight = 0, bestI = -1, bestK = 0.34, huntLeft = Math.min(s.pop, 150) * 0.03, hunt = 0, past = 0, ores = 0, cropS = 0, landN = 0, soilS = 0;
    for (const o of DISC[s.R]) {
      const y = s.y + o[1]; if (y < 0 || y >= H) continue; const i = y * W + wx(s.x + o[0]);
      if (!s.nomad && owner[i] !== k) continue;
      if (water[i] === 1) { seaN++; continue; } if (water[i] === 2) { freshF += 1.2; continue; }
      landN++; cropS += crop[i];
      if (river[i]) freshF += 0.4 * river[i];
      if (ore[i]) ores |= 1 << ore[i];
      const hk = herdAt[i];
      if (hk) { const hd = w.herds[hk - 1]; if (hd && hd.n > 0) { const sp = SPECIES[hd.sp];
          if (huntLeft > 0) { const take = Math.min(hd.n * 0.15, huntLeft / sp.meat); hd.n -= take; huntLeft -= take * sp.meat; hunt += take * sp.meat; }
          if (sp.tame && !c.tame[sp.tame] && c.know > 600 && rnd() < 0.014) { c.tame[sp.tame] = w.year; if (TAME_GRAZE[sp.tame] && !c.grazer) { c.grazer = sp.tame; learn(w, c, 'herding'); } if (once(w, 'tame' + sp.tame)) ev(w, `The ${c.name} tame the ${sp.tame === 'cattle' ? 'aurochs' : sp.tame === 'pig' ? 'boar' : sp.tame}. Others will learn it from them.`, s.x, s.y, c.color); } } }
      if (farm[i]) {
        farms++; soilS += soil[i]; const ir = fresh[i] <= irrR, y0 = Math.min(1, crop[i] + (ir ? 0.5 : 0)) * Math.min(1, soil[i]);
        if (farm[i] === 2) { blight++; farm[i] = 1; } else if (ir) irrg += y0; else rain += y0;
        if (!(fresh[i] <= 1 && mi[i] > 0.3)) { const sh = t[i + 1] > 0.3 || t[i - 1] > 0.3 || t[i + W] > 0.3 || t[i - W] > 0.3; soil[i] -= (A.writing ? 0.002 : 0.004) * (sh ? 1 : 2) * (A.terraces ? 0.7 : 1) * (mi[i] > 1.6 ? 2.2 : 1) + (ir && mi[i] < 0.3 ? 0.002 : 0); if (soil[i] < 0.42) { farm[i] = 0; if (w.tCap[i] > 0.3) t[i] = 0.05; } }
        else if (wa > 1.45) soil[i] = Math.min(1.3, soil[i] + 0.02);
      } else {
        wildF += 0.6 * g[i] + 0.9 * t[i]; if (herder) { past += g[i]; if (s.pop > 60) g[i] *= 0.985; }
        if (A.farming && o[2] <= farmR) { const ir = fresh[i] <= irrR, kk = Math.min(1, crop[i] + (ir ? 0.5 : 0)) * Math.min(1, soil[i]) - 0.55 * t[i];
          if (kk > bestK && soil[i] > 0.75 && h[i] - sea < maxH && !fireT[i] && i !== i0 && w.magic[i] < 0.7) { bestK = kk; bestI = i; } }
      }
    }
    s.ores = ores; c._metals |= ores; s.port = seaN >= 3 && !s.nomad;
    const yieldF = 15 * (c.tame.cattle ? 1.15 : 1) * (A.iron ? 1.1 : 1) * (A.writing ? 1.12 : 1) * (A.engines ? 1.5 : 1);
    const fW = wildF * (s.nomad ? 3.2 : 1.1) * (0.55 + 0.45 * Math.min(wa, 1.3)) * sun, fH = hunt * 6;
    const fFr = Math.min(freshF * (A.boats ? 2.2 : 1.5), s.pop * 0.9 + 10), want = seaN ? Math.max(0, Math.min(s.pop * 0.95 + 12 - fFr, seaN * (A.sailing ? 4.5 : A.boats ? 3 : 1.1))) : 0;
    const fSea = want > 0 ? catchFish(w, s.x, s.y, s.R + (A.sailing ? 10 : A.boats ? 4 : 1), want) : 0, fF = fFr + fSea, fishGap = want > 8 ? fSea / want : 1;
    const fA = (rain * clamp(wa, 0.2, 1.3) + irrg * (A.irrigation ? 1.15 : 1) * (0.72 + 0.28 * Math.min(wa, 1.2)) * (wa > 1.5 ? 0.8 : 1)) * yieldF * sun;
    const fP = herder ? past * (s.nomad ? 3.4 : 2) * (c.tame.horse ? 1.15 : 1) * (0.5 + 0.5 * Math.min(wa, 1.3)) * sun : 0;
    const food = (fW + fH + fF + fA + fP) * (1 + 0.06 * Math.min(4, s.trade)) * (c.tame.pig ? 1.05 : 1) * (s.plague > 0 ? 0.8 : 1); s.src = [fW, fH, fF, fA, fP];
    const mx = Math.max(fW, fH, fF, fA, fP); s.way = mx === fA ? 'farm' : mx === fP ? 'herd' : mx === fF ? 'fish' : mx === fH ? 'hunt' : 'forage'; c._ways[s.way] += s.pop;
    if (!s.nomad && A.farming && bestI >= 0 && farms < Math.ceil((s.pop * 1.3) / (yieldF * 0.6))) { farm[bestI] = 1; t[bestI] = 0; g[bestI] = 0.25; }
    // tallies that decide what this people can learn
    const e = c.env; if (landN && cropS / landN > 0.35) e.crop++; if (seaN >= 3) e.coast++; if (farms && mi[i0] < 0.55 && fresh[i0] <= 2) e.dryRiver++; if (h[i0] - sea > 0.24) e.hill++;
    if (s.nomad) e.nomads++; else { e.sed++; if (s.tier >= 2) e.towns++; if (s.tier >= 3) e.cities++; }
    const cap = Math.max(1, food);
    if (s.pop < cap) { s.pop += s.pop * (s.nomad ? 0.036 : 0.025) * (1 - s.pop / cap); s.note = s.pop > cap * 0.92 ? 'full' : 'grow'; if (s.note === 'full' && !s.nomad) c._full++; }
    else {
      const loss = (s.pop - cap) * 0.18, farmer = s.way === 'farm' || (farms > 0 && fA + 1 >= mx * 0.6);
      const why = w.aerosol > 0.3 ? 'ash' : s.plague > 0 ? 'plague' : farmer ? (blight > farms * 0.3 ? 'locusts' : wa < 0.78 ? 'drought' : wa > 1.5 && irrg > rain ? 'flood' : farms && soilS / farms < 0.66 ? 'soil' : 'crowded') : s.way === 'fish' ? (fishGap < 0.75 ? 'fish' : 'crowded') : wa < 0.78 ? 'drought' : s.way === 'hunt' || s.way === 'herd' ? (past + hunt < 2 ? 'game' : 'crowded') : 'crowded';
      s.note = why;
      if (loss > s.pop * 0.06) { c.hungry++;
        if (why === 'drought') c._dry++;
        else if (why !== 'plague' && why !== 'crowded' && why !== 'ash' && !s.nomad && w.year - s.lastFam > 45) { s.lastFam = w.year; ev(w, FAMINE[why].replace('%', s.name), s.x, s.y, c.color, s.tier >= 2 ? 0 : 1); if (why === 'fish') discover(w, 'nets', s.x, s.y); else if (why === 'soil') discover(w, 'dust', s.x, s.y); }
        if (s.pop > 80 && !s.nomad) flee(w, s, loss * 0.6); }
      s.pop -= loss;
    }
    if (s.plague > 0) { const st = w.plagues[s.pid], dead = s.pop * st.v; s.pop -= dead; st.killed += dead; st.now++; s.plague--; if (s.plague === 0) s.immune = 70; c.seasoned = true;
      near(w, s.x, s.y, st.bad ? 14 : 9, s, false, (o) => { if (rnd() < st.catchy * (o.cult === s.cult ? 0.8 : 0.5)) infect(w, o, s.pid); }); } else if (s.immune > 0) s.immune--;
    if (s.pop < 5) { endSet(w, s, s.plague > 0 || s.immune > 55 ? 'plague' : s.note === 'grow' || s.note === 'full' ? 'abandoned' : 'starved'); continue; }
    s.trade *= 0.8;
    c.know += s.pop * c.wit * (1 + 0.2 * Math.min(4, s.trade)) * (s.tower ? 1.6 : 1) * (A.writing ? 1.25 : 1); c._n++; c._p += s.pop; total += s.pop; if (!c._b || s.pop > c._b.pop) c._b = s; if (A.engines) smoke += s.pop;
    if (s.nomad) nomadStep(w, s, c, seaN, fishGap); else townStep(w, s, c);
  }
  yield;
  if (w.anyDead) { w.sets = w.sets.filter((s) => !s.dead); w.anyDead = false; }
  buildGrid(w); territory(w);
  let alive = 0;
  for (const c of w.cults) {
    if (!c.alive) continue; if (c._n < 0) { alive++; continue; }   // too new to have been counted
    c.count = c._n; c.pop = c._p; c.big = c._b && !c._b.dead ? c._b : null;
    if (c.count === 0) { if (!w.sets.some((s) => s.cult === c.id) && !w.movers.some((m) => m.cult === c.id && (m.kind === 'refugees' || m.kind === 'settlers'))) { c.alive = false; endWar(w, c, true); ev(w, `The ${c.name} are gone from the world.`, null, null, c.color, c.peak > 2000 ? 2 : c.peak > 300 ? 0 : 1); if (c.peak > 300) discover(w, 'gone', null, null); } continue; }
    alive++; cultYear(w, c);
  }
  ruinsYear(w); plaguesYear(w);
  w.greenhouse = (w.greenhouse || 0) * 0.998;   // the air clears, slowly, when the chimneys stop
  if (smoke > 0) { w.greenhouse = Math.min(7, w.greenhouse + smoke * 1.1e-7); if (!w.found.smoke) { const c = w.cults.find((q) => q.alive && q.arts.engines); if (c && c.big) discover(w, 'smoke', c.big.x, c.big.y); } }
  w.stats.people = Math.round(total); w.stats.places = w.sets.length; w.stats.peoples = alive;
  const hist = w.popHist; if (w.year % w.popEvery === 0) { hist.push(Math.round(total)); if (hist.length >= 320) { let j = 0; for (let q = 0; q < hist.length; q += 2) hist[j++] = hist[q]; hist.length = j; w.popEvery *= 2; } }
  if (w.year % 100 === 0 && total > 0) { let top = null; for (const c of w.cults) if (c.alive && (!top || c.pop > top.pop)) top = c; const was = w.popCent || 0, ch = was > 50 ? (total - was) / was : 0; w.popCent = total;
    w.events.push({ year: w.year, digest: true, x: top && top.big ? top.big.x : null, y: top && top.big ? top.big.y : null, color: top ? top.color : null, text: `Year ${w.year}. ${total >= 2000 ? Math.round(total / 1000) + ' thousand' : Math.round(total)} people, ${alive} peoples, ${w.ruins.length} ruins.${top ? ` The ${top.name} (${top.kind}) are the most numerous.` : ''}${ch > 0.5 ? ' Far more people than a century ago.' : ch > 0.12 ? ' More people than a century ago.' : ch < -0.3 ? ' Far fewer people than a century ago.' : ch < -0.08 ? ' Fewer people than a century ago.' : was > 50 ? ' About as many people as a century ago.' : ''}` }); }
  if (total > (w.popPeak || 0)) w.popPeak = total; else if (w.popPeak > 20000 && total < w.popPeak * 0.6 && discover(w, 'fall', null, null)) ev(w, 'There are far fewer people in the world than there were. The old songs call this the Fall.', null, null, null, 2);
}
// roads and the traffic on them, kept apart from the yearly census so the work is spread out
export function roadsYear(w) { if (w.year % 5 === 0) roads(w); caravans(w); }

function ruinsYear(w) {
  const rnd = w.rnd;
  for (const r of w.ruins) {
    const i = r.y * W + r.x; if (w.magic[i] < 1) w.magic[i] = Math.min(1, w.magic[i] + 0.0022 * (r.tier >= 3 ? 1.6 : 1));
    if (r.kind !== 'drowned' && w.water[i] === 1) { r.kind = 'drowned'; discover(w, 'drowned', r.x, r.y); }
    if (!r.looted && r.kind !== 'drowned' && rnd() < 0.03) { const s = near(w, r.x, r.y, 8, null, true); if (s) { const c = w.cults[s.cult];
        if (r.haunt) { r.looted = true; infect(w, s, null, true); ev(w, `Diggers from ${s.name} open the ruins of ${r.name}. What they bring home kills half the town.`, r.x, r.y, c.color); discover(w, 'curse', r.x, r.y); }
        else if (c.know < r.know * 0.9) { c.know += (r.know - c.know) * 0.35; r.looted = true; ev(w, `Diggers from ${s.name} find old writings in the ruins of ${r.name}.`, r.x, r.y, c.color, (w.relics = (w.relics || 0) + 1) <= 2 ? 0 : 1); discover(w, 'relic', r.x, r.y); } } }
    if (w.magic[i] > 0.8 && w.year - r.year > 250 && !r.haunt) { r.haunt = true; if (discover(w, 'haunt', r.x, r.y)) ev(w, `No one goes near the ruins of ${r.name} any more.`, r.x, r.y, null); }
  }
}

function kindOf(c) {
  const A = c.arts, e = c.env, nomad = e.nomads > e.sed;
  if (c.way === 'herd') return c.grazer === 'reindeer' ? 'reindeer herders' : A.riding ? (c.grazer === 'camel' ? 'camel riders' : 'horse nomads') : nomad ? 'wandering herders' : 'ranchers';
  if (c.way === 'fish') return A.sailing ? 'sea traders' : nomad ? 'shore gatherers' : 'fisherfolk';
  if (c.way === 'hunt') return 'hunters';
  if (c.way === 'forage') return 'foragers';
  if (A.engines) return 'factory towns';
  if (e.cities >= 3) return 'city builders';
  const T = c.homeT, m = c.homeM;
  return A.irrigation && e.dryRiver * 2 >= e.sed ? (m < 0.3 ? 'oasis farmers' : 'river farmers') : A.terraces && e.hill * 2 >= e.sed ? 'terrace farmers' : T > 21 && m > 1.1 ? 'rice growers' : T < 8 ? 'rye farmers' : m < 0.6 ? 'dry-land farmers' : 'grain farmers';
}

function cultYear(w, c) {
  const rnd = w.rnd, b = c.big, A = c.arts; if (c.pop > c.peak) c.peak = c.pop;
  let way = 'forage', mx = 0; for (const k in c._ways) if (c._ways[k] > mx) { mx = c._ways[k]; way = k; }
  if (way !== c.way) { c.way = way; if (b && c.count >= 3) { if (way === 'herd' && A.riding) { if (discover(w, 'riders', b.x, b.y)) ev(w, `The ${c.name} live in the saddle now.`, b.x, b.y, c.color); } else if (way === 'herd') discover(w, 'herders', b.x, b.y); else if (way === 'fish' && A.boats) discover(w, 'sea', b.x, b.y); } }
  c.nomadsWas = c.env.nomads;
  if (b) { c.homeT = w.tMean[b.y * W + b.x]; c.homeM = w.mi[b.y * W + b.x]; }
  c.kind = kindOf(c); c.metals = c._metals; c.gold = !!(c.metals & 16); c.tech = techOf(c.know);
  for (const k of ART_KEYS) if (!A[k] && canLearn(c, k, false) && rnd() < 0.06) { learn(w, c, k); break; }
  for (const k in c.nb) { c.nb[k] *= 0.9; if (c.nb[k] < 0.05) delete c.nb[k]; }
  if (w.year >= c.ruler.until) crown(w, c);
  // cohesion: young, small and pressed peoples hold together; big, old, easy ones come apart
  const tr = c.ruler.trait, target = clamp(1.05 - c.count / (A.writing ? 58 : 38) - (w.year - c.born) / 1300 - (c.hungry / Math.max(4, c.count)) * 0.35 - (c._full / Math.max(4, c.count)) * 0.22 + (tr === 'law' ? 0.25 : tr === 'great' ? 0.2 : tr === 'mad' ? -0.35 : 0) + Math.min(0.2, c.wins * 0.04), 0.05, 1);
  c.coh += (target - c.coh) * 0.035; c.wins *= 0.97;
  if (c._dry >= Math.max(2, c.count * 0.3) && w.year - c.lastDry > 30 && b) { c.lastDry = w.year; ev(w, c.count >= 8 ? `The rains fail across the lands of the ${c.name}. ${b.name ? b.name + ' counts its grain' : 'The herds grow thin'}.` : `The rains fail for the ${c.name}.`, b.x, b.y, c.color, c.count >= 8 ? 0 : 1); if (c.count >= 8) discover(w, 'drought', b.x, b.y); }
  if (c.env.sed >= 40 && b && b.name && !c.flags.empire) { c.flags.empire = 1; ev(w, `The ${c.name} rule from ${b.name} over ${c.env.sed} towns and villages.`, b.x, b.y, c.color, once(w, 'empire') ? 2 : c.flags.empired ? 1 : 0); c.flags.empired = 1; discover(w, 'empire', b.x, b.y); }
  if (b && c.count >= 8 && rnd() < (c.coh < 0.3 ? 0.04 : c.coh < 0.45 ? 0.01 : 0.0008)) { if (c.coh < 0.24 && c.count >= 10 && w.year - (c.fellAt || -999) > 140) collapse(w, c); else if (w.year - (c.fellAt || -999) > 40) schism(w, c); }
  if (b && A.masonry && b.tier === 3 && b.pop > 1500 && !b.wonder && w.year - c.wonderAt > 180 && (c.gold || c.coh > 0.6 || tr === 'builder') && rnd() < 0.03) {
    b.wonder = 1 + ((rnd() * 4) | 0); c.wonderAt = w.year; c.coh = Math.min(1, c.coh + 0.1);
    ev(w, `${b.name} raises ${['', 'a great pyramid', 'a colossus', 'a temple the size of a hill', 'a lighthouse seen from a day away'][b.wonder]}.`, b.x, b.y, c.color); discover(w, 'wonder', b.x, b.y);
  }
  // war
  if (c.war) { const f = w.cults[c.war.foe]; if (!f.alive || w.year >= c.war.until) endWar(w, c); }
  else if (c.count >= 4 && b) {
    let foe = null, fs = 1.5; for (const k in c.nb) { const o = w.cults[k]; if (o.alive && !o.war && c.nb[k] > fs) { fs = c.nb[k]; foe = o; } }
    const horde = c.env.nomads > c.env.sed && c.env.nomads >= 9 && A.riding && tr === 'great' && !c.ruler.rode;
    if (foe && rnd() < (horde ? 0.3 : tr === 'great' ? 0.03 : tr === 'mad' ? 0.02 : 0.0025) + Math.min(0.03, (c.hungry / c.count) * 0.05)) startWar(w, c, foe, horde);
  }
}
function startWar(w, c, f, horde) {
  const until = w.year + 6 + ((w.rnd() * 18) | 0), b = c.big, big = c.count >= 20 && f.count >= 16, again = c.fought === f.id; c.fought = f.id; f.fought = c.id;
  c.war = { foe: f.id, since: w.year, until, taken: 0, lost: 0, mine: true, horde }; f.war = { foe: c.id, since: w.year, until, taken: 0, lost: 0, mine: false };
  if (horde) { c.ruler.rode = true; ev(w, `${c.ruler.name} gathers every rider of the ${c.name}. They ride on the ${f.name}.`, b.x, b.y, c.color, once(w, 'horde') ? 2 : f.count >= 20 ? 0 : 1); discover(w, 'horde', b.x, b.y); }
  else ev(w, c.hungry > c.count * 0.25 ? `Hungry, the ${c.name} turn on the ${f.name}.` : c.ruler.trait === 'great' ? `${c.ruler.name} leads the ${c.name} to war against the ${f.name}.` : again ? `The ${c.name} and the ${f.name} are at war again.` : `The ${c.name} go to war with the ${f.name}.`, b.x, b.y, c.color, c.count + f.count >= 30 ? 0 : 1);
}
function endWar(w, c, quiet) {
  const wr = c.war; if (!wr) return; const f = w.cults[wr.foe], fw = f.war && f.war.foe === c.id ? f.war : null; c.war = null; if (fw) f.war = null;
  if (quiet || !f.alive || !c.alive) return;
  const a = wr.mine ? c : f, d = wr.mine ? f : c, aw = wr.mine ? wr : fw, dw = wr.mine ? fw : wr, got = aw ? aw.taken : 0, lost = dw ? dw.taken : 0, yrs = w.year - wr.since, at = a.big || d.big;
  const big = got + lost >= 8;
  const txt = wr.horde || (fw && fw.horde) ? (got >= 4 ? `The riders of the ${a.name} now rule ${got} towns of the ${d.name}. In a generation they will be townsfolk themselves.` : `The riders of the ${a.name} go home with what they could carry.`) : got > lost + 1 ? `After ${yrs} years the ${d.name} sue for peace. ${got} of their towns now answer to the ${a.name}.` : lost > got + 1 ? `The war the ${a.name} started ends badly for them: ${lost} towns lost to the ${d.name}.` : `The war between the ${a.name} and the ${d.name} ends after ${yrs} years with little to show for it.`;
  ev(w, txt, at ? at.x : null, at ? at.y : null, a.color, big ? 2 : got + lost >= 3 ? 0 : 1); if (big) discover(w, 'war', at ? at.x : null, at ? at.y : null);
}
function schism(w, c, quiet) {
  if (!c.big) return null; let far = null, fd = 0;
  for (const s of w.sets) { if (s.cult !== c.id || s.nomad) continue; const d = wrapDx(s.x - c.big.x) ** 2 + (s.y - c.big.y) ** 2; if (d > fd) { fd = d; far = s; } }
  if (!far || fd < 16 * 16) return null;
  if (aliveN(w) >= MAXC) { let to = null; near(w, far.x, far.y, 30, far, true, (o) => { if (o.cult !== c.id && (!to || w.cults[o.cult].pop > w.cults[to.cult].pop)) to = o; }); if (!to) return null; const oc = w.cults[to.cult]; let n = 0;
    for (const s of w.sets) { if (s.cult !== c.id) continue; if (wrapDx(s.x - far.x) ** 2 + (s.y - far.y) ** 2 < 0.5 * (wrapDx(s.x - c.big.x) ** 2 + (s.y - c.big.y) ** 2)) { s.cult = oc.id; n++; } }
    if (n) { c.coh = Math.min(1, c.coh + 0.15); if (!quiet) ev(w, `${n === 1 ? far.name + ' goes' : far.name + ' and ' + (n - 1) + ' other ' + (n === 2 ? 'place go' : 'places go')} over to the ${oc.name}. The ${c.name} are too weak to stop it.`, far.x, far.y, oc.color, n < 5 ? 1 : 0); } return n ? { n, to: oc } : null; }
  const nc = newCult(w, c); let n = 0;
  for (const s of w.sets) { if (s.cult !== c.id) continue; if (wrapDx(s.x - far.x) ** 2 + (s.y - far.y) ** 2 < wrapDx(s.x - c.big.x) ** 2 + (s.y - c.big.y) ** 2) { s.cult = nc.id; n++; } }
  nc.count = n; nc.coh = 0.9; c.coh = Math.min(1, c.coh + 0.2);
  const dx = wrapDx(far.x - c.big.x), dy = far.y - c.big.y, dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'eastern' : 'western') : dy > 0 ? 'southern' : 'northern';
  if (!quiet) ev(w, `The ${dir} ${TIER[Math.max(1, far.tier)]}s of the ${c.name} break away. They call themselves the ${nc.name}.`, far.x, far.y, nc.color, n < 6 ? 1 : 0); discover(w, 'schism', far.x, far.y);
  return { n, to: nc, born: true };
}
function collapse(w, c) {
  const b = c.big, old = c.tech, n0 = c.count, heirs = [];
  c.fellAt = w.year; let went = 0; for (let k = 0; k < 3; k++) { const r = schism(w, c, true); if (r) { went += r.n; if (!heirs.includes(r.to)) heirs.push(r.to); } }
  for (const s of w.sets) if (s.cult === c.id && !s.nomad) { const lost = s.pop * (0.15 + 0.3 * w.rnd()); flee(w, s, lost * 0.5); s.pop -= lost; if (s === b) continue; if (s.tier >= 2 && w.rnd() < 0.18) { endSet(w, s, 'abandoned'); continue; }
    if (w.rnd() < 0.3) { let to = null; near(w, s.x, s.y, 22, s, true, (u, q) => { if (u.cult !== c.id && (!to || q < to.q)) to = { u, q }; }); if (to) { s.cult = to.u.cult; s.trade = 0; went++; const h = w.cults[to.u.cult]; if (!heirs.includes(h)) heirs.push(h); } } }
  const who = heirs.length ? ` ${went === 1 ? 'One' : went} of ${b.name ? 'its places' : 'their camps'} ${went === 1 ? 'goes' : 'go'} over to the ${heirs.slice(0, 2).map((h) => h.name).join(' and the ')}${heirs.length > 2 ? ' and others' : ''}.` : '';
  ev(w, b.name ? `The realm of the ${c.name} comes apart.${who} ${b.name} holds what is left.` : `The ${c.name} fall to fighting among themselves.${who}`, b.x, b.y, c.color, n0 >= 30 || once(w, 'collapse') ? 2 : 0);
  if (old >= 2 && w.rnd() < 0.7) { c.know = TECH[old - 1] * 0.55; c.tech = techOf(c.know); const lose = ['engines', 'sailing', 'writing', 'irrigation', 'roads'].find((k) => c.arts[k]); if (lose) { delete c.arts[lose]; ev(w, `The ${c.name} forget ${ART[lose].say}.`, b.x, b.y, c.color); } discover(w, 'darkage', b.x, b.y); }
  c.coh = 0.85; c.born = w.year; c.flags.empire = 0; endWar(w, c, true);
}

function nomadStep(w, s, c, seaN, fishGap) {
  const rnd = w.rnd, herder = !!c.grazer, A = c.arts, src = s.src;
  const herding = herder && src[4] >= src[2] && src[4] > src[0] * 0.8;
  if (s.age > 3 && (A.farming || (!herding && c.know > 1200 && src[2] > src[0] + src[1]))) {
    let sk = 0, cnt = 0; for (const o of DISC[2]) { const y = s.y + o[1]; if (y < 1 || y >= H - 1) continue; const i = y * W + wx(s.x + o[0]); if (w.water[i]) continue; sk += w.crop[i] + (w.fresh[i] <= 1 ? 0.3 : 0); cnt++; }
    if (cnt >= 6 && ((A.farming && sk / cnt > (herder ? 0.8 : 0.4)) || (!herder && seaN >= 4 && fishGap > 0.8)) && !near(w, s.x, s.y, 6, s, true) && w.magic[s.y * W + s.x] < 0.7) {
      s.nomad = false; s.tier = 1; s.maxTier = 1; s.age = 0; s.px = s.x; s.py = s.y;
      const ru = ruinAt(w, s.x, s.y);
      if (ru) { s.name = 'New ' + ru.name.replace(/^New /, ''); discover(w, 'reborn', s.x, s.y); } else s.name = placeName(w, c);
      if (!c.flags.village) { c.flags.village = 1; const fishy = !(A.farming && sk / cnt > 0.4); ev(w, `The ${c.name} put down roots at ${s.name}${fishy ? ', a fishing camp that stayed' : ', their first village'}.`, s.x, s.y, c.color, once(w, 'village') ? 0 : 1); discover(w, 'village', s.x, s.y); }
      return;
    }
  }
  s.px = s.x; s.py = s.y; s.mt = w.tickN;
  if (rnd() < 0.7) { let best = siteScore(w, s.x, s.y, A.farming, herding) * 1.08, bx = s.x, by = s.y; const D = DISC[herder ? 6 : 3];
    for (let q = 0; q < 6; q++) { const o = D[(rnd() * D.length) | 0], x = wx(s.x + o[0]), y = s.y + o[1]; if (y < 2 || y >= H - 2) continue; const i = y * W + x; if (w.water[i] || w.h[i] - w.params.sea > 0.42 || w.ice[i]) continue;
      let sc = siteScore(w, x, y, A.farming, herding) * (0.9 + 0.2 * rnd()); if (near(w, x, y, 4, s)) sc *= 0.4; if (sc > best) { best = sc; bx = x; by = y; } }
    s.x = bx; s.y = by; }
  if ((s.pop > (herder ? 150 : 46) || (s.note === 'full' && s.pop > (herder ? 55 : 34))) && Math.max(c.env.nomads, c.nomadsWas || 0) < (herder ? (c.env.sed > 4 ? 12 : 26) : 10) && w.sets.length < MAXS) { c.env.nomads++; c.nomadsWas = (c.nomadsWas || 0) + 1; const D = DISC[herding ? 7 : 4]; for (let q = 0; q < 6; q++) { const o = D[(rnd() * D.length) | 0], x = wx(s.x + o[0]), y = s.y + o[1]; if (y < 2 || y >= H - 2 || w.water[y * W + x]) continue; const half = Math.round(s.pop * 0.45); s.pop -= half; const b = addSet(w, s.cult, x, y, half, true); b.px = s.x; b.py = s.y; b.mt = w.tickN; break; } }
  if (A.farming && !herding && s.age > 20 && rnd() < 0.08) { const b = near(w, s.x, s.y, 14, s, true); if (b) { b.pop += s.pop * 0.8; s.dead = true; w.anyDead = true; return; } if (s.age > 60) { s.dead = true; w.anyDead = true; return; } }
  const war = c.war;
  if (herder && s.pop > 70 && w.year >= s.busy && rnd() < (A.riding ? 0.07 : 0.02) * (war ? (war.horde ? 6 : 3) : 1)) raid(w, s, c);
}

function townStep(w, s, c) {
  const rnd = w.rnd, A = c.arts, nt = s.pop >= 700 ? 3 : s.pop >= 150 ? 2 : 1;
  if (nt > s.tier) { s.tier = nt; if (nt > s.maxTier) { s.maxTier = nt;
      if (nt === 2 && !c.flags.town) { c.flags.town = 1; ev(w, `${s.name} grows into the first town of the ${c.name}.`, s.x, s.y, c.color, once(w, 'town') ? 0 : 1); }
      else if (nt === 3) { const first = once(w, 'city'); ev(w, first ? `${s.name} becomes the first city in the world.` : c.flags.city ? `${s.name} is now a city of the ${c.name}.` : `${s.name} becomes the first city of the ${c.name}.`, s.x, s.y, c.color, first ? 2 : 1); c.flags.city = 1; discover(w, 'city', s.x, s.y); if (s.way === 'farm' && w.fresh[s.y * W + s.x] <= 1 && A.irrigation) discover(w, 'river', s.x, s.y); } } }
  else if (nt < s.tier && s.pop < (s.tier === 3 ? 500 : 100)) s.tier = nt;
  if (A.masonry && s.tier >= 2) s.walls = true;
  if (!s.tower && c.tech >= 3 && s.tier >= 2 && w.magic[s.y * W + s.x] > 0.55 && rnd() < 0.02) { s.tower = true; if (!A.craft) c.arts.craft = w.year; ev(w, `A tower goes up at ${s.name}, where the air hums. Nobody admits to building it.`, s.x, s.y, c.color); discover(w, 'tower', s.x, s.y); }
  if (s.tower && s.wa < 0.7 && rnd() < 0.2) { for (const o of DISC[7]) { const y = s.y + o[1]; if (y < 0 || y >= H) continue; const i = y * W + wx(s.x + o[0]); w.wetBias[i] = Math.min(2.5, w.wetBias[i] + 0.25 * (1 - o[2] / 8)); } w.need.climate = true; if (discover(w, 'rainmaker', s.x, s.y)) ev(w, `In the third dry year, the tower at ${s.name} calls the rain. It comes.`, s.x, s.y, c.color); }
  if (s.pop > 95 && s.age > 14 && w.sets.length < MAXS && rnd() < 0.036) colonize(w, s, c);
  else if (c.grazer && s.pop > 130 && rnd() < 0.008) pasture(w, s, c);
  const war = c.war;
  if (s.pop > 60 && w.year >= s.busy && rnd() < 0.03 * (c.ruler.trait === 'great' ? 2 : 1) * (war ? 3.2 : 1)) raid(w, s, c);
  if (s.tier >= 2 && s.trade > 1.5 && rnd() < (s.tier === 3 ? 0.0016 : 0.0005) && infect(w, s, null) && w.plagues[s.pid].bad) ev(w, `A sickness nobody has a name for breaks out in ${s.name}.`, s.x, s.y, c.color);
  // ships: ports trade with whatever other ports they can reach
  if (s.port && A.boats && s.tier >= 1 && rnd() < (s.tier >= 2 ? 0.2 : 0.07)) {
    const cand = []; near(w, s.x, s.y, A.sailing ? 80 : 26, s, true, (o) => { if (o.port && o.tier >= 1) cand.push(o); });
    if (cand.length) { const o = cand[(rnd() * cand.length) | 0], wet = crossesWater(w, s.x, s.y, o.x, o.y); if (wet >= 5) send(w, { kind: 'trade', cult: s.cult, x: s.x, y: s.y, tx: o.x, ty: o.y, n: 8, from: s, to: o, wet0: true, land: 1.2 }); }
  }
}

function colonize(w, s, c) {
  const rnd = w.rnd, A = c.arts, maxD = A.sailing ? 70 : A.boats || A.roads ? 22 : 12, sea = w.params.sea; let best = null, bs = 9.5;
  for (let q = 0; q < 12; q++) {
    const far = A.sailing && q < 3, a = rnd() * 6.2832, d = far ? 26 + rnd() * (maxD - 26) : 6 + rnd() * (Math.min(maxD, 22) - 6), x = wx(Math.round(s.x + Math.cos(a) * d)), y = Math.round(s.y + Math.sin(a) * d * 0.8); if (y < 3 || y >= H - 3) continue; const i = y * W + x;
    if (w.water[i] || w.h[i] - sea > (A.terraces ? 0.5 : 0.36) || w.gCap[i] < 0.24 || w.ice[i] || w.magic[i] > 0.75 || near(w, x, y, 8.5, null, true)) continue;
    const wet = crossesWater(w, s.x, s.y, x, y); if (wet > 1 && !A.boats) continue; if (wet > 5 && !A.sailing) continue;
    let sc = 0; for (const o of DISC[2]) { const yy = y + o[1]; if (yy < 0 || yy >= H) continue; const j = yy * W + wx(x + o[0]); if (w.water[j]) sc += A.boats ? 0.6 : 0.15; else sc += 0.12 * w.gCap[j] + (A.farming ? Math.min(1, w.crop[j] + (w.fresh[j] <= (A.irrigation ? 3 : 1) ? 0.5 : 0)) : 0) + (c.grazer ? 0.25 * w.g[j] : 0); }
    if (ruinAt(w, x, y) && !w.ruins.some((r) => r.haunt && Math.abs(wrapDx(r.x - x)) <= 2 && Math.abs(r.y - y) <= 2)) sc += 2;
    sc *= 0.85 + 0.3 * rnd(); if (sc > bs) { bs = sc; best = { x, y, wet, far: w.mass[i] !== w.mass[s.y * W + s.x] }; }
  }
  if (!best) { if (c.grazer && rnd() < 0.5) pasture(w, s, c); return; } s.pop -= 26; const ocean = best.wet > 5;
  send(w, { kind: 'settlers', cult: s.cult, x: s.x, y: s.y, tx: best.x, ty: best.y, n: 26, from: s, wetN: best.wet, ocean, far: best.far, split: rnd() < (ocean ? 0.4 : best.wet > 1 ? 0.12 : 0.02), land: A.riding ? 1.2 : 0.75 });
}

// Farmers with animals, living next to grass that will not grow grain: sooner or later some of
// them take the herds out there and stop coming back.
function pasture(w, s, c) {
  const rnd = w.rnd, sea = w.params.sea; let bi = -1, bg = 0.35;
  for (let q = 0; q < 14; q++) { const a = rnd() * 6.2832, d = 6 + rnd() * 13, x = wx(Math.round(s.x + Math.cos(a) * d)), y = Math.round(s.y + Math.sin(a) * d * 0.8); if (y < 3 || y >= H - 3) continue; const i = y * W + x;
    if (w.water[i] || w.crop[i] > 0.3 || w.ice[i] || w.h[i] - sea > 0.4 || w.owner[i] >= 0 || w.g[i] <= bg || near(w, x, y, 5, null, false)) continue; bg = w.g[i]; bi = i; }
  if (bi < 0 || w.sets.length >= MAXS || Math.max(c.env.nomads, c.nomadsWas || 0) >= 12) return; let cult = s.cult; s.pop -= 30;
  if (c.env.nomads === 0 && aliveN(w) < MAXC + 3 && rnd() < 0.7) { const nc = newCult(w, c); cult = nc.id; nc.way = 'herd'; ev(w, `Herders of the ${c.name} take their animals out onto the open grass and do not come back. They call themselves the ${nc.name}.`, bi % W, (bi / W) | 0, nc.color, once(w, 'pastoral') ? 0 : 1); }
  else { c.env.nomads++; c.nomadsWas = (c.nomadsWas || 0) + 1; }
  const b = addSet(w, cult, bi % W, (bi / W) | 0, 30, true); b.px = s.x; b.py = s.y; b.mt = w.tickN;
}

// someone goes looking at the neighbours: half the time to trade, the rest with spears
function raid(w, s, c) {
  const rnd = w.rnd, A = c.arts, reach = s.R + 5 + (A.riding ? 8 : 0) + (s.nomad ? 4 : 0) + (A.boats ? 3 : 0), war = c.war; let o = null, bd = 1e9;
  near(w, s.x, s.y, reach + 9, s, false, (u, q) => { if (u.cult === s.cult || (u.nomad && !s.nomad && !(war && u.cult === war.foe))) return; const lim = (reach + u.R) ** 2, pref = war && u.cult === war.foe ? 0.35 : 1; if (q < lim && q * pref < bd) { bd = q * pref; o = u; } });
  if (!o) return; const oc = w.cults[o.cult], foe = war && war.foe === oc.id;
  const wet = crossesWater(w, s.x, s.y, o.x, o.y); if (wet > 1 && !A.boats) return;
  if (!foe && (oc.war || rnd() < (s.nomad ? 0.45 : 0.72))) { if (!o.nomad) send(w, { kind: 'trade', cult: s.cult, x: s.x, y: s.y, tx: o.x, ty: o.y, n: 6, from: s, to: o, land: A.riding ? 1.3 : 0.8 }); else meet(w, c, oc, 0.15); return; }
  meet(w, c, oc, 0.1);
  const men = Math.max(6, s.pop * (s.nomad ? 0.3 : 0.14)); s.pop -= men; s.busy = w.year + 3;
  send(w, { kind: 'army', cult: s.cult, x: s.x, y: s.y, tx: o.x, ty: o.y, n: men, from: s, to: o, nomad: s.nomad, land: A.riding ? 1.5 : 0.8 });
}

/* ---------- roads and the traffic on them ---------- */
const _dist = new Float32Array(N), _stamp = new Int32Array(N), _prev = new Int32Array(N), _heap = new Heap(N); let _st = 0;
function findPath(w, a, b) {
  const { h, water, t, river, road } = w, src = a.y * W + a.x, dst = b.y * W + b.x; _st++; _heap.clear(); _dist[src] = 0; _stamp[src] = _st; _prev[src] = -1; _heap.push(0, src); let budget = 5200;
  while (_heap.n && budget-- > 0) {
    const c = _heap.pop(), dc = _heap.key; if (c === dst) { const p = []; for (let k = c; k >= 0; k = _prev[k]) p.push(k); return p; } if (dc > _dist[c]) continue; const x = c % W, y = (c / W) | 0;
    for (let d = 0; d < 8; d++) { const yy = y + (d < 3 ? -1 : d < 5 ? 0 : 1); if (yy < 1 || yy >= H - 1) continue; const n = yy * W + wx(x + [-1, 0, 1, -1, 1, -1, 0, 1][d]); if (water[n]) continue;
      let cost = (d === 1 || d === 3 || d === 4 || d === 6 ? 1 : 1.42) * (1 + Math.abs(h[n] - h[c]) * 55 + t[n] * 1.3 + (river[n] ? 1.5 : 0)); if (road[n]) cost *= 0.35; const nd = dc + cost;
      if (_stamp[n] !== _st || nd < _dist[n]) { _stamp[n] = _st; _dist[n] = nd; _prev[n] = c; _heap.push(nd, n); } }
  }
  return null;
}
function roads(w) {
  for (const [key, L] of w.links) if (L.a.dead || L.b.dead || L.a.cult !== L.b.cult || L.path.some((i) => w.water[i] === 1 || w.lava[i])) { for (const i of L.path) if (w.road[i] > 0) w.road[i]--; w.links.delete(key); }
  for (const s of w.sets) s.links = 0; for (const L of w.links.values()) { L.a.links++; L.b.links++; }
  let budget = 4;
  for (const s of w.sets) {
    if (budget <= 0) break; if (s.nomad || s.dead || s.links >= 3) continue; const c = w.cults[s.cult]; if (!c.arts.roads) continue;
    let o = null, bd = 18 * 18 + 1;
    near(w, s.x, s.y, 18, s, true, (u, q) => { if (u.cult !== s.cult || u.links >= 4 || q >= bd) return; const key = Math.min(s.id, u.id) + '-' + Math.max(s.id, u.id); if (w.links.has(key) || (s.noPath && s.noPath.has(u.id))) return; bd = q; o = u; });
    if (!o) continue; budget--; const path = findPath(w, s, o); if (!path) { (s.noPath || (s.noPath = new Set())).add(o.id); continue; }
    for (const i of path) if (w.road[i] < 250) w.road[i]++; w.links.set(Math.min(s.id, o.id) + '-' + Math.max(s.id, o.id), { a: s, b: o, path }); s.links++; o.links++;
    if (once(w, 'road')) ev(w, `A road now runs between ${s.name} and ${o.name}, the first in the world.`, s.x, s.y, c.color);
  }
}
function caravans(w) {
  const rnd = w.rnd; for (const L of w.links.values()) { if (rnd() > 0.3 || L.a.dead || L.b.dead) continue; const rev = rnd() < 0.5, a = rev ? L.a : L.b, b = rev ? L.b : L.a; send(w, { kind: 'trade', cult: a.cult, x: a.x, y: a.y, tx: b.x, ty: b.y, n: 6, from: a, to: b, path: L.path, rev }); }
}

/* ---------- start, and the god's hand ---------- */
// The first bands are put down in different kinds of country on purpose: a river valley, open
// grass, a cold shore, deep woods. Where each one starts decides most of what it becomes.
const START = [
  (w, i) => w.crop[i] * 2 + (w.fresh[i] < 3 ? 2 : 0),                                                    // good farmland by water
  (w, i) => (w.crop[i] < 0.3 && w.g[i] > 0.5 && w.t[i] < 0.3 ? 3 : 0) + (w.herdAt[i] ? 1 : 0),            // open grass
  (w, i) => (w.dSea[i] <= 2 ? 2.5 : 0) + (w.tMean[i] < 9 ? 1.5 : 0),                                     // cold shore
  (w, i) => (w.t[i] > 0.7 ? 3 : 0),                                                                      // deep woods
  (w, i) => w.crop[i] * 2 + (w.fresh[i] < 3 ? 2 : 0),
  (w, i) => (w.dSea[i] <= 2 ? 3 : 0) + (w.tMean[i] > 14 ? 1 : 0),                                        // warm shore
  (w, i) => (w.mi[i] < 0.45 && w.mi[i] > 0.15 && w.tMean[i] > 12 ? 3 : 0) + (w.fresh[i] < 3 ? 1.5 : 0),  // dry country
  (w, i) => (w.tMean[i] < 3 && w.g[i] > 0.3 ? 3.5 : 0),                                                  // the cold north or south
  (w, i) => (w.crop[i] < 0.3 && w.g[i] > 0.5 && w.t[i] < 0.3 ? 3 : 0),
  (w, i) => (w.h[i] - w.params.sea > 0.2 ? 3 : 0),                                                       // hills
  (w, i) => w.crop[i] * 2 + (w.fresh[i] < 3 ? 2 : 0),
  (w, i) => (w.t[i] > 0.7 ? 3 : 0),
];
export function initPeople(w, n) {
  w.sets = []; w.cults = []; w.ruins = []; w.links = new Map(); w.movers = []; w.nextId = 1; w.greenhouse = 0; w.popHist = []; w.popEvery = 2; w.popPeak = 0; w.plagues = []; buildGrid(w);
  const got = []; n = n == null ? 11 : n;
  for (let b = 0; b < n; b++) {
    let best = -1, bs = 1.2; const want = START[b % START.length];
    for (let q = 0; q < 700; q++) { const i = (w.rnd() * N) | 0, x = i % W, y = (i / W) | 0; if (y < 8 || y > H - 9 || w.water[i] || w.gCap[i] < 0.3 || w.h[i] - w.params.sea > 0.36 || w.ice[i] || (w.massSize[w.mass[i]] || 0) < 60) continue;
      let ok = true; for (const g of got) if (wrapDx(g.x - x) ** 2 + (g.y - y) ** 2 < 34 * 34) ok = false; if (!ok) continue;
      const sc = want(w, i) + w.rnd() * 1.2 + (got.some((g) => w.mass[g.y * W + g.x] === w.mass[i]) ? 0 : 1.2); if (sc > bs) { bs = sc; best = i; } }
    if (best < 0) continue; const c = newCult(w, null), s = addSet(w, c.id, best % W, (best / W) | 0, 20 + Math.round(w.rnd() * 12), true); got.push(s);
  }
  buildGrid(w);
}
export function addBand(w, x, y) {
  x = wx(Math.round(x)); y = clamp(Math.round(y), 2, H - 3); if (w.water[y * W + x] || w.sets.length >= MAXS) return null;
  const c = newCult(w, null); addSet(w, c.id, x, y, 28, true); buildGrid(w);
  ev(w, `A new people, the ${c.name}, wake ${whereAbouts(w, x, y)}.`, x, y, c.color); return c;
}
// a leap of knowledge, handed down
export function gift(w, c) {
  c.know += Math.max(3000, c.know * 0.3); c.tech = techOf(c.know); c.coh = Math.min(1, c.coh + 0.15);
  const got = ART_KEYS.filter((k) => canLearn(c, k, true)); if (got.length) { learn(w, c, got[0]); return ART[got[0]].say; } return null;
}
