// Entry point: pull in every system, then start a world.
import { start } from './main.js';
import './entities.js';
import './hands.js';
import './book.js';

const hot = window.claude && window.claude.hot;
let seed = null;
if (hot && hot.snapshot) hot.snapshot(() => ({ seed }));
const go = (data) => { seed = data && data.seed != null ? data.seed : (Math.random() * 1e9) | 0; start({ seed }); };
if (hot && hot.ready) hot.ready(go); else go((hot && hot.data) || {});
