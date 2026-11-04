# Council verdict: tech disparity (Nov 4, 2026)

## How it was run
- **Inputs:**
  - Claude's fixes doc (`formicarium-tech-disparity-fixes`);
  - ChatGPT's independent review ("Formicarium Independent Tech Disparity Review", Nov 4);
  - the knock-out evidence (`formicarium-tech-disparity-evidence`);
  - the blind-spots doc;
  - the code.
- **Seats:** systems designer, economic historian, player advocate, engineer, devil's advocate. All are Claude,
  so the panel may have converged too easily (see the counter-view at the end).
- **Scope:** the tech disparity. Peopling counts only where it bears on it.

**Anonymous cross-review, average rank (1 = best):**

| Seat | Average rank |
|---|---|
| Systems designer | 1.6 |
| Engineer | 2.8 |
| Devil's advocate | 2.8 |
| Historian | 3.6 |
| Player advocate | 4.2 |

## Verdict
Fix the two confirmed brakes with the smallest mechanisms that already exist in the code, and measure
before and around them:
1. **One budget for all incoming knowledge,** tied to a realm's own discovery (absorptive capacity). Laggards
   can copy the guns but don't gain the age.
2. **Discovery anchored to the realm, not to the world:** skilled people and intensity, not headcount
   against the world's 25th percentile.

Gate every step on leadership, the ancient and medieval ages that already work, and population at matched
pace. The folk field, more founders, language friction and relabelling the ages are not part of this fix.

## Top ideas
1. **A single receipt budget** (systems designer; the best single idea for 3 of 5 reviewers):
   - `pull`, letters and `meet()`'s knowledge all charge one budget, `KN.M` × the realm's own discovery;
   - arts still pass through `learn()`;
   - about 5 lines of code; arguably a bug fix, since `pull` bypasses the budget today and `meet()` adds
     0.006 × gap with no limit.
   - **Engineer's catch:** the budget doesn't exist below age 5 (it is infinite there) while `pull` starts
     at age 4. So age 4 needs its own cap.
2. **Remove the world anchor** (systems designer, engineer, historian):
   - own discovery = k × skilled people^λ × intensity, with λ about 0.5 applied inside the realm;
   - intensity is town share, schools, computers, networks, and coal in the steam age;
   - `dkRef` and `fitRef` stop being brakes and stay as measures.
3. **Measure before building** (engineer, devil's advocate):
   - retag `pull` in the knowledge ledger (it is filed as "letters");
   - record each frontier entrant's size rank 100 years before entry;
   - break down the both-off arm (people 2+ behind excluding the top realm; where the lost billion went);
   - rerun the knock-outs on 32 worlds;
   - knock out `meet()` and conquest uptake too.
4. **Compounding** (missed by everyone in round 1; raised in review): a realm's own stock should feed its
   discovery, or the frontier never truly speeds up. Test it as an arm on top of idea 2.
5. **Legibility** (player advocate, ranked low as a fix but kept):
   - districts drawn at their own age;
   - Knowledge on the main lens bar;
   - headline chronicle events when realms two ages apart meet, and first contact with isolated landmasses;
   - an acceptance test: can Ariel name a leader, a laggard and why, from the map alone?
6. **Better gates** (several):
   - leadership turnover (distinct leaders across ages 5–9), not only a ceiling on biggest-first;
   - a chance baseline for biggest-first, given how few modern contenders there are;
   - a regression gate so ages 1–5 stay as they are;
   - population judged at age entry, not at peak.

## Real disagreements
1. **Delete `pull`, or charge it to the budget?**
   - With `pull` off alone, biggest-first rises from 0.26 to 0.50 and late gaps shrink, so `pull` is also a
     size brake.
   - Settle it with arms: budget-charged against deleted.
2. **Capacity: a new slow stock, or reuse own discovery?**
   - The historian wants a stock fed by surplus per head, and Allen's factor prices.
   - Systems and engineering want own discovery as the capacity, with nothing new.
   - Start with own discovery. Add the stock only if latecomers jump too fast. The historian's own test:
     low-capacity peoples must still be behind 100 years into age 7.
3. **Display first, or mechanics first?**
   - Display is cheap and doesn't interfere with the sim, so build it alongside, not first.
4. **Is "2+ ages behind" the right modern yardstick?**
   - The historian's review points to Comin and Hobijn: after 1850 technologies *arrived* quickly
     everywhere; what diverged was how intensely they were used.
   - So add use per head (installed arts, urban share, surplus per head) as a second measure. Don't chase
     the 41–69% figure alone.

## Riskiest assumption
**That size and intensity can be separated, and that big-first is caused by size and not by conquest after
leading.** If leaders become big by conquering, every discovery formula aims at the wrong place and the fix
belongs in war and empire.

**Test before building (both cheap):**
- correlation on `b2-base` of realm size with town share and skilled people per head, in ages 6–8;
- each frontier entrant's size rank 100 years before entry.

## Cut or deferred
- **Folk field (P2 / ChatGPT Fix 5):** to its own peopling project. 82–97% of land is already in realms by
  steam, so it can't hold the modern laggards.
- **More founders (P1) and language friction (P4):** deferred. Ages 1–5 already work. Language can come
  back later as "interpretive capacity" inside the receipt budget.
- **Relabelling ages by practised arts (ChatGPT Fix 6):** rejected as a fix ("don't win by changing the
  legend"). Kept as a secondary measure.
- **Province investment (P7) and the Allen factor-price term:** deferred. The `adopt` knock-out barely moved
  people 2+ behind. Revisit if the intensity measure lags.
- **Colonial extraction and erosion by undercutting:** deferred. Too many new parameters before the cause
  is pinned.

## Next step
**Step 0, measurement only, no game change:**
1. retag `pull`;
2. log size rank before frontier entry;
3. measure the size–intensity correlation on `b2-base`;
4. break down the both-off arm;
5. rerun the 4 knock-outs on 32 worlds, plus `meet()` and conquest-uptake knock-outs.

**Then Step 1** (`FX.recv`, the receipt budget, including age 4) and **Step 2** (`FX.anchor`, discovery
from skilled people and intensity), as separate arms and combined. Each is screened on 10 worlds and
confirmed on 32 against the gates above. Display (P8) runs alongside.

## Counter-view (chair)
- All five seats are Claude and converged quickly on the receipt budget.
- **The strongest dissent:** the sim's age-level convergence may be roughly historical (Comin and Hobijn),
  and the real gap is in intensity of use and income. Then the main build would be a use-per-head loop
  (technology → surplus → capacity), not fewer catch-up channels.
- Step 0's intensity measure, and comparing it to history, is how to tell.
