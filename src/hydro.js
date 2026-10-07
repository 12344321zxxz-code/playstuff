// Water finds its way down. Fill every hollow just enough to spill (priority flood), send each
// cell's runoff to its lowest neighbour, and the totals are the rivers. Hollows that collect
// enough water become lakes.
import { W, H, N, wx, Heap, hash2, NB8, clamp } from './core.js';

const heap = new Heap(N + 16), seen = new Uint8Array(N), order = new Int32Array(N);

export function computeHydro(w) {
  const { h, down, flow, water, river, filled, fresh, dSea } = w, sea = w.params.sea;
  seen.fill(0); heap.clear(); let oc = 0;
  for (let i = 0; i < N; i++) { down[i] = -1; river[i] = 0; water[i] = h[i] < sea ? 1 : 0; }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (water[i]) {
      seen[i] = 1; filled[i] = sea;
      let coast = false;
      for (let k = 0; k < 8 && !coast; k++) { const yy = y + NB8[k][1]; if (yy < 0 || yy >= H) continue; if (h[yy * W + wx(x + NB8[k][0])] >= sea) coast = true; }
      if (coast) heap.push(sea, i);
    } else if (y === 0 || y === H - 1) { seen[i] = 1; filled[i] = h[i]; heap.push(h[i], i); }
  }
  while (heap.n) {
    const c = heap.pop(), key = heap.key, x = c % W, y = (c / W) | 0; order[oc++] = c;
    for (let k = 0; k < 8; k++) {
      const yy = y + NB8[k][1]; if (yy < 0 || yy >= H) continue; const n = yy * W + wx(x + NB8[k][0]); if (seen[n]) continue;
      seen[n] = 1; const f = Math.max(h[n], key + 2e-5 * (1 + 3 * hash2(n, c, 7))); filled[n] = f; down[n] = c; heap.push(f, n);
    }
  }
  flow.fill(0);
  const { rMean, mi } = w;
  for (const sp of w.springs) flow[sp.y * W + sp.x] += sp.q;
  for (let k = oc - 1; k >= 0; k--) {
    const c = order[k]; if (water[c] === 1) continue;
    const m = mi[c]; flow[c] += rMean[c] * (0.12 + 0.88 * clamp((m - 0.15) / 1.1, 0, 1)) + 0.01;
    const d = down[c]; if (d >= 0) flow[d] += flow[c];
  }
  for (let i = 0; i < N; i++) {
    if (water[i]) continue;
    if (filled[i] > h[i] + 0.004 && flow[i] > 9) water[i] = 2;
  }
  // puddles are not lakes: keep only hollows a few cells across
  const q0 = order; seen.fill(0); let big = null;
  for (let i = 0; i < N; i++) {
    if (water[i] !== 2 || seen[i]) continue; let qn = 0, deep = 0; q0[qn++] = i; seen[i] = 1;
    for (let hd = 0; hd < qn; hd++) { const c = q0[hd], x = c % W, y = (c / W) | 0; if (filled[c] - h[c] > deep) deep = filled[c] - h[c];
      for (let k = 0; k < 4; k++) { const yy = y + (k === 2 ? -1 : k === 3 ? 1 : 0); if (yy < 0 || yy >= H) continue; const n = yy * W + wx(x + (k === 0 ? 1 : k === 1 ? -1 : 0)); if (water[n] === 2 && !seen[n]) { seen[n] = 1; q0[qn++] = n; } } }
    if (qn < 7 && deep < 0.035) for (let k = 0; k < qn; k++) water[q0[k]] = 0;
    else if (!big || qn > big.n) big = { n: qn, x: i % W, y: (i / W) | 0 };
  }
  w.bigLake = big;
  for (let i = 0; i < N; i++) { if (water[i]) continue; const f = flow[i]; river[i] = f > 1500 ? 4 : f > 480 ? 3 : f > 150 ? 2 : f > 48 ? 1 : 0; }
  // distance to fresh water (rivers, lakes) and to the sea, both capped
  const q = order; let qn = 0; fresh.fill(7);
  for (let i = 0; i < N; i++) if (river[i] || water[i] === 2) { fresh[i] = 0; q[qn++] = i; }
  bfs(q, qn, fresh, 7);
  qn = 0; dSea.fill(60);
  for (let i = 0; i < N; i++) if (water[i] === 1) { dSea[i] = 0; q[qn++] = i; }
  bfs(q, qn, dSea, 60);
  // landmasses: which continent or island each land cell belongs to
  const mass = w.mass, sizes = [0]; mass.fill(0); let id = 0;
  for (let i = 0; i < N; i++) {
    if (water[i] === 1 || mass[i]) continue; id++; let n = 0; qn = 0; q[qn++] = i; mass[i] = id;
    for (let hd = 0; hd < qn; hd++) { const c = q[hd], x = c % W, y = (c / W) | 0; n++;
      for (let k = 0; k < 8; k++) { const yy = y + NB8[k][1]; if (yy < 0 || yy >= H) continue; const m = yy * W + wx(x + NB8[k][0]); if (water[m] !== 1 && !mass[m]) { mass[m] = id; q[qn++] = m; } } }
    sizes.push(n);
  }
  w.massSize = sizes;
  // list of river cells for drawing
  let rn = 0; for (let i = 0; i < N; i++) if (river[i]) rn++;
  const list = new Int32Array(rn); rn = 0; for (let i = 0; i < N; i++) if (river[i]) list[rn++] = i;
  w.riverList = list; w.hydroStamp = (w.hydroStamp || 0) + 1;
}
function bfs(q, qn, d, cap) {
  for (let hd = 0; hd < qn; hd++) {
    const c = q[hd], nd = d[c] + 1; if (nd >= cap) continue; const x = c % W, y = (c / W) | 0;
    for (let k = 0; k < 4; k++) { const yy = y + (k === 2 ? -1 : k === 3 ? 1 : 0); if (yy < 0 || yy >= H) continue; const n = yy * W + wx(x + (k === 0 ? 1 : k === 1 ? -1 : 0)); if (d[n] > nd) { d[n] = nd; q[qn++] = n; } }
  }
}

// Rivers cut down, slopes slump, and the mud ends up at the river mouth. Called now and then,
// so over centuries valleys deepen and deltas creep out to sea.
export function erode(w, amount) {
  const { h, down, flow, water, river, soil } = w, sea = w.params.sea;
  for (let i = 0; i < N; i++) {
    const lv = river[i]; if (!lv) continue; const d = down[i]; if (d < 0) continue;
    const drop = h[i] - h[d]; if (drop <= 0) continue;
    const cut = Math.min(drop * 0.5, amount * lv * (0.3 + drop * 6));
    h[i] -= cut;
    if (water[d] === 1 && lv >= 2) { h[d] = Math.min(sea + 0.004, h[d] + cut * 6 + amount * lv * 0.6); if (h[d] >= sea) { soil[d] = 1.3; w.deltaAt = d; } }
  }
}
