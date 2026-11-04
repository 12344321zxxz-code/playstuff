#!/usr/bin/env python3
"""Pool tools/peopling.mjs outputs by the world's highest age: usage: python3 peopling-census.py s*.json"""
import json, sys, collections, statistics as st
rows = []
for f in sys.argv[1:]:
    d = json.load(open(f))
    for r in d['rows']: r['seed'] = d['seed']; rows.append(r)
def q(v):
    v = sorted(x for x in v if x is not None)
    return f"{st.mean(v):5.2f} [{v[0]:.2f}-{v[-1]:.2f}]" if v else '-'
print('age  n | bands(people) | land in towns | roots(1%+) | top family | main landmass fam5 / top | other landmasses top | behind 2+: same fam / other fam | same land / other land | tied / untied')
for a in range(0, 10):
    R = [r for r in rows if r['maxTech'] == a]
    if not R: continue
    g = lambda k, s, f: [((r['lag'] or {}).get(k) or {}).get(f) for r in R]
    print(f"{a}  {len(R):3} | {q([r['popNomad'] for r in R])} | {q([r['landSed'] for r in R])} | {q([r['roots1pct'] for r in R])} | {q([r['topRootPeople'] for r in R])} | "
          f"{q([r['masses'][0]['fam5'] for r in R])} / {q([r['masses'][0]['top'] for r in R])} | {q([m['top'] for r in R for m in r['masses'][1:]])} | "
          f"{q(g('fam',0,'b2'))} / {q(g('other',0,'b2'))} | {q(g('land',0,'b2'))} / {q(g('away',0,'b2'))} | {q(g('tied',0,'b2'))} / {q(g('untied',0,'b2'))}")
    print(f"        share of people: other family {q(g('other',0,'pop'))}, other landmass {q(g('away',0,'pop'))}, untied {q(g('untied',0,'pop'))}")
