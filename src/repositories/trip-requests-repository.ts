import type { TripRequest } from '../domain/trip-request.js';

export type CancelTripRequestResult =
  | { outcome: 'canceled'; tripRequest: TripRequest }
  | { outcome: 'not_found' }
  | { outcome: 'already_canceled' };

export interface TripRequestsRepository {
  cancel(id: string): Promise<CancelTripRequestResult>;
  create(tripRequest: TripRequest): Promise<TripRequest>;
  findAll(): Promise<TripRequest[]>;
  findById(id: string): Promise<TripRequest | null>;
}
