import { randomUUID } from 'node:crypto';

import type {
  CreateTripRequestInput,
  TripRequest,
} from '../domain/trip-request.js';
import { AppError } from '../errors/app-error.js';
import type { HolidaysClient } from '../integrations/holidays-client.js';
import type { TripRequestsRepository } from '../repositories/trip-requests-repository.js';

interface TripRequestServiceOptions {
  holidaysClient: HolidaysClient;
  tripRequestsRepository: TripRequestsRepository;
  generateId?: () => string;
  now?: () => Date;
}

export class TripRequestService {
  private readonly generateId: () => string;
  private readonly holidaysClient: HolidaysClient;
  private readonly now: () => Date;
  private readonly tripRequestsRepository: TripRequestsRepository;

  constructor(options: TripRequestServiceOptions) {
    this.generateId = options.generateId ?? randomUUID;
    this.holidaysClient = options.holidaysClient;
    this.now = options.now ?? (() => new Date());
    this.tripRequestsRepository = options.tripRequestsRepository;
  }

  async cancel(id: string): Promise<TripRequest> {
    const result = await this.tripRequestsRepository.cancel(id);

    if (result.outcome === 'not_found') {
      throw new AppError('TRIP_REQUEST_NOT_FOUND');
    }

    if (result.outcome === 'already_canceled') {
      throw new AppError('TRIP_REQUEST_ALREADY_CANCELED');
    }

    return result.tripRequest;
  }

  async create(input: CreateTripRequestInput): Promise<TripRequest> {
    if (
      input.passengerCount <= 0 ||
      new Date(input.returnAt).getTime() < new Date(input.departureAt).getTime()
    ) {
      throw new AppError('VALIDATION_ERROR');
    }

    const departureDate = input.departureAt.slice(0, 10);
    const departureYear = Number(departureDate.slice(0, 4));
    const holidays = await this.holidaysClient.getHolidays(departureYear);

    if (holidays.some((holiday) => holiday.date === departureDate)) {
      throw new AppError('HOLIDAY_TRIP_NOT_ALLOWED');
    }

    return this.tripRequestsRepository.create({
      ...input,
      id: this.generateId(),
      status: 'pending',
      createdAt: this.now().toISOString(),
    });
  }

  async findAll(): Promise<TripRequest[]> {
    return this.tripRequestsRepository.findAll();
  }

  async findById(id: string): Promise<TripRequest> {
    const tripRequest = await this.tripRequestsRepository.findById(id);

    if (tripRequest === null) {
      throw new AppError('TRIP_REQUEST_NOT_FOUND');
    }

    return tripRequest;
  }
}
