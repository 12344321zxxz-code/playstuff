# Formicarium: tech disparity, plan v2 (Nov 4, 2026, for Ariel's approval)

**Status:** proposal only. Nothing below is built. Main is at f127ba4: the v1 work is all switched off and the game plays as before.

## Why v1 got stuck
- Every v1 arm made the gap by slowing how fast knowledge spreads between realms: less pull, a cap on what a realm takes in, discovery that depends only on the realm itself.
- Once knowledge stops spreading, whoever is ahead stays ahead. Its better arms win wars, it grows into a giant, and the giant keeps the lead. The result: the biggest realm first 43–80% of the time, and too few different leaders.
- This happens because knowledge is the wrong lever. On Earth, knowledge did spread fast: India and China knew about railways and electricity within years. **What lagged was use.** The factories, railways and power lines had to be built and paid for, place by place.
- The sim has no gap in use at all. Step 0 showed that a district starts using an age within a few decades of its court knowing it, whatever the district can afford.

## The idea: know fast, build slow
Keep the knowledge system exactly as it is today: same pull, same pace, same leaders. Instead, make the industrial ages something a district must **build**, not just learn.
- **Capital stock:** from the age of steam, each district holds a stock of installed capital (works, rails, power).
- **What builds it:**
  - the district's own surplus, more where it has towns, trade and a port;
  - the court's share of revenue, which reaches a district according to how well-tied it is (the same tie used today, from distance, tongue and roads);
  - more where credit exists (banking, councils);
  - less in wartime.
- **What wears it down:** it wears out slowly; sacks and war damage destroy it; a colony or a protectorate has part of its surplus taken away.
- **Use age:** a district *uses* an industrial age only once its stock reaches that age's cost. The cost rises steeply: computers cost far more than steam engines. Until then the district lives one or more ages behind, however much its court knows. The existing "know vs use" rule then does the rest: its harvests, output and soldiers use only the arts of its own age.

### Why this should not make big realms stronger, and should weaken them
- **Leadership stays as it is.** Who reaches a new age first is still decided by the court's knowledge, which this does not touch. So biggest-first, distinct leaders and the pace of the ages should stay at today's values.
- **Giants pay to spread thin.** Their court revenue spreads over many poorly tied provinces, so the far provinces stay old-fashioned. Their armies raised there fight with the older arms.
- **Conquest pays less.** Taking backward land adds no factories, and war burns capital.
- **Small, urban, trading realms go furthest.** They can fully equip their districts first. This is the Netherlands or Britain pattern the creed asks for, and it comes out of each world's geography and trade, not a script.
- **Ages 1–5 can't change.** The rule starts at the age of steam, so every world plays out the same as today until its first industrial district.

### What the player sees
- Towns drawn in their *use* age (the `FX.lagShow` work, rewired).
- The realm page says "a third of their people live with steam; the rest still farm as their grandparents did".
- Chronicle lines: "The first railway in X", and "X knows how to build engines but cannot pay for them".
- The Look panel says why a district lags: no surplus, too far from the court, drained by an overlord.

## Steps
0. **Feasibility check, measurement only (one short session).**
   - At the frontier's ages 6–8, measure how much district surplus, town share, trade and tie vary.
   - If districts barely differ, a capital gate can't split them, and we stop here before building anything.
1. **Build it behind `FX.capital`, switched off.**
   - The stock, the use age, and `artsHere` reading the use age.
   - The measurements get a use version of every lag figure, plus a "people using railways / electricity / computers" figure.
   - **Unit tests:**
     - two districts that know the same but differ in surplus and tie get different use ages;
     - capital never changes what a court knows;
     - conquered land keeps its own stock;
     - off means the game is identical, bit for bit.
2. **Screen on 10 worlds.** Three or four settings of the cost curve and the investment rate. Pick the one closest to the targets that passes the big-realm guard.
3. **Only if the gap is still too small:** add the mildest v1 piece that helps, half-strength pull (`KN.pull = 0.02`), and re-run the big-realm guard. No anchor, no receipt cap, unless you say so.
4. **Confirm on 32 worlds.** Then the display, then your eye test on 3 worlds. Merge only if everything passes.

## Gates (32 worlds, against today's main)
- **Disparity:**
  - people 2+ ages behind *in use* a century into ages 6–8: 15–30%;
  - a gap in the use of railways, electricity and computers between the top and bottom fifths that lasts beyond a century.
- **Big-realm guard** (new; each must be no worse than today, within noise):
  - biggest realm first into ages 6–8: today 0.36, fail above 0.41;
  - distinct leaders, ages 4–9: today 2.43, fail below 2.3;
  - the largest realm's share of people in ages 5–8: today 0.23;
  - how closely size ranks match knowledge ranks: today 0.69;
  - conquests per century: not up.
- **Pace:** the steps 6→7 and 7→8 shorter than 5→6 (today's 255/190/100 already passes this). Worlds reaching steam down by no more than 0.1.
- **Population:** peak and population at each age's start no lower than 10% below today. Industry now only lifts people where it is built.
- **Turnover:** within ±5 points.
- **Ages 1–5:** identical (by construction).
- **Engineering:** replay and save identical; tick cost up by at most 5%.
- **Stop rule:** drop it if the industrial core never spreads (the world stays one rich island forever), if steam stalls, or if any big-realm guard fails.

## Risks
- **Population:** the industrial food boom becomes local. If peak population drops too far, the investment rate must rise, not a fudge factor.
- **Colonies:** the overlord's take could make every colony permanently backward. History says mostly yes until independence, but watch that independence still happens.
- **Overlap with the fiscal state:** court investment draws on the same revenue as armies, so a realm at war builds less. That is intended, but it might slow leaders too much.

## Cost
- Step 0: about an hour.
- Steps 1–2: one session plus 10-world screens (about 25 minutes each on GitHub).
- Step 4: a 32-world run (about 30 minutes) plus the display work.
