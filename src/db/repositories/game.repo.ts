import { and, asc, eq } from 'drizzle-orm';
import {
  FACTIONS,
  OBJECTIVES,
  fixedStartingTechs,
  objectivesById,
  secretScoreBlocker,
} from '../../domain';
import { DEFAULT_ENABLED_CONTENT } from '../../domain/content/content.types';
import type { ContentSource } from '../../domain/content/content.types';
import type { Db } from '../client';
import {
  gameObjectiveScores,
  gamePins,
  gamePlanets,
  gamePlayers,
  gameQueue,
  gameRevealedObjectives,
  gameTechs,
  gameVpAdjustments,
  games,
} from '../schema';
import type { GameRow } from '../schema';

/** A player at the table (Objectives & scoring tool). */
export interface GamePlayer {
  readonly id: number;
  readonly name: string;
  readonly factionId: string | null;
  readonly color: string;
  readonly position: number;
}

/** A player having scored an objective (public or secret). */
export interface GameScore {
  readonly playerId: number;
  readonly objectiveId: string;
}

/** A labelled VP correction outside objectives (custodians, Imperial, relics...). */
export interface GameVpAdjustment {
  readonly id: number;
  readonly playerId: number;
  readonly label: string;
  readonly points: number;
}

/**
 * A game rule was violated (e.g. scoring a fourth secret). Routes translate this into a
 * 409 with the message, so the UI can toast it.
 */
export class GameRuleError extends Error {}

/**
 * A game's persisted state, hydrated into the shape the API/UI consume. Only ids are
 * stored; the domain layer resolves them to full static data.
 */
export interface GameState {
  readonly id: number;
  readonly name: string;
  readonly factionId: string | null;
  readonly enabledContent: ContentSource[];
  /** Victory points needed to win: 10 (standard) or 14 (long game). */
  readonly victoryTarget: number;
  readonly ownedTechIds: string[];
  readonly controlledPlanetIds: string[];
  /** Techs pinned to the reference tray. */
  readonly pinnedTechIds: string[];
  /** Planned research order. */
  readonly queuedTechIds: string[];
  /** Players at the table, in seat order. */
  readonly players: GamePlayer[];
  /** Public objectives on the table, in reveal order. */
  readonly revealedObjectiveIds: string[];
  /** Scored objectives across all players (publics + secrets). */
  readonly scores: GameScore[];
  /** Per-player bonus VP entries. */
  readonly vpAdjustments: GameVpAdjustment[];
}

/**
 * Persistence boundary for game state. Features/UI depend on this interface, never on the
 * concrete database — so the storage engine (or a future synced backend) can be swapped
 * without touching feature code.
 */
export interface GameRepository {
  getOrCreateDefaultGame(): Promise<GameState>;
  setOwnedTechs(gameId: number, techIds: readonly string[]): Promise<GameState>;
  setControlledPlanets(gameId: number, planetIds: readonly string[]): Promise<GameState>;
  /** Set the faction and autofill its fixed starting techs (replacing owned techs). */
  setFaction(gameId: number, factionId: string): Promise<GameState>;
  setPins(gameId: number, techIds: readonly string[]): Promise<GameState>;
  /** Replace the research queue; the array order is the research order. */
  setQueue(gameId: number, techIds: readonly string[]): Promise<GameState>;
  addPlayer(gameId: number, player: NewPlayer): Promise<GameState>;
  updatePlayer(gameId: number, playerId: number, patch: PlayerPatch): Promise<GameState>;
  /** Remove a player and everything they scored. */
  removePlayer(gameId: number, playerId: number): Promise<GameState>;
  /** Replace the revealed publics; scores of un-revealed publics are dropped with them. */
  setRevealedObjectives(gameId: number, objectiveIds: readonly string[]): Promise<GameState>;
  /** Score / un-score one objective for one player, enforcing the game rules. */
  toggleScore(gameId: number, playerId: number, objectiveId: string): Promise<GameState>;
  addVpAdjustment(
    gameId: number,
    playerId: number,
    label: string,
    points: number,
  ): Promise<GameState>;
  removeVpAdjustment(gameId: number, adjustmentId: number): Promise<GameState>;
  setVictoryTarget(gameId: number, victoryTarget: number): Promise<GameState>;
}

export interface NewPlayer {
  readonly name: string;
  readonly color: string;
  readonly factionId?: string | null;
}

export interface PlayerPatch {
  readonly name?: string;
  readonly color?: string;
  readonly factionId?: string | null;
}

export class DrizzleGameRepository implements GameRepository {
  constructor(private readonly db: Db) {}

  async getOrCreateDefaultGame(): Promise<GameState> {
    const existing = await this.db.select().from(games).limit(1);
    const game = existing[0] ?? (await this.createDefaultGame());
    return this.hydrate(game);
  }

  async setOwnedTechs(gameId: number, techIds: readonly string[]): Promise<GameState> {
    await this.db.transaction(async (tx) => {
      await tx.delete(gameTechs).where(eq(gameTechs.gameId, gameId));
      if (techIds.length > 0) {
        await tx.insert(gameTechs).values(techIds.map((techId) => ({ gameId, techId })));
      }
    });
    return this.requireGame(gameId);
  }

  async setControlledPlanets(gameId: number, planetIds: readonly string[]): Promise<GameState> {
    await this.db.transaction(async (tx) => {
      await tx.delete(gamePlanets).where(eq(gamePlanets.gameId, gameId));
      if (planetIds.length > 0) {
        await tx.insert(gamePlanets).values(planetIds.map((planetId) => ({ gameId, planetId })));
      }
    });
    return this.requireGame(gameId);
  }

  async setPins(gameId: number, techIds: readonly string[]): Promise<GameState> {
    const unique = [...new Set(techIds)];
    await this.db.transaction(async (tx) => {
      await tx.delete(gamePins).where(eq(gamePins.gameId, gameId));
      if (unique.length > 0) {
        await tx.insert(gamePins).values(unique.map((techId) => ({ gameId, techId })));
      }
    });
    return this.requireGame(gameId);
  }

  async setQueue(gameId: number, techIds: readonly string[]): Promise<GameState> {
    const unique = [...new Set(techIds)];
    await this.db.transaction(async (tx) => {
      await tx.delete(gameQueue).where(eq(gameQueue.gameId, gameId));
      if (unique.length > 0) {
        await tx
          .insert(gameQueue)
          .values(unique.map((techId, position) => ({ gameId, techId, position })));
      }
    });
    return this.requireGame(gameId);
  }

  async setFaction(gameId: number, factionId: string): Promise<GameState> {
    const faction = FACTIONS.find((f) => f.id === factionId);
    if (!faction) throw new Error(`Unknown faction: ${factionId}`);
    const starting = [...new Set(fixedStartingTechs(faction))];
    const home = [...new Set(faction.homePlanetIds)];
    await this.db.transaction(async (tx) => {
      await tx.update(games).set({ factionId }).where(eq(games.id, gameId));
      // Reset owned techs + controlled planets to the faction's starting setup.
      await tx.delete(gameTechs).where(eq(gameTechs.gameId, gameId));
      if (starting.length > 0) {
        await tx.insert(gameTechs).values(starting.map((techId) => ({ gameId, techId })));
      }
      await tx.delete(gamePlanets).where(eq(gamePlanets.gameId, gameId));
      if (home.length > 0) {
        await tx.insert(gamePlanets).values(home.map((planetId) => ({ gameId, planetId })));
      }
    });
    return this.requireGame(gameId);
  }

  async addPlayer(gameId: number, player: NewPlayer): Promise<GameState> {
    await this.db.transaction(async (tx) => {
      const existing = await tx.select().from(gamePlayers).where(eq(gamePlayers.gameId, gameId));
      await tx.insert(gamePlayers).values({
        gameId,
        name: player.name,
        color: player.color,
        factionId: player.factionId ?? null,
        position: existing.length,
      });
    });
    return this.requireGame(gameId);
  }

  async updatePlayer(gameId: number, playerId: number, patch: PlayerPatch): Promise<GameState> {
    await this.requirePlayer(gameId, playerId);
    await this.db
      .update(gamePlayers)
      .set(patch)
      .where(and(eq(gamePlayers.gameId, gameId), eq(gamePlayers.id, playerId)));
    return this.requireGame(gameId);
  }

  async removePlayer(gameId: number, playerId: number): Promise<GameState> {
    await this.requirePlayer(gameId, playerId);
    // Explicit deletes rather than relying on SQLite's foreign_keys pragma being on.
    await this.db.transaction(async (tx) => {
      await tx
        .delete(gameObjectiveScores)
        .where(
          and(eq(gameObjectiveScores.gameId, gameId), eq(gameObjectiveScores.playerId, playerId)),
        );
      await tx
        .delete(gameVpAdjustments)
        .where(and(eq(gameVpAdjustments.gameId, gameId), eq(gameVpAdjustments.playerId, playerId)));
      await tx
        .delete(gamePlayers)
        .where(and(eq(gamePlayers.gameId, gameId), eq(gamePlayers.id, playerId)));
    });
    return this.requireGame(gameId);
  }

  async setRevealedObjectives(gameId: number, objectiveIds: readonly string[]): Promise<GameState> {
    const unique = [...new Set(objectiveIds)];
    const byId = objectivesById(OBJECTIVES);
    for (const id of unique) {
      const objective = byId.get(id);
      if (!objective) throw new GameRuleError(`Unknown objective: ${id}`);
      if (objective.kind !== 'public') {
        throw new GameRuleError(`Only public objectives are revealed: ${id}`);
      }
    }
    const revealed = new Set(unique);
    await this.db.transaction(async (tx) => {
      await tx
        .delete(gameRevealedObjectives)
        .where(eq(gameRevealedObjectives.gameId, gameId));
      if (unique.length > 0) {
        await tx
          .insert(gameRevealedObjectives)
          .values(unique.map((objectiveId, position) => ({ gameId, objectiveId, position })));
      }
      // Drop scores of publics that are no longer on the table (keeps VP totals honest).
      const scoreRows = await tx
        .select()
        .from(gameObjectiveScores)
        .where(eq(gameObjectiveScores.gameId, gameId));
      for (const row of scoreRows) {
        const objective = byId.get(row.objectiveId);
        if (objective?.kind === 'public' && !revealed.has(row.objectiveId)) {
          await tx
            .delete(gameObjectiveScores)
            .where(
              and(
                eq(gameObjectiveScores.gameId, gameId),
                eq(gameObjectiveScores.playerId, row.playerId),
                eq(gameObjectiveScores.objectiveId, row.objectiveId),
              ),
            );
        }
      }
    });
    return this.requireGame(gameId);
  }

  async toggleScore(gameId: number, playerId: number, objectiveId: string): Promise<GameState> {
    const byId = objectivesById(OBJECTIVES);
    const objective = byId.get(objectiveId);
    if (!objective) throw new GameRuleError(`Unknown objective: ${objectiveId}`);
    await this.requirePlayer(gameId, playerId);

    await this.db.transaction(async (tx) => {
      const existing = await tx
        .select()
        .from(gameObjectiveScores)
        .where(
          and(
            eq(gameObjectiveScores.gameId, gameId),
            eq(gameObjectiveScores.playerId, playerId),
            eq(gameObjectiveScores.objectiveId, objectiveId),
          ),
        );
      if (existing.length > 0) {
        // Un-scoring is always allowed.
        await tx
          .delete(gameObjectiveScores)
          .where(
            and(
              eq(gameObjectiveScores.gameId, gameId),
              eq(gameObjectiveScores.playerId, playerId),
              eq(gameObjectiveScores.objectiveId, objectiveId),
            ),
          );
        return;
      }

      const scores = await tx
        .select()
        .from(gameObjectiveScores)
        .where(eq(gameObjectiveScores.gameId, gameId));
      if (objective.kind === 'public') {
        const revealed = await tx
          .select()
          .from(gameRevealedObjectives)
          .where(
            and(
              eq(gameRevealedObjectives.gameId, gameId),
              eq(gameRevealedObjectives.objectiveId, objectiveId),
            ),
          );
        if (revealed.length === 0) {
          throw new GameRuleError('That public objective has not been revealed.');
        }
      } else {
        const blocker = secretScoreBlocker(playerId, objective, scores, byId);
        if (blocker) throw new GameRuleError(blocker);
      }
      await tx.insert(gameObjectiveScores).values({ gameId, playerId, objectiveId });
    });
    return this.requireGame(gameId);
  }

  async addVpAdjustment(
    gameId: number,
    playerId: number,
    label: string,
    points: number,
  ): Promise<GameState> {
    await this.requirePlayer(gameId, playerId);
    await this.db.insert(gameVpAdjustments).values({ gameId, playerId, label, points });
    return this.requireGame(gameId);
  }

  async removeVpAdjustment(gameId: number, adjustmentId: number): Promise<GameState> {
    await this.db
      .delete(gameVpAdjustments)
      .where(and(eq(gameVpAdjustments.gameId, gameId), eq(gameVpAdjustments.id, adjustmentId)));
    return this.requireGame(gameId);
  }

  async setVictoryTarget(gameId: number, victoryTarget: number): Promise<GameState> {
    await this.db.update(games).set({ victoryTarget }).where(eq(games.id, gameId));
    return this.requireGame(gameId);
  }

  private async requirePlayer(gameId: number, playerId: number): Promise<void> {
    const rows = await this.db
      .select()
      .from(gamePlayers)
      .where(and(eq(gamePlayers.gameId, gameId), eq(gamePlayers.id, playerId)))
      .limit(1);
    if (rows.length === 0) throw new GameRuleError(`Player ${playerId} not found.`);
  }

  private async createDefaultGame(): Promise<GameRow> {
    const inserted = await this.db
      .insert(games)
      .values({ name: 'My Game', factionId: null, enabledContent: [...DEFAULT_ENABLED_CONTENT] })
      .returning();
    const created = inserted[0];
    if (!created) throw new Error('Failed to create default game.');
    return created;
  }

  private async requireGame(gameId: number): Promise<GameState> {
    const rows = await this.db.select().from(games).where(eq(games.id, gameId)).limit(1);
    const game = rows[0];
    if (!game) throw new Error(`Game ${gameId} not found.`);
    return this.hydrate(game);
  }

  private async hydrate(game: GameRow): Promise<GameState> {
    const [techRows, planetRows, pinRows, queueRows, playerRows, revealedRows, scoreRows, adjRows] =
      await Promise.all([
        this.db.select().from(gameTechs).where(eq(gameTechs.gameId, game.id)),
        this.db.select().from(gamePlanets).where(eq(gamePlanets.gameId, game.id)),
        this.db.select().from(gamePins).where(eq(gamePins.gameId, game.id)),
        this.db
          .select()
          .from(gameQueue)
          .where(eq(gameQueue.gameId, game.id))
          .orderBy(asc(gameQueue.position)),
        this.db
          .select()
          .from(gamePlayers)
          .where(eq(gamePlayers.gameId, game.id))
          .orderBy(asc(gamePlayers.position)),
        this.db
          .select()
          .from(gameRevealedObjectives)
          .where(eq(gameRevealedObjectives.gameId, game.id))
          .orderBy(asc(gameRevealedObjectives.position)),
        this.db
          .select()
          .from(gameObjectiveScores)
          .where(eq(gameObjectiveScores.gameId, game.id)),
        this.db
          .select()
          .from(gameVpAdjustments)
          .where(eq(gameVpAdjustments.gameId, game.id))
          .orderBy(asc(gameVpAdjustments.id)),
      ]);
    return {
      id: game.id,
      name: game.name,
      factionId: game.factionId,
      enabledContent: game.enabledContent,
      victoryTarget: game.victoryTarget,
      ownedTechIds: techRows.map((r) => r.techId),
      controlledPlanetIds: planetRows.map((r) => r.planetId),
      pinnedTechIds: pinRows.map((r) => r.techId),
      queuedTechIds: queueRows.map((r) => r.techId),
      players: playerRows.map((r) => ({
        id: r.id,
        name: r.name,
        factionId: r.factionId,
        color: r.color,
        position: r.position,
      })),
      revealedObjectiveIds: revealedRows.map((r) => r.objectiveId),
      scores: scoreRows.map((r) => ({ playerId: r.playerId, objectiveId: r.objectiveId })),
      vpAdjustments: adjRows.map((r) => ({
        id: r.id,
        playerId: r.playerId,
        label: r.label,
        points: r.points,
      })),
    };
  }
}
