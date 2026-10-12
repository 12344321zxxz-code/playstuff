// What memory grows into. A place that remembers hard enough for long enough wakes up, and what
// wakes depends on what it remembers: a battlefield raises a host that fights its war again, a
// plague town sends the shambling dead looking for the living, a sacked city crowns a dead king
// with a grudge, a famine leaves something hungry in the cold woods, a drowned town rings its
// bells under the water, an old enough forest grows a court, a shrine grows a saint. Each one
// fades when the memory under it does, so peoples can starve them, or feed them.
import { W, H, N, clamp, wx, wrapDx, DISC } from './core.js';
import { ev, discover, once } from './story.js';
import { near, endSet, flee, infect } from './people.js';
import { remember, memAt, KINDS, DEATH, WILD, FIRE, DEEP, FAITH, NK } from './memory.js';
import { ignite } from './life.js';

const KIND = {
  host: { mem: DEATH, name: (s) => `the Host of ${s.place}`, rise: (s) => `Where ${s.why}, the dead have not stopped fighting. On still nights the field fills with them.`, gone: (p) => `The host at ${p.place} lies down at last.` },
  shamblers: { mem: DEATH, name: (s) => `the dead of ${s.place}`, rise: (s) => `The dead of ${s.why} get up and start walking.`, gone: (p) => `The last of ${p.name} falls and does not get up.` },
  lich: { mem: DEATH, name: (s) => `the Dead King of ${s.place}`, rise: (s) => `In the ashes of ${s.place}, something puts on the old crown. It remembers who burned its city.`, gone: (p) => `${cap(p.name)} is gone. Its hall is only a ruin again.` },
  hunger: { mem: DEATH, name: (s) => `the Hunger of ${s.place}`, rise: (s) => `Something walks the cold woods around ${s.place}, where ${s.why}. It is never full.`, gone: (p) => `No one has seen ${p.name} in years.` },
  drowned: { mem: DEEP, name: (s) => `the Bells of ${s.place}`, rise: (s) => `Fishermen hear bells under the water where ${s.place} went down. On stormy nights the drowned walk up the beach.`, gone: (p) => `The bells of ${p.place} have stopped.` },
  fey: { mem: WILD, name: (s) => `the Court under ${s.place}`, rise: (s) => `There is a court under the trees of ${s.place}. People who go in come out years later, or not at all.`, gone: (p) => `The trees of ${p.place} are only trees now.` },
  saint: { mem: FAITH, name: (s) => `the Saint of ${s.place}`, rise: (s) => `Pilgrims say the sick are healed at ${s.place}. Some of them are.`, gone: (p) => `Nobody is healed at ${p.place} any more.` },
};
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const SUB = { battle: 'host', plague: 'shamblers', sacked: 'lich', famine: 'hunger', drowned: 'drowned', holy: 'saint' };
const FADE = 0.22, RISE = 0.45;
export const SPIRIT_KINDS = KIND;

export function initSpirits(w) { w.spirits = []; }
export function spiritNear(w, x, y, r, kind) { for (const p of w.spirits) if ((!kind || p.kind === kind) && wrapDx(p.x - x) ** 2 + (p.y - y) ** 2 < r * r) return p; return null; }
const placeName = (w, x, y) => { const s = near(w, x, y, 20, null, true); if (s && s.name) return s.name; const r = w.ruins.find((q) => wrapDx(q.x - x) ** 2 + (q.y - y) ** 2 < 25); return r ? r.name : ['the Grey Hills', 'the Old Wood', 'the Long Shore', 'the High Moor', 'the Still Water'][(x * 7 + y) % 5]; };

function rise(w, kind, x, y, why, extra) {
  const dead = (k) => KIND[k].mem === DEATH;
  if (w.spirits.length >= 16 || w.spirits.filter((p) => p.kind === kind).length >= (dead(kind) ? 2 : 4) || (dead(kind) && w.spirits.filter((p) => dead(p.kind)).length >= 4) || spiritNear(w, x, y, 14)) return null;
  const place = extra && extra.place || placeName(w, x, y), s = { why: why || 'something happened', place };
  const p = Object.assign({ id: (w.spiritN = (w.spiritN || 0) + 1), kind, x, y, px: x, py: y, str: 1, born: w.year, span: (KIND[kind].mem === DEATH ? 90 : 220) + ((w.rnd() * 160) | 0), place, why: s.why, name: KIND[kind].name(s), last: -99, pact: null }, extra || {});
  w.spirits.push(p); ev(w, KIND[kind].rise(s), x, y, null, 0); discover(w, 'sp-' + kind, x, y); return p;
}

export function spiritsYear(w) {
  const rnd = w.rnd;
  // a place that has remembered hard enough for long enough wakes
  for (const site of w.sites) {
    if (site.risen || w.year - site.year < 12 || rnd() > 0.08) continue;
    const i = site.y * W + site.x; if (memAt(w, i, site.kind) < RISE) continue;
    let kind = SUB[site.sub]; if (!kind) continue;
    if (kind === 'hunger' && w.tMean[i] > 9) kind = 'host';
    if (kind === 'drowned' && w.water[i] !== 1 && w.dSea[i] > 3) continue;
    const p = rise(w, kind, site.x, site.y, site.why, kind === 'lich' ? { grudge: site.by, place: site.place } : null); if (p) site.risen = true;
  }
  // an old enough wood grows a court
  if (rnd() < 0.15) for (let q = 0; q < 40; q++) { const i = (rnd() * N) | 0; if (w.water[i] || w.t[i] < 0.8 || memAt(w, i, WILD) < 0.75) continue; rise(w, 'fey', i % W, (i / W) | 0, 'the oldest trees'); break; }
  for (const p of w.spirits) {
    const i = p.y * W + p.x, m = memAt(w, i, KIND[p.kind].mem);
    if (m < FADE || p.str < 0.2 || w.year - p.born > p.span) { p.dead = true; ev(w, KIND[p.kind].gone(p), p.x, p.y, null, 1); continue; }
    p.px = p.x; p.py = p.y; ACT[p.kind](w, p, m);
  }
  if (w.spirits.some((p) => p.dead)) w.spirits = w.spirits.filter((p) => !p.dead);
  oldOnes(w);
}
const hurt = (w, s, k) => { s.pop *= 1 - k; const c = w.cults[s.cult]; c.hurt = (c.hurt || 0) + k * 6; };
const warded = (w, s) => { const c = w.cults[s.cult]; return c.stance === 'fear' ? 0.45 : s.tower ? 0.6 : 1; };
const ACT = {
  host(w, p) { near(w, p.x, p.y, 6, null, false, (s) => { hurt(w, s, 0.012 * warded(w, s)); if (s.pop > 200 && w.rnd() < 0.1) flee(w, s, s.pop * 0.05); }); },
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
    near(w, p.x, p.y, 36, null, true, (s, q) => { const sc = (s.pop + 50) / (q + 30) * (p.grudge != null && w.cults[s.cult].name === p.grudge ? 4 : 1); if (sc > bs) { bs = sc; tg = s; } });
    if (!tg) return; const s = tg, c = w.cults[s.cult], A = c.arts;
    if (c.tech >= 3 && s.pop > 500 && w.rnd() < 0.08 + (c.stance === 'use' ? 0.15 : 0) + (A.iron ? 0.05 : 0) + (c.stance === 'fear' ? 0.06 : 0)) {
      p.dead = true; ev(w, `The ${c.name} march on the hall of ${p.name} and burn it to the stones. ${s.name} keeps the crown.`, p.x, p.y, c.color, 0); discover(w, 'lichslain', p.x, p.y);
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
  else if (st.kind === FAITH) { for (const o of DISC[3]) { const yy = st.y + o[1]; if (yy < 0 || yy >= H) continue; const j = yy * W + wx(st.x + o[0]); w.soil[j] = Math.min(1.3, w.soil[j] + 0.05); w.wetBias[j] = Math.min(2, w.wetBias[j] + 0.1); } }
  const s = near(w, st.x, st.y, 4, null, false); if (!s || st.hit === s.id) return; st.hit = s.id; const c = w.cults[s.cult];
  if (st.kind === DEATH) { hurt(w, s, 0.1); if (rnd() < 0.04) rise(w, 'shamblers', s.x, s.y, s.name || 'the camps', { place: s.name || 'the ' + c.name }); }
  else if (st.kind === DEEP) hurt(w, s, 0.04);
  else if (st.kind === FAITH) c.coh = Math.min(1, c.coh + 0.1);
  if (s.tier >= 2 && rnd() < 0.5) ev(w, st.kind === DEATH ? `The ley storm passes over ${s.name}. Every dog in the town howls, and in the morning the old are dead.` : st.kind === WILD ? `The ley storm passes over ${s.name}. By spring the fields are forest and the deer walk the streets.` : st.kind === FIRE ? `The ley storm passes over ${s.name}. The sky burns red for three nights.` : st.kind === DEEP ? `The ley storm passes over ${s.name}. A fog comes in from nowhere and stays a month.` : `The ley storm passes over ${s.name}. The sick get up from their beds.`, s.x, s.y, c.color, 1);
}
