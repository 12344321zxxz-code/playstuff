// Shared constants and small helpers. Everything else builds on this.
export const W = 512, H = 256, N = W * H;      // world grid, wraps east-west
export const CS = 4, CW = W / CS, CH = H / CS, CN = CW * CH; // coarse grid the climate runs on
export const TAU = Math.PI * 2, RAD = Math.PI / 180;
export const TPY = 8;                           // sim ticks per year

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, x) => { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
export const wx = (x) => ((x % W) + W) % W;
export const idx = (x, y) => y * W + wx(x);
export const LATS = 156;                        // degrees of latitude the map spans
export const latOf = (y) => (0.5 - (y + 0.5) / H) * LATS;   // degrees, +north
export const wrapDx = (dx) => (dx > W / 2 ? dx - W : dx < -W / 2 ? dx + W : dx);
export const dist2 = (x0, y0, x1, y1) => { const dx = wrapDx(x1 - x0), dy = y1 - y0; return dx * dx + dy * dy; };

export function rng(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hash3(x, y, z, s) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1274126177) ^ Math.imul(s, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
export const hash2 = (x, y, s) => hash3(x, y, 0, s);
export function vnoise3(x, y, z, s) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  let xf = x - xi, yf = y - yi, zf = z - zi;
  xf = xf * xf * (3 - 2 * xf); yf = yf * yf * (3 - 2 * yf); zf = zf * zf * (3 - 2 * zf);
  const a = hash3(xi, yi, zi, s), b = hash3(xi + 1, yi, zi, s), c = hash3(xi, yi + 1, zi, s), d = hash3(xi + 1, yi + 1, zi, s);
  const e = hash3(xi, yi, zi + 1, s), f = hash3(xi + 1, yi, zi + 1, s), g = hash3(xi, yi + 1, zi + 1, s), k = hash3(xi + 1, yi + 1, zi + 1, s);
  const ab = a + (b - a) * xf, cd = c + (d - c) * xf, ef = e + (f - e) * xf, gk = g + (k - g) * xf;
  const lo = ab + (cd - ab) * yf, hi = ef + (gk - ef) * yf;
  return lo + (hi - lo) * zf;
}
export function fbm3(x, y, z, s, oct) {
  let a = 0, amp = 1, f = 1, tot = 0;
  for (let o = 0; o < oct; o++) { a += vnoise3(x * f, y * f, z * f, s + o * 101) * amp; tot += amp; amp *= 0.5; f *= 2; }
  return a / tot;
}
// Noise that wraps east-west: sample 3D noise on a cylinder.
export function cyl(x, y, f, s, oct) {
  const th = (x / W) * TAU, r = (W * f) / TAU;
  return fbm3(Math.cos(th) * r + 91.7, y * f + 13.3, Math.sin(th) * r + 47.1, s, oct);
}

// Min-heap on typed arrays, sized once.
export class Heap {
  constructor(n) { this.k = new Float32Array(n); this.v = new Int32Array(n); this.n = 0; this.key = 0; }
  clear() { this.n = 0; }
  push(key, val) {
    const k = this.k, v = this.v; let i = this.n++;
    while (i > 0) { const p = (i - 1) >> 1; if (k[p] <= key) break; k[i] = k[p]; v[i] = v[p]; i = p; }
    k[i] = key; v[i] = val;
  }
  pop() {
    const k = this.k, v = this.v, top = v[0]; this.key = k[0];
    const n = --this.n;
    if (n > 0) {
      const lk = k[n], lv = v[n]; let i = 0;
      for (;;) { let c = 2 * i + 1; if (c >= n) break; if (c + 1 < n && k[c + 1] < k[c]) c++; if (k[c] >= lk) break; k[i] = k[c]; v[i] = v[c]; i = c; }
      k[i] = lk; v[i] = lv;
    }
    return top;
  }
}

// Offsets inside a disc of radius r, precomputed.
export const DISC = [];
for (let r = 0; r <= 20; r++) { const a = []; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r + r) a.push([dx, dy, Math.sqrt(dx * dx + dy * dy)]); DISC.push(a); }
export const NB8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

// Box blur with east-west wrap, in place via a scratch buffer.
export function blur(src, w, h, r, passes, tmp) {
  tmp = tmp || new Float32Array(src.length);
  const inv = 1 / (2 * r + 1);
  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < h; y++) { const row = y * w; let acc = 0; for (let k = -r; k <= r; k++) acc += src[row + ((k % w) + w) % w]; for (let x = 0; x < w; x++) { tmp[row + x] = acc * inv; acc += src[row + (x + r + 1) % w] - src[row + ((x - r) % w + w) % w]; } }
    for (let x = 0; x < w; x++) { let acc = 0; for (let k = -r; k <= r; k++) acc += tmp[clamp(k, 0, h - 1) * w + x]; for (let y = 0; y < h; y++) { src[y * w + x] = acc * inv; acc += tmp[clamp(y + r + 1, 0, h - 1) * w + x] - tmp[clamp(y - r, 0, h - 1) * w + x]; } }
  }
  return src;
}
