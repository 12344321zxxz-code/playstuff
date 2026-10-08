// @ts-nocheck
// Weather from year to year. Climate says what a place is like on average; this says what kind
// of decade it is having. Slow blobs of wet and dry drift over the map, so the same valley has
// fat years and lean years, and whole regions fail together.
import { W, CS, CW, CH, CN, clamp, cyl, smooth } from './core';
import { ev, discover } from './story';

const SPAN = 7;       // years between one pattern and the next
function pattern(w, k, out) {
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) out[y * CW + x] = (cyl(x * CS, y * CS, 1 / 78, w.seed + 900 + k * 17, 2) - 0.5) * 3.1;
  return out;
}
export function initWeather(w) {
  w.wetA = new Float32Array(CN).fill(1); w._wa = pattern(w, 0, new Float32Array(CN)); w._wb = pattern(w, 1, new Float32Array(CN)); w._wk = 0; w.dryRun = new Uint8Array(CN);
  if (w.params.mood == null) w.params.mood = 1;
}
export function weatherYear(w) {
  // the sun itself wanders a little over the centuries: long warm ages, long cold ones
  // (it starts from where the world was made, so nothing lurches in year one)
  const u = ((w.seed >>> 3) % 100) / 100, sg = w.seed & 1 ? 1 : -1, was = w.solar || 0; const sun0 = sg * (1.7 * Math.sin(w.year / (60 + 30 * u)) + 0.8 * Math.sin(w.year / (23 + 11 * u))) * w.params.mood;
  // and over thousands of years the great cycle: ice ages and the long warm spells between them
  const glacial = -2.6 * Math.max(0, Math.sin((w.year + 400 * u) / (300 + 120 * u))) ** 3 * w.params.mood;
  if (w.forcing) { if (w.year > (w.forcingUntil || 0)) w.forcing *= 0.94; if (Math.abs(w.forcing) < 0.05) w.forcing = 0; }
  w.solar = sun0 + glacial + (w.forcing || 0);
  if (w.solar < -1.9 && was >= -1.9 && discover(w, 'cold', null, null)) ev(w, 'The summers are getting shorter. Old people say it was not always like this.', null, null, null, 2);
  else if (w.solar > 1.9 && was <= 1.9 && discover(w, 'warm', null, null)) ev(w, 'A run of long warm summers. Farmers are planting further toward the poles than anyone remembers.', null, null, null);
  pat(w);
}
function pat(w) {
  const k = Math.floor(w.year / SPAN), f = smooth(0, 1, (w.year % SPAN) / SPAN), mood = w.params.mood, a = w.wetA, run = w.dryRun;
  if (k !== w._wk) { const t = w._wa; w._wa = w._wb; w._wb = pattern(w, k + 1, t); w._wk = k; }
  const A = w._wa, B = w._wb, s = w.seed + 5000 + w.year * 31;
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
    const i = y * CW + x, v = A[i] + (B[i] - A[i]) * f + (cyl(x * CS, y * CS, 1 / 40, s, 1) - 0.5) * 0.7;
    const m = clamp(1 + v * mood, 0.3, 1.75); a[i] = m; run[i] = m < 0.72 ? Math.min(40, run[i] + 1) : 0;
  }
}
// this year's rain here, as a multiple of the usual
export const wetAt = (w, x, y) => w.wetA[(y >> 2) * CW + (x >> 2)];
export const dryYears = (w, x, y) => w.dryRun[(y >> 2) * CW + (x >> 2)];
