// Story threads: up to five open questions the world is asking right now ("Will the Thim hold?"),
// each with a small line of its recent history and a button to go and look. When one resolves it
// closes with an ending line for a while. Pure reads of the world, like the Watchful clock.
import { hook, flyTo } from './main.js';
import { tensions } from './watch.js';

const $ = (id) => document.getElementById(id);
let open = new Map(), ended = [], key = '';
const ASK = { falling: (t, c) => `Will the ${c ? c.name : 'realm'} hold?`, greatwar: (t) => t.text, strife: (t, c) => `Will the great houses of the ${c ? c.name : 'realm'} tear it apart?`, well: (t) => t.text, clock: (t) => t.text, exodus: (t) => t.text, dark: () => 'How long will the dark age last?', hunger: (t) => t.text };
const idOf = (t) => t.k + ':' + (t.who != null ? t.who : t.x + ',' + t.y);

function ending(w, th) {
  const c = th.who != null ? w.cults[th.who] : null;
  if (th.k === 'falling') return !c || !c.alive ? `The ${th.name} are gone.` : w.year - (c.fellAt || -999) < 40 ? `The ${th.name} came apart.` : `The ${th.name} held.`;
  if (th.k === 'strife') return !c || !c.alive ? `The ${th.name} did not survive their lords.` : `The great houses of the ${th.name} have settled it, for now.`;
  if (th.k === 'hunger') return !c || !c.alive ? `The ${th.name} are gone.` : c.over ? `${th.text.replace(/ grows hungry$/, '')} is fed, for now.` : `The ${th.name} are free of their dragon.`;
  if (th.k === 'greatwar') return `The war of the ${th.name} is over.`;
  if (th.k === 'well') return `${th.text.replace(/ is close to bursting$/, '')} ${th.burst ? 'burst' : 'settled'}.`;
  return 'It passed.';
}
function draw(cv, pts) {
  const g = cv.getContext('2d'), Wd = cv.width, Hd = cv.height; g.clearRect(0, 0, Wd, Hd); if (pts.length < 2) return;
  let mx = 1e-9, mn = 1e9; for (const v of pts) { if (v > mx) mx = v; if (v < mn) mn = v; } const span = Math.max(1e-6, mx - mn);
  g.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--ink') || '#333'; g.lineWidth = 1.5; g.beginPath();
  pts.forEach((v, k) => { const x = (k / (pts.length - 1)) * (Wd - 2) + 1, y = Hd - 2 - ((v - mn) / span) * (Hd - 4); if (k) g.lineTo(x, y); else g.moveTo(x, y); }); g.stroke();
}
hook('newWorld', () => { open = new Map(); ended = []; key = ''; });
hook('vitals', (w) => {
  const box = $('threads'); if (!box || !w) return;
  const now = tensions(w).slice(0, 5), seen = new Set();
  for (const t of now) {
    const id = idOf(t); seen.add(id); const c = t.who != null ? w.cults[t.who] : null;
    let th = open.get(id); if (!th) { th = { id, k: t.k, who: t.who, name: c ? c.name : '', text: t.text, pts: [], miss: 0 }; open.set(id, th); }
    th.miss = 0; th.x = t.x; th.y = t.y; th.text = t.text;
    const v = t.k === 'falling' || t.k === 'strife' ? (c ? (t.k === 'strife' && c.hub ? c.hub.pi : c.coh) : 0) : t.s; if (th.lastY !== w.year) { th.lastY = w.year; th.pts.push(v); if (th.pts.length > 60) th.pts.shift(); }
  }
  for (const [id, th] of open) if (!seen.has(id) && ++th.miss > 3) { open.delete(id); if (th.k === 'well') { const q = (w.wells || []).find((q) => q.x === th.x && q.y === th.y); th.burst = q && (q.fill || 0) < (q.cap || 40) * 0.6; } ended.unshift({ text: ending(w, th), x: th.x, y: th.y, at: performance.now() }); }
  ended = ended.filter((e) => performance.now() - e.at < 30000).slice(0, 3);
  const k2 = [...open.values()].map((t) => t.id + t.pts.length).join('|') + '/' + ended.map((e) => e.text).join('|'); if (k2 === key) return; key = k2;
  box.textContent = '';
  for (const th of open.values()) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'thread'; const c = th.who != null ? w.cults[th.who] : null;
    const s = document.createElement('span'); const q = (ASK[th.k] || ((t) => t.text))(th, c); s.textContent = q[0].toUpperCase() + q.slice(1); const cv = document.createElement('canvas'); cv.width = 60; cv.height = 14; draw(cv, th.pts);
    b.append(s, cv); b.title = 'Go and look'; b.disabled = th.x == null; b.addEventListener('click', () => { if (th.x != null) flyTo(th.x + 0.5, th.y + 0.5, 6); }); box.appendChild(b);
  }
  for (const e of ended) { const b = document.createElement('button'); b.type = 'button'; b.className = 'thread ended'; b.textContent = e.text[0].toUpperCase() + e.text.slice(1); b.disabled = e.x == null; b.addEventListener('click', () => { if (e.x != null) flyTo(e.x + 0.5, e.y + 0.5, 6); }); box.appendChild(b); }
});
