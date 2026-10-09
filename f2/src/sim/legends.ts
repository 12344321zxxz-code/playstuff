// @ts-nocheck
// The legends browser's side in the worker: an index of every people, place, figure, beast,
// artifact, faith and myth the world has ever had, and a page for each, with its story told
// from the events that mention it.
import { W, H } from './core';
import { TIER, ART } from './people';
import { RACES } from './races';
import { cultLines, setCard, regionName } from './look';
import { figureLines } from './figures';
import { KINDS } from './beasts';
import { TENET } from './faith';
import { REGION_KIND } from './regions';

function evById(w, id) { const H = w.history || []; let lo = 0, hi = H.length - 1; while (lo <= hi) { const m = (lo + hi) >> 1, v = H[m].id; if (v === id) return H[m]; if (v < id) lo = m + 1; else hi = m - 1; } return null; }
const evs = (w, ref, n) => (w.hist && w.hist[ref] ? w.hist[ref].slice(-(n || 300)).map((id) => evById(w, id)).filter(Boolean).map(pub) : []);
const pub = (e) => ({ id: e.id, year: e.year, text: e.text, refs: e.refs, links: e.links, x: e.x, y: e.y, color: e.color, big: e.big });
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const lifespan = (a, b) => (b != null ? `year ${a} to ${b}` : `since year ${a}`);

export function legendIndex(w, kind) {
  const out = [];
  if (kind === 'peoples') for (const c of w.cults) out.push({ ref: 'c' + c.id, name: 'The ' + c.name, sub: `${c.alive ? cap(c.kind) : 'gone'}${c.race ? ' · ' + RACES[c.race].plural : ''}`, color: c.color, alive: c.alive, year: c.born, size: c.alive ? c.pop : c.peak || 0 });
  if (kind === 'places') {
    for (const r of w.regs || []) out.push({ ref: 'g' + r.id, name: r.name, sub: REGION_KIND[r.c], alive: true, year: r.born, size: r.n });
    for (const s of w.sets) if (s.name && !s.dead) out.push({ ref: 's' + s.id, name: s.name, sub: `${TIER[s.tier]} of the ${w.cults[s.cult].name}`, color: w.cults[s.cult].color, alive: true, year: w.year - s.age, size: s.pop });
    for (const r of w.ruins) out.push({ ref: r.sid ? 's' + r.sid : null, name: 'Ruins of ' + r.name, sub: `ruin since year ${r.year}`, alive: false, year: r.year, size: (r.tier || 1) * 100 });
  }
  if (kind === 'figures') for (const f of w.figs || []) { if (f.role === 'ruler' && !(w.hist && w.hist['p' + f.id] && w.hist['p' + f.id].length) && !f.blessed && !f.cursed && f.died) continue; out.push({ ref: 'p' + f.id, name: f.name, sub: `${f.villain ? (f.kind === 'tyrant' ? 'tyrant' : f.kind) : f.role} of the ${w.cults[f.cult] ? w.cults[f.cult].name : '?'}`, color: w.cults[f.cult] ? w.cults[f.cult].color : null, alive: !f.died, year: f.born, size: f.deeds || 0 }); }
  if (kind === 'beasts') for (const b of w.beastLog || []) out.push({ ref: 'b' + b.id, name: cap(b.name), sub: b.kind === 'dragon' ? 'dragon' : b.kind === 'kraken' ? 'kraken' : b.kind === 'serpent' ? 'sea serpent' : KINDS[b.kind] ? KINDS[b.kind].name : b.kind, alive: !b.dead && b.died == null, year: b.born || 0, size: b.kills || b.sunk || 0 });
  if (kind === 'artifacts') for (const a of w.arts || []) out.push({ ref: 'a' + a.id, name: cap(a.name), sub: a.lost ? 'lost' : a.cult != null && w.cults[a.cult] ? 'held by the ' + w.cults[a.cult].name : '', alive: !a.lost, year: a.made, size: 1 });
  if (kind === 'faiths') for (const f of w.faiths || []) out.push({ ref: 'f' + f.id, name: cap(f.name), sub: f.alive ? `${f.god ? 'a faith about you · ' : ''}${f.towns} places` : 'forgotten', color: f.color, alive: f.alive, year: f.born, size: f.towns || 0, god: !!f.god });
  if (kind === 'myths') for (const m of w.myths || []) out.push({ ref: 'm' + m.id, name: m.name, sub: m.text, alive: true, year: m.year, size: 1, color: w.cults[m.cult] ? w.cults[m.cult].color : null });
  return out;
}

export function legendPage(w, ref) {
  if (!ref) return null; const k = ref[0], id = +ref.slice(1);
  if (k === 'c') { const c = w.cults[id]; if (!c) return null; const sets = w.sets.filter((s) => s.cult === id && !s.dead && s.name).sort((a, b) => b.pop - a.pop);
    const rulers = (w.figs || []).filter((f) => f.cult === id && f.role === 'ruler').slice(-12).reverse(), others = (w.figs || []).filter((f) => f.cult === id && f.role !== 'ruler').slice(-16).reverse();
    return { ref, kind: 'people', title: 'The ' + c.name, sub: `${c.alive ? cap(c.kind) : 'A people now gone'}${c.race ? ' · ' + RACES[c.race].name : ''} · ${lifespan(c.born, c.alive ? null : c.diedY)}`, color: c.color, lines: c.alive ? cultLines(w, c) : [`At their height they were ${Math.round(c.peak)} people.`], at: c.big ? [c.big.x, c.big.y] : null,
      sections: [{ title: 'Their places', items: sets.slice(0, 14).map((s) => ({ ref: 's' + s.id, label: s.name, sub: TIER[s.tier] })) }, { title: 'Rulers', items: rulers.map((f) => ({ ref: 'p' + f.id, label: f.name, sub: lifespan(f.born, f.died) })) }, { title: 'Heroes, prophets, villains', items: others.map((f) => ({ ref: 'p' + f.id, label: f.name, sub: (f.villain ? f.kind : f.role) + ', ' + lifespan(f.born, f.died) })) },
        c.faith != null ? { title: 'Faith', items: [{ ref: 'f' + c.faith, label: w.faiths[c.faith].name }] } : null].filter((s) => s && s.items.length), events: evs(w, ref) }; }
  if (k === 's') { const s = w.sets.find((q) => q.id === id && !q.dead); if (s) { const card = setCard(w, s); return { ref, kind: 'place', title: card.title, sub: card.sub, color: card.color, lines: card.lines.slice(0, card.split || card.lines.length), at: [s.x, s.y], sections: [{ title: 'People', items: [{ ref: 'c' + s.cult, label: 'The ' + w.cults[s.cult].name }] }, artsAt(w, s.id)].filter((q) => q && q.items.length), events: evs(w, ref) }; }
    const r = w.ruins.find((q) => q.sid === id); return { ref, kind: 'place', title: r ? 'Ruins of ' + r.name : 'A lost place', sub: r ? `once a ${TIER[r.tier]} of the ${r.cult}` : '', lines: r ? [`Lost in year ${r.year}.`, r.haunt ? 'Nobody goes there now.' : r.looted ? 'Diggers have been through it.' : 'Nobody has dug there yet.'] : [], at: r ? [r.x, r.y] : null, sections: [], events: evs(w, ref) }; }
  if (k === 'g') { const r = (w.regs || []).find((q) => q.id === id) || (w.regsGone || []).find((q) => q.id === id); if (!r) return null; const i = r.ay * W + r.ax, here = w.sets.filter((s) => !s.dead && s.name && w.regAt && w.regAt[s.y * W + s.x] >= 0 && w.regs[w.regAt[s.y * W + s.x]] === r).slice(0, 12);
    return { ref, kind: 'region', title: r.name, sub: `${REGION_KIND[r.c]}${r.gone ? ', gone since year ' + r.gone : ''}`, lines: [r.tongue ? `Named in the tongue of the ${r.tongue}.` : 'Its name is older than anyone living.', r.c === 1 ? (r.thick > 40 ? 'Open ocean, out of sight of land.' : 'A sea with coasts all round it.') : `About ${Math.round(r.n / 10) * 10} leagues square.`, `Mostly ${regionName(w, i).toLowerCase()}.`], at: [r.ax, r.ay], sections: here.length ? [{ title: 'Places here', items: here.map((s) => ({ ref: 's' + s.id, label: s.name, sub: TIER[s.tier] })) }] : [], events: evs(w, ref) }; }
  if (k === 'p') { const f = (w.figs || []).find((q) => q.id === id); if (!f) return null; const c = w.cults[f.cult];
    return { ref, kind: 'figure', title: f.name, sub: `${f.villain ? (f.kind === 'tyrant' ? 'Tyrant' : cap(f.kind)) : cap(f.role)} of the ${c ? c.name : '?'}`, color: c ? c.color : null, lines: figureLines(w, f), at: [f.x, f.y], alive: !f.died, nudge: !f.died, sections: [{ title: 'People', items: [{ ref: 'c' + f.cult, label: 'The ' + (c ? c.name : '?') }] }, f.faith != null && w.faiths[f.faith] ? { title: 'Faith', items: [{ ref: 'f' + f.faith, label: w.faiths[f.faith].name }] } : null].filter(Boolean), events: evs(w, ref) }; }
  if (k === 'b') { const b = (w.beastLog || []).find((q) => q.id === id); if (!b) return null; const kind = b.kind === 'dragon' ? 'dragon' : b.kind === 'kraken' ? 'kraken' : b.kind === 'serpent' ? 'sea serpent' : KINDS[b.kind] ? KINDS[b.kind].name : b.kind;
    return { ref, kind: 'beast', title: cap(b.name), sub: `${cap(kind)}, ${lifespan(b.born || 0, b.died)}`, lines: [b.slain ? `Slain at ${b.slain}.` : b.died != null ? 'Dead.' : 'Alive.', b.kills ? `It killed hundreds.` : '', b.sunk ? `It sank ${b.sunk} ships.` : '', b.raids ? `It raided the towns ${b.raids} times.` : ''].filter(Boolean), at: [b.lx != null ? b.lx : b.x, b.ly != null ? b.ly : b.y], sections: [], events: evs(w, ref) }; }
  if (k === 'a') { const a = (w.arts || []).find((q) => q.id === id); if (!a) return null; const c = a.cult != null ? w.cults[a.cult] : null;
    return { ref, kind: 'artifact', title: cap(a.name), sub: `${a.kind}, made in year ${a.made}`, lines: [a.lost ? `Lost since year ${a.lostAt}.` : c ? `Held by the ${c.name}.` : '', a.found ? `Found again in year ${a.found}.` : ''].filter(Boolean), at: a.lost ? null : [a.x, a.y], sections: [a.beast ? { title: 'From', items: [{ ref: 'b' + a.beast, label: ((w.beastLog || []).find((b) => b.id === a.beast) || {}).name || 'a beast' }] } : null].filter(Boolean), events: evs(w, ref) }; }
  if (k === 'f') { const f = w.faiths[id]; if (!f) return null; const peoples = w.cults.filter((c) => c.alive && c.faith === f.id);
    return { ref, kind: 'faith', title: cap(f.name), sub: `${f.god ? 'A faith about you' : 'A faith'}, ${lifespan(f.born, f.alive ? null : f.died)}`, color: f.color, lines: [`Born at ${f.at || 'a place now forgotten'}.`, `Its teaching ${TENET[f.tenet] || 'is its own'}.`, f.alive ? `${f.towns} places pray this way.` : 'Nobody prays this way any more.'], at: [f.x, f.y],
      sections: [{ title: 'Peoples', items: peoples.map((c) => ({ ref: 'c' + c.id, label: 'The ' + c.name })) }, f.prophet ? { title: 'Prophet', items: [{ ref: 'p' + f.prophet, label: ((w.figs || []).find((q) => q.id === f.prophet) || {}).name || 'a prophet' }] } : null].filter((s) => s && s.items.length), events: evs(w, ref) }; }
  if (k === 'm') { const m = (w.myths || []).find((q) => q.id === id); if (!m) return null; const c = w.cults[m.cult];
    return { ref, kind: 'myth', title: m.name, sub: `a myth of the ${c ? c.name : '?'}, year ${m.year}`, lines: [m.text], at: [m.x, m.y], sections: c ? [{ title: 'Told by', items: [{ ref: 'c' + c.id, label: 'The ' + c.name }] }] : [], events: [] }; }
  return null;
}
function artsAt(w, sid) { return { title: 'Treasures', items: (w.arts || []).filter((a) => a.at === sid && !a.lost).map((a) => ({ ref: 'a' + a.id, label: cap(a.name) })) }; }
export function chronicle(w, before, n, filter) {
  const H = w.history || [], out = []; let k = H.length - 1; if (before) while (k >= 0 && H[k].id >= before) k--;
  for (; k >= 0 && out.length < (n || 200); k--) { const e = H[k]; if (filter === 'big' && !e.big) continue; out.push(pub(e)); }
  return out;
}
