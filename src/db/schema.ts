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

export type GameRow = typeof games.$inferSelect;
