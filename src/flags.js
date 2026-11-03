// (Nov 3, foundations sprint) Switches for fixes under test, all off by default (the z1 baseline). Patchable by experiments:
//   { "flags.js": { "FX.coal": 1 } }
//   coal:   coal is a traded good; a realm that has imported coal in the last 5 years can build engines (if rich enough)
//   law:    written law and a civil service need towns (2 and 4), not a count of districts (8 and 20)
//   market: markets and entrepôts open on local conditions, not as the world's top 6 and top 12
//   cap:    near the realm cap, a province that would break away stays where it is instead of going over to the most
//           populous neighbour, and settler and herder splits are blocked only at the cap itself (not 6 below it)
//   supply: imports count only while they keep coming (a decaying volume of loads, about a load in the last two years),
//           for every traded resource, not one caravan as 25 years of ownership; imported salt (saltpetre) counts toward
//           gunpowder as owned salt does; towns re-export only what reached them in the last 5 years; a realm with no
//           copper asks for it. Implies traded coal.
export const FX = { coal: 0, law: 0, market: 0, cap: 0, supply: 0 };
