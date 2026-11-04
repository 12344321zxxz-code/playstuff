Response to “Council verdict: tech disparity” (4 Nov 2026). For Claude’s
final actionable implementation plan. Reviewed against the attached
tech-disparity code snapshot, original brief, the prior independent
report, and the two historical calibration reports.

# Decision in one paragraph

Keep the council’s narrow experimental program: instrument first, then
test a unified assimilation budget and a realm-local discovery function
independently and together. Do not adopt either proposed implementation
literally yet. Receipt capacity proportional only to a realm’s own
discoveries may prevent precisely the rapid catch-up of prepared
latecomers that the game needs; not all import channels are presently
accounted for; and changing discovery without examining the
already-existing knowledge-carrier gates may leave large-realm
leadership untouched. The strongest improvement would be to test two
outcomes separately: (i) who can develop new knowledge, and (ii) who can
reproduce and use technologies at scale. This is a design requirement,
not permission to make the game a technology minigame.

# Verdict by topic

| **Council decision**                   | **My position**           | **Required adjustment**                                                                        |
|----------------------------------------|---------------------------|------------------------------------------------------------------------------------------------|
| Measure first; use matched worlds      | Strong agreement          | Reuse available rank100; add absorption/physical-use and gate statistics.                      |
| Budget pull + letters + meet           | Agree as a diagnostic arm | Single settlement-year ledger; log other channels; compare a minimal nonzero-capacity variant. |
| Replace global discovery anchor        | Strong agreement          | Test residual carrier/arts gates and size-invariance; leave compounding separate.              |
| Use own discovery as the sole capacity | Disagree                  | Own discovery is one input, not the definition of absorptive capacity.                         |
| Defer folk field and extra founders    | Agree for this sprint     | Do not infer realm-map coverage means homogeneous subjects.                                    |
| Deployment intensity is secondary      | Partly disagree           | Make a usable proxy in Step 0, alongside age lags, and preserve both.                          |

# 1 Where the council is right

- **The two-sided diagnosis is supported by code.** The print-and-after
  > cap converts raw discovery to R × (raw/R)^0.1 above a world-wide
  > reference, with a separate peer-relative fit multiplier
  > (src/people.js:603–607, 634; refs at 450–452). The trade-linked
  > KN.pull transfer is additive and uncharged to the existing letters
  > budget (635–638). These are plausible brakes on frontier lead and
  > barriers to enduring gaps.

- **Its skepticism about a peopling-first fix is justified.** A resident
  > substrate would substantially improve prehistory, minorities, and
  > nonstate farmers, but it is not a cost-effective first response to
  > modern knowledge homogenization. More founders and a global language
  > penalty are at most supporting mechanisms, not the first fix.

- **The use-versus-arrival counter-view is especially important.**
  > Comin–Mestieri (2018) distinguishes converging adoption lags from
  > divergence in intensity of use; they find adoption timing important
  > in nineteenth-century income divergence and penetration differences
  > important in the twentieth. Neither a zero-gap court-age score nor
  > the historical age-band benchmark directly measures productive
  > diffusion. \[H1\]

# 2 Corrections I would insist on before implementation

## 2.1 “One receipt budget” is not a five-line change

The named receipt flows are spread across the annual court calculation,
trade encounters, migration and local transfer. In this snapshot: pull
and letters enter at src/people.js:635–638; meet() at 114–125; migrants
at src/migrate.js:97; conquered districts pass knowledge upward through
“prov” at src/people.js:533–538; ruins at 576; direct conq only when
FX.know is disabled at 352 and 418; and player gifts at 1008. Applying
KN.M to three calls without auditing the others would make “single
budget” an inaccurate claim and could merely redirect the dominant
pathway.

There is also a timing problem. Trade encounters execute on ticks in
world.js:87 and people.js:277–296, while peopleSteps() advances through
a generator over the ticks of a year (world.js:91–100). The current
budget is calculated inside cultYear() after census aggregation
(people.js:634). A correct annual cap therefore needs a deterministic
per-realm ledger with a stable year boundary and explicit used/remaining
state; otherwise outcomes can depend on whether the caravan arrives
before or after court accounting, whether a realm splits during the
year, or how the generator is scheduled. This is an implementation risk,
not a demonstrated current bug in the existing uncapped flow.

- **Suggested rule.** Track proposed imports, accepted assimilation and
  > unassimilated exposure separately. Define clearly which imports
  > count: meet / pull / letters / migrants / provincial experts /
  > ruins; exempt deliberate godly gifts by design but label them. Sum
  > accepted flows against one precommitted annual assimilation budget.
  > Apply identical ordering semantics across browser and headless runs.

- **Suggested test.** Total accepted imported knowledge must never
  > exceed the recorded budget (apart from documented exceptions); the
  > knowledge ledger must reconcile to actual Δknow. Replays and
  > save/load at different points in the year must agree.

## 2.2 Own discoveries are a dangerous stand-in for absorptive capacity

The proposed budget is KN.M × own discovery. That has attractive
parsimony, but it introduces a circular dependency: if a realm has weak
endogenous research, it cannot learn much from abroad; inability to
learn can keep it poor and prevent the research base from ever
developing. This is particularly problematic for an advanced trading
port, migrating specialists, or a state that deliberately imports
machinery before it invents anything. The rule could make an isolated
poor society and a rich, connected but noninnovating latecomer
indistinguishable.

Do not build a new slow stock yet. Test the council’s minimalist formula
against a second, still-low-cost capacity derived from distinct existing
conditions: own discovery plus an independently measured base of skilled
urban labour, schools, trade reach, productive surplus, and functional
precursor arts. A rolling capacity measure can smooth one-year shocks.
Use mechanisms already present rather than a flat “every realm can catch
up” floor. In the experiment, the independent base should be nonzero
only where the society has real carriers or productive assets.

- **Failure scenario to simulate.** Two realms have the same small
  > own-discovery output; one has ports, schools, coal imports and many
  > workshops, the other has none. If they receive foreign industrial
  > knowledge at equal rates, capacity has been defined incorrectly.

## 2.3 The carrier gate can survive both fixes and still favour large realms

The council underweights a separate scale mechanism. \`canLearn()\`
requires c.tech+1 to reach an art’s tier, its prerequisite arts, usable
conditions, and—at tier 3+—c.carry ≥ 1.5 × carriersFor(tier)
(src/tech.js:112–120). Modern carrier requirements rise sharply: tiers
6, 7, 8 and 9 use 7,000, 27,000, 85,000 and 240,000 counted carriers
respectively before the 1.5 multiplier (tech.js:97–103). \`c.carry\`
includes the realm’s skilled labour plus some of its trading partners’
skilled labour (people.js:635–641).

This may represent a desirable global technical workforce, but it can
also defeat the proposed small-state innovation test, particularly for
advanced arts, regardless of the reform to \`dkRef\`. Record, by tier
and realm-size quantile, how often a realm is otherwise eligible but
fails only the carrier check. Audit the requirement before tuning
discovery further. If it binds too often, test counting connected
external expertise or multi-realm production networks rather than
deleting the requirement outright.

## 2.4 “They can copy guns but not gain the age” needs a precise meaning

The existing art-sharing path is gated by canLearn(c, art, true), which
still limits foreign acquisition to at most one tier above the realm’s
current tech and requires prerequisites and carriers (src/people.js:125;
src/tech.js:112–120). A realm several ages behind cannot automatically
acquire a modern industrial weapon merely because the general knowledge
receipt budget is low. Conversely, possessing a realm-level art is not
the same as equipping a significant fraction of its districts or troops:
artsHere() conditionally gates district effects by s.lvl
(people.js:597–602), but does not count installed units of equipment.

Define three existing-data observables before changing any mechanics:
(a) exposure/contact to an art; (b) ability to make or maintain
it—requirements, carriers, institutions; (c) effective use, measured
initially by district-level eligible population and production/war
effects. This is not a request to relabel the ages as a success
criterion. It is the minimum needed to know whether the intended
asymmetry actually exists.

## 2.5 A historical target is already missed before steam

The council writes that ages 1–5 “already work.” This is acceptable as
shorthand for the broad pattern, not as a literal regression rule. In
the supplied 32-world summary, the share at frontier age in late age 5
is 81% versus the research report’s 48–63%—already too homogeneous,
while age-3 entry has excessive lag. \[B1, T1\] The regression gate
should read “do not materially worsen the preindustrial scoreboard,” not
“preserve every age-1–5 number.” A receipt budget acting at age 4 may
actually improve late age 5; allow that, while protecting the already
plausible ranges.

## 2.6 The leadership check is observational, not causal

The council’s proposed size rank 100 years before frontier entry is
useful, but that field is already present: tools/stats.mjs:18 records
FIRST\[t\].rank100 using rankAgo() from tools/devmeter.mjs:35–36. First
check the saved run output instead of adding the same measurement. A
second useful variable is rank at first locally demonstrated
prerequisite or key productive art, not just at age threshold. A leader
might be large because it conquered after acquiring its advantage, or it
might have become a leader because its size enabled a research network;
rank100 alone cannot tell those stories apart.

Use size, skilled population per head, \*total\* skilled workforce,
town-network concentration, trade ties, and age-entry timing as
trajectories around leadership. Re-run the invariance test
(tools/invariance.mjs) after changing discovery: mechanically splitting
one functionally connected area into two states should not grant an
unearned explosion in discoveries or foreign-receipt allowances merely
because it now has two labels.

## 2.7 Be cautious about adding an explicit knowledge-compounding multiplier

The current district discovery contribution already benefits from urban
share, markets, trade, writing, schools, printing, computers, networks
and surplus (people.js:539). Simply multiplying it by c.know could
double-count technological complementarities, destabilise later ages,
and force every frontier to accelerate regardless of ecology. First
remove the world reference and observe whether existing
complementarities produce endogenous acceleration. If not, add
compounding only through measured productive means—e.g., machine
tools/energy/communication making research more effective—not a direct
“higher age = faster research” term.

# 3 Additional measurements with unusually high value

| **Measure / cheap implementation**                                                            | **What it rules out**                                                                                        |
|-----------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| Every import channel: proposed, accepted, rejected; cap use by year, age and realm            | A “fix” that only shifts knowledge from pull to migrant, meet or ruin channels.                              |
| Reason codes for canLearn failures, especially carrier-only, prerequisite-only and coal-only  | A discovery reform that changes c.tech but leaves operational frontier arts locked behind size or resources. |
| Separate court age, district use-eligibility, and per-capita use proxies                      | A higher historical age gap that produces no differences in actual industry or military capacity.            |
| Fixed entry-cohort or standardized-population lag, plus contemporaneous lag                   | A gap that appears to improve because poor laggards die, are absorbed, or fail to industrialize.             |
| Raw discovery, net own after cap, imported assimilation, Δknow; each per capita and in totals | A frontier that “speeds up” only because the world’s whole technology calendar has shifted.                  |
| Within-realm population behind, with urban–rural split and coast/interior differences         | The existing one-age-per-district model hiding heterogeneity inside large states.                            |

Caution on the simplest “use intensity” proxy: src/devmeter.mjs:60–62
already calculates concentration of urban population living in districts
whose \`s.\_A.engines\` is active. This is useful but is not a measure
of engines, output or installed capital per head. Call it “population
eligible for engine use” (or similar), not “engine intensity.” More
detailed productive-use modelling should remain a separate decision
after the measurement arm.

A measurement inconsistency is worth documenting:
tools/devmeter.mjs:33–46 uses a 0.5% population-share frontier in its
decade observations and a 1% frontier in the century lag statistics.
Both may be justified for different purposes, but any combined
time-to-frontier or leadership statistics must state which definition
was used. Run both cutoffs as sensitivity checks.

# 4 A leaner experimental decision tree for Claude

Keep same-commit paired seeds, a fast 10-world screen and 32-world
confirmation, stratified by magic/nuclear effects and stage rather than
calendar date. More arms only where they can settle a genuine
disagreement:

| **Arm**               | **Change from baseline**                                                                          | **Decision answered**                                                                          |
|-----------------------|---------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------|
| 0 / instrumentation   | No mechanics changes; re-use rank100; add receipts, carrier gates and use proxy                   | Is the reported collapse genuine knowledge, production, or population-composition convergence? |
| 1a / receipt-minimal  | One budget = M × own discovery, account for all named import channels                             | Does the council’s parsimonious idea help or trap low-discovery realms?                        |
| 1b / receipt-capacity | Same budget architecture; capacity includes independently grounded local skills and installations | Do latecomers need a path that is not self-discovery?                                          |
| 1c / pull off         | Remove KN.pull, keep other channels, with matching ledger                                         | Is the pull corrective patch necessary or redundant?                                           |
| 2 / anchor only       | Realm-local discovery formula; old import system                                                  | Does frontier speed and leader diversity improve without slowing world progress?               |
| 3 / joint             | Best receipt variant + best anchor variant                                                        | Does the interaction pass pace, dispersion, population and leader gates?                       |
| 4 / conditional       | Only if joint fails: revise carrier networking or introduce installed-capital intensity loop      | Which remaining mechanism actually prevents useful disparities?                                |

Report both chronological and age-matched results; at each new frontier
entry inspect +25, +50, +100 years or matched fractions of its duration.
Include a “hold ages fixed” reading of productive use: if all realms
remain court age 7 but only a small minority of people actually run
railways/electricity, a pure age-gap target may still indicate
convergence while the world is meaningfully unequal. Conversely, if
fewer states reach age 7 but the gap has no agricultural, fiscal or
military consequences, the intervention is cosmetic.

# 5 Safeguards and what I would defer

- **Protect causal clarity.** Do not simultaneously add a new stock,
  > peopling field, language tax, factor-price rule, and
  > industrial-deployment expenditure gate. First choose one receiver
  > arm, one discovery arm, and the precise metric on which they are
  > expected to matter.

- **Do not use realm-map coverage to dismiss internal
  > underdevelopment.** Large swathes of land can be politically claimed
  > while peasants remain low-capacity subjects. The reported 82–97%
  > realm coverage is therefore not evidence that the folk field is
  > irrelevant to future within-realm modelling; it is evidence that a
  > purely \*unclaimed\* folk field is not a short-term modern disparity
  > fix. Keep the field for its independent peopling project.

- **Do not optimize to 1950’s age-8 69% point.** The technology report
  > explicitly depends on a debatable age boundary, and the brief itself
  > gives a radically lower alternative if the frontier is coded age 7.
  > Prioritize whether disparity can persist and be historically
  > intelligible under matched frontier definitions. \[B1, T1\]

- **Stop if the trade-off is catastrophic.** Any arm that creates a
  > larger late-modern lag only by preventing steam from arriving,
  > starving peripheral populations, making all modern leaders giants,
  > or destroying political turnover should fail even if the
  > historical-gap statistic improves.

# 6 Suggested instruction to append to Claude’s final plan

“Keep the two-mechanism plan but do not code KN.M × own discovery as the
sole transfer capacity until tested against a version that also
recognizes existing locally usable skills and industrial preconditions.
Implement a single deterministic receipt ledger that accounts for every
non-own knowledge channel, including contacts across ticks, migration
and inherited provincial expertise; treat special interventions
explicitly. Reuse rank100 already recorded in stats. Instrument canLearn
carrier/prerequisite failures and practical use per head, not just
court-age spread. Test the original receipt budget, its capacity
variant, no-pull, realm-local discovery, and the best joint arm on
matched seeds; evaluate actual capabilities, population composition,
frontier acceleration, and the probability that smaller connected realms
lead. Defer world peopling, new institutional stocks and direct
knowledge compounding unless these experiments expose a remaining
mechanism.”

# Evidence and provenance

Code refers to the user-supplied \`playstuff-tech-disparity.zip\`
snapshot, not to any later commit. I inspected the attached council
verdict and the earlier independent report. The council cites a separate
“tech-disparity-evidence” knockout study and \`b2-base\` arms; those
underlying run files were not present in this attached snapshot. Its
quoted numerical knockout effects are thus treated as council-reported
results rather than independently reproduced findings. No fresh 32-world
simulation was run for this memo.

\[B1\] “Formicarium: independent review brief for ChatGPT: tech
disparity” (4 Nov 2026), §§3–4. \[T1\] “Global technology inequality,
3000 BC–2000 AD: a numerical calibration” (supplied). \[P1\] “Peoples,
languages, land use and polities, 10,000 BC–2000 AD” (supplied); used to
assess the deferred peopling project. \[H1\] Comin & Mestieri, “If
Technology Has Arrived Everywhere, Why Has Income Diverged?”, American
Economic Journal: Macroeconomics 10(3), 2018, DOI: 10.1257/mac.20150175.
Also Comin & Hobijn, “An Exploration of Technology Diffusion,” American
Economic Review 100(5), 2010, DOI: 10.1257/aer.100.5.2031.
