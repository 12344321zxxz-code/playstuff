// The page: boots the atlas, talks to the world, and turns the pointer and keys into looking,
// moving, and the god's powers.
import { W, H, N, CW, CH } from '../sim/core';
import { COLORS } from '../sim/people';
import { FAITH_COLORS } from '../sim/faith';
import { TOOLS, ToolDef, LENSES, SEASONS, toolById } from '../shared/tools';
import { connect, Client } from './client';
import { emptyMirror, buildPeaks, Mirror } from './state';
import { createTerrain } from './gl/terrain';
import { createGlyphs, GlyphList } from './gl/glyphs';
import { createLines, riverLines, roadLines } from './gl/lines';
import { paintAtlas } from './art/sprites';
import { buildScene, Label, Cam } from './scene';
import { drawOverlay, Fx } from './overlay';
import { createRadial, ICON } from './radial';
import { createBook, linkText } from './book';
import { createAudio } from './audio';
import { compassSVG } from './compass';

const $ = (id: string) => document.getElementById(id)!;
const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
// muted, hand-colouring versions of the peoples' colours for the realm bands
const soft = (hex: string, k = 0.78) => { const n = parseInt(hex.slice(1), 16); const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; const mix = (v: number, p: number) => Math.round(v * k + p * (1 - k)); return '#' + [mix(r, 236), mix(g, 222), mix(b, 190)].map((v) => v.toString(16).padStart(2, '0')).join(''); };

const glc = $('gl') as HTMLCanvasElement, ov = $('ov') as HTMLCanvasElement, octx = ov.getContext('2d')!;
const gl = glc.getContext('webgl2', { antialias: true, alpha: false, premultipliedAlpha: true }) as WebGL2RenderingContext;
const M: Mirror = emptyMirror();
const cam: Cam & { tx?: number; ty?: number; tz?: number } = { x: W / 2, y: H / 2, z: 3, dpr: 1, vw: 0, vh: 0 };
const S = { tool: null as ToolDef | null, brush: 5, opt: {} as Record<string, number>, lens: 0, speed: 2, press: null as any, hover: null as any, sel: null as any, selPos: null as any, labelHits: [] as any[], still, cursor: null as any, events: [] as any[], fx: [] as Fx[], lastShake: 0, frames: 0, q: 1, ft: 16, qT: 0 };
const audio = createAudio();
let client: Client, terrain: ReturnType<typeof createTerrain>, glyphs: ReturnType<typeof createGlyphs>, lines: ReturnType<typeof createLines>, atlas: ReturnType<typeof paintAtlas>;
const G = new GlyphList(), labels: Label[] = [];
let pendingAck: ArrayBuffer | null = null, riversDirty = false, roadsDirty = false, lastRiverZoomBand = -1;

/* ---------- boot ---------- */
async function boot() {
  if (!gl) { $('nogl').hidden = false; return; }
  try { await Promise.race([Promise.all([(document as any).fonts.load('20px "IM Fell English"'), (document as any).fonts.load('italic 20px "IM Fell English"'), (document as any).fonts.load('20px "IM Fell English SC"'), (document as any).fonts.load('16px "EB Garamond"')]), new Promise((r) => setTimeout(r, 2500))]); } catch (_) {}
  atlas = paintAtlas();
  terrain = createTerrain(gl); glyphs = createGlyphs(gl, atlas.canvas); lines = createLines(gl);
  terrain.setPalette(COLORS.map((c) => soft(c)), FAITH_COLORS.map((c) => soft(c, 0.85)));
  $('compass').innerHTML = compassSVG();
  buildUI(); fit(); window.addEventListener('resize', fit);
  $('making').hidden = false; $('making-s').textContent = 'raising the land, filling the seas';
  client = await connect(onMsg);
  const hot = (window as any).claude && (window as any).claude.hot;
  const data = hot && hot.data ? hot.data : {};
  if (hot && hot.snapshot) hot.snapshot(() => ({ seed: M.seed, template: M.template }));
  client.send({ t: 'new', seed: data.seed != null ? data.seed : (Math.random() * 1e9) | 0, template: data.template || 'continent' });
  setSpeed(2);
  requestAnimationFrame(frame);
}

/* ---------- from the world ---------- */
let worldT = 0;
function onMsg(m: any) {
  if (m.t === 'world') {
    Object.assign(M, { ready: false, seed: m.seed, template: m.template, name: m.name, species: m.species || [] }); S.events = []; S.sel = null; S.selPos = null; hideCard();
    $('wname').textContent = m.name; $('making').hidden = true; worldT = performance.now();
    cam.x = W / 2; cam.y = H / 2; cam.z = fitZ(); delete cam.tz; book.resetDials(); book.render();
    if (!m.loaded && !sessionSeen()) showWelcome();
    return;
  }
  if (m.t === 'frame') { onFrame(m); return; }
  if (m.t === 'say') { say(m.text); return; }
  if (m.t === 'error') { console.error(m.text); return; }
}
function onFrame(f: any) {
  M.year = f.year; M.phase = f.phase; M.tickN = f.tickN; M.tps = f.tps; M.sea = f.sea; M.solar = f.solar; M.stats = f.stats; M.frameAt = performance.now(); M.job = f.job;
  const tex = new Uint8Array(f.tex); M.fine = tex; terrain.fine(tex);
  if (f.land) { const L = f.land; M.h = L.h; M.water = L.water; M.river = L.river; M.down = L.down; M.ore = L.ore; M.plates = L.plates; M.plate = L.plate; terrain.land(L.h, L.water); buildPeaks(M); riversDirty = true; M.landStamp++; if (!M.ready) { M.ready = true; } }
  if (f.coarse) { M.coarse = f.coarse; terrain.coarse(f.coarse, M.water); M.coarseStamp++; }
  if (f.works) { M.works = f.works; terrain.works(f.works); }
  if (f.roads) { M.roads = f.roads; roadsDirty = true; }
  if (f.regions) { M.regions = f.regions; M.regStamp++; }
  M.ents = f.ents; M.cultById = new Map(f.ents.cults.map((c: any) => [c.id, c])); M.setById = new Map(f.ents.sets.map((s: any) => [s.id, s]));
  const now = performance.now(); for (const x of f.ents.fx) S.fx.push({ ...x, t0: now }); if (S.fx.length > 60) S.fx.splice(0, S.fx.length - 60);
  if (f.ev && f.ev.length) onEvents(f.ev);
  pendingAck = f.tex;
}
function onEvents(evs: any[]) {
  for (const e of evs) {
    if (e.page) { toast(e, true); audio.sting('found'); continue; }
    S.events.push(e);
    if (e.big) { toast(e, false); audio.sting(stingFor(e.text)); }
    else if (/go to war|at war|ride on|drags the/.test(e.text) && !e.minor) audio.sting('war');
  }
  if (S.events.length > 1500) S.events.splice(0, S.events.length - 1500);
  book.refreshChronicle();
}
function stingFor(t: string) {
  if (/war|falls to|sack|horde|ride/.test(t)) return 'war'; if (/city|wonder|rule from|raises/.test(t)) return 'city'; if (/faith|pray|prophet|priests/.test(t)) return 'faith';
  if (/slay|kills|dragon|beast|wakes in|lair/.test(t)) return 'beast'; if (/gone from the world|Fall|burns out|dead|famine|starve/.test(t)) return 'gone'; if (/star falls|sea comes|shakes|mountain opened|wave/.test(t)) return 'doom'; return 'hero';
}

/* ---------- camera ---------- */
function fitZ() { return Math.min(cam.vw / cam.dpr / (W + 24), cam.vh / cam.dpr / (H + 24)); }
function fit() {
  cam.dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth, h = window.innerHeight; cam.vw = Math.round(w * cam.dpr); cam.vh = Math.round(h * cam.dpr);
  ov.width = cam.vw; ov.height = cam.vh; glc.width = Math.round(cam.vw * S.q); glc.height = Math.round(cam.vh * S.q);
  clampCam();
}
function clampCam() { const mz = fitZ() * 0.9; cam.z = clamp(cam.z, mz, 64); cam.x = clamp(cam.x, 0, W); cam.y = clamp(cam.y, 0, H); }
const toWorld = (sx: number, sy: number) => ({ x: cam.x + (sx * cam.dpr - cam.vw / 2) / (cam.z * cam.dpr), y: cam.y + (sy * cam.dpr - cam.vh / 2) / (cam.z * cam.dpr) });
function zoomAt(sx: number, sy: number, f: number) { delete cam.tz; const a = toWorld(sx, sy); cam.z *= f; clampCam(); const b = toWorld(sx, sy); cam.x += a.x - b.x; cam.y += a.y - b.y; clampCam(); }
function fly(x: number, y: number, z?: number) { cam.tx = x; cam.ty = y; cam.tz = Math.max(cam.z, z || cam.z); }

/* ---------- tools ---------- */
function setTool(t: ToolDef | null) {
  S.tool = t; const name = t ? t.label : 'Look';
  $('power-name').textContent = name; $('power-hint').textContent = t ? t.hint : 'Drag to move, scroll to zoom. Click anything to read it. Right-click or press Q for your powers.';
  ($('power-ic') as HTMLElement).style.backgroundImage = `url(${atlas.icon(ICON[t ? t.id : 'look'] || 'star', 64)})`;
  ov.classList.toggle('tool', !!t);
  $('brush').hidden = !t || t.kind !== 'brush' && t.kind !== 'stroke';
  const o = $('opts'); o.textContent = ''; o.hidden = !t || !t.opts;
  if (t && t.opts) t.opts.forEach((l, k) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = l; b.setAttribute('aria-pressed', String((S.opt[t.id] || 0) === k)); b.addEventListener('click', () => { S.opt[t.id] = k; setTool(t); }); o.appendChild(b); });
  if (t && t.lens != null) setLens(t.lens); else if (S.lens === 4 || S.lens === 7) setLens(0);
}
function setLens(id: number) { S.lens = id; for (const b of document.querySelectorAll<HTMLElement>('[data-lens]')) b.setAttribute('aria-pressed', String(+b.dataset.lens! === id)); client && client.send({ t: 'lens', v: id }); }
function setSpeed(v: number) { S.speed = v; for (const b of document.querySelectorAll<HTMLElement>('[data-speed]')) b.setAttribute('aria-pressed', String(+b.dataset.speed! === v)); client && client.send({ t: 'speed', v }); }
function setBrush(r: number) { S.brush = r; for (const b of document.querySelectorAll<HTMLElement>('[data-brush]')) b.setAttribute('aria-pressed', String(+b.dataset.brush! === r)); }
const brushR = () => { const t = S.tool!; return t.kind === 'tap' ? (t.radius || 1) : t.small ? Math.min(S.brush, 3) : S.brush; };

/* ---------- input ---------- */
const pts = new Map<number, any>();
function evp(e: PointerEvent | MouseEvent) { const r = ov.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top, p = toWorld(sx, sy); return { sx, sy, x: p.x, y: p.y }; }
function bindInput() {
  ov.addEventListener('contextmenu', (e) => e.preventDefault());
  ov.addEventListener('pointerdown', (e) => {
    audio.unlock(); e.preventDefault(); try { ov.setPointerCapture(e.pointerId); } catch (_) {}
    const p = evp(e); pts.set(e.pointerId, p); S.hover = p;
    if (pts.size === 2) { const q = [...pts.values()]; S.press = { pan: true, pinch: Math.hypot(q[0].sx - q[1].sx, q[0].sy - q[1].sy), sx: (q[0].sx + q[1].sx) / 2, sy: (q[0].sy + q[1].sy) / 2, moved: 99 }; return; }
    const t = S.tool;
    if (e.button === 2) { S.press = { pan: true, sx: p.sx, sy: p.sy, moved: 0, right: true, start: p }; return; }
    if (e.button === 1 || !t || e.shiftKey) { S.press = { pan: true, sx: p.sx, sy: p.sy, moved: 0, start: p }; ov.style.cursor = 'grabbing'; return; }
    if (t.kind === 'plates') { let best = null, bd = 18 / cam.z + 2.5; for (const pl of M.plates) { const d = Math.hypot(pl.cx + pl.vx * 16 - p.x, pl.cy + pl.vy * 16 - p.y); if (d < bd) { bd = d; best = pl; } } S.press = { pan: false, plate: best, start: p, moved: 0 }; return; }
    S.press = { pan: false, last: p, moved: 0 };
    client.send({ t: 'down', tool: t.id, kind: t.kind, x: p.x, y: p.y, r: brushR(), opt: S.opt[t.id] || 0 });
    if (t.sfx) audio.sfx(t.sfx);
  });
  ov.addEventListener('pointermove', (e) => {
    const p = evp(e), was = pts.get(e.pointerId); S.hover = p; if (was) pts.set(e.pointerId, p);
    const pr = S.press;
    if (pts.size === 2 && was && pr) { const q = [...pts.values()], d = Math.hypot(q[0].sx - q[1].sx, q[0].sy - q[1].sy), mx = (q[0].sx + q[1].sx) / 2, my = (q[0].sy + q[1].sy) / 2; if (pr.pinch) zoomAt(mx, my, d / pr.pinch); pr.pinch = d; cam.x -= (mx - pr.sx) / cam.z; cam.y -= (my - pr.sy) / cam.z; pr.sx = mx; pr.sy = my; clampCam(); return; }
    if (!pr) { tipAt(p); return; }
    if (pr.pan) { const dx = p.sx - pr.sx, dy = p.sy - pr.sy; pr.moved += Math.abs(dx) + Math.abs(dy); if (pr.right && pr.moved < 6) return; delete cam.tx; cam.x -= dx / cam.z; cam.y -= dy / cam.z; pr.sx = p.sx; pr.sy = p.sy; clampCam(); return; }
    if (S.tool && S.tool.kind === 'plates') { pr.moved++; if (pr.plate) { const pl = pr.plate; pl.vx = clamp((p.x - pl.cx) / 16, -1.6, 1.6); pl.vy = clamp((p.y - pl.cy) / 16, -1.6, 1.6); client.send({ t: 'plate', k: pl.k, vx: pl.vx, vy: pl.vy }); } return; }
    pr.moved++; client.send({ t: 'move', x: p.x, y: p.y });
  });
  const up = (e: PointerEvent) => {
    const p = pts.get(e.pointerId); pts.delete(e.pointerId); const pr = S.press; S.press = null; ov.style.cursor = ''; if (!pr || !p) return;
    if (pr.pan) {
      if (pr.right && pr.moved < 6 && e.type === 'pointerup') { radial.open(p.sx, p.sy, S.tool ? S.tool.id : ''); return; }
      if (pr.moved < 6 && !S.tool && e.type === 'pointerup' && !pr.right) look(p);
      return;
    }
    if (S.tool && S.tool.kind === 'plates') { if (pr.plate && pr.moved > 2) client.send({ t: 'plates-done' }); else if (pr.moved <= 2) client.send({ t: 'plate-flip', x: p.x, y: p.y }); audio.sfx('rumble'); return; }
    client.send({ t: 'up' });
  };
  ov.addEventListener('pointerup', up); ov.addEventListener('pointercancel', up);
  ov.addEventListener('pointerleave', () => { if (!S.press) { S.hover = null; $('tip').hidden = true; } });
  ov.addEventListener('wheel', (e) => { e.preventDefault(); const r = ov.getBoundingClientRect(); if (e.altKey && S.tool) { setBrush(clamp(S.brush + (e.deltaY < 0 ? 1 : -1), 1, 20)); return; } zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * (e.deltaMode ? 0.05 : 0.0016))); }, { passive: false });
  window.addEventListener('keydown', (e) => {
    const tg = e.target as HTMLElement; if (tg.closest && tg.closest('input,textarea,select')) return; const k = e.key, st = 60 / cam.z;
    audio.unlock();
    if (k === 'ArrowLeft' || k === 'a') cam.x -= st; else if (k === 'ArrowRight' || k === 'd') cam.x += st; else if (k === 'ArrowUp' || k === 'w') cam.y -= st; else if (k === 'ArrowDown' || k === 's') cam.y += st;
    else if (k === '+' || k === '=') zoomAt(window.innerWidth / 2, window.innerHeight / 2, 1.3); else if (k === '-') zoomAt(window.innerWidth / 2, window.innerHeight / 2, 1 / 1.3);
    else if (k === ' ') setSpeed(S.speed ? 0 : 2); else if (k >= '0' && k <= '4') setSpeed(+k);
    else if (k === 'q' || k === 'Q') { const h = S.hover || { sx: window.innerWidth / 2, sy: window.innerHeight / 2 }; radial.isOpen ? radial.close() : radial.open(h.sx, h.sy, S.tool ? S.tool.id : ''); }
    else if (k === 'Escape') { if (radial.isOpen) radial.close(); else if (!$('card').hidden) hideCard(); else if (book.tab) book.setTab(''); else setTool(null); }
    else if (k === '[') setBrush(clamp(S.brush - 1, 1, 20)); else if (k === ']') setBrush(clamp(S.brush + 1, 1, 20));
    else if (k === 'm' || k === 'M') toggleMute();
    else if (k === 'c' || k === 'C') book.setTab(book.tab === 'chronicle' ? '' : 'chronicle'); else if (k === 'l' || k === 'L') book.setTab(book.tab === 'legends' ? '' : 'legends');
    else return;
    e.preventDefault(); clampCam();
  });
}
let tipT = 0;
function tipAt(p: any) {
  const tip = $('tip'); S.cursor = S.tool && S.tool.kind !== 'plates' ? { x: p.x, y: p.y, r: brushR() } : null;
  const now = performance.now(); if (now - tipT < 60) return; tipT = now;
  // a label under the pointer names itself
  const sx = p.sx * cam.dpr, sy = p.sy * cam.dpr; const hitL = S.labelHits.find(([b]) => sx >= b[0] && sx <= b[2] && sy >= b[1] && sy <= b[3]);
  ov.style.cursor = hitL && !S.tool ? 'pointer' : '';
  tip.hidden = true;
}
async function look(p: any) {
  const sx = p.sx * cam.dpr, sy = p.sy * cam.dpr; const hitL = S.labelHits.find(([b]) => sx >= b[0] && sx <= b[2] && sy >= b[1] && sy <= b[3]);
  if (hitL && hitL[1][0] !== 's') { book.openLegend(hitL[1]); return; }
  const info = await client.ask({ t: 'look', x: p.x, y: p.y, z: cam.z }); showCard(info, p);
}

/* ---------- the card ---------- */
function showCard(info: any, p: any) {
  const card = $('card'); card.textContent = ''; if (!info) { hideCard(); return; }
  S.sel = info.follow || null;
  const x = document.createElement('button'); x.className = 'icon x'; x.textContent = '×'; x.setAttribute('aria-label', 'Close'); x.addEventListener('click', hideCard); card.appendChild(x);
  const h = document.createElement('h3'); if (info.color) { const c = document.createElement('span'); c.className = 'chip'; c.style.background = info.color; h.appendChild(c); } h.append(info.title); card.appendChild(h);
  if (info.sub) { const s = document.createElement('p'); s.className = 'sub'; s.textContent = info.sub; card.appendChild(s); }
  if (info.bar) { const bar = document.createElement('div'); bar.className = 'fbar'; const key = document.createElement('div'); key.className = 'fkey'; for (const [v, col, lab] of info.bar) { if (v < 0.03) continue; const i = document.createElement('i'); i.style.flex = String(v); i.style.background = col; bar.appendChild(i); if (v >= 0.1) { const k = document.createElement('span'); const d = document.createElement('i'); d.style.background = col; k.append(d, `${lab} ${Math.round(v * 100)}%`); key.appendChild(k); } } card.append(bar, key); }
  const split = info.split || 0; (info.lines || []).forEach((l: string, k: number) => { if (k === split && split) { const pp = document.createElement('p'); pp.className = 'part'; pp.textContent = info.splitTitle || ''; card.appendChild(pp); if (k >= split + 2) return; } if (split && k > split + 2) return; const e = document.createElement('p'); e.textContent = l; card.appendChild(e); });
  const acts = document.createElement('div'); acts.className = 'acts';
  const btn = (label: string, cls: string, fn: () => void) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.className = cls; b.addEventListener('click', fn); acts.appendChild(b); };
  if (info.ref) btn('Its legend', '', () => book.openLegend(info.ref));
  if (info.people) btn('Their people', '', () => book.openLegend(info.people));
  if (info.ref && info.ref[0] === 'p') { const id = +info.ref.slice(1); for (const [how, l] of [['bless', 'Bless'], ['curse', 'Curse'], ['vision', 'Vision']]) btn(l, how, async () => { const r = await client.ask({ t: 'nudge', id, how }); audio.sfx(how === 'curse' ? 'thunder' : 'magic'); say(r); hideCard(); }); }
  if (acts.childElementCount) card.appendChild(acts);
  card.hidden = false; const r = card.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
  let left = p.sx + 22, top = p.sy - 30; if (left + r.width > vw - 12) left = p.sx - r.width - 22; if (top + r.height > vh - 100) top = vh - 100 - r.height; card.style.left = Math.max(12, left) + 'px'; card.style.top = Math.max(150, top) + 'px';
  audio.sfx('page');
}
function hideCard() { $('card').hidden = true; S.sel = null; S.selPos = null; }
function selPos() {
  const f = S.sel; if (!f) { S.selPos = null; return; } const [kind, id] = f, E = M.ents;
  const o = kind === 'set' ? M.setById.get(id) : kind === 'mover' ? E.movers.find((q: any) => q.id === id) : kind === 'beast' ? E.beasts.find((q: any) => q.id === id) : null;
  S.selPos = o ? [o.x, o.y, kind === 'set' ? (o.R || 2) * 0.6 + 1 : 2] : null;
}

/* ---------- headlines and lines ---------- */
let sayT = 0;
function say(t: string) { if (!t) return; const el = $('say'); el.textContent = t; el.classList.add('on'); clearTimeout(sayT); sayT = window.setTimeout(() => el.classList.remove('on'), 3200); }
(window as any).__say = say;
function toast(e: any, page: boolean) {
  const box = $('toasts'); while (box.children.length >= 3) box.firstChild!.remove();
  const b = document.createElement('div'); b.className = 'toast'; b.setAttribute('role', 'status');
  const y = document.createElement('span'); y.className = 'y'; y.textContent = page ? 'Almanac' : String(e.year); b.append(y, page ? document.createTextNode(e.text.replace(/^Almanac: /, 'A new page: ')) : linkText(e, (r) => book.openLegend(r)));
  if (e.x != null) { b.style.cursor = 'pointer'; b.addEventListener('click', () => fly(e.x + 0.5, e.y + 0.5, 6)); }
  box.appendChild(b); setTimeout(() => { b.classList.add('out'); setTimeout(() => b.remove(), 700); }, page ? 5000 : 8000);
}

/* ---------- the loop ---------- */
let last = performance.now(), hudT = 0;
function frame(now: number) {
  requestAnimationFrame(frame); const raw = now - last, dt = Math.min(0.1, raw / 1000); last = now;
  // a slow graphics card gets a coarser map rather than a slideshow
  if (raw < 500) S.ft += (raw - S.ft) * 0.05;
  if (now > S.qT) { if (S.ft > 34 && S.q > 0.5) { S.q = Math.max(0.5, S.q * 0.85); S.ft = 22; S.qT = now + 2500; fit(); } else if (S.ft < 17 && S.q < 1) { S.q = Math.min(1, S.q * 1.08); S.qT = now + 8000; fit(); } else S.qT = now + 1500; }
  if (cam.tz != null) { const k = 1 - Math.pow(0.002, dt); cam.x += (cam.tx! - cam.x) * k; cam.y += (cam.ty! - cam.y) * k; cam.z += (cam.tz - cam.z) * k; if (Math.abs(cam.z - cam.tz) < 0.01 && Math.abs(cam.x - cam.tx!) < 0.05) delete cam.tz; clampCam(); }
  if (!M.ready) return;
  if (riversDirty || Math.floor(Math.min(cam.z, 7) / 3.5) !== lastRiverZoomBand) { lastRiverZoomBand = Math.floor(Math.min(cam.z, 7) / 3.5); lines.set('rivers', riverLines(M.river, M.down, M.water, cam.z > 3.5 ? 1 : 2)); riversDirty = false; }
  if (roadsDirty) { lines.set('roads', roadLines(M.roads)); roadsDirty = false; }
  gl.viewport(0, 0, glc.width, glc.height);
  const sh = S.lastShake > 0.02 && !still ? S.lastShake : 0, sx = sh ? Math.sin(now * 0.09) * 0.5 * sh / cam.z * 6 : 0, sy = sh ? Math.cos(now * 0.11) * 0.4 * sh / cam.z * 6 : 0;
  const c2 = { ...cam, x: cam.x + sx, y: cam.y + sy }, gw = glc.width, gh = glc.height, g2 = { ...c2, dpr: cam.dpr * (gw / cam.vw), vw: gw, vh: gh };
  terrain.draw(g2, gw, gh, { sea: M.sea, time: now / 1000, phase: M.phase, lens: S.lens === 8 ? 0 : S.lens, solar: M.solar });
  const bare = S.lens === 4 || S.lens === 5;
  if (!bare) {
    if (cam.z < 7) lines.draw('roads', g2, gw, gh, [0.33, 0.22, 0.14, 0.75], -0.2, 5, clamp((cam.z - 1.8) / 1.5, 0, 1));
    else { lines.draw('roads', g2, gw, gh, [0.36, 0.25, 0.16, 0.5], 1.2); lines.draw('roads', g2, gw, gh, [0.86, 0.77, 0.58, 0.95], 0); }
    lines.draw('rivers', g2, gw, gh, [0.17, 0.27, 0.32, 0.8], 1.3);
    lines.draw('rivers', g2, gw, gh, [0.42, 0.62, 0.72, 1], 0);
  }
  selPos();
  buildScene(M, g2, G, labels, now, { lens: S.lens, sel: S.sel });
  glyphs.draw(G.sorted(), G.n, g2, gw, gh);
  S.fx = S.fx.filter((f) => now - f.t0 < f.T * 1000);
  S.lastShake = drawOverlay(octx, M, c2, labels, S.fx, now, { lens: S.lens, selPos: S.selPos, cursor: S.tool ? S.cursor : null, still, set labelHits(v: any) { S.labelHits = v; }, get labelHits() { return S.labelHits; } });
  if (pendingAck) { client.send({ t: 'ack', buf: pendingAck }, [pendingAck]); pendingAck = null; }
  if (now - hudT > 400) { hudT = now; hud(); }
}
function hud() {
  $('yr').textContent = 'Year ' + M.year; $('season').textContent = SEASONS[Math.floor(M.phase * 8) % 8];
  const st = M.stats || {}, plague = M.ents.sets.filter((s: any) => s.plague).length;
  const age = M.solar < -2.2 ? 'An age of ice' : M.solar > 2.2 ? 'A long warm age' : plague > 12 ? 'The plague years' : (st.wars || 0) >= 3 ? 'An age of wars' : (st.people || 0) > 60000 ? 'A crowded age' : '';
  $('age').textContent = age;
  // what the world sounds like from here
  const x0 = Math.max(0, Math.floor(cam.x - cam.vw / cam.dpr / cam.z / 2)), x1 = Math.min(W - 1, Math.ceil(cam.x + cam.vw / cam.dpr / cam.z / 2)), y0 = Math.max(0, Math.floor(cam.y - cam.vh / cam.dpr / cam.z / 2)), y1 = Math.min(H - 1, Math.ceil(cam.y + cam.vh / cam.dpr / cam.z / 2));
  let sea = 0, forest = 0, n = 0, high = 0, fire = 0, step = Math.max(1, Math.floor((x1 - x0) / 40));
  for (let y = y0; y <= y1; y += step) for (let x = x0; x <= x1; x += step) { const i = y * W + x; n++; if (M.water[i] === 1) sea++; else { if (M.fine[i * 4 + 3] > 128) forest++; if (M.h[i] - M.sea > 0.35) high++; if (M.fine[N * 8 + i * 4 + 1] & 4) fire++; } }
  let town = 0; for (const s of M.ents.sets) if (!s.nomad && s.x >= x0 && s.x <= x1 && s.y >= y0 && s.y <= y1) town += s.tier;
  const storm = M.ents.storms.some((s: any) => s.x >= x0 - 8 && s.x <= x1 + 8 && s.y >= y0 - 8 && s.y <= y1 + 8) ? 1 : 0;
  audio.setView({ sea: n ? sea / n : 0, forest: n ? forest / n : 0, high: n ? high / n : 0, fire: Math.min(1, fire / 4), town: Math.min(1, town / 6), zoom: cam.z, storm, winter: M.phase < 0.2 || M.phase > 0.9 });
  audio.setMood({ war: st.wars || 0, plague: plague > 8, cold: M.solar < -2, golden: (st.people || 0) > 40000 && (st.wars || 0) === 0, people: st.people || 0 });
  // scale bar: one league is about 4 cells wide here, by the map's own reckoning
  const px = 100, cells = px / cam.z, leagues = niceNum(cells * 4); const bw = (leagues / 4) * cam.z; ($('scale').firstElementChild as HTMLElement).style.width = bw + 'px'; $('scale-l').textContent = leagues + ' leagues';
}
const niceNum = (v: number) => { const p = Math.pow(10, Math.floor(Math.log10(v))), f = v / p; return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p; };

/* ---------- saving ---------- */
const DB = 'formicarium2';
function idb(): Promise<IDBDatabase> { return new Promise((res, rej) => { try { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore('worlds'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } }); }
async function slots(): Promise<any[]> { try { const db = await idb(); return await new Promise((res) => { const out: any[] = []; const tx = db.transaction('worlds', 'readonly'), st = tx.objectStore('worlds'); const c = st.openCursor(); c.onsuccess = () => { const cur = c.result; if (cur) { const v = cur.value; out.push({ key: cur.key, name: v.name, year: v.year, at: v.at }); cur.continue(); } else res(out.sort((a, b) => b.at - a.at)); }; c.onerror = () => res(out); }); } catch (_) { return []; } }
async function save() {
  say('Saving…'); const data: ArrayBuffer = await client.ask({ t: 'save' }); if (!data) return;
  try { const db = await idb(); const key = M.name + ' · ' + M.seed; await new Promise((res, rej) => { const tx = db.transaction('worlds', 'readwrite'); tx.objectStore('worlds').put({ name: M.name, year: M.year, at: Date.now(), data }, key); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); say(`Saved in this browser: ${M.name}, year ${M.year}.`); book.render(); }
  catch (e) { say('This browser will not keep saved worlds here.'); }
}
async function load(key?: string) {
  const list = await slots(); const k = key || (list[0] && list[0].key); if (!k) { say('No saved worlds yet.'); return; }
  try { const db = await idb(); const v: any = await new Promise((res, rej) => { const r = db.transaction('worlds', 'readonly').objectStore('worlds').get(k); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); if (!v) return; $('making').hidden = false; $('making-s').textContent = 'unrolling ' + v.name; client.send({ t: 'load', data: v.data }); }
  catch (_) { say('That world could not be opened.'); }
}
function loadFile() { const inp = $('loadfile') as HTMLInputElement; inp.value = ''; inp.click(); }

/* ---------- the rest of the furniture ---------- */
function toggleMute() { audio.mute(!audio.muted); $('mute').setAttribute('aria-pressed', String(audio.muted)); try { localStorage.setItem('f2-mute', audio.muted ? '1' : '0'); } catch (_) {} }
const sessionSeen = () => { try { return localStorage.getItem('f2-welcome') === '1'; } catch (_) { return false; } };
function showWelcome() {
  const w = $('welcome'); w.innerHTML = `<h2>Formicarium</h2><p class="sub">A continent of your own. Peoples rise and fall on it, beasts make their lairs, faiths are born. You can watch, or you can meddle.</p>
  <ul><li>Drag to move; scroll to zoom in until you can see the houses.</li><li><b>Right-click</b> or press <kbd>Q</kbd> for your powers: Land, Sky, Life, Wrath, the Other world.</li><li>Click anything to read it. Names in the book open their legends.</li><li><kbd>Space</kbd> pauses; <kbd>1</kbd>–<kbd>4</kbd> set the pace; <kbd>M</kbd> mutes.</li></ul>
  <div class="row"><button type="button" class="btn" id="wgo">Begin</button></div>`;
  w.hidden = false; $('wgo').addEventListener('click', () => { w.hidden = true; audio.unlock(); try { localStorage.setItem('f2-welcome', '1'); } catch (_) {} });
}
const radial = createRadial($('radial'), (n, s) => atlas.icon(n, s), (t) => { setTool(t); if (t) say(t.label); }, (n) => audio.sfx(n));
const book = createBook({
  get client() { return client; }, mirror: M, fly, select: (ref, at) => { if (at) S.selPos = [at[0], at[1], 2]; }, get events() { return S.events; },
  newWorld: (template: string) => { $('making').hidden = false; $('making-s').textContent = 'raising the land, filling the seas'; client.send({ t: 'new', seed: (Math.random() * 1e9) | 0, template }); },
  param: (k: string, v: number) => { if (k[0] === '@') audio.volumes({ [k.slice(1)]: v } as any); else client.send({ t: 'param', k, v }); },
  save, load, loadFile, slots, sfx: (n: string) => audio.sfx(n), audio,
} as any);
function buildUI() {
  const lr = $('lenses'); for (const [id, label] of LENSES) { const b = document.createElement('button'); b.type = 'button'; b.dataset.lens = String(id); b.textContent = label; b.addEventListener('click', () => setLens(id)); lr.appendChild(b); }
  for (const b of document.querySelectorAll<HTMLElement>('[data-speed]')) b.addEventListener('click', () => { audio.unlock(); setSpeed(+b.dataset.speed!); });
  for (const b of document.querySelectorAll<HTMLElement>('[data-brush]')) b.addEventListener('click', () => setBrush(+b.dataset.brush!));
  $('power').addEventListener('click', (e) => { audio.unlock(); const r = $('power').getBoundingClientRect(); radial.open(r.left + r.width / 2, r.top - 120, S.tool ? S.tool.id : ''); e.stopPropagation(); });
  $('mute').addEventListener('click', () => { audio.unlock(); toggleMute(); });
  try { if (localStorage.getItem('f2-mute') === '1') { audio.mute(true); $('mute').setAttribute('aria-pressed', 'true'); } } catch (_) {}
  ($('loadfile') as HTMLInputElement).addEventListener('change', async (e) => { const f = (e.target as HTMLInputElement).files![0]; if (!f) return; const buf = await f.arrayBuffer(); $('making').hidden = false; client.send({ t: 'load', data: buf }, [buf]); });
  document.addEventListener('pointerdown', () => audio.unlock(), { once: true });
  bindInput(); setTool(null); setLens(0); setBrush(5);
}
boot();
(window as any).__f2 = { cam, M, S, setSpeed, setTool: (id: string | null) => setTool(id ? toolById(id)! : null), setLens, fly, book: () => book, client: () => client };
