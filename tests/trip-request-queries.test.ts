import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildApp } from '../src/app.js';
import type { TripRequest } from '../src/domain/trip-request.js';
import { errorDefinitions } from '../src/errors/error-definitions.js';
import type { HolidaysClient } from '../src/integrations/holidays-client.js';
import type { TripRequestsRepository } from '../src/repositories/trip-requests-repository.js';

const apps = [] as ReturnType<typeof buildApp>[];

const existingTripRequest: TripRequest = {
  id: '00000000-0000-4000-8000-000000000001',
  requesterName: 'Maria Silva',
  origin: 'Parnaiba',
  destination: 'Teresina',
  departureAt: '2026-07-07T10:00:00.000Z',
  returnAt: '2026-07-07T18:00:00.000Z',
  purpose: 'Participation in an institutional meeting',
  passengerCount: 3,
  status: 'pending',
  createdAt: '2026-06-20T14:30:00.000Z',
};

afterEach(async () => {
  await Promise.all(apps.splice(0).map(async (app) => app.close()));
  vi.restoreAllMocks();
});

function createTestApp(
  tripRequestsRepository: TripRequestsRepository,
): ReturnType<typeof buildApp> {
  const holidaysClient: HolidaysClient = {
    getHolidays: () => Promise.resolve([]),
  };
  const app = buildApp({
    holidaysClient,
    logger: false,
    tripRequestsRepository,
  });
  apps.push(app);
  return app;
}

function createRepository(options?: {
  records?: TripRequest[];
  selectedRecord?: TripRequest | null;
}): TripRequestsRepository {
  return {
    cancel: () => Promise.resolve({ outcome: 'not_found' }),
    create: (tripRequest) => Promise.resolve(tripRequest),
    findAll: () => Promise.resolve(options?.records ?? []),
    findById: () => Promise.resolve(options?.selectedRecord ?? null),
  };
}

describe('GET /trip-requests', () => {
  it('returns all trip requests', async () => {
    const app = createTestApp(
      createRepository({ records: [existingTripRequest] }),
    );

    const response = await app.inject({
      method: 'GET',
      url: '/trip-requests',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      success: true,
      data: [existingTripRequest],
    });
  });

  it('returns an empty list when no trip requests exist', async () => {
    const app = createTestApp(createRepository());

    const response = await app.inject({
      method: 'GET',
      url: '/trip-requests',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ success: true, data: [] });
  });
});

describe('GET /trip-requests/:id', () => {
  it('returns a trip request by id', async () => {
    const findById = vi.fn(() => Promise.resolve(existingTripRequest));
    const repository = createRepository();
    repository.findById = findById;
    const app = createTestApp(repository);

    const response = await app.inject({
      method: 'GET',
      url: `/trip-requests/${existingTripRequest.id}`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      success: true,
      data: existingTripRequest,
    });
    expect(findById).toHaveBeenCalledWith(existingTripRequest.id);
  });

  it('returns TRIP_REQUEST_NOT_FOUND for a missing trip request', async () => {
    const app = createTestApp(createRepository());

    const response = await app.inject({
      method: 'GET',
      url: '/trip-requests/00000000-0000-4000-8000-000000000099',
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      success: false,
      error: {
        code: 'TRIP_REQUEST_NOT_FOUND',
        message: errorDefinitions.TRIP_REQUEST_NOT_FOUND.message,
      },
    });
  });

  it('returns VALIDATION_ERROR for an invalid identifier', async () => {
    const findById = vi.fn(() => Promise.resolve(null));
    const repository = createRepository();
    repository.findById = findById;
    const app = createTestApp(repository);

    const response = await app.inject({
      method: 'GET',
      url: '/trip-requests/not-a-uuid',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: errorDefinitions.VALIDATION_ERROR.message,
      },
    });
    expect(findById).not.toHaveBeenCalled();
  });
});
