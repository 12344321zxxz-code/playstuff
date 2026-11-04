# Formicarium: tech disparity, plan v2 (Nov 4, 2026, for Ariel's approval)

**Status:** proposal only; nothing below is built. On main the v1 work is all switched off and the game plays as before.

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

## Second- and third-order effects (Ariel, Nov 4: "start considering second and third order effects")
The district's age (`s.lvl`, through `artsHere`) is read in more places than it looks. A capital gate on it reaches all of them. The effects, traced through the code:

| Where the district's age is read | What capital would change first | What that changes next, and after | Decision |
|---|---|---|---|
| **Food and population.** Railways, sanitation, irrigation, genetics and the rest lift a district's harvest. | Backward districts grow less. | The leader's core booms while laggards don't, so the leader becomes the *biggest by people* without conquering anything. "Biggest first" gets worse through population alone. Migration then pulls people into the industrial core and the periphery empties (the stop rule's "starving periphery"). | **Keep** (it is what use means). Watch it: the leader's people share, migration into cores and periphery population are on the gate list. |
| **Towns.** Line 844: urban growth reads the arts in use. | Backward districts stay rural. | Rural districts find less (discovery counts townspeople), so laggard *courts* learn slower as well. The knowledge gap widens on its own, a feedback loop. | **Keep, but watch**: if the knowledge gap grows by itself, leadership metrics can drift. |
| **Discovery.** Schools, printing, computers and networks multiply what a district finds. | The best-equipped realm finds faster. | Equipment feeds knowledge, and knowledge feeds equipment: a loop that favours whoever industrialises first, which is often the big core. | **Cut**: discovery reads what the district *knows*, not what it has built. This keeps who-leads separate from who-builds. |
| **Arms.** A district fights with its own age's weapons (`KN.arm`). | Armies raised in backward provinces are weaker. | Giants get weaker, which is good. But a leader with a fully equipped core beats laggards more easily: colonial conquest. That makes big empires *stronger*. | **Keep, and watch** conquests per century and the largest realm's share. If conquests rise, the fix is on the defence side: districts defend with their own arms, so this cuts both ways. |
| **Colonial independence** (`capture.js`: a colony breaks away by its own development). | Colonies stay backward. | Decolonisation freezes and colonial empires never break up: big empires last forever, and turnover drops. | **Cut**: independence reads the knowledge age, not the use age. Colonies learn and agitate even when they are poor (history agrees). |
| **Fiscal state.** Towns and trade are taxed more easily. | Industrial districts pay more. | Rich realms get richer, so they field bigger armies and build more capital. A loop for the leader. | **Watch.** The cap is that court investment competes with armies for the same revenue, so a realm at war builds less. |
| **Trade** (coal and goods demand). | Backward districts buy less coal. | Fewer trade ties mean less catch-up and fewer carriers for the laggards, so their *knowledge* falls behind too. | **Watch** ties per realm in the screens. |
| **Smoke, nuclear, magic** | Less smoke where nothing is built. Nuclear arms are realm-level, so no change. Magic reads the realm's age, so no change. | Minor. | Nothing to do; confirm in the screens. |

**Rules this adds to the plan:**
1. **One new number, the fewest readers.** The capital stock feeds only food, towns and arms (what "use" means). Discovery and colonial independence keep reading knowledge. Every reader is listed in the code comment and in `formicarium-game`.
2. **Replace, don't stack.** Province catch-up already has its own brake (`uptake`: town share, cohesion, orthodoxy), and capital covers the same ground. From the age of steam, the capital gate replaces `uptake` instead of adding to it. If v2 passes, the v1 code (`FX.recv`, `FX.anchor` and their knobs) is deleted, not kept switched off.
3. **Every chain gets a meter.** The screens report, for each row above:
   - the leader's people share and the periphery's population;
   - migration into cores and the urban share by quintile;
   - conquests per century and colonial independences;
   - revenue per head by quintile and ties per realm.
   A gate passing while one of these drifts badly is a fail.
4. **Knock out each link once.** At the 32-world stage, run the winner with each kept reader off in turn (food, towns, arms). That shows which chain does the work and which only adds side effects; cut the ones that only add side effects.

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
- **Side-effect meters:** the list in rule 3 above, none drifting badly.
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
