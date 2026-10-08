// @ts-nocheck
// Saving and loading a whole world. The world is a big object full of typed arrays and of
// objects that point at each other (a caravan knows its town, a town knows its hero). On save,
// typed arrays go into one binary blob and cross-references become small {$ref} markers; on
// load, it all goes back together and the climate and rivers are worked out again.
import { setLatitudes, N } from './core';
import { templateById } from './templates';
import { computeClimate, derive } from './climate';
import { computeHydro } from './hydro';
import { seaCap } from './sea';
import { mapRegions } from './regions';

const MAGIC = 0x324d5246; // 'FRM2'
const TA = { Float32Array, Float64Array, Int32Array, Int16Array, Uint8Array, Uint16Array, Uint32Array, Int8Array };
const SKIP = new Set(['rnd', 'census', 'job', 'sgrid', 'regions', '_oreList', 'nameIx']);
// fields the climate and the rivers work out again on load, so they need not be stored
const DERIVED = { tJan: Float32Array, tJul: Float32Array, rJan: Float32Array, rJul: Float32Array, tMean: Float32Array, rMean: Float32Array, mi: Float32Array, gCap: Float32Array, tCap: Float32Array, crop: Float32Array, temp: Float32Array, rain: Float32Array, snow: Float32Array, green: Float32Array, filled: Float32Array, flow: Float32Array, down: Int32Array, water: Uint8Array, river: Uint8Array, fresh: Uint8Array, dSea: Uint8Array, mass: Int16Array, ownD: Float32Array };

export function saveWorld(w) {
  const blobs = [], canon = new Map();
  const tag = (arr, k) => arr && arr.forEach((o) => o && typeof o === 'object' && canon.set(o, k + (o.id != null ? o.id : arr.indexOf(o))));
  tag(w.sets, '$s'); tag(w.cults, '$c'); tag(w.figs, '$p'); tag(w.herds, '$h'); tag(w.faiths, '$f'); tag(w.beastLog, '$b');
  let size = 0;
  const enc = (v, holder, key) => {
    if (v == null || typeof v !== 'object') return typeof v === 'function' ? undefined : v;
    for (const n in TA) if (v instanceof TA[n]) { const off = size; blobs.push(v); size += v.byteLength; size = (size + 7) & ~7; return { $ta: n, off, len: v.length }; }
    if (v instanceof Map) return { $map: [...v.entries()].map(([k, x]) => [k, enc(x)]) };
    if (v instanceof Set) return { $set: [...v] };
    return v;
  };
  // walk once, replacing references to canonical objects outside their home arrays
  const homeOf = new Map([[w.sets, '$s'], [w.cults, '$c'], [w.figs, '$p'], [w.herds, '$h'], [w.faiths, '$f'], [w.beastLog, '$b']]);
  const seen = new Set();
  function walk(v, inHome) {
    if (v == null || typeof v !== 'object') return typeof v === 'function' ? undefined : v;
    if (!inHome && canon.has(v)) return { $ref: canon.get(v) };
    const t = enc(v); if (t !== v) return t;
    if (seen.has(v)) return null; seen.add(v);
    if (Array.isArray(v)) { const home = homeOf.has(v); return v.map((x) => walk(x, home)); }
    const o = {}; for (const k in v) { if (SKIP.has(k) || (v === w && k in DERIVED)) continue; const x = walk(v[k], false); if (x !== undefined) o[k] = x; } return o;
  }
  const json = JSON.stringify(walk(w, false)), jb = new TextEncoder().encode(json);
  const head = 12, jl = (jb.length + 7) & ~7, out = new ArrayBuffer(head + jl + size), dv = new DataView(out);
  dv.setUint32(0, MAGIC, true); dv.setUint32(4, jb.length, true); dv.setUint32(8, 2, true);
  new Uint8Array(out, head, jb.length).set(jb);
  let off = 0; for (const b of blobs) { new Uint8Array(out, head + jl + off, b.byteLength).set(new Uint8Array(b.buffer, b.byteOffset, b.byteLength)); off += b.byteLength; off = (off + 7) & ~7; }
  return out;
}

export function loadWorld(buf) {
  const dv = new DataView(buf); if (dv.getUint32(0, true) !== MAGIC) throw new Error('not a world');
  const jlen = dv.getUint32(4, true), head = 12, jl = (jlen + 7) & ~7, base = head + jl;
  const raw = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, head, jlen)));
  const dec = (v) => {
    if (v == null || typeof v !== 'object') return v;
    if (v.$ta) { const T = TA[v.$ta], src = new T(buf, base + v.off, v.len); return new T(src); }
    if (v.$map) return new Map(v.$map.map(([k, x]) => [k, dec(x)]));
    if (v.$set) return new Set(v.$set);
    if (Array.isArray(v)) { for (let k = 0; k < v.length; k++) v[k] = dec(v[k]); return v; }
    for (const k in v) v[k] = dec(v[k]); return v;
  };
  const w = dec(raw);
  const byKey = new Map(); const reg = (arr, k) => arr && arr.forEach((o, ix) => o && byKey.set(k + (o.id != null ? o.id : ix), o));
  reg(w.sets, '$s'); reg(w.cults, '$c'); reg(w.figs, '$p'); reg(w.herds, '$h'); reg(w.faiths, '$f'); reg(w.beastLog, '$b');
  const fix = (v, seen) => { if (v == null || typeof v !== 'object' || ArrayBuffer.isView(v)) return v; if (v.$ref) return byKey.get(v.$ref) || null; if (seen.has(v)) return v; seen.add(v);
    if (v instanceof Map) { for (const [k, x] of v) v.set(k, fix(x, seen)); return v; } if (Array.isArray(v)) { for (let k = 0; k < v.length; k++) v[k] = fix(v[k], seen); return v; } for (const k in v) v[k] = fix(v[k], seen); return v; };
  fix(w, new Set());
  // what was left out: the random stream, background jobs, caches
  let a = w.rs || w.seed | 1; w.rnd = function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; w.rs = a; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  w.census = null; w.job = null; w.events = []; w.fx = [];
  for (const k in DERIVED) w[k] = new DERIVED[k](N);
  const T = templateById(w.template); setLatitudes(T.lat[0], T.lat[1]);
  w.nameIx = {};
  computeHydro(w); computeClimate(w); derive(w); computeHydro(w); derive(w); seaCap(w); w.riverList = w.riverList || new Int32Array(0);
  w.regions = { nameAt: (i) => { const k = w.regAt[i]; return k >= 0 && w.regs[k] ? w.regs[k].name : null; }, refAt: (i) => { const k = w.regAt[i]; return k >= 0 && w.regs[k] ? 'g' + w.regs[k].id : null; } };
  buildGrid(w); relink(w); w.stamp.land++; w.mapStamp = (w.mapStamp || 0) + 1; w.roadStamp = (w.roadStamp || 0) + 1; w.regStamp = (w.regStamp || 0) + 1;
  return w;
}
// the name index for chronicle links is rebuilt from what exists
import { nameIt } from './story';
import { buildGrid } from './people';
function relink(w) {
  for (const c of w.cults) nameIt(w, 'c' + c.id, c.name);
  for (const s of w.sets) if (s.name) nameIt(w, 's' + s.id, s.name);
  for (const f of w.faiths || []) nameIt(w, 'f' + f.id, f.name);
  for (const b of w.beastLog || []) nameIt(w, 'b' + b.id, b.name);
  for (const f of w.figs || []) nameIt(w, 'p' + f.id, f.name);
  for (const a of w.arts || []) nameIt(w, 'a' + a.id, a.name);
  for (const r of w.regs || []) nameIt(w, 'g' + r.id, r.name);
}
