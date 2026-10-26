// The hub: elites, posts and what the common people keep (after Turchin's secular cycles).
// A settled realm feeds a class of would-be lords out of its surplus. While it grows, new towns,
// conquests and offices make room for them. When growth stops the lords keep multiplying anyway (they
// follow income with a lag of a generation or two), so there are more of them than posts: they press
// for wars of expansion, squeeze the common people harder, split into factions, and if the state is
// too weak to hold them, fight a civil war that kills many of them off. Then the cycle can begin again.
//
// Per realm (c.hub):  E elites · P posts · pi = E/P · X the share taken from the producers ·
//   L living standard of the common people · A authority (the state's grip) · inc smoothed elite income
//   st: 'grow' | 'press' (too many lords, pushing outward) | 'factions' | 'civil'
// It never touches towns itself: it returns named pressures for cohesion, odds for war and
// colonising, and calls back into people.js (schism / collapse) through the hooks passed in.
import { record, triggerOf } from './ledger.js';

// tunables, exported so tools/exp.mjs patches can A/B them. on:false = the old age clock instead.
export const HUB = { on: true, K: 0.2, elitesW: 0.45, sizeDiv: [220, 130, 80], ageDiv: 0 };
const FORMS = {          // government forms: base take, how many posts they make, a name
  chiefs:   { x: 0.10, pm: 1.0, say: 'chiefs' },
  crown:    { x: 0.15, pm: 1.15, say: 'a crown' },
  empire:   { x: 0.20, pm: 1.35, say: 'an imperial court' },
  council:  { x: 0.12, pm: 1.4, say: 'a council of houses' },
  nation:   { x: 0.18, pm: 1.9, say: 'a modern state' },
};
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

function formFor(c) {
  const A = c.arts;
  if (A.railways || A.engines || A.industry) return 'nation';
  if (A.printing && (c.markets || 0) >= 3) return 'council';
  if (A.bureaucracy && c.count >= 20) return 'empire';
  if (A.writing || A.laws) return 'crown';
  return 'chiefs';
}
// posts: villages hold a headman, towns a lord, cities a court (tier 2+ double), plus offices
export function postsOf(c) {
  const e = c.env, A = c.arts, f = FORMS[c.hub ? c.hub.form : 'chiefs'];
  const base = 0.4 * Math.max(0, e.sed - e.towns) + 1 * Math.max(0, e.towns - e.cities) + 2 * e.cities + 0.15 * e.nomads;
  const offices = 1 + (A.writing ? 0.2 : 0) + (A.laws ? 0.1 : 0) + (A.bureaucracy ? 0.3 : 0) + (A.schools ? 0.15 : 0);
  return Math.max(1, (base + 1.5 * Math.min(6, c.wins || 0) + (c.colonyPosts || 0) + (c.clergyPosts || 0) + (c.merchantPosts || 0)) * offices * f.pm);   /* colonies are offices for the overlord's lords */
}

export function makeHub(c, w, pi0) {
  const P = postsOf(c);
  return { E: P * (pi0 ?? 0.8), P, pi: pi0 ?? 0.8, X: 0.12, L: 1, A: 0.6, inc: null, st: 'grow', since: w.year, form: formFor(c), formAt: w.year, hiPi: 0, loPi: 0, lowL: 0, until: 0, eased: 0 };
}

// hooks: { schism(w, c), collapse(w, c) }. Returns the cohesion pressures from the hub.
export function hubYear(w, c, hooks) {
  if (!HUB.on) return { elites: 0, strife: 0, living: 0, frontier: 0 };
  const rnd = w.rnd, A = c.arts, b = c.big; let h = c.hub || (c.hub = makeHub(c, w));
  const settled = c.env.sed >= 4 && c.env.sed >= c.env.nomads;
  if (settled && h.since0 == null) h.since0 = w.year;   /* when this realm, as a settled state, began */
  // government form changes slowly: at most once in 30 years
  const nf = formFor(c); if (nf !== h.form && w.year - h.formAt >= 30) { h.form = nf; h.formAt = w.year; }
  const F = FORMS[h.form];
  h.P = postsOf(c);
  const fed = 1 - Math.min(1, (c.hungry || 0) / Math.max(1, c.count));
  h.X = clamp(F.x + 0.2 * Math.max(0, h.pi - 1) + (c.tribute || 0) + (c.owe || 0) + (c.q ? 0.03 * c.q.build : 0) + 0.04 * (c.temple || 0) - (w.year < h.eased ? 0.05 : 0), 0.05, 0.6);
  // living standard: what the common people keep, and how this year's surplus compares with what they are used to.
  // Every loss is tagged by source so the ledger can name it; the 40-year baseline adapts, so realms recover.
  const loss = { plague: 0.5 * Math.min(1, c.plagued || 0), fey: c.lostShare || 0, tribute: c.tribute || 0, hunger: 1 - fed, war: Math.min(0.5, (c.war && c.war.lost ? 0.05 * c.war.lost : 0) + 1.5 * (c.serveShare || 0)),   /* (slice 2) men away at war are missing from the fields */ fallout: c.poisoned || 0 };
  const S = (0.25 + (c.surplus || 0)) * fed * (1 - loss.fey) * (1 - loss.plague) * (1 - loss.war) * (1 - loss.fallout);
  h.S40 = h.S40 == null ? S : h.S40 + (S - h.S40) / 40;
  const ratio = Math.max(0.6, Math.min(1.3, Math.sqrt(S / Math.max(1e-6, h.S40))));
  h.L = fed * (1 - h.X) / (1 - 0.12) * ratio;
  let lt = 'hunger', lv = 0; for (const k in loss) if (loss[k] > lv) { lv = loss[k]; lt = k; } h.lossTag = lv > 0.05 ? lt : null;
  // elite income follows surplus and take with a lag of about 40 years
  const raw = (c.pop / (100 * (c.boomL || 1))) * (0.25 + (c.surplus || 0)) * Math.max(0.02, h.X - (c.tribute || 0) - (c.owe || 0)) * fed * (1 - (c.lostShare || 0)) * (1 - (c.occShare || 0)) * (c.recv == null ? 1 : c.recv) + (c.tributeIn || 0) + (c.tollIn || 0) * 0.02;   /* entrepôt tolls feed the lords too */   /* tribute leaves for the overlord; what comes in from colonies feeds this realm's lords */
  const tr = c.treasure > 0.01 ? c.treasure * 0.05 : 0; if (tr) c.treasure -= tr;   /* a released hoard drains into the court over a generation */
  h.inc = h.inc == null ? raw : h.inc + (raw + tr - h.inc) / 50;   /* elites follow income with a lag of two generations */
  const cap = Math.max(1, h.inc / HUB.K);
  const noise = 1 + 0.15 * (2 * rnd() - 1);
  h.E += h.E * 0.016 * noise * (1 - h.E / cap);           // lords multiply while their income allows
  if (c.war && c.war.lost) h.E *= 1 - 0.004 * Math.min(5, c.war.lost);   // and die in lost battles
  if (!settled) h.E += (0.8 * h.P - h.E) * 0.2;   /* bands and herders have chiefs, not a class of lords: no overproduction until they settle */
  h.E = Math.max(0.5, h.E); h.pi = h.E / h.P;
  // authority: a fed, lawful, united realm with lords it can place is strong; a crowded court is not
  const aT = clamp(0.25 + 0.35 * h.L + (A.laws ? 0.06 : 0) + (A.bureaucracy ? 0.08 : 0) + 0.2 * (c.coh - 0.5) - 0.4 * Math.max(0, h.pi - 1.1) - (h.st === 'civil' ? 0.25 : 0), 0, 1);
  h.A += (aT - h.A) * 0.08;
  // counters with hysteresis
  h.hiPi = h.pi > 1.5 ? h.hiPi + 1 : 0; h.loPi = h.pi < 1.2 ? h.loPi + 1 : 0; h.lowL = h.L < 0.7 ? h.lowL + 1 : 0;
  const why = (note, extra) => Object.assign({ terms: c.press, trig: (() => { const t = triggerOf(c, w.year); return t === 'living' && h.lossTag ? h.lossTag : t; })(), age: w.year - (c.hub && c.hub.since0 != null ? c.hub.since0 : c.born), note, x: b ? b.x : 0, y: b ? b.y : 0, d: { pi: +h.pi.toFixed(2), A: +h.A.toFixed(2), L: +h.L.toFixed(2), X: +h.X.toFixed(2) } }, extra);
  if (settled && b) {
    if (h.st === 'grow' && h.pi > 1.1 && w.year - h.since >= 10) { h.st = 'press'; h.since = w.year; }
    else if (h.st === 'press' && h.pi < 0.95 && w.year - h.since >= 10) { h.st = 'grow'; h.since = w.year; }
    else if (h.st === 'press' && h.hiPi >= 15) { h.st = 'factions'; h.since = w.year; record(w, 'factions', [c.id], why(`${h.pi.toFixed(1)} would-be lords for every post`)); }
    else if (h.st === 'factions' && h.loPi >= 20) { h.st = 'press'; h.since = w.year; }
    else if (h.st === 'factions' && h.A < 0.35 && c.count >= 6) {
      h.st = 'civil'; h.since = w.year; h.until = w.year + 8 + ((rnd() * 15) | 0);
      const kill = 0.3 + 0.3 * rnd(); h.E *= 1 - kill;
      const id = record(w, 'civilwar', [c.id], why(`the lords fight for ${h.pi.toFixed(1)}× too few posts; ${Math.round(kill * 100)}% of the great houses die`));
      c._why = { terms: c.press, note: 'civil war', trig: 'strife', age: w.year - (c.hub && c.hub.since0 != null ? c.hub.since0 : c.born), cause: id, x: b.x, y: b.y };
      if (h.A < 0.2 && c.count >= 10 && w.year - (c.fellAt || -999) > 100) hooks.collapse(w, c); else hooks.civilWar(w, c);
      c._why = null;
    } else if (h.st === 'civil' && w.year >= h.until) { h.st = 'grow'; h.since = w.year; h.hiPi = 0; }
    // the common people rise when they have been squeezed for ten years
    if (h.lowL >= 10 && c.count >= 6 && rnd() < 0.15) {
      h.lowL = 0; h.eased = w.year + 30; h.E *= 0.85;
      const id = record(w, 'revolt', [c.id], why(`living standard ${h.L.toFixed(2)} for ten years`));
      c._why = { terms: c.press, note: 'a rising of the poor', cause: id, x: b.x, y: b.y }; hooks.revolt(w, c); c._why = null;
    }
  }
  // pressures on cohesion, by name
  return {
    elites: settled ? -HUB.elitesW * Math.max(0, h.pi - 1) : 0,
    strife: h.st === 'factions' ? -0.12 : h.st === 'civil' ? -0.3 : 0,
    living: settled ? -0.6 * Math.max(0, 0.85 - h.L) : 0,
    frontier: settled && h.st === 'grow' && h.pi < 0.9 ? 0.05 : 0,
  };
}
// how much harder a realm's lords push for war and new land (1 = not at all)
export const hubPush = (c) => { const h = c.hub; if (!h || !HUB.on) return 1; return h.st === 'press' || h.st === 'factions' ? 1 + 2 * Math.min(1, h.pi - 1) : 1; };
// a breakaway or a fallen realm starts with fewer lords than posts
export function hubReset(w, c, pi0) { c.hub = makeHub(c, w, pi0); }
