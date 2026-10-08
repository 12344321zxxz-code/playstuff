// Plates, the super simple way. No drift-through-time simulation: a handful of plates, each with
// a kind (land or ocean) and a drift arrow. Where two plates push together mountains rise, where
// they pull apart a rift or a ridge opens. The whole thing is one pass, so dragging an arrow or
// flipping a plate answers at once.
import { W, H, N, TAU, clamp, wx, cyl, rng, blur, wrapDx } from './core.js';

export function makePlates(w, rnd) {
  const K = 11 + ((rnd() * 4) | 0), plates = [];
  for (let k = 0; k < K; k++) {
    const a = rnd() * TAU, sp = 0.45 + rnd() * 0.75;
    plates.push({ id: k, x: rnd() * W, y: H * (0.1 + 0.8 * rnd()), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, land: false, cx: 0, cy: 0, area: 0 });
  }
  w.plates = plates;
  assignPlates(w);
  // choose land plates until roughly 40% of the surface is continental crust
  const order = plates.slice().sort(() => rnd() - 0.5); let area = 0;
  for (const p of order) { if (area > N * 0.4) break; if (area + p.area > N * 0.55) continue; p.land = true; area += p.area; }
  if (!plates.some((p) => p.land)) order[0].land = true;
}

export function assignPlates(w) {
  const { plates, plate } = w, s = w.seed;
  for (const p of plates) { p.area = 0; p.sx = 0; p.sy = 0; p.sc = 0; p.ss = 0; }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const qx = x + 34 * (cyl(x, y, 1 / 46, s + 5, 3) - 0.5) * 2, qy = y + 34 * (cyl(x, y, 1 / 46, s + 9, 3) - 0.5) * 2;
    let best = 0, bd = 1e12;
    for (let k = 0; k < plates.length; k++) { const p = plates[k], dx = wrapDx(qx - p.x), dy = (qy - p.y) * 1.25, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = k; } }
    plate[y * W + x] = best; const p = plates[best]; p.area++; p.sy += y; const th = (x / W) * TAU; p.sc += Math.cos(th); p.ss += Math.sin(th);
  }
  for (const p of plates) if (p.area) { p.cy = p.sy / p.area; p.cx = wx((Math.atan2(p.ss, p.sc) / TAU) * W); }
}

// The part of the height field that comes from plates alone.
export function tectonics(w, out) {
  const { plates, plate } = w, s = w.seed;
  out = out || new Float32Array(N);
  const base = w._pbase || (w._pbase = new Float32Array(N)), tmp = w._ptmp || (w._ptmp = new Float32Array(N));
  for (let i = 0; i < N; i++) base[i] = plates[plate[i]].land ? 1 : -1;
  blur(base, W, H, 9, 3, tmp);
  if (!w._ridge) {
    const ridge = (w._ridge = new Float32Array(N)), along = (w._along = new Float32Array(N));
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x, r = 1 - Math.abs(2 * cyl(x, y, 1 / 7, s + 31, 3) - 1); ridge[i] = 0.45 + 0.95 * r * r; along[i] = 0.55 + 0.9 * cyl(x, y, 1 / 34, s + 37, 2); }
  }
  const ridge = w._ridge, along = w._along;
  // boundary cells: how hard the neighbours push together, and what they are
  const conv = w._conv || (w._conv = new Float32Array(N)), other = w._other || (w._other = new Int16Array(N)), dist = w._pd || (w._pd = new Uint8Array(N)), src = w._ps || (w._ps = new Int32Array(N));
  const q = w._pq || (w._pq = new Int32Array(N)); let qn = 0; dist.fill(255);
  for (let y = 1; y < H - 1; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, a = plate[i]; let nx = 0, ny = 0, cnt = 0, ob = -1;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const j = (y + dy) * W + wx(x + dx), b = plate[j]; if (b !== a) { nx += dx; ny += dy; cnt++; if (ob < 0 || (Math.abs(dx) + Math.abs(dy) < 2)) ob = b; } }
    if (!cnt) continue;
    // only cells that touch the other plate start the wave
    if (plate[y * W + wx(x + 1)] === a && plate[y * W + wx(x - 1)] === a && plate[i - W] === a && plate[i + W] === a) continue;
    const l = Math.hypot(nx, ny) || 1, pa = plates[a], pb = plates[ob];
    conv[i] = ((pa.vx - pb.vx) * nx + (pa.vy - pb.vy) * ny) / l; other[i] = ob; dist[i] = 0; src[i] = i; q[qn++] = i;
  }
  // even the push out along each boundary so ranges do not come out striped
  for (let pass = 0; pass < 3; pass++) {
    for (let k = 0; k < qn; k++) { const i = q[k], x = i % W, y = (i / W) | 0, a = plate[i], ob = other[i]; let sm = 0, c = 0;
      for (let dy = -3; dy <= 3; dy++) { const yy = y + dy; if (yy < 1 || yy >= H - 1) continue; for (let dx = -3; dx <= 3; dx++) { const j = yy * W + wx(x + dx); if (dist[j] === 0 && plate[j] === a && other[j] === ob) { sm += conv[j]; c++; } } }
      tmp[i] = sm / c; }
    for (let k = 0; k < qn; k++) conv[q[k]] = tmp[q[k]];
  }
  for (let hd = 0; hd < qn; hd++) {
    const c = q[hd], d = dist[c] + 1; if (d > 18) continue; const x = c % W, y = (c / W) | 0;
    for (let k = 0; k < 4; k++) { const yy = y + (k === 2 ? -1 : k === 3 ? 1 : 0); if (yy < 0 || yy >= H) continue; const n = yy * W + wx(x + (k === 0 ? 1 : k === 1 ? -1 : 0)); if (dist[n] > d) { dist[n] = d; src[n] = src[c]; q[qn++] = n; } }
  }
  const g = (d, c, wd) => Math.exp(-((d - c) * (d - c)) / (wd * wd));
  w.arcs = w.arcs || new Uint8Array(N); w.arcs.fill(0);
  for (let i = 0; i < N; i++) {
    let add = 0; const d = dist[i];
    if (d < 255) {
      const sc = src[i], cv = conv[sc], pa = plates[plate[sc]], pb = plates[other[sc]], me = plates[plate[i]], oth = me === pa ? pb : pa;
      const ns = ridge[i] * along[i];
      if (cv > 0.08) {
        const f = Math.min(1.25, cv / 1.1);
        if (me.land && oth.land) add = 0.6 * f * g(d, 0, 9) * ns;
        else if (me.land && !oth.land) { add = 0.44 * f * g(d, 3, 5) * ns; if (d >= 2 && d <= 5 && f > 0.4) w.arcs[i] = 1; }
        else if (!me.land && oth.land) add = -0.22 * f * g(d, 0, 2.5);
        else add = me.id > oth.id ? 0.5 * f * g(d, 2, 1.7) * ns * (along[i] > 1 ? 1 : 0.35) : -0.2 * f * g(d, 0, 2.2);
        if (!me.land && !oth.land && me.id > oth.id && d >= 1 && d <= 3) w.arcs[i] = 1;
      } else if (cv < -0.08) {
        const f = Math.min(1.2, -cv / 1.1);
        add = me.land ? (-0.2 * g(d, 0, 2.6) + 0.07 * g(d, 6, 3)) * f : 0.14 * f * g(d, 0, 5) * (0.7 + 0.3 * ns);
      }
    }
    out[i] = add; }
  w.pbase = base;
  return out;
}

// Build the first height field: plates, then continents' own wobble, then detail.
export function buildLand(w, rnd) {
  const s = w.seed, h = w.h;
  w.tect = tectonics(w, w.tect);
  // how continental each spot is: the plate it sits on, bent and broken up by big slow noise
  const shape = (w.shape = new Float32Array(N)), fine = (w.fine = new Float32Array(N));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, qx = x + 40 * (cyl(x, y, 1 / 70, s + 41, 3) - 0.5), qy = y + 40 * (cyl(x, y, 1 / 70, s + 43, 3) - 0.5);
    shape[i] = (cyl(qx, qy, 1 / 52, s + 1, 5) - 0.5) * 4.6 + (cyl(x, y, 1 / 17, s + 2, 4) - 0.5) * 1.2;
    fine[i] = (cyl(x, y, 1 / 6.5, s + 3, 4) - 0.5);
    const pl = Math.abs(y / (H - 1) - 0.5) * 2; shape[i] -= pl * pl * pl * pl * 1.5;            // less land toward the poles
  }
  landFromPlates(w);
  // hotspots: lonely volcanic islands
  w.volcanoes = [];
  for (let k = 0, tries = 0; k < 9 && tries < 400; tries++) {
    const x = (rnd() * W) | 0, y = (H * (0.12 + 0.76 * rnd())) | 0, i = y * W + x;
    if (h[i] > -0.25 || h[i] < -0.5) continue;
    const r = 1.3 + rnd() * 1.2, amp = 0.42 + rnd() * 0.3;
    for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) { const yy = y + dy; if (yy < 1 || yy >= H - 1) continue; h[yy * W + wx(x + dx)] += amp * Math.exp(-(dx * dx + dy * dy) / (2 * r * r)); }
    w.volcanoes.push({ x, y, heat: rnd(), last: -999, natural: true }); k++;
  }
  // arc volcanoes along subduction coasts
  for (let tries = 0, k = 0; tries < 4000 && k < 14; tries++) { const i = (rnd() * N) | 0; if (!w.arcs[i] || h[i] < 0.12) continue; const x = i % W, y = (i / W) | 0; if (w.volcanoes.some((v) => Math.abs(wrapDx(v.x - x)) + Math.abs(v.y - y) < 14)) continue; w.volcanoes.push({ x, y, heat: rnd(), last: -999, natural: true }); k++; }
}

// continentness -> height. The waterline is set once, at world creation, so about a third is land.
export function heightFrom(w, out) {
  const { shape, fine, tect, pbase } = w;
  if (w.cut == null) { const c = new Float32Array(N); for (let i = 0; i < N; i++) c[i] = 0.5 * pbase[i] + shape[i]; c.sort(); w.cut = c[Math.floor(N * 0.665)]; }
  const cut = w.cut;
  for (let i = 0; i < N; i++) {
    const c = 0.5 * pbase[i] + shape[i] - cut, f = fine[i]; let e;
    if (c >= 0) e = 0.012 + 0.16 * Math.tanh(c * 1.5) + f * (0.03 + 0.1 * Math.min(1, c)) + Math.max(0, c - 0.5) * 0.05;
    else e = -0.02 + 0.5 * Math.tanh(c * 1.15) + f * 0.07 * Math.min(1, -c * 5) * Math.max(0, 1 + c * 1.6);
    const m = tect[i]; e += m > 0 ? m * (c >= 0 ? 1 : clamp(1 + c * 0.6, 0.55, 1)) * (0.8 + 0.9 * (f + 0.5)) : m;
    out[i] = clamp(e, -1, 1.2);
  }
  return out;
}
function landFromPlates(w) { heightFrom(w, w.h); w.base0 = Float32Array.from(w.h); }

// Re-run the plates after the player moved an arrow or flipped a plate, and push only the change
// into the live height field so hand-made hills survive.
export function replate(w) {
  const old = w.base0, h = w.h;
  w.tect = tectonics(w, w.tect);
  const nu = heightFrom(w, w._h2 || (w._h2 = new Float32Array(N)));
  for (let i = 0; i < N; i++) h[i] = clamp(h[i] + (nu[i] - old[i]), -1, 1.2);
  w._h2 = old; w.base0 = nu;
}
