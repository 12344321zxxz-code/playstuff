// (Oct 31) The political map's "Look": tap a state and read its place among the others. Who it borders and how
// it stands with each of them, its wars and allies, its overlord and protectorates, the stakes held over it,
// how strong it is, and what has happened between it and its neighbours lately.
import { W, H } from './core.js';
import { ERA } from './tech.js';
import { strength } from './people.js';
import { conflictOf, sideOf, alliesOf, enemiesOf, truceLeft } from './war.js';
import { tongueGap } from './tongues.js';

const nm = (w, id) => { const c = w.cults[id]; return c ? 'the ' + c.name : 'a vanished people'; };
const list = (a) => (a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
const ord = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
const topOf = (w, c) => { let o = c; for (let k = 0; k < 6 && o && o.over && o.over.kind === 'realm' && w.cults[o.over.id]; k++) o = w.cults[o.over.id]; return o; };

// the realm on this cell of the political map, or null
export function realmAt(w, x, y) {
  x = Math.round(x - 0.5); y = Math.round(y - 0.5); if (y < 0 || y >= H || !w.polity) return null;
  const id = w.polity[y * W + ((x % W) + W) % W]; const c = id >= 0 ? w.cults[id] : null; return c && c.alive && !c.power ? c : null;
}

export function diplomacy(w, c) {
  const L = [], live = w.cults.filter((q) => q.alive && !q.power && q.count > 0), str = new Map(live.map((q) => [q.id, strength(q, q.pop)]));
  const rank = live.slice().sort((a, b) => str.get(b.id) - str.get(a.id)).indexOf(c) + 1;
  const over = c.over && c.over.kind === 'realm' ? w.cults[c.over.id] : null, subs = live.filter((q) => q.over && q.over.kind === 'realm' && q.over.id === c.id);
  const sub = `${c.kind} · ${ERA[Math.min(10, c.tech)]} · ${c.count} ${c.count === 1 ? 'place' : 'places'}${c.big && c.big.name ? ' · rules from ' + c.big.name : ''}`;
  // standing
  L.push(`The ${ord(rank)} strongest of ${live.length} states${c.house ? `. ${c.house.name.replace(/^t/, 'T')} rules` : ''}.`);
  if (over) L.push(`A protectorate of the ${over.name}: the ${over.name} take ${Math.round((c.over.take || 0) * 100)}% of the harvest and speak for them abroad.`);
  else if (c.over && c.over.kind === 'dragon') L.push('They answer to a dragon.');
  if (subs.length) L.push(`Protectorates: ${list(subs.map((q) => 'the ' + q.name))}.`);
  if (c.lev) { const st = Object.entries(c.lev).filter(([k, v]) => v >= 0.2 && w.cults[k] && w.cults[k].alive).sort((a, b) => b[1] - a[1]); if (st.length) L.push(`In debt to ${list(st.map(([k, v]) => nm(w, k) + (v >= 0.6 ? ' (deeply)' : '')))}: a resident at court${st.length >= 2 && st[1][1] > 0.67 * st[0][1] ? ', and the powers that hold the debts keep each other out' : ''}.`); }
  const holds = live.filter((q) => q.lev && (q.lev[c.id] || 0) >= 0.2 && !(q.over && q.over.id === c.id)); if (holds.length) L.push(`They hold the debts of ${list(holds.map((q) => 'the ' + q.name))}.`);
  // war and peace
  const K = conflictOf(w, c);
  if (c.war) { const foes = enemiesOf(w, c), al = alliesOf(w, c), s = K ? sideOf(K, c.id) : -1;
    L.push(`At war${K && K.name ? ` (${K.name})` : ''} with ${list(foes.map((id) => nm(w, id)))} since year ${c.war.since}${al.length ? `, alongside ${list(al.map((id) => nm(w, id)))}` : ''}.${s >= 0 && K.sides[s].lead !== c.id ? ` They joined for ${nm(w, K.sides[s].lead)}.` : ''}`); }
  const truces = live.filter((q) => q !== c && truceLeft(w, c.id, q.id) > 0); if (truces.length) L.push(`At peace by treaty with ${list(truces.map((q) => `the ${q.name} (${truceLeft(w, c.id, q.id)} more years)`))}.`);
  // neighbours
  const nb = c.terr && c.terr.nb ? Object.entries(c.terr.nb).map(([k, v]) => [w.cults[k], v]).filter(([q]) => q && q.alive && !q.power).sort((a, b) => b[1] - a[1]) : [];
  if (nb.length) {
    const tag = (q) => { const t = []; const r = str.get(q.id) / Math.max(1, str.get(c.id));
      if (c.war && enemiesOf(w, c).includes(q.id)) t.push('at war'); else if (alliesOf(w, c).includes(q.id)) t.push('ally'); else if (truceLeft(w, c.id, q.id) > 0) t.push('treaty');
      if (over === q) t.push('their overlord'); else if (q.over && q.over.id === c.id) t.push('their protectorate'); else if (topOf(w, q) === topOf(w, c) && topOf(w, c) !== c && topOf(w, c) !== q) t.push('same overlord');
      if (c.pid === q.id || q.pid === c.id) t.push('kin'); else if (q.langId != null && c.langId != null && tongueGap(w, q.langId, c.langId) <= 1) t.push('same tongue');
      if (q.faith != null && q.faith === c.faith) t.push('same faith');
      if (c.grudge && w.year - (c.grudge[q.id] || -999) < 40) t.push('old grudge');
      t.push(r >= 2.5 ? 'far stronger' : r >= 1.4 ? 'stronger' : r <= 0.4 ? 'far weaker' : r <= 0.7 ? 'weaker' : 'about even');
      return `the ${q.name} (${t.join(', ')})`; };
    L.push(`Borders: ${list(nb.slice(0, 7).map(([q]) => tag(q)))}${nb.length > 7 ? `, and ${nb.length - 7} more` : ''}.`);
  } else L.push('They border no other state.');
  // what happened lately between them and others
  const KS = { war: 'war', peace: 'peace', capture: 'taken', 'colonial-war': 'war over the sea', independence: 'independence', free: 'freed', secession: 'secession', civilwar: 'civil war', collapse: 'collapse', breakaway: 'breakaway', submit: 'submits', absorb: 'absorbed', expel: 'resident expelled', oath: 'alliance', 'house-rising': 'rising' };
  const h = (w.hist || []).filter((e) => e.who && e.who.includes(c.id) && KS[e.k] && w.year - e.y <= 200).slice(-6).reverse();
  const split = L.length;
  const OUT = { annex: (n) => (n ? n + ' ceded' : 'land ceded'), client: () => 'made a protectorate', toll: () => 'a toll granted', release: () => 'a client let go', reparations: (n) => (n ? 'reparations and ' + n : 'reparations paid'), status: () => 'nothing changed', frontier: () => 'the frontier moved', freed: () => 'freed', raze: () => 'towns razed' };
  const say = (e) => { if (e.k !== 'peace' || !e.note || e.note.indexOf(':') < 0) return e.note ? ' — ' + e.note.replace(/, failsafe after.*$|, will after.*$/, '') : '';
    const [war, rest] = e.note.split(/:\s*/); const m = /^(\w+)(?: \((\d+) towns?\))?/.exec(rest || '') || []; const f = OUT[m[1]]; return ` — ${war} ends${f ? ': ' + f(m[2] ? m[2] + (m[2] === '1' ? ' town' : ' towns') : '') : ''}`; };   /* the ledger's terms in plain words */
  for (const e of h) { const other = e.who.filter((id) => id !== c.id).map((id) => w.cults[id] ? w.cults[id].name : '?'); L.push(`${e.y}: ${KS[e.k]}${other.length ? ' · ' + other.join(', ') : ''}${say(e)}`); }
  return { title: 'The ' + c.name, color: c.color, sub, lines: L, split: h.length ? split : 0, splitTitle: 'Lately' };
}
