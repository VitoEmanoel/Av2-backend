import Fastify, { type FastifyInstance } from 'fastify';

import { registerErrorHandler } from './errors/error-handler.js';
import { registerHolidaysRoutes } from './http/routes/holidays-routes.js';
import type { HolidaysClient } from './integrations/holidays-client.js';

interface BuildAppOptions {
  holidaysClient: HolidaysClient;
  logger?: boolean;
}

export function buildApp(options: BuildAppOptions): FastifyInstance {
  const app = Fastify({
    logger: options.logger ?? true,
  });

  registerErrorHandler(app);
  registerHolidaysRoutes(app, options.holidaysClient);

  return app;
}
