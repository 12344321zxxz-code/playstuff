import { chromium } from 'playwright'; import fs from 'node:fs';
const dist = process.argv[2], seed = +process.argv[3], yrs = +process.argv[4];
const page0 = fs.readFileSync(dist, 'utf8'); fs.writeFileSync('/tmp/claude-0/sc/brz.html', `<!doctype html><html><head><meta charset="utf-8"><script>window.FORMI_LOCAL=1</script><style>[hidden]{display:none!important}</style></head><body>${page0}</body></html>`);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }); const errs = [];
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 6).join('\n'))); page.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL/.test(m.text())) errs.push(m.text()); });
await page.goto('file:///tmp/claude-0/sc/brz.html'); await page.waitForFunction(() => window.__f);
await page.evaluate((sd) => { window.__f.start({ seed: sd }); document.querySelectorAll('#welcome,.welcome,#making').forEach((e) => (e.hidden = true)); window.__f.setSpeed(0); }, seed);
const lenses = [0, 6, 9, 14, 17, 7, 16, 15, 13];
for (let y = 0; y < yrs; y += 20) {
  const r = await page.evaluate(([n, l]) => { try { const f = window.__f; for (let k = 0; k < n * 8; k++) { f.tick(f.S.w); } f.vitals(); f.setLens(l); f.S.dirty = true; return f.S.w.year; } catch (e) { return 'ERR ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 5).join(' | '); } }, [20, lenses[(y / 20) % lenses.length]]);
  await page.waitForTimeout(150); if (typeof r === 'string' || errs.length) { console.log('at', y, r, errs.join('\n')); break; }
}
console.log('end', errs.length ? 'errors' : 'clean');
await browser.close();
