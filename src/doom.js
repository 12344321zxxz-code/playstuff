// The end of the world, if it comes. Nothing here is scheduled: peoples who split the atom and
// build the bomb mostly stop fighting each other, because now they can lose everything. The
// danger is the rest of the time. A mad ruler, a capital about to fall, a holy war, a dead king
// spreading terror at the gates, or nothing at all, a false alarm, and one bomb falls. Allies
// answer for allies. Each city that burns leaves a scar of death memory larger than any war or
// plague, the ley lines carry it to the wellsprings, and the dead walk in numbers the world has
// never seen. The smoke dims the sun for years. Whoever is left forgets the engines and the wires,
// and in the quiet the old powers come back. Then someone digs in a ruin and finds a bomb that works.
import { nukeDeep } from './greatpowers.js';
import { record } from './ledger.js';
import { W, H, N, DISC, wx, wrapDx, clamp, CS, CW, CH, CN , peopleText } from './core.js';
import { coarse } from './climate.js';
import { ev, discover, once } from './story.js';
import { near, endSet, flee, infect, collapse } from './people.js';
import { remember, DEATH, FIRE } from './memory.js';
import { ignite } from './life.js';
import { send, arrive } from './movers.js';
import { ART, TECH } from './tech.js';

export function initDoom(w) { w.fallout = new Float32Array(N); w.veil = new Float32Array(CN); w.hot = []; w.glassI = []; w.craters = []; w.soot = 0; w.nukes = 0; w.clock = 12 * 60; w.deadAge = null; }
const big = (n) => peopleText(n);

// Once a year: arsenals grow, tempers rise, and sometimes a hand reaches for the key.
export function doomYear(w) {
  const rnd = w.rnd; let armed = 0, tension = 0;
  const nuclear = w.cults.filter((c) => c.alive && c.arts.bomb);
  for (const c of w.cults) { if (c.power) continue;
    if (!c.alive) continue;
    // a neighbour with the bomb is a reason to want one
    c.threat = nuclear.some((o) => o !== c && (c.nb[o.id] || 0) > 0.2) ? 1 : 0;
    if (!c.arts.bomb) continue; armed++;
    if (c.bombs == null) { c.bombs = 0; if (once(w, 'firstbomb') && c.big) { ev(w, `In a desert far from ${c.big.name}, the ${c.name} light a second sun. It is brighter than anything anyone has seen, and for a moment it is completely silent.`, c.big.x, c.big.y, c.color, 2); discover(w, 'bomb', c.big.x, c.big.y); } }
    if (c.bombs < 40 && (c.metals & 128) && rnd() < 0.3) c.bombs += 1 + (c.arts.missiles ? 1 : 0);
    const war = c.war, foe = war ? w.cults[war.foe] : null;
    if (war) tension += foe && foe.arts.bomb ? 3 : 1;
    if (!c.bombs || !c.big) continue;
    // what might make them use it
    let p = 0;
    if (war && foe && foe.alive) {
      p += 0.0008;
      if (c.ruler.trait === 'mad') p += 0.04;
      if (w.year - (c.lostCapAt || -99) < 8) p += 0.1;
      if (war.lost > war.taken + 2) p += 0.03;
      if (c.zeal && foe.faith !== c.faith) p += 0.03;
      if (c.hurt > 3) p += 0.02;
      if (foe.arts.bomb) p *= 0.6;   // they would answer
    } else if (nuclear.some((o) => o !== c && (c.nb[o.id] || 0) > 0.5)) p += 0.00015;   // a flock of geese on the screen, at night
    if (w.exchange && w.year <= w.exchange.until) { if (war && foe && foe.alive && rnd() < 0.7) strike(w, c, foe, 'answer'); continue; }   // once it starts, everyone empties their silos
    if (rnd() < p) { const target = foe && foe.alive ? foe : nuclear.find((o) => o !== c && (c.nb[o.id] || 0) > 0.5); if (target) strike(w, c, target, foe ? 'war' : 'alarm'); }
  }
  // the clock: how close the world is to midnight
  const mins = armed === 0 ? 12 * 60 : Math.max(1, 12 * 60 - armed * 25 - tension * 30 - (w.nukes ? 120 : 0));
  w.clock = mins; w.stats.clock = armed ? (mins >= 60 ? Math.round(mins / 60) + 'h' : mins + 'm') : '—';
  // fallout and soot fade; the dead outlast both
  falloutYear(w);
  w.soot *= 0.95; if (w.soot > 0.25 && w.year % 4 === 0) w.need.climate = true;
  // atomic power stations, and what happens when one fails
  for (const c of w.cults) if (c.alive && c.arts.reactors && c.big && rnd() < 0.0006) meltdown(w, c);
  // bred plagues get out
  for (const c of w.cults) if (c.alive && c.arts.germlabs && c.big && rnd() < (c.war && c.war.lost > c.war.taken ? 0.01 : 0.0015)) breedPlague(w, c, c.war && rnd() < 0.5 ? w.cults[c.war.foe] : null);
  deadAge(w);
  // when the bombs fall by the dozen, the machines go with the cities
  const recent = (w.recent || []).filter((y) => w.year - y < 15); w.recent = recent;
  // a world that loses most of its people loses what they knew, bombed or not
  const ppl = w.stats.people || 0; if (!(w.darkUntil > w.year)) { if (w.fellAll || w.wasDark) w.peakPop = 0; w.fellAll = w.wasDark = false; w.peakPop = Math.max(w.peakPop || 0, ppl); } else w.wasDark = true;
  // (a world that loses most of its people loses what they knew through the carrier rule in people.js, unevenly)
  if (recent.length >= 8 && w.year - (w.fellAt || -999) > 100) { w.fellAt = w.year; if (recent.length >= 15) w.fellAll = true; aftermath(w, recent.length);
    ev(w, 'No one is left who knows how the machines worked. The wires are cold, the engines rust in the fields, and the books are used to light fires through the long winter.', null, null, null, 2); discover(w, 'machinesfall', null, null); }
}
export const sootTick = (w) => { if (w.soot > w.aerosol) w.aerosol = w.soot; };

// A launch: the attacker sends what it has at the enemy's largest cities. Their allies may answer.
function strike(w, c, f, why) {
  record(w, 'launch', [c.id, f.id], { note: why || 'retaliation', x: c.big ? c.big.x : null, y: c.big ? c.big.y : null });
  const n = Math.max(1, Math.min(c.bombs, why === 'alarm' ? 2 : 1 + Math.floor(c.bombs / 4)));
  const targets = w.sets.filter((s) => !s.dead && s.cult === f.id && !s.nomad).sort((a, b) => b.pop - a.pop).slice(0, n); if (!targets.length) return;
  c.bombs -= targets.length; const b = c.big; c.fired = w.year; f.struck = w.year;
  if (!w.exchange || w.year > w.exchange.until) { w.exchange = { from: w.year, until: w.year + 3 }; }
  const first = !w.nukes;
  ev(w, first ? (why === 'alarm' ? `Something shows on the screens of the ${c.name} that looks like an attack. There are four minutes to decide. They decide.` : c.ruler.trait === 'mad' ? `${c.ruler.name} orders the bombs. Nobody stops him.` : `With the war lost, the ${c.name} use the bomb.`) : `The ${c.name} launch at the cities of the ${f.name}.`, b.x, b.y, c.color, 2);
  for (const s of targets) send(w, { kind: 'missile', cult: c.id, x: b.x, y: b.y, tx: s.x, ty: s.y, n: 1, to: s, land: c.arts.missiles ? 9 : 5, sea: c.arts.missiles ? 9 : 5 });
  // answers: the struck, and anyone who stands with them
  for (const o of w.cults) {
    if (!o.alive || o === c || !o.bombs || o.answered === w.year) continue;
    const isAlly = o === f || (o.war && o.war.foe === c.id) || (f.nb[o.id] || 0) > 1 && o.faith === f.faith;
    if (isAlly && w.rnd() < (o === f ? 0.9 : 0.5)) { o.answered = w.year; o.war = o.war || { foe: c.id, since: w.year, until: w.year + 5, taken: 0, lost: 0, mine: true }; strikeLater(w, o, c); }
  }
}
function strikeLater(w, o, c) { (w.pending || (w.pending = [])).push({ o: o.id, c: c.id, at: w.tickN + 6 }); }
export function doomTick(w) {
  sootTick(w);
  if (!w.pending || !w.pending.length) return;
  const now = w.pending.filter((p) => p.at <= w.tickN); w.pending = w.pending.filter((p) => p.at > w.tickN);
  for (const p of now) { const o = w.cults[p.o], c = w.cults[p.c]; if (o.alive && c.alive && o.bombs && o.big) strike(w, o, c, 'answer'); }
}
arrive.missile = (w, m) => nuke(w, Math.round(m.tx), Math.round(m.ty), w.cults[m.cult]);

// One bomb.
export function nuke(w, x, y, by) {
  nukeDeep(w, x, y, by);
  x = wx(x); y = clamp(y, 2, H - 3); const sea = w.params.sea; w.nukes++;
  const hit = near(w, x, y, 1.5, null, false), name = hit && hit.name ? hit.name : null; let dead = 0;
  near(w, x, y, 11, null, false, (s, q) => { const d = Math.sqrt(q); const k = d < 5 ? 1 : 0.7 * (1 - (d - 5) / 6); dead += s.pop * k; s.pop *= 1 - k; const c = w.cults[s.cult]; c.hurt = (c.hurt || 0) + 4; if (s === c.big) c.lostCapAt = w.year; if (s.pop < 20) endSet(w, s, 'nuked', by ? by.name : null); else flee(w, s, s.pop * 0.3); });
  for (const o of DISC[14]) { const yy = y + o[1]; if (yy < 1 || yy >= H - 1) continue; const i = yy * W + wx(x + o[0]), d = o[2];
    if (d < 3) w.h[i] = Math.min(w.h[i], w.h[i] - 0.05);
    if (w.water[i]) continue; if (d < 3) { w.glass = w.glass || new Uint8Array(N); if (!w.glass[i]) (w.glassI || (w.glassI = [])).push(i); w.glass[i] = 255; } if (d < 10) { w.t[i] = 0; w.g[i] *= 0.1; w.farm[i] = 0; w.ash[i] = 1; w.urban[i] = 0; w.graze[i] = 0; w.hunt[i] = 0; if (d > 2 && w.rnd() < 0.5) ignite(w, i); } }
  // the fallout: a hot zone around the city, lying downwind, and a share for the high winds
  hotZone(w, x, y, 1.6, 0.35, 70, name); w.veil[((y / CS) | 0) * CW + ((x / CS) | 0)] += 160;
  (w.craters || (w.craters = [])).push({ x, y, at: w.year, name, lake: false });
  w.soot = Math.min(1.6, w.soot + 0.13); (w.recent || (w.recent = [])).push(w.year); w.aerosol = Math.max(w.aerosol, w.soot);
  remember(w, x, y, DEATH, 1.4, 9, 'nuked', name ? `the fire that fell on ${name}` : 'the fire that fell from the sky', { place: name || 'the burned country' });
  remember(w, x, y, FIRE, 0.7, 5);
  w.fx.push({ k: 'nuke', x, y, T: 4 }, { k: 'flash', x, y, T: 0.6 });
  ev(w, name ? `${name} is gone. ${big(dead)} people, in less time than it takes to say it.` : `A bomb falls on open country. Nothing that lived there lives.`, x, y, null, 2);
  discover(w, 'nuked', x, y);
  if (w.nukes === 6) ev(w, 'The smoke of the burning cities has risen so high that the sun is a dim red coin. Winter is coming, and it will be a long one.', x, y, null, 2);
  if (w.nukes >= 6) discover(w, 'nukewinter', x, y);
  // a people that has lost its capital to the bomb comes apart and forgets
  if (hit && hit.dead) { const c = w.cults[hit.cult]; if (c.big === hit || (c.big && c.big.dead)) c.big = w.sets.filter((q) => q.cult === c.id && !q.dead && !q.nomad).sort((a, b) => b.pop - a.pop)[0] || null; if (c.alive && c.count >= 6 && c.big && w.year - (c.fellAt || -999) > 40) { collapse(w, c); for (const k of ['missiles', 'bomb', 'rockets', 'radio', 'flight', 'telegraph', 'electricity']) if (c.arts[k] && w.rnd() < 0.6) delete c.arts[k]; c.bombs = 0; } }
  w.stamp.land++; w.need.water = true;
}
// An atomic power station fails.
function meltdown(w, c) {
  const S = w.sets.filter((s) => s.cult === c.id && s.tier >= 2 && !s.dead); if (!S.length) return; const s = S[(w.rnd() * S.length) | 0];
  hotZone(w, s.x, s.y, 0.6, 0.5, 18, s.name); w.veil[((s.y / CS) | 0) * CW + ((s.x / CS) | 0)] += 12;
  flee(w, s, s.pop * 0.6); s.pop *= 0.3; remember(w, s.x, s.y, DEATH, 0.5, 4, 'nuked', `the poisoned country around ${s.name}`, { place: s.name });
  ev(w, `The power station outside ${s.name} catches fire and will not go out. The town is emptied in a day and nobody goes back.`, s.x, s.y, c.color, 0); discover(w, 'meltdown', s.x, s.y); c.arts.reactors = w.year - 1; if (rnd2(w) < 0.4) { delete c.arts.reactors; c.banned = c.banned || {}; c.banned.reactors = w.year; }
}
// A plague made on purpose, and how it escapes.
function breedPlague(w, c, foe) {
  const at = foe && foe.big ? foe.big : c.big; if (!infect(w, at, null, true)) return;
  const st = w.plagues[at.pid]; st.v = 0.4; st.catchy = 0.95; st.engineered = true; st.great = true; st.name = ['Grey Fever', 'Glass Lung', 'Quiet Sickness'][(w.rnd() * 3) | 0];
  ev(w, foe ? `The ${c.name} let loose a sickness of their own making among the ${foe.name}. They are sure they can keep it there.` : `Something gets out of a laboratory of the ${c.name}. They call it the ${st.name}. No one is hardened to it, because it has never existed before.`, at.x, at.y, c.color, 2); discover(w, 'germwar', at.x, at.y);
}
// When the world remembers enough death at once, the dead stop keeping to their limits.
function deadAge(w) {
  const d = w.memStat ? w.memStat[0] : 0;
  if (!w.deadAge && w.nukes >= 3 && d > 120) { w.deadAge = w.year; ev(w, 'There is more death in the ground than the world can hold. The dead are walking everywhere at once. Survivors will call it the Age of the Dead.', null, null, null, 2); discover(w, 'deadage', null, null); }
  else if (w.deadAge && d < 50 && w.year - w.deadAge > 40) { ev(w, `The Age of the Dead ends after ${w.year - w.deadAge} years. The ground is quiet. The living come out and count themselves.`, null, null, null, 2); w.deadAge = null; }
}
// The god's hand: take the bombs away from a people, or drop one yourself.
export function disarm(w, x, y) { const s = near(w, Math.round(x), Math.round(y), 10, null, false); if (!s) return false; const c = w.cults[s.cult]; if (!c.arts.bomb && !c.arts.atomic) return false; delete c.arts.bomb; delete c.arts.missiles; c.bombs = 0; c.banned = c.banned || {}; c.banned.bomb = w.year; c.banned.atomic = w.year; ev(w, `The ${c.name} take their bombs apart and bury the pieces. Nobody can say afterwards quite why they agreed to.`, s.x, s.y, c.color, 0); return true; }

const rnd2 = (w) => w.rnd();

// Fallout (slice 14). Two parts. A thin veil on the coarse climate grid that the winds carry round
// the world and that fades over a few decades; and hot zones, a short list of struck cities and
// failed reactors, each a streak lying downwind whose strength is a·e^(-t/30) + b·e^(-t/250): most of
// it is gone in a lifetime, the rest takes centuries. Peoples who learn to clean the land age the
// zones on their own ground three times as fast. The glass where a city stood crumbles over about
// three hundred years; the crater fills with rain.
const shapes = new WeakMap();
function hotZone(w, x, y, a, b, len, place) {
  const dir = w.params.spin >= 0 ? 1 : -1;
  (w.hot || (w.hot = [])).push({ x: wx(x), y: clamp(y, 1, H - 2), a, b, age: 0, len, dir, place: place || null, at: w.year });
}
function shapeOf(z) {
  let sh = shapes.get(z); if (sh) return sh; const m = new Map();
  for (let k = 0; k < z.len; k++) { const cx = wx(z.x + z.dir * k), cy = clamp(Math.round(z.y + Math.sin(k * 0.21 + z.x) * k * 0.2), 1, H - 2), r = 3 + Math.min(8, k / 6) | 0, a = 1 - k / (z.len + 10);
    for (const o of DISC[r]) { const yy = cy + o[1]; if (yy < 0 || yy >= H) continue; const i = yy * W + wx(cx + o[0]), v = a * (1 - o[2] / (r + 1)); m.set(i, Math.min(1.25, (m.get(i) || 0) + v)); } }
  sh = { i: Int32Array.from(m.keys()), v: Float32Array.from(m.values()) }; shapes.set(z, sh); return sh;
}
const _vl = new Float32Array(CN);
// owner holds the index of the owning town; cleaning goes by its people
const ownerCult = (w, i) => { const k = w.owner[i], s = k >= 0 ? w.sets[k] : null; return s && !s.dead ? s.cult : -1; };
function falloutYear(w) {
  const fo = w.fallout, V = w.veil || (w.veil = new Float32Array(CN)), Z = w.hot || (w.hot = []);
  if (w.glass && !w.glassI) { w.glassI = []; for (let i = 0; i < N; i++) if (w.glass[i]) w.glassI.push(i); }   /* an older save */
  glassYear(w);
  let vs = 0; for (let i = 0; i < CN; i++) vs += V[i];
  if (!Z.length && vs < 0.5) { if (w.foOn) { fo.fill(0); w.foOn = false; w.stats.fallout = 0; for (const c of w.cults) c.poisoned = 0; } return; }
  w.foOn = true;
  // the veil: three steps on the wind each year, a little spreading, and it fades
  const f = 0.5 - 0.5 * Math.cos(w.phase * 6.283185), o0 = coarse.out[0], o1 = coarse.out[1];
  for (let st = 0; st < 4; st++) {
    _vl.fill(0);   /* pushed forward along the wind, so nothing is lost on the way */
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { const i = y * CW + x, m = V[i]; if (!m) continue; const u = (o0.u[i] * (1 - f) + o1.u[i] * f) * 2, v = (o0.v[i] * (1 - f) + o1.v[i] * f) * 2;
      let px = x + u; const py = clamp(y + v, 0, CH - 1.001); px = ((px % CW) + CW) % CW; const x0 = px | 0, y0 = py | 0, fx = px - x0, fy = py - y0, x1 = (x0 + 1) % CW, y1 = Math.min(CH - 1, y0 + 1);
      _vl[y0 * CW + x0] += m * (1 - fx) * (1 - fy); _vl[y0 * CW + x1] += m * fx * (1 - fy); _vl[y1 * CW + x0] += m * (1 - fx) * fy; _vl[y1 * CW + x1] += m * fx * fy; }
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { const i = y * CW + x, n = y > 0 ? _vl[i - CW] : _vl[i], s2 = y < CH - 1 ? _vl[i + CW] : _vl[i]; V[i] = _vl[i] * 0.4 + (n + s2 + _vl[y * CW + (x + 1) % CW] + _vl[y * CW + (x + CW - 1) % CW]) * 0.15; }
  }
  for (let y = 0; y < CH; y++) { let m = 0; for (let x = 0; x < CW; x++) m += V[y * CW + x]; m /= CW; for (let x = 0; x < CW; x++) V[y * CW + x] += (m - V[y * CW + x]) * 0.15; }   /* the high winds carry it round the world in bands */
  // cleaning: whoever owns the land under a zone and knows how, clears it three times as fast
  const clean = new Set(); for (const c of w.cults) if (c.alive && c.arts.cleanup && !c.power) clean.add(c.id);
  for (let i = 0; i < CN; i++) { const x = (i % CW) * CS + 2, y = ((i / CW) | 0) * CS + 2, o = ownerCult(w, y * W + x); V[i] *= o >= 0 && clean.has(o) ? 0.88 : 0.97; if (V[i] < 1e-4) V[i] = 0; }
  // the field the land and the towns feel: the veil (thin) plus every hot zone
  for (let y = 0; y < H; y++) { const cy = Math.min(CH - 1, (y / CS) | 0); for (let x = 0; x < W; x++) { const v = V[cy * CW + ((x / CS) | 0)] * 0.35; fo[y * W + x] = v > 0.004 ? Math.min(0.12, v) : 0; } }
  for (let k = Z.length - 1; k >= 0; k--) { const z = Z[k], o = ownerCult(w, z.y * W + z.x);
    z.age += o >= 0 && clean.has(o) ? 3 : 1; if (o >= 0 && clean.has(o)) z.cleanedBy = o;
    const s = z.a * Math.exp(-z.age / 30) + z.b * Math.exp(-z.age / 250);
    if (s < 0.012) { if (z.cleanedBy != null && w.cults[z.cleanedBy] && z.place) { const c = w.cults[z.cleanedBy]; ev(w, `The ${c.name} have scraped the last of the poison out of the country around ${z.place}. Children may play there again.`, z.x, z.y, c.color, 0); discover(w, 'cleaned', z.x, z.y); } Z.splice(k, 1); shapes.delete(z); continue; }
    const sh = shapeOf(z); for (let j = 0; j < sh.i.length; j++) { const i = sh.i[j]; fo[i] = Math.min(2, fo[i] + s * sh.v[j]); } }
  // who is poisoned, and how badly: the mean over each realm's towns
  const sum = new Float32Array(w.cults.length), cnt = new Uint16Array(w.cults.length);
  for (const t of w.sets) { if (t.dead) continue; const v = fo[t.y * W + t.x]; sum[t.cult] += v > 0.05 ? Math.min(1, v) : 0; cnt[t.cult]++; }
  for (const c of w.cults) { c.poisoned = cnt[c.id] ? sum[c.id] / cnt[c.id] : 0; if (c.arts.cleanup && c.poisoned > 0.01) c.surplus = Math.max(0, (c.surplus || 0) - 0.05); }
  let land = 0, hot = 0; for (let i = 0; i < N; i += 7) if (!w.water[i]) { land++; if (fo[i] > 0.12) hot++; } w.stats.fallout = land ? hot / land : 0;
}
function glassYear(w) {
  const G = w.glassI; if (G && G.length) { const g = w.glass;
    for (let k = G.length - 1; k >= 0; k--) { const i = G[k]; if (w.rnd() < 0.85) g[i]--; const left = g[i] / 255;
      if (!g[i]) { G[k] = G[G.length - 1]; G.pop(); w.soil[i] = Math.max(w.soil[i], 0.35); continue; }
      w.ash[i] = left > 0.3 ? 1 : w.ash[i]; w.farm[i] = 0; if (left > 0.15) { w.t[i] = 0; w.g[i] *= 0.6; } w.soil[i] = 0.05 + 0.3 * (1 - left); } }
  // three centuries on, the crater holds a lake
  for (const cr of w.craters || []) { if (cr.lake || w.year - cr.at < 300) continue; cr.lake = true; const sea = w.params.sea;
    for (const o of DISC[3]) { const yy = cr.y + o[1]; if (yy < 1 || yy >= H - 1) continue; const i = yy * W + wx(cr.x + o[0]); if (w.h[i] < sea) continue; w.h[i] -= 0.09 * (1 - o[2] / 3.5); (w.crater || (w.crater = new Uint8Array(N)))[i] = 1; }
    w.stamp.land++; w.need.water = true; cr.lakeName = cr.name ? `the Lake of ${cr.name}` : 'the Glass Lake';
    ev(w, `${cr.name ? `Where ${cr.name} stood` : 'Where the bomb fell'}, the glass has crumbled to sand and the crater has filled with rain. People call it ${cr.lakeName}.`, cr.x, cr.y, null, 0); discover(w, 'craterlake', cr.x, cr.y); }
}
// After the exchange: whoever fired or was struck is thrown back to iron and stone; if enough
// bombs fell, the whole world goes down with them. And in the quiet, the old powers come back.
function aftermath(w, n) {
  record(w, 'fall', w.cults.filter((c) => c.alive && (w.year - (c.fired || -99) < 20 || w.year - (c.struck || -99) < 20)).map((c) => c.id), { note: `${n} bombs in 15 years`, terms: { bombs: n } });
  const rnd = w.rnd, big = n >= 15;
  for (const c of w.cults) {
    if (!c.alive) continue; const inIt = w.year - (c.fired || -99) < 20 || w.year - (c.struck || -99) < 20;
    if (!inIt && !big) continue; const floor = inIt ? 3 : 4;
    for (const k in c.arts) { const T = ART[k]; if (T && T.tier > floor && T.tier < 9 && rnd() < (inIt ? 0.95 : 0.75)) delete c.arts[k]; }
    c.know = Math.min(c.know, TECH[floor] * 0.5); c.tech = floor; c.bombs = 0; c.stance = 'revere';
  }
  w.surge = w.year + 300; w.darkLen = big ? 450 : 220; w.darkUntil = w.year + w.darkLen;   // a dark age: no one has time to learn anything but how to live
  // the wells that the burned countries drain to boil over; the rest of the world's wells are spared
  for (const c of w.cults) { if (!c.alive || !c.big || !(w.year - (c.fired || -99) < 20 || w.year - (c.struck || -99) < 20) || !w.wellOf) continue; const qi = w.wellOf[c.big.y * W + c.big.x], q = w.wells[qi]; if (!q) continue; for (let k = 0; k < 6; k++) w.mem[(q.y * W + q.x) * 6 + k] += 4; }
  ev(w, big ? 'There is nothing left anywhere of the world that made the bombs. The survivors scratch the old fields with sticks. And the old powers, that the cities had driven into the wells and the deep woods, come up out of them all at once.' : 'The peoples who used the bombs are scattered back to the age of iron. The wells boil over, and the old powers walk out into the burned country.', null, null, null, 2);
  discover(w, 'machinesfall', null, null); if (big) discover(w, 'surge', null, null);
}
