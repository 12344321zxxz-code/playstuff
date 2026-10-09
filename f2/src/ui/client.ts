// The line to the world. The simulation runs in a Web Worker made from the bundled worker
// source; if the page cannot start one, the same code runs here on the main thread behind a
// stand-in `self`, so everything else is unaware of the difference.
declare const __WORKER__: string;
type Handler = (m: any) => void;

export interface Client { send(m: any, tr?: Transferable[]): void; ask(m: any): Promise<any>; inThread: boolean }

export function connect(onMsg: Handler): Promise<Client> {
  let q = 1; const waiting = new Map<number, (v: any) => void>();
  const route = (m: any) => { if (m && m.t === 'reply') { const f = waiting.get(m.q); if (f) { waiting.delete(m.q); f(m.data); } return; } onMsg(m); };
  const make = (send: (m: any, tr?: Transferable[]) => void, inThread: boolean): Client => ({ send, inThread, ask(m: any) { const id = q++; return new Promise((res) => { waiting.set(id, res); send({ ...m, q: id }); }); } });
  return new Promise((resolve) => {
    let done = false;
    const fallback = () => {
      if (done) return; done = true;
      // run the worker source here with a stand-in for its global scope
      const fake: any = { postMessage: (m: any) => setTimeout(() => route(m), 0), onmessage: null };
      try { new Function('self', __WORKER__)(fake); } catch (e) { console.error(e); }
      resolve(make((m) => setTimeout(() => fake.onmessage && fake.onmessage({ data: m }), 0), true));
    };
    try {
      const url = URL.createObjectURL(new Blob([__WORKER__], { type: 'text/javascript' }));
      const wk = new Worker(url);
      const timer = setTimeout(() => { if (!done) { try { wk.terminate(); } catch (_) {} fallback(); } }, 2500);
      wk.onerror = (e) => { console.warn('worker failed, running in the page', e); clearTimeout(timer); if (!done) { try { wk.terminate(); } catch (_) {} fallback(); } };
      wk.onmessage = (e) => {
        const m = e.data; if (m && m.t === 'hello') { if (!done) { done = true; clearTimeout(timer); resolve(make((mm, tr) => wk.postMessage(mm, tr || []), false)); } return; }
        route(m);
      };
    } catch (e) { fallback(); }
  });
}
