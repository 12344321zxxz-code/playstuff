// Story threads: up to five open questions the world is asking ("Will the Thim hold?"), opened on the
// early signs of a turn, not at the crisis, each with a line of its recent history and a button to go
// and look. A thread opens after five game years of tension and closes after fifteen quiet ones (so it
// never flickers); when it closes it is written into the Stories tab with how it ended. Pinned
// threads stay until unpinned. Pure reads of the world, like the Watchful clock.
import { hook, flyTo } from './main.js';
import { tensions } from './watch.js';
import { near } from './people.js';
import { wrapDx } from './core.js';

const $ = (id) => document.getElementById(id);
let open = new Map(), key = '';
const pins = new Set();

// the early signs, strongest first; each is { id, k, who, q, v (value for the sparkline), s, x, y }
function signs(w) {
  const out = [];
  for (const c of w.cults) {
    if (!c.alive || !c.big || c.power || c.count < 6) continue; const h = c.hub, b = c.big;
    if (h && (h.pi > 1.25 || c.coh < 0.4)) out.push({ id: 'hold:' + c.id, k: 'hold', who: c.id, q: `Will the ${c.name} hold?`, v: c.coh, s: 0.1 + Math.max(0, h.pi - 1) + Math.max(0, 0.45 - c.coh) + c.count / 300, x: b.x, y: b.y });
    if (h && h.L < 0.7) out.push({ id: 'rise:' + c.id, k: 'rise', who: c.id, q: `Will the common folk of the ${c.name} rise?`, v: h.L, s: 0.08 + (0.7 - h.L), x: b.x, y: b.y });
    if (c.over && h && h.L < 0.9) { const by = c.over.kind === 'dragon' ? c.over.d : w.cults[c.over.id] ? 'the ' + w.cults[c.over.id].name : 'their overlord'; out.push({ id: 'free:' + c.id, k: 'free', who: c.id, q: `Will the ${c.name} throw off ${by}?`, v: c.over.take, s: 0.15 + c.over.take, x: b.x, y: b.y }); }
  }
  for (const q of w.wells || []) { const cap = q.cap || 40, f = (q.fill || 0) / cap; if (f > 0.6 && f < 1.4) out.push({ id: 'well:' + q.x + ',' + q.y, k: 'well', q: `Will ${q.name || 'the wellspring'} burst?`, v: f, s: 0.05 + f * 0.2, x: q.x, y: q.y, wx: q.x, wy: q.y }); }
  for (const c of w.cults) {
    if (!c.alive || c.power !== 'dead' || !c.big) continue; let tgt = null;
    near(w, c.big.x, c.big.y, 34, null, true, (s, d) => { const o = w.cults[s.cult]; if (!o.power && s.tier >= 2 && (!tgt || d < tgt.d)) tgt = { s, d }; });
    if (tgt) out.push({ id: 'dead:' + c.id, k: 'dead', who: c.id, q: `Will the dead reach ${tgt.s.name}?`, v: c.count, s: 0.2 + c.coh * 0.2, x: tgt.s.x, y: tgt.s.y, town: tgt.s.id, foe: tgt.s.cult });
  }
  // the turns already under way (wars between great realms, the doomsday clock, an exodus) come from the Watchful clock
  for (const t of tensions(w)) if (['greatwar', 'clock', 'exodus', 'hunger'].includes(t.k)) out.push({ id: t.k + ':' + (t.who != null ? t.who : ''), k: t.k, who: t.who, q: t.text, v: t.s, s: t.s, x: t.x, y: t.y });
  return out.sort((a, b) => b.s - a.s);
}
function ending(w, th) {
  const c = th.who != null ? w.cults[th.who] : null, since = (y) => y != null && y >= th.start;
  if (th.k === 'hold') return !c || !c.alive ? `The ${th.name} are gone.` : since(c.fellAt) ? `The ${th.name} came apart.` : since(c.splitAt) ? `The ${th.name} held, but lost provinces.` : `The ${th.name} held.`;
  if (th.k === 'rise') return !c || !c.alive ? `The ${th.name} are gone.` : (w.hist || []).some((e) => e.k === 'revolt' && e.y >= th.start && e.who.includes(th.who)) ? `The common folk of the ${th.name} rose.` : `The common folk of the ${th.name} endured.`;
  if (th.k === 'free') return !c || !c.alive ? `The ${th.name} are gone.` : c.over ? `The ${th.name} still pay.` : `The ${th.name} are free.`;
  if (th.k === 'well') { const q = (w.wells || []).find((q) => q.x === th.wx && q.y === th.wy); return q && (q.fill || 0) < (q.cap || 40) * 0.6 ? `${th.q.replace(/^Will /, '').replace(/ burst\?$/, '')} burst.` : `${th.q.replace(/^Will /, '').replace(/ burst\?$/, '')} settled.`; }
  if (th.k === 'dead') { const t = w.sets.find((s) => s.id === th.town); return !c || !c.alive ? `The dead are laid to rest.` : t && !t.dead && t.undead ? `The dead took ${th.place}.` : t && !t.dead ? `${th.place} held against the dead.` : `${th.place} is gone.`; }
  if (th.k === 'greatwar') return `The war is over.`;
  if (th.k === 'hunger') return !c || !c.alive ? `The ${th.name} are gone.` : c.over ? `The dragon is fed, for now.` : `The ${th.name} are free of their dragon.`;
  return 'It passed.';
}
function draw(cv, pts) {
  const g = cv.getContext('2d'), Wd = cv.width, Hd = cv.height; g.clearRect(0, 0, Wd, Hd); if (pts.length < 2) return;
  let mx = -1e9, mn = 1e9; for (const v of pts) { if (v > mx) mx = v; if (v < mn) mn = v; } const span = Math.max(1e-6, mx - mn);
  g.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--ink') || '#333'; g.lineWidth = 1.5; g.beginPath();
  pts.forEach((v, k) => { const x = (k / (pts.length - 1)) * (Wd - 2) + 1, y = Hd - 2 - ((v - mn) / span) * (Hd - 4); if (k) g.lineTo(x, y); else g.moveTo(x, y); }); g.stroke();
}
hook('newWorld', () => { open = new Map(); key = ''; pins.clear(); });
hook('vitals', (w) => {
  const box = $('threads'); if (!box || !w) return; const stories = w.stories || (w.stories = []);
  const now = signs(w), seen = new Set();
  for (const t of now) {
    seen.add(t.id); let th = open.get(t.id);
    if (!th) { const c = t.who != null ? w.cults[t.who] : null; th = { id: t.id, k: t.k, who: t.who, name: c ? c.name : '', q: t.q, first: w.year, start: null, pts: [], wx: t.wx, wy: t.wy, town: t.town, place: t.town != null ? (w.sets.find((s) => s.id === t.town) || {}).name : null }; open.set(t.id, th); }
    th.last = w.year; th.x = t.x; th.y = t.y; th.q = t.q; th.s = t.s;
    if (th.lastY !== w.year) { th.lastY = w.year; th.pts.push(t.v); if (th.pts.length > 80) th.pts.shift(); }
    if (th.start == null && w.year - th.first >= 5) th.start = th.first;   // five years of tension opens it
  }
  for (const [id, th] of open) {
    if (seen.has(id)) continue;
    if (th.start == null) { if (w.year - th.last > 2) open.delete(id); continue; }   // never opened: forget quietly
    if (w.year - th.last >= 15 && !pins.has(id)) { open.delete(id); const end = ending(w, th); stories.unshift({ q: th.q, from: th.start, to: w.year, end: end[0].toUpperCase() + end.slice(1), pts: th.pts.slice(), x: th.x, y: th.y }); if (stories.length > 120) stories.pop(); }
  }
  const shown = [...open.values()].filter((t) => t.start != null).sort((a, b) => (pins.has(b.id) - pins.has(a.id)) || (b.s || 0) - (a.s || 0)).slice(0, 5);
  const k2 = shown.map((t) => t.id + t.pts.length + (pins.has(t.id) ? 'p' : '')).join('|') + '/' + stories.length; if (k2 === key) return; key = k2;
  box.textContent = '';
  for (const th of shown) {
    const row = document.createElement('div'); row.className = 'thread';
    const b = document.createElement('button'); b.type = 'button'; b.className = 'tq'; b.textContent = th.q[0].toUpperCase() + th.q.slice(1); b.title = 'Go and look'; b.addEventListener('click', () => { if (th.x != null) flyTo(th.x + 0.5, th.y + 0.5, 6); });
    const cv = document.createElement('canvas'); cv.width = 60; cv.height = 14; draw(cv, th.pts);
    const pin = document.createElement('button'); pin.type = 'button'; pin.className = 'pin'; pin.textContent = pins.has(th.id) ? '★' : '☆'; pin.title = pins.has(th.id) ? 'Unpin' : 'Pin: keep following this'; pin.setAttribute('aria-pressed', pins.has(th.id));
    pin.addEventListener('click', () => { if (pins.has(th.id)) pins.delete(th.id); else pins.add(th.id); key = ''; });
    row.append(b, cv, pin); box.appendChild(row);
  }
  if (stories.length && stories[0].to >= w.year - 20) { const e = stories[0], d = document.createElement('button'); d.type = 'button'; d.className = 'thread ended'; d.textContent = e.end; d.addEventListener('click', () => { if (e.x != null) flyTo(e.x + 0.5, e.y + 0.5, 6); }); box.appendChild(d); }
});
export { draw as drawSpark };
