// The page: camera, input, tools, panels. The world itself lives in world.js and friends.
import { tongueColor, familyOf } from './tongues.js';
import { W, H, N, TPY, CW, CH, TAU, clamp, idx, wrapDx, wx } from './core.js';
import { tensions, makeWatch, watchRate } from './watch.js';
import { makeWorld, tick, refreshWater, queueClimate, background, movePlates } from './world.js';
import { createRenderer, toScreen, toWorld } from './render.js';
import { ZONES } from './zones.js';
import { KINDS, STANCES } from './memory.js';
import { PLANTS } from './origins.js';
import { SPECIES } from './fauna.js';
import { GOODS } from './trade.js';
import { ERA } from './tech.js';
import { ERA_COL } from './render.js';
import { plateAt } from './powers.js';
import { describe } from './inspect.js';
import { coarse, sampleCoarse } from './climate.js';
import { TOOLS as TOOL_DEFS, applyTool as applyToolTo, finishEdit as finishEditOf, pressState } from './tooldefs.js';
import { landRows, TPS as HOST_TPS } from './simhost.js';
import { bus } from './bus.js';
import { openSim } from './client.js';
import { readSave } from './save.js';

const $ = (id) => document.getElementById(id);
const glc = $('gl'), ov = $('ov'), ctx = ov.getContext('2d'), jar = $('jar');
let R = null; try { R = createRenderer(glc); } catch (e) { console.error(e); }
if (!R) $('nogl').hidden = false;

const cam = { x: W / 2, y: H / 2, z: 3, dpr: 1, w: 0, h: 0, minZ: 1 };
const pal = new Float32Array(96);
const S = { w: null, tool: null, brush: 5, lens: 0, speed: 1, acc: 0, last: 0, dirty: true, hover: null, press: null, hold: null, climT: 0, waterT: 0, sel: null, hudT: 0, hintT: 0, plateDrag: null, opt: {}, touched: false, ref: null, ghost: null, perf: { sim: 0, gl: 0, ov: 0, ticks: 0, frame: 16 }, q: 1, qT: 0, adapt: true, sim: null, ranIn: 0, frameT: 0, held: false, pending: null };
const TPS = HOST_TPS;   // [1] is Watchful's quiet pace; it slows itself near turning points
const WATCH = makeWatch();
const LENSES = [[0, 'Land'], [10, 'Climate'], [1, 'Heat'], [2, 'Rain'], [11, 'Life'], [8, 'Wind'], [3, 'Soil'], [5, 'Height'], [4, 'Plates']];
const SEASONS = ['midwinter', 'late winter', 'spring', 'early summer', 'midsummer', 'late summer', 'autumn', 'early winter'];

const TOOLS = TOOL_DEFS.slice();   // the powers themselves live in tooldefs.js, so the worker can run them too
export const registerTools = (list) => { for (const t of list) TOOLS.push(t); };
const hooks = { overlay: [], vitals: [], tick: [], newWorld: [] };
export const hook = (name, fn) => hooks[name].push(fn);
export const state = S, camera = cam, palette = pal;

/* ---------- camera ---------- */
function fit() {
  cam.dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cw = jar.clientWidth, ch = jar.clientHeight; if (!cw || !ch) return;
  ov.width = Math.round(cw * cam.dpr); ov.height = Math.round(ch * cam.dpr); cam.w = ov.width; cam.h = ov.height;
  glc.width = Math.round(cam.w * S.q); glc.height = Math.round(cam.h * S.q);   // the terrain can be drawn coarser than the labels on top of it
  cam.minZ = cw / W; cam.fitZ = Math.max(ch / H, cw / W); clampCam();
}
function clampCam() {
  cam.z = clamp(cam.z, cam.minZ, 72); const half = jar.clientHeight / 2 / cam.z;
  cam.y = half >= H / 2 ? H / 2 : clamp(cam.y, half, H - half); cam.x = wx(cam.x);
}
function zoomAt(sx, sy, f) { const a = toWorld(cam, sx, sy); cam.z *= f; clampCam(); const b = toWorld(cam, sx, sy); cam.x += a.x - b.x; cam.y += a.y - b.y; clampCam(); }
export function flyTo(x, y, z) { cam.x = x; cam.y = y; if (z && cam.z < z) cam.z = z; clampCam(); }

/* ---------- tools ---------- */
function hint(msg, ms) { $('hint').textContent = msg || S.tool.hint; clearTimeout(S.hintT); if (msg) S.hintT = setTimeout(() => { $('hint').textContent = S.tool.hint; }, ms || 3200); }
export const say = hint;
bus.say = (msg, ms) => hint(msg, ms);   /* the powers speak through the bus; in the worker it carries the words back here */
function setTool(t) {
  const prev = S.tool; if (prev && prev.lens != null && S.lens === prev.lens && t.lens == null) setLens(0);
  S.tool = t; for (const b of document.querySelectorAll('[data-tool]')) b.setAttribute('aria-pressed', b.dataset.tool === t.id);
  $('brushgrp').hidden = t.kind !== 'brush'; buildOpts(t); ov.style.cursor = t.kind === 'look' ? 'grab' : 'crosshair';
  if (t.kind === 'plates') setLens(4); else if (S.lens === 4) setLens(0);
  if (t.lens != null) setLens(t.lens);
  hint();
}
function buildOpts(t) {
  const g = $('optgrp'); g.hidden = !t.opts; if (!t.opts) return; const box = g.lastChild; box.textContent = ''; const cur = S.opt[t.id] || 0;
  t.opts.forEach((l, k) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = l; b.setAttribute('aria-pressed', k === cur); b.addEventListener('click', () => { S.opt[t.id] = k; buildOpts(t); }); box.appendChild(b); });
}
function setLens(id) { S.lens = id; if (S.sim) S.sim.send({ t: 'lens', v: id }); legend(); for (const b of document.querySelectorAll('[data-lens]')) b.setAttribute('aria-pressed', +b.dataset.lens === id); S.dirty = true; }
function setSpeed(v) { S.speed = v; if (S.sim) S.sim.send({ t: 'speed', v }); for (let k = 0; k < 4; k++) $('sp' + k).setAttribute('aria-pressed', k === v); }
function setBrush(r) { S.brush = r; for (const b of document.querySelectorAll('[data-brush]')) b.setAttribute('aria-pressed', +b.dataset.brush === r); }

function applyTool(p, first) {
  const w = S.w, t = S.tool;
  if (S.sim) { S.sim.send({ t: 'tool', id: t.id, p: { x: p.x, y: p.y }, first, brush: S.brush, opt: S.opt[t.id] || 0 }); return; }   /* the worker runs it and says if it missed */
  if (first || !S.press.st) S.press.st = pressState(w, p);
  const ok = applyToolTo(w, t.id, p, first, S.brush, S.press.st, S.opt[t.id] || 0);
  S.dirty = true; if (!ok && first) hint(t.miss || 'Nothing happens there.');
  if (w.edited || w.need.climate) S.touched = true;
}
function finishEdit(p) {
  if (S.sim) { S.sim.send({ t: 'toolUp', id: S.tool.id, p: p ? { x: p.x, y: p.y } : null }); return; }
  if (S.tool.up && p) S.tool.up(S.w, p, (S.lastSt || {}));
  if (finishEditOf(S.w)) S.climT = performance.now() + 500;
  S.dirty = true;
}

/* ---------- input ---------- */
const pts = new Map();
function evp(e) { const r = ov.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top, wp = toWorld(cam, sx, sy); return { sx, sy, x: wp.x, y: wp.y }; }
function plateHandle(pl) { return { x: pl.cx + pl.vx * 16, y: pl.cy + pl.vy * 16 }; }
function bindInput() {
  ov.addEventListener('contextmenu', (e) => e.preventDefault());
  ov.addEventListener('pointerdown', (e) => {
    e.preventDefault(); try { ov.setPointerCapture(e.pointerId); } catch (_) {}
    const p = evp(e); pts.set(e.pointerId, p); S.hover = p;
    if (pts.size === 2) { const q = [...pts.values()]; S.pinch = Math.hypot(q[0].sx - q[1].sx, q[0].sy - q[1].sy); if (S.press && !S.press.pan) finishEdit(null); S.press = { pan: true, sx: (q[0].sx + q[1].sx) / 2, sy: (q[0].sy + q[1].sy) / 2, moved: 99 }; return; }
    const t = S.tool, w = S.w;
    if (e.button === 1 || e.button === 2 || t.kind === 'look' || e.shiftKey) { S.press = { pan: true, sx: p.sx, sy: p.sy, moved: 0, start: p }; ov.style.cursor = 'grabbing'; return; }
    if (t.kind === 'plates') {
      let best = null, bd = 14 / cam.z + 2.5;
      for (const pl of w.plates) { const hd = plateHandle(pl), d = Math.hypot(wrapDx(hd.x - p.x), hd.y - p.y); if (d < bd) { bd = d; best = pl; } }
      S.press = { pan: false, plate: best, start: p, moved: 0, st: {} }; return;
    }
    S.press = { pan: false, last: p, st: null, moved: 0 };
    applyTool(p, true);
    if (t.kind === 'brush' && !t.move) S.hold = setInterval(() => { if (S.press && !S.press.pan && S.hover) applyTool(S.hover, false); }, 70);
  });
  ov.addEventListener('pointermove', (e) => {
    const p = evp(e), was = pts.get(e.pointerId); S.hover = p;
    if (was) pts.set(e.pointerId, p);
    if (pts.size === 2 && was) { const q = [...pts.values()], d = Math.hypot(q[0].sx - q[1].sx, q[0].sy - q[1].sy), mx = (q[0].sx + q[1].sx) / 2, my = (q[0].sy + q[1].sy) / 2; if (S.pinch > 0) zoomAt(mx, my, d / S.pinch); S.pinch = d; if (S.press) { cam.x -= (mx - S.press.sx) / cam.z; cam.y -= (my - S.press.sy) / cam.z; S.press.sx = mx; S.press.sy = my; clampCam(); } return; }
    const pr = S.press; if (!pr) { tipAt(p); return; }
    if (pr.pan) { const dx = p.sx - pr.sx, dy = p.sy - pr.sy; pr.moved += Math.abs(dx) + Math.abs(dy); cam.x -= dx / cam.z; cam.y -= dy / cam.z; pr.sx = p.sx; pr.sy = p.sy; clampCam(); return; }
    if (S.tool.kind === 'plates') { pr.moved += 1; if (pr.plate) { const pl = pr.plate; pl.vx = clamp(wrapDx(p.x - pl.cx) / 16, -1.6, 1.6); pl.vy = clamp((p.y - pl.cy) / 16, -1.6, 1.6); } return; }
    if (S.tool.kind === 'brush') {
      const a = pr.last, dx = wrapDx(p.x - a.x), dy = p.y - a.y, step = Math.max(1, S.brush * 0.45), n = Math.floor(Math.hypot(dx, dy) / step);
      for (let k = 1; k <= n; k++) applyTool({ x: a.x + (dx * k) / n, y: a.y + (dy * k) / n }, false);
      if (n) pr.last = p;
    } else if (S.tool.drag) applyTool(p, false);
  });
  const up = (e) => {
    const p = pts.get(e.pointerId); pts.delete(e.pointerId); S.pinch = 0; if (S.hold) { clearInterval(S.hold); S.hold = null; }
    const pr = S.press; S.press = null; ov.style.cursor = S.tool.kind === 'look' ? 'grab' : 'crosshair'; if (!pr || !p) return;
    if (pr.pan) { if (pr.moved < 6 && S.tool.kind === 'look' && e.type === 'pointerup') look(p); return; }
    if (S.tool.kind === 'plates') {
      const w = S.w;
      S.touched = true;
      if (pr.plate && pr.moved > 2) { if (S.sim) S.sim.send({ t: 'plate', i: w.plates.indexOf(pr.plate), vx: pr.plate.vx, vy: pr.plate.vy }); else movePlates(w); hint('The plates shift.'); }
      else if (pr.moved <= 2) { if (S.sim) S.sim.send({ t: 'plateTap', x: p.x, y: p.y }); else { const pl = plateAt(w, p.x, p.y); pl.land = !pl.land; movePlates(w); hint(pl.land ? 'Ocean floor rises into a continent.' : 'A continent sinks beneath the sea.'); } }
      S.dirty = true; return;
    }
    S.lastSt = pr.st; finishEdit(p);
  };
  ov.addEventListener('pointerup', up); ov.addEventListener('pointercancel', up);
  ov.addEventListener('pointerleave', () => { if (!S.press) S.hover = null; $('tip').hidden = true; });
  ov.addEventListener('wheel', (e) => { e.preventDefault(); const r = ov.getBoundingClientRect(); zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.0016)); }, { passive: false });
  window.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input,textarea,select')) return; const k = e.key, st = 40 / cam.z;
    if (k === 'ArrowLeft' || k === 'a') cam.x -= st; else if (k === 'ArrowRight' || k === 'd') cam.x += st; else if (k === 'ArrowUp' || k === 'w') cam.y -= st; else if (k === 'ArrowDown' || k === 's') cam.y += st;
    else if (k === '+' || k === '=') zoomAt(jar.clientWidth / 2, jar.clientHeight / 2, 1.3); else if (k === '-') zoomAt(jar.clientWidth / 2, jar.clientHeight / 2, 1 / 1.3);
    else if (k === ' ' && e.target === document.body) setSpeed(S.speed ? 0 : 2); else if (k >= '1' && k <= '4') setSpeed(+k - 1); else if (k === 'Escape') setTool(TOOLS[0]); else return;
    e.preventDefault(); clampCam();
  });
  $('zin').addEventListener('click', () => zoomAt(jar.clientWidth / 2, jar.clientHeight / 2, 1.5)); $('zout').addEventListener('click', () => zoomAt(jar.clientWidth / 2, jar.clientHeight / 2, 1 / 1.5));
}

/* ---------- legend, hover name, headlines ---------- */
const LEG = {
  11: ['Life', 'linear-gradient(90deg,#473f33,#80db4d)', 'no game', 'teeming', 'Red: hunters (wolves and the like).'],
  1: ['Heat, over the year', 'linear-gradient(90deg,#29338c,#5a9ecc,#eeeecc,#ee9940,#b31f1f)', '-30°', '35°'],
  2: ['Rain over the year', 'linear-gradient(90deg,#dbbd85,#ccd180,#5ca86b,#1a6b7a,#1a3373)', 'desert', 'rainforest'],
  3: ['Soil', 'linear-gradient(90deg,#bfa88c,#40290f)', 'thin', 'deep'],
  5: ['Height', 'linear-gradient(90deg,#1a2e66,#8cbfd9,#73a061,#dbcc8c,#fafafa)', 'deep sea', 'peaks'],
  4: ['Plates', null, 'Drag an arrow to change a drift; tap a plate to flip it.'],
  8: ['Wind and currents', null, 'White: wind. Blue: sea currents.'],
};
function legend() {
  const el = $('legend'), L = LEG[S.lens]; el.textContent = ''; const w = S.w;
  if (S.lens === 6 || S.lens === 9) {
    const items = S.lens === 6 ? w.cults.filter((c) => c.alive && c.count > 0 && !c.power).sort((a, b) => b.pop - a.pop).slice(0, 7).map((c) => [c.color, c.name + ' · ' + c.kind]) : w.faiths.filter((f) => f.alive && f.towns > 0).sort((a, b) => b.towns - a.towns).slice(0, 7).map((f) => [f.color, f.name.replace(/^the /, '') + ' · ' + f.towns + (f.towns === 1 ? ' place' : ' places')]);
    if (!items.length) { el.hidden = true; return; }
    const b = document.createElement('b'); b.textContent = S.lens === 6 ? 'Largest peoples' : 'Faiths'; const k = document.createElement('div'); k.className = 'keys';
    for (const [c, t] of items) { const r = document.createElement('div'); r.className = 'key'; const i = document.createElement('i'); i.style.background = c; r.append(i, document.createTextNode(t)); k.appendChild(r); }
    el.append(b, k); el.hidden = false; S.legT = performance.now(); return;
  }
  const keyList = (title, items, note) => { const b = document.createElement('b'); b.textContent = title; const k = document.createElement('div'); k.className = 'keys'; for (const [c, t] of items) { const r = document.createElement('div'); r.className = 'key'; const i = document.createElement('i'); i.style.background = c; r.append(i, document.createTextNode(t)); k.appendChild(r); } el.append(b, k); if (note) { const p = document.createElement('div'); p.className = 'ends'; p.textContent = note; el.appendChild(p); } el.hidden = false; };
  if (S.lens === 7) { keyList('What the land remembers', KINDS.filter((k) => k.key !== 'frost').map((k) => [k.col, k.name[0].toUpperCase() + k.name.slice(1)]).concat(Object.values(STANCES).map((q) => [q.col, 'Borders: ' + q.name.toLowerCase()])), 'Pale lines: ley lines, which carry memory to the wells.'); return; }
  if (S.lens === 12) { keyList('Wild plants worth sowing', PLANTS.map((q) => [q.col, q.wild[0].toUpperCase() + q.wild.slice(1)]).concat([['#3d3b39', 'Nothing a people could farm']]), 'Brighter: better harvests. Crops travel along the same climate.'); return; }
  if (S.lens === 16) { keyList('Fallout', [['#bfff33', 'Poisoned ground: crops fail, animals die, people sicken'], ['#3a3836', 'Clean']], 'It fades over a few generations. The death it leaves behind lasts longer.'); return; }
  if (S.lens === 17) { const fam = new Map(); for (const L of w.langs || []) if (L.alive) { const k = familyOf(w, L.id), f = fam.get(k) || { n: 0, pop: 0 }; f.n++; f.pop += L.pop; fam.set(k, f); }
    keyList('Language families', [...fam].sort((a, b) => b[1].pop - a[1].pop).slice(0, 9).map(([r, f]) => { const F = w.langs[r]; return [tongueColor(w, r), `${F.name}${F.depth ? ' (from ' + w.langs[F.root].name + ')' : ''} · ${f.n} ${f.n === 1 ? 'tongue' : 'tongues'}`]; }), 'Each land is coloured by the tongue its nearest town speaks: hue for the family, shade for the tongue. Thick lines part families, thin lines tongues, dashed lines realms. Hatching in the rulers\' colour marks towns that do not speak their court\'s tongue. Hover a land for its tongue.'); return; }
  if (S.lens === 15) { keyList('The age each people lives in', ERA.map((e, k) => [ERA_COL[k], e[0].toUpperCase() + e.slice(1)])); return; }
  if (S.lens === 14) { keyList('Trade routes', GOODS.map((g) => [g.col, g.name[0].toUpperCase() + g.name.slice(1)]), 'Line colour: what a route mostly carries. Thicker: busier. Routes follow the cheapest ways over the land, and at sea the lanes the winds and currents make. Under them, the ways between towns: brown dashes are tracks worn by traders, pale lines roads a state built, dark lines railways. Gold squares: markets. Orange diamonds: entrepôts, where goods change hands because carriers can go no further, the tongue changes, or the next people is strangers.'); return; }
  if (S.lens === 13) { const alive = new Set(); for (const m in w.massKinds) for (const s of w.massKinds[m]) alive.add(s); keyList('Wild beasts', SPECIES.map((q, k) => [q, k]).filter(([, k]) => alive.has(k)).map(([q]) => [q.lc, q.name[0].toUpperCase() + q.name.slice(1) + (q.tame ? ' (can be tamed)' : '')]), 'Solid: a people could tame it. Checked: it will never be tamed.'); return; }
  if (S.lens === 10) { const b = document.createElement('b'); b.textContent = 'Climate zones'; const k = document.createElement('div'); k.className = 'keys'; for (const z of ZONES) { if (!z) continue; const r = document.createElement('div'); r.className = 'key'; const i = document.createElement('i'); i.style.background = z.col; r.append(i, document.createTextNode(z.name)); k.appendChild(r); } el.append(b, k); el.hidden = false; return; }
  if (!L) { el.hidden = true; return; }
  const b = document.createElement('b'); b.textContent = L[0]; el.appendChild(b);
  if (L[1]) { const bar = document.createElement('div'); bar.className = 'bar'; bar.style.background = L[1]; const e = document.createElement('div'); e.className = 'ends'; const a1 = document.createElement('span'), a2 = document.createElement('span'); a1.textContent = L[2]; a2.textContent = L[3]; e.append(a1, a2); el.append(bar, e); }
  else { const p = document.createElement('div'); p.className = 'ends'; p.textContent = L[2]; el.appendChild(p); }
  el.hidden = false;
}
// with Look, the name of whatever is under the pointer
let tipT = 0;
function tipAt(p) {
  const tip = $('tip'); if (S.tool.kind !== 'look' || !S.w) { tip.hidden = true; return; } const now = performance.now(); if (now - tipT < 90) return; tipT = now;
  describeAt(p.x, p.y, (info) => { if (!info || !S.hover || S.press) { tip.hidden = true; return; }
  tip.textContent = info.title; { const sub = info.sub; if (sub) { const sp = document.createElement('span'); sp.textContent = ' · ' + sub; tip.appendChild(sp); } }
  tip.style.left = p.sx + 'px'; tip.style.top = p.sy + 'px'; tip.hidden = false; });
}
// what is at (x, y): things standing on the map are found in the page's copy at once; the land
// itself is described by whoever holds the whole map (the worker, or this page)
function describeAt(x, y, cb) {
  const w = S.w; if (!w) return cb(null);
  if (!S.sim) return cb(describe(w, x, y));
  const xi = Math.round(x - 0.5), yi = Math.round(y - 0.5); if (yi < 0 || yi >= H) return cb(null);
  for (const fn of w.lookers || []) { const r = fn(w, xi, yi, idx(xi, yi)); if (r) return cb(r); }
  S.sim.ask('describe', { x, y }).then(cb, () => cb(null));
}
// the big things also appear over the map for a few seconds
export function toast(e) {
  const box = $('toasts'); if (box.children.length >= 3) box.firstChild.remove();
  const b = document.createElement('button'); b.type = 'button'; b.className = 'toast'; const y = document.createElement('span'); y.className = 'y'; y.textContent = e.year; const c = document.createElement('span'); c.className = 'chip' + (e.color ? '' : ' none'); if (e.color) c.style.background = e.color; const t = document.createElement('span'); t.textContent = e.text;
  b.append(y, c, t); b.addEventListener('click', () => { if (e.x != null) flyTo(e.x + 0.5, e.y + 0.5, 6); b.remove(); }); box.appendChild(b); setTimeout(() => b.remove(), 7000);
}

/* ---------- the Watchful banner ---------- */
function banner(now) {
  const b = $('banner'); if (!b) return; const B = WATCH.banner;
  if (B && now < B.until) { if (b.hidden || b.dataset.t !== B.text) { b.dataset.t = B.text; b.querySelector('.bt').textContent = B.text; b.hidden = false; b.querySelector('.bgo').hidden = B.x == null; b.querySelector('.bgo').onclick = () => { flyTo(B.x + 0.5, B.y + 0.5, 6); }; } }
  else if (!b.hidden) b.hidden = true;
  const t = WATCH.top, l = $('watching'); if (l) { const txt = t ? t.text : ''; if (l.dataset.t !== txt) { l.dataset.t = txt; l.textContent = txt ? 'Watching: ' + txt : ''; l.disabled = !t || t.x == null; l.onclick = () => { if (t && t.x != null) flyTo(t.x + 0.5, t.y + 0.5, 6); }; } }
}

/* ---------- panels ---------- */
function look(p) { describeAt(p.x, p.y, (info) => { S.sel = info && info.follow ? info.follow : null; showInfo(info); }); }
export function showInfo(info) {
  const box = $('inspect'); box.textContent = '';
  if (!info) { const el = document.createElement('p'); el.className = 'muted'; el.textContent = 'Pick Look and tap anything on the map to read it.'; box.appendChild(el); return; }
  const h = document.createElement('h3'); if (info.color) { const d = document.createElement('span'); d.className = 'chip'; d.style.background = info.color; h.appendChild(d); } h.appendChild(document.createTextNode(info.title)); box.appendChild(h);
  if (info.sub) { const el = document.createElement('p'); el.className = 'sub'; el.textContent = info.sub; box.appendChild(el); }
  if (info.bar) { const bar = document.createElement('div'); bar.className = 'fbar'; const key = document.createElement('div'); key.className = 'fkey';
    for (const [v, col, lab] of info.bar) { if (v < 0.03) continue; const seg = document.createElement('i'); seg.style.flex = v; seg.style.background = col; seg.title = lab; bar.appendChild(seg); if (v >= 0.1) { const k = document.createElement('span'); const dot = document.createElement('i'); dot.style.background = col; k.append(dot, document.createTextNode(lab + ' ' + Math.round(v * 100) + '%')); key.appendChild(k); } }
    box.append(bar, key); }
  let split = info.split || 0; info.lines.forEach((l, k) => { if (k === split && split) { const hr = document.createElement('p'); hr.className = 'part'; hr.textContent = info.splitTitle || ''; box.appendChild(hr); } const el = document.createElement('p'); el.textContent = l; box.appendChild(el); });
}
function vitals() {
  const w = S.w, rows = S.sim ? (w.vit || []).map((r) => r.slice()) : landRows(w);
  for (const fn of hooks.vitals) fn(w, rows);
  const box = $('vitals'); box.textContent = '';
  for (const [k, v] of rows) { const d = document.createElement('div'); d.className = 'vit'; const a = document.createElement('span'); a.className = 'lab'; a.textContent = k; const b = document.createElement('span'); b.className = 'num'; b.textContent = v; d.append(a, b); box.appendChild(d); }
  $('yr').textContent = w.year;
}
function dials() {
  const P = () => S.w.params, touch = () => { S.climT = performance.now() + 350; S.dirty = true; S.touched = true; labels(); };
  const set = (k, v, water) => { const p = P(); p[k] = v; if (S.sim) S.sim.send({ t: 'params', set: { [k]: v }, water }); else if (water) { p.sea = p.seaDial + S.w.seaAuto; S.w.stamp.land++; refreshWater(S.w); } };
  const labels = () => { const p = P();
    $('o-sun').textContent = p.sun === 0 ? 'as it is' : (p.sun > 0 ? '+' : '') + p.sun + '°';
    $('o-tilt').textContent = p.tilt < 4 ? 'none' : p.tilt < 16 ? 'gentle' : p.tilt < 30 ? 'mild' : p.tilt < 38 ? 'harsh' : 'savage';
    $('o-sea').textContent = Math.abs(p.seaDial) < 0.003 ? 'as it is' : p.seaDial > 0 ? 'risen' : 'fallen';
    $('d-spin').textContent = p.spin > 0 ? 'Eastward' : 'Westward';
    $('o-mood').textContent = p.mood < 0.15 ? 'steady' : p.mood < 0.7 ? 'mild' : p.mood < 1.3 ? 'fickle' : p.mood < 2.5 ? 'wild' : 'insane';
    $('o-wet').textContent = Math.abs((p.wet || 1) - 1) < 0.03 ? 'as it is' : (p.wet || 1) < 0.5 ? 'parched' : (p.wet || 1) < 1 ? 'drier' : (p.wet || 1) < 1.8 ? 'wetter' : 'deluge';
    $('o-green').textContent = !p.green ? 'none' : p.green > 0 ? '+' + p.green + '°' : p.green + '°';
  };
  $('d-mood').oninput = (e) => { set('mood', +e.target.value); labels(); };
  $('d-sun').oninput = (e) => { set('sun', +e.target.value); touch(); };
  $('d-tilt').oninput = (e) => { set('tilt', +e.target.value); touch(); };
  $('d-sea').oninput = (e) => { set('seaDial', +e.target.value, true); touch(); };
  $('d-spin').onclick = () => { set('spin', -P().spin); touch(); };
  $('d-wet').oninput = (e) => { set('wet', +e.target.value); touch(); };
  $('d-green').oninput = (e) => { set('green', +e.target.value); touch(); };
  const p = P(); $('d-sun').value = p.sun; $('d-tilt').value = p.tilt; $('d-sea').value = p.seaDial; $('d-mood').value = p.mood; $('d-wet').value = p.wet || 1; $('d-green').value = p.green || 0; labels();
}

/* ---------- overlay ---------- */
const A = [0, 0], B = [0, 0];
function arrow(x0, y0, x1, y1, col, lw) {
  const a = Math.atan2(y1 - y0, x1 - x0), hl = Math.max(4 * cam.dpr, lw * 2.6);
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x1 + Math.cos(a) * hl * 0.6, y1 + Math.sin(a) * hl * 0.6); ctx.lineTo(x1 + Math.cos(a + 2.5) * hl, y1 + Math.sin(a + 2.5) * hl); ctx.lineTo(x1 + Math.cos(a - 2.5) * hl, y1 + Math.sin(a - 2.5) * hl); ctx.closePath(); ctx.fill();
}
function drawWind() {
  const w = S.w, f = 0.5 - 0.5 * Math.cos(w.phase * TAU), o0 = coarse.out[0], o1 = coarse.out[1], step = 34 * cam.dpr, s = cam.z * cam.dpr;
  for (let sy = step / 2; sy < cam.h; sy += step) for (let sx = step / 2; sx < cam.w; sx += step) {
    const x = cam.x + (sx - cam.w / 2) / s, y = cam.y + (sy - cam.h / 2) / s; if (y < 0 || y >= H) continue; const xi = wx(Math.floor(x)), yi = Math.floor(y), sea = S.w.water[yi * W + xi] === 1;
    const u = sampleCoarse(o0.u, xi, yi) * (1 - f) + sampleCoarse(o1.u, xi, yi) * f, v = sampleCoarse(o0.v, xi, yi) * (1 - f) + sampleCoarse(o1.v, xi, yi) * f, L = step * 0.42;
    arrow(sx - u * L, sy - v * L, sx + u * L, sy + v * L, 'rgba(255,255,255,.78)', 1.3 * cam.dpr);
    if (sea) { const cu = sampleCoarse(o0.cu, xi, yi) * (1 - f) + sampleCoarse(o1.cu, xi, yi) * f, cv = sampleCoarse(o0.cv, xi, yi) * (1 - f) + sampleCoarse(o1.cv, xi, yi) * f; arrow(sx + step * 0.5 - cu * L, sy + step * 0.5 - cv * L, sx + step * 0.5 + cu * L, sy + step * 0.5 + cv * L, 'rgba(120,225,255,.8)', 1.1 * cam.dpr); }
  }
}
function drawPlates() {
  for (const pl of S.w.plates) { const hd = plateHandle(pl); toScreen(cam, pl.cx, pl.cy, A); toScreen(cam, pl.cx + pl.vx * 16, pl.cy + pl.vy * 16, B);
    arrow(A[0], A[1], B[0], B[1], 'rgba(10,12,14,.9)', 4.5 * cam.dpr); arrow(A[0], A[1], B[0], B[1], '#fff', 2.2 * cam.dpr);
    ctx.beginPath(); ctx.arc(B[0], B[1], 6 * cam.dpr, 0, TAU); ctx.fillStyle = pl.land ? '#dba51f' : '#58b6e6'; ctx.fill(); ctx.strokeStyle = '#101418'; ctx.lineWidth = 1.5 * cam.dpr; ctx.stroke(); }
}
// After you change the land or the sky, the climate settles into something new. For a few
// seconds the map shows what moved: blue where it is now wetter than before, orange where drier.
const gcv = document.createElement('canvas'); gcv.width = W; gcv.height = H; const gctx = gcv.getContext('2d');
function climateWatch(now) {
  const w = S.w; if (!S.ref || S.ref.w !== w) { S.ref = { w, stamp: w.climateStamp, mi: Float32Array.from(w.mi) }; S.ghost = null; return; }
  if (w.climateStamp === S.ref.stamp || w.job) return; const old = S.ref.mi, mi = w.mi; S.ref.stamp = w.climateStamp;
  if (S.touched) { S.touched = false; const img = gctx.createImageData(W, H), d = img.data; let wet = 0, dry = 0;
    for (let i = 0, j = 0; i < N; i++, j += 4) { if (w.water[i] === 1) continue; const a = Math.min(old[i], 2.2), b = Math.min(mi[i], 2.2), df = b - a, k = Math.abs(df) / (0.25 + 0.5 * Math.max(a, b)); if (k < 0.18) continue;
      const al = Math.min(1, (k - 0.18) * 2.2) * 190; if (df > 0) { d[j] = 30; d[j + 1] = 150; d[j + 2] = 255; wet++; } else { d[j] = 255; d[j + 1] = 120; d[j + 2] = 20; dry++; } d[j + 3] = al; }
    if (wet + dry > 60) { gctx.putImageData(img, 0, 0); S.ghost = { t0: now }; hint(wet > dry * 3 ? 'The rain has moved. Blue is wetter than it was.' : dry > wet * 3 ? 'The rain has moved. Orange is drier than it was.' : 'The rain has moved. Blue is wetter than it was, orange is drier.', 9000); } }
  old.set(mi);
}
function drawGhost(now) {
  const g = S.ghost; if (!g) return; const age = (now - g.t0) / 1000; if (age > 9) { S.ghost = null; return; }
  const s = cam.z * cam.dpr; toScreen(cam, 0, 0, A); ctx.globalAlpha = age < 6 ? 0.8 : 0.8 * (1 - (age - 6) / 3); ctx.imageSmoothingEnabled = true;
  for (let k = -1; k <= 1; k++) { const x0 = A[0] + k * W * s; if (x0 > cam.w || x0 + W * s < 0) continue; ctx.drawImage(gcv, x0, A[1], W * s, H * s); }
  ctx.globalAlpha = 1;
}
function overlay(now) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, ov.width, ov.height);
  const w = S.w;
  drawGhost(now);
  for (const fn of hooks.overlay) fn(ctx, w, cam, S, now);
  if (S.lens === 8) drawWind();
  if (S.lens === 4) drawPlates();
  const t = S.tool;
  if (S.hover && t.kind !== 'look' && t.kind !== 'plates') { const r = t.kind === 'brush' ? (t.small ? Math.min(S.brush, 3) : S.brush) + 0.5 : t.radius || 0.8; toScreen(cam, S.hover.x, S.hover.y, A); ctx.beginPath(); ctx.arc(A[0], A[1], r * cam.z * cam.dpr, 0, TAU); ctx.lineWidth = 3 * cam.dpr; ctx.strokeStyle = 'rgba(16,20,24,.55)'; ctx.stroke(); ctx.lineWidth = 1.3 * cam.dpr; ctx.strokeStyle = '#fff'; ctx.stroke(); }
}

/* ---------- loop ---------- */
// An error anywhere in a frame used to stop the loop for good (the world froze but the buttons still
// worked). Now each part runs guarded: an error in the simulation pauses the world and says so; the
// error is kept for the report; drawing errors are logged and the next frame tries again.
export const errors = [];
function oops(where, e) { const w = S.w; const rec = { where, year: w ? w.year : null, tick: w ? w.tickN : null, msg: String(e && e.message || e), stack: String(e && e.stack || '').split('\n').slice(0, 6).join(' | ') }; if (errors.length < 20 && !errors.some((x) => x.msg === rec.msg && x.where === where)) errors.push(rec); console.error(e); return rec; }
function frame(now) {
  requestAnimationFrame(frame);
  try { frameInner(now); } catch (e) { const r = oops('sim', e); if (S.speed) { setSpeed(0); say(`Something broke in year ${r.year}. The world is paused. Use Report and send it to Claude (Save too, if it works).`, 15000); } }
}
function frameInner(now) {
  const raw = now - S.last, dt = Math.min(0.1, raw / 1000); S.last = now; const w = S.w, P = S.perf, t0 = performance.now(); let ran = 0;
  if (!w) return;
  // a slow graphics card gets a coarser terrain rather than a slideshow
  if (raw < 400) P.frame += (raw - P.frame) * 0.06;
  if (S.adapt && now > S.qT) { S.qT = now + 2500; if (P.frame > 36 && P.sim < P.frame * 0.5 && S.q > 0.5) { S.q = Math.max(0.5, S.q * 0.8); P.frame = 20; fit(); } }
  const holding = !!(S.press && !S.press.pan);
  if (S.sim) {   /* the worker runs time; here the copy only catches up (see onSim) */
    if (holding !== S.held) { S.held = holding; S.sim.send({ t: 'hold', v: holding }); }
    ran = S.ranIn; S.ranIn = 0; S.acc = S.speed ? clamp((now - S.frameT) * (S.rate || 16) / 1000, 0, 1) : 1;
    if (S.speed === 1) banner(now);
  } else if (S.speed && !holding) { const rate = S.speed === 1 ? (S.rate || TPS[1]) : TPS[S.speed]; S.acc += dt * rate; const big = []; while (S.acc >= 1 && ran < 10 && performance.now() - t0 < 12) { tick(w); for (const e of w.events) if (e.big) big.push(e); for (const fn of hooks.tick) fn(w); S.acc -= 1; ran++; } if (ran) S.simDirty = true; if (S.acc > 3) S.acc = 0;
    if (S.speed === 1) { S.rate = watchRate(w, WATCH, now, big); banner(now); } }
  if (S.climT && now > S.climT && !S.press) { S.climT = 0; if (S.sim) S.sim.send({ t: 'climate' }); else queueClimate(w); }
  if (!S.sim && !S.speed && w.job && !holding) { /* only while paused: a running world does its own background work, step for step */ const st = w.stamp.land; background(w, 1); if (w.stamp.land !== st) S.dirty = true; }
  const t1 = performance.now(); P.sim += (t1 - t0 + (S.simMs || 0) - P.sim) * 0.05; S.simMs = 0; P.ticks += (ran - P.ticks) * 0.05;
  if (!S.sim && holding && w.need.water && now > S.waterT) { S.waterT = now + 320; refreshWater(w); }
  climateWatch(now);
  // the map texture is rebuilt at most a few times a second while time runs; at once after an edit (the worker builds its own)
  if (R) { if (!S.sim && (S.dirty || (S.simDirty && now - (S.upT || 0) > 160))) { R.upload(w, S.lens); S.dirty = false; S.simDirty = false; S.upT = now; } R.draw(w, cam, S.lens === 8 ? 0 : S.lens, now / 1000, pal, S.q); }
  const t2 = performance.now(); try { overlay(now); } catch (e) { oops('draw', e); } const t3 = performance.now(); P.gl += (t2 - t1 - P.gl) * 0.05; P.ov += (t3 - t2 - P.ov) * 0.05;
  if (now - S.hudT > 500) { S.hudT = now; try { vitals(); } catch (e) { oops('panel', e); } if ((S.lens === 6 || S.lens === 9) && now - (S.legT || 0) > 3000) legend(); if (S.sel && S.sel.info) { const inf = S.sel.info(); if (inf) showInfo(inf); else { S.sel = null; } } }
}

/* ---------- the worker ---------- */
// When the world runs in the background worker, the page keeps a copy of it: the slim copy the
// worker sends twice a second, with the moving things and the clock refreshed every frame, and the
// map layers the page reads (water, height, rain, ore, owners) swapped in when they change. Every
// change to the world is a command to the worker; nothing here changes the world itself.
const LAYER_KEYS = ['water', 'h', 'mi', 'ore', 'owner', 'courtOf', 'plate'];
function onSim(m) {
  const t0 = performance.now();
  if (m.t === 'frame') {
    const w = S.w; if (!w) return;
    w.tickN = m.tickN; w.year = m.year; w.phase = m.phase; w.stats = m.stats; w.movers = m.movers; w.storms = m.storms; w.storms2 = m.storms2; w.swarms = m.swarms; w.dragons = m.dragons; w.krakens = m.krakens; w.great = m.great; w.pirates = m.pirates; w.aerosol = m.aerosol; w.job = m.jobOn ? { k: 'remote' } : null;
    if (!S.press) w.params = m.params;
    for (const f of m.fx) w.fx.push(f); for (const e of m.events) w.events.push(e);
    for (const fn of hooks.tick) fn(w);
    if (m.touched) S.touched = true; S.rate = m.rate; S.frameT = performance.now(); S.ranIn += m.ran;
    WATCH.top = m.top; WATCH.banner = m.banner ? Object.assign({}, m.banner, { until: performance.now() + Math.max(0, m.banner.left || 0) }) : null;
  } else if (m.t === 'world') {
    const rep = m.w, old = S.w, keep = old && !m.fresh;
    for (const k of LAYER_KEYS) rep[k] = m.arr[k] || (keep ? old[k] : null);
    if (m.clim) for (let s = 0; s < 2; s++) for (const k of ['u', 'v', 'cu', 'cv']) coarse.out[s][k].set(m.clim[s][k]);
    if (keep) { for (const k of ['movers', 'storms', 'storms2', 'swarms', 'dragons', 'krakens', 'great', 'pirates', 'fx', 'events', 'lookers', 'tickN', 'phase']) rep[k] = old[k]; if (S.press) rep.params = old.params; }
    rep.job = rep.jobOn ? { k: 'remote' } : null; rep.actions = null;
    if (!keep) { if (S.pending) { const go = S.pending; S.pending = null; go(rep); } else adopt(rep); } else S.w = rep;
  } else if (m.t === 'tex') { if (R) R.uploadTex(m.tex); }
  else if (m.t === 'say') hint(m.msg, m.ms);
  else if (m.t === 'miss') { const t = TOOLS.find((q) => q.id === m.id); hint((t && t.miss) || 'Nothing happens there.'); }
  else if (m.t === 'edited') S.climT = performance.now() + 500;
  else if (m.t === 'error') { const rec = { where: m.where, year: m.year, tick: m.tick, msg: m.msg, stack: m.stack }; if (errors.length < 20) errors.push(rec); console.error('[sim]', m.msg, m.stack); if (m.where === 'sim') { setSpeed(0); say(`Something broke in year ${m.year}. The world is paused. Use Report and send it to Claude (Save too, if it works).`, 15000); } }
  const dt = performance.now() - t0; S.simMs = (S.simMs || 0) + dt; const st = S.simStat || (S.simStat = {}), e = st[m.t] || (st[m.t] = { n: 0, ms: 0, max: 0 }); e.n++; e.ms += dt; if (dt > e.max) e.max = dt;   /* what the copy costs the page, by kind */
}
// what the page asks of the world, wherever it runs
export function simAsk(q, args) { if (S.sim) return S.sim.ask(q, args || {}); return Promise.reject(new Error('local')); }
export const remote = () => !!S.sim;

/* ---------- boot ---------- */
function buildUI() {
  const nav = $('tools'); nav.textContent = ''; const order = ['Watch', 'Land', 'Sky', 'Life', 'Peoples', 'Wrath', 'Other world'], boxes = {};
  for (const name of order.concat(TOOLS.map((t) => t.group))) { if (boxes[name] || !TOOLS.some((t) => t.group === name)) continue; const g = document.createElement('div'); g.className = 'grp'; const h = document.createElement('span'); h.className = 'gl'; h.textContent = name; g.appendChild(h); const box = document.createElement('div'); box.className = 'gb'; g.appendChild(box); nav.appendChild(g); boxes[name] = box; }
  for (const t of TOOLS) { const b = document.createElement('button'); b.type = 'button'; b.id = 'tool-' + t.id; b.dataset.tool = t.id; b.textContent = t.label; b.title = t.hint; b.addEventListener('click', () => setTool(t)); boxes[t.group].appendChild(b); }
  const og = document.createElement('div'); og.className = 'grp opts'; og.id = 'optgrp'; og.hidden = true; og.innerHTML = '<span class="gl">Kind</span><div class="gb"></div>';
  const g = document.createElement('div'); g.className = 'grp brush'; g.id = 'brushgrp'; g.innerHTML = '<span class="gl">Brush</span><div class="gb"></div>';
  for (const [r, l] of [[2, 'S'], [5, 'M'], [10, 'L'], [18, 'XL']]) { const b = document.createElement('button'); b.type = 'button'; b.dataset.brush = r; b.textContent = l; b.setAttribute('aria-label', l + ' brush'); b.addEventListener('click', () => setBrush(r)); g.lastChild.appendChild(b); }
  const first = nav.firstChild.nextSibling; nav.insertBefore(g, first); nav.insertBefore(og, first);
  const lr = $('lenses'); lr.textContent = '';
  for (const [id, label] of LENSES) { const b = document.createElement('button'); b.type = 'button'; b.dataset.lens = id; b.id = 'lens-' + id; b.textContent = label; b.addEventListener('click', () => setLens(id)); lr.appendChild(b); }
  for (let k = 0; k < 4; k++) $('sp' + k).addEventListener('click', () => setSpeed(k));
  $('newworld').addEventListener('click', () => startSoon({ seed: (Math.random() * 1e9) | 0 }));
  $('emptyworld').addEventListener('click', () => { startSoon({ seed: (Math.random() * 1e9) | 0, bands: 0 }); setTimeout(() => { setTool(TOOLS.find((t) => t.id === 'people') || TOOLS[0]); say('An empty world. Use the People tool to wake the first of them wherever you like.'); }, 80); });
  bindInput();
  if (window.ResizeObserver) new ResizeObserver(fit).observe(jar); window.addEventListener('resize', fit);
}
export const addLens = (id, label) => LENSES.push([id, label]);
let built = false;
export function start(data) {
  const seed = data && data.seed != null ? data.seed : (Math.random() * 1e9) | 0, bands = data && data.bands != null ? data.bands : null;
  if (S.sim) return new Promise((ok) => { S.pending = (w) => { adopt(w); ok(w); }; S.sim.send({ t: 'new', seed, bands }); });
  adopt(makeWorld(seed, bands != null ? { bands } : null)); return Promise.resolve(S.w);
}
// Take over a world (a new one, or one loaded from a save) and show it.
export function adopt(world) {
  S.w = world; S.sel = null; S.acc = 0; S.dirty = true; S.touched = false; S.ref = null; if (S.sim) { world.fx = world.fx || []; world.events = world.events || []; }
  for (const fn of hooks.newWorld) fn(S.w);
  if (!built) { built = true; buildUI(); fit(); setTool(TOOLS[0]); setLens(0); setBrush(5); if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) S.speed = 1; setSpeed(S.speed); S.last = performance.now(); requestAnimationFrame(frame); }
  else if (S.sim) { S.sim.send({ t: 'speed', v: S.speed }); S.sim.send({ t: 'lens', v: S.lens }); }
  cam.x = W / 2; cam.y = H / 2; cam.z = cam.fitZ || cam.minZ; clampCam(); dials(); showInfo(null); vitals();
}
// Load a saved world (bytes of a .zip, .formi or raw save)
export function loadBytes(bytes, readSave) {
  if (S.sim) return new Promise((ok, no) => { S.pending = (w) => { adopt(w); ok(w); }; S.sim.ask('load', { bytes }, [bytes.buffer]).then((r) => { if (r && r.bad) { S.pending = null; no(new Error('bad')); } }, no); });
  return readSave(bytes).then((w) => { adopt(w); return w; });
}
// Making a world takes a second or two; say so first. The first time, the worker is started too:
// if this browser (or the page it is embedded in) will not run one, the world runs here instead.
let simTried = false;
export function startSoon(data) {
  $('making').hidden = false;
  const go = () => { try { const p = start(data); Promise.resolve(p).finally(() => { $('making').hidden = true; }); } catch (e) { $('making').hidden = true; throw e; } };
  if (simTried) { setTimeout(go, 30); return; }
  // a worker only pays off with a core of its own: on a machine with one or two, the world stays here
  const q = typeof location !== 'undefined' ? location.search : '', cores = navigator.hardwareConcurrency || 4;
  simTried = true; const wantLocal = /[?&]local\b/.test(q) || window.FORMI_LOCAL || (cores <= 2 && !/[?&]worker\b/.test(q) && !window.FORMI_WORKER);
  if (wantLocal) { setTimeout(go, 30); return; }
  openSim(onSim, 4000).then((sim) => { S.sim = sim; go(); }, () => go());
}
window.__f = { S, cam, start, ask: (q, a) => simAsk(q, a), load: (bytes) => loadBytes(bytes, readSave), useTool: (id, x, y) => TOOLS.find((t) => t.id === id).apply(S.w, { x, y }), setTool: (id) => setTool(TOOLS.find((t) => t.id === id)), setLens, setSpeed, tick, vitals: () => { for (const fn of hooks.vitals) fn(S.w, []); } };   /* tests can run the notebook and threads between ticks */
