// What the page knows about the world: the latest packets from the worker, kept as they came.
import { W, H, N, CW, CH } from '../sim/core';

export interface Ents {
  sets: any[]; cults: any[]; movers: any[]; herds: any[]; packs: any[]; beasts: any[]; storms: any[]; swarms: any[]; ruins: any[]; fx: any[]; volc: any[]; figs: any[]; arts: any[]; wells: any[]; faiths: any[];
}
export interface Mirror {
  ready: boolean; seed: number; template: string; name: string;
  h: Float32Array; water: Uint8Array; river: Uint8Array; down: Int32Array; ore: Uint8Array; plate: Uint8Array; plates: any[];
  fine: Uint8Array; coarse: Uint8Array; works: Uint8Array;
  ents: Ents; regions: any[]; roads: any[]; species: any[];
  year: number; phase: number; tickN: number; tps: number; sea: number; solar: number; stats: any; frameAt: number; job: boolean;
  landStamp: number; coarseStamp: number; roadStamp: number; regStamp: number;
  cultById: Map<number, any>; setById: Map<number, any>; prevSets: Map<number, any>;
  peaks: Int32Array[];   // per level, the highest cell in each block
}
export function emptyMirror(): Mirror {
  return {
    ready: false, seed: 0, template: '', name: '',
    h: new Float32Array(N), water: new Uint8Array(N), river: new Uint8Array(N), down: new Int32Array(N), ore: new Uint8Array(N), plate: new Uint8Array(N), plates: [],
    fine: new Uint8Array(N * 12), coarse: new Uint8Array(CW * CH * 8), works: new Uint8Array(N * 4),
    ents: { sets: [], cults: [], movers: [], herds: [], packs: [], beasts: [], storms: [], swarms: [], ruins: [], fx: [], volc: [], figs: [], arts: [], wells: [], faiths: [] }, regions: [], roads: [], species: [],
    year: 0, phase: 0, tickN: 0, tps: 0, sea: 0, solar: 0, stats: {}, frameAt: 0, job: false,
    landStamp: 0, coarseStamp: 0, roadStamp: 0, regStamp: 0,
    cultById: new Map(), setById: new Map(), prevSets: new Map(), peaks: [],
  };
}
// Which cell in each 2^L block wins the right to carry a glyph. High ground first (so mountains
// sit on their peaks), then a stable random pick. Because a block's winner is also the winner
// of whichever child block holds it, each level's glyphs are a subset of the next level down:
// zooming in adds glyphs between the ones already there instead of shuffling them.
function hashf(i: number) { let h = Math.imul(i, 374761393) ^ 0x5bd1e995; h = Math.imul(h ^ (h >>> 13), 1103515245); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
export function buildPeaks(m: Mirror) {
  const prio = new Float32Array(N), sea = m.sea;
  for (let i = 0; i < N; i++) { const hh = m.h[i] - sea; prio[i] = m.water[i] ? -1 : hh > 0.2 ? 10 + hh * 10 : hashf(i); }
  m.peaks = [];
  let prev: Int32Array | null = null, pw = W, ph = H;
  for (let L = 0; L <= 5; L++) {
    const b = 1 << L, bw = Math.ceil(W / b), bh = Math.ceil(H / b), arr = new Int32Array(bw * bh);
    if (L === 0) { for (let i = 0; i < N; i++) arr[i] = i; }
    else for (let by = 0; by < bh; by++) for (let bx = 0; bx < bw; bx++) {
      let best = -1, bp = -2;
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) { const cx = bx * 2 + dx, cy = by * 2 + dy; if (cx >= pw || cy >= ph) continue; const c = prev![cy * pw + cx]; if (prio[c] > bp) { bp = prio[c]; best = c; } }
      arr[by * bw + bx] = best;
    }
    m.peaks.push(arr); prev = arr; pw = bw; ph = bh;
  }
}
