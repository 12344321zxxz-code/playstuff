// The book at the side of the map: the chronicle, the legends of everything that ever had a
// name, the peoples as they stand, the almanac of things this world has produced, and the
// world itself (its sky, its kind, saving and loading).
import { Client } from './client';
import { Mirror } from './state';
import { PAGES } from '../sim/story';
import { TEMPLATES } from '../sim/templates';

const $ = (id: string) => document.getElementById(id)!;
const h = (tag: string, cls?: string, text?: string) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const RACE = ['', 'lizardfolk', 'ratkin', 'birdfolk', 'wolfkin'];
const big = (n: number) => (n >= 10000 ? Math.round(n / 1000) + ' thousand' : n >= 1000 ? (Math.round(n / 100) / 10) + ' thousand' : String(Math.round(n)));

export interface BookHost { client: Client; mirror: Mirror; fly(x: number, y: number, z?: number): void; select(ref: string | null, at?: number[] | null): void; events: any[]; newWorld(template: string, seed?: number): void; param(k: string, v: number): void; save(): void; load(key?: string): void; loadFile(): void; slots(): Promise<any[]>; sfx(n: string): void; audio: any }

// Event text with the names in it turned into links to their legends.
export function linkText(e: any, open: (ref: string) => void) {
  const span = h('span', 't'); let text: string = e.text, parts: (string | [string, string])[] = [text];
  for (const [nm, tok] of e.links || []) { const out: (string | [string, string])[] = []; let done = false; for (const p of parts) { if (done || typeof p !== 'string') { out.push(p); continue; } const k = p.indexOf(nm); if (k < 0) { out.push(p); continue; } out.push(p.slice(0, k), [nm, tok], p.slice(k + nm.length)); done = true; } parts = out; }
  if (e.color) { const c = h('span', 'chip'); c.style.background = e.color; span.appendChild(c); }
  for (const p of parts) { if (typeof p === 'string') span.appendChild(document.createTextNode(p)); else { const a = h('a', 'ln', p[0]); a.addEventListener('click', (ev) => { ev.stopPropagation(); open(p[1]); }); span.appendChild(a); } }
  return span;
}

export function createBook(host: BookHost) {
  let tab = '', legStack: string[] = [], legKind = 'peoples', chronFilter = 'all', query = '';
  const body = $('book-body'), book = $('book');
  const setTab = (t: string) => { tab = t; for (const b of document.querySelectorAll<HTMLButtonElement>('#tabs [data-tab]')) b.setAttribute('aria-pressed', String(b.dataset.tab === t)); if (!t) { book.hidden = true; return; } book.hidden = false; const cd = document.getElementById('card'); if (cd) cd.hidden = true; $('book-title').textContent = ({ chronicle: 'Chronicle', legends: 'Legends', peoples: 'Peoples', almanac: 'Almanac', world: 'The World' } as any)[t]; render(); host.sfx('page'); };
  for (const b of document.querySelectorAll<HTMLButtonElement>('#tabs [data-tab]')) b.addEventListener('click', () => setTab(tab === b.dataset.tab ? '' : b.dataset.tab!));
  $('book-close').addEventListener('click', () => setTab(''));
  const openLegend = (ref: string) => { legStack.push(ref); if (tab !== 'legends') setTab('legends'); else render(); };

  async function render() {
    body.textContent = ''; const m = host.mirror;
    if (tab === 'chronicle') {
      const seg = h('div', 'seg'); for (const [k, l] of [['all', 'Everything'], ['big', 'Headlines']]) { const b = h('button', '', l); b.setAttribute('aria-pressed', String(chronFilter === k)); b.addEventListener('click', () => { chronFilter = k; render(); }); seg.appendChild(b); } body.appendChild(seg);
      const list = h('div'); body.appendChild(list);
      const evs = host.events.filter((e) => !e.digest || true).slice().reverse().filter((e) => chronFilter === 'all' || e.big);
      if (!evs.length) list.appendChild(h('p', 'muted', 'Nothing has happened yet that anyone would write down.'));
      for (const e of evs.slice(0, 400)) list.appendChild(evRow(e));
    } else if (tab === 'legends') {
      if (legStack.length) { const ref = legStack[legStack.length - 1]; const page = await host.client.ask({ t: 'legend', ref }); if (tab !== 'legends') return; renderPage(page); return; }
      const seg = h('div', 'seg'); for (const [k, l] of [['peoples', 'Peoples'], ['places', 'Places'], ['figures', 'Figures'], ['beasts', 'Beasts'], ['artifacts', 'Treasures'], ['faiths', 'Faiths'], ['myths', 'Myths of you']]) { const b = h('button', '', l); b.setAttribute('aria-pressed', String(legKind === k)); b.addEventListener('click', () => { legKind = k; render(); }); seg.appendChild(b); } body.appendChild(seg);
      const inp = h('input', 'search') as HTMLInputElement; inp.id = 'legend-search'; inp.placeholder = 'Find a name'; inp.value = query; body.appendChild(inp);
      const list = h('div', 'lg-list'); body.appendChild(list);
      const items: any[] = (await host.client.ask({ t: 'index', kind: legKind })) || [];
      const draw = () => { list.textContent = ''; const q = query.toLowerCase(); const shown = items.filter((it) => !q || it.name.toLowerCase().includes(q)).sort((a, b) => (Number(b.alive) - Number(a.alive)) || (b.size - a.size)).slice(0, 300);
        if (!shown.length) list.appendChild(h('p', 'muted', legKind === 'myths' ? 'No one has seen you do anything yet. Use your powers where people can see.' : 'None yet.'));
        for (const it of shown) { const r = h('button', 'lg-row' + (it.alive ? '' : ' gone')); const d = h('span', 'dot'); d.style.background = it.color || 'transparent'; const nm = h('span', 'nm'); nm.append(it.name + ' '); nm.appendChild(h('i', '', it.sub || '')); r.append(d, nm, h('span', 'yr', it.year != null ? 'y' + it.year : '')); if (it.ref) r.addEventListener('click', () => openLegend(it.ref)); list.appendChild(r); } };
      inp.addEventListener('input', () => { query = inp.value; draw(); }); draw();
    } else if (tab === 'peoples') {
      const ps: any[] = (await host.client.ask({ t: 'peoples' })) || []; if (tab !== 'peoples') return;
      const st = m.stats || {}; const v = h('div', 'vitals'); for (const [n, l] of [[big(st.people || 0), 'people'], [st.peoples || 0, 'peoples'], [st.places || 0, 'places']]) { const d = h('div', 'vit'); d.append(h('div', 'n', String(n)), h('div', 'l', String(l))); v.appendChild(d); } body.appendChild(v);
      body.appendChild(spark(st.popHist || []));
      for (const p of ps) { const r = h('button', 'lg-row'); const d = h('span', 'dot'); d.style.background = p.color; const nm = h('span', 'nm'); nm.append('The ' + p.name + ' '); nm.appendChild(h('i', '', `${p.kind}${p.race ? ', ' + RACE[p.race] : ''} · ${big(p.pop)} in ${p.count} · ${p.ruler}${p.war ? ' · at war with the ' + p.war : ''}${p.faith ? ' · ' + p.faith : ''}`)); r.append(d, nm, h('span', 'yr', '')); r.addEventListener('click', () => openLegend('c' + p.id)); body.appendChild(r); }
    } else if (tab === 'almanac') {
      const data: any = (await host.client.ask({ t: 'almanac' })) || { found: {} }; if (tab !== 'almanac') return; const found = data.found || {};
      const total = PAGES.reduce((a: number, g: any) => a + g[1].length, 0), got = Object.keys(found).filter((k) => PAGES.some((g: any) => g[1].some((p: any) => p[0] === k))).length;
      body.appendChild(h('p', 'sub', `${got} of ${total} pages filled. A page fills the first time this world produces the thing. Nothing tells you how.`)); const pr = h('div', 'progress'); const pi = h('i'); pi.style.width = (got / total) * 100 + '%'; pr.appendChild(pi); body.appendChild(pr);
      for (const [title, pages] of PAGES as any) { body.appendChild(h('h4', '', title)); const g = h('div', 'alm'); for (const [id, name, say] of pages) { const f = found[id]; const p = h('div', 'page' + (f ? ' found' : ' blank')); p.appendChild(h('b', '', f ? name : '· · ·')); if (f) { p.append(say); p.appendChild(h('div', 'yr', 'Year ' + f.year)); if (f.x != null) p.addEventListener('click', () => host.fly(f.x + 0.5, f.y + 0.5, 6)); } g.appendChild(p); } body.appendChild(g); }
      if (data.god && Object.keys(data.god).length) { body.appendChild(h('h4', '', 'What they call you')); const p = h('p'); p.textContent = Object.values(data.god).join(', ') + '.'; body.appendChild(p); }
    } else if (tab === 'world') renderWorld();
  }
  function evRow(e: any) {
    const r = h('div', 'ev' + (e.big ? ' big' : '') + (e.minor ? ' minor' : '')); r.append(h('span', 'y', String(e.year)), linkText(e, openLegend));
    if (e.x != null) { r.dataset.x = '1'; r.addEventListener('click', () => host.fly(e.x + 0.5, e.y + 0.5, 6)); }
    return r;
  }
  function renderPage(p: any) {
    const back = h('button', 'back', '← back'); back.addEventListener('click', () => { legStack.pop(); render(); }); body.appendChild(back);
    if (!p) { body.appendChild(h('p', 'muted', 'Nothing is remembered about that.')); return; }
    const page = h('div', 'lg-page'); const t = h('h3'); if (p.color) { const c = h('span', 'chip'); c.style.cssText = `display:inline-block;width:12px;height:12px;border-radius:50%;margin-right:8px;background:${p.color};border:1px solid rgba(43,32,22,.5)`; t.appendChild(c); } t.append(p.title); page.appendChild(t);
    if (p.sub) page.appendChild(h('p', 'sub', p.sub));
    const lines = h('div', 'lines'); for (const l of p.lines || []) lines.appendChild(h('p', '', l)); page.appendChild(lines);
    const acts = h('div', 'row');
    if (p.at) { const b = h('button', 'btn ghost', 'Show on the map'); b.addEventListener('click', () => { host.fly(p.at[0] + 0.5, p.at[1] + 0.5, 7); host.select(p.ref, p.at); }); acts.appendChild(b); }
    if (p.nudge) for (const [how, l] of [['bless', 'Bless'], ['curse', 'Curse'], ['vision', 'Send a vision']]) { const b = h('button', 'btn ghost', l); b.addEventListener('click', async () => { const r = await host.client.ask({ t: 'nudge', id: +p.ref.slice(1), how }); host.sfx(how === 'curse' ? 'thunder' : 'magic'); (window as any).__say && (window as any).__say(r); render(); }); acts.appendChild(b); }
    if (acts.childElementCount) page.appendChild(acts);
    for (const s of p.sections || []) { page.appendChild(h('h4', '', s.title)); const it = h('div', 'items'); for (const x of s.items) { const a = h('a', 'ln', x.label); if (x.sub) a.title = x.sub; a.addEventListener('click', () => openLegend(x.ref)); it.appendChild(a); } page.appendChild(it); }
    if (p.events && p.events.length) { page.appendChild(h('h4', '', 'What is told')); for (const e of p.events.slice().reverse()) page.appendChild(evRow(e)); }
    body.appendChild(page);
  }
  let tplPick = '';
  async function renderWorld() {
    const m = host.mirror; tplPick = tplPick || m.template;
    body.appendChild(h('h4', '', 'The sky'));
    const dial = (id: string, label: string, min: number, max: number, step: number, val: number, fmt: (v: number) => string, k: string) => { const d = h('label', 'dial') as HTMLLabelElement; d.htmlFor = id; const inp = h('input') as HTMLInputElement; inp.type = 'range'; inp.id = id; inp.min = String(min); inp.max = String(max); inp.step = String(step); inp.value = String(val); const o = h('output', '', fmt(val)); inp.addEventListener('input', () => { o.textContent = fmt(+inp.value); host.param(k, +inp.value); (dialVals as any)[k] = +inp.value; }); d.append(h('span', '', label), inp, o); body.appendChild(d); };
    dial('d-sun', 'Sun', -10, 10, 0.5, dialVals.sun, (v) => (v === 0 ? 'as it is' : (v > 0 ? '+' : '') + v + '°'), 'sun');
    dial('d-tilt', 'Seasons', 0, 45, 0.5, dialVals.tilt, (v) => (v < 4 ? 'none' : v < 16 ? 'gentle' : v < 30 ? 'mild' : v < 38 ? 'harsh' : 'savage'), 'tilt');
    dial('d-sea', 'Sea level', -0.12, 0.12, 0.005, dialVals.sea, (v) => (Math.abs(v) < 0.003 ? 'as it is' : v > 0 ? 'risen' : 'fallen'), 'sea');
    dial('d-mood', 'Weather', 0, 2, 0.1, dialVals.mood, (v) => (v < 0.15 ? 'steady' : v < 0.7 ? 'mild' : v < 1.3 ? 'fickle' : 'wild'), 'mood');
    body.appendChild(h('h4', '', 'Sound'));
    const A = host.audio.vol; dial('v-music', 'Music', 0, 1, 0.05, A.music, (v) => Math.round(v * 100) + '%', '@music'); dial('v-world', 'The world', 0, 1, 0.05, A.world, (v) => Math.round(v * 100) + '%', '@world'); dial('v-fx', 'Effects', 0, 1, 0.05, A.fx, (v) => Math.round(v * 100) + '%', '@fx');
    body.appendChild(h('h4', '', 'Keep this world'));
    const row = h('div', 'row'); const sv = h('button', 'btn', 'Save'); sv.addEventListener('click', () => host.save()); const ld = h('button', 'btn ghost', 'Open a saved world'); ld.addEventListener('click', () => host.load()); const lf = h('button', 'btn ghost', 'From a file'); lf.addEventListener('click', () => host.loadFile()); row.append(sv, ld, lf); body.appendChild(row);
    const slots = await host.slots(); if (slots.length) { const l = h('div', 'lg-list'); for (const s of slots) { const r = h('button', 'lg-row'); r.append(h('span', 'dot'), h('span', 'nm', `${s.name}, year ${s.year}`), h('span', 'yr', new Date(s.at).toLocaleDateString())); r.addEventListener('click', () => host.load(s.key)); l.appendChild(r); } body.appendChild(l); }
    body.appendChild(h('h4', '', 'A new world'));
    const g = h('div', 'tpl'); for (const T of TEMPLATES) { const b = h('button'); b.setAttribute('aria-pressed', String(T.id === tplPick)); b.appendChild(h('b', '', T.name)); b.append(T.blurb); b.addEventListener('click', () => { tplPick = T.id; render(); }); g.appendChild(b); } body.appendChild(g);
    const r2 = h('div', 'row'); const mk = h('button', 'btn', 'Make it'); mk.addEventListener('click', () => host.newWorld(tplPick)); r2.append(mk, h('span', 'muted', 'This world will be gone unless you save it first.')); body.appendChild(r2);
  }
  const dialVals: any = { sun: 0, tilt: 23.5, sea: 0, mood: 1 };
  return { setTab, render, openLegend, get tab() { return tab; }, refreshChronicle() { if (tab === 'chronicle') render(); }, resetDials() { Object.assign(dialVals, { sun: 0, tilt: 23.5, sea: 0, mood: 1 }); legStack = []; } };
}
function spark(hist: number[]) {
  const c = document.createElement('canvas'); c.className = 'spark'; c.width = 800; c.height = 112; const g = c.getContext('2d')!; const n = hist.length; if (n > 1) { const mx = Math.max(...hist) || 1; g.beginPath(); hist.forEach((v, k) => { const x = (k / (n - 1)) * 800, y = 108 - (v / mx) * 100; k ? g.lineTo(x, y) : g.moveTo(x, y); }); g.strokeStyle = '#2b2016'; g.lineWidth = 2.5; g.stroke(); g.lineTo(800, 112); g.lineTo(0, 112); g.closePath(); g.fillStyle = 'rgba(168,129,47,0.18)'; g.fill(); }
  c.setAttribute('role', 'img'); c.setAttribute('aria-label', 'Everyone in the world, over time'); return c;
}
