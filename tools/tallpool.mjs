// (Nov 2, play tall) Who reaches each age first: the biggest realm, or a smaller one; and does a smaller leader last?
//   node tools/tallpool.mjs dir/*.json
import { readFileSync } from 'node:fs';
const rs = []; for (const f of process.argv.slice(2)) { try { const r = JSON.parse(readFileSync(f, 'utf8').trim().split('\n').pop()); if (r.firstTo) rs.push(r); } catch {} }
console.log(`${rs.length} worlds\nage  n  biggest-first  median rank  median share  small leader lasts 100y  peers near (median)`);
for (let t = 4; t <= 8; t++) { const F = rs.map((r) => r.firstTo[t]).filter(Boolean); if (!F.length) continue; const med = (a) => { a = a.slice().sort((x, y) => x - y); return a[a.length >> 1]; };
  const small = F.filter((f) => f.rank > 1 && f.alive100 != null);
  console.log(`${t}    ${String(F.length).padStart(2)}  ${(F.filter((f) => f.rank === 1).length / F.length).toFixed(2).padStart(5)}          ${String(med(F.map((f) => f.rank))).padStart(3)}          ${med(F.map((f) => f.share)).toFixed(2)}          ${small.length ? (small.filter((f) => f.alive100).length + '/' + small.length).padStart(5) : '   -'}                   ${med(F.map((f) => f.peers))}`); }
console.log('per world (seed: rank at ages 4..8):', rs.map((r) => r.seed + ':' + [4, 5, 6, 7, 8].map((t) => (r.firstTo[t] ? r.firstTo[t].rank : '-')).join('/')).join('  '));
