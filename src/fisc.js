// (Nov 3, foundations week) The fiscal state, behind FX.fisc. A realm's power is what it can pay for, not its headcount.
//   Each district produces: its people times what a head makes (more in town and from trade), plus its trade income.
//   The court takes its share (the hub's extraction X), but only what reaches it: the reach efficiency of empire.js
//   (distance against the realm's reach, roads and harbours, the court's grip), and a newly joined district pays little
//   until it is integrated (a decade for one of the court's own tongue, a generation for strangers).
//   Holding a district costs garrisons and officials, more where it is foreign, newly taken or occupied; a far, foreign,
//   fresh conquest can cost more than it pays.
//   c.rev  net revenue a year;  c.revPH  per head;  c.payF  how much of its manpower a realm can pay for, against the
//   world's typical realm (revenue per head relative to the median, bounded): strength() is multiplied by it.
//   s.net  what a district gives the court net of its upkeep (negative: a burden).
import { W, wrapDx } from './core.js';
import { tongueGap } from './tongues.js';
import { FX } from './flags.js';
const mass = (w, s) => w.mass[s.y * W + s.x];
function effOf(c, w, s, b) {
  const over = mass(w, s) !== mass(w, b), cost = Math.hypot(wrapDx(s.x - b.x), s.y - b.y) * (s.links ? 0.7 : 1) * (over ? (c.arts.navigation ? 1.1 : c.arts.sailing ? 1.6 : 2.5) : 1) * (over && s.port ? 0.8 : 1);
  const A = c.hub ? c.hub.A : 0.6; return Math.max(0.12, Math.min(1, 1.1 - (0.9 * cost) / Math.max(20, c.reachR || 30))) * (0.7 + 0.3 * A);
}
export function fiscYear(w) {
  if (!FX.fisc && !FX.inst) return;
  for (const c of w.cults) { c._rev = 0; c._hold = 0; c._fp = 0; c._out = 0; c._tr = 0; }
  for (const s of w.sets) {
    if (s.dead || s.nomad) continue; const c = w.cults[s.cult]; if (!c || !c.alive || c.power) continue;
    if (s._fc !== s.cult) { s.joinedAt = s._fc == null ? -999 : w.year; s._fc = s.cult; }   /* who rules it, and since when */
    const b = c.big || s, own = s.lang == null || c.langId == null || s.lang === c.langId || tongueGap(w, s.lang, c.langId) <= 1;
    const integ = Math.min(1, (w.year - (s.joinedAt ?? -999)) / (own ? 10 : 25)), eff = s === b ? 1 : effOf(c, w, s, b);
    const urb = s.urb ?? 0.06, out = s.pop * (0.6 + 2.5 * urb) + 0.5 * (s.wealth || 0);   /* what the district makes in a year */
    const X = c.hub ? c.hub.X : 0.12, take = out * X * eff * (0.3 + 0.7 * integ);
    const disloyal = (own ? 0.25 : 1) * (1 - 0.7 * integ) + (s.occ ? 1 : 0), hold = s.pop * 0.012 * disloyal * (s === b ? 0 : 1);
    s.net = take - hold; c._rev += take; c._hold += hold; c._fp += s.pop; c._out += out; c._tr += 0.5 * (s.wealth || 0);
  }
  const v = [];
  for (const c of w.cults) { if (!c.alive || c.power) continue; c.rev = c._rev - c._hold; c.tradeShare = c._out > 0 ? c._tr / c._out : 0; c.revPH = c._fp > 0 ? Math.max(0, c.rev) / c._fp : 0; if (c._fp > 0) v.push(c.revPH); }
  v.sort((a, b) => a - b); const ref = v.length ? v[v.length >> 1] : 1; w.revRef = ref;
  for (const c of w.cults) { if (!c.alive || c.power) continue; const credit = c.arts.banking ? 1.25 : c.arts.coinage ? 1.1 : 1; c.payF = Math.max(0.35, Math.min(2, ((c.revPH || 0) / Math.max(1e-9, ref)) * credit)); }
}
