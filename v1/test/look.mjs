// Dump quick-look maps of a fresh world: natural colours, temperature, rain, plates.
import { W, H, N, clamp, smooth } from '../src/core.js';
import { makeWorld, tick } from '../src/world.js';
import { writePNG } from './png.mjs';
const seed = +(process.argv[2] || 7), out = process.argv[3] || '/tmp';
let t0 = Date.now(); const w = makeWorld(seed); console.log('gen ms', Date.now() - t0);
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function natural() { const b = Buffer.alloc(N * 3);
  for (let i = 0; i < N; i++) { let c; const hh = w.h[i] - w.params.sea;
    if (w.water[i] === 1) c = mix([70, 150, 180], [18, 50, 90], clamp(-hh / 0.4, 0, 1));
    else if (w.water[i] === 2) c = [90, 160, 200];
    else { const m = w.mi[i], T = w.tMean[i]; c = mix([214, 194, 146], [150, 150, 120], smooth(22, 2, T)); c = mix(c, T > 18 ? [150, 180, 80] : [120, 165, 85], w.g[i]); c = mix(c, T > 20 ? [30, 105, 55] : T > 5 ? [46, 120, 62] : [36, 84, 74], w.t[i]); c = mix(c, [140, 132, 124], smooth(0.4, 0.7, hh));
      const sh = clamp((w.h[i] - w.h[(i - 1 - W + N) % N]) * 900, -40, 40); c = [c[0] + sh, c[1] + sh, c[2] + sh];
      if (w.river[i]) c = mix(c, [60, 130, 200], 0.35 + 0.15 * w.river[i]); }
    if (w.ice[i]) c = [236, 242, 248];
    b[i * 3] = clamp(c[0], 0, 255); b[i * 3 + 1] = clamp(c[1], 0, 255); b[i * 3 + 2] = clamp(c[2], 0, 255); }
  return b; }
function scalar(f, lo, hi, pal) { const b = Buffer.alloc(N * 3); for (let i = 0; i < N; i++) { const v = clamp((f[i] - lo) / (hi - lo), 0, 1), c = pal(v, i); b[i * 3] = c[0]; b[i * 3 + 1] = c[1]; b[i * 3 + 2] = c[2]; } return b; }
const heat = (v) => v < 0.5 ? mix([40, 60, 160], [240, 240, 220], v * 2) : mix([240, 240, 220], [200, 40, 30], v * 2 - 2 + 1);
const wetp = (v, i) => w.water[i] === 1 ? mix([30, 30, 40], [60, 60, 80], v) : mix([225, 200, 150], [20, 110, 90], Math.sqrt(v));
writePNG(out + '/nat.png', W, H, natural());
writePNG(out + '/tjan.png', W, H, scalar(w.tJan, -40, 40, heat)); writePNG(out + '/tjul.png', W, H, scalar(w.tJul, -40, 40, heat));
writePNG(out + '/rain.png', W, H, scalar(w.rMean, 0, 2.5, wetp)); writePNG(out + '/mi.png', W, H, scalar(w.mi, 0, 2, wetp));
writePNG(out + '/plates.png', W, H, scalar(w.plate, 0, 16, (v, i) => { const p = w.plates[w.plate[i]]; const k = p.id * 37 % 100; return p.land ? [150 + k, 130 + k / 2, 90] : [40 + k / 2, 80 + k, 150]; }));
let land = 0, ice = 0, riv = 0, lake = 0, sr = 0, st = 0, des = 0, forest = 0, grass = 0, mxh = 0;
for (let i = 0; i < N; i++) { if (w.water[i] === 1) continue; land++; if (w.ice[i]) ice++; if (w.river[i]) riv++; if (w.water[i] === 2) lake++; sr += w.rMean[i]; st += w.tMean[i]; if (w.mi[i] < 0.2) des++; if (w.t[i] > 0.5) forest++; if (w.g[i] > 0.5) grass++; if (w.h[i] > mxh) mxh = w.h[i]; }
console.log({ land: (land / N).toFixed(2), ice: (ice / land).toFixed(2), river: (riv / land).toFixed(3), lake: (lake / land).toFixed(3), meanRain: (sr / land).toFixed(2), meanT: (st / land).toFixed(1), desert: (des / land).toFixed(2), forest: (forest / land).toFixed(2), grass: (grass / land).toFixed(2), maxH: mxh.toFixed(2), volcanoes: w.volcanoes.length, plates: w.plates.length });
t0 = Date.now(); for (let k = 0; k < 800; k++) tick(w); console.log('ms/tick over 100 years', ((Date.now() - t0) / 800).toFixed(2));
writePNG(out + '/nat100.png', W, H, natural());
{ const b = Buffer.alloc(N * 3); for (let i = 0; i < N; i++) { const v = w.h[i]; const c = v < 0 ? mix([20, 40, 90], [120, 190, 220], clamp(1 + v / 0.6, 0, 1)) : mix([70, 130, 70], [250, 245, 240], clamp(v / 0.8, 0, 1)); b[i * 3] = c[0]; b[i * 3 + 1] = c[1]; b[i * 3 + 2] = c[2]; } writePNG(out + '/height.png', W, H, b); }
{ // rain and heat by latitude band
  const rows = []; for (let band = 0; band < 8; band++) { let lr = 0, ln = 0, or = 0, on = 0, lt = 0; for (let y = band * 32; y < band * 32 + 32; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (w.water[i] === 1) { or += w.rMean[i]; on++; } else { lr += w.rMean[i]; lt += w.tMean[i]; ln++; } } rows.push(`lat ${(85 - band * 21.25 - 10.6).toFixed(0)}: land rain ${(lr / (ln || 1)).toFixed(2)} T ${(lt / (ln || 1)).toFixed(0)} (n ${ln}) | sea rain ${(or / (on || 1)).toFixed(2)}`); } console.log(rows.join('\n')); }
