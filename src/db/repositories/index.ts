import { db } from '../client';
import { DrizzleGameRepository } from './game.repo';

export type {
  GamePlayer,
  GameRepository,
  GameScore,
  GameState,
  GameVpAdjustment,
} from './game.repo';
export { GameRuleError } from './game.repo';

/** Shared repository instance wired to the libSQL-backed Drizzle client. */
export const gameRepository = new DrizzleGameRepository(db);
