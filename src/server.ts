import { buildApp } from './app.js';
import { env } from './config/env.js';
import { BrasilApiHolidaysClient } from './integrations/brasil-api-holidays-client.js';

const holidaysClient = new BrasilApiHolidaysClient({
  baseUrl: env.HOLIDAYS_API_BASE_URL,
});
const app = buildApp({ holidaysClient });

try {
  await app.listen({ host: '0.0.0.0', port: env.PORT });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
