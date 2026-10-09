// The wheel of powers. Right-click (or Q) opens it where the pointer is: the inner ring holds the
// five kinds of power, the outer ring the powers of whichever kind is under the pointer. The hub
// puts the powers away and goes back to looking.
import { RINGS, TOOLS, ToolDef } from '../shared/tools';

const NS = 'http://www.w3.org/2000/svg';
export const ICON: Record<string, string> = { raise: 'mountS', lower: 'hill2', ridge: 'mount', trench: 'cave', flatten: 'tuft', smooth: 'hill', erode: 'reeds', spring: 'well', ore: 'ore', plates: 'volcano', rain: 'storm', dry: 'dune', storm: 'storm', cold: 'coniferSnow', warm: 'palm', forest: 'tree', overgrow: 'jungle', herd: 'deer', wolves: 'wolf', cull: 'deadtree', shoal: 'fish', people: 'camp', fire: 'volcanoHot', lightning: 'storm', meteor: 'star', volcano: 'volcanoHot', quake: 'ruin', wave: 'ruinDrowned', plague: 'refugees', locusts: 'birds', dragon: 'dragon', beast: 'troll', kraken: 'kraken', well: 'well', hush: 'deadtree', idea: 'tower', babel: 'ratHouse', omen: 'star', look: 'birds' };

export function createRadial(root: HTMLElement, icon: (n: string, s?: number) => string, onPick: (t: ToolDef | null) => void, sfx: (n: string) => void) {
  let open = false, ring = -1, current = '';
  const R0 = 34, R1 = 92, R2 = 98, R3 = 168;
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('width', '1'); svg.setAttribute('height', '1'); root.appendChild(svg);
  const tip = document.createElement('div'); tip.className = 'rtip'; tip.hidden = true; root.appendChild(tip);
  const arc = (r0: number, r1: number, a0: number, a1: number) => { const p = (r: number, a: number) => `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`; const big = a1 - a0 > Math.PI ? 1 : 0; return `M${p(r0, a0)}L${p(r1, a0)}A${r1},${r1} 0 ${big} 1 ${p(r1, a1)}L${p(r0, a1)}A${r0},${r0} 0 ${big} 0 ${p(r0, a0)}Z`; };
  const el = (tag: string, at: Record<string, any>, parent: Element) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, String(at[k])); parent.appendChild(e); return e; };
  let outer: SVGGElement | null = null;
  function build() {
    svg.textContent = '';
    const g = el('g', {}, svg) as SVGGElement; const n = RINGS.length, step = (Math.PI * 2) / n, start = -Math.PI / 2 - step / 2;
    RINGS.forEach((r, k) => {
      const a0 = start + k * step + 0.012, a1 = a0 + step - 0.024, w = el('g', { class: 'wedge' + (k === ring ? ' on' : '') + (TOOLS.some((t) => t.id === current && t.ring === r.id) ? ' cur' : '') }, g);
      el('path', { class: 'bg', d: arc(R0, R1, a0, a1) }, w);
      const am = (a0 + a1) / 2, tx = Math.cos(am) * (R0 + R1) / 2, ty = Math.sin(am) * (R0 + R1) / 2;
      el('rect', { x: tx - 20, y: ty - 3, width: 40, height: 3, fill: r.color, opacity: 0.7 }, w);
      const words = r.label.toUpperCase().split(' '); words.forEach((wd, q) => { const t = el('text', { x: tx, y: ty + 12 + q * 12 - (words.length - 1) * 4, 'text-anchor': 'middle', class: 'ring-lab' }, w); t.textContent = wd; });
      const ic = r.id === 'land' ? 'mountS' : r.id === 'sky' ? 'storm' : r.id === 'life' ? 'tree' : r.id === 'wrath' ? 'volcanoHot' : 'dragon';
      el('image', { href: icon(ic, 64), x: tx - 15, y: ty - 30, width: 30, height: 30 }, w);
      w.addEventListener('pointerenter', () => { if (ring !== k) { ring = k; sfx('click'); build(); } });
      w.addEventListener('click', (e) => { e.stopPropagation(); ring = k; build(); });
    });
    const hub = el('g', { class: 'look' }, g); el('circle', { r: R0 - 3, class: 'hub' }, hub); const ht = el('text', { y: 4, 'text-anchor': 'middle', class: 'hub-t' }, hub); ht.textContent = 'Look';
    hub.addEventListener('click', (e) => { e.stopPropagation(); onPick(null); close(); });
    hub.addEventListener('pointerenter', () => showTip('Put your powers away and just look.', 0));
    if (ring >= 0) {
      const tools = TOOLS.filter((t) => t.ring === RINGS[ring].id), m = tools.length, mid = start + ring * step + step / 2, span = Math.min(Math.PI * 1.25, m * 0.36), st = span / m;
      outer = el('g', {}, svg) as SVGGElement;
      tools.forEach((t, k) => {
        const a0 = mid - span / 2 + k * st + 0.01, a1 = a0 + st - 0.02, w = el('g', { class: 'wedge' + (t.id === current ? ' cur' : '') }, outer!);
        el('path', { class: 'bg', d: arc(R2, R3, a0, a1) }, w);
        const am = (a0 + a1) / 2, rr = (R2 + R3) / 2, tx = Math.cos(am) * rr, ty = Math.sin(am) * rr;
        el('image', { href: icon(ICON[t.id] || 'star', 64), x: tx - 17, y: ty - 25, width: 34, height: 34 }, w);
        const lab = el('text', { x: tx, y: ty + 21, 'text-anchor': 'middle', class: 'tool-lab' }, w); lab.textContent = t.label;
        w.addEventListener('pointerenter', () => showTip(t.hint, R3 + 12));
        w.addEventListener('click', (e) => { e.stopPropagation(); onPick(t); close(); });
      });
    }
  }
  function showTip(text: string, y: number) { tip.textContent = text; tip.style.left = '0px'; tip.style.top = (y || R1 + 10) + 'px'; tip.hidden = false; }
  function close() { if (!open) return; open = false; root.hidden = true; tip.hidden = true; }
  const outside = (e: Event) => { if (open && !(e.target as Element).closest('#radial')) close(); };
  document.addEventListener('pointerdown', outside, true);
  return {
    open(x: number, y: number, cur: string) {
      current = cur; const t = TOOLS.find((q) => q.id === cur); ring = t ? RINGS.findIndex((r) => r.id === t.ring) : -1;
      const W = window.innerWidth, H = window.innerHeight; x = Math.max(R3 + 10, Math.min(W - R3 - 10, x)); y = Math.max(R3 + 10, Math.min(H - R3 - 60, y));
      root.style.left = x + 'px'; root.style.top = y + 'px'; root.hidden = false; open = true; tip.hidden = true; build(); sfx('open');
    },
    close, get isOpen() { return open; },
  };
}
