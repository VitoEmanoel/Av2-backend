import type { FastifyInstance } from 'fastify';

import { AppError } from '../../errors/app-error.js';
import type { TripRequestService } from '../../services/trip-request-service.js';
import { successResponse } from '../responses.js';
import { createTripRequestSchema } from '../schemas/trip-request-schemas.js';

export function registerTripRequestsRoutes(
  app: FastifyInstance,
  tripRequestService: TripRequestService,
): void {
  app.post('/trip-requests', async (request, reply) => {
    const input = createTripRequestSchema.safeParse(request.body);

    if (!input.success) {
      throw new AppError('VALIDATION_ERROR');
    }

    const tripRequest = await tripRequestService.create(input.data);

    return reply.status(201).send(successResponse(tripRequest));
  });
}
