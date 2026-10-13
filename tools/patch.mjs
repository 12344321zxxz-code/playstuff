// Tweaks for experiments: a JSON file of { "module.js": { "EXPORTED_OBJECT.key": value } } that is
// applied to live module objects before a run, so A/B tests don't need code edits.
// Only exported objects can be patched (constants inside functions can't).
export async function applyPatch(p) {
  for (const mod in p) {
    const m = await import(new URL('../src/' + mod, import.meta.url));
    for (const path in p[mod]) { const ks = path.split('.'); let o = m; for (let i = 0; i < ks.length - 1; i++) o = o[ks[i]]; o[ks[ks.length - 1]] = p[mod][path]; }
  }
}
