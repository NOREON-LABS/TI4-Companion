import { pathToFileURL } from 'node:url';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { db } from './client';

const MIGRATIONS_FOLDER = 'src/db/migrations';

/** Apply all pending migrations. Called on server boot and by the `db:migrate` script. */
export async function runMigrations(): Promise<void> {
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
}

// Run standalone: `tsx src/db/migrate.ts`
const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  runMigrations()
    .then(() => {
      console.log('Migrations applied.');
      process.exit(0);
    })
    .catch((error: unknown) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
