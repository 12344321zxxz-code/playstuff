// Starting the background worker and talking to it. In the bundled page the worker's code travels
// inside the page as text (__WORKER_SRC__); running from the source files it is loaded as a module.
// If no worker can be started (an old browser, or a host page that forbids them), the answer is
// null and the page runs the world itself, as it always did.
export function openSim(onMsg, timeoutMs) {
  return new Promise((resolve) => {
    let wk, url = null, done = false;
    const fail = (why) => { if (done) return; done = true; try { wk && wk.terminate(); } catch (_) {} if (url) URL.revokeObjectURL(url); console.warn('[formicarium] running the world on the page:', why); resolve(null); };
    try {
      if (typeof Worker === 'undefined') return fail('no workers here');
      if (typeof __WORKER_SRC__ !== 'undefined') { url = URL.createObjectURL(new Blob([__WORKER_SRC__], { type: 'text/javascript' })); wk = new Worker(url); }
      else wk = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    } catch (e) { return fail(e && e.message); }
    let seq = 0; const waiting = new Map();
    const sim = {
      worker: wk,
      send(m, tr) { wk.postMessage(m, tr || []); },
      ask(q, args, tr) { const id = ++seq; return new Promise((ok, no) => { waiting.set(id, { ok, no }); wk.postMessage(Object.assign({ t: 'ask', q, id }, args || {}), tr || []); }); },
    };
    wk.onerror = (e) => { if (!done) fail(e && e.message || 'worker failed to start'); else console.error('[sim worker]', e && e.message); };
    wk.onmessage = (e) => {
      const t0 = performance.now(), m = e.data; sim.recvMs = (sim.recvMs || 0) + performance.now() - t0;
      if (!done) { if (m && m.t === 'pong') { done = true; resolve(sim); } return; }
      if (m.t === 'reply') { const h = waiting.get(m.id); if (h) { waiting.delete(m.id); if (m.err) h.no(new Error(m.err)); else h.ok(m.r); } return; }
      onMsg(m);
    };
    wk.postMessage({ t: 'ping' });
    setTimeout(() => fail('the worker did not answer'), timeoutMs || 4000);
  });
}
