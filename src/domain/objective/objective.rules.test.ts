import { describe, expect, it } from 'vitest';
import { OBJECTIVES } from './objective.data';
import type { Objective } from './objective.types';
import {
  hasReachedTarget,
  objectivesById,
  playerVp,
  scoredSecretCount,
  secretScoreBlocker,
  secretTakenBy,
  type ObjectiveScore,
} from './objective.rules';

const byId = objectivesById(OBJECTIVES);
const objective = (id: string): Objective => {
  const found = byId.get(id);
  if (!found) throw new Error(`unknown objective in test: ${id}`);
  return found;
};

// Real-data anchors: corner = Corner the Market (public I, 1 VP), develop = Develop
// Weaponry (public I, 1 VP), ans = Adapt New Strategies (secret, 1 VP).
const stageTwo = OBJECTIVES.find((o) => o.stage === 2);
if (!stageTwo) throw new Error('no stage II objective in data');

const score = (playerId: number, objectiveId: string): ObjectiveScore => ({
  playerId,
  objectiveId,
});

describe('generated objective data', () => {
  it('has the full base+PoK set: 20 stage I, 20 stage II, 40 secrets', () => {
    expect(OBJECTIVES.filter((o) => o.stage === 1)).toHaveLength(20);
    expect(OBJECTIVES.filter((o) => o.stage === 2)).toHaveLength(20);
    expect(OBJECTIVES.filter((o) => o.kind === 'secret')).toHaveLength(40);
  });

  it('publics are worth their stage; secrets are worth 1', () => {
    for (const o of OBJECTIVES) {
      if (o.kind === 'public') expect(o.points).toBe(o.stage);
      else expect(o.points).toBe(1);
    }
  });
});

describe('playerVp', () => {
  it('sums scored publics, secrets, and adjustments for the given player only', () => {
    const scores = [score(1, 'corner'), score(1, stageTwo.id), score(1, 'ans'), score(2, 'develop')];
    const adjustments = [
      { playerId: 1, label: 'Custodians', points: 1 },
      { playerId: 2, label: 'Support for the Throne', points: 1 },
    ];
    expect(playerVp(1, scores, adjustments, byId)).toBe(1 + 2 + 1 + 1);
    expect(playerVp(2, scores, adjustments, byId)).toBe(1 + 1);
  });

  it('ignores unknown objective ids and supports negative adjustments', () => {
    const scores = [score(1, 'not_a_real_objective')];
    const adjustments = [{ playerId: 1, label: 'Shard lost', points: -1 }];
    expect(playerVp(1, scores, adjustments, byId)).toBe(-1);
  });
});

describe('secret rules', () => {
  const secrets = OBJECTIVES.filter((o) => o.kind === 'secret');

  it('counts only secrets toward the cap', () => {
    const scores = [score(1, 'corner'), score(1, 'ans')];
    expect(scoredSecretCount(1, scores, byId)).toBe(1);
  });

  it('reports who has taken a secret', () => {
    expect(secretTakenBy('ans', [score(2, 'ans')])).toBe(2);
    expect(secretTakenBy('ans', [])).toBeNull();
  });

  it('blocks scoring a secret another player already scored', () => {
    const blocker = secretScoreBlocker(1, objective('ans'), [score(2, 'ans')], byId);
    expect(blocker).toMatch(/another player/i);
  });

  it('blocks a fourth secret but allows un-scoring an owned one', () => {
    const [first, second, third, fourth] = secrets;
    if (!first || !second || !third || !fourth) throw new Error('need 4 secrets in data');
    const three = [first, second, third].map((o) => score(1, o.id));
    expect(secretScoreBlocker(1, fourth, three, byId)).toMatch(/at most/i);
    // Toggling one of the three off is not blocked (it's already theirs).
    expect(secretScoreBlocker(1, first, three, byId)).toBeNull();
  });

  it('allows a secret when under the cap and untaken', () => {
    expect(secretScoreBlocker(1, objective('ans'), [], byId)).toBeNull();
  });
});

describe('hasReachedTarget', () => {
  it('is true at or above the target', () => {
    expect(hasReachedTarget(9, 10)).toBe(false);
    expect(hasReachedTarget(10, 10)).toBe(true);
    expect(hasReachedTarget(15, 14)).toBe(true);
  });
});
