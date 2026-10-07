// The keeper's notebook: the chronicle of what happened, the roster of who is alive, the almanac
// of what this world has produced, and the head counts.
import { hook, flyTo, showInfo, state } from './main.js';
import { PAGES, pageCount } from './story.js';
import { describeSet, cultLines } from './entities.js';

const $ = (id) => document.getElementById(id);
let log = [], shown = '', almDirty = true, tab = 'chron', rosterKey = '';
const short = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'm' : n >= 10000 ? Math.round(n / 1000) + 'k' : n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(Math.round(n || 0)));
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

function drain(w) { if (!w.events.length) return; for (const e of w.events) { log.push(e); if (e.page) almDirty = true; } w.events.length = 0; if (log.length > 500) log = log.slice(-400); }
function chronicle() {
  const key = log.length + ':' + (log.length ? log[log.length - 1].year : 0); if (key === shown) return; shown = key;
  const ol = $('log'); ol.textContent = '';
  if (!log.length) { const n = state.w.sets.length; ol.appendChild(el('li', 'muted', n ? `Year 0. ${n} small bands of people are scattered over the world: the coloured triangles. They know nothing yet. Where each one happens to be standing will decide most of what it becomes. Watch, or pick a power on the left and change something.` : 'Nothing worth writing down yet.')); return; }
  for (let k = log.length - 1; k >= Math.max(0, log.length - 160); k--) {
    const e = log[k], li = el('li'), b = el('button', 'ev' + (e.page ? ' pg' : e.digest ? ' dg' : e.big ? ' big' : '')); b.type = 'button';
    const c = el('span', 'chip' + (e.color ? '' : ' none')); if (e.color) c.style.background = e.color;
    b.append(el('span', 'y', e.year), c, el('span', null, e.text)); if (e.x == null) b.disabled = true; else b.addEventListener('click', () => flyTo(e.x + 0.5, e.y + 0.5, 7)); li.appendChild(b); ol.appendChild(li);
  }
}
function roster() {
  const w = state.w, live = w.cults.filter((c) => c.alive && c.count > 0).sort((a, b) => b.pop - a.pop);
  const key = live.map((c) => c.id + ':' + Math.round(c.pop / 50) + ':' + c.count + c.kind + (c.war ? 'w' : '')).join('|'); if (key === rosterKey) return; rosterKey = key;
  const box = $('roster'); box.textContent = '';
  if (!live.length) box.appendChild(el('p', 'muted', 'Nobody lives here. The People tool wakes a new band wherever you tap.'));
  for (const c of live) {
    const b = el('button', 'pp'); b.type = 'button'; const chip = el('span', 'chip'); chip.style.background = c.color;
    b.append(chip, el('span', 'nm', c.name), el('span', 'num', short(c.pop)), el('span', 'sub', c.kind + ' · ' + c.count + (c.count === 1 ? ' place' : ' places') + (c.war ? ' · at war with the ' + w.cults[c.war.foe].name : '')));
    b.addEventListener('click', () => { const s = c.big; if (!s) return; flyTo(s.x + 0.5, s.y + 0.5, 6); const info = describeSet(w, s); state.sel = info.follow; showInfo(info); });
    box.appendChild(b);
  }
  const gone = w.cults.filter((c) => !c.alive && c.peak > 300);
  if (gone.length) box.appendChild(el('p', 'gone', `Gone: ${gone.slice(-12).map((c) => c.name).join(', ')}${gone.length > 12 ? ' and ' + (gone.length - 12) + ' before them' : ''}.`));
}
function almanac() {
  if (!almDirty) return; almDirty = false; const w = state.w, box = $('almanac'); box.textContent = ''; const n = Object.keys(w.found).length;
  box.appendChild(el('p', 'muted', `${n} of ${pageCount()} pages filled. A page fills the first time this world produces the thing. Nothing here tells you how.`));
  for (const [name, pages] of PAGES) {
    const h = el('div', 'alm-h'); h.append(el('span', 'gl', name), el('span', 'num muted', pages.filter((p) => w.found[p[0]]).length + '/' + pages.length)); box.appendChild(h);
    const grid = el('div', 'alm');
    for (const [id, title, text] of pages) { const f = w.found[id];
      if (!f) { const d = el('div', 'blank', '· · ·'); d.setAttribute('aria-label', 'Blank page'); grid.appendChild(d); continue; }
      const b = el('button', null, title); b.type = 'button'; b.title = text; b.addEventListener('click', () => { if (f.x != null) flyTo(f.x + 0.5, f.y + 0.5, 7); state.sel = null; showInfo({ title, lines: [text, `First seen in year ${f.year}.`] }); }); grid.appendChild(b); }
    box.appendChild(grid);
  }
}
function render() { if (tab === 'chron') chronicle(); else if (tab === 'ppl') roster(); else almanac(); }
function setTab(t) { tab = t; for (const [id, k] of [['tab-chron', 'chron'], ['tab-ppl', 'ppl'], ['tab-alm', 'alm']]) $(id).setAttribute('aria-selected', t === k); $('log').hidden = t !== 'chron'; $('roster').hidden = t !== 'ppl'; $('almanac').hidden = t !== 'alm'; shown = ''; rosterKey = ''; almDirty = true; render(); }

// world population as a small line: the rises and the falls are the story
function spark(w) {
  const cv = $('spark'), c = cv.getContext('2d'), h = w.popHist, W0 = cv.width, H0 = cv.height, cs = getComputedStyle(document.documentElement);
  c.clearRect(0, 0, W0, H0); if (h.length < 2) return; let mx = 1; for (const v of h) if (v > mx) mx = v;
  const X = (k) => (k / (h.length - 1)) * (W0 - 4) + 2, Y = (v) => H0 - 4 - (v / mx) * (H0 - 10);
  c.beginPath(); c.moveTo(X(0), H0); for (let k = 0; k < h.length; k++) c.lineTo(X(k), Y(h[k])); c.lineTo(X(h.length - 1), H0); c.closePath(); c.globalAlpha = 0.22; c.fillStyle = cs.getPropertyValue('--accent') || '#dba51f'; c.fill(); c.globalAlpha = 1;
  c.beginPath(); for (let k = 0; k < h.length; k++) { if (k) c.lineTo(X(k), Y(h[k])); else c.moveTo(X(k), Y(h[k])); } c.lineWidth = 3; c.lineJoin = 'round'; c.strokeStyle = cs.getPropertyValue('--ink') || '#1c2924'; c.stroke();
}

let bound = false;
hook('newWorld', () => { log = []; shown = ''; rosterKey = ''; almDirty = true; if (!bound) { bound = true; $('tab-chron').addEventListener('click', () => setTab('chron')); $('tab-ppl').addEventListener('click', () => setTab('ppl')); $('tab-alm').addEventListener('click', () => setTab('alm')); } setTab(tab); });
hook('tick', (w) => { drain(w); });
hook('vitals', (w, rows) => {
  drain(w); render(); spark(w); const s = w.stats;
  rows.push(['People', short(s.people)], ['Peoples', String(s.peoples || 0)], ['Grazers', short(s.grazers)], ['Hunters', short(s.hunters)]);
  $('tab-alm').textContent = `Almanac ${Object.keys(w.found).length}/${pageCount()}`;
});
