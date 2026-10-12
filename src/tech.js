// What peoples can know. Not a ladder but a web: every discovery needs what came before it, and
// something real from the world (ores, timber, horses, a crop, a coast, enough people fed by
// others to work at it). Peoples invent what their trouble pushes them toward: hunger toward
// granaries, war toward walls and siege engines, plague toward medicine, a busy market toward
// coin. `tier` is how much a people must already know in general (their era); `req` is what it
// builds on; `can` is what the land and the times must offer.
export const ART = {
  // first things
  herding: { say: 'herding', tier: 0, req: [] },
  boats: { say: 'boats', tier: 0, req: [], can: (c, e, easy) => (easy || c.know > 1200) && e.coast > 0 },
  pottery: { say: 'pottery', tier: 0, req: [], can: (c, e) => e.sed > 0 || c.know > 2000, push: (c) => (c.hungry ? 1 : 0) },
  counting: { say: 'counting', tier: 1, req: [], can: (c, e) => e.sed >= 2 },
  farming: { say: 'farming', tier: 1, req: [], can: (c) => c.cropL.length > 0 },
  riding: { say: 'riding', tier: 1, req: [], can: (c) => !!(c.tame.horse || c.tame.camel) },
  copper: { say: 'copper working', tier: 1, req: ['pottery'], can: (c) => (c.metals & 2) !== 0 },
  masonry: { say: 'stone walls', tier: 1, req: [], can: (c, e) => e.towns > 0, push: (c) => (c.war ? 2 : 0) },
  wheel: { say: 'the wheel', tier: 1, req: ['pottery'], can: (c, e) => e.sed >= 3 && !!(c.tame.cattle || c.tame.horse || c.tame.buffalo || c.tame.llama || c.tame.camel) },
  granaries: { say: 'granaries', tier: 1, req: ['farming', 'pottery'], push: (c) => (c.hungry ? 3 : 0) + (c._dry ? 2 : 0) },
  // the first states
  plough: { say: 'the plough', tier: 2, req: ['farming'], can: (c) => !!(c.tame.cattle || c.tame.buffalo || c.tame.horse) },
  irrigation: { say: 'irrigation', tier: 2, req: ['farming'], can: (c, e) => e.dryRiver > 0, push: (c) => (c._dry ? 2 : 0) },
  terraces: { say: 'terraced fields', tier: 2, req: ['farming'], can: (c, e) => e.hill > 0 },
  bronze: { say: 'bronze', tier: 2, req: ['copper'], can: (c, e) => e.sed >= 3 && (c.metals & 2) !== 0 && (c.metals & 4) !== 0, push: (c) => (c.war ? 1 : 0) },
  writing: { say: 'writing', tier: 2, req: ['counting'], can: (c, e, easy) => (easy ? e.towns > 0 : e.cities > 0 && c.surplus > 0.45) },
  roads: { say: 'roads', tier: 2, req: ['wheel'], can: (c, e) => e.sed >= 4 },
  laws: { say: 'written law', tier: 2, req: ['writing'], can: (c) => c.count >= 8, push: (c) => (c.coh < 0.45 ? 2 : 0) },
  chariots: { say: 'chariots', tier: 2, req: ['wheel', 'bronze'], can: (c) => !!c.tame.horse, push: (c) => (c.war ? 2 : 0) },
  // iron and empire
  iron: { say: 'iron', tier: 3, req: ['copper'], can: (c, e) => e.sed >= 3 && (c.metals & 8) !== 0 },
  sailing: { say: 'deep-sea sailing', tier: 3, req: ['boats'], can: (c, e) => e.coast >= 3 && c.timberOK !== false },
  alphabet: { say: 'the alphabet', tier: 3, req: ['writing'], can: (c) => (c.wealth || 0) > 10 },
  coinage: { say: 'coin', tier: 3, req: ['writing'], can: (c) => (c.metals & 16) !== 0 || (c.wealth || 0) > 40, push: (c) => ((c.wealth || 0) > 60 ? 2 : 0) },
  siege: { say: 'siege engines', tier: 3, req: ['masonry', 'wheel'], can: (c) => !!c.war || c.wins > 1, push: (c) => (c.war ? 3 : 0) },
  aqueducts: { say: 'aqueducts', tier: 3, req: ['masonry', 'roads'], can: (c, e) => e.cities > 0 },
  medicine: { say: 'medicine', tier: 3, req: ['writing'], push: (c) => (c.plagued ? 3 : 0) },
  bridges: { say: 'bridges', tier: 3, req: ['roads', 'masonry'], can: (c, e) => e.river > 0 },
  stirrups: { say: 'stirrups', tier: 3, req: ['riding'], can: (c) => !!c.tame.horse, push: (c) => (c.war ? 1 : 0) },
  // the long middle
  navigation: { say: 'navigation by the stars', tier: 4, req: ['sailing', 'counting'] },
  banking: { say: 'banking', tier: 4, req: ['coinage'], can: (c) => c.markets > 0 },
  bureaucracy: { say: 'a civil service', tier: 4, req: ['laws', 'writing'], can: (c) => c.count >= 20, push: (c) => (c.coh < 0.5 ? 2 : 0) },
  steel: { say: 'steel', tier: 4, req: ['iron'], can: (c) => (c.metals & 64) !== 0 || (c.metals & 8) !== 0 },
  mills: { say: 'watermills', tier: 4, req: ['masonry', 'wheel'], can: (c, e) => e.river > 0 },
  quarantine: { say: 'quarantine', tier: 4, req: ['medicine'], push: (c) => (c.plagued ? 3 : 0) },
  schools: { say: 'schools', tier: 4, req: ['alphabet'], can: (c, e) => e.cities > 0 },
  canals: { say: 'canals', tier: 4, req: ['irrigation', 'bureaucracy'] },
  dikes: { say: 'dikes and polders', tier: 4, req: ['mills'], can: (c, e) => e.lowcoast > 0, push: (c) => (c.crowded ? 2 : 0) },
  // powder and print
  printing: { say: 'printing', tier: 5, req: ['schools', 'mills'] },
  gunpowder: { say: 'gunpowder', tier: 5, req: ['steel'], can: (c) => (c.metals & 32) !== 0 || (c.metals & 64) !== 0, push: (c) => (c.war ? 3 : 0) },
  cannon: { say: 'cannon', tier: 5, req: ['gunpowder', 'steel'], push: (c) => (c.war ? 3 : 0) },
  sanitation: { say: 'sewers and clean water', tier: 5, req: ['aqueducts', 'medicine'], push: (c) => (c.plagued ? 2 : 0) },
  engines: { say: 'smoke and engines', tier: 5, req: ['steel', 'mills'], can: (c) => (c.metals & 64) !== 0 },
  railways: { say: 'railways', tier: 6, req: ['engines', 'roads'] },
  dynamite: { say: 'blasting powder', tier: 6, req: ['gunpowder', 'engines'] },
  // the other road: what sorcerers learn instead
  craft: { say: 'the craft', tier: 9, req: [] },
  wards: { say: 'warding', tier: 2, req: ['craft'], can: (c) => c.stance === 'use', push: (c) => (c.hurt > 1 ? 3 : 0) },
  weatherwork: { say: 'rain-calling', tier: 2, req: ['craft'], can: (c) => c.stance === 'use', push: (c) => (c._dry ? 3 : 0) },
  alchemy: { say: 'alchemy', tier: 3, req: ['craft', 'writing'], can: (c) => c.stance === 'use' },
  earthwork: { say: 'the raising of land', tier: 4, req: ['alchemy', 'weatherwork'], can: (c) => c.stance === 'use' },
};
export const ART_KEYS = Object.keys(ART);
// How much knowledge in general each era needs (the old thresholds, kept as the pace of history).
export const TECH = [3000, 120000, 1500000, 15000000, 40000000, 90000000];
export const techOf = (k) => { let t = 0; while (t < TECH.length && k >= TECH[t]) t++; return t; };

export function canLearn(c, k, easy) {
  const a = c.arts, T = ART[k]; if (!T || a[k]) return false;
  if (k === 'craft') return false;   // the craft comes from towers, not from study
  if (c.tech + (easy ? 1 : 0) < Math.min(T.tier, 8)) return false;
  if (c.banned && c.banned[k] && !easy) return false;
  for (const r of T.req) if (!a[r]) return false;
  return T.can ? !!T.can(c, c.env, easy) : true;
}
// Of everything a people could work out now, what are they most likely to? What troubles them.
export function nextInvention(c, rnd) {
  let tot = 0; const cand = [];
  for (const k of ART_KEYS) { if (k === 'herding' || !canLearn(c, k, false)) continue; const p = 1 + (ART[k].push ? ART[k].push(c) : 0); cand.push([k, p]); tot += p; }
  if (!cand.length) return null; let r = rnd() * tot; for (const [k, p] of cand) { r -= p; if (r <= 0) return { k, push: p }; }
  return { k: cand[cand.length - 1][0], push: cand[cand.length - 1][1] };
}
// Why a people cannot learn something yet, in words, for the Look panel.
const WHY = { farming: 'nothing they could sow grows near them', riding: 'they have no horses or camels', copper: 'there is no copper in their ground', bronze: 'they lack copper or tin', iron: 'they have no iron', sailing: 'they have no timber for ships', wheel: 'they have no draft animals', plough: 'they have no ox or horse to pull it', engines: 'they have no coal', gunpowder: 'they have no saltpetre or coal', steel: 'they have no iron or coal', coinage: 'they have no gold, and too little trade', banking: 'they have no great market' };
export function blockedReasons(c) {
  const out = [];
  for (const k of ['farming', 'riding', 'bronze', 'iron', 'sailing', 'wheel', 'plough', 'engines']) {
    const T = ART[k]; if (c.arts[k] || !T.can || c.tech + 1 < T.tier || T.req.some((r) => !c.arts[r])) continue;
    if (!T.can(c, c.env, true) && WHY[k]) out.push(`no ${T.say}: ${WHY[k]}`);
  }
  return out;
}
// The age a people lives in, in words.
export const ERA = ['the old stone', 'the first fields', 'bronze and kings', 'iron and empire', 'the long middle', 'powder and print', 'smoke and steam'];
// What their knowledge does to an army.
export function warMult(c) {
  const A = c.arts; let m = 1;
  if (A.bronze && !c.bronzeCut) m *= 1.3; if (A.iron) m *= 1.35; if (A.chariots) m *= 1.15; if (A.riding) m *= A.stirrups ? 1.55 : 1.3; if (A.steel) m *= 1.2;
  if (A.gunpowder) m *= 1.45; if (A.cannon) m *= 1.3; if (A.railways) m *= 1.2; if (A.wards) m *= 1.1; if (A.bureaucracy) m *= 1.15;
  return m;
}
// How much walls still matter against them.
export const wallsAgainst = (att) => (att.arts.cannon ? 1.0 : att.arts.siege ? 1.2 : 1.6);
// How much harder they are on the memory of the world, for magic.
export function drainOf(A) { let d = 0; for (const k in A) { const T = ART[k]; if (!T || k === 'craft' || T.req.includes('craft')) continue; d += T.tier >= 5 ? 0.012 : T.tier >= 4 ? 0.005 : T.tier >= 3 ? 0.003 : 0.001; } return d + (A.engines ? 0.03 : 0); }
