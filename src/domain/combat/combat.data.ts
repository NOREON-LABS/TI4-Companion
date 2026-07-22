import type {
  CombatForce,
  CombatMode,
  CombatModifiers,
  CombatUnitType,
  UnitProfile,
} from './combat.types';

export const EMPTY_COMBAT_MODIFIERS: CombatModifiers = {
  moraleBoost: false,
  fighterPrototype: false,
  shieldsHolding: false,
  assaultCannon: false,
  plasmaScoring: false,
  antimassDeflectors: false,
  munitionsReserves: false,
  nebula: false,
  factionAbility: false,
};

export const EMPTY_COMBAT_FORCE: CombatForce = {
  factionId: 'sol',
  units: {},
  upgrades: [],
  modifiers: EMPTY_COMBAT_MODIFIERS,
};

export const SPACE_UNIT_ORDER: readonly CombatUnitType[] = [
  'flagship',
  'warSun',
  'dreadnought',
  'carrier',
  'cruiser',
  'destroyer',
  'fighter',
  'pds',
];

export const GROUND_UNIT_ORDER: readonly CombatUnitType[] = [
  'warSun',
  'dreadnought',
  'mech',
  'infantry',
  'pds',
];

export const UNIT_LABELS: Readonly<Record<CombatUnitType, string>> = {
  flagship: 'Flagship',
  warSun: 'War Sun',
  dreadnought: 'Dreadnought',
  carrier: 'Carrier',
  cruiser: 'Cruiser',
  destroyer: 'Destroyer',
  fighter: 'Fighter',
  mech: 'Mech',
  infantry: 'Infantry',
  pds: 'PDS',
};

const BASE_PROFILES: Readonly<Record<CombatUnitType, UnitProfile>> = {
  flagship: {
    type: 'flagship',
    label: 'Flagship',
    cost: 8,
    combat: 7,
    combatDice: 2,
    sustain: true,
  },
  warSun: {
    type: 'warSun',
    label: 'War Sun',
    cost: 12,
    combat: 3,
    combatDice: 3,
    sustain: true,
    bombardment: 3,
    bombardmentDice: 3,
  },
  dreadnought: {
    type: 'dreadnought',
    label: 'Dreadnought',
    cost: 4,
    combat: 5,
    sustain: true,
    bombardment: 5,
  },
  carrier: { type: 'carrier', label: 'Carrier', cost: 3, combat: 9 },
  cruiser: { type: 'cruiser', label: 'Cruiser', cost: 2, combat: 7 },
  destroyer: {
    type: 'destroyer',
    label: 'Destroyer',
    cost: 1,
    combat: 9,
    antiFighter: 9,
    antiFighterDice: 2,
  },
  fighter: { type: 'fighter', label: 'Fighter', cost: 0.5, combat: 9 },
  mech: { type: 'mech', label: 'Mech', cost: 2, combat: 6, sustain: true },
  infantry: { type: 'infantry', label: 'Infantry', cost: 0.5, combat: 8 },
  pds: { type: 'pds', label: 'PDS', cost: 5, spaceCannon: 6 },
};

const FLAGSHIP_PROFILES: Readonly<Record<string, UnitProfile>> = {
  arborec: { ...BASE_PROFILES.flagship, label: 'Duha Menaimon', combat: 7, combatDice: 2 },
  argent: { ...BASE_PROFILES.flagship, label: 'Quetzecoatl', combat: 7, combatDice: 2 },
  cabal: { ...BASE_PROFILES.flagship, label: 'The Terror Between', combat: 5, combatDice: 2, bombardment: 5 },
  empyrean: { ...BASE_PROFILES.flagship, label: 'Dynamo', combat: 5, combatDice: 2 },
  ghost: { ...BASE_PROFILES.flagship, label: 'Hil Colish', combat: 5, combatDice: 1 },
  hacan: { ...BASE_PROFILES.flagship, label: 'Wrath of Kenara', combat: 7, combatDice: 2 },
  jolnar: { ...BASE_PROFILES.flagship, label: 'J.N.S. Hylarim', combat: 6, combatDice: 2 },
  l1z1x: { ...BASE_PROFILES.flagship, label: '[0.0.1]', combat: 5, combatDice: 2 },
  letnev: {
    ...BASE_PROFILES.flagship,
    label: 'Arc Secundus',
    combat: 5,
    combatDice: 2,
    bombardment: 5,
    bombardmentDice: 3,
    disablesPlanetaryShield: true,
  },
  mahact: { ...BASE_PROFILES.flagship, label: 'Arvicon Rex', combat: 5, combatDice: 2 },
  mentak: { ...BASE_PROFILES.flagship, label: 'Fourth Moon', combat: 7, combatDice: 2 },
  muaat: { ...BASE_PROFILES.flagship, label: 'The Inferno', combat: 5, combatDice: 2 },
  naalu: { ...BASE_PROFILES.flagship, label: 'Matriarch', combat: 9, combatDice: 2 },
  naaz: { ...BASE_PROFILES.flagship, label: 'Visz El Vir', combat: 9, combatDice: 2 },
  nekro: { ...BASE_PROFILES.flagship, label: 'The Alastor', combat: 9, combatDice: 2 },
  nomad: {
    ...BASE_PROFILES.flagship,
    label: 'Memoria',
    combat: 7,
    combatDice: 2,
    antiFighter: 8,
    antiFighterDice: 3,
  },
  saar: {
    ...BASE_PROFILES.flagship,
    label: 'Son of Ragh',
    combat: 5,
    combatDice: 2,
    antiFighter: 6,
    antiFighterDice: 4,
  },
  sardakk: { ...BASE_PROFILES.flagship, label: "C'morran N'orr", combat: 6, combatDice: 2 },
  sol: { ...BASE_PROFILES.flagship, label: 'Genesis', combat: 5, combatDice: 2 },
  titans: { ...BASE_PROFILES.flagship, label: 'Ouranos', combat: 7, combatDice: 2 },
  winnu: { ...BASE_PROFILES.flagship, label: 'Salai Sai Corian', combat: 7, combatDice: 1 },
  xxcha: {
    ...BASE_PROFILES.flagship,
    label: 'Loncara Ssodu',
    combat: 7,
    combatDice: 2,
    spaceCannon: 5,
    spaceCannonDice: 3,
  },
  yin: { ...BASE_PROFILES.flagship, label: 'Van Hauge', combat: 9, combatDice: 2 },
  yssaril: { ...BASE_PROFILES.flagship, label: "Y'sia Y'ssrila", combat: 5, combatDice: 2 },
};

const GENERIC_UPGRADE_TECH: Partial<Record<CombatUnitType, string>> = {
  carrier: 'cv2',
  cruiser: 'cr2',
  destroyer: 'dd2',
  dreadnought: 'dn2',
  fighter: 'ff2',
  infantry: 'inf2',
  pds: 'pds2',
};

const FACTION_UPGRADE_TECH: Readonly<
  Record<string, Partial<Record<CombatUnitType, string>>>
> = {
  arborec: { infantry: 'lw2' },
  argent: { destroyer: 'swa2' },
  l1z1x: { dreadnought: 'sdn2' },
  mahact: { infantry: 'cl2' },
  muaat: { warSun: 'pws2' },
  naalu: { fighter: 'hcf2' },
  nomad: { flagship: 'm2' },
  sardakk: { dreadnought: 'exo2' },
  sol: { carrier: 'ac2', infantry: 'so2' },
  titans: { cruiser: 'se2', pds: 'ht2' },
};

export function upgradeTechId(unit: CombatUnitType, factionId: string): string | undefined {
  return FACTION_UPGRADE_TECH[factionId]?.[unit] ?? GENERIC_UPGRADE_TECH[unit];
}

export function upgradesFromTechs(
  factionId: string,
  ownedTechIds: readonly string[],
): CombatUnitType[] {
  const owned = new Set(ownedTechIds);
  return (Object.keys(UNIT_LABELS) as CombatUnitType[]).filter((unit) => {
    const id = upgradeTechId(unit, factionId);
    return Boolean(id && owned.has(id));
  });
}

export function unitOrderFor(mode: CombatMode, factionId?: string): readonly CombatUnitType[] {
  if (mode === 'space' && factionId === 'nekro') {
    return [...SPACE_UNIT_ORDER.slice(0, -1), 'mech', 'infantry', 'pds'];
  }
  if (mode === 'space' && factionId === 'naaz') {
    return [...SPACE_UNIT_ORDER.slice(0, -1), 'mech', 'pds'];
  }
  if (mode === 'ground' && ['cabal', 'letnev', 'naalu', 'naaz'].includes(factionId ?? '')) {
    const support = factionId === 'naalu' ? ['flagship', 'fighter'] as const : ['flagship'] as const;
    return [...support, ...GROUND_UNIT_ORDER];
  }
  return mode === 'space' ? SPACE_UNIT_ORDER : GROUND_UNIT_ORDER;
}

export function factionCombatOption(factionId: string, mode: CombatMode): string | undefined {
  if (mode === 'space') {
    if (factionId === 'hacan') return 'Fund flagship rolls';
    if (factionId === 'empyrean') return 'Dynamo repair';
    if (factionId === 'mahact') return 'Arvicon Rex +2';
    if (factionId === 'yin') return 'Devotion';
  }
  if (mode === 'ground' && factionId === 'yin') return 'Indoctrination';
  return undefined;
}

export function profileFor(
  unit: CombatUnitType,
  upgraded: boolean,
  factionId: string,
  mode: CombatMode = 'space',
): UnitProfile {
  const base = BASE_PROFILES[unit];

  if (unit === 'flagship') {
    const flagship = FLAGSHIP_PROFILES[factionId] ?? base;
    if (upgraded && factionId === 'nomad') {
      return { ...flagship, combat: 5, antiFighter: 5, antiFighterDice: 3 };
    }
    return flagship;
  }

  if (unit === 'destroyer' && factionId === 'argent') {
    return upgraded
      ? { ...base, label: 'Strike Wing Alpha II', combat: 7, antiFighter: 6, antiFighterDice: 3 }
      : { ...base, label: 'Strike Wing Alpha I', combat: 8, antiFighter: 9, antiFighterDice: 2 };
  }
  if (unit === 'fighter' && factionId === 'naalu') {
    return { ...base, label: upgraded ? 'Hybrid Crystal Fighter II' : 'Hybrid Crystal Fighter I', combat: upgraded ? 7 : 8 };
  }
  if (unit === 'infantry' && factionId === 'sol') {
    return { ...base, label: upgraded ? 'Spec Ops II' : 'Spec Ops I', combat: upgraded ? 6 : 7 };
  }
  if (unit === 'dreadnought' && factionId === 'sardakk') {
    return { ...base, label: upgraded ? 'Exotrireme II' : 'Exotrireme I', bombardment: 4, bombardmentDice: 2 };
  }
  if (unit === 'dreadnought' && factionId === 'l1z1x') {
    return { ...base, label: upgraded ? 'Super-Dreadnought II' : 'Super-Dreadnought I', combat: upgraded ? 4 : 5, bombardment: upgraded ? 4 : 5 };
  }
  if (unit === 'cruiser' && factionId === 'titans') {
    return { ...base, label: upgraded ? 'Saturn Engine II' : 'Saturn Engine I', combat: upgraded ? 6 : 7, sustain: upgraded };
  }
  if (unit === 'pds' && factionId === 'titans') {
    return {
      ...base,
      label: upgraded ? 'Hel-Titan II' : 'Hel-Titan I',
      combat: upgraded ? 6 : 7,
      spaceCannon: upgraded ? 5 : 6,
      sustain: true,
      planetaryShield: true,
    };
  }
  if (unit === 'mech' && factionId === 'naaz') {
    return mode === 'space'
      ? { ...base, label: 'Z-Grav Eidolon', combat: 8, combatDice: 2, sustain: false }
      : { ...base, label: 'Eidolon', combat: 6, combatDice: 2 };
  }
  if (unit === 'mech' && factionId === 'xxcha') {
    return { ...base, label: 'Indomitus', spaceCannon: 8 };
  }
  if (unit === 'mech' && factionId === 'arborec') {
    return { ...base, label: 'Letani Behemoth', planetaryShield: true };
  }

  if (!upgraded) return base;

  if (unit === 'carrier') {
    return factionId === 'sol' ? { ...base, sustain: true } : base;
  }
  if (unit === 'cruiser') {
    return { ...base, combat: 6 };
  }
  if (unit === 'destroyer') {
    return {
      ...base,
      combat: 8,
      antiFighter: 6,
      antiFighterDice: 3,
    };
  }
  if (unit === 'dreadnought') {
    return base;
  }
  if (unit === 'fighter') {
    return { ...base, combat: 8 };
  }
  if (unit === 'infantry') {
    return { ...base, combat: 7 };
  }
  if (unit === 'pds') {
    return { ...base, spaceCannon: 5 };
  }
  if (unit === 'warSun' && factionId === 'muaat') return { ...base, cost: 10 };
  return base;
}
