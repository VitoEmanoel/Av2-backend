import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { closeDatabase, database } from '../src/database/client.js';
import { createTripRequestsTableSql } from '../src/database/schema.js';
import type { TripRequest } from '../src/domain/trip-request.js';
import { PostgresTripRequestsRepository } from '../src/repositories/postgres-trip-requests-repository.js';

const testId = '00000000-0000-4000-8000-00000000f901';
const testIds = [testId];

const repository = new PostgresTripRequestsRepository(database);

function createTripRequest(id: string): TripRequest {
  return {
    id,
    requesterName: 'Repository Test',
    origin: 'Teresina',
    destination: 'Parnaiba',
    departureAt: '2026-08-03T10:00:00.000Z',
    returnAt: '2026-08-03T18:00:00.000Z',
    purpose: 'PostgreSQL repository integration test',
    passengerCount: 2,
    status: 'pending',
    createdAt: '2026-06-28T20:00:00.000Z',
  };
}

async function removeTestRecords(): Promise<void> {
  await database.query('DELETE FROM trip_requests WHERE id = ANY($1::uuid[])', [
    testIds,
  ]);
}

beforeAll(async () => {
  await database.query(createTripRequestsTableSql);
  await removeTestRecords();
});

afterEach(removeTestRecords);

afterAll(async () => {
  await removeTestRecords();
  await closeDatabase();
});

describe('PostgresTripRequestsRepository', () => {
  it('creates, persists, lists, and finds a trip request', async () => {
    const input = createTripRequest(testId);

    const created = await repository.create(input);
    const found = await repository.findById(input.id);
    const listed = await repository.findAll();

    expect(created).toEqual(input);
    expect(found).toEqual(input);
    expect(listed).toContainEqual(input);
    expect(created.departureAt).toBe('2026-08-03T10:00:00.000Z');
    expect(created.returnAt).toBe('2026-08-03T18:00:00.000Z');
    expect(created.createdAt).toBe('2026-06-28T20:00:00.000Z');
  });

  it('returns null when a trip request does not exist', async () => {
    await expect(repository.findById(testId)).resolves.toBeNull();
  });

  it('enforces passenger count integrity in PostgreSQL', async () => {
    const input = {
      ...createTripRequest(testId),
      passengerCount: 0,
    };

    await expect(repository.create(input)).rejects.toMatchObject({
      code: '23514',
      constraint: 'trip_requests_positive_passenger_count',
    });
  });

  it('returns not_found when canceling a missing request', async () => {
    await expect(repository.cancel(testId)).resolves.toEqual({
      outcome: 'not_found',
    });
  });

  it('persists cancellation and rejects a repeated cancellation', async () => {
    const input = createTripRequest(testId);
    await repository.create(input);

    const firstResult = await repository.cancel(input.id);
    const secondResult = await repository.cancel(input.id);
    const persisted = await repository.findById(input.id);

    expect(firstResult).toMatchObject({
      outcome: 'canceled',
      tripRequest: { id: input.id, status: 'canceled' },
    });
    expect(secondResult).toEqual({ outcome: 'already_canceled' });
    expect(persisted?.status).toBe('canceled');
  });

  it('allows only one successful concurrent cancellation', async () => {
    const input = createTripRequest(testId);
    await repository.create(input);

    const results = await Promise.all([
      repository.cancel(input.id),
      repository.cancel(input.id),
    ]);
    const outcomes = results.map((result) => result.outcome).sort();

    expect(outcomes).toEqual(['already_canceled', 'canceled']);
  });
});
