// The rest of the god's hands: animals, peoples, catastrophes and the unnatural.
import { W, H, N, DISC, clamp, wx, wrapDx } from './core.js';
import { route, forgetAt, sumMagic, NK } from './memory.js';
import { nuke, disarm } from './doom.js';
import { PLANTS, floraMap, plantWild } from './origins.js';
import { registerTools, addLens, say } from './main.js';
import { SPECIES, addHerd, addPack, cull } from './fauna.js';
import { addBand, ORES } from './people.js';
import { addDragon } from './fantasy.js';
import { meteor, volcano, tsunami, quake, plagueAt, overgrow, babel, inspire, stormAt, locustAt } from './disasters.js';
import { addKraken } from './sea.js';
import { ev } from './story.js';

const cell = (p) => clamp(Math.round(p.y - 0.5), 1, H - 2) * W + wx(Math.round(p.x - 0.5));
const SP_OPTS = ['Whatever fits'].concat(SPECIES.map((s) => s.name[0].toUpperCase() + s.name.slice(1)));

registerTools([
  { id: 'spring', label: 'Spring', group: 'Land', hint: 'Tap high ground to open a spring. A river starts there and finds its own way down.', miss: 'A spring needs dry land.',
    apply(w, p) { const i = cell(p); if (w.water[i]) return false; w.springs.push({ x: i % W, y: (i / W) | 0, q: 420 }); if (w.springs.length > 40) w.springs.shift(); w.need.water = true; w.edited = true; say('Water comes up out of the rock.'); return true; } },
  { id: 'ore', label: 'Ore', group: 'Land', opts: ['Copper', 'Tin', 'Iron', 'Gold', 'Salt', 'Coal', 'Uranium'], hint: 'Tap to bury a seam. Copper and tin together make bronze; iron makes harder wars; coal, much later, makes smoke. Zoom in to see seams.', miss: 'Ore needs dry land.',
    apply(w, p, f, r, st, opt) { const i = cell(p); if (w.water[i] === 1) return false; w.ore[i] = opt + 1; w.oreStamp = (w.oreStamp || 0) + 1; say(`${ORES[opt + 1][0].toUpperCase() + ORES[opt + 1].slice(1)} lies under the ground here now.`); return true; } },
  { id: 'heat', label: 'Heat', group: 'Sky', kind: 'brush', hint: 'Hold to warm a whole region, up to a desert sun. It stays until you cool it again.', apply(w, p, f, r) { return paintHeat(w, p, r, 1); } },
  { id: 'cold', label: 'Cold', group: 'Sky', kind: 'brush', hint: 'Hold to chill a whole region, down to an ice age. It stays until you warm it again.', apply(w, p, f, r) { return paintHeat(w, p, r, -1); } },
  { id: 'storm', label: 'Storm', group: 'Sky', radius: 4, hint: 'Tap warm sea to start a storm. The wind decides where it lands.', miss: 'The sky is already full of storms.',
    apply(w, p) { return stormAt(w, p.x, p.y); } },
  { id: 'herd', label: 'Herd', group: 'Life', opts: SP_OPTS, hint: 'Tap land to set animals down. Put horses where there were none and see who learns to ride.', miss: 'They need dry land.',
    apply(w, p, f, r, st, opt) { const sp = addHerd(w, p.x - 0.5, p.y - 0.5, opt ? opt - 1 : null); if (sp) say(`${sp.name[0].toUpperCase() + sp.name.slice(1)} spread out over the country.`); return !!sp; } },
  { id: 'wolves', label: 'Wolves', group: 'Life', hint: 'Tap land to loose a pack. They keep the herds from eating the country bare.', miss: 'They need dry land.',
    apply(w, p) { return addPack(w, p.x - 0.5, p.y - 0.5); } },
  { id: 'cull', label: 'Cull', group: 'Life', kind: 'brush', hint: 'Hold to empty a country of its animals. Hunters and herders will feel it first.', miss: 'Nothing lives there.',
    apply(w, p, f, r) { return cull(w, p.x - 0.5, p.y - 0.5, r); } },
  { id: 'people', label: 'People', group: 'Peoples', hint: 'Tap land to wake a new people there. What they become depends on where you put them.', miss: 'People need dry land.',
    apply(w, p) { return !!addBand(w, p.x - 0.5, p.y - 0.5); } },
  { id: 'idea', label: 'Idea', group: 'Peoples', radius: 8, lens: 15, opts: ['Their next step', 'Food', 'Metal', 'Getting about', 'Learning', 'War'], hint: 'Tap near a people to hand them a leap of knowledge. They can only learn what their land allows: no boats without a shore.', miss: 'Nobody is near enough to hear it.',
    apply(w, p, f, r, st, opt) { const ok = inspire(w, p.x, p.y, opt); if (ok) say(w.events.length ? w.events[w.events.length - 1].text : 'An idea takes hold.'); return ok; } },
  { id: 'disarm', label: 'Disarm', group: 'Peoples', radius: 10, lens: 15, hint: 'Tap a people with the bomb to make them give it up. They will not learn it again for a long time.', miss: 'Nobody near there has the bomb.', apply(w, p) { return disarm(w, p.x, p.y); } },
  { id: 'babel', label: 'Babel', group: 'Peoples', radius: 8, lens: 6, hint: 'Tap a large people to confuse their tongues. They will not stay one people for long.', miss: 'It needs a people with at least three settlements.',
    apply(w, p) { return babel(w, p.x, p.y); } },
  { id: 'meteor', label: 'Meteor', group: 'Wrath', radius: 6, hint: 'Tap to drop a star. On land it leaves a crater; at sea it sends a wave.',
    apply(w, p) { return meteor(w, p.x - 0.5, p.y - 0.5); } },
  { id: 'volcano', label: 'Volcano', group: 'Wrath', radius: 3, hint: 'Tap to open the ground. Lava runs downhill, ash rides the wind, and the sky dims.',
    apply(w, p) { return volcano(w, p.x - 0.5, p.y - 0.5); } },
  { id: 'quake', label: 'Quake', group: 'Wrath', radius: 9, hint: 'Tap to shake the ground. Near the coast, the sea answers.',
    apply(w, p) { return quake(w, p.x - 0.5, p.y - 0.5); } },
  { id: 'wave', label: 'Wave', group: 'Wrath', radius: 4, hint: 'Tap the sea to raise a great wave. Low coasts for a long way around go under.', miss: 'A wave needs sea.',
    apply(w, p) { return tsunami(w, p.x - 0.5, p.y - 0.5); } },
  { id: 'plague', label: 'Plague', group: 'Wrath', radius: 8, lens: 6, hint: 'Tap a settlement to start a bad sickness. It travels with neighbours, caravans, ships and people fleeing it.', miss: 'Nobody is near enough to catch it.',
    apply(w, p) { return plagueAt(w, p.x, p.y); } },
  { id: 'bomb', label: 'The bomb', group: 'Wrath', radius: 7, hint: 'Tap to drop a bomb. A city is gone in a moment; the fallout rides the wind; the dead remember.', apply(w, p) { nuke(w, Math.round(p.x - 0.5), Math.round(p.y - 0.5), null); return true; } },
  { id: 'locusts', label: 'Locusts', group: 'Wrath', radius: 3, hint: 'Tap land to hatch a swarm. It rides the wind for a couple of years, eating grass and grain.', miss: 'Too many swarms already, or no land there.',
    apply(w, p) { return locustAt(w, p.x - 0.5, p.y - 0.5); } },
  { id: 'overgrow', label: 'Overgrow', group: 'Wrath', kind: 'brush', hint: 'Hold to let the forest take everything back: fields, roads, towns.', miss: 'Nothing grows on water.',
    apply(w, p, f, r) { return overgrow(w, p.x - 0.5, p.y - 0.5, r); } },
  { id: 'dragon', label: 'Dragon', group: 'Other world', radius: 2, hint: 'Tap near mountains to give a dragon a home. It will find the herds, then the towns.', miss: 'A dragon needs land to roost on.',
    apply(w, p) { const d = addDragon(w, p.x - 0.5, p.y - 0.5); if (d) { ev(w, `${d.name} wakes in the high rock.`, d.x, d.y, null); say(`${d.name} wakes.`); } return !!d; } },
  { id: 'kraken', label: 'Deep one', group: 'Other world', radius: 5, hint: 'Tap deep sea to put something down there. Ships that pass over it do not all come home.', miss: 'It needs open sea, and there is room for only a few.',
    apply(w, p) { const k = addKraken(w, p.x - 0.5, p.y - 0.5); if (k) { ev(w, `Something settles into the deep water and sailors give it a name: ${k.name}.`, k.x, k.y, null); say(`${k.name[0].toUpperCase() + k.name.slice(1)} wakes in the deep.`); } return !!k; } },
  { id: 'well', label: 'Wellspring', group: 'Other world', radius: 2, lens: 7, hint: 'Tap to open a wellspring. Memory runs to it along the ley lines, and when it is full it spills a storm back up them.', miss: 'There is already a well close by.',
    apply(w, p) { const x = wx(Math.round(p.x - 0.5)), y = clamp(Math.round(p.y - 0.5), 4, H - 5); if (w.wells.some((q) => wrapDx(q.x - x) ** 2 + (q.y - y) ** 2 < 400)) return false; w.wells.push({ x, y, name: null, spilt: 0 }); for (const o of DISC[3]) { const yy = y + o[1]; w.ley[yy * W + wx(x + o[0])] = Math.max(w.ley[yy * W + wx(x + o[0])], 0.6); } route(w); say('The ground opens on something old.'); return true; } },
  { id: 'remember', label: 'Remember', group: 'Other world', kind: 'brush', lens: 7, hint: 'Hold to make a place remember for good. Nothing people do will wear its memory away, and it will not drain to the wells.',
    apply(w, p, f, r) { const x = Math.round(p.x - 0.5), y = Math.round(p.y - 0.5); for (const o of DISC[Math.min(20, r)]) { const yy = y + o[1]; if (yy < 0 || yy >= H) continue; w.memLock[yy * W + wx(x + o[0])] = 1; } return true; } },
  { id: 'hush', label: 'Hush', group: 'Other world', kind: 'brush', lens: 7, hint: 'Hold to quiet a place a little at a time. What rose there weakens as its memory fades.',
    apply(w, p, f, r) { const x = Math.round(p.x - 0.5), y = Math.round(p.y - 0.5); for (const o of DISC[Math.min(20, r)]) { const yy = y + o[1]; if (yy < 0 || yy >= H) continue; const i = yy * W + wx(x + o[0]); for (let k = 0; k < NK; k++) w.mem[i * NK + k] *= 0.85; w.memLock[i] = 0; } sumMagic(w); return true; } },
  { id: 'forget', label: 'Forget', group: 'Other world', radius: 8, lens: 7, hint: 'Tap to make a country forget everything that happened in it. Whatever rose from those memories goes with them.', miss: 'There is nothing here to forget.',
    apply(w, p, f, r) { const x = wx(Math.round(p.x - 0.5)), y = Math.round(p.y - 0.5); const n = w.spirits.length; w.spirits = w.spirits.filter((q) => wrapDx(q.x - x) ** 2 + (q.y - y) ** 2 > 64); const ok = forgetAt(w, x, y, 8); if (n !== w.spirits.length) say('What walked there is gone, and nobody remembers why it walked.'); return ok || n !== w.spirits.length; } },
  { id: 'sow', label: 'Wild seed', group: 'Life', opts: PLANTS.map((q) => q.wild[0].toUpperCase() + q.wild.slice(1)), lens: 12, hint: 'Tap land to seed a wild plant across that whole landmass. Whoever lives there may learn to farm it, if the climate suits.', miss: 'It needs land.',
    apply(w, p, f, r, st, opt) { const i = cell(p); if (w.water[i]) return false; plantWild(w, opt, p.x, p.y, Math.max(2, r)); floraMap(w); say(`${PLANTS[opt].wild[0].toUpperCase() + PLANTS[opt].wild.slice(1)} takes root ${w.pSuit[opt * N + i] > 100 ? 'here' : 'here, though it will only thrive where the climate suits it'}.`); return true; } },
]);
addLens(6, 'Peoples'); addLens(9, 'Faiths'); addLens(7, 'Lore'); addLens(12, 'Origins'); addLens(13, 'Beasts'); addLens(14, 'Trade'); addLens(17, 'Tongues'); addLens(15, 'Knowledge'); addLens(16, 'Fallout');

// warmth and cold you paint stay in the world's climate, spread wide around the brush
function paintHeat(w, p, r, sign) {
  const x = Math.round(p.x - 0.5), y = Math.round(p.y - 0.5), R = Math.min(30, r * 2 + 6), tu = w.tUser || (w.tUser = new Float32Array(N)), tb = w.tBias || (w.tBias = new Float32Array(N)), ap = w.tApplied || (w.tApplied = new Float32Array(N));
  for (const o of DISC[Math.min(30, R)] || DISC[20]) { const yy = y + o[1]; if (yy < 0 || yy >= H) continue; const i = yy * W + wx(x + o[0]), d = sign * 0.6 * (1 - o[2] / (R + 1)); const nv = Math.max(-35, Math.min(35, tu[i] + d)), dd = nv - tu[i]; tu[i] = nv; tb[i] += dd; ap[i] += dd; w.tJan[i] += dd; w.tJul[i] += dd; }
  w.need.climate = true; w.climateStamp = (w.climateStamp || 0) + 1; return true;
}
