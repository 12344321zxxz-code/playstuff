// @ts-nocheck
// The world's side of the page. Runs in a Web Worker (or, if workers are unavailable, on the
// main thread behind the same message interface). It owns the world, ticks it at the chosen
// speed, applies the god's powers, answers questions, and sends the page what it needs to
// draw: packed textures, things on the map, and what happened.
import { W, H, N, CN, CW, CH, TPY, clamp, wx } from './core';
import { makeWorld, tick, refreshWater, queueClimate, background, movePlates } from './world';
import { APPLY, MYTHIC } from './tools';
import { noteAct } from './myth';
import { look } from './look';
import { legendPage, legendIndex, chronicle } from './legends';
import { nudge } from './figures';
import { plateAt } from './powers';
import { derive } from './climate';
import { saveWorld, loadWorld } from './save';
import { TEMPLATES } from './templates';
import { SPECIES } from './fauna';

const SPEEDS = [0, 4, 12, 32, 96];
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export function createHost(post) {
  let w = null, speed = 2, acc = 0, last = now(), edit = null, climT = 0, waterT = 0, ack = true, lastSend = 0, lens = 0, frameN = 0, holdT = 0;
  const sent = { land: -1, map: -1, road: -1, works: -1, reg: -1, year: -1, ore: -1, plates: -1, world: null };
  const pool = [];
  const say = (text) => text && post({ t: 'say', text });

  function newWorld(seed, template, bands) {
    const t0 = now(); w = makeWorld(seed, { template, bands }); w.name = worldName(w);
    for (const k in sent) sent[k] = -1; acc = 0; edit = null;
    post({ t: 'world', seed, template: w.template, name: w.name, ms: Math.round(now() - t0), species: SPECIES.map((s) => ({ key: s.key, col: s.col })) });
  }
  function worldName(w) { const T = TEMPLATES.find((t) => t.id === w.template); return T ? T.name : 'The World'; }

  /* ---------- the loop ---------- */
  function loop() {
    const t = now(), dt = Math.min(0.25, (t - last) / 1000); last = t;
    if (w) {
      let ran = 0; const t0 = now();
      if (speed && !edit) { acc += dt * SPEEDS[speed]; while (acc >= 1 && ran < 24 && now() - t0 < 14) { tick(w); acc -= 1; ran++; } if (acc > 4) acc = 0; }
      if (climT && t > climT && !edit) { climT = 0; queueClimate(w); }
      if (!ran && w.job && !edit) background(w, 6);
      if (edit && edit.kind === 'brush' && t > holdT) { holdT = t + 70; applyAt(edit.x, edit.y, false); }
      if (edit && w.need.water && t > waterT) { waterT = t + 300; refreshWater(w); }
      if (ack && t - lastSend > 30) send(t);
    }
    setTimeout(loop, 4);
  }

  /* ---------- tools ---------- */
  function applyAt(x, y, first) {
    const fn = APPLY[edit.tool]; if (!fn) return; let r;
    try { r = fn(w, x, y, edit.r, edit.st, edit.opt || 0); } catch (e) { console.error(e); r = false; }
    if (first) { if (r === false) say(edit.miss || 'Nothing happens there.'); else if (typeof r === 'string') say(r); if (r !== false && MYTHIC[edit.tool]) noteAct(w, MYTHIC[edit.tool], x, y, edit.r); }
    if (w.need.derive) { derive(w); w.need.derive = false; }
  }
  function down(m) {
    const yy = clamp(Math.round(m.y), 0, H - 1), i = yy * W + wx(Math.round(m.x));
    edit = { tool: m.tool, kind: m.kind, r: m.r, opt: m.opt, x: m.x, y: m.y, lx: m.x, ly: m.y, st: { level: w.h[i], power: 1 }, miss: m.miss };
    holdT = now() + 70; applyAt(m.x, m.y, true);
    if (m.kind === 'tap') finish();
  }
  function move(m) {
    if (!edit) return; edit.x = m.x; edit.y = m.y; if (edit.kind === 'tap') return;
    const dx = m.x - edit.lx, dy = m.y - edit.ly, step = Math.max(1, edit.r * 0.45), n = Math.floor(Math.hypot(dx, dy) / step);
    for (let k = 1; k <= n; k++) applyAt(edit.lx + (dx * k) / n, edit.ly + (dy * k) / n, false);
    if (n) { edit.lx = m.x; edit.ly = m.y; }
  }
  function finish() {
    if (!edit) return; edit = null;
    if (w.need.derive) { derive(w); w.need.derive = false; }
    if (w.edited) { w.edited = false; refreshWater(w); climT = now() + 500; }
  }

  /* ---------- what the page draws ---------- */
  function send(t) {
    ack = false; lastSend = t; frameN++;
    const buf = pool.pop() || new ArrayBuffer(N * 12), u = new Uint8Array(buf);
    packFine(w, u, lens);
    const msg = { t: 'frame', n: frameN, year: w.year, phase: w.phase, tickN: w.tickN, tps: edit ? 0 : SPEEDS[speed], sea: w.params.sea, solar: w.solar || 0, tex: buf, ents: ents(w), ev: w.events.splice(0), stats: stats(w), job: !!w.job };
    const tr = [buf];
    if (w.stamp.land !== sent.land && (!edit || t - (sent.landT || 0) > 120)) {
      sent.land = w.stamp.land; sent.landT = t;
      const h = Float32Array.from(w.h), water = Uint8Array.from(w.water), river = Uint8Array.from(w.river), down = Int32Array.from(w.down), ore = Uint8Array.from(w.ore);
      msg.land = { h, water, river, down, ore, plates: w.plates.map((p, k) => ({ k, cx: p.cx, cy: p.cy, vx: p.vx, vy: p.vy, land: p.land })), plate: Uint8Array.from(w.plate) }; tr.push(h.buffer, water.buffer, river.buffer, down.buffer, ore.buffer, msg.land.plate.buffer);
    }
    if (w.year !== sent.year || w.mapStamp !== sent.map) { sent.year = w.year; sent.map = w.mapStamp; const c = new Uint8Array(CN * 8); packCoarse(w, c); msg.coarse = c; tr.push(c.buffer); }
    if ((w.roadStamp || 0) !== sent.road) { sent.road = w.roadStamp || 0; msg.roads = [...w.links.values()].map((L) => ({ a: L.a.id, b: L.b.id, path: Int32Array.from(L.path) })); }
    if ((w.worksStamp || 0) !== sent.works || w.year % 4 === 0 && sent.worksY !== w.year) { sent.works = w.worksStamp || 0; sent.worksY = w.year; const e = new Uint8Array(N * 4); packWorks(w, e); msg.works = e; tr.push(e.buffer); }
    if ((w.regStamp || 0) !== sent.reg) { sent.reg = w.regStamp || 0; msg.regions = w.regs.map((r) => ({ id: r.id, c: r.c, name: r.name, ax: r.ax, ay: r.ay, ang: r.ang, len: r.len, thick: r.thick, n: r.n, small: !!r.small })); }
    post(msg, tr);
  }

  /* ---------- requests from the page ---------- */
  function onMessage(m) {
    try {
      switch (m.t) {
        case 'new': newWorld(m.seed, m.template, m.bands); break;
        case 'speed': speed = m.v; break;
        case 'lens': lens = m.v; break;
        case 'ack': ack = true; if (m.buf) pool.push(m.buf); break;
        case 'down': if (w) down(m); break;
        case 'move': if (w) move(m); break;
        case 'up': if (w) finish(); break;
        case 'param': if (w) param(m.k, m.v); break;
        case 'plate': if (w) { const pl = w.plates[m.k]; if (pl) { pl.vx = m.vx; pl.vy = m.vy; } } break;
        case 'plates-done': if (w) { movePlates(w); say('The plates shift.'); } break;
        case 'plate-flip': if (w) { const pl = plateAt(w, m.x, m.y); pl.land = !pl.land; movePlates(w); say(pl.land ? 'Sea floor rises into land.' : 'Land sinks beneath the sea.'); } break;
        case 'look': post({ t: 'reply', q: m.q, data: w ? look(w, m.x, m.y, m.z) : null }); break;
        case 'legend': post({ t: 'reply', q: m.q, data: w ? legendPage(w, m.ref) : null }); break;
        case 'index': post({ t: 'reply', q: m.q, data: w ? legendIndex(w, m.kind) : null }); break;
        case 'chronicle': post({ t: 'reply', q: m.q, data: w ? chronicle(w, m.from, m.n, m.filter) : null }); break;
        case 'nudge': { const r = w ? nudge(w, m.id, m.how) : null; post({ t: 'reply', q: m.q, data: r }); break; }
        case 'save': { const data = w ? saveWorld(w) : null; post({ t: 'reply', q: m.q, data }, data ? [data] : []); break; }
        case 'load': { const t0 = now(); try { w = loadWorld(m.data); for (const k in sent) sent[k] = -1; acc = 0; edit = null; post({ t: 'world', seed: w.seed, template: w.template, name: w.name || worldName(w), ms: Math.round(now() - t0), loaded: true, species: SPECIES.map((s) => ({ key: s.key, col: s.col })) }); } catch (e) { console.error(e); post({ t: 'say', text: 'That file is not a world this can read.' }); } break; }
        case 'almanac': post({ t: 'reply', q: m.q, data: w ? { found: w.found, myths: w.myths, god: w.god } : null }); break;
        case 'peoples': post({ t: 'reply', q: m.q, data: w ? peoples(w) : null }); break;
      }
    } catch (e) { console.error(e); post({ t: 'error', text: String(e && e.stack || e) }); }
  }
  function param(k, v) {
    const P = w.params;
    if (k === 'sea') { P.seaDial = v; P.sea = P.seaDial + w.seaAuto; w.stamp.land++; refreshWater(w); climT = now() + 350; }
    else if (k === 'spin') { P.spin = -P.spin; climT = now() + 350; }
    else { P[k] = v; if (k !== 'mood') climT = now() + 350; }
  }
  setTimeout(loop, 10);
  return onMessage;
}

/* ---------- packing ---------- */
// Three RGBA textures, one after the other:
//   A: temperature now, moisture, grass, trees
//   B: snow, lake depth, greenness, mean temperature
//   C: owner people slot + 1, flags, plate, soil (or magic)
function packFine(w, u, lens) {
  const { temp, mi, g, t, snow, water, filled, h, green, tMean, ocult, farm, urban, fireT, ash, ice, lava, plate, soil, magic, road } = w;
  const B = N * 4, C = N * 8;
  for (let i = 0, j = 0; i < N; i++, j += 4) {
    let v = (temp[i] + 40) * 3.1875; u[j] = v < 0 ? 0 : v > 255 ? 255 : v; v = mi[i] * 102; u[j + 1] = v > 255 ? 255 : v; u[j + 2] = g[i] * 255; u[j + 3] = t[i] > 1 ? 255 : t[i] * 255;
    u[B + j] = snow[i] * 255; v = water[i] === 2 ? 40 + (filled[i] - h[i]) * 2500 : 0; u[B + j + 1] = v > 255 ? 255 : v; u[B + j + 2] = green[i] * 255; v = (tMean[i] + 40) * 3.1875; u[B + j + 3] = v < 0 ? 0 : v > 255 ? 255 : v;
    u[C + j] = ocult[i] + 1; u[C + j + 1] = (farm[i] ? 1 : 0) | (urban[i] ? 2 : 0) | (fireT[i] ? 4 : 0) | (ash[i] > 0.3 ? 8 : 0) | (ice[i] && water[i] !== 1 ? 16 : 0) | (road[i] ? 32 : 0) | (lava[i] ? 64 : 0) | (farm[i] === 2 ? 128 : 0); u[C + j + 2] = plate[i];
    v = lens === 7 ? magic[i] * 255 : soil[i] * 170; u[C + j + 3] = v > 255 ? 255 : v;
  }
}
// Works and slow things, one RGBA texture: works bits, road level, magic, ruin/holy marks
function packWorks(w, e) {
  const { works, road, magic } = w;
  for (let i = 0, j = 0; i < N; i++, j += 4) { e[j] = works ? works[i] : 0; e[j + 1] = Math.min(255, road[i] * 40); const v = magic[i] * 255; e[j + 2] = v > 255 ? 255 : v; e[j + 3] = 0; }
}
// Two coarse RGBA textures: realm, faith, grazers, predators; then fish, whales, rain this year, magic
function packCoarse(w, c) {
  const e = w.eco, F = w.fish, K = w.fishK, wa = w.wetA, D = CN * 4;
  for (let i = 0, j = 0; i < CN; i++, j += 4) {
    c[j] = w.realm ? w.realm[i] : 0; c[j + 1] = w.faithMap ? w.faithMap[i] : 0; c[j + 2] = e ? Math.min(255, e.graze[i] * 200) : 0; c[j + 3] = e ? Math.min(255, e.pred[i] * 400) : 0;
    c[D + j] = K && K[i] > 0 ? Math.min(255, (F[i] / K[i]) * 255) : 0; c[D + j + 1] = e ? Math.min(255, e.whale[i] * 300) : 0; c[D + j + 2] = wa ? Math.min(255, wa[i] * 120) : 120; c[D + j + 3] = K ? Math.min(255, K[i] * 160) : 0;
  }
}

/* ---------- things on the map ---------- */
function ents(w) {
  const sets = [], cults = [], movers = [], herds = [], packs = [], beasts = [], storms = [], swarms = [], ruins = [], fx = [], volc = [], figs = [], arts = [];
  for (const s of w.sets) if (!s.dead) { const c = w.cults[s.cult]; sets.push({ id: s.id, x: s.x, y: s.y, px: s.px, py: s.py, mt: s.mt, c: s.cult, tier: s.tier, pop: Math.round(s.pop), nomad: s.nomad, walls: s.walls, tower: s.tower, wonder: s.wonder, port: s.port, name: s.name, plague: s.plague > 0, faith: s.faith, cap: c.big === s, race: c.race || 0, burned: s.burned, R: s.R, hero: s.hero ? 1 : 0, way: s.way, age: s.age }); }
  for (const c of w.cults) if (c.alive) cults.push({ id: c.id, name: c.name, color: c.color, slot: c.slot, kind: c.kind, race: c.race || 0, count: c.count, pop: Math.round(c.pop), big: c.big ? [c.big.x, c.big.y] : null, war: c.war ? c.war.foe : null, tech: c.tech, faith: c.faith, empire: !!c.flags.empire });
  for (const m of w.movers) if (!m.done) movers.push({ id: m.id, k: m.kind, c: m.cult, x: m.x, y: m.y, px: m.px, py: m.py, wet: !!m.wet, n: Math.round(m.n), hero: m.hero || null });
  for (const h of w.herds) if (h.n >= 2) herds.push({ sp: h.sp, x: h.x, y: h.y, px: h.px, py: h.py, mt: h.mt, n: Math.round(h.n), odd: h.odd || null });
  for (const p of w.packs) if (p.n >= 2) packs.push({ x: p.x, y: p.y, px: p.px, py: p.py, mt: p.mt, n: Math.round(p.n) });
  for (const d of w.dragons) beasts.push({ id: d.id, kind: 'dragon', name: d.name, x: d.x, y: d.y, px: d.px, py: d.py, lx: d.lx, ly: d.ly, st: d.st, fly: d.st === 'fly' || d.st === 'home' });
  for (const b of w.beasts || []) beasts.push({ id: b.id, kind: b.kind, name: b.name, x: b.x, y: b.y, px: b.px, py: b.py, lx: b.lx, ly: b.ly, st: b.st, fly: b.st !== 'lair' && (b.kind === 'griffin' || b.kind === 'wyvern') });
  for (const k of w.krakens) beasts.push({ id: k.id, kind: k.kind || 'kraken', name: k.name, x: k.x, y: k.y, px: k.px != null ? k.px : k.x, py: k.py != null ? k.py : k.y, lx: k.x, ly: k.y, st: k.wake > 0 ? 'wake' : 'deep', sea: true });
  for (const s of w.storms) storms.push({ x: s.x, y: s.y, px: s.px == null ? s.x : s.px, py: s.py == null ? s.y : s.py, str: s.str, spin: s.spin });
  for (const s of w.swarms) swarms.push({ x: s.x, y: s.y, px: s.px, py: s.py });
  for (const r of w.ruins) ruins.push({ x: r.x, y: r.y, name: r.name, kind: r.kind, haunt: !!r.haunt, tier: r.tier, wonder: r.wonder, sid: r.sid });
  for (const v of w.volcanoes) volc.push({ x: v.x, y: v.y, hot: w.year - v.last < 8 });
  for (const f of w.fx) fx.push(f); w.fx.length = 0;
  for (const f of w.figs || []) if (!f.died && f.role !== 'ruler') figs.push({ id: f.id, name: f.name, role: f.role, kind: f.kind, x: f.x, y: f.y, c: f.cult, villain: !!f.villain });
  for (const a of w.arts || []) if (!a.lost) arts.push({ id: a.id, name: a.name, x: a.x, y: a.y });
  return { sets, cults, movers, herds, packs, beasts, storms, swarms, ruins, fx, volc, figs, arts, wells: w.wells, faiths: (w.faiths || []).filter((f) => f.alive).map((f) => ({ id: f.id, name: f.name, color: f.color, slot: f.slot, towns: f.towns, god: !!f.god })) };
}
function stats(w) {
  let land = 0, forest = 0, ice = 0, desert = 0, grass = 0;
  for (let i = 0; i < N; i += 7) { if (w.water[i] === 1) continue; land++; if (w.ice[i]) ice++; else if (w.t[i] > 0.5) forest++; else if (w.mi[i] < 0.2) desert++; else if (w.g[i] > 0.4) grass++; }
  const e = w.eco;
  return { people: w.stats.people || 0, peoples: w.stats.peoples || 0, places: w.stats.places || 0, forest: forest / land, ice: ice / land, desert: desert / land, grass: grass / land, game: e ? e.gMean || 0 : 0, hunters: e ? e.pMean || 0 : 0, whales: e && e.wh0 ? e.wh / e.wh0 : 1, found: Object.keys(w.found).length, popHist: w.popHist ? w.popHist.slice(-160) : [], wars: w.cults.filter((c) => c.alive && c.war && c.war.mine).length };
}
function peoples(w) {
  return w.cults.filter((c) => c.alive).sort((a, b) => b.pop - a.pop).map((c) => ({ id: c.id, name: c.name, color: c.color, kind: c.kind, race: c.race || 0, pop: Math.round(c.pop), count: c.count, ruler: c.ruler.name, faith: c.faith != null ? w.faiths[c.faith].name : null, war: c.war ? w.cults[c.war.foe].name : null, tech: c.tech }));
}
