// The background worker: the whole simulation runs here, off the page's thread (see simhost.js).
import { createHost } from './simhost.js';
const host = createHost((m, tr) => postMessage(m, tr || []));
onmessage = (e) => host.handle(e.data);
