// What is building toward a turn right now (a realm coming apart, the doomsday clock near midnight,
// two great realms at war). Claude's probe reads it; the clock used to slow down for it, and no longer does.
const QUIET = 16;                                  // ticks per second at the slow speed (8 ticks = a year)

// What is building toward a turn right now, strongest first.
export function tensions(w) {
  const out = [];
  for (const c of w.cults) {
    if (!c.alive || !c.big) continue;
    if (c.count >= 10 && c.coh < 0.3) out.push({ k: 'falling', s: 0.3 - c.coh + c.count / 200, text: `The ${c.name} are coming apart`, x: c.big.x, y: c.big.y, who: c.id });
    if (c.war && c.war.mine) { const f = w.cults[c.war.foe]; if (f && c.count >= 15 && f.count >= 15) out.push({ k: 'greatwar', s: 0.15 + (c.count + f.count) / 400, text: `The ${c.name} and the ${f.name} are at war`, x: c.big.x, y: c.big.y, who: c.id }); }
    if (c.hub && c.count >= 8 && (c.hub.st === 'factions' || c.hub.st === 'civil')) out.push({ k: 'strife', s: (c.hub.st === 'civil' ? 0.3 : 0.12) + c.count / 300, text: c.hub.st === 'civil' ? `The great houses of the ${c.name} are at war with each other` : `The ${c.name} have more lords than lordships`, x: c.big.x, y: c.big.y, who: c.id });
    if (c.over && c.over.kind === 'dragon' && c.over.take > 0.22) out.push({ k: 'hunger', s: 0.1 + c.over.take, text: `${c.over.d} grows hungry`, x: c.big.x, y: c.big.y, who: c.id });
    if (c.leaving) out.push({ k: 'exodus', s: 0.3, text: `The ${c.name} are leaving the world`, x: c.big.x, y: c.big.y, who: c.id });
  }
  // a well between nearly full and breaking point (one far past it is stuck, a slice-5 fix, not a story)
  for (const q of w.wells || []) { const cap = q.cap || 40; if ((q.fill || 0) > cap * 0.8 && q.fill <= cap) out.push({ k: 'well', s: 0.12 + (q.fill / cap - 0.8), text: `${q.name || 'A wellspring'} is close to bursting`, x: q.x, y: q.y }); }
  if (w.clock != null && w.clock <= 5 && w.stats.clock && w.stats.clock !== '—') out.push({ k: 'clock', s: 0.4, text: `The doomsday clock stands at ${w.stats.clock}`, x: null, y: null });
  if (w.darkUntil > w.year) out.push({ k: 'dark', s: 0.05, text: 'A dark age', x: null, y: null });
  return out.sort((a, b) => b.s - a.s);
}

// state kept by the page between frames (the clock no longer slows itself, Oct 29: time runs at the speed chosen)
export function makeWatch() { return { banner: null, top: null }; }
export function watchRate() { return QUIET; }
