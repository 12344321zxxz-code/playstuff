// Tongues and ways: language and culture as two family trees, carried by towns, not realms.
// Every starting people brings one root tongue and one root culture. A cluster of towns cut off from
// the rest of its speakers for about 150 years starts speaking a tongue of its own, so dialects by
// the bronze age and whole families with a common ancestor by the powder age fall out of geography
// and politics, not a timer. Towns slowly shift to the tongue of a numerous, urban, literate court
// (slower in the hills), and a small conquering court gives up its own tongue within four
// generations. Conquest changes who rules a town, never what it speaks.
// Culture forks with language but spreads differently: towns copy successful neighbours, and each
// culture's quirks drift under what its people live through (coasts, horses, wars, plagues, markets).
// Each quirk has a benefit and a cost, read by people.js through cultureOf().
import { record } from './ledger.js';
import { ev, discover } from './story.js';
import { W, wrapDx } from './core.js';

export const CONS = ['p', 't', 'k', 'b', 'd', 'g', 'm', 'n', 's', 'l', 'r', 'v', 'z', 'h', 'sh', 'ch', 'th', 'y', 'w', 'f', 'kh', 'q'];
export const VOW = ['a', 'e', 'i', 'o', 'u', 'a', 'o', 'ai', 'ou', 'ia', 'e'];
export const ENDS = ['n', 'r', 's', 'l', 'm', 'th', 'k', 'sh', 'd'];
export const pickN = (rnd, arr, n) => { const a = arr.slice(), o = []; while (o.length < n && a.length) o.push(a.splice((rnd() * a.length) | 0, 1)[0]); return o; };
export const makeSound = (w) => ({ c: pickN(w.rnd, CONS, 7), v: pickN(w.rnd, VOW, 4), e: pickN(w.rnd, ENDS, 3) });
export function word(w, L, syl) { let s = ''; for (let k = 0; k < syl; k++) s += L.c[(w.rnd() * L.c.length) | 0] + L.v[(w.rnd() * L.v.length) | 0]; if (w.rnd() < 0.45) s += L.e[(w.rnd() * L.e.length) | 0]; return s[0].toUpperCase() + s.slice(1); }
const tongueName = (w, L) => { let s = word(w, L, w.rnd() < 0.6 ? 1 : 2); if (/[aeiou]$/.test(s)) s = s.slice(0, -1); return s + ['ic', 'ish', 'an', 'i', 'ese', 'ar'][(w.rnd() * 6) | 0]; };

// culture quirks: what each one gives and what it costs (the numbers live where they act, in people.js)
export const QUIRKS = {
  sea:   { say: 'seafarers', hint: 'reach further over water; less tied to their fields' },
  horse: { say: 'horse people', hint: 'ride out in hordes; build little' },
  build: { say: 'builders', hint: 'raise wonders and hold together; their lords take more' },
  trade: { say: 'merchants', hint: 'learn faster and fight less' },
  war:   { say: 'warlike', hint: 'win more battles and start more wars' },
  pious: { say: 'pious', hint: 'held together by faith; slower to learn' },
  open:  { say: 'open to strangers', hint: 'take in ideas and newcomers; hold together less' },
};
const QK = Object.keys(QUIRKS);

function init(w) { if (!w.langs) { w.langs = []; w.culs = []; } }
function newLang(w, parent, snd) {
  const L = { id: w.langs.length, parent: parent ? parent.id : null, root: parent ? parent.root : w.langs.length, depth: parent ? parent.depth + 1 : 0, born: w.year, snd, name: tongueName(w, snd), alive: true, towns: 0, pop: 0 };
  w.langs.push(L); return L;
}
function newCul(w, parent, q) {
  const C = { id: w.culs.length, parent: parent ? parent.id : null, root: parent ? parent.root : w.culs.length, born: w.year, name: null, q, alive: true, towns: 0, pop: 0 };
  w.culs.push(C); return C;
}
// a daughter tongue: keeps most of the sounds, loses and gains a few
function driftSound(w, s) { const r = w.rnd, c = s.c.slice(), v = s.v.slice(), e = s.e.slice();
  for (let k = 0; k < 2; k++) c[(r() * c.length) | 0] = CONS[(r() * CONS.length) | 0];
  v[(r() * v.length) | 0] = VOW[(r() * VOW.length) | 0]; if (r() < 0.5) e[(r() * e.length) | 0] = ENDS[(r() * ENDS.length) | 0];
  return { c: [...new Set(c)], v: [...new Set(v)], e: [...new Set(e)] }; }
const driftQuirks = (w, q) => { const o = {}; for (const k of QK) o[k] = Math.min(1, Math.max(0, q[k] + (w.rnd() - 0.5) * 0.2)); return o; };

// a brand-new people with no ancestors gets a root tongue and culture; a daughter people keeps its parent's
export function rootTags(w, c, parent) {
  init(w);
  if (parent && parent.langId != null) { c.langId = parent.langId; c.culId = parent.culId; c.lang = parent.lang; return; }
  const L = newLang(w, null, c.lang); c.langId = L.id; c.lang = L.snd;
  const q = {}; for (const k of QK) q[k] = 0.15 + 0.3 * w.rnd(); q.open = 0.35 + 0.3 * w.rnd();
  const C = newCul(w, null, q); C.name = L.name + ' ways'; c.culId = C.id;
}
// a town made from another (settlers, a band splitting off, refugees) speaks what its founders spoke
export function tagFrom(w, s, from) {
  if (!from || from.lang == null) return;
  const was = s.lang; s.lang = from.lang; s.cul = from.cul;
  if (s.name && was !== s.lang && w.langs[s.lang]) s.name = word(w, w.langs[s.lang].snd, w.rnd() < 0.6 ? 2 : 3);
}
export const soundOf = (w, s, c) => (s && s.lang != null && w.langs[s.lang] ? w.langs[s.lang].snd : c.lang);

// how far apart two tongues are: steps up the tree to their common ancestor; Infinity across families
export function tongueGap(w, a, b) {
  if (a == null || b == null) return 0; if (a === b) return 0; const L = w.langs, A = L[a], B = L[b]; if (!A || !B) return 0; if (A.root !== B.root) return Infinity;
  const up = new Map(); for (let x = A, d = 0; x; x = x.parent != null ? L[x.parent] : null, d++) up.set(x.id, d);
  for (let x = B, d = 0; x; x = x.parent != null ? L[x.parent] : null, d++) if (up.has(x.id)) return up.get(x.id) + d + (w.year - Math.max(A.born, B.born)) / 600;   /* tongues drift further apart the longer they are apart */
  return Infinity;
}
export const cultureOf = (w, c) => { const C = w.culs && c.culId != null ? w.culs[c.culId] : null; return C ? C.q : null; };
export function quirksOf(w, c) { const q = cultureOf(w, c); if (!q) return []; const o = []; for (const k of QK) if (k === 'open' ? q.open > 0.62 : q[k] > 0.55) o.push(QUIRKS[k].say); if (q.open < 0.22) o.push('closed to strangers'); return o; }
// how far a town's culture sits from its court's: 0 same, 1 unrelated
export function customsGap(w, a, b) {
  if (a == null || b == null || a === b) return 0; const A = w.culs[a], B = w.culs[b]; if (!A || !B) return 0; if (A.root !== B.root) return 1;
  let d = 0; for (const k of QK) d += Math.abs(A.q[k] - B.q[k]); return Math.min(1, d / 2);
}

// Once a year, after the census. Shift, court adoption, culture imitation and pressure; every 5 years drift.
export function tonguesYear(w) {
  init(w); const rnd = w.rnd, sea = w.params.sea;
  for (const L of w.langs) { L.towns = 0; L.pop = 0; } for (const C of w.culs) { C.towns = 0; C.pop = 0; C._p = { coast: 0, horse: 0, build: 0, trade: 0, war: 0, plague: 0, n: 0 }; }
  for (const c of w.cults) { if (!c.alive || c.power) continue; if (c.langId == null) rootTags(w, c, null); c._tg = {}; c._tp = 0; c._foreign = 0; c._odd = 0; c._lost = 0; }
  // shift and imitation, town by town
  for (const s of w.sets) {
    if (s.dead) continue; const c = w.cults[s.cult]; if (!c || c.power) continue;
    if (s.lang == null) { s.lang = c.langId; s.cul = c.culId; }
    const b = c.big, A = c.arts;
    if (!s.nomad && s.lang !== c.langId && c.courtShare > 0.2) {
      const gap = tongueGap(w, s.lang, c.langId), hill = w.h[s.y * W + s.x] - sea > 0.3 ? 0.35 : 1, q = cultureOf(w, c);
      const p = 0.0015 * (b && b.tier >= 3 ? 1.5 : 1) * (A.writing ? 1.5 : 1) * Math.min(1.5, c.courtShare * 1.5) * hill * (gap <= 3 ? 2 : 1) * (q ? 0.6 + 0.8 * q.open : 1);
      if (rnd() < p) s.lang = c.langId;
    }
    if (!s.nomad && rnd() < 0.003) {   // copy the ways of whoever nearby is doing best
      let best = c, bv = c.pop * (1 + c.tech); for (const k in c.nb) { const o = w.cults[k]; if (o && o.alive && !o.power && c.nb[k] > 0.5 && o.culId != null) { const v = o.pop * (1 + o.tech); if (v > bv * 1.5) { bv = v; best = o; } } }
      if (best.culId != null && best.culId !== s.cul) s.cul = best.culId;
    }
    const L = w.langs[s.lang], C = w.culs[s.cul];
    if (L) { L.towns++; L.pop += s.pop; } c._tg[s.lang] = (c._tg[s.lang] || 0) + s.pop; c._tp += s.pop;
    if (s.lost) c._lost += s.pop; if (tongueGap(w, s.lang, c.langId) > 3) c._foreign += s.pop; c._odd += s.pop * customsGap(w, s.cul, c.culId);
    if (C) { C.towns++; C.pop += s.pop; const P = C._p; P.n++; if (s.port || s.coast) P.coast++; if (c.way === 'herd' && A.riding) P.horse++; if (s.walls || s.wonder) P.build++; if (s.market || s.trade > 0.5) P.trade++; if (c.war) P.war++; if (s.plague > 0) P.plague++; }
  }
  for (const L of w.langs) if (L.alive && L.towns === 0 && w.year - L.born > 5) { L.alive = false; L.died = w.year; }
  for (const C of w.culs) if (C.alive && C.towns === 0 && w.year - C.born > 5) { C.alive = false; C.died = w.year; }
  // the court: what share of the realm speaks its tongue; a small court adopts its subjects' speech
  for (const c of w.cults) {
    if (!c.alive || c.power || !c._tp) continue;
    c.courtShare = (c._tg[c.langId] || 0) / c._tp; c.lostShare = c._lost / c._tp; c.foreignShare = c._foreign / c._tp; c.oddShare = c._odd / c._tp;
    let maj = c.langId, mv = 0; for (const k in c._tg) if (c._tg[k] > mv) { mv = c._tg[k]; maj = +k; }
    if (c.courtShare < 0.25 && maj !== c.langId && c.env.sed >= 4) {
      c.minor = (c.minor || 0) + 1;
      if (c.minor >= 100) { const was = w.langs[c.langId], now = w.langs[maj]; c.langId = maj; c.lang = now.snd; c.minor = 0; const b = c.big;
        record(w, 'adopt', [c.id], { note: `${was.name} → ${now.name}`, x: b ? b.x : 0, y: b ? b.y : 0 });
        if (b) discover(w, 'adopt', b.x, b.y);
        if (b) ev(w, `The court of the ${c.name} no longer speaks ${was.name}. Four generations among their subjects, and their lords talk ${now.name} like everyone else.`, b.x, b.y, c.color, c.count >= 10 ? 0 : 1); }
    } else c.minor = 0;
    if (c.big && c.big.cul != null && c.culId !== c.big.cul && w.culs[c.big.cul]) c.culId = c.big.cul;   // the court lives the ways of its capital
  }
  // culture pressure: what a people lives through slowly becomes who they are (about 300 years)
  for (const C of w.culs) {
    if (!C.alive || !C._p.n) continue; const P = C._p, n = P.n, q = C.q, k = 0.003;
    const T = { sea: 0.1 + 0.8 * P.coast / n, horse: 0.05 + 0.9 * P.horse / n, build: 0.1 + 0.8 * P.build / n, trade: 0.1 + 0.8 * P.trade / n, war: 0.1 + 0.8 * P.war / n, pious: 0.2 + 2 * P.plague / n, open: 0.3 + 0.5 * P.trade / n - 0.3 * P.war / n };
    for (const key of QK) q[key] += (Math.min(1, Math.max(0, T[key])) - q[key]) * k * (0.5 + rnd());
  }
  if (w.year % 5 === 0) drift(w);
}

// Every 5 years: towns cut off from the main body of their tongue count the years, and so do towns
// at the far edge of a wide tongue (a dialect continuum: Latin across an empire, Slavic across a
// plain). A group apart for about 150 years becomes a daughter tongue (and a daughter culture).
// How far "far" is grows with roads, riders, print and rails.
const reachOf = (A) => (A.railways ? 30 : A.roads || A.riding ? 15 : 9);
const spanOf = (A) => (A.networks ? 400 : A.railways ? 110 : A.printing ? 70 : A.roads || A.riding ? 42 : 28);
function groups(w, ts, link) {
  const n = ts.length, par = ts.map((_, i) => i), find = (i) => { while (par[i] !== i) i = par[i] = par[par[i]]; return i; };
  const reach = ts.map((s) => reachOf(w.cults[s.cult].arts));
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const a = ts[i], b = ts[j]; let r = Math.max(reach[i], reach[j]) * link; r *= a.cult !== b.cult ? 0.5 : 1.6; /* one realm keeps its speakers in touch; a border cuts them off */ const dx = wrapDx(a.x - b.x), dy = a.y - b.y; if (dx * dx + dy * dy <= r * r) par[find(i)] = find(j); }
  const cl = new Map(); for (let i = 0; i < n; i++) { const r = find(i); const g = cl.get(r) || { ts: [], pop: 0 }; g.ts.push(ts[i]); g.pop += ts[i].pop; cl.set(r, g); }
  return [...cl.values()];
}
function drift(w) {
  const by = new Map(); for (const s of w.sets) if (!s.dead && s.lang != null && !w.cults[s.cult].power) { const a = by.get(s.lang); if (a) a.push(s); else by.set(s.lang, [s]); }
  for (const [lid, ts] of by) {
    const L = w.langs[lid]; if (ts.length === 1) { ts[0].apart = 0; continue; }
    const cl = groups(w, ts, 1); let main = null; for (const g of cl) if (!main || g.pop > main.pop) main = g;
    let heart = main.ts[0]; for (const s of main.ts) if (s.pop > heart.pop) heart = s;
    const far = [];
    for (const g of cl) for (const s of g.ts) {
      let out = g !== main;
      if (!out) { const D = spanOf(w.cults[s.cult].arts), dx = wrapDx(s.x - heart.x), dy = s.y - heart.y; out = dx * dx + dy * dy > D * D; }
      s.apart = out ? (s.apart || 0) + 5 : Math.max(0, (s.apart || 0) - 10);
      if (s.apart >= 150) far.push(s);
    }
    if (far.length >= 2) for (const g of groups(w, far, 1.3)) if (g.ts.length >= 3 && (g.pop > 800 || g.ts.every((s) => s.nomad || s.tier <= 1))) fork(w, L, g);   /* wandering bands drift apart too */
  }
}
function fork(w, L, g) {
  const D = newLang(w, L, driftSound(w, L.snd)); let cx = 0, cy = 0, big = g.ts[0];
  const cc = {}; for (const s of g.ts) cc[s.cul] = (cc[s.cul] || 0) + s.pop; let mc = null, mv = 0; for (const k in cc) if (cc[k] > mv) { mv = cc[k]; mc = +k; }
  const P = w.culs[mc], DC = P ? newCul(w, P, driftQuirks(w, P.q)) : null; if (DC) DC.name = D.name + ' ways';
  for (const s of g.ts) { s.lang = D.id; s.apart = 0; if (DC && s.cul === mc) s.cul = DC.id; cx += s.x; cy += s.y; if (s.pop > big.pop) big = s; }
  // a realm whose capital now speaks the new tongue speaks it at court too
  for (const c of w.cults) if (c.alive && c.big && c.big.lang === D.id && c.langId === L.id) { c.langId = D.id; c.lang = D.snd; if (DC && c.big.cul === DC.id) c.culId = DC.id; }
  record(w, 'tongue', g.ts.map((s) => s.cult).filter((v, i, a) => a.indexOf(v) === i), { note: `${L.name} → ${D.name}`, x: big.x, y: big.y });
  const fam = w.langs[L.root];
  if (g.pop > 1500 || D.depth === 1) { const nm = big.name || 'the camps'; ev(w, D.depth >= 3 ? `In ${nm} they speak ${D.name} now, a tongue of the ${fam.name} family that the rest of its speakers can no longer follow.` : `Cut off for generations, the people of ${nm} no longer speak ${L.name} but a daughter of it: ${D.name}.`, big.x, big.y, null, 1); }
  discover(w, D.depth >= 3 ? 'family' : 'dialect', big.x, big.y);
}

// Babel: every town of a realm suddenly speaks one of a few new tongues, split by region
export function confound(w, c) {
  init(w); const ts = w.sets.filter((s) => !s.dead && s.cult === c.id); if (ts.length < 3) return 0;
  const k = Math.min(4, Math.max(2, Math.round(ts.length / 6))), seeds = pickN(w.rnd, ts, k), base = w.langs[c.langId] || newLang(w, null, c.lang);
  const kids = seeds.map(() => newLang(w, base, driftSound(w, driftSound(w, base.snd))));
  for (const s of ts) { let bi = 0, bd = 1e9; seeds.forEach((q, i) => { const d = wrapDx(q.x - s.x) ** 2 + (q.y - s.y) ** 2; if (d < bd) { bd = d; bi = i; } }); s.lang = kids[bi].id; s.apart = 0; }
  if (c.big) { c.langId = c.big.lang; c.lang = w.langs[c.langId].snd; } return k;
}

// colour by family (one of ten hues) with each tongue of the family its own lightness (slice 14,
// after the language maps of EU5)
const HUES = [8, 40, 70, 105, 150, 185, 212, 245, 285, 325];
export function tongueHsl(w, id) {
  const L = w.langs && w.langs[id]; if (!L) return [0, 0, 55]; const F = familyOf(w, id), hue = HUES[(F * 7) % 10];
  const sh = ((L.id * 2654435761) >>> 0) % 5;
  return [hue, 48 + (sh % 2) * 10, L.id === F ? 48 : 34 + sh * 7];
}
export function tongueColor(w, id) { const [h, s, l] = tongueHsl(w, id); return `hsl(${h},${s}%,${l}%)`; }

// A family is every tongue that split off within the last 1500 years from one ancestor (Romance from
// Latin); branches that parted longer ago than that are separate families of one origin (Romance and
// Germanic under Indo-European). Early in a world every tongue is still in its origin's family.
export const FAMILY_DEPTH = 1500;   /* (22 Oct) families hold together about as long as Romance has since Latin */
export function familyOf(w, id) { let L = w.langs[id]; while (L && L.parent != null && w.year - L.born < FAMILY_DEPTH) L = w.langs[L.parent]; return L ? L.id : id; }
