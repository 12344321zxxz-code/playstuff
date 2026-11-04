// Peopling census: how much land is settled, ranged by nomads or empty, and how many unrelated peoples there are.
//   node tools/peopling.mjs <seed> <years> [every]
// Per sample: land cells (not water, not ice) held by settled districts / nomad bands / nobody; people settled vs nomad;
// realms; root tongues alive (unrelated language families), the largest root's share of people and of realms.
import { TPY, W } from '../src/core.js';
import { makeWorld, tick } from '../src/world.js';
const [seed, years, every] = [+process.argv[2], +process.argv[3], +(process.argv[4] || 100)];
const w = makeWorld(seed); const out = [];
const root = (id) => (id != null && w.langs && w.langs[id] ? w.langs[id].root : -1);
for (let y = 1; y <= years; y++) {
  for (let t = 0; t < TPY; t++) tick(w);
  if (y % every) continue;
  let land = 0, sed = 0, nom = 0, hab = 0, habSed = 0, habNom = 0;
  for (let i = 0; i < w.water.length; i++) { if (w.water[i] || w.ice[i]) continue; land++; const k = w.owner[i], s = k >= 0 ? w.sets[k] : null, h = w.gCap[i] >= 0.3; if (h) hab++;
    if (s && !s.dead) { if (s.nomad) { nom++; if (h) habNom++; } else { sed++; if (h) habSed++; } } }
  let pS = 0, pN = 0; const rp = {}, rr = {}; let realms = 0;
  for (const s of w.sets) { if (s.dead) continue; if (s.nomad) pN += s.pop; else pS += s.pop; const r = root(s.lang ?? (w.cults[s.cult] || {}).langId); rp[r] = (rp[r] || 0) + s.pop; }
  for (const c of w.cults) { if (!c.alive || c.power || !(c.count > 0)) continue; realms++; const r = root(c.big ? c.big.lang ?? c.langId : c.langId); rr[r] = (rr[r] || 0) + 1; }
  const P = pS + pN || 1, roots = Object.keys(rp).filter((k) => rp[k] > 0.001 * P), top = Math.max(0, ...Object.values(rp)) / P, topR = realms ? Math.max(0, ...Object.values(rr)) / realms : 0;
  const big = Object.values(rp).filter((v) => v >= 0.01 * P).length;
  // per landmass: the three most peopled landmasses, how many unrelated families hold 5%+ of each, and the top family's share
  const LM = {}; for (const s of w.sets) { if (s.dead) continue; const m = w.mass[s.y * W + s.x], r = root(s.lang ?? (w.cults[s.cult] || {}).langId); const o = (LM[m] ||= { P: 0, r: {} }); o.P += s.pop; o.r[r] = (o.r[r] || 0) + s.pop; }
  const masses = Object.values(LM).sort((a, b) => b.P - a.P).slice(0, 3).map((o) => ({ share: +(o.P / P).toFixed(2), fam5: Object.values(o.r).filter((v) => v >= 0.05 * o.P).length, top: +(Math.max(...Object.values(o.r)) / o.P).toFixed(2) }));
  // who is behind: people 1+ / 2+ ages behind the frontier (highest age of a realm with 1%+ of people), split by
  // same family as the frontier realm or not, same landmass or not, and tied by contact to the frontier realm or not
  let F = 0, Fc = null; for (const c of w.cults) if (c.alive && !c.power && c.count > 0 && c.pop >= 0.01 * P && c.tech > F) { F = c.tech; Fc = c; }
  const lagB = { fam: [0, 0, 0], other: [0, 0, 0], land: [0, 0, 0], away: [0, 0, 0], tied: [0, 0, 0], untied: [0, 0, 0] };
  if (Fc && Fc.big) { const fr = root(Fc.big.lang ?? Fc.langId), fm = w.mass[Fc.big.y * W + Fc.big.x];
    for (const s of w.sets) { if (s.dead) continue; const c = w.cults[s.cult]; if (!c) continue; const t = s.nomad || s.lvl == null ? c.tech : s.lvl, g = F - t, b = g >= 2 ? 2 : g >= 1 ? 1 : 0;
      const same = root(s.lang ?? c.langId) === fr, onL = w.mass[s.y * W + s.x] === fm, tie = c === Fc || ((Fc.ties || {})[c.id] || 0) >= 0.3 || ((c.ties || {})[Fc.id] || 0) >= 0.3;
      lagB[same ? 'fam' : 'other'][b] += s.pop; lagB[onL ? 'land' : 'away'][b] += s.pop; lagB[tie ? 'tied' : 'untied'][b] += s.pop; } }
  // minority-ruler realms: the court's family is spoken by under half the realm's people (share of realm land and of realm people)
  const RP = {}; for (const s of w.sets) { if (s.dead || s.nomad) continue; const c = w.cults[s.cult]; if (!c || !c.alive || c.power || !c.big) continue; const o = (RP[c.id] ||= { own: 0, all: 0, cells: 0 }); o.all += s.pop; if (root(s.lang ?? c.langId) === root(c.big.lang ?? c.langId)) o.own += s.pop; }
  for (let i = 0; i < w.owner.length; i++) { const k = w.owner[i]; if (k < 0) continue; const t = w.sets[k]; if (t && !t.dead && !t.nomad && RP[t.cult]) RP[t.cult].cells++; }
  let mrP = 0, mrA = 0, tP = 0, tA = 0; for (const id in RP) { const o = RP[id]; tP += o.all; tA += o.cells; if (o.own < 0.5 * o.all) { mrP += o.all; mrA += o.cells; } }
  const minority = { people: tP ? +(mrP / tP).toFixed(3) : 0, land: tA ? +(mrA / tA).toFixed(3) : 0 };
  const lagOut = {}; for (const k in lagB) { const a = lagB[k], t = a[0] + a[1] + a[2]; lagOut[k] = t ? { pop: +(t / P).toFixed(3), b1: +((a[1] + a[2]) / t).toFixed(3), b2: +(a[2] / t).toFixed(3) } : null; }
  out.push({ y, F, lag: lagOut, minority, landSed: +(sed / land).toFixed(3), landNom: +(nom / land).toFixed(3), landEmpty: +((land - sed - nom) / land).toFixed(3), habSed: +(habSed / hab).toFixed(3), habNom: +(habNom / hab).toFixed(3), habEmpty: +((hab - habSed - habNom) / hab).toFixed(3),
    popNomad: +(pN / P).toFixed(3), people: Math.round(P), realms, roots: roots.length, roots1pct: big, topRootPeople: +top.toFixed(2), topRootRealms: +topR.toFixed(2), masses, maxTech: Math.max(0, ...w.cults.filter((c) => c.alive && !c.power).map((c) => c.tech)) });
}
console.log(JSON.stringify({ seed, start: (w.langs || []).filter((l) => l.parent == null).length, rows: out }));
