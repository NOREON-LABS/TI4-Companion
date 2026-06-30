import { existsSync } from 'node:fs';
import path from 'node:path';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { runMigrations } from '../db/migrate';
import { app } from './app';

const PORT = Number(process.env.PORT ?? 3000);
const WEB_DIST = 'dist/web';

async function main(): Promise<void> {
  // Keep the schema current on every boot — single-tenant, so this is safe and convenient.
  await runMigrations();

  // In production the same process serves the built SPA; in dev, Vite serves it and proxies /api.
  if (process.env.NODE_ENV === 'production' && existsSync(path.resolve(WEB_DIST, 'index.html'))) {
    app.use('/*', serveStatic({ root: `./${WEB_DIST}` }));
    app.get('*', serveStatic({ path: `./${WEB_DIST}/index.html` })); // SPA fallback
  }

  serve({ fetch: app.fetch, port: PORT }, (info) => {
    console.log(`TI4 companion server listening on http://localhost:${info.port}`);
  });
}

main().catch((error: unknown) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});
