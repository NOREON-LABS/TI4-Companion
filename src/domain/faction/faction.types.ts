import type { ContentTagged } from '../content/content.types';

/** A faction that chooses N of a set of techs to start with (e.g. Winnu, Argent Flight). */
export interface StartingTechChoice {
  readonly count: number;
  readonly options: readonly string[];
}

export interface Faction extends ContentTagged {
  readonly name: string;
  /** Tech ids the faction starts the game already owning (fixed — autofilled on select). */
  readonly startingTechIds: readonly string[];
  /** Planet ids of the faction's home system — autofilled as controlled on select. */
  readonly homePlanetIds: readonly string[];
  /** Present when the faction instead *chooses* starting techs; resolved in the UI. */
  readonly startingTechChoice?: StartingTechChoice;
  /** The faction's own faction-specific tech ids (for reference/display). */
  readonly factionTechIds?: readonly string[];
}
