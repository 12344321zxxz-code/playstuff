// Open the built page in headless Chromium and take pictures.  node test/shot.mjs [outdir] [years]
import { chromium } from 'playwright';
import fs from 'node:fs';
const out = process.argv[2] || '.cache/shots', years = +(process.argv[3] || 150);
fs.mkdirSync(out, { recursive: true });
const page0 = fs.readFileSync('dist/formicarium.html', 'utf8');
fs.writeFileSync('.cache/page.html', `<!doctype html><html><head><meta charset="utf-8"><script>window.FORMI_LOCAL=1</script><meta name="viewport" content="width=device-width, initial-scale=1"><style>[hidden]{display:none!important}</style></head><body>${page0}</body></html>`);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
await page.goto('file://' + process.cwd() + '/.cache/page.html');
await page.waitForFunction(() => window.__f, null, { timeout: 30000 });
await page.evaluate(() => { window.__f.start({ seed: 7 }); document.querySelectorAll('#welcome,.welcome,#making').forEach((e) => (e.hidden = true)); });
await page.evaluate((y) => { const f = window.__f; for (let k = 0; k < y * 8; k++) f.tick(f.S.w); f.S.dirty = true; f.setSpeed(0); }, years);
await page.waitForTimeout(800); await page.screenshot({ path: out + '/1-whole.png' });
const city = await page.evaluate(() => { const s = window.__f.S.w.sets.filter((q) => !q.nomad).sort((a, b) => b.pop - a.pop)[0]; return s ? [s.x, s.y, s.name, s.pop] : null; });
console.log('city', city);
for (const [z, name] of [[8, '2-region'], [20, '3-close']]) {
  await page.evaluate(([c, z]) => { const f = window.__f; if (c) { f.cam.x = c[0] + 0.5; f.cam.y = c[1] + 0.5; } f.cam.z = z; f.S.dirty = true; }, [city, z]);
  await page.waitForTimeout(600); await page.screenshot({ path: `${out}/${name}.png` });
}
for (const [l, name] of [[10, '4-climate'], [11, '5-life'], [7, '6-lore'], [12, '7-origins'], [13, '9-beasts'], [14, '10-trade'], [15, '11-knowledge']]) { await page.evaluate((l) => { const f = window.__f; f.cam.x = 256; f.cam.y = 128; f.cam.z = f.cam.fitZ || f.cam.minZ; f.setLens(l); f.S.dirty = true; }, l); await page.waitForTimeout(600); await page.screenshot({ path: `${out}/${name}.png` }); }
const sp = await page.evaluate(() => { const w = window.__f.S.w, p = w.spirits[0] || w.wells[0]; return p ? [p.x, p.y, p.name || p.kind, w.spirits.map((q) => q.kind).join(',')] : null; }); console.log('spirit', sp);
if (sp) { await page.evaluate((c) => { const f = window.__f; f.setLens(0); f.cam.x = c[0] + 0.5; f.cam.y = c[1] + 0.5; f.cam.z = 14; f.S.dirty = true; }, sp); await page.waitForTimeout(600); await page.screenshot({ path: out + '/8-spirit.png' }); }
console.log(errs.slice(0, 30).join('\n'));
await browser.close();
