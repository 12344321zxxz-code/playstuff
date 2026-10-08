import { chromium } from 'playwright';
import fs from 'node:fs';
const out = '.cache/lens', years = +(process.argv[2] || 400), tpl = process.argv[3] || 'continent';
fs.mkdirSync(out, { recursive: true });
const page0 = fs.readFileSync('dist/formicarium.html', 'utf8');
fs.writeFileSync('.cache/page.html', `<!doctype html><html><head><meta charset="utf-8"><style>[hidden]{display:none!important}</style></head><body>${page0}</body></html>`);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; page.on('pageerror', (e) => errs.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await page.goto('file://' + process.cwd() + '/.cache/page.html');
await page.waitForFunction(() => window.__f2 && window.__f2.M.ready, null, { timeout: 60000 });
await page.evaluate((t) => { document.getElementById('welcome').hidden = true; window.__f2.S.qT = 1e15; if (t !== 'continent') { window.__f2.client().send({ t: 'new', seed: 77, template: t }); } }, tpl);
await page.waitForTimeout(4000);
await page.evaluate(() => window.__f2.setSpeed(4));
await page.waitForFunction((y) => window.__f2.M.year >= y, years, { timeout: 500000 });
await page.evaluate(() => window.__f2.setSpeed(0)); await page.waitForTimeout(500);
for (const [l, n] of [[0, 'atlas'], [6, 'realms'], [9, 'faiths'], [10, 'life'], [1, 'heat']]) { await page.evaluate((l) => window.__f2.setLens(l), l); await page.waitForTimeout(900); await page.screenshot({ path: `${out}/${tpl}-${n}.png` }); }
console.log('year', await page.evaluate(() => window.__f2.M.year), await page.evaluate(() => JSON.stringify(window.__f2.M.stats).slice(0, 300)));
console.log(errs.join('\n')); await browser.close();
