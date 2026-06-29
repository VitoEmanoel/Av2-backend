export const createTripRequestsTableSql = `
  CREATE TABLE IF NOT EXISTS trip_requests (
    id UUID PRIMARY KEY,
    requester_name VARCHAR(150) NOT NULL,
    origin VARCHAR(150) NOT NULL,
    destination VARCHAR(150) NOT NULL,
    departure_at TIMESTAMPTZ NOT NULL,
    return_at TIMESTAMPTZ NOT NULL,
    purpose TEXT NOT NULL,
    passenger_count INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT trip_requests_requester_name_not_blank
      CHECK (BTRIM(requester_name) <> ''),
    CONSTRAINT trip_requests_origin_not_blank
      CHECK (BTRIM(origin) <> ''),
    CONSTRAINT trip_requests_destination_not_blank
      CHECK (BTRIM(destination) <> ''),
    CONSTRAINT trip_requests_purpose_not_blank
      CHECK (BTRIM(purpose) <> ''),
    CONSTRAINT trip_requests_valid_period
      CHECK (return_at >= departure_at),
    CONSTRAINT trip_requests_positive_passenger_count
      CHECK (passenger_count > 0),
    CONSTRAINT trip_requests_valid_status
      CHECK (status IN ('pending', 'canceled'))
  )
`;

export const seedTripRequestsSql = `
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
  VALUES
    (
      '00000000-0000-4000-8000-000000000001',
      'Maria Silva',
      'Parnaiba',
      'Teresina',
      '2026-07-07T10:00:00.000Z',
      '2026-07-07T18:00:00.000Z',
      'Participation in an institutional meeting',
      3,
      'pending',
      '2026-06-20T14:30:00.000Z'
    ),
    (
      '00000000-0000-4000-8000-000000000002',
      'Joao Santos',
      'Teresina',
      'Floriano',
      '2026-07-08T11:00:00.000Z',
      '2026-07-09T20:00:00.000Z',
      'Academic conference participation',
      4,
      'pending',
      '2026-06-20T14:31:00.000Z'
    ),
    (
      '00000000-0000-4000-8000-000000000003',
      'Ana Oliveira',
      'Picos',
      'Teresina',
      '2026-07-10T12:00:00.000Z',
      '2026-07-10T22:00:00.000Z',
      'Research project meeting',
      2,
      'pending',
      '2026-06-20T14:32:00.000Z'
    ),
    (
      '00000000-0000-4000-8000-000000000004',
      'Carlos Lima',
      'Floriano',
      'Picos',
      '2026-07-13T09:00:00.000Z',
      '2026-07-13T19:00:00.000Z',
      'Extension program activity',
      5,
      'pending',
      '2026-06-20T14:33:00.000Z'
    ),
    (
      '00000000-0000-4000-8000-000000000005',
      'Juliana Costa',
      'Piripiri',
      'Parnaiba',
      '2026-07-14T10:30:00.000Z',
      '2026-07-15T21:00:00.000Z',
      'Teaching activity support',
      6,
      'pending',
      '2026-06-20T14:34:00.000Z'
    ),
    (
      '00000000-0000-4000-8000-000000000006',
      'Pedro Rocha',
      'Teresina',
      'Parnaiba',
      '2026-07-16T08:00:00.000Z',
      '2026-07-17T23:00:00.000Z',
      'Administrative inspection',
      2,
      'canceled',
      '2026-06-20T14:35:00.000Z'
    ),
    (
      '00000000-0000-4000-8000-000000000007',
      'Fernanda Alves',
      'Campo Maior',
      'Teresina',
      '2026-07-20T12:00:00.000Z',
      '2026-07-20T20:00:00.000Z',
      'Laboratory equipment collection',
      3,
      'pending',
      '2026-06-20T14:36:00.000Z'
    ),
    (
      '00000000-0000-4000-8000-000000000008',
      'Rafael Sousa',
      'Oeiras',
      'Picos',
      '2026-07-21T11:00:00.000Z',
      '2026-07-22T18:00:00.000Z',
      'Institutional planning workshop',
      4,
      'pending',
      '2026-06-20T14:37:00.000Z'
    ),
    (
      '00000000-0000-4000-8000-000000000009',
      'Beatriz Martins',
      'Parnaiba',
      'Piripiri',
      '2026-07-23T13:00:00.000Z',
      '2026-07-23T21:00:00.000Z',
      'Student project presentation',
      8,
      'pending',
      '2026-06-20T14:38:00.000Z'
    ),
    (
      '00000000-0000-4000-8000-000000000010',
      'Lucas Ferreira',
      'Teresina',
      'Campo Maior',
      '2026-07-24T10:00:00.000Z',
      '2026-07-24T16:00:00.000Z',
      'Campus administrative meeting',
      2,
      'canceled',
      '2026-06-20T14:39:00.000Z'
    )
  ON CONFLICT (id) DO NOTHING
`;
