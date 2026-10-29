// Peoples. A band wanders until the place it is in teaches it a way to live: flood plains make
// farmers, cold coasts make fishers, grass and a tameable beast make herders. What a people can
// learn depends on what is around them: no boats without a shore, no bronze without both ores,
// no riders without horses. Knowledge piles up with numbers and travels with trade; cohesion
// wears down with size and ease; and what falls leaves ruins the next people build on.
import { hubYear, hubPush, hubReset, HUB } from './hub.js';
import { captureYear, subjugate, release } from './capture.js';
import { empireYear, regionSuccessors } from './empire.js';
import { frontierYear, termsBetween, nomadic, bandCap } from './frontier.js';
import { relicsYear, newHouse, crownGoal, claimGoal } from './relics.js';
import { powersYear as greatPowersYear } from './greatpowers.js';
import { word, makeSound, rootTags, tagFrom, soundOf, tonguesYear, tongueGap, cultureOf } from './tongues.js';
import { record, triggerOf, tally } from './ledger.js';
import { atWar, newConflict, joinConflict, conflictOf, sideOf, leaveConflict, closeConflict, truceLeft, truceYears, setTruce, tidyWars, pickAim, aimText, warsYear, bleed, mobBudget } from './war.js';
import { POWER, POWER_TOWN } from './registry.js';
import { W, H, N, DISC, clamp, wx, wrapDx, Heap , peopleText } from './core.js';
import { ev, discover, once } from './story.js';
import { SPECIES, takeGame, habRaw as habitat, introduce } from './fauna.js';
import { wetAt } from './weather.js';
import { catchFish } from './sea.js';
import { send, arrive, onRoad } from './movers.js';
import { planLand, planSea, legCells, stepOf, relayAt, clearRelay, seaLane, landPath } from './travel.js';
export { send };
import { holySite, carry, convert, faithYear, sameFaith, tenetOf, docsOf } from './faith.js';
import { pickGoods, deliver, importedMetals, leagued, G as GD, GOODS } from './trade.js';
import { ART, ART_KEYS, TECH, techOf, canLearn, nextInvention, warMult, wallsAgainst, carriersFor, boomOf } from './tech.js';
export { ART, TECH, techOf };
import { wallBetween } from './works.js';
import { ignite } from './life.js';
import { remember, DEATH, WILD, FIRE, DEEP, FAITH, FROST, memAt, stanceYear, RUIN_KIND } from './memory.js';
import { breakPacts } from './spirits.js';
import { deadConquest, corpses } from './dead.js';
import { PLANTS, NP, cropYield, hasCrop, giveCrop, livestock, plantWild } from './origins.js';

export const TIER = ['band', 'village', 'town', 'city'];
export const COLORS = ['#d7263d', '#8e44d6', '#f46d1b', '#f2efe4', '#22201e', '#e040a8', '#ffd400', '#00c2a8', '#7a3b1d', '#ff8fa3', '#3d5afe', '#9bd636', '#00a1e4', '#b56576', '#6d597a', '#e9c46a', '#577590', '#f94144', '#43aa8b', '#bc6c25', '#a2d2ff', '#cdb4db', '#606c38', '#fb8500'];
export const ORES = ['', 'copper', 'tin', 'iron', 'gold', 'salt', 'coal', 'uranium'];
export const WAR_RATE = 8;   /* (Oct 29) how often realms go to war, tuned to the turnover of land in history */
const MAXS = 520, MAXB = 420, MAXC = 30, TAME_GRAZE = { horse: 1, cattle: 1, goat: 1, reindeer: 1, camel: 1, llama: 1, buffalo: 1 };
const placeName = (w, c) => word(w, c.lang, w.rnd() < 0.6 ? 2 : 3);
function cultName(w, L) { let s = word(w, L, w.rnd() < 0.5 ? 1 : 2); const suf = ['i', 'an', 'ari', 'u', 'esh', 'or', 'im', 'a'][(w.rnd() * 8) | 0]; if (/[aeiou]$/.test(s)) s = s.slice(0, -1); return s + suf; }
const EPITHET = { great: ['the Great', 'the Conqueror', 'the Lion'], builder: ['the Builder', 'the Mason'], law: ['the Just', 'the Lawgiver', 'the Wise'], mad: ['the Mad', 'the Cruel', 'the Unready'] };

export const colorOf = (c) => c.color;
const aliveN = (w) => { let n = 0; for (const c of w.cults) if (c.alive && !c.power) n++; return n; };   // realms of the dead don't take a living people's place

export function newCult(w, parent) {
  const used = new Uint8Array(COLORS.length); for (const c of w.cults) if (c.alive) used[c.slot] = 1;
  let slot = 0; while (slot < COLORS.length - 1 && used[slot]) slot++;
  if (used[slot]) slot = (w.rnd() * COLORS.length) | 0;
  const lang = parent ? parent.lang : makeSound(w);   // a daughter people keeps its parent's tongue; tongues fork by drift, not by politics
  const c = { id: w.cults.length, slot, color: COLORS[slot], lang, name: cultName(w, lang), know: parent ? parent.know : 0, tech: parent ? parent.tech : 0, alive: true, count: 0, pop: 0, peak: 0, wit: 0.75 + 0.6 * w.rnd(),
    arts: parent ? Object.assign({}, parent.arts) : {}, tame: parent ? Object.assign({}, parent.tame) : {}, metals: 0, gold: false, coh: 0.85, born: w.year, way: parent ? parent.way : 'forage', kind: 'foragers', parent: parent ? parent.name : null, pid: parent ? parent.id : null, grazer: parent ? parent.grazer : null,
    ruler: null, big: null, flags: parent ? { village: 1, town: parent.flags.town, city: parent.flags.city } : {}, wins: 0, wonderAt: -999, war: null, nb: {}, env: { crop: 0, coast: 0, dryRiver: 0, hill: 0, sed: 0, nomads: 0, towns: 0, cities: 0 }, germ: parent ? parent.germ || 0 : 0, stance: parent ? parent.stance || 'revere' : 'revere', crops: parent ? Object.assign({}, parent.crops) : {}, cropL: parent ? (parent.cropL || []).slice() : [], dom: {}, surplus: 0, rivals: 0, lastMet: w.year, banned: parent ? Object.assign({}, parent.banned) : {}, hungry: 0, lastDry: -99, faith: parent ? parent.faith : null, faithShare: 0,
    _n: -1, _p: 0, _sur: 0, _b: null, _metals: 0, _ways: { forage: 0, farm: 0, fish: 0, herd: 0, hunt: 0 }, _dry: 0, _full: 0 };   // _n < 0: born since the last census began
  crown(w, c, true); w.cults.push(c); rootTags(w, c, parent); return c;
}
function crown(w, c, quiet) {
  const r = w.rnd(), trait = r < 0.07 ? 'great' : r < 0.12 ? 'builder' : r < 0.18 ? 'law' : r < 0.23 ? 'mad' : null, nm = word(w, c.lang, 2);
  c.ruler = { name: trait ? `${nm} ${EPITHET[trait][(w.rnd() * EPITHET[trait].length) | 0]}` : nm, trait, until: w.year + 14 + ((w.rnd() * 30) | 0) };
  if (!quiet && c.count >= 14 && c.big && trait === 'mad') ev(w, `${c.ruler.name} takes the throne of the ${c.name}. It does not go well.`, c.big.x, c.big.y, c.color, 1);
}
export function addSet(w, cult, x, y, pop, nomad) {
  const c = w.cults[cult]; x = wx(x);
  const s = { id: w.nextId++, cult, x, y, px: x, py: y, mt: 0, pop, nomad, tier: nomad ? 0 : 1, maxTier: nomad ? 0 : 1, age: 0, R: 2, links: 0, trade: 0, name: nomad ? null : placeName(w, c), lastFam: -99, lastSack: -99, src: [1, 0, 0, 0, 0], way: 'forage', note: 'grow', ores: 0, wonder: 0, plague: 0, immune: 0, dead: false, walls: false, tower: false, port: false, busy: 0, burned: 0, wa: 1, faith: c.faith };
  w.sets.push(s); c.count++; if (nomad) w.nBand = (w.nBand || 0) + 1; else w.nTown = (w.nTown || 0) + 1; return s;
}
function learn(w, c, k, from) {
  if (c.arts[k]) return false; c.arts[k] = w.year; const b = c.big, first = once(w, 'art-' + k);
  // the same idea found twice by peoples who never met
  const fi = (w.firsts || (w.firsts = {}))[k] || (w.firsts[k] = []);
  if (!from) { const far = fi.length && fi.every((id) => { const o = w.cults[id]; return !o.big || !b || wrapDx(o.big.x - b.x) ** 2 + (o.big.y - b.y) ** 2 > 90 * 90; });
    if (!first && fi.length && fi.length < 3 && far && !fi.some((id) => c.met && c.met[id]) && ['farming', 'writing', 'bronze', 'iron', 'coinage', 'printing', 'gunpowder'].includes(k) && b) { fi.push(c.id); ev(w, `Far from anyone who knew it, the ${c.name} work out ${ART[k].say} for themselves. It is the ${['', 'second', 'third', 'fourth'][fi.length - 1]} time in the world that it has been found.`, b.x, b.y, c.color, 0); discover(w, 'twice', b.x, b.y); return true; } if (first) fi.push(c.id); }
  if (k === 'herding') return true;
  ev(w, first ? `The ${c.name} are the first people to learn ${ART[k].say}.` : from ? `The ${c.name} learn ${ART[k].say} from the ${from.name}.` : `The ${c.name} learn ${ART[k].say}.`, b ? b.x : null, b ? b.y : null, c.color, first ? 0 : 1);
  if (k === 'bronze' && b) discover(w, 'bronze', b.x, b.y); else if (k === 'iron' && b) discover(w, 'iron', b.x, b.y);
  return true;
}
// when two peoples meet, in trade or in war, things rub off
// Crops and beasts only take where the land suits them, so they cross a continent along its
// latitudes and stall at deserts and at the change of climate going north or south.
const homeCell = (c) => (c.big ? c.big.y * W + c.big.x : -1);
const TAME_SP = {}; SPECIES.forEach((sp, k) => { if (sp.tame) TAME_SP[sp.tame] = k; });
function suits(w, c, kind, k) {
  const i = homeCell(c); if (i < 0) return false;
  return kind === 'crop' ? w.pSuit[k * N + i] > 120 : TAME_SP[k] == null || habitat(w, TAME_SP[k], i) > 0.5;
}
// (Oct 29) how much of what a people sees in another it can take in: a neighbour one age ahead teaches a
// great deal, one two ages ahead very little (they see the guns, not the foundry). After Cohen & Levinthal.
export const absorb = (gap) => (gap <= 0 ? 1 : gap === 1 ? 0.6 : gap === 2 ? 0.12 : 0.03);
function meet(w, c, o, p) {
  const rnd = w.rnd; if (c === o) return;
  const tg = tongueGap(w, c.langId, o.langId), talk = tg <= 2 ? 1.5 : tg === Infinity ? 0.7 : 1;   // ideas pass easily between close tongues
  // ties, not trips: the tenth caravan of the year between two peoples teaches less than the first
  const yk = w.year, M = c._mt && c._mtY === yk ? c._mt : ((c._mtY = yk), (c._mt = {})), n = (M[o.id] = (M[o.id] || 0) + 1), tie = 1 / n;
  { const [lo, hi] = o.know > c.know ? [c, o] : [o, c]; lo.know += (hi.know - lo.know) * 0.006 * absorb(hi.tech - lo.tech) * talk * tie; }
  c.lastMet = o.lastMet = w.year; (c.met || (c.met = {}))[o.id] = 1; (o.met || (o.met = {}))[c.id] = 1;
  for (const [a, b] of [[c, o], [o, c]]) {
    for (const k in b.tame) if (!a.tame[k] && rnd() < 0.12 && suits(w, a, 'beast', k)) { a.tame[k] = w.year; if (TAME_GRAZE[k] && !a.grazer) { a.grazer = k; learn(w, a, 'herding'); } }
    for (const k of b.cropL) if (!hasCrop(a, k) && rnd() < 0.07 && suits(w, a, 'crop', k)) { giveCrop(w, a, k, b); if (!a.arts.farming && a.tech >= 1) learn(w, a, 'farming', b); break; }
    if (rnd() < p * 0.4 * talk * tie * absorb(b.tech - a.tech) * (a.q ? 1 + 0.5 * a.q.open : 1) * (a.arts.alphabet || b.arts.alphabet ? 1.4 : 1) * (b.arts.printing ? 2 : 1) * (b.arts.networks ? 2 : 1)) { const got = ART_KEYS.filter((k) => b.arts[k] && canLearn(a, k, true)); if (got.length) learn(w, a, got[(rnd() * got.length) | 0], b); }
  }
  c.nb[o.id] = (c.nb[o.id] || 0) + 1; o.nb[c.id] = (o.nb[c.id] || 0) + 1;
}

/* ---------- finding things ---------- */
const BK = 16, GW = W / BK, GH = H / BK;
function buildGrid(w) { let nt = 0, nb = 0; for (const s of w.sets) if (!s.dead) { if (s.nomad) nb++; else nt++; } w.nTown = nt; w.nBand = nb; const g = (w.sgrid = w.sgrid || []); for (let k = 0; k < GW * GH; k++) (g[k] || (g[k] = [])).length = 0; for (const s of w.sets) if (!s.dead) g[((s.y / BK) | 0) * GW + ((s.x / BK) | 0)].push(s); }
export function near(w, x, y, d, skip, sedOnly, each, notCult) {
  const g = w.sgrid, r = Math.ceil(d / BK), bx = (x / BK) | 0, by = (y / BK) | 0, d2 = d * d; let best = null, bd = d2;
  for (let gy = by - r; gy <= by + r; gy++) { if (gy < 0 || gy >= GH) continue; for (let gx = bx - r; gx <= bx + r; gx++) { const b = g[gy * GW + ((gx % GW) + GW) % GW];
    for (let k = 0; k < b.length; k++) { const s = b[k]; if (s === skip || s.dead || (sedOnly && s.nomad) || (notCult != null && s.cult === notCult)) continue; const dx = wrapDx(s.x - x), dy = s.y - y, q = dx * dx + dy * dy; if (q < d2) { if (each) each(s, q); if (q < bd) { bd = q; best = s; } } } } }
  return best;
}
export function whereAbouts(w, x, y) {
  const b = near(w, x, y, 14, null, true); if (b) return 'near ' + b.name;
  const ns = y < H / 3 ? 'north' : y > (2 * H) / 3 ? 'south' : '', ew = x < W / 3 ? 'west' : x > (2 * W) / 3 ? 'east' : '';
  return ns || ew ? 'in the ' + (ns && ew ? ns + '-' + ew : ns || ew) : 'in the middle lands';
}
function siteScore(w, x, y, farmer, herder, c) {
  let sc = 0; for (const o of DISC[2]) { const Y = y + o[1]; if (Y < 1 || Y >= H - 1) continue; const i = Y * W + wx(x + o[0]); if (w.water[i]) { sc += herder ? 0.1 : 0.5; continue; }
    sc += herder ? 1.2 * w.g[i] - 0.3 * w.t[i] - (w.farm[i] ? 0.5 : 0) : 0.6 * w.g[i] + 0.9 * w.t[i] + (farmer ? cropYield(w, c, i) + (w.fresh[i] <= 1 ? 0.4 : 0) : 0) + (w.graze[i] > 0.35 ? 0.5 : 0); if (w.magic[i] > 0.75) sc -= 0.6; }
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
    if (!st.name && st.towns >= 5) { st.name = st.at.replace(/^the camps of the /, '').replace(/^New /, '') + ' ' + ['fever', 'cough', 'flux', 'pox', 'sweat', 'ague'][(st.id * 7) % 6]; record(w, 'plague', [], { note: st.name, x: st.x, y: st.y }); }   /* an outbreak of five towns gets a name; the great ones get the old names below */
    if (!st.great && st.bad && st.towns >= 40) { st.great = true; st.name = POX[(w.poxN = (w.poxN || 0) + 1) % POX.length]; ev(w, `The sickness that began at ${st.at} has reached ${st.towns} towns and is still walking the roads. People call it the ${st.name}.`, st.x, st.y, null, 2); discover(w, 'plague', st.x, st.y); }
    if (st.now === 0) { st.over = true; if (st.great) { const part = st.pop0 > 0 ? st.killed / st.pop0 : 0; ev(w, `The ${st.name} burns out after ${w.year - st.born} years. ${part > 0.4 ? 'Half the world is dead' : part > 0.25 ? 'One in three is dead' : part > 0.14 ? 'One in five is dead' : 'One in ten is dead'}. Fields go back to forest; the living inherit more than they can use.`, st.x, st.y, null, part > 0.14 ? 2 : 0); holySite(w, st.x, st.y, 'plague', part > 0.14 ? 0.8 : 0.4); remember(w, st.x, st.y, DEATH, 0.35 + part, 4, 'plague', `the ${st.name}`, { place: st.at }); } }
    st.now = 0; }
  // old strains stay in the list; a settlement's pid is an index into it
}

/* ---------- ruins ---------- */
const RUIN_TEXT = { abandoned: 'lies empty. Grass grows in its streets.', sacked: 'is burned to the ground.', drowned: 'is under the water.', buried: 'is buried under ash and stone.', burned: 'is lost to the fire.', plague: 'is a city of the dead.', frozen: 'is under the ice.', overgrown: 'is swallowed by the forest.', crater: 'is gone in a flash of light.', swallowed: 'falls into the earth.', dragon: 'is a dragon’s roost now.', starved: 'starves, and empties.', nuked: 'is ash and glass.', left: 'stands empty. Its people left the world.', machine: 'goes dark. Whatever lives there now does not need light.' };
const RUIN_PAGE = { drowned: 'drowned', buried: 'buried', overgrown: 'overgrown', frozen: 'frozen' };
const DEPOSIT = { sacked: [DEATH, 0.55, 'sacked', (s) => `the sack of ${s.name}`], plague: [DEATH, 0.5, 'plague', (s) => `the plague at ${s.name}`], starved: [DEATH, 0.45, 'famine', (s) => `${s.name} starved`], frozen: [FROST, 0.6, 'frozen', (s) => `the ice took ${s.name}`], drowned: [DEEP, 0.6, 'drowned', (s) => `${s.name} went under the water`], buried: [FIRE, 0.6, null], crater: [FIRE, 0.8, null], dragon: [FIRE, 0.4, null], overgrown: [WILD, 0.4, null], swallowed: [FIRE, 0.4, null] };
export function endSet(w, s, kind, by) {
  if (s.dead) return; s.dead = true; s.endKind = kind; w.anyDead = true; const c = w.cults[s.cult];
  // only a real tragedy is remembered: a town or city, not a hamlet; and the dead do not raise more dead by killing
  const dp = DEPOSIT[kind]; if (dp && s.name && s.maxTier >= 2) remember(w, s.x, s.y, dp[0], dp[1] * (0.5 + 0.25 * s.maxTier), 3, dp[2], dp[3] && dp[3](s), { place: s.name.replace(/^New /, ''), by, risen: !!(by && /^the (Dead|dead)/.test(by)) });
  if (s.maxTier >= 2 || (s.maxTier >= 1 && kind !== 'abandoned' && kind !== 'absorbed')) {
    // one ruin per site: a place built on and lost again is the same ruin with another layer in it
    const old = w.ruins.find((r) => Math.abs(wrapDx(r.x - s.x)) <= 1 && Math.abs(r.y - s.y) <= 1);
    if (old) { old.name = s.name.replace(/^New /, ''); old.cult = c.name; old.year = w.year; old.kind = kind; old.know = Math.max(old.know, c.know); old.tier = Math.max(old.tier, s.maxTier); old.looted = false; old.wonder = old.wonder || s.wonder; old.layers = (old.layers || 1) + 1; }
    else { w.ruins.push({ x: s.x, y: s.y, name: s.name.replace(/^New /, ''), cult: c.name, year: w.year, kind, know: c.know, tier: s.maxTier, looted: false, wonder: s.wonder, layers: 1 }); if (w.ruins.length > 500) w.ruins.shift(); }
    ev(w, `${s.name} ${RUIN_TEXT[kind] || RUIN_TEXT.abandoned}`, s.x, s.y, c.color, s.maxTier < 3 && (kind === 'abandoned' || kind === 'starved' || kind === 'sacked' || s.maxTier < 2) ? 1 : s.wonder ? 2 : 0);
    if (s.maxTier >= 2) discover(w, 'ruin', s.x, s.y); if (RUIN_PAGE[kind]) discover(w, RUIN_PAGE[kind], s.x, s.y);
    if (s.maxTier >= 2 && (kind === 'buried' || kind === 'drowned' || kind === 'crater' || kind === 'dragon')) holySite(w, s.x, s.y, kind, kind === 'crater' ? 0.7 : 0.4);
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
  const path = to ? routeCells(w, s, to) : (() => { const r = landPath(w, s.y * W + s.x, ty * W + tx, 4000, true); return r && r.path.length > 1 ? Array.from(r.path) : null; })();
  if (!path) { if (to) { to.pop += n * 0.9; if (s.plague > 0) infect(w, to, s.pid); } return; }   /* no road to walk: they reach their kin the hard way, or are lost */
  send(w, { kind: 'refugees', cult: s.cult, x: s.x, y: s.y, tx, ty, n, to, sick: s.plague > 0 ? s.pid : null, faith: s.faith, lang: s.lang, cul: s.cul, path, step: c.arts.riding ? 2 : 1 });
}
arrive.refugees = (w, m) => {
  const c = w.cults[m.cult];
  if (m.to && !m.to.dead) { m.to.pop += m.n * 0.9; if (m.sick != null) infect(w, m.to, m.sick); carry(w, m, m.to, 'refugees'); return; }
  const x = wx(Math.round(m.x)), y = clamp(Math.round(m.y), 2, H - 3); if (w.water[y * W + x] || (w.nBand || 0) >= MAXB * 0.85 || !c.alive || c.env.nomads >= 6) return;
  // refugees of a settled, knowing people settle down again or join their kin; only tribes take to wandering
  if (c.tech >= 3) { const kin = near(w, x, y, 40, null, true, null); if (kin && kin.cult === m.cult) { kin.pop += m.n * 0.8; return; } if (m.n >= 25 && !near(w, x, y, 5, null, true)) { const v = addSet(w, m.cult, x, y, m.n * 0.9, false); v.faith = m.faith; } return; }
  const b = addSet(w, m.cult, x, y, m.n * 0.9, true); b.faith = m.faith; tagFrom(w, b, m); c.env.nomads++;
};
arrive.settlers = (w, m) => {
  const c = w.cults[m.cult], x = wx(Math.round(m.tx)), y = Math.round(m.ty), i = y * W + x, home = m.from;
  if (w.water[i] || w.ice[i] || w.lava[i] || near(w, x, y, 5.5, null, true) || (w.nTown || 0) >= MAXS || !c.alive) { if (home && !home.dead) home.pop += m.n; return; }
  let cult = m.cult;
  if (m.split && aliveN(w) < MAXC) { const nc = newCult(w, c); cult = nc.id; ev(w, `Settlers from ${home ? home.name : 'the ' + c.name} cross ${m.wetN > 1 ? 'the water' : 'the hills'} and call themselves the ${nc.name}.`, x, y, nc.color, m.ocean ? 0 : 1); }
  const v = addSet(w, cult, x, y, m.n, false), ru = ruinAt(w, x, y); if (home) { v.faith = home.faith; tagFrom(w, v, home); }
  if (ru) { v.name = 'New ' + ru.name.replace(/^New /, ''); if (discover(w, 'reborn', x, y)) ev(w, `${v.name} rises on the stones of the old city.`, x, y, w.cults[cult].color); }
  near(w, x, y, 12, v, true, (o) => { if (o.cult !== cult) contact(w, w.cults[cult], o, 'Settlers'); });
  if (m.far) { const nc = w.cults[cult]; for (const k in nc.tame) if (TAME_SP[k] != null && w.rnd() < 0.4) introduce(w, x, y, TAME_SP[k], `settlers of the ${nc.name}`); for (const p of nc.cropL) plantWild(w, p, x, y, 3); }
  if (m.far && w.cults[cult].tame.cattle && !w.rinder[w.mass[i]]) { w.rinder[w.mass[i]] = 1; let n = 0; const ms = w.mass[i]; for (let j = 0; j < N; j++) if (w.mass[j] === ms && w.graze[j] > 0) { w.graze[j] *= 0.45; n++; } if (n > 200) ev(w, `The cattle the ${c.name} brought ashore carry a sickness the wild herds have never met. Carcasses line the rivers.`, x, y, c.color); }
  if (m.ocean && m.far && (w.massSize[w.mass[i]] || 0) > 150 && discover(w, 'oversea', x, y)) ev(w, `Ships of the ${c.name} cross the open sea and land ${whereAbouts(w, x, y)}.`, x, y, c.color, 2);
};
arrive.home = (w, m) => { if (m.to && !m.to.dead) m.to.pop += m.n; };
// a route from a town to a cell: over land, or (with boats) by sea lane and ashore
export function routeToCell(w, s, x, y, boats, landOnly) {
  const r = landPath(w, s.y * W + s.x, y * W + wx(x), 6000, true); if (r && r.path.length > 1) return { path: Array.from(r.path), wet: false };
  if (boats && !landOnly) { const sea = byShip(w, s, x, y); if (sea) return { path: sea.concat([y * W + wx(x)]), wet: true }; }
  return null;
}
// Ships leave only from a port of one's own people: a band or an inland town walks to the nearest
// such port first. Returns the whole route (walk, then lane), or null.
export function departPort(w, s) {
  if (s.port && !s.nomad) return { port: s, walk: null };
  let best = null, bd = 1e9; near(w, s.x, s.y, 40, s, true, (o, q) => { if (o.port && !o.nomad && o.cult === s.cult && q < bd) { bd = q; best = o; } });
  if (!best) return null; const walk = routeCells(w, s, best); return walk ? { port: best, walk } : null;
}
function byShip(w, s, x, y) {
  const d = departPort(w, s); if (!d) return null; const lane = seaLane(w, d.port.x, d.port.y, x, y); if (!lane) return null;
  return d.walk ? d.walk.concat(lane) : lane;
}
// The only way anyone goes anywhere on land: by the ways between towns, or (for camps and bands,
// which are not on the graph) by the cheapest path over the cells. No straight lines.
export function routeCells(w, a, b) {
  if (!a.nomad && !b.nomad) { const c = legCells(w, a, b); if (c && c.length > 1) return c; }
  const r = landPath(w, a.y * W + a.x, b.y * W + b.x, 6000, true); return r && r.path.length > 1 ? Array.from(r.path) : null;
}
// A trade trip (slice 16): planned over the ways between towns, or the sea lanes. If the carrier's
// range runs out, the tongue changes or the next people is unknown, the goods change hands on the
// way; only the first leg is a moving picture, the rest follow as yearly flow.
export function tradeTrip(w, from, to, g, wet) {
  if (!from || !to || from.dead || to.dead || from.nomad || to.nomad) return false; const c = w.cults[from.cult];
  let legs, path;
  if (!wet) { legs = planLand(w, from, to); if (!legs) return false; path = legCells(w, from, legs[0]); }
  else { const P = planSea(w, from, to); if (!P) return false; legs = P.legs; path = P.path; }
  const first = legs[0]; if (legs.length === 1) { const old = clearRelay(w, from, to); if (old && once(w, 'bypass-' + old.id + '-' + Math.floor(w.year / 60))) bypassed(w, old, from, to); }
  // the moving picture is a sample: loads going the same way together share one caravan, and a town
  // shows at most three on the road; the rest goes as flow, unseen but the same in every other way
  let out = 0; for (const m of w.movers) { if (m.done || m.kind !== 'trade' || m.from !== from) continue; out++; if (m.final === to && m.goods === g && m.to === first) { m.loads = (m.loads || 1) + 1; return true; } }
  if (out >= 3 || !path || path.length < 2) { const d = Math.hypot(wrapDx(first.x - from.x), first.y - from.y); (w.flowQ || (w.flowQ = [])).push({ due: w.tickN + Math.max(2, Math.round(d / (wet ? 6 : 3))), from, to: first, origin: from, final: to, legs: legs.slice(1), goods: g, wet0: !!wet }); return true; }
  send(w, { kind: 'trade', cult: from.cult, x: from.x, y: from.y, tx: first.x, ty: first.y, n: wet ? 8 : 6, from, to: first, origin: from, final: to, legs: legs.slice(1), goods: g, wet0: !!wet, path: path && path.length > 1 ? path : null, step: stepOf(c, !!wet), land: 1 });
  return true;
}
function bypassed(w, old, a, b) {
  const c = w.cults[old.cult]; record(w, 'bypass', [old.cult], { x: old.x, y: old.y, note: `${old.name}: carriers from ${a.name} now go straight through to ${b.name}` });
  ev(w, `Carriers from ${a.name} no longer stop at ${old.name}; they go straight through to ${b.name} now. The inns of ${old.name} have fewer guests every year.`, old.x, old.y, c.color, 1);
}
// the goods reach a relay town: it takes its cut, and passes them on (as flow) toward the next town
function relay(w, m, b) {
  const val = (m.goods >= 0 ? GOODS[m.goods].v : 0.5) * 1.5, origin = m.origin || m.from, fin = m.final;
  const div = relayAt(w, b, origin, fin, val);
  if (div && div.old && once(w, 'divert-' + origin.id + '-' + fin.id + '-' + Math.floor(w.year / 40))) { const c = w.cults[b.cult];
    record(w, 'divert', [b.cult, div.old.cult], { x: b.x, y: b.y, note: `goods from ${origin.name} to ${fin.name} now change hands at ${b.name}, not ${div.old.name}` });
    ev(w, `The goods of ${origin.name} bound for ${fin.name} change hands at ${b.name} now, not at ${div.old.name}.`, b.x, b.y, c.color, 1); }
  const next = m.legs[0], d = Math.hypot(wrapDx(next.x - b.x), next.y - b.y), bc = w.cults[b.cult];
  (w.flowQ || (w.flowQ = [])).push({ due: w.tickN + Math.max(2, Math.round(d / (m.wet0 ? 6 : 3))), from: b, to: next, origin, final: fin, legs: m.legs.slice(1), goods: m.goods, wet0: m.wet0 });
}
export function flowTick(w) {
  const Q = w.flowQ; if (!Q || !Q.length) return; let k = 0;
  for (let i = 0; i < Q.length; i++) { const f = Q[i]; if (f.due > w.tickN) { Q[k++] = f; continue; } if (f.from.dead || f.to.dead) continue; f.kind = 'trade'; f.cult = f.from.cult; f.n = 6; f.flow = true; arrive.trade(w, f); }
  Q.length = k;
}
// on the road: the dead take caravans that come too near, and armies rob their enemies' caravans
onRoad.trade = (w, m) => {
  const c = w.cults[m.cult]; if (!c) return; let dead = null;
  near(w, m.x, m.y, 3.5, null, true, (s) => { if (!dead && w.cults[s.cult].power === 'dead') dead = s; });
  if (dead && w.rnd() < 0.5) { m.done = true; dead.pop += m.n * 0.6; const dc = w.cults[dead.cult]; record(w, 'robbed', [c.id, dc.id], { x: dead.x, y: dead.y, note: `a caravan of the ${c.name} taken by the dead near ${dead.name}` });
    if (once(w, 'deadcaravan-' + c.id + '-' + Math.floor(w.year / 30))) ev(w, `A caravan of the ${c.name} goes too near ${dead.name}. Its drivers join the garrison there.`, m.x, m.y, dc.color, 1); return; }
  if (!c.war) return;
  for (const a of w.movers) { if (a.done || a.kind !== 'army' || Math.abs(wrapDx(a.x - m.x)) > 3 || Math.abs(a.y - m.y) > 3) continue; const ac = w.cults[a.cult];
    if (!atWar(w, c, ac)) continue;
    m.done = true; const home = a.from && !a.from.dead ? a.from : null; if (home) home.wealth = (home.wealth || 0) + 2; record(w, 'robbed', [c.id, ac.id], { x: Math.round(m.x), y: Math.round(m.y), note: `a war band of the ${ac.name} takes a caravan of the ${c.name}` });
    if (once(w, 'robbed-' + ac.id + '-' + c.id + '-' + Math.floor(w.year / 20))) ev(w, `A war band of the ${ac.name} falls on a caravan of the ${c.name} and drives off the mules.`, m.x, m.y, ac.color, 1); return; }
};
arrive.trade = (w, m) => {
  const a = m.from, b = m.to; if (!a || !b || a.dead || b.dead) return; const ca = w.cults[a.cult], cb = w.cults[b.cult];
  a.trade = Math.min(6, a.trade + 1); b.trade = Math.min(6, b.trade + 1); if (ca !== cb) { meet(w, ca, cb, 0.3); w.meets = (w.meets || 0) + 1; (ca.ties || (ca.ties = {}))[cb.id] = ((ca.ties[cb.id]) || 0) + 1; (cb.ties || (cb.ties = {}))[ca.id] = ((cb.ties[ca.id]) || 0) + 1; }
  if (m.legs && m.legs.length) relay(w, m, b);
  carry(w, a, b, m.wet0 ? 'ship' : 'trade'); if (w.rnd() < 0.4) carry(w, b, a, m.wet0 ? 'ship' : 'trade');
  for (let k = 0; k < Math.min(5, m.loads || 1); k++) deliver(w, m);   /* a shared caravan delivers each load */
  if (a.plague > 0) { if (w.rnd() < 0.3 + w.plagues[a.pid].catchy) infect(w, b, a.pid); }
  else if (ca !== cb) contact(w, ca, b, 'Traders');
  // sickness also travels home: a land the sailors had never seen has its own fevers
  if (m.wet0 && ca !== cb && w.mass[a.y * W + a.x] !== w.mass[b.y * W + b.x] && once(w, 'back-' + ca.id + '-' + cb.id) && w.rnd() < 0.35 && infect(w, a, null)) { const st = w.plagues[a.pid]; st.v = 0.09; st.catchy = 0.5; ev(w, `Sailors home from ${b.name} bring a fever no one on this shore has seen. It spreads through ${a.name} and the ports beyond.`, a.x, a.y, ca.color, 0); discover(w, 'backwash', a.x, a.y); }
  if (m.wet0 && discover(w, 'trade', b.x, b.y)) ev(w, `A ship from ${a.name} ties up at ${b.name} and sells everything aboard.`, b.x, b.y, ca.color);
};
export function strength(c, pop) { const A = c.arts; return pop * (c.zeal ? 1.12 : 1) * (1 + 0.15 * c.tech) * (1 + Math.min(0.25, (c.wealth || 0) / 400)) * warMult(c) * (0.55 + 0.9 * c.coh) * (c.ruler.trait === 'great' ? 1.4 : c.ruler.trait === 'mad' ? 0.8 : 1) * (c.q ? 1 + 0.15 * c.q.war : 1); }
// (slice 2) the besiegers go home (part of them; the rest are dead or deserted)
function liftSiege(w, o, frac) { const sg = o.siege; o.siege = null; if (!sg) return; const home = sg.from != null ? w.sets.find((q) => q.id === sg.from && !q.dead) : null; if (home) home.pop += sg.n * frac; }
// Every year: count who is serving, and work the sieges. A siege advances with the force ratio
// (walls against the besiegers' siege arts; cannon and flight a big help, not a breach) and with
// hunger inside (granaries stretch it). The besiegers waste away with distance from home, less on
// roads and rails and where there are fields to forage. Too few, and they give up.
function armiesYear(w) {
  for (const c of w.cults) c.serving = 0;
  for (const m of w.movers) if (!m.done && (m.kind === 'army' || m.kind === 'home') && w.cults[m.cult]) w.cults[m.cult].serving += m.n;
  for (const o of w.sets) {
    const sg = o.siege; if (!sg || o.dead) continue; const sc = w.cults[sg.by], oc = w.cults[o.cult];
    if (!sc || !sc.alive || !oc || o.occ || !atWar(w, sc, oc)) { liftSiege(w, o, 0.8); continue; }
    const home = sg.from != null ? w.sets.find((q) => q.id === sg.from && !q.dead) : null, dist = home ? Math.hypot(wrapDx(home.x - o.x), home.y - o.y) : 40, A = sc.arts;
    const fields = w.farm[o.y * W + o.x] || o.tier >= 2 ? 0.5 : 1, waste = 0.03 + 0.1 * Math.min(1.5, (dist / 60) * (A.railways ? 0.4 : A.roads ? 0.75 : 1)) * fields;
    bleed(w, sc, sg.n * waste); sg.n *= 1 - waste; o.pop *= oc.arts.granaries ? 0.985 : 0.97; o.trade = 0;
    const r = strength(sc, sg.n * 6) / Math.max(1, strength(oc, o.pop) * (o.walls ? wallsAgainst(sc) : 1.2)), arts = (A.cannon ? 2 : 1) * (A.flight ? 1.5 : 1), hunger = (oc.arts.granaries ? 0.06 : 0.12) * (1 + 0.15 * (w.year - sg.since));
    sg.prog += 0.2 * Math.min(2, r) * arts + hunger;
    if (sg.n < 10 || (r < 0.25 && w.year - sg.since >= 2)) { tally(w, 'siegeFailed'); if (o.tier >= 3 || oc.big === o) ev(w, `The ${sc.name} give up the siege of ${o.name}.`, o.x, o.y, oc.color, 1); liftSiege(w, o, 0.7); continue; }
    if (sg.prog >= 1) { o.siege = null; tally(w, 'siegeWon'); bleed(w, oc, o.pop * 0.05); occupy(w, o, sc, oc, sc.war, home); o.pop *= 0.95; if (home) home.pop += sg.n * 0.5; continue; }
    sc.serving += sg.n;
  }
  for (const c of w.cults) c.serveShare = c.alive && c.pop > 0 ? Math.min(0.5, c.serving / c.pop) : 0;
}
// (slice 1b) a town taken in a war is held, not annexed: it keeps its sovereign until the peace
function occupy(w, o, c, oc, war, home) {
  const K = conflictOf(w, c), wasCap = oc.big === o && oc.count > 2;
  if (K && K.aim && K.aim.kind === 'raze' && sideOf(K, c.id) === 0) {   /* (Oct 29) a war to wipe them out: the town is not held but destroyed, its people killed or driven off */
    war.taken++; tally(w, 'wipedOut'); corpses(w, o.x, o.y, o.pop * 0.5); flee(w, o, o.pop * 0.2); remember(w, o.x, o.y, DEATH, 0.3, 3, 'sacked', `the ${c.name} destroyed ${o.name}`);
    if (wasCap) oc.coh = Math.max(0.05, oc.coh - 0.15);
    ev(w, wasCap ? `The ${c.name} take ${o.name}, seat of the ${oc.name}, and leave nothing of it standing.` : `The ${c.name} take ${o.name}, kill whoever did not flee, and burn it to the ground.`, o.x, o.y, c.color, wasCap && oc.count > 12 ? 0 : 1);
    endSet(w, o, 'sacked', c.name); return; } o.occ = { by: c.id, cid: K ? K.id : null, since: w.year }; o.trade = 0; o.lastSack = w.year; war.taken++; tally(w, 'occupied');
  if (c.tech >= 2 && (c.ruler.trait === 'mad' || c.zeal) && w.rnd() < 0.5) scorch(w, o, c);
  if (wasCap) { war.capital = true; oc.coh = Math.max(0.05, oc.coh - 0.1); }
  corpses(w, o.x, o.y, o.pop * 0.05);
  ev(w, wasCap ? `The ${c.name} take ${o.name}, seat of the ${oc.name}, and hold it.` : `The ${c.name} take ${o.name} and hold it.`, o.x, o.y, c.color, wasCap && oc.count > 24 ? 2 : wasCap || o.tier === 3 ? 0 : 1);
}
// the peace gives a town to the winner
function annexTown(w, s, c) {
  const oc = w.cults[s.cult], wasCap = oc && oc.big === s; s.cult = c.id; s.occ = null; s.trade = 0; s.tollTo = null; tally(w, 'annexed');
  if (oc && !oc.power && oc.know > c.know) c.know += (oc.know - c.know) * 0.08;   /* conquerors learn from the conquered */
  carry(w, c.big && !c.big.dead ? c.big : { faith: c.faith }, s, 'conquest');
  if (wasCap) { oc.coh = Math.max(0.05, oc.coh - 0.2); oc.big = null; }
}
arrive.army = (w, m) => {
  const o = m.to, c = w.cults[m.cult], home = m.from, rnd = w.rnd; const back = (frac) => { if (home && !home.dead && m.n * frac > 3) { const back = m.path ? Array.from(m.path).slice(0, Math.min(m.path.length, (m.pi || 0) + 1)).reverse() : null; if (back && back.length > 1) send(w, { kind: 'home', cult: m.cult, x: m.x, y: m.y, tx: home.x, ty: home.y, n: m.n * frac, to: home, path: back, step: m.step || 1 }); else home.pop += m.n * frac; } };   /* home the way they came */
  if (!c.alive) return; if (!o || o.dead) { back(1); return; }
  // (slice 1b) an occupied town is fought for with its garrison: the sovereign's side frees it, the
  // occupier's side has nothing to do there
  if (o.occ) { const hc = w.cults[o.occ.by];
    if (hc && hc.alive && hc !== c && atWar(w, c, hc)) {
      contact(w, c, o, 'Warriors'); w.fx.push({ k: 'clash', x: o.x, y: o.y, T: 1.1 });
      const A = strength(c, m.n * 6) * (0.6 + 0.8 * rnd()), B = strength(hc, o.pop * 0.5) * (o.walls ? wallsAgainst(c) : 1.2) * (0.6 + 0.8 * rnd());
      if (A <= B) { bleed(w, c, m.n * 0.55); corpses(w, o.x, o.y, m.n * 0.55); back(0.45); return; }
      bleed(w, hc, o.pop * 0.03); bleed(w, c, m.n * 0.3); c.wins++;
      const ours = o.cult === c.id || !atWar(w, c, w.cults[o.cult]);
      o.lastSack = w.year; if (ours) { o.occ = null; tally(w, 'liberated'); ev(w, `The ${c.name} drive the ${hc.name} out of ${o.name}.`, o.x, o.y, c.color, 1); }
      else { const K = conflictOf(w, c); o.occ = { by: c.id, cid: K ? K.id : null, since: w.year }; tally(w, 'occupied'); }
      back(0.7); return; }
    if (hc && hc.alive && (hc === c || !atWar(w, c, hc))) { back(1); return; } }
  // (slice 2) a siege: the sovereign's side comes to break it, the besiegers' side to swell it
  if (o.siege) { const sg = o.siege, sc = w.cults[sg.by];
    if (sc && sc.alive && (sc === c || (!atWar(w, c, sc) && atWar(w, c, w.cults[o.cult])))) { if (sc === c) sg.n += m.n; else back(1); return; }
    if (sc && sc.alive && atWar(w, c, sc) && (o.cult === c.id || !atWar(w, c, w.cults[o.cult]))) {
      w.fx.push({ k: 'clash', x: o.x, y: o.y, T: 1.1 }); const A = strength(c, m.n * 6) * (0.6 + 0.8 * rnd()), B = strength(sc, sg.n * 6) * 1.1 * (0.6 + 0.8 * rnd());
      if (A <= B) { bleed(w, c, m.n * 0.55); bleed(w, sc, sg.n * 0.1); sg.n *= 0.9; corpses(w, o.x, o.y, m.n * 0.5); back(0.45); return; }
      bleed(w, sc, sg.n * 0.5); bleed(w, c, m.n * 0.2); tally(w, 'siegeRelieved'); if (o.tier >= 3 || w.cults[o.cult].big === o) ev(w, `An army of the ${c.name} breaks the siege of ${o.name}. The ${sc.name} fall back.`, o.x, o.y, c.color, 1);
      liftSiege(w, o, 0.4); back(0.8); return; } }
  if (o.cult === m.cult) { back(1); return; }
  const oc = w.cults[o.cult], war = atWar(w, c, oc) ? c.war : null;
  contact(w, c, o, 'Warriors'); if (m.nomad) { oc.raided = (oc.raided || 0) + 1; (oc.rby || (oc.rby = {}))[c.id] = ((oc.rby && oc.rby[c.id]) || 0) + 1; }
  if (c.arts.cannon || oc.arts.cannon) scar(w, o, c);
  w.fx.push({ k: 'clash', x: o.x, y: o.y, T: 1.1 });
  if (o.nomad && c.power === 'dead') {   /* (Oct 29) the dead fall on a band: beaten, it rises and camps where it fell, one more dead site */
    const A = strength(c, m.n * 6) * (0.6 + 0.8 * rnd()) * (1.5 + 2 * c.coh), B = strength(oc, o.pop * 1.5) * (0.6 + 0.8 * rnd());
    corpses(w, o.x, o.y, Math.min(o.pop, m.n) * 0.3);
    if (A <= B) { o.pop *= 0.85; back(0.4); return; }
    tally(w, 'deadTookBand'); const n0 = o.pop;
    if ((w.nTown || 0) < MAXS && !w.water[o.y * W + o.x]) { o.nomad = false; o.cult = c.id; o.undead = true; o.wasDead = true; o.capital = false; o.tier = 1; o.maxTier = Math.max(1, o.maxTier || 0); o.age = 0; o.px = o.x; o.py = o.y; o.pop = n0 * 0.6 + m.n * 0.4; o.name = 'the Barrow of the ' + oc.name; w.nTown = (w.nTown || 0) + 1; }
    else { endSet(w, o, 'absorbed'); back(1 + (0.5 * n0) / Math.max(1, m.n)); }
    if (once(w, 'deadband') || w.year - (c.bandSay || -99) > 40) { c.bandSay = w.year; ev(w, `The dead of the ${c.name} fall on a camp of the ${oc.name} out on the open land. By morning the camp rises with them.`, o.x, o.y, c.color, 1); }
    return; }
  if (o.nomad) { if (rnd() < 0.7) { const a = rnd() * 6.283, x = wx(Math.round(o.x + Math.cos(a) * 7)), y = clamp(Math.round(o.y + Math.sin(a) * 7), 3, H - 4); if (!w.water[y * W + x]) { o.px = o.x; o.py = o.y; o.mt = w.tickN; o.x = x; o.y = y; } o.pop *= 0.92; back(0.95); } else if (o.pop < m.n * 2.5) { endSet(w, o, 'absorbed'); back(1.1); } else { o.pop *= 0.8; back(0.7); } return; }
  // (slice 2) the defenders call in men from the towns around, as far as their muster allows
  let rein = 0; if (war && !oc.power && !c.power) { const left = mobBudget(w, oc); if (left > 0) { near(w, o.x, o.y, 10, o, true, (u) => { if (u.cult === oc.id && !u.occ && !u.siege) rein += u.pop * 0.08; }); rein = Math.min(rein, left); oc.serving = (oc.serving || 0) + rein; } }
  const A = strength(c, m.n * 6) * (0.6 + 0.8 * rnd()) * (c.power ? 1.5 + 2 * c.coh : 1), B = strength(oc, o.pop + rein * 6) * (o.walls ? wallsAgainst(c) : 1.2) * (0.6 + 0.8 * rnd()) * (oc.power ? 1.2 + 1.5 * oc.coh : 1);   // the dead do not break and run
  // a walled town or a city is not stormed unless the attackers vastly outnumber it: it is besieged
  if (war && (o.walls || o.tier >= 3) && !c.power && !oc.power && !(m.nomad && !war.horde) && A < 3 * B) {
    o.siege = { by: c.id, n: m.n, since: w.year, prog: 0, from: home && !home.dead ? home.id : null }; tally(w, 'siege'); bleed(w, c, 0);
    if (o.tier >= 3 || oc.big === o) ev(w, `The ${c.name} lay siege to ${o.name}.`, o.x, o.y, c.color, oc.big === o && oc.count > 12 ? 0 : 1); return; }
  if (A <= B) { oc.wins += 0.5; if (war) { war.lost++; bleed(w, c, m.n * 0.55); bleed(w, oc, o.pop * 0.02 + rein * 0.2); } if (!c.power) corpses(w, o.x, o.y, m.n * 0.55); back(0.45); return; }
  const p0 = o.pop, lost = (k) => { tally(w, k); tally(w, k + 'Loss', p0 - (o.dead ? 0 : o.pop)); tally(w, k + 'Frac', p0 > 0 ? 1 - (o.dead ? 0 : o.pop) / p0 : 0); };   /* test harness: what each outcome costs the town */
  c.wins++; oc.coh = Math.max(0.05, oc.coh - (oc.power ? 0.008 : 0.03)); const hp = home && !home.dead ? home.pop : m.n * 6;
  // (war & sovereignty, slice 0) the fight itself costs the town a little; what the winner does next decides the rest.
  // A sack ruins a town, and only some do it: raiders, mad rulers, the dead. Ordinary conquest is mostly bloodless.
  const raider = m.nomad && !(war && war.horde);
  if ((raider || (c.ruler.trait === 'mad' && rnd() < 0.5)) && w.year - o.lastSack > 25) {   /* a town just sacked has nothing left to take: it is only plundered again (below) */
    if (o.tier <= 1 || o.pop * 0.72 < hp * 0.6) { if (!oc.power) corpses(w, o.x, o.y, o.pop * 0.5); flee(w, o, o.pop * 0.25); lost('razed'); endSet(w, o, 'sacked', c.name); back(1.2); return; }
    o.lastSack = w.year; if (!oc.power) corpses(w, o.x, o.y, o.pop * 0.45); flee(w, o, o.pop * 0.2); o.pop *= 0.25; o.tier = Math.max(1, o.tier - 1); if (o.walls && rnd() < 0.5) o.walls = false;
    if (home && !home.dead) home.wealth = (home.wealth || 0) + 3 + o.tier; if (m.nomad) c.loot = (c.loot || 0) + 3 + o.tier;   /* the loot goes home */
    remember(w, o.x, o.y, DEATH, 0.25, 3, 'sacked', `the ${c.name} sacked ${o.name}`);
    ev(w, `${m.nomad ? 'Riders' : 'Warriors'} of the ${c.name} sack ${o.name}. Little is left standing.`, o.x, o.y, c.color, oc.big === o && oc.count > 6 ? 0 : 1);
    lost('sack'); back(1.15); return;
  }
  if (!raider && (war || c.power || oc.power) && (o.pop * 0.72 < hp * 0.5 || rnd() < 0.55) && ((war && !c.power && !oc.power) || w.year - o.lastSack > (c.power ? 8 : 25))) {   /* (slice 1a) towns change hands only in a war; a raid in peacetime takes loot, not the town */
    if (war && !c.power && !oc.power) { occupy(w, o, c, oc, war, home); bleed(w, c, m.n * 0.4); bleed(w, oc, o.pop * 0.05 + rein * 0.5); flee(w, o, o.pop * 0.03); o.pop *= 0.95; lost('conquest'); back(0.6); return; }
    o.lastSack = w.year; const wasCap = oc.big === o && oc.count > 2; if (war && c.tech >= 2 && (c.ruler.trait === 'mad' || c.zeal || rnd() < 0.25)) scorch(w, o, c); const fromDead = oc.power; if (!c.power && !oc.power && oc.know > c.know) c.know += (oc.know - c.know) * (m.nomad ? 0.2 : 0.08);   /* conquerors learn from the conquered */ o.cult = m.cult; o.trade = 0; if (c.power || fromDead) deadConquest(w, o, c, oc); if (war) war.taken++; carry(w, home && !home.dead ? home : { faith: c.faith }, o, 'conquest');
    ev(w, wasCap ? `${o.name}, seat of the ${oc.name}, falls to the ${c.name}.` : `${o.name} falls to the ${c.name}.`, o.x, o.y, c.color, wasCap && oc.count > 24 ? 2 : wasCap || o.tier === 3 ? 0 : 1);
    if (wasCap) { oc.coh = Math.max(0.05, oc.coh - (oc.power ? 0.1 : 0.25)); oc.big = null; if (war) { war.capital = true; war.until = Math.min(war.until, w.year + 2); const K = conflictOf(w, c); if (K) K.until = Math.min(K.until, w.year + 2); } }
    if (!oc.power) corpses(w, o.x, o.y, o.pop * 0.05); flee(w, o, o.pop * 0.03); o.pop *= 0.95; lost(war ? 'conquest' : 'peaceConquest'); back(0.6); return;
  }
  // beaten but not taken: the defenders lose men and the countryside is plundered, the town stands; in peacetime it is remembered
  if (!war && !c.power && !oc.power) { oc.nb[c.id] = (oc.nb[c.id] || 0) + 1; oc.grudge = oc.grudge || {}; oc.grudge[c.id] = w.year; }
  if (war) bleed(w, oc, o.pop * 0.08 + rein * 0.4); if (!oc.power) corpses(w, o.x, o.y, o.pop * 0.08); o.pop *= 0.92; if (home && !home.dead) home.wealth = (home.wealth || 0) + 1; if (m.nomad) c.loot = (c.loot || 0) + 1;
  if (o.tier >= 2 && w.year - o.lastSack > 30) { o.lastSack = w.year; ev(w, `Warriors from ${home && home.name ? home.name : 'the ' + c.name} beat the defenders of ${o.name} and plunder the country around it.`, o.x, o.y, c.color, oc.big === o && oc.count > 6 ? 0 : 1); }
  lost('beaten'); back(1.1);
};

/* ---------- the year ---------- */
function territory(w) {
  const { owner, ocult, ownD, sets, urban } = w; owner.fill(-1); ocult.fill(-1); ownD.fill(1e9); urban.fill(0);
  for (let k = 0; k < sets.length; k++) {
    const s = sets[k]; s._k = k; if (s.dead) continue; if (s.nomad) { s.R = w.cults[s.cult].grazer ? 3 : 2; continue; }
    if (!(s.pop >= 0)) s.pop = 0;   /* a broken number must not stop the world */ const R = (s.R = Math.min(9, 2 + Math.floor(Math.sqrt(s.pop) / 7))), bias = s.pop * 0.0015, slot = w.cults[s.cult].slot;
    for (const o of DISC[R]) { const y = s.y + o[1]; if (y < 0 || y >= H) continue; const i = y * W + wx(s.x + o[0]), d = o[2] * o[2] - bias; if (d < ownD[i]) { ownD[i] = d; owner[i] = k; ocult[i] = slot; } }
    if (s.tier >= 2) { const ur = s.tier === 3 ? (s.pop > 2500 ? 2 : 1) : 0; for (const o of DISC[ur]) { const y = s.y + o[1]; if (y < 0 || y >= H) continue; const i = y * W + wx(s.x + o[0]); if (!w.water[i]) urban[i] = 1; } }
  }
}
const FAMINE = { drought: 'The rains fail around %. Its people go hungry.', flood: 'The river takes the fields of %.', soil: 'The fields of % are worn out. They give less every year.', fish: 'The nets come up empty at %.', locusts: 'Locusts strip the fields of %.', ash: 'No summer comes to %. Nothing ripens.', game: 'The herds are gone from around %.', crowded: 'There are more mouths in % than the land can feed.' };

// The yearly census, as a generator: a running game spreads it over the ticks of the year.
export function peopleYear(w) { for (const _ of peopleSteps(w)); }
export function* peopleSteps(w) {
  buildGrid(w); territory(w);
  const sets = w.sets, n0 = sets.length, rnd = w.rnd, { water, river, farm, soil, g, t, fresh, owner, fireT, ore, mi, crop, h } = w, sea = w.params.sea;
  for (const c of w.cults) { c.boom = boomOf(c.arts); c.boomL = c.boomL ? c.boomL + (c.boom - c.boomL) * 0.05 : c.boom;   /* the numbers take a generation or two to catch up with a new harvest */ c._poolLast = c._pool || 0; c._poolWLast = c._poolW || 0; c._pool = 0; c._poolW = 0; c._n = 0; c._p = 0; c._sur = 0; c._b = null; c._L = livestock(c); c._metals = 0; c._ways = { forage: 0, farm: 0, fish: 0, herd: 0, hunt: 0 }; c.hungry = 0; c._dry = 0; c._full = 0; const e = c.env; e.crop = e.coast = e.dryRiver = e.hill = e.sed = e.nomads = e.towns = e.cities = e.river = e.lowcoast = 0; c.markets = 0; }
  let total = 0, smoke = 0; const sun = 1 - Math.min(0.6, w.aerosol * 0.8);
  const chunk = Math.max(6, Math.ceil(n0 / 22));   /* the towns in 22 even steps, then the peoples, faiths and tongues in three: the year fits in its eight ticks */
  for (let k = 0; k < n0; k++) {
    if (k % chunk === chunk - 1) yield;
    const s = sets[k]; if (s.dead) continue; const c = w.cults[s.cult], A = c.arts, i0 = s.y * W + s.x; s.age++;
    if (water[i0] === 1) { let to = -1, bd = 99; for (const o of DISC[4]) { const yy = s.y + o[1]; if (yy < 1 || yy >= H - 1) continue; const j = yy * W + wx(s.x + o[0]); if (!water[j] && !w.lava[j] && o[2] < bd) { bd = o[2]; to = j; } }
      if (to < 0 || s.pop < 30) { endSet(w, s, 'drowned'); continue; }   /* (slice 17) a rising sea moves a town uphill if there is land close by; only a town with nowhere to go drowns */
      s.x = to % W; s.y = (to / W) | 0; s.pop *= 0.85; buildGrid(w); if (s.tier >= 2 && once(w, 'moved-' + s.id)) ev(w, `The sea takes the lower town of ${s.name}. Its people rebuild on higher ground.`, s.x, s.y, c.color, 1); continue; }
    if (c.power) { POWER_TOWN[c.power](w, s, c); continue; }   // a town of the dead neither eats nor grows
    { const ms = w.mass[i0]; if (!w.arrived[ms]) w.arrived[ms] = [w.year]; }
    if (w.lava[i0]) { endSet(w, s, 'buried'); continue; }
    if (w.ice[i0] && !s.nomad) { flee(w, s, s.pop * 0.5); endSet(w, s, 'frozen'); continue; }
    if (fireT[i0]) s.pop *= 0.9;
    if (w.fallout[i0] > 0.05) { s.pop *= 1 - 0.16 * Math.min(1, w.fallout[i0]); if (w.fallout[i0] > 0.5 && !s.nomad && rnd() < 0.2) flee(w, s, s.pop * 0.1); }
    const herder = !!c.grazer, wa = Math.max(wetAt(w, s.x, s.y), w.mem[i0 * 6 + 4] > 0.4 ? 0.95 : 0), irrR = A.irrigation ? 3 : 1, grove = !!(c.docs && c.docs.grove), maxH = A.terraces ? 0.5 : 0.32, farmR = A.engines ? 6.2 : s.tier >= 3 ? 5.2 : 4.2; s.wa = wa;
    let domS = null, wildF = 0, seaN = 0, freshF = 0, rain = 0, irrg = 0, farms = 0, blight = 0, bestI = -1, bestK = 0.34, huntLeft = Math.min(s.pop, 150) * 0.012, tameAt = -1, hunt = 0, past = 0, ores = 0, cropS = 0, landN = 0, soilS = 0;
    for (const o of DISC[s.R]) {
      const y = s.y + o[1]; if (y < 0 || y >= H) continue; const i = y * W + wx(s.x + o[0]);
      if (!s.nomad && owner[i] !== k) continue;
      if (water[i] === 1) { seaN++; continue; } if (water[i] === 2) { freshF += 1.2; continue; }
      landN++; const cy = A.farming ? cropYield(w, c, i) : 0; cropS += cy;
      if (w.flora[i] !== 255 && !hasCrop(c, w.flora[i])) { (domS || (domS = new Float32Array(NP)))[w.flora[i]] += w.pSuit[w.flora[i] * N + i] / 255; }
      if (river[i]) freshF += 0.4 * river[i];
      if (ore[i]) ores |= 1 << ore[i];
      if (w.graze[i] > 0.05) { if (huntLeft > 0) { const take = takeGame(w, i, huntLeft); huntLeft -= take; hunt += take * 3.2; } if (w.graze[i] > 0.4 && w.spAt[i] !== 255) tameAt = i; }
      if (farm[i]) {
        farms++; soilS += soil[i]; const ir = fresh[i] <= irrR, mb = i * 6, y0 = Math.max(0, Math.min(1, cy + (ir && cy > 0.05 ? 0.5 : 0)) * Math.min(1, soil[i]) * (1 - 0.7 * Math.min(1, w.mem[mb])) * (1 + 0.3 * Math.min(1, w.mem[mb + 4])) * (w.year < (c.blightTo || 0) ? 0.35 : 1) * (1 - Math.min(1, w.fallout[i])));   /* never a negative harvest */
        if (farm[i] === 2) { blight++; farm[i] = 1; } else if (ir) irrg += y0; else rain += y0;
        if (!(fresh[i] <= 1 && mi[i] > 0.3)) { const sh = t[i + 1] > 0.3 || t[i - 1] > 0.3 || t[i + W] > 0.3 || t[i - W] > 0.3; soil[i] -= (A.writing ? 0.002 : 0.004) * (sh ? 1 : 2) * (A.terraces ? 0.7 : 1) * (mi[i] > 1.6 ? 2.2 : 1) + (ir && mi[i] < 0.3 ? 0.002 : 0); if (soil[i] < 0.42) { farm[i] = 0; if (w.tCap[i] > 0.3) t[i] = 0.05; } }
        else if (wa > 1.45) soil[i] = Math.min(1.3, soil[i] + 0.02);
      } else {
        wildF += 0.6 * g[i] + 0.9 * t[i]; if (herder) { past += g[i]; if (s.pop > 60) g[i] *= 0.985; w.graze[i] *= 0.992; }
        if (A.farming && o[2] <= farmR) { const ir = fresh[i] <= irrR, kk = (cy > 0.12 ? Math.min(1, cy + (ir ? 0.5 : 0)) : 0) * Math.min(1, soil[i]) - (c.slash ? 0.22 : 0.55) * t[i];   // grain farmers stall at the forest edge; yam and maize growers burn their way in
          if (kk > bestK && soil[i] > 0.75 && !(grove && t[i] > 0.3) && h[i] - sea < maxH && !fireT[i] && i !== i0 && w.magic[i] < 0.7) { bestK = kk; bestI = i; } }
      }
    }
    // gathering the same wild seeds year after year turns them, slowly, into a crop
    if (domS && c.know > 250) for (let p = 0; p < NP; p++) { if (!domS[p]) continue; c.dom[p] = (c.dom[p] || 0) + domS[p] * PLANTS[p].ease * 0.00035 * (s.nomad ? 0.6 : 1.3); if (c.dom[p] >= 1) { giveCrop(w, c, p); learn(w, c, 'farming'); } }
    if (tameAt >= 0 && c.know > 600 && rnd() < 0.08) { const sp = SPECIES[w.spAt[tameAt]];
      if (sp && sp.tame && !c.tame[sp.tame]) { c.tame[sp.tame] = w.year; if (TAME_GRAZE[sp.tame] && !c.grazer) { c.grazer = sp.tame; learn(w, c, 'herding'); } if (once(w, 'tame' + sp.tame)) ev(w, `The ${c.name} tame the ${sp.tame === 'cattle' ? 'aurochs' : sp.tame === 'pig' ? 'boar' : sp.tame}. Others will learn it from them.`, s.x, s.y, c.color); } }
    s.ores = ores; c._metals |= ores; s.port = seaN >= 3 && !s.nomad;
    if (!c.boom) { c.boom = c.boomL = boomOf(A); c._pool = c._pool || 0; c._poolW = c._poolW || 0; }   /* a people born during this census */
    const L = c._L || (c._L = livestock(c)), yieldF = 15 * (1 + (A.plough ? 0.3 : 0.08) * L.plough) * (A.pottery ? 1.03 : 1) * (A.mills ? 1.15 : 1) * (A.aqueducts && s.tier >= 3 ? 1.15 : 1) * (A.dikes ? 1.05 : 1) * (A.iron ? 1.1 : 1) * (A.writing ? 1.12 : 1) * c.boom;
    const fW = wildF * (s.nomad ? 3.2 : 1.1) * (0.55 + 0.45 * Math.min(wa, 1.3)) * sun, fH = hunt * 6;
    const fFr = Math.min(freshF * (A.boats ? 2.2 : 1.5), s.pop * 0.9 + 10), want = seaN ? Math.max(0, Math.min(s.pop * 0.95 + 12 - fFr, seaN * (A.sailing ? 4.5 : A.boats ? 3 : 1.1) * (!!(c.docs && c.docs.sea) ? 1.3 : 1))) : 0;
    const fSea = want > 0 ? catchFish(w, s.x, s.y, s.R + (A.sailing ? 10 : A.boats ? 4 : 1), want) : 0, fF = fFr + fSea, fishGap = want > 8 ? fSea / want : 1;
    const fA = (rain * clamp(wa, 0.2, 1.3) + irrg * (A.irrigation ? 1.15 : 1) * (0.72 + 0.28 * Math.min(wa, 1.2)) * (wa > 1.5 ? 0.8 : 1)) * yieldF * sun;
    const fP = herder ? c.boom * past * (s.nomad ? 3.4 : 2) * (c.tame.horse ? 1.15 : 1) * (0.5 + 0.5 * Math.min(wa, 1.3)) * sun : 0;
    const imp = s.imp || {}, food = (fW + fH + fF + fA + fP) * (s.blessed && w.year - s.blessed < 3 ? 1.15 : 1) * (w.year - (s.fed ?? -99) < 3 ? 1.12 : 1) * (w.year - (imp[GD.salt] ?? -99) < 5 && (herder || seaN) ? 1.05 : 1) * (s.market ? 1.1 : 1) * (1 + 0.06 * Math.min(4, s.trade)) * (c.tame.pig ? 1.05 : 1) * (s.plague > 0 ? 0.8 : 1); s.src = [fW, fH, fF, fA, fP]; c._sur += s.pop * clamp((fA + fP) / Math.max(1, food), 0, 1);
    const mx = Math.max(fW, fH, fF, fA, fP); s.way = mx === fA ? 'farm' : mx === fP ? 'herd' : mx === fF ? 'fish' : mx === fH ? 'hunt' : 'forage'; c._ways[s.way] += s.pop;
    if (!s.nomad && A.farming && bestI >= 0 && farms < Math.ceil((s.pop * 1.3) / (yieldF * 0.6))) { farm[bestI] = 1; t[bestI] = 0; g[bestI] = 0.25; }
    // tallies that decide what this people can learn
    const e = c.env; if (landN && cropS / landN > 0.35) e.crop++; if (seaN >= 3) e.coast++; if (farms && mi[i0] < 0.55 && fresh[i0] <= 2) e.dryRiver++; if (h[i0] - sea > 0.24) e.hill++; if (fresh[i0] <= 2 && !s.nomad) e.river++; if (seaN >= 2 && h[i0] - sea < 0.05 && !s.nomad) e.lowcoast++; if (s.market) c.markets++; if (s.plague > 0) c.plagued = (c.plagued || 0) + 1;
    if (s.nomad) e.nomads++; else { e.sed++; if (s.tier >= 2) e.towns++; if (s.tier >= 3) e.cities++; }
    // (scale-up) with railways the countryside feeds the cities: towns and villages send a fifth of
    // their food to the realm's cities, which share last year's haul by size. The great cities of the
    // modern age live on it. Where the richest arts are known, families get smaller: the people stop
    // short of what the land could feed.
    let feed = food; if (A.railways && !s.nomad) { if (s.tier <= 2) { const out = food * 0.2; feed -= out; c._pool += out; } else { const wt = 1 + Math.min(2, s.pop / 6000); c._poolW += wt; feed += c._poolWLast > 0 ? (c._poolLast * wt) / c._poolWLast : 0; } }
    const cap = Math.max(1, feed * (A.computers || A.networks ? 0.88 : 1)); s.cap = cap;
    if (s.pop < cap) { s.pop += s.pop * (s.nomad ? 0.036 : A.computers || A.networks ? 0.015 : 0.025) * (1 - s.pop / cap); s.note = s.pop > cap * 0.92 ? 'full' : 'grow'; if (s.note === 'full' && !s.nomad) c._full++; }
    else {
      const loss = (s.pop - cap) * (A.granaries ? 0.1 : 0.18), farmer = s.way === 'farm' || (farms > 0 && fA + 1 >= mx * 0.6);
      const why = w.aerosol > 0.3 ? 'ash' : s.plague > 0 ? 'plague' : farmer ? (blight > farms * 0.3 ? 'locusts' : wa < 0.78 ? 'drought' : wa > 1.5 && irrg > rain ? 'flood' : farms && soilS / farms < 0.66 ? 'soil' : 'crowded') : s.way === 'fish' ? (fishGap < 0.75 ? 'fish' : 'crowded') : wa < 0.78 ? 'drought' : s.way === 'hunt' || s.way === 'herd' ? (past + hunt < 2 ? 'game' : 'crowded') : 'crowded';
      s.note = why;
      if (loss > s.pop * 0.06) { c.hungry++;
        if (why === 'drought') c._dry++;
        else if (why !== 'plague' && why !== 'crowded' && why !== 'ash' && !s.nomad && w.year - s.lastFam > 45) { s.lastFam = w.year; ev(w, FAMINE[why].replace('%', s.name), s.x, s.y, c.color, s.tier >= 2 ? 0 : 1); if (why === 'fish') discover(w, 'nets', s.x, s.y); else if (why === 'soil') discover(w, 'dust', s.x, s.y); }
        if (s.pop > 80 && !s.nomad) flee(w, s, loss * 0.6); }
      s.pop -= loss;
    }
    if (s.plague > 0) { const st = w.plagues[s.pid], dead = s.pop * st.v * (A.sanitation && !st.engineered ? 0.45 : A.medicine ? 0.8 : 1) * (st.engineered ? 1 : st.virgin != null && st.virgin !== c.id && c.germ > 0.3 ? 0.15 : 1 - 0.7 * c.germ); s.pop -= dead; st.killed += dead; corpses(w, s.x, s.y, dead); st.now++; s.plague--; if (s.plague === 0) s.immune = 70; c.germ = Math.min(1, c.germ + 0.03);
      near(w, s.x, s.y, st.bad ? 14 : 9, s, false, (o) => { if (rnd() < st.catchy * (o.cult === s.cult ? 0.8 : 0.5) * (st.engineered ? 1 : 1 - 0.8 * w.cults[o.cult].germ) * (w.cults[o.cult].arts.quarantine ? 0.5 : 1)) infect(w, o, s.pid); }); } else if (s.immune > 0) s.immune--;
    if (s.pop < 5) { endSet(w, s, s.plague > 0 || s.immune > 55 ? 'plague' : s.note === 'grow' || s.note === 'full' ? 'abandoned' : 'starved'); continue; }
    s.trade *= 0.8;
    // (Oct 29) each town has its own level: it catches up with what its court knows as fast as it is tied to it
    // (distance against the realm's reach, a shared tongue, roads), so a conquered or colonised province stays
    // behind for generations; and a realm learns mostly through its well-tied towns (one court has limits)
    let wt = 1;
    if (!s.nomad) { const b0 = c.big; if (s.k == null) s.k = c.know;
      if (s === b0) { s.k = c.know; s._tie = 1; }
      else { const dx = b0 ? Math.hypot(wrapDx(s.x - b0.x), s.y - b0.y) : 0, tg = s.lang != null && c.langId != null && s.lang !== c.langId ? gapCached(w, s.lang, c.langId) : 0;
        const tie = Math.min(1, (1 / (1 + dx / Math.max(20, c.reachR || 30))) * (tg === Infinity ? 0.5 : tg > 2 ? 0.75 : 1) * (s.links ? 1.25 : 1)); s._tie = tie;
        if (s.k < c.know) { const gap = c.tech - techOf(s.k); s.k += (c.know - s.k) * 0.05 * tie * (gap >= 2 ? 0.3 : 1); } else s.k += (c.know - s.k) * 0.01; }
      s.lvl = techOf(s.k); wt = 0.4 + 0.6 * s._tie * Math.min(1, s.k / Math.max(1, c.know)); }
    c.know += wt * 0.65 * (c.kq || 1) * learnDrag(w, c, i0) * (s.pop / (c.boomL || 1)) * c.wit * (0.35 + 1.3 * c.surplus) * (1 + 0.07 * Math.min(4, c.rivals)) * (1 + 0.2 * Math.min(4, s.trade)) * (s.tower ? 1.6 : 1) * (A.writing ? 1.25 : 1) * (s.market ? 1.3 : 1) * (A.counting ? 1.08 : 1) * (A.schools ? 1.2 : 1) * (A.printing ? 1.35 : 1) * (A.computers ? 1.3 : 1) * (A.networks ? 1.3 : 1); c._n++; c._p += s.pop; total += s.pop; if (!c._b || s.pop > c._b.pop) c._b = s; if (A.engines) smoke += s.pop;
    if (s.nomad) nomadStep(w, s, c, seaN, fishGap); else townStep(w, s, c);
  }
  yield;
  if (w.anyDead) { w.sets = w.sets.filter((s) => !s.dead); w.anyDead = false; }
  buildGrid(w); territory(w);
  let alive = 0;
  for (const c of w.cults) {
    if (!c.alive) continue; if (c._n < 0) { alive++; continue; }   // too new to have been counted
    c.count = c._n; c.pop = c._p; c.big = c._b && !c._b.dead ? c._b : null;
    if (c.count === 0) { if (!w.sets.some((s) => s.cult === c.id) && !w.movers.some((m) => m.cult === c.id && (m.kind === 'refugees' || m.kind === 'settlers'))) { c.alive = false; record(w, 'gone', [c.id], { note: 'the last of them' }); endWar(w, c, true); ev(w, `The ${c.name} are gone from the world.`, null, null, c.color, c.peak > 2000 ? 2 : c.peak > 300 ? 0 : 1); if (c.peak > 300) discover(w, 'gone', null, null); } continue; }
    alive++; if (c.power) { POWER[c.power](w, c); continue; } cultYear(w, c);
  }
  yield;
  armiesYear(w); warsYear(w, WAR_HOOKS); tidyWars(w); empireYear(w); ruinsYear(w); plaguesYear(w); faithYear(w);
  yield;
  tonguesYear(w); captureYear(w); frontierYear(w); greatPowersYear(w); relicsYear(w);
  w.greenhouse = (w.greenhouse || 0) * 0.998;   // the air clears, slowly, when the chimneys stop
  if (smoke > 0) { w.greenhouse = Math.min(7, w.greenhouse + smoke * 1.1e-7); if (!w.found.smoke) { const c = w.cults.find((q) => q.alive && q.arts.engines); if (c && c.big) discover(w, 'smoke', c.big.x, c.big.y); } }
  w.stats.people = Math.round(total); w.stats.places = w.sets.length; w.stats.peoples = alive;
  const hist = w.popHist; if (w.year % w.popEvery === 0) { hist.push(Math.round(total)); if (hist.length >= 320) { let j = 0; for (let q = 0; q < hist.length; q += 2) hist[j++] = hist[q]; hist.length = j; w.popEvery *= 2; } }
  if (w.year % 100 === 0 && total > 0) { let top = null; for (const c of w.cults) if (c.alive && (!top || c.pop > top.pop)) top = c; const was = w.popCent || 0, ch = was > 50 ? (total - was) / was : 0; w.popCent = total;
    w.events.push({ year: w.year, digest: true, x: top && top.big ? top.big.x : null, y: top && top.big ? top.big.y : null, color: top ? top.color : null, text: `Year ${w.year}. ${peopleText(total)} people, ${alive} peoples, ${w.ruins.length} ruins.${top ? ` The ${top.name} (${top.kind}) are the most numerous.` : ''}${ch > 0.5 ? ' Far more people than a century ago.' : ch > 0.12 ? ' More people than a century ago.' : ch < -0.3 ? ' Far fewer people than a century ago.' : ch < -0.08 ? ' Fewer people than a century ago.' : was > 50 ? ' About as many people as a century ago.' : ''}` }); }
  if (total > (w.popPeak || 0)) w.popPeak = total; else if (w.popPeak > 20000 && total < w.popPeak * 0.6 && discover(w, 'fall', null, null)) ev(w, 'There are far fewer people in the world than there were. The old songs call this the Fall.', null, null, null, 2);
}
// roads and the traffic on them, kept apart from the yearly census so the work is spread out
export function roadsYear(w) { if (w.year % 5 === 0) roads(w); caravans(w); }

const HAUNT = ['They say the last king of the % was walled up alive under the gate, and is still knocking.', 'Lights move in the empty windows at night.', 'Shepherds who sleep there wake up somewhere else.', 'The well in the square still gives water. Nobody drinks it.', 'Every year on the day it fell, smoke rises from the cold hearths.', 'The bells ring at midnight, though the tower fell long ago.'];
function ruinsYear(w) {
  const rnd = w.rnd;
  for (const r of w.ruins) {
    const i = r.y * W + r.x;
    if (r.kind !== 'drowned' && w.water[i] === 1) { r.kind = 'drowned'; discover(w, 'drowned', r.x, r.y); }
    if (!r.looted && r.kind !== 'drowned' && rnd() < 0.03) { const s = near(w, r.x, r.y, 8, null, true); if (s) { const c = w.cults[s.cult];
        if (r.kind === 'nuked') { r.looted = true; if (rnd() < 0.2 && c.tech >= 3) { c.arts.bomb = w.year; c.bombs = (c.bombs || 0) + 1; ev(w, `Diggers from ${s.name} find something in the glass under ${r.name}, still sealed, still heavy. The old ones' writing on it says what it is. They take it home.`, r.x, r.y, c.color, 2); discover(w, 'relicbomb', r.x, r.y); } else { s.pop *= 0.8; ev(w, `Diggers from ${s.name} go into the ruins of ${r.name}. They come back sick, and they do not get better.`, r.x, r.y, c.color, 1); } }
        else if (r.haunt) { r.looted = true; infect(w, s, null, true); ev(w, `Diggers from ${s.name} open the ruins of ${r.name}. What they bring home kills half the town.`, r.x, r.y, c.color); discover(w, 'curse', r.x, r.y); }
        else if (c.know < r.know * 0.9) { c.know += Math.min((r.know - c.know) * 0.35, c.know * (w.darkUntil > w.year ? 0.08 : 0.3) + 2000); r.looted = true; ev(w, `Diggers from ${s.name} find old writings in the ruins of ${r.name}.`, r.x, r.y, c.color, (w.relics = (w.relics || 0) + 1) <= 2 ? 0 : 1); discover(w, 'relic', r.x, r.y); } } }
    // most ruins are only ruins; now and then one where something terrible happened is not
    if (!r.haunt && r.tier >= 2 && w.year - r.year > 80 && memAt(w, i, DEATH) > 0.3 && rnd() < 0.012) { r.haunt = HAUNT[(rnd() * HAUNT.length) | 0]; holySite(w, r.x, r.y, 'haunt', 0.5); ev(w, `No one goes near the ruins of ${r.name} any more. ${r.haunt.replace('%', r.cult)}`, r.x, r.y, null, discover(w, 'haunt', r.x, r.y) ? 0 : 1); }
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

// tongue distances, cached for a year (they change only as tongues split)
let _gapY = -1, _gapW = null; const _gapM = new Map();
function gapCached(w, a, b) { if (_gapY !== w.year || _gapW !== w) { _gapY = w.year; _gapW = w; _gapM.clear(); } const k = a * 65536 + b; let g = _gapM.get(k); if (g === undefined) { g = tongueGap(w, a, b); _gapM.set(k, g); } return g; }
function cultYear(w, c) {
  const rnd = w.rnd, b = c.big, A = c.arts; if (c.pop > c.peak) c.peak = c.pop;
  if (!Number.isFinite(c.know)) c.know = TECH[1]; if (!Number.isFinite(c.surplus)) c.surplus = 0;   // never let one bad number spread to everyone they meet
  if (c.pid != null && !c._kset && w.year - c.born <= 2) { c._kset = 1; let kp = 0, p = 0; for (const s of w.sets) if (!s.dead && !s.nomad && s.cult === c.id && s.k != null) { kp += s.k * s.pop; p += s.pop; } if (p > 0 && kp / p < c.know) { c.know = kp / p; c.tech = techOf(c.know); } }   /* (Oct 29) a breakaway knows what its own towns knew, not what its old court knew */
  let way = 'forage', mx = 0; for (const k in c._ways) if (c._ways[k] > mx) { mx = c._ways[k]; way = k; }
  // a way of life changes only when the new one clearly wins, and not twice in a generation
  if (way !== c.way && (c._ways[c.way] == null || mx > 1.25 * c._ways[c.way]) && w.year - (c.wayAt || -99) >= 25) { c.way = way; c.wayAt = w.year; if (b && c.count >= 3) { if (way === 'herd' && A.riding) { if (discover(w, 'riders', b.x, b.y)) ev(w, `The ${c.name} live in the saddle now.`, b.x, b.y, c.color); } else if (way === 'herd') discover(w, 'herders', b.x, b.y); else if (way === 'fish' && A.boats) discover(w, 'sea', b.x, b.y); } }
  c.nomadsWas = c.env.nomads; c.sedLast = c.env.sed;
  if (b) { c.homeT = w.tMean[b.y * W + b.x]; c.homeM = w.mi[b.y * W + b.x]; }
  c.tenet = tenetOf(w, c); c.docs = docsOf(w, c); c.zeal = !!(c.docs && c.docs.war);
  c.kind = kindOf(c); c._ownMetals = c._metals; c.metals = c._metals | importedMetals(w, c); c.gold = !!(c.metals & 16);
  if (c.env.nomads > c.count * 0.5 && c.know > TECH[3] * 0.95) c.know = TECH[3] * 0.95;   // wanderers stop at about the iron age until they settle
  // Knowledge needs carriers: this people's own numbers plus half of those it trades with. Below what a tier needs, its arts start to be forgotten, the highest first, and what the
  // people knows in general sinks toward what its numbers can hold. A plague that thins a big
  // realm costs nothing; a crash that breaks every network costs whole eras, unevenly.
  // (slice 16) the contact that counts is trade: half of each partner's people, as far as trade ties
  // the two (a few loads a year is a full tie); ties fade by a fifth a year
  { let carry = c.pop; const T = c.ties || {}; for (const k in T) { const o = w.cults[k]; T[k] *= 0.8; if (T[k] < 0.05) { delete T[k]; continue; } if (o && o.alive && !o.power) carry += 0.5 * o.pop * Math.min(1, T[k] / 3); } c.carry = carry;
    let hold = 0; while (hold < 10 && carry >= carriersFor(hold + 1)) hold++; c.hold = hold;
    if (hold < 9 && c.know > TECH[Math.max(0, hold)]) c.know -= (c.know - TECH[Math.max(0, hold)] * 0.97) * 0.06;
    let top = -1; for (const k in c.arts) { const T = ART[k]; if (T && T.tier < 99 && T.tier > hold && T.tier > top) top = T.tier; }
    const short = top >= 0 ? 1 - Math.min(1, carry / carriersFor(top)) : 0;   // how far below what the top tier needs
    if (top >= 3 && b && rnd() < 0.04 + 0.5 * short) { const lose = Object.keys(c.arts).filter((k) => ART[k] && ART[k].tier === top); const k = lose[(rnd() * lose.length) | 0]; delete c.arts[k]; record(w, 'forget', [c.id], { note: ART[k].say, terms: { carriers: carry, needed: carriersFor(top) } }); if (top >= 5 || once(w, 'forget-' + c.id)) ev(w, `The ${c.name} are too few now to keep ${ART[k].say}. Within a generation nobody remembers how it was done.`, b.x, b.y, c.color, top >= 7 ? 0 : 1); discover(w, 'forgot', b.x, b.y); } }
  c.tech = techOf(c.know);
  { const nx = nextInvention(c, rnd); if (nx && rnd() < 0.05 * (1 + 0.25 * nx.push) * (A.schools ? 1.3 : 1) * (A.printing ? 1.3 : 1)) learn(w, c, nx.k); }
  c.plagued = (c.plagued || 0) * 0.8; c.crowded = c.hungry > c.count * 0.3 ? 1 : 0;
  originsYear(w, c, b); cropRisks(w, c, b);
  const was = stanceYear(w, c); if (was === 'revere') breakPacts(w, c);
  for (const k in c.nb) { c.nb[k] *= 0.9; if (c.nb[k] < 0.05) delete c.nb[k]; }
  if (w.year >= c.ruler.until) crown(w, c);
  // cohesion: young, small and pressed peoples hold together; big, old, easy ones come apart
  // the pressures are kept by name, so the ledger and the probe can say what is pulling a realm apart
  const Q = c.q = cultureOf(w, c); c.kq = (Q ? 1 + 0.15 * Q.trade + 0.1 * Q.open - 0.12 * Q.pious : 1) * (c.docs && c.docs.world ? 0.9 : 1);
  { let bf = 0; for (const k in c.nb) { const o = w.cults[k]; if (o && o.alive && !o.power && c.nb[k] > 0.5 && tongueGap(w, o.langId, c.langId) === Infinity) { bf = 1; break; } } c.borderFoe = bf; }   // a border against strangers holds a people together
  // overextension: how far, in travel cost, the realm's towns lie from its capital, against how far its
  // administration can reach (roads, riders, writing, bureaucracy, rail, the telegraph)
  if (b) { let sum = 0, n = 0; const hh = w.h; for (const s of w.sets) { if (s.cult !== c.id || s.dead || s.nomad) continue; const dx = wrapDx(s.x - b.x), dy = s.y - b.y, d = Math.hypot(dx, dy); if (d < 1) continue; let rough = 0, pi = b.y * W + b.x;
      for (let k = 1; k <= 5; k++) { const i = Math.round(b.y + (dy * k) / 5) * W + wx(Math.round(b.x + (dx * k) / 5)); rough += Math.abs(hh[i] - hh[pi]) * 6 + (w.water[i] === 1 ? 1 : 0) + (w.t[i] > 0.6 ? 0.2 : 0); pi = i; }
      sum += d * (1 + rough / 5); n++; }
    const reach = 30 + (A.roads ? 14 : 0) + (A.riding ? 8 : 0) + (A.writing ? 8 : 0) + (A.bureaucracy ? 18 : 0) + (A.railways ? 60 : 0) + (A.telegraph ? 100 : 0);
    c.span = n ? sum / n / reach : 0; c.reachR = reach; }
  const HB = hubYear(w, c, HOOKS); if (!c.alive) return;
  const tr = c.ruler.trait, P = c.press = { base: 1.05, laws: A.laws ? 0.06 : 0, size: -c.count / 300 - 0.35 * Math.min(2, Math.max(0, (c.span || 0) - 0.9)), claim: c.claimHeld ? 0.05 : 0, age: HUB.ageDiv ? -(w.year - c.born) / HUB.ageDiv : 0, elites: HB.elites, strife: HB.strife, living: HB.living, frontier: HB.frontier, hunger: -(c.hungry / Math.max(4, c.count)) * 0.35, full: -(c._full / Math.max(4, c.count)) * 0.22,
    ruler: tr === 'law' ? 0.25 : tr === 'great' ? 0.2 : tr === 'mad' ? -0.35 : 0, wins: Math.min(0.2, c.wins * 0.04), faith: ((c.faith == null ? 0 : c.faithShare > 0.8 ? 0.08 : c.faithShare < 0.5 && c.count > 6 ? -0.1 : 0) + (c.docs && c.docs.world ? 0.04 : 0) + (c.docs && c.docs.peace ? 0.04 : 0)) * (1 + (Q ? Q.pious : 0)) * (c.faithHold == null ? 1 : 0.4 + 0.6 * c.faithHold), tongues: -0.3 * (c.foreignShare || 0), lost: -0.5 * (c.lostShare || 0), customs: -0.15 * (c.oddShare || 0), border: c.borderFoe ? 0.05 : 0, dread: c.over && c.over.kind === 'dragon' ? 0.12 : 0, steppe: nomadic(c) ? 0.25 * ((c.fi || 0) - 0.25) : 0, peace: !!(c.docs && c.docs.peace) ? 0.04 : 0 };
  let tsum = 0; for (const k in P) tsum += P[k]; const target = clamp(tsum, 0.05, 1); c.cohT = target;
  if (w.year % 10 === 0) { const ph = c.ph || (c.ph = []); ph.push([w.year, Object.assign({}, P)]); if (ph.length > 6) ph.shift(); }   /* snapshots for finding the trigger */
  c.coh += (target - c.coh) * 0.035; c.wins *= 0.97;
  if (c._dry >= Math.max(2, c.count * 0.3) && w.year - c.lastDry > 30 && b) { c.lastDry = w.year; ev(w, c.count >= 8 ? `The rains fail across the lands of the ${c.name}. ${b.name ? b.name + ' counts its grain' : 'The herds grow thin'}.` : `The rains fail for the ${c.name}.`, b.x, b.y, c.color, c.count >= 8 ? 0 : 1); if (c.count >= 8) discover(w, 'drought', b.x, b.y); }
  if (c.env.sed >= 40 && b && b.name && !c.flags.empire) { c.flags.empire = 1; ev(w, `The ${c.name} rule from ${b.name} over ${c.env.sed} towns and villages.`, b.x, b.y, c.color, once(w, 'empire') ? 2 : c.flags.empired ? 1 : 0); c.flags.empired = 1; discover(w, 'empire', b.x, b.y); }
  if (b && c.count >= 8) { const t = c.tech, ageF = t <= 2 ? 0.6 : t === 3 ? 0.9 : t === 4 ? 4 : t === 5 ? 0.7 : t === 6 ? 0.25 : t === 7 ? 1.5 : t === 8 ? 2 : 1.5, shaken = c.shaken != null && w.year - c.shaken < 12 ? 4 : 1;   /* (Oct 29) how often realms break apart follows the age (medieval fragmentation, early-modern consolidation), and a lost war shakes a realm */
    const p = (c.coh < 0.3 ? 0.04 : c.coh < 0.45 ? 0.01 : 0.0008) * ageF * shaken, roll = rnd(); if (roll < p) { const why = { p, roll, terms: P, x: b.x, y: b.y, trig: tagTrig(c, triggerOf(c, w.year)), age: w.year - (c.hub && c.hub.since0 != null ? c.hub.since0 : c.born) };
    if (c.coh < 0.24 && c.count >= 10 && w.year - (c.fellAt || -999) > 140) { why.note = `cohesion ${c.coh.toFixed(2)}`; c._why = why; collapse(w, c); } else if (w.year - Math.max(c.fellAt || -999, c.splitAt || -999) > 45) { c.splitAt = w.year; c._why = why; schism(w, c); } c._why = null; } }
  if (b && A.masonry && b.tier === 3 && b.pop > 1500 && !b.wonder && w.year - c.wonderAt > 180 && (c.gold || c.coh > 0.6 || tr === 'builder') && rnd() < 0.03 * (Q ? (1 + 1.5 * Q.build) * (1 - 0.5 * Q.horse) : 1)) {
    b.wonder = 1 + ((rnd() * 4) | 0); c.wonderAt = w.year; c.coh = Math.min(1, c.coh + 0.1);
    ev(w, `${b.name} raises ${['', 'a great pyramid', 'a colossus', 'a temple the size of a hill', 'a lighthouse seen from a day away'][b.wonder]}.`, b.x, b.y, c.color); discover(w, 'wonder', b.x, b.y); if (b.wonder === 3) holySite(w, b.x, b.y, 'wonder', 0.6);
  }
  // war
  if (c.war) { const f = w.cults[c.war.foe], K = conflictOf(w, c), lead = !K || K.sides[Math.max(0, sideOf(K, c.id))].lead === c.id; if (!f || !f.alive || (lead && !(K && K.aim) && w.year >= (K ? K.until : c.war.until))) endWar(w, c); }   /* the leads end a war; allies go when it ends. (slice 1b) a war with an aim ends by the will of its sides (warsYear) */
  else if (c.count >= 4 && b) {
    // (slice 1b) the foe is the rival best worth fighting: rivalry, what could be won, and the odds of winning it
    // (Oct 29) a realm's neighbours are the realms whose towns lie close to its own, not only those it has lately met
    if (!c.bord || w.year % 20 === c.id % 20) { const B = c.bord = {}; let nT = 0; for (const s of w.sets) { if (s.dead || s.nomad || s.cult !== c.id || (c.count > 40 && (s.id + w.year) % Math.ceil(c.count / 40) !== 0)) continue; nT++; near(w, s.x, s.y, 18 + (A.riding ? 6 : 0) + (A.roads ? 4 : 0), s, true, (u) => { if (u.cult !== c.id && !u.nomad) B[u.cult] = (B[u.cult] || 0) + 1; }); } }
    const nbOf = (k) => Math.max(c.nb[k] || 0, c.bord[k] ? 1.5 + Math.min(1.5, c.bord[k] / 4) : 0), keys = new Set([...Object.keys(c.nb), ...Object.keys(c.bord)]);
    let foe = null, fs = 0, feas = 0; const mine = strength(c, c.pop); for (const k of keys) { const o = w.cults[k]; if (!o || !o.alive || o.war || nbOf(k) <= 1.5 || !(o.env && o.env.sed > 0) || truceLeft(w, c.id, o.id) || termsBetween(w, c.id, o.id) || leagued(w, c.id, o.id) || (c.oath != null && o.oath === c.oath)) continue;
      const r = mine / Math.max(1, strength(o, o.pop)), fz = r / (r + 1), torn = o.coh < 0.35 || (o.hub && o.hub.st === 'civil') || w.year - (o.born || 0) < 15 && o.pid != null ? 1 : 0, sc = nbOf(k) * fz * (c.tech >= o.tech + 2 && !o.power ? 2.5 : 1) * (1 + torn + (claimGoal(w, c, o) || crownGoal(w, c, o) ? 1 : 0) + (c.over && c.over.kind === 'realm' && c.over.id === o.id ? 0.5 : 0)); if (sc > fs) { fs = sc; foe = o; feas = fz * (1 + torn); } }   /* (Oct 29) a realm coming apart, or one just broken off, is carved up by its neighbours */
    const horde = c.env.nomads > c.env.sed && c.env.nomads >= 9 && A.riding && (tr === 'great' || (Q && Q.horse > 0.65)) && !c.ruler.rode;
    const same = foe && sameFaith(c, foe), holy = foe && !same && c.faith != null && foe.faith != null && (c.zeal || foe.zeal);
    const deter = (foe && foe.arts.bomb ? (A.bomb ? 0.12 : 0.25) : 1) * ((w.leadAge || 0) >= 8 ? 0.3 : 1) * (foe && c.tech >= 6 && c.tech >= foe.tech + 1 && c.big && foe.big && w.mass[c.big.y * W + c.big.x] !== w.mass[foe.big.y * W + foe.big.x] && (w.leadAge || 0) < 8 ? 3 : 1);   /* (Oct 29) the norm against conquest under the bomb; and the scramble: a people two ages behind is a tempting target */   /* (Oct 29) the norm against conquest under the bomb */
    const kin = foe && foe._tp && (foe._tg[c.langId] || 0) > 0.25 * foe._tp && tongueGap(w, foe.langId, c.langId) > 0, relic = foe && crownGoal(w, c, foe), reclaim = foe && claimGoal(w, c, foe);   /* or to take back the crown of their tongue */   // "reunite the old tongue"
    if (foe && rnd() < deter * Math.min(1.2, 2 * feas) * hubPush(c) * (c.overPush || 1) * (Q ? (1 + 0.8 * Q.war) * (1 - 0.5 * Q.trade) : 1) * (kin ? 1.8 : 1) * (relic ? 1.6 : 1) * (reclaim ? 1.6 : 1) * ((horde ? 0.3 * (0.5 + 2 * (c.fi || 0)) : tr === 'great' ? 0.04 : tr === 'mad' ? 0.03 : WAR_RATE * (c.tech === 4 ? 4 : c.tech <= 3 ? 2 : 1) * (0.0025 + (A.bureaucracy ? 0.004 : 0) + (A.gunpowder ? 0.004 : 0))) + Math.min(0.03, (c.hungry / c.count) * 0.05)) * (same ? (!!(c.docs && c.docs.peace) ? 0.15 : 0.4) : holy ? 2 : 1)) { c._kin = kin; c._relic = relic; c._reclaim = reclaim; startWar(w, c, foe, horde, holy); c._kin = false; c._relic = null; }
  }
}
export function declareWar(w, c, f) { if (c.war || f.war || !c.big) return false; startWar(w, c, f, false, false); return true; }   /* (slice 4) for wars begun elsewhere: colonial conquest */
function startWar(w, c, f, horde, holy) {
  // friends of the attacked come in: leagues, fellow believers, close neighbours; then the war is everyone's
  const allies = []; for (const o of w.cults) { if (!o.alive || o === c || o === f || o.war || c.war || o.count < 3) continue; const close = (o.nb[f.id] || 0) > 1 && (o.nb[c.id] || 0) < (o.nb[f.id] || 0); if ((leagued(w, o.id, f.id) || (sameFaith(o, f) && !sameFaith(o, c)) || (tongueGap(w, o.langId, f.langId) <= 2 && tongueGap(w, o.langId, c.langId) > 2) || close) && w.rnd() < 0.35) allies.push(o); }
  const joinAllies = () => { const K = conflictOf(w, c); for (const o of allies) { if (o.war || !c.alive || !K || truceLeft(w, o.id, c.id)) continue; w.rnd(); if (joinConflict(w, o, K, 1)) tally(w, 'allied'); if (o.big) ev(w, `The ${o.name} come into the war on the side of the ${f.name}.`, o.big.x, o.big.y, o.color, 1); }
    const n = 2 + allies.length; if (n >= 4 && c.tech >= 4) { const b = c.big; if (b && discover(w, 'worldwar', b.x, b.y)) ev(w, `${n} peoples are at war at once, and there is hardly a town in the known world that has not sent its sons. They will call it the Great War.`, b.x, b.y, null, 2); } };
  const until = w.year + 6 + ((w.rnd() * 18) | 0), b = c.big, big = c.count >= 20 && f.count >= 16, again = c.fought === f.id; c.fought = f.id; f.fought = c.id; c.foughtAt = f.foughtAt = w.year;
  const K = newConflict(w, c, f, until, { horde });   /* (slice 1a) one shared record for the whole war */
  // (slice 1b) what the war is for, and what each side stands to lose
  const ratio = strength(c, c.pop) / Math.max(1, strength(f, f.pop)), far = !!(c.big && f.big && Math.hypot(wrapDx(c.big.x - f.big.x), c.big.y - f.big.y) > 45), press = hubPush(c) > 1, hungry = c.hungry > c.count * 0.25;
  K.aim = c.over && c.over.kind === 'realm' && c.over.id === f.id ? { kind: 'free', towns: [] } : pickAim(w, c, f, { relic: c._relic, reclaim: c._reclaim, horde, ratio, far, press, hungry, dragon: !!(c.over && c.over.kind === 'dragon'), trade: !!((c.q && c.q.trade > 0.5) || (c.markets || 0) >= 2) });
  // (Oct 29) some wars are fought to wipe the enemy out, not to rule them: more often in the bronze age and in the age of total war, rarely under the bomb
  { const t = c.tech, base = t <= 2 ? 0.25 : t <= 4 ? 0.15 : t <= 6 ? 0.1 : t === 7 ? 0.15 : 0.05, stranger = tongueGap(w, c.langId, f.langId) === Infinity, same = sameFaith(c, f);
    const p = Math.min(0.6, base * (stranger ? 1.4 : 0.8) * (holy ? 1.5 : 1) * (same ? 0.6 : 1) * (horde ? 1.4 : 1) * (c.ruler.trait === 'mad' ? 2 : 1)); const bk = t <= 2 ? '1_2' : t >= 9 ? '9_10' : t;
    tally(w, 'warAim_' + bk); if (K.aim.kind === 'land' && K.aim.towns.length && w.rnd() < p) { K.aim.kind = 'raze'; tally(w, 'razeAim_' + bk); } }
  let share = 0, cap = false; for (const s of w.sets) if (!s.dead && K.aim.towns.includes(s.id)) { share += s.pop; if (s === f.big) cap = true; } share /= Math.max(1, f.pop);
  K.stakes = [clamp(0.6 + (press ? 0.2 : 0) + (K.aim.kind === 'restore' || K.aim.kind === 'free' ? 0.25 : 0) + (horde ? 0.2 : 0) + (holy ? 0.15 : 0) + (hungry ? 0.15 : 0), 0.2, 1), clamp(0.35 + 1.5 * share + (cap ? 0.4 : 0) + (K.aim.kind === 'tribute' || K.aim.kind === 'free' ? 0.25 : 0), 0.3, 1.2)];
  K.lost = [0, 0]; K.pop0 = [c.pop, f.pop]; K.coh0 = [c.coh, f.coh]; K.last = w.year; K.odds = +ratio.toFixed(2);
  joinAllies();
  // big wars get a name the chronicle can come back to
  if (c.count + f.count >= 20 || c._relic) { const fb = f.big, at = K.aim.towns.length === 1 ? w.sets.find((q) => q.id === K.aim.towns[0]) : null, nm = c._relic ? `the War for ${c._relic.name}` : K.aim.kind === 'free' ? `the ${c.name} War of Freedom` : at && at.name && w.rnd() < 0.6 ? (K.aim.kind === 'trade' ? `the War of the ${at.name} Tolls` : `the War for ${at.name}`) : horde ? `the Riding of ${c.ruler.name}` : holy ? `the War of ${w.faiths[c.faith].name}` : rnd3(w) === 0 && fb && fb.name ? `the ${fb.name.replace(/^New /, '')} War` : rnd3(w) === 1 ? `the War of the ${c.name} and the ${f.name}` : `the ${['Long', 'Red', 'Bitter', 'Iron', 'Hungry', 'Burning', 'Grey', 'Sorrowful'][(w.rnd() * 8) | 0]} War`; c.war.name = f.war.name = nm; K.name = nm; }
  c.war.hid = f.war.hid = record(w, 'war', [c.id, f.id], { x: b.x, y: b.y, aim: K.aim.kind, note: (horde ? 'horde' : holy ? 'holy war' : c._reclaim ? 'to reclaim ' + c._reclaim.name : c._relic ? 'to take back ' + c._relic.name : c._kin ? 'to reunite the old tongue' : c.hungry > c.count * 0.25 ? 'hunger' : again ? 'again' : 'rivalry') + ', ' + aimText(w, K), terms: { stakes: K.stakes[0], theirStakes: K.stakes[1], odds: ratio, rivalry: c.nb[f.id] || 0, hunger: c.hungry / Math.max(4, c.count) } });
  if (horde) { c.ruler.rode = true; ev(w, `${c.ruler.name} gathers every rider of the ${c.name}. They ride on the ${f.name}.`, b.x, b.y, c.color, once(w, 'horde') ? 2 : f.count >= 20 ? 0 : 1); discover(w, 'horde', b.x, b.y); }
  else if (holy) { ev(w, `In the name of ${w.faiths[c.faith].name}, the ${c.name} go to war with the ${f.name}.`, b.x, b.y, c.color, big ? 2 : 0); discover(w, 'holywar', b.x, b.y); }
  if (c.war.name && !horde && !holy) ev(w, `The ${c.name} go to war with the ${f.name}. Before it is over it will have a name: ${c.war.name}.`, b.x, b.y, c.color, big ? 2 : 0); else ev(w, c.hungry > c.count * 0.25 ? `Hungry, the ${c.name} turn on the ${f.name}.` : c.ruler.trait === 'great' ? `${c.ruler.name} leads the ${c.name} to war against the ${f.name}.` : again ? `The ${c.name} and the ${f.name} are at war again.` : `The ${c.name} go to war with the ${f.name}.`, b.x, b.y, c.color, again ? 1 : c.count + f.count >= 30 ? 0 : 1);
}
export function endOathWar(w, c) {
  const f = w.cults[c.war.foe]; const at = c.big || f.big; record(w, 'peace', [c.id, f.id], { note: 'set aside for the oath against the dead', x: at ? at.x : null, y: at ? at.y : null });
  if (at) ev(w, `The ${c.name} and the ${f.name} lay down their quarrel. There are worse things than each other now.`, at.x, at.y, c.color, 1); endWar(w, c, true); setTruce(w, c.id, f.id, w.year + 20);
}
function endWar(w, c, quiet, out) {
  const wr = c.war; if (!wr) return; const K = conflictOf(w, c);
  if (K) { const sd = sideOf(K, c.id); if (sd >= 0 && K.sides[sd].lead !== c.id) { leaveConflict(w, c); return; } }   /* (slice 1a) an ally leaves; the war goes on without it */
  const f = w.cults[wr.foe], fw = f && f.war && (K ? f.war.cid === K.id : f.war.foe === c.id) ? f.war : null;
  const a = wr.mine ? c : f, d = wr.mine ? f : c, aw = wr.mine ? wr : fw, dw = wr.mine ? fw : wr, got = aw ? aw.taken : 0, lost = dw ? dw.taken : 0, yrs = w.year - wr.since, at = a && d ? a.big || d.big : null;
  // (slice 1b) the peace decides the truce: what changed hands, how long it took, whether a court fell or bowed
  const gain = out ? out.annexed.length + (out.razed || 0) + (out.kind === 'client' ? 3 : out.kind === 'toll' || out.kind === 'reparations' || out.kind === 'release' || out.kind === 'freed' ? 2 : out.kind === 'frontier' ? 1 : 0) : Math.abs(got - lost);
  const years = quiet || !f ? 0 : truceYears(gain, 0, yrs, out ? out.capital || out.kind === 'client' : !!((aw && aw.capital) || (dw && dw.capital)));   /* a decisive war buys a long peace */
  if (out && d && d.alive && (out.capital || out.annexed.length >= Math.max(3, 0.25 * (d.count + out.annexed.length)))) d.shaken = w.year;   /* (Oct 29) a heavy defeat shakes the beaten realm */
  if (out && out.kind === 'lost' && a && a.alive) a.shaken = w.year;
  if (K) closeConflict(w, K, years); else { c.war = null; if (fw) f.war = null; if (years) setTruce(w, c.id, f.id, w.year + years); }
  if (quiet || !f || !f.alive || !c.alive) return;
  const list = (L) => (L.length <= 1 ? L.join('') : L.length === 2 ? L.join(' and ') : `${L.slice(0, 2).join(', ')} and ${L.length - 2} other${L.length > 3 ? 's' : ''}`);
  const big = got + lost >= 8 || (out && (out.annexed.length >= 3 || out.kind === 'client')), say = out ? out.kind : got > lost + 1 ? 'won' : lost > got + 1 ? 'lost' : 'status';
  record(w, 'peace', [a.id, d.id], { note: `${wr.name ? wr.name + ': ' : ''}${out ? say + (out.annexed.length ? ' (' + out.annexed.length + ' towns)' : '') + ', ' + out.how : `${got} towns taken, ${lost} lost`} after ${yrs} years`, cause: wr.hid, x: at ? at.x : null, y: at ? at.y : null, terms: out ? { kind: out.kind, aim: out.aim, how: out.how, will: K && K.will ? K.will[0] : null, theirWill: K && K.will ? K.will[1] : null, odds: K ? K.odds : null, aimN: K && K.aim ? K.aim.towns.length : 0, prog: K ? K.prog : null, exh: K && K.exh ? K.exh.map((e) => Object.fromEntries(Object.entries(e).map(([k, v]) => [k, +v.toFixed(2)]))) : null, n: out.annexed.length, aN: a.count, dN: d.count } : undefined });
  const hordeWar = wr.horde || (fw && fw.horde), ov = d.over && d.over.kind === 'realm' && d.over.id === a.id ? d.over : null;
  const txt = say === 'annex' ? (hordeWar ? `The riders of the ${a.name} now rule ${list(out.annexed)}. In a generation they will be townsfolk themselves.` : `After ${yrs} years the ${d.name} sue for peace and give up ${list(out.annexed)} to the ${a.name}.`)
    : say === 'client' ? `The ${d.name} bow to the ${a.name}. They keep their own lords, and ${ov ? ov.house : 'one of their houses'} will collect the tribute.`
    : say === 'toll' ? `The ${d.name} make peace: a share of every toll taken at ${out.town} now goes to the ${a.name}.`
    : say === 'release' ? `The ${a.name} are beaten. The ${d.name} owe them nothing any more.`
    : say === 'freed' ? `The ${a.name} have won. They owe the ${d.name} nothing any more.`
    : say === 'frontier' ? `The ${a.name} give up their claim to ${out.name}. The frontier stays where it was.`
    : say === 'razed' ? `The ${d.name} sue for peace with what they have left. ${out.razed} of their towns are ashes.`
    : say === 'reparations' ? `The war the ${a.name} started ends badly for them: they will pay the ${d.name} for twenty years.`
    : say === 'won' ? `After ${yrs} years the ${d.name} sue for peace. ${got} of their towns now answer to the ${a.name}.`
    : say === 'lost' ? `The war the ${a.name} started ends badly for them: ${lost} towns lost to the ${d.name}.`
    : hordeWar ? `The riders of the ${a.name} go home with what they could carry.` : `The war between the ${a.name} and the ${d.name} peters out after ${yrs} years. Each side keeps what it had.`;
  ev(w, wr.name ? `${wr.name[0].toUpperCase() + wr.name.slice(1)} is over. ${txt}` : txt, at ? at.x : null, at ? at.y : null, a.color, big || wr.name ? (big ? 2 : 0) : got + lost >= 3 ? 0 : 1);
  if (got + lost >= 3 && at) { const fr = d.big || at; remember(w, (at.x + fr.x) / 2, (at.y + fr.y) / 2, DEATH, 0.35 + 0.06 * Math.min(8, got + lost), 4, 'battle', `the ${a.name} and the ${d.name} fought for ${yrs} years`); } if (big) discover(w, 'war', at ? at.x : null, at ? at.y : null);
}
const WAR_HOOKS = { endWar: (w, c, out) => endWar(w, c, false, out), annex: annexTown, subjugate, release };
function schism(w, c, quiet) {
  if (!c.big) return null; let far = null, fd = 0;
  for (const s of w.sets) { if (s.cult !== c.id || s.nomad) continue; const g = tongueGap(w, s.lang, c.langId), d = (wrapDx(s.x - c.big.x) ** 2 + (s.y - c.big.y) ** 2) * (1 + (g > 3 ? 1.5 : g * 0.25) + (s.cul !== c.culId ? 0.5 : 0)); if (d > fd) { fd = d; far = s; } }
  if (!far || fd < 16 * 16) return null;
  if (aliveN(w) >= MAXC) { let to = null; near(w, far.x, far.y, 30, far, true, (o) => { if (o.cult !== c.id && (!to || w.cults[o.cult].pop > w.cults[to.cult].pop)) to = o; }); if (!to) return null; const oc = w.cults[to.cult]; let n = 0;
    for (const s of w.sets) { if (s.cult !== c.id) continue; if (wrapDx(s.x - far.x) ** 2 + (s.y - far.y) ** 2 < 0.5 * (wrapDx(s.x - c.big.x) ** 2 + (s.y - c.big.y) ** 2)) { s.cult = oc.id; n++; } }
    if (n) { if (!quiet) record(w, 'defect', [c.id, oc.id], Object.assign({ note: `${n} towns go over` }, c._why || { x: far.x, y: far.y })); c.coh = Math.min(1, c.coh + 0.15); if (!quiet) ev(w, `${n === 1 ? far.name + ' goes' : far.name + ' and ' + (n - 1) + ' other ' + (n === 2 ? 'place go' : 'places go')} over to the ${oc.name}. The ${c.name} are too weak to stop it.`, far.x, far.y, oc.color, n < 8 ? 1 : 0); } return n ? { n, to: oc } : null; }
  const nc = newCult(w, c); let n = 0;
  if (far.lang != null && far.lang !== c.langId && w.langs && w.langs[far.lang]) { nc.langId = far.lang; nc.lang = w.langs[far.lang].snd; }   /* a breakaway speaks its own tongue at court */
  for (const s of w.sets) { if (s.cult !== c.id) continue; if (wrapDx(s.x - far.x) ** 2 + (s.y - far.y) ** 2 < wrapDx(s.x - c.big.x) ** 2 + (s.y - c.big.y) ** 2) { s.cult = nc.id; n++; } }
  nc.count = n; nc.coh = 0.9; c.coh = Math.min(1, c.coh + 0.2); if (c.hub && c.count > 0) c.hub.E *= Math.max(0.3, 1 - n / c.count); hubReset(w, nc, 0.7); if (!quiet) record(w, 'breakaway', [c.id, nc.id], Object.assign({ note: `${n} towns` }, c._why || { x: far.x, y: far.y }));
  const dx = wrapDx(far.x - c.big.x), dy = far.y - c.big.y, dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'eastern' : 'western') : dy > 0 ? 'southern' : 'northern';
  if (!quiet) ev(w, `The ${dir} ${TIER[Math.max(1, far.tier)]}s of the ${c.name} break away. They call themselves the ${nc.name}.`, far.x, far.y, nc.color, n < 6 ? 1 : 0); discover(w, 'schism', far.x, far.y);
  if (c.over && c.over.kind === 'dragon' && subjugate(w, nc, c)) { nc.over.house = c.over.house; tally(w, 'dragonKeeps'); }   /* (slice 5) what breaks off a dragon's realm still pays it, through the realm */
  return { n, to: nc, born: true };
}
// a trigger in living standard is named by what took the surplus
const tagTrig = (c, t) => (t === 'living' && c.hub && c.hub.lossTag ? c.hub.lossTag : t);
const HOOKS = { collapse: (w, c) => collapse(w, c), civilWar: (w, c) => { const b = c.big; c.coh = Math.max(0.05, c.coh - 0.15); const old = newHouse(w, c); ev(w, `There are too many lords and too few lordships. The great houses of the ${c.name} turn on one another.${old ? ` ${old.name.replace(/^t/, 'T')}, which ruled for ${w.year - old.since} years, does not survive it; ${c.house.name} takes the throne.` : ''}`, b.x, b.y, c.color, c.count >= 15 ? 0 : 1); schism(w, c); },
  revolt: (w, c) => { const b = c.big; c.coh = Math.max(0.05, c.coh - 0.1); ev(w, `The common folk of the ${c.name} have been squeezed for a generation. They rise against their lords.`, b.x, b.y, c.color, 1); schism(w, c); } };
export function collapse(w, c) {
  const b = c.big, old = c.tech, n0 = c.count, heirs = [];
  if (b && n0 >= 10) (w.claims || (w.claims = [])).push({ name: realmTitle(c), cult: c.id, cap: b.id, towns: w.sets.filter((s) => !s.dead && s.cult === c.id && !s.nomad).map((s) => s.id), year: w.year, done: false });   /* the old realm's lands, for whoever can claim them */
  c.fellAt = w.year; record(w, 'collapse', [c.id], c._why || { terms: c.press, x: b.x, y: b.y }); let went = 0;
  for (const nc of regionSuccessors(w, c)) { went += nc.count; heirs.push(nc); }   /* (slice 3) the successors form around the regional houses */
  for (let k = heirs.length; k < 3; k++) { const r = schism(w, c, true); if (r) { went += r.n; if (!heirs.includes(r.to)) heirs.push(r.to); } }
  for (const s of w.sets) if (s.cult === c.id && !s.nomad) { /* (slice 0) a falling realm is a falling government: its towns and people go on (losses come from what follows: hunger, raids, plague, broken trade) */ if (s === b) continue;
    if (w.rnd() < 0.3) { let to = null; near(w, s.x, s.y, 22, s, true, (u, q) => { if (u.cult !== c.id && (!to || q < to.q)) to = { u, q }; }); if (to) { s.cult = to.u.cult; s.trade = 0; went++; const h = w.cults[to.u.cult]; if (!heirs.includes(h)) heirs.push(h); } } }
  const who = heirs.length ? ` ${went === 1 ? 'One' : went} of ${b.name ? 'its places' : 'their camps'} ${went === 1 ? 'goes' : 'go'} over to the ${heirs.slice(0, 2).map((h) => h.name).join(' and the ')}${heirs.length > 2 ? ' and others' : ''}.` : '';
  ev(w, b.name ? `${realmTitle(c).replace(/^the /, 'The ').replace(/^The (?!.*realm)/, 'The realm of the ')} comes apart.${who} ${b.name} holds what is left.` : `The ${c.name} fall to fighting among themselves.${who}`, b.x, b.y, c.color, n0 >= 30 || once(w, 'collapse') ? 2 : 0);
  const keep = !!(c.docs && c.docs.ancestors);
  if (false && old >= 2 && w.rnd() < (keep ? 0.3 : 0.7)) {   /* no scripted dark age: each splinter re-checks its knowledge carriers */ c.know = TECH[old - 1] * (keep ? 0.85 : 0.55); c.tech = techOf(c.know); const lose = ['engines', 'sailing', 'writing', 'irrigation', 'roads'].find((k) => c.arts[k]); if (lose) { delete c.arts[lose]; ev(w, `The ${c.name} forget ${ART[lose].say}.`, b.x, b.y, c.color); } discover(w, 'darkage', b.x, b.y); }
  if (c.over && c.over.kind === 'dragon') for (const h of heirs) if (h.born === w.year && !h.over && h !== c && subjugate(w, h, c)) tally(w, 'dragonKeeps');
  c.coh = 0.85; c.born = w.year; c.flags.empire = 0; hubReset(w, c, 0.6); newHouse(w, c); if (n0 >= 12) holySite(w, b.x, b.y, 'collapse', 0.25); c.realmN = (c.realmN || 1) + 1; endWar(w, c, true);
}

function nomadStep(w, s, c, seaN, fishGap) {
  const rnd = w.rnd, herder = !!c.grazer, A = c.arts, src = s.src;
  // a settled people past the iron age has no wandering bands: they settle where they stand or go to town
  const sedL = c.sedLast || 0;   /* last census's count: this one is still being taken */
  if (((c.tech >= 4 && sedL >= 3) || (c.tech >= 5 && sedL >= 1)) && rnd() < 0.6) { const t = near(w, s.x, s.y, 60, s, true, null); if (t && t.cult === s.cult) { t.pop += s.pop; s.dead = true; w.anyDead = true; return; } if ((w.nTown || 0) < MAXS && !near(w, s.x, s.y, 5, s, true) && w.magic[s.y * W + s.x] < 0.7) { w.nTown++; s.nomad = false; s.tier = 1; s.maxTier = 1; s.age = 0; s.px = s.x; s.py = s.y; s.name = word(w, soundOf(w, s, c), w.rnd() < 0.6 ? 2 : 3); return; } if (t) t.pop += s.pop * 0.7; s.dead = true; w.anyDead = true; return; }
  const herding = herder && src[4] >= src[2] && src[4] > src[0] * 0.8;
  if (s.age > 3 && (A.farming || (!herding && c.know > 1200 && src[2] > src[0] + src[1]))) {
    let sk = 0, cnt = 0; for (const o of DISC[2]) { const y = s.y + o[1]; if (y < 1 || y >= H - 1) continue; const i = y * W + wx(s.x + o[0]); if (w.water[i]) continue; sk += (A.farming ? cropYield(w, c, i) : 0) + (w.fresh[i] <= 1 ? 0.3 : 0); cnt++; }
    if (cnt >= 6 && ((A.farming && sk / cnt > (herder ? 0.8 : 0.4)) || (!herder && seaN >= 4 && fishGap > 0.8)) && !near(w, s.x, s.y, 6, s, true) && w.magic[s.y * W + s.x] < 0.7) {
      if ((w.nTown || 0) >= MAXS) return; s.nomad = false; s.tier = 1; s.maxTier = 1; s.age = 0; s.px = s.x; s.py = s.y; w.nTown++;
      const ru = ruinAt(w, s.x, s.y);
      if (ru) { s.name = 'New ' + ru.name.replace(/^New /, ''); discover(w, 'reborn', s.x, s.y); } else s.name = word(w, soundOf(w, s, c), w.rnd() < 0.6 ? 2 : 3);
      if (!c.flags.village) { c.flags.village = 1; const fishy = !(A.farming && sk / cnt > 0.4); ev(w, `The ${c.name} put down roots at ${s.name}${fishy ? ', a fishing camp that stayed' : ', their first village'}.`, s.x, s.y, c.color, once(w, 'village') ? 0 : 1); discover(w, 'village', s.x, s.y); }
      return;
    }
  }
  s.px = s.x; s.py = s.y; s.mt = w.tickN;
  // (Oct 29) a band may cross a state's land but not camp in it, unless the two are at war
  const foreign = (i) => { const k = w.owner[i], t = k >= 0 ? w.sets[k] : null; if (!t || t.dead || t.nomad || t.cult === s.cult) return false; const o = w.cults[t.cult]; return !!o && !o.power && !atWar(w, c, o); };
  const inside = foreign(s.y * W + s.x);
  if (inside || rnd() < 0.7) { let best = inside ? -1 : siteScore(w, s.x, s.y, A.farming, herding, c) * 1.08, bx = s.x, by = s.y; const D = DISC[inside ? 10 : herder ? 6 : 3];
    for (let q = 0; q < (inside ? 14 : 6); q++) { const o = D[(rnd() * D.length) | 0], x = wx(s.x + o[0]), y = s.y + o[1]; if (y < 2 || y >= H - 2) continue; const i = y * W + x; if (w.water[i] || w.h[i] - w.params.sea > 0.42 || w.ice[i] || foreign(i)) continue;
      let sc = siteScore(w, x, y, A.farming, herding, c) * (0.9 + 0.2 * rnd()); if (near(w, x, y, 4, s)) sc *= 0.4; if (sc > best) { best = sc; bx = x; by = y; } }
    if (inside && best < 0) { const k = w.owner[s.y * W + s.x], t = w.sets[k], dx = wrapDx(s.x - t.x), dy = s.y - t.y, L = Math.max(1, Math.hypot(dx, dy)), x = wx(Math.round(s.x + (dx / L) * 5)), y = clamp(Math.round(s.y + (dy / L) * 5), 2, H - 3); if (!w.water[y * W + x]) { bx = x; by = y; } tally(w, 'bandPushed'); }   /* nowhere free in sight: away from the town whose land it is on */
    s.x = bx; s.y = by; }
  if (!(c.tech >= 4 && (c.sedLast || 0) >= 3) && !(c.tech >= 5) && (s.pop > (herder ? 150 : 46) || (s.note === 'full' && s.pop > (herder ? 55 : 34))) && Math.max(c.env.nomads, c.nomadsWas || 0) < (herder ? (c.env.sed > 4 ? 12 : bandCap(c)) : 10) && (w.nBand || 0) < MAXB) { c.env.nomads++; c.nomadsWas = (c.nomadsWas || 0) + 1; const D = DISC[herding ? 7 : 4]; for (let q = 0; q < 6; q++) { const o = D[(rnd() * D.length) | 0], x = wx(s.x + o[0]), y = s.y + o[1]; if (y < 2 || y >= H - 2 || w.water[y * W + x]) continue; const half = Math.round(s.pop * 0.45); s.pop -= half; const b = addSet(w, s.cult, x, y, half, true); b.faith = s.faith; tagFrom(w, b, s); b.px = s.x; b.py = s.y; b.mt = w.tickN; break; } }
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
  if (!s.tower && c.tech >= 2 && s.tier >= 2 && c.stance !== 'forget' && c.stance !== 'fear' && w.magic[s.y * W + s.x] > (c.stance === 'use' ? 0.35 : 0.55) && rnd() < (c.stance === 'use' ? 0.05 : 0.02)) { s.tower = true; if (!A.craft) c.arts.craft = w.year; ev(w, `A tower goes up at ${s.name}, where the air hums. Nobody admits to building it.`, s.x, s.y, c.color); discover(w, 'tower', s.x, s.y); }
  if (s.tower && s.wa < 0.7 && rnd() < 0.2) { for (const o of DISC[7]) { const y = s.y + o[1]; if (y < 0 || y >= H) continue; const i = y * W + wx(s.x + o[0]); w.wetBias[i] = Math.min(2.5, w.wetBias[i] + 0.25 * (1 - o[2] / 8)); } w.need.climate = true; if (discover(w, 'rainmaker', s.x, s.y)) ev(w, `In the third dry year, the tower at ${s.name} calls the rain. It comes.`, s.x, s.y, c.color); }
  if (s.pop > 95 && s.age > 14 && (w.nTown || 0) < MAXS && rnd() < 0.036 * hubPush(c)) colonize(w, s, c);
  else if (c.grazer && s.pop > 130 && rnd() < 0.008) pasture(w, s, c);
  const war = c.war;
  if (s.pop > 60 && w.year >= s.busy && rnd() < 0.03 * (c.ruler.trait === 'great' ? 2 : 1) * (war ? (A.bureaucracy ? 5 : 3.2) : 1)) raid(w, s, c);
  if (s.tier >= 2 && s.trade > 1.5 && rnd() < (s.tier === 3 ? 0.0016 : 0.0005) && infect(w, s, null) && w.plagues[s.pid].bad) ev(w, `A sickness nobody has a name for breaks out in ${s.name}.`, s.x, s.y, c.color);
  // a town that badly lacks something sends for it, as far as its roads and ships can reach
  if (s.need && s.tier >= 1 && rnd() < 0.12) { let g = -1, gv = 1.4; for (let k = 0; k < s.need.length; k++) if (s.need[k] > gv) { gv = s.need[k]; g = k; }
    if (g >= 0) { let best = null, bd = 1e9; const reach = A.sailing ? 140 : A.boats ? 70 : 60;   /* far suppliers are reached through middlemen, or not at all */
      near(w, s.x, s.y, reach, s, true, (o, q) => { if (!o.make || !o.make[g]) return; const oc = w.cults[o.cult]; if (atWar(w, oc, c)) return; const boats = A.boats || oc.arts.boats, byShip = s.port && o.port && boats, eff = q * (byShip ? (A.sailing || oc.arts.sailing ? 0.06 : 0.15) : 1); if (eff >= bd) return; const wet = crossesWater(w, s.x, s.y, o.x, o.y); if (wet > 1 && !boats) return; bd = eff; best = { o, wet, byShip };   /* (slice 17) by sea a load goes many times further for the same price (Diocletian's edict: land about 28 times dearer) */ });
      if (best) { const o = best.o; if (best.byShip && best.wet >= 2) { if (!tradeTrip(w, o, s, g, true)) tradeTrip(w, o, s, g, false); } else if (!tradeTrip(w, o, s, g, false) && o.port && s.port) tradeTrip(w, o, s, g, true); } } }
  // ships: ports trade with whatever other ports they can reach
  if (s.port && A.boats && s.tier >= 1 && rnd() < (s.tier >= 2 ? 0.25 : 0.12)) {
    const cand = []; near(w, s.x, s.y, A.navigation ? 140 : A.sailing ? 80 : 26, s, true, (o) => { if (o.port && o.tier >= 1) cand.push(o); });
    if (cand.length) { const o = cand[(rnd() * cand.length) | 0], wet = crossesWater(w, s.x, s.y, o.x, o.y); if (wet >= 2) tradeTrip(w, s, o, pickGoods(w, s, o), true); }
  }
}

function colonize(w, s, c) {
  const rnd = w.rnd, A = c.arts, maxD = (A.navigation ? 120 : A.sailing ? 70 : A.railways ? 40 : A.boats || A.roads ? 22 : 12 + 4 * livestock(c).cart) * (c.q && (A.boats || A.sailing) ? 1 + 0.6 * c.q.sea : 1), sea = w.params.sea; const bs = 9.5, cands = [];
  for (let q = 0; q < 12; q++) {
    const far = A.sailing && q < 3, a = rnd() * 6.2832, d = far ? 26 + rnd() * (maxD - 26) : 6 + rnd() * (Math.min(maxD, 22) - 6), x = wx(Math.round(s.x + Math.cos(a) * d)), y = Math.round(s.y + Math.sin(a) * d * 0.8); if (y < 3 || y >= H - 3) continue; const i = y * W + x;
    if (w.water[i] || w.h[i] - sea > (A.terraces ? 0.5 : 0.36) || w.gCap[i] < 0.24 || w.ice[i] || w.magic[i] > 0.75 || near(w, x, y, 8.5, null, true)) continue;
    const wet = crossesWater(w, s.x, s.y, x, y); if (wet > 1 && !A.boats) continue; if (wet > 5 && !A.sailing) continue;
    let sc = 0; for (const o of DISC[2]) { const yy = y + o[1]; if (yy < 0 || yy >= H) continue; const j = yy * W + wx(x + o[0]); if (w.water[j]) sc += A.boats ? 0.6 : 0.15; else sc += 0.12 * w.gCap[j] + (A.farming ? Math.min(1, cropYield(w, c, j) + (w.fresh[j] <= (A.irrigation ? 3 : 1) ? 0.5 : 0)) : 0) + (c.grazer ? 0.25 * w.g[j] : 0); }
    if (ruinAt(w, x, y) && !w.ruins.some((r) => r.haunt && Math.abs(wrapDx(r.x - x)) <= 2 && Math.abs(r.y - y) <= 2) && (!A.farming || cropYield(w, c, i) > 0.3)) sc += 2;   /* old stones draw settlers only where their crops would grow */
    sc *= 0.85 + 0.3 * rnd(); if (sc > bs) cands.push({ x, y, wet, sc, far: w.mass[i] !== w.mass[s.y * W + s.x] });
  }
  // the best site they can actually reach wins; across water only a shore a ship can land on, so the colony is a port
  cands.sort((p, q) => q.sc - p.sc); let best = null, route = null;
  for (const cd of cands.slice(0, 3)) { const across = cd.wet > 1; if (across) { let seaN = 0; for (const o of DISC[2]) { const yy = cd.y + o[1]; if (yy < 0 || yy >= H) continue; const j = yy * W + wx(cd.x + o[0]); if (w.water[j] === 1 && !w.ice[j]) seaN++; } if (seaN < 3) continue; }
    const r = routeToCell(w, s, cd.x, cd.y, A.boats, !across); if (r) { best = cd; route = r; break; } }
  if (!best) { if (c.grazer && rnd() < 0.5) pasture(w, s, c); return; } const ocean = best.wet > 5;
  s.pop -= 26; send(w, { kind: 'settlers', cult: s.cult, x: s.x, y: s.y, tx: best.x, ty: best.y, n: 26, from: s, wetN: best.wet, ocean, far: best.far, split: rnd() < (ocean ? 0.4 : best.wet > 1 ? 0.12 : 0.02), path: route.path, step: route.wet ? stepOf(c, true) : A.riding ? 2 : 1 });
}

// Farmers with animals, living next to grass that will not grow grain: sooner or later some of
// them take the herds out there and stop coming back.
function pasture(w, s, c) {
  const rnd = w.rnd, sea = w.params.sea; let bi = -1, bg = 0.35;
  for (let q = 0; q < 14; q++) { const a = rnd() * 6.2832, d = 6 + rnd() * 13, x = wx(Math.round(s.x + Math.cos(a) * d)), y = Math.round(s.y + Math.sin(a) * d * 0.8); if (y < 3 || y >= H - 3) continue; const i = y * W + x;
    if (w.water[i] || cropYield(w, c, i) > 0.3 || w.ice[i] || w.h[i] - sea > 0.4 || w.owner[i] >= 0 || w.g[i] <= bg || near(w, x, y, 5, null, false)) continue; bg = w.g[i]; bi = i; }
  if (c.tech >= 3) return;   // past the iron age, herders become ranchers; nobody walks off to live in the saddle
  if (bi < 0 || (w.nBand || 0) >= MAXB || Math.max(c.env.nomads, c.nomadsWas || 0) >= 12) return; let cult = s.cult; s.pop -= 30;
  if (c.env.nomads === 0 && aliveN(w) < MAXC && rnd() < 0.7) { const nc = newCult(w, c); cult = nc.id; nc.way = 'herd'; ev(w, `Herders of the ${c.name} take their animals out onto the open grass and do not come back. They call themselves the ${nc.name}.`, bi % W, (bi / W) | 0, nc.color, once(w, 'pastoral') ? 0 : 1); }
  else { c.env.nomads++; c.nomadsWas = (c.nomadsWas || 0) + 1; }
  const b = addSet(w, cult, bi % W, (bi / W) | 0, 30, true); b.faith = s.faith; tagFrom(w, b, s); b.px = s.x; b.py = s.y; b.mt = w.tickN;
}

// someone goes looking at the neighbours: half the time to trade, the rest with spears
function raid(w, s, c) {
  if (s.lost || s.occ || s.siege) return;   /* a changeling village, a dark town, an occupied or besieged one sends no soldiers */
  const rnd = w.rnd, A = c.arts, war = c.war, reach = s.R + 5 + (A.riding ? 8 : 0) + (s.nomad ? 4 : 0) + (A.boats ? 3 : 0) + (war && A.sailing ? (A.navigation ? 50 : 30) : 0) + (war && A.railways ? 20 : 0); let o = null, bd = 1e9;
  const K = war ? conflictOf(w, c) : null, aims = K && K.aim && sideOf(K, c.id) === 0 ? K.aim.towns : null;
  const far = aims ? 25 : 0;   /* (slice 2, wider Oct 29) a war's aim draws bands from further off */
  near(w, s.x, s.y, reach + 9 + far, s, false, (u, q) => { const sg = u.siege && u.cult === s.cult && war ? w.cults[u.siege.by] : null, hc = u.occ ? w.cults[u.occ.by] : sg, mine = u.occ && hc && (hc === c || (war && !atWar(w, c, hc) && atWar(w, c, w.cults[u.cult]))), free = hc && war && atWar(w, c, hc); if (mine) return;   /* (slice 2) and our besieged towns are there to be relieved */   /* (slice 1b) held by our side already; our own towns held by the enemy are there to be freed */
    const en = free || (war && atWar(w, c, w.cults[u.cult])); if ((u.cult === s.cult && !free) || (u.nomad && !s.nomad && !en)) return; const lim = (reach + u.R + (aims && aims.includes(u.id) ? far : 0)) ** 2, pref = (en ? 0.35 : 1) * (free ? 0.5 : 1) * (aims && aims.includes(u.id) ? 0.4 : 1) * (u.entrepot && en ? 0.5 : 1) * (c.oath != null && u.cult === c.oath ? 0.3 : 1);   /* at war, the enemy's entrepôts first */ if (q < lim && q * pref < bd) { bd = q * pref; o = u; } });
  // (slice 4) the aim itself may lie over the sea: a fleet can carry the war that far
  if (aims && A.sailing) { if (K._atY !== w.year) { K._atY = w.year; K._at = w.sets.filter((u) => !u.dead && aims.includes(u.id)); } const sea = A.navigation ? 200 : 80;
    for (const u of K._at) { if (u.dead || u.cult === c.id || (u.occ && !atWar(w, c, w.cults[u.occ.by] || c))) continue; const q = wrapDx(u.x - s.x) ** 2 + (u.y - s.y) ** 2; if (q < (reach + u.R + sea) ** 2 && q * 0.14 < bd) { bd = q * 0.14; o = u; } } }
  if (!o) return; const oc = w.cults[o.occ && w.cults[o.occ.by] ? o.occ.by : o.cult === c.id && o.siege && w.cults[o.siege.by] ? o.siege.by : o.cult], foe = !!war && atWar(w, c, oc), truce = !foe && (truceLeft(w, c.id, oc.id) > 0 || !!termsBetween(w, c.id, oc.id));   /* (slice 1a) under a truce there are no raids: only trade */
  const wet = crossesWater(w, s.x, s.y, o.x, o.y); if (wet > 1 && !A.boats) return; if (wet > 5 && !A.sailing) return;
  if (s.nomad && w.wall && wallBetween(w, s.x, s.y, o.x, o.y) && rnd() < 0.75) return;   // the wall holds
  if (oc.power) { if (c.oath !== oc.id && w.rnd() < 0.5) return; } else if (!foe && (truce || oc.war || (!!(c.docs && c.docs.peace) && sameFaith(c, oc)) || rnd() < (s.nomad ? 0.45 : 0.72))) { if (!o.nomad) { const gg = pickGoods(w, s, o); if (s.nomad || !tradeTrip(w, s, o, gg, false)) { if (wet === 0) { const cells = routeCells(w, s, o); if (cells) send(w, { kind: 'trade', cult: s.cult, x: s.x, y: s.y, tx: o.x, ty: o.y, n: 6, from: s, to: o, goods: gg, path: cells, step: A.riding ? 2 : 1 }); } } }   /* herders' and short trips: still along a real path */ else meet(w, c, oc, 0.15); return; }
  if (!oc.power) meet(w, c, oc, 0.1);
  let men = Math.max(6, s.pop * (s.nomad ? 0.3 : A.bureaucracy ? 0.2 : 0.14));
  if (foe) { const left = mobBudget(w, c); if (left < 6) { s.busy = w.year + 1; return; } men = Math.min(men, left); c.serving = (c.serving || 0) + men; }   /* (slice 2) in a war, only as many as the realm can raise */
  s.pop -= men; s.busy = w.year + (A.bureaucracy ? 2 : 3);
  if (wet > 5 && foe && once(w, 'invasion-' + c.id + '-' + oc.id)) ev(w, `A fleet of the ${c.name} crosses the sea to make war on the ${oc.name}.`, s.x, s.y, c.color, 0);
  // (slice 17) settled armies march by the ways, or sail a lane and land on the enemy's coast; they
  // carry food for so far, then live off the land they cross
  const army = { kind: 'army', cult: s.cult, x: s.x, y: s.y, tx: o.x, ty: o.y, n: men, n0: men, from: s, to: o, nomad: s.nomad, land: A.railways ? 2.4 : A.riding ? 1.5 : 0.8, sea: A.navigation ? 2.4 : 1.7 };
  const byLand = wet > 5 ? null : routeCells(w, s, o);
  if (!byLand && A.boats) { const lane = byShip(w, s, o.x, o.y); if (lane) { army.path = lane; army.step = stepOf(c, true); army.food = Infinity; army.landing = true; } }   /* across water: by sea and a landing */
  else { const cells = byLand; if (cells) { army.path = cells; army.step = A.railways ? 4 : A.riding ? 2 : 1; army.food = s.nomad || A.railways ? Infinity : 18 + (A.wheel ? 15 : 0) + (A.riding ? 10 : 0) + (A.roads ? 10 : 0); } }   /* riders live off their herds */
  if (!army.path) { s.pop += men; s.busy = w.year; if (foe) c.serving -= men; return; }   /* no way there: the war band stays home */
  send(w, army);
}
// on the march: food runs out with distance; then the army takes what the land has, which hurts the
// towns it passes, and starves where there is nothing to take (checked every fourth tick)
onRoad.army = (w, m) => {
  if (!m.path || m.food === Infinity || m.food == null || m.dead) return; const i = clamp(Math.round(m.y), 0, H - 1) * W + wx(Math.round(m.x));
  const moved = Math.max(1, (m.pi || 0) - (m._pi || 0)); m._pi = m.pi || 0; m.food -= moved * (1 + Math.abs(w.h[i] - w.params.sea) * 3 + w.t[i]);
  if (m.food > 0) return;
  const food = Math.min(1, (w.farm[i] ? 1 : 0) + w.g[i] * 0.5 + (w.wildCrop ? w.wildCrop[i] * 0.5 : 0));
  m.n *= 1 - 0.05 * (1 - food); m.hungry = true;   /* hunger and desertion */
  if (food > 0.2) { const k = w.owner[i]; const t = k >= 0 ? w.sets[k] : null; if (t && !t.dead && t.cult !== m.cult) { t.pop *= 0.97; t.foraged = w.year; remember(w, t.x, t.y, DEATH, 0.03, 2); if (once(w, 'forage-' + t.id + '-' + Math.floor(w.year / 25)) && t.tier >= 2) { const c = w.cults[m.cult]; ev(w, `A hungry army of the ${c.name} strips the fields around ${t.name} bare on its way through.`, t.x, t.y, c.color, 1); } } }
  if (m.n < 4) { m.done = true; const c = w.cults[m.cult]; if (m.n0 > 60 && once(w, 'starved-' + m.cult + '-' + Math.floor(w.year / 20))) ev(w, `An army of the ${c.name} starves on the march. Few come home.`, m.x, m.y, c.color, 1); record(w, 'starved', [m.cult], { x: Math.round(m.x), y: Math.round(m.y), note: `an army of ${Math.round(m.n0)} starved on the march` }); }
};

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
  for (const [key, L] of w.links) if (L.a.dead || L.b.dead || L.a.undead || L.b.undead || L.a.cult !== L.b.cult || L.path.some((i) => w.water[i] === 1 || w.lava[i])) { for (const i of L.path) if (w.road[i] > 0) w.road[i]--; w.links.delete(key); }
  for (const s of w.sets) s.links = 0; for (const L of w.links.values()) { L.a.links++; L.b.links++; }
  let budget = 4;
  for (const s of w.sets) {
    if (budget <= 0) break; if (s.nomad || s.dead || s.undead || s.links >= 3) continue; const c = w.cults[s.cult]; if (!c.arts.roads || c.power) continue;
    let o = null, bd = 18 * 18 + 1;
    near(w, s.x, s.y, 18, s, true, (u, q) => { if (u.cult !== s.cult || u.links >= 4 || q >= bd) return; const key = Math.min(s.id, u.id) + '-' + Math.max(s.id, u.id); if (w.links.has(key) || (s.noPath && s.noPath.has(u.id))) return; bd = q; o = u; });
    if (!o) continue; budget--; const path = findPath(w, s, o); if (!path) { (s.noPath || (s.noPath = new Set())).add(o.id); continue; }
    for (const i of path) if (w.road[i] < 250) w.road[i]++; w.links.set(Math.min(s.id, o.id) + '-' + Math.max(s.id, o.id), { a: s, b: o, path }); s.links++; o.links++;
    if (once(w, 'road')) ev(w, `A road now runs between ${s.name} and ${o.name}, the first in the world.`, s.x, s.y, c.color);
  }
}
function caravans(w) {
  const rnd = w.rnd; for (const L of w.links.values()) { if (rnd() > 0.3 || L.a.dead || L.b.dead) continue; const rev = rnd() < 0.5, a = rev ? L.a : L.b, b = rev ? L.b : L.a; tradeTrip(w, a, b, pickGoods(w, a, b), false); }   /* caravans on the state's roads go through the same planner as all trade */
}

/* ---------- start, and the god's hand ---------- */
// The first bands are put down in different kinds of country on purpose: a river valley, open
// grass, a cold shore, deep woods. Where each one starts decides most of what it becomes.
const START = [
  (w, i) => w.wildCrop[i] * 2.5 + (w.fresh[i] < 3 ? 2 : 0),                                                    // good farmland by water
  (w, i) => (w.wildCrop[i] < 0.3 && w.g[i] > 0.5 && w.t[i] < 0.3 ? 3 : 0) + (w.graze[i] > 0.35 ? 1 : 0),            // open grass
  (w, i) => (w.dSea[i] <= 2 ? 2.5 : 0) + (w.tMean[i] < 9 ? 1.5 : 0),                                     // cold shore
  (w, i) => (w.t[i] > 0.7 ? 3 : 0),                                                                      // deep woods
  (w, i) => w.wildCrop[i] * 2.5 + (w.fresh[i] < 3 ? 2 : 0),
  (w, i) => (w.dSea[i] <= 2 ? 3 : 0) + (w.tMean[i] > 14 ? 1 : 0),                                        // warm shore
  (w, i) => (w.mi[i] < 0.45 && w.mi[i] > 0.15 && w.tMean[i] > 12 ? 3 : 0) + (w.fresh[i] < 3 ? 1.5 : 0),  // dry country
  (w, i) => (w.tMean[i] < 3 && w.g[i] > 0.3 ? 3.5 : 0),                                                  // the cold north or south
  (w, i) => (w.wildCrop[i] < 0.3 && w.g[i] > 0.5 && w.t[i] < 0.3 ? 3 : 0),
  (w, i) => (w.h[i] - w.params.sea > 0.2 ? 3 : 0),                                                       // hills
  (w, i) => w.wildCrop[i] * 2.5 + (w.fresh[i] < 3 ? 2 : 0),
  (w, i) => (w.t[i] > 0.7 ? 3 : 0),
];
export function initPeople(w, n) {
  w.sets = []; w.cults = []; w.ruins = []; w.links = new Map(); w.movers = []; w.nextId = 1; w.greenhouse = 0; w.popHist = []; w.popEvery = 2; w.popPeak = 0; w.plagues = []; buildGrid(w);
  const got = []; n = n == null ? 11 : n; w.arrived = {};
  for (let b = 0; b < n; b++) {
    let best = -1, bs = 1.2; const want = START[b % START.length];
    for (let q = 0; q < 700; q++) { const i = (w.rnd() * N) | 0, x = i % W, y = (i / W) | 0; if (y < 8 || y > H - 9 || w.water[i] || w.gCap[i] < 0.3 || w.h[i] - w.params.sea > 0.36 || w.ice[i] || (w.massSize[w.mass[i]] || 0) < 60) continue;
      let ok = true; for (const g of got) if (wrapDx(g.x - x) ** 2 + (g.y - y) ** 2 < 34 * 34) ok = false; if (!ok) continue;
      const sc = want(w, i) + w.rnd() * 1.2 + (got.some((g) => w.mass[g.y * W + g.x] === w.mass[i]) ? 0 : 1.2); if (sc > bs) { bs = sc; best = i; } }
    if (best < 0) continue; const c = newCult(w, null), s = addSet(w, c.id, best % W, (best / W) | 0, 20 + Math.round(w.rnd() * 12), true); got.push(s); w.arrived[w.mass[best]] = [-1000];   // where people have always been
  }
  buildGrid(w);
}
export function addBand(w, x, y) {
  x = wx(Math.round(x)); y = clamp(Math.round(y), 2, H - 3); if (w.water[y * W + x] || (w.nBand || 0) >= MAXB) return null;
  if (!w.cults.some((q) => q.alive) && w.arrived) w.arrived[w.mass[y * W + x]] = [-1000];   // the first people anywhere: their land is the cradle
  const c = newCult(w, null); addSet(w, c.id, x, y, 28, true); buildGrid(w);
  ev(w, `A new people, the ${c.name}, wake ${whereAbouts(w, x, y)}.`, x, y, c.color); return c;
}
// a leap of knowledge, handed down
export const FAMILY = [null, ['pottery', 'farming', 'granaries', 'plough', 'irrigation', 'terraces', 'mills', 'dikes', 'canals', 'sanitation', 'reactors'], ['copper', 'bronze', 'iron', 'steel', 'engines', 'electricity', 'oil', 'atomic'], ['boats', 'wheel', 'riding', 'roads', 'sailing', 'bridges', 'navigation', 'railways', 'flight', 'rockets'], ['counting', 'writing', 'laws', 'alphabet', 'coinage', 'medicine', 'schools', 'bureaucracy', 'banking', 'printing', 'quarantine', 'telegraph', 'radio', 'computers', 'networks', 'genetics', 'ai', 'orbital', 'starships'], ['masonry', 'chariots', 'stirrups', 'siege', 'gunpowder', 'cannon', 'dynamite', 'bomb', 'missiles', 'germlabs']];
export function gift(w, c, fam) {
  c.know += Math.max(3000, c.know * 0.3); c.tech = techOf(c.know); c.coh = Math.min(1, c.coh + 0.15);
  const got = (FAMILY[fam || 0] || ART_KEYS).filter((k) => canLearn(c, k, true)); if (got.length) { learn(w, c, got[0]); return ART[got[0]].say; } return null;
}

/* ---------- guns, germs and steel ---------- */
// Meeting a people whose herds have given them sicknesses you have never met is the most
// dangerous thing that can happen to you. The gap, not the meeting, does the killing.
function contact(w, a, s, who) {
  const b = w.cults[s.cult], gap = (a.germ || 0) - (b.germ || 0);
  if (gap < 0.25 || s.plague > 0 || s.immune > 0 || w.year - (b.virginAt || -999) < 60 || w.rnd() > 0.12 + gap * 0.3) return false;
  if (!infect(w, s, null, true)) return false;
  const st = w.plagues[s.pid]; st.v = Math.min(0.45, 0.12 + 0.4 * gap); st.catchy = 0.75; st.virgin = b.id; b.virginAt = w.year;
  ev(w, `${who} of the ${a.name} bring ${s.name || 'the camps of the ' + b.name} a sickness the ${b.name} have never met. The ${a.name} barely notice it.`, s.x, s.y, b.color, b.count >= 6 ? 0 : 1);
  if (b.count >= 6) discover(w, 'virgin', s.x, s.y);
  return true;
}
// Once a year for each people: how much food spares hands for other work, how hard their bodies
// have become, whether anyone near is close enough in strength to keep them inventing, and what
// a people cut off from everyone slowly loses.
function originsYear(w, c, b) {
  const rnd = w.rnd, A = c.arts; c._L = livestock(c);
  c.surplus = c._p > 0 ? c._sur / c._p : 0;
  const dense = Math.min(1, c.env.towns / 6 + c.env.cities / 3);
  const gT = Math.min(1, c._L.germs * (0.2 + 0.35 * dense) + dense * 0.15);   // how hard their herds and crowds have made them
  c.germ += (gT - c.germ) * (gT > c.germ ? 0.012 : 0.004);
  let rivals = 0; for (const k in c.nb) { const o = w.cults[k]; if (o.alive && o.pop > c.pop * 0.3 && c.nb[k] > 0.3) rivals++; } c.rivals = rivals;
  // one realm alone in its world can afford to stop: a court decides the ships are a waste
  if (b && b.name && c.count >= 36 && rivals === 0 && c.coh > 0.45 && rnd() < 0.006) {
    const k = ['sailing', 'engines', 'roads'].find((q) => A[q]);
    if (k) { delete A[k]; c.banned[k] = w.year; ev(w, k === 'sailing' ? `The court at ${b.name} burns the great ships. No one of the ${c.name} may sail past sight of land.` : k === 'engines' ? `The court at ${b.name} forbids the smoking engines. Nobody nearby is strong enough to make them regret it.` : `The ${c.name} let their roads go. There is no one to trade with that they need.`, b.x, b.y, c.color, 0); discover(w, 'ban', b.x, b.y); }
  }
  for (const k in c.banned) if (w.year - c.banned[k] > 160) delete c.banned[k];
  // a small people cut off from all others forgets things it has no one to relearn from
  if (b && w.year > 250 && w.year - c.lastMet > 220 && c.pop < 1500 && c.count > 0 && c.count <= 8 && rnd() < 0.005 && !near(w, b.x, b.y, 45, null, false, null, c.id)) {
    const k = ['sailing', 'iron', 'bronze', 'writing', 'irrigation', 'boats'].find((q) => A[q]);
    if (k) { delete A[k]; c.lastMet = w.year - 60; ev(w, `Cut off from everyone for ${w.year - c.born > 300 ? 'centuries' : 'generations'}, the ${c.name} forget ${ART[k].say}.`, b.x, b.y, c.color); discover(w, 'isolated', b.x, b.y); }
  }
}

// A people that sows only one thing has bet everything on it. And forest country only opens to
// farmers whose crops grow in burned clearings.
function cropRisks(w, c, b) {
  const staples = (c.cropL || []).filter((p) => !PLANTS[p].pulse);
  c.slash = staples.some((p) => PLANTS[p].key === 'yams' || PLANTS[p].key === 'maize');
  if (c.slash && !c.slashTold && c.arts.farming && b && c.count >= 3) { c.slashTold = true; if (discover(w, 'slash', b.x, b.y)) ev(w, `The ${c.name} burn clearings in the forest and plant ${PLANTS[staples.find((p) => PLANTS[p].key === 'yams' || PLANTS[p].key === 'maize')].name} in the ash. The forest is no longer a wall.`, b.x, b.y, c.color); }
  if (staples.length === 1 && c.way === 'farm' && c.count >= 4 && b && w.year > (c.blightTo || 0) + 60 && w.rnd() < 0.0025) {
    c.blightTo = w.year + 3; ev(w, `A blight takes the ${PLANTS[staples[0]].name} of the ${c.name}. They grow nothing else. Whole villages take to the roads.`, b.x, b.y, c.color, 0); discover(w, 'blight', b.x, b.y);
    for (const s of w.sets) if (s.cult === c.id && !s.nomad && s.pop > 60) flee(w, s, s.pop * 0.15);
  }
}

const setTimeout0 = (fn) => fn();
const rnd3 = (w) => (w.rnd() * 3) | 0;
// 'the Thim', or 'the second realm of the Thim' once they have fallen and risen again
const ORD = ['', '', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'];
export const realmTitle = (c) => (c.realmN >= 2 ? `the ${ORD[Math.min(7, c.realmN)] || c.realmN + 'th'} realm of the ${c.name}` : `the ${c.name}`);
// Armies that know powder leave the ground torn up where they fight.
function scar(w, o, c) {
  for (const q of DISC[2]) { const yy = o.y + q[1]; if (yy < 1 || yy >= H - 1) continue; const i = yy * W + wx(o.x + q[0]); if (w.water[i]) continue; if (w.rnd() < 0.4) { w.ash[i] = 1; w.t[i] *= 0.5; w.farm[i] = 0; } }
  remember(w, o.x, o.y, DEATH, 0.06, 2);
}
// Burn the fields so the enemy has nothing to come back to.
function scorch(w, o, c) {
  let n = 0; for (const q of DISC[Math.min(8, o.R + 2)]) { const yy = o.y + q[1]; if (yy < 1 || yy >= H - 1) continue; const i = yy * W + wx(o.x + q[0]); if (w.farm[i]) { w.farm[i] = 0; w.ash[i] = 1; n++; if (w.rnd() < 0.2) ignite(w, i); } }
  if (n > 6 && w.year - (c.scorchTold || -99) > 40) { c.scorchTold = w.year; ev(w, `The ${c.name} burn every field around ${o.name} before they march on. The smoke is seen for three days.`, o.x, o.y, c.color, 1); discover(w, 'scorched', o.x, o.y); }
}

// What holds learning back: a dark age after the bombs (slow to lift), strong magic in the air,
// and a poor larder (thin crops, no pulses, no herd animals to plough and carry).
function learnDrag(w, c, i0) {
  let k = 1;
  if (w.darkUntil > w.year) { const len = w.darkLen || 300, left = (w.darkUntil - w.year) / len; k *= 0.25 + 0.75 * (1 - left) * (1 - left); }
  k *= 1 - 0.55 * Math.min(1, w.magic[i0]);
  if (w.surge && w.year < w.surge) k *= 0.7;
  if (c.stance === 'revere') k *= 0.85;
  const L = c._L || livestock(c), staples = (c.cropL || []).filter((p) => !PLANTS[p].pulse), best = staples.reduce((a, p) => Math.max(a, PLANTS[p].q), 0), pulse = (c.cropL || []).some((p) => PLANTS[p].pulse);
  k *= 0.55 + 0.25 * best + (pulse ? 0.05 : 0) + 0.15 * Math.min(1, L.plough + L.cart * 0.5);
  return k;
}
