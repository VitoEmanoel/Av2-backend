import type { Pool } from 'pg';

import type { TripRequest } from '../domain/trip-request.js';
import type { TripRequestsRepository } from './trip-requests-repository.js';

interface TripRequestRow {
  id: string;
  requester_name: string;
  origin: string;
  destination: string;
  departure_at: Date;
  return_at: Date;
  purpose: string;
  passenger_count: number;
  status: 'pending' | 'canceled';
  created_at: Date;
}

function mapTripRequest(row: TripRequestRow): TripRequest {
  return {
    id: row.id,
    requesterName: row.requester_name,
    origin: row.origin,
    destination: row.destination,
    departureAt: row.departure_at.toISOString(),
    returnAt: row.return_at.toISOString(),
    purpose: row.purpose,
    passengerCount: row.passenger_count,
    status: row.status,
    createdAt: row.created_at.toISOString(),
  };
}

export class PostgresTripRequestsRepository implements TripRequestsRepository {
  constructor(private readonly database: Pool) {}

  async create(tripRequest: TripRequest): Promise<TripRequest> {
    const result = await this.database.query<TripRequestRow>(
      `
        INSERT INTO trip_requests (
          id,
          requester_name,
          origin,
          destination,
          departure_at,
          return_at,
          purpose,
          passenger_count,
          status,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `,
      [
        tripRequest.id,
        tripRequest.requesterName,
        tripRequest.origin,
        tripRequest.destination,
        tripRequest.departureAt,
        tripRequest.returnAt,
        tripRequest.purpose,
        tripRequest.passengerCount,
        tripRequest.status,
        tripRequest.createdAt,
      ],
    );

    const row = result.rows[0];

    if (row === undefined) {
      throw new Error('Database did not return the created trip request');
    }

    return mapTripRequest(row);
  }
}
