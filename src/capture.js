// Capture: one mechanic for dragon kings and colonial rule. An overlord far stronger than a realm
// takes it over without moving in. It rules through one native family, a house that collects the
// tribute (Moscow under the Golden Horde). The take comes out of the common people (the hub's X), so
// the lords keep their posts while the fields go hungry. The collecting house grows rich on its cut,
// and in the end it leads the rising.
//   Dragon kings: a dragon takes a realm under 0.3x its strength. Its hunger grows with age; when
//   tribute falls short it squeezes harder and drives its realm into wars of expansion. Towns that
//   refuse are burned. Tribute caravans walk to its mountain. A rising with gunpowder behind it is
//   far likelier to win, but nothing makes it certain.
//   Colonies: a realm with ocean ships and the lords to place picks the easiest gain over the sea.
//   What it does there depends on the land (Acemoglu, Johnson and Robinson): fever country gets
//   only trading forts; a dense native realm is taken at the top and keeps its tongue; thin or
//   emptied land gets settler colonies. Colonies drift and break away when the take runs high.
import { strength, newCult, addSet, endSet, near, whereAbouts } from './people.js';
import { send, arrive } from './movers.js';
import { record } from './ledger.js';
import { ev, discover, once } from './story.js';
import { holySite } from './faith.js';
import { dragonDies } from './fantasy.js';
import { newHouse } from './relics.js';
import { legCells, seaLane } from './travel.js';
import { tagFrom, word, tongueGap } from './tongues.js';
import { W, wx, wrapDx } from './core.js';

const dragonPower = (d) => (d.wyrm ? 60000 : 14000) * (1 + Math.min(2, d.age / 250));
const houseName = (w, c) => `the House of ${word(w, c.lang, w.rnd() < 0.5 ? 1 : 2)}`;
const overseas = (w, c, s) => c.big && w.mass[s.y * W + s.x] !== w.mass[c.big.y * W + c.big.x];

function take(w, c, o) {
  c.over = Object.assign({ since: w.year, take: o.kind === 'dragon' ? 0.15 : 0.12, house: houseName(w, c), hw: 0, risings: 0 }, o);
  c.tribute = c.over.take;
}
function free(w, c, how, cause) {
  const ov = c.over; if (!ov) return; if (/kills|throws off/.test(how)) newHouse(w, c, ov.house);   /* the collecting house takes the throne */ c.over = null; c.tribute = 0; c.overPush = 1;
  if (ov.kind === 'realm') { const o = w.cults[ov.id]; if (o) o.colonies = (o.colonies || []).filter((id) => id !== c.id); }
  const b = c.big; c.coh = Math.min(1, c.coh + 0.3);
  record(w, 'free', [c.id], { note: how, x: b ? b.x : 0, y: b ? b.y : 0, cause });
}

// arrive.tribute: a tribute caravan reaching the lair adds to the hoard
arrive.tribute = (w, m) => { const d = w.dragons.find((q) => q.name === m.dragon); if (d) d.hoard += m.gold || 1; };

export function captureYear(w) {
  const rnd = w.rnd; for (const c of w.cults) c.tributeIn = 0;
  for (const d of w.dragons) if (d.king != null && !(w.cults[d.king] && w.cults[d.king].alive && w.cults[d.king].over && w.cults[d.king].over.d === d.name)) d.king = null;   /* a kingdom has one dragon: the one named in its overlordship */
  // dragons looking for a kingdom
  for (const d of w.dragons) {
    if (d.dead || d.king != null || d.age < 80 || rnd() > 0.05) continue;
    let best = null; near(w, d.lx, d.ly, 45, null, true, (s) => { const c = w.cults[s.cult]; if (!c || c.power || c.over || c.count < 4 || !c.big || c.env.sed < 4) return; if (!best || c.pop > best.pop) best = c; });
    if (!best || strength(best, best.pop) > 0.3 * dragonPower(d)) continue;
    d.king = best.id; take(w, best, { kind: 'dragon', d: d.name }); (d.pacts || (d.pacts = new Set())).add(best.id);
    const b = best.big; record(w, 'capture', [best.id], { note: `${d.name} takes the ${best.name}`, x: b.x, y: b.y, terms: { theirs: strength(best, best.pop), its: dragonPower(d) } });
    holySite(w, b.x, b.y, 'dragonking', 0.3); ev(w, `${d.name} lands in the square of ${b.name} and does not leave. The ${best.name} have a king now, and ${best.over.house} will collect what it asks.`, b.x, b.y, best.color, 2); discover(w, 'dragonking', b.x, b.y);
  }
  // a dragon king lives in its kingdom's capital (slice 14). Whoever takes that city has to fight it.
  for (const d of w.dragons) {
    if (d.dead) continue;
    if (d.king == null) { if (d.home) { d.lx = d.home.x; d.ly = d.home.y; d.home = null; d.seat = null; if (d.st !== 'fly') { d.st = 'home'; d.tx = d.lx; d.ty = d.ly; } } continue; }
    const c = w.cults[d.king]; if (!c || !c.big) continue; if (!d.home) d.home = { x: d.lx, y: d.ly };
    const seat = d.seat != null ? w.sets.find((s) => s.id === d.seat && !s.dead) : null;
    if (seat && seat.cult !== c.id && w.cults[seat.cult] && !w.cults[seat.cult].power) {
      const o = w.cults[seat.cult], gun = (o.arts.gunpowder ? 3 : 1) * (o.arts.flight ? 2 : 1), mine = strength(o, o.pop) * gun, pw = mine / (mine + dragonPower(d)), roll = rnd();
      const id = record(w, 'dragonfight', [o.id, c.id], { p: pw, roll, note: `the ${o.name} against ${d.name} in ${seat.name}`, x: seat.x, y: seat.y, terms: { army: mine, dragon: dragonPower(d) } });
      if (roll < pw) { o.treasure = (o.treasure || 0) + d.hoard; const hoard = d.hoard; d.hoard = 0; dragonDies(w, d); holySite(w, seat.x, seat.y, 'slayer', 0.9); d.king = null; free(w, c, `the ${o.name} kill ${d.name} in ${seat.name}`, id);
        ev(w, `The ${o.name} take ${seat.name} street by street and find ${d.name} waiting on the palace roof. It takes them three days to kill it. ${hoard > 5 ? 'Its hoard goes home in their wagons.' : 'There is less gold under it than the songs said.'}`, seat.x, seat.y, o.color, 2); discover(w, 'dragonslain', seat.x, seat.y); continue; }
      seat.cult = c.id; seat.trade = 0; seat.pop *= 0.6; o.hurt = (o.hurt || 0) + 3; if (o.war && o.war.foe === c.id) o.war.lost = (o.war.lost || 0) + 2;
      ev(w, `The ${o.name} take ${seat.name}, and ${d.name} wakes on the palace roof. By morning the city belongs to the dragon again, and the army that took it is ash.`, seat.x, seat.y, c.color, 1);
    }
    const b = c.big; d.seat = b.id; d.lx = b.x; d.ly = b.y; if (d.st !== 'fly') { d.x = d.lx; d.y = d.ly; d.px = d.x; d.py = d.y; }
  }
  for (const c of w.cults) {
    if (!c.alive || c.power) { if (c.over) c.over = null; continue; }
    const ov = c.over; if (!ov) continue; const b = c.big, h = c.hub; if (!b) continue;
    ov.hw += ov.take * c.count * 0.1;   // the collectors' cut
    const L = h ? h.L : 1;
    if (ov.kind === 'dragon') {
      const d = w.dragons.find((q) => q.name === ov.d && !q.dead);
      if (!d) { free(w, c, 'the dragon is gone'); if (b) ev(w, `With ${ov.d} gone, ${ov.house} rules the ${c.name} in its own name.`, b.x, b.y, c.color, 1); continue; }
      // hunger grows with age; tribute is the take on what the realm grows
      const need = 1 + d.age / 150, got = ov.take * c.pop / 800;
      if (got < need) { ov.take = Math.min(0.4, ov.take + 0.01); c.overPush = 2.5; } else { ov.take = Math.max(0.12, ov.take - 0.003); c.overPush = 1; d.hoard += 0.2; }
      c.tribute = ov.take; d.hunger = 0;
      if (rnd() < 0.3) { let from = null; for (const s of w.sets) if (s.cult === c.id && !s.nomad && s.tier >= 1 && s !== b && (!from || rnd() < 0.2)) from = s; if (from) { const cells = legCells(w, from, b); if (cells && cells.length > 1) send(w, { kind: 'tribute', cult: c.id, x: from.x, y: from.y, tx: d.lx, ty: d.ly, n: 8, gold: ov.take * 3, dragon: d.name, path: cells, step: 2 }); else d.hoard += ov.take * 3; }   /* the tribute goes up the ways to the capital */ }
      // a town that will not pay is burned
      if (L < 0.8 && rnd() < 0.12 && d.st === 'wake') { let far = null, fd = 0; for (const s of w.sets) { if (s.cult !== c.id || s.nomad || s === b) continue; const q = wrapDx(s.x - b.x) ** 2 + (s.y - b.y) ** 2; if (q > fd) { fd = q; far = s; } }
        if (far) { d.pacts.delete(c.id); d.st = 'fly'; d.target = { kind: 'town', s: far }; d.tx = far.x; d.ty = far.y; d.repact = c.id; if (once(w, 'refuse-' + c.id + '-' + Math.floor(w.year / 60))) ev(w, `${far.name} will not pay ${ov.d}. Everyone knows what happens next.`, far.x, far.y, c.color, 1); } }
      // the rising: from below when the people are squeezed, led by the house that grew rich collecting
      const p = 0.004 + 0.03 * Math.max(0, 0.8 - L) + Math.min(0.02, ov.hw / 4000);
      if (rnd() < p) {
        const gun = c.arts.gunpowder ? 3 : 1, rebels = strength(c, c.pop) * gun * (1 + Math.min(1, ov.hw / 300)), power = dragonPower(d), roll = rnd();
        const pw = rebels / (rebels + power), id = record(w, 'rising', [c.id], { p: pw, roll, note: `${ov.house} against ${d.name}`, x: b.x, y: b.y, terms: { rebels, dragon: power } });
        if (roll < pw) { c.treasure = (c.treasure || 0) + d.hoard; dragonDies(w, d); holySite(w, b.x, b.y, 'slayer', 0.9); d.king = null; free(w, c, `${ov.house} kills ${d.name}`, id);
          ev(w, `${ov.house} raises the ${c.name}${gun > 1 ? ' with guns' : ''} against ${d.name}. The dragon falls in the hills above ${b.name}, and the house that collected its gold wears its crown.`, b.x, b.y, c.color, 2); discover(w, 'dragonslain', b.x, b.y); }
        else { ov.hw *= 0.4; ov.take = Math.min(0.4, ov.take + 0.05); ov.risings++; c.coh = Math.max(0.05, c.coh - 0.15);
          ev(w, `The ${c.name} rise against ${d.name}, and the dragon burns the rising out of the land. ${ov.house} pays double this year.`, b.x, b.y, c.color, 1); }
      }
    } else {
      const o = w.cults[ov.id];
      if (!o || !o.alive) { free(w, c, 'the overlord is gone'); ev(w, `There is no one left to send the tribute to. The ${c.name} are their own masters again.`, b.x, b.y, c.color, 1); continue; }
      c.tribute = ov.take; o.tributeIn = (o.tributeIn || 0) + ov.take * c.pop / 100;
      if (rnd() < 0.15) { let from = null; for (const s of w.sets) if (s.cult === c.id && !s.nomad && s.tier >= 2) { from = s; break; } if (from && o.big) { const lane = seaLane(w, from.x, from.y, o.big.x, o.big.y), cells = lane ? null : legCells(w, from, o.big); if (lane || (cells && cells.length > 1)) send(w, { kind: 'trade', cult: o.id, x: from.x, y: from.y, tx: o.big.x, ty: o.big.y, n: 10, goods: -1, land: 0.8, path: lane || cells, wet0: !!lane, step: lane ? 4 : 2 }); }   /* the colony's tribute sails a lane home, or goes by the ways */; }
      const gap = tongueGap(w, c.langId, o.langId), weak = o.hub && (o.hub.st === 'civil' || o.hub.st === 'factions') ? 0.03 : 0;
      const p = 0.003 + 0.03 * Math.max(0, 0.8 - L) + weak + (gap === Infinity ? 0.004 : 0) + Math.min(0.02, ov.hw / 4000);
      if (rnd() < p) {
        const rebels = strength(c, c.pop) * (1 + Math.min(1, ov.hw / 300)), held = strength(o, o.pop) * 0.35, roll = rnd(), pw = rebels / (rebels + held);
        const id = record(w, 'rising', [c.id, o.id], { p: pw, roll, note: `${ov.house} against the ${o.name}`, x: b.x, y: b.y, terms: { rebels, overlord: held } });
        if (roll < pw) { free(w, c, `${ov.house} throws off the ${o.name}`, id); ev(w, `${ov.house} stops sending the ${o.name} their due and calls the ${c.name} free. The ships that come to collect go home empty.`, b.x, b.y, c.color, 2); discover(w, 'independence', b.x, b.y); }
        else { ov.hw *= 0.5; ov.take = Math.min(0.35, ov.take + 0.03); ov.risings++; c.coh = Math.max(0.05, c.coh - 0.1); ev(w, `The ${c.name} rise against the ${o.name}. The ${o.name} send soldiers by sea, and the rising ends in hangings.`, b.x, b.y, c.color, 1); }
      }
    }
  }
  for (const c of w.cults) if (c.alive && !c.power) { c.colonyPosts = 0; }
  for (const c of w.cults) if (c.alive && c.over && c.over.kind === 'realm') { const o = w.cults[c.over.id]; if (o) o.colonyPosts = (o.colonyPosts || 0) + 0.5 * c.count; }   // offices abroad for the overlord's lords
  // empires over the sea
  for (const o of w.cults) {
    if (!o.alive || o.power || o.over || !o.big || !o.arts.sailing || !(o.arts.gunpowder || o.arts.navigation) || o.war) continue;
    const pushed = o.hub && (o.hub.st === 'press' || o.hub.st === 'factions'); if (rnd() > (pushed ? 0.04 : 0.008)) continue;
    colonise(w, o);
  }
  for (const o of w.cults) if (o.alive && !o.power && o.big && (o.arts.sailing || o.arts.navigation)) independence(w, o);   /* colonies break away on their own clock, likelier when the crown is at war or divided */
}

// gain over cost: land and how weak or empty it is, against distance and resistance, over the sea
function colonise(w, o) {
  const rnd = w.rnd, ob = o.big, mine = w.mass[ob.y * W + ob.x], reach = o.arts.navigation ? 260 : 90, my = strength(o, o.pop);
  let best = null, bs = 0;
  for (const c of w.cults) {
    if (!c.alive || c.power || c === o || c.over || !c.big) continue; const cb = c.big; if (w.mass[cb.y * W + cb.x] === mine) continue;
    const dist = Math.hypot(wrapDx(cb.x - ob.x), cb.y - ob.y); if (dist > reach) continue;
    const st = strength(c, c.pop); if (st > 0.3 * my) continue;
    const gain = 1 + c.pop / 1000 + c.count * 0.2, cost = 1 + dist / 80 + st / (0.3 * my);
    const s = gain / cost; if (s > bs) { bs = s; best = c; }
  }
  // empty or thin land over the sea is also a target: settlers
  const tryEmpty = !best || rnd() < 0.3;
  if (best && !tryEmpty) {
    const cb = best.big, i = cb.y * W + cb.x, fever = w.tMean[i] > 21 && w.mi[i] > 1.1 && !o.arts.medicine;
    if (fever) { fort(w, o, cb.x, cb.y, best); return; }
    if (best.pop > 2500 && best.env.towns >= 2) {
      take(w, best, { kind: 'realm', id: o.id }); (o.colonies || (o.colonies = [])).push(best.id);
      record(w, 'capture', [best.id, o.id], { note: `the ${o.name} take the ${best.name}`, x: cb.x, y: cb.y, terms: { theirs: strength(best, best.pop), overlord: my } });
      ev(w, `Ships of the ${o.name} come to ${cb.name}. Within a year the ${best.name} pay them tribute, collected by ${best.over.house}, who rule in their name. In the towns they still speak ${w.langs ? w.langs[best.langId].name : 'their own tongue'}.`, cb.x, cb.y, o.color, 2); discover(w, 'colony', cb.x, cb.y);
      return;
    }
    settle(w, o, cb.x, cb.y, best); return;
  }
  // look for good empty land on another landmass
  for (let q = 0; q < 40; q++) { const a = rnd() * 6.283, r = 40 + rnd() * (reach - 40), x = wx(Math.round(ob.x + Math.cos(a) * r)), y = Math.round(ob.y + Math.sin(a) * r * 0.6); if (y < 4 || y > 252) continue; const i = y * W + x;
    if (w.water[i] || w.mass[i] === mine || w.gCap[i] < 0.3 || w.ice[i] || near(w, x, y, 14, null, true)) continue; settle(w, o, x, y, null); return; }
}
function fort(w, o, x, y, natives) {
  if ((w.nTown || 0) >= 520) return;
  // a trading fort on the coast: colonists die of the fevers inland
  for (let q = 0; q < 30; q++) { const a = w.rnd() * 6.283, r = 4 + w.rnd() * 12, xx = wx(Math.round(x + Math.cos(a) * r)), yy = Math.round(y + Math.sin(a) * r); const i = yy * W + xx; if (w.water[i] || near(w, xx, yy, 5, null, true)) continue;
    let coast = false; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (w.water[(yy + dy) * W + wx(xx + dx)] === 1) coast = true; if (!coast) continue;
    const s = addSet(w, o.id, xx, yy, 60, false); s.fort = true; s.port = true; tagFrom(w, s, o.big); s.name = 'Fort ' + s.name;
    record(w, 'fort', [o.id].concat(natives ? [natives.id] : []), { note: s.name, x: xx, y: yy });
    if (once(w, 'fort-' + o.id)) ev(w, `The ${o.name} build ${s.name} on the coast ${whereAbouts(w, xx, yy)}. Inland the fevers kill every one of them who goes; they stay by the sea and trade.`, xx, yy, o.color, 1);
    discover(w, 'fort', xx, yy); return; }
}
function settle(w, o, x, y, natives) {
  const ob = o.big, n = 2 + ((w.rnd() * 3) | 0); let made = 0;
  for (let k = 0; k < n * 8 && made < n; k++) { const a = w.rnd() * 6.283, r = w.rnd() * 14, xx = wx(Math.round(x + Math.cos(a) * r)), yy = Math.round(y + Math.sin(a) * r); if (yy < 3 || yy > 252) continue; const i = yy * W + xx;
    if (w.water[i] || w.gCap[i] < 0.25 || near(w, xx, yy, 5, null, true)) continue;
    send(w, { kind: 'settlers', cult: o.id, x: ob.x, y: ob.y, tx: xx, ty: yy, n: 40, from: ob, wetN: 3, ocean: true, far: true, split: false, land: 0.75 }); made++; }
  if (!made) return;
  record(w, 'settle', [o.id].concat(natives ? [natives.id] : []), { note: `${made} ships`, x, y });
  if (once(w, 'settle-' + o.id + '-' + Math.floor(w.year / 100))) ev(w, natives ? `Ships of the ${o.name} land settlers ${whereAbouts(w, x, y)}, among the scattered camps of the ${natives.name}. They bring their own seed and their own beasts.` : `Ships of the ${o.name} carry settlers to empty country ${whereAbouts(w, x, y)}.`, x, y, o.color, 1);
}
// settler colonies far from the crown break away when the take runs high or the tongue has drifted
function independence(w, o) {
  const away = w.sets.filter((s) => !s.dead && s.cult === o.id && !s.nomad && overseas(w, o, s)); if (away.length < 4) return;
  const drift = away.filter((s) => tongueGap(w, s.lang, o.langId) > 0).length / away.length, X = o.hub ? o.hub.X : 0.15;
  const divided = o.hub && (o.hub.st === 'factions' || o.hub.st === 'civil') ? 0.03 : 0, warring = o.war ? 0.02 : 0;
  if (w.rnd() > 0.002 + 0.06 * Math.max(0, X - 0.2) + 0.02 * drift + divided + warring) return;
  const byMass = new Map(); for (const s of away) { const m = w.mass[s.y * W + s.x]; (byMass.get(m) || byMass.set(m, []).get(m)).push(s); }
  let grp = null; for (const g of byMass.values()) if (!grp || g.length > grp.length) grp = g; if (grp.length < 4) return;
  const nc = newCult(w, o); let big = grp[0]; for (const s of grp) { s.cult = nc.id; if (s.pop > big.pop) big = s; } nc.count = grp.length; nc.coh = 0.95;
  if (big.lang != null) { nc.langId = big.lang; nc.lang = w.langs[big.lang].snd; nc.culId = big.cul; }
  record(w, 'independence', [o.id, nc.id], { note: `${grp.length} towns`, x: big.x, y: big.y, terms: { take: X, drift } });
  ev(w, `The colonies of the ${o.name} ${whereAbouts(w, big.x, big.y)} stop paying. They call themselves the ${nc.name} and send the governor home.`, big.x, big.y, nc.color, 2); discover(w, 'independence', big.x, big.y);
}
export const overlordOf = (w, c) => (!c.over ? null : c.over.kind === 'dragon' ? c.over.d : w.cults[c.over.id] ? 'the ' + w.cults[c.over.id].name : null);
