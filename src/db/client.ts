import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

const url = process.env.DB_URL ?? 'file:./data/ti4.db';

const client = createClient({ url });

export const db = drizzle(client, { schema });

export type Db = typeof db;
