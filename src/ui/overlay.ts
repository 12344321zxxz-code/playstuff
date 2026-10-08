// The 2D layer over the map: lettering in the atlas manner (seas in spaced italics along their
// length, ranges in small capitals along the ridge, realms in wide capitals across their land),
// town names, the flashes and rings when something big happens, and the brush.
import { W, H } from '../sim/core';
import { Mirror } from './state';
import { Cam, Label } from './scene';

const FELL = '"IM Fell English", "EB Garamond", Georgia, serif', FELLSC = '"IM Fell English SC", "IM Fell English", Georgia, serif';
const REGION_STYLE: Record<number, { font: string; color: string; italic: boolean; caps: boolean; sp: number; min: number; max: number }> = {
  1: { font: FELL, color: '#33566b', italic: true, caps: false, sp: 0.35, min: 11, max: 30 },
  2: { font: FELL, color: '#33566b', italic: true, caps: false, sp: 0.1, min: 9.5, max: 15 },
  3: { font: FELLSC, color: '#5b3f26', italic: false, caps: true, sp: 0.42, min: 10, max: 22 },
  4: { font: FELL, color: '#3d5b2c', italic: true, caps: false, sp: 0.25, min: 10, max: 20 },
  5: { font: FELLSC, color: '#87602f', italic: false, caps: true, sp: 0.5, min: 10, max: 24 },
  6: { font: FELL, color: '#4c5a3c', italic: true, caps: false, sp: 0.2, min: 9.5, max: 16 },
  7: { font: FELL, color: '#6b6230', italic: true, caps: false, sp: 0.35, min: 10, max: 20 },
  8: { font: FELL, color: '#56606a', italic: true, caps: false, sp: 0.3, min: 10, max: 18 },
  9: { font: FELLSC, color: '#4f6a80', italic: false, caps: true, sp: 0.45, min: 10, max: 22 },
  10: { font: FELLSC, color: '#4a3a2a', italic: false, caps: true, sp: 0.15, min: 9.5, max: 15 },
};
export interface Fx { k: string; x: number; y: number; T: number; t0: number; R?: number; ux?: number; uy?: number }

export function drawOverlay(ctx: CanvasRenderingContext2D, m: Mirror, cam: Cam, labels: Label[], fx: Fx[], now: number, ui: any) {
  const dpr = cam.dpr, s = cam.z * dpr, cw = ctx.canvas.width, ch = ctx.canvas.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cw, ch);
  const toS = (x: number, y: number) => [(x - cam.x) * s + cw / 2, (y - cam.y) * s + ch / 2];
  const placed: number[][] = [];
  const hit = (b: number[]) => { for (const p of placed) if (b[0] < p[2] && b[2] > p[0] && b[1] < p[3] && b[3] > p[1]) return true; return false; };
  const lensBare = ui.lens === 4 || ui.lens === 5;

  // realm names, big and faint, when far out
  const all: (Label & { box?: number[] })[] = [];
  if (cam.z < 5 && !lensBare && (ui.lens === 0 || ui.lens === 6)) for (const c of m.ents.cults) {
    if (!c.big || c.count < 3) continue; const px = Math.min(30, 12 + Math.sqrt(c.count) * 2.2) * (ui.lens === 6 ? 1.15 : 1);
    all.push({ text: (c.empire ? 'Empire of the ' : 'The ') + c.name, x: c.big[0] + 0.5, y: c.big[1] - 3.5 / Math.max(1, cam.z / 2), px, kind: 'realm', pri: 2000 + c.pop / 50, color: shade(c.color), spacing: 0.32, ref: 'c' + c.id });
  }
  // places: seas, ranges, woods
  if (!lensBare) for (const r of m.regions) {
    const st = REGION_STYLE[r.c]; if (!st) continue; const lenPx = r.len * cam.z, text = st.caps ? r.name.toUpperCase() : r.name;
    let px = Math.min(st.max, Math.max(st.min, (lenPx / Math.max(4, text.length)) * 0.95));
    if (r.c === 1 && cam.z > 9) px = Math.min(px, 16);
    if (lenPx < text.length * st.min * 0.75 && r.c !== 2 && r.c !== 10) continue;   // too small to letter at this scale
    if ((r.c === 2 || r.c === 10) && cam.z < 3.2) continue;
    let ang = r.ang; if (ang > Math.PI / 2) ang -= Math.PI; if (ang < -Math.PI / 2) ang += Math.PI; if (Math.abs(ang) > 1.1) ang = ang > 0 ? 1.1 : -1.1; if (r.c === 2 || r.c === 10 || r.len < 12) ang *= 0.3;
    all.push({ text, x: r.ax + 0.5, y: r.ay + 0.5, px, kind: 'region', pri: 1000 + r.n / 50 + (r.c === 1 ? 300 : 0), color: st.color, ang, spacing: st.sp, italic: st.italic, ref: 'g' + r.id, font: st.font } as any);
  }
  for (const l of labels) all.push(l);
  all.sort((a, b) => b.pri - a.pri);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ui.labelHits = [];
  for (const l of all) {
    const [sx, sy] = toS(l.x, l.y); const px = l.px * dpr; if (sx < -400 || sy < -100 || sx > cw + 400 || sy > ch + 100) continue;
    const font = (l as any).font || (l.kind === 'realm' ? FELLSC : FELL);
    ctx.font = `${l.italic ? 'italic ' : ''}${l.kind === 'city' ? '600 ' : ''}${px}px ${font}`;
    const sp = (l.spacing || 0) * px; setSpacing(ctx, sp);
    const tw = ctx.measureText(l.text).width, ang = l.ang || 0, ca = Math.abs(Math.cos(ang)), sa = Math.abs(Math.sin(ang));
    const bw = tw * ca + px * 1.1 * sa, bh = tw * sa + px * 1.1 * ca, box = [sx - bw / 2 - 2, sy - bh / 2 - 1, sx + bw / 2 + 2, sy + bh / 2 + 1];
    if (hit(box)) continue; placed.push(box);
    ctx.save(); ctx.translate(sx, sy); if (ang) ctx.rotate(ang);
    if (l.kind === 'realm') { ctx.globalAlpha = 0.62; ctx.fillStyle = l.color || '#5a3a2a'; ctx.fillText(l.text, 0, 0); }
    else if (l.kind === 'region') { ctx.globalAlpha = 0.85; ctx.lineWidth = Math.max(2, px * 0.22); ctx.strokeStyle = 'rgba(245,238,220,0.55)'; ctx.strokeText(l.text, 0, 0); ctx.fillStyle = l.color || '#333'; ctx.fillText(l.text, 0, 0); }
    else {
      ctx.lineWidth = Math.max(2.5, px * 0.3); ctx.strokeStyle = 'rgba(246,239,222,0.88)'; ctx.strokeText(l.text, 0, 0);
      ctx.fillStyle = l.color || (l.kind === 'beast' ? '#7a2a1a' : l.kind === 'ruin' ? '#6a5a4a' : l.kind === 'figure' || l.kind === 'hero' ? '#5a3a6a' : '#2b2016'); ctx.fillText(l.text, 0, 0);
      if (l.kind === 'city' && l.pri >= 300) { ctx.beginPath(); ctx.moveTo(-tw / 2, px * 0.62); ctx.lineTo(tw / 2, px * 0.62); ctx.strokeStyle = 'rgba(43,32,22,0.6)'; ctx.lineWidth = dpr; ctx.stroke(); }
    }
    ctx.restore(); setSpacing(ctx, 0);
    if (l.ref) ui.labelHits.push([box, l.ref]);
  }

  // effects
  let shake = 0;
  for (const f of fx) {
    const u = (now - f.t0) / (f.T * 1000); if (u >= 1) continue; const [X, Y] = toS(f.x + 0.5, f.y + 0.5);
    if (f.k === 'boom') { const R = (2 + 9 * Math.sqrt(u)) * s; ctx.beginPath(); ctx.arc(X, Y, R, 0, 7); ctx.fillStyle = `rgba(255,${(230 - 120 * u) | 0},${(160 - 150 * u) | 0},${0.7 * (1 - u)})`; ctx.fill(); ctx.lineWidth = 3 * dpr; ctx.strokeStyle = `rgba(255,250,235,${1 - u})`; ctx.stroke(); shake = Math.max(shake, 1 - u); }
    else if (f.k === 'flash') { if (!ui.still) { ctx.fillStyle = `rgba(255,250,235,${0.8 * (1 - u)})`; ctx.fillRect(0, 0, cw, ch); } }
    else if (f.k === 'plume') { for (let q = 0; q < 9; q++) { const a = u * 1.6 + q * 0.11, d = a * 9 * s, rr = (1 + a * 3) * s; ctx.beginPath(); ctx.arc(X + (f.ux || 0) * d + Math.sin(q * 7.1) * rr * 0.4, Y + (f.uy || 0) * d - a * s * 1.5 + Math.cos(q * 5.3) * rr * 0.4, rr, 0, 7); ctx.fillStyle = `rgba(60,52,48,${0.45 * (1 - u)})`; ctx.fill(); } shake = Math.max(shake, 0.5 * (1 - u)); }
    else if (f.k === 'ring') { const R = (f.R || 3) * u * s; ctx.beginPath(); ctx.arc(X, Y, R, 0, 7); ctx.lineWidth = (2 + 5 * (1 - u)) * dpr; ctx.strokeStyle = `rgba(60,100,130,${0.8 * (1 - u)})`; ctx.stroke(); }
    else if (f.k === 'shake') { shake = Math.max(shake, 1 - u); ctx.beginPath(); ctx.arc(X, Y, 11 * s * u, 0, 7); ctx.lineWidth = 2 * dpr; ctx.strokeStyle = `rgba(90,60,40,${0.7 * (1 - u)})`; ctx.stroke(); }
    else if (f.k === 'clash') { const R = (0.6 + 1.6 * u) * Math.max(s, 6 * dpr); ctx.lineWidth = 2.2 * dpr; ctx.strokeStyle = `rgba(170,40,25,${1 - u})`; ctx.beginPath(); for (let q = 0; q < 6; q++) { const a = (q / 6) * 6.283 + 0.4; ctx.moveTo(X + Math.cos(a) * R * 0.3, Y + Math.sin(a) * R * 0.3); ctx.lineTo(X + Math.cos(a) * R, Y + Math.sin(a) * R); } ctx.stroke(); }
    else if (f.k === 'spark') { const R = (1 + 5 * u) * Math.max(s, 5 * dpr); ctx.lineWidth = 2.4 * dpr; ctx.strokeStyle = `rgba(230,180,40,${1 - u})`; ctx.beginPath(); for (let q = 0; q < 8; q++) { const a = (q / 8) * 6.283; ctx.moveTo(X + Math.cos(a) * R * 0.45, Y + Math.sin(a) * R * 0.45); ctx.lineTo(X + Math.cos(a) * R, Y + Math.sin(a) * R); } ctx.stroke(); }
    else if (f.k === 'bolt') { if (u < 0.5) { ctx.strokeStyle = `rgba(255,255,240,${1 - u * 2})`; ctx.lineWidth = 3 * dpr; ctx.beginPath(); let bx = X + (Math.random() - 0.5) * 20, by = 0; ctx.moveTo(bx, by); while (by < Y) { by += 20 + Math.random() * 30; bx += (Math.random() - 0.5) * 30; ctx.lineTo(by > Y ? X : bx, Math.min(by, Y)); } ctx.stroke(); ctx.lineWidth = 8 * dpr; ctx.strokeStyle = `rgba(200,220,255,${0.25 * (1 - u * 2)})`; ctx.stroke(); } }
    else if (f.k === 'omen') { const R = 30 * dpr * (1 + u); const g = ctx.createRadialGradient(X, Y - 40 * dpr, 2, X, Y - 40 * dpr, R); g.addColorStop(0, `rgba(255,250,200,${0.9 * (1 - u)})`); g.addColorStop(1, 'rgba(255,240,160,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X, Y - 40 * dpr, R, 0, 7); ctx.fill(); }
  }
  // locusts
  for (const sw of m.ents.swarms) { const [X, Y] = toS(sw.x + 0.5, sw.y + 0.5), R = 3.4 * Math.max(s, 3 * dpr), t = ui.still ? 0 : now * 0.004; ctx.fillStyle = 'rgba(70,58,28,0.18)'; ctx.beginPath(); ctx.arc(X, Y, R, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(44,34,12,0.85)'; for (let k = 0; k < 50; k++) { const a = hs(k, 1) * 6.28 + t * (0.5 + hs(k, 2)), r = Math.sqrt(hs(k, 3)) * R; ctx.fillRect(X + Math.cos(a) * r, Y + Math.sin(a) * r * 0.85, 1.4 * dpr, 1.4 * dpr); } }
  // plague: a sickly ring around stricken towns
  if (cam.z > 2.5) for (const st of m.ents.sets) if (st.plague) { const [X, Y] = toS(st.x + 0.5, st.y + 0.5); ctx.beginPath(); ctx.arc(X, Y, Math.max(14 * dpr, s * 2.2), 0, 7); ctx.setLineDash([3 * dpr, 4 * dpr]); ctx.strokeStyle = 'rgba(110,140,30,0.9)'; ctx.lineWidth = 1.8 * dpr; ctx.stroke(); ctx.setLineDash([]); }
  // selection
  if (ui.selPos) { const [X, Y] = toS(ui.selPos[0] + 0.5, ui.selPos[1] + 0.5), R = Math.max(18 * dpr, s * (ui.selPos[2] || 1.8)); ctx.beginPath(); ctx.arc(X, Y, R, 0, 7); ctx.setLineDash([7 * dpr, 5 * dpr]); ctx.lineDashOffset = ui.still ? 0 : -now * 0.02; ctx.lineWidth = 2.2 * dpr; ctx.strokeStyle = 'rgba(60,30,20,0.85)'; ctx.stroke(); ctx.setLineDash([]); }
  // plates: arrows to drag
  if (ui.lens === 4) for (const pl of m.plates) { const [ax, ay] = toS(pl.cx, pl.cy), [bx, by] = toS(pl.cx + pl.vx * 16, pl.cy + pl.vy * 16); arrow(ctx, ax, ay, bx, by, 'rgba(40,24,14,0.9)', 4 * dpr); arrow(ctx, ax, ay, bx, by, '#f4ead2', 2 * dpr); ctx.beginPath(); ctx.arc(bx, by, 7 * dpr, 0, 7); ctx.fillStyle = pl.land ? '#c8a050' : '#5a8aa8'; ctx.fill(); ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = 1.6 * dpr; ctx.stroke(); }
  // the brush
  if (ui.cursor) { const [X, Y] = toS(ui.cursor.x, ui.cursor.y), R = ui.cursor.r * s; ctx.beginPath(); ctx.arc(X, Y, Math.max(R, 6 * dpr), 0, 7); ctx.lineWidth = 3 * dpr; ctx.strokeStyle = 'rgba(40,24,14,0.45)'; ctx.stroke(); ctx.lineWidth = 1.4 * dpr; ctx.strokeStyle = ui.cursor.color || '#fff6e0'; ctx.stroke(); }
  return shake;
}
function hs(i: number, k: number) { let h = Math.imul(i, 374761393) ^ Math.imul(k, 668265263); h = Math.imul(h ^ (h >>> 13), 1103515245); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function setSpacing(ctx: any, px: number) { if ('letterSpacing' in ctx) ctx.letterSpacing = px ? px.toFixed(1) + 'px' : '0px'; }
function shade(hex: string) { const n = parseInt(hex.slice(1), 16); const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; const k = 0.55; return `rgb(${(r * k + 40) | 0},${(g * k + 25) | 0},${(b * k + 15) | 0})`; }
function arrow(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, col: string, lw: number) {
  const a = Math.atan2(y1 - y0, x1 - x0), hl = Math.max(8, lw * 2.6); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x1 + Math.cos(a) * hl * 0.6, y1 + Math.sin(a) * hl * 0.6); ctx.lineTo(x1 + Math.cos(a + 2.5) * hl, y1 + Math.sin(a + 2.5) * hl); ctx.lineTo(x1 + Math.cos(a - 2.5) * hl, y1 + Math.sin(a - 2.5) * hl); ctx.closePath(); ctx.fill();
}
