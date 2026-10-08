// @ts-nocheck
// Climate on a coarse grid, for the two ends of the year (deep winter and high summer in the
// north). Everything between is blended. The chain inside one season:
//   sun + tilt -> surface heat -> winds (bands, plus air pulled toward warm land: monsoons)
//   winds over water -> ocean gyres -> sea temperature carried along coasts
//   air picks up water from warm sea and from forests, drops it where it rises or cools
// Mountains slow the wind and wring the rain out, so the far side is dry.
import { W, H, N, CS, CW, CH, CN, RAD, clamp, smooth, blur, latOf } from './core';
import { templateById } from './templates';

export const TEQ = 28, LAPSE = 38;
const f32 = () => new Float32Array(CN);
const C = {
  elev: f32(), land: new Uint8Array(CN), et: f32(), ice: f32(), cont: f32(), lat: new Float32Array(CH),
  ts: f32(), tb: f32(), u: f32(), v: f32(), curl: f32(), psi: f32(), cu: f32(), cv: f32(), sst: f32(), base: f32(),
  ta: f32(), q: f32(), acc: f32(), a: f32(), b: f32(), dq: new Int32Array(CN),
  out: [{ T: f32(), P: f32(), u: f32(), v: f32(), cu: f32(), cv: f32(), sst: f32() }, { T: f32(), P: f32(), u: f32(), v: f32(), cu: f32(), cv: f32(), sst: f32() }],
};
const setLat = () => { for (let y = 0; y < CH; y++) C.lat[y] = latOf(y * CS + CS / 2 - 0.5); };
export const coarse = C;

function advect(src, dst, u, v) {
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
    const i = y * CW + x; let px = x - u[i], py = y - v[i];
    if (py < 0) py = 0; else if (py > CH - 1) py = CH - 1;
    const x0 = Math.floor(px), y0 = py | 0, fx = px - x0, fy = py - y0, y1 = y0 + 1 > CH - 1 ? CH - 1 : y0 + 1;
    const xa = x0 < 0 ? x0 + CW : x0 >= CW ? x0 - CW : x0, xb = xa + 1 === CW ? 0 : xa + 1;
    const a = src[y0 * CW + xa], b = src[y0 * CW + xb], c = src[y1 * CW + xa], d = src[y1 * CW + xb];
    dst[i] = a + (b - a) * fx + (c - a + (a - b - c + d) * fx) * fy;
  }
}
const qsat = (T) => Math.exp(0.065 * (T - 20));

function rainBelts(a) {       // how readily air gives up its water, by distance from the rain belt
  const itcz = Math.exp(-(a * a) / 81), storm = Math.exp(-((a - 50) * (a - 50)) / 225), sub = Math.exp(-((a - 27) * (a - 27)) / 64);
  return (1.0 * itcz + 0.85 * storm + 0.2) * (1 - 0.7 * sub);
}

let epoch = 0;
function* season(w, s, out, my) {
  const P = w.params, tiltF = P.tilt / 23.5, phiI = s * P.tilt * 0.42, spin = P.spin;
  const { elev, land, cont, ts, tb, u, v, curl, psi, cu, cv, sst, base, ta, q, acc, a: A, b: B } = C;
  const cool = w.aerosol * 9, warm = (w.greenhouse || 0) + (w.solar || 0) + (templateById(w.template).sun || 0);
  // 1. heat at the surface
  for (let y = 0; y < CH; y++) {
    const phi = C.lat[y], sp = Math.sin(phi * RAD), seas = s * Math.sign(phi) * tiltF * Math.pow(Math.abs(sp), 0.8);
    for (let x = 0; x < CW; x++) {
      const i = y * CW + x, b0 = TEQ - 38 * Math.pow(Math.abs(sp), 2.4) + P.sun + warm - cool - C.ice[i] * 5;
      base[i] = b0 + seas * 3.5; ts[i] = land[i] ? b0 + seas * (5 + 21 * cont[i]) : base[i];
    }
  }
  tb.set(ts); blur(tb, CW, CH, 2, 2, A);
  // 2. winds
  for (let y = 0; y < CH; y++) {
    const rel = C.lat[y] - phiI, a = Math.abs(rel), sg = rel >= 0 ? 1 : -1; let bu, bv;
    if (a < 30) { const k = Math.sin((Math.PI * a) / 30); bu = -(0.5 + 0.4 * k) * (1 - smooth(22, 30, a)); bv = sg * 0.34 * k; }
    else if (a < 60) { const k = Math.sin((Math.PI * (a - 30)) / 30); bu = 0.9 * k; bv = -sg * 0.24 * k; }
    else { const k = smooth(60, 70, a); bu = -0.5 * k; bv = sg * 0.2 * k; }
    bu *= spin;
    const ym = y > 0 ? y - 1 : 0, yp = y < CH - 1 ? y + 1 : CH - 1;
    for (let x = 0; x < CW; x++) {
      const i = y * CW + x, xl = (x + CW - 1) % CW, xr = (x + 1) % CW;
      let uu = bu + 0.3 * (tb[y * CW + xr] - tb[y * CW + xl]) * 0.5, vv = bv + 0.3 * (tb[yp * CW + x] - tb[ym * CW + x]) * 0.5;
      const blk = 1 / (1 + 2.6 * elev[i]); uu *= blk; vv *= blk;
      const m = Math.hypot(uu, vv); if (m > 1) { uu /= m; vv /= m; }
      u[i] = uu; v[i] = vv;
    }
  }
  // 3. ocean gyres from the twist in the wind
  for (let y = 1; y < CH - 1; y++) for (let x = 0; x < CW; x++) { const i = y * CW + x, xl = (x + CW - 1) % CW, xr = (x + 1) % CW; curl[i] = (v[y * CW + xr] - v[y * CW + xl]) * 0.5 - (u[i + CW] - u[i - CW]) * 0.5; }
  psi.fill(0);
  for (let it = 0; it < 70; it++) for (let y = 1; y < CH - 1; y++) for (let x = 0; x < CW; x++) {
    const i = y * CW + x; if (land[i]) continue; const xl = (x + CW - 1) % CW, xr = (x + 1) % CW;
    psi[i] += 1.6 * (0.25 * (psi[y * CW + xl] + psi[y * CW + xr] + psi[i - CW] + psi[i + CW] - curl[i]) - psi[i]);
  }
  let dot = 0, mx = 1e-6;
  for (let y = 1; y < CH - 1; y++) for (let x = 0; x < CW; x++) {
    const i = y * CW + x; if (land[i]) { cu[i] = 0; cv[i] = 0; continue; } const xl = (x + CW - 1) % CW, xr = (x + 1) % CW;
    cu[i] = (psi[i + CW] - psi[i - CW]) * 0.5; cv[i] = -(psi[y * CW + xr] - psi[y * CW + xl]) * 0.5; dot += cu[i] * u[i]; const m = Math.hypot(cu[i], cv[i]); if (m > mx) mx = m;
  }
  const sc = (dot < 0 ? -1 : 1) * 0.8 / mx;
  for (let i = 0; i < CN; i++) { if (land[i]) continue; let a = cu[i] * sc + 0.2 * u[i], b = cv[i] * sc + 0.2 * v[i]; const m = Math.hypot(a, b); if (m > 0.9) { a *= 0.9 / m; b *= 0.9 / m; } cu[i] = a; cv[i] = b; }
  yield; if (my !== epoch) return;
  // 4. sea temperature carried by the currents
  sst.set(base);
  for (let it = 0; it < 30; it++) { advect(sst, A, cu, cv); for (let i = 0; i < CN; i++) sst[i] = land[i] ? base[i] : A[i] + (base[i] - A[i]) * 0.09; }
  // 5. air temperature: the wind carries sea air inland
  for (let i = 0; i < CN; i++) { ts[i] = land[i] ? ts[i] : sst[i]; ta[i] = ts[i]; }
  for (let it = 0; it < 7; it++) { advect(ta, A, u, v); for (let i = 0; i < CN; i++) ta[i] = A[i] + (ts[i] - A[i]) * (land[i] ? 0.34 : 0.7); }
  yield; if (my !== epoch) return;
  // 6. water in the air
  const QS = C.qs || (C.qs = f32()), QO = C.qo || (C.qo = f32());
  for (let i = 0; i < CN; i++) { QS[i] = qsat(ta[i] - LAPSE * elev[i]); QO[i] = qsat(sst[i]); q[i] = (land[i] ? 0.25 : 0.6) * qsat(ta[i]); acc[i] = 0; }
  const SPIN = 18, ITS = 58;
  for (let it = 0; it < ITS; it++) {
    if (it % 8 === 7) { yield; if (my !== epoch) return; }
    advect(q, A, u, v);
    for (let y = 0; y < CH; y++) {
      const eff = rainBelts(Math.abs(C.lat[y] - phiI)), ym = y > 0 ? y - 1 : 0, yp = y < CH - 1 ? y + 1 : CH - 1;
      for (let x = 0; x < CW; x++) {
        const i = y * CW + x; let qq = A[i]; const qs = QS[i];
        if (!land[i]) { const e = QO[i] - qq; if (e > 0) qq += 0.17 * e; }
        else { const e = qs - qq; if (e > 0) qq += 0.09 * C.et[i] * e; }
        const up = u[i] * (elev[y * CW + (x + 1) % CW] - elev[y * CW + (x + CW - 1) % CW]) * 0.5 + v[i] * (elev[yp * CW + x] - elev[ym * CW + x]) * 0.5;
        const rel = qq / qs; let p = qq * (0.09 * eff * Math.min(2.2, rel * rel) + (up > 0 ? 1.9 * up : 0));
        if (rel > 1) p += (qq - qs) * 0.6;
        if (p > qq * 0.9) p = qq * 0.9;
        qq -= p; if (it >= SPIN) acc[i] += p; q[i] = qq;
      }
    }
  }
  const k = 48 / (ITS - SPIN);
  for (let i = 0; i < CN; i++) { out.T[i] = ta[i]; out.P[i] = acc[i] * k; out.u[i] = u[i]; out.v[i] = v[i]; out.cu[i] = cu[i]; out.cv[i] = cv[i]; out.sst[i] = sst[i]; }
}

function up(src, x, y) {          // bilinear read of a coarse field at a full-res cell
  let px = (x + 0.5) / CS - 0.5, py = (y + 0.5) / CS - 0.5; if (py < 0) py = 0; else if (py > CH - 1) py = CH - 1;
  const x0 = Math.floor(px), y0 = Math.floor(py), fx = px - x0, fy = py - y0, y1 = y0 + 1 > CH - 1 ? CH - 1 : y0 + 1, xa = ((x0 % CW) + CW) % CW, xb = (xa + 1) % CW;
  const a = src[y0 * CW + xa], b = src[y0 * CW + xb], c = src[y1 * CW + xa], d = src[y1 * CW + xb];
  return a + (b - a) * fx + (c - a + (a - b - c + d) * fx) * fy;
}
export const sampleCoarse = up;

// The whole refresh as a generator: a running game takes a few steps per tick so nothing hitches;
// computeClimate just runs it to the end. A newer refresh cancels an older one mid-way.
export function* climateSteps(w) {
  const my = ++epoch; prep(w); yield; if (my !== epoch) return;
  yield* season(w, -1, C.out[0], my); if (my !== epoch) return; yield;
  yield* season(w, 1, C.out[1], my); if (my !== epoch) return; yield;
  yield* upsample(w, my);
}
export function computeClimate(w) { for (const _ of climateSteps(w)); }
function prep(w) {
  setLat();
  const { h, g, t } = w, sea = w.params.sea, { elev, land, et, cont } = C;
  for (let cy = 0; cy < CH; cy++) for (let cx = 0; cx < CW; cx++) {
    const i = cy * CW + cx; let e = 0, ln = 0, ev = 0, ic = 0;
    for (let dy = 0; dy < CS; dy++) for (let dx = 0; dx < CS; dx++) { const j = (cy * CS + dy) * W + cx * CS + dx, hh = h[j] - sea; if (hh >= 0) { ln++; e += hh; ev += 0.25 + 0.3 * g[j] + 0.75 * t[j]; } if (w.ice[j]) ic++; }
    const n = CS * CS; elev[i] = e / n; land[i] = ln >= n / 2 ? 1 : 0; et[i] = ln ? ev / ln : 0; C.ice[i] = ic / n;
  }
  blur(C.ice, CW, CH, 1, 1, C.a);
  // how far from the sea (drives the swing between summer and winter)
  const q = C.dq; let qn = 0; cont.fill(99);
  for (let i = 0; i < CN; i++) if (!land[i]) { cont[i] = 0; q[qn++] = i; }
  for (let hd = 0; hd < qn; hd++) { const c = q[hd], nd = cont[c] + 1; if (nd > 12) continue; const x = c % CW, y = (c / CW) | 0; for (let k = 0; k < 4; k++) { const yy = y + (k === 2 ? -1 : k === 3 ? 1 : 0); if (yy < 0 || yy >= CH) continue; const n = yy * CW + (x + (k === 0 ? 1 : k === 1 ? CW - 1 : 0)) % CW; if (cont[n] > nd) { cont[n] = nd; q[qn++] = n; } } }
  for (let i = 0; i < CN; i++) cont[i] = Math.min(1, cont[i] / 8);
}
function* upsample(w, my) {
  const { h } = w, sea = w.params.sea;
  // back to full resolution, with the fine detail of real slopes
  const { tJan, tJul, rJan, rJul, wetBias } = w, o0 = C.out[0], o1 = C.out[1], rainK = templateById(w.template).rain || 1;
  for (let y = 0; y < H; y++) { const ym = y > 0 ? y - 1 : 0, yp = y < H - 1 ? y + 1 : H - 1;
    if (y % 32 === 31) { yield; if (my !== epoch) return; }
    for (let x = 0; x < W; x++) {
      const i = y * W + x, hh = Math.max(0, h[i] - sea), xl = x === 0 ? W - 1 : x - 1, xr = x === W - 1 ? 0 : x + 1;
      const dx = (Math.max(sea, h[y * W + xr]) - Math.max(sea, h[y * W + xl])) * 0.5, dy = (Math.max(sea, h[yp * W + x]) - Math.max(sea, h[ym * W + x])) * 0.5;
      const wb = (1 + wetBias[i]) * rainK;
      tJan[i] = up(o0.T, x, y) - LAPSE * hh; tJul[i] = up(o1.T, x, y) - LAPSE * hh;
      rJan[i] = Math.max(0, up(o0.P, x, y) * clamp(1 + 9 * (up(o0.u, x, y) * dx + up(o0.v, x, y) * dy), 0.4, 2.4) * wb);
      rJul[i] = Math.max(0, up(o1.P, x, y) * clamp(1 + 9 * (up(o1.u, x, y) * dx + up(o1.v, x, y) * dy), 0.4, 2.4) * wb);
    } }
  w.climateStamp = (w.climateStamp || 0) + 1;
}

// What the land can carry, worked out from climate, water and soil.
export function derive(w) {
  const { tJan, tJul, rJan, rJul, tMean, rMean, mi, gCap, tCap, soil, ice, water, fresh, h, river, crop } = w, sea = w.params.sea;
  let iceN = 0, landN = 0, landIce = 0;
  for (let i = 0; i < N; i++) {
    const a = tJan[i], b = tJul[i], tm = (a + b) * 0.5, tw = a > b ? a : b, pm = (rJan[i] + rJul[i]) * 0.5;
    tMean[i] = tm; rMean[i] = pm;
    const pet = 0.2 + 0.042 * Math.max(0, tm + 2); let m = pm / pet; const dryM = m;
    if (water[i] !== 1) { const f = fresh[i]; if (f < 4) m += (river[i] >= 2 || water[i] === 2 ? 0.75 : 0.4) * (1 - f / 4); }
    mi[i] = m;
    const wasIce = ice[i]; ice[i] = (water[i] === 1 ? tw < -2.5 : tw < (wasIce ? 0.5 : -1)) ? 1 : 0; if (ice[i]) iceN++;
    if (water[i] === 1) { gCap[i] = 0; tCap[i] = 0; crop[i] = 0; continue; }
    landN++; if (ice[i]) landIce++;
    const lo = Math.min(rJan[i], rJul[i]), hi = Math.max(rJan[i], rJul[i]) + 1e-4, dry = 1 - lo / hi, sf = 0.45 + 0.55 * Math.min(1, soil[i]);
    const rock = smooth(0.42, 0.7, h[i] - sea);
    gCap[i] = ice[i] ? 0 : smooth(0.07, 0.55, m) * smooth(-7, 5, tw) * (1 - rock * 0.8) * (0.6 + 0.4 * sf);
    crop[i] = ice[i] ? 0 : smooth(0.36, 0.95, dryM) * smooth(8, 15, tw) * (1 - smooth(30, 36, tw)) * (1 - rock);
    tCap[i] = ice[i] ? 0 : smooth(0.5, 1.05, m) * smooth(7, 13, tw) * (1 - 0.45 * dry * (m < 1.5 ? 1 : 0.3)) * (1 - rock) * sf;
  }
  w.iceFrac = iceN / N; w.landIce = landN ? landIce / landN : 0;
}
