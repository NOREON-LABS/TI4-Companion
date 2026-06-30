import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
// Relative imports keep all Node-executed code (server/db/domain) alias-free; the web
// app uses the @ aliases. The architecture boundary is enforced by ESLint regardless.
import { gameRepository } from '../../db/repositories';

const idsSchema = z.object({ ids: z.array(z.string()) });

/**
 * Game-state endpoints. Single-tenant: there is one default game per instance. Handlers
 * validate input with zod and delegate to the repository — no SQL here.
 */
export const gameRoutes = new Hono()
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
  .put('/faction', zValidator('json', z.object({ factionId: z.string() })), async (c) => {
    const { factionId } = c.req.valid('json');
    const game = await gameRepository.getOrCreateDefaultGame();
    const updated = await gameRepository.setFaction(game.id, factionId);
    return c.json(updated);
  })
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
  });
