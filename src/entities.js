// Everything on the map that is not terrain: animals, peoples, roads, ruins, dragons, storms and
// the brief flashes when something big happens. Drawn on the 2D overlay, on top of the shader.
import { W, H, TAU, clamp, wrapDx, hash2 } from './core.js';
import { toScreen } from './render.js';
import { SPECIES } from './fauna.js';
import { COLORS, TIER, ARTS, ORES, colorOf, near } from './people.js';
import { hook, palette } from './main.js';

for (let k = 0; k < 32; k++) { const c = COLORS[k % COLORS.length]; palette[k * 3] = parseInt(c.slice(1, 3), 16) / 255; palette[k * 3 + 1] = parseInt(c.slice(3, 5), 16) / 255; palette[k * 3 + 2] = parseInt(c.slice(5, 7), 16) / 255; }

const A = [0, 0], B = [0, 0];
const ORE_COL = ['', '#d9843b', '#cfd6dc', '#7b4a3a', '#ffd23a', '#ffffff'];
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

function drawPeople(ctx, w, cam, s, lens) {
  const far = s < 2.7, names = [];
  for (const st of w.sets) {
    if (st.dead || !seen(st.x, st.y, 3)) continue; const c = w.cults[st.cult], col = colorOf(c); toScreen(cam, st.x + 0.5, st.y + 0.5, A); const x = A[0], y = A[1];
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
  if (lens === 6) for (const c of w.cults) { if (!c.alive || !c.big || c.count < 2 || !seen(c.big.x, c.big.y, 10)) continue; toScreen(cam, c.big.x + 0.5, c.big.y + 0.5, A); label(ctx, c.name.toUpperCase(), A[0], A[1] - clamp(s * 2.4, 22, 46) * cam.dpr, Math.round(clamp(9 + Math.sqrt(c.count) * 1.6, 11, 22) * cam.dpr), colorOf(c)); }
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
  if (!bare) { drawRoads(ctx, w, cam, z); drawOre(ctx, w, cam, z); drawVolcanoes(ctx, w, cam, z); drawRuins(ctx, w, cam, z); if (S.lens !== 6) drawAnimals(ctx, w, cam, s, frac); drawPeople(ctx, w, cam, z, S.lens); drawDragons(ctx, w, cam, z, now, frac); drawStorms(ctx, w, cam, s, now, frac); }
  drawFx(ctx, w, cam, s, now); drawSel(ctx, cam, S, now);
});

/* ---------- reading things ---------- */
const big = (n) => (n >= 10000 ? Math.round(n / 1000) + ' thousand' : n >= 1000 ? (Math.round(n / 100) / 10) + ' thousand' : String(Math.round(n)));
const WAY = { forage: 'gathering what grows', hunt: 'hunting', fish: 'fishing', farm: 'farming', herd: 'herding' };
const list = (a) => (a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
export function cultLines(w, c) {
  const L = [];
  L.push(`${big(c.pop)} people in ${c.count} ${c.count === 1 ? 'place' : 'places'}. They live mostly by ${WAY[c.way] || c.way}.`);
  const arts = ARTS.slice(1, c.tech + 1); L.push(arts.length ? `They know ${list(arts)}.` : 'They know fire, stone and each other.');
  const tame = Object.keys(c.tame), met = []; if (c.bronze) met.push('bronze'); if (c.iron) met.push('iron'); if (c.gold) met.push('gold');
  if (tame.length || met.length) L.push((tame.length ? `They keep ${list(tame.map((k) => (k === 'cattle' ? 'cattle' : k === 'pig' ? 'pigs' : k + 's')))}. ` : '') + (met.length ? `They have ${list(met)}.` : ''));
  L.push(`${c.ruler.name} leads them. ${c.coh > 0.7 ? 'They hold together well.' : c.coh > 0.45 ? 'There are quarrels, but they hold.' : c.coh > 0.25 ? 'They are pulling apart.' : 'They are a people in name only.'}`);
  if (c.parent) L.push(`They split from the ${c.parent} in year ${c.born}.`);
  return L;
}
function setInfo(w, s) {
  const c = w.cults[s.cult], L = [];
  if (s.nomad) L.push(`${big(s.pop)} people on the move, living by ${WAY[s.way]}.`);
  else { L.push(`A ${TIER[s.tier]} of the ${c.name}: ${big(s.pop)} people, ${s.age} years old. It lives by ${WAY[s.way]}.`);
    const ex = []; if (s.walls) ex.push('stone walls'); if (s.links) ex.push(s.links === 1 ? 'a road' : s.links + ' roads'); if (s.wonder) ex.push('a wonder'); if (s.tower) ex.push('a tower nobody built'); if (ex.length) L.push(`It has ${list(ex)}.`);
    const o = []; for (let k = 1; k <= 5; k++) if (s.ores & (1 << k)) o.push(ORES[k]); if (o.length) L.push(`${list(o).replace(/^./, (m) => m.toUpperCase())} in its ground.`); }
  if (s.plague > 0) L.push('There is plague here.');
  return { title: s.name || `A band of the ${c.name}`, color: colorOf(c), lines: L.concat(cultLines(w, c)), follow: { pos: () => (s.dead ? null : [s.x, s.y, s.R + 0.6]), info: () => (s.dead ? null : setInfo(w, s)) } };
}
const RUIN_SAY = { abandoned: 'Its people left, or died out.', sacked: 'It was sacked and burned.', drowned: 'The sea took it.', buried: 'Ash and lava buried it.', burned: 'Fire took it.', plague: 'Plague emptied it.', frozen: 'The ice closed over it.', overgrown: 'The forest swallowed it.', crater: 'A falling star erased it.', swallowed: 'The earth opened under it.', dragon: 'A dragon made it a roost.' };
function looker(w, x, y, i, r) {
  let hit = null, bd = r * r;
  for (const d of w.dragons) { for (const p of [[d.x, d.y], [d.lx, d.ly]]) { const q = wrapDx(p[0] - x) ** 2 + (p[1] - y) ** 2; if (q <= bd * 2.5) hit = d; } }
  if (hit) { const d = hit; return { title: d.name, color: '#b3201c', lines: [`A dragon, ${d.age} years on this mountain.`, d.st === 'sleep' ? 'It is asleep on its hoard.' : d.st === 'fly' ? 'It is hunting.' : d.st === 'home' ? 'It is flying home, fed.' : 'It is awake, and looking around.', d.hoard > 20 ? 'Its hoard is the richest thing in the world.' : d.hoard > 6 ? 'It has a respectable hoard.' : 'It has not gathered much yet.'], follow: { pos: () => (d.dead ? null : [d.x, d.y, 2]) } }; }
  const s = near(w, x, y, Math.max(1.6, r), null, false); if (s) return setInfo(w, s);
  for (const ru of w.ruins) if (wrapDx(ru.x - x) ** 2 + (ru.y - y) ** 2 <= bd) return { title: `Ruins of ${ru.name}`, color: null, lines: [`A ${TIER[ru.tier]} of the ${ru.cult}. ${RUIN_SAY[ru.kind] || ''} Year ${ru.year}.`, ru.wonder ? 'Something enormous still stands among the stones.' : '', ru.haunt ? 'Nobody goes near it now. The air is wrong.' : ru.looted ? 'Diggers have been through it.' : 'Nobody has dug here yet. Whatever its people knew is still in the ground.'].filter(Boolean) };
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
