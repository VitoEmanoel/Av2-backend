import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildApp } from '../src/app.js';
import type { TripRequest } from '../src/domain/trip-request.js';
import { AppError } from '../src/errors/app-error.js';
import { errorDefinitions } from '../src/errors/error-definitions.js';
import type { HolidaysClient } from '../src/integrations/holidays-client.js';
import type { TripRequestsRepository } from '../src/repositories/trip-requests-repository.js';

const apps = [] as ReturnType<typeof buildApp>[];

const validPayload = {
  requesterName: 'Maria Silva',
  origin: 'Parnaiba',
  destination: 'Teresina',
  departureAt: '2026-07-07T07:00:00.000-03:00',
  returnAt: '2026-07-07T15:00:00.000-03:00',
  purpose: 'Participation in an institutional meeting',
  passengerCount: 3,
};

afterEach(async () => {
  await Promise.all(apps.splice(0).map(async (app) => app.close()));
  vi.restoreAllMocks();
});

function createTestContext(holidaysClient?: HolidaysClient): {
  app: ReturnType<typeof buildApp>;
  create: ReturnType<
    typeof vi.fn<(tripRequest: TripRequest) => Promise<TripRequest>>
  >;
  getHolidays: ReturnType<typeof vi.fn<(year: number) => Promise<never[]>>>;
} {
  const getHolidays = vi.fn<(year: number) => Promise<never[]>>(() =>
    Promise.resolve([]),
  );
  const create = vi.fn<(tripRequest: TripRequest) => Promise<TripRequest>>(
    (tripRequest) => Promise.resolve(tripRequest),
  );
  const tripRequestsRepository: TripRequestsRepository = {
    cancel: () => Promise.resolve({ outcome: 'not_found' }),
    create,
    findAll: () => Promise.resolve([]),
    findById: () => Promise.resolve(null),
  };
  const app = buildApp({
    holidaysClient: holidaysClient ?? { getHolidays },
    logger: false,
    tripRequestsRepository,
  });
  apps.push(app);

  return { app, create, getHolidays };
}

describe('POST /trip-requests', () => {
  it('creates a valid pending trip request with normalized UTC dates', async () => {
    const { app, create, getHolidays } = createTestContext();

    const response = await app.inject({
      method: 'POST',
      url: '/trip-requests',
      payload: validPayload,
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      success: true,
      data: {
        requesterName: validPayload.requesterName,
        origin: validPayload.origin,
        destination: validPayload.destination,
        departureAt: '2026-07-07T10:00:00.000Z',
        returnAt: '2026-07-07T18:00:00.000Z',
        purpose: validPayload.purpose,
        passengerCount: 3,
        status: 'pending',
      },
    });
    const responseBody = response.json<{ data: TripRequest }>();
    expect(responseBody.data.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(responseBody.data.createdAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    );
    expect(getHolidays).toHaveBeenCalledWith(2026);
    expect(create).toHaveBeenCalledOnce();
  });

  it('rejects a return date before the departure date', async () => {
    const { app, create, getHolidays } = createTestContext();

    const response = await app.inject({
      method: 'POST',
      url: '/trip-requests',
      payload: {
        ...validPayload,
        returnAt: '2026-07-07T06:59:59.999-03:00',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json<{ error: { code: string } }>().error.code).toBe(
      'VALIDATION_ERROR',
    );
    expect(getHolidays).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it.each([0, -1])('rejects passengerCount %s', async (passengerCount) => {
    const { app, create, getHolidays } = createTestContext();

    const response = await app.inject({
      method: 'POST',
      url: '/trip-requests',
      payload: { ...validPayload, passengerCount },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json<{ error: { code: string } }>().error.code).toBe(
      'VALIDATION_ERROR',
    );
    expect(getHolidays).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects a departure date on a national holiday', async () => {
    const holidaysClient: HolidaysClient = {
      getHolidays: () =>
        Promise.resolve([
          {
            date: '2026-01-01',
            name: 'Confraternizacao Universal',
            type: 'national',
          },
        ]),
    };
    const { app, create } = createTestContext(holidaysClient);

    const response = await app.inject({
      method: 'POST',
      url: '/trip-requests',
      payload: {
        ...validPayload,
        departureAt: '2026-01-01T10:00:00.000Z',
        returnAt: '2026-01-01T18:00:00.000Z',
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      success: false,
      error: {
        code: 'HOLIDAY_TRIP_NOT_ALLOWED',
        message: errorDefinitions.HOLIDAY_TRIP_NOT_ALLOWED.message,
      },
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('checks holidays against the normalized UTC civil date', async () => {
    const getHolidays = vi.fn(() =>
      Promise.resolve([
        {
          date: '2026-01-02',
          name: 'Controlled holiday',
          type: 'national',
        },
      ]),
    );
    const { app, create } = createTestContext({ getHolidays });

    const response = await app.inject({
      method: 'POST',
      url: '/trip-requests',
      payload: {
        ...validPayload,
        departureAt: '2026-01-01T23:00:00.000-03:00',
        returnAt: '2026-01-02T04:00:00.000-03:00',
      },
    });

    expect(response.statusCode).toBe(409);
    expect(getHolidays).toHaveBeenCalledWith(2026);
    expect(create).not.toHaveBeenCalled();
  });

  it('does not persist when the holidays API is unavailable', async () => {
    const holidaysClient: HolidaysClient = {
      getHolidays: () =>
        Promise.reject(new AppError('HOLIDAYS_API_UNAVAILABLE')),
    };
    const { app, create } = createTestContext(holidaysClient);

    const response = await app.inject({
      method: 'POST',
      url: '/trip-requests',
      payload: validPayload,
    });

    expect(response.statusCode).toBe(502);
    expect(response.json<{ error: { code: string } }>().error.code).toBe(
      'HOLIDAYS_API_UNAVAILABLE',
    );
    expect(create).not.toHaveBeenCalled();
  });

  it.each([
    [
      'a required field is missing',
      { ...validPayload, requesterName: undefined },
    ],
    ['a text field is blank', { ...validPayload, purpose: '   ' }],
    ['a date is invalid', { ...validPayload, departureAt: 'not-a-date' }],
  ])('rejects the request when %s', async (_scenario, payload) => {
    const { app, create, getHolidays } = createTestContext();

    const response = await app.inject({
      method: 'POST',
      url: '/trip-requests',
      payload,
    });

    expect(response.statusCode).toBe(400);
    expect(response.json<{ error: { code: string } }>().error.code).toBe(
      'VALIDATION_ERROR',
    );
    expect(getHolidays).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });
});
