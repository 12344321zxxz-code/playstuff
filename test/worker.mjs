// The world in a background worker: it starts, runs, takes tools, saves, reports, and keeps up.
//   node test/worker.mjs [dist] [seconds]
import { chromium } from 'playwright'; import fs from 'node:fs';
const dist = process.argv[2] || 'dist/formicarium.html', secs = +(process.argv[3] || 8), saveF = process.argv[4];
const page0 = fs.readFileSync(dist, 'utf8');
const wrap = (local) => `<!doctype html><html><head><meta charset="utf-8"><style>[hidden]{display:none!important}</style>${local ? '<script>window.FORMI_LOCAL=1</script>' : '<script>window.FORMI_WORKER=1</script>'}</head><body>${page0}</body></html>`;
fs.writeFileSync('/tmp/claude-0/sc/wk_r.html', wrap(false)); fs.writeFileSync('/tmp/claude-0/sc/wk_l.html', wrap(true));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: process.env.NOGL ? ['--disable-3d-apis', '--disable-webgl'] : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const out = {};
for (const mode of ['remote', 'local']) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } }); const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL|fonts/.test(m.text())) errs.push('console: ' + m.text()); });
  await page.goto('file:///tmp/claude-0/sc/wk_' + (mode === 'remote' ? 'r' : 'l') + '.html');
  await page.waitForFunction(() => window.__f && window.__f.S.w && window.__f.S.w.sets, null, { timeout: 30000 });
  if (saveF) { const b64 = fs.readFileSync(saveF).toString('base64'); await page.evaluate(async (b) => { const bin = atob(b), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); await window.__f.load(u); }, b64); }
  const isRemote = await page.evaluate(() => !!window.__f.S.sim);
  await page.evaluate(() => window.__f.setSpeed(3)); await page.waitForTimeout(1500);
  const t0 = await page.evaluate(() => window.__f.S.w.tickN), c0 = Date.now(); await page.waitForTimeout(secs * 1000);
  const r = await page.evaluate(() => { const S = window.__f.S, P = S.perf; return { recv: S.sim ? +(S.sim.recvMs || 0).toFixed(1) : 0, stat: JSON.stringify(S.simStat || {}, (k, v) => typeof v === "number" ? +v.toFixed(1) : v), tickN: S.w.tickN, year: S.w.year, towns: S.w.sets.filter((s) => !s.dead).length, movers: S.w.movers.length, frame: +P.frame.toFixed(1), sim: +P.sim.toFixed(2), gl: +P.gl.toFixed(1), ov: +P.ov.toFixed(1) }; });
  r.tps = +((r.tickN - t0) / ((Date.now() - c0) / 1000)).toFixed(1); r.isRemote = isRemote;
  // a few tools, a look, a report and a save
  const tools = await page.evaluate(async () => { const f = window.__f; f.setSpeed(0); const box = document.getElementById('ov').getBoundingClientRect();
    const tap = (id, x, y) => { f.setTool(id); const ev = (t) => document.getElementById('ov').dispatchEvent(new PointerEvent(t, { clientX: box.left + x, clientY: box.top + y, pointerId: 1, bubbles: true, button: 0 })); ev('pointerdown'); ev('pointerup'); };
    tap('meteor', 400, 300); tap('raise', 500, 300); tap('people', 600, 350); tap('look', 640, 400);
    await new Promise((ok) => setTimeout(ok, 1500)); const rep = await window.formi.dump('report'); return { report: rep.length, info: document.getElementById('inspect').textContent.length };
  });
  if (isRemote) r.prof = JSON.stringify(await page.evaluate(() => window.__f.ask('prof')), (k, v) => typeof v === 'number' ? +v.toFixed(0) : v);
  r.report = tools.report; r.info = tools.info; r.errors = errs.slice(0, 5);
  out[mode] = r; await page.close();
}
console.log(JSON.stringify(out, null, 1));
await browser.close();
