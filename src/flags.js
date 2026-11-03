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
//   mills:  mills without a river (windmills), so a realm with no river is not barred from engines forever
//   council: a council of houses (the merchant-republic government) needs print and a market per eight districts, not three
//           of the world's markets
//   allies: realms of any size can join a war as allies (they needed 3+ districts)
//   bastion: a town walled by a realm with gunpowder and masonry keeps much of its walls' worth against cannon (the trace
//           italienne); before, cannon made walls worthless for good
//   towns:  the world-wide cap on towns rises from 520 to 700 (settlers were turned away once it was reached)
//   fisc:   the fiscal state (fisc.js): strength is paid for, so it follows net revenue (taxes that reach the court, minus
//           the cost of holding far, foreign and newly taken districts), not headcount
//   econ:   loot and robbery come out of the victim, and a buyer gains only a fifth of a load's value (trade moves value
//           rather than creating it at both ends)
//   know:   conquest hands over no knowledge directly; a court learns from districts that know more than it does, slowly
//   inst:   institutions and the end of the world-age switches: government forms from who holds the wealth (a modern state
//           needs print, schools and rails or wires, not engines alone; a council of houses where trade is a large share of
//           what a realm makes), colonial risings and independence driven by the colony's own mass literacy and
//           communications (print, then rails or wires) instead of the world's age, new colonies stop when a power's own
//           colonies are rising rather than when the world reaches the bomb, and migration across borders from the iron
//           age (to open societies one knows) instead of only from the steam age
//   realms: the realm cap is 90 at every age (was 54-58 by the world's age, bounded by 64 map colours): a colour may be worn
//           by two realms far apart; and the world-wide cap on travellers grows with the town cap
export const FX = { coal: 0, law: 0, market: 0, cap: 0, supply: 0, mills: 0, council: 0, allies: 0, bastion: 0, towns: 0, fisc: 0, econ: 0, know: 0, inst: 0, realms: 0 };
