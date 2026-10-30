// Everything on the map that is not terrain: animals, peoples, roads, ruins, dragons, storms and
// the brief flashes when something big happens. Drawn on the 2D overlay, on top of the shader.
import { tongueColor, tongueHsl, familyOf, quirksOf } from './tongues.js';
import { overlordOf } from './capture.js';
import { KINDS, STANCES, memAt, kindAt } from './memory.js';
import { GOODS, leagued } from './trade.js';
import { conflictOf, enemiesOf, alliesOf, trucesOf, sideOf, aimText } from './war.js';
import { histById } from './ledger.js';
import { travelOf, laneFor } from './travel.js';
import { ERA, blockedReasons } from './tech.js';
import { SPIRIT_KINDS } from './spirits.js';
import { PLANTS, luckOf } from './origins.js';
import { W, H, N, TAU, TPY, CS, CW, CH, clamp, wrapDx, hash2, wx, peopleText } from './core.js';
import { toScreen } from './render.js';
import { SPECIES } from './fauna.js';
import { blit, pixScale } from './pixels.js';
import { COLORS, TIER, ART, ORES, colorOf, near } from './people.js';
import { hook, palette, state } from './main.js';
import { TENET, MAGIC } from './faith.js';

const setPal = (k, c) => { palette[k * 3] = parseInt(c.slice(1, 3), 16) / 255; palette[k * 3 + 1] = parseInt(c.slice(3, 5), 16) / 255; palette[k * 3 + 2] = parseInt(c.slice(5, 7), 16) / 255; };
for (let k = 0; k < 32; k++) setPal(k, COLORS[k % COLORS.length]);
// a realm of the dead borrows a colour slot but is drawn grey while it lasts
let palKey = '';
const deadPal = (w) => { let key = ''; for (const c of w.cults) if (c.alive && (c.power || (c.over && c.over.kind === 'dragon'))) key += c.slot + (c.power ? ',' : 'd,'); if (key === palKey) return; palKey = key; for (let k = 0; k < 32; k++) setPal(k, COLORS[k % COLORS.length]); for (const c of w.cults) if (c.alive && c.power) { setPal(c.slot, c.color); setPal(c.slot + 24 < 32 ? c.slot + 24 : c.slot, c.color); } else if (c.alive && c.over && c.over.kind === 'dragon') setPal(c.slot, '#e8962c'); };   /* a dragon kingdom is drawn in the dragon's gold */
hook('tick', (w) => { deadPal(w); }); hook('newWorld', (w) => { palKey = '?'; deadPal(w); });

const A = [0, 0], B = [0, 0];
const ORE_COL = ['', '#d9843b', '#cfd6dc', '#7b4a3a', '#ffd23a', '#ffffff', '#2a2a2e', '#7aff5a'];
const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
let view = null;
const seen = (x, y, m) => Math.abs(wrapDx(x - view.x)) < view.hw + m && Math.abs(y - view.y) < view.hh + m;

// Labels are queued and drawn last, most important first; one that would overlap a label
// already placed is left out, so the map never turns into a pile of names.
const LQ = [];
function label(ctx, text, x, y, px, col, italic, pri) { LQ.push({ text, x, y, px, col, italic, pri: pri || 1 }); }
function flushLabels(ctx) {
  LQ.sort((a, b) => b.pri - a.pri); const placed = []; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.lineJoin = 'round';
  for (const l of LQ) {
    ctx.font = `${l.italic ? 'italic ' : ''}500 ${l.px}px "Pixelify Sans", "Instrument Sans", system-ui, sans-serif`; const wd = ctx.measureText(l.text).width + 4, x0 = l.x - wd / 2, y0 = l.y - 1, x1 = x0 + wd, y1 = y0 + l.px * 1.15;
    let hit = false; for (const p of placed) if (x0 < p[2] && x1 > p[0] && y0 < p[3] && y1 > p[1]) { hit = true; break; } if (hit) continue; placed.push([x0, y0, x1, y1]);
    ctx.lineWidth = Math.max(2.5, l.px * 0.28); ctx.strokeStyle = 'rgba(12,16,18,.82)'; ctx.strokeText(l.text, l.x, l.y); ctx.fillStyle = l.col || '#fff'; ctx.fillText(l.text, l.x, l.y);
  }
  LQ.length = 0;
}

function oreList(w) {
  if (w._oreList && w._oreStamp === (w.oreStamp || 0)) return w._oreList;
  const L = []; for (let i = 0; i < w.ore.length; i++) if (w.ore[i]) L.push(i); w._oreStamp = w.oreStamp || 0; return (w._oreList = L);
}
const at = (cam, x, y) => { toScreen(cam, x, y, A); return A; };
function drawOre(ctx, w, cam, z) {
  if (z < 7) return; const k = pixScale(z, cam.dpr, 0.6);
  for (const i of oreList(w)) { const x = i % W, y = (i / W) | 0; if (!seen(x, y, 1) || w.water[i] === 1) continue; const p = at(cam, x + 0.5, y + 0.8); blit(ctx, 'ore', p[0], p[1], k); }
}
function drawVolcanoes(ctx, w, cam, z) {
  if (z < 2.5) return; const k = pixScale(z, cam.dpr);
  for (const v of w.volcanoes) { if (!seen(v.x, v.y, 1) || w.h[v.y * W + v.x] < w.params.sea) continue; const p = at(cam, v.x + 0.5, v.y + 1); blit(ctx, w.year - v.last < 8 ? 'volcanoHot' : 'volcano', p[0], p[1], k); }
}
function drawRuins(ctx, w, cam, z) {
  if (z < 2.6) return; const k = pixScale(z, cam.dpr, 0.9);
  for (const r of w.ruins) {
    if (!seen(r.x, r.y, 2)) continue; const p = at(cam, r.x + 0.5, r.y + 1);
    if (r.haunt) { ctx.fillStyle = 'rgba(160,90,230,0.35)'; const q = 5 * k; ctx.fillRect(Math.round(p[0] - q), Math.round(p[1] - q * 1.4), q * 2, q * 1.6); }
    const hgt = blit(ctx, r.kind === 'drowned' ? 'ruinW' : 'ruin', p[0], p[1], k);
    if (z >= 9) label(ctx, r.name, p[0], p[1] + 2, Math.round(clamp(z * 0.55, 10, 13) * cam.dpr), '#d9d2c2', true, 5);
  }
}
function drawPeople(ctx, w, cam, z, lens, frac) {
  const names = [], k = pixScale(z, cam.dpr);
  for (const st of w.sets) {
    if (st.dead || !seen(st.x, st.y, 8)) continue; const c = w.cults[st.cult], col = colorOf(c);
    let p;
    if (st.nomad && st.mt) { const f = clamp((w.tickN - st.mt + frac) / TPY, 0, 1), e = f * f * (3 - 2 * f); p = at(cam, st.px + wrapDx(st.x - st.px) * e + 0.5, st.py + (st.y - st.py) * e + 1); } else p = at(cam, st.x + 0.5, st.y + 1);
    const x = p[0], y = p[1];
    if (st.nomad) { if (z < 2.4 && st.pop < 60) continue; blit(ctx, 'camp', x, y, k, col); continue; }
    if (z < 1.8 && st.tier < 2) { ctx.fillStyle = col; ctx.fillRect(Math.round(x - cam.dpr), Math.round(y - 2 * cam.dpr), 2 * cam.dpr, 2 * cam.dpr); continue; }
    if (st.walls && st.tier >= 2 && z >= 3) blit(ctx, 'walls', x, y + k, k, col);
    if (st.undead) {   // a town of the dead: the old houses, grey, with a cold light over them
      if (z >= 2.4) { ctx.fillStyle = 'rgba(150,255,190,0.3)'; const q = (st.capital ? 9 : 6) * k; ctx.fillRect(Math.round(x - q), Math.round(y - q * 1.5), q * 2, q * 1.7); }
      const hgt = blit(ctx, st.capital ? 'city' : st.tier >= 2 ? 'town' : 'ruin', x, y, k, '#6f766c');
      if (st.capital && z >= 1.4) names.push(st, x, y + 2 * cam.dpr);
      continue;
    }
    const era = c.tech, look = st.tier >= 3 ? (era >= 10 ? 'cityS' : era >= 8 ? 'cityM' : era >= 6 ? 'cityI' : era >= 4 ? 'cityC' : 'city') : st.tier === 2 ? (era >= 8 ? 'townM' : era >= 6 ? 'townI' : era >= 4 ? 'townC' : 'town') : st.pop > 60 ? 'village' : 'hut';
    const hgt = blit(ctx, st.machine ? 'cityM' : look, x, y, k, st.machine ? '#4affd0' : st.lost === 'fey' ? '#7fbf6a' : col);
    if (st.lost === 'fey' && z >= 3) { ctx.fillStyle = 'rgba(140,230,120,0.22)'; const q = 7 * k; ctx.fillRect(Math.round(x - q), Math.round(y - q * 1.6), q * 2, q * 1.8); }   /* a changeling village: green and quiet */
    // smoke from the stacks, lights in the windows at night-time zoom
    if (era >= 6 && era < 10 && st.tier >= 2 && z >= 3 && !still) { const t = performance.now() * 0.001 + st.id; for (let q = 0; q < 3; q++) { const u = (t * 0.5 + q / 3) % 1; ctx.fillStyle = `rgba(90,90,96,${0.7 * (1 - u)})`; ctx.fillRect(Math.round(x - 2 * k + u * 4 * k), Math.round(y - hgt - u * 9 * k), Math.round(k * (1 + u * 2)), Math.round(k * (1 + u * 2))); } }
    if (era >= 7 && st.tier >= 2 && z < 3.5) { ctx.fillStyle = 'rgba(255,220,120,0.85)'; const q = Math.max(1, Math.round(cam.dpr)); for (let n = 0; n < (st.tier >= 3 ? 9 : 4); n++) { const a = n * 2.4 + st.id, r = (1 + (n % 3)) * z * cam.dpr * 0.7; ctx.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y - 2 * cam.dpr + Math.sin(a) * r * 0.6), q, q); } }
    if (st.plague > 0 && z >= 3) { ctx.fillStyle = '#b6ff3d'; for (let q = 0; q < 4; q++) { const a = (q / 4) * 6.283 + (still ? 0 : performance.now() * 0.002); ctx.fillRect(Math.round(x + Math.cos(a) * 7 * k), Math.round(y - hgt / 2 + Math.sin(a) * 5 * k), k, k); } }
    if (st.wonder && z >= 3) blit(ctx, 'wonder', x + 8 * k, y, k);
    if (st.tower && z >= 3) blit(ctx, 'tower', x - 7 * k, y, k);
    if (st.name && (st.tier === 3 ? z >= 2.2 : st.tier === 2 ? z >= 5 : z >= 10)) names.push(st, x, y + 2 * cam.dpr);
  }
  for (let q = 0; q < names.length; q += 3) { const st = names[q]; label(ctx, st.name, names[q + 1], names[q + 2], Math.round((st.tier === 3 ? 13 : st.tier === 2 ? 11.5 : 10.5) * cam.dpr), '#fff', false, st.tier * 100 + Math.log(st.pop + 1)); }
  if (lens === 6 || lens === 0) for (const c of w.cults) if (lens === 6 || (z < 4 && (c.count >= 8 || (c.over && c.over.kind === 'dragon')))) { if (!c.alive || c.power || !c.big || c.count < 2 || !seen(c.big.x, c.big.y, 10)) continue; const p = at(cam, c.big.x + 0.5, c.big.y + 0.5); const px = Math.round(clamp(9 + Math.sqrt(c.count) * 1.6, 11, 20) * cam.dpr), yy = p[1] - clamp(z * 2.4, 22, 46) * cam.dpr; const dk = c.over && c.over.kind === 'dragon'; label(ctx, dk ? 'DRAGON KINGDOM OF ' + c.name.toUpperCase() : c.name.toUpperCase(), p[0], yy, px, dk ? '#f0a43a' : colorOf(c), false, 1000 + c.pop / 100); }
  if (lens === 9) { const top = new Map(); for (const st of w.sets) if (!st.dead && st.faith != null && (!top.has(st.faith) || top.get(st.faith).pop < st.pop)) top.set(st.faith, st);
    for (const [id, st] of top) { const f = w.faiths[id]; if (!f.alive || f.towns < 2 || !seen(st.x, st.y, 10)) continue; const p = at(cam, st.x + 0.5, st.y + 0.5); label(ctx, f.name.replace(/^the /, '').toUpperCase(), p[0], p[1] - clamp(z * 2.4, 22, 46) * cam.dpr, Math.round(clamp(10 + Math.sqrt(f.towns), 12, 20) * cam.dpr), f.color, false, 1000 + f.towns); } }
}
// Everyone on the road. Colour says whose they are; shape says what they are doing.
function drawMovers(ctx, w, cam, z, frac) {
  if (z < 2.2) return; const k = pixScale(z, cam.dpr, 0.85);
  for (const m of w.movers) {
    if (m.done) continue; const x = m.px + wrapDx(m.x - m.px) * frac + 0.5, y = m.py + (m.y - m.py) * frac + 0.8; if (!seen(x, y, 2)) continue; const p = at(cam, x, y);
    const c = w.cults[m.cult]; if (!c) continue; const col = m.kind === 'tribute' ? '#f2c94c' : m.kind === 'trade' && m.goods >= 0 ? GOODS[m.goods].col : c.color, flip = wrapDx(m.x - m.px) < 0;
    if (m.dead || (c && c.power === 'dead' && m.kind === 'army')) { blit(ctx, 'shamblers', p[0], p[1], k, '#9fb59a', flip); continue; }
    if (m.kind === 'missile') { const t = (wrapDx(m.tx - m.x) < 0); blit(ctx, 'missile', p[0], p[1] - 6 * k, k, null, t); continue; }
    const era = c.tech;
    if (m.kind === 'army' && m.path && m.n0 && z >= 3) { const a = Math.max(0, (m.pi || 0) - 60); ctx.strokeStyle = c.color; ctx.globalAlpha = 0.45; ctx.lineWidth = Math.max(1, Math.min(6, Math.sqrt(m.n) / 4) * cam.dpr); ctx.setLineDash([]); pathLine(ctx, cam, m.path, a, (m.pi || 0) + 1); ctx.globalAlpha = 1; }   /* the march so far, as thick as the army still is */
    if (m.wet) { blit(ctx, m.kind === 'trade' || m.kind === 'army' ? (era >= 8 ? 'liner' : era >= 6 ? 'steamer' : 'ship') : 'boat', p[0], p[1], k, col, flip); if (m.kind === 'army') { ctx.fillStyle = '#e03a1f'; ctx.fillRect(Math.round(p[0] - k), Math.round(p[1] - 8 * k), 2 * k, k); } continue; }
    blit(ctx, m.kind === 'army' || m.kind === 'home' ? (era >= 8 ? 'tanks' : era >= 6 ? 'rifles' : era >= 4 && c.arts.stirrups ? 'knights' : 'army') : m.kind === 'trade' || m.kind === 'tribute' ? (era >= 8 ? 'truck' : era >= 6 && c.arts.railways && m.path ? 'train' : 'caravan') : m.kind === 'settlers' ? 'settlers' : 'refugees', p[0], p[1], k, col, flip);
  }
}
function drawSwarms(ctx, w, cam, z, now, frac) {
  const s = Math.max(1, Math.round(cam.dpr * Math.max(1, z / 6)));
  for (const sw of w.swarms) { const x = sw.px + wrapDx(sw.x - sw.px) * frac + 0.5, y = sw.py + (sw.y - sw.py) * frac + 0.5; if (!seen(x, y, 6)) continue; const p = at(cam, x, y);
    const R = 3.4 * z * cam.dpr, t = still ? 0 : now * 0.004; ctx.fillStyle = 'rgba(44,34,12,0.9)';
    for (let k = 0; k < 60; k++) { const a = hash2(k, 1, 5) * TAU + t * (0.5 + hash2(k, 2, 5)), r = Math.sqrt(hash2(k, 3, 5)) * R; ctx.fillRect(Math.round(p[0] + Math.cos(a) * r), Math.round(p[1] + Math.sin(a) * r * 0.85), s, s); } }
}
// what lives in the deep water
function drawSea(ctx, w, cam, z, now) {
  const k = pixScale(z, cam.dpr, 1.4);
  for (const kr of w.krakens) { if (!seen(kr.x, kr.y, 6)) continue; const p = at(cam, kr.x + 0.5, kr.y + 1); const up = kr.wake > 0 || z >= 5;
    if (up) { const bob = still ? 0 : Math.round(Math.sin(now * 0.004) * k); blit(ctx, 'kraken', p[0], p[1] + bob, k); }
    else { ctx.fillStyle = 'rgba(180,200,220,0.5)'; ctx.fillRect(Math.round(p[0] - 4 * k), Math.round(p[1]), 8 * k, k); }
    if (z >= 7) label(ctx, kr.name, p[0], p[1] + 2 * cam.dpr, Math.round(11 * cam.dpr), '#d9c2ee', true, 50); }
  const g = w.great; if (g && seen(g.x, g.y, 20)) { const p = at(cam, g.x + 0.5, g.y + 1), kk = k * 3, bob = still ? 0 : Math.round(Math.sin(now * 0.002) * kk); blit(ctx, 'kraken', p[0], p[1] + bob, kk);
    ctx.strokeStyle = 'rgba(120,60,150,0.5)'; ctx.lineWidth = Math.max(1, cam.dpr); ctx.beginPath(); ctx.arc(p[0], p[1], 90 * z * cam.dpr, 0, 6.2832); ctx.stroke(); label(ctx, g.name, p[0], p[1] + 6 * cam.dpr, Math.round(13 * cam.dpr), '#e3c8ff', true, 200); }
}
// the other world: wellsprings, the things that rose from memory, and ley storms on the move
const SPR_OF = { winter: 'winter', burned: 'shamblers', host: 'host', shamblers: 'shamblers', lich: 'lich', hunger: 'hunger', drowned: 'drowned', fey: 'fey', saint: 'saint' };
function drawOther(ctx, w, cam, z, now, frac) {
  const k = pixScale(z, cam.dpr);
  if (z >= 1.6) for (const q of w.wells) { if (!seen(q.x, q.y, 2)) continue; const p = at(cam, q.x + 0.5, q.y + 1); blit(ctx, 'well', p[0], p[1], k, KINDS[q.kind || 0].col); if (z >= 5 && q.name) label(ctx, cap(q.name), p[0], p[1] + 2 * cam.dpr, Math.round(10 * cam.dpr), '#e6dcff', true, 30); }
  // the borders of great powers: a ragged ring in their colour
  for (const sp of w.spirits.filter((p) => !(p.kind === 'fey' && p.cells)).concat(w.dragons.filter((d) => d.R).map((d) => ({ x: d.lx, y: d.ly, R: d.R, kind: 'dragon', name: d.name })), w.machines || [])) { if (!sp.R || !seen(sp.x, sp.y, sp.R + 4)) continue; const c = at(cam, sp.x + 0.5, sp.y + 0.5), R = sp.R * z * cam.dpr, q = Math.max(2, Math.round(cam.dpr * 2)); ctx.fillStyle = sp.kind === 'dragon' ? '#ff7a3a' : sp.kind === 'machine' ? '#4affd0' : KINDS[SPIRIT_KINDS[sp.kind].mem].col; ctx.globalAlpha = 0.75;
    for (let n = 0; n < 90; n++) { if (n % 3 === 2) continue; const a = (n / 90) * TAU, r = R * (0.96 + 0.06 * Math.sin(n * 1.7 + sp.x)); ctx.fillRect(Math.round((c[0] + Math.cos(a) * r) / q) * q, Math.round((c[1] + Math.sin(a) * r) / q) * q, q, q); } ctx.globalAlpha = 1;
    if (z < 6 && z > 1) label(ctx, cap(sp.name), c[0], c[1] - R - 6 * cam.dpr, Math.round(11 * cam.dpr), ctx.fillStyle, true, 70); }
  if (z >= 2.2) for (const sp of w.spirits) { if (!seen(sp.x, sp.y, 2)) continue; const x = sp.px + wrapDx(sp.x - sp.px) * frac + 0.5, y = sp.py + (sp.y - sp.py) * frac + 1; const p = at(cam, x, y); const bob = still || sp.kind === 'lich' || sp.kind === 'saint' || sp.kind === 'drowned' ? 0 : Math.round(Math.sin(now * 0.003 + sp.id) * k); blit(ctx, SPR_OF[sp.kind], p[0], p[1] + bob, k); if (z >= 6) label(ctx, cap(sp.name), p[0], p[1] + 2 * cam.dpr, Math.round(10 * cam.dpr), KINDS[SPIRIT_KINDS[sp.kind].mem].col, true, 40); }
  if (z >= 1.6) for (const m of w.machines || []) { if (!seen(m.x, m.y, 3)) continue; const p = at(cam, m.x + 0.5, m.y + 1); blit(ctx, 'mind', p[0], p[1] - 10 * k, k + 1); }
  for (const st of w.storms2) { const x = st.px + wrapDx(st.x - st.px) * frac + 0.5, y = st.py + (st.y - st.py) * frac + 0.5; if (!seen(x, y, 4)) continue; const p = at(cam, x, y), col = KINDS[st.kind].col, q = Math.max(2, Math.round(z * cam.dpr * 0.35));
    for (let n = 0; n < 14; n++) { const a = n * 2.4 + (still ? 0 : now * 0.004), r = (0.4 + (n % 5) * 0.35) * z * cam.dpr; ctx.fillStyle = col; ctx.globalAlpha = 0.9 - (n % 5) * 0.15; ctx.fillRect(Math.round((p[0] + Math.cos(a) * r) / q) * q, Math.round((p[1] + Math.sin(a) * r) / q) * q, q, q); } ctx.globalAlpha = 1; }
}
// the fey courts: the edge of each court's forest, one cell wide, at every zoom (slice 14)
let rimKey = -1, rim = [], inner = [];
function drawCourts(ctx, w, cam, s) {
  const CO = w.courtOf; if (!CO) return;
  if (rimKey !== w.courtStamp) { rimKey = w.courtStamp; rim = []; inner = []; for (const p of w.spirits) { if (!p.cells || p.dead) continue; for (const i of p.cells) { const x = i % W, y = (i / W) | 0; let e = 0; inner.push(x, y);
    if (CO[y * W + wx(x + 1)] !== p.slot) e |= 1; if (CO[y * W + wx(x - 1)] !== p.slot) e |= 2; if (y > 0 && CO[i - W] !== p.slot) e |= 4; if (y < H - 1 && CO[i + W] !== p.slot) e |= 8; if (e) rim.push(x, y, e); } } }
  if (!rim.length) return; const q = Math.max(1, Math.round(s * 0.3)), sz = Math.max(1, s);
  ctx.fillStyle = 'rgba(150,255,120,0.13)'; for (let k = 0; k < inner.length; k += 2) { const x = inner[k], y = inner[k + 1]; if (!seen(x, y, 1)) continue; const p = at(cam, x, y); ctx.fillRect(Math.round(p[0]), Math.round(p[1]), Math.ceil(sz), Math.ceil(sz)); }
  ctx.fillStyle = '#b6ff8c'; ctx.globalAlpha = 0.95;
  for (let k = 0; k < rim.length; k += 3) { const x = rim[k], y = rim[k + 1], e = rim[k + 2]; if (!seen(x, y, 1)) continue; const p = at(cam, x, y), X = Math.round(p[0]), Y = Math.round(p[1]), S2 = Math.max(1, Math.round(sz));
    if (s < 2) { ctx.fillRect(X, Y, S2, S2); continue; }
    if (e & 1) ctx.fillRect(X + S2 - q, Y, q, S2); if (e & 2) ctx.fillRect(X, Y, q, S2); if (e & 4) ctx.fillRect(X, Y, S2, q); if (e & 8) ctx.fillRect(X, Y + S2 - q, S2, q); }
  ctx.globalAlpha = 1;
  if (s > 1 * cam.dpr && s < 6 * cam.dpr) for (const p of w.spirits) if (p.cells && !p.dead && p.name && seen(p.x, p.y, 4)) { const c = at(cam, p.x + 0.5, p.y + 0.5); label(ctx, cap(p.name), c[0], c[1] - 4 * s, Math.round(11 * cam.dpr), '#9cf07e', true, 70); }
}
// the Tongues lens (slice 14, after EU5's language map): every owned cell in its town's tongue, the
// hue for the family and the lightness for the tongue; thick lines where the family changes, thin
// where only the tongue does, realm borders dashed; diagonal hatching in the court's colour where a
// town does not speak its rulers' tongue. Family names spaced out when far, tongue names when near.
const NB8o = [[1, 0], [-1, 0], [0, -1], [0, 1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
const TPX = 4; let tmKey = '', tmCv = null, tmE = [], tmFam = [];
function hsl2rgb(h, s, l) { const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)); return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]; }
function buildTongues(w) {
  if (!tmCv) { tmCv = document.createElement('canvas'); tmCv.width = W * TPX; tmCv.height = H * TPX; }
  const g = tmCv.getContext('2d'), img = g.createImageData(W * TPX, H * TPX), u = new Uint32Array(img.data.buffer), WW = W * TPX;
  const col = new Map(), fam = new Map(), rgb = (id) => { let v = col.get(id); if (v == null) { const [h, s2, l] = tongueHsl(w, id), c = hsl2rgb(h, s2 / 100, l / 100); v = ((235 << 24) | (c[2] << 16) | (c[1] << 8) | c[0]) >>> 0; col.set(id, v); } return v; };
  const famOf = (id) => { let f = fam.get(id); if (f == null) { f = familyOf(w, id); fam.set(id, f); } return f; };
  // each land cell speaks as its nearest town does, out to a dozen cells (a flood out from every town at once)
  const T = new Int32Array(N).fill(-1), R = new Int32Array(N).fill(-1), D = new Uint8Array(N), Q = new Int32Array(N), O = new Int32Array(N).fill(-1); let qn = 0;
  for (let k = 0; k < w.sets.length; k++) { const t = w.sets[k]; if (t.dead || t.nomad || t.lang == null || !w.langs[t.lang]) continue; const c = w.cults[t.cult]; if (!c || c.power) continue; const i = t.y * W + t.x; if (w.water[i] || O[i] >= 0) continue; O[i] = k; Q[qn++] = i; }
  for (let hd = 0; hd < qn; hd++) { const i = Q[hd], x = i % W, y = (i / W) | 0; if (D[i] >= 12) continue;
    for (let d = 0; d < (D[i] & 1 ? 8 : 4); d++) { const nb = NB8o[d], yy = y + nb[1]; if (yy < 0 || yy >= H) continue; const j = yy * W + wx(x + nb[0]); if (O[j] >= 0 || w.water[j] === 1) continue;   /* diagonals every other step: rounder lands */ O[j] = O[i]; D[j] = D[i] + 1; Q[qn++] = j; } }
  for (let i = 0; i < N; i++) { const o = O[i]; if (o < 0) continue; const t = w.sets[o], c = w.cults[t.cult];
    T[i] = t.lang; R[i] = t.cult; const base = rgb(t.lang), hatch = c.langId != null && c.langId !== t.lang && w.langs[c.langId] ? rgb(c.langId) : 0, x0 = (i % W) * TPX, y0 = ((i / W) | 0) * TPX;
    for (let py = 0; py < TPX; py++) { const r = (y0 + py) * WW; for (let px = 0; px < TPX; px++) { const X = x0 + px; u[r + X] = hatch && (X + y0 + py) % 7 < 2 ? hatch : base; } } }
  g.putImageData(img, 0, 0);
  tmE = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x, a = T[i];
    const nb = [y * W + (x + 1) % W, y < H - 1 ? i + W : -1];
    for (let d = 0; d < 2; d++) { const j = nb[d]; if (j < 0) continue; const b = T[j]; if (a === b && R[i] === R[j]) continue; if (a < 0 && b < 0) continue;
      const k = a < 0 || b < 0 || famOf(a) !== famOf(b) ? 2 : a !== b ? 1 : 0, realm = a >= 0 && b >= 0 && R[i] !== R[j]; tmE.push(x, y, d, k | (realm ? 4 : 0)); } }
  // where to write each family's name: the middle of its towns, weighted by people
  const acc = new Map(); for (const t of w.sets) { if (t.dead || t.lang == null || !w.langs[t.lang] || w.cults[t.cult].power) continue; const f = famOf(t.lang); let q = acc.get(f); if (!q) acc.set(f, (q = { f, x0: t.x, sx: 0, sy: 0, n: 0, towns: 0 })); q.sx += wrapDx(t.x - q.x0) * t.pop; q.sy += t.y * t.pop; q.n += t.pop; q.towns++; }
  tmFam = [...acc.values()].filter((q) => q.towns >= 3 && q.n > 0).map((q) => ({ name: w.langs[q.f].name, x: (q.x0 + q.sx / q.n + W) % W, y: q.sy / q.n, n: q.n, id: q.f }));
}
function drawTongues(ctx, w, cam, s) {
  if (!w.langs) return; const key = Math.floor(w.year / 4) + ':' + w.sets.length + ':' + w.cults.length; if (key !== tmKey || !tmCv) { tmKey = key; buildTongues(w); }
  ctx.imageSmoothingEnabled = false; const o = at(cam, 0, 0), x0 = o[0], y0 = o[1], ws = W * s;
  for (let k = -1; k <= 1; k++) { const X = x0 + k * ws; if (X > cam.w || X + ws < 0) continue; ctx.drawImage(tmCv, Math.round(X), Math.round(y0), Math.round(ws), Math.round(H * s)); }
  // borders
  const thick = Math.max(1, Math.round(s * 0.28)), thin = Math.max(1, Math.round(s * 0.12));
  for (let n = 0; n < tmE.length; n += 4) { const x = tmE[n], y = tmE[n + 1], d = tmE[n + 2], k = tmE[n + 3]; if (!seen(x, y, 1)) continue; const kind = k & 3;
    if (kind === 1 && s < 2.5) continue; const p = at(cam, x + (d === 0 ? 1 : 0), y + (d === 1 ? 1 : 0)), q = kind === 2 ? thick : thin, L = Math.max(1, Math.ceil(s));
    if (kind) { ctx.fillStyle = kind === 2 ? 'rgba(18,16,14,0.85)' : 'rgba(18,16,14,0.6)'; if (d === 0) ctx.fillRect(Math.round(p[0] - q / 2), Math.round(p[1]), q, L); else ctx.fillRect(Math.round(p[0]), Math.round(p[1] - q / 2), L, q); }
    if ((k & 4) && s >= 1.5 && (x + y) % 2 === 0) { ctx.fillStyle = 'rgba(250,244,230,0.85)'; const r = Math.max(1, Math.round(s * 0.12)); if (d === 0) ctx.fillRect(Math.round(p[0] - r / 2), Math.round(p[1]), r, L); else ctx.fillRect(Math.round(p[0]), Math.round(p[1] - r / 2), L, r); } }
  // names
  if (cam.z < 3) { for (const f of tmFam) { if (!seen(f.x, f.y, 20)) continue; const p = at(cam, f.x + 0.5, f.y + 0.5); label(ctx, f.name.toUpperCase().split('').join(' '), p[0], p[1], Math.round(clamp(10 + Math.sqrt(f.n) / 12, 11, 17) * cam.dpr), '#f4ead8', false, 900 + f.n / 100); } return; }
  const big = new Map(); for (const t of w.sets) { if (t.dead || t.lang == null || !seen(t.x, t.y, 4)) continue; const b = big.get(t.lang); if (!b || t.pop > b.pop) big.set(t.lang, t); }
  for (const [id, t] of big) { const p = at(cam, t.x + 0.5, t.y + 0.5); label(ctx, w.langs[id].name, p[0], p[1] - s * 1.6, Math.round(11 * cam.dpr), '#f4ead8', true, 40 + Math.sqrt(w.langs[id].pop)); }
}
function tongueCard(w, x, y) {
  if (!w.langs) return null; const i = y * W + ((x + W) % W), o = w.owner[i]; if (o < 0) return null; const t = w.sets[o]; if (!t || t.dead || t.lang == null) return null; const L = w.langs[t.lang]; if (!L) return null;
  const F = w.langs[familyOf(w, L.id)], P = L.parent != null ? w.langs[L.parent] : null, c = w.cults[t.cult];
  const realms = new Map(); for (const s of w.sets) if (!s.dead && s.lang === L.id) { const r = w.cults[s.cult]; if (r && !r.power) realms.set(r.id, (realms.get(r.id) || 0) + 1); }
  const rl = [...realms.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([id]) => 'the ' + w.cults[id].name);
  const court = c && c.langId != null && w.langs[c.langId] ? w.langs[c.langId] : null;
  return { title: L.name, color: tongueColor(w, L.id), lines: [
    F && F.id !== L.id ? `A tongue of the ${F.name} family.` : `The first tongue of its family${P ? `, apart from ${P.name} long enough to be its own` : ''}.`,
    P ? `It grew out of ${P.name} in year ${L.born}.` : `It is as old as its people.`,
    `Spoken in ${L.towns} ${L.towns === 1 ? 'town' : 'towns'} by about ${big(L.pop)} people${rl.length ? `, under ${list(rl)}` : ''}.`,
    court && court.id !== L.id ? `${t.name || 'This place'} is ruled by the ${c.name}, whose court speaks ${court.name}. (Hatched.)` : c ? `It is the court tongue of the ${c.name}.` : ''].filter(Boolean) };
}
// a polyline through world cells; breaks where the map wraps
function pathLine(ctx, cam, cells, from, to) {
  let px = null, py = 0, on = false; const lim = cam.w * 0.5; from = from || 0; to = to == null ? cells.length : to;
  ctx.beginPath();
  for (let k = from; k < to; k++) { const i = cells[k], p = at(cam, (i % W) + 0.5, ((i / W) | 0) + 0.5), x = p[0], y = p[1];
    if (px === null || Math.abs(x - px) > lim) { ctx.moveTo(x, y); on = false; } else { ctx.lineTo(x, y); on = true; } px = x; py = y; }
  ctx.stroke(); return on;
}
const pathSeen = (cells) => { const n = cells.length; for (const k of [0, n >> 1, n - 1]) { const i = cells[k]; if (seen(i % W, (i / W) | 0, 24)) return true; } return false; };
// tracks worn by traders (Land lens, close in); in the Trade lens every way by its grade, and the sea lanes
const GRADE = [null, { c: '#9a7a55', d: [3, 3], wd: 1 }, { c: '#d6c29a', d: [], wd: 1.6 }, { c: '#2a2628', d: [], wd: 2 }];
function drawWays(ctx, w, cam, z, lens) {
  const Tr = travelOf(w); if (!Tr || !Tr.edges) return; const q = Math.max(1, cam.dpr), wear = w.tracks || new Map();
  if (lens === 0 && z >= 2.2) {
    ctx.strokeStyle = '#7a5f42'; ctx.lineWidth = Math.max(1, Math.round(q * Math.min(1.6, z / 4))); ctx.setLineDash([2 * q, 3 * q]); ctx.lineCap = 'round';
    for (const e of Tr.edges.values()) { if (e.grade !== 1 || !e.path || !pathSeen(e.path)) continue; ctx.globalAlpha = Math.min(0.85, 0.3 + (wear.get(e.key) || 0) / 8); pathLine(ctx, cam, e.path); }
    ctx.setLineDash([]); ctx.globalAlpha = 1;
  }
  if (lens === 0 && z < 5) {   /* the sea lanes, faint, where ships run often */
    ctx.strokeStyle = 'rgba(225,240,255,0.35)'; ctx.lineWidth = q; ctx.setLineDash([1 * q, 4 * q]);
    for (const r of w.routes.values()) { if (!r.wet || r.n < 3) continue; const L = laneFor(Tr, r); if (!L || !L.path || !pathSeen(L.path)) continue; pathLine(ctx, cam, L.path); }
    ctx.setLineDash([]);
  }
  if (lens !== 14) return;
  for (let g = 1; g <= 3; g++) { const G = GRADE[g]; ctx.strokeStyle = G.c; ctx.lineWidth = G.wd * q * Math.max(1, z / 3); ctx.setLineDash(G.d.map((v) => v * q)); ctx.globalAlpha = 0.9;
    for (const e of Tr.edges.values()) if (e.grade === g && e.path && pathSeen(e.path)) pathLine(ctx, cam, e.path); }
  ctx.setLineDash([]); ctx.globalAlpha = 1;
}
// the Trade lens: every route as a line, as thick as its traffic, in the colour of what it carries
function drawRoutes(ctx, w, cam, z, lens) {
  if (lens !== 14) { if (z < 1.2 || z > 6) return; for (const r of w.routes.values()) if (r.name && seen(r.a.x, r.a.y, 30)) { const a = at(cam, r.a.x + 0.5, r.a.y + 0.5).slice(), b = at(cam, r.a.x + wrapDx(r.b.x - r.a.x) + 0.5, r.b.y + 0.5); label(ctx, r.name, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.round(10 * cam.dpr), r.wet ? '#bfe4ff' : '#f2e0b0', true, 20 + r.n); } return; }
  const q = Math.max(1, Math.round(cam.dpr));
  for (const [rk, r] of w.routes) {
    if (r.n < 0.5) continue; let bg = 0; for (let g = 1; g < GOODS.length; g++) if (r.g[g] > r.g[bg]) bg = g;
    const a = at(cam, r.a.x + 0.5, r.a.y + 0.5).slice(), dx = wrapDx(r.b.x - r.a.x), b = at(cam, r.a.x + dx + 0.5, r.b.y + 0.5); if (Math.max(a[0], b[0]) < 0 || Math.min(a[0], b[0]) > cam.w) continue;
    ctx.strokeStyle = r.g[bg] > 0 ? GOODS[bg].col : '#d8d0c0'; ctx.globalAlpha = Math.min(1, 0.35 + r.n / 10); ctx.lineWidth = q * Math.min(7, 1 + Math.sqrt(r.n)); ctx.setLineDash(r.wet ? [4 * q, 3 * q] : []);
    const Tw = travelOf(w), chain = Tw && Tw.routeWays && Tw.routeWays.get(rk), lane = Tw && laneFor(Tw, r);
    if (chain) { for (const e of chain) if (e.path) pathLine(ctx, cam, e.path); }
    else if (lane && lane.path) { pathLine(ctx, cam, lane.path); ctx.setLineDash([]); ctx.globalAlpha *= 0.6; ctx.lineWidth = q; const s0 = lane.path[0], s1 = lane.path[lane.path.length - 1]; for (const [t, c] of [[r.a, s0], [r.b, s1]]) { pathLine(ctx, cam, [t.y * W + t.x, c]); } }
    else { ctx.beginPath(); ctx.moveTo(Math.round(a[0]), Math.round(a[1])); ctx.lineTo(Math.round(b[0]), Math.round(b[1])); ctx.stroke(); }
    if (r.name) label(ctx, r.name, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 6 * cam.dpr, Math.round(11 * cam.dpr), GOODS[r.good ?? bg].col, true, 60 + r.n);
  }
  ctx.setLineDash([]); ctx.globalAlpha = 1;
  for (const s of w.sets) if (s.entrepot && !s.dead && seen(s.x, s.y, 2)) { const p = at(cam, s.x + 0.5, s.y + 0.5), R = 5 * q + z * cam.dpr * 0.7; ctx.strokeStyle = '#ff9a3a'; ctx.lineWidth = 2 * q; ctx.beginPath(); ctx.moveTo(p[0], p[1] - R); ctx.lineTo(p[0] + R, p[1]); ctx.lineTo(p[0], p[1] + R); ctx.lineTo(p[0] - R, p[1]); ctx.closePath(); ctx.stroke(); }   /* entrepôts: an orange diamond */
  for (const s of w.sets) if (s.occ && !s.dead && seen(s.x, s.y, 2)) { const oc = w.cults[s.occ.by]; if (!oc) continue; const p = at(cam, s.x + 0.5, s.y + 0.5), R = 5 * q + z * cam.dpr * 0.8; ctx.save(); ctx.beginPath(); ctx.arc(p[0], p[1], R, 0, 6.2832); ctx.clip(); ctx.strokeStyle = oc.color; ctx.lineWidth = 1.5 * q; ctx.beginPath(); for (let k = -2; k <= 2; k++) { const o = (k * R) / 2; ctx.moveTo(p[0] + o - R, p[1] + R); ctx.lineTo(p[0] + o + R, p[1] - R); } ctx.stroke(); ctx.restore(); ctx.strokeStyle = oc.color; ctx.lineWidth = 1.2 * q; ctx.beginPath(); ctx.arc(p[0], p[1], R, 0, 6.2832); ctx.stroke(); }   /* (slice 1b) occupied towns: hatched in the occupier's colour */
  for (const s of w.sets) { if (s.dead || s.nomad || !seen(s.x, s.y, 2)) continue; const c = w.cults[s.cult]; if (!c || !c.over || c.over.kind !== 'realm') continue; const oc = w.cults[c.over.id]; if (!oc) continue; const p = at(cam, s.x + 0.5, s.y + 0.5), R = 4 * q + z * cam.dpr * 0.6; ctx.strokeStyle = oc.color; ctx.lineWidth = 1.5 * q; ctx.beginPath(); ctx.arc(p[0], p[1], R, 0, 6.2832); ctx.stroke(); }   /* (Oct 30) a protectorate's towns: a ring in the overlord's colour */
  for (const s of w.sets) if (s.siege && !s.dead && seen(s.x, s.y, 2)) { const sc = w.cults[s.siege.by]; if (!sc) continue; const p = at(cam, s.x + 0.5, s.y + 0.5), R = 7 * q + z * cam.dpr; ctx.strokeStyle = sc.color; ctx.lineWidth = 2 * q; ctx.setLineDash([3 * q, 3 * q]); ctx.beginPath(); ctx.arc(p[0], p[1], R, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]); }   /* (slice 2) a siege: a dashed ring of the besiegers' colour */
  for (const s of w.sets) if (s.market && seen(s.x, s.y, 2)) { const p = at(cam, s.x + 0.5, s.y + 0.5), R = 4 * q + z * cam.dpr * 0.6; ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = 2 * q; ctx.strokeRect(Math.round(p[0] - R), Math.round(p[1] - R), Math.round(2 * R), Math.round(2 * R)); }
  for (const p of w.pirates) { if (!seen(p.x, p.y, 3)) continue; const s = at(cam, p.x + 0.5, p.y + 0.5); blit(ctx, 'ship', s[0], s[1], pixScale(z, cam.dpr), '#1b1714'); label(ctx, p.name, s[0], s[1] + 4 * cam.dpr, Math.round(10 * cam.dpr), '#ff8a7a', true, 45); }
}
function drawDragons(ctx, w, cam, z, now, frac) {
  for (const d of w.dragons) {
    const k = pixScale(z, cam.dpr, 1.3);
    if (d.king != null && !d.dead && d.st !== 'fly' && z >= 0.9 && seen(d.lx, d.ly, 3)) { const p = at(cam, d.lx + 0.5, d.ly + 0.5), kk = Math.max(1, pixScale(z, cam.dpr, 1.6)); blit(ctx, d.st === 'sleep' ? 'dragonSleep' : 'dragon', p[0], p[1] - 6 * kk, kk); if (z >= 3) label(ctx, d.name.split(',')[0], p[0], p[1] - 14 * kk, Math.round(11 * cam.dpr), '#ffb27a', true, 300); continue; }
    if (z >= 2.6 && seen(d.lx, d.ly, 2)) { const p = at(cam, d.lx + 0.5, d.ly + 1); blit(ctx, d.st === 'sleep' ? 'dragonSleep' : 'lair', p[0], p[1], pixScale(z, cam.dpr)); if (z >= 6) label(ctx, d.name, p[0], p[1] + 2 * cam.dpr, Math.round(11 * cam.dpr), '#ffb27a', true, 50); }
    const fly = d.st === 'fly' || d.st === 'home'; if (!fly && d.st !== 'wake') continue;
    const x = d.px + wrapDx(d.x - d.px) * frac + 0.5, y = d.py + (d.y - d.py) * frac + 0.5; if (!seen(x, y, 4)) continue; const p = at(cam, x, y);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(Math.round(p[0] - 4 * k), Math.round(p[1] + 3 * k), 8 * k, k);
    const flap = still ? 0 : Math.round(Math.sin(now * 0.012) * k);
    blit(ctx, 'dragon', p[0], p[1] - 4 * k + flap, k, null, wrapDx(d.tx - d.x) < 0);
  }
}
// storms: a spiral of pale pixels turning slowly
function drawStorms(ctx, w, cam, s, now, frac) {
  const q = Math.max(2, Math.round(s * 0.5));
  for (const st of w.storms) {
    const px = st.px == null ? st.x : st.px, py = st.py == null ? st.y : st.py, x = px + wrapDx(st.x - px) * frac, y = py + (st.y - py) * frac; if (!seen(x, y, 10)) continue; toScreen(cam, x, y, A);
    const R = (3 + 3.2 * st.str) * s, rot = (still ? 0 : now * 0.0016) + st.spin, sg = y < H / 2 ? -1 : 1;
    for (let arm = 0; arm < 3; arm++) for (let k = 0; k <= 26; k++) { const tt = k / 26, a = rot * sg + arm * (TAU / 3) + sg * tt * 3.6, rr = R * (0.1 + 0.9 * tt); ctx.fillStyle = `rgba(245,248,252,${0.85 - tt * 0.4})`; ctx.fillRect(Math.round((A[0] + Math.cos(a) * rr) / q) * q, Math.round((A[1] + Math.sin(a) * rr * 0.9) / q) * q, q, q); }
  }
}

function drawFx(ctx, w, cam, s, now) {
  const jar = ctx.canvas.parentNode; let shake = 0;
  for (const f of w.fx) {
    if (f.t0 == null) f.t0 = now; const u = (now - f.t0) / (f.T * 1000); if (u >= 1) { f.done = true; continue; }
    toScreen(cam, f.x + 0.5, f.y + 0.5, A);
    if (f.k === 'boom') { const R = (2 + 9 * Math.sqrt(u)) * s; ctx.beginPath(); ctx.arc(A[0], A[1], R, 0, TAU); ctx.fillStyle = `rgba(255,${Math.round(230 - 120 * u)},${Math.round(160 - 150 * u)},${0.8 * (1 - u)})`; ctx.fill(); ctx.lineWidth = 3 * cam.dpr; ctx.strokeStyle = `rgba(255,255,255,${1 - u})`; ctx.stroke(); shake = Math.max(shake, 1 - u); }
    else if (f.k === 'nuke') { const q = Math.max(2, Math.round(s * 0.5)), R = (3 + 12 * Math.sqrt(u)) * s, rise = u * 16 * s; shake = Math.max(shake, 1 - u);
      for (let k = 0; k < 90; k++) { const a = k * 2.399, r = R * Math.sqrt((k % 30) / 30), stem = k < 30, x = stem ? A[0] + Math.sin(a) * s * 1.2 : A[0] + Math.cos(a) * r, y = stem ? A[1] - (k / 30) * rise : A[1] - rise + Math.sin(a) * r * 0.45; ctx.fillStyle = `rgba(255,${(200 - 160 * u) | 0},${(120 - 110 * u) | 0},${1 - u})`; ctx.fillRect(Math.round(x / q) * q, Math.round(y / q) * q, q, q); } }
    else if (f.k === 'flash') { if (!still) { ctx.fillStyle = `rgba(255,255,255,${0.85 * (1 - u)})`; ctx.fillRect(0, 0, cam.w, cam.h); } }
    else if (f.k === 'plume') { for (let q = 0; q < 9; q++) { const a = u * 1.6 + q * 0.11, d = a * 9 * s, rr = (1 + a * 3) * s; ctx.beginPath(); ctx.arc(A[0] + f.ux * d + Math.sin(q * 7.1) * rr * 0.4, A[1] + f.uy * d - a * s * 1.5 + Math.cos(q * 5.3) * rr * 0.4, rr, 0, TAU); ctx.fillStyle = `rgba(52,46,44,${0.5 * (1 - u)})`; ctx.fill(); }
      ctx.beginPath(); ctx.arc(A[0], A[1], s * (0.8 + 0.5 * Math.sin(now * 0.02)), 0, TAU); ctx.fillStyle = `rgba(255,150,40,${1 - u})`; ctx.fill(); shake = Math.max(shake, 0.5 * (1 - u)); }
    else if (f.k === 'ring') { const R = f.R * u * s; ctx.beginPath(); ctx.arc(A[0], A[1], R, 0, TAU); ctx.lineWidth = (2 + 5 * (1 - u)) * cam.dpr; ctx.strokeStyle = `rgba(215,245,255,${0.85 * (1 - u)})`; ctx.stroke(); }
    else if (f.k === 'shake') { shake = Math.max(shake, 1 - u); ctx.beginPath(); ctx.arc(A[0], A[1], 11 * s * u, 0, TAU); ctx.lineWidth = 2 * cam.dpr; ctx.strokeStyle = `rgba(60,40,30,${0.7 * (1 - u)})`; ctx.stroke(); }
    else if (f.k === 'clash') { const R = (0.6 + 1.6 * u) * s; ctx.lineWidth = 2.2 * cam.dpr; ctx.strokeStyle = `rgba(255,70,40,${1 - u})`; ctx.beginPath(); for (let q = 0; q < 6; q++) { const a = (q / 6) * TAU + 0.4; ctx.moveTo(A[0] + Math.cos(a) * R * 0.3, A[1] + Math.sin(a) * R * 0.3); ctx.lineTo(A[0] + Math.cos(a) * R, A[1] + Math.sin(a) * R); } ctx.stroke(); }
    else if (f.k === 'wisp') { const dx = wrapDx(f.tx - f.x), dy = f.ty - f.y; for (let q = 0; q < 7; q++) { const t = Math.min(1, u * 1.2 - q * 0.05); if (t < 0) continue; toScreen(cam, f.x + dx * t + 0.5 + Math.sin(q * 2.1 + u * 9) * 0.6, f.y + dy * t + 0.5 + Math.cos(q * 1.7 + u * 7) * 0.6, B); ctx.fillStyle = `rgba(200,225,205,${0.7 * (1 - u)})`; ctx.fillRect(Math.round(B[0]) - 1, Math.round(B[1]) - 1, Math.max(2, s * 0.35), Math.max(2, s * 0.35)); } }   /* the dead of a battle drifting to the nearest dead town */
    else if (f.k === 'spark') { const R = (1 + 5 * u) * s; ctx.lineWidth = 2.4 * cam.dpr; ctx.strokeStyle = `rgba(255,224,90,${1 - u})`; ctx.beginPath(); for (let q = 0; q < 8; q++) { const a = (q / 8) * TAU; ctx.moveTo(A[0] + Math.cos(a) * R * 0.45, A[1] + Math.sin(a) * R * 0.45); ctx.lineTo(A[0] + Math.cos(a) * R, A[1] + Math.sin(a) * R); } ctx.stroke(); }
  }
  if (w.fx.some((f) => f.done)) w.fx = w.fx.filter((f) => !f.done);
  if (jar && jar.style.transform) jar.style.transform = '';   /* no camera shake (Oct 29): the ring or flash on the map is enough */
}

function drawSel(ctx, cam, S, now) {
  const f = S.sel; if (!f || !f.pos) return; const p = f.pos(); if (!p) { S.sel = null; return; } toScreen(cam, p[0] + 0.5, p[1] + 0.5, A);
  const R = Math.max(13 * cam.dpr, cam.z * cam.dpr * (p[2] || 1.6)); ctx.beginPath(); ctx.arc(A[0], A[1], R, 0, TAU); ctx.setLineDash([6 * cam.dpr, 5 * cam.dpr]); ctx.lineDashOffset = still ? 0 : -now * 0.02; ctx.lineWidth = 3.4 * cam.dpr; ctx.strokeStyle = 'rgba(12,14,16,.7)'; ctx.stroke(); ctx.lineWidth = 1.7 * cam.dpr; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.setLineDash([]);
}

hook('overlay', (ctx, w, cam, S, now) => {
  const s = cam.z * cam.dpr, z = cam.z, frac = clamp(S.acc, 0, 1);
  view = { x: cam.x, y: cam.y, hw: cam.w / (2 * s), hh: cam.h / (2 * s) };
  const bare = S.lens === 4 || S.lens === 5;
  if (!bare) { if (S.lens === 17) drawTongues(ctx, w, cam, s); drawOre(ctx, w, cam, z); drawVolcanoes(ctx, w, cam, z); drawRuins(ctx, w, cam, z); drawSea(ctx, w, cam, z, now); drawPeople(ctx, w, cam, z, S.lens, frac); drawMovers(ctx, w, cam, z, frac); drawSwarms(ctx, w, cam, z, now, frac); drawWays(ctx, w, cam, z, S.lens); drawRoutes(ctx, w, cam, z, S.lens); drawCourts(ctx, w, cam, s); drawOther(ctx, w, cam, z, now, frac); drawDragons(ctx, w, cam, z, now, frac); drawStorms(ctx, w, cam, s, now, frac); }
  flushLabels(ctx); drawFx(ctx, w, cam, s, now); drawSel(ctx, cam, S, now);
});

/* ---------- reading things ---------- */
const big = (n) => peopleText(n);
const WAY = { forage: 'gathering what grows', hunt: 'hunting', fish: 'fishing', farm: 'farming', herd: 'herding' };
const SRC = ['wild food', 'the hunt', 'fish', 'its fields', 'its herds'];
const NOTE = { grow: 'It is growing.', full: 'It holds as many people as its land can feed.', drought: 'The rains have failed. People are going hungry, and some are leaving.', flood: 'The river took the fields this year.', soil: 'Its fields are worn out and give less every year.', fish: 'The sea here has been fished out.', locusts: 'Locusts ate the harvest.', ash: 'Ash in the sky; nothing ripens.', game: 'The animals it lived on are gone.', crowded: 'There are more mouths than food. Some will leave, or look at the neighbours.', plague: 'Sickness is doing the counting here.' };
const list = (a) => (a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
const cap = (t) => t[0].toUpperCase() + t.slice(1);
// (slice 1a) the realm's place among the others: its wars (whom with, on whose side, why), its
// truces, its leagues and its old rivals. A first version of the relations inspector.
const nm = (w, id) => (w.cults[id] ? 'the ' + w.cults[id].name : 'a people now gone');
const names = (w, ids) => list(ids.map((id) => nm(w, id)));
function relationLines(w, c) {
  const L = [];
  if (c.war) {
    const K = conflictOf(w, c), foes = enemiesOf(w, c), friends = alliesOf(w, c), cause = c.war.hid != null ? histById(w, c.war.hid) : null, title = c.war.name ? cap(c.war.name) : 'A war';
    const why = cause && cause.note ? ` (${cause.note})` : '', since = K ? K.since : c.war.since;
    L.push(`${title}, since year ${since}: ${c.war.mine ? 'they attacked' : 'they were attacked by'} ${names(w, foes)}${friends.length ? `, with ${names(w, friends)} on their side` : ''}${why}.`);
    // (slice 1b) what it is for, what each side holds, and how much fight is left in them
    if (K && K.aim) { const sd = sideOf(K, c.id), held = w.sets.filter((s) => !s.dead && s.occ && s.occ.by === c.id).length, lost = w.sets.filter((s) => !s.dead && s.occ && s.cult === c.id).length, wl = K.will ? K.will[sd] : null;
      L.push(`${sd === 0 ? 'They fight' : 'Their enemies fight'} ${aimText(w, K)}. ${held || lost ? `They hold ${held} of the enemy's towns; ${lost} of their own are occupied. ` : ''}${c.serving > 1 ? `${big(c.serving)} of them are under arms. ` : ''}${wl == null ? '' : wl < 0.15 ? 'They are weary of it.' : wl > 0.5 ? 'They mean to fight on.' : 'They will fight on for now.'}`); }
    else L.push(`Towns taken ${c.war.taken || 0}, lost ${c.war.lost || 0}.`);
  }
  if (c.owe && c.oweUntil > w.year && w.cults[c.oweTo]) L.push(`They pay reparations to ${nm(w, c.oweTo)} for ${c.oweUntil - w.year} more years.`);
  { const tolls = w.sets.filter((s) => !s.dead && s.tollTo === c.id && s.tollUntil > w.year); if (tolls.length) L.push(`They take a share of the tolls at ${list(tolls.map((s) => s.name))}.`);
    const owed = w.sets.filter((s) => !s.dead && s.cult === c.id && s.tollTo != null && s.tollTo !== c.id && s.tollUntil > w.year); if (owed.length) L.push(`${cap(nm(w, owed[0].tollTo))} take a share of the tolls at ${owed[0].name}.`); }
  const tr = trucesOf(w, c).filter((t) => w.cults[t.other] && w.cults[t.other].alive); if (tr.length) L.push(`At peace by treaty with ${list(tr.slice(0, 4).map((t) => `${nm(w, t.other)} (${t.until - w.year} more years)`))}.`);
  const lg = (w.leagues || []).filter((g) => g.members.has(c.id)); if (lg.length) { const mates = [...new Set(lg.flatMap((g) => [...g.members]))].filter((id) => id !== c.id && w.cults[id] && w.cults[id].alive); if (mates.length) L.push(`In a league with ${names(w, mates.slice(0, 4))}.`); }
  const foes = c.war ? enemiesOf(w, c) : []; const riv = Object.keys(c.nb || {}).map(Number).filter((id) => !foes.includes(id) && w.cults[id] && w.cults[id].alive && !w.cults[id].power && (c.nb[id] || 0) > 2).sort((a, b) => c.nb[b] - c.nb[a]).slice(0, 2);
  if (riv.length) L.push(`Old rivals: ${names(w, riv)}${c.grudge && riv.some((id) => w.year - (c.grudge[id] || -999) < 30) ? ', whose raiders they have not forgiven' : ''}.`);
  return L;
}
export function cultLines(w, c) {
  const L = [];
  L.push(`${c.kind[0].toUpperCase() + c.kind.slice(1)}. ${big(c.pop)} people in ${c.count} ${c.count === 1 ? 'place' : 'places'}.`);
  if (c.langId != null && w.langs) { const qs = quirksOf(w, c); L.push(`They speak ${w.langs[c.langId].name}${w.langs[c.langId].root !== c.langId ? ', of the ' + w.langs[w.langs[c.langId].root].name + ' family' : ''}${c.foreignShare > 0.15 ? `; ${Math.round(c.foreignShare * 100)}% of their subjects speak a stranger's tongue` : ''}.${qs.length ? ' ' + qs[0][0].toUpperCase() + qs.join(', ').slice(1) + '.' : ''}`); }
  if (c.over) L.push(`They pay tribute to ${overlordOf(w, c)}, collected by ${c.over.house} (${Math.round(c.over.take * 100)}% of the harvest).`);
  if (c.lev && !c.over) { let top = null, tv = 0; for (const k in c.lev) if (c.lev[k] > tv && w.cults[k]) { tv = c.lev[k]; top = w.cults[k]; } if (top && tv >= 0.25) L.push(tv >= 0.6 ? `They owe the ${top.name} more than they can pay. A resident of the ${top.name} sits at their court, and little is decided without him.` : `The ${top.name} lend them money and sell them guns, and their merchants have the run of the ports.`); }   /* (Oct 30) the spring, before it is called in */
  if (c.colonies && c.colonies.length) L.push(`They take tribute from ${c.colonies.map((id) => 'the ' + w.cults[id].name).join(', ')}.`);
  // (slice 3) what reaches the court, and the great houses of the provinces
  if (c.recv != null && c.recv < 0.9 && c.count >= 8 && c.big) L.push(`Only ${Math.round(c.recv * 100)}% of what the provinces owe reaches ${c.big.name || 'the court'}; the rest stays with the provincial lords.`);
  if (c.regions && c.regions.length) { const seats = c.regions.map((r) => { const t = w.sets.find((q) => q.id === r.seat && !q.dead); return t ? `${r.name} at ${t.name}` : null; }).filter(Boolean), top = Math.max(...c.regions.map((r) => r.share || 0)); if (seats.length) L.push(`Great houses of the provinces: ${list(seats)}.${top > 0.35 ? ' The richest of them is nearly as rich as the court.' : ''}`); }
  if (c.hub && c.hub.st !== 'grow') L.push(c.hub.st === 'civil' ? 'Their great houses are at war with each other.' : c.hub.st === 'factions' ? 'There are far more would-be lords than lordships; the court is split into factions.' : 'More would-be lords than lordships: the court wants new land.');
  const keys = Object.keys(c.arts).filter((k) => ART[k]).sort((a, b) => c.arts[b] - c.arts[a]);
  L.push(`They live in the age of ${ERA[Math.min(10, c.tech)]}. ${keys.length ? `They know ${keys.length} things; lately ${list(keys.slice(0, 4).map((k) => ART[k].say))}.` : 'They know fire, stone and each other.'}`);
  const why = blockedReasons(c); if (why.length) L.push(cap(list(why.slice(0, 2))) + '.');
  const tame = Object.keys(c.tame), met = []; if (c.arts.bronze) met.push('bronze'); if (c.arts.iron) met.push('iron'); if (c.gold) met.push('gold');
  if (tame.length || met.length) L.push((tame.length ? `They keep ${list(tame.map((k) => (k === 'cattle' ? 'cattle' : k === 'pig' ? 'pigs' : k + 's')))}. ` : '') + (met.length ? `They have ${list(met)}.` : ''));
  const lk = luckOf(w, c); L.push(lk.crops.length ? `They sow ${list(lk.crops)}.` : c.arts.farming ? 'Their crops do not grow here.' : 'Nothing that grows wild near them could be sown.');
  if (lk.germs > 0.6 && c.germ > 0.4) L.push('Living close to their herds has given them every sickness, and made them hard to kill with any of them.'); else if (c.germ < 0.12 && w.year > 150) L.push('They have never lived with herds and their sicknesses. A stranger\'s cough could empty their towns.');
  const st = STANCES[c.stance || 'revere']; L.push(`${st.name}: they ${st.say}.${c.pacts ? ' They have made bargains with the old powers.' : ''}`);
  L.push(`${c.ruler.name} leads them. ${c.coh > 0.7 ? 'They hold together well.' : c.coh > 0.45 ? 'There are quarrels, but they hold.' : c.coh > 0.25 ? 'They are pulling apart.' : 'They are one people in name only.'}`);
  if (c.faith != null) { const f = w.faiths[c.faith]; const ds = Object.keys(f.docs || {}).filter((k) => k !== f.tenet).map((k) => TENET[k]); L.push(`They pray to ${f.name}, whose teaching ${TENET[f.tenet]}${ds.length ? ' and ' + ds.join(' and ') : ''}. It tells them to ${MAGIC[f.magic] || 'keep the old places'}.${c.faithShare < 0.6 ? ' Not all of them pray.' : ''}${c.faithHold != null && c.faithHold < 0.4 ? ' Faith sits lightly on them now.' : c.faithHold > 0.85 ? ' Faith rules their lives.' : ''}${c.temple > 0.5 ? ' The temples own much of the land.' : ''}`); }
  L.push(...relationLines(w, c));
  if (c.parent) L.push(`They split from the ${c.parent} in year ${c.born}.`);
  return L;
}
function setInfo(w, s) {
  const c = w.cults[s.cult], L = [], tot = s.src.reduce((a, b) => a + b, 0) || 1;
const FOOD = [['#8fbf6a', 'wild food'], ['#b5653f', 'hunting'], ['#4fa3d1', 'fish'], ['#e3b23c', 'fields'], ['#9a7b5b', 'herds']];
  const bar = s.src.map((v, k) => [v / tot, FOOD[k][0], FOOD[k][1]]);
  if (s.nomad) L.push(`${big(s.pop)} people on the move.`); else L.push(`A ${TIER[s.tier]} with its country around it: ${big(s.pop)} people. It is ${s.age} years old.`);
  L.push(s.plague > 0 ? NOTE.plague : NOTE[s.note] || NOTE.grow);
  if (s.siege && w.cults[s.siege.by]) L.push(`Besieged by the ${w.cults[s.siege.by].name} since year ${s.siege.since}: ${big(s.siege.n)} men outside the ${s.walls ? 'walls' : 'town'}, and the town ${s.siege.prog > 0.66 ? 'cannot hold out much longer' : s.siege.prog > 0.33 ? 'is going hungry' : 'still holds'}.`);
  if (!s.nomad && s.lvl != null && s.lvl < Math.min(10, c.tech)) L.push(s.lvl <= c.tech - 2 ? `It lives far behind its rulers, in the age of ${ERA[s.lvl]}: what ${c.big && c.big !== s ? c.big.name || 'the court' : 'the court'} knows has hardly reached it.` : `It lags its rulers: here it is still the age of ${ERA[s.lvl]}.`);   /* (Oct 29) a town's own development */
  if (s.occ && w.cults[s.occ.by]) L.push(`Held by the ${w.cults[s.occ.by].name} since year ${s.occ.since}. It pays no one and sends no soldiers until the peace decides whose it is.`);
  if (s.lost === 'fey') L.push('The fey have it. Its people still work the fields, but they send nothing and no one to their rulers.'); else if (s.lost === 'machine') L.push(`It has gone dark: it runs on ${s.machine} now and answers to no one else.`); else if (s.dep > 0.2) L.push(`It depends on the dark towns for ${Math.round(Math.min(1, s.dep) * 100)}% of what it needs.`);
  if (s.deepCult) L.push(`Its people go down to the water at night. They worship ${s.deepCult}.${s.callOdds ? ` The cult's odds of calling something up this year: about 1 in ${Math.round(1 / s.callOdds).toLocaleString()}.` : ''}`);
  if (s.faith != null && s.faith !== c.faith) L.push(`Its people pray to ${w.faiths[s.faith].name}, not the god of their rulers.`);
  if (!s.nomad) { const ex = []; if (s.walls) ex.push('stone walls'); if (s.links) ex.push(s.links === 1 ? 'a road' : s.links + ' roads'); if (s.port && c.arts.boats) ex.push('a harbour'); if (s.wonder) ex.push('a wonder'); if (s.tower) ex.push('a tower nobody built'); if (ex.length) L.push(`It has ${list(ex)}.`);
    const o = []; for (let k = 1; k <= 7; k++) if (s.ores & (1 << k)) o.push(ORES[k]); if (o.length) L.push(`${cap(list(o))} in its ground.`);
    if (s.burned) L.push(`A dragon has burned it ${s.burned === 1 ? 'once' : s.burned + ' times'}.`); }
  { const ex = Object.keys(s.exp || {}).filter((g) => w.year - s.exp[g] < 15).map((g) => GOODS[g].name), im = Object.keys(s.imp || {}).filter((g) => w.year - s.imp[g] < 15).map((g) => GOODS[g].name);
    if (ex.length) L.push(`It sells ${list(ex)}.`); if (im.length) L.push(`It buys ${list(im)}.`);
    const named = [...w.routes.values()].filter((r) => r.name && (r.a === s || r.b === s)).map((r) => r.name); if (s.entrepot) L.push(`Goods change hands here: far carriers stop, sell and turn back, and its merchants carry them on (${Math.round(s.relayE)} loads a year lately).`); else if (s.relayE > 0.5) L.push(`Now and then goods change hands here on their way somewhere else.`);
    if (s.market) L.push(`It is a great market${named.length ? ', on ' + list(named) : ''}.`); else if (named.length) L.push(`It lies on ${list(named)}.`); }
  return { title: s.name || `A band of the ${c.name}`, sub: s.nomad ? c.kind : `${TIER[s.tier]} of the ${c.name}`, color: colorOf(c), bar, lines: L.concat(cultLines(w, c)), split: L.length, splitTitle: 'The ' + c.name, follow: { pos: () => { const t = liveSet(s); return !t || t.dead ? null : [t.x, t.y, t.R + 0.6]; }, info: () => { const t = liveSet(s); return !t || t.dead ? null : setInfo(state.w, t); } } };
}
export const describeSet = setInfo;
// When the world runs in the worker, the page's copy is replaced twice a second: a followed thing is
// found again by its id in the newest copy.
const liveIn = (list, o, key) => (list && list.includes(o) ? o : (list || []).find((q) => q[key] === o[key]) || null);
const liveSet = (s) => { const w = state.w; if (!w || w.sets.includes(s)) return s; return w.sets.find((q) => q.id === s.id) || null; };
const MOVE = { settlers: (w, m, c) => [`Settlers of the ${c.name}`, `${big(m.n)} people with everything they own, looking for a place to stop.`], army: (w, m, c) => [`A war band of the ${c.name}`, `About ${big(m.n)} spears${m.to && !m.to.dead && m.to.name ? ', marching on ' + m.to.name : ''}.`], home: (w, m, c) => [`A war band of the ${c.name}`, 'On the way home.'], trade: (w, m, c) => [m.wet0 ? `A trading ship of the ${c.name}` : `A caravan of the ${c.name}`, `${m.from && m.from.name ? 'From ' + m.from.name : 'On its way'}${m.to && m.to.name ? ' to ' + m.to.name : ''}. It carries goods, news, and whatever else is going around.`], refugees: (w, m, c) => [`People of the ${c.name}, fleeing`, `${big(m.n)} people walking away from hunger or worse.`] };
const RUIN_SAY = { abandoned: 'Its people left, or died out.', sacked: 'It was sacked and burned.', drowned: 'The sea took it.', buried: 'Ash and lava buried it.', burned: 'Fire took it.', plague: 'Plague emptied it.', frozen: 'The ice closed over it.', overgrown: 'The forest swallowed it.', crater: 'A falling star erased it.', swallowed: 'The earth opened under it.', dragon: 'A dragon made it a roost.' };
const WORK_SAY = { dam: ['A dam', 'A wall across the river. The lake behind it waters the fields below.'], canal: ['A canal', 'Dug through the land so ships can pass from one sea to the other.'], ditch: ['Irrigation canals', 'River water carried out into dry country.'], polder: ['Polders', 'Fields on what used to be the sea floor, behind dikes.'], wall: ['A great wall', 'Built across the grass to keep the riders out. Most raids stop at it.'], pass: ['A blasted pass', 'A mountain cut through for a road.'], raised: ['Raised land', 'Called up out of the sea by sorcerers.'] };
const SP_SAY = { winter: 'A cold that spreads from something sitting in the snow. The whole region around it is colder for it; the ice follows.',  burned: 'The dead of a city that burned in a single moment. They walk out of the glass toward the living.',  host: 'A dead army that fights its war again every night. Nobody settles near it; those who live close sicken and leave.', shamblers: 'The dead of a plague, walking. Wherever they reach, the sickness comes back.', lich: 'A dead king in a ruined hall. It sends the dead against the living, and against its enemies first.', hunger: 'Something in the cold woods that is never full. It takes travellers, herders and game.', drowned: 'Bells under the water. Ships founder nearby; the drowned come ashore in storms.', fey: 'A court under old trees. It steals children, unless a people bargains with it; then their fields never fail.', saint: 'A holy place. Plagues turn back here, and the faithful hold together.' };
function looker(w, x, y, i, r) {
  if (lens0 === 17) { const t = tongueCard(w, x, y); if (t) return t; }
  let hit = null, bd = r * r;
  for (const d of w.dragons) { for (const p of [[d.x, d.y], [d.lx, d.ly]]) { const q = wrapDx(p[0] - x) ** 2 + (p[1] - y) ** 2; if (q <= bd * 2.5) hit = d; } }
  if (hit) { const d = hit; return { title: d.name, color: '#b3201c', lines: [`A dragon, ${d.age} years on this mountain.`, d.st === 'sleep' ? 'It is asleep on its hoard.' : d.st === 'fly' ? 'It is hunting.' : d.st === 'home' ? 'It is flying home, fed.' : 'It is awake, and looking around.', d.hoard > 20 ? 'Its hoard is the richest thing in the world.' : d.hoard > 6 ? 'It has a respectable hoard.' : 'It has not gathered much yet.'], follow: { pos: () => { const q = liveIn(state.w.dragons, d, 'name'); return !q || q.dead ? null : [q.x, q.y, 2]; } } }; }
  for (const sp of w.spirits) if (wrapDx(sp.x - x) ** 2 + (sp.y - y) ** 2 <= Math.max(4, bd * 1.5)) { const pc = sp.pact != null ? w.cults[sp.pact] : null;
    return { title: cap(sp.name), color: KINDS[SPIRIT_KINDS[sp.kind].mem].col, lines: [SP_SAY[sp.kind], `It rose in year ${sp.born}. What it remembers: ${sp.why}.`, pc ? `The ${pc.name} have a bargain with it.` : '', 'It will fade if this place forgets. Peoples who know iron and letters wear memory away; Hush and Forget do it faster.'].filter(Boolean) }; }
  for (const m of w.machines || []) if (wrapDx(m.x - x) ** 2 + (m.y - y) ** 2 <= Math.max(9, bd * 2)) return { title: cap(m.name), color: '#4affd0', lines: ['A mind its makers built and lost. It holds a country of dark towns, eats the old magic out of the ground, and fights the old powers where they meet.', `It woke in year ${m.born}.`, 'Only many peoples together, or time, will end it.'] };
  for (const q of w.works || []) if (wrapDx(q.x - x) ** 2 + (q.y - y) ** 2 <= Math.max(4, bd)) { const c = w.cults[q.cult]; return { title: WORK_SAY[q.kind][0], color: c ? c.color : null, lines: [WORK_SAY[q.kind][1], `Built by the ${c ? c.name : 'old ones'} in year ${q.year}.`] }; }
  for (const q of w.wells) if (wrapDx(q.x - x) ** 2 + (q.y - y) ** 2 <= Math.max(4, bd)) return { title: q.name ? cap(q.name) : 'A wellspring', color: KINDS[q.kind || 0].col, lines: ['The ley lines run here, carrying what the world remembers.', `It is ${q.fill > 10 ? 'nearly full' : q.fill > 4 ? 'filling' : 'low'}, mostly with ${KINDS[q.kind || 0].name}.`, q.spilt ? `It has spilled over ${q.spilt === 1 ? 'once' : q.spilt + ' times'}.` : 'When it is full it will spill a storm back up the lines.'] };
  if (w.great && wrapDx(w.great.x - x) ** 2 + (w.great.y - y) ** 2 <= 64) { const g = w.great; return { title: cap(g.name), color: '#6a3f86', lines: [`Called up from the deep in year ${g.born} by the cult of ${g.port}. It will sleep again in about ${Math.max(0, 1000 - (w.year - g.born))} years.`, `Within its reach ships go down a third of the time; steam halves that, modern navies cut it to a fifth. It has taken ${g.sunk} ${g.sunk === 1 ? 'ship' : 'ships'}.`, `${g.hp} more ${g.hp === 1 ? 'bomb' : 'bombs'} would kill it, and its death would raise the sea everywhere.`] }; }
  for (const k of w.krakens) if (wrapDx(k.x - x) ** 2 + (k.y - y) ** 2 <= Math.max(9, bd)) return { title: cap(k.name), color: '#6a3f86', lines: [`Something very large, in this water since year ${k.born}.`, k.sunk ? `It has taken ${k.sunk} ${k.sunk === 1 ? 'ship' : 'ships'}.` : 'No ship has come close enough yet.'] };
  for (const m of w.movers) if (!m.done && w.cults[m.cult] && MOVE[m.kind] && wrapDx(m.x - x) ** 2 + (m.y - y) ** 2 <= bd * 1.5) { const c = w.cults[m.cult], t = MOVE[m.kind](w, m, c); return { title: t[0], color: c.color, lines: [t[1]], follow: { pos: () => { const q = m.id != null ? liveIn(state.w.movers, m, 'id') : m; return !q || q.done ? null : [q.x, q.y, 1.4]; } } }; }
  for (const sw of w.swarms) if (wrapDx(sw.x - x) ** 2 + (sw.y - y) ** 2 <= 12) return { title: 'Locusts', lines: ['A swarm on the wind. It eats grass and grain down to the dirt and moves on.'] };
  const s = near(w, x, y, Math.max(1.6, r), null, false); if (s) return setInfo(w, s);
  for (const ru of w.ruins) if (wrapDx(ru.x - x) ** 2 + (ru.y - y) ** 2 <= bd) return { title: `Ruins of ${ru.name}`, color: null, lines: [`A ${TIER[ru.tier]} of the ${ru.cult}. ${RUIN_SAY[ru.kind] || ''} Year ${ru.year}.`, typeof ru.haunt === 'string' ? ru.haunt.replace('%', ru.cult) : '', ru.wonder ? 'Something enormous still stands among the stones.' : '', ru.layers > 1 ? `It has been built and lost ${ru.layers} times. There are older walls under these.` : '', ru.haunt ? 'Nobody goes near it now. The air is wrong.' : ru.looted ? 'Diggers have been through it.' : 'Nobody has dug here yet. Whatever its people knew is still in the ground.'].filter(Boolean) };
  for (const st of w.storms) if (wrapDx(st.x - x) ** 2 + (st.y - y) ** 2 <= 16) return { title: st.str > 1 ? 'A great storm' : 'A storm', lines: ['Born over warm water, carried by the wind. It dies over land, but not before it has wrecked a coast.'] };
  for (const v of w.volcanoes) if (wrapDx(v.x - x) ** 2 + (v.y - y) ** 2 <= 2) return { title: 'A volcano', lines: [v.last > 0 ? `It last opened in year ${v.last}.` : 'It has been quiet as long as anyone remembers.', 'Its ash kills what it lands on, then feeds it.'] };
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const yy = y + dy; if (yy < 0 || yy >= H) continue; const j = yy * W + ((x + dx + W) % W); if (w.ore[j] && cam0 >= 7) return { title: ORES[w.ore[j]].replace(/^./, (m) => m.toUpperCase()), color: ORE_COL[w.ore[j]], lines: [w.ore[j] === 5 ? 'Salt in a dry basin.' : 'A seam in the rock.', 'It matters to whoever settles on top of it.'] }; }
  return null;
}
let cam0 = 1;
hook('newWorld', (w) => { w.lookers = [(ww, x, y, i) => looker(ww, x, y, i, Math.max(1.3, 9 / cam0))]; });
hook('overlay', (ctx, w, cam, S) => { cam0 = cam.z; lens0 = S ? S.lens : 0; });
let lens0 = 0;
