// The keeper's notebook: the chronicle of what happened, the almanac of what this world has
// produced, and the head counts.
import { hook, flyTo, showInfo, state } from './main.js';
import { PAGES, pageCount } from './story.js';
import { SPECIES } from './fauna.js';

const $ = (id) => document.getElementById(id);
let log = [], shown = -1, almDirty = true, tab = 'chron';
const short = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + 'm' : n >= 10000 ? Math.round(n / 1000) + 'k' : n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(Math.round(n || 0)));

function drain(w) { if (!w.events.length) return; for (const e of w.events) { log.push(e); if (e.page) almDirty = true; } w.events.length = 0; if (log.length > 400) log = log.slice(-320); }
function render() {
  if (tab === 'chron') {
    if (shown === log.length + (log.length ? log[log.length - 1].year : 0)) return; shown = log.length + (log.length ? log[log.length - 1].year : 0);
    const ol = $('log'); ol.textContent = '';
    if (!log.length) { const li = document.createElement('li'); li.className = 'muted'; li.textContent = 'Nothing worth writing down yet. Give it a few generations, or do something.'; ol.appendChild(li); return; }
    for (let k = log.length - 1; k >= Math.max(0, log.length - 140); k--) {
      const e = log[k], li = document.createElement('li'), b = document.createElement('button'); b.type = 'button'; b.className = 'ev' + (e.page ? ' pg' : '');
      const y = document.createElement('span'); y.className = 'y'; y.textContent = e.year; const c = document.createElement('span'); c.className = 'chip' + (e.color ? '' : ' none'); if (e.color) c.style.background = e.color; const t = document.createElement('span'); t.textContent = e.text;
      b.append(y, c, t); if (e.x == null) b.disabled = true; else b.addEventListener('click', () => flyTo(e.x + 0.5, e.y + 0.5, 7)); li.appendChild(b); ol.appendChild(li);
    }
  } else if (almDirty) {
    almDirty = false; const w = state.w, box = $('almanac'); box.textContent = ''; const n = Object.keys(w.found).length;
    const head = document.createElement('p'); head.className = 'muted'; head.textContent = `${n} of ${pageCount()} pages filled. A page fills the first time this world produces the thing. Nothing here tells you how.`; box.appendChild(head);
    for (const [name, pages] of PAGES) {
      const h = document.createElement('div'); h.className = 'alm-h'; const a = document.createElement('span'); a.className = 'gl'; a.textContent = name; const cnt = document.createElement('span'); cnt.className = 'num muted'; cnt.textContent = pages.filter((p) => w.found[p[0]]).length + '/' + pages.length; h.append(a, cnt); box.appendChild(h);
      const grid = document.createElement('div'); grid.className = 'alm';
      for (const [id, title, text] of pages) { const f = w.found[id];
        if (!f) { const d = document.createElement('div'); d.className = 'blank'; d.textContent = '· · ·'; d.setAttribute('aria-label', 'Blank page'); grid.appendChild(d); continue; }
        const b = document.createElement('button'); b.type = 'button'; b.textContent = title; b.title = text; b.addEventListener('click', () => { if (f.x != null) flyTo(f.x + 0.5, f.y + 0.5, 7); state.sel = null; showInfo({ title, lines: [text, `First seen in year ${f.year}.`] }); }); grid.appendChild(b); }
      box.appendChild(grid);
    }
  }
}
function setTab(t) { tab = t; $('tab-chron').setAttribute('aria-selected', t === 'chron'); $('tab-alm').setAttribute('aria-selected', t === 'alm'); $('log').hidden = t !== 'chron'; $('almanac').hidden = t !== 'alm'; shown = -1; almDirty = true; render(); }

let bound = false, last = 0;
hook('newWorld', (w) => { log = []; shown = -1; almDirty = true; if (!bound) { bound = true; $('tab-chron').addEventListener('click', () => setTab('chron')); $('tab-alm').addEventListener('click', () => setTab('alm')); } setTab(tab); });
hook('tick', (w) => { drain(w); });
hook('vitals', (w, rows) => {
  drain(w); render(); const s = w.stats;
  rows.push(['People', short(s.people)], ['Peoples', String(s.peoples || 0)], ['Grazers', short(s.grazers)], ['Hunters', short(s.hunters)]);
  const n = Object.keys(w.found).length; $('tab-alm').textContent = `Almanac ${n}/${pageCount()}`;
});
