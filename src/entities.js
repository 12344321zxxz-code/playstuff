// Everything on the map that is not terrain: animals, peoples, roads, ruins, dragons, storms and
// the brief flashes when something big happens. Drawn on the 2D overlay, on top of the shader.
import { W, H, TAU, TPY, CS, CW, CH, clamp, wrapDx, hash2 } from './core.js';
import { toScreen } from './render.js';
import { SPECIES } from './fauna.js';
import { blit, pixScale } from './pixels.js';
import { COLORS, TIER, ART, ORES, colorOf, near } from './people.js';
import { hook, palette } from './main.js';
import { TENET } from './faith.js';

for (let k = 0; k < 32; k++) { const c = COLORS[k % COLORS.length]; palette[k * 3] = parseInt(c.slice(1, 3), 16) / 255; palette[k * 3 + 1] = parseInt(c.slice(3, 5), 16) / 255; palette[k * 3 + 2] = parseInt(c.slice(5, 7), 16) / 255; }

const A = [0, 0], B = [0, 0];
const ORE_COL = ['', '#d9843b', '#cfd6dc', '#7b4a3a', '#ffd23a', '#ffffff', '#2a2a2e'];
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
    const hgt = blit(ctx, st.tier >= 3 ? 'city' : st.tier === 2 ? 'town' : st.pop > 60 ? 'village' : 'hut', x, y, k, col);
    if (st.plague > 0 && z >= 3) { ctx.fillStyle = '#b6ff3d'; for (let q = 0; q < 4; q++) { const a = (q / 4) * 6.283 + (still ? 0 : performance.now() * 0.002); ctx.fillRect(Math.round(x + Math.cos(a) * 7 * k), Math.round(y - hgt / 2 + Math.sin(a) * 5 * k), k, k); } }
    if (st.wonder && z >= 3) blit(ctx, 'wonder', x + 8 * k, y, k);
    if (st.tower && z >= 3) blit(ctx, 'tower', x - 7 * k, y, k);
    if (st.name && (st.tier === 3 ? z >= 2.2 : st.tier === 2 ? z >= 5 : z >= 10)) names.push(st, x, y + 2 * cam.dpr);
  }
  for (let q = 0; q < names.length; q += 3) { const st = names[q]; label(ctx, st.name, names[q + 1], names[q + 2], Math.round((st.tier === 3 ? 13 : st.tier === 2 ? 11.5 : 10.5) * cam.dpr), '#fff', false, st.tier * 100 + Math.log(st.pop + 1)); }
  if (lens === 6 || lens === 0) for (const c of w.cults) if (lens === 6 || (z < 4 && c.count >= 8)) { if (!c.alive || !c.big || c.count < 2 || !seen(c.big.x, c.big.y, 10)) continue; const p = at(cam, c.big.x + 0.5, c.big.y + 0.5); const px = Math.round(clamp(9 + Math.sqrt(c.count) * 1.6, 11, 20) * cam.dpr), yy = p[1] - clamp(z * 2.4, 22, 46) * cam.dpr; label(ctx, c.name.toUpperCase(), p[0], yy, px, colorOf(c), false, 1000 + c.pop / 100); }
  if (lens === 9) { const top = new Map(); for (const st of w.sets) if (!st.dead && st.faith != null && (!top.has(st.faith) || top.get(st.faith).pop < st.pop)) top.set(st.faith, st);
    for (const [id, st] of top) { const f = w.faiths[id]; if (!f.alive || f.towns < 2 || !seen(st.x, st.y, 10)) continue; const p = at(cam, st.x + 0.5, st.y + 0.5); label(ctx, f.name.replace(/^the /, '').toUpperCase(), p[0], p[1] - clamp(z * 2.4, 22, 46) * cam.dpr, Math.round(clamp(10 + Math.sqrt(f.towns), 12, 20) * cam.dpr), f.color, false, 1000 + f.towns); } }
}
// Everyone on the road. Colour says whose they are; shape says what they are doing.
function drawMovers(ctx, w, cam, z, frac) {
  if (z < 2.2) return; const k = pixScale(z, cam.dpr, 0.85);
  for (const m of w.movers) {
    if (m.done) continue; const x = m.px + wrapDx(m.x - m.px) * frac + 0.5, y = m.py + (m.y - m.py) * frac + 0.8; if (!seen(x, y, 2)) continue; const p = at(cam, x, y);
    const c = w.cults[m.cult], col = c.color, flip = wrapDx(m.x - m.px) < 0;
    if (m.wet && !m.path) { blit(ctx, m.kind === 'trade' || m.kind === 'army' ? 'ship' : 'boat', p[0], p[1], k, col, flip); if (m.kind === 'army') { ctx.fillStyle = '#e03a1f'; ctx.fillRect(Math.round(p[0] - k), Math.round(p[1] - 8 * k), 2 * k, k); } continue; }
    blit(ctx, m.kind === 'army' || m.kind === 'home' ? 'army' : m.kind === 'trade' ? 'caravan' : m.kind === 'settlers' ? 'settlers' : 'refugees', p[0], p[1], k, col, flip);
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
}
function drawDragons(ctx, w, cam, z, now, frac) {
  for (const d of w.dragons) {
    const k = pixScale(z, cam.dpr, 1.3);
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
  if (!bare) { drawOre(ctx, w, cam, z); drawVolcanoes(ctx, w, cam, z); drawRuins(ctx, w, cam, z); drawSea(ctx, w, cam, z, now); drawPeople(ctx, w, cam, z, S.lens, frac); drawMovers(ctx, w, cam, z, frac); drawSwarms(ctx, w, cam, z, now, frac); drawDragons(ctx, w, cam, z, now, frac); drawStorms(ctx, w, cam, s, now, frac); }
  flushLabels(ctx); drawFx(ctx, w, cam, s, now); drawSel(ctx, cam, S, now);
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
  L.push(`${c.kind[0].toUpperCase() + c.kind.slice(1)}. ${big(c.pop)} people in ${c.count} ${c.count === 1 ? 'place' : 'places'}.`);
  const arts = Object.keys(c.arts).sort((a, b) => c.arts[a] - c.arts[b]).map((k) => ART[k].say); L.push(arts.length ? `They know ${list(arts)}.` : 'They know fire, stone and each other.');
  const tame = Object.keys(c.tame), met = []; if (c.arts.bronze) met.push('bronze'); if (c.arts.iron) met.push('iron'); if (c.gold) met.push('gold');
  if (tame.length || met.length) L.push((tame.length ? `They keep ${list(tame.map((k) => (k === 'cattle' ? 'cattle' : k === 'pig' ? 'pigs' : k + 's')))}. ` : '') + (met.length ? `They have ${list(met)}.` : ''));
  L.push(`${c.ruler.name} leads them. ${c.coh > 0.7 ? 'They hold together well.' : c.coh > 0.45 ? 'There are quarrels, but they hold.' : c.coh > 0.25 ? 'They are pulling apart.' : 'They are one people in name only.'}`);
  if (c.faith != null) { const f = w.faiths[c.faith]; L.push(`They pray to ${f.name}, whose teaching ${TENET[f.tenet]}.${c.faithShare < 0.6 ? ' Not all of them.' : ''}`); }
  if (c.war) { const f = w.cults[c.war.foe]; L.push(`At war with the ${f.name} since year ${c.war.since}.`); }
  if (c.parent) L.push(`They split from the ${c.parent} in year ${c.born}.`);
  return L;
}
function setInfo(w, s) {
  const c = w.cults[s.cult], L = [], tot = s.src.reduce((a, b) => a + b, 0) || 1;
const FOOD = [['#8fbf6a', 'wild food'], ['#b5653f', 'hunting'], ['#4fa3d1', 'fish'], ['#e3b23c', 'fields'], ['#9a7b5b', 'herds']];
  const bar = s.src.map((v, k) => [v / tot, FOOD[k][0], FOOD[k][1]]);
  if (s.nomad) L.push(`${big(s.pop)} people on the move.`); else L.push(`A ${TIER[s.tier]} of ${big(s.pop)} people, ${s.age} years old.`);
  L.push(s.plague > 0 ? NOTE.plague : NOTE[s.note] || NOTE.grow);
  if (s.faith != null && s.faith !== c.faith) L.push(`Its people pray to ${w.faiths[s.faith].name}, not the god of their rulers.`);
  if (!s.nomad) { const ex = []; if (s.walls) ex.push('stone walls'); if (s.links) ex.push(s.links === 1 ? 'a road' : s.links + ' roads'); if (s.port && c.arts.boats) ex.push('a harbour'); if (s.wonder) ex.push('a wonder'); if (s.tower) ex.push('a tower nobody built'); if (ex.length) L.push(`It has ${list(ex)}.`);
    const o = []; for (let k = 1; k <= 6; k++) if (s.ores & (1 << k)) o.push(ORES[k]); if (o.length) L.push(`${cap(list(o))} in its ground.`);
    if (s.burned) L.push(`A dragon has burned it ${s.burned === 1 ? 'once' : s.burned + ' times'}.`); }
  return { title: s.name || `A band of the ${c.name}`, sub: s.nomad ? c.kind : `${TIER[s.tier]} of the ${c.name}`, color: colorOf(c), bar, lines: L.concat(cultLines(w, c)), split: L.length, splitTitle: 'The ' + c.name, follow: { pos: () => (s.dead ? null : [s.x, s.y, s.R + 0.6]), info: () => (s.dead ? null : setInfo(w, s)) } };
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
  for (const v of w.volcanoes) if (wrapDx(v.x - x) ** 2 + (v.y - y) ** 2 <= 2) return { title: 'A volcano', lines: [v.last > 0 ? `It last opened in year ${v.last}.` : 'It has been quiet as long as anyone remembers.', 'Its ash kills what it lands on, then feeds it.'] };
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const yy = y + dy; if (yy < 0 || yy >= H) continue; const j = yy * W + ((x + dx + W) % W); if (w.ore[j] && cam0 >= 7) return { title: ORES[w.ore[j]].replace(/^./, (m) => m.toUpperCase()), color: ORE_COL[w.ore[j]], lines: [w.ore[j] === 5 ? 'Salt in a dry basin.' : 'A seam in the rock.', 'It matters to whoever settles on top of it.'] }; }
  return null;
}
let cam0 = 1;
hook('newWorld', (w) => { w.lookers = [(ww, x, y, i) => looker(ww, x, y, i, Math.max(1.3, 9 / cam0))]; });
hook('overlay', (ctx, w, cam) => { cam0 = cam.z; });
