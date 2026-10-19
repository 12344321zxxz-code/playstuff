// What memory grows into. A place that remembers hard enough for long enough wakes up, and what
// wakes depends on what it remembers: a battlefield raises a host that fights its war again, a
// plague town sends the shambling dead looking for the living, a sacked city crowns a dead king
// with a grudge, a famine leaves something hungry in the cold woods, a drowned town rings its
// bells under the water, an old enough forest grows a court, a shrine grows a saint. Each one
// fades when the memory under it does, so peoples can starve them, or feed them.
import { record } from './ledger.js';
import { foundDeadRealm } from './dead.js';
import { W, H, N, clamp, wx, wrapDx, DISC } from './core.js';
import { ev, discover, once } from './story.js';
import { near, endSet, flee, infect } from './people.js';
import { remember, memAt, KINDS, DEATH, WILD, FIRE, DEEP, FAITH, FROST, NK } from './memory.js';
import { addDragon } from './fantasy.js';
import { addKraken } from './sea.js';
import { ignite } from './life.js';

const KIND = {
  host: { mem: DEATH, name: (s) => `the Host of ${s.place}`, rise: (s) => `Where ${s.why}, the dead have not stopped fighting. On still nights the field fills with them.`, gone: (p) => `The host at ${p.place} lies down at last.` },
  shamblers: { mem: DEATH, name: (s) => `the dead of ${s.place}`, rise: (s) => `The dead of ${s.why} get up and start walking.`, gone: (p) => `The last of ${p.name} falls and does not get up.` },
  lich: { mem: DEATH, name: (s) => `the Dead King of ${s.place}`, rise: (s) => `In the ashes of ${s.place}, something puts on the old crown. It remembers who burned its city.`, gone: (p) => `${cap(p.name)} is gone. Its hall is only a ruin again.` },
  burned: { mem: DEATH, name: (s) => `the Burned of ${s.place}`, rise: (s) => `Out of the glass where ${s.place} stood, the burned come walking. They do not feel the cold, and they are looking for everyone who was not there that day.`, gone: (p) => `The last of ${p.name} lie down in the ash.` },
  hunger: { mem: DEATH, name: (s) => `the Hunger of ${s.place}`, rise: (s) => `Something walks the cold woods around ${s.place}, where ${s.why}. It is never full.`, gone: (p) => `No one has seen ${p.name} in years.` },
  drowned: { mem: DEEP, name: (s) => `the Bells of ${s.place}`, rise: (s) => `Fishermen hear bells under the water where ${s.place} went down. On stormy nights the drowned walk up the beach.`, gone: (p) => `The bells of ${p.place} have stopped.` },
  fey: { mem: WILD, name: (s) => `the Court under ${s.place}`, rise: (s) => `There is a court under the trees of ${s.place}. People who go in come out years later, or not at all.`, gone: (p) => `The trees of ${p.place} are only trees now.` },
  saint: { mem: FAITH, name: (s) => `the Saint of ${s.place}`, rise: (s) => `Pilgrims say the sick are healed at ${s.place}. Some of them are.`, gone: (p) => `Nobody is healed at ${p.place} any more.` },
};
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const SUB = { nuked: 'burned', battle: 'host', plague: 'shamblers', sacked: 'lich', famine: 'hunger', drowned: 'drowned', holy: 'saint' };
const FADE = 0.22, RISE = 0.45;
export const SPIRIT_KINDS = KIND;

export function initSpirits(w) { w.spirits = []; w.rise = breach; }
export function spiritNear(w, x, y, r, kind) { for (const p of w.spirits) if ((!kind || p.kind === kind) && wrapDx(p.x - x) ** 2 + (p.y - y) ** 2 < r * r) return p; return null; }
const placeName = (w, x, y) => { const s = near(w, x, y, 20, null, true); if (s && s.name) return s.name; const r = w.ruins.find((q) => wrapDx(q.x - x) ** 2 + (q.y - y) ** 2 < 25); return r ? r.name : ['the Grey Hills', 'the Old Wood', 'the Long Shore', 'the High Moor', 'the Still Water'][(x * 7 + y) % 5]; };

function rise(w, kind, x, y, why, extra) {
  if (!KIND[kind]) return null;
  const dead = (k) => KIND[k].mem === DEATH;
  const wild = w.deadAge || (w.surge && w.year < w.surge);
  if (w.spirits.length >= (wild ? 40 : 18) || w.spirits.filter((p) => p.kind === kind).length >= (dead(kind) ? (wild ? 8 : 2) : kind === 'winter' ? (wild ? 3 : 2) : wild ? 8 : 4) || (dead(kind) && w.spirits.filter((p) => dead(p.kind)).length >= (wild ? 24 : 4)) || spiritNear(w, x, y, wild ? 7 : 14)) return null;
  const place = extra && extra.place || placeName(w, x, y), s = { why: why || 'something happened', place };
  // one dead king in ten is something worse: a power with a realm of its own that lasts for ages
  let great = (kind === 'lich' && w.rnd() < (w.surge && w.year < w.surge ? 0.3 : 0.1)) || kind === 'winter' || (extra && extra.great);
  if (great && kind === 'lich' && w.cults.filter((c) => c.alive && c.power === 'dead').length >= (wild ? 3 : 2)) great = false;   // only so many realms of the dead at once
  const p = Object.assign({ id: (w.spiritN = (w.spiritN || 0) + 1), kind, x, y, px: x, py: y, str: great ? 3 : 1, great, R: great ? 6 : 0, born: w.year, span: great ? (kind === 'winter' ? 350 : 900) + ((w.rnd() * 250) | 0) : (KIND[kind].mem === DEATH ? 90 : 220) + ((w.rnd() * 160) | 0), place, why: s.why, name: KIND[kind].name(s), last: -99, pact: null }, extra || {});
  if (great && kind === 'lich') { p.name = p.name.replace('Dead King', 'Undying King'); }
  if (great && kind === 'lich') { w.spirits.push(p); foundDeadRealm(w, p); w.spirits.pop(); }
  w.spirits.push(p); if (great) record(w, 'power-rise', ['p:' + p.id], { x, y, note: `${p.name}: ${s.why}`, terms: { memory: memAt(w, y * W + x, KIND[kind].mem) } }); if (great && kind === 'lich') { ev(w, `${cap(p.name)} does not stay in its ruin. It calls the dead of the whole country to it, and they come. A realm of the dead is born.`, x, y, null, 2); discover(w, 'undying', x, y); }
  const told = (w.riseN = w.riseN || {})[kind] = (w.riseN[kind] || 0) + 1; ev(w, KIND[kind].rise(s), x, y, null, told <= 2 || !w.deadAge ? 0 : 1); discover(w, 'sp-' + kind, x, y); return p;
}

export function spiritsYear(w) {
  const rnd = w.rnd;
  // a place that has remembered hard enough for long enough wakes
  for (const site of w.sites) {
    const wild = w.deadAge || (w.surge && w.year < w.surge);
    if (site.risen || w.year - site.year < (wild ? 2 : 12) || rnd() > (wild ? 0.3 : 0.08)) continue;
    const i = site.y * W + site.x; if (memAt(w, i, site.kind) < (wild ? 0.3 : RISE)) continue;
    let kind = SUB[site.sub]; if (!kind) continue;
    if (kind === 'hunger' && w.tMean[i] > 9) kind = 'host';
    if (kind === 'drowned' && w.water[i] !== 1 && w.dSea[i] > 3) continue;
    const p = rise(w, kind, site.x, site.y, site.why, kind === 'lich' ? { grudge: site.by, place: site.place } : null); if (p) site.risen = true;
  }
  // an old enough wood grows a court
  if (rnd() < (w.surge && w.year < w.surge ? 0.5 : 0.15)) for (let q = 0; q < 40; q++) { const i = (rnd() * N) | 0; if (w.water[i] || w.t[i] < 0.8 || memAt(w, i, WILD) < 0.75) continue; rise(w, 'fey', i % W, (i / W) | 0, 'the oldest trees'); break; }
  for (const p of w.spirits) {
    if (!KIND[p.kind]) { p.dead = true; continue; }   /* winter magic is gone, even from old saves */
    const i = p.y * W + p.x, m = memAt(w, i, KIND[p.kind].mem);
    if (p.realm != null) continue;   // an Undying King with a realm lives as that realm (dead.js)
    if (p.great) { realmYear(w, p); if (p.dead) continue; }
    if ((m < FADE && !p.great) || p.str < 0.2 || w.year - p.born > p.span) { p.dead = true; if (p.great) record(w, 'power-fall', ['p:' + p.id], { x: p.x, y: p.y, note: `${p.name}: ${p.str < 0.2 ? 'broken' : w.year - p.born > p.span ? 'its time ran out' : 'its memory faded'}`, terms: { strength: p.str, age: (w.year - p.born) / p.span, memory: m } }); ev(w, KIND[p.kind].gone(p), p.x, p.y, null, 1); continue; }
    p.px = p.x; p.py = p.y; ACT[p.kind](w, p, m);
  }
  if (w.spirits.some((p) => p.dead)) w.spirits = w.spirits.filter((p) => !p.dead);
  oldOnes(w);
}
// Great powers hold a country. Their realm grows while they are strong, drains the life out of
// the living inside it, keeps its own memory topped up, and after its long age begins to fail.
function realmYear(w, p) {
  const age = w.year - p.born, old = age > p.span * 0.8, k = KIND[p.kind].mem;
  p.R = Math.max(3, Math.min(p.kind === 'winter' ? 40 : 30, p.R + (old ? -0.8 : p.str > 1.5 ? 0.35 : 0.05)));
  if (old) p.str *= 0.97; else p.str = Math.min(4, p.str + 0.01);
  if (old && !p.failing) { p.failing = true; ev(w, `${cap(p.name)} is failing. Its borders shrink a little every year.`, p.x, p.y, null, 0); }
  // the realm feeds itself
  for (let q = 0; q < 8; q++) { const a = w.rnd() * 6.283, r = Math.sqrt(w.rnd()) * p.R; remember(w, p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, k, 0.12 * p.str / 3, 3); }
  near(w, p.x, p.y, p.R, null, false, (s) => { const c = w.cults[s.cult]; s.pop *= 1 - (p.kind === 'winter' ? 0.03 : 0.025) * warded(w, s); c.hurt = (c.hurt || 0) + 0.3; if (s.pop > 80 && w.rnd() < 0.15) flee(w, s, s.pop * 0.1); });
  // the living can break a great power, if enough of them come at once with enough knowledge
  if (age > 30 && w.rnd() < 0.03) { let force = 0, lead = null; const who = new Set(); near(w, p.x, p.y, p.R + 25, null, true, (s) => { const c = w.cults[s.cult]; force += s.pop * (1 + c.tech) * (c.stance === 'use' ? 1.6 : c.stance === 'fear' ? 1.3 : 1); who.add(s.cult); if (!lead || s.pop > lead.pop) lead = s; });
    if (lead && who.size >= 2 && force > 45000 * p.str * (old ? 0.35 : 1)) { const c = w.cults[lead.cult]; p.dead = true; record(w, 'power-fall', ['p:' + p.id, ...who], { x: p.x, y: p.y, note: `${p.name}: broken by ${who.size} peoples`, terms: { force: force / (45000 * p.str), strength: p.str } }); ev(w, `The living march on ${p.name} together, more of them than anyone has seen in one place. ${p.kind === 'winter' ? 'They break the ice throne' : p.kind === 'fey' ? 'They cut down the oldest trees and burn them' : 'They burn its hall to the stones'}. ${lead.name} keeps what is left of the crown.`, p.x, p.y, c.color, 2); discover(w, 'realmfall', p.x, p.y); for (const o of DISC[8]) { const yy = p.y + o[1]; if (yy < 0 || yy >= H) continue; w.mem[(yy * W + wx(p.x + o[0])) * NK + k] *= 0.3; } c.coh = Math.min(1, c.coh + 0.3); return; } }
  if (p.kind === 'lich' && w.rnd() < 0.5) { ACT.lich(w, p); if (w.rnd() < 0.2) { const a = w.rnd() * 6.283, r = p.R * (0.5 + 0.5 * w.rnd()); rise(w, 'shamblers', wx(Math.round(p.x + Math.cos(a) * r)), clamp(Math.round(p.y + Math.sin(a) * r), 2, H - 3), `${p.name} called them`, { place: p.place }); } }
}
// A well too full breaks open, and what comes out of it is whatever it was full of.
export function breach(w, q, k) {
  const x = q.x, y = q.y, nm = q.name || 'the wellspring';
  if (k === DEATH) rise(w, 'lich', x, y, `${nm} broke open`, { great: true, place: nm.replace(/^the /, '') });
  else if (k === WILD) rise(w, 'fey', x, y, `${nm} broke open`, { great: true, place: nm.replace(/^the /, '') });
  else if (k === FAITH) rise(w, 'saint', x, y, `${nm} shone`, { place: nm.replace(/^the /, '') });
  else if (k === FIRE) { const d = addDragon(w, x, y); if (d) { ev(w, `${cap(nm)} boils over, and out of it climbs ${d.name}, wet and new and already enormous.`, d.x, d.y, null, 0); discover(w, 'dragon', d.x, d.y); } }
  else if (k === DEEP) { for (const o of DISC[14]) { const yy = y + o[1]; if (yy < 0 || yy >= H) continue; const i = yy * W + wx(x + o[0]); if (w.water[i] === 1 && w.params.sea - w.h[i] > 0.2) { const kr = addKraken(w, i % W, (i / W) | 0); if (kr) ev(w, `${cap(nm)} empties into the sea, and the sea fills with something. Sailors name it ${kr.name}.`, kr.x, kr.y, null, 0); break; } } }
}
const hurt = (w, s, k) => { s.pop *= 1 - k; const c = w.cults[s.cult]; c.hurt = (c.hurt || 0) + k * 6; };
const warded = (w, s) => { const c = w.cults[s.cult]; return c.stance === 'fear' ? 0.45 : s.tower ? 0.6 : 1; };
const ACT = {
  host(w, p) { near(w, p.x, p.y, 6, null, false, (s) => { hurt(w, s, 0.012 * warded(w, s)); if (s.pop > 200 && w.rnd() < 0.1) flee(w, s, s.pop * 0.05); }); },
  burned(w, p) { ACT.shamblers(w, p); if (w.rnd() < 0.3) { const s = near(w, p.x, p.y, 8, null, false); if (s) hurt(w, s, 0.03); } },
  shamblers(w, p) {
    let tg = null; near(w, p.x, p.y, 30, null, false, (s, q) => { if (!tg || q < tg.q) tg = { s, q }; });
    if (!tg) { p.str *= 0.93; return; } const s = tg.s, dx = wrapDx(s.x - p.x), dy = s.y - p.y, l = Math.hypot(dx, dy);
    if (l > 2.5) { p.x = wx(Math.round(p.x + (dx / l) * 2)); p.y = clamp(Math.round(p.y + (dy / l) * 2), 1, H - 2); p.str *= 0.97; return; }
    const c = w.cults[s.cult];
    if (s.tower && w.rnd() < 0.5) { p.str *= 0.5; if (w.rnd() < 0.3) ev(w, `The dead come to the walls of ${s.name}. The tower is lit all night, and in the morning they are ash.`, s.x, s.y, c.color, 1); return; }
    if (infect(w, s, null, true)) { if (w.year - p.last > 20) { p.last = w.year; ev(w, `${cap(p.name)} reach ${s.name || 'the camps of the ' + c.name}. The sickness they carry is the one that killed them.`, s.x, s.y, c.color, 0); } }
    hurt(w, s, 0.05 * warded(w, s)); p.str = Math.min(1.2, p.str * 0.9);
  },
  lich(w, p) {
    p.str = Math.min(1.6, p.str * 0.985 + memAt(w, p.y * W + p.x, DEATH) * 0.01);
    if (w.rnd() > 0.3) return; let tg = null, bs = 0;
    near(w, p.x, p.y, 36, null, true, (s, q) => { if (w.cults[s.cult].power) return; const sc = (s.pop + 50) / (q + 30) * (p.grudge != null && w.cults[s.cult].name === p.grudge ? 4 : 1); if (sc > bs) { bs = sc; tg = s; } });
    if (!tg) return; const s = tg, c = w.cults[s.cult], A = c.arts;
    if (c.tech >= 3 && s.pop > 500 && w.rnd() < 0.08 + (c.stance === 'use' ? 0.15 : 0) + (A.iron ? 0.05 : 0) + (c.stance === 'fear' ? 0.06 : 0)) {
      p.dead = true; record(w, 'power-fall', ['p:' + p.id, c.id], { x: p.x, y: p.y, note: `${p.name}: its hall burned by the ${c.name}` }); ev(w, `The ${c.name} march on the hall of ${p.name} and burn it to the stones. ${s.name} keeps the crown.`, p.x, p.y, c.color, 0); discover(w, 'lichslain', p.x, p.y);
      for (const o of DISC[4]) { const yy = p.y + o[1]; if (yy < 0 || yy >= H) continue; w.mem[(yy * W + wx(p.x + o[0])) * NK + DEATH] *= 0.3; } remember(w, s.x, s.y, FAITH, 0.5, 3, 'holy', `the ${c.name} burned the hall of ${p.name}`); c.coh = Math.min(1, c.coh + 0.2); return;
    }
    hurt(w, s, 0.14 * p.str * warded(w, s)); flee(w, s, s.pop * 0.05);
    if (w.year - p.last > 25) { p.last = w.year; ev(w, `${cap(p.name)} sends its dead against ${s.name}${p.grudge && c.name === p.grudge ? '. It has not forgotten who burned its city' : ''}.`, s.x, s.y, c.color, s.tier >= 2 ? 0 : 1); }
    if (s.pop < 60) { endSet(w, s, 'sacked', p.name); p.str = Math.min(1.6, p.str + 0.15); }
  },
  hunger(w, p) {
    if (w.tMean[p.y * W + p.x] > 10) { p.str *= 0.8; return; }
    near(w, p.x, p.y, 11, null, false, (s) => hurt(w, s, (s.nomad ? 0.04 : 0.012) * warded(w, s)));
    for (const o of DISC[6]) { const yy = p.y + o[1]; if (yy < 0 || yy >= H) continue; w.graze[yy * W + wx(p.x + o[0])] *= 0.9; }
    if (w.rnd() < 0.3) { p.x = wx(p.x + ((w.rnd() * 5) | 0) - 2); p.y = clamp(p.y + ((w.rnd() * 5) | 0) - 2, 2, H - 3); }
  },
  drowned(w, p) { near(w, p.x, p.y, 10, null, true, (s) => { if (s.port) hurt(w, s, 0.01 * warded(w, s)); }); },
  fey(w, p) {
    // the court's forest creeps over fields and roads
    if (!p.R) p.R = 6; if (memAt(w, p.y * W + p.x, WILD) > 0.6) p.R = Math.min(p.great ? 26 : 16, p.R + 0.15);
    /* the court grows only into fallow land at its edge: fields still worked hold it back */
    const C = p.cells; if (C && C.length) for (let q = 0; q < 14; q++) { const c = C[(w.rnd() * C.length) | 0], k = (w.rnd() * 4) | 0, yy = clamp(((c / W) | 0) + (k === 2 ? -1 : k === 3 ? 1 : 0), 1, H - 2), xx = wx((c % W) + (k === 0 ? 1 : k === 1 ? -1 : 0)), i = yy * W + xx;
      if (w.water[i] || w.farm[i] || w.urban[i] || (w.courtOf && w.courtOf[i])) continue; if (p.pact != null && w.owner[i] >= 0 && w.sets[w.owner[i]] && w.sets[w.owner[i]].cult === p.pact) continue; w.road[i] = 0; w.t[i] = Math.min(1, w.t[i] + 0.2); remember(w, xx, yy, WILD, 0.05, 1); }
    // and now and then the wild hunt rides out
    if (w.rnd() < 0.07) { let hit = 0; near(w, p.x, p.y, p.R + 10, null, false, (s) => { if (p.pact === s.cult) return; s.pop *= 0.85; hit++; w.cults[s.cult].hurt = (w.cults[s.cult].hurt || 0) + 1; }); if (hit && w.year - p.last > 20) { p.last = w.year; ev(w, `The wild hunt rides out of ${p.place}. In the morning ${hit === 1 ? 'one village is' : hit + ' villages are'} missing their young.`, p.x, p.y, null, 0); discover(w, 'wildhunt', p.x, p.y); } }
    near(w, p.x, p.y, 9, null, false, (s) => {
      const c = w.cults[s.cult];
      if (p.pact === c.id) { s.blessed = w.year; return; }
      if (p.pact == null && c.stance === 'revere' && w.rnd() < 0.2) { p.pact = c.id; c.pacts = (c.pacts || 0) + 1; ev(w, `The ${c.name} make a bargain with ${p.name}: a child every seventh year, and their fields will never fail.`, s.x, s.y, c.color, 0); discover(w, 'pact', s.x, s.y); return; }
      hurt(w, s, 0.006); if (w.rnd() < 0.02 && w.year - p.last > 25) { p.last = w.year; ev(w, `Children from ${s.name || 'the camps of the ' + c.name} go into the trees of ${p.place} and come back strange, or do not come back.`, s.x, s.y, c.color, 1); }
    });
  },
  saint(w, p) { near(w, p.x, p.y, 11, null, false, (s) => { const c = w.cults[s.cult]; c.coh = Math.min(1, c.coh + 0.002); if (s.plague > 0 && w.rnd() < 0.35) { s.plague = 0; s.immune = 30; if (w.year - p.last > 30) { p.last = w.year; ev(w, `The sickness turns back at ${s.name}. The pilgrims credit ${p.name}.`, s.x, s.y, c.color, 1); discover(w, 'miracle', s.x, s.y); } } }); },
};
// A people that changes its mind about the old things breaks the bargains it made with them.
export function breakPacts(w, c) {
  for (const p of w.spirits) if (p.pact === c.id) {
    p.pact = null; c.pacts = Math.max(0, (c.pacts || 1) - 1); const b = c.big;
    near(w, p.x, p.y, 14, null, false, (s) => { if (s.cult === c.id) { s.pop *= 0.75; s.blessed = 0; } });
    remember(w, p.x, p.y, DEATH, 0.4, 4, 'famine', `the ${c.name} broke faith with ${p.name}`);
    ev(w, `The ${c.name} stop paying ${p.name}. That autumn, nothing they planted comes up.`, b ? b.x : p.x, b ? b.y : p.y, c.color, 0); discover(w, 'broken', p.x, p.y);
  }
  for (const d of w.dragons) if (d.pacts && d.pacts.has(c.id)) { d.pacts.delete(c.id); const b = c.big; ev(w, `The ${c.name} send no more gold to ${d.name}. It notices.`, b ? b.x : d.lx, b ? b.y : d.ly, c.color, 0); }
}
// Old ones wake where the deep remembers. They do not attack; the coasts near them go mad.
function oldOnes(w) {
  for (const k of w.krakens) {
    k.age = (k.age || 0) + 1;
    // the deep ones pull the coast down to them, and send their storms ashore
    if (k.age > 40 && w.rnd() < 0.04) { const sea = w.params.sea; let n = 0; for (const o of DISC[16]) { const yy = k.y + o[1]; if (yy < 2 || yy >= H - 2) continue; const i = yy * W + wx(k.x + o[0]); if (w.water[i] !== 1 && w.h[i] - sea < 0.03 && w.dSea[i] <= 2) { w.h[i] = sea - 0.005; n++; } } if (n > 6) { w.need.water = true; w.stamp.land++; const s = near(w, k.x, k.y, 20, null, true); ev(w, `The sea rises along the coast where ${k.name} sleeps and does not go back down.${s ? ' The lower streets of ' + s.name + ' are under water.' : ''}`, k.x, k.y, null, 0); discover(w, 'sunkcoast', k.x, k.y); } }
    if (k.age > 30 && w.rnd() < 0.03 && w.storms && w.storms.length < 6) { w.storms.push({ x: k.x, y: k.y, str: 1.4, life: 22, spin: w.rnd() * 6 }); }
    // a whole coast can come to worship it
    near(w, k.x, k.y, 30, null, true, (s) => { if (s.port && !s.deepCult && w.rnd() < 0.004) { s.deepCult = k.name; const c = w.cults[s.cult]; ev(w, `${s.name} stops sending its catch to market. Its people go down to the water at night now, and they have started to look alike.`, s.x, s.y, c.color, 1); discover(w, 'deepcult', s.x, s.y); } if (s.deepCult) { s.pop *= 0.985; s.trade = 0; remember(w, s.x, s.y, DEEP, 0.03, 2); } });
  }
  for (const k of w.krakens) near(w, k.x, k.y, 26, null, true, (s) => {
    if (!s.port || w.rnd() > 0.006) return; const c = w.cults[s.cult]; if (c.stance === 'fear') return;
    s.pop *= 0.6; remember(w, s.x, s.y, DEEP, 0.45, 3, 'drowned', `the people of ${s.name} walked into the sea`);
    ev(w, `The people of ${s.name} walk into the sea, singing. ${cap(k.name)} has been dreaming of them.`, s.x, s.y, c.color, 0); discover(w, 'madness', s.x, s.y);
  });
}
// What a ley storm does to what it passes over.
export function stormPass(w, st) {
  const i = st.y * W + st.x, rnd = w.rnd;
  if (st.kind === WILD) { for (const o of DISC[3]) { const yy = st.y + o[1]; if (yy < 0 || yy >= H) continue; const j = yy * W + wx(st.x + o[0]); if (w.water[j]) continue; w.t[j] = Math.min(1, w.t[j] + 0.2); w.graze[j] = Math.min(2, w.graze[j] + 0.3); if (w.farm[j]) w.farm[j] = 0; } }
  else if (st.kind === FIRE) { if (rnd() < 0.4 && !w.water[i]) ignite(w, i); }
  else if (false && st.kind === FROST) { for (const o of DISC[4]) { const yy = st.y + o[1]; if (yy < 0 || yy >= H) continue; const j = yy * W + wx(st.x + o[0]); w.mem[j * NK + FROST] = Math.min(1.2, w.mem[j * NK + FROST] + 0.12); w.t[j] *= 0.95; } }
  else if (st.kind === FAITH) { for (const o of DISC[3]) { const yy = st.y + o[1]; if (yy < 0 || yy >= H) continue; const j = yy * W + wx(st.x + o[0]); w.soil[j] = Math.min(1.3, w.soil[j] + 0.05); w.wetBias[j] = Math.min(2, w.wetBias[j] + 0.1); } }
  const s = near(w, st.x, st.y, 4, null, false); if (!s || st.hit === s.id) return; st.hit = s.id; const c = w.cults[s.cult];
  if (st.kind === DEATH) { hurt(w, s, 0.1); if (rnd() < 0.04) rise(w, 'shamblers', s.x, s.y, s.name || 'the camps', { place: s.name || 'the ' + c.name }); }
  else if (st.kind === DEEP) hurt(w, s, 0.04);
  else if (st.kind === FAITH) c.coh = Math.min(1, c.coh + 0.1);
  if (s.tier >= 2 && rnd() < 0.5) ev(w, st.kind === DEATH ? `The ley storm passes over ${s.name}. Every dog in the town howls, and in the morning the old are dead.` : st.kind === WILD ? `The ley storm passes over ${s.name}. By spring the fields are forest and the deer walk the streets.` : st.kind === FIRE ? `The ley storm passes over ${s.name}. The sky burns red for three nights.` : st.kind === DEEP ? `The ley storm passes over ${s.name}. A fog comes in from nowhere and stays a month.` : `The ley storm passes over ${s.name}. The sick get up from their beds.`, s.x, s.y, c.color, 1);
}
