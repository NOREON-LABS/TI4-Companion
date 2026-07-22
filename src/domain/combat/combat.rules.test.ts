import { describe, expect, it } from 'vitest';
import { EMPTY_COMBAT_MODIFIERS, profileFor, unitOrderFor } from './combat.data';
import { simulateCombat } from './combat.rules';
import type { CombatScenario } from './combat.types';

function scenario(attackerFighters: number, defenderFighters: number): CombatScenario {
  return {
    mode: 'space',
    attacker: {
      factionId: 'sol',
      units: { fighter: attackerFighters },
      upgrades: [],
      modifiers: EMPTY_COMBAT_MODIFIERS,
    },
    defender: {
      factionId: 'hacan',
      units: { fighter: defenderFighters },
      upgrades: [],
      modifiers: EMPTY_COMBAT_MODIFIERS,
    },
  };
}

describe('simulateCombat', () => {
  it('is deterministic for a supplied seed', () => {
    expect(simulateCombat(scenario(3, 2), 500, 42)).toEqual(
      simulateCombat(scenario(3, 2), 500, 42),
    );
  });

  it('reports an empty battlefield as a draw', () => {
    const result = simulateCombat(scenario(0, 0), 20, 7);
    expect(result.draw).toBe(100);
    expect(result.attackerWin).toBe(0);
    expect(result.defenderWin).toBe(0);
  });

  it('strongly favors an uncontested force', () => {
    const result = simulateCombat(scenario(2, 0), 100, 9);
    expect(result.attackerWin).toBe(100);
    expect(result.attackerLikelySurvivors).toContain('Fighter');
  });

  it('ignores upgrades for units that are not participating', () => {
    const baseline = scenario(3, 2);
    const withInactiveUpgrades: CombatScenario = {
      ...baseline,
      defender: {
        ...baseline.defender,
        upgrades: ['carrier', 'cruiser', 'destroyer', 'dreadnought', 'infantry', 'pds'],
      },
    };

    expect(simulateCombat(withInactiveUpgrades, 500)).toEqual(
      simulateCombat(baseline, 500),
    );
  });
});

describe('faction combat profiles', () => {
  it('uses each faction flagship instead of a generic profile', () => {
    expect(profileFor('flagship', false, 'sol').combat).toBe(5);
    expect(profileFor('flagship', false, 'jolnar')).toMatchObject({ combat: 6, combatDice: 2 });
    expect(profileFor('flagship', false, 'saar')).toMatchObject({ antiFighter: 6, antiFighterDice: 4 });
    expect(profileFor('flagship', true, 'nomad')).toMatchObject({ combat: 5, antiFighter: 5 });
  });

  it('applies faction units at both level I and II', () => {
    expect(profileFor('destroyer', false, 'argent').combat).toBe(8);
    expect(profileFor('destroyer', true, 'argent')).toMatchObject({ combat: 7, antiFighter: 6 });
    expect(profileFor('fighter', false, 'naalu').combat).toBe(8);
    expect(profileFor('infantry', false, 'sol').combat).toBe(7);
    expect(profileFor('pds', false, 'titans', 'ground')).toMatchObject({ combat: 7, sustain: true });
  });

  it('exposes cross-domain units only for the relevant flagship forces', () => {
    expect(unitOrderFor('space', 'nekro')).toContain('infantry');
    expect(unitOrderFor('ground', 'naalu')).toEqual(expect.arrayContaining(['flagship', 'fighter']));
    expect(unitOrderFor('space', 'sol')).not.toContain('infantry');
  });
});
