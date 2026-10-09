// Build Formicarium 2. Two passes: the simulation is bundled on its own (it runs in a Web
// Worker), then its source is baked into the page bundle as a string. Output:
//   dist/formicarium.html  one self-contained HTML fragment, the published page
//   dist/dev.js            the page bundle for index.html during development
import { build } from 'esbuild';
import fs from 'node:fs';
const root = new URL('..', import.meta.url).pathname;
const t0 = Date.now();
const wk = await build({ entryPoints: [root + 'src/sim/worker.ts'], bundle: true, format: 'iife', minify: true, write: false, target: 'es2020', legalComments: 'none' });
const workerSrc = wk.outputFiles[0].text;
const app = await build({ entryPoints: [root + 'src/ui/main.ts'], bundle: true, format: 'iife', minify: !process.argv.includes('--dev'), write: false, target: 'es2020', legalComments: 'none', define: { __WORKER__: JSON.stringify(workerSrc) } });
const js = app.outputFiles[0].text;
fs.mkdirSync(root + 'dist', { recursive: true });
fs.writeFileSync(root + 'dist/dev.js', js);
const html = fs.readFileSync(root + 'index.html', 'utf8'), css = fs.readFileSync(root + 'style.css', 'utf8');
const title = html.match(/<title>[^]*?<\/title>/)[0], fonts = html.match(/<link rel="stylesheet" href="https:\/\/fonts[^>]*>/)[0];
const body = html.split('<!--APP-->')[1].split('<!--/APP-->')[0];
fs.writeFileSync(root + 'dist/formicarium.html', `${title}\n${fonts}\n<style>\n${css}</style>\n${body}\n<script>\n${js.replace(/<\/script/g, '<\\/script')}</script>\n`);
console.log('dist/formicarium.html', (fs.statSync(root + 'dist/formicarium.html').size / 1024).toFixed(0) + ' KB', 'worker', (workerSrc.length / 1024).toFixed(0) + ' KB', Date.now() - t0 + 'ms');
