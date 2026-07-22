export const COMBAT_UNIT_TYPES = [
  'flagship',
  'warSun',
  'dreadnought',
  'carrier',
  'cruiser',
  'destroyer',
  'fighter',
  'mech',
  'infantry',
  'pds',
] as const;

export type CombatUnitType = (typeof COMBAT_UNIT_TYPES)[number];
export type CombatMode = 'space' | 'ground';

export interface CombatModifiers {
  readonly moraleBoost: boolean;
  readonly fighterPrototype: boolean;
  readonly shieldsHolding: boolean;
  readonly assaultCannon: boolean;
  readonly plasmaScoring: boolean;
  readonly antimassDeflectors: boolean;
  readonly munitionsReserves: boolean;
  readonly nebula: boolean;
  readonly factionAbility: boolean;
}

export interface CombatForce {
  readonly factionId: string;
  readonly units: Readonly<Partial<Record<CombatUnitType, number>>>;
  readonly upgrades: readonly CombatUnitType[];
  readonly modifiers: CombatModifiers;
}

export interface CombatScenario {
  readonly mode: CombatMode;
  readonly attacker: CombatForce;
  readonly defender: CombatForce;
}

export interface CombatResult {
  readonly iterations: number;
  readonly attackerWin: number;
  readonly draw: number;
  readonly defenderWin: number;
  readonly averageRounds: number;
  readonly attackerExpectedLoss: number;
  readonly defenderExpectedLoss: number;
  readonly attackerLikelySurvivors: string;
  readonly defenderLikelySurvivors: string;
}

export interface UnitProfile {
  readonly type: CombatUnitType;
  readonly label: string;
  readonly cost: number;
  readonly combat?: number;
  readonly combatDice?: number;
  readonly sustain?: boolean;
  readonly antiFighter?: number;
  readonly antiFighterDice?: number;
  readonly bombardment?: number;
  readonly bombardmentDice?: number;
  readonly spaceCannon?: number;
  readonly spaceCannonDice?: number;
  readonly planetaryShield?: boolean;
  readonly disablesPlanetaryShield?: boolean;
}
