import Fastify, { type FastifyInstance } from 'fastify';

import { registerErrorHandler } from './errors/error-handler.js';
import { registerHolidaysRoutes } from './http/routes/holidays-routes.js';
import { registerTripRequestsRoutes } from './http/routes/trip-requests-routes.js';
import type { HolidaysClient } from './integrations/holidays-client.js';
import type { TripRequestsRepository } from './repositories/trip-requests-repository.js';
import { TripRequestService } from './services/trip-request-service.js';

interface BuildAppOptions {
  holidaysClient: HolidaysClient;
  logger?: boolean;
  tripRequestsRepository: TripRequestsRepository;
}

export function buildApp(options: BuildAppOptions): FastifyInstance {
  const app = Fastify({
    logger: options.logger ?? true,
  });

  registerErrorHandler(app);
  registerHolidaysRoutes(app, options.holidaysClient);
  registerTripRequestsRoutes(
    app,
    new TripRequestService({
      holidaysClient: options.holidaysClient,
      tripRequestsRepository: options.tripRequestsRepository,
    }),
  );

  return app;
}
