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
import { N, W } from '../src/core.js';
const live = (c) => c && c.alive && !c.power;
const settled = (c) => live(c) && !(c.env && c.env.nomads > c.env.sed);
function frontier(w) { let tot = 0; for (const c of w.cults) if (settled(c)) tot += c.pop; let F = 0; for (const c of w.cults) if (settled(c) && c.pop >= 0.01 * tot && c.tech > F) F = c.tech; return F; }
const pc = (a) => { const t = a.reduce((x, y) => x + y, 0) || 1; return a.map((v) => Math.round((1000 * v) / t) / 10); };
export function makeBench2() { return { cent2: [], lag10: [], ageEntry: {}, contact: null, massLand: null }; }
function lagOf(w, F, split) {
  const P = [0, 0, 0, 0], b = (g) => Math.max(0, Math.min(3, g));
  for (const s of w.sets) { if (s.dead) continue; const c = w.cults[s.cult]; if (!live(c)) continue; const t = s.nomad || s.lvl == null ? c.tech : s.lvl;
    if (split && !s.nomad && t >= 6) { const u = s.urb ?? 0.06; P[b(F - t)] += s.pop * u; P[b(F - t + 1)] += s.pop * (1 - u); } else P[b(F - t)] += s.pop; }
  return pc(P);
}
export function bench2Year(w, D) {
  if (!D.massLand) { const m = {}; let land = 0; for (let i = 0; i < N; i++) if (!w.water[i]) { m[w.mass[i]] = (m[w.mass[i]] || 0) + 1; land++; } D.massLand = { m, land }; D.contact = {}; for (const k in m) if (m[k] >= 0.01 * land) D.contact[k] = { share: +(m[k] / land).toFixed(3), arrived: null, tie: null }; }
  const F = frontier(w), ppl = w.stats.people || 0;
  for (let k = 1; k <= F; k++) if (!D.ageEntry[k]) D.ageEntry[k] = { y: w.year, people: ppl };
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
  D.cent2.push({ y: w.year, F, tc: lagOf(w, F, true), polity: +(pol / (hab || 1)).toFixed(3), catch: +(cat / (hab || 1)).toFixed(3), mobile: { herders: +(herd / (all || 1)).toFixed(3), other: +(band / (all || 1)).toFixed(3) } });
}
export function bench2Summary(D) {
  const C = D.contact || {}, a4 = D.ageEntry[4] ? D.ageEntry[4].y : Infinity;
  const isolated = Object.values(C).filter((o) => o.share >= 0.05 && (o.tie == null || o.tie > a4)).length;
  const largest = Math.max(0, ...Object.values(C).map((o) => o.share));
  return { cent2: D.cent2, lag10: D.lag10, ageEntry: D.ageEntry, contact: C, geo: { largest, isolated } };
}
