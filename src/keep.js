// Keeping a world: Report (plain text to paste into a chat with Claude), Save (the exact world, as a
// file Claude can load headless) and Load (pick up a saved world where it was).
import { state, say, errors, simAsk, remote, loadBytes } from './main.js';
import { settle } from './world.js';
import { encodeWorld, gzip, zipOne, readSave } from './save.js';
import { report } from './probe.js';

const $ = (id) => document.getElementById(id);
const BUILD = typeof __BUILD__ !== 'undefined' ? __BUILD__ : 'dev';
let dl = null; const downloads = () => dl || (dl = (window.claude && window.claude.use ? window.claude.use('downloads') : Promise.resolve(null)).catch(() => null));

async function offer(filename, data) {
  const d = await downloads();
  if (d) { try { await d.save({ filename, data }); return true; } catch (e) { if (e && e.code === 'declined') return false; } }
  try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data])); a.download = filename; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000); return true; } catch (_) { return false; }
}
const stem = (w) => `formicarium-seed${w.seed}-year${w.year}`;

async function showReport() {
  const w = state.w; if (!w) return; let text = remote() ? await simAsk('report', { build: BUILD }) : report(w, BUILD);
  text = `Runs in: ${remote() ? 'a background worker' : 'the page'} (${navigator.hardwareConcurrency || '?'} cores)\n` + text; if (errors.length) text = errors.map((e) => `ERROR (${e.where}, year ${e.year}, tick ${e.tick}): ${e.msg}\n  ${e.stack}`).join('\n') + '\n\n' + text;
  let box = $('reportbox');
  if (!box) {
    box = document.createElement('div'); box.id = 'reportbox'; box.className = 'reportbox'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'World report');
    box.innerHTML = '<div class="rb-head"><strong>World report</strong><span>Paste this into a chat with Claude.</span></div><textarea id="rb-text" readonly spellcheck="false"></textarea><div class="rb-btns"><button type="button" id="rb-copy">Copy</button><button type="button" id="rb-file">Save as .txt</button><button type="button" id="rb-close">Close</button></div>';
    document.body.appendChild(box);
    $('rb-close').addEventListener('click', () => { box.hidden = true; });
    $('rb-copy').addEventListener('click', async () => { const t = $('rb-text'); t.select(); let ok = false; try { await navigator.clipboard.writeText(t.value); ok = true; } catch (_) { try { ok = document.execCommand('copy'); } catch (__) {} } $('rb-copy').textContent = ok ? 'Copied' : 'Select and copy'; setTimeout(() => { $('rb-copy').textContent = 'Copy'; }, 1800); });
    $('rb-file').addEventListener('click', () => offer(stem(state.w) + '-report.txt', new TextEncoder().encode($('rb-text').value)));
  }
  $('rb-text').value = text; box.hidden = false; $('rb-text').focus(); $('rb-text').select();
}

async function saveWorld() {
  const w = state.w; if (!w) return; say('Saving the world…', 4000);
  let gz;
  if (remote()) { const r = await simAsk('save'); if (!r) { say('Not saved.', 5000); return; } gz = r.gz; }   /* the worker settles and packs it */
  else { try { settle(w); } catch (e) { console.error(e); }   // finish work in flight, so the saved world and this one carry on identically (if the world is broken, save it as it is)
    gz = await gzip(encodeWorld(w)); }
  const name = stem(w);
  const ok = await offer(name + '.zip', zipOne(name + '.formi', gz));
  say(ok ? `Saved ${(gz.length / 1e6).toFixed(1)} MB. Send the file to Claude to have it look at this exact world.` : 'Not saved.', 5000);
}

function loadWorld() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.zip,.formi,application/zip';
  inp.addEventListener('change', async () => { const f = inp.files && inp.files[0]; if (!f) return; say('Loading…', 4000);
    try { const w = await loadBytes(new Uint8Array(await f.arrayBuffer()), readSave); say(`Loaded year ${w.year} of seed ${w.seed}.`, 4000); } catch (e) { say('That file is not a Formicarium save.', 4000); } });
  inp.click();
}

function mount() {
  const row = $('keeprow'); if (!row || $('keep-report')) return;
  const mk = (id, label, title, fn) => { const b = document.createElement('button'); b.type = 'button'; b.id = id; b.textContent = label; b.title = title; b.addEventListener('click', fn); return b; };
  row.append(mk('keep-report', 'Report', 'A text report of this world to paste into a chat with Claude', showReport), mk('keep-save', 'Save', 'Save this exact world to a file', saveWorld), mk('keep-load', 'Load', 'Load a saved world', loadWorld));
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
// for automated browser tests: window.formi.dump('digest' | 'report')
window.formi = { dump: (k) => (remote() ? simAsk('report', { build: BUILD }) : Promise.resolve(report(state.w, BUILD))).then((t) => (k === 'report' ? t : t.split('\n\n')[0])), world: () => state.w };
