// Things that happen to a world: some by nature, any of them by your hand.
import { W, H, N, DISC, TPY, TAU, clamp, wx, wrapDx, NB8, latOf } from './core.js';
import { ev, discover } from './story.js';
import { ignite } from './life.js';
import { coarse, sampleCoarse } from './climate.js';
import { near, endSet, colorOf, whereAbouts, flee, gift, infect } from './people.js';
import { hitMovers } from './movers.js';
import { holySite } from './faith.js';
import { wetAt } from './weather.js';

const fall = (d, r) => { const u = d / (r + 0.5); return u >= 1 ? 0 : (1 - u * u) * (1 - u * u); };
const cell = (x, y) => clamp(Math.round(y), 1, H - 2) * W + wx(Math.round(x));
function hitTowns(w, x, y, r, fn) { near(w, x, y, r, null, false, (s, q) => fn(s, Math.sqrt(q))); if (w.anyDead) { w.sets = w.sets.filter((s) => !s.dead); w.anyDead = false; } }
function windAt(w, x, y) { const f = 0.5 - 0.5 * Math.cos(w.phase * TAU), o0 = coarse.out[0], o1 = coarse.out[1], xi = wx(Math.round(x)), yi = clamp(Math.round(y), 0, H - 1); return [sampleCoarse(o0.u, xi, yi) * (1 - f) + sampleCoarse(o1.u, xi, yi) * f, sampleCoarse(o0.v, xi, yi) * (1 - f) + sampleCoarse(o1.v, xi, yi) * f]; }

export function meteor(w, x, y) {
  x = wx(Math.round(x)); y = clamp(Math.round(y), 6, H - 7); const { h } = w, sea = w.params.sea, wet = w.water[y * W + x] === 1, wh = whereAbouts(w, x, y);
  for (const o of DISC[8]) { const i = (y + o[1]) * W + wx(x + o[0]), d = o[2];
    if (d <= 5) h[i] = Math.max(-1, h[i] - 0.2 * (1 - d / 6.2)); else h[i] = Math.min(1.2, h[i] + 0.05 * Math.max(0, 1 - Math.abs(d - 6.3) / 1.8));
    w.t[i] = 0; w.g[i] *= 0.2; w.farm[i] = 0; w.ash[i] = 1; w.magic[i] = Math.min(1, w.magic[i] + 0.5 * fall(d, 8)); if (d > 5 && !w.water[i]) ignite(w, i); }
  for (const hd of w.herds) if (wrapDx(hd.x - x) ** 2 + (hd.y - y) ** 2 < 100) hd.n = 0; for (const p of w.packs) if (wrapDx(p.x - x) ** 2 + (p.y - y) ** 2 < 100) p.n = 0;
  ev(w, `A star falls ${wh}.`, x, y, null); discover(w, 'crater', x, y);
  hitTowns(w, x, y, 14, (s, d) => { if (d < 6) endSet(w, s, 'crater'); else { flee(w, s, s.pop * 0.2); s.pop *= 0.55; } }); hitMovers(w, x, y, 12); holySite(w, x, y, 'crater', 0.6);
  w.aerosol = Math.min(1.5, w.aerosol + 0.3); w.fx.push({ k: 'boom', x, y, T: 2.2 }, { k: 'flash', x, y, T: 0.5 });
  w.stamp.land++; w.need.water = true; w.need.climate = true; w.edited = true;
  if (wet) tsunami(w, x, y, true);
  return true;
}

export function erupt(w, v, big) {
  const { h } = w, sea = w.params.sea, rnd = w.rnd, x = v.x, y = v.y; v.last = w.year; let rose = false;
  for (const o of DISC[3]) { const yy = y + o[1]; if (yy < 1 || yy >= H - 1) continue; const i = yy * W + wx(x + o[0]), was = h[i] < sea; h[i] = Math.min(1.2, h[i] + (big ? 0.1 : 0.06) * fall(o[2], 3)); if (was && h[i] >= sea && w.dSea[i] === 0) rose = true; }
  for (let s = 0; s < (big ? 5 : 3); s++) { let c = y * W + x;
    for (let st = 0; st < (big ? 20 : 12); st++) { if (w.water[c] === 1) { h[c] = Math.min(sea + 0.01, h[c] + 0.03); break; } w.lava[c] = 5; w.t[c] = 0; w.g[c] = 0; w.farm[c] = 0; w.soil[c] = 0.3;
      const cx = c % W, cy = (c / W) | 0; let best = -1, bh = h[c] + 0.012; const k0 = (rnd() * 8) | 0;
      for (let k = 0; k < 8; k++) { const d = NB8[(k + k0) & 7], yy = cy + d[1]; if (yy < 1 || yy >= H - 1) continue; const n = yy * W + wx(cx + d[0]); if (w.lava[n] === 5 && rnd() < 0.7) continue; if (h[n] < bh) { bh = h[n]; best = n; } }
      if (best < 0) break; c = best; } }
  const wv = windAt(w, x, y), wl = Math.hypot(wv[0], wv[1]) || 1, ux = wv[0] / wl, uy = wv[1] / wl, L = big ? 26 : 15;
  for (let a = 0; a < L; a++) for (const o of DISC[Math.min(6, 2 + (a >> 2))]) { const yy = Math.round(y + uy * a + o[1]); if (yy < 1 || yy >= H - 1) continue; const i = yy * W + wx(Math.round(x + ux * a + o[0])); if (w.water[i] === 1) continue; w.ash[i] = 1; w.soil[i] = Math.min(1.4, w.soil[i] + 0.03); if (w.farm[i] && rnd() < 0.2) w.farm[i] = 0; w.g[i] *= 0.85; }
  for (const hd of w.herds) if (wrapDx(hd.x - x) ** 2 + (hd.y - y) ** 2 < 36) hd.n = 0;
  hitTowns(w, x, y, L, (s, d) => { if (d < 4) endSet(w, s, 'buried'); else if (wrapDx(s.x - x) * ux + (s.y - y) * uy > 0 || d < 8) { flee(w, s, s.pop * 0.15); s.pop *= 0.8; } }); hitMovers(w, x, y, 6);
  w.aerosol = Math.min(1.5, w.aerosol + (big ? 0.6 : 0.28)); w.magic[y * W + x] = Math.min(1, w.magic[y * W + x] + 0.2);
  w.fx.push({ k: 'plume', x, y, T: 4, ux, uy });
  ev(w, `A mountain opens ${whereAbouts(w, x, y)}${big ? '. The sky goes dark for a thousand miles' : ''}.`, x, y, null, !big && !v.mine && !near(w, x, y, 16, null, true)); discover(w, 'eruption', x, y);
  if (rose && discover(w, 'island', x, y)) ev(w, 'Fire under the sea has built a new island.', x, y, null);
  if (w.aerosol > 0.55 && discover(w, 'winter', x, y)) ev(w, 'Ash hides the sun. Summer does not come.', x, y, null);
  w.stamp.land++; w.need.water = true; w.need.climate = true; w.edited = true;
}
export function volcano(w, x, y) {
  x = wx(Math.round(x)); y = clamp(Math.round(y), 4, H - 5);
  let v = w.volcanoes.find((q) => Math.abs(wrapDx(q.x - x)) <= 3 && Math.abs(q.y - y) <= 3);
  if (!v) { v = { x, y, heat: 1, last: -999, mine: true }; w.volcanoes.push(v); for (const o of DISC[4]) { const i = (y + o[1]) * W + wx(x + o[0]); w.h[i] = Math.min(1.2, w.h[i] + 0.16 * fall(o[2], 4)); } }
  erupt(w, v, w.rnd() < 0.3); return true;
}

export function tsunami(w, x, y, quiet) {
  x = wx(Math.round(x)); y = clamp(Math.round(y), 1, H - 2); const { water, h } = w, sea = w.params.sea, D = 62;
  let src = y * W + x; if (water[src] !== 1) { let ok = false; for (const o of DISC[5]) { const yy = y + o[1]; if (yy < 1 || yy >= H - 1) continue; const i = yy * W + wx(x + o[0]); if (water[i] === 1) { src = i; ok = true; break; } } if (!ok) return false; }
  const dist = w._td || (w._td = new Uint8Array(N)), q = w._tq || (w._tq = new Int32Array(N)), wetLand = []; dist.fill(255); let qn = 0; dist[src] = 0; q[qn++] = src; let hits = 0;
  for (let hd = 0; hd < qn; hd++) { const c = q[hd], d = dist[c] + 1; if (d > D) continue; const cx = c % W, cy = (c / W) | 0;
    for (let k = 0; k < 4; k++) { const yy = cy + (k === 2 ? -1 : k === 3 ? 1 : 0); if (yy < 1 || yy >= H - 1) continue; const n = yy * W + wx(cx + (k === 0 ? 1 : k === 1 ? -1 : 0)); if (dist[n] !== 255) continue;
      if (water[n] === 1) { dist[n] = d; q[qn++] = n; }
      else { const reach = 0.012 + 0.05 * (1 - d / D); let j = n, steps = 0; dist[n] = 254;
        // the wave runs inland over low ground
        const st = [n]; while (st.length && steps < 14) { const m = st.pop(); if (h[m] - sea > reach) continue; steps++; wetLand.push(m); w.farm[m] = 0; w.g[m] *= 0.5; w.t[m] *= 0.7; w.soil[m] = Math.max(0.2, w.soil[m] - 0.12); const mx = m % W, my = (m / W) | 0; for (let kk = 0; kk < 4; kk++) { const y2 = my + (kk === 2 ? -1 : kk === 3 ? 1 : 0); if (y2 < 1 || y2 >= H - 1) continue; const n2 = y2 * W + wx(mx + (kk === 0 ? 1 : kk === 1 ? -1 : 0)); if (dist[n2] === 255 && water[n2] !== 1) { dist[n2] = 254; st.push(n2); } } } } } }
  const hit = new Uint8Array(N); for (const m of wetLand) hit[m] = 1;
  for (const s of w.sets) { if (s.dead) continue; let n = 0; for (const o of DISC[2]) { const yy = s.y + o[1]; if (yy < 0 || yy >= H) continue; if (hit[yy * W + wx(s.x + o[0])]) n++; } if (!n) continue; hits++; if (hit[s.y * W + s.x] && (s.pop < 400 || w.rnd() < 0.5)) endSet(w, s, 'drowned'); else { flee(w, s, s.pop * 0.15); s.pop *= 0.45; } }
  for (const m of w.movers) { const mi2 = clamp(Math.round(m.y), 0, H - 1) * W + wx(Math.round(m.x)); if (dist[mi2] < 30 || hit[mi2]) m.done = true; }
  if (w.anyDead) { w.sets = w.sets.filter((s) => !s.dead); w.anyDead = false; }
  w.fx.push({ k: 'ring', x: src % W, y: (src / W) | 0, T: 3.2, R: D });
  if (!quiet || hits) ev(w, hits ? `The sea draws back, then comes in. ${hits} ${hits === 1 ? 'place is' : 'places are'} under the wave.` : 'A great wave crosses the sea and breaks on empty shores.', src % W, (src / W) | 0, null);
  discover(w, 'wave', src % W, (src / W) | 0); return true;
}

export function quake(w, x, y) {
  x = wx(Math.round(x)); y = clamp(Math.round(y), 10, H - 11); const rnd = w.rnd; let n = 0, lost = 0;
  for (const o of DISC[9]) { const i = (y + o[1]) * W + wx(x + o[0]); w.h[i] += (rnd() - 0.5) * 0.02 * fall(o[2], 9); }
  hitTowns(w, x, y, 11, (s, d) => { n++; const k = 1 - d / 12; if (s.tier >= 1 && rnd() < 0.16 * k + (s.tier === 3 ? 0.05 : 0)) { endSet(w, s, 'swallowed'); lost++; } else s.pop *= 1 - 0.5 * k * (s.walls ? 1.15 : 1); });
  w.fx.push({ k: 'shake', x, y, T: 1.6 });
  ev(w, n ? `The ground shakes ${whereAbouts(w, x, y)}. ${lost ? 'Whole streets fall into the earth.' : 'Walls come down.'}` : `The ground shakes ${whereAbouts(w, x, y)}. Nobody is there to feel it.`, x, y, null, !n); discover(w, 'quake', x, y);
  w.stamp.land++; w.need.water = true; w.edited = true;
  let wet = false; for (const o of DISC[4]) if (w.water[(y + o[1]) * W + wx(x + o[0])] === 1) wet = true; if (wet) tsunami(w, x, y, true);
  return true;
}

export function plagueAt(w, x, y) { const s = near(w, Math.round(x), Math.round(y), 8, null, false); if (!s) return false; s.immune = 0; s.plague = 0; infect(w, s, null, true); ev(w, `A sickness comes to ${s.name || 'a band of the ' + w.cults[s.cult].name}.`, s.x, s.y, colorOf(w.cults[s.cult])); return true; }
export function overgrow(w, x, y, r) {
  x = Math.round(x); y = Math.round(y); let any = false;
  for (const o of DISC[Math.min(20, r)]) { const yy = y + o[1]; if (yy < 1 || yy >= H - 1) continue; const i = yy * W + wx(x + o[0]); if (w.water[i]) continue; const k = fall(o[2], r); if (k < 0.15) continue; w.farm[i] = 0; w.road[i] = 0; w.t[i] = Math.max(w.t[i], 0.9 * k); w.wetBias[i] = Math.min(2.5, w.wetBias[i] + 0.05 * k); w.magic[i] = Math.min(1, w.magic[i] + 0.04 * k); any = true; }
  hitTowns(w, x, y, r, (s) => { s.pop *= 0.82; if (s.pop < 45) endSet(w, s, 'overgrown'); });
  w.need.derive = true; return any;
}
export function babel(w, x, y) {
  const s = near(w, Math.round(x), Math.round(y), 8, null, false); if (!s) return false; const c = w.cults[s.cult]; if (c.count < 3) return false;
  ev(w, `The ${c.name} wake one morning and cannot understand each other.`, s.x, s.y, colorOf(c)); c.coh = 0.06; c.born = w.year - 2200; w.babel = (w.babel || 0) + 1; return true;
}
export function inspire(w, x, y) {
  const s = near(w, Math.round(x), Math.round(y), 8, null, false); if (!s) return false; const c = w.cults[s.cult];
  const art = gift(w, c); ev(w, art ? `The ${c.name} wake one morning knowing ${art}. Nobody can say who thought of it.` : `An idea takes hold among the ${c.name} and will not let go.`, s.x, s.y, colorOf(c)); w.fx.push({ k: 'spark', x: s.x, y: s.y, T: 1.6 }); return true;
}
export function stormAt(w, x, y) { x = wx(Math.round(x)); y = clamp(Math.round(y), 2, H - 3); if (w.storms.length >= 6) return false; w.storms.push({ x, y, str: w.water[y * W + x] === 1 ? 1 : 0.8, life: 22, mine: true, spin: w.rnd() * 6 }); return true; }

// Locusts: a swarm rides the wind for a couple of years and eats what it lands on.
export function locustAt(w, x, y) { x = wx(Math.round(x)); y = clamp(Math.round(y), 2, H - 3); if (w.water[y * W + x] || w.swarms.length >= 5) return false; w.swarms.push({ x, y, px: x, py: y, life: 18, told: false }); return true; }
export function swarmsTick(w) {
  const rnd = w.rnd;
  for (const s of w.swarms) {
    const wv = windAt(w, s.x, s.y); s.px = s.x; s.py = s.y; s.x = wx(s.x + wv[0] * 1.6 + (rnd() - 0.5) * 1.2); s.y = clamp(s.y + wv[1] * 1.6 + (rnd() - 0.5) * 1.2, 2, H - 3); s.life--;
    const cx = Math.round(s.x), cy = Math.round(s.y); let ate = 0;
    for (const o of DISC[3]) { const yy = cy + o[1]; if (yy < 1 || yy >= H - 1) continue; const i = yy * W + wx(cx + o[0]); if (w.water[i]) continue; ate += w.g[i]; w.g[i] *= 0.6; if (w.farm[i]) { w.farm[i] = 2; ate += 1; } }
    if (w.water[cy * W + wx(cx)] === 1) s.life -= 2; if (ate < 1.5) s.life -= 2;
    if (!s.told) { const t = near(w, cx, cy, 5, null, true); if (t) { s.told = true; ev(w, `Locusts darken the sky over ${t.name}.`, t.x, t.y, null, discover(w, 'locusts', t.x, t.y) ? 0 : 1); } }
  }
  if (w.swarms.some((s) => s.life <= 0)) w.swarms = w.swarms.filter((s) => s.life > 0);
}

export function stormsTick(w) {
  const rnd = w.rnd, { water, temp } = w;
  // late summer over warm water breeds storms
  const ph = w.phase;
  for (const hemi of [1, -1]) { const season = hemi > 0 ? ph > 0.5 && ph < 0.8 : ph < 0.3 && ph > 0.0; if (!season || w.storms.length >= 4 || rnd() > 0.12) continue;
    for (let q = 0; q < 30; q++) { const lat = hemi * (8 + rnd() * 16), y = Math.round((0.5 - lat / 156) * H), x = (rnd() * W) | 0, i = y * W + x; if (water[i] === 1 && temp[i] > 25.5) { w.storms.push({ x, y, str: 0.5, life: 26, spin: rnd() * 6 }); break; } } }
  for (const s of w.storms) {
    const i = cell(s.x, s.y), wv = windAt(w, s.x, s.y), sg = latOf(s.y) >= 0 ? -1 : 1; s.px = s.x; s.py = s.y;
    s.x = wx(s.x + wv[0] * 2.6); s.y = clamp(s.y + wv[1] * 2.2 + sg * 0.55, 2, H - 3); s.life--;
    if (water[i] === 1) s.str = Math.min(1.6, s.str + (temp[i] > 25 ? 0.12 : -0.08)); else {
      s.str *= 0.86; const r = 3;
      for (const o of DISC[r]) { const yy = Math.round(s.y) + o[1]; if (yy < 1 || yy >= H - 1) continue; const j = yy * W + wx(Math.round(s.x) + o[0]); if (water[j]) continue; w.fireT[j] = 0; w.g[j] = Math.min(1, w.g[j] + 0.03); if (w.farm[j] && rnd() < 0.05 * s.str) w.farm[j] = 0; if (w.t[j] > 0.3 && rnd() < 0.03 * s.str) w.t[j] *= 0.8; }
      near(w, Math.round(s.x), Math.round(s.y), 4, null, true, (t) => { t.pop *= 1 - 0.04 * s.str; if (s.str > 0.7 && t.tier >= 2 && discover(w, 'storm', t.x, t.y)) ev(w, `A storm off the warm sea comes ashore at ${t.name}.`, t.x, t.y, null); });
    }
  }
  if (w.storms.some((s) => s.life <= 0 || s.str < 0.25)) w.storms = w.storms.filter((s) => s.life > 0 && s.str >= 0.25);
}

// Once a year: volcanoes and faults do their own thing, lava cools, and the almanac checks
// whether the world has produced anything new.
export function naturalYear(w) {
  const rnd = w.rnd, sea = w.params.sea, { h, mi, water } = w;
  for (let i = 0; i < N; i++) if (w.lava[i]) { if (--w.lava[i] === 0) { w.soil[i] = 0.45; h[i] = Math.min(1.2, h[i] + 0.012); w.stamp.land++; } }
  for (const v of w.volcanoes) if (w.year - v.last > 60 && rnd() < 0.0007) erupt(w, v, rnd() < 0.12);
  if (rnd() < 0.008 && w._pd) { for (let q = 0; q < 60; q++) { const i = (rnd() * N) | 0; if (w._pd[i] === 0) { quake(w, i % W, (i / W) | 0); break; } } }
  // a wet year after dry ones in warm grass country hatches locusts
  if (w.swarms.length < 2 && rnd() < 0.2) for (let q = 0; q < 30; q++) { const i = (rnd() * N) | 0; if (water[i] || mi[i] < 0.2 || mi[i] > 0.75 || w.tMean[i] < 14 || w.g[i] < 0.45) continue; const x = i % W, y = (i / W) | 0; if (wetAt(w, x, y) > 1.28) { locustAt(w, x, y); break; } }
  // sea level follows the ice
  const auto = clamp((w.ice0 - w.landIce) * 0.5, -0.07, 0.05);
  if (Math.abs(auto - w.seaAuto) > 0.004) { if (auto < w.seaAuto) w.seaFell = true; w.seaAuto += clamp(auto - w.seaAuto, -0.0015, 0.0015); w.params.sea = w.params.seaDial + w.seaAuto; w.need.water = true; w.stamp.land++; }
  // almanac
  if (w.landIce > 0.24 && !w.inIce) { w.inIce = true; if (discover(w, 'iceage', null, null)) ev(w, 'The ice is coming down from the poles.', null, null, null); }
  else if (w.inIce && w.landIce < 0.07) { w.inIce = false; if (discover(w, 'thaw', null, null)) ev(w, 'The ice lets go. The seas are rising.', null, null, null); }
  if (w.aerosol > 0.55) discover(w, 'winter', null, null);
  if ((w.burnedThisYear || 0) > 900 && w.burnAt != null) { if (discover(w, 'megafire', w.burnAt % W, (w.burnAt / W) | 0)) ev(w, 'Half a country is burning.', w.burnAt % W, (w.burnAt / W) | 0, null); } w.burnedThisYear = 0;
  if (w.deltaAt != null) { w.deltaN = (w.deltaN || 0) + 1; if (w.deltaN >= 5 && discover(w, 'delta', w.deltaAt % W, (w.deltaAt / W) | 0)) ev(w, 'A river has built new land where it meets the sea.', w.deltaAt % W, (w.deltaAt / W) | 0, null); w.deltaAt = null; }
  if (w.bigLake && w.bigLake.n >= 45) discover(w, 'lake', w.bigLake.x, w.bigLake.y);
  if (w.year % 5 === 2) {
    let des = 0, land = 0, forest = 0, mon = 0, mx = 0, my = 0, dx0 = 0, dy0 = 0; const f0 = coarse.out[0], f1 = coarse.out[1];
    for (let k = 0; k < 900; k++) { const i = (rnd() * N) | 0; if (water[i] === 1) continue; land++; const x = i % W, y = (i / W) | 0;
      if (w.t[i] > 0.5) forest++;
      const a = w.rJan[i], b = w.rJul[i]; if (Math.max(a, b) > 1.5 && Math.min(a, b) < 0.25 * Math.max(a, b)) { mon++; mx = x; my = y; }
      if (mi[i] < 0.2 && !w.ice[i] && w.tMean[i] > 4) { des++; dx0 = x; dy0 = y;
        if (!w.found.shadow && w.mi0[i] > 0.4) { const u = (sampleCoarse(f0.u, x, y) + sampleCoarse(f1.u, x, y)) * 0.5, v = (sampleCoarse(f0.v, x, y) + sampleCoarse(f1.v, x, y)) * 0.5, l = Math.hypot(u, v) || 1; let peak = false;
          for (let s = 2; s <= 18; s++) { const yy = Math.round(y - (v / l) * s); if (yy < 1 || yy >= H - 1) break; const j = yy * W + wx(Math.round(x - (u / l) * s)); if (h[j] - sea > 0.3) peak = true; else if (peak && mi[j] > 0.9 && water[j] !== 1) { discover(w, 'shadow', x, y); break; } } } } }
    if (land) { const b = w.base; if (des / land > Math.max(0.2, b.desert + 0.08)) discover(w, 'desert', dx0, dy0); if (forest / land > Math.max(0.5, b.forest + 0.12)) discover(w, 'primeval', null, null); if (w.year > 30 && mon / land > Math.max(0.05, b.monsoon + 0.06)) discover(w, 'monsoon', mx, my); }
  }
}
