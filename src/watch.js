// The Watchful clock: time runs at about two years a second while nothing much is happening, one
// year a second while something is building toward a turn (a realm coming apart, a well near
// bursting, the doomsday clock near midnight, two great realms at war), and slows to a crawl for
// a few seconds when a turn arrives, with a banner. It only steers the clock and offers the camera;
// it never changes what happens. Pure reads of the world.
const QUIET = 16, TENSE = 8, CRAWL = 2;           // ticks per second (8 ticks = a year)
const CRAWL_MS = 15000, GAP_MS = 150000;           // a slowdown lasts 15 s, at most one every 2.5 min

// What is building toward a turn right now, strongest first.
export function tensions(w) {
  const out = [];
  for (const c of w.cults) {
    if (!c.alive || !c.big) continue;
    if (c.count >= 10 && c.coh < 0.3) out.push({ k: 'falling', s: 0.3 - c.coh + c.count / 200, text: `The ${c.name} are coming apart`, x: c.big.x, y: c.big.y, who: c.id });
    if (c.war && c.war.mine) { const f = w.cults[c.war.foe]; if (f && c.count >= 15 && f.count >= 15) out.push({ k: 'greatwar', s: 0.15 + (c.count + f.count) / 400, text: `The ${c.name} and the ${f.name} are at war`, x: c.big.x, y: c.big.y, who: c.id }); }
    if (c.hub && c.count >= 8 && (c.hub.st === 'factions' || c.hub.st === 'civil')) out.push({ k: 'strife', s: (c.hub.st === 'civil' ? 0.3 : 0.12) + c.count / 300, text: c.hub.st === 'civil' ? `The great houses of the ${c.name} are at war with each other` : `The ${c.name} have more lords than lordships`, x: c.big.x, y: c.big.y, who: c.id });
    if (c.leaving) out.push({ k: 'exodus', s: 0.3, text: `The ${c.name} are leaving the world`, x: c.big.x, y: c.big.y, who: c.id });
  }
  // a well between nearly full and breaking point (one far past it is stuck, a slice-5 fix, not a story)
  for (const q of w.wells || []) { const cap = q.cap || 40; if ((q.fill || 0) > cap * 0.8 && q.fill <= cap) out.push({ k: 'well', s: 0.12 + (q.fill / cap - 0.8), text: `${q.name || 'A wellspring'} is close to bursting`, x: q.x, y: q.y }); }
  if (w.clock != null && w.clock <= 5 && w.stats.clock && w.stats.clock !== '—') out.push({ k: 'clock', s: 0.4, text: `The doomsday clock stands at ${w.stats.clock}`, x: null, y: null });
  if (w.darkUntil > w.year) out.push({ k: 'dark', s: 0.05, text: 'A dark age', x: null, y: null });
  return out.sort((a, b) => b.s - a.s);
}

// state kept by the page between frames
export function makeWatch() { return { crawlUntil: 0, lastCrawl: -1e9, banner: null, seen: 0 }; }

// Called each frame in Watchful mode: returns ticks per second, and may raise a banner.
export function watchRate(w, W0, now, events) {
  // a headline that just landed is a turn: crawl for a moment and say so
  for (const e of events) if (e.big && now - W0.lastCrawl > GAP_MS) { W0.lastCrawl = now; W0.crawlUntil = now + CRAWL_MS; W0.banner = { text: e.text, x: e.x, y: e.y, until: now + CRAWL_MS }; break; }
  if (now < W0.crawlUntil) return CRAWL;
  const t = tensions(w); W0.top = t[0] || null;
  return t.length && t[0].s > 0.1 ? TENSE : QUIET;
}
