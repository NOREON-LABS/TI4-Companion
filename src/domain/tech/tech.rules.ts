import type { Planet } from '../planet/planet.types';
import { TECH_COLORS, isTechColor } from './tech.types';
import type { Tech, TechColor } from './tech.types';

export type PrereqCounts = Record<TechColor, number>;

function emptyCounts(): PrereqCounts {
  return { blue: 0, green: 0, yellow: 0, red: 0 };
}

/**
 * Coloured prerequisites currently available to a player: one per owned coloured tech,
 * plus one per controlled planet that carries a tech-skip of that colour. Prerequisites
 * are not consumed in TI4 — they only need to be *present*.
 */
export function availablePrerequisites(
  ownedTechs: readonly Tech[],
  controlledPlanets: readonly Planet[],
): PrereqCounts {
  const counts = emptyCounts();
  for (const tech of ownedTechs) {
    if (isTechColor(tech.category)) counts[tech.category] += 1;
  }
  for (const planet of controlledPlanets) {
    if (planet.techSpecialty) counts[planet.techSpecialty] += 1;
  }
  return counts;
}

export interface ResearchOptions {
  /** Active faction id — gates faction-specific technologies. */
  readonly factionId?: string;
}

/** Whether a single tech can be researched right now given the available prerequisites. */
export function canResearch(
  tech: Tech,
  available: PrereqCounts,
  ownedIds: ReadonlySet<string>,
  options: ResearchOptions = {},
): boolean {
  if (ownedIds.has(tech.id)) return false;
  if (tech.factionId && tech.factionId !== options.factionId) return false;
  return TECH_COLORS.every((color) => available[color] >= (tech.prerequisites[color] ?? 0));
}

/** Every tech the player can research right now. */
export function researchableTechs(
  allTechs: readonly Tech[],
  ownedTechs: readonly Tech[],
  controlledPlanets: readonly Planet[],
  options: ResearchOptions = {},
): Tech[] {
  const available = availablePrerequisites(ownedTechs, controlledPlanets);
  const ownedIds = new Set(ownedTechs.map((t) => t.id));
  return allTechs.filter((tech) => canResearch(tech, available, ownedIds, options));
}
