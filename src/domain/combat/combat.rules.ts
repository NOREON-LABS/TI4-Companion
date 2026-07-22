import { profileFor, UNIT_LABELS, unitOrderFor } from './combat.data';
import type {
  CombatForce,
  CombatMode,
  CombatResult,
  CombatScenario,
  CombatUnitType,
  UnitProfile,
} from './combat.types';

interface UnitInstance {
  readonly type: CombatUnitType;
  readonly profile: UnitProfile;
  hp: number;
}

interface BattleSide {
  readonly factionId: string;
  units: UnitInstance[];
  shieldsAvailable: boolean;
  spaceGroundForces: boolean;
  groundFighters: boolean;
}

interface TrialResult {
  outcome: 'attacker' | 'draw' | 'defender';
  rounds: number;
  attackerLoss: number;
  defenderLoss: number;
  attackerSurvivors: string;
  defenderSurvivors: string;
}

interface HitPool {
  normal: number;
  nonFighter: number;
}

interface HitResult {
  remaining: number;
  retaliation: number;
  yinFlagshipDestroyed: boolean;
}

interface HitOptions {
  readonly mode: CombatMode;
  readonly fightersOnly?: boolean;
  readonly nonFighterOnly?: boolean;
  readonly sustainShipsOnly?: boolean;
  readonly sustainDisabled?: boolean;
}

type RandomSource = () => number;

function seededRandom(seed: number): RandomSource {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function createSide(force: CombatForce, mode: CombatMode): BattleSide {
  const upgrades = new Set(force.upgrades);
  const units: UnitInstance[] = [];
  for (const type of unitOrderFor(mode, force.factionId)) {
    const count = Math.max(0, Math.min(99, Math.floor(force.units[type] ?? 0)));
    const profile = profileFor(type, upgrades.has(type), force.factionId, mode);
    for (let index = 0; index < count; index += 1) {
      units.push({ type, profile, hp: profile.sustain ? 2 : 1 });
    }
  }
  const hasFlagship = units.some((unit) => unit.type === 'flagship');
  return {
    factionId: force.factionId,
    units,
    shieldsAvailable: force.modifiers.shieldsHolding,
    spaceGroundForces: force.factionId === 'nekro' && hasFlagship,
    groundFighters: force.factionId === 'naalu' && hasFlagship,
  };
}

function hasUnit(side: BattleSide, type: CombatUnitType): boolean {
  return side.units.some((unit) => unit.type === type);
}

function hasFlagship(side: BattleSide, factionId = side.factionId): boolean {
  return side.factionId === factionId && hasUnit(side, 'flagship');
}

function combatUnits(side: BattleSide, mode: CombatMode): UnitInstance[] {
  return side.units.filter((unit) => {
    if (unit.profile.combat === undefined) return false;
    if (mode === 'space') {
      if (unit.type === 'pds') return false;
      if (unit.type === 'mech') return side.spaceGroundForces || side.factionId === 'naaz';
      if (unit.type === 'infantry') return side.spaceGroundForces;
      return true;
    }
    if (unit.type === 'fighter') return side.groundFighters;
    return unit.type === 'mech' || unit.type === 'infantry' || unit.type === 'pds';
  });
}

function rollD10(random: RandomSource): number {
  return Math.floor(random() * 10) + 1;
}

function rollHits(
  side: BattleSide,
  opponent: BattleSide,
  force: CombatForce,
  round: number,
  mode: CombatMode,
  random: RandomSource,
): HitPool {
  const result: HitPool = { normal: 0, nonFighter: 0 };
  const ownUnits = combatUnits(side, mode);
  const jolNarMechShield = mode === 'ground' && side.factionId === 'jolnar' && hasUnit(side, 'mech');
  const sardakkFlagship = mode === 'space' && hasFlagship(side, 'sardakk');

  for (const unit of ownUnits) {
    if (unit.profile.combat === undefined) continue;
    const fragile = side.factionId === 'jolnar' && !(jolNarMechShield && unit.type === 'infantry') ? 1 : 0;
    const unrelenting = side.factionId === 'sardakk' ? -1 : 0;
    const sardakkFlagshipShift = sardakkFlagship && unit.type !== 'flagship' ? -1 : 0;
    const roundShift = (round === 1 && force.modifiers.moraleBoost ? -1 : 0) +
      (force.modifiers.nebula ? -1 : 0);
    const fighterShift = round === 1 && unit.type === 'fighter' && force.modifiers.fighterPrototype ? -2 : 0;
    const factionOptionShift = force.modifiers.factionAbility && unit.type === 'flagship'
      ? side.factionId === 'mahact'
        ? -2
        : side.factionId === 'hacan'
          ? -1
          : 0
      : 0;
    const target = Math.max(
      1,
      Math.min(10, unit.profile.combat + fragile + unrelenting + sardakkFlagshipShift + roundShift + fighterShift + factionOptionShift),
    );
    const dice = unit.type === 'flagship' && side.factionId === 'winnu'
      ? combatUnits(opponent, mode).filter((targetUnit) => targetUnit.type !== 'fighter').length
      : (unit.profile.combatDice ?? 1) +
        (unit.type === 'mech' && side.factionId === 'naaz' && hasFlagship(side, 'naaz') ? 1 : 0);

    for (let die = 0; die < dice; die += 1) {
      let roll = rollD10(random);
      if (roll < target && force.modifiers.munitionsReserves) roll = rollD10(random);
      if (roll < target) continue;

      let hits = 1;
      if (unit.type === 'flagship' && side.factionId === 'jolnar' && roll >= 9) hits += 2;
      if (side.factionId === 'l1z1x' && (unit.type === 'flagship' || unit.type === 'dreadnought')) {
        result.nonFighter += hits;
      } else {
        result.normal += hits;
      }
    }
  }
  return result;
}

function abilityHits(
  units: readonly UnitInstance[],
  ability: 'antiFighter' | 'bombardment' | 'spaceCannon',
  force: CombatForce,
  random: RandomSource,
  targetShift = 0,
): number {
  let hits = 0;
  let bestTarget = 11;
  for (const unit of units) {
    const threshold = unit.profile[ability];
    if (threshold === undefined) continue;
    bestTarget = Math.min(bestTarget, threshold);
    const dice = ability === 'antiFighter'
      ? unit.profile.antiFighterDice ?? 1
      : ability === 'bombardment'
        ? unit.profile.bombardmentDice ?? 1
        : unit.profile.spaceCannonDice ?? 1;
    for (let die = 0; die < dice; die += 1) {
      if (rollD10(random) >= Math.min(10, threshold + targetShift)) hits += 1;
    }
  }
  if (force.modifiers.plasmaScoring && ability !== 'antiFighter' && bestTarget <= 10) {
    if (rollD10(random) >= Math.min(10, bestTarget + targetShift)) hits += 1;
  }
  return hits;
}

function rollMentakAmbush(side: BattleSide, random: RandomSource): number {
  if (side.factionId !== 'mentak') return 0;
  return combatUnits(side, 'space')
    .filter((unit) => unit.type === 'cruiser' || unit.type === 'destroyer')
    .sort((a, b) => (a.profile.combat ?? 11) - (b.profile.combat ?? 11))
    .slice(0, 2)
    .reduce((hits, unit) => hits + (rollD10(random) >= (unit.profile.combat ?? 11) ? 1 : 0), 0);
}

function removeUnit(side: BattleSide, target: UnitInstance): void {
  const index = side.units.indexOf(target);
  if (index >= 0) side.units.splice(index, 1);
}

function hitCandidates(side: BattleSide, options: HitOptions): UnitInstance[] {
  return combatUnits(side, options.mode).filter((unit) => {
    if (options.fightersOnly && unit.type !== 'fighter') return false;
    if (options.nonFighterOnly && unit.type === 'fighter') return false;
    if (options.sustainShipsOnly && !(unit.profile.sustain && unit.type !== 'fighter')) return false;
    return true;
  });
}

function applyHits(side: BattleSide, incomingHits: number, options: HitOptions): HitResult {
  let hits = incomingHits;
  let retaliation = 0;
  let yinFlagshipDestroyed = false;
  if (!options.fightersOnly && !options.sustainShipsOnly && hits > 0 && side.shieldsAvailable) {
    hits = Math.max(0, hits - 2);
    side.shieldsAvailable = false;
  }

  while (hits > 0) {
    const candidates = hitCandidates(side, options);
    if (candidates.length === 0) break;
    const sustainTarget = options.sustainDisabled
      ? undefined
      : candidates.filter((unit) => unit.hp > 1).sort((a, b) => b.profile.cost - a.profile.cost)[0];
    if (sustainTarget) {
      sustainTarget.hp -= 1;
      if (options.mode === 'ground' && side.factionId === 'sardakk' && sustainTarget.type === 'mech') retaliation += 1;
      hits -= 1;
      continue;
    }
    const target = candidates.sort((a, b) => a.profile.cost - b.profile.cost)[0];
    if (!target) break;
    if (target.type === 'flagship' && side.factionId === 'yin') yinFlagshipDestroyed = true;
    removeUnit(side, target);
    hits -= 1;
  }
  return { remaining: hits, retaliation, yinFlagshipDestroyed };
}

function applyHitPool(
  side: BattleSide,
  pool: HitPool,
  options: Omit<HitOptions, 'nonFighterOnly'>,
): HitResult {
  const constrained = applyHits(side, pool.nonFighter, { ...options, nonFighterOnly: true });
  const normal = applyHits(side, pool.normal + constrained.remaining, options);
  return {
    remaining: normal.remaining,
    retaliation: constrained.retaliation + normal.retaliation,
    yinFlagshipDestroyed: constrained.yinFlagshipDestroyed || normal.yinFlagshipDestroyed,
  };
}

function destroySpaceCombatants(side: BattleSide): void {
  const combatants = new Set(combatUnits(side, 'space'));
  side.units = side.units.filter((unit) => !combatants.has(unit));
}

function resolveYinExplosion(attacker: BattleSide, defender: BattleSide, triggered: boolean): void {
  if (!triggered) return;
  destroySpaceCombatants(attacker);
  destroySpaceCombatants(defender);
}

function repairFlagship(side: BattleSide): void {
  if (side.factionId !== 'letnev') return;
  const flagship = side.units.find((unit) => unit.type === 'flagship');
  if (flagship?.profile.sustain) flagship.hp = 2;
}

function repairDynamo(side: BattleSide, force: CombatForce): void {
  if (side.factionId !== 'empyrean' || !force.modifiers.factionAbility) return;
  const damaged = combatUnits(side, 'space')
    .filter((unit) => unit.profile.sustain && unit.hp === 1)
    .sort((a, b) => b.profile.cost - a.profile.cost)[0];
  if (damaged) damaged.hp = 2;
}

function useDevotion(side: BattleSide, opponent: BattleSide, force: CombatForce): boolean {
  if (side.factionId !== 'yin' || !force.modifiers.factionAbility) return false;
  const sacrifice = combatUnits(side, 'space')
    .filter((unit) => unit.type === 'cruiser' || unit.type === 'destroyer')
    .sort((a, b) => a.profile.cost - b.profile.cost)[0];
  if (!sacrifice) return false;
  removeUnit(side, sacrifice);
  return applyHits(opponent, 1, { mode: 'space', sustainDisabled: hasFlagship(side, 'mentak') }).yinFlagshipDestroyed;
}

function indoctrinate(side: BattleSide, opponent: BattleSide, force: CombatForce): void {
  if (side.factionId !== 'yin' || !force.modifiers.factionAbility) return;
  const target = opponent.units.find((unit) => unit.type === 'infantry');
  if (!target) return;
  removeUnit(opponent, target);
  const profile = profileFor('infantry', force.upgrades.includes('infantry'), side.factionId, 'ground');
  side.units.push({ type: 'infantry', profile, hp: 1 });
}

function planetaryShieldActive(attacker: BattleSide, defender: BattleSide): boolean {
  return defender.units.some((unit) => unit.profile.planetaryShield || unit.type === 'pds') &&
    !attacker.units.some((unit) => unit.type === 'warSun' || unit.profile.disablesPlanetaryShield);
}

function resourceValue(units: readonly UnitInstance[]): number {
  return units.reduce((total, unit) => total + unit.profile.cost, 0);
}

function survivorSummary(units: readonly UnitInstance[]): string {
  const counts = new Map<CombatUnitType, number>();
  for (const unit of units) counts.set(unit.type, (counts.get(unit.type) ?? 0) + 1);
  const parts = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || UNIT_LABELS[a[0]].localeCompare(UNIT_LABELS[b[0]]))
    .slice(0, 3)
    .map(([type, count]) => `${count} ${UNIT_LABELS[type]}`);
  return parts.length > 0 ? parts.join(' · ') : 'No survivors';
}

function runTrial(scenario: CombatScenario, random: RandomSource): TrialResult {
  const attacker = createSide(scenario.attacker, scenario.mode);
  const defender = createSide(scenario.defender, scenario.mode);
  const attackerStart = resourceValue(attacker.units);
  const defenderStart = resourceValue(defender.units);

  if (scenario.mode === 'space') {
    const attackerCannon = hasFlagship(defender, 'argent')
      ? 0
      : abilityHits(attacker.units, 'spaceCannon', scenario.attacker, random, scenario.defender.modifiers.antimassDeflectors ? 1 : 0);
    const defenderCannon = hasFlagship(attacker, 'argent')
      ? 0
      : abilityHits(defender.units, 'spaceCannon', scenario.defender, random, scenario.attacker.modifiers.antimassDeflectors ? 1 : 0);
    const cannonOnDefender = applyHits(defender, attackerCannon, { mode: 'space' });
    const cannonOnAttacker = applyHits(attacker, defenderCannon, { mode: 'space' });
    resolveYinExplosion(attacker, defender, cannonOnDefender.yinFlagshipDestroyed || cannonOnAttacker.yinFlagshipDestroyed);

    const attackerBarrage = abilityHits(attacker.units, 'antiFighter', scenario.attacker, random);
    const defenderBarrage = abilityHits(defender.units, 'antiFighter', scenario.defender, random);
    const barrageOnDefender = applyHits(defender, attackerBarrage, { mode: 'space', fightersOnly: true });
    const barrageOnAttacker = applyHits(attacker, defenderBarrage, { mode: 'space', fightersOnly: true });
    let yinExplosion = barrageOnDefender.yinFlagshipDestroyed || barrageOnAttacker.yinFlagshipDestroyed;
    if (scenario.attacker.factionId === 'argent' && barrageOnDefender.remaining > 0) {
      yinExplosion ||= applyHits(defender, barrageOnDefender.remaining, { mode: 'space', sustainShipsOnly: true }).yinFlagshipDestroyed;
    }
    if (scenario.defender.factionId === 'argent' && barrageOnAttacker.remaining > 0) {
      yinExplosion ||= applyHits(attacker, barrageOnAttacker.remaining, { mode: 'space', sustainShipsOnly: true }).yinFlagshipDestroyed;
    }
    resolveYinExplosion(attacker, defender, yinExplosion);

    const ambushOnDefender = applyHits(defender, rollMentakAmbush(attacker, random), {
      mode: 'space',
      sustainDisabled: hasFlagship(attacker, 'mentak'),
    });
    const ambushOnAttacker = applyHits(attacker, rollMentakAmbush(defender, random), {
      mode: 'space',
      sustainDisabled: hasFlagship(defender, 'mentak'),
    });
    resolveYinExplosion(attacker, defender, ambushOnDefender.yinFlagshipDestroyed || ambushOnAttacker.yinFlagshipDestroyed);

    const attackerShips = combatUnits(attacker, 'space').filter((unit) => unit.type !== 'fighter').length;
    const defenderShips = combatUnits(defender, 'space').filter((unit) => unit.type !== 'fighter').length;
    if (attackerShips >= 3 && scenario.attacker.modifiers.assaultCannon) {
      const result = applyHits(defender, 1, { mode: 'space', nonFighterOnly: true, sustainDisabled: true });
      resolveYinExplosion(attacker, defender, result.yinFlagshipDestroyed);
    }
    if (defenderShips >= 3 && scenario.defender.modifiers.assaultCannon) {
      const result = applyHits(attacker, 1, { mode: 'space', nonFighterOnly: true, sustainDisabled: true });
      resolveYinExplosion(attacker, defender, result.yinFlagshipDestroyed);
    }
  } else {
    indoctrinate(attacker, defender, scenario.attacker);
    indoctrinate(defender, attacker, scenario.defender);
    const defenderCannon = abilityHits(defender.units, 'spaceCannon', scenario.defender, random, scenario.attacker.modifiers.antimassDeflectors ? 1 : 0);
    applyHits(attacker, defenderCannon, { mode: 'ground' });

    if (!planetaryShieldActive(attacker, defender)) {
      const bombardment = abilityHits(attacker.units, 'bombardment', scenario.attacker, random);
      applyHits(defender, bombardment, { mode: 'ground' });
    }
  }

  let rounds = 0;
  while (combatUnits(attacker, scenario.mode).length > 0 && combatUnits(defender, scenario.mode).length > 0 && rounds < 100) {
    rounds += 1;
    if (scenario.mode === 'space') {
      repairFlagship(attacker);
      repairFlagship(defender);
    }
    const attackerHits = rollHits(attacker, defender, scenario.attacker, rounds, scenario.mode, random);
    const defenderHits = rollHits(defender, attacker, scenario.defender, rounds, scenario.mode, random);
    const attackerSustainDisabled = scenario.mode === 'space'
      ? hasFlagship(defender, 'mentak')
      : defender.factionId === 'mentak' && hasUnit(defender, 'mech');
    const defenderSustainDisabled = scenario.mode === 'space'
      ? hasFlagship(attacker, 'mentak')
      : attacker.factionId === 'mentak' && hasUnit(attacker, 'mech');
    const onDefender = applyHitPool(defender, attackerHits, { mode: scenario.mode, sustainDisabled: defenderSustainDisabled });
    const onAttacker = applyHitPool(attacker, defenderHits, { mode: scenario.mode, sustainDisabled: attackerSustainDisabled });

    if (onDefender.retaliation > 0) applyHits(attacker, onDefender.retaliation, { mode: scenario.mode, sustainDisabled: attackerSustainDisabled });
    if (onAttacker.retaliation > 0) applyHits(defender, onAttacker.retaliation, { mode: scenario.mode, sustainDisabled: defenderSustainDisabled });
    resolveYinExplosion(attacker, defender, scenario.mode === 'space' && (onDefender.yinFlagshipDestroyed || onAttacker.yinFlagshipDestroyed));

    if (scenario.mode === 'space') {
      const attackerDevotionExplosion = useDevotion(attacker, defender, scenario.attacker);
      const defenderDevotionExplosion = useDevotion(defender, attacker, scenario.defender);
      resolveYinExplosion(attacker, defender, attackerDevotionExplosion || defenderDevotionExplosion);
      repairDynamo(attacker, scenario.attacker);
      repairDynamo(defender, scenario.defender);
    } else if (scenario.attacker.factionId === 'l1z1x' && !planetaryShieldActive(attacker, defender)) {
      const harrow = abilityHits(attacker.units, 'bombardment', scenario.attacker, random);
      applyHits(defender, harrow, { mode: 'ground' });
    }
  }

  const attackerAlive = combatUnits(attacker, scenario.mode).length > 0;
  const defenderAlive = combatUnits(defender, scenario.mode).length > 0;
  const outcome = attackerAlive === defenderAlive ? 'draw' : attackerAlive ? 'attacker' : 'defender';
  return {
    outcome,
    rounds,
    attackerLoss: attackerStart - resourceValue(attacker.units),
    defenderLoss: defenderStart - resourceValue(defender.units),
    attackerSurvivors: survivorSummary(combatUnits(attacker, scenario.mode)),
    defenderSurvivors: survivorSummary(combatUnits(defender, scenario.mode)),
  };
}

function mostCommon(values: readonly string[]): string {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'No survivors';
}

export function simulateCombat(
  scenario: CombatScenario,
  iterations = 6_000,
  seed = 0x71f4c0de,
): CombatResult {
  const safeIterations = Math.max(1, Math.floor(iterations));
  const random = seededRandom(seed);
  let attackerWins = 0;
  let draws = 0;
  let defenderWins = 0;
  let totalRounds = 0;
  let attackerLoss = 0;
  let defenderLoss = 0;
  const attackerSurvivors: string[] = [];
  const defenderSurvivors: string[] = [];

  for (let index = 0; index < safeIterations; index += 1) {
    const trial = runTrial(scenario, random);
    totalRounds += trial.rounds;
    attackerLoss += trial.attackerLoss;
    defenderLoss += trial.defenderLoss;
    if (trial.outcome === 'attacker') {
      attackerWins += 1;
      attackerSurvivors.push(trial.attackerSurvivors);
    } else if (trial.outcome === 'defender') {
      defenderWins += 1;
      defenderSurvivors.push(trial.defenderSurvivors);
    } else {
      draws += 1;
    }
  }

  const percentage = (count: number) => Math.round((count / safeIterations) * 1000) / 10;
  return {
    iterations: safeIterations,
    attackerWin: percentage(attackerWins),
    draw: percentage(draws),
    defenderWin: percentage(defenderWins),
    averageRounds: Math.round((totalRounds / safeIterations) * 10) / 10,
    attackerExpectedLoss: Math.round((attackerLoss / safeIterations) * 10) / 10,
    defenderExpectedLoss: Math.round((defenderLoss / safeIterations) * 10) / 10,
    attackerLikelySurvivors: mostCommon(attackerSurvivors),
    defenderLikelySurvivors: mostCommon(defenderSurvivors),
  };
}
