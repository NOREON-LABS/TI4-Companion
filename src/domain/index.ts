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

// --- objective ---
export type { Objective, ObjectiveKind, ObjectivePhase } from './objective/objective.types';
export { OBJECTIVE_PHASES } from './objective/objective.types';
export { OBJECTIVES } from './objective/objective.data';
export type { ObjectiveScore, VpAdjustment, VictoryTarget } from './objective/objective.rules';
export {
  MAX_SCORED_SECRETS,
  VICTORY_TARGETS,
  hasReachedTarget,
  objectivesById,
  playerVp,
  scoredSecretCount,
  secretScoreBlocker,
  secretTakenBy,
} from './objective/objective.rules';

// --- planet ---
export type { Planet, PlanetTrait } from './planet/planet.types';
export { PLANETS } from './planet/planet.data';

// --- player ---
export type { PlayerColor } from './player/player.types';
export { PLAYER_COLORS } from './player/player.types';

// --- faction ---
export type { Faction, StartingTechChoice } from './faction/faction.types';
export { FACTIONS } from './faction/faction.data';
export { fixedStartingTechs, hasStartingChoice } from './faction/faction.rules';

// --- combat forecast ---
export type {
  CombatForce,
  CombatMode,
  CombatModifiers,
  CombatResult,
  CombatScenario,
  CombatUnitType,
  UnitProfile,
} from './combat/combat.types';
export {
  COMBAT_UNIT_TYPES,
} from './combat/combat.types';
export {
  EMPTY_COMBAT_FORCE,
  EMPTY_COMBAT_MODIFIERS,
  GROUND_UNIT_ORDER,
  SPACE_UNIT_ORDER,
  UNIT_LABELS,
  factionCombatOption,
  profileFor,
  unitOrderFor,
  upgradeTechId,
  upgradesFromTechs,
} from './combat/combat.data';
export { simulateCombat } from './combat/combat.rules';
