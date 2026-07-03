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

/** Card-specific accent classes for the tech tree grid: full border, owned-state tint, glyph text colour. */
export const CATEGORY_CARD: Record<TechCategory, { border: string; bgOwned: string; text: string }> = {
  blue: { border: 'border-tech-blue/55', bgOwned: 'bg-tech-blue/10', text: 'text-tech-blue' },
  green: { border: 'border-tech-green/55', bgOwned: 'bg-tech-green/10', text: 'text-tech-green' },
  yellow: { border: 'border-tech-yellow/55', bgOwned: 'bg-tech-yellow/10', text: 'text-tech-yellow' },
  red: { border: 'border-tech-red/55', bgOwned: 'bg-tech-red/10', text: 'text-tech-red' },
  unit: { border: 'border-tech-unit/55', bgOwned: 'bg-tech-unit/10', text: 'text-tech-unit' },
  faction: { border: 'border-fuchsia-400/55', bgOwned: 'bg-fuchsia-400/10', text: 'text-fuchsia-400' },
};

/** Lane header metadata for the tech tree grid: display name + colour/theme sub-label. */
export const LANE_META: Record<TechCategory, { name: string; sub: string }> = {
  blue: { name: 'Propulsion', sub: 'Blue · Movement' },
  green: { name: 'Biotic', sub: 'Green · Growth' },
  yellow: { name: 'Cybernetic', sub: 'Yellow · Economy' },
  red: { name: 'Warfare', sub: 'Red · Combat' },
  unit: { name: 'Unit Upgrades', sub: 'Mixed prereqs' },
  faction: { name: 'Faction', sub: 'Special abilities' },
};

export const TIER_LABELS: readonly { top: string; sub: string }[] = [
  { top: 'Tier 0', sub: 'No prereq' },
  { top: 'Tier 1', sub: '1 symbol' },
  { top: 'Tier 2', sub: '2 symbols' },
  { top: 'Tier 3', sub: '3 symbols' },
  { top: 'Tier 4', sub: '4 symbols' },
];

/** tier(tech) = sum of all prerequisite counts, e.g. War Sun {red:3,yellow:1} -> tier 4. */
export function tierOf(prerequisites: Partial<Record<TechColor, number>>): number {
  return Object.values(prerequisites).reduce((sum: number, count) => sum + (count ?? 0), 0);
}
