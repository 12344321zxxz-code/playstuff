// Browser and headless must agree: the same seed gives the same world, and a save made in the page
// loads headless into the same world.  node test/keep.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
import { TPY } from '../src/core.js';
import { makeWorld, tick } from '../src/world.js';
import { readSave } from '../src/save.js';
const page0 = fs.readFileSync('dist/formicarium.html', 'utf8'); fs.mkdirSync('.cache', { recursive: true });
fs.writeFileSync('.cache/page.html', `<!doctype html><html><head><meta charset="utf-8"><script>window.FORMI_LOCAL=1</script><style>[hidden]{display:none!important}</style></head><body>${page0}</body></html>`);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, acceptDownloads: true }); const errs = [];
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
await page.goto('file://' + process.cwd() + '/.cache/page.html'); await page.waitForFunction(() => window.__f && window.formi);
const sig = 'w => [w.tickN, w.year, w.stats.people, w.sets.length, w.cults.filter((c) => c.alive).length, w.rnd.s, (w.hist || []).length].join(",")';
// let the page run on its own clock for a while, then read the world in one go
await page.evaluate(() => { window.__f.start({ seed: 11 }); window.__f.setSpeed(1); });
await page.waitForTimeout(25000);
const [bSig, ticks] = await page.evaluate((s) => { const w = window.formi.world(); return [eval(s)(w), w.tickN]; }, sig);
const h = makeWorld(11); while (h.tickN < ticks) tick(h); const hSig = eval(sig)(h);
console.log('browser ', bSig); console.log('headless', hSig); const same = bSig === hSig; console.log(same ? 'PARITY OK' : 'PARITY MISMATCH');
// report and save
await page.click('#keep-report'); const rep = await page.$eval('#rb-text', (t) => t.value); console.log('report chars', rep.length, rep.split('\n')[1]);
await page.click('#rb-close'); await page.click('#sp0');
const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#keep-save')]); const path = await dl.path();
const after = await page.evaluate((s) => { const w = window.formi.world(); const f = window.__f; for (let k = 0; k < 40 * 8; k++) f.tick(w); return eval(s)(w); }, sig);
const lw = await readSave(new Uint8Array(fs.readFileSync(path))); for (let k = 0; k < 40 * 8; k++) tick(lw); const lSig = eval(sig)(lw);
console.log('page after save+40y', after); console.log('loaded  +40y      ', lSig); console.log(after === lSig ? 'SAVE OK' : 'SAVE MISMATCH');
console.log(errs.length ? errs.join('\n') : 'no page errors'); await browser.close(); process.exit(same && after === lSig && !errs.length ? 0 : 1);
