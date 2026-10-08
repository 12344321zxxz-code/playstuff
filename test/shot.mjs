// Open the built page in headless Chromium and take pictures.  node test/shot.mjs [outdir] [years]
import { chromium } from 'playwright';
import fs from 'node:fs';
const out = process.argv[2] || '.cache/shots', years = +(process.argv[3] || 60);
fs.mkdirSync(out, { recursive: true });
const page0 = fs.readFileSync('dist/formicarium.html', 'utf8');
fs.writeFileSync('.cache/page.html', `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>${page0}</body></html>`);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
await page.goto('file://' + process.cwd() + '/.cache/page.html');
await page.waitForFunction(() => window.__f2 && window.__f2.M.ready, null, { timeout: 60000 }).catch(async () => { console.log('NOT READY', errs.join('\n')); await page.screenshot({ path: out + '/0-fail.png' }); process.exit(1); });
await page.evaluate(() => { const w = document.getElementById('welcome'); if (w) w.hidden = true; window.__f2.S.qT = 1e15; window.__f2.setSpeed(4); });
const t0 = Date.now();
await page.waitForFunction((y) => window.__f2.M.year >= y, years, { timeout: 240000 }).catch(() => errs.push('timeout waiting for year'));
console.log('year', await page.evaluate(() => window.__f2.M.year), 'in', Date.now() - t0, 'ms');
await page.evaluate(() => window.__f2.setSpeed(0));
await page.waitForTimeout(800);
await page.screenshot({ path: out + '/1-whole.png' });
const city = await page.evaluate(() => { const s = window.__f2.M.ents.sets.filter((q) => !q.nomad).sort((a, b) => b.pop - a.pop)[0]; return s ? [s.x, s.y, s.name, s.pop] : null; });
console.log('city', city);
for (const [z, name] of [[6, '2-region'], [16, '3-close'], [34, '4-street']]) {
  await page.evaluate(([c, z]) => { const f = window.__f2; if (c) { f.cam.x = c[0] + 0.5; f.cam.y = c[1] + 0.5; } f.cam.z = z; }, [city, z]);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/${name}.png` });
}
await page.evaluate(() => { const f = window.__f2; f.cam.z = 4; f.setLens(6); });
await page.waitForTimeout(500); await page.screenshot({ path: out + '/5-realms.png' });
const fps = await page.evaluate(() => new Promise((r) => { let n = 0; const t = performance.now(); const f = () => { n++; if (performance.now() - t < 2000) requestAnimationFrame(f); else r(n / 2); }; requestAnimationFrame(f); }));
console.log('fps (swiftshader)', fps);
console.log(errs.slice(0, 30).join('\n'));
await browser.close();
