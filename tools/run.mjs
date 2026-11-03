// (Nov 3) Run an experiment and keep everything: one command freezes the code, runs the seeds in parallel, and
// archives the results (with the commit, any uncommitted diff, the patch, seeds, years and a note) to the `runs`
// branch on GitHub, so no test is ever run twice for want of its data.
//
//   node tools/run.mjs <name> [--seeds 11-18,31-38] [--years 2000] [--patch p.json | --set 'people.js:KN.lam=0.1,...']
//                             [--jobs 2] [--note "what this tests"] [--no-archive]
//
// Long runs: launch it detached, e.g.  setsid nohup node tools/run.mjs z1 --note "..." > /dev/null 2>&1 &
// It resumes: seeds whose output already exists are skipped. Results land in <work>/<name>/out/b<seed>.json while
// running (work = $RUNS_TMP or /tmp/claude-0/sc) and in <runs worktree>/runs/<date>-<name>/ when done.
import { spawn, execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync, statSync } from 'node:fs';
import { archive } from './archive.mjs';
const argv = process.argv.slice(2), name = argv[0];
if (!name || name.startsWith('--')) { console.error('usage: node tools/run.mjs <name> [--seeds ..] [--years ..] [--patch f | --set ..] [--jobs n] [--note ..]'); process.exit(1); }
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i < 0 ? d : argv[i + 1]; };
const seeds = arg('seeds', '11-18,31-38').split(',').flatMap((r) => { const [a, b] = r.split('-').map(Number); const o = []; for (let s = a; s <= (b || a); s++) o.push(s); return o; });
const years = +arg('years', 2000), jobs = +arg('jobs', 2), note = arg('note', ''), doArchive = !argv.includes('--no-archive');
const repo = new URL('..', import.meta.url).pathname.replace(/\/$/, ''), work = (process.env.RUNS_TMP || '/tmp/claude-0/sc') + '/' + name;
// the patch: a file, or inline --set 'module.js:OBJ.key=value,...'
let patch = null; if (arg('patch')) patch = JSON.parse(readFileSync(arg('patch'), 'utf8'));
if (arg('set')) { patch = patch || {}; for (const kv of arg('set').split(',')) { const [mk, v] = kv.split('='); const [mod, key] = mk.split(':'); (patch[mod] ||= {})[key] = JSON.parse(v); } }
const git = (c) => { try { return execSync('git ' + c, { cwd: repo, encoding: 'utf8' }).trim(); } catch { return null; } };
// freeze the code (first run only; a resumed run keeps its frozen copy)
if (!existsSync(work + '/src')) {
  mkdirSync(work + '/out', { recursive: true });
  for (const p of ['src', 'tools', 'package.json']) cpSync(repo + '/' + p, work + '/' + p, { recursive: true });
  const diff = git('diff HEAD -- src tools') || '';
  const meta = { name, note, commit: git('rev-parse HEAD'), branch: git('rev-parse --abbrev-ref HEAD'), dirty: diff.length > 0, patch, seeds, years, started: new Date().toISOString() };
  writeFileSync(work + '/meta.json', JSON.stringify(meta, null, 1)); if (diff) writeFileSync(work + '/diff.patch', diff);
  if (patch) writeFileSync(work + '/p.json', JSON.stringify(patch));
}
const meta = JSON.parse(readFileSync(work + '/meta.json', 'utf8'));
const done = (s) => { const f = `${work}/out/b${s}.json`; try { return statSync(f).size > 100 && JSON.parse(readFileSync(f, 'utf8').trim().split('\n').pop()).seed === s; } catch { return false; } };
const todo = seeds.filter((s) => !done(s)); let i = 0;
console.log(`${name}: ${todo.length} of ${seeds.length} seeds to run, ${jobs} at a time, in ${work}`);
const runOne = (s) => new Promise((ok) => { const args = ['tools/stats.mjs', String(s), String(years)]; if (meta.patch) args.push('p.json'); const ch = spawn('node', args, { cwd: work }); let out = '', err = ''; ch.stdout.on('data', (d) => (out += d)); ch.stderr.on('data', (d) => (err += d)); ch.on('close', (code) => { writeFileSync(`${work}/out/b${s}.json`, out); if (err) writeFileSync(`${work}/out/e${s}`, err); console.log(`  seed ${s} ${code === 0 && done(s) ? 'ok' : 'FAILED'}`); ok(); }); });
await Promise.all(Array.from({ length: jobs }, async () => { while (i < todo.length) await runOne(todo[i++]); }));
meta.finished = new Date().toISOString(); meta.ok = seeds.filter(done); meta.failed = seeds.filter((s) => !done(s)); writeFileSync(work + '/meta.json', JSON.stringify(meta, null, 1));
console.log(`${name}: ${meta.ok.length} ok, ${meta.failed.length} failed`);
if (doArchive) await archive(work, { push: true });
