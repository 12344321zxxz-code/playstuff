// Saving a world exactly, so Ariel can hand Claude the game he is watching and Claude can run it on
// headless. The world is a graph of plain objects, arrays, typed arrays and a couple of Maps; this
// writes it as a JSON header plus one binary block per typed array, keeping shared references.
// Nothing here knows about any particular system: new fields are saved without touching this file.
import { rng } from './core.js';
import { breach } from './spirits.js';
import { coarse } from './climate.js';

const TA = { Float32Array, Float64Array, Int8Array, Int16Array, Int32Array, Uint8Array, Uint16Array, Uint32Array, Uint8ClampedArray };
export const SAVE_VERSION = 1;

export function encodeWorld(w) {
  const ids = new Map(), bufs = []; let next = 0;
  const enc = (v) => {
    if (v === null || v === undefined) return null;
    const t = typeof v;
    if (t === 'number') return Number.isFinite(v) ? v : { $n: String(v) };
    if (t === 'string' || t === 'boolean') return v;
    if (t === 'function') return v === w.rnd || (v.s !== undefined && v.length === 0) ? { $rng: v.s } : v === breach ? { $fn: 'breach' } : null;
    if (t !== 'object') return null;
    if (ids.has(v)) return { $r: ids.get(v) };
    if (typeof v.next === 'function' && typeof v[Symbol.iterator] === 'function') return null;   // a generator in flight: settle() first
    const id = next++; ids.set(v, id);
    if (ArrayBuffer.isView(v)) { bufs.push(new Uint8Array(v.buffer, v.byteOffset, v.byteLength)); return { $i: id, $t: v.constructor.name, b: bufs.length - 1 }; }
    if (v instanceof Map) return { $i: id, $m: [...v].map(([k, x]) => [enc(k), enc(x)]) };
    if (v instanceof Set) return { $i: id, $s: [...v].map(enc) };
    if (Array.isArray(v)) return { $i: id, $a: v.map(enc) };
    const o = {}; for (const k of Object.keys(v)) { const e = enc(v[k]); if (e !== null || v[k] === null) o[k] = e; }
    return { $i: id, $o: o };
  };
  const head = JSON.stringify({ v: SAVE_VERSION, world: enc(w), clim: enc(coarse), sizes: bufs.map((b) => b.byteLength) });   // the last climate's winds live outside the world
  const hb = new TextEncoder().encode(head), pad = (n) => (n + 7) & ~7;
  let total = 8 + pad(hb.length); for (const b of bufs) total += pad(b.byteLength);
  const out = new Uint8Array(total), dv = new DataView(out.buffer);
  dv.setUint32(0, 0x464f524d); dv.setUint32(4, hb.length); out.set(hb, 8);
  let at = 8 + pad(hb.length); for (const b of bufs) { out.set(b, at); at += pad(b.byteLength); }
  return out;
}

export function decodeWorld(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (dv.getUint32(0) !== 0x464f524d) throw new Error('not a Formicarium save');
  const hl = dv.getUint32(4), pad = (n) => (n + 7) & ~7;
  const head = JSON.parse(new TextDecoder().decode(bytes.subarray(8, 8 + hl)));
  const offs = []; let at = 8 + pad(hl); for (const n of head.sizes) { offs.push(at); at += pad(n); }
  const made = new Map();
  const dec = (e) => {
    if (e === null || typeof e !== 'object') return e;
    if (e.$n) return Number(e.$n);
    if (e.$rng !== undefined) { const f = rng(0); f.s = e.$rng; return f; }
    if (e.$fn === 'breach') return breach;
    if (e.$r !== undefined) return made.get(e.$r);   // the encoder walks in the same order, so every reference is already made
    if (e.$t) { const C = TA[e.$t], n = head.sizes[e.b], src = bytes.subarray(offs[e.b], offs[e.b] + n); const copy = new Uint8Array(n); copy.set(src); const v = new C(copy.buffer); made.set(e.$i, v); return v; }
    if (e.$m) { const m = new Map(); made.set(e.$i, m); for (const [k, x] of e.$m) m.set(dec(k), dec(x)); return m; }
    if (e.$s) { const s = new Set(); made.set(e.$i, s); for (const x of e.$s) s.add(dec(x)); return s; }
    if (e.$a) { const a = []; made.set(e.$i, a); for (const x of e.$a) a.push(dec(x)); return a; }
    const o = {}; made.set(e.$i, o); for (const k in e.$o) o[k] = dec(e.$o[k]); return o;
  };
  const w = dec(head.world);
  if (head.clim) { const c = dec(head.clim); if (Array.isArray(c)) { for (let s = 0; s < 2; s++) for (const k in c[s]) coarse.out[s][k].set(c[s][k]); } else for (const k in c) { if (k === 'out') { for (let s = 0; s < 2; s++) for (const q in c.out[s]) coarse.out[s][q].set(c.out[s][q]); } else if (ArrayBuffer.isView(c[k]) && coarse[k]) coarse[k].set(c[k]); } }   // the climate solver warm-starts from these
  w.census = null; w.job = null;
  return w;
}

// gzip both ways, in the browser and in Node
export async function gzip(bytes) {
  if (typeof CompressionStream !== 'undefined') return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
  const z = await import('node:zlib'); return new Uint8Array(z.gzipSync(bytes, { level: 6 }));
}
export async function gunzip(bytes) {
  if (typeof DecompressionStream !== 'undefined') return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
  const z = await import('node:zlib'); return new Uint8Array(z.gunzipSync(bytes));
}

// The page can only hand over common file types, so a save goes out as a one-file zip (stored, since
// the world inside is already gzipped). Loading accepts the zip, a bare .formi, or raw bytes.
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
export function zipOne(name, data) {
  const nb = new TextEncoder().encode(name), crc = crc32(data), lh = 30 + nb.length, ch = 46 + nb.length, out = new Uint8Array(lh + data.length + ch + 22), dv = new DataView(out.buffer);
  dv.setUint32(0, 0x04034b50, true); dv.setUint16(4, 20, true); dv.setUint32(14, crc, true); dv.setUint32(18, data.length, true); dv.setUint32(22, data.length, true); dv.setUint16(26, nb.length, true); out.set(nb, 30); out.set(data, lh);
  const c = lh + data.length; dv.setUint32(c, 0x02014b50, true); dv.setUint16(c + 4, 20, true); dv.setUint16(c + 6, 20, true); dv.setUint32(c + 16, crc, true); dv.setUint32(c + 20, data.length, true); dv.setUint32(c + 24, data.length, true); dv.setUint16(c + 28, nb.length, true); out.set(nb, c + 46);
  const e = c + ch; dv.setUint32(e, 0x06054b50, true); dv.setUint16(e + 8, 1, true); dv.setUint16(e + 10, 1, true); dv.setUint32(e + 12, ch, true); dv.setUint32(e + 16, c, true);
  return out;
}
export async function readSave(bytes) {
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) { const dv = new DataView(bytes.buffer, bytes.byteOffset), n = dv.getUint32(18, true), nl = dv.getUint16(26, true), xl = dv.getUint16(28, true); bytes = bytes.subarray(30 + nl + xl, 30 + nl + xl + n); }
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) bytes = await gunzip(bytes);
  return decodeWorld(bytes);
}
