// @ts-nocheck
// Named places: seas, mountain ranges, forests, deserts, marshes, steppes, lakes and islands. The
// map labels them like an atlas would, and the legends browser keeps their histories. Names come
// from whichever people lives nearest when the place is first noticed, in that people's tongue,
// and they stick: when the land changes, a place that is still there keeps its name.
import { W, H, N, clamp, wrapDx } from './core';
import { nameIt } from './story';
import { word, near } from './people';

const CLS = { sea: 1, lake: 2, mount: 3, forest: 4, desert: 5, marsh: 6, steppe: 7, tundra: 8, ice: 9, isle: 10 };
const MIN = { 1: 900, 2: 14, 3: 36, 4: 160, 5: 160, 6: 50, 7: 380, 8: 200, 9: 200, 10: 18 };
const FORMS = {
  1: ['the % Sea', 'the Sea of %', 'the % Gulf', 'the % Bight', 'the Bay of %'], 2: ['Lake %', 'the % Water', '% Mere'],
  3: ['the % Mountains', 'the % Range', 'the Spine of %', 'the % Heights', 'the % Peaks'], 4: ['the % Wood', '% Forest', 'the % Weald', 'the Deepwood of %'],
  5: ['the % Waste', 'the % Sands', 'the Desert of %', 'the % Dunes'], 6: ['the % Fens', 'the % Marshes', 'the % Mire'], 7: ['the % Steppe', 'the Plains of %', 'the % Downs', 'the % Grass'],
  8: ['the % Barrens', 'the % Tundra'], 9: ['the % Ice', 'the White %'], 10: ['% Isle', 'the Isle of %', '% Island'],
};
const OLD = { c: ['v', 'r', 'l', 'th', 'm', 'n', 'd', 'k', 'g'], v: ['a', 'e', 'o', 'ae', 'i'], e: ['n', 'r', 'th', 'l'] };

export function regionClass(w, i) {
  const sea = w.params.sea, hh = w.h[i] - sea;
  if (w.water[i] === 1) return CLS.sea; if (w.water[i] === 2) return CLS.lake;
  if (w.ice[i]) return CLS.ice; if (hh > 0.33) return CLS.mount;
  if (w.t[i] > 0.5) return CLS.forest; if (w.mi[i] < 0.2 && w.tMean[i] > 6) return CLS.desert;
  if (w.mi[i] > 1.6 && hh < 0.07) return CLS.marsh; if (Math.max(w.tJan[i], w.tJul[i]) < 9) return CLS.tundra;
  if (w.g[i] > 0.4) return CLS.steppe; return 0;
}
export function initRegions(w) { w.regs = []; w.regAt = new Int16Array(N).fill(-1); w.regions = api(w); mapRegions(w); }
function api(w) {
  return {
    nameAt: (i) => { const k = w.regAt[i]; return k >= 0 && w.regs[k] ? w.regs[k].name : null; },
    refAt: (i) => { const k = w.regAt[i]; return k >= 0 && w.regs[k] ? 'g' + w.regs[k].id : null; },
  };
}
const cls = new Uint8Array(N), comp = new Int32Array(N), dist = new Uint16Array(N), stack = new Int32Array(N);
export function mapRegions(w) {
  for (let i = 0; i < N; i++) cls[i] = regionClass(w, i);
  // islands: every landmass but the biggest, if it is small enough to call an island
  let bigM = -1, bigS = 0; for (let m = 0; m < w.massSize.length; m++) if (w.massSize[m] > bigS) { bigS = w.massSize[m]; bigM = m; }
  // distance to the edge of each class (chamfer), for label anchors
  for (let i = 0; i < N; i++) dist[i] = 0;
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x, c = cls[i]; if (!c) continue; if (cls[i - 1] !== c || cls[i - W] !== c || cls[i - W - 1] !== c || cls[i - W + 1] !== c) { dist[i] = 1; continue; } dist[i] = Math.min(dist[i - 1], dist[i - W], dist[i - W - 1] + 1, dist[i - W + 1] + 1) + 1; }
  for (let y = H - 2; y >= 1; y--) for (let x = W - 2; x >= 1; x--) { const i = y * W + x, c = cls[i]; if (!c || dist[i] <= 1) continue; dist[i] = Math.min(dist[i], dist[i + 1] + 1, dist[i + W] + 1, dist[i + W + 1] + 2, dist[i + W - 1] + 2); }
  comp.fill(-1); const found = [];
  const flood = (start, c, test) => { let sp = 0, n = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, best = start, bd = 0; stack[sp++] = start; comp[start] = found.length;
    while (sp) { const i = stack[--sp], x = i % W, y = (i / W) | 0; n++; sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y; if (dist[i] > bd) { bd = dist[i]; best = i; }
      for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) if (j >= 0 && comp[j] < 0 && test(j)) { comp[j] = found.length; stack[sp++] = j; } }
    const mx = sx / n, my = sy / n, cxx = sxx / n - mx * mx, cyy = syy / n - my * my, cxy = sxy / n - mx * my, ang = 0.5 * Math.atan2(2 * cxy, cxx - cyy), len = Math.sqrt(Math.max(1, (cxx + cyy) / 2 + Math.sqrt(((cxx - cyy) / 2) ** 2 + cxy * cxy))) * 3.2;
    return { c, n, ax: best % W, ay: (best / W) | 0, ang, len, thick: bd };
  };
  for (let i = 0; i < N; i++) { const c = cls[i]; if (!c || comp[i] >= 0 || c === CLS.sea) continue; const r = flood(i, c, (j) => cls[j] === c); found.push(r); }
  // the sea is one water; break it into named seas around the deepest open patches
  const seeds = []; for (let k = 0; k < 400; k++) { let bi = -1, bd = 0; for (let q = 0; q < 300; q++) { const i = (hashI(k * 977 + q * 131 + w.seed) % N + N) % N; if (cls[i] !== CLS.sea || dist[i] < 5) continue; let ok = true; for (const s of seeds) if ((s % W - i % W) ** 2 + (((s / W) | 0) - ((i / W) | 0)) ** 2 < 85 * 85) { ok = false; break; } if (ok && dist[i] > bd) { bd = dist[i]; bi = i; } } if (bi < 0) break; seeds.push(bi); if (seeds.length >= 9) break; }
  if (seeds.length) { const own = new Int16Array(N).fill(-1); const q = new Int32Array(N); let qh = 0, qt = 0; seeds.forEach((s, k) => { own[s] = k; q[qt++] = s; });
    while (qh < qt) { const i = q[qh++], x = i % W, y = (i / W) | 0; for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) if (j >= 0 && own[j] < 0 && cls[j] === CLS.sea) { own[j] = own[i]; q[qt++] = j; } }
    const base = found.length; seeds.forEach((s, k) => { found.push({ c: CLS.sea, n: 0, ax: s % W, ay: (s / W) | 0, ang: 0, len: 0, thick: dist[s], sx: 0, sy: 0, sxx: 0, syy: 0, sxy: 0 }); });
    for (let i = 0; i < N; i++) { const k = own[i]; if (k < 0) continue; const r = found[base + k], x = i % W, y = (i / W) | 0; comp[i] = base + k; r.n++; r.sx += x; r.sy += y; r.sxx += x * x; r.syy += y * y; r.sxy += x * y; if (dist[i] > r.thick) { r.thick = dist[i]; r.ax = x; r.ay = y; } }
    for (let k = base; k < found.length; k++) { const r = found[k], n = Math.max(1, r.n), mx = r.sx / n, my = r.sy / n, cxx = r.sxx / n - mx * mx, cyy = r.syy / n - my * my, cxy = r.sxy / n - mx * my; r.ang = 0.5 * Math.atan2(2 * cxy, cxx - cyy); r.len = Math.sqrt(Math.max(1, (cxx + cyy) / 2)) * 2.4; r.small = r.thick < 14; }
  }
  // islands: one pass to sum each landmass, one to find the land cell nearest its middle
  if (w.mass) { const M = w.massSize.length, sx = new Float64Array(M), sy = new Float64Array(M), cnt = new Int32Array(M), bq = new Float64Array(M).fill(1e18), bi = new Int32Array(M).fill(-1);
    for (let i = 0; i < N; i++) { if (w.water[i] === 1) continue; const m = w.mass[i]; sx[m] += i % W; sy[m] += (i / W) | 0; cnt[m]++; }
    for (let i = 0; i < N; i++) { if (w.water[i] === 1) continue; const m = w.mass[i]; if (m === bigM || cnt[m] < MIN[CLS.isle] || cnt[m] > bigS * 0.4) continue; const q = (i % W - sx[m] / cnt[m]) ** 2 + (((i / W) | 0) - sy[m] / cnt[m]) ** 2; if (q < bq[m]) { bq[m] = q; bi[m] = i; } }
    for (let m = 1; m < M; m++) if (bi[m] >= 0) found.push({ c: CLS.isle, n: cnt[m], ax: bi[m] % W, ay: (bi[m] / W) | 0, ang: 0, len: Math.sqrt(cnt[m]) * 1.2, thick: 3, mass: m }); }
  // keep names of places that are still there; name the new ones
  const old = w.regs, next = [];
  for (let k = 0; k < found.length; k++) {
    const r = found[k]; if (r.n < MIN[r.c]) continue;
    let keep = null; for (const o of old) { if (o.c !== r.c || o.taken) continue; const ai = o.ay * W + o.ax; if ((r.c === CLS.isle ? w.mass[ai] === r.mass : comp[ai] === k) || (wrapDx(o.ax - r.ax) ** 2 + (o.ay - r.ay) ** 2 < 100 && r.c === CLS.sea)) { keep = o; break; } }
    const reg = keep || { id: w.nextId++, c: r.c, born: w.year, name: null };
    if (keep) keep.taken = true;
    Object.assign(reg, { n: r.n, ax: r.ax, ay: r.ay, ang: r.ang, len: r.len, thick: r.thick, k, small: r.small, mass: r.mass });
    if (!reg.name) { reg.name = nameFor(w, reg); nameIt(w, 'g' + reg.id, reg.name); }
    next.push(reg);
  }
  for (const o of old) { if (!o.taken && !o.gone) { o.gone = w.year; } o.taken = false; }
  w.regsGone = (w.regsGone || []).concat(old.filter((o) => o.gone === w.year && o.n >= MIN[o.c] * 2)).slice(-200);
  w.regs = next; w.regAt.fill(-1); const byK = new Map(next.map((r, ix) => [r.k, ix]));
  for (let i = 0; i < N; i++) { const k = comp[i]; if (k >= 0 && byK.has(k)) w.regAt[i] = byK.get(k); }
  const isle = new Map(); next.forEach((r, ix) => { if (r.c === CLS.isle) isle.set(r.mass, ix); }); if (isle.size) for (let i = 0; i < N; i++) if (w.regAt[i] < 0 && w.water[i] !== 1 && isle.has(w.mass[i])) w.regAt[i] = isle.get(w.mass[i]);
  w.regStamp = (w.regStamp || 0) + 1;
}
function hashI(n) { n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); return (n ^ (n >>> 16)) >>> 0; }
function nameFor(w, r) {
  const s = w.sets && w.sets.length ? near(w, r.ax, r.ay, 60, null, false) : null, L = s ? w.cults[s.cult].lang : OLD;
  const used = new Set(w.regs.map((q) => q.name)); let nm = null;
  for (let t = 0; t < 6 && (!nm || used.has(nm)); t++) { const F = FORMS[r.c], f = r.c === CLS.sea && r.small ? (w.rnd() < 0.5 ? 'the % Gulf' : 'the Bay of %') : r.c === CLS.sea && r.thick > 40 ? 'the % Ocean' : F[(w.rnd() * F.length) | 0]; nm = f.replace('%', word(w, L, w.rnd() < 0.5 ? 2 : 1)); }
  r.tongue = s ? w.cults[s.cult].name : null; return nm;
}
export const REGION_KIND = ['', 'sea', 'lake', 'mountains', 'forest', 'desert', 'marsh', 'steppe', 'tundra', 'ice', 'island'];
