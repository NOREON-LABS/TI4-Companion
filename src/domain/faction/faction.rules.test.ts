import { describe, expect, it } from 'vitest';
import { FACTIONS } from './faction.data';
import { fixedStartingTechs, hasStartingChoice } from './faction.rules';

const byId = (id: string) => {
  const faction = FACTIONS.find((f) => f.id === id);
  if (!faction) throw new Error(`unknown faction in test: ${id}`);
  return faction;
};

describe('faction starting techs', () => {
  it('autofills fixed starting techs for a normal faction', () => {
    expect(fixedStartingTechs(byId('sol'))).toEqual(['amd', 'nm']);
    expect(hasStartingChoice(byId('sol'))).toBe(false);
  });

  it('flags choose-factions and leaves the fixed set empty', () => {
    expect(fixedStartingTechs(byId('winnu'))).toEqual([]);
    expect(hasStartingChoice(byId('winnu'))).toBe(true);
    expect(byId('winnu').startingTechChoice?.count).toBe(1);

    expect(hasStartingChoice(byId('argent'))).toBe(true);
    expect(byId('argent').startingTechChoice?.count).toBe(2);
  });

  it('handles a faction with no starting tech at all', () => {
    expect(fixedStartingTechs(byId('sardakk'))).toEqual([]);
    expect(hasStartingChoice(byId('sardakk'))).toBe(false);
  });

  it('resolves a faction Ω starting tech to the in-scope version', () => {
    // Arborec starts with Magen Defense Grid; under Codex 1 that is the Ω (md_c1).
    expect(fixedStartingTechs(byId('arborec'))).toEqual(['md_c1']);
  });
});
