// Everything on the map that is not terrain: animals, peoples, roads, ruins, dragons, storms and
// the brief flashes when something big happens. Drawn on the 2D overlay, on top of the shader.
import { W, H, TAU, TPY, CS, CW, CH, clamp, wrapDx, hash2 } from './core.js';
import { toScreen } from './render.js';
import { SPECIES } from './fauna.js';
import { COLORS, TIER, ART, ORES, colorOf, near } from './people.js';
import { hook, palette } from './main.js';

for (let k = 0; k < 32; k++) { const c = COLORS[k % COLORS.length]; palette[k * 3] = parseInt(c.slice(1, 3), 16) / 255; palette[k * 3 + 1] = parseInt(c.slice(3, 5), 16) / 255; palette[k * 3 + 2] = parseInt(c.slice(5, 7), 16) / 255; }

const A = [0, 0], B = [0, 0];
const ORE_COL = ['', '#d9843b', '#cfd6dc', '#7b4a3a', '#ffd23a', '#ffffff', '#2a2a2e'];
const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
let view = null;
const seen = (x, y, m) => Math.abs(wrapDx(x - view.x)) < view.hw + m && Math.abs(y - view.y) < view.hh + m;

function label(ctx, text, x, y, px, col, italic) {
  ctx.font = `${italic ? 'italic ' : ''}600 ${px}px "Instrument Sans", system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.lineWidth = Math.max(2.5, px * 0.28); ctx.strokeStyle = 'rgba(12,16,18,.82)'; ctx.lineJoin = 'round'; ctx.strokeText(text, x, y); ctx.fillStyle = col || '#fff'; ctx.fillText(text, x, y);
}

function drawRoads(ctx, w, cam, s) {
  if (s < 2.6 || !w.links.size) return; const P = [0, 0];
  ctx.beginPath();
  for (const L of w.links.values()) {
    if (!seen(L.a.x, L.a.y, 24)) continue; let lx = 0, first = true;
    for (let k = 0; k < L.path.length; k++) { const i = L.path[k]; toScreen(cam, (i % W) + 0.5, ((i / W) | 0) + 0.5, P); if (first || Math.abs(P[0] - lx) > cam.w * 0.5) ctx.moveTo(P[0], P[1]); else ctx.lineTo(P[0], P[1]); lx = P[0]; first = false; }
  }
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(40,28,18,.5)'; ctx.lineWidth = Math.max(1.6, s * 0.2) + 1.4 * cam.dpr; ctx.stroke();
  ctx.strokeStyle = '#d8c39a'; ctx.lineWidth = Math.max(1, s * 0.2); ctx.stroke();
}

function oreList(w) {
  if (w._oreList && w._oreStamp === (w.oreStamp || 0)) return w._oreList;
  const L = []; for (let i = 0; i < w.ore.length; i++) if (w.ore[i]) L.push(i); w._oreStamp = w.oreStamp || 0; return (w._oreList = L);
}
function drawOre(ctx, w, cam, s) {
  if (s < 7) return; const r = clamp(s * 0.16, 2.2, 6) * (cam.dpr > 1 ? 1.2 : 1);
  for (const i of oreList(w)) { const x = i % W, y = (i / W) | 0; if (!seen(x, y, 1) || w.water[i] === 1) continue; toScreen(cam, x + 0.5, y + 0.5, A);
    ctx.beginPath(); ctx.moveTo(A[0], A[1] - r); ctx.lineTo(A[0] + r, A[1]); ctx.lineTo(A[0], A[1] + r); ctx.lineTo(A[0] - r, A[1]); ctx.closePath(); ctx.fillStyle = ORE_COL[w.ore[i]]; ctx.fill(); ctx.lineWidth = 1.2 * cam.dpr; ctx.strokeStyle = '#1a1410'; ctx.stroke(); }
}

function drawVolcanoes(ctx, w, cam, s) {
  if (s < 5) return; const r = clamp(s * 0.22, 3, 8);
  for (const v of w.volcanoes) { if (!seen(v.x, v.y, 1) || w.h[v.y * W + v.x] < w.params.sea) continue; toScreen(cam, v.x + 0.5, v.y + 0.5, A); const hot = w.year - v.last < 8;
    ctx.beginPath(); ctx.moveTo(A[0] - r, A[1] + r * 0.7); ctx.lineTo(A[0] - r * 0.3, A[1] - r * 0.7); ctx.lineTo(A[0] + r * 0.3, A[1] - r * 0.7); ctx.lineTo(A[0] + r, A[1] + r * 0.7); ctx.closePath();
    ctx.fillStyle = hot ? '#ff6a1f' : '#4a3f3c'; ctx.fill(); ctx.lineWidth = 1.2 * cam.dpr; ctx.strokeStyle = '#140f0d'; ctx.stroke(); }
}

function drawRuins(ctx, w, cam, s) {
  if (s < 3.2) return; const u = clamp(s * 0.17, 1.6, 7);
  for (const r of w.ruins) {
    if (!seen(r.x, r.y, 2)) continue; toScreen(cam, r.x + 0.5, r.y + 0.5, A); const wet = r.kind === 'drowned';
    if (r.haunt) { ctx.beginPath(); ctx.arc(A[0], A[1], u * 2.6, 0, TAU); ctx.fillStyle = 'rgba(190,110,255,.28)'; ctx.fill(); }
    ctx.lineCap = 'butt'; ctx.lineWidth = Math.max(1.6, u * 0.9) + 2 * cam.dpr; ctx.strokeStyle = 'rgba(16,18,20,.75)'; pillars(ctx, A[0], A[1], u);
    ctx.lineWidth = Math.max(1.6, u * 0.9); ctx.strokeStyle = wet ? '#9fd0e0' : r.kind === 'buried' || r.kind === 'burned' || r.kind === 'sacked' ? '#b9a79c' : '#e8e2d4'; pillars(ctx, A[0], A[1], u);
    if (s >= 9) label(ctx, r.name, A[0], A[1] + u * 2 + 2, Math.round(clamp(s * 0.55, 10, 13) * cam.dpr), '#d9d2c2', true);
  }
}
function pillars(ctx, x, y, u) { ctx.beginPath(); ctx.moveTo(x - u * 1.5, y + u * 1.3); ctx.lineTo(x - u * 1.5, y - u * 1.3); ctx.moveTo(x, y + u * 1.3); ctx.lineTo(x, y - u * 0.2); ctx.moveTo(x + u * 1.5, y + u * 1.3); ctx.lineTo(x + u * 1.5, y - u * 0.8); ctx.stroke(); }

function drawAnimals(ctx, w, cam, s, frac) {
  if (s < 2.4) return; const close = s >= 13, r = clamp(s * 0.13, 1.3, 3.2);
  const tn = w.tickN;
  for (let pass = 0; pass < 2; pass++) {
    const list = pass ? w.packs : w.herds;
    for (let k = 0; k < list.length; k++) {
      const a = list[k]; if (!seen(a.x, a.y, 2)) continue;
      const f = clamp((tn - a.mt + frac) * 0.5, 0, 1), x = a.px + wrapDx(a.x - a.px) * f + 0.5, y = a.py + (a.y - a.py) * f + 0.5; toScreen(cam, x, y, A);
      const col = pass ? '#2a2a30' : SPECIES[a.sp].col;
      if (s < 6) { const q = s < 4.2 ? 1.6 : 2.2; ctx.fillStyle = pass ? 'rgba(20,20,26,.85)' : 'rgba(58,40,24,.72)'; ctx.fillRect(A[0] - q / 2, A[1] - q / 2, q, q); continue; }
      if (!close) { ctx.beginPath(); ctx.arc(A[0], A[1], pass ? r * 0.95 : r * (a.n > 40 ? 1.25 : 1), 0, TAU); ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = cam.dpr; ctx.strokeStyle = pass ? '#e6e0d6' : 'rgba(20,16,12,.8)'; ctx.stroke(); continue; }
      const n = Math.max(2, Math.min(9, Math.round(pass ? a.n : a.n / 7))), big = pass ? 0.75 : SPECIES[a.sp].key === 'mammoth' ? 1.7 : a.odd === 'giant' ? 1.5 : a.odd === 'dwarf' ? 0.6 : 1, u = s * 0.12 * big;
      for (let j = 0; j < n; j++) { const ox = (hash2(k, j, 7 + pass) - 0.5) * s * 0.9, oy = (hash2(k, j, 19 + pass) - 0.5) * s * 0.9, bx = A[0] + ox, by = A[1] + oy, dir = a.x >= a.px ? 1 : -1;
        ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(bx, by + u * 1.1, u * 1.5, u * 0.5, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(bx, by, u * 1.5, u * 0.85, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(bx + dir * u * 1.7, by - u * 0.6, u * 0.6, 0, TAU); ctx.fill();
        ctx.lineWidth = Math.max(1, cam.dpr * 0.8); ctx.strokeStyle = pass ? '#d9d2c6' : 'rgba(20,14,10,.7)'; ctx.beginPath(); ctx.ellipse(bx, by, u * 1.5, u * 0.85, 0, 0, TAU); ctx.stroke(); }
    }
  }
}

function drawPeople(ctx, w, cam, s, lens, frac) {
  const far = s < 2.7, names = [];
  for (const st of w.sets) {
    if (st.dead || !seen(st.x, st.y, 8)) continue; const c = w.cults[st.cult], col = colorOf(c);
    if (st.nomad && st.mt) { const f = clamp((w.tickN - st.mt + frac) / TPY, 0, 1), e = f * f * (3 - 2 * f); toScreen(cam, st.px + wrapDx(st.x - st.px) * e + 0.5, st.py + (st.y - st.py) * e + 0.5, A); } else toScreen(cam, st.x + 0.5, st.y + 0.5, A);
    const x = A[0], y = A[1];
    const u = clamp(s * 0.2, 1.1, 5.2) * cam.dpr * (far ? 1 : 1);
    ctx.lineWidth = Math.max(1, 1.3 * cam.dpr); ctx.strokeStyle = '#11100e'; ctx.fillStyle = col;
    if (st.nomad) { if (far && st.pop < 60) continue; ctx.beginPath(); ctx.moveTo(x, y - u * 1.3); ctx.lineTo(x + u * 1.25, y + u * 0.9); ctx.lineTo(x - u * 1.25, y + u * 0.9); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else if (st.tier <= 1) { ctx.beginPath(); ctx.rect(x - u * 0.9, y - u * 0.9, u * 1.8, u * 1.8); ctx.fill(); if (!far) ctx.stroke(); }
    else if (st.tier === 2) { if (st.walls && !far) { ctx.beginPath(); ctx.arc(x, y, u * 2.5, 0, TAU); ctx.lineWidth = 2.2 * cam.dpr; ctx.strokeStyle = 'rgba(17,16,14,.85)'; ctx.stroke(); ctx.lineWidth = 1.1 * cam.dpr; ctx.strokeStyle = '#d8d0c0'; ctx.stroke(); ctx.lineWidth = 1.3 * cam.dpr; ctx.strokeStyle = '#11100e'; }
      ctx.beginPath(); ctx.rect(x - u * 1.5, y - u * 1.5, u * 3, u * 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#11100e'; ctx.fillRect(x - u * 0.45, y - u * 0.45, u * 0.9, u * 0.9); }
    else { const R = u * 2.5; if (st.walls && !far) { ctx.beginPath(); ctx.arc(x, y, R * 1.45, 0, TAU); ctx.lineWidth = 2.6 * cam.dpr; ctx.strokeStyle = 'rgba(17,16,14,.85)'; ctx.stroke(); ctx.lineWidth = 1.3 * cam.dpr; ctx.strokeStyle = '#e4dccb'; ctx.stroke(); ctx.lineWidth = 1.3 * cam.dpr; ctx.strokeStyle = '#11100e'; }
      ctx.beginPath(); ctx.moveTo(x, y - R); ctx.lineTo(x + R, y); ctx.lineTo(x, y + R); ctx.lineTo(x - R, y); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, R * 0.3, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke(); }
    if (st.plague > 0 && !far) { ctx.beginPath(); ctx.arc(x, y, u * 3.4, 0, TAU); ctx.setLineDash([3 * cam.dpr, 3 * cam.dpr]); ctx.strokeStyle = '#b6ff3d'; ctx.lineWidth = 1.6 * cam.dpr; ctx.stroke(); ctx.setLineDash([]); }
    if (st.wonder && s >= 4) { const q = u * 1.5, wx0 = x + u * 3.2, wy0 = y - u * 2.2; ctx.beginPath(); ctx.moveTo(wx0, wy0 - q * 1.2); ctx.lineTo(wx0 + q, wy0 + q * 0.7); ctx.lineTo(wx0 - q, wy0 + q * 0.7); ctx.closePath(); ctx.fillStyle = '#ffd95a'; ctx.fill(); ctx.strokeStyle = '#3a2a08'; ctx.lineWidth = 1.2 * cam.dpr; ctx.stroke(); }
    if (st.tower && s >= 4) { const q = u * 0.7, tx = x - u * 3.2, ty = y - u * 1.5; ctx.fillStyle = '#c58bff'; ctx.strokeStyle = '#1c0f2a'; ctx.lineWidth = 1.2 * cam.dpr; ctx.beginPath(); ctx.rect(tx - q, ty - q * 3, q * 2, q * 5); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(tx - q * 1.6, ty - q * 3); ctx.lineTo(tx, ty - q * 5.5); ctx.lineTo(tx + q * 1.6, ty - q * 3); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    if (st.name && (st.tier === 3 ? s >= 2.9 : st.tier === 2 ? s >= 6.5 : s >= 12)) names.push(st, x, y + u * (st.tier === 3 ? 3.9 : 2.4) + 2);
  }
  for (let k = 0; k < names.length; k += 3) { const st = names[k]; label(ctx, st.name, names[k + 1], names[k + 2], Math.round((st.tier === 3 ? 13 : st.tier === 2 ? 11.5 : 10.5) * cam.dpr), '#fff'); }
  if (lens === 6) for (const c of w.cults) { if (!c.alive || !c.big || c.count < 2 || !seen(c.big.x, c.big.y, 10)) continue; toScreen(cam, c.big.x + 0.5, c.big.y + 0.5, A); const px = Math.round(clamp(9 + Math.sqrt(c.count) * 1.6, 11, 22) * cam.dpr), yy = A[1] - clamp(s * 2.4, 22, 46) * cam.dpr; label(ctx, c.name.toUpperCase(), A[0], yy, px, colorOf(c)); if (s >= 3.4) label(ctx, c.kind, A[0], yy + px * 1.15, Math.round(10.5 * cam.dpr), '#fff', true); }
}

function boat(ctx, x, y, u, col, lw) {
  ctx.lineWidth = lw; ctx.strokeStyle = '#141210'; ctx.fillStyle = '#5a3d24'; ctx.beginPath(); ctx.moveTo(x - u, y); ctx.lineTo(x + u, y); ctx.lineTo(x + u * 0.6, y + u * 0.5); ctx.lineTo(x - u * 0.6, y + u * 0.5); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#f4efe2'; ctx.beginPath(); ctx.moveTo(x - u * 0.1, y - u * 1.25); ctx.lineTo(x + u * 0.8, y - u * 0.12); ctx.lineTo(x - u * 0.1, y - u * 0.12); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = col; ctx.fillRect(x - u * 0.1, y - u * 0.55, u * 0.55, u * 0.3);
}
// Everyone on the road. Colour says whose they are; shape says what they are doing.
function drawMovers(ctx, w, cam, s, frac) {
  if (s < 2.4) return; const far = s < 4.5, u = clamp(s * 0.2, 1.6, 5) * cam.dpr, lw = Math.max(1, 1.2 * cam.dpr);
  for (const m of w.movers) {
    if (m.done) continue; const x = m.px + wrapDx(m.x - m.px) * frac + 0.5, y = m.py + (m.y - m.py) * frac + 0.5; if (!seen(x, y, 2)) continue; toScreen(cam, x, y, A);
    const c = w.cults[m.cult], col = c.color, X = A[0], Y = A[1], war = m.kind === 'army';
    if (far) { ctx.fillStyle = war ? '#ff3b1f' : col; ctx.fillRect(X - 1.5, Y - 1.5, 3, 3); if (war) { ctx.strokeStyle = '#140a08'; ctx.lineWidth = 1; ctx.strokeRect(X - 2, Y - 2, 4, 4); } continue; }
    if (m.wet && !m.path) { boat(ctx, X, Y, u * (war ? 1.5 : 1.25), col, lw); if (war) { ctx.fillStyle = '#ff3b1f'; ctx.fillRect(X - u * 0.3, Y - u * 2.2, u * 0.9, u * 0.5); } continue; }
    ctx.lineWidth = lw; ctx.strokeStyle = '#141210';
    if (war || m.kind === 'home') { const n = war ? Math.min(5, 2 + (m.n > 60 ? 1 : 0) + (m.n > 200 ? 1 : 0) + (m.n > 600 ? 1 : 0)) : 2;
      for (let k = 0; k < n; k++) { const ox = (k - (n - 1) / 2) * u * 0.9, oy = (k % 2) * u * 0.5; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(X + ox, Y + oy, u * 0.42, 0, TAU); ctx.fill(); ctx.stroke(); }
      if (war) { ctx.beginPath(); ctx.moveTo(X, Y + u * 0.2); ctx.lineTo(X, Y - u * 2.3); ctx.stroke(); ctx.fillStyle = '#ff3b1f'; ctx.beginPath(); ctx.moveTo(X, Y - u * 2.3); ctx.lineTo(X + u * 1.3, Y - u * 1.85); ctx.lineTo(X, Y - u * 1.4); ctx.closePath(); ctx.fill(); ctx.stroke(); } }
    else if (m.kind === 'trade') { ctx.fillStyle = '#c9a66b'; ctx.beginPath(); ctx.ellipse(X, Y, u * 0.8, u * 0.5, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = col; ctx.fillRect(X - u * 0.35, Y - u * 0.95, u * 0.7, u * 0.6); ctx.strokeRect(X - u * 0.35, Y - u * 0.95, u * 0.7, u * 0.6); }
    else { const n = m.kind === 'settlers' ? 3 : 4; for (let k = 0; k < n; k++) { const ox = (hash2(k, m.born, 3) - 0.5) * u * 2.4, oy = (hash2(k, m.born, 9) - 0.5) * u * 1.6; ctx.fillStyle = m.kind === 'settlers' ? col : '#cfc8ba'; ctx.beginPath(); ctx.arc(X + ox, Y + oy, u * 0.36, 0, TAU); ctx.fill(); ctx.stroke(); }
      if (m.kind === 'settlers') { ctx.fillStyle = '#8a6a44'; ctx.fillRect(X - u * 0.6, Y + u * 0.5, u * 1.2, u * 0.6); ctx.strokeRect(X - u * 0.6, Y + u * 0.5, u * 1.2, u * 0.6); } else { ctx.fillStyle = col; ctx.fillRect(X - 1.5 * cam.dpr, Y - 1.5 * cam.dpr, 3 * cam.dpr, 3 * cam.dpr); } }
  }
}
function drawSwarms(ctx, w, cam, s, now, frac) {
  for (const sw of w.swarms) { const x = sw.px + wrapDx(sw.x - sw.px) * frac + 0.5, y = sw.py + (sw.y - sw.py) * frac + 0.5; if (!seen(x, y, 6)) continue; toScreen(cam, x, y, A);
    const R = 3.4 * s * cam.dpr, t = still ? 0 : now * 0.004; ctx.fillStyle = 'rgba(60,48,20,.22)'; ctx.beginPath(); ctx.arc(A[0], A[1], R, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(34,26,10,.85)';
    for (let k = 0; k < 46; k++) { const a = hash2(k, 1, 5) * TAU + t * (0.5 + hash2(k, 2, 5)), r = Math.sqrt(hash2(k, 3, 5)) * R * (0.85 + 0.15 * Math.sin(t * 3 + k)), q = Math.max(1.3, s * 0.07) * cam.dpr; ctx.fillRect(A[0] + Math.cos(a) * r, A[1] + Math.sin(a) * r * 0.85, q, q); } }
}
// what lives in the water: fish where the sea is rich, and worse things where it is deep
function drawSea(ctx, w, cam, s, now) {
  if (s >= 9) { const f = w.fish, K = w.fishK, t = still ? 0 : now * 0.0012, x0 = Math.floor((view.x - view.hw) / CS) - 1, x1 = Math.ceil((view.x + view.hw) / CS) + 1, y0 = Math.max(0, Math.floor((view.y - view.hh) / CS)), y1 = Math.min(CH - 1, Math.ceil((view.y + view.hh) / CS));
    ctx.strokeStyle = 'rgba(226,240,246,.75)'; ctx.lineWidth = Math.max(1, s * 0.05) * cam.dpr; ctx.lineCap = 'round'; ctx.beginPath();
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) { const ci = cy * CW + ((cx % CW) + CW) % CW; if (K[ci] < 0.45) continue; const n = Math.round(f[ci] * 3.2); if (!n) continue;
      for (let k = 0; k < n; k++) { const ph = t * (0.6 + hash2(ci, k, 3)) + hash2(ci, k, 8) * 6.28, fx = (cx + hash2(ci, k, 1)) * CS + Math.cos(ph) * 1.2, fy = (cy + hash2(ci, k, 2)) * CS + Math.sin(ph * 0.7) * 0.8; const j = clamp(Math.floor(fy), 0, H - 1) * W + (((Math.floor(fx) % W) + W) % W); if (w.water[j] !== 1) continue; toScreen(cam, fx, fy, A); const d = Math.cos(ph) > 0 ? -1 : 1, l = s * 0.16 * cam.dpr; ctx.moveTo(A[0], A[1]); ctx.lineTo(A[0] + d * l, A[1] + l * 0.25); } }
    ctx.stroke(); }
  for (const k of w.krakens) { if (!seen(k.x, k.y, 6)) continue; toScreen(cam, k.x + 0.5, k.y + 0.5, A); const t = still ? 0 : now * 0.002, R = clamp(s * 2.6, 9, 110) * cam.dpr, up = k.wake > 0 || s >= 5;
    ctx.strokeStyle = 'rgba(210,225,235,.5)'; ctx.lineWidth = 1.4 * cam.dpr; for (let q = 0; q < 2; q++) { ctx.beginPath(); ctx.ellipse(A[0], A[1], R * (0.7 + 0.5 * q + 0.1 * Math.sin(t + q)), R * (0.4 + 0.3 * q), 0, 0, TAU); ctx.stroke(); }
    if (up) { ctx.lineCap = 'round'; for (let q = 0; q < 6; q++) { const a = (q / 6) * TAU + 0.3, wv = Math.sin(t * 1.7 + q * 1.3) * 0.5; ctx.beginPath(); ctx.moveTo(A[0] + Math.cos(a) * R * 0.15, A[1] + Math.sin(a) * R * 0.1); ctx.quadraticCurveTo(A[0] + Math.cos(a + wv) * R * 0.5, A[1] + Math.sin(a + wv) * R * 0.35 - R * 0.25, A[0] + Math.cos(a + wv * 1.6) * R * 0.75, A[1] + Math.sin(a + wv * 1.6) * R * 0.45); ctx.lineWidth = Math.max(2, R * 0.12); ctx.strokeStyle = '#141018'; ctx.stroke(); ctx.lineWidth = Math.max(1, R * 0.07); ctx.strokeStyle = '#6a3f86'; ctx.stroke(); } }
    if (s >= 7) label(ctx, k.name, A[0], A[1] + R * 0.8, Math.round(11 * cam.dpr), '#d9c2ee', true); }
}

function drawDragons(ctx, w, cam, s, now, frac) {
  for (const d of w.dragons) {
    if (s >= 3 && seen(d.lx, d.ly, 2)) { toScreen(cam, d.lx + 0.5, d.ly + 0.5, A); const u = clamp(s * 0.28, 3, 9) * cam.dpr; ctx.beginPath(); ctx.arc(A[0], A[1], u, Math.PI, 0); ctx.closePath(); ctx.fillStyle = '#16100e'; ctx.fill(); ctx.lineWidth = 1.4 * cam.dpr; ctx.strokeStyle = '#ff7a2a'; ctx.stroke(); if (s >= 6) label(ctx, d.name, A[0], A[1] + 3 * cam.dpr, Math.round(11 * cam.dpr), '#ffb27a', true); }
    const fly = d.st === 'fly' || d.st === 'home'; if (!fly && d.st !== 'wake') continue;
    const x = d.px + wrapDx(d.x - d.px) * frac + 0.5, y = d.py + (d.y - d.py) * frac + 0.5; if (!seen(x, y, 4)) continue; toScreen(cam, x, y, A);
    const u = clamp(s * 0.9, 7, 30) * cam.dpr, flap = fly ? Math.sin(now * 0.012) : 0.2, dir = wrapDx(d.tx - d.x) >= 0 ? 1 : -1, by = A[1] - (fly ? u * 0.9 : 0);
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(A[0], A[1] + u * 0.3, u * 1.1, u * 0.32, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#b3201c'; ctx.strokeStyle = '#2a0806'; ctx.lineWidth = 1.3 * cam.dpr;
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(A[0], by); ctx.lineTo(A[0] + sd * u * 0.7, by - u * (0.5 + 0.5 * flap)); ctx.lineTo(A[0] + sd * u * 1.35, by - u * 0.1 * flap); ctx.lineTo(A[0] + sd * u * 0.8, by + u * 0.18); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(A[0], by, u * 0.5, u * 0.2, 0, 0, TAU); ctx.fillStyle = '#7d1512'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(A[0] + dir * u * 0.45, by); ctx.lineTo(A[0] + dir * u * 0.95, by - u * 0.12); ctx.lineTo(A[0] + dir * u * 0.5, by + u * 0.12); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
}

function drawStorms(ctx, w, cam, s, now, frac) {
  for (const st of w.storms) {
    const px = st.px == null ? st.x : st.px, py = st.py == null ? st.y : st.py, x = px + wrapDx(st.x - px) * frac, y = py + (st.y - py) * frac; if (!seen(x, y, 10)) continue; toScreen(cam, x, y, A);
    const R = (3 + 3.2 * st.str) * s, rot = (still ? 0 : now * 0.0016) + st.spin, sg = y < H / 2 ? -1 : 1;
    ctx.lineCap = 'round';
    for (let arm = 0; arm < 3; arm++) { ctx.beginPath(); for (let q = 0; q <= 22; q++) { const tt = q / 22, a = rot * sg + arm * (TAU / 3) + sg * tt * 3.6, rr = R * (0.1 + 0.9 * tt); const X = A[0] + Math.cos(a) * rr, Y = A[1] + Math.sin(a) * rr * 0.9; if (q) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
      ctx.strokeStyle = 'rgba(255,255,255,.62)'; ctx.lineWidth = Math.max(2, R * 0.2); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(A[0], A[1], R * 0.55, 0, TAU); ctx.fillStyle = 'rgba(245,248,250,.38)'; ctx.fill();
    ctx.beginPath(); ctx.arc(A[0], A[1], Math.max(1.5, R * 0.09), 0, TAU); ctx.fillStyle = 'rgba(30,60,90,.7)'; ctx.fill();
  }
}

function drawFx(ctx, w, cam, s, now) {
  const jar = ctx.canvas.parentNode; let shake = 0;
  for (const f of w.fx) {
    if (f.t0 == null) f.t0 = now; const u = (now - f.t0) / (f.T * 1000); if (u >= 1) { f.done = true; continue; }
    toScreen(cam, f.x + 0.5, f.y + 0.5, A);
    if (f.k === 'boom') { const R = (2 + 9 * Math.sqrt(u)) * s; ctx.beginPath(); ctx.arc(A[0], A[1], R, 0, TAU); ctx.fillStyle = `rgba(255,${Math.round(230 - 120 * u)},${Math.round(160 - 150 * u)},${0.8 * (1 - u)})`; ctx.fill(); ctx.lineWidth = 3 * cam.dpr; ctx.strokeStyle = `rgba(255,255,255,${1 - u})`; ctx.stroke(); shake = Math.max(shake, 1 - u); }
    else if (f.k === 'flash') { if (!still) { ctx.fillStyle = `rgba(255,255,255,${0.85 * (1 - u)})`; ctx.fillRect(0, 0, cam.w, cam.h); } }
    else if (f.k === 'plume') { for (let q = 0; q < 9; q++) { const a = u * 1.6 + q * 0.11, d = a * 9 * s, rr = (1 + a * 3) * s; ctx.beginPath(); ctx.arc(A[0] + f.ux * d + Math.sin(q * 7.1) * rr * 0.4, A[1] + f.uy * d - a * s * 1.5 + Math.cos(q * 5.3) * rr * 0.4, rr, 0, TAU); ctx.fillStyle = `rgba(52,46,44,${0.5 * (1 - u)})`; ctx.fill(); }
      ctx.beginPath(); ctx.arc(A[0], A[1], s * (0.8 + 0.5 * Math.sin(now * 0.02)), 0, TAU); ctx.fillStyle = `rgba(255,150,40,${1 - u})`; ctx.fill(); shake = Math.max(shake, 0.5 * (1 - u)); }
    else if (f.k === 'ring') { const R = f.R * u * s; ctx.beginPath(); ctx.arc(A[0], A[1], R, 0, TAU); ctx.lineWidth = (2 + 5 * (1 - u)) * cam.dpr; ctx.strokeStyle = `rgba(215,245,255,${0.85 * (1 - u)})`; ctx.stroke(); }
    else if (f.k === 'shake') { shake = Math.max(shake, 1 - u); ctx.beginPath(); ctx.arc(A[0], A[1], 11 * s * u, 0, TAU); ctx.lineWidth = 2 * cam.dpr; ctx.strokeStyle = `rgba(60,40,30,${0.7 * (1 - u)})`; ctx.stroke(); }
    else if (f.k === 'clash') { const R = (0.6 + 1.6 * u) * s; ctx.lineWidth = 2.2 * cam.dpr; ctx.strokeStyle = `rgba(255,70,40,${1 - u})`; ctx.beginPath(); for (let q = 0; q < 6; q++) { const a = (q / 6) * TAU + 0.4; ctx.moveTo(A[0] + Math.cos(a) * R * 0.3, A[1] + Math.sin(a) * R * 0.3); ctx.lineTo(A[0] + Math.cos(a) * R, A[1] + Math.sin(a) * R); } ctx.stroke(); }
    else if (f.k === 'spark') { const R = (1 + 5 * u) * s; ctx.lineWidth = 2.4 * cam.dpr; ctx.strokeStyle = `rgba(255,224,90,${1 - u})`; ctx.beginPath(); for (let q = 0; q < 8; q++) { const a = (q / 8) * TAU; ctx.moveTo(A[0] + Math.cos(a) * R * 0.45, A[1] + Math.sin(a) * R * 0.45); ctx.lineTo(A[0] + Math.cos(a) * R, A[1] + Math.sin(a) * R); } ctx.stroke(); }
  }
  if (w.fx.some((f) => f.done)) w.fx = w.fx.filter((f) => !f.done);
  if (jar) jar.style.transform = shake > 0.02 && !still ? `translate(${((Math.sin(now * 0.09) * 5 * shake) | 0)}px, ${((Math.cos(now * 0.11) * 4 * shake) | 0)}px)` : '';
}

function drawSel(ctx, cam, S, now) {
  const f = S.sel; if (!f || !f.pos) return; const p = f.pos(); if (!p) { S.sel = null; return; } toScreen(cam, p[0] + 0.5, p[1] + 0.5, A);
  const R = Math.max(13 * cam.dpr, cam.z * cam.dpr * (p[2] || 1.6)); ctx.beginPath(); ctx.arc(A[0], A[1], R, 0, TAU); ctx.setLineDash([6 * cam.dpr, 5 * cam.dpr]); ctx.lineDashOffset = still ? 0 : -now * 0.02; ctx.lineWidth = 3.4 * cam.dpr; ctx.strokeStyle = 'rgba(12,14,16,.7)'; ctx.stroke(); ctx.lineWidth = 1.7 * cam.dpr; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.setLineDash([]);
}

hook('overlay', (ctx, w, cam, S, now) => {
  const s = cam.z * cam.dpr, z = cam.z, frac = clamp(S.acc, 0, 1);
  view = { x: cam.x, y: cam.y, hw: cam.w / (2 * s), hh: cam.h / (2 * s) };
  const bare = S.lens === 4 || S.lens === 5;
  if (!bare) { drawRoads(ctx, w, cam, z); drawOre(ctx, w, cam, z); drawVolcanoes(ctx, w, cam, z); drawRuins(ctx, w, cam, z); if (S.lens !== 6) drawAnimals(ctx, w, cam, s, frac); drawSea(ctx, w, cam, z, now); drawPeople(ctx, w, cam, z, S.lens, frac); drawMovers(ctx, w, cam, z, frac); drawSwarms(ctx, w, cam, z, now, frac); drawDragons(ctx, w, cam, z, now, frac); drawStorms(ctx, w, cam, s, now, frac); }
  drawFx(ctx, w, cam, s, now); drawSel(ctx, cam, S, now);
});

/* ---------- reading things ---------- */
const big = (n) => (n >= 10000 ? Math.round(n / 1000) + ' thousand' : n >= 1000 ? (Math.round(n / 100) / 10) + ' thousand' : String(Math.round(n)));
const WAY = { forage: 'gathering what grows', hunt: 'hunting', fish: 'fishing', farm: 'farming', herd: 'herding' };
const SRC = ['wild food', 'the hunt', 'fish', 'its fields', 'its herds'];
const NOTE = { grow: 'It is growing.', full: 'It holds as many people as its land can feed.', drought: 'The rains have failed. People are going hungry, and some are leaving.', flood: 'The river took the fields this year.', soil: 'Its fields are worn out and give less every year.', fish: 'The sea here has been fished out.', locusts: 'Locusts ate the harvest.', ash: 'Ash in the sky; nothing ripens.', game: 'The animals it lived on are gone.', crowded: 'There are more mouths than food. Some will leave, or look at the neighbours.', plague: 'Sickness is doing the counting here.' };
const list = (a) => (a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
const cap = (t) => t[0].toUpperCase() + t.slice(1);
export function cultLines(w, c) {
  const L = [];
  L.push(`The ${c.name}: ${c.kind}. ${big(c.pop)} people in ${c.count} ${c.count === 1 ? 'place' : 'places'}.`);
  const arts = Object.keys(c.arts).sort((a, b) => c.arts[a] - c.arts[b]).map((k) => ART[k].say); L.push(arts.length ? `They know ${list(arts)}.` : 'They know fire, stone and each other.');
  const tame = Object.keys(c.tame), met = []; if (c.arts.bronze) met.push('bronze'); if (c.arts.iron) met.push('iron'); if (c.gold) met.push('gold');
  if (tame.length || met.length) L.push((tame.length ? `They keep ${list(tame.map((k) => (k === 'cattle' ? 'cattle' : k === 'pig' ? 'pigs' : k + 's')))}. ` : '') + (met.length ? `They have ${list(met)}.` : ''));
  L.push(`${c.ruler.name} leads them. ${c.coh > 0.7 ? 'They hold together well.' : c.coh > 0.45 ? 'There are quarrels, but they hold.' : c.coh > 0.25 ? 'They are pulling apart.' : 'They are one people in name only.'}`);
  if (c.war) { const f = w.cults[c.war.foe]; L.push(`At war with the ${f.name} since year ${c.war.since}.`); }
  if (c.parent) L.push(`They split from the ${c.parent} in year ${c.born}.`);
  return L;
}
function setInfo(w, s) {
  const c = w.cults[s.cult], L = [], tot = s.src.reduce((a, b) => a + b, 0) || 1;
  const eats = s.src.map((v, k) => [v / tot, SRC[k]]).filter((e) => e[0] >= 0.12).sort((a, b) => b[0] - a[0]).map((e) => `${e[1]} (${Math.round(e[0] * 100)}%)`);
  if (s.nomad) L.push(`${big(s.pop)} people on the move.`); else L.push(`A ${TIER[s.tier]} of ${big(s.pop)} people, ${s.age} years old.`);
  if (eats.length) L.push(`It lives on ${list(eats)}.`);
  L.push(s.plague > 0 ? NOTE.plague : NOTE[s.note] || NOTE.grow);
  if (!s.nomad) { const ex = []; if (s.walls) ex.push('stone walls'); if (s.links) ex.push(s.links === 1 ? 'a road' : s.links + ' roads'); if (s.port && c.arts.boats) ex.push('a harbour'); if (s.wonder) ex.push('a wonder'); if (s.tower) ex.push('a tower nobody built'); if (ex.length) L.push(`It has ${list(ex)}.`);
    const o = []; for (let k = 1; k <= 6; k++) if (s.ores & (1 << k)) o.push(ORES[k]); if (o.length) L.push(`${cap(list(o))} in its ground.`);
    if (s.burned) L.push(`A dragon has burned it ${s.burned === 1 ? 'once' : s.burned + ' times'}.`); }
  return { title: s.name || `A band of the ${c.name}`, color: colorOf(c), lines: L.concat(cultLines(w, c)), follow: { pos: () => (s.dead ? null : [s.x, s.y, s.R + 0.6]), info: () => (s.dead ? null : setInfo(w, s)) } };
}
export const describeSet = setInfo;
const MOVE = { settlers: (w, m, c) => [`Settlers of the ${c.name}`, `${Math.round(m.n)} people with everything they own, looking for a place to stop.`], army: (w, m, c) => [`A war band of the ${c.name}`, `About ${Math.round(m.n)} spears${m.to && !m.to.dead && m.to.name ? ', marching on ' + m.to.name : ''}.`], home: (w, m, c) => [`A war band of the ${c.name}`, 'On the way home.'], trade: (w, m, c) => [m.wet0 ? `A trading ship of the ${c.name}` : `A caravan of the ${c.name}`, `${m.from && m.from.name ? 'From ' + m.from.name : 'On its way'}${m.to && m.to.name ? ' to ' + m.to.name : ''}. It carries goods, news, and whatever else is going around.`], refugees: (w, m, c) => [`People of the ${c.name}, fleeing`, `${Math.round(m.n)} people walking away from hunger or worse.`] };
const RUIN_SAY = { abandoned: 'Its people left, or died out.', sacked: 'It was sacked and burned.', drowned: 'The sea took it.', buried: 'Ash and lava buried it.', burned: 'Fire took it.', plague: 'Plague emptied it.', frozen: 'The ice closed over it.', overgrown: 'The forest swallowed it.', crater: 'A falling star erased it.', swallowed: 'The earth opened under it.', dragon: 'A dragon made it a roost.' };
function looker(w, x, y, i, r) {
  let hit = null, bd = r * r;
  for (const d of w.dragons) { for (const p of [[d.x, d.y], [d.lx, d.ly]]) { const q = wrapDx(p[0] - x) ** 2 + (p[1] - y) ** 2; if (q <= bd * 2.5) hit = d; } }
  if (hit) { const d = hit; return { title: d.name, color: '#b3201c', lines: [`A dragon, ${d.age} years on this mountain.`, d.st === 'sleep' ? 'It is asleep on its hoard.' : d.st === 'fly' ? 'It is hunting.' : d.st === 'home' ? 'It is flying home, fed.' : 'It is awake, and looking around.', d.hoard > 20 ? 'Its hoard is the richest thing in the world.' : d.hoard > 6 ? 'It has a respectable hoard.' : 'It has not gathered much yet.'], follow: { pos: () => (d.dead ? null : [d.x, d.y, 2]) } }; }
  for (const k of w.krakens) if (wrapDx(k.x - x) ** 2 + (k.y - y) ** 2 <= Math.max(9, bd)) return { title: cap(k.name), color: '#6a3f86', lines: [`Something very large, in this water since year ${k.born}.`, k.sunk ? `It has taken ${k.sunk} ${k.sunk === 1 ? 'ship' : 'ships'}.` : 'No ship has come close enough yet.'] };
  for (const m of w.movers) if (!m.done && wrapDx(m.x - x) ** 2 + (m.y - y) ** 2 <= bd * 1.5) { const c = w.cults[m.cult], t = MOVE[m.kind](w, m, c); return { title: t[0], color: c.color, lines: [t[1]], follow: { pos: () => (m.done ? null : [m.x, m.y, 1.4]) } }; }
  for (const sw of w.swarms) if (wrapDx(sw.x - x) ** 2 + (sw.y - y) ** 2 <= 12) return { title: 'Locusts', lines: ['A swarm on the wind. It eats grass and grain down to the dirt and moves on.'] };
  const s = near(w, x, y, Math.max(1.6, r), null, false); if (s) return setInfo(w, s);
  for (const ru of w.ruins) if (wrapDx(ru.x - x) ** 2 + (ru.y - y) ** 2 <= bd) return { title: `Ruins of ${ru.name}`, color: null, lines: [`A ${TIER[ru.tier]} of the ${ru.cult}. ${RUIN_SAY[ru.kind] || ''} Year ${ru.year}.`, ru.wonder ? 'Something enormous still stands among the stones.' : '', ru.layers > 1 ? `It has been built and lost ${ru.layers} times. There are older walls under these.` : '', ru.haunt ? 'Nobody goes near it now. The air is wrong.' : ru.looted ? 'Diggers have been through it.' : 'Nobody has dug here yet. Whatever its people knew is still in the ground.'].filter(Boolean) };
  for (const st of w.storms) if (wrapDx(st.x - x) ** 2 + (st.y - y) ** 2 <= 16) return { title: st.str > 1 ? 'A great storm' : 'A storm', lines: ['Born over warm water, carried by the wind. It dies over land, but not before it has wrecked a coast.'] };
  let best = null; bd = r * r;
  for (const h of w.herds) { const q = wrapDx(h.x - x) ** 2 + (h.y - y) ** 2; if (q <= bd) { bd = q; best = h; } }
  if (best) { const sp = SPECIES[best.sp]; return { title: sp.one.replace(/^./, (m) => m.toUpperCase()), color: sp.col, lines: [`About ${Math.round(best.n)} head. ${big(w.species[best.sp].n || best.n)} of their kind in the world.`, best.odd ? (best.odd === 'dwarf' ? 'Generations on a small island have made them small and tame.' : 'Generations on an island have made them huge.') : sp.tame ? 'People who live beside these long enough learn to tame them.' : 'Nobody will ever tame these.'] }; }
  for (const p of w.packs) if (wrapDx(p.x - x) ** 2 + (p.y - y) ** 2 <= r * r) return { title: 'A pack of wolves', color: '#2a2a30', lines: [`${Math.round(p.n)} hunters. They follow the herds and keep them from eating the land bare.`] };
  for (const v of w.volcanoes) if (wrapDx(v.x - x) ** 2 + (v.y - y) ** 2 <= 2) return { title: 'A volcano', lines: [v.last > 0 ? `It last opened in year ${v.last}.` : 'It has been quiet as long as anyone remembers.', 'Its ash kills what it lands on, then feeds it.'] };
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const yy = y + dy; if (yy < 0 || yy >= H) continue; const j = yy * W + ((x + dx + W) % W); if (w.ore[j] && cam0 >= 7) return { title: ORES[w.ore[j]].replace(/^./, (m) => m.toUpperCase()), color: ORE_COL[w.ore[j]], lines: [w.ore[j] === 5 ? 'Salt in a dry basin.' : 'A seam in the rock.', 'It matters to whoever settles on top of it.'] }; }
  return null;
}
let cam0 = 1;
hook('newWorld', (w) => { w.lookers = [(ww, x, y, i) => looker(ww, x, y, i, Math.max(1.3, 9 / cam0))]; });
hook('overlay', (ctx, w, cam) => { cam0 = cam.z; });
