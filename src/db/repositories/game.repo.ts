import { asc, eq } from 'drizzle-orm';
import { FACTIONS, fixedStartingTechs } from '../../domain';
import { DEFAULT_ENABLED_CONTENT } from '../../domain/content/content.types';
import type { ContentSource } from '../../domain/content/content.types';
import type { Db } from '../client';
import { gamePins, gamePlanets, gameQueue, gameTechs, games } from '../schema';
import type { GameRow } from '../schema';

/**
 * A game's persisted state, hydrated into the shape the API/UI consume. Only ids are
 * stored; the domain layer resolves them to full static data.
 */
export interface GameState {
  readonly id: number;
  readonly name: string;
  readonly factionId: string | null;
  readonly enabledContent: ContentSource[];
  readonly ownedTechIds: string[];
  readonly controlledPlanetIds: string[];
  /** Techs pinned to the reference tray. */
  readonly pinnedTechIds: string[];
  /** Planned research order. */
  readonly queuedTechIds: string[];
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
    const [techRows, planetRows, pinRows, queueRows] = await Promise.all([
      this.db.select().from(gameTechs).where(eq(gameTechs.gameId, game.id)),
      this.db.select().from(gamePlanets).where(eq(gamePlanets.gameId, game.id)),
      this.db.select().from(gamePins).where(eq(gamePins.gameId, game.id)),
      this.db
        .select()
        .from(gameQueue)
        .where(eq(gameQueue.gameId, game.id))
        .orderBy(asc(gameQueue.position)),
    ]);
    return {
      id: game.id,
      name: game.name,
      factionId: game.factionId,
      enabledContent: game.enabledContent,
      ownedTechIds: techRows.map((r) => r.techId),
      controlledPlanetIds: planetRows.map((r) => r.planetId),
      pinnedTechIds: pinRows.map((r) => r.techId),
      queuedTechIds: queueRows.map((r) => r.techId),
    };
  }
}
