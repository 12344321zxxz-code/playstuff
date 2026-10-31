// WebGL terrain plus a 2D overlay for everything that is a line or a sprite.
import { W, H, N, clamp, hash2, wrapDx } from './core.js';
import { VERT, FRAG } from './shader.js';
import { FAITH_COLORS } from './faith.js';
import { SPECIES } from './fauna.js';
import { ZONES } from './zones.js';
import { makeTexState, buildTex } from './texbuild.js';
import { KINDS, STANCES } from './memory.js';
import { PLANTS } from './origins.js';
export const ERA_COL = ['#8a8a8a', '#5fb84a', '#b8862b', '#c0392b', '#3f63d6', '#9a4fd6', '#ff8a2a', '#3fd0d0', '#ff4f9e', '#f4e04d', '#ffffff'];   // eleven ages, each its own colour (first fields green)
const CW = 128, CH = 64;

export function createRenderer(glc) {
  const gl = glc.getContext('webgl2', { antialias: false, alpha: false, preserveDrawingBuffer: true });
  if (!gl) return null;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {}; for (const n of ['uElev', 'uA', 'uB', 'uC', 'uD', 'uF', 'uRes', 'uCenter', 'uZoom', 'uSea', 'uTime', 'uDpr', 'uLens', 'uPal', 'uFaith', 'uSpec', 'uZone', 'uKind', 'uFlora', 'uStance', 'uTame', 'uSpecL', 'uOver']) U[n] = gl.getUniformLocation(prog, n);
  // every texture is read cell by cell: no smoothing anywhere, that is the look
  const mk = (unit) => { const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.REPEAT], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v); return t; };
  const tE = mk(0), tA = mk(1), tB = mk(2), tC = mk(3), tD = mk(4), tF = mk(5);
  gl.uniform1i(U.uElev, 0); gl.uniform1i(U.uA, 1); gl.uniform1i(U.uB, 2); gl.uniform1i(U.uC, 3); gl.uniform1i(U.uD, 4); gl.uniform1i(U.uF, 5);
  const rgb = (list) => { const a = new Float32Array(list.length * 3); list.forEach((c, k) => { if (!c) return; a[k * 3] = parseInt(c.slice(1, 3), 16) / 255; a[k * 3 + 1] = parseInt(c.slice(3, 5), 16) / 255; a[k * 3 + 2] = parseInt(c.slice(5, 7), 16) / 255; }); return a; };
  gl.uniform3fv(U.uFaith, rgb(FAITH_COLORS)); gl.uniform3fv(U.uSpec, rgb(SPECIES.map((s) => s.col).concat(['#7a6a5a']))); gl.uniform3fv(U.uSpecL, rgb(SPECIES.map((s) => s.lc).concat(new Array(20 - SPECIES.length).fill('#777777')))); gl.uniform1fv(U.uTame, new Float32Array(20).map((_, k) => (SPECIES[k] && SPECIES[k].tame ? 1 : 0))); gl.uniform3fv(U.uZone, rgb(ZONES.map((z) => (z ? z.col : '#000000')))); gl.uniform3fv(U.uKind, rgb(KINDS.map((k) => k.col))); gl.uniform3fv(U.uFlora, rgb(PLANTS.map((q) => q.col).concat(['#555555'])));
  const stanceRGB = new Float32Array(192), overS = new Float32Array(64);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  const TS = makeTexState();
  const up = (unit, tex, data) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, data); };
  const R = {
    gl,
    // the map textures, worked out from the world here (or handed over ready-made by the worker)
    upload(w, lens) { R.uploadTex(buildTex(w, lens, TS)); },
    uploadTex(t) {
      if (t.elev) { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tE); gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, W, H, 0, gl.RED, gl.FLOAT, t.elev); }
      up(1, tA, t.A); up(2, tB, t.B); up(3, tC, t.C); up(5, tF, t.F);
      if (t.D) { gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, tD); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG8, CW, CH, 0, gl.RG, gl.UNSIGNED_BYTE, t.D); }
    },
    draw(w, cam, lens, time, pal, q) {
      gl.viewport(0, 0, glc.width, glc.height);
      gl.uniform2f(U.uRes, glc.width, glc.height); gl.uniform2f(U.uCenter, cam.x, cam.y); gl.uniform1f(U.uZoom, cam.z * cam.dpr * (q || 1)); gl.uniform1f(U.uDpr, cam.dpr * (q || 1));
      for (const c of w.cults) { if (!c.alive) continue; const col = lens === 15 ? ERA_COL[Math.min(10, c.tech)] : STANCES[c.stance || 'revere'].col, k = c.slot * 3; stanceRGB[k] = parseInt(col.slice(1, 3), 16) / 255; stanceRGB[k + 1] = parseInt(col.slice(3, 5), 16) / 255; stanceRGB[k + 2] = parseInt(col.slice(5, 7), 16) / 255; } gl.uniform3fv(U.uStance, stanceRGB);
      overS.fill(0); for (const c of w.cults) if (c.alive && c.over && c.over.kind === 'realm') { const o = w.cults[c.over.id]; if (o && o.alive) overS[c.slot] = o.slot + 1; } gl.uniform1fv(U.uOver, overS);   /* (Oct 31) protectorates are striped in their overlord's colour */
      gl.uniform1f(U.uSea, w.params.sea); gl.uniform1f(U.uTime, time); gl.uniform1i(U.uLens, lens); gl.uniform3fv(U.uPal, pal);
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
