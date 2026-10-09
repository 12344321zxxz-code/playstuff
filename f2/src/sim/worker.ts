// Entry point inside the worker (or inside the page's stand-in scope).
import { createHost } from './host';
declare const self: any;
const handle = createHost((msg: any, tr?: Transferable[]) => self.postMessage(msg, tr || []));
self.onmessage = (e: any) => handle(e.data);
self.postMessage({ t: 'hello' });
