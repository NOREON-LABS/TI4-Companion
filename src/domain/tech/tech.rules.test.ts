import { describe, expect, it } from 'vitest';
import { PLANETS } from '../planet/planet.data';
import type { Planet } from '../planet/planet.types';
import { TECHS } from './tech.data';
import type { Tech } from './tech.types';
import { availablePrerequisites, canResearch, researchableTechs } from './tech.rules';

const tech = (id: string): Tech => {
  const found = TECHS.find((t) => t.id === id);
  if (!found) throw new Error(`unknown tech in test: ${id}`);
  return found;
};
const planet = (id: string): Planet => {
  const found = PLANETS.find((p) => p.id === id);
  if (!found) throw new Error(`unknown planet in test: ${id}`);
  return found;
};
const ids = (techs: readonly Tech[]) => techs.map((t) => t.id);

// Real-data anchors: amd = Antimass Deflectors (blue, no prereq), gd = Gravity Drive
// (1 blue), fl = Fleet Logistics (2 blue), cr2 = Cruiser II (unit), ac2 = Advanced Carrier II
// (Sol faction unit, 2 blue). gral is a base planet with a blue tech-skip.

describe('availablePrerequisites', () => {
  it('counts colours from owned coloured techs and controlled planet tech-skips', () => {
    const counts = availablePrerequisites([tech('amd')], [planet('gral')]);
    expect(counts.blue).toBe(2); // amd (blue) + Gral (blue skip)
    expect(counts.green).toBe(0);
  });

  it('does not count unit upgrades as prerequisites', () => {
    expect(availablePrerequisites([tech('cr2')], [])).toEqual({
      blue: 0,
      green: 0,
      yellow: 0,
      red: 0,
    });
  });
});

describe('canResearch / researchableTechs', () => {
  it('locks a tech when its coloured prerequisite is unmet', () => {
    expect(ids(researchableTechs(TECHS, [], []))).not.toContain('gd'); // needs 1 blue
  });

  it('unlocks a tech via an owned tech of the right colour', () => {
    expect(ids(researchableTechs(TECHS, [tech('amd')], []))).toContain('gd');
  });

  it('unlocks a tech via a controlled planet tech-skip (the tracer-bullet scenario)', () => {
    expect(ids(researchableTechs(TECHS, [], []))).not.toContain('gd');
    expect(ids(researchableTechs(TECHS, [], [planet('gral')]))).toContain('gd');
  });

  it('combines owned techs and planet skips to meet a multi-count prerequisite', () => {
    // fl needs 2 blue: amd (1) + Gral skip (1)
    expect(ids(researchableTechs(TECHS, [tech('amd')], [planet('gral')]))).toContain('fl');
  });

  it('never returns an already-owned tech', () => {
    expect(ids(researchableTechs(TECHS, [tech('amd'), tech('gd')], []))).not.toContain('gd');
  });

  it('gates faction-specific techs by the active faction', () => {
    const available = { blue: 2, green: 0, yellow: 0, red: 0 };
    const owned = new Set<string>();
    expect(canResearch(tech('ac2'), available, owned, { factionId: 'sol' })).toBe(true);
    expect(canResearch(tech('ac2'), available, owned, { factionId: 'hacan' })).toBe(false);
    expect(canResearch(tech('ac2'), available, owned)).toBe(false);
  });
});
