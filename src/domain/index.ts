/**
 * Public surface of the domain layer: TI4 static data, types, and pure rules.
 * Depends on neither the database nor the UI. Import from here (`@domain`) elsewhere.
 */

// --- content / expansions ---
export type { ContentSource, EnabledContent, ContentTagged } from './content/content.types';
export {
  CONTENT_SOURCES,
  DEFAULT_ENABLED_CONTENT,
  isContentSource,
} from './content/content.types';
export {
  isContentEnabled,
  filterByContent,
  resolveOmega,
  activeEntities,
} from './content/content.rules';

// --- tech ---
export type { Tech, TechColor, TechCategory, Prerequisites } from './tech/tech.types';
export { TECH_COLORS, isTechColor } from './tech/tech.types';
export { TECHS } from './tech/tech.data';
export type { PrereqCounts, ResearchOptions } from './tech/tech.rules';
export { availablePrerequisites, canResearch, researchableTechs } from './tech/tech.rules';

// --- planet ---
export type { Planet, PlanetTrait } from './planet/planet.types';
export { PLANETS } from './planet/planet.data';

// --- faction ---
export type { Faction, StartingTechChoice } from './faction/faction.types';
export { FACTIONS } from './faction/faction.data';
export { fixedStartingTechs, hasStartingChoice } from './faction/faction.rules';
