import type { TripRequest } from '../domain/trip-request.js';

export interface TripRequestsRepository {
  create(tripRequest: TripRequest): Promise<TripRequest>;
  findAll(): Promise<TripRequest[]>;
  findById(id: string): Promise<TripRequest | null>;
}
