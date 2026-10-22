import { chromium } from 'playwright'; import fs from 'node:fs';
const dist = process.argv[2], seed = +(process.argv[3] || 1), yrs = +(process.argv[4] || 1000);
fs.writeFileSync('/tmp/claude-0/sc/bp.html', `<!doctype html><html><head><meta charset="utf-8"><script>window.FORMI_LOCAL=1</script><style>[hidden]{display:none!important}</style></head><body>${fs.readFileSync(dist, 'utf8')}</body></html>`);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }); page.on('pageerror', (e) => console.log('ERR', e.message));
await page.goto('file:///tmp/claude-0/sc/bp.html'); await page.waitForFunction(() => window.__f);
await page.evaluate((sd) => { window.__f.start({ seed: sd }); document.querySelectorAll('#welcome,.welcome,#making').forEach((e) => (e.hidden = true)); window.__f.setSpeed(0); }, seed);
for (let y = 0; y < yrs; y += 50) await page.evaluate((n) => { const f = window.__f; for (let k = 0; k < n * 8; k++) f.tick(f.S.w); }, 50);
for (const sp of [1, 3]) {
  await page.evaluate((s) => window.__f.setSpeed(s), sp); await page.waitForTimeout(4000);
  const y0 = await page.evaluate(() => window.__f.S.w.tickN); const t0 = Date.now(); await page.waitForTimeout(12000);
  const r = await page.evaluate(() => { const P = window.__f.S.perf; return { year: window.__f.S.w.year, tickN: window.__f.S.w.tickN, frame: P.frame, sim: P.sim, gl: P.gl, ov: P.ov, ticks: P.ticks }; });
  console.log('speed', sp, JSON.stringify(r, (k, v) => (typeof v === 'number' ? +v.toFixed(2) : v)), 'ticks/s', ((r.tickN - y0) / ((Date.now() - t0) / 1000)).toFixed(1));
}
await browser.close();
