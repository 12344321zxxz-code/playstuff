// (Nov 3) Archive an experiment's results to the `runs` branch (a worktree beside the repo, default ../playstuff-runs):
//   runs/<date>-<name>/  meta.json (commit, branch, dirty, patch, seeds, years, note), diff.patch, p.json,
//                        b<seed>.json (stats.mjs output per world), e<seed> (stderr, if any), summary.json (headline)
//   index.json, INDEX.md  one line per run: date, name, commit, seeds, note, and the headline numbers
// Used by run.mjs when a run finishes; also by hand for older folders:
//   node tools/archive.mjs <folder> [--name n] [--note "..."] [--commit sha] [--date 2026-11-02] [--no-push]
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, copyFileSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { load, summarize } from './headline.mjs';
const repo = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
export const RUNS = process.env.RUNS_DIR || repo + '-runs';
const KEY = ['biggest first, ages 5-8 pooled', 'largest realm share of people, ages 5-8', 'realms with 1%+ of people, ages 5-8', 'median year into age 6', 'median year into age 8', 'peak pop, all worlds (bn)', 'steam-age foreign / internal % (pooled)', 'NaN worlds'];

export async function archive(dir, o = {}) {
  if (!existsSync(RUNS + '/.git')) { console.error(`no runs worktree at ${RUNS} (git worktree add ${RUNS} runs)`); return null; }
  const meta = Object.assign(existsSync(dir + '/meta.json') ? JSON.parse(readFileSync(dir + '/meta.json', 'utf8')) : {}, o.meta || {});
  meta.name = o.name || meta.name || dir.split('/').filter(Boolean).pop(); if (o.note) meta.note = o.note; if (o.commit) meta.commit = o.commit;
  const date = o.date || (meta.started || new Date().toISOString()).slice(0, 10), rel = `runs/${date}-${meta.name}`, dst = RUNS + '/' + rel; mkdirSync(dst, { recursive: true });
  const src = existsSync(dir + '/out') ? dir + '/out' : dir; let n = 0;
  for (const f of readdirSync(src)) { if (/^b\d+\.json$/.test(f) && statSync(src + '/' + f).size > 100) { copyFileSync(src + '/' + f, dst + '/' + f); n++; } else if (/^e\d+$/.test(f) && statSync(src + '/' + f).size > 0) copyFileSync(src + '/' + f, dst + '/' + f); }
  for (const f of ['diff.patch', 'p.json']) if (existsSync(dir + '/' + f)) copyFileSync(dir + '/' + f, dst + '/' + f);
  if (!meta.patch && existsSync(dir + '/p.json')) meta.patch = JSON.parse(readFileSync(dir + '/p.json', 'utf8'));
  const rs = [...load(dst).values()]; meta.worlds = rs.length; meta.seedsDone = rs.map((r) => r.seed).sort((a, b) => a - b); meta.years = meta.years || (rs[0] && rs[0].peakPopY != null ? 2000 : null);
  const sum = summarize(rs); writeFileSync(dst + '/meta.json', JSON.stringify(meta, null, 1)); writeFileSync(dst + '/summary.json', JSON.stringify(sum, null, 1));
  // the index
  const ixF = RUNS + '/index.json', ix = existsSync(ixF) ? JSON.parse(readFileSync(ixF, 'utf8')) : []; const row = { dir: rel, date, name: meta.name, commit: (meta.commit || '').slice(0, 7), dirty: !!meta.dirty, worlds: rs.length, years: meta.years, patch: meta.patch || null, note: meta.note || '', summary: sum };
  const at = ix.findIndex((r) => r.dir === rel); if (at >= 0) ix[at] = row; else ix.push(row); ix.sort((a, b) => (a.date + a.name).localeCompare(b.date + b.name)); writeFileSync(ixF, JSON.stringify(ix, null, 1));
  const cell = (v) => (v == null ? '–' : typeof v === 'number' ? String(+v.toFixed(2)) : String(v));
  const md = ['# Formicarium experiment runs', '', 'Each folder holds one experiment: `meta.json` (commit, patch, seeds, years, note), one `b<seed>.json` per world (the full output of `tools/stats.mjs`), and `summary.json`. Compare any of them with `node tools/headline.mjs <folder> <folder> ...` (or `tools/devpool.mjs`, `tools/turnpool.mjs` on the files).', '',
    '| date | run | commit | worlds | note | ' + KEY.map((k) => k.replace(/ \(pooled\)| pooled/, '')).join(' | ') + ' |', '|' + '---|'.repeat(5 + KEY.length),
    ...ix.map((r) => `| ${r.date} | [${r.name}](${r.dir}) | ${r.commit}${r.dirty ? '+' : ''} | ${r.worlds} | ${(r.note || '').replace(/\|/g, '/').replace(/\n/g, ' ')}${r.patch ? ' (patch: `' + JSON.stringify(r.patch).replace(/\|/g, '/') + '`)' : ''} | ` + KEY.map((k) => cell(r.summary && r.summary[k])).join(' | ') + ' |')];
  writeFileSync(RUNS + '/INDEX.md', md.join('\n') + '\n');
  if (o.push !== false) { try { execSync(`git add -A && git commit -qm ${JSON.stringify('Run ' + meta.name + ': ' + rs.length + ' worlds' + (meta.note ? ' — ' + meta.note.slice(0, 120) : ''))} && git push -q origin runs`, { cwd: RUNS, stdio: 'pipe' }); console.log(`archived ${rel} (${n} worlds) and pushed`); } catch (e) { console.error('archive commit/push failed:', String(e.stderr || e).slice(0, 300)); } }
  else console.log(`archived ${rel} (${n} worlds), not pushed`);
  return rel;
}

if (process.argv[1] && process.argv[1].endsWith('archive.mjs')) {
  const a = process.argv.slice(2), arg = (k) => { const i = a.indexOf('--' + k); return i < 0 ? undefined : a[i + 1]; };
  await archive(a[0], { name: arg('name'), note: arg('note'), commit: arg('commit'), date: arg('date'), push: !a.includes('--no-push') });
}
