// @ts-nocheck
// "Look": whatever is under the pointer, in a few plain sentences. Runs in the worker; the page
// gets back a card: title, subtitle, lines, an optional food bar, and a reference token so it
// can follow the thing on the map and open its legend.
import { W, H, wrapDx, clamp, idx } from './core';
import { wetAt, dryYears } from './weather';
import { SPECIES } from './fauna';
import { TIER, ART, ORES, near } from './people';
import { TENET } from './faith';
import { RACES } from './races';
import { beastLook } from './beasts';
import { figureLines } from './figures';

const big = (n) => (n >= 10000 ? Math.round(n / 1000) + ' thousand' : n >= 1000 ? Math.round(n / 100) / 10 + ' thousand' : String(Math.round(n)));
const NOTE = { grow: 'It is growing.', full: 'It holds as many people as its land can feed.', drought: 'The rains have failed. People are going hungry, and some are leaving.', flood: 'The river took the fields this year.', soil: 'Its fields are worn out and give less every year.', fish: 'The sea here has been fished out.', locusts: 'Locusts ate the harvest.', ash: 'Ash in the sky; nothing ripens.', game: 'The animals it lived on are gone.', crowded: 'There are more mouths than food. Some will leave, or look at the neighbours.', plague: 'Sickness is doing the counting here.' };
const list = (a) => (a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
const cap = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t);
const FOOD = [['#8fa96a', 'wild food'], ['#a5623f', 'hunting'], ['#4f87a8', 'fish'], ['#d1a53c', 'fields'], ['#8a6e4f', 'herds']];
export const ORE_COL = ['', '#c9773b', '#b9c2c8', '#6b4a3a', '#e8b923', '#f4f0e6', '#2a2a2e'];

export function cultLines(w, c) {
  const L = [], R = RACES[c.race || 0];
  L.push(`${cap(c.kind)}${c.race ? ', ' + R.plural : ''}. ${big(c.pop)} people in ${c.count} ${c.count === 1 ? 'place' : 'places'}.`);
  const arts = Object.keys(c.arts).sort((a, b) => c.arts[a] - c.arts[b]).map((k) => ART[k].say); L.push(arts.length ? `They know ${list(arts)}.` : 'They know fire, stone and each other.');
  const tame = Object.keys(c.tame), met = []; if (c.arts.bronze) met.push('bronze'); if (c.arts.iron) met.push('iron'); if (c.gold) met.push('gold');
  if (tame.length || met.length) L.push((tame.length ? `They keep ${list(tame.map((k) => (k === 'cattle' ? 'cattle' : k === 'pig' ? 'pigs' : k + 's')))}. ` : '') + (met.length ? `They have ${list(met)}.` : ''));
  L.push(`${c.ruler.name} leads them. ${c.coh > 0.7 ? 'They hold together well.' : c.coh > 0.45 ? 'There are quarrels, but they hold.' : c.coh > 0.25 ? 'They are pulling apart.' : 'They are one people in name only.'}`);
  if (c.faith != null) { const f = w.faiths[c.faith]; L.push(`They pray to ${f.name}, whose teaching ${TENET[f.tenet] || f.teach || 'is their own'}.${c.faithShare < 0.6 ? ' Not all of them.' : ''}`); }
  if (c.war) { const f = w.cults[c.war.foe]; L.push(`At war with the ${f.name} since year ${c.war.since}.`); }
  if (c.parent) L.push(`They split from the ${c.parent} in year ${c.born}.`);
  return L;
}
export function setCard(w, s) {
  const c = w.cults[s.cult], L = [], tot = s.src.reduce((a, b) => a + b, 0) || 1;
  const bar = s.src.map((v, k) => [v / tot, FOOD[k][0], FOOD[k][1]]);
  if (s.nomad) L.push(`${big(s.pop)} people on the move.`); else L.push(`A ${TIER[s.tier]} of ${big(s.pop)} people, ${s.age} years old.`);
  L.push(s.plague > 0 ? NOTE.plague : NOTE[s.note] || NOTE.grow);
  if (s.faith != null && s.faith !== c.faith) L.push(`Its people pray to ${w.faiths[s.faith].name}, not the god of their rulers.`);
  if (!s.nomad) {
    const ex = []; if (s.walls) ex.push('stone walls'); if (s.links) ex.push(s.links === 1 ? 'a road' : s.links + ' roads'); if (s.port && c.arts.boats) ex.push('a harbour'); if (s.wonder) ex.push('a wonder'); if (s.tower) ex.push('a tower nobody built'); if (s.works) for (const k of s.works) ex.push(k); if (ex.length) L.push(`It has ${list(ex)}.`);
    const o = []; for (let k = 1; k <= 6; k++) if (s.ores & (1 << k)) o.push(ORES[k]); if (o.length) L.push(`${cap(list(o))} in its ground.`);
    if (s.burned) L.push(`It has burned ${s.burned === 1 ? 'once' : s.burned + ' times'}.`);
  }
  return { title: s.name || `A band of the ${c.name}`, sub: s.nomad ? c.kind : `${TIER[s.tier]} of the ${c.name}`, color: c.color, bar, lines: L.concat(cultLines(w, c)), split: L.length, splitTitle: 'The ' + c.name, ref: 's' + s.id, people: 'c' + c.id, follow: ['set', s.id] };
}
const MOVE = { settlers: (m, c) => [`Settlers of the ${c.name}`, `${Math.round(m.n)} people with everything they own, looking for a place to stop.`], army: (m, c) => [`A war band of the ${c.name}`, `About ${Math.round(m.n)} spears${m.to && !m.to.dead && m.to.name ? ', marching on ' + m.to.name : ''}.${m.hero ? ' ' + m.hero + ' leads them.' : ''}`], home: (m, c) => [`A war band of the ${c.name}`, 'On the way home.'], trade: (m, c) => [m.wet0 ? `A trading ship of the ${c.name}` : `A caravan of the ${c.name}`, `${m.from && m.from.name ? 'From ' + m.from.name : 'On its way'}${m.to && m.to.name ? ' to ' + m.to.name : ''}. It carries goods, news, and whatever else is going around.`], refugees: (m, c) => [`People of the ${c.name}, fleeing`, `${Math.round(m.n)} people walking away from hunger or worse.`], pilgrims: (m, c) => [`Pilgrims of the ${c.name}`, `On the road to ${m.to && m.to.name ? m.to.name : 'a holy place'}.`], quest: (m, c) => [m.hero || 'A hero', `${m.say || 'On a quest.'}`] };
const RUIN_SAY = { abandoned: 'Its people left, or died out.', sacked: 'It was sacked and burned.', drowned: 'The sea took it.', buried: 'Ash and lava buried it.', burned: 'Fire took it.', plague: 'Plague emptied it.', frozen: 'The ice closed over it.', overgrown: 'The forest swallowed it.', crater: 'A falling star erased it.', swallowed: 'The earth opened under it.', dragon: 'A dragon made it a roost.', starved: 'Hunger emptied it.', absorbed: 'Its people moved on.' };

export function look(w, fx, fy, z) {
  const x = Math.floor(fx), y = Math.floor(fy); if (y < 0 || y >= H || x < 0 || x >= W) return null;
  const r = Math.max(1.2, 10 / z), bd = r * r;
  const b = beastLook(w, fx, fy, r); if (b) return b;
  for (const m of w.movers) if (!m.done && (m.x + 0.5 - fx) ** 2 + (m.y + 0.5 - fy) ** 2 <= bd * 1.2) { const c = w.cults[m.cult], t = (MOVE[m.kind] || MOVE.trade)(m, c); return { title: t[0], color: c.color, lines: [t[1]], ref: m.fig ? 'p' + m.fig : null, people: 'c' + c.id, follow: ['mover', m.id] }; }
  if (z > 6) for (const f of w.figs || []) if (!f.died && f.role !== 'ruler' && (f.x + 1.7 - fx) ** 2 + (f.y + 1.2 - fy) ** 2 <= Math.max(0.8, bd * 0.5)) { const c = w.cults[f.cult]; return { title: f.name, sub: `${f.villain ? f.kind : f.role} of the ${c.name}`, color: c.color, lines: figureLines(w, f), ref: 'p' + f.id, people: 'c' + c.id }; }
  for (const sw of w.swarms) if ((sw.x - fx) ** 2 + (sw.y - fy) ** 2 <= 12) return { title: 'Locusts', lines: ['A swarm on the wind. It eats grass and grain down to the dirt and moves on.'] };
  const s = near(w, fx - 0.5, fy - 0.5, Math.max(1.6, r), null, false); if (s) return setCard(w, s);
  for (const ru of w.ruins) if ((ru.x + 0.5 - fx) ** 2 + (ru.y + 0.5 - fy) ** 2 <= bd) return { title: `Ruins of ${ru.name}`, sub: `once a ${TIER[ru.tier]} of the ${ru.cult}`, color: null, ref: ru.sid ? 's' + ru.sid : null, lines: [`${RUIN_SAY[ru.kind] || ''} Year ${ru.year}.`, ru.wonder ? 'Something enormous still stands among the stones.' : '', ru.layers > 1 ? `It has been built and lost ${ru.layers} times. There are older walls under these.` : '', ru.haunt ? 'Nobody goes near it now. The air is wrong.' : ru.looted ? 'Diggers have been through it.' : 'Nobody has dug here yet. Whatever its people knew is still in the ground.'].filter(Boolean) };
  for (const st of w.storms) if ((st.x - fx) ** 2 + (st.y - fy) ** 2 <= 16) return { title: st.str > 1 ? 'A great storm' : 'A storm', lines: ['Born over warm water, carried by the wind. It dies over land, but not before it has wrecked a coast.'] };
  let best = null, bq = bd;
  for (const h of w.herds) { const q = (h.x + 0.5 - fx) ** 2 + (h.y + 0.5 - fy) ** 2; if (q <= bq && h.n > 1) { bq = q; best = h; } }
  if (best) { const sp = SPECIES[best.sp]; return { title: cap(sp.one), color: sp.col, lines: [`About ${Math.round(best.n)} head. ${big(w.species[best.sp].n || best.n)} of their kind in the world.`, best.odd ? (best.odd === 'dwarf' ? 'Generations on a small island have made them small and tame.' : 'Generations on an island have made them huge.') : sp.tame ? 'People who live beside these long enough learn to tame them.' : 'Nobody will ever tame these.'] }; }
  for (const p of w.packs) if ((p.x + 0.5 - fx) ** 2 + (p.y + 0.5 - fy) ** 2 <= bd && p.n > 1) return { title: 'A pack of wolves', color: '#3a3a40', lines: [`${Math.round(p.n)} hunters. They follow the herds and keep them from eating the land bare.`] };
  for (const v of w.volcanoes) if ((v.x + 0.5 - fx) ** 2 + (v.y + 0.5 - fy) ** 2 <= 2.5) return { title: 'A volcano', lines: [v.last > 0 ? `It last opened in year ${v.last}.` : 'It has been quiet as long as anyone remembers.', 'Its ash kills what it lands on, then feeds it.'] };
  if (z >= 7) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const yy = y + dy; if (yy < 0 || yy >= H) continue; const j = yy * W + clamp(x + dx, 0, W - 1); if (w.ore[j]) return { title: cap(ORES[w.ore[j]]), color: ORE_COL[w.ore[j]], lines: [w.ore[j] === 5 ? 'Salt in a dry basin.' : 'A seam in the rock.', 'It matters to whoever settles on top of it.'] }; }
  return land(w, x, y);
}

export function regionName(w, i) {
  const sea = w.params.sea, T = w.tMean[i], hot = Math.max(w.tJan[i], w.tJul[i]), m = w.mi[i], hh = w.h[i] - sea;
  if (w.water[i] === 1) return w.snow[i] > 0.5 ? 'Sea ice' : hh > -0.06 ? 'Shallow sea' : hh < -0.4 ? 'The deep' : 'Open sea';
  if (w.water[i] === 2) return 'Lake';
  if (w.lava[i]) return 'Lava'; if (w.fireT[i]) return 'Wildfire'; if (w.ice[i]) return 'Ice sheet';
  if (hh > 0.55) return 'High peaks'; if (hh > 0.36) return 'Mountains'; if (w.urban[i]) return 'Streets'; if (w.farm[i]) return 'Farmland';
  if (w.t[i] > 0.5) return T > 20 ? (m > 1.3 ? 'Rainforest' : 'Dry forest') : T > 6 ? (w.magic[i] > 0.55 ? 'Enchanted wood' : 'Woodland') : 'Taiga';
  if (m > 1.7 && hh < 0.06) return 'Marsh';
  if (m < 0.2) return T > 12 ? 'Desert' : 'Cold desert';
  if (hot < 9) return 'Tundra';
  if (w.g[i] > 0.45) return T > 19 ? (w.t[i] > 0.2 ? 'Savanna' : 'Grassland') : 'Steppe and meadow';
  return hh > 0.2 ? 'Hill country' : 'Scrub';
}
function land(w, x, y) {
  const i = idx(x, y), L = [], T = w.tMean[i], hot = Math.max(w.tJan[i], w.tJul[i]), cold = Math.min(w.tJan[i], w.tJul[i]), m = w.mi[i], title = regionName(w, i);
  if (w.water[i] === 1) { L.push(T > 22 ? 'Warm water. Storms are born over seas like this.' : T < 2 ? 'Cold, grey water.' : 'Cool water.'); if (w.fish) { const f = w.fish[(y >> 2) * (W >> 2) + (x >> 2)], K = w.fishK[(y >> 2) * (W >> 2) + (x >> 2)]; if (K > 0.4) L.push(f / K > 0.7 ? 'The shoals here are thick.' : f / K > 0.35 ? 'There are fish, if you work for them.' : 'Fished nearly empty.'); } return { title, lines: L }; }
  if (w.water[i] === 2) return { title, lines: ['Fresh water, held in a hollow of the land.', w.snow[i] > 0.5 ? 'Frozen over for now.' : 'The shores stay green.'] };
  if (w.river[i]) L.push(['', 'A stream runs through here.', 'A river runs through here.', 'A big river runs through here.', 'One of the great rivers of the world.'][w.river[i]]);
  L.push(m > 1.4 ? 'It rains hard here for much of the year.' : m > 0.8 ? 'Plenty of rain.' : m > 0.4 ? 'Enough rain for grass, not much more.' : m > 0.2 ? 'Dry. Rain is a brief season.' : 'Almost no rain reaches here.');
  L.push(hot - cold > 30 ? `Brutal seasons: about ${Math.round(cold)}° in winter, ${Math.round(hot)}° in summer.` : hot - cold > 14 ? `Real seasons: ${Math.round(cold)}° to ${Math.round(hot)}°.` : `Much the same all year, around ${Math.round(T)}°.`);
  const wa = wetAt(w, x, y), dr = dryYears(w, x, y); if (wa < 0.72) L.push(dr >= 3 ? `The rains have failed here ${dr} years running.` : 'A dry year: far less rain than usual.'); else if (wa > 1.35) L.push('A wet year: far more rain than usual.');
  if (w.magic[i] > 0.55) L.push(w.t[i] > 0.5 ? 'The light falls wrong under these trees. They do not burn.' : 'The air hums here.');
  const s = w.soil[i]; L.push(s > 1.1 ? 'The soil is deep and dark.' : s > 0.7 ? 'Decent soil.' : s > 0.4 ? 'Thin soil.' : 'The soil is nearly gone.');
  if (w.eco) { const ci = (y >> 2) * (W >> 2) + (x >> 2), e = w.eco; L.push(e.graze[ci] > 0.6 ? 'Game is everywhere.' : e.graze[ci] > 0.25 ? 'There is game, if you know where to look.' : 'Little game.'); if (e.pred[ci] > 0.5) L.push('Wolves and worse hunt here.'); }
  if (w.ash[i] > 0.3) L.push('Ash from a recent fire.');
  if (w.wetBias[i] > 0.15) L.push('Your rain still lingers here.'); else if (w.wetBias[i] < -0.15) L.push('Your drought still lingers here.');
  const where = w.regions ? w.regions.nameAt(i) : null;
  return { title, sub: where, lines: L, ref: w.regions ? w.regions.refAt(i) : null };
}
