import { sql } from 'drizzle-orm';
import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';
// Relative import (not the @domain alias) so drizzle-kit's bundler resolves it.
import type { ContentSource } from '../domain/content/content.types';

/**
 * DYNAMIC game state only. Static TI4 data (techs, planets, factions) lives in the domain
 * layer as typed code, never here — the DB stores only ids that reference it.
 */
export const games = sqliteTable('games', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  /** Active faction id (references domain faction data); null until chosen. */
  factionId: text('faction_id'),
  /** Content sets in play for this game, e.g. ["base","pok","codex1"]. */
  enabledContent: text('enabled_content', { mode: 'json' }).$type<ContentSource[]>().notNull(),
  /** Victory points needed to win: 10 (standard) or 14 (long game). */
  victoryTarget: integer('victory_target').notNull().default(10),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const gameTechs = sqliteTable(
  'game_techs',
  {
    gameId: integer('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    /** References domain tech data by id. */
    techId: text('tech_id').notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.gameId, t.techId] }) }),
);

export const gamePlanets = sqliteTable(
  'game_planets',
  {
    gameId: integer('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    /** References domain planet data by id. */
    planetId: text('planet_id').notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.gameId, t.planetId] }) }),
);

export const gamePins = sqliteTable(
  'game_pins',
  {
    gameId: integer('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    techId: text('tech_id').notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.gameId, t.techId] }) }),
);

export const gameQueue = sqliteTable(
  'game_queue',
  {
    gameId: integer('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    techId: text('tech_id').notNull(),
    /** 0-based research order. */
    position: integer('position').notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.gameId, t.techId] }) }),
);

/** The people at the table (Objectives & scoring tool). Colours reference TI4 plastic. */
export const gamePlayers = sqliteTable('game_players', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  gameId: integer('game_id')
    .notNull()
    .references(() => games.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  /** References domain faction data by id; optional. */
  factionId: text('faction_id'),
  /** One of the TI4 plastic colours (validated at the route). */
  color: text('color').notNull(),
  /** 0-based seat order for display. */
  position: integer('position').notNull(),
});

/** Public objectives revealed onto the table, in reveal order. */
export const gameRevealedObjectives = sqliteTable(
  'game_revealed_objectives',
  {
    gameId: integer('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    /** References domain objective data by id. */
    objectiveId: text('objective_id').notNull(),
    /** 0-based reveal order. */
    position: integer('position').notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.gameId, t.objectiveId] }) }),
);

/** Who scored what — covers publics and secrets (a scored secret needs no reveal row). */
export const gameObjectiveScores = sqliteTable(
  'game_objective_scores',
  {
    gameId: integer('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    playerId: integer('player_id')
      .notNull()
      .references(() => gamePlayers.id, { onDelete: 'cascade' }),
    objectiveId: text('objective_id').notNull(),
  },
  (t) => ({ pk: primaryKey({ columns: [t.gameId, t.playerId, t.objectiveId] }) }),
);

/** Labelled VP corrections outside objectives: custodians, Imperial, relics, agendas... */
export const gameVpAdjustments = sqliteTable('game_vp_adjustments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  gameId: integer('game_id')
    .notNull()
    .references(() => games.id, { onDelete: 'cascade' }),
  playerId: integer('player_id')
    .notNull()
    .references(() => gamePlayers.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  /** May be negative (e.g. losing the Shard of the Throne). */
  points: integer('points').notNull(),
});

export type GameRow = typeof games.$inferSelect;
export type GamePlayerRow = typeof gamePlayers.$inferSelect;
