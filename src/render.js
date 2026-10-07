// WebGL terrain plus a 2D overlay for everything that is a line or a sprite.
import { W, H, N, clamp, hash2, wrapDx } from './core.js';
import { VERT, FRAG } from './shader.js';

export function createRenderer(glc) {
  const gl = glc.getContext('webgl2', { antialias: false, alpha: false, preserveDrawingBuffer: true });
  if (!gl) return null;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {}; for (const n of ['uElev', 'uA', 'uB', 'uC', 'uRes', 'uCenter', 'uZoom', 'uSea', 'uTime', 'uPhase', 'uLens', 'uPal']) U[n] = gl.getUniformLocation(prog, n);
  const mk = (unit, filter) => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; };
  const tE = mk(0, gl.LINEAR), tA = mk(1, gl.LINEAR), tB = mk(2, gl.LINEAR), tC = mk(3, gl.NEAREST);
  gl.uniform1i(U.uElev, 0); gl.uniform1i(U.uA, 1); gl.uniform1i(U.uB, 2); gl.uniform1i(U.uC, 3);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  const bA = new Uint8Array(N * 4), bB = new Uint8Array(N * 4), bC = new Uint8Array(N * 4);
  let landStamp = -1, lastW = null;
  const R = {
    gl,
    upload(w, lens) {
      if (w.stamp.land !== landStamp || w !== lastW) { landStamp = w.stamp.land; lastW = w; gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tE); gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, W, H, 0, gl.RED, gl.FLOAT, w.h); }
      const { temp, mi, g, t, snow, water, filled, h, green, tMean, ocult, farm, urban, fireT, ash, ice, lava, plate, soil, magic } = w;
      for (let i = 0, j = 0; i < N; i++, j += 4) {
        let v = (temp[i] + 40) * 3.1875; bA[j] = v < 0 ? 0 : v > 255 ? 255 : v; v = mi[i] * 102; bA[j + 1] = v > 255 ? 255 : v; bA[j + 2] = g[i] * 255; bA[j + 3] = t[i] * 255;
        bB[j] = snow[i] * 255; bB[j + 1] = water[i] === 2 ? clamp(40 + (filled[i] - h[i]) * 2500, 40, 255) : 0; bB[j + 2] = green[i] * 255; v = (tMean[i] + 40) * 3.1875; bB[j + 3] = v < 0 ? 0 : v > 255 ? 255 : v;
        bC[j] = ocult[i] + 1; bC[j + 1] = (farm[i] ? 1 : 0) | (urban[i] ? 2 : 0) | (fireT[i] ? 4 : 0) | (ash[i] > 0.3 ? 8 : 0) | (ice[i] && water[i] !== 1 ? 16 : 0) | (lava[i] ? 64 : 0); bC[j + 2] = plate[i];
        v = lens === 7 ? magic[i] * 255 : soil[i] * 170; bC[j + 3] = v > 255 ? 255 : v;
      }
      const up = (unit, tex, data) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, data); };
      up(1, tA, bA); up(2, tB, bB); up(3, tC, bC);
    },
    draw(w, cam, lens, time, pal) {
      gl.viewport(0, 0, glc.width, glc.height);
      gl.uniform2f(U.uRes, glc.width, glc.height); gl.uniform2f(U.uCenter, cam.x, cam.y); gl.uniform1f(U.uZoom, cam.z * cam.dpr);
      gl.uniform1f(U.uSea, w.params.sea); gl.uniform1f(U.uTime, time); gl.uniform1f(U.uPhase, w.phase); gl.uniform1i(U.uLens, lens); gl.uniform3fv(U.uPal, pal);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
  };
  return R;
}

// World cell -> screen pixel (device px), picking the wrapped copy nearest the view centre.
export function toScreen(cam, x, y, out) { out[0] = (wrapDx(x - cam.x)) * cam.z * cam.dpr + cam.w / 2; out[1] = (y - cam.y) * cam.z * cam.dpr + cam.h / 2; return out; }
export function toWorld(cam, sx, sy) { return { x: cam.x + (sx * cam.dpr - cam.w / 2) / (cam.z * cam.dpr), y: cam.y + (sy * cam.dpr - cam.h / 2) / (cam.z * cam.dpr) }; }

const P = [0, 0], Q = [0, 0], Rr = [0, 0];
const jx = (i) => (i % W) + 0.5 + (hash2(i, 3, 11) - 0.5) * 0.7, jy = (i) => ((i / W) | 0) + 0.5 + (hash2(i, 5, 13) - 0.5) * 0.7;

export function drawRivers(ctx, w, cam) {
  const { riverList, down, river, water, snow } = w, s = cam.z * cam.dpr, halfW = cam.w / (2 * s) + 2, halfH = cam.h / (2 * s) + 2;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let lv = 1; lv <= 4; lv++) {
    if (lv === 1 && s < 3.2) continue;
    ctx.beginPath(); let any = false;
    for (let k = 0; k < riverList.length; k++) {
      const c = riverList[k]; if (river[c] !== lv) continue; const d = down[c]; if (d < 0) continue;
      const cx = jx(c), cy = jy(c); if (Math.abs(wrapDx(cx - cam.x)) > halfW || Math.abs(cy - cam.y) > halfH) continue;
      const wet = water[d] !== 0, dx = wet ? (d % W) + 0.5 : jx(d), dy = wet ? ((d / W) | 0) + 0.5 : jy(d), e = down[d];
      toScreen(cam, cx, cy, P); toScreen(cam, dx, dy, Q);
      if (Math.abs(P[0] - Q[0]) > cam.w * 0.5) continue;
      const mx = (P[0] + Q[0]) / 2, my = (P[1] + Q[1]) / 2;
      if (e >= 0 && !wet && river[d]) { const we = water[e] !== 0; toScreen(cam, we ? (e % W) + 0.5 : jx(e), we ? ((e / W) | 0) + 0.5 : jy(e), Rr); ctx.moveTo(mx, my); ctx.quadraticCurveTo(Q[0], Q[1], (Q[0] + Rr[0]) / 2, (Q[1] + Rr[1]) / 2); }
      else { ctx.moveTo(mx, my); ctx.lineTo(Q[0], Q[1]); }
      // the first reach of a river: draw from its own centre
      ctx.moveTo(P[0], P[1]); ctx.lineTo(mx, my); any = true;
    }
    if (!any) continue;
    const wd = [0, 0.11, 0.2, 0.32, 0.5][lv] * s + [0, 0.5, 0.9, 1.3, 1.8][lv] * cam.dpr;
    ctx.strokeStyle = 'rgba(22,58,84,.55)'; ctx.lineWidth = wd + 1.2 * cam.dpr; ctx.stroke();
    ctx.strokeStyle = lv >= 3 ? '#3f86b6' : '#4b94c2'; ctx.lineWidth = wd; ctx.stroke();
  }
}
