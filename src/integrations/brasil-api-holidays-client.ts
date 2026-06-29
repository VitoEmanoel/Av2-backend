import { z } from 'zod';

import { AppError } from '../errors/app-error.js';
import type { Holiday, HolidaysClient } from './holidays-client.js';

const holidaysSchema = z.array(
  z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    name: z.string().min(1),
    type: z.string().min(1),
  }),
);

export type FetchFunction = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

interface BrasilApiHolidaysClientOptions {
  baseUrl: string;
  fetchImplementation?: FetchFunction;
  timeoutMs?: number;
}

export class BrasilApiHolidaysClient implements HolidaysClient {
  private readonly baseUrl: string;
  private readonly fetchImplementation: FetchFunction;
  private readonly timeoutMs: number;

  constructor(options: BrasilApiHolidaysClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.fetchImplementation = options.fetchImplementation ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 5_000;
  }

  async getHolidays(year: number): Promise<Holiday[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImplementation(
        `${this.baseUrl}/api/feriados/v1/${year}`,
        { signal: controller.signal },
      );

      if (!response.ok) {
        throw new Error(`BrasilAPI returned status ${response.status}`);
      }

      const payload: unknown = await response.json();
      const result = holidaysSchema.safeParse(payload);

      if (!result.success) {
        throw new Error('BrasilAPI returned an invalid holidays response');
      }

      return result.data;
    } catch {
      throw new AppError('HOLIDAYS_API_UNAVAILABLE');
    } finally {
      clearTimeout(timeout);
    }
  }
}
