#!/usr/bin/env python3
"""Gates of the tech-disparity plan (docs/manager/tech-disparity-plan.md), per arm (Nov 4, 2026).
usage: python3 gates.py <base dir> <arm dir> [<arm dir> ...]   (each dir holds b<seed>.json from tools/stats.mjs)
The first dir is the baseline; worlds are paired by seed, so compare arms on the same seeds.
Columns, pooled over worlds:
  2+e / 2+c: people 2+ ages behind in the entry century / the century after entry, ages 6-8 (target 15-30% a century in)
  tc2+c:     the same a century in, with the countryside counted one age behind from district age 6 (bench2 cent2.tc)
  coh100:    the fixed entry cohort of ages 6-8, people 2+ behind at +100 years
  gaps:      median years 5->6 / 6->7 / 7->8 (gate: 6->7 and 7->8 shorter than 5->6)
  big1:      biggest realm first into ages 6-8 (gate: <= base + noise, fail above 0.45); lead: distinct first realms, ages 4-9
  a3-5:      people at the frontier / 2+ behind, ages 3-5 (gate: no material worsening)
  reach6:    worlds reaching steam (gate: not down more than 0.1); pop6: median people at the age of steam's entry
  to6-7:     turnover at ages 6-7 (to6F, to7F) (gate: within +-5 points); ms: ms per tick (gate: <= +5%)
  rail8/elec8: share of people in realms that use railways / electricity while the frontier is at ages 7 / 8"""
import json, glob, sys, os, statistics as st
def load(d): return {int(os.path.basename(f)[1:-5]): json.load(open(f)) for f in glob.glob(os.path.join(d, 'b*.json'))}
def m(v, f='{:.1f}'): return f.format(st.mean(v)) if v else '-'
def arm(W):
    e2, c2, tc2, coh, a35a, a35b = [], [], [], [], [], []
    for w in W:
        prev = None; since = 0
        for c in w.get('dev', []):
            since = since + 100 if c['F'] == prev else 0; prev = c['F']
            if 6 <= c['F'] <= 8 and since == 0: e2.append(c['lag'][2] + c['lag'][3])
            if 6 <= c['F'] <= 8 and since == 100: c2.append(c['lag'][2] + c['lag'][3])
            if 3 <= c['F'] <= 5: a35a.append(c['lag'][0]); a35b.append(c['lag'][2] + c['lag'][3])
        prev = None; since = 0
        for c in w.get('cent2', []):
            since = since + 100 if c['F'] == prev else 0; prev = c['F']
            if 6 <= c['F'] <= 8 and since == 100: tc2.append(c['tc'][2] + c['tc'][3])
        for k in ('6', '7', '8'):
            a = (w.get('cohort') or {}).get(k, {}).get('at', {}).get('100')
            if a: coh.append(a['lag'][2])
    gaps = {}
    for w in W:
        ft = w.get('firstTo', {})
        for k in (6, 7, 8):
            if str(k) in ft and str(k - 1) in ft: gaps.setdefault(k, []).append(ft[str(k)]['y'] - ft[str(k - 1)]['y'])
    big = [w['firstTo'][str(k)]['rank'] == 1 for w in W for k in (6, 7, 8) if str(k) in w.get('firstTo', {})]
    lead = [len({w['firstTo'][str(k)]['id'] for k in range(4, 10) if str(k) in w.get('firstTo', {})}) for w in W if w.get('firstTo')]
    reach6 = sum(1 for w in W if any(c['F'] >= 6 for c in w.get('dev', []))) / max(1, len(W))
    pop6 = [w['ageEntry']['6']['people'] for w in W if '6' in (w.get('ageEntry') or {})]
    to = [w[k] for w in W for k in ('to6F', 'to7F') if w.get(k) is not None]
    ms = [w['msPerTick'] for w in W if w.get('msPerTick')]
    use = {}
    for w in W:
        for F, k in (('7', 'railways'), ('8', 'electricity')):
            g = (w.get('gate') or {}).get(F, {}).get(k)
            if g: use.setdefault(k, []).append(100 * g.get('has', 0))
    side = {}
    for w in W:
        for k in ('tallShare', 'conquests', 'colIndep', 'colonialWars', 'to6Col', 'to7Col', 'peakPop', 'empireLongest'):
            if isinstance(w.get(k), (int, float)): side.setdefault(k, []).append(w[k])
        prev = None; since = 0
        for c in w.get('cap', []):
            since = since + 100 if c['F'] == prev else 0; prev = c['F']
            if 6 <= c['F'] <= 8:
                side.setdefault('top', []).append(c['top'])
                if since == 100: side.setdefault('k2', []).append(c['klag'][2] + c['klag'][3]); side.setdefault('below', []).append(100 * c['below'])
    S = {k: (st.mean(v) if v else None) for k, v in side.items()}
    return dict(side=S, n=len(W), e2=m(e2), c2=m(c2), tc2=m(tc2), coh=m(coh), gaps='/'.join(str(int(st.median(gaps[k]))) if k in gaps else '-' for k in (6, 7, 8)),
                big1='{:.2f}'.format(sum(big) / max(1, len(big))), lead=m(lead, '{:.2f}'), a35=m(a35a, '{:.0f}') + '/' + m(a35b), reach6='{:.2f}'.format(reach6),
                pop6=('{:.0f}m'.format(st.median(pop6) / 1e3) if pop6 else '-'), to=m(to), ms=m(ms, '{:.2f}'), rail=m(use.get('railways', []), '{:.0f}'), elec=m(use.get('electricity', []), '{:.0f}'))
B = load(sys.argv[1]); seeds = sorted(B); side = []
print(f"{'arm':14} n  2+e  2+c  tc2+c coh100 gaps(6/7/8)   big1 lead  a3-5(at/2+) reach6 pop6   to6-7 ms   rail7 elec8")
for d in sys.argv[1:]:
    A = load(d); W = [A[s] for s in sorted(A) if s in B or d == sys.argv[1]]
    r = arm(W)
    S = r['side']; f = lambda k, p='{:.2f}': (p.format(S[k]) if S.get(k) is not None else '-')
    side.append(f"{os.path.basename(d.rstrip('/'))[11:]:14} tall {f('tallShare')} top6-8 {f('top')} conq {f('conquests','{:.0f}')} colWars {f('colonialWars','{:.1f}')} colIndep {f('colIndep','{:.1f}')} to6Col {f('to6Col','{:.1f}')} to7Col {f('to7Col','{:.1f}')} peak {f('peakPop','{:.0f}')} know2+c {f('k2','{:.1f}')} belowUse {f('below','{:.1f}')}")
    print(f"{os.path.basename(d.rstrip('/'))[11:]:14} {r['n']:2} {r['e2']:>4} {r['c2']:>4} {r['tc2']:>5} {r['coh']:>6} {r['gaps']:13} {r['big1']:>5} {r['lead']:>4} {r['a35']:>11} {r['reach6']:>6} {r['pop6']:>6} {r['to']:>5} {r['ms']:>5} {r['rail']:>5} {r['elec']:>5}")
print('side effects (tall: frontier realm-years outside the top 3; top6-8: largest realm share of people; know2+c: 2+ behind in knowledge a century in; belowUse: % people living below what they know):')
print('\n'.join(side))
