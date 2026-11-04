#!/usr/bin/env python3
"""Tech disparity: the ChatGPT benchmark matrix against archived sim runs (Nov 4, 2026).

usage: python3 disparity.py report-matrix.csv <runs dir with b*.json>

Report side: world shares of people/land 0/1/2/3+ ages behind the frontier, recomputed from the
region matrix (the report's own land tables don't match its matrix), and the share of people at
age >= N per date. Sim side: the `dev` century rows (tools/devmeter.mjs) pooled by frontier age F,
split into the first century at F ('entry') and later centuries ('late'); years from the first
century with F >= N until 50% / 90% of people are at age >= N; first entrant per age (firstTo).
"""
import csv, json, glob, sys, collections, statistics as st

def report(path):
    R = [r for r in csv.DictReader(open(path))]
    yr = lambda d: -int(d.split()[0]) if 'BC' in d else int(d.split()[0])
    by = collections.defaultdict(list)
    for r in R: by[yr(r['date'])].append(r)
    print('REPORT (recomputed from matrix): frontier, people% 0/1/2/3+ behind | land% 0/1/2/3+ | people% at age>=2..9')
    for d in sorted(by):
        rows = by[d]; P = sum(float(r['population_best']) for r in rows)
        sh = [[float(r[f'share_age{k}']) for k in range(11)] for r in rows]
        F = max(k for s in sh for k in range(11) if s[k] > 0)
        def lag(key):
            o = [0] * 4
            for r, s in zip(rows, sh):
                for k in range(11): o[min(3, max(0, F - k))] += float(r[key]) * s[k] / 100
            t = sum(o); return ' '.join(f'{100 * x / t:5.1f}' for x in o)
        ge = ' '.join(f'{sum(float(r["population_best"]) * sum(s[n:]) / 100 for r, s in zip(rows, sh)) / P * 100:5.1f}' for n in range(2, 10))
        print(f'{d:6} F={F} | {lag("population_best")} | {lag("land_km2")} | {ge}')

def sim(dirn):
    rows = []; ft = []
    for f in sorted(glob.glob(dirn + '/b*.json')):
        d = json.load(open(f)); prev = None; since = 0
        for c in d['dev']:
            since = since + 100 if c['F'] == prev else 0; prev = c['F']
            rows.append(dict(seed=d['seed'], y=c['y'], F=c['F'], since=since, lag=c['lag'], land=c['land'], within=c['within']))
        ft.append(d.get('firstTo', {}))
    q = lambda v: (lambda s: f'{st.mean(s):5.1f} [{s[int(.1 * (len(s) - 1))]:5.1f}-{s[int(.9 * (len(s) - 1))]:5.1f}]')(sorted(v)) if v else '   -'
    print('\nSIM by frontier age: mean [p10-p90] over world-centuries')
    print('F phase   n | people 0b | people 1b | people 2+b | land 2+b | within-realm 1+')
    for F in range(1, 11):
        for ph, ok in (('entry', lambda r: r['since'] == 0), ('late', lambda r: r['since'] > 0)):
            R = [r for r in rows if r['F'] == F and ok(r)]
            if R: print(f'{F} {ph:5} {len(R):3} | {q([r["lag"][0] for r in R])} | {q([r["lag"][1] for r in R])} | {q([r["lag"][2] + r["lag"][3] for r in R])} | {q([r["land"][2] + r["land"][3] for r in R])} | {q([r["within"] for r in R if r["within"] is not None])}')
    print('\nSIM years from the first century with F>=N to 50% / 90% of people at >=N (median [min-max], century resolution)')
    W = collections.defaultdict(list)
    for r in rows: W[r['seed']].append(r)
    for N in range(2, 10):
        a, b = [], []
        for L in W.values():
            L.sort(key=lambda r: r['y']); first = h50 = h90 = None
            for r in L:
                if r['F'] >= N and first is None: first = r['y']
                if first is None or r['F'] - N > 2: continue
                s = sum(r['lag'][:r['F'] - N + 1])
                if s >= 50 and h50 is None: h50 = r['y'] - first
                if s >= 90 and h90 is None: h90 = r['y'] - first
            if h50 is not None: a.append(h50)
            if h90 is not None: b.append(h90)
        f = lambda v: f'{st.median(v):4.0f} [{min(v)}-{max(v)}] n={len(v)}' if v else '-'
        print(f'age {N}: 50% {f(a)} | 90% {f(b)}')
    print('\nSIM first entrant per age (firstTo): years since previous age, share of people, pop rank')
    for k in range(4, 11):
        E = [t[str(k)] for t in ft if str(k) in t]
        G = [t[str(k)]['y'] - t[str(k - 1)]['y'] for t in ft if str(k) in t and str(k - 1) in t]
        if E: print(f'age {k}: n={len(E)} gap {st.median(G) if G else 0:4.0f} | share med {st.median([e["share"] for e in E]):.3f} | rank1 {sum(e["rank"] == 1 for e in E)}/{len(E)}, outside top3 {sum(e["rank"] > 3 for e in E)}')

if __name__ == '__main__':
    report(sys.argv[1]); sim(sys.argv[2])
