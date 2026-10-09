// World templates: the shape of the land before the plates have their say, the latitudes the map
// spans, and how much of it is land. The mask is a hint, not a stencil: noise and plates still
// bend every coast, so no two worlds from one template look alike.
import { W, H, cyl } from './core';

export interface Template { id: string; name: string; blurb: string; lat: [number, number]; land: number; mask: (x: number, y: number, s: number) => number; sun?: number; rain?: number; }
const edge = (x: number, y: number) => { const u = Math.abs(2 * x / W - 1), v = Math.abs(2 * y / H - 1), r = Math.pow(u ** 3 + v ** 3, 1 / 3); return r > 0.74 ? -4 * ((r - 0.74) / 0.26) ** 1.4 : 0; };   // open sea all round, corners rounded
const blob = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) => { const dx = (x / W - cx) / rx, dy = (y / H - cy) / ry; return 1 - Math.sqrt(dx * dx + dy * dy); };

export const TEMPLATES: Template[] = [
  { id: 'continent', name: 'Old continent', blurb: 'One broad temperate land, cold north to warm south.', lat: [66, 32], land: 0.5,
    mask: (x, y, s) => 1.6 * blob(x, y, 0.5, 0.52, 0.42, 0.42) + edge(x, y) },
  { id: 'inland', name: 'Inland sea', blurb: 'Land ringed around a warm middle sea.', lat: [52, 26], land: 0.52,
    mask: (x, y, s) => 1.4 * blob(x, y, 0.5, 0.5, 0.48, 0.47) - 5 * Math.max(0, blob(x, y, 0.52, 0.55, 0.3, 0.19)) + edge(x, y) },
  { id: 'twins', name: 'Twin lands', blurb: 'Two continents across a narrow sea.', lat: [62, 30], land: 0.44,
    mask: (x, y, s) => 1.5 * Math.max(blob(x, y, 0.27, 0.48, 0.24, 0.42), blob(x, y, 0.74, 0.54, 0.24, 0.42)) - 3 * Math.max(0, 1 - Math.abs(x / W - 0.5 - 0.04 * Math.sin(y / 23)) / 0.06) + edge(x, y) },
  { id: 'isles', name: 'Archipelago', blurb: 'Warm scattered islands, a world of boats.', lat: [32, 4], land: 0.3, rain: 1.15,
    mask: (x, y, s) => 0.4 * blob(x, y, 0.5, 0.5, 0.55, 0.55) + 4 * (cyl(x, y, 1 / 22, s + 77, 3) - 0.5) + edge(x, y) },
  { id: 'north', name: 'Frozen north', blurb: 'A cold land under long winters and creeping ice.', lat: [80, 50], land: 0.5, rain: 0.8,
    mask: (x, y, s) => 1.6 * blob(x, y, 0.5, 0.55, 0.43, 0.4) + edge(x, y) },
  { id: 'dry', name: 'Sun-scorched', blurb: 'Hot and dry, life clinging to rivers and coasts.', lat: [38, 12], land: 0.55, rain: 0.42, sun: 2,
    mask: (x, y, s) => 1.6 * blob(x, y, 0.5, 0.5, 0.45, 0.42) + edge(x, y) },
];
export const templateById = (id: string) => TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
