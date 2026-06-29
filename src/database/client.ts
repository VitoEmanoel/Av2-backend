import { Pool } from 'pg';

import { env } from '../config/env.js';

export const database = new Pool({
  connectionString: env.DATABASE_URL,
});

export async function closeDatabase(): Promise<void> {
  await database.end();
}
