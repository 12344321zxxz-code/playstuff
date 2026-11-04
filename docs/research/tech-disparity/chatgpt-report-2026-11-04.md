# Global technology inequality, 3000 BC–2000 AD: a numerical calibration

## Method and conventions

This is a deliberately coarse simulation calibration rather than a claim
that the historical record supports point precision. I use a fixed
23-region partition; reconstruct population from HYDE 3.2,
Maddison-style series and the older demographic literature; code
technology against your age definitions; and aggregate region-by-date
population shares. HYDE 3.2 provides an internally consistent
population/land-use reconstruction extending from 10,000 BCE to 2015,
while the Maddison Project provides long-run country and regional
population series from 1 CE onward. Both are useful anchors, but
pre-modern regional population totals are much less secure than modern
ones; Guinnane's 2023 review is particularly important here because it
shows how much of the widely used McEvedy–Jones material consists of
judgement rather than census-like measurement.
[\[1\]](https://doi.org/10.5194/ESSD-9-927-2017)

Technology coding is anchored to Comin, Easterly & Gong's observations
for 1000 BC, 1 CE and 1500 CE, and to Comin & Hobijn's CHAT/HCCTA
datasets after 1800. CHAT covers more than 100 technologies in more than
150 countries since 1800; HCCTA concentrates on major technologies in
leading industrial economies. For polity scale and territorial ranking I
use Seshat, Cliopatria and Taagepera-style state-area reconstructions.
[\[2\]](https://pubs.aeaweb.org/doi/10.1257/mac.2.3.65)

The age-share assignments are **productive-use** judgements, not
invention dates. For example, southern Mesopotamia had urban
bureaucracy, writing and sophisticated agricultural infrastructure
around 3400–3000 BC; Song sources attest a true gunpowder formula and
large-scale manufacture by 1044; and Newcomen engines were genuinely
productive machines from 1712 rather than merely prototypes.
[\[3\]](https://www.getty.edu/art/exhibitions/mesopotamia/explore.html)

**Notation:** `†` means a number is my synthesis/judgement rather than a
value transcribed directly from a source. `H/M/L` means high/medium/low
confidence. Population in the CSV is **millions**. `land_km2` is a
coarse **inhabited macro-region envelope**, not cropland or effective
state-controlled area. All age shares are percentages and each
region-date row sums to 100. For the global lag tables, the **best
estimates** sum to 100; the displayed low–high intervals are marginal
uncertainty bounds for each cell and therefore their endpoints need not
sum to 100 simultaneously.

The world-population control totals used here are 14m† in 3000 BC, 27m†
in 2000 BC, 50m† in 1000 BC, 100m† in 500 BC, 232m† in 1 CE, 210m† in
500, 295m† in 1000, 390m† in 1300, 461m† in 1500, 603m† in 1700, 989m†
in 1800, 1.260bn† in 1850, 1.654bn† in 1900, 2.545bn† in 1950 and
6.145bn† in 2000. The deliberately broad ancient ranges reflect the
weakness of global population reconstruction before 1500 rather than a
lack of a numerical estimate.
[\[4\]](https://doi.org/10.5194/ESSD-9-927-2017)

## Frontier and global lag

### Frontier by date

The frontier is the highest age for which **most of that age's defining
technologies were in productive use together somewhere**, not the first
isolated appearance of one component. This is why Britain remains Age 5
in 1800 despite steam engines having existed for decades: railways,
steamships, telegraph and the broader Age-6 system had not yet matured
together. Conversely, the United States is Age 8 by 1950 because nuclear
weapons and operational electronic computing had become real
productive/military systems, not experiments. Song China's Age-5
assignment rests on printing plus extensive gunpowder development and
firearms; the early Mesopotamian Age-2 assignment rests on the
combination of urban agriculture, irrigation, plough cultivation,
bronze-working and writing rather than writing alone.
[\[5\]](https://www.getty.edu/art/exhibitions/mesopotamia/explore.html)

| Date    | Frontier age | Main frontier region(s)                          | Frontier polity/polities                                       | Confidence |
|---------|--------------|--------------------------------------------------|----------------------------------------------------------------|------------|
| 3000 BC | 2            | Lower Mesopotamia; Nile valley                   | Sumerian city-states; Early Dynastic Egypt†                    | L          |
| 2000 BC | 2            | Nile; Mesopotamia; Indus                         | Middle Kingdom Egypt; Mesopotamian states; Indus urban system† | L          |
| 1000 BC | 2            | Fertile Crescent; Zhou core                      | Neo-Assyrian sphere; Egypt; Western Zhou†                      | L          |
| 500 BC  | 3            | Iran–Mesopotamia–eastern Mediterranean           | Achaemenid Empire; Greek/Aegean centres†                       | L          |
| 1 AD    | 4            | China core; Mediterranean                        | Han China; Roman Empire†                                       | M          |
| 500     | 4            | Eastern Mediterranean; Chinese core              | Eastern Roman Empire; north/south Chinese states†              | M          |
| 1000    | 4            | China; Byzantine/Islamic cores close behind      | Song China†                                                    | M          |
| 1300    | 5            | China                                            | Late Song / early Yuan technological system†                   | M          |
| 1500    | 5            | China; Ottoman/Mediterranean/Iberian cores       | Ming China; Ottomans; leading Italian/Iberian states†          | M          |
| 1700    | 5            | NW Europe plus advanced Asian cores              | Dutch Republic; England; France; Qing/Japanese cores†          | M          |
| 1800    | 5            | Britain/NW Europe                                | Great Britain; Netherlands; France†                            | M          |
| 1850    | 6            | Britain                                          | United Kingdom†                                                | M          |
| 1900    | 6            | NW Europe; United States                         | UK, Germany, US, Belgium, France and close industrial peers†   | H          |
| 1950    | 8            | United States                                    | United States†                                                 | H          |
| 2000    | 9            | US/Japan/NW Europe and other advanced OECD cores | United States, Japan and several NW European states†           | H          |

Early Sumerian writing was already embedded in a centralised urban
economy around 3000 BC, and the Uruk administrative corpus records
specialised offices and production.
[\[6\]](https://smarthistory.org/cuneiform) Song military sources record
large-scale gunpowder manufacture by 1044 and subsequent expansion of
firearms use, which is why 1300 is the first sampled date at which I put
a substantial region into Age 5.
[\[7\]](https://afe.easia.columbia.edu/songdynasty-module/tech-gunpowder.html)

### World shares behind the first-use frontier

Each cell is `best [low–high]`, in percentage of world population or
inhabited land. `3+` means at least three full ages behind.

| Date    | Frontier | PEOPLE: 0 behind    | PEOPLE: 1 behind    | PEOPLE: 2 behind    | PEOPLE: 3+ behind   | LAND: 0 behind      | LAND: 1 behind      | LAND: 2 behind      | LAND: 3+ behind     | Conf. |
|---------|----------|---------------------|---------------------|---------------------|---------------------|---------------------|---------------------|---------------------|---------------------|-------|
| 3000 BC | 2        | 28.1† \[18.1–38.1\] | 56.4† \[46.4–66.4\] | 15.4† \[5.4–25.4\]  | 0.0† \[0–10.0\]     | 7.2† \[0–22.2\]     | 52.8† \[37.8–67.8\] | 40.0† \[25.0–55.0\] | 0.0† \[0–15.0\]     | L     |
| 2000 BC | 2        | 50.8† \[40.8–60.8\] | 41.2† \[31.2–51.2\] | 8.1† \[0–18.1\]     | 0.0† \[0–10.0\]     | 20.3† \[5.3–35.3\]  | 46.4† \[31.4–61.4\] | 33.4† \[18.4–48.4\] | 0.0† \[0–15.0\]     | L     |
| 1000 BC | 2        | 63.6† \[53.6–73.6\] | 32.4† \[22.4–42.4\] | 4.1† \[0–14.1\]     | 0.0† \[0–10.0\]     | 32.6† \[17.6–47.6\] | 44.7† \[29.7–59.7\] | 22.7† \[7.7–37.7\]  | 0.0† \[0–15.0\]     | L     |
| 500 BC  | 3        | 27.3† \[17.3–37.3\] | 58.9† \[48.9–68.9\] | 13.0† \[3.0–23.0\]  | 0.9† \[0–10.9\]     | 7.7† \[0–22.7\]     | 51.5† \[36.5–66.5\] | 29.7† \[14.7–44.7\] | 11.0† \[0–26.0\]    | L     |
| 1 AD    | 4        | 37.6† \[29.6–45.6\] | 43.0† \[35.0–51.0\] | 16.3† \[8.3–24.3\]  | 3.1† \[0–11.1\]     | 8.7† \[0–20.7\]     | 25.9† \[13.9–37.9\] | 33.1† \[21.1–45.1\] | 32.2† \[20.2–44.2\] | M/L   |
| 500     | 4        | 32.8† \[24.8–40.8\] | 47.0† \[39.0–55.0\] | 17.5† \[9.5–25.5\]  | 2.7† \[0–10.7\]     | 8.7† \[0–20.7\]     | 29.6† \[17.6–41.6\] | 38.9† \[26.9–50.9\] | 22.7† \[10.7–34.7\] | M/L   |
| 1000    | 4        | 54.6† \[46.6–62.6\] | 36.7† \[28.7–44.7\] | 7.5† \[0–15.5\]     | 1.2† \[0–9.2\]      | 20.6† \[8.6–32.6\]  | 38.0† \[26.0–50.0\] | 22.4† \[10.4–34.4\] | 19.0† \[7.0–31.0\]  | M/L   |
| 1300    | 5        | 14.7† \[6.7–22.7\]  | 58.2† \[50.2–66.2\] | 24.2† \[16.2–32.2\] | 2.9† \[0–10.9\]     | 2.5† \[0–14.5\]     | 30.1† \[18.1–42.1\] | 42.5† \[30.5–54.5\] | 24.9† \[12.9–36.9\] | M/L   |
| 1500    | 5        | 48.3† \[42.3–54.3\] | 41.1† \[35.1–47.1\] | 9.1† \[3.1–15.1\]   | 1.5† \[0–7.5\]      | 17.6† \[8.6–26.6\]  | 33.9† \[24.9–42.9\] | 26.4† \[17.4–35.4\] | 22.0† \[13.0–31.0\] | M     |
| 1700    | 5        | 58.5† \[52.5–64.5\] | 35.0† \[29.0–41.0\] | 5.5† \[0–11.5\]     | 1.0† \[0–7.0\]      | 22.4† \[13.4–31.4\] | 29.2† \[20.2–38.2\] | 25.0† \[16.0–34.0\] | 23.3† \[14.3–32.3\] | M     |
| 1800    | 5        | 62.8† \[56.8–68.8\] | 31.5† \[25.5–37.5\] | 4.9† \[0–10.9\]     | 0.9† \[0–6.9\]      | 22.4† \[13.4–31.4\] | 29.2† \[20.2–38.2\] | 25.0† \[16.0–34.0\] | 23.3† \[14.3–32.3\] | M     |
| 1850    | 6        | 10.4† \[4.4–16.4\]  | 57.2† \[51.2–63.2\] | 28.9† \[22.9–34.9\] | 3.4† \[0–9.4\]      | 2.7† \[0–11.7\]     | 26.5† \[17.5–35.5\] | 41.4† \[32.4–50.4\] | 29.4† \[20.4–38.4\] | M     |
| 1900    | 6        | 36.4† \[33.4–39.4\] | 51.2† \[48.2–54.2\] | 11.7† \[8.7–14.7\]  | 0.7† \[0–3.7\]      | 12.0† \[7.0–17.0\]  | 48.7† \[43.7–53.7\] | 35.1† \[30.1–40.1\] | 4.1† \[0–9.1\]      | H     |
| 1950    | 8        | 5.5† \[2.5–8.5\]    | 25.4† \[22.4–28.4\] | 44.8† \[41.8–47.8\] | 24.3† \[21.3–27.3\] | 4.6† \[0–9.6\]      | 11.7† \[6.7–16.7\]  | 36.5† \[31.5–41.5\] | 47.2† \[42.2–52.2\] | H     |
| 2000    | 9        | 13.2† \[10.2–16.2\] | 46.3† \[43.3–49.3\] | 29.9† \[26.9–32.9\] | 10.6† \[7.6–13.6\]  | 7.3† \[2.3–12.3\]   | 26.8† \[21.8–31.8\] | 43.0† \[38.0–48.0\] | 23.0† \[18.0–28.0\] | H     |

The sharp 1850 discontinuity is intentional: once the British
technological package qualifies as Age 6, much of the world that had
been only 0–1 age behind Age 5 becomes 1–2 behind overnight in the
categorical model. CHAT's post-1800 evidence is exactly why I treat the
nineteenth century as a diffusion transition rather than a smooth global
age change.
[\[8\]](https://www.nber.org/research/data/cross-country-historical-adoption-technology)

### World shares behind the mature frontier

The **mature frontier** is the highest age already reached by roughly 5%
of world population. In this calibration it differs from the first-use
frontier only in **1850**: Britain's Age-6 population was still too
small to clear the 5% threshold, so the mature frontier remains Age 5.
At 1950 the frontier is Age 8 because the US alone represented about 6%
of world population.

| Date    | Mature frontier | PEOPLE: 0 behind    | PEOPLE: 1 behind    | PEOPLE: 2 behind    | PEOPLE: 3+ behind   | LAND: 0 behind      | LAND: 1 behind      | LAND: 2 behind      | LAND: 3+ behind     | Conf. |
|---------|-----------------|---------------------|---------------------|---------------------|---------------------|---------------------|---------------------|---------------------|---------------------|-------|
| 3000 BC | 2               | 28.1† \[18.1–38.1\] | 56.4† \[46.4–66.4\] | 15.4† \[5.4–25.4\]  | 0.0† \[0–10.0\]     | 7.2† \[0–22.2\]     | 52.8† \[37.8–67.8\] | 40.0† \[25.0–55.0\] | 0.0† \[0–15.0\]     | L     |
| 2000 BC | 2               | 50.8† \[40.8–60.8\] | 41.2† \[31.2–51.2\] | 8.1† \[0–18.1\]     | 0.0† \[0–10.0\]     | 20.3† \[5.3–35.3\]  | 46.4† \[31.4–61.4\] | 33.4† \[18.4–48.4\] | 0.0† \[0–15.0\]     | L     |
| 1000 BC | 2               | 63.6† \[53.6–73.6\] | 32.4† \[22.4–42.4\] | 4.1† \[0–14.1\]     | 0.0† \[0–10.0\]     | 32.6† \[17.6–47.6\] | 44.7† \[29.7–59.7\] | 22.7† \[7.7–37.7\]  | 0.0† \[0–15.0\]     | L     |
| 500 BC  | 3               | 27.3† \[17.3–37.3\] | 58.9† \[48.9–68.9\] | 13.0† \[3.0–23.0\]  | 0.9† \[0–10.9\]     | 7.7† \[0–22.7\]     | 51.5† \[36.5–66.5\] | 29.7† \[14.7–44.7\] | 11.0† \[0–26.0\]    | L     |
| 1 AD    | 4               | 37.6† \[29.6–45.6\] | 43.0† \[35.0–51.0\] | 16.3† \[8.3–24.3\]  | 3.1† \[0–11.1\]     | 8.7† \[0–20.7\]     | 25.9† \[13.9–37.9\] | 33.1† \[21.1–45.1\] | 32.2† \[20.2–44.2\] | M/L   |
| 500     | 4               | 32.8† \[24.8–40.8\] | 47.0† \[39.0–55.0\] | 17.5† \[9.5–25.5\]  | 2.7† \[0–10.7\]     | 8.7† \[0–20.7\]     | 29.6† \[17.6–41.6\] | 38.9† \[26.9–50.9\] | 22.7† \[10.7–34.7\] | M/L   |
| 1000    | 4               | 54.6† \[46.6–62.6\] | 36.7† \[28.7–44.7\] | 7.5† \[0–15.5\]     | 1.2† \[0–9.2\]      | 20.6† \[8.6–32.6\]  | 38.0† \[26.0–50.0\] | 22.4† \[10.4–34.4\] | 19.0† \[7.0–31.0\]  | M/L   |
| 1300    | 5               | 14.7† \[6.7–22.7\]  | 58.2† \[50.2–66.2\] | 24.2† \[16.2–32.2\] | 2.9† \[0–10.9\]     | 2.5† \[0–14.5\]     | 30.1† \[18.1–42.1\] | 42.5† \[30.5–54.5\] | 24.9† \[12.9–36.9\] | M/L   |
| 1500    | 5               | 48.3† \[42.3–54.3\] | 41.1† \[35.1–47.1\] | 9.1† \[3.1–15.1\]   | 1.5† \[0–7.5\]      | 17.6† \[8.6–26.6\]  | 33.9† \[24.9–42.9\] | 26.4† \[17.4–35.4\] | 22.0† \[13.0–31.0\] | M     |
| 1700    | 5               | 58.5† \[52.5–64.5\] | 35.0† \[29.0–41.0\] | 5.5† \[0–11.5\]     | 1.0† \[0–7.0\]      | 22.4† \[13.4–31.4\] | 29.2† \[20.2–38.2\] | 25.0† \[16.0–34.0\] | 23.3† \[14.3–32.3\] | M     |
| 1800    | 5               | 62.8† \[56.8–68.8\] | 31.5† \[25.5–37.5\] | 4.9† \[0–10.9\]     | 0.9† \[0–6.9\]      | 22.4† \[13.4–31.4\] | 29.2† \[20.2–38.2\] | 25.0† \[16.0–34.0\] | 23.3† \[14.3–32.3\] | M     |
| 1850    | 5               | 67.6† \[61.6–73.6\] | 28.9† \[22.9–34.9\] | 3.4† \[0–9.4\]      | 0.0† \[0–6.0\]      | 29.2† \[20.2–38.2\] | 41.4† \[32.4–50.4\] | 29.4† \[20.4–38.4\] | 0.0† \[0–9.0\]      | M     |
| 1900    | 6               | 36.4† \[33.4–39.4\] | 51.2† \[48.2–54.2\] | 11.7† \[8.7–14.7\]  | 0.7† \[0–3.7\]      | 12.0† \[7.0–17.0\]  | 48.7† \[43.7–53.7\] | 35.1† \[30.1–40.1\] | 4.1† \[0–9.1\]      | H     |
| 1950    | 8               | 5.5† \[2.5–8.5\]    | 25.4† \[22.4–28.4\] | 44.8† \[41.8–47.8\] | 24.3† \[21.3–27.3\] | 4.6† \[0–9.6\]      | 11.7† \[6.7–16.7\]  | 36.5† \[31.5–41.5\] | 47.2† \[42.2–52.2\] | H     |
| 2000    | 9               | 13.2† \[10.2–16.2\] | 46.3† \[43.3–49.3\] | 29.9† \[26.9–32.9\] | 10.6† \[7.6–13.6\]  | 7.3† \[2.3–12.3\]   | 26.8† \[21.8–31.8\] | 43.0† \[38.0–48.0\] | 23.0† \[18.0–28.0\] | H     |

## States, leadership and polity scale

### Frontier-state size

The ancient state rankings are especially uncertain because both polity
boundaries and population totals are reconstructed rather than
enumerated. Cliopatria independently places Early Dynastic Egypt and the
Sumerian city-state system among the largest political entities at 3000
BCE, while Taagepera's classic series likewise reconstructs the world's
largest state areas back to 3000 BC.
[\[9\]](https://pmc.ncbi.nlm.nih.gov/articles/PMC11822181/) The
exceptional Achaemenid share around 500 BC is not a typo: one commonly
cited reconstruction puts the empire at about 49.4m of 112.4m people
around 480 BC, or roughly 44% of humanity.
[\[10\]](https://www.guinnessworldrecords.com/world-records/largest-empire-by-percentage-of-world-population)

| Date    | Frontier-state exemplar                       | Population, m    | Share of world pop. | Pop. rank    | Area rank   | Largest state by population | Largest-state share                            | Conf. |
|---------|-----------------------------------------------|------------------|---------------------|--------------|-------------|-----------------------------|------------------------------------------------|-------|
| 3000 BC | Early Dynastic Egypt†                         | 1.5† \[1.0–2.2\] | 10.7%† \[7–16\]     | 1† \[1–3\]   | ~1–2†       | Egypt†                      | 10.7%† \[7–16\]                                | L     |
| 2000 BC | Middle Kingdom Egypt†                         | 2.2† \[1.5–3.2\] | 8.1%† \[5–12\]      | 1† \[1–3\]   | ~2†         | Egypt†                      | 8.1%† \[5–12\]                                 | L     |
| 1000 BC | Western Zhou†                                 | 5.5† \[3.5–8.0\] | 11.0%† \[7–16\]     | 1† \[1–3\]   | ~1–2†       | Western Zhou†               | 11.0%† \[7–16\]                                | L     |
| 500 BC  | Achaemenid Empire                             | 44† \[35–50\]    | 44%† \[35–50\]      | 1            | 1           | Achaemenid Empire           | 44% \[c.40–48\]                                | L/M   |
| 1 AD    | Han Empire                                    | 59.6 \[50–65\]   | 25.7%† \[22–29\]    | 1†           | ~2†         | Han Empire                  | 25.7%† \[22–29\]                               | M     |
| 500     | Northern Wei / major Chinese successor state† | 25† \[18–32\]    | 11.9%† \[9–15\]     | ~2† \[1–4\]  | ~2† \[1–4\] | Gupta India†                | 32† \[25–40\] m; 15.2%† \[12–19\]              | L/M   |
| 1000    | Song China                                    | 59† \[50–70\]    | 20.0%† \[17–24\]    | 1† \[1–2\]   | ~3† \[2–5\] | Song China                  | 20.0%† \[17–24\]                               | M     |
| 1300    | Yuan China†                                   | 80† \[65–90\]    | 20.5%† \[17–23\]    | 1†           | 1†          | Yuan†                       | 20.5%† \[17–23\]                               | M/L   |
| 1500    | Ming China                                    | 103† \[85–115\]  | 22.3%† \[18–25\]    | 1†           | ~2†         | Ming                        | 22.3%† \[18–25\]                               | M     |
| 1700    | Qing China†                                   | 138† \[120–160\] | 22.9%† \[20–27\]    | ~2†          | ~2†         | Mughal Empire†              | 150† \[130–170\] m; 24.9%† \[22–28\]           | M     |
| 1800    | Great Britain, metropole†                     | 16† \[14–18\]    | 1.6%† \[1.4–1.8\]   | ~8† \[6–10\] | ~20†        | Qing China†                 | 330† \[300–370\] m; 33.4%† \[30–37\]           | M     |
| 1850    | United Kingdom, metropole†                    | 27.5† \[25–30\]  | 2.2%† \[2.0–2.4\]   | ~6† \[5–8\]  | ~20†        | Qing China†                 | 420† \[380–450\] m; 33.3%† \[30–36\]           | M     |
| 1900    | United States†                                | 76† \[74–78\]    | 4.6%† \[4.5–4.7\]   | 4† \[3–5\]   | 4† \[3–5\]  | British Empire†             | 400† \[380–420\] m; 24.2%† \[23–25\]           | H/M   |
| 1950    | United States                                 | 152 \[150–153\]  | 6.0%† \[5.9–6.0\]   | 4†           | 4†          | China†                      | 554† \[540–560\] m; 21.8%† \[21–22\]           | H     |
| 2000    | United States                                 | 282 \[280–284\]  | 4.6%† \[4.6–4.6\]   | 3            | 4           | China                       | 1,260† \[1,240–1,280\] m; 20.5%† \[20.2–20.8\] | H     |

Maddison-style long-run estimates give China about 59.6m people in 1 CE,
59m in 1000, 103m in 1500, 138m in 1700 and 381m in 1820; India is
estimated at roughly 75m, 75m, 110m, 165m and 209m at the same dates.
Those benchmarks drive the central values above but are not precise
censuses.
[\[11\]](https://documents.worldbank.org/curated/en/493061468769922514/126526322_20041117164556/additional/multi0page.pdf)

For the colonial era I distinguish the **technological core state** from
its empire: Britain's metropole is the relevant population for whether
Age 6 is widespread domestically, whereas the "largest state" column
counts the broader imperial political unit when appropriate.

### Leadership by technological age

| Age | First polity/system to meet the age at productive scale | Approx. date    | Population rank then      | Had it led previous age?                    | Confidence |
|-----|---------------------------------------------------------|-----------------|---------------------------|---------------------------------------------|------------|
| 2   | Sumerian/Uruk city-state system†                        | c.3200–3000 BC† | ~3–5† \[1–8\]             | n/a                                         | L          |
| 3   | Achaemenid Persia†                                      | c.520–480 BC†   | 1†                        | No†                                         | L/M        |
| 4   | Han China†                                              | c.100 BC–1 AD†  | 1†                        | No†                                         | M          |
| 5   | Song China technological system†                        | c.1200–1280†    | 1†                        | No as dynasty; broadly yes as Chinese core† | M          |
| 6   | United Kingdom†                                         | c.1840–1850†    | ~6–8† \[5–10\], metropole | No†                                         | M          |
| 7   | United States†                                          | c.1942†         | ~3–4†                     | No†                                         | M/H        |
| 8   | United States                                           | 1945–1950†      | 4†                        | Yes                                         | H          |
| 9   | United States†                                          | c.1985–1995†    | 3†                        | Yes                                         | H/M        |

The Age-5 call is deliberately later than the invention of printing or
gunpowder: Song documentation shows the 1044 military manual already
describing true gunpowder and large-scale manufacture, while later Song
warfare supplies the broader firearms ecosystem needed for the age
definition.
[\[12\]](https://afe.easia.columbia.edu/songdynasty-module/tech-gunpowder.html)
The Age-6 threshold likewise requires the nineteenth-century combination
of steam industry, steam transport, railway/telegraph infrastructure and
related industrial systems; a working Newcomen engine in 1712 by itself
does not qualify Britain as Age 6.
[\[13\]](https://www.nms.ac.uk/discover-catalogue/the-newcomen-engine-and-its-role-in-britains-industrial-revolution)

On an **age-leadership** definition, the technological lead changes
hands **twice from 1000 to 2000**: China → Britain, then Britain →
United States. If dynastic succession is counted as a new "hand", the
number is higher, but that is mostly a political-label artefact rather
than a change of technological centre.

### Polity sizes

These estimates combine reconstructed polity populations with
Seshat/Cliopatria/Taagepera-style boundaries. Seshat explicitly codes
polity population and polity territory; Cliopatria is a geospatial
database of political entities extending from the fourth millennium BCE
to the present. [\[14\]](https://www.seshat-db.com/variable-hierarchy/)

| Date    | Polities with ≥1% of world population | Frontier-age polities | Confidence |
|---------|---------------------------------------|-----------------------|------------|
| 3000 BC | 6† \[4–10\]                           | 4† \[2–6\]            | L          |
| 2000 BC | 9† \[6–13\]                           | 6† \[3–9\]            | L          |
| 1000 BC | 12† \[8–17\]                          | 8† \[4–12\]           | L          |
| 500 BC  | 9† \[6–13\]                           | 5† \[3–8\]            | L          |
| 1 AD    | 8† \[6–12\]                           | 2† \[2–4\]            | M/L        |
| 500     | 11† \[8–15\]                          | 3† \[2–5\]            | M/L        |
| 1000    | 13† \[9–17\]                          | 4† \[2–7\]            | M/L        |
| 1300    | 10† \[7–14\]                          | 2† \[1–4\]            | M/L        |
| 1500    | 14† \[10–18\]                         | 6† \[4–9\]            | M          |
| 1700    | 15† \[11–19\]                         | 10† \[6–14\]          | M          |
| 1800    | 16† \[12–20\]                         | 12† \[8–16\]          | M          |
| 1850    | 18† \[14–22\]                         | 3† \[1–6\]            | M          |
| 1900    | 18† \[16–21\]                         | 10† \[7–14\]          | H          |
| 1950    | 22† \[19–25\]                         | 1† \[1–2\]            | H          |
| 2000    | 15† \[14–17\]                         | 10† \[7–14\]          | H          |

The interesting simulation implication is that a high world frontier
need not be demographically common. The extreme cases here are 1850 and
1950: technological discontinuities are initially concentrated in only a
few states even though those states can rapidly reshape military and
economic competition.

## Within-state and isolated-region gaps

### Within-state technological gaps

These are population-weighted disparities **inside** large political
units. Seshat's coding framework is useful here because it distinguishes
polity-level scale and infrastructural variables, but the particular
percentages below are model judgements rather than database fields.
[\[15\]](https://www.seshat-db.com/variable-hierarchy/)

| State/date             | Leading core                                                            | Lagging periphery                                                  | Core-to-periphery lag      | Own population ≥1 age behind leading region | Confidence |
|------------------------|-------------------------------------------------------------------------|--------------------------------------------------------------------|----------------------------|---------------------------------------------|------------|
| Han China, c.1 AD      | Lower Yellow/Wei basins, Age 4†                                         | Western/southern frontier zones, Ages 2–3†                         | 1–2 ages; ~300–900 years†  | 32%† \[25–40\]                              | M/L        |
| Song China, c.1100     | Kaifeng–lower Yangzi/Hangzhou commercial-industrial corridors, Age 4→5† | Southwest/frontier districts, Ages 3–4†                            | ~1 age; 150–350 years†     | 22%† \[15–30\]                              | M          |
| Qing China, c.1800     | Lower Yangzi/coastal and N-China cores, Age 5†                          | Tibet/Xinjiang/Mongolia and remote interior, Ages 2–4†             | 1–3 ages; 300–1,200 years† | 28%† \[20–38\]                              | M          |
| Mughal India, c.1700   | Agra–Delhi–Lahore and Bengal/port networks, Age 5-ish†                  | Forest, tribal and remote interior zones, Ages 3–4†                | 1–2 ages; 250–700 years†   | 38%† \[28–48\]                              | M/L        |
| Russian Empire, c.1900 | St Petersburg/Moscow/Poland industrial cores, Age 6†                    | Siberia/Central Asia/remote agrarian zones, Ages 3–5†              | 1–3 ages; 100–600 years†   | 52%† \[42–62\]                              | M          |
| United States, c.1950  | Northeast/California/military-science complexes, Age 8†                 | Rural South/interior and marginalised rural communities, Ages 6–7† | 1–2 ages; 20–80 years†     | 25%† \[18–35\]                              | M/H        |

### Isolated and weakly connected regions

"Years behind" here means approximately how long before the observation
date the contemporary frontier had first reached the lagging region's
coded age; it is **not** a claim that all technologies diffuse along a
single chronological track. "Americas" means pre-contact America before
1492; after that I mark it post-contact rather than pretending the
hemisphere remained isolated. Australia after European colonisation is
population-weighted across the whole continent; Pacific excludes
Australia/New Zealand for this table.

| Date    | Americas              | Australia             | Sub-Saharan Africa     | Pacific               | Confidence |
|---------|-----------------------|-----------------------|------------------------|-----------------------|------------|
| 3000 BC | 1 age; ~1–3k y†       | 2 ages; \>4k y†       | ~1 age; 1–3k y†        | 2 ages; \>4k y†       | L          |
| 2000 BC | 0–1 age; 0–1.5k y†    | 2 ages; \>5k y†       | 0–1 age; 0–1.5k y†     | 2 ages; \>5k y†       | L          |
| 1000 BC | 0–1 age; 0–1k y†      | 2 ages; \>6k y†       | 0–1 age; 0–1k y†       | 2 ages; \>6k y†       | L          |
| 500 BC  | 1–2 ages; 0.5–2.5k y† | 2–3 ages; 2.5–6k y†   | 1–2 ages; 0.5–2.5k y†  | 2–3 ages; 2.5–6k y†   | L          |
| 1 AD    | 1–2 ages; 0.5–3k y†   | 3–4 ages; 3–7k y†     | 1–2 ages; 0.5–3k y†    | 3–4 ages; 3–7k y†     | L          |
| 500     | 1–2 ages; 0.5–3.5k y† | 3–4 ages; 3.5–7.5k y† | 1–2 ages; 0.5–3.5k y†  | 3–4 ages; 3.5–7.5k y† | L          |
| 1000    | 0–2 ages; 0–4k y†     | ~3 ages; 4–8k y†      | 1–2 ages; 1–4k y†      | 2–3 ages; 2–6k y†     | L          |
| 1300    | 1–2 ages; 0.3–1.8k y† | ~4 ages; 4–8k y†      | 1–2 ages; 0.3–1.8k y†  | 3–4 ages; 2–7k y†     | L          |
| 1500    | 1–2 ages; 0.3–2.0k y† | ~4 ages; 4–8k y†      | 1–2 ages; 0.3–2k y†    | 3–4 ages; 2–7k y†     | L/M        |
| 1700    | Post-contact          | 3–4 ages; 2–7k y†     | 1–2 ages; 0.5–2k y†    | 3–4 ages; 2–7k y†     | M/L        |
| 1800    | Post-contact          | 2–4 ages; 0.5–5k y†   | 1–2 ages; 0.5–2k y†    | 2–4 ages; 1–6k y†     | M/L        |
| 1850    | Post-contact          | 1–3 ages; 0.1–2k y†   | 2–3 ages; 0.6–3k y†    | 2–4 ages; 0.6–5k y†   | M          |
| 1900    | Post-contact          | 0–2 ages; 0–0.5k y†   | 2–3 ages; 0.5–2.5k y†  | 1–3 ages; 0.1–2k y†   | M          |
| 1950    | Post-contact          | 0–1 age; 0–50 y†      | 2–4 ages; 100–1,300 y† | 1–3 ages; 20–700 y†   | M          |
| 2000    | Post-contact          | 0–1 age; 0–50 y†      | 2–3 ages; 50–750 y†    | 1–3 ages; 25–750 y†   | M/H        |

### When the gap peaked

| Measure                                                         | Peak date | Best estimate       | Low–high    | Confidence | Interpretation                                                                                                     |
|-----------------------------------------------------------------|-----------|---------------------|-------------|------------|--------------------------------------------------------------------------------------------------------------------|
| Share of world population **2+ ages behind first-use frontier** | **1950**  | **69.1%†**          | **63–75%†** | H/M        | Age 8 had appeared in the US, while most humanity was still distributed across Ages 5–7.                           |
| Share of world population **2+ ages behind mature frontier**    | **1950**  | **69.1%†**          | **63–75%†** | H/M        | US population itself was sufficient to clear the ~5% mature-frontier rule.                                         |
| Widest **non-trivial macro-regional** gap                       | **1950†** | **about 4–5 ages†** | **4–6†**    | M          | Age-8 frontier versus substantial populations still living in Age-3/4 conditions.                                  |
| Literal widest gap counting tiny isolated communities           | **2000†** | up to **8–9 ages†** | ~7–9†       | L          | A very small number of highly isolated foraging communities makes the literal maximum a poor simulation statistic. |

The first measure is the one I would use for game calibration: the
technological inequality peak comes not in the colonial nineteenth
century but around the mid-twentieth-century jump from Age 6 to Age 8,
because nuclear/computing capability was initially exceptionally
concentrated.

## Full region-by-date matrix

The following is the complete synthetic matrix. Population ranges widen
sharply backward in time in line with the weakness of ancient
demographic evidence. The technology shares are deliberately
coarse—mostly 15/85 or 50/50 transition mixtures—because the
game-relevant quantity is regional population exposure, not spurious
one-percentage-point archaeological precision. Comin–Easterly–Gong
provide the strongest cross-sectional anchors for 1000 BC, 1 CE and
1500; CHAT provides the principal comparative anchor after 1800.
[\[16\]](https://pubs.aeaweb.org/doi/10.1257/mac.2.3.65)

    region,date,population_low,population_best,population_high,land_km2,share_age0,share_age1,share_age2,share_age3,share_age4,share_age5,share_age6,share_age7,share_age8,share_age9,share_age10,confidence
    Mesopotamia/Levant,3000 BC,0.86,1.56,2.26,1500000,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Egypt/North Africa,3000 BC,0.86,1.56,2.26,4000000,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Anatolia/Iran,3000 BC,0.57,1.04,1.5,4000000,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Mediterranean Europe,3000 BC,0.57,1.04,1.5,3000000,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    NW Europe,3000 BC,0.29,0.52,0.75,2500000,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    E Europe/Russia,3000 BC,0.29,0.52,0.75,8000000,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Central Asian steppe,3000 BC,0.22,0.52,0.81,6000000,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    N India,3000 BC,0.86,1.56,2.26,2200000,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    S India,3000 BC,0.29,0.52,0.75,2200000,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    China core,3000 BC,0.57,1.04,1.5,3200000,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    China periphery,3000 BC,0.09,0.21,0.33,5000000,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Korea/Japan,3000 BC,0.06,0.1,0.15,800000,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    SE Asia mainland,3000 BC,0.29,0.52,0.75,2200000,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    SE Asian islands,3000 BC,0.11,0.21,0.3,2500000,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    W Africa/Sahel,3000 BC,0.22,0.52,0.81,5000000,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    E/Central Africa,3000 BC,0.22,0.52,0.81,7000000,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    S Africa,3000 BC,0.04,0.1,0.16,4000000,100.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Mesoamerica,3000 BC,0.18,0.41,0.65,2000000,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Andes,3000 BC,0.13,0.31,0.49,2000000,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    N America north of Mexico,3000 BC,0.21,0.5,0.78,11000000,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    S America outside Andes,3000 BC,0.14,0.33,0.52,9000000,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Australia/Pacific,3000 BC,0.13,0.31,0.49,8000000,100.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Arctic/Siberia,3000 BC,0.04,0.1,0.16,12000000,100.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Mesopotamia/Levant,2000 BC,1.56,2.59,3.63,1500000,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Egypt/North Africa,2000 BC,1.43,2.38,3.33,4000000,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Anatolia/Iran,2000 BC,1.17,1.94,2.72,4000000,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Mediterranean Europe,2000 BC,1.17,1.94,2.72,3000000,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    NW Europe,2000 BC,0.52,0.86,1.21,2500000,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    E Europe/Russia,2000 BC,0.65,1.08,1.51,8000000,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Central Asian steppe,2000 BC,0.41,0.86,1.31,6000000,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    N India,2000 BC,1.94,3.24,4.54,2200000,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    S India,2000 BC,0.97,1.62,2.27,2200000,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    China core,2000 BC,1.43,2.38,3.33,3200000,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    China periphery,2000 BC,0.26,0.54,0.82,5000000,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Korea/Japan,2000 BC,0.19,0.32,0.45,800000,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    SE Asia mainland,2000 BC,0.65,1.08,1.51,2200000,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    SE Asian islands,2000 BC,0.39,0.65,0.91,2500000,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    W Africa/Sahel,2000 BC,0.47,0.97,1.48,5000000,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    E/Central Africa,2000 BC,0.47,0.97,1.48,7000000,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    S Africa,2000 BC,0.1,0.22,0.33,4000000,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Mesoamerica,2000 BC,0.36,0.76,1.15,2000000,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Andes,2000 BC,0.26,0.54,0.82,2000000,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    N America north of Mexico,2000 BC,0.37,0.78,1.18,11000000,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    S America outside Andes,2000 BC,0.25,0.52,0.79,9000000,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Australia/Pacific,2000 BC,0.26,0.54,0.82,8000000,100.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Arctic/Siberia,2000 BC,0.1,0.22,0.33,12000000,100.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Mesopotamia/Levant,1000 BC,2.05,3.16,4.26,1500000,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Egypt/North Africa,1000 BC,1.71,2.63,3.55,4000000,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Anatolia/Iran,1000 BC,2.05,3.16,4.26,4000000,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Mediterranean Europe,1000 BC,2.74,4.21,5.68,3000000,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    NW Europe,1000 BC,1.37,2.11,2.84,2500000,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    E Europe/Russia,1000 BC,1.71,2.63,3.55,8000000,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Central Asian steppe,1000 BC,0.84,1.58,2.32,6000000,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    N India,1000 BC,3.42,5.26,7.11,2200000,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    S India,1000 BC,2.05,3.16,4.26,2200000,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    China core,1000 BC,3.42,5.26,7.11,3200000,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    China periphery,1000 BC,0.56,1.05,1.55,5000000,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Korea/Japan,1000 BC,0.55,0.84,1.14,800000,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    SE Asia mainland,1000 BC,1.37,2.11,2.84,2200000,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    SE Asian islands,1000 BC,0.82,1.26,1.71,2500000,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    W Africa/Sahel,1000 BC,1.39,2.63,3.87,5000000,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    E/Central Africa,1000 BC,1.12,2.11,3.09,7000000,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    S Africa,1000 BC,0.28,0.53,0.77,4000000,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Mesoamerica,1000 BC,0.84,1.58,2.32,2000000,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Andes,1000 BC,0.56,1.05,1.55,2000000,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    N America north of Mexico,1000 BC,0.84,1.58,2.32,11000000,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    S America outside Andes,1000 BC,0.56,1.05,1.55,9000000,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Australia/Pacific,1000 BC,0.39,0.74,1.08,8000000,100.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Arctic/Siberia,1000 BC,0.17,0.32,0.46,12000000,100.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Mesopotamia/Levant,500 BC,3.63,5.18,6.74,1500000,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Egypt/North Africa,500 BC,2.9,4.15,5.39,4000000,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Anatolia/Iran,500 BC,5.8,8.29,10.78,4000000,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Mediterranean Europe,500 BC,5.8,8.29,10.78,3000000,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    NW Europe,500 BC,2.9,4.15,5.39,2500000,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    E Europe/Russia,500 BC,3.63,5.18,6.74,8000000,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Central Asian steppe,500 BC,1.8,3.11,4.41,6000000,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    N India,500 BC,7.25,10.36,13.47,2200000,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    S India,500 BC,4.35,6.22,8.08,2200000,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    China core,500 BC,8.7,12.44,16.17,3200000,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    China periphery,500 BC,1.2,2.07,2.94,5000000,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Korea/Japan,500 BC,1.45,2.07,2.69,800000,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    SE Asia mainland,500 BC,2.9,4.15,5.39,2200000,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    SE Asian islands,500 BC,1.45,2.07,2.69,2500000,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    W Africa/Sahel,500 BC,3.01,5.18,7.36,5000000,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    E/Central Africa,500 BC,2.4,4.15,5.89,7000000,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    S Africa,500 BC,0.6,1.04,1.47,4000000,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Mesoamerica,500 BC,1.8,3.11,4.41,2000000,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Andes,500 BC,1.2,2.07,2.94,2000000,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    N America north of Mexico,500 BC,1.8,3.11,4.41,11000000,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    S America outside Andes,500 BC,1.2,2.07,2.94,9000000,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Australia/Pacific,500 BC,0.6,1.04,1.47,8000000,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Arctic/Siberia,500 BC,0.3,0.52,0.74,12000000,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Mesopotamia/Levant,1 AD,3.92,5.44,6.96,1500000,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Egypt/North Africa,1 AD,5.87,8.16,10.44,4000000,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Anatolia/Iran,1 AD,6.52,9.06,11.6,4000000,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Mediterranean Europe,1 AD,13.05,18.12,23.2,3000000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    NW Europe,1 AD,6.52,9.06,11.6,2500000,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    E Europe/Russia,1 AD,5.22,7.25,9.28,8000000,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Central Asian steppe,1 AD,2.17,3.62,5.07,6000000,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    N India,1 AD,29.36,40.78,52.2,2200000,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    S India,1 AD,19.58,27.19,34.8,2200000,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    China core,1 AD,33.93,47.12,60.32,3200000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    China periphery,1 AD,4.35,7.25,10.15,5000000,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Korea/Japan,1 AD,3.92,5.44,6.96,800000,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    SE Asia mainland,1 AD,5.22,7.25,9.28,2200000,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    SE Asian islands,1 AD,3.92,5.44,6.96,2500000,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    W Africa/Sahel,1 AD,4.35,7.25,10.15,5000000,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    E/Central Africa,1 AD,3.81,6.34,8.88,7000000,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    S Africa,1 AD,1.09,1.81,2.54,4000000,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Mesoamerica,1 AD,2.72,4.53,6.34,2000000,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Andes,1 AD,2.17,3.62,5.07,2000000,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    N America north of Mexico,1 AD,1.96,3.26,4.57,11000000,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    S America outside Andes,1 AD,1.31,2.18,3.05,9000000,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Australia/Pacific,1 AD,0.82,1.36,1.9,8000000,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Arctic/Siberia,1 AD,0.27,0.45,0.63,12000000,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Mesopotamia/Levant,500,3.09,4.41,5.74,1500000,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Egypt/North Africa,500,4.94,7.06,9.18,4000000,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Anatolia/Iran,500,4.94,7.06,9.18,4000000,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Mediterranean Europe,500,9.88,14.12,18.35,3000000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    NW Europe,500,5.56,7.94,10.32,2500000,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    E Europe/Russia,500,4.32,6.18,8.03,8000000,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Central Asian steppe,500,2.05,3.53,5.01,6000000,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    N India,500,24.71,35.29,45.88,2200000,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    S India,500,17.29,24.71,32.12,2200000,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    China core,500,24.71,35.29,45.88,3200000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    China periphery,500,3.58,6.18,8.77,5000000,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Korea/Japan,500,4.32,6.18,8.03,800000,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    SE Asia mainland,500,4.94,7.06,9.18,2200000,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    SE Asian islands,500,3.71,5.29,6.88,2500000,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    W Africa/Sahel,500,5.12,8.82,12.53,5000000,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    E/Central Africa,500,5.12,8.82,12.53,7000000,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    S Africa,500,1.54,2.65,3.76,4000000,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Mesoamerica,500,3.07,5.29,7.52,2000000,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Andes,500,2.56,4.41,6.26,2000000,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    N America north of Mexico,500,2.76,4.76,6.77,11000000,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    S America outside Andes,500,1.84,3.18,4.51,9000000,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Australia/Pacific,500,0.77,1.32,1.88,8000000,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Arctic/Siberia,500,0.26,0.44,0.63,12000000,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Mesopotamia/Levant,1000,4.87,6.49,8.12,1500000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Egypt/North Africa,1000,6.96,9.28,11.6,4000000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Anatolia/Iran,1000,6.96,9.28,11.6,4000000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Mediterranean Europe,1000,13.92,18.55,23.19,3000000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    NW Europe,1000,9.04,12.06,15.07,2500000,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    E Europe/Russia,1000,9.04,12.06,15.07,8000000,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Central Asian steppe,1000,3.51,5.57,7.63,6000000,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    N India,1000,32.7,43.6,54.5,2200000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    S India,1000,22.96,30.61,38.27,2200000,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    China core,1000,36.18,48.24,60.3,3200000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    China periphery,1000,4.68,7.42,10.17,5000000,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Korea/Japan,1000,6.96,9.28,11.6,800000,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    SE Asia mainland,1000,8.35,11.13,13.92,2200000,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    SE Asian islands,1000,6.26,8.35,10.44,2500000,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    W Africa/Sahel,1000,8.18,12.99,17.79,5000000,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    E/Central Africa,1000,7.6,12.06,16.52,7000000,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    S Africa,1000,2.92,4.64,6.35,4000000,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Mesoamerica,1000,5.84,9.28,12.71,2000000,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Andes,1000,4.68,7.42,10.17,2000000,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    N America north of Mexico,1000,5.26,8.35,11.44,11000000,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    S America outside Andes,1000,3.51,5.57,7.63,9000000,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Australia/Pacific,1000,1.17,1.86,2.54,8000000,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Arctic/Siberia,1000,0.58,0.93,1.27,12000000,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Mesopotamia/Levant,1300,6.94,9.01,11.08,1500000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Egypt/North Africa,1300,9.02,11.71,14.4,4000000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Anatolia/Iran,1300,9.02,11.71,14.4,4000000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Mediterranean Europe,1300,19.42,25.22,31.02,3000000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    NW Europe,1300,13.87,18.01,22.16,2500000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    E Europe/Russia,1300,13.87,18.01,22.16,8000000,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Central Asian steppe,1300,4.68,7.21,9.73,6000000,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    N India,1300,41.61,54.04,66.47,2200000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    S India,1300,29.13,37.83,46.53,2200000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    China core,1300,52.02,67.55,83.09,3200000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,medium†
    China periphery,1300,7.03,10.81,14.59,5000000,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Korea/Japan,1300,9.71,12.61,15.51,800000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    SE Asia mainland,1300,11.79,15.31,18.83,2200000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    SE Asian islands,1300,8.32,10.81,13.29,2500000,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    W Africa/Sahel,1300,10.54,16.21,21.89,5000000,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    E/Central Africa,1300,10.54,16.21,21.89,7000000,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    S Africa,1300,3.51,5.4,7.3,4000000,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Mesoamerica,1300,8.2,12.61,17.02,2000000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Andes,1300,6.44,9.91,13.38,2000000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    N America north of Mexico,1300,6.32,9.73,13.13,11000000,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    S America outside Andes,1300,4.22,6.48,8.75,9000000,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Australia/Pacific,1300,1.76,2.7,3.65,8000000,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Arctic/Siberia,1300,0.59,0.9,1.22,12000000,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,low†
    Mesopotamia/Levant,1500,7.35,9.18,11.02,1500000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,medium†
    Egypt/North Africa,1500,11.02,13.77,16.53,4000000,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,medium†
    Anatolia/Iran,1500,11.02,13.77,16.53,4000000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,medium†
    Mediterranean Europe,1500,25.71,32.14,38.57,3000000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,medium†
    NW Europe,1500,18.37,22.96,27.55,2500000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,medium†
    E Europe/Russia,1500,18.37,22.96,27.55,8000000,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,medium†
    Central Asian steppe,1500,5.0,7.35,9.7,6000000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    N India,1500,47.75,59.69,71.63,2200000,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,medium†
    S India,1500,33.06,41.32,49.59,2200000,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,medium†
    China core,1500,66.12,82.65,99.18,3200000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,medium†
    China periphery,1500,8.12,11.94,15.76,5000000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Korea/Japan,1500,12.49,15.61,18.73,800000,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,medium†
    SE Asia mainland,1500,14.69,18.37,22.04,2200000,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,medium†
    SE Asian islands,1500,11.02,13.77,16.53,2500000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    W Africa/Sahel,1500,13.74,20.2,26.67,5000000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    E/Central Africa,1500,13.74,20.2,26.67,7000000,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    S Africa,1500,4.37,6.43,8.49,4000000,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Mesoamerica,1500,11.24,16.53,21.82,2000000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Andes,1500,8.12,11.94,15.76,2000000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    N America north of Mexico,1500,6.74,9.92,13.09,11000000,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    S America outside Andes,1500,4.5,6.61,8.73,9000000,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Australia/Pacific,1500,1.87,2.75,3.64,8000000,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Arctic/Siberia,1500,0.62,0.92,1.21,12000000,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Mesopotamia/Levant,1700,9.27,10.91,12.54,1500000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,medium†
    Egypt/North Africa,1700,13.9,16.36,18.81,4000000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,medium†
    Anatolia/Iran,1700,13.9,16.36,18.81,4000000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,medium†
    Mediterranean Europe,1700,38.62,45.44,52.26,3000000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,medium†
    NW Europe,1700,30.9,36.35,41.81,2500000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,medium†
    E Europe/Russia,1700,30.9,36.35,41.81,8000000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,medium†
    Central Asian steppe,1700,7.72,9.09,10.45,6000000,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,medium†
    N India,1700,77.25,90.88,104.51,2200000,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,medium†
    S India,1700,50.21,59.07,67.93,2200000,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,medium†
    China core,1700,94.24,110.88,127.51,3200000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,medium†
    China periphery,1700,12.36,14.54,16.72,5000000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Korea/Japan,1700,18.54,21.81,25.08,800000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,medium†
    SE Asia mainland,1700,21.63,25.45,29.26,2200000,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,medium†
    SE Asian islands,1700,16.99,19.99,22.99,2500000,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,medium†
    W Africa/Sahel,1700,23.17,27.26,31.35,5000000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    E/Central Africa,1700,23.17,27.26,31.35,7000000,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    S Africa,1700,7.72,9.09,10.45,4000000,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Mesoamerica,1700,6.18,7.27,8.36,2000000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Andes,1700,4.63,5.45,6.27,2000000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    N America north of Mexico,1700,3.82,4.5,5.17,11000000,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    S America outside Andes,1700,3.13,3.68,4.23,9000000,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Australia/Pacific,1700,3.09,3.64,4.18,8000000,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Arctic/Siberia,1700,1.16,1.36,1.57,12000000,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Mesopotamia/Levant,1800,14.77,16.78,18.79,1500000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,medium†
    Egypt/North Africa,1800,22.97,26.1,29.23,4000000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,medium†
    Anatolia/Iran,1800,24.61,27.96,31.32,4000000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,medium†
    Mediterranean Europe,1800,61.52,69.91,78.3,3000000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,medium†
    NW Europe,1800,53.32,60.59,67.86,2500000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,medium†
    E Europe/Russia,1800,49.22,55.93,62.64,8000000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,medium†
    Central Asian steppe,1800,12.3,13.98,15.66,6000000,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,medium†
    N India,1800,98.43,111.86,125.28,2200000,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,medium†
    S India,1800,65.62,74.57,83.52,2200000,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,medium†
    China core,1800,246.08,279.64,313.2,3200000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,medium†
    China periphery,1800,24.61,27.96,31.32,5000000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Korea/Japan,1800,32.81,37.29,41.76,800000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,medium†
    SE Asia mainland,1800,32.81,37.29,41.76,2200000,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,medium†
    SE Asian islands,1800,24.61,27.96,31.32,2500000,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,medium†
    W Africa/Sahel,1800,32.81,37.29,41.76,5000000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    E/Central Africa,1800,32.81,37.29,41.76,7000000,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    S Africa,1800,9.84,11.19,12.53,4000000,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Mesoamerica,1800,7.38,8.39,9.4,2000000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Andes,1800,5.74,6.52,7.31,2000000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    N America north of Mexico,1800,7.38,8.39,9.4,11000000,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    S America outside Andes,1800,4.92,5.59,6.26,9000000,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Australia/Pacific,1800,4.1,4.66,5.22,8000000,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Arctic/Siberia,1800,1.64,1.86,2.09,12000000,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Mesopotamia/Levant,1850,18.48,20.53,22.59,1500000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,medium†
    Egypt/North Africa,1850,29.4,32.67,35.93,4000000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,medium†
    Anatolia/Iran,1850,31.92,35.47,39.01,4000000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,medium†
    Mediterranean Europe,1850,88.2,98.0,107.8,3000000,0.0,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,medium†
    NW Europe,1850,79.8,88.67,97.53,2500000,0.0,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,medium†
    E Europe/Russia,1850,71.4,79.33,87.27,8000000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,medium†
    Central Asian steppe,1850,15.12,16.8,18.48,6000000,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,medium†
    N India,1850,121.8,135.33,148.87,2200000,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,medium†
    S India,1850,79.8,88.67,97.53,2200000,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,medium†
    China core,1850,315.0,350.0,385.0,3200000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,medium†
    China periphery,1850,33.6,37.33,41.07,5000000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Korea/Japan,1850,42.0,46.67,51.33,800000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,medium†
    SE Asia mainland,1850,40.32,44.8,49.28,2200000,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,medium†
    SE Asian islands,1850,31.92,35.47,39.01,2500000,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,medium†
    W Africa/Sahel,1850,37.8,42.0,46.2,5000000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    E/Central Africa,1850,37.8,42.0,46.2,7000000,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    S Africa,1850,12.6,14.0,15.4,4000000,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Mesoamerica,1850,10.08,11.2,12.32,2000000,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,medium†
    Andes,1850,8.4,9.33,10.27,2000000,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,medium†
    N America north of Mexico,1850,13.1,14.56,16.02,11000000,0.0,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,medium†
    S America outside Andes,1850,7.06,7.84,8.62,9000000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Australia/Pacific,1850,5.88,6.53,7.19,8000000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Arctic/Siberia,1850,2.52,2.8,3.08,12000000,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,0.0,medium†
    Mesopotamia/Levant,1900,31.17,33.52,35.87,1500000,0.0,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,high†
    Egypt/North Africa,1900,40.08,43.1,46.11,4000000,0.0,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,high†
    Anatolia/Iran,1900,48.99,52.68,56.36,4000000,0.0,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,high†
    Mediterranean Europe,1900,138.06,148.45,158.84,3000000,0.0,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,high†
    NW Europe,1900,129.15,138.87,148.59,2500000,0.0,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,high†
    E Europe/Russia,1900,106.88,114.93,122.97,8000000,0.0,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,high†
    Central Asian steppe,1900,22.27,23.94,25.62,6000000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,high†
    N India,1900,169.23,181.97,194.71,2200000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,high†
    S India,1900,106.88,114.93,122.97,2200000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,high†
    China core,1900,293.93,316.05,338.17,3200000,0.0,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,high†
    China periphery,1900,48.99,52.68,56.36,5000000,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,high†
    Korea/Japan,1900,57.89,62.25,66.61,800000,0.0,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,high†
    SE Asia mainland,1900,57.89,62.25,66.61,2200000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,high†
    SE Asian islands,1900,48.99,52.68,56.36,2500000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,high†
    W Africa/Sahel,1900,53.44,57.46,61.49,5000000,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,high†
    E/Central Africa,1900,48.99,52.68,56.36,7000000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,high†
    S Africa,1900,17.81,19.15,20.5,4000000,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,0.0,high†
    Mesoamerica,1900,19.6,21.07,22.54,2000000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,high†
    Andes,1900,13.36,14.37,15.37,2000000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,high†
    N America north of Mexico,1900,46.32,49.8,53.29,11000000,0.0,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,high†
    S America outside Andes,1900,24.94,26.82,28.69,9000000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,high†
    Australia/Pacific,1900,8.91,9.58,10.25,8000000,0.0,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,high†
    Arctic/Siberia,1900,4.45,4.79,5.12,12000000,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,high†
    Mesopotamia/Levant,1950,51.09,53.22,55.35,1500000,0.0,0.0,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,high†
    Egypt/North Africa,1950,65.03,67.74,70.45,4000000,0.0,0.0,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,high†
    Anatolia/Iran,1950,78.96,82.25,85.54,4000000,0.0,0.0,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,high†
    Mediterranean Europe,1950,195.08,203.21,211.34,3000000,0.0,0.0,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,high†
    NW Europe,1950,176.5,183.86,191.21,2500000,0.0,0.0,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,high†
    E Europe/Russia,1950,176.5,183.86,191.21,8000000,0.0,0.0,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,high†
    Central Asian steppe,1950,32.51,33.87,35.22,6000000,0.0,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,high†
    N India,1950,218.31,227.4,236.5,2200000,0.0,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,high†
    S India,1950,139.35,145.15,150.96,2200000,0.0,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,high†
    China core,1950,427.33,445.13,462.94,3200000,0.0,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,high†
    China periphery,1950,74.32,77.41,80.51,5000000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,high†
    Korea/Japan,1950,97.54,101.61,105.67,800000,0.0,0.0,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,high†
    SE Asia mainland,1950,102.19,106.44,110.7,2200000,0.0,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,high†
    SE Asian islands,1950,74.32,77.41,80.51,2500000,0.0,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,high†
    W Africa/Sahel,1950,92.9,96.77,100.64,5000000,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,0.0,high†
    E/Central Africa,1950,88.25,91.93,95.61,7000000,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,high†
    S Africa,1950,32.51,33.87,35.22,4000000,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,0.0,high†
    Mesoamerica,1950,37.16,38.71,40.26,2000000,0.0,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,high†
    Andes,1950,27.87,29.03,30.19,2000000,0.0,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,0.0,high†
    N America north of Mexico,1950,157.93,164.51,171.09,11000000,0.0,0.0,0.0,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,high†
    S America outside Andes,1950,74.32,77.41,80.51,9000000,0.0,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,high†
    Australia/Pacific,1950,14.86,15.48,16.1,8000000,0.0,0.0,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,high†
    Arctic/Siberia,1950,8.36,8.71,9.06,12000000,0.0,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,high†
    Mesopotamia/Levant,2000,101.72,103.8,105.88,1500000,0.0,0.0,0.0,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,high†
    Egypt/North Africa,2000,162.76,166.08,169.4,4000000,0.0,0.0,0.0,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,high†
    Anatolia/Iran,2000,142.41,145.32,148.23,4000000,0.0,0.0,0.0,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,high†
    Mediterranean Europe,2000,193.28,197.22,201.17,3000000,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,15.0,85.0,0.0,high†
    NW Europe,2000,203.45,207.6,211.75,2500000,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,15.0,85.0,0.0,high†
    E Europe/Russia,2000,356.04,363.3,370.57,8000000,0.0,0.0,0.0,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,high†
    Central Asian steppe,2000,61.03,62.28,63.53,6000000,0.0,0.0,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,high†
    N India,2000,661.21,674.7,688.2,2200000,0.0,0.0,0.0,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,high†
    S India,2000,406.9,415.2,423.51,2200000,0.0,0.0,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,high†
    China core,2000,1098.63,1121.05,1143.47,3200000,0.0,0.0,0.0,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,high†
    China periphery,2000,183.1,186.84,190.58,5000000,0.0,0.0,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,high†
    Korea/Japan,2000,178.02,181.65,185.28,800000,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,15.0,85.0,0.0,high†
    SE Asia mainland,2000,223.79,228.36,232.93,2200000,0.0,0.0,0.0,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,high†
    SE Asian islands,2000,305.17,311.4,317.63,2500000,0.0,0.0,0.0,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,high†
    W Africa/Sahel,2000,264.48,269.88,275.28,5000000,0.0,0.0,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,0.0,high†
    E/Central Africa,2000,305.17,311.4,317.63,7000000,0.0,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,high†
    S Africa,2000,101.72,103.8,105.88,4000000,0.0,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,0.0,0.0,high†
    Mesoamerica,2000,101.72,103.8,105.88,2000000,0.0,0.0,0.0,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,high†
    Andes,2000,101.72,103.8,105.88,2000000,0.0,0.0,0.0,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,high†
    N America north of Mexico,2000,341.79,348.77,355.75,11000000,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,15.0,85.0,0.0,high†
    S America outside Andes,2000,472.0,481.64,491.27,9000000,0.0,0.0,0.0,0.0,0.0,0.0,0.0,15.0,85.0,0.0,0.0,high†
    Australia/Pacific,2000,35.6,36.33,37.06,8000000,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,50.0,50.0,0.0,high†
    Arctic/Siberia,2000,20.34,20.76,21.18,12000000,0.0,0.0,0.0,0.0,0.0,0.0,0.0,50.0,50.0,0.0,0.0,high†

## Uncertainty register

| Cell group / issue                         | What drives uncertainty                                                                                                                                      | Least-trustworthy estimates                                                        | Confidence implication                                                                                                                                                                                                                                                                                                                                                      |
|--------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Ancient population, especially before 1 CE | Sparse archaeological settlement counts; extrapolation from carrying capacity; conflicting old syntheses                                                     | Africa, steppe, Americas, China periphery and Oceania 3000–500 BC†                 | Low; often ±30–60% population ranges. Guinnane argues that many globally complete historical population series ultimately contain substantial guesswork. [\[17\]](https://www.cambridge.org/core/journals/journal-of-economic-history/article/we-do-not-know-the-population-of-every-country-in-the-world-for-the-past-two-thousand-years/D747DDC6E499C799B0471DBE33FEB0BB) |
| World population totals before 1500        | HYDE is internally consistent but necessarily combines heterogeneous historical estimates with allocation algorithms                                         | 3000 BC–1000 CE totals and their regional split†                                   | Low to medium. HYDE itself publishes very broad uncertainty in deep prehistory. [\[18\]](https://doi.org/10.5194/ESSD-9-927-2017)                                                                                                                                                                                                                                           |
| Age 2 at 3000 BC                           | Your Age 2 bundles technologies whose archaeological chronologies do not coincide exactly                                                                    | Egypt, Anatolia/Iran, N India and the exact size of the Sumerian Age-2 population† | Low. Sumer's writing/urban-administrative evidence is strong, but satisfying the whole bundle is interpretive. [\[19\]](https://www.getty.edu/art/exhibitions/mesopotamia/explore.html)                                                                                                                                                                                     |
| Age 3 transition, 1000–500 BC              | Iron, alphabet, coinage, siege systems and hydraulic construction spread asynchronously                                                                      | Mediterranean, Iran, India and China around 500 BC†                                | Low. The categorical boundary is more uncertain than individual technology dates.                                                                                                                                                                                                                                                                                           |
| Han as Age 4                               | Several Age-4 landmarks existed at scale, but "banking" and "celestial navigation" are harder to equate cross-culturally                                     | China core 1 CE†                                                                   | Medium. The classification is robust to a one-feature disagreement but not to a radically stricter definition.                                                                                                                                                                                                                                                              |
| Song as Age 5                              | Printing and gunpowder are secure; exact threshold for "cannon" and breadth of productive use is later                                                       | China 1000 versus 1300†                                                            | Medium. Gunpowder manufacture at 1044 is documented; treating the full bundle as mature by 1300 is safer than by 1000. [\[12\]](https://afe.easia.columbia.edu/songdynasty-module/tech-gunpowder.html)                                                                                                                                                                      |
| 1500 technology outside Eurasian cores     | Comin–Easterly–Gong gives country-predecessor indicators rather than population-weighted internal diffusion                                                  | Africa, Southeast Asia, American hinterlands†                                      | Medium/low. Their dataset is an anchor, not a direct answer to these shares. [\[20\]](https://pubs.aeaweb.org/doi/10.1257/mac.2.3.65)                                                                                                                                                                                                                                       |
| 1800 Age 5 vs 6 boundary                   | Steam was productive but the complete rail/steamship/telegraph/electric-oil package was not yet together                                                     | Britain 1800†                                                                      | Medium. Newcomen productive use is secure, but by the user's bundle Britain does not yet satisfy most Age-6 landmarks. [\[13\]](https://www.nms.ac.uk/discover-catalogue/the-newcomen-engine-and-its-role-in-britains-industrial-revolution)                                                                                                                                |
| 1850 first-use vs mature frontier          | Britain qualifies as Age 6 but is below 5% of world population                                                                                               | Global 1850 lag shares†                                                            | Medium. This is the single largest definitional effect of the mature-frontier rule.                                                                                                                                                                                                                                                                                         |
| 1900 internal diffusion                    | Rail/telegraph/steam industry were widespread along corridors but large rural populations remained less integrated                                           | Russia, India, China, Africa†                                                      | Medium/high for populations, medium for age shares. CHAT substantially improves the technology side after 1800. [\[21\]](https://www.nber.org/research/data/cross-country-historical-adoption-technology)                                                                                                                                                                   |
| 1950 Age 8 jump                            | Nuclear weapons and computing were extraordinarily concentrated; deciding how much of a national population "belongs" to that age is conceptually difficult  | US frontier share and all 1950 lag categories†                                     | High on who had the technologies, medium on population exposure.                                                                                                                                                                                                                                                                                                            |
| 2000 Age 9                                 | Networks, satellites, genetics and automation had diffused widely but very unevenly within states                                                            | India, China periphery, Africa, Pacific†                                           | High population confidence; medium technology-share confidence.                                                                                                                                                                                                                                                                                                             |
| Inhabited-land denominator                 | No standard historical statistic corresponds exactly to "land inhabited by people"; desert, tundra and very sparse ranges can dominate area-weighted results | Arctic/Siberia, Australia, steppe, Saharan portions†                               | Low/medium. Treat land shares as order-of-magnitude simulation inputs, not historical measurements.                                                                                                                                                                                                                                                                         |
| State population ranks before 1500         | Political borders, tributary status and population within borders are all disputed                                                                           | 3000 BC–1300 ranks†                                                                | Low to medium. Seshat/Cliopatria improve consistency but do not eliminate uncertainty. [\[22\]](https://seshat-db.com/)                                                                                                                                                                                                                                                     |
| Achaemenid world share                     | Extremely sensitive to the assumed world denominator                                                                                                         | 44% around 480 BC                                                                  | Medium. The cited reconstruction gives 49.4m of 112.4m, but both figures are estimates. [\[10\]](https://www.guinnessworldrecords.com/world-records/largest-empire-by-percentage-of-world-population)                                                                                                                                                                       |
| Within-state lag percentages               | Few sources directly measure population by technology bundle inside old empires                                                                              | Han, Mughal, Qing and Russian internal shares†                                     | Low/medium. These are among the most judgement-heavy cells in the report.                                                                                                                                                                                                                                                                                                   |
| "Years behind" in isolated-region table    | Ages are bundles, not a one-dimensional technological clock                                                                                                  | Australia/Pacific and pre-contact Americas†                                        | Low. Ages-behind is more defensible than years-behind.                                                                                                                                                                                                                                                                                                                      |
| Literal maximum gap                        | Tiny uncontacted or isolated populations can remain Age 0 even in a modern world                                                                             | 2000 maximum of 8–9 ages†                                                          | Low and simulation-sensitive; use the macro-regional 1950 peak instead.                                                                                                                                                                                                                                                                                                     |

The strongest calibration results are therefore the **direction and
timing** rather than individual ancient percentage points: relatively
modest global lag while the frontier stayed within Ages 2–4; a transient
jump when Song China first satisfies Age 5; another large discontinuity
with Britain's Age 6; and the largest population-weighted inequality in
this age scheme around **1950**, when an Age-8 United States coexisted
with the majority of humanity two or more categorical ages behind. The
source base is substantially firmer after 1800 because CHAT/HCCTA
explicitly track international technology adoption, whereas the ancient
matrix necessarily depends much more heavily on archaeological
judgement.
[\[23\]](https://www.nber.org/research/data/historical-cross-country-technology-adoption-hccta-dataset)

[\[1\]](https://doi.org/10.5194/ESSD-9-927-2017)
[\[4\]](https://doi.org/10.5194/ESSD-9-927-2017)
[\[18\]](https://doi.org/10.5194/ESSD-9-927-2017)
https://doi.org/10.5194/ESSD-9-927-2017

<https://doi.org/10.5194/ESSD-9-927-2017>

[\[2\]](https://pubs.aeaweb.org/doi/10.1257/mac.2.3.65)
[\[16\]](https://pubs.aeaweb.org/doi/10.1257/mac.2.3.65)
[\[20\]](https://pubs.aeaweb.org/doi/10.1257/mac.2.3.65)
https://pubs.aeaweb.org/doi/10.1257/mac.2.3.65

<https://pubs.aeaweb.org/doi/10.1257/mac.2.3.65>

[\[3\]](https://www.getty.edu/art/exhibitions/mesopotamia/explore.html)
[\[5\]](https://www.getty.edu/art/exhibitions/mesopotamia/explore.html)
[\[19\]](https://www.getty.edu/art/exhibitions/mesopotamia/explore.html)
https://www.getty.edu/art/exhibitions/mesopotamia/explore.html

<https://www.getty.edu/art/exhibitions/mesopotamia/explore.html>

[\[6\]](https://smarthistory.org/cuneiform)
https://smarthistory.org/cuneiform

<https://smarthistory.org/cuneiform>

[\[7\]](https://afe.easia.columbia.edu/songdynasty-module/tech-gunpowder.html)
[\[12\]](https://afe.easia.columbia.edu/songdynasty-module/tech-gunpowder.html)
https://afe.easia.columbia.edu/songdynasty-module/tech-gunpowder.html

<https://afe.easia.columbia.edu/songdynasty-module/tech-gunpowder.html>

[\[8\]](https://www.nber.org/research/data/cross-country-historical-adoption-technology)
[\[21\]](https://www.nber.org/research/data/cross-country-historical-adoption-technology)
https://www.nber.org/research/data/cross-country-historical-adoption-technology

<https://www.nber.org/research/data/cross-country-historical-adoption-technology>

[\[9\]](https://pmc.ncbi.nlm.nih.gov/articles/PMC11822181/)
https://pmc.ncbi.nlm.nih.gov/articles/PMC11822181/

<https://pmc.ncbi.nlm.nih.gov/articles/PMC11822181/>

[\[10\]](https://www.guinnessworldrecords.com/world-records/largest-empire-by-percentage-of-world-population)
https://www.guinnessworldrecords.com/world-records/largest-empire-by-percentage-of-world-population

<https://www.guinnessworldrecords.com/world-records/largest-empire-by-percentage-of-world-population>

[\[11\]](https://documents.worldbank.org/curated/en/493061468769922514/126526322_20041117164556/additional/multi0page.pdf)
https://documents.worldbank.org/curated/en/493061468769922514/126526322_20041117164556/additional/multi0page.pdf

<https://documents.worldbank.org/curated/en/493061468769922514/126526322_20041117164556/additional/multi0page.pdf>

[\[13\]](https://www.nms.ac.uk/discover-catalogue/the-newcomen-engine-and-its-role-in-britains-industrial-revolution)
https://www.nms.ac.uk/discover-catalogue/the-newcomen-engine-and-its-role-in-britains-industrial-revolution

<https://www.nms.ac.uk/discover-catalogue/the-newcomen-engine-and-its-role-in-britains-industrial-revolution>

[\[14\]](https://www.seshat-db.com/variable-hierarchy/)
[\[15\]](https://www.seshat-db.com/variable-hierarchy/)
https://www.seshat-db.com/variable-hierarchy/

<https://www.seshat-db.com/variable-hierarchy/>

[\[17\]](https://www.cambridge.org/core/journals/journal-of-economic-history/article/we-do-not-know-the-population-of-every-country-in-the-world-for-the-past-two-thousand-years/D747DDC6E499C799B0471DBE33FEB0BB)
https://www.cambridge.org/core/journals/journal-of-economic-history/article/we-do-not-know-the-population-of-every-country-in-the-world-for-the-past-two-thousand-years/D747DDC6E499C799B0471DBE33FEB0BB

<https://www.cambridge.org/core/journals/journal-of-economic-history/article/we-do-not-know-the-population-of-every-country-in-the-world-for-the-past-two-thousand-years/D747DDC6E499C799B0471DBE33FEB0BB>

[\[22\]](https://seshat-db.com/) https://seshat-db.com/

<https://seshat-db.com/>

[\[23\]](https://www.nber.org/research/data/historical-cross-country-technology-adoption-hccta-dataset)
https://www.nber.org/research/data/historical-cross-country-technology-adoption-hccta-dataset

<https://www.nber.org/research/data/historical-cross-country-technology-adoption-hccta-dataset>
