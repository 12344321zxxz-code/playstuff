// (Oct 31) Realm colours. 64 of them: the original 24 and 40 more spread evenly round the hue wheel at three
// depths. Neighbouring realms must not look alike: distance is measured in OKLab (how different two colours
// look, not how different their numbers are), and a realm that borders a look-alike is given the free colour
// that stands out most from everything around it.
const hex2rgb = (h) => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
const lin = (u) => (u <= 0.04045 ? u / 12.92 : ((u + 0.055) / 1.055) ** 2.4), gam = (u) => (u <= 0.0031308 ? 12.92 * u : 1.055 * u ** (1 / 2.4) - 0.055);
function toLab(h) { const [r, g, b] = hex2rgb(h).map(lin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s]; }
function fromLch(L, C, hDeg) { const a = C * Math.cos((hDeg * Math.PI) / 180), b = C * Math.sin((hDeg * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  return '#' + rgb.map((u) => Math.round(255 * Math.min(1, Math.max(0, gam(Math.min(1, Math.max(0, u)))))).toString(16).padStart(2, '0')).join(''); }
const BASE = ['#d7263d', '#8e44d6', '#f46d1b', '#f2efe4', '#22201e', '#e040a8', '#ffd400', '#00c2a8', '#7a3b1d', '#ff8fa3', '#3d5afe', '#9bd636', '#00a1e4', '#b56576', '#6d597a', '#e9c46a', '#577590', '#f94144', '#43aa8b', '#bc6c25', '#a2d2ff', '#cdb4db', '#606c38', '#fb8500'];
const MORE = []; for (const [L, C, off] of [[0.58, 0.15, 7], [0.78, 0.12, 25], [0.42, 0.11, 16]]) for (let k = 0; k < 14 && MORE.length < 40; k++) MORE.push(fromLch(L, C, off + (k * 360) / 14));
export const COLORS = BASE.concat(MORE);
export const NCOL = COLORS.length;   /* 64 */
const LAB = COLORS.map(toLab);
export const colDist = (i, j) => { const a = LAB[i], b = LAB[j]; return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); };
export const TOO_CLOSE = 0.13;
// the free colour slot that stands furthest from the given slots (ties broken by the world's dice)
export function bestSlot(used, avoid, rnd) {
  let best = -1, bd = -1;
  for (let k = 0; k < NCOL; k++) { if (used[k]) continue; let d = 9; for (const a of avoid) d = Math.min(d, colDist(k, a)); d += 0.01 * rnd(); if (d > bd) { bd = d; best = k; } }
  return best < 0 ? (rnd() * NCOL) | 0 : best;
}
