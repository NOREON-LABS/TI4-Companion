import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
// Relative imports keep all Node-executed code (server/db/domain) alias-free; the web
// app uses the @ aliases. The architecture boundary is enforced by ESLint regardless.
import { PLAYER_COLORS, VICTORY_TARGETS } from '../../domain';
import { GameRuleError, gameRepository } from '../../db/repositories';

const idsSchema = z.object({ ids: z.array(z.string()) });
const idParamSchema = z.object({ id: z.coerce.number().int() });
const newPlayerSchema = z.object({
  name: z.string().trim().min(1).max(40),
  color: z.enum(PLAYER_COLORS),
  factionId: z.string().nullish(),
});
const playerPatchSchema = newPlayerSchema.partial();

/**
 * Game-state endpoints. Single-tenant: there is one default game per instance. Handlers
 * validate input with zod and delegate to the repository — no SQL here.
 */
export const gameRoutes = new Hono()
  // Rule violations (fourth secret, taken secret, unrevealed public...) surface as 409
  // with a message the UI toasts; anything else falls through to the default 500.
  .onError((err, c) => {
    if (err instanceof GameRuleError) return c.json({ error: err.message }, 409);
    throw err;
  })
  .get('/', async (c) => {
    const game = await gameRepository.getOrCreateDefaultGame();
    return c.json(game);
  })
  .put('/techs', zValidator('json', idsSchema), async (c) => {
    const { ids } = c.req.valid('json');
    const game = await gameRepository.getOrCreateDefaultGame();
    const updated = await gameRepository.setOwnedTechs(game.id, ids);
    return c.json(updated);
  })
  .put('/planets', zValidator('json', idsSchema), async (c) => {
    const { ids } = c.req.valid('json');
    const game = await gameRepository.getOrCreateDefaultGame();
    const updated = await gameRepository.setControlledPlanets(game.id, ids);
    return c.json(updated);
  })
  .put(
    '/faction',
    zValidator('json', z.object({ factionId: z.string().nullable() })),
    async (c) => {
      const { factionId } = c.req.valid('json');
      const game = await gameRepository.getOrCreateDefaultGame();
      const updated = await gameRepository.setFaction(game.id, factionId);
      return c.json(updated);
    },
  )
  .put('/pins', zValidator('json', idsSchema), async (c) => {
    const { ids } = c.req.valid('json');
    const game = await gameRepository.getOrCreateDefaultGame();
    const updated = await gameRepository.setPins(game.id, ids);
    return c.json(updated);
  })
  .put('/queue', zValidator('json', idsSchema), async (c) => {
    const { ids } = c.req.valid('json');
    const game = await gameRepository.getOrCreateDefaultGame();
    const updated = await gameRepository.setQueue(game.id, ids);
    return c.json(updated);
  })
  .post('/players', zValidator('json', newPlayerSchema), async (c) => {
    const player = c.req.valid('json');
    const game = await gameRepository.getOrCreateDefaultGame();
    const updated = await gameRepository.addPlayer(game.id, player);
    return c.json(updated);
  })
  .put(
    '/players/:id',
    zValidator('param', idParamSchema),
    zValidator('json', playerPatchSchema),
    async (c) => {
      const { id } = c.req.valid('param');
      const patch = c.req.valid('json');
      const game = await gameRepository.getOrCreateDefaultGame();
      const updated = await gameRepository.updatePlayer(game.id, id, patch);
      return c.json(updated);
    },
  )
  .delete('/players/:id', zValidator('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const game = await gameRepository.getOrCreateDefaultGame();
    const updated = await gameRepository.removePlayer(game.id, id);
    return c.json(updated);
  })
  .put('/objectives/revealed', zValidator('json', idsSchema), async (c) => {
    const { ids } = c.req.valid('json');
    const game = await gameRepository.getOrCreateDefaultGame();
    const updated = await gameRepository.setRevealedObjectives(game.id, ids);
    return c.json(updated);
  })
  .post(
    '/scores/toggle',
    zValidator('json', z.object({ playerId: z.number().int(), objectiveId: z.string() })),
    async (c) => {
      const { playerId, objectiveId } = c.req.valid('json');
      const game = await gameRepository.getOrCreateDefaultGame();
      const updated = await gameRepository.toggleScore(game.id, playerId, objectiveId);
      return c.json(updated);
    },
  )
  .post(
    '/adjustments',
    zValidator(
      'json',
      z.object({
        playerId: z.number().int(),
        label: z.string().trim().min(1).max(60),
        points: z.number().int().min(-20).max(20),
      }),
    ),
    async (c) => {
      const { playerId, label, points } = c.req.valid('json');
      const game = await gameRepository.getOrCreateDefaultGame();
      const updated = await gameRepository.addVpAdjustment(game.id, playerId, label, points);
      return c.json(updated);
    },
  )
  .delete('/adjustments/:id', zValidator('param', idParamSchema), async (c) => {
    const { id } = c.req.valid('param');
    const game = await gameRepository.getOrCreateDefaultGame();
    const updated = await gameRepository.removeVpAdjustment(game.id, id);
    return c.json(updated);
  })
  .put(
    '/victory-target',
    zValidator(
      'json',
      z.object({
        victoryTarget: z.union([z.literal(VICTORY_TARGETS[0]), z.literal(VICTORY_TARGETS[1])]),
      }),
    ),
    async (c) => {
      const { victoryTarget } = c.req.valid('json');
      const game = await gameRepository.getOrCreateDefaultGame();
      const updated = await gameRepository.setVictoryTarget(game.id, victoryTarget);
      return c.json(updated);
    },
  );
