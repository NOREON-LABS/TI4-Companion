import { defineConfig } from 'drizzle-kit';

// drizzle-kit only generates migration SQL here (it does not connect).
// Migrations are applied programmatically by src/db/migrate.ts using the libSQL driver.
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DB_URL ?? 'file:./data/ti4.db',
  },
});
