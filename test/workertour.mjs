// The page with the world in a worker: every lens, following a town, the dials, the plates, the
// panels, and a save loaded back. Reports page errors.   node test/workertour.mjs
import { chromium } from 'playwright'; import fs from 'node:fs';
const page0 = fs.readFileSync('dist/formicarium.html', 'utf8'); fs.mkdirSync('.cache', { recursive: true });
fs.writeFileSync('.cache/wtour.html', `<!doctype html><html><head><meta charset="utf-8"><script>window.FORMI_WORKER=1</script><style>[hidden]{display:none!important}</style></head><body>${page0}</body></html>`);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }); const errs = [];
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL|fonts/.test(m.text())) errs.push(m.text().slice(0, 300)); });
await page.goto('file://' + process.cwd() + '/.cache/wtour.html'); await page.waitForFunction(() => window.__f && window.__f.S.w && window.__f.S.w.sets, null, { timeout: 30000 });
const step = (name, fn, arg) => page.evaluate(fn, arg).then((r) => console.log(name, JSON.stringify(r)), (e) => errs.push(name + ': ' + e.message));
await step('mode', () => ({ worker: !!window.__f.S.sim }));
await step('run', async () => { const f = window.__f; await f.ask('ticks', { n: 8 * 300 }); f.setSpeed(2); await new Promise((ok) => setTimeout(ok, 1500)); return { year: f.S.w.year, towns: f.S.w.sets.length, movers: f.S.w.movers.length }; });
await step('lenses', async () => { const f = window.__f; for (const l of [0, 10, 1, 2, 11, 8, 3, 5, 4, 6, 9, 7, 12, 13, 14, 17, 15, 16]) { f.setLens(l); await new Promise((ok) => setTimeout(ok, 250)); } f.setLens(0); return 'ok'; });
await step('follow', async () => { const f = window.__f, w = f.S.w, s = w.sets.filter((q) => !q.dead && !q.nomad).sort((a, b) => b.pop - a.pop)[0]; if (!s) return 'no town';
  f.cam.x = s.x + 0.5; f.cam.y = s.y + 0.5; f.cam.z = 8; f.setTool('look'); const ov = document.getElementById('ov'), r = ov.getBoundingClientRect(), ev = (t) => ov.dispatchEvent(new PointerEvent(t, { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, pointerId: 1, bubbles: true, button: 0 }));
  ev('pointerdown'); ev('pointerup'); await new Promise((ok) => setTimeout(ok, 2500)); return { title: document.querySelector('#inspect h3') && document.querySelector('#inspect h3').textContent, following: !!f.S.sel }; });
await step('terrain', async () => { const f = window.__f; f.cam.z = 3; const ov = document.getElementById('ov'), r = ov.getBoundingClientRect(), ev = (t, x, y) => ov.dispatchEvent(new PointerEvent(t, { clientX: r.left + x, clientY: r.top + y, pointerId: 1, bubbles: true, button: 0 }));
  ev('pointerdown', 50, 50); ev('pointerup', 50, 50); await new Promise((ok) => setTimeout(ok, 800)); return document.querySelector('#inspect h3') && document.querySelector('#inspect h3').textContent; });
await step('dials', async () => { const set = (id, v) => { const e = document.getElementById(id); if (!e) return; e.value = v; e.dispatchEvent(new Event('input')); }; set('d-sun', 3); set('d-sea', 0.02); set('d-wet', 1.4); await new Promise((ok) => setTimeout(ok, 2500)); const p = window.__f.S.w.params; return { sun: p.sun, seaDial: p.seaDial, wet: p.wet }; });
await step('plates', async () => { const f = window.__f; f.setTool('plates'); f.cam.z = f.cam.minZ; const pl = f.S.w.plates[0], ov = document.getElementById('ov'), r = ov.getBoundingClientRect();
  const toS = (x, y) => [r.left + ((x - f.cam.x) * f.cam.z) + r.width / 2, r.top + ((y - f.cam.y) * f.cam.z) + r.height / 2]; const a = toS(pl.cx + pl.vx * 16, pl.cy + pl.vy * 16), b = [a[0] + 30, a[1] + 10];
  const ev = (t, p) => ov.dispatchEvent(new PointerEvent(t, { clientX: p[0], clientY: p[1], pointerId: 1, bubbles: true, button: 0 })); const st0 = f.S.w.plateStamp || 0; ev('pointerdown', a); for (let k = 1; k <= 5; k++) ev('pointermove', [a[0] + 6 * k, a[1] + 2 * k]); ev('pointerup', b);
  await new Promise((ok) => setTimeout(ok, 4000)); f.setTool('look'); return { plateStamp: [st0, f.S.w.plateStamp || 0] }; });
await step('save+load', async () => { const f = window.__f; f.setSpeed(0); await new Promise((ok) => setTimeout(ok, 300)); const r = await f.ask('save'); const s0 = await f.ask('sig'); const y0 = f.S.w.year;
  const u = new Uint8Array(r.gz); await f.load(u); const s1 = await f.ask('sig'); return { bytes: u.length, year: [y0, f.S.w.year], same: s0 === s1 }; });
await step('fast', async () => { const f = window.__f; f.setSpeed(3); const t0 = f.S.w.tickN, c0 = performance.now(); await new Promise((ok) => setTimeout(ok, 5000)); return { tps: Math.round((f.S.w.tickN - t0) / ((performance.now() - c0) / 1000)), frame: +f.S.perf.frame.toFixed(1) }; });
await step('report', async () => (await window.formi.dump('report')).length);
console.log(errs.length ? 'ERRORS\n' + errs.slice(0, 12).join('\n') : 'no page errors'); await browser.close();
