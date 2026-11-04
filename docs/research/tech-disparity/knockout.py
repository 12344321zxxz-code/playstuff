#!/usr/bin/env python3
"""Knock-out tests of the tech-disparity diagnosis (Nov 4, 2026).
usage: python3 knockout.py <arm dir> [<arm dir> ...]   (each dir holds b<seed>.json from tools/stats.mjs)
Per arm, pooled over worlds: people at the frontier age and 2+ ages behind, in the entry century and later
centuries of ages 5-8; median years between frontier ages (4->5 ... 7->8); share of worlds reaching ages 6 and 8;
biggest realm first into ages 6-8; peak population."""
import json, glob, sys, os, statistics as st
def arm(d):
    W = [json.load(open(f)) for f in sorted(glob.glob(os.path.join(d, 'b*.json')))]
    cell = {}
    for w in W:
        prev = None; since = 0
        for c in w['dev']:
            since = since + 100 if c['F'] == prev else 0; prev = c['F']
            if 5 <= c['F'] <= 8: cell.setdefault((c['F'], since > 0), []).append((c['lag'][0], c['lag'][2] + c['lag'][3]))
    gaps = {}
    for w in W:
        ft = w.get('firstTo', {})
        for k in range(5, 9):
            if str(k) in ft and str(k - 1) in ft: gaps.setdefault(k, []).append(ft[str(k)]['y'] - ft[str(k - 1)]['y'])
    big = [w['firstTo'][str(k)]['rank'] == 1 for w in W for k in (6, 7, 8) if str(k) in w.get('firstTo', {})]
    reach = lambda k: sum(1 for w in W if any(c['F'] >= k for c in w['dev'])) / max(1, len(W))
    return W, cell, gaps, big, reach
for d in sys.argv[1:]:
    W, cell, gaps, big, reach = arm(d)
    out = [f"{os.path.basename(d.rstrip('/')):16} n={len(W):2}"]
    for F in range(5, 9):
        for late in (False, True):
            v = cell.get((F, late))
            out.append(f"{F}{'l' if late else 'e'} at {st.mean(a for a, _ in v):3.0f} 2+ {st.mean(b for _, b in v):4.1f}" if v else f"{F}{'l' if late else 'e'} -")
    out.append('gaps ' + '/'.join(str(int(st.median(gaps[k]))) if k in gaps else '-' for k in range(5, 9)))
    out.append(f"reach6 {reach(6):.2f} reach8 {reach(8):.2f} big1st6-8 {sum(big)/max(1,len(big)):.2f} peak {st.median(w['peakPop'] for w in W)/1e6:.1f}bn")
    print(' | '.join(out))
