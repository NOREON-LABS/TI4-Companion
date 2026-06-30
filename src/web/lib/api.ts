import { hc } from 'hono/client';
import type { InferResponseType } from 'hono/client';
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
