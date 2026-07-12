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

  describe('AI Development Algorithm (aida)', () => {
    // cr2 = Cruiser II (unit, needs green 1 + yellow 1 + red 1)
    it('lets a unit upgrade ignore exactly 1 missing prerequisite', () => {
      const oneShort = { blue: 0, green: 0, yellow: 1, red: 1 }; // missing 1 green
      expect(canResearch(tech('cr2'), oneShort, new Set(['aida']))).toBe(true);
      expect(canResearch(tech('cr2'), oneShort, new Set())).toBe(false);
    });

    it('does not let a unit upgrade skip 2 or more missing prerequisites', () => {
      const twoShort = { blue: 0, green: 0, yellow: 0, red: 1 }; // missing green + yellow
      expect(canResearch(tech('cr2'), twoShort, new Set(['aida']))).toBe(false);
    });

    it('does not apply to non-unit technologies', () => {
      const oneShort = { blue: 0, green: 0, yellow: 0, red: 0 }; // gd needs 1 blue
      expect(canResearch(tech('gd'), oneShort, new Set(['aida']))).toBe(false);
    });

    it('surfaces through researchableTechs when aida is owned', () => {
      // cr2 (Cruiser II) needs green 1 + yellow 1 + red 1. Owning st (yellow, no
      // prereq) and ps (red, no prereq) leaves green 1 short; aida should cover it.
      const owned = [tech('st'), tech('ps')];
      expect(ids(researchableTechs(TECHS, owned, []))).not.toContain('cr2');
      expect(ids(researchableTechs(TECHS, [...owned, tech('aida')], []))).toContain('cr2');
    });
  });

  describe('Inheritance Systems (is)', () => {
    // lwd = Light/Wave Deflector (blue, needs blue 3) — any category, not just units.
    it('ignores all of a technology\'s missing prerequisites once owned', () => {
      const none = { blue: 0, green: 0, yellow: 0, red: 0 };
      expect(canResearch(tech('lwd'), none, new Set())).toBe(false);
      expect(canResearch(tech('lwd'), none, new Set(['is']))).toBe(true);
    });

    it('still respects faction gating on top of the prerequisite skip', () => {
      const none = { blue: 0, green: 0, yellow: 0, red: 0 };
      expect(canResearch(tech('ac2'), none, new Set(['is']), { factionId: 'sol' })).toBe(true);
      expect(canResearch(tech('ac2'), none, new Set(['is']), { factionId: 'hacan' })).toBe(false);
    });

    it('surfaces through researchableTechs only once is is owned', () => {
      expect(ids(researchableTechs(TECHS, [], []))).not.toContain('lwd');
      expect(ids(researchableTechs(TECHS, [tech('is')], []))).toContain('lwd');
    });
  });
});
