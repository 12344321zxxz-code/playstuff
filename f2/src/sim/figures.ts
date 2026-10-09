// @ts-nocheck
// Key figures: rulers, heroes, prophets and villains. They are the people the chronicle names.
// Rulers come and go with the throne. Heroes rise when a people is pressed (a beast at the door,
// a war going badly) and go looking for trouble. Prophets rise where something happened that
// needs explaining, and they carry a faith on foot. Villains are what power and magic make of
// some people. You can't move them like pieces, but you can bless one, curse one, or send one
// a vision, and see what they make of it.
import { W, H, wx, wrapDx, clamp } from './core';
import { ev, discover, nameIt } from './story';
import { near, word, startWar, endWar, infect, flee, whereAbouts } from './people';
import { send, arrive } from './movers';
import { slay, forgeArt, addBeast, KINDS } from './beasts';
import { convert } from './faith';
import { mythFaith, epithetOf, noteAct } from './myth';

const ROLE = { ruler: 'ruler', hero: 'hero', prophet: 'prophet', villain: 'villain' };
const HERO_EP = ['the Bold', 'the Red', 'Ironhand', 'the Wanderer', 'Lightfoot', 'the Unbowed', 'the Young', 'Oathkeeper'];
const VILL_EP = { sorcerer: ['the Black', 'the Hollow', 'Bonehand', 'the Grey Witch'], warlord: ['the Butcher', 'Skullcleaver', 'the Wolf', 'Bloodaxe'], pirate: ['Saltbeard', 'the Sea-Wolf', 'Blackwater', 'the Drowner'] };
const PROPH_EP = ['the Seer', 'the Voice', 'the Hermit', 'the Barefoot', 'the Mad', 'the Blind', 'Who Heard'];

export function initFigures(w) { w.figs = []; }
const figById = (w, id) => w.figs.find((f) => f.id === id);
export { figById };
function make(w, c, role, kind, name, s) {
  const f = { id: w.nextId++, name, role, kind: kind || role, cult: c.id, born: w.year, died: null, fate: null, home: s ? s.id : null, x: s ? s.x : c.big ? c.big.x : 0, y: s ? s.y : c.big ? c.big.y : 0, blessed: 0, cursed: 0, deeds: 0, until: w.year + 25 + ((w.rnd() * 30) | 0), faith: null };
  w.figs.push(f); nameIt(w, 'p' + f.id, name); if (w.figs.length > 4000) w.figs.splice(0, 500); return f;
}
const pick = (w, a) => a[(w.rnd() * a.length) | 0];
const alive = (w, c, role) => w.figs.filter((f) => !f.died && f.cult === c.id && f.role === role);
export function end(w, f, fate, quiet) { if (f.died) return; f.died = w.year; f.fate = fate; if (!quiet && fate) ev(w, `${f.name} ${fate}.`, f.x, f.y, w.cults[f.cult] ? w.cults[f.cult].color : null, f.role === 'ruler' && !f.deeds ? 1 : 0, ['p' + f.id]); }

// A new ruler: called from people.ts whenever a throne changes hands.
export function crowned(w, c, was) {
  if (!w.figs) return; if (was && was.fig) { const o = figById(w, was.fig); if (o && !o.died) end(w, o, null, true), (o.fate = 'died on the throne'); }
  const f = make(w, c, 'ruler', c.ruler.trait === 'mad' ? 'tyrant' : 'ruler', c.ruler.name, c.big); f.trait = c.ruler.trait; c.ruler.fig = f.id; f.until = c.ruler.until;
  if (c.ruler.trait === 'mad') { f.villain = true; if (c.count >= 6) discover(w, 'villain', f.x, f.y); }
}
export function prophetFor(w, s, faith) {
  if (!w.figs) return null; const c = w.cults[s.cult]; const f = make(w, c, 'prophet', 'prophet', `${word(w, c.lang, 2)} ${pick(w, PROPH_EP)}`, s); f.faith = faith.id; faith.prophet = f.id; discover(w, 'prophet', s.x, s.y); return f;
}

export function figuresYear(w) {
  if (!w.figs) return; const rnd = w.rnd;
  for (const c of w.cults) {
    if (!c.alive || !c.big) continue; const b = c.big;
    // heroes: when a people is pressed
    const pressed = (c.beastFear && w.year - c.beastFear.year < 6) || (c.war && c.war.lost > c.war.taken) || (c.hungry > c.count * 0.4);
    if (pressed && alive(w, c, 'hero').length === 0 && rnd() < 0.12) {
      const s = c.beastFear ? (w.sets.find((q) => q.beastFear === c.beastFear.id && !q.dead && q.cult === c.id) || b) : b;
      const h = make(w, c, 'hero', 'hero', `${word(w, c.lang, 2)} ${pick(w, HERO_EP)}`, s); s.hero = h;
      ev(w, c.beastFear && w.year - c.beastFear.year < 6 ? `In ${s.name || 'the camps of the ' + c.name}, ${h.name} swears to put an end to the beast.` : `${h.name} rises among the ${c.name}.`, s.x, s.y, c.color, 0, ['p' + h.id]); discover(w, 'hero', s.x, s.y);
    }
    // villains: power and magic
    if (rnd() < 0.004 && c.count >= 5 && alive(w, c, 'villain').length === 0) {
      const tw = w.sets.find((s) => s.cult === c.id && s.tower && !s.dead), port = w.sets.find((s) => s.cult === c.id && s.port && c.arts.sailing && !s.dead);
      const kind = tw && rnd() < 0.6 ? 'sorcerer' : port && rnd() < 0.5 ? 'pirate' : c.war ? 'warlord' : null;
      if (kind) { const s = kind === 'sorcerer' ? tw : kind === 'pirate' ? port : b, v = make(w, c, 'villain', kind, `${word(w, c.lang, 2)} ${pick(w, VILL_EP[kind])}`, s); v.villain = true;
        ev(w, kind === 'sorcerer' ? `In the tower at ${s.name}, ${v.name} studies things that should be left alone.` : kind === 'pirate' ? `${v.name} takes ships out of ${s.name} and does not bother to trade.` : `${v.name} gathers the worst of the ${c.name} around a fire and promises them everything.`, s.x, s.y, c.color, 0, ['p' + v.id]); discover(w, 'villain', s.x, s.y); }
    }
  }
  for (const f of w.figs) {
    if (f.died) continue; const c = w.cults[f.cult];
    if (!c || !c.alive) { end(w, f, f.role === 'ruler' ? null : `is lost with the ${c ? c.name : 'people'}`, f.role === 'ruler'); continue; }
    const home = f.home != null ? w.sets.find((s) => s.id === f.home && !s.dead) : null; if (home) { f.x = home.x; f.y = home.y; }
    if (f.role === 'ruler') { if (f.cursed && rnd() < 0.12 * f.cursed) { end(w, f, 'dies suddenly, and nobody can say of what'); c.ruler.until = w.year; } if (f.blessed) c.coh = Math.min(1, c.coh + 0.01 * f.blessed); continue; }
    const old = w.year > f.until + f.blessed * 15 - f.cursed * 10;
    if (old) { end(w, f, f.role === 'hero' ? (f.deeds ? `dies old, with ${f.deeds === 1 ? 'one great deed' : f.deeds + ' great deeds'} to sing about` : 'grows old and dies, and the songs forget') : f.role === 'prophet' ? 'dies. The disciples carry on' : 'dies, and the world breathes out'); if (home && home.hero === f) home.hero = null; continue; }
    if (f.role === 'hero') heroYear(w, f, c, home);
    else if (f.role === 'prophet') prophetYear(w, f, c, home);
    else if (f.role === 'villain') villainYear(w, f, c, home);
  }
}
function heroYear(w, f, c, home) {
  const rnd = w.rnd; if (f.busy) return;
  // go after the nearest beast, preferring one that has hurt this people
  const all = (w.beasts || []).concat(w.dragons); let tgt = null, bd = 70 * 70;
  for (const b of all) { if (b.dead) continue; const lx = b.lx != null ? b.lx : b.x, ly = b.ly != null ? b.ly : b.y, d = wrapDx(lx - f.x) ** 2 + (ly - f.y) ** 2 * (c.beastFear && c.beastFear.id === b.id ? 0.3 : 1); if (d < bd) { bd = d; tgt = b; } }
  if (tgt && rnd() < 0.35 + f.blessed * 0.2) { const m = send(w, { kind: 'quest', cult: c.id, x: f.x, y: f.y, tx: tgt.lx != null ? tgt.lx : tgt.x, ty: tgt.ly != null ? tgt.ly : tgt.y, n: 12, fig: f.id, hero: f.name, beast: tgt.id, say: `On the road to the lair of ${tgt.name}.`, land: 1.1 }); if (m) { f.busy = true; ev(w, `${f.name} sets out for the lair of ${tgt.name}.`, f.x, f.y, c.color, 1, ['p' + f.id, 'b' + tgt.id]); } return; }
  // or lead the war
  if (c.war && rnd() < 0.3) { f.leads = true; return; }
  // or forge something to be remembered by
  if (home && home.tier >= 2 && c.arts.bronze && !f.forged && rnd() < 0.04) { f.forged = true; const a = forgeArt(w, home, f, c.arts.iron ? 'sword' : 'crown'); ev(w, `${f.name} has ${a.name} made at ${home.name}.`, home.x, home.y, c.color, 1, ['p' + f.id, 'a' + a.id]); }
}
arrive.quest = (w, m) => {
  const f = figById(w, m.fig); if (!f || f.died) return; f.busy = false; const c = w.cults[f.cult];
  const b = (w.beasts || []).concat(w.dragons).find((q) => q.id === m.beast && !q.dead);
  if (!b) { ev(w, `${f.name} finds the lair empty and comes home with nothing but a story.`, m.x, m.y, c ? c.color : null, 1, ['p' + f.id]); return; }
  const tough = b.kind === 'dragon' ? 0.45 : b.kind === 'basilisk' ? 0.7 : b.kind === 'troll' ? 0.85 : 1;
  const p = clamp((0.32 + 0.08 * (c ? c.tech : 0) + (c && c.arts.iron ? 0.1 : 0) + 0.25 * f.blessed - 0.3 * f.cursed) * tough, 0.04, 0.92);
  const home = w.sets.find((s) => s.id === f.home && !s.dead) || (c && c.big);
  if (w.rnd() < p) { f.deeds++; const ep = b.kind === 'dragon' ? 'Dragonslayer' : KINDS[b.kind] ? (KINDS[b.kind].name.split(' ').pop()[0].toUpperCase() + KINDS[b.kind].name.split(' ').pop().slice(1) + 'bane') : 'Wyrmbane'; const old = f.name; if (!/bane|slayer/.test(f.name)) { f.name = f.name.replace(/ the .*| [A-Z]\w+$/, '') + ' ' + ep; nameIt(w, 'p' + f.id, f.name); } if (b.kind === 'dragon') { b.dead = true; b.died = w.year; w.dragons = w.dragons.filter((d) => !d.dead); } slay(w, b, home, f); if (old !== f.name) f.was = old; }
  else { b.kills = (b.kills || 0) + 12; end(w, f, `goes into the lair of ${b.name} and does not come out`); if (home && home.hero === f) home.hero = null; }
};
function prophetYear(w, f, c, home) {
  const rnd = w.rnd, fa = f.faith != null ? w.faiths[f.faith] : null; if (!fa || !fa.alive) return;
  // preach: the towns around come over, a few at a time
  let n = 0; near(w, f.x, f.y, 18 + f.blessed * 8, null, false, (s) => { if (s.faith !== fa.id && rnd() < 0.25 + 0.15 * f.blessed - 0.15 * f.cursed) { convert(w, s, fa); n++; } });
  if (n >= 3 && rnd() < 0.3) ev(w, `${f.name} preaches ${fa.name} across the country ${whereAbouts(w, f.x, f.y)}. ${n} towns listen.`, f.x, f.y, fa.color, 1, ['p' + f.id, 'f' + fa.id]);
  // and wander
  if (rnd() < 0.25) { const s = near(w, f.x + (rnd() - 0.5) * 50, f.y + (rnd() - 0.5) * 40, 20, null, true); if (s && s.cult !== undefined) { f.home = s.id; f.x = s.x; f.y = s.y; } }
  if (c.war && rnd() < 0.02 * (1 + f.cursed)) end(w, f, 'is killed by soldiers who did not like what was being said');
}
function villainYear(w, f, c, home) {
  const rnd = w.rnd; if (f.cursed && rnd() < 0.25 * f.cursed) { end(w, f, 'is brought down, and the people dance in the streets'); return; }
  if (f.kind === 'sorcerer' && rnd() < 0.08) {
    if (rnd() < 0.5) { let foe = null; near(w, f.x, f.y, 40, null, true, (s) => { if (s.cult !== f.cult && s.tier >= 2 && (!foe || s.pop > foe.pop)) foe = s; }); if (foe && infect(w, foe, null, true)) ev(w, `A sickness comes to ${foe.name}. People say ${f.name} sent it.`, foe.x, foe.y, c.color, 0, ['p' + f.id]); }
    else { const keys = Object.keys(KINDS), b = addBeast(w, keys[(rnd() * keys.length) | 0], f.x + (rnd() - 0.5) * 30, f.y + (rnd() - 0.5) * 20, true); if (b) ev(w, `${f.name} calls something up out of the dark. It is called ${b.name}, and it does not stay where it was put.`, b.lx, b.ly, c.color, 0, ['p' + f.id, 'b' + b.id]); }
  } else if (f.kind === 'warlord' && !c.war && rnd() < 0.15) {
    let foe = null, fs = 0; for (const k in c.nb) { const o = w.cults[k]; if (o.alive && !o.war && c.nb[k] > fs) { fs = c.nb[k]; foe = o; } } if (foe) { f.leads = true; startWar(w, c, foe, false, false); ev(w, `${f.name} drags the ${c.name} into war with the ${foe.name}.`, f.x, f.y, c.color, 1, ['p' + f.id]); }
  } else if (f.kind === 'pirate') { let n = 0; for (const m of w.movers) if (!m.done && m.kind === 'trade' && m.wet && m.cult !== f.cult && wrapDx(m.x - f.x) ** 2 + (m.y - f.y) ** 2 < 900 && rnd() < 0.3) { m.done = true; n++; } if (n >= 2 && rnd() < 0.3) ev(w, `${f.name} takes ${n} ships off the coast ${whereAbouts(w, f.x, f.y)}.`, f.x, f.y, c.color, 1, ['p' + f.id]); }
}
// A figure leading a war band makes it fight harder; called from people.ts when an army forms.
export function leaderFor(w, c) { if (!w.figs) return null; const f = w.figs.find((q) => !q.died && q.cult === c.id && q.leads && (q.role === 'hero' || q.role === 'villain')); return f || null; }

/* ---------- your hand on them ---------- */
export function nudge(w, id, how) {
  const f = figById(w, id); if (!f || f.died) return 'They are beyond your reach now.'; const c = w.cults[f.cult]; noteAct(w, how === 'curse' ? 'scourge' : how === 'bless' ? 'giver' : 'mystery', f.x, f.y);
  if (how === 'bless') {
    f.blessed++; if (f.role === 'ruler') { c.coh = Math.min(1, c.coh + 0.12); c.blessed = 1.15; }
    ev(w, f.role === 'ruler' ? `Everything ${f.name} touches goes well this year. The ${c.name} take it as a sign.` : f.role === 'hero' ? `${f.name} walks out of a fire unburned. People start following.` : f.role === 'prophet' ? `Crowds gather wherever ${f.name} speaks.` : `Luck runs with ${f.name}, for now.`, f.x, f.y, c.color, 0, ['p' + f.id]);
    return `You bless ${f.name}.`;
  }
  if (how === 'curse') {
    f.cursed++; if (f.role === 'ruler') { c.coh = Math.max(0.05, c.coh - 0.15); c.blessed = 0.9; }
    if (w.rnd() < 0.3) { end(w, f, f.role === 'villain' ? 'is struck down by lightning out of a clear sky, and nobody mourns' : 'is struck down by lightning out of a clear sky'); if (f.role === 'ruler') c.ruler.until = w.year; w.fx.push({ k: 'bolt', x: f.x, y: f.y, T: 1 }); return `${f.name} falls.`; }
    ev(w, `Things go wrong for ${f.name}: a fever, a fire, a horse that will not be ridden.`, f.x, f.y, c.color, 1, ['p' + f.id]);
    return `You curse ${f.name}.`;
  }
  // a vision: each makes of it what they are
  if (f.role === 'ruler') {
    if (c.war) { const foe = w.cults[c.war.foe]; endWar(w, c, true); ev(w, `${f.name} wakes from a dream and makes peace with the ${foe.name} that same morning.`, f.x, f.y, c.color, 0, ['p' + f.id]); }
    else if (c.big && c.big.tier >= 2 && !c.big.wonder) { c.big.wonder = 1 + ((w.rnd() * 4) | 0); ev(w, `${f.name} dreams of a building nobody has seen, and orders it built at ${c.big.name}.`, c.big.x, c.big.y, c.color, 0, ['p' + f.id]); discover(w, 'wonder', c.big.x, c.big.y); }
    else { c.know += 2000; ev(w, `${f.name} sees something in a dream and cannot stop talking about it.`, f.x, f.y, c.color, 1, ['p' + f.id]); }
  } else if (f.role === 'hero') { f.busy = false; f.blessed += 0.5; ev(w, `${f.name} dreams of a lair, and sets out at dawn.`, f.x, f.y, c.color, 1, ['p' + f.id]); heroYear(w, f, c, null); }
  else if (f.role === 'prophet') { const s = w.sets.find((q) => q.id === f.home) || c.big; const fa = mythFaith(w, s, 'mystery'); if (fa) { f.faith = fa.id; ev(w, `${f.name} sees you. Not a god of fire or rain or stars, but you. ${fa.name} begins with a single sermon at ${s.name || 'a camp of the ' + c.name}.`, f.x, f.y, fa.color, 2, ['p' + f.id, 'f' + fa.id]); } }
  else { f.role = 'prophet'; f.villain = false; f.kind = 'prophet'; ev(w, `${f.name} has a vision, throws away everything, and walks off into the hills to preach.`, f.x, f.y, c.color, 0, ['p' + f.id]); }
  return `You send ${f.name} a vision.`;
}

export function figureLines(w, f) {
  const c = w.cults[f.cult], L = []; const role = f.villain ? (f.kind === 'tyrant' ? 'tyrant' : f.kind) : f.role;
  L.push(`${role[0].toUpperCase() + role.slice(1)} of the ${c ? c.name : 'lost people'}, ${f.died ? `year ${f.born} to ${f.died}` : `since year ${f.born}`}.`);
  if (f.was) L.push(`Once called ${f.was}.`); if (f.slew) L.push(`Slew ${f.slew}.`);
  if (f.faith != null && w.faiths[f.faith]) L.push(`Speaks for ${w.faiths[f.faith].name}.`);
  if (f.blessed) L.push('You have blessed them.'); if (f.cursed) L.push('You have cursed them.');
  if (f.died && f.fate) L.push(`${f.name.split(' ')[0]} ${f.fate}.`);
  return L;
}
