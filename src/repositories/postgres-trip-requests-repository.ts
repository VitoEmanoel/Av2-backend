import type { Pool } from 'pg';

import type { TripRequest } from '../domain/trip-request.js';
import type {
  CancelTripRequestResult,
  TripRequestsRepository,
} from './trip-requests-repository.js';

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

  async cancel(id: string): Promise<CancelTripRequestResult> {
    const client = await this.database.connect();

    try {
      await client.query('BEGIN');
      const selectedResult = await client.query<TripRequestRow>(
        `
          SELECT *
          FROM trip_requests
          WHERE id = $1
          FOR UPDATE
        `,
        [id],
      );
      const selectedRow = selectedResult.rows[0];

      if (selectedRow === undefined) {
        await client.query('COMMIT');
        return { outcome: 'not_found' };
      }

      if (selectedRow.status === 'canceled') {
        await client.query('COMMIT');
        return { outcome: 'already_canceled' };
      }

      const updatedResult = await client.query<TripRequestRow>(
        `
          UPDATE trip_requests
          SET status = 'canceled'
          WHERE id = $1
          RETURNING *
        `,
        [id],
      );
      const updatedRow = updatedResult.rows[0];

      if (updatedRow === undefined) {
        throw new Error('Database did not return the canceled trip request');
      }

      await client.query('COMMIT');

      return {
        outcome: 'canceled',
        tripRequest: mapTripRequest(updatedRow),
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

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

  async findAll(): Promise<TripRequest[]> {
    const result = await this.database.query<TripRequestRow>(`
      SELECT *
      FROM trip_requests
      ORDER BY created_at ASC, id ASC
    `);

    return result.rows.map(mapTripRequest);
  }

  async findById(id: string): Promise<TripRequest | null> {
    const result = await this.database.query<TripRequestRow>(
      `
        SELECT *
        FROM trip_requests
        WHERE id = $1
      `,
      [id],
    );

    const row = result.rows[0];

    return row === undefined ? null : mapTripRequest(row);
  }
}
