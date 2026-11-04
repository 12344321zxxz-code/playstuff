// (Nov 4, tech-disparity) Measurements added after the Earth-vs-sim blind-spots audit (docs/manager/earth-vs-sim-blind-spots.md).
// Measurement only: reads the world, never changes it, draws no random numbers.
//   cent2 (per century):
//     tc:      people 0 / 1 / 2 / 3+ ages behind the frontier with each district split by its town share: from the age of
//              steam (district age 6+) the countryside (1 - urb) is counted one age behind its district. A measurement
//              assumption standing in for the rural-urban gap the sim does not model (blind spot D)
//     polity:  share of habitable land (gCap >= 0.3) inside the realm map (w.polity), the "claimed land" reading (blind spot L)
//     catch:   the same land inside town catchments (w.owner), the older reading
//     mobile:  share of people in wandering bands, split into herders and the rest
//   lag10:     every 10 years once the frontier reaches the age of print: frontier age and people 0/1/2/3+ behind (decade sampling)
//   ageEntry:  first year the frontier reaches each age, with the world's people then
//   contact:   per landmass holding 1%+ of land: its share, the year people arrived, and the first year a realm there had a
//              tie (0.3+) with a realm on another landmass
//   geo:       largest landmass's share of land, and how many landmasses of 5%+ of land made no outside contact before
//              the frontier reached the long middle (age 4): "isolated" worlds (blind spot B)
//   (Step 0, Nov 4) recv:  knowledge each channel delivered, summed per frontier age and per standing (0 = at the
//              frontier, 1 = one age behind, 2 = two or more), with letters proposed vs accepted and the receipt budget
//   gate:      key arts (engines, railways, electricity, computers): realm-people that use it, could learn it now, are
//              tied to a user (exposure), and why the rest cannot (tech / req / carriers / can / banned), by frontier age
//   cohort:    fixed cohort of realms (1%+ of people) at each age's entry, their people 0/1/2+ behind at +25/+50/+100
//   f05:       the frontier with a 0.5% cutoff next to the 1% one, per century
//   entrants:  for the first realm into ages 5-9: its rank by people, by town share and by skilled per head
import { N, W } from '../src/core.js';
import { ART, carriersFor } from '../src/tech.js';
const KEY = ['engines', 'railways', 'electricity', 'computers'];
function why(c, k) { const a = c.arts, T = ART[k]; if (!T) return 'none'; if (a[k]) return 'has'; if (c.tech < T.tier) return 'tech'; if (c.banned && c.banned[k]) return 'banned';
  if (T.tier >= 3 && T.tier < 99 && (c.carry || 0) < 1.5 * carriersFor(T.tier)) return 'carry'; for (const r of T.req) if (!a[r]) return 'req'; return T.can && !T.can(c, c.env, false) ? 'can' : 'able'; }
function skilled(w) { const u = {}; for (const s of w.sets) if (!s.dead && !s.nomad) u[s.cult] = (u[s.cult] || 0) + s.pop * (s.urb ?? 0.06); return u; }
function frontierAt(w, cut) { let tot = 0; for (const c of w.cults) if (settled(c)) tot += c.pop; let F = 0; for (const c of w.cults) if (settled(c) && c.pop >= cut * tot && c.tech > F) F = c.tech; return F; }
const live = (c) => c && c.alive && !c.power;
const settled = (c) => live(c) && !(c.env && c.env.nomads > c.env.sed);
function frontier(w) { let tot = 0; for (const c of w.cults) if (settled(c)) tot += c.pop; let F = 0; for (const c of w.cults) if (settled(c) && c.pop >= 0.01 * tot && c.tech > F) F = c.tech; return F; }
const pc = (a) => { const t = a.reduce((x, y) => x + y, 0) || 1; return a.map((v) => Math.round((1000 * v) / t) / 10); };
export function makeBench2() { return { cent2: [], lag10: [], ageEntry: {}, contact: null, massLand: null, recv: {}, gate: {}, cohort: {}, f05: [], entrants: {}, klPrev: new Map() }; }
function lagOf(w, F, split) {
  const P = [0, 0, 0, 0], b = (g) => Math.max(0, Math.min(3, g));
  for (const s of w.sets) { if (s.dead) continue; const c = w.cults[s.cult]; if (!live(c)) continue; const t = s.nomad || s.lvl == null ? c.tech : s.lvl;
    if (split && !s.nomad && t >= 6) { const u = s.urb ?? 0.06; P[b(F - t)] += s.pop * u; P[b(F - t + 1)] += s.pop * (1 - u); } else P[b(F - t)] += s.pop; }
  return pc(P);
}
export function bench2Year(w, D) {
  if (!D.massLand) { const m = {}; let land = 0; for (let i = 0; i < N; i++) if (!w.water[i]) { m[w.mass[i]] = (m[w.mass[i]] || 0) + 1; land++; } D.massLand = { m, land }; D.contact = {}; for (const k in m) if (m[k] >= 0.01 * land) D.contact[k] = { share: +(m[k] / land).toFixed(3), arrived: null, tie: null }; }
  const F = frontier(w), ppl = w.stats.people || 0;
  for (let k = 1; k <= F; k++) if (!D.ageEntry[k]) { D.ageEntry[k] = { y: w.year, people: ppl };
    if (k >= 5) { let tot = 0; const L = w.cults.filter(settled); for (const c of L) tot += c.pop; const ids = L.filter((c) => c.pop >= 0.01 * tot).map((c) => c.id); D.cohort[k] = { y: w.year, ids, at: {} };
      const lead = L.filter((c) => c.tech >= k && c.pop >= 0.005 * tot).sort((a, b) => b.pop - a.pop)[0];
      if (lead) { const u = skilled(w), sp = (c) => c._sp || c.pop || 1, by = (f) => 1 + L.filter((q) => q.pop >= 0.01 * tot && f(q) > f(lead)).length;
        D.entrants[k] = { y: w.year, rPeople: by((q) => q.pop), rTown: by((q) => (u[q.id] || 0) / sp(q)), rSkilledHead: by((q) => (u[q.id] || 0) / (q.pop || 1)), rSkilled: by((q) => u[q.id] || 0), n: L.filter((q) => q.pop >= 0.01 * tot).length }; } } }
  for (const k in D.cohort) { const C = D.cohort[k]; for (const d of [25, 50, 100]) if (C.at[d] == null && w.year >= C.y + d) { const P = [0, 0, 0]; for (const id of C.ids) { const c = w.cults[id]; if (!live(c)) continue; P[Math.max(0, Math.min(2, F - c.tech))] += c.pop; } C.at[d] = { F, lag: pc(P) }; } }
  // receipts: what each channel added this year (the devmeter ledger is reset each century, so read it as a running difference)
  if (F >= 4) { const R = (D.recv[F] ||= [{}, {}, {}]);
    for (const c of w.cults) { if (!live(c) || !(c.pop > 0)) continue; const L = c.kl || {}, prev = D.klPrev.get(c.id) || {}, B = R[Math.max(0, Math.min(2, F - c.tech))], nx = {};
      for (const k in L) { const d = L[k] - (L[k] >= (prev[k] || 0) ? prev[k] || 0 : 0); if (d > 0) B[k] = (B[k] || 0) + d; nx[k] = L[k]; }
      if (c._lp > 0) { B.lettersProp = (B.lettersProp || 0) + c._lp; if (Number.isFinite(c._lb)) { B.budget = (B.budget || 0) + c._lb; B.capped = (B.capped || 0) + (c._lp > c._lb ? 1 : 0); } }
      B.ry = (B.ry || 0) + 1; B.pop = (B.pop || 0) + c.pop; D.klPrev.set(c.id, nx); } }
  if (F >= 5 && w.year % 10 === 0) { const G = (D.gate[F] ||= {});
    for (const c of w.cults) { if (!settled(c) || !(c.pop > 0)) continue; for (const k of KEY) { if (ART[k] && ART[k].tier > c.tech + 1) continue; const g = (G[k] ||= {}), r = why(c, k); g[r] = (g[r] || 0) + c.pop;
      if (r !== 'has') { let ex = false; for (const id in c.ties || {}) { const o = w.cults[id]; if (live(o) && o.arts[k] && c.ties[id] >= 0.3) { ex = true; break; } } if (ex) g.exposed = (g.exposed || 0) + c.pop; } } } }
  if (w.year % 10 === 0) {
    const C = D.contact;
    for (const k in C) { const a = w.arrived && w.arrived[k]; if (C[k].arrived == null && a) C[k].arrived = Math.min(...a); }
    if (Object.values(C).some((o) => o.tie == null)) for (const c of w.cults) { if (!live(c) || !c.big) continue; const m = w.mass[c.big.y * W + c.big.x]; if (!C[m] || C[m].tie != null) continue;
      for (const id in c.ties || {}) { if (c.ties[id] < 0.3) continue; const o = w.cults[id]; if (!live(o) || !o.big) continue; if (w.mass[o.big.y * W + o.big.x] !== m) { C[m].tie = w.year; break; } } }
    if (F >= 5) D.lag10.push({ y: w.year, F, lag: lagOf(w, F, false) });
  }
  if (w.year % 100 !== 0) return;
  let hab = 0, pol = 0, cat = 0; for (let i = 0; i < N; i++) { if (w.water[i] || w.ice[i] || w.gCap[i] < 0.3) continue; hab++; if (w.polity && w.polity[i] >= 0) pol++; const k = w.owner[i]; if (k >= 0 && w.sets[k] && !w.sets[k].dead) cat++; }
  let all = 0, herd = 0, band = 0; for (const s of w.sets) { if (s.dead) continue; all += s.pop; if (s.nomad) { const c = w.cults[s.cult]; if (c && c.grazer) herd += s.pop; else band += s.pop; } }
  D.f05.push({ y: w.year, F1: F, F05: frontierAt(w, 0.005) });
  D.cent2.push({ y: w.year, F, tc: lagOf(w, F, true), polity: +(pol / (hab || 1)).toFixed(3), catch: +(cat / (hab || 1)).toFixed(3), mobile: { herders: +(herd / (all || 1)).toFixed(3), other: +(band / (all || 1)).toFixed(3) } });
}
export function bench2Summary(D) {
  const rnd = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'number' ? +v.toPrecision(4) : v]));
  const recv = Object.fromEntries(Object.entries(D.recv).map(([F, R]) => [F, R.map(rnd)])), gate = Object.fromEntries(Object.entries(D.gate).map(([F, G]) => [F, Object.fromEntries(Object.entries(G).map(([k, g]) => { const t = Object.entries(g).reduce((a, [kk, v]) => a + (kk === 'exposed' ? 0 : v), 0) || 1; return [k, Object.fromEntries(Object.entries(g).map(([kk, v]) => [kk, +(v / t).toFixed(3)]))]; }))]));
  const cohort = Object.fromEntries(Object.entries(D.cohort).map(([k, C]) => [k, { y: C.y, n: C.ids.length, at: C.at }]));
  const C = D.contact || {}, a4 = D.ageEntry[4] ? D.ageEntry[4].y : Infinity;
  const isolated = Object.values(C).filter((o) => o.share >= 0.05 && (o.tie == null || o.tie > a4)).length;
  const largest = Math.max(0, ...Object.values(C).map((o) => o.share));
  return { cent2: D.cent2, lag10: D.lag10, ageEntry: D.ageEntry, contact: C, geo: { largest, isolated }, recv, gate, cohort, f05: D.f05, entrants: D.entrants };
}
