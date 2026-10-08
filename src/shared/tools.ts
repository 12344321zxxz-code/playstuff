// The god's powers as the page sees them: names, rings, how they are used. The worker has the
// matching apply functions (sim/tools.ts); this file is shared so both sides agree on ids.
export type Ring = 'land' | 'sky' | 'life' | 'wrath' | 'other';
export interface ToolDef {
  id: string; label: string; ring: Ring;
  kind: 'brush' | 'tap' | 'stroke' | 'plates';  // brush: hold and drag; tap: one click; stroke: drag a line
  hint: string; radius?: number; small?: boolean; lens?: number; opts?: string[]; icon: string; sfx?: string;
}
export const RINGS: { id: Ring; label: string; color: string }[] = [
  { id: 'land', label: 'Land', color: '#8a6a3c' },
  { id: 'sky', label: 'Sky', color: '#4f7f9c' },
  { id: 'life', label: 'Life', color: '#5d7f3a' },
  { id: 'wrath', label: 'Wrath', color: '#a8402c' },
  { id: 'other', label: 'Other world', color: '#6c4f8e' },
];
export const TOOLS: ToolDef[] = [
  { id: 'raise', label: 'Raise', ring: 'land', kind: 'brush', icon: 'raise', sfx: 'rumble', hint: 'Hold to push the land up. Raise the sea floor far enough and an island appears.' },
  { id: 'lower', label: 'Lower', ring: 'land', kind: 'brush', icon: 'lower', sfx: 'rumble', hint: 'Hold to press the land down. Below the waterline, the sea comes in.' },
  { id: 'ridge', label: 'Ridge', ring: 'land', kind: 'stroke', icon: 'ridge', sfx: 'rumble', hint: 'Drag a line and a mountain range follows it. Watch what it does to the rain.' },
  { id: 'trench', label: 'Rift', ring: 'land', kind: 'stroke', icon: 'trench', sfx: 'rumble', hint: 'Drag a line to cut a canyon, a rift or a strait.' },
  { id: 'flatten', label: 'Level', ring: 'land', kind: 'brush', icon: 'level', sfx: 'rumble', hint: 'Hold and drag to level the ground to the height where you started.' },
  { id: 'smooth', label: 'Smooth', ring: 'land', kind: 'brush', icon: 'smooth', sfx: 'rumble', hint: 'Hold to soften rough ground.' },
  { id: 'erode', label: 'Erode', ring: 'land', kind: 'brush', icon: 'erode', sfx: 'water', hint: 'Hold to let water work: channels deepen and steep faces slump.' },
  { id: 'spring', label: 'Spring', ring: 'land', kind: 'tap', icon: 'spring', sfx: 'water', hint: 'Tap high ground to open a spring. A river starts there and finds its own way down.' },
  { id: 'ore', label: 'Ore', ring: 'land', kind: 'tap', icon: 'ore', sfx: 'chime', opts: ['Copper', 'Tin', 'Iron', 'Gold', 'Salt', 'Coal'], hint: 'Tap to bury a seam. Copper and tin make bronze; iron makes harder wars; coal, much later, makes smoke.' },
  { id: 'plates', label: 'Plates', ring: 'land', kind: 'plates', icon: 'plates', sfx: 'rumble', lens: 4, hint: 'Drag a plate’s arrow to change its drift. Tap a plate to flip it between land and sea floor.' },
  { id: 'rain', label: 'Rain', ring: 'sky', kind: 'brush', icon: 'rain', sfx: 'rain', hint: 'Hold to make a place wetter. It lasts for generations, then fades.' },
  { id: 'dry', label: 'Drought', ring: 'sky', kind: 'brush', icon: 'sun', sfx: 'wind', hint: 'Hold to take the rain away.' },
  { id: 'storm', label: 'Storm', ring: 'sky', kind: 'tap', icon: 'storm', sfx: 'thunder', radius: 4, hint: 'Tap warm sea to start a storm. The wind decides where it lands.' },
  { id: 'cold', label: 'Long winter', ring: 'sky', kind: 'tap', icon: 'snow', sfx: 'wind', radius: 10, hint: 'Tap to dim the sun for a generation. The ice comes down and the forests move.' },
  { id: 'warm', label: 'Long summer', ring: 'sky', kind: 'tap', icon: 'sunburst', sfx: 'chime', radius: 10, hint: 'Tap to warm the world for a generation. Ice retreats, deserts spread.' },
  { id: 'forest', label: 'Forest', ring: 'life', kind: 'brush', icon: 'tree', sfx: 'grow', hint: 'Drag to plant woods. They only last where the land suits them.' },
  { id: 'overgrow', label: 'Wildwood', ring: 'life', kind: 'brush', icon: 'vine', sfx: 'grow', hint: 'Hold to let the forest take everything back: fields, roads, towns.' },
  { id: 'herd', label: 'Herd', ring: 'life', kind: 'tap', icon: 'deer', sfx: 'hooves', opts: ['Whatever fits', 'Deer', 'Horses', 'Aurochs', 'Mammoths', 'Antelope', 'Camels', 'Goats', 'Reindeer', 'Boar'], hint: 'Tap land to set animals down. Put horses where there were none and see who learns to ride.' },
  { id: 'wolves', label: 'Wolves', ring: 'life', kind: 'tap', icon: 'wolf', sfx: 'howl', hint: 'Tap land to loose a pack. They keep the herds from eating the country bare.' },
  { id: 'cull', label: 'Cull', ring: 'life', kind: 'brush', icon: 'skull', sfx: 'wind', hint: 'Hold to empty a country of its animals. Hunters and herders feel it first.' },
  { id: 'shoal', label: 'Shoal', ring: 'life', kind: 'brush', icon: 'fish', sfx: 'water', hint: 'Hold over the sea to fill it with fish.' },
  { id: 'people', label: 'Wake a people', ring: 'life', kind: 'tap', icon: 'folk', sfx: 'chime', opts: ['Humans', 'Lizardfolk', 'Ratkin', 'Birdfolk', 'Wolfkin'], hint: 'Tap land to wake a new people there. What they become depends on where you put them.' },
  { id: 'fire', label: 'Fire', ring: 'wrath', kind: 'stroke', icon: 'fire', sfx: 'fire', small: true, hint: 'Set the land alight. Dry seasons carry it far.' },
  { id: 'lightning', label: 'Lightning', ring: 'wrath', kind: 'tap', icon: 'bolt', sfx: 'thunder', radius: 1.5, hint: 'Tap to strike. Dry woods catch; towns take it as a sign.' },
  { id: 'meteor', label: 'Meteor', ring: 'wrath', kind: 'tap', icon: 'meteor', sfx: 'meteor', radius: 6, hint: 'Tap to drop a star. On land it leaves a crater; at sea it sends a wave.' },
  { id: 'volcano', label: 'Volcano', ring: 'wrath', kind: 'tap', icon: 'volcano', sfx: 'boom', radius: 3, hint: 'Tap to open the ground. Lava runs downhill, ash rides the wind, and the sky dims.' },
  { id: 'quake', label: 'Quake', ring: 'wrath', kind: 'tap', icon: 'quake', sfx: 'rumble', radius: 9, hint: 'Tap to shake the ground. Near the coast, the sea answers.' },
  { id: 'wave', label: 'Wave', ring: 'wrath', kind: 'tap', icon: 'wave', sfx: 'wave', radius: 4, hint: 'Tap the sea to raise a great wave. Low coasts go under.' },
  { id: 'plague', label: 'Plague', ring: 'wrath', kind: 'tap', icon: 'plague', sfx: 'bell', radius: 8, lens: 6, hint: 'Tap a settlement to start a bad sickness. It travels with caravans, ships and refugees.' },
  { id: 'locusts', label: 'Locusts', ring: 'wrath', kind: 'tap', icon: 'locust', sfx: 'buzz', radius: 3, hint: 'Tap land to hatch a swarm. It rides the wind, eating grass and grain.' },
  { id: 'dragon', label: 'Dragon', ring: 'other', kind: 'tap', icon: 'dragon', sfx: 'roar', radius: 2, hint: 'Tap near mountains to give a dragon a home. It will find the herds, then the towns.' },
  { id: 'beast', label: 'Beast', ring: 'other', kind: 'tap', icon: 'troll', sfx: 'roar', radius: 2, opts: ['Troll', 'Griffin', 'Wyvern', 'Great boar', 'Basilisk'], hint: 'Tap to wake a legendary beast with a lair of its own. It eats what lives nearby; when that runs out, it raids.' },
  { id: 'kraken', label: 'Deep one', ring: 'other', kind: 'tap', icon: 'kraken', sfx: 'deep', radius: 5, opts: ['Kraken', 'Sea serpent'], hint: 'Tap deep sea to put something down there. Ships that pass over it do not all come home.' },
  { id: 'well', label: 'Wellspring', ring: 'other', kind: 'brush', icon: 'well', sfx: 'magic', lens: 7, hint: 'Hold to pour magic into a place. Woods there stop burning; people build towers, or keep away.' },
  { id: 'hush', label: 'Hush', ring: 'other', kind: 'brush', icon: 'hush', sfx: 'wind', lens: 7, hint: 'Hold to drain the magic out of a place for good.' },
  { id: 'idea', label: 'Idea', ring: 'other', kind: 'tap', icon: 'idea', sfx: 'magic', radius: 8, lens: 6, hint: 'Tap near a people to hand them a leap of knowledge. They can only learn what their land allows.' },
  { id: 'babel', label: 'Babel', ring: 'other', kind: 'tap', icon: 'babel', sfx: 'bell', radius: 8, lens: 6, hint: 'Tap a large people to confuse their tongues. They will not stay one people for long.' },
  { id: 'omen', label: 'Omen', ring: 'other', kind: 'tap', icon: 'eye', sfx: 'magic', radius: 6, hint: 'Tap above a town to show a sign in the sky. Priests and prophets will make of it what they will.' },
];
export const toolById = (id: string) => TOOLS.find((t) => t.id === id);

export const LENSES: [number, string][] = [[0, 'Atlas'], [6, 'Realms'], [9, 'Faiths'], [1, 'Heat'], [2, 'Rain'], [10, 'Life'], [7, 'Magic'], [5, 'Height'], [4, 'Plates']];
export const SEASONS = ['midwinter', 'late winter', 'spring', 'early summer', 'midsummer', 'late summer', 'autumn', 'early winter'];
export const SPEEDS = [0, 4, 12, 32, 96];   // ticks per second; 8 ticks a year
