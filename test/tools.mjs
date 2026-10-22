// Click every god tool once on the map and report any page errors.  node test/tools.mjs [worker]
const WK = process.argv[2] === 'worker';
import { chromium } from 'playwright';
import fs from 'node:fs';
const page0 = fs.readFileSync('dist/formicarium.html', 'utf8'); fs.mkdirSync('.cache', { recursive: true });
fs.writeFileSync('.cache/page.html', `<!doctype html><html><head><meta charset="utf-8"><script>window.${WK ? 'FORMI_WORKER' : 'FORMI_LOCAL'}=1</script><style>[hidden]{display:none!important}</style></head><body>${page0}</body></html>`);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }); const errs = [];
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/ERR_TUNNEL/.test(m.text())) errs.push(m.text()); });
await page.goto('file://' + process.cwd() + '/.cache/page.html'); await page.waitForFunction(() => window.__f && window.__f.S.w);
const run = (n) => page.evaluate(async (n) => { const f = window.__f; if (f.S.sim) await f.ask('ticks', { n }); else for (let k = 0; k < n; k++) f.tick(f.S.w); }, n);
await page.evaluate(async () => { await window.__f.start({ seed: 5 }); document.querySelectorAll('#welcome,.welcome,#making').forEach((e) => (e.hidden = true)); }); await run(8 * 120);
const ids = await page.evaluate(() => [...document.querySelectorAll('[data-tool]')].map((b) => b.dataset.tool));
const box = await page.locator('canvas').first().boundingBox(); const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
const tools = ids.length ? ids : ['well', 'remember', 'hush', 'forget', 'sow', 'herd', 'meteor', 'dragon', 'kraken', 'people'];
for (const id of tools) { await page.evaluate((id) => window.__f.setTool(id), id); await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.move(cx + 6, cy + 4); await page.mouse.up(); await page.waitForTimeout(80); }
await run(8 * 40); await page.evaluate(() => { for (const l of [7, 12, 10]) window.__f.setLens(l); });
const mode = await page.evaluate(() => (window.__f.S.sim ? 'worker' : 'page'));
await page.waitForTimeout(300); console.log('tools', tools.length, mode, errs.length ? errs.join('\n') : 'no errors'); await browser.close();
