// Generate one world per template and write a picture of each.  node tools/run.mjs test/gen.ts [seed]
import { W, H, N } from '../src/sim/core';
import { makeWorld } from '../src/sim/world';
import { TEMPLATES } from '../src/sim/templates';
// @ts-ignore
import { writePNG } from './png.mjs';
const seed = +(process.argv[2] || 7), out = process.argv[3] || '.cache';
for (const T of TEMPLATES) {
  const t0 = Date.now(), w: any = makeWorld(seed, { template: T.id, bands: 0 }), px = new Uint8Array(N * 3);
  let land = 0, ice = 0, forest = 0, desert = 0;
  for (let i = 0; i < N; i++) {
    const j = i * 3, hh = w.h[i] - w.params.sea; let r, g, b;
    if (w.water[i] === 1) { const d = Math.min(1, -hh * 3); r = 40 - d * 20; g = 90 - d * 40; b = 140 - d * 40; }
    else if (w.water[i] === 2) { r = 60; g = 120; b = 180; }
    else { land++; if (w.ice[i]) { ice++; r = g = b = 240; } else if (w.t[i] > 0.5) { forest++; r = 40; g = 110; b = 50; } else if (w.mi[i] < 0.2) { desert++; r = 220; g = 190; b = 130; } else { r = 120 + 60 * (1 - w.g[i]); g = 160; b = 80; } const x = i % W, y = (i / W) | 0, dx = w.h[y * W + Math.min(W - 1, x + 1)] - w.h[y * W + Math.max(0, x - 1)], dy = w.h[Math.min(H - 1, y + 1) * W + x] - w.h[Math.max(0, y - 1) * W + x], lit = Math.max(0.35, Math.min(1.5, 1 - (dx + dy) * 9)), el = Math.min(1, hh * 1.6); r = Math.min(255, (r + el * 60) * lit); g = Math.min(255, (g + el * 40) * lit); b = Math.min(255, (b + el * 40) * lit); }
    if (w.river[i] >= 2) { r = 50; g = 100; b = 200; }
    px[j] = r; px[j + 1] = g; px[j + 2] = b;
  }
  writePNG(`${out}/gen_${T.id}.png`, W, H, px);
  console.log(T.id.padEnd(10), 'ms', Date.now() - t0, 'land', (land / N * 100).toFixed(0) + '%', 'ice', (ice / land * 100).toFixed(0) + '%', 'forest', (forest / land * 100).toFixed(0) + '%', 'desert', (desert / land * 100).toFixed(0) + '%', 'temp range', Math.min(...Array.from(w.tMean).filter((_, i) => w.water[i] !== 1).slice(0, 1e5) as number[]).toFixed(0));
}
