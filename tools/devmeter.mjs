// (Nov 2, holistic) How uneven is the world's development, and who leads it? Measured per century, by district.
//   lag:    share of people and of land 0 / 1 / 2 / 3+ ages behind the frontier, read off each district's own level
//           (s.lvl; wandering bands at their people's age, counted with the land they range over); 'rlag' reads the
//           same land at its realm's age instead (what the old measure saw)
//   within: share of a realm's people living one age or more behind its own court
//   rho:    Spearman rank correlation of realm population with knowledge (realms with >= 1% of people)
//   tall:   share of frontier realm-decades held by a sovereign realm outside the top 3 by people AND by land
//   kl:     where knowledge came from (own finds, contact, letters, migrants, conquest, ruins), by realm size tercile
import { N, W } from '../src/core.js';
import { ART, ART_KEYS } from '../src/tech.js';
const settled = (c) => c && c.alive && !c.power && !(c.env && c.env.nomads > c.env.sed);
const live = (c) => c && c.alive && !c.power;
export function makeDev() { return { cent: [], hist: [], kl: {}, tallN: 0, tallT: 0, seen: new Set(), first: {}, al: {}, got: new Map(), sc: {}, keyFirst: {} }; }
const KEYART = new Set(['printing', 'banking', 'engines', 'railways', 'electricity', 'computers']);
// (Nov 2, research doc) how long each art took to reach other realms after the first: tied to the first holder by trade,
// on its landmass, or far (other landmasses, no ties); realms born holding it inherited it and don't count
const massOf = (w, c) => (c && c.big ? w.mass[c.big.y * W + c.big.x] : -1);
// (Nov 3) deployment: years from a realm's court reaching an age (5+) until half its people live in districts that have reached it,
// split by realm size (top 3 by people vs the rest); realms that never get there by the end are counted as censored
function scaleLags(w, D) {
  const by = new Map(); for (const s of w.sets) { if (s.dead || s.nomad) continue; const c = w.cults[s.cult]; if (!settled(c)) continue; const a = by.get(c.id) || by.set(c.id, new Float64Array(12)).get(c.id); a[11] += s.pop; a[Math.min(10, s.lvl ?? c.tech)] += s.pop; }
  const L = w.cults.filter((c) => settled(c) && c.count > 0), top = new Set(L.slice().sort((a, b) => b.pop - a.pop).slice(0, 3).map((c) => c.id));
  for (const c of L) { const a = by.get(c.id); if (!a || !a[11]) continue;
    for (let t = 5; t <= Math.min(9, c.tech); t++) { const key = c.id + ':' + t; if (!D.got.has(key)) { D.got.set(key, { y: w.year, big: top.has(c.id), n: c.count, done: w.year - c.born <= 2 }); continue; } const g = D.got.get(key); if (g.done) continue;
      let at = 0; for (let l = t; l <= 10; l++) at += a[l]; if (at >= 0.5 * a[11]) { g.done = true; ((D.sc[t] ||= {})[g.big ? 'big' : 'small'] ||= []).push(w.year - g.y); } } } }
function artLags(w, D) {
  for (const c of w.cults) { if (!settled(c) || c.count <= 0) continue; const young = w.year - c.born <= 2;
    for (const k of ART_KEYS) { if (!c.arts[k]) continue; const key = c.id + ':' + k; if (D.seen.has(key)) continue; D.seen.add(key); if (young) continue;
      const f = D.first[k]; if (!f) { D.first[k] = { y: w.year, id: c.id, m: massOf(w, c) }; if (KEYART.has(k)) { const L = w.cults.filter((q) => settled(q) && q.count > 0), tot = L.reduce((a, q) => a + q.pop, 0); D.keyFirst[k] = { y: w.year, rank: L.slice().sort((a, b) => b.pop - a.pop).indexOf(c) + 1, share: +(c.pop / Math.max(1, tot)).toFixed(3), lrank: L.slice().sort((a, b) => landOf(b) - landOf(a)).indexOf(c) + 1 }; } continue; }
      const F = w.cults[f.id], tied = F && ((c.ties || {})[F.id] >= 1 || (F.ties || {})[c.id] >= 1), g = tied ? 'tied' : massOf(w, c) === f.m ? 'land' : 'far', t = ART[k].tier;
      ((D.al[t] ||= {})[g] ||= []).push(w.year - f.y); } } }
const landOf = (c) => (c.terr && c.terr.n) || c.count;
function frontier(w, share) { let tot = 0; for (const c of w.cults) if (settled(c)) tot += c.pop; let F = 0; for (const c of w.cults) if (settled(c) && c.pop >= share * tot && c.tech > F) F = c.tech; return F; }
const ranks = (L, f) => { const m = new Map(); L.slice().sort((a, b) => f(b) - f(a)).forEach((c, i) => m.set(c.id, i + 1)); return m; };
// the pop rank this realm (or the realm it came from) held `back` years ago
export function rankAgo(w, D, c, back) { const snap = D.hist.find((h) => h.y === Math.floor((w.year - back) / 10) * 10); if (!snap) return null; let q = c; for (let k = 0; k < 6 && q; k++) { if (snap.r.has(q.id)) return snap.r.get(q.id); q = q.pid != null ? w.cults[q.pid] : null; } return null; }
export function devYear(w, D) {
  artLags(w, D); if (w.year % 2 === 0) scaleLags(w, D);
  if (w.year % 10 === 0) {
    const L = w.cults.filter((c) => live(c) && c.count > 0); D.hist.push({ y: w.year, r: ranks(L, (c) => c.pop) }); if (D.hist.length > 14) D.hist.shift();
    const F = frontier(w, 0.005), S = L.filter((c) => !c.over), rp = ranks(S, (c) => c.pop), rl = ranks(S, landOf);
    if (F >= 4) for (const c of L) if (c.tech === F && !c.over) { D.tallN++; if (rp.get(c.id) > 3 && rl.get(c.id) > 3) D.tallT++; }   /* from the iron age on (before it everyone is at the frontier) */
    if (F >= 4) D._tallN = (D._tallN || 0) + L.filter((c) => c.tech === F && !c.over).length; if (F >= 4) D._tallT = (D._tallT || 0) + L.filter((c) => c.tech === F && !c.over && rp.get(c.id) > 3 && rl.get(c.id) > 3).length;
  }
  if (w.year % 100 !== 0) return;
  const F = frontier(w, 0.01), area = new Map(); for (let i = 0; i < N; i++) { const k = w.owner[i]; if (k >= 0) area.set(k, (area.get(k) || 0) + 1); }
  const P = [0, 0, 0, 0], A = [0, 0, 0, 0], R = [0, 0, 0, 0]; let wl = 0, wp = 0;
  const b = (lag) => Math.max(0, Math.min(3, lag));
  w.sets.forEach((s, k) => { if (s.dead) return; const c = w.cults[s.cult]; if (!live(c)) return; const t = s.nomad || s.lvl == null ? c.tech : s.lvl, a = s.nomad ? (s.R === 3 ? 29 : 13) : area.get(k) || 0;
    P[b(F - t)] += s.pop; A[b(F - t)] += a; R[b(F - c.tech)] += a; if (!s.nomad) { wp += s.pop; if (t <= c.tech - 1) wl += s.pop; } });
  const sp = P.reduce((x, y) => x + y, 0) || 1, sa = A.reduce((x, y) => x + y, 0) || 1, pc = (v, t) => Math.round((1000 * v) / t) / 10;
  // Spearman(pop, know) across realms with >= 1% of people
  let tot = 0; for (const c of w.cults) if (settled(c)) tot += c.pop; const Q = w.cults.filter((c) => settled(c) && c.pop >= 0.01 * tot); let rho = null;
  if (Q.length >= 5) { const a = ranks(Q, (c) => c.pop), k = ranks(Q, (c) => c.know), n = Q.length; let d2 = 0; for (const c of Q) d2 += (a.get(c.id) - k.get(c.id)) ** 2; rho = +(1 - (6 * d2) / (n * (n * n - 1))).toFixed(2); }
  // knowledge sources by size tercile (realms with >= 0.5% of people), then reset
  const Z = w.cults.filter((c) => settled(c) && c.pop >= 0.005 * tot).sort((a, b) => b.pop - a.pop), era = F >= 5 ? 'late' : 'early';
  Z.forEach((c, i) => { const tq = i < Z.length / 3 ? 'big' : i < (2 * Z.length) / 3 ? 'mid' : 'small', B = ((D.kl[era] ||= {})[tq] ||= {}); let sum = 0; for (const k in c.kl || {}) sum += c.kl[k]; if (sum > 0) { for (const k in c.kl) B[k] = (B[k] || 0) + c.kl[k] / sum; B.n = (B.n || 0) + 1; }   /* each realm's own mix, weighted equally */ });
  for (const c of w.cults) c.kl = null;
  const sh = w.cults.filter((c) => settled(c)).map((c) => c.pop / Math.max(1, tot)).sort((a, b) => b - a);
  let ub = 0, up = 0; const eng = new Map(); let engT = 0; for (const s of w.sets) { if (s.dead || s.nomad) continue; const c = w.cults[s.cult]; if (!live(c)) continue; ub += s.pop * (s.urb ?? 0.06); up += s.pop; if (s._A && s._A.engines) { const v = s.pop * (s.urb ?? 0.06); engT += v; eng.set(c.id, (eng.get(c.id) || 0) + v); } }
  const es = [...eng.values()].map((v) => v / Math.max(1e-9, engT)).sort((a, b) => b - a);
  D.cent.push({ y: w.year, urb: up ? +(ub / up).toFixed(3) : null, indTop1: es.length ? +es[0].toFixed(3) : null, indHHI: es.length ? +es.reduce((a, v) => a + v * v, 0).toFixed(3) : null, indRealms: es.length, F, top1: +(sh[0] || 0).toFixed(3), top3: +sh.slice(0, 3).reduce((a, b) => a + b, 0).toFixed(3), realms: w.cults.filter((c) => c.alive && !c.power && c.count > 0).length, lag: P.map((v) => pc(v, sp)), land: A.map((v) => pc(v, sa)), rland: R.map((v) => pc(v, sa)), within: wp ? pc(wl, wp) : null, rho, tall: D._tallN ? +(D._tallT / D._tallN).toFixed(2) : null, n: Q.length });
  D._tallN = 0; D._tallT = 0;
}
export function devSummary(D, w) {
  // censored: realms alive now still without an art the first holder got 100+ years ago
  const cens = {}; if (w) for (const k in D.first) { const f = D.first[k]; if (w.year - f.y < 100) continue; const t = ART[k].tier; for (const c of w.cults) if (settled(c) && c.count > 0 && !c.arts[k] && w.year - c.born > 100) { const g = massOf(w, c) === f.m ? 'land' : 'far'; cens[t] = cens[t] || {}; cens[t][g] = (cens[t][g] || 0) + 1; } }
  const scC = {}; for (const [k, g] of D.got) if (!g.done && w && w.year - g.y >= 100) { const t = k.split(':')[1]; (scC[t] ||= {})[g.big ? 'big' : 'small'] = ((scC[t] || {})[g.big ? 'big' : 'small'] || 0) + 1; }
  return { keyFirst: D.keyFirst, scaleLag: D.sc, scaleCens: scC, dev: D.cent, devKl: D.kl, tallShare: D.tallN ? +(D.tallT / D.tallN).toFixed(3) : null, artLag: D.al, artCens: cens, artFirst: Object.fromEntries(Object.entries(D.first).map(([k, f]) => [k, f.y])) }; }
