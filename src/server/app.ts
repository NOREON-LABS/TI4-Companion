import { Hono } from 'hono';
import { gameRoutes } from './routes/game.routes';

/** The API app. Routes are chained so the type can drive the web app's typed RPC client. */
export const app = new Hono().route('/api/game', gameRoutes);

/** Consumed type-only by the web client (`hc<AppType>`); erased at build time. */
export type AppType = typeof app;
