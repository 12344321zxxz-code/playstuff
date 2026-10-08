// Drive the page like a player: the wheel, a few powers, a look card, every tab of the book.
//   node test/ui.mjs [outdir]
import { chromium } from 'playwright';
import fs from 'node:fs';
const out = process.argv[2] || '.cache/ui';
fs.mkdirSync(out, { recursive: true });
const page0 = fs.readFileSync('dist/formicarium.html', 'utf8');
fs.writeFileSync('.cache/page.html', `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>[hidden]{display:none!important}</style></head><body>${page0}</body></html>`);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
await page.goto('file://' + process.cwd() + '/.cache/page.html');
await page.waitForFunction(() => window.__f2 && window.__f2.M.ready, null, { timeout: 60000 });
await page.screenshot({ path: out + '/0-welcome.png' });
await page.click('#wgo').catch(() => {});
await page.evaluate(() => { window.__f2.S.qT = 1e15; window.__f2.setSpeed(4); });
await page.waitForFunction(() => window.__f2.M.year >= 220, null, { timeout: 300000 }).catch(() => errs.push('slow'));
await page.evaluate(() => window.__f2.setSpeed(0));
// the wheel
await page.mouse.click(700, 450, { button: 'right' });
await page.waitForTimeout(300);
await page.mouse.move(700, 450 - 60);
await page.waitForTimeout(300);
await page.screenshot({ path: out + '/1-wheel.png' });
await page.keyboard.press('Escape');
// a meteor on the biggest city's doorstep
const city = await page.evaluate(() => { const s = window.__f2.M.ents.sets.filter((q) => !q.nomad).sort((a, b) => b.pop - a.pop)[0]; return [s.x, s.y, s.name]; });
await page.evaluate((c) => { const f = window.__f2; f.cam.x = c[0]; f.cam.y = c[1]; f.cam.z = 7; }, city);
await page.waitForTimeout(400);
await page.evaluate(() => window.__f2.setTool('meteor'));
await page.mouse.click(720 + 7 * 14, 450 + 7 * 6);
await page.waitForTimeout(500);
await page.screenshot({ path: out + '/2-meteor.png' });
await page.evaluate(() => window.__f2.setTool('ridge'));
await page.mouse.move(400, 300); await page.mouse.down(); for (let k = 0; k < 20; k++) { await page.mouse.move(400 + k * 15, 300 + k * 5); await page.waitForTimeout(30); } await page.mouse.up();
await page.waitForTimeout(1200);
await page.screenshot({ path: out + '/3-ridge.png' });
// look at the city
await page.evaluate(() => window.__f2.setTool(null));
await page.mouse.click(720, 450);
await page.waitForTimeout(600);
await page.screenshot({ path: out + '/4-card.png' });
for (const tab of ['chronicle', 'legends', 'peoples', 'almanac', 'world']) {
  await page.click(`[data-tab="${tab}"]`); await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/5-${tab}.png` });
}
await page.click('[data-tab="legends"]'); await page.waitForTimeout(700);
await page.click('#book-body .lg-row'); await page.waitForTimeout(900);
await page.screenshot({ path: out + '/6-legend-page.png' });
await page.click('[data-tab="world"]'); await page.waitForTimeout(400); await page.click('#book-body .btn'); await page.waitForTimeout(3000); console.log('saved?', await page.evaluate(() => document.getElementById('say').textContent));
console.log('city', city, 'year', await page.evaluate(() => window.__f2.M.year));
console.log(errs.slice(0, 20).join('\n'));
await browser.close();
