import { describe, expect, it } from 'vitest';
import { DEFAULT_ENABLED_CONTENT } from './content/content.types';
import { activeEntities } from './content/content.rules';
import { FACTIONS } from './faction/faction.data';
import { PLANETS } from './planet/planet.data';
import { TECHS } from './tech/tech.data';
import { TECH_COLORS } from './tech/tech.types';

const techIds = new Set(TECHS.map((t) => t.id));
const factionIds = new Set(FACTIONS.map((f) => f.id));
const colors = new Set<string>(TECH_COLORS);

describe('dataset integrity (generated from community data)', () => {
  it('has the expected in-scope volume', () => {
    expect(TECHS.length).toBeGreaterThanOrEqual(80);
    expect(FACTIONS.length).toBe(24);
    expect(PLANETS.length).toBeGreaterThanOrEqual(80);
  });

  it('ids are unique across each dataset', () => {
    expect(techIds.size).toBe(TECHS.length);
    expect(factionIds.size).toBe(FACTIONS.length);
    expect(new Set(PLANETS.map((p) => p.id)).size).toBe(PLANETS.length);
  });

  it('every tech has a valid source, prerequisites, faction, and Ω link', () => {
    for (const t of TECHS) {
      expect(['base', 'pok', 'codex1']).toContain(t.source);
      for (const [color, count] of Object.entries(t.prerequisites)) {
        expect(colors.has(color)).toBe(true);
        expect(count ?? 0).toBeGreaterThanOrEqual(1);
      }
      if (t.factionId) expect(factionIds.has(t.factionId)).toBe(true);
      if (t.errata === 'omega') {
        expect(t.supersedesId).toBeDefined();
        expect(techIds.has(t.supersedesId ?? '')).toBe(true);
      }
    }
  });

  it('faction starting techs, choices, and home planets reference real entities', () => {
    const planetIds = new Set(PLANETS.map((p) => p.id));
    for (const f of FACTIONS) {
      for (const id of f.startingTechIds) expect(techIds.has(id)).toBe(true);
      for (const id of f.homePlanetIds) expect(planetIds.has(id)).toBe(true);
      expect(f.homePlanetIds.length).toBeGreaterThanOrEqual(1);
      const choice = f.startingTechChoice;
      if (choice) {
        expect(choice.count).toBeGreaterThanOrEqual(1);
        expect(choice.options.length).toBeGreaterThanOrEqual(choice.count);
        for (const id of choice.options) expect(techIds.has(id)).toBe(true);
      }
    }
  });

  it('every tech has card text (for the quick-read detail view)', () => {
    for (const t of TECHS) expect(t.text.trim().length).toBeGreaterThan(0);
  });

  it('planet tech-skips are valid colours', () => {
    for (const p of PLANETS) if (p.techSpecialty) expect(colors.has(p.techSpecialty)).toBe(true);
  });

  it('Codex 1 Ω resolution removes the superseded base tech', () => {
    const active = new Set(activeEntities(TECHS, DEFAULT_ENABLED_CONTENT).map((t) => t.id));
    expect(active.has('md_c1')).toBe(true); // Magen Defense Grid Ω
    expect(active.has('md_base')).toBe(false); // superseded base version hidden
    expect(active.has('x89')).toBe(true); // X-89 Bacterial Weapon Ω
    expect(active.has('x89_base')).toBe(false);
  });
});
