// The chronicle (things that happened) and the almanac (kinds of thing this world has produced).
// true the first time anything asks about `key` in this world
export const once = (w, key) => (w.onces[key] ? false : (w.onces[key] = true));
// level: 0 or nothing = worth a line; 1 or true = small (only one is kept every few years); 2 = a headline
export function ev(w, text, x, y, color, level) {
  if (level && level !== 2) { if (w.year - (w.lastMinor || -99) < 9) return; w.lastMinor = w.year; }
  w.events.push({ year: w.year, text, x, y, color: color || null, big: level === 2 });
}

// Almanac pages. They start blank; a page is filled in the first time the world produces the
// thing, with the year and the place. Nothing tells you how to cause one.
export const PAGES = [
  ['Land and sky', [
    ['shadow', 'Rain shadow', 'A range took the rain; the far side went to dust.'],
    ['delta', 'Delta', 'A river carried enough mud to build new land at its mouth.'],
    ['lake', 'Great lake', 'A hollow filled until it became an inland sea.'],
    ['island', 'New island', 'Land stood up out of open water.'],
    ['strait', 'Drowned land', 'The sea came in over ground that used to be dry.'],
    ['cold', 'Cold age', 'The sun dimmed a little for a few generations, and everything moved toward the equator.'],
    ['warm', 'Warm age', 'A few generations of long summers.'],
    ['iceage', 'Ice age', 'The ice came down from the poles and stayed.'],
    ['thaw', 'Great thaw', 'The ice let go and the seas rose.'],
    ['monsoon', 'Monsoon', 'Half the year parched, half the year drowned.'],
    ['megafire', 'Great fire', 'A dry season and a spark took a whole country.'],
    ['winter', 'Year without a summer', 'Ash in the sky dimmed the sun.'],
    ['eruption', 'Eruption', 'A mountain opened.'],
    ['storm', 'Great storm', 'A storm off the warm sea came ashore.'],
    ['quake', 'Earthquake', 'The ground itself moved.'],
    ['wave', 'Great wave', 'The sea drew back, then came in.'],
    ['crater', 'Star scar', 'A hole where a star fell.'],
    ['desert', 'Sand sea', 'A desert the size of a country.'],
    ['bridge', 'Land bridge', 'The sea fell and two lands touched.'],
    ['drought', 'Great drought', 'The rains stayed away for years and a town went hungry.'],
    ['dust', 'Worn-out land', 'Fields farmed until the soil gave up.'],
  ]],
  ['Living things', [
    ['primeval', 'Forest primeval', 'Woods so wide that most of the land is under leaves.'],
    ['herds', 'Great herds', 'Grazers past counting.'],
    ['lost', 'Extinction', 'A kind of animal is gone from the world for good.'],
    ['nopred', 'No more hunters', 'The last pack is gone; nothing checks the herds.'],
    ['oddity', 'Island oddity', 'Cut off on an island, a beast turned strange.'],
    ['enchanted', 'Enchanted wood', 'An old forest soaked in something that is not rain.'],
    ['dragon', 'Dragon', 'Something large took a mountain for itself.'],
    ['hoard', 'Dragon hoard', 'A worm grown fat on a hundred years of plunder.'],
    ['kraken', 'Deep one', 'Ships that cross this water do not all come back.'],
    ['locusts', 'Swarm', 'After the rains came back, so did something else.'],
    ['nets', 'Empty nets', 'A sea fished until there was nothing left to catch.'],
    ['boom', 'Boom and crash', 'Too many grazers, then bare ground, then bones.'],
  ]],
  ['Peoples', [
    ['village', 'First village', 'Wanderers stopped wandering.'],
    ['city', 'First city', 'More people in one place than anyone can know by name.'],
    ['river', 'River kingdom', 'A people fed by a flood that comes every year.'],
    ['riders', 'Horse lords', 'A people who live in the saddle.'],
    ['sea', 'Sea people', 'A people who think of water as a road.'],
    ['herders', 'Herders', 'A people who follow their animals.'],
    ['bronze', 'Bronze', 'Two metals from two places, and a people who got hold of both.'],
    ['iron', 'Iron', 'A harder metal, and harder wars.'],
    ['empire', 'Empire', 'One banner over many peoples.'],
    ['darkage', 'Dark age', 'A people forgot what their grandparents knew.'],
    ['schism', 'Schism', 'One people became two.'],
    ['plague', 'Plague', 'A sickness that travelled the roads.'],
    ['wonder', 'Wonder', 'A people piled stone on stone for no reason but pride.'],
    ['oversea', 'New world', 'A people crossed open ocean and found land.'],
    ['smoke', 'Age of smoke', 'A people learned to burn the ground itself.'],
    ['slayer', 'Dragonslayers', 'A city killed the thing in the mountain.'],
    ['tower', 'Wizard tower', 'Someone built where the magic pools.'],
    ['ward', 'Warded town', 'The dragon came, looked at the tower, and left.'],
    ['faith', 'First faith', 'Something happened, and people began to pray about it.'],
    ['convert', 'Conversion', 'A whole people turned from one god to another.'],
    ['holywar', 'Holy war', 'A war fought over whose god is real.'],
    ['reform', 'Reformation', 'An old faith broke in two.'],
    ['rainmaker', 'Rainmakers', 'A tower called the rain, and it came.'],
    ['war', 'Great war', 'Two large peoples, and not enough room.'],
    ['horde', 'Horde', 'Every rider of the grass, under one name.'],
    ['trade', 'Sea road', 'Ships that carry goods, ideas and sickness between shores.'],
    ['fall', 'The Fall', 'The world held far fewer people than it once had.'],
    ['gone', 'Vanished people', 'A people with a name and a history, and now neither.'],
  ]],
  ['Ruins', [
    ['ruin', 'Lost city', 'Empty streets, slowly going back to earth.'],
    ['drowned', 'Drowned city', 'Roofs under the water. Fish like it.'],
    ['buried', 'Buried city', 'Ash kept everything as it was on the last day.'],
    ['overgrown', 'Swallowed city', 'The forest took it back.'],
    ['frozen', 'City under ice', 'The ice closed over it.'],
    ['reborn', 'City on a city', 'New walls on old foundations.'],
    ['relic', 'Old knowledge', 'Someone dug in a ruin and learned something.'],
    ['haunt', 'Haunted ruin', 'Nobody goes there. Something does.'],
    ['curse', 'Curse', 'Diggers opened a haunted place and brought something home.'],
  ]],
];
export function discover(w, id, x, y) {
  if (w.found[id]) return false;
  w.found[id] = { year: w.year, x, y }; w.foundNew = true;
  let name = id; for (const g of PAGES) for (const p of g[1]) if (p[0] === id) name = p[1];
  w.events.push({ year: w.year, text: `Almanac: ${name}.`, x, y, color: null, page: id });
  return true;
}
export const pageCount = () => PAGES.reduce((a, g) => a + g[1].length, 0);
