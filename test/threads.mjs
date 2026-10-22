// Story threads in the page: run a world, letting the notebook and threads update every game year,
// and print the open questions and the stories that ended.   node test/threads.mjs [seed] [years]
import { chromium } from 'playwright';
import fs from 'node:fs';
const seed = +(process.argv[2] || 7), years = +(process.argv[3] || 600);
const page0 = fs.readFileSync('dist/formicarium.html', 'utf8');
fs.writeFileSync('.cache/page.html', `<!doctype html><html><head><meta charset="utf-8"><script>window.FORMI_LOCAL=1</script></head><body>${page0}</body></html>`);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }); const errs = []; page.on('pageerror', (e) => errs.push(e.message));
await page.goto('file://' + process.cwd() + '/.cache/page.html'); await page.waitForFunction(() => window.__f, null, { timeout: 30000 });
const out = await page.evaluate(([seed, years]) => { const f = window.__f; f.start({ seed }); f.setSpeed(0); for (let y = 0; y < years; y++) { for (let k = 0; k < 8; k++) f.tick(f.S.w); f.vitals(); }
  const open = [...document.querySelectorAll('#threads .tq')].map((b) => b.textContent); return { open, stories: (f.S.w.stories || []).slice(0, 12).map((s) => `${s.from}-${s.to} ${s.q} → ${s.end}`), n: (f.S.w.stories || []).length }; }, [seed, years]);
console.log('open now:', out.open); console.log(out.n, 'stories ended; latest:'); for (const s of out.stories) console.log('  ' + s); console.log(errs.join('\n') || 'no page errors');
await browser.close();
