// Rivers and roads as smooth ribbons. Polylines are built here from the worker's cells, rounded
// off, and turned into triangle strips whose width is part world-scale, part screen-scale, so a
// great river is broad when you are close and still a clear line from far away.
import { program } from './terrain';
import { W, H } from '../../sim/core';

const VS = `#version 300 es
in vec2 aPos; in vec2 aNrm; in vec3 aW;   // aW: side, width in cells, min width in px
in float aDist;
uniform vec2 uRes, uCenter; uniform float uZoom, uDpr, uAdd, uMinZoomPx;
out float vDist; out float vSide; out float vWpx;
void main() {
  float wpx = max(aW.y * uZoom, aW.z * uDpr) + uAdd * uDpr;
  vec2 sp = (aPos - uCenter) * uZoom + uRes * 0.5 + aNrm * aW.x * wpx * 0.5;
  gl_Position = vec4(sp.x / uRes.x * 2.0 - 1.0, 1.0 - sp.y / uRes.y * 2.0, 0.0, 1.0);
  vDist = aDist * uZoom / uDpr; vSide = aW.x; vWpx = wpx;
}`;
const FS = `#version 300 es
precision mediump float;
uniform vec4 uCol; uniform float uDash, uAlpha;
in float vDist; in float vSide; in float vWpx; out vec4 frag;
void main() {
  float edge = 1.0 - smoothstep(vWpx * 0.5 - 1.0, vWpx * 0.5, abs(vSide) * vWpx * 0.5);
  float d = uDash > 0.0 ? step(0.45, fract(vDist / uDash)) : 1.0;
  float a = uCol.a * edge * d * uAlpha;
  frag = vec4(uCol.rgb * a, a);
}`;

export interface Line { pts: number[]; w: number[]; min: number[] }   // pts: x,y pairs; w: width in cells per point; min: min px per point

export function createLines(gl: WebGL2RenderingContext) {
  const prog = program(gl, VS, FS);
  const U: Record<string, WebGLUniformLocation | null> = {}; for (const n of ['uRes', 'uCenter', 'uZoom', 'uDpr', 'uAdd', 'uCol', 'uDash', 'uAlpha']) U[n] = gl.getUniformLocation(prog, n);
  const mk = () => { const vao = gl.createVertexArray()!, buf = gl.createBuffer()!, ib = gl.createBuffer()!; gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buf); const S = 8 * 4;
    const at = (n: string, s: number, off: number) => { const l = gl.getAttribLocation(prog, n); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, s, gl.FLOAT, false, S, off); };
    at('aPos', 2, 0); at('aNrm', 2, 8); at('aW', 3, 16); at('aDist', 1, 28); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bindVertexArray(null); return { vao, buf, ib, n: 0 }; };
  const sets: Record<string, ReturnType<typeof mk>> = {};
  return {
    set(name: string, lines: Line[]) {
      const s = sets[name] || (sets[name] = mk());
      let nv = 0, ni = 0; for (const L of lines) { const k = L.pts.length / 2; if (k < 2) continue; nv += k * 2; ni += (k - 1) * 6; }
      const v = new Float32Array(nv * 8), idx = new Uint32Array(ni); let vo = 0, io = 0, base = 0;
      for (const L of lines) {
        const P = L.pts, k = P.length / 2; if (k < 2) continue; let dist = 0;
        for (let i = 0; i < k; i++) {
          const x = P[i * 2], y = P[i * 2 + 1], ax = i > 0 ? P[i * 2 - 2] : x, ay = i > 0 ? P[i * 2 - 1] : y, bx = i < k - 1 ? P[i * 2 + 2] : x, by = i < k - 1 ? P[i * 2 + 3] : y;
          let tx = bx - ax, ty = by - ay; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
          if (i > 0) dist += Math.hypot(x - ax, y - ay);
          for (const sd of [-1, 1]) { v[vo++] = x; v[vo++] = y; v[vo++] = -ty; v[vo++] = tx; v[vo++] = sd; v[vo++] = L.w[i]; v[vo++] = L.min[i]; v[vo++] = dist; }
        }
        for (let i = 0; i < k - 1; i++) { const a = base + i * 2; idx[io++] = a; idx[io++] = a + 1; idx[io++] = a + 2; idx[io++] = a + 1; idx[io++] = a + 3; idx[io++] = a + 2; }
        base += k * 2;
      }
      gl.bindVertexArray(s.vao); gl.bindBuffer(gl.ARRAY_BUFFER, s.buf); gl.bufferData(gl.ARRAY_BUFFER, v, gl.STATIC_DRAW); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, s.ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW); gl.bindVertexArray(null); s.n = io;
    },
    draw(name: string, cam: { x: number; y: number; z: number; dpr: number }, vw: number, vh: number, col: number[], add = 0, dash = 0, alpha = 1) {
      const s = sets[name]; if (!s || !s.n) return;
      gl.useProgram(prog); gl.bindVertexArray(s.vao);
      gl.uniform2f(U.uRes, vw, vh); gl.uniform2f(U.uCenter, cam.x, cam.y); gl.uniform1f(U.uZoom, cam.z * cam.dpr); gl.uniform1f(U.uDpr, cam.dpr); gl.uniform1f(U.uAdd, add); gl.uniform4f(U.uCol, col[0], col[1], col[2], col[3]); gl.uniform1f(U.uDash, dash); gl.uniform1f(U.uAlpha, alpha);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawElements(gl.TRIANGLES, s.n, gl.UNSIGNED_INT, 0);
      gl.disable(gl.BLEND); gl.bindVertexArray(null);
    },
  };
}

// Rivers from the drainage: trace each one from its source down to the sea or to the river it
// joins, then round the corners.
function hashf(i: number, k: number) { let h = Math.imul(i, 374761393) ^ Math.imul(k, 668265263); h = Math.imul(h ^ (h >>> 13), 1103515245); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
const jx = (i: number) => (i % W) + 0.5 + (hashf(i, 3) - 0.5) * 0.6, jy = (i: number) => ((i / W) | 0) + 0.5 + (hashf(i, 5) - 0.5) * 0.6;
const RW = [0, 0.16, 0.26, 0.4, 0.62], RMIN = [0, 0.7, 1.1, 1.5, 2.1];
export function riverLines(river: Uint8Array, down: Int32Array, water: Uint8Array, minLevel: number): Line[] {
  const N = W * H, ups = new Uint8Array(N), seen = new Uint8Array(N), out: Line[] = [];
  for (let i = 0; i < N; i++) { if (river[i] < minLevel) continue; const d = down[i]; if (d >= 0 && river[d] >= minLevel) ups[d]++; }
  for (let i = 0; i < N; i++) {
    if (river[i] < minLevel || ups[i] !== 0 || water[i]) continue;
    const pts: number[] = [], wd: number[] = [], mn: number[] = []; let c = i, guard = 0;
    while (c >= 0 && guard++ < 4000) {
      const lv = Math.max(river[c], minLevel), wet = water[c] !== 0;
      pts.push(wet ? (c % W) + 0.5 : jx(c), wet ? ((c / W) | 0) + 0.5 : jy(c)); wd.push(RW[Math.min(4, lv)]); mn.push(RMIN[Math.min(4, lv)]);
      if (wet || seen[c]) break; seen[c] = 1; const d = down[c]; if (d < 0) break;
      // wrapping east-west: stop at the seam rather than draw a line across the map
      if (Math.abs((d % W) - (c % W)) > 2) break;
      c = d;
    }
    if (pts.length >= 4) out.push(chaikin({ pts, w: wd, min: mn }, 2));
  }
  return out;
}
export function chaikin(L: Line, it: number): Line {
  for (let r = 0; r < it; r++) {
    const P = L.pts, k = P.length / 2; if (k < 3) return L; const np = [P[0], P[1]], nw = [L.w[0]], nm = [L.min[0]];
    for (let i = 0; i < k - 1; i++) { const ax = P[i * 2], ay = P[i * 2 + 1], bx = P[i * 2 + 2], by = P[i * 2 + 3], wa = L.w[i], wb = L.w[i + 1], ma = L.min[i], mb = L.min[i + 1];
      np.push(ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25, ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75); nw.push(wa * 0.75 + wb * 0.25, wa * 0.25 + wb * 0.75); nm.push(ma * 0.75 + mb * 0.25, ma * 0.25 + mb * 0.75); }
    np.push(P[k * 2 - 2], P[k * 2 - 1]); nw.push(L.w[k - 1]); nm.push(L.min[k - 1]);
    L = { pts: np, w: nw, min: nm };
  }
  return L;
}
export function roadLines(roads: { path: Int32Array }[]): Line[] {
  const out: Line[] = [];
  for (const r of roads) { const pts: number[] = [], w: number[] = [], mn: number[] = []; let lx = -1; for (let k = 0; k < r.path.length; k++) { const i = r.path[k], x = (i % W) + 0.5, y = ((i / W) | 0) + 0.5; if (lx >= 0 && Math.abs(x - lx) > 3) { if (pts.length >= 4) out.push(chaikin({ pts: pts.splice(0), w: w.splice(0), min: mn.splice(0) }, 2)); } pts.push(x, y); w.push(0.14); mn.push(1); lx = x; } if (pts.length >= 4) out.push(chaikin({ pts, w, min: mn }, 2)); }
  return out;
}
