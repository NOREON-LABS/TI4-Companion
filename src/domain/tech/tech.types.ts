import type { ContentTagged } from '../content/content.types';

/** The four technology colours. A coloured tech, once owned, satisfies one prerequisite of its colour. */
export const TECH_COLORS = ['blue', 'green', 'yellow', 'red'] as const;
export type TechColor = (typeof TECH_COLORS)[number];

/**
 * A tech belongs to one of the four colours, is a (colourless) unit upgrade, or is a
 * colourless faction tech (e.g. Nekro's Valefar Assimilators).
 */
export type TechCategory = TechColor | 'unit' | 'faction';

/** How many coloured prerequisites a tech requires, keyed by colour. */
export type Prerequisites = Partial<Record<TechColor, number>>;

export interface Tech extends ContentTagged {
  readonly name: string;
  readonly category: TechCategory;
  /** Coloured prerequisites required to research this tech. */
  readonly prerequisites: Prerequisites;
  /** Faction id when this is a faction-specific technology; otherwise undefined. */
  readonly factionId?: string;
  /** Card text — the tech's rules (or unit stat line). */
  readonly text: string;
}

export function isTechColor(value: unknown): value is TechColor {
  return typeof value === 'string' && (TECH_COLORS as readonly string[]).includes(value);
}
