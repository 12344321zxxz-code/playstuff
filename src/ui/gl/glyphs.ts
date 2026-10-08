// Instanced sprites from the atlas: mountains, trees, houses, ships, beasts. Each instance is a
// world position, a size in pixels, a sprite, a tint for its owner's colour, an alpha and a
// rotation. Sorted by y on the CPU so things nearer the bottom of the page draw over those
// behind them, as on a drawn map.
import { program } from './terrain';
import { CELL, COLS, AW, AH } from '../art/sprites';

const VS = `#version 300 es
in vec2 corner; in vec2 iPos; in vec4 iP; in vec4 iTint;   // iP: size(px, negative = flipped), sprite, alpha, rot
in float iAnchor;
uniform vec2 uRes, uCenter; uniform float uZoom; uniform vec2 uCell;
out vec2 vUv; out vec2 vUvM; out vec4 vTint; out float vA;
void main() {
  float size = abs(iP.x), fl = iP.x < 0.0 ? -1.0 : 1.0, spr = iP.y, rot = iP.w;
  vec2 c = vec2((corner.x - 0.5) * fl, corner.y - iAnchor) * size;
  float cs = cos(rot), sn = sin(rot); c = vec2(c.x * cs - c.y * sn, c.x * sn + c.y * cs);
  vec2 sp = (iPos - uCenter) * uZoom + uRes * 0.5 + c;
  gl_Position = vec4(sp.x / uRes.x * 2.0 - 1.0, 1.0 - sp.y / uRes.y * 2.0, 0.0, 1.0);
  vec2 cell = vec2(mod(spr, ${COLS}.0), floor(spr / ${COLS}.0));
  vec2 uv = (cell + vec2(corner.x, corner.y)) * uCell;
  vUv = vec2(uv.x, uv.y * 0.5); vUvM = vec2(uv.x, uv.y * 0.5 + 0.5); vTint = iTint; vA = iP.z;
}`;
const FS = `#version 300 es
precision mediump float;
uniform sampler2D uAtlas;
in vec2 vUv; in vec2 vUvM; in vec4 vTint; in float vA; out vec4 frag;
void main() {
  vec4 c = texture(uAtlas, vUv); float m = texture(uAtlas, vUvM).a;
  float lum = dot(c.rgb, vec3(0.3, 0.55, 0.15));
  vec3 tinted = vTint.rgb * min(1.25, lum * 1.5 + 0.12 * c.a);
  c.rgb = mix(c.rgb, tinted, m * vTint.a);
  frag = c * vA;
}`;
export const STRIDE = 9;   // floats per instance: x, y, size, sprite, alpha, rot, anchor, tint(packed u8x4 in one float slot), spare

export function createGlyphs(gl: WebGL2RenderingContext, atlas: HTMLCanvasElement) {
  const prog = program(gl, VS, FS);
  const t = gl.createTexture()!; gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const vao = gl.createVertexArray()!; gl.bindVertexArray(vao);
  const qb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, qb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
  const lc = gl.getAttribLocation(prog, 'corner'); gl.enableVertexAttribArray(lc); gl.vertexAttribPointer(lc, 2, gl.FLOAT, false, 0, 0);
  const ib = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, ib);
  const B = STRIDE * 4;
  const at = (n: string, size: number, type: number, norm: boolean, off: number) => { const l = gl.getAttribLocation(prog, n); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, size, type, norm, B, off); gl.vertexAttribDivisor(l, 1); };
  at('iPos', 2, gl.FLOAT, false, 0); at('iP', 4, gl.FLOAT, false, 8); at('iAnchor', 1, gl.FLOAT, false, 24); at('iTint', 4, gl.UNSIGNED_BYTE, true, 28);
  gl.bindVertexArray(null);
  const U = { uRes: gl.getUniformLocation(prog, 'uRes'), uCenter: gl.getUniformLocation(prog, 'uCenter'), uZoom: gl.getUniformLocation(prog, 'uZoom'), uCell: gl.getUniformLocation(prog, 'uCell'), uAtlas: gl.getUniformLocation(prog, 'uAtlas') };
  let cap = 0;
  return {
    draw(data: ArrayBuffer, n: number, cam: { x: number; y: number; z: number; dpr: number }, vw: number, vh: number) {
      if (!n) return;
      gl.useProgram(prog); gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, ib);
      const bytes = n * B; if (bytes > cap) { cap = Math.max(bytes, cap * 2); gl.bufferData(gl.ARRAY_BUFFER, cap, gl.DYNAMIC_DRAW); }
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Uint8Array(data, 0, bytes));
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(U.uAtlas, 0);
      gl.uniform2f(U.uRes, vw, vh); gl.uniform2f(U.uCenter, cam.x, cam.y); gl.uniform1f(U.uZoom, cam.z * cam.dpr); gl.uniform2f(U.uCell, CELL / AW, CELL / AH);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, n);
      gl.disable(gl.BLEND); gl.bindVertexArray(null);
    },
  };
}

// A growable list of instances, written then sorted by y before each draw.
export class GlyphList {
  buf = new ArrayBuffer(4096 * STRIDE * 4); f = new Float32Array(this.buf); u = new Uint32Array(this.buf); n = 0;
  order = new Uint32Array(4096); keys = new Float32Array(4096);
  out = new ArrayBuffer(4096 * STRIDE * 4); of = new Float32Array(this.out); ou = new Uint32Array(this.out);
  reset() { this.n = 0; }
  grow() { const nb = new ArrayBuffer(this.buf.byteLength * 2), nf = new Float32Array(nb); nf.set(this.f); this.buf = nb; this.f = nf; this.u = new Uint32Array(nb); this.out = new ArrayBuffer(nb.byteLength); this.of = new Float32Array(this.out); this.ou = new Uint32Array(this.out); this.order = new Uint32Array(this.order.length * 2); this.keys = new Float32Array(this.keys.length * 2); }
  // tint: 0xAABBGGRR (little-endian RGBA bytes)
  push(x: number, y: number, size: number, spr: number, alpha: number, tint: number, anchor: number, rot = 0, flip = false, depth = 0) {
    if ((this.n + 1) * STRIDE > this.f.length) this.grow();
    const o = this.n * STRIDE, f = this.f; f[o] = x; f[o + 1] = y; f[o + 2] = flip ? -size : size; f[o + 3] = spr; f[o + 4] = alpha; f[o + 5] = rot; f[o + 6] = anchor; this.u[o + 7] = tint >>> 0; f[o + 8] = 0;
    this.keys[this.n] = y + depth; this.n++;
  }
  // sorted copy into `out`
  sorted() {
    const n = this.n, ord = this.order, k = this.keys; for (let i = 0; i < n; i++) ord[i] = i;
    const sub = ord.subarray(0, n); sub.sort((a, b) => k[a] - k[b]);
    for (let i = 0; i < n; i++) { const s = sub[i] * STRIDE, d = i * STRIDE; for (let q = 0; q < STRIDE; q++) this.ou[d + q] = this.u[s + q]; }
    return this.out;
  }
}
export const rgba = (r: number, g: number, b: number, a = 255) => ((a & 255) << 24) | ((b & 255) << 16) | ((g & 255) << 8) | (r & 255);
export const hexTint = (hex: string, a = 255) => rgba(parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16), a);
