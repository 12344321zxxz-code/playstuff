// Frontiers (war & sovereignty, slice 4), after Barfield's "outer frontier": a steppe confederation
// lives on what it can draw from its settled neighbours. A rich, united state pays it to stay on its
// side of the grass (cheaper than war), or opens border markets; a weak or divided one gets raided
// instead, and raiding a poor country yields little. So the confederation grows with the wealth and
// unity of the states it borders, and comes apart when they do. Tribute can run the other way: a
// strong state makes small herder peoples on its edge pay.
//   w.rel['a-b'].terms = [{ k: 'subsidy' | 'market' | 'tribute', from, to, rate, since, until }]
//   c.fi: a nomad realm's frontier income, 0..1 (smoothed); it sets how many bands hold together
import { strength } from './people.js';
import { record, tally } from './ledger.js';
import { ev } from './story.js';
import { atWar, truceLeft } from './war.js';

const pk = (a, b) => (a < b ? a + '-' + b : b + '-' + a);
export const nomadic = (c) => !!(c && c.env && c.env.nomads > c.env.sed && c.env.nomads >= 2);
export function termsBetween(w, a, b) { const r = w.rel && w.rel[pk(a, b)]; if (!r || !r.terms) return null; for (const t of r.terms) if (t.until > w.year) return t; return null; }
function addTerm(w, t) { const R = w.rel || (w.rel = {}), k = pk(t.from, t.to), r = R[k] || (R[k] = {}); (r.terms || (r.terms = [])).push(t); }
const wealth = (c) => c.pop * (0.25 + Math.max(0, c.surplus || 0));

export function frontierYear(w) {
  const R = w.rel || (w.rel = {});
  for (const c of w.cults) { c.subOut = 0; c._fg = 0; if (c.rby) for (const k in c.rby) { c.rby[k] *= 0.85; if (c.rby[k] < 0.3) delete c.rby[k]; } }   /* raids by each confederation, remembered for a few years */
  // standing terms: they are paid, or they lapse
  for (const k in R) {
    const r = R[k]; if (!r.terms) continue;
    r.terms = r.terms.filter((t) => {
      const f = w.cults[t.from], to = w.cults[t.to]; if (!f || !to || !f.alive || !to.alive || t.until <= w.year || atWar(w, f, to)) return false;
      if (t.k === 'subsidy' && (f.coh < 0.35 || (f.hub && f.hub.st === 'civil'))) { tally(w, 'subsidyLapsed'); if (f.big) ev(w, `The ${f.name} are too divided to keep paying the ${to.name}. The riders will come for it themselves.`, f.big.x, f.big.y, to.color, 1); return false; }
      if (t.rate) { f.subOut += t.rate; to.tributeIn = (to.tributeIn || 0) + (t.rate * f.pop) / 100; }
      if (t.k === 'subsidy') to._fg += (t.rate * wealth(f)) / 100; else if (t.k === 'market') to._fg += (0.006 * Math.min(wealth(f), 40 * to.pop)) / 100;
      return true;
    });
    if (!r.terms.length) delete r.terms;
  }
  // what each confederation draws from the settled world: subsidies, markets, and loot
  for (const c of w.cults) {
    if (!c.alive || c.power) continue; if (!nomadic(c)) { c.fi = 0; continue; }
    const gain = c._fg + 0.05 * (c.loot || 0); c.loot = 0; const raw = gain / Math.max(1, c.pop / 100), f = raw / (1 + raw);
    c.fi = c.fi == null ? f : c.fi + (f - c.fi) / 15;
  }
  // new terms, looked at now and then for each confederation and the settled realms it touches
  for (const n of w.cults) {
    if (!n.alive || n.power || !nomadic(n) || n.war || w.rnd() > 0.1) continue;
    const mine = strength(n, n.pop) * (n.arts.riding ? 2 : 1);
    for (const k in n.nb) {
      const s = w.cults[k]; if (!s || !s.alive || s.power || nomadic(s) || n.nb[k] < 0.3 || s.war || termsBetween(w, n.id, s.id) || truceLeft(w, n.id, s.id) || !s.big || !n.big) continue;
      const threat = mine / Math.max(1, strength(s, s.pop)), united = s.coh > 0.5 && (!s.hub || s.hub.A > 0.5), b = s.big;
      let t = null;
      if (united && threat > 0.06 && (s.rby && s.rby[n.id] > 1.5) && (s.arts.writing || s.arts.bureaucracy))   /* a state pays once the raids have shown what refusing costs */ t = { k: 'subsidy', from: s.id, to: n.id, rate: Math.min(0.06, Math.max(0.01, 0.3 * threat)) };
      else if (united && threat < 0.02 && n.count <= 8 && s.arts.writing) t = { k: 'tribute', from: n.id, to: s.id, rate: 0.06 };
      else if ((s.markets || 0) >= 1 && w.rnd() < 0.3) t = { k: 'market', from: s.id, to: n.id, rate: 0 };
      if (!t) continue; t.since = w.year; t.until = w.year + 30; addTerm(w, t); tally(w, 'frontier_' + t.k);
      record(w, 'frontier', [s.id, n.id], { x: b.x, y: b.y, note: t.k === 'subsidy' ? `the ${s.name} pay the ${n.name} to keep the peace` : t.k === 'tribute' ? `the ${n.name} pay tribute to the ${s.name}` : `the ${s.name} open border markets to the ${n.name}`, terms: { threat: +threat.toFixed(3), coh: +s.coh.toFixed(2), A: s.hub ? +s.hub.A.toFixed(2) : null } });
      ev(w, t.k === 'subsidy' ? `Envoys of the ${s.name} ride out with silk and grain. The ${n.name} take it, and keep their riders on their own side of the grass.` : t.k === 'tribute' ? `The herders of the ${n.name} drive horses to ${b.name || 'the court of the ' + s.name} every spring now, as tribute.` : `The ${s.name} open markets on their border, and the ${n.name} come to trade instead of raid.`, b.x, b.y, n.color, 1);
      break;
    }
  }
}
// how many bands a confederation can hold together: the more it draws from the settled world, the bigger
export const bandCap = (c) => Math.round(14 + 22 * Math.min(1, (c.fi || 0) * 2));
