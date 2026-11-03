# Formicarium experiment runs

Each folder holds one experiment: `meta.json` (commit, patch, seeds, years, note), one `b<seed>.json` per world (the full output of `tools/stats.mjs`), and `summary.json`. Compare any of them with `node tools/headline.mjs <folder> <folder> ...` (or `tools/devpool.mjs`, `tools/turnpool.mjs` on the files).

| date | run | commit | worlds | note | biggest first, ages 5-8 | largest realm share of people, ages 5-8 | realms with 1%+ of people, ages 5-8 | median year into age 6 | median year into age 8 | peak pop, all worlds (bn) | steam-age foreign / internal % | NaN worlds |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-11-02 | [h1a](runs/2026-11-02-h1a) |  | 20 | Holistic baseline: urban branch + knowledge ledger + development meter (no sim change) | 0.65 | – | 11 | 1512 | 1714 | 4.75 | 30 / 19 | 0 |
| 2026-11-02 | [h1b](runs/2026-11-02-h1b) |  | 20 | h1a + no 26%-urban plateau on ideas from towns (the reference before steps 3-4) | 0.74 | – | 11 | 1524 | 1722 | 3.81 | 37 / 21 | 0 |
| 2026-11-02 | [t0](runs/2026-11-02-t0) |  | 16 | Play-tall iteration of Nov 2 (exact settings not recorded); the 8.2bn info-age population reference | 0.89 | – | – | 1441 | 1653 | 5.05 | 21 / 20 | 0 |
| 2026-11-02 | [t1](runs/2026-11-02-t1) |  | 15 | Play-tall iteration of Nov 2 (exact settings not recorded) | 0.83 | – | – | 1460 | 1608 | 4.47 | 23 / 16 | 0 |
| 2026-11-02 | [t2](runs/2026-11-02-t2) |  | 16 | Play-tall iteration of Nov 2 (exact settings not recorded) | 0.72 | – | – | 1470 | 1648 | 4.09 | 24 / 16 | 1 |
| 2026-11-02 | [t3](runs/2026-11-02-t3) |  | 16 | Play-tall rounds 1-3 (peer letters, orthodoxy, coalitions, weak far provinces) | 0.67 | – | – | 1375 | 1614 | 4.55 | 22 / 18 | 0 |
| 2026-11-02 | [u1](runs/2026-11-02-u1) |  | 16 | Town and country iteration of Nov 2 (exact settings not recorded) | 0.66 | – | – | 1435 | 1694 | 4.12 | 27 / 17 | 0 |
| 2026-11-02 | [u2](runs/2026-11-02-u2) |  | 16 | Urban branch: play tall + town and country stages 1-3 | 0.6 | – | – | 1537 | 1714 | 4.63 | 24 / 20 | 0 |
| 2026-11-02 | [u3](runs/2026-11-02-u3) |  | 16 | Stale knowledge above the medieval threshold (0.5%/yr); slowed the whole world, reverted | 0.79 | – | – | 1573 | 1824 | 3.94 | 28 / 18 | 0 |
| 2026-11-03 | [h10](runs/2026-11-03-h10) |  | 8 | h9 with lam 0.2, kq5 1.6 (patch: `{"people.js":{"KN.lam":0.2,"KN.kq5":1.6}}`) | 0.64 | – | 11 | 1520 | 1907 | 3.58 | 23 / 19 | 0 |
| 2026-11-03 | [h11](runs/2026-11-03-h11) |  | 10 | Each age from its own roots (fit: commerce / coal+towns / towns+schools) + no banked overflow (partial) | 0.61 | – | 11 | 1490 | 1813 | 3.69 | 24 / 16 | 0 |
| 2026-11-03 | [h12](runs/2026-11-03-h12) |  | 10 | h11 + commerce fit reads trade unsaturated | 0.72 | – | 10 | 1472 | 1815 | 3.52 | 26 / 16 | 0 |
| 2026-11-03 | [h2](runs/2026-11-03-h2) |  | 7 | Steps 3-4 v1: court takes in core finds + far provinces up to M=2.5x core; arts work per district; uptake (partial) | 0.8 | – | 13 | 1793 | 1839 | 0.28 | 32 / 17 | 0 |
| 2026-11-03 | [h3](runs/2026-11-03-h3) |  | 12 | h2 + armies by district (districts an age behind fight with the previous age's arms) (partial) | 0.77 | – | 12 | 1537 | 1750 | 4.08 | 34 / 13 | 0 |
| 2026-11-03 | [h4](runs/2026-11-03-h4) |  | 16 | Diminishing returns lam 0.6 (replaces the core cap, which never bound) + letters cap M 2.5 | 0.77 | – | 12 | 1560 | 1764 | 3.94 | 29 / 14 | 0 |
| 2026-11-03 | [h5](runs/2026-11-03-h5) |  | 10 | h4 with lam 0.4, adoption 0.03 (patch: `{"people.js":{"KN.lam":0.4,"KN.adopt":0.03}}`) | 0.6 | – | 13 | 1543 | 1786 | 3.5 | 25 / 22 | 0 |
| 2026-11-03 | [h6](runs/2026-11-03-h6) |  | 13 | lam 0.4, letters cap M 10, adoption 0.03 (partial) | 0.75 | – | 10 | 1652 | 1952 | 3.37 | 22 / 19 | 0 |
| 2026-11-03 | [h7](runs/2026-11-03-h7) |  | 8 | h6 + modern carriers cut to a fifth: size dominance unchanged | 0.76 | – | 10 | 1606 | 1724 | 3.43 | 24 / 15 | 0 |
| 2026-11-03 | [h8](runs/2026-11-03-h8) |  | 8 | h6 + trade and harbours drive town share + brake reference at the lower quartile | 0.6 | – | 12 | 1556 | 1873 | 3.32 | 28 / 17 | 0 |
| 2026-11-03 | [h9](runs/2026-11-03-h9) |  | 16 | Branch as of morning Nov 3: h8 + discovery x1.3 from the age of print | 0.64 | – | 11 | 1532 | 1849 | 3.8 | 30 / 14 | 0 |
| 2026-11-03 | [s1](runs/2026-11-03-s1) |  | 8 | h12 + realm cap 54/56/58 (was 36/44/56) | 0.61 | 0.34 | 13 | 1594 | 1754 | 3.37 | 20 / 24 | 0 |
| 2026-11-03 | [s2](runs/2026-11-03-s2) |  | 8 | s1 + cohesion falls faster with size (count/180) | 0.61 | 0.28 | 13 | 1755 | 1904 | 2.75 | 29 / 19 | 0 |
| 2026-11-03 | [x3](runs/2026-11-03-x3) |  | 8 | s1 + modern carriers to a third + kq5 1.6 | 0.67 | 0.35 | 11 | 1596 | 1881 | 3.37 | 22 / 16 | 0 |
| 2026-11-03 | [x4](runs/2026-11-03-x4) |  | 8 | s2 + modern carriers to a third + kq5 1.6 | 0.59 | 0.23 | 16 | 1760 | 1772 | 2.72 | 33 / 18 | 0 |
| 2026-11-03 | [x5](runs/2026-11-03-x5) |  | 16 | x4 with kq5 2.2: the 'more, smaller realms' version committed to holistic | 0.62 | 0.26 | 14 | 1621 | 1757 | 2.96 | 26 / 20 | 0 |
| 2026-11-03 | [y1](runs/2026-11-03-y1) |  | 8 | x5 + tied rivals close the knowledge gap (pull 0.04) (patch: `{"people.js":{"KN.pull":0.04}}`) | 0.71 | 0.24 | 15 | 1643 | 1876 | 3.94 | 27 / 17 | 0 |
| 2026-11-03 | [y2](runs/2026-11-03-y2) |  | 8 | x5 + pull 0.1 (patch: `{"people.js":{"KN.pull":0.1}}`) | 0.82 | 0.28 | 13 | 1612 | 1800 | 3.3 | 23 / 19 | 0 |
| 2026-11-03 | [z1](runs/2026-11-03-z1) |  | 16 | x5 + lam 0.1, pull 0.04, kq5 3 (the best leadership-switching variant), 16 worlds (patch: `{"people.js":{"KN.lam":0.1,"KN.pull":0.04,"KN.kq5":3}}`) | 0.58 | 0.26 | 14 | 1585 | 1773 | 3.82 | 26 / 13 | 0 |
| 2026-11-03 | [z2](runs/2026-11-03-z2) |  | 8 | x5 + lam 0.1, kq5 3, no pull (patch: `{"people.js":{"KN.lam":0.1,"KN.pull":0,"KN.kq5":3}}`) | 0.53 | 0.34 | 15 | 1789 | 1939 | 2.66 | 26 / 15 | 0 |
| 2026-11-03 | [z3](runs/2026-11-03-z3) |  | 16 | z1 + fitP 3 (fit counted twice as strongly): worse (patch: `{"people.js":{"KN.lam":0.1,"KN.pull":0.04,"KN.kq5":3,"KN.fitP":3}}`) | 0.72 | 0.29 | 13 | 1557 | 1748 | 3.57 | 22 / 17 | 1 |
