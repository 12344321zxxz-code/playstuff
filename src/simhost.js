// The simulation as a service: it owns the world and runs time; the page only draws and asks.
// It runs inside a background worker (worker.js), so drawing the map and running the world happen
// side by side. It sends the page:
//   frame  — every batch of ticks: the clock, everything that moves, new events and effects
//   world  — twice a second (and after edits): a slim copy of everything else, plus the map layers
//            the page reads directly when they have changed
//   tex    — a few times a second: the map textures, built here, handed over as bytes
// and takes commands: speed, tools, plates, dials, new world, load, save, questions.
// Nothing here touches a page; the same code would run in Node.
import { realmAt, diplomacy } from './diplomacy.js';
import { W, H, N } from './core.js';
import { makeWorld, tick, settle, background, queueClimate, refreshWater, movePlates } from './world.js';
import { encodeWorld, gzip, readSave } from './save.js';
import { report } from './probe.js';
import { describe } from './inspect.js';
import { applyTool, finishEdit, pressState, toolById } from './tooldefs.js';
import { makeTexState, buildTex } from './texbuild.js';
import { makeWatch, watchRate } from './watch.js';
import { plateAt } from './powers.js';
import { coarse } from './climate.js';
import { bus } from './bus.js';

export const TPS = [0, 16, 32, 96];   // ticks per second for each speed
const RATE = [0, 16, 32, 480];         // in the worker, Fast is as fast as the machine allows (up to 60 years a second)

// the land shares the page shows under Vitals (worked out here: they need the whole map)
export function landRows(w) {
  let land = 0, forest = 0, ice = 0, desert = 0, grass = 0;
  for (let i = 0; i < N; i += 3) { if (w.water[i] === 1) continue; land++; if (w.ice[i]) ice++; else if (w.t[i] > 0.5) forest++; else if (w.mi[i] < 0.2) desert++; else if (w.g[i] > 0.4) grass++; }
  land = land || 1; return [['Forest', Math.round((forest / land) * 100) + '%'], ['Grass', Math.round((grass / land) * 100) + '%'], ['Desert', Math.round((desert / land) * 100) + '%'], ['Ice', Math.round((ice / land) * 100) + '%']];
}

// what the page never needs, or rebuilds itself
const SKIP = new Set(['rnd', 'census', 'job', 'actions', 'lookers', 'flowQ', 'onces', 'travel', 'pushedW', 'hist', 'seenActs', 'events', 'fx', 'movers']);
// the map layers the page reads itself (the rest of the map reaches it only as textures), and the stamp that says when each changed
const LAYERS = [['water', (w) => w.stamp.land], ['h', (w) => w.stamp.land], ['mi', (w) => w.climateStamp || 0], ['ore', (w) => w.oreStamp || 0], ['owner', (w) => w.tickN >> 3], ['courtOf', (w) => w.courtStamp || 0], ['plate', (w) => w.plateStamp || 0], ['polity', (w) => w.polityYear ?? -1]];
const slimTravel = (T) => (T ? { edges: T.edges, routeWays: T.routeWays, lanes: T.lanes } : null);
// a mover without its luggage: the towns it links are reduced to what a caption needs
const stub = (s) => (s ? { id: s.id, name: s.name, dead: !!s.dead, x: s.x, y: s.y } : null);
function lightMover(m) {
  return { id: m.id, kind: m.kind, cult: m.cult, x: m.x, y: m.y, px: m.px, py: m.py, tx: m.tx, ty: m.ty, n: m.n, n0: m.n0, goods: m.goods, wet: m.wet, wet0: m.wet0, dead: m.dead, pi: m.pi, flow: m.flow,
    path: m.kind === 'army' && m.path ? m.path : m.kind === 'trade' && m.path && m.path.length ? true : null, from: stub(m.from), to: stub(m.to), final: stub(m.final), origin: stub(m.origin) };
}

export function createHost(post0) {
  const prof = {}, timed = (k, f) => { const a = performance.now(); const r = f(); const e = prof[k] || (prof[k] = { n: 0, ms: 0 }); e.n++; e.ms += performance.now() - a; return r; };
  const post = (m, tr) => timed('post:' + m.t, () => post0(m, tr));
  let w = null, speed = 1, hold = false, lens = 0, rateNow = TPS[1], acc = 0, last = 0, st = null, waterT = 0;
  let frameAt = 0, worldAt = 0, texAt = 0, bgAt = 0, simDirty = false, worldDirty = false, texDirty = false, texForce = false, touched = false;
  let out = { events: [], fx: [] }, stamps = {}, TS = makeTexState(), watch = makeWatch(), timer = null, ranSince = 0;
  bus.say = (msg, ms) => post({ t: 'say', msg, ms });
  const now = () => performance.now();

  function drain() { if (w.events.length) { for (const e of w.events) out.events.push(e); w.events.length = 0; } if (w.fx.length) { for (const f of w.fx) out.fx.push(f); w.fx.length = 0; } }
  function sendFrame() {
    const m = timed('frameBuild', () => ({ t: 'frame', tickN: w.tickN, year: w.year, phase: w.phase, stats: w.stats, ran: ranSince, movers: w.movers.filter((q) => !q.done).map(lightMover), storms: w.storms, storms2: w.storms2, swarms: w.swarms, dragons: w.dragons, krakens: w.krakens, great: w.great, pirates: w.pirates,
      events: out.events, fx: out.fx, banner: watch.banner ? Object.assign({}, watch.banner, { left: watch.banner.until - now() }) : null, top: watch.top, rate: speed === 1 ? rateNow : RATE[speed], touched, jobOn: !!w.job, aerosol: w.aerosol, params: w.params }));
    out = { events: [], fx: [] }; ranSince = 0; touched = false; frameAt = now();
    try { post(m); } catch (e) { m.dragons = []; m.great = null; post(m); }
  }
  function sendWorld(fresh) {
    const o = {}; const tw = now(); for (const k of Object.keys(w)) { const v = w[k]; if (SKIP.has(k) || typeof v === 'function') continue; if (ArrayBuffer.isView(v) && v.byteLength > 65536) continue; o[k] = v; }
    o.travel = slimTravel(w.travel); o.vit = landRows(w); o.jobOn = !!w.job; o.movers = []; o.events = []; o.fx = [];
    const arr = {}, tr = []; for (const [k, f] of LAYERS) { const s = f(w); if (!w[k] || (!fresh && stamps[k] === s)) continue; stamps[k] = s; const c = w[k].slice(); arr[k] = c; tr.push(c.buffer); }
    const clim = fresh || stamps.clim !== (w.climateStamp || 0) ? coarse.out.map((q) => ({ u: q.u.slice(), v: q.v.slice(), cu: q.cu.slice(), cv: q.cv.slice() })) : null; stamps.clim = w.climateStamp || 0;
    worldAt = now(); worldDirty = false; (prof.worldBuild || (prof.worldBuild = { n: 0, ms: 0 })).ms += worldAt - tw;
    post({ t: 'world', fresh: !!fresh, w: o, arr, clim }, tr); worldEvery = Math.min(1500, Math.max(400, (now() - tw) * 20));
  }
  // the copies cost the worker time it could spend on the world: the slower they are to make, the rarer
  let texEvery = 200, worldEvery = 500;
  function sendTex() {
    const ts = now(); const t = timed('buildTex', () => buildTex(w, lens, TS, texForce)); texForce = false; texAt = now(); texDirty = false; simDirty = false;
    const tr = [t.A.buffer, t.B.buffer, t.C.buffer, t.F.buffer]; if (t.elev) tr.push(t.elev.buffer); if (t.D) tr.push(t.D.buffer);
    post({ t: 'tex', tex: t }, tr); texEvery = Math.min(600, Math.max(150, (now() - ts) * 8));
  }
  function adopt(world) {
    w = world; acc = 0; st = null; stamps = {}; TS = makeTexState(); watch = makeWatch(); out = { events: [], fx: [] }; drain();
    sendWorld(true); texForce = true; sendTex(); sendFrame(); schedule(0);
  }

  // the clock: as many ticks as the speed asks for, in slices short enough to keep answering the page
  function loop() {
    timer = null; if (!w) return; const t0 = now(), dt = Math.min(0.1, (t0 - last) / 1000); last = t0;
    try {
      if (speed && !hold) {
        const rate = speed === 1 ? rateNow : RATE[speed]; acc += dt * rate; const big = [];
        while (acc >= 1 && now() - t0 < 25) { timed('tick', () => tick(w)); for (const e of w.events) if (e.big) big.push(e); drain(); acc -= 1; ranSince++; simDirty = true; worldDirty = true; }
        if (acc > 3) acc = 0;
        if (speed === 1) rateNow = watchRate(w, watch, t0, big);
      } else if (!speed && w.job && !hold && t0 - bgAt > 16) { bgAt = t0; const s = w.stamp.land; background(w, 1); if (w.stamp.land !== s) { texDirty = true; worldDirty = true; } }
    } catch (e) { speed = 0; post({ t: 'error', where: 'sim', year: w.year, tick: w.tickN, msg: String(e && e.message || e), stack: String(e && e.stack || '').split('\n').slice(0, 6).join(' | ') }); }
    const t1 = now();
    if (ranSince || out.events.length || out.fx.length || t1 - frameAt > 250) { if (t1 - frameAt >= 15) sendFrame(); }
    if (texDirty || (simDirty && t1 - texAt > texEvery)) sendTex();
    if (worldDirty && t1 - worldAt > worldEvery) sendWorld(false);
    const rate = speed === 1 ? rateNow : RATE[speed], wait = speed && !hold ? Math.max(0, Math.min(16, ((1 - acc) / Math.max(1, rate)) * 1000)) : 16;
    schedule(wait);
  }
  function schedule(ms) { if (timer) return; last = last || now(); timer = setTimeout(loop, ms); }

  const tools = {
    tool(m) {
      if (m.first || !st) st = pressState(w, m.p); const ok = applyTool(w, m.id, m.p, m.first, m.brush, st, m.opt);
      if (w.edited || w.need.climate) touched = true;
      if (w.need.water && now() > waterT) { waterT = now() + 320; refreshWater(w); }
      texDirty = true; worldDirty = true; if (!ok && m.first) post({ t: 'miss', id: m.id });
    },
    toolUp(m) { const t = toolById(m.id); if (t && t.up && m.p) t.up(w, m.p, st || {}); st = null; if (finishEdit(w)) post({ t: 'edited' }); texDirty = true; worldDirty = true; },
  };
  return {
    get world() { return w; },
    handle(m) {
      try {
        switch (m.t) {
          case 'ping': post({ t: 'pong' }); break;
          case 'new': adopt(makeWorld(m.seed, m.bands != null ? { bands: m.bands } : null)); break;
          case 'speed': speed = m.v; last = now(); schedule(0); break;
          case 'hold': hold = !!m.v; break;
          case 'lens': lens = m.v; texDirty = true; schedule(0); break;
          case 'tool': if (w) tools.tool(m); schedule(0); break;
          case 'toolUp': if (w) tools.toolUp(m); schedule(0); break;
          case 'plate': { const pl = w.plates[m.i]; if (pl) { pl.vx = m.vx; pl.vy = m.vy; movePlates(w); } texDirty = true; worldDirty = true; touched = true; schedule(0); break; }
          case 'plateTap': { const pl = plateAt(w, m.x, m.y); pl.land = !pl.land; movePlates(w); post({ t: 'say', msg: pl.land ? 'Ocean floor rises into a continent.' : 'A continent sinks beneath the sea.' }); texDirty = true; worldDirty = true; touched = true; schedule(0); break; }
          case 'params': Object.assign(w.params, m.set); if (m.water) { w.params.sea = w.params.seaDial + w.seaAuto; w.stamp.land++; refreshWater(w); texDirty = true; } worldDirty = true; schedule(0); break;
          case 'climate': queueClimate(w); worldDirty = true; schedule(0); break;
          case 'ask': {
            let r = null, tr = [];
            if (m.q === 'load') { readSave(m.bytes).then((x) => { adopt(x); post({ t: 'reply', id: m.id, r: { year: x.year, seed: x.seed } }); }, () => post({ t: 'reply', id: m.id, r: { bad: true } })); return; }
            if (m.q === 'describe') { const rc = m.lens === 6 ? realmAt(w, m.x, m.y) : null; r = rc ? diplomacy(w, rc) : describe(w, m.x, m.y); }   /* (Oct 31) on the political map a tap reads the state */
            else if (m.q === 'report') r = report(w, m.build);
            else if (m.q === 'save') { try { settle(w); } catch (e) { /* save it as it is */ } gzip(encodeWorld(w)).then((gz) => post({ t: 'reply', id: m.id, r: { gz, seed: w.seed, year: w.year } }, [gz.buffer]), (e) => post({ t: 'reply', id: m.id, r: null, err: String(e) })); return; }
            else if (m.q === 'ticks') { for (let k = 0; k < m.n; k++) { tick(w); drain(); } simDirty = true; worldDirty = true; r = { tickN: w.tickN }; }
            else if (m.q === 'sig') r = sig(w);
            else if (m.q === 'prof') r = prof;
            post({ t: 'reply', id: m.id, r }, tr); break;
          }
        }
      } catch (e) { post({ t: 'error', where: 'cmd ' + m.t, year: w && w.year, tick: w && w.tickN, msg: String(e && e.message || e), stack: String(e && e.stack || '').split('\n').slice(0, 6).join(' | ') }); }
    },
  };
}
// a fingerprint of the world, for tests: the same seed and the same acts must give the same number
export function sig(w) {
  let h = 2166136261; const mix = (v) => { h = Math.imul(h ^ (v | 0), 16777619) >>> 0; };
  for (const q of w.sets) { mix(q.id); mix(q.dead ? 1 : 0); mix(Math.round(q.pop * 100)); mix(q.cult); mix(q.x); mix(q.y); } for (const c of w.cults) { mix(c.alive ? 1 : 0); mix(Math.round(c.know)); mix(Math.round(c.coh * 1e4)); }
  return h.toString(16);
}
