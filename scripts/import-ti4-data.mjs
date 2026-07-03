// Generates src/domain/**/*.data.ts from vendored community datasets in scripts/sources/.
// Re-run with:  npm run data:import
//
// Sources (see scripts/sources/SOURCES.md for provenance + pinned commits):
//   - Techs + factions: AsyncTI4/TI4_map_generator_bot (exact prerequisites, faction
//     associations, starting techs, Codex Ω chain).
//   - Objectives: AsyncTI4/TI4_map_generator_bot (public stage I/II + secrets).
//   - Planets: Lazik10/TwilightImperiumUltimate (planet stats incl. tech-skips).
// Scope filter: Base + Prophecy of Kings + Codex 1 (Ordinian) only.

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, 'sources');
const DOMAIN = path.join(HERE, '..', 'src', 'domain');

const readJson = (f) => JSON.parse(readFileSync(path.join(SRC, f), 'utf8'));
const readText = (f) => readFileSync(path.join(SRC, f), 'utf8');

const TECH_SOURCES = new Set(['base', 'pok', 'codex1']);
const TYPE_TO_CATEGORY = {
  PROPULSION: 'blue',
  BIOTIC: 'green',
  CYBERNETIC: 'yellow',
  WARFARE: 'red',
  UNITUPGRADE: 'unit',
  NONE: 'faction',
};
const REQ_TO_COLOR = { B: 'blue', G: 'green', Y: 'yellow', R: 'red' };
const CATEGORY_ORDER = ['blue', 'green', 'yellow', 'red', 'unit', 'faction'];

const warnings = [];

const parsePrereqs = (req) => {
  const out = {};
  for (const ch of String(req ?? '').toUpperCase()) {
    const color = REQ_TO_COLOR[ch];
    if (color) out[color] = (out[color] ?? 0) + 1;
  }
  return out;
};
const familyOf = (name) => name.replace(/\s*Ω+\s*$/u, '').trim();
// Match AsyncTI4's placeholder records; tolerant of separators (e.g. "NULL\_REFERENCE").
const isJunk = (name) => /\?{2,}|NULL.{0,3}REFERENCE|ERROR.{0,3}ERROR/i.test(name);

const pascalToWords = (s) =>
  s
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Za-z])(\d)/g, '$1 $2')
    .replace(/(\d)([A-Z])/g, '$1 $2');
const pascalToSlug = (s) => pascalToWords(s).toLowerCase().replace(/\s+/g, '_');

// All techs (every source) -> alias→name, so we can resolve faction starting-tech
// references that point at out-of-scope Ω variants (e.g. Arborec's "md" = codex4 ΩΩ).
const rawTechs = readJson('async-technologies-pok.json');
const aliasToName = new Map(rawTechs.map((t) => [t.alias, t.name]));

function buildInScopeTechs() {
  return rawTechs
    .filter((t) => TECH_SOURCES.has(t.source) && !isJunk(t.name))
    .map((t) => {
      const tech = {
        id: t.alias,
        name: t.name,
        category: TYPE_TO_CATEGORY[t.types?.[0] ?? 'NONE'] ?? 'faction',
        prerequisites: parsePrereqs(t.requirements),
        text: (t.text ?? '').trim(),
        source: t.source,
      };
      if (t.faction) tech.factionId = t.faction;
      if (t.source === 'codex1' && / Ω$/u.test(t.name)) {
        const supersedesId = rawTechs.find((x) => x.name === familyOf(t.name))?.alias;
        if (supersedesId && TECH_SOURCES.has(rawTechs.find((x) => x.alias === supersedesId).source)) {
          tech.errata = 'omega';
          tech.supersedesId = supersedesId;
        }
      }
      return tech;
    });
}

function buildFactions(techs, activeIdByFamily, planets) {
  const raw = [...readJson('async-factions-base.json'), ...readJson('async-factions-pok.json')];
  const techIds = new Set(techs.map((t) => t.id));
  const idByName = new Map(techs.map((t) => [t.name, t.id]));

  // Resolve a faction's starting-tech alias to the in-scope active tech of its Ω-family.
  const resolveStart = (alias) => {
    const name = aliasToName.get(alias);
    if (name) {
      const active = activeIdByFamily.get(familyOf(name));
      if (active) return active;
    }
    return techIds.has(alias) ? alias : null;
  };

  // Home-planet ids differ in format between sources (AsyncTI4 "arcprime" vs our "arc_prime"):
  // match by id, then by a separator-insensitive normalisation, then a small override map for
  // the cases that don't normalise (roman numerals, the L1Z1X home).
  const planetIds = new Set(planets.map((p) => p.id));
  const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const planetByNorm = new Map(planets.map((p) => [normalize(p.id), p.id]));
  const HOME_OVERRIDES = {
    lisisii: 'lisis_two',
    mordaiii: 'mordai_two',
    '0.0.0': 'zero_dot_zero_dot_zero_dot',
  };
  const resolveHome = (planetId) =>
    planetIds.has(planetId)
      ? planetId
      : (HOME_OVERRIDES[planetId] ?? planetByNorm.get(normalize(planetId)) ?? null);

  const noPrereqGeneric = techs
    .filter((t) => !t.factionId && Object.keys(t.prerequisites).length === 0)
    .map((t) => t.id);
  const argentOptions = ['Neural Motivator', 'Sarween Tools', 'Plasma Scoring']
    .map((n) => idByName.get(n))
    .filter(Boolean);
  const CHOICES = {
    winnu: { count: 1, options: noPrereqGeneric },
    argent: { count: 2, options: argentOptions },
  };

  const factions = raw.map((f) => {
    const startingTechIds = (f.startingTech ?? [])
      .map((alias) => {
        const id = resolveStart(alias);
        if (!id) warnings.push(`faction "${f.alias}": starting tech "${alias}" did not resolve`);
        return id;
      })
      .filter((id) => id && techIds.has(id));
    const homePlanetIds = (f.homePlanets ?? [])
      .map((planetId) => {
        const id = resolveHome(planetId);
        if (!id) warnings.push(`faction "${f.alias}": home planet "${planetId}" did not resolve`);
        return id;
      })
      .filter((id) => id && planetIds.has(id));
    const faction = {
      id: f.alias,
      name: f.factionName,
      startingTechIds,
      homePlanetIds,
      source: f.source,
    };
    if (f.factionTech) faction.factionTechIds = f.factionTech.filter((id) => techIds.has(id));
    if (CHOICES[f.alias]) faction.startingTechChoice = CHOICES[f.alias];
    return faction;
  });
  factions.sort((a, b) => a.name.localeCompare(b.name));
  return factions;
}

function buildPlanets() {
  const cs = readText('ultimate-PlanetsData.cs');
  const TRAIT = { Industrial: 'industrial', Cultural: 'cultural', Hazardous: 'hazardous' };
  const SKIP = { Biotic: 'green', Propulsion: 'blue', Cybernetic: 'yellow', Warfare: 'red' };
  const VERSION = { BaseGame: 'base', ProphecyOfKings: 'pok' };

  const seen = new Set();
  const planets = [];
  for (const block of cs.split(/new Planet\(\)/).slice(1)) {
    const name = block.match(/PlanetName\.([A-Za-z0-9]+)/)?.[1];
    const version = block.match(/GameVersion\.([A-Za-z]+)/)?.[1];
    if (!name || !VERSION[version] || /Inactive/i.test(name)) continue; // base/PoK; skip artifacts
    const id = pascalToSlug(name);
    if (seen.has(id)) continue;
    seen.add(id);
    const trait = block.match(/PlanetTrait\.([A-Za-z]+)/)?.[1];
    const skip = block.match(/TechnologySkip = TechnologyType\.([A-Za-z]+)/)?.[1];
    const planet = {
      id,
      name: pascalToWords(name),
      resources: Number(block.match(/Resources = (\d+)/)?.[1] ?? 0),
      influence: Number(block.match(/Influence = (\d+)/)?.[1] ?? 0),
      source: VERSION[version],
    };
    if (TRAIT[trait]) planet.trait = TRAIT[trait];
    if (SKIP[skip]) planet.techSpecialty = SKIP[skip];
    if (/IsLegendary = true/.test(block)) planet.legendary = true;
    planets.push(planet);
  }
  planets.sort((a, b) => a.name.localeCompare(b.name));
  return planets;
}

function buildObjectives() {
  // Objectives are Base/PoK only (no codex revisions); the source files also carry
  // homebrew ("other", "pbd100", ...) which the source filter drops.
  const OBJECTIVE_SOURCES = new Set(['base', 'pok']);
  const KNOWN_PHASES = new Set(['status', 'action', 'agenda']);
  // Upstream phase strings are inconsistent ("Status" / "Status Phase" / "ACTION").
  const normalizePhase = (p) =>
    String(p ?? '')
      .toLowerCase()
      .replace(/\s*phase\s*$/, '')
      .trim();

  const read = (file, kind) =>
    readJson(file)
      .filter((o) => OBJECTIVE_SOURCES.has(o.source) && !isJunk(o.name))
      .map((o) => {
        const objective = { id: o.alias, name: o.name, kind };
        // Publics: stage I = 1 VP, stage II = 2 VP — stage is derivable from points.
        if (kind === 'public') objective.stage = o.points === 2 ? 2 : 1;
        objective.points = o.points;
        objective.phase = normalizePhase(o.phase);
        objective.text = (o.text ?? '').trim();
        if (o.notes) objective.notes = String(o.notes).trim();
        objective.source = o.source;
        return objective;
      });

  const objectives = [
    ...read('async-public-objectives.json', 'public'),
    ...read('async-secret-objectives.json', 'secret'),
  ];

  const seen = new Set();
  for (const o of objectives) {
    if (seen.has(o.id)) warnings.push(`objective: duplicate id "${o.id}"`);
    seen.add(o.id);
    if (!KNOWN_PHASES.has(o.phase)) warnings.push(`objective "${o.id}": unexpected phase "${o.phase}"`);
    if (o.kind === 'secret' && o.points !== 1) warnings.push(`objective "${o.id}": secret worth ${o.points} VP`);
  }

  objectives.sort(
    (a, b) =>
      a.kind.localeCompare(b.kind) || (a.stage ?? 0) - (b.stage ?? 0) || a.name.localeCompare(b.name),
  );
  return objectives;
}

// --- TS emission ---
function toLiteral(v) {
  if (Array.isArray(v)) return `[${v.map(toLiteral).join(', ')}]`;
  if (v && typeof v === 'object') {
    const entries = Object.entries(v);
    if (entries.length === 0) return '{}';
    return `{ ${entries.map(([k, val]) => `${k}: ${toLiteral(val)}`).join(', ')} }`;
  }
  if (typeof v === 'string') {
    const escaped = v
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n');
    return `'${escaped}'`;
  }
  return String(v);
}

function emit(file, typeName, constName, rows, source) {
  const header = `// GENERATED by scripts/import-ti4-data.mjs — do not edit by hand.
// ${source}
// Re-run: npm run data:import
import type { ${typeName} } from './${typeName.toLowerCase()}.types';
`;
  const body = rows.map((r) => `  ${toLiteral(r)},`).join('\n');
  writeFileSync(
    path.join(DOMAIN, file),
    `${header}\nexport const ${constName}: readonly ${typeName}[] = [\n${body}\n];\n`,
  );
}

// --- run ---
const ASYNC = 'Source: AsyncTI4/TI4_map_generator_bot (techs + factions)';
const ULT = 'Source: Lazik10/TwilightImperiumUltimate (planets)';

const inScope = buildInScopeTechs();

// First pass to know factions, so we can drop techs belonging to non-selectable factions.
const factionsPre = [...readJson('async-factions-base.json'), ...readJson('async-factions-pok.json')];
const factionIds = new Set(factionsPre.map((f) => f.alias));
const techs = inScope.filter((t) => !t.factionId || factionIds.has(t.factionId));
techs.sort(
  (a, b) =>
    CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) ||
    a.name.localeCompare(b.name),
);

// Active (non-superseded) tech id per Ω-family, for starting-tech resolution.
const superseded = new Set(techs.filter((t) => t.supersedesId).map((t) => t.supersedesId));
const activeIdByFamily = new Map();
for (const t of techs) if (!superseded.has(t.id)) activeIdByFamily.set(familyOf(t.name), t.id);

const planets = buildPlanets();
const factions = buildFactions(techs, activeIdByFamily, planets);

// Validation
const techIds = new Set(techs.map((t) => t.id));
const planetIds = new Set(planets.map((p) => p.id));
for (const f of factions) {
  for (const id of f.startingTechIds) if (!techIds.has(id)) warnings.push(`${f.id}: bad starting tech ${id}`);
  for (const id of f.startingTechChoice?.options ?? []) if (!techIds.has(id)) warnings.push(`${f.id}: bad choice option ${id}`);
  for (const id of f.homePlanetIds) if (!planetIds.has(id)) warnings.push(`${f.id}: bad home planet ${id}`);
}

const objectives = buildObjectives();

emit('tech/tech.data.ts', 'Tech', 'TECHS', techs, ASYNC);
emit('faction/faction.data.ts', 'Faction', 'FACTIONS', factions, ASYNC);
emit('planet/planet.data.ts', 'Planet', 'PLANETS', planets, ULT);
emit(
  'objective/objective.data.ts',
  'Objective',
  'OBJECTIVES',
  objectives,
  'Source: AsyncTI4/TI4_map_generator_bot (objectives)',
);

const summary = (rows) =>
  Object.entries(rows.reduce((a, r) => ((a[r.source] = (a[r.source] ?? 0) + 1), a), {}))
    .map(([k, n]) => `${k}=${n}`)
    .join(' ');

console.log(`techs:    ${techs.length} (${summary(techs)})`);
console.log(`factions: ${factions.length} (${summary(factions)})`);
console.log(`planets:  ${planets.length} (${summary(planets)})`);
console.log(
  `objectives: ${objectives.length} (${summary(objectives)}; ` +
    `I=${objectives.filter((o) => o.stage === 1).length} ` +
    `II=${objectives.filter((o) => o.stage === 2).length} ` +
    `secret=${objectives.filter((o) => o.kind === 'secret').length})`,
);
console.log(`Ω errata: ${techs.filter((t) => t.errata).length}`);
console.log(`choose:   ${factions.filter((f) => f.startingTechChoice).map((f) => f.id).join(', ')}`);
console.log(`no-start: ${factions.filter((f) => !f.startingTechIds.length && !f.startingTechChoice).map((f) => f.id).join(', ') || '(none)'}`);
if (warnings.length) {
  console.warn('\nWARNINGS:');
  for (const w of warnings) console.warn(' - ' + w);
} else {
  console.log('\nNo warnings.');
}
