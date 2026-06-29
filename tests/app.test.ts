import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from '../src/app.js';
import { AppError } from '../src/errors/app-error.js';
import {
  errorDefinitions,
  type ErrorCode,
} from '../src/errors/error-definitions.js';
import { successResponse } from '../src/http/responses.js';
import type { HolidaysClient } from '../src/integrations/holidays-client.js';
import type { TripRequestsRepository } from '../src/repositories/trip-requests-repository.js';

const apps = [] as ReturnType<typeof buildApp>[];

afterEach(async () => {
  await Promise.all(apps.splice(0).map(async (app) => app.close()));
});

function createTestApp(): ReturnType<typeof buildApp> {
  const holidaysClient: HolidaysClient = {
    getHolidays: () => Promise.resolve([]),
  };
  const tripRequestsRepository: TripRequestsRepository = {
    create: (tripRequest) => Promise.resolve(tripRequest),
  };
  const app = buildApp({
    holidaysClient,
    logger: false,
    tripRequestsRepository,
  });
  apps.push(app);
  return app;
}

describe('HTTP application', () => {
  it('builds a Fastify application', () => {
    const app = createTestApp();

    expect(app).toBeDefined();
  });

  it('returns the standard success envelope', async () => {
    const app = createTestApp();
    app.get('/success', () => successResponse({ status: 'ok' }));

    const response = await app.inject({ method: 'GET', url: '/success' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      success: true,
      data: { status: 'ok' },
    });
  });

  it.each(
    Object.entries(errorDefinitions) as [
      ErrorCode,
      (typeof errorDefinitions)[ErrorCode],
    ][],
  )('maps %s to its standard error response', async (code, definition) => {
    const app = createTestApp();
    app.get('/application-error', () => {
      throw new AppError(code);
    });

    const response = await app.inject({
      method: 'GET',
      url: '/application-error',
    });

    expect(response.statusCode).toBe(definition.statusCode);
    expect(response.json()).toEqual({
      success: false,
      error: {
        code,
        message: definition.message,
      },
    });
  });

  it('does not expose details from unexpected errors', async () => {
    const app = createTestApp();
    app.get('/unexpected-error', () => {
      throw new Error('password=secret database connection failed');
    });

    const response = await app.inject({
      method: 'GET',
      url: '/unexpected-error',
    });

    expect(response.statusCode).toBe(500);
    expect(response.body).not.toContain('password');
    expect(response.body).not.toContain('database');
    expect(response.json()).toEqual({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: errorDefinitions.INTERNAL_SERVER_ERROR.message,
      },
    });
  });

  it('returns the standard error envelope for unknown routes', async () => {
    const app = createTestApp();

    const response = await app.inject({
      method: 'GET',
      url: '/unknown-route',
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: errorDefinitions.ROUTE_NOT_FOUND.message,
      },
    });
  });

  it('maps malformed JSON to a validation error', async () => {
    const app = createTestApp();
    app.post('/json', () => successResponse(null));

    const response = await app.inject({
      method: 'POST',
      url: '/json',
      headers: { 'content-type': 'application/json' },
      payload: '{invalid',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: errorDefinitions.VALIDATION_ERROR.message,
      },
    });
  });
});
