// Trade. Every place makes what its land gives it and lacks what its land does not, and the
// difference is what caravans and ships carry. Goods do real work where they land: tin turns a
// copper town into a bronze town, grain carries a city through a bad year, timber gives a bare
// coast its ships, horses make riders of people who never saw a wild one. Traffic wears routes
// into the world, the busiest get names, and the towns where they cross grow rich. Whoever
// depends on a route is hostage to it: when a war, a plague, a dragon or pirates cut it, the
// tin stops coming and the bronze age ends.
import { plantWild } from './origins.js';
import { W, H, N, DISC, wx, wrapDx, clamp } from './core.js';
import { ev, discover, once } from './story.js';
import { zoneOf } from './zones.js';
import { near } from './people.js';
import { PLANTS, giveCrop, hasCrop } from './origins.js';
import { SPECIES, habRaw, introduce } from './fauna.js';

export const GOODS = [
  { key: 'grain', name: 'grain', col: '#e8c860', v: 1 },
  { key: 'fish', name: 'salt fish', col: '#7ab8d8', v: 1 },
  { key: 'salt', name: 'salt', col: '#f2f2ea', v: 1.5 },
  { key: 'timber', name: 'timber', col: '#8a5a32', v: 1.2 },
  { key: 'furs', name: 'furs', col: '#c8b8a0', v: 2.5 },
  { key: 'spice', name: 'spices and dyes', col: '#e05a3a', v: 3.5 },
  { key: 'wine', name: 'wine and oil', col: '#9a3a6a', v: 2.5 },
  { key: 'horses', name: 'horses', col: '#6a4a30', v: 2.5 },
  { key: 'copper', name: 'copper', col: '#d4824a', v: 2 },
  { key: 'tin', name: 'tin', col: '#b8c0c8', v: 3 },
  { key: 'iron', name: 'iron', col: '#5a5a62', v: 2.2 },
  { key: 'gold', name: 'gold', col: '#ffd24a', v: 4 },
  { key: 'crafts', name: 'fine goods', col: '#c070e0', v: 3 },
  { key: 'relics', name: 'relics', col: '#9a8aff', v: 4 },
  { key: 'uranium', name: 'uranium', col: '#7aff5a', v: 5 },
];
export const G = Object.fromEntries(GOODS.map((g, k) => [g.key, k]));
const LUX = [G.furs, G.spice, G.wine, G.gold, G.crafts, G.relics];
const ROAD = { uranium: 'the Yellow Road', tin: 'the Tin Road', salt: 'the Salt Way', spice: 'the Spice Road', furs: 'the Fur Road', wine: 'the Wine Road', horses: 'the Horse Road', gold: 'the Gold Road', copper: 'the Copper Road', grain: 'the Grain Road', fish: 'the Herring Road', timber: 'the Timber Road', iron: 'the Iron Road', crafts: 'the Silk Road', relics: 'the Pilgrim Road' };
const SEA = { uranium: 'the Yellow Sea', spice: 'the Spice Sea', wine: 'the Wine-Dark Sea', tin: 'the Tin Sea', grain: 'the Grain Sea', fish: 'the Herring Sea', gold: 'the Gold Coast', timber: 'the Timber Sea', salt: 'the Salt Sea', furs: 'the Fur Sea', crafts: 'the Silk Sea', relics: 'the Pilgrims’ Sea', copper: 'the Copper Sea', iron: 'the Iron Sea', horses: 'the Horse Sea' };

export function initTrade(w) { w.routes = new Map(); w.pirates = []; w.leagues = []; }

// What a place makes and what it lacks, once a year, from its land and its people.
export function tradeYear(w) {
  const { t, tMean, mi, water } = w; for (const c of w.cults) c.timberOK = !!(c.metals & 256);
  for (const s of w.sets) {
    if (s.dead) continue; const c = w.cults[s.cult], A = c.arts, make = (s.make = s.make || new Float32Array(GOODS.length)), need = (s.need = s.need || new Float32Array(GOODS.length)); make.fill(0); need.fill(0);
    let forest = 0, land = 0; const i0 = s.y * W + s.x;
    for (const o of DISC[Math.min(6, s.R)]) { const yy = s.y + o[1]; if (yy < 0 || yy >= H) continue; const i = yy * W + wx(s.x + o[0]); if (water[i]) continue; land++; if (t[i] > 0.6) forest++; }
    const src = s.src || [0, 0, 0, 0, 0], food = src.reduce((a, b) => a + b, 0) || 1, T = tMean[i0], m = mi[i0];
    if (src[3] > s.pop * 1.05) make[G.grain] = Math.min(3, (src[3] - s.pop) / 40);
    if (src[2] > s.pop * 0.5 && s.port) make[G.fish] = Math.min(2, src[2] / 80);
    if (s.ores & 128 && A.electricity) make[G.uranium] = 2; if ((A.atomic || A.printing && A.electricity) && !(c._ownMetals & 128)) need[G.uranium] = 3;
    if (s.ores & 32) make[G.salt] = 2; if (s.ores & 2) make[G.copper] = 2; if (s.ores & 4) make[G.tin] = 2; if (s.ores & 8 && A.iron) make[G.iron] = 2; if (s.ores & 16) make[G.gold] = 2;
    if (forest >= 6) { make[G.timber] = Math.min(2, forest / 12); c.timberOK = true; }
    if (T < 5 && forest >= 4 && (src[1] > 0 || s.nomad)) make[G.furs] = 1.5;
    if (T > 21 && m > 1.1 && !s.nomad) make[G.spice] = 1.5;
    if (A.farming && zoneOf(w, i0) === 7) make[G.wine] = 1.5;
    if (c.tame.horse && (c.grazer === 'horse' || s.nomad)) make[G.horses] = 1.5;
    if (s.tier >= 2 && c.tech >= 2) make[G.crafts] = s.tier >= 3 ? 2 : 1;
    if (s.tower || (c.stance === 'use' && w.magic[i0] > 0.3)) make[G.relics] = 1;
    // what it lacks
    if (s.note && s.note !== 'grow' && s.note !== 'full' && s.note !== 'plague') need[G.grain] = 2;
    if ((c.metals & 2) && !(c.metals & 4) && c.tech >= 1) need[G.tin] = 3; if ((c.metals & 4) && !(c.metals & 2) && c.tech >= 1) need[G.copper] = 3;
    if (A.bronze && !((c.metals & 6) === 6)) { need[G.tin] = Math.max(need[G.tin], 2); need[G.copper] = Math.max(need[G.copper], 2); }
    if (c.tech >= 3 && !(c.metals & 8)) need[G.iron] = 2;
    if (s.port && forest < 3 && (A.boats || c.tech >= 2)) need[G.timber] = 2;
    if ((c.grazer || s.way === 'fish') && !(s.ores & 32)) need[G.salt] = 1;
    if (!c.tame.horse && c.tech >= 1 && !s.nomad) need[G.horses] = 0.8;
    if (s.tier >= 2) for (const g of LUX) if (!make[g]) need[g] = Math.max(need[g], s.tier >= 3 ? 1.5 : 0.8);
    if (c.stance === 'use') need[G.relics] = 1.5;
    s.wealth = (s.wealth || 0) * 0.93;
  }
  // routes fade unless they are used; the busiest get names
  for (const [k, r] of w.routes) {
    r.n *= 0.9; if (r.a.dead || r.b.dead || r.n < 0.3) { if (r.name && r.n < 0.3 && w.year - r.named > 20) ev(w, `${cap(r.name)} falls out of use. The inns along it close one by one.`, r.a.x, r.a.y, null, 1); w.routes.delete(k); continue; }
    if (!r.name && r.n > 9 && w.year - r.year > 15) { let bg = 0; for (let g = 1; g < GOODS.length; g++) if (r.g[g] > r.g[bg]) bg = g; const base = (r.wet ? SEA : ROAD)[GOODS[bg].key], same = [...w.routes.values()].filter((q) => q.name && q.good === bg && q.wet === r.wet), close = same.find((q) => wrapDx(q.a.x - r.a.x) ** 2 + (q.a.y - r.a.y) ** 2 < 3600);
      if (close) { r.name = close.name; r.good = bg; r.named = w.year; continue; }   // a branch of a road that already has a name
      const dir = r.a.y < H / 3 ? 'Northern ' : r.a.y > (2 * H) / 3 ? 'Southern ' : r.a.x < W / 2 ? 'Western ' : 'Eastern '; r.name = same.length ? base.replace(/^the /, 'the ' + dir) : base; r.good = bg; r.named = w.year;
      if (same.some((q) => q.name === r.name)) continue;
      { ev(w, r.wet ? `So many ships carry ${GOODS[bg].name} between ${r.a.name} and ${r.b.name} that sailors start calling that water ${r.name}.` : `So many caravans carry ${GOODS[bg].name} between ${r.a.name} and ${r.b.name} that people start calling the way ${r.name}.`, r.a.x, r.a.y, w.cults[r.a.cult].color, same.length ? 1 : 0); discover(w, r.wet ? 'searoute' : 'road-name', r.a.x, r.a.y); } }
  }
  markets(w); tolls(w); pirates(w); leagues(w); dependence(w);
  let tot = 0; for (const r of w.routes.values()) tot += r.n; w.stats.trade = Math.round(tot);
}
const cap = (s) => s[0].toUpperCase() + s.slice(1);

// What a caravan from `a` to `b` carries: the thing a makes that b wants most, by value.
export function pickGoods(w, a, b) {
  if (!a.make || !b.need) return -1; let bg = -1, bs = 0.2;
  for (let g = 0; g < GOODS.length; g++) { if (!a.make[g] || b.make && b.make[g]) continue; const sc = a.make[g] * (0.4 + b.need[g]) * GOODS[g].v * (0.8 + 0.4 * w.rnd()); if (sc > bs) { bs = sc; bg = g; } }
  return bg;
}
// A load arrives. What it does depends on what it is.
export function deliver(w, m) {
  const a = m.from, b = m.to, ca = w.cults[a.cult], cb = w.cults[b.cult], g = m.goods == null ? -1 : m.goods;
  const d = Math.sqrt(wrapDx(a.x - b.x) ** 2 + (a.y - b.y) ** 2), val = (g >= 0 ? GOODS[g].v : 0.5) * (1 + Math.min(3, d / 25)) * (m.toll ? 0.65 : 1);
  const coin = (c) => (c.arts.banking ? 1.8 : c.arts.coinage ? 1.4 : 1); a.wealth = (a.wealth || 0) + val * coin(ca); b.wealth = (b.wealth || 0) + val * 0.6 * coin(cb);
  const key = Math.min(a.id, b.id) + '-' + Math.max(a.id, b.id); let r = w.routes.get(key);
  if (!r) { r = { a, b, n: 0, g: new Float32Array(GOODS.length), wet: !!m.wet0, year: w.year, name: null }; w.routes.set(key, r); }
  r.n += 1; r.last = w.year; if (g >= 0) r.g[g] += 1;
  carryLife(w, a, b, ca, cb, m, g);
  if (g < 0) return;
  (b.imp || (b.imp = {}))[g] = w.year; (a.exp || (a.exp = {}))[g] = w.year;
  (cb.imp || (cb.imp = {}))[g] = w.year;
  const key2 = GOODS[g].key;
  if (key2 === 'grain') b.fed = w.year;
  else if (key2 === 'tin' || key2 === 'copper') { if (!cb.arts.bronze && once(w, 'tinfirst')) ev(w, `${key2 === 'tin' ? 'Tin' : 'Copper'} from ${a.name} reaches ${b.name}, where they have only ${key2 === 'tin' ? 'copper' : 'tin'}. The smiths know what to do with it.`, b.x, b.y, cb.color, 0); }
  else if (key2 === 'horses' && !cb.tame.horse && w.rnd() < 0.25) { cb.tame.horse = w.year; ev(w, `The ${cb.name} buy horses from the ${ca.name}. Within a generation their young men ride.`, b.x, b.y, cb.color, 1); }
  else if (key2 === 'relics') { if (w.mem) w.mem[(b.y * W + b.x) * 6 + (w.rnd() < 0.5 ? 4 : 0)] += 0.05; }
}
// Imports count as owning: a people with copper at home and tin from a far shore can cast bronze,
// for as long as the tin keeps coming.
export function importedMetals(w, c) {
  let bits = 0; const imp = c.imp || {}; if (w.year - (imp[G.copper] ?? -99) < 25) bits |= 2; if (w.year - (imp[G.tin] ?? -99) < 25) bits |= 4; if (w.year - (imp[G.iron] ?? -99) < 25) bits |= 8; if (w.year - (imp[G.gold] ?? -99) < 25) bits |= 16; if (w.year - (imp[G.timber] ?? -99) < 25) bits |= 256; if (G.uranium != null && w.year - (imp[G.uranium] ?? -99) < 25) bits |= 128; return bits;
}

// Where many roads meet, a market grows, and markets grow rich.
function markets(w) {
  const cnt = new Map(); for (const r of w.routes.values()) if (r.n > 1.5) { cnt.set(r.a, (cnt.get(r.a) || 0) + 1); cnt.set(r.b, (cnt.get(r.b) || 0) + 1); }
  const rich = [...cnt.keys()].filter((s) => !s.dead && s.tier >= 2 && cnt.get(s) >= 4).sort((a, b) => b.wealth - a.wealth).slice(0, 6), top = new Set(rich.filter((s) => s.wealth > 30));
  for (const s of w.sets) if (s.market && !top.has(s)) s.market = false;
  for (const [s, n] of cnt) { if (s.dead || s.tier < 2) continue; const was = s.market; s.market = top.has(s); if (s.market && !was && w.year - (s.marketAt || -99) > 80) { s.marketAt = w.year; const c = w.cults[s.cult]; ev(w, once(w, 'market') ? `${s.name} becomes the market of half the world. Every road and sea lane seems to end there.` : `${s.name} grows rich on the roads that meet there.`, s.x, s.y, c.color, w.found.market ? 1 : 0); discover(w, 'market', s.x, s.y); } }
  for (const c of w.cults) { if (!c.alive) continue; c.wealth = 0; } for (const s of w.sets) if (!s.dead) w.cults[s.cult].wealth += s.wealth || 0;
}
// Riders of the grass tax what crosses it. Peace pays; when they are at war, caravans vanish.
function tolls(w) {
  for (const r of w.routes.values()) {
    if (r.wet || r.n < 2) continue; const mx = r.a.x + wrapDx(r.b.x - r.a.x) / 2, my = (r.a.y + r.b.y) / 2; let nomad = null;
    near(w, mx, my, 12, null, false, (s) => { if (!nomad && s.nomad && s.cult !== r.a.cult && s.cult !== r.b.cult && w.cults[s.cult].arts.riding) nomad = s; });
    r.toll = nomad ? nomad.cult : null;
    if (nomad) { const nc = w.cults[nomad.cult]; nomad.wealth = (nomad.wealth || 0) + r.n * 0.4; if (!nc.tolled) { nc.tolled = true; if (r.n > 3) { ev(w, `The ${nc.name} ride out to meet every caravan crossing their grass, and take a tenth of it. Nobody argues.`, nomad.x, nomad.y, nc.color, once(w, 'toll-told') ? 0 : 1); discover(w, 'toll', nomad.x, nomad.y); } } }
  }
}
// Busy sea lanes far from any strong navy grow pirates.
const PNAME = ['the Red Sails', 'the Brethren', 'the Sea Wolves', 'the Lantern Men', 'the Drowned Crown', 'the Grey Fleet'];
function pirates(w) {
  for (const p of w.pirates) {
    let navy = null; for (const s of w.sets) if (!s.dead && s.port && s.tier >= 2 && w.cults[s.cult].arts.sailing && w.cults[s.cult].tech >= 3 && wrapDx(s.x - p.x) ** 2 + (s.y - p.y) ** 2 < 900) { navy = s; break; }
    if (navy && w.rnd() < 0.05) { p.dead = true; ev(w, `The fleets of ${navy.name} hunt down ${p.name}. Their captains hang in the harbour for a season.`, p.x, p.y, w.cults[navy.cult].color, 0); }
    else if (w.year - p.last > 30) { p.dead = true; ev(w, `${cap(p.name)} have not been seen in years. The sea lanes are quiet.`, p.x, p.y, null, 1); }
  }
  w.pirates = w.pirates.filter((p) => !p.dead);
  if (w.pirates.length >= 3 || w.rnd() > 0.05) return;
  for (const r of w.routes.values()) { if (!r.wet || r.n < 6) continue; const x = wx(Math.round(r.a.x + wrapDx(r.b.x - r.a.x) / 2)), y = Math.round((r.a.y + r.b.y) / 2); if (w.pirates.some((p) => wrapDx(p.x - x) ** 2 + (p.y - y) ** 2 < 900)) continue;
    const p = { x, y, name: PNAME[(w.pirateN = (w.pirateN || 0) + 1) % PNAME.length], taken: 0, last: w.year, born: w.year }; w.pirates.push(p); ev(w, `Ships on ${r.name || 'the sea road'} start to go missing. Sailors blame ${p.name}, who answer to no one.`, x, y, null, 0); discover(w, 'pirates', x, y); break; }
}
export function pirateNear(w, m) { if (m.kind !== 'trade') return null; for (const p of w.pirates) if (wrapDx(p.x - m.x) ** 2 + (p.y - m.y) ** 2 < 64) return p; return null; }
// Ports of different peoples that trade with each other heavily band together and stop fighting.
function leagues(w) {
  if (w.year % 10) return;
  const ports = w.sets.filter((s) => !s.dead && s.port && s.market);
  for (const s of ports) {
    const c = w.cults[s.cult]; if (w.leagues.some((L) => L.members.has(c.id))) continue;
    const partners = new Set([c.id]); for (const r of w.routes.values()) { if (!r.wet || r.n < 3) continue; const o = r.a === s ? r.b : r.b === s ? r.a : null; if (o && o.cult !== s.cult && !w.leagues.some((L) => L.members.has(o.cult))) partners.add(o.cult); }
    if (partners.size >= 3) { const L = { name: `the League of ${s.name}`, seat: s, members: partners, born: w.year }; w.leagues.push(L); ev(w, `${s.name} and the ports it trades with swear an oath: no war between them, and one price in every harbour. They call it ${L.name}.`, s.x, s.y, c.color, 0); discover(w, 'league', s.x, s.y); }
  }
  for (const L of w.leagues) { for (const id of [...L.members]) if (!w.cults[id].alive) L.members.delete(id); }
  w.leagues = w.leagues.filter((L) => { if (L.members.size < 2 || L.seat.dead) { ev(w, `${cap(L.name)} breaks up. Every port for itself again.`, L.seat.x, L.seat.y, null, 1); return false; } return true; });
}
export const leagued = (w, a, b) => w.leagues.some((L) => L.members.has(a) && L.members.has(b));
// A people that built its strength on what other people sell it is hostage to the roads.
function dependence(w) {
  for (const c of w.cults) { if (c.power) continue;
    if (!c.alive || !c.big) continue; const imp = c.imp || {}, own = c._ownMetals || 0;
    if (c.arts.bronze && (own & 6) !== 6 && (imp[G.tin] != null || imp[G.copper] != null)) { const cut = w.year - Math.max(imp[G.tin] ?? -99, imp[G.copper] ?? -99) > 30 && !((own & 2) && w.year - (imp[G.tin] ?? -99) < 30) && !((own & 4) && w.year - (imp[G.copper] ?? -99) < 30);
      if (cut && !c.bronzeCut) { c.bronzeCut = w.year; c.coh = Math.max(0.05, c.coh - 0.2); if (c.tinTold) continue; c.tinTold = true; ev(w, `The tin stops coming. The smiths of the ${c.name} melt down old blades to make new ones, and there are fewer every year.`, c.big.x, c.big.y, c.color, c.count >= 20 ? 2 : c.count >= 6 ? 0 : 1); discover(w, 'tinstop', c.big.x, c.big.y); }
      else if (!cut && c.bronzeCut) c.bronzeCut = 0; }
  }
}

// Seed and stock travel with the goods: a grain cargo is a sack of seed, a caravan has animals in
// its train. Partners can take up a crop or a beast that suits their land; a ship that crosses to
// another continent can leave both behind, where they take root or run wild.
const TAME_SP = {}; SPECIES.forEach((sp, k) => { if (sp.tame) TAME_SP[sp.tame] = k; });
function carryLife(w, a, b, ca, cb, m, g) {
  if (ca === cb) return; const rnd = w.rnd, ib = b.y * W + b.x;
  const pc = (g === G.grain ? 0.3 : 0.06);
  if (rnd() < pc) for (const p of ca.cropL || []) { if (hasCrop(cb, p) || w.pSuit[p * N + ib] < 110) continue; giveCrop(w, cb, p, ca); if (!cb.arts.farming && cb.tech >= 1) cb.arts.farming = w.year; break; }
  if (rnd() < (g === G.horses ? 0.3 : 0.05)) for (const k in ca.tame) { if (cb.tame[k] || TAME_SP[k] == null || habRaw(w, TAME_SP[k], ib) < 0.5) continue; cb.tame[k] = w.year; if (!cb.grazer && ['horse', 'cattle', 'goat', 'reindeer', 'camel', 'llama', 'buffalo'].includes(k)) cb.grazer = k; if (once(w, 'stock-' + cb.id + k)) ev(w, `Traders from ${a.name} bring ${k === 'cattle' ? 'cattle' : k + 's'} to ${b.name}. The ${cb.name} keep them.`, b.x, b.y, cb.color, 1); break; }
  // across the sea, life goes ashore
  if (m.wet0 && ca.arts.sailing && w.mass[ib] !== w.mass[a.y * W + a.x] && rnd() < 0.08) {   // only deep-sea ships carry life between continents
    for (const p of ca.cropL || []) if (w.pSuit[p * N + ib] > 110 && plantWild(w, p, b.x, b.y, 3)) break;
    for (const k in ca.tame) if (TAME_SP[k] != null && rnd() < 0.5) { introduce(w, b.x, b.y, TAME_SP[k], `ships from ${a.name}`); break; }
  }
}
