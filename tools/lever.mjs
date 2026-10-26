// Leverage census (magic brainstorm, round 4): river-capture saddles, isthmuses, straits and low coast per world.
//   node tools/lever.mjs
import { W, H, N, wx } from '../src/core.js';
import { makeWorld } from '../src/world.js';
for (const seed of [3, 5, 8]) {
  const w = makeWorld(seed), { h, water, down, flow, mass } = w, sea = w.params.sea;
  // outlet basin of each cell
  const out = new Int32Array(N).fill(-1);
  const find = (i) => { const path = []; let j = i, g = 0; while (out[j] < 0 && down[j] >= 0 && down[j] !== j && g++ < 4000) { path.push(j); j = down[j]; } const o = out[j] >= 0 ? out[j] : j; for (const p of path) out[p] = o; out[j] = o; return o; };
  for (let i = 0; i < N; i++) if (!water[i]) find(i);
  // basin sizes
  const bsize = new Map(); for (let i = 0; i < N; i++) if (!water[i]) bsize.set(out[i], (bsize.get(out[i]) || 0) + 1);
  // river capture: a big-river cell next to a cell draining to another big basin, divide within 0.03 height
  const caps = new Map(); let fmax = 0; for (let i = 0; i < N; i++) if (flow[i] > fmax) fmax = flow[i];
  for (let i = 0; i < N; i++) { if (water[i] || flow[i] < fmax * 0.02) continue; const x = i % W, y = (i / W) | 0;
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const yy = y + dy; if (yy < 1 || yy >= H - 1) continue; const j = yy * W + wx(x + dx); if (water[j] || out[j] === out[i]) continue;
      if (h[j] - h[i] < 0.03 && (bsize.get(out[j]) || 0) > 400 && (bsize.get(out[i]) || 0) > 400) { const k = Math.min(out[i], out[j]) + '-' + Math.max(out[i], out[j]); caps.set(k, Math.max(caps.get(k) || 0, flow[i] / fmax)); } } }
  // isthmus cells: land with ocean within 3 on both opposite sides, landmass big
  const msize = new Map(); for (let i = 0; i < N; i++) if (!water[i]) msize.set(mass[i], (msize.get(mass[i]) || 0) + 1);
  let isth = 0, strait = 0; const isMarks = [];
  for (let y = 4; y < H - 4; y++) for (let x = 0; x < W; x++) { const i = y * W + x;
    const sideW = (dx, dy, wantWater) => { for (let k = 1; k <= 3; k++) { const j = (y + dy * k) * W + wx(x + dx * k); if (wantWater ? water[j] === 1 : !water[j]) return true; } return false; };
    if (!water[i] && (msize.get(mass[i]) || 0) > 3000 && ((sideW(1,0,true) && sideW(-1,0,true)) || (sideW(0,1,true) && sideW(0,-1,true)))) isth++;
    if (water[i] === 1 && ((sideW(1,0,false) && sideW(-1,0,false)) || (sideW(0,1,false) && sideW(0,-1,false)))) strait++; }
  // low coastal land: within 0.01 of sea level
  let low = 0; for (let i = 0; i < N; i++) if (!water[i] && h[i] - sea < 0.01) low++;
  const land = [...msize.values()].reduce((a, b) => a + b, 0);
  console.log(`seed ${seed}: land ${land} cells; big basins ${[...bsize.values()].filter(v => v > 400).length}; river-capture pairs (divide < 0.03 above a big river) ${caps.size}, top shares ${[...caps.values()].sort((a,b)=>b-a).slice(0,5).map(v=>v.toFixed(2)).join(',')}; isthmus cells ${isth}; strait cells ${strait}; low coastal land ${low} cells (${(100*low/land).toFixed(1)}%)`);
}
// second pass: lowest saddles between big basins, and how near a real river they sit
for (const seed of [3, 5, 8]) {
  const w = makeWorld(seed), { h, water, down, flow } = w, sea = w.params.sea;
  const out = new Int32Array(N).fill(-1);
  const find = (i) => { const path = []; let j = i, g = 0; while (out[j] < 0 && down[j] >= 0 && down[j] !== j && g++ < 4000) { path.push(j); j = down[j]; } const o = out[j] >= 0 ? out[j] : j; for (const p of path) out[p] = o; out[j] = o; return o; };
  for (let i = 0; i < N; i++) if (!water[i]) find(i);
  const bsize = new Map(); for (let i = 0; i < N; i++) if (!water[i]) bsize.set(out[i], (bsize.get(out[i]) || 0) + 1);
  let fmax = 0; for (let i = 0; i < N; i++) if (flow[i] > fmax) fmax = flow[i];
  const sad = new Map();
  for (let i = 0; i < N; i++) { if (water[i] || (bsize.get(out[i]) || 0) < 300) continue; const x = i % W, y = (i / W) | 0; if (y < 2 || y > H - 3) continue;
    for (const [dx, dy] of [[1,0],[0,1]]) { const j = (y + dy) * W + wx(x + dx); if (water[j] || out[j] === out[i] || (bsize.get(out[j]) || 0) < 300) continue; const k = Math.min(out[i], out[j]) + '-' + Math.max(out[i], out[j]), s = Math.max(h[i], h[j]) - sea; const cur = sad.get(k); if (!cur || s < cur.s) sad.set(k, { s, i }); } }
  // river near each saddle (within 8 cells), measured as share of the biggest river
  const rows = []; for (const [k, v] of sad) { const x0 = v.i % W, y0 = (v.i / W) | 0; let best = 0, rh = 1; for (let dy = -8; dy <= 8; dy++) for (let dx = -8; dx <= 8; dx++) { const yy = y0 + dy; if (yy < 0 || yy >= H) continue; const j = yy * W + wx(x0 + dx); if (!water[j] && flow[j] / fmax > best) { best = flow[j] / fmax; rh = h[j] - sea; } } rows.push({ k, s: v.s, river: best, lift: v.s - rh }); }
  const lever = rows.filter((r) => r.river > 0.01 && r.lift < 0.04);
  console.log(`seed ${seed}: basin pairs touching ${rows.length}; saddles within 0.04 height of a river carrying >1% of the largest flow, within 8 cells: ${lever.length}; examples lift/riverShare ${lever.sort((a,b)=>b.river-a.river).slice(0,5).map(r=>r.lift.toFixed(3)+'/'+r.river.toFixed(2)).join(' ')}`);
}
