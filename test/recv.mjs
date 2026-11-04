// (Nov 4, tech-disparity Step 1-2) unit checks for the receipt allowance and the anchored discovery.
//   node test/recv.mjs
import { FX } from '../src/flags.js';
import { KN, recvCap, ownFind } from '../src/people.js';
import { rk } from '../src/tech.js';
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } else console.log('ok  ', m); };
const realm = (tech, dk, dkr) => ({ tech, _dk: dk, _dkr: dkr, kl: null });
const was = { recv: FX.recv, anchor: FX.anchor };
// off: no allowance, rk is the plain ledger
FX.recv = 0; { const c = realm(6, 100, 1000); c._ra = recvCap(c, 1000); ok(c._ra === undefined, 'off: no allowance'); ok(rk(c, 'meet', 5e9) === 5e9, 'off: nothing clipped'); }
// arm 1a: ten times own finds, the same for two realms that find the same, whatever else they have
FX.recv = 1; { const a = realm(6, 100, 1000), b = realm(6, 100, 50000); ok(recvCap(a, KN.M * 100) === recvCap(b, KN.M * 100), '1a: equal own finds, equal allowance'); }
// arm 1b: two realms with the same own finds but different towns and schools take in different amounts
FX.recv = 2; { const a = realm(6, 100, 1000), b = realm(6, 100, 50000); ok(recvCap(b, 1000) > recvCap(a, 1000), '1b: more towns and schools, larger allowance');
  const z = realm(6, 0, 0); ok(recvCap(z, Infinity) === 0, '1b: nothing to learn with, nothing taken in');
  const e = realm(3, 0, 0); ok(recvCap(e, Infinity) === undefined, 'no limit before the long middle');
  const c = realm(6, 100, 1000); c._ra = 50; const g1 = rk(c, 'meet', 30), g2 = rk(c, 'pull', 30), g3 = rk(c, 'letters', 30); ok(g1 === 30 && g2 === 20 && g3 === 0 && c.kl.meet === 30 && c.kl.pull === 20, '1b: channels share one yearly allowance'); }
// Step 2: anchored finds do not move when the rest of the world gets richer or poorer (no dkRef, no fit against others)
FX.anchor = 1; { const ak = KN.ak; KN.ak = 2; ok(ownFind(1e6, 1e3, 1) === ownFind(1e6, 1e9, 4), 'anchor: own finds ignore the world reference'); ok(ownFind(4e6, 1e3, 1) / ownFind(1e6, 1e3, 1) === 2, 'anchor: four times the towns, twice the finds'); KN.aI = 1; ok(ownFind(1e6, 1e3, 1, 2) === 2 * ownFind(1e6, 1e3, 1, 1), 'anchor: twice the town share, twice the finds'); KN.aI = 0; KN.aO = 1; ok(Math.abs(ownFind(1e6, 1e3, 1, 1, 6, 1) / ownFind(1e6, 1e3, 1, 1, 6, 0) - 0.2) < 1e-12, 'anchor: a hardened court finds a fifth as much'); KN.aO = 0; KN.ak = ak; }
FX.anchor = 0; ok(ownFind(1e6, 1e3, 1) !== ownFind(1e6, 1e9, 1), 'off: own finds are measured against the world (as played)');
FX.recv = was.recv; FX.anchor = was.anchor;
if (bad) { console.log(bad, 'failed'); process.exit(1); } else console.log('all passed');
