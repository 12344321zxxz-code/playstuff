# Executive judgement

**The defect is not primarily that the world has too few language
families. It is that the simulation treats the arrival of information, a
society’s ability to put it to work, and the frontier’s ability to
generate something genuinely new as nearly the same process.** The
peopling model removes important sources of long-run heterogeneity, but
changes to founders alone will not prevent the late-game collapse.

The most consequential mechanisms are visible in the supplied
`tech-disparity` snapshot: (i) contact conveys a fraction of a *general
knowledge stock* even without the receiving society’s industrial
infrastructure; (ii) trade-tied peers receive a separate catch-up pull
whose amount is **not** charged against the nominal limit on imported
knowledge; (iii) the modern discovery formula compresses a tenfold
increase in raw effort to just **1.26-fold** output before its
relative-fit modifier; and (iv) district-level adoption, although slower
than court adoption, has no explicit infrastructure investment budget.
Together these predict a slow leading edge and a world that rapidly
piles up just below it. **Confidence: high for the code mechanisms,
medium for how much each causes the measured outcome.** No
counterfactual 32-world batch was run for this review.

The recommended target is **unequal productive capability, not unequal
access to rumours of invention**. A peripheral society may have seen a
railway, know that electricity exists, and possess imported rifles while
still lacking the miners, machinists, institutions, fiscal capacity and
integrated supply chains to replicate the whole industrial system.
Another society, rich in cities, skilled people and reliable power,
should convert nearby discoveries into an accelerating chain. Both
should arise from the same simulation mechanisms, not from era-specific
penalties or historic scripts.

**Build order:** (1) measurement and diagnostic instrumentation; (2)
separate knowledge *exposure* from effective *assimilation*, retiring
the unconditional `KN.pull` path; (3) replace the global discovery
compression with independently productive, connected research cores; (4)
make key technologies deploy and reproduce locally using infrastructure
and expenditure; (5) add a cheap population substrate so farmers,
foragers and conquered peoples can exist outside sovereign realms; (6)
ultimately classify technology from practiced capability as well as
general knowledge. These are testable increments, not one giant rewrite.

## Evidence used and limits

- **Code inspected:** the attached `playstuff-tech-disparity.zip`, with
  code-line references to the enclosed `src/` and `tools/`. The review
  draws particularly on `people.js`, `tech.js`, `tongues.js`,
  `cradles.js`, `origins.js`, `trade.js`, `fisc.js`, `realms.js`,
  `war.js`, `render.js`, `devmeter.mjs` and `peopling.mjs`. A
  `file:lines` reference means lines in this supplied snapshot.
- **Historical calibration:** the attached *Global technology
  inequality, 3000 BC–2000 AD* (**T**) and *Peoples, languages, land use
  and polities, 10,000 BC–2000 AD* (**P**), checked against their text
  and matrices in `docs/research/` of the zip. These are synthetic
  estimates with extensive judgement, not observed global censuses.
- **Supplied simulator evidence:** the brief’s 32-world tech benchmark
  and four archived peopling censuses. The 32-world results are
  **reported measurements, not independently rerun measurements**. I
  inspected the instrument definitions and the archived four-world
  census files. This report deliberately did **not** use the separate
  diagnosis/proposal file or the restricted existing internal diagnosis
  when forming its conclusions.
- **Confidence convention:** H = directly apparent from code; M =
  plausible causal contribution backed by code and the supplied baseline
  but not an ablation; L = speculative implementation outcome. Forecasts
  below are labelled **test hypotheses**, not measured improvements.

# 1 \| Diagnosis: the two-sided knowledge ratchet

## 1.1. What the available data actually establish

The supplied baseline shows a sharp *regime change*, not universal
historical mismatch. In the late age of print, about **81%** of people
are at the frontier level versus T’s **48–63%**. At entry to steam (age
6), only **6%** are two or more ages behind versus T’s **12–32%**. At
age-8 entry, the sim reports **1.6%** against a judgement-based **69%**
at 1950; at age-9 entry **2.1%** against roughly **41%** at 2000. One
century into ages 6–8, the sim reports about **98%** at the frontier
age. Within a realm, only **0.5–6%** of people are a full age below
their court late in an age, while T suggests **22–52%** in large
historical states. \[Brief §3; T, “World shares behind the first-use
frontier” and “Within-state technological gaps”.\]

There are important cautions. T’s 1950 **69%** depends on coding the
United States as age 8; with age 7, the brief recalculates the figure to
about **24%**. The sim’s single age per town-plus-countryside
necessarily misses much rural–urban disparity. Most archived worlds have
magic, many have nuclear exchange, and the world lacks Earth’s
long-isolated hemispheres. **Therefore the correct objective is to make
durable disparity possible and common under the right geography—not to
force 69% in every age-8 world.**

The opposite failure appears at the frontier: median sim intervals are
roughly **190 years** from age 6 to 7 and **100 years** from 7 to 8
(brief), while T associates the analogous technological transitions with
much faster episodes. Those dates are distorted by the game’s 2,000-year
chronology and age definitions, but the structural comparison remains
useful: **a mature industrial frontier does not accelerate as the system
around it grows**.

## 1.2. Mechanism A — a general number crosses borders too easily (H)

`meet()` applies an increment proportional to the *difference between
two courts’ knowledge totals*:
`0.006 × gap in know × absorb(age gap) × talk × diminishing meeting count`
(`src/people.js:114–125`). The receiver does not have to possess the
capital equipment, schools, industries or fiscal institutions required
to *use* the underlying knowledge. `absorb()` checks only the age gap
(`people.js:113`): 0.6 at a one-age gap, 0.12 at two, and 0.03 at three
or more. It is useful as an approximate brake, but not an
absorptive-capacity model.

The existing tongue friction is real and should not be misreported:
`meet()` multiplies the flow by **1.5** between close tongues and
**0.7** between unrelated families (`people.js:117,120,125`). The more
serious omission is that cross-border **letters and pull do not use that
cultural distance at all**, or any industrial-readiness term
(`people.js:635–638`). Language alone should not bar transfer; the
missing mechanisms are interpreters, shared professional networks,
institutions and trained recipients.

`canLearn()` has a prerequisite graph and some real resource
requirements (`src/tech.js:112–126`, arts at `tech.js:8–93`). This is a
genuine strength. But the transfer of general `know` is independent of
whether the receiving society can *practice* the corresponding arts. An
imported explanation of a power grid still increases the same aggregate
variable which determines a court’s age (`tech.js:95–110`). The art tree
mitigates this, but does not fully separate knowledge from productive
capability.

## 1.3. Mechanism B — the catch-up channel escapes its own budget (H)

`cultYear()` constructs `budget = KN.M × own` to constrain knowledge
received as “letters” (`src/people.js:634`). The normal peer-letter term
is capped against that budget (`:638`). Yet the additional `KN.pull`
channel computes a fraction of the knowledge gap to a tied,
at-most-one-age-ahead rival (`:635–636`) and adds it to `c.know`
**before and outside** the cap (`:637`). `KN.pull = 0.04` (`:112`). With
a full-strength tie and equal-age partners, this is an illustrative four
percent of the remaining gap per year, *in addition* to contact,
independent invention and letters; at a one-age difference it is
attenuated, not removed.

This is an especially strong homogenising mechanism because it applies
whenever the societies have a trade tie and satisfy the age-distance
condition—not when the recipient has the staff, schools, fuel and
workshops to exploit the knowledge. It also rewards following the
frontier regardless of what is happening to the follower’s own economy.
**Priority: highest-confidence direct intervention.**

Not every backward realm has such a tie. The late convergence also
reflects ordinary exchange, locally generated knowledge, inherited arts
and increasingly connected polities. Removing pull alone should *not* be
assumed to fix the entire result.

## 1.4. Mechanism C — the frontier’s discovery output is compressed almost flat (H)

The yearly census builds a global discovery reference from a **low
quantile of qualifying realms** (`people.js:450–452`). When a realm’s
raw effort exceeds reference `R`, its own discoveries become
`R × (raw/R)^KN.lam × relativeFit`, where `KN.lam = 0.1`
(`people.js:112,634`). **Ten times the reference effort becomes**
`10^0.1 = 1.259` **times the reference**, not 2.5 times. The adjacent
explanatory comment overstates the numerical response
(`people.js:98–101`). The age-specific `fitOf()` factor does restore
variation (urbanisation, coal, schools; `people.js:603–607`), but it is
a *relative-to-peer* multiplier and not a persistent growth engine for
the entire advanced research network.

This cap has an understandable intention: prevent the most populous
realm from buying all discovery through bulk population. Its unwanted
side effect is that new industrial skills, cities, markets and
communications can grow dramatically without a comparable increase in
the leading society’s annual research output. A few old peers then
obtain near-frontier stock through the pull mechanism. The model
therefore produces **convergence with limited frontier acceleration**.
**Confidence: H for the compression, M for the precise contribution to
world pace.**

The annual raw-discovery contribution already rewards urban shares,
trade, writing, schools, printing, computers and networks
(`people.js:529–539`). Those are usable foundations for a less blunt
mechanism. The better fix is not simply to increase the exponent and
make size dominant again.

## 1.5. Mechanism D — a district eventually inherits the court’s number (H)

For each non-capital district, `s.k` moves toward `c.know` each year,
using `KN.adopt = 0.03`, proximity to the capital, a tongue factor, a
modest extra penalty for a gap of two ages, and an uptake multiplier for
modern districts (`people.js:529–538,609–612`). The capital is assigned
`s.k = c.know` immediately (`:534`); districts whose `k` was not
initialised are initialised from their court (`:533`). That last rule
matters for newly founded distant towns: the local knowledge stock can
begin at the court’s level even when there has been no local industrial
installation.

`artsHere()` prevents a below-age district from using the court’s
higher-tier arts for some economic calculations (`people.js:597–602`),
so the simulation *does* distinguish local and court capability.
Nevertheless, the district has one `s.lvl` for both its town and
hinterland, uptake is not charged to any investment account, and the
entire realm shares an `arts` object. Demography and farm output then
benefit from locally available arts through `artsHere()` and `boomOf()`
(`tech.js:104–107`; `people.js:467–502`). **The missing piece is locally
reproduced capacity**: a railway or electrical grid should be something
the territory can build, staff and maintain, not just the output of a
smooth numerical convergence rate.

## 1.6. Mechanism E — an age is not necessarily a functioning technological system (H)

`techOf()` counts thresholds passed by one scalar `know`
(`tech.js:95–110`), while the age-specific inventions are separately
awarded using the art graph (`tech.js:8–93,112–126`; `people.js:652`).
The one particularly strict exception is the rule that a court without
`engines` cannot pass the age-6 knowledge threshold (`people.js:619`).
Beyond this exception, the threshold can label a realm as age 7 or 8
without establishing that its characteristic productive technologies are
actually installed at scale. The benchmark T, in contrast, defines the
frontier as the **co-productive use of a technological package**, not
merely an abstract knowledge level. This is a measurement and a
simulation problem.

In the same way, `newCult()` inherits the parent’s full `know`, `tech`
and complete `arts` map (`people.js:51–63`); breakaways then have a
one-time correction to `know` from their own districts (`people.js:620`)
but not a systematic rebuild of productive supply chains. This can
preserve high technological labels and art ownership in a successor that
inherited mostly agrarian land. **Do not discard the good
local-knowledge work: extend it to the capacity to reproduce key arts.**

## 1.7. Mechanism F — the world supplies too few enduring outsiders (M)

The world begins with about **11 bands**, normally at least 34 cells
apart (`people.js:987–997`). Daughter realms and settlers inherit parent
language roots and large parts of their technical heritage
(`people.js:51–63,205–215`); new unrelated tongue roots are created for
genuinely new founders (`tongues.js:35–57`), while ordinary drift
creates daughters of existing roots (`tongues.js:144–169`). Colonisation
generally seeks an unoccupied new settlement site (`people.js:869–885`).
There is no persistent, populated stratum of independent farmers or
small-scale foragers between a band and a state.

Consequently, distant settlements are often cultural descendants of
already advanced societies; outsiders vanish as politically independent,
low-capacity populations. The four-world supplied peopling census
reports mobile-band shares near **74% at bronze** and **48% at iron**
against P’s broad **28%** and **12%** mobile/non-state populations,
respectively, while the settled catchment coverage is small. These
comparisons are definitionally imperfect: a sim nomad may be a farmer’s
mobile band, and `w.owner` covers town catchments rather than all
state-claimed land. Nonetheless, the lack of autonomous villages and
long-lived local populations is real. \[P, “Global people by
political-economic way of life”; brief §3; `tools/peopling.mjs:13–39`.\]

**Counterfactual judgement:** This is a powerful missing *source* of
diversity and peripheral backwardness, but it is **not sufficient** to
explain the modern 98% convergence on its own. Even
genetically/linguistically distinct remnants will catch up if knowledge
transfer and productive adoption remain close to unconditional. Build
the substrate to make the corrected knowledge mechanism matter, not as a
substitute for correcting it.

# 2 \| A peopling approximation designed for disparity

## 2.1. Define the unit correctly

Do **not** define one `c`/“people” as both a whole unrelated language
family and a sovereign polity. The code currently makes `w.cults` do the
work of culture, state, economy, army and court knowledge all at once
(`people.js:51–63`). Preserve `c` as a **political-military actor /
institutional court**, and preserve `langs.root` as an **ancestral
linguistic family**. Individual `s` settlements and the proposed
non-state population carry their own roots. The family is not an actor
and does not have an army. This preserves the possibility of many states
sharing an expanding family’s language **and** one empire ruling many
unrelated families.

A “people” in the interface can mean a **regional ethnolinguistic
population** (one broad root/branch in a place), while a “realm” remains
the political unit. That modest terminology change is important: an
Indo-European-like root can produce twenty courts without becoming one
nation. The model cannot emulate historical thousands of languages; it
needs several families, branch identities, and mixed local populations
with correct incentives.

## 2.2. Use a coarse resident-population field, not thousands of new agents

**Recommended structure: a 4×4 coarsened grid of 128×64 = 8,192 cells.**
Each inhabited cell holds (typed arrays where possible): resident
population, ecological livelihood, dominant root ID, a minority root ID
plus rough share if needed, a low-dimensional locally usable
knowledge/capability state, and a political relation (`unruled`,
`tribute`, `incorporated`). Sparse, grouped **chiefdom clusters** can be
derived as connected cells with common authority; no chiefdom needs a
full `newCult()` object, court, trade ledger or military unit. Let a
small number of agent bands represent raids, migrations and truly mobile
pastoral coalitions, not the entire forager population.

**Do not instantaneously fill the world at year zero.** The game
explicitly begins with first peoples. Start with the founder camps,
diffuse low-density resident populations into habitable adjacent cells,
including coastwise travel where craft permits, and allow a
**pre-agricultural dispersal phase to happen through the existing
simulation**. The field’s population fronts should advance fast enough
*relative to first crop domestication* that many ecologies are peopled
before the farm frontier reaches them; because the game compresses
prehistory, compare the **fraction of a landmass occupied when
agriculture reaches it**, not Earth’s kilometres per century. This
respects the dawn premise better than an already-full census.

Initialize root families from **several independent founder foci on each
sizeable landmass**, weighted by usable area and separation. Treat two
families as a structural floor only on materially large, habitable
landmasses; a tiny oceanic island may quite reasonably remain one-family
or empty. Do not force one founder for every fixed square-kilometre
equivalent or hard-code a global 25-family target. If the first
generation of worlds remains too homogeneous, permit rare, genuine roots
to emerge at sufficiently long-isolated outer expansion foci in this
deliberately compressed ancestry model, while recording them as *lineage
approximations*, not as an implausibly rapid divergence into unrelated
linguistic families.

When a new village forms, draw most of its residents and ancestry from
**the local resident field**, not from the court automatically. A
settler expedition adds a small migrant fraction; conquest changes ruler
and tax status first; language shift and identity blending occur later.
The existing language shift machinery (`tongues.js:82–120`) is a useful
starting point, but should update *population shares*, not flip an
entire mixed patch at a single random event.

## 2.3. Farming, expansion, and political incorporation

Give agriculture two ways to spread through occupied country.
**Knowledge diffusion:** a forager patch learns a nearby viable crop and
begins local cultivation while retaining most of its ancestry. **Demic
expansion:** a highly productive farmer patch develops population
pressure and sends people into neighbouring patches; migrants gain a
larger language share when resident density is low, but mix when
residents are numerous or militarily organised. Crops must still pass
the existing ecological suitability constraints
(`origins.js:11–27,64–101`; `cradles.js:13–40`). Mountains, disease,
hostile towns, sailing and transport determine which front crosses
where. Agricultural spread must not be mistaken for political
annexation.

Small unruled farming communities become chiefdom clusters when surplus,
density, exchange and coercive coordination warrant it. A chiefdom may
demand tribute, maintain a small fighter pool, collect goods and develop
scribal specialists **without spending a realm slot**. A full `c` is
created only if such a cluster acquires durable administration/army or
succeeds in secession; this provides a real route from non-state society
into the game. Competing chiefdoms can merge, raid and ally through
aggregated edge interactions, not a 700-chiefdom all-to-all algorithm.

The celebrated **U-shape** then has an actual cause: successful farmers
multiply and spread a root across many patches → rich separated patches
develop rival political centres → roads/armies/tributary institutions
consolidate some states into large realms → fiscal limits, elite
competition and cultural resistance fragment them. No extra “fragment
now” rule is necessary. Political spread can outrun language change,
producing minority-ruler regimes; modern schooling/media can accelerate
language standardisation or nationalist mobilisation later if the
relevant arts exist. This makes conquest and language change *different
processes* rather than simultaneous colour changes.

## 2.4. Make the populations consequential for technology

The substrate is worthwhile only if its residents can remain
**technologically meaningful**. A patch uses the best practices it can
maintain, receives contact through roads, markets, travellers and
migration, and learns slowly without specialists. When annexed, it does
*not* inherit its court’s factory capacity. Its farm output, taxes and
potential labour enter the real economy; its educational and craft
capacity influences whether the court can exploit imported inventions.
Mixed populations carry some technical traditions across conquest. A
valley of settled non-state cultivators can thrive and remain one or two
systems behind its nearby imperial capital; a skilled incorporated
district can also teach an incoming conqueror. The latter already has a
partial precedent in `people.js:533–538` with `FX.know`.

**Ranked by contribution to disparity:** (1) independent local
capability + annexation without instant modernisation; (2) autonomous
resident farmers/chiefdoms that persist beyond court borders; (3)
ancestry retention and mixed subjects; (4) better geographic
distribution of founding roots; (5) cosmetic language-count increases.
Number (5) alone is not a technological fix.

**Performance:** 8,192 compact cells with roughly 8–12 typed fields are
on the order of **0.1–0.5 MB** of raw arrays depending on types and
double roots; a 4-neighbour annual sweep is tens of thousands of
operations, not 8,192 new full `c`/`s` agents. That is a design
estimate, not a benchmark. Slice the sweep across the eight yearly
ticks, avoid dynamic object allocation and global flood-fills each year,
and profile full-world ticks with/without the field. Budget a
**screening ceiling of +2 ms per tick (~7% of the stated 28 ms)**, with
a stricter goal of +1 ms after optimisation; actual results control
acceptance. Cap agents as before; add no full realm objects for routine
chiefdoms. Code impact: **high**, involving `people.js` seeding, nomads,
colonisation, growth and census; `origins.js`/`cradles.js` for crops;
`tongues.js` for mixed identities; `fisc.js`, `trade.js` and `realms.js`
for rule, exchange and claims; plus map rendering and
`tools/peopling.mjs`.

**Display:** a *Population and Peoples* view should distinguish
sovereign borders from inhabited land, colour local ancestry with
subdued mixed hatching, and mark independent farming patches and
chiefdom catchments. The Knowledge view should shade *practice*, not
ruler prestige. The Look panel could say “Valley farmers: 18,000, mostly
Leth speakers; tributary to Aruk; know iron tools, no industrial
workshops; the court’s engines are not in use here.” Chronicle-worthy
transitions are: a frontier reaches an inhabited valley, a village
adopts agriculture, a chiefdom becomes a realm, a ruler takes tribute
from foreign-speaking farmers, and an imported technology fails or
succeeds for a stated reason.

# 3 \| Ranked corrections to technological disparity

The following ranking concerns **effect on late disparity and frontier
acceleration**, not historical elegance. They should be introduced
behind independent `FX` flags and assessed as paired-seed ablations.
Interactions are expected, so also run the combined arm after individual
screens.

## Fix 1 — Replace peer catch-up with transmission × local capacity

**Expected effect: very high on convergence; confidence H (mechanism), M
(effect).**

**Mechanism.** Split cross-border information into **exposure** (the
court has access to a technical tradition, perhaps via a bilingual
market or conquered city) and **assimilation** (trained craftspeople and
institutions can deploy and reproduce it). Ties convey exposure fast.
Assimilation is proportional to actual local capacity, which can be
increased through literacy, trade, urban specialists, state finance,
fuel and existing related arts. The art’s own prerequisites determine
which capabilities matter. For instance, copying gunpowder weapons
requires fewer coal-powered industrial systems than building a national
power grid. These are not fixed ethnic penalties: two unrelated
societies connected by translators and schools can learn faster than two
cousins separated by mountains.

**Code.** Replace `KN.pull` at `people.js:635–637` with capacity-gated,
preferably art-specific receipt. Make `meet()` (`:114–125`) create
exposure and selected art transmission rather than move the entire stock
by a gap fraction. Expand `absorb()` (`:113`) from `absorb(ageGap)` to
an *effective* receptivity evaluated from related local arts, urban
skills, institutions, translated contact, and locally available inputs.
Continue to reuse `ties` and the trade contact events
(`people.js:250–260,294–296`). Charge any remaining numerical knowledge
transfer to a **single transparent receipt budget**, never let `pull`
bypass it. The recipient should be able to read about a railway before
it can build one.

**Retire:** `KN.pull` as a separate additive patch; the existing
gap-only `absorb()` once its role is filled by actual capacity; the
present `KN.M` cap if the new finite training/assimilation capacity
makes it redundant. Do not simultaneously throw away all diffusion
controls on the first screen.

**Expected score changes (test hypotheses).** Two-plus-age lag at ages
6–9 should rise from the reported **1.6–2.1%** in many worlds,
especially among untied and low-capacity societies; the ~98% at-frontier
century-late share should fall; fully connected, educated rivals should
still catch up quickly. First-entrant size shares need not change much.
A failure signature would be a world that just stalls everywhere, with
all low-capacity societies frozen below age 6 and peak population
collapsing.

**Risk/cost.** Low CPU cost for per-tie arithmetic if cached yearly;
moderate conceptual risk of over-hardening the industrial gap. Avoid
permanent “technological castes”: schools, migrants, public investment
and trade must build absorptive capacity. **Test:** split lag by
capacity quintile and tie strength at equal geography; vary `KN.pull`
alone, then test the structural replacement with `pull=0`; report
frontier passage, population, rank correlation and tie-by-distance
diffusion. **Player visibility:** “Their merchants know of engines;
there are no machinists to make them,” plus a map overlay for contact
versus capability.

## Fix 2 — Grow discovery from independent productive cores, not raw realm size

**Expected effect: very high on frontier acceleration; confidence H/M.**

**Mechanism.** A city or network of cities produces discoveries using
its stock of skilled people, accumulated methods, specialisation and
links to other research centres. Researching twice as much in one
bureaucratic court eventually duplicates effort; founding or connecting
independent centres can enlarge the **number of lines pursued**, not
merely total headcount. A large empire with one concentrated capital
need not dominate; a large empire with many genuinely independent,
literate, industrial cities *can* be technologically formidable. Several
small market republics can also exchange advances without being merged.

**Code.** Reuse district-level urbanisation, trade, `s._tie`, schools,
markets and local arts already included in `people.js:529–539` and
`fitOf()` (`:603–607`); calculate per-core research as a function of
connected specialist density and technological infrastructure. Apply
diminishing returns to *overlapping centres within the same
communication/administrative network*, not to all excess raw effort
above a worldwide lower-quantile benchmark. `w.dkRef` (`:451–452`) may
remain for measurement, not as the brake. The positive feedback should
come from real arts—printing, schools, machine tools/engines,
electricity, networks—and their local users; no special date/age
acceleration coefficient. A discoverer’s capacity should grow with
infrastructure even if all other countries remain backwards.

**Retire:** `KN.lam`, `KN.ref`, and the realm-wide `fitRef` normaliser
in their current discovery-cap role (`people.js:112,451–452,634`), once
cores replace them. Keep genuine local congestion and slow institutional
change where observable; avoid simply replacing the exponent with a
larger one.

**Expected score changes.** Once industrial capability exists in a dense
research network, time between frontier ages **6→7 and 7→8** should
decrease relative to 5→6, rather than stagnating at **<sub>190/</sub>100
sim years**. More first entrants should be high-capability **small or
mid-sized** realms; the baseline 0.69 size–knowledge rank correlation
should not increase materially. A big realm may lead when its network
actually warrants it. **Risks:** explosive progress; giant rich empires
retaking every first; tech outstripping society and ending the game
early. **Tests:** discovery output per productive specialist, network
size and realm size; ablate peer exchange to check that acceleration
exists *inside* frontier cores; paired measures of `firstTo`, elapsed
stages, largest-realm share, 3.4bn peak population, age-8/age-9
incidence. **Tick cost:** modest if cores are existing towns, not
agents. **Visibility:** urban invention hubs, named school/workshop
clusters and chronicle events that explain why an intellectual centre
grew.

## Fix 3 — Deployment requires local maintenance and investment

**Expected effect: very high on within-realm gaps; medium on inter-realm
gaps.**

**Mechanism.** Keep the distinction between *a court knows* and *a
district uses* but tie uptake of decisive arts to
installation/maintenance: skilled labour, workshops, coal/energy,
transport, trade, local demand and a spending channel. A government can
acquire rifles without a domestic rifle industry. A province can import
a steam engine before it can build a rail system. Installed capacity
should feed back into productivity and skilled population, creating an
internally financed takeoff where conditions fit.

**Code.** Extend `artsHere()` and `s.k` (`people.js:529–538,597–612`)
with compact local capability for a **small set of keystone production
systems**, not 73 per-town inventories. Make annual investment compete
with other fiscal uses using `s.net`, `c.rev`, `s.trade`, `s.urb` and
transport access (`fisc.js:20–41`; `people.js:467–502`). A new
settlement should acquire local capabilities from its founding settlers
and accessible supply, not default to the court’s full knowledge
(`people.js:533`). On conquest or schism, capacities and artisans remain
in the local places; the new court does not automatically reproduce all
`c.arts`. Upgrade a court’s nominal stock with discoveries, but let
local infrastructure deliver the economic boom.

**Retire:** fixed `KN.adopt` as a universal law, and eventually `KN.use`
as an age-based shortcut. Keep a weak background channel for simple
ubiquitous skills, but make the important bundles depend on what is
actually installed. `KN.fresh`’s threshold reset (`people.js:645`) can
be reconsidered when age comes from observed practice; do not remove it
before the new frontier measure works.

**Expected score changes.** The late **0.5–6%** within-realm lag should
rise appreciably, particularly in large multilingual and fiscally
strained states; a **provisional diagnostic band of 8–25%** in some
large realms is plausible before adding a rural/urban split, **not a
guaranteed historical target**. Court ages could remain high while the
functional age of the countryside falls; modern frontier share by
*productive use* should decrease. **Risks:** lower food multipliers
(`boomOf`) and therefore lower population, slow modern passage,
excessive micromanagement. **Tests:** separate invention → first local
installation → 50%/90% of population using it, fiscal investment shares,
farm output and urban share, and military gap between court and actual
units. **Tick cost:** O(existing towns), a few fields per town.
**Visibility:** rail corridors and electrical districts appearing
gradually, factories staffed locally, and chronicle reports of lagging
provinces or transformative investment.

## Fix 4 — Let actual connections, not just political borders, define diffusion networks

**Expected effect: medium, high interaction with Fix 1.**

**Mechanism.** Extend the existing trade network into a *communication*
network. The ideas carried by a merchant, a bilingual colony, a pilgrim,
a trained migrant and a printed manual do not have the same
prerequisites or range. Exposure grows through repeated, consequential
interaction; an imperial border does not itself make the people on both
sides technologically homogeneous. Shared scripts and education can
create a wide trans-family intellectual network, and physical isolation
can protect old techniques long after neighbours advance.

**Code.** Use actual `tradeTrip` and `meet()` contact records
(`people.js:250–260,294–296,914–915`) plus route geography and
`tongueGap()`/`customsGap()` (`tongues.js:67–79`). Introduce one cached
bilateral *interpretive capacity* based on shared working
language/script, trade frequency, faith, bilingual populations and
migration, not a universal penalty for unrelated roots. Travel contacts
give exposure; institutionalised exchange raises assimilation. Prevent
contact from globally minting court knowledge faster than specialists
can absorb it. **Retire:** the small fixed `talk` multiplier
(`people.js:117`) after replacing it with the richer network, and
arbitrary global effects on idea flow. **Expected:** longer-tailed
adoption lags in isolated regions; preservation of fast catch-up inside
dense international scientific networks. **Risks:** language diversity
becomes a hard lock, trade collapses, cosmopolitan ports are penalised
despite real exposure. **Test:** hazard of first uptake conditional on
shortest route, language distance, contact duration, interpreters and
local literacy. **Tick:** per active tie, cached yearly. **Display:**
“translated through the merchants of X” on the chronicle and a limited
knowledge-flow layer.

## Fix 5 — Supply low-capacity populations that survive conquest and settlement

**Expected effect: medium on modern divergence if Fixes 1–3 exist; high
on ancient structure.**

Implement the resident field in §2 behind its own flag and connect it to
the new adoption and installation rules. **Retire:** ordinary
forager-band multiplication as the sole representation of non-state
people (`people.js:798–840`), and zero-population neutral land where
inhabited hamlets ought to be; do **not** retire nomadic raiders,
pastoral confederations or frontier settler agents. The best outcomes
are widespread politically unruled farmers, ethnolinguistically mixed
provinces, and modern peripheral communities that remain behind without
becoming uninhabited. The strongest risk is a global demographic surplus
caused by generating 8,192 new independent food reservoirs; prevent
double-counting against town catchments and `w.polity`. Measure
population conservation before tuning disparity. **Tick/code cost:**
highest of the proposed changes; see §2.4.

## Fix 6 — Measure and eventually classify capability from practiced arts

**Expected effect: very high on validity of results, uncertain on
behaviour itself.**

Introduce **two separate gauges**: (a) continuous research stock and (b)
operational systems. Define a functional technology profile from
practiced, locally supported keystone bundles
(food/transport/energy/communication/medicine/military), and compute an
optional comparability age for benchmarking. The frontier should require
productive use by a **nontrivial cluster of people**, not a lone court
barely beyond `TECH[t]`. Allow a society to be advanced in one strand
and behind in another. Keep the existing single `know` during transition
as an internal research variable; change the measured age first and the
underlying model only after it passes diagnostics. This avoids rewriting
the entire game to discover that the chief discrepancy was
classificatory. **Code:** `tech.js:8–110`, `people.js:597–652`,
`tools/devmeter.mjs:33–62`, `src/render.js:42–47`. **Retire:** the
assumption that `techOf(c.know)` alone is equivalent to contemporary
productive capability. **Risk:** moving the measuring stick can produce
an apparent improvement with no actual economic divergence; report
*both* old and new series in every experiment.

# 4 \| Measurements before changing the simulation

**First run a measurement-only branch.** Otherwise a promising change
can just alter which societies are labelled “advanced.” The table
specifies the measure and the question it answers.

| Diagnostic                       | Operational definition / split                                                                                                                                                                 | Causal question                                                           |
|----------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------|
| Knowledge-flow ledger            | Share of positive `Δknow` from own, peer letters, pull, meetings, conquest, provinces, ruins; per age, capacity quintile, realm size; **report pull separately** rather than inside “letters.” | Is catch-up mostly pull or autonomous research?                           |
| Potential vs realised invention  | Current `c.tech`, current `ART` prerequisites, actual key arts, locally installed systems; flag realms with high age but missing the defining package.                                         | Does a scalar age overstate modernity?                                    |
| Lag at matched stages            | Population/land 0,1,2,3+ behind at age entry, +25/+50/+100 years and age exit; alternatively by fraction of time to next frontier step.                                                        | Is disparity transient or durable?                                        |
| Frontier momentum                | Growth of raw urban-specialist effort vs capped `own` vs final `Δknow`; core count, research-network links and age thresholds crossed.                                                         | Is the cap blocking takeoff?                                              |
| Diffusion survival curves        | First discovery to first exposure, first adoption, local installation, 50% and 90% population use; include censored cases.                                                                     | What exactly is spreading too fast?                                       |
| Real network isolation           | First physical/contact tie per landmass; years without route; travel cost; connected component; trade and letters; distinguish absence of ties from absence of contact.                        | Does geography ever create enduring isolation?                            |
| Court–countryside gap            | `s.lvl`, capital vs periphery; parallel *within-district* urban/rural effective capability; landmass, foreign-language share, rural share.                                                     | How much lag is hidden by one age per district?                           |
| Cultural and political structure | Families by population threshold, family composition by landmass, minority-ruler population share, independent forager/farmer/herder share, inhabited vs claimed vs farmed land.               | Does peopling supply plausible laggards?                                  |
| Cap and fragility audit          | Realm, town, band, traveller cap hits; small and large realm births; mortality, pandemics, nuclear war, magic; population lost to transitions.                                                 | Does a supposed historical pattern come from a hard limit or catastrophe? |
| Within-world mobility            | Transition matrix by realm and district for exposure/use/age; cohort tracking at age entry, accounting for births and migration.                                                               | Is observed catch-up genuine, or composition changing?                    |

**Instrument corrections:**

1.  Add a **decade sampler** alongside the existing century sample
    (`tools/devmeter.mjs:37–62`), particularly around abrupt frontier
    changes. Centuries hide a 10-year technology wave. Keep century
    sampling for comparability.
2.  Record **several frontiers**: highest court age with ≥1% world share
    (existing), first functional package in sustained productive use,
    and 5%/10% population in locally installed systems. A result must
    not depend exclusively on the choice of 1%.
3.  Sample land at `w.polity` (the separately computed political map;
    `realms.js:21–49`) **and** at `w.owner` catchments
    (`devmeter.mjs:45–50`). Report inhabited and habitable denominators.
    Neither by itself equals agricultural land.
4.  Separate wandering bands by their economic livelihood. Current
    `devmeter.mjs:49` counts nomads at their court’s age, not at their
    own local `s.lvl` (which is generally absent), biasing disparity
    downward for mobile populations.
5.  Make first-entrant comparisons conditional on **independent
    inventions, inherited successor arts, and deployed arts**, not just
    the threshold crossing. Fixes to schism should not become invisible
    in the measurement.
6.  Use **same-commit paired seeds**, 10 for screening and 32 for
    confirmation, plus an extra stratified set of **no-nuclear,
    low-magic and isolating-geography** worlds. Report distribution, not
    merely mean. Use the current scoreboard as a guardrail:
    largest-first frequency ~0.36 at ages 6–8, size–knowledge
    correlation ~0.69, largest realm share ~0.23, mean age-6 entry
    ~1488, age-8 reached by year 2000 in 69%, population peak ~3.4bn.
    These are not sacred targets, but large regressions must be
    explained. \[Brief §6.4; `docs/manager/lab.md`.\]

**Ablation matrix, in order:** (A0) new instruments on unmodified
mechanics; (A1) `KN.pull=0` only; (A2) conditional transfer with pull
absent; (A3) new discovery cores with the old diffusion; (A4) A2+A3;
(A5) A4+local installation; (A6) A5+substrate; (A7) A6+functional-age
scoring. Screen each on shared 10 seeds, confirm the relevant single
changes and combinations on 32. Test “free scientist in a large poor
empire,” “wealthy small maritime republic,” “isolated continental
valley,” “bilingual entrepôt,” “independent farm expansion,” and
“nuclear catastrophe” as saved reference-world *scenarios*, not scripted
outcomes.

**Acceptance test:** A corrected world should admit **both** (i) an
industrial frontier that advances faster because a connected skilled
core compounds its abilities, and (ii) societies that know about its
tools but cannot yet reproduce them. A change that produces only a
slower world, or only a giant world leader, fails the objective. Treat
the full scoreboard and the player’s visible causal story as joint
acceptance criteria.

# 5 \| What to use—and not use—from the two reports

## 5.1. Robust directional targets

**T (technology):** The transition from late preindustrial convergence
to industrial divergence, durable within-state urban/peripheral gaps,
rapid peer uptake when institutions permit, and occasional leadership by
relatively small highly capable states are worthwhile *shape* targets.
So are the multiple measures of 0/1/2/3+ lag, and the first-use versus
mature-frontier distinction. Hard percentages before AD 1 and single
dates around the inventions of the telegraph, bomb and computer are much
less secure.

**P (peopling):** The decisive structural facts are (a) farmers outside
states were important (P estimates **62%** of people in 3000 BC, **38%**
in 1000 BC, **21%** in AD 1), (b) land inhabited for subsistence is not
the same as land politically ruled, (c) agricultural spread often mixes
incomers and residents, and (d) empires commonly rule speakers of
multiple unrelated tongues. P’s minority-ruler shares of **32% of state
subjects in AD 1** and **40% in AD 1000** are especially useful as loose
indicators, not calibration constants. \[P, “Global people by
political-economic way of life”, “Farmer and language-front expansions”,
“Multi-ethnic states and political fragmentation”.\]

Neither report justifies exactly **25 founders, 700 chiefdoms, 65%
laggards, or a predetermined European-style industrial revolution** for
Formicarium. An isolated one-family archipelago, a city-rich continent
with many unrelated roots, and a world whose crop cradles fail should be
allowed to produce different histories.

## 5.2. Additional blind spots identified in this review

**The two reports do not even share a consistent early population
baseline.** T uses about **14 million** humans in **3000 BC** and **50
million** in **1000 BC**; P uses about **45 million** and **115
million** at those dates. The gap is approximately **3.2×** and **2.3×**
respectively. Their proportional tables may still be valuable
independently, but do not multiply or merge their regional shares and
totals as if they came from a common reconstruction. By AD 1 the totals
are close (about 230–232 million). \[T, “Method and conventions”; P,
“Global population, linguistic diversity and polity counts”.\]

**The key variable is productive stock, not a uniform age.** T’s region
matrix is expert-coded and its 1950 frontier mixes genuinely exceptional
military/computing capabilities with infrastructure not yet in most
households. The sim’s scalar age labels do not match this test. Use
machine production, transport, power and educational capability in
parallel before moving target bars.

**The present frontier is partly a population-threshold artefact.**
`devmeter.mjs:33,45–50` defines it as the highest-age realm with at
least 1% of settled world population; the first-use report uses a
different threshold, and mobile groups can be discounted in the
denominator. Make the difference measurable.

**The very first “founding people” is not a historical 10,000 BC
language family.** In the simulation only a few hundred years separate
ancient settlement and full farming; the linguistic family tree will not
have had historical millennia to diversify. Judge diversity by *durable
regional separation and mixed subjects*, not by a literal calendar-based
count of families.

**Survivor and composition effects deserve explicit testing.** A late
sample of many high-tech states can reflect low-tech state extinction,
conquest, refugee absorption or an arts-rich split, not successful
diffusion to those communities. Track cohorts of population or patches
through annexation and reassignment; do not infer convergence from the
current list of courts alone.

**Multiple causes could create the same apparent disparity.** A
technological gap with no diplomatic, military, demographic or economic
consequences is cosmetic. Measure whether operational railways improve
transport, electricity affects productivity, schools increase skilled
capacity, and industrial arms create a real advantage in the places
possessing them. The game should not win its calibration by changing the
legend on the Knowledge map.

## 5.3. Targets I would explicitly decline to fit

- The **1950 age-8 “69% two-plus behind”** as a single compulsory
  number; report both the age-7 (~24%) and age-8 scenario and the
  productive-system measure.
- The **year-by-year modern frontier interval** against the Earth’s
  1940s: Formicarium’s age composition and compressed early/extended
  late chronology make exact alignment false precision.
- Global **states, families, languages and chiefdoms in absolute
  counts**: the simulation has regional-grain agents on a world-scale
  population and a realm cap of 54–58 (`war.js:122–125`).
- All ancient **claimed/empty land** percentages: P uses broad,
  uncertain political claims whereas the sim has a town catchment
  `w.owner` and a different political map `w.polity`.
- The regional family counts and “same-family polity” rows of P as exact
  cells: the brief already notes regularities suggesting mechanically
  derived entries and an unverified source behind language totals.
- A compulsory global modern gap in worlds with universal early
  seafaring, closely connected continents, or no major external
  population. Their genuine equilibrium should be more homogeneous than
  Earth’s.

# 6 \| Challenge to the framing and final design decision

The root issue is **not simply too few peoples** and it is **not simply
that technology spreads too fast**. More importantly, *“technology” is
compressed into a transferable scalar whose thresholds are allowed to
stand for whole production systems*. Coupling that representation to a
very strong tied-peer equaliser and a strongly compressed discovery cap
manufactures a world in which the frontier cannot outrun its followers
for long. Adding 20 language families without changing what knowledge
means would add attractive colours to roughly the same equilibrium.

The model should distinguish four stages, using existing geography and
economy rather than scripted ages:

1.  **Encounter:** a technique or idea reaches a society via people,
    texts, trade, conquest or observation.
2.  **Understanding:** enough related knowledge and trained people exist
    to adapt it.
3.  **Installation:** resources, capital, logistics and governance put
    it to sustained work in particular places.
4.  **Reproduction:** locally maintained schools, workshops and supply
    chains make further innovations and scale-up possible.

These stages create different causal stories. A city can acquire nuclear
science without an electrical hinterland; a conqueror can seize an
advanced city without inheriting its artisans’ loyalty; a dense republic
can generate improvements without a huge empire; a remote valley can
retain stone-age subsistence while being aware of distant iron kingdoms.
Nothing requires a fixed era-specific catch-up coefficient, a penalty
for size, or magic-forgetting punishment.

**Decision for the council:** Approve the *measurement + capacity-gated
diffusion* experiment first, with `KN.pull` isolated as a separate
ablation. In parallel design the discovery-core replacement and the
local deployment ledger. Treat the coarse resident field as the
foundational demographic extension, but do not delay the direct
late-game fix until that large project exists. Do not merge any change
unless its paired-seed results show improved disparity **without** an
implausible global stall, population collapse, or renewed automatic
victory by the largest realm. Only after those mechanisms work should
the age labels themselves be redesigned around practiced systems.

# Appendix A \| Code reference index

| Finding                                           | Exact locations in supplied code                         |
|---------------------------------------------------|----------------------------------------------------------|
| Founder number and geometry                       | `src/people.js:970–997`; `src/tongues.js:35–57`          |
| Family inheritance, independent roots, drift      | `src/people.js:51–63`; `src/tongues.js:67–72,144–169`    |
| Meet, absorption, language modifier, art exchange | `src/people.js:112–127`                                  |
| Trade gives rise to ties                          | `src/people.js:250–260,294–296`; `src/people.js:914–915` |
| Raw discovery and province-to-court/town dynamics | `src/people.js:529–539`                                  |
| Discovery reference and age-specific fit          | `src/people.js:450–452,603–607`                          |
| Modern cap, peer letters and catch-up             | `src/people.js:634–638`                                  |
| Art retention and knowledge thresholds            | `src/tech.js:95–126`; `src/people.js:640–652`            |
| Industry gate; age reset                          | `src/people.js:618–620,645–646`                          |
| Local productive arts and adoption                | `src/people.js:597–615`; `src/people.js:467–502`         |
| New populations, chiefdom absence, colonisation   | `src/people.js:795–840,869–885,987–997`                  |
| Agroecological suitability and cradles            | `src/origins.js:11–27,64–101`; `src/cradles.js:13–40`    |
| Fiscal net revenue; language shift                | `src/fisc.js:20–41`; `src/tongues.js:82–120`             |
| Political-map claims vs town catchments           | `src/realms.js:1–8,21–49`; `tools/devmeter.mjs:45–50`    |
| Tech and peopling instruments                     | `tools/devmeter.mjs:18–69`; `tools/peopling.mjs:9–40`    |
| Visual Knowledge lens; realm cap                  | `src/render.js:42–47`; `src/war.js:122–125`              |

# Appendix B \| Source and uncertainty note

**T:** *Global technology inequality, 3000 BC–2000 AD: a numerical
calibration*, attached research report, 4 November 2026; repository copy
at `docs/research/tech-disparity/chatgpt-report-2026-11-04.md` and
regional `report-matrix.csv`. Main uses: world lag table, frontier
definition, within-state disparity, leadership and confidence
qualifiers.

**P:** *Peoples, languages, land use and polities, 10,000 BC–2000 AD*,
attached research report, 4 November 2026; repository copy at
`docs/research/peopling/chatgpt-report-2026-11-04.md` and regional
`report-matrix.csv`. Main uses: land/livelihood categories, familial
diversity, farmers outside states, demic/cultural expansion and
minority-ruler states.

**Simulation:** the user-supplied `tech-disparity` source snapshot and
its headless tools; quantitative current-state values quoted from the
supplied brief and the four archived peopling census outputs. None of
the ranked changes was implemented or batch-tested here. A `H` code
confidence is not a claim that an independent experiment proved causal
effect; all expected metric changes remain hypotheses to be evaluated on
the full paired-seed scoreboard.
