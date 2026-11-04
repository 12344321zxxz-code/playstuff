# Formicarium: backlog (Nov 4, 2026)

The manager keeps this in order. Each item: what, why, status, where to read. A worker that closes or opens an item updates this doc.

## Now: finish the play-tall and foundations work
1. **Modern ages converge (tech disparity).**
   - Checked Nov 4 against a numeric benchmark (`formicarium-tech-disparity-targets`; report `formicarium-report-2026-11-04-tech-disparity`).
   - Through the age of print the sim is about right. From steam on, about 98% of people reach the frontier age within a century; history had 41–69% two or more ages behind in 1950–2000.
   - Causes:
     - the frontier never accelerates (`KN.lam`/`ref` cap every court near an ordinary realm's pace);
     - catch-up is nearly unconditional (`KN.pull`, `absorb` depends only on the gap);
     - provinces catch up with their court within a century.
   - Proposed fixes, for Ariel to choose:
     1. catch-up that needs capacity (schools, towns, an open court, own engines);
     2. let intensity compound instead of size (replace the `lam` cap with friction from extent);
     3. provinces modernise only with investment (fiscal state).
   - Before testing: add measurements for the lag of isolated landmasses, the number of realms at the frontier age, and decade sampling.
   - The display shows the court's age in town art and realm pages (a small, optional fix).
2. **Extra defections.**
   - Breakaway regions defect to a neighbour about 92 times per world (32 under the old rules), because more realms press against the realm cap.
   - Raising the cap to 90 (`FX.realms`) cut this by a third but slightly helped the biggest realm, so it stays off.
   - Needs a different fix, e.g. breakaways that stay independent, or a cap set by performance plus a non-size-favouring destination.
   - Read: stuck-rules audit items 19–20.
3. **Item 29: knowledge teleport on merger.**
   - A realm two ages behind that joins a bigger one gains about 9 arts within 5 years (`node tools/invariance.mjs 12 1300 --merge --behind`).
   - `KN.use = 1` fixed it but made the biggest realm lead more, so it was rejected.
   - Needs a holistic fix, e.g. arts reach a newly joined district through the same integration ramp the fiscal state uses.
4. **Pace.**
   - About a quarter of worlds never reach age 6 by 2000.
   - Check whether that's geography (no coal, isolation) or a gate; compare against the real spread of industrialisation.
5. **Tick cost.**
   - About 28 ms per tick on the defaults (+48%, mostly the 700-town cap).
   - Check it in the browser; optimise if it feels slow.
6. **Population.**
   - Peaks about 3.4bn vs Ariel's 7–11bn aspiration for information-age worlds.
   - Proposed: a demographic transition tied to income, towns and schooling, not a knob (foundations audit 2.9, G).

## Queued sub-projects (Ariel's order, Oct 26 and Nov 3)
1. **Magic overhaul.**
   - The biggest open design area. Ariel's answers are in `formicarium-game` section 9 and project memory.
   - First step: a brainstorm or council with Ariel. It must settle how hard magic brakes progress (he wants the options laid out), then the pooling ley-line model, land-based risings, beastmen and human sorcery.
2. **Bigger map and better continents.** Earth's dimensions to start. This touches performance: the map is 512 × 256 now.
3. **Trade and travel-logistics overhaul.** Toward a real economy: prices, credit, merchant interests (foundations audit section 4.B).
4. **States separate from peoples, and deeper institutions.**
   - Ariel asked for both; the council deferred them until the fiscal state proved itself (it has).
   - Read: foundations audit 2.1, 2.5, 4.A and 4.C; council verdict.
5. **Land turnover vs history.**
   - Parked Oct 31: iron and medieval foreign turnover is low, steam colonial borderline, wires internal high.
   - Re-measure on the new defaults first; they raised steam-age turnover.
   - Read: `formicarium-turnover-status`.

## Ideas from the audits, not yet scheduled
- Technology domains (naval, financial, military, industrial) instead of one knowledge number (foundations audit 4.E).
- Defensible geography (mountains, islands, marshes) feeding the cost of conquest (4.F).
- Retire old correction patches now that real mechanisms exist: `lam`/`dkRef`, `M`, `pull`, the engines cap, and the cap-tied breakaway blocks (council verdict).
- A chronicle line for every new mechanism, so players see why.
- Early arts spread too slowly between neighbours (100–250 years vs about 15–80 historically).

## Done recently (for context)
- Nov 4:
  - foundations fixes on by default and merged (32-world confirmation);
  - long runs moved to GitHub Actions;
  - realm cap 90 tested (kept off).
- Nov 2–3:
  - town and country (districts with town and countryside);
  - play-tall measurement and the "know vs use" build;
  - foundations audit and council;
  - stuck-rules audit.
- Oct 31: borders that follow the land; political map and diplomacy overview; population (medicine, green revolution); rare nuclear war.
- Oct 29–30: turnover meter and tuning; colonial scramble and the loaded spring; protectorates.
- Oct 25–26: war overhaul, slices 0–5.
