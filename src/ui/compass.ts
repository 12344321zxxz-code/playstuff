// A compass rose for the corner of the map, in the engraver's manner.
export function compassSVG() {
  const pts = (r1: number, r2: number, n: number, rot: number) => { const a: string[] = []; for (let k = 0; k < n * 2; k++) { const ang = rot + (k * Math.PI) / n - Math.PI / 2, r = k % 2 ? r2 : r1; a.push(`${(50 + Math.cos(ang) * r).toFixed(1)},${(50 + Math.sin(ang) * r).toFixed(1)}`); } return a.join(' '); };
  const half = (ang: number, r: number, w: number, dark: boolean) => { const a = ang - Math.PI / 2, tx = 50 + Math.cos(a) * r, ty = 50 + Math.sin(a) * r, sx = 50 + Math.cos(a + Math.PI / 2) * w, sy = 50 + Math.sin(a + Math.PI / 2) * w, qx = 50 + Math.cos(a - Math.PI / 2) * w, qy = 50 + Math.sin(a - Math.PI / 2) * w; return `<polygon points="50,50 ${tx.toFixed(1)},${ty.toFixed(1)} ${sx.toFixed(1)},${sy.toFixed(1)}" fill="${dark ? '#2b2016' : '#f1e7cf'}" stroke="#2b2016" stroke-width="0.8"/><polygon points="50,50 ${tx.toFixed(1)},${ty.toFixed(1)} ${qx.toFixed(1)},${qy.toFixed(1)}" fill="${dark ? '#f1e7cf' : '#2b2016'}" stroke="#2b2016" stroke-width="0.8"/>`; };
  let s = `<svg viewBox="0 0 100 100" width="92" height="92" role="img" aria-label="Compass rose">`;
  s += `<circle cx="50" cy="50" r="34" fill="rgba(241,231,207,0.75)" stroke="#2b2016" stroke-width="1"/><circle cx="50" cy="50" r="30" fill="none" stroke="#2b2016" stroke-width="0.5"/>`;
  for (let k = 0; k < 32; k++) { const a = (k * Math.PI) / 16, r0 = k % 4 ? 31 : 28; s += `<line x1="${(50 + Math.cos(a) * r0).toFixed(1)}" y1="${(50 + Math.sin(a) * r0).toFixed(1)}" x2="${(50 + Math.cos(a) * 34).toFixed(1)}" y2="${(50 + Math.sin(a) * 34).toFixed(1)}" stroke="#2b2016" stroke-width="0.6"/>`; }
  for (let k = 0; k < 4; k++) s += half(Math.PI / 4 + (k * Math.PI) / 2, 22, 4, k % 2 === 0);
  for (let k = 0; k < 4; k++) s += half((k * Math.PI) / 2, 40, 6, k % 2 === 1);
  s += `<polygon points="${pts(8, 4, 8, 0)}" fill="#8a2b1c" stroke="#2b2016" stroke-width="0.5"/><circle cx="50" cy="50" r="2.2" fill="#f1e7cf" stroke="#2b2016" stroke-width="0.6"/>`;
  s += `<text x="50" y="7" text-anchor="middle" font-family="IM Fell English SC, Georgia, serif" font-size="10" fill="#2b2016">N</text></svg>`;
  return s;
}
