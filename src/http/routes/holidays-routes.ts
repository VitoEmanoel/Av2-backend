import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { AppError } from '../../errors/app-error.js';
import type { HolidaysClient } from '../../integrations/holidays-client.js';
import { successResponse } from '../responses.js';

const yearParamsSchema = z.object({
  year: z.coerce.number().int().min(1_000).max(9_999),
});

export function registerHolidaysRoutes(
  app: FastifyInstance,
  holidaysClient: HolidaysClient,
): void {
  app.get('/holidays/:year', async (request) => {
    const params = yearParamsSchema.safeParse(request.params);

    if (!params.success) {
      throw new AppError('VALIDATION_ERROR');
    }

    const holidays = await holidaysClient.getHolidays(params.data.year);

    return successResponse(holidays);
  });
}
