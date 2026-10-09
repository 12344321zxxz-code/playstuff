// GL side of the atlas: textures from the worker's packets, plus two fields worked out here on
// the main thread: distance to the coast (for ripple lines and the inked shore) and realm and
// faith borders at full resolution (for the hand-coloured bands).
import { TERRAIN_VS, TERRAIN_FS } from './terrainShader';
import { W, H, N, CW, CH, CN } from '../../sim/core';

export function program(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader'); return s; };
  const p = gl.createProgram()!; gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link');
  return p;
}
export function tex(gl: WebGL2RenderingContext, filter: number) {
  const t = gl.createTexture()!; gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return t;
}
const hex = (c: string) => [parseInt(c.slice(1, 3), 16) / 255, parseInt(c.slice(3, 5), 16) / 255, parseInt(c.slice(5, 7), 16) / 255];

export function createTerrain(gl: WebGL2RenderingContext) {
  const prog = program(gl, TERRAIN_VS, TERRAIN_FS);
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  const U: Record<string, WebGLUniformLocation | null> = {};
  for (const n of ['uElev', 'uA', 'uB', 'uC', 'uCoast', 'uRealm', 'uCoarse', 'uWorks', 'uRes', 'uCenter', 'uMap', 'uZoom', 'uSea', 'uTime', 'uPhase', 'uDpr', 'uSolar', 'uLens', 'uPal', 'uFaith', 'uCoarseSize']) U[n] = gl.getUniformLocation(prog, n);
  const L = gl.LINEAR, NE = gl.NEAREST;
  const T = { elev: tex(gl, L), A: tex(gl, L), B: tex(gl, L), C: tex(gl, NE), coast: tex(gl, L), realm: tex(gl, L), coarse: tex(gl, L), works: tex(gl, L) };
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  const init = (t: WebGLTexture, ifmt: number, w: number, h: number, fmt: number, type: number) => { gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, w, h, 0, fmt, type, null); };
  init(T.elev, gl.R16F, W, H, gl.RED, gl.FLOAT); init(T.coast, gl.R16F, W, H, gl.RED, gl.FLOAT);
  for (const k of ['A', 'B', 'C', 'realm', 'works'] as const) init(T[k], gl.RGBA8, W, H, gl.RGBA, gl.UNSIGNED_BYTE);
  init(T.coarse, gl.RGBA8, CW, CH * 2, gl.RGBA, gl.UNSIGNED_BYTE);
  const pal = new Float32Array(96), fpal = new Float32Array(48);

  const coast = new Float32Array(N), realmBuf = new Uint8Array(N * 4);
  const R = {
    setPalette(colors: string[], faith: string[]) { colors.forEach((c, k) => { if (k < 32) pal.set(hex(c), k * 3); }); faith.forEach((c, k) => { if (k < 16) fpal.set(hex(c), k * 3); }); },
    land(h: Float32Array, water: Uint8Array) {
      gl.bindTexture(gl.TEXTURE_2D, T.elev); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, H, gl.RED, gl.FLOAT, h);
      coastField(water, coast); gl.bindTexture(gl.TEXTURE_2D, T.coast); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, H, gl.RED, gl.FLOAT, coast);
    },
    fine(u8: Uint8Array) {
      const up = (t: WebGLTexture, off: number) => { gl.bindTexture(gl.TEXTURE_2D, t); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, u8.subarray(off, off + N * 4)); };
      up(T.A, 0); up(T.B, N * 4); up(T.C, N * 8);
    },
    coarse(c: Uint8Array, water: Uint8Array | null) {
      gl.bindTexture(gl.TEXTURE_2D, T.coarse); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, CW, CH * 2, gl.RGBA, gl.UNSIGNED_BYTE, c);
      if (water) { realmField(c, water, realmBuf); gl.bindTexture(gl.TEXTURE_2D, T.realm); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, realmBuf); }
    },
    works(e: Uint8Array) { gl.bindTexture(gl.TEXTURE_2D, T.works); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, e); },
    realmAt: (i: number) => realmBuf[i * 4],
    coastAt: (i: number) => coast[i],
    draw(cam: { x: number; y: number; z: number; dpr: number }, vw: number, vh: number, o: { sea: number; time: number; phase: number; lens: number; solar: number }) {
      gl.useProgram(prog); gl.bindVertexArray(vao);
      const units: [string, WebGLTexture][] = [['uElev', T.elev], ['uA', T.A], ['uB', T.B], ['uC', T.C], ['uCoast', T.coast], ['uRealm', T.realm], ['uCoarse', T.coarse], ['uWorks', T.works]];
      units.forEach(([n, t], k) => { gl.activeTexture(gl.TEXTURE0 + k); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(U[n], k); });
      gl.uniform2f(U.uRes, vw, vh); gl.uniform2f(U.uCenter, cam.x, cam.y); gl.uniform2f(U.uMap, W, H); gl.uniform2f(U.uCoarseSize, CW, CH);
      gl.uniform1f(U.uZoom, cam.z * cam.dpr); gl.uniform1f(U.uDpr, cam.dpr); gl.uniform1f(U.uSea, o.sea); gl.uniform1f(U.uTime, o.time); gl.uniform1f(U.uPhase, o.phase); gl.uniform1f(U.uSolar, o.solar);
      gl.uniform1i(U.uLens, o.lens); gl.uniform3fv(U.uPal, pal); gl.uniform3fv(U.uFaith, fpal);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); gl.bindVertexArray(null);
    },
  };
  return R;
}

// Signed distance to the shore, in cells: positive on land, negative on water (sea or lake).
const dl = new Float32Array(N), dw = new Float32Array(N);
function chamfer(d: Float32Array) {
  const D = Math.SQRT2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; let v = d[i]; if (v === 0) continue; if (x > 0) v = Math.min(v, d[i - 1] + 1); if (y > 0) { v = Math.min(v, d[i - W] + 1); if (x > 0) v = Math.min(v, d[i - W - 1] + D); if (x < W - 1) v = Math.min(v, d[i - W + 1] + D); } d[i] = v; }
  for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) { const i = y * W + x; let v = d[i]; if (v === 0) continue; if (x < W - 1) v = Math.min(v, d[i + 1] + 1); if (y < H - 1) { v = Math.min(v, d[i + W] + 1); if (x < W - 1) v = Math.min(v, d[i + W + 1] + D); if (x > 0) v = Math.min(v, d[i + W - 1] + D); } d[i] = v; }
}
export function coastField(water: Uint8Array, out: Float32Array) {
  for (let i = 0; i < N; i++) { const wet = water[i] !== 0; dl[i] = wet ? 0 : 1e4; dw[i] = wet ? 1e4 : 0; }
  chamfer(dl); chamfer(dw);
  for (let i = 0; i < N; i++) out[i] = water[i] !== 0 ? -Math.min(32, dw[i] - 0.5) : Math.min(32, dl[i] - 0.5);
}
// Realm and faith ids at full resolution, picked from the coarse maps with a little noise so the
// borders wander like hand-drawn ones, and each cell's distance to the nearest border.
const ids = new Uint8Array(N), fids = new Uint8Array(N), d1 = new Float32Array(N);
function hash(x: number, y: number) { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263); h = Math.imul(h ^ (h >>> 13), 1103515245); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x: number, y: number, s: number) { const xi = Math.floor(x), yi = Math.floor(y); let xf = x - xi, yf = y - yi; xf = xf * xf * (3 - 2 * xf); yf = yf * yf * (3 - 2 * yf); const h = (a: number, b: number) => hash(a * 31 + s, b * 17 - s); const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1); return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf; }
function realmField(c: Uint8Array, water: Uint8Array, out: Uint8Array) {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; if (water[i] === 1) { ids[i] = 0; fids[i] = 0; continue; }
    // bilinear vote among the four nearest coarse cells
    const fx = (x + 0.5) / 4 - 0.5 + (vnoise(x * 0.25, y * 0.25, 1) - 0.5) * 1.0 + (hash(x, y) - 0.5) * 0.25, fy = (y + 0.5) / 4 - 0.5 + (vnoise(x * 0.25, y * 0.25, 7) - 0.5) * 1.0 + (hash(y + 999, x) - 0.5) * 0.25;
    const cx = Math.max(0, Math.min(CW - 1, Math.round(fx))), cy = Math.max(0, Math.min(CH - 1, Math.round(fy))), ci = (cy * CW + cx) * 4;
    ids[i] = c[ci]; fids[i] = c[ci + 1];
  }
  for (const pass of [0, 1]) {
    const src = pass ? fids : ids;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x, v = src[i]; const edge = v !== 0 && ((x > 0 && src[i - 1] !== v) || (x < W - 1 && src[i + 1] !== v) || (y > 0 && src[i - W] !== v) || (y < H - 1 && src[i + W] !== v)); d1[i] = edge ? 0 : v === 0 ? 0 : 1e4; }
    chamfer(d1);
    for (let i = 0; i < N; i++) out[i * 4 + (pass ? 2 : 1)] = Math.min(255, (d1[i] + 0.5) * 8);
  }
  for (let i = 0; i < N; i++) { out[i * 4] = ids[i]; out[i * 4 + 3] = fids[i]; }
}
