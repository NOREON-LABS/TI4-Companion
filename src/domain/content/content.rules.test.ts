import { describe, expect, it } from 'vitest';
import type { ContentTagged } from './content.types';
import { activeEntities, filterByContent, resolveOmega } from './content.rules';

const entity = (e: ContentTagged): ContentTagged => e;

const base = entity({ id: 'magen_defense_grid', source: 'base' });
const pokOnly = entity({ id: 'dark_energy_tap', source: 'pok' });
const codexOmega = entity({
  id: 'magen_defense_grid_omega',
  source: 'codex1',
  errata: 'omega',
  supersedesId: 'magen_defense_grid',
});

describe('filterByContent', () => {
  it('drops entities whose source is not enabled', () => {
    const result = filterByContent([base, pokOnly], ['base']);
    expect(result.map((e) => e.id)).toEqual(['magen_defense_grid']);
  });

  it('keeps entities from every enabled source', () => {
    const result = filterByContent([base, pokOnly], ['base', 'pok']);
    expect(result).toHaveLength(2);
  });
});

describe('resolveOmega', () => {
  it('hides the card an Ω revision supersedes', () => {
    const result = resolveOmega([base, codexOmega]);
    expect(result.map((e) => e.id)).toEqual(['magen_defense_grid_omega']);
  });

  it('leaves entities untouched when no Ω revision is present', () => {
    const result = resolveOmega([base, pokOnly]);
    expect(result).toHaveLength(2);
  });
});

describe('activeEntities (filter + Ω resolution)', () => {
  it('with Codex 1 disabled, the base version stays active', () => {
    const result = activeEntities([base, codexOmega, pokOnly], ['base', 'pok']);
    expect(result.map((e) => e.id).sort()).toEqual(['dark_energy_tap', 'magen_defense_grid']);
  });

  it('with Codex 1 enabled, the Ω version replaces the base version', () => {
    const result = activeEntities([base, codexOmega, pokOnly], ['base', 'pok', 'codex1']);
    expect(result.map((e) => e.id).sort()).toEqual([
      'dark_energy_tap',
      'magen_defense_grid_omega',
    ]);
  });
});
