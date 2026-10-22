// A tiny bridge the simulation can talk through without knowing whether a page is listening, or
// where it runs (on the page itself, or in a background worker). The page sets the handlers.
export const bus = { say: (msg, ms) => {} };
export const say = (msg, ms) => bus.say(msg, ms);
