import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildApp } from '../src/app.js';
import { AppError } from '../src/errors/app-error.js';
import { errorDefinitions } from '../src/errors/error-definitions.js';
import {
  BrasilApiHolidaysClient,
  type FetchFunction,
} from '../src/integrations/brasil-api-holidays-client.js';
import type {
  Holiday,
  HolidaysClient,
} from '../src/integrations/holidays-client.js';

const apps = [] as ReturnType<typeof buildApp>[];

afterEach(async () => {
  await Promise.all(apps.splice(0).map(async (app) => app.close()));
  vi.restoreAllMocks();
});

function createTestApp(
  holidaysClient: HolidaysClient,
): ReturnType<typeof buildApp> {
  const app = buildApp({ holidaysClient, logger: false });
  apps.push(app);
  return app;
}

describe('BrasilApiHolidaysClient', () => {
  it('fetches and validates national holidays', async () => {
    const holidays: Holiday[] = [
      {
        date: '2026-01-01',
        name: 'Confraternizacao Universal',
        type: 'national',
      },
    ];
    const fetchImplementation = vi.fn<FetchFunction>(() =>
      Promise.resolve(
        new Response(JSON.stringify(holidays), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );
    const client = new BrasilApiHolidaysClient({
      baseUrl: 'https://holidays.example/',
      fetchImplementation,
    });

    await expect(client.getHolidays(2026)).resolves.toEqual(holidays);
    expect(fetchImplementation).toHaveBeenCalledOnce();
    expect(fetchImplementation.mock.calls[0]?.[0]).toBe(
      'https://holidays.example/api/feriados/v1/2026',
    );
    expect(fetchImplementation.mock.calls[0]?.[1]?.signal).toBeInstanceOf(
      AbortSignal,
    );
  });

  it.each([
    [
      'an unsuccessful response',
      () => Promise.resolve(new Response(null, { status: 503 })),
    ],
    [
      'an invalid response body',
      () =>
        Promise.resolve(
          new Response(JSON.stringify([{ invalid: true }]), { status: 200 }),
        ),
    ],
    ['a network failure', () => Promise.reject(new Error('network failure'))],
  ])('maps %s to HOLIDAYS_API_UNAVAILABLE', async (_scenario, fetchMock) => {
    const client = new BrasilApiHolidaysClient({
      baseUrl: 'https://holidays.example',
      fetchImplementation: fetchMock,
    });

    await expect(client.getHolidays(2026)).rejects.toMatchObject({
      code: 'HOLIDAYS_API_UNAVAILABLE',
      statusCode: 502,
    });
  });

  it('aborts requests that exceed the configured timeout', async () => {
    const fetchImplementation: FetchFunction = (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new Error('request aborted'));
        });
      });
    const client = new BrasilApiHolidaysClient({
      baseUrl: 'https://holidays.example',
      fetchImplementation,
      timeoutMs: 1,
    });

    await expect(client.getHolidays(2026)).rejects.toMatchObject({
      code: 'HOLIDAYS_API_UNAVAILABLE',
      statusCode: 502,
    });
  });
});

describe('GET /holidays/:year', () => {
  it('returns holidays through the standard success envelope', async () => {
    const holidays: Holiday[] = [
      {
        date: '2026-01-01',
        name: 'Confraternizacao Universal',
        type: 'national',
      },
    ];
    const getHolidays = vi.fn(() => Promise.resolve(holidays));
    const app = createTestApp({ getHolidays });

    const response = await app.inject({
      method: 'GET',
      url: '/holidays/2026',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ success: true, data: holidays });
    expect(getHolidays).toHaveBeenCalledWith(2026);
  });

  it('rejects an invalid year without calling the external client', async () => {
    const getHolidays = vi.fn(() => Promise.resolve([]));
    const app = createTestApp({ getHolidays });

    const response = await app.inject({
      method: 'GET',
      url: '/holidays/invalid',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: errorDefinitions.VALIDATION_ERROR.message,
      },
    });
    expect(getHolidays).not.toHaveBeenCalled();
  });

  it('returns 502 when the external client is unavailable', async () => {
    const app = createTestApp({
      getHolidays: () =>
        Promise.reject(new AppError('HOLIDAYS_API_UNAVAILABLE')),
    });

    const response = await app.inject({
      method: 'GET',
      url: '/holidays/2026',
    });

    expect(response.statusCode).toBe(502);
    expect(response.json()).toEqual({
      success: false,
      error: {
        code: 'HOLIDAYS_API_UNAVAILABLE',
        message: errorDefinitions.HOLIDAYS_API_UNAVAILABLE.message,
      },
    });
  });
});
