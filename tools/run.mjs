// Run a TypeScript test or tool under node: bundle it with esbuild, then import it.
//   node tools/run.mjs test/smoke.ts [args...]
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const entry = process.argv[2], out = path.resolve('.cache', path.basename(entry).replace(/\.ts$/, '.mjs'));
fs.mkdirSync('.cache', { recursive: true });
await build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'warning', sourcemap: 'inline' });
process.argv.splice(2, 1);
await import(pathToFileURL(out).href);
