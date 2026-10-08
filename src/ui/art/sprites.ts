// Every little picture on the map, drawn once at start-up with the 2D canvas into an atlas: ink
// outlines, watercolour fills, a bit of hand wobble. Each sprite has a twin in a mask atlas
// that marks where the owner's colour goes (roofs, sails, banners), so one drawing serves every
// people. The GL glyph pass draws from the atlas; the radial menu borrows them as icons.
export const CELL = 96, COLS = 21, ROWS = 10, AW = CELL * COLS, AH = CELL * ROWS;
export const SPR: Record<string, number> = {};
export const ANCHOR: number[] = [];       // where the sprite stands, as a fraction of the cell height from the top

type Ctx = CanvasRenderingContext2D;
const INK = '#3b2b1d', INK2 = 'rgba(59,43,29,0.55)';
let seed = 1; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const j = (v: number, a = 1) => v + (rnd() - 0.5) * a;

interface Painter { (c: Ctx, m: Ctx, v: number): void }
const LIST: [string, Painter, number?][] = [];
const def = (name: string, p: Painter, anchor = 0.86) => LIST.push([name, p, anchor]);

// helpers
function path(c: Ctx, pts: number[][], close = true, wob = 0.8) { c.beginPath(); pts.forEach(([x, y], k) => (k ? c.lineTo(j(x, wob), j(y, wob)) : c.moveTo(j(x, wob), j(y, wob)))); if (close) c.closePath(); }
function inked(c: Ctx, fill: string | null, lw = 2.2, stroke = INK) { if (fill) { c.fillStyle = fill; c.fill(); } c.strokeStyle = stroke; c.lineWidth = lw; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
function hatch(c: Ctx, x0: number, y0: number, x1: number, y1: number, n: number, dx: number, dy: number, lw = 1.2, col = INK2) { c.beginPath(); for (let k = 0; k < n; k++) { const t = (k + 0.5) / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; c.moveTo(j(x, 0.6), j(y, 0.6)); c.lineTo(j(x + dx, 0.6), j(y + dy, 0.6)); } c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.stroke(); }
function blob(c: Ctx, x: number, y: number, rx: number, ry: number, n = 9, wob = 0.18) { c.beginPath(); for (let k = 0; k <= n; k++) { const a = (k / n) * Math.PI * 2, r = 1 + (rnd() - 0.5) * wob * 2; const px = x + Math.cos(a) * rx * r, py = y + Math.sin(a) * ry * r; k ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath(); }
function shadow(c: Ctx, x: number, y: number, rx: number, ry = rx * 0.28) { c.save(); c.globalAlpha = 0.22; c.fillStyle = '#3b2b1d'; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); c.restore(); }
function both(c: Ctx, m: Ctx, fn: (k: Ctx, isMask: boolean) => void) { fn(c, false); m.save(); fn(m, true); m.restore(); }
const MASK = '#ffffff', ROOF = '#b5523b';

/* ---------- land ---------- */
function mountain(c: Ctx, w: number, h: number, snow: boolean, tone = '#c8b08a') {
  const cx = 48, base = 82, l = cx - w / 2, r = cx + w / 2, top = base - h, px = cx + j(0, 6);
  shadow(c, cx + 4, base + 1, w * 0.55, 4);
  // lit face and shaded face
  path(c, [[l, base], [px - w * 0.12, top + h * 0.35], [px, top], [px + w * 0.05, top + h * 0.5], [cx + w * 0.05, base]]); inked(c, tone, 0);
  path(c, [[px, top], [px + w * 0.18, top + h * 0.3], [r, base], [cx + w * 0.05, base], [px + w * 0.05, top + h * 0.5]]); inked(c, shade(tone, 0.72), 0);
  if (snow) { path(c, [[px - w * 0.11, top + h * 0.3], [px, top], [px + w * 0.15, top + h * 0.26], [px + w * 0.06, top + h * 0.34], [px - w * 0.02, top + h * 0.28]]); inked(c, '#f6f4ee', 0); }
  hatch(c, px + w * 0.06, top + h * 0.35, r - 4, base - 3, Math.max(3, (w / 7) | 0), -3, 6);
  path(c, [[l, base], [px - w * 0.12, top + h * 0.35], [px, top], [px + w * 0.18, top + h * 0.3], [r, base]], false, 0.6); inked(c, null, 2.4);
  path(c, [[px, top], [px + w * 0.05, top + h * 0.5], [cx + w * 0.02, base - 6]], false, 0.6); inked(c, null, 1.3);
}
function shade(hex: string, k: number) { const n = parseInt(hex.slice(1), 16); const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; return `rgb(${(r * k) | 0},${(g * k) | 0},${(b * k * 1.05) | 0})`; }
def('mount', (c) => mountain(c, 70, 58, false));
def('mount2', (c) => { mountain(c, 50, 40, false, '#bfa985'); });
def('mountS', (c) => mountain(c, 72, 66, true, '#bdb0a0'));
def('mountS2', (c) => mountain(c, 56, 54, true, '#c4b6a6'));
def('hill', (c) => { shadow(c, 50, 80, 30, 4); c.beginPath(); c.moveTo(14, 80); c.bezierCurveTo(24, 52, 64, 46, 82, 80); inked(c, '#cdbb8e', 2.2); hatch(c, 56, 60, 76, 78, 4, -3, 5); });
def('hill2', (c) => { shadow(c, 48, 80, 26, 4); c.beginPath(); c.moveTo(18, 80); c.bezierCurveTo(26, 60, 58, 56, 76, 80); inked(c, '#c2b98a', 2); hatch(c, 52, 66, 70, 78, 3, -3, 5); });
def('volcano', (c) => { mountain(c, 70, 52, false, '#9c8a7a'); path(c, [[40, 34], [56, 34], [52, 40], [44, 40]]); inked(c, '#5a3a2a', 1.6); });
def('volcanoHot', (c) => { mountain(c, 70, 52, false, '#8a7466'); path(c, [[40, 34], [56, 34], [52, 40], [44, 40]]); inked(c, '#ff7a2a', 1.6); c.strokeStyle = '#e8541c'; c.lineWidth = 3; c.beginPath(); c.moveTo(48, 40); c.quadraticCurveTo(44, 58, 40, 76); c.stroke(); });
function conifer(c: Ctx, x: number, s: number, col: string) {
  shadow(c, x + 3, 84, 10 * s, 3);
  c.fillStyle = '#5a3e26'; c.fillRect(x - 1.5 * s, 74, 3 * s, 10);
  for (let k = 0; k < 3; k++) { const y = 30 + k * 14 * s, w = (9 + k * 5) * s; path(c, [[x, y - 14 * s + 10], [x + w, y + 14], [x - w, y + 14]]); inked(c, k === 2 ? shade(col, 0.85) : col, 2); }
}
function broadleaf(c: Ctx, x: number, s: number, col: string) {
  shadow(c, x + 3, 84, 13 * s, 3.5);
  c.strokeStyle = INK; c.lineWidth = 2.6 * s; c.beginPath(); c.moveTo(x, 84); c.lineTo(x, 58); c.stroke();
  blob(c, x, 46, 17 * s, 15 * s); inked(c, col, 2.2);
  blob(c, x + 5 * s, 50, 9 * s, 8 * s, 7); c.fillStyle = shade(col, 0.8); c.fill();
  c.beginPath(); c.arc(x - 6 * s, 41, 3 * s, 0, 7); c.fillStyle = 'rgba(255,255,230,0.35)'; c.fill();
}
def('conifer', (c) => conifer(c, 48, 1, '#4f7a52'));
def('conifer2', (c) => { conifer(c, 40, 0.8, '#557f55'); conifer(c, 60, 0.9, '#4a7050'); });
def('coniferSnow', (c) => { conifer(c, 48, 1, '#5d7d68'); c.fillStyle = '#f4f4f0'; for (let k = 0; k < 3; k++) { path(c, [[48, 22 + k * 14], [54 + k * 4, 34 + k * 14], [42 - k * 4, 34 + k * 14]]); c.globalAlpha = 0.85; c.fill(); c.globalAlpha = 1; } });
def('tree', (c) => broadleaf(c, 48, 1, '#6f9a4e'));
def('tree2', (c) => { broadleaf(c, 38, 0.75, '#7aa055'); broadleaf(c, 60, 0.85, '#6a9149'); });
def('treeAutumn', (c) => broadleaf(c, 48, 1, '#c7843c'));
def('palm', (c) => { shadow(c, 52, 84, 12, 3); c.strokeStyle = '#6b4a2c'; c.lineWidth = 4; c.beginPath(); c.moveTo(46, 84); c.quadraticCurveTo(44, 60, 52, 36); c.stroke(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke(); for (let k = 0; k < 6; k++) { const a = -2.6 + k * 0.85; c.beginPath(); c.moveTo(52, 36); c.quadraticCurveTo(52 + Math.cos(a) * 14, 30 + Math.sin(a) * 6, 52 + Math.cos(a) * 24, 40 + Math.sin(a) * 12 + 8); c.strokeStyle = '#4f8a4a'; c.lineWidth = 5; c.stroke(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke(); } });
def('jungle', (c) => { broadleaf(c, 36, 0.8, '#3f7a44'); broadleaf(c, 58, 1.05, '#357040'); c.strokeStyle = '#2f6a3a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(30, 60); c.quadraticCurveTo(26, 72, 32, 80); c.stroke(); });
def('shrub', (c) => { shadow(c, 48, 82, 14, 3); blob(c, 42, 74, 10, 8); inked(c, '#8e9a58', 1.8); blob(c, 56, 76, 9, 7); inked(c, '#7f8e50', 1.8); });
def('cactus', (c) => { shadow(c, 50, 84, 8, 2.5); c.fillStyle = '#7a9a58'; c.strokeStyle = INK; c.lineWidth = 2; const r = (x: number, y: number, w: number, h: number) => { c.beginPath(); c.roundRect(x, y, w, h, w / 2); c.fill(); c.stroke(); }; r(44, 46, 9, 38); r(32, 56, 7, 16); r(56, 50, 7, 14); });
def('tuft', (c) => { c.strokeStyle = '#7a7a48'; c.lineWidth = 1.8; c.lineCap = 'round'; c.beginPath(); for (let k = 0; k < 7; k++) { const x = 38 + k * 3.4; c.moveTo(x, 82); c.quadraticCurveTo(x + j(0, 4), 70, x + (k - 3) * 2.2, 62 + rnd() * 6); } c.stroke(); });
def('reeds', (c) => { c.strokeStyle = '#5f7448'; c.lineWidth = 1.6; c.beginPath(); for (let k = 0; k < 8; k++) { const x = 32 + k * 4.4; c.moveTo(x, 84); c.lineTo(x + j(0, 3), 56 + rnd() * 10); } c.stroke(); c.fillStyle = '#6b4a2c'; for (let k = 0; k < 4; k++) { c.beginPath(); c.ellipse(36 + k * 8, 58 + rnd() * 6, 1.8, 4, 0, 0, 7); c.fill(); } c.strokeStyle = 'rgba(80,110,130,0.6)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(26, 86); c.lineTo(70, 86); c.stroke(); });
def('dune', (c) => { c.strokeStyle = 'rgba(150,110,60,0.8)'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(18, 78); c.quadraticCurveTo(40, 62, 62, 76); c.moveTo(40, 82); c.quadraticCurveTo(58, 70, 80, 82); c.stroke(); hatch(c, 46, 70, 60, 76, 3, 2, 4, 1, 'rgba(150,110,60,0.5)'); });
def('deadtree', (c) => { c.strokeStyle = '#4a3a2c'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(48, 84); c.lineTo(48, 50); c.moveTo(48, 62); c.lineTo(38, 48); c.moveTo(48, 56); c.lineTo(60, 44); c.moveTo(38, 48); c.lineTo(34, 40); c.stroke(); });
def('tundra', (c) => { c.fillStyle = '#9aa28a'; blob(c, 40, 80, 8, 3); c.fill(); blob(c, 58, 82, 7, 3); c.fill(); c.strokeStyle = '#6b7058'; c.lineWidth = 1.2; c.beginPath(); for (let k = 0; k < 5; k++) { c.moveTo(36 + k * 6, 82); c.lineTo(37 + k * 6, 74); } c.stroke(); });
def('ice', (c) => { path(c, [[26, 82], [36, 60], [50, 66], [60, 52], [72, 82]]); inked(c, '#eef2f4', 1.8, '#6a7a8a'); hatch(c, 52, 62, 66, 80, 3, -2, 5, 1, 'rgba(90,120,150,0.5)'); });

/* ---------- people: houses by race ---------- */
function house(c: Ctx, m: Ctx, x: number, y: number, s: number, wall = '#e8dcc0', roof = ROOF) {
  shadow(c, x + 2, y + 1, 12 * s, 3 * s);
  path(c, [[x - 9 * s, y], [x - 9 * s, y - 10 * s], [x + 9 * s, y - 10 * s], [x + 9 * s, y]], true, 0.4); inked(c, wall, 1.8);
  both(c, m, (k, isM) => { path(k, [[x - 11 * s, y - 9 * s], [x, y - 20 * s], [x + 11 * s, y - 9 * s]], true, 0.4); if (isM) { k.fillStyle = MASK; k.fill(); } else inked(k, roof, 1.8); });
  c.fillStyle = INK; c.fillRect(x - 2 * s, y - 6 * s, 3.5 * s, 6 * s);
}
function hut(c: Ctx, m: Ctx, x: number, y: number, s: number) {
  shadow(c, x + 2, y + 1, 11 * s, 3 * s);
  path(c, [[x - 9 * s, y], [x - 8 * s, y - 7 * s], [x + 8 * s, y - 7 * s], [x + 9 * s, y]], true, 0.5); inked(c, '#cdb48a', 1.6);
  both(c, m, (k, isM) => { k.beginPath(); k.moveTo(x - 11 * s, y - 6 * s); k.quadraticCurveTo(x, y - 26 * s, x + 11 * s, y - 6 * s); k.closePath(); if (isM) { k.globalAlpha = 0.6; k.fillStyle = MASK; k.fill(); } else inked(k, '#c9a24e', 1.6); });
  hatch(c, x - 6 * s, y - 12 * s, x + 6 * s, y - 12 * s, 4, 1, 4, 1);
}
def('hut', (c, m) => hut(c, m, 48, 82, 1.5));
def('house', (c, m) => house(c, m, 48, 82, 1.6));
def('house2', (c, m) => { house(c, m, 36, 76, 1.1); house(c, m, 58, 84, 1.3, '#e2d6bb'); });
def('longhouse', (c, m) => { shadow(c, 50, 83, 26, 4); path(c, [[22, 82], [22, 70], [74, 70], [74, 82]], true, 0.5); inked(c, '#c8ab84', 1.8); both(c, m, (k, isM) => { k.beginPath(); k.moveTo(18, 71); k.quadraticCurveTo(48, 50, 78, 71); k.closePath(); if (isM) { k.fillStyle = MASK; k.fill(); } else inked(k, '#8a5a3a', 1.8); }); c.fillStyle = INK; c.fillRect(45, 75, 6, 7); });
def('stilt', (c, m) => { c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); for (const x of [34, 46, 58]) { c.moveTo(x, 86); c.lineTo(x, 66); } c.stroke(); path(c, [[30, 66], [62, 66], [62, 56], [30, 56]]); inked(c, '#b89a6a', 1.8); both(c, m, (k, isM) => { k.beginPath(); k.moveTo(26, 57); k.quadraticCurveTo(46, 30, 66, 57); k.closePath(); if (isM) { k.fillStyle = MASK; k.fill(); } else inked(k, '#7a8a4a', 1.8); }); c.strokeStyle = 'rgba(70,110,120,0.6)'; c.beginPath(); c.moveTo(24, 86); c.lineTo(70, 86); c.stroke(); });
def('mudDome', (c, m) => { shadow(c, 48, 83, 20, 4); c.beginPath(); c.moveTo(28, 82); c.quadraticCurveTo(28, 50, 48, 50); c.quadraticCurveTo(68, 50, 68, 82); c.closePath(); inked(c, '#b58a5a', 2); both(c, m, (k, isM) => { k.beginPath(); k.ellipse(48, 56, 10, 5, 0, 0, 7); if (isM) { k.fillStyle = MASK; k.fill(); } else inked(k, '#c46a44', 1.4); }); c.fillStyle = INK; c.beginPath(); c.arc(48, 76, 5, Math.PI, 0); c.fill(); });
def('ratHouse', (c, m) => { shadow(c, 48, 83, 16, 3); path(c, [[36, 82], [34, 50], [60, 46], [62, 82]], true, 1.4); inked(c, '#b8a68a', 1.8); both(c, m, (k, isM) => { path(k, [[30, 52], [46, 26], [66, 48]], true, 1.6); if (isM) { k.fillStyle = MASK; k.fill(); } else inked(k, '#6f5a7a', 1.8); }); c.fillStyle = INK; c.fillRect(42, 58, 4, 5); c.fillRect(52, 66, 4, 5); c.fillRect(46, 74, 5, 8); });
def('nest', (c, m) => { shadow(c, 48, 84, 18, 3); c.strokeStyle = INK; c.lineWidth = 2.4; c.beginPath(); c.moveTo(48, 86); c.lineTo(48, 56); c.stroke(); both(c, m, (k, isM) => { k.beginPath(); k.ellipse(48, 52, 18, 9, 0, 0, 7); if (isM) { k.fillStyle = MASK; k.fill(); } else inked(k, '#a77a4a', 2); }); hatch(c, 34, 50, 62, 50, 7, 2, 5, 1.2); c.beginPath(); c.moveTo(34, 46); c.quadraticCurveTo(48, 30, 62, 46); inked(c, '#d8c8a8', 1.8); });
def('wolfHall', (c, m) => { shadow(c, 50, 84, 24, 4); path(c, [[24, 82], [24, 66], [72, 66], [72, 82]], true, 0.6); inked(c, '#9a7a56', 1.8); both(c, m, (k, isM) => { path(k, [[20, 67], [48, 40], [76, 67]], true, 0.6); if (isM) { k.fillStyle = MASK; k.fill(); } else inked(k, '#5a4a3a', 1.8); }); c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(44, 44); c.lineTo(40, 34); c.moveTo(52, 44); c.lineTo(56, 34); c.stroke(); c.fillStyle = INK; c.fillRect(45, 73, 6, 9); });
def('keep', (c, m) => { shadow(c, 50, 84, 20, 4); path(c, [[32, 84], [32, 40], [64, 40], [64, 84]], true, 0.4); inked(c, '#d6cdb8', 2); c.fillStyle = '#d6cdb8'; for (let k = 0; k < 4; k++) { c.fillRect(31 + k * 9, 33, 6, 8); c.strokeStyle = INK; c.lineWidth = 1.6; c.strokeRect(31 + k * 9, 33, 6, 8); } c.fillStyle = INK; c.fillRect(45, 70, 7, 14); c.fillRect(38, 50, 3, 6); c.fillRect(55, 50, 3, 6); c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(48, 33); c.lineTo(48, 12); c.stroke(); both(c, m, (k, isM) => { path(k, [[48, 12], [66, 17], [48, 22]], true, 0.3); if (isM) { k.fillStyle = MASK; k.fill(); } else inked(k, '#c03a2a', 1.2); }); }, 0.88);
def('temple', (c, m) => { shadow(c, 50, 84, 24, 4); path(c, [[24, 84], [24, 80], [72, 80], [72, 84]]); inked(c, '#e6dcc6', 1.6); for (let k = 0; k < 5; k++) { c.fillStyle = '#efe6d2'; c.fillRect(28 + k * 9.5, 56, 5, 24); c.strokeStyle = INK; c.lineWidth = 1.4; c.strokeRect(28 + k * 9.5, 56, 5, 24); } both(c, m, (k, isM) => { path(k, [[22, 57], [48, 38], [74, 57]], true, 0.3); if (isM) { k.fillStyle = MASK; k.fill(); } else inked(k, '#d9c9a5', 1.8); }); }, 0.88);
def('tower', (c, m) => { shadow(c, 50, 84, 12, 3); path(c, [[40, 84], [42, 30], [54, 30], [56, 84]], true, 0.5); inked(c, '#8a7aa8', 1.8); both(c, m, (k, isM) => { path(k, [[38, 31], [48, 6], [58, 31]], true, 0.5); if (isM) { k.fillStyle = MASK; k.fill(); } else inked(k, '#5a3a8a', 1.8); }); c.fillStyle = '#ffe680'; c.fillRect(46, 42, 4, 6); c.fillRect(46, 60, 4, 6); }, 0.88);
def('wallRing', (c) => { c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.ellipse(48, 60, 40, 24, 0, 0, 7); c.stroke(); c.strokeStyle = '#d8cdb5'; c.lineWidth = 3; c.stroke(); for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; c.fillStyle = '#d8cdb5'; c.fillRect(48 + Math.cos(a) * 40 - 3, 60 + Math.sin(a) * 24 - 5, 6, 8); c.strokeStyle = INK; c.lineWidth = 1.5; c.strokeRect(48 + Math.cos(a) * 40 - 3, 60 + Math.sin(a) * 24 - 5, 6, 8); } }, 0.62);
def('tent', (c, m) => { shadow(c, 48, 84, 16, 3); both(c, m, (k, isM) => { k.beginPath(); k.moveTo(30, 84); k.lineTo(32, 66); k.quadraticCurveTo(48, 52, 64, 66); k.lineTo(66, 84); k.closePath(); if (isM) { k.globalAlpha = 0.7; k.fillStyle = MASK; k.fill(); } else inked(k, '#e7dcc4', 1.8); }); hatch(c, 34, 72, 62, 72, 6, 0, 8, 1); c.fillStyle = INK; c.beginPath(); c.arc(48, 84, 5, Math.PI, 0); c.fill(); });
def('dock', (c) => { c.strokeStyle = INK; c.lineWidth = 2; c.fillStyle = '#9a7a52'; c.fillRect(20, 70, 56, 7); c.strokeRect(20, 70, 56, 7); c.beginPath(); for (let k = 0; k < 5; k++) { c.moveTo(24 + k * 12, 77); c.lineTo(24 + k * 12, 88); } c.stroke(); });
def('windmill', (c, m) => { shadow(c, 48, 84, 10, 3); path(c, [[42, 84], [44, 52], [52, 52], [54, 84]]); inked(c, '#e3d7bf', 1.8); both(c, m, (k, isM) => { path(k, [[42, 53], [48, 44], [54, 53]]); if (isM) { k.fillStyle = MASK; k.fill(); } else inked(k, ROOF, 1.6); }); c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); for (let k = 0; k < 4; k++) { const a = 0.6 + (k * Math.PI) / 2; c.moveTo(48, 52); c.lineTo(48 + Math.cos(a) * 22, 52 + Math.sin(a) * 22); } c.stroke(); });
def('ruin', (c) => { shadow(c, 48, 84, 22, 4); for (const [x, h] of [[30, 26], [44, 14], [58, 32], [70, 10]]) { c.fillStyle = '#ddd4c2'; c.fillRect(x, 84 - h, 7, h); c.strokeStyle = INK; c.lineWidth = 1.6; c.strokeRect(x, 84 - h, 7, h); } c.beginPath(); c.moveTo(28, 58); c.lineTo(66, 52); inked(c, null, 3.5); hatch(c, 24, 84, 76, 84, 7, 2, -3, 1.2); });
def('ruinDrowned', (c) => { for (const [x, h] of [[32, 18], [50, 26], [64, 12]]) { c.fillStyle = '#c8d4d2'; c.fillRect(x, 80 - h, 6, h); c.strokeStyle = INK; c.lineWidth = 1.4; c.strokeRect(x, 80 - h, 6, h); } c.strokeStyle = 'rgba(60,100,120,0.8)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(22, 80); c.quadraticCurveTo(34, 76, 46, 80); c.quadraticCurveTo(58, 84, 74, 80); c.stroke(); });
def('pyramid', (c, m) => { shadow(c, 50, 84, 34, 5); path(c, [[14, 84], [48, 30], [82, 84]], true, 0.4); inked(c, '#e3c993', 2.2); path(c, [[48, 30], [82, 84], [56, 84]], true, 0.4); c.fillStyle = 'rgba(120,80,40,0.35)'; c.fill(); hatch(c, 26, 70, 72, 70, 8, 0, 3, 1); both(c, m, (k, isM) => { path(k, [[44, 36], [48, 30], [52, 36]]); if (isM) { k.fillStyle = MASK; k.fill(); } else { k.fillStyle = '#e8b923'; k.fill(); } }); }, 0.88);
def('colossus', (c, m) => { shadow(c, 48, 86, 18, 3); c.fillStyle = '#c9a66b'; c.fillRect(36, 74, 24, 12); c.strokeStyle = INK; c.lineWidth = 1.8; c.strokeRect(36, 74, 24, 12); c.beginPath(); c.moveTo(42, 74); c.lineTo(44, 44); c.lineTo(40, 36); c.moveTo(54, 74); c.lineTo(52, 44); c.lineTo(62, 22); c.moveTo(44, 44); c.lineTo(52, 44); c.stroke(); c.lineWidth = 6; c.strokeStyle = '#b08a4e'; c.beginPath(); c.moveTo(48, 44); c.lineTo(48, 28); c.stroke(); c.beginPath(); c.arc(48, 22, 6, 0, 7); inked(c, '#b08a4e', 1.8); both(c, m, (k, isM) => { k.beginPath(); k.arc(62, 18, 5, 0, 7); if (isM) { k.fillStyle = MASK; k.fill(); } else inked(k, '#ffcf4a', 1.4); }); }, 0.9);
def('greatTemple', (c, m) => { shadow(c, 50, 86, 34, 5); for (let k = 0; k < 3; k++) { path(c, [[18 + k * 8, 86 - k * 12], [18 + k * 8, 76 - k * 12], [78 - k * 8, 76 - k * 12], [78 - k * 8, 86 - k * 12]], true, 0.4); inked(c, '#e8dfca', 1.8); } both(c, m, (k, isM) => { k.beginPath(); k.arc(48, 52, 12, Math.PI, 0); k.closePath(); if (isM) { k.fillStyle = MASK; k.fill(); } else inked(k, '#d9a54e', 1.8); }); }, 0.9);
def('lighthouse', (c, m) => { shadow(c, 48, 86, 12, 3); path(c, [[40, 86], [43, 30], [53, 30], [56, 86]], true, 0.4); inked(c, '#efe8da', 1.8); c.fillStyle = '#c0503a'; c.fillRect(42, 50, 12, 6); c.fillRect(41, 68, 14, 6); both(c, m, (k, isM) => { k.beginPath(); k.arc(48, 24, 7, 0, 7); if (isM) { k.fillStyle = MASK; k.fill(); } else { k.fillStyle = '#ffd96a'; k.fill(); k.strokeStyle = INK; k.lineWidth = 1.4; k.stroke(); } }); c.strokeStyle = 'rgba(255,220,120,0.6)'; c.lineWidth = 3; c.beginPath(); c.moveTo(56, 24); c.lineTo(86, 18); c.moveTo(40, 24); c.lineTo(10, 18); c.stroke(); }, 0.9);
def('mine', (c) => { shadow(c, 48, 82, 18, 3); c.beginPath(); c.moveTo(28, 82); c.quadraticCurveTo(48, 54, 68, 82); inked(c, '#8a7a66', 2); c.fillStyle = INK; c.beginPath(); c.arc(48, 82, 8, Math.PI, 0); c.fill(); c.strokeStyle = '#6b4a2c'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(38, 82); c.lineTo(40, 70); c.lineTo(56, 70); c.lineTo(58, 82); c.stroke(); });
def('dam', (c) => { path(c, [[16, 66], [80, 66], [76, 84], [20, 84]]); inked(c, '#cfc6b2', 2); hatch(c, 22, 70, 74, 70, 9, 0, 12, 1); });

/* ---------- on the move ---------- */
function sail(c: Ctx, m: Ctx, x: number, y: number, s: number) {
  shadow(c, x, y + 4 * s, 16 * s, 3 * s);
  path(c, [[x - 15 * s, y - 4 * s], [x + 16 * s, y - 4 * s], [x + 10 * s, y + 4 * s], [x - 10 * s, y + 4 * s]], true, 0.4); inked(c, '#7a5232', 1.8);
  c.strokeStyle = INK; c.lineWidth = 1.8; c.beginPath(); c.moveTo(x, y - 4 * s); c.lineTo(x, y - 30 * s); c.stroke();
  both(c, m, (k, isM) => { k.beginPath(); k.moveTo(x + 1 * s, y - 29 * s); k.quadraticCurveTo(x + 15 * s, y - 18 * s, x + 1 * s, y - 7 * s); k.closePath(); if (isM) { k.fillStyle = MASK; k.fill(); } else inked(k, '#efe6d0', 1.6); });
  both(c, m, (k, isM) => { k.beginPath(); k.moveTo(x - 1 * s, y - 25 * s); k.quadraticCurveTo(x - 11 * s, y - 16 * s, x - 1 * s, y - 8 * s); k.closePath(); if (isM) { k.globalAlpha = 0.6; k.fillStyle = MASK; k.fill(); } else inked(k, '#e6dcc4', 1.4); });
}
def('ship', (c, m) => sail(c, m, 48, 76, 1.3), 0.84);
def('boat', (c, m) => sail(c, m, 48, 76, 0.9), 0.84);
def('warship', (c, m) => { sail(c, m, 48, 76, 1.4); c.fillStyle = INK; for (let k = 0; k < 5; k++) c.fillRect(30 + k * 8, 74, 3, 2); });
def('caravan', (c, m) => { shadow(c, 48, 84, 22, 3); both(c, m, (k, isM) => { k.beginPath(); k.moveTo(30, 74); k.quadraticCurveTo(46, 52, 62, 74); k.closePath(); if (isM) { k.globalAlpha = 0.5; k.fillStyle = MASK; k.fill(); } else inked(k, '#efe4c8', 1.6); }); c.fillStyle = '#8a5a34'; c.fillRect(28, 74, 36, 5); c.strokeStyle = INK; c.lineWidth = 1.6; c.strokeRect(28, 74, 36, 5); for (const x of [34, 58]) { c.beginPath(); c.arc(x, 82, 4, 0, 7); inked(c, '#6a4a2c', 1.6); } c.beginPath(); c.moveTo(64, 76); c.lineTo(74, 72); c.lineTo(80, 72); inked(c, null, 2); c.beginPath(); c.ellipse(76, 74, 6, 4, 0, 0, 7); inked(c, '#9a7050', 1.4); });
function soldier(c: Ctx, m: Ctx, x: number, y: number, s: number, banner: boolean) {
  c.fillStyle = INK; c.beginPath(); c.arc(x, y - 18 * s, 3 * s, 0, 7); c.fill();
  both(c, m, (k, isM) => { path(k, [[x - 4 * s, y - 15 * s], [x + 4 * s, y - 15 * s], [x + 3 * s, y - 4 * s], [x - 3 * s, y - 4 * s]], true, 0.3); if (isM) { k.fillStyle = MASK; k.fill(); } else inked(k, '#a33', 1.2); });
  c.strokeStyle = INK; c.lineWidth = 1.6 * s; c.beginPath(); c.moveTo(x - 2 * s, y - 4 * s); c.lineTo(x - 2.5 * s, y); c.moveTo(x + 2 * s, y - 4 * s); c.lineTo(x + 2.5 * s, y); c.moveTo(x + 5 * s, y + 1); c.lineTo(x + 5 * s, y - 26 * s); c.stroke();
  if (banner) both(c, m, (k, isM) => { path(k, [[x + 5 * s, y - 26 * s], [x + 18 * s, y - 23 * s], [x + 5 * s, y - 19 * s]], true, 0.3); if (isM) { k.fillStyle = MASK; k.fill(); } else inked(k, '#c33', 1.2); });
}
def('army', (c, m) => { shadow(c, 48, 86, 24, 3); soldier(c, m, 34, 82, 1, false); soldier(c, m, 60, 84, 1, false); soldier(c, m, 47, 86, 1.15, true); });
def('settlers', (c, m) => { shadow(c, 48, 86, 22, 3); c.fillStyle = '#8a6a44'; c.fillRect(40, 72, 26, 8); c.strokeStyle = INK; c.lineWidth = 1.6; c.strokeRect(40, 72, 26, 8); for (const x of [45, 61]) { c.beginPath(); c.arc(x, 82, 4, 0, 7); inked(c, '#6a4a2c', 1.4); } both(c, m, (k, isM) => { k.beginPath(); k.ellipse(53, 70, 11, 5, 0, Math.PI, 0); if (isM) { k.fillStyle = MASK; k.fill(); } else inked(k, '#e8dcbf', 1.4); }); c.fillStyle = INK; c.beginPath(); c.arc(30, 68, 3, 0, 7); c.fill(); c.fillRect(28, 71, 4, 12); });
def('refugees', (c, m) => { shadow(c, 48, 86, 20, 3); for (const [x, y] of [[36, 84], [48, 86], [60, 83]]) { c.fillStyle = '#6a5a4a'; c.beginPath(); c.arc(x, y - 16, 3, 0, 7); c.fill(); path(c, [[x - 4, y - 13], [x + 4, y - 13], [x + 5, y], [x - 5, y]]); inked(c, '#9a8a74', 1.2); } });
def('hero', (c, m) => { shadow(c, 48, 86, 10, 3); c.fillStyle = INK; c.beginPath(); c.arc(48, 52, 5, 0, 7); c.fill(); both(c, m, (k, isM) => { path(k, [[42, 58], [54, 58], [58, 84], [38, 84]], true, 0.3); if (isM) { k.fillStyle = MASK; k.fill(); } else inked(k, '#b33', 1.6); }); c.strokeStyle = '#d8d8e0'; c.lineWidth = 2.6; c.beginPath(); c.moveTo(58, 64); c.lineTo(72, 36); c.stroke(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke(); c.strokeStyle = 'rgba(255,220,120,0.7)'; c.lineWidth = 2; c.beginPath(); c.arc(48, 52, 9, 0, 7); c.stroke(); }, 0.9);
def('prophet', (c, m) => { shadow(c, 48, 86, 10, 3); c.fillStyle = '#e8dcc8'; c.beginPath(); c.arc(48, 50, 5, 0, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke(); both(c, m, (k, isM) => { path(k, [[43, 56], [53, 56], [60, 86], [36, 86]], true, 0.3); if (isM) { k.fillStyle = MASK; k.fill(); } else inked(k, '#e8dfca', 1.6); }); c.strokeStyle = '#6b4a2c'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(36, 86); c.lineTo(34, 40); c.quadraticCurveTo(30, 36, 34, 32); c.stroke(); c.strokeStyle = 'rgba(255,240,160,0.8)'; c.lineWidth = 1.6; c.beginPath(); c.arc(48, 50, 9, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }, 0.92);
def('villain', (c, m) => { shadow(c, 48, 86, 10, 3); both(c, m, (k, isM) => { path(k, [[40, 86], [48, 30], [56, 86]], true, 0.3); if (isM) { k.globalAlpha = 0.4; k.fillStyle = MASK; k.fill(); } else inked(k, '#2a2230', 1.6); }); path(c, [[38, 46], [48, 18], [58, 46]], true, 0.3); inked(c, '#3a2a48', 1.6); c.fillStyle = '#b6ff6a'; c.beginPath(); c.arc(46, 50, 1.6, 0, 7); c.arc(51, 50, 1.6, 0, 7); c.fill(); c.strokeStyle = 'rgba(160,255,120,0.5)'; c.lineWidth = 2; c.beginPath(); c.arc(64, 56, 5, 0, 7); c.stroke(); }, 0.92);

/* ---------- animals ---------- */
function quad(c: Ctx, x: number, y: number, s: number, col: string, o: { horns?: string; hump?: boolean; trunk?: boolean; neck?: number; tail?: boolean; legs?: number; antlers?: boolean; tusk?: boolean; dark?: boolean } = {}) {
  shadow(c, x, y + 1, 16 * s, 3 * s);
  const by = y - 12 * s, nk = o.neck || 0;
  c.strokeStyle = INK; c.lineWidth = 2.4 * s; c.lineCap = 'round'; c.beginPath();
  for (const lx of [-9, -5, 6, 10]) { c.moveTo(x + lx * s, by + 3 * s); c.lineTo(x + (lx + j(0, 1.5)) * s, y); } c.stroke();
  c.beginPath(); c.ellipse(x, by, 13 * s, 6.5 * s, 0, 0, 7); inked(c, col, 1.8);
  if (o.hump) { c.beginPath(); c.ellipse(x - 1 * s, by - 6 * s, 6 * s, 4 * s, 0, Math.PI, 0); inked(c, col, 1.6); }
  // head
  const hx = x + 14 * s, hy = by - 5 * s - nk * s;
  c.beginPath(); c.moveTo(x + 9 * s, by - 2 * s); c.lineTo(hx - 2 * s, hy + 2 * s); c.lineWidth = 5 * s; c.strokeStyle = col; c.stroke(); c.lineWidth = 1.2; c.strokeStyle = INK; c.stroke();
  c.beginPath(); c.ellipse(hx, hy, 4.5 * s, 3.2 * s, 0.3, 0, 7); inked(c, col, 1.6);
  if (o.trunk) { c.beginPath(); c.moveTo(hx + 3 * s, hy); c.quadraticCurveTo(hx + 8 * s, hy + 8 * s, hx + 5 * s, hy + 13 * s); c.lineWidth = 3 * s; c.strokeStyle = col; c.stroke(); c.lineWidth = 1.2; c.strokeStyle = INK; c.stroke(); }
  if (o.tusk) { c.beginPath(); c.moveTo(hx + 2 * s, hy + 2 * s); c.quadraticCurveTo(hx + 9 * s, hy + 6 * s, hx + 10 * s, hy - 1 * s); c.strokeStyle = '#f2ead8'; c.lineWidth = 2.2 * s; c.stroke(); }
  if (o.horns) { c.strokeStyle = o.horns; c.lineWidth = 1.8 * s; c.beginPath(); c.moveTo(hx - 1 * s, hy - 3 * s); c.quadraticCurveTo(hx - 4 * s, hy - 9 * s, hx + 1 * s, hy - 11 * s); c.stroke(); }
  if (o.antlers) { c.strokeStyle = '#6a4a2c'; c.lineWidth = 1.4 * s; c.beginPath(); c.moveTo(hx - 1 * s, hy - 3 * s); c.lineTo(hx - 4 * s, hy - 12 * s); c.moveTo(hx - 3 * s, hy - 8 * s); c.lineTo(hx + 2 * s, hy - 11 * s); c.moveTo(hx - 4 * s, hy - 12 * s); c.lineTo(hx - 8 * s, hy - 14 * s); c.stroke(); }
  if (o.tail !== false) { c.strokeStyle = INK; c.lineWidth = 1.6 * s; c.beginPath(); c.moveTo(x - 13 * s, by - 1 * s); c.quadraticCurveTo(x - 18 * s, by + 2 * s, x - 17 * s, by + 6 * s); c.stroke(); }
}
def('deer', (c) => quad(c, 44, 84, 1.3, '#c49a64', { antlers: true, neck: 4 }));
def('horse', (c) => quad(c, 44, 84, 1.35, '#8a5a3a', { neck: 6 }));
def('aurochs', (c) => quad(c, 44, 84, 1.45, '#4e3b30', { horns: '#e8dcc0' }));
def('mammoth', (c) => { quad(c, 42, 86, 1.8, '#7a5236', { trunk: true, tusk: true, hump: true }); hatch(c, 26, 56, 56, 56, 8, 1, 10, 1, 'rgba(60,30,10,0.5)'); });
def('antelope', (c) => quad(c, 44, 84, 1.2, '#d8b070', { horns: '#3b2b1d', neck: 5 }));
def('camel', (c) => quad(c, 44, 84, 1.35, '#c9a468', { hump: true, neck: 8 }));
def('goat', (c) => quad(c, 44, 84, 1.05, '#e8e2d2', { horns: '#6a5a4a', neck: 3 }));
def('reindeer', (c) => quad(c, 44, 84, 1.25, '#b8b0a4', { antlers: true, neck: 3 }));
def('boar', (c) => quad(c, 44, 84, 1.15, '#5a4a44', { tusk: true, neck: -2 }));
def('wolf', (c) => { quad(c, 44, 84, 1.05, '#6a6a72', { neck: 1 }); c.fillStyle = '#6a6a72'; path(c, [[56, 62], [58, 54], [61, 61]]); inked(c, '#6a6a72', 1.2); });
def('sheep', (c) => { quad(c, 44, 84, 1.0, '#f0ebde', {}); blob(c, 44, 70, 14, 8, 10, 0.25); inked(c, '#f4f0e6', 1.6); });
def('whale', (c) => { c.beginPath(); c.moveTo(18, 70); c.quadraticCurveTo(40, 52, 70, 64); c.quadraticCurveTo(80, 70, 70, 74); c.quadraticCurveTo(40, 80, 18, 70); inked(c, '#4f6a82', 2); c.beginPath(); c.moveTo(18, 70); c.lineTo(8, 60); c.lineTo(10, 72); c.lineTo(6, 80); inked(c, '#4f6a82', 1.8); c.strokeStyle = 'rgba(240,250,255,0.9)'; c.lineWidth = 2; c.beginPath(); c.moveTo(64, 58); c.quadraticCurveTo(60, 44, 54, 40); c.moveTo(64, 58); c.quadraticCurveTo(68, 44, 74, 40); c.stroke(); c.strokeStyle = 'rgba(70,110,140,0.7)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(10, 82); c.quadraticCurveTo(46, 88, 84, 80); c.stroke(); }, 0.78);
def('fish', (c) => { for (const [x, y] of [[34, 64], [56, 72], [42, 80]]) { c.beginPath(); c.ellipse(x, y, 7, 3, 0, 0, 7); inked(c, '#9ab0b8', 1.2); c.beginPath(); c.moveTo(x - 7, y); c.lineTo(x - 11, y - 3); c.lineTo(x - 11, y + 3); c.closePath(); inked(c, '#9ab0b8', 1.2); } }, 0.75);
def('birds', (c) => { c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); for (const [x, y, s] of [[30, 44, 1], [48, 36, 1.3], [62, 48, 0.9]]) { c.moveTo(x - 6 * s, y); c.quadraticCurveTo(x - 3 * s, y - 4 * s, x, y); c.quadraticCurveTo(x + 3 * s, y - 4 * s, x + 6 * s, y); } c.stroke(); }, 0.5);

/* ---------- beasts ---------- */
def('dragon', (c) => { c.save(); c.globalAlpha = 0.25; c.fillStyle = INK; c.beginPath(); c.ellipse(48, 90, 26, 4, 0, 0, 7); c.fill(); c.restore();
  for (const sd of [-1, 1]) { path(c, [[48, 48], [48 + sd * 16, 26], [48 + sd * 44, 30], [48 + sd * 34, 44], [48 + sd * 40, 54], [48 + sd * 24, 52], [48 + sd * 12, 58]], true, 0.6); inked(c, '#b3201c', 1.8); hatch(c, 48 + sd * 14, 32, 48 + sd * 36, 36, 4, sd * 2, 14, 1, 'rgba(60,10,10,0.5)'); }
  c.beginPath(); c.ellipse(48, 54, 7, 15, 0, 0, 7); inked(c, '#8e1a16', 1.8); c.beginPath(); c.moveTo(48, 68); c.quadraticCurveTo(52, 80, 44, 86); c.lineWidth = 4; c.strokeStyle = '#8e1a16'; c.stroke(); c.lineWidth = 1.2; c.strokeStyle = INK; c.stroke();
  c.beginPath(); c.ellipse(48, 37, 5, 7, 0, 0, 7); inked(c, '#8e1a16', 1.6); c.fillStyle = '#ffd24a'; c.fillRect(45, 35, 2, 2); c.fillRect(50, 35, 2, 2); }, 0.95);
def('dragonSleep', (c) => { shadow(c, 48, 84, 30, 5); c.beginPath(); c.ellipse(46, 72, 26, 12, 0, 0, 7); inked(c, '#9a221c', 2); c.beginPath(); c.moveTo(20, 74); c.quadraticCurveTo(10, 84, 26, 86); c.lineWidth = 5; c.strokeStyle = '#9a221c'; c.stroke(); c.lineWidth = 1.2; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.ellipse(72, 76, 8, 5, 0.2, 0, 7); inked(c, '#8e1a16', 1.6); for (let k = 0; k < 6; k++) { path(c, [[30 + k * 6, 62], [33 + k * 6, 55], [36 + k * 6, 62]]); inked(c, '#6a1410', 1); } c.fillStyle = '#e8b923'; for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(30 + k * 7, 86 + (k % 2) * 2, 2.5, 0, 7); c.fill(); } });
def('troll', (c) => { shadow(c, 48, 86, 16, 3); c.beginPath(); c.ellipse(48, 62, 13, 17, 0, 0, 7); inked(c, '#7a8a6a', 2); c.beginPath(); c.arc(50, 40, 8, 0, 7); inked(c, '#7a8a6a', 1.8); c.fillStyle = INK; c.fillRect(46, 38, 2, 2); c.fillRect(52, 38, 2, 2); c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.moveTo(42, 78); c.lineTo(40, 88); c.moveTo(54, 78); c.lineTo(56, 88); c.stroke(); c.strokeStyle = '#6b4a2c'; c.lineWidth = 5; c.beginPath(); c.moveTo(62, 56); c.lineTo(76, 30); c.stroke(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke(); }, 0.9);
def('griffin', (c) => { shadow(c, 48, 88, 22, 3); for (const sd of [-1, 1]) { path(c, [[48, 54], [48 + sd * 20, 30], [48 + sd * 38, 34], [48 + sd * 24, 52]], true, 0.6); inked(c, '#d8b46a', 1.6); hatch(c, 48 + sd * 20, 36, 48 + sd * 32, 38, 3, sd * 2, 10, 1); } c.beginPath(); c.ellipse(48, 62, 10, 13, 0, 0, 7); inked(c, '#c9a050', 1.8); c.beginPath(); c.arc(48, 44, 6, 0, 7); inked(c, '#efe6d2', 1.6); path(c, [[52, 44], [58, 46], [52, 48]]); inked(c, '#e8b923', 1.2); }, 0.92);
def('wyvern', (c) => { for (const sd of [-1, 1]) { path(c, [[48, 50], [48 + sd * 22, 28], [48 + sd * 40, 40], [48 + sd * 22, 54]], true, 0.6); inked(c, '#6a7a3a', 1.6); } c.beginPath(); c.ellipse(48, 56, 6, 13, 0, 0, 7); inked(c, '#4f5a2a', 1.6); c.beginPath(); c.moveTo(48, 68); c.quadraticCurveTo(56, 80, 66, 82); c.lineWidth = 3; c.strokeStyle = '#4f5a2a'; c.stroke(); path(c, [[64, 80], [72, 82], [66, 86]]); inked(c, '#c33', 1); }, 0.92);
def('greatboar', (c) => { quad(c, 44, 86, 2.1, '#3e2e28', { tusk: true, neck: -2 }); hatch(c, 26, 52, 58, 52, 9, 1, -6, 1.4, 'rgba(30,20,10,0.7)'); });
def('basilisk', (c) => { shadow(c, 48, 86, 26, 3); c.beginPath(); c.moveTo(16, 82); c.quadraticCurveTo(30, 66, 44, 78); c.quadraticCurveTo(58, 88, 70, 70); c.lineWidth = 10; c.strokeStyle = '#7a8a3a'; c.stroke(); c.lineWidth = 1.4; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.ellipse(72, 64, 8, 6, -0.4, 0, 7); inked(c, '#6a7a2a', 1.6); path(c, [[66, 58], [70, 50], [74, 58], [78, 52], [78, 60]]); inked(c, '#c03a2a', 1.2); c.fillStyle = '#ffe24a'; c.beginPath(); c.arc(75, 62, 1.8, 0, 7); c.fill(); });
def('kraken', (c) => { c.strokeStyle = 'rgba(70,110,140,0.7)'; c.lineWidth = 1.6; c.beginPath(); c.ellipse(48, 76, 38, 9, 0, 0, 7); c.stroke(); for (let k = 0; k < 6; k++) { const x = 20 + k * 11; c.beginPath(); c.moveTo(x, 78); c.quadraticCurveTo(x + j(0, 12), 52, x + (k % 2 ? 8 : -8), 40 + (k % 3) * 6); c.lineWidth = 6 - (k % 2); c.strokeStyle = '#6a3f86'; c.stroke(); c.lineWidth = 1.2; c.strokeStyle = INK; c.stroke(); } c.beginPath(); c.arc(48, 76, 10, Math.PI, 0); inked(c, '#5a2f76', 1.6); }, 0.82);
def('serpent', (c) => { c.strokeStyle = 'rgba(70,110,140,0.7)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(10, 78); c.lineTo(86, 78); c.stroke(); for (let k = 0; k < 3; k++) { const x = 22 + k * 20; c.beginPath(); c.arc(x, 78, 9, Math.PI, 0); c.lineWidth = 7; c.strokeStyle = '#3a7a6a'; c.stroke(); c.lineWidth = 1.2; c.strokeStyle = INK; c.stroke(); } c.beginPath(); c.moveTo(80, 78); c.quadraticCurveTo(82, 56, 72, 50); c.lineWidth = 7; c.strokeStyle = '#3a7a6a'; c.stroke(); c.lineWidth = 1.2; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.ellipse(70, 48, 7, 4, -0.3, 0, 7); inked(c, '#2f6a5a', 1.4); }, 0.82);
def('cave', (c) => { shadow(c, 48, 82, 24, 4); c.beginPath(); c.moveTo(18, 84); c.quadraticCurveTo(48, 30, 78, 84); inked(c, '#9a8a74', 2); c.fillStyle = '#1e1612'; c.beginPath(); c.moveTo(36, 84); c.quadraticCurveTo(48, 58, 60, 84); c.fill(); c.fillStyle = '#e8e0d0'; for (let k = 0; k < 3; k++) { c.beginPath(); c.ellipse(28 + k * 18, 86, 3, 1.5, 0.3 * k, 0, 7); c.fill(); } });
def('eyrie', (c) => { mountain(c, 50, 50, false, '#a89a86'); c.beginPath(); c.ellipse(52, 36, 12, 5, 0, 0, 7); inked(c, '#8a6a44', 1.6); hatch(c, 42, 36, 62, 36, 6, 1, 4, 1); });
def('pit', (c) => { c.beginPath(); c.ellipse(48, 76, 24, 9, 0, 0, 7); inked(c, '#c8b48a', 1.8); c.beginPath(); c.ellipse(48, 77, 14, 5, 0, 0, 7); c.fillStyle = '#2a1e16'; c.fill(); for (let k = 0; k < 4; k++) { c.fillStyle = '#efe6d2'; c.fillRect(26 + k * 13, 64 + (k % 2) * 3, 4, 2); } });
def('storm', (c) => { c.lineCap = 'round'; for (let a = 0; a < 3; a++) { c.beginPath(); for (let q = 0; q <= 30; q++) { const t = q / 30, ang = a * 2.094 + t * 3.8, r = 6 + t * 38; const x = 48 + Math.cos(ang) * r, y = 48 + Math.sin(ang) * r * 0.9; q ? c.lineTo(x, y) : c.moveTo(x, y); } c.strokeStyle = 'rgba(250,250,255,0.8)'; c.lineWidth = 7; c.stroke(); c.strokeStyle = 'rgba(70,90,110,0.55)'; c.lineWidth = 1.4; c.stroke(); } c.beginPath(); c.arc(48, 48, 5, 0, 7); c.fillStyle = 'rgba(40,60,90,0.8)'; c.fill(); }, 0.5);
def('well', (c) => { const g = c.createRadialGradient(48, 60, 2, 48, 60, 30); g.addColorStop(0, 'rgba(210,160,255,0.95)'); g.addColorStop(1, 'rgba(160,90,240,0)'); c.fillStyle = g; c.beginPath(); c.arc(48, 60, 30, 0, 7); c.fill(); for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(48 + (k - 2) * 5, 84); c.lineTo(48 + (k - 2) * 3, 30 + k * 4); c.strokeStyle = 'rgba(220,180,255,0.7)'; c.lineWidth = 1.4; c.stroke(); } path(c, [[38, 84], [42, 74], [54, 74], [58, 84]]); inked(c, '#9a8aa8', 1.6); });
def('ore', (c) => { for (const [x, y, s] of [[40, 78, 1], [54, 82, 0.8], [48, 70, 1.2]]) { path(c, [[x, y - 9 * s], [x + 5 * s, y], [x, y + 3 * s], [x - 5 * s, y]], true, 0.2); inked(c, '#d9843b', 1.4); } });
def('flag', (c, m) => { c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(40, 86); c.lineTo(40, 26); c.stroke(); both(c, m, (k, isM) => { k.beginPath(); k.moveTo(40, 28); k.quadraticCurveTo(56, 22, 70, 32); k.quadraticCurveTo(56, 38, 40, 44); k.closePath(); if (isM) { k.fillStyle = MASK; k.fill(); } else inked(k, '#c33', 1.6); }); }, 0.9);
def('star', (c) => { c.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, r = k % 2 ? 9 : 22; k ? c.lineTo(48 + Math.cos(a) * r, 52 + Math.sin(a) * r) : c.moveTo(48 + Math.cos(a) * r, 52 + Math.sin(a) * r); } c.closePath(); inked(c, '#e8b923', 2); }, 0.55);
def('artifact', (c) => { c.save(); const g = c.createRadialGradient(48, 60, 1, 48, 60, 20); g.addColorStop(0, 'rgba(255,230,140,0.9)'); g.addColorStop(1, 'rgba(255,200,80,0)'); c.fillStyle = g; c.beginPath(); c.arc(48, 60, 20, 0, 7); c.fill(); c.restore(); path(c, [[48, 48], [56, 60], [48, 72], [40, 60]]); inked(c, '#f0c85a', 1.6); }, 0.7);
def('town', (c, m) => { shadow(c, 48, 84, 22, 4); house(c, m, 36, 78, 1.0); house(c, m, 60, 80, 1.1, '#e2d6bb'); house(c, m, 48, 86, 1.25); });
def('city', (c, m) => { shadow(c, 48, 86, 30, 5); house(c, m, 26, 80, 0.95); house(c, m, 70, 80, 0.95); c.fillStyle = '#d6cdb8'; c.fillRect(38, 46, 20, 38); c.strokeStyle = INK; c.lineWidth = 1.8; c.strokeRect(38, 46, 20, 38); for (let k = 0; k < 3; k++) { c.fillRect(37 + k * 8, 40, 5, 7); c.strokeRect(37 + k * 8, 40, 5, 7); } both(c, m, (k, isM) => { path(k, [[48, 22], [60, 27], [48, 32]], true, 0.3); if (isM) { k.fillStyle = MASK; k.fill(); } else inked(k, '#c03a2a', 1.2); }); c.beginPath(); c.moveTo(48, 40); c.lineTo(48, 22); c.stroke(); house(c, m, 48, 88, 1.2); }, 0.9);
def('camp', (c, m) => { const t = (x: number, y: number, s: number) => both(c, m, (k, isM) => { k.beginPath(); k.moveTo(x - 10 * s, y); k.lineTo(x, y - 16 * s); k.lineTo(x + 10 * s, y); k.closePath(); if (isM) { k.globalAlpha = 0.7; k.fillStyle = MASK; k.fill(); } else inked(k, '#e6d9bd', 1.6); }); shadow(c, 48, 86, 22, 3); t(34, 80, 1); t(60, 82, 1.1); t(47, 88, 1.25); c.fillStyle = '#e8541c'; c.beginPath(); c.arc(48, 74, 2, 0, 7); c.fill(); });

// compass rose and sea decorations, for the map's margins
def('seamonster', (c) => { for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(26 + k * 20, 70, 8, Math.PI, 0); c.lineWidth = 5; c.strokeStyle = '#5a7a6a'; c.stroke(); c.lineWidth = 1.2; c.strokeStyle = INK; c.stroke(); } c.beginPath(); c.moveTo(76, 70); c.quadraticCurveTo(80, 50, 70, 44); c.lineWidth = 5; c.strokeStyle = '#5a7a6a'; c.stroke(); c.lineWidth = 1.2; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.ellipse(68, 42, 6, 4, -0.3, 0, 7); inked(c, '#4a6a5a', 1.4); }, 0.75);

export interface Atlas { canvas: HTMLCanvasElement; icon: (name: string, size?: number) => string }
export function paintAtlas(): Atlas {
  const cv = document.createElement('canvas'); cv.width = AW; cv.height = AH * 2;
  const c = cv.getContext('2d')!;
  const mk = document.createElement('canvas'); mk.width = CELL; mk.height = CELL; const m = mk.getContext('2d')!;
  const tmp = document.createElement('canvas'); tmp.width = CELL; tmp.height = CELL; const t = tmp.getContext('2d')!;
  LIST.forEach(([name, fn, anchor], k) => {
    SPR[name] = k; ANCHOR[k] = anchor == null ? 0.86 : anchor;
    const x = (k % COLS) * CELL, y = ((k / COLS) | 0) * CELL;
    seed = 1000 + k * 7919;
    t.clearRect(0, 0, CELL, CELL); m.clearRect(0, 0, CELL, CELL);
    t.save(); m.save(); fn(t, m, 0); t.restore(); m.restore();
    c.drawImage(tmp, x, y); c.drawImage(mk, x, y + AH);
  });
  const cache: Record<string, string> = {};
  return { canvas: cv, icon(name: string, size = 48) { const k = SPR[name]; if (k == null) return ''; const key = name + size; if (cache[key]) return cache[key]; const ic = document.createElement('canvas'); ic.width = ic.height = size; ic.getContext('2d')!.drawImage(cv, (k % COLS) * CELL, ((k / COLS) | 0) * CELL, CELL, CELL, 0, 0, size, size); return (cache[key] = ic.toDataURL()); } };
}
