import { buildApp } from './app.js';
import { env } from './config/env.js';
import { database } from './database/client.js';
import { BrasilApiHolidaysClient } from './integrations/brasil-api-holidays-client.js';
import { PostgresTripRequestsRepository } from './repositories/postgres-trip-requests-repository.js';

const holidaysClient = new BrasilApiHolidaysClient({
  baseUrl: env.HOLIDAYS_API_BASE_URL,
});
const tripRequestsRepository = new PostgresTripRequestsRepository(database);
const app = buildApp({ holidaysClient, tripRequestsRepository });

try {
  await app.listen({ host: '0.0.0.0', port: env.PORT });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
