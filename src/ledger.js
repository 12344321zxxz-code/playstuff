// The cause ledger: every turning point in history, written down at the moment it happens with what
// actually decided it (the pressures in play, the odds and the roll) and links to the earlier turning
// points that involved the same actors. The chronicle is rationed prose for the player; this is the
// full, unthrottled record that the why chips, story threads and Claude's probe read.
const KEEP = 5000;

// who: ids of peoples involved (numbers) or tags like 'p:12' (a power) / 'well:3'
// o: { p, roll, terms, x, y, note, cause } — cause is a ledger id this event directly follows from
export function record(w, kind, who, o) {
  const h = w.hist || (w.hist = []); w.histN = (w.histN || 0) + 1;
  const ids = (who || []).filter((v) => v != null);
  const e = { id: w.histN, y: w.year, k: kind, who: ids };
  if (o) {
    if (o.p != null) e.p = +o.p.toFixed(4);
    if (o.roll != null) e.roll = +o.roll.toFixed(4);
    if (o.terms) { const t = {}; for (const k in o.terms) if (Math.abs(o.terms[k]) >= 0.005) t[k] = +o.terms[k].toFixed(3); e.terms = t; }
    if (o.x != null) { e.x = Math.round(o.x); e.y2 = Math.round(o.y); }
    if (o.note) e.note = o.note;
    if (o.cause) e.cause = o.cause;
    if (o.d) e.d = o.d;
  }
  // link back to the most recent earlier turning points that share an actor (within 300 years)
  const links = []; for (let i = h.length - 1; i >= 0 && links.length < 3; i--) { const p = h[i]; if (w.year - p.y > 300) break; if (p.who.some((v) => ids.includes(v))) links.push(p.id); }
  if (links.length) e.links = links;
  w._hl = { id: e.id, tick: w.tickN };   // the chronicle line written next, this tick, points back here
  h.push(e); if (h.length > KEEP) h.splice(0, h.length - KEEP);
  return e.id;
}
export const histById = (w, id) => (w.hist || []).find((e) => e.id === id);
export const lastFor = (w, who, kind) => { const h = w.hist || []; for (let i = h.length - 1; i >= 0; i--) if (h[i].who.includes(who) && (!kind || h[i].k === kind)) return h[i]; return null; };

// The named pressures behind a people's cohesion, largest pull first, as short readable terms.
export function topTerms(terms, n = 3) {
  return Object.entries(terms || {}).filter(([k, v]) => k !== 'base' && Math.abs(v) >= 0.005).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, n);
}
const SAY = { size: 'too many towns to hold', age: 'an old realm grown soft', elites: 'more would-be lords than posts', strife: 'feuding factions', living: 'a hard life for common folk', frontier: 'room to grow', tongues: 'subjects who speak another tongue', customs: 'subjects with other ways', border: 'a border against strangers', ways: 'its ways', hunger: 'hunger', full: 'crowded towns', ruler: 'its ruler', wins: 'victories', faith: 'faith', laws: 'written law', peace: 'a peaceful faith', loss: 'lost wars', plague: 'plague', tin: 'lost trade' };
export const sayTerm = (k, v) => (SAY[k] || k) + (v < 0 ? '' : ' (holding it together)');

// The why chips: a turning point and what led to it, in plain words, newest first.
const KSAY = { collapse: 'falls apart', breakaway: 'loses provinces to a breakaway', defect: 'loses towns to a neighbour', war: 'goes to war', peace: 'makes peace', gone: 'dies out', 'power-rise': 'a power rises', 'power-fall': 'a power falls', launch: 'launches the bomb', fall: 'the world falls', factions: 'splits into factions', civilwar: 'falls into civil war', revolt: 'faces a rising of the poor', tongue: 'a daughter tongue is born', capture: 'is taken over', rising: 'rises against its overlord', free: 'is free again', fort: 'builds a fort over the sea', settle: 'sends settlers over the sea', independence: 'loses its colonies', plague: 'a sickness gets a name', adopt: 'the court takes up its subjects\' tongue' };
export function explain(w, id) {
  const by = new Map((w.hist || []).map((e) => [e.id, e])), out = [], seen = new Set();
  const nm = (v) => (typeof v === 'number' ? (w.cults[v] ? 'the ' + w.cults[v].name : '?') : String(v).replace(/^[pmdk]:/, ''));
  const one = (e) => { const who = e.who.filter((v) => typeof v === 'number').map(nm); const head = `${e.y}: ${who.length ? who.join(' and ') + ' — ' : ''}${KSAY[e.k] || e.k}${e.note ? ' (' + e.note + ')' : ''}`;
    const t = topTerms(e.terms, 3).filter(([, v]) => v < 0 || e.k !== 'collapse'); return t.length ? `${head}. Pressures: ${t.map(([k, v]) => `${SAY[k] || k} ${v > 0 ? '+' : ''}${v}`).join(', ')}` : head; };
  const walk = (i, d) => { const e = by.get(i); if (!e || seen.has(i) || d > 3) return; seen.add(i); out.push((d ? '← ' : '') + one(e)); for (const l of [e.cause, ...(e.links || [])].filter(Boolean)) walk(l, d + 1); };
  walk(id, 0); return out.slice(0, 7);
}
