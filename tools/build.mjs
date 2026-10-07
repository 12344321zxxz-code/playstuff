// Bundle the game into one self-contained HTML fragment (no <html>/<head>/<body>), which is what
// gets published as the playable page. The repo itself runs unbundled from index.html.
import { build } from 'esbuild';
import fs from 'node:fs';
const root = new URL('..', import.meta.url).pathname;
const out = await build({ entryPoints: [root + 'src/app.js'], bundle: true, format: 'iife', minify: false, write: false, target: 'es2020', legalComments: 'none' });
const html = fs.readFileSync(root + 'index.html', 'utf8'), css = fs.readFileSync(root + 'style.css', 'utf8');
const title = html.match(/<title>[^]*?<\/title>/)[0], fonts = html.match(/<link rel="stylesheet" href="https:\/\/fonts[^>]*>/)[0];
const app = html.split('<!--APP-->')[1].split('<!--/APP-->')[0];
fs.mkdirSync(root + 'dist', { recursive: true });
fs.writeFileSync(root + 'dist/formicarium.html', `${title}\n${fonts}\n<style>\n${css}</style>\n${app}\n<script>\n${out.outputFiles[0].text.replace(/<\/script/g, '<\\/script')}</script>\n`);
console.log('dist/formicarium.html', (fs.statSync(root + 'dist/formicarium.html').size / 1024).toFixed(0) + ' KB');
