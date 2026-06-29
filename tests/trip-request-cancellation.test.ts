import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildApp } from '../src/app.js';
import type { TripRequest } from '../src/domain/trip-request.js';
import { errorDefinitions } from '../src/errors/error-definitions.js';
import type { HolidaysClient } from '../src/integrations/holidays-client.js';
import type {
  CancelTripRequestResult,
  TripRequestsRepository,
} from '../src/repositories/trip-requests-repository.js';

const apps = [] as ReturnType<typeof buildApp>[];

const pendingTripRequest: TripRequest = {
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

function createTestContext(result: CancelTripRequestResult): {
  app: ReturnType<typeof buildApp>;
  cancel: ReturnType<
    typeof vi.fn<(id: string) => Promise<CancelTripRequestResult>>
  >;
} {
  const cancel = vi.fn<(id: string) => Promise<CancelTripRequestResult>>(() =>
    Promise.resolve(result),
  );
  const holidaysClient: HolidaysClient = {
    getHolidays: () => Promise.resolve([]),
  };
  const tripRequestsRepository: TripRequestsRepository = {
    cancel,
    create: (tripRequest) => Promise.resolve(tripRequest),
    findAll: () => Promise.resolve([]),
    findById: () => Promise.resolve(null),
  };
  const app = buildApp({
    holidaysClient,
    logger: false,
    tripRequestsRepository,
  });
  apps.push(app);

  return { app, cancel };
}

describe('PATCH /trip-requests/:id/cancel', () => {
  it('cancels an existing pending trip request', async () => {
    const canceledTripRequest: TripRequest = {
      ...pendingTripRequest,
      status: 'canceled',
    };
    const { app, cancel } = createTestContext({
      outcome: 'canceled',
      tripRequest: canceledTripRequest,
    });

    const response = await app.inject({
      method: 'PATCH',
      url: `/trip-requests/${pendingTripRequest.id}/cancel`,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      success: true,
      data: canceledTripRequest,
    });
    expect(cancel).toHaveBeenCalledWith(pendingTripRequest.id);
  });

  it('returns TRIP_REQUEST_NOT_FOUND for a missing trip request', async () => {
    const { app } = createTestContext({ outcome: 'not_found' });

    const response = await app.inject({
      method: 'PATCH',
      url: '/trip-requests/00000000-0000-4000-8000-000000000099/cancel',
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

  it('returns TRIP_REQUEST_ALREADY_CANCELED for a canceled request', async () => {
    const { app } = createTestContext({ outcome: 'already_canceled' });

    const response = await app.inject({
      method: 'PATCH',
      url: `/trip-requests/${pendingTripRequest.id}/cancel`,
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      success: false,
      error: {
        code: 'TRIP_REQUEST_ALREADY_CANCELED',
        message: errorDefinitions.TRIP_REQUEST_ALREADY_CANCELED.message,
      },
    });
  });

  it('rejects an invalid identifier before accessing the repository', async () => {
    const { app, cancel } = createTestContext({ outcome: 'not_found' });

    const response = await app.inject({
      method: 'PATCH',
      url: '/trip-requests/not-a-uuid/cancel',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: errorDefinitions.VALIDATION_ERROR.message,
      },
    });
    expect(cancel).not.toHaveBeenCalled();
  });
});
