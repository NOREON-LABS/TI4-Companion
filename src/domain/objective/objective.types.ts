import type { ContentTagged } from '../content/content.types';

/** Public objectives sit on the table for everyone; secrets belong to one player. */
export type ObjectiveKind = 'public' | 'secret';

/** When an objective can be scored (from the card's header). */
export const OBJECTIVE_PHASES = ['status', 'action', 'agenda'] as const;
export type ObjectivePhase = (typeof OBJECTIVE_PHASES)[number];

export interface Objective extends ContentTagged {
  readonly name: string;
  readonly kind: ObjectiveKind;
  /** Publics: stage I or II (worth 1 / 2 VP). Secrets carry no stage. */
  readonly stage?: 1 | 2;
  /** Victory points awarded when scored. */
  readonly points: number;
  readonly phase: ObjectivePhase;
  /** Card text — the scoring condition. */
  readonly text: string;
  /** Clarification notes carried by the source data, when present. */
  readonly notes?: string;
}
