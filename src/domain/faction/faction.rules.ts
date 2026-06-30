import type { Faction } from './faction.types';

/** Fixed starting techs a faction owns immediately — autofilled when the faction is chosen. */
export function fixedStartingTechs(faction: Faction): readonly string[] {
  return faction.startingTechIds;
}

/** Whether the faction still needs the player to pick starting tech(s) (e.g. Winnu, Argent). */
export function hasStartingChoice(faction: Faction): boolean {
  return (faction.startingTechChoice?.count ?? 0) > 0;
}
