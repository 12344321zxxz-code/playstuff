// The keeper's notebook: the chronicle of what happened, the roster of who is alive, the almanac
// of what this world has produced, and the head counts.
import { hook, flyTo, showInfo, state, toast } from './main.js';
import { PAGES, pageCount } from './story.js';
import { peopleShort } from './core.js';
import { describeSet, cultLines } from './entities.js';
import { explain } from './ledger.js';
import { tongueColor } from './tongues.js';
import { RECORDS } from './relics.js';

const $ = (id) => document.getElementById(id);
let log = [], shown = '', almDirty = true, tab = 'chron', rosterKey = '';
const short = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'm' : n >= 10000 ? Math.round(n / 1000) + 'k' : n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(Math.round(n || 0)));   // animals
const folk = peopleShort;   // people (scaled)
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

function drain(w) { if (!w.events.length) return; for (const e of w.events) { log.push(e); if (e.page) almDirty = true; if (e.big && state.speed) toast(e); } w.events.length = 0; if (log.length > 500) log = log.slice(-400); }
function chronicle() {
  const key = log.length + ':' + (log.length ? log[log.length - 1].year : 0), ol = $('log'); if (key === shown || (shown && ol.matches(':hover'))) return; shown = key;   // hold still while the pointer is on it
  ol.textContent = '';
  if (!log.length) { const n = state.w.sets.length; ol.appendChild(el('li', 'muted', n ? `Year 0. ${n} small bands of people are scattered over the world: the coloured triangles. They know nothing yet. Where each one happens to be standing will decide most of what it becomes. Watch, or pick a power on the left and change something.` : 'Nothing worth writing down yet.')); return; }
  for (let k = log.length - 1; k >= Math.max(0, log.length - 160); k--) {
    const e = log[k], li = el('li'), b = el('button', 'ev' + (e.page ? ' pg' : e.digest ? ' dg' : e.big ? ' big' : '')); b.type = 'button';
    const c = el('span', 'chip' + (e.color ? '' : ' none')); if (e.color) c.style.background = e.color;
    b.append(el('span', 'y', e.year), c, el('span', null, e.text)); if (e.x == null) b.disabled = true; else b.addEventListener('click', () => flyTo(e.x + 0.5, e.y + 0.5, 7)); li.appendChild(b);
    if (e.hid) { const q = el('button', 'why', 'why?'); q.type = 'button'; q.title = 'What led to this'; q.addEventListener('click', (ev) => { ev.stopPropagation(); state.sel = null; showInfo({ title: 'Why: ' + e.year, lines: explain(state.w, e.hid) }); }); li.appendChild(q); }
    ol.appendChild(li);
  }
}
function roster() {
  const w = state.w, live = w.cults.filter((c) => c.alive && c.count > 0 && !c.power).sort((a, b) => b.pop - a.pop);
  const key = live.map((c) => c.id + ':' + Math.round(c.pop / 50) + ':' + c.count + c.kind + (c.war ? 'w' : '')).join('|'); if (key === rosterKey) return; rosterKey = key;
  const box = $('roster'); box.textContent = '';
  if (!live.length) box.appendChild(el('p', 'muted', 'Nobody lives here. The People tool wakes a new band wherever you tap.'));
  for (const c of live) {
    const b = el('button', 'pp'); b.type = 'button'; const chip = el('span', 'chip'); chip.style.background = c.color;
    b.append(chip, el('span', 'nm', c.name + (c.realmN >= 2 ? ' ' + ['', '', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][Math.min(10, c.realmN)] : '')), el('span', 'num', folk(c.pop)), el('span', 'sub', c.kind + ' · ' + c.count + (c.count === 1 ? ' place' : ' places') + (c.faith != null ? ' · ' + w.faiths[c.faith].name : '') + (c.war ? ' · at war with the ' + w.cults[c.war.foe].name : '')));
    if (c.series && c.series.length > 2) { b.appendChild(strip(c)); b.title = `${c.house ? c.house.name + ' rules. ' : ''}${c.parent ? 'Descended from the ' + c.parent + '. ' : ''}Line: people over time; red: more would-be lords than posts; faint: coming apart.`; }
    b.addEventListener('click', () => { const s = c.big; if (!s) return; flyTo(s.x + 0.5, s.y + 0.5, 6); const info = describeSet(w, s); state.sel = info.follow; showInfo(info); });
    box.appendChild(b);
  }
  const gone = w.cults.filter((c) => !c.alive && c.peak > 300);
  if (gone.length) box.appendChild(el('p', 'gone', `Gone: ${gone.slice(-12).map((c) => c.name).join(', ')}${gone.length > 12 ? ' and ' + (gone.length - 12) + ' before them' : ''}.`));
}
// the rise-and-fall strip: population over the realm's life, red where its lords outnumbered its posts,
// faded where it was coming apart
function strip(c) {
  const cv = document.createElement('canvas'), Wd = 120, Hd = 18; cv.width = Wd; cv.height = Hd; cv.className = 'strip'; const g = cv.getContext('2d'), S = c.series, n = S.length;
  let mx = 1; for (const p of S) if (p[1] > mx) mx = p[1]; const X = (k) => (k / (n - 1)) * (Wd - 2) + 1, Y = (v) => Hd - 2 - (v / mx) * (Hd - 4);
  for (let k = 0; k < n; k++) if (S[k][3] > 1.2) { g.fillStyle = `rgba(220,60,40,${Math.min(0.5, (S[k][3] - 1.2) * 0.5)})`; g.fillRect(X(k) - 1, 0, Wd / n + 1, Hd); }
  for (let k = 1; k < n; k++) { g.strokeStyle = c.color; g.globalAlpha = 0.3 + 0.7 * S[k][2]; g.lineWidth = 2; g.beginPath(); g.moveTo(X(k - 1), Y(S[k - 1][1])); g.lineTo(X(k), Y(S[k][1])); g.stroke(); }
  return cv;
}
function almanac() {
  if (!almDirty) return; almDirty = false; const w = state.w, box = $('almanac'); box.textContent = ''; const n = Object.keys(w.found).length;
  box.appendChild(el('p', 'muted', `${n} of ${pageCount()} pages filled. A page fills the first time this world produces the thing. Nothing here tells you how.`));
  const rec = w.feats || {}, rows = RECORDS.filter(([k]) => rec[k]); if (rows.length) { const d = el('div', 'records'); d.appendChild(el('div', 'alm-h', 'Records')); for (const [k, title, say] of rows) { const r = el('p', 'rec'); r.append(el('b', null, title + ': '), document.createTextNode(say(rec[k]))); d.appendChild(r); } box.appendChild(d); }
  for (const [name, pages] of PAGES) {
    const h = el('div', 'alm-h'); h.append(el('span', 'gl', name), el('span', 'num muted', pages.filter((p) => w.found[p[0]]).length + '/' + pages.length)); box.appendChild(h);
    const grid = el('div', 'alm');
    for (const [id, title, text] of pages) { const f = w.found[id];
      if (!f) { const d = el('div', 'blank', '· · ·'); d.setAttribute('aria-label', 'Blank page'); grid.appendChild(d); continue; }
      const b = el('button', null, title); b.type = 'button'; b.title = text; b.addEventListener('click', () => { if (f.x != null) flyTo(f.x + 0.5, f.y + 0.5, 7); state.sel = null; showInfo({ title, lines: [text, `First seen in year ${f.year}.`] }); }); grid.appendChild(b); }
    box.appendChild(grid);
  }
}
// the family tree of tongues: every language that ever was, living ones bold, with where it is spoken
let tgKey = '';
function tongues() {
  const w = state.w, L = w.langs || [], key = L.length + ':' + L.filter((l) => l.alive).length + ':' + Math.round(L.reduce((a, l) => a + l.pop, 0) / 5000); if (key === tgKey) return; tgKey = key;
  const box = $('tongues'); box.textContent = ''; const kids = {}; for (const l of L) if (l.parent != null) (kids[l.parent] || (kids[l.parent] = [])).push(l);
  const livingBelow = (l) => l.alive || (kids[l.id] || []).some(livingBelow);
  box.appendChild(el('p', 'muted', 'Every people began with a tongue of its own. Speakers cut off from each other for generations drift into daughter tongues; towns slowly take up the speech of a strong court. Dead tongues are struck through.'));
  const row = (l, d) => { if (!livingBelow(l) && d > 0) return; const b = el('button', 'tg' + (l.alive ? '' : ' dead')); b.type = 'button'; b.style.paddingLeft = (6 + d * 14) + 'px';
    const chip = el('span', 'chip'); chip.style.background = tongueColor(w, l.id); b.append(chip, el('span', 'nm', l.name), el('span', 'num', l.alive ? `${l.towns} ${l.towns === 1 ? 'place' : 'places'}` : `† ${l.died || ''}`), el('span', 'num muted', 'from ' + l.born));
    b.addEventListener('click', () => { let t = null; for (const s of w.sets) if (!s.dead && s.lang === l.id && (!t || s.pop > t.pop)) t = s; if (t) flyTo(t.x + 0.5, t.y + 0.5, 6); });
    box.appendChild(b); for (const k of kids[l.id] || []) row(k, d + 1); };
  const roots = L.filter((l) => l.parent == null && livingBelow(l)).sort((a, b) => b.pop - a.pop); for (const r of roots) row(r, 0);
  const lost = L.filter((l) => l.parent == null && !livingBelow(l)); if (lost.length) box.appendChild(el('p', 'gone', `Lost with no heirs: ${lost.slice(-12).map((l) => l.name).join(', ')}.`));
}
// the Stories tab: every question the world asked and how it ended, newest first
function render() { if (tab === 'chron') chronicle(); else if (tab === 'ppl') roster(); else if (tab === 'tg') tongues(); else almanac(); }
function setTab(t) { tab = t; for (const [id, k] of [['tab-chron', 'chron'], ['tab-ppl', 'ppl'], ['tab-tg', 'tg'], ['tab-alm', 'alm']]) $(id).setAttribute('aria-selected', t === k); $('log').hidden = t !== 'chron'; $('roster').hidden = t !== 'ppl'; $('almanac').hidden = t !== 'alm'; $('tongues').hidden = t !== 'tg'; tgKey = ''; shown = ''; rosterKey = ''; almDirty = true; render(); }

// world population as a small line: the rises and the falls are the story
function spark(w) {
  const cv = $('spark'), c = cv.getContext('2d'), h = w.popHist, W0 = cv.width, H0 = cv.height, cs = getComputedStyle(document.documentElement);
  c.clearRect(0, 0, W0, H0); if (h.length < 2) return; let mx = 1; for (const v of h) if (v > mx) mx = v;
  const X = (k) => (k / (h.length - 1)) * (W0 - 4) + 2, Y = (v) => H0 - 4 - (v / mx) * (H0 - 10);
  c.beginPath(); c.moveTo(X(0), H0); for (let k = 0; k < h.length; k++) c.lineTo(X(k), Y(h[k])); c.lineTo(X(h.length - 1), H0); c.closePath(); c.globalAlpha = 0.22; c.fillStyle = cs.getPropertyValue('--accent') || '#dba51f'; c.fill(); c.globalAlpha = 1;
  c.beginPath(); for (let k = 0; k < h.length; k++) { if (k) c.lineTo(X(k), Y(h[k])); else c.moveTo(X(k), Y(h[k])); } c.lineWidth = 3; c.lineJoin = 'round'; c.strokeStyle = cs.getPropertyValue('--ink') || '#1c2924'; c.stroke();
}

let bound = false;
hook('newWorld', () => { log = []; shown = ''; rosterKey = ''; almDirty = true; if (!bound) { bound = true; $('tab-chron').addEventListener('click', () => setTab('chron')); $('tab-ppl').addEventListener('click', () => setTab('ppl')); $('tab-tg').addEventListener('click', () => setTab('tg')); $('tab-alm').addEventListener('click', () => setTab('alm')); } setTab(tab); });
hook('tick', (w) => { drain(w); });
hook('vitals', (w, rows) => {
  drain(w); render(); spark(w); const s = w.stats;
  rows.push(['People', folk(s.people)], ['Peoples', String(s.peoples || 0)], ['Grazers', short(s.grazers)], ['Hunters', short(s.hunters)]);
  if (s.clock && s.clock !== '—') rows.push(['To midnight', s.clock]); if (w.nukes) rows.push(['Bombs fallen', String(w.nukes)]); if (s.fallout > 0.001) rows.push(['Land poisoned', (s.fallout * 100).toFixed(s.fallout < 0.1 ? 1 : 0) + '%']);
  $('tab-alm').textContent = `Almanac ${Object.keys(w.found).length}/${pageCount()}`;
});
