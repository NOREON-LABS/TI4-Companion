import { hc } from 'hono/client';
import type { InferResponseType } from 'hono/client';
import type { PlayerColor } from '@domain';
// Type-only import of the server's route type — erased at build. This gives the client
// end-to-end types with no codegen. (web -> server type import is the only allowed crossing.)
import type { AppType } from '@server/app';

const client = hc<AppType>('/');

const gameApi = client.api.game;

/** Game state shape, inferred directly from the server response — single source of truth. */
export type GameState = InferResponseType<typeof gameApi.$get>;

export async function fetchGame(): Promise<GameState> {
  const res = await gameApi.$get();
  if (!res.ok) throw new Error('Failed to load game');
  return res.json();
}

export async function saveOwnedTechs(ids: string[]): Promise<GameState> {
  const res = await gameApi.techs.$put({ json: { ids } });
  if (!res.ok) throw new Error('Failed to save techs');
  return res.json();
}

export async function saveControlledPlanets(ids: string[]): Promise<GameState> {
  const res = await gameApi.planets.$put({ json: { ids } });
  if (!res.ok) throw new Error('Failed to save planets');
  return res.json();
}

export async function saveFaction(factionId: string): Promise<GameState> {
  const res = await gameApi.faction.$put({ json: { factionId } });
  if (!res.ok) throw new Error('Failed to set faction');
  return res.json();
}

export async function savePins(ids: string[]): Promise<GameState> {
  const res = await gameApi.pins.$put({ json: { ids } });
  if (!res.ok) throw new Error('Failed to save pins');
  return res.json();
}

/** Persist the research queue; `ids` order is the research order. */
export async function saveQueue(ids: string[]): Promise<GameState> {
  const res = await gameApi.queue.$put({ json: { ids } });
  if (!res.ok) throw new Error('Failed to save queue');
  return res.json();
}

// --- Objectives & scoring ---

export type GamePlayer = GameState['players'][number];
export type PlayerInput = { name: string; color: PlayerColor; factionId?: string | null };

/** Surface the server's rule message (409 { error }) instead of a generic failure. */
async function ruleError(res: Response, fallback: string): Promise<Error> {
  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  return new Error(body?.error ?? fallback);
}

export async function addPlayer(player: PlayerInput): Promise<GameState> {
  const res = await gameApi.players.$post({ json: player });
  if (!res.ok) throw await ruleError(res, 'Failed to add player');
  return res.json();
}

export async function updatePlayer(id: number, patch: Partial<PlayerInput>): Promise<GameState> {
  const res = await gameApi.players[':id'].$put({ param: { id: String(id) }, json: patch });
  if (!res.ok) throw await ruleError(res, 'Failed to update player');
  return res.json();
}

export async function removePlayer(id: number): Promise<GameState> {
  const res = await gameApi.players[':id'].$delete({ param: { id: String(id) } });
  if (!res.ok) throw await ruleError(res, 'Failed to remove player');
  return res.json();
}

/** Replace the revealed publics; `ids` order is the reveal order. */
export async function saveRevealedObjectives(ids: string[]): Promise<GameState> {
  const res = await gameApi.objectives.revealed.$put({ json: { ids } });
  if (!res.ok) throw await ruleError(res, 'Failed to update revealed objectives');
  return res.json();
}

export async function toggleScore(playerId: number, objectiveId: string): Promise<GameState> {
  const res = await gameApi.scores.toggle.$post({ json: { playerId, objectiveId } });
  if (!res.ok) throw await ruleError(res, 'Failed to update score');
  return res.json();
}

export async function addVpAdjustment(
  playerId: number,
  label: string,
  points: number,
): Promise<GameState> {
  const res = await gameApi.adjustments.$post({ json: { playerId, label, points } });
  if (!res.ok) throw await ruleError(res, 'Failed to add VP adjustment');
  return res.json();
}

export async function removeVpAdjustment(id: number): Promise<GameState> {
  const res = await gameApi.adjustments[':id'].$delete({ param: { id: String(id) } });
  if (!res.ok) throw await ruleError(res, 'Failed to remove VP adjustment');
  return res.json();
}

export async function saveVictoryTarget(victoryTarget: 10 | 14): Promise<GameState> {
  const res = await gameApi['victory-target'].$put({ json: { victoryTarget } });
  if (!res.ok) throw await ruleError(res, 'Failed to set victory target');
  return res.json();
}
