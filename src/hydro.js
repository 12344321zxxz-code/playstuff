// Water finds its way down. Fill every hollow just enough to spill (priority flood), send each
// cell's runoff to its lowest neighbour, and the totals are the rivers. Hollows that collect
// enough water become lakes.
import { W, H, N, wx, Heap, hash2, NB8, clamp } from './core.js';

const heap = new Heap(N + 16), seen = new Uint8Array(N), order = new Int32Array(N);

const dn2 = new Int32Array(N), fl2 = new Float32Array(N), wat2 = new Uint8Array(N), flow2 = new Float32Array(N), riv2 = new Uint8Array(N), fresh2 = new Uint8Array(N), dSea2 = new Uint8Array(N), mass2 = new Int16Array(N);
let epoch = 0;
// As a generator, so a running game can spread the work over several ticks. Everything is worked
// out in scratch arrays; the live fields are only replaced in the last step, all at once.
export function* hydroSteps(w) {
  const my = ++epoch;
  const { h } = w, sea = w.params.sea;
  seen.fill(0); heap.clear(); let oc = 0;
  for (let i = 0; i < N; i++) { dn2[i] = -1; wat2[i] = h[i] < sea ? 1 : 0; }
  for (let y = 0; y < H; y++) {
    if (y % 64 === 63) { yield; if (my !== epoch) return; }
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (wat2[i]) {
        seen[i] = 1; fl2[i] = sea;
        const xl = x === 0 ? W - 1 : x - 1, xr = x === W - 1 ? 0 : x + 1, up = y > 0 ? -W : 0, dn = y < H - 1 ? W : 0, r = y * W;
        if (!wat2[r + xl] || !wat2[r + xr] || !wat2[i + up] || !wat2[i + dn] || !wat2[r + up + xl] || !wat2[r + up + xr] || !wat2[r + dn + xl] || !wat2[r + dn + xr]) heap.push(sea, i);
      } else if (y === 0 || y === H - 1) { seen[i] = 1; fl2[i] = h[i]; heap.push(h[i], i); }
    }
  }
  yield; if (my !== epoch) return;
  let n = 0;
  while (heap.n) {
    const c = heap.pop(), key = heap.key, x = c % W, y = (c / W) | 0; order[oc++] = c;
    for (let k = 0; k < 8; k++) {
      const yy = y + NB8[k][1]; if (yy < 0 || yy >= H) continue; const nb = yy * W + wx(x + NB8[k][0]); if (seen[nb]) continue;
      seen[nb] = 1; const f = Math.max(h[nb], key + 2e-5 * (1 + 3 * hash2(nb, c, 7))); fl2[nb] = f; dn2[nb] = c; heap.push(f, nb);
    }
    if (++n === 12000) { n = 0; yield; if (my !== epoch) return; }
  }
  yield; if (my !== epoch) return;
  flow2.fill(0);
  const { rMean, mi } = w;
  for (const sp of w.springs) flow2[sp.y * W + sp.x] += sp.q;
  for (let k = oc - 1; k >= 0; k--) {
    const c = order[k]; if (wat2[c] === 1) continue;
    const m = mi[c]; flow2[c] += rMean[c] * (0.12 + 0.88 * clamp((m - 0.15) / 1.1, 0, 1)) + 0.01;
    const d = dn2[c]; if (d >= 0) flow2[d] += flow2[c];
  }
  for (let i = 0; i < N; i++) if (!wat2[i] && fl2[i] > h[i] + 0.004 && flow2[i] > 9) wat2[i] = 2;
  // puddles are not lakes: keep only hollows a few cells across
  const q = order; seen.fill(0); let big = null;
  for (let i = 0; i < N; i++) {
    if (wat2[i] !== 2 || seen[i]) continue; let qn = 0, deep = 0; q[qn++] = i; seen[i] = 1;
    for (let hd = 0; hd < qn; hd++) { const c = q[hd], x = c % W, y = (c / W) | 0; if (fl2[c] - h[c] > deep) deep = fl2[c] - h[c];
      for (let k = 0; k < 4; k++) { const yy = y + (k === 2 ? -1 : k === 3 ? 1 : 0); if (yy < 0 || yy >= H) continue; const nb = yy * W + wx(x + (k === 0 ? 1 : k === 1 ? -1 : 0)); if (wat2[nb] === 2 && !seen[nb]) { seen[nb] = 1; q[qn++] = nb; } } }
    if (qn < 7 && deep < 0.035) for (let k = 0; k < qn; k++) wat2[q[k]] = 0;
    else if (!big || qn > big.n) big = { n: qn, x: i % W, y: (i / W) | 0 };
  }
  let rn = 0;
  for (let i = 0; i < N; i++) { if (wat2[i]) { riv2[i] = 0; continue; } const f = flow2[i]; if ((riv2[i] = f > 1500 ? 4 : f > 480 ? 3 : f > 150 ? 2 : f > 48 ? 1 : 0)) rn++; }
  yield; if (my !== epoch) return;
  // distance to fresh water (rivers, lakes) and to the sea, both capped
  let qn = 0; fresh2.fill(7);
  for (let i = 0; i < N; i++) if (riv2[i] || wat2[i] === 2) { fresh2[i] = 0; q[qn++] = i; }
  bfs(q, qn, fresh2, 7);
  yield; if (my !== epoch) return;
  qn = 0; dSea2.fill(60);
  for (let i = 0; i < N; i++) if (wat2[i] === 1) { dSea2[i] = 0; q[qn++] = i; }
  bfs(q, qn, dSea2, 60);
  yield; if (my !== epoch) return;
  // landmasses: which continent or island each land cell belongs to
  const sizes = [0]; mass2.fill(0); let id = 0;
  for (let i = 0; i < N; i++) {
    if (wat2[i] === 1 || mass2[i]) continue; id++; let cnt = 0; qn = 0; q[qn++] = i; mass2[i] = id;
    for (let hd = 0; hd < qn; hd++) { const c = q[hd], x = c % W, y = (c / W) | 0; cnt++;
      for (let k = 0; k < 8; k++) { const yy = y + NB8[k][1]; if (yy < 0 || yy >= H) continue; const m = yy * W + wx(x + NB8[k][0]); if (wat2[m] !== 1 && !mass2[m]) { mass2[m] = id; q[qn++] = m; } } }
    sizes.push(cnt);
  }
  yield; if (my !== epoch) return;
  // all at once
  w.down.set(dn2); w.filled.set(fl2); w.water.set(wat2); w.flow.set(flow2); w.river.set(riv2); w.fresh.set(fresh2); w.dSea.set(dSea2); if (w.massKinds) { const nk = {}; for (let i = 0; i < N; i += 3) { const a = mass2[i], b = w.mass[i]; if (!a || !b) continue; const o = w.massKinds[b]; if (!o) continue; const t = nk[a] || (nk[a] = []); for (const s of o) if (!t.includes(s)) t.push(s); } w.massKinds = nk; }
  w.mass.set(mass2);
  w.massSize = sizes; w.bigLake = big;
  const list = new Int32Array(rn); rn = 0; for (let i = 0; i < N; i++) if (riv2[i]) list[rn++] = i;
  w.riverList = list; w.hydroStamp = (w.hydroStamp || 0) + 1;
}
export function computeHydro(w) { for (const _ of hydroSteps(w)); }
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
