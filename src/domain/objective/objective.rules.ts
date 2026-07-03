import type { Objective } from './objective.types';

/** A player having scored an objective (public or secret). */
export interface ObjectiveScore {
  readonly playerId: number;
  readonly objectiveId: string;
}

/** A labelled VP correction outside objectives (custodians, Imperial, relics, agendas...). */
export interface VpAdjustment {
  readonly playerId: number;
  readonly label: string;
  readonly points: number;
}

/** Each player may have at most this many scored secret objectives. */
export const MAX_SCORED_SECRETS = 3;

/** Standard and long-game victory point targets. */
export const VICTORY_TARGETS = [10, 14] as const;
export type VictoryTarget = (typeof VICTORY_TARGETS)[number];

/** Index objectives by id for the scoring helpers. */
export function objectivesById(
  objectives: readonly Objective[],
): ReadonlyMap<string, Objective> {
  return new Map(objectives.map((o) => [o.id, o]));
}

/**
 * A player's victory points: scored objectives + adjustments. Unknown objective ids are
 * ignored (defensive against content-set changes) — look ups use the full unfiltered
 * OBJECTIVES map so disabling an expansion mid-game never corrupts totals.
 */
export function playerVp(
  playerId: number,
  scores: readonly ObjectiveScore[],
  adjustments: readonly VpAdjustment[],
  byId: ReadonlyMap<string, Objective>,
): number {
  const objectivePoints = scores
    .filter((s) => s.playerId === playerId)
    .reduce((sum, s) => sum + (byId.get(s.objectiveId)?.points ?? 0), 0);
  const adjustmentPoints = adjustments
    .filter((a) => a.playerId === playerId)
    .reduce((sum, a) => sum + a.points, 0);
  return objectivePoints + adjustmentPoints;
}

/** How many secrets a player has scored (toward {@link MAX_SCORED_SECRETS}). */
export function scoredSecretCount(
  playerId: number,
  scores: readonly ObjectiveScore[],
  byId: ReadonlyMap<string, Objective>,
): number {
  return scores.filter(
    (s) => s.playerId === playerId && byId.get(s.objectiveId)?.kind === 'secret',
  ).length;
}

/** Each secret card exists once per game — the player who scored it, or null. */
export function secretTakenBy(
  objectiveId: string,
  scores: readonly ObjectiveScore[],
): number | null {
  return scores.find((s) => s.objectiveId === objectiveId)?.playerId ?? null;
}

/**
 * Why `playerId` may not score the secret `objective`, or null when allowed.
 * Shared by the server (authoritative 409) and the UI (disable the option up front).
 */
export function secretScoreBlocker(
  playerId: number,
  objective: Objective,
  scores: readonly ObjectiveScore[],
  byId: ReadonlyMap<string, Objective>,
): string | null {
  const takenBy = secretTakenBy(objective.id, scores);
  if (takenBy !== null && takenBy !== playerId) {
    return 'Another player has already scored this secret objective.';
  }
  if (takenBy === null && scoredSecretCount(playerId, scores, byId) >= MAX_SCORED_SECRETS) {
    return `A player can score at most ${MAX_SCORED_SECRETS} secret objectives.`;
  }
  return null;
}

export function hasReachedTarget(vp: number, victoryTarget: number): boolean {
  return vp >= victoryTarget;
}
