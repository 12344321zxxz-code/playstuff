// Peoples. A band wanders until the place it is in teaches it a way to live: flood plains make
// farmers, coasts make fishers, grass and a tameable beast make herders. Knowledge piles up with
// numbers, cohesion wears down with size and ease, and what falls leaves ruins that the next
// people build on, dig in, or avoid.
import { W, H, N, DISC, clamp, wx, wrapDx, Heap, hash2 } from './core.js';
import { ev, discover, once } from './story.js';
import { SPECIES } from './fauna.js';

export const TECH = [6000, 70000, 420000, 1900000, 8000000];
export const ARTS = ['', 'farming', 'boats and roads', 'writing and stone walls', 'deep-sea sailing', 'smoke and engines'];
export const TIER = ['band', 'village', 'town', 'city'];
export const COLORS = ['#d7263d', '#8e44d6', '#f46d1b', '#f2efe4', '#22201e', '#e040a8', '#ffd400', '#00c2a8', '#7a3b1d', '#ff8fa3', '#3d5afe', '#9bd636', '#00a1e4', '#b56576', '#6d597a', '#e9c46a', '#577590', '#f94144', '#43aa8b', '#bc6c25', '#a2d2ff', '#cdb4db', '#606c38', '#fb8500'];
const MAXS = 760, TAME_GRAZE = { horse: 1, cattle: 1, goat: 1, reindeer: 1, camel: 1 };
export const ORES = ['', 'copper', 'tin', 'iron', 'gold', 'salt'];
const CONS = ['p', 't', 'k', 'b', 'd', 'g', 'm', 'n', 's', 'l', 'r', 'v', 'z', 'h', 'sh', 'ch', 'th', 'y', 'w', 'f', 'kh', 'q'], VOW = ['a', 'e', 'i', 'o', 'u', 'a', 'o', 'ai', 'ou', 'ia', 'e'], ENDS = ['n', 'r', 's', 'l', 'm', 'th', 'k', 'sh', 'd'];
const pickN = (rnd, arr, n) => { const a = arr.slice(), o = []; while (o.length < n && a.length) o.push(a.splice((rnd() * a.length) | 0, 1)[0]); return o; };
const makeLang = (w) => ({ c: pickN(w.rnd, CONS, 7), v: pickN(w.rnd, VOW, 4), e: pickN(w.rnd, ENDS, 3) });
function word(w, L, syl) { let s = ''; for (let k = 0; k < syl; k++) s += L.c[(w.rnd() * L.c.length) | 0] + L.v[(w.rnd() * L.v.length) | 0]; if (w.rnd() < 0.45) s += L.e[(w.rnd() * L.e.length) | 0]; return s[0].toUpperCase() + s.slice(1); }
const placeName = (w, c) => word(w, c.lang, w.rnd() < 0.6 ? 2 : 3);
function cultName(w, L) { let s = word(w, L, w.rnd() < 0.5 ? 1 : 2); const suf = ['i', 'an', 'ari', 'u', 'esh', 'or', 'im', 'a'][(w.rnd() * 8) | 0]; if (/[aeiou]$/.test(s)) s = s.slice(0, -1); return s + suf; }
const EPITHET = { great: ['the Great', 'the Conqueror', 'the Lion'], builder: ['the Builder', 'the Mason'], law: ['the Just', 'the Lawgiver', 'the Wise'], mad: ['the Mad', 'the Cruel', 'the Unready'] };

export const techOf = (k) => { let t = 0; while (t < TECH.length && k >= TECH[t]) t++; return t; };
export const colorOf = (c) => COLORS[c.slot % COLORS.length];

export function newCult(w, parent) {
  const used = new Uint8Array(COLORS.length); for (const c of w.cults) if (c.alive) used[c.slot] = 1;
  let slot = 0; while (slot < COLORS.length - 1 && used[slot]) slot++;
  if (used[slot]) slot = (w.rnd() * COLORS.length) | 0;
  const lang = parent ? { c: parent.lang.c.slice(0, 5).concat(pickN(w.rnd, CONS, 2)), v: parent.lang.v.slice(0, 3).concat(pickN(w.rnd, VOW, 1)), e: parent.lang.e.slice() } : makeLang(w);
  const c = { id: w.cults.length, slot, lang, name: cultName(w, lang), know: parent ? parent.know : 0, tech: parent ? parent.tech : 0, alive: true, count: 0, pop: 0, wit: 0.75 + 0.6 * w.rnd(),
    tame: parent ? Object.assign({}, parent.tame) : {}, metals: 0, bronze: parent ? parent.bronze : false, iron: parent ? parent.iron : false, coh: 0.85, born: w.year, way: parent ? parent.way : 'forage', parent: parent ? parent.name : null, grazer: parent ? parent.grazer : null,
    ruler: null, big: null, flags: parent ? { village: 1, town: parent.flags.town, city: parent.flags.city, road: parent.flags.road } : {}, wins: 0, wonderAt: -999 };
  crown(w, c, true); w.cults.push(c); return c;
}
function crown(w, c, quiet) {
  const r = w.rnd(), trait = r < 0.07 ? 'great' : r < 0.12 ? 'builder' : r < 0.18 ? 'law' : r < 0.23 ? 'mad' : null, nm = word(w, c.lang, 2);
  c.ruler = { name: trait ? `${nm} ${EPITHET[trait][(w.rnd() * EPITHET[trait].length) | 0]}` : nm, trait, until: w.year + 14 + ((w.rnd() * 30) | 0) };
  if (!quiet && trait && c.count >= 9 && c.big) ev(w, trait === 'mad' ? `${c.ruler.name} takes the throne of the ${c.name}. It does not go well.` : `${c.ruler.name} comes to rule the ${c.name}.`, c.big.x, c.big.y, colorOf(c));
}
export function addSet(w, cult, x, y, pop, nomad) {
  const c = w.cults[cult]; x = wx(x);
  const s = { id: w.nextId++, cult, x, y, pop, nomad, tier: nomad ? 0 : 1, maxTier: nomad ? 0 : 1, age: 0, R: 2, links: 0, name: nomad ? null : placeName(w, c), lastFam: -99, lastSack: -99, src: [1, 0, 0, 0, 0], way: 'forage', ores: 0, wonder: 0, plague: 0, immune: 0, dead: false, walls: false, tower: false };
  w.sets.push(s); c.count++; return s;
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
function siteScore(w, x, y, farmer) {
  let sc = 0; for (const o of DISC[2]) { const Y = y + o[1]; if (Y < 1 || Y >= H - 1) continue; const i = Y * W + wx(x + o[0]); if (w.water[i]) { sc += 0.5; continue; }
    sc += 0.6 * w.g[i] + 0.9 * w.t[i] + (farmer ? w.crop[i] + (w.fresh[i] <= 1 ? 0.4 : 0) : 0) + (w.herdAt[i] ? 0.5 : 0) - (w.magic[i] > 0.75 ? 0.6 : 0); }
  return sc;
}

/* ---------- ruins ---------- */
const RUIN_TEXT = { abandoned: 'lies empty. Grass grows in its streets.', sacked: 'is burned to the ground.', drowned: 'is under the water.', buried: 'is buried under ash and stone.', burned: 'is lost to the fire.', plague: 'is a city of the dead.', frozen: 'is under the ice.', overgrown: 'is swallowed by the forest.', crater: 'is gone in a flash of light.', swallowed: 'falls into the earth.', dragon: 'is a dragon’s roost now.' };
const RUIN_PAGE = { drowned: 'drowned', buried: 'buried', overgrown: 'overgrown', frozen: 'frozen' };
export function endSet(w, s, kind) {
  if (s.dead) return; s.dead = true; w.anyDead = true; const c = w.cults[s.cult];
  if (s.maxTier >= 2 || (s.maxTier >= 1 && kind !== 'abandoned')) {
    w.ruins.push({ x: s.x, y: s.y, name: s.name, cult: c.name, year: w.year, kind, know: c.know, tier: s.maxTier, looted: false, wonder: s.wonder });
    if (w.ruins.length > 500) w.ruins.shift();
    if (s.maxTier >= 2 || kind !== 'abandoned') ev(w, `${s.name} ${RUIN_TEXT[kind] || RUIN_TEXT.abandoned}`, s.x, s.y, colorOf(c), s.maxTier < 2 && kind === 'abandoned');
    if (s.maxTier >= 2) discover(w, 'ruin', s.x, s.y); if (RUIN_PAGE[kind]) discover(w, RUIN_PAGE[kind], s.x, s.y);
  } else if (!s.name && kind !== 'abandoned' && kind !== 'absorbed') ev(w, `A band of the ${c.name} is lost.`, s.x, s.y, colorOf(c), true);
  for (const o of DISC[Math.min(10, s.R + 1)]) { const y = s.y + o[1]; if (y < 0 || y >= H) continue; const i = y * W + wx(s.x + o[0]); if (w.owner[i] === s._k) { w.farm[i] = 0; w.urban[i] = 0; } }
  if (c.big === s) c.big = null;
}

/* ---------- the year ---------- */
function territory(w) {
  const { owner, ocult, ownD, sets, urban } = w; owner.fill(-1); ocult.fill(-1); ownD.fill(1e9); urban.fill(0);
  for (let k = 0; k < sets.length; k++) {
    const s = sets[k]; s._k = k; if (s.dead) continue; if (s.nomad) { s.R = w.cults[s.cult].way === 'herd' ? 3 : 2; continue; }
    const R = (s.R = Math.min(9, 2 + Math.floor(Math.sqrt(s.pop) / 7))), bias = s.pop * 0.0015, slot = w.cults[s.cult].slot;
    for (const o of DISC[R]) { const y = s.y + o[1]; if (y < 0 || y >= H) continue; const i = y * W + wx(s.x + o[0]), d = o[2] * o[2] - bias; if (d < ownD[i]) { ownD[i] = d; owner[i] = k; ocult[i] = slot; } }
    if (s.tier >= 2) { const ur = s.tier === 3 ? (s.pop > 2500 ? 2 : 1) : 0; for (const o of DISC[ur]) { const y = s.y + o[1]; if (y < 0 || y >= H) continue; const i = y * W + wx(s.x + o[0]); if (!w.water[i]) urban[i] = 1; } }
  }
}
function crossesWater(w, x0, y0, x1, y1) { let c = 0; const dx = wrapDx(x1 - x0); for (let k = 1; k < 14; k++) { const x = wx(Math.round(x0 + (dx * k) / 14)), y = Math.round(y0 + ((y1 - y0) * k) / 14); if (w.water[y * W + x] === 1) c++; } return c; }

export function peopleYear(w) {
  buildGrid(w); territory(w);
  const sets = w.sets, n0 = sets.length, rnd = w.rnd, { water, river, herdAt, farm, gCap, soil, g, t, fresh, owner, fireT, ore, mi, crop } = w, sea = w.params.sea;
  for (const c of w.cults) { c.count = 0; c.pop = 0; c.big = null; c._metals = 0; c._ways = { forage: 0, farm: 0, fish: 0, herd: 0, hunt: 0 }; }
  let total = 0, smoke = 0;
  for (let k = 0; k < n0; k++) {
    const s = sets[k]; if (s.dead) continue; const c = w.cults[s.cult], tech = c.tech, i0 = s.y * W + s.x; s.age++;
    if (water[i0] === 1) { endSet(w, s, 'drowned'); continue; }
    if (w.lava[i0]) { endSet(w, s, 'buried'); continue; }
    if (w.ice[i0] && !s.nomad) { endSet(w, s, 'frozen'); continue; }
    if (fireT[i0]) s.pop *= 0.9;
    const herder = !!c.grazer;
    let wildF = 0, fishC = 0, farmF = 0, farms = 0, bestI = -1, bestK = 0.25, huntLeft = Math.min(s.pop, 150) * 0.03, hunt = 0, past = 0, ores = 0;
    for (const o of DISC[s.R]) {
      const y = s.y + o[1]; if (y < 0 || y >= H) continue; const i = y * W + wx(s.x + o[0]);
      if (!s.nomad && owner[i] !== k) continue;
      if (water[i]) { fishC += water[i] === 2 ? 1.2 : 1; continue; }
      if (river[i]) fishC += 0.4 * river[i];
      if (ore[i]) ores |= 1 << ore[i];
      const hk = herdAt[i];
      if (hk) { const hd = w.herds[hk - 1]; if (hd && hd.n > 0) { const sp = SPECIES[hd.sp];
          if (huntLeft > 0) { const take = Math.min(hd.n * 0.15, huntLeft / sp.meat); hd.n -= take; huntLeft -= take * sp.meat; hunt += take * sp.meat; }
          if (sp.tame && !c.tame[sp.tame] && c.know > 1500 && rnd() < 0.012) { c.tame[sp.tame] = w.year; if (TAME_GRAZE[sp.tame] && !c.grazer) c.grazer = sp.tame; if (once(w, 'tame' + sp.tame)) ev(w, `The ${c.name} tame the ${sp.tame === 'cattle' ? 'aurochs' : sp.tame === 'pig' ? 'boar' : sp.tame}. Others will learn it from them.`, s.x, s.y, colorOf(c)); } } }
      if (farm[i]) { farms++; const irr = fresh[i] <= (tech >= 2 ? 2 : 1); farmF += Math.min(1, crop[i] + (irr ? 0.5 : 0)) * Math.min(1, soil[i]);
        if (!(fresh[i] <= 1 && river[i] >= 0 && mi[i] > 0.3)) { const sh = t[i + 1] > 0.3 || t[i - 1] > 0.3 || t[i + W] > 0.3 || t[i - W] > 0.3; soil[i] -= (tech >= 3 ? 0.0018 : 0.0042) * (sh ? 1 : 2) + (irr && mi[i] < 0.3 ? 0.002 : 0); if (soil[i] < 0.42) farm[i] = 0; } }
      else { wildF += 0.6 * g[i] + 0.9 * t[i]; if (herder) { past += g[i]; if (s.pop > 60) g[i] *= 0.988; }
        const irr = fresh[i] <= (tech >= 2 ? 2 : 1), kk = Math.min(1, crop[i] + (irr ? 0.5 : 0)) * Math.min(1, soil[i]) - 0.2 * t[i];
        if (kk > bestK && soil[i] > 0.75 && w.h[i] - sea < 0.34 && !fireT[i] && i !== i0 && w.magic[i] < 0.7) { bestK = kk; bestI = i; } }
    }
    s.ores = ores; c._metals |= ores;
    const yieldF = 12 * (1 + 0.22 * Math.max(0, tech - 1)) * (c.tame.cattle ? 1.15 : 1) * (c.iron ? 1.1 : 1) * (tech >= 5 ? 1.5 : 1);
    const fW = wildF * (s.nomad ? 3.2 : 1.1), fH = hunt * 6, fF = Math.min(fishC * (tech >= 2 ? 2.4 : 1.5), s.pop * 0.9 + 10), fA = farmF * yieldF, fP = herder ? past * (s.nomad ? 3.4 : 2) * (c.tame.horse ? 1.15 : 1) : 0;
    let food = (fW + fH + fF + fA + fP) * (1 + 0.07 * Math.min(4, s.links)) * (c.tame.pig ? 1.05 : 1) * (s.plague > 0 ? 0.8 : 1); s.src = [fW, fH, fF, fA, fP];
    const mx = Math.max(fW, fH, fF, fA, fP); s.way = mx === fA ? 'farm' : mx === fP ? 'herd' : mx === fF ? 'fish' : mx === fH ? 'hunt' : 'forage'; c._ways[s.way] += s.pop;
    if (!s.nomad && tech >= 1 && bestI >= 0 && farms < Math.ceil((s.pop * 1.3) / (yieldF * 0.6))) { farm[bestI] = 1; t[bestI] = 0; g[bestI] = 0.25; }
    const cap = Math.max(1, food);
    if (s.pop < cap) s.pop += s.pop * 0.036 * (1 - s.pop / cap);
    else { const loss = (s.pop - cap) * 0.18; if (loss > s.pop * 0.07 && s.tier >= 2 && w.year - s.lastFam > 60) { s.lastFam = w.year; ev(w, `Hunger thins the people of ${s.name}.`, s.x, s.y, colorOf(c), true); } s.pop -= loss; }
    if (s.plague > 0) { s.pop *= 0.8; s.plague--; if (s.plague === 0) s.immune = 60; w.plagueNow = (w.plagueNow || 0) + 1;
      near(w, s.x, s.y, 12, s, false, (o) => { if (!o.plague && !o.immune && rnd() < (o.cult === s.cult ? 0.22 : 0.1)) { o.plague = 3; } }); } else if (s.immune > 0) s.immune--;
    if (s.pop < 5) { endSet(w, s, s.plague > 0 || s.immune > 55 ? 'plague' : 'abandoned'); continue; }
    c.know += s.pop * c.wit * (1 + 0.25 * Math.min(4, s.links)) * (s.tower ? 1.6 : 1); c.count++; c.pop += s.pop; total += s.pop; if (!c.big || s.pop > c.big.pop) c.big = s; if (tech >= 5) smoke += s.pop;
    if (s.nomad) nomadStep(w, s, c, tech); else townStep(w, s, c, tech);
  }
  if (w.anyDead) { w.sets = sets.filter((s) => !s.dead); w.anyDead = false; buildGrid(w); territory(w); }
  let alive = 0;
  for (const c of w.cults) {
    if (!c.alive) continue;
    if (c.count === 0) { if (!w.sets.some((s) => s.cult === c.id)) { c.alive = false; ev(w, `The ${c.name} are gone from the world.`, null, null, colorOf(c)); } continue; }
    alive++; cultYear(w, c);
  }
  // ruins: dug up, built over, slowly charged with something else
  for (const r of w.ruins) {
    const i = r.y * W + r.x; if (w.magic[i] < 1) w.magic[i] = Math.min(1, w.magic[i] + 0.0022 * (r.tier >= 3 ? 1.6 : 1));
    if (r.kind !== 'drowned' && water[i] === 1) { r.kind = 'drowned'; discover(w, 'drowned', r.x, r.y); }
    if (!r.looted && r.kind !== 'drowned' && rnd() < 0.03) { const s = near(w, r.x, r.y, 8, null, true); if (s) { const c = w.cults[s.cult]; if (c.know < r.know * 0.9) { c.know += (r.know - c.know) * 0.35; r.looted = true; ev(w, `Diggers from ${s.name} find old writings in the ruins of ${r.name}.`, r.x, r.y, colorOf(c)); discover(w, 'relic', r.x, r.y); } } }
    if (w.magic[i] > 0.8 && w.year - r.year > 250 && !r.haunt) { r.haunt = true; if (discover(w, 'haunt', r.x, r.y)) ev(w, `No one goes near the ruins of ${r.name} any more.`, r.x, r.y, null); }
  }
  if (smoke > 0) { w.greenhouse = Math.min(9, (w.greenhouse || 0) + smoke * 2.2e-7); if (!w.found.smoke) { const c = w.cults.find((q) => q.alive && q.tech >= 5); if (c && c.big) discover(w, 'smoke', c.big.x, c.big.y); } }
  if ((w.plagueNow || 0) >= 5) { const s = w.sets.find((q) => q.plague > 0); if (s) discover(w, 'plague', s.x, s.y); } w.plagueNow = 0;
  w.stats.people = Math.round(total); w.stats.places = w.sets.length; w.stats.peoples = alive;
  if (w.year % 6 === 0) roads(w);
}

function cultYear(w, c) {
  const rnd = w.rnd, b = c.big;
  // way of life
  let way = 'forage', mx = 0; for (const k in c._ways) if (c._ways[k] > mx) { mx = c._ways[k]; way = k; }
  if (way !== c.way) { c.way = way; if (b && c.count >= 3) { if (way === 'herd' && c.tame.horse) { if (discover(w, 'riders', b.x, b.y)) ev(w, `The ${c.name} live in the saddle now.`, b.x, b.y, colorOf(c)); } else if (way === 'herd') discover(w, 'herders', b.x, b.y); else if (way === 'fish' && c.tech >= 1) discover(w, 'sea', b.x, b.y); } }
  // knowledge
  const t = techOf(c.know);
  if (t > c.tech) { c.tech++; const first = once(w, 'art' + c.tech); ev(w, first ? `The ${c.name} are the first to learn ${ARTS[c.tech]}.` : `The ${c.name} learn ${ARTS[c.tech]}.`, b ? b.x : null, b ? b.y : null, colorOf(c), !first); }
  // metals
  const m = c._metals;
  if (!c.bronze && c.tech >= 2 && (m & 2) && (m & 4)) { c.bronze = true; ev(w, `The ${c.name} have copper and tin both. They make bronze.`, b.x, b.y, colorOf(c)); discover(w, 'bronze', b.x, b.y); }
  if (!c.iron && c.tech >= 3 && (m & 8)) { c.iron = true; ev(w, `The ${c.name} learn to work iron.`, b.x, b.y, colorOf(c)); discover(w, 'iron', b.x, b.y); }
  c.gold = !!(m & 16);
  // rulers
  if (w.year >= c.ruler.until) crown(w, c);
  // cohesion: young, small and pressed peoples hold together; big, old, easy ones come apart
  const tr = c.ruler.trait, target = clamp(1.05 - c.count / 46 - (w.year - c.born) / 2600 + (tr === 'law' ? 0.25 : tr === 'great' ? 0.2 : tr === 'mad' ? -0.35 : 0) + Math.min(0.2, c.wins * 0.04), 0.05, 1);
  c.coh += (target - c.coh) * 0.03; c.wins *= 0.97;
  if (c.count >= 25 && b && !c.flags.empire) { c.flags.empire = 1; ev(w, `The ${c.name} rule from ${b.name} over ${c.count} towns and villages.`, b.x, b.y, colorOf(c)); discover(w, 'empire', b.x, b.y); }
  if (b && c.count >= 8 && rnd() < (c.coh < 0.3 ? 0.035 : c.coh < 0.45 ? 0.008 : 0.0008)) { if (c.coh < 0.22 && c.count >= 10) collapse(w, c); else schism(w, c); }
  // wonders
  if (b && b.tier === 3 && b.pop > 1500 && !b.wonder && w.year - c.wonderAt > 180 && (c.gold || c.coh > 0.6 || tr === 'builder') && rnd() < 0.03) {
    b.wonder = 1 + ((rnd() * 4) | 0); c.wonderAt = w.year; c.coh = Math.min(1, c.coh + 0.1);
    ev(w, `${b.name} raises ${['', 'a great pyramid', 'a colossus', 'a temple the size of a hill', 'a lighthouse seen from a day away'][b.wonder]}.`, b.x, b.y, colorOf(c)); discover(w, 'wonder', b.x, b.y);
  }
}
function alive(w) { let n = 0; for (const c of w.cults) if (c.alive) n++; return n; }
function schism(w, c) {
  if (alive(w) >= 20 || !c.big) return; let far = null, fd = 0;
  for (const s of w.sets) { if (s.cult !== c.id || s.nomad) continue; const d = wrapDx(s.x - c.big.x) ** 2 + (s.y - c.big.y) ** 2; if (d > fd) { fd = d; far = s; } }
  if (!far || fd < 16 * 16) return; const nc = newCult(w, c); let n = 0;
  for (const s of w.sets) { if (s.cult !== c.id) continue; if (wrapDx(s.x - far.x) ** 2 + (s.y - far.y) ** 2 < wrapDx(s.x - c.big.x) ** 2 + (s.y - c.big.y) ** 2) { s.cult = nc.id; n++; } }
  nc.count = n; nc.coh = 0.9; c.coh = Math.min(1, c.coh + 0.2);
  const dx = wrapDx(far.x - c.big.x), dy = far.y - c.big.y, dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'eastern' : 'western') : dy > 0 ? 'southern' : 'northern';
  ev(w, `The ${dir} ${TIER[Math.max(1, far.tier)]}s of the ${c.name} break away. They call themselves the ${nc.name}.`, far.x, far.y, colorOf(nc), n < 6); discover(w, 'schism', far.x, far.y);
}
function collapse(w, c) {
  const b = c.big, old = c.tech; ev(w, `The realm of the ${c.name} comes apart. ${b.name} cannot hold it.`, b.x, b.y, colorOf(c));
  for (let k = 0; k < 3 && alive(w) < 20; k++) schism(w, c);
  for (const s of w.sets) if (s.cult === c.id && !s.nomad) { s.pop *= 0.55 + 0.3 * w.rnd(); if (s !== b && s.tier >= 2 && w.rnd() < 0.18) endSet(w, s, 'abandoned'); }
  if (old >= 2 && w.rnd() < 0.7) { c.know = TECH[old - 1] * 0.55; c.tech = techOf(c.know); c.bronze = c.bronze && c.tech >= 2; c.iron = c.iron && c.tech >= 3; ev(w, `The ${c.name} forget ${ARTS[old]}.`, b.x, b.y, colorOf(c)); discover(w, 'darkage', b.x, b.y); }
  c.coh = 0.7; c.born = w.year; c.flags.empire = 0;
}

function nomadStep(w, s, c, tech) {
  const rnd = w.rnd, herder = !!c.grazer;
  if (s.age > 3 && (tech >= 1 || (c.know > 2500 && s.src[2] > s.src[0] + s.src[1] + s.src[4])) && !(herder && tech < 3 && s.src[4] > s.src[3] * 1.5 && s.src[2] < s.src[4])) {
    let sk = 0, cnt = 0, seaN = 0; for (const o of DISC[2]) { const y = s.y + o[1]; if (y < 1 || y >= H - 1) continue; const i = y * W + wx(s.x + o[0]); if (w.water[i]) { seaN++; continue; } sk += w.crop[i] + (w.fresh[i] <= 1 ? 0.3 : 0); cnt++; }
    if (cnt >= 6 && ((tech >= 1 && sk / cnt > 0.4) || seaN >= 4) && !near(w, s.x, s.y, 6, s, true) && w.magic[s.y * W + s.x] < 0.7) {
      s.nomad = false; s.tier = 1; s.maxTier = 1; s.age = 0;
      const ru = w.ruins.find((r) => Math.abs(wrapDx(r.x - s.x)) <= 2 && Math.abs(r.y - s.y) <= 2 && r.kind !== 'drowned');
      if (ru) { s.name = 'New ' + ru.name.replace(/^New /, ''); discover(w, 'reborn', s.x, s.y); } else s.name = placeName(w, c);
      if (!c.flags.village) { c.flags.village = 1; ev(w, `The ${c.name} put down roots at ${s.name}${seaN >= 4 && tech < 1 ? ', a fishing camp that stayed' : ', their first village'}.`, s.x, s.y, colorOf(c), !once(w, 'village')); discover(w, 'village', s.x, s.y); }
      return;
    }
  }
  if (rnd() < 0.6) { let best = siteScore(w, s.x, s.y, tech >= 1) * 1.08, bx = s.x, by = s.y; const D = DISC[herder ? 5 : 3];
    for (let q = 0; q < 5; q++) { const o = D[(rnd() * D.length) | 0], x = wx(s.x + o[0]), y = s.y + o[1]; if (y < 2 || y >= H - 2) continue; const i = y * W + x; if (w.water[i] || w.h[i] - w.params.sea > 0.4 || w.ice[i]) continue;
      let sc = siteScore(w, x, y, tech >= 1) * (0.9 + 0.2 * rnd()); if (near(w, x, y, 4, s)) sc *= 0.4; if (sc > best) { best = sc; bx = x; by = y; } }
    s.x = bx; s.y = by; }
  const cap = herder ? 150 : 46;
  if (s.pop > cap && (tech < 1 || herder) && c.count < (herder ? 34 : 14) && w.sets.length < MAXS) { const D = DISC[4]; for (let q = 0; q < 6; q++) { const o = D[(rnd() * D.length) | 0], x = wx(s.x + o[0]), y = s.y + o[1]; if (y < 2 || y >= H - 2 || w.water[y * W + x]) continue; const half = Math.round(s.pop * 0.45); s.pop -= half; addSet(w, s.cult, x, y, half, true); break; } }
  if (tech >= 1 && !herder && s.age > 25 && rnd() < 0.04) { const b = near(w, s.x, s.y, 14, s, true); if (b && b.cult === s.cult) { b.pop += s.pop; s.dead = true; w.anyDead = true; return; } }
  if (herder && s.pop > 90 && rnd() < (c.tame.horse ? 0.06 : 0.02)) conflict(w, s, c, tech);
}

function townStep(w, s, c, tech) {
  const rnd = w.rnd, nt = s.pop >= 700 ? 3 : s.pop >= 150 ? 2 : 1;
  if (nt > s.tier) { s.tier = nt; if (nt > s.maxTier) { s.maxTier = nt;
      if (nt === 2 && !c.flags.town) { c.flags.town = 1; ev(w, `${s.name} grows into the first town of the ${c.name}.`, s.x, s.y, colorOf(c), !once(w, 'town')); }
      else if (nt === 3) { ev(w, c.flags.city ? `${s.name} is now a city of the ${c.name}.` : `${s.name} becomes the first city of the ${c.name}.`, s.x, s.y, colorOf(c), !once(w, 'city')); c.flags.city = 1; discover(w, 'city', s.x, s.y); if (w.river[s.y * W + s.x] >= 3 || w.fresh[s.y * W + s.x] <= 1 && s.way === 'farm') discover(w, 'river', s.x, s.y); } } }
  else if (nt < s.tier && s.pop < (s.tier === 3 ? 500 : 100)) s.tier = nt;
  if (tech >= 3 && s.tier >= 2) s.walls = true;
  if (!s.tower && tech >= 3 && s.tier >= 2 && w.magic[s.y * W + s.x] > 0.55 && rnd() < 0.02) { s.tower = true; ev(w, `A tower goes up at ${s.name}, where the air hums. Nobody admits to building it.`, s.x, s.y, colorOf(c)); discover(w, 'tower', s.x, s.y); }
  if (s.pop > 95 && s.age > 14 && w.sets.length < MAXS && rnd() < 0.034) colonize(w, s, c, tech);
  if (s.pop > 60 && rnd() < 0.035 * (c.ruler.trait === 'great' ? 2.2 : 1)) conflict(w, s, c, tech);
  if (s.tier === 3 && s.links >= 2 && !s.plague && !s.immune && rnd() < 0.0009) { s.plague = 3; ev(w, `Plague breaks out in ${s.name}.`, s.x, s.y, colorOf(c), s.pop < 2500); }
}

function colonize(w, s, c, tech) {
  const rnd = w.rnd, maxD = tech >= 4 ? 70 : tech >= 2 ? 22 : 12; let best = null, bs = 3.2; const sea = w.params.sea;
  for (let q = 0; q < 12; q++) {
    const far = tech >= 4 && q < 3, a = rnd() * 6.2832, d = far ? 26 + rnd() * (maxD - 26) : 6 + rnd() * (Math.min(maxD, 22) - 6), x = wx(Math.round(s.x + Math.cos(a) * d)), y = Math.round(s.y + Math.sin(a) * d * 0.8); if (y < 3 || y >= H - 3) continue; const i = y * W + x;
    if (w.water[i] || w.h[i] - sea > 0.36 || w.gCap[i] < 0.28 || w.ice[i] || w.magic[i] > 0.75 || near(w, x, y, 7.5, null, true)) continue;
    const wet = crossesWater(w, s.x, s.y, x, y); if (wet > 1 && tech < 2) continue; if (wet > 5 && tech < 4) continue;
    let sc = 0; for (const o of DISC[2]) { const yy = y + o[1]; if (yy < 0 || yy >= H) continue; const j = yy * W + wx(x + o[0]); sc += w.water[j] ? 0.2 : 0.35 * w.gCap[j] + 0.8 * w.crop[j] + (w.fresh[j] <= 1 ? 0.4 : 0); }
    if (w.ruins.some((r) => Math.abs(wrapDx(r.x - x)) <= 2 && Math.abs(r.y - y) <= 2 && !r.haunt && r.kind !== 'drowned')) sc += 2;
    sc *= 0.85 + 0.3 * rnd(); if (sc > bs) { bs = sc; best = { x, y, wet, far: w.mass[i] !== w.mass[s.y * W + s.x] }; }
  }
  if (!best) return; s.pop -= 26; let cult = s.cult;
  const ocean = best.wet > 5;
  if (alive(w) < 20 && rnd() < (ocean ? 0.4 : best.wet > 1 ? 0.12 : 0.02)) { const nc = newCult(w, c); cult = nc.id; ev(w, `Settlers from ${s.name} cross ${best.wet > 1 ? 'the water' : 'the hills'} and call themselves the ${nc.name}.`, best.x, best.y, colorOf(nc), !ocean); }
  const v = addSet(w, cult, best.x, best.y, 26, false);
  const ru = w.ruins.find((r) => Math.abs(wrapDx(r.x - v.x)) <= 2 && Math.abs(r.y - v.y) <= 2 && r.kind !== 'drowned');
  if (ru) { v.name = 'New ' + ru.name.replace(/^New /, ''); if (discover(w, 'reborn', v.x, v.y)) ev(w, `${v.name} rises on the stones of the old city.`, v.x, v.y, colorOf(w.cults[cult])); }
  if (ocean && best.far && (w.massSize[w.mass[best.y * W + best.x]] || 0) > 150 && discover(w, 'oversea', best.x, best.y)) ev(w, `Ships of the ${c.name} cross the open sea and land ${whereAbouts(w, best.x, best.y)}.`, best.x, best.y, colorOf(c));
}

export function strength(c, s) { return s.pop * (1 + 0.2 * c.tech) * (c.bronze ? 1.3 : 1) * (c.iron ? 1.45 : 1) * (c.tame.horse ? 1.3 : 1) * (0.55 + 0.9 * c.coh) * (c.ruler.trait === 'great' ? 1.4 : c.ruler.trait === 'mad' ? 0.8 : 1); }
function conflict(w, s, c, tech) {
  const rnd = w.rnd, reach = s.R + 4 + (c.tame.horse ? 7 : 0) + (s.nomad ? 4 : 0); let o = null, bd = 1e9;
  near(w, s.x, s.y, reach + 9, s, false, (u, q) => { if (u.cult === s.cult) return; const lim = (reach + u.R) ** 2; if (q < lim && q < bd) { bd = q; o = u; } });
  if (!o) return; const oc = w.cults[o.cult];
  if (oc.know > c.know) c.know += (oc.know - c.know) * 0.02; else oc.know += (c.know - oc.know) * 0.02;
  for (const k in oc.tame) if (!c.tame[k] && rnd() < 0.1) { c.tame[k] = w.year; if (TAME_GRAZE[k] && !c.grazer) c.grazer = k; }
  if (rnd() < (s.nomad ? 0.25 : 0.5)) return;
  if (o.nomad) { if (o.pop < s.pop * 0.5 && !s.nomad) { s.pop += o.pop * 0.5; endSet(w, o, 'absorbed'); } return; }
  const A = strength(c, s) * (0.6 + 0.8 * rnd()), B = strength(oc, o) * (o.walls ? 1.6 : 1.2) * (0.6 + 0.8 * rnd());
  if (A > B) { o.pop *= 0.7; s.pop = s.pop * 0.95 + (s.nomad ? o.pop * 0.05 : 0); c.wins++; oc.coh = Math.max(0.05, oc.coh - 0.03);
    if (s.nomad || (c.ruler.trait === 'mad' && rnd() < 0.5)) { if (o.pop < s.pop * 0.6 && rnd() < 0.45) { endSet(w, o, 'sacked'); return; } if (o.tier >= 2 && w.year - o.lastSack > 30) { o.lastSack = w.year; ev(w, `Riders of the ${c.name} sack ${o.name}.`, o.x, o.y, colorOf(c), o.tier < 3); } return; }
    if (o.pop < s.pop * 0.45 && w.year - o.lastSack > 40) { o.lastSack = w.year; const wasCap = oc.big === o; o.cult = s.cult; ev(w, wasCap && oc.count > 3 ? `${o.name}, seat of the ${oc.name}, falls to the ${c.name}.` : `${o.name} falls to the ${c.name}.`, o.x, o.y, colorOf(c), o.tier < 3 && !wasCap); if (wasCap) oc.coh = Math.max(0.05, oc.coh - 0.25); }
    else if (o.tier >= 2 && w.year - o.lastSack > 30) { o.lastSack = w.year; ev(w, `Warriors from ${s.name || 'the ' + c.name} sack ${o.name}.`, o.x, o.y, colorOf(c), o.tier < 3); }
  } else { s.pop *= 0.85; oc.wins += 0.5; }
}

/* ---------- roads ---------- */
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
  for (const [key, L] of w.links) if (L.a.dead || L.b.dead || L.a.cult !== L.b.cult) { for (const i of L.path) if (w.road[i] > 0) w.road[i]--; w.links.delete(key); }
  for (const s of w.sets) s.links = 0; for (const L of w.links.values()) { L.a.links++; L.b.links++; }
  let budget = 4;
  for (const s of w.sets) {
    if (budget <= 0) break; if (s.nomad || s.dead || s.links >= 3) continue; const c = w.cults[s.cult]; if (c.tech < 2) continue;
    let o = null, bd = 18 * 18 + 1;
    near(w, s.x, s.y, 18, s, true, (u, q) => { if (u.cult !== s.cult || u.links >= 4 || q >= bd) return; const key = Math.min(s.id, u.id) + '-' + Math.max(s.id, u.id); if (w.links.has(key) || (s.noPath && s.noPath.has(u.id))) return; bd = q; o = u; });
    if (!o) continue; budget--; const path = findPath(w, s, o); if (!path) { (s.noPath || (s.noPath = new Set())).add(o.id); continue; }
    for (const i of path) if (w.road[i] < 250) w.road[i]++; w.links.set(Math.min(s.id, o.id) + '-' + Math.max(s.id, o.id), { a: s, b: o, path }); s.links++; o.links++; w.roadStamp = (w.roadStamp || 0) + 1;
    if (!c.flags.road) { c.flags.road = 1; if (once(w, 'road')) ev(w, `A road now runs between ${s.name} and ${o.name}, the first in the world.`, s.x, s.y, colorOf(c)); }
  }
}

/* ---------- start, and the god's hand ---------- */
export function initPeople(w, n) {
  w.sets = []; w.cults = []; w.ruins = []; w.links = new Map(); w.nextId = 1; w.greenhouse = 0; buildGrid(w);
  const got = []; n = n == null ? 6 : n;
  for (let b = 0; b < n; b++) {
    let best = -1, bs = -1;
    for (let q = 0; q < 500; q++) { const i = (w.rnd() * N) | 0, x = i % W, y = (i / W) | 0; if (y < 8 || y > H - 9 || w.water[i] || w.gCap[i] < 0.45 || w.h[i] - w.params.sea > 0.3 || w.ice[i]) continue;
      let ok = true; for (const g of got) if (wrapDx(g.x - x) ** 2 + (g.y - y) ** 2 < 50 * 50) ok = false; if (!ok) continue;
      const sc = siteScore(w, x, y, true) + (w.fresh[i] < 3 ? 2 : 0) + w.rnd() * 3 + (got.some((g) => w.mass[g.y * W + g.x] === w.mass[i]) ? 0 : 3); if (sc > bs) { bs = sc; best = i; } }
    if (best < 0) continue; const c = newCult(w, null), s = addSet(w, c.id, best % W, (best / W) | 0, 20 + Math.round(w.rnd() * 12), true); got.push(s);
  }
  buildGrid(w);
}
export function addBand(w, x, y) {
  x = wx(Math.round(x)); y = clamp(Math.round(y), 2, H - 3); if (w.water[y * W + x] || w.sets.length >= MAXS) return null;
  const c = newCult(w, null); addSet(w, c.id, x, y, 28, true); buildGrid(w);
  ev(w, `A new people, the ${c.name}, wake ${whereAbouts(w, x, y)}.`, x, y, colorOf(c)); return c;
}
