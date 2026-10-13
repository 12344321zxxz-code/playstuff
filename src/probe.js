// The probe: the world as text, for Claude (or anyone) to read without looking at the screen.
// Pure functions of the world; nothing here draws a random number or changes state.
//   digest(w)          one screen: the world, its realms, powers, wells and recent turning points
//   realmCard(w, c)    everything about one people, with the named pressures behind its cohesion
//   powerCards(w)      every great power, dragon, machine mind and deep one
//   asciiMap(w, layer) the world as letters (owner, tongue, faith, biome, memory, tier, crop:<k>, fallout)
//   seriesRow(w)       one JSON line per realm plus one for the world, for time series
//   why(w, id)         a ledger record and the chain of records behind it
import { W, H, N, wrapDx } from './core.js';
import { ERA } from './tech.js';
import { KINDS, NK } from './memory.js';
import { topTerms } from './ledger.js';
import { tensions } from './watch.js';

const r2 = (v) => (v == null ? '-' : Math.abs(v) >= 100 ? Math.round(v) : +v.toFixed(2));
const kfmt = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(1) + 'k' : String(Math.round(n)));
const alive = (w) => w.cults.filter((c) => c.alive);

export function powersOf(w) {
  const out = [];
  for (const p of w.spirits || []) if (p.great) out.push({ id: 'p:' + p.id, kind: p.kind, name: p.name, x: Math.round(p.x), y: Math.round(p.y), str: p.str, R: p.R || 0, age: w.year - p.born, span: p.span });
  for (const d of w.dragons || []) out.push({ id: 'd:' + d.name, kind: d.wyrm ? 'wyrm' : 'dragon', name: d.name, x: Math.round(d.x), y: Math.round(d.y), str: d.str || 1, R: d.R || 0, age: d.born != null ? w.year - d.born : null });
  for (const m of w.machines || []) out.push({ id: 'm:' + m.name, kind: 'machine', name: m.name, x: Math.round(m.x), y: Math.round(m.y), str: m.str, R: m.R, age: w.year - m.born, span: m.span });
  for (const k of w.krakens || []) out.push({ id: 'k:' + (k.name || k.id), kind: 'deep', name: k.name || 'a deep one', x: Math.round(k.x), y: Math.round(k.y), str: k.str || 1 });
  return out;
}

export function realmLine(w, c) {
  const P = c.press || {}, t = topTerms(P, 3).map(([k, v]) => `${k}${v > 0 ? '+' : ''}${r2(v)}`).join(' ');
  const war = c.war ? ` war:${w.cults[c.war.foe].name}(${w.year - c.war.since}y)` : '';
  return `${c.name}#${c.id} pop ${kfmt(c.pop)} towns ${c.count} era ${c.tech} coh ${r2(c.coh)}→${r2(c.cohT)} [${t}]${war}${c.carry != null ? ` carriers ${kfmt(c.carry)}→tier ${c.hold}` : ''}${c.hub ? ` hub ${c.hub.st} π${r2(c.hub.pi)} X${r2(c.hub.X)} L${r2(c.hub.L)} A${r2(c.hub.A)} ${c.hub.form}` : ''}${c.leaving ? ' LEAVING' : ''}`;
}

export function digest(w, opts) {
  const o = opts || {}, L = [], live = alive(w), tiers = [0, 0, 0, 0, 0]; for (const s of w.sets) tiers[Math.min(4, s.tier | 0)]++;
  const eras = {}; for (const c of live) eras[c.tech] = (eras[c.tech] || 0) + 1;
  L.push(`# Formicarium seed ${w.seed} year ${w.year}`);
  L.push(`world pop ${kfmt(w.stats.people || 0)} (peak ${kfmt(w.peakPop || 0)}) peoples ${live.length}/20 towns ${w.sets.length}/520 [bands/villages/towns/cities ${tiers.slice(0, 4).join('/')}] wars ${live.filter((c) => c.war && c.war.mine).length} nukes ${w.nukes || 0}${w.darkUntil > w.year ? ` DARK AGE until ${w.darkUntil}` : ''}`);
  L.push(`eras: ${Object.entries(eras).sort((a, b) => b[0] - a[0]).map(([e, n]) => `${n}×${ERA[e]}`).join(', ')}`);
  L.push(`magic ${w.stats.magic || 0} soot ${r2(w.soot || 0)} ice ${Math.round((w.landIce || 0) * 100)}% greenhouse ${r2(w.greenhouse || 0)}`);
  const warn = []; if (!Number.isFinite(w.stats.people)) warn.push('NaN population'); if (live.length >= 20) warn.push('people cap hit'); if (w.sets.length >= 510) warn.push('town cap hit');
  const recent = (w.hist || []).filter((e) => e.k === 'collapse' && w.year - e.y < 50).length; if (recent >= 4) warn.push(`${recent} collapses in 50 years`);
  if (warn.length) L.push('WARN: ' + warn.join('; '));
  L.push('', '## realms (largest first)');
  for (const c of live.sort((a, b) => b.pop - a.pop).slice(0, o.realms || 12)) L.push('- ' + realmLine(w, c));
  const tn = tensions(w).slice(0, 5); if (tn.length) { L.push('', '## building toward a turn (what Watchful slows for)'); for (const t of tn) L.push(`- ${t.text} (${r2(t.s)})${t.x != null ? ` at ${t.x},${t.y}` : ''}`); }
  const pw = powersOf(w); if (pw.length) { L.push('', '## powers'); for (const p of pw) L.push(`- ${p.id} ${p.kind} "${p.name}" at ${p.x},${p.y} str ${r2(p.str)} R ${r2(p.R)}${p.age != null ? ` age ${p.age}${p.span ? '/' + p.span : ''}` : ''}`); }
  if (w.wells && w.wells.length) L.push('', '## wells', w.wells.map((q, i) => `${i}:${q.name || 'unnamed'} ${KINDS[q.kind] ? KINDS[q.kind].key : '?'} fill ${r2(q.fill || 0)}/${q.cap || '?'}`).join(' | '));
  const h = (w.hist || []).slice(-(o.hist || 12)); if (h.length) { L.push('', '## recent turning points'); for (const e of h) L.push('- ' + histLine(w, e)); }
  return L.join('\n');
}

const nameOf = (w, v) => (typeof v === 'number' ? (w.cults[v] ? w.cults[v].name : '#' + v) : v);
export function histLine(w, e) {
  const t = e.terms ? ' {' + Object.entries(e.terms).map(([k, v]) => `${k}:${v}`).join(' ') + '}' : '';
  return `#${e.id} y${e.y} ${e.k} ${e.who.map((v) => nameOf(w, v)).join(' vs ')}${e.note ? ' — ' + e.note : ''}${e.p != null ? ` p=${e.p} roll=${e.roll}` : ''}${t}${e.links ? ' ←' + e.links.map((l) => '#' + l).join(',') : ''}${e.cause ? ' cause #' + e.cause : ''}`;
}
export function why(w, id, depth = 3) {
  const by = new Map((w.hist || []).map((e) => [e.id, e])), out = [], seen = new Set();
  const go = (i, d) => { const e = by.get(i); if (!e || seen.has(i)) return; seen.add(i); out.push('  '.repeat(3 - d) + histLine(w, e)); if (d > 0) for (const l of [e.cause, ...(e.links || [])].filter(Boolean)) go(l, d - 1); };
  go(id, depth); return out.join('\n') || `no record #${id}`;
}

export function realmCard(w, c) {
  const L = [realmLine(w, c)], P = c.press || {};
  L.push(`  pressures: ${Object.entries(P).map(([k, v]) => `${k} ${r2(v)}`).join(', ')}`);
  L.push(`  born ${c.born} parent ${c.parent || '-'} realm #${c.realmN || 1} way ${c.way} kind ${c.kind} stance ${c.stance} faith ${c.faith != null && w.faiths[c.faith] ? w.faiths[c.faith].name : '-'} (${r2(c.faithShare || 0)})`);
  L.push(`  know ${kfmt(c.know)} arts(${Object.keys(c.arts).length}) ${Object.keys(c.arts).join(' ')}`);
  L.push(`  crops ${(c.cropL || []).join(',') || '-'} tame ${Object.keys(c.tame || {}).join(',') || '-'} hungry ${c.hungry || 0} wins ${r2(c.wins || 0)}`);
  const towns = w.sets.filter((s) => s.cult === c.id).sort((a, b) => b.pop - a.pop);
  L.push(`  towns: ${towns.slice(0, 8).map((s) => `${s.name || 'camp'}(${s.x},${s.y}) t${s.tier} ${kfmt(s.pop)}`).join('; ')}${towns.length > 8 ? ` +${towns.length - 8}` : ''}`);
  const h = (w.hist || []).filter((e) => e.who.includes(c.id)).slice(-8); if (h.length) { L.push('  ledger:'); for (const e of h) L.push('   ' + histLine(w, e)); }
  return L.join('\n');
}
export const findRealm = (w, q) => w.cults.find((c) => String(c.id) === String(q) || c.name.toLowerCase() === String(q).toLowerCase());

// letters for a layer, one per block of cells; upper case = has a town
const ALPH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export function asciiMap(w, layer = 'owner', cols = 128, rows = 64, box) {
  const x0 = box ? box[0] : 0, y0 = box ? box[1] : 0, bw = box ? box[2] : W, bh = box ? box[3] : H, sx = bw / cols, sy = bh / rows, lines = [], key = new Map();
  const town = new Uint8Array(cols * rows); for (const s of w.sets) { const cx = Math.floor(wrapDx(s.x - x0 + (box ? 0 : 0)) / sx), cy = Math.floor((s.y - y0) / sy); const xx = ((s.x - x0 + W) % W) / sx | 0; if (xx >= 0 && xx < cols && cy >= 0 && cy < rows) town[cy * cols + xx] = 1; }
  const crop = layer.startsWith('crop:') ? +layer.slice(5) : -1;
  for (let ry = 0; ry < rows; ry++) {
    let line = '';
    for (let rx = 0; rx < cols; rx++) {
      const x = (x0 + Math.floor((rx + 0.5) * sx)) % W, y = Math.min(H - 1, y0 + Math.floor((ry + 0.5) * sy)), i = y * W + x;
      let ch;
      if (w.water[i] === 1 && layer !== 'memory' && layer !== 'fallout') ch = '~';
      else if (layer === 'owner') { const o = w.owner[i]; ch = o < 0 ? '.' : ALPH[o % 26]; if (o >= 0) key.set(ch, (w.cults[o] && w.cults[o].name) || o); }
      else if (layer === 'biome') ch = w.ice[i] ? '*' : w.farm[i] ? 'f' : w.urban[i] ? '#' : w.t[i] > 0.5 ? 'T' : w.g[i] > 0.3 ? ',' : w.mi[i] < 0.2 ? ':' : '.';
      else if (layer === 'memory') { let bk = 0, bv = 0.08; for (let k = 0; k < NK; k++) { const v = w.mem[i * NK + k]; if (v > bv) { bv = v; bk = k + 1; } } ch = bk ? 'dwfaxs'[bk - 1] : (w.water[i] === 1 ? '~' : '.'); if (bk && bv > 0.6) ch = ch.toUpperCase(); }
      else if (layer === 'fallout') ch = w.fallout && w.fallout[i] > 0.05 ? (w.fallout[i] > 0.5 ? '#' : '+') : w.water[i] === 1 ? '~' : '.';
      else if (layer === 'tier') ch = '.';
      else if (crop >= 0) ch = w.flora && w.flora[i] === crop ? 'C' : '.';
      else if (layer === 'faith') { const cx = x >> 2, cy = y >> 2, f = w.faithMap ? w.faithMap[cy * (W >> 2) + cx] : 0; ch = f ? ALPH[(f - 1) % 26] : '.'; }
      else ch = '?';
      if (layer === 'owner' && town[ry * cols + rx]) ch = ch === '.' ? 'o' : ch.toLowerCase();
      line += ch;
    }
    lines.push(line);
  }
  if (layer === 'tier') { for (const s of w.sets) { const xx = (((s.x - x0) % W + W) % W) / sx | 0, yy = ((s.y - y0) / sy) | 0; if (xx < cols && yy >= 0 && yy < rows) { const l = lines[yy]; lines[yy] = l.slice(0, xx) + (s.nomad ? 'n' : String(s.tier)) + l.slice(xx + 1); } } }
  const legend = layer === 'owner' ? 'owner: letter = people (lower case = a town in that block), . unclaimed, ~ water. ' + [...key].map(([k, v]) => `${k}=${v}`).join(' ') : layer === 'biome' ? 'biome: * ice f farm # city T forest , grass : desert . other ~ water' : layer === 'memory' ? 'memory: d death w wild f fire a deep x faith s frost (upper case = strong)' : layer === 'tier' ? 'tier: 0 band 1 village 2 town 3 city n nomad' : layer;
  return `[${layer} ${cols}x${rows}${box ? ' box ' + box.join(',') : ''}]\n` + lines.join('\n') + '\n' + legend;
}

export function seriesRows(w) {
  const rows = [{ t: 'world', y: w.year, pop: w.stats.people || 0, peoples: alive(w).length, towns: w.sets.length, magic: w.stats.magic || 0, nukes: w.nukes || 0, dark: w.darkUntil > w.year ? 1 : 0, wells: (w.wells || []).map((q) => +(q.fill || 0).toFixed(2)), powers: powersOf(w).length }];
  for (const c of alive(w)) rows.push({ t: 'realm', y: w.year, id: c.id, name: c.name, pop: Math.round(c.pop), towns: c.count, era: c.tech, coh: +c.coh.toFixed(3), cohT: c.cohT != null ? +c.cohT.toFixed(3) : null, war: c.war ? c.war.foe : null, press: c.press ? Object.fromEntries(Object.entries(c.press).map(([k, v]) => [k, +v.toFixed(3)])) : null });
  for (const p of powersOf(w)) rows.push({ t: 'power', y: w.year, id: p.id, kind: p.kind, str: +(+p.str).toFixed(2), R: +(+p.R).toFixed(1), x: p.x, y2: p.y });
  return rows;
}

export function regionCard(w, x, y, r) {
  const L = [], sets = w.sets.filter((s) => wrapDx(s.x - x) ** 2 + (s.y - y) ** 2 <= r * r);
  L.push(`region ${x},${y} r${r}: ${sets.length} places`);
  for (const s of sets.slice(0, 20)) L.push(`- ${s.name || 'camp'} (${s.x},${s.y}) ${w.cults[s.cult].name} tier ${s.tier}${s.nomad ? ' nomad' : ''} pop ${kfmt(s.pop)}`);
  L.push(asciiMap(w, 'owner', Math.min(64, r * 2), Math.min(32, r), [((x - r) % W + W) % W, Math.max(0, y - r), r * 2, Math.min(H, r * 2)]));
  return L.join('\n');
}

// The plain-text report the page copies to the clipboard for pasting into a chat.
export function report(w, build) {
  return [`Formicarium report (build ${build || '?'})`, digest(w, { realms: 10, hist: 30 }), '', asciiMap(w, 'owner', 96, 40)].join('\n');
}
