import { closeDatabase, database } from '../src/database/client.js';
import {
  createTripRequestsTableSql,
  seedTripRequestsSql,
} from '../src/database/schema.js';

async function initializeDatabase(): Promise<void> {
  const client = await database.connect();

  try {
    await client.query('BEGIN');
    await client.query(createTripRequestsTableSql);
    const seedResult = await client.query(seedTripRequestsSql);
    await client.query('COMMIT');

    process.stdout.write(
      `Database initialized successfully (${seedResult.rowCount ?? 0} records inserted)\n`,
    );
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

try {
  await initializeDatabase();
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  process.stderr.write(`Failed to initialize database: ${message}\n`);
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
