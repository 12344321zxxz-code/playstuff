// The end of the world, if it comes. Nothing here is scheduled: peoples who split the atom and
// build the bomb mostly stop fighting each other, because now they can lose everything. The
// danger is the rest of the time. A mad ruler, a capital about to fall, a holy war, a dead king
// spreading terror at the gates, or nothing at all, a false alarm, and one bomb falls. Allies
// answer for allies. Each city that burns leaves a scar of death memory larger than any war or
// plague, the ley lines carry it to the wellsprings, and the dead walk in numbers the world has
// never seen. The smoke dims the sun for years. Whoever is left forgets the engines and the wires,
// and in the quiet the old powers come back. Then someone digs in a ruin and finds a bomb that works.
import { W, H, N, DISC, wx, wrapDx, clamp } from './core.js';
import { ev, discover, once } from './story.js';
import { near, endSet, flee, infect, collapse } from './people.js';
import { remember, DEATH, FIRE } from './memory.js';
import { ignite } from './life.js';
import { send, arrive } from './movers.js';
import { ART, TECH } from './tech.js';

export function initDoom(w) { w.fallout = new Float32Array(N); w.soot = 0; w.nukes = 0; w.clock = 12 * 60; w.deadAge = null; }
const big = (n) => (n >= 1000 ? Math.round(n / 100) / 10 + ' thousand' : String(Math.round(n)));

// Once a year: arsenals grow, tempers rise, and sometimes a hand reaches for the key.
export function doomYear(w) {
  const rnd = w.rnd; let armed = 0, tension = 0;
  const nuclear = w.cults.filter((c) => c.alive && c.arts.bomb);
  for (const c of w.cults) {
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
  if (recent.length >= 8 && w.year - (w.fellAt || -999) > 100) { w.fellAt = w.year; aftermath(w, recent.length);
    ev(w, 'No one is left who knows how the machines worked. The wires are cold, the engines rust in the fields, and the books are used to light fires through the long winter.', null, null, null, 2); discover(w, 'machinesfall', null, null); }
}
export const sootTick = (w) => { if (w.soot > w.aerosol) w.aerosol = w.soot; };

// A launch: the attacker sends what it has at the enemy's largest cities. Their allies may answer.
function strike(w, c, f, why) {
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
  x = wx(x); y = clamp(y, 2, H - 3); const sea = w.params.sea; w.nukes++;
  const hit = near(w, x, y, 1.5, null, false), name = hit && hit.name ? hit.name : null; let dead = 0;
  near(w, x, y, 11, null, false, (s, q) => { const d = Math.sqrt(q); const k = d < 5 ? 1 : 0.7 * (1 - (d - 5) / 6); dead += s.pop * k; s.pop *= 1 - k; const c = w.cults[s.cult]; c.hurt = (c.hurt || 0) + 4; if (s === c.big) c.lostCapAt = w.year; if (s.pop < 20) endSet(w, s, 'nuked', by ? by.name : null); else flee(w, s, s.pop * 0.3); });
  for (const o of DISC[14]) { const yy = y + o[1]; if (yy < 1 || yy >= H - 1) continue; const i = yy * W + wx(x + o[0]), d = o[2];
    if (d < 3) w.h[i] = Math.min(w.h[i], w.h[i] - 0.05);
    if (w.water[i]) continue; if (d < 3) w.glass = w.glass || new Uint8Array(N), w.glass[i] = 1; if (d < 10) { w.t[i] = 0; w.g[i] *= 0.1; w.farm[i] = 0; w.ash[i] = 1; w.urban[i] = 0; w.graze[i] = 0; w.hunt[i] = 0; if (d > 2 && w.rnd() < 0.5) ignite(w, i); } }
  // the fallout rides the wind east (or west, if the world turns the other way)
  const dir = w.params.spin >= 0 ? 1 : -1;
  for (let k = 0; k < 70; k++) { const cx = wx(x + dir * k), cy = clamp(Math.round(y + Math.sin(k * 0.21 + x) * k * 0.2), 1, H - 2), r = 3 + Math.min(8, k / 6) | 0, a = 1.6 * (1 - k / 80);
    for (const o of DISC[r]) { const yy = cy + o[1]; if (yy < 0 || yy >= H) continue; const i = yy * W + wx(cx + o[0]); w.fallout[i] = Math.min(2, w.fallout[i] + a * (1 - o[2] / (r + 1))); } }
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
  const dir = w.params.spin >= 0 ? 1 : -1;
  for (let k = 0; k < 18; k++) for (const o of DISC[2]) { const yy = clamp(s.y + o[1], 0, H - 1), i = yy * W + wx(s.x + dir * k + o[0]); w.fallout[i] = Math.min(2, w.fallout[i] + 0.8 * (1 - k / 20)); }
  flee(w, s, s.pop * 0.6); s.pop *= 0.3; remember(w, s.x, s.y, DEATH, 0.5, 4, 'nuked', `the poisoned country around ${s.name}`, { place: s.name });
  ev(w, `The power station outside ${s.name} catches fire and will not go out. The town is emptied in a day and nobody goes back.`, s.x, s.y, c.color, 0); discover(w, 'meltdown', s.x, s.y); c.arts.reactors = w.year - 1; if (rnd2(w) < 0.4) { delete c.arts.reactors; c.banned = c.banned || {}; c.banned.reactors = w.year; }
}
// A plague made on purpose, and how it escapes.
function breedPlague(w, c, foe) {
  const at = foe && foe.big ? foe.big : c.big; if (!infect(w, at, null, true)) return;
  const st = w.plagues[at.pid]; st.v = 0.4; st.catchy = 0.95; st.engineered = true; st.name = ['Grey Fever', 'Glass Lung', 'Quiet Sickness'][(w.rnd() * 3) | 0];
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

// Fallout settles into the ground, washes down the rivers and spreads with the rain; it fades
// over a lifetime or two.
const _fo = new Float32Array(N);
function falloutYear(w) {
  const fo = w.fallout; let any = false; for (let i = 0; i < N; i += 64) if (fo[i] > 0.01) { any = true; break; } if (!any && !w.nukes) return;
  _fo.set(fo);
  for (let y = 1; y < H - 1; y++) for (let x = 0; x < W; x++) { const i = y * W + x, v = _fo[i]; if (v < 0.02) continue;
    const d = w.down[i]; if (w.river[i] && d >= 0) fo[d] = Math.min(2, fo[d] + v * 0.25);   // down the river
    const sp = v * 0.03; fo[i] -= sp * 4; fo[i - W] += sp; fo[i + W] += sp; fo[y * W + (x + 1) % W] += sp; fo[y * W + (x + W - 1) % W] += sp; }
  for (let i = 0; i < N; i++) { fo[i] *= 0.985; if (fo[i] < 0.004) fo[i] = 0; }
  if (w.glass) for (let i = 0; i < N; i++) if (w.glass[i]) { w.ash[i] = 1; w.t[i] = 0; w.g[i] *= 0.3; w.soil[i] = 0.05; w.farm[i] = 0; }   // the glass where the cities stood
}
// After the exchange: whoever fired or was struck is thrown back to iron and stone; if enough
// bombs fell, the whole world goes down with them. And in the quiet, the old powers come back.
function aftermath(w, n) {
  const rnd = w.rnd, big = n >= 15;
  for (const c of w.cults) {
    if (!c.alive) continue; const inIt = w.year - (c.fired || -99) < 20 || w.year - (c.struck || -99) < 20;
    if (!inIt && !big) continue; const floor = inIt ? 3 : 4;
    for (const k in c.arts) { const T = ART[k]; if (T && T.tier > floor && T.tier < 9 && rnd() < (inIt ? 0.95 : 0.75)) delete c.arts[k]; }
    c.know = Math.min(c.know, TECH[floor] * 0.5); c.tech = floor; c.bombs = 0; c.stance = 'revere';
  }
  w.surge = w.year + 300; w.darkUntil = w.year + (big ? 220 : 120);   // a dark age: no one has time to learn anything but how to live
  for (const q of w.wells) for (let k = 0; k < 6; k++) w.mem[(q.y * W + q.x) * 6 + k] += 6;
  ev(w, big ? 'There is nothing left anywhere of the world that made the bombs. The survivors scratch the old fields with sticks. And the old powers, that the cities had driven into the wells and the deep woods, come up out of them all at once.' : 'The peoples who used the bombs are scattered back to the age of iron. The wells boil over, and the old powers walk out into the burned country.', null, null, null, 2);
  discover(w, 'machinesfall', null, null); if (big) discover(w, 'surge', null, null);
}
