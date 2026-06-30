import type { TechCategory, TechColor } from '@domain';

/** Tailwind background classes for each tech colour (see globals.css --tech-* variables). */
export const COLOR_DOT: Record<TechColor, string> = {
  blue: 'bg-tech-blue',
  green: 'bg-tech-green',
  yellow: 'bg-tech-yellow',
  red: 'bg-tech-red',
};

export const COLOR_LABEL: Record<TechColor, string> = {
  blue: 'Propulsion',
  green: 'Biotic',
  yellow: 'Cybernetic',
  red: 'Warfare',
};

export const CATEGORY_ORDER: readonly TechCategory[] = [
  'blue',
  'green',
  'yellow',
  'red',
  'unit',
  'faction',
];

export const CATEGORY_LABEL: Record<TechCategory, string> = {
  blue: 'Propulsion · Blue',
  green: 'Biotic · Green',
  yellow: 'Cybernetic · Yellow',
  red: 'Warfare · Red',
  unit: 'Unit Upgrades',
  faction: 'Faction',
};

/** Per-category accents used to colour-code the tracks (card header dot + row left edge). */
export const CATEGORY_ACCENT: Record<TechCategory, { dot: string; border: string }> = {
  blue: { dot: 'bg-tech-blue', border: 'border-l-tech-blue' },
  green: { dot: 'bg-tech-green', border: 'border-l-tech-green' },
  yellow: { dot: 'bg-tech-yellow', border: 'border-l-tech-yellow' },
  red: { dot: 'bg-tech-red', border: 'border-l-tech-red' },
  unit: { dot: 'bg-tech-unit', border: 'border-l-tech-unit' },
  faction: { dot: 'bg-fuchsia-400', border: 'border-l-fuchsia-400' },
};
