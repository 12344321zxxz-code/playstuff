// Little pixel-art pictures for the things that stand on the map. Each is a grid of letters;
// 'c' and 'd' take the owner's colour (and a darker shade of it). Drawn once per colour into a
// tiny canvas, then scaled up by whole numbers with smoothing off, so they stay crisp.
const PAL = { k: '#1b1714', w: '#ece0c4', W: '#c9b892', r: '#8f4a2c', g: '#aaa49a', G: '#6c665e', y: '#f2c230', o: '#ff7a1a', R: '#c4352a', b: '#7a5232', B: '#4f3520', s: '#f4efe2', p: '#9a62e0', P: '#4b2a6e', u: '#5aa7d6', U: '#2f6a9a', f: '#ffd24a', n: '#3a8a3a', e: '#e8e8ea', x: '#5a5a62' };
export const SPR = {
  hut: ['..kkk..', '.kccck.', 'kccccck', '.kwwwk.', '.kwkwk.', '.kkkkk.'],
  village: ['...kkk.....', '..kccck.kk.', '.kccccckcck', '..kwwwkkcck', '..kwkwk.kwk', '..kkkkk.kkk'],
  town: ['....kk.....', '...kcck....', '..kccccckk.', '.kwwwwkccck', '.kwkwwkwwk.', '.kwwwwkwkk.', '.kkkkkkkk..'],
  city: ['....k......', '....kcc....', '....k......', 'k.k.k.k.k..', 'kgkgkgkgk..', 'kgggggggk..', 'kgkgggkgkkk', 'kgggggggkck', 'kggkkkggkwk', 'kkkkkkkkkkk'],
  walls: ['k.k.k.k.k.k.k', 'kgggggggggggk', 'kg.........gk', 'kg.........gk', 'kgggggggggggk', 'kkkkkkkkkkkkk'],
  camp: ['...k...', '..kck..', '.kccck.', 'kcckcck', 'kkkkkkk'],
  ruin: ['k.....k..', 'kk....kk.', 'gk.k..gk.', 'gk.kk.gk.', 'gkgGk.gk.', 'GgGgGkgGk', 'kkkkkkkkk'],
  ruinW: ['u.k...k.u', 'uukk.kkuu', 'UuGk.GkuU', 'uUuUuUuUu'],
  tower: ['...p...', '..ppp..', '.ppppp.', '..kPk..', '..PfP..', '..PPP..', '..PfP..', '.kPPPk.', '.kkkkk.'],
  wonder: ['....y....', '...yyy...', '..yyWyy..', '.yyWWWyy.', 'yyWWWWWyy', 'kkkkkkkkk'],
  volcano: ['...kk...', '..kGGk..', '.kGGGGk.', 'kGGGGGGk', 'kkkkkkkk'],
  volcanoHot: ['..o.o...', '...oo...', '..kook..', '.kGooGk.', 'kGGoGGGk', 'kkkkkkkk'],
  ore: ['.k.', 'kyk', '.k.'],
  ship: ['...k...', '...ss..', '...sss.', '...ssc.', 'kkkkkkk', '.kbbbk.'],
  boat: ['..k..', '..ss.', 'kkkkk', '.kbk.'],
  caravan: ['..kkk...', '.kwwwk..', 'kbbbbbkk', '.k...kbk', '.k...k..'],
  army: ['.k.....', '.kcc...', '.kc....', '.k.k.k.', 'kckckck', 'kckckck', '.k.k.k.'],
  settlers: ['.kk....', 'kwwk...', 'kbbbbk.', '.k..k..'],
  refugees: ['.k.k.k', 'kxkxkx', '.k.k.k'],
  dragon: ['R.......R', 'RR.....RR', 'RRR.R.RRR', '.RRRRRRR.', '...RkR...', '....R....', '....R....'],
  dragonSleep: ['...........', '..RRRRR....', '.RRRRRRRRk.', 'RRRRRRRRRRk', 'yyyyyyyyyyy'],
  kraken: ['p.p.p.p.p', 'pPpPpPpPp', '.PpppppP.', '..PPPPP..'],
  lair: ['..kkkk..', '.kGGGGk.', 'kGkkkkGk', 'kGk..kGk', 'kkk..kkk'],
};
const cache = new Map();
function shade(hex, k) { const n = parseInt(hex.slice(1), 16); return `rgb(${((n >> 16) & 255) * k | 0},${((n >> 8) & 255) * k | 0},${(n & 255) * k | 0})`; }
export function sprite(name, tint) {
  const key = name + (tint || ''); let c = cache.get(key); if (c) return c;
  const rows = SPR[name], w = Math.max(...rows.map((r) => r.length)), h = rows.length;
  c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  rows.forEach((r, y) => { for (let i = 0; i < r.length; i++) { const ch = r[i]; if (ch === '.') continue; x.fillStyle = ch === 'c' ? tint || '#c44' : ch === 'd' ? shade(tint || '#c44', 0.65) : PAL[ch] || '#f0f'; x.fillRect(i, y, 1, 1); } });
  cache.set(key, c); return c;
}
// draw with its bottom-centre at (sx, sy) in device pixels, `scale` screen pixels per sprite pixel
export function blit(ctx, name, sx, sy, scale, tint, flip) {
  const c = sprite(name, tint), w = c.width * scale, h = c.height * scale, x = Math.round(sx - w / 2), y = Math.round(sy - h);
  ctx.imageSmoothingEnabled = false;
  if (flip) { ctx.save(); ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(c, 0, 0, w, h); ctx.restore(); } else ctx.drawImage(c, x, y, w, h);
  return h;
}
// how many screen pixels per sprite pixel at this zoom: about a third of a cell, at least 1
export const pixScale = (z, dpr, k = 1) => Math.max(1, Math.round((z * dpr * k) / 3.2));
