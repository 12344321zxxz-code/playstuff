// The page: camera, input, tools, panels. The world itself lives in world.js and friends.
import { W, H, N, TPY, CW, CH, TAU, clamp, idx, wrapDx, wx } from './core.js';
import { makeWorld, tick, refreshWater, queueClimate, background, movePlates } from './world.js';
import { createRenderer, toScreen, toWorld, drawRivers } from './render.js';
import { sculpt, erodeBrush, weather, plant, burn, plateAt } from './powers.js';
import { describe } from './inspect.js';
import { coarse, sampleCoarse, derive } from './climate.js';

const $ = (id) => document.getElementById(id);
const glc = $('gl'), ov = $('ov'), ctx = ov.getContext('2d'), jar = $('jar');
let R = null; try { R = createRenderer(glc); } catch (e) { console.error(e); }
if (!R) $('nogl').hidden = false;

const cam = { x: W / 2, y: H / 2, z: 3, dpr: 1, w: 0, h: 0, minZ: 1 };
const pal = new Float32Array(96);
const S = { w: null, tool: null, brush: 5, lens: 0, speed: 2, acc: 0, last: 0, dirty: true, hover: null, press: null, hold: null, climT: 0, waterT: 0, sel: null, hudT: 0, hintT: 0, plateDrag: null, opt: {}, touched: false, ref: null, ghost: null, perf: { sim: 0, gl: 0, ov: 0, ticks: 0, frame: 16 }, q: 1, qT: 0, adapt: true };
const TPS = [0, 8, 32, 96];
const LENSES = [[0, 'Land'], [1, 'Heat'], [2, 'Rain'], [8, 'Wind'], [3, 'Soil'], [5, 'Height'], [4, 'Plates']];
const SEASONS = ['midwinter', 'late winter', 'spring', 'early summer', 'midsummer', 'late summer', 'autumn', 'early winter'];

const TOOLS = [
  { id: 'look', label: 'Look', group: 'Watch', kind: 'look', hint: 'Drag to move, scroll to zoom. Tap anything to read it.' },
  { id: 'raise', label: 'Raise', group: 'Land', kind: 'brush', hint: 'Hold to push land up. Raise the sea floor far enough and an island appears.' },
  { id: 'lower', label: 'Lower', group: 'Land', kind: 'brush', hint: 'Hold to press land down. Below the waterline, the sea comes in.' },
  { id: 'ridge', label: 'Ridge', group: 'Land', kind: 'brush', move: true, hint: 'Drag a line and a mountain range follows it. Watch what it does to the rain.' },
  { id: 'trench', label: 'Trench', group: 'Land', kind: 'brush', move: true, hint: 'Drag a line to cut a canyon, a rift or a strait.' },
  { id: 'flatten', label: 'Level', group: 'Land', kind: 'brush', hint: 'Hold and drag to level the ground to the height where you started.' },
  { id: 'smooth', label: 'Smooth', group: 'Land', kind: 'brush', hint: 'Hold to soften rough ground.' },
  { id: 'erode', label: 'Erode', group: 'Land', kind: 'brush', hint: 'Hold to let water work: channels deepen and steep faces slump.' },
  { id: 'plates', label: 'Plates', group: 'Land', kind: 'plates', hint: 'Drag a plate’s arrow to change its drift. Tap a plate to flip it between land and ocean floor.' },
  { id: 'rain', label: 'Rain', group: 'Sky', kind: 'brush', hint: 'Hold to make a place wetter. It lasts for generations, then fades.' },
  { id: 'dry', label: 'Drought', group: 'Sky', kind: 'brush', hint: 'Hold to take the rain away.' },
  { id: 'forest', label: 'Forest', group: 'Life', kind: 'brush', hint: 'Drag to plant woods. They only last where the land suits them.' },
  { id: 'fire', label: 'Fire', group: 'Wrath', kind: 'brush', move: true, small: true, hint: 'Set the land alight. Dry seasons carry it far.' },
];
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
function setLens(id) { S.lens = id; for (const b of document.querySelectorAll('[data-lens]')) b.setAttribute('aria-pressed', +b.dataset.lens === id); S.dirty = true; }
function setSpeed(v) { S.speed = v; for (let k = 0; k < 4; k++) $('sp' + k).setAttribute('aria-pressed', k === v); }
function setBrush(r) { S.brush = r; for (const b of document.querySelectorAll('[data-brush]')) b.setAttribute('aria-pressed', +b.dataset.brush === r); }

function applyTool(p, first) {
  const w = S.w, t = S.tool, r = t.small ? Math.min(S.brush, 3) : S.brush, st = S.press.st; let ok = true;
  switch (t.id) {
    case 'raise': case 'lower': case 'ridge': case 'trench': case 'flatten': case 'smooth': ok = sculpt(w, t.id, p.x, p.y, t.id === 'ridge' || t.id === 'trench' ? Math.max(2, Math.round(r * 0.7)) : r, st); break;
    case 'erode': ok = erodeBrush(w, p.x, p.y, r); break;
    case 'rain': case 'dry': ok = weather(w, t.id, p.x, p.y, r); break;
    case 'forest': ok = plant(w, p.x, p.y, r); break;
    case 'fire': ok = burn(w, p.x, p.y, Math.min(r, 2)); break;
    default: if (t.apply) ok = t.apply(w, p, first, r, st, S.opt[t.id] || 0);
  }
  S.dirty = true; if (!ok && first) hint(t.miss || 'Nothing happens there.');
  if (w.edited || w.need.climate) S.touched = true;
}
function finishEdit() {
  const w = S.w;
  if (w.need.derive) { derive(w); w.need.derive = false; }
  if (w.edited) { w.edited = false; refreshWater(w); S.climT = performance.now() + 500; }
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
    if (pts.size === 2) { const q = [...pts.values()]; S.pinch = Math.hypot(q[0].sx - q[1].sx, q[0].sy - q[1].sy); if (S.press && !S.press.pan) finishEdit(); S.press = { pan: true, sx: (q[0].sx + q[1].sx) / 2, sy: (q[0].sy + q[1].sy) / 2, moved: 99 }; return; }
    const t = S.tool, w = S.w;
    if (e.button === 1 || e.button === 2 || t.kind === 'look' || e.shiftKey) { S.press = { pan: true, sx: p.sx, sy: p.sy, moved: 0, start: p }; ov.style.cursor = 'grabbing'; return; }
    if (t.kind === 'plates') {
      let best = null, bd = 14 / cam.z + 2.5;
      for (const pl of w.plates) { const hd = plateHandle(pl), d = Math.hypot(wrapDx(hd.x - p.x), hd.y - p.y); if (d < bd) { bd = d; best = pl; } }
      S.press = { pan: false, plate: best, start: p, moved: 0, st: {} }; return;
    }
    const yy = clamp(Math.round(p.y), 0, H - 1);
    S.press = { pan: false, last: p, st: { level: w.h[idx(Math.round(p.x), yy)], power: 1 }, moved: 0 };
    applyTool(p, true);
    if (t.kind === 'brush' && !t.move) S.hold = setInterval(() => { if (S.press && !S.press.pan && S.hover) applyTool(S.hover, false); }, 70);
  });
  ov.addEventListener('pointermove', (e) => {
    const p = evp(e), was = pts.get(e.pointerId); S.hover = p;
    if (was) pts.set(e.pointerId, p);
    if (pts.size === 2 && was) { const q = [...pts.values()], d = Math.hypot(q[0].sx - q[1].sx, q[0].sy - q[1].sy), mx = (q[0].sx + q[1].sx) / 2, my = (q[0].sy + q[1].sy) / 2; if (S.pinch > 0) zoomAt(mx, my, d / S.pinch); S.pinch = d; if (S.press) { cam.x -= (mx - S.press.sx) / cam.z; cam.y -= (my - S.press.sy) / cam.z; S.press.sx = mx; S.press.sy = my; clampCam(); } return; }
    const pr = S.press; if (!pr) return;
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
      if (pr.plate && pr.moved > 2) { movePlates(w); hint('The plates shift.'); }
      else if (pr.moved <= 2) { const pl = plateAt(w, p.x, p.y); pl.land = !pl.land; movePlates(w); hint(pl.land ? 'Ocean floor rises into a continent.' : 'A continent sinks beneath the sea.'); }
      S.dirty = true; return;
    }
    if (S.tool.up) S.tool.up(S.w, p, pr.st);
    finishEdit();
  };
  ov.addEventListener('pointerup', up); ov.addEventListener('pointercancel', up);
  ov.addEventListener('pointerleave', () => { if (!S.press) S.hover = null; });
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

/* ---------- panels ---------- */
function look(p) { const info = describe(S.w, p.x, p.y); S.sel = info && info.follow ? info.follow : null; showInfo(info); }
export function showInfo(info) {
  const box = $('inspect'); box.textContent = '';
  if (!info) { const el = document.createElement('p'); el.className = 'muted'; el.textContent = 'Pick Look and tap anything on the map to read it.'; box.appendChild(el); return; }
  const h = document.createElement('h3'); if (info.color) { const d = document.createElement('span'); d.className = 'chip'; d.style.background = info.color; h.appendChild(d); } h.appendChild(document.createTextNode(info.title)); box.appendChild(h);
  for (const l of info.lines) { const el = document.createElement('p'); el.textContent = l; box.appendChild(el); }
}
function vitals() {
  const w = S.w; let land = 0, forest = 0, ice = 0, desert = 0, grass = 0;
  for (let i = 0; i < N; i += 3) { if (w.water[i] === 1) continue; land++; if (w.ice[i]) ice++; else if (w.t[i] > 0.5) forest++; else if (w.mi[i] < 0.2) desert++; else if (w.g[i] > 0.4) grass++; }
  const rows = [['Forest', Math.round((forest / land) * 100) + '%'], ['Grass', Math.round((grass / land) * 100) + '%'], ['Desert', Math.round((desert / land) * 100) + '%'], ['Ice', Math.round((ice / land) * 100) + '%']];
  for (const fn of hooks.vitals) fn(w, rows);
  const box = $('vitals'); box.textContent = '';
  for (const [k, v] of rows) { const d = document.createElement('div'); d.className = 'vit'; const a = document.createElement('span'); a.className = 'lab'; a.textContent = k; const b = document.createElement('span'); b.className = 'num'; b.textContent = v; d.append(a, b); box.appendChild(d); }
  $('yr').textContent = w.year; $('season').textContent = SEASONS[Math.floor(w.phase * 8) % 8];
}
function dials() {
  const w = S.w, P = w.params, touch = () => { S.climT = performance.now() + 350; S.dirty = true; S.touched = true; labels(); };
  const labels = () => {
    $('o-sun').textContent = P.sun === 0 ? 'as it is' : (P.sun > 0 ? '+' : '') + P.sun + '°';
    $('o-tilt').textContent = P.tilt < 4 ? 'none' : P.tilt < 16 ? 'gentle' : P.tilt < 30 ? 'mild' : P.tilt < 38 ? 'harsh' : 'savage';
    $('o-sea').textContent = Math.abs(P.seaDial) < 0.003 ? 'as it is' : P.seaDial > 0 ? 'risen' : 'fallen';
    $('d-spin').textContent = P.spin > 0 ? 'Eastward' : 'Westward';
    $('o-mood').textContent = P.mood < 0.15 ? 'steady' : P.mood < 0.7 ? 'mild' : P.mood < 1.3 ? 'fickle' : 'wild';
  };
  $('d-mood').oninput = (e) => { P.mood = +e.target.value; labels(); };
  $('d-sun').oninput = (e) => { P.sun = +e.target.value; touch(); };
  $('d-tilt').oninput = (e) => { P.tilt = +e.target.value; touch(); };
  $('d-sea').oninput = (e) => { P.seaDial = +e.target.value; P.sea = P.seaDial + w.seaAuto; w.stamp.land++; refreshWater(w); touch(); };
  $('d-spin').onclick = () => { P.spin = -P.spin; touch(); };
  $('d-sun').value = P.sun; $('d-tilt').value = P.tilt; $('d-sea').value = P.seaDial; $('d-mood').value = P.mood; labels();
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
  if (S.lens !== 4 && S.lens !== 5) drawRivers(ctx, w, cam);
  for (const fn of hooks.overlay) fn(ctx, w, cam, S, now);
  if (S.lens === 8) drawWind();
  if (S.lens === 4) drawPlates();
  const t = S.tool;
  if (S.hover && t.kind !== 'look' && t.kind !== 'plates') { const r = t.kind === 'brush' ? (t.small ? Math.min(S.brush, 3) : S.brush) + 0.5 : t.radius || 0.8; toScreen(cam, S.hover.x, S.hover.y, A); ctx.beginPath(); ctx.arc(A[0], A[1], r * cam.z * cam.dpr, 0, TAU); ctx.lineWidth = 3 * cam.dpr; ctx.strokeStyle = 'rgba(16,20,24,.55)'; ctx.stroke(); ctx.lineWidth = 1.3 * cam.dpr; ctx.strokeStyle = '#fff'; ctx.stroke(); }
}

/* ---------- loop ---------- */
function frame(now) {
  const raw = now - S.last, dt = Math.min(0.1, raw / 1000); S.last = now; const w = S.w, P = S.perf, t0 = performance.now(); let ran = 0;
  // a slow graphics card gets a coarser terrain rather than a slideshow
  if (raw < 400) P.frame += (raw - P.frame) * 0.06;
  if (S.adapt && now > S.qT) { S.qT = now + 2500; if (P.frame > 36 && P.sim < P.frame * 0.5 && S.q > 0.5) { S.q = Math.max(0.5, S.q * 0.8); P.frame = 20; fit(); } }
  if (S.speed && !(S.press && !S.press.pan)) { S.acc += dt * TPS[S.speed]; while (S.acc >= 1 && ran < 10 && performance.now() - t0 < 12) { tick(w); for (const fn of hooks.tick) fn(w); S.acc -= 1; ran++; } if (ran) S.dirty = true; if (S.acc > 3) S.acc = 0; }
  if (S.climT && now > S.climT && !S.press) { S.climT = 0; queueClimate(w); }
  if (!ran && w.job && !(S.press && !S.press.pan)) { const st = w.stamp.land; background(w, 8); if (w.stamp.land !== st) S.dirty = true; }
  const t1 = performance.now(); P.sim += (t1 - t0 - P.sim) * 0.05; P.ticks += (ran - P.ticks) * 0.05;
  if (S.press && !S.press.pan && w.need.water && now > S.waterT) { S.waterT = now + 320; refreshWater(w); }
  climateWatch(now);
  if (R) { if (S.dirty) { R.upload(w, S.lens); S.dirty = false; } R.draw(w, cam, S.lens === 8 ? 0 : S.lens, now / 1000, pal, S.q); }
  const t2 = performance.now(); overlay(now); const t3 = performance.now(); P.gl += (t2 - t1 - P.gl) * 0.05; P.ov += (t3 - t2 - P.ov) * 0.05;
  if (now - S.hudT > 500) { S.hudT = now; vitals(); if (S.sel && S.sel.info) { const inf = S.sel.info(); if (inf) showInfo(inf); else { S.sel = null; } } }
  requestAnimationFrame(frame);
}

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
  bindInput();
  if (window.ResizeObserver) new ResizeObserver(fit).observe(jar); window.addEventListener('resize', fit);
}
export const addLens = (id, label) => LENSES.push([id, label]);
let built = false;
export function start(data) {
  const seed = data && data.seed != null ? data.seed : (Math.random() * 1e9) | 0;
  S.w = makeWorld(seed); S.sel = null; S.acc = 0; S.dirty = true;
  for (const fn of hooks.newWorld) fn(S.w);
  if (!built) { built = true; buildUI(); fit(); setTool(TOOLS[0]); setLens(0); setBrush(5); if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) S.speed = 1; setSpeed(S.speed); S.last = performance.now(); requestAnimationFrame(frame); }
  cam.x = W / 2; cam.y = H / 2; cam.z = cam.fitZ || cam.minZ; clampCam(); dials(); showInfo(null); vitals();
}
// Making a world takes a second or two; say so first.
export function startSoon(data) { $('making').hidden = false; setTimeout(() => { try { start(data); } finally { $('making').hidden = true; } }, 30); }
window.__f = { S, cam, start, setTool: (id) => setTool(TOOLS.find((t) => t.id === id)), setLens, setSpeed, tick };
