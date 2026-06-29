import type { FastifyInstance } from 'fastify';

import { AppError } from '../../errors/app-error.js';
import type { TripRequestService } from '../../services/trip-request-service.js';
import { successResponse } from '../responses.js';
import {
  createTripRequestSchema,
  tripRequestIdParamsSchema,
} from '../schemas/trip-request-schemas.js';

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

  app.get('/trip-requests', async () => {
    const tripRequests = await tripRequestService.findAll();

    return successResponse(tripRequests);
  });

  app.get('/trip-requests/:id', async (request) => {
    const params = tripRequestIdParamsSchema.safeParse(request.params);

    if (!params.success) {
      throw new AppError('VALIDATION_ERROR');
    }

    const tripRequest = await tripRequestService.findById(params.data.id);

    return successResponse(tripRequest);
  });

  app.patch('/trip-requests/:id/cancel', async (request) => {
    const params = tripRequestIdParamsSchema.safeParse(request.params);

    if (!params.success) {
      throw new AppError('VALIDATION_ERROR');
    }

    const tripRequest = await tripRequestService.cancel(params.data.id);

    return successResponse(tripRequest);
  });
}
