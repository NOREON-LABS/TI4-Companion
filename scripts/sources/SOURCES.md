# Vendored data sources

`scripts/import-ti4-data.mjs` generates `src/domain/**/*.data.ts` from the files in this
folder. They are vendored (committed) so the import is reproducible offline and the
provenance is explicit. This is **factual game data** (names, stats, prerequisites) extracted
for a personal fan tool — no card art or copyrighted images are included. Twilight Imperium
is © Fantasy Flight Games.

| File | Upstream | Pinned commit | Used for |
|---|---|---|---|
| `async-technologies-pok.json` | [AsyncTI4/TI4_map_generator_bot](https://github.com/AsyncTI4/TI4_map_generator_bot) `src/main/resources/data/technologies/pok.json` | `13801afdc754dfcf2eb5a0b7ecfeb21682d0c277` | technologies (colour, prerequisites, faction, Ω errata) |
| `async-factions-base.json` / `async-factions-pok.json` | same repo, `data/factions/{base,pok}.json` | `13801afdc754dfcf2eb5a0b7ecfeb21682d0c277` | factions + starting techs |
| `ultimate-PlanetsData.cs` | [Lazik10/TwilightImperiumUltimate](https://github.com/Lazik10/TwilightImperiumUltimate) | `99b8d35918d5b41bf28db3de5449af7e2b2894f5` | planet stats + tech-skips |
| `ultimate-PlanetName.cs` / `ultimate-PlanetTrait.cs` | same repo | `99b8d35918d5b41bf28db3de5449af7e2b2894f5` | planet enums (reference) |

**Scope filter:** only Base + Prophecy of Kings + Codex 1 (Ordinian) is imported; all other
content (Codex 2–4, Discordant Stars and other homebrew) is excluded.

**Curated in the importer** (not derivable from the data): the "choose your starting tech"
rules for Winnu (choose 1 no-prerequisite tech) and Argent Flight (choose 2 of Neural
Motivator / Sarween Tools / Plasma Scoring).
