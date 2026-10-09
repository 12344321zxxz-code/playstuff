// Climate zones, in the manner of Köppen: from the warmest and coldest months, the rain, and
// which half of the year is dry. This is what the Climate lens paints and what Look reports.
import { N } from './core.js';

export const ZONES = [
  null,
  { key: 'Af', name: 'Tropical rainforest', col: '#0b5e2a' },
  { key: 'Aw', name: 'Tropical savanna', col: '#4fae4a' },
  { key: 'BWh', name: 'Hot desert', col: '#f2c25c' },
  { key: 'BWk', name: 'Cold desert', col: '#d8c79a' },
  { key: 'BSh', name: 'Hot steppe', col: '#d99a3c' },
  { key: 'BSk', name: 'Cold steppe', col: '#c2a76b' },
  { key: 'Cs', name: 'Mediterranean', col: '#e8e050' },
  { key: 'Cw', name: 'Monsoon temperate', col: '#9bd468' },
  { key: 'Cf', name: 'Temperate humid', col: '#5fbf74' },
  { key: 'Df', name: 'Continental', col: '#5f8fd4' },
  { key: 'Dw', name: 'Continental, dry winters', col: '#8f9ed8' },
  { key: 'ET', name: 'Tundra', col: '#a8bcbc' },
  { key: 'EF', name: 'Ice cap', col: '#eaf2f8' },
];
export function zoneOf(w, i) {
  if (w.water[i] === 1) return 0;
  const a = w.tJan[i], b = w.tJul[i], hot = Math.max(a, b), cold = Math.min(a, b), Tm = (a + b) / 2;
  const rW = a > b ? w.rJan[i] : w.rJul[i], rC = a > b ? w.rJul[i] : w.rJan[i], m = w.mi[i];
  if (hot < 0) return 13; if (hot < 10) return 12;
  if (m < 0.22) return Tm > 18 ? 3 : 4;
  if (m < 0.45) return Tm > 18 ? 5 : 6;
  const dry = Math.min(rW, rC) < 0.33 * Math.max(rW, rC) + 0.02, summerDry = rW < rC;
  if (cold >= 18) return dry ? 2 : 1;
  if (cold > -3) return dry ? (summerDry ? 7 : 8) : 9;
  return dry && !summerDry ? 11 : 10;
}
export function zoneMap(w, out) { for (let i = 0; i < N; i++) out[i] = zoneOf(w, i); return out; }
