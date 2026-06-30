import type { ContentTagged } from '../content/content.types';
import type { TechColor } from '../tech/tech.types';

export type PlanetTrait = 'cultural' | 'hazardous' | 'industrial';

export interface Planet extends ContentTagged {
  readonly name: string;
  readonly resources: number;
  readonly influence: number;
  readonly trait?: PlanetTrait;
  /** Tech-skip icon colour, if any — counts as one prerequisite of that colour while controlled. */
  readonly techSpecialty?: TechColor;
  readonly legendary?: boolean;
}
