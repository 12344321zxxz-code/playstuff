// @ts-nocheck
// Faiths. They are born where something happened: a star fell, a city drowned, a wood began to
// glow, a dragon was killed. They travel with traders, sailors, refugees and conquerors, and
// they change what peoples do: who they will fight, what land they will clear, what they
// remember after a fall. Also here: the yearly maps of realms and faiths that the page draws.
import { W, H, N, CS, CW, CH, CN, wx, wrapDx, clamp } from './core';
import { ev, discover, once } from './story';
import { near } from './people';

export const FAITH_COLORS = ['#f4d35e', '#ee964b', '#9bc1bc', '#e84855', '#7fb069', '#5d5c8f', '#f2f4f3', '#b38cb4', '#3a86ff', '#c08552', '#2ec4b6', '#ff5d8f', '#8d99ae', '#a7c957', '#ffbe0b', '#6a4c93'];
export const TENET = {
  war: 'holds that the faithful must fight', peace: 'forbids raiding a neighbour who prays the same way', grove: 'forbids cutting the old woods',
  sea: 'belongs to sailors and fishermen', ancestors: 'keeps the names and the writings of the dead',
};
// what kind of place makes what kind of faith
const ORIGIN = {
  crater: { names: ['the Fallen Star', 'the Burning Stone', 'the Sky-Wound'], tenet: 'war', say: 'Where the star fell, the survivors begin to pray to it.' },
  buried: { names: ['the Mountain That Speaks', 'the Ash Mother', 'the Red Throat'], tenet: 'war', say: 'The people who watched the mountain bury their city begin to bring it gifts.' },
  drowned: { names: ['the Drowned God', 'the Hungry Tide', 'the Deep Bell'], tenet: 'sea', say: 'Fishermen who saw the city go under swear they still hear its bells. They build a shrine on the shore.' },
  grove: { names: ['the Green Mother', 'the Old Wood', 'the Shining Grove'], tenet: 'grove', say: 'Woodcutters come back from the glowing wood changed. Nobody from here cuts a tree there again.' },
  slayer: { names: ['the Wyrmslayer', 'the Skull Gate', 'the Iron Saint'], tenet: 'war', say: 'They build a temple around the dragon’s skull.' },
  dragon: { names: ['the Worm', 'the Red Sky', 'the Hoard'], tenet: 'peace', say: 'After the dragon has come for the third time, people begin to leave it offerings.' },
  haunt: { names: ['the Old Kings', 'the Ones Below', 'the Quiet Dead'], tenet: 'ancestors', say: 'People who live near the haunted ruins start to pray to whoever built them.' },
  plague: { names: ['the Pale Saint', 'the Mercy', 'the Bitter Cup'], tenet: 'peace', say: 'Among the survivors of the sickness, a new faith: the ones who lived were spared for something.' },
  wonder: { names: ['the Sun Throne', 'the High House', 'the Golden Eye'], tenet: 'ancestors', say: 'The great temple fills with priests, and the priests with ideas.' },
  city: { names: ['the Sky Father', 'the Hearth', 'the Twins', 'the Way', 'the Lamp', 'the Weaver', 'the Rain Lord', 'the Bright One'], tenet: null, say: null },
};
const MAXF = 12;
export const faithOf = (w, s) => (s && s.faith != null ? w.faiths[s.faith] : null);

export function initFaith(w) { w.faiths = []; w.realm = new Uint8Array(CN); w.faithMap = new Uint8Array(CN); w.mapStamp = 0; }
function aliveF(w) { let n = 0; for (const f of w.faiths) if (f.alive) n++; return n; }
function newFaith(w, s, kind) {
  const o = ORIGIN[kind], used = new Set(w.faiths.map((f) => f.name)), word = s.name ? s.name.replace(/^New /, '') : w.cults[s.cult].name;
  let name = o.names.find((n) => !used.has(n)) || o.names[(w.rnd() * o.names.length) | 0] + ' of ' + word; if (kind === 'city') name = o.names[(w.rnd() * o.names.length) | 0] + ' of ' + word;
  const tenets = Object.keys(TENET), tenet = o.tenet || tenets[(w.rnd() * tenets.length) | 0];
  const used2 = new Set(w.faiths.filter((f) => f.alive).map((f) => f.slot)); let slot = 0; while (used2.has(slot) && slot < 15) slot++;
  const f = { id: w.faiths.length, slot, color: FAITH_COLORS[slot], name, tenet, born: w.year, x: s.x, y: s.y, at: s.name, origin: kind, alive: true, towns: 0, peoples: 0, parent: null };
  w.faiths.push(f); return f;
}
// Something happened at (x, y). Maybe somebody nearby starts a faith about it.
export function holySite(w, x, y, kind, p) {
  if (aliveF(w) >= MAXF || w.year < 40) return null;
  const s = near(w, Math.round(x), Math.round(y), 16, null, true); if (!s || s.dead || w.rnd() > (p == null ? 0.6 : p)) return null;
  const old = faithOf(w, s); if (old && old.origin === kind && w.year - old.born < 300) return null;
  if (w.faiths.some((f) => f.alive && w.year - f.born < 150 && wrapDx(f.x - s.x) ** 2 + (f.y - s.y) ** 2 < 625)) return null;
  const f = newFaith(w, s, kind), c = w.cults[s.cult]; convert(w, s, f); if (c.faith == null) c.faith = f.id;
  const first = discover(w, 'faith', s.x, s.y);
  ev(w, `${ORIGIN[kind].say || 'A new faith.'} They call it ${f.name}.`, s.x, s.y, f.color, first ? 2 : 0);
  return f;
}
export function convert(w, s, f) { if (!s || s.dead || !f || s.faith === f.id) return; s.faith = f.id; }

// When people meet, faiths travel. `how` is 'trade', 'ship', 'conquest' or 'refugees'.
export function carry(w, from, to, how) {
  if (!from || !to || to.dead || from.faith == null || from.faith === to.faith) return;
  const f = w.faiths[from.faith]; if (!f.alive) return; const g = faithOf(w, to);
  let p = how === 'conquest' ? (f.tenet === 'war' ? 0.75 : 0.4) : how === 'ship' ? (f.tenet === 'sea' ? 0.14 : 0.06) : how === 'refugees' ? 0.12 : f.tenet === 'peace' ? 0.08 : 0.045;
  if (g) { const ct = w.cults[to.cult], state = ct.faith === g.id; p *= state ? 0.35 : 0.8; if (g.tenet === 'ancestors') p *= 0.6; } else p *= 2;
  if (w.rnd() < p) { convert(w, to, f); if (!g && once(w, 'faith-' + f.id + '-' + to.cult) && w.cults[to.cult].faith == null && to.tier >= 2) ev(w, `${f.name} reaches ${to.name}, carried by ${how === 'ship' ? 'sailors' : how === 'conquest' ? 'conquerors' : how === 'refugees' ? 'people fleeing' : 'traders'}.`, to.x, to.y, f.color, 1); }
}

// Once a year, after the census: state faiths, conversions inside a people, new faiths in old
// cities, reformations, and the two maps.
export function faithYear(w) {
  const rnd = w.rnd, tally = new Map();
  for (const f of w.faiths) { f.towns = 0; f.peoples = 0; f._pop = 0; }
  for (const s of w.sets) { if (s.dead || s.faith == null) continue; const f = w.faiths[s.faith]; if (!f.alive) { s.faith = null; continue; } f.towns++; f._pop += s.pop; const k = s.cult * 64 + s.faith; tally.set(k, (tally.get(k) || 0) + s.pop); }
  for (const c of w.cults) {
    if (!c.alive) continue; let best = null, bp = 0; for (const f of w.faiths) { const v = tally.get(c.id * 64 + f.id) || 0; if (v > bp) { bp = v; best = f; } }
    // the state faith is the biggest one; failing that, whatever the rulers already prayed to, or the capital's
    const was = c.faith, share = (f) => (c.pop > 0 && f != null ? (tally.get(c.id * 64 + f) || 0) / c.pop : 0);
    c.faith = best && bp / Math.max(1, c.pop) >= 0.25 ? best.id : was != null && w.faiths[was].alive && share(was) >= 0.08 ? was : c.big && c.big.faith != null && w.faiths[c.big.faith].alive ? c.big.faith : null;
    c.faithShare = share(c.faith); if (c.faith != null) w.faiths[c.faith].peoples++;
    if (c.faith != null && c.faith !== was && c.big && c.count >= 6) { const f = w.faiths[c.faith]; ev(w, was == null ? `The ${c.name} take up ${f.name}.` : `The ${c.name} turn from ${w.faiths[was].name} to ${f.name}.`, c.big.x, c.big.y, f.color, c.count >= 15 ? 0 : 1); if (was != null) discover(w, 'convert', c.big.x, c.big.y); }
  }
  // a people's own faith seeps out from its capital to its own towns
  for (const s of w.sets) { if (s.dead || s.nomad) continue; const c = w.cults[s.cult]; if (c.faith != null && s.faith !== c.faith && rnd() < (s.faith == null ? 0.06 : 0.02)) convert(w, s, w.faiths[c.faith]); }
  // old cities with no faith make one; old faiths split
  if (aliveF(w) < MAXF && w.year > 200 && rnd() < 0.02) { const cand = w.cults.filter((c) => c.alive && c.faith == null && c.big && !c.big.nomad && c.big.name && (c.big.tier === 3 || (c.count >= 6 && w.year > 350)) && c.big.faith == null).map((c) => c.big); if (cand.length) { const s = cand[(rnd() * cand.length) | 0], f = newFaith(w, s, 'city'); convert(w, s, f); w.cults[s.cult].faith = f.id; const first = discover(w, 'faith', s.x, s.y); ev(w, `In ${s.name}, priests of a new god: ${f.name}. Its teaching ${TENET[f.tenet]}.`, s.x, s.y, f.color, first ? 2 : 0); } }
  for (const f of w.faiths) {
    if (!f.alive) continue;
    if (f.towns === 0 && f.born < w.year) { f.alive = false; if (w.year - f.born > 60) ev(w, `Nobody prays to ${f.name} any more.`, f.x, f.y, f.color, 1); continue; }
    if (f.peoples >= 3 && w.year - f.born > 220 && aliveF(w) < MAXF && rnd() < Math.min(0.02, 0.001 * f.peoples)) reform(w, f);   // the bigger it is, the sooner it splits
  }
  maps(w);
}
function reform(w, f) {
  const cs = w.cults.filter((c) => c.alive && c.faith === f.id && c.big && c.count >= 4); if (cs.length < 2) return; const c = cs[(w.rnd() * cs.length) | 0], s = c.big;
  const nf = newFaith(w, s, 'city'); nf.name = 'the Reformed ' + f.name.replace(/^the /, ''); nf.parent = f.name; nf.tenet = f.tenet === 'war' ? 'peace' : f.tenet === 'peace' ? 'war' : f.tenet;
  for (const t of w.sets) if (t.cult === c.id && t.faith === f.id) convert(w, t, nf); c.faith = nf.id;
  ev(w, `The ${c.name} break with the old priests of ${f.name}. ${nf.name.replace(/^t/, 'T')} ${TENET[nf.tenet]}.`, s.x, s.y, nf.color, 0); discover(w, 'reform', s.x, s.y);
}
export const sameFaith = (a, b) => a.faith != null && a.faith === b.faith;
export const tenetOf = (w, c) => (c.faith != null ? w.faiths[c.faith].tenet : null);

// Realms and faiths as regions, on the coarse grid: who holds sway over each patch of land.
// Settlements push influence out around them; the strongest claim wins.
const RS = 24, FS = 16; let rScore = null, fScore = null; const land = new Float32Array(CN);
function maps(w) {
  if (!rScore) { rScore = new Float32Array(CN * RS); fScore = new Float32Array(CN * FS); }
  rScore.fill(0); fScore.fill(0); land.fill(0);
  for (let i = 0; i < N; i++) if (w.water[i] !== 1) land[((i / W / CS) | 0) * CW + (((i % W) / CS) | 0)] += 1 / (CS * CS);
  for (const s of w.sets) {
    if (s.dead || s.nomad) continue;   // the wanderers hold no borders
    const c = w.cults[s.cult], sl = c.slot % RS, f = s.faith != null ? w.faiths[s.faith] : null, fs = f && f.alive ? f.slot % FS : -1;
    const R = s.nomad ? 2.2 : 2 + Math.sqrt(s.pop) / 12, wgt = Math.sqrt(s.pop) * (s.nomad ? 0.5 : 1), cx = s.x / CS - 0.5, cy = s.y / CS - 0.5, r = Math.ceil(R);
    for (let dy = -r; dy <= r; dy++) { const y = Math.round(cy) + dy; if (y < 0 || y >= CH) continue; for (let dx = -r; dx <= r; dx++) { const x = Math.round(cx) + dx, d = Math.hypot(x - cx, y - cy); if (d >= R) continue; const i = y * CW + ((x % CW) + CW) % CW; if (land[i] < 0.3) continue; const v = wgt * (1 - d / R) * (1 - d / R); rScore[i * RS + sl] += v; if (fs >= 0) fScore[i * FS + fs] += v; } }
  }
  const realm = w.realm, fm = w.faithMap;
  for (let i = 0; i < CN; i++) {
    let b = 0, bv = 0.6; for (let k = 0; k < RS; k++) { const v = rScore[i * RS + k]; if (v > bv) { bv = v; b = k + 1; } } realm[i] = b;
    b = 0; bv = 0.6; for (let k = 0; k < FS; k++) { const v = fScore[i * FS + k]; if (v > bv) { bv = v; b = k + 1; } } fm[i] = b;
  }
  w.mapStamp++;
}
