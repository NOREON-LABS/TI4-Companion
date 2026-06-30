import { db } from '../client';
import { DrizzleGameRepository } from './game.repo';

export type { GameRepository, GameState } from './game.repo';

/** Shared repository instance wired to the libSQL-backed Drizzle client. */
export const gameRepository = new DrizzleGameRepository(db);
