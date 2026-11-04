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
  out.push({ y, landSed: +(sed / land).toFixed(3), landNom: +(nom / land).toFixed(3), landEmpty: +((land - sed - nom) / land).toFixed(3), habSed: +(habSed / hab).toFixed(3), habNom: +(habNom / hab).toFixed(3), habEmpty: +((hab - habSed - habNom) / hab).toFixed(3),
    popNomad: +(pN / P).toFixed(3), people: Math.round(P), realms, roots: roots.length, roots1pct: big, topRootPeople: +top.toFixed(2), topRootRealms: +topR.toFixed(2), masses, maxTech: Math.max(0, ...w.cults.filter((c) => c.alive && !c.power).map((c) => c.tech)) });
}
console.log(JSON.stringify({ seed, start: (w.langs || []).filter((l) => l.parent == null).length, rows: out }));
