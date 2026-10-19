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
    if (o.trig) e.trig = o.trig;   /* the pressure that moved most in the decades before: the trigger, not the standing load */
    if (o.age != null) e.age = o.age;
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
// The trigger: of a realm's named pressures, the one that fell most against its value 30-50 years ago.
// The largest standing term (the load) says what a realm carries; the trigger says what changed.
export function triggerOf(c, year) {
  const ph = c.ph, P = c.press; if (!ph || !ph.length || !P) return null; let old = null;
  for (let k = ph.length - 1; k >= 0; k--) if (year - ph[k][0] >= 30) { old = ph[k][1]; break; }
  if (!old) old = ph[0][1]; let best = null, bd = -0.02;
  for (const k in P) { if (k === 'base') continue; const d = P[k] - (old[k] || 0); if (d < bd) { bd = d; best = k; } }
  return best;
}
export function topTerms(terms, n = 3) {
  return Object.entries(terms || {}).filter(([k, v]) => k !== 'base' && Math.abs(v) >= 0.005).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, n);
}
const SAY = { size: 'too many towns to hold', age: 'an old realm grown soft', elites: 'more would-be lords than posts', strife: 'feuding factions', living: 'a hard life for common folk', frontier: 'room to grow', claim: 'a claim to the old realm', war: 'lost battles', tribute: 'tribute to an overlord', fey: 'villages lost to the fey', fallout: 'poisoned land', tongues: 'subjects who speak another tongue', customs: 'subjects with other ways', border: 'a border against strangers', ways: 'its ways', hunger: 'hunger', full: 'crowded towns', ruler: 'its ruler', wins: 'victories', faith: 'faith', laws: 'written law', peace: 'a peaceful faith', loss: 'lost wars', plague: 'plague', tin: 'lost trade' };
export const sayTerm = (k, v) => (SAY[k] || k) + (v < 0 ? '' : ' (holding it together)');

// The why chips: a turning point and what led to it, in plain words, newest first.
const KSAY = { starved: 'loses an army to hunger', oath: 'swears the oath against the dead', 'oath-end': 'leaves the oath', robbed: 'loses a caravan', divert: 'sees a trade route move', bypass: 'is bypassed by trade', entrepot: 'gains an entrepôt', 'entrepot-lost': 'loses an entrepôt', 'route-born': 'opens a trade route', 'route-end': 'loses a trade route', dragonfight: 'fights a dragon for its city', collapse: 'falls apart', breakaway: 'loses provinces to a breakaway', defect: 'loses towns to a neighbour', war: 'goes to war', peace: 'makes peace', gone: 'dies out', 'power-rise': 'a power rises', 'power-fall': 'a power falls', launch: 'launches the bomb', fall: 'the world falls', factions: 'splits into factions', civilwar: 'falls into civil war', revolt: 'faces a rising of the poor', tongue: 'a daughter tongue is born', capture: 'is taken over', rising: 'rises against its overlord', free: 'is free again', fort: 'builds a fort over the sea', settle: 'sends settlers over the sea', independence: 'loses its colonies', plague: 'a sickness gets a name', seizure: 'seizes the temple lands', regather: 'regathers an old realm', convert: 'the court converts', adopt: 'the court takes up its subjects\' tongue' };
export function explain(w, id) {
  const by = new Map((w.hist || []).map((e) => [e.id, e])), out = [], seen = new Set();
  const nm = (v) => (typeof v === 'number' ? (w.cults[v] ? 'the ' + w.cults[v].name : '?') : String(v).replace(/^[pmdk]:/, ''));
  const one = (e) => { const who = e.who.filter((v) => typeof v === 'number').map(nm); const head = `${e.y}: ${who.length ? who.join(' and ') + ' — ' : ''}${KSAY[e.k] || e.k}${e.note ? ' (' + e.note + ')' : ''}`;
    const load = topTerms(e.terms, 1).filter(([, v]) => v < 0)[0], parts = [];
    if (e.trig) parts.push(`what changed: ${SAY[e.trig] || e.trig}`);
    if (load && load[0] !== e.trig) parts.push(`what it carried: ${SAY[load[0]] || load[0]}`);
    return parts.length ? `${head}. ${parts.join('; ')}.` : head; };
  // follow what actually caused it; with no recorded cause, show only the last thing that happened to the same people
  const walk = (i, d) => { const e = by.get(i); if (!e || seen.has(i) || d > 4) return; seen.add(i); out.push((d ? '← ' : '') + one(e)); if (e.cause) walk(e.cause, d + 1); else if (d === 0 && e.links && e.links[0]) { const p = by.get(e.links[0]); if (p) out.push('Before that: ' + one(p)); } };
  walk(id, 0); return out.slice(0, 7);
}
