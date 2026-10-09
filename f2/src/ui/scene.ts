// What stands on the map this frame: the country's own glyphs (mountains, woods, reeds, dunes),
// then everything that lives or is built or moves. All of it goes into one list of sprites,
// sorted so nearer things overlap farther ones. Also collects the labels for the overlay.
import { W, H, N, CW, CH, TPY } from '../sim/core';
import { Mirror } from './state';
import { GlyphList, hexTint, rgba } from './gl/glyphs';
import { SPR, ANCHOR } from './art/sprites';

export interface Cam { x: number; y: number; z: number; dpr: number; vw: number; vh: number }
export interface Label { text: string; x: number; y: number; px: number; kind: string; pri: number; color?: string; ang?: number; spacing?: number; ref?: string; italic?: boolean }

const WHITE = rgba(255, 255, 255, 0), GS = 1.9;   // sprites fill about half their cell; sizes below are what you see
function h1(i: number, k = 0) { let h = Math.imul(i ^ (k * 0x9e3779b1), 374761393) ^ 0x27d4eb2f; h = Math.imul(h ^ (h >>> 15), 2246822519); h = Math.imul(h ^ (h >>> 13), 3266489917); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const HOUSES = [['hut', 'house', 'house2'], ['stilt', 'mudDome', 'stilt'], ['ratHouse', 'ratHouse', 'hut'], ['nest', 'nest', 'hut'], ['longhouse', 'wolfHall', 'hut']];
const SPECIES_SPR = ['deer', 'horse', 'aurochs', 'mammoth', 'antelope', 'camel', 'goat', 'reindeer', 'boar'];
const BEAST_SPR: Record<string, string> = { dragon: 'dragon', troll: 'troll', griffin: 'griffin', wyvern: 'wyvern', boar: 'greatboar', basilisk: 'basilisk', kraken: 'kraken', serpent: 'serpent' };
const LAIR_SPR: Record<string, string> = { troll: 'cave', griffin: 'eyrie', wyvern: 'eyrie', boar: 'cave', basilisk: 'pit', dragon: 'cave' };
const WONDER = ['', 'pyramid', 'colossus', 'greatTemple', 'lighthouse'];

export function buildScene(m: Mirror, cam: Cam, G: GlyphList, labels: Label[], now: number, opts: { lens: number; sel: any }) {
  G.reset(); labels.length = 0;
  const z = cam.z, s = z * cam.dpr, halfW = cam.vw / (2 * s) + 3, halfH = cam.vh / (2 * s) + 4;
  const x0 = Math.max(0, Math.floor(cam.x - halfW)), x1 = Math.min(W - 1, Math.ceil(cam.x + halfW)), y0 = Math.max(0, Math.floor(cam.y - halfH)), y1 = Math.min(H - 1, Math.ceil(cam.y + halfH));
  const seen = (x: number, y: number, mg = 2) => x > x0 - mg && x < x1 + mg && y > y0 - mg && y < y1 + mg;
  const bare = opts.lens === 4 || opts.lens === 5;
  const sp = (n: string) => SPR[n];
  const push = (name: string, x: number, y: number, px: number, a = 1, tint = WHITE, rot = 0, flip = false, depth = 0) => { const k = SPR[name]; if (k == null) return; G.push(x, y, px * cam.dpr * GS, k, a, tint, ANCHOR[k], rot, flip, depth); };
  const frac = clamp(((now - m.frameAt) / 1000) * m.tps, 0, 1.2), tk = m.tickN + frac;
  const fine = m.fine, sea = m.sea;

  /* --- the country: painted by the terrain shader now; only volcanoes and such stand on it --- */
  if (false) {
    const target = 24 / z, Lf = Math.log2(Math.max(1, target)), L = clamp(Math.floor(Lf), 0, 5), fade = clamp((Lf - L) * 1.6 - 0.3, 0, 1);
    const b = 1 << L, arr = m.peaks[L], bw = Math.ceil(W / b), parent = L < 5 ? m.peaks[L + 1] : null, pbw = Math.ceil(W / (b * 2));
    if (arr) for (let by = Math.floor(y0 / b); by <= Math.floor(y1 / b); by++) for (let bx = Math.floor(x0 / b); bx <= Math.floor(x1 / b); bx++) {
      const i = arr[by * bw + bx]; if (i == null || i < 0 || m.water[i]) continue;
      const inParent = parent ? parent[(by >> 1) * pbw + (bx >> 1)] === i : true;
      const a = inParent ? 1 : 1 - fade; if (a <= 0.02) continue;
      countryGlyph(m, i, b * z, a, push, now, z, L);
    }
    // close in, woods get thick: a few more trees inside each forest cell
    if (false) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = y * W + x; if (m.water[i]) continue; const t = fine[i * 4 + 3] / 255; if (t < 0.68) continue; const hh = m.h[i] - sea; if (hh > 0.3) continue; const fl = fine[N * 8 + i * 4 + 1]; if (fl & 3) continue;
      const n = t > 0.85 ? 2 : 1, a = clamp((z - 26) / 8, 0, 1); for (let k = 0; k < n; k++) { const tx = x + 0.15 + h1(i, k + 3) * 0.7, ty = y + 0.15 + h1(i, k + 9) * 0.7; treeAt(m, i, tx, ty, clamp(z * 0.55, 10, 26), a, push, k); } }
  }

  const E = m.ents, cult = (id: number) => m.cultById.get(id);
  /* --- ruins, wells, volcanoes, ore --- */
  if (!bare) {
    if (z > 2.5) for (const r of E.ruins) { if (!seen(r.x, r.y)) continue; push(r.kind === 'drowned' ? 'ruinDrowned' : 'ruin', r.x + 0.5, r.y + 0.6, clamp(z * (0.9 + r.tier * 0.25), 14, 44), r.haunt ? 0.75 : 0.95); if (z > 9) labels.push({ text: 'Ruins of ' + r.name, x: r.x + 0.5, y: r.y + 1.4, px: 11, kind: 'ruin', pri: 30 + r.tier, italic: true, ref: r.sid ? 's' + r.sid : undefined }); }
    if (z > 4) for (const w of E.wells || []) if (seen(w.x, w.y)) push('well', w.x + 0.5, w.y + 0.6, clamp(z * 2, 18, 46), 0.55 + 0.25 * Math.sin(now * 0.002 + w.x));
    if (z > 1.5) for (const v of E.volc) if (seen(v.x, v.y) && !m.water[v.y * W + v.x]) push(v.hot ? 'volcanoHot' : 'volcano', v.x + 0.5, v.y + 0.6, clamp(z * 3, 24, 60), 1, WHITE, 0, false, 0.3);
    if (z > 8) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = y * W + x; if (m.ore[i] && !m.water[i]) push('ore', x + 0.5, y + 0.7, clamp(z * 0.5, 10, 20), 0.95); }
    // works: dams, mines, the great walls
    if (z > 4) { const wk = m.works; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = y * W + x, v = wk[i * 4]; if (!v) continue; if (v & 16) push('mine', x + 0.5, y + 0.7, clamp(z * 1.2, 14, 30)); if ((v & 2) && h1(i) < 0.3) push('dam', x + 0.5, y + 0.6, clamp(z * 1.1, 12, 28)); } }
  }

  /* --- peoples --- */
  for (const st of E.sets) {
    if (!seen(st.x, st.y, 10)) continue; const c = cult(st.c); if (!c) continue; const tint = hexTint(c.color, 255);
    let x = st.x + 0.5, y = st.y + 0.5;
    if (st.nomad && st.mt) { const f = clamp((tk - st.mt) / TPY, 0, 1), e = f * f * (3 - 2 * f); x = st.px + (st.x - st.px) * e + 0.5; y = st.py + (st.y - st.py) * e + 0.5; }
    const H3 = HOUSES[st.race] || HOUSES[0];
    if (st.nomad) { if (z < 2.2 && st.pop < 80) continue; push('camp', x, y + 0.3, clamp(z * (1 + Math.sqrt(st.pop) / 14), 14, 40), 1, tint); continue; }
    if (z < 3.2) {
      if (st.tier >= 3) push('city', x, y + 0.3, clamp(z * 7, 20, 34), 1, tint);
      else if (st.tier === 2) push('town', x, y + 0.3, clamp(z * 5, 15, 26), 1, tint);
      else if (z > 1.6) push(H3[0], x, y + 0.3, clamp(z * 4, 10, 18), 1, tint);
    } else if (z < 9) {
      if (st.tier >= 3) { push('city', x, y + 0.4, clamp(z * 4.5, 26, 54), 1, tint); }
      else if (st.tier === 2) push('town', x, y + 0.4, clamp(z * 3.6, 20, 40), 1, tint);
      else push(H3[1], x, y + 0.4, clamp(z * 2.6, 14, 28), 1, tint);
      if (st.walls && st.tier >= 2) push('wallRing', x, y + 0.2, clamp(z * (st.tier >= 3 ? 6.5 : 5), 30, 90) / GS, 0.85, WHITE, 0, false, -1);
    } else {
      // close: a whole town, house by house
      const n = clamp(Math.round(Math.sqrt(st.pop) * 0.75), 2, 46), R = 0.5 + Math.sqrt(st.pop) / 20, hs = clamp(z * 0.95, 14, 44);
      for (let k = 0; k < n; k++) {
        const a = h1(st.id, k) * Math.PI * 2, r = Math.sqrt(h1(st.id, k + 50)) * R, hx = x + Math.cos(a) * r, hy = y + Math.sin(a) * r * 0.85, ci = clamp(Math.floor(hy), 0, H - 1) * W + clamp(Math.floor(hx), 0, W - 1);
        if (m.water[ci]) continue; const kind = st.tier >= 2 && h1(st.id, k + 99) < 0.6 ? H3[1] : H3[h1(st.id, k + 7) < 0.5 ? 0 : 2];
        push(kind, hx, hy, hs * (0.8 + 0.4 * h1(st.id, k + 13)), 1, tint, 0, h1(st.id, k + 21) < 0.5);
      }
      if (st.tier >= 3 || st.cap) push('keep', x, y, clamp(z * 1.4, 22, 60), 1, tint, 0, false, 0.2);
      if (st.tier >= 2 && st.faith != null) push('temple', x + R * 0.5, y - R * 0.3, clamp(z * 1.1, 18, 44), 1, faithTint(m, st.faith));
      if (st.tower) push('tower', x - R * 0.6, y - R * 0.2, clamp(z * 1.5, 22, 60), 1, rgba(120, 70, 200));
      if (st.walls) push('wallRing', x, y + 0.1, clamp(z * (R * 2.6 + 0.6), 40, 2000) / GS, 0.9, WHITE, 0, false, -R);
      if (st.port) { const d = nearWater(m, st.x, st.y, 4); if (d) { push('dock', d[0] + 0.5, d[1] + 0.6, clamp(z * 1.2, 16, 40)); push('boat', d[0] + 0.9, d[1] + 0.9, clamp(z * 0.9, 14, 30), 1, tint); } }
    }
    if (st.wonder && z > 2.6) push(WONDER[st.wonder] || 'pyramid', x + 1.4, y + 0.4, clamp(z * 2.4, 22, 70), 1, tint);
    // labels
    const big = st.tier >= 3, mid = st.tier === 2;
    if (st.name && (big ? z > 1.6 : mid ? z > 4.5 : z > 9)) labels.push({ text: st.name, x, y: y + (z < 9 ? 0.9 + 6 / z : 0.8 + Math.sqrt(st.pop) / 20), px: big ? (st.cap ? 15 : 13.5) : mid ? 12 : 10.5, kind: big ? 'city' : 'town', pri: (st.cap ? 300 : 0) + st.tier * 100 + Math.log(st.pop + 1), ref: 's' + st.id, color: st.plague ? '#5a6a2a' : undefined });
  }
  /* --- people on the move --- */
  if (z > 2.2) for (const mv of E.movers) {
    const x = mv.px + (mv.x - mv.px) * clamp(frac, 0, 1) + 0.5, y = mv.py + (mv.y - mv.py) * clamp(frac, 0, 1) + 0.5; if (!seen(x, y)) continue;
    const c = cult(mv.c), tint = c ? hexTint(c.color) : WHITE, sz = clamp(z * 1.3, 14, 36), flip = mv.x < mv.px;
    if (mv.wet) push(mv.k === 'army' ? 'warship' : mv.k === 'trade' ? 'ship' : 'boat', x, y + 0.3, sz * (mv.k === 'army' ? 1.2 : 1), 1, tint, Math.sin(now * 0.003 + mv.id) * 0.06, flip);
    else push(mv.k === 'army' || mv.k === 'home' ? 'army' : mv.k === 'trade' ? 'caravan' : mv.k === 'settlers' ? 'settlers' : mv.k === 'quest' ? 'hero' : 'refugees', x, y + 0.3, sz * (mv.k === 'army' ? 1.15 : 1), 1, tint, 0, flip);
    if (mv.hero && z > 6) labels.push({ text: mv.hero, x, y: y + 0.8, px: 10.5, kind: 'hero', pri: 60, italic: true });
  }
  /* --- figures at home --- */
  if (z > 7) for (const f of E.figs) { if (!seen(f.x, f.y)) continue; const c = cult(f.c); push(f.villain ? 'villain' : f.role === 'prophet' ? 'prophet' : 'hero', f.x + 1.2, f.y + 0.9, clamp(z * 1.1, 16, 34), 1, c ? hexTint(c.color) : WHITE); if (z > 11) labels.push({ text: f.name, x: f.x + 1.2, y: f.y + 1.5, px: 10, kind: 'figure', pri: 50, italic: true, ref: 'p' + f.id }); }
  /* --- animals --- */
  if (z > 6.5 && opts.lens !== 6) {
    const n0 = z < 12 ? 1 : z < 20 ? 2 : 4, asz = clamp(z * 0.75, 11, 28);
    for (let hk = 0; hk < E.herds.length; hk++) { const hd = E.herds[hk]; if (!seen(hd.x, hd.y) || (z < 12 && (hd.n < 40 || hk % 3 !== 0)) || (z < 20 && hk % 2 === 1 && hd.n < 30)) continue; const f = clamp((tk - hd.mt) * 0.5, 0, 1), x = hd.px + (hd.x - hd.px) * f + 0.5, y = hd.py + (hd.y - hd.py) * f + 0.5, spn = SPECIES_SPR[hd.sp] || 'deer', n = Math.min(n0, Math.ceil(hd.n / 12));
      for (let k = 0; k < n; k++) push(spn, x + (h1(hd.sp * 999 + k, hd.x) - 0.5) * 1.4, y + (h1(k, hd.y) - 0.5) * 1.0, asz * (hd.odd === 'giant' ? 1.5 : hd.odd === 'dwarf' ? 0.65 : 1), 1, WHITE, 0, hd.x < hd.px); }
    for (const p of E.packs) { if (!seen(p.x, p.y)) continue; const f = clamp((tk - p.mt) * 0.5, 0, 1), x = p.px + (p.x - p.px) * f + 0.5, y = p.py + (p.y - p.py) * f + 0.5; for (let k = 0; k < Math.min(n0, 3); k++) push('wolf', x + (h1(k, p.x) - 0.5), y + (h1(k + 5, p.y) - 0.5) * 0.8, asz * 0.9, 1, WHITE, 0, p.x < p.px); }
  }
  /* --- the sea's own life: whales where the whale density is high, shoals close in --- */
  if (z > 2.4 && !bare) { const C = m.coarse, D = CW * CH * 4; for (let cy = Math.floor(y0 / 4); cy <= Math.floor(y1 / 4); cy++) for (let cx = Math.floor(x0 / 4); cx <= Math.floor(x1 / 4); cx++) { const ci = cy * CW + cx, whale = C[D + ci * 4 + 1] / 255, fish = C[D + ci * 4] / 255, cap = C[D + ci * 4 + 3] / 255;
    const x = cx * 4 + 2, y = cy * 4 + 2, i = y * W + x; if (!m.water[i] || m.water[i] === 2) continue;
    if (z > 9 && (cx + cy) % 2 === 0 && whale > 0.3 && h1(ci, 77) < whale * 0.18) { const t = now * 0.0002 + h1(ci) * 10, wx = x + Math.sin(t) * 1.5, wy = y + Math.cos(t * 0.7) * 1; const surf = 0.5 + 0.5 * Math.sin(now * 0.0011 + ci); if (surf > 0.35) push('whale', wx, wy, clamp(z * 2, 18, 56), clamp((surf - 0.35) * 3, 0, 0.95), WHITE, 0, Math.cos(t) < 0); }
    if (z > 10 && fish * cap > 0.25 && h1(ci, 31) < 0.6) push('fish', x + (h1(ci, 3) - 0.5) * 3, y + (h1(ci, 4) - 0.5) * 3, clamp(z * 0.8, 10, 24), 0.55 + 0.25 * Math.sin(now * 0.004 + ci)); } }
  /* --- beasts and their lairs --- */
  for (const b of E.beasts) {
    const lair = LAIR_SPR[b.kind]; if (lair && !b.sea && z > 2.5 && seen(b.lx, b.ly)) push(b.kind === 'dragon' && b.st === 'sleep' ? 'dragonSleep' : lair, b.lx + 0.5, b.ly + 0.6, clamp(z * (b.kind === 'dragon' ? 3 : 2), 22, 64));
    const x = b.px + (b.x - b.px) * clamp(frac, 0, 1) + 0.5, y = b.py + (b.y - b.py) * clamp(frac, 0, 1) + 0.5; if (!seen(x, y, 6)) continue;
    if (b.kind === 'dragon' && b.st === 'sleep') { if (z > 4) labels.push({ text: b.name, x: b.lx + 0.5, y: b.ly + 1.6, px: 11, kind: 'beast', pri: 80, italic: true, ref: 'b' + b.id }); continue; }
    const big = b.kind === 'dragon' ? 3.2 : b.sea ? 3.5 : 1.8, fly = b.fly, bob = fly ? Math.sin(now * 0.008 + b.id) * 0.15 : 0;
    push(BEAST_SPR[b.kind] || 'troll', x, y - (fly ? 1.4 : 0) + bob, clamp(z * big, 24, 110), b.sea && b.st !== 'wake' ? 0.55 + 0.2 * Math.sin(now * 0.0015 + b.id) : 1, WHITE, 0, b.x < b.px, fly ? 3 : 0);
    if (z > 3) labels.push({ text: b.name, x, y: y + 1.2, px: 11, kind: 'beast', pri: 80, italic: true, ref: 'b' + b.id });
  }
  /* --- weather and plagues of the sky --- */
  for (const stm of E.storms) { const x = stm.px + (stm.x - stm.px) * clamp(frac, 0, 1), y = stm.py + (stm.y - stm.py) * clamp(frac, 0, 1); if (!seen(x, y, 12)) continue; push('storm', x, y + 3, clamp((3 + 3.2 * stm.str) * 2.4 * z, 40, 900) / GS, 0.85, WHITE, now * 0.0016 + stm.spin, y < H / 2, 50); }
  if (opts.lens === 0 && z < 3.8) { /* flourishes for open ocean at far zoom */ }
  return G;
}

function faithTint(m: Mirror, f: number) { const fa = m.ents.faiths.find((q: any) => q.id === f); return fa ? hexTint(fa.color) : WHITE; }
function nearWater(m: Mirror, x: number, y: number, r: number): [number, number] | null { let best: [number, number] | null = null, bd = 1e9; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; if (m.water[yy * W + xx] !== 1) continue; const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = [xx, yy]; } } return best; }

// The country's glyph for a cell: a peak, a hill, a wood, reeds, dunes, a tuft of grass.
type Push = (name: string, x: number, y: number, px: number, a?: number, tint?: number, rot?: number, flip?: boolean, depth?: number) => void;
function countryGlyph(m: Mirror, i: number, spanPx: number, a: number, push: Push, now: number, z: number, L: number) {
  const f = m.fine, hh = m.h[i] - m.sea, jit = hh > 0.34 ? 0.2 : 0.75, x = (i % W) + 0.5 + (h1(i, 7) - 0.5) * jit, y = ((i / W) | 0) + 0.5 + (h1(i, 8) - 0.5) * jit;
  const t = f[i * 4 + 3] / 255, mi = f[i * 4 + 1] / 102, g = f[i * 4 + 2] / 255, snow = f[N * 4 + i * 4] / 255, Tm = f[N * 4 + i * 4 + 3] / 3.1875 - 40, fl = f[N * 8 + i * 4 + 1];
  const r = h1(i, 1), flip = r < 0.5;
  if (hh > 0.34 + 0.025 * L) { const cold = hh > 0.52 || Tm < -1 || snow > 0.5, big = clamp(spanPx * 1.05, 16, 52) * (0.7 + Math.min(0.6, (hh - 0.34) * 1.6)); push(cold ? (r < 0.5 ? 'mountS' : 'mountS2') : (r < 0.5 ? 'mount' : 'mount2'), x, y + 0.4, big, a, WHITE, 0, flip); return; }
  if (fl & 2) return;   // streets
  if (fl & 1) { if (z > 10 && h1(i, 5) < 0.035) push('windmill', x, y + 0.3, clamp(spanPx, 12, 26), a); return; }
  if (fl & 16) { if (h1(i, 6) < 0.3) push('ice', x, y + 0.3, clamp(spanPx, 12, 28), a * 0.8, WHITE, 0, flip); return; }
  if (hh > 0.2 && t < 0.55) { if (h1(i, 9) > 0.55) return; push(r < 0.5 ? 'hill' : 'hill2', x, y + 0.4, clamp(spanPx * 1.1, 14, 40), a, WHITE, 0, flip); return; }
  if (t > 0.48) { if (t < 0.7 && h1(i, 2) > t) return; treeAt(m, i, x, y + 0.3, clamp(spanPx * 1.05, 12, 30), a, push, 0); return; }
  if (mi < 0.2 && Tm > 6) { if (h1(i, 3) < 0.4) push(Tm > 18 && h1(i, 4) < 0.15 ? 'cactus' : 'dune', x, y + 0.3, clamp(spanPx, 12, 30), a * 0.85, WHITE, 0, flip); return; }
  if (mi > 1.6 && hh < 0.07) { if (h1(i, 3) < 0.55) push('reeds', x, y + 0.3, clamp(spanPx, 12, 26), a); return; }
  if (Tm < 1) { if (h1(i, 3) < 0.2) push('tundra', x, y + 0.3, clamp(spanPx, 10, 22), a * 0.85, WHITE, 0, flip); return; }
  if (g > 0.45) { if (z > 9 && h1(i, 3) < 0.12) push('tuft', x, y + 0.3, clamp(spanPx * 0.8, 9, 18), a * 0.75, WHITE, 0, flip); return; }
  if (h1(i, 3) < 0.1) push('shrub', x, y + 0.3, clamp(spanPx * 0.9, 10, 22), a * 0.85, WHITE, 0, flip);
}
function treeAt(m: Mirror, i: number, x: number, y: number, px: number, a: number, push: Push, k: number) {
  const f = m.fine, mi = f[i * 4 + 1] / 102, snow = f[N * 4 + i * 4] / 255, Tm = f[N * 4 + i * 4 + 3] / 3.1875 - 40, r = h1(i, 11 + k), flip = r < 0.5;
  let s: string;
  if (Tm < 5) s = snow > 0.4 ? 'coniferSnow' : r < 0.5 ? 'conifer' : 'conifer2';
  else if (Tm > 21 && mi > 1.3) s = r < 0.25 ? 'palm' : 'jungle';
  else if (Tm > 21) s = r < 0.3 ? 'palm' : 'tree';
  else if (Tm < 9) s = r < 0.55 ? 'conifer' : 'tree';
  else { const autumn = m.phase > 0.72 && m.phase < 0.9; s = autumn && r < 0.7 ? 'treeAutumn' : r < 0.5 ? 'tree' : 'tree2'; if (snow > 0.5 && r < 0.5) s = 'deadtree'; }
  push(s, x, y, px * (0.85 + 0.3 * h1(i, 17 + k)), a, WHITE, 0, flip);
}
